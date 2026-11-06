#!/usr/bin/env node
// steam-capsules.mjs: the Steam store and library images, from the game's own art (W3, 5 Nov 2026).
//
//   node tools/steam-capsules.mjs [--scene app/src] [--mark content/steam/mark.svg] [--fonts <dir>] [--out content/steam/capsules] [--only <name>] [--hour 0..3]
//
// STARSHARD-LAUNCH.md section 0: a drawing never stands in for a real asset. Nothing here is
// drawn. Every wide image is the lobby's street scene as app/scene-extract.mjs lifted it from
// the shipped game (app/src/scene.html, lit by the hour tables in scene.css), scaled to cover
// the asset's frame and cropped, the way the shell's home page mounts it. The wordmark is the
// game's own word in its own title face (Cormorant Garamond, the gold of the token sheet on
// the night ground), and the mark is the game file's own 200 x 200 thumbnail (the amber ring
// and the gold cross), passed in as --mark. The sizes are Steamworks' (content/steam/assets.md,
// read from the docs on 5 Nov 2026).
//
// Rendered with Playwright's Chromium at device scale 1, so each PNG is the exact pixel size.
// --fonts names a directory holding karla-latin-{400,500,600}-normal.woff2 and
// cormorant-garamond-latin-{500,600,700}-normal.woff2 (the @fontsource packages) for a machine
// that cannot reach Google Fonts; without it the page loads them from Google. Animations are
// off (reduced motion), so the frame is the scene at rest.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sceneDir = resolve(opt('--scene', join(root, 'app', 'src')));
const markPath = resolve(opt('--mark', join(root, 'content', 'steam', 'mark.svg')));
const fontsDir = opt('--fonts', null) ? resolve(opt('--fonts')) : null;
const outDir = resolve(opt('--out', join(root, 'content', 'steam', 'capsules')));
const only = opt('--only', null);
// the hour of the night for every scene image: 0 warm dusk (the default: the stall, the cat and the
// warm horizon read at capsule size), 1 full dark, 2 the small hours, 3 the hour before dawn
const hourOverride = opt('--hour', null) === null ? null : Number(opt('--hour'));

