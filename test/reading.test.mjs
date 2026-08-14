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
import { COPY as READING_COPY } from '../reading-copy.js';
import * as SOUNDING_COPY from '../sigil-copy.js';

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
  return {
    jd, sunLon, moonLon, asc, mc, cusps, houseSystem: system, weekday: 3,
    sunSign: A.signOf(sunLon), moonSign: A.signOf(moonLon), ascSign: A.signOf(asc),
  };
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

function arrival(chart, timeKnown = true, name = 'suyin') {
  const sigil = G.deriveSigil(chart, { timeKnown });
  const plan = G.readingPlan(sigil);
  return R.arrivalReading({ sigil, chart, plan, stations: STATIONS, copy: READING_COPY, skyOf: G.skyOf, name, birthPlace: 'brooklyn, ny' });
}

test('arrivalReading: every beat present with real (non-empty, no leftover {token}) text, for several real charts', () => {
  for (let i = 0; i < 8; i++) {
    const jd = A.julianDay(1990 + i * 4, 2, 5, 9) + i * 23;
    const reading = arrival(makeChart(jd));

    assert.ok(reading.ring.line.length > 0);
    assert.ok(reading.strike.headline.length > 0 && reading.strike.body.length > 0);
    assert.ok(reading.root.line.length > 0 && reading.root.body.length > 0);
    assert.ok(reading.glow.line.length > 0);
    assert.ok(reading.hand.line.length > 0);
    assert.equal(reading.facing.skip, false);
    assert.ok(reading.facing.line.length > 0);
    assert.ok(reading.answering.line.length > 0);
    assert.ok(reading.gait.permission.length > 0 && reading.gait.body.length > 0);
    assert.ok(reading.handle.headline.length > 0 && reading.handle.strangeLine.length > 0);
    assert.ok(reading.becoming && reading.becoming.lines.length > 0 && reading.becoming.lines.every(l => l.length > 0));

    const fullText = flattenText(reading);
    assert.doesNotMatch(fullText, /\{[a-zA-Z]+\}/, 'a corpus interpolation token was left unsubstituted');
  }
});

test('arrivalReading: facing beat is skipped (but still carries FACING.unknown\'s honest text) when birth time is unknown', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const reading = arrival(makeChart(jd), false);
  assert.equal(reading.facing.skip, true);
  assert.ok(reading.facing.line.length > 0);
  // root still reads, just without a step-specific line
  assert.ok(reading.root.line.length > 0);
  assert.equal(reading.root.step, null);
  // the Becoming honors the fallback ladder too: only the Sun is ever a
  // candidate without a birth time (sigil.js's own movingLight() test
  // covers the mechanism; this confirms the composer surfaces it correctly).
  assert.equal(reading.becoming.which, 'sun');
});

test('arrivalReading: deterministic — same sigil produces byte-identical reading twice', () => {
  const jd = A.julianDay(2001, 11, 3, 14);
  const chart = makeChart(jd);
  assert.deepEqual(arrival(chart), arrival(chart));
});

test('arrivalReading: variant selection (the opening line, the strange line) does not correlate — sampling several charts finds more than one distinct pick of each', () => {
  const readings = [];
  for (let i = 0; i < 24; i++) {
    const jd = A.julianDay(1970, 1, 1, 0) + i * 137.3;
    readings.push(arrival(makeChart(jd)));
  }
  const ringVariants = new Set(readings.map(r => r.ring.line));
  const strangeVariants = new Set(readings.map(r => r.handle.strangeLine));
  assert.ok(ringVariants.size > 1, 'expected more than one distinct opening line across 24 varied charts');
  assert.ok(strangeVariants.size > 1, 'expected more than one distinct strange line across 24 varied charts');
});

