// Star Shard — all network I/O. Nothing else in the app may call fetch().
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// PRIVACY (revised 24 Aug 2026 — Justin's call): the chart is still always
// computed in the browser by astro.js, and a visitor who never creates an
// account still sends nothing birth-related anywhere — that part of the old
// "never sent" claim is unchanged. But Manzil now requires a real account to
// play at all, and creating ANY account (from Manzil or Star Shard) sends
// birth date/time/place to the backend and stores it there (see signup()'s
// extra fields and getBirth()/saveBirth() below) — cross-app continuity and
// Manzil's gate both depend on it. Don't restate the old "never sent, ever"
// claim without checking this comment first.

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

/** extra carries the account-required fields Manzil's gate needs:
 * { username, birthDate, birthTime, birthTimeKnown, placeName, lat, lon, tz }.
 * Only username + birthDate are required server-side; the rest are optional
 * (Manzil's own birth screen has no geocoding — see getBirth/saveBirth). */
export async function signup(email, password, extra = {}) {
  return call('/api/auth/signup', { method: 'POST', body: { email, password, ...extra } });
}

export async function login(email, password) {
  return call('/api/auth/login', { method: 'POST', body: { email, password } });
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
