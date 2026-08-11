// Star Shard — turns a computed chart into the four shards and the woven text.
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// AUDIT W2 — RESOLVED. `window.claude.complete` was provided by the Claude
// Design authoring runtime and does not exist in the deployed dc-runtime, so
// every "weave my reading" click used to return the identical fallback
// paragraph. The LLM path is gone. Below is a genuine combinatorial library
// instead: each paragraph is assembled from an opener, a connective sentence,
// a mansion line, and a closer, each picked deterministically (same birth
// data always weaves the same reading — this is a collectible, not a dice
// roll) from a handful of hand-written variants via seededPick(). Combined
// with the underlying 12 houses x 12 archetypes x 28 mansions x 7 weekdays,
// the paragraph shape itself varies independently of which chart it's for.

import { SIGNS } from './astro.js';
import { ordinal, ORDINAL_WORDS } from './format.js';

// Deterministic string hash (FNV-1a) so a given seed always picks the same
// index — the reading must be stable across reloads for the same chart.
function seededPick(list, seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return list[Math.abs(h) % list.length];
}

/**
 * The four shard bodies, in SHARD_META order: house, mirror, moon, hearth.
 * `data` is the shards.js module, `astro` is astro.js.
 */
export function buildShards(chart, astro, data) {
  if (!chart || !data) return [];
  const moon = SIGNS[chart.moonSign], asc = SIGNS[chart.ascSign];
  const mansion = data.MANSIONS[chart.mansion];
  const weekday = data.WEEKDAYS[chart.weekday];
  const archetype = data.ARCHETYPES[chart.moonSign];

  // Above the polar circle the houses come from Porphyry, not Placidus — say so
  // rather than claiming precision the chart does not have.
  const houseNote = chart.houseSystem === 'porphyry'
    ? ' (your birthplace sits above the Arctic circle, where Placidus houses do not exist — these are Porphyry houses instead ✦)'
    : '';

  return [
    {
      headline: `${asc} rising · sun in the ${ordinal(chart.sunHouse)} house`,
      body: data.HOUSE_READINGS[chart.sunHouse - 1]
        + ` (and with ${asc} rising, you enter every room as a ${data.SIGN_FLAVOR[chart.ascSign]}.)`
        + houseNote,
    },
    { headline: `${archetype[0]} · moon in ${moon}`, body: archetype[1] },
    {
      headline: `${mansion[0]}: “${mansion[1]}”`,
      body: `Your moon rests in the ${ordinal(chart.mansion + 1)} of the 28 lunar mansions charted by classical Arab astronomers: ${mansion[2]}`,
    },
    { headline: `born on ${weekday[0]}, day of ${weekday[1]}`, body: weekday[2] },
  ];
}

/** One blended paragraph across all four traditions, assembled from the
 * combinatorial library in shards.js. Deterministic per chart. */
export function weave({ chart, name, astro, data }) {
  const sun = SIGNS[chart.sunSign], moon = SIGNS[chart.moonSign], asc = SIGNS[chart.ascSign];
  const mansion = data.MANSIONS[chart.mansion];
  const archetype = data.ARCHETYPES[chart.moonSign];
  const weekday = data.WEEKDAYS[chart.weekday];
  const house = ORDINAL_WORDS[chart.sunHouse - 1];
  const who = name ? name : 'little star';

  const seed = `${name || ''}|${sun}|${moon}|${asc}|${house}|${mansion[0]}|${archetype[0]}|${weekday[1]}`;
  const opener = seededPick(data.WEAVE_OPENERS, seed + '|opener')(who);
  const mid = seededPick(data.WEAVE_MIDS, seed + '|mid')(sun, house, moon, asc, archetype[0]);
  const mansionLine = seededPick(data.WEAVE_MANSION_LINES, seed + '|mansion')(mansion[0]);
  const closer = seededPick(data.WEAVE_CLOSERS, seed + '|closer')(weekday[1]);
  return `${opener} ${mid} ${mansionLine} ${closer}`;
}

/** Compatibility lines + score. Pure; no network. */
export function duetFacts({ chartA, chartB, duetMod, data }) {
  const eA = duetMod.ELEMENTS[duetMod.SIGN_ELEMENT[chartA.sunSign]];
  const eB = duetMod.ELEMENTS[duetMod.SIGN_ELEMENT[chartB.sunSign]];
  const pair = duetMod.ELEMENT_PAIRS[`${eA}-${eB}`] || duetMod.ELEMENT_PAIRS[`${eB}-${eA}`];
  const score = duetMod.duetScore(chartA, chartB);
  const lines = [
    `☀ suns: ${SIGNS[chartA.sunSign]} × ${SIGNS[chartB.sunSign]}: ${pair[1]}`,
    `☾ moons: your moons rest in ${data.MANSIONS[chartA.mansion][0]} and ${data.MANSIONS[chartB.mansion][0]}, two stations on the same lunar road; the moon visits you both every month.`,
    `✶ days: a child of ${data.WEEKDAYS[chartA.weekday][1]} and a child of ${data.WEEKDAYS[chartB.weekday][1]}, the old week put your stars on the same calendar for a reason.`,
  ];
  return { score, pairTitle: pair[0], lines };
}

/** The duet paragraph, assembled from the combinatorial library in duet.js.
 * Deterministic per chart pair. */
export function duetText({ chartA, chartB, nameA, nameB, facts, duetMod, data }) {
  const a = nameA || 'star one', b = nameB || 'star two';
  const seed = `${a}|${b}|${facts.pairTitle}`;
  const opener = seededPick(duetMod.DUET_OPENERS, seed + '|opener')(a, b, facts.pairTitle);
  const closer = seededPick(duetMod.DUET_CLOSERS, seed + '|closer')();
  return `${opener} ${closer}`;
}
