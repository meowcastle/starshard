// Star Shard — rates.js: measured rarity constants for the shard's findings.
//
// OWNER: Claude Code.
//
// CHART-BUILDER.md §3.2: "Everything below was measured this session and
// must ship as a table, not recomputed at runtime." These are Monte Carlo
// / sampled results over the real ephemeris (SHARD-MODEL.md §2/§3b cites
// the sample sizes — 9,477 nativities for co-location, 29,220 moments for
// the sun/moon archetype grid), not derived from first principles here.
// Two of the geometric ones (co-location, the 8-of-28 straddle count) were
// independently re-verified before this module was written — see the
// commit that landed CHART-BUILDER.md/SHARD-MODEL.md for the numbers.
//
// The one rule that matters more than any single constant (§3.2's own
// emphasis): rates.js must REFUSE to emit a rarity for a uniform-by-
// construction fact. The 784-archetype grid is flat (99% of cells within
// ±10% of uniform); mansion, step, archetype and weekday are named, never
// counted. rateFor() throws rather than silently returning a number for
// one of these — a caller asking for "how rare is mansion 6" is asking a
// malformed question, not one this module declines to answer gracefully.

/** P(feature), bits = -log2(P). Both stored so callers never have to
 * recompute the transform, and so a print of "X bits" and "1 in Y" can
 * never drift apart from rounding at two different call sites. */
function rate(p) {
  return { p, bits: -Math.log2(p) };
}

// SHARD-MODEL.md §2 — YOUR CHART's rarity_bits table.
export const CHART_RATES = {
  sunInSign: rate(1 / 12),
  twoPointsSameSign: rate(0.082),
  twoPointsSameMansion: rate(0.034),
  aspectInsideOneDegree: rate(0.02),
};

// SHARD-MODEL.md §3.b / CHART-BUILDER.md §3.2 — YOUR SHARD's co-location.
// Independently re-verified (2M-sample Monte Carlo on the pure sign/mansion
// partition overlap, no ephemeris needed for this one — it's geometry):
// same-sign-different-mansion 5.22% (claimed 5.24%), same-mansion-
// different-sign 0.46% (claimed 0.44%). Both within Monte Carlo noise.
export const COLOCATION_RATES = {
  sameSignDifferentMansion: rate(0.0524),
  sameMansionDifferentSign: rate(0.0044), // the "uncanny direction" — the flagship finding
};

// research/mansions-patch-aug15.json's concordance pass: 4 of 28 mansions
// (10, 15, 21, 24) carry a DIVERGENT match flag — the traditions describe
// genuinely different things there, not just different emphasis. This is
// a curated subset, not a natural partition boundary, but the patch is
// explicit that it's still fair game for a rarity: "non-uniform across a
// chart because it depends which mansions a chart occupies." The rate is
// one point's chance of landing in any of the four (mansions are ~uniform
// width, so 4/28 stands without a Monte Carlo pass the way COLOCATION_RATES
// needed one).
export const DISSENT_RATES = {
  pointInDivergentMansion: rate(4 / 28),
};

// SHARD-MODEL.md §3.2 / CHART-BUILDER.md §3.2 — measured over 9,477 sampled
// nativities, 1975-2015, ten planets, 45 pairs each.
export const DISAGREEMENT_RATES = {
  mean: 3.36, // CHART-BUILDER.md's own restated figure (SHARD-MODEL.md says 3.48 from the earlier pass)
  zero: rate(0.050),
  three: rate(0.213),
  fivePlus: rate(0.251),
  ninePlus: rate(0.020),
};

// CHART-BUILDER.md §3.2 — "3+ points in one mansion" / "4+ points".
export const PILE_RATES = {
  threePlus: rate(0.205),
  fourPlus: rate(0.025),
};

// CHART-BUILDER.md §3.2 — nearest light to a mansion edge (the boundary/
// "door" finding). Note this is about the SINGLE nearest light in a chart,
// not any one light's own independent probability.
export const BOUNDARY_RATES = {
  withinOneDegree: rate(0.149),
  withinHalfDegree: rate(0.076),
  withinQuarterDegree: rate(0.038),
};

// SHARD-MODEL.md §4 / CHART-BUILDER.md §3.2 — the five Traveler types.
// Seedborn corrected to 3.52% (measured), superseding WRITING.md's 3.4%
// and SHARD-MODEL.md §3b's own "~3.57% uniform expectation" framing —
// §4 is explicit that 3.52% is the measured figure to ship.
// CHART-BUILDER.md's own table gives two real measured figures (seedborn,
// homebound) and one hedge ("other three ~25% each" — "approximately," not
// a shipped constant). Only the two measured ones ship here; the other
// three traveler types (outbound/emberwake/farbank or whatever they're
// named) get no rates.js entry rather than a fabricated precision.
export const TYPE_RATES = {
  seedborn: rate(0.0352),
  homebound: rate(0.213),
};

// A feature is uniform-by-construction — CHART-BUILDER.md §3.2's own
// enforced rule — if it's a direct index into one of the system's own
// fixed, equal (or near-equal-by-construction) partitions. Sun-mansion
// spread (6.9%) and moon-mansion spread (0.6%) are both real but small
// deviations from uniform (orbital eccentricity), not a rarity signal —
// the whole POINT of §3b's archetype-grid finding is that it's flat.
const UNIFORM_FACTS = new Set(['mansion', 'step', 'archetype', 'weekday']);

/**
 * Look up a named rate. Throws for any uniform-by-construction fact
 * (CHART-BUILDER.md §3.2's enforced rule) rather than returning a number —
 * a caller asking rateFor('mansion') is asking rates.js to lie by omission
 * about what the number would mean, which is worse than a thrown error.
 */
export function rateFor(table, key) {
  if (UNIFORM_FACTS.has(key)) {
    throw new Error(`rateFor('${key}'): uniform-by-construction fact — mansion/step/archetype/weekday are named, never counted (CHART-BUILDER.md §3.2)`);
  }
  const entry = table[key];
  if (!entry) throw new Error(`rateFor: unknown rate key '${key}'`);
  return entry;
}

export { rate };
