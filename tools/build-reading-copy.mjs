#!/usr/bin/env node
// Star Shard — parses the real reading corpus (research/corpus-spine.md +
// research/corpus-stations-*.md) into reading-copy.js, the generated
// browser-side module reading.js's composers (arrivalReading(),
// fullReading()) consume.
//
// Source of truth is the markdown, not the JS — same posture as
// tools/build-mansions.mjs: this script parses, the output is never
// hand-edited, the prose stays editable in research/.
//
// See PORT-SPEC.md for the spec this implements. Several of its own
// stated parse rules do not match the real corpus files — verified by
// reading all five files in full before writing this parser (the same
// discipline that caught bugs in tools/build-mansions.mjs's own history).
// Corrections made here, not in PORT-SPEC.md's prose:
//   - Three body shapes exist, not two: a marker alone on its own line
//     with the body starting next line (all STATION.*/OPEN.address.*), an
//     inline "**MARKER** — body" on one line (most spine slots), and a
//     "### MARKER *(annotation)*" heading whose body is a separate
//     paragraph below a blank line (the 5 GAIT.* markers).
//   - The leading italic parenthetical also appears on 5 BOLD markers
//     (BECOMING.*, CLOSE.3), sitting BEFORE the dash, not after — stripped
//     unconditionally before the dash-strip, not after it.
//   - The "italic editorial line" stop rule is dropped entirely: applied
//     literally it truncates real bodies at ordinary mid-sentence italic
//     word-wraps (verified: at least 6 real instances, 3 of which still
//     clear a naive word-count floor after truncation and would have
//     shipped silently missing their back half). Bodies stop only at the
//     next marker, a `---` rule, or a `#`/`##` heading (never `###`, which
//     is itself a marker style).
//   - Word-count floors are scoped by slot family, not one blanket
//     number: STATION.*.strike/root run ~140-150w by design,
//     STATION.*.facing/answer run ~27-40w by design, and several spine
//     connectives run under 25w by design (all confirmed against the
//     batch files' own stated word-count targets) — asserting a single
//     "no slot under 40 words" floor is false against the real corpus.
//
// corpus-arrival.md (batch 6, Aug 13) and corpus-chart-daily.md (batch 7,
// Aug 13) added under the same convention, no parser changes needed.
// corpus-arrival.md is UI copy, not prose — 32 of its 49 slots are under
// 15 words by design (CTAs, terminal readout fragments, toggle labels;
// verified against every slot in the file, not assumed from WRITING.md's
// general "terse" guidance), so it gets its own floor rather than being
// forced through the prose-family scoping above. corpus-chart-daily.md's
// 35 slots are real prose and clear the standard floor with no
// exceptions needed.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const RESEARCH = path.join(ROOT, 'research');

const SOURCE_FILES = [
  'corpus-spine.md',
  'corpus-arrival.md',
  'corpus-chart-daily.md',
  'corpus-stations-01-07.md',
  'corpus-stations-08-14.md',
  'corpus-stations-15-21.md',
  'corpus-stations-22-28.md',
];

// The only interpolation tokens ever found inside a real slot body
// (verified by scanning extracted bodies, not a whole-file regex scan —
// corpus-spine.md's own "Slot vocabulary" legend documents 17, but 9 of
// those are legend-only and never appear in actual copy).
const KNOWN_TOKENS = new Set([
  'sunSign', 'moonSign', 'becomingEpithet', 'sunEpithet',
  'typeLabel', 'sky', 'birthPlace', 'echoEpithet',
  // corpus-arrival.md (batch 6) + corpus-chart-daily.md (batch 7), Aug 13:
  'risingSign', 'phaseName', 'weekday', 'birthDate', 'tonightEpithet',
  'countdown', 'litCount', 'name',
]);

// COSMOLOGY.md §2's lexicon ledger — tier-1+ terms must never appear in
// this tier-0 corpus (SIGIL-READING.md §3 rule 3).
const TIER_1_PLUS = [/recollection/i, /silverway/i, /great sowing/i];

const MARKER_RE = /^[A-Z][A-Z_]*(?:\.[A-Za-z0-9_]+)+$/;
const BOLD_LINE_RE = /^\*\*([A-Za-z0-9_.]+)\*\*(.*)$/;
const HEADING_LINE_RE = /^###\s+([A-Za-z0-9_.]+)(.*)$/;
const STOP_RE = /^(?:---\s*|#{1,2}\s.*)$/;

function stripLeadingParenthetical(s) {
  return s.replace(/^\s*\*\([^)]*\)\*\s*/, '');
}
function stripLeadingDash(s) {
  return s.replace(/^\s*[—–-]\s*/, '');
}

/** '**bold** and *italic*' -> [{text, emphasis}]. emphasis is 'bold' |
 * 'italic' | null. Plain-text reconstruction is tokens.map(t=>t.text).join(''). */
function tokenize(text) {
  const tokens = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|([^*]+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) tokens.push({ text: m[1], emphasis: 'bold' });
    else if (m[2] !== undefined) tokens.push({ text: m[2], emphasis: 'italic' });
    else if (m[3]) tokens.push({ text: m[3], emphasis: null });
  }
  return tokens;
}

