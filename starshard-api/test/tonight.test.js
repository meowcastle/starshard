// tonight.test.js, route tests for GET /api/tonight (SS2, 31 Oct 2026).
//
// What is proved here: the route's contract (shape, defaults, 400s, caching header), the
// night rule (06:00 to 06:00 local, read at 21:00 local, DST honoured), that the next crossing
// is the next station after the anchor, and that on an ordinary night the server's station is
// the one the game's own engine (ephemeris2.js, evaluated as-is) would name. The 730-night
// comparison of the two engines lives at the repo root in test/tonight-agreement.test.mjs.
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { boot, client } = require('./helpers/boot');
const { WIDTH } = require('../lib/tonight');

const ROOT = path.join(__dirname, '..', '..');

function gameEphem() {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'ephemeris2.js'), 'utf8'), ctx, { filename: 'ephemeris2.js' });
  return ctx.window.ManzilEphem;
}

let srv, c;
before(async () => { srv = await boot(); c = client(srv.base); });
after(async () => { await srv.close(); });

const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

test('GET /api/tonight answers the full shape for a zone and an instant', async () => {
  const r = await c.get('/api/tonight?tz=America/New_York&at=2026-10-31T23:30:00Z');
  assert.equal(r.status, 200);
  const s = r.json;
  assert.equal(s.tz, 'America/New_York');
  assert.equal(s.night, '2026-10-31');
  assert.equal(s.anchor, '2026-11-01T01:00:00.000Z'); // 21:00 EDT on 31 Oct
  assert.ok(Number.isInteger(s.moon.station) && s.moon.station >= 1 && s.moon.station <= 28);
  assert.ok(s.moon.lon >= 0 && s.moon.lon < 360);
  assert.ok(s.moon.degIn >= 0 && s.moon.degIn < WIDTH + 1e-9);
  assert.equal(Math.floor(s.moon.lon / WIDTH) + 1, s.moon.station);
  assert.deepEqual(Object.keys(s.planets), PLANETS);
  for (const p of PLANETS) {
    assert.ok(s.planets[p].lon >= 0 && s.planets[p].lon < 360, p);
    assert.equal(Math.floor(s.planets[p].lon / WIDTH) + 1, s.planets[p].station, p);
  }
  for (const p of PLANETS.slice(2)) assert.equal(typeof s.planets[p].retrograde, 'boolean', p);
  assert.equal(s.planets.moon.station, s.moon.station);
  assert.equal(s.engine.sunMoon, 'astro.js');
  assert.equal(s.engine.planets, 'astronomy-engine.js');
  assert.match(r.headers.get('cache-control'), /public/);
});

test('the night rule: before 06:00 local it is still last night; 21:00 local is the anchor, DST and all', async () => {
  // 03:00 EST on 15 Jan 2027 is 08:00Z; the night is 14 Jan, anchored 21:00 EST = 02:00Z on the 15th
  let r = await c.get('/api/tonight?tz=America/New_York&at=2027-01-15T08:00:00Z');
  assert.equal(r.json.night, '2027-01-14');
  assert.equal(r.json.anchor, '2027-01-15T02:00:00.000Z');
  // 07:00 EST the same morning is a new night
  r = await c.get('/api/tonight?tz=America/New_York&at=2027-01-15T12:00:00Z');
  assert.equal(r.json.night, '2027-01-15');
  assert.equal(r.json.anchor, '2027-01-16T02:00:00.000Z');
  // Summer: 21:00 EDT is 01:00Z
  r = await c.get('/api/tonight?tz=America/New_York&at=2027-07-04T20:00:00Z');
  assert.equal(r.json.night, '2027-07-04');
  assert.equal(r.json.anchor, '2027-07-05T01:00:00.000Z');
  // The same instant is a different night east of the date line
  r = await c.get('/api/tonight?tz=Asia/Tokyo&at=2027-07-04T20:00:00Z'); // 05:00 JST on the 5th
  assert.equal(r.json.night, '2027-07-04');
  assert.equal(r.json.anchor, '2027-07-04T12:00:00.000Z'); // 21:00 JST on the 4th
});

