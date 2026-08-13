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
    ? ' (your birthplace sits above the Arctic circle, where Placidus houses do not exist: these are Porphyry houses instead ✦)'
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

/**
 * The phone flow's duet: date-only, no birth time or place needed for the
 * friend — deliberately lower-friction than duetFacts()/duetText(), which
 * need a full second chart. Reads the friend's moon mansion from their
 * birthday alone (noon UT is close enough for a mansion-level placement)
 * and describes the gap between the two mansions on the 28-station wheel.
 */
export function duetByDateOnly({ chart, friendYear, friendMonth, friendDay, astro, data }) {
  const fjd = astro.julianDay(friendYear, friendMonth, friendDay, 12);
  const friendMansionIdx = astro.mansionOf(astro.moonLongitude(fjd));
  const friendMansion = data.MANSIONS[friendMansionIdx][0];
  const mansion = data.MANSIONS[chart.mansion];
  const gap = Math.min(
    Math.abs(friendMansionIdx - chart.mansion),
    28 - Math.abs(friendMansionIdx - chart.mansion)
  );
  const duetBody = gap === 0
    ? `you share a mansion. ${mansion[0]} twice over: the same moon-station, which old almanacs read as an easy, uncanny sort of recognition.`
    : gap <= 3
      ? `${mansion[0]} and ${friendMansion} sit ${gap} station${gap > 1 ? 's' : ''} apart: neighbours on the moon's road. you tend to want the same things at the same time.`
      : gap >= 12
        ? `${mansion[0]} and ${friendMansion} sit almost opposite each other. the tradition reads that as complementary rather than difficult: you cover each other's blind spots.`
        : `${mansion[0]} and ${friendMansion} are ${gap} stations apart: far enough to surprise each other, close enough to stay in step.`;
  return { friendMansionIdx, friendMansion, duetBody };
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

/**
 * Today's tārābala: the count from the chart's own birth nakshatra (sidereal,
 * Lahiri — a different, hidden 27-station track from the visible 28-mansion
 * shard) to today's nakshatra. `today` is the { moonLon, jd, nakshatraIdx }
 * object componentDidMount() computes once at mount; `chart` supplies the
 * birth side via its own moonLon/jd. Pure; no network.
 */
export function todayRelation({ chart, today, sky, data }) {
  const birthNak = sky.siderealNakshatra(chart.moonLon, chart.jd);
  const r = sky.tarabala(birthNak.index, today.nakshatraIdx);
  const taraLine = data.TARA_VERDICT_LINES[r.verdict](r.taraName);
  return { taraName: r.taraName, taraLine };
}

/** Today's moon phase as a display string, e.g. "waxing gibbous, 78% lit". */
export function todayPhaseLine({ today, sky }) {
  const p = sky.moonPhase(today.sunLon, today.moonLon);
  return `${p.name}, ${Math.round(p.illumination * 100)}% lit`;
}

// -- the Sigil/Sounding composers ---------------------------------------
//
// The relational-composer split per SIGIL-READING.md §5: sigil.js's
// readingPlan()/castKind() decide EVERY conditional (which beats, which
// station/step, agree-vs-conflict, skip-vs-show) so these two functions are
// close to mechanical template fills — real corpus text comes from
// `stations` (stations.js), placeholder connective prose comes from `copy`
// (sigil-copy.js, pending the real prose pass — CLAUDE.md build order
// step 6). Both stay pure and deterministic: same sigil (+ same tonight
// position for soundingReading) always produces the same reading, matching
// weave()'s own "collectible, not a dice roll" rule above.
//
// Variant selection deliberately does NOT reuse sigil.js's readingPlan()
// .variantHash raw for every beat — that would correlate every beat's pick
// (same hash residue -> always connective-2 AND headline-2 together).
// Instead, mirror weave()'s own per-slot seed suffixing exactly.

const sigilSeed = sigil => [
  sigil.sunStation, sigil.sunStep, sigil.moonStation, sigil.moonStep,
  sigil.risingStation, sigil.natalLight, sigil.keeper, sigil.farlight,
].join(',');

// Structural, not prose (PORT-SPEC.md §3's own note on STEP_NAMES) — shared
// by arrivalReading() and soundingReading(), neither of which needs it from
// a swappable content file.
const STEP_NAMES = ['entering', 'dwelling', 'turning', 'leaving'];

// sigil.js's `keeper` is a Chaldean-cycle index (0-6: Saturn, Jupiter, Mars,
// Sun, Venus, Mercury, Moon), not a weekday — but the corpus's KEEPER.*
// slots are keyed by weekday name. Reverse the bijection sky.js's own
// WEEKDAY_RULER/PLANETARY_HOUR_ORDER already establish (hand-verified in
// test/sigil.test.mjs: Sun->3, Mon->6, Tue->2, Wed->5, Thu->1, Fri->4,
// Sat->0) rather than threading the raw weekday through every caller.
const KEEPER_WEEKDAY_NAMES = ['saturday', 'thursday', 'tuesday', 'sunday', 'friday', 'wednesday', 'monday'];

// sky.js's moonPhase().index order, confirmed 1:1 against corpus-spine.md's
// own LIGHT.* ids (both derived independently — this is the "assert the
// names line up rather than trusting index order" PORT-SPEC.md §4 asks for;
// see test/reading.test.mjs).
const LIGHT_PHASE_IDS = ['new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full', 'waning_gibbous', 'last_quarter', 'waning_crescent'];

// Small, real, canonical content (not placeholder) — drafted directly in
// COSMOLOGY.md §3.4 (gait/permission) and REBOOT.md §3 beat 9 (the strange
// line), kept inline here rather than in a swappable corpus file since
// neither is expected to change independently of this composer.
const GAIT_SHORT = {
  seedborn: { gait: 'the seed that landed whole', permission: 'you don\'t need the far bank, you *are* the crossing' },
  homebound: { gait: 'walks the near road', permission: 'depth over distance was always the assignment' },
  outbound: { gait: 'walks ahead of their own sun', permission: 'you\'re not restless, you read the road ahead' },
  emberwake: { gait: 'carries the fire behind the light', permission: 'you\'re not stuck in the past, you\'re the one keeping it lit' },
  farbank: { gait: 'born on both banks of the river', permission: 'your far side isn\'t missing, it\'s waiting at the bridge' },
};
const STRANGE_LINES = [
  'this mark is older than your name.',
  'you did not choose this. the sky just noticed you first.',
  'nobody taught the sky your name, and it wrote this down anyway.',
];

/** Fills `{token}` placeholders from a values object; a token with no
 * supplied value is left as-is rather than silently dropped, matching
 * PORT-SPEC.md §6's "unknown token -> throw at build time, not render
 * time" — a MISSING value at render time is a caller bug, not a build-time
 * corpus problem, so it stays visible instead of vanishing. */
function substitute(text, values) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));
}

