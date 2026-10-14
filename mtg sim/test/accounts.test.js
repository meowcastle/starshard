// accounts.js: sign-up, sign-in, sessions, reserved names, and the credits ledger
const test = require('node:test');
const assert = require('node:assert');
const accounts = require('../accounts');

const fresh = () => accounts.open(':memory:', { runsPerDay: 3, asksPerDay: 10 });

test('sign up, sign in, wrong password, taken name', () => {
  const A = fresh();
  const a = A.signUp('Theo', 'correct horse');
  assert.strictEqual(a.plan, 'free');
  assert.strictEqual(a.source, 'sim');
  assert.notStrictEqual(a.pass_hash, 'correct horse');
  assert.strictEqual(A.signIn('theo', 'correct horse').id, a.id);   // names are case-insensitive
  assert.strictEqual(A.signIn('Theo', 'wrong password'), null);
  assert.strictEqual(A.signIn('nobody', 'whatever1'), null);
  assert.throws(() => A.signUp('THEO', 'another pass'), /taken/);
  assert.throws(() => A.signUp('x', 'long enough'), /3 to 24/);
  assert.throws(() => A.signUp('ok_name', 'short'), /8 characters/);
});

test('a reserved name cannot be signed up, and a Star Shard login takes it over', () => {
  const A = fresh();
  A.reserveName('bluenocturne');
  assert.throws(() => A.signUp('BlueNocturne', 'a good password'), /taken/);
  assert.strictEqual(A.signIn('bluenocturne', 'anything123'), null);       // no password here: Star Shard signs it in
  const f = A.accountFor({ id: 42, name: 'bluenocturne' });
  assert.strictEqual(f.starshard_id, 42);
  assert.strictEqual(f.plan, 'founder');
  assert.strictEqual(A.accountFor({ id: 42, name: 'bluenocturne' }).id, f.id);
});

test('a Star Shard login never takes a sim account', () => {
  const A = fresh();
  A.signUp('sam', 'a good password');
  assert.throws(() => A.accountFor({ id: 7, name: 'sam' }), /simulator account/);
});

test('sessions: start, read, end, expire', () => {
  const A = fresh();
  const a = A.signUp('dana', 'a good password');
  const t = A.startSession(a.id);
  assert.deepStrictEqual({ ...A.session(t), lastSeen: 0 }, { accountId: a.id, name: 'dana', source: 'sim', plan: 'free', lastSeen: 0 });
  assert.strictEqual(A.session('not-a-token'), null);
  A.endSession(t);
  assert.strictEqual(A.session(t), null);
  // the stored key is the hash, never the token
  assert.strictEqual(A.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE token_hash = ?').get(t).n, 0);
});

test('the founders\' plan records cost without charging; a reserve and settle are each once', () => {
  const A = fresh();
  const f = A.accountFor({ id: 1, name: 'justin' });
  assert.deepStrictEqual(A.reserve(f.id, { ref: 'run1', credits: 110 }), { ok: true, charged: 0 });
  A.reserve(f.id, { ref: 'run1', credits: 110 });                  // a retried call adds nothing
  A.settle('run1', 70); A.settle('run1', 70);
  assert.strictEqual(A.balance(f.id), 0);
  const rows = A.statement(f.id);
  assert.deepStrictEqual(rows.map(r => [r.kind, r.credits, r.cost]), [['adjust', 0, -40], ['run', 0, 110]]);
});

test('a charging plan: refuses when short, reserves, refunds the unused part, never charges past the quote', () => {
  const A = fresh();
  const a = A.signUp('payer', 'a good password');
  A.setPlan(a.id, 'member');
  assert.deepStrictEqual(A.reserve(a.id, { ref: 'r1', credits: 110 }), { ok: false, need: 110, have: 0 });
  A.post(a.id, 'purchase', 200, { ref: 'cs_test_1', note: '200 credits' });
  A.post(a.id, 'purchase', 200, { ref: 'cs_test_1' });            // the same Stripe object twice: once
  assert.strictEqual(A.balance(a.id), 200);
  assert.deepStrictEqual(A.reserve(a.id, { ref: 'r1', credits: 110 }), { ok: true, charged: 110 });
  assert.strictEqual(A.balance(a.id), 90);
  A.settle('r1', 80);
  assert.strictEqual(A.balance(a.id), 120);
  A.reserve(a.id, { ref: 'r2', credits: 50 }); A.settle('r2', 500); // ran long: still 50
  assert.strictEqual(A.balance(a.id), 70);
  assert.strictEqual(A.statement(a.id)[0].balance, 70);
});

test('open runs are the reserves without a settle', () => {
  const A = fresh();
  const f = A.accountFor({ id: 1, name: 'justin' });
  A.reserve(f.id, { ref: 'a', credits: 10 }); A.reserve(f.id, { kind: 'weekly', ref: 'b', credits: 10 });
  A.settle('a', 5);
  assert.deepStrictEqual(A.openRuns().map(r => r.ref), ['b']);
});

test('the plans', () => {
  const A = fresh();
  assert.strictEqual(A.planOf('founder').features.runsPerDay, 3);
  assert.deepStrictEqual(A.planOf('free').features, { brews: 1, fields: ['meta10'], runsPerDay: 1, asksPerDay: 2, weekly: false, sharing: false });
  assert.strictEqual(A.planOf('free').charges, false);
});