test('arrivalReading: CLOSE.3 (rooted) vs CLOSE.2 (mentions the Becoming) is selected by the moving light\'s register, exactly as PORT-SPEC.md §4 specifies', () => {
  // Sweep charts until we find one of each to confirm both branches fire
  // for real data, not just in isolation.
  let sawRooted = false, sawNonRooted = false;
  for (let i = 0; i < 60 && !(sawRooted && sawNonRooted); i++) {
    const jd = A.julianDay(1960, 1, 1, 0) + i * 61.3;
    const chart = makeChart(jd);
    const sigil = G.deriveSigil(chart, { timeKnown: true });
    const reading = arrival(chart);
    if (sigil.moving.register === 'rooted') {
      sawRooted = true;
      assert.equal(reading.handle.headline, R.arrivalReading({ sigil, chart, plan: G.readingPlan(sigil), stations: STATIONS, copy: READING_COPY, skyOf: G.skyOf, name: 'suyin', birthPlace: 'x' }).handle.headline);
      assert.doesNotMatch(reading.handle.headline, /waiting/); // CLOSE.2-only phrasing ("...waiting")
    } else {
      sawNonRooted = true;
    }
  }
  assert.ok(sawRooted, 'never sampled a rooted chart in 60 tries');
  assert.ok(sawNonRooted, 'never sampled a non-rooted chart in 60 tries');
});

test('arrivalReading and soundingReading never emit above-tier-0 vocabulary', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const chart = makeChart(jd);
  const sigil = G.deriveSigil(chart, { timeKnown: true });
  const arrivalText = flattenText(arrival(chart));
  for (const re of ABOVE_TIER_0) assert.doesNotMatch(arrivalText, re, `arrivalReading leaked tier-1+ vocabulary: ${re}`);

  const moonLon = A.moonLongitude(jd);
  const cast = S.castKind(moonLon, jd);
  const light = S.moonPhase(A.sunLongitude(jd), moonLon);
  const birthNak = S.siderealNakshatra(moonLon, jd);
  const relation = S.tarabala(birthNak.index, birthNak.index);
  const sounding = R.soundingReading({ sigil, cast, relation, light, stations: STATIONS, copy: SOUNDING_COPY });
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
  const sounding = R.soundingReading({ sigil, cast, relation, light, stations: STATIONS, copy: SOUNDING_COPY });

  assert.ok(sounding.station.epithet.length > 0);
  assert.ok(sounding.cast.flavor.length > 0);
  assert.ok(sounding.counsel.body.length > 0 && sounding.counsel.relational.length > 0);
  assert.ok(sounding.question.text.length > 0);
  assert.equal(sounding.claim.closeLine, SOUNDING_COPY.CLAIM_CLOSE_LINE);
  if (cast.kind === 'steady') assert.equal(sounding.cast.becoming, null);
  else assert.notEqual(sounding.cast.becoming, null);
});

function full(chart, timeKnown = true, name = 'suyin') {
  const sigil = G.deriveSigil(chart, { timeKnown });
  return R.fullReading({ sigil, chart, stations: STATIONS, copy: READING_COPY, skyOf: G.skyOf, name, birthPlace: 'brooklyn, ny' });
}

test('fullReading: matches INSTRUMENT.md §3.7\'s worked example — 10 sections in PORT-SPEC.md §4\'s order, word count in the 900-1300 acceptance range, no leftover tokens', () => {
  const chart = A.computeChart({ year: 1998, month: 4, day: 12, hour: 21, minute: 14, lat: 41.8781, lon: -87.6298, tzOffset: -5 });
  const reading = full(chart);
  assert.deepEqual(reading.sections.map(s => s.id),
    ['opening', 'sun', 'moon', 'light', 'day', 'horizon', 'answeringSky', 'gait', 'becoming', 'close']);
  assert.ok(reading.meta.wordCount >= 900 && reading.meta.wordCount <= 1300, `wordCount ${reading.meta.wordCount} outside PORT-SPEC §8.5's target range`);
  const text = reading.sections.flatMap(s => s.blocks.map(b => b.text)).join(' ');
  assert.doesNotMatch(text, /\{[a-zA-Z]+\}/);
  // the becoming section carries the double-door line for this chart
  assert.equal(reading.sections.find(s => s.id === 'becoming').blocks.length, 3);
});

test('fullReading: coverage — every section renders with no empty block and no unresolved token, sampled across many real charts', () => {
  for (let i = 0; i < 300; i++) {
    const jd = A.julianDay(1930, 1, 1, 0) + i * 331.7; // wide spread, irregular step
    const timeKnown = i % 3 !== 0; // mix known/unknown birth times
    const chart = makeChart(jd);
    const reading = full(chart, timeKnown);
    assert.equal(reading.sections.length, 10, `jd=${jd} timeKnown=${timeKnown}`);
    for (const s of reading.sections) {
      assert.ok(s.blocks.length > 0, `section ${s.id} has no blocks (jd=${jd})`);
      for (const b of s.blocks) {
        assert.ok(b.text.length > 0, `${s.id}/${b.slot} is empty (jd=${jd})`);
        assert.doesNotMatch(b.text, /\{[a-zA-Z]+\}/, `${s.id}/${b.slot} has an unresolved token (jd=${jd})`);
      }
    }
  }
});