/** sameStation if sun/moon share a station; else sameSky if they share a
 * Four Symbols banner; else adjacent if the banners are one apart (mod 4,
 * either direction); else opposite. PORT-SPEC.md §4's own selector list. */
function rootRelation(sunStation, moonStation, skyOf) {
  if (sunStation === moonStation) return 'sameStation';
  const diff = ((skyOf(moonStation) - skyOf(sunStation)) % 4 + 4) % 4;
  if (diff === 0) return 'sameSky';
  if (diff === 1 || diff === 3) return 'adjacent';
  return 'opposite';
}

const QUADRANT_NAMES = ['White Tiger', 'Vermilion Bird', 'Azure Dragon', 'Black Tortoise'];

/**
 * Every value any corpus slot might interpolate, built once per reading.
 * Confirmed by directly scanning reading-copy.js: only 8 of 162 slot
 * families ever use a token (OPEN.address.1, BECOMING.{door,ripening,
 * leaning}, ECHO.body, CONNECT.root.sameSky, GAIT.*, CLOSE.*) — applying
 * substitute() to every corpus text pull below is a safe no-op on the rest,
 * simpler and safer than tracking per-slot which ones need it.
 */
function buildValues({ sigil, chart, stations, skyOf, name, birthPlace }) {
  const stationAt = station => stations.STATIONS[station];
  const typeLabel = sigil.type.charAt(0).toUpperCase() + sigil.type.slice(1);

  // The Echo (INSTRUMENT.md §3.4): "what you brought with you" — the
  // station just BEFORE the one an echoing light currently sits in, not
  // the current station itself. Uses the first echoing light, if any.
  let echoEpithet = '';
  if (sigil.moving && sigil.moving.echo.length) {
    const which = sigil.moving.echo[0];
    const currentStation = which === 'sun' ? sigil.sunStation : which === 'moon' ? sigil.moonStation : sigil.risingStation;
    echoEpithet = stationAt((currentStation + 27) % 28).epithet;
  }

  return {
    name: name || 'traveler',
    sunSign: SIGNS[chart.sunSign].toLowerCase(),
    moonSign: SIGNS[chart.moonSign].toLowerCase(),
    sunEpithet: stationAt(sigil.sunStation).epithet,
    becomingEpithet: sigil.becoming != null ? stationAt(sigil.becoming).epithet : '',
    echoEpithet,
    typeLabel,
    sky: QUADRANT_NAMES[skyOf(sigil.sunStation)],
    birthPlace: birthPlace || 'the place you arrived',
  };
}

