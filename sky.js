// Star Shard — the daily engine: moon phases, tārābala, planetary hours,
// station/step cast kinds.
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// Two ephemeris sources, each canonical for a specific thing, deliberately:
//   - astro.js's hand-rolled Meeus Sun/Moon stays canonical for everything
//     it already powers, PLUS moonPhase() and tarabala() below — both only
//     need Sun+Moon longitude, which astro.js already computes and has
//     verified against Swiss Ephemeris. This module never recomputes Sun or
//     Moon position itself; callers pass in longitudes from astro.js. The
//     one exception is castKind() below, which genuinely needs a SECOND
//     sample (jd +/- 0.5) to measure the Moon's real angular rate, the same
//     way deck.js's own local moonRate() already does — not a duplicate
//     position computation, just two more calls to the same verified
//     moonLongitude().
//   - astronomy-engine.js (vendored, see tools/vendor-astronomy.mjs) is
//     canonical only for what astro.js cannot do at all: sunrise/sunset
//     (planetaryHours() below; other-planet positions for a future
//     void-of-course feature). "Today's Moon" for tārābala and "today's
//     Moon" for a future VoC feature will therefore come from two different
//     engines with different (both small) error budgets. That's a
//     deliberate tradeoff, not an oversight — flagging it here so a future
//     VoC pass doesn't have to rediscover it.
//
// Accuracy: lahiriAyanamsa() is a least-squares linear fit through 12 real
// Swiss Ephemeris (pyswisseph 2.10.3.2, SIDM_LAHIRI) reference points,
// 1900-2050 — see test/sky.test.mjs for the fixture and provenance. Run
// through astro.js's own moonLongitude() (already verified to a max 0.106°
// error against Swiss Ephemeris) for 3,000 random charts spanning 1930-2020,
// the resulting sidereal nakshatra INDEX (not the raw degree) matched Swiss
// Ephemeris's true index in every single case: 0 mismatches / 3,000. That's
// the number that actually matters for tārābala, since a misclassified
// nakshatra doesn't nudge a displayed value, it flips the whole favorable/
// unfavorable verdict.

import { moonLongitude, sunLongitude } from './astro.js';

const norm = d => ((d % 360) + 360) % 360;

// -- sidereal-27 track (Lahiri ayanāṁśa) -------------------------------------

/** Degrees per Julian year, Lahiri's precession rate (~50.28"/yr). */
const LAHIRI_RATE_PER_YEAR = 0.013967;
/** Lahiri ayanāṁśa at J2000.0 (JD 2451545.0), fitted from the 12-point
 * pyswisseph reference table in test/sky.test.mjs. */
const LAHIRI_2000 = 23.857150;

/** Lahiri ayanāṁśa (degrees) at a given Julian day. Linear approximation —
 * see the accuracy note above for why this is good enough here. */
export function lahiriAyanamsa(jd) {
  return LAHIRI_2000 + LAHIRI_RATE_PER_YEAR * ((jd - 2451545) / 365.25);
}

// 27 equal sidereal divisions of 13°20′ from 0° sidereal Aries (Ashvinī).
// The 28th classical station, Abhijit, is the older intercalary mansion
// dropped from the equal 27-scheme — see research/mansions.md §2.2. This is
// a distinct system from astro.js's own 28-mansion (tropical, manāzil
// al-qamar) index; the two are not interchangeable.
export const NAKSHATRAS = [
  'Ashvinī', 'Bharaṇī', 'Kṛttikā', 'Rohiṇī', 'Mṛgaśira', 'Ārdrā', 'Punarvasu',
  'Puṣya', 'Āśleṣā', 'Maghā', 'Pūrva Phalgunī', 'Uttara Phalgunī', 'Hasta',
  'Citrā', 'Svātī', 'Viśākhā', 'Anurādhā', 'Jyeṣṭhā', 'Mūla', 'Pūrva Āṣāḍhā',
  'Uttara Āṣāḍhā', 'Śravaṇa', 'Dhaniṣṭhā', 'Śatabhiṣā', 'Pūrva Bhādrapadā',
  'Uttara Bhādrapadā', 'Revatī',
];

