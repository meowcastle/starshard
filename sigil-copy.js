// Star Shard — placeholder prose templates for the Sigil/Sounding composers
// (reading.js's arrivalReading()/soundingReading()). SIGIL-READING.md §4's
// real ~60-piece prose kit hasn't been written yet; this is a small,
// on-voice placeholder set so the template engine can be built and tested
// now. Templates are keyed by id exactly as CLAUDE.md's build order asks,
// so swapping placeholder text for the real pass is mechanical: replace an
// array's contents, not the composer in reading.js.
//
// Tier-0 vocabulary only throughout (SIGIL-READING.md §3 rule 3, COSMOLOGY
// §2's lexicon ledger) — no Recollection, no Silverway, no the Great
// Sowing on this pre-arrival, pre-Tier-1 surface.
//
// OWNER: Claude Code (content-authored placeholder; the real prose pass is
// a separate, later writing project — CLAUDE.md build order step 6).

export const RING_OPEN_LINES = [
  'the sky kept a record. here.',
];

export const STRANGE_LINES = [
  'this mark is older than your name.',
  'you did not choose this. the sky just noticed you first.',
  'nobody taught the sky your name, and it wrote this down anyway.',
];

export const STEP_NAMES = ['entering', 'dwelling', 'turning', 'leaving'];

// -- the strike (beat 2: Sun station + step) ---------------------------------
export const STRIKE_HEADLINES = [
  (epithet, stepName) => `you landed in **${epithet}**, in its ${stepName}.`,
  (epithet, stepName) => `your strike fell in **${epithet}**, ${stepName}.`,
];

// -- the root (beat 3: Moon station + step, must reference the strike) ------
export const ROOT_AGREE_LINES = [
  epithet => `your root reaches the same sky twice: **${epithet}** answers your strike from right where it stands.`,
  epithet => `your root and your strike share a sky. **${epithet}** is close to home.`,
];
export const ROOT_CONFLICT_LINES = [
  epithet => `where the strike is loud, your root is a quieter current: **${epithet}**, a whole sky away.`,
  epithet => `your root crosses into new sky. **${epithet}** is a different weather than your strike.`,
];
export const ROOT_NO_STEP_LINES = [
  epithet => `your root reaches into **${epithet}**, where in its waters, only the hour would tell.`,
];
export const ROOT_CROSSING_DAY_LINES = [
  epithet => `you arrived on a crossing day. your root stands at the door of **${epithet}**, just arriving itself.`,
];

// -- the glow (beat 4: natal Light, 8 phases, in MOON_PHASES index order) ---
export const LIGHT_GLOSSES = [
  'a new light, barely begun: you start things nobody else can see yet.',
  'a light still gathering: you build in the dark before anyone notices.',
  'a light at the half: you already know what you are choosing.',
  'a light still filling: you finish what other people start.',
  'a full light: you arrived seen, whether you wanted to be or not.',
  'a light beginning to let go: you know when a thing is complete.',
  'a light at the half, waning: you keep only what is worth keeping.',
  'a light nearly spent: you arrived already good at endings.',
];

// -- the hand (beat 5: Keeper, the birth-day luminary, 7, index order
// matches sky.js's PLANETARY_HOUR_ORDER: Saturn, Jupiter, Mars, Sun, Venus,
// Mercury, Moon) -------------------------------------------------------------
export const KEEPER_GLOSSES = [
  'saturn carried you down: patient as stone, built to last.',
  'jupiter carried you down: luck that grows with distance traveled.',
  'mars carried you down: the grace of a sword dance.',
  'the sun itself carried you down: the friendliest light there is.',
  'venus carried you down: the hand that plants flowers and means it.',
  'mercury carried you down: the messenger\'s own hand, full of words.',
  'the moon carried you down: tide-hearted, dream-true.',
];

// -- the facing (beat 6: rising station, skipped without birth time) --------
export const FACING_LINES = [
  epithet => `you face **${epithet}**, the direction you walk the road in.`,
];

// -- the answering star (beat 7: Farlight) -----------------------------------
export const ANSWERING_LINES = [
  epithet => `across the wheel, **${epithet}** answers you: the full moon of every birthday you will ever have rises there.`,
];

// -- the gait (beat 8: the five Traveler types) ------------------------------
// gait + permission lines drafted directly in COSMOLOGY §3.4 — reused
// verbatim here, not reinvented.
export const GAIT_LINES = {
  seedborn: { gait: 'the seed that landed whole', permission: 'you don\'t need the far bank, you *are* the crossing' },
  homebound: { gait: 'walks the near road', permission: 'depth over distance was always the assignment' },
  outbound: { gait: 'walks ahead of their own sun', permission: 'you\'re not restless, you read the road ahead' },
  emberwake: { gait: 'carries the fire behind the light', permission: 'you\'re not stuck in the past, you\'re the one keeping it lit' },
  farbank: { gait: 'born on both banks of the river', permission: 'your far side isn\'t missing, it\'s waiting at the bridge' },
};

// -- the handle (beat 9: headline / share moment) ----------------------------
export const HANDLE_LINES = [
  (name, typeLabel, epithet) => `${name}'s star shard: ${typeLabel} of ${epithet}.`,
  (name, typeLabel, epithet) => `${typeLabel} of ${epithet}, that's ${name}'s mark.`,
];

// -- the Sounding's cast-kind flavor (beat 2 of the nightly loop) -----------
export const CAST_FLAVOR = {
  steady: 'a steady night: one card, read in place.',
  turning: 'the lantern is in the last quarter of this step. tonight reads as a pair.',
  threshold: 'the lantern stands right at a threshold, minutes wide. tonight is rare.',
};

// -- the Sounding's relational line (beat 3, "for you tonight") -------------
export const RELATIONAL_LINES = [
  (currentName, lightName) => `a ${currentName.toLowerCase()} current, in a ${lightName} sky. read for you, not for everyone.`,
  (currentName, lightName) => `tonight carries a ${currentName.toLowerCase()} feeling, under a ${lightName} moon. yours, specifically.`,
];

// -- the Sounding's question (beat 4) -----------------------------------
// Placeholder until the real 112-question pass (one per shard, COSMOLOGY
// §7 build order step 6) — a small rotating set for now, tier-0, asked and
// never answered.
export const SOUNDING_QUESTIONS = [
  'what have you been carrying that could set down tonight?',
  'what have you been circling that could finally begin?',
  'what small thing is asking for your attention tonight?',
  'what would you do tonight if nobody were watching?',
];

// -- the Sounding's claim confirmation (beat 5) ------------------------------
export const CLAIM_CLOSE_LINE = 'that\'s tonight\'s road. walk it well.';
