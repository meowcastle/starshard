// A run's numbers, with honest ranges. One place computes them; the page, the coach
// and the game allocator all read the result.
//
// Per matchup and phase (game 1, boarded) the games are split by who went first.
// Forge lets the loser of each game choose, and its AI always chooses to play, so
// the deck losing a matchup plays first far more often; a plain win count pulls a
// lopsided matchup toward 50%. Splitting the games and recombining them the way a
// real match runs (game 1 a coin flip, the loser of each game on the play next)
// removes that.
//
// The model, on the log-odds scale: logit p(play) = mu + eta, logit p(draw) = mu -
// eta. mu is the matchup's strength and gets a prior: for game 1, the brew's
// average across this field, as wide as the matchups actually spread (empirical
// Bayes); for boarded games, the same matchup's game 1. So a matchup with 20 games
// leans on the rest of the field a little, and one with 200 barely at all. eta (the
// value of going first) is shared by every matchup in the run. Each mu is fitted
// (Newton, Laplace approximation) and the uncertainty is carried through by Monte
// Carlo: draw every mu, eta and calibration shift, play out the best of three, weight
// by meta share. The 2.5th and 97.5th percentiles are the 95% range.
//
// Tallies: { P: [won, played] on the play, D: [won, played] on the draw, U: [won,
// played] with no record of who went first (games from before it was recorded) },
// from the brew's side, draws left out.
const lg = p => Math.log(p / (1 - p)), ilg = x => 1 / (1 + Math.exp(-x));
const S = 4000;
const ETA_SD = 0.25, POST_SD = 0.7;

const T0 = () => ({ P: [0, 0], D: [0, 0], U: [0, 0] });
const addT = (a, b) => { if (b) for (const k of ['P', 'D', 'U']) { a[k][0] += b[k][0]; a[k][1] += b[k][1]; } return a; };
const nOf = t => t ? t.P[1] + t.D[1] + t.U[1] : 0;
const wOf = t => t ? t.P[0] + t.D[0] + t.U[0] : 0;

// from a pairing's game list: seat 0 is the brew; g.first is who played first
function tallyGames(games) {
  const t = T0();
  for (const g of games || []) {
    if (g.winner !== 0 && g.winner !== 1) continue;
    const k = g.first === 0 ? 'P' : g.first === 1 ? 'D' : 'U';
    t[k][1]++; if (g.winner === 0) t[k][0]++;
  }
  return t;
}

// mu's posterior mode and variance, given eta and a normal prior
function fitMu(t, eta, m0, v0) {
  let mu = m0;
  for (let it = 0; it < 30; it++) {
    let g = -(mu - m0) / v0, h = -1 / v0;
    for (const [k, e] of [['P', eta], ['D', -eta], ['U', 0]]) {
      const [w, n] = t[k]; if (!n) continue;
      const p = ilg(mu + e); g += w - n * p; h -= n * p * (1 - p);
    }
    const step = g / h; mu -= step; if (Math.abs(step) < 1e-9) break;
  }
  let info = 1 / v0;
  for (const [k, e] of [['P', eta], ['D', -eta], ['U', 0]]) { const n = t[k][1]; if (n) { const p = ilg(mu + e); info += n * p * (1 - p); } }
  return { mu, v: 1 / info };
}

// Game 1's strength m and the boarded games' shift from it, d, fitted together: game 1's
// games inform m, the boarded games inform m + d. Returns the mode and its covariance.
function fitPair(pre, post, eta, m0, v0) {
  let m = m0, d = 0, H = [[0, 0], [0, 0]];
  const terms = (t, x, f) => { for (const [k, e] of [['P', eta], ['D', -eta], ['U', 0]]) { const [w, n] = t[k]; if (n) { const p = ilg(x + e); f(w - n * p, n * p * (1 - p)); } } };
  for (let it = 0; it < 40; it++) {
    let gm = -(m - m0) / v0, gd = -d / (POST_SD * POST_SD), hmm = 1 / v0, hdd = 1 / (POST_SD * POST_SD), hmd = 0;
    terms(pre, m, (g, h) => { gm += g; hmm += h; });
    terms(post, m + d, (g, h) => { gm += g; gd += g; hmm += h; hdd += h; hmd += h; });
    H = [[hmm, hmd], [hmd, hdd]];
    const det = hmm * hdd - hmd * hmd, sm = (hdd * gm - hmd * gd) / det, sd = (hmm * gd - hmd * gm) / det;
    m += sm; d += sd; if (Math.abs(sm) + Math.abs(sd) < 1e-9) break;
  }
  const det = H[0][0] * H[1][1] - H[0][1] * H[0][1];
  const vm = H[1][1] / det, vd = H[0][0] / det, c = -H[0][1] / det;
  // Cholesky of the covariance, for sampling
  const a = Math.sqrt(vm), b = c / a, e = Math.sqrt(Math.max(1e-12, vd - b * b));
  return { mu: m, d, v: vm, chol: [a, b, e], mu2: m + d };
}

