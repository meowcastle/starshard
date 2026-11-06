// shard-engine.js: the shard, computed (SS7, 1 Nov 2026). Pure JavaScript, no React, no DOM,
// so test/shard.test.mjs runs it in Node and the page runs it in the browser.
//
// Nothing here composes prose. astro.js casts the chart (the same computeChart the chart page
// uses), sigil.js derives the shard's structure, reading.js fills the corpus (reading-copy.js)
// into the arrival reading and the full reading, findings.js enumerates the one checkable
// rarity with rates.js's measured rates, format.js prints degrees. All four are imported as
// they are. This module only arranges what they return into the shape the page draws: the
// name the shipped game gives a shard, the eight sections in UX-FLOW.md section 3's order
// under headers made only of words the reader arrived knowing, the "where this comes from"
// tier from stations.js, the compute readout's real lines, and the recognition and invite
// beats from the corpus. The corpus (400 KB) and the station table load on demand, so the
// shell's first load does not carry them.
//
// The house style pass (house.js) is applied by the renderer, not here: this module returns
// the corpus's own text so the tests can hold it against the corpus.
import { computeChart, SIGNS, signOf } from '../../astro.js';
import { moonPhase } from '../../sky.js';
import { deriveSigil, readingPlan, skyOf } from '../../sigil.js';
import { arrivalReading, fullReading } from '../../reading.js';
import { degFmt } from '../../format.js';
import { birthMoment } from './chart-engine.js';

const STEP_WORDS = ['entering', 'dwelling', 'turning', 'leaving'];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const low = s => String(s).toLowerCase();

// the handle the shipped game gives a shard: the sun's station of the moon's, 28 x 28 = 784
export function shardName(sunStation, moonStation, stations) {
  const a = low(stations.STATIONS[sunStation].epithet), b = low(stations.STATIONS[moonStation].epithet);
  return sunStation === moonStation ? `${a}, twice over` : `${a} of the ${b.replace(/^the /, '')}`;
}

/** The eight section headers, UX-FLOW.md section 3: only words the reader arrived knowing. */
export function sectionLabels(v) {
  return {
    strike: `your sun is in ${v.sunSign}`,
    root: `your moon is in ${v.moonSign}`,
    glow: `you were born under a ${v.phaseName}`,
    hand: `you arrived on a ${v.weekday}`,
    facing: v.risingSign ? `${v.risingSign} was rising` : 'what was rising',
    answering: 'the sky opposite you',
    gait: 'how you walk',
    becoming: "what you're turning into",
  };
}

/** The star-shard headline for a finding, the one checkable rarity. Points are the engine's
 * capitalised names; the sentence is the reader's. */
export function findingLine(f) {
  if (!f) return '';
  const p = f.points.map(low);
  switch (f.kind) {
    case 'colocation': return `your ${p[0]} and your ${p[1]} stand in the same station.`;
    case 'pile': return `your ${p.slice(0, -1).join(', ')} and your ${p[p.length - 1]} all stand in one station.`;
    case 'boundary': return `your ${p[0]} stands almost exactly on a station's edge.`;
    case 'quiet': return 'the four traditions agree on every point of your chart: nothing here disagrees.';
    case 'type': return 'your sun and your moon share one station.';
    case 'dissent': return `the four traditions disagree about this stretch of sky, and your ${p.join(', ')} stand${p.length === 1 ? 's' : ''} there.`;
    default: return f.detail || '';
  }
}

/** "1 in 23", from the measured rate. */
export function oneIn(rate) {
  if (!(rate > 0)) return '';
  return `1 in ${Math.round(1 / rate)}`;
}

/** The "where this comes from" tier for a station: the four skies, the stars, the animal. */
export function depthOf(st) {
  return {
    station: st.station + 1,
    epithet: low(st.epithet),
    slug: st.slug,
    // the four sky-maps the first run names are arabia, india, china and the zodiac; the
    // table's japan row is the grimoire's own note and stays in the codex
    skies: (st.crossCultural || []).filter(c => c.sky !== 'Japan').map(c => ({ sky: low(c.sky), name: c.name, meaning: c.meaning })),
    stars: st.stars || '',
    animal: st.animal || '',
    guardian: st.guardianSky || '',
    disagree: st.match !== 'STRONG',
    position: st.position || st.signSpan || '',
  };
}

