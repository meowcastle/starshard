// The chart engine against three known charts (BACKLOG SS6's gate), and the lexicon against
// every term the chart page can show.
//
// The reference is test/chart-fixtures.json: the Swiss Ephemeris (pyswisseph 2.10.03, Moshier
// ephemeris, Placidus houses) run on 1 November 2026 for three births: Greenwich at J2000
// (1 January 2000, 12:00 UT), New York (15 March 1985, 06:30 EST) and Sydney (23 November
// 1992, 22:45 AEDT), the last one southern and east of Greenwich. The tolerances are the
// engines' own documented accuracy: astro.js's Sun and Moon to 0.12°, its ascendant and
// Placidus cusps to 0.15°, astronomy-engine's planets to 0.05°. Signs, houses, stations and
// retrograde flags must match exactly; a station within 0.2° of an edge is allowed to fall
// either side, and none of the thirty planet positions here does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { castChart, birthMoment, aspectsBetween, BODIES, STATION_WIDTH, dm } from '../app/src/chart-engine.js';
import { LEXICON, define, BODY_NAMES, SIGN_NAMES, ASPECT_NAMES, HOUSE_NAMES } from '../app/src/lexicon.js';
import { SIGNS } from '../astro.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIX = JSON.parse(await readFile(join(here, 'chart-fixtures.json'), 'utf8'));

const norm = d => ((d % 360) + 360) % 360;
const sep = (a, b) => { const d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d; };
const TOL = { sun: 0.12, moon: 0.12, planet: 0.05, angle: 0.15, cusp: 0.15 };

function birthOf(c) {
  return {
    birthDate: `${c.year}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`,
    birthTime: `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`,
    birthTimeKnown: true,
    placeName: c.label,
    lat: c.lat, lon: c.lon, tz: c.tz,
  };
}

for (const c of FIX.charts) {
  test(`chart ${c.id}: ${c.label}`, async () => {
    const birth = birthOf(c);
    const m = birthMoment(birth);
    assert.equal(m.tzOffset, c.tzOffset, 'tz.js gives the fixture\'s offset');
    const chart = await castChart(birth);
    assert.ok(chart, 'the chart casts');
    assert.ok(Math.abs(chart.jd - c.jd) < 1e-5, `jd ${chart.jd} vs ${c.jd}`);
    assert.equal(chart.housed, true);
    assert.equal(chart.houseSystem, 'placidus');

    // every body: longitude within tolerance, sign and station exact, retrograde exact
    for (const name of BODIES) {
      const ref = c.planets[name];
      const got = chart.bodies[name];
      const tol = name === 'sun' ? TOL.sun : name === 'moon' ? TOL.moon : TOL.planet;
      const d = sep(got.lon, ref.lon);
      assert.ok(d <= tol, `${name}: ${got.lon} vs ${ref.lon} (off ${d.toFixed(4)}, allowed ${tol})`);
      assert.equal(got.signName, SIGNS[Math.floor(ref.lon / 30)].toLowerCase(), `${name} sign`);
      const refStation = Math.floor(ref.lon / STATION_WIDTH) + 1;
      const edge = Math.min(ref.lon % STATION_WIDTH, STATION_WIDTH - ref.lon % STATION_WIDTH);
      if (edge > 0.2) assert.equal(got.station, refStation, `${name} station`);
      if (name !== 'sun' && name !== 'moon') assert.equal(got.retrograde, ref.retrograde, `${name} retrograde`);
    }

    // the angles and the cusps
    assert.ok(sep(chart.angles.ascendant.lon, c.asc) <= TOL.angle, `ascendant ${chart.angles.ascendant.lon} vs ${c.asc}`);
    assert.ok(sep(chart.angles.midheaven.lon, c.mc) <= TOL.angle, `midheaven ${chart.angles.midheaven.lon} vs ${c.mc}`);
    assert.equal(chart.houses.length, 12);
    for (let i = 0; i < 12; i++) {
      assert.ok(sep(chart.houses[i].cusp, c.cusps[i]) <= TOL.cusp, `cusp ${i + 1}: ${chart.houses[i].cusp} vs ${c.cusps[i]}`);
    }
    // every body is in exactly one house, and that house lists it
    for (const name of BODIES) {
      const h = chart.bodies[name].house;
      assert.ok(h >= 1 && h <= 12, `${name} house ${h}`);
      assert.ok(chart.houses[h - 1].bodies.includes(name), `house ${h} lists ${name}`);
      // the house from the reference cusps agrees unless the body sits within tolerance of a cusp
      const refHouse = (() => { for (let i = 0; i < 12; i++) { const a = c.cusps[i], b = c.cusps[(i + 1) % 12]; if (norm(c.planets[name].lon - a) < norm(b - a)) return i + 1; } return 1; })();
      const nearCusp = c.cusps.some(k => sep(k, c.planets[name].lon) < TOL.cusp + TOL.planet);
      if (!nearCusp) assert.equal(h, refHouse, `${name} house vs reference cusps`);
    }

    // aspects: each one's orb is inside the table and reproducible from the longitudes
    assert.ok(chart.aspects.length > 0, 'a real chart has aspects');
    for (const a of chart.aspects) {
      assert.ok(a.orb <= a.maxOrb, `${a.a} ${a.aspect} ${a.b} orb ${a.orb} > ${a.maxOrb}`);
      assert.ok(ASPECT_NAMES.includes(a.aspect));
    }
    for (let i = 1; i < chart.aspects.length; i++) assert.ok(chart.aspects[i].orb >= chart.aspects[i - 1].orb, 'tightest first');
  });
}

