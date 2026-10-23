// Paired version tests (E1, STRATEGY-FIRST-REBUILD §4): version A and version B of one deck play the same
// opponent on the same seeds, game i of A against game i of B, so most of what the engine gets wrong about
// the matchup cancels in the difference. This file is the arithmetic; server.js plays the games.
//
// Stopping: each finished pair of games is one observation. Pairs where both versions won or both lost say
// nothing about which is better; the discordant ones do. On those, two Wald SPRTs run side by side (McNemar's
// test made sequential): H0 "A wins half the discordant pairs" against "A wins 60%" and against "A wins 40%",
// alpha = beta = 5%. The test stops when either alternative is accepted (a verdict), when both are rejected
// (no difference that size: inside the noise), or at the game cap.
const score = require('./score');

const Q = 0.6, LO = Math.log(0.05 / 0.95), HI = Math.log(0.95 / 0.05);
const llr = (w, l, q) => w * Math.log(q / 0.5) + l * Math.log((1 - q) / 0.5);

// pairs: [[a, b], ...] with 1 for a win and 0 otherwise (a draw is 0 on both sides)
function decide(pairs, { cap = 200 } = {}) {
  let aw = 0, bw = 0;
  for (const [a, b] of pairs) { if (a && !b) aw++; else if (b && !a) bw++; }
  const up = llr(aw, bw, Q), down = llr(bw, aw, Q), n = pairs.length;
  const verdict = up >= HI ? 'better' : down >= HI ? 'worse' : (up <= LO && down <= LO) ? 'same' : n >= cap ? 'capped' : null;
  return { n, aw, bw, verdict, up: +up.toFixed(2), down: +down.toFixed(2) };
}

// the paired difference in game win rate, A minus B, with its 95% range (the variance of the per-pair difference)
function delta(pairs) {
  const n = pairs.length; if (!n) return null;
  const d = pairs.map(([a, b]) => (a ? 1 : 0) - (b ? 1 : 0)), m = d.reduce((s, x) => s + x, 0) / n;
  const v = n > 1 ? d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1) : 0.25, se = Math.sqrt(v / n);
  const pa = pairs.reduce((s, [a]) => s + (a ? 1 : 0), 0) / n;
  return { n, d: m, lo: m - 1.96 * se, hi: m + 1.96 * se, pa, pb: pa - m };
}

// Game deltas to a best-of-three: game 1 at the pre-board rate, games 2 and 3 at the post-board rate (play and
// draw folded together). A missing phase borrows the other's. Returns the match win rates and their difference
// per 100 matches, with the range carried through the same map at the ends of each game range.
function perMatches(pre, post) {
  const g = x => x || null, P = g(pre) || g(post), Q2 = g(post) || g(pre); if (!P) return null;
  const m = (p1, p2) => score.bo3(p1, p1, p2, p2);
  const clamp = x => Math.min(1, Math.max(0, x));
  const A = m(P.pa, Q2.pa), B = m(P.pb, Q2.pb), d = A - B;
  // the range: move both phases' A rates to the ends of their difference ranges, B held
  const lo = m(clamp(P.pb + P.lo), clamp(Q2.pb + Q2.lo)) - B, hi = m(clamp(P.pb + P.hi), clamp(Q2.pb + Q2.hi)) - B;
  return { a: A, b: B, per100: +(100 * d).toFixed(1), lo: +(100 * lo).toFixed(1), hi: +(100 * hi).toFixed(1), games: (pre ? pre.n : 0) + (post ? post.n : 0) };
}

// one line for a matchup, from its verdicts and match numbers
function verdictLine(r, aV, bV, opp) {
  if (!r || !r.match) return `v${aV} and v${bV} against ${opp}: not tested yet`;
  const v = r.verdict, x = r.match, pm = Math.round((x.hi - x.lo) / 2);
  const head = v === 'better' ? `v${aV} beats v${bV} against ${opp}` : v === 'worse' ? `v${aV} is worse than v${bV} against ${opp}` : `v${aV} and v${bV} are even against ${opp}`;
  return `${head} · ${x.per100 >= 0 ? '+' : ''}${Math.round(x.per100)} per 100 (±${pm}) · ${x.games} games`;
}

// combine the phases of one opponent: the verdict is the clear one when a phase has one (a clear "worse"
// wins over a clear "better" only if it's the bigger move), else the weaker of the two
function combine(pre, post) {
  const vs = [pre, post].filter(Boolean).map(x => x.verdict);
  const clear = vs.filter(v => v === 'better' || v === 'worse');
  const verdict = !vs.length ? null : vs.some(v => v === null) ? null : clear.length === 1 || (clear.length === 2 && clear[0] === clear[1]) ? clear[0] : clear.length === 2 ? 'mixed' : 'same';
  return verdict;
}

module.exports = { decide, delta, perMatches, verdictLine, combine, Q };
