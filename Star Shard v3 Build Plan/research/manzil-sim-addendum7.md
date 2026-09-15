# Manzil sim — Addendum 7

**20 August 2026.** Three questions the Signature Pass left open after the flip-density pass:
Addendum 6 (the storm's one-directional immunity), the −1 softening family, the thread's wrap.

Engine: `research/manzil-engine-v5.js`, a fresh port of the ruleset **as shipped** — Same (ties
flip), Combo (a tie-flipped card strikes both its neighbours), tie-count-to-you, dominion,
jupiter-counts-two, saturn's locked ground, mars' onward strike, venus' soften, mercury's better
face, heart, blaze, crown, hideaway, and the drafted ghost / empty district / thread. Sky = her
shipped judgment: greedy 2-ply, reply weight 8, FNV date-seed breaking her ties. "Careful" = your
2-ply, "casual" = your 1-ply. Target bands, unchanged: careful 55–65%, casual 35–45%.

**Calibration.** Chart five, no storm signature, careful: **60.9%** here against Addendum 4's 59.0%
on the old port. Within two points, so the numbers below are comparable to the earlier addenda.

---

## 1. Addendum 6 — the storm's immunity fails, and direction was never the lever

672 boards a cell.

| storm's immunity | careful | casual | tied | flips |
|---|---|---|---|---|
| none | 60.9% | 34.7% | 10.6% | 4.37 |
| **on its own mansion only** | **62.1%** | **36.8%** | 9.2% | 4.38 |
| one-directional (**as shipped**) | 74.9% | 36.8% | 14.6% | 3.41 |

The fix did not land. One-directional immunity puts careful play at **74.9%, ten points past the
band** — and the symmetric and spends-once variants measure the same to within a point (75.3% and
76.2% at 336 boards). Directionality is not the lever because the problem is not who ties whom: an
8|6 that cannot be tied is unclaimable by four of her five planets. Only saturn's 9 beats it.

Levels confirm it. Immunity at L2 (8|5) gives careful 75.3%; at L3 (8|6), 76.2%; at L4 the card is
already broken on numbers alone (78.3% *without* any immunity). A "lesser face only" variant is
arithmetically dead at L2 — her leftward attacks use 9, 8, 4, 6, 7, so none of them can tie a 5.

**Recommendation: the storm cannot be tied while it stands on its own mansion.** 62.1% careful and
36.8% casual, the only configuration in this whole exercise where both bands land. It needs no new
vocabulary — dominion already made a card's own mansion special — it stays rare but chosen (mansion
6 is on the road nine nights in twenty-eight, and lodging it there is your decision), and it keeps
the flavour exactly: the storm cannot be moved at home.

## 2. The −1 family — the flag was pointing at the wrong card

Hand: ghost · empty district · jewel · throne · heart, all L2. 336 boards a cell.

| ablation | careful | tied | flips | tie-flips |
|---|---|---|---|---|
| all on | 56.5% | 9.5% | 3.31 | 0.95 |
| ghost off | 39.9% | 10.7% | 3.50 | 1.53 |
| district off | **58.6%** | 14.9% | 4.02 | 1.31 |
| both off | 37.8% | 10.7% | 4.42 | 2.02 |
| jewel off | 55.4% | 10.4% | 3.26 | 0.92 |
| her venus off | 55.7% | 9.2% | 3.43 | 1.37 |

**The empty district is negative.** Turning it off *raises* careful play 2.1 points. Targeting it at
her flank only (the ghost's grammar) does not save it: 56.8%, still below off. As drafted it softens
both flanks, so it hands a 2-ply opponent free claims on your own cards, and its 2|8 body is a
liability the signature never repays.

**The mechanism is new and it is the useful finding.** After the pass, a −1 *destroys ties*, and
ties now favour you twice over: a tie flips, and a tied count is yours. The district's softening
drops tied boards from 14.9% to 9.8% and tie-flips from 1.31 to 0.95. **Softening is no longer a
pure good.** Any move that turns equal numbers into unequal ones is now spending something.

**The ghost is the over-strong card, not the district.** Alone in the chart five:

| ghost | careful | casual | flips |
|---|---|---|---|
| off | 51.2% | 19.3% | 3.26 |
| on | **78.3%** | 32.7% | 3.15 |

Twenty-seven points from one signature — the largest single number in any addendum. It is targeted
by construction ("*her* cards beside it fight at −1"), so it takes her 9 to an 8 and her 8 to a 7
without ever weakening your own flank, and it does it from a 6|6 body that is otherwise the worst
class in the game.

**The family does not stack.** A second softener on an already-softened card is worth zero or less:
the district costs 2.1 points beside the ghost and 1.8 when targeted. One targeted softener is
enormous; two is one wasted card.

Jewel immunity: +1.1, small, live, keep. Her venus: net zero either way (it softens her own flanks
too, and removing it removes that self-harm as well).

## 3. The thread's wrap — a no-op

Hand: thread · storm · throne · heart · blaze. 336 boards a cell.

| wrap | careful | casual | flips | tie-flips |
|---|---|---|---|---|
| off | 59.2% | 25.6% | 2.65 | 0.79 |
| on | 60.1% | 25.6% | 2.68 | 0.80 |

Nine tenths of a point careful, nothing at all casual, three hundredths of a flip. The flag guessed
it might be the best card in the game or a coin flip; it is neither, it is nothing. Wrapping adds
exactly **one** new adjacency (slot 0 to slot 8), and only from the turn the thread lodges, and both
sides get to use it. It cannot matter.

## Calls

1. **The storm:** replace the one-directional immunity with **immunity on its own mansion**. Both
   bands land. The shipped rule is ten points out and should not survive the next build.
2. **The empty district:** the drafted move is a self-inflicted wound and targeting does not fix it.
   Rework it off the −1 axis entirely — it is a 2|8 with an emptiness archetype, and the count class
   is where its flavour actually lives.
3. **The ghost:** flag it as over-strong at +27 and give it the storm's treatment, a condition that
   is chosen rather than automatic. Do not touch its numbers.
4. **The thread:** rework. The wrap is not a card, it is a footnote.
5. **General law for the next tuning round:** a −1 spends a tie, and ties are now worth two things
   to the player. Score every softening move net of the ties it destroys.

Open after this: the twenty-one cards without a live signature, and whether the ghost's condition
and the storm's condition should share one printed grammar ("at home", "while behind") so the deck
teaches the idea once.

Data: `manzil-sim-a6.json`, `manzil-sim-a6-levels.json`, `manzil-sim-a6-conditional.json`,
`manzil-sim-a6-confirm.json`, `manzil-sim-minus1.json`, `manzil-sim-minus1b.json`,
`manzil-sim-thread.json`.
