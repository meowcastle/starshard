// Star Shard — findings.js: the shard's ranker. CHART-BUILDER.md §3.1.
//
// OWNER: Claude Code.
//
// enumerateFindings(chart, sigil, { timeKnown }) -> Finding[]
//   Finding = { kind, points[], mansion, detail, rate, bits, prominence, score }
//
// Pure and (because natal positions for Mercury-Pluto don't exist anywhere
// else in this codebase — astro.js's computeChart() only ever returns
// Sun/Moon/Asc/MC) async: it reuses transits.js's existing date-
// parameterized planetPositions()/outerPositions(), called against the
// BIRTH date instead of "now" — the identical pattern sigil.js's
// ascRulerHouse() and transits.js's own weekTightestContact() already use.
// No network call happens here or in either of those (both are dynamic
// imports of the vendored astronomy-engine.js), so "pure" still holds in
// the sense that matters for this codebase: no fetch(), same input ->
// same output.
//
// rate/bits come from rates.js's measured table — never recomputed here.
// Two candidate kinds from CHART-BUILDER.md §3.1's own list, `dissent` and
// `seam`, are NOT implemented below. Both are blocked on data this
// codebase doesn't have yet, not on missing code:
//   - dissent needs the four-tradition concordance/match-flag table
//     (stations.js's `match` field) COMPLETE. SHARD-MODEL.md §3(d) is
//     explicit that only 12 of 28 mansions carry a flag today (10 STRONG,
//     2 PARTIAL) and that finishing it is "a research pass, not an
//     engineering one." Scoring a dissent finding against 16 missing
//     flags would silently favor whichever mansions happen to be filled.
//   - seam needs the 27-vs-28 nakshatra framing SHARD-MODEL.md §4 flags
//     as still unresolved ("the seam is intra-Indian first") — there is
//     no rate for it in rates.js's §3.2 table, and inventing one here
//     would be exactly the "recomputed at runtime, not shipped as a
//     table" failure rates.js's own header warns against.
// Both kinds are honored as no-ops (never appear in the returned array)
// rather than silently dropped from the switch — see the two guard
// comments below at the point each would otherwise have gone.

import { mansionOf, signOf, SIGNS } from './astro.js';
import { planetPositions, outerPositions } from './transits.js';
import { degFmt } from './format.js';
import {
  COLOCATION_RATES,
  DISAGREEMENT_RATES,
  PILE_RATES,
  BOUNDARY_RATES,
  TYPE_RATES,
} from './rates.js';

const STATION_WIDTH = 360 / 28;

// SHARD-MODEL.md §2's prominence table.
const PROMINENCE = {
  Sun: 1.0, Moon: 1.0, Ascendant: 1.0, Midheaven: 1.0,
  Mercury: 0.7, Venus: 0.7, Mars: 0.7,
  Jupiter: 0.5, Saturn: 0.5,
  Uranus: 0.35, Neptune: 0.35, Pluto: 0.35,
};
const OUTER_ONLY = new Set(['Uranus', 'Neptune', 'Pluto']);
const ANGLE_PROXIMITY_DEG = 10;
const ANGLE_PROXIMITY_MULT = 1.5;

/**
 * Every point's longitude, gathered once so every finding kind scans the
 * same fixed list rather than re-deriving it. Ascendant/Midheaven are
 * omitted entirely (not included-but-null) when !timeKnown — the same
 * honesty rule sigil.js's deriveSigil() already applies to risingStation.
 */
