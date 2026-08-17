// Star Shard — regression tests for transits.js (aspect geometry, planet
// positions, and the live-transit priority picker).
// Run: node --test test/  (from the repo root)
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../transits.js';

// -- classifyAspect -----------------------------------------------------

test('classifyAspect: exact hits on all five classical aspects', () => {
  const cases = [
    [0, 0, 'conjunction'], [60, 0, 'sextile'], [90, 0, 'square'],
    [120, 0, 'trine'], [180, 0, 'opposition'],
  ];
  for (const [sep, orb, aspect] of cases) {
    const hit = T.classifyAspect(10, 10 + sep);
    assert.equal(hit.aspect, aspect, `${sep}deg should be ${aspect}`);
    assert.equal(hit.orbUsed, orb);
  }
});

test('classifyAspect: symmetric in argument order and wraparound-safe', () => {
  assert.deepEqual(T.classifyAspect(2, 358), T.classifyAspect(358, 2));
  // 2deg and 358deg are 4deg apart the short way (across the 0/360 seam),
  // not 356deg — a naive |a-b| would miss this conjunction entirely.
  const hit = T.classifyAspect(2, 358);
  assert.equal(hit.aspect, 'conjunction');
  assert.equal(hit.orbUsed, 4);
});

test('classifyAspect: orb boundary is inclusive at the edge, exclusive past it', () => {
  assert.equal(T.classifyAspect(0, 8).aspect, 'conjunction'); // exactly at the 8deg orb
  assert.equal(T.classifyAspect(0, 8.01), null); // 0.01deg past it
  assert.equal(T.classifyAspect(0, 64).aspect, 'sextile'); // exactly at the 4deg orb
  assert.equal(T.classifyAspect(0, 64.01), null);
});

test('classifyAspect: an angle in no aspect at all returns null', () => {
  assert.equal(T.classifyAspect(0, 35), null); // between sextile+orb (64) and square-orb (84)... actually between conj+orb(8) and sextile-orb(56)
  assert.equal(T.classifyAspect(0, 45), null);
  assert.equal(T.classifyAspect(0, 100), null); // between square+orb(96) and trine-orb(114)
});

test('classifyAspect: tightest orb wins if a separation could nominally fit two (defensive — this table\'s orbs never actually overlap)', () => {
  // conjunction's orb (8) and sextile's near edge (60-4=56) don't overlap,
  // so no real separation ever qualifies for two aspects. Assert the
  // no-overlap property itself holds for every adjacent pair in the table.
  const sorted = [0, 60, 90, 120, 180];
  const orbs = { 0: 8, 60: 4, 90: 6, 120: 6, 180: 8 };
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i] + orbs[sorted[i]];
    const gapEnd = sorted[i + 1] - orbs[sorted[i + 1]];
    assert.ok(gapStart <= gapEnd, `${sorted[i]} and ${sorted[i + 1]} orbs overlap`);
  }
});

// -- pickLiveTransit ------------------------------------------------------

test('pickLiveTransit: closest orb wins regardless of planet weight', () => {
  const contacts = [
    { planet: 'Saturn', point: 'sun', aspect: 'square', orbUsed: 3.0, maxOrb: 6 },
    { planet: 'Mercury', point: 'moon', aspect: 'trine', orbUsed: 0.5, maxOrb: 6 },
  ];
  assert.equal(T.pickLiveTransit(contacts).planet, 'Mercury');
});

test('pickLiveTransit: tied orb falls back to planet weight (Saturn > ... > Mercury)', () => {
  const contacts = [
    { planet: 'Venus', point: 'sun', aspect: 'trine', orbUsed: 2.0, maxOrb: 6 },
    { planet: 'Saturn', point: 'moon', aspect: 'square', orbUsed: 2.0, maxOrb: 6 },
    { planet: 'Mars', point: 'sun', aspect: 'sextile', orbUsed: 2.0, maxOrb: 4 },
  ];
  assert.equal(T.pickLiveTransit(contacts).planet, 'Saturn');
});

test('pickLiveTransit: tied orb and weight falls back to sun/moon/rising over MC', () => {
  const contacts = [
    { planet: 'Jupiter', point: 'mc', aspect: 'trine', orbUsed: 1.0, maxOrb: 6 },
    { planet: 'Jupiter', point: 'rising', aspect: 'square', orbUsed: 1.0, maxOrb: 6 },
  ];
  assert.equal(T.pickLiveTransit(contacts).point, 'rising');
});

