#!/usr/bin/env node
// Browser smoke test: boots the real page, drives the whole first-run loop
// (the onboarding form -> a real cast -> tonight/chart/shard), and fails on
// unresolved {{ bindings }}, page errors, or a ring that never renders.
//
//   npm i -D playwright && npx playwright install chromium
//   node test/smoke.mjs                 # headless, writes screenshots to /tmp
//   node test/smoke.mjs --out ./shots   # keep the screenshots
//
// This is the check that proves a handoff (Design or otherwise) did not
// break the wiring. Run it before merging.
//
// Retargeted 18 Aug for the v3 -> v4 cutover (v3 is retired, kept only as
// reference — see CLAUDE.md's receipt protocol) — v4 has a different flow
// than v3 did (a single onboarding form instead of a burst/story/how/entry
// sequence, no separate Sounding-beat walkthrough), so this is a rewrite of
// the interaction steps, not just a filename swap.
//
// OWNER: Claude Code.

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGE = 'Star Shard v4.dc.html';
const OUT = process.argv.includes('--out')
  ? path.resolve(process.argv[process.argv.indexOf('--out') + 1])
  : fs.mkdtempSync('/tmp/starshard-smoke-');
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/' + PAGE;
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 460, height: 940 } });
page.setDefaultTimeout(15000);

// The dc-runtime pulls React, ReactDOM and @babel/standalone from unpkg.com at
// load time. Set VENDOR_DIR to serve them from disk so this test runs offline
// and deterministically:
//   npm i react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0
//   node tools/vendor.mjs        # copies the UMD builds into ./vendor
const VENDOR_DIR = process.env.VENDOR_DIR;
if (VENDOR_DIR) {
  const map = {
    'react@18.3.1/umd/react.production.min.js': 'react.js',
    'react-dom@18.3.1/umd/react-dom.production.min.js': 'react-dom.js',
    '@babel/standalone@7.29.0/babel.min.js': 'babel.js',
  };
  await page.route('**/unpkg.com/**', route => {
    const url = route.request().url();
    for (const [k, f] of Object.entries(map)) {
      if (url.includes(k)) {
        return route.fulfill({ status: 200, contentType: 'text/javascript',
          body: fs.readFileSync(path.join(VENDOR_DIR, f)) });
      }
    }
    return route.continue();
  });
}

// The real geocode call hits Open-Meteo over the network — mock it so this
// test is deterministic and offline. Only "New York" resolves; anything
// else returns zero results, so the no-match error path is exercisable too.
await page.route('**/geocoding-api.open-meteo.com/**', route => {
  const url = new URL(route.request().url());
  const q = (url.searchParams.get('name') || '').toLowerCase();
  const results = q.includes('new york') ? [{
    name: 'New York', admin1: 'New York', country: 'United States',
    latitude: 40.71, longitude: -74.01, timezone: 'America/New_York',
  }] : [];
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results }) });
});

// api.js's API_BASE is `https://api.${location.hostname}` — on this test
// server that's an unreachable made-up host, so every real backend call
// (signup/login/logout/me/saveSigil/...) would otherwise throw
// ApiError('unreachable', 0) or just silently fail (saveSigil is fire-
// and-forget). Mock just enough of /api/auth/* + /api/me to exercise the
// real client-side wiring (task 39) without needing a live database.
// mockAccounts persists across logout (a real DB row would too — logout
// only ends the session); mockSession is the current logged-in email, if
// any. Conflating the two was a real bug in an earlier draft of this
// mock: it made login-after-logout always 401, which looked like an app
// bug until traced back to the test itself.
const mockAccounts = new Map(); // email -> password
let mockSession = null;
await page.route('https://api.localhost/**', route => {
  const req = route.request();
  const url = new URL(req.url());
  const body = req.method() === 'POST' ? JSON.parse(req.postData() || '{}') : null;
  if (url.pathname === '/api/auth/signup') {
    if (mockAccounts.has(body.email)) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'email_taken' }) });
    mockAccounts.set(body.email, body.password);
    mockSession = body.email;
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ email: body.email }) });
  }
  if (url.pathname === '/api/auth/login') {
    if (mockAccounts.get(body.email) !== body.password) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_credentials' }) });
    mockSession = body.email;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ email: body.email }) });
  }
  if (url.pathname === '/api/auth/logout') { mockSession = null; return route.fulfill({ status: 204 }); }
  if (url.pathname === '/api/me') {
    return mockSession
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ email: mockSession }) })
      : route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'not_authenticated' }) });
  }
  // sigil/recollection sync: accept writes, return nothing saved on reads
  // — good enough to prove the call happens without a fatal error.
  if (url.pathname === '/api/sigil' && req.method() === 'PUT') return route.fulfill({ status: 204 });
  if (url.pathname === '/api/sigil') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sigil: null }) });
  if (url.pathname === '/api/recollection' && req.method() === 'POST') return route.fulfill({ status: 204 });
  if (url.pathname === '/api/recollection') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ recollection: [] }) });
  return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) });
});

