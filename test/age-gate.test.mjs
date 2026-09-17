// The region -> minimum-signup-age table, and how the two region signals
// combine. This exists because the combine rule has a failure mode that reads
// as correct: most of the world is deliberately ABSENT from COUNTRY_MIN_AGE
// (it sits at the 13 floor), so any "is this country in the table?" test
// treats a US/CA/JP edge answer as no answer at all and falls through to the
// client's time zone — the one signal the edge is meant to outrank. That bug
// was written and caught here; these vectors are what keep it caught.
//
// OWNER: Claude Code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const gate = require(path.resolve(import.meta.dirname, '../starshard-api/lib/age-gate.js'));
const { minAgeFor, minAgeForTz, minAgeForCountry, countryOfRequest, DEFAULT_MIN_AGE } = gate;

test('the default policy trusts the edge and falls back to the time zone', () => {
  assert.equal(gate.COMBINE, 'country');
});

test('the edge outranks the clock, in both directions', () => {
  // A German IP with a US clock is 16 — the clock does not talk it down.
  assert.equal(minAgeFor({ country: 'DE', tz: 'America/New_York' }), 16);
  // A US IP with a Berlin clock is 13 — the clock does not talk it up either.
  assert.equal(minAgeFor({ country: 'US', tz: 'Europe/Berlin' }), 13);
});

test('a floor country is an ANSWER, not a missing one', () => {
  // The regression guard. These are all absent from COUNTRY_MIN_AGE.
  for (const cc of ['US', 'CA', 'AU', 'JP', 'BR']) {
    assert.equal(minAgeFor({ country: cc, tz: 'Europe/Dublin' }), DEFAULT_MIN_AGE,
      `${cc} edge answer should hold at the floor, not fall through to the tz`);
  }
});

test('the time zone still decides when the edge says nothing', () => {
  assert.equal(minAgeFor({ tz: 'Europe/Berlin' }), 16);
  assert.equal(minAgeFor({ tz: 'Europe/Paris' }), 15);
  assert.equal(minAgeFor({ tz: 'Europe/Madrid' }), 14);
  assert.equal(minAgeFor({ tz: 'America/Los_Angeles' }), DEFAULT_MIN_AGE);
  assert.equal(minAgeFor({}), DEFAULT_MIN_AGE);
});

test("Cloudflare's own no-answer sentinels fall through rather than restrict", () => {
  // XX is "could not determine", T1 is Tor. Unknown is not the same as strict.
  assert.equal(countryOfRequest({ headers: { 'cf-ipcountry': 'XX' } }), null);
  assert.equal(countryOfRequest({ headers: { 'cf-ipcountry': 'T1' } }), null);
  assert.equal(minAgeFor({ country: 'XX', tz: 'Europe/Dublin' }), 16);
});

test('the header is read case-insensitively and validated', () => {
  assert.equal(countryOfRequest({ headers: { 'cf-ipcountry': 'de' } }), 'DE');
  assert.equal(countryOfRequest({ headers: {} }), null);
  assert.equal(countryOfRequest({ headers: { 'cf-ipcountry': 'DEU' } }), null);
  assert.equal(countryOfRequest({}), null);
  assert.equal(countryOfRequest(null), null);
});

test('minAgeForTz keeps its old behaviour exactly', () => {
  // Every existing caller predates the edge signal and must be unaffected.
  assert.equal(minAgeForTz('Europe/Berlin'), 16);
  assert.equal(minAgeForTz('Europe/Athens'), 15);
  assert.equal(minAgeForTz('Europe/Rome'), 14);
  assert.equal(minAgeForTz('America/New_York'), 13);
  assert.equal(minAgeForTz(undefined), 13);
  assert.equal(minAgeForTz('Not/AZone'), 13);
});

test('every elevated country resolves through both signals identically', () => {
  for (const [cc, age] of Object.entries(gate.COUNTRY_MIN_AGE)) {
    assert.equal(minAgeForCountry(cc), age);
    assert.equal(minAgeFor({ country: cc }), age, `${cc} via minAgeFor`);
  }
});

test('the tz table only maps to countries the age table knows', () => {
  for (const [tz, cc] of Object.entries(gate.TZ_COUNTRY)) {
    assert.ok(gate.COUNTRY_MIN_AGE[cc], `${tz} -> ${cc} has no entry in COUNTRY_MIN_AGE`);
  }
});
