#!/usr/bin/env node
// Star Shard — generates the 28 mansion OG images (1200x630 PNGs).
//
//   node tools/build-mansion-images.mjs
//
// Real generated art in the site's real visual language (design-system
// card-context tokens), not a placeholder and not fabricated illustration —
// see the plan note in OWNERSHIP.md on why this exists instead of
// commissioned art. One-time script; output is committed. Requires
// Playwright (already a devDependency for the smoke tests).
//
// OWNER: Claude Code.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { mansions } from './build-mansions.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'mansions', 'og');
fs.mkdirSync(OUT_DIR, { recursive: true });

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII'];

// Landscape OG composition in card-context colors (confirmed hex values from
// design-system/src/tokens/colors.css: surface #102828, surface-sunken
// #0A1C1C, ink #F8F8F0, ink-accent #F878A8, ink-warn #F8F0C8, edge #2A5450).
// Not the portrait TarotCard frame — wrong aspect ratio for a 1200x630 share
// image — a landscape composition in the same palette instead.
function cardHtml(m) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&family=Pixelify+Sans:wght@600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{
    background:radial-gradient(130% 130% at 20% 15%,#1A3A38 0%,#102828 55%,#0A1C1C 100%);
    display:flex;align-items:center;justify-content:space-between;
    padding:0 76px;font-family:'Varela Round',sans-serif;
  }
  .numeral{font-family:'Baloo 2',cursive;font-weight:800;font-size:280px;color:#F8F0C8;line-height:1;opacity:.92}
  .right{flex:1;padding-left:56px;border-left:2px solid #2A5450;height:420px;display:flex;flex-direction:column;justify-content:center}
  .eyebrow{font-family:'Pixelify Sans',monospace;font-size:20px;letter-spacing:.22em;color:#A8E0DC;text-transform:uppercase;margin-bottom:18px}
  .name{font-family:'Baloo 2',cursive;font-weight:800;font-size:64px;color:#F8F8F0;line-height:1.05;margin-bottom:14px}
  .kanji{font-size:30px;color:#F878A8;margin-bottom:22px}
  .wordmark{font-family:'Pixelify Sans',monospace;font-size:18px;letter-spacing:.14em;color:#A8E0DC;text-transform:uppercase}
</style></head>
<body>
  <div class="numeral">${ROMAN[m.id - 1]}</div>
  <div class="right">
    <div class="eyebrow">station ${m.id} of 28 · manāzil al-qamar</div>
    <div class="name">${m.epithet}</div>
    ${m.kanji ? `<div class="kanji">${m.kanji}</div>` : ''}
    <div class="wordmark">☾ star shard · 28 lunar mansions</div>
  </div>
</body></html>`;
}

const browser = await chromium.launch();
// deviceScaleFactor explicit — the default-1 assumption is exactly how most
// "1200x630" OG images accidentally ship as 2400x1260.
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

for (const m of mansions) {
  await page.setContent(cardHtml(m), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready); // avoid baking in fallback-font renders
  // No fullPage, no clip — the 1200x630 viewport IS the frame; body has
  // overflow:hidden so anything that doesn't fit is clipped, not stretched.
  // JPEG, not PNG: the card is a radial gradient (photographic-ish tonal
  // range), which PNG compresses poorly — ~200KB/image vs. ~25-35KB as JPEG
  // at quality 90, with no visible difference. Standard for OG images too.
  await page.screenshot({ path: path.join(OUT_DIR, `${m.slug}.jpg`), type: 'jpeg', quality: 90 });
  console.log(`  ${m.slug}.jpg`);
}

await browser.close();
console.log(`generated ${mansions.length} OG images in mansions/og/`);
