#!/usr/bin/env node
// Guards the Manzil page against the regressions that have actually shipped.
//
//   node tools/check-manzil.mjs            # part of `npm run check`: the source file, then the
//                                          # shipped copy app/dist/play/index.html when it exists
//   node tools/check-manzil.mjs <file>     # one file, held to the shipped copy's rules
//
// WHY THIS EXISTS. Two agents write to the same <script type="text/x-dc"> block, and a Design
// delivery replaces the page rather than merging it. Five separate deliveries have now reverted the
// same crash fix, and one of those reverts reached real players: placing any card threw
// "Minified React error #31" and blanked the app. Every check either side runs by default passed —
// a load-time check, a level-open sweep, and "no console errors on a live board" all pass without
// ever placing a card, and the cast fx only exists mid-play.
//
// A note in CLAUDE.md asking people not to revert it has now failed five times. This turns that
// note into a build failure.
//
// TWO FILES, ONE RULEBOOK (MZ5, 3 Nov 2026). The page players load is app/dist/play/index.html,
// which app/build.mjs makes from the September source file with a fixed list of rewrites and the
// geometry sweep; the source file is Design's and is not edited. Everything here is a FAILURE
// (exit 1) on the shipped copy: the crash class, lost code-owned behaviour, roster drift, a
// duplicate _figs key, a bound geometry attribute, the retired reload hack. There are no warnings
// any more: the console-noise class was a warning for a year and twenty-eight of them went
// unnoticed. On the source file the last three are the build's to take out, so they are reported
// as notes with their counts (the residue the sweep is sized for), and the shipped copy is where
// they must be zero. Anything else is a failure on both.

import fs from "node:fs";

const SOURCE = "Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html";
const SHIPPED = "app/dist/play/index.html";

function check(PAGE, strict) {
const fails = [];
const notes = [];

const src0 = fs.readFileSync(PAGE, "utf8");
const scriptAt = src0.indexOf('<script type="text/x-dc"');
const tagEnd = src0.indexOf(">", scriptAt);
const scriptEnd = src0.indexOf("</script>", scriptAt);
const tmpl = src0.slice(0, scriptAt) + src0.slice(scriptEnd);
const code = src0.slice(tagEnd + 1, scriptEnd);
const residue = (what) => { if (strict) fails.push(what); else notes.push(`source residue, swept by app/build.mjs: ${what}`); };

// ---- 1. data-props must be valid JSON -------------------------------------------------------
// The dc-runtime parses this attribute; a malformed one takes the whole page down before React
// ever runs, and it is easy to break by hand-editing the tag.
{
  const m = /data-props="([^"]*)"/.exec(src0.slice(scriptAt, tagEnd + 1));
  if (!m) fails.push("the <script> tag has no data-props attribute");
  else {
    const decoded = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    try { JSON.parse(decoded); } catch (e) { fails.push("data-props is not valid JSON: " + e.message); }
  }
}

// ---- 2. THE CRASH CLASS ---------------------------------------------------------------------
// A bare {{ hole }} as a direct child of <svg> renders whatever the producer returns. If that is a
// raw array of shape objects, React throws #31 and the app goes blank. The producer must return an
// element — via _pathG, _tintArt, createElement or dangerouslySetInnerHTML.
//
// This is the exact shape of the bug that reached players on 6 Sep.
const GROUP_BUILDERS = /_pathG|_tintArt|dangerouslySetInnerHTML|createElement/;
const svgHoles = new Set();
for (const block of tmpl.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/g))
  for (const h of block[1].matchAll(/^\s*\{\{\s*([A-Za-z_$][\w$.]*)\s*\}\}\s*$/gm))
    svgHoles.add(h[1]);