test('pickLiveTransit: no contacts returns null, not an error', () => {
  assert.equal(T.pickLiveTransit([]), null);
});

// -- natalContacts --------------------------------------------------------

test('natalContacts: rising and MC are excluded when the birth time is unknown', () => {
  const positions = { Saturn: { lon: 14, retrograde: true } };
  const chart = { sunLon: 10, moonLon: 200, asc: 14, mc: 14 };
  const withTime = T.natalContacts(positions, chart, { timeKnown: true });
  const withoutTime = T.natalContacts(positions, chart, { timeKnown: false });
  assert.ok(withTime.some(c => c.point === 'rising'));
  assert.ok(withTime.some(c => c.point === 'mc'));
  assert.ok(!withoutTime.some(c => c.point === 'rising'));
  assert.ok(!withoutTime.some(c => c.point === 'mc'));
});

test('natalContacts: a planet with nothing in orb of any point contributes no contacts', () => {
  const positions = { Mercury: { lon: 45, retrograde: false } }; // in no aspect to either point below
  const chart = { sunLon: 10, moonLon: 200, asc: 0, mc: 0 };
  const contacts = T.natalContacts(positions, chart, { timeKnown: false });
  assert.equal(contacts.length, 0);
});

test('natalContacts: retrograde flag passes through from positions onto each contact', () => {
  const positions = { Saturn: { lon: 10, retrograde: true } };
  const chart = { sunLon: 10, moonLon: 200, asc: 0, mc: 0 };
  const contacts = T.natalContacts(positions, chart, { timeKnown: false });
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].retrograde, true);
});

// -- planetPositions (integration — real astronomy-engine calls) ----------

test('planetPositions: all five transit planets return a longitude in [0,360) and a boolean retrograde flag', async () => {
  const positions = await T.planetPositions(new Date());
  for (const name of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
    assert.ok(name in positions, `missing ${name}`);
    assert.ok(positions[name].lon >= 0 && positions[name].lon < 360, `${name} lon out of range: ${positions[name].lon}`);
    assert.equal(typeof positions[name].retrograde, 'boolean');
  }
});

test('planetPositions: is deterministic for a fixed date (no hidden dependence on "now")', async () => {
  const date = new Date('2026-04-12T21:14:00Z');
  const a = await T.planetPositions(date);
  const b = await T.planetPositions(date);
  assert.deepEqual(a, b);
});

test('planetPositions: Saturn matches PRODUCT.md §0\'s published cross-check (Aug 13 2026, Aries ~14.5deg, retrograde) to within same-day drift', async () => {
  const positions = await T.planetPositions(new Date('2026-08-13T18:00:00Z'));
  const signDeg = positions.Saturn.lon % 30; // Aries is 0-30deg
  assert.ok(positions.Saturn.lon >= 0 && positions.Saturn.lon < 30, `expected Aries (0-30deg), got ${positions.Saturn.lon}`);
  assert.ok(Math.abs(signDeg - 14.5) < 1, `expected ~14.5deg Aries, got ${signDeg.toFixed(2)}`);
  assert.equal(positions.Saturn.retrograde, true);
});

// -- outerPositions / standingWeather (the weekly's slow movers) ----------

test('outerPositions: all three outers return a longitude in [0,360), no retrograde flag (unlike planetPositions)', async () => {
  const positions = await T.outerPositions(new Date());
  for (const name of ['Uranus', 'Neptune', 'Pluto']) {
    assert.ok(name in positions, `missing ${name}`);
    assert.ok(positions[name].lon >= 0 && positions[name].lon < 360, `${name} lon out of range: ${positions[name].lon}`);
    assert.equal('retrograde' in positions[name], false);
  }
});

test('outerPositions: deterministic for a fixed date', async () => {
  const date = new Date('2026-04-12T21:14:00Z');
  const a = await T.outerPositions(date);
  const b = await T.outerPositions(date);
  assert.deepEqual(a, b);
});

