# Note to research: the overnight results (15 Oct 2026)

Follows `NOTE-TO-RESEARCH-14OCT-METHOD.md` and `-SPREAD.md`. Three runs, as queued.

## 1. Sequential test: Dimir Excruciator, B = Day of Black Sun — **H1, promoted**
26 rounds, about 1,370 games an arm, LLR 3.05 (bound 2.94). Real 51%; production plays it far below that, so "toward real" is up.

| | Arm A (production) | Arm B (+ Day of Black Sun) |
| --- | --- | --- |
| Game win rate | 29.7% | 33.6% |
| Mean paired move toward real | | +4.1 points (± 3.2, 95%) |

The gains are where a wipe should matter: Jund Sacrifice 22 → 38, Mono-Green Landfall 18 → 25, Boros Dragons 10 → 17, Lifegain 14 → 20, Jeskai Artifacts 31 → 39. Control matchups didn't move (4c 61 → 60, Azorius 63 → 63). Two moved down (Spellementals 37 → 32, Dimir Midrange 18 → 13), each about 120 games, inside per-opponent noise.

Day of Black Sun is now on `forge-pilot/dead-cards.json` (2.0.15). It is cast only through the X-wipe rule in `pilot.js` (cc3cf91). Live with the next copy, rebuild and worker update.

## 2. Sequential test: Mono-Green Landfall, B = Meltstrider's Resolve — **undecided, not promoted**
60 rounds (the limit), about 3,300 games an arm, LLR 0.82. B 50.3% against A 51.9% in games: casting the aura made the deck **slightly worse**, not better (unsigned move −1.6, about ±2).

Two reasons not to promote:
- Production already plays Landfall at its real rate (52% against 51% on the 160-game scoreboard). There is nothing to fix at deck level.
- The test's "toward real" sign is ill-defined when production sits on the real rate: round 1 put production a point above real, so the sign was set to "down" and the aura's small loss counted as a small gain. **A tool change follows:** when production is inside the real interval, the test should ask "does B leave the deck inside it" rather than "does B move toward real".

Reading: Forge's own AI never casts the aura, and when the pilot makes it cast it, it doesn't help. Forge may be right to hold it (it costs a creature's tempo), or the target choice is poor. Not worth more time while the deck is accurate.

## 3. Same seeds: how correlated the two arms are
Per-opponent, per-round game rates of arm A against arm B: **r = 0.49** (Excruciator) and **0.58** (Landfall). Variance of a paired difference falls by roughly that fraction against independent arms, so the same seeds cut the games needed by about half. Worth keeping.

## 4. The 160-game production baseline (147 games a pairing median, 60 of 66 pairings with real data)
| Measure | Value | Ship bar |
| --- | --- | --- |
| k, corrected (reliability 0.96) | 0.06 (−0.02 to 0.15) | ≥ 0.6 |
| Mean deck error | 16.5 points (floor 3.2) | ≤ 4 |
| Inside the real 95% range | 3 of 12 | 9 of 10 |
| Sim spread (sd of deck rates) | 21.3 points | real: indistinguishable from 0 |
| Rank correlation | 0.10 (−0.43 to 0.77) | not judgeable while real is flat |

With reliability at 0.96, the sim's own noise is gone from the picture: what's left is engine error. The errors are the spread, not a tilt:

| Too strong in the sim | Too weak in the sim |
| --- | --- |
| Boros Dragons +30.8, Lifegain +30.6, Boros Dwarves +18.5, Dimir Midrange +17.9 | Dimir Excruciator −32.4, Azorius Control −22.4, Jund Sacrifice −14.0, Izzet Prowess −13.6, 4c Control −8.5 |

Inside the real range: Mono-Green Landfall, Izzet Spellementals, Jeskai Artifacts.

The pattern is the one the spread finding predicts: **proactive creature decks win too much, reactive and synergy decks too little**. That is the shape a pilot-skill knob would fit (step 3 of your review): Forge plays its own aggressive lines adequately and its reactive and engine lines poorly, so real players' edge on those decks is missing. The baseline's logs (`lb-160/logs`) are the set for fitting it.

## Next on the Mac
- Fix the sequential test's sign for decks already inside the real interval.
- Then the knob: a reactive-play error rate fitted to the spread, judged by the spread and the mean error (the two measures judgeable today).