// A dotted hole (s.shapes) is produced inside some other object literal; resolve on the last segment.
// Producers are written two ways in this file: as an object-literal key (`foo: ...`) and as a
// property assignment (`out.foo = ...`, which _codexVals uses). Match both — a key the checker
// cannot find is reported as unchecked, and unchecked is exactly where a crash would hide.
const producerLines = (name) => {
  const leaf = name.includes(".") ? name.split(".").pop() : name;
  const esc = leaf.replace(/\$/g, "\\$");
  const asKey = new RegExp("(^|[\\s{,(])" + esc + "\\s*:");
  const asProp = new RegExp("\\.\\s*" + esc + "\\s*=[^=]");
  return code.split("\n").filter(l => asKey.test(l) || asProp.test(l));
};

for (const hole of [...svgHoles].sort()) {
  const lines = producerLines(hole);
  if (!lines.length) { notes.push(`svg hole {{ ${hole} }} — no producer line found, not checked`); continue; }
  // Safe if ANY producer line for that key builds a group. Chains (zoomShapes <- z.shapes <-
  // _tintArt) are resolved by also accepting a line that hands off to another checked key.
  const ok = lines.some(l => GROUP_BUILDERS.test(l)) ||
             lines.some(l => /\.shapes\b|\bshapes\b/.test(l) && producerLines("shapes").some(x => GROUP_BUILDERS.test(x)));
  if (!ok) {
    fails.push(
      `CRASH RISK: <svg> renders {{ ${hole} }} directly, but its producer does not build an element.\n` +
      `          If it returns a raw array of shape objects React throws "Minified React error #31"\n` +
      `          and the page goes blank on the first card of every board.\n` +
      `          Producer: ${lines[0].trim().slice(0, 110)}\n` +
      `          Fix: wrap it — this._pathG(...) — or make the template an <sc-for> loop again.\n` +
      `          Producer and template must always change together.`);
  }
}

