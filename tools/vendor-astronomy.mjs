#!/usr/bin/env node
// Vendors astronomy-engine into a single minified ESM file the app can
// `import()` directly, the same way it already imports astro.js/format.js/etc.
//
//   npm i -D astronomy-engine@2.1.19 esbuild@0.24.0
//   node tools/vendor-astronomy.mjs
//
// Why this exists instead of loading astronomy-engine from a CDN like
// support.js does for React: astronomy-engine's own prebuilt browser bundle
// (astronomy.browser.min.js) is a UMD build with zero `export` statements —
// it's meant for a global <script> tag, not import(), so it can't be used
// the way every other module in this app is loaded. Its real ESM build
// (esm/astronomy.js) works with import() but ships unminified at ~412KB.
// This script runs esbuild over that ESM build once, offline, and commits
// the ~108KB minified result — a one-time vendoring step, not a build step
// for the deployed site (same category as tools/vendor.mjs, just for
// production shipping instead of offline test runs).
//
// Re-run this script to bump the astronomy-engine version. Never hand-edit
// the generated file.
//
// OWNER: Claude Code.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'node_modules/astronomy-engine/esm/astronomy.js');
const OUT = path.join(ROOT, 'astronomy-engine.js');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/astronomy-engine/package.json'), 'utf8'));

if (!fs.existsSync(SRC)) {
  console.error('missing: node_modules/astronomy-engine/esm/astronomy.js');
  console.error('run: npm i -D astronomy-engine@2.1.19 esbuild@0.24.0');
  process.exit(1);
}

const esbuildBin = path.join(ROOT, 'node_modules/.bin/esbuild');
const minified = execFileSync(esbuildBin, [SRC, '--minify', '--format=esm'], { encoding: 'utf8' });

const header = `/*
 * Vendored from astronomy-engine v${PKG.version} (MIT License).
 * Upstream: https://github.com/cosinekitty/astronomy
 * Minified with esbuild from esm/astronomy.js — see tools/vendor-astronomy.mjs.
 * Do not hand-edit. Re-run tools/vendor-astronomy.mjs to update.
 */
`;

fs.writeFileSync(OUT, header + minified);
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`vendored astronomy-engine.js  (${kb} KB, v${PKG.version})`);
