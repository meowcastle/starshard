#!/usr/bin/env node
// Star Shard — the 784 pass harness.  GENERATION.md is the spec.
//
//   node combo-harness.mjs packet 06 10      → the fact packet for one cell
//   node combo-harness.mjs check cells.json  → run every automated gate
//
// OWNER: Claude Design (corpus side). Code owns whatever ships this.

import fs from 'node:fs';
import path from 'node:path';

const HERE = path.resolve(import.meta.dirname);
const pad = n => String(n).padStart(2, '0');

// ── the 28 portraits ────────────────────────────────────────────────────────
const BOLD = /^\*\*([A-Za-z0-9_.]+)\*\*$/;
const STOP = /^(?:---\s*|#{1,2}\s.*)$/;

function loadCorpus(file) {
  const out = {};
  let cur = null, buf = [];
  const flush = () => { if (cur) out[cur] = buf.join(' ').replace(/\s+/g, ' ').trim(); cur = null; buf = []; };
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = BOLD.exec(line.trim());
    if (m) { flush(); cur = m[1]; continue; }
    if (STOP.test(line.trim())) { flush(); continue; }
    if (cur) buf.push(line.trim());
  }
  flush();
  return out;
}

// Repo root is one level up from tools/ — the real files are
// research/corpus-mansions.md and stations.js (not tools/stations.mjs).
const COPY = loadCorpus(path.join(HERE, '..', 'research', 'corpus-mansions.md'));
const { STATIONS } = await import(path.join(HERE, '..', 'stations.js'));

const strip = s => (s || '').replace(/\*/g, '');

