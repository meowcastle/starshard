// One call to the Messages API that returns a structured answer through a tool.
// Opus 5.5 refuses a forced tool_choice ("tool"/"any" answer 400), so the tool is
// offered with `auto` and the prompt asks for it; a JSON object in a text answer is
// accepted as a fallback.
const MODEL = process.env.COACH_MODEL || 'claude-opus-5-5';
const available = () => !!process.env.ANTHROPIC_API_KEY;

async function ask({ system, prompt, tool, maxTokens = 8000 }) {
  if (!available()) throw new Error('no ANTHROPIC_API_KEY');
  const r = await fetch((process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens, system,
      messages: [{ role: 'user', content: prompt + `\n\nAnswer by calling ${tool.name}.` }],
      tools: [{ name: tool.name, description: tool.description, input_schema: tool.schema }],
      tool_choice: { type: 'auto' },
    }),
  });
  if (!r.ok) throw new Error(`Anthropic answered ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const use = (j.content || []).find(c => c.type === 'tool_use');
  if (use) return use.input;
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n'), m = text.match(/\{[\s\S]*\}/);
  try { return JSON.parse(m[0]); } catch { throw new Error('no answer in the expected shape'); }
}

module.exports = { ask, available, MODEL };
