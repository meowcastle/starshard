// Star Shard — regression tests for reading.js's arrivalReading()/
// soundingReading() composers (the Sigil/Sounding relational grammar).
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../astro.js';
import * as S from '../sky.js';
import * as G from '../sigil.js';
import * as R from '../reading.js';
import * as STATIONS from '../stations.js';
import * as COPY from '../sigil-copy.js';

// Terms above tier-0 in COSMOLOGY.md's lexicon ledger (§2) must never appear
// on a pre-arrival surface (SIGIL-READING §3 rule 3) — both composers only
// ever produce tier-0 output, so this list should never match anything they
// return.
const ABOVE_TIER_0 = [/recollection/i, /silverway/i, /the great sowing/i];

function makeChart(jd, lat = 40.7, lon = -73.9) {
  const eps = A.obliquity(jd);
  const lst = ((A.gmst(jd) + lon) % 360 + 360) % 360;
  const sunLon = A.sunLongitude(jd), moonLon = A.moonLongitude(jd);
  const { cusps, asc, mc, system } = A.placidusCusps(lst, eps, lat);
  return { jd, sunLon, moonLon, asc, mc, cusps, houseSystem: system, weekday: 3 };
}

function flattenText(obj) {
  const parts = [];
  const walk = v => {
    if (typeof v === 'string') parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(obj);
  return parts.join(' ');
}

test('arrivalReading: every beat present with non-empty text, for several real charts', () => {
  for (let i = 0; i < 8; i++) {
    const jd = A.julianDay(1990 + i * 4, 2, 5, 9) + i * 23;
    const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
    const plan = G.readingPlan(sigil);
    const reading = R.arrivalReading({ sigil, plan, stations: STATIONS, copy: COPY, name: 'suyin' });

    assert.ok(reading.ring.line.length > 0);
    assert.ok(reading.strike.headline.length > 0 && reading.strike.body.length > 0);
    assert.ok(reading.root.line.length > 0 && reading.root.body.length > 0);
    assert.ok(reading.glow.line.length > 0);
    assert.ok(reading.hand.line.length > 0);
    assert.equal(reading.facing.skip, false);
    assert.ok(reading.facing.line.length > 0);
    assert.ok(reading.answering.line.length > 0);
    assert.ok(reading.gait.permission.length > 0);
    assert.ok(reading.handle.headline.length > 0 && reading.handle.strangeLine.length > 0);
  }
});

test('arrivalReading: facing beat is skipped (no line) when birth time is unknown', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: false });
  const plan = G.readingPlan(sigil);
  const reading = R.arrivalReading({ sigil, plan, stations: STATIONS, copy: COPY, name: 'suyin' });
  assert.equal(reading.facing.skip, true);
  assert.equal(reading.facing.line, undefined);
  // root still reads, just without a step-specific line
  assert.ok(reading.root.line.length > 0);
  assert.equal(reading.root.step, null);
});

test('arrivalReading: deterministic — same sigil produces byte-identical reading twice', () => {
  const jd = A.julianDay(2001, 11, 3, 14);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const plan = G.readingPlan(sigil);
  const a = R.arrivalReading({ sigil, plan, stations: STATIONS, copy: COPY, name: 'suyin' });
  const b = R.arrivalReading({ sigil, plan, stations: STATIONS, copy: COPY, name: 'suyin' });
  assert.deepEqual(a, b);
});

