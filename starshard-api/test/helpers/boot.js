// boot.js, starts server.js against the SQLite shim on a random port, for the route tests.
//
// Order matters: the shim is placed in require.cache under the exact filename node resolves
// for 'mysql2/promise' from server.js, BEFORE server.js is required, so server.js's own
// `mysql.createPool(...)` call lands on the shim with no change to server.js. Environment:
// a throwaway JWT_SECRET, no RESEND_API_KEY (mail is a logged no-op), no ADMIN_TOKEN,
// NODE_ENV=test (cookies are not Secure, so the test client can send them over plain http).
'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const { createPool } = require('./sqlite-pool');

const API_DIR = path.join(__dirname, '..', '..');

function boot() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-for-production';
  process.env.NODE_ENV = 'test';
  delete process.env.RESEND_API_KEY;
  delete process.env.ADMIN_TOKEN;
  delete process.env.DB_HOST;
  process.env.PORT = '0';

  const schemaSql = fs.readFileSync(path.join(API_DIR, 'schema.sql'), 'utf8');
  const pool = createPool({ schemaSql });
  const shim = { createPool: () => pool, createConnection: () => Promise.resolve(pool.getConnection()) };

  const mysqlPath = require.resolve('mysql2/promise', { paths: [API_DIR] });
  const m = new Module(mysqlPath, null);
  m.filename = mysqlPath;
  m.loaded = true;
  m.exports = shim;
  require.cache[mysqlPath] = m;

  const server = require(path.join(API_DIR, 'server.js'));
  return new Promise(resolve => {
    server.httpServer.listen(0, '127.0.0.1', () => {
      const { port } = server.httpServer.address();
      resolve({
        base: `http://127.0.0.1:${port}`,
        pool,
        lobby: server.lobby, // MZ6: shutdown() and stats(), for the lobby test and the smoke
        close: () => new Promise(r => server.httpServer.close(() => r())),
      });
    });
  });
}

/** A tiny cookie-keeping client. Each client is its own "device": its own cookie jar and
 * its own X-Forwarded-For address, so express-rate-limit's per-IP counters (8 signups an
 * hour) never bleed between tests. */
let nextIp = 1;
function client(base) {
  const jar = new Map();
  const ip = `10.0.${Math.floor(nextIp / 256)}.${nextIp % 256}`;
  nextIp++;
  async function send(method, p, body, headers = {}) {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const r = await fetch(base + p, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': ip,
        ...(cookie ? { cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const raw of (typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : [])) {
      const [pair, ...attrs] = raw.split(';');
      const [k, v] = pair.split('=');
      const expired = attrs.some(a => /expires=Thu, 01 Jan 1970/i.test(a) || /max-age=0/i.test(a));
      if (expired || v === '') jar.delete(k.trim()); else jar.set(k.trim(), v);
    }
    let json = null;
    const text = await r.text();
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
    return { status: r.status, json, headers: r.headers };
  }
  return {
    get: (p, h) => send('GET', p, undefined, h),
    post: (p, b, h) => send('POST', p, b, h),
    put: (p, b, h) => send('PUT', p, b, h),
    del: (p, b, h) => send('DELETE', p, b, h),
    jar,
  };
}

module.exports = { boot, client };
