# Where the core loop stands on the 22 August build

*Measured against `manzil/index.html` as deployed (commit b515c3c, "all 28 signatures live,
pack-of-twelve deal"). Port: `research/manzil_v6.py`, a method-for-method port of `_cards`,
`_on`, `_faceOf`, `_noSoften`, `_safeNow`, `_lodge`, `_tryFlip`, `_resolve`, `_ctx`,
`_slotW`, `_counts`, `_boardWinner`, `_skyMove`, `_deal` and `_replyW`. Drivers:
`v6run.py`, `v6road.py`, `v6exploit.py`. Data in `research/manzil-loop/v6-*.json`.*

**The build implements the handoff.** The re-baseline is in (`l <= r ? l+1 : r+1`, applied at
card build, levelling no longer touches numbers), all 28 signatures are live at L2, the pack
of twelve and the five-card deal are in, `dealGuarantee` defaults on, and the reply weight is
per-rung data rather than a constant. Nothing below is a complaint about that. It is where
the numbers landed.

**One caveat on this port, and it runs one way.** Four signatures are player-activated in the
build — the Gate ("lodges first, once"), the Glance ("her next fights −1"), the Hand ("may
move once") and the Guide ("may trade grounds"). The agents here never activate them, so
those four play as vanilla. **Every player-side number below is therefore a floor.**

---

## 1. The core loop is below band, and it gets harder as you collect

Her five planets, reply weight 8, five dealt from the pack, two seeds, 672 boards per cell.

| the player carries | careful | casual | skill gap | flips | margin | boards within 1 |
|---|---|---|---|---|---|---|
| **a pack of 5** (the default chart five) | **60.1** | 45.1 | 15.0 | 3.83 | 2.62 | 32.7% |
| **a pack of 12** | 43.9 | 28.1 | 15.8 | 3.75 | 2.72 | 32.7% |
| a pack of 28 | 39.4 | 20.5 | 18.9 | 5.38 | 3.62 | 25.3% |

Target: careful **55-65**, casual **35-45**, skill gap **20+**.

The default pack of five puts careful play in band at 60.1 and casual just over the top of
its band at 45.1. **A pack of twelve — the design intent — sits below both bands at 43.9 and
28.1.** A pack of 28 is worse again.

The direction is the problem. **The more mansions you carry, the harder the game becomes**,
because a random five out of twelve is a weaker hand than a chosen five out of five. That is
backwards for a progression system: collecting should feel like getting stronger.

Two ways out, and they are not exclusive. Ease her at the pack sizes people actually reach,
or make the twelve matter — a *drafted* twelve of genuinely strong cards would read higher
than the twelve used here, which was a reasonable guess and nothing more.

**The skill gap is short everywhere.** 15.0 at a pack of five, 15.8 at twelve, against a
target of 20. Careful play is not being rewarded as much as the target asks.

## 2. The opening is nearly unsolved, and "nearly" is doing work

Forced-opening scan on the default pack, 54 openings, all 28 nights, two seeds:

| | best opening | perfect nights | openings winning all 28 nights |
|---|---|---|---|
| before (21 Aug build) | 100.0% | 28 of 28 | **5 of 90** |
| now, **pack of 5** | **98.8%** (The Crown at slot 3) | **26 of 28** | 0 |
| now, **pack of 12** | **78.0%** (The Drum at slot 7) | **5 of 28** | 0 |

No opening wins on every night any more under either pack, which is real progress.

But the two rows are different games. At a pack of five the signature slate alone dragged the
best opening from 100% to 98.8% — and 98.8% with 26 perfect nights is still a lookup. **The
Crown at slot 3 is the new Throne at slot 8.** A pack of five is five cards and no deal
(`_deal` returns the pack unchanged at five or fewer), so the randomness that was supposed to
break the book never fires.

At a pack of twelve the deal does exactly what it was designed to do: the best opening falls
to **78.0%, perfect on 5 nights of 28**. That is a game with no opening book.

**So the default pack of five ships the solved game and the pack of twelve ships the
unsolved one.** Pack size is not a preference setting, it is the single most consequential
number in the build.

## 3. The walkers' road descends, but four rungs are out of order

The eight coded walker hands at their coded reply weights, player carrying twelve:

| rung | she reads | careful | casual | gap | |
|---|---|---|---|---|---|
| 1 | 3 | 87.9 | 64.1 | 23.8 | |
| 2 | 4 | 74.1 | 56.1 | 18.0 | |
| 3 | 5 | 67.9 | 48.5 | 19.4 | |
| 4 | 6 | **91.8** | 69.6 | 22.2 | **easier than rung 1** |
| 5 | 7 | 80.2 | 50.1 | **30.1** | **easier than rung 2** |
| 6 | 8 | 66.4 | 42.9 | 23.5 | |
| 7 | 9 | 64.0 | 46.9 | 17.1 | |
| 8 | 11 | 68.5 | 48.7 | 19.8 | easier than rung 7 |
| **9, the sky** | 14 | **44.3** | 17.7 | 26.6 | |

**The overall shape is right.** 87.9% at the bottom to 44.3% at the top is a 44-point
descent, and casual play ramps 64.1 to 17.7, which is the first time the road has been a real
ladder for the player it exists for.

**Four rungs are in the wrong order.** Rung 4 is the easiest board on the road and it sits
fourth. Rung 5 is easier than rung 2. Rung 8 is easier than rung 7. Ranked by measured
difficulty the current hands should run 4, 1, 5, 2, 8, 3, 6, 7. That is a data change with no
code behind it.

**The step to the sky is a cliff.** Rung 8 at 68.5 to the sky at 44.3 is 24 points in one
move, which is the same shape as the fifth-planet cliff from the randomness doc §8.2. Either
rung 8 gets harder or the sky gets a softer first appearance.

## 4. The reply-weight dial has four settings, not nine

Against her planets, sweeping the weight alone:

| she reads | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 12 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|
| careful | 31.2 | 39.3 | 40.6 | 47.3 | 48.2 | 48.2 | 48.2 | 45.1 | 45.1 | 45.1 |
| skill gap | **−0.9** | 14.7 | 13.6 | 18.7 | 19.0 | 19.0 | 19.0 | 25.7 | 25.7 | 25.7 |

**Reads 7, 8 and 9 are the same opponent. Reads 11, 12 and 14 are the same opponent.** The
weight only matters when it changes which move wins the argmax, and past 11 it stops doing
that. Nine coded rungs plus the sky produce four distinct behaviours on this dial.

Below 8 it inverts, as the randomness doc §8.3 predicted: **at reads 3 she is the hardest
version of herself and the game is a coin flip** — careful 31.2 with a skill gap of −0.9,
meaning casual play does marginally better than careful play. A nearly-greedy sky is a
different opponent, not a weaker one.

On the road this is masked, because the walker *hands* carry the difficulty and the weight is
a garnish. But on a night against the sky herself the weight is the only dial, and three of
its settings do nothing.

## 5. The moon guarantee costs a little

| pack of 12 | careful | casual | gap |
|---|---|---|---|
| tonight's mansion always dealt | 43.9 | 28.1 | 15.8 |
| no guarantee | 46.0 | 26.2 | 19.8 |

Forcing tonight's mansion into the five spends a slot that would otherwise go to a better
card, and the dominion bonus does not repay it. Two points of win rate and four of skill gap.

Small, and there is a real argument for keeping it anyway — it is an anti-frustration rule,
not a balance rule, and the "I had nothing to open with" complaint is worth two points. But
it should be kept knowingly rather than as a free win.

---

## What I would look at first

1. **Pack size is balance-critical, not a preference.** At five the game is in band but
   solved; at twelve it is unsolved but below band. Neither is the shipping state. Pick
   twelve and re-tune her to it.
2. **Reorder the eight walker hands** by measured strength: 4, 1, 5, 2, 8, 3, 6, 7. Pure data.
3. **Rungs 5, 6 and 7 need a dial that isn't reply weight**, since 7, 8 and 9 are the same
   opponent. Walker hand strength is already doing the work; let it, and stop pretending the
   weight is a nine-step ladder.
4. **Do not use reply weights below 6.** Reads 3 is harder than reads 8 and makes the board
   a coin flip.
5. **The 24-point step from rung 8 to the sky** wants a landing.
6. **The skill gap is 15 where the target is 20**, across every pack size. Worth deciding
   whether the target moves or the game does.
