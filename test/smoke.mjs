#!/usr/bin/env node
// Browser smoke test: boots the real page, drives the whole night loop
// (birth entry -> the Sigil reading -> all 5 Sounding beats -> claim), and
// fails on unresolved {{ bindings }}, page errors, or a ring that never
// lights.
//
//   npm i -D playwright && npx playwright install chromium
//   node test/smoke.mjs                 # headless, writes screenshots to /tmp
//   node test/smoke.mjs --out ./shots   # keep the screenshots
//
// This is the check that proves a handoff (Design or otherwise) did not
// break the wiring. Run it before merging.
//
// "Star Shard v2 (archived).dc.html" is retired and kept only as reference
// — this test targets "Star Shard v3.dc.html", the live page as of the
// Sigil/Sounding MVP. See CLAUDE.md's receipt protocol.
//
// OWNER: Claude Code.

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGE = 'Star Shard v3.dc.html';
const OUT = process.argv.includes('--out')
  ? path.resolve(process.argv[process.argv.indexOf('--out') + 1])
  : fs.mkdtempSync('/tmp/starshard-smoke-');
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css' };

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
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.setDefaultTimeout(8000);

// The dc-runtime pulls React, ReactDOM and @babel/standalone from unpkg.com at
// load time — about 3.3MB before a single pixel renders, and a hard dependency
// on a third-party CDN being up. Set VENDOR_DIR to serve them from disk so this
// test runs offline and deterministically:
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

const fatal = [];
page.on('pageerror', e => fatal.push(`page error: ${e.message}`));
// Same filter test/smoke.mjs has always used: unresolved-{{ }} console noise
// and a benign "Failed to load resource" (unpkg 404 races, etc.) are not
// treated as fatal — they're covered by the explicit body-text assertion
// below instead, which is a stronger and less flaky check.
page.on('console', m => { if (m.type() === 'error' && !/\{\{/.test(m.text()) && !/Failed to load resource/.test(m.text())) fatal.push(`console: ${m.text()}`); });

const shot = n => page.screenshot({ path: path.join(OUT, `${n}.png`) });

await page.goto(base, { waitUntil: 'domcontentloaded' });
// case-insensitive: .eyebrow's CSS text-transform:uppercase renders the
// literal lowercase markup text as uppercase, and innerText reflects the
// rendered case, not the DOM's literal text.
await page.waitForFunction(() => /star shard/i.test(document.body.innerText || ''), null, { timeout: 20000 });
await page.waitForTimeout(500);
await shot('01-entry');

// -- birth entry (manual coordinates — no network geocoder dependency) ------
await page.getByText('enter coordinates manually instead').click();
await page.locator('#sig-name').fill('smoketest');
await page.locator('#sig-date').fill('1989-06-06');
await page.locator('#sig-time').fill('16:40');
await page.locator('#sig-lat').fill('40.71');
await page.locator('#sig-lon').fill('-74.01');
await page.locator('#sig-tz').fill('-5');
await shot('02-form');

await page.getByText('read my mark ✦').click();
await page.waitForTimeout(900); // the 700ms reveal beat + a margin
await shot('03-sigil');

// -- the Sigil profile: natal parts + ring should have rendered -------------
const profileBody = await page.evaluate(() => document.body.innerText || '');
const fail = [];
// These labels sit in .eyebrow divs (CSS text-transform:uppercase) —
// innerText reflects the rendered case, so match case-insensitively.
if (!/the strike/i.test(profileBody)) fail.push('no "the strike" beat rendered on the Sigil profile');
if (!/the root/i.test(profileBody)) fail.push('no "the root" beat rendered on the Sigil profile');
if (!/the gait/i.test(profileBody)) fail.push('no "the gait" beat rendered on the Sigil profile');
const ringPathCount = await page.locator('svg path').count();
if (ringPathCount < 100) fail.push(`expected ~112 ring segment paths, found ${ringPathCount} — did sigilRingData() render?`);

// -- walk tonight's crossing: all 5 Sounding beats + claim -------------------
await page.getByText("walk tonight's crossing").click();
await page.waitForTimeout(300);
await shot('04-beat0-station');

for (let i = 0; i < 3; i++) {
  await page.getByText('next ✦').click();
  await page.waitForTimeout(200);
}
await shot('05-beat3-question');

await page.getByText(/claim tonight ✦|already kindled tonight/).click();
await page.waitForTimeout(400);
await shot('06-beat4-claim');

const claimBody = await page.evaluate(() => document.body.innerText || '');
if (!/kindled\./.test(claimBody)) fail.push('claim beat did not render "kindled."');
if (!/walk it well/.test(claimBody)) fail.push('claim beat did not render the close line');

// --- assertions ------------------------------------------------------------

const fullBody = await page.evaluate(() => document.body.innerText || '');
if (/\{\{\s*\w/.test(fullBody)) {
  fail.push('unresolved bindings in the rendered page: ' +
    [...new Set([...fullBody.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m => m[1]))].join(', '));
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
console.log('✓ smoke test passed — the full night loop renders, the ring kindles, no unresolved bindings');
