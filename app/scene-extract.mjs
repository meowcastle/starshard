// scene-extract.mjs: lifts the lobby's street scene out of the shipped game file and writes it
// as a static fragment the shell can mount (SS5, 1 Nov 2026).
//
// STARSHARD-LAUNCH.md section 0 rule 1: a drawing never stands in for a real asset; the home
// page reuses V2's own SVG scenes. So nothing here is drawn. The script reads
// "Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html", takes the three blocks of the
// lobby stage that are on screen at street level (the sky and ground layers, the district's
// far / mid / near / walls / overhead bands, and the hour layers: warm, veil, stars, windows,
// lamps, dawn, the street's life and set pieces), and resolves every `{{ xStyle }}` binding
// the way the game's own renderVals does at elevation 0 on a generic night. Values that
// depend on the hour of the night (the game's four walk steps: dusk, full dark, the small
// hours, the hour before dawn) become CSS custom properties, set per hour by scene.css, so the
// shell can light the scene from the real clock.
//
// Layers whose opacity is 0 at street level on every night (the tower, the bridge, the high
// clouds, the lit windows of a claimed house, the milky way, the aurora, the climb's stars) are
// left out: they are invisible there, and they are the biggest SVGs in the block.
//
// Usage: node app/scene-extract.mjs            (from the repo root; paths below are relative)
// Output: app/src/scene.html (the fragment), app/src/scene.css (keyframes + hour tables).
// Re-run whenever the game file changes; the build does not run it (the fragment is checked in
// beside the sources so the build never depends on the 1.8 MB game file).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = process.argv[2] || join(ROOT, 'Star Shard v3 Build Plan', 'Manzil - Game Prototype V2.dc.html');
const OUT_HTML = process.argv[3] || join(HERE, 'src', 'scene.html');
const OUT_CSS = process.argv[4] || join(HERE, 'src', 'scene.css');

const text = readFileSync(SRC, 'utf8');
const lines = text.split('\n');
const find = (needle, from = 0) => { const i = lines.findIndex((l, k) => k >= from && l.includes(needle)); if (i < 0) throw new Error('not found: ' + needle); return i; };

// The stage: its own background gradient is the sky.
const stageLine = lines[find('data-mzstage="1"')];
const stageBg = stageLine.match(/background:([^;]*(?:;|$))/) && stageLine.match(/;background:(.*?);\{\{ cineTf \}\}/)[1];
if (!stageBg) throw new Error('stage background not found');

// 1. the sky and ground layers: from elevAir down to the end of the high-cloud block, just
//    before the district band begins.
const skyStart = find('<div style="{{ elevAirStyle }}"></div>');
const districtStart = find('<sc-if value="{{ districtOn }}" hint-placeholder-val="{{ true }}"><div style="{{ edFarStyle }}">');
// 2. the district: far / bridge / tower / mid / near / walls / overhead, to the sc-if that ends
//    it (the next sc-if opens the dormant void art).
const voidStart = find('<sc-if value="{{ voidOn }}"', districtStart);
// 3. the hour layers: warm / veil / stars / windows / lamps / dawn, then the street's life and
//    the four set pieces inside their own districtOn block, ending before the listener's set.
const hourStart = find('<div style="{{ hourWarmStyle }}"></div>');
const listenerStart = find('<sc-if value="{{ listenerOn }}"', hourStart);

const sky = lines.slice(skyStart, districtStart).join('\n');
const district = lines.slice(districtStart, voidStart).join('\n');
const hours = lines.slice(hourStart, listenerStart).join('\n');

// sc-if handling: a block whose value is true (districtOn, true) is unwrapped; any other block
// is removed whole, nesting respected. sc-for is only used for the climb's star list here, and
// that list is invisible at street level (starDim opacity 0), so it is removed with its block.
function stripScIf(html, keep) {
  let out = '';
  let i = 0;
  const openRe = /<sc-if value="\{\{ ([a-zA-Z0-9_]+) \}\}"[^>]*>/g;
  while (i < html.length) {
    openRe.lastIndex = i;
    const m = openRe.exec(html);
    if (!m) { out += html.slice(i); break; }
    out += html.slice(i, m.index);
    // find the matching close
    let depth = 1, j = m.index + m[0].length;
    const tagRe = /<sc-if\b[^>]*>|<\/sc-if>/g;
    tagRe.lastIndex = j;
    let t, end = -1, closeLen = 0;
    while ((t = tagRe.exec(html))) {
      if (t[0].startsWith('</')) { depth--; if (depth === 0) { end = t.index; closeLen = t[0].length; break; } }
      else depth++;
    }
    if (end < 0) throw new Error('unbalanced sc-if for ' + m[1]);
    const inner = html.slice(j, end);
    if (keep.has(m[1])) out += stripScIf(inner, keep);
    i = end + closeLen;
  }
  return out;
}
const KEEP = new Set(['districtOn', 'true']);

