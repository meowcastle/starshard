# The engine: what "five times better" means and how to get there (research, 14 Oct 2026)

Justin's bar: the simulator has to be far better than anything out there before the app around it ships. This sets the bar in numbers, says where the engine is against it, and lays out the work in the order that moves the numbers.

## 1. The bar, as numbers
Nobody else publishes any of these. Grim.Cards' white paper says its results are "not predictions of how those decks would perform at a table"; Forge alone, which is what everyone runs, is a k of 0.06 against real play. So "five times better" is not a comparison, it is a standard we set and publish:

| Measure | What it means | Forge alone | Now (pilots on control) | Ship bar |
| --- | --- | --- | --- | --- |
| **k** (fidelity slope) | the share of the edge the sim finds in a matchup that shows up in real play | 0.06 | 0.07–0.09 (the profile-era refit is pending) | **≥ 0.40** |
| **MAE by archetype** | mean absolute error of each top-10 deck's win rate against the named field, sim vs real | ~11 pts (control rows 20–28) | ~8 (Azorius 44 vs 31) | **≤ 4 pts; no deck off by > 8** |
| **Inside the interval** | top-10 decks whose sim rate sits in the real 95% interval | 4 of 10 | 6 of 10 | **9 of 10** |
| **Coverage** | cards in the top 20 Forge never casts or activates though castable (dead cards) | unknown (Appa, Airbender Ascension found by hand) | measurable today, see §3.2 | **0 dead in the top 20; every limited card on the list with a rule** |
| **Pilot plausibility** | the six behaviour statistics against the human baseline (unspent mana, held-and-used, early instants, open-board attacks, lethal taken, keeps) | early instants 23–52% vs human 0%; held-and-used 44% vs profiles 83% | control fixed; others not | **every class within the human band on all six** |
| **Mulligans** | keep decisions vs a human model | land count only | same | **keep/ship agreement ≥ 85% with the hand-class model** |
| **Sideboarding** | boarded games with plans the coach wrote, judged by the gate | exists, plans unevaluated | same | **every top-10 pairing with a tested plan, post-board numbers reported** |

The real side is thin (10–18 matches a pairing), so k and MAE are judged at the archetype-against-field level (n ≈ 100–300) and by class pairing, with intervals, never one pairing at a time. The weekly refit is the scoreboard; it goes on a public "how good is this" page before anything ships, with the bars above and where we stand.

## 2. What is settled (so nobody reopens it)
Blocks are forced; attacks are a person's; search of every kind moves nothing; the learned judge is good (70%) but a judge is not what is missing; the population is not the explanation. Code's and research's notes from 13–14 Oct are the record. The gap left is **behaviour**: what a seat does on the opponent's turn, which card it chooses to deploy, whether it turns its win condition on, how it mulligans and boards.

## 3. The work, in order of expected movement per week
1. **Spells-matter profile through the gate, then on** (Spellementals 10.8% of the meta, Prowess). Built; 30 minutes of Mac time. Expected: two decks into the interval.
2. **The dead-card audit, automated** (`design/incoming/tools/log-dead-cards.js`, run tonight on the 151 Mac logs): per deck and card, turn-ends where it was castable vs times cast. First pass already shows Prowess's Secret Identity castable 233 times and cast 0, Dimir's Requiting Hex 0 of 51, Tishana's Tidebinder 5%, Eddymurk Crab 9% (a flash creature Forge won't deploy). Run it on batches 1, 2, 5 and the production round robins weekly; every dead card gets a rule in the dead-card list or a pilot rule; the count is the coverage number. Expected: the single biggest lever left, because a deck missing one of its best cards is a different deck. One day for the batch run and the first list; ongoing after.
3. **Win conditions** (the Azorius lead): activations of creature-lands and planeswalker ultimates, "held a castable win condition for 3+ turns" in losses. A rule set `closer`: deploy the finisher when the board is stable or the opponent is tapped low; animate the land to attack when it connects or trades up; planeswalker loyalty toward the ultimate when it is unanswered. Expected: Azorius and 4c toward real. Two days.
4. **Instant timing rule** A/B across every seat (spec'd): expected to fix the behaviour row (early instants to < 5%) and nudge control; a week of batches in the background.
5. **Mulligans**: the hand-class model (lands, curve, a play by turn two, by posture) replacing land-count; graded by the sim's own hand-class batches and against human keeps from Arena logs. Three days; expected movement in every aggro row's variance and the 63% keep-seven anomaly.
6. **Sideboarding evaluated**: every coach plan for the top-10 pairings run post-board and compared with pre-board; plans that lose get rewritten by the coach with the result in its context. Three days; expected: Bo3 numbers that mean something, which is what RCQ players need.
7. **The evaluator in the close calls**: the 70% judge inside rules 1, 3 and 5 for "cast now or hold", "which threat to answer", "keep or ship" when the rule is not sure. A week; expected: a point or two on every piloted deck, and the thing that keeps improving as logs accumulate.
8. **Human logs as the validation set**: every Arena log shared (Justin's first) is the human baseline the pilot statistics are judged against; at 500 human turns the targets stop being my estimates and become measured. No work beyond the sharing switch (built); time.
9. **The evaluator proper** (MLP on profile-era logs, card embeddings, the Hearthstone recipe) once the production round robins have ~20k games with the profiles on: the long-run replacement for Forge's score in every close call. Three Code-weeks, after 1–7.
10. **Not on the list:** search (closed), reinforcement learning (no engine time to burn and nothing to validate it against yet), Commander (a different problem).

## 4. What it costs and what it needs
Mac time is the limit: items 1–6 are each a few hours to a day of batches. Code can run two at once on the Mac while the NAS serves users. The weekly refit is the judge of every item; nothing promotes without the field-test gate. Justin's part is small and specific: keep sharing Arena logs (every session is baseline data), run the rebuilds, and say which deck he wants fixed first when two items tie.

## 5. The ship rule
The app builds on in parallel (it is cheap and it is Design's), but **nothing is announced, charged for, or opened beyond the founders' list until the scoreboard reads: k ≥ 0.40, MAE ≤ 4, 9 of 10 inside the interval, 0 dead cards in the top 20, every class within the human band.** That is the "five times better", in public, with the method beside it. It is also the one thing no competitor can copy quickly, because it took the logs, the real matches and the pilots to get there.