/** Shared by arrivalReading()/fullReading(): a `sub(id)` that looks up and
 * interpolates a corpus slot, and a `stationSlot(station, kind)` shorthand
 * for the `STATION.NN.kind` id shape. */
function makeSub(copy, values) {
  const sub = id => substitute(copy[id].text, values);
  const stationSlot = (station, kind) => sub(`STATION.${String(station + 1).padStart(2, '0')}.${kind}`);
  return { sub, stationSlot };
}

/**
 * The arrival reading's nine beats, filled with real corpus text, plus a
 * `becoming` field (INSTRUMENT.md §3 — not one of SIGIL-READING.md's
 * original nine beats, so kept outside the beats loop rather than
 * shoehorned into a beat id that doesn't describe it) for the Sigil
 * profile screen's hollow ring mark + one line.
 *
 * `plan` is sigil.js's readingPlan(sigil) output; `chart` is astro.js's
 * computeChart() output (needed for sunSign/moonSign, which sigil.js
 * doesn't itself store); `stations` is stations.js's module; `copy` is
 * reading-copy.js's `COPY` map; `skyOf` is sigil.js's skyOf, needed for
 * the root/CONNECT relation selector and the `{sky}` token. `birthPlace`
 * is the place name the user typed — display-only, per PORT-SPEC.md §6
 * ("nothing in this path sends birth date, time or coordinates anywhere").
 */
export function arrivalReading({ sigil, chart, plan, stations, copy, skyOf, name, birthPlace }) {
  const seed = sigilSeed(sigil);
  const stationAt = station => stations.STATIONS[station];
  const values = buildValues({ sigil, chart, stations, skyOf, name, birthPlace });
  const { sub, stationSlot } = makeSub(copy, values);
  const out = {};

  for (const beat of plan.beats) {
    if (beat.id === 'ring') {
      out.ring = { line: sub(seededPick(['OPEN.address.1', 'OPEN.address.2', 'OPEN.address.3'], seed + ':ring')) };
    } else if (beat.id === 'strike') {
      const st = stationAt(beat.station);
      const stepName = STEP_NAMES[beat.step];
      out.strike = {
        station: beat.station, step: beat.step, epithet: st.epithet, kanji: st.kanji, stepName,
        headline: sub(`STEP.sun.${stepName}`),
        body: stationSlot(beat.station, 'strike'),
      };
    } else if (beat.id === 'root') {
      const st = stationAt(beat.station);
      const relation = rootRelation(plan.beats.find(b => b.id === 'strike').station, beat.station, skyOf);
      const stepName = beat.crossingDay ? 'crossing' : (beat.step === null ? 'unknown' : STEP_NAMES[beat.step]);
      out.root = {
        station: beat.station, step: beat.step, epithet: st.epithet, kanji: st.kanji,
        stepName: beat.step === null ? null : STEP_NAMES[beat.step],
        line: sub(`CONNECT.root.${relation}`) + ' ' + sub(`STEP.moon.${stepName}`),
        body: stationSlot(beat.station, 'root'),
      };
    } else if (beat.id === 'glow') {
      out.glow = { light: beat.light, line: sub(`LIGHT.${LIGHT_PHASE_IDS[beat.light]}`) };
    } else if (beat.id === 'hand') {
      out.hand = { keeper: beat.keeper, line: sub(`KEEPER.${KEEPER_WEEKDAY_NAMES[beat.keeper]}`) };
    } else if (beat.id === 'facing') {
      if (beat.skip) { out.facing = { skip: true, line: sub('FACING.unknown') }; continue; }
      const st = stationAt(beat.station);
      out.facing = { skip: false, station: beat.station, epithet: st.epithet, kanji: st.kanji, line: stationSlot(beat.station, 'facing') };
    } else if (beat.id === 'answering') {
      const st = stationAt(beat.station);
      out.answering = { station: beat.station, epithet: st.epithet, kanji: st.kanji, line: stationSlot(beat.station, 'answer') };
    } else if (beat.id === 'gait') {
      const short = GAIT_SHORT[beat.type];
      out.gait = { type: beat.type, gait: short.gait, permission: short.permission, body: sub(`GAIT.${beat.type}`) };
    } else if (beat.id === 'handle') {
      const sunSt = stationAt(beat.sunStation);
      const closeId = sigil.moving && sigil.moving.register === 'rooted' ? 'CLOSE.3' : 'CLOSE.2';
      out.handle = {
        type: beat.type, typeLabel: values.typeLabel, epithet: sunSt.epithet,
        headline: sub(closeId),
        strangeLine: seededPick(STRANGE_LINES, seed + ':strange'),
      };
    }
  }

  if (sigil.moving) {
    const becomingSt = stationAt(sigil.becoming);
    const lines = [sub(`MOVING.${sigil.moving.which}`), sub(`BECOMING.${sigil.moving.register}`)];
    if (sigil.moving.echo.length) lines.push(sub('ECHO.body'));
    if (sigil.moving.doubleDoor) lines.push(sub('DOUBLE_DOOR.body'));
    out.becoming = {
      which: sigil.moving.which, register: sigil.moving.register, station: sigil.becoming,
      epithet: becomingSt.epithet, kanji: becomingSt.kanji, lines,
    };
  }

  return out;
}

