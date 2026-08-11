// Star Shard — turns a computed chart into the four shards and the woven text.
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// AUDIT W2 — READ THIS BEFORE CHANGING ANYTHING HERE.
// `window.claude.complete` is provided by the Claude Design authoring runtime.
// It does NOT exist in the deployed dc-runtime (support.js contains zero
// references to it), so in production every call throws and every user gets the
// identical fallback paragraph. `hasLLM()` makes that condition explicit rather
// than silent. The recommended fix is to delete the LLM path entirely and grow
// the hand-written library below: 12 house readings x 12 archetypes x 28
// mansions x 7 weekdays is already 28,224 distinct four-part readings, and a
// few connective sentences per pairing make it genuinely non-repeating.

import { SIGNS } from './astro.js';
import { ordinal, ORDINAL_WORDS } from './format.js';

/** True when an LLM completion endpoint is actually reachable from this build. */
export function hasLLM() {
  return typeof window !== 'undefined'
    && typeof window.claude?.complete === 'function';
}

const WEAVE_SYSTEM = 'You write tiny astrology readings for Star Shard, a cute retro-web site for Vocaloid fans, magical-girl inspired. Voice: warm, playful, nostalgic internet-cute, family-friendly, no drama. Light fandom flavor without naming copyrighted characters. 80-110 words, one paragraph, may end with one kaomoji or ✦. No headings, no lists.';

const DUET_SYSTEM = 'You write tiny two-person astrology compatibility readings for Star Shard, a cute retro-web site for Vocaloid fans. Warm, playful, family-friendly, no drama, no romance assumptions (could be friends). 60-90 words, one paragraph, may end with ✦.';

async function complete(system, prompt) {
  const text = await window.claude.complete({ system, messages: [{ role: 'user', content: prompt }] });
  if (!text || !text.trim()) throw new Error('empty completion');
  return text.trim();
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

/** One blended paragraph across all four traditions. Always resolves. */
export async function weave({ chart, name, astro, data }) {
  const sun = SIGNS[chart.sunSign], moon = SIGNS[chart.moonSign], asc = SIGNS[chart.ascSign];
  const mansion = data.MANSIONS[chart.mansion];
  const archetype = data.ARCHETYPES[chart.moonSign];
  const weekday = data.WEEKDAYS[chart.weekday];
  const house = ORDINAL_WORDS[chart.sunHouse - 1];

  if (hasLLM()) {
    try {
      return await complete(WEAVE_SYSTEM,
        `Weave one blended reading for ${name || 'a fan'}: Sun in ${sun} (${chart.sunHouse}th Placidus house), Moon in ${moon}, ${asc} rising. Jungian archetype: ${archetype[0]}. Lunar mansion: ${mansion[0]} (${mansion[1]}). Born on ${weekday[0]}, ruled by ${weekday[1]} in folk tradition. Blend all four gently.`);
    } catch (e) { /* fall through to the written library */ }
  }
  return data.fallbackWeave(name, sun, moon, asc, house, mansion[0], archetype[0], weekday[1]).trim();
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

/** The duet paragraph. Always resolves. */
export async function duetText({ chartA, chartB, nameA, nameB, facts, duetMod, data }) {
  if (hasLLM()) {
    try {
      return await complete(DUET_SYSTEM,
        `Duet reading for ${nameA || 'star one'} (Sun ${SIGNS[chartA.sunSign]}, Moon ${SIGNS[chartA.moonSign]}, mansion ${data.MANSIONS[chartA.mansion][0]}) × ${nameB || 'star two'} (Sun ${SIGNS[chartB.sunSign]}, Moon ${SIGNS[chartB.moonSign]}, mansion ${data.MANSIONS[chartB.mansion][0]}). Pair archetype: "${facts.pairTitle}". Resonance ${facts.score}%.`);
    } catch (e) { /* fall through */ }
  }
  return duetMod.fallbackDuet(nameA, nameB, facts.pairTitle).trim();
}
