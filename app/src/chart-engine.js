// chart-engine.js: the natal chart, computed (SS6, 1 Nov 2026). Pure functions, no React,
// no DOM, so test/chart.test.mjs runs it in Node against three known charts.
//
// Division of labour, as CLAUDE.md and transits.js already fix it: astro.js is the engine of
// record for the Sun, the Moon, the ascendant, the midheaven and the Placidus cusps (verified
// against the Swiss Ephemeris over 150,000 charts); the vendored astronomy-engine.js supplies
// Mercury to Pluto, imported on demand so the shell's first load does not carry it; tz.js
// turns a wall-clock birth time into the UT offset the IANA rules give that place and date;
// transits.js's classifyAspect() is the one orb table (PRODUCT.md section 3) for every pair.
// Stations are astro.js's mansionOf(), 1-based here as everywhere a visitor reads them.
//
// Without a known birth time the chart is cast for noon at the birthplace and carries no
// houses, no ascendant and no midheaven (the same honesty rule sigil.js and transits.js
// apply); the moon's longitude then has a stated uncertainty of about 6° either way.
// Without coordinates (a place that was typed and never matched) the chart is cast the same
// way: no houses, and the time, if given, is read in the zone the visitor named or UTC.
import { computeChart, SIGNS, signOf, degInSign, houseOf, mansionOf, PLACIDUS_MAX_LAT } from '../../astro.js';
import { classifyAspect } from '../../transits.js';
import { offsetFor } from '../../tz.js';

export const BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const AE_BODY = { mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto' };
// U+FE0E after each glyph asks for the text form: the zodiac signs, Venus and Mars default to
// colour emoji on phones, and the chart is drawn in one ink
const T = '\uFE0E';
export const GLYPH = { sun: '☉' + T, moon: '☽' + T, mercury: '☿' + T, venus: '♀' + T, mars: '♂' + T, jupiter: '♃' + T, saturn: '♄' + T, uranus: '♅' + T, neptune: '♆' + T, pluto: '♇' + T, ascendant: 'AC', midheaven: 'MC' };
export const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map(g => g + T);
export const STATION_WIDTH = 360 / 28;

const norm = d => ((d % 360) + 360) % 360;
const round = (x, p = 4) => Math.round(x * 10 ** p) / 10 ** p;

/** The birth record (api.js's birth shape: birthDate 'YYYY-MM-DD', birthTime 'HH:MM' or null,
 * birthTimeKnown, placeName, lat, lon, tz) read into the numbers the engines take. */
export function birthMoment(birth) {
  if (!birth || typeof birth.birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birth.birthDate)) return null;
  const [year, month, day] = birth.birthDate.split('-').map(Number);
  if (!(month >= 1 && month <= 12 && day >= 1 && day <= 31)) return null;
  const timeKnown = birth.birthTimeKnown !== false && typeof birth.birthTime === 'string' && /^\d{1,2}:\d{2}$/.test(birth.birthTime);
  let hour = 12, minute = 0;
  if (timeKnown) {
    [hour, minute] = birth.birthTime.split(':').map(Number);
    if (!(hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)) return null;
  }
  const hasPlace = Number.isFinite(birth.lat) && Number.isFinite(birth.lon) && Math.abs(birth.lat) <= 90 && Math.abs(birth.lon) <= 180;
  let tzOffset = 0;
  if (birth.tz) {
    try { tzOffset = offsetFor(birth.tz, year, month, day, hour, minute); } catch (e) { tzOffset = 0; }
  }
  const ut = hour + minute / 60 - tzOffset;
  const instant = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + ut * 3600000);
  return { year, month, day, hour, minute, timeKnown, hasPlace, lat: hasPlace ? birth.lat : 0, lon: hasPlace ? birth.lon : 0, tz: birth.tz || null, tzOffset, instant };
}

/** Geocentric tropical longitude and daily motion of a planet from astronomy-engine, the rate
 * from a one-hour step (the sign is the retrograde flag; the size is degrees per day). */
function planetAt(AE, body, date) {
  const lon = AE.Ecliptic(AE.GeoVector(AE.Body[body], date, true)).elon;
  const later = AE.Ecliptic(AE.GeoVector(AE.Body[body], new Date(date.getTime() + 3600000), true)).elon;
  const rate = (norm(later - lon + 180) - 180) * 24;
  return { lon: norm(lon), rate };
}