/** The compute readout: real lines from the chart, in the order a reader can check them. */
export function readoutLines({ birth, chart, timeKnown, housed, stations, phaseName }) {
  const where = birth.placeName ? low(birth.placeName) : 'the place you arrived';
  const when = `${birth.birthDate}${timeKnown ? ` · ${birth.birthTime}` : ''}`;
  const lines = [
    `> resolving sky over ${where} · ${when}`,
    `> sun ......... ${low(degFmt(chart.sunLon))}`,
    `> moon ........ ${low(degFmt(chart.moonLon))}${timeKnown ? '' : ' (noon, about 6° either way)'}`,
  ];
  if (housed) lines.push(`> horizon ..... ${low(SIGNS[signOf(chart.asc)])} rising`);
  else lines.push('> horizon ..... needs the time');
  lines.push(`> phase ....... ${phaseName}`);
  lines.push(`> station ..... the moon in ${low(stations.STATIONS[chart.mansion].epithet)}, ${chart.mansion + 1} of 28`);
  lines.push('> cross-referencing four sky-maps ...');
  lines.push('> ✦ shard found');
  return lines;
}

/**
 * The shard. Async because the corpus, the station table and (for the finding) the planet
 * engine load on first use. `load` lets a test pass the modules in; the page lets the
 * bundler split them. Returns null for a birth record the engines cannot read.
 */
