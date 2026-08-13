// Star Shard — regression tests for stations.js (the generated, browser-
// side station corpus tools/build-mansions.mjs also emits).
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { stationsJs } from '../tools/build-mansions.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

// A stale stations.js fails silently and worse than a stale mansions/*.html:
// there's no unresolved-{{ }} tell, it just serves wrong epithets/kanji into
// a real reading. Diff the committed file against a fresh in-memory render,
// the same discipline npm run bindings already applies to BINDINGS.md.
test('stations.js is not stale relative to tools/build-mansions.mjs\'s current output', () => {
  const committed = fs.readFileSync(path.join(ROOT, 'stations.js'), 'utf8');
  const fresh = stationsJs();
  assert.equal(committed, fresh, 'stations.js is stale — run node tools/build-mansions.mjs');
});

test('stations.js exports 28 stations, 0-indexed 0-27, matching the mansion permalinks\' epithets', async () => {
  const { STATIONS } = await import('../stations.js');
  assert.equal(STATIONS.length, 28);
  const stations = STATIONS.map(s => s.station).sort((a, b) => a - b);
  assert.deepEqual(stations, Array.from({ length: 28 }, (_, i) => i));
  const void_ = STATIONS.find(s => s.station === 23);
  assert.equal(void_.epithet, 'The Void');
  const gate = STATIONS.find(s => s.station === 0);
  assert.equal(gate.epithet, 'The Gate');
});

test('stations.js has steps and fragment stubbed null (not yet written) and real prose fields non-empty', async () => {
  const { STATIONS } = await import('../stations.js');
  for (const s of STATIONS) {
    assert.equal(s.steps, null, `#${s.station} steps should be null until the step-text pass lands`);
    assert.equal(s.fragment, null, `#${s.station} fragment should be null until the myth-fragment pass lands`);
    assert.ok(s.birthEntry.length > 20, `#${s.station} birthEntry too short/empty`);
    assert.ok(s.dailyCrossing.length > 20, `#${s.station} dailyCrossing too short/empty`);
  }
});

// INSTRUMENT.md §4/§7's four-axis station grammar fields.
test('stations.js has animal/guardianSky/signSpan on all 28, and hunger on all but station 27 (id 28, no nakshatra by construction)', async () => {
  const { STATIONS } = await import('../stations.js');
  for (const s of STATIONS) {
    assert.ok(s.animal && s.animal.length > 0, `#${s.station} missing animal`);
    assert.ok(s.guardianSky && s.guardianSky.length > 0, `#${s.station} missing guardianSky`);
    assert.ok(s.signSpan && s.signSpan.length > 0, `#${s.station} missing signSpan`);
    if (s.station === 27) {
      assert.equal(s.hunger, null, 'station 27 (id 28) has no nakshatra by construction — hunger must stay null, not faked');
    } else {
      assert.ok(s.hunger && s.hunger.deity && s.hunger.symbol, `#${s.station} missing hunger deity/symbol`);
    }
  }
});

test('guardianSky values are exactly the four Four Symbols quadrant names, and match sigil.js\'s skyOf() grouping', async () => {
  const { STATIONS } = await import('../stations.js');
  const { skyOf } = await import('../sigil.js');
  const QUADRANT_BY_SKY = ['White Tiger', 'Vermilion Bird', 'Azure Dragon', 'Black Tortoise'];
  for (const s of STATIONS) {
    const sky = skyOf(s.station);
    assert.ok(s.guardianSky.startsWith(QUADRANT_BY_SKY[sky]),
      `#${s.station}: skyOf()=${sky} (${QUADRANT_BY_SKY[sky]}) but guardianSky="${s.guardianSky}"`);
  }
});