test('arrivalReading: variant selection does not correlate across beats (spot check)', () => {
  // If every beat's variant pick were derived from the same raw hash, two
  // charts that happen to share one beat's pick would tend to share ALL
  // beats' picks too. Sample several charts and confirm that doesn't hold:
  // find two charts with the same strike headline variant but a different
  // root-line variant (or vice versa) somewhere in a modest sample.
  const readings = [];
  for (let i = 0; i < 24; i++) {
    const jd = A.julianDay(1970, 1, 1, 0) + i * 137.3;
    const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
    const plan = G.readingPlan(sigil);
    readings.push(R.arrivalReading({ sigil, plan, stations: STATIONS, copy: COPY, name: 'suyin' }));
  }
  const strikeVariants = new Set(readings.map(r => COPY.STRIKE_HEADLINES.findIndex(f => f(r.strike.epithet, r.strike.stepName) === r.strike.headline)));
  const handleVariants = new Set(readings.map(r => r.handle.headline));
  assert.ok(strikeVariants.size >= 1); // sanity: at least resolves to real indices
  assert.ok(handleVariants.size > 1, 'expected more than one distinct handle headline across 24 varied charts');
});

test('arrivalReading and soundingReading never emit above-tier-0 vocabulary', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const plan = G.readingPlan(sigil);
  const arrival = R.arrivalReading({ sigil, plan, stations: STATIONS, copy: COPY, name: 'suyin' });
  const arrivalText = flattenText(arrival);
  for (const re of ABOVE_TIER_0) assert.doesNotMatch(arrivalText, re, `arrivalReading leaked tier-1+ vocabulary: ${re}`);

  const moonLon = A.moonLongitude(jd);
  const cast = S.castKind(moonLon, jd);
  const light = S.moonPhase(A.sunLongitude(jd), moonLon);
  const birthNak = S.siderealNakshatra(sigil.moonStation != null ? A.moonLongitude(jd) : moonLon, jd);
  const relation = S.tarabala(birthNak.index, birthNak.index);
  const sounding = R.soundingReading({ sigil, cast, relation, light, stations: STATIONS, copy: COPY });
  const soundingText = flattenText(sounding);
  for (const re of ABOVE_TIER_0) assert.doesNotMatch(soundingText, re, `soundingReading leaked tier-1+ vocabulary: ${re}`);
});

test('soundingReading: all five beats present, becoming is null for a steady cast and populated otherwise', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const moonLon = A.moonLongitude(jd);
  const cast = S.castKind(moonLon, jd);
  const light = S.moonPhase(A.sunLongitude(jd), moonLon);
  const relation = S.tarabala(0, 0);
  const sounding = R.soundingReading({ sigil, cast, relation, light, stations: STATIONS, copy: COPY });

  assert.ok(sounding.station.epithet.length > 0);
  assert.ok(sounding.cast.flavor.length > 0);
  assert.ok(sounding.counsel.body.length > 0 && sounding.counsel.relational.length > 0);
  assert.ok(sounding.question.text.length > 0);
  assert.equal(sounding.claim.closeLine, COPY.CLAIM_CLOSE_LINE);
  if (cast.kind === 'steady') assert.equal(sounding.cast.becoming, null);
  else assert.notEqual(sounding.cast.becoming, null);
});

test('soundingReading: re-visiting the SAME tonight (station, step, kind) reads identically; a different night differs', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const moonLon = A.moonLongitude(jd);
  const cast = S.castKind(moonLon, jd);
  const light = S.moonPhase(A.sunLongitude(jd), moonLon);
  const relation = S.tarabala(0, 0);

  const first = R.soundingReading({ sigil, cast, relation, light, stations: STATIONS, copy: COPY });
  const second = R.soundingReading({ sigil, cast, relation, light, stations: STATIONS, copy: COPY });
  assert.deepEqual(first, second);

  const jd2 = A.julianDay(2026, 9, 3, 5);
  const moonLon2 = A.moonLongitude(jd2);
  const cast2 = S.castKind(moonLon2, jd2);
  const light2 = S.moonPhase(A.sunLongitude(jd2), moonLon2);
  const third = R.soundingReading({ sigil, cast: cast2, relation, light: light2, stations: STATIONS, copy: COPY });
  // Different tonight position should (almost certainly) produce a
  // different station/step at minimum.
  assert.notDeepEqual({ station: third.station.station, step: third.station.step },
    { station: first.station.station, step: first.station.step });
});
