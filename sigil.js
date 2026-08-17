// Star Shard — the Sigil engine: natal derivation, the arrival reading's
// nine-beat grammar, and the ring's SVG geometry.
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// Indexing: 0-indexed throughout (stations 0-27, Skies 0-3, Steps 0-3),
// matching astro.js's mansionOf() and deck.js — NOT the 1-indexed prose in
// COSMOLOGY.md. Worked equivalence for the one formula that differs by a
// visible constant, Farlight: COSMOLOGY's 1-indexed
// `farlight1 = (sunStation1 + 13) % 28 + 1` is exactly this module's
// `farlight0 = (sunStation0 + 14) % 28` (substitute station1 = station0+1
// and simplify). Checked at stations 0, 13, 27:
//   station0=0  -> spec farlight1=15 -> farlight0=14 -> (0+14)%28=14  OK
//   station0=13 -> spec farlight1=28 -> farlight0=27 -> (13+14)%28=27 OK
//   station0=27 -> spec farlight1=14 -> farlight0=13 -> (27+14)%28=13 OK
//
// The per-station Keeper cycle (COSMOLOGY §3.1's "canonical xiù luminary
// cycle") is no longer research-blocked (INSTRUMENT.md §5.1/
// research/hunger-axis.md: `keeper(station) = CYCLE[(xiu.native_number-1)
// %7]`, CYCLE = [Jupiter,Venus,Saturn,Sun,Moon,Mars,Mercury]) but is still
// NOT built here — neither composer this module currently serves
// (arrivalReading's SIGIL-READING beats, fullReading's PORT-SPEC sections)
// uses the per-station Keeper, only the birth-DAY Keeper below, a
// different, already-resolvable thing that happens to share the name.
// Build it when the "road-kin" topology feature actually needs it — don't
// assume the two share a numeric encoding when that day comes.

import { mansionOf, houseOf } from './astro.js';
import { moonPhase, PLANETARY_HOUR_ORDER, WEEKDAY_RULER } from './sky.js';
import { classifyAspect, planetPositions, natalPlanetPositions } from './transits.js';

const STATIONS = 28, STEPS = 4, SEGMENTS = STATIONS * STEPS; // 112
const STATION_WIDTH = 360 / STATIONS;   // 12.857...deg
const STEP_WIDTH = 360 / SEGMENTS;      // 3.214...deg
const norm = d => ((d % 360) + 360) % 360;

// -- pure derivation ----------------------------------------------------

/** Station (0-27) of a tropical ecliptic longitude. Alias of astro.js's
 * mansionOf — genuinely generic despite its name, reused directly rather
 * than reimplemented. */
export const stationOf = lon => mansionOf(lon);

/** Step (0-3) within a station, from the residual within the station —
 * NOT a global-index-mod-4 — so stationOf/stepOf can never disagree at a
 * boundary due to two separate floating-point divisions landing on
 * opposite sides of it by a rounding hair. */
export function stepOf(lon) {
  const residual = norm(lon) % STATION_WIDTH;
  return Math.min(3, Math.floor(residual / STEP_WIDTH));
}

/**
 * Sky (0-3) — the Four Symbols quadrant a station belongs to (INSTRUMENT.md
 * §5): White Tiger (0) = stations 27,0-5 · Vermilion Bird (1) = 6-12 ·
 * Azure Dragon (2) = 13-19 · Black Tortoise (3) = 20-26. This is a rotated
 * boundary from a naive Math.floor(station/7) — White Tiger wraps around
 * the 27/0 seam instead of starting cleanly at 0 — so the formula shifts
 * the station forward by one before dividing: Math.floor(((station+1)%28)/7).
 * Verified by hand at every quadrant edge:
 *   station=27 -> (27+1)%28=0  -> floor(0/7)=0  (White Tiger, wraps in)
 *   station=0  -> (0+1)%28=1   -> floor(1/7)=0  (White Tiger)
 *   station=5  -> 6            -> floor(6/7)=0  (White Tiger, last)
 *   station=6  -> 7            -> floor(7/7)=1  (Vermilion Bird, first)
 *   station=12 -> 13           -> floor(13/7)=1 (Vermilion Bird, last)
 *   station=13 -> 14           -> floor(14/7)=2 (Azure Dragon, first)
 *   station=19 -> 20           -> floor(20/7)=2 (Azure Dragon, last)
 *   station=20 -> 21           -> floor(21/7)=3 (Black Tortoise, first)
 *   station=26 -> 27           -> floor(27/7)=3 (Black Tortoise, last)
 * This changes deriveType()'s Sky arithmetic from the pre-Four-Symbols
 * boundary — re-verified: the exhaustive 784-pair type test still holds
 * (Seedborn is exactly S===M regardless of the Sky boundary), and the
 * rate-sanity sweep still lands near the same ~3.6%/21%/25%/25%/25%
 * distribution post-rotation (see test/sigil.test.mjs).
 */
