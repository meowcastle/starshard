// Star Shard — regression tests for findings.js (the shard's ranker).
// Run: node --test test/  (from the repo root)
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../astro.js';
import * as F from '../findings.js';
import * as R from '../rates.js';

// -- pure per-kind logic, against synthetic points -----------------------

test('findColocations: same mansion + different sign fires; same sign alone does not', () => {
  // Mansion width is 360/28 ≈ 12.857deg. Sign width is 30deg. Pick two
  // longitudes that land in the same mansion but cross a sign boundary:
  // mansion 2 spans ~25.71-38.57deg; 29deg is Aries, 31deg is Taurus.
  const a = F.pointAt('Moon', 29);
  const b = F.pointAt('Midheaven', 31);
  assert.equal(a.mansion, b.mansion);
  assert.notEqual(a.sign, b.sign);
  const found = F.findColocations([a, b]);
  assert.equal(found.length, 1);
  assert.equal(found[0].kind, 'colocation');
  assert.deepEqual(found[0].points.sort(), ['Midheaven', 'Moon'].sort());
  assert.equal(found[0].mansion, a.mansion);
  assert.equal(found[0].rate, R.COLOCATION_RATES.sameMansionDifferentSign.p);
  assert.equal(found[0].bits, R.COLOCATION_RATES.sameMansionDifferentSign.bits);

  // Same sign, different mansion: no colocation finding (that's the
  // common direction — CHART-BUILDER.md only names the rare one).
  const c = F.pointAt('Sun', 1);
  const d = F.pointAt('Venus', 20);
  assert.equal(c.sign, d.sign);
  assert.notEqual(c.mansion, d.mansion);
  assert.equal(F.findColocations([c, d]).length, 0);
});

test('findColocations: same mansion AND same sign is not a colocation finding', () => {
  const a = F.pointAt('Sun', 10);
  const b = F.pointAt('Venus', 11);
  assert.equal(a.mansion, b.mansion);
  assert.equal(a.sign, b.sign);
  assert.equal(F.findColocations([a, b]).length, 0);
});

test('findPiles: fires at 3+, uses the fourPlus rate at 4+', () => {
  const three = [F.pointAt('Sun', 10), F.pointAt('Mercury', 11), F.pointAt('Venus', 12)];
  const foundThree = F.findPiles(three);
  assert.equal(foundThree.length, 1);
  assert.equal(foundThree[0].rate, R.PILE_RATES.threePlus.p);
  assert.equal(foundThree[0].points.length, 3);

  const four = [...three, F.pointAt('Mars', 12.5)]; // still < 12.857 (mansion 0's width) — stays in mansion 0
  const foundFour = F.findPiles(four);
  assert.equal(foundFour[0].rate, R.PILE_RATES.fourPlus.p);
  assert.equal(foundFour[0].points.length, 4);
});

test('findPiles: two points in a mansion is not a pile', () => {
  const two = [F.pointAt('Sun', 10), F.pointAt('Mercury', 11)];
  assert.equal(F.findPiles(two).length, 0);
});

test('findPiles: independent piles in different mansions both surface', () => {
  const points = [
    F.pointAt('Sun', 1), F.pointAt('Mercury', 2), F.pointAt('Venus', 3),
    F.pointAt('Jupiter', 100), F.pointAt('Saturn', 101), F.pointAt('Uranus', 102),
  ];
  const found = F.findPiles(points);
  assert.equal(found.length, 2);
});

test('findBoundary: nearest-to-edge point wins, thresholds pick the right tier', () => {
  // Mansion width ~12.857deg. A longitude of 12.8deg is 0.057deg before
  // the mansion-0/mansion-1 edge at 12.857deg.
  const near = F.pointAt('Ascendant', 12.8);
  const far = F.pointAt('Sun', 6.0); // dead center of mansion 0, ~6.43deg from either edge
  const found = F.findBoundary([near, far]);
  assert.equal(found.length, 1);
  assert.equal(found[0].points[0], 'Ascendant');
  assert.equal(found[0].rate, R.BOUNDARY_RATES.withinQuarterDegree.p);
});

test('findBoundary: nothing within 1.0deg of an edge yields no finding', () => {
  const points = [F.pointAt('Sun', 6.4), F.pointAt('Moon', 100)];
  assert.equal(F.findBoundary(points).length, 0);
});

test('findBoundary: 1.0deg/0.5deg tier boundaries are exclusive-below, per BOUNDARY_RATES', () => {
  const width = 360 / 28;
  const at0_6 = F.pointAt('Sun', width - 0.6); // 0.6deg from the upper edge
  assert.equal(F.findBoundary([at0_6])[0].rate, R.BOUNDARY_RATES.withinOneDegree.p);
  const at0_3 = F.pointAt('Sun', width - 0.3);
  assert.equal(F.findBoundary([at0_3])[0].rate, R.BOUNDARY_RATES.withinHalfDegree.p);
});

test('findQuiet: fires only at exactly zero disagreements', () => {
  // Ten points all in the same mansion AND same sign agree on every pair —
  // zero disagreements by construction (both partitions group them together).
  const points = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
    .map((name, i) => F.pointAt(name, 1 + i * 0.05));
  assert.equal(F.disagreementCountFor(points), 0);
  const found = F.findQuiet(points);
  assert.equal(found.length, 1);
  assert.equal(found[0].kind, 'quiet');
  assert.equal(found[0].rate, R.DISAGREEMENT_RATES.zero.p);
});

