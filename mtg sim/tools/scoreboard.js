// The engine scoreboard (research's method review, 14 Oct 2026): how close a batch's results are to real
// play, on the measures the ship bar is judged by, with the game count beside every number.
//
//   node tools/scoreboard.js <calibration.json> <batch dir> [batch dir ...] [--json out.json]
//
// Batches are pooled pairing by pairing (log-batch.js output: batch.json, games won and lost). The real side is
// the calibration file's per-pairing match records. See calib.scoreboard for the two corrections (best-of-three
// scale, and the sim's sampling noise) and the per-deck comparison.
const fs = require('fs');
const path = require('path');
const calib = require('../calib');

const args = process.argv.slice(2);
const take = f => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : null; };
const JSON_OUT = take('--json');
const [CAL, ...DIRS] = args;
if (!CAL || !DIRS.length) { console.error('usage: node tools/scoreboard.js <calibration.json> <batch dir> [...] [--json out.json]'); process.exit(1); }
let c = JSON.parse(fs.readFileSync(CAL, 'utf8')); if (c.standard) c = c.standard;

const forge = {};
for (const d of DIRS) for (const [key, x] of Object.entries(JSON.parse(fs.readFileSync(path.join(d, 'batch.json'), 'utf8')))) {
  const [a, b] = key.split('|'), k = calib.pairKey(a, b), flip = k.startsWith(b + '\u0000') && a !== b;
  const f = forge[k] = forge[k] || [0, 0];
  f[0] += flip ? x.lost : x.won; f[1] += flip ? x.won : x.lost;
}
const s = calib.scoreboard(forge, c.inputs.real);
if (!s) { console.log('fewer than 5 pairings with both real and sim results'); process.exit(0); }
const pc = x => (100 * x).toFixed(0) + '%', f2 = x => x.toFixed(2);
const top = s.decks.filter(d => d.pairs >= 3);
const mae = top.reduce((a, d) => a + Math.abs(d.err), 0) / top.length, floor = top.reduce((a, d) => a + d.floor, 0) / top.length;
console.log(`${s.pairs} pairings with real and sim results · ${s.realMatches} real matches · median ${s.simGamesPerPair} sim games a pairing`);
console.log(`k (best-of-three scale): ${f2(s.k)} (${f2(s.lo)} to ${f2(s.hi)})`);
console.log(`k corrected for the sim's noise: ${f2(s.kCorrected)} (${f2(s.loCorrected)} to ${f2(s.hiCorrected)}) · reliability ${f2(s.reliability)}`);
// spread: how much wider the sim spreads the decks than real play (each side's sampling variance subtracted)
const sd = (xs, vs) => { const m = xs.reduce((a, x) => a + x, 0) / xs.length, v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1), noise = vs.reduce((a, x) => a + x, 0) / vs.length; return Math.sqrt(Math.max(1e-6, v - noise)); };
const realSd = sd(top.map(d => d.real), top.map(d => d.real * (1 - d.real) / d.matches)), simSd = sd(top.map(d => d.sim), top.map(() => 0));
const rawSd = xs => { const m = xs.reduce((a, x) => a + x, 0) / xs.length; return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)); };
const realObs = rawSd(top.map(d => d.real)), realNoise = Math.sqrt(top.reduce((a, d) => a + d.real * (1 - d.real) / d.matches, 0) / top.length);
const realFlat = realObs <= realNoise * 1.1;   // the real deck rates differ no more than sampling alone would make them
// order: Spearman rank correlation of sim against real deck rates, with a bootstrap over decks
const rank = xs => { const o = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = []; o.forEach(([, i], j) => { r[i] = j + 1; }); return r; };
const spearman = rows => { const a = rank(rows.map(d => d.real)), b = rank(rows.map(d => d.sim)), n = rows.length; return 1 - 6 * a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0) / (n * (n * n - 1)); };
const rho = spearman(top);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const boots = []; for (let i = 0; i < 2000; i++) { const s2 = Array.from(top, () => top[Math.floor(rnd() * top.length)]); if (new Set(s2.map(d => d.deck)).size > 3) boots.push(spearman(s2)); }
boots.sort((a, b) => a - b); const rlo = boots[Math.floor(0.025 * boots.length)], rhi = boots[Math.floor(0.975 * boots.length)];
const rr = rank(top.map(d => d.real)), rs = rank(top.map(d => d.sim)); top.forEach((d, i) => { d.rankReal = top.length + 1 - rr[i]; d.rankSim = top.length + 1 - rs[i]; });
console.log(realFlat
  ? `spread: real play's deck rates differ no more than sampling noise would make them (sd ${(100 * realObs).toFixed(1)} points observed, ${(100 * realNoise).toFixed(1)} from noise alone), so the real spread is indistinguishable from zero; the sim's is ${(100 * simSd).toFixed(1)}`
  : `spread: the sim's deck rates spread ${(simSd / realSd).toFixed(1)}× as wide as real play's (sd ${(100 * simSd).toFixed(1)} against ${(100 * realSd).toFixed(1)} points, sampling noise removed)`);
console.log(`order: rank correlation ${rho.toFixed(2)} (${rlo.toFixed(2)} to ${rhi.toFixed(2)})${realFlat ? ' — the real ranks are mostly noise while the real spread is this flat' : ''}`);
console.log(`\n   deck                     real (95% range)       sim    error  rank real/sim  pairings  real matches`);
for (const d of top) console.log('   ' + d.deck.padEnd(24) + `${pc(d.real)} (${pc(d.lo)}-${pc(d.hi)})`.padEnd(22) + pc(d.sim).padStart(5) + ((d.err >= 0 ? '+' : '') + (100 * d.err).toFixed(1)).padStart(8) + `${d.rankReal}/${d.rankSim}`.padStart(15) + String(d.pairs).padStart(10) + String(d.matches).padStart(14) + (d.inside ? '' : '   outside'));
console.log(`\nmean error ${(100 * mae).toFixed(1)} points over ${top.length} decks (a perfect engine would still show about ${(100 * floor).toFixed(1)}, from the real side's own noise)`);
console.log(`inside the real 95% range: ${top.filter(d => d.inside).length} of ${top.length}`);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ ...s, mae, maeFloor: floor, spread: realFlat ? null : simSd / realSd, realSd, realObs, realNoise, realFlat, simSd, rho, rhoLo: rlo, rhoHi: rhi, inside: top.filter(d => d.inside).length, of: top.length, batches: DIRS }, null, 1));
