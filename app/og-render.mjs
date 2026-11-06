#!/usr/bin/env node
// og-render.mjs: the station pages' link images, 1200 x 630 (SS9, 2 Nov 2026).
//
//   node app/og-render.mjs [--fonts <dir>] [--only <slug>]
//
// one JPEG per station in app/og/, drawn in the game's own language from app/src/codex.json
// and the game's station art (station-art.json): the radial night, the card's art large with
// the quarter's wash behind it, the epithet in Cormorant, the range and the keyword in Karla,
// the four names, the brand. Rendered with Playwright's Chromium, so it runs where a browser
// is (the sandbox; the Mac once `npx playwright install chromium` has run). --fonts names a
// directory holding karla-latin-{400,500,600}-normal.woff2 and
// cormorant-garamond-latin-{500,600,700}-normal.woff2 (the @fontsource packages) for a machine
// that cannot reach Google Fonts; without it the page loads them from Google.
// build.mjs copies app/og/*.jpg to dist/og/ and writes the og:image tags for the ones present.
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const fontsDir = opt('--fonts');
const only = opt('--only');

const CODEX = JSON.parse(readFileSync(join(here, 'src', 'codex.json'), 'utf8'));
const ART = JSON.parse(readFileSync(join(here, 'src', 'station-art.json'), 'utf8'));
const { house } = await import(pathToFileURL(join(here, 'src', 'house.js')).href);
const QC = { byakko: '185,198,210', suzaku: '212,90,58', seiryuu: '79,168,154', genbu: '124,138,204' };
const quarterOf = m => (m >= 14 && m <= 20 ? 'seiryuu' : m >= 7 && m <= 13 ? 'suzaku' : m >= 21 && m <= 27 ? 'genbu' : 'byakko');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fontCss() {
  if (!fontsDir) return `<link href="https://fonts.googleapis.com/css2?family=Karla:wght@400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=block" rel="stylesheet">`;
  const face = (family, file, weight) => `@font-face{font-family:'${family}';font-weight:${weight};font-display:block;src:url('${pathToFileURL(resolve(fontsDir, file)).href}') format('woff2')}`;
  return `<style>${[
    face('Karla', 'karla-latin-400-normal.woff2', 400), face('Karla', 'karla-latin-500-normal.woff2', 500), face('Karla', 'karla-latin-600-normal.woff2', 600),
    face('Cormorant Garamond', 'cormorant-garamond-latin-500-normal.woff2', 500), face('Cormorant Garamond', 'cormorant-garamond-latin-600-normal.woff2', 600), face('Cormorant Garamond', 'cormorant-garamond-latin-700-normal.woff2', 700),
  ].join('')}</style>`;
}

function html(s) {
  const q = quarterOf(s.n);
  const shapes = ART[String(s.n)] || [];
  const paths = shapes.map(p => `<path d="${esc(p.d)}" fill="${esc(p.f)}" stroke="${esc(p.s)}" stroke-width="${esc(p.w)}"${p.da && p.da !== 'none' ? ` stroke-dasharray="${esc(p.da)}"` : ''} stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const names = [s.skies.arabia.name, s.skies.india.name, s.skies.china.name, s.skies.japan.name].filter(Boolean).join(' · ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${fontCss()}<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:#040302;font-family:'Karla',sans-serif;color:#D8C89C}
  .ground{position:absolute;inset:0;background:radial-gradient(90% 120% at 50% 30%,#120D06 0%,#0A0603 55%,#050302 100%)}
  .wash{position:absolute;left:0;top:0;width:520px;height:630px;background:radial-gradient(60% 60% at 45% 45%,rgba(${QC[q]},.38),rgba(${QC[q]},.1) 60%,transparent 80%)}
  .art{position:absolute;left:70px;top:95px;width:380px;height:440px;overflow:visible;filter:drop-shadow(0 0 28px rgba(255,226,160,.4))}
  .text{position:absolute;left:520px;top:92px;right:72px}
  .eyebrow{font-size:19px;letter-spacing:.14em;text-transform:uppercase;color:#9A8A5E;margin:0 0 18px}
  h1{margin:0;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:104px;line-height:1;color:#F0D89A;text-shadow:0 0 40px rgba(255,176,0,.22)}
  .kanji{font-size:30px;color:#9A8A5E;letter-spacing:.1em;margin:18px 0 0}
  .key{margin:26px 0 0;font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:40px;line-height:1.15;color:#F2EAD6}
  .names{margin:22px 0 0;font-size:21px;line-height:1.5;color:#D8C89C}
  .brand{position:absolute;left:520px;bottom:60px;display:flex;align-items:center;gap:14px;font-size:21px;letter-spacing:.14em;text-transform:uppercase;color:#9A8A5E}
  .brand .n{display:inline-block;width:10px;height:10px;transform:rotate(45deg);border:1px solid #F0D89A;background:rgba(240,216,154,.2)}
  .hair{position:absolute;left:520px;right:72px;bottom:112px;border-top:1px solid rgba(240,216,154,.18)}
  </style></head><body>
  <div class="ground"></div><div class="wash"></div>
  <svg class="art" id="art" viewBox="0 0 100 100" aria-hidden="true">${paths}</svg>
  <div class="text">
    <p class="eyebrow">station ${s.n} of 28 · ${esc(s.position.toLowerCase())}</p>
    <h1>${esc(s.epithet.toLowerCase())}</h1>
    <p class="kanji">${esc(s.kanji || '')}</p>
    <p class="key">${esc(house(s.keyword))}</p>
    <p class="names">${esc(names)}</p>
  </div>
  <div class="hair"></div>
  <div class="brand"><span class="n"></span> star shard · the 28 stations of the moon</div>
  </body></html>`;
}

const out = join(here, 'og');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
let n = 0;
for (const s of CODEX) {
  if (only && s.slug !== only) continue;
  await page.setContent(html(s), { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // centre the art on its own ink, the game's _measureArt
    const svg = document.getElementById('art');
    const b = svg.getBBox();
    const size = Math.max(b.width, b.height) * 1.18;
    svg.setAttribute('viewBox', `${b.x + b.width / 2 - size / 2} ${b.y + b.height / 2 - size / 2} ${size} ${size}`);
  });
  await page.waitForTimeout(60);
  await page.screenshot({ path: join(out, `${s.slug}.jpg`), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  n++;
}
await browser.close();
console.log(`app/og/: ${n} images${fontsDir ? ` (fonts from ${fontsDir})` : ' (fonts from Google)'}`);
