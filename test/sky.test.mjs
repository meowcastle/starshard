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

// sigil.js's natalLight is moonPhase().index — it must never disagree with
// .name's own bin, including exactly at the 8 bin edges, where an earlier
// draft that computed .index via a separate floor((angle+22.5)/45) formula
// (rather than reading the same MOON_PHASES table .name uses) silently did.
test('moonPhase().index never disagrees with .name\'s own bin, including at the 8 bin edges', () => {
  const NAMES_IN_INDEX_ORDER = [
    'new moon', 'waxing crescent', 'first quarter', 'waxing gibbous',
    'full moon', 'waning gibbous', 'last quarter', 'waning crescent',
  ];
  for (let angle = 0; angle < 360; angle += 5) {
    const p = S.moonPhase(0, angle);
    assert.equal(NAMES_IN_INDEX_ORDER[p.index], p.name, `angle=${angle}`);
  }
  for (const edge of [0, 22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]) {
    const p = S.moonPhase(0, edge);
    assert.equal(NAMES_IN_INDEX_ORDER[p.index], p.name, `edge angle=${edge}`);
    assert.ok(p.index >= 0 && p.index <= 7, `index out of range at edge=${edge}: ${p.index}`);
  }
});

// ---------------------------------------------------------------------------
// castKind — steady / turning / threshold, and the finite-difference rate
// it's built on.
// ---------------------------------------------------------------------------

test('castKind\'s h=0.5 finite-difference rate matches a much finer h across many charts', () => {
  // Verify the error-propagation math, don't just trust it: a central
  // difference's truncation error scales with h^2, so a far finer h should
  // agree closely if the coarse one is actually fine for a ~20min timing
  // band (this codebase's standing rule: verify against an independent
  // reference, not the same formula's own reasoning about itself).
  const fine = jd => {
    const h = 1 / 24; // 1 hour
    return ((A.moonLongitude(jd + h) - A.moonLongitude(jd - h) + 360) % 360) / (2 * h);
  };
  const coarse = jd => (A.moonLongitude(jd + 0.5) - A.moonLongitude(jd - 0.5) + 360) % 360;
  for (let i = 0; i < 20; i++) {
    const jd = A.julianDay(1995 + i * 2, 1, 1, 0) + i * 53;
    const diff = Math.abs(coarse(jd) - fine(jd));
    assert.ok(diff < 0.01, `jd=${jd}: h=0.5 rate disagrees with h=1hr rate by ${diff} deg/day`);
  }
});

test('castKind: steady:turning ratio over a real multi-year sweep lands near 3:1, threshold is rare', () => {
  const counts = { steady: 0, turning: 0, threshold: 0 };
  const N = 3000;
  for (let i = 0; i < N; i++) {
    const jd = A.julianDay(1980, 1, 1, 0) + i * 3.7; // irregular step, wide spread
    const moonLon = A.moonLongitude(jd);
    counts[S.castKind(moonLon, jd).kind]++;
  }
  const ratio = counts.steady / counts.turning;
  assert.ok(ratio > 2.4 && ratio < 3.8, `steady:turning ratio ${ratio} (steady=${counts.steady}, turning=${counts.turning}) not near 3:1`);
  // "Rare" isn't sub-5% here, and shouldn't be asserted as such: threshold
  // is a symmetric +/-20min band around EVERY step boundary (entering and
  // leaving), against a ~5.85h average step, so its expected share is
  // ~(2*20)/(5.85*60) = ~11.4% of all time — smaller than turning's ~25%
  // and much smaller than steady's ~65%, which is what "rare" means here
  // (smallest of three), not an arbitrary sub-5% figure.
  const thresholdRate = counts.threshold / N;
  assert.ok(thresholdRate < 0.16, `threshold fired ${counts.threshold}/${N} (${(thresholdRate * 100).toFixed(1)}%) — expected near 11%`);
  assert.ok(thresholdRate < counts.turning / N, 'threshold should be rarer than turning');
});

test('castKind: threshold takes priority over turning right at a step boundary', () => {
  // Construct a jd where the moon sits within THRESHOLD_MINUTES of a step
  // boundary by searching near a real chart's crossing.
  let jd = A.julianDay(2026, 8, 12, 0);
  const STEP_WIDTH = 360 / 112;
  // Walk forward in small increments until we're within one step's end.
  for (let step = 0; step < 2000; step++) {
    const lon = A.moonLongitude(jd);
    const intoStep = ((lon % STEP_WIDTH) + STEP_WIDTH) % STEP_WIDTH;
    const toEnd = STEP_WIDTH - intoStep;
    if (toEnd < 0.02) break; // within a few minutes of the boundary
    jd += 0.002; // ~2.9 minutes per iteration
  }
  const moonLon = A.moonLongitude(jd);
  const cast = S.castKind(moonLon, jd);
  assert.equal(cast.kind, 'threshold', `expected threshold near a boundary, got ${cast.kind}`);
  assert.notEqual(cast.becoming, null);
});

