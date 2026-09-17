// age-gate.js — the minimum signup age, by region, replacing the old flat
// MIN_MANZIL_AGE = 16 (30 Aug 2026, Justin's call: "13 worldwide, 16 only
// where it's legally necessary" — a reversal of the earlier "flat, global,
// no geolocation" decision in CLAUDE.md's Privacy invariant, made because
// a flat 16 over-restricts most of the audience and a flat 13 under-
// complies with the member states that set a higher digital-consent age).
//
// REGION DETECTION: no IP-geolocation service exists anywhere in this
// stack (no Cloudflare/CDN in front of the Synology box — see
// tools/deploy.sh — and adding a third-party geo-IP lookup means a new
// paid/rate-limited dependency plus logging visitors' IPs for a purpose
// this repo has otherwise gone out of its way to avoid). Instead the
// CLIENT sends its resolved IANA time zone (Intl.DateTimeFormat().
// resolvedOptions().timeZone — already computed for free, no permission
// prompt, no extra network call) and this module maps that to a country
// and a minimum age. This is a heuristic, not a legal geolocation result:
// a VPN, a travelling visitor, or a browser with its clock changed defeats
// it trivially. That is an ACCEPTED limitation, not an oversight — it puts
// this signal on the exact same trust footing as the birth date itself,
// which this app has always taken on the client's word (see server.js's
// own comment: "the client is never trusted to have actually called
// [age-check]" — the real boundary is the server-side re-check at signup,
// same as before, just keyed on a per-region minimum now instead of a
// constant).
//
// THE TABLE: GDPR Article 8(1) lets each EEA/UK member state set its own
// digital-consent age between 13 and 16 (16 is the article's own default
// for a state that sets nothing). Sourced 30 Aug 2026 against a published
// EU/EEA digital-age-of-consent comparison (countries below are the ones
// that set something OTHER than the 13-year floor; everything absent from
// COUNTRY_MIN_AGE, US/COPPA's 13 included, gets DEFAULT_MIN_AGE). This is
// a point-in-time legal snapshot, not a live feed — a member state can and
// occasionally does change its own number (Slovenia was mid-proposal to
// drop 16->15 as of this writing, kept at the more conservative 16 here);
// revisit this table periodically rather than trusting it indefinitely.
const DEFAULT_MIN_AGE = 13;

const COUNTRY_MIN_AGE = {
  // 16 — GDPR's own default, kept explicitly by these states
  DE: 16, HR: 16, HU: 16, IE: 16, LU: 16, NL: 16, PL: 16, RO: 16, SK: 16, SI: 16,
  // 15
  CZ: 15, FR: 15, GR: 15,
  // 14
  AT: 14, BG: 14, CY: 14, IT: 14, LT: 14, ES: 14,
  // everything else that showed up in the source table (BE, DK, EE, FI, LV,
  // MT, PT, SE, GB) is already the 13 floor — no entry needed, DEFAULT_MIN_AGE covers it
};

// IANA time zone -> ISO 3166-1 alpha-2, restricted to the zones that matter
// for this table (COUNTRY_MIN_AGE's keys) plus their common regional aliases.
// A country absent here silently falls through to DEFAULT_MIN_AGE, which is
// safe: the only failure mode of an unmapped zone is under-restricting an
// already-13-floor visitor, never a false 16.
const TZ_COUNTRY = {
  'Europe/Berlin': 'DE', 'Europe/Busingen': 'DE',
  'Europe/Zagreb': 'HR',
  'Europe/Budapest': 'HU',
  'Europe/Dublin': 'IE',
  'Europe/Luxembourg': 'LU',
  'Europe/Amsterdam': 'NL',
  'Europe/Warsaw': 'PL',
  'Europe/Bucharest': 'RO',
  'Europe/Bratislava': 'SK',
  'Europe/Ljubljana': 'SI',
  'Europe/Prague': 'CZ',
  'Europe/Paris': 'FR',
  'Europe/Athens': 'GR',
  'Europe/Vienna': 'AT',
  'Europe/Sofia': 'BG',
  'Asia/Nicosia': 'CY', 'Europe/Nicosia': 'CY', 'Asia/Famagusta': 'CY',
  'Europe/Rome': 'IT',
  'Europe/Vilnius': 'LT',
  'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Africa/Ceuta': 'ES',
};

/** tz: an IANA time zone string (e.g. "Europe/Berlin"), or anything falsy/
 * unrecognized. Returns the minimum signup age for that region, defaulting
 * to DEFAULT_MIN_AGE (13) for anywhere not in the table above. */
