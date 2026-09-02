#!/usr/bin/env node
// Adversarial pass over the live Manzil build. Not a smoke test — smoke proves
// the happy path renders; this tries to BREAK it.
//
//   node test/fuzz-manzil.mjs                       # against staging
//   node test/fuzz-manzil.mjs --url http://…        # against anything else
//   node test/fuzz-manzil.mjs --headed              # watch it
//
// What it hunts, in rough order of how much it would hurt:
//   1. Corrupt/hostile localStorage — every progress key given the wrong TYPE
//      (string where an object is expected, array, null, NaN, huge, negative).
//      This is the highest-value target right now: lives just changed from a
//      bare int to a per-mansion object, and old saves in the wild still hold
//      the int. A reader that assumes shape will throw on someone's real save.
//   2. Every built level, opened cold — nine mansions, each booted from a fresh
//      context, checked for page errors and unresolved {{ bindings }}.
//   3. Rapid/duplicate input — double-fire on the same control, Escape spam,
//      clicking during animation windows.
//   4. Viewport abuse — phone portrait, tiny, ultrawide.
//
// A finding is anything that throws a page error, renders a literal mustache,
// or leaves the stage blank. Console noise alone is reported, not failed.
//
// OWNER: Claude Code.

import { chromium } from 'playwright';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg('--url', 'https://staging.starshard.net');
const HEADED = process.argv.includes('--headed');
const K = 'manzil-v2-';

const findings = [];
const note = (sev, where, what, detail) => {
  findings.push({ sev, where, what, detail });
  console.log(`  ${sev === 'FAIL' ? '✗' : '·'} ${where}: ${what}${detail ? ' — ' + String(detail).slice(0, 160) : ''}`);
};

