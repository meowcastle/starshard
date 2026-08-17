// Star Shard — regression tests for combos.js (the generated, browser-side
// combination-reading corpus tools/build-combos.mjs emits from
// research/combos.json).
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { combosJs } from '../tools/build-combos.mjs';
import { COMBOS, COMBO_COUNT } from '../combos.js';

const ROOT = path.resolve(import.meta.dirname, '..');

// Same discipline as stations.js/reading-copy.js's own freshness checks —
// a stale combos.js serves old or since-rewritten cells with no visible
// tell.
test('combos.js is not stale relative to research/combos.json', () => {
  const committed = fs.readFileSync(path.join(ROOT, 'combos.js'), 'utf8');
  assert.equal(committed, combosJs(), 'combos.js is stale — run node tools/build-combos.mjs');
});

test('every address is well-formed (NN·MM, both 01-28) and matches COMBO_COUNT', () => {
  const keys = Object.keys(COMBOS);
  assert.equal(keys.length, COMBO_COUNT);
  for (const k of keys) {
    assert.match(k, /^\d{2}·\d{2}$/, `malformed address ${k}`);
    const [s, m] = k.split('·').map(Number);
    assert.ok(s >= 1 && s <= 28, `${k}: sun mansion out of range`);
    assert.ok(m >= 1 && m <= 28, `${k}: moon mansion out of range`);
  }
});

test('every cell has all six slots (lead, sun, moon, pull, tension, cost)', () => {
  for (const [addr, cell] of Object.entries(COMBOS)) {
    for (const slot of ['lead', 'sun', 'moon', 'pull', 'tension', 'cost']) {
      assert.ok(cell[slot] && cell[slot].length > 0, `${addr} missing ${slot}`);
    }
  }
});