const SCENE = readFileSync(join(sceneDir, 'scene.html'), 'utf8')
  // the extract writes the stage's sky as a bare gradient list in its style attribute; name the property
  .replace(/^(<div class="mz-stage"[^>]*?style=")(radial-gradient|linear-gradient)/, '$1background:$2');
const SCENE_CSS = readFileSync(join(sceneDir, 'scene.css'), 'utf8');
const TOKENS = readFileSync(join(sceneDir, 'tokens.css'), 'utf8');
const MARK = readFileSync(markPath, 'utf8').replace('font-family="Georgia,serif"', 'font-family="Cormorant Garamond,serif" font-weight="600"');
// the mark without its own square ground, for the transparent logo and the capsules
const MARK_BARE = MARK.replace(/<rect[^>]*><\/rect>/, '').replace(/<text[\s\S]*?<\/text>/, '');
const W = 932, H = 430;

const fontFace = fontsDir
  ? [['Karla', 400, 'karla-latin-400-normal.woff2'], ['Karla', 500, 'karla-latin-500-normal.woff2'], ['Karla', 600, 'karla-latin-600-normal.woff2'],
    ['Cormorant Garamond', 500, 'cormorant-garamond-latin-500-normal.woff2'], ['Cormorant Garamond', 600, 'cormorant-garamond-latin-600-normal.woff2'], ['Cormorant Garamond', 700, 'cormorant-garamond-latin-700-normal.woff2']]
    .map(([f, w, file]) => `@font-face{font-family:'${f}';font-weight:${w};font-style:normal;src:url('${pathToFileURL(join(fontsDir, file)).href}') format('woff2')}`).join('\n')
  : `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Karla:wght@400;500;600&display=block');`;

// Each asset: the frame, the hour (0 warm dusk, 1 full dark, 2 the small hours, 3 the hour before
// dawn), how the scene sits in the frame (cover: scaled to fill, anchored by ax/ay in 0..1),
// what text it carries, and the file type.
const ASSETS = [
  { name: 'header-capsule', w: 920, h: 430, hour: 0, scene: { ax: 0.5, ay: 1 }, text: 'word', at: 'left-top', size: 88, type: 'png' },
  { name: 'small-capsule', w: 462, h: 174, hour: null, text: 'mark-word', type: 'png' },
  { name: 'main-capsule', w: 1232, h: 706, hour: 0, scene: { ax: 0.5, ay: 1 }, text: 'word', at: 'center-top', size: 150, type: 'png' },
  { name: 'vertical-capsule', w: 748, h: 896, hour: 0, scene: { ax: 0.5, ay: 1 }, text: 'word', at: 'center-top', size: 120, type: 'png' },
  { name: 'page-background', w: 1438, h: 810, hour: 1, scene: { ax: 0.5, ay: 1 }, dim: 0.55, text: null, type: 'png' },
  { name: 'library-capsule', w: 600, h: 900, hour: 0, scene: { ax: 0.5, ay: 1 }, text: 'word-sub', at: 'center-top', size: 110, type: 'png' },
  { name: 'library-header', w: 920, h: 430, hour: 0, scene: { ax: 0.5, ay: 1 }, text: 'word', at: 'left-top', size: 88, type: 'png' },
  { name: 'library-hero', w: 3840, h: 1240, hour: 0, scene: { ax: 0.5, ay: 0.85 }, text: null, type: 'png' },
  { name: 'library-logo', w: 1280, h: 720, hour: null, transparent: true, text: 'mark-word', type: 'png' },
  { name: 'app-icon', w: 184, h: 184, hour: null, text: 'mark', type: 'jpeg' },
  { name: 'shortcut-icon', w: 256, h: 256, hour: null, text: 'mark', type: 'png' },
];

function sceneBlock(a) {
  const scale = Math.max(a.w / W, a.h / H);
  const sw = W * scale, sh = H * scale;
  const x = Math.round((a.w - sw) * a.scene.ax), y = Math.round((a.h - sh) * a.scene.ay);
  const hour = hourOverride === null ? a.hour : hourOverride;
  return `<div class="scene" data-hour="${hour}" style="position:absolute;inset:0;overflow:hidden">
    <div style="position:absolute;left:${x}px;top:${y}px;width:${W}px;height:${H}px;transform-origin:0 0;transform:scale(${scale})">${SCENE}</div>
    ${a.dim ? `<div style="position:absolute;inset:0;background:rgba(4,3,2,${a.dim})"></div>` : ''}
  </div>`;
}

function textBlock(a) {
  if (!a.text) return '';
  const word = `<span class="word" style="font-size:${a.size || 100}px">manzil</span>`;
  if (a.text === 'word' || a.text === 'word-sub') {
    const pos = a.at === 'left-top'
      ? `left:${Math.round(a.w * 0.055)}px;top:${Math.round(a.h * 0.22)}px;text-align:left`
      : `left:0;right:0;top:${Math.round(a.h * (a.text === 'word-sub' ? 0.2 : 0.23))}px;text-align:center`;
    const sub = a.text === 'word-sub' ? `<span class="sub">the sky's card game</span>` : '';
    return `<div class="text" style="position:absolute;${pos}">${word}${sub}</div>`;
  }
  if (a.text === 'mark') {
    return `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">${MARK.replace('<svg ', `<svg width="${a.w}" height="${a.h}" `)}</div>`;
  }
  // mark-word: the ring beside the word, filling the frame (the small capsule and the library logo)
  const ring = Math.round(a.h * 0.62);
  const size = Math.round(a.h * 0.56);
  return `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:${Math.round(a.h * 0.08)}px">
    ${MARK_BARE.replace('<svg ', `<svg width="${ring}" height="${ring}" viewBox="60 38 80 80" `)}
    <span class="word" style="font-size:${size}px;line-height:1">manzil</span>
  </div>`;
}

function pageFor(a) {
  const ground = a.transparent ? 'transparent' : 'var(--ground), var(--ground-body)';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFace}
${TOKENS}
${SCENE_CSS}
html,body{margin:0;padding:0;background:transparent}
.frame{position:relative;width:${a.w}px;height:${a.h}px;overflow:hidden;background:${ground};font-family:var(--font-body)}
.text{z-index:2;display:flex;flex-direction:column;align-items:inherit}
.word{font-family:'Cormorant Garamond',serif;font-weight:600;color:var(--gold);letter-spacing:0.01em;line-height:1;text-shadow:0 2px 24px rgba(0,0,0,.7),0 0 48px rgba(240,216,154,.18)}
.sub{font-family:'Karla',sans-serif;font-weight:500;color:var(--ink);font-size:${Math.round((a.size || 100) * 0.2)}px;letter-spacing:0.14em;text-transform:lowercase;margin-top:${Math.round((a.size || 100) * 0.1)}px;text-shadow:0 1px 12px rgba(0,0,0,.8)}
</style></head><body><div class="frame">${a.hour === null ? '' : sceneBlock(a)}${textBlock(a)}</div></body></html>`;
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: 'reduce', viewport: { width: 4000, height: 1400 } });
const page = await ctx.newPage();
const made = [];
for (const a of ASSETS) {
  if (only && a.name !== only) continue;
  const html = pageFor(a);
  const tmp = join(outDir, `.${a.name}.html`);
  writeFileSync(tmp, html);
  await page.setViewportSize({ width: a.w, height: a.h });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const file = join(outDir, `${a.name}-${a.w}x${a.h}.${a.type === 'jpeg' ? 'jpg' : 'png'}`);
  await page.locator('.frame').screenshot({ path: file, type: a.type, omitBackground: !!a.transparent, ...(a.type === 'jpeg' ? { quality: 92 } : {}) });
  made.push(`${a.name}: ${a.w} x ${a.h} -> ${file}`);
}
await browser.close();
for (const m of made) console.log(m);
console.log(`${made.length} image(s) written to ${outDir}`);
