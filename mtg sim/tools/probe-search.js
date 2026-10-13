// The search fidelity probe (13 Oct 2026): does a stronger pilot on BOTH seats move Forge's
// results toward real ones? (RESEARCH-PILOT-QUESTIONS-12OCT.md, the fidelity test.)
//
// Replays every pairing the reactive probe played (tools/probe-reactive.js, same lists, same
// seeds, same match count) with the bridge's play-out search on both seats, then sets each
// deck's win rate beside the real one and the probe's stock and reactive runs, and recomputes
// k (calib.fidelity) three ways. Search settings come from the bridge defaults unless the
// SEARCH_* variables are set.
//
//   FORGE_DIR=... DATA_DIR=... node tools/probe-search.js <calibration.json> <reactive probe dir> <out dir> [at once=4]
const fs = require('fs');
const path = require('path');
const { runMatches } = require('../pilot');
const calib = require('../calib');

const [CAL, PROBE, OUT, PAR = '4'] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard;
const lists = new Map(c.lists.map(l => [l.name, l]));
const SEP = '\u0000';
const probe = JSON.parse(fs.readFileSync(path.join(PROBE, 'probe-reactive.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, 'probe-search.json');
const done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const seedOf = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483647; };
const env = (k, d) => process.env[k] === undefined ? d : +process.env[k];
const SEARCH = { rollouts: env('SEARCH_ROLLOUTS', 8), turns: env('SEARCH_TURNS', 1), max: env('SEARCH_MAX', 5), margin: env('SEARCH_MARGIN', 2), screen: env('SEARCH_SCREEN', 50), ...(process.env.SEARCH_EVAL ? { eval: path.resolve(process.env.SEARCH_EVAL) } : {}) };
const M = +(process.env.MATCHES || 14);

const pairs = Object.keys(probe).filter(id => id.endsWith('|stock')).map(id => {
  const [deck, opp] = id.split('|');
  const key = Object.keys(c.inputs.real).find(k => { const [a, b] = k.split(SEP); return (a === deck && b === opp) || (a === opp && b === deck); });
  return { id: `${deck}|${opp}|search`, deck, opp, key };
}).filter(j => j.key);
const todo = pairs.filter(j => !done[j.id]);
log(`${pairs.length} pairings, ${todo.length} to play, ${M} best-of-threes each, search ${JSON.stringify(SEARCH)} on both seats`);

async function play(j) {
  const r = await runMatches({ decks: [lists.get(j.deck), lists.get(j.opp)], matches: M, seed: seedOf(j.deck + '|' + j.opp), own: [['search'], ['search']], policy: [null, null], search: SEARCH, workDir: path.join(OUT, 'work', String(seedOf(j.id))) });
  const won = r.games.filter(g => g.winner === 0).length, lost = r.games.filter(g => g.winner === 1).length;
  return { won, lost, draws: r.games.length - won - lost, ms: r.ms, errors: r.errors.slice(0, 2) };
}

(async () => {
  let i = 0;
  const t0 = Date.now();
  const slot = async () => { for (;;) { const j = todo[i++]; if (!j) return; done[j.id] = await play(j); fs.writeFileSync(file, JSON.stringify(done)); const x = done[j.id]; log(`${j.id}: ${x.won}-${x.lost}${x.draws ? '-' + x.draws : ''}${x.errors.length ? ', ERROR ' + x.errors[0].slice(0, 100) : ''}`); } };
  await Promise.all(Array.from({ length: +PAR }, slot));
  if (todo.length) log(`played in ${Math.round((Date.now() - t0) / 60000)} min`);

  const pct = (w, n) => n ? Math.round(100 * w / n) + '%' : '-';
  const as = (k, deck, x) => k.split(SEP)[0] === deck ? [x.won, x.lost] : [x.lost, x.won];
  const fStock = { ...c.inputs.forge }, fReact = { ...c.inputs.forge }, fSearch = { ...c.inputs.forge };
  const t = {};
  for (const j of pairs) {
    const s = probe[`${j.deck}|${j.opp}|stock`], r = probe[`${j.deck}|${j.opp}|reactive`], x = done[j.id];
    fStock[j.key] = as(j.key, j.deck, s); if (r) fReact[j.key] = as(j.key, j.deck, r);
    const d = t[j.deck] = t[j.deck] || { real: [0, 0], stock: [0, 0], reactive: [0, 0], search: [0, 0] };
    const real = c.inputs.real[j.key], flip = j.key.split(SEP)[0] !== j.deck;
    d.real[0] += flip ? real[1] : real[0]; d.real[1] += real[0] + real[1];
    d.stock[0] += s.won; d.stock[1] += s.won + s.lost;
    if (r) { d.reactive[0] += r.won; d.reactive[1] += r.won + r.lost; }
    if (x) { fSearch[j.key] = as(j.key, j.deck, x); d.search[0] += x.won; d.search[1] += x.won + x.lost; }
  }
  for (const [deck, d] of Object.entries(t)) log(`${deck}: real ${pct(...d.real)} | Forge decides ${pct(...d.stock)} | reactive pilot ${pct(...d.reactive)} | search both seats ${pct(...d.search)} (${d.search[1]} games)`);
  const fmt = f => f ? `${f.k.toFixed(2)} (${f.lo.toFixed(2)} to ${f.hi.toFixed(2)}), ${f.pairs} pairings` : '-';
  log(`k, Forge deciding: ${fmt(calib.fidelity(fStock, c.inputs.real))}`);
  log(`k, reactive pilot on the control decks: ${fmt(calib.fidelity(fReact, c.inputs.real))}`);
  log(`k, search on both seats: ${fmt(calib.fidelity(fSearch, c.inputs.real))}`);
})().catch(e => { console.error(e); process.exit(1); });