// ── per-mansion banned tokens: everything the portrait already says ─────────
// GENERATION.md §0 — the combination may use the epithet and the keyword only.
function bannedFor(n) {
  const s = STATIONS[n - 1];
  const words = new Set();
  const add = t => String(t || '')
    .split(/[^\p{L}\p{M}ʿʾ'-]+/u)
    .filter(w => w.length > 3)
    .forEach(w => words.add(w.toLowerCase()));

  (s.crossCultural || []).forEach(c => { add(c.name); add(c.sky); });
  add(s.stars);
  add(s.animal);
  if (s.hunger) { add(s.hunger.deity); add(s.hunger.symbol); }

  // the epithet and keyword are explicitly permitted — never ban their words
  strip(s.epithet).toLowerCase().split(/\s+/).forEach(w => words.delete(w));
  strip(COPY[`MANSION.${pad(n)}.keyword`] || '').toLowerCase()
    .split(/\s+/).forEach(w => words.delete(w));

  // common English that slipped in from the meaning glosses
  ['star', 'stars', 'mansion', 'sky', 'quarter', 'tiger', 'bird', 'dragon',
   'tortoise', 'white', 'black', 'azure', 'vermilion', 'determinant',
   'symbol', 'deity', 'animal', 'india', 'china', 'japan', 'arabia',
   'them', 'this', 'that', 'with', 'from', 'into', 'they', 'their', 'which',
   'what', 'when', 'where', 'have', 'been', 'were', 'itself', 'thing',
   'things', 'first', 'last', 'more', 'most', 'over', 'than', 'then'
  ].forEach(w => words.delete(w));

  return [...words].sort();
}

function relation(s, m) {
  if (s === m) return 'same';
  const d = Math.min((s - m + 28) % 28, (m - s + 28) % 28);
  if (d === 14) return 'opposite';
  if (d === 1) return 'adjacent';
  return 'none';
}

export function packet(sun, moon) {
  const P = n => ['claim', 'synthesis', 'election', 'archetype']
    .map(k => strip(COPY[`MANSION.${pad(n)}.${k}`])).join('\n\n');
  const side = n => ({
    n,
    epithet: STATIONS[n - 1].epithet,
    keyword: strip(COPY[`MANSION.${pad(n)}.keyword`]),
    portrait: P(n),
  });
  return {
    address: `${pad(sun)}·${pad(moon)}`,
    sun: side(sun),
    moon: side(moon),
    relation: relation(sun, moon),
    banned: [...new Set([...bannedFor(sun), ...bannedFor(moon)])],
  };
}

// ── gates ───────────────────────────────────────────────────────────────────
const SLOTS = {
  lead:    [25, 40],
  sun:     [55, 75],
  moon:    [50, 70],
  pull:    [20, 35],
  tension: [60, 80],
  cost:    [50, 70],
};

const STYLE = [
  ['first-person',        /\b(we|we're|our|ours|us)\b/i],
  ['not-X-but-Y',         /\b(isn't|is not|aren't)\b[^.]{0,40}\b(it's|it is|but)\b/i],
  ['labelling the move',  /\bthe cost is\b/i],
  ['announcing',          /\b(here'?s the (part|thing)|almost nobody knows|worth knowing)\b/i],
  ['throat-clearing',     /^(so|and then there is|worth knowing)\b/i],
  ['app as subject',      /\b(star shard (is|does)|this (app|reading|page))\b/i],
  ['advice',              /\b(you should|try to|remember to|allow yourself|make sure to)\b/i],
  // added after the pilot — 7 of 8 cells failed these. GENERATION.md §4a.
  ['fabricated attribution',
    /\b(the old books|the older readings|the old electors|the tradition is|the traditions? (say|says|gave|give|call|calls|treat)|classical sources?|every tradition)\b/i],
  ['off-vocabulary term',
    /\b(significator|aversion|antiscia|almuten|dispositor|peregrine|combust|cazimi|triplicity|decanate)\b/i],
];

const LEAK = [
  ['date/time',  /\b(19|20)\d\d\b|\b\d{1,2}:\d{2}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i],
  ['sign',       /\b(aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/i],
  ['degree',     /\d+\s*°|\d+\s*′/],
];

const wc = t => String(t).trim().split(/\s+/).filter(Boolean).length;

function ngrams(t, n = 8) {
  const w = String(t).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}

export function checkCell(cell, pk) {
  const errs = [];
  for (const [slot, [lo, hi]] of Object.entries(SLOTS)) {
    if (!cell[slot]) { errs.push(`missing slot: ${slot}`); continue; }
    const n = wc(cell[slot]);
    if (n < lo || n > hi) errs.push(`${slot}: ${n}w, want ${lo}–${hi}`);
  }
  const all = Object.values(SLOTS).map(([]) => 0) && Object.keys(SLOTS)
    .map(k => cell[k] || '').join(' \n ');

  for (const [name, re] of STYLE) if (re.test(all)) errs.push(`style — ${name}`);
  for (const [name, re] of LEAK)  if (re.test(all)) errs.push(`leak — ${name}`);

  if (pk) {
    const words = new Set(all.toLowerCase().split(/[^\p{L}\p{M}ʿʾ'-]+/u));
    const borrowed = pk.banned.filter(b => words.has(b));
    if (borrowed.length) errs.push(`borrowed-fact — ${borrowed.slice(0, 6).join(', ')}`);
    if (pk.relation === 'same' && !/\b(no counterweight|nothing opposite|doubled|both at once|twice over|undiluted|no second)\b/i.test(all))
      errs.push('diagonal — no doubled-template marker');
  }
  return errs;
}

/** Collision gate: for every mansion, compare all cells containing it. */
export function collisions(cells, n = 8) {
  const byMansion = new Map();
  for (const c of cells) {
    const [s, m] = c.address.split('·').map(Number);
    for (const k of new Set([s, m])) {
      if (!byMansion.has(k)) byMansion.set(k, []);
      byMansion.get(k).push(c);
    }
  }
  const hits = [];
  for (const [mansion, group] of byMansion) {
    const grams = group.map(c => [c.address,
      ngrams(Object.keys(SLOTS).map(k => c[k] || '').join(' '), n)]);
    for (let i = 0; i < grams.length; i++)
      for (let j = i + 1; j < grams.length; j++) {
        const shared = [...grams[i][1]].filter(g => grams[j][1].has(g));
        if (shared.length) hits.push({ mansion, a: grams[i][0], b: grams[j][0], shared });
      }
  }
  return hits;
}

// ── cli ─────────────────────────────────────────────────────────────────────
const [, , cmd, a, b] = process.argv;
if (cmd === 'packet') {
  console.log(JSON.stringify(packet(Number(a), Number(b)), null, 2));
} else if (cmd === 'check') {
  const cells = JSON.parse(fs.readFileSync(a, 'utf8'));
  let bad = 0;
  for (const c of cells) {
    const [s, m] = c.address.split('·').map(Number);
    const errs = checkCell(c, packet(s, m));
    if (errs.length) { bad++; console.log(`✗ ${c.address}`); errs.forEach(e => console.log('    ' + e)); }
    else console.log(`✓ ${c.address}`);
  }
  const hits = collisions(cells);
  console.log(`\n${cells.length - bad}/${cells.length} cells clean · ${hits.length} collisions`);
  for (const h of hits.slice(0, 10))
    console.log(`  ⚠ mansion ${h.mansion}: ${h.a} ↔ ${h.b}\n      "${h.shared[0]}"`);
  process.exit(bad || hits.length ? 1 : 0);
}