// The game's own numbers at elevation 0 (its _elevSpec): the street.
const ev = { e: 0, air: 1, day: 1, gh: 98, go: 1, sd: 0, wo: 0 };
const A = 'position:absolute;inset:0;pointer-events:none;';
const T = 'transition:opacity 1.6s ease;';
// Hour-dependent values are CSS custom properties; the per-hour table is in scene.css below.
const STYLES = {
  // sky and ground
  elevAirStyle: A + T + 'opacity:1;background:radial-gradient(78% 38% at 50% 106%, rgba(255,198,116,.19), transparent 62%), linear-gradient(to top, rgba(255,166,72,.13) 0%, rgba(198,118,66,.09) 14%, rgba(122,88,134,.06) 32%, transparent 54%)',
  edDuskStyle: A + T + 'opacity:0;background:linear-gradient(to top, rgba(196,92,66,.16) 0%, rgba(186,84,110,.13) 22%, rgba(122,66,134,.09) 46%, transparent 68%)',
  edColdStyle: A + T + 'opacity:var(--mz-cold);background:linear-gradient(to bottom, rgba(24,36,84,.34) 0%, rgba(30,46,98,.2) 26%, rgba(52,88,150,.07) 52%, transparent 74%)',
  elevDayStyle: A + T + 'opacity:1;background:radial-gradient(10% 17% at 74% 71%, rgba(255,240,198,.9), rgba(255,208,120,.38) 42%, transparent 72%), linear-gradient(to top, rgba(255,206,128,.30) 0%, rgba(210,160,108,.20) 26%, rgba(134,126,162,.15) 58%, rgba(98,106,150,.12) 100%)',
  elevGroundStyle: 'position:absolute;left:0;right:0;bottom:0;pointer-events:none;height:98px;opacity:1;background:linear-gradient(to top, #090603 0%, #0C0805 58%, rgba(62,44,24,.9) 100%)',
  elevRimStyle: 'position:absolute;left:0;right:0;height:1px;pointer-events:none;bottom:98px;opacity:1;background:linear-gradient(to right, transparent, rgba(255,190,120,.4) 22%, rgba(255,214,150,.62) 50%, rgba(255,190,120,.4) 78%, transparent)',
  edGridStyle: 'position:absolute;left:0;right:0;bottom:0;height:120px;pointer-events:none;' + T + 'opacity:var(--mz-grid)',
  // the district at street level
  edFarStyle: 'position:absolute;left:0;right:0;height:64px;pointer-events:none;bottom:92px;opacity:.75',
  edMidStyle: 'position:absolute;left:0;right:0;height:96px;pointer-events:none;bottom:84px;opacity:.95',
  edNearStyle: 'position:absolute;left:0;right:0;height:150px;bottom:-4px;pointer-events:none;opacity:.95',
  edWallLStyle: 'position:absolute;left:0;top:0;width:250px;height:430px;pointer-events:none;z-index:3;opacity:1',
  edWallRStyle: 'position:absolute;right:0;top:0;width:250px;height:430px;pointer-events:none;z-index:3;opacity:1',
  edOverStyle: 'position:absolute;left:0;right:0;top:0;height:150px;pointer-events:none;opacity:1',
  // the hour layers (the game's _hourStyles at hs = the hour, e = 0, a generic night)
  hourWarmStyle: 'position:absolute;left:0;right:0;bottom:0;height:54%;pointer-events:none;z-index:4;' + T + 'opacity:var(--mz-warm);background:linear-gradient(to top, rgba(220,124,54,.34), rgba(198,94,42,.1) 34%, transparent 72%)',
  // the veil's gradient changes with the hour as well as its opacity: four layers, one lit at a time
  hourVeilStyle: A + T + 'z-index:4;opacity:var(--mz-veil0);background:linear-gradient(rgba(10,18,46,.4), rgba(10,18,46,.4))"></div>'
    + '<div style="' + A + T + 'z-index:4;opacity:var(--mz-veil1);background:linear-gradient(to bottom, rgba(10,20,52,.42) 0 30%, rgba(6,12,34,.72) 68%, rgba(3,7,20,.9))"></div>'
    + '<div style="' + A + T + 'z-index:4;opacity:var(--mz-veil2);background:linear-gradient(to bottom, rgba(4,8,24,.6) 0 26%, rgba(2,4,14,.86) 66%, rgba(1,2,8,.96))"></div>'
    + '<div style="' + A + T + 'z-index:4;opacity:var(--mz-veil3);background:linear-gradient(to bottom, rgba(24,40,78,.6) 0 24%, rgba(58,84,120,.42) 60%, rgba(140,148,150,.3))',
  hourStarStyle: A + T + 'z-index:4;opacity:var(--mz-stars)',
  hourWinStyle: 'position:absolute;left:0;right:0;height:96px;pointer-events:none;z-index:2;' + T + 'bottom:84px;opacity:var(--mz-win)',
  hourLampStyle: A + T + 'z-index:4;opacity:var(--mz-lamp)',
  hourDawnStyle: A + T + 'z-index:4;opacity:var(--mz-dawn)',
  towerWinStyle: T + 'opacity:var(--mz-towerwin)',
  setDuskStyle: A + T + 'opacity:var(--mz-set0)',
  setShutStyle: A + T + 'opacity:var(--mz-set1)',
  setRainStyle: A + T + 'opacity:var(--mz-set2)',
  setWakeStyle: A + T + 'opacity:var(--mz-set3)',
  lifeWalkStyle: A + T + 'opacity:var(--mz-set1)',
  lifeCatStyle: A + T + 'opacity:var(--mz-set1)',
  lifeEyesStyle: A + T + 'opacity:var(--mz-set2)',
  lifeDawnStyle: A + T + 'opacity:var(--mz-set3)',
  // the street's small life: on or off by the hour, through a data attribute scene.css reads
  catStyle: T + 'opacity:var(--mz-cat)',
  ratStyle: 'opacity:var(--mz-rat);animation:var(--mz-rat-anim)',
  pigeonStyle: T + 'opacity:var(--mz-pigeon);animation:var(--mz-pigeon-anim)',
  winAStyle: T + 'opacity:var(--mz-wina);animation:var(--mz-wina-anim)',
  winBStyle: T + 'opacity:var(--mz-winb);animation:var(--mz-winb-anim)',
  stillCls: '',
};