function minAgeForTz(tz) {
  if (typeof tz !== 'string' || !tz) return DEFAULT_MIN_AGE;
  const country = TZ_COUNTRY[tz];
  if (!country) return DEFAULT_MIN_AGE;
  return COUNTRY_MIN_AGE[country] || DEFAULT_MIN_AGE;
}

/** country: a two-letter ISO code, as Cloudflare's CF-IPCountry header gives
 * it. Same table as minAgeForTz, one step shorter because there is no time
 * zone to translate. Cloudflare sends "XX" when it genuinely cannot tell
 * (and "T1" for Tor); both fall through to the default, which is correct —
 * unknown is not the same as restricted. */
function minAgeForCountry(country) {
  if (typeof country !== 'string' || country.length !== 2) return DEFAULT_MIN_AGE;
  return COUNTRY_MIN_AGE[country.toUpperCase()] || DEFAULT_MIN_AGE;
}

// How the two signals combine when both are present. This is a product
// decision, not a technical one — see the comment on minAgeFor below.
//
//   'country'    (default, Justin's call 17 Sep 2026) trust the edge, and fall
//                back to the time zone only when the edge did not answer.
//                Strictly better geolocation than the client ever gave us, and
//                it does not over-restrict a traveller — which is the same
//                reasoning that reversed the flat-16 decision on 30 Aug. A VPN
//                still defeats it in one click, exactly as it defeats the time
//                zone today; this raises the floor, it does not close the door.
//   'strictest'  the higher of the two minimums. Harder to game (you would have
//                to defeat the edge AND your own clock), at the cost of
//                over-restricting real travellers and VPN users by a year or
//                three. Set AGE_REGION_POLICY=strictest to switch.
const COMBINE = process.env.AGE_REGION_POLICY === 'strictest' ? 'strictest' : 'country';

/** The one entry point callers should use.
 *
 * Both inputs are optional and both are advisory. `country` comes from
 * Cloudflare's CF-IPCountry header, which is real network-path geolocation
 * rather than a self-reported value, so it is a genuinely better signal than
 * the time zone the client sends. It is still not proof: a VPN moves it.
 *
 * NEITHER IS THE BOUNDARY. Signup re-checks the age server-side regardless,
 * exactly as before — this only decides WHICH minimum that re-check applies.
 * See the region-detection note at the top of this file, which this does not
 * replace so much as finally give a second opinion.
 */
function minAgeFor({ country, tz } = {}) {
  const byCountry = minAgeForCountry(country);
  const byTz = minAgeForTz(tz);
  // "Did the edge answer?", NOT "is this country in the elevated table?".
  // Most of the world is absent from COUNTRY_MIN_AGE precisely because it sits
  // at the 13 floor, so testing membership treated every US/CA/AU/JP answer as
  // no answer and fell through to the client's time zone — which is the one
  // signal the edge is supposed to outrank.
  const haveCountry = typeof country === 'string' && /^[A-Za-z]{2}$/.test(country)
    && !['XX', 'T1'].includes(country.toUpperCase());
  if (COMBINE === 'country') return haveCountry ? byCountry : byTz;
  return Math.max(byCountry, byTz);
}

/** Pull the edge's country out of a request, or null when there is no edge in
 * front of us.
 *
 * SPOOFABLE UNLESS THE EDGE IS ACTUALLY IN FRONT. CF-IPCountry is a plain
 * request header. If anything can reach this API without passing through
 * Cloudflare, a caller can set it by hand — and under the 'country' policy
 * that is a way to talk the minimum age down from 16 to 13. So server.js gates
 * every call to this behind TRUST_EDGE_HEADERS, which stays off until the API
 * itself is behind the tunnel and direct origin access is closed off. Off, this
 * whole path is inert and the time zone decides, exactly as it did before.
 */
function countryOfRequest(req) {
  const cc = req && req.headers && req.headers['cf-ipcountry'];
  if (typeof cc !== 'string' || cc.length !== 2) return null;
  const up = cc.toUpperCase();
  // Cloudflare's own sentinels for "no answer". Treat them as no answer.
  if (up === 'XX' || up === 'T1') return null;
  return up;
}

module.exports = {
  minAgeForTz,
  minAgeForCountry,
  minAgeFor,
  countryOfRequest,
  COMBINE,
  DEFAULT_MIN_AGE,
  COUNTRY_MIN_AGE,
  TZ_COUNTRY,
};
