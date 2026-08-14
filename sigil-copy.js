// Star Shard — placeholder prose templates for the nightly Sounding
// (reading.js's soundingReading()). PORT-SPEC.md's real corpus port
// (research/corpus-spine.md + corpus-stations-*.md, parsed into
// reading-copy.js) covers the ARRIVAL reading only — the Sounding's
// per-night counsel/question/claim content is a separate, still-unwritten
// pass (SIGIL-READING.md §4's "the ~60-piece prose kit," and beyond it the
// future 112-question set). This file stays for that reason: arrivalReading()
// was re-pointed at reading-copy.js's real corpus and no longer imports
// from here, but soundingReading() still does.
//
// Tier-0 vocabulary only throughout (SIGIL-READING.md §3 rule 3, COSMOLOGY
// §2's lexicon ledger) — no Recollection, no Silverway, no the Great
// Sowing on this pre-arrival, pre-Tier-1 surface.
//
// OWNER: Claude Code (content-authored placeholder; the real prose pass is
// a separate, later writing project).

// -- the Sounding's cast-kind flavor (beat 2 of the nightly loop) -----------
export const CAST_FLAVOR = {
  steady: 'a steady night: one card, read in place.',
  turning: 'the moon is in the last quarter of this station. tonight reads as a pair.',
  threshold: 'the moon stands right at a threshold, minutes wide. tonight is rare.',
};

// -- the Sounding's relational line (beat 3, "for you tonight") -------------
export const RELATIONAL_LINES = [
  (currentName, lightName) => `a ${currentName.toLowerCase()} current, in a ${lightName} sky. read for you, not for everyone.`,
  (currentName, lightName) => `tonight carries a ${currentName.toLowerCase()} feeling, under a ${lightName} moon. yours, specifically.`,
];

// -- the Sounding's question (beat 4) -----------------------------------
// Placeholder until the real 112-question pass (one per shard) — a small
// rotating set for now, tier-0, asked and never answered.
export const SOUNDING_QUESTIONS = [
  'what have you been carrying that could set down tonight?',
  'what have you been circling that could finally begin?',
  'what small thing is asking for your attention tonight?',
  'what would you do tonight if nobody were watching?',
];

// -- the Sounding's claim confirmation (beat 5) ------------------------------
export const CLAIM_CLOSE_LINE = 'that\'s tonight\'s road. walk it well.';