export const skyOf = station => Math.floor(((station + 1) % 28) / 7);

/** Flat 0-111 index for a (station, step) pair — the addressing scheme
 * both real Claude Design exports (Starshard V3) already use for their
 * ring's `lit`/`now`/`kindling` arrays. Recollection's own storage stays
 * `{station, step}` (COSMOLOGY §7); this is a rendering-layer convenience
 * derived from it, not a storage format. */
export const globalStepOf = (station, step) => station * STEPS + step;

/**
 * The five Traveler types (COSMOLOGY §3.4). Implemented as a strict
 * if/else-if chain with Seedborn checked FIRST, deliberately: S===M (same
 * station) always implies s===m (same Sky, since Sky is a pure function of
 * station), so checking s===m before S===M doesn't just misfire near an
 * edge — it makes the Seedborn branch unreachable, silently reclassifying
 * every true Seedborn case as Homebound with no visible symptom short of an
 * exhaustive test (see test/sigil.test.mjs).
 */
export function deriveType(sunStation, moonStation) {
  if (sunStation === moonStation) return 'seedborn';
  const s = skyOf(sunStation), m = skyOf(moonStation);
  if (s === m) return 'homebound';
  const diff = ((m - s) % 4 + 4) % 4; // true modulo, not JS's remainder
  if (diff === 1) return 'outbound';
  if (diff === 3) return 'emberwake'; // m = s-1 (mod 4)
  return 'farbank'; // diff === 2; diff===0 already handled by the s===m branch above
}

/** The Farlight station: 14 stations away (180 deg opposite) — the station
 * your birthday full moon always falls in. See the header comment for the
 * worked 1<->0-indexed equivalence against COSMOLOGY's formula. */
export const farlightOf = sunStation => (sunStation + 14) % 28;

/**
 * The Becoming (INSTRUMENT.md §3): of the traveler's available lights
 * (Sun and Moon always; Rising only when `timeKnown`, same rule as
 * `risingStation` itself), whichever sits closest to its station's
 * FORWARD edge is "moving" — the part of the sky that was, quite
 * literally, about to become something else at the minute of arrival.
 * Advancing that light one station gives the Becoming station: not a
 * prediction, a tendency.
 *
 * Register thresholds (§3.3) — note the doc's "3.2deg"/"6.4deg" are
 * rounded displays of exactly STEP_WIDTH and 2*STEP_WIDTH, used here at
 * full precision rather than the rounded copy numbers: <1deg door,
 * [1, STEP_WIDTH) ripening (precisely "in the Leaving step"),
 * [STEP_WIDTH, 2*STEP_WIDTH) leaning, >=2*STEP_WIDTH rooted.
 *
 * Echo (§3.4) is checked independently per light, not just the moving
 * one — a chart can have one light ripening toward its forward edge and a
 * DIFFERENT light echoing (just past its own station's start) at the same
 * time. A light echoes if it sits within the first eighth of its station
 * (< STATION_WIDTH/8, ~1.607deg past the station's start).
 *
 * Double door (§3.6): the doc's own sentence ("two lights within 0.5deg
 * of their edges") is ambiguous taken literally — the worked example in
 * §3.7 resolves it (Sun at 2.74deg, Moon at 2.96deg from their OWN edges,
 * neither within 0.5deg of its own edge, still called "a near-tie: double
 * door"). The 0.5deg threshold is actually the GAP between the two
 * smallest degToEdge values — it's ambiguous which light is "the" moving
 * light, not that both happen to sit absolutely near a boundary.
 * Implemented per the worked example, not the literal sentence.
 */