// the shared value of going first, given every matchup's mu
function fitEta(items) {
  let eta = 0;
  for (let it = 0; it < 30; it++) {
    let g = -eta / (ETA_SD * ETA_SD), h = -1 / (ETA_SD * ETA_SD);
    for (const { t, mu } of items) for (const [k, s] of [['P', 1], ['D', -1]]) {
      const [w, n] = t[k]; if (!n) continue;
      const p = ilg(mu + s * eta); g += s * (w - n * p); h -= n * p * (1 - p);
    }
    const step = g / h; eta -= step; if (Math.abs(step) < 1e-9) break;
  }
  let info = 1 / (ETA_SD * ETA_SD);
  for (const { t, mu } of items) for (const [k, s] of [['P', 1], ['D', -1]]) { const n = t[k][1]; if (n) { const p = ilg(mu + s * eta); info += n * p * (1 - p); } }
  return { eta, v: 1 / info };
}

// the brew's average matchup and how far matchups spread around it (logit scale)
function fieldPrior(ts) {
  const pts = ts.filter(t => nOf(t) >= 4).map(t => { const n = nOf(t), p = (wOf(t) + 0.5) / (n + 1); return { x: lg(p), v: 1 / (n * p * (1 - p)) }; });
  if (!pts.length) return { m: 0, v: 1.5 };
  const W = pts.reduce((s, q) => s + 1 / q.v, 0), m = pts.reduce((s, q) => s + q.x / q.v, 0) / W;
  if (pts.length < 4) return { m, v: 1.5 };
  const spread = pts.reduce((s, q) => s + (q.x - m) ** 2, 0) / (pts.length - 1) - pts.reduce((s, q) => s + q.v, 0) / pts.length;
  return { m, v: Math.min(4, Math.max(0.15, spread)) };
}

// seeded, so the same games always give the same range
function rng(seed) {
  let a = seed >>> 0, spare = null;
  const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return () => { if (spare != null) { const s = spare; spare = null; return s; } let x, y, r; do { x = u() * 2 - 1; y = u() * 2 - 1; r = x * x + y * y; } while (!r || r >= 1); const f = Math.sqrt(-2 * Math.log(r) / r); spare = y * f; return x * f; };
}
const q = (arr, f) => { const s = Float64Array.from(arr).sort(); return s[Math.min(s.length - 1, Math.max(0, Math.floor(f * (s.length - 1))))]; };
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;

// a best of three: game 1 a coin flip for who plays first, then the loser of each game plays first
const bo3 = (p1P, p1D, p2P, p2D) => { const a = (p1P + p1D) / 2; return a * (p2D + (1 - p2D) * p2P) + (1 - a) * p2P * p2D; };

