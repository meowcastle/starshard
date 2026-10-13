// Does a score learned from the logs judge positions better than Forge's? (research: "the logistic
// evaluator on the logs and the control-against-midrange rows"). Offline, no engine change.
//
// For each logged turn, from each seat's side: features = that seat minus the other on what the log
// records (lands, untapped lands, life, hand, creatures, power, toughness, evasive creatures, other
// permanents and their mana value, library), plus on-the-play and the turn number. Three predictors of
// "this seat goes on to win", each fitted on the training games and judged on held-out ones:
//   forge   - Forge's own score difference, through a fitted logistic curve (its best calibration)
//   linear  - a logistic regression on the features (one weight each: Forge's parts, re-priced by wins)
//   linear+class - the same with the two decks' strategy classes as extra inputs
// Held out: whole pairings (a deck pairing is in the training games or the test games, never both),
// so the score is judged on matchups it has not seen. Reported: log loss and accuracy on the test
// turns, and the calibration rows for control against midrange.
//
//   node tools/eval-fit.js <classes.json> <logs dir> [more logs dirs...]
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const [CLASSES, ...DIRS] = process.argv.slice(2);
const cls = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(CLASSES, 'utf8'))).map(([n, x]) => [n, x.class || x]));
const CLASSES_ = ['aggro', 'midrange', 'control', 'tempo', 'combo'];

function sideOf(t, s) {
  const v = t.views[s].me, b = t.board.filter(c => c.seat === s);
  const cr = b.filter(c => c.kind === 'creature'), other = b.filter(c => c.kind !== 'creature' && c.kind !== 'land');
  const ev = cr.filter(c => (c.kw || []).some(k => /flying|menace|trample/.test(k))).length;
  return [v.lands, v.landsUntapped, v.life, v.handSize, cr.length, cr.reduce((a, c) => a + (c.power || 0), 0), cr.reduce((a, c) => a + (c.toughness || 0), 0), ev, other.length, other.reduce((a, c) => a + Math.max(0, c.mv || 0), 0), v.library];
}
const NAMES = ['lands', 'untapped lands', 'life', 'hand', 'creatures', 'power', 'toughness', 'evasive', 'other permanents', 'other mana value', 'library', 'on the play', 'turn'];

const rows = [];
for (const DIR of DIRS) {
  const files = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.jsonl.gz')) files.push(f); } })(DIR);
  for (const f of files) {
    let recs; try { recs = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { continue; }
    const head = recs.find(r => r.t === 'game'), end = recs.find(r => r.t === 'end'); if (!head || !end || end.winner == null) continue;
    const pairing = [...head.decks].sort().join('|'), game = f;
    for (const t of recs) {
      if (t.t !== 'turn' || !t.static || t.static[0] == null || t.static[1] == null || Math.abs(t.static[0]) > 1e5 || Math.abs(t.static[1]) > 1e5) continue;
      const a = sideOf(t, 0), b = sideOf(t, 1);
      for (const s of [0, 1]) {
        const me = s === 0 ? a : b, them = s === 0 ? b : a;
        rows.push({ pairing, game, s, won: end.winner === s ? 1 : 0, forge: (t.static[s] - t.static[1 - s]) / 1000,
          x: [...me.map((v, i) => v - them[i]), (end.onThePlay === s ? 1 : -1), t.turn / 10],
          mine: cls[head.decks[s]] || 'other', theirs: cls[head.decks[1 - s]] || 'other' });
      }
    }
  }
}

// whole pairings held out: every fifth pairing, by name
const pairings = [...new Set(rows.map(r => r.pairing))].sort();
const test = new Set(pairings.filter((_, i) => i % 5 === 2));
const train = rows.filter(r => !test.has(r.pairing)), held = rows.filter(r => test.has(r.pairing));

// standardise features on the training rows
const k = NAMES.length, mu = new Array(k).fill(0), sd = new Array(k).fill(0);
for (const r of train) r.x.forEach((v, i) => { mu[i] += v / train.length; });
for (const r of train) r.x.forEach((v, i) => { sd[i] += (v - mu[i]) ** 2 / train.length; });
sd.forEach((v, i) => { sd[i] = Math.sqrt(v) || 1; });
const z = r => r.x.map((v, i) => (v - mu[i]) / sd[i]);
const classX = r => [...CLASSES_.map(c => r.mine === c ? 1 : 0), ...CLASSES_.map(c => r.theirs === c ? 1 : 0)];

// logistic regression by Newton's method (small ridge)
function fit(X, y, lambda = 1) {
  const n = X[0].length + 1; let w = new Array(n).fill(0);
  for (let it = 0; it < 25; it++) {
    const g = new Array(n).fill(0), H = Array.from({ length: n }, () => new Array(n).fill(0));
    X.forEach((xr, j) => { const x = [1, ...xr]; const p = 1 / (1 + Math.exp(-x.reduce((s, v, i) => s + v * w[i], 0))); const d = p - y[j], q = p * (1 - p); for (let a = 0; a < n; a++) { g[a] += d * x[a]; for (let b = 0; b < n; b++) H[a][b] += q * x[a] * x[b]; } });
    for (let a = 1; a < n; a++) { g[a] += lambda * w[a]; H[a][a] += lambda; }
    // solve H step = g
    const A = H.map((r, i) => [...r, g[i]]);
    for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; } }
    const step = new Array(n); for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let c = i + 1; c < n; c++) s -= A[i][c] * step[c]; step[i] = s / A[i][i]; }
    w = w.map((v, i) => v - step[i]);
    if (Math.max(...step.map(Math.abs)) < 1e-6) break;
  }
  return x => 1 / (1 + Math.exp(-[1, ...x].reduce((s, v, i) => s + v * w[i], 0)));
}
const models = {
  forge: fit(train.map(r => [r.forge]), train.map(r => r.won)),
  linear: fit(train.map(z), train.map(r => r.won)),
  'linear+class': fit(train.map(r => [...z(r), ...classX(r)]), train.map(r => r.won)),
};
const inputs = { forge: r => [r.forge], linear: z, 'linear+class': r => [...z(r), ...classX(r)] };