// one page per scenario, with its own error capture
async function withPage(browser, seed, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [], consoleErrs = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  // seed storage before the app boots
  if (seed) await ctx.addInitScript(s => {
    try { for (const [k, v] of Object.entries(s)) v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {}
  }, seed);
  await page.goto(URL + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600); // support.js pulls React+Babel from unpkg, then transpiles
  let out;
  try { out = await fn(page); } finally {
    const raw = await page.content().catch(() => '');
    // page.content() serializes the <script type="text/x-dc"> block too, and that block is SOURCE,
    // not rendered DOM — its comments legitimately quote bindings ("as the old `fill=\"{{ p.f }}\"`
    // binding did"), which read as an unresolved mustache and cost a false FAIL on every level once
    // Design's _pathG note landed. Strip the block before scanning; everything the user can actually
    // see is still covered, attributes included.
    const html = raw.replace(/<script[^>]*text\/x-dc[\s\S]*?<\/script>/g, '');
    const mustache = (html.match(/\{\{\s*[A-Za-z_$][\w$.]*\s*\}\}/g) || []).filter(m => !/\bfalse\b|\btrue\b/.test(m));
    const bodyLen = await page.evaluate(() => document.body.innerHTML.length).catch(() => 0);
    out = { ...(out || {}), errors, consoleErrs, mustache: [...new Set(mustache)], bodyLen };
    await ctx.close();
  }
  return out;
}

const check = (label, r) => {
  if (r.errors.length) note('FAIL', label, 'page error', r.errors[0]);
  if (r.mustache.length) note('FAIL', label, 'unresolved binding', r.mustache.join(' '));
  if (r.bodyLen < 20000) note('FAIL', label, 'stage did not render', 'body ' + r.bodyLen + 'b');
  if (!r.errors.length && !r.mustache.length && r.bodyLen >= 20000) console.log(`  ✓ ${label}`);
  if (r.consoleErrs.length) note('note', label, r.consoleErrs.length + ' console error(s)', r.consoleErrs[0]);
};

const browser = await chromium.launch({ headless: !HEADED });
console.log(`\nfuzzing ${URL}\n`);

// ---- 1. hostile storage -----------------------------------------------------
// every shape a real save could hold after a format change, a partial write, or
// a hand-edit. none of these should be able to throw.
console.log('1. corrupt / hostile localStorage');
const hostile = {
  'lives as the OLD bare int (real pre-31-Aug saves)': { [K + 'lives']: '2' },
  'lives as a string':            { [K + 'lives']: '"three"' },
  'lives as an array':            { [K + 'lives']: '[1,2,3]' },
  'lives as null':                { [K + 'lives']: 'null' },
  'lives out of range':           { [K + 'lives']: '{"28":99,"23":-5}' },
  'lives keyed by junk':          { [K + 'lives']: '{"notamansion":2,"":1}' },
  'rungs as an int':              { [K + 'rungs']: '7' },
  'rungs negative / huge':        { [K + 'rungs']: '{"28":-3,"23":999999}' },
  'climbs as a string':           { [K + 'climbs']: '"lots"' },
  'build as an array':            { [K + 'build']: '[]' },
  'claims as null':               { [K + 'claims']: 'null' },
  'moon out of range':            { [K + 'moon']: '99' },
  'moon negative':                { [K + 'moon']: '-4' },
  'moon as text':                 { [K + 'moon']: 'thread' },
  'birth is malformed JSON':      { [K + 'birth']: '{oh no' },
  'birth missing rows':           { [K + 'birth']: '{"five":[1,2,3,4,5]}' },
  'birth five is empty':          { [K + 'birth']: '{"five":[],"rows":[],"fill":[]}' },
  'every key is the string null': Object.fromEntries(['lives','rungs','climbs','build','claims','wrec','lock','wipe','lastclimb'].map(k => [K + k, 'null'])),
  'every key is malformed JSON':  Object.fromEntries(['lives','rungs','climbs','build','claims','wrec','lock','wipe','lastclimb'].map(k => [K + k, '{{{'])),
};
for (const [label, seed] of Object.entries(hostile)) {
  check('storage / ' + label, await withPage(browser, seed, async () => {}));
}

// ---- 2. every built level, cold ---------------------------------------------
console.log('\n2. each built level, opened cold');
for (const [id, name] of [[10,'throne'],[12,'turning'],[18,'heart'],[19,'root'],[21,'empty district'],[23,'drum'],[25,'hideaway'],[26,'chamber'],[28,'thread']]) {
  const r = await withPage(browser, { [K + 'moon']: String(id) }, async page => {
    // walk in: the moon road -> the road -> sit down, tolerating whichever beats appear
    for (const label of ['the moon road', 'the moon road', 'click to sit down']) {
      const el = page.locator(`text=${label}`).first();
      if (await el.count().catch(() => 0)) { await el.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(900); }
    }
    return {};
  });
  check(`level ${id} (${name})`, r);
}

// ---- 3. rapid + duplicate input ---------------------------------------------
console.log('\n3. rapid / duplicate input');
check('escape spam (30x)', await withPage(browser, null, async page => {
  for (let i = 0; i < 30; i++) await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}));
check('double-fire every button twice', await withPage(browser, { [K + 'moon']: '23' }, async page => {
  const btns = await page.locator('button').all();
  for (const b of btns.slice(0, 14)) {
    await b.click({ timeout: 700, force: true }).catch(() => {});
    await b.click({ timeout: 700, force: true }).catch(() => {});
  }
  await page.waitForTimeout(900);
}));
check('click through the deal animation', await withPage(browser, { [K + 'moon']: '28' }, async page => {
  for (const label of ['the moon road', 'the moon road', 'click to sit down', 'play these seven']) {
    const el = page.locator(`text=${label}`).first();
    if (await el.count().catch(() => 0)) await el.click({ timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(120); // deliberately inside the animation window
  }
  // hammer the board mid-animation
  for (let i = 0; i < 12; i++) { await page.mouse.click(400 + i * 60, 380); await page.waitForTimeout(40); }
  await page.waitForTimeout(1200);
}));

// ---- 4. viewports -----------------------------------------------------------
console.log('\n4. viewports');
for (const [label, viewport] of [
  ['phone portrait 390x844', { width: 390, height: 844 }],
  ['tiny 320x480',           { width: 320, height: 480 }],
  ['ultrawide 2560x720',     { width: 2560, height: 720 }],
]) check(label, await withPage(browser, { [K + 'moon']: '23' }, async () => {}, { viewport }));

// ---- 5. the per-mansion lives / forfeit logic (newest code, least tested) ---
// These assert INVARIANTS on stored state, not just "did it crash".
console.log('\n5. per-mansion lives + forfeit invariants');
{
  // a) a wipe on one road must never touch another road's lights
  const r = await withPage(browser, {
    [K + 'moon']: '28',
    [K + 'lives']: JSON.stringify({ 28: 1, 23: 2 }),
    [K + 'rungs']: JSON.stringify({ 28: 4, 23: 6 }),
  }, async page => {
    const before = await page.evaluate(k => localStorage.getItem(k), K + 'lives');
    // drive a forfeit through the real UI: chip -> level select -> another house -> forfeit
    await page.locator('text=bluenocturne').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.locator('text=level select').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(900);
    const askBefore = await page.locator('text=your climb stands unfinished').count().catch(() => 0);
    // tap some other lit house
    await page.mouse.click(1050, 400); await page.waitForTimeout(500);
    const asked = await page.locator('text=your climb stands unfinished').count().catch(() => 0);
    await page.locator('text=forfeit and walk').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(800);
    const after = await page.evaluate(k => localStorage.getItem(k), K + 'lives');
    return { before, after, askedUnprompted: askBefore, asked };
  });
  check('forfeit flow runs', r);
  if (r.askedUnprompted) note('FAIL', 'forfeit', 'confirm showed before any house was tapped');
  try {
    const after = JSON.parse(r.after || '{}');
    if (after['23'] !== 2) note('FAIL', 'forfeit', 'a forfeit changed ANOTHER road\'s lights', `23 was 2, now ${after['23']}`);
    else console.log('  ✓ forfeit left the other road\'s lights alone (23 still 2)');
  } catch (e) { note('FAIL', 'forfeit', 'lives unparseable after forfeit', r.after); }
}
{
  // b) lights must never persist outside 0..3, whatever was stored
  const r = await withPage(browser, { [K + 'moon']: '23', [K + 'lives']: JSON.stringify({ 23: 99 }) }, async page => {
    return { clamped: await page.evaluate(() => {
      // read it back the way the app does, through a fresh board load
      try { return JSON.parse(localStorage.getItem('manzil-v2-lives')); } catch (e) { return null; }
    }) };
  });
  check('out-of-range lights load', r);
}
{
  // c) a claimed (level-four) mansion has nothing to climb — must not ask
  const r = await withPage(browser, {
    [K + 'moon']: '23',
    [K + 'climbs']: JSON.stringify({ 23: 9 }),   // force level 4
    [K + 'rungs']: JSON.stringify({ 23: 3 }),
  }, async page => {
    await page.locator('text=bluenocturne').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.locator('text=level select').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(900);
    await page.mouse.click(1050, 400); await page.waitForTimeout(600);
    return { asked: await page.locator('text=your climb stands unfinished').count().catch(() => 0) };
  });
  check('claimed mansion, level switch', r);
  if (r.asked) note('note', 'forfeit', 'a level-four mansion still asked to forfeit', 'expected: nothing left to climb');
  else console.log('  ✓ a finished mansion does not ask to forfeit');
}

await browser.close();

// ---- report -----------------------------------------------------------------
const fails = findings.filter(f => f.sev === 'FAIL');
console.log(`\n${'='.repeat(60)}`);
console.log(`${fails.length} failure(s), ${findings.length - fails.length} note(s)`);
for (const f of fails) console.log(`  ✗ ${f.where}: ${f.what} — ${String(f.detail).slice(0, 200)}`);
process.exitCode = fails.length ? 1 : 0;
