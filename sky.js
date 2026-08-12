// Star Shard — the daily engine: moon phases, tārābala, planetary hours.
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// Two ephemeris sources, each canonical for a specific thing, deliberately:
//   - astro.js's hand-rolled Meeus Sun/Moon stays canonical for everything
//     it already powers, PLUS moonPhase() and tarabala() below — both only
//     need Sun+Moon longitude, which astro.js already computes and has
//     verified against Swiss Ephemeris. This module never recomputes Sun or
//     Moon position itself; callers pass in longitudes from astro.js.
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
 * astronomy-engine dependency — this is pure Sun-Moon angular geometry. */
export function moonPhase(sunLon, moonLon) {
  const angle = norm(moonLon - sunLon);
  const name = MOON_PHASES.find(p => angle <= p.max).name;
  const illumination = (1 - Math.cos(angle * Math.PI / 180)) / 2;
  return { angle, name, illumination };
}

// -- planetary hours ----------------------------------------------------------

// Chaldean order: slowest apparent motion to fastest. Stepping through this
// sequence 24 times per day (24 mod 7 = 3) is the same mechanism that
// generates the classical weekday order shards.js's WEEKDAYS already uses.
export const PLANETARY_HOUR_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

// Ruling planet of each hour-1-of-the-day, indexed like JS Date#getDay() /
// astro.js's weekdayOf() (0 = Sunday) — matches shards.js's WEEKDAYS table.
const WEEKDAY_RULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

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
