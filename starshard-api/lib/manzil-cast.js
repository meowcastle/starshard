// manzil-cast.js, the server-side twin of the live client's _castFive() (SS1, 28 Oct 2026).
//
// Why this exists: a Star Shard signup (app/, the shell at the root domain) stores full birth
// facts in birth_data and sends no five/pack, so the server has to be able to produce Manzil's
// five chart-owned mansions itself when Manzil first asks (GET /api/me/manzil-pack). Until now
// only the client could cast, from window.ManzilEphem in ephemeris2.js.
//
// One source of truth, not a port: ephemeris2.js is evaluated here as-is inside a vm context
// with a stub `window` (the same trick research/audits/ephemeris-compare.mjs uses), so the
// planets() and idOf() the server casts with are byte-for-byte the ones the game casts with.
// castFive() below mirrors the client's _castFive() line for line (V2 .dc.html, ~line 7993):
// sun, moon, mercury, venus, mars in that order, duplicates dropped; jupiter then saturn fill
// to five; the road fills the rest by walking forward from the last mansion. The client's own
// 36 engine self-checks cover the ephemeris; test/manzil-cast.test.js pins the cast rule.
//
// The birth instant: the stored wall-clock time is resolved through tz.js's dstInfo() when the
// row carries a birthplace tz (exactly what the client's _restoreChart() does). A row with no
// tz is read as UTC wall-clock, the client in the same case uses whatever zone the restoring
// device sits in, which the server does not have; UTC is the one honest fixed choice. A row
// with no known time is read at noon, the convention astro.js's callers already use for
// unknown birth times. The Moon moves about half a degree an hour against a 12.86° station,
// so a few hours of zone error only matters within a sliver of a boundary.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

let _ephem = null;
function ephem() {
  if (!_ephem) {
    const ctx = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'ephemeris2.js'), 'utf8'), ctx, { filename: 'ephemeris2.js' });
    _ephem = ctx.window.ManzilEphem;
    if (!_ephem || typeof _ephem.planets !== 'function' || typeof _ephem.idOf !== 'function') {
      throw new Error('ephemeris2.js did not expose window.ManzilEphem.planets/idOf');
    }
  }
  return _ephem;
}

let _tzPromise = null;
function tzModule() {
  if (!_tzPromise) _tzPromise = import(path.join(ROOT, 'tz.js'));
  return _tzPromise;
}

/** The client's _castFive(), verbatim in shape: { rows, five, fill }. `dt` is a Date (the
 * birth instant, already corrected to the birthplace's zone). */
function castFive(dt) {
  const P = ephem();
  const p = P.planets(dt);
  const rows = ['sun', 'moon', 'mercury', 'venus', 'mars'].map(n => ({ p: n, m: P.idOf(p[n]) }));
  const five = [];
  rows.forEach(r => { if (!five.includes(r.m)) five.push(r.m); });
  const fill = [];
  ['jupiter', 'saturn'].forEach(n => {
    const id = P.idOf(p[n]);
    if (five.length < 5 && !five.includes(id)) { five.push(id); fill.push({ p: n, m: id }); }
  });
  let step = 1;
  while (five.length < 5) {
    const id = ((five[five.length - 1] + step - 1) % 28) + 1;
    if (!five.includes(id)) { five.push(id); fill.push({ p: 'the road', m: id }); }
    step++;
  }
  return { rows, five, fill };
}

/** Resolves a birth_data row ({ birthDate 'YYYY-MM-DD', birthTime 'HH:MM'|null,
 * birthTimeKnown, tz }) to the UTC instant the ephemeris should read. */
async function birthInstant(birth) {
  const [y, m, d] = String(birth.birthDate).slice(0, 10).split('-').map(Number);
  let hh = 12, mm = 0;
  if (birth.birthTimeKnown !== false && typeof birth.birthTime === 'string' && /^\d{2}:\d{2}/.test(birth.birthTime)) {
    [hh, mm] = birth.birthTime.split(':').slice(0, 2).map(Number);
  }
  let off = 0;
  if (birth.tz) {
    try {
      const { dstInfo } = await tzModule();
      off = dstInfo(birth.tz, y, m, d, hh, mm).off;
    } catch (e) { off = 0; }
  }
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - off * 3600000);
}

/** From a birth_data row to Manzil's inputs: { five, pack, rows, fill }. `pack` equals `five`,
 * which is what the live client sends at its own signup since the 22 Sep build ("the cast no
 * longer builds a pack: the collection is all twenty-eight from here on"). */
async function packFromBirth(birth) {
  const dt = await birthInstant(birth);
  if (isNaN(dt.getTime())) return null;
  const cast = castFive(dt);
  return { five: cast.five, pack: cast.five.slice(), rows: cast.rows, fill: cast.fill };
}

module.exports = { castFive, birthInstant, packFromBirth };
