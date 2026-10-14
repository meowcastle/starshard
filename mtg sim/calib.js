// Calibrating Forge against people.
//
// For a pairing of archetypes A and B we may know two things: how often A beats B
// when Forge's AI pilots both (F), and how often it does in real tournaments (R).
// The model: on the log-odds scale, Forge's error is a property of each deck,
//
//   logit F(A,B) - logit R(A,B) = beta_A - beta_B
//
// where beta is how much Forge overrates a deck (it pilots aggro well, so aggro
// gets a positive beta; it pilots control badly, so control gets a negative one).
// A pooled fit means a deck's beta is learned from every pairing it has both kinds
// of data for, not just one sparse cell. Each pairing is weighted by the inverse
// variance of its difference, and a ridge term pulls every beta toward zero, so a
// deck with little real data barely moves.
//
// Using it: a brew U against opponent J, with Forge rate F(U,J), is corrected to
//   logit R(U,J) ~= logit F(U,J) - beta_U + beta_J
// beta_U is the beta of the archetype the brew is closest to, or 0 (an average
// pilot) when it is close to nothing.
const logit = p => Math.log(p / (1 - p));
const inv = x => 1 / (1 + Math.exp(-x));
const pairKey = (a, b) => a < b ? a + '\u0000' + b : b + '\u0000' + a;

// How far betas really spread decides how hard each one is pulled toward zero. The
// pull (lambda, a prior N(0, 1/lambda) on every beta) is estimated from the data,
// empirical Bayes: the betas' spread less the noise in them. Measured 12 Oct 2026
// (584 real games, 32 pairings) the spread was no bigger than the noise, so the pull
// sits at its maximum (25, a prior sd of 0.2): a deck needs a lot of real data before
// it moves a matchup more than a few points. Under the old fixed pull of 2, Lifegain
// (8 units of evidence) had a beta of 1.07 and moved one matchup from 14% to 46%.
// forge, real: Map-like objects of pairKey -> [wins of the alphabetically-first deck, wins of the other]
function fit(forge, real, { minForge = 10, minReal = 6, lambdaMin = 4, lambdaMax = 25 } = {}) {
  const rows = [];
  for (const [k, f] of Object.entries(forge)) {
    const r = real[k]; if (!r) continue;
    const [a, b] = k.split('\u0000'); if (a === b) continue;
    const nf = f[0] + f[1], nr = r[0] + r[1]; if (nf < minForge || nr < minReal) continue;
    const pf = (f[0] + 1) / (nf + 2), pr = (r[0] + 1) / (nr + 2);
    const v = 1 / (nf * pf * (1 - pf)) + 1 / (nr * pr * (1 - pr));
    rows.push({ a, b, y: logit(pf) - logit(pr), w: 1 / v, nf, nr });
  }
  const names = [...new Set(rows.flatMap(r => [r.a, r.b]))];
  const beta = Object.fromEntries(names.map(n => [n, 0])), ev = Object.fromEntries(names.map(n => [n, 0]));
  rows.forEach(r => { ev[r.a] += r.w; ev[r.b] += r.w; });
  let lambda = lambdaMin;
  for (let outer = 0; outer < 8; outer++) {
    solve(rows, names, beta, lambda);
    const tau2 = names.length < 4 ? 1 / lambdaMin : names.reduce((s, n) => s + beta[n] ** 2 - 1 / (ev[n] + lambda), 0) / names.length;
    const next = Math.min(lambdaMax, Math.max(lambdaMin, 1 / Math.max(1e-6, tau2)));
    if (Math.abs(next - lambda) < 0.01) break; lambda = next;
  }
  solve(rows, names, beta, lambda);
  return { beta, evidence: ev, lambda, pairs: rows.length, realGames: rows.reduce((s, r) => s + r.nr, 0) };
}
// The ridge solution exactly: (L + lambda I) beta = b, with L the pairings' weighted graph
// Laplacian, by Gaussian elimination (the matrix is symmetric positive definite). It replaced
// coordinate descent, which stalled along the all-decks-shift direction when the evidence far
// outweighed lambda (13 Oct 2026, test/calib.test.js: betas recovered 0.6 apart but all 0.35
// high); on the live fit both agreed to 1e-4, so no number moved.
function solve(rows, names, beta, lambda) {
  const n = names.length, ix = Object.fromEntries(names.map((x, i) => [x, i]));
  const A = names.map((_, i) => names.map((__, j) => (i === j ? lambda : 0))), B = new Array(n).fill(0);
  for (const r of rows) {
    const i = ix[r.a], j = ix[r.b];
    A[i][i] += r.w; A[j][j] += r.w; A[i][j] -= r.w; A[j][i] -= r.w; B[i] += r.w * r.y; B[j] -= r.w * r.y;
  }
  for (let i = 0; i < n; i++) for (let k = i + 1; k < n; k++) { const m = A[k][i] / A[i][i]; for (let j = i; j < n; j++) A[k][j] -= m * A[i][j]; B[k] -= m * B[i]; }
  for (let i = n - 1; i >= 0; i--) { let t = B[i]; for (let j = i + 1; j < n; j++) t -= A[i][j] * beta[names[j]]; beta[names[i]] = t / A[i][i]; }
}

