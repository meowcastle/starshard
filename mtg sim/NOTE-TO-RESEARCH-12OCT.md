# Note to Research (12 Oct 2026, late): where the engine sits

Status from Code, written to update the research session. `RESEARCH-ACCURACY-12OCT.md` was written from the morning's state (k = 0.00 on 584 games); most of its ranked list has since been done or tested. The details are in `forge-pilot/README.md` and the commits on branch `mtg-sim`.

## The numbers now

| Measure | Value |
| --- | --- |
| Real games in calibration (live) | 1,063 (Melee paper + MTGO Challenges, read from mtgo.com directly) |
| k, Forge's matchup edge that carries over to real results | 0.07 (−0.05 to 0.18) |
| Deck-strength correlation, Forge vs real | r = 0.52 |
| Draws in production | 0 of 5,763 games; median game 6 s, slowest pairing 59 s against a 180 s clock |

## What the morning's list became

| Doc item | Outcome |
| --- | --- |
| 1 Cards the AI can't play | Done twice over: script hints (AI:RemoveDeck), plus a dead-card finder that plays each deck and lists spells never cast. It found three the scripts don't flag: Countersculpt (extra "behold a Jace or pay {1}" cost), Jace's Machinations (no AI logic), Appa, Steadfast Guardian (flash creature never cast). Azorius Control was playing 8 dead cards. |
| 2 Draws and the clock | Measured, not a problem (0 draws, see above). |
| 5, 10 Control posture, tuned profiles | Tested: no gain in k or in self-play strength. |
| 6 Hybrid simulation | Tested: no gain (52% self-play, k +0.05 inside noise). |
| Forge full simulation | Tested tonight: 11 of 24 finished games vs stock, 15x slower (27 s a game), 16 of 40 games never finished (processes died). Not the path this doc expected. |
| 7 Sideboard plans vs real pilots | Done: 91% of planned copies are cards 15%+ of real pilots carry. |
| 8 MTGO data | Done. |
| 9 k on the page | Done; the page says "under Forge's AI" and "not a forecast", worded from k. |

## The finding that matters most

Forge's errors aren't random. Compared deck by deck on the same opponents, it **underrates decks built on instants** and **overrates proactive decks against them**:

| Deck | Forge | Real |
| --- | --- | --- |
| Azorius Control | 19–23% | 38–41% |
| Dimir Excruciator | 29–32% | 49–50% |
| Lifegain | 70% | 45% (95% vs Azorius Control, real 30%) |
| Boros Dragons | 72% | 47% (93% vs Dimir Excruciator, real 54%) |

Reading Forge's games shows why: the control deck casts 3–9 spells a game with 6–9 lands in play, leaves mana unused, and never casts some of its best cards.

## Our own pilot on Forge's engine (SCOPE-EXTERNAL-PILOT-12OCT.md)

- **Phase 0, done.** mtg-bench's GPL bridge, reviewed and patched. With Forge's AI deciding everything through it, results match `forge sim` within noise (5 pairings, p ≈ 0.6), at the same speed (1.66 vs 1.53 s a game).
- **Phase 1, done; no strength gain.** Mulligans and real between-game sideboarding (through Forge's own sideboard hook). Our colour-aware mulligan rule keeps 79% of 7s vs Forge's ~81%; self-play 50%. Forge's mulligans are less bad than the docs suggested.
- **Reactive pilot, a rule set for instant-heavy decks** (counter their spell, kill an attacker, keep counter mana up, spend leftover mana at their end step, cast dead cards). Azorius Control: 13% → 27% against the meta (real 41%), 82% in its own mirror vs stock. k over 51 pairings: 0.06 → 0.10 (−0.01 to 0.22), directional, not significant.
- **The mirror gate.** A rule set only goes to a deck if it beats stock Forge in that deck's mirror (55%+, range above 50%). Run on all 20 meta decks, only Azorius Control passed; the general rules were noise for most decks and hurt four (Boros Dwarves 37%, Lifegain 40%, Jeskai Control 40%, Dimir Midrange 41%). Hand-written rules don't generalise.
- **Shipped to production** (Mac worker live; NAS on its next rebuild; `SIM_PILOT=0` turns it off): the reactive pilot for Azorius Control, and for any deck holding a dead card, a narrow pilot that casts only those cards. Everything else plays through `forge sim` as before. Benchmarks carry a pilot tag so piloted and unpiloted results never mix.

## What we're working on now: our own search

Flat Monte Carlo in the bridge (`forge-pilot/bridge/src/forge/bridge/Search.java`). At a main-phase decision with a real choice (land drops stay Forge's), each candidate move is played out several times on copies of the game made with Forge's own GameCopier: Forge's AI plays both sides of the copy, the searcher's first move forced, libraries reshuffled and the opponent's hand re-dealt from their unseen cards, for 4 turns, then scored as my position minus the opponent's with Forge's GameStateEvaluator (a win or loss ±3000). Forge's own choice stands unless another move beats it by two standard errors.

First result (copies could still see the opponent's real hand): **59% of 79 mirror games vs stock** (Izzet Spellementals 82%, Dimir Midrange 58%, Jund Sacrifice 57%, Boros Dragons 45%). **Running now:** the honest version (random opponent hands), about 40 games a deck on the same four. Cost is the open problem: about 5 minutes a game, 30–60x stock, so research only for now.

## Questions worth researching

1. **Making play-out search affordable.** Which decisions are worth searching (combat? only when the evaluator's spread is wide?), how few play-outs give a stable choice, and whether a cheaper evaluator than full play-outs (Forge's GameStateEvaluator on the position after one turn) keeps most of the gain.
2. **Does strength translate to fidelity?** The reactive pilot made Azorius Control both stronger and closer to real. Is that general: should a stronger pilot on *both* sides of a matchup raise k, or can it overshoot (a pilot stronger than the RCQ-level field the real data comes from)?
3. **Which real-data population to calibrate against.** MTGO Challenges vs RCQ/store paper fields have different pilot strength; should the sim target one, or weight events by level?
4. **Combat ("who's the beatdown").** The Limited doc's role-assignment point is the obvious next decision for search or rules; any measured guidance on how often role-misassignment decides Standard games would help prioritise.
5. **Dead cards at scale.** The finder only checks the 20 meta decks against one opponent. A check over every Standard-legal card Forge ships (or every new set's cards) would show how big the problem is on release weeks, when it matters most.

Open on our side, cheap: a "functional deck" check in the coach (colour sources, two-drops, curve for the deck's posture) and sample sizes on card-stat rows, both from `RESEARCH-LIMITED-PLAYER-12OCT.md`.
