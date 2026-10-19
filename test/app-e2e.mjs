#!/usr/bin/env node
// End to end on the APP bundle, against a real API and database. OWNER: Claude Code.
//
//   node test/app-e2e.mjs --api http://127.0.0.1:4555 [--out ./shots] [--port 4556]
//
// Builds the iOS/Android web bundle exactly as the store builds do (only the
// API base differs), serves it, and walks a new player through it in a phone-
// sized, touch-enabled browser: first launch, sign up, the lobby, a live PvP
// socket, a full board, then the account page's export and deletion. The API
// must allow this page's origin (ALLOWED_ORIGINS=http://localhost:<port>).
//
// What it proves that nothing else does: the app path end to end — app-bridge
// -> api.js bearer token -> server.js -> the socket handshake -> the account
// page — and that a phone never loads a byte from anywhere but the bundle and
// the API. Screenshots double as the store's 6.9" iPhone set (2868x1320).
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const API = arg('--api', 'http://127.0.0.1:4555');
const PORT = Number(arg('--port', '4556'));
const SHOTS = path.resolve(arg('--out', fs.mkdtempSync(path.join(os.tmpdir(), 'manzil-shots-'))));
fs.mkdirSync(SHOTS, { recursive: true });

const WWW = fs.mkdtempSync(path.join(os.tmpdir(), 'manzil-e2e-www-'));
execFileSync(process.execPath, [path.join(ROOT, 'tools/build-app.mjs'), '--out', WWW], {
  env: { ...process.env, STARSHARD_API_BASE: API }, stdio: 'inherit',
});

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(WWW, p);
  if (!f.startsWith(WWW) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://localhost:${PORT}`;

const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass }); console.log(`  ${pass ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({
  viewport: { width: 956, height: 440 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
});
const page = await ctx.newPage();
const errors = [], offHost = [], authHeaders = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => {
  const u = new URL(r.url());
  const apiHost = new URL(API).host;
  if (u.host !== `localhost:${PORT}` && u.host !== apiHost && u.protocol !== 'data:' && u.protocol !== 'blob:') offHost.push(r.url());
  if (u.host === apiHost && r.headers().authorization) authHeaders.push(u.pathname);
});

const shot = async name => page.screenshot({ path: path.join(SHOTS, name + '.png') });
const mustaches = async () => {
  const html = (await page.content()).replace(/<script[^>]*text\/x-dc[\s\S]*?<\/script>/g, '');
  return (html.match(/\{\{\s*[A-Za-z_$][\w$.]*\s*\}\}/g) || []).filter(m => !/\bfalse\b|\btrue\b/.test(m));
};

console.log('\napp bundle, end to end');

// 1. first launch, signed out
const t0 = Date.now();
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
// the runtime replaces <x-dc> with the rendered app; `window.manzil` is the mounted component
await page.waitForFunction(() => window.manzil && document.body.innerText.trim().length > 20, null, { timeout: 30000 }).catch(() => {});
ok('first launch renders', (await page.evaluate(() => document.body.innerText.trim().length)) > 20, `${Date.now() - t0}ms to first text`);
await sleep(1500);
await shot('01-first-launch');
ok('the bridge named the API', (await page.evaluate(() => window.STARSHARD_APP && window.STARSHARD_APP.apiBase)) === API);
ok('no unresolved bindings at launch', (await mustaches()).length === 0);

// 2. sign up as the app would, then relaunch signed in
const user = 'e2e' + Date.now().toString(36).slice(-6);
const signup = await page.evaluate(async ({ user }) => {
  const api = await import('./api.js');
  try {
    const r = await api.signup(user + '@example.com', 'password123', { username: user, birthDate: '1992-03-14', five: [3, 9, 14, 18, 27], pack: [3, 9, 14, 18, 27, 1, 2] });
    return { r, stored: !!localStorage.getItem('starshard-app-session') };
  } catch (e) { return { err: e.code || e.message }; }
}, { user });
ok('signup through api.js keeps the token on the device', !!(signup.stored && signup.r && !signup.r.token), JSON.stringify(signup).slice(0, 120));

await page.reload({ waitUntil: 'domcontentloaded' });
await sleep(4500);
const signedIn = await page.evaluate(async () => { const api = await import('./api.js'); return api.me(); });
ok('relaunch is signed in (bearer token, no cookie)', !!(signedIn && signedIn.username === user));
ok('API calls carry the bearer header', authHeaders.length > 0, authHeaders.slice(0, 4).join(', '));
await shot('02-signed-in');

// 3. the PvP socket accepts the app's token
const sock = await page.evaluate(async (apiBase) => {
  if (!window.io) await import('./socket-io-client.js');
  return await new Promise(resolve => {
    const s = window.io(apiBase, { path: '/socket.io', transports: ['websocket'], reconnection: false });
    let bad = false;
    s.on('auth_required', () => { bad = true; });
    s.on('connect_error', e => resolve('error: ' + e.message));
    s.on('connect', () => setTimeout(() => { const v = bad || s.disconnected ? 'rejected' : 'accepted'; s.close(); resolve(v); }, 800));
  });
}, API);
ok('PvP socket accepts the app session', sock === 'accepted', sock);

// 4. play a whole board through the dev handle, as test/fuzz-manzil.mjs does
const board = await page.evaluate(async () => {
  const m = window.manzil, sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!m) return { skipped: 'no dev handle' };
  const five = Array.from({ length: 28 }, (_, i) => i + 1);
  m.setState({ ...m._deckState(), ...m._freshRoadStep(0, five), road: true, practice: false, duel: false, phase: 'play', dealt: true });
  await sleep(1200);
  let placed = 0, guard = 0;
  while ((m.state.slots || []).some(x => !x) && guard++ < 40) {
    const side = m.state.turn, hand = side === 'you' ? m.state.hand : m.state.sky;
    if (!hand || !hand.length) break;
    m._commitPlace(hand[0], m.state.slots.findIndex(x => !x), false, side);
    placed++;
    if (placed === 4) { window.__mid = true; await sleep(1600); window.__mid = false; } else await sleep(160);
  }
  let settled = null;
  for (let k = 0; k < 40 && !settled; k++) { await sleep(400); if (m.state.phase !== 'play') settled = m.state.phase; }
  return { placed, settled };
});
ok('a full board plays and settles in the app bundle', !!board.settled, JSON.stringify(board));
await shot('03-board-settled');
ok('no page errors through play', errors.length === 0, errors[0] || '');

// 5. the account page: export, then delete
await page.goto(BASE + '/account-data/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#who:not(:empty)', { timeout: 10000 }).catch(() => {});
ok('account page sees the signed-in player', (await page.textContent('#who')).includes(user));
await page.click('#ex');
await page.waitForSelector('#dump:not(.hide)', { timeout: 10000 }).catch(() => {});
const dump = await page.inputValue('#dump').catch(() => '');
ok('export returns the account data', dump.includes(user));
await shot('04-account');
await page.fill('#dp', 'password123');
await page.click('#del');
await page.waitForSelector('#done:not(.hide)', { timeout: 10000 }).catch(() => {});
ok('in-app deletion completes', await page.isVisible('#done'));
const gone = await page.evaluate(async () => { const api = await import('../api.js'); return api.me(); });
ok('the deleted account is signed out everywhere', gone === null);

ok('nothing loaded from outside the bundle and the API', offHost.length === 0, offHost.slice(0, 3).join(', '));

await browser.close();
server.close();
fs.rmSync(WWW, { recursive: true, force: true });
const failed = results.filter(r => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed · screenshots in ${SHOTS}`);
process.exit(failed ? 1 : 0);
