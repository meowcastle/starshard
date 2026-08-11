// Star Shard — regression tests for the ephemeris and formatting.
// Run: node --test test/  (from the repo root)
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../astro.js';
import { degFmt, ordinal } from '../format.js';

const OLD = await import('./fixtures/astro.legacy.mjs').catch(() => null);
const norm = d => ((d % 360) + 360) % 360;
const angDiff = (a, b) => { const x = Math.abs(norm(a - b)); return Math.min(x, 360 - x); };

// ---------------------------------------------------------------------------
// W4 — degFmt must carry minutes into degrees and degrees into the next sign.
// ---------------------------------------------------------------------------

test('degFmt never prints 60 minutes', () => {
  for (let i = 0; i < 360000; i++) {
    const lon = i / 1000;
    const s = degFmt(lon);
    assert.ok(!/°60′/.test(s), `degFmt(${lon}) = ${s}`);
    const m = s.match(/^(\d+)°(\d{2})′/);
    assert.ok(m, `unparseable: ${s}`);
    assert.ok(+m[1] >= 0 && +m[1] <= 29, `degree out of range in ${s}`);
    assert.ok(+m[2] >= 0 && +m[2] <= 59, `minute out of range in ${s}`);
  }
});

test('degFmt rolls over into the next sign', () => {
  assert.equal(degFmt(12.9955), '13°00′ Aries');
  assert.equal(degFmt(29.9955), '0°00′ Taurus');
  assert.equal(degFmt(359.9955), '0°00′ Aries');
  assert.equal(degFmt(89.99999), '0°00′ Cancer');
  // unaffected values are unchanged
  assert.equal(degFmt(0), '0°00′ Aries');
  assert.equal(degFmt(14.3167), '14°19′ Aries');
  assert.equal(degFmt(215.7), '5°42′ Scorpio');
});

test('ordinal', () => {
  const got = [1,2,3,4,10,11,12,13,20,21,22,23,28,101,111].map(ordinal);
  assert.deepEqual(got, ['1st','2nd','3rd','4th','10th','11th','12th','13th',
    '20th','21st','22nd','23rd','28th','101st','111th']);
});

// ---------------------------------------------------------------------------
// W3 — weekday comes from the LOCAL calendar date, not the UT-shifted instant.
// ---------------------------------------------------------------------------

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

test('weekdayOf matches the civil calendar', () => {
  const cases = [
    [2000, 1, 1, 'Saturday'], [1969, 7, 20, 'Sunday'], [1929, 10, 29, 'Tuesday'],
    [2020, 2, 29, 'Saturday'], [1930, 1, 1, 'Wednesday'], [1989, 6, 6, 'Tuesday'],
    [2026, 8, 11, 'Tuesday'], [1900, 3, 1, 'Thursday'], [2100, 1, 1, 'Friday'],
  ];
  for (const [y, m, d, want] of cases) {
    assert.equal(DAYS[A.weekdayOf(y, m, d)], want, `${y}-${m}-${d}`);
  }
});

test('weekday survives timezone shifts near midnight', () => {
  // Each case is a birth that lands on a different UT date than local date.
  const cases = [
    { d: [1985, 6, 15], h: 23, mi: 0, tz: -8, want: 'Saturday' },  // Los Angeles
    { d: [1990, 3, 5], h: 23, mi: 30, tz: -5, want: 'Monday' },    // New York
    { d: [2001, 9, 12], h: 6, mi: 0, tz: 9, want: 'Wednesday' },   // Tokyo
    { d: [1976, 7, 2], h: 8, mi: 0, tz: 10, want: 'Friday' },      // Sydney
    { d: [1999, 12, 31], h: 23, mi: 59, tz: -5, want: 'Friday' },
    { d: [2000, 1, 1], h: 0, mi: 30, tz: 13, want: 'Saturday' },
  ];
  for (const c of cases) {
    const ch = A.computeChart({ year: c.d[0], month: c.d[1], day: c.d[2],
      hour: c.h, minute: c.mi, lat: 40, lon: -74, tzOffset: c.tz });
    assert.equal(DAYS[ch.weekday], c.want,
      `${c.d.join('-')} ${c.h}:${c.mi} tz${c.tz}`);
  }
});

test('weekday is correct for every hour in every whole-hour timezone', () => {
  let wrong = 0, total = 0;
  for (let tz = -12; tz <= 14; tz++) {
    for (let h = 0; h < 24; h++) {
      const ch = A.computeChart({ year: 1994, month: 5, day: 18, hour: h, minute: 0,
        lat: 35, lon: 139, tzOffset: tz });
      total++;
      if (DAYS[ch.weekday] !== 'Wednesday') wrong++;   // 1994-05-18 was a Wednesday
    }
  }
  assert.equal(wrong, 0, `${wrong}/${total} wrong weekdays`);
});

// ---------------------------------------------------------------------------
// W5 — above the polar circle: correct rising node, and a real 12-house partition.
// ---------------------------------------------------------------------------