async function allPoints(chart, { timeKnown }) {
  // JD 2440587.5 = 1970-01-01T00:00:00 UTC (see sigil.js's ascRulerHouse
  // for the same conversion, same comment).
  const birthDate = new Date((chart.jd - 2440587.5) * 86400000);
  const [inner, outer] = await Promise.all([planetPositions(birthDate), outerPositions(birthDate)]);

  const points = [
    { name: 'Sun', lon: chart.sunLon },
    { name: 'Moon', lon: chart.moonLon },
    { name: 'Mercury', lon: inner.Mercury.lon },
    { name: 'Venus', lon: inner.Venus.lon },
    { name: 'Mars', lon: inner.Mars.lon },
    { name: 'Jupiter', lon: inner.Jupiter.lon },
    { name: 'Saturn', lon: inner.Saturn.lon },
    { name: 'Uranus', lon: outer.Uranus.lon },
    { name: 'Neptune', lon: outer.Neptune.lon },
    { name: 'Pluto', lon: outer.Pluto.lon },
  ];
  if (timeKnown) {
    points.push({ name: 'Ascendant', lon: chart.asc });
    points.push({ name: 'Midheaven', lon: chart.mc });
  }

  // Named (not just valued) so a genuine 0-orb conjunction to an angle —
  // e.g. Sun exactly on the Ascendant — still earns the bonus. Keying the
  // skip off longitude equality instead would wrongly also skip that real
  // case, not just the Ascendant/Midheaven comparing against themselves.
  const angles = timeKnown ? [{ name: 'Ascendant', lon: chart.asc }, { name: 'Midheaven', lon: chart.mc }] : [];
  for (const pt of points) {
    let prominence = PROMINENCE[pt.name];
    for (const a of angles) {
      if (pt.name === a.name) continue; // an angle isn't "near itself"
      const sep = Math.abs(((pt.lon - a.lon + 540) % 360) - 180);
      if (sep <= ANGLE_PROXIMITY_DEG) { prominence *= ANGLE_PROXIMITY_MULT; break; }
    }
    pt.prominence = prominence;
    pt.mansion = mansionOf(pt.lon);
    pt.sign = signOf(pt.lon);
  }
  return points;
}

// The TEN planets (SHARD-MODEL.md's "45 pairs" — C(10,2) — figure): Sun,
// Moon and the eight Mercury-through-Pluto bodies, deliberately excluding
// Ascendant/Midheaven. Colocation/pile/boundary findings scan all
// available points including the angles; the disagreement-count/quiet and
// traveler-type findings scan exactly this fixed set of ten, matching the
// sample rates.js's DISAGREEMENT_RATES/TYPE_RATES were measured against.
const TEN_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

/** Test convenience: builds a point in the exact shape allPoints()
 * produces, without the angle-proximity prominence bonus (tests that need
 * that bonus go through enumerateFindings() with a real chart instead). */
export function pointAt(name, lon, prominence = PROMINENCE[name]) {
  return { name, lon, mansion: mansionOf(lon), sign: signOf(lon), prominence };
}

function pairs(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) out.push([list[i], list[j]]);
  }
  return out;
}

function makeFinding({ kind, points, mansion, detail, rate }) {
  const prominence = Math.max(...points.map(p => p.prominence));
  const personalless = points.every(p => OUTER_ONLY.has(p.name));
  // Tension (SHARD-MODEL.md §2: "x1.3 if a feature contradicts a higher-
  // ranked one") is left at 1.0. Encoding real cross-finding contradiction
  // needs the `dissent` kind above to exist first — that's the kind
  // "contradiction" is actually about — and dissent is itself blocked
  // (see the module header). Shipping a guessed "contradicts" rule ahead
  // of that would be exactly the kind of invented precision this
  // codebase's rates.js explicitly refuses to do for numbers; the same
  // discipline applies to an unspecified boolean rule.
  const tension = 1.0;
  const score = rate.bits * prominence * tension;
  return {
    kind,
    points: points.map(p => p.name),
    mansion,
    detail,
    rate: rate.p,
    bits: rate.bits,
    prominence,
    score,
    personalless,
  };
}

// Exported alongside enumerateFindings() so each finding kind's pure logic
// is directly testable against synthetic point arrays — no need to run
// real ephemeris math (allPoints()'s async transits.js calls) just to
// exercise a boundary condition. A test-built point needs exactly the
// shape allPoints() produces: { name, lon, mansion, sign, prominence }.
export function findColocations(points) {
  const found = [];
  for (const [a, b] of pairs(points)) {
    if (a.mansion === b.mansion && a.sign !== b.sign) {
      found.push(makeFinding({
        kind: 'colocation',
        points: [a, b],
        mansion: a.mansion,
        detail: `${a.name} ${degFmt(a.lon)} · ${b.name} ${degFmt(b.lon)} — different signs, same mansion ${a.mansion + 1}`,
        rate: COLOCATION_RATES.sameMansionDifferentSign,
      }));
    }
  }
  return found;
}