export async function castShard(birth, { load, name = '', findings = true } = {}) {
  const m = birthMoment(birth);
  if (!m) return null;
  const mods = load ? await load() : await loadModules();
  const { copy, stations, enumerateFindings } = mods;

  const chart = computeChart({ year: m.year, month: m.month, day: m.day, hour: m.hour, minute: m.minute, lat: m.lat, lon: m.lon, tzOffset: m.tzOffset });
  const timeKnown = m.timeKnown && m.hasPlace;
  const housed = timeKnown;
  const sigil = deriveSigil(chart, { timeKnown });
  const plan = readingPlan(sigil);
  const birthPlace = birth.placeName ? low(birth.placeName) : '';
  const args = { sigil, chart, stations, copy, skyOf, name: name || 'traveler', birthPlace };
  const arrival = arrivalReading({ ...args, plan });
  const full = fullReading(args);
  const phase = moonPhase(chart.sunLon, chart.moonLon);
  // "born under a full moon", "a last quarter moon": the phase names its light
  const phaseName = /moon/i.test(phase.name) ? low(phase.name) : `${low(phase.name)} moon`;

  const v = {
    sunSign: low(SIGNS[chart.sunSign]),
    moonSign: low(SIGNS[chart.moonSign]),
    risingSign: timeKnown ? low(SIGNS[chart.ascSign]) : null,
    phaseName,
    weekday: WEEKDAYS[chart.weekday],
    typeLabel: sigil.type.charAt(0).toUpperCase() + sigil.type.slice(1),
    sunEpithet: low(stations.STATIONS[sigil.sunStation].epithet),
    moonEpithet: low(stations.STATIONS[sigil.moonStation].epithet),
    becomingEpithet: low(stations.STATIONS[sigil.becoming].epithet),
  };
  const labels = sectionLabels(v);
  const sub = (id, extra = {}) => copy[id].text.replace(/\{(\w+)\}/g, (s, k) => (k in extra ? extra[k] : k in v ? v[k] : s));
  const byId = Object.fromEntries(full.sections.map(s => [s.id, s]));
  const stAt = i => stations.STATIONS[i];

  // the eight sections: header, the plain-fact lead, the corpus blocks, the depth tier
  const sections = [
    { id: 'strike', label: labels.strike, lead: sub('LEAD.strike'), blocks: byId.sun.blocks, depth: depthOf(stAt(sigil.sunStation)), step: STEP_WORDS[sigil.sunStep] },
    { id: 'root', label: labels.root, lead: sub('LEAD.root'), blocks: byId.moon.blocks, depth: depthOf(stAt(sigil.moonStation)), step: sigil.moonStep === null ? null : STEP_WORDS[sigil.moonStep] },
    { id: 'glow', label: labels.glow, lead: sub('LEAD.glow'), blocks: byId.light.blocks, depth: null },
    { id: 'hand', label: labels.hand, lead: sub('LEAD.hand'), blocks: byId.day.blocks, depth: null },
    { id: 'facing', label: labels.facing, lead: timeKnown ? sub('LEAD.facing') : null, blocks: byId.horizon.blocks, depth: timeKnown ? depthOf(stAt(sigil.risingStation)) : null },
    { id: 'answering', label: labels.answering, lead: sub('LEAD.answering'), blocks: byId.answeringSky.blocks, depth: depthOf(stAt(sigil.farlight)) },
    { id: 'gait', label: labels.gait, lead: sub('LEAD.gait'), blocks: byId.gait.blocks, depth: null, type: sigil.type },
    { id: 'becoming', label: labels.becoming, lead: sub('LEAD.becoming'), blocks: byId.becoming.blocks, depth: depthOf(stAt(sigil.becoming)) },
  ];

  let finding = null;
  if (findings && enumerateFindings) {
    try {
      const all = await enumerateFindings(chart, sigil, { timeKnown });
      if (all.length) finding = { ...all[0], line: findingLine(all[0]), oneIn: oneIn(all[0].rate) };
    } catch (e) { finding = null; }
  }

  return {
    chart, sigil, plan, timeKnown, housed,
    name: shardName(sigil.sunStation, sigil.moonStation, stations),
    sub: [`${v.sunSign} sun`, `${v.moonSign} moon`, v.risingSign ? `${v.risingSign} rising` : null, `born under a ${phaseName}`].filter(Boolean).join(' · '),
    handle: { line: sub('HANDLE.line'), type: sigil.type, typeLabel: v.typeLabel },
    strangeLine: arrival.handle.strangeLine,
    opening: full.sections[0].blocks[0].text,
    sections,
    close: byId.close.blocks[0].text,
    recognition: ['CLOSE.recognition.1', 'CLOSE.recognition.2', 'CLOSE.recognition.3'].map(id => copy[id].text),
    invite: { ring: copy['INVITE.ring'].text, road: copy['INVITE.road'].text, cta: copy['INVITE.cta'].text },
    finding,
    readout: readoutLines({ birth, chart, timeKnown: m.timeKnown, housed, stations, phaseName }),
    values: v,
    marks: [
      { role: 'sun', station: sigil.sunStation + 1, glyph: '☉' },
      { role: 'moon', station: sigil.moonStation + 1, glyph: '☽' },
      ...(timeKnown ? [{ role: 'rising', station: sigil.risingStation + 1, glyph: '✦' }] : []),
    ],
    stations: { sun: sigil.sunStation + 1, moon: sigil.moonStation + 1, rising: timeKnown ? sigil.risingStation + 1 : null, answering: sigil.farlight + 1, becoming: sigil.becoming + 1 },
    wordCount: full.meta.wordCount,
  };
}

/** The first-run copy the corpus carries (UX-FLOW.md section 2), with the two lines the
 * house style later retired left out: ARRIVAL.4 and ASK.place speak as "we". */
export function firstRunCopy(copy) {
  const t = id => copy[id].text;
  return {
    burst: [t('BURST.1'), t('BURST.2'), t('BURST.3')],
    skip: t('BURST.skip'),
    back: t('BURST.return'),
    arrival: [t('ARRIVAL.1'), t('ARRIVAL.2'), t('ARRIVAL.3')],
    how: ['arabia', 'india', 'china', 'europe'].map(k => t(`HOWITWORKS.${k}`)),
    ask: { head: t('ASK.head'), date: t('ASK.date'), time: t('ASK.time'), cta: t('ASK.cta') },
    cta: t('HANDLE.cta'),
  };
}

/** The on-demand modules, each its own chunk in the bundle. */
export async function loadModules() {
  const [copyMod, stations, findingsMod] = await Promise.all([
    import('../../reading-copy.js'),
    import('../../stations.js'),
    import('../../findings.js'),
  ]);
  return { copy: copyMod.COPY, stations, enumerateFindings: findingsMod.enumerateFindings };
}
