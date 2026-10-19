// The iOS/Android apps (app/) authenticate with a bearer token instead of the
// session cookie: a native webview's cookies are third-party to the API, and
// iOS drops them. These tests boot the real server.js (no database is needed
// for any path exercised here) and check the three seams the apps depend on:
// CORS from the app origins, the Authorization header on REST, and the token in
// the socket handshake for Manzil's PvP lobby.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apiDir = path.join(root, 'starshard-api');
const jwt = require(path.join(apiDir, 'node_modules', 'jsonwebtoken'));
const { io } = require('socket.io-client');

const SECRET = 'test-secret-app-auth';
const PORT = 41000 + Math.floor(Math.random() * 2000);
const BASE = `http://127.0.0.1:${PORT}`;
let proc;

before(async () => {
  proc = spawn(process.execPath, ['server.js'], {
    cwd: apiDir,
    env: { ...process.env, PORT: String(PORT), JWT_SECRET: SECRET, NODE_ENV: 'test',
      DB_HOST: '127.0.0.1', DB_PORT: '1', DB_USER: 'x', DB_PASSWORD: 'x', DB_NAME: 'x' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 8000);
    proc.stdout.on('data', d => { if (String(d).includes('listening')) { clearTimeout(t); resolve(); } });
    proc.on('exit', c => reject(new Error('server exited ' + c)));
  });
});

after(() => { if (proc) proc.kill(); });

for (const origin of ['https://app.starshard.net', 'capacitor://app.starshard.net']) {
  test(`preflight from the app origin ${origin} is allowed, with Authorization`, async () => {
    const r = await fetch(`${BASE}/api/me`, { method: 'OPTIONS', headers: { Origin: origin } });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get('access-control-allow-origin'), origin);
    assert.match(r.headers.get('access-control-allow-headers'), /Authorization/);
    assert.match(r.headers.get('access-control-allow-headers'), /X-Starshard-Client/);
  });
}

test('a random origin still gets no CORS grant', async () => {
  const r = await fetch(`${BASE}/api/me`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } });
  assert.equal(r.headers.get('access-control-allow-origin'), null);
});

test('a bad bearer token is rejected like a bad cookie', async () => {
  const r = await fetch(`${BASE}/api/me`, { headers: { Authorization: 'Bearer not-a-jwt' } });
  assert.equal(r.status, 401);
});

function connect(opts) {
  return new Promise(resolve => {
    const s = io(BASE, { path: '/socket.io', transports: ['websocket'], reconnection: false, ...opts });
    let verdict = null;
    s.on('auth_required', () => { verdict = 'rejected'; });
    s.on('disconnect', () => { verdict = verdict || 'rejected'; s.close(); resolve(verdict); });
    s.on('connect', () => setTimeout(() => { if (!verdict) { verdict = 'accepted'; s.close(); resolve(verdict); } }, 400));
    s.on('connect_error', () => resolve('error'));
  });
}

test('PvP socket accepts a valid token in the handshake', async () => {
  const token = jwt.sign({ uid: 42, tv: 0, username: 'tester' }, SECRET, { expiresIn: '1h' });
  assert.equal(await connect({ auth: { token } }), 'accepted');
});

test('PvP socket still rejects a connection with no session at all', async () => {
  assert.equal(await connect({}), 'rejected');
});

test('PvP socket rejects a token signed with the wrong secret', async () => {
  const token = jwt.sign({ uid: 42, tv: 0 }, 'wrong', { expiresIn: '1h' });
  assert.equal(await connect({ auth: { token } }), 'rejected');
});
