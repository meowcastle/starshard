// weekly.js: a brew's rerun on the new field against its previous field run
const test = require('node:test');
const assert = require('node:assert');
const weekly = require('../weekly');

const rv = (p, opps) => ({ score: { p }, opponents: opps.map(([name, metaPct, q]) => ({ name, metaPct, score: q == null ? null : { p: q } })) });

test('Landfall rose and the matchup fell: the badge names it', () => {
  const prev = rv(0.52, [['Mono-Green Landfall', 18, 0.47], ['Dimir Midrange', 12, 0.55]]);
  const now = rv(0.47, [['Mono-Green Landfall', 28, 0.38], ['Dimir Midrange', 12, 0.56]]);
  const w = weekly.compare('Squall', now, prev);
  assert.ok(w.notify);
  assert.strictEqual(Math.round(w.delta * 100), -5);
  assert.deepStrictEqual(w.movers.map(m => m.opponent), ['Mono-Green Landfall']);
  assert.strictEqual(w.text, 'Squall 52 → 47 this week: Mono-Green Landfall rose to 28% and you are 38% against it (was 47%).');
});

test('a quiet week: nothing to notify', () => {
  const prev = rv(0.50, [['A', 20, 0.50], ['B', 10, 0.60]]);
  const now = rv(0.51, [['A', 21, 0.52], ['B', 10, 0.58]]);
  const w = weekly.compare('Deck', now, prev);
  assert.strictEqual(w.notify, false);
  assert.deepStrictEqual(w.movers, []);
  assert.match(w.text, /no single matchup moved much/);
});

test('one matchup moved 8 points: notify even when the headline held', () => {
  const prev = rv(0.50, [['A', 5, 0.40], ['B', 30, 0.55]]);
  const now = rv(0.51, [['A', 5, 0.52], ['B', 30, 0.55]]);
  const w = weekly.compare('Deck', now, prev);
  assert.ok(w.notify);
  assert.strictEqual(w.movers[0].opponent, 'A');
});

test('a deck new to the field is a mover, and says so', () => {
  const prev = rv(0.50, [['A', 20, 0.50]]);
  const now = rv(0.48, [['A', 18, 0.50], ['Newcomer', 9, 0.30]]);
  const w = weekly.compare('Deck', now, prev);
  assert.strictEqual(w.movers[0].opponent, 'Newcomer');
  assert.strictEqual(w.movers[0].new, true);
  assert.match(w.text, /Newcomer is new in the field and you are 30% against it\./);
});

test('an opponent with no score yet is left out', () => {
  const w = weekly.compare('Deck', rv(0.5, [['A', 20, null]]), rv(0.5, [['A', 10, 0.5]]));
  assert.deepStrictEqual(w.movers, []);
});