export function movingLight(chart, { timeKnown }) {
  // Rising has no candidacy without a time (same rule as risingStation).
  // The Moon is excluded too when !timeKnown — not just its discretized
  // step (moonStep, already nulled elsewhere): movingLight needs the
  // Moon's degree-level distance to an edge, and the Moon moves ~13deg/day,
  // so a +/-12h time-unknown default makes that distance meaningless at
  // the sub-degree precision a "door"/"ripening" register call needs — a
  // stricter honesty bar than moonStation itself (which only needs
  // station-level, not degree-level, precision, so it stays reliable and
  // is kept as deriveSigil's always-shown moonStation). With no time, only
  // the Sun is ever a candidate — its ~0.9856deg/day motion keeps a
  // +/-12h default well inside a useful precision (see deriveSigil's own
  // comment on sunStep for the same argument).
  const candidates = [{ which: 'sun', lon: chart.sunLon }];
  if (timeKnown) {
    candidates.push({ which: 'moon', lon: chart.moonLon });
    candidates.push({ which: 'rising', lon: chart.asc });
  }

  for (const c of candidates) {
    const into = norm(c.lon) % STATION_WIDTH;
    c.station = stationOf(c.lon);
    c.degToEdge = STATION_WIDTH - into;
    c.echoing = into < STATION_WIDTH / 8;
  }
  candidates.sort((a, b) => a.degToEdge - b.degToEdge);

  const moving = candidates[0];
  const registerOf = deg => deg < 1 ? 'door' : deg < STEP_WIDTH ? 'ripening' : deg < STEP_WIDTH * 2 ? 'leaning' : 'rooted';
  const doubleDoor = candidates.length > 1 && (candidates[1].degToEdge - candidates[0].degToEdge) <= 0.5;

  return {
    which: moving.which,
    degToEdge: moving.degToEdge,
    register: registerOf(moving.degToEdge),
    becomingStation: (moving.station + 1) % 28,
    echo: candidates.filter(c => c.echoing).map(c => c.which),
    doubleDoor,
  };
}

/**
 * The natal-to-natal aspects between a chart's four trusted points (sun,
 * moon, rising, midheaven — PRODUCT.md §3), five of the six possible pairs,
 * sorted tightest-orb-first. Reuses transits.js's classifyAspect() rather
 * than a second copy of the orb table — the Deep Chart's PATTERN tab (this)
 * and the daily's live transit (transits.js's natalContacts()) are the
 * same geometry against two different sets of longitudes.
 *
 * rising-midheaven is deliberately excluded: it's mostly a coordinate-
 * system artifact, not a chart fact. Sampled across 20,000 synthetic
 * charts (real placidusCusps(), varied RAMC and latitude): square ~42-48%
 * of the time, no aspect ~47-50%, conjunction/opposition essentially
 * geometrically impossible (~0.1%). corpus-chart-daily.md's batch 8
 * production notes carry the full table; verified independently before
 * cutting this pair, not taken on the corpus doc's word alone.
 *
 * Rising and midheaven are excluded without a birth time, same rule (and
 * same reason — computeChart() never itself returns a null `asc`) as
 * movingLight() above: the caller's `timeKnown` decides, not a null check.
 */
export function natalAspects(chart, { timeKnown }) {
  const points = [['sun', chart.sunLon], ['moon', chart.moonLon]];
  if (timeKnown) points.push(['rising', chart.asc], ['midheaven', chart.mc]);

  const out = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i][0] === 'rising' && points[j][0] === 'midheaven') continue;
      const [from, fromLon] = points[i], [to, toLon] = points[j];
      const hit = classifyAspect(fromLon, toLon);
      if (hit) out.push({ from, to, ...hit });
    }
  }
  return out.sort((a, b) => a.orbUsed - b.orbUsed);
}

/**
 * Every natal-to-natal aspect across the full chart — sun, moon, the eight
 * Mercury-through-Pluto planets, and (with a birth time) rising/midheaven.
 * natalAspects() above stays as it is (the four trusted points only, the
 * Deep Chart's PATTERN tab); this is the wider grid the redesigned chart
 * wheel's "aspects" section needs. Async for the same reason findings.js's
 * allPoints() is: Mercury-Pluto natal positions don't exist anywhere in
 * astro.js's chart object, so transits.js's natalPlanetPositions() has to
 * fetch them against the birth date.
 */
