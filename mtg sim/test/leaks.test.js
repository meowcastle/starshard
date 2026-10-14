// leaks.js: a match's counts pool across a brew's matches into the shape the Results tab reads
const test = require('node:test');
const assert = require('node:assert');
const leaks = require('../leaks');

const game = (match, mana, held) => [
  { t: 'game', match, game: 1, decks: ['player', 'opponent'] },
  { t: 'turn', turn: 1, active: 0, board: [], views: [{ me: { handSize: 7, life: 20 }, opp: { life: 20 } }, { me: { handSize: 7, life: 20 }, opp: { life: 20 } }] },
  { t: 'turn_end', turn: 1, active: 0, seats: [{ manaAvailable: mana, castable: held ? [{ name: 'Counter', mv: 2, instant: true }] : [] }, { manaAvailable: 0, castable: [] }] },
  { t: 'turn', turn: 2, active: 1, board: [], views: [] },
  { t: 'turn_end', turn: 2, active: 1, seats: [{ manaAvailable: 3, castable: [] }, { manaAvailable: 0, castable: [] }] },
  { t: 'end', winner: 0 },
];

test('pools two matches', () => {
  const a = leaks.tally([game('aaaaaaaa1', 2, true)]), b = leaks.tally([game('bbbbbbbb1', 0, false)]);
  const v = leaks.view(leaks.merge([a, b, null]));
  assert.strictEqual(v.games, 2); assert.strictEqual(v.wins, 2); assert.strictEqual(v.turns, 2);
  assert.deepStrictEqual(v.stats.unspentOwn, { value: 1, n: 2, unit: 'mana' });
  assert.deepStrictEqual(v.stats.heldUsed, { value: 0, n: 1, unit: 'share' });
  assert.strictEqual(v.stats.lethalTaken.n, 0); // nothing to measure: "not measured yet"
  assert.strictEqual(v.stats.keeps7.value, 1);
  assert.ok(v.moments.some(m => m.kind === 'held' && m.match === 'aaaaaaaa1'));
});
