#!/usr/bin/env node
// Playwright smoke for the Star Shard shell (BACKLOG SS4 gate; SS5, SS6, SS7, SS8, SS9 and SS9b checks added): loads every route of
// app/dist at 390 px and at 1440 px and fails on any console error or page error.
//
//   npm --prefix app run build:app && node test/smoke-app.mjs
//
// Per route and width it also checks: the page rendered its own <h1> and data-route; the
// document is not wider than the viewport (no horizontal scroll); below 1024 px the
// five-tab bar is visible and the header nav hidden, above it the reverse; every link and
// button is at least 44 px tall. Then one in-app navigation (a tab tap changes the route
// without a reload), the static legal pages, and an unknown URL rendering the not-found page.
//
// Needs a Chromium that Playwright can launch. SMOKE_OFFLINE=1 blocks fonts.googleapis.com
// and fonts.gstatic.com and reports those blocked loads as warnings, for a machine with no
// route to Google Fonts; everything else stays strict. PORT picks the local port (default
// 4173). SMOKE_SHOTS=dir writes a PNG per route and width into dir. SMOKE_DUMP=dir writes
// each route's rendered HTML (desktop) into dir, for tools/writing-lint.mjs.
//
// SS8 (the stranger's path) boots starshard-api in this process against its SQLite shim
// (starshard-api/test/helpers/boot.js; `cd starshard-api && npm install` first) and serves the
// build at http://starshard.test with the API at https://api.starshard.test, both answered by
// Playwright routes, so the shell talks to a real local API the way it talks to production.
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const { start } = await import(join(root, 'app', 'serve.mjs'));
const { STATIC_ROUTES } = await import(join(root, 'app', 'src', 'routes.mjs'));

const OFFLINE = process.env.SMOKE_OFFLINE === '1';
const SHOTS = process.env.SMOKE_SHOTS ? resolve(process.env.SMOKE_SHOTS) : null;
const DUMP = process.env.SMOKE_DUMP ? resolve(process.env.SMOKE_DUMP) : null;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const WIDTHS = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

const routes = [
  ...STATIC_ROUTES.map(r => ({ path: r.path, key: r.key })),
  { path: '/station/the-gate', key: 'station' },
  { path: '/station/the-thread', key: 'station' },
  { path: '/no-such-page', key: 'notfound' },
];

const { server, url: base } = await start(Number(process.env.PORT || 4173));

// the local API for SS8: a real server.js on a random port, the SQLite shim under it
const require = createRequire(import.meta.url);
let apiSrv = null;
try {
  const { boot } = require(join(root, 'starshard-api', 'test', 'helpers', 'boot.js'));
  apiSrv = await boot();
} catch (e) {
  console.log(`  (no local API for the stranger's path: ${e.message.split('\n')[0]}; cd starshard-api && npm install)`);
}
const HOST = 'http://starshard.test';
const API_HOST = 'api.starshard.test';
const sha256 = s => createHash('sha256').update(s).digest('hex');
if (SHOTS) await mkdir(SHOTS, { recursive: true });
if (DUMP) await mkdir(DUMP, { recursive: true });
const browser = await chromium.launch();

let failures = 0;
let warnings = 0;
const rows = [];

function fail(msg) { failures++; console.log(`  FAIL ${msg}`); }

async function loadPage(context, path) {
  const page = await context.newPage();
  const errors = [];
  const fontWarnings = [];
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const loc = msg.location()?.url || '';
    const text = msg.text();
    if (OFFLINE && FONT_HOSTS.some(h => loc.includes(h) || text.includes(h))) { fontWarnings.push(text); return; }
    errors.push(`${text}${loc ? ` (${loc})` : ''}`);
  });
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', req => {
    const u = req.url();
    if (OFFLINE && FONT_HOSTS.some(h => u.includes(h))) { fontWarnings.push(`blocked ${u}`); return; }
    errors.push(`request failed: ${u} (${req.failure()?.errorText})`);
  });
  if (OFFLINE) {
    await page.route(u => FONT_HOSTS.some(h => u.hostname === h), r => r.abort());
  }
  const resp = await page.goto(base + path, { waitUntil: 'networkidle' });
  // the codex and the station pages are prerendered (data-prerender); wait for the bundle's own main
  await page.waitForSelector('main[data-route]:not([data-prerender])', { timeout: 10000 });
  return { page, errors, fontWarnings, status: resp?.status() };
}

// One visitor's origin: the build at http://starshard.test and the API at https://api.starshard.test,
// both answered by Playwright routes. The API route keeps the session cookie the way a browser
// would (one jar per visitor) and gives the API one address per visitor for its rate limits.
// SS8 (the stranger's path) and SS9b (the play route) both wire their contexts this way.
async function wireOrigin(sctx, jar, ip) {
  if (OFFLINE) await sctx.route(u => FONT_HOSTS.some(h => u.hostname === h), r => r.abort());
  await sctx.route(u => u.hostname === 'geocoding-api.open-meteo.com', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ results: [{ name: 'New York', admin1: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' }] }),
  }));
  // the build, from the static server
  await sctx.route(u => u.hostname === 'starshard.test', async route => {
    const u = new URL(route.request().url());
    const r = await fetch(base + u.pathname + u.search);
    await route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'no-store' }, body: Buffer.from(await r.arrayBuffer()) });
  });
  // the API, with the jar
  await sctx.route(u => u.hostname === API_HOST, async route => {
    const req = route.request();
    const u = new URL(req.url());
    const cors = { 'access-control-allow-origin': HOST, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin' };
    if (req.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return; }
    const headers = { 'x-forwarded-for': ip, origin: HOST };
    const ct = req.headers()['content-type'];
    if (ct) headers['content-type'] = ct;
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookie) headers.cookie = cookie;
    const body = req.postDataBuffer();
    const r = await fetch(apiSrv.base + u.pathname + u.search, { method: req.method(), headers, body: body && body.length ? body : undefined, redirect: 'manual' });
    for (const raw of r.headers.getSetCookie()) {
      const [pair, ...attrs] = raw.split(';');
      const [k, v] = pair.split('=');
      const expired = attrs.some(a => /expires=Thu, 01 Jan 1970/i.test(a) || /max-age=0/i.test(a));
      if (expired || !v) jar.delete(k.trim()); else jar.set(k.trim(), v);
    }
    const h = { ...cors };
    const rct = r.headers.get('content-type');
    if (rct) h['content-type'] = rct;
    await route.fulfill({ status: r.status, headers: h, body: Buffer.from(await r.arrayBuffer()) });
  });
}

