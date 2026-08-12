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

/**
 * The arrival reading's nine beats, filled with real text. `plan` is
 * sigil.js's readingPlan(sigil) output; `stations` is stations.js's module;
 * `copy` is sigil-copy.js's module. Returns one object keyed by beat id.
 */
export function arrivalReading({ sigil, plan, stations, copy, name }) {
  const seed = sigilSeed(sigil);
  const who = name || 'traveler';
  const stationAt = station => stations.STATIONS[station];
  const out = {};

  for (const beat of plan.beats) {
    if (beat.id === 'ring') {
      out.ring = { line: copy.RING_OPEN_LINES[0] };
    } else if (beat.id === 'strike') {
      const st = stationAt(beat.station);
      const stepName = copy.STEP_NAMES[beat.step];
      out.strike = {
        station: beat.station, step: beat.step, epithet: st.epithet, kanji: st.kanji, stepName,
        headline: seededPick(copy.STRIKE_HEADLINES, seed + ':strike')(st.epithet, stepName),
        body: st.birthEntry,
      };
    } else if (beat.id === 'root') {
      const st = stationAt(beat.station);
      let line;
      if (beat.crossingDay) line = seededPick(copy.ROOT_CROSSING_DAY_LINES, seed + ':root')(st.epithet);
      else if (beat.step === null) line = seededPick(copy.ROOT_NO_STEP_LINES, seed + ':root')(st.epithet);
      else if (beat.agreesWithStrike) line = seededPick(copy.ROOT_AGREE_LINES, seed + ':root')(st.epithet);
      else line = seededPick(copy.ROOT_CONFLICT_LINES, seed + ':root')(st.epithet);
      out.root = {
        station: beat.station, step: beat.step, epithet: st.epithet, kanji: st.kanji,
        stepName: beat.step === null ? null : copy.STEP_NAMES[beat.step],
        line, body: st.dailyCrossing,
      };
    } else if (beat.id === 'glow') {
      out.glow = { light: beat.light, line: copy.LIGHT_GLOSSES[beat.light] };
    } else if (beat.id === 'hand') {
      out.hand = { keeper: beat.keeper, line: copy.KEEPER_GLOSSES[beat.keeper] };
    } else if (beat.id === 'facing') {
      if (beat.skip) { out.facing = { skip: true }; continue; }
      const st = stationAt(beat.station);
      out.facing = {
        skip: false, station: beat.station, epithet: st.epithet, kanji: st.kanji,
        line: seededPick(copy.FACING_LINES, seed + ':facing')(st.epithet),
      };
    } else if (beat.id === 'answering') {
      const st = stationAt(beat.station);
      out.answering = {
        station: beat.station, epithet: st.epithet, kanji: st.kanji,
        line: seededPick(copy.ANSWERING_LINES, seed + ':answering')(st.epithet),
      };
    } else if (beat.id === 'gait') {
      const g = copy.GAIT_LINES[beat.type];
      out.gait = { type: beat.type, gait: g.gait, permission: g.permission };
    } else if (beat.id === 'handle') {
      const sunSt = stationAt(beat.sunStation);
      const typeLabel = beat.type.charAt(0).toUpperCase() + beat.type.slice(1);
      out.handle = {
        type: beat.type, typeLabel, epithet: sunSt.epithet,
        headline: seededPick(copy.HANDLE_LINES, seed + ':handle')(who, typeLabel, sunSt.epithet),
        strangeLine: seededPick(copy.STRANGE_LINES, seed + ':strange'),
      };
    }
  }
  return out;
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
  const stepName = copy.STEP_NAMES[cast.current.step];

  const station = {
    station: cast.current.station, step: cast.current.step, epithet: now.epithet, kanji: now.kanji,
    stars: now.stars, crossCultural: now.crossCultural, stepName,
  };
  const castBeat = {
    kind: cast.kind,
    now: { epithet: now.epithet, stepName },
    becoming: becomingSt ? { epithet: becomingSt.epithet, stepName: copy.STEP_NAMES[cast.becoming.step] } : null,
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
