#!/usr/bin/env node
// Guards the deployed Manzil page against the regressions that have actually shipped.
//
//   node tools/check-manzil.mjs          # part of `npm run check`
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
// FAILURES (exit 1) are things that break the game or lose Code-owned behaviour.
// WARNINGS (exit 0) are things that only pollute the console — real, but Design's markup to fix,
// and listed so they can be handed back precisely instead of re-derived each time.

import fs from "node:fs";

const PAGE = "Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html";
const fails = [];
const warns = [];
const notes = [];

const src0 = fs.readFileSync(PAGE, "utf8");
const scriptAt = src0.indexOf('<script type="text/x-dc"');
const tagEnd = src0.indexOf(">", scriptAt);
const scriptEnd = src0.indexOf("</script>", scriptAt);
const tmpl = src0.slice(0, scriptAt) + src0.slice(scriptEnd);
const code = src0.slice(tagEnd + 1, scriptEnd);

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
    // WALKER HANDS SURVIVE A SHEET PORT. The 15 Sep walker-sheet bind rebuilt each roster row from
    // the sheet's five fields instead of merging them into the row, so `hand` — which the sheet does
    // not carry — was dropped from the two houses that author one. Every night's road then stalled
    // after the first board. The sheet is authoritative for name/fig/them/line/react/defeat/again and
    // for NOTHING ELSE: a field the roster carries that the sheet does not must be preserved.
    {
      const HANDED = ["18", "25"]; // the houses whose walkers author their own hands
      for (const h of HANDED) {
        const rows = (rosterSrc.split(new RegExp("^\\s*" + h + ":\\s*\\[", "m"))[1] || "").split(/^\s*\d+:\s*\[/m)[0];
        const n = (rows.match(/\bhand:\s*\[/g) || []).length;
        if (n !== 8) fails.push(`walker house ${h} carries ${n} hands, not 8 — a sheet port that rebuilds rows instead of merging into them drops every field the sheet does not define, and the road stalls after board one.`);
      }
      // and a partial loss inside any house is the same bug caught earlier
      let cur = null, seen = {};
      for (const line of rosterSrc.split("\n")) {
        const hh = /^\s*(\d+):\s*\[/.exec(line); if (hh) { cur = hh[1]; continue; }
        if (!/\{\s*name:\s*"/.test(line) || !cur) continue;
        seen[cur] = seen[cur] || { n: 0, hands: 0 };
        seen[cur].n++; if (/\bhand:\s*\[/.test(line)) seen[cur].hands++;
      }
      for (const [h, v] of Object.entries(seen))
        if (v.hands && v.hands !== v.n) fails.push(`walker house ${h}: ${v.hands} of ${v.n} rows carry a hand — all or none.`);
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
    // a duplicate key is a silent overwrite: report it, but brann is a known archetype/walker
    // collision that nothing currently reaches (every walker has art under their own name).
    for (const d of [...new Set(dupes)]) {
      if (d === "brann") warns.push(`_figs has two "brann" keys (the archetype figure and house 24's walker) — the later wins, so the archetype drawing is unreachable. Latent: no walker falls back to it today.`);
      else fails.push(`_figs has two "${d}" keys — the later silently wins and one walker wears the other's face.`);
    }
  }
}

// ---- 5. pre-hydration console noise (Design's markup) ----------------------------------------
// A mustache in a geometry attribute is invalid to the browser's SVG parse, which happens before
// the runtime substitutes bindings. It renders correctly afterwards — this is console pollution,
// not a break — but enough of it buries a real error.
{
  const seen = new Map();
  for (const m of tmpl.matchAll(
    /<(rect|circle|line|path|text|ellipse|polygon|polyline)\b[^>]*?\s(x|y|cx|cy|r|x1|y1|x2|y2|d|rx|ry|width|height|points|viewBox)="\{\{\s*([\w$.]+)/g))
    seen.set(`${m[1]}.${m[2]}`, (seen.get(`${m[1]}.${m[2]}`) || 0) + 1);
  for (const [k, n] of seen)
    warns.push(`${k} bound to a mustache ×${n} — invalid to the pre-hydration SVG parse (console noise only)`);
}

// ---- report ----------------------------------------------------------------------------------
for (const n of notes) console.log(`  note: ${n}`);
for (const w of warns) console.log(`  warn: ${w}`);
if (warns.length) console.log(`  (warnings are Design's markup: a bound geometry attribute is never safe — use a style\n   transform on a wrapping <g>, a static attribute, or an injected string.)`);
if (fails.length) {
  console.error(`\n✗ manzil check: ${fails.length} failure(s)\n`);
  for (const f of fails) console.error("  - " + f + "\n");
  process.exit(1);
}
console.log(`✓ manzil check — ${svgHoles.size} svg holes resolved, ${MARKERS.length} code-owned behaviours present` +
            (warns.length ? `, ${warns.length} console-noise warning(s)` : ""));
