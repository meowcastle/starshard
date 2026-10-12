// Does a change to how Forge plays make its results closer to real tournaments?
//
// Plays every meta pairing that has real results (from a calibration.json) under one
// variant of the AI setup, game 1 only, and scores the variant with calib.fidelity:
// k = how much of Forge's matchup edge carries over to real play (1 = as is, 0 = none),
// plus the log-likelihood per real game against a coin flip. Run the baseline and each
// variant under the same conditions and compare. Results are saved after every pairing,
// so a stopped run picks up where it left off.
//
//   FORGE_DIR=~/forge-worker/forge DATA_DIR=~/forge-worker/data USE_XVFB=0 \
//   node tools/fidelity-exp.js <calibration.json> <variant> <out dir> [games=40] [at once=4]
//
// Variants: base (Forge's Default profile for every deck, as production plays today);
// profiles (control decks get forge-ai/Control.ai, aggro decks Reckless, the rest Default).
const fs = require('fs');
const path = require('path');
const { runSim } = require('../forge');
const meta = require('../meta');
const calib = require('../calib');

const [CAL, VARIANT, OUT, G = '40', PAR = '4'] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard;
const lists = new Map(c.lists.map(l => [l.name, l]));
const pairs = Object.entries(c.inputs.real).filter(([k, r]) => r[0] + r[1] >= 6 && k.split('\u0000').every(n => lists.has(n)));
fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, VARIANT + '.json');
const done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

// control: the sim's own control test; aggro: cheap and creature-heavy
async function styles() {
  const names = [...new Set([...lists.values()].flatMap(l => l.main.map(x => x.name)))];
  const find = await meta.cards(names), out = {};
  for (const l of lists.values()) {
    let spells = 0, creatures = 0, mv = 0, counters = 0, instants = 0;
    for (const x of l.main) {
      const k = find(x.name); if (!k || meta.isLand(k)) continue;
      const type = (k.card_faces?.[0] || k).type_line || k.type_line || '', text = [k.oracle_text, ...(k.card_faces || []).map(f => f.oracle_text)].filter(Boolean).join('\n');
      spells += x.qty; mv += x.qty * (k.cmc || 0);
      if (/\bCreature\b/.test(type)) creatures += x.qty;
      if (/counter target (?:\w+ )*spell/i.test(text)) counters += x.qty;
      if (/\bInstant\b/.test(type) || /\bFlash\b/.test(text)) instants += x.qty;
    }
    out[l.name] = /control/i.test(l.name) || counters >= 6 || (creatures <= 8 && instants >= spells / 2) ? 'control' : mv / Math.max(1, spells) <= 2.5 && creatures >= 14 ? 'aggro' : 'midrange';
  }
  return out;
}
const PROFILE = { base: () => null, profiles: s => ({ control: 'Control', aggro: 'Reckless', midrange: 'Default' })[s] };

(async () => {
  const st = await styles();
  log(`variant ${VARIANT}: ${pairs.length} pairings, ${G} games each`);
  log('styles: ' + Object.entries(st).map(([n, s]) => `${n} ${s}`).join(', '));
  const todo = pairs.filter(([k]) => !done[k]);
  let i = 0;
  const slot = async () => {
    for (;;) {
      const p = todo[i++]; if (!p) return;
      const [k] = p, [a, b] = k.split('\u0000');
      const decks = [a, b].map(n => ({ name: n, main: lists.get(n).main, profile: PROFILE[VARIANT](st[n]) }));
      const run = runSim({ decks, games: +G, format: 'Constructed', clock: 120, workDir: path.join(OUT, 'work', VARIANT, String(pairs.indexOf(p))) });
      await run.done;
      const r = run.results;
      done[k] = { wins: r.wins, draws: r.draws, games: r.games.map(g => ({ winner: g.winner, first: g.first })) };
      fs.writeFileSync(file, JSON.stringify(done));
      log(`${Object.keys(done).length}/${pairs.length} ${a} ${r.wins[0]}-${r.wins[1]} ${b}`);
    }
  };
  await Promise.all(Array.from({ length: +PAR }, slot));
  // score it: Forge's rate balanced over who went first, as the calibration fit does
  const forge = {};
  for (const [k, v] of Object.entries(done)) {
    const t = { P: [0, 0], D: [0, 0] };
    for (const g of v.games) if (g.winner === 0 || g.winner === 1) { const s = g.first === 0 ? 'P' : g.first === 1 ? 'D' : null; if (s) { t[s][1]++; if (g.winner === 0) t[s][0]++; } }
    const n = v.wins[0] + v.wins[1], r = (w, m) => (w + 0.5) / (m + 1);
    const w0 = t.P[1] >= 3 && t.D[1] >= 3 ? n * (r(t.P[0], t.P[1]) + r(t.D[0], t.D[1])) / 2 : v.wins[0];
    forge[k] = [w0, n - w0];
  }
  const f = calib.fidelity(forge, c.inputs.real); if (!f) return log(`${VARIANT}: too few pairings to score`);
  let ll = 0, l0 = 0, N = 0;
  for (const [k, fw] of Object.entries(forge)) { const r = c.inputs.real[k], p = (fw[0] + 0.5) / (fw[0] + fw[1] + 1); ll += r[0] * Math.log(p) + r[1] * Math.log(1 - p); l0 += (r[0] + r[1]) * Math.log(0.5); N += r[0] + r[1]; }
  log(`${VARIANT}: k ${f.k.toFixed(2)} (likely ${f.lo.toFixed(2)} to ${f.hi.toFixed(2)}), ${f.pairs} pairings, ${f.realGames} real games; Forge as is vs a coin flip ${((ll - l0) / N * 1000).toFixed(1)} per 1000 games of log-likelihood`);
})().catch(e => { console.error(e); process.exit(1); });
