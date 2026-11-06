// crossings.js: when the moon crosses a station, computed on the device (SS9, 2 Nov 2026).
//
// Pure functions, no React, no DOM. astro.js's moonLongitude() is the engine of record for
// the moon (verified against the Swiss Ephemeris); the station is sky-device.js's stationOf,
// the same 12°51′ division the server uses. A visit is the stretch the moon spends inside one
// station, about a day; it returns about every 27.3 days. The search is coarse steps of two
// hours, then a bisection to the minute, the shape of lib/tonight.js's nextCrossing.
//
// The framing is presence and return, never expiry (research/game-ethics.md, the guardrail
// list): the page says when the moon arrives and when it comes back, and nothing counts down.
import { moonLongitude } from '../../astro.js';
import { stationOf } from './sky-device.js';

const jdOf = date => date.getTime() / 86400000 + 2440587.5;
const at = t => stationOf(moonLongitude(jdOf(new Date(t))));
const STEP = 2 * 60 * 60 * 1000;

/** The first instant at or after `t` (ms) where `test(station)` holds, within `maxDays`. */
function seek(t, test, maxDays = 35) {
  if (test(at(t))) return t;
  let lo = t, hi = t;
  const end = t + maxDays * 86400000;
  while (hi < end) {
    hi = lo + STEP;
    if (test(at(hi))) break;
    lo = hi;
  }
  if (hi >= end) return null;
  // bisection to the minute
  while (hi - lo > 60000) {
    const mid = (lo + hi) / 2;
    if (test(at(mid))) hi = mid; else lo = mid;
  }
  return Math.ceil(hi / 60000) * 60000;
}

/** The moon's visits to station `n` (1..28) from `now`: `count` of them, each { enter, leave }
 * as Dates, with `here` true when the moon is inside the station now (its `enter` is then the
 * past entry). */
export function visits(n, now = new Date(), count = 3) {
  const out = [];
  let t = now.getTime();
  const here = at(t) === n;
  if (here) {
    // walk back to the entry
    let lo = t - 3 * 86400000, hi = t;
    while (hi - lo > 60000) { const mid = (lo + hi) / 2; if (at(mid) === n) hi = mid; else lo = mid; }
    const enter = Math.floor(hi / 60000) * 60000;
    const leave = seek(t, s => s !== n, 5);
    out.push({ enter: new Date(enter), leave: new Date(leave), here: true });
    t = leave + 86400000;
  }
  while (out.length < count) {
    const enter = seek(t, s => s === n);
    if (enter == null) break;
    const leave = seek(enter + 3600000, s => s !== n, 5);
    out.push({ enter: new Date(enter), leave: new Date(leave), here: false });
    t = leave + 86400000;
  }
  return out;
}

const DAY = { weekday: 'long', day: 'numeric', month: 'long' };
/** "tuesday 4 november at 03:12", in the device's own clock. */
export function whenWords(d) {
  const day = d.toLocaleDateString('en-GB', DAY).toLowerCase().replace(',', '');
  return `${day} at ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
/** "a day and two hours": how long a visit lasts, in hours rounded. */
export function spanWords(a, b) {
  const h = Math.round((b.getTime() - a.getTime()) / 3600000);
  if (h < 24) return `${h} hours`;
  const d = Math.floor(h / 24), r = h % 24;
  const days = d === 1 ? 'a day' : `${d} days`;
  return r ? `${days} and ${r} hour${r === 1 ? '' : 's'}` : days;
}
