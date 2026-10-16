// The per-style pilot-error dial, fitted (research's step 3; SHIP-16OCT §4 "knobs and optimiser"). Each batch is
// a log-batch.js run whose settings.json says which dial each style had (PILOT_ERR_STYLE, play/combat, with
// PILOT_CLASSES naming the style of each deck); a batch with no dial is the baseline. Per deck, the sim's rate is
// modelled as linear in the styles' dials:
//
//   rate(deck) = base(deck) + sum over styles s of beta(deck, s) * dial(s)
//
// fitted by least squares across the batches (each batch pooled pairing by pairing, as tools/scoreboard.js does).
// Then a grid search over the dials (0 to MAX in STEP) for the setting with the lowest mean deck error against
// real play, the ship bar's judgeable measure; the sim's spread is reported beside it. A deck's own style taking
// error lowers that deck and lifts its opponents, so styles the sim underrates should stay at 0: the search is
// free to leave them there.
//
//   node tools/dial-fit.js <calibration.json> <batch dir> [batch dir ...] [--styles aggro,midrange] [--max 0.5] [--step 0.025]
//
// Play and combat share one value per style here (the batches set them equal). Needs as many dial batches as
// styles searched, plus the baseline.
const fs = require('fs');
const path = require('path');
const calib = require('../calib');

const args = process.argv.slice(2);
const take = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args.splice(i, 2)[1] : d; };
const MAX = +take('--max', 0.5), STEP = +take('--step', 0.025);
const STYLES_ARG = take('--styles', null);
const [CAL, ...DIRS] = args;
if (!CAL || DIRS.length < 2) { console.error('usage: node tools/dial-fit.js <calibration.json> <baseline dir> <dial batch dir> [...] [--styles aggro,midrange]'); process.exit(1); }
let c = JSON.parse(fs.readFileSync(CAL, 'utf8')); if (c.standard) c = c.standard;

// a batch's deck rates, pooled pairing by pairing, the way tools/scoreboard.js reads it
function rates(dir) {
  const forge = {};
  for (const [key, x] of Object.entries(JSON.parse(fs.readFileSync(path.join(dir, 'batch.json'), 'utf8')))) {
    const [a, b] = key.split('|'), k = calib.pairKey(a, b), flip = k.startsWith(b + '\u0000') && a !== b;
    const f = forge[k] = forge[k] || [0, 0]; f[0] += flip ? x.lost : x.won; f[1] += flip ? x.won : x.lost;
  }
  const s = calib.scoreboard(forge, c.inputs.real);
  return Object.fromEntries(s.decks.filter(d => d.pairs >= 3).map(d => [d.deck, d]));
}
// a batch's dial per style: errStyle "aggro=0.2/0.2;midrange=0.1/0.1" (play/combat; the mean of the two is used)
function dials(dir) {
  const st = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
  if ((st.errPlay || st.errCombat || st.errDecks) && !st.errStyle) throw new Error(`${dir}: a uniform or per-deck dial; this fitter reads per-style batches only`);
  return Object.fromEntries((st.errStyle || '').split(';').filter(Boolean).map(x => { const [k, v] = x.split('='); const [p, cb = p] = v.split('/').map(Number); return [k.trim(), (p + cb) / 2]; }));
}

const batches = DIRS.map(d => ({ dir: d, rates: rates(d), dials: dials(d) }));
const STYLES = STYLES_ARG ? STYLES_ARG.split(',') : [...new Set(batches.flatMap(b => Object.keys(b.dials)))];
const decks = Object.keys(batches[0].rates).filter(n => batches.every(b => b.rates[n]));
if (batches.length < STYLES.length + 1) { console.error(`${STYLES.length} styles need ${STYLES.length + 1} batches (one baseline); got ${batches.length}`); process.exit(1); }

