// Phase 2's gate: a deck gets a pilot policy only if the policy beats stock Forge in the
// deck's own mirror (same lists, seats swapped, fixed seeds). 50% = no better; the gate is
// 55%+. Writes { deck: { policy: { won, lost, rate, lo, hi, pass } } } and resumes.
//
//   FORGE_DIR=... DATA_DIR=... node tools/mirror-gate.js <calibration.json> <out.json> [policy=reactive] [matches per half=14] [at once=4] [deck,deck,...]
// policy "search": the bridge's play-out search (Search.java) on the seat's main-phase plays.
// policy "nochump": Forge's blocks less the chump blocks it didn't need (pruneChumps in the bridge).
const fs = require('fs');
const path = require('path');
const { runMatches } = require('../pilot');

const [CAL, OUT, POLICY = 'reactive', M = '14', PAR = '4', ONLY = ''] = process.argv.slice(2);
const lists = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard.lists.filter(l => !ONLY || ONLY.split(',').includes(l.name));
const SEARCH = POLICY === 'search' ? { rollouts: +(process.env.SEARCH_ROLLOUTS || 8), turns: +(process.env.SEARCH_TURNS || 1), max: +(process.env.SEARCH_MAX || 5), margin: +(process.env.SEARCH_MARGIN || 2), screen: +(process.env.SEARCH_SCREEN ?? 50) } : null;
const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const seedOf = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483647; };
const halves = lists.flatMap(l => [0, 1].map(at => ({ l, at }))).filter(({ l, at }) => !(done[l.name] && done[l.name][POLICY] && done[l.name][POLICY]['h' + at]));
log(`${POLICY}: ${lists.length} decks, ${halves.length} halves to play`);
let i = 0;
const slot = async () => {
  for (;;) {
    const t = halves[i++]; if (!t) return;
    // search and nochump live in the bridge (Search.java, pruneChumps); the rest are pilot.js priority policies
    const BRIDGE = { search: ['search'], nochump: ['nochump'] };
    const policy = [null, null]; if (!BRIDGE[POLICY]) policy[t.at] = POLICY;
    const own = [[], []]; own[t.at] = BRIDGE[POLICY] || ['priority'];
    const r = await runMatches({ decks: [0, 1].map(k => ({ ...t.l, name: t.l.name + (k === t.at ? ' A' : ' B') })), matches: +M, seed: seedOf(t.l.name), own, policy, search: SEARCH, workDir: path.join(path.dirname(OUT), 'gate', String(seedOf(t.l.name + t.at))) });
    const d = ((done[t.l.name] = done[t.l.name] || {})[POLICY] = done[t.l.name][POLICY] || {});
    d['h' + t.at] = { won: r.games.filter(g => g.winner === t.at).length, lost: r.games.filter(g => g.winner === 1 - t.at).length, acted: r.acted || 0 };
    if (d.h0 && d.h1) {
      const w = d.h0.won + d.h1.won, n = w + d.h0.lost + d.h1.lost, p = w / n, se = Math.sqrt(p * (1 - p) / n);
      Object.assign(d, { won: w, lost: n - w, rate: p, lo: p - 1.96 * se, hi: p + 1.96 * se, acted: d.h0.acted + d.h1.acted, pass: p >= 0.55 && p - 1.96 * se > 0.5 });
      log(`${t.l.name.padEnd(24)} ${Math.round(p * 100)}% of ${n} (${Math.round((p - 1.96 * se) * 100)}-${Math.round((p + 1.96 * se) * 100)}%), pilot acted ${d.acted}${d.pass ? '  PASS' : ''}`);
    }
    fs.writeFileSync(OUT, JSON.stringify(done, null, 1));
  }
};
Promise.all(Array.from({ length: +PAR }, slot)).then(() => {
  const rows = lists.map(l => done[l.name] && done[l.name][POLICY]).filter(d => d && d.rate != null);
  log(`${rows.filter(d => d.pass).length} of ${rows.length} decks pass the gate with ${POLICY}`);
}).catch(e => { console.error(e); process.exit(1); });