function parseFile(filename) {
  const raw = fs.readFileSync(path.join(RESEARCH, filename), 'utf8');
  const lines = raw.split('\n');
  const slots = [];
  let current = null;

  for (const line of lines) {
    const headingMatch = HEADING_LINE_RE.exec(line);
    const boldMatch = !headingMatch && BOLD_LINE_RE.exec(line);
    const isMarker = headingMatch ? MARKER_RE.test(headingMatch[1])
      : (boldMatch && MARKER_RE.test(boldMatch[1]));

    if (isMarker) {
      if (current) slots.push(current);
      const id = (headingMatch || boldMatch)[1];
      current = { id, bodyLines: [] };
      if (headingMatch) continue; // annotation-only line; body is a later paragraph
      let rest = boldMatch[2] || '';
      rest = stripLeadingParenthetical(rest); // BECOMING.*/CLOSE.3: parenthetical before dash
      rest = stripLeadingDash(rest).trim();
      if (rest) current.bodyLines.push(rest);
      continue;
    }

    if (STOP_RE.test(line)) {
      if (current) { slots.push(current); current = null; }
      continue;
    }

    if (current) current.bodyLines.push(line);
  }
  if (current) slots.push(current);

  return slots.map(s => {
    while (s.bodyLines.length && s.bodyLines[0].trim() === '') s.bodyLines.shift();
    while (s.bodyLines.length && s.bodyLines[s.bodyLines.length - 1].trim() === '') s.bodyLines.pop();
    // A line ending in a plain ASCII "-" (never the em/en dashes the prose
    // otherwise uses) is a hyphenated compound split at a line-wrap, e.g.
    // "changes-\noracle" — join with no inserted space so it reads
    // "changes-oracle", not "changes- oracle". Must run before the general
    // whitespace collapse below, which would otherwise turn that newline
    // into a stray space.
    const joined = s.bodyLines.join('\n').replace(/-\n/g, '-');
    const rawBody = joined
      .split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');
    return { id: s.id, rawBody };
  }).filter(s => s.rawBody.length > 0);
}

function fnv1aHash(seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

// -- parse all files, validate, build COPY -----------------------------

const allSlots = [];
for (const f of SOURCE_FILES) allSlots.push(...parseFile(f).map(s => ({ ...s, file: f })));

const seen = new Set();
for (const s of allSlots) {
  if (seen.has(s.id)) throw new Error(`duplicate slot id ${s.id} (in ${s.file})`);
  seen.add(s.id);
}

const stationSlots = allSlots.filter(s => s.id.startsWith('STATION.'));
if (allSlots.length !== 243) throw new Error(`expected 243 total slots, got ${allSlots.length}`);
if (stationSlots.length !== 112) throw new Error(`expected 112 STATION.* slots, got ${stationSlots.length}`);

// corpus-arrival.md is UI copy (CTAs, terminal readout lines, toggle
// labels) — 32 of its 49 slots are under 15 words by design, verified
// against every slot in the file. Exported (not just used inline) so
// test/reading-copy.test.mjs checks the floor against the same set this
// file used, rather than re-deriving it and drifting out of sync — that
// duplication is exactly how the test's own floor check went stale
// before this batch landed.
const ARRIVAL_UI_IDS = new Set(allSlots.filter(s => s.file === 'corpus-arrival.md').map(s => s.id));

const COPY = {};
for (const s of allSlots) {
  const wordCount = s.rawBody.split(/\s+/).filter(Boolean).length;
  const isStrikeOrRoot = /^STATION\.\d{2}\.(strike|root)$/.test(s.id);
  const floor = isStrikeOrRoot ? 100 : (ARRIVAL_UI_IDS.has(s.id) ? 1 : 15);
  if (wordCount < floor) throw new Error(`${s.id} (${s.file}) is ${wordCount} words, below the ${floor}-word floor for its slot family`);

  const tokenNames = [...s.rawBody.matchAll(/\{([a-zA-Z]+)\}/g)].map(m => m[1]);
  for (const t of tokenNames) {
    if (!KNOWN_TOKENS.has(t)) throw new Error(`${s.id} (${s.file}) uses unknown interpolation token {${t}}`);
  }

  for (const re of TIER_1_PLUS) {
    if (re.test(s.rawBody)) throw new Error(`${s.id} (${s.file}) contains tier-1+ vocabulary (${re}) — the corpus must stay tier-0`);
  }

  const tokens = tokenize(s.rawBody);
  const text = tokens.map(t => t.text).join('');
  COPY[s.id] = { text, tokens };
}

const sourceConcat = SOURCE_FILES.map(f => fs.readFileSync(path.join(RESEARCH, f), 'utf8')).join('\x00');
const COPY_VERSION = fnv1aHash(sourceConcat);

function copyJs() {
  return '// Star Shard — generated reading corpus for the browser.\n' +
    '// Generated by tools/build-reading-copy.mjs from research/corpus-spine.md +\n' +
    '// research/corpus-stations-*.md — regenerate, never hand-edit (see OWNERSHIP.md).\n' +
    '//\n' +
    '// Each entry: { text: <plain string>, tokens: [{text, emphasis}] } — emphasis\n' +
    '// is \'bold\' | \'italic\' | null. Composers use .text today; .tokens is here\n' +
    '// for a future richer renderer without a second parse pass.\n' +
    '// Interpolation tokens ({sunSign} etc.) are left un-substituted in both —\n' +
    '// the composer fills them per-reading.\n\n' +
    `export const COPY = ${JSON.stringify(COPY, null, 2)};\n\n` +
    `export const STATION_SLOTS = 112;\n` +
    `export const COPY_VERSION = ${JSON.stringify(COPY_VERSION)};\n`;
}

function writeAll() {
  fs.writeFileSync(path.join(ROOT, 'reading-copy.js'), copyJs());
  console.log(`generated reading-copy.js — ${allSlots.length} slots (${stationSlots.length} station), version ${COPY_VERSION}`);
}

if (import.meta.url === `file://${process.argv[1]}`) writeAll();

export { COPY, COPY_VERSION, copyJs, writeAll, KNOWN_TOKENS, ARRIVAL_UI_IDS };