/**
 * The Full Reading (PORT-SPEC.md §4): a longer, separately-ordered
 * composition of the same corpus — opening, sun, moon, light, day,
 * horizon, answering sky, gait, the Becoming, close — distinct from
 * arrivalReading()'s short nine-beat SIGIL-READING.md choreography
 * ("two surfaces, two orders, one corpus," PORT-SPEC §4). Returns
 * `{ sections: [{id, title, blocks: [{slot, text}]}], meta }`; the
 * renderer decides presentation, no prose lives in this function. Same
 * params as arrivalReading() minus `plan` (fullReading doesn't follow
 * readingPlan()'s beat order, so it reads sigil's fields directly).
 */
export function fullReading({ sigil, chart, stations, copy, skyOf, name, birthPlace }) {
  const seed = sigilSeed(sigil);
  const values = buildValues({ sigil, chart, stations, skyOf, name, birthPlace });
  const { sub, stationSlot } = makeSub(copy, values);
  const block = (slot, text) => ({ slot, text });
  const stationId = (station, kind) => `STATION.${String(station + 1).padStart(2, '0')}.${kind}`;
  const sections = [];

  const openId = seededPick(['OPEN.address.1', 'OPEN.address.2', 'OPEN.address.3'], seed + ':open');
  sections.push({ id: 'opening', title: 'opening', blocks: [block(openId, sub(openId))] });

  const sunStepName = STEP_NAMES[sigil.sunStep];
  sections.push({
    id: 'sun', title: 'your sun',
    blocks: [
      block(stationId(sigil.sunStation, 'strike'), stationSlot(sigil.sunStation, 'strike')),
      block(`STEP.sun.${sunStepName}`, sub(`STEP.sun.${sunStepName}`)),
    ],
  });

  const relation = rootRelation(sigil.sunStation, sigil.moonStation, skyOf);
  // Same rule as readingPlan()'s crossingDay: moonStep===0 (Entering) is a
  // crossing day; moonStep===null (no birth time) is 'unknown', never
  // conflated with 'crossing' even though both would otherwise land on the
  // same array index — the ternary checks crossing (0) before null.
  const moonStepName = sigil.moonStep === 0 ? 'crossing' : (sigil.moonStep === null ? 'unknown' : STEP_NAMES[sigil.moonStep]);
  sections.push({
    id: 'moon', title: 'your moon',
    blocks: [
      block(`CONNECT.root.${relation}`, sub(`CONNECT.root.${relation}`)),
      block(stationId(sigil.moonStation, 'root'), stationSlot(sigil.moonStation, 'root')),
      block(`STEP.moon.${moonStepName}`, sub(`STEP.moon.${moonStepName}`)),
    ],
  });

  const lightId = `LIGHT.${LIGHT_PHASE_IDS[sigil.natalLight]}`;
  sections.push({ id: 'light', title: 'the light', blocks: [block(lightId, sub(lightId))] });

  const keeperId = `KEEPER.${KEEPER_WEEKDAY_NAMES[sigil.keeper]}`;
  sections.push({ id: 'day', title: 'the day', blocks: [block(keeperId, sub(keeperId))] });

  if (sigil.risingStation === null) {
    sections.push({ id: 'horizon', title: 'the horizon', blocks: [block('FACING.unknown', sub('FACING.unknown'))] });
  } else {
    sections.push({ id: 'horizon', title: 'the horizon', blocks: [block(stationId(sigil.risingStation, 'facing'), stationSlot(sigil.risingStation, 'facing'))] });
  }

  sections.push({ id: 'answeringSky', title: 'the answering sky', blocks: [block(stationId(sigil.farlight, 'answer'), stationSlot(sigil.farlight, 'answer'))] });

  const gaitId = `GAIT.${sigil.type}`;
  sections.push({ id: 'gait', title: 'how you walk', blocks: [block(gaitId, sub(gaitId))] });

  const becomingBlocks = [
    block(`MOVING.${sigil.moving.which}`, sub(`MOVING.${sigil.moving.which}`)),
    block(`BECOMING.${sigil.moving.register}`, sub(`BECOMING.${sigil.moving.register}`)),
  ];
  if (sigil.moving.echo.length) becomingBlocks.push(block('ECHO.body', sub('ECHO.body')));
  if (sigil.moving.doubleDoor) becomingBlocks.push(block('DOUBLE_DOOR.body', sub('DOUBLE_DOOR.body')));
  sections.push({ id: 'becoming', title: 'what you\'re becoming', blocks: becomingBlocks });

  // PORT-SPEC §4's own rule: CLOSE.3 only for a rooted register, else
  // CLOSE.2 — CLOSE.1 (the "neutral fallback") has no stated trigger
  // condition anywhere in the spec and is left unreferenced here rather
  // than guessed at.
  const closeId = sigil.moving.register === 'rooted' ? 'CLOSE.3' : 'CLOSE.2';
  sections.push({ id: 'close', title: 'close', blocks: [block(closeId, sub(closeId))] });

  const wordCount = sections.reduce((n, s) => n + s.blocks.reduce((m, b) => m + b.text.split(/\s+/).filter(Boolean).length, 0), 0);
  return { sections, meta: { wordCount } };
}

