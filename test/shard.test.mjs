// Star Shard — the shard page's engine and its house style pass (BACKLOG SS7).
//
// shard-engine.js arranges reading.js, findings.js and sigil.js's output for the page; house.js
// is the render-time pass that keeps corpus text inside tools/writing-lint.mjs's two mechanical
// rules (no em dashes, no "mansion"). These tests hold both: every section present with real
// text for several charts, the headers made only of words the reader arrived knowing, the
// compute readout's lines real, the game's shard name, and the house pass clean against the
// lint's own patterns over the whole corpus.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { castShard, shardName, sectionLabels, findingLine, oneIn, firstRunCopy, loadModules } from '../app/src/shard-engine.js';
import { house, dashes, stations, paragraphs, lowerNames } from '../app/src/house.js';
import { COPY } from '../reading-copy.js';
import * as STATIONS from '../stations.js';

const EM = /—|\s–\s|\s--\s/;
const MANSION = /\bmansions?\b/i;

const BIRTHS = [
  { name: 'new york 1985', birth: { birthDate: '1985-03-15', birthTime: '06:30', birthTimeKnown: true, placeName: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' } },
  { name: 'greenwich 2000', birth: { birthDate: '2000-01-01', birthTime: '12:00', birthTimeKnown: true, placeName: 'Greenwich', lat: 51.4779, lon: -0.0015, tz: 'Europe/London' } },
  { name: 'sydney 1992', birth: { birthDate: '1992-11-23', birthTime: '22:45', birthTimeKnown: true, placeName: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' } },
  { name: 'noon chart', birth: { birthDate: '1972-07-04', birthTime: null, birthTimeKnown: false, placeName: 'Chicago', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' } },
  { name: 'no place', birth: { birthDate: '1999-12-31', birthTime: '23:59', birthTimeKnown: true, placeName: 'a village' } },
];
const SECTION_IDS = ['strike', 'root', 'glow', 'hand', 'facing', 'answering', 'gait', 'becoming'];
const load = async () => ({ copy: COPY, stations: STATIONS, enumerateFindings: null });

test('castShard: every section present with real text, for five births', async () => {
  for (const { name, birth } of BIRTHS) {
    const s = await castShard(birth, { load });
    assert.ok(s, name);
    assert.deepEqual(s.sections.map(x => x.id), SECTION_IDS, name);
    for (const sec of s.sections) {
      assert.ok(sec.label.length > 0, `${name}: ${sec.id} has a header`);
      assert.ok(sec.blocks.length > 0 && sec.blocks.every(b => b.text.length > 40), `${name}: ${sec.id} has corpus text`);
      assert.ok(!/\{\w+\}/.test(sec.blocks.map(b => b.text).join(' ')), `${name}: ${sec.id} has no leftover token`);
      if (sec.lead) assert.ok(!/\{\w+\}/.test(sec.lead), `${name}: ${sec.id}'s lead has no leftover token`);
    }
    assert.ok(s.opening.length > 100 && s.close.length > 50, name);
    assert.equal(s.recognition.length, 3);
    assert.ok(s.strangeLine.length > 10);
    assert.ok(s.wordCount > 700, `${name}: ${s.wordCount} words`);
  }
});

test('the headers are only words the reader arrived knowing (UX-FLOW.md section 3)', async () => {
  const s = await castShard(BIRTHS[0].birth, { load });
  const labels = s.sections.map(x => x.label);
  assert.deepEqual(labels, ['your sun is in pisces', 'your moon is in capricorn', 'you were born under a last quarter moon', 'you arrived on a friday', 'aries was rising', 'the sky opposite you', 'how you walk', "what you're turning into"]);
  // no epithet, no type name, no station number in a header
  for (const l of labels) {
    assert.ok(!/seedborn|homebound|outbound|emberwake|farbank/i.test(l), l);
    assert.ok(!/\bstation\b/.test(l), l);
    assert.ok(!EM.test(l) && !MANSION.test(l), l);
  }
  const v = { sunSign: 'leo', moonSign: 'aries', phaseName: 'full moon', weekday: 'sunday', risingSign: null };
  assert.equal(sectionLabels(v).facing, 'what was rising');
});

test('a noon chart and a chart without a place carry no horizon, no rising mark, and say so', async () => {
  for (const b of [BIRTHS[3].birth, BIRTHS[4].birth]) {
    const s = await castShard(b, { load });
    assert.equal(s.housed, false);
    assert.equal(s.sections[4].label, 'what was rising');
    assert.equal(s.sections[4].lead, null);
    assert.equal(s.sections[4].depth, null);
    assert.ok(/needs a clock/.test(s.sections[4].blocks[0].text));
    assert.equal(s.marks.length, 2);
    assert.ok(!/rising/.test(s.sub));
    assert.ok(s.readout.some(l => /horizon .* needs the time/.test(l)));
  }
});

test('the shard name is the game\'s: the sun\'s station of the moon\'s, or twice over', () => {
  assert.equal(shardName(0, 27, STATIONS), 'the gate of the thread');
  assert.equal(shardName(2, 20, STATIONS), 'the gathered stars of the empty district');
  assert.equal(shardName(5, 5, STATIONS), 'the storm, twice over');
});

test('the compute readout is the chart\'s real values, in order', async () => {
  const s = await castShard(BIRTHS[0].birth, { load });
  assert.equal(s.readout.length, 8);
  assert.match(s.readout[0], /^> resolving sky over new york · 1985-03-15 · 06:30$/);
  assert.match(s.readout[1], /^> sun \.+ 24°50′ pisces$/);
  assert.match(s.readout[2], /^> moon \.+ 16°13′ capricorn$/);
  assert.match(s.readout[3], /^> horizon \.+ aries rising$/);
  assert.match(s.readout[4], /^> phase \.+ last quarter moon$/);
  assert.match(s.readout[5], /^> station \.+ the moon in the drum, 23 of 28$/);
  assert.equal(s.readout[7], '> ✦ shard found');
});

test('the natal marks sit where the chart page puts them', async () => {
  const s = await castShard(BIRTHS[0].birth, { load });
  assert.deepEqual(s.stations, { sun: 28, moon: 23, rising: 1, answering: 14, becoming: 1 });
  assert.deepEqual(s.marks.map(m => [m.role, m.station]), [['sun', 28], ['moon', 23], ['rising', 1]]);
});

test('the finding line and its rate', () => {
  assert.equal(findingLine({ kind: 'boundary', points: ['Mercury'] }), "your mercury stands almost exactly on a station's edge.");
  assert.equal(findingLine({ kind: 'colocation', points: ['Sun', 'Venus'] }), 'your sun and your venus stand in the same station.');
  assert.equal(findingLine({ kind: 'pile', points: ['Sun', 'Mercury', 'Venus'] }), 'your sun, mercury and your venus all stand in one station.');
  assert.ok(!MANSION.test(findingLine({ kind: 'dissent', points: ['Moon'] })));
  assert.equal(oneIn(1 / 26), '1 in 26');
  assert.equal(oneIn(0.0384), '1 in 26');
  assert.equal(oneIn(0), '');
});

test('the first-run copy comes from the corpus, without the two lines that speak as "we"', () => {
  const c = firstRunCopy(COPY);
  assert.equal(c.burst.length, 3);
  assert.equal(c.arrival.length, 3);
  assert.equal(c.how.length, 4);
  assert.ok(c.how.every(l => /^`[A-Z]+`/.test(l)));
  for (const t of [...c.burst, ...c.arrival, ...c.how, c.ask.head, c.ask.date, c.ask.time, c.cta]) assert.ok(!/\bwe\b/.test(t), t);
});

test('house: the lint\'s two mechanical rules hold over the whole corpus and station table', () => {
  let n = 0;
  for (const slot of Object.values(COPY)) {
    const t = house(slot.text);
    assert.ok(!EM.test(t), t);
    assert.ok(!MANSION.test(t), t);
    n++;
  }
  for (const st of STATIONS.STATIONS) {
    for (const t of [st.position, st.stars, st.electionLore, st.birthEntry, st.dailyCrossing, ...(st.crossCultural || []).flatMap(c => [c.name, c.meaning])]) {
      const h = house(t);
      assert.ok(!EM.test(h), h);
      assert.ok(!MANSION.test(h), h);
    }
  }
  assert.ok(n > 390);
});

test('house: a dash becomes a comma pair, a range keeps its sense, a name is lowered', () => {
  assert.equal(dashes('the sun — the one you know — stood here'), 'the sun, the one you know, stood here');
  assert.equal(dashes('that isn\'t a lack — it\'s room.'), 'that isn\'t a lack, it\'s room.');
  assert.equal(dashes('0°00′ Aries – 12°51′ Aries'), '0°00′ Aries to 12°51′ Aries');
  assert.equal(dashes('between 13–17 degrees'), 'between 13–17 degrees');
  assert.equal(dashes('a stomach — and yama at the door of them.'), 'a stomach, and yama at the door of them.');
  assert.equal(stations('the best of the twenty-eight mansions; this mansion'), 'the best of the twenty-eight stations; this station');
  assert.equal(lowerNames('Emberwake of The Thread, and The Gate'), 'emberwake of the thread, and the gate');
  assert.equal(house('nothing to change here'), 'nothing to change here');
});

test('house: paragraphs keep the corpus\'s emphasis as runs, never markup', () => {
  const p = paragraphs('you *are* the crossing.\n\nsecond — here.');
  assert.deepEqual(p, [[{ text: 'you ' }, { em: 'are' }, { text: ' the crossing.' }], [{ text: 'second, here.' }]]);
});

test('loadModules: the on-demand modules carry the corpus and the station table', async () => {
  const m = await loadModules();
  assert.ok(m.copy['OPEN.address.1'] && m.stations.STATIONS.length === 28 && typeof m.enumerateFindings === 'function');
});