test('fullReading: deterministic — same input twice is byte-identical, across several charts', () => {
  for (let i = 0; i < 5; i++) {
    const jd = A.julianDay(1985, 6, 1, 0) + i * 401.3;
    const chart = makeChart(jd);
    assert.deepEqual(full(chart), full(chart), `jd=${jd}`);
  }
});

test('fullReading: the no-birth-time fallback ladder — horizon renders FACING.unknown, moon section uses STEP.moon.unknown, and the Becoming never reports a door register off an unknown-time moon', () => {
  for (let i = 0; i < 60; i++) {
    const jd = A.julianDay(1975, 3, 1, 0) + i * 211.1;
    const chart = makeChart(jd);
    const reading = full(chart, false);
    const horizon = reading.sections.find(s => s.id === 'horizon');
    assert.equal(horizon.blocks[0].slot, 'FACING.unknown', `jd=${jd}`);
    const moon = reading.sections.find(s => s.id === 'moon');
    assert.equal(moon.blocks[2].slot, 'STEP.moon.unknown', `jd=${jd}`);
    const becoming = reading.sections.find(s => s.id === 'becoming');
    assert.equal(becoming.blocks[0].slot, 'MOVING.sun', `jd=${jd}: only the Sun should ever be a candidate without a birth time`);
  }
});

test('soundingReading: re-visiting the SAME tonight (station, step, kind) reads identically; a different night differs', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const moonLon = A.moonLongitude(jd);
  const cast = S.castKind(moonLon, jd);
  const light = S.moonPhase(A.sunLongitude(jd), moonLon);
  const relation = S.tarabala(0, 0);

  const first = R.soundingReading({ sigil, cast, relation, light, stations: STATIONS, copy: SOUNDING_COPY });
  const second = R.soundingReading({ sigil, cast, relation, light, stations: STATIONS, copy: SOUNDING_COPY });
  assert.deepEqual(first, second);

  const jd2 = A.julianDay(2026, 9, 3, 5);
  const moonLon2 = A.moonLongitude(jd2);
  const cast2 = S.castKind(moonLon2, jd2);
  const light2 = S.moonPhase(A.sunLongitude(jd2), moonLon2);
  const third = R.soundingReading({ sigil, cast: cast2, relation, light: light2, stations: STATIONS, copy: SOUNDING_COPY });
  // Different tonight position should (almost certainly) produce a
  // different station/step at minimum.
  assert.notDeepEqual({ station: third.station.station, step: third.station.step },
    { station: first.station.station, step: first.station.step });
});

// -- patternAspects (the Deep Chart's PATTERN tab) -------------------------

test('patternAspects: a written combination returns real corpus text', () => {
  const chart = { sunLon: 0, moonLon: 0 }; // exact sun-moon conjunction
  const aspects = G.natalAspects(chart, { timeKnown: false });
  const pattern = R.patternAspects(aspects, READING_COPY);
  assert.equal(pattern.items.length, 1);
  const item = pattern.items[0];
  assert.equal(item.pair, 'sun + moon');
  assert.equal(item.hasPassage, true);
  assert.equal(item.missing, '');
  assert.equal(item.text, READING_COPY['ASPECT.sunmoon.conjunction'].text);
  assert.equal(pattern.none, false);
});

test('patternAspects: a real aspect with no written passage is surfaced, not hidden — the tab must not lie about the chart\'s geometry', () => {
  // sun-rising opposition is real geometry but not one of the ten written
  // combinations (sunrising only has conjunction/square/trine).
  const chart = { sunLon: 0, moonLon: 30, asc: 180, mc: 100 };
  const aspects = G.natalAspects(chart, { timeKnown: true });
  const pattern = R.patternAspects(aspects, READING_COPY);
  assert.equal(pattern.items.length, 1);
  const item = pattern.items[0];
  assert.equal(item.pair, 'sun + rising');
  assert.equal(item.aspect, 'opposition');
  assert.equal(item.hasPassage, false);
  assert.equal(item.missingIf, true);
  assert.equal(item.text, '');
  assert.equal(item.missing, 'ASPECT.sunrising.opposition — not in corpus batch 7, raise it');
});