/** Sidereal nakshatra for a tropical Moon longitude (from astro.js's
 * moonLongitude()) at a given Julian day. */
export function siderealNakshatra(moonLon, jd) {
  const sidLon = norm(moonLon - lahiriAyanamsa(jd));
  const index = Math.floor(sidLon / (360 / 27));
  return { index, name: NAKSHATRAS[index] };
}

// -- tārābala -----------------------------------------------------------------

// research/mansions.md §2.2: verdict is 3-state, not boolean — Janma is
// explicitly "mixed" in the source tradition, not neutral-as-favorable or
// neutral-as-unfavorable.
export const TARA_NAMES = [
  { name: 'Janma', meaning: "one's own birth-star", verdict: 'mixed' },
  { name: 'Sampat', meaning: 'wealth', verdict: 'favorable' },
  { name: 'Vipat', meaning: 'loss, danger', verdict: 'unfavorable' },
  { name: 'Kṣema', meaning: 'well-being, security', verdict: 'favorable' },
  { name: 'Pratyari', meaning: 'obstacles, the adversary', verdict: 'unfavorable' },
  { name: 'Sādhaka', meaning: 'accomplishment', verdict: 'favorable' },
  { name: 'Naidhana', meaning: '"death-like" — the strongest warning', verdict: 'unfavorable' },
  { name: 'Mitra', meaning: 'friend', verdict: 'favorable' },
  { name: 'Parama Mitra', meaning: 'best friend', verdict: 'most favorable' },
];

/**
 * The count-from-birth-star-to-today's-star relation. `cycle` (1-3) is the
 * paryāya the count falls in — classical practice treats malefic intensity
 * as softening in later cycles, but gives no precise formula for how much,
 * so this module exposes the cycle number and leaves any language/copy
 * decision to the caller rather than inventing an unsourced decay curve.
 */
export function tarabala(birthNakshatraIdx, todayNakshatraIdx) {
  const count = ((todayNakshatraIdx - birthNakshatraIdx + 27) % 27) + 1;
  const taraIndex = ((count - 1) % 9) + 1;
  const cycle = Math.ceil(count / 9);
  const tara = TARA_NAMES[taraIndex - 1];
  return { count, cycle, taraIndex, taraName: tara.name, verdict: tara.verdict };
}

// -- moon phase -----------------------------------------------------------

const MOON_PHASES = [
  { max: 22.5, name: 'new moon' },
  { max: 67.5, name: 'waxing crescent' },
  { max: 112.5, name: 'first quarter' },
  { max: 157.5, name: 'waxing gibbous' },
  { max: 202.5, name: 'full moon' },
  { max: 247.5, name: 'waning gibbous' },
  { max: 292.5, name: 'last quarter' },
  { max: 337.5, name: 'waning crescent' },
  { max: 360, name: 'new moon' },
];

/** Phase of the Moon from Sun/Moon tropical longitudes (from astro.js). No
 * astronomy-engine dependency — this is pure Sun-Moon angular geometry.
 * `index` (0-7) is derived from the SAME MOON_PHASES table `name` uses, not
 * a separately-computed bin formula — two independent binning rules for the
 * same boundary would disagree exactly at the 8 bin edges (e.g. angle=337.5
 * sits in the 'waning crescent' bin by this table's own `<=` rule but a
 * naive `floor((angle+22.5)/45)%8` formula gives 'new moon' there instead).
 * sigil.js's natalLight is this index. */
export function moonPhase(sunLon, moonLon) {
  const angle = norm(moonLon - sunLon);
  const idx = MOON_PHASES.findIndex(p => angle <= p.max) % 8;
  const name = MOON_PHASES[idx].name;
  const illumination = (1 - Math.cos(angle * Math.PI / 180)) / 2;
  return { angle, name, illumination, index: idx };
}

// -- planetary hours ----------------------------------------------------------

