// birth.js: the one birth record the shell reads (SS6, 1 Nov 2026).
//
// The record is api.js's birth shape ({ birthDate, birthTime, birthTimeKnown, placeName, lat,
// lon, tz }), the same object PUT /api/me/birth takes and the game's one-time chart grab
// writes. It lives on the device (localStorage, one key) so a visitor with no account has a
// chart; when the visitor is signed in and the server holds a record, the server's answer
// wins and is copied down. Saving while signed in also sends the record up (api.saveBirth
// never throws, the game's own fire-and-forget contract); SS8's account page is where the
// visitor sees and removes it.
import { useEffect, useState } from 'react';
import * as api from '../../api.js';
import { apiReachable } from './account.js';

export const BIRTH_KEY = 'starshard-birth';

export function loadBirthLocal() {
  try {
    const j = JSON.parse(localStorage.getItem(BIRTH_KEY));
    return j && typeof j.birthDate === 'string' ? j : null;
  } catch (e) { return null; }
}

export function saveBirthLocal(birth) {
  try { localStorage.setItem(BIRTH_KEY, JSON.stringify(birth)); } catch (e) { /* private mode: the chart lives for the page */ }
}

export function clearBirthLocal() {
  try { localStorage.removeItem(BIRTH_KEY); } catch (e) { /* nothing to clear */ }
}

/** Save everywhere the record belongs: the device always, the account when there is one. */
export function saveBirth(birth, me) {
  saveBirthLocal(birth);
  if (me && typeof window !== 'undefined' && apiReachable()) api.saveBirth(birth);
}

/** React: [birth, setBirth]. The device's record at once; the account's when it answers. */
export function useBirth(me) {
  const [birth, setBirth] = useState(() => (typeof window === 'undefined' ? null : loadBirthLocal()));
  useEffect(() => {
    if (!me || !apiReachable()) return undefined;
    let live = true;
    api.getBirth().then(b => {
      if (!live || !b || typeof b.birthDate !== 'string') return;
      saveBirthLocal(b);
      setBirth(b);
    });
    return () => { live = false; };
  }, [me]);
  return [birth, setBirth];
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** "15 march 1985, 06:30, new york" or "15 march 1985, time not known, new york". */
export function birthWords(birth) {
  if (!birth || typeof birth.birthDate !== 'string') return '';
  const [y, m, d] = birth.birthDate.split('-').map(Number);
  const parts = [`${d} ${MONTHS[(m - 1 + 12) % 12]} ${y}`];
  parts.push(birth.birthTimeKnown !== false && birth.birthTime ? birth.birthTime : 'time not known');
  if (birth.placeName) parts.push(String(birth.placeName).toLowerCase());
  return parts.join(', ');
}
