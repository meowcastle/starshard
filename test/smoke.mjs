#!/usr/bin/env node
// Browser smoke test: boots the real page, drives the whole reading flow, and
// fails on unresolved {{ bindings }}, page errors, or an impossible degree.
//
//   npm i -D playwright && npx playwright install chromium
//   node test/smoke.mjs                 # headless, writes screenshots to /tmp
//   node test/smoke.mjs --out ./shots   # keep the screenshots
//
// This is the check that proves a Claude Design handoff did not break the
// wiring. Run it before merging a design branch.
//
// OWNER: Claude Code.

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGE = 'Star Shard v2.dc.html';
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
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
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
page.on('console', m => { if (m.type() === 'error' && !/\{\{/.test(m.text()) && !/Failed to load resource/.test(m.text())) fatal.push(`console: ${m.text()}`); });

const shot = n => page.screenshot({ path: path.join(OUT, `${n}.png`) });

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => /star shard/.test(document.body.innerText || ''), null, { timeout: 20000 });
await page.waitForTimeout(800);
await shot('01-landing');

await page.getByText('✦ get your shard ✦').click();
await page.getByText('enter coordinates manually instead').click();
await page.locator('input[placeholder="mikufan39"]').fill('smoketest');
await page.locator('input[type=date]').first().fill('1989-06-06');
await page.locator('input[type=time]').first().fill('16:40');
await page.locator('input[placeholder="40.71"]').fill('40.71');
await page.locator('input[placeholder="-74.01"]').fill('-74.01');
await page.locator('input[placeholder="-5"]').fill('-5');
await shot('02-form');

await page.getByText('✧ shatter the sky ✧').click();
await page.waitForTimeout(400);
for (let i = 0; i < 4; i++) {
  const c = page.getByText('CLICK TO OPEN ✦');
  if (await c.count()) await c.nth(0).click();
  await page.waitForTimeout(120);
}
await shot('03-shards');

await page.getByText('🔮 chart wheel').first().click();
await page.waitForTimeout(300);
await shot('04-wheel');

const body = await page.evaluate(() => document.body.innerText || '');

// --- assertions ------------------------------------------------------------

const fail = [];
if (/\{\{\s*\w/.test(body)) {
  fail.push('unresolved bindings in the rendered page: ' +
    [...new Set([...body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m => m[1]))].join(', '));
}
const degs = [...body.matchAll(/(\d+)°(\d{2})′/g)];
if (!degs.length) fail.push('no formatted degrees rendered — did the chart compute?');
for (const [full, d, m] of degs) {
  if (+m > 59) fail.push(`impossible degree rendered: ${full}`);
  if (+d > 29) fail.push(`degree out of sign range: ${full}`);
}
for (const marker of ['house shard', 'mirror shard', 'moon shard', 'hearth shard']) {
  if (!body.includes(marker)) fail.push(`missing "${marker}" after reveal`);
}
if (!/rising/.test(body)) fail.push('no rising sign rendered');
fail.push(...fatal);

await browser.close();
server.close();

console.log(`screenshots: ${OUT}`);
if (fail.length) {
  console.error(`\n✗ smoke test failed (${fail.length}):`);
  for (const f of fail) console.error(`    ${f}`);
  process.exit(1);
}
console.log(`✓ smoke test passed — full reading flow renders, ${degs.length} degrees all valid`);
