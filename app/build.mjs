#!/usr/bin/env node
// Builds the Star Shard shell: app/src -> app/dist.
//
//   npm run build:app            (from app/)
//   npm --prefix app run build:app   (from the repo root)
//
// What it does, in order: writes src/station-index.json from the root stations.js (28
// rows: number, epithet, slug, position) so the bundle carries the index and not the
// corpus; bundles src/main.jsx with esbuild (React 18, JSX automatic, ES2020, minified,
// source map) to dist/assets/app.js and app.css; writes dist/index.html from src/index.html
// with the title, description and canonical URL of each route, once at the root and once
// per static route and per station slug (dist/<route>/index.html) so any static host
// serves every URL without rewrite rules; copies the static legal pages (privacy/, terms/)
// into dist/; prints the output sizes, raw and gzipped.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile, rm, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = join(here, 'src');
const dist = join(here, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://starshard.net').replace(/\/$/, '');

const { STATIC_ROUTES, ROUTES } = await import(join(src, 'routes.mjs'));
const { STATIONS } = await import(join(root, 'stations.js'));
const { house } = await import(join(src, 'house.js'));

// 1. the station index the codex and station pages read
// the range is written "0°00′ Aries to 12°51′ Aries": no dashes a visitor reads (WRITING.md)
const index = STATIONS.map(s => ({ n: s.station + 1, epithet: s.epithet, slug: s.slug, position: s.position.replace(/\s[–—-]\s/g, ' to ') }));
await writeFile(join(src, 'station-index.json'), JSON.stringify(index, null, 1) + '\n');

// 2. dist/: written over in place; `--clean` empties it first (build output only, nothing
// of Justin's lives there; the night shift's mount cannot delete, so it never passes --clean)
if (process.argv.includes('--clean') && existsSync(dist)) {
  try { await rm(dist, { recursive: true, force: true }); }
  catch (e) { console.warn(`could not clear dist/ (${e.code}); writing over it`); }
}
await mkdir(join(dist, 'assets'), { recursive: true });

// 3. the bundle
const result = await build({
  absWorkingDir: here,
  entryPoints: [join(src, 'main.jsx')],
  outdir: join(dist, 'assets'),
  entryNames: 'app',
  bundle: true,
  format: 'esm',
  // the chart's planet engine (astronomy-engine, 108 KB) is imported on demand by
  // chart-engine.js and lands in its own chunk; the first load does not carry it (SS6)
  splitting: true,
  chunkNames: 'chunk-[hash]',
  platform: 'browser',
  target: ['es2020', 'safari15', 'chrome100', 'firefox100'],
  jsx: 'automatic',
  minify: true,
  sourcemap: true,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.json': 'json', '.html': 'text' },
  metafile: true,
  logLevel: 'warning',
});

// 4. the HTML, one copy per URL
const template = await readFile(join(src, 'index.html'), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// og: a station page is an article with its own image (app/og/<slug>.jpg, 1200 x 630, rendered by
// app/og-render.mjs from the same codex.json; copied to dist/og/); every other page is the site
// summary. body: the station pages and the codex are prerendered into #app (see 4b) so the
// public pages carry their text without a script; the bundle renders over it on load.
function page(route, { title, description, path, image, body = '' }) {
  const meta = image
    ? [`<meta property="og:image" content="${esc(SITE_URL + image)}">`, '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">', '<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:image" content="${esc(SITE_URL + image)}">`].join('\n')
    : '<meta name="twitter:card" content="summary">';
  return template
    .replace(/\{\{title\}\}/g, esc(title === 'star shard' ? title : `${title} · star shard`))
    .replace(/\{\{description\}\}/g, esc(description))
    .replace(/\{\{url\}\}/g, esc(SITE_URL + path))
    .replace(/\{\{ogtype\}\}/g, image ? 'article' : 'website')
    .replace('{{meta}}', meta + '\n')
    .replace('{{body}}', body);
}
async function writePage(path, html) {
  const dir = path === '/' ? dist : join(dist, path.replace(/^\//, '').replace(/\/$/, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html);
}
// 4b. the prerender: the codex and the 28 station pages are the public pages search finds,
// so their text is in the HTML. src/prerender.jsx is bundled for Node (React's server
// renderer, the same components the bundle mounts) and asked for each page's markup.
const CODEX = JSON.parse(await readFile(join(src, 'codex.json'), 'utf8'));
if (CODEX.length !== 28) throw new Error(`codex.json has ${CODEX.length} stations; run node app/codex-extract.mjs`);
await mkdir(join(dist, '.prerender'), { recursive: true });
await build({
  absWorkingDir: here,
  entryPoints: [join(src, 'prerender.jsx')],
  outfile: join(dist, '.prerender', 'prerender.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node18'],
  // React is resolved from node_modules at run time (its server renderer requires node's
  // stream), everything of ours is bundled
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.json': 'json', '.html': 'text', '.css': 'empty' },
  logLevel: 'warning',
});
const { renderStation, renderCodex } = await import(pathToFileURL(join(dist, '.prerender', 'prerender.mjs')).href);

let pages = 0;
for (const r of STATIC_ROUTES) {
  const body = r.key === 'codex' ? renderCodex() : '';
  await writePage(r.path, page(r, { title: r.title, description: r.description, path: r.path === '/' ? '/' : r.path, body }));
  pages++;
}
const stationRoute = ROUTES.find(r => r.key === 'station');
const ogDir = join(here, 'og');
let ogCount = 0;
for (const s of index) {
  const path = `/station/${s.slug}`;
  const rec = CODEX.find(c => c.slug === s.slug);
  const hasOg = existsSync(join(ogDir, `${s.slug}.jpg`));
  if (hasOg) ogCount++;
  // the description is the corpus's own claim for the place (MANSION.nn.claim), house style
  const claim = house(rec.claim).replace(/\s+/g, ' ').trim();
  await writePage(path, page(stationRoute, {
    title: s.epithet.toLowerCase(),
    description: `${s.epithet.toLowerCase()}, station ${s.n} of 28, ${s.position.toLowerCase()}. ${claim}`,
    path,
    image: hasOg ? `/og/${s.slug}.jpg` : null,
    body: renderStation(s.slug),
  }));
  pages++;
}
// the OG images, as rendered (see app/og-render.mjs)
if (existsSync(ogDir)) {
  await mkdir(join(dist, 'og'), { recursive: true });
  for (const f of await readdir(ogDir)) if (f.endsWith('.jpg')) await copyFile(join(ogDir, f), join(dist, 'og', f));
}
// the sitemap: the root, the public routes and the 28 stations; robots.txt points at it
const PUBLIC = ['/', '/tonight', '/chart', '/shard', '/codex', '/play/', '/privacy/', '/terms/'];
const urls = [...PUBLIC, ...index.map(s => `/station/${s.slug}`)];
const stamp = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(SITE_URL + u)}</loc><lastmod>${stamp}</lastmod></url>`).join('\n')}\n</urlset>\n`;
await writeFile(join(dist, 'sitemap.xml'), sitemap);
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
// a 404 page for hosts that serve one
await writeFile(join(dist, '404.html'), page(null, { title: 'not found', description: 'this page does not exist.', path: '/' }));

// 5. the static legal pages, as SS3 wrote them
for (const name of ['privacy', 'terms']) {
  const from = join(root, name, 'index.html');
  if (!existsSync(from)) { console.warn(`missing ${name}/index.html; skipped`); continue; }
  await mkdir(join(dist, name), { recursive: true });
  await copyFile(from, join(dist, name, 'index.html'));
}

// 7. the game at /play/ (SS9b). The September Manzil file is served as its own page: dist/play/
// index.html is a copy of "Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html" with
// the rewrites below applied at build time (the source file is never edited, the same rule as
// tools/selfhost-runtime.mjs), beside the files its own tags and imports load: the self-hosted
// dc-runtime (build/support.js, so unpkg.com is not in the critical path), ephemeris2.js,
// manzil-art2.js, socket-io-client.js, api.js (the same module the shell uses, so the game
// reads the same session cookie from the same api.<host>), manzil-copy.js, tz.js, and the two
// reference sheets the lobby links to. The runtime's three vendored dependencies go to
// dist/vendor/ (root-absolute, as the shim expects). Each rewrite must match exactly once,
// so a new delivery of the game file that moves a line fails the build instead of shipping a
// broken link.
{
  const gameFile = join(root, 'Star Shard v3 Build Plan', 'Manzil - Game Prototype V2.dc.html');
  if (!existsSync(gameFile)) throw new Error(`the game file is missing: ${gameFile}`);
  const selfhost = spawnSync(process.execPath, [join(root, 'tools', 'selfhost-runtime.mjs')], { stdio: 'pipe', encoding: 'utf8' });
  if (selfhost.status !== 0) throw new Error(`tools/selfhost-runtime.mjs failed:\n${selfhost.stdout}${selfhost.stderr}`);
  const play = join(dist, 'play');
  await mkdir(play, { recursive: true });
  await mkdir(join(dist, 'vendor'), { recursive: true });
  for (const f of ['react.js', 'react-dom.js', 'babel.js']) await copyFile(join(root, 'vendor', f), join(dist, 'vendor', f));
  await copyFile(join(root, 'build', 'support.js'), join(play, 'support.js'));
  for (const f of ['ephemeris2.js', 'manzil-art2.js', 'socket-io-client.js', 'api.js', 'manzil-copy.js', 'tz.js']) await copyFile(join(root, f), join(play, f));
  await copyFile(join(here, 'play', 'tonight-bridge.js'), join(play, 'tonight-bridge.js'));
  // the rules sheet and the user's manual, as the lobby links them (manzil/ is their home; their
  // "../support.js" becomes the runtime beside them)
  await copyFile(join(root, 'manzil', 'doc-page.js'), join(play, 'doc-page.js'));
  for (const name of ["Manzil - Rules & Cards.dc.html", "Manzil - A User's Manual.dc.html"]) {
    const doc = await readFile(join(root, 'manzil', name), 'utf8');
    if (!doc.includes('src="../support.js"')) throw new Error(`${name}: expected src="../support.js"`);
    await writeFile(join(play, name), doc.replace('src="../support.js"', 'src="./support.js"'));
  }
  const playRoute = ROUTES.find(r => r.key === 'play');
  const rewrites = [
    // the page knows where it is served, whatever the host does with the trailing slash: every
    // relative src, href and import() in the file resolves under /play/
    ['<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n',
     `<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<base href="/play/">\n<title>${esc(`${playRoute.title} · star shard`)}</title>\n<meta name="description" content="${esc(playRoute.description)}">\n<link rel="canonical" href="${esc(SITE_URL + '/play/')}">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="star shard">\n<meta property="og:title" content="${esc(`${playRoute.title} · star shard`)}">\n<meta property="og:description" content="${esc(playRoute.description)}">\n<meta property="og:url" content="${esc(SITE_URL + '/play/')}">\n<meta name="twitter:card" content="summary">\n`],
    // MZ5: the __mzRetry/__mzHeal reload hack goes. It re-fetched support.js, manzil-art2.js and
    // ephemeris2.js with a cache-busting ?t= when they failed to load, written for the retired
    // manzil/ subdirectory deploy that lacked two of them (research/audits/manzil-sept-audit-26oct.md:
    // "the -2 script bug does not reproduce"). Here every file the page loads is copied beside it
    // by this build, so the shipped page loads the runtime plainly and a missing file is a build
    // failure, not a reload.
    [`<script>window.__mzRetry=function(f){if(!window.__mzD)window.__mzD={};if(window.__mzD[f])return;var t=new URL(location.href).searchParams.get("t");if(!t)return;window.__mzD[f]=1;var s=document.createElement("script");s.src="./"+f+"?t="+encodeURIComponent(t);document.head.appendChild(s)};window.__mzHeal=function(){if(!window.__dcBoot)window.__mzRetry("support.js");if(!window.ManzilArt)window.__mzRetry("manzil-art2.js");if(!window.ManzilEphem)window.__mzRetry("ephemeris2.js")};</script>
<script src="./support.js" onerror="__mzRetry('support.js')"></script>
<script>window.addEventListener("load",function(){window.__mzHeal();setTimeout(window.__mzHeal,1200)});</script>
`,
     '<script src="./support.js"></script>\n'],
    // MZ5: _figs had two "brann" keys. The first (op .95) is the archetype brann, the fighter of the
    // house-0 roster, drawn on the walkers screen's trio with imra and mave and in a match on a
    // night whose house has no roster of its own (_rosterFor falls back to 0). The second (op .34)
    // is house 24's walker brann, the fisher, one of that house's faint silhouettes. An object
    // literal keeps the last, so the archetype's drawing was unreachable: the trio and the
    // archetype's own matches showed the faint fisher. Every walker is drawn by name first
    // (_figs()[w.name] || _figs()[_wAlias(w.name)]), and both men are named brann, so the fisher's
    // figure moves under its own key and his roster entry names it in a new drawing-only field,
    // figKey, which the three match readers consult first. Nothing else declares one, so every
    // other walker draws exactly as before; the archetype's key, and the trio's reader, stay as
    // the source wrote them. (fig is the seat, imra to the quiet one, and is not repurposed.)
    ['      "brann": { op: .34, p: [P("M54 16 a5.5 5.5 0 1 1 -0.01 0 Z", I, S, ".6"),',
     '      "brann (the fisher)": { op: .34, p: [P("M54 16 a5.5 5.5 0 1 1 -0.01 0 Z", I, S, ".6"),'],
    ['{ name: "brann", fig: "sef", them: "him", line: "brann fishes.',
     '{ name: "brann", fig: "sef", them: "him", figKey: "brann (the fisher)", line: "brann fishes.'],
    ['const fg = w ? (this._figs()[w.name] || this._figs()[this._wAlias(w.name)]) : null;',
     'const fg = w ? ((w.figKey && this._figs()[w.figKey]) || this._figs()[w.name] || this._figs()[this._wAlias(w.name)]) : null;'],
    ['"climb") ? (this._figs()[w.name] || this._figs()[this._wAlias(w.name)]) : null;',
     '"climb") ? ((w.figKey && this._figs()[w.figKey]) || this._figs()[w.name] || this._figs()[this._wAlias(w.name)]) : null;'],
    ['f1 = w1 ? (this._figs()[w1.name] || this._figs()[this._wAlias(w1.name)]) : null;',
     'f1 = w1 ? ((w1.figKey && this._figs()[w1.figKey]) || this._figs()[w1.name] || this._figs()[this._wAlias(w1.name)]) : null;'],
    // the game reads the shell's sky before the runtime boots (app/play/tonight-bridge.js)
    ['<script src="ephemeris2.js"></script>', '<script src="ephemeris2.js"></script>\n<script src="tonight-bridge.js"></script>'],
    // the game's door to the shell. The file's one "your star shard" anchor sits in a retired
    // block (display:none) and pointed at the v4 file; it points home now. The live door is the
    // shard-app screen (the lobby's moon mark, "star shard", then "the shard app"): it shipped as
    // a dashed "under construction" box with "the sign-up will live here", and the app it was
    // waiting for is this one, so the box becomes the link, in the game's own gold button and
    // the game's own words ("your star shard"); the line about the sign-up goes, "esc steps back"
    // stays; and "bought once, yours forever. no subscription." is not shown while nothing is for
    // sale (SS16 decides the price; the decisions queue has the line).
    ['href="Star Shard v4.dc.html"', 'href="/"'],
    ['<span style="font-family:\'Karla\',sans-serif;font-size:12px;color:#D8C89C">bought once, yours forever. no subscription.</span>\n', ''],
    [`<div style="position:relative;padding:11px 30px;border:1px dashed rgba(255,176,0,.55);animation:mzFadeUp .55s ease .3s both">
        <span style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:17px;color:#FFB000">under construction · the door opens soon</span>
      </div>
      <span style="font-family:'Karla',sans-serif;font-size:10px;color:rgba(154,138,94,.7);animation:mzFadeUp .55s ease .36s both">the sign-up will live here. esc steps back.</span>`,
     `<a href="/" data-mzdoor="shell" style="position:relative;display:inline-block;text-decoration:none;padding:11px 30px;background:linear-gradient(180deg, rgba(240,216,154,.2), rgba(240,216,154,.07));border:1px solid #F0D89A;border-radius:5px;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:17px;color:#F0D89A;box-shadow:0 3px 0 rgba(38,30,12,.95), 0 7px 18px rgba(0,0,0,.4), 0 0 18px rgba(240,216,154,.18);animation:mzFadeUp .55s ease .3s both" style-hover="color:#FFFDF5;border-color:#FFFDF5">your star shard ›</a>
      <span style="font-family:'Karla',sans-serif;font-size:10px;color:rgba(154,138,94,.7);animation:mzFadeUp .55s ease .36s both">esc steps back.</span>`],
    // the codex's "open star shard" door opens the shard on this origin, not the production root
    ['out.cdxShardHref = "https://starshard.net";', 'out.cdxShardHref = "/shard";'],
    // MZ4: the account's doors from inside the game. Export and delete live on the shell's
    // account page (SS8; privacy/ and terms/ say "on the account page"), so the game links there
    // rather than growing a second delete flow. Three places, each in the game's own type and
    // colours. (1) The pause overlay (Escape, in a match): "privacy" and "terms" join "sound" and
    // "log out", and a second row carries "a copy of your data" and "delete the account", each to
    // its section of the account page; the delete in the ember the overlay already uses for
    // "forfeit the climb". They open in a new tab: the night holds, nothing on the board is lost.
    // (2) The player-chip menu, the one menu a phone reaches, in the lobby: an "account" item
    // beside "log out", drawn like it. (3) The cast's last step: the line under the cast button
    // said the birth record was "computed and kept on this device", which stopped being the whole
    // truth when signup began sending it to the server (SS1; CLAUDE.md: no copy may imply birth
    // data stays in the browser); it now says what making an account agrees to, with the two links.
    [`          <button onClick="{{ pauseLogoutTap }}" style="background:none;border:none;padding:0;cursor:pointer;font-family:'Karla',sans-serif;font-size:11px;color:rgba(154,138,94,.85)" style-hover="filter:brightness(1.3)">log out</button>
        </div>
        <div style="font-size:9px;color:rgba(154,138,94,.55);margin-top:12px">esc to close</div>`,
     `          <button onClick="{{ pauseLogoutTap }}" style="background:none;border:none;padding:0;cursor:pointer;font-family:'Karla',sans-serif;font-size:11px;color:rgba(154,138,94,.85)" style-hover="filter:brightness(1.3)">log out</button>
          <a href="/privacy/" target="_blank" rel="noopener" data-mzdoor="privacy" style="text-decoration:none;font-family:'Karla',sans-serif;font-size:11px;color:rgba(154,138,94,.85)" style-hover="filter:brightness(1.3)">privacy</a>
          <a href="/terms/" target="_blank" rel="noopener" data-mzdoor="terms" style="text-decoration:none;font-family:'Karla',sans-serif;font-size:11px;color:rgba(154,138,94,.85)" style-hover="filter:brightness(1.3)">terms</a>
        </div>
        <div style="display:flex;align-items:center;gap:20px;margin-top:10px">
          <a href="/account#acct-data-h" target="_blank" rel="noopener" data-mzdoor="data" style="text-decoration:none;font-family:'Karla',sans-serif;font-size:11px;color:rgba(154,138,94,.85)" style-hover="filter:brightness(1.3)">a copy of your data</a>
          <a href="/account#acct-del-h" target="_blank" rel="noopener" data-mzdoor="delete" style="text-decoration:none;font-family:'Karla',sans-serif;font-size:11px;color:rgba(210,120,70,.95)" style-hover="filter:brightness(1.25)">delete the account</a>
        </div>
        <div style="font-size:9px;color:rgba(154,138,94,.55);margin-top:12px">esc to close</div>`],
    [`        <sc-if value="{{ pmLogoutOn }}" hint-placeholder-val="{{ false }}">
          <button onClick="{{ pmLogout }}" `,
     `        <sc-if value="{{ pmLogoutOn }}" hint-placeholder-val="{{ false }}">
          <a href="/account" data-mzdoor="account" style="position:relative;text-decoration:none;display:flex;flex-direction:column;align-items:center;gap:5px;animation:mzPmIn .38s cubic-bezier(.3,1.2,.4,1) .26s both" style-hover="filter:brightness(1.35) drop-shadow(0 0 10px rgba(154,138,94,.5));transform:translateY(-3px)">
            <span style="position:relative;width:44px;height:44px;border-radius:50%;border:1px dashed rgba(154,138,94,.5);background:radial-gradient(circle at 50% 42%, rgba(154,138,94,.1), rgba(12,9,5,.85) 76%);display:flex;align-items:center;justify-content:center">
              <svg viewBox="0 0 40 40" style="width:20px;height:20px"><g fill="none" stroke="rgba(216,200,156,.8)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="15.5" r="5"></circle><path d="M11 30 c0 -5.5 4 -8.5 9 -8.5 s9 3 9 8.5"></path></g></svg>
            </span>
            <span style="font-family:'Karla',sans-serif;font-size:9.5px;letter-spacing:.05em;color:#D8C89C;text-shadow:0 1px 8px rgba(5,3,2,.9)">account</span>
          </a>
          <button onClick="{{ pmLogout }}" `],
    [`<div style="font-family:'Karla',sans-serif;font-size:9.5px;color:rgba(154,138,94,.6);text-align:center">five cards are read from where your five planets stood. computed and kept on this device.</div>`,
     `<div style="font-family:'Karla',sans-serif;font-size:9.5px;line-height:1.7;color:rgba(154,138,94,.6);text-align:center;max-width:300px;text-wrap:pretty">five cards are read from where your five planets stood. making an account agrees to the <a href="/terms/" target="_blank" rel="noopener" data-mzdoor="terms" style="color:inherit">terms</a>; the <a href="/privacy/" target="_blank" rel="noopener" data-mzdoor="privacy" style="color:inherit">privacy page</a> says what is kept and why.</div>`],
    // MZ6: the far hand can be reported, and the sky's restart is told. The server had the
    // handler (report_player writes manzil_reports and manzil_blocks, and the matcher skips a
    // blocked pair) and the game never emitted it; now it answers `reported` / `report_failed`,
    // takes a report for ten minutes after a table closes, and says `server_restart` before a
    // deploy closes every socket (starshard-api/lib/manzil-lobby.js, test/manzil-lobby.test.js).
    // In the game, in the game's own words: (1) the socket hears the three answers; (2) the
    // socket and the match id stay through the win or loss screen, so the report can follow the
    // match; (3) _netReport and _netRestart; (4) the pause overlay carries "report the far hand",
    // a yes-or-no, and the line that confirms it, under "leave match"; (5) a live match gets a
    // pause button top right, since the overlay was Escape-only and a phone has no Escape
    // (the decisions queue, MZ4); (6) the restart notice returns the player to the open tables;
    // (7) below.
    [`      sock.on("opponent_reconnected", () => this.setState({ log: "the far hand returns." }));
`,
     `      sock.on("opponent_reconnected", () => this.setState({ log: "the far hand returns." }));
      sock.on("reported", () => this.setState({ reportAsk: false, reported: true, log: "reported. the two of you are never dealt together again." }));
      sock.on("report_failed", () => this.setState({ reportAsk: false, log: "the report did not reach the sky. try again in a moment." }));
      sock.on("server_restart", () => this._netRestart());
`],
    [`    this.setState({ duelSeek: { stage: "seek" } });
`,
     `    this.setState({ duelSeek: { stage: "seek" }, reported: false, reportAsk: false, duelNote: null });
`],
    // (7) the open tables show the notice: the board's log line sits under that screen, so
    // "the far hand left" was never seen there either; the line under the title carries it
    // until the next "find a match" or a step back
    [`          otNote: (() => { if (found) return "";`,
     `          otNote: (() => { if (found) return ""; if (st.duelNote) return st.duelNote;`],
    [`        if (this.state.duel && this.state.duel.mode === "live") this.setState({ phase: "duel1", duel: null, duelSeek: null, log: "the match ended: the far hand left." });`,
     `        if (this.state.duel && this.state.duel.mode === "live") this.setState({ phase: "duel1", duel: null, duelSeek: null, pauseOn: false, reportAsk: false, leaveAsk: false, busy: false, log: "the match ended: the far hand left.", duelNote: "the match ended: the far hand left." });`],
    [`      duelBackTap: () => { this._netCancelQueue(); this._go(st.navFrom === "mode" ? "mode" : "menu", { duelSeek: null, navFrom: null }); },`,
     `      duelBackTap: () => { this._netCancelQueue(); this._go(st.navFrom === "mode" ? "mode" : "menu", { duelSeek: null, duelNote: null, navFrom: null }); },`],
    [`    this._netMatch = null; this._netPendingSlots = null; this._netPendingTurn = undefined;
  }
`,
     `    this._netMatch = null; this._netPendingSlots = null; this._netPendingTurn = undefined;
  }
  _netReport() {
    if (!this._netSock || !this._netMatch || this.state.reported) return;
    try { this._netSock.emit("report_player", { matchId: this._netMatch.matchId }); }
    catch (e) { this.setState({ reportAsk: false, log: "the report did not reach the sky. try again in a moment." }); }
  }
  _netRestart() {
    clearTimeout(this._seekT);
    const st = this.state, live = !!(st.duel && st.duel.mode === "live");
    this._netCleanup();
    if ((live && st.phase !== "won" && st.phase !== "lost") || st.duelSeek) {
      this._clearSeq();
      const note = "the sky is closing for a moment. the table is let go; find a match again in a minute.";
      this.setState({ phase: "duel1", duel: null, duelSeek: null, pauseOn: false, reportAsk: false, leaveAsk: false, busy: false, log: note, duelNote: note });
    }
  }
`],
    [`    this.setState({ roundWins: (msg.roundWins || []).slice(), phase: won ? "won" : "lost" });
    this._netCleanup();
  }
`,
     `    this.setState({ roundWins: (msg.roundWins || []).slice(), phase: won ? "won" : "lost" });
    this._netMatch.ended = true;
  }
`],
    [`      pauseKeepTap: () => this.setState({ pauseOn: false, leaveAsk: false }),
`,
     `      pauseKeepTap: () => this.setState({ pauseOn: false, leaveAsk: false, reportAsk: false }),
      reportOn: !!(st.duel && st.duel.mode === "live" && this._netMatch && !st.reported && !st.reportAsk),
      reportAskOn: !!(st.duel && st.duel.mode === "live" && st.reportAsk && !st.reported),
      reportDoneOn: !!(st.duel && st.duel.mode === "live" && st.reported),
      reportTap: () => this.setState({ reportAsk: true, leaveAsk: false }),
      reportBackTap: () => this.setState({ reportAsk: false }),
      reportSendTap: () => this._netReport(),
      pauseBtnOn: !!(st.duel && st.duel.mode === "live" && !st.pauseOn && (st.phase === "play" || st.phase === "round" || st.phase === "over")),
      pauseTap: () => this.setState({ pauseOn: true, leaveAsk: false, reportAsk: false }),
`],
    [`<div style="width:120px;height:1px;background:linear-gradient(90deg, transparent, rgba(240,216,154,.22), transparent);margin:16px 0 12px"></div>`,
     `<sc-if value="{{ reportOn }}" hint-placeholder-val="{{ false }}">
          <button onClick="{{ reportTap }}" data-mzreport="ask" style="margin-top:12px;min-height:30px;background:none;border:none;padding:0 6px;cursor:pointer;font-family:'Karla',sans-serif;font-size:11px;color:rgba(210,120,70,.95)" style-hover="filter:brightness(1.25)">report the far hand</button>
        </sc-if>
        <sc-if value="{{ reportAskOn }}" hint-placeholder-val="{{ false }}">
          <div data-mzreport="ask-open" style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:16px;animation:mzFadeUp .3s ease both">
            <div style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:19px;color:#F2EAD6">report the far hand?</div>
            <div style="max-width:280px;text-align:center;font-family:'Karla',sans-serif;font-size:10.5px;line-height:1.75;color:rgba(198,94,42,.92);text-wrap:pretty">the report keeps this match's record. the two of you are never dealt together again.</div>
            <div style="display:flex;gap:10px;margin-top:2px">
              <button onClick="{{ reportBackTap }}" data-mzreport="back" style="padding:10px 22px;background:rgba(255,176,0,.1);border:1px solid rgba(255,176,0,.6);cursor:pointer;font-family:'Karla',sans-serif;font-size:12px;color:#FFB000">no</button>
              <button onClick="{{ reportSendTap }}" data-mzreport="send" style="padding:10px 20px;background:none;border:1px solid rgba(198,94,42,.55);cursor:pointer;font-family:'Karla',sans-serif;font-size:11.5px;color:rgba(210,120,70,.95)">yes, report</button>
            </div>
          </div>
        </sc-if>
        <sc-if value="{{ reportDoneOn }}" hint-placeholder-val="{{ false }}">
          <div data-mzreport="done" style="margin-top:12px;max-width:280px;text-align:center;font-family:'Karla',sans-serif;font-size:10.5px;line-height:1.75;color:rgba(154,138,94,.85);text-wrap:pretty">reported. the two of you are never dealt together again.</div>
        </sc-if>
        <div style="width:120px;height:1px;background:linear-gradient(90deg, transparent, rgba(240,216,154,.22), transparent);margin:16px 0 12px"></div>`],
    [`{{ turnLine }}</span>
  </div>
`,
     `{{ turnLine }}</span>
  </div>
  <sc-if value="{{ pauseBtnOn }}" hint-placeholder-val="{{ false }}">
    <button onClick="{{ pauseTap }}" data-mzpause="1" aria-label="pause" title="pause" style="position:absolute;top:30px;right:12px;z-index:8;width:44px;height:44px;background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center" style-hover="filter:brightness(1.3)">
      <span style="width:30px;height:30px;border-radius:50%;border:1px dashed rgba(154,138,94,.6);background:rgba(10,7,3,.55);display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 40 40" style="width:16px;height:16px"><g fill="rgba(216,200,156,.85)"><rect x="12" y="11" width="5" height="18" rx="1"></rect><rect x="23" y="11" width="5" height="18" rx="1"></rect></g></svg></span>
    </button>
  </sc-if>
`],
    // MZ7: doors both ways (SHIP-AUDIT-26OCT.md §4.3). The shell's home and tonight already open
    // /play/ (SS5, SS9b); these are the game's two doors back. (1) The codex: a house's page in the
    // game carries a door to the same house's page in the shell, /station/<slug>, under the house's
    // line beside its card (in view without a scroll; the rows below run past the stage's 430 px),
    // in the game's own type; the slug is the house's name with its spaces made
    // hyphens, which the build asserts against stations.js for all 28 (below). (2) The night's end:
    // beside "lobby" on the win, loss and road-lost screens a door reads "read tonight" and opens the
    // shell's tonight page, the same words as home's own door; when the house is claimed (the
    // ascended line, 4C) the door is the house's own page instead. Not on the practice walk, not on
    // a table between friends (st.duel). The click stops at the door, since the whole end screen is
    // "anywhere to deal again".
    [`<span style="font-family:'Cormorant Garamond',serif;font-size:15.5px;line-height:1.5;color:rgba(240,222,180,.95);text-wrap:pretty">{{ cdxPoem }}</span>
            </div>`,
     `<span style="font-family:'Cormorant Garamond',serif;font-size:15.5px;line-height:1.5;color:rgba(240,222,180,.95);text-wrap:pretty">{{ cdxPoem }}</span>
              <a href="{{ cdxStationHref }}" data-mzdoor="station" style="align-self:flex-start;display:inline-flex;align-items:center;min-height:30px;margin-top:2px;padding:0 2px;font-family:'Karla',sans-serif;font-size:11px;letter-spacing:.02em;color:#F0D89A;text-decoration:none;border-bottom:1px solid transparent;transition:border-color .15s ease" style-hover="border-color:rgba(240,216,154,.5)">{{ cdxStationCta }}</a>
            </div>`],
    [`      const R0 = this._rosters(), own = !!R0[m], roster = own ? R0[m] : (open ? R0[0] : []);
`,
     `      // MZ7: the house's own page in the shell, the same twenty-eight under the same names
      out.cdxStationHref = "/station/the-" + this._mName(m).replace(/\\s+/g, "-");
      out.cdxStationCta = "the " + this._mName(m) + " in star shard \\u203a";
      const R0 = this._rosters(), own = !!R0[m], roster = own ? R0[m] : (open ? R0[0] : []);
`],
    [`      <button onClick="{{ endLobbyTap }}" style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);background:none;border:1px solid rgba(240,216,154,.3);border-radius:5px;padding:7px 16px;color:#9A8A5E;font-family:'Karla',sans-serif;font-size:10.5px;cursor:pointer;z-index:9;transition:border-color .15s ease, color .15s ease" style-hover="border-color:#F0D89A;color:#F0D89A">lobby</button>
`,
     `      <div style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:9;display:flex;align-items:center;gap:10px;white-space:nowrap">
        <button onClick="{{ endLobbyTap }}" style="background:none;border:1px solid rgba(240,216,154,.3);border-radius:5px;padding:7px 16px;color:#9A8A5E;font-family:'Karla',sans-serif;font-size:10.5px;cursor:pointer;transition:border-color .15s ease, color .15s ease" style-hover="border-color:#F0D89A;color:#F0D89A">lobby</button>
        <sc-if value="{{ endReadOn }}" hint-placeholder-val="{{ false }}">
          <a href="{{ endReadHref }}" onClick="{{ endReadTap }}" data-mzdoor="tonight" style="display:inline-block;text-decoration:none;background:linear-gradient(180deg, rgba(240,216,154,.16), rgba(240,216,154,.05));border:1px solid rgba(240,216,154,.6);border-radius:5px;padding:7px 16px;color:#F0D89A;font-family:'Karla',sans-serif;font-size:10.5px;cursor:pointer;transition:border-color .15s ease, color .15s ease" style-hover="border-color:#FFFDF5;color:#FFFDF5">{{ endReadLabel }}</a>
        </sc-if>
      </div>
`],
    [`      endLobbyTap: (e) => { if (e && e.stopPropagation) e.stopPropagation(); this._clearSeq(); this._go("menu", { ...this._deckState(), deckSel: st.deckSel }); },
`,
     `      endLobbyTap: (e) => { if (e && e.stopPropagation) e.stopPropagation(); this._clearSeq(); this._go("menu", { ...this._deckState(), deckSel: st.deckSel }); },
      // MZ7: the night's end offers tonight's reading in the shell; a claimed house, its own page
      endReadOn: (st.phase === "won" || st.phase === "lost" || st.phase === "roadlost") && !st.practice && !st.duel,
      ...((asc => ({ endReadHref: asc ? "/station/the-" + this._mName(this._tonight()).replace(/\\s+/g, "-") : "/tonight", endReadLabel: asc ? "the " + this._mName(this._tonight()) + " in star shard \\u203a" : "read tonight \\u203a" }))(st.phase === "won" && !!st.road && this._mlvl(this._tonight()) >= 4)),
      endReadTap: (e) => { if (e && e.stopPropagation) e.stopPropagation(); },
`],
  ];
  let game = await readFile(gameFile, 'utf8');
  for (const [from, to] of rewrites) {
    const n = game.split(from).length - 1;
    if (n !== 1) throw new Error(`play: expected exactly one match for ${JSON.stringify(from.slice(0, 60))}, found ${n}; the game file changed, check the rewrite`);
    game = game.replace(from, to);
  }
  // MZ7: the codex door's slug is the house's name with hyphens for spaces; the shell's slugs come
  // from stations.js. Hold the two to each other for all 28 so a renamed card fails the build here,
  // not as a dead link in the game.
  {
    const pool = /const pool = \[(\[.*?\])\];/.exec(game);
    if (!pool) throw new Error('play: the game file has no card pool');
    const names = [...pool[1].matchAll(/\["([^"]+)", \d+, \d+\]/g)].map(m => m[1]);
    if (names.length !== 28) throw new Error(`play: ${names.length} card names in the pool, expected 28`);
    names.forEach((name, i) => {
      const slug = '/station/the-' + name.replace('The ', '').toLowerCase().replace(/\s+/g, '-');
      if (slug !== `/station/${index[i].slug}`) throw new Error(`play: card ${i + 1} "${name}" makes ${slug}, stations.js says /station/${index[i].slug}; the codex door would be dead`);
    });
  }
  // MZ5: the bound geometry attributes. The browser parses the raw <x-dc> template before the
  // runtime boots, and an SVG geometry attribute holding a mustache (viewBox="{{ s.artBox }}",
  // cx="{{ d.x }}", d="{{ ln.d }}", x="{{ cdxSunX }}") is invalid to that first parse: one console
  // error per site per boot, 22 sites in the September file, enough to bury a real error
  // (tools/check-manzil.mjs §5). The runtime's own attribute form takes the noise out without
  // touching what renders: an attribute written `sc-camel-view-box` is unknown to the browser's
  // SVG parse (no error, no effect) and is read by the runtime as the React prop `viewBox`
  // (support.js: CAMEL_ATTR, the same encoding the runtime applies to every camelCase attribute
  // it compiles). After hydration the element carries the real attribute, as before. The count is
  // asserted (28 attributes on 22 tags) so a new delivery that adds a site is seen here and fails
  // check-manzil on the output.
  const GEOM_SWEEP = 28;
  {
    const scriptAt = game.indexOf('<script type="text/x-dc"');
    if (scriptAt < 0) throw new Error('play: the game file has no <script type="text/x-dc"> block');
    const BOUND = /(<(?:svg|rect|circle|line|path|text|ellipse|polygon|polyline)\b[^>]*?)\s(x|y|cx|cy|r|x1|y1|x2|y2|d|rx|ry|width|height|points|viewBox)="(\{\{[^"]*\}\})"/g;
    let tmpl = game.slice(0, scriptAt), swept = 0, n;
    // a tag with two bound attributes (cx and cy; x and y) is matched once per pass: sweep until still
    do {
      n = 0;
      tmpl = tmpl.replace(BOUND, (m, head, attr, hole) => { n++; return `${head} sc-camel-${attr.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="${hole}"`; });
      swept += n;
    } while (n);
    if (swept !== GEOM_SWEEP) throw new Error(`play: swept ${swept} bound geometry attributes, expected ${GEOM_SWEEP}; the game file changed, check the sweep and tools/check-manzil.mjs §5`);
    game = tmpl + game.slice(scriptAt);
  }
  await writeFile(join(play, 'index.html'), game);
  const gz = gzipSync(Buffer.from(game), { level: 9 }).length;
  console.log(`play/: the game (${(game.length / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzipped), ${rewrites.length} rewrites, ${GEOM_SWEEP} geometry attributes swept, runtime self-hosted, 2 reference sheets, vendor/ (3 files)`);
}

// 6. sizes
async function sizeOf(file) {
  const buf = await readFile(file);
  return { raw: buf.length, gz: gzipSync(buf, { level: 9 }).length };
}
const kb = n => `${(n / 1024).toFixed(1)} KB`;
const js = await sizeOf(join(dist, 'assets', 'app.js'));
const css = await sizeOf(join(dist, 'assets', 'app.css'));
const html = await sizeOf(join(dist, 'index.html'));
console.log(`built app/dist/`);
console.log(`  assets/app.js   ${kb(js.raw)} raw, ${kb(js.gz)} gzipped`);
console.log(`  assets/app.css  ${kb(css.raw)} raw, ${kb(css.gz)} gzipped`);
console.log(`  index.html      ${kb(html.raw)} raw, ${kb(html.gz)} gzipped`);
console.log(`  first load (js + css + html) ${kb(js.gz + css.gz + html.gz)} gzipped`);
console.log(`  ${pages} html pages (${STATIC_ROUTES.length} routes + ${index.length} stations), plus privacy/ and terms/; ${ogCount} og images; sitemap.xml with ${urls.length} urls`);

// the largest inputs, for SS10's budget
const inputs = Object.entries(result.metafile.outputs[Object.keys(result.metafile.outputs).find(k => k.endsWith('app.js'))].inputs)
  .map(([file, v]) => [file, v.bytesInOutput])
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6);
console.log('  largest inputs in app.js:');
for (const [file, bytes] of inputs) console.log(`    ${kb(bytes).padStart(9)}  ${file}`);
