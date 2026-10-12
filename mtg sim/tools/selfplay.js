// Does a change make Forge's AI play better? Self-play strength on fixed seeds, the way
// Forge's own developers judge AI changes, and a measure that needs no real data.
//
// Each deck plays itself: the changed AI in one seat, stock Forge in the other, the
// seats swapped for the second half (deck order decides who plays first in game 1), and
// every half on a fixed seed so a rerun replays the same shuffles. A mirror cancels out
// deck strength, so the changed AI's win rate is its skill edge; 50% means no better.
//
//   FORGE_DIR=<patched Forge, tools/build-forge-patch.sh> DATA_DIR=... USE_XVFB=0 \
//   node tools/selfplay.js <calibration.json> <variant> <out dir> [games per deck=40] [at once=4] [decks=12]
//
// Variants: hybrid (Forge's hybrid look-ahead), full (full look-ahead), profiles (the
// deck's style profile, as in tools/fidelity-exp.js: Control for control, Reckless for aggro).
const fs = require('fs');
const path = require('path');
const { runSim } = require('../forge');
const meta = require('../meta');

const [CAL, VARIANT, OUT, G = '40', PAR = '4', NDECKS = '12'] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(CAL, 'utf8')).standard;
const lists = c.lists.slice(0, +NDECKS);
fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, 'selfplay-' + VARIANT + '.json');
const done = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const seedOf = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 2147483647; };

async function styles() {
  const find = await meta.cards([...new Set(lists.flatMap(l => l.main.map(x => x.name)))]), out = {};
  for (const l of lists) {
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

// one half: the changed AI in seat `at` (0 or 1)
function half(l, at, st) {
  const look = VARIANT === 'hybrid' || VARIANT === 'full', prof = VARIANT === 'profiles' ? ({ control: 'Control', aggro: 'Reckless', midrange: 'Default' })[st] : null;
  const seat = k => ({ name: l.name + (k === at ? ' A' : ' B'), main: l.main, profile: k === at && prof ? prof : prof ? 'Default' : null });
  process.env.FORGE_JAVA_OPTS = look ? '-Dsim.ai=' + (at === 0 ? VARIANT + ',none' : 'none,' + VARIANT) : '';
  const run = runSim({ decks: [seat(0), seat(1)], games: +G / 2, format: 'Constructed', clock: 300, seed: seedOf(l.name + ':' + at), workDir: path.join(OUT, 'work', VARIANT, seedOf(l.name) + '-' + at) });
  return run.done.then(() => {
    const gs = run.results.games;
    return { won: run.results.wins[at], lost: run.results.wins[1 - at], draws: run.results.draws, ms: gs.reduce((s, g) => s + g.ms, 0) };
  });
}

(async () => {
  const st = VARIANT === 'profiles' ? await styles() : {};
  const todo = lists.flatMap(l => [0, 1].map(at => ({ l, at }))).filter(({ l, at }) => !(done[l.name] && done[l.name][at]));
  log(`self-play ${VARIANT}: ${lists.length} decks, ${G} games each, ${todo.length} halves to play`);
  let i = 0;
  const slot = async () => { for (;;) { const t = todo[i++]; if (!t) return; const r = await half(t.l, t.at, st[t.l.name]); (done[t.l.name] = done[t.l.name] || {})[t.at] = r; fs.writeFileSync(file, JSON.stringify(done)); log(`${t.l.name} (changed AI in seat ${t.at + 1}): ${r.won}-${r.lost}${r.draws ? ', ' + r.draws + ' draws' : ''}`); } };
  await Promise.all(Array.from({ length: +PAR }, slot));
  // per deck and overall; the overall range treats each deck as one unit, since games within a deck are alike
  let W = 0, N = 0, D = 0, ms = 0; const per = [];
  for (const l of lists) { const h = done[l.name]; if (!h || !h[0] || !h[1]) continue; const w = h[0].won + h[1].won, n = w + h[0].lost + h[1].lost; W += w; N += n; D += h[0].draws + h[1].draws; ms += h[0].ms + h[1].ms; per.push({ deck: l.name, rate: w / n, n }); log(`  ${l.name.padEnd(24)} ${w}/${n} = ${Math.round(w / n * 100)}%`); }
  const m = per.reduce((s, x) => s + x.rate, 0) / per.length, sd = Math.sqrt(per.reduce((s, x) => s + (x.rate - m) ** 2, 0) / Math.max(1, per.length - 1)), se = sd / Math.sqrt(per.length);
  log(`${VARIANT}: the changed AI wins ${Math.round(W / N * 100)}% of mirror games (${W}/${N}); by deck ${Math.round(m * 100)}%, likely ${Math.round((m - 1.96 * se) * 100)}-${Math.round((m + 1.96 * se) * 100)}%; ${D} draws; ${(ms / Math.max(1, N + D) / 1000).toFixed(1)} s a game`);
})().catch(e => { console.error(e); process.exit(1); });
