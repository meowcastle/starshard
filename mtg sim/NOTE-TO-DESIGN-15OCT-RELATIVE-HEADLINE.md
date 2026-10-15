# Note to Design: the relative headline is approved; the data is in (15 Oct 2026)

Justin approved research's point C on 15 Oct: **meta decks lead with their real win rate; a brew leads with "nearest meta deck's real rate, plus what the sim measured for your changes".** The reason, in one line for the page: the sim exaggerates how far apart decks are (it spreads the top 12 from 18% to 81% where real play spreads them 44% to 57%), but the *difference* between two decks Forge plays the same way is much more trustworthy.

Yours to draw. What the server now sends:

## A brew: `run.relative` (every finished run in `GET /api/brews`) and `summary.relative` (the deck guide)
```
{
  near: "Boros Dragons",                       // the nearest meta deck (same as summary.nearest.name)
  real: { p: 0.46, matches: 145, vs: "field decks" | "whole field" },
  difference: { p: 0.106, lo: 0.04, hi: 0.17, opponents: 11, games: 1600 },   // brew minus nearest deck, match scale
  p: 0.57, lo: 0.48, hi: 0.66,                 // THE HEADLINE: real + difference, with its 95% range
  raw: 0.71                                    // the old sim-only number, if you want it in small print
}
```
`null` when the nearest deck has under 20 real matches, or when fewer than three of the run's opponents have sim games against the nearest deck. Fall back to today's number with its current label in that case.

**Suggested copy** (house rules: layman, no jargon):
- Headline: **57%** match win rate (48–66%)
- Under it: "Boros Dragons wins 46% in real tournaments (145 matches). Your version plays 11 points better than it in the sim."
- A negative difference reads "…plays 4 points worse than it in the sim."
- When `difference.lo < 0 < difference.hi`: "…about the same as it in the sim."

## A meta deck
The Codex already carries `real(name)` per field deck (`{w, l, vs}`). Lead with that; show the sim's number second or not at all.

## Not changed
Per-matchup rows still show the calibrated sim rate per opponent. The coach's swap tests are already paired differences and can say so ("measured against the same opponents").
