// manzil-cast.test.js, the server-side cast (lib/manzil-cast.js) obeys the client's rule.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { castFive, birthInstant, packFromBirth } = require('../lib/manzil-cast');

const ORDER = ['sun', 'moon', 'mercury', 'venus', 'mars'];

test('castFive: five unique station ids, rows in the client order, fill explains the rest', () => {
  let seed = 12345;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 300; i++) {
    const t = Date.UTC(1930 + Math.floor(rand() * 90), Math.floor(rand() * 12), 1 + Math.floor(rand() * 28), Math.floor(rand() * 24), Math.floor(rand() * 60));
    const { rows, five, fill } = castFive(new Date(t));
    assert.deepEqual(rows.map(r => r.p), ORDER);
    assert.equal(five.length, 5);
    assert.equal(new Set(five).size, 5);
    five.forEach(id => assert.ok(Number.isInteger(id) && id >= 1 && id <= 28, `bad id ${id}`));
    const fromRows = [];
    rows.forEach(r => { if (!fromRows.includes(r.m)) fromRows.push(r.m); });
    assert.deepEqual(five.slice(0, fromRows.length), fromRows, 'the chart planets come first, in order, deduplicated');
    assert.equal(fill.length, 5 - fromRows.length, 'every slot the planets did not fill is accounted for');
    assert.deepEqual(five.slice(fromRows.length), fill.map(f => f.m));
    fill.forEach(f => assert.ok(['jupiter', 'saturn', 'the road'].includes(f.p)));
  }
});

test('castFive: a pinned vector (regression pin from the same code on 28 Oct 2026, not an independent check)', () => {
  const { five, fill } = castFive(new Date(Date.UTC(1990, 5, 15, 12, 0)));
  assert.deepEqual(five, [7, 27, 6, 4, 1]);
  assert.deepEqual(fill, []);
});

test('birthInstant: a birthplace tz corrects the wall clock; no tz reads as UTC; no time reads as noon', async () => {
  const ny = await birthInstant({ birthDate: '1990-06-15', birthTime: '14:30', birthTimeKnown: true, tz: 'America/New_York' });
  assert.equal(ny.toISOString(), '1990-06-15T18:30:00.000Z');
  const utc = await birthInstant({ birthDate: '1990-06-15', birthTime: '14:30', birthTimeKnown: true, tz: null });
  assert.equal(utc.toISOString(), '1990-06-15T14:30:00.000Z');
  const noon = await birthInstant({ birthDate: '1990-06-15', birthTime: null, birthTimeKnown: false, tz: 'Asia/Tokyo' });
  assert.equal(noon.toISOString(), '1990-06-15T03:00:00.000Z');
});

test('packFromBirth: pack equals five, as the live client sends it', async () => {
  const r = await packFromBirth({ birthDate: '2001-02-03', birthTime: '04:05', birthTimeKnown: true, tz: 'Europe/Paris' });
  assert.deepEqual(r.pack, r.five);
  assert.equal(r.five.length, 5);
});
