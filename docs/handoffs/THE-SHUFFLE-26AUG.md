# The early wall is shuffle dilution, and one rule fixes it

**26 August 2026. This supersedes the addendum at the end of `RATIO-AND-CURVE-26AUG.md`,** which
proposed chart seeding as the fix. Chart seeding was already in the spec. The real lever is
different and smaller.

**Tested exactly as specified:** all 28 mansions always in the shuffle. Your sun at level 3, your
five planets at level 2, the other twenty-two raw — in the shuffle, numbers only, no signature. Draw
twelve, keep seven, eleven stations. Two seeds, 1,344 boards a cell.

---

## What night one actually looks like

| your collection | awake in your 7 | taps in your 7 | careful | gap | blowout |
|---|---|---|---|---|---|
| **start: sun + 5 planets** | **2.5** | **0.4** | 26.7 | 6.4 | 62% |
| a month in: 2 at L3, 12 at L2 | 5.8 | 0.8 | 40.6 | 15.6 | 50% |
| half the wheel: 4 at L3, 20 at L2 | 7.0 | 1.6 | 49.5 | 20.5 | 51% |
| all awake: 6 at L3, 22 at L2 | 7.0 | 2.5 | 49.2 | 18.3 | 50% |
| everything at L3 | 7.0 | 7.0 | 50.7 | 20.2 | 52% |

**Two things fall out of this immediately.**

**One. The entire curve is driven by a single number — how many of your seven are awake.** It runs
2.5, 5.8, 7.0, 7.0, 7.0 and the win rate runs 26.7, 40.6, 49.5, 49.2, 50.7. Once your hand is full of
real cards, further levelling changes almost nothing, because the mansion levels with you. The
calibration rule is doing its job.

**Two. On night one you hold six real cards and the shuffle gives you two of them.** You own your
sun and five planets. That is six awake cards in a twenty-eight card shuffle, so a twelve-card draw
hands you 12 × 6/28 ≈ 2.6 of them, and your sun — your only level-3 card, your only tap — turns up
on **four nights in ten**.

**That is the wall. Not what you own. What the shuffle gives you of what you own.**

It is the same problem Slay the Spire is built around: every card added to a deck dilutes every card
you actually want. There the answer is thinning and the bottle relics that guarantee a card into your
opening hand. Here it is one rule.

## The fix, measured

Three ways to draw the twelve:

**Night one** — sun at L3, five planets at L2, mansion at rung 9:

| how the twelve is drawn | awake | taps | careful | gap | blowout |
|---|---|---|---|---|---|
| straight from all 28 | 2.5 | 0.4 | 26.7 | 6.4 | 62% |
| your best card always dealt | 3.0 | 1.0 | 30.7 | 9.4 | 56% |
| **your awake cards drawn first** | **6.0** | 1.0 | **40.8** | **14.2** | **51%** |

**A month in** — 2 at L3, 12 at L2:

| how the twelve is drawn | awake | taps | careful | gap | blowout |
|---|---|---|---|---|---|
| straight from all 28 | 5.8 | 0.8 | 40.6 | 15.6 | 50% |
| your best card always dealt | 6.1 | 1.5 | 43.8 | 17.0 | 48% |
| **your awake cards drawn first** | **7.0** | 1.6 | **52.1** | **21.2** | **46%** |

> **Draw your awake cards first, then fill the twelve with raw ones.**

Night one goes from 26.7 to 40.8 and the skill gap more than doubles. A month in it lands at 52.1
with a 21.2 gap and **46% blowouts, the lowest figure anywhere in this project.**

Guaranteeing just your best card is a smaller, real help — it is worth most of the tap availability,
0.4 to 1.0, which is why the skill gap jumps from 6.4 to 9.4 on its own. Worth having as well, since
it means your sun is in every hand, which is the right thing narratively too.

## Why this keeps everything the design wanted

- **All 28 stay in the shuffle.** Nothing is removed.
- **Raw cards still make the pick a decision.** They are the filler you choose against.
- **It self-resolves.** Once you have more than twelve awake, the raw cards stop appearing and the
  keep-seven becomes a choice among real cards, which is the interesting version of the decision.
- **Progression is unchanged.** Awakening more of the wheel is still the whole ladder.
- **No new mechanic.** It is a change to how twelve cards are picked.

## What I got wrong, for the record

I ran a ladder labelled "owns 4 of 28, owns 8 of 28" and read the early rows as an acquisition
problem, then proposed chart seeding as the answer. Chart seeding was specified in the original
message. The variable I was moving was right — how many of your cards are awake — but the label was
wrong and the conclusion I drew from it was a solution to a problem the design did not have.

I also never tested the actual starting state until now. Every earlier row had the player at level 2
with **no level-3 card at all**, so the player had no tap. The spec gives a beginner one. That is the
difference between a 6.4 skill gap and a 9.4 one before any other change, and it was the thing worth
testing first.

### Still open, unchanged

Blowouts sit at 46 to 51 percent even in the best configuration. Better than the 62 percent night one
currently produces, and still the largest unaddressed problem in the game.

### Files

`research/spec.js`, `research/shuffle.js`.
