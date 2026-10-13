// calib.js on a fixed Forge/real pairing set with known betas and k.   node --test test/
const test = require('node:test');
const assert = require('node:assert');
const calib = require('../calib');

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} is not within ${tol} of ${b}`);
const N = 200000; // games a cell: big enough that sampling noise and the ridge pull are negligible
// counts for a rate, as pairKey order expects ([wins of the alphabetically-first deck, wins of the other])
const cell = (a, b, pA) => { const k = calib.pairKey(a, b), first = k.split('\u0000')[0] === a; const w = Math.round(N * pA); return [k, first ? [w, N - w] : [N - w, w]]; };

test('fit recovers each deck\'s beta: logit F - logit R = beta_A - beta_B', () => {
  const beta = { Aggro: 0.6, Midrange: 0, Control: -0.6 }; // centred, as the ridge fit's solution is
  const R = { 'Aggro|Midrange': 0.55, 'Aggro|Control': 0.45, 'Midrange|Control': 0.5 };
  const forge = {}, real = {};
  for (const [pair, pr] of Object.entries(R)) {
    const [a, b] = pair.split('|'), pf = calib.inv(calib.logit(pr) + beta[a] - beta[b]);
    const [k, f] = cell(a, b, pf); forge[k] = f; real[k] = cell(a, b, pr)[1];
  }
  const f = calib.fit(forge, real);
  assert.strictEqual(f.pairs, 3);
  for (const [d, b] of Object.entries(beta)) near(f.beta[d], b, 0.02, d);
});

test('fit pulls a pairing with little real data toward zero (the ridge pull)', () => {
  // Forge 80%, real 3-3: unpulled, beta_A - beta_B would be logit .8 - logit .5 = 1.39 (0.69 each)
  const forge = Object.fromEntries([cell('A', 'B', 0.8)]), real = { [calib.pairKey('A', 'B')]: [3, 3] };
  const f = calib.fit(forge, real);
  assert.ok(f.beta.A > 0 && f.beta.A < 0.35 && Math.abs(f.beta.A + f.beta.B) < 1e-9, JSON.stringify(f.beta));
});

test('fidelity recovers k when real results are logit R = k logit F', () => {
  const k = 0.5, forge = {}, real = {};
  [0.2, 0.3, 0.4, 0.6, 0.7, 0.8].forEach((pf, i) => {
    const a = 'D' + i, b = 'E' + i;
    const [key, f] = cell(a, b, pf); forge[key] = f; real[key] = cell(a, b, calib.inv(k * calib.logit(pf)))[1];
  });
  const r = calib.fidelity(forge, real);
  near(r.k, k, 0.01, 'k'); assert.strictEqual(r.pairs, 6);
  assert.ok(r.lo < k && r.hi > k, 'the range contains k');
});

test('fidelity needs five pairings', () => {
  const forge = {}, real = {};
  for (let i = 0; i < 4; i++) { const [key, f] = cell('X' + i, 'Y' + i, 0.6); forge[key] = f; real[key] = f; }
  assert.strictEqual(calib.fidelity(forge, real), null);
});

test('match: a best of three from game rates (0.6 each way is 0.648)', () => {
  near(calib.match(0.6, 0.6), 0.648, 1e-12, 'match');
  near(calib.match(0.5, 0.5), 0.5, 1e-12, 'even');
});
