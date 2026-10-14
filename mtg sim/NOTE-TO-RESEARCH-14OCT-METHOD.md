# Note to research: the method review, built and checked (14 Oct 2026)

Replies to your method review ("Are we solving the right problem?"). Justin approved steps 1 and 2 (the ruler and the sequential test), and the new ship bar.

## 1. The ruler: `tools/scoreboard.js` (`calib.scoreboard`)
`node tools/scoreboard.js <calibration.json> <batch dir> [...]` prints:
- k with the game count beside it;
- k corrected for the sim's sampling noise (errors-in-variables reliability);
- per deck: the real match rate with a 95% interval, the sim rate on the same pairings weighted by real matches, the error, and whether the sim rate falls inside the real interval;
- the mean error, beside the error a perfect engine would still show from the real side's own noise.

**Two corrections to the review's arithmetic.**
1. **Scale.** The real records are best-of-three matches; the sim's are games. A game edge becomes a match edge about 1.5 times as large near even, so on the raw k a perfect engine scores about 1.5, not 1. The scoreboard turns the sim's game rate into a best-of-three rate before fitting. On that scale the raw k is 0.07.
2. **The noise doesn't explain the gap.** Pooling batches 2, 5 and the spells batch gives a median of 44 sim games a pairing, with reliability 0.86. The corrected k is 0.08 (0.01–0.16). Your ceiling table is right about what a perfect engine would show, but we are nowhere near that ceiling, so the gap is real.

The per-deck table on the spells batch (production as of today, 15 games a pairing) shows where the gap is:

| | Real | Sim |
| --- | --- | --- |
| Range of the 12 decks' match rates | 44–57% | 22–84% |
| Mean error | | 14.9 pts (a perfect engine's floor here is 3.2) |
| Decks inside the real interval | | 3 of 12 |

**Forge spreads the decks far wider than real play.** That supports your point C directly: real rates first for meta decks, and the sim's paired difference for brews. The product change in point C is Justin's and Design's call; it isn't built.

## 2. The new ship bar (approved)
Corrected k ≥ 0.6, mean archetype error ≤ 4 points, 9 of 10 inside the real interval, all measured at ≥ 160 games a pairing, with the game count printed beside every number. The coverage and behaviour rows of the roadmap's §1 table are unchanged.

One caution: the mean-error bar of 4 points sits close to its own floor. With today's real volume, a perfect engine shows about 3.2 points of mean error from the real side's sampling alone. As real data grows, the floor falls; until then, read the bar against the floor the scoreboard prints.

## 3. The sequential test: `tools/sprt.js`
GSPRT on paired per-opponent differences, H0: no move, H1: a move of `--delta` (3 points by default), α = β = 0.05.
- **Arm A** is production: `policies.json`, plus the deadcards policy for any deck holding a listed card.
- **Arm B** adds `--b-dead` and/or `--b-policy`.
- **Same seeds** in both arms each round.

**The difference from Fishtest:** "better" is signed **toward the deck's real rate**, not "wins more". A change that makes an over-performing deck stronger counts against it.

**Untested:** whether the same seeds actually help in Forge. A game drifts apart soon after the first changed decision. The per-round differences the test stores will show how correlated the two arms really are; I'll report that.

**The mirror gate doesn't fit a situational card.** Day of Black Sun in the Dimir Excruciator mirror: 53% of 68, with the pilot acting 4 times. A wipe rarely has targets in a mirror, so the 55% bar can't judge it. The sequential test replaces the mirror for changes like this; the mirror stays for whole-deck profiles.

## 4. Day of Black Sun and Meltstrider's Resolve: the fixed batch (first look, underpowered)
66 pairings with `EXTRA_DEAD`, compared with the spells batch:

| Card | Before | After |
| --- | --- | --- |
| Day of Black Sun | 0 casts of 2,380 chances | 12% of 502 chances; when it's cast, it usually clears 2–6 of their creatures and loses 0–1 of ours |
| Meltstrider's Resolve | 0 of 714 | 101 casts in a 300-game sample |

| Deck | Before | After | Real |
| --- | --- | --- | --- |
| Dimir Excruciator | 31% | 34% | 51% |
| Mono-Green Landfall | 46% | 50% | 51% |

Both decks moved toward real; nothing moved beyond the noise of about ±11. The sequential tests are queued tonight, one for each deck.

## Tonight on the Mac, in order
1. `tools/sprt.js`, Dimir Excruciator, B = Day of Black Sun.
2. `tools/sprt.js`, Mono-Green Landfall, B = Meltstrider's Resolve.
3. The production baseline at 60 best-of-threes a pairing (about 160 games), all 66 pairings, logged, then the scoreboard. That's the first ship-bar reading at the new standard, and a log set for the knob fitting.

## Not started
- Knobs and the optimiser (step 3 of the review).
- Narrow simulators (step 5).
- The relative headline (step 4), which is Justin's and Design's call.
