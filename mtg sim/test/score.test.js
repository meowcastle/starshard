// score.js on fixed games, against numbers worked out by hand.   node --test test/
const test = require('node:test');
const assert = require('node:assert');
const score = require('../score');

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} is not within ${tol} of ${b}`);
// a pairing's games: w wins and l losses on the play, then on the draw (seat 0 is the brew)
const games = (wP, lP, wD, lD) => [
  ...Array(wP).fill({ winner: 0, first: 0 }), ...Array(lP).fill({ winner: 1, first: 0 }),
  ...Array(wD).fill({ winner: 0, first: 1 }), ...Array(lD).fill({ winner: 1, first: 1 }),
];

test('tallyGames splits by who went first and leaves draws out', () => {
  const t = score.tallyGames([...games(3, 1, 2, 4), { winner: null, first: 0 }, { winner: 0 }]);
  assert.deepStrictEqual(t, { P: [3, 4], D: [2, 6], U: [1, 1] });
});

test('best of three: 0.5 stays 0.5, and 0.6 a game is 0.648 a match (p^2 (3 - 2p))', () => {
  near(score.bo3(0.5, 0.5, 0.5, 0.5), 0.5, 1e-12, 'even');
  near(score.bo3(0.6, 0.6, 0.6, 0.6), 0.6 * 0.6 * (3 - 1.2), 1e-12, '0.6');
});

test('top 8 at seven rounds needs six wins: at 50% that is 8 in 128', () => {
  near(score.top8(0.5, 7), 8 / 128, 1e-12, 'top8');
});

test('one even matchup, 60 games: centred on 50%, the range a binomial gives through the best of three', () => {
  const r = score.run([{ name: 'X', w: 10, counted: true, pre: score.tallyGames(games(15, 15, 15, 15)), post: null, boarded: false, shift: null }]);
  // a game rate from 60 games has sd sqrt(.25/60) = 0.065; near 50% a best of three moves
  // 1.5x as fast as a game (d/dp p^2(3-2p) = 6p(1-p) = 1.5), so about 0.097 on the match:
  // a 95% range of about 0.31 to 0.69 before the field prior, which can only narrow it
  near(r.overall.p, 0.5, 0.02, 'centre');
  assert.ok(r.overall.lo > 0.28 && r.overall.lo < 0.42, `lo ${r.overall.lo}`);
  assert.ok(r.overall.hi > 0.58 && r.overall.hi < 0.72, `hi ${r.overall.hi}`);
  assert.strictEqual(r.overall.n, 60);
});

test('the same games give the same range (seeded)', () => {
  const opp = [{ name: 'X', w: 10, counted: true, pre: score.tallyGames(games(20, 10, 12, 18)), post: null, boarded: false, shift: null }];
  assert.deepStrictEqual(score.run(opp).overall, score.run(opp).overall);
});

test('who went first is taken out: a deck that only wins on the play reads near even, not as its raw rate', () => {
  // 30-0 on the play, 0-30 on the draw: half its games won, every game decided by the play
  const r = score.run([{ name: 'X', w: 10, counted: true, pre: score.tallyGames(games(30, 0, 0, 30)), post: null, boarded: false, shift: null }]);
  near(r.overall.p, 0.5, 0.05, 'centre');
  assert.ok(r.eta > 1, `the value of going first should be large, got ${r.eta}`);
});

test('a matchup not counted adds nothing to the headline', () => {
  const opp = (p, counted) => ({ name: p, w: 10, counted, pre: score.tallyGames(p === 'A' ? games(25, 5, 25, 5) : games(5, 25, 5, 25)), post: null, boarded: false, shift: null });
  const both = score.run([opp('A', true), opp('B', true)]), onlyA = score.run([opp('A', true), opp('B', false)]);
  assert.ok(onlyA.overall.p > both.overall.p + 0.2, `${onlyA.overall.p} vs ${both.overall.p}`);
  assert.strictEqual(onlyA.overall.k, 1);
});