/**
 * The nightly Sounding's five beats. `cast` is sky.js's castKind() output
 * for tonight's real moon position; `relation` is todayRelation()'s tārābala
 * result (Current); `light` is sky.js's moonPhase() output for tonight
 * (the Light). Determinism decided explicitly (SIGIL-READING doesn't spec
 * this): a re-visited Sounding for the SAME tonight (station, step, cast
 * kind) reads identically — the seed includes tonight's position and kind,
 * not just the natal sigil — a different night reads differently.
 */
export function soundingReading({ sigil, cast, relation, light, stations, copy }) {
  const seed = `${sigilSeed(sigil)}|${cast.current.station},${cast.current.step},${cast.kind}`;
  const now = stations.STATIONS[cast.current.station];
  const becomingSt = cast.becoming ? stations.STATIONS[cast.becoming.station] : null;
  const stepName = STEP_NAMES[cast.current.step];

  const station = {
    station: cast.current.station, step: cast.current.step, epithet: now.epithet, kanji: now.kanji,
    stars: now.stars, crossCultural: now.crossCultural, stepName,
  };
  const castBeat = {
    kind: cast.kind,
    now: { epithet: now.epithet, stepName },
    becoming: becomingSt ? { epithet: becomingSt.epithet, stepName: STEP_NAMES[cast.becoming.step] } : null,
    flavor: copy.CAST_FLAVOR[cast.kind],
  };
  const counsel = {
    body: now.dailyCrossing,
    relational: seededPick(copy.RELATIONAL_LINES, seed + ':relational')(relation.taraName, light.name),
  };
  const question = { text: seededPick(copy.SOUNDING_QUESTIONS, seed + ':question') };
  const claim = {
    station: cast.current.station, step: cast.current.step, epithet: now.epithet,
    stepName, closeLine: copy.CLAIM_CLOSE_LINE,
  };

  return { station, cast: castBeat, counsel, question, claim };
}