// opps: [{ name, w (meta share or null), counted, pre: tally, post: tally | null, boarded, shift: { d, sd } | null }]
// returns { overall, opp: [...], samples } or null with no games
function run(opps, { seed = 7 } = {}) {
  const live = opps.map((o, i) => ({ ...o, i })).filter(o => nOf(o.pre) > 0);
  if (!live.length) return null;
  const prior = fieldPrior(live.map(o => o.pre));
  // eta and the mus, two passes
  let eta = { eta: 0, v: ETA_SD * ETA_SD };
  for (let pass = 0; pass < 2; pass++) {
    for (const o of live) {
      o.f1 = fitMu(o.pre, eta.eta, prior.m, prior.v);
      o.f2 = o.boarded && nOf(o.post) ? fitPair(o.pre, o.post, eta.eta, prior.m, prior.v) : null;
    }
    eta = fitEta(live.flatMap(o => o.f2 ? [{ t: o.pre, mu: o.f2.mu }, { t: o.post, mu: o.f2.mu2 }] : [{ t: o.pre, mu: o.f1.mu }]));
  }
  const N = rng(seed), counted = live.filter(o => o.counted), wtd = counted.length > 0 && counted.every(o => o.w != null);
  const W = counted.reduce((s, o) => s + (wtd ? o.w : 1), 0);
  const per = live.map(() => new Float64Array(S)), raw = live.map(() => new Float64Array(S)), g1 = live.map(() => new Float64Array(S)), pp = live.map(() => new Float64Array(S)), pd = live.map(() => new Float64Array(S));
  const all = new Float64Array(S);
  for (let s = 0; s < S; s++) {
    const e = eta.eta + Math.sqrt(eta.v) * N();
    let tot = 0;
    live.forEach((o, k) => {
      let m1, m2;
      if (o.f2) { const [a, b, c] = o.f2.chol, z1 = N(), z2 = N(); m1 = o.f2.mu + a * z1; m2 = m1 + o.f2.d + b * z1 + c * z2; }
      else {
        m1 = o.f1.mu + Math.sqrt(o.f1.v) * N();
        // boarded but nothing played yet: anywhere near game 1; nothing boarded on either side: game 1's lists, game 1's rate
        m2 = o.boarded ? m1 + POST_SD * N() : m1;
      }
      const d = o.shift ? o.shift.d + (o.shift.sd || 0) * N() : 0;
      const r = bo3(ilg(m1 + e), ilg(m1 - e), ilg(m2 + e), ilg(m2 - e));
      const c = d ? bo3(ilg(m1 + e + d), ilg(m1 - e + d), ilg(m2 + e + d), ilg(m2 - e + d)) : r;
      per[k][s] = c; raw[k][s] = r; g1[k][s] = (ilg(m1 + e) + ilg(m1 - e)) / 2; pp[k][s] = ilg(m1 + e); pd[k][s] = ilg(m1 - e);
      if (o.counted) tot += c * (wtd ? o.w : 1);
    });
    all[s] = W ? tot / W : 0;
  }
  const sum = a => { const m = mean(a); let v = 0; for (const x of a) v += (x - m) ** 2; return { p: m, lo: q(a, 0.025), hi: q(a, 0.975), v: v / a.length }; };
  const opp = opps.map(() => null);
  live.forEach((o, k) => {
    const s = sum(per[k]);
    opp[o.i] = { ...s, raw: mean(raw[k]), g1: mean(g1[k]), onPlay: mean(pp[k]), onDraw: mean(pd[k]), n: nOf(o.pre) + nOf(o.post), n1: nOf(o.pre), n2: nOf(o.post), wt: o.counted ? (wtd ? o.w : 1) / W : 0, cal: !!o.shift, counted: o.counted };
  });
  const overall = W ? { ...sum(all), n: counted.reduce((s, o) => s + nOf(o.pre) + nOf(o.post), 0), k: counted.length, wtd, W } : null;
  return { overall, opp, eta: eta.eta, prior, samples: all };
}

// A competitive tournament: Swiss rounds against opponents drawn from the field by meta
// share, each round an independent match (Swiss pairs by record, which this leaves out),
// top 8 needing at most one loss. The decks we haven't played (100 less the counted
// shares) are counted as even matchups. Per Monte Carlo draw, so the odds carry the range.
const top8 = (p, rounds) => { const need = rounds - 1; let s = 0; for (let k = need; k <= rounds; k++) { let c = 1; for (let i = 0; i < k; i++) c = c * (rounds - i) / (i + 1); s += c * p ** k * (1 - p) ** (rounds - k); } return s; };
const fieldRate = (rate, W, rest) => (W * rate + rest * 0.5) / (W + rest);
function tournament(res, { rounds = 7 } = {}) {
  if (!res || !res.overall || !res.overall.wtd) return null;
  const W = res.overall.W, rest = Math.max(0, 100 - W);
  const f = Float64Array.from(res.samples, x => fieldRate(x, W, rest)), t = Float64Array.from(f, p => top8(p, rounds));
  const r = a => ({ p: mean(a), lo: q(a, 0.025), hi: q(a, 0.975) });
  return { rounds, rest, field: r(f), top8: r(t), samples: f };
}
// what raising one matchup to a given rate is worth at the tournament, at the point estimates
function lever(res, ev, i, to = 0.5) {
  const o = res.opp[i]; if (!o || !o.counted || !ev) return null;
  const W = res.overall.W, p0 = ev.field.p, p1 = p0 + (o.wt * W) * (to - o.p) / 100;
  return { field: p1, top8: top8(p1, ev.rounds), gain: top8(p1, ev.rounds) - top8(p0, ev.rounds) };
}

// two independent results' headline difference, as a range
function diff(a, b) {
  if (!a || !b || !a.overall || !b.overall) return null;
  const d = new Float64Array(S); for (let s = 0; s < S; s++) d[s] = a.samples[s] - b.samples[s];
  let more = 0; for (const x of d) if (x > 0) more++;
  return { p: mean(d), lo: q(d, 0.025), hi: q(d, 0.975), above: more / S };
}

module.exports = { run, diff, tournament, lever, top8, tallyGames, T0, addT, nOf, wOf, bo3 };
