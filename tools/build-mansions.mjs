#!/usr/bin/env node
// Star Shard — generates the 28 mansion permalink pages (+ index + sitemap).
//
//   node tools/build-mansions.mjs
//
// One-time generator, same category as tools/vendor-astronomy.mjs: no build
// step for the deployed site, just a script whose committed OUTPUT ships.
// The generated files (mansions/*.html, mansions/index.html, sitemap.xml)
// are "never hand-edit" — see OWNERSHIP.md. Re-run this script to update
// them; don't touch the HTML directly.
//
// Sources: research/mansions-table.json (structured data, all 28) +
// research/mansions-batch{1,2,3,4}.md + research/mansions-pilot.md (prose,
// all 28 as of batch4). Epithets are hand-transcribed below, NOT parsed —
// see the header comment on MANSION_EPITHETS for why that's deliberate.
//
// OWNER: Claude Code.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const RESEARCH = path.join(ROOT, 'research');
const OUT = path.join(ROOT, 'mansions');
const SITE_URL = 'https://starshard.net';

// Hand-transcribed, not parsed. Confirmed against source during planning:
// mansions-batch1.md's "Pilot retitles to v3" note says #10 should be "The
// Throne" and #24 "The Void," but mansions-pilot.md's own headings never
// actually got renamed (#10 literally reads "Hotohori · 'the star'", #24
// "Tomite · 'the void where the luck lands'") — a parser pulling the quoted
// gloss would silently mistitle the two highest-lore-value mansions. Worse,
// #22/23/25/26/27/28 originally had NO heading anywhere (their only names
// were a single prose aside closing mansions-batch3.md) until
// mansions-batch4.md landed with real entries — independently confirmed
// this table's names against batch4's actual headings too.
const MANSION_EPITHETS = [
  'The Gate', 'The Bearer', 'The Gathered Stars', 'The Follower', 'The Blaze',
  'The Storm', 'The Return', 'The Ghost', 'The Glance', 'The Throne',
  'The Mane', 'The Turning', 'The Hand', 'The Jewel', 'The Veil',
  'The Claws', 'The Crown', 'The Heart', 'The Root', 'The Flock',
  'The Empty District', 'The Listener', 'The Drum', 'The Void',
  'The Hideaway', 'The Chamber', 'The Guide', 'The Thread',
];

const SKY_NAMES = ['Arabia', 'India', 'China', 'Japan'];

const slugify = epithet => epithet.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// -- structured data (all 28) -------------------------------------------------

const table = JSON.parse(fs.readFileSync(path.join(RESEARCH, 'mansions-table.json'), 'utf8'));
const byId = new Map(table.map(r => [r.id, r]));

// -- prose (all 28, across 5 source files with 2 real format variants) -------

const PROSE_FILES = ['mansions-batch1.md', 'mansions-batch2.md', 'mansions-batch3.md', 'mansions-batch4.md', 'mansions-pilot.md'];

/** Splits a source file into per-mansion raw text blocks keyed by id. */
function splitEntries(text) {
  const blocks = new Map();
  const headingRe = /^##\s+#(\d+)\s*[·.]/gm;
  const matches = [...text.matchAll(headingRe)];
  for (let i = 0; i < matches.length; i++) {
    const id = Number(matches[i][1]);
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    blocks.set(id, text.slice(start, end));
  }
  return blocks;
}

/** Table rows keyed by sky name, not position — the four source files use
 * at least three different row orderings between them (confirmed during
 * planning), so position-based extraction is not viable. */
function parseCrossCultural(block) {
  const rows = [];
  const tableRe = /\|\s*([A-Za-z*]+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/gm;
  for (const m of block.matchAll(tableRe)) {
    const skyRaw = m[1].replace(/\*/g, '').trim();
    const sky = SKY_NAMES.find(s => s.toLowerCase() === skyRaw.toLowerCase());
    if (!sky) continue; // header row, separator row, or a table this isn't
    const name = stripEditorialFlags(m[2]).replace(/\*/g, '').trim();
    const meaning = stripEditorialFlags(m[3]).replace(/\*/g, '').trim();
    if (name === 'Name' && meaning === 'Meaning') continue; // header row
    if (/^-+$/.test(name)) continue; // separator row
    rows.push({ sky, name, meaning });
  }
  // keep first occurrence per sky (defends against a stray matching line)
  const seen = new Set();
  return rows.filter(r => (seen.has(r.sky) ? false : (seen.add(r.sky), true)));
}

function extractBlockquote(block, labelRe) {
  const m = block.match(labelRe);
  if (!m) return '';
  const rest = block.slice(m.index + m[0].length);
  const lines = [];
  for (const line of rest.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) lines.push(trimmed.replace(/^>\s?/, ''));
    else if (lines.length) break; // blockquote ended
  }
  return lines.join(' ').trim();
}

