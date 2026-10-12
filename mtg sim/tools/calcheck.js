// usage: node tools/calcheck.js data/calibration.json ./calib.js
// Offline test of calibration forms on the stored fit inputs: leave-one-pair-out.
const c = require(process.argv[2]).standard, calib = require(process.argv[3]);
const lg = p => Math.log(p / (1 - p)), il = x => 1 / (1 + Math.exp(-x));
const rows = [];
for (const [k, f] of Object.entries(c.inputs.forge)) { const r = c.inputs.real[k]; if (!r) continue; const [a, b] = k.split('\u0000'); const nf = f[0] + f[1], nr = r[0] + r[1]; if (nf < 10 || nr < 6) continue;
  const pf = (f[0] + .5) / (nf + 1); rows.push({ k, a, b, f, r, nf, nr, x: lg(pf), vx: 1 / (nf * pf * (1 - pf)) }); }
console.log('pairs', rows.length, 'real games', rows.reduce((s, r) => s + r.nr, 0), 'forge games', rows.reduce((s, r) => s + r.nf, 0));
// spread of forge logits vs their noise: how much of Forge's spread is real
const mx = rows.reduce((s, r) => s + r.x, 0) / rows.length, vtot = rows.reduce((s, r) => s + (r.x - mx) ** 2, 0) / (rows.length - 1), vn = rows.reduce((s, r) => s + r.vx, 0) / rows.length;
console.log('forge logit spread sd', Math.sqrt(vtot).toFixed(2), 'noise sd', Math.sqrt(vn).toFixed(2), 'reliability', ((vtot - vn) / vtot).toFixed(2));
const ll = (p, r) => r[0] * Math.log(p) + r[1] * Math.log(1 - p);
// fit k by max likelihood of real counts given p = il(k * x)
const fitK = rs => { let k = 1; for (let i = 0; i < 50; i++) { let g = 0, h = 0; for (const r of rs) { const p = il(k * r.x); g += (r.r[0] - r.nr * p) * r.x; h -= r.nr * p * (1 - p) * r.x * r.x; } k -= g / h; } return k; };
const kAll = fitK(rows), relia = (vtot - vn) / vtot;
console.log('k (naive ML)', kAll.toFixed(2), ' k corrected for forge noise', (kAll / Math.max(.1, relia)).toFixed(2));
// real vs forge, raw
const tbl = rows.map(r => ({ pair: r.a.slice(0, 18) + ' v ' + r.b.slice(0, 18), forge: Math.round(il(r.x) * 100), real: Math.round(r.r[0] / r.nr * 100), nr: r.nr, nf: r.nf })).sort((a, b) => b.nr - a.nr);
console.table(tbl.slice(0, 32));
// leave-one-out predictive log-lik per real game
const sum = { null: 0, raw: 0, beta: 0, k: 0, kbeta: 0 }; let N = 0;
for (let i = 0; i < rows.length; i++) {
  const r = rows[i], rest = rows.filter((_, j) => j !== i);
  const F = {}, R = {}; for (const q of rest) { F[q.k] = q.f; R[q.k] = q.r; }
  const fit = calib.fit(F, R), ba = fit.beta[r.a] || 0, bb = fit.beta[r.b] || 0, k = fitK(rest);
  // beta convention: logit F(a,b) - logit R(a,b) = beta_a - beta_b, a is the alphabetically-first deck
  sum.null += ll(.5, r.r); sum.raw += ll(il(r.x), r.r); sum.beta += ll(il(r.x - ba + bb), r.r); sum.k += ll(il(k * r.x), r.r);
  // k plus betas: betas refit on residuals of the compressed model
  const F2 = {}; for (const q of rest) { const p = il(k * q.x), n = q.nf; F2[q.k] = [p * n, (1 - p) * n]; }
  const fit2 = calib.fit(F2, R); sum.kbeta += ll(il(k * r.x - (fit2.beta[r.a] || 0) + (fit2.beta[r.b] || 0)), r.r);
  N += r.nr;
}
for (const [m, v] of Object.entries(sum)) console.log(m.padEnd(6), 'log-lik per game', (v / N).toFixed(4), ' vs coin flip', ((v - sum.null) / N * 1000).toFixed(1), 'x1e-3');
// uncertainty in k, and the same on pairs with 20+ real games only
const kse = rs => { const k = fitK(rs); let h = 0; for (const r of rs) { const p = il(k * r.x); h += r.nr * p * (1 - p) * r.x * r.x; } return [k, 1 / Math.sqrt(h)]; };
for (const [lab, rs] of [['all', rows], ['20+ real games', rows.filter(r => r.nr >= 20)]]) { const [k, se] = kse(rs); console.log(lab, rs.length, 'pairs: k', k.toFixed(2), '95% range', (k - 1.96 * se).toFixed(2), 'to', (k + 1.96 * se).toFixed(2)); }
// how big are real matchups at all: spread of real logits beyond their noise
const rl = rows.map(r => { const p = (r.r[0] + .5) / (r.nr + 1); return { y: lg(p), v: 1 / (r.nr * p * (1 - p)) }; });
const my = rl.reduce((s, r) => s + r.y, 0) / rl.length, vy = rl.reduce((s, r) => s + (r.y - my) ** 2, 0) / (rl.length - 1), vny = rl.reduce((s, r) => s + r.v, 0) / rl.length;
console.log('real logit spread sd', Math.sqrt(vy).toFixed(2), 'of which noise sd', Math.sqrt(vny).toFixed(2), '=> true real spread sd', Math.sqrt(Math.max(0, vy - vny)).toFixed(2));
// power: if k were 1, what range would 584 games give?
{ let h = 0; for (const r of rows) { const p = il(r.x); h += r.nr * p * (1 - p) * r.x * r.x; } console.log('if Forge were right (k=1), this data pins k to +-', (1.96 / Math.sqrt(h)).toFixed(2)); }