function spansSumTo360(cusps) {
  let t = 0;
  for (let i = 0; i < 12; i++) t += norm(cusps[(i + 1) % 12] - cusps[i]);
  return t;
}

test('cusps always partition the circle exactly once', () => {
  for (let lat = -85; lat <= 85; lat += 2.5) {
    for (let ramc = 0; ramc < 360; ramc += 7) {
      const { cusps } = A.placidusCusps(ramc, 23.44, lat);
      const t = spansSumTo360(cusps);
      assert.ok(Math.abs(t - 360) < 1e-6, `lat=${lat} ramc=${ramc} spans sum to ${t}`);
    }
  }
});

test('every house is reachable at every latitude', () => {
  // Sample the midpoint of each house's own span rather than a fixed grid:
  // near the poles quadrant systems legitimately produce houses narrower than
  // any reasonable step (0.12 deg at lat 78), and a grid would miss them.
  for (const lat of [0, 40, 60, 66, 67, 70, 72, 78, -70, -78]) {
    for (const ramc of [0, 47, 113, 191, 265, 331]) {
      const { cusps } = A.placidusCusps(ramc, 23.44, lat);
      for (let i = 0; i < 12; i++) {
        const span = norm(cusps[(i + 1) % 12] - cusps[i]);
        assert.ok(span > 0, `lat=${lat} ramc=${ramc} house ${i + 1} has zero width`);
        const mid = norm(cusps[i] + span / 2);
        assert.equal(A.houseOf(mid, cusps), i + 1,
          `lat=${lat} ramc=${ramc}: midpoint of house ${i + 1} resolved elsewhere`);
      }
    }
  }
});

test('ascendant is genuinely the rising node, not the descendant', () => {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const eps = 23.44;
  const raOf = lam => norm(Math.atan2(Math.sin(lam*D2R)*Math.cos(eps*D2R), Math.cos(lam*D2R)) * R2D);
  for (const lat of [0, 35, 55, 66, 67, 70, 75, 80, -68]) {
    for (let ramc = 0; ramc < 360; ramc += 3) {
      const asc = A.ascendant(ramc, eps, lat);
      let ha = norm(ramc - raOf(asc));
      if (ha > 180) ha -= 360;
      // rising means east of the meridian: hour angle strictly negative
      assert.ok(ha <= 0.001, `lat=${lat} ramc=${ramc}: asc=${asc.toFixed(2)} has HA=${ha.toFixed(2)} (setting)`);
    }
  }
});

test('polar charts declare the fallback house system', () => {
  const polar = A.computeChart({ year: 1967, month: 11, day: 20, hour: 23, minute: 6,
    lat: 67.0, lon: -142.554, tzOffset: 0 });
  assert.equal(polar.houseSystem, 'porphyry');
  const nyc = A.computeChart({ year: 1989, month: 6, day: 6, hour: 16, minute: 40,
    lat: 40.71, lon: -74.01, tzOffset: -5 });
  assert.equal(nyc.houseSystem, 'placidus');
});

test('the 1967 Alaska case no longer returns the opposite rising sign', () => {
  const c = A.computeChart({ year: 1967, month: 11, day: 20, hour: 23, minute: 6,
    lat: 67.0, lon: -142.554, tzOffset: 0 });
  // Swiss Ephemeris: 77.434 deg = Gemini. The old code returned 257.477 = Sagittarius.
  assert.equal(A.SIGNS[c.ascSign], 'Gemini');
  assert.ok(angDiff(c.asc, 77.434) < 0.5, `asc=${c.asc}`);
});

// ---------------------------------------------------------------------------
// No regression for the inhabited latitude band the fixes were not meant to touch.
// ---------------------------------------------------------------------------

test('sub-polar charts are bit-for-bit unchanged vs the legacy implementation', { skip: !OLD }, () => {
  let n = 0;
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 3000; i++) {
    const year = 1930 + Math.floor(rnd() * 90);
    const month = 1 + Math.floor(rnd() * 12);
    const day = 1 + Math.floor(rnd() * 28);
    const hour = Math.floor(rnd() * 24), minute = Math.floor(rnd() * 60);
    const lat = -66 + rnd() * 132, lon = -180 + rnd() * 360;
    const tzOffset = Math.round(lon / 15);
    const args = { year, month, day, hour, minute, lat, lon, tzOffset };
    const a = A.computeChart(args), b = OLD.computeChart(args);
    assert.ok(angDiff(a.sunLon, b.sunLon) < 1e-9, 'sunLon');
    assert.ok(angDiff(a.moonLon, b.moonLon) < 1e-9, 'moonLon');
    assert.ok(angDiff(a.asc, b.asc) < 1e-9, `asc lat=${lat}`);
    assert.ok(angDiff(a.mc, b.mc) < 1e-9, 'mc');
    for (let k = 0; k < 12; k++) assert.ok(angDiff(a.cusps[k], b.cusps[k]) < 1e-9, `cusp ${k+1}`);
    assert.equal(a.sunHouse, b.sunHouse, 'sunHouse');
    assert.equal(a.mansion, b.mansion, 'mansion');
    n++;
  }
  assert.equal(n, 3000);
});
