// Star Shard — regression tests for rates.js (measured rarity constants).
// Run: node --test test/  (from the repo root)
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../rates.js';

test('rate(): bits is -log2(p), and both survive on the entry', () => {
  const entry = R.rate(0.25);
  assert.equal(entry.p, 0.25);
  assert.equal(entry.bits, 2);
});

test('rate(): a rarer fact (smaller p) always carries more bits', () => {
  assert.ok(R.rate(0.01).bits > R.rate(0.1).bits);
});

test('every shipped table entry is a well-formed {p, bits} pair', () => {
  const tables = [R.CHART_RATES, R.COLOCATION_RATES, R.DISAGREEMENT_RATES, R.PILE_RATES, R.BOUNDARY_RATES, R.TYPE_RATES];
  for (const table of tables) {
    for (const [key, entry] of Object.entries(table)) {
      if (key === 'mean') continue; // DISAGREEMENT_RATES.mean is a bare number, not a {p,bits} entry
      assert.ok(entry.p > 0 && entry.p <= 1, `${key}.p should be a probability`);
      assert.ok(Math.abs(entry.bits - -Math.log2(entry.p)) < 1e-9, `${key}.bits should be -log2(p)`);
    }
  }
});

test('the co-location "uncanny direction" is rarer than the ordinary one', () => {
  // CHART-BUILDER.md/SHARD-MODEL.md's own framing: same-mansion-different-
  // sign is the flagship because it's the rare direction.
  assert.ok(R.COLOCATION_RATES.sameMansionDifferentSign.p < R.COLOCATION_RATES.sameSignDifferentMansion.p);
});

test('rateFor(): throws for every uniform-by-construction fact', () => {
  for (const key of ['mansion', 'step', 'archetype', 'weekday']) {
    assert.throws(() => R.rateFor(R.CHART_RATES, key), /uniform-by-construction/);
  }
});

test('rateFor(): returns the entry for a real key', () => {
  assert.equal(R.rateFor(R.COLOCATION_RATES, 'sameMansionDifferentSign'), R.COLOCATION_RATES.sameMansionDifferentSign);
});

test('rateFor(): throws on an unknown key rather than returning undefined', () => {
  assert.throws(() => R.rateFor(R.CHART_RATES, 'nonsense'), /unknown rate key/);
});

test('TYPE_RATES only ships the two measured traveler-type figures', () => {
  // CHART-BUILDER.md's rate table measures seedborn and homebound
  // precisely; the other three are only an approximate "~25% each" and
  // don't get a shipped constant here.
  assert.deepEqual(Object.keys(R.TYPE_RATES).sort(), ['homebound', 'seedborn']);
  assert.equal(R.TYPE_RATES.seedborn.p, 0.0352);
  assert.equal(R.TYPE_RATES.homebound.p, 0.213);
});
