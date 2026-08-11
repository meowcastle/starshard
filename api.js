// Star Shard — all network I/O. Nothing else in the app may call fetch().
//
// OWNER: Claude Code. Do not edit from Claude Design.
//
// PRIVACY: birth date, birth time and birth coordinates are never sent to the
// Star Shard backend. The chart is computed in the browser by astro.js. The
// only outbound call carrying user input is the Open-Meteo city lookup, which
// receives a place name and nothing else. Keep it that way.

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

/** Resolves to { email } when signed in, or null when not. Never throws. */
export async function me() {
  try { return await call('/api/me'); } catch (e) { return null; }
}

export async function signup(email, password) {
  return call('/api/auth/signup', { method: 'POST', body: { email, password } });
}

export async function login(email, password) {
  return call('/api/auth/login', { method: 'POST', body: { email, password } });
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

export function guestbookError(code) {
  return AUTH_COPY[code] || 'could not sign the guestbook, try again ♡';
}