export async function fullNatalAspects(chart, { timeKnown }) {
  const natal = await natalPlanetPositions(chart);
  const points = [
    ['sun', chart.sunLon], ['moon', chart.moonLon],
    ['mercury', natal.Mercury.lon], ['venus', natal.Venus.lon], ['mars', natal.Mars.lon],
    ['jupiter', natal.Jupiter.lon], ['saturn', natal.Saturn.lon],
    ['uranus', natal.Uranus.lon], ['neptune', natal.Neptune.lon], ['pluto', natal.Pluto.lon],
  ];
  if (timeKnown) points.push(['rising', chart.asc], ['midheaven', chart.mc]);

  const out = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i][0] === 'rising' && points[j][0] === 'midheaven') continue;
      const [from, fromLon] = points[i], [to, toLon] = points[j];
      const hit = classifyAspect(fromLon, toLon);
      if (hit) out.push({ from, to, ...hit });
    }
  }
  return out.sort((a, b) => a.orbUsed - b.orbUsed);
}

// Classical/traditional sign rulerships (7 planets) — index 0=Aries..
// 11=Pisces. Not the modern Uranus/Neptune/Pluto co-rulers: this codebase
// has no ephemeris for any of the three (transits.js stops at Saturn,
// deliberately, per PRODUCT.md §7 — the outer planets move too slowly to
// matter for a nightly signal, and the same "what we can actually verify"
// posture applies here).
const SIGN_RULERS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

/**
 * Which house the ascendant's ruling planet natally occupies — PRODUCT.md
 * §2's third HOUSES placement, alongside sunHouse/moonHouse (already
 * computed by astro.js's computeChart()). Returns null without a birth
 * time (no ascendant, so no ruler to place).
 *
 * async: the ruler's position is free when it's the Sun or Moon (already
 * on `chart`); the other five need transits.js's planetPositions() —
 * called against the BIRTH moment (chart.jd converted to a Date), not
 * "now". This is a natal placement, not a transit, and reuses
 * planetPositions() exactly because it takes a `date` parameter rather
 * than assuming "now" — the same function serves both callers.
 */
export async function ascRulerHouse(chart) {
  if (chart.asc == null) return null;
  const ruler = SIGN_RULERS[Math.floor(norm(chart.asc) / 30)];
  let rulerLon;
  if (ruler === 'Sun') rulerLon = chart.sunLon;
  else if (ruler === 'Moon') rulerLon = chart.moonLon;
  else {
    // JD 2440587.5 = 1970-01-01T00:00:00 UTC, the standard Julian-day-to-
    // Unix-epoch offset (86400000 ms/day).
    const birthDate = new Date((chart.jd - 2440587.5) * 86400000);
    const positions = await planetPositions(birthDate);
    rulerLon = positions[ruler].lon;
  }
  return { ruler, house: houseOf(rulerLon, chart.cusps) };
}

/**
 * The seven natal parts of a Sigil (COSMOLOGY §3.3), computed once from a
 * chart (astro.js's computeChart() output) and a `timeKnown` flag the
 * caller controls — astro.js's computeChart() never itself returns a null
 * `asc` (it always computes against a defaulted clock when time is
 * unknown), so the honest-fallback decision has to come from the caller,
 * matching the existing pTimeKnown-passed-in convention rather than
 * inventing an implicit-null contract in astro.js.
 *
 * Sun station/step are always computed: the Sun's ~0.9856 deg/day motion
 * caps a +/-12h time-unknown error at ~0.5 deg, ~4% of a station width
 * (negligible) but ~16% of a step width (not negligible, but COSMOLOGY only
 * mandates an honest fallback for the Moon's step, not the Sun's — this
 * comment exists so a future reader doesn't "fix" sunStep into a stricter
 * fallback without knowing that tradeoff was deliberate).
 *
 * Moon station is always computed (matches the pre-reboot `mansion` field,
 * always shown regardless of time-known); moonStep and risingStation are
 * forced null when !timeKnown — a step is ~5.85h wide against a +/-12h
 * uncertainty, genuinely unresolvable, and rising needs the Ascendant,
 * hidden under the same existing convention.
 *
 * Deliberately excludes `createdAt`: a function reading wall-clock time
 * stops being pure, breaks this codebase's same-input/same-output test
 * convention, and risks a re-render silently producing a different
 * `createdAt` than what's stored. Whichever layer persists the record
 * stamps it — not built here.
 *
 * `becoming` (the Becoming station) and `moving` (movingLight()'s full
 * result — which light, register, echo, doubleDoor) are appended here
 * rather than left for a separate call, since deriveSigil already has
 * everything movingLight() needs (the chart, timeKnown).
 */
