# The shuffle ratio, and whether the calibration rule holds

**26 August 2026.** Testing Justin's structure: all 28 mansions go in the shuffle, cards you have
taken come up awake at your level, cards you have not come up raw. Draw nine or twelve, keep seven.

**Engine:** `research/ref-boss.js`. Two seeds, 1,344 boards a cell, eleven stations, taps live on
both sides. All rows are the mansion fight, not a walker.

---

## 1. The ratio is not a dial. It is the progression curve.

Drawing nine:

| owned | awake cards in your seven | careful | casual | gap | close | blowout |
|---|---|---|---|---|---|---|
| 4 of 28 | 1.2 | 25.2 | 17.3 | 7.9 | 16% | **65%** |
| 8 of 28 | 2.5 | 27.5 | 18.6 | 8.9 | 16% | 63% |
| 14 of 28 | 4.4 | 33.3 | 20.4 | 12.9 | 17% | 57% |
| 21 of 28 | 6.4 | 39.5 | 23.1 | 16.4 | 22% | 53% |
| 28 of 28 | 7.0 | 48.2 | 29.0 | **19.2** | 23% | 50% |

Drawing twelve:

| owned | awake in hand | careful | casual | gap | close | blowout |
|---|---|---|---|---|---|---|
| 4 of 28 | 1.6 | 23.7 | 17.6 | 6.1 | 15% | 63% |
| 8 of 28 | 3.3 | 29.1 | 23.2 | 5.9 | 17% | 59% |
| 14 of 28 | 5.8 | **38.7** | 25.1 | 13.6 | **24%** | 51% |
| 21 of 28 | 7.0 | 43.1 | 24.9 | 18.2 | 24% | 50% |
| 28 of 28 | 7.0 | 48.5 | 30.2 | 18.3 | 21% | 49% |

**There is no sweet spot with chaff in it.** Every step of ownership improves every measure at
once: win rate, skill gap, close games, blowouts. More awake is always better.

So the honest answer to "what ratio balances a shuffle" is: **the ratio is not a balance knob, it
is the progression.** Raw cards exist to make the keep-seven decision real, not to tune anything.
The design is already correct; there is nothing to tune here.

**Draw twelve, not nine.** At twelve you can field a full awake hand once you own about twenty-one
of the twenty-eight; at nine you need nearly all of them. Twelve also runs five points better at
mid-collection and produces more close games. It gives the choice more room without changing
anything else.

## 2. The calibration rule holds, and it lands where you would want it

Testing exactly what Justin proposed: a level-three mansion scaled against a player whose whole
collection is level two.

| the fight | careful | casual | gap | blowout |
|---|---|---|---|---|
| collection all L2, mansion at **L2** | 48.5 | 30.2 | 18.3 | 49% |
| collection all L2, mansion at **L3** | **37.9** | 25.1 | 12.9 | 57% |
| collection all L3, mansion at **L3** | 50.7 | 30.5 | **20.2** | 52% |
| collection all L3, mansion at **L4** | **37.3** | 20.8 | 16.5 | 59% |

The pattern repeats itself exactly one tier up, which is the sign it is structural rather than a
coincidence of one configuration:

> **A mansion at your collection's level is a fair fight — you win about half.**
> **A mansion one level above is a real stretch — you win about a third, but you can win.**

That is the ladder Justin described and the numbers say it works. It also does the job he wanted it
to do: you can attempt the next tier before you are ready and occasionally take it, but the sensible
play is to level first, and levelling is gated to one mansion a night by the moon. Nobody grinds
past it.

**Note the skill gap is highest when player and mansion are matched** — 18.3 and 20.2 on the level
rows, versus 12.9 and 16.5 on the stretch rows. Playing well matters most when the fight is fair,
which is the right shape and another argument for the rule.

## 3. The thing this exposes, and it is the biggest problem in the design

Look at the top of the first table again.

**A player who owns four mansions wins a quarter of their boards and two thirds of them are routs.**
The skill gap is under eight, so playing well barely helps. That is the first week of the game.

Justin's rule covers the top of the ladder — level three scaled against an all-level-two collection.
**The missing half is the bottom: a level-one mansion has to be scaled against someone who owns
almost nothing and whose hand is six raw cards and one real one.** Every row above holds the mansion
at full strength, which is why the early numbers look brutal; they are measuring a new player
against a veteran's opponent.

That is not an argument against the structure. It is the same rule applied downward, and it has not
been written yet. Without it the design has a wall at the start rather than at the end.

## 4. Two things I could not answer

**The shuffle-fairness question.** Justin asked whether every shuffle is comparably winnable. My
per-shuffle spread came out between 38 and 44 in every single row, flat across ownership, pool size
and level. That is what pure coin-flip noise produces at two boards a shuffle, so **the metric as
built cannot answer the question.** Measuring it properly needs many boards per shuffle with the
shuffle held fixed, which is a different harness. Flagging rather than reporting a number that means
nothing.

