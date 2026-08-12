// Star Shard — regression tests for sky.js (the daily engine).
// Run: node --test test/  (from the repo root)
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../astro.js';
import * as S from '../sky.js';
import { NAKSHATRA_REFERENCE } from './fixtures/nakshatra.reference.mjs';

// ---------------------------------------------------------------------------
// Lahiri ayanāṁśa — fit against 12 real pyswisseph 2.10.3.2 (SIDM_LAHIRI)
// reference points, 1900-2050.
// ---------------------------------------------------------------------------

const AYANAMSA_REFERENCE = [
  [2415020.5, 22.460531], // 1900-01-01
  [2422324.5, 22.739759], // 1920-01-01
  [2429629.5, 23.019051], // 1940-01-01
  [2436934.5, 23.298367], // 1960-01-01
  [2444239.5, 23.577708], // 1980-01-01
  [2451544.5, 23.857073], // 2000-01-01
  [2455197.5, 23.996784], // 2010-01-01
  [2458849.5, 24.136463], // 2020-01-01
  [2461263.5, 24.228795], // 2026-08-11
  [2462502.5, 24.276186], // 2030-01-01
  [2466154.5, 24.415878], // 2040-01-01
  [2469807.5, 24.555613], // 2050-01-01
];

test('lahiriAyanamsa matches Swiss Ephemeris within 0.001 deg', () => {
  for (const [jd, want] of AYANAMSA_REFERENCE) {
    const got = S.lahiriAyanamsa(jd);
    assert.ok(Math.abs(got - want) < 0.001, `jd=${jd}: got ${got}, want ${want}`);
  }
});

// ---------------------------------------------------------------------------
// Sidereal nakshatra — the number that actually matters isn't the ayanāṁśa
// formula's isolated accuracy, it's whether it ever flips which of the 27
// bins a real chart lands in. 500-chart cross-check against Swiss Ephemeris,
// run through astro.js's own (already-verified) moonLongitude().
// ---------------------------------------------------------------------------

test('siderealNakshatra matches Swiss Ephemeris nakshatra index for every reference chart', () => {
  let mismatches = 0;
  for (const [y, m, d, hh, mm, want] of NAKSHATRA_REFERENCE) {
    const jd = A.julianDay(y, m, d, hh + mm / 60);
    const moonLon = A.moonLongitude(jd);
    const { index } = S.siderealNakshatra(moonLon, jd);
    if (index !== want) mismatches++;
  }
  assert.equal(mismatches, 0, `${mismatches} of ${NAKSHATRA_REFERENCE.length} nakshatra indices disagreed with Swiss Ephemeris`);
});

test('NAKSHATRAS has 27 entries, each with a name', () => {
  assert.equal(S.NAKSHATRAS.length, 27);
  for (const name of S.NAKSHATRAS) assert.ok(name && typeof name === 'string');
});

// ---------------------------------------------------------------------------
// Tārābala — worked example cross-checked against two independent sources:
// birth Rohiṇī (#4 of 27, index 3), today Anurādhā (#17, index 16).
// ---------------------------------------------------------------------------

test('tarabala worked example: Rohiṇī to Anurādhā is Pratyari, unfavorable', () => {
  const r = S.tarabala(3, 16); // Rohiṇī index 3, Anurādhā index 16
  assert.equal(r.count, 14);
  assert.equal(r.taraIndex, 5);
  assert.equal(r.taraName, 'Pratyari');
  assert.equal(r.verdict, 'unfavorable');
  assert.equal(r.cycle, 2);
});

test('tarabala on your own birth star is Janma, mixed (not favorable or unfavorable)', () => {
  const r = S.tarabala(10, 10);
  assert.equal(r.count, 1);
  assert.equal(r.taraName, 'Janma');
  assert.equal(r.verdict, 'mixed');
});

test('tarabala count/tāra/cycle stay internally consistent across the whole 27-wheel', () => {
  for (let birth = 0; birth < 27; birth++) {
    for (let today = 0; today < 27; today++) {
      const r = S.tarabala(birth, today);
      assert.ok(r.count >= 1 && r.count <= 27, `count out of range: ${r.count}`);
      assert.ok(r.taraIndex >= 1 && r.taraIndex <= 9, `taraIndex out of range: ${r.taraIndex}`);
      assert.ok(r.cycle >= 1 && r.cycle <= 3, `cycle out of range: ${r.cycle}`);
      assert.equal(r.taraIndex, ((r.count - 1) % 9) + 1);
      assert.equal(r.cycle, Math.ceil(r.count / 9));
    }
  }
});

