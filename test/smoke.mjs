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

// -- birth entry: native date/time pickers (fixed a real reported bug —
// the export's free-text date field gave no year/month/day picker at
// all) + a free-text place field (still best-effort, no manual lat/lon/tz
// fallback — see CLAUDE.md's "wire as-is" scope note) ----------------------
await page.locator('input[type="date"]').fill('1989-06-06');
await page.locator('input[type="time"]').fill('16:42');
await page.getByPlaceholder('portland, oregon').fill('Nowhereatallville');
await shot('01-form-filled-bad-place');

// -- a failed cast (no geocode match) must surface a real error, not
// silently reset the form — this was the reported bug ("doesn't open to
// the actual app after inputting your birth time"): a failed cast used to
// fail silently with zero explanation, which read as the app being broken.
await page.getByText('cast your chart').click();
await page.waitForFunction(() => !/casting your chart/i.test(document.body.innerText || ''), null, { timeout: 12000 });
await page.waitForTimeout(300);
await shot('01b-cast-error');
const errorBody = await page.evaluate(() => document.body.innerText || '');
if (!/couldn't find|try a bigger|check the spelling/i.test(errorBody)) fail.push('a failed geocode did not surface an inline error message');
if (/tell us the minute/i.test(errorBody) === false) fail.push('a failed cast should return to the onboarding form, not advance past it');

// now fix the place and continue with the real successful flow.
await page.getByPlaceholder('portland, oregon').fill('New York');
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

// dismiss the "keep your shard" account sheet if it appeared (real funnel
// behavior, ~1.7s after a real cast — not a bug)
try { await page.getByText('not now', { exact: true }).click({ timeout: 2000 }); } catch (e) {}
await page.waitForTimeout(300);

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