// Chaldean order: slowest apparent motion to fastest. Stepping through this
// sequence 24 times per day (24 mod 7 = 3) is the same mechanism that
// generates the classical weekday order shards.js's WEEKDAYS already uses.
export const PLANETARY_HOUR_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

// Ruling planet of each hour-1-of-the-day, indexed like JS Date#getDay() /
// astro.js's weekdayOf() (0 = Sunday) — matches shards.js's WEEKDAYS table.
// Exported for sigil.js's birth-day Keeper derivation.
export const WEEKDAY_RULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/**
 * Sunrise-to-sunset split into 12 unequal "hours", then sunset-to-next-
 * sunrise into 12 more, each ruled by the next planet in Chaldean order.
 * Dynamically imports the vendored astronomy-engine for sunrise/sunset —
 * the one thing astro.js can't compute.
 *
 * Returns `{ available: false }` (not a thrown error, not a Porphyry-style
 * same-shape fallback — there's no sunrise to build hours from at all) when
 * SearchRiseSet can't find an event in the search window: the real polar
 * day/night condition, confirmed directly from astronomy-engine's source to
 * return `null` rather than throw.
 */
export async function planetaryHours(date, lat, lon) {
  const AE = await import('./astronomy-engine.js');
  const obs = new AE.Observer(lat, lon, 0);
  // A real diurnal cycle never puts two sunrises (or a sunrise and the
  // matching sunset) more than ~25 hours apart, even at extreme non-polar
  // latitudes. A SHORT window is what makes this a genuine polar-day/night
  // test: searching hundreds of days out would just find the next real
  // sunrise/sunset *whenever* the sun eventually rises/sets again, and
  // silently treat the entire polar-day span between as "one day," building
  // nonsense multi-month-long "hours." A 3-day window can't do that — if it
  // finds nothing, there is genuinely no sunrise/sunset near `date`.
  const WINDOW_DAYS = 3;

  const sunrise = AE.SearchRiseSet(AE.Body.Sun, obs, 1, date, -WINDOW_DAYS);
  if (!sunrise) return { available: false };
  const sunset = AE.SearchRiseSet(AE.Body.Sun, obs, -1, sunrise.date, WINDOW_DAYS);
  if (!sunset) return { available: false };
  const nextSunrise = AE.SearchRiseSet(AE.Body.Sun, obs, 1, sunset.date, WINDOW_DAYS);
  if (!nextSunrise) return { available: false };

  const ruler = WEEKDAY_RULER[sunrise.date.getUTCDay()];
  let rulerIdx = PLANETARY_HOUR_ORDER.indexOf(ruler);

  const buildHours = (start, end, count) => {
    const step = (end.getTime() - start.getTime()) / count;
    const hours = [];
    for (let i = 0; i < count; i++) {
      hours.push({
        start: new Date(start.getTime() + i * step),
        end: new Date(start.getTime() + (i + 1) * step),
        planet: PLANETARY_HOUR_ORDER[rulerIdx],
      });
      rulerIdx = (rulerIdx + 1) % 7;
    }
    return hours;
  };

  const dayHours = buildHours(sunrise.date, sunset.date, 12);
  const nightHours = buildHours(sunset.date, nextSunrise.date, 12);

  const now = date.getTime();
  const all = [...dayHours, ...nightHours];
  const current = all.find(h => now >= h.start.getTime() && now < h.end.getTime()) || null;

  return { available: true, sunrise: sunrise.date, sunset: sunset.date, nextSunrise: nextSunrise.date, dayHours, nightHours, current };
}

// -- cast kind: steady / turning / threshold -------------------------------
//
// station/step arithmetic is duplicated here (not imported from sigil.js)
// deliberately: sigil.js already imports FROM sky.js (moonPhase,
// PLANETARY_HOUR_ORDER, WEEKDAY_RULER), so importing sigil.js here would be
// circular. These are two one-line functions — not worth restructuring the
// existing import direction over, same call this codebase already makes for
// `norm`, duplicated per-module rather than centralized.
const STATION_WIDTH = 360 / 28;  // 12.857...deg
const STEP_WIDTH = 360 / 112;    // 3.214...deg (STATION_WIDTH / 4, exactly —
                                  // stations and steps tile the circle with
                                  // no offset, so a plain `lon % STEP_WIDTH`
                                  // below is already "degrees into the
                                  // current step," no station-relative
                                  // arithmetic needed)
