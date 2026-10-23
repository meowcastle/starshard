const test = require('node:test'), assert = require('node:assert');
const paired = require('../paired');
// a seeded coin
const rng = s => () => (s = (s * 48271) % 2147483647) / 2147483647;
// pairs for two versions whose game win rates are pa and pb; rho is how often the pair simply repeats (same seed, same game)
const sim = (pa, pb, n, r, rho = 0.5) => Array.from({ length: n }, () => { const a = r() < pa ? 1 : 0; return [a, r() < rho ? (pb === pa ? a : (r() < pb ? 1 : 0)) : (r() < pb ? 1 : 0)]; });
const run = (pa, pb, r) => { const all = []; for (let k = 0; k < 10; k++) { all.push(...sim(pa, pb, 20, r)); const d = paired.decide(all); if (d.verdict) return d; } return paired.decide(all); };

test('identical versions come out inside the noise in at least 95% of repeats', () => {
  const r = rng(11); let wrong = 0; const N = 400;
  for (let i = 0; i < N; i++) { const d = run(0.5, 0.5, r); if (d.verdict === 'better' || d.verdict === 'worse') wrong++; }
  assert.ok(wrong / N <= 0.05, `false verdicts ${wrong}/${N}`);
});
test('a change worth -20 points of game win rate reads as worse within 200 games, nearly always', () => {
  const r = rng(5); let hit = 0; const N = 200;
  for (let i = 0; i < N; i++) { const d = run(0.35, 0.55, r); if (d.verdict === 'worse') hit++; }
  assert.ok(hit / N >= 0.9, `caught ${hit}/${N}`);
});
test('perMatches turns game deltas into a best-of-three difference with a range around it', () => {
  const pre = paired.delta(sim(0.6, 0.5, 200, rng(3))), post = paired.delta(sim(0.6, 0.5, 200, rng(4)));
  const m = paired.perMatches(pre, post);
  assert.ok(m.per100 > 5 && m.per100 < 25, JSON.stringify(m)); assert.ok(m.lo < m.per100 && m.hi > m.per100);
  assert.match(paired.verdictLine({ verdict: 'better', match: m }, 7, 6, 'Dimir Midrange'), /^v7 beats v6 against Dimir Midrange · \+\d+ per 100 \(±\d+\) · 400 games$/);
});
test('combine: a running phase keeps the matchup open; clear and noise read as the clear one', () => {
  assert.equal(paired.combine({ verdict: 'better' }, { verdict: null }), null);
  assert.equal(paired.combine({ verdict: 'better' }, { verdict: 'same' }), 'better');
  assert.equal(paired.combine({ verdict: 'same' }, { verdict: 'capped' }), 'same');
  assert.equal(paired.combine({ verdict: 'better' }, { verdict: 'worse' }), 'mixed');
});
