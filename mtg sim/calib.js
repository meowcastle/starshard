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
function solve(rows, names, beta, lambda) {
  for (let it = 0; it < 400; it++) {
    let moved = 0;
    for (const n of names) {
      let num = 0, den = lambda;
      for (const r of rows) {
        if (r.a === n) { num += r.w * (r.y + beta[r.b]); den += r.w; }
        else if (r.b === n) { num += r.w * (beta[r.a] - r.y); den += r.w; }
      }
      const nb = num / den; moved = Math.max(moved, Math.abs(nb - beta[n])); beta[n] = nb;
    }
    if (moved < 1e-6) break;
  }
}

// Best-of-three from game rates: p1 for game 1, p2 for each boarded game.
const match = (p1, p2) => p1 * (p2 + (1 - p2) * p2) + (1 - p1) * p2 * p2;

module.exports = { fit, logit, inv, pairKey, match };
