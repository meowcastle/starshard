#!/usr/bin/env node
// Copy the dc-runtime's CDN dependencies into ./vendor so test/smoke.mjs can
// run offline (VENDOR_DIR=./vendor node test/smoke.mjs).
//
//   npm i react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0
//   node tools/vendor.mjs
//
// NOTE: these three files are ~3.3MB and support.js fetches all of them from
// unpkg.com on every page load, before anything renders. If unpkg is slow,
// blocked, or down, the site shows raw {{ mustaches }}. Worth self-hosting them
// in production for the same reason it is worth vendoring them here.
//
// OWNER: Claude Code.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'vendor');
fs.mkdirSync(OUT, { recursive: true });

const FILES = [
  ['react/umd/react.production.min.js', 'react.js'],
  ['react-dom/umd/react-dom.production.min.js', 'react-dom.js'],
  ['@babel/standalone/babel.min.js', 'babel.js'],
];

let missing = 0;
for (const [from, to] of FILES) {
  const src = path.join(ROOT, 'node_modules', from);
  if (!fs.existsSync(src)) {
    console.error(`missing: node_modules/${from}`);
    missing++; continue;
  }
  fs.copyFileSync(src, path.join(OUT, to));
  console.log(`vendored ${to}  (${(fs.statSync(src).size / 1024).toFixed(0)} KB)`);
}
if (missing) {
  console.error('\nrun: npm i react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0');
  process.exit(1);
}