// Several fields (Position/Stars especially) sit on the SAME source line as
// the next field ("**Position:** ... · **Stars:** ...") and/or wrap across a
// line break mid-value — confirmed both happen, sometimes in the same entry.
// So the real stop boundary is "the next known field label", not "the next
// newline" or "the next bolded text" (prose bolds random words too, e.g.
// "**including Regulus**"). Strip stray bold markers after capture.
// "**Match: STRONG**" wraps label AND value in one bold span (no separate
// closing "**" after just the label), unlike Position/Stars/FY's "**Label:**
// value" — so the stop boundary can't assume a consistent close-bold-then-
// colon shape. Stop at the next "**Label" token, full stop, regardless of
// how its own bold/colon wrapping continues.
const FIELD_LABELS = ['Position', 'Stars', 'FY', 'Match'];
// `[VERIFY ...]`/`[THIN]`/`[HISTORY-ONLY]`/`[NEEDS-HUMAN ...]` are internal
// editorial review flags for whoever ships the content, not reader-facing
// copy — the blanket "presented as history, never as practice" line in the
// page's own sources footer already covers what [HISTORY-ONLY] exists to
// flag. Add new flag names to this alternation as the research process
// introduces them.
const stripEditorialFlags = s => s.replace(/`?\[(?:VERIFY|THIN|HISTORY-ONLY|NEEDS-HUMAN)[^\]]*\]`?/gi, '');
const clean = s => stripEditorialFlags(s).replace(/\*/g, '').replace(/\s+/g, ' ').replace(/[·\-–—:]\s*$/, '').trim();
function captureField(block, label) {
  const stopLabels = FIELD_LABELS.filter(l => l !== label).join('|');
  // Stop at: a known field label anywhere, OR a new line that starts a bolded
  // aside (e.g. "**The wheel's last station**" — a one-off closing remark,
  // not a field, in mansion #28's entry), OR a blank line, OR end.
  const re = new RegExp(`\\*\\*${label}[^:*]*:\\*\\*\\s*([\\s\\S]+?)(?:\\*\\*(?:${stopLabels})\\b|\\n\\*\\*|\\n\\n|$)`);
  const m = block.match(re);
  return m ? clean(m[1]) : '';
}

