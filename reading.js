// Star Shard — the Sigil/Sounding composers: turns a derived Sigil into the
// arrival reading, the Full Reading, and the nightly Sounding.
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// The pre-reboot four-shard composers (buildShards/weave, the duet family,
// todayRelation/todayPhaseLine) were removed in the reading-corpus cleanup
// (August 13, 2026) — the four-shard flip UI and its supporting modules
// (windows.js, card.js, image-slot.js, duet.js, wheel.js, shards.js) are
// retired along with "Star Shard v2 (archived).dc.html", the only thing
// that ever called them. They're still in git history if a future feature
// wants the pattern back.

import { SIGNS } from './astro.js';

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

// Plain-language point labels for the PATTERN tab — the ring/point-marker
// labels ('rising', 'midheaven') read fine as headers but "sun + rising"
// reads better as a pair label than "sun + midheaven" does for "midheaven".
// Kept as a tiny local map rather than threading display strings through
// sigil.js's natalAspects(), which stays plain geometry.
const POINT_LABEL = { sun: 'sun', moon: 'moon', rising: 'rising', midheaven: 'midheaven' };

/**
 * The Deep Chart's PATTERN tab: sigil.js's natalAspects() geometry, matched
 * against the real corpus (corpus-chart-daily.md batch 7's ASPECT.* — ten
 * of the eighteen possible pair+aspect combinations are written; MC pairs
 * and a few pair+aspect combinations aren't yet).
 *
 * Mirrors Star Shard - Deep Chart (hi-fi).dc.html's own reference
 * implementation's choice on the missing-copy question deliberately, not
 * by coincidence: a hit with no written passage still appears in the list
 * (`hasPassage: false`, a `missing` dev flag naming the exact slot to
 * raise) rather than being silently dropped — PRODUCT.md §3 says "most
 * charts have one to three real aspects," and hiding an aspect that exists
 * because nobody's written it yet would make the tab quietly lie about the
 * chart's geometry instead of just being honest that the prose isn't there.
 *
 * `aspects` is sigil.js's natalAspects() output; `copy` is reading-copy.js's
 * COPY map.
 */
export function patternAspects(aspects, copy) {
  const items = aspects.map(a => {
    const key = `ASPECT.${a.from}${a.to}.${a.aspect}`;
    const entry = copy[key];
    return {
      pair: `${POINT_LABEL[a.from]} + ${POINT_LABEL[a.to]}`,
      aspect: a.aspect, plain: a.plain,
      orbUsed: Math.round(a.orbUsed * 10) / 10, maxOrb: a.maxOrb,
      text: entry ? entry.text : '',
      hasPassage: !!entry,
      missingIf: !entry,
      missing: entry ? '' : `${key} — not in corpus batch 7, raise it`,
    };
  });
  return { items, none: items.length === 0, noneText: copy['ASPECT.none'].text };
}

/**
 * The Deep Chart's DEPTH tab (PRODUCT.md §4): the four traditions' names
 * for the sun's and moon's stations, disagreements shown rather than
 * smoothed. Straight from stations.js's own crossCultural array (already
 * four traditions per station, already real prose) — no second parse of
 * mansions-table.json here; that's Star Shard - Deep Chart (hi-fi).dc.html's
 * own mansion-depth.js, a different (richer, per-tradition-match-flagged)
 * shape this codebase also has, but the live page's own DEPTH placeholder
 * says plainly "stations.js already holds it," and it does.
 *
 * sunStation/moonStation are never null (unlike risingStation) — Sun and
 * Moon longitude are always known regardless of birth time.
 */
export function depthReading(sigil, stations) {
  const pick = (station, which) => {
    const s = stations.STATIONS[station];
    return {
      which, epithet: s.epithet, kanji: s.kanji, span: s.signSpan,
      stars: s.stars, traditions: s.crossCultural, match: s.match || 'unmarked',
      // stations.js's real match values are STRONG/PARTIAL/null (verified —
      // not the fuller STRONG/PARTIAL/DIVERGENT range mansions-table.json's
      // raw data can carry); anything short of a clean STRONG match is
      // exactly the "disagreement" PRODUCT.md §4 wants shown, not smoothed.
      needsFlag: s.match !== 'STRONG',
    };
  };
  return { strike: pick(sigil.sunStation, 'sun'), root: pick(sigil.moonStation, 'moon') };
}

/**
 * The Deep Chart's HOUSES tab (PRODUCT.md §2): which house the sun, the
 * moon, and the ascendant's ruler each fall in, framed as "this part of
 * you plays out here" — plus the empty-house honesty note (most houses
 * have nothing in them, and that's normal) and, above 66° latitude, the
 * Porphyry-fallback note. All three passage families are corpus batch 7,
 * every house/note slot written — unlike PATTERN there's no missing-copy
 * case to flag here.
 *
 * `chart` is astro.js's computeChart() output (already carries sunHouse/
 * moonHouse); `ascRuler` is sigil.js's ascRulerHouse(chart) output (null
 * without a birth time); `copy` is reading-copy.js's COPY map.
 */
export function houseReading(chart, ascRuler, copy) {
  const houseText = n => copy[`HOUSE.${String(n).padStart(2, '0')}`].text;
  const placements = [
    { which: 'sun', label: 'your sun plays out here', number: chart.sunHouse },
    { which: 'moon', label: 'your moon lives here', number: chart.moonHouse },
  ];
  if (ascRuler) {
    placements.push({
      which: 'ruler', number: ascRuler.house,
      label: `your rising's ruler, ${ascRuler.ruler}, lives here`,
    });
  }
  return {
    placements: placements.map(p => ({ ...p, text: houseText(p.number) })),
    emptyNote: copy['HOUSE.empty'].text,
    porphyryNote: chart.houseSystem === 'porphyry' ? copy['HOUSE.porphyry'].text : '',
    isPorphyry: chart.houseSystem === 'porphyry',
  };
}
