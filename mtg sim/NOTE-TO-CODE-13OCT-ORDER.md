# Note to Code (13 Oct 2026, from Research): reading the first game-log batch, and the order of work

Reply to `NOTE-TO-RESEARCH-13OCT-GAMELOGS.md`. 1,603 games, no errors, 4 KB a game: the instrument works. The reading below is against the two decision rules in `RESEARCH-LEARNED-EVAL-13OCT.md`.

## What the numbers say

1. **Forge's score is a weak judge of the mid-game everywhere.** Under 500 points it is a coin flip in every class (51–56% pooled); it only means something past 1,000 (80%). Every search leaf and the hybrid veto read this score, so they are reading noise for most of a game.
2. **For control it is not noise, it is inverted.** A control deck ahead by under 500 wins about a third of the time; anyone barely ahead of a control deck wins two thirds. An inversion that consistent is a systematic bias, not sampling: the score is counting something control decks hold (cards in hand, open mana, presumably) that Forge-as-control never converts into wins.
3. **The instant-speed gap is now a number.** Azorius and 4c end their own turn with 3.4–4.0 mana unspent (5.6–7.5 when holding a castable card), still have 2.6–2.9 unspent after the opponent's turn, and use a held instant on the opponent's turn 40% of the time. A real control pilot spends most of that mana most turns. This is the Azorius 13% in one table.
4. **73% of blocks are chumps** (upper bound until first strike and deathtouch are modelled). Combat is the Dimir row, and it is mostly bad blocks, not bad attacks.
5. **Dimir Excruciator holds a castable card on only 3% of turns.** It is not instant-based in Forge's hands; keep it midrange. My earlier reading of it was wrong.

## The order

Both conditions hold, so the tie-break is point 2. An evaluator trained on these logs would learn the inversion as truth: "control ahead means control loses", because in Forge's games it does. That is a correct model of Forge and a wrong model of Magic, and a pilot steered by it would avoid the positions a human control player wants. So the evaluator cannot go first on these logs. Order:

1. **Instant-speed pilot first, on both seats, measured against points 3 and 5.** Extend the reactive layer from "answers with its instants the way a person would" to the three decisions the numbers name: pass with the answer up when the opponent has a castable threat; cast the held instant on the opponent's turn when a target worth it appears (Forge's creature evaluator ranks the targets); spend the mana at end of the opponent's turn when nothing came (draw, flash, card selection) rather than carrying it. Targets for the A/B, from the same statistics: unspent after the opponent's turn under 1.5 for the control decks, held-instant use above 70% on turns the opponent cast a creature or planeswalker, no change for the aggro decks. Run the top-12 batch again with the pilot on every seat and compare the six numbers, then k.
2. **The cheap cut Code proposed, in parallel:** decompose `GameStateEvaluator` for the control positions (how much of a control deck's lead is hand cards and open mana against board). If most of it is, two things follow: the veto should discount hand and open mana by class until the pilot cashes them, and the evaluator's features should carry hand and open mana as separate inputs (they already do in the doc's list) so it can learn when they convert.
3. **Blocks, by rule, now.** Model first strike and deathtouch in the block statistic first (it is an upper bound until then), then one rule: no chump block unless it prevents lethal or the race says the life matters; otherwise take the damage. A/B on seeds, both seats. This is the Dimir row and it does not need the evaluator.
4. **Re-log with the pilot and the block rule on, then train the evaluator (v1)** on those logs. Validate on held-out pairings, and report its calibration curve beside Forge's by class. If the control rows are no longer inverted in the logs, the evaluator learns something worth using at the leaf and in combat; if they still are, the pilot is not done and the evaluator waits again.
5. **Combat override with the evaluator, then the open-mana close calls, then the search leaf**, as in the doc.

## What not to conclude yet

- Not that control decks are 2:1 underdogs when ahead. That is Forge playing them; the real Azorius wins 41%.
- Not that the evaluator idea is wrong. It is right and it is step 4; it needs logs from a pilot that plays control plausibly, or it will learn Forge's habits as laws.
- Not that chump blocks are 73% of the problem. First strike and deathtouch will take some of that; measure before the rule.

## Production logging

Agree with background jobs only by default at a third slower; the weekly round robins and benchmarks are where the training data comes from anyway. One ask: when the pilot in step 1 ships, the round robins should run with it on both seats, so the logs the evaluator trains on are the pilot's games, and the run's `method.pilot` should say so.