test('findQuiet: does not fire when there is at least one disagreement', () => {
  const points = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
    .map((name, i) => F.pointAt(name, 1 + i * 0.05));
  points[1] = F.pointAt('Moon', 29); // same sign as Sun@1deg, different mansion — a disagreement
  assert.ok(F.disagreementCountFor(points) > 0);
  assert.equal(F.findQuiet(points).length, 0);
});

test('findType: Seedborn only when Sun and Moon share a mansion', () => {
  const sameMansion = [F.pointAt('Sun', 10), F.pointAt('Moon', 11)];
  const found = F.findType(sameMansion);
  assert.equal(found.length, 1);
  assert.equal(found[0].kind, 'type');
  assert.equal(found[0].rate, R.TYPE_RATES.seedborn.p);

  const differentMansion = [F.pointAt('Sun', 1), F.pointAt('Moon', 100)];
  assert.equal(F.findType(differentMansion).length, 0);
});

// -- enumerateFindings(): real chart, real ephemeris ----------------------

// Same worked example the Becoming mechanic's plan uses: Apr 12 1998,
// 9:14pm, Chicago (41.8781N, 87.6298W, UTC-5).
const CHART = A.computeChart({ year: 1998, month: 4, day: 12, hour: 21, minute: 14, lat: 41.8781, lon: -87.6298, tzOffset: -5 });

test('enumerateFindings: returns a sorted, well-formed array for a real chart', async () => {
  const found = await F.enumerateFindings(CHART, {}, { timeKnown: true });
  assert.ok(Array.isArray(found));
  for (const f of found) {
    assert.ok(['colocation', 'pile', 'boundary', 'quiet', 'type'].includes(f.kind));
    assert.ok(Array.isArray(f.points) && f.points.length > 0);
    assert.ok(typeof f.rate === 'number' && f.rate > 0 && f.rate <= 1);
    assert.ok(typeof f.bits === 'number' && f.bits > 0);
    assert.ok(typeof f.prominence === 'number' && f.prominence > 0);
    assert.ok(typeof f.score === 'number' && f.score > 0);
    assert.equal(f.personalless, undefined); // internal-only field, stripped before return
  }
});

test('enumerateFindings: score is non-increasing within the personal-touching group', async () => {
  const OUTER = new Set(['Uranus', 'Neptune', 'Pluto']);
  const found = await F.enumerateFindings(CHART, {}, { timeKnown: true });
  const personal = found.filter(f => f.points.some(p => !OUTER.has(p)));
  for (let i = 1; i < personal.length; i++) {
    assert.ok(personal[i - 1].score >= personal[i].score);
  }
});

test('enumerateFindings: is deterministic — same chart twice, identical output', async () => {
  const a = await F.enumerateFindings(CHART, {}, { timeKnown: true });
  const b = await F.enumerateFindings(CHART, {}, { timeKnown: true });
  assert.deepEqual(a, b);
});

test('enumerateFindings: without a known birth time, no finding touches Ascendant/Midheaven', async () => {
  const found = await F.enumerateFindings(CHART, {}, { timeKnown: false });
  for (const f of found) {
    assert.ok(!f.points.includes('Ascendant'));
    assert.ok(!f.points.includes('Midheaven'));
  }
});

test('enumerateFindings: an outer-only finding never sorts above a finding touching a personal point', async () => {
  const found = await F.enumerateFindings(CHART, {}, { timeKnown: true });
  const OUTER = new Set(['Uranus', 'Neptune', 'Pluto']);
  const firstOuterOnlyIdx = found.findIndex(f => f.points.every(p => OUTER.has(p)));
  const firstPersonalIdx = found.findIndex(f => f.points.some(p => !OUTER.has(p)));
  if (firstOuterOnlyIdx !== -1 && firstPersonalIdx !== -1) {
    assert.ok(firstPersonalIdx < firstOuterOnlyIdx);
  }
});

test('enumerateFindings: angle-proximity prominence bonus applies within 10deg of Asc/MC', async () => {
  // Sun (31deg) and Moon (29deg) are both in mansion 2 (25.71-38.57deg)
  // but different signs (Taurus/Aries) — a guaranteed colocation finding
  // regardless of the angles. Ascendant sits 4deg from Sun (within the
  // 10deg bonus radius) and far from Moon, so the finding's prominence
  // (max across its points) should reflect Sun's boosted 1.5x weight.
  const chart = { ...CHART, asc: 35, mc: 200, sunLon: 31, moonLon: 29 };
  const found = await F.enumerateFindings(chart, {}, { timeKnown: true });
  const colocation = found.find(f => f.kind === 'colocation' && f.points.includes('Sun') && f.points.includes('Moon'));
  assert.ok(colocation, 'expected a Sun/Moon colocation finding');
  assert.ok(Math.abs(colocation.prominence - 1.5) < 1e-9);
});

test('enumerateFindings: no angle-proximity bonus when nothing sits within 10deg of an angle', async () => {
  const chart = { ...CHART, asc: 200, mc: 210, sunLon: 31, moonLon: 29 };
  const found = await F.enumerateFindings(chart, {}, { timeKnown: true });
  const colocation = found.find(f => f.kind === 'colocation' && f.points.includes('Sun') && f.points.includes('Moon'));
  assert.ok(colocation);
  assert.equal(colocation.prominence, 1.0);
});