function parseEntry(id, block) {
  const position = captureField(block, 'Position');
  const stars = captureField(block, 'Stars');
  const birthEntry = extractBlockquote(block, /\*\*Birth entry[^:]*:\*\*/);
  const dailyCrossing = extractBlockquote(block, /\*\*Daily crossing[^:]*:\*\*/);
  const tagsMatch = block.match(/\*\*Tags:\*\*\s*`([^`]+)`/);

  // Election lore: batch files use an inline bold label followed by prose in
  // the same paragraph; the pilot file uses a "### Election lore" heading
  // followed by a separate paragraph. Try both.
  let electionLore = '';
  // Non-greedy .*? (not [^*]*) because the label itself often contains a
  // nested single-asterisk italic span ("**Election lore — *tradition
  // says*:**") that a "no asterisks at all" class would refuse to cross.
  const inlineLore = block.match(/\*\*Election lore.*?\*\*:?\s*([\s\S]+?)(?:\n\n|\n\*\*|$)/);
  if (inlineLore) {
    electionLore = clean(inlineLore[1]);
  } else {
    const headingLore = block.match(/###\s*Election lore[\s\S]*?\n\n([\s\S]+?)(?:\n\n|$)/);
    if (headingLore) electionLore = clean(headingLore[1]);
  }

  return {
    id,
    epithet: MANSION_EPITHETS[id - 1],
    slug: slugify(MANSION_EPITHETS[id - 1]),
    position,
    stars,
    crossCultural: parseCrossCultural(block),
    electionLore,
    birthEntry: clean(birthEntry),
    dailyCrossing: clean(dailyCrossing),
    tags: tagsMatch ? tagsMatch[1].split('·').map(t => t.trim()) : [],
  };
}

const proseBlocks = new Map();
for (const file of PROSE_FILES) {
  const text = fs.readFileSync(path.join(RESEARCH, file), 'utf8');
  for (const [id, block] of splitEntries(text)) {
    if (!proseBlocks.has(id)) proseBlocks.set(id, block); // first file wins if ever duplicated
  }
}

// -- merge structured + prose into one record per mansion --------------------

function kanjiFor(row) {
  if (row.sukuyo_kanji) return row.sukuyo_kanji;
  if (row.xiu && row.xiu.char) return row.xiu.char + '宿'; // + 宿
  return '';
}

const mansions = [];
for (let id = 1; id <= 28; id++) {
  const row = byId.get(id);
  if (!row) throw new Error(`mansions-table.json missing id ${id}`);
  const block = proseBlocks.get(id);
  const parsed = block ? parseEntry(id, block) : null;
  const hasProse = !!(parsed && parsed.birthEntry && parsed.dailyCrossing);

  mansions.push({
    id,
    epithet: MANSION_EPITHETS[id - 1],
    slug: slugify(MANSION_EPITHETS[id - 1]),
    kanji: kanjiFor(row),
    position: (parsed && parsed.position) || row.tropical_span || '',
    stars: (parsed && parsed.stars) || (row.asterism || []).join(', '),
    match: row.match_overall || null,
    crossCultural: (parsed && parsed.crossCultural.length) ? parsed.crossCultural : [
      { sky: 'India', name: row.nakshatra?.name || '', meaning: row.nakshatra?.symbol || '' },
      { sky: 'China', name: row.xiu ? `${row.xiu.char} ${row.xiu.pinyin}` : '', meaning: row.xiu?.animal || '' },
    ].filter(r => r.name),
    electionLore: parsed ? parsed.electionLore : '',
    birthEntry: parsed ? parsed.birthEntry : '',
    dailyCrossing: parsed ? parsed.dailyCrossing : '',
    tags: (parsed && parsed.tags.length) ? parsed.tags : [],
    hasProse,
    translitScholarly: row.translit_scholarly,
    meaningEn: row.meaning_en,
  });
}

// -- HTML rendering ------------------------------------------------------------

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Truncates at the last whole word within `max` chars — never mid-word. */
function truncate(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function pageHtml(m) {
  const title = `${m.epithet} — star shard ☆ the 28 lunar mansions`;
  const desc = m.birthEntry
    ? truncate(m.birthEntry.replace(/\s*✦\s*$/, ''), 155)
    : `${m.epithet}: one of the 28 classical lunar mansions (manāzil al-qamar), ${m.translitScholarly} in the Arabic tradition. Part of Star Shard's real-astronomy birth chart collection.`;
  const ogImage = `${SITE_URL}/mansions/og/${m.slug}.jpg`;
  const pageUrl = `${SITE_URL}/mansions/${m.slug}.html`;

  const crossRows = m.crossCultural.map(r => `
      <tr><th scope="row">${esc(r.sky)}</th><td>${esc(r.name)}</td><td>${esc(r.meaning)}</td></tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="article">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImage}">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Varela+Round&family=Pixelify+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#2c1f4e;color:#4a3b47;font-family:'Varela Round',sans-serif;line-height:1.6}
  main{max-width:640px;margin:0 auto;padding:32px 20px 60px}
  .card{background:#fdeef8;border:2px solid;border-color:#fff #c586ad #c586ad #fff;box-shadow:4px 4px 0 rgba(30,20,54,.45);padding:26px 24px;margin-bottom:20px}
  h1{font-family:'Baloo 2',cursive;font-weight:800;font-size:34px;color:#8a4d9e;margin:0 0 4px}
  .kanji{font-size:20px;color:#a06f8c;margin:0 0 14px}
  .eyebrow{font-family:'Pixelify Sans',monospace;font-size:11px;letter-spacing:.14em;color:#c9a0b8;text-transform:uppercase}
  .meta{font-size:13px;color:#6d5a68;margin:4px 0 18px}
  table{border-collapse:collapse;width:100%;margin:10px 0 6px;font-size:13.5px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px dotted #ecd2e2}
  th{color:#a06f8c;font-weight:600;width:80px}
  blockquote{background:#fff;border:2px dashed #b7e3de;padding:14px 16px;margin:14px 0;font-size:14.5px;color:#6d5a68}
  .tags{font-size:12px;color:#c9a0b8}
  .tags span{background:#fff;border:1px solid #f2b9d3;padding:3px 9px;margin:0 4px 4px 0;display:inline-block;border-radius:2px}
  .lore{font-size:13.5px;color:#7a5b74;font-style:italic}
  .cta{display:inline-block;font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;color:#fff;background:linear-gradient(135deg,#3fb8ad,#9d84e8);border:2px solid;border-color:#fff #7a5b9e #7a5b9e #fff;padding:12px 24px;text-decoration:none;box-shadow:2px 2px 0 rgba(58,42,84,.3)}
  .sources{font-size:11.5px;line-height:1.6;color:#b294a8;border-top:1px dotted #ecd2e2;padding-top:10px;margin-top:20px}
  a{color:#3fb8ad}
  a:hover{color:#ff8fc0}
  nav a{color:#c9b8f0}
</style>
</head>
<body>
<main>
  <nav><a href="./index.html">← all 28 mansions</a></nav>
  <div class="card">
    <div class="eyebrow">station ${m.id} of 28 · manāzil al-qamar</div>
    <h1>${esc(m.epithet)}</h1>
    ${m.kanji ? `<div class="kanji">${esc(m.kanji)}</div>` : ''}
    <div class="meta">${esc(m.position)}${m.stars ? ' · ' + esc(m.stars) : ''}${m.match ? ' · match: ' + esc(m.match.toLowerCase()) : ''}</div>
    ${m.crossCultural.length ? `<table><caption class="eyebrow" style="text-align:left;margin-bottom:6px">four skies, one station</caption>${crossRows}</table>` : ''}
    ${m.electionLore ? `<p class="lore">tradition says: ${esc(m.electionLore)}</p>` : ''}
  </div>

  <div class="card">
    ${m.hasProse ? `
    <div class="eyebrow">your mansion</div>
    <blockquote>${esc(m.birthEntry)}</blockquote>
    <div class="eyebrow">tonight's crossing</div>
    <blockquote>${esc(m.dailyCrossing)}</blockquote>
    ${m.tags.length ? `<p class="tags">${m.tags.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
    ` : `<p>the full reading for ${esc(m.epithet)} is still being written ♡</p>`}
  </div>

  <p style="text-align:center;margin:26px 0"><a class="cta" href="../index.html">collect it on Star Shard →</a></p>

  <div class="sources">sources &amp; respect: the manāzil al-qamar from classical Arabic star-calendars (anwāʼ), shared as cultural scholarship with love, alongside the Indian nakshatra and Chinese xiù traditions that share this station's sky. historical magical/election material is presented as history, never as practice. <a href="./index.html">see all 28 →</a></div>
</main>
</body>
</html>
`;
}

function indexHtml() {
  const items = mansions.map(m => `
      <li><a href="./${m.slug}.html"><span class="num">${String(m.id).padStart(2, '0')}</span> ${esc(m.epithet)}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>the 28 lunar mansions — star shard ☆</title>
<meta name="description" content="All 28 manāzil al-qamar, the classical Arabic lunar mansions — real astronomy, four cultural traditions, one collectible per station.">
<link rel="canonical" href="${SITE_URL}/mansions/index.html">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Varela+Round&family=Pixelify+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#2c1f4e;color:#4a3b47;font-family:'Varela Round',sans-serif}
  main{max-width:640px;margin:0 auto;padding:32px 20px 60px}
  h1{font-family:'Baloo 2',cursive;font-weight:800;font-size:32px;color:#fff;text-align:center}
  p.sub{text-align:center;color:#e0c8e8;font-size:14px;margin-bottom:24px}
  ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
  li a{display:block;background:#fdeef8;border:2px solid;border-color:#fff #c586ad #c586ad #fff;padding:12px 14px;text-decoration:none;color:#8a4d9e;font-weight:700;font-family:'Baloo 2',cursive}
  li a:hover{background:#ffd6e8}
  .num{font-family:'Pixelify Sans',monospace;font-size:11px;color:#c9a0b8;margin-right:6px}
  p.back{text-align:center;margin-top:24px}
  p.back a{color:#e0c8e8}
</style>
</head>
<body>
<main>
  <h1>the 28 lunar mansions</h1>
  <p class="sub">manāzil al-qamar · real Placidus astronomy, four traditions, one card per station</p>
  <ul>${items}
  </ul>
  <p class="back"><a href="../index.html">← back to Star Shard</a></p>
</main>
</body>
</html>
`;
}

function sitemapXml() {
  const urls = [SITE_URL + '/', SITE_URL + '/mansions/index.html', ...mansions.map(m => `${SITE_URL}/mansions/${m.slug}.html`)];
  const entries = urls.map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

// -- write output ---------------------------------------------------------
// Guarded so tools/build-mansion-images.mjs and test/mansions.test.mjs can
// import { mansions } from here for its parsed data without re-writing
// every file as an import side effect.

function writeAll() {
  fs.mkdirSync(path.join(OUT, 'og'), { recursive: true });
  for (const m of mansions) {
    fs.writeFileSync(path.join(OUT, `${m.slug}.html`), pageHtml(m));
  }
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml());
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml());

  const missingProse = mansions.filter(m => !m.hasProse).map(m => `#${m.id} ${m.epithet}`);
  console.log(`generated ${mansions.length} mansion pages + index.html + sitemap.xml`);
  if (missingProse.length) console.log(`still-being-written placeholder used for: ${missingProse.join(', ')}`);
  else console.log('all 28 mansions have real prose.');
}

if (import.meta.url === `file://${process.argv[1]}`) writeAll();

// exported for tools/build-mansion-images.mjs and test/mansions.test.mjs
export { mansions, MANSION_EPITHETS, slugify, parseCrossCultural, splitEntries, parseEntry, writeAll };
