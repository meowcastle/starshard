#!/usr/bin/env node
// Vendors the socket.io-client browser UMD bundle for Manzil's real-time
// lobby (`window.io`) — the .dc.html has no module system (loaded via a
// plain <script> tag, no import()), so this needs the global-exposing
// build, not the ESM one.
//
//   cd starshard-api && npm i socket.io-client@4.8.3
//   node ../tools/vendor-socketio-client.mjs
//
// Why vendored rather than CDN-fetched like support.js's React/Babel: the
// project's own CLAUDE.md flags that CDN dependency as a known weak point
// ("if unpkg is unreachable the page renders raw {{ mustaches }}... self-
// hosting is an open improvement") — new dependencies shouldn't repeat it.
// astronomy-engine.js already set the vendored precedent for this app.
//
// Re-run this script to bump the socket.io-client version. Never hand-edit
// the generated file.
//
// OWNER: Claude Code.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'starshard-api/node_modules/socket.io-client/dist/socket.io.min.js');
const OUT = path.join(ROOT, 'socket-io-client.js');
const PKG_PATH = path.join(ROOT, 'starshard-api/node_modules/socket.io-client/package.json');

if (!fs.existsSync(SRC)) {
  console.error('missing: starshard-api/node_modules/socket.io-client/dist/socket.io.min.js');
  console.error('run: cd starshard-api && npm i socket.io-client@4.8.3');
  process.exit(1);
}

const PKG = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const body = fs.readFileSync(SRC, 'utf8');

const header = `/*
 * Vendored from socket.io-client v${PKG.version} (MIT License).
 * Upstream: https://github.com/socketio/socket.io-client
 * Unmodified prebuilt UMD bundle (dist/socket.io.min.js) — exposes
 * window.io. Do not hand-edit. Re-run tools/vendor-socketio-client.mjs
 * to update.
 */
`;

fs.writeFileSync(OUT, header + body);
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`vendored socket-io-client.js  (${kb} KB, v${PKG.version})`);
