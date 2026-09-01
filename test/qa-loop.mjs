#!/usr/bin/env node
// Visual QA pass over the gameplay loop. Walks the real loop beat by beat and,
// at each one, MEASURES rather than eyeballs:
//
//   * overlapping text — any two visible text nodes whose boxes intersect
//   * text escaping the stage — anything wider than or hanging outside 932x430
//   * clipped text — scrollWidth beyond clientWidth on a nowrap node
//   * walker variation — names, portraits and opening lines across all 8 rungs
//
// Screenshots land in --out for a human look; the measurements are the part
// that catches what eyes miss (a caption stretching its own flex item widened
// one board station from 224px to 415px and nobody saw it for a day).
//
//   node test/qa-loop.mjs                    # staging, all six levels
//   node test/qa-loop.mjs --level 23         # one level
//   node test/qa-loop.mjs --out ./shots --headed
//
// OWNER: Claude Code.

import { chromium } from 'playwright';
import fs from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg('--url', 'https://staging.starshard.net');
const OUT = arg('--out', '/tmp/manzil-qa');
const ONE = arg('--level', null);
const HEADED = process.argv.includes('--headed');
const K = 'manzil-v2-';
fs.mkdirSync(OUT, { recursive: true });

const BIRTH = JSON.stringify({
  date: '6 june 1989', time: '4:44 pm', place: 'Portland, Oregon',
  five: [6, 10, 5, 8, 9],
  rows: [{ p: 'sun', m: 6 }, { p: 'moon', m: 10 }, { p: 'mercury', m: 5 }, { p: 'venus', m: 8 }, { p: 'mars', m: 9 }],
  fill: [],
});
const findings = [];
const bad = (where, what, detail) => { findings.push({ where, what, detail }); console.log(`   ✗ ${what}${detail ? ' — ' + detail : ''}`); };

// runs IN the page: geometry checks the eye is bad at
const MEASURE = () => {
  const vis = el => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0.05 &&
           r.width > 1 && r.height > 1 && el.innerText && el.innerText.trim().length > 1;
  };
  // leaf text nodes only — a container overlapping its own child is not a bug
  const nodes = [...document.querySelectorAll('div,span,button')]
    .filter(e => ![...e.children].some(c => (c.innerText || '').trim().length > 1))
    .filter(vis);
  const box = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const txt = e => e.innerText.trim().replace(/\s+/g, ' ').slice(0, 44);

  const overlaps = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = box(nodes[i]), b = box(nodes[j]);
    if (nodes[i].contains(nodes[j]) || nodes[j].contains(nodes[i])) continue;
    const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    // require a real 2-D intersection of a few px, so kerning-level touches don't fire
    if (ox > 3 && oy > 3) overlaps.push({ a: txt(nodes[i]), b: txt(nodes[j]), ox: Math.round(ox), oy: Math.round(oy) });
  }
  const clipped = nodes.filter(e => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible')
                       .map(e => ({ t: txt(e), by: e.scrollWidth - e.clientWidth }));
  // HORIZONTAL BOUNDS ARE ADVISORY, NOT A FAILURE — twice burned.
  //   1. A stage-bounds version flagged 72 nodes that live in the letterbox margin BY DESIGN
  //      (hint text, the cast's diamonds, the sign-in link, the player chip).
  //   2. A viewport-bounds version then flagged the walker-intro panel on all six levels, held
  //      that reading across two samples 900ms apart, and survived waiting for every finite
  //      animation. It was still wrong: measured in real Chrome the same panel is centred to the
  //      pixel (centre 1152 of a 2304 viewport, nothing offscreen). Headless lays the webfont out
  //      differently, and this panel's position depends on measured text.
  // So: still measured, still printed, never fails the run. Overlap and clipping stay hard checks —
  // those caught a real one (a caption widening its board station from 224px to 415px).
  const escaped = nodes.filter(e => { const r = box(e); return r.l < -2 || r.r > innerWidth + 2; })
                       .map(e => ({ t: txt(e) }));
  return { overlaps: overlaps.slice(0, 12), clipped: clipped.slice(0, 12), escaped: escaped.slice(0, 12), textNodes: nodes.length };
};

const browser = await chromium.launch({ headless: !HEADED });

// Screens slide in. A single sample can catch a panel mid-transition and report it as
// mislaid — verified: the walker intro measured 96px off the left edge, held that reading
// across one run, and was simply gone in the next. So sample TWICE and keep only what
// survives both: a real layout bug is stable (the caption that widened a board station from
// 224px to 415px was identical in every sample), an animation frame is not.
// Wait for finite entry animations to finish. Screens slide/fade in, and a panel measured
// mid-slide reads as mislaid: the walker intro reported 96px off the left edge in headless on
// every level, while the SAME screen photographed in real Chrome is perfectly centred. Infinite
// animations (the breathing glows) never finish, so only finite ones are awaited.
async function settle(page) {
  await page.evaluate(() => Promise.race([
    Promise.all(document.getAnimations()
      .filter(a => { const t = a.effect && a.effect.getTiming(); return t && t.iterations !== Infinity; })
      .map(a => a.finished.catch(() => {}))),
    new Promise(r => setTimeout(r, 2500)),
  ])).catch(() => {});
}

