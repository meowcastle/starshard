// account.js: who is signed in, for the whole shell (SS8, 1 Nov 2026).
//
// One store, read by useMe() everywhere (the chip, the pages) and written by the account
// pages when a sign in, a sign up, a reset or a sign out changes it. Before SS8 the shell
// asked /api/me once at mount and nothing could change the answer without a reload.
// api.js stays the only module that calls fetch(); this file is the state around it and
// the shell's own words for the server's error codes.
import { useSyncExternalStore } from 'react';
import * as api from '../../api.js';

let me; // undefined: not asked yet; null: signed out; { email, username, emailVerified }
const listeners = new Set();

export function getMe() { return me; }

export function setMe(user) {
  me = user || null;
  for (const l of listeners) l();
}

export function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Whether the API should be asked at all. api.js points at https://api.<host>; on a
// local static server that host does not exist and the shell shows the signed-out chip
// without a network call, so a smoke run stays free of connection errors.
export function apiReachable() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return !(h === 'localhost' || h === '127.0.0.1' || h === '' || h.endsWith('.local'));
}

/** Ask the server who this is and keep the answer. Resolves to the user or null. */
export async function refreshMe() {
  if (!apiReachable()) { setMe(null); return null; }
  const u = await api.me();
  setMe(u || null);
  return u || null;
}

/** React: the signed-in user, null when signed out, undefined until the server answers.
 * The shell asks once at mount (main.jsx); every page reads the same answer. */
export function useMe() {
  return useSyncExternalStore(subscribe, getMe, () => undefined);
}

/** Sign out everywhere: the server's session, then the shell's. */
export async function signOut() {
  await api.logout();
  setMe(null);
}

/** The server's codes, in the shell's words. The game's own line for the age gate. */
const WORDS = {
  email_taken: 'that email already has an account. sign in instead?',
  username_taken: 'that name is taken. try another.',
  invalid_username: 'a name is 3 to 20 letters, numbers or underscores.',
  invalid_birth_date: "the sky can't read that date.",
  invalid_input: 'check the email, and that the password is eight characters or more.',
  too_young: 'the sky asks you to come back in a year or two.',
  too_many_requests: 'too many tries. wait a little and try again.',
  unreachable: 'the account server is out of reach. try again in a moment.',
  invalid_credentials: "that name and password don't match.",
  invalid_or_expired_token: 'that link has expired. ask for a new one.',
  not_authenticated: 'you are signed out. sign in again.',
};

export function words(code, fallback = 'that did not work. try again.') {
  return WORDS[code] || fallback;
}
