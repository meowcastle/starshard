// manzil-lobby.test.js, MZ6: a report reaches manzil_reports, and the graceful restart.
// Two accounts, two sockets, one match on the SQLite shim (helpers/). The gate line:
// "a report reaches manzil_reports".
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { io } = require('socket.io-client');
const { boot, client } = require('./helpers/boot');

let srv;
test.before(async () => { srv = await boot(); });
test.after(async () => { await srv.close(); });

let n = 0;
const ADULT = '1990-06-15';
async function account() {
  n++;
  const c = client(srv.base);
  const u = { email: `hand${n}@example.test`, username: `hand${n}`, password: 'correct horse battery' };
  const r = await c.post('/api/auth/signup', { ...u, birthDate: ADULT, birthTime: '14:30', birthTimeKnown: true, tz: 'America/New_York' });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const [[row]] = await srv.pool.execute('SELECT id FROM users WHERE email = ?', [u.email]);
  return { ...u, id: row.id, cookie: `starshard_session=${c.jar.get('starshard_session')}` };
}
function connect(acct) {
  return io(srv.base, { path: '/socket.io', transports: ['websocket'], extraHeaders: { cookie: acct.cookie }, reconnection: false, forceNew: true });
}
const once = (sock, ev, ms = 8000) => new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error(`no "${ev}" within ${ms} ms`)), ms);
  sock.once(ev, msg => { clearTimeout(t); resolve(msg); });
});
const never = (sock, ev, ms) => new Promise((resolve, reject) => {
  const t = setTimeout(() => { sock.off(ev, bad); resolve(); }, ms);
  const bad = msg => { clearTimeout(t); reject(new Error(`"${ev}" arrived: ${JSON.stringify(msg)}`)); };
  sock.once(ev, bad);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const plain = rows => rows.map(r => ({ ...r }));
const reports = () => srv.pool.execute('SELECT match_id, reporter_user_id, reported_user_id FROM manzil_reports ORDER BY id').then(([r]) => plain(r));
const blocks = () => srv.pool.execute('SELECT blocker_user_id, blocked_user_id FROM manzil_blocks ORDER BY blocker_user_id').then(([r]) => plain(r));

let A, B, sa, sb, matchId;

test('two signed-in hands queue and are dealt to each other', async () => {
  A = await account(); B = await account();
  sa = connect(A); sb = connect(B);
  await Promise.all([once(sa, 'connect'), once(sb, 'connect')]);
  const matchedA = once(sa, 'matched'), matchedB = once(sb, 'matched');
  sa.emit('queue_join', { pack: [1, 2, 3, 4, 5, 6, 7] });
  sb.emit('queue_join', { pack: [8, 9, 10, 11, 12, 13, 14] });
  const [ma, mb] = await Promise.all([matchedA, matchedB]);
  assert.equal(ma.matchId, mb.matchId);
  assert.equal(ma.opponent, B.username);
  assert.equal(mb.opponent, A.username);
  matchId = ma.matchId;
  assert.equal(srv.lobby.stats().matches, 1);
});

test('a report from a live match reaches manzil_reports and blocks the pair; a second tap writes nothing', async () => {
  const ack = once(sa, 'reported');
  sa.emit('report_player', { matchId });
  const r = await ack;
  assert.equal(r.matchId, matchId);
  assert.ok(!r.again);
  assert.deepEqual(await reports(), [{ match_id: matchId, reporter_user_id: A.id, reported_user_id: B.id }]);
  assert.deepEqual(await blocks(), [{ blocker_user_id: A.id, blocked_user_id: B.id }]);
  const again = once(sa, 'reported');
  sa.emit('report_player', { matchId });
  assert.equal((await again).again, true);
  assert.equal((await reports()).length, 1, 'one row per reporter per match');
});

test('a report with no such match answers report_failed, and a stranger to the match cannot report it', async () => {
  const bad = once(sa, 'report_failed');
  sa.emit('report_player', { matchId: 'm_nothing' });
  assert.equal((await bad).reason, 'no_such_match');
  const C = await account();
  const sc = connect(C);
  await once(sc, 'connect');
  const refused = once(sc, 'report_failed');
  sc.emit('report_player', { matchId });
  assert.equal((await refused).reason, 'no_such_match');
  sc.disconnect();
  assert.equal((await reports()).length, 1);
});

test('after the table closes the other hand can still report, inside the window', async () => {
  const gone = once(sa, 'match_abandoned');
  sb.emit('leave_match', { matchId });
  await gone;
  assert.equal(srv.lobby.stats().matches, 0);
  assert.equal(srv.lobby.stats().ended, 1);
  const ack = once(sb, 'reported');
  sb.emit('report_player', { matchId });
  assert.equal((await ack).matchId, matchId);
  const rows = await reports();
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], { match_id: matchId, reporter_user_id: B.id, reported_user_id: A.id });
  assert.equal((await blocks()).length, 2);
});

test('the blocked pair is never dealt together again', async () => {
  await sleep(3100); // the queue_join burst limit, one per three seconds per hand
  sa.emit('queue_join', { pack: [1, 2, 3, 4, 5, 6, 7] });
  sb.emit('queue_join', { pack: [8, 9, 10, 11, 12, 13, 14] });
  await Promise.all([never(sa, 'matched', 1500), never(sb, 'matched', 1500)]);
  assert.equal(srv.lobby.stats().queue, 2, 'both wait; neither is dealt to the other');
  assert.equal(srv.lobby.stats().matches, 0);
});

test('a graceful restart tells every socket server_restart, then closes it from the server side', async () => {
  const notices = Promise.all([once(sa, 'server_restart'), once(sb, 'server_restart')]);
  const closes = Promise.all([once(sa, 'disconnect'), once(sb, 'disconnect')]);
  await srv.lobby.shutdown('restart');
  const [na, nb] = await notices;
  assert.equal(na.reason, 'restart'); assert.equal(nb.reason, 'restart');
  const [ra, rb] = await closes;
  assert.equal(ra, 'io server disconnect', 'the server closed it, so the client will not reconnect on its own');
  assert.equal(rb, 'io server disconnect');
  assert.deepEqual(srv.lobby.stats(), { queue: 0, matches: 0, ended: 0, sockets: 0 });
});