async function beat(page, label, tag) {
  await page.waitForTimeout(900);
  await settle(page);
  const first = await page.evaluate(MEASURE);
  await page.waitForTimeout(900);
  await settle(page);
  const m = await page.evaluate(MEASURE);
  const stable = (a, b, key) => {
    const s1 = new Set(a.map(key)); return b.filter(x => s1.has(key(x)));
  };
  m.overlaps = stable(first.overlaps, m.overlaps, o => o.a + '|' + o.b);
  m.clipped  = stable(first.clipped,  m.clipped,  c => c.t);
  m.escaped  = stable(first.escaped,  m.escaped,  e => e.t);
  const shot = `${OUT}/${tag}.png`;
  await page.screenshot({ path: shot });
  const issues = [];
  if (m.overlaps.length) { issues.push('overlap'); m.overlaps.forEach(o => bad(label, `text overlap (${o.ox}x${o.oy}px)`, `"${o.a}" / "${o.b}"`)); }
  if (m.clipped.length)  { issues.push('clipped'); m.clipped.forEach(c => bad(label, 'text clipped', `"${c.t}" by ${c.by}px`)); }
  if (m.escaped.length)  m.escaped.forEach(e => console.log(`   · ${label}: horizontally out of bounds IN HEADLESS (advisory; verify in a real browser) — "${e.t}"`));
  if (!issues.length) console.log(`   ✓ ${label} — ${m.textNodes} text nodes, clean`);
  return m;
}


// a fresh save always owes the night-arrival note; it sits in front of the lobby and eats the
// first click. Dismiss it (the whole panel is the button) before the loop starts.
async function dismissNote(page) {
  for (let i = 0; i < 3; i++) {
    const t = await page.evaluate(() => document.body.innerText).catch(() => '');
    if (!/touch the night|NIGHT \d+ OF 28/i.test(t)) return;
    await page.mouse.click(640, 400);
    await page.waitForTimeout(700);
  }
}

const LEVELS = ONE ? [[+ONE, 'level ' + ONE]] : [[10,'throne'],[18,'heart'],[21,'district'],[23,'drum'],[25,'hideaway'],[28,'thread']];

for (const [id, name] of LEVELS) {
  console.log(`\n── ${name} (${id}) ──`);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(s => { try { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); } catch (e) {} },
    { [K + 'moon']: String(id), [K + 'lives']: '{}', [K + 'rungs']: '{}', [K + 'birth']: BIRTH, [K + 'legend']: '1' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(URL + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await dismissNote(page);

  await beat(page, 'lobby', `${id}-1-lobby`);
  await page.locator('text=the moon road').first().click({ timeout: 3000 }).catch(() => {});
  await beat(page, 'mode select', `${id}-2-mode`);
  await page.locator('text=the moon road').first().click({ timeout: 3000 }).catch(() => {});
  await beat(page, 'walker intro', `${id}-3-walker`);
  await page.locator('text=click to sit down').first().click({ timeout: 3000 }).catch(() => {});
  await beat(page, 'mulligan', `${id}-4-mulligan`);
  await page.locator('text=play these seven').first().click({ timeout: 3000 }).catch(() => {});
  await beat(page, 'board', `${id}-5-board`);

  // play one card into the middle station, then look again mid-resolution
  await page.locator('[data-mzhand]').first().click({ timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.locator('[data-mzslot]').nth(4).click({ timeout: 2500 }).catch(() => {});
  await beat(page, 'after a lodge', `${id}-6-lodge`);

  if (errs.length) bad(name, 'page error', errs[0]);
  await ctx.close();
}

// ---- walker variation: all 8 rungs of one mansion -------------------------
console.log('\n── walker variation across the eight rungs (drum) ──');
{
  const seen = [];
  for (let rung = 0; rung < 8; rung++) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript(s => { try { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); } catch (e) {} },
      { [K + 'moon']: '23', [K + 'rungs']: JSON.stringify({ 23: rung }), [K + 'lives']: '{}', [K + 'birth']: BIRTH, [K + 'legend']: '1' });
    const page = await ctx.newPage();
    await page.goto(URL + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2600);
    await dismissNote(page);
    await page.locator('text=the moon road').first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.locator('text=the moon road').first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(900);
    const info = await page.evaluate(() => {
      const t = document.body.innerText;
      const m = t.match(/^(.+?) stands on the road$/m);
      const paths = [...document.querySelectorAll('svg path')].map(p => p.getAttribute('d') || '').join('|');
      let h = 0; for (let i = 0; i < paths.length; i++) { h = (h * 31 + paths.charCodeAt(i)) | 0; }
      const line = (t.split('\n').find(l => l.length > 25 && !/stands on the road/.test(l)) || '').trim();
      return { name: m ? m[1] : null, art: h, line: line.slice(0, 60) };
    });
    await page.screenshot({ path: `${OUT}/walker-rung${rung}.png` });
    seen.push({ rung, ...info });
    await ctx.close();
  }
  seen.forEach(w => console.log(`   rung ${w.rung}: ${w.name || '(no name)'}  art#${w.art}  "${w.line}"`));
  const names = seen.map(w => w.name).filter(Boolean);
  const arts  = seen.map(w => w.art);
  if (new Set(names).size < names.length) bad('walkers', 'duplicate walker names across rungs', [...new Set(names.filter((n,i)=>names.indexOf(n)!==i))].join(', '));
  else console.log(`   ✓ ${new Set(names).size} distinct walker names`);
  if (new Set(arts).size < 3) bad('walkers', 'portraits barely vary', `${new Set(arts).size} distinct art hashes across 8 rungs`);
  else console.log(`   ✓ ${new Set(arts).size} distinct portraits`);
  const named = seen.filter(w => w.name && w.line && w.line.toLowerCase().includes(w.name.toLowerCase()));
  console.log(`   · ${named.length}/8 opening lines name their own walker`);
}

await browser.close();
console.log(`\n${'='.repeat(58)}\n${findings.length} finding(s). screenshots: ${OUT}`);
for (const f of findings) console.log(`  ✗ ${f.where}: ${f.what} — ${f.detail || ''}`);
process.exitCode = findings.length ? 1 : 0;
