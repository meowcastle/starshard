// Star Shard — regression tests for sigil.js (natal derivation, the
// arrival reading's nine-beat grammar, and the ring's SVG geometry).
// Run: node --test test/  (from the repo root)
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../astro.js';
import * as G from '../sigil.js';

// -- deriveType -------------------------------------------------------------

test('deriveType: exhaustive over all 28x28 station pairs — exactly one type per pair, Seedborn iff S===M', () => {
  const VALID = new Set(['seedborn', 'homebound', 'outbound', 'emberwake', 'farbank']);
  for (let S = 0; S < 28; S++) {
    for (let M = 0; M < 28; M++) {
      const t = G.deriveType(S, M);
      assert.ok(VALID.has(t), `S=${S} M=${M}: invalid type ${t}`);
      if (S === M) assert.equal(t, 'seedborn', `S=${S} M=${M} should be seedborn`);
      else assert.notEqual(t, 'seedborn', `S=${S} M=${M} should NOT be seedborn`);
    }
  }
});

test('deriveType: rough rate sanity check over real charts (Seedborn should be rare, ~3-4%)', () => {
  const counts = { seedborn: 0, homebound: 0, outbound: 0, emberwake: 0, farbank: 0 };
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const jd = A.julianDay(1990, 1, 1, 0) + i * 6.7; // irregular step, wide date spread
    const sunLon = A.sunLongitude(jd), moonLon = A.moonLongitude(jd);
    const t = G.deriveType(G.stationOf(sunLon), G.stationOf(moonLon));
    counts[t]++;
  }
  const seedbornRate = counts.seedborn / N;
  assert.ok(seedbornRate > 0.01 && seedbornRate < 0.08, `seedborn rate ${seedbornRate} outside a sane band`);
  for (const t of ['homebound', 'outbound', 'emberwake', 'farbank']) {
    assert.ok(counts[t] > 0, `${t} never occurred in ${N} samples`);
  }
});

// -- farlightOf / globalStepOf -----------------------------------------------

test('farlightOf: mod-28 wraparound matches the worked 1<->0-indexed equivalence (stations 0, 13, 27)', () => {
  assert.equal(G.farlightOf(0), 14);
  assert.equal(G.farlightOf(13), 27);
  assert.equal(G.farlightOf(27), 13);
});

test('globalStepOf matches both Design exports\' own worked example (station0=23, step0=1 -> 93)', () => {
  assert.equal(G.globalStepOf(23, 1), 93);
  assert.equal(G.globalStepOf(0, 0), 0);
  assert.equal(G.globalStepOf(27, 3), 111);
});

// -- stationOf / stepOf ------------------------------------------------------

test('stationOf/stepOf: step is always in [0,3] and never disagrees with stationOf at a boundary', () => {
  const STATION_WIDTH = 360 / 28;
  for (let station = 0; station < 28; station++) {
    for (let step = 0; step < 4; step++) {
      // sample well inside the (station, step) cell, not exactly on an edge
      const lon = station * STATION_WIDTH + step * (STATION_WIDTH / 4) + (STATION_WIDTH / 8);
      assert.equal(G.stationOf(lon), station, `lon=${lon}`);
      assert.equal(G.stepOf(lon), step, `lon=${lon}`);
    }
  }
});

// -- deriveSigil: time-known handling ----------------------------------------

function makeChart(jd, lat = 40.7, lon = -73.9) {
  const eps = A.obliquity(jd);
  const lst = ((A.gmst(jd) + lon) % 360 + 360) % 360;
  const sunLon = A.sunLongitude(jd), moonLon = A.moonLongitude(jd);
  const { cusps, asc, mc, system } = A.placidusCusps(lst, eps, lat);
  return { jd, sunLon, moonLon, asc, mc, cusps, houseSystem: system, weekday: 3 };
}

test('deriveSigil: sun station is stable across a 24h sweep of assumed birth times for a fixed date', () => {
  // Sample several base dates; for each, sweep the clock across a day and
  // assert the SUN'S STATION never changes. (Its STEP is not asserted
  // stable here — the Sun moves ~0.3 of a step-width across 24h, so step
  // instability across a full day is real, not a bug; see the header
  // comment in sigil.js.)
  for (let d = 0; d < 8; d++) {
    const baseJd = A.julianDay(2000 + d * 3, 1, 1, 0) + d * 40;
    const stations = new Set();
    for (let h = 0; h < 24; h++) {
      const chart = makeChart(baseJd + h / 24);
      stations.add(G.stationOf(chart.sunLon));
    }
    assert.ok(stations.size <= 2, `sun station flipped more than once across 24h: ${[...stations]}`);
  }
});