// least squares, deck by deck: X = [1, dial per style] per batch, y = the deck's sim rate
function solve(A, y) {   // normal equations, Gaussian elimination (tiny systems)
  const n = A[0].length, M = Array.from({ length: n }, (_, i) => [...Array.from({ length: n }, (_, j) => A.reduce((a, r) => a + r[i] * r[j], 0)), A.reduce((a, r, k) => a + r[i] * y[k], 0)]);
  for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r; [M[i], M[p]] = [M[p], M[i]]; if (Math.abs(M[i][i]) < 1e-12) throw new Error('the batches do not separate the styles; vary one style per batch'); for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let j = i; j <= n; j++) M[r][j] -= f * M[i][j]; } }
  return M.map((r, i) => r[n] / r[i]);
}
const X = batches.map(b => [1, ...STYLES.map(s => b.dials[s] || 0)]);
const model = Object.fromEntries(decks.map(n => [n, solve(X, batches.map(b => b.rates[n].sim))]));
const real = Object.fromEntries(decks.map(n => [n, batches[0].rates[n]]));
const predict = e => Object.fromEntries(decks.map(n => [n, Math.min(1, Math.max(0, model[n][0] + STYLES.reduce((a, s, i) => a + model[n][i + 1] * e[i], 0)))]));
const mae = p => decks.reduce((a, n) => a + Math.abs(p[n] - real[n].real), 0) / decks.length;
const sd = xs => { const m = xs.reduce((a, x) => a + x, 0) / xs.length; return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)); };

// grid search over the styles' dials
let best = null; const steps = Math.round(MAX / STEP) + 1;
const walk = (i, e) => {
  if (i === STYLES.length) { const p = predict(e), m = mae(p); if (!best || m < best.mae - 1e-9) best = { e: [...e], mae: m, p }; return; }
  for (let k = 0; k < steps; k++) { e[i] = +(k * STEP).toFixed(4); walk(i + 1, e); }
};
walk(0, []);

const pc = x => (100 * x).toFixed(1), sg = x => (x >= 0 ? '+' : '') + (100 * x).toFixed(1);
console.log(`batches: ${batches.map(b => path.basename(b.dir) + ' (' + (Object.entries(b.dials).map(([k, v]) => k + ' ' + v).join(', ') || 'baseline') + ')').join(' · ')}`);
console.log(`styles searched: ${STYLES.join(', ')} · dial 0 to ${MAX} in ${STEP}\n`);
console.log('per deck: the sim rate falls (or rises) this many points for a dial of 0.1 on each style');
console.log('   ' + 'deck'.padEnd(24) + 'style'.padEnd(10) + 'real'.padStart(6) + 'base'.padStart(7) + STYLES.map(s => s.padStart(10)).join('') + 'fitted'.padStart(9) + 'error'.padStart(8));
const cls = (() => { try { const st = JSON.parse(fs.readFileSync(path.join(DIRS[1], 'settings.json'), 'utf8')); return st.classes ? JSON.parse(fs.readFileSync(st.classes, 'utf8')) : {}; } catch { return {}; } })();
for (const n of decks) console.log('   ' + n.padEnd(24) + String((cls[n] || {}).class || '').padEnd(10) + pc(real[n].real).padStart(6) + pc(model[n][0]).padStart(7) + STYLES.map((s, i) => sg(model[n][i + 1] / 10).padStart(10)).join('') + pc(best.p[n]).padStart(9) + sg(best.p[n] - real[n].real).padStart(8));
const base = predict(STYLES.map(() => 0));
console.log(`\nbest: ${STYLES.map((s, i) => `${s}=${best.e[i]}/${best.e[i]}`).join(';')}`);
console.log(`predicted mean error ${pc(best.mae)} points (no dial: ${pc(mae(base))}) · sim spread ${pc(sd(decks.map(n => best.p[n])))} (no dial: ${pc(sd(decks.map(n => base[n])))})`);
console.log('a prediction from a linear model of a few batches; confirm it with a batch at these settings before believing it');
