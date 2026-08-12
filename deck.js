// Star Shard — the collection game: claim windows, grace, "returns in N days".
//
// OWNER: Claude Code.
//
// The mansion collection is gated by the sky itself, never by streaks or a
// paywall: a mansion's card can only be claimed while the moon is actually
// transiting it (~1 day), plus a grace period after it moves on to the next
// one. Miss it, it returns on schedule ~27.3 days later — framing is always
// "the mansion returns", never "you missed it" (STRATEGY.md §5). This is
// separate from — and does not gate — collecting your OWN natal mansion on
// first computing a chart, which stays an unconditional one-time reveal
// ("which one am I?"), not part of the daily moon-transit game.
//
// Deliberately NOT built here: a streak/"chain" system. STRATEGY.md's
// "auto-grant cloudy nights if chains exist" guardrail is conditional on a
// chain mechanic that doesn't exist anywhere in this app yet — inventing
// one to satisfy a conditional guardrail would be scope creep, not honesty.
// If a streak system ships later, its grace-token behavior belongs here.

import { moonLongitude } from './astro.js';

const MANSION_COUNT = 28;
const MANSION_SIZE = 360 / MANSION_COUNT;
const GRACE_DAYS = 2; // ~48h grace after the moon moves on, per STRATEGY.md §5
const norm = d => ((d % 360) + 360) % 360;

/** The moon's actual angular rate right now (deg/day) — a real finite
 * difference on astro.js's own verified moonLongitude, not a fixed mean:
 * the true rate varies ~11.8-14.4 deg/day across the elliptical orbit. */
function moonRate(jd) {
  const before = moonLongitude(jd - 0.5), after = moonLongitude(jd + 0.5);
  return norm(after - before);
}

/**
 * Claim state for all 28 mansions "as of now". `moonLon`/`jd` are the
 * current instant's raw values (already computed once at mount — see the
 * `today` state in Star Shard v2.dc.html); `todayMansion` is astro.js's
 * mansionOf(moonLon) for that same instant.
 *
 * Returns a 28-entry array: `{ mansion, claimable, returnsInDays }`.
 * `returnsInDays` is 0 exactly when `claimable` is true.
 */
export function claimStates({ moonLon, jd, todayMansion }) {
  const rate = moonRate(jd);
  const degIntoToday = norm(moonLon - todayMansion * MANSION_SIZE);
  const daysSinceTodayEntry = degIntoToday / rate;
  const prevMansion = (todayMansion + MANSION_COUNT - 1) % MANSION_COUNT;

  const states = [];
  for (let i = 0; i < MANSION_COUNT; i++) {
    if (i === todayMansion) {
      states.push({ mansion: i, claimable: true, returnsInDays: 0 });
      continue;
    }
    if (i === prevMansion && daysSinceTodayEntry <= GRACE_DAYS) {
      states.push({ mansion: i, claimable: true, returnsInDays: 0 });
      continue;
    }
    const degForward = norm(i * MANSION_SIZE - moonLon);
    const returnsInDays = Math.max(1, Math.round(degForward / rate));
    states.push({ mansion: i, claimable: false, returnsInDays });
  }
  return states;
}
