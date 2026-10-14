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
console.log(`\n   deck                     real (95% range)       sim    error  pairings  real matches`);
for (const d of top) console.log('   ' + d.deck.padEnd(24) + `${pc(d.real)} (${pc(d.lo)}-${pc(d.hi)})`.padEnd(22) + pc(d.sim).padStart(5) + ((d.err >= 0 ? '+' : '') + (100 * d.err).toFixed(1)).padStart(8) + String(d.pairs).padStart(10) + String(d.matches).padStart(14) + (d.inside ? '' : '   outside'));
console.log(`\nmean error ${(100 * mae).toFixed(1)} points over ${top.length} decks (a perfect engine would still show about ${(100 * floor).toFixed(1)}, from the real side's own noise)`);
console.log(`inside the real 95% range: ${top.filter(d => d.inside).length} of ${top.length}`);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ ...s, mae, maeFloor: floor, inside: top.filter(d => d.inside).length, of: top.length, batches: DIRS }, null, 1));
