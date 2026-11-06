#!/usr/bin/env node
// A static server for app/dist, for the smoke test and for looking at the build locally.
//
//   npm run serve:app            (from app/)   -> http://localhost:4173
//   PORT=5000 node serve.mjs
//
// Serves files from dist/ with the right content types; a path with no extension that has
// no file of its own falls back to dist/index.html, the way the production host is meant
// to (the build also writes one index.html per route, so the fallback is a second net).
// No caching headers, no directory listings, nothing outside dist/.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, 'dist');
const PORT = Number(process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function fileFor(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let p = join(dist, clean);
  if (!p.startsWith(dist)) return null;
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (!extname(clean)) return join(dist, 'index.html');
  return null;
}

export function start(port = PORT) {
  const server = createServer((req, res) => {
    const file = fileFor(req.url || '/');
    if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok, fail) => {
    server.on('error', fail);
    server.listen(port, '127.0.0.1', () => ok({ server, url: `http://localhost:${server.address().port}` }));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('app/dist/index.html is missing: run `npm run build:app` first');
    process.exit(1);
  }
  const { url } = await start();
  console.log(`serving app/dist at ${url}`);
}
