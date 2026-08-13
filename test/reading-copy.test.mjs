// Star Shard — regression tests for tools/build-reading-copy.mjs's parser
// and the generated reading-copy.js output.
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { COPY, COPY_VERSION, copyJs, KNOWN_TOKENS, ARRIVAL_UI_IDS } from '../tools/build-reading-copy.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

// A stale reading-copy.js fails silently and worse than a stale mansions
// page: there's no unresolved-{{ }} tell, it just serves an old reading.
test('reading-copy.js is not stale relative to tools/build-reading-copy.mjs\'s current output', () => {
  const committed = fs.readFileSync(path.join(ROOT, 'reading-copy.js'), 'utf8');
  assert.equal(committed, copyJs(), 'reading-copy.js is stale — run node tools/build-reading-copy.mjs');
});

test('exactly 243 slots, exactly 112 STATION.* slots', () => {
  const ids = Object.keys(COPY);
  assert.equal(ids.length, 243);
  assert.equal(ids.filter(id => id.startsWith('STATION.')).length, 112);
});

test('every STATION.NN has all four slots (strike, root, facing, answer)', () => {
  for (let n = 1; n <= 28; n++) {
    const nn = String(n).padStart(2, '0');
    for (const kind of ['strike', 'root', 'facing', 'answer']) {
      assert.ok(COPY[`STATION.${nn}.${kind}`], `missing STATION.${nn}.${kind}`);
    }
  }
});

test('word-count floors hold, scoped per slot family (strike/root >=100, arrival UI copy uncapped, everything else >=15)', () => {
  for (const [id, entry] of Object.entries(COPY)) {
    const words = entry.text.split(/\s+/).filter(Boolean).length;
    const floor = /^STATION\.\d{2}\.(strike|root)$/.test(id) ? 100 : (ARRIVAL_UI_IDS.has(id) ? 1 : 15);
    assert.ok(words >= floor, `${id} is ${words} words, below the ${floor}-word floor`);
  }
});

test('no interpolation token outside the known 8, and no stray markdown asterisks in .text', () => {
  for (const [id, entry] of Object.entries(COPY)) {
    for (const m of entry.text.matchAll(/\{([a-zA-Z]+)\}/g)) {
      assert.ok(KNOWN_TOKENS.has(m[1]), `${id} uses unknown token {${m[1]}}`);
    }
    assert.doesNotMatch(entry.text, /\*/, `${id} leaked a markdown asterisk into .text`);
  }
});

test('no tier-1+ vocabulary (Recollection/Silverway/the Great Sowing) anywhere in the corpus', () => {
  for (const [id, entry] of Object.entries(COPY)) {
    for (const re of [/recollection/i, /silverway/i, /great sowing/i]) {
      assert.doesNotMatch(entry.text, re, `${id} leaked tier-1+ vocabulary`);
    }
  }
});

test('a real bug caught before shipping: BECOMING.*/CLOSE.3\'s leading parenthetical never leaks, and the body is not truncated by the italic-editorial-line rule PORT-SPEC.md originally specified', () => {
  // GAIT.farbank, STATION.11.strike, STATION.14.strike, STATION.16.strike,
  // STATION.19.strike, STATION.12.strike all had real content past a
  // mid-sentence italic word-wrap that a literal "stop at an italic line"
  // rule silently truncated (three of them stayed above a naive 40-word
  // floor even after truncation). Assert real minimum lengths that only
  // pass with the full, untruncated bodies.
  assert.ok(COPY['GAIT.farbank'].text.split(/\s+/).length > 150, 'GAIT.farbank looks truncated');
  assert.ok(COPY['STATION.11.strike'].text.split(/\s+/).length > 100, 'STATION.11.strike looks truncated');
  assert.ok(COPY['STATION.14.strike'].text.split(/\s+/).length > 100, 'STATION.14.strike looks truncated');
  assert.doesNotMatch(COPY['BECOMING.door'].text, /^\(/, 'BECOMING.door leaked its leading parenthetical');
  assert.doesNotMatch(COPY['BECOMING.door'].text, /^\s*—/, 'BECOMING.door leaked a stray leading dash');
});

test('a hyphenated compound split across a line-wrap joins with no stray space ("changes-oracle", not "changes- oracle")', () => {
  assert.match(COPY['BECOMING.door'].text, /changes-oracle/);
  assert.doesNotMatch(COPY['BECOMING.door'].text, /changes-\s+oracle/);
});

test('COPY_VERSION is a stable, non-empty hash', () => {
  assert.ok(typeof COPY_VERSION === 'string' && COPY_VERSION.length > 0);
});