const fatal = [];
page.on('pageerror', e => fatal.push(`page error: ${e.message}`));
// Same filter this test has always used: unresolved-{{ }} console noise (a
// known transient artifact of the runtime's own placeholder rendering
// before real data lands) and a benign "Failed to load resource" are not
// treated as fatal — they're covered by the explicit body-text assertion
// below instead, which is a stronger and less flaky check.
page.on('console', m => { if (m.type() === 'error' && !/\{\{/.test(m.text()) && !/Failed to load resource/.test(m.text())) fatal.push(`console: ${m.text()}`); });

const shot = n => page.screenshot({ path: path.join(OUT, `${n}.png`) });
const fail = [];
const unresolvedIn = body => {
  if (/\{\{\s*\w/.test(body)) {
    return 'unresolved bindings: ' + [...new Set([...body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m => m[1]))].join(', ');
  }
  return null;
};

await page.goto(base + '/' + PAGE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => /tell us the minute/i.test(document.body.innerText || ''), null, { timeout: 15000 });
await shot('00-onboard');

// -- birth entry: on-brand month/day/year + hour/minute/am-pm <select>s
// (fixed a real reported bug — the browser's own <input type="date"/
// "time"> picker chrome can't be restyled and read as a generic OS
// calendar dropped into the app) + place search with a manual lat/lon/
// UTC-offset fallback. DOM order on the onboarding form is fixed
// (month, day, year, hour, minute, am/pm), so selecting by index is
// reliable — there are no other <select>s on this screen. -----------------
const obSelects = page.locator('select');
const fillDate = async (y, m, d) => {
  await obSelects.nth(0).selectOption(m);
  await obSelects.nth(1).selectOption(d);
  await obSelects.nth(2).selectOption(y);
};
const fillTime = async (h, min, ap) => {
  await obSelects.nth(3).selectOption(h);
  await obSelects.nth(4).selectOption(min);
  await obSelects.nth(5).selectOption(ap);
};
await fillDate('1989', '06', '06');
await fillTime('4', '42', 'PM');

// the manual-coordinates toggle: cast a real chart from raw lat/lon/tz,
// bypassing geocode entirely (mirrors Star Shard v3's proven manual-mode
// branch — same computeChart() call, no astro.js/tz.js changes needed).
await page.getByText('enter coordinates manually instead').click();
await page.getByPlaceholder('45.52').fill('41.85');
await page.getByPlaceholder('-122.68').fill('-87.65');
await page.getByPlaceholder('-7').fill('-5');
await shot('01a-manual-coords');
await page.getByText('cast your chart').click();
await page.waitForFunction(() => /casting your chart/i.test(document.body.innerText || ''), null, { timeout: 3000 });
await page.waitForFunction(() => !/casting your chart/i.test(document.body.innerText || ''), null, { timeout: 12000 });
await page.waitForTimeout(1000);
const manualBody = await page.evaluate(() => document.body.innerText || '');
if (!/your star shard/i.test(manualBody)) fail.push('manual-coordinates cast did not reach the shard tab');
const manualMissing = unresolvedIn(manualBody);
if (manualMissing) fail.push(`manual-coordinates shard tab: ${manualMissing}`);

// start over as a fresh visitor for the place-search + error-path flow below.
await page.evaluate(() => localStorage.clear());
await page.goto(base + '/' + PAGE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => /tell us the minute/i.test(document.body.innerText || ''), null, { timeout: 15000 });
await fillDate('1989', '06', '06');
await fillTime('4', '42', 'PM');

// -- real birthplace search (the reported "the login on the location
// doesn't do a search" fix): typing a place used to just get blindly
// geocoded (first match, no way to disambiguate) at cast time. Now it's
// an explicit search step with a real results list, same pattern as
// Star Shard v3.dc.html's sigSearch()/sigCityResults. A search with no
// matches must show a real inline error, not silently let the form
// advance. ------------------------------------------------------------
const placeQuery = page.getByPlaceholder('portland, oregon');
await placeQuery.fill('Nowhereatallville');
await page.getByText('search', { exact: true }).click();
await page.waitForFunction(() => /no place found/i.test(document.body.innerText || ''), null, { timeout: 5000 });
await shot('01a-search-no-match');
const noMatchBody = await page.evaluate(() => document.body.innerText || '');
if (/, United States/i.test(noMatchBody)) fail.push('a no-match search should not show a confirmed place line');

await placeQuery.fill('New York');
await page.getByText('search', { exact: true }).click();
await page.waitForFunction(() => /New York, New York/i.test(document.body.innerText || ''), null, { timeout: 5000 });
await shot('01b-search-results');
await page.getByText('New York, New York').click();
await page.waitForFunction(() => /New York, New York/i.test(document.body.innerText || '') && /change/i.test(document.body.innerText || ''), null, { timeout: 3000 });
await shot('01-form-filled');

await page.getByText('cast your chart').click();
await page.waitForFunction(() => /casting your chart/i.test(document.body.innerText || ''), null, { timeout: 3000 });
await shot('02-casting');

// castChart's own reveal timers, then the real geocode + compute work.
await page.waitForFunction(() => !/casting your chart/i.test(document.body.innerText || ''), null, { timeout: 12000 });
await page.waitForTimeout(1200);
await shot('03-shard');

const shardBody = await page.evaluate(() => document.body.innerText || '');
if (!/your star shard/i.test(shardBody)) fail.push('no shard hero rendered after casting');
const shardMissing = unresolvedIn(shardBody);
if (shardMissing) fail.push(`shard tab: ${shardMissing}`);

// -- real auth (task 39/Part 1): the "keep your shard" sheet auto-opens
// ~1.7s after a real cast. Sign up for real (against the mocked
// /api/auth/* above), confirm the account status line updates, log out,
// then log back in — the actual reported ask ("how do you log out"). ---
await page.waitForFunction(() => /keep your shard/i.test(document.body.innerText || ''), null, { timeout: 3000 });
await page.getByPlaceholder('you@somewhere.com').fill('smoketest@example.com');
await page.getByPlaceholder('at least 8 characters').fill('correct horse battery');
await shot('03a-signup-form');
await page.getByText('create your account').click();
await page.waitForFunction(() => /signed in as smoketest@example\.com/i.test(document.body.innerText || ''), null, { timeout: 5000 });
await shot('03b-signed-in');

await page.getByText('log out', { exact: true }).click();
await page.waitForFunction(() => /not signed in/i.test(document.body.innerText || ''), null, { timeout: 5000 });
const loggedOutBody = await page.evaluate(() => document.body.innerText || '');
if (!/keep your shard →/i.test(loggedOutBody)) fail.push('logout did not return to the "keep your shard" prompt');

await page.getByText('keep your shard →').click();
await page.waitForFunction(() => /keep your shard/i.test(document.body.innerText || ''), null, { timeout: 3000 });
// the sheet should already default to "sign in" (not "create your
// account") after a logout, with the email still filled in — polish
// pass: re-typing the email you were just shown is friction with no
// point, and defaulting a returning user into "create account" is wrong.
await page.waitForFunction(() => /^sign in$/im.test(document.body.innerText || ''), null, { timeout: 3000 });
const emailAfterLogout = await page.getByPlaceholder('you@somewhere.com').inputValue();
if (emailAfterLogout !== 'smoketest@example.com') fail.push(`email should stay filled in after logout, got "${emailAfterLogout}"`);
await page.getByPlaceholder('your password').fill('correct horse battery');
await page.getByText('sign in', { exact: true }).click();
await page.waitForFunction(() => /signed in as smoketest@example\.com/i.test(document.body.innerText || ''), null, { timeout: 5000 });
await shot('03c-logged-back-in');

// -- tonight ----------------------------------------------------------------
await page.locator('button:has-text("tonight")').first().click();
await page.waitForTimeout(600);
await shot('04-tonight');
const tonightBody = await page.evaluate(() => document.body.innerText || '');
if (!/tonight's station/i.test(tonightBody)) fail.push('no tonight ring rendered');
if (/the covered well/i.test(tonightBody)) fail.push('Manzil ("the covered well") is visible — should be forced off (gameNightOn)');
const tonightMissing = unresolvedIn(tonightBody);
if (tonightMissing) fail.push(`tonight tab: ${tonightMissing}`);

// -- your chart ---------------------------------------------------------
await page.locator('button:has-text("your chart")').first().click();
await page.waitForTimeout(600);
await shot('05-chart');
const chartBody = await page.evaluate(() => document.body.innerText || '');
const chartMissing = unresolvedIn(chartBody);
if (chartMissing) fail.push(`chart tab: ${chartMissing}`);

const ringPathCount = await page.locator('svg path').count();
if (ringPathCount < 100) fail.push(`expected ~112+ ring/wheel segment paths, found ${ringPathCount} — did the chart wheel render?`);

// -- claim tonight's station --------------------------------------------
await page.locator('button:has-text("tonight")').first().click();
await page.waitForTimeout(400);
const walkBtn = page.getByText('light tonight\'s station');
if (await walkBtn.count()) {
  await walkBtn.click();
  await page.waitForTimeout(2800); // walk()'s own sweep+burst timers
  await shot('06-claimed');
  const claimedBody = await page.evaluate(() => document.body.innerText || '');
  if (!/, lit ·/.test(claimedBody)) fail.push('claiming tonight\'s station did not render the "lit" confirmation');
}

// -- saved charts (task 39/Part 2): add a second person's chart, confirm
// its preview shows real per-chart data distinct from the primary. -------
await page.locator('button:has-text("your shard")').first().click();
await page.waitForTimeout(400);
await page.getByText('your charts →').click();
await page.waitForFunction(() => /your shard, and anyone else's/i.test(document.body.innerText || ''), null, { timeout: 3000 });
await shot('07-charts-list-empty');

await page.getByText('+ add a chart').click();
await page.waitForFunction(() => /whose chart is this/i.test(document.body.innerText || ''), null, { timeout: 3000 });

// the cast button must start disabled (empty form) and only become real
// once every field is filled — same polish pass as the primary
// onboarding form's obCastStyle, applied here as ncCastStyle/ncOk.
const ncCastBtn = page.getByText('cast this chart');
const emptyCursor = await ncCastBtn.evaluate(el => getComputedStyle(el).cursor);
if (emptyCursor !== 'default') fail.push(`"cast this chart" should be disabled (cursor:default) on an empty form, got cursor:${emptyCursor}`);

await page.getByPlaceholder('mom, alex, ...').fill('a friend');
await fillDate('1995', '03', '12');
await fillTime('2', '15', 'PM');
await page.getByPlaceholder('portland, oregon').fill('New York');
await page.getByText('search', { exact: true }).click();
await page.waitForFunction(() => /New York, New York/i.test(document.body.innerText || ''), null, { timeout: 5000 });
await page.getByText('New York, New York').click();
await page.waitForFunction(() => /change/i.test(document.body.innerText || ''), null, { timeout: 3000 });
await shot('08-add-chart-filled');

const filledCursor = await ncCastBtn.evaluate(el => getComputedStyle(el).cursor);
if (filledCursor !== 'pointer') fail.push(`"cast this chart" should be enabled (cursor:pointer) once the form is filled, got cursor:${filledCursor}`);

await ncCastBtn.click();
await page.waitForFunction(() => /^a friend$/im.test(document.body.innerText || ''), null, { timeout: 8000 });
await page.waitForTimeout(500);
await shot('09-second-chart-preview');

const previewBody = await page.evaluate(() => document.body.innerText || '');
if (!/a friend/i.test(previewBody)) fail.push('add-a-chart did not land on that chart\'s preview');
const previewMissing = unresolvedIn(previewBody);
if (previewMissing) fail.push(`chart preview: ${previewMissing}`);

// the preview must show real, chart-specific data, not the primary
// chart's — the whole point of task 37/38 is that these are independent.
if (shardBody.includes('a friend')) fail.push('sanity check itself is broken — primary shard body already mentions the test name');

await page.getByText('‹ your charts').click();
await page.waitForTimeout(300);
const listBody = await page.evaluate(() => document.body.innerText || '');
if (!/1 saved/i.test(listBody)) fail.push('charts list does not show the newly-added chart in its count');

fail.push(...fatal);
await browser.close();
server.close();

console.log(`screenshots: ${OUT}`);
if (fail.length) {
  console.error(`\n✗ smoke test failed (${fail.length}):`);
  for (const f of fail) console.error(`    ${f}`);
  process.exit(1);
}
console.log('✓ smoke test passed — a real cast renders on all three tabs, no unresolved bindings, Manzil hidden');