test('TARA_NAMES has 9 entries with a 3-state verdict, Janma is mixed not boolean', () => {
  assert.equal(S.TARA_NAMES.length, 9);
  const janma = S.TARA_NAMES[0];
  assert.equal(janma.name, 'Janma');
  assert.equal(janma.verdict, 'mixed');
  for (const t of S.TARA_NAMES) {
    assert.ok(['favorable', 'unfavorable', 'mixed', 'most favorable'].includes(t.verdict), t.verdict);
  }
});

// ---------------------------------------------------------------------------
// Moon phase — pure function of the Sun-Moon angle; also spot-checked
// against real full/new moon instants (pyswisseph-derived) run through
// astro.js's own Sun/Moon longitude.
// ---------------------------------------------------------------------------

test('moonPhase: new moon is ~0% illuminated, full moon is ~100%', () => {
  assert.equal(S.moonPhase(0, 0).name, 'new moon');
  assert.ok(S.moonPhase(0, 0).illumination < 0.01);
  assert.equal(S.moonPhase(0, 180).name, 'full moon');
  assert.ok(S.moonPhase(0, 180).illumination > 0.99);
  assert.equal(S.moonPhase(0, 90).name, 'first quarter');
  assert.ok(Math.abs(S.moonPhase(0, 90).illumination - 0.5) < 0.01);
  assert.equal(S.moonPhase(0, 270).name, 'last quarter');
});

test('moonPhase on real full/new moon instants (pyswisseph-derived JDs, via astro.js)', () => {
  const jdFull = 2461280.6795459054; // 2026-08-28 ~04:19 UT, verified full moon
  const jdNew = 2461265.2338375086;  // 2026-08-12 ~17:37 UT, verified new moon
  const full = S.moonPhase(A.sunLongitude(jdFull), A.moonLongitude(jdFull));
  const nw = S.moonPhase(A.sunLongitude(jdNew), A.moonLongitude(jdNew));
  assert.equal(full.name, 'full moon');
  assert.ok(full.illumination > 0.999, full.illumination);
  assert.equal(nw.name, 'new moon');
  assert.ok(nw.illumination < 0.001, nw.illumination);
});

// ---------------------------------------------------------------------------
// Planetary hours — Chaldean order, weekday-ruler mapping, and the polar
// day/night fallback (confirmed from astronomy-engine's own source to
// return null, not throw, when no rise/set event exists in the window).
// ---------------------------------------------------------------------------

test('PLANETARY_HOUR_ORDER is the classical Chaldean sequence', () => {
  assert.deepEqual(S.PLANETARY_HOUR_ORDER, ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']);
});

test('planetaryHours: a normal mid-latitude day has 12 day hours + 12 night hours, correctly ruled', async () => {
  // New York City, a real Tuesday. Tuesday's ruler is Mars (shards.js's
  // WEEKDAYS agrees: index 2 = 'Tuesday' / 'Mars').
  const r = await S.planetaryHours(new Date('2026-08-11T14:00:00Z'), 40.7128, -74.0060);
  assert.equal(r.available, true);
  assert.equal(r.dayHours.length, 12);
  assert.equal(r.nightHours.length, 12);
  assert.equal(A.weekdayOf(r.sunrise.getUTCFullYear(), r.sunrise.getUTCMonth() + 1, r.sunrise.getUTCDate()), 2); // Tuesday
  assert.equal(r.dayHours[0].planet, 'Mars');
  // Chaldean order continues across all 24 slots without gaps.
  const seq = [...r.dayHours, ...r.nightHours].map(h => h.planet);
  const startIdx = S.PLANETARY_HOUR_ORDER.indexOf('Mars');
  for (let i = 0; i < 24; i++) {
    assert.equal(seq[i], S.PLANETARY_HOUR_ORDER[(startIdx + i) % 7]);
  }
  // hours partition the day/night spans with no gaps or overlaps
  assert.equal(r.dayHours[0].start.getTime(), r.sunrise.getTime());
  assert.equal(r.dayHours[11].end.getTime(), r.sunset.getTime());
  assert.equal(r.nightHours[0].start.getTime(), r.sunset.getTime());
  assert.equal(r.nightHours[11].end.getTime(), r.nextSunrise.getTime());
});

test('planetaryHours: genuine polar day and polar night both return unavailable, not a crash', async () => {
  // 78N, summer solstice: the sun does not set for months.
  const summer = await S.planetaryHours(new Date('2026-06-21T12:00:00Z'), 78, 15);
  assert.deepEqual(summer, { available: false });
  // 78N, winter solstice: the sun does not rise for months.
  const winter = await S.planetaryHours(new Date('2026-12-21T12:00:00Z'), 78, 15);
  assert.deepEqual(winter, { available: false });
});
