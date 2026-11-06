// sky-device.js: the sky computed on the device, the shape of GET /api/tonight (SS5, 1 Nov 2026).
//
// Pure functions, no React, no DOM: astro.js's moonLongitude() and sunLongitude() for the two
// lights (the engine of record for them, verified against the Swiss Ephemeris), the game's
// night anchor (ephemeris2.js's nightAnchor: a night runs 06:00 to 06:00 and is read at
// 21:00 local), the server's own ten-minute search and bisection for the next crossing, and
// Schlyter's low-precision elements, ephemeris2.js's table verbatim, for Mercury to Saturn.
// test/tonight-fallback.test.mjs holds this against starshard-api/lib/tonight.js over 730
// nights. tonight.js (the fetch and the hook) uses it when the API does not answer.
import { moonLongitude, sunLongitude } from '../../astro.js';

export const WIDTH = 360 / 28;
const norm = d => ((d % 360) + 360) % 360;
const jdOf = date => date.getTime() / 86400000 + 2440587.5;
export const stationOf = lon => Math.floor(norm(lon) / WIDTH) + 1; // 1..28
const round = (x, p = 4) => Math.round(x * 10 ** p) / 10 ** p;

/** The night `at` belongs to, on the device's own clock: before 06:00 it is still the previous
 * date's night; the anchor is 21:00 of that date. ephemeris2.js's nightAnchor(), unchanged. */
export function nightAnchor(at = new Date()) {
  const d = new Date(at.getTime());
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  d.setHours(21, 0, 0, 0);
  return d;
}
export function nightKey(anchor) {
  return `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-${String(anchor.getDate()).padStart(2, '0')}`;
}

/** The first instant after `from` at which the Moon stands in another station. Ten-minute
 * steps, then a bisection to the second (lib/tonight.js's nextCrossing). */
export function nextCrossing(from) {
  const id0 = stationOf(moonLongitude(jdOf(from)));
  const STEP = 10 * 60 * 1000;
  let lo = from.getTime(), hi = lo;
  for (let i = 0; i < 400; i++) {
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

// Schlyter's elements, ephemeris2.js's table verbatim: N, i, w, a, e, M (deg, AU), d = days
// since 1999-12-31 0h. Good to about a degree, far inside a station's 12.86.
const D2R = Math.PI / 180;
const EL = {
  mercury: [48.3313, 3.24e-5, 7.0047, 5e-8, 29.1241, 1.01444e-5, 0.387098, 0.205635, 5.59e-10, 168.6562, 4.0923344368],
  venus: [76.6799, 2.46e-5, 3.3946, 2.75e-8, 54.891, 1.38374e-5, 0.72333, 0.006773, -1.302e-9, 48.0052, 1.6021302244],
  mars: [49.5574, 2.11e-5, 1.8497, -1.78e-8, 286.5016, 2.92961e-5, 1.523688, 0.093405, 2.516e-9, 18.6021, 0.5240207766],
  jupiter: [100.4542, 2.76854e-5, 1.303, -1.557e-7, 273.8777, 1.64505e-5, 5.20256, 0.048498, 4.469e-9, 19.895, 0.0830853001],
  saturn: [113.6634, 2.3898e-5, 2.4886, -1.081e-7, 339.3939, 2.97661e-5, 9.55475, 0.055546, -9.499e-9, 316.967, 0.0334442282],
};
function kepler(M, e) {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < 8; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}
function helio(name, d) {
  const [N0, Nd, i0, id_, w0, wd, a, e0, ed, M0, Md] = EL[name];
  const N = norm(N0 + Nd * d) * D2R, inc = (i0 + id_ * d) * D2R, w = norm(w0 + wd * d) * D2R;
  const e = e0 + ed * d, M = norm(M0 + Md * d) * D2R;
  const E = kepler(M, e);
  const xv = a * (Math.cos(E) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv), r = Math.sqrt(xv * xv + yv * yv);
  return {
    x: r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(inc)),
    y: r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(inc)),
  };
}
function sunSchlyter(d) {
  const w = norm(282.9404 + 4.70935e-5 * d) * D2R, e = 0.016709 - 1.151e-9 * d, M = norm(356.047 + 0.9856002585 * d) * D2R;
  const E = kepler(M, e);
  const xv = Math.cos(E) - e, yv = Math.sqrt(1 - e * e) * Math.sin(E);
  return { lon: norm((Math.atan2(yv, xv) + w) / D2R), r: Math.sqrt(xv * xv + yv * yv) };
}
/** Geocentric tropical longitudes of the five planets at `date`. */
export function planetsSchlyter(date) {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451543.5;
  const s = sunSchlyter(d);
  const xs = s.r * Math.cos(s.lon * D2R), ys = s.r * Math.sin(s.lon * D2R);
  const out = {};
  for (const name of Object.keys(EL)) {
    const h = helio(name, d);
    out[name] = norm(Math.atan2(h.y + ys, h.x + xs) / D2R);
  }
  return out;
}

/** The sky on the device, same shape as GET /api/tonight. */
export function tonightOnDevice(at = new Date(), tz) {
  const anchor = nightAnchor(at);
  const jd = jdOf(anchor);
  const moonLon = moonLongitude(jd), sunLon = sunLongitude(jd);
  const station = stationOf(moonLon);
  const now = planetsSchlyter(anchor);
  const later = planetsSchlyter(new Date(anchor.getTime() + 86400000));
  const planets = {
    sun: { lon: round(sunLon), station: stationOf(sunLon) },
    moon: { lon: round(moonLon), station },
  };
  for (const name of Object.keys(EL)) {
    let dl = norm(later[name] - now[name]);
    if (dl > 180) dl -= 360;
    planets[name] = { lon: round(now[name]), station: stationOf(now[name]), retrograde: dl < 0 };
  }
  const cross = nextCrossing(anchor);
  return {
    tz: tz || localTz(),
    at: at.toISOString(),
    night: nightKey(anchor),
    anchor: anchor.toISOString(),
    moon: { station, lon: round(moonLon), degIn: round(norm(moonLon) - (station - 1) * WIDTH), width: round(WIDTH) },
    planets,
    nextCrossing: { at: cross.at.toISOString(), station: cross.station },
    engine: { sunMoon: 'astro.js', planets: 'ephemeris2 (device)' },
  };
}

export function localTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
}

