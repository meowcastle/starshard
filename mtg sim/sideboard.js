// Sideboard plans for games 2 and 3. Forge's AI never sideboards, so post-board
// games play lists that were boarded before Forge saw them. One model call writes
// both sides' plans for a pairing; every plan is checked against the lists (a card
// comes in only from that deck's sideboard, goes out only from its main deck, and
// the deck stays the same size) and cached on disk by the two lists, so a pairing
// is planned once no matter how many runs play it.
const fs = require('fs');
const config = require('./config');
const { writeJson, readJson } = require('./store');
const path = require('path');
const crypto = require('crypto');
const usage = require('./usage');

const MODEL = config.COACH_MODEL;
const FILE = () => path.join(config.DATA_DIR, 'plans.json');
let plans = null;
const load = () => { if (!plans) { plans = readJson(FILE(), {}); } return plans; };
const save = () => writeJson(FILE(), plans);

const canon = d => ['main', 'side'].map(s => (d[s] || []).map(c => c.qty + ' ' + c.name).sort().join('|')).join('#');
const keyOf = (a, b) => crypto.createHash('sha1').update(canon(a) + '\n' + canon(b)).digest('hex').slice(0, 16);
const available = () => !!config.ANTHROPIC_API_KEY;

const listText = d => '[main]\n' + d.main.map(c => `${c.qty} ${c.name}`).join('\n') + '\n[sideboard]\n' + ((d.side || []).map(c => `${c.qty} ${c.name}`).join('\n') || '(none)');
const SIDE_SCHEMA = { type: 'object', properties: {
  in: { type: 'array', items: { type: 'object', properties: { qty: { type: 'integer' }, name: { type: 'string' } }, required: ['qty', 'name'] } },
  out: { type: 'array', items: { type: 'object', properties: { qty: { type: 'integer' }, name: { type: 'string' } }, required: ['qty', 'name'] } },
  why: { type: 'string', description: 'One sentence, plain words.' },
}, required: ['in', 'out', 'why'] };

async function ask(a, b, format, hints = {}) {
  const hint = [hints.a && 'Deck A: ' + hints.a, hints.b && 'Deck B: ' + hints.b].filter(Boolean).join('\n');
  const r = await fetch(config.ANTHROPIC_BASE_URL + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': config.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 8000, // the model thinks first (~1.3k tokens on a test pairing); leave room for the plan after it
      system: 'You are a strong competitive Magic: The Gathering player. You write the sideboard plan a skilled player would actually use for games 2 and 3 of a best-of-three match. Board only what improves the matchup; boarding nothing is a valid plan. Swap card for card so each main deck keeps its size, bring cards in only from that deck\'s own sideboard, and take cards out only from that deck\'s own main deck. Use exact card names from the lists.',
      messages: [{ role: 'user', content: `Format: ${format}.\n\nDeck A, "${a.name}":\n${listText(a)}\n\nDeck B, "${b.name}":\n${listText(b)}${hint ? `\n\nWhat real players of these archetypes bring (whole sideboards, not per matchup; use it to judge which of each list's own sideboard cards real pilots value, not as cards to add):\n${hint}` : ''}\n\nWrite both decks' plans for this matchup by calling sideboard_plans.` }],
      tools: [{ name: 'sideboard_plans', description: 'Both decks\' sideboard plans for games 2 and 3.', input_schema: { type: 'object', properties: { a: SIDE_SCHEMA, b: SIDE_SCHEMA }, required: ['a', 'b'] } }],
      tool_choice: { type: 'auto' }, // this model refuses a forced tool ("tool"/"any"), so the prompt asks for it
    }),
  });
  if (!r.ok) throw new Error(`Anthropic answered ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  usage.record(j.model || MODEL, j.usage);
  const use = (j.content || []).find(c => c.type === 'tool_use');
  if (use) return use.input;
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n'), m = text.match(/\{[\s\S]*\}/);
  try { const o = JSON.parse(m[0]); if (o.a && o.b) return o; } catch {}
  throw new Error('no plan in the answer');
}

// Clamp a plan to what the lists allow, then even out the swap so the deck keeps its size.
function legal(deck, plan) {
  const count = (l) => { const m = new Map(); (l || []).forEach(c => m.set(c.name.toLowerCase(), { name: c.name, qty: (m.get(c.name.toLowerCase())?.qty || 0) + c.qty })); return m; };
  const side = count(deck.side), main = count(deck.main);
  const take = (want, pool) => { const out = []; for (const c of want || []) { const k = String(c.name).toLowerCase(), have = pool.get(k); if (!have) continue; const q = Math.min(Math.max(0, c.qty | 0), have.qty); if (q) { out.push({ qty: q, name: have.name }); have.qty -= q; } } return out; };
  let ins = take(plan?.in, side), outs = take(plan?.out, main);
  const total = l => l.reduce((s, c) => s + c.qty, 0);
  const trim = (l, n) => { const o = []; for (const c of l) { if (n <= 0) break; const q = Math.min(c.qty, n); o.push({ qty: q, name: c.name }); n -= q; } return o; };
  const n = Math.min(total(ins), total(outs));
  return { in: trim(ins, n), out: trim(outs, n), why: String(plan?.why || '').slice(0, 300) };
}

// A deck after its plan: the main deck with the swap made, the sideboard the other way round.
function apply(deck, plan) {
  if (!plan || !plan.in.length) return deck;
  const sub = (l, rm) => { const m = new Map(l.map(c => [c.name, c.qty])); rm.forEach(c => m.set(c.name, (m.get(c.name) || 0) - c.qty)); return [...m].filter(([, q]) => q > 0).map(([name, qty]) => ({ qty, name })); };
  const add = (l, more) => { const m = new Map(l.map(c => [c.name, c.qty])); more.forEach(c => m.set(c.name, (m.get(c.name) || 0) + c.qty)); return [...m].map(([name, qty]) => ({ qty, name })); };
  return { ...deck, main: add(sub(deck.main, plan.out), plan.in), side: add(sub(deck.side || [], plan.in), plan.out) };
}

// Both sides' plans for one pairing; cached. Throws when no model is configured.
async function planFor(a, b, format, hints) {
  load();
  const k = keyOf(a, b), rk = keyOf(b, a);
  if (plans[k]) return plans[k];
  if (plans[rk]) return { a: plans[rk].b, b: plans[rk].a, by: plans[rk].by };
  if (!available()) throw new Error('no ANTHROPIC_API_KEY');
  const raw = await ask(a, b, format, hints);
  const p = { a: legal(a, raw.a), b: legal(b, raw.b), by: MODEL, at: Date.now(), hinted: !!(hints && (hints.a || hints.b)) };
  plans[k] = p; save();
  return p;
}

// a cached plan for a pairing, without asking for one (the audit reads these)
function peek(a, b) { load(); const k = keyOf(a, b), rk = keyOf(b, a); return plans[k] ? plans[k] : plans[rk] ? { a: plans[rk].b, b: plans[rk].a, by: plans[rk].by, hinted: plans[rk].hinted } : null; }

module.exports = { planFor, peek, apply, legal, available, MODEL };
