#!/usr/bin/env node
// Build the iOS/Android app's web bundle (app/www) from exactly what staging
// serves. OWNER: Claude Code.
//
//   node tools/build-app.mjs            # writes app/www
//   node tools/build-app.mjs --check    # build to a temp dir and verify, write nothing
//   node tools/build-app.mjs --out DIR  # build somewhere else (test/app-e2e.mjs)
//   STARSHARD_API_BASE=http://127.0.0.1:4001 node tools/build-app.mjs --out DIR   # point at a local API
//
// ONE SOURCE OF TRUTH FOR "WHAT THE PAGE IS"
//
// tools/deploy.sh already decides which .dc.html ships as index.html and which
// modules ship beside it (FRONTEND_FILES), and that list has been corrected
// the hard way more than once. This script reads both out of deploy.sh rather
// than keeping its own copy, so the app can't drift from the site: a canon
// flip or a new module lands in the app on the next build with no edit here.
//
// WHAT THE APP COPY CHANGES, AND ONLY IN THE COPY
//
// The repo files stay byte-for-byte what Design delivered. The bundle's copy of
// the page gets four mechanical edits, each one checked below and loud if its
// anchor moves:
//   1. app-config.js + app-bridge.js load first (API base, socket token, shell)
//   2. the viewport stops pinch-zoom (a game, not a document)
//   3. Google Fonts -> the same two families, bundled (works offline, no third
//      party sees an app launch)
//   4. support.js is the self-hosted build (tools/selfhost-runtime.mjs), with
//      React/ReactDOM/Babel from vendor/: no unpkg on a phone, ever
//
// Then it checks that every script the page loads or import()s exists in the
// bundle, which is the check deploy.sh has never had.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(ROOT, 'app');
const CHECK = process.argv.includes('--check');
const outArg = process.argv.includes('--out') ? path.resolve(process.argv[process.argv.indexOf('--out') + 1]) : null;
const OUT = CHECK ? fs.mkdtempSync(path.join(os.tmpdir(), 'manzil-www-')) : (outArg || path.join(APP, 'www'));

const fail = msg => { console.error('build-app: ' + msg); process.exit(1); };
const rel = p => path.relative(ROOT, p);

// --- what deploy.sh ships ---------------------------------------------------
const deploy = fs.readFileSync(path.join(ROOT, 'tools/deploy.sh'), 'utf8');
const files = (deploy.match(/^FRONTEND_FILES="([^"]+)"/m) || fail('FRONTEND_FILES not found in deploy.sh'))[1].split(/\s+/).filter(Boolean);
const pageLine = deploy.split('\n').find(l => /\/index\.html" < "/.test(l) && /FRONTEND_REMOTE\/index\.html/.test(l) && !/^\s*#/.test(l));
if (!pageLine) fail('could not find the index.html source line in deploy.sh');
const PAGE = path.join(ROOT, pageLine.match(/< "([^"]+)"/)[1]);
if (!fs.existsSync(PAGE)) fail('deployed page missing: ' + rel(PAGE));

// --- the self-hosted runtime --------------------------------------------------
execFileSync(process.execPath, [path.join(ROOT, 'tools/selfhost-runtime.mjs')], { cwd: ROOT, stdio: 'pipe' });
const SUPPORT = path.join(ROOT, 'build/support.js');
for (const v of ['react.js', 'react-dom.js', 'babel.js']) {
  if (!fs.existsSync(path.join(ROOT, 'vendor', v))) fail(`vendor/${v} missing (node tools/vendor.mjs)`);
}

// --- assemble --------------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const put = (to, from) => { fs.mkdirSync(path.dirname(path.join(OUT, to)), { recursive: true }); fs.copyFileSync(from, path.join(OUT, to)); };

for (const f of files) {
  if (f === 'support.js' || f === 'sitemap.xml') continue;
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) fail(`FRONTEND_FILES lists ${f}, which does not exist`);
  put(f, src);
}
put('support.js', SUPPORT);
for (const v of ['react.js', 'react-dom.js', 'babel.js']) put('vendor/' + v, path.join(ROOT, 'vendor', v));

