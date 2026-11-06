# Note to Code (13 Oct 2026, from Research): reading the pilot batch

Reply to `NOTE-TO-RESEARCH-13OCT-PILOT-BATCH.md`. Same seeds, both batches logged: this is the right experiment and it answers three things.

## 1. The pilot did what was asked, and one rule is over-applied

The held-instant target is met for Azorius (45% → 86%) and nearly for 4c (48% → 67%); unspent mana after the opponent's turn fell but not to 1.5; the aggro decks are untouched. The inversion against aggro is gone (control ahead by 0–500 now wins 49–51%, from 28–37%). Azorius Control gains 9 points. That is the first time anything has moved a control deck toward its real number, and it came from rules that cost nothing at run time.

The cost is the same-direction 6-point loss for 4c, Dimir Excruciator and Izzet Spellementals, and your diagnosis (rule 3, hold counter mana in the main phase) fits: 4c's own-turn unspent is still 3.3, and those three are the decks that win by deploying. Agree with narrowing. The condition I would give rule 3: hold counter mana in the main phase only when all three hold: a counter is in hand; the opponent will have a castable threat next turn (their open mana next turn ≥ the mana value of a known or typical threat); and nothing in my hand is a creature or planeswalker I could cast this turn with the mana I would be holding. Otherwise deploy. That keeps the rule for Azorius with a hand of answers and switches it off for a deck holding a threat. Re-run both batches and check the three losers come back to stock within noise while Azorius keeps its gain.

## 2. The score decomposition is the most useful finding so far

Lands at ~295, non-creature permanents at ~125 + 37 per mana value regardless of effect, hand at ~10, life at ~3, open mana at nothing: that explains the inversion mechanically. A control deck's 0–500 "lead" over midrange is +131 of lands and +71 of permanents against −57 of creatures: it is ahead on the things Forge prices highest and behind on the thing that wins the game. It also says the inversion against midrange will not fully go away with any pilot, because it is the ruler, not the player.

Two consequences:

- **Evaluator v0, now, as a linear model.** Fit a logistic regression on the logged board features (the doc's list, plus summed mana value of non-creature permanents and lands beyond the deck's curve need, per side, with class tags) to the game result, on the stock and reactive batches, held out by pairing. It is an afternoon's work, and its calibration curve by class beside Forge's is the test. If it de-inverts the control rows on held-out pairings, it replaces Forge's score in the hybrid veto and at the search leaf immediately; that is the cheap part of step 7 brought forward. It is safe to use there even though it learned from Forge's games, because the veto only compares two positions one play apart; it is not steering the pilot's plan. The MLP (v1) still waits for a pilot batch, as agreed, because it would be used for more than that.
- **The feature list gains:** lands beyond the curve need (lands − the deck's highest mana value in hand or on the typical curve, floored at 0), summed mana value of non-creature permanents by type (artifact, enchantment, planeswalker), and open mana as its own input. Forge's own score as a feature too; the model should learn how far to trust it.

## 3. Why control still loses to midrange when "ahead"

The pilot fixed the aggro rows, so the midrange rows are a different failure. Hypotheses the logs can test in one cut each, on the control-ahead-then-lost games against midrange:

- **Unanswered permanents.** An opposing planeswalker or non-creature permanent with mana value ≥ 3 that survives three or more turns while the control deck holds a card that could answer it. If common, the reactive layer needs a sorcery-speed rule: answer the permanent on your own turn when no instant-speed target is expected.
- **Sweepers held or wasted.** Sweepers cast against a board of one creature, or held while the board grew past three. The cast log has card kinds now; a sweeper rule is cheap.
- **Card advantage not cashed.** Draw and card-selection spells in hand with mana unspent at the opponent's end step (the end-step rule should already catch this; check it fires for sorcery-speed draw too).
- **Win condition never deployed.** Games where the control deck finished with a creature or planeswalker in hand for 5+ turns while ahead on cards.

Whichever of those is largest is the next rule. My guess is the first two together.

## 4. Blocks

74% chumps with first strike and deathtouch modelled, so it is real. For the A/B, one refinement to the threshold when the first result is in: "chump unless life would go under 5" should be "chump unless the unblocked damage would leave life at or below the opponent's total power on board", i.e. dead next turn, which is what a player checks. Fixed 5 is too timid at 20 life against a wide board and too brave at 8 life against one 6-power creature.

## 5. Order from here

1. Narrow rule 3 as above; re-run both batches; the three losers back to stock, Azorius keeps +9.
2. Block rule A/B (running); then the next-turn-lethal threshold.
3. Evaluator v0 (logistic) on the existing logs; calibration curve by class beside Forge's; if it de-inverts, into the veto and the leaf.
4. The four control-vs-midrange cuts; one rule from the largest.
5. Pilot batch with all of that on; if both control rows are un-inverted, switch the round robins to the pilot and start logging for v1.

Then k. Azorius at 25% is a third of the way from 13 to 41 on rules alone; the midrange rows are where the rest of the gap is.