const stationOf = lon => Math.floor(norm(lon) / STATION_WIDTH);
const stepOf = lon => Math.min(3, Math.floor((norm(lon) % STATION_WIDTH) / STEP_WIDTH));

// REBOOT.md/COSMOLOGY §3.2's own numbers ("final quarter of a step ~90min,
// or of a station ~6h") are ambiguous between two literal readings: one
// widens the window specifically for the last step of a station (~6h
// there, ~90min elsewhere) and produces steady:turning ~= 1.3:1; the other
// applies a SINGLE uniform 90-min-of-current-step rule to all four steps
// and reproduces the doc's own stated ~3:1 target exactly, since a uniform
// 90-min tail out of a ~5.85h step is 25% of all time regardless of which
// step it is. This module implements the uniform reading. Station
// boundaries (step 3 ending) are still a bigger narrative event than an
// ordinary step boundary — castKind() flags that via `becoming`'s
// station-vs-step jump, not via a wider detection window.
const TURNING_MINUTES = 90;
// COSMOLOGY frames `threshold` as "minutes-wide," but astro.js's own Moon-
// longitude error (mean ~2.5min, max ~11-13min of timing jitter at the
// Moon's real rate) makes any band narrower than that indistinguishable
// from ephemeris noise, not a real astronomical event. 20 minutes is the
// honest floor — safely above the max noise, still comfortably inside the
// 90-minute turning window — not the literal spec number.
const THRESHOLD_MINUTES = 20;

/** Same finite-difference technique as deck.js's own local moonRate() —
 * the Moon's real angular rate (deg/day) right now, not a fixed mean. */
function moonRate(jd) {
  const before = moonLongitude(jd - 0.5), after = moonLongitude(jd + 0.5);
  return norm(after - before);
}

/**
 * Tonight's cast kind — steady (one card), turning (a present -> becoming
 * pair, the lantern nearing a step boundary), or threshold (rare, minutes-
 * wide, exactly at a boundary; takes priority over turning). `moonLon`/`jd`
 * are the current instant's values (astro.js's moonLongitude(jd) and jd
 * itself — same inputs deck.js's claimStates() already takes).
 *
 * `becoming` is null for a steady cast. Otherwise it's the next
 * (station, step): an ordinary step advance for steps 0-2, or a station-
 * level jump (station+1, step 0) when leaving step 3 — the composer should
 * treat that case as the bigger narrative beat it is.
 */
export function castKind(moonLon, jd) {
  const rate = moonRate(jd); // deg/day
  const lon = norm(moonLon);
  const station = stationOf(lon), step = stepOf(lon);

  const degIntoStep = norm(lon) % STEP_WIDTH;
  const minutesIntoStep = (degIntoStep / rate) * 24 * 60;
  const minutesToStepEnd = ((STEP_WIDTH - degIntoStep) / rate) * 24 * 60;

  let kind;
  if (minutesIntoStep <= THRESHOLD_MINUTES || minutesToStepEnd <= THRESHOLD_MINUTES) kind = 'threshold';
  else if (minutesToStepEnd <= TURNING_MINUTES) kind = 'turning';
  else kind = 'steady';

  const becomingStep = (step + 1) % 4;
  const becomingStation = step === 3 ? (station + 1) % 28 : station;
  const becoming = kind === 'steady' ? null : { station: becomingStation, step: becomingStep };

  return { kind, current: { station, step }, becoming };
}