**Whether choosing is interesting.** My keep-seven used a fixed rule: awake first, then whose home
falls on the road ahead, then by measured worth. That rule captures most of the value of choosing.
If a rule that simple is near-optimal, the choice is homework rather than a decision, and every
serious player will end up running the same optimiser. **The nightly shuffle from all 28 helps** —
there is no stable best hand to memorise — but it is worth designing a reason the obvious pick is
sometimes wrong. A mansion trait that punishes the road-adjacent pick would do it.

## 5. What follows

1. **Draw twelve, keep seven.** Better than nine on every measure and more room for the choice.
2. **Adopt the calibration rule in both directions.** A mansion at your level is a coin flip; one
   above is a third. Write the downward half: a level-one mansion faces someone with one awake card.
3. **The early game needs its own pass.** It is the weakest part of the design and nothing currently
   addresses it.
4. **Give at least one mansion trait that breaks the obvious draft**, so keeping seven is a judgement
   rather than a sort.
5. Blowouts still sit near half, and worse for new players. Unchanged, still unaddressed.

### Correction to yesterday

I recommended cutting the walkers from eight to five because the early ones are easy. That was the
wrong inference from the right data: easy walkers argue for harder walkers, not fewer. Withdrawn.

I also said no sleeping cards should exist in the collection. That was right about the *hand* and
wrong about the *pool*. In this structure raw cards never reach your hand unless you choose them,
and they are what makes the choice mean something.

### Files

`research/ratio.js`, `research/ref-boss.js`.

---

# Addendum: what actually makes the early wall

Added after Justin asked which levers cause it. **The first thing to say is that my own test
overstated it.** Every row above held the mansion at full strength — rung 9, seven cards, all awake,
taps live — regardless of how little the player owned. So it measured a beginner against a
veteran's opponent.

Scaling the mansion instead:

| | awake in hand | careful | casual | gap | blowout |
|---|---|---|---|---|---|
| owns 4, mansion rung 9, hand 7 | 1.6 | **23.7** | 17.6 | **6.1** | 63% |
| owns 4, mansion rung 7, hand 6 | 1.6 | **50.2** | 40.9 | 9.3 | 53% |
| owns 4, mansion rung 5, hand 5 | 1.6 | 84.5 | 67.2 | 17.3 | **64%** |
| owns 8, mansion rung 9, hand 7 | 3.3 | 29.1 | 23.2 | 5.9 | 59% |
| **owns 8, mansion rung 7, hand 6** | 3.3 | **57.9** | 40.1 | **17.8** | 49% |
| owns 8, mansion rung 5, hand 5 | 3.3 | 86.0 | 64.9 | 21.1 | 68% |
| owns 28, mansion rung 9, hand 7 | 7.0 | 48.5 | 30.2 | 18.3 | 49% |

## The four levers, largest first

**1. The mansion's own strength.** Dominant by a distance. Two rungs and one card turns a brutal
23.7 into a fair 50.2 for the same player. This is not a new mechanism — the rung ladder already
exists. It is simply not currently tied to anything about the player.

**2. How many awake cards the player holds.** Worth about twenty-five points of win rate across the
full range, and about nine points of *skill gap*. **This one cannot be fixed by tuning the
opponent.** Compare owns-4 at rung 7 (careful 50.2, gap 9.3) against owns-28 at rung 9 (careful
48.5, gap 18.3). Same win rate, half the skill. A new player's game is winnable but shallow.

**3. The tap, which does not exist for a beginner.** It lives at level 3. A new player owns nothing
at level 3, so the single largest source of skill in the game is switched off for them entirely.
That is most of why lever 2 costs skill gap rather than just win rate.

**4. The draft, which is fake early.** Draw twelve, keep seven. If you own four, you take your four
and three raw fillers — there is no decision. The keep-seven choice only becomes a decision once you
own enough to have to leave something good behind, which the table puts somewhere past eight.

## The fix, and it was already in the design

Levers 2, 3 and 4 are all one thing: a beginner holds too few real cards. **Chart seeding solves all
three and it was in the original proposal before "you only own what you beat" replaced it.**

Start the player owning their own chart — sun, moon, rising and the planets, about six mansions — at
level 2. That moves a new player from the owns-4 row to the owns-8 row, which is exactly where the
skill gap recovers: **57.9 careful, 17.8 gap, 49% blowouts.** That is a better opening night than the
game currently offers anyone at any point.

**So: chart seeding, plus early mansions scaled two rungs below the boss.** Together they turn a
23.7 win rate with a 6-point skill gap into a 57.9 win rate with an 18-point one.

## One warning about over-correcting

The rung-5 rows look kind: 84 to 86 percent careful. But blowouts go **up**, to 64 and 68 percent —
the highest anywhere in this project. A lopsided board runs away just as badly in the player's
favour. **Making it easier has a floor**, past which you trade a hard rout for a boring one.

The target is the rung-7 shape: roughly half to sixty percent careful, and blowouts under fifty.
