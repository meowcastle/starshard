# A spells-matter profile (research, 14 Oct 2026)

Why: under the control rule sets Spellementals lost six points because the pilots spent its instants at the opponent's end step as answers, and the deck never reached Sunderflock (cast in 49% of games under stock Forge, 27–31% under the pilots; 67% won when cast). A reactive rule set is a control rule set. Decks whose spells are fuel need their own posture.

## Who gets it
`plan.js` plan "spells-matter" (prowess, Elemental cost reduction, storm-like counts, "whenever you cast a noncreature spell" payoffs): Izzet Spellementals, Izzet Prowess today; any deck where the tagger finds ≥ 8 instants/sorceries plus ≥ 4 cards that count or reward them. Role in most matchups: the beatdown (Flores: the deck with the faster clock and the worse late game), so the posture is tapout-aggressive with a narrow reactive clause.

## The rules, in priority order
1. **Spend toward the payoff on your own turn.** A cantrip or cheap spell is cast in main phase 1 when it (a) triggers or grows a payoff already on the battlefield (prowess, Hearth Elemental's cost, Sunderflock's count), (b) finds the land drop, or (c) makes a payoff in hand castable this turn (the Elemental cost reduction). Otherwise main phase 2, before the creature. The pattern Forge already has (cantrip → creature in the same main phase) is right and stays.
2. **Deploy the payoff the turn it becomes castable.** A cost-reduced Hearth Elemental or Sunderflock is never held for an answer: the payoff is the plan. Exception: the opponent has shown a sweeper and holds ≥ 4 open mana with cards in hand, and the board already has two threats — then one threat at a time (the Azorius rule, borrowed, but only then).
3. **Flash creatures at the opponent's end step, or as an ambush blocker,** never in their upkeep (the timing rule; Eddymurk Crab was 19% opponent-upkeep, 0% end step).
4. **Counters are for what threatens the plan, not for everything.** Hold a counter only when (a) the opponent's hand or deck plan has a card that beats the board (a sweeper, a planeswalker, their finisher from the curated list) and (b) holding it does not cost the turn's payoff cast. A one-mana counter (Spell Pierce, Spell Snare) can be held alongside a cast; a two-mana one usually cannot before turn five. When both are impossible, the payoff wins.
5. **Burn goes face when the race says so, else at the best creature.** Compute the race each turn (the evaluator's close call is a fine judge): if the opponent dies within two turns of attacks plus burn in hand, burn goes face at the end of their turn; else it kills the blocker that stops the most damage, in main phase 1 before attacks.
6. **Attack with everything into an empty board; into blockers, attack when the trade is even or better** (Code's batches say Forge already does this; keep as a floor).
7. **Mulligans:** keep seven with two lands and two cheap spells or one payoff; ship one-landers; on the draw, keep a two-land hand with three one-drops.

## Targets (A/B on the same seeds, field-test gate as before)
- Payoff cast rate back to stock or above: Sunderflock ≥ 49% of games, Hearth Elemental cast on average by turn 4.5.
- Instants at the opponent's end step per game ≤ stock's 0.65 (down from 0.9 under the pilots).
- Early (upkeep/draw) instants < 5% (the timing rule).
- Spellementals win rate ≥ stock (47) and moving toward real; Prowess the same; no other deck away from real beyond noise.
- Behaviour: own-turn spells per game up, not down; creatures cast per game ≥ 3.3.

## What this is not
Not a change to the control profiles; not a search change. It is a third posture beside `answers` (draw-go control) and `tapout` (tap-out control): call it `fuel`. The evaluator's place in it is rule 5's race call and rule 2's exception; both are "close calls", which is the evaluator's job after the search result.
