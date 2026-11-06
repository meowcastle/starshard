// email-capture.test.js, MZ3: one field after the first night, against the SQLite shim (helpers/).
// The gate: route test; export includes it; delete removes it.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { boot, client } = require('./helpers/boot');

let srv;
test.before(async () => { srv = await boot(); });
test.after(async () => { await srv.close(); });

let n = 0;
const fresh = () => { n++; return { email: `acct${n}@example.test`, username: `leaver${n}`, password: 'correct horse battery' }; };
const device = () => crypto.randomBytes(16).toString('hex');
const ADULT = '1990-06-15';
const rows = async (where, args) => (await srv.pool.execute(`SELECT email, device_hash, user_id, source, tz FROM email_capture WHERE ${where}`, args))[0];

test('a visitor with no account leaves an email after the first night: 201, the row, nothing else kept', async () => {
  const c = client(srv.base);
  const d = device();
  const r = await c.post('/api/email', { email: ' Left1@Example.test ', device: d, birthDate: ADULT, tz: 'America/New_York', source: 'shard' });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  assert.deepEqual(r.json, { email: 'left1@example.test' });
  const got = await rows('email = ?', ['left1@example.test']);
  assert.equal(got.length, 1);
  assert.equal(got[0].device_hash, crypto.createHash('sha256').update(d).digest('hex'), 'the device id is stored hashed');
  assert.equal(got[0].user_id, null);
  assert.equal(got[0].source, 'shard');
  assert.equal(got[0].tz, 'America/New_York');
  const cols = (await srv.pool.execute('SELECT * FROM email_capture WHERE email = ?', ['left1@example.test']))[0][0];
  assert.deepEqual(Object.keys(cols).sort(), ['created_at', 'device_hash', 'email', 'id', 'source', 'tz', 'user_id'], 'no birth date, no name, nothing else');
  assert.ok(!c.jar.has('starshard_session'), 'no session is made');
});

test('the same address again answers 200 and changes nothing; an unknown source is kept as shard', async () => {
  const c = client(srv.base);
  const d = device();
  assert.equal((await c.post('/api/email', { email: 'twice@example.test', device: d, birthDate: ADULT, source: 'play' })).status, 201);
  const again = await c.post('/api/email', { email: 'TWICE@example.test', device: device(), birthDate: ADULT, source: 'nowhere' });
  assert.equal(again.status, 200);
  const got = await rows('email = ?', ['twice@example.test']);
  assert.equal(got.length, 1);
  assert.equal(got[0].source, 'play', 'the first row stands');
  assert.equal((await c.post('/api/email', { email: 'odd@example.test', device: device(), birthDate: ADULT, source: 'nowhere' })).status, 201);
  assert.equal((await rows('email = ?', ['odd@example.test']))[0].source, 'shard');
});

test('refusals: a bad address, a bad device id, no date, a child', async () => {
  const c = client(srv.base);
  assert.equal((await c.post('/api/email', { email: 'not-an-address', device: device(), birthDate: ADULT })).json.error, 'invalid_input');
  assert.equal((await c.post('/api/email', { email: 'a@b.co', device: 'short', birthDate: ADULT })).json.error, 'invalid_input');
  assert.equal((await c.post('/api/email', { email: 'a@b.co', device: 'ZZZZZZZZZZZZZZZZZZZZ', birthDate: ADULT })).json.error, 'invalid_input');
  assert.equal((await c.post('/api/email', { email: 'a@b.co', device: device() })).json.error, 'invalid_birth_date');
  const child = await c.post('/api/email', { email: 'child@example.test', device: device(), birthDate: `${new Date().getUTCFullYear() - 10}-01-01`, tz: 'America/New_York' });
  assert.equal(child.status, 403);
  assert.equal(child.json.error, 'too_young');
  assert.equal((await rows('email = ?', ['child@example.test'])).length, 0, 'nothing stored for a child');
  assert.equal((await rows('email = ?', ['a@b.co'])).length, 0);
});

