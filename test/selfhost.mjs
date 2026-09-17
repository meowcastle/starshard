#!/usr/bin/env node
// Proves the page still boots when unpkg.com is unreachable.
//
//   npm i -D playwright && npx playwright install chromium
//   node test/selfhost.mjs
//   CHROMIUM_PATH=/path/to/chromium node test/selfhost.mjs
//
// WHY THIS EXISTS
//
// support.js pulls React, ReactDOM and @babel/standalone from unpkg.com, and
// its own comment says what happens if unpkg is slow, blocked or down: the
// site renders raw {{ mustaches }}. tools/selfhost-runtime.mjs builds a
// deployed copy that points those three at /vendor/ on our own origin via the
// runtime's own window.__resources hook. This asserts that actually works,
// in a real browser, with unpkg blocked at the network layer.
//
// IT RUNS A CONTROL ON PURPOSE. A self-hosted run that passes proves nothing
// on its own — the browser could have cached React, or unpkg might never have
// been on the critical path to begin with. So the pristine runtime is run
// first under the same block and MUST fail. If the control ever starts
// passing, this test has stopped measuring anything and needs re-reading.
//
// NOTE ON BABEL: it is NOT fetched during boot. ensureBabel() is lazy and only
// fires for a jsx <x-import> (ios-frame.jsx). So this asserts React/ReactDOM
// come off /vendor/ at boot, and separately that /vendor/babel.js is served
// and byte-correct for when the runtime does ask for it.
//
// OWNER: Claude Code.

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGE = 'Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html';
const BUILT = path.join(ROOT, 'build', 'support.js');
const PRISTINE = path.join(ROOT, 'support.js');

let failures = 0;
const ok = (cond, label, detail = '') => {
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${label}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

// 1. Build, which also verifies vendor/ against support.js's own SRI hashes.
console.log('building the self-hosted runtime');
execFileSync(process.execPath, [path.join(ROOT, 'tools', 'selfhost-runtime.mjs')], { stdio: 'inherit' });

console.log('\nstatic checks');
const built = fs.readFileSync(BUILT, 'utf8');
for (const dep of ['react.js', 'react-dom.js', 'babel.js']) {
  ok(built.includes(`"/vendor/${dep}"`), `shim maps /vendor/${dep}`);
}
ok(built.includes(fs.readFileSync(PRISTINE, 'utf8').slice(0, 200)),
   'built runtime still contains the pristine runtime verbatim');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css' };

let variant = BUILT;
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/' + PAGE;
  const f = p === '/support.js' ? variant : path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function boot(which) {
  variant = which;
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const page = await ctx.newPage();
  const unpkg = [];
  const vendor = new Set();
  await page.route('**unpkg.com/**', (r) => { unpkg.push(r.request().url()); return r.abort(); });
  // Google Fonts is its own third party and not what is under test here.
  await page.route('**fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**fonts.gstatic.com/**', (r) => r.abort());
  page.on('request', (r) => {
    if (r.url().includes('/vendor/')) vendor.add(r.url().split('/').pop());
  });

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  let booted = false;
  try {
    await page.waitForFunction(() => !!(window.React && window.ReactDOM && window.__dcBoot),
      { timeout: 20000 });
    booted = true;
  } catch { /* the control is expected to land here */ }
  await page.waitForTimeout(2500);

  const seen = await page.evaluate(() => ({
    // A booted runtime consumes the <x-dc> template and renders in its place;
    // an unbooted page still has the raw template sitting there, which is why
    // "x-dc has content" is NOT evidence of rendering.
    templateConsumed: (document.querySelector('x-dc')?.innerHTML || '').length === 0,
    text: (document.body.innerText || '').replace(/\s+/g, ' ').trim(),
  }));
  await ctx.close();
  return { booted, unpkg: unpkg.length, vendor: [...vendor].sort(), ...seen,
           mustaches: (seen.text.match(/\{\{\s*[\w.]+\s*\}\}/g) || []).length };
}

console.log('\ncontrol: the pristine runtime, with unpkg blocked');
const c = await boot(PRISTINE);
ok(!c.booted, 'does NOT boot without unpkg', 'this is the failure being fixed');
ok(c.unpkg > 0, `tried to reach unpkg (${c.unpkg} requests)`);

console.log('\nfix: the self-hosted runtime, with unpkg blocked');
const s = await boot(BUILT);
ok(s.booted, 'React, ReactDOM and the dc-runtime all come up');
ok(s.unpkg === 0, 'zero requests to unpkg.com');
ok(s.vendor.includes('react.js') && s.vendor.includes('react-dom.js'),
   'React + ReactDOM served from /vendor/', s.vendor.join(', '));
ok(s.templateConsumed, 'the <x-dc> template was hydrated, not left raw');
ok(s.mustaches === 0, 'no unresolved {{ bindings }} on screen');
ok(s.text.length > 40, 'real copy rendered', JSON.stringify(s.text.slice(0, 60)));

// Babel is lazy, so assert it is serveable and correct rather than requested.
const babelSri = /var\s+BABEL_SRI\s*=\s*"([^"]+)"/.exec(fs.readFileSync(PRISTINE, 'utf8'))[1];
const res = await fetch(`${base}/vendor/babel.js`);
const bytes = Buffer.from(await res.arrayBuffer());
const got = 'sha384-' + crypto.createHash('sha384').update(bytes).digest('base64');
ok(res.ok && got === babelSri, 'lazy /vendor/babel.js is served and matches its SRI',
   `${(bytes.length / 1024).toFixed(0)} KB`);

await browser.close();
server.close();

console.log(`\n${failures ? `FAILED (${failures})` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
