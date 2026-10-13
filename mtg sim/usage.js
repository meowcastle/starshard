// What the model costs, per person. Every Anthropic call records its token counts
// (from the API's own `usage` field) and a cost worked out from the price table, as
// one JSON line in data/usage.jsonl. Who to bill is carried by AsyncLocalStorage:
// a request or job wraps its work in `as({ who, kind }, fn)`, and every model call
// made inside it, however deep, is filed under that person.
const fs = require('fs');
const config = require('./config');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');

const FILE = () => path.join(config.DATA_DIR, 'usage.jsonl');
const als = new AsyncLocalStorage();
const as = (ctx, fn) => als.run({ ...(als.getStore() || {}), ...ctx }, fn);

// $ per million tokens. Third-party listings, Oct 2026; PRICE_IN / PRICE_OUT /
// PRICE_CACHE_WRITE / PRICE_CACHE_READ in .env override them when Anthropic's own
// pricing page says otherwise.
const PRICES = { 'claude-opus-5-5': { in: 4, out: 20, cw: 5, cr: 0.2 } };
const env = (k, d) => config[k] ?? d;
const priceOf = model => { const p = PRICES[model] || PRICES['claude-opus-5-5']; return { in: env('PRICE_IN', p.in), out: env('PRICE_OUT', p.out), cw: env('PRICE_CACHE_WRITE', p.cw), cr: env('PRICE_CACHE_READ', p.cr) }; };
const costOf = (model, u) => { const p = priceOf(model); return ((u.input_tokens || 0) * p.in + (u.output_tokens || 0) * p.out + (u.cache_creation_input_tokens || 0) * p.cw + (u.cache_read_input_tokens || 0) * p.cr) / 1e6; };

let rows = null;
const load = () => {
  if (rows) return rows;
  rows = [];
  try { for (const l of fs.readFileSync(FILE(), 'utf8').split('\n')) if (l) try { rows.push(JSON.parse(l)); } catch {} } catch {}
  return rows;
};

// one model call; `u` is the API response's usage object
function record(model, u, extra = {}) {
  const ctx = als.getStore() || {};
  const r = { at: Date.now(), who: ctx.who || 'unattributed', kind: ctx.kind || 'other', model, in: u?.input_tokens || 0, out: u?.output_tokens || 0,
    cw: u?.cache_creation_input_tokens || 0, cr: u?.cache_read_input_tokens || 0, cost: +costOf(model, u || {}).toFixed(6), ...(ctx.brew ? { brew: ctx.brew } : {}), ...extra };
  load().push(r);
  try { fs.appendFileSync(FILE(), JSON.stringify(r) + '\n'); } catch (e) { console.error('usage:', e.message); }
}

// a run started or a question asked: free in itself, but what the daily limits count
// (kept here rather than read off the brews, so deleting a deck doesn't reset them)
function mark(who, kind) {
  const r = { at: Date.now(), who, kind, event: true, cost: 0 };
  load().push(r);
  try { fs.appendFileSync(FILE(), JSON.stringify(r) + '\n'); } catch (e) { console.error('usage:', e.message); }
}
const events = (who, kind, ms) => load().filter(r => r.event && r.who === who && r.kind === kind && r.at >= Date.now() - ms).map(r => r.at);

const since = ms => load().filter(r => r.at >= Date.now() - ms);
const spent = (ms, who) => since(ms).filter(r => !r.event && (!who || r.who === who)).reduce((s, r) => s + r.cost, 0);

// per person: spend today / 7 days / 30 days / all time, and calls and spend by kind
function summary() {
  const D = 864e5, out = {};
  for (const r of load()) {
    const p = out[r.who] = out[r.who] || { who: r.who, d1: 0, d7: 0, d30: 0, all: 0, calls: 0, kinds: {}, runs7: 0, asks7: 0 };
    const age = Date.now() - r.at;
    if (r.event) { if (age < 7 * D) { if (r.kind === 'run') p.runs7++; if (r.kind === 'ask') p.asks7++; } continue; }
    p.all += r.cost; p.calls++; if (age < 30 * D) p.d30 += r.cost; if (age < 7 * D) p.d7 += r.cost; if (age < D) p.d1 += r.cost;
    const k = p.kinds[r.kind] = p.kinds[r.kind] || { calls: 0, cost: 0, in: 0, out: 0 }; k.calls++; k.cost += r.cost; k.in += r.in + r.cw + r.cr; k.out += r.out;
  }
  const people = Object.values(out).sort((a, b) => b.d30 - a.d30 || b.all - a.all);
  const total = people.reduce((t, p) => ({ d1: t.d1 + p.d1, d7: t.d7 + p.d7, d30: t.d30 + p.d30, all: t.all + p.all, calls: t.calls + p.calls }), { d1: 0, d7: 0, d30: 0, all: 0, calls: 0 });
  return { people, total, recent: load().filter(r => !r.event).slice(-40).reverse(), prices: priceOf('claude-opus-5-5') };
}

module.exports = { as, record, mark, events, spent, summary, costOf };
