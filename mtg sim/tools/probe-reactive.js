// The reactive-pilot probe (12 Oct 2026): does piloting a control deck's instants ourselves
// move Forge's results toward real ones?
//
// For each deck named, every opponent it has real results against is played twice through
// the bridge, once with Forge deciding everything and once with pilot.js's reactive policy
// on the control seat, same lists, same seeds. Then each deck's win rate is set beside its
// real one, and k (calib.fidelity) is recomputed with those pairings replaced.
// A mirror per deck, reactive seat against stock, seats swapped, is the strength check.
//
//   FORGE_DIR=... DATA_DIR=... node tools/probe-reactive.js <calibration.json> <out dir> [matches=14] [at once=4] [deck,deck,...]
const fs = require('fs');
const path = require('path');
const { runMatches } = require('../pilot');
const calib = require('../calib');

const [CAL, OUT, M = '14', PAR = '4', DECKS = 'Azorius Control,4c Control'] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard;
const lists = new Map(c.lists.map(l => [l.name, l]));
const SEP = '\u0000';
fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, 'probe-reactive.json');
const done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const seedOf = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483647; };

const jobs = [];
for (const d of DECKS.split(',')) {
  for (const k of Object.keys(c.inputs.real)) {
    const [a, b] = k.split(SEP); if (a !== d && b !== d) continue;
    const o = a === d ? b : a; if (!lists.has(o) || !c.inputs.forge[k]) continue;
    for (const v of ['stock', 'reactive']) jobs.push({ id: `${d}|${o}|${v}`, deck: d, opp: o, v, key: k });
  }
  for (const at of [0, 1]) jobs.push({ id: `${d}|mirror|${at}`, deck: d, opp: d, v: 'mirror', at });
}
const todo = jobs.filter(j => !done[j.id]);
log(`${jobs.length} runs, ${todo.length} to play, ${M} best-of-threes each`);

async function play(j) {
  const mirror = j.v === 'mirror', seat = mirror ? j.at : 0;
  const decks = mirror ? [0, 1].map(i => ({ ...lists.get(j.deck), name: j.deck + (i === seat ? ' A' : ' B') })) : [lists.get(j.deck), lists.get(j.opp)];
  const policy = [null, null]; if (j.v === 'reactive' || mirror) policy[seat] = 'reactive';
  const own = policy.map(p => p ? ['priority'] : []);
  const r = await runMatches({ decks, matches: +M, seed: seedOf(j.deck + '|' + j.opp), own, policy, workDir: path.join(OUT, 'work', String(seedOf(j.id))) });
  const won = r.games.filter(g => g.winner === seat).length, lost = r.games.filter(g => g.winner === 1 - seat).length;
  return { won, lost, draws: r.games.length - won - lost, acted: r.acted || 0, ms: r.ms, errors: r.errors.slice(0, 2) };
}

(async () => {
  let i = 0;
  const slot = async () => { for (;;) { const j = todo[i++]; if (!j) return; done[j.id] = await play(j); fs.writeFileSync(file, JSON.stringify(done)); const x = done[j.id]; log(`${j.id}: ${x.won}-${x.lost}${x.draws ? '-' + x.draws : ''}, pilot acted ${x.acted}${x.errors.length ? ', ERROR ' + x.errors[0].slice(0, 100) : ''}`); } };
  await Promise.all(Array.from({ length: +PAR }, slot));

  const pct = (w, n) => n ? Math.round(100 * w / n) + '%' : '-';
  const forgeAll = { ...c.inputs.forge }, forgeR = { ...c.inputs.forge };
  for (const d of DECKS.split(',')) {
    const t = { stock: [0, 0], reactive: [0, 0], real: [0, 0], oldForge: [0, 0] };
    for (const j of jobs.filter(j => j.deck === d && j.v !== 'mirror')) {
      const x = done[j.id]; if (!x) continue;
      t[j.v][0] += x.won; t[j.v][1] += x.won + x.lost;
      const [a] = j.key.split(SEP), flip = a !== d;
      if (j.v === 'stock') { const r = c.inputs.real[j.key], f = c.inputs.forge[j.key]; t.real[0] += flip ? r[1] : r[0]; t.real[1] += r[0] + r[1]; t.oldForge[0] += flip ? f[1] : f[0]; t.oldForge[1] += f[0] + f[1]; forgeAll[j.key] = flip ? [x.lost, x.won] : [x.won, x.lost]; }
      else forgeR[j.key] = flip ? [x.lost, x.won] : [x.won, x.lost];
    }
    const m = [0, 1].map(at => done[`${d}|mirror|${at}`]).filter(Boolean), mw = m.reduce((s, x) => s + x.won, 0), mn = m.reduce((s, x) => s + x.won + x.lost, 0);
    log(`${d}: real ${pct(...t.real)} | forge sim (calibration) ${pct(...t.oldForge)} | bridge, Forge decides ${pct(...t.stock)} (${t.stock[1]} games) | reactive pilot ${pct(...t.reactive)} (${t.reactive[1]} games) | mirror, pilot vs stock ${pct(mw, mn)} of ${mn}`);
  }
  // k with these pairings replayed through the bridge (stock), then with the pilot
  const f0 = calib.fidelity(forgeAll, c.inputs.real), f1 = calib.fidelity(forgeR, c.inputs.real);
  const fmt = f => f ? `${f.k.toFixed(2)} (${f.lo.toFixed(2)} to ${f.hi.toFixed(2)}), ${f.pairs} pairings` : '-';
  log(`k, Forge deciding: ${fmt(f0)}`);
  log(`k, reactive pilot on the control decks: ${fmt(f1)}`);
})().catch(e => { console.error(e); process.exit(1); });
