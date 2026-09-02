// Star Shard — all network I/O. Nothing else in the app may call fetch().
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// PRIVACY (revised 24 Aug PM 2026 — Justin's call, two tiers now): the chart
// is still always computed in the browser by astro.js, and a visitor who
// never creates an account still sends nothing birth-related anywhere —
// that part of the old "never sent" claim is unchanged. Manzil requires a
// real account to play, but signup() sends only five integers (the
// chart-owned mansions) and a birth year for age re-derivation — never the
// full birth date/time/place. Full birth data only reaches the backend via
// getBirth()/saveBirth() below, and only when an account explicitly opts
// into a Star Shard reading. Don't restate the old "never sent, ever" claim,
// and don't assume signup() sends full birth data either — check this
// comment first.

export const API_BASE = typeof location !== 'undefined' ? `https://api.${location.hostname}` : '';

const GEOCODER = 'https://geocoding-api.open-meteo.com/v1/search';

class ApiError extends Error {
  constructor(code, status) { super(code); this.code = code; this.status = status; }
}

async function call(path, { method = 'GET', body } = {}) {
  let r;
  try {
    r = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError('unreachable', 0);
  }
  if (r.status === 204) return null;
  let j = null;
  try { j = await r.json(); } catch (e) { /* empty body is fine */ }
  if (!r.ok) throw new ApiError(j?.error || 'server_error', r.status);
  return j;
}

// --- city lookup -----------------------------------------------------------