console.log(`${rows.length} turn-sides from ${new Set(rows.map(r => r.game)).size} games; ${pairings.length} pairings, ${test.size} held out (${held.length} test turn-sides)\n`);
console.log('held-out pairings      log loss   accuracy   (lower log loss is better; a coin flip is 0.693)');
for (const [name, m] of Object.entries(models)) {
  let ll = 0, ok = 0;
  for (const r of held) { const p = Math.min(1 - 1e-9, Math.max(1e-9, m(inputs[name](r)))); ll -= r.won ? Math.log(p) : Math.log(1 - p); if ((p > 0.5) === !!r.won) ok++; }
  console.log(`  ${name.padEnd(18)}   ${(ll / held.length).toFixed(3)}      ${(100 * ok / held.length).toFixed(1)}%`);
}

// calibration for control against midrange: predicted chance (binned) against how often that side won
console.log('\ncontrol vs midrange, held-out and training turns together: predicted chance for the control side, and how often it won');
const cm = rows.filter(r => r.mine === 'control' && r.theirs === 'midrange');
for (const [name, m] of Object.entries(models)) {
  const bins = [[0, .3], [.3, .45], [.45, .55], [.55, .7], [.7, 1.01]].map(([lo, hi]) => ({ lo, hi, n: 0, w: 0 }));
  for (const r of cm) { const p = m(inputs[name](r)), b = bins.find(x => p >= x.lo && p < x.hi); b.n++; b.w += r.won; }
  console.log(`  ${name.padEnd(18)} ` + bins.map(b => `${Math.round(b.lo * 100)}-${Math.round(Math.min(1, b.hi) * 100)}%: ${b.n ? Math.round(100 * b.w / b.n) + '% of ' + b.n : '-'}`).join('   '));
}

// what the linear model learned, per standard deviation of each feature (the sign says which way it pushes)
console.log('\nthe linear model\'s weights, per standard deviation of each feature, and Forge\'s implied price per unit (score-parts.js) for comparison');
const probe = i => { const x = new Array(k).fill(0); x[i] = 1; return Math.log(models.linear(x) / (1 - models.linear(x))) - Math.log(models.linear(new Array(k).fill(0)) / (1 - models.linear(new Array(k).fill(0)))); };
NAMES.forEach((n, i) => console.log(`  ${n.padEnd(20)} ${probe(i).toFixed(3).padStart(7)} per sd (sd ${sd[i].toFixed(2)})`));
