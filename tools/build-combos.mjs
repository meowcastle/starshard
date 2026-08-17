#!/usr/bin/env node
// Star Shard — generates combos.js from research/combos.json, the 784-cell
// combination-reading corpus (GENERATION.md). One-time-per-batch generator,
// same category as tools/build-reading-copy.mjs: no build step for the
// deployed site, just a script whose committed OUTPUT ships. combos.js is
// "never hand-edit" — see OWNERSHIP.md. Re-run this script after
// research/combos.json grows; don't touch combos.js directly.
//
// Runs every cell back through tools/combo-harness.mjs's own gates before
// shipping — the harness is the authority on what's clean, this script
// doesn't re-implement or loosen any of its rules. A cell that fails a
// gate here is a real regression (the corpus changed under the harness,
// or the harness changed under the corpus) and stops the build rather
// than shipping a stale-looking pass.
//
//   node tools/build-combos.mjs
//
// OWNER: Claude Code.

import fs from 'node:fs';
import path from 'node:path';
import { packet, checkCell, collisions } from './combo-harness.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'research', 'combos.json');
const OUT = path.join(ROOT, 'combos.js');

function fnv1aHash(seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/** Validates every cell against the harness's own gates and returns the
 * generated combos.js source. Throws (rather than partially writing) if
 * any cell fails — a gate failure here means the corpus and the harness
 * disagree, which is a real regression to stop on, not paper over. */
export function combosJs() {
  const raw = fs.readFileSync(SOURCE, 'utf8');
  const cells = JSON.parse(raw);

  const seen = new Set();
  const failures = [];
  for (const c of cells) {
    if (seen.has(c.address)) throw new Error(`duplicate combo address ${c.address}`);
    seen.add(c.address);
    const [s, m] = c.address.split('·').map(Number);
    if (!(s >= 1 && s <= 28 && m >= 1 && m <= 28)) throw new Error(`bad address ${c.address}`);
    const errs = checkCell(c, packet(s, m));
    if (errs.length) failures.push(`${c.address}: ${errs.join('; ')}`);
  }
  const hits = collisions(cells);
  if (failures.length || hits.length) {
    throw new Error(`${failures.length} cells failed a gate, ${hits.length} collisions:\n${failures.join('\n')}`);
  }

  const COMBOS = {};
  for (const c of cells) {
    const { address, lead, sun, moon, pull, tension, cost } = c;
    COMBOS[address] = { lead, sun, moon, pull, tension, cost };
  }

  const version = fnv1aHash(raw);
  return (
    '// Star Shard — combos.js: generated from research/combos.json by\n' +
    '// tools/build-combos.mjs. GENERATION.md is the spec. Never hand-edit —\n' +
    '// see OWNERSHIP.md. Re-run the generator after research/combos.json grows.\n' +
    '//\n' +
    `// ${cells.length} of 784 cells (${(cells.length / 784 * 100).toFixed(1)}%), version ${version}.\n\n` +
    `export const COMBO_VERSION = ${JSON.stringify(version)};\n` +
    `export const COMBO_COUNT = ${cells.length};\n` +
    `export const COMBOS = ${JSON.stringify(COMBOS, null, 2)};\n`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const js = combosJs();
  fs.writeFileSync(OUT, js);
  const count = js.match(/COMBO_COUNT = (\d+)/)[1];
  console.log(`generated combos.js — ${count} of 784 cells (${(count / 784 * 100).toFixed(1)}%)`);
}
