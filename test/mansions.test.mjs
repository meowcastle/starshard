// Star Shard — regression tests for tools/build-mansions.mjs's parser and
// the generated mansions/*.html output.
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mansions, slugify } from '../tools/build-mansions.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

test('all 28 mansion ids are present, unique, and 1-indexed 1-28', () => {
  assert.equal(mansions.length, 28);
  const ids = mansions.map(m => m.id).sort((a, b) => a - b);
  assert.deepEqual(ids, Array.from({ length: 28 }, (_, i) => i + 1));
});

test('all 28 slugs are unique and URL-safe', () => {
  const slugs = mansions.map(m => m.slug);
  assert.equal(new Set(slugs).size, 28, 'duplicate slug found');
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `not URL-safe: ${s}`);
});

test('all 28 mansions have real prose (the content gap has closed)', () => {
  const missing = mansions.filter(m => !m.hasProse);
  assert.deepEqual(missing.map(m => m.id), [], `still missing prose: ${missing.map(m => m.epithet).join(', ')}`);
  for (const m of mansions) {
    assert.ok(m.birthEntry.length > 20, `#${m.id} birthEntry too short/empty`);
    assert.ok(m.dailyCrossing.length > 20, `#${m.id} dailyCrossing too short/empty`);
  }
});

// Regression guard for a real bug caught during planning: the source files
// use at least three different table row orderings (Arabia-India-China-Japan
// in batch1-4, Japan-Arabia-India-China for #3, Japan-China-Arabia-India for
// #24) — a positional parser would silently swap data between skies. #24
// specifically is the case that caught it.
test('cross-cultural table rows are keyed by sky name, not position (regression: #24 The Void)', () => {
  const void_ = mansions.find(m => m.id === 24);
  assert.ok(void_, 'mansion #24 missing');
  const bySky = Object.fromEntries(void_.crossCultural.map(r => [r.sky, r]));
  assert.match(bySky.Japan.name, /虛宿|Tomite/);
  assert.match(bySky.China.name, /虛|Xū/);
  assert.match(bySky.Arabia.name, /Suʿūd/);
  assert.match(bySky.India.name, /Śatabhiṣā/);
});

// Regression guard for the epithet-ambiguity bug caught during planning:
// mansions-pilot.md's own headings for #10/#24 were never actually updated
// to the "v3" titles batch1.md's retitle note announces, so a parser
// extracting the quoted gloss would produce "The Star"/"the void where the
// luck lands" instead of the correct "The Throne"/"The Void".
test('mansion #10 is "The Throne" and #24 is "The Void", not the pilot doc\'s literal (unrenamed) gloss', () => {
  const ten = mansions.find(m => m.id === 10);
  const twentyFour = mansions.find(m => m.id === 24);
  assert.equal(ten.epithet, 'The Throne');
  assert.equal(ten.slug, 'the-throne');
  assert.equal(twentyFour.epithet, 'The Void');
  assert.equal(twentyFour.slug, 'the-void');
});

test('no internal editorial review flags ([VERIFY]/[THIN]/[HISTORY-ONLY]/[NEEDS-HUMAN]) leak into parsed fields', () => {
  for (const m of mansions) {
    for (const field of [m.position, m.stars, m.electionLore, m.birthEntry, m.dailyCrossing]) {
      assert.doesNotMatch(field, /\[(VERIFY|THIN|HISTORY-ONLY|NEEDS-HUMAN)/i, `#${m.id} leaked an editorial flag: ${field}`);
    }
    for (const row of m.crossCultural) {
      assert.doesNotMatch(row.meaning, /\[(VERIFY|THIN|HISTORY-ONLY|NEEDS-HUMAN)/i, `#${m.id} ${row.sky} leaked an editorial flag`);
    }
  }
});

test('no raw markdown (** or single *) leaks into parsed fields', () => {
  for (const m of mansions) {
    for (const field of [m.position, m.stars, m.electionLore, m.birthEntry, m.dailyCrossing]) {
      assert.doesNotMatch(field, /\*/, `#${m.id} leaked a markdown asterisk: ${field}`);
    }
  }
});

// -- generated file checks (run after `node tools/build-mansions.mjs`) ------

test('every mansions/<slug>.html has a title, a matching og:image that exists on disk, and no template placeholders', () => {
  for (const m of mansions) {
    const file = path.join(ROOT, 'mansions', `${m.slug}.html`);
    assert.ok(fs.existsSync(file), `${file} was not generated — run node tools/build-mansions.mjs`);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/);
    const ogMatch = html.match(/og:image" content="([^"]+)"/);
    assert.ok(ogMatch, `#${m.id} missing og:image`);
    const ogPath = path.join(ROOT, 'mansions', 'og', `${m.slug}.jpg`);
    assert.ok(ogMatch[1].endsWith(`/mansions/og/${m.slug}.jpg`), `#${m.id} og:image points at the wrong file`);
    assert.ok(fs.existsSync(ogPath), `${ogPath} was not generated — run node tools/build-mansion-images.mjs`);
    assert.doesNotMatch(html, /\{\{|\}\}/, `#${m.id} has a leftover template placeholder`);
  }
});

test('mansions/index.html links to all 28 pages, and sitemap.xml lists all 28 + index', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'mansions', 'index.html'), 'utf8');
  for (const m of mansions) {
    assert.ok(indexHtml.includes(`./${m.slug}.html`), `index.html missing a link to ${m.slug}.html`);
  }
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /<loc>https:\/\/starshard\.net\/<\/loc>/);
  assert.match(sitemap, /mansions\/index\.html/);
  for (const m of mansions) {
    assert.match(sitemap, new RegExp(`mansions/${m.slug}\\.html`), `sitemap missing ${m.slug}`);
  }
});