// How well Forge predicts people: on every pairing with both kinds of data, real results
// fitted as logit R = k * logit F (maximum likelihood on the real games). k = 1 means
// Forge's matchups carry over as they are; 0 means they carry no information about real
// results. Forge's own noise biases k toward 0 a little (about 20% at 40 games a pair),
// which is left in: it is the fidelity the page actually gets. Measured 12 Oct 2026 on
// 32 pairings and 584 real games: k = 0.00, 95% range -0.22 to 0.22.
function fidelity(forge, real, { minForge = 10, minReal = 6 } = {}) {
  const rows = [];
  for (const [k, f] of Object.entries(forge)) {
    const r = real[k]; if (!r) continue; const nf = f[0] + f[1], nr = r[0] + r[1];
    if (nf < minForge || nr < minReal) continue;
    rows.push({ x: logit((f[0] + 0.5) / (nf + 1)), w: r[0], n: nr });
  }
  if (rows.length < 5) return null;
  let k = 1, h = 0;
  for (let it = 0; it < 50; it++) {
    let g = 0; h = 0;
    for (const r of rows) { const p = inv(k * r.x); g += (r.w - r.n * p) * r.x; h += r.n * p * (1 - p) * r.x * r.x; }
    const step = g / h; k += step; if (Math.abs(step) < 1e-9) break;
  }
  const se = 1 / Math.sqrt(h);
  return { k, lo: k - 1.96 * se, hi: k + 1.96 * se, pairs: rows.length, realGames: rows.reduce((s, r) => s + r.n, 0) };
}