const appPkg = JSON.parse(fs.readFileSync(path.join(APP, 'package.json'), 'utf8'));
const appCfg = JSON.parse(fs.readFileSync(path.join(APP, 'app.config.json'), 'utf8'));
const cfg = { ...appCfg, version: appPkg.version };
if (process.env.STARSHARD_API_BASE) cfg.apiBase = process.env.STARSHARD_API_BASE;
fs.writeFileSync(path.join(OUT, 'app-config.js'), `window.STARSHARD_APP_CONFIG = ${JSON.stringify(cfg)};\n`);
put('app-bridge.js', path.join(APP, 'src/app-bridge.js'));

// --- fonts: Karla + Cormorant Garamond, the weights the page asks for ---------
const FONTS = [
  ['karla', 'Karla', [[400, 'normal'], [500, 'normal'], [600, 'normal'], [400, 'italic']]],
  ['cormorant-garamond', 'Cormorant Garamond', [[500, 'normal'], [600, 'normal'], [700, 'normal']]],
];
let css = '';
for (const [pkg, family, faces] of FONTS) {
  const dir = path.join(APP, 'node_modules/@fontsource', pkg, 'files');
  for (const [w, style] of faces) {
    for (const sub of ['latin', 'latin-ext']) {
      const name = `${pkg}-${sub}-${w}-${style}.woff2`;
      const src = path.join(dir, name);
      if (!fs.existsSync(src)) fail(`font missing: ${name} (npm install in app/)`);
      put('fonts/' + name, src);
      const range = sub === 'latin'
        ? 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
        : 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
      css += `@font-face{font-family:'${family}';font-style:${style};font-weight:${w};font-display:swap;src:url(./${name}) format('woff2');unicode-range:${range}}\n`;
    }
  }
}
fs.writeFileSync(path.join(OUT, 'fonts/fonts.css'), css);

// --- the page, with its four app edits ---------------------------------------------
function edit(html, from, to, what) {
  if (!html.includes(from)) fail(`anchor for "${what}" not found in ${rel(PAGE)} — the page changed; update build-app.mjs`);
  return html.replace(from, to);
}
let page = fs.readFileSync(PAGE, 'utf8');
page = edit(page, '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">\n' +
  '<script src="./app-config.js"></script>\n<script src="./app-bridge.js"></script>\n' +
  '<style>html,body{background:#040302;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;overscroll-behavior:none}</style>',
  'viewport + bridge');
page = page.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">/, () => '<link href="./fonts/fonts.css" rel="stylesheet">');
if (/fonts\.googleapis\.com/.test(page)) fail('a Google Fonts reference is left in the page');
fs.writeFileSync(path.join(OUT, 'index.html'), page);

// The account page (export + delete, App Store 5.1.1(v)), with the bridge.
let acct = fs.readFileSync(path.join(ROOT, 'account-data/index.html'), 'utf8');
acct = edit(acct, '<meta name="robots" content="noindex">',
  '<meta name="robots" content="noindex">\n<script src="../app-config.js"></script>\n<script src="../app-bridge.js"></script>\n<link href="../fonts/fonts.css" rel="stylesheet">',
  'account page bridge');
fs.mkdirSync(path.join(OUT, 'account-data'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'account-data/index.html'), acct);

// --- verify: everything the page loads is in the bundle ---------------------------
const missing = [];
const want = new Set();
for (const m of page.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)) want.add(m[1]);
for (const m of page.matchAll(/import\(\s*["'`](\.\/[^"'`]+)["'`]\s*\)/g)) want.add(m[1]);
for (const m of page.matchAll(/<x-import[^>]*\bsrc="([^"]+)"/g)) want.add(m[1]);
for (const u of want) {
  if (/^https?:/.test(u)) { missing.push(u + ' (remote)'); continue; }
  const f = u.replace(/^\.\//, '').split('?')[0];
  if (!fs.existsSync(path.join(OUT, f))) missing.push(f);
}
if (missing.length) fail('the page loads files the bundle does not have: ' + missing.join(', '));
const remote = [...page.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
if (remote.length) fail('the page still loads from the network: ' + remote.join(', '));

const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`build-app: ${CHECK ? 'checked' : 'wrote'} ${CHECK ? 'bundle' : rel(OUT)} from ${rel(PAGE)}`);
console.log(`  ${want.size} page dependencies, all present · ${(size(OUT) / 1048576).toFixed(1)} MB · api ${cfg.apiBase} · v${cfg.version}`);
if (CHECK) fs.rmSync(OUT, { recursive: true, force: true });
