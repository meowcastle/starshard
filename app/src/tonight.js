// tonight.js: the one sky the shell reads (SS5, 1 Nov 2026).
//
// The server's GET /api/tonight (starshard-api/lib/tonight.js) is the answer of record: astro.js
// for the Sun and the Moon, astronomy-engine for the five planets, read at 21:00 local of the
// night the request falls in (a night runs 06:00 to 06:00). This module asks it once per page
// load and caches the answer for the session. When the API is not reachable (a local static
// server, a dropped connection, the first seconds of a cold start) it computes the same shape
// on the device the way the game's ephemeris2.js does: astro.js's own moonLongitude() and
// sunLongitude() for the two lights, the same night anchor, the same ten-minute search and
// bisection for the next crossing, and Schlyter's low-precision elements (ephemeris2.js's
// table, verbatim) for Mercury to Saturn. The answer says which engine produced it.
//
// test/tonight-fallback.test.mjs holds the fallback against the server module over 730
// nights; the numbers in the report come from that run.
import { useEffect, useState } from 'react';
import { API_BASE } from '../../api.js';
import { apiReachable } from './shell.jsx';
import { tonightOnDevice, localTz } from './sky-device.js';
export { WIDTH, stationOf, nightAnchor, nightKey, nextCrossing, planetsSchlyter, tonightOnDevice, localTz } from './sky-device.js';

let cached = null;
/** Where the API's answer is kept for the game's page (app/play/tonight-bridge.js reads it). */
export const TONIGHT_KEY = 'starshard-tonight';
/** The sky, from the API when it answers, from the device otherwise. One answer per load. */
export async function getTonight() {
  if (cached) return cached;
  const tz = localTz();
  if (typeof window !== 'undefined' && apiReachable()) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(`${API_BASE}/api/tonight?tz=${encodeURIComponent(tz)}`, { signal: ctl.signal });
      clearTimeout(t);
      if (r.ok) {
        const sky = await r.json();
        if (sky && sky.moon && sky.planets) {
          cached = { ...sky, source: 'api' };
          // kept for the game (SS9b): app/play/tonight-bridge.js reads this key at /play/ so the
          // game opens on the same station the shell shows, with no second engine deciding
          try { localStorage.setItem(TONIGHT_KEY, JSON.stringify({ ...sky, tz })); } catch (e) { /* storage is a convenience */ }
          return cached;
        }
      }
    } catch (e) { /* the device answers */ }
  }
  cached = { ...tonightOnDevice(new Date(), tz), source: 'device' };
  return cached;
}

/** React: the sky, or null until it is known. The device answer is synchronous, so a page on
 * a local server has its sky on the first paint after mount. */
export function useTonight() {
  const [sky, setSky] = useState(cached);
  useEffect(() => {
    let live = true;
    getTonight().then(s => { if (live) setSky(s); });
    return () => { live = false; };
  }, []);
  return sky;
}

// The hour of the night, as the game's lobby lights it: its four walk steps are dusk, full
// dark, the small hours and the hour before dawn, one set of layers each (the game ties the
// step to the level; the shell ties it to the clock). Daylight gets the first set, the game's
// own default.
export function hourStep(at = new Date()) {
  const h = at.getHours();
  if (h >= 17 && h < 21) return 0;
  if (h >= 21 || h < 1) return 1;
  if (h >= 1 && h < 4) return 2;
  if (h >= 4 && h < 7) return 3;
  return 0;
}
export const HOUR_NAMES = ['dusk', 'full dark', 'the small hours', 'the hour before dawn'];

/** "in 4h 12m", "tomorrow at 03:12", "on tuesday at 19:40": when a crossing happens, said
 * from `now`, as presence rather than a countdown past a day. */
export function crossingWhen(iso, now = new Date()) {
  const at = new Date(iso);
  const ms = at.getTime() - now.getTime();
  if (ms <= 0) return 'now';
  const hh = String(at.getHours()).padStart(2, '0'), mm = String(at.getMinutes()).padStart(2, '0');
  const sameDay = at.toDateString() === now.toDateString();
  if (sameDay) {
    const m = Math.round(ms / 60000), h = Math.floor(m / 60);
    return h > 0 ? `in ${h}h ${String(m % 60).padStart(2, '0')}m, at ${hh}:${mm}` : `in ${m}m, at ${hh}:${mm}`;
  }
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (at.toDateString() === tomorrow.toDateString()) return `tomorrow at ${hh}:${mm}`;
  const day = at.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return `on ${day} at ${hh}:${mm}`;
}

/** "sunday 1 november" for a night key, in the device's words. */
export function nightLabel(night) {
  const [y, m, d] = night.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).toLowerCase().replace(',', '');
}