export async function geocode(query) {
  const url = `${GEOCODER}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const r = await fetch(url);
  const j = await r.json();
  return (j.results || []).map(x => ({
    name: x.name,
    region: [x.admin1, x.country].filter(Boolean).join(', '),
    lat: x.latitude,
    lon: x.longitude,
    tz: x.timezone,
  }));
}

// --- accounts --------------------------------------------------------------

/** Resolves to { email, username } when signed in, or null when not. Never throws. */
export async function me() {
  try { return await call('/api/me'); } catch (e) { return null; }
}

/** Best-effort IANA time zone read, used only to pick which region's
 * minimum signup age applies (30 Aug 2026, Justin's call: 13 worldwide,
 * 16 — or 14/15 — only in the handful of GDPR states that set a higher
 * digital-consent age; replaces the old flat 16). Never throws; "" reads
 * as "unknown region" server-side, which falls back to the 13 floor —
 * see starshard-api/lib/age-gate.js for the actual table and why a time
 * zone, not real IP geolocation, is the signal used here. */
function detectTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
}

/** extra carries { username, birthDate, five, pack } — birthDate is
 * re-validated server-side for the age gate but, per the two-tier privacy
 * model, only its YEAR is stored (manzil_pack.birth_year); five/pack (the
 * chart-owned mansions + starting deck) are what's actually persisted for
 * Manzil. Call ageCheck() first — a client that skips straight to signup()
 * with an under-the-regional-minimum birthDate still gets rejected
 * (too_young), just later and with a worse UX, since the server never
 * trusts the client to have called ageCheck() at all. A caller may pass
 * its own `extra.tz`; otherwise this fills one in automatically. */
export async function signup(email, password, extra = {}) {
  const body = { email, password, ...extra };
  if (body.tz == null) body.tz = detectTz();
  return call('/api/auth/signup', { method: 'POST', body });
}

export async function login(email, password) {
  return call('/api/auth/login', { method: 'POST', body: { email, password } });
}

/** Manzil's sign-in collects a username, not an email — the server's
 * /api/auth/login accepts either, this just sends the right field. */
export async function loginWithUsername(username, password) {
  return call('/api/auth/login', { method: 'POST', body: { username, password } });
}

/** Resolves to { ok: boolean }. Nothing is persisted either way — this is
 * the reasonable-effort age gate the account-creation screens call right
 * after the birth date is entered and before ever showing the rest of the
 * signup fields, so someone below their region's minimum never reaches a
 * signup screen. Not itself a security boundary; signup() re-checks
 * server-side regardless, with its own tz read (never trusts this call's).
 * `tz` is optional — an IANA time zone string; omit it to auto-detect.
 * Throws on a malformed date (invalid_birth_date) — callers should already
 * have validated the date client-side before this ever fires. */
export async function ageCheck(birthDate, tz) {
  return call('/api/auth/age-check', { method: 'POST', body: { birthDate, tz: tz == null ? detectTz() : tz } });
}

// --- birth data (server-side, per account) ----------------------------------
// Manzil's chart-owned cards and Star Shard's chart both start from this —
// see the revised PRIVACY note above for why this now exists server-side.

/** Resolves to the saved birth object, or null (no account, or none saved
 * yet). Never throws. */
export async function getBirth() {
  try {
    const j = await call('/api/me/birth');
    return j && typeof j.birth === 'object' ? j.birth : null;
  } catch (e) { return null; }
}

/** Never throws — matches saveSigil's "a failed sync must not interrupt the
 * flow" precedent. Upserts; used both at signup and later to upgrade a
 * Manzil-only row with Star Shard's fuller geocoded place/lat/lon/tz. */
export async function saveBirth(fields) {
  try { await call('/api/me/birth', { method: 'PUT', body: fields }); } catch (e) {}
}

// --- manzil pack (five/pack, per account) -----------------------------------
// The read-back path for a login on a fresh browser — Manzil's own
// signup already computes five/pack client-side, so this only matters
// afterward (a second device, or Manzil itself defensively on mount).

/** Resolves to { five, pack } or null. Never throws. */
export async function getManzilPack() {
  try {
    const j = await call('/api/me/manzil-pack');
    return j && typeof j.pack === 'object' ? j.pack : null;
  } catch (e) { return null; }
}

// --- manzil progress (per account) ------------------------------------------
// A player's actual save file — card levels, lives, which mansions are
// climbed and how far, match records, claimed nights — gathered by
// Manzil's own _syncProgress() into one opaque object. manzil-pack above
// only ever covers chart identity (five integers); before this pair
// existed, none of a player's real progress followed their account
// across devices.

/** Resolves to the saved progress object, or null. Never throws. */
export async function getManzilProgress() {
  try {
    const j = await call('/api/me/manzil-progress');
    return j && typeof j.progress === 'object' ? j.progress : null;
  } catch (e) { return null; }
}

/** Never throws — a failed progress sync must not interrupt play. */
export async function saveManzilProgress(progress) {
  try { await call('/api/me/manzil-progress', { method: 'PUT', body: { progress } }); } catch (e) {}
}

/** Never throws — logging out locally must always succeed. */
export async function logout() {
  try { await call('/api/auth/logout', { method: 'POST' }); } catch (e) {}
}

export async function forgotPassword(email) {
  return call('/api/auth/forgot-password', { method: 'POST', body: { email } });
}

export async function resetPassword(token, password) {
  return call('/api/auth/reset-password', { method: 'POST', body: { token, password } });
}

/** Confirms an email address from the token in the verification link's URL
 * fragment (`#verifyEmail=…`). Throws on a bad or expired token so the caller
 * can say so — silently swallowing it would leave the account unverified with
 * no explanation. Verification gates nothing: an unverified account plays
 * normally, this only makes password reset able to reach the person. */
export async function verifyEmail(token) {
  return call('/api/auth/verify-email', { method: 'POST', body: { token } });
}

/** Sends the confirmation mail again, for a signed-in account. Resolves either
 * way, including when the address is already verified (the server treats that
 * as a no-op) — there is nothing the caller would do differently. */
export async function resendVerification() {
  return call('/api/auth/resend-verification', { method: 'POST' });
}

/** Everything the account owns — the "keep a copy of my data" export.
 * Throws (unlike me()) — this is a confirmed user request for their own
 * data, so a failure needs to surface, not disappear as an empty page. */
export async function exportData() {
  return call('/api/me/export');
}

/** Irreversible. Throws (like addRecollection, unlike logout) — a
 * silent failure here would tell the user their account is gone when the
 * server never deleted it. Requires the current password; the caller is
 * responsible for collecting it. */
export async function deleteAccount(password) {
  return call('/api/me', { method: 'DELETE', body: { password } });
}

// --- saved window layout ---------------------------------------------------

/** Resolves to the saved layout object, or null. Never throws. */
export async function loadWindowState() {
  try {
    const j = await call('/api/state');
    return j && typeof j.state === 'object' ? j.state : null;
  } catch (e) { return null; }
}

/** Never throws — a failed layout save must not interrupt the user. */
export async function saveWindowState(state) {
  try { await call('/api/state', { method: 'PUT', body: { state } }); } catch (e) {}
}

// --- deck (collected mansions) ----------------------------------------------
// The logged-out fallback is localStorage, handled at the Component layer —
// this module only talks to the server half.

/** Resolves to the saved deck array, or null. Never throws. */
export async function loadDeck() {
  try {
    const j = await call('/api/deck');
    return Array.isArray(j?.deck) ? j.deck : null;
  } catch (e) { return null; }
}

/** Never throws — a failed deck save must not interrupt the user. */
export async function saveDeck(deck) {
  try { await call('/api/deck', { method: 'PUT', body: { deck } }); } catch (e) {}
}

// --- sigil (the reboot's derived natal object) ------------------------------
// Never sends birth data — only the derived sigil (station/step/type indices),
// same privacy posture as `deck`. The logged-out fallback is localStorage,
// handled at the Component layer, same split as deck's.

/** Resolves to the saved sigil object, or null. Never throws. */
export async function loadSigil() {
  try {
    const j = await call('/api/sigil');
    return j && typeof j.sigil === 'object' ? j.sigil : null;
  } catch (e) { return null; }
}

/** Never throws — a failed sigil sync must not interrupt the arrival
 * reading (DESIGN-BRIEF.md v2 law 4: no spinner on the reading). */
export async function saveSigil(sigil) {
  try { await call('/api/sigil', { method: 'PUT', body: { sigil } }); } catch (e) {}
}

// --- recollection (kindled station+step segments) ---------------------------
// Unlike deck's flat mansion-id array, each record carries castContext/
// kindledAt, so the merge on login unions by (station, step) key, not a
// bare-int Set — see loadAndMergeRecollection in Star Shard's script block.

/** Resolves to the recollection array, or [] on failure (list shape,
 * matches loadGuestbook — not loadDeck's null-on-failure). */
export async function loadRecollection() {
  try {
    const j = await call('/api/recollection');
    return Array.isArray(j?.recollection) ? j.recollection : [];
  } catch (e) { return []; }
}

/** Throws (unlike saveDeck) — kindling is a confirmed user-facing action
 * (the Sounding's "kindled." beat); a silent failure here would show the
 * user success locally while the server never recorded it, desyncing the
 * ring with no error surfaced anywhere. Callers still don't await this
 * before updating the UI — see the no-spinner note above — the throw is
 * for logging/retry, not to block the claim beat. */
export async function addRecollection(station, castContext) {
  return call('/api/recollection', { method: 'POST', body: { station, castContext } });
}

// --- guestbook ---------------------------------------------------------------
// Public, unauthenticated. Backed by starshard-api; no localStorage fallback.

/** Resolves to a list of entries, or [] on failure. Never throws. */
export async function loadGuestbook() {
  try {
    const j = await call('/api/guestbook');
    return Array.isArray(j?.entries) ? j.entries : [];
  } catch (e) { return []; }
}

export async function postGuestbook(name, msg, stamp) {
  return call('/api/guestbook', { method: 'POST', body: { name, msg, stamp } });
}

// --- error copy ------------------------------------------------------------
// Keyed by the server's error codes; safe to reword, but keep the keys.

const AUTH_COPY = {
  email_taken: 'that email already has a shard account ♡',
  username_taken: 'that name\'s taken, try another ♡',
  invalid_username: 'usernames are 3-20 letters, numbers or underscores ♡',
  invalid_birth_date: 'that birth date doesn\'t look right ♡',
  // Manzil shows its own bespoke §8 copy for this inline rather than routing
  // through signupError() — kept here anyway for whatever else calls
  // signupError() with this code (logging, a future non-Manzil surface).
  // No fixed age named here since 30 Aug 2026: the real minimum is now
  // per-region (starshard-api/lib/age-gate.js), so a flat "sixteen" would
  // be wrong for most callers.
  too_young: 'the moon keeps her houses for you. come back in a year or two.',
  too_many_requests: 'too many tries, please wait a bit and try again ♡',
  unreachable: 'the shard server is unreachable, try again ♡',
  invalid_or_expired_token: 'that reset link is invalid or expired, request a new one ♡',
};

export function signupError(code) {
  return AUTH_COPY[code] || 'could not create your account, try again ♡';
}

export function loginError(code) {
  return AUTH_COPY[code] || 'wrong email or password ♡';
}

export function forgotPasswordError(code) {
  return AUTH_COPY[code] || 'could not send that email, try again ♡';
}

export function resetPasswordError(code) {
  return AUTH_COPY[code] || 'could not reset your password, try again ♡';
}

export function deleteAccountError(code) {
  if (code === 'invalid_credentials') return 'that password isn\'t right ♡';
  return AUTH_COPY[code] || 'could not delete your account, try again ♡';
}

export function guestbookError(code) {
  return AUTH_COPY[code] || 'could not sign the guestbook, try again ♡';
}

export function recollectionError(code) {
  if (code === 'not_claimable') return 'that station isn\'t open for you right now ♡';
  return AUTH_COPY[code] || 'could not sync your kindling, it\'ll try again later ♡';
}