test('the same device takes its address back; another device cannot', async () => {
  const c = client(srv.base);
  const d = device();
  assert.equal((await c.post('/api/email', { email: 'back@example.test', device: d, birthDate: ADULT })).status, 201);
  assert.equal((await client(srv.base).del('/api/email', { device: device() })).status, 204, 'a stranger device answers 204 and removes nothing');
  assert.equal((await rows('email = ?', ['back@example.test'])).length, 1);
  assert.equal((await c.del('/api/email', { device: 'nope' })).status, 400);
  assert.equal((await c.del('/api/email', { device: d })).status, 204);
  assert.equal((await rows('email = ?', ['back@example.test'])).length, 0);
});

test('signup with the same email links the row; export includes it; delete removes it', async () => {
  const c = client(srv.base);
  const u = fresh();
  const d = device();
  assert.equal((await c.post('/api/email', { email: u.email, device: d, birthDate: ADULT, tz: 'Europe/Lisbon', source: 'shard' })).status, 201);
  assert.equal((await c.post('/api/auth/signup', { ...u, birthDate: ADULT })).status, 201);
  const [[{ id }]] = await srv.pool.execute('SELECT id FROM users WHERE email = ?', [u.email]);
  const linked = await rows('email = ?', [u.email]);
  assert.equal(linked.length, 1);
  assert.equal(linked[0].user_id, id, 'linked in the signup transaction');

  assert.equal((await c.del('/api/email', { device: d })).status, 204);
  assert.equal((await rows('email = ?', [u.email])).length, 1, 'once the account owns the row, the device alone cannot remove it');

  const ex = await c.get('/api/me/export');
  assert.equal(ex.status, 200);
  assert.equal(ex.json.emailLeft.email, u.email);
  assert.equal(ex.json.emailLeft.source, 'shard');
  assert.equal(ex.json.emailLeft.tz, 'Europe/Lisbon');
  assert.ok(ex.json.emailLeft.leftAt, 'the export says when it was left');

  const del = await c.del('/api/me', { password: u.password });
  assert.equal(del.status, 204, JSON.stringify(del.json));
  assert.equal((await rows('email = ?', [u.email])).length, 0, 'the row went with the account');
  assert.equal((await rows('user_id = ?', [id])).length, 0);
});

test('an email left from another device after the account exists is linked at once, exported, and deleted with the account', async () => {
  const c = client(srv.base);
  const u = fresh();
  assert.equal((await c.post('/api/auth/signup', { ...u, birthDate: ADULT })).status, 201);
  const other = client(srv.base);
  assert.equal((await other.post('/api/email', { email: u.email.toUpperCase(), device: device(), birthDate: ADULT, source: 'play' })).status, 201);
  const [[{ id }]] = await srv.pool.execute('SELECT id FROM users WHERE email = ?', [u.email]);
  assert.equal((await rows('email = ?', [u.email]))[0].user_id, id, 'an address that already has an account is the account\'s row from the start');
  const ex = await c.get('/api/me/export');
  assert.equal(ex.json.emailLeft.source, 'play');
  assert.equal((await c.del('/api/me', { password: u.password })).status, 204);
  assert.equal((await rows('email = ?', [u.email])).length, 0);
});

test('an account with nothing left exports emailLeft: null, and an unlinked row with its address still goes at delete', async () => {
  const c = client(srv.base);
  const u = fresh();
  assert.equal((await c.post('/api/auth/signup', { ...u, birthDate: ADULT })).status, 201);
  assert.equal((await c.get('/api/me/export')).json.emailLeft, null);
  // a row planted unlinked with the account's address (the pre-link state a live DB could hold)
  await srv.pool.execute('INSERT INTO email_capture (email, device_hash, user_id, source, tz) VALUES (?, ?, NULL, ?, NULL)', [u.email, 'f'.repeat(64), 'shard']);
  assert.equal((await c.get('/api/me/export')).json.emailLeft.email, u.email, 'export finds it by address');
  assert.equal((await c.del('/api/me', { password: u.password })).status, 204);
  assert.equal((await rows('email = ?', [u.email])).length, 0, 'delete removes it by address');
});