export function deriveSigil(chart, { timeKnown }) {
  const sunStation = stationOf(chart.sunLon);
  const sunStep = stepOf(chart.sunLon);
  const moonStation = stationOf(chart.moonLon);
  const moonStep = timeKnown ? stepOf(chart.moonLon) : null;
  const risingStation = timeKnown ? stationOf(chart.asc) : null;
  const natalLight = moonPhase(chart.sunLon, chart.moonLon).index;
  const keeper = PLANETARY_HOUR_ORDER.indexOf(WEEKDAY_RULER[chart.weekday]);
  const type = deriveType(sunStation, moonStation);
  const farlight = farlightOf(sunStation);
  const moving = movingLight(chart, { timeKnown });
  return {
    sunStation, sunStep, moonStation, moonStep, risingStation, natalLight, keeper, type, farlight,
    becoming: moving.becomingStation, moving,
  };
}

// -- the arrival reading's grammar (SIGIL-READING.md) --------------------

// Deterministic string hash (FNV-1a), same approach reading.js's
// seededPick() already uses for chart-stable variant selection — kept
// local rather than imported since reading.js doesn't export it and this
// is a small, self-contained utility (astro.js/sky.js/deck.js each keep
// their own local `norm` the same way).
function fnv1aHash(seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned, so callers can safely `% variants.length`
}

/**
 * The nine-beat arrival grammar (SIGIL-READING.md §2-3): ordered beats with
 * slot values — structural facts only, no prose — plus a stable
 * variant-selection hash. reading.js's future composer looks up corpus text
 * (station epithets, templates) keyed by these slots and "just fills
 * templates" (SIGIL-READING §5); every conditional/branching decision lives
 * here so the composer stays mechanical.
 *
 * `agreesWithStrike` and `crossingDay` are the only two derived (not
 * passthrough) fields — literal readings of SIGIL-READING §3's own worked
 * examples: "the same sky twice" (agreement) is the same Sky, not
 * necessarily the same station; "a crossing day" is the Moon sitting in its
 * Entering step (step 0), i.e. it just arrived in this station. `moonStep`
 * is null when the birth time is unknown, so `crossingDay` is correctly
 * false in that case without a separate flag (null !== 0).
 */
export function readingPlan(sigil) {
  const { sunStation, sunStep, moonStation, moonStep, risingStation, natalLight, keeper, type, farlight } = sigil;
  const seed = [sunStation, sunStep, moonStation, moonStep, risingStation, natalLight, keeper, farlight].join(',');
  const variantHash = fnv1aHash(seed);
  const agreesWithStrike = skyOf(moonStation) === skyOf(sunStation);
  const crossingDay = moonStep === 0;

  const beats = [
    { id: 'ring' },
    { id: 'strike', station: sunStation, step: sunStep },
    { id: 'root', station: moonStation, step: moonStep, agreesWithStrike, crossingDay },
    { id: 'glow', light: natalLight },
    { id: 'hand', keeper },
    { id: 'facing', station: risingStation, skip: risingStation === null },
    { id: 'answering', station: farlight },
    { id: 'gait', type, sunStation, moonStation },
    { id: 'handle', type, sunStation },
  ];

  return { variantHash, beats };
}

