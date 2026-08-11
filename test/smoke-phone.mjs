#!/usr/bin/env node
// Browser smoke test for the phone flow (<1024px), same shape as test/smoke.mjs
// but at a phone viewport, driving the linear landing -> form -> shatter ->
// shards -> card flow through manual coordinates. Fails on unresolved
// {{ bindings }}, page errors (this is the check that would have caught the
// `copy.fallbackWeave is not a function` crash from STATUS.md), or a reading
// that never renders.
//
// The phone screens never format an ecliptic degree (no chart-wheel or cusp
// table there — see the card/shard pips in v2.dc.html), so unlike
// test/smoke.mjs this doesn't assert on degFmt output. It asserts the
// equivalent: real mansion/reading prose renders, not a crash or a mustache.
//
//   npm i -D playwright && npx playwright install chromium
//   node test/smoke-phone.mjs                 # headless, writes screenshots to /tmp
//   node test/smoke-phone.mjs --out ./shots    # keep the screenshots
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
  : fs.mkdtempSync('/tmp/starshard-smoke-phone-');
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
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);

// See test/smoke.mjs for why: the dc-runtime pulls React/ReactDOM/Babel from
// unpkg at load time. VENDOR_DIR makes this test run offline.
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
await page.waitForFunction(() => /mansion/i.test(document.body.innerText || ''), null, { timeout: 20000 });
await page.waitForTimeout(800);
await shot('01-landing');

await page.getByText('draw my card ✦').click();
await shot('02-form-empty');

await page.locator('input[placeholder="mikufan39"]').fill('smoketest');
await page.locator('input[type=date]').first().fill('1989-06-06');
await page.locator('input[type=time]').first().fill('16:40');
await page.getByText('enter coordinates manually instead').click();
await page.locator('input[placeholder="lat 40.71"]').fill('40.71');
await page.locator('input[placeholder="lon -74.01"]').fill('-74.01');
await page.locator('input[placeholder="utc -5"]').fill('-5');
await shot('03-form-filled');

await page.getByText('✧ shatter the sky ✧').click();
await page.waitForTimeout(1800); // pAdvance's shatter->shards timeout is 1300ms
await shot('04-shatter-or-shards');

for (let i = 0; i < 4; i++) {
  const c = page.getByText('tap to flip');
  if (await c.count()) await c.nth(0).click();
  await page.waitForTimeout(120);
}
await shot('05-shards');

const revealBtn = page.getByText(/tap a shard|weave my reading/);
if (await revealBtn.count()) await revealBtn.first().click();
await page.waitForTimeout(400);
await shot('06-card');

const body = await page.evaluate(() => document.body.innerText || '');

// --- assertions ------------------------------------------------------------

const fail = [];
if (/\{\{\s*\w/.test(body)) {
  fail.push('unresolved bindings in the rendered page: ' +
    [...new Set([...body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m => m[1]))].join(', '));
}
if (!/of xxviii/i.test(body)) fail.push('no mansion card rendered on the card step');
if (/\bundefined\b|\bNaN\b/.test(body)) fail.push('undefined/NaN leaked into rendered text');
if (!/WOVEN FOR YOU/.test(body)) fail.push('no woven reading rendered — did reading.weave() run?');
fail.push(...fatal);

await browser.close();
server.close();

console.log(`screenshots: ${OUT}`);
if (fail.length) {
  console.error(`\n✗ phone smoke test failed (${fail.length}):`);
  for (const f of fail) console.error(`    ${f}`);
  process.exit(1);
}
console.log('✓ phone smoke test passed — landing → form → shatter → shards → card renders real content');
