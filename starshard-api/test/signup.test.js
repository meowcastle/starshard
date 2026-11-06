// signup.test.js, SS1: signup decoupled from Manzil, against the SQLite shim (helpers/).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, client } = require('./helpers/boot');
const { packFromBirth } = require('../lib/manzil-cast');

let srv;
test.before(async () => { srv = await boot(); });
test.after(async () => { await srv.close(); });

let n = 0;
const fresh = () => { n++; return { email: `t${n}@example.test`, username: `tester${n}`, password: 'correct horse battery' }; };
const ADULT = '1990-06-15';

test('a Star Shard signup: birth data, no five/pack, returns 201 and stores birth_data', async () => {
  const c = client(srv.base);
  const u = fresh();
  const r = await c.post('/api/auth/signup', {
    ...u, birthDate: ADULT, birthTime: '14:30', birthTimeKnown: true,
    placeName: 'New York, NY', lat: 40.7128, lon: -74.006, tz: 'America/New_York',
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  assert.deepEqual(r.json, { email: u.email, username: u.username });
  assert.ok(c.jar.has('starshard_session'), 'session cookie set');

  const me = await c.get('/api/me');
  assert.equal(me.status, 200);
  assert.equal(me.json.username, u.username);

  const b = await c.get('/api/me/birth');
  assert.equal(b.status, 200);
  assert.deepEqual(b.json.birth, {
    birthDate: ADULT, birthTime: '14:30', birthTimeKnown: true,
    placeName: 'New York, NY', lat: 40.7128, lon: -74.006, tz: 'America/New_York',
  });

  const ex = await c.get('/api/me/export');
  assert.equal(ex.status, 200);
  assert.equal(ex.json.manzilPack, null, 'no pack was sent, none stored at signup');
  assert.equal(ex.json.birth.birthDate, ADULT);
});

test('a Star Shard signup with a bare date and a device tz stores no birthplace zone', async () => {
  const c = client(srv.base);
  const u = fresh();
  const r = await c.post('/api/auth/signup', { ...u, birthDate: ADULT, birthTimeKnown: false, tz: 'Europe/Berlin' });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const b = await c.get('/api/me/birth');
  assert.equal(b.json.birth.tz, null, 'tz without lat/lon is the age-gate region, not the birthplace');
  assert.equal(b.json.birth.birthTime, null);
  assert.equal(b.json.birth.birthTimeKnown, false);
});

test('a Star Shard signup may name the birthplace zone explicitly as birthTz', async () => {
  const c = client(srv.base);
  const u = fresh();
  const r = await c.post('/api/auth/signup', { ...u, birthDate: ADULT, birthTime: '09:00', tz: 'America/Los_Angeles', birthTz: 'Asia/Tokyo' });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const b = await c.get('/api/me/birth');
  assert.equal(b.json.birth.tz, 'Asia/Tokyo');
});

test('a Manzil signup with five/pack still works and writes manzil_pack, not birth_data', async () => {
  const c = client(srv.base);
  const u = fresh();
  const five = [3, 9, 14, 21, 27];
  const r = await c.post('/api/auth/signup', { ...u, birthDate: ADULT, five, pack: five, tz: 'America/New_York' });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const p = await c.get('/api/me/manzil-pack');
  assert.deepEqual(p.json, { pack: { five, pack: five } });
  const b = await c.get('/api/me/birth');
  assert.equal(b.json.birth, null, 'Manzil signup never writes birth_data');
  const ex = await c.get('/api/me/export');
  assert.deepEqual(ex.json.manzilPack, { five, pack: five, birthYear: 1990 });
});

test('five/pack present but malformed is still a 400', async () => {
  const c = client(srv.base);
  const u = fresh();
  const r = await c.post('/api/auth/signup', { ...u, birthDate: ADULT, five: [1, 2, 3], pack: [1, 2, 3] });
  assert.equal(r.status, 400);
  assert.equal(r.json.error, 'invalid_input');
  const r2 = await c.post('/api/auth/signup', { ...u, birthDate: ADULT, five: [1, 2, 3, 4, 99], pack: [1, 2, 3, 4, 99] });
  assert.equal(r2.status, 400);
});

test('the age gate still runs on the Star Shard path', async () => {
  const c = client(srv.base);
  const u = fresh();
  const y = new Date().getUTCFullYear() - 10;
  const r = await c.post('/api/auth/signup', { ...u, birthDate: `${y}-01-01`, tz: 'America/New_York' });
  assert.equal(r.status, 403);
  assert.equal(r.json.error, 'too_young');
  const bad = await c.post('/api/auth/signup', { ...u, birthDate: 'yesterday' });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.error, 'invalid_birth_date');
});

test('duplicate email and duplicate username answer 409 with the right code, and nothing half-lands', async () => {
  const c = client(srv.base);
  const u = fresh();
  assert.equal((await c.post('/api/auth/signup', { ...u, birthDate: ADULT })).status, 201);
  const c2 = client(srv.base);
  const dupEmail = await c2.post('/api/auth/signup', { ...u, username: u.username + 'x', birthDate: ADULT });
  assert.equal(dupEmail.status, 409);
  assert.equal(dupEmail.json.error, 'email_taken');
  const dupName = await c2.post('/api/auth/signup', { ...u, email: 'other' + u.email, birthDate: ADULT });
  assert.equal(dupName.status, 409);
  assert.equal(dupName.json.error, 'username_taken');
  const [rows] = await srv.pool.execute('SELECT COUNT(*) AS n FROM users WHERE email = ? OR username = ?', [u.email, u.username]);
  assert.equal(rows[0].n, 1);
});

test('GET /api/me/manzil-pack derives the five from birth_data when no pack was sent, once', async () => {
  const c = client(srv.base);
  const u = fresh();
  const birth = { birthDate: '1988-11-02', birthTime: '23:15', birthTimeKnown: true, placeName: 'Lisbon', lat: 38.7223, lon: -9.1393, tz: 'Europe/Lisbon' };
  assert.equal((await c.post('/api/auth/signup', { ...u, ...birth })).status, 201);

  const expected = await packFromBirth(birth);
  const p1 = await c.get('/api/me/manzil-pack');
  assert.equal(p1.status, 200);
  assert.deepEqual(p1.json, { pack: { five: expected.five, pack: expected.pack } });

  const [rows] = await srv.pool.execute('SELECT five_json, pack_json, birth_year FROM manzil_pack WHERE user_id = (SELECT id FROM users WHERE email = ?)', [u.email]);
  assert.equal(rows.length, 1, 'the derived pack is written once');
  assert.deepEqual(JSON.parse(rows[0].five_json), expected.five);
  assert.equal(rows[0].birth_year, 1988);

  // A later upgrade of the birth row does not recast an existing pack.
  assert.equal((await c.put('/api/me/birth', { ...birth, birthTime: '03:00' })).status, 204);
  const p2 = await c.get('/api/me/manzil-pack');
  assert.deepEqual(p2.json, p1.json);

  const ex = await c.get('/api/me/export');
  assert.deepEqual(ex.json.manzilPack, { five: expected.five, pack: expected.pack, birthYear: 1988 });
});

test('an account with a reading but no pack and no birth row answers { pack: null }', async () => {
  const c = client(srv.base);
  const u = fresh();
  assert.equal((await c.post('/api/auth/signup', { ...u, birthDate: ADULT })).status, 201);
  await srv.pool.execute('DELETE FROM birth_data WHERE user_id = (SELECT id FROM users WHERE email = ?)', [u.email]);
  const p = await c.get('/api/me/manzil-pack');
  assert.deepEqual(p.json, { pack: null });
});

test('login, logout and delete still round-trip; delete cascades birth_data and manzil_pack', async () => {
  const c = client(srv.base);
  const u = fresh();
  assert.equal((await c.post('/api/auth/signup', { ...u, birthDate: ADULT, birthTime: '06:00', lat: 1, lon: 2, tz: 'Asia/Kolkata' })).status, 201);
  assert.equal((await c.get('/api/me/manzil-pack')).status, 200);
  assert.equal((await c.post('/api/auth/logout')).status, 204);
  assert.equal((await c.get('/api/me')).status, 401);
  const login = await c.post('/api/auth/login', { email: u.email, password: u.password });
  assert.equal(login.status, 200);
  assert.equal((await c.get('/api/me')).status, 200);

  const [[{ id }]] = await srv.pool.execute('SELECT id FROM users WHERE email = ?', [u.email]);
  const count = async t => (await srv.pool.execute(`SELECT COUNT(*) AS n FROM ${t} WHERE user_id = ?`, [id]))[0][0].n;
  assert.equal(await count('birth_data'), 1);
  assert.equal(await count('manzil_pack'), 1);
  const del = await c.del('/api/me', { password: u.password });
  assert.equal(del.status, 204, JSON.stringify(del.json));
  assert.equal(await count('birth_data'), 0);
  assert.equal(await count('manzil_pack'), 0);
  assert.equal((await c.get('/api/me')).status, 401);
});
