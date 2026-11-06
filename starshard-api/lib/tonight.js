// tonight.js, the one sky behind GET /api/tonight (SS2, 31 Oct 2026).
//
// Why this exists: SHIP-AUDIT-26OCT.md found that the game (ephemeris2.js, on device) and the
// reading (astro.js) name different stations for the Moon on a few nights a year, because they
// are two engines. The fix is one server answer both clients read. This module is that answer.
//
// Division of labour, as the codebase already states it (sky.js and transits.js headers):
//   - astro.js is canonical for the Sun and the Moon. The Moon's station, its degree within the
//     station and the next crossing come from astro.js's moonLongitude(), verified against the
//     Swiss Ephemeris (max 0.106 deg over 150,000 charts, see astro.js).
//   - astronomy-engine.js (vendored, MIT) is canonical for the planets astro.js cannot do.
//     Mercury to Saturn come from transits.js's planetPositions(), which is what the reading
//     already uses for transits, retrograde flag included.
//   - ephemeris2.js is not used here. It stays in the game as the offline fallback and is held
//     against this module by test/tonight-agreement.test.mjs (730 nights).
//
// The night: a night's station holds from 06:00 to 06:00 local and is read at 21:00 local of
// that night, exactly ephemeris2.js's nightAnchor() rule, so the two engines are compared and
// served at the same instant. "Local" is the caller's IANA zone (`tz`); the wall clock is turned
// into an instant through tz.js's offsetFor(), which honours DST on the night in question.
//
// The next crossing is searched forward from the anchor, not from the request instant, so the
// answer belongs to the night and does not change between 21:00 and 06:00. Coarse ten-minute
// steps find the station change, then a bisection pins it to the second.
//
// Everything here is read-only and depends on nothing but the clock, so the route is public
// and cacheable; the response carries the engine names so a client can say where its sky
// came from.
'use strict';

const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const WIDTH = 360 / 28; // 12 deg 51' 25.7" per station, tropical, station 1 at 0 deg Aries

let _mods = null;
function mods() {
  if (!_mods) {
    _mods = Promise.all([
      import(path.join(ROOT, 'astro.js')),
      import(path.join(ROOT, 'tz.js')),
      import(path.join(ROOT, 'transits.js')),
    ]).then(([astro, tz, transits]) => ({ astro, tz, transits }));
  }
  return _mods;
}

const norm = d => ((d % 360) + 360) % 360;
const jdOf = date => date.getTime() / 86400000 + 2440587.5;
const stationOf = lon => Math.floor(norm(lon) / WIDTH) + 1; // 1..28, the game's idOf()

/** True when `tz` is a zone the platform's ICU knows. */
function validTz(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; }
}

/** The wall clock of `date` in `tz`: { y, m, d, hh, mm }. */
function wallClock(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(date);
  const get = t => Number(parts.find(p => p.type === t).value);
  return { y: get('year'), m: get('month'), d: get('day'), hh: get('hour') % 24, mm: get('minute') };
}

/** The night `at` belongs to, in `tz`: before 06:00 local it is still the previous date's
 * night. Returns { night: 'YYYY-MM-DD', anchor: Date } with the anchor at 21:00 local. */
async function nightOf(at, tz) {
  const { tz: tzmod } = await mods();
  const w = wallClock(at, tz);
  let day = new Date(Date.UTC(w.y, w.m - 1, w.d));
  if (w.hh < 6) day = new Date(day.getTime() - 86400000);
  const y = day.getUTCFullYear(), m = day.getUTCMonth() + 1, d = day.getUTCDate();
  const off = tzmod.offsetFor(tz, y, m, d, 21, 0);
  const anchor = new Date(Date.UTC(y, m - 1, d, 21, 0) - off * 3600000);
  const night = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { night, anchor };
}

/** The first instant after `from` at which astro.js's Moon stands in a different station.
 * Ten-minute steps (the Moon needs about 23 hours for a station, so the step never skips
 * one), then bisection to the second. */
function nextCrossing(moonLongitude, from) {
  const id0 = stationOf(moonLongitude(jdOf(from)));
  const STEP = 10 * 60 * 1000;
  let lo = from.getTime(), hi = lo;
  for (let i = 0; i < 400; i++) { // at most 2.8 days, a station never lasts longer
    hi = lo + STEP;
    if (stationOf(moonLongitude(jdOf(new Date(hi)))) !== id0) break;
    lo = hi;
  }
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (stationOf(moonLongitude(jdOf(new Date(mid)))) === id0) lo = mid; else hi = mid;
  }
  const at = new Date(hi);
  return { at, station: stationOf(moonLongitude(jdOf(at))) };
}

const round = (x, p = 4) => Math.round(x * 10 ** p) / 10 ** p;

/** The sky for the night `at` (a Date, default now) belongs to in `tz` (IANA, default UTC).
 * Throws { code: 'bad_tz' | 'bad_at' } on bad input. */
async function tonight({ tz = 'UTC', at = new Date() } = {}) {
  if (!validTz(tz)) { const e = new Error('bad_tz'); e.code = 'bad_tz'; throw e; }
  if (!(at instanceof Date) || isNaN(at.getTime())) { const e = new Error('bad_at'); e.code = 'bad_at'; throw e; }
  const { astro, transits } = await mods();
  const { night, anchor } = await nightOf(at, tz);
  const jd = jdOf(anchor);

  const moonLon = astro.moonLongitude(jd);
  const sunLon = astro.sunLongitude(jd);
  const station = stationOf(moonLon);
  const degIn = norm(moonLon) - (station - 1) * WIDTH;

  const others = await transits.planetPositions(anchor);
  const planets = {
    sun: { lon: round(sunLon), station: stationOf(sunLon) },
    moon: { lon: round(moonLon), station },
  };
  for (const name of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
    const p = others[name];
    planets[name.toLowerCase()] = { lon: round(p.lon), station: stationOf(p.lon), retrograde: !!p.retrograde };
  }

  const cross = nextCrossing(astro.moonLongitude, anchor);

  return {
    tz,
    at: at.toISOString(),
    night,
    anchor: anchor.toISOString(),
    moon: { station, lon: round(moonLon), degIn: round(degIn), width: round(WIDTH) },
    planets,
    nextCrossing: { at: cross.at.toISOString(), station: cross.station },
    engine: { sunMoon: 'astro.js', planets: 'astronomy-engine.js' },
  };
}

module.exports = { tonight, nightOf, nextCrossing, stationOf, validTz, wallClock, WIDTH };