// ---- 3. PRODUCER / TEMPLATE AGREEMENT for the site that keeps flipping -----------------------
// castShapes has been reverted five times, in BOTH directions: the template comes back as an
// <sc-for> loop while the producer returns a group, or the reverse. Either mismatch is broken.
{
  const loop = /<sc-for list="\{\{ castShapes \}\}"/.test(tmpl);
  const hole = /\{\{ castShapes \}\}/.test(tmpl.replace(/<sc-for list="\{\{ castShapes \}\}"[^>]*>/g, ""));
  const grouped = /castShapes:\s*st\.castFx \? this\._pathG\(/.test(code);
  const raw = /castShapes:\s*st\.castFx \? this\._castFor\(/.test(code);
  if (loop && grouped) fails.push("castShapes: the template is an <sc-for> loop but the producer returns a _pathG group — the loop would iterate a React element.");
  if (hole && raw && !grouped) fails.push("castShapes: the template is a bare hole but the producer returns a RAW array — this is the #31 crash that reached players on 6 Sep.");
}

// ---- 4. CODE-OWNED BEHAVIOURS ---------------------------------------------------------------
// docs/MANZIL-CODE-OWNED-BEHAVIORS.md, as greppable markers. These live in the shared script block
// and have been silently dropped by full-file regenerations repeatedly.
const MARKERS = [
  ["the real account gate", "await this.api.me()"],
  ["age check at signup", "api.ageCheck("],
  ["real signup", "api.signup("],
  ["sign-in by username", "api.loginWithUsername("],
  ["real server-side logout", "api.logout("],
  ["chart restore", "_restoreChart("],
  ["one-time chart grab", "api.saveBirth("],
  ["rotate-to-landscape prompt", "rotateOn"],
  ["orientationchange listener", "orientationchange"],
  ["mobile touch-hold panel", "onHoldEnd"],
  ["on-station name offset", "top:74px"],
  ["_zoomFor routes through _simpleMove", "_simpleMove(cid)"],
  ["dominion tutorial pin", "st.practice && st.tutor"],
  ["walker 5-8 tally", "_advanceRound(sameRung"],
  ["per-mansion lives", "_livesMap("],
  ["forfeit confirm", "_climbing("],
  ["third-loss wipe beat", "nmBeat"],
  ["escape opens the lobby menu", "pmOpen: true"],
  ["PvP move routing", "_netPlace("],
  ["PvP queue", "queue_join"],
  ["PvP server moves", "move_confirmed"],
  ["PvP deliberate exit", "leave_match"],
  ["PvP live guard", 'mode === "live"'],
  ["timezone-correct chart", "dstInfo("],
  ["real geocoder", "_searchPlace("],
  ["webaudio sfx", "_sfxAc"],
  ["button press listener", "_sfxBtnL"],
  ["sound toggle", "manzil-v2-sound"],
  ["#fresh wipes stairseen", "stairseen"],
  ["#fresh wipes firstlight", "firstlight"],
  ["progress sync", "_syncProgress"],
  ["progress restore", "_applyProgress"],
  ["ladder handicap", "_handicapFor"],
  ["ladder caution", "_cautionsFor"],
  ["the root's law is plantOnTake", "t.by !== t.owner"],
  ["the root's tell fires on the take", "sl.by !== sl.owner"],
  ["brazier box is static", "M-4 4h8v12h-8Z"],
  ["shadowed mw renamed", "rpMw"],
  ["cast fx routes through _pathG", "_pathG(this._castFor"],
  ["the razor probes a copy", "const probe = slots.map"],
  ["the moon pick is session-only", "THE PICK LASTS THE SESSION"],
  ["walk forward to the next open house", "_nextOpen(m)"],
  ["m6 takes no handicap", "_stormRoad() ? 0 : this._handicapFor"],
  ["m6 caution reads two higher", "_stormRoad() ? 2 : 0"],
  ["a walker without a hand does not crash the seam", "nw && nw.hand"],
];
for (const [label, marker] of MARKERS)
  if (!src0.includes(marker)) fails.push(`code-owned behaviour LOST: ${label}  (marker: ${marker})`);

// ---- 4b. THE WALKER ROSTERS MUST MATCH walker-sheet.js ---------------------------------------
// A walker's name is a LOOKUP KEY in three places: the roster, `_figs` (their art) and
// `_skyMove`'s bubble maps (their voice). Design's sheet v2 renamed three walkers to resolve
// duplicate keys — an object literal with two "hessa" keys silently keeps the LAST one, so one
// house's walker was wearing another's face. Renaming in one place and not the others is
// invisible until you look at that specific walker on that specific night.
//
// Pronouns matter the same way: {them} in the copy table reads roster data, and `deal.awake`
// fires on the eighth rung, whose walker is a quiet one on most houses.
{
  const sheetSrc = fs.existsSync("walker-sheet.js") ? fs.readFileSync("walker-sheet.js", "utf8") : null;
  if (!sheetSrc) notes.push("walker-sheet.js absent — roster drift not checked");
  else {
    const unq = (x) => { try { return JSON.parse('"' + x + '"'); } catch { return x; } };
    const byHouse = (txt, re) => {
      const out = {}; let cur = null;
      for (const line of txt.split("\n")) {
        const h = /^\s*(\d+):\s*\[/.exec(line);
        if (h) { cur = h[1]; out[cur] = []; continue; }
        const m = re.exec(line);
        if (m && cur) out[cur].push([unq(m[1]), m[2] ? unq(m[2]) : ""]);
      }
      return out;
    };
    const rosterSrc = src0.slice(src0.indexOf("  _rosters() { return {"), src0.indexOf("\n  }", src0.indexOf("  _rosters() { return {")));
    const R = byHouse(rosterSrc, /\{\s*name:\s*"((?:[^"\\]|\\.)*)",\s*fig:\s*"(?:[^"\\]|\\.)*",\s*them:\s*"((?:[^"\\]|\\.)*)"/);
    const S = byHouse(sheetSrc.slice(sheetSrc.indexOf("export const WALKERS = {")), /\{\s*name:\s*"((?:[^"\\]|\\.)*)",\s*fig:\s*"(?:[^"\\]|\\.)*",\s*them:\s*"((?:[^"\\]|\\.)*)"/);
    for (const h of Object.keys(S)) {
      const a = R[h] || [], b = S[h];
      if (a.length !== b.length) { fails.push(`walker roster house ${h}: ${a.length} walkers, the sheet has ${b.length}`); continue; }
      b.forEach(([n, t], k) => {
        if (a[k][0] !== n) fails.push(`walker roster house ${h} #${k}: named "${a[k][0]}", the sheet says "${n}" — a name is a lookup key for _figs art and _skyMove bubbles; rename all three together.`);
        else if (a[k][1] !== t) fails.push(`walker "${n}" (house ${h}): pronoun "${a[k][1]}", the sheet says "${t}" — the copy table's {them} reads this.`);
      });
    }
    // WALKER HANDS SURVIVE A SHEET PORT — but WHETHER they should exist is not this file's call.
    //
    // The 15 Sep walker-sheet bind rebuilt each roster row from the sheet's five fields instead of
    // merging them into the row, so `hand` — which the sheet does not carry — was dropped, and every
    // night's road stalled after board one. The regression shape is a field vanishing from SOME rows,
    // so that is what this checks.
    //
    // IT DELIBERATELY NO LONGER DEMANDS THAT HOUSES 18/25 CARRY HANDS. Design's 17 Sep PM note calls
    // those authored hands vestigial — the hybrid their staging audit ruled out — and three nights
    // (18, 25, and 22 via the house-0 fallback) do deal her a designer-chosen five padded to seven
    // while the other 25 pad entirely from the pool. That is a rules decision with measured numbers
    // behind it, not a build invariant, and an earlier version of this check would have FAILED the
    // build on the correct fix. A check must not take a side in an open design question.
    {
      let cur = null, seen = {};
      for (const line of rosterSrc.split("\n")) {
        const hh = /^\s*(\d+):\s*\[/.exec(line); if (hh) { cur = hh[1]; continue; }
        if (!/\{\s*name:\s*"/.test(line) || !cur) continue;
        seen[cur] = seen[cur] || { n: 0, hands: 0 };
        seen[cur].n++; if (/\bhand:\s*\[/.test(line)) seen[cur].hands++;
      }
      for (const [h, v] of Object.entries(seen))
        if (v.hands && v.hands !== v.n)
          fails.push(`walker house ${h}: ${v.hands} of ${v.n} rows carry a hand — all or none. A partial loss is the signature of a sheet port that rebuilt rows instead of merging into them, which stalls the road after board one.`);
    }

    // every name must resolve to art, or the walker renders faceless
    const figSrc = src0.slice(src0.indexOf("  _figs() {"), src0.indexOf("\n  _", src0.indexOf("  _figs() {") + 12));
    const figKeys = [...figSrc.matchAll(/^\s{6}"((?:[^"\\]|\\.)*)":\s*\{/gm)].map(m => unq(m[1]));
    const K = new Set(figKeys);
    const dupes = figKeys.filter((k, i) => figKeys.indexOf(k) !== i);
    for (const [h, rows] of Object.entries(R)) {
      if (h === "0") continue;
      for (const [n] of rows) if (!K.has(n)) fails.push(`walker "${n}" (house ${h}) has no _figs entry — they render with no figure.`);
    }
    // a duplicate key is a silent overwrite. The source file has two "brann" keys (the archetype
    // figure, drawn on the walkers screen and in the house-0 roster's matches, and house 24's
    // walker, the fisher); the later wins, so the archetype's drawing was unreachable. The build
    // moves the fisher's figure under its own key, named by a figKey field on his roster entry that
    // the match readers consult first (app/build.mjs, MZ5); on the shipped copy any duplicate is a
    // failure.
    for (const d of [...new Set(dupes)]) {
      if (d === "brann") residue(`_figs has two "brann" keys (the archetype figure and house 24's walker) — the later wins and the archetype drawing is unreachable.`);
      else fails.push(`_figs has two "${d}" keys — the later silently wins and one walker wears the other's face.`);
    }
  }
}

// ---- 5. pre-hydration console noise (Design's markup) ----------------------------------------
// A mustache in a geometry attribute is invalid to the browser's SVG parse, which happens before
// the runtime substitutes bindings. It renders correctly afterwards, but every site logs one console
// error per boot, and enough of it buries a real error. `svg` was once missing from this list, which
// hid 15 of the 22 tags; a review counted 28 console errors against the 10 this file's own records
// described. A warning you cannot see is worse than no warning, so this is no longer a warning.
//
// The build takes them out: app/build.mjs writes each as the runtime's own `sc-camel-<attr>` form,
// unknown to the browser's parse and read by the runtime as the same React prop (support.js,
// CAMEL_ATTR), so the shipped copy must have none. The source file's count is reported so the sweep
// stays sized to it (GEOM_SWEEP in app/build.mjs counts attributes; this counts tags, one per match).
{
  const seen = new Map();
  for (const m of tmpl.matchAll(
    /<(svg|rect|circle|line|path|text|ellipse|polygon|polyline)\b[^>]*?\s(x|y|cx|cy|r|x1|y1|x2|y2|d|rx|ry|width|height|points|viewBox)="\{\{\s*([\w$.]+)/g))
    seen.set(`${m[1]}.${m[2]}`, (seen.get(`${m[1]}.${m[2]}`) || 0) + 1);
  let geomTotal = 0;
  for (const [k, n] of seen) {
    geomTotal += n;
    residue(`${k} bound to a mustache ×${n} — invalid to the pre-hydration SVG parse, one console error per site per boot`);
  }
  if (geomTotal && !strict) notes.push(`${geomTotal} tag(s) with a bound geometry attribute in the source; the shipped copy is held to zero.`);
  if (strict) {
    const swept = (src0.slice(0, scriptAt).match(/\ssc-camel-(x|y|cx|cy|r|x1|y1|x2|y2|d|rx|ry|width|height|points|view-box)="\{\{/g) || []).length;
    if (swept) notes.push(`${swept} geometry attribute(s) carried in the runtime's sc-camel- form (set after hydration, silent before).`);
  }
}

// ---- 6. the retired reload hack ------------------------------------------------------------------
// Lines 6-8 of the source carry __mzRetry/__mzHeal: a cache-busting re-fetch of support.js,
// manzil-art2.js and ephemeris2.js when they fail to load, written for the retired manzil/
// subdirectory deploy that lacked two of them. Every file the shipped page loads is copied beside it
// by the build, and a missing one is a build failure, so the shipped copy must load the runtime
// plainly (research/audits/manzil-sept-audit-26oct.md; BACKLOG MZ5).
{
  const hits = (src0.match(/__mzRetry|__mzHeal/g) || []).length;
  if (hits) residue(`the __mzRetry/__mzHeal reload hack is present (${hits} reference(s)) — the shipped page loads its scripts plainly.`);
  if (/<script src="\.\/support\.js"[^>]*onerror=/.test(src0)) residue(`support.js is loaded with an onerror retry.`);
}

return { fails, notes, svgHoles: svgHoles.size, markers: MARKERS.length };
}

// ---- run -----------------------------------------------------------------------------------------
const arg = process.argv[2];
const runs = arg ? [[arg, true]] : [[SOURCE, false], ...(fs.existsSync(SHIPPED) ? [[SHIPPED, true]] : [])];
let failed = 0;
for (const [file, strict] of runs) {
  if (!fs.existsSync(file)) { console.error(`✗ manzil check: ${file} does not exist`); failed++; continue; }
  const r = check(file, strict);
  console.log(`${strict ? "shipped" : "source "}  ${file}`);
  for (const n of r.notes) console.log(`  note: ${n}`);
  if (r.fails.length) {
    console.error(`\n✗ manzil check: ${r.fails.length} failure(s) in ${file}\n`);
    for (const f of r.fails) console.error("  - " + f + "\n");
    failed++;
    continue;
  }
  console.log(`✓ manzil check — ${r.svgHoles} svg holes resolved, ${r.markers} code-owned behaviours present, 0 warnings${strict ? ", 0 bound geometry attributes, no duplicate _figs key, no reload hack" : ""}`);
}
if (!arg && !fs.existsSync(SHIPPED)) console.log(`  note: ${SHIPPED} is absent, so the shipped copy was not checked; npm --prefix app run build:app makes it.`);
if (failed) process.exit(1);