export function findPiles(points) {
  const byMansion = new Map();
  for (const p of points) {
    if (!byMansion.has(p.mansion)) byMansion.set(p.mansion, []);
    byMansion.get(p.mansion).push(p);
  }
  const found = [];
  for (const [mansion, group] of byMansion) {
    if (group.length < 3) continue;
    found.push(makeFinding({
      kind: 'pile',
      points: group,
      mansion,
      detail: `${group.map(p => p.name).join(', ')} all in mansion ${mansion + 1}`,
      rate: group.length >= 4 ? PILE_RATES.fourPlus : PILE_RATES.threePlus,
    }));
  }
  return found;
}

export function findBoundary(points) {
  let nearest = null;
  for (const p of points) {
    const into = ((p.lon % STATION_WIDTH) + STATION_WIDTH) % STATION_WIDTH;
    const degToEdge = Math.min(into, STATION_WIDTH - into);
    if (!nearest || degToEdge < nearest.degToEdge) nearest = { point: p, degToEdge };
  }
  if (!nearest || nearest.degToEdge >= 1.0) return [];
  const { point, degToEdge } = nearest;
  const rate = degToEdge < 0.25 ? BOUNDARY_RATES.withinQuarterDegree
    : degToEdge < 0.5 ? BOUNDARY_RATES.withinHalfDegree
    : BOUNDARY_RATES.withinOneDegree;
  return [makeFinding({
    kind: 'boundary',
    points: [point],
    mansion: point.mansion,
    detail: `${point.name} ${degToEdge.toFixed(2)}° from the edge of mansion ${point.mansion + 1}`,
    rate,
  })];
}

/** XOR(sameSign, sameMansion): the chart-view (sign) and shard-view
 * (mansion) partitions agree on a pair iff both true or both false —
 * "disagree" is exactly the case where one groups the pair together and
 * the other splits it. */
function disagreementCount(tenPoints) {
  let n = 0;
  for (const [a, b] of pairs(tenPoints)) {
    if ((a.sign === b.sign) !== (a.mansion === b.mansion)) n++;
  }
  return n;
}

export function disagreementCountFor(tenPoints) {
  return disagreementCount(tenPoints);
}

export function findQuiet(tenPoints) {
  // Only count===0 has a shipped rate (DISAGREEMENT_RATES.zero). Lower
  // counts than the measured mean are rarer, but rates.js only ships the
  // one exact point on the distribution it measured — see rates.js's own
  // "ship as a table, don't recompute" rule. A count of 1 (CHART-
  // BUILDER.md's own Adrian example) is real and rare but has no shipped
  // rate to score it with, so it doesn't qualify here.
  const n = disagreementCount(tenPoints);
  if (n !== 0) return [];
  return [makeFinding({
    kind: 'quiet',
    points: tenPoints,
    mansion: null,
    detail: `chart and shard agree on every one of the ${tenPoints.length} points — zero disagreements`,
    rate: DISAGREEMENT_RATES.zero,
  })];
}

export function findType(tenPoints) {
  const sun = tenPoints.find(p => p.name === 'Sun');
  const moon = tenPoints.find(p => p.name === 'Moon');
  if (sun.mansion !== moon.mansion) return []; // not Seedborn — "report only when rare"
  return [makeFinding({
    kind: 'type',
    points: [sun, moon],
    mansion: sun.mansion,
    detail: `Sun and Moon both in mansion ${sun.mansion + 1} — Seedborn`,
    rate: TYPE_RATES.seedborn,
  })];
}

/**
 * Enumerate every candidate finding, score, and sort (highest first).
 * "A finding involving only outer planets is generational, not personal,
 * and must never win" (CHART-BUILDER.md §3.1) is enforced as a hard sort
 * precedence, not just a low prominence weight — a rare outer-only pile
 * could otherwise still out-score a common personal one on bits alone.
 */
export async function enumerateFindings(chart, sigil, { timeKnown }) {
  const points = await allPoints(chart, { timeKnown });
  const tenPoints = points.filter(p => TEN_PLANETS.includes(p.name));

  const all = [
    ...findColocations(points),
    ...findPiles(points),
    ...findBoundary(points),
    ...findQuiet(tenPoints),
    ...findType(tenPoints),
    // `dissent` and `seam`: intentionally no-ops. See module header.
  ];

  all.sort((a, b) => Number(a.personalless) - Number(b.personalless) || b.score - a.score);
  return all.map(({ personalless, ...f }) => f);
}