test('standingWeather: rising and MC excluded without a birth time, same rule as natalContacts', () => {
  const positions = { Uranus: { lon: 14 } };
  const chart = { sunLon: 10, moonLon: 200, asc: 14, mc: 14 };
  const withTime = T.standingWeather(positions, chart, { timeKnown: true });
  const withoutTime = T.standingWeather(positions, chart, { timeKnown: false });
  assert.ok(withTime.some(c => c.point === 'rising'));
  assert.ok(!withoutTime.some(c => c.point === 'rising' || c.point === 'mc'));
});

test('standingWeather: sorted tightest-orb-first, and never carries a retrograde field (unlike natalContacts)', () => {
  const positions = { Uranus: { lon: 12 }, Neptune: { lon: 5 } }; // both conjunct sun@0, different orbs
  const chart = { sunLon: 0, moonLon: 200, asc: 0, mc: 0 };
  const contacts = T.standingWeather(positions, chart, { timeKnown: false });
  const sunHits = contacts.filter(c => c.point === 'sun');
  assert.ok(sunHits[0].orbUsed <= sunHits[sunHits.length - 1].orbUsed);
  assert.ok(contacts.every(c => !('retrograde' in c)));
});

// -- weekTightestContact (the weekly's beats 1 + 2) ------------------------

test('weekTightestContact: matches an independent day-by-day scan of the same week — the aggregation/selection logic, not the ephemeris', async () => {
  const chart = { sunLon: 45, moonLon: 200, asc: 300, mc: 30 };
  const weekStart = new Date('2026-08-10T00:00:00Z'); // a Monday
  const result = await T.weekTightestContact(chart, { timeKnown: true }, weekStart);

  // independently re-derive "the tightest of the week" from the same
  // primitives, rather than trusting weekTightestContact's own arithmetic
  let best = null;
  for (let weekday = 0; weekday < 7; weekday++) {
    const date = new Date(weekStart.getTime() + weekday * 86400000);
    const positions = await T.planetPositions(date);
    const hit = T.pickLiveTransit(T.natalContacts(positions, chart, { timeKnown: true }));
    if (hit && (!best || hit.orbUsed < best.hit.orbUsed)) best = { hit, weekday };
  }

  if (!best) { assert.equal(result, null); return; }
  assert.ok(result != null, 'expected a contact, got null');
  assert.equal(result.weekday, best.weekday);
  assert.equal(result.planet, best.hit.planet);
  assert.equal(result.orbUsed, best.hit.orbUsed);
});

test('weekTightestContact: weekStart is snapped to that week\'s Monday regardless of what day of the week is passed in', async () => {
  const chart = { sunLon: 45, moonLon: 200, asc: 300, mc: 30 };
  const monday = new Date('2026-08-10T00:00:00Z');
  const midWeekWednesday = new Date('2026-08-12T15:00:00Z'); // same week, different day/time
  const fromMonday = await T.weekTightestContact(chart, { timeKnown: true }, monday);
  const fromWednesday = await T.weekTightestContact(chart, { timeKnown: true }, midWeekWednesday);
  assert.deepEqual(fromMonday, fromWednesday);
});

test('weekTightestContact: rising and MC excluded without a birth time', async () => {
  const chart = { sunLon: 45, moonLon: 200, asc: 300, mc: 30 };
  const weekStart = new Date('2026-08-10T00:00:00Z');
  const result = await T.weekTightestContact(chart, { timeKnown: false }, weekStart);
  if (result) assert.ok(result.point !== 'rising' && result.point !== 'mc');
});

// -- natalPlanetPositions -------------------------------------------------

test('natalPlanetPositions: matches planetPositions()/outerPositions() called against the birth date', async () => {
  const jd = 2448088.0; // an arbitrary real JD (1990-06-15 12:00 UTC)
  const birthDate = new Date((jd - 2440587.5) * 86400000);
  const chart = { jd };
  const [inner, outer] = await Promise.all([T.planetPositions(birthDate), T.outerPositions(birthDate)]);
  const natal = await T.natalPlanetPositions(chart);
  for (const name of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
    assert.equal(natal[name].lon, inner[name].lon);
  }
  for (const name of ['Uranus', 'Neptune', 'Pluto']) {
    assert.equal(natal[name].lon, outer[name].lon);
  }
});

test('natalPlanetPositions: deterministic for a fixed chart.jd', async () => {
  const chart = { jd: 2451545.0 }; // J2000
  const a = await T.natalPlanetPositions(chart);
  const b = await T.natalPlanetPositions(chart);
  assert.deepEqual(a, b);
});
