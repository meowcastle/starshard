// Star Shard — chart wheel geometry. Pure: chart in, SVG coordinates out.
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// The wheel is drawn in a 340x340 viewBox centred on (170,170) with the
// Ascendant pinned to the left horizon, which is the conventional orientation.
// If Claude Design changes the SVG size, change SIZE/RADII here to match — the
// template reads only the numbers this file produces.

import { SIGN_GLYPHS } from './astro.js';

export const SIZE = 340;
export const CENTER = SIZE / 2;
export const RADII = { zodiacInner: 132, zodiacOuter: 160, glyph: 146, hub: 46, planet: 105, houseNum: 72 };

const D2R = Math.PI / 180;

export const EMPTY = { ticks: [], glyphs: [], cusps: [], planets: [] };

export function wheelData(chart) {
  if (!chart) return EMPTY;
  const asc = chart.asc;
  const pt = (r, L) => {
    const a = (L - asc) * D2R;
    return { x: +(CENTER - r * Math.cos(a)).toFixed(1), y: +(CENTER + r * Math.sin(a)).toFixed(1) };
  };

  const ticks = [], glyphs = [];
  for (let s = 0; s < 12; s++) {
    const p1 = pt(RADII.zodiacInner, s * 30), p2 = pt(RADII.zodiacOuter, s * 30);
    ticks.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    const gm = pt(RADII.glyph, s * 30 + 15);
    glyphs.push({ x: gm.x, y: gm.y, t: SIGN_GLYPHS[s] });
  }

  const cusps = chart.cusps.map((L, i) => {
    const p1 = pt(RADII.hub, L), p2 = pt(RADII.zodiacInner, L);
    const next = chart.cusps[(i + 1) % 12];
    const span = ((next - L) % 360 + 360) % 360;
    const mid = pt(RADII.houseNum, L + span / 2);
    const angular = i === 0 || i === 3 || i === 6 || i === 9;
    return {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      num: String(i + 1), nx: mid.x, ny: mid.y,
      color: angular ? '#b45a8e' : '#e9b8d2', wdt: angular ? '2' : '1',
    };
  });

  // Nudge the Moon down when it would collide with the Sun glyph.
  const ps = pt(RADII.planet, chart.sunLon), pm = pt(RADII.planet, chart.moonLon);
  if (Math.abs(ps.x - pm.x) < 26 && Math.abs(ps.y - pm.y) < 26) pm.y = +(pm.y + 28).toFixed(1);

  const planets = [
    { x: ps.x, y: ps.y, t: '☉', c: '#e0a63c' },
    { x: pm.x, y: pm.y, t: '☽', c: '#9d84e8' },
  ];

  return { ticks, glyphs, cusps, planets };
}