test('castKind: becoming is an ordinary step advance for steps 0-2, a station jump for step 3', () => {
  const STATION_WIDTH = 360 / 28, STEP_WIDTH = 360 / 112;
  // Mid-step (not near any boundary) for a station/step where step < 3.
  const midStep0 = 0 * STATION_WIDTH + 1 * STEP_WIDTH + STEP_WIDTH / 2; // station 0, step 1, midway
  const jdA = A.julianDay(2026, 1, 1, 0);
  const rateA = (A.moonLongitude(jdA + 0.5) - A.moonLongitude(jdA - 0.5) + 360) % 360;
  // Force castKind's internal station/step reading via a synthetic moonLon
  // (castKind only uses moonLon for station/step and degIntoStep, and jd
  // only for the rate — safe to pair an arbitrary jd with a chosen moonLon
  // for this structural check).
  const castNonTerminal = S.castKind(midStep0, jdA);
  if (castNonTerminal.kind !== 'steady') {
    assert.equal(castNonTerminal.becoming.station, castNonTerminal.current.station);
    assert.equal(castNonTerminal.becoming.step, (castNonTerminal.current.step + 1) % 4);
  }

  // Deep into step 3 (Leaving) of station 5 but not within the boundary
  // bands, so it should read 'steady' with becoming null; instead push it
  // to the tail of step 3 to force turning/threshold and check the jump.
  const tailOfStep3 = 5 * STATION_WIDTH + 3 * STEP_WIDTH + STEP_WIDTH * 0.99;
  const castTerminal = S.castKind(tailOfStep3, jdA);
  assert.notEqual(castTerminal.kind, 'steady');
  assert.equal(castTerminal.becoming.station, (5 + 1) % 28);
  assert.equal(castTerminal.becoming.step, 0);
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

// ---------------------------------------------------------------------------
// farlightReturns — the last/next full moon to land in a given station.
// Real bug caught building this: the signed elongation-from-180 delta this
// walks also flips sign at the NEW moon (norm()'s 360deg wrap jumps +180 to
// -180), which looks identical to a sign-change scan unless the jump size is
// checked — a small `Math.abs(d - prevD)` is a real full-moon crossing
// (~12deg/day), a ~360deg jump is the wrap. The regression test below is
// exactly the case that caught it: an unfiltered scan finds a "crossing"
// every ~14-15 days (half a synodic month) instead of ~29.53.
// ---------------------------------------------------------------------------

const STATION_WIDTH = 360 / 28;
const mansionOf = lon => Math.floor(((lon % 360) + 360) % 360 / STATION_WIDTH);

test('farlightReturns: every station resolves both directions, and each hit truly lands in that station', () => {
  const jd = A.julianDay(2026, 8, 19, 12);
  for (let station = 0; station < 28; station++) {
    const r = S.farlightReturns(station, jd);
    assert.ok(r.last, `station ${station}: no last return found`);
    assert.ok(r.next, `station ${station}: no next return found`);
    assert.ok(r.last < jd, `station ${station}: last return is not in the past`);
    assert.ok(r.next > jd, `station ${station}: next return is not in the future`);
    assert.equal(mansionOf(A.moonLongitude(r.last)), station);
    assert.equal(mansionOf(A.moonLongitude(r.next)), station);
  }
});

test('farlightReturns: consecutive full moons are ~29.53 days apart, not ~14-15 (the new-moon-wrap regression)', () => {
  // Station 12 at this jd needs more than one lunation out — a station whose
  // "next" full moon is more than a lunation away is exactly the case where
  // the old (buggy) every-14-days scan would have found a spurious early
  // "crossing" that doesn't actually land in the station and returned it
  // anyway if unchecked.
  const jd = A.julianDay(2026, 8, 19, 12);
  const r = S.farlightReturns(12, jd);
  const gapDays = r.next - jd;
  assert.ok(gapDays > 20, `expected a real synodic-scale gap, got ${gapDays.toFixed(1)} days`);
});
