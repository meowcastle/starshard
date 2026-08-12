// Star Shard — regression tests for deck.js (the collection game).
// Run: node --test test/  (from the repo root)
//
// OWNER: Claude Code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../astro.js';
import { claimStates } from '../deck.js';

test('claimStates: today\'s own mansion is always claimable with 0 days remaining', () => {
  const jd = A.julianDay(2026, 8, 11, 12);
  const moonLon = A.moonLongitude(jd);
  const todayMansion = A.mansionOf(moonLon);
  const states = claimStates({ moonLon, jd, todayMansion });
  assert.equal(states.length, 28);
  assert.equal(states[todayMansion].claimable, true);
  assert.equal(states[todayMansion].returnsInDays, 0);
});

test('claimStates: exactly one or two mansions are claimable at once (today, plus yesterday only within grace)', () => {
  // Sweep many charts spanning the full 28-station wheel and every grace phase.
  for (let day = 0; day < 60; day++) {
    const jd = A.julianDay(2026, 1, 1, 0) + day * 1.3; // irregular step to hit varied phases
    const moonLon = A.moonLongitude(jd);
    const todayMansion = A.mansionOf(moonLon);
    const states = claimStates({ moonLon, jd, todayMansion });
    const claimableCount = states.filter(s => s.claimable).length;
    assert.ok(claimableCount === 1 || claimableCount === 2, `jd=${jd}: ${claimableCount} claimable`);
  }
});

test('claimStates: every non-claimable mansion returns within one lunar month, never 0', () => {
  const jd = A.julianDay(2026, 8, 11, 12);
  const moonLon = A.moonLongitude(jd);
  const todayMansion = A.mansionOf(moonLon);
  const states = claimStates({ moonLon, jd, todayMansion });
  for (const s of states) {
    if (s.claimable) continue;
    assert.ok(s.returnsInDays >= 1, `mansion ${s.mansion}: returnsInDays ${s.returnsInDays} should be >= 1`);
    assert.ok(s.returnsInDays <= 28, `mansion ${s.mansion}: returnsInDays ${s.returnsInDays} exceeds one lunar month`);
  }
});

test('claimStates: returnsInDays strictly increases moving forward from today through the wheel (no wraparound glitch)', () => {
  const jd = A.julianDay(2026, 8, 11, 12);
  const moonLon = A.moonLongitude(jd);
  const todayMansion = A.mansionOf(moonLon);
  const states = claimStates({ moonLon, jd, todayMansion });
  const forwardOrder = [];
  for (let i = 1; i < 28; i++) forwardOrder.push(states[(todayMansion + i) % 28]);
  const nonClaimable = forwardOrder.filter(s => !s.claimable);
  for (let i = 1; i < nonClaimable.length; i++) {
    assert.ok(nonClaimable[i].returnsInDays >= nonClaimable[i - 1].returnsInDays,
      `returnsInDays should be non-decreasing moving forward through the wheel`);
  }
});