function resolve(html, label) {
  let out = html.replace(/\{\{ ([a-zA-Z0-9_]+) \}\}/g, (m, k) => {
    if (k in STYLES) return STYLES[k];
    throw new Error(label + ': unresolved binding ' + k);
  });
  return out;
}

// Drop whole layers that are invisible at street level, by their binding name, before resolving.
function dropLayer(html, binding) {
  const openRe = new RegExp('<div[^>]*style="\\{\\{ ' + binding + ' \\}\\}"[^>]*>');
  let m;
  while ((m = openRe.exec(html))) {
    const i = m.index;
    // find the matching </div> for this div
    let depth = 0, j = i;
    const re = /<div\b|<\/div>/g;
    re.lastIndex = i;
    let t, end = -1;
    while ((t = re.exec(html))) {
      if (t[0] === '<div') depth++; else { depth--; if (depth === 0) { end = t.index + 6; break; } }
    }
    if (end < 0) throw new Error('unbalanced div for ' + binding);
    html = html.slice(0, i) + html.slice(end);
  }
  return html;
}
const INVISIBLE = ['starDimStyle', 'edMilkyStyle', 'edStars2Style', 'edAuroraStyle', 'edLitStyle', 'edCloudBStyle', 'edBridgeStyle', 'edTowerStyle', 'avApproachStyle', 'elevWorldStyle'];

let skyH = stripScIf(sky, KEEP);
for (const b of INVISIBLE) skyH = dropLayer(skyH, b);
let districtH = stripScIf(district, KEEP);
for (const b of INVISIBLE) districtH = dropLayer(districtH, b);
let hoursH = stripScIf(hours, KEEP);

skyH = resolve(skyH, 'sky');
districtH = resolve(districtH, 'district');
hoursH = resolve(hoursH, 'hours');

// Inline event hooks and ids never ride along (the fragment is mounted as static markup).
const clean = s => s.replace(/\s(onClick|onMouseEnter|onMouseLeave|data-mzmark)="[^"]*"/g, '').replace(/\n\s*\n/g, '\n');