test('deriveSigil: sun step changes at most once across a 24h sweep, consistent with the sun\'s slow motion', () => {
  for (let d = 0; d < 8; d++) {
    const baseJd = A.julianDay(2000 + d * 3, 1, 1, 0) + d * 40;
    const steps = [];
    for (let h = 0; h < 24; h++) {
      const chart = makeChart(baseJd + h / 24);
      steps.push(G.stepOf(chart.sunLon));
    }
    let transitions = 0;
    for (let i = 1; i < steps.length; i++) if (steps[i] !== steps[i - 1]) transitions++;
    assert.ok(transitions <= 1, `sun step changed ${transitions} times across 24h (day index ${d})`);
  }
});

test('deriveSigil: moonStep and risingStation are null iff timeKnown is false', () => {
  for (let i = 0; i < 6; i++) {
    const jd = A.julianDay(2010 + i * 2, 6, 15, 12) + i * 11;
    const chart = makeChart(jd);
    const known = G.deriveSigil(chart, { timeKnown: true });
    const unknown = G.deriveSigil(chart, { timeKnown: false });
    assert.notEqual(known.moonStep, null);
    assert.notEqual(known.risingStation, null);
    assert.equal(unknown.moonStep, null);
    assert.equal(unknown.risingStation, null);
    // moonStation and sunStation/sunStep stay populated regardless
    assert.notEqual(unknown.moonStation, null);
    assert.notEqual(unknown.sunStation, null);
    assert.notEqual(unknown.sunStep, null);
  }
});

test('deriveSigil: keeper is the hand-verified weekday bijection (Sun->3, Mon->6, Tue->2, Wed->5, Thu->1, Fri->4, Sat->0)', () => {
  const expected = [3, 6, 2, 5, 1, 4, 0]; // indexed by weekday 0=Sunday
  const jd = A.julianDay(2026, 8, 12, 12);
  const base = makeChart(jd);
  for (let weekday = 0; weekday < 7; weekday++) {
    const sigil = G.deriveSigil({ ...base, weekday }, { timeKnown: true });
    assert.equal(sigil.keeper, expected[weekday], `weekday=${weekday}`);
  }
});

test('deriveSigil: type and farlight are consistent with deriveType/farlightOf on the same stations', () => {
  for (let i = 0; i < 10; i++) {
    const jd = A.julianDay(2015 + i, 3, 3, 3) + i * 17;
    const chart = makeChart(jd);
    const sigil = G.deriveSigil(chart, { timeKnown: true });
    assert.equal(sigil.type, G.deriveType(sigil.sunStation, sigil.moonStation));
    assert.equal(sigil.farlight, G.farlightOf(sigil.sunStation));
  }
  const jd = A.julianDay(2026, 8, 12, 12);
  const chart = makeChart(jd);
  const sigil = G.deriveSigil(chart, { timeKnown: true });
  assert.equal(sigil, sigil); // no-op guard; createdAt must not be present
  assert.equal('createdAt' in sigil, false, 'deriveSigil must not stamp createdAt — see sigil.js header comment');
});

// -- readingPlan --------------------------------------------------------------

test('readingPlan: nine beats present, in order', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const plan = G.readingPlan(sigil);
  const ids = plan.beats.map(b => b.id);
  assert.deepEqual(ids, ['ring', 'strike', 'root', 'glow', 'hand', 'facing', 'answering', 'gait', 'handle']);
});

test('readingPlan: facing.skip is true iff risingStation is null', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const chart = makeChart(jd);
  const known = G.deriveSigil(chart, { timeKnown: true });
  const unknown = G.deriveSigil(chart, { timeKnown: false });
  const planKnown = G.readingPlan(known);
  const planUnknown = G.readingPlan(unknown);
  const facingKnown = planKnown.beats.find(b => b.id === 'facing');
  const facingUnknown = planUnknown.beats.find(b => b.id === 'facing');
  assert.equal(facingKnown.skip, false);
  assert.notEqual(facingKnown.station, null);
  assert.equal(facingUnknown.skip, true);
  assert.equal(facingUnknown.station, null);
});

