#!/usr/bin/env node
// Build the deployed copy of support.js with the dc-runtime's three CDN
// dependencies pointed at our own origin instead of unpkg.com.
//
//   node tools/selfhost-runtime.mjs        # writes build/support.js
//   node tools/selfhost-runtime.mjs --check  # verify only, write nothing
//
// WHY THIS IS A BUILD STEP AND NOT AN EDIT
//
// `support.js` is generated (from dc-runtime/src/*.ts, which does not live in
// this repo) and arrives byte-identical through Design deliveries. Editing it
// by hand is the exact failure mode this repo keeps getting bitten by: a fix
// applied to a delivered file, silently reverted by the next delivery. So the
// repo copy stays pristine and the rewrite is re-applied on every deploy.
//
// WHY IT IS SAFE
//
// The dc-runtime already has the hook. `cdnScriptFor(url, sri)` checks
// `window.__resources[url]` first and uses that src when it is a non-empty
// string, falling back to the CDN URL + SRI otherwise. So a shim that fills in
// `window.__resources` before boot is the runtime's own supported escape
// hatch, not a monkey-patch. (An overridden entry carries no `integrity`,
// which is correct: SRI is for third-party origins, and these are now ours.)
//
// WHAT IT GUARDS AGAINST
//
// The SRI hashes baked into support.js are a free oracle for "is the file in
// vendor/ actually the file the runtime expects?". If Design ships a
// support.js built against a newer React, its hashes stop matching our
// vendored copies and this fails loudly instead of quietly serving the wrong
// version of React to every visitor. Re-run tools/vendor.mjs to fix.
//
// PATHS ARE ROOT-ABSOLUTE ON PURPOSE. The scripts are injected by the runtime
// at boot, so their relative URLs resolve against the DOCUMENT, not against
// support.js. `./vendor/react.js` would resolve correctly at the site root and
// 404 under /star-shard/ and /account/, which both load the same runtime.
//
// OWNER: Claude Code.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const SUPPORT = path.join(ROOT, 'support.js');
const VENDOR = path.join(ROOT, 'vendor');
const OUT_DIR = path.join(ROOT, 'build');
const OUT = path.join(OUT_DIR, 'support.js');

const CHECK_ONLY = process.argv.includes('--check');

// name in support.js -> the file tools/vendor.mjs writes, and the path we serve
// it from. Keep in step with tools/vendor.mjs's own FILES list.
const DEPS = [
  { label: 'react', urlVar: 'REACT_URL', sriVar: 'REACT_SRI', file: 'react.js' },
  { label: 'react-dom', urlVar: 'REACT_DOM_URL', sriVar: 'REACT_DOM_SRI', file: 'react-dom.js' },
  { label: 'babel', urlVar: 'BABEL_URL', sriVar: 'BABEL_SRI', file: 'babel.js' },
];

function die(msg) {
  console.error(`\nselfhost-runtime: ${msg}\n`);
  process.exit(1);
}

if (!fs.existsSync(SUPPORT)) die('support.js not found at the repo root.');
const src = fs.readFileSync(SUPPORT, 'utf8');

// Read the URLs and hashes out of support.js rather than hardcoding them, so a
// version bump in a Design delivery is detected instead of ignored.
function readVar(name) {
  const m = new RegExp(`var\\s+${name}\\s*=\\s*"([^"]+)"`).exec(src);
  return m ? m[1] : null;
}

if (!/window\.__resources/.test(src)) {
  die(
    'support.js has no `window.__resources` lookup in cdnScriptFor().\n' +
    'The runtime override hook this tool depends on is gone — a delivery\n' +
    'changed the runtime. Do NOT hand-edit support.js; re-read cdn.ts in the\n' +
    'delivered runtime and update this tool.'
  );
}

const resolved = [];
let skipped = 0;
for (const dep of DEPS) {
  const url = readVar(dep.urlVar);
  const sri = readVar(dep.sriVar);
  if (!url || !sri) die(`could not find ${dep.urlVar}/${dep.sriVar} in support.js.`);

  const local = path.join(VENDOR, dep.file);
  if (!fs.existsSync(local)) {
    // vendor/ is gitignored (it is reproducible from npm), so a fresh clone or
    // a CI box legitimately has none. --check is the dev gate and soft-skips;
    // a real build hard-fails, because deploy.sh must never ship a page that
    // silently falls back to unpkg.
    if (CHECK_ONLY) {
      console.log(`skip  ${dep.label.padEnd(10)} vendor/${dep.file} not present (run tools/vendor.mjs)`);
      skipped++;
      continue;
    }
    die(
      `vendor/${dep.file} is missing.\n` +
      'Run:  npm i react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0\n' +
      '      node tools/vendor.mjs'
    );
  }

  const got = 'sha384-' + crypto.createHash('sha384').update(fs.readFileSync(local)).digest('base64');
  if (got !== sri) {
    die(
      `vendor/${dep.file} does not match the hash support.js expects.\n` +
      `  support.js wants: ${sri}\n` +
      `  vendor/ has:      ${got}\n` +
      `  (runtime URL:     ${url})\n\n` +
      'This almost certainly means a Design delivery shipped a support.js built\n' +
      'against a different version. Re-vendor at the version in the URL above:\n' +
      '  npm i react@<v> react-dom@<v> @babel/standalone@<v> && node tools/vendor.mjs'
    );
  }

  resolved.push({ ...dep, url, served: `/vendor/${dep.file}` });
  console.log(`ok  ${dep.label.padEnd(10)} ${url}`);
  console.log(`    -> ${`/vendor/${dep.file}`.padEnd(24)} (${(fs.statSync(local).size / 1024).toFixed(0)} KB, hash verified)`);
}

if (CHECK_ONLY) {
  console.log(skipped
    ? `\n${resolved.length}/${DEPS.length} runtime dependencies verified; ${skipped} not vendored locally.`
    : '\nall three runtime dependencies verified against support.js\'s own SRI hashes.');
  process.exit(0);
}

const shim =
  '/* GENERATED by tools/selfhost-runtime.mjs from the repo\'s pristine support.js.\n' +
  '   Do not edit, do not commit: build/ is regenerated on every deploy.\n' +
  '   Points the dc-runtime\'s three CDN dependencies at this origin via the\n' +
  '   runtime\'s own window.__resources hook (see cdnScriptFor in cdn.ts), so the\n' +
  '   page no longer needs unpkg.com to reach first paint. */\n' +
  '(function () {\n' +
  '  var r = window.__resources || (window.__resources = {});\n' +
  resolved.map((d) => `  r[${JSON.stringify(d.url)}] = ${JSON.stringify(d.served)};\n`).join('') +
  '})();\n';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, shim + src);

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`\nwrote build/support.js  (${kb(fs.statSync(OUT).size)})`);
console.log(`unpkg bytes removed from the critical path: ${kb(resolved.reduce((a, d) => a + fs.statSync(path.join(VENDOR, d.file)).size, 0))}`);
