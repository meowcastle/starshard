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
// cycle", `[VERIFY]`-blocked research, used later for the "road-kin"
// topology edge) is NOT built here — the arrival reading (SIGIL-READING.md)
// only needs the birth-DAY Keeper (below), a different, already-resolvable
// thing that happens to share the name "Keeper". Do not assume the two
// share a numeric encoding when the station table lands.

import { mansionOf } from './astro.js';
import { moonPhase, PLANETARY_HOUR_ORDER, WEEKDAY_RULER } from './sky.js';

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

/** Sky (0-3) — which quarter of the 28-station wheel a station falls in. */
export const skyOf = station => Math.floor(station / 7);

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
  return { sunStation, sunStep, moonStation, moonStep, risingStation, natalLight, keeper, type, farlight };
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

  return { segments, skyTicks, natalMarks };
}
