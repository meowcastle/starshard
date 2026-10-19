// api.js in app mode (window.STARSHARD_APP set by app-bridge.js): it names the
// API outright, sends the bearer token and the app client header, keeps the token
// the server hands back without ever returning it to a caller, and forgets it on
// logout, deletion or a 401. Web mode is covered by every other test leaving
// window unset.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};
globalThis.window = { STARSHARD_APP: { apiBase: 'https://api.example.test' } };

const calls = [];
let next = { status: 200, body: {} };
globalThis.fetch = async (url, init) => {
  calls.push({ url, init });
  const { status, body } = next;
  return { status, ok: status >= 200 && status < 300, json: async () => body };
};

const api = await import('../api.js?app-mode');

test('the API base comes from the app config, not location', () => {
  assert.equal(api.API_BASE, 'https://api.example.test');
});

test('login stores the token, strips it from the result, and later calls send it', async () => {
  next = { status: 200, body: { email: 'a@b.c', username: 'rin', token: 'jwt-123' } };
  const me = await api.loginWithUsername('rin', 'pw');
  assert.deepEqual(me, { email: 'a@b.c', username: 'rin' });
  assert.equal(api.appSessionToken(), 'jwt-123');
  assert.equal(calls.at(-1).init.headers['X-Starshard-Client'], 'app');

  next = { status: 200, body: { email: 'a@b.c', username: 'rin' } };
  await api.me();
  const h = calls.at(-1).init.headers;
  assert.equal(calls.at(-1).url, 'https://api.example.test/api/me');
  assert.equal(h.Authorization, 'Bearer jwt-123');
});

test('a 401 forgets the token', async () => {
  store.set('starshard-app-session', 'stale');
  next = { status: 401, body: { error: 'not_authenticated' } };
  assert.equal(await api.me(), null);
  assert.equal(api.appSessionToken(), null);
});

test('logout and account deletion forget the token', async () => {
  store.set('starshard-app-session', 'live');
  next = { status: 204, body: null };
  await api.logout();
  assert.equal(api.appSessionToken(), null);

  store.set('starshard-app-session', 'live');
  next = { status: 204, body: null };
  await api.deleteAccount('pw');
  assert.equal(api.appSessionToken(), null);
});