// -- farlight returns -------------------------------------------------------
//
// The real cadence, checked rather than assumed: a full moon's longitude
// precesses ~30.67deg per lunation (12 synodic months run ~11 days short of
// a solar year), and a station is 12.857deg wide, so the odds any given full
// moon lands in one specific station are ~3.6% — an expected gap around 2-3
// years, not "once a year" the way that sounds at a glance. Walks consecutive
// full moons out from `jd` in both directions, using the SAME astro.js
// Sun/Moon longitudes as moonPhase() above (no astronomy-engine here, by the
// same rule CLAUDE.md's "what sky.js is worth" note already sets: this only
// needs Sun+Moon longitude, which astro.js already computes and has
// verified). A day-step scan plus bisection is more than accurate enough for
// a calendar-date display — nobody reads "next rising" to the minute.

/** Signed angular distance from exact opposition (full moon), in (-180,180]. */
function fullMoonDelta(jd) {
  let d = norm(moonLongitude(jd) - sunLongitude(jd)) - 180;
  if (d > 180) d -= 360;
  return d;
}

/** Bisect a bracket [a,b] with opposite-signed fullMoonDelta down to the
 * enclosed full moon's jd (20 halvings is far past the precision this needs). */
function bisectFullMoon(a, b) {
  let da = fullMoonDelta(a);
  for (let i = 0; i < 20; i++) {
    const mid = (a + b) / 2, dm = fullMoonDelta(mid);
    if (Math.sign(dm) === Math.sign(da) || dm === 0) { a = mid; da = dm; } else { b = mid; }
  }
  return (a + b) / 2;
}

/** Walk full moons away from `jd` in `dir` (+1 forward, -1 back), stepping a
 * day at a time (safely under the ~29.53-day synodic month, so a crossing
 * can't be stepped over), until one's Moon longitude lands in
 * [station*W, station*W + W). `maxLunations` bounds the search rather than
 * letting it run forever — measured empirically (every station, sampled
 * every 7 years from 1930-2080) at a worst case of 37 lunations either
 * direction from "now"; 60 (~4.9 years) leaves real margin above that
 * without costing anything (~60 cheap trig calls, sub-millisecond). */
function nextFarlightReturn(farlightStation, jd, dir, maxLunations = 60) {
  const lo = farlightStation * STATION_WIDTH, hi = lo + STATION_WIDTH;
  const inBand = lon => { const l = norm(lon); return l >= lo && l < hi; };

  let prevJd = jd, prevD = fullMoonDelta(jd);
  let found = 0;
  const maxDays = Math.ceil(maxLunations * 29.6);
  for (let step = 1; step <= maxDays; step++) {
    const j = jd + dir * step;
    const d = fullMoonDelta(j);
    // A real full-moon crossing moves ~12deg/day (the Moon's rate relative
    // to the Sun) — d changes by a small amount. The OTHER place this
    // signed delta flips sign is the new-moon wrap, where norm()'s 360deg
    // seam makes d jump from just under +180 to just over -180: a ~360deg
    // apparent change, not a crossing. Requiring a small step tells the two
    // apart without needing to track elongation unwrapped.
    if (Math.sign(d) !== Math.sign(prevD) && Math.abs(d - prevD) < 180) {
      const fmJd = dir > 0 ? bisectFullMoon(prevJd, j) : bisectFullMoon(j, prevJd);
      found++;
      if (inBand(moonLongitude(fmJd))) return fmJd;
    }
    prevJd = j; prevD = d;
    if (found >= maxLunations) break;
  }
  return null;
}

/**
 * The last and next full moon to rise in the farlight mansion — the
 * countdown the ethics floor's "live return-countdowns" law calls for.
 * `jd` is the current instant (same `Date.now()/86400000 + 2440587.5`
 * formula the page already uses for "now"). Returns jd values, not dates —
 * callers already have their own jd-to-calendar-date conversion (or can use
 * `new Date((jd - 2440587.5) * 86400000)`).
 */
export function farlightReturns(farlightStation, jd) {
  return {
    last: nextFarlightReturn(farlightStation, jd, -1),
    next: nextFarlightReturn(farlightStation, jd, +1),
  };
}