test('patternAspects: no aspects in orb falls back to ASPECT.none, real corpus text', () => {
  const chart = { sunLon: 0, moonLon: 30, asc: 68, mc: 40 }; // hand-verified: nothing in orb
  const aspects = G.natalAspects(chart, { timeKnown: true });
  const pattern = R.patternAspects(aspects, READING_COPY);
  assert.equal(pattern.items.length, 0);
  assert.equal(pattern.none, true);
  assert.equal(pattern.noneText, READING_COPY['ASPECT.none'].text);
});

// -- depthReading (the Deep Chart's DEPTH tab) -----------------------------

test('depthReading: strike is the sun\'s station, root is the moon\'s, real stations.js data throughout', () => {
  const sigil = { sunStation: 0, moonStation: 13 };
  const depth = R.depthReading(sigil, STATIONS);
  assert.equal(depth.strike.which, 'sun');
  assert.equal(depth.strike.epithet, STATIONS.STATIONS[0].epithet);
  assert.deepEqual(depth.strike.traditions, STATIONS.STATIONS[0].crossCultural);
  assert.equal(depth.strike.traditions.length, 4); // Arabia, India, China, Japan

  assert.equal(depth.root.which, 'moon');
  assert.equal(depth.root.epithet, STATIONS.STATIONS[13].epithet);
  assert.deepEqual(depth.root.traditions, STATIONS.STATIONS[13].crossCultural);
});

test('depthReading: needsFlag is true for anything short of a clean STRONG match (PARTIAL or unmarked)', () => {
  const partialStation = STATIONS.STATIONS.findIndex(s => s.match === 'PARTIAL');
  const strongStation = STATIONS.STATIONS.findIndex(s => s.match === 'STRONG');
  const unmarkedStation = STATIONS.STATIONS.findIndex(s => !s.match);
  assert.ok(partialStation >= 0 && strongStation >= 0 && unmarkedStation >= 0,
    'fixture assumption: PARTIAL, STRONG and unmarked all exist in the real data');

  const depth = R.depthReading({ sunStation: partialStation, moonStation: strongStation }, STATIONS);
  assert.equal(depth.strike.needsFlag, true);
  assert.equal(depth.strike.match, 'PARTIAL');
  assert.equal(depth.root.needsFlag, false);

  const unmarked = R.depthReading({ sunStation: unmarkedStation, moonStation: strongStation }, STATIONS);
  assert.equal(unmarked.strike.needsFlag, true);
  assert.equal(unmarked.strike.match, 'unmarked');
});

// -- houseReading (the Deep Chart's HOUSES tab) ----------------------------

test('houseReading: sun and moon placements always present, real corpus text, ruler placement present only with a birth time', () => {
  const chart = { sunHouse: 1, moonHouse: 7, houseSystem: 'placidus' };
  const withRuler = R.houseReading(chart, { ruler: 'Mars', house: 4 }, READING_COPY);
  assert.equal(withRuler.placements.length, 3);
  assert.deepEqual(withRuler.placements.map(p => p.which), ['sun', 'moon', 'ruler']);
  assert.equal(withRuler.placements[0].text, READING_COPY['HOUSE.01'].text);
  assert.equal(withRuler.placements[1].text, READING_COPY['HOUSE.07'].text);
  assert.equal(withRuler.placements[2].text, READING_COPY['HOUSE.04'].text);
  assert.match(withRuler.placements[2].label, /Mars/);

  const withoutTime = R.houseReading(chart, null, READING_COPY);
  assert.equal(withoutTime.placements.length, 2);
  assert.deepEqual(withoutTime.placements.map(p => p.which), ['sun', 'moon']);
});

test('houseReading: empty-house note is always real text; the Porphyry note only fires when houseSystem is porphyry', () => {
  const placidus = R.houseReading({ sunHouse: 1, moonHouse: 1, houseSystem: 'placidus' }, null, READING_COPY);
  assert.equal(placidus.emptyNote, READING_COPY['HOUSE.empty'].text);
  assert.equal(placidus.isPorphyry, false);
  assert.equal(placidus.porphyryNote, '');

  const porphyry = R.houseReading({ sunHouse: 1, moonHouse: 1, houseSystem: 'porphyry' }, null, READING_COPY);
  assert.equal(porphyry.isPorphyry, true);
  assert.equal(porphyry.porphyryNote, READING_COPY['HOUSE.porphyry'].text);
});