// -- the ring's SVG geometry ----------------------------------------------
//
// Fixed viewBox "0 0 200 200", center (100,100) — NOT a generic scale-free
// space. Adopted directly from the two real Claude Design exports
// (Starshard V3's wireframes + hi-fi Night Loop pass), which independently
// committed to this exact coordinate system; matching it is a drop-in, not
// a coincidence to preserve carefully. RADII.ring is Design's own tunable
// (70 in the hi-fi pass, 74 in the wireframes) — a reasonable default here,
// not a second source of truth to keep in sync with either export by hand.
//
// Natal marks render at STATION-center only, not station+step precision —
// both exports place every mark via a station-center angle regardless of
// its actual step; this module follows that rather than a theoretically
// more precise quantization, since Design already committed to it twice.
//
// Visual state (color, glow, animation) is entirely Design's territory:
// this returns geometry + a plain state label per segment/mark, never a
// hex color ("aesthetics are yours; the geometry is the spec" — DESIGN-
// BRIEF.md v2 S2).

export const SIZE = 200;
export const CENTER = 100;
export const RADII = { ring: 72, tickInner: 60, tickOuter: 67, mark: 85 };

const D2R = Math.PI / 180;

// 0deg at 12 o'clock, clockwise — matches both exports' `polar()`. No
// ascendant-based rotation (unlike wheel.js's personal chart wheel): the
// ring is the shared, universal Moonroad structure, so station N must land
// at the same screen angle for every traveler for it to work as a
// comparable share artifact.
function polar(r, deg) {
  const t = (deg - 90) * D2R;
  return [+(CENTER + r * Math.cos(t)).toFixed(2), +(CENTER + r * Math.sin(t)).toFixed(2)];
}

function arcPath(r, a0, a1) {
  const [x0, y0] = polar(r, a0), [x1, y1] = polar(r, a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
}

const stationCenterAngle = station => station * STATION_WIDTH + STATION_WIDTH / 2;

/**
 * Pure geometry for the Sigil ring. `kindled` is an array of
 * `{station, step}` pairs (matching COSMOLOGY §7's future Recollection row
 * shape directly — empty for now, since no kindling mechanic exists yet;
 * Act 0 is "dark ring, bright natal marks," which an empty array already
 * produces). `tonight`, if given, is a single `{station, step}` — the
 * Lantern's real current position — highlighted distinctly from lit/dark;
 * omitted (default null) when no live "tonight" data is being supplied.
 */
export function sigilRingData(sigil, { kindled = [], tonight = null } = {}) {
  const kindledSet = new Set(kindled.map(k => globalStepOf(k.station, k.step)));
  const tonightIdx = tonight ? globalStepOf(tonight.station, tonight.step) : null;

  const segments = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const station = Math.floor(i / STEPS), step = i % STEPS;
    // Small gap between every segment, a larger gap at each station
    // boundary (i % STEPS === 0) — mirrors both exports' own padding.
    const a0 = i * STEP_WIDTH + (step === 0 ? 1.0 : 0.4);
    const a1 = (i + 1) * STEP_WIDTH - 0.4;
    const state = kindledSet.has(i) ? 'lit' : (i === tonightIdx ? 'now' : 'dark');
    segments.push({ d: arcPath(RADII.ring, a0, a1), station, step, state });
  }

  const skyTicks = [];
  for (let station = 0; station < STATIONS; station += 7) {
    const angle = station * STATION_WIDTH;
    const [x1, y1] = polar(RADII.tickInner, angle);
    const [x2, y2] = polar(RADII.tickOuter, angle);
    skyTicks.push({ x1, y1, x2, y2 });
  }

  const natalMarks = [];
  const addMark = (role, station) => {
    if (station == null) return;
    const [cx, cy] = polar(RADII.mark, stationCenterAngle(station));
    natalMarks.push({ role, cx, cy });
  };
  addMark('sun', sigil.sunStation);
  addMark('moon', sigil.moonStation);
  addMark('rising', sigil.risingStation);
  addMark('farlight', sigil.farlight);
  // The Becoming (INSTRUMENT.md §3): a hollow mark, one arc ahead of
  // whichever light is moving — visually distinct from the four solid
  // natal marks above via the `becoming` role, styled hollow (stroke only,
  // no fill) by the consumer's CSS, same "geometry here, color there"
  // split as every other mark.
  addMark('becoming', sigil.becoming);

  return { segments, skyTicks, natalMarks };
}