const fragment = '<div class="mz-stage" aria-hidden="true" style="' + stageBg.replace(/"/g, '&quot;') + '">\n'
  + clean(skyH) + '\n' + clean(districtH) + '\n' + clean(hoursH) + '\n</div>\n';

// Keyframes: every animation the fragment names, lifted from the game's own stylesheet.
const names = new Set();
for (const m of fragment.matchAll(/animation:\s*([a-zA-Z0-9_]+)\s/g)) names.add(m[1]);
for (const m of fragment.matchAll(/animation:([a-zA-Z0-9_]+)\s/g)) names.add(m[1]);
const styleBlock = text.slice(text.indexOf('<style>'), text.indexOf('</style>'));
const keyframes = [];
for (const n of [...names].sort()) {
  const re = new RegExp('@keyframes ' + n + '\\{[^]*?\\}\\s*\\}', 'g');
  const m = styleBlock.match(re);
  if (!m) throw new Error('keyframes not in the game stylesheet: ' + n);
  keyframes.push(m[0].replace(/\s+/g, ' '));
}
// plus the ones the hour table sets through variables
for (const n of ['mzRat', 'mzPigeon', 'mzWindow', 'mzBreathe']) {
  if (names.has(n)) continue;
  const m = styleBlock.match(new RegExp('@keyframes ' + n + '\\{[^]*?\\}\\s*\\}'));
  if (!m) throw new Error('keyframes not in the game stylesheet: ' + n);
  keyframes.push(m[0].replace(/\s+/g, ' '));
}

// The hour table: the game's four steps, as its _hourStyles and the street's life set them.
const HS = [
  // hs 0: dusk                    hs 1: full dark   hs 2: the small hours   hs 3: the hour before dawn
  { warm: .38, veil: [0, 0, 0, 0], stars: .06, win: .16, lamp: .1, dawn: 0, towerwin: .45, set: [1, 0, 0, 0], cat: 1, rat: 0, ratAnim: 'none', pigeon: 1, pigeonAnim: 'mzPigeon 12s ease-in-out infinite', wina: 1, winaAnim: 'mzWindow 17s ease-in-out infinite', winb: 0, winbAnim: 'none', cold: 0, grid: .4 },
  { warm: .06, veil: [0, .82, 0, 0], stars: 1, win: 1, lamp: 1, dawn: 0, towerwin: 1, set: [0, 1, 0, 0], cat: 0, rat: 1, ratAnim: 'mzRat 26s linear infinite', pigeon: 0, pigeonAnim: 'none', wina: 0, winaAnim: 'none', winb: 1, winbAnim: 'mzWindow 23s ease-in-out infinite', cold: .3, grid: .52 },
  { warm: 0, veil: [0, 0, .95, 0], stars: 1, win: .3, lamp: .5, dawn: 0, towerwin: .26, set: [0, 0, 1, 0], cat: 0, rat: 1, ratAnim: 'mzRat 26s linear infinite', pigeon: 0, pigeonAnim: 'none', wina: 0, winaAnim: 'none', winb: .3, winbAnim: 'none', cold: .52, grid: .2 },
  { warm: .18, veil: [0, 0, 0, .6], stars: .28, win: .58, lamp: .18, dawn: 1, towerwin: .68, set: [0, 0, 0, 1], cat: 1, rat: 0, ratAnim: 'none', pigeon: .8, pigeonAnim: 'mzPigeon 9s ease-in-out infinite', wina: 0, winaAnim: 'none', winb: .3, winbAnim: 'none', cold: .34, grid: .112 },
];
const hourCss = HS.map((h, i) => `.scene[data-hour="${i}"] .mz-stage{--mz-warm:${h.warm};--mz-veil0:${h.veil[0]};--mz-veil1:${h.veil[1]};--mz-veil2:${h.veil[2]};--mz-veil3:${h.veil[3]};--mz-stars:${h.stars};--mz-win:${h.win};--mz-lamp:${h.lamp};--mz-dawn:${h.dawn};--mz-towerwin:${h.towerwin};--mz-set0:${h.set[0]};--mz-set1:${h.set[1]};--mz-set2:${h.set[2]};--mz-set3:${h.set[3]};--mz-cat:${h.cat};--mz-rat:${h.rat};--mz-rat-anim:${h.ratAnim};--mz-pigeon:${h.pigeon};--mz-pigeon-anim:${h.pigeonAnim};--mz-wina:${h.wina};--mz-wina-anim:${h.winaAnim};--mz-winb:${h.winb};--mz-winb-anim:${h.winbAnim};--mz-cold:${h.cold};--mz-grid:${h.grid}}`).join('\n');

const css = `/* scene.css: generated by app/scene-extract.mjs from the shipped game file. Do not edit; re-run the script.
   The keyframes are the game's own; the hour table is its _hourStyles at street level. */
.mz-stage{position:relative;width:932px;height:430px;overflow:hidden;font-family:'Karla',sans-serif}
.mz-stage *{pointer-events:none}
${keyframes.join('\n')}
${hourCss}
@media (prefers-reduced-motion: reduce){.mz-stage *{animation:none !important}}
`;

writeFileSync(OUT_HTML, fragment);
writeFileSync(OUT_CSS, css);
const svgs = (fragment.match(/<svg\b/g) || []).length;
console.log(`scene.html ${fragment.length} bytes, ${svgs} svg scenes, ${names.size} animations; scene.css ${css.length} bytes`);
console.log('from ' + SRC);
