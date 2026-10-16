const config = require('./config');
// One call to the Messages API that returns a structured answer through a tool.
// Opus 5.5 refuses a forced tool_choice ("tool"/"any" answer 400), so the tool is
// offered with `auto` and the prompt asks for it; a JSON object in a text answer is
// accepted as a fallback.
const usage = require('./usage');
const MODEL = config.COACH_MODEL;
const available = () => !!config.ANTHROPIC_API_KEY;

async function ask({ system, prompt, tool, maxTokens = 8000 }) {
  if (!available()) throw new Error('no ANTHROPIC_API_KEY');
  const r = await fetch(config.ANTHROPIC_BASE_URL + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': config.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens, system,
      messages: [{ role: 'user', content: prompt + `\n\nAnswer by calling ${tool.name}.` }],
      tools: [{ name: tool.name, description: tool.description, input_schema: tool.schema }],
      tool_choice: { type: 'auto' },
    }),
  });
  if (!r.ok) throw new Error(`Anthropic answered ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  usage.record(j.model || MODEL, j.usage);
  const use = (j.content || []).find(c => c.type === 'tool_use');
  if (use) return use.input;
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n'), m = text.match(/\{[\s\S]*\}/);
  try { return JSON.parse(m[0]); } catch { throw new Error('no answer in the expected shape'); }
}

// A plain-text answer to a conversation: [{ role: 'user'|'assistant', content }].
// With `onText`, the answer streams: onText(textSoFar) is called as it is written,
// so the page can show it filling in instead of waiting for the whole thing.
async function chat({ system, messages, maxTokens = 8000, onText }) {
  if (!available()) throw new Error('no ANTHROPIC_API_KEY');
  const stream = typeof onText === 'function';
  const r = await fetch(config.ANTHROPIC_BASE_URL + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': config.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages, ...(stream ? { stream: true } : {}) }),
  });
  if (!r.ok) throw new Error(`Anthropic answered ${r.status}: ${(await r.text()).slice(0, 200)}`);
  if (!stream) {
    const j = await r.json();
    usage.record(j.model || MODEL, j.usage);
    const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    if (!text) throw new Error('empty answer');
    return text;
  }
  const { text, model, use } = await readStream(r, onText);
  usage.record(model || MODEL, use);
  if (!text.trim()) throw new Error('empty answer');
  return text.trim();
}

// A conversation in which the model may act (Justin, 16 Oct: "coach can do agent like work and update the deck").
// `tools` are offered with `auto`; each tool_use is handed to run(name, input), which does the work and returns
// a short text result the model reads before going on. Streams like chat(); returns the final text. At most
// `rounds` model calls, so a confused model can't loop.
async function agent({ system, messages, tools, run, maxTokens = 8000, onText, rounds = 5 }) {
  if (!available()) throw new Error('no ANTHROPIC_API_KEY');
  const msgs = [...messages]; let said = '';
  for (let k = 0; k < rounds; k++) {
    const r = await fetch(config.ANTHROPIC_BASE_URL + '/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: msgs, stream: true,
        tools: tools.map(t => ({ name: t.name, description: t.description, input_schema: t.schema })), tool_choice: { type: 'auto' } }),
    });
    if (!r.ok) throw new Error(`Anthropic answered ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const before = said ? said + '\n\n' : '';
    const { text, model, use, blocks, stop } = await readStream(r, t => onText && onText(before + t));
    usage.record(model || MODEL, use);
    if (text.trim()) said = before + text.trim();
    const calls = blocks.filter(b => b.type === 'tool_use');
    if (stop !== 'tool_use' || !calls.length) break;
    msgs.push({ role: 'assistant', content: blocks });
    const results = [];
    for (const c of calls) {
      let out; try { out = await run(c.name, c.input || {}); } catch (e) { out = 'Error: ' + e.message; }
      results.push({ type: 'tool_result', tool_use_id: c.id, content: String(out).slice(0, 4000) });
    }
    msgs.push({ role: 'user', content: results });
  }
  if (!said.trim()) throw new Error('empty answer');
  return said.trim();
}

// Server-sent events from the Messages API: text deltas build the answer; usage
// comes in two parts (input and cache on message_start, output on message_delta).
// The content blocks (text and tool_use, with the tool's input assembled from its
// JSON deltas) come back too, for agent().
async function readStream(r, onText) {
  const dec = new TextDecoder(); let buf = '', text = '', model = null, use = {}, lastSent = 0, stop = null;
  const blocks = [], json = {};
  const handle = (ev) => {
    if (ev.type === 'message_start') { model = ev.message?.model; Object.assign(use, ev.message?.usage || {}); }
    else if (ev.type === 'message_delta') { Object.assign(use, ev.usage || {}); if (ev.delta?.stop_reason) stop = ev.delta.stop_reason; }
    else if (ev.type === 'content_block_start') { blocks[ev.index] = { ...ev.content_block }; if (ev.content_block.type === 'tool_use') json[ev.index] = ''; }
    else if (ev.type === 'content_block_delta' && ev.delta?.type === 'input_json_delta') json[ev.index] += ev.delta.partial_json || '';
    // thinking goes back with its signature on the next round of a tool conversation, as the API requires
    else if (ev.type === 'content_block_delta' && ev.delta?.type === 'thinking_delta') blocks[ev.index].thinking = (blocks[ev.index].thinking || '') + ev.delta.thinking;
    else if (ev.type === 'content_block_delta' && ev.delta?.type === 'signature_delta') blocks[ev.index].signature = (blocks[ev.index].signature || '') + ev.delta.signature;
    else if (ev.type === 'content_block_stop' && json[ev.index] != null) { try { blocks[ev.index].input = json[ev.index] ? JSON.parse(json[ev.index]) : {}; } catch { blocks[ev.index].input = {}; } }
    else if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
      text += ev.delta.text; if (blocks[ev.index]) blocks[ev.index].text = (blocks[ev.index].text || '') + ev.delta.text;
      if (Date.now() - lastSent > 150) { lastSent = Date.now(); try { onText(text); } catch {} }
    } else if (ev.type === 'error') throw new Error('Anthropic stream: ' + (ev.error?.message || 'error'));
  };
  for await (const chunk of r.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, i); buf = buf.slice(i + 2);
      const data = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('');
      if (data) { let ev; try { ev = JSON.parse(data); } catch { continue; } handle(ev); }
    }
  }
  try { onText(text); } catch {}
  return { text, model, use, blocks: blocks.filter(Boolean).map(b => b.type === 'text' ? { type: 'text', text: b.text || '' } : b).filter(b => b.type !== 'text' || b.text.trim()), stop };   // an empty text block is refused when sent back
}

module.exports = { ask, chat, agent, available, MODEL };