function placeBody(lon, cusps, extra = {}) {
  const sign = signOf(lon);
  return {
    lon: round(lon),
    sign,
    signName: SIGNS[sign].toLowerCase(),
    degInSign: round(degInSign(lon)),
    station: mansionOf(lon) + 1,
    house: cusps ? houseOf(lon, cusps) : null,
    ...extra,
  };
}

/** The aspects between every pair of the points given ({ name, lon }), transits.js's orbs. */
export function aspectsBetween(points) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i], b = points[j];
      if ((a.name === 'ascendant' && b.name === 'midheaven') || (a.name === 'midheaven' && b.name === 'ascendant')) continue;
      const hit = classifyAspect(a.lon, b.lon);
      if (hit) out.push({ a: a.name, b: b.name, aspect: hit.aspect, plain: hit.plain, orb: round(hit.orbUsed, 2), maxOrb: hit.maxOrb });
    }
  }
  // tightest first, the way a reader scans them
  return out.sort((x, y) => x.orb - y.orb);
}

/**
 * The chart. Async because the planets beyond the Moon load astronomy-engine on first use.
 * Returns null for a birth record the engines cannot read.
 */
export async function castChart(birth, { loadEngine } = {}) {
  const m = birthMoment(birth);
  if (!m) return null;
  const base = computeChart({ year: m.year, month: m.month, day: m.day, hour: m.hour, minute: m.minute, lat: m.lat, lon: m.lon, tzOffset: m.tzOffset });
  const housed = m.timeKnown && m.hasPlace;
  const cusps = housed ? base.cusps : null;
  const AE = loadEngine ? await loadEngine() : await import('../../astronomy-engine.js');

  const bodies = {};
  bodies.sun = placeBody(base.sunLon, cusps, { retrograde: false, rate: null });
  bodies.moon = placeBody(base.moonLon, cusps, { retrograde: false, rate: null });
  for (const name of Object.keys(AE_BODY)) {
    const p = planetAt(AE, AE_BODY[name], m.instant);
    bodies[name] = placeBody(p.lon, cusps, { retrograde: p.rate < 0, rate: round(p.rate, 4) });
  }

  const points = BODIES.map(name => ({ name, lon: bodies[name].lon }));
  const angles = housed ? {
    ascendant: placeBody(base.asc, cusps),
    midheaven: placeBody(base.mc, cusps),
    descendant: placeBody(norm(base.asc + 180), cusps),
    ic: placeBody(norm(base.mc + 180), cusps),
  } : null;
  if (housed) points.push({ name: 'ascendant', lon: angles.ascendant.lon }, { name: 'midheaven', lon: angles.midheaven.lon });

  const houses = housed ? cusps.map((c, i) => ({
    n: i + 1,
    cusp: round(c),
    sign: signOf(c),
    signName: SIGNS[signOf(c)].toLowerCase(),
    degInSign: round(degInSign(c)),
    bodies: BODIES.filter(b => bodies[b].house === i + 1),
  })) : null;

  return {
    jd: round(base.jd, 6),
    instant: m.instant.toISOString(),
    timeKnown: m.timeKnown,
    hasPlace: m.hasPlace,
    housed,
    tzOffset: m.tzOffset,
    houseSystem: housed ? base.houseSystem : null,
    polar: housed && Math.abs(m.lat) > PLACIDUS_MAX_LAT,
    moonUncertainty: m.timeKnown ? 0 : 6.5,
    bodies,
    angles,
    houses,
    aspects: aspectsBetween(points),
    // the station the natal moon stands in: the first segment of the visitor's own ring
    moonStation: bodies.moon.station,
    engine: { sunMoon: 'astro.js', planets: 'astronomy-engine 2.1.19', houses: housed ? base.houseSystem : 'none', tz: 'tz.js (IANA)' },
  };
}

/** Degrees and minutes within the sign, "25°42′". */
export function dm(degIn) {
  let d = Math.floor(degIn), mi = Math.round((degIn - d) * 60);
  if (mi === 60) { mi = 0; d += 1; }
  return `${d}°${String(mi).padStart(2, '0')}′`;
}