for (const w of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width: w.width, height: w.height },
    isMobile: w.mobile,
    hasTouch: w.mobile,
    deviceScaleFactor: w.mobile ? 3 : 1,
  });
  console.log(`\n${w.name} ${w.width}x${w.height}`);
  for (const r of routes) {
    const { page, errors, fontWarnings, status } = await loadPage(context, r.path);
    const facts = await page.evaluate(() => {
      const main = document.querySelector('main[data-route]');
      const h1 = document.querySelector('main h1');
      const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
      // links set inline in a sentence are exempt (WCAG 2.5.8's inline exception); every
      // block or flex control must reach 44 px
      const small = [...document.querySelectorAll('a, button')]
        .filter(visible)
        .filter(el => getComputedStyle(el).display !== 'inline')
        .map(el => ({ t: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30), h: el.getBoundingClientRect().height }))
        .filter(x => x.h > 0 && x.h < 44);
      return {
        route: main?.getAttribute('data-route'),
        h1: h1 ? h1.textContent.trim() : null,
        title: document.title,
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        tabs: visible(document.querySelector('nav.tabs')),
        nav: visible(document.querySelector('nav.nav')),
        chip: visible(document.querySelector('.chip')),
        small,
        bodyFontPx: parseFloat(getComputedStyle(document.body).fontSize),
      };
    });
    const label = `${r.path.padEnd(22)}`;
    const problems = [];
    if (status && status >= 400) problems.push(`http ${status}`);
    if (facts.route !== r.key) problems.push(`data-route ${facts.route} (wanted ${r.key})`);
    if (!facts.h1) problems.push('no h1');
    if (facts.scrollW > facts.innerW) problems.push(`horizontal overflow ${facts.scrollW} > ${facts.innerW}`);
    if (w.width < 1024 && !facts.tabs) problems.push('tab bar hidden on phone');
    if (w.width < 1024 && facts.nav) problems.push('header nav shown on phone');
    if (w.width >= 1024 && !facts.nav) problems.push('header nav hidden on desktop');
    if (w.width >= 1024 && facts.tabs) problems.push('tab bar shown on desktop');
    if (!facts.chip) problems.push('no account chip');
    if (facts.bodyFontPx < 14) problems.push(`body ${facts.bodyFontPx}px under the 14px floor`);
    if (facts.small.length) problems.push(`controls under 44px: ${facts.small.map(x => `${x.t}@${Math.round(x.h)}`).join(', ')}`);
    for (const e of errors) problems.push(`console: ${e}`);
    warnings += fontWarnings.length;
    if (DUMP && !w.mobile) await writeFile(join(DUMP, `${r.key}${r.key === 'station' ? '-' + r.path.split('/').pop() : ''}.html`), await page.content());
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-${r.key}${r.key === 'station' ? '-' + r.path.split('/').pop() : ''}.png`), fullPage: false });
    if (problems.length) { console.log(`  ${label} FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  ${label} ok   h1 "${facts.h1}"  title "${facts.title}"${fontWarnings.length ? `  (${fontWarnings.length} font loads blocked)` : ''}`);
    rows.push({ width: w.name, path: r.path, ok: !problems.length });
    await page.close();
  }

  // in-app navigation: tapping a door changes the route without a document load
  {
    const { page, errors } = await loadPage(context, '/');
    const marker = await page.evaluate(() => { window.__smokeMarker = 1; return 1; });
    const target = w.width < 1024 ? 'nav.tabs a[href="/codex"]' : 'nav.nav a[href="/codex"]';
    await page.click(target);
    await page.waitForSelector('main[data-route="codex"]', { timeout: 5000 });
    const kept = await page.evaluate(() => window.__smokeMarker === 1 && location.pathname === '/codex');
    const count = await page.locator('ol.codex-list li').count();
    if (!kept) fail('in-app navigation reloaded the document or did not change the URL');
    if (count !== 28) fail(`codex lists ${count} stations, wanted 28`);
    await page.goBack();
    await page.waitForSelector('main[data-route="home"]', { timeout: 5000 });
    for (const e of errors) fail(`console during navigation: ${e}`);
    console.log(`  navigation            ${kept && count === 28 ? 'ok' : 'FAIL'}   home -> codex (28 rows) -> back, no reload`);
    await page.close();
  }

  // SS5: the lobby and the reading page. Home renders tonight's station, the game's street
  // (16 SVG scenes mounted, an hour in 0..3) and the one sentence that says what this is,
  // within a second of navigation on the local server; Tonight renders the ring of 28 with
  // the moon's station lit, the seven planet rows and the next crossing.
  for (const path of ['/', '/tonight']) {
    const t0 = Date.now();
    const { page, errors } = await loadPage(context, path);
    const sel = path === '/' ? 'main[data-route="home"] [data-what="product"]' : 'main[data-route="tonight"] .ring-now';
    await page.waitForSelector(sel, { timeout: 5000 });
    const ms = Date.now() - t0;
    const facts = await page.evaluate(() => {
      const scene = document.querySelector('.scene');
      return {
        h1: document.querySelector('main h1')?.textContent.trim() || '',
        what: document.querySelector('[data-what="product"]')?.textContent.trim() || '',
        sceneSvgs: scene ? scene.querySelectorAll('svg').length : 0,
        hour: scene ? scene.getAttribute('data-hour') : null,
        sceneH: scene ? scene.getBoundingClientRect().height : 0,
        segs: document.querySelectorAll('.ring-seg').length,
        now: document.querySelectorAll('.ring-now').length,
        planets: document.querySelectorAll('ol.planets li').length,
        crossing: !!document.querySelector('#crossing-h'),
        stationLinks: [...document.querySelectorAll('a[href^="/station/"]')].length,
      };
    });
    const problems = [];
    // the gate says one second; the load itself (networkidle) is inside the number
    if (ms > 1000) problems.push(`rendered in ${ms} ms, over the 1 s gate`);
    if (path === '/') {
      if (!/the moon is in /.test(facts.h1)) problems.push(`home h1 is "${facts.h1}", wanted tonight's station`);
      if (!facts.what || !/star shard/.test(facts.what) || !/\.$/.test(facts.what)) problems.push('home has no one-sentence line saying what the product is');
      if (facts.sceneSvgs !== 16) problems.push(`scene mounted ${facts.sceneSvgs} svgs, wanted 16`);
      if (!['0', '1', '2', '3'].includes(facts.hour)) problems.push(`scene hour ${facts.hour}`);
      if (facts.sceneH < 200) problems.push(`scene ${Math.round(facts.sceneH)} px tall`);
    } else {
      if (facts.segs !== 28) problems.push(`ring has ${facts.segs} segments, wanted 28`);
      if (facts.now !== 1) problems.push(`ring lights ${facts.now} stations, wanted 1`);
      if (facts.planets !== 7) problems.push(`${facts.planets} planet rows, wanted 7`);
      if (!facts.crossing) problems.push('no next-crossing section');
      if (facts.stationLinks < 29) problems.push(`${facts.stationLinks} station links`);
    }
    for (const e of errors) problems.push(`console: ${e}`);
    if (problems.length) { console.log(`  ss5 ${path.padEnd(18)} FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  ss5 ${path.padEnd(18)} ok   ${ms} ms to ${path === '/' ? `"${facts.h1}", scene ${facts.sceneSvgs} svgs at hour ${facts.hour}` : `ring 28, moon lit, ${facts.planets} planets`}`);
    await page.close();
  }

  // SS6: the chart. With no birth record the page is the form. A birth entered through it
  // (the place lookup answered here by a fixture; the lookup itself is open-meteo's, outside
  // a local run) casts the chart: the wheel with its 28 station segments, 12 sign glyphs, 12
  // cusps, 10 bodies and aspect lines; the planet table; every term with a definition; a
  // hovered term shows its tooltip; the record survives a reload; the time unchecked gives
  // a noon chart with no houses and the moon's range drawn.
  {
    const { page, errors } = await loadPage(context, '/chart');
    const problems = [];
    await page.route(u => u.hostname === 'geocoding-api.open-meteo.com', r => r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ results: [{ name: 'New York', admin1: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' }] }),
    }));
    if (!(await page.locator('form.birth-form').count())) problems.push('no birth form for a visitor without a record');
    await page.fill('#b-date', '1985-03-15');
    await page.fill('#b-time', '06:30');
    await page.fill('#b-place', 'New York');
    await page.waitForSelector('.place-opt', { timeout: 5000 }).catch(() => problems.push('the place list did not open'));
    if (await page.locator('.place-opt').count()) await page.click('.place-opt');
    const t0 = Date.now();
    await page.click('form.birth-form button[type="submit"]');
    await page.waitForSelector('svg.wheel', { timeout: 10000 }).catch(() => problems.push('no wheel after casting'));
    const ms = Date.now() - t0;
    const facts = await page.evaluate(() => {
      const q = s => document.querySelectorAll(s).length;
      // the text a reader sees: without the tooltips, which sit in the DOM hidden
      const textOf = el => { if (!el) return ''; const c = el.cloneNode(true); c.querySelectorAll('.term-tip').forEach(t => t.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
      const tips = [...document.querySelectorAll('.term-tip')].map(t => t.textContent.trim());
      return {
        stations: q('.wheel-station'), signs: q('.wheel-sign'), cusps: q('.wheel-houses > g > path'), bodies: q('.wheel-body'), aspects: q('.wheel-aspect'),
        rows: q('ol[aria-label="the ten bodies"] li'), houses: q('ol[aria-label="the twelve houses"] li'), aspectRows: q('ol[aria-label="the aspects"] li'),
        missing: [...document.querySelectorAll('[data-term-missing]')].map(e => e.getAttribute('data-term-missing')),
        terms: q('.term-b'), emptyTips: tips.filter(t => !t).length,
        lead: textOf(document.querySelector('.chart-lead')),
        sunRow: textOf(document.querySelector('ol[aria-label="the ten bodies"] li')),
        lit: q('.wheel-station .ring-now'),
      };
    });
    if (facts.stations !== 28) problems.push(`${facts.stations} station segments, wanted 28`);
    if (facts.signs !== 12) problems.push(`${facts.signs} sign glyphs, wanted 12`);
    if (facts.cusps !== 12) problems.push(`${facts.cusps} house cusps, wanted 12`);
    if (facts.bodies !== 10) problems.push(`${facts.bodies} bodies, wanted 10`);
    if (facts.aspects < 1) problems.push('no aspect lines');
    if (facts.rows !== 12) problems.push(`${facts.rows} planet rows, wanted 12 (ten bodies, ascendant, midheaven)`);
    if (facts.houses !== 12) problems.push(`${facts.houses} house rows, wanted 12`);
    if (facts.aspectRows < 1) problems.push('no aspect rows');
    if (facts.lit !== 1) problems.push(`${facts.lit} lit stations, wanted 1`);
    if (facts.missing.length) problems.push(`terms without a definition: ${facts.missing.join(', ')}`);
    if (facts.emptyTips) problems.push(`${facts.emptyTips} empty tooltips`);
    if (!/sun in pisces/.test(facts.lead)) problems.push(`lead "${facts.lead}" does not say sun in pisces`);
    if (!/aries rising/.test(facts.lead)) problems.push(`lead "${facts.lead}" does not say aries rising`);
    if (!/pisces/.test(facts.sunRow)) problems.push(`sun row "${facts.sunRow}"`);
    // a hovered or tapped term shows its definition
    const sunTerm = page.locator('.term-b[data-term="sun"]').first();
    if (w.mobile) await sunTerm.tap(); else await sunTerm.hover();
    await page.waitForTimeout(200);
    const tipShown = await page.evaluate(() => {
      const b = document.querySelector('.term-b[data-term="sun"]');
      const tip = b && b.parentElement.querySelector('.term-tip');
      if (!tip) return false;
      const cs = getComputedStyle(tip);
      const r = tip.getBoundingClientRect();
      return cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.9 && r.left >= 0 && r.right <= window.innerWidth && tip.textContent.length > 12;
    });
    if (!tipShown) problems.push('the sun\'s definition did not show on hover or tap, or spilled off screen');
    // the record survives a reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('svg.wheel', { timeout: 10000 }).catch(() => problems.push('the chart did not survive a reload'));
    // the noon chart
    await page.click('button:has-text("change the birth data")');
    await page.waitForSelector('form.birth-form', { timeout: 5000 });
    await page.check('.check input[type="checkbox"]');
    await page.click('form.birth-form button[type="submit"]');
    await page.waitForSelector('svg.wheel', { timeout: 10000 }).catch(() => problems.push('no wheel for the noon chart'));
    const noon = await page.evaluate(() => ({ houses: document.querySelectorAll('.wheel-houses').length, range: document.querySelectorAll('.wheel-moon-range').length, rows: document.querySelectorAll('ol[aria-label="the ten bodies"] li').length, note: document.querySelector('.chart-bodies .note')?.textContent || '' }));
    if (noon.houses !== 0) problems.push('a noon chart drew houses');
    if (noon.range !== 1) problems.push('a noon chart did not draw the moon\'s range');
    if (noon.rows !== 10) problems.push(`${noon.rows} rows on a noon chart, wanted 10`);
    if (!/noon chart/.test(noon.note)) problems.push('the noon chart note is missing');
    await page.evaluate(() => { try { localStorage.removeItem('starshard-birth'); } catch (e) {} });
    for (const e of errors) problems.push(`console: ${e}`);
    if (problems.length) { console.log(`  ss6 /chart             FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  ss6 /chart             ok   ${ms} ms to the wheel: 28 stations, 12 signs, 12 cusps, 10 bodies, ${facts.aspects} aspect lines, ${facts.terms} terms all defined; reload kept it; noon chart without houses`);
    await page.close();
  }

  // SS7: the shard. With no birth record /shard is the first run: the burst (skippable from the
  // first second), the arrival, how this works, the ask (the same birth form as the chart, the
  // place lookup answered by the fixture), the compute (a readout of the real values, typed),
  // the reveal (the ring with the natal marks, the name the game gives a shard, the two
  // station cards with the game's art, one strange line, one button, the account prompt with
  // its reason), then the document: eight sections under plain headers, each with its lead,
  // its corpus and "where this comes from" folded; the close, the recognition beat, the
  // invite. The record survives a reload; /shard/start replays the arrival for a returning
  // visitor (a short burst, the skip straight to the compute).
  {
    const { page, errors } = await loadPage(context, '/shard');
    const problems = [];
    await page.route(u => u.hostname === 'geocoding-api.open-meteo.com', r => r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ results: [{ name: 'New York', admin1: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' }] }),
    }));
    const step = async () => page.evaluate(() => { const el = document.querySelector('.firstrun'); return el ? [...el.classList].find(c => c.startsWith('step-')) : null; });
    if ((await step()) !== 'step-burst') problems.push(`a stranger landed on ${await step()}, wanted the burst`);
    const skipVisible = await page.evaluate(() => { const b = document.querySelector('.fr-skip'); return !!b && b.getClientRects().length > 0; });
    if (!skipVisible) problems.push('the burst has no visible skip');
    if (!(await page.locator('.shard-sky .shard-star').count())) problems.push('no stars in the burst sky');
    await page.click('.fr-skip');
    if ((await step()) !== 'step-how') problems.push(`skip went to ${await step()}, wanted how this works`);
    const how = await page.evaluate(() => ({ maps: document.querySelectorAll('.fr-maps li').length, ring: document.querySelectorAll('.fr-how .ring-seg').length, h1: document.querySelector('.fr-how h1')?.textContent || '' }));
    if (how.maps !== 4) problems.push(`${how.maps} sky-maps, wanted 4`);
    if (how.ring !== 28) problems.push(`${how.ring} ring segments on how this works, wanted 28`);
    await page.click('.fr-how .fr-foot .button');
    if ((await step()) !== 'step-ask') problems.push(`how this works went to ${await step()}, wanted the ask`);
    if (!(await page.locator('form.birth-form').count())) problems.push('no birth form on the ask');
    await page.fill('#b-date', '1985-03-15');
    await page.fill('#b-time', '06:30');
    await page.fill('#b-place', 'New York');
    await page.waitForSelector('.place-opt', { timeout: 5000 }).catch(() => problems.push('the place list did not open'));
    if (await page.locator('.place-opt').count()) await page.click('.place-opt');
    const t0 = Date.now();
    await page.click('form.birth-form button[type="submit"]');
    await page.waitForSelector('.fr-readout .fr-ro', { timeout: 10000 }).catch(() => problems.push('the readout did not start'));
    if ((await step()) !== 'step-compute') problems.push(`the ask went to ${await step()}, wanted the compute`);
    await page.waitForSelector('.fr-ro.is-found', { timeout: 15000 }).catch(() => problems.push('the readout never found the shard'));
    const readout = await page.evaluate(() => [...document.querySelectorAll('.fr-ro')].map(e => e.textContent.trim()));
    if (!readout.some(l => /sun .* pisces/.test(l))) problems.push(`the readout does not place the sun in pisces: ${readout.join(' | ')}`);
    if (!readout.some(l => /aries rising/.test(l))) problems.push('the readout does not say aries rising');
    await page.waitForSelector('.fr-reveal .fr-name', { timeout: 15000 }).catch(() => problems.push('no reveal after the compute'));
    const msReveal = Date.now() - t0;
    const reveal = await page.evaluate(() => ({
      name: document.querySelector('.fr-name')?.textContent.trim() || '',
      sub: document.querySelector('.fr-sub')?.textContent.trim() || '',
      cards: document.querySelectorAll('.shard-card').length,
      art: [...document.querySelectorAll('.shard-card-art')].map(s => s.querySelectorAll('path').length),
      marks: document.querySelectorAll('.fr-reveal .ring-mark').length,
      lit: document.querySelectorAll('.fr-reveal .ring-now').length,
      strange: document.querySelector('.fr-strange')?.textContent.trim() || '',
      keep: !!document.querySelector('.fr-keep a[href="/signup"]'),
      eyebrow: document.querySelector('.fr-eyebrow')?.textContent.trim() || '',
    }));
    if (!/ of the |, twice over$/.test(reveal.name)) problems.push(`the shard's name "${reveal.name}" is not the game's`);
    if (!/pisces sun · capricorn moon · aries rising/.test(reveal.sub)) problems.push(`the sub line "${reveal.sub}"`);
    if (reveal.cards !== 2) problems.push(`${reveal.cards} station cards, wanted 2`);
    if (reveal.art.some(n => n < 1)) problems.push('a station card has no art');
    if (reveal.marks !== 3) problems.push(`${reveal.marks} natal marks on the ring, wanted 3`);
    if (reveal.lit !== 1) problems.push(`${reveal.lit} lit stations on the reveal ring, wanted 1`);
    if (!reveal.strange) problems.push('no strange line');
    if (!reveal.keep) problems.push('no account prompt after the reveal');
    if (!/seven hundred eighty-four/.test(reveal.eyebrow)) problems.push(`the eyebrow "${reveal.eyebrow}"`);
    await page.click('.fr-reveal .fr-foot .button');
    await page.waitForSelector('article.shard-doc', { timeout: 10000 }).catch(() => problems.push('read your shard did not open the document'));
    const doc = await page.evaluate(() => {
      const main = document.querySelector('main');
      const text = main ? main.innerText : '';
      return {
        path: location.pathname,
        sections: [...document.querySelectorAll('.shard-sec')].filter(s => !s.classList.contains('shard-close')).length,
        labels: [...document.querySelectorAll('.shard-h')].map(h => h.textContent.trim()),
        leads: document.querySelectorAll('.shard-plain').length,
        bodies: document.querySelectorAll('.shard-body p').length,
        depths: document.querySelectorAll('details.shard-depth').length,
        rare: !!document.querySelector('.shard-rare'),
        recognition: document.querySelectorAll('.shard-recognition p').length,
        invite: !!document.querySelector('.shard-invite a[href="/tonight"]'),
        keep: !!document.querySelector('.shard-invite a[href="/signup"]'),
        emDash: (text.match(/—/g) || []).length,
        mansion: (text.match(/\bmansions?\b/gi) || []).length,
        words: text.split(/\s+/).filter(Boolean).length,
        title: document.querySelector('.shard-title')?.textContent.trim() || '',
        marks: document.querySelectorAll('.shard-ring .ring-mark').length,
      };
    });
    if (doc.path !== '/shard') problems.push(`the document is at ${doc.path}`);
    if (doc.sections !== 8) problems.push(`${doc.sections} sections, wanted 8`);
    const wanted = ['your sun is in pisces', 'your moon is in capricorn', 'you were born under a last quarter moon', 'you arrived on a friday', 'aries was rising', 'the sky opposite you', 'how you walk', "what you're turning into"];
    for (const l of wanted) if (!doc.labels.includes(l)) problems.push(`no section headed "${l}" (headers: ${doc.labels.join(' / ')})`);
    if (doc.leads !== 8) problems.push(`${doc.leads} plain-fact leads, wanted 8`);
    if (doc.bodies < 10) problems.push(`${doc.bodies} corpus paragraphs, wanted at least 10`);
    if (doc.depths !== 5) problems.push(`${doc.depths} "where this comes from" folds, wanted 5 (sun, moon, rising, opposite, becoming)`);
    if (doc.recognition !== 3) problems.push(`${doc.recognition} recognition lines, wanted 3`);
    if (!doc.invite) problems.push('no door to tonight');
    if (!doc.keep) problems.push('no account door on the document');
    if (doc.emDash) problems.push(`${doc.emDash} em dashes reached the page`);
    if (doc.mansion) problems.push(`"mansion" reached the page ${doc.mansion} times`);
    if (doc.words < 900) problems.push(`${doc.words} words on the document, wanted a long-form reading`);
    if (doc.title !== reveal.name) problems.push(`the document is titled "${doc.title}", the reveal said "${reveal.name}"`);
    if (doc.marks !== 3) problems.push(`${doc.marks} natal marks on the document ring, wanted 3`);
    // the first fold opens on its four skies
    await page.click('details.shard-depth summary');
    const fold = await page.evaluate(() => { const d = document.querySelector('details.shard-depth'); return d && d.open ? d.querySelectorAll('.shard-sky-row').length : 0; });
    if (fold < 4) problems.push(`the opened fold shows ${fold} rows, wanted the four skies at least`);
    if (DUMP && !w.mobile) await writeFile(join(DUMP, 'shard-document.html'), await page.content());
    // the record survives a reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('article.shard-doc', { timeout: 10000 }).catch(() => problems.push('the document did not survive a reload'));
    // the arrival again: a returning visitor's short burst, the skip straight to the compute
    await page.goto(base + '/shard/start', { waitUntil: 'networkidle' });
    await page.waitForSelector('.firstrun', { timeout: 10000 }).catch(() => problems.push('/shard/start did not open the first run'));
    if ((await step()) !== 'step-burst') problems.push(`/shard/start opened on ${await step()}`);
    await page.click('.fr-skip');
    const after = await step();
    if (after !== 'step-compute' && after !== 'step-reveal') problems.push(`a returning visitor's skip went to ${after}, wanted the compute`);
    await page.waitForSelector('.fr-reveal .fr-name', { timeout: 15000 }).catch(() => problems.push('no reveal on the replay'));
    await page.click('.fr-reveal .fr-foot .button');
    await page.waitForSelector('article.shard-doc', { timeout: 10000 }).catch(() => problems.push('the replay did not return to the document'));
    if (!(await page.evaluate(() => location.pathname === '/shard'))) problems.push('the replay did not end at /shard');
    await page.evaluate(() => { try { localStorage.removeItem('starshard-birth'); localStorage.removeItem('starshard-burst-seen'); } catch (e) {} });
    for (const e of errors) problems.push(`console: ${e}`);
    if (problems.length) { console.log(`  ss7 /shard             FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  ss7 /shard             ok   burst, skip, how this works, the ask, the compute, the reveal in ${msReveal} ms ("${reveal.name}", 2 cards, 3 marks), the document: 8 sections, ${doc.bodies} paragraphs, ${doc.depths} folds, ${doc.words} words, no em dash, no "mansion"; reload kept it; the arrival replayed`);
    await page.close();
  }

  // SS8: the stranger's path, against the local API. The build is served at starshard.test
  // and the API at api.starshard.test, both by Playwright routes (the API route keeps the
  // session cookie the way a browser would, one jar per stranger). Land, cast the chart, read
  // the shard, sign up (the age check first: a child's date opens no field, an adult's opens
  // the rest, the chart on the device goes with the account), sign out, ask for a reset,
  // follow the link the mail would carry, set the password, sign out, sign in with it,
  // confirm the email from its link, take a copy of the data, delete the account.
  if (!apiSrv) { fail('ss8: the local API did not boot, the stranger\'s path did not run'); }
  else {
    const problems = [];
    const sctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, isMobile: w.mobile, hasTouch: w.mobile, deviceScaleFactor: w.mobile ? 3 : 1, acceptDownloads: true });
    const jar = new Map();
    const ip = `10.8.${w.mobile ? 1 : 2}.${Math.floor(Math.random() * 250) + 1}`;
    await wireOrigin(sctx, jar, ip);
    const page = await sctx.newPage();
    const errors = [];
    // the API answers a signed-out /api/me with 401, a wrong password with 401, a spent link
    // with 400: the browser logs each 4xx as a console error, and those are the answers the
    // path is testing for, so they are counted, not failed. Chromium also reports a fulfilled
    // 204 (logout, forgot, reset, verify, delete) as a request failure (net::ERR_ABORTED); the
    // page's own state after each is what the assertions check.
    let answered = 0;
    page.on('console', msg => { if (msg.type() !== 'error') return; const loc = msg.location()?.url || ''; const text = msg.text(); if (OFFLINE && FONT_HOSTS.some(h => loc.includes(h) || text.includes(h))) return; if (loc.includes(API_HOST) && /status of 4\d\d/.test(text)) { answered++; return; } errors.push(`${text}${loc ? ` (${loc})` : ''}`); });
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
    page.on('requestfailed', req => { const u = req.url(); if (OFFLINE && FONT_HOSTS.some(h => u.includes(h))) return; if (u.includes(API_HOST) && req.failure()?.errorText === 'net::ERR_ABORTED') { answered++; return; } errors.push(`request failed: ${u} (${req.failure()?.errorText})`); });
    const go = async (path, route) => { await page.goto(HOST + path, { waitUntil: 'networkidle' }); await page.waitForSelector(`main[data-route="${route}"]`, { timeout: 10000 }).catch(() => problems.push(`${path} did not render ${route}`)); };
    const chip = async () => page.evaluate(() => { const c = document.querySelector('.chip'); const spans = c ? c.querySelectorAll(':scope > span') : []; return spans.length ? spans[spans.length - 1].textContent.trim() : ''; });
    const h1 = async () => page.evaluate(() => document.querySelector('main h1')?.textContent.trim() || '');
    const here = async () => page.evaluate(() => location.pathname);
    const waitRoute = async (route, ms = 10000) => page.waitForSelector(`main[data-route="${route}"]`, { timeout: ms }).then(() => true).catch(() => false);
    const stranger = { email: `stranger-${w.name}-${Date.now()}@example.test`, name: `stranger${w.mobile ? 'p' : 'd'}${String(Date.now()).slice(-6)}`, pass: 'correct horse battery', pass2: 'battery staple horse' };
    const t0 = Date.now();

    // land: the sky before anything is asked, the chip signed out
    await go('/', 'home');
    await page.waitForSelector('.chip:not([aria-busy])', { timeout: 5000 }).catch(() => problems.push('the chip never settled'));
    if ((await chip()) !== 'sign in') problems.push(`a stranger's chip reads "${await chip()}", wanted "sign in"`);
    if (!(await page.locator('[data-what="product"]').count())) problems.push('no product sentence on landing');

    // the chart
    await go('/chart', 'chart');
    await page.fill('#b-date', '1985-03-15');
    await page.fill('#b-time', '06:30');
    await page.fill('#b-place', 'New York');
    await page.waitForSelector('.place-opt', { timeout: 5000 }).catch(() => problems.push('the place list did not open'));
    if (await page.locator('.place-opt').count()) await page.click('.place-opt');
    await page.click('form.birth-form button[type="submit"]');
    await page.waitForSelector('svg.wheel', { timeout: 10000 }).catch(() => problems.push('no wheel after casting'));
    if (!(await page.locator('a.button[href="/signup"]').count())) problems.push('the chart has no "keep this chart" door for a stranger');

    // the shard, then its door to the account
    await go('/shard', 'shard');
    await page.waitForSelector('article.shard-doc', { timeout: 15000 }).catch(() => problems.push('the shard document did not open from the device record'));
    // MZ3: one field after the first night. The stranger leaves an email under the reading,
    // the row lands (device id hashed, no account), the device takes it back, leaves it again;
    // later the signup links it, the export carries it, the delete removes it.
    const mz3 = { left: 0, linked: false, exported: false, gone: false };
    const field = page.locator('.leave-email #leave-email');
    if (!(await field.count())) problems.push('mz3: no email field under the shard for a stranger');
    else {
      await page.fill('#leave-email', 'not an address');
      await page.click('.leave-email-form button[type="submit"]');
      await page.waitForSelector('.leave-email-err', { timeout: 5000 }).catch(() => problems.push('mz3: a bad address was not refused on the page'));
      await page.fill('#leave-email', stranger.email);
      await page.click('.leave-email-form button[type="submit"]');
      await page.waitForSelector('.leave-email[data-left]', { timeout: 10000 }).catch(() => problems.push('mz3: the email was not taken'));
      const [eRows] = await apiSrv.pool.execute('SELECT device_hash, user_id, source FROM email_capture WHERE email = ?', [stranger.email]);
      if (eRows.length !== 1) problems.push(`mz3: ${eRows.length} email_capture rows after leaving one`);
      else {
        mz3.left++;
        if (eRows[0].user_id !== null) problems.push('mz3: the row is linked to an account before any exists');
        if (eRows[0].source !== 'shard') problems.push(`mz3: the row's source is ${eRows[0].source}`);
        const dev = await page.evaluate(() => { try { return localStorage.getItem('starshard-device'); } catch (e) { return null; } });
        if (!dev || !/^[a-f0-9]{32}$/.test(dev)) problems.push('mz3: the device made no id');
        else if (eRows[0].device_hash !== sha256(dev)) problems.push('mz3: the stored device hash is not the device id\'s sha256');
        if (eRows[0].device_hash === dev) problems.push('mz3: the device id is stored in the clear');
      }
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('.leave-email[data-left]', { timeout: 10000 }).catch(() => problems.push('mz3: a reload forgot the address was left'));
      await page.click('.leave-email .link-b');
      await page.waitForSelector('#leave-email', { timeout: 10000 }).catch(() => problems.push('mz3: taking it back did not reopen the field'));
      const [eGone] = await apiSrv.pool.execute('SELECT id FROM email_capture WHERE email = ?', [stranger.email]);
      if (eGone.length) problems.push('mz3: the row survived "take it back"');
      await page.fill('#leave-email', stranger.email.toUpperCase());
      await page.click('.leave-email-form button[type="submit"]');
      await page.waitForSelector('.leave-email[data-left]', { timeout: 10000 }).catch(() => problems.push('mz3: the email was not taken the second time'));
      const [eAgain] = await apiSrv.pool.execute('SELECT id FROM email_capture WHERE email = ?', [stranger.email]);
      if (eAgain.length === 1) mz3.left++; else problems.push('mz3: the second leaving did not land lower-cased');
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-mz3-left.png`), fullPage: true });
    }
    const door = page.locator('.shard-invite a[href="/signup"]');
    if (!(await door.count())) problems.push('the shard has no account door');
    else await door.click();
    if (!(await waitRoute('signup'))) problems.push('the shard\'s door did not reach /signup');

    // sign up: the age check first
    if (await page.locator('#su-email').count()) problems.push('an email field shows before the age check');
    const prefilled = await page.inputValue('#su-date').catch(() => '');
    if (prefilled !== '1985-03-15') problems.push(`the age check's date is "${prefilled}", wanted the chart's`);
    await page.fill('#su-date', '2020-05-05');
    await page.click('form.su-age button[type="submit"]');
    await page.waitForSelector('.su-young', { timeout: 10000 }).catch(() => problems.push('a child\'s date was not refused'));
    if (await page.locator('#su-email').count()) problems.push('a child\'s date opened the fields');
    if (await page.locator('.su-retry').count()) await page.click('.su-retry'); else problems.push('no way back from the refusal');
    await page.fill('#su-date', '1985-03-15');
    await page.click('form.su-age button[type="submit"]');
    await page.waitForSelector('form.su-fields', { timeout: 10000 }).catch(() => problems.push('an adult\'s date did not open the fields'));
    const birthLine = await page.evaluate(() => document.querySelector('.su-birth')?.textContent || '');
    if (!/15 march 1985, 06:30, new york/.test(birthLine)) problems.push(`the signup's birth line "${birthLine}"`);
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-ss8-signup-fields.png`), fullPage: true });
    await page.fill('#su-name', stranger.name);
    await page.fill('#su-email', stranger.email);
    await page.fill('#su-pass', stranger.pass);
    await page.click('form.su-fields button[type="submit"]');
    if (!(await waitRoute('account', 15000))) problems.push('the signup did not land on the account page');
    await page.waitForSelector('.acct-signout', { timeout: 10000 }).catch(() => problems.push('no signed-in account page after signup'));
    if ((await h1()) !== stranger.name) problems.push(`the account page is headed "${await h1()}", wanted the name`);
    if ((await chip()) !== stranger.name) problems.push(`the chip reads "${await chip()}" after signup`);
    if (!jar.has('starshard_session')) problems.push('no session cookie after signup');
    const [uRows] = await apiSrv.pool.execute('SELECT id, email, username, email_verified FROM users WHERE email = ?', [stranger.email]);
    const user = uRows[0];
    if (!user) problems.push('the signup wrote no users row');
    else {
      if (user.username !== stranger.name) problems.push(`the users row is named ${user.username}`);
      const [bRows] = await apiSrv.pool.execute('SELECT birth_date, birth_time, place_name, lat, tz FROM birth_data WHERE user_id = ?', [user.id]);
      const b = bRows[0];
      if (!b) problems.push('the signup wrote no birth_data row');
      else {
        if (b.birth_date !== '1985-03-15' || b.birth_time !== '06:30') problems.push(`birth_data holds ${b.birth_date} ${b.birth_time}`);
        if (!/new york/i.test(b.place_name || '')) problems.push(`birth_data place "${b.place_name}"`);
        if (b.tz !== 'America/New_York') problems.push(`birth_data tz "${b.tz}" (the birthplace zone, sent as birthTz)`);
        if (Math.abs(Number(b.lat) - 40.7128) > 0.001) problems.push(`birth_data lat ${b.lat}`);
      }
      const [pRows] = await apiSrv.pool.execute('SELECT user_id FROM manzil_pack WHERE user_id = ?', [user.id]);
      const [lRows] = await apiSrv.pool.execute('SELECT user_id FROM email_capture WHERE email = ?', [stranger.email]);
      if (lRows.length === 1 && lRows[0].user_id === user.id) mz3.linked = true; else problems.push(`mz3: the signup did not link the email row (${JSON.stringify(lRows)})`);
      if (pRows.length) problems.push('a Star Shard signup wrote a manzil_pack row');
    }
    if (DUMP && !w.mobile) await writeFile(join(DUMP, 'ss8-account.html'), await page.content());
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-ss8-account.png`), fullPage: true });
    const emailLine = await page.evaluate(() => document.querySelector('.acct-email')?.textContent || '');
    if (!emailLine.includes(stranger.email) || !/not yet confirmed/.test(emailLine)) problems.push(`the account's email line "${emailLine}"`);
    if (!/15 march 1985, 06:30, new york/.test(await page.evaluate(() => document.querySelector('.acct-birth')?.textContent || ''))) problems.push('the account page does not show the chart it keeps');

    // sign out
    await page.click('.acct-signout');
    if (!(await waitRoute('home'))) problems.push('sign out did not return home');
    await page.waitForFunction(() => /^sign in$/.test(document.querySelector('.chip > span:last-child')?.textContent.trim() || ''), null, { timeout: 5000 }).catch(() => problems.push('the chip is still signed in after sign out'));
    if (jar.has('starshard_session')) problems.push('the session cookie survived sign out');
    await go('/account', 'account');
    if (!(await page.locator('a.button[href="/signin"]').count())) problems.push('the signed-out account page has no sign-in door');

    // forgot: the ask, then the link the mail would carry
    await go('/reset', 'reset');
    if (!(await page.locator('form.rs-ask').count())) problems.push('/reset without a token is not the ask');
    await page.fill('#rs-email', stranger.email);
    await page.click('form.rs-ask button[type="submit"]');
    await page.waitForSelector('.rs-sent', { timeout: 10000 }).catch(() => problems.push('the reset ask did not answer'));
    if (!/check your mail/.test(await h1())) problems.push(`after the ask the page is headed "${await h1()}"`);
    const resetToken = randomBytes(32).toString('hex');
    if (user) await apiSrv.pool.execute('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [user.id, sha256(resetToken), new Date(Date.now() + 30 * 60 * 1000)]);
    await page.goto(HOST + '/#resetToken=' + resetToken, { waitUntil: 'networkidle' });
    if (!(await waitRoute('reset'))) problems.push('the mail\'s link (/#resetToken=) did not open the reset page');
    if ((await here()) !== '/reset') problems.push(`the mail's link landed on ${await here()}`);
    await page.waitForSelector('#rs-pass', { timeout: 5000 }).catch(() => problems.push('no new-password form from the link'));
    await page.fill('#rs-pass', stranger.pass2);
    await page.fill('#rs-again', 'something else');
    await page.click('form.rs-new button[type="submit"]');
    if (!(await page.locator('.form-err').count())) problems.push('two different passwords were accepted');
    await page.fill('#rs-again', stranger.pass2);
    await page.click('form.rs-new button[type="submit"]');
    if (!(await waitRoute('account', 15000))) problems.push('a reset did not land on the account page');
    await page.waitForSelector('.acct-signout', { timeout: 10000 }).catch(() => problems.push('no signed-in account page after the reset'));
    if ((await chip()) !== stranger.name) problems.push(`the chip reads "${await chip()}" after the reset`);
    if (await page.evaluate(() => location.hash)) problems.push('the reset token stayed in the address bar');
    // a spent link
    await page.goto(HOST + '/#resetToken=' + resetToken, { waitUntil: 'networkidle' });
    await page.waitForSelector('#rs-pass', { timeout: 5000 }).catch(() => {});
    await page.fill('#rs-pass', stranger.pass2);
    await page.fill('#rs-again', stranger.pass2);
    await page.click('form.rs-new button[type="submit"]');
    await page.waitForSelector('.form-err', { timeout: 10000 }).catch(() => problems.push('a spent reset link was not refused'));
    if (!/expired/.test(await page.evaluate(() => document.querySelector('.form-err')?.textContent || ''))) problems.push('the spent link\'s refusal does not say the link expired');
    await go('/account', 'account');
    await page.waitForSelector('.acct-signout', { timeout: 10000 }).catch(() => problems.push('no account page before the second sign out'));
    await page.click('.acct-signout');
    if (!(await waitRoute('home'))) problems.push('the second sign out did not return home');

    // sign in with the new password (the old one refused)
    await go('/signin', 'signin');
    await page.fill('#si-who', stranger.email);
    await page.fill('#si-pass', stranger.pass);
    await page.click('form button[type="submit"]');
    await page.waitForSelector('.form-err', { timeout: 10000 }).catch(() => problems.push('the old password was not refused after the reset'));
    await page.fill('#si-pass', stranger.pass2);
    await page.click('form button[type="submit"]');
    if (!(await waitRoute('account', 15000))) problems.push('sign in did not land on the account page');
    await page.waitForSelector('.acct-signout', { timeout: 10000 }).catch(() => problems.push('no signed-in account page after sign in'));
    if ((await chip()) !== stranger.name) problems.push(`the chip reads "${await chip()}" after sign in`);
    if (!(await page.locator('.acct-verify').count())) problems.push('an unconfirmed account has no "send the confirmation again"');

    // confirm the email from its link, a bad link refused
    const verifyToken = randomBytes(32).toString('hex');
    if (user) await apiSrv.pool.execute('INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [user.id, sha256(verifyToken), new Date(Date.now() + 24 * 60 * 60 * 1000)]);
    await page.goto(HOST + '/#verifyEmail=' + verifyToken, { waitUntil: 'networkidle' });
    if (!(await waitRoute('verify'))) problems.push('the mail\'s link (/#verifyEmail=) did not open the verify page');
    await page.waitForFunction(() => /email confirmed/.test(document.querySelector('main h1')?.textContent || ''), null, { timeout: 10000 }).catch(() => problems.push(`the verify landing is headed "${''}"`));
    if (user) {
      const [vRows] = await apiSrv.pool.execute('SELECT email_verified FROM users WHERE id = ?', [user.id]);
      if (!vRows[0] || !vRows[0].email_verified) problems.push('the verify link did not mark the address confirmed');
    }
    await page.goto(HOST + '/#verifyEmail=' + 'deadbeef'.repeat(8), { waitUntil: 'networkidle' });
    await page.waitForFunction(() => /that link has expired/.test(document.querySelector('main h1')?.textContent || ''), null, { timeout: 10000 }).catch(() => problems.push('a bad verify link was not refused'));
    await go('/account', 'account');
    await page.waitForSelector('.acct-signout', { timeout: 10000 }).catch(() => problems.push('no account page after the confirmation'));
    if (await page.locator('.acct-verify').count()) problems.push('a confirmed account still offers the confirmation');
    if (/not yet confirmed/.test(await page.evaluate(() => document.querySelector('.acct-email')?.textContent || ''))) problems.push('the email line still says not yet confirmed');

    // a copy of the data
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      page.click('.acct-export'),
    ]);
    if (!download) problems.push('the export produced no download');
    else {
      if (download.suggestedFilename() !== 'star-shard-data.json') problems.push(`the export is named ${download.suggestedFilename()}`);
      const file = await download.path();
      let data = null;
      try { data = JSON.parse(await readFile(file, 'utf8')); } catch (e) { problems.push('the export is not JSON'); }
      if (data) {
        if (data.email !== stranger.email) problems.push(`the export's email is ${data.email}`);
        if (!data.birth || data.birth.birthDate !== '1985-03-15' || data.birth.birthTime !== '06:30') problems.push(`the export's birth record: ${JSON.stringify(data.birth)}`);
        if (data.emailVerified !== true) problems.push('the export does not show the address confirmed');
        if ('passwordHash' in data || 'password_hash' in data) problems.push('the export carries a password hash');
        if (data.emailLeft && data.emailLeft.email === stranger.email && data.emailLeft.source === 'shard' && data.emailLeft.leftAt) mz3.exported = true;
        else problems.push(`mz3: the export does not carry the email left (${JSON.stringify(data.emailLeft)})`);
      }
    }
    await page.waitForSelector('.acct-status', { timeout: 5000 }).catch(() => problems.push('the export left no line on the page'));

    // delete
    await page.click('details.acct-fold summary');
    await page.fill('#del-pass', 'not the password');
    await page.click('.acct-delete');
    await page.waitForSelector('.acct-fold .form-err', { timeout: 10000 }).catch(() => problems.push('a wrong password did not refuse the delete'));
    await page.fill('#del-pass', stranger.pass2);
    await page.click('.acct-delete');
    await page.waitForFunction(() => /your account is gone/.test(document.querySelector('main h1')?.textContent || ''), null, { timeout: 15000 }).catch(() => problems.push('the delete did not end on "your account is gone"'));
    await page.waitForFunction(() => /^sign in$/.test(document.querySelector('.chip > span:last-child')?.textContent.trim() || ''), null, { timeout: 5000 }).catch(() => problems.push('the chip is still signed in after the delete'));
    if (jar.has('starshard_session')) problems.push('the session cookie survived the delete');
    if (user) {
      const [gone] = await apiSrv.pool.execute('SELECT id FROM users WHERE id = ?', [user.id]);
      if (gone.length) problems.push('the users row survived the delete');
      const [bGone] = await apiSrv.pool.execute('SELECT user_id FROM birth_data WHERE user_id = ?', [user.id]);
      if (bGone.length) problems.push('the birth_data row survived the delete (no cascade)');
      const [rGone] = await apiSrv.pool.execute('SELECT id FROM password_resets WHERE user_id = ?', [user.id]);
      if (rGone.length) problems.push('the password_resets rows survived the delete');
      const [lGone] = await apiSrv.pool.execute('SELECT id FROM email_capture WHERE user_id = ? OR email = ?', [user.id, stranger.email]);
      if (lGone.length) problems.push('the email_capture row survived the delete'); else mz3.gone = true;
    }
    if (await page.evaluate(() => { try { return localStorage.getItem('starshard-birth'); } catch (e) { return null; } })) problems.push('the birth record stayed on the device after the delete');
    const ms = Date.now() - t0;
    if (DUMP && !w.mobile) {
      // the signed-out forms, for the lint
      await go('/signup', 'signup'); await writeFile(join(DUMP, 'ss8-signup-age.html'), await page.content());
      await page.fill('#su-date', '1985-03-15'); await page.click('form.su-age button[type="submit"]'); await page.waitForSelector('form.su-fields', { timeout: 10000 }).catch(() => {}); await writeFile(join(DUMP, 'ss8-signup-fields.html'), await page.content());
      await go('/reset', 'reset'); await writeFile(join(DUMP, 'ss8-reset-ask.html'), await page.content());
      await page.goto(HOST + '/#resetToken=' + 'ab'.repeat(32), { waitUntil: 'networkidle' }); await page.waitForSelector('#rs-pass', { timeout: 5000 }).catch(() => {}); await writeFile(join(DUMP, 'ss8-reset-new.html'), await page.content());
    }
    if (SHOTS) {
      await go('/signin', 'signin'); await page.screenshot({ path: join(SHOTS, `${w.name}-ss8-signin.png`), fullPage: true });
      await go('/signup', 'signup'); await page.screenshot({ path: join(SHOTS, `${w.name}-ss8-signup-age.png`), fullPage: true });
      await go('/reset', 'reset'); await page.screenshot({ path: join(SHOTS, `${w.name}-ss8-reset.png`), fullPage: true });
    }
    for (const e of errors) problems.push(`console: ${e}`);
    if (problems.length) { console.log(`  ss8 stranger           FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  ss8 stranger           ok   land, chart, shard, sign up (a child's date refused, an adult's opened the fields, the chart kept), sign out, reset asked and the mail's link followed, the old password refused, sign in, email confirmed from its link, export (star-shard-data.json), delete (rows cascaded, cookie and device cleared) in ${ms} ms; ${answered} refusals answered by the API as expected
  mz3 email left         ok   under the shard, signed out: a bad address refused on the page, the address taken (row with the device id hashed, no account), kept across a reload, taken back from the same device (row gone), left again upper-cased and stored lower; the signup linked it, the export carried it (emailLeft), the delete removed it: left ${mz3.left}x, linked ${mz3.linked}, exported ${mz3.exported}, gone ${mz3.gone}`);
    await page.close();
    await sctx.close();
  }

  // SS9b: the play route. A signed-in visitor walks from home into the game and back. The
  // account is made through the same api.js the game loads (served at /play/api.js), with a
  // birth record the way the shell's signup writes one; home shows the chip signed in and keeps
  // /api/tonight for the game; the nav's "play" (the tab, on a phone) is a full navigation to
  // /play/, the game's own page with no shell chrome; the runtime, React and Babel load from this
  // origin; in portrait the phone is told to turn; the lobby opens signed in (the same cookie,
  // the chart restored from the account); the bridge answered from the API's sky, the same
  // station the shell showed; the moon road to a board (nine slots, a hand); the pause menu,
  // leave the road, the lobby; the game's door to the shell (the moon mark, the shard app, "your
  // star shard"); home again, still signed in. Then the account is deleted.
  //
  // The game is the dc-runtime's: its screens are divs with onClick, its hints fade in with
  // pointer-events off, and a whole screen is often the button ("click to sit down"), so taps
  // land at the centre of the element that carries the words, or at the centre of the stage.
  if (!apiSrv) { fail('ss9b: the local API did not boot, the play route did not run'); }
  else {
    const problems = [];
    const sctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, isMobile: w.mobile, hasTouch: w.mobile, deviceScaleFactor: w.mobile ? 3 : 1 });
    const jar = new Map();
    const ip = `10.9.${w.mobile ? 1 : 2}.${Math.floor(Math.random() * 250) + 1}`;
    await wireOrigin(sctx, jar, ip);
    const page = await sctx.newPage();
    const errors = [];
    let answered = 0;
    let templateNoise = 0;
    // the browser parses the raw <x-dc> template before the runtime boots and used to log every
    // "{{ x }}" it found in an SVG attribute (viewBox, cx, d) as an error, 28 per boot. MZ5: the
    // build writes those attributes in the runtime's sc-camel- form, so the count must be zero;
    // it is still counted apart so a miss names itself. Everything else fails too.
    const TEMPLATE_NOISE = /Expected (number|length|moveto path command).*\{\{/;
    page.on('console', msg => { if (msg.type() !== 'error') return; const loc = msg.location()?.url || ''; const text = msg.text(); if (OFFLINE && FONT_HOSTS.some(h => loc.includes(h) || text.includes(h))) return; if (loc.includes(API_HOST) && /status of 4\d\d/.test(text)) { answered++; return; } if (loc.includes('/play/') && TEMPLATE_NOISE.test(text)) { templateNoise++; return; } errors.push(`${text}${loc ? ` (${loc})` : ''}`); });
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
    page.on('requestfailed', req => { const u = req.url(); if (OFFLINE && FONT_HOSTS.some(h => u.includes(h))) return; if (u.includes(API_HOST) && req.failure()?.errorText === 'net::ERR_ABORTED') { answered++; return; } errors.push(`request failed: ${u} (${req.failure()?.errorText})`); });
    const text = async () => page.evaluate(() => document.body.innerText || '');
    const has = async re => re.test(await text());
    const waitText = async (re, ms, what) => page.waitForFunction(r => new RegExp(r.source, r.flags).test(document.body.innerText || ''), re, { timeout: ms }).then(() => true).catch(() => { problems.push(what); return false; });
    // the centre of the smallest element whose text matches, or null
    const centerOf = async re => page.evaluate(src => { const re = new RegExp(src, 'i'); const els = [...document.querySelectorAll('body *')].filter(e => re.test(e.textContent || '') && ![...e.children].some(c => re.test(c.textContent || ''))); const e = els[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, re.source);
    const tap = async (re, what) => { const c = await centerOf(re); if (!c) { problems.push(`could not find "${what}" to tap`); return false; } await page.mouse.click(c.x, c.y); return true; };
    const tapStage = async () => { const v = page.viewportSize(); await page.mouse.click(Math.round(v.width / 2), Math.round(v.height / 2)); };
    const dismissNote = async () => { for (let i = 0; i < 4 && await has(/touch the night|NIGHT \d+ OF 28/i); i++) { await tapStage(); await page.waitForTimeout(700); } };
    const chip = async () => page.evaluate(() => { const c = document.querySelector('.chip'); const spans = c ? c.querySelectorAll(':scope > span') : []; return spans.length ? spans[spans.length - 1].textContent.trim() : ''; });
    const user = { email: `walker-${w.name}-${Date.now()}@example.test`, name: `walker${w.mobile ? 'p' : 'd'}${String(Date.now()).slice(-6)}`, pass: 'correct horse battery' };
    const t0 = Date.now();

    // the account, through the game's own api.js, with the birth record the shell's signup writes
    await page.goto(HOST + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('main[data-route="home"]', { timeout: 10000 }).catch(() => problems.push('home did not render'));
    const who = await page.evaluate(async u => {
      const api = await import('/play/api.js');
      await api.signup(u.email, u.pass, { username: u.name, birthDate: '1985-03-15', birthTime: '06:30', birthTimeKnown: true, placeName: 'New York', lat: 40.7128, lon: -74.006, birthTz: 'America/New_York' });
      return api.me();
    }, user).catch(e => ({ error: e.message }));
    if (!who || who.username !== user.name) problems.push(`the signup through api.js did not sign the visitor in (${JSON.stringify(who)})`);

    // home, signed in: the chip, and the sky kept for the game
    await page.goto(HOST + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.chip:not([aria-busy])', { timeout: 5000 }).catch(() => problems.push('the chip never settled'));
    if ((await chip()) !== user.name) problems.push(`the chip reads "${await chip()}", wanted "${user.name}"`);
    const kept = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('starshard-tonight')); } catch (e) { return null; } });
    if (!kept || !kept.moon || !kept.night) problems.push('home did not keep /api/tonight for the game (starshard-tonight)');
    const shellStation = await page.evaluate(() => (document.querySelector('main h1')?.textContent || '').trim());

    // the door: a full navigation to the game's own page
    const door = w.mobile ? 'nav.tabs a[href="/play/"]' : 'nav.nav a[href="/play/"]';
    if (!(await page.locator(door).count())) problems.push(`no play door at ${door}`);
    const nav = page.waitForURL(HOST + '/play/', { timeout: 10000, waitUntil: 'domcontentloaded' }).then(() => true).catch(() => false);
    await page.locator(door).first().click().catch(e => problems.push(`the play door: ${e.message.split('\n')[0]}`));
    if (!(await nav)) problems.push('the play door did not navigate to /play/');
    await page.waitForLoadState('load').catch(() => {});
    const chrome = await page.evaluate(() => ({ shell: !!document.querySelector('header.header, nav.tabs, main[data-route]'), base: document.querySelector('base')?.getAttribute('href'), title: document.title, bridge: !!(window.ManzilEphem && window.ManzilEphem.__bridged), source: window.ManzilEphem?.source, moon: window.ManzilEphem?.mansionOf ? window.ManzilEphem.mansionOf('moon') : null, night: window.ManzilEphem?.night }));
    if (chrome.shell) problems.push('shell chrome over the stage');
    if (chrome.base !== '/play/') problems.push(`base href "${chrome.base}"`);
    if (chrome.title !== 'play · star shard') problems.push(`title "${chrome.title}"`);
    if (!chrome.bridge) problems.push('tonight-bridge.js did not patch ManzilEphem');
    if (chrome.source !== 'api') problems.push(`the game's sky came from "${chrome.source}", wanted the API's`);
    if (kept && kept.moon && chrome.moon !== kept.moon.station) problems.push(`the game's moon stands in station ${chrome.moon}, the API said ${kept.moon.station}`);

    // the runtime boots from this origin: in portrait the phone is told to turn
    if (w.mobile) {
      await waitText(/turn your phone sideways/i, 45000, 'portrait: no rotate prompt');
      await page.setViewportSize({ width: w.height, height: w.width });
    }
    // the lobby, signed in: the night's note may sit in front and takes the first touch
    await waitText(/the moon road|touch the night|NIGHT \d+ OF 28/i, 45000, 'the lobby did not open within 45 s');
    await dismissNote();
    await waitText(/the moon road/i, 10000, 'no "the moon road" in the lobby');
    const lobby = await page.evaluate(() => ({ user: (() => { try { return localStorage.getItem('manzil-v2-user'); } catch (e) { return null; } })(), mark: !!document.querySelector('[data-mzmark="1"]') }));
    if (lobby.user !== user.name) problems.push(`the game did not see the session (manzil-v2-user "${lobby.user}")`);
    if (!lobby.mark) problems.push('the lobby has no moon mark (the door to the shard app)');
    const tLobby = Date.now() - t0;

    // the moon road to a board
    await tap(/the moon road/, 'the moon road'); await page.waitForTimeout(800);
    await waitText(/the night is open/i, 10000, 'no mode screen');
    await tap(/the moon road ›/, 'the moon road ›'); await page.waitForTimeout(900);
    await waitText(/click to sit down/i, 15000, 'no walker intro');
    await tapStage(); await page.waitForTimeout(900);
    await waitText(/play these seven/i, 15000, 'no mulligan');
    await tap(/play these seven/, 'play these seven');
    await page.waitForFunction(() => document.querySelectorAll('[data-mzhand]').length > 0, null, { timeout: 15000 }).catch(() => problems.push('no hand on the board'));
    const board = await page.evaluate(() => ({ slots: document.querySelectorAll('[data-mzslot]').length, hand: document.querySelectorAll('[data-mzhand]').length, walker: (document.body.innerText.match(/^(.+?) stands on the road$/m) || [])[1] || null }));
    if (board.slots < 9) problems.push(`${board.slots} board slots`);
    if (board.hand < 1) problems.push('no hand');
    const tBoard = Date.now() - t0;
    // MZ5: on the board the swept geometry attributes are real (the runtime set viewBox, cx, d from
    // their sc-camel- form after hydration), none of that form is left in the live DOM, and the
    // retired __mzRetry/__mzHeal reload hack is not defined
    const mz5 = await page.evaluate(() => {
      const num = /^-?[\d.]+( -?[\d.]+){3}$/;
      const svgs = [...document.querySelectorAll('svg[viewBox]')];
      const bad = svgs.filter(e => !num.test(e.getAttribute('viewBox') || ''));
      const camel = [...document.querySelectorAll('*')].filter(e => [...e.attributes].some(a => a.name.startsWith('sc-camel-'))).length;
      const mustache = [...document.querySelectorAll('svg, circle, path, text, rect, line')].filter(e => ['viewBox', 'cx', 'cy', 'r', 'd', 'x', 'y'].some(a => /\{\{/.test(e.getAttribute(a) || ''))).length;
      const cx = [...document.querySelectorAll('circle[cx]')].filter(e => /^-?[\d.]+$/.test(e.getAttribute('cx'))).length;
      return { svgs: svgs.length, bad: bad.map(e => e.getAttribute('viewBox')).slice(0, 3), camel, mustache, cx, hack: typeof window.__mzRetry !== 'undefined' || typeof window.__mzHeal !== 'undefined' };
    });
    if (mz5.svgs < 10) problems.push(`mz5: only ${mz5.svgs} svgs carry a viewBox on the board`);
    if (mz5.bad.length) problems.push(`mz5: a viewBox is not numeric after hydration (${mz5.bad.join(' | ')})`);
    if (mz5.camel) problems.push(`mz5: ${mz5.camel} element(s) still carry an sc-camel- attribute in the live DOM`);
    if (mz5.mustache) problems.push(`mz5: ${mz5.mustache} geometry attribute(s) still hold a mustache in the live DOM`);
    if (mz5.hack) problems.push('mz5: window.__mzRetry/__mzHeal is defined; the reload hack is still in the shipped page');

    // and back: the pause menu, leave the road, the lobby
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    await waitText(/PAUSED/, 5000, 'no pause menu');
    // MZ4: the pause overlay carries the account's doors: privacy, terms, a copy of your data,
    // delete the account; each to its page or its section of the account page, in a new tab so
    // the board holds; every one inside the viewport
    const mz4 = { pause: [], menu: null, account: false, fold: false, cleared: null };
    const v0 = page.viewportSize();
    mz4.pause = await page.evaluate(() => [...document.querySelectorAll('a[data-mzdoor]')].map(a => { const r = a.getBoundingClientRect(); return { door: a.dataset.mzdoor, href: a.getAttribute('href'), target: a.getAttribute('target'), text: a.textContent.trim(), x: r.x, y: r.y, w: r.width, h: r.height }; }).filter(d => d.w > 0 && d.h > 0));
    const wantPause = { privacy: ['/privacy/', 'privacy'], terms: ['/terms/', 'terms'], data: ['/account#acct-data-h', 'a copy of your data'], delete: ['/account#acct-del-h', 'delete the account'] };
    for (const [door, [href, label]] of Object.entries(wantPause)) {
      const d = mz4.pause.find(x => x.door === door);
      if (!d) { problems.push(`mz4: the pause menu has no "${label}" door`); continue; }
      if (d.href !== href) problems.push(`mz4: "${label}" points at ${d.href}`);
      if (d.text !== label) problems.push(`mz4: the ${door} door reads "${d.text}"`);
      if (d.target !== '_blank') problems.push(`mz4: "${label}" would leave the board (target ${d.target})`);
      if (d.x < 0 || d.y < 0 || d.x + d.w > v0.width || d.y + d.h > v0.height) problems.push(`mz4: "${label}" sits outside the viewport (${Math.round(d.x)},${Math.round(d.y)} ${Math.round(d.w)}x${Math.round(d.h)} in ${v0.width}x${v0.height})`);
    }
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-mz4-pause.png`) });
    await tap(/leave the road/, 'leave the road'); await page.waitForTimeout(600);
    await waitText(/forfeit the climb/i, 5000, 'no leave confirmation');
    await tap(/forfeit the climb/, 'forfeit the climb'); await page.waitForTimeout(1200);
    await waitText(/the moon road/i, 10000, 'did not return to the lobby');
    await dismissNote();
    // MZ4: the player-chip menu (Escape in the lobby opens it, as the chip does) has an "account"
    // item beside "log out"; it is a plain link to the shell's account page, signed in
    await page.keyboard.press('Escape'); await page.waitForTimeout(700);
    mz4.menu = await page.evaluate(() => { const a = document.querySelector('a[data-mzdoor="account"]'); if (!a) return null; const r = a.getBoundingClientRect(); const out = (a.parentElement && [...a.parentElement.children].map(e => (e.textContent || '').trim()).filter(Boolean)) || []; return { href: a.getAttribute('href'), target: a.getAttribute('target'), text: a.textContent.trim(), w: r.width, h: r.height, x: r.x + r.width / 2, y: r.y + r.height / 2, row: out }; });
    if (!mz4.menu) problems.push('mz4: the player menu has no account item');
    else {
      if (mz4.menu.href !== '/account') problems.push(`mz4: the account item points at ${mz4.menu.href}`);
      if (mz4.menu.text !== 'account') problems.push(`mz4: the account item reads "${mz4.menu.text}"`);
      if (mz4.menu.target) problems.push('mz4: the account item opens a new tab from the lobby');
      if (!w.mobile && (mz4.menu.w < 44 || mz4.menu.h < 44)) problems.push(`mz4: the account item is ${Math.round(mz4.menu.w)}x${Math.round(mz4.menu.h)} px`);
      if (!mz4.menu.row.includes('log out')) problems.push(`mz4: the account item is not beside log out (${mz4.menu.row.join(' · ')})`);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-mz4-menu.png`) });
      const toAccount = page.waitForURL(HOST + '/account', { timeout: 10000, waitUntil: 'domcontentloaded' }).then(() => true).catch(() => false);
      await page.mouse.click(mz4.menu.x, mz4.menu.y);
      if (!(await toAccount)) problems.push('mz4: the account item did not open /account');
      else {
        await page.waitForSelector('main[data-route="account"]', { timeout: 10000 }).catch(() => problems.push('mz4: the account page did not render from the game'));
        await page.waitForSelector('.chip:not([aria-busy])', { timeout: 5000 }).catch(() => {});
        if ((await chip()) !== user.name) problems.push(`mz4: on the account page the chip reads "${await chip()}"`);
        else mz4.account = true;
      }
      // back into the game for the moon mark's door
      await page.goto(HOST + '/play/', { waitUntil: 'load' });
      await waitText(/the moon road|touch the night|NIGHT \d+ OF 28/i, 45000, 'mz4: the lobby did not open again');
      await dismissNote();
      await waitText(/the moon road/i, 10000, 'mz4: no "the moon road" after the account page');
    }
    // the game's door to the shell: the moon mark ("the moon · your star shard"), the shard app, the link
    const mark = await page.evaluate(() => { const e = document.querySelector('[data-mzmark="1"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    if (mark) await page.mouse.click(mark.x, mark.y); else problems.push('no moon mark to tap');
    await page.waitForTimeout(900);
    await waitText(/the shard app ›/i, 10000, 'the record panel did not open from the moon mark');
    await tap(/the shard app ›/, 'the shard app ›'); await page.waitForTimeout(900);
    await waitText(/STAR SHARD · THE APP/, 10000, 'the shard-app screen did not open');
    const doorBack = await page.evaluate(() => { const a = document.querySelector('a[data-mzdoor="shell"]'); if (!a) return null; const r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), text: a.textContent.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, stale: /under construction|sign-up will live|bought once/i.test(document.body.innerText) }; });
    if (!doorBack) problems.push('the shard-app screen has no door to the shell');
    else {
      if (doorBack.href !== '/') problems.push(`the door points at "${doorBack.href}"`);
      if (doorBack.text !== 'your star shard ›') problems.push(`the door reads "${doorBack.text}"`);
      if (doorBack.stale) problems.push('the shard-app screen still says under construction, or sells');
      // the game draws a 932x430 stage and scales it to the window, so on a phone held sideways
      // every control is smaller than drawn (MZ8, the phone pass, owns that); the floor holds at desktop
      if (!w.mobile && (doorBack.w < 44 || doorBack.h < 44)) problems.push(`the door is ${Math.round(doorBack.w)}x${Math.round(doorBack.h)} px`);
    }
    const home = page.waitForURL(HOST + '/', { timeout: 10000, waitUntil: 'domcontentloaded' }).then(() => true).catch(() => false);
    if (doorBack) await page.mouse.click(doorBack.x, doorBack.y);
    if (!(await home)) problems.push('the door did not return to the shell');
    if (w.mobile) await page.setViewportSize({ width: w.width, height: w.height });
    await page.waitForSelector('main[data-route="home"]', { timeout: 10000 }).catch(() => problems.push('home did not render on return'));
    await page.waitForSelector('.chip:not([aria-busy])', { timeout: 5000 }).catch(() => {});
    if ((await chip()) !== user.name) problems.push(`back home the chip reads "${await chip()}", the session was lost`);
    const ms = Date.now() - t0;

    // MZ4: the account is deleted the way the pause menu's "delete the account" does it: the
    // link lands on the account page's delete section, open and in view; the password, the
    // button; then nothing of the game stays on the device (manzil-* keys gone with the account)
    const before = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('manzil-')).length);
    if (!before) problems.push('mz4: the game kept nothing under manzil-* on this device, so the sweep has nothing to prove');
    await page.goto(HOST + '/account#acct-del-h', { waitUntil: 'load' });
    await page.waitForSelector('#del-pass', { timeout: 10000 }).catch(() => problems.push('mz4: #acct-del-h did not open the delete fold'));
    const fold = await page.evaluate(() => { const d = document.querySelector('details.acct-fold'); const h = document.getElementById('acct-del-h'); const r = h ? h.getBoundingClientRect() : null; return { open: !!(d && d.open), top: r ? r.top : null, scrolled: window.scrollY }; });
    if (!fold.open) problems.push('mz4: the delete fold is closed at #acct-del-h');
    else if (fold.top === null || fold.top < -4 || fold.top > page.viewportSize().height) problems.push(`mz4: the delete heading is not in view (top ${fold.top}, scrolled ${fold.scrolled})`);
    else mz4.fold = true;
    await page.fill('#del-pass', user.pass).catch(e => problems.push(`mz4: ${e.message.split('\n')[0]}`));
    await page.click('.acct-delete').catch(e => problems.push(`mz4: ${e.message.split('\n')[0]}`));
    await waitText(/your account is gone/i, 10000, 'mz4: the delete did not land');
    mz4.cleared = await page.evaluate(() => ({ game: Object.keys(localStorage).filter(k => k.startsWith('manzil-')), left: localStorage.getItem('starshard-email-left'), burst: localStorage.getItem('starshard-burst-seen') }));
    if (mz4.cleared.game.length) problems.push(`mz4: the game's keys survived the delete (${mz4.cleared.game.join(', ')})`);
    if (mz4.cleared.left || mz4.cleared.burst) problems.push('mz4: the shell\'s own markers survived the delete');
    const gone = await page.evaluate(async () => { const api = await import('/play/api.js'); return api.me(); }).catch(() => null);
    if (gone) problems.push(`mz4: the API still answers for the deleted account (${JSON.stringify(gone)})`);
    if (templateNoise) problems.push(`mz5: ${templateNoise} pre-hydration SVG attribute error(s) on /play/ (a bound geometry attribute the build's sweep missed)`);
    else if (!problems.some(p => p.startsWith('mz5'))) console.log(`  mz5 geometry           ok   /play/ booted with no pre-hydration SVG attribute error; on the board ${mz5.svgs} svgs carry a numeric viewBox and ${mz5.cx} circles a numeric cx, nothing in the live DOM holds a mustache or an sc-camel- attribute; __mzRetry/__mzHeal undefined`);
    for (const e of errors) problems.push(`console: ${e}`);
    if (!problems.some(p => p.startsWith('mz4')) && mz4.account && mz4.fold) console.log(`  mz4 account doors      ok   the pause menu: ${mz4.pause.length} doors (privacy, terms, a copy of your data, delete the account) to their pages in a new tab, all in view; the player menu: "account" beside "log out" (${Math.round(mz4.menu.w)}x${Math.round(mz4.menu.h)} px) opened /account signed in; #acct-del-h opened the fold in view, the delete landed, ${before} game keys and the shell's markers swept from the device`);
    if (problems.length) { console.log(`  ss9b play              FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  ss9b play              ok   signed up through api.js, home kept the API's sky (${kept?.night}, station ${kept?.moon?.station}, the shell's h1 "${shellStation}"), the ${w.mobile ? 'tab' : 'nav'} opened /play/ as its own page (no shell chrome, base /play/, titled)${w.mobile ? ', portrait asked for a turn' : ''}, the bridge answered from the API (station ${chrome.moon}), the lobby signed in as ${user.name} at ${tLobby} ms, the moon road to a board (${board.walker || 'a walker'}, ${board.slots} slots, ${board.hand} in hand) at ${tBoard} ms, left the road, the moon mark to the shard app, "your star shard ›" (${doorBack ? `${Math.round(doorBack.w)}x${Math.round(doorBack.h)} px on screen` : "missing"}) returned home still signed in; ${ms} ms; ${answered} API refusals as expected, no pre-hydration SVG attribute errors`);
    await page.close();
    await sctx.close();
  }

  // MZ7: doors both ways. The shell's side: home's "walk tonight's road", tonight's "playable
  // tonight" and the station page's "play tonight's road" all open /play/, and home's is a full
  // navigation to the game's own page. The game's side, signed in through api.js as in SS9b: the
  // codex (the player menu, "codex") shows a house with a door "the <house> in star shard" to
  // /station/<slug>, the slug the shell's own (station-index.json), and the door changes with the
  // house; tapped, it lands on the shell's station page with that house's name as the h1 and the
  // page's own door back to /play/. Then the moon road to a board, the board played out through the
  // game's dev handle (window.manzil, the way test/fuzz-manzil.mjs plays one) until the night ends
  // on the win, loss or road-lost screen, where "read tonight" stands beside "lobby" and opens the
  // shell's tonight page signed in; if three boards end in climbs, the road-lost screen is set
  // through the handle and the log says so.
  if (!apiSrv) { fail('mz7: the local API did not boot, the doors did not run'); }
  else {
    const problems = [];
    const sctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, isMobile: w.mobile, hasTouch: w.mobile, deviceScaleFactor: w.mobile ? 3 : 1 });
    const jar = new Map();
    const ip = `10.9.${w.mobile ? 5 : 6}.${Math.floor(Math.random() * 250) + 1}`;
    await wireOrigin(sctx, jar, ip);
    const page = await sctx.newPage();
    const errors = [];
    let answered = 0;
    const TEMPLATE_NOISE = /Expected (number|length|moveto path command).*\{\{/;
    page.on('console', msg => { if (msg.type() !== 'error') return; const loc = msg.location()?.url || ''; const text = msg.text(); if (OFFLINE && FONT_HOSTS.some(h => loc.includes(h) || text.includes(h))) return; if (loc.includes(API_HOST) && /status of 4\d\d/.test(text)) { answered++; return; } if (loc.includes('/play/') && TEMPLATE_NOISE.test(text)) { problems.push(`mz5: pre-hydration SVG error: ${text}`); return; } errors.push(`${text}${loc ? ` (${loc})` : ''}`); });
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
    page.on('requestfailed', req => { const u = req.url(); if (OFFLINE && FONT_HOSTS.some(h => u.includes(h))) return; if (u.includes(API_HOST) && req.failure()?.errorText === 'net::ERR_ABORTED') { answered++; return; } errors.push(`request failed: ${u} (${req.failure()?.errorText})`); });
    const text = async () => page.evaluate(() => document.body.innerText || '');
    const has = async re => re.test(await text());
    const waitText = async (re, ms, what) => page.waitForFunction(r => new RegExp(r.source, r.flags).test(document.body.innerText || ''), re, { timeout: ms }).then(() => true).catch(() => { problems.push(what); return false; });
    const centerOf = async re => page.evaluate(src => { const re = new RegExp(src, 'i'); const els = [...document.querySelectorAll('body *')].filter(e => re.test(e.textContent || '') && ![...e.children].some(c => re.test(c.textContent || ''))); const e = els[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, re.source);
    const tap = async (re, what) => { const c = await centerOf(re); if (!c) { problems.push(`mz7: could not find "${what}" to tap`); return false; } await page.mouse.click(c.x, c.y); return true; };
    // the centre of the element whose whole text is exactly this (the player menu's labels)
    const tapExact = async (label, what) => { const c = await page.evaluate(l => { const e = [...document.querySelectorAll('span, button, a')].find(x => (x.textContent || '').trim() === l && x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, label); if (!c) { problems.push(`mz7: could not find "${what}" to tap`); return false; } await page.mouse.click(c.x, c.y); return true; };
    const tapStage = async () => { const v = page.viewportSize(); await page.mouse.click(Math.round(v.width / 2), Math.round(v.height / 2)); };
    const dismissNote = async () => { for (let i = 0; i < 4 && await has(/touch the night|NIGHT \d+ OF 28/i); i++) { await tapStage(); await page.waitForTimeout(700); } };
    const chip = async () => page.evaluate(() => { const c = document.querySelector('.chip'); const spans = c ? c.querySelectorAll(':scope > span') : []; return spans.length ? spans[spans.length - 1].textContent.trim() : ''; });
    const door = async name => page.evaluate(n => { const a = document.querySelector(`a[data-mzdoor="${n}"]`); if (!a) return null; a.scrollIntoView({ block: 'nearest' }); const r = a.getBoundingClientRect(); const v = { w: innerWidth, h: innerHeight }; return { href: a.getAttribute('href'), target: a.getAttribute('target'), text: a.textContent.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, inView: r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0 && r.x + r.width <= v.w && r.y + r.height <= v.h }; }, name);
    const INDEX = JSON.parse(await readFile(join(root, 'app', 'src', 'station-index.json'), 'utf8'));
    const user = { email: `doors-${w.name}-${Date.now()}@example.test`, name: `doors${w.mobile ? 'p' : 'd'}${String(Date.now()).slice(-6)}`, pass: 'correct horse battery' };
    const mz7 = { shell: [], codex: null, codex2: null, station: null, end: null, boards: 0, forced: false, endPhase: null, endWiped: false };
    const t0 = Date.now();

    // the account, through the game's own api.js
    await page.goto(HOST + '/', { waitUntil: 'networkidle' });
    const who = await page.evaluate(async u => {
      const api = await import('/play/api.js');
      await api.signup(u.email, u.pass, { username: u.name, birthDate: '1991-07-04', birthTime: '21:15', birthTimeKnown: true, placeName: 'New York', lat: 40.7128, lon: -74.006, birthTz: 'America/New_York' });
      return api.me();
    }, user).catch(e => ({ error: e.message }));
    if (!who || who.username !== user.name) problems.push(`mz7: the signup through api.js did not sign the visitor in (${JSON.stringify(who)})`);

    // the shell's doors to the game: home, tonight, the station page
    await page.goto(HOST + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('main[data-route="home"] .doors', { timeout: 10000 }).catch(() => problems.push('mz7: home did not render its doors'));
    const tonightSlug = await page.evaluate(() => { try { const t = JSON.parse(localStorage.getItem('starshard-tonight')); return t && t.moon ? t.moon.station : null; } catch (e) { return null; } });
    const homeDoor = await page.evaluate(() => { const a = document.querySelector('main .doors a[href="/play/"]'); return a ? a.textContent.trim() : null; });
    if (homeDoor !== "walk tonight's road") problems.push(`mz7: home's door to the game reads "${homeDoor}"`); else mz7.shell.push('home');
    await page.goto(HOST + '/tonight', { waitUntil: 'networkidle' });
    await page.waitForSelector('main[data-route="tonight"] .doors', { timeout: 10000 }).catch(() => problems.push('mz7: tonight did not render its doors'));
    const tonightDoor = await page.evaluate(() => { const a = document.querySelector('main .doors a[href="/play/"]'); return a ? a.textContent.trim() : null; });
    if (!tonightDoor || !/^playable tonight/.test(tonightDoor)) problems.push(`mz7: tonight's door to the game reads "${tonightDoor}"`); else mz7.shell.push('tonight');
    const st0 = INDEX[((tonightSlug || 1) - 1) % 28];
    await page.goto(HOST + `/station/${st0.slug}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('article.codex-station', { timeout: 10000 }).catch(() => problems.push('mz7: the station page did not render'));
    const stationDoor = await page.evaluate(() => { const a = document.querySelector('main a[href="/play/"]'); return a ? a.textContent.trim() : null; });
    if (stationDoor !== "play tonight's road") problems.push(`mz7: the station page's door to the game reads "${stationDoor}"`); else mz7.shell.push('station');
    // home's door is a full navigation to the game's own page
    await page.goto(HOST + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('main .doors a[href="/play/"]', { timeout: 10000 }).catch(() => {});
    const toPlay = page.waitForURL(HOST + '/play/', { timeout: 10000, waitUntil: 'domcontentloaded' }).then(() => true).catch(() => false);
    await page.locator('main .doors a[href="/play/"]').first().click().catch(e => problems.push(`mz7: home's door: ${e.message.split('\n')[0]}`));
    if (!(await toPlay)) problems.push("mz7: home's door did not navigate to /play/");
    await page.waitForLoadState('load').catch(() => {});
    if (await page.evaluate(() => !!document.querySelector('header.header, nav.tabs, main[data-route]'))) problems.push('mz7: shell chrome over the stage');

    // the lobby, signed in
    if (w.mobile) { await waitText(/turn your phone sideways/i, 45000, 'mz7: portrait: no rotate prompt'); await page.setViewportSize({ width: w.height, height: w.width }); }
    await waitText(/the moon road|touch the night|NIGHT \d+ OF 28/i, 45000, 'mz7: the lobby did not open within 45 s');
    await dismissNote();
    await waitText(/the moon road/i, 10000, 'mz7: no "the moon road" in the lobby');
    const tLobby = Date.now() - t0;

    // the codex, from the player menu: the house's door to its page in the shell
    await page.keyboard.press('Escape'); await page.waitForTimeout(700);
    if (!(await page.evaluate(() => [...document.querySelectorAll('span')].some(s => (s.textContent || '').trim() === 'codex' && s.getBoundingClientRect().width > 0)))) { await page.keyboard.press('Escape'); await page.waitForTimeout(700); }
    await tapExact('codex', 'the player menu\'s codex'); await page.waitForTimeout(900);
    await waitText(/the codex · \d+ of 28 houses walked/i, 10000, 'mz7: the codex did not open');
    const house = await page.evaluate(() => { const m = window.manzil; if (!m || !m.state) return null; const sel = m.state.codexM || m._tonight(); return { sel, name: m._mName(sel) }; });
    mz7.codex = await door('station');
    if (!house) problems.push('mz7: no dev handle, the codex house is unknown');
    if (!mz7.codex) problems.push('mz7: the codex house has no door to its station page');
    else {
      const want = INDEX[house.sel - 1];
      if (!want || mz7.codex.href !== `/station/${want.slug}`) problems.push(`mz7: the codex door for house ${house?.sel} (${house?.name}) points at ${mz7.codex.href}, the shell's slug is ${want?.slug}`);
      if (mz7.codex.text !== `the ${house.name} in star shard ›`) problems.push(`mz7: the codex door reads "${mz7.codex.text}"`);
      if (mz7.codex.target) problems.push('mz7: the codex door opens a new tab');
      if (!mz7.codex.inView) problems.push(`mz7: the codex door is not in view (${Math.round(mz7.codex.x)},${Math.round(mz7.codex.y)} ${Math.round(mz7.codex.w)}x${Math.round(mz7.codex.h)})`);
    }
    // another house, the door follows
    const other = house && house.sel === 5 ? 12 : 5;
    await page.evaluate(n => window.manzil.setState({ codexM: n, codexCh: null }), other);
    await page.waitForTimeout(400);
    mz7.codex2 = await door('station');
    if (!mz7.codex2 || mz7.codex2.href !== `/station/${INDEX[other - 1].slug}`) problems.push(`mz7: with house ${other} selected the door points at ${mz7.codex2?.href}, wanted /station/${INDEX[other - 1].slug}`);
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-mz7-codex.png`) });
    // through the door: the shell's station page, that house's name, its door back
    const toStation = page.waitForURL(HOST + `/station/${INDEX[other - 1].slug}`, { timeout: 10000, waitUntil: 'domcontentloaded' }).then(() => true).catch(() => false);
    if (mz7.codex2) await page.mouse.click(mz7.codex2.x, mz7.codex2.y);
    if (!(await toStation)) problems.push('mz7: the codex door did not open the station page');
    else {
      if (w.mobile) await page.setViewportSize({ width: w.width, height: w.height });
      await page.waitForSelector('article.codex-station', { timeout: 10000 }).catch(() => problems.push('mz7: the station page did not render from the game'));
      mz7.station = await page.evaluate(() => ({ h1: (document.querySelector('main h1')?.textContent || '').trim(), back: !!document.querySelector('main a[href="/play/"]'), title: document.title }));
      if (mz7.station.h1 !== INDEX[other - 1].epithet.toLowerCase()) problems.push(`mz7: the station page's h1 is "${mz7.station.h1}", wanted "${INDEX[other - 1].epithet.toLowerCase()}"`);
      if (!mz7.station.back) problems.push('mz7: the station page has no door back to /play/');
      await page.waitForSelector('.chip:not([aria-busy])', { timeout: 5000 }).catch(() => {});
      if ((await chip()) !== user.name) problems.push(`mz7: on the station page the chip reads "${await chip()}"`);
    }

    // the night's end: the moon road to a board, the board played out, the door to tonight
    if (w.mobile) await page.setViewportSize({ width: w.width, height: w.height });
    await page.goto(HOST + '/play/', { waitUntil: 'load' });
    if (w.mobile) { await waitText(/turn your phone sideways/i, 45000, 'mz7: portrait: no rotate prompt (second visit)'); await page.setViewportSize({ width: w.height, height: w.width }); }
    await waitText(/the moon road|touch the night|NIGHT \d+ OF 28/i, 45000, 'mz7: the lobby did not open again');
    await dismissNote();
    await waitText(/the moon road/i, 10000, 'mz7: no "the moon road" after the station page');
    await tap(/the moon road/, 'the moon road'); await page.waitForTimeout(800);
    await waitText(/the night is open/i, 10000, 'mz7: no mode screen');
    await tap(/the moon road ›/, 'the moon road ›'); await page.waitForTimeout(900);
    await waitText(/click to sit down/i, 15000, 'mz7: no walker intro');
    await tapStage(); await page.waitForTimeout(900);
    await waitText(/play these seven/i, 15000, 'mz7: no mulligan');
    await tap(/play these seven/, 'play these seven');
    await page.waitForFunction(() => document.querySelectorAll('[data-mzhand]').length > 0, null, { timeout: 15000 }).catch(() => problems.push('mz7: no hand on the board'));
    const tBoard = Date.now() - t0;
    const END = ['won', 'lost', 'roadlost'];
    for (let b = 0; b < 3; b++) {
      const r = await page.evaluate(async () => {
        const m = window.manzil, sleep = ms => new Promise(r => setTimeout(r, ms));
        if (!m) return { skipped: 'no dev handle' };
        // our cards into the first empty slot on our turn; the sky's own hand plays its turns
        let guard = 0, placed = 0;
        while (m.state.phase === 'play' && (m.state.slots || []).some(x => !x) && guard++ < 120) {
          if (m.state.turn === 'you' && !m.state.busy && m.state.hand && m.state.hand.length) {
            const slot = m.state.slots.findIndex(x => !x);
            try { m._commitPlace(m.state.hand[0], slot, false, 'you'); placed++; } catch (e) { return { threw: 'lodge: ' + e.message }; }
            await sleep(250);
          } else await sleep(250);
        }
        let settled = null;
        for (let k = 0; k < 50 && !settled; k++) { await sleep(400); if (m.state.phase !== 'play') settled = m.state.phase; }
        if (!settled) return { stalled: true, phase: m.state.phase };
        let next = null;
        for (let k = 0; k < 30 && !next; k++) {
          if (['won', 'lost', 'roadlost'].includes(m.state.phase)) { next = m.state.phase; break; }
          if (m.state.phase === 'bigwin') { await sleep(400); continue; }
          try { m._roundAt = 0; m._exitRound(); } catch (e) { return { threw: 'exitRound: ' + e.message }; }
          await sleep(400);
          if (m.state.phase === 'play' && (m.state.slots || []).filter(Boolean).length < 9) next = 'play';
          if (['won', 'lost', 'roadlost', 'intro', 'climb'].includes(m.state.phase)) next = m.state.phase;
        }
        return { settled, next, phase: m.state.phase, placed };
      });
      mz7.boards++;
      if (r.threw) { problems.push(`mz7: the board threw (${r.threw})`); break; }
      if (r.skipped) { problems.push(`mz7: ${r.skipped}`); break; }
      if (r.stalled) { problems.push(`mz7: the count never ended on board ${b + 1} (phase ${r.phase})`); break; }
      if (END.includes(r.next)) { mz7.endPhase = r.next; break; }
      // a climb: the next walker's intro, then the board again
      if (r.next === 'intro' || r.next === 'climb') {
        await waitText(/click to sit down/i, 15000, `mz7: no walker intro after board ${b + 1}`);
        await tapStage(); await page.waitForTimeout(900);
        await waitText(/play these seven/i, 15000, `mz7: no mulligan after board ${b + 1}`);
        await tap(/play these seven/, 'play these seven');
        await page.waitForFunction(() => document.querySelectorAll('[data-mzhand]').length > 0, null, { timeout: 15000 }).catch(() => problems.push(`mz7: no hand on board ${b + 2}`));
      } else if (r.next !== 'play') { problems.push(`mz7: after board ${b + 1} the game sits in "${r.next || r.phase}"`); break; }
    }
    if (!mz7.endPhase && !problems.some(p => /threw|stalled|count never|no dev handle/.test(p))) {
      // three climbs in a row: the night is ended through the handle, the road-lost screen as a loss sets it
      await page.evaluate(() => { const m = window.manzil; m._clearSeq(); m.setState({ phase: 'roadlost', wiped: false, lives: 2, nmBeat: false }); });
      mz7.forced = true; mz7.endPhase = 'roadlost';
      await page.waitForTimeout(600);
    }
    if (mz7.endPhase) {
      await waitText(/anywhere to deal again/i, 10000, 'mz7: no end screen');
      // a wipe (the third loss) draws the new-moon veil over the screen for 2.6 s; wait for it to lift
      mz7.beats = await page.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const seen = []; for (let i = 0; i < 24; i++) { const st = window.manzil.state; const v = `${st.phase}/${st.nmBeat ? 'veil' : 'clear'}`; if (seen[seen.length - 1] !== v) seen.push(v); if (!st.nmBeat && i > 2) break; await sleep(400); } return seen; });
      await page.waitForFunction(() => !(window.manzil && window.manzil.state && window.manzil.state.nmBeat) && ![...document.querySelectorAll('div')].some(d => (d.textContent || '').trim() === 'the moon is dark tonight'), null, { timeout: 12000 }).catch(() => problems.push('mz7: the new-moon veil did not lift'));
      await page.waitForTimeout(700);
      mz7.endState = await page.evaluate(() => { const st = window.manzil.state; return { phase: st.phase, wiped: !!st.wiped, nmBeat: !!st.nmBeat, lives: st.lives, veil: [...document.querySelectorAll('div')].some(d => (d.textContent || '').trim() === 'the moon is dark tonight') }; });
      mz7.endWiped = mz7.endState.wiped;
      mz7.end = await door('tonight');
      if (!mz7.end) problems.push(`mz7: the ${mz7.endPhase} screen has no door to tonight`);
      else {
        if (mz7.end.href !== '/tonight') problems.push(`mz7: the end screen's door points at ${mz7.end.href}`);
        if (mz7.end.text !== 'read tonight ›') problems.push(`mz7: the end screen's door reads "${mz7.end.text}"`);
        if (mz7.end.target) problems.push('mz7: the end screen\'s door opens a new tab');
        if (!mz7.end.inView) problems.push(`mz7: the end screen's door is not in view (${Math.round(mz7.end.x)},${Math.round(mz7.end.y)} ${Math.round(mz7.end.w)}x${Math.round(mz7.end.h)})`);
        const lobbyBeside = await page.evaluate(() => { const a = document.querySelector('a[data-mzdoor="tonight"]'); return !!(a && a.parentElement && [...a.parentElement.querySelectorAll('button')].some(b => b.textContent.trim() === 'lobby')); });
        if (!lobbyBeside) problems.push('mz7: the end screen\'s door is not beside "lobby"');
        if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-mz7-end.png`) });
        const toTonight = page.waitForURL(HOST + '/tonight', { timeout: 10000, waitUntil: 'domcontentloaded' }).then(() => true).catch(() => false);
        await page.mouse.click(mz7.end.x, mz7.end.y);
        if (!(await toTonight)) problems.push('mz7: the end screen\'s door did not open /tonight');
        else {
          if (w.mobile) await page.setViewportSize({ width: w.width, height: w.height });
          await page.waitForSelector('main[data-route="tonight"] h1', { timeout: 10000 }).catch(() => problems.push('mz7: tonight did not render from the game'));
          await page.waitForSelector('.chip:not([aria-busy])', { timeout: 5000 }).catch(() => {});
          if ((await chip()) !== user.name) problems.push(`mz7: on tonight the chip reads "${await chip()}"`);
        }
      }
    }
    const ms = Date.now() - t0;
    // the account goes
    await page.evaluate(async p => { const api = await import('/play/api.js'); await api.deleteAccount(p); }, user.pass).catch(e => problems.push(`mz7: the delete: ${e.message.split('\n')[0]}`));
    for (const e of errors) problems.push(`console: ${e}`);
    if (problems.length) { console.log(`  mz7 doors              FAIL  (end ${JSON.stringify(mz7.endState)}, beats ${JSON.stringify(mz7.beats)}, boards ${mz7.boards}, phase ${mz7.endPhase})`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  mz7 doors              ok   the shell's ${mz7.shell.join(', ')} open /play/ and home's is a full navigation; the game's codex (house ${house.sel}, ${house.name}) carries "${mz7.codex.text}" to ${mz7.codex.href}, the door followed the house to ${mz7.codex2.href} and opened the shell's station page ("${mz7.station?.h1}", its own door back to /play/, still signed in); the moon road to a board at ${tBoard} ms, ${mz7.boards} board${mz7.boards === 1 ? '' : 's'} played out to the ${mz7.endPhase} screen${mz7.endWiped ? ' (a wipe, the veil lifted)' : ''}${mz7.forced ? ' (three climbs, the end set through the dev handle)' : ''}, "read tonight ›" beside "lobby" (${Math.round(mz7.end.w)}x${Math.round(mz7.end.h)} px) opened /tonight signed in; ${ms} ms; ${answered} API refusals as expected`);
    await page.close();
    await sctx.close();
  }

  // MZ6: a live match, the report, the restart notice. Two signed-in hands, each in its own
  // context (its own cookie jar, its own address), walk from the lobby to "two hands", the open
  // tables, "find a match"; the local API's lobby deals them to each other and both reach a
  // board. The first hand opens the pause overlay (on a phone, the new pause button top right;
  // on the desktop, Escape, as before), taps "report the far hand", answers "yes, report", and
  // the line "reported. the two of you are never dealt together again." appears; the row is in
  // manzil_reports and the block in manzil_blocks (the gate line). The second hand leaves the
  // match through its own pause overlay and the first is told. On the last width the API is
  // then stopped the way a deploy stops it (lobby.shutdown, the SIGTERM path): a hand waiting
  // at the open tables hears server_restart and the notice is on its screen with "find a match"
  // back under it. The socket's websocket upgrade fails against the Playwright route (an HTTP
  // proxy, like the NAS's), so that one console line is expected and counted, not failed.
  if (!apiSrv) { fail('mz6: the local API did not boot, the live match did not run'); }
  else {
    const problems = [];
    const t0 = Date.now();
    const mz6 = { matchedMs: 0, boardMs: 0, upgrades: 0, escapes: 0, report: null, block: null, restart: null };
    const hands = [];
    for (const side of ['a', 'b']) {
      const sctx = await browser.newContext({ viewport: { width: w.width, height: w.height }, isMobile: w.mobile, hasTouch: w.mobile, deviceScaleFactor: w.mobile ? 3 : 1 });
      const jar = new Map();
      const ip = `10.6.${w.mobile ? 1 : 2}.${side === 'a' ? 10 : 20}${Math.floor(Math.random() * 9)}`;
      await wireOrigin(sctx, jar, ip);
      const page = await sctx.newPage();
      const errors = [];
      page.on('console', msg => { if (msg.type() !== 'error') return; const loc = msg.location()?.url || ''; const text = msg.text(); if (OFFLINE && FONT_HOSTS.some(h => loc.includes(h) || text.includes(h))) return; if (/WebSocket connection to 'wss:\/\/api\.starshard\.test\//.test(text)) { mz6.upgrades++; return; } if (loc.includes(API_HOST) && /status of 4\d\d/.test(text)) return; errors.push(`${side}: ${text}${loc ? ` (${loc})` : ''}`); });
      page.on('pageerror', err => errors.push(`${side}: pageerror: ${err.message}`));
      page.on('requestfailed', req => { const u = req.url(); if (OFFLINE && FONT_HOSTS.some(h => u.includes(h))) return; if (u.includes(API_HOST) && req.failure()?.errorText === 'net::ERR_ABORTED') return; errors.push(`${side}: request failed: ${u} (${req.failure()?.errorText})`); });
      const text = async () => page.evaluate(() => document.body.innerText || '');
      const has = async re => re.test(await text());
      const waitText = async (re, ms, what) => page.waitForFunction(r => new RegExp(r.source, r.flags).test(document.body.innerText || ''), re, { timeout: ms }).then(() => true).catch(() => { problems.push(`${side}: ${what}`); return false; });
      const centerOf = async re => page.evaluate(src => { const re = new RegExp(src, 'i'); const els = [...document.querySelectorAll('body *')].filter(e => re.test(e.textContent || '') && ![...e.children].some(c => re.test(c.textContent || ''))); const e = els[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, re.source);
      const tap = async (re, what) => { const c = await centerOf(re); if (!c) { problems.push(`${side}: could not find "${what}" to tap`); return false; } await page.mouse.click(c.x, c.y); return true; };
      const tapSel = async (sel, what) => { const c = await page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } : null; }, sel); if (!c) { problems.push(`${side}: no "${what}" on screen (${sel})`); return null; } await page.mouse.click(c.x, c.y); return c; };
      const tapStage = async () => { const v = page.viewportSize(); await page.mouse.click(Math.round(v.width / 2), Math.round(v.height / 2)); };
      const dismissNote = async () => { for (let i = 0; i < 4 && await has(/touch the night|NIGHT \d+ OF 28/i); i++) { await tapStage(); await page.waitForTimeout(700); } };
      const user = { email: `hand-${side}-${w.name}-${Date.now()}@example.test`, name: `hand${side}${w.mobile ? 'p' : 'd'}${String(Date.now()).slice(-5)}`, pass: 'correct horse battery' };
      hands.push({ side, sctx, page, errors, user, text, has, waitText, tap, tapSel, tapStage, dismissNote });
    }
    // both hands: the account through api.js, then the game's own page, the lobby, two hands, the open tables
    for (const h of hands) {
      const { page, user, waitText, dismissNote } = h;
      await page.goto(HOST + '/', { waitUntil: 'networkidle' });
      const who = await page.evaluate(async u => {
        const api = await import('/play/api.js');
        await api.signup(u.email, u.pass, { username: u.name, birthDate: '1985-03-15', birthTime: '06:30', birthTimeKnown: true, placeName: 'New York', lat: 40.7128, lon: -74.006, birthTz: 'America/New_York' });
        return api.me();
      }, user).catch(e => ({ error: e.message }));
      if (!who || who.username !== user.name) problems.push(`${h.side}: the signup through api.js did not sign the hand in (${JSON.stringify(who)})`);
      const [[row]] = await apiSrv.pool.execute('SELECT id FROM users WHERE email = ?', [user.email]).catch(() => [[null]]);
      h.uid = row ? row.id : null;
      await page.goto(HOST + '/play/', { waitUntil: 'load' });
      if (w.mobile) { await waitText(/turn your phone sideways/i, 45000, 'portrait: no rotate prompt'); await page.setViewportSize({ width: w.height, height: w.width }); }
      await waitText(/the moon road|touch the night|NIGHT \d+ OF 28/i, 45000, 'the lobby did not open within 45 s');
      await dismissNote();
      await waitText(/the moon road/i, 10000, 'no "the moon road" in the lobby');
      await page.keyboard.press('Escape'); await page.waitForTimeout(700);
      await h.tap(/two hands/, 'two hands'); await page.waitForTimeout(900);
      await waitText(/the open tables/i, 10000, 'the open tables did not open');
    }
    // both look for a match; the lobby deals them to each other
    for (const h of hands) { await h.tap(/find a match/, 'find a match'); await h.page.waitForTimeout(150); }
    for (const h of hands) { if (await h.waitText(/the table is dealt/i, 20000, 'was not dealt a far hand within 20 s')) mz6.matchedMs = Date.now() - t0; }
    for (const h of hands) {
      await h.page.waitForFunction(() => document.querySelectorAll('[data-mzhand]').length > 0, null, { timeout: 20000 }).then(() => { mz6.boardMs = Date.now() - t0; }).catch(() => problems.push(`${h.side}: no hand on the live board`));
      h.board = await h.page.evaluate(() => ({ slots: document.querySelectorAll('[data-mzslot]').length, hand: document.querySelectorAll('[data-mzhand]').length, opp: (document.body.innerText.match(/^(.+?) to play$/m) || [])[1] || null, pause: !!document.querySelector('[data-mzpause="1"]') }));
      if (h.board.slots < 9) problems.push(`${h.side}: ${h.board.slots} board slots`);
      if (!h.board.pause) problems.push(`${h.side}: no pause button on the live board`);
    }
    const [A, B] = hands;
    if (A.board && B.board) {
      const names = [A.user.name, B.user.name];
      const seen = (await A.text()).includes(B.user.name) && (await B.text()).includes(A.user.name);
      if (!seen) problems.push(`the boards do not name the far hand (${names.join(' and ')})`);
    }
    if (SHOTS) await A.page.screenshot({ path: join(SHOTS, `${w.name}-mz6-board.png`) });
    // A: the pause overlay (the button on a phone; Escape on the desktop, twice when the first
    // closes the player menu left open by the walk from the lobby, as the game's own key handler
    // does), report the far hand
    const openPause = async h => {
      if (w.mobile) { const c = await h.tapSel('[data-mzpause="1"]', 'the pause button'); if (c && (c.w < 30 || c.h < 30)) problems.push(`${h.side}: the pause button is ${Math.round(c.w)}x${Math.round(c.h)} px on screen`); await h.page.waitForTimeout(600); return; }
      for (let i = 0; i < 3 && !(await h.has(/PAUSED/)); i++) { await h.page.keyboard.press('Escape'); await h.page.waitForFunction(() => /PAUSED/.test(document.body.innerText || ''), null, { timeout: 900 }).catch(() => {}); mz6.escapes++; }
    };
    await openPause(A);
    await A.waitText(/PAUSED/, 5000, 'no pause overlay on the live board');
    const ask = await A.page.evaluate(() => { const e = document.querySelector('[data-mzreport="ask"]'); return e ? e.textContent.trim() : null; });
    if (ask !== 'report the far hand') problems.push(`a: the pause overlay's report button reads "${ask}"`);
    if (SHOTS) await A.page.screenshot({ path: join(SHOTS, `${w.name}-mz6-pause.png`) });
    await A.tapSel('[data-mzreport="ask"]', 'report the far hand'); await A.page.waitForTimeout(500);
    await A.waitText(/report the far hand\?/, 5000, 'no yes-or-no after "report the far hand"');
    const askLine = await A.page.evaluate(() => { const e = document.querySelector('[data-mzreport="ask-open"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; });
    if (!askLine || !/the two of you are never dealt together again/.test(askLine)) problems.push(`a: the yes-or-no reads "${askLine}"`);
    if (SHOTS) await A.page.screenshot({ path: join(SHOTS, `${w.name}-mz6-ask.png`) });
    await A.tapSel('[data-mzreport="send"]', 'yes, report');
    await A.page.waitForSelector('[data-mzreport="done"]', { timeout: 10000 }).catch(() => problems.push('a: no "reported." line after "yes, report"'));
    const done = await A.page.evaluate(() => { const e = document.querySelector('[data-mzreport="done"]'); return e ? e.textContent.trim() : null; });
    if (done !== 'reported. the two of you are never dealt together again.') problems.push(`a: the confirmation reads "${done}"`);
    if (SHOTS) await A.page.screenshot({ path: join(SHOTS, `${w.name}-mz6-reported.png`) });
    // the gate line: the report reached manzil_reports, and the block beside it
    mz6.report = (await apiSrv.pool.execute('SELECT match_id, reporter_user_id, reported_user_id FROM manzil_reports WHERE reporter_user_id = ?', [A.uid]))[0].map(r => ({ ...r }));
    mz6.block = (await apiSrv.pool.execute('SELECT blocker_user_id, blocked_user_id FROM manzil_blocks WHERE blocker_user_id = ?', [A.uid]))[0].map(r => ({ ...r }));
    if (mz6.report.length !== 1) problems.push(`${mz6.report.length} report row(s) for the reporter, wanted 1`);
    else if (mz6.report[0].reported_user_id !== B.uid || !/^m_[0-9a-f]{16}$/.test(mz6.report[0].match_id)) problems.push(`the report row is ${JSON.stringify(mz6.report[0])}, the far hand is ${B.uid}`);
    if (mz6.block.length !== 1 || mz6.block[0].blocked_user_id !== B.uid) problems.push(`the block row is ${JSON.stringify(mz6.block)}, the far hand is ${B.uid}`);
    await A.tap(/resume/, 'resume'); await A.page.waitForTimeout(400);
    // B leaves the match from its own pause overlay; A is told and returns to the open tables
    await openPause(B);
    await B.waitText(/PAUSED/, 5000, 'no pause overlay on the live board');
    const bReport = await B.page.evaluate(() => !!document.querySelector('[data-mzreport="ask"]'));
    if (!bReport) problems.push('b: the far hand\'s overlay has no report button of its own');
    await B.tap(/leave match/, 'leave match'); await B.page.waitForTimeout(900);
    await A.waitText(/the match ended: the far hand left\./, 10000, 'was not told the far hand left');
    await A.waitText(/the open tables/i, 10000, 'did not return to the open tables after the far hand left');
    // the notice is on the open tables screen itself (the line under the title), not only in
    // the board's log line, which that screen covers
    const shown = async (h, re) => h.page.evaluate(src => { const re = new RegExp(src); const els = [...document.querySelectorAll('body *')].filter(e => re.test(e.textContent || '') && ![...e.children].some(c => re.test(c.textContent || ''))); return els.map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { w: r.width, h: r.height, y: r.y, op: Number(cs.opacity), vis: cs.visibility, under: !!e.closest('[style*="top:269px"]') }; }).filter(x => x.w > 0 && x.h > 0 && x.op > 0.5 && x.vis !== 'hidden' && !x.under); }, re.source);
    await A.page.waitForTimeout(500);
    const leftNote = await shown(A, /the match ended: the far hand left\./);
    if (!leftNote.length) problems.push('a: "the far hand left" is not shown on the open tables screen');
    // the restart notice, on the last width only: the API is stopped the way a deploy stops it
    if (w === WIDTHS[WIDTHS.length - 1]) {
      await A.tap(/find a match/, 'find a match'); await A.page.waitForTimeout(400);
      await A.waitText(/the sky looks for a free hand/i, 10000, 'did not start looking for a match');
      const t1 = Date.now();
      await apiSrv.lobby.shutdown('restart');
      await A.waitText(/the sky is closing for a moment\. the table is let go; find a match again in a minute\./, 10000, 'no restart notice');
      mz6.restart = { ms: Date.now() - t1, again: await A.has(/find a match/), stats: apiSrv.lobby.stats() };
      if (!mz6.restart.again) problems.push('"find a match" did not come back under the notice');
      const restartNote = await shown(A, /the sky is closing for a moment/);
      if (!restartNote.length) problems.push('the restart notice is not shown on the open tables screen');
      if (SHOTS) await A.page.screenshot({ path: join(SHOTS, `${w.name}-mz6-restart.png`) });
      await A.page.waitForTimeout(1500);
      const kept = await A.page.evaluate(() => document.body.innerText.includes('the sky is closing for a moment'));
      if (!kept) problems.push('the restart notice did not stay on the screen');
      apiSrv = null; // closed; nothing after this point uses it
    }
    const ms = Date.now() - t0;
    for (const h of hands) for (const e of h.errors) problems.push(`console: ${e}`);
    for (const h of hands) { await h.page.close(); await h.sctx.close(); }
    if (problems.length) { console.log(`  mz6 live               FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  mz6 live               ok   two hands signed up through api.js, both to the open tables, dealt to each other at ${mz6.matchedMs} ms and on a live board at ${mz6.boardMs} ms (${A.board.slots} slots, ${A.board.hand} and ${B.board.hand} in hand, each naming the other); ${w.mobile ? 'the pause button' : `Escape (${mz6.escapes} press${mz6.escapes === 1 ? '' : 'es'} for two overlays)`} opened the overlay, "report the far hand", "yes, report", the line confirmed it; manzil_reports has the row (${mz6.report[0].match_id}, ${A.uid} on ${B.uid}) and manzil_blocks the block; the far hand left and this one was told${mz6.restart ? `; lobby.shutdown: server_restart on the screen in ${mz6.restart.ms} ms with "find a match" back, every socket closed (${JSON.stringify(mz6.restart.stats)})` : ''}; ${ms} ms; ${mz6.upgrades} websocket upgrade(s) refused by the proxy, as expected`);
  }

  // SS9: the codex. The index (the ring, 28 rows with the card's art, the keyword and the
  // range, tonight's row marked) and one station page: the card with its two faces, the seven
  // sections in order, the four skies, the crossing computed on the device, the walkers, the
  // neighbours' doors, no em dash and no "mansion" in anything on the page.
  {
    const t0 = Date.now();
    const problems = [];
    const { page, errors } = await loadPage(context, '/codex');
    const idx = await page.evaluate(() => ({
      rows: document.querySelectorAll('ol.codex-list li').length,
      arts: document.querySelectorAll('ol.codex-list .codex-row-svg path').length,
      keys: [...document.querySelectorAll('.codex-row-key')].map(e => e.textContent.trim()).filter(Boolean).length,
      ring: document.querySelectorAll('.ring .ring-seg').length,
      now: document.querySelectorAll('.codex-row-now').length,
      tonight: document.querySelector('.codex-tonight')?.textContent.trim() || '',
      text: document.querySelector('main').textContent,
      prerender: !!document.querySelector('main[data-prerender]'),
    }));
    if (idx.rows !== 28) problems.push(`codex index: ${idx.rows} rows`);
    if (idx.arts < 28) problems.push(`codex index: ${idx.arts} art paths`);
    if (idx.keys !== 28) problems.push(`codex index: ${idx.keys} keywords`);
    if (idx.ring !== 28) problems.push(`codex index: ring has ${idx.ring} segments`);
    if (idx.now !== 1) problems.push(`codex index: ${idx.now} rows marked tonight`);
    if (!/tonight the moon is in /.test(idx.tonight)) problems.push('codex index: no tonight line');
    if (idx.prerender) problems.push('codex index: the prerendered main is still on the page');
    if (/—/.test(idx.text)) problems.push('codex index: em dash');
    if (/\bmansions?\b/i.test(idx.text)) problems.push('codex index: "mansion"');
    const msIdx = Date.now() - t0;
    await page.click('a.codex-row[href="/station/the-follower"]');
    await page.waitForSelector('article.codex-station', { timeout: 10000 });
    await page.waitForFunction(() => /the moon (comes into|is in) the follower/.test(document.querySelector('#sec-cross')?.parentElement.textContent || ''), null, { timeout: 15000 }).catch(() => problems.push('station: the crossing did not compute'));
    const st = await page.evaluate(() => {
      const main = document.querySelector('main');
      const h2s = [...main.querySelectorAll('h2')].map(h => h.textContent.trim());
      const card = main.querySelector('.codex-card');
      return {
        h1: main.querySelector('h1')?.textContent.trim(),
        h2s,
        cardFaces: card ? [...card.querySelectorAll('.codex-card-face')].map(e => e.textContent.trim()) : [],
        cardArt: card ? card.querySelectorAll('path').length : 0,
        cardLabel: card?.getAttribute('aria-label') || '',
        skies: [...main.querySelectorAll('.codex-skies .fr-k')].map(e => e.textContent.trim()),
        claim: main.querySelector('.codex-claim')?.textContent.trim() || '',
        cross: main.querySelector('#sec-cross')?.parentElement.textContent || '',
        sheet: [...main.querySelectorAll('.codex-cardsheet dd')].map(e => e.textContent.trim()),
        walkers: main.querySelectorAll('.codex-walkers li').length,
        sources: main.querySelectorAll('.codex-sources li').length,
        prev: main.querySelector('a[rel="prev"]')?.getAttribute('href'),
        next: main.querySelector('a[rel="next"]')?.getAttribute('href'),
        flag: main.querySelector('.codex-flag')?.textContent.trim(),
        text: main.textContent,
        words: main.textContent.split(/\s+/).filter(Boolean).length,
        title: document.title,
      };
    });
    const SECTIONS = ['the four skies', 'born under it', 'when the moon crosses', 'what the books say', 'the card and its signature', 'the walkers', 'sources'];
    if (st.h1 !== 'the follower') problems.push(`station h1 "${st.h1}"`);
    if (st.h2s.join('|') !== SECTIONS.join('|')) problems.push(`station sections: ${st.h2s.join(' · ')}`);
    if (st.cardFaces.join('/') !== '8/7') problems.push(`station card faces ${st.cardFaces.join('/')} (the game's sheet says 8/7)`);
    if (!st.cardArt) problems.push('station card has no art');
    if (!/answers when a neighbour falls/.test(st.cardLabel)) problems.push('station card label lacks the signature');
    if (st.skies.join('|') !== 'arabia|india|china|japan|the stars') problems.push(`station skies: ${st.skies.join(' · ')}`);
    if (!/aldebaran rises just behind the pleiades/.test(st.claim)) problems.push('station claim is not the corpus line');
    if (!/about every twenty-seven days/.test(st.cross)) problems.push('station crossing: no return line');
    if (st.sheet.slice(0, 3).join('|') !== '8|7|answers when a neighbour falls') problems.push(`station card sheet: ${st.sheet.join(' · ')}`);
    if (st.walkers !== 8) problems.push(`station walkers: ${st.walkers}`);
    if (st.sources < 7) problems.push(`station sources: ${st.sources} lines`);
    if (st.prev !== '/station/the-gathered-stars' || st.next !== '/station/the-blaze') problems.push(`station doors ${st.prev} / ${st.next}`);
    if (st.flag !== 'strong') problems.push(`station flag "${st.flag}"`);
    if (st.title !== 'the follower · star shard') problems.push(`station title "${st.title}"`);
    if (/—/.test(st.text)) problems.push('station: em dash on the page');
    if (/\bmansions?\b/i.test(st.text)) problems.push('station: "mansion" on the page');
    if (/\byou will\b/i.test(st.text)) problems.push('station: "you will" on the page');
    if (DUMP && !w.mobile) await writeFile(join(DUMP, 'ss9-station-the-follower.html'), await page.content());
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w.name}-ss9-station.png`), fullPage: true });
    // the neighbours' door stays in the app
    await page.click('a[rel="next"]');
    await page.waitForFunction(() => document.querySelector('main h1')?.textContent.trim() === 'the blaze', null, { timeout: 10000 }).catch(() => problems.push('station: the next door did not open the blaze'));
    for (const e of errors) problems.push(`console: ${e}`);
    const ms = Date.now() - t0;
    if (problems.length) { console.log(`  ss9 codex              FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  ss9 codex              ok   index in ${msIdx} ms: ring 28, 28 rows with art and keyword, tonight marked; the follower: card 8/7 with the game's art and signature, ${SECTIONS.length} sections in order, four skies, the crossing computed, 8 walkers, ${st.sources} source lines, ${st.words} words, no em dash, no "mansion"; next door opened the blaze; ${ms} ms`);
    await page.close();
  }

  // the static legal pages, as copied into dist/
  for (const path of ['/privacy/', '/terms/']) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error' && !(OFFLINE && FONT_HOSTS.some(h => (m.location()?.url || '').includes(h) || m.text().includes(h)))) errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    if (OFFLINE) await page.route(u => FONT_HOSTS.some(h => u.hostname === h), r => r.abort());
    const resp = await page.goto(base + path, { waitUntil: 'load' });
    const facts = await page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent.trim(), scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
    const problems = [];
    if (!resp || resp.status() >= 400) problems.push(`http ${resp?.status()}`);
    if (!facts.h1) problems.push('no h1');
    if (facts.scrollW > facts.innerW) problems.push('horizontal overflow');
    for (const e of errors) problems.push(`console: ${e}`);
    if (problems.length) { console.log(`  ${path.padEnd(22)} FAIL`); for (const p of problems) fail(`  ${p}`); }
    else console.log(`  ${path.padEnd(22)} ok   h1 "${facts.h1}"`);
    await page.close();
  }
  await context.close();
}

await browser.close();
server.close();
if (apiSrv) await apiSrv.close();

// SS9, the static side: every station's index.html carries a title, a description, og:title,
// og:description, og:url and (when app/og/ holds the image) og:image; the prerendered article
// is in the HTML; dist/sitemap.xml is well-formed, has the root and the 28 stations, and every
// url in it is a page in dist/.
{
  const problems = [];
  const dist = join(root, 'app', 'dist');
  const INDEX = JSON.parse(await readFile(join(root, 'app', 'src', 'codex-index.json'), 'utf8'));
  let withImage = 0;
  for (const s of INDEX) {
    const html = await readFile(join(dist, 'station', s.slug, 'index.html'), 'utf8');
    const has = re => re.test(html);
    if (!has(new RegExp(`<title>${s.epithet.toLowerCase()} · star shard</title>`))) problems.push(`${s.slug}: title`);
    if (!has(/<meta name="description" content="[^"]{60,}">/)) problems.push(`${s.slug}: description`);
    for (const k of ['og:title', 'og:description', 'og:url']) if (!has(new RegExp(`<meta property="${k}" content="[^"]+">`))) problems.push(`${s.slug}: ${k}`);
    if (has(/<meta property="og:image" content="[^"]+\.jpg">/)) withImage++;
    if (!has(/<article class="codex-station"/)) problems.push(`${s.slug}: no prerendered article`);
    if (!has(new RegExp(`<h1>${s.epithet.toLowerCase()}</h1>`))) problems.push(`${s.slug}: prerendered h1`);
    if (/—/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) problems.push(`${s.slug}: em dash in the html`);
  }
  if (withImage !== 28) problems.push(`og:image on ${withImage} of 28 station pages (run node app/og-render.mjs, then build)`);
  let urls = [];
  try {
    const xml = await readFile(join(dist, 'sitemap.xml'), 'utf8');
    if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) problems.push('sitemap: no xml declaration');
    if (!/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">[\s\S]*<\/urlset>\s*$/.test(xml)) problems.push('sitemap: not a urlset');
    const opens = (xml.match(/<url>/g) || []).length, closes = (xml.match(/<\/url>/g) || []).length;
    if (opens !== closes) problems.push(`sitemap: ${opens} <url> and ${closes} </url>`);
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    if (urls.length !== opens) problems.push('sitemap: a url without a loc');
    if (!urls.includes('https://starshard.net/')) problems.push('sitemap: no root');
    const stations = urls.filter(u => /\/station\/[a-z-]+$/.test(u));
    if (stations.length !== 28) problems.push(`sitemap: ${stations.length} station urls`);
    for (const s of INDEX) if (!urls.includes(`https://starshard.net/station/${s.slug}`)) problems.push(`sitemap: missing ${s.slug}`);
    if (new Set(urls).size !== urls.length) problems.push('sitemap: duplicate url');
    for (const u of urls) {
      const path = u.replace('https://starshard.net', '');
      const file = join(dist, path === '/' ? '' : path.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
      try { await readFile(file); } catch (e) { problems.push(`sitemap: ${u} has no page in dist/`); }
      if (/[&<>"]/.test(path)) problems.push(`sitemap: ${u} needs escaping`);
    }
    const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
    if (!/^Sitemap: https:\/\/starshard\.net\/sitemap\.xml$/m.test(robots)) problems.push('robots.txt does not name the sitemap');
  } catch (e) { problems.push(`sitemap: ${e.message}`); }
  if (problems.length) { console.log(`\n  ss9 static             FAIL`); for (const p of problems) fail(`  ${p}`); }
  else console.log(`\n  ss9 static             ok   28 station pages with title, description, og:title, og:description, og:url, og:image and the prerendered article; sitemap.xml well-formed with ${urls.length} urls (the root, 7 routes, 28 stations), every one a page in dist/; robots.txt names it`);
}

// MZ4, static: the game's cast (its last step, the password) says what making an account agrees
// to, with the terms and the privacy page linked, and no longer says the birth record is kept
// only on this device; the pause overlay and the player menu carry their doors (checked live
// above, counted here in the file the build wrote)
{
  const problems = [];
  const dist = join(root, 'app', 'dist');
  let game = '';
  try { game = await readFile(join(dist, 'play', 'index.html'), 'utf8'); } catch (e) { problems.push(`play/index.html: ${e.message}`); }
  const castLine = 'five cards are read from where your five planets stood. making an account agrees to the <a href="/terms/" target="_blank" rel="noopener" data-mzdoor="terms" style="color:inherit">terms</a>; the <a href="/privacy/" target="_blank" rel="noopener" data-mzdoor="privacy" style="color:inherit">privacy page</a> says what is kept and why.';
  if (!game.includes(castLine)) problems.push('the cast does not link the terms and the privacy page');
  if (/computed and kept on this device/.test(game)) problems.push('the cast still says the birth record is kept on this device');
  const doors = Object.fromEntries(['privacy', 'terms', 'data', 'delete', 'account', 'shell'].map(d => [d, (game.match(new RegExp(`data-mzdoor="${d}"`, 'g')) || []).length]));
  if (doors.privacy !== 2 || doors.terms !== 2) problems.push(`privacy/terms doors: ${doors.privacy}/${doors.terms}, wanted 2 each (the pause overlay and the cast)`);
  if (doors.data !== 1 || doors.delete !== 1 || doors.account !== 1 || doors.shell !== 1) problems.push(`account doors: ${JSON.stringify(doors)}`);
  for (const m of game.matchAll(/<a href="(\/[^"]*)"[^>]*data-mzdoor="([a-z]+)"[^>]*>([^<]*)<\/a>/g)) if (/\u2014/.test(m[3])) problems.push(`an em dash in the ${m[2]} door`);
  if (problems.length) { console.log(`  mz4 static             FAIL`); for (const p of problems) fail(`  ${p}`); }
  else console.log(`  mz4 static             ok   the cast's last step links the terms and the privacy page and no longer claims the record stays on the device; ${doors.privacy + doors.terms + doors.data + doors.delete + doors.account} account doors in the game file (pause overlay 4, player menu 1, cast 2), none with an em dash`);
}

// MZ5, static: the shipped game file carries no __mzRetry/__mzHeal, no bound geometry attribute,
// the 28 swept attributes in the runtime's sc-camel- form, the fisher's _figs key under its own name
// with his roster entry's figKey and the three match readers that consult it, the archetype's key
// and the walkers screen's trio as the source wrote them, and support.js loaded plainly
{
  const problems = [];
  const game = await readFile(join(root, 'app', 'dist', 'play', 'index.html'), 'utf8');
  const scriptAt = game.indexOf('<script type="text/x-dc"');
  const tmpl = game.slice(0, scriptAt);
  const hack = (game.match(/__mzRetry|__mzHeal/g) || []).length;
  const bound = (tmpl.match(/<(?:svg|rect|circle|line|path|text|ellipse|polygon|polyline)\b[^>]*?\s(?:x|y|cx|cy|r|x1|y1|x2|y2|d|rx|ry|width|height|points|viewBox)="\{\{/g) || []).length;
  const camel = (tmpl.match(/\ssc-camel-(?:x|y|cx|cy|r|d|view-box)="\{\{/g) || []).length;
  const fisher = (game.match(/"brann \(the fisher\)"/g) || []).length;
  const figKey = (game.match(/\bfigKey\b/g) || []).length;
  const archetype = (game.match(/^ {6}"brann": \{ op: \.95,/gm) || []).length;
  const trio = (game.match(/\["imra", "brann", "mave"\]\.map\(/g) || []).length;
  const plain = game.includes('<script src="./support.js"></script>') && !/support\.js"[^>]*onerror/.test(game);
  if (hack) problems.push(`mz5: ${hack} __mzRetry/__mzHeal reference(s) in the shipped game`);
  if (bound) problems.push(`mz5: ${bound} bound geometry attribute(s) in the shipped game`);
  if (camel !== 28) problems.push(`mz5: ${camel} sc-camel- geometry attributes, expected 28`);
  if (fisher !== 2) problems.push(`mz5: "brann (the fisher)" appears ${fisher} time(s), expected 2 (the _figs key and the roster entry's figKey)`);
  if (figKey !== 7) problems.push(`mz5: figKey appears ${figKey} time(s), expected 7 (the roster entry and three readers, twice each)`);
  if (archetype !== 1 || trio !== 1) problems.push(`mz5: the archetype's "brann" key (${archetype}) or the trio's reader (${trio}) is not as the source wrote it`);
  if (!plain) problems.push('mz5: support.js is not loaded plainly');
  if (problems.length) { console.log(`  mz5 static             FAIL`); for (const p of problems) fail(`  ${p}`); }
  else console.log(`  mz5 static             ok   the shipped game has no reload hack and no bound geometry attribute; ${camel} attributes in the runtime's sc-camel- form; the fisher's _figs key under its own name, named by figKey on his roster entry and read first by the three match readers, the archetype's key and the trio untouched; support.js loaded plainly`);
}

// MZ6, static: the shipped game emits report_player, hears reported / report_failed /
// server_restart, keeps its socket through the win or loss screen, carries the pause overlay's
// report (the button, the yes-or-no, the confirmation) and the live board's pause button, and
// none of the new lines holds an em dash
{
  const problems = [];
  const game = await readFile(join(root, 'app', 'dist', 'play', 'index.html'), 'utf8');
  const count = re => (game.match(re) || []).length;
  const emits = count(/_netSock\.emit\("report_player", \{ matchId: this\._netMatch\.matchId \}\)/g);
  const hears = ['reported', 'report_failed', 'server_restart'].filter(ev => !game.includes(`sock.on("${ev}"`));
  const kept = game.includes('phase: won ? "won" : "lost" });\n    this._netMatch.ended = true;') && !game.includes('phase: won ? "won" : "lost" });\n    this._netCleanup();');
  const doors = { ask: count(/data-mzreport="ask"/g), open: count(/data-mzreport="ask-open"/g), back: count(/data-mzreport="back"/g), send: count(/data-mzreport="send"/g), done: count(/data-mzreport="done"/g), pause: count(/data-mzpause="1"/g) };
  const lines = ['report the far hand', 'report the far hand?', "the report keeps this match's record. the two of you are never dealt together again.", 'reported. the two of you are never dealt together again.', 'the report did not reach the sky. try again in a moment.', 'the sky is closing for a moment. the table is let go; find a match again in a minute.'];
  if (!game.includes('if (st.duelNote) return st.duelNote;')) problems.push('mz6: the open tables do not carry the notice (otNote)');
  const missing = lines.filter(l => !game.includes(l));
  const dashed = lines.filter(l => /—|\s–\s/.test(l));
  if (emits !== 1) problems.push(`mz6: report_player is emitted ${emits} time(s), expected 1`);
  if (hears.length) problems.push(`mz6: the socket does not hear ${hears.join(', ')}`);
  if (!kept) problems.push('mz6: the socket is not kept through the win or loss screen');
  for (const [k, v] of Object.entries(doors)) if (v !== 1) problems.push(`mz6: data-mz${k === 'pause' ? 'pause' : 'report=' + k} appears ${v} time(s)`);
  if (missing.length) problems.push(`mz6: missing line(s): ${missing.map(l => JSON.stringify(l)).join(', ')}`);
  if (dashed.length) problems.push(`mz6: an em dash in ${dashed.map(l => JSON.stringify(l)).join(', ')}`);
  if (!game.includes('_netRestart()') || !game.includes('_netReport()')) problems.push('mz6: _netRestart or _netReport is missing');
  if (problems.length) { console.log(`  mz6 static             FAIL`); for (const p of problems) fail(`  ${p}`); }
  else console.log(`  mz6 static             ok   the shipped game emits report_player once and hears reported, report_failed and server_restart; the socket stays through the win or loss screen; the pause overlay carries the report button, the yes-or-no and the confirmation, the live board a pause button; ${lines.length} new lines, none with an em dash`);
}

// MZ7, static: the shipped game carries the codex door (one data-mzdoor="station", its href and
// label bound) and the end screen's door (one data-mzdoor="tonight", beside "lobby", off on the
// practice walk and on a table between friends), the old v4 href is gone, the codex's "open star
// shard" opens /shard on this origin, and the shell's home, tonight and station pages carry
// a[href="/play/"]
{
  const problems = [];
  const dist = join(root, 'app', 'dist');
  const game = await readFile(join(dist, 'play', 'index.html'), 'utf8');
  const count = re => (game.match(re) || []).length;
  if (count(/data-mzdoor="station"/g) !== 1) problems.push(`mz7: data-mzdoor="station" appears ${count(/data-mzdoor="station"/g)} time(s)`);
  if (count(/data-mzdoor="tonight"/g) !== 1) problems.push(`mz7: data-mzdoor="tonight" appears ${count(/data-mzdoor="tonight"/g)} time(s)`);
  if (!game.includes('out.cdxStationHref = "/station/the-" + this._mName(m).replace(/\\s+/g, "-");')) problems.push('mz7: the codex door\'s href is not bound to the house');
  if (!game.includes('endReadOn: (st.phase === "won" || st.phase === "lost" || st.phase === "roadlost") && !st.practice && !st.duel,')) problems.push('mz7: the end screen\'s door is not off for practice and duels');
  if (!/<a href="\{\{ endReadHref \}\}" onClick="\{\{ endReadTap \}\}" data-mzdoor="tonight"/.test(game)) problems.push('mz7: the end screen\'s door is not bound');
  if (/Star Shard v4\.dc\.html/.test(game)) problems.push('mz7: the shipped game still links Star Shard v4.dc.html');
  if (game.includes('out.cdxShardHref = "https://starshard.net";')) problems.push('mz7: the codex\'s "open star shard" still opens the production root');
  const lobbyRow = /<div style="position:absolute;left:50%;bottom:18px;[^"]*">\s*<button onClick="\{\{ endLobbyTap \}\}"[^>]*>lobby<\/button>\s*<sc-if value="\{\{ endReadOn \}\}"/.test(game);
  if (!lobbyRow) problems.push('mz7: the end screen\'s door is not beside "lobby"');
  for (const [path, want] of [['index.html', "walk tonight's road"], ['tonight/index.html', 'playable tonight'], ['station/the-gate/index.html', "play tonight's road"]]) {
    const html = await readFile(join(dist, path), 'utf8').catch(() => '');
    // the home and tonight render on load; the station page is prerendered and carries its door in the HTML
    if (path.startsWith('station/') && !new RegExp(`<a[^>]*href="/play/"[^>]*>${want.replace("'", "(?:'|&#x27;)")}`).test(html)) problems.push(`mz7: ${path} has no door to /play/ in the prerendered page`);
  }
  // the labels are written as JS escapes in the source (\u203a is the game's own door glyph, ›)
  for (const label of ['"read tonight \\u203a"', '" in star shard \\u203a"']) if (!game.includes(label)) problems.push(`mz7: the label ${label} is not in the shipped game`);
  if (problems.length) { console.log(`  mz7 static             FAIL`); for (const p of problems) fail(`  ${p}`); }
  else console.log(`  mz7 static             ok   the shipped game carries the codex door (bound to the house's slug) and the end screen's door (beside "lobby", off for practice and duels), no v4 href, "open star shard" on this origin; the prerendered station page carries its door to /play/`);
}

const checked = rows.length;
console.log(`\n${checked} route loads (${routes.length} routes x ${WIDTHS.length} widths), ${failures} failure${failures === 1 ? '' : 's'}${warnings ? `, ${warnings} font loads blocked (SMOKE_OFFLINE)` : ''}`);
process.exit(failures ? 1 : 0);
