// Star Shard — display formatting. Pure functions, no DOM, no state.
//
// OWNER: Claude Code. Do not edit from Claude Design.

import { SIGNS } from './astro.js';

const norm = d => ((d % 360) + 360) % 360;

/**
 * Ecliptic longitude -> "14deg 19' Scorpio".
 *
 * Carries minutes into degrees and degrees into the next sign. Without the
 * carry, 12.9955 renders as the impossible "12deg 60'" and 29.9955 renders as
 * "29deg 60' Aries" when it is really 0deg 00' Taurus. That is 1/120 of all
 * longitudes, and the chart table shows 16 of them, so 12.5% of charts had a
 * visible one.
 */
export function degFmt(lon) {
  const L = norm(lon);
  let sign = Math.floor(L / 30);
  let deg = Math.floor(L % 30);
  let min = Math.round((L % 1) * 60);
  if (min === 60) { min = 0; deg += 1; }
  if (deg === 30) { deg = 0; sign = (sign + 1) % 12; }
  return `${deg}°${String(min).padStart(2, '0')}′ ${SIGNS[sign]}`;
}

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 21 -> "21st". */
export function ordinal(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
}

export const ORDINAL_WORDS = ['1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th'];

/** "clocks there read UTC-5, daylight saving was on, handled automatically" */
export function offsetLine(info) {
  const sign = info.off >= 0 ? '+' : '';
  const dst = info.dst
    ? ', daylight saving was on, handled automatically ✓'
    : ', no daylight saving that day ✓';
  return `clocks there read UTC${sign}${info.off}${dst}`;
}

export function placeLine(place) {
  if (!place) return '';
  return `${place.name}, ${place.region} · ${place.lat.toFixed(2)}°, ${place.lon.toFixed(2)}°`;
}

export function birthLine(date, time, place, manualMode) {
  const where = manualMode ? 'a custom spot on Earth' : (place ? place.name : '');
  return `${date} · ${time} · ${where}`;
}