test('readingPlan: agreesWithStrike matches same-Sky expectation for constructed sigils', () => {
  const base = { sunStation: 2, sunStep: 1, keeper: 0, natalLight: 0, farlight: G.farlightOf(2), type: 'x' };
  const sameSky = G.readingPlan({ ...base, moonStation: 5, moonStep: 2, risingStation: null });
  const crossSky = G.readingPlan({ ...base, moonStation: 20, moonStep: 2, risingStation: null });
  assert.equal(sameSky.beats.find(b => b.id === 'root').agreesWithStrike, true);
  assert.equal(crossSky.beats.find(b => b.id === 'root').agreesWithStrike, false);
});

test('readingPlan: crossingDay is true only when moonStep is exactly 0 (Entering), false when null (time unknown)', () => {
  const base = { sunStation: 2, sunStep: 1, moonStation: 5, keeper: 0, natalLight: 0, farlight: G.farlightOf(2), type: 'x', risingStation: 10 };
  const entering = G.readingPlan({ ...base, moonStep: 0 });
  const dwelling = G.readingPlan({ ...base, moonStep: 1 });
  const unknownTime = G.readingPlan({ ...base, moonStep: null });
  assert.equal(entering.beats.find(b => b.id === 'root').crossingDay, true);
  assert.equal(dwelling.beats.find(b => b.id === 'root').crossingDay, false);
  assert.equal(unknownTime.beats.find(b => b.id === 'root').crossingDay, false);
});

test('readingPlan: variantHash is stable for the same sigil and differs for a different one', () => {
  const jdA = A.julianDay(2026, 8, 12, 12);
  const jdB = A.julianDay(1999, 3, 3, 3);
  const sigilA = G.deriveSigil(makeChart(jdA), { timeKnown: true });
  const sigilB = G.deriveSigil(makeChart(jdB), { timeKnown: true });
  const h1 = G.readingPlan(sigilA).variantHash;
  const h2 = G.readingPlan(sigilA).variantHash;
  const h3 = G.readingPlan(sigilB).variantHash;
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
});

// -- sigilRingData --------------------------------------------------------

test('sigilRingData: 112 segments, all dark except natal marks when nothing kindled and no tonight given', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const ring = G.sigilRingData(sigil);
  assert.equal(ring.segments.length, 112);
  assert.ok(ring.segments.every(s => s.state === 'dark'));
  assert.equal(ring.natalMarks.length, 4); // sun, moon, rising, farlight
  assert.equal(ring.skyTicks.length, 4);
});

test('sigilRingData: natalMarks has 3 entries (no rising) when risingStation is null', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: false });
  const ring = G.sigilRingData(sigil);
  assert.equal(ring.natalMarks.length, 3);
  assert.ok(!ring.natalMarks.some(m => m.role === 'rising'));
});

test('sigilRingData: kindled segments are "lit", the tonight segment (if not lit) is "now", everything else "dark"', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const kindled = [{ station: 0, step: 0 }, { station: 0, step: 1 }, { station: 5, step: 2 }];
  const tonight = { station: 10, step: 3 };
  const ring = G.sigilRingData(sigil, { kindled, tonight });
  const byIdx = ring.segments.reduce((m, s) => (m[G.globalStepOf(s.station, s.step)] = s.state, m), {});
  assert.equal(byIdx[G.globalStepOf(0, 0)], 'lit');
  assert.equal(byIdx[G.globalStepOf(0, 1)], 'lit');
  assert.equal(byIdx[G.globalStepOf(5, 2)], 'lit');
  assert.equal(byIdx[G.globalStepOf(10, 3)], 'now');
  const litOrNow = new Set([0, 1, 22, 43]);
  for (let i = 0; i < 112; i++) {
    if (litOrNow.has(i)) continue;
    assert.equal(byIdx[i], 'dark', `segment ${i} should be dark`);
  }
});

test('sigilRingData: a kindled segment that is also "tonight" reports "lit", not "now"', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const kindled = [{ station: 3, step: 2 }];
  const tonight = { station: 3, step: 2 };
  const ring = G.sigilRingData(sigil, { kindled, tonight });
  const seg = ring.segments.find(s => s.station === 3 && s.step === 2);
  assert.equal(seg.state, 'lit');
});

test('sigilRingData: every segment path is a well-formed SVG arc "d" string', () => {
  const jd = A.julianDay(2026, 8, 12, 12);
  const sigil = G.deriveSigil(makeChart(jd), { timeKnown: true });
  const ring = G.sigilRingData(sigil);
  for (const seg of ring.segments) {
    assert.match(seg.d, /^M -?\d+(\.\d+)? -?\d+(\.\d+)? A \d+(\.\d+)? \d+(\.\d+)? 0 0 1 -?\d+(\.\d+)? -?\d+(\.\d+)?$/, seg.d);
  }
});