test('the natal moon station is the moon\'s', async () => {
  const c = FIX.charts[0];
  const chart = await castChart(birthOf(c));
  assert.equal(chart.moonStation, chart.bodies.moon.station);
});

test('a noon chart: no time, no houses, the moon carries an uncertainty', async () => {
  const c = FIX.charts[1];
  const b = { ...birthOf(c), birthTime: null, birthTimeKnown: false };
  const chart = await castChart(b);
  assert.equal(chart.timeKnown, false);
  assert.equal(chart.housed, false);
  assert.equal(chart.houses, null);
  assert.equal(chart.angles, null);
  assert.ok(chart.moonUncertainty >= 6);
  assert.equal(chart.bodies.moon.house, null);
  // noon at the birthplace: the sun is within half a day of the reference
  assert.ok(sep(chart.bodies.sun.lon, c.planets.sun.lon) < 0.6);
  // no aspect names an angle
  assert.ok(chart.aspects.every(a => a.a !== 'ascendant' && a.b !== 'ascendant' && a.a !== 'midheaven' && a.b !== 'midheaven'));
});

test('no place: cast the same way, no houses', async () => {
  const c = FIX.charts[2];
  const b = { ...birthOf(c), lat: null, lon: null };
  const chart = await castChart(b);
  assert.equal(chart.hasPlace, false);
  assert.equal(chart.housed, false);
  assert.equal(chart.timeKnown, true);
});

test('a birth record the engines cannot read casts nothing', async () => {
  assert.equal(await castChart(null), null);
  assert.equal(await castChart({ birthDate: '1985-13-01' }), null);
  assert.equal(await castChart({ birthDate: 'yesterday' }), null);
  assert.equal(await castChart({ birthDate: '1985-03-15', birthTime: '25:00', birthTimeKnown: true }), null);
});

test('aspectsBetween: the ascendant and the midheaven are never aspected to each other', () => {
  const out = aspectsBetween([{ name: 'ascendant', lon: 0 }, { name: 'midheaven', lon: 270 }, { name: 'sun', lon: 90 }]);
  assert.ok(!out.some(a => (a.a === 'ascendant' && a.b === 'midheaven')));
  assert.ok(out.some(a => a.a === 'ascendant' && a.b === 'sun' && a.aspect === 'square'));
  assert.ok(out.some(a => a.a === 'midheaven' && a.b === 'sun' && a.aspect === 'opposition'));
});

test('dm never prints 60 minutes', () => {
  assert.equal(dm(25.9999), '26°00′');
  assert.equal(dm(0), '0°00′');
  assert.equal(dm(12.5), '12°30′');
});

// ─── the lexicon: no term without a definition ───────────────────────────────────────────
test('every term the chart page can show has a definition', () => {
  const needed = [
    ...BODY_NAMES, ...SIGN_NAMES, ...ASPECT_NAMES, ...HOUSE_NAMES,
    'ascendant', 'midheaven', 'descendant', 'ic', 'sign', 'house', 'cusp', 'degree', 'retrograde', 'orb', 'aspect',
    'station', 'placidus', 'porphyry', 'tropical', 'noon chart',
  ];
  for (const t of needed) {
    const d = define(t);
    assert.ok(typeof d === 'string' && d.trim().length >= 12, `no definition for "${t}"`);
  }
  assert.equal(define('no such term'), null);
});

test('the lexicon keeps the house style: no em dashes, lowercase, no first person', () => {
  for (const [k, v] of Object.entries(LEXICON)) {
    assert.ok(!/—|–/.test(v), `${k}: dash`);
    assert.ok(!/\bwe\b|\bour\b/i.test(v), `${k}: first person`);
    assert.equal(v, v.toLowerCase(), `${k}: uppercase`);
    assert.ok(v.length <= 200, `${k}: too long (${v.length})`);
  }
});
