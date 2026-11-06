// leave-email.jsx: one field after the first night (MZ3, 2 Nov 2026).
//
// A visitor with no account has just read their shard, the first night the shell gives
// anyone. This is the one thing they can leave behind: an email, nothing else. The server
// (POST /api/email) keeps the address with a hash of a random id this device made for
// itself, so the same device can take it back (DELETE /api/email) without ever making an
// account; at signup the row becomes the account's, cascades with it and shows in its
// export. The age gate runs on the server as it does at signup, from the birth date the
// chart was cast from; nothing from the date is stored. Here the field is not drawn at all
// when the device's record says the visitor is under thirteen, so a child never sees a
// place to leave an address. The field is also not drawn when there is no API to answer
// (a local static server), the way the account chip stays signed out there.
//
// api.js at the repo root is the one module that calls fetch(); this run could not write
// it, so the two calls live here against its API_BASE until they move in (queued).
import { useState } from 'react';
import { API_BASE } from '../../api.js';
import { apiReachable, words } from './account.js';
import { localTz } from './tonight.js';

const DEVICE_KEY = 'starshard-device';
const LEFT_KEY = 'starshard-email-left';
const MIN_AGE = 13;

/** The device's own random id, made once, 32 hex characters. The server stores its hash. */
export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (id && /^[a-f0-9]{32}$/.test(id)) return id;
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch (e) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
}

export function emailLeft() {
  try { return localStorage.getItem(LEFT_KEY) || ''; } catch (e) { return ''; }
}

function remember(email) {
  try { if (email) localStorage.setItem(LEFT_KEY, email); else localStorage.removeItem(LEFT_KEY); } catch (e) { /* a convenience */ }
}

/** Age from a YYYY-MM-DD date, in whole years, today. null when unreadable. */
export function ageOf(birthDate, now = new Date()) {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age;
}

async function call(method, body) {
  let r;
  try {
    r = await fetch(`${API_BASE}/api/email`, {
      method, credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) { throw Object.assign(new Error('unreachable'), { code: 'unreachable' }); }
  if (r.status === 204) return null;
  let j = null;
  try { j = await r.json(); } catch (e) { /* no body */ }
  if (!r.ok) throw Object.assign(new Error(j?.error || 'server_error'), { code: j?.error || 'server_error' });
  return j;
}

/** POST /api/email: leave the address. Resolves to the address the server kept. */
export async function leaveEmail(email, birthDate, source = 'shard') {
  const j = await call('POST', { email, device: deviceId(), birthDate, tz: localTz(), source });
  remember(j.email);
  return j.email;
}

/** DELETE /api/email: this device takes its address back. */
export async function takeEmailBack() {
  await call('DELETE', { device: deviceId() });
  remember('');
}

const LEAVE_WORDS = { invalid_input: 'check the email.', invalid_birth_date: "the sky can't read the birth date the chart was cast from." };

export function LeaveEmail({ me, birth, source = 'shard' }) {
  const [email, setEmail] = useState('');
  const [left, setLeft] = useState(() => (typeof window === 'undefined' ? '' : emailLeft()));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (me || !birth || typeof window === 'undefined' || !apiReachable()) return null;
  const age = ageOf(birth.birthDate);
  if (age === null || age < MIN_AGE) return null;

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setErr(LEAVE_WORDS.invalid_input); return; }
    setBusy(true); setErr('');
    try {
      const kept = await leaveEmail(em, birth.birthDate, source);
      setLeft(kept); setEmail('');
    } catch (x) { setErr(LEAVE_WORDS[x.code] || words(x.code)); }
    setBusy(false);
  }

  async function back() {
    if (busy) return;
    setBusy(true); setErr('');
    try { await takeEmailBack(); setLeft(''); } catch (x) { setErr(words(x.code)); }
    setBusy(false);
  }

  if (left) {
    return (
      <div className="leave-email" data-left={left}>
        <p className="note">left: {left}. one line about the night's sky, when the nightly mail begins. <button type="button" className="link-b" onClick={back} disabled={busy}>take it back</button></p>
      </div>
    );
  }
  return (
    <div className="leave-email">
      <p className="note">leave an email and one line about the night's sky comes when the nightly mail begins. nothing else arrives, and it stops the moment you ask.</p>
      <form className="leave-email-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="leave-email">your email</label>
          <input id="leave-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} />
        </div>
        <button type="submit" className="button ghost" disabled={busy}>{busy ? '…' : 'leave it ›'}</button>
      </form>
      {err ? <p className="note leave-email-err" role="alert">{err}</p> : null}
    </div>
  );
}