// k as a scoreboard (research's method review, 14 Oct 2026), fixing two ways the raw k understates the engine:
// 1. Scale. The real records are best-of-three MATCHES and the sim's are GAMES; a game edge becomes a bigger
//    match edge (×1.5 near even), so a perfect engine scored ~1.5 on the raw k. The sim's game rate is turned
//    into a best-of-three rate first, so a perfect engine scores 1.
// 2. Noise. The sim's rate for a pairing is an estimate, and noise in what we regress on shrinks the slope by
//    the reliability (true spread² / observed spread²; errors-in-variables). The corrected k divides by it.
// Also per deck, on the same pairings (only ones with both real and sim results): the real match rate with a
// 95% interval, the sim's expected rate weighted by real matches, the error, and the error a perfect engine
// would still show from the real side's own sampling noise.
function scoreboard(forge, real, { minForge = 10, minReal = 6 } = {}) {
  const m3 = p => p * p * (3 - 2 * p), dm3 = p => 6 * p * (1 - p);
  const rows = [], decks = {};
  for (const [key, f] of Object.entries(forge)) {
    const r = real[key]; if (!r) continue; const nf = f[0] + f[1], nr = r[0] + r[1];
    if (nf < minForge || nr < minReal) continue;
    const p = (f[0] + 0.5) / (nf + 1), m = m3(p);
    rows.push({ key, x: logit(m), v: (dm3(p) ** 2) * p * (1 - p) / nf / (m * (1 - m)) ** 2, w: r[0], n: nr, nf });
    const [a, b] = key.split('\u0000');
    for (const [d, won, rate] of [[a, r[0], m], [b, r[1], 1 - m]]) { const D = decks[d] = decks[d] || { w: 0, n: 0, sim: 0, pairs: 0 }; D.w += won; D.n += nr; D.sim += nr * rate; D.pairs++; }
  }
  if (rows.length < 5) return null;
  let k = 0, h = 0; // from 0: the log-likelihood is concave in k, and Newton from 1 can overshoot
  for (let it = 0; it < 50; it++) { let g = 0; h = 0; for (const r of rows) { const q = inv(k * r.x); g += (r.w - r.n * q) * r.x; h += r.n * q * (1 - q) * r.x * r.x; } const st = g / h; k += st; if (Math.abs(st) < 1e-9) break; }
  const se = 1 / Math.sqrt(h), mx = rows.reduce((a, r) => a + r.x, 0) / rows.length;
  const vx = rows.reduce((a, r) => a + (r.x - mx) ** 2, 0) / (rows.length - 1), vn = rows.reduce((a, r) => a + r.v, 0) / rows.length;
  const rel = Math.max(0.05, (vx - vn) / vx);
  const wilson = (w, n) => { const z = 1.96, p = w / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, e = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [c - e, c + e]; };
  const per = Object.entries(decks).map(([deck, D]) => { const realP = D.w / D.n, sim = D.sim / D.n, [lo, hi] = wilson(D.w, D.n); return { deck, real: realP, lo, hi, sim, err: sim - realP, inside: sim >= lo && sim <= hi, matches: D.n, pairs: D.pairs, floor: Math.sqrt(2 / Math.PI) * Math.sqrt(realP * (1 - realP) / D.n) }; }).sort((a, b) => b.matches - a.matches);
  const nfs = rows.map(r => r.nf).sort((a, b) => a - b);
  return { k, lo: k - 1.96 * se, hi: k + 1.96 * se, reliability: rel, kCorrected: k / rel, loCorrected: (k - 1.96 * se) / rel, hiCorrected: (k + 1.96 * se) / rel,
    pairs: rows.length, realMatches: rows.reduce((a, r) => a + r.n, 0), simGamesPerPair: nfs[nfs.length >> 1], decks: per };
}

// The same question for a deck's overall strength: across decks, does Forge's win rate over
// its Forge pairings track the deck's real match record? Pearson correlation with a 95% range
// (Fisher z), over decks with 40+ Forge games and 30+ real matches. Measured 12 Oct 2026:
// r = -0.09 on 17 decks (paper results only).
function deckFidelity(forge, realField, { minForge = 40, minReal = 30 } = {}) {
  const F = {};
  for (const [k, f] of Object.entries(forge)) { const [a, b] = k.split('\u0000'); (F[a] = F[a] || [0, 0]); (F[b] = F[b] || [0, 0]); F[a][0] += f[0]; F[a][1] += f[1]; F[b][0] += f[1]; F[b][1] += f[0]; }
  const rows = Object.keys(F).filter(n => F[n][0] + F[n][1] >= minForge && realField[n] && realField[n].w + realField[n].l >= minReal).map(n => [F[n][0] / (F[n][0] + F[n][1]), realField[n].w / (realField[n].w + realField[n].l)]);
  if (rows.length < 5) return null;
  const m = i => rows.reduce((s, r) => s + r[i], 0) / rows.length, mx = m(0), my = m(1);
  const sxy = rows.reduce((s, r) => s + (r[0] - mx) * (r[1] - my), 0), sxx = rows.reduce((s, r) => s + (r[0] - mx) ** 2, 0), syy = rows.reduce((s, r) => s + (r[1] - my) ** 2, 0);
  const r = sxy / Math.sqrt(sxx * syy), z = Math.atanh(Math.max(-0.999, Math.min(0.999, r))), se = 1 / Math.sqrt(Math.max(1, rows.length - 3));
  return { r, lo: Math.tanh(z - 1.96 * se), hi: Math.tanh(z + 1.96 * se), decks: rows.length };
}

// Best-of-three from game rates: p1 for game 1, p2 for each boarded game.
const match = (p1, p2) => p1 * (p2 + (1 - p2) * p2) + (1 - p1) * p2 * p2;

module.exports = { fit, fidelity, scoreboard, deckFidelity, logit, inv, pairKey, match };