test('the same night gives the same sky whenever it is asked for between 06:00 and 06:00', async () => {
  const a = await c.get('/api/tonight?tz=Europe/London&at=2027-03-10T06:00:00Z'); // 06:00 GMT, first minute of the night
  const b = await c.get('/api/tonight?tz=Europe/London&at=2027-03-11T05:59:00Z'); // last minute
  assert.equal(a.json.night, '2027-03-10');
  assert.equal(b.json.night, '2027-03-10');
  assert.deepEqual(a.json.moon, b.json.moon);
  assert.deepEqual(a.json.nextCrossing, b.json.nextCrossing);
  assert.deepEqual(a.json.planets, b.json.planets);
});

test('the next crossing is after the anchor and lands in the following station', async () => {
  const r = await c.get('/api/tonight?tz=America/New_York&at=2026-10-31T23:30:00Z');
  const s = r.json;
  const anchor = Date.parse(s.anchor), cross = Date.parse(s.nextCrossing.at);
  assert.ok(cross > anchor);
  assert.ok(cross - anchor < 2.8 * 86400000);
  assert.equal(s.nextCrossing.station, (s.moon.station % 28) + 1);
  // Walking the anchor forward past the crossing names the next station
  const after = await c.get(`/api/tonight?tz=UTC&at=${new Date(cross + 60000).toISOString()}`);
  // the night that instant belongs to has its own 21:00 anchor, so only check the arithmetic
  assert.ok(after.status === 200);
});

test('defaults: no tz is UTC, no at is now', async () => {
  const before = Date.now();
  const r = await c.get('/api/tonight');
  assert.equal(r.status, 200);
  assert.equal(r.json.tz, 'UTC');
  const at = Date.parse(r.json.at);
  assert.ok(at >= before - 1000 && at <= Date.now() + 1000);
});

test('a zone ICU does not know, or an unreadable instant, is a 400 with a code', async () => {
  let r = await c.get('/api/tonight?tz=Mars/Olympus');
  assert.equal(r.status, 400);
  assert.deepEqual(r.json, { error: 'bad_tz' });
  r = await c.get('/api/tonight?tz=UTC&at=yesterday');
  assert.equal(r.status, 400);
  assert.deepEqual(r.json, { error: 'bad_at' });
  r = await c.get('/api/tonight?tz=');
  assert.equal(r.status, 400);
});

test('one sky: on an ordinary night the server names the station the game engine names', async () => {
  const E = gameEphem();
  // Ten nights spread over a year; the 730-night test at the repo root holds the two engines
  // against each other in full and documents the nights they part.
  for (let i = 0; i < 10; i++) {
    const at = new Date(Date.UTC(2026, 10, 1 + i * 36, 23, 0, 0));
    const r = await c.get(`/api/tonight?tz=America/New_York&at=${at.toISOString()}`);
    const anchor = new Date(r.json.anchor);
    // mansionAt(anchor), not tonight(): the game's nightAnchor() reads the process's local
    // clock, and the server has already placed the anchor at 21:00 in the caller's zone.
    const gameAtAnchor = E.mansionAt(anchor);
    const delta = Math.abs(((r.json.moon.lon - gameAtAnchor.lon + 540) % 360) - 180);
    assert.ok(delta < 0.1, `night ${r.json.night}: astro.js ${r.json.moon.lon} vs ephemeris2 ${gameAtAnchor.lon.toFixed(4)}`);
    // a station disagreement is allowed only when the Moon is within the engines' spread of a boundary
    if (gameAtAnchor.id !== r.json.moon.station) {
      const toEdge = Math.min(r.json.moon.degIn, WIDTH - r.json.moon.degIn);
      assert.ok(toEdge < 0.1, `night ${r.json.night}: stations differ with the Moon ${toEdge.toFixed(3)} deg from an edge`);
    }
  }
});
