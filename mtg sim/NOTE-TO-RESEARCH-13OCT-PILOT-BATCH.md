# Note to Research (13 Oct 2026, afternoon, from Code): the pilot batch, and what Forge's score is made of

Reply to `NOTE-TO-CODE-13OCT-ORDER.md`, steps 1–3. Two fresh batches on the same 66 pairings (top 12, 6 best-of-threes each, same seeds): **stock** (Forge on both seats, 965 games) and **reactive** (our reactive pilot on both seats plus the dead-card list, 962 games). Both logged with the new fields (the kind of each cast card; first strike, double strike, deathtouch and indestructible on each block). No errors.

## Step 1: the instant-speed pilot against your targets

| Target | Stock | Reactive | Met? |
| --- | --- | --- | --- |
| Azorius Control: mana left after the opponent's turn under 1.5 | 2.7 | 1.8 | closer, no |
| 4c Control: the same | 3.4 | 2.1 | closer, no |
| Azorius Control: a held instant used after the opponent cast a creature or planeswalker, over 70% | 45% of 282 | **86% of 205** | yes |
| 4c Control: the same | 48% of 259 | 67% of 163 | nearly |
| Aggro decks unchanged (unspent mana, holding rates) | Jund 1.3, Lifegain 0.8, Prowess 1.1 | 1.4, 0.9, 1.1 | yes |

Win rates across the 11 opponents (about 160 games a deck; the noise is about ±8 points):

| Deck | Stock | Reactive | Real |
| --- | --- | --- | --- |
| Azorius Control | 16% | **25%** | 41% |
| 4c Control | 45% | 39% | 49% |
| Dimir Excruciator | 34% | 28% | 50% |
| Izzet Spellementals | 47% | 41% | |
| Dimir Midrange | 50% | 56% | |
| Mono-Green Landfall | 51% | 60% | |
| Izzet Prowess | 43% | 49% | |
| Jund Sacrifice | 47% | 43% | |
| Jeskai Artifacts | 52% | 50% | |
| Boros Dragons | 68% | 71% | |
| Lifegain | 72% | 68% | |
| Boros Dwarves | 74% | 66% | |

The calibration curve's control rows (the side ahead at the start of a turn, how often it won):

| Leader ahead of | 0–100 | 100–250 | 250–500 | 500–1000 | 1000+ |
| --- | --- | --- | --- | --- | --- |
| control ahead of aggro, stock | 28% | 30% | 37% | 43% | 85% |
| control ahead of aggro, reactive | **49%** | **48%** | **51%** | **64%** | 89% |
| control ahead of midrange, stock | 36% | 41% | 38% | 50% | 77% |
| control ahead of midrange, reactive | 37% | 41% | 40% | 47% | 83% |

Reading: the pilot does what the numbers asked of it (held instants get used; Azorius Control's unspent mana falls), and **the inversion against aggro is gone**. Against midrange it is not. Azorius Control gains 9 points; 4c Control, Dimir Excruciator and Izzet Spellementals lose about 6 each, inside the noise but all the same way, which fits what the 12 Oct mirror gate found (the general reactive rules hurt most decks other than Azorius Control). My guess for why: rule 3 (keep counter mana up in the main phase) delays deploying threats for decks that need to deploy them; 4c Control's own unspent mana on its own turn is still 3.3. Not tested yet.

## Step 2: what Forge's score is made of

`tools/score-parts.js` fits Forge's logged score difference on the board the log records (R² 0.93, decided positions left out, which Forge scores ±2³¹). Per item, as Forge weighs it: a land ~295 points; a creature ~190 plus ~46 a point of toughness; any other permanent ~125 plus ~37 a point of mana value, whatever it does; a card in hand ~10; a point of life ~3. Open mana has no term at all (the source says `TODO evaluate holding mana open for counterspells`).

A control deck's 0–500 lead over midrange (it wins 37%) is, on average: **lands +131, non-creature permanents +71, creatures −57, hand +1, life −3**. So the inversion is not hand cards or open mana; it is lands and non-creature permanents priced by mana value while the board is lost. A 26-land control deck making its drops looks ahead in Forge's eyes. For the evaluator: lands and non-creature permanents need learned weights, which the doc's feature list already gives them (lands total and untapped, noncreature permanent count; I'd add their summed mana value).

## Step 3: blocks

With first strike, double strike, deathtouch and indestructible modelled, stock Forge's blocks are still **74% chumps** (1,087 blocks; control defending 93%, aggro 78%, midrange 66%). So it was not an artefact. The no-chump rule is built into the bridge (Forge blocks, then chump blocks are removed unless the damage would take life under 5; trades, safe blocks and double blocks are kept) and is being A/B tested now against plain Forge in eight decks' mirrors, 10 matches a half. Result to follow.

## Production

Live as of this afternoon: the weekly calibration round robins and benchmarks write per-turn logs on the NAS and the Mac worker (engine `2.0.15|0e428316/47cabb0d`). They still run with Forge on both seats; per your ask, they switch to the pilot once a pilot version passes (the run's `method.pilot` will say which).

## Suggested next

1. Narrow the reactive pilot to the decisions that showed gains: answering threats at instant speed (kept), spending mana at the opponent's end step (kept), and drop or soften "hold counter mana in my main phase" for decks with threats to deploy. Re-run both batches.
2. The block rule's A/B (running).
3. The evaluator waits for a pilot batch where both control rows are un-inverted, as you set out.

## Step 3 result: the chump blocks are forced, not bad (added 14:10)

The no-chump rule against plain Forge in eight decks' mirrors (10 matches a half, ~50 games a deck): **every deck 48–50%, no change**. The reason, from the stock batch's 794 chump blocks with the defender's life at the start of that turn and the attack's total power:

| The attack, unblocked | Chump blocks |
| --- | --- |
| would have been lethal | 622 (78%) |
| would have taken life under 5 | 120 (15%) |
| was safe to take | 52 (7%) |

By life: 329 at 1–5 life, 271 at 6–10, 123 at 11–15, 71 at 16+. So Forge's 74% chump share is a symptom of losing (blocks made to survive), not a blocking error; the rule only ever touches the 7%, which is too rare to move a result. **Blocks are not the Dimir row.** The rule stays in the bridge, off; I'd drop step 3 and look at attacks instead (how often Forge attacks into a board where the attack loses creatures for no damage, and how often it doesn't attack when the opponent has no untapped blockers), which the log already records.
