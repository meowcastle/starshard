// Star Shard — the event calendar: real, dated sky events, sourced and
// scheduled years out, driving foil (rare-pull) conditions.
//
// OWNER: Claude Code.
//
// "No odds to disclose, because there are no odds. The sky is the drop
// table." Every rarity here is a real rarity: eclipses, supermoons, a blue
// moon, and the signature recurring beat — the moon visiting Al-Thurayyā
// (mansion index 2, the Pleiades) every ~27.3 days, already the site's own
// existing 28-mansion system, not a separate mechanic bolted on.
//
// Dates sourced in research/transits.md: NASA GSFC (eclipses), EarthSky/
// Espenak (full moons/supermoons), AMS (meteor showers) — cited there, not
// re-derived here. Window: Sep 2026 - Dec 2027, matching the research.
//
// Deliberately NOT built here: the "Perigee" 3-supermoon badge (needs
// per-event claim history, a different data model than the current
// mansion-index-only deck) and the Shard Runner meteor-shower easter egg
// (a separate mini-game trigger, not a foil condition). Both are real
// follow-ups, not silently dropped.

export const EVENTS = [
  { date: '2026-09-26', kind: 'fullmoon', name: 'Harvest Moon', foil: false },
  { date: '2026-10-04', kind: 'opposition', name: 'Saturn opposition', foil: false },
  { date: '2026-10-09', kind: 'meteor', name: 'Draconids', foil: false },
  { date: '2026-10-23', kind: 'meteor', name: 'Orionids', foil: false },
  { date: '2026-10-26', kind: 'fullmoon', name: "Hunter's Moon", foil: false },
  { date: '2026-11-05', kind: 'meteor', name: 'Taurids', foil: false },
  { date: '2026-11-14', kind: 'conjunction', name: 'Jupiter-Mars conjunction', foil: false },
  { date: '2026-11-18', kind: 'meteor', name: 'Leonids', foil: false },
  { date: '2026-11-24', kind: 'supermoon', name: 'Beaver Moon (supermoon)', foil: true },
  { date: '2026-11-25', kind: 'opposition', name: 'Uranus opposition', foil: false },
  { date: '2026-12-14', kind: 'meteor', name: 'Geminids (best of the year)', foil: true },
  { date: '2026-12-21', kind: 'solstice', name: 'December solstice', foil: false },
  { date: '2026-12-24', kind: 'supermoon', name: 'Cold Moon (supermoon, closest of 2026)', foil: true },
  { date: '2027-01-03', kind: 'meteor', name: 'Quadrantids', foil: false },
  { date: '2027-01-22', kind: 'supermoon', name: 'Wolf Moon (supermoon, arc finale)', foil: true },
  { date: '2027-02-06', kind: 'eclipse', name: 'Annular solar eclipse ("Ring of Fire")', foil: true },
  { date: '2027-02-10', kind: 'opposition', name: 'Jupiter opposition', foil: false },
  { date: '2027-02-19', kind: 'opposition', name: 'Mars opposition', foil: false },
  { date: '2027-02-20', kind: 'eclipse', name: 'Penumbral lunar eclipse + Snow Moon', foil: true },
  { date: '2027-03-22', kind: 'fullmoon', name: "Worm Moon", foil: false },
  { date: '2027-04-20', kind: 'fullmoon', name: 'Pink Moon', foil: false },
  { date: '2027-04-22', kind: 'meteor', name: 'Lyrids', foil: false },
  { date: '2027-05-06', kind: 'meteor', name: 'Eta Aquariids', foil: false },
  { date: '2027-05-20', kind: 'bluemoon', name: 'Flower Moon (seasonal blue moon)', foil: true },
  { date: '2027-06-19', kind: 'fullmoon', name: 'Strawberry Moon', foil: false },
  { date: '2027-07-01', kind: 'conjunction', name: 'Venus-Mercury conjunction', foil: false },
  { date: '2027-07-18', kind: 'fullmoon', name: 'Buck Moon (micromoon + imperceptible eclipse)', foil: false },
  { date: '2027-07-29', kind: 'meteor', name: 'Delta Aquariids', foil: false },
  { date: '2027-08-02', kind: 'eclipse', name: 'Total solar eclipse — "the Day the Sun Went Dark" (6m23s, near Luxor)', foil: true },
  { date: '2027-08-11', kind: 'conjunction', name: 'Venus-Mercury conjunction (closest)', foil: false },
  { date: '2027-08-12', kind: 'meteor', name: 'Perseids (moon-washed)', foil: false },
  { date: '2027-08-17', kind: 'fullmoon', name: 'Sturgeon Moon (micromoon + eclipse)', foil: false },
  { date: '2027-09-15', kind: 'fullmoon', name: 'Harvest Moon (first anniversary)', foil: false },
  { date: '2027-10-10', kind: 'conjunction', name: 'Venus-Mercury conjunction', foil: false },
  { date: '2027-10-15', kind: "fullmoon", name: "Hunter's Moon", foil: false },
  { date: '2027-10-21', kind: 'meteor', name: 'Orionids', foil: false },
  { date: '2027-11-14', kind: 'fullmoon', name: 'Beaver Moon', foil: false },
  { date: '2027-11-17', kind: 'meteor', name: 'Leonids', foil: false },
  { date: '2027-12-13', kind: 'fullmoon', name: 'Cold Moon', foil: false },
  { date: '2027-12-13', kind: 'meteor', name: 'Geminids (washed out)', foil: false },
];

// The signature recurring beat: Al-Thurayyā (mansion index 2, 0-indexed —
// the Pleiades in the Arabic system) shimmers every time the moon visits
// it, roughly every 27.3 days. This needs no date table: it's the site's
// own existing 28-mansion index, already computed by astro.js.
export const PLEIADES_MANSION_INDEX = 2;

/**
 * Whether claiming `mansionIdx` "today" (a Date, local calendar date used
 * for the lookup) should be a foil pull, and why. An eclipse/supermoon/etc.
 * makes EVERY claim that day a foil, regardless of mansion; the Pleiades
 * mansion is foil on its own, every time, independent of the calendar.
 */
export function foilInfo(date, mansionIdx) {
  if (mansionIdx === PLEIADES_MANSION_INDEX) {
    return { foil: true, reason: 'Al-Thurayyā — the moon visiting the Pleiades, a real recurring rarity' };
  }
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const hit = EVENTS.find(e => e.date === iso && e.foil);
  if (hit) return { foil: true, reason: hit.name };
  return { foil: false, reason: null };
}

/** Non-foil events too, for a "what's happening" list — e.g. meteor showers
 * and full moons that aren't rare pulls but are still worth surfacing. */
export function eventsOn(date) {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return EVENTS.filter(e => e.date === iso);
}
