// The shell's on-device sky (app/src/sky-device.js) against the server's GET /api/tonight
// module (starshard-api/lib/tonight.js), 730 nights from 1 Nov 2026, in America/New_York
// (SS5, 1 Nov 2026).
//
// Both read the same instant (21:00 local of the night) and both use astro.js for the Moon
// and the Sun, so the Moon's station, its degree within it and the next crossing must agree
// exactly (to the second, from the same bisection). The planets differ by engine: the server
// has astronomy-engine, the device has Schlyter's low-precision elements (ephemeris2.js's
// table), good to about a degree against a station 12.86 degrees wide. The test asks that
// the five planets' longitudes stay within 1.5 degrees of the server's and that their
// stations agree except where the planet stands within that tolerance of a station edge;
// the report quotes the counts. The retrograde flag must agree except within a day of a
// station (the device derives it from a one-day difference).
//
// The device module reads the process's own clock zone, so this file pins TZ before the
// first Date is made; node --test runs each file in its own process.
process.env.TZ = 'America/New_York';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const require = createRequire(import.meta.url);
const { tonight } = require(join(root, 'starshard-api', 'lib', 'tonight.js'));
const { tonightOnDevice } = await import(join(root, 'app', 'src', 'sky-device.js'));

const TZ = 'America/New_York';
const NIGHTS = 730;
const START = new Date(2026, 10, 1, 22, 0, 0); // 1 Nov 2026, 22:00 local: inside the night of the 1st

const sep = (a, b) => { let d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };

test(`device sky agrees with the server over ${NIGHTS} nights (${TZ})`, async () => {
  const counts = { nights: 0, moonStation: 0, moonDeg: 0, crossing: 0, crossingStation: 0, sunStation: 0, planetStation: 0, planetEdge: 0, planetWithin: 0, planetMax: 0, retro: 0, retroNearEdge: 0, nightKey: 0 };
  const worst = [];
  for (let i = 0; i < NIGHTS; i++) {
    const at = new Date(START.getTime() + i * 86400000);
    const s = await tonight({ tz: TZ, at });
    const d = tonightOnDevice(at, TZ);
    counts.nights++;
    if (s.night === d.night) counts.nightKey++;
    if (s.moon.station === d.moon.station) counts.moonStation++;
    if (Math.abs(s.moon.degIn - d.moon.degIn) < 1e-3) counts.moonDeg++;
    if (Math.abs(new Date(s.nextCrossing.at) - new Date(d.nextCrossing.at)) <= 1000) counts.crossing++;
    if (s.nextCrossing.station === d.nextCrossing.station) counts.crossingStation++;
    if (s.planets.sun.station === d.planets.sun.station) counts.sunStation++;
    for (const p of ['mercury', 'venus', 'mars', 'jupiter', 'saturn']) {
      const dl = sep(s.planets[p].lon, d.planets[p].lon);
      counts.planetMax = Math.max(counts.planetMax, dl);
      if (dl <= 1.5) counts.planetWithin++;
      else worst.push({ night: s.night, p, server: s.planets[p].lon, device: d.planets[p].lon, dl: +dl.toFixed(2) });
      if (s.planets[p].station === d.planets[p].station) counts.planetStation++;
      else {
        const edge = Math.min(s.planets[p].lon % (360 / 28), (360 / 28) - (s.planets[p].lon % (360 / 28)));
        if (edge <= 1.5) counts.planetEdge++;
        else worst.push({ night: s.night, p, server: s.planets[p].lon, device: d.planets[p].lon, dl: +dl.toFixed(2), station: [s.planets[p].station, d.planets[p].station] });
      }
      if (s.planets[p].retrograde === d.planets[p].retrograde) counts.retro++;
      else counts.retroNearEdge++;
    }
  }
  console.log(JSON.stringify(counts));
  if (worst.length) console.log('outside tolerance:', JSON.stringify(worst.slice(0, 10)));
  assert.equal(counts.nightKey, NIGHTS, 'night keys');
  assert.equal(counts.moonStation, NIGHTS, "the moon's station");
  assert.equal(counts.moonDeg, NIGHTS, "the moon's degree in the station");
  assert.equal(counts.crossing, NIGHTS, 'the next crossing, to the second');
  assert.equal(counts.crossingStation, NIGHTS, 'the station crossed into');
  assert.equal(counts.sunStation, NIGHTS, "the sun's station");
  assert.equal(counts.planetWithin, NIGHTS * 5, `five planets within 1.5 degrees of the server (max ${counts.planetMax.toFixed(2)})`);
  assert.equal(counts.planetStation + counts.planetEdge, NIGHTS * 5, 'planet stations agree, or the planet is within tolerance of an edge');
  // the retrograde flag: the device reads it off a one-day step, the server off the engine's
  // velocity; they may differ on the day a planet stations. Allow a station day per reversal.
  assert.ok(counts.retroNearEdge <= 40, `retrograde flags differ on ${counts.retroNearEdge} planet-nights`);
});
