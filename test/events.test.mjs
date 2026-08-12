// Star Shard — regression tests for events.js (the event calendar / foils).
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, PLEIADES_MANSION_INDEX, foilInfo, eventsOn } from '../events.js';

test('every EVENTS entry has a valid ISO date and non-empty name', () => {
  for (const e of EVENTS) {
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/, `bad date: ${e.date}`);
    assert.ok(e.name && e.name.length > 0);
    assert.ok(typeof e.foil === 'boolean');
  }
});

test('EVENTS is sorted chronologically (no drift as entries get added)', () => {
  for (let i = 1; i < EVENTS.length; i++) {
    assert.ok(EVENTS[i].date >= EVENTS[i - 1].date, `out of order at index ${i}: ${EVENTS[i - 1].date} then ${EVENTS[i].date}`);
  }
});

test('the flagship Aug 2 2027 total eclipse is present and marked foil', () => {
  const e = EVENTS.find(e => e.date === '2027-08-02');
  assert.ok(e, 'Aug 2 2027 eclipse missing');
  assert.equal(e.foil, true);
  assert.match(e.name, /total solar eclipse/i);
});

test('Al-Thurayyā (mansion index 2) is always foil, on any date, event or not', () => {
  const quietDay = new Date('2026-10-01T12:00:00Z');
  const r = foilInfo(quietDay, PLEIADES_MANSION_INDEX);
  assert.equal(r.foil, true);
  assert.match(r.reason, /Thurayyā|Pleiades/);
});

test('a non-Pleiades mansion on a quiet day is never foil', () => {
  const quietDay = new Date('2026-10-01T12:00:00Z');
  const r = foilInfo(quietDay, 5);
  assert.equal(r.foil, false);
  assert.equal(r.reason, null);
});

test('a non-Pleiades mansion on the eclipse day IS foil (event-day, not mansion-specific)', () => {
  const eclipseDay = new Date('2027-08-02T12:00:00Z');
  const r = foilInfo(eclipseDay, 5);
  assert.equal(r.foil, true);
  assert.match(r.reason, /total solar eclipse/i);
});

test('a non-foil event (e.g. an ordinary full moon) does not trigger foilInfo, but does show in eventsOn', () => {
  const day = new Date('2026-10-26T12:00:00Z'); // Hunter's Moon, foil:false
  const r = foilInfo(day, 5);
  assert.equal(r.foil, false);
  const on = eventsOn(day);
  assert.equal(on.length, 1);
  assert.match(on[0].name, /Hunter/);
});
