# The chart-seeded deck — tested, and one number that reframes the card work

**26 August 2026.** Justin proposed: seven cards in hand, eleven stations, a pool of twelve seeded
from your birth chart (one at level 3, your sun; five at level 2, your planets; the rest asleep),
with the level mix widening as you progress.

**Engine:** `research/ref-tap.js`. Two seeds a cell, 1,120 to 1,568 boards. Rung 9, her hand seven
at level 3 with taps live, road eleven throughout, so the rows compare cleanly to each other. They
do **not** compare to earlier documents, where she was at level 2 and weaker.

---

## 1. As specified, it makes the game worse. The reason is one word.

| the player's twelve | careful | casual | gap | close | blowout | asleep cards in hand |
|---|---|---|---|---|---|---|
| flat, every card awake | 32.2 | 19.5 | 12.8 | 19% | 55% | 0 |
| **new: 1 L3, 5 L2, 6 asleep** | **21.4** | 15.8 | **5.6** | 14% | **62%** | 3.5 |
| mid: 2 L3, 5 L2, 5 asleep | 26.3 | 18.0 | 8.2 | 16% | 59% | 2.9 |
| late: 1 L4, 2 L3, 5 L2, 4 asleep | 30.0 | 17.6 | 12.4 | 16% | 59% | 2.3 |

Every mix is worse than the flat deck on every axis, and the ordering is monotone in one variable:
**the fewer asleep cards you hold, the better everything gets.** Difficulty, skill gap and blowout
rate all track it.

The reason is that **an asleep card in this engine is the same numbers with no ability.** Verified
directly: the return reads 7/7 at level 1, 2, 3 and 4. Levelling adds an ability and nothing else.

So asleep is not a different kind of card. It is a strictly worse one. Half a hand of them is not
an interesting constraint, it is a handicap, and the game plays exactly like that: 62% blowouts.

Guaranteeing tonight's mansion is in the pool (which the chart seeding otherwise leaves to a 43%
chance) moves it by a point or two. Not the problem.

## 2. One change fixes it, and it produces the best board measured this session

Give an asleep card **stronger numbers instead of nothing.** Raw force, no trick. Then a mixed deck
is a real deck: some cards hit hard, some do clever things, and you choose.

| new-tier deck, asleep cards get | careful | casual | gap | close | blowout |
|---|---|---|---|---|---|
| nothing (as proposed) | 21.4 | 15.8 | 5.6 | 14% | 62% |
| +1 to both faces | 33.5 | 23.9 | 9.6 | 20% | 49% |
| **+2 to both faces** | **49.8** | 28.2 | **21.6** | **30%** | **40%** |
| +3 to both faces | 54.3 | 35.9 | 18.4 | 28% | 39% |

**+2 is the setting.** It clears the 20-point skill-gap target, it more than doubles the share of
close games, and it cuts blowouts from 62% to 40%. On the interest metrics it is the best
configuration measured anywhere in this project.

At +3 the numbers start doing the player's job for them: careful play rises but the gap falls back
to 18.4, because raw force beats judgement.

## 3. The number that reframes everything

I measured the whole signature system against raw stats. Same board, same opponent, the player's
twelve either all awake or all asleep with a flat bonus:

| the player's twelve | careful | casual | gap | close | blowout |
|---|---|---|---|---|---|
| every card awake, no bonus | 32.2 | 19.5 | 12.8 | 19% | 55% |
| every card asleep, no bonus | 15.1 | 12.0 | 3.1 | 10% | 73% |
| **every card asleep, +1/+1** | **33.8** | 21.6 | 12.1 | 24% | 48% |
| every card asleep, +2/+2 | 53.5 | 37.7 | 15.8 | 27% | 35% |

> **All twenty-eight signatures together are worth about one point on both faces.**

32.2 with every ability in the game firing. 33.8 with no abilities at all and +1 to every card.
Twenty-eight hand-designed abilities are collectively worth one stat point, and the +1 version has
*more* close games and *fewer* blowouts.

That is the sixteen-dead-cards problem stated in a unit that can be designed against.

## 4. Which means the progression runs backwards

With asleep at +2, watch what happens as the player levels up and swaps asleep cards for awake ones:

| tier | careful | gap | blowout |
|---|---|---|---|
| new: 1 L3, 5 L2, 6 asleep | 49.8 | 21.6 | 40% |
| mid: 2 L3, 5 L2, 5 asleep | 46.8 | 19.1 | 44% |
| late: 1 L4, 2 L3, 5 L2, 4 asleep | 46.1 | 17.6 | 45% |

**Progressing makes the game worse.** Because an ability is worth about +1 and you are giving up
+2 to get it, every level-up is a downgrade.

This is not an argument against the structure. It is the structure working correctly and revealing
that the cards are underpowered. **A progression system that trades raw power for abilities only
feels like progress if the abilities are worth more than the power.**

### The bar for Design, in one line

> **Every signature has to be worth more than +2 on both faces. Today the whole set together is
> worth +1.**

That is a real, measurable design constraint, and it is the first one the card work has had. It
turns "make the sixteen dead cards interesting" into a pass/fail test that can be run per card with
the existing harness.

For scale, on the generation-D table only three signatures come close: the listener (+18.0), the
thread (+13.6) and the empty district (+10.7). Everything else is under +10 and sixteen are under
+3.5, which is noise.

## 5. What I would build

1. **Keep the chart-seeded pool.** One sun at level 3, planets at level 2, the rest asleep. It
   solves the identical-starter-pack problem and it is the astrology bridge. Nothing here argues
   against it.
2. **Keep seven cards and eleven stations.** They work.
3. **Make asleep mean +2 on both faces, not nothing.** One line in `makeCards`. This is the change
   that makes the whole proposal land.
4. **Guarantee tonight's mansion in the pool.** Worth little mechanically, worth a lot narratively,
   and without it you have no home card on 57% of nights.
5. **Then fix the signatures against the +2 bar**, because until they clear it, levelling a card
   makes your deck worse and the progression system will read as broken to players who cannot say
   why.

Do not ship 1 and 2 without 3. As specified, the mixed deck is the worst configuration measured.

### Caveats

Two seeds a cell. The large contrasts here (15.1 versus 53.5) are far beyond seed noise; the finer
ones (21.6 versus 19.1) are softer and worth a third seed before anyone authors exact tier tables.
Level 4 is still mechanically identical to level 3 in the engine, so the "late" tier's L4 card is a
second L3 card in these numbers.

### Files

`research/deck.js` (the tier grid), `research/sleep.js` (the asleep-bonus sweep),
`research/bar.js` (abilities against raw numbers).
