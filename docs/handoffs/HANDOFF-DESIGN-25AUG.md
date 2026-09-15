# Handoff: Design, 25 August 2026

A measurement session. The v6 Python port was re-conformed against your 24 Aug engine, and
then the opponent's hand was measured as a difficulty system. **Nothing in any `.dc.html` was
touched.** Everything below is a decision you own or a consequence of one.

**Paths.** Relative to the **starshard.net repo root**, not the Build Plan folder. Both have a
`research/` directory and they are different. The game's source of truth moved during this
session: it is now `Star Shard v3 Build Plan/Manzil - The Empty District.dc.html`.

**Required companion.** `research/manzil-v6-conformance-24aug.md` carries the evidence for
every number below, section by section. It should travel with this document.

**Reading the numbers.** Every figure is the *player's* win rate, so **lower means harder**.
Produced by the reference engine directly, not the Python port. Cells are 448 to 1,008 boards;
anything inside about ±3 points is noise.

---

## 0. The one-line summary

Four of your eight tested signatures do nothing at all, one of them actively helps the
opponent for a reason worth keeping, and the difficulty system you asked for already exists in
a single variable: how many cards she is holding.

---

## 1. The signature slate — open item 5, now with names

Measured one card at a time, companions held asleep, 1,008 boards each. The signature's worth
is how many points it takes off the player.

| card | worth | verdict |
|---|---|---|
| the thread | **+13.9** | real, and the strongest card in the set |
| the listener | **+6.8** | real |
| the chamber | **−4.3** | real, and it helps the opponent (see §2) |
| the glance | −0.7 | **inert** |
| the veil | −1.7 | **inert** |
| the ghost | −0.9 | **inert** |
| the mane | −0.1 | **inert** |
| the heart | 0.0 | **inert** |

**Four of eight do nothing measurable.** That is a different problem from "mistuned" and it
wants a different fix. `sig28.py` should be re-pointed at this question and run across all 28
before the slate is rewritten again, because the two competing 28s were both scored on a
measure that could not see this.

**One caution on the Thread.** It measures +13.9 alone and +39.7 in a hand built around it.
Both are true. It is a combo card, and it is the single biggest lever in the pool.

## 2. The Chamber — keep the mechanic, move it

The Chamber makes whoever holds it *worse*. The reason is confirmed, not guessed
(conformance §13): a greedy opponent plays better against it.

| | mean regret on the opponent's moves | perfect moves |
|---|---|---|
| chamber asleep | 8.31 | 57.9% |
| chamber awake | **7.16** | **62.4%** |

A weak player is weak because they take the tempting flip in front of them. The Chamber makes
that flip impossible, pushes them onto another move, and the move they are pushed onto is
closer to what a careful player would have chosen. **It protects a card by removing the
opponent's mistake.**

That is a genuinely unusual and coherent thing for a card to do, and it is worth keeping.
It is on the wrong side. **Decision for you:** make it a tool the player aims at the sky and
keep it out of walker hands, or rewrite it. What it cannot stay is a card sitting in the pool
that quietly punishes whoever draws it.

## 3. The starter pack is six, and the sixth ships awake

Open item 1, answered. The pack is the pool the five are dealt from, not the hand.

| pack | careful | casual |
|---|---|---|
| 5 | 62.5 | 37.5 |
| **6 awake** | **58.2** | 32.7 |
| 6 asleep | 52.1 | 30.7 |
| 12 asleep | 36.8 | 18.6 |

Six is the smallest pack that fires the deal, which is what breaks the solved opening. The
sixth card must ship **awake**: awake is 58.2 and in band, asleep is 52.1 and below it.
Consistent with the existing decision that the starter pack ships with its signatures awake.

**Twelve is off the table.** The 22 Aug pack-of-12 row (71.2) does not reproduce and is void.

## 4. The nine rungs are a hand, not a difficulty setting

Her reading depth does nothing. Measured flat from depth 5 to 22 (conformance §8), so the
`+ level x 2` term in the live game and the rung's depth number are both inert. **Rungs 3
through 11 are the same difficulty.** Whatever gradient the climb has today comes from the
walkers' hands differing, not from her thinking harder.

So the ladder is built from what she holds:

| | she holds | rung 1 | the sky |
|---|---|---|---|
| level 1 | 5 cards | 90% | **61%** |
| level 2 | 6 cards | 83% | **47%** |
| level 3 | 7 cards | ~70% | ~28% |
| level 4 | 8 cards | ~68% | ~23% |

**Hand size is the level dial. How many of her strong cards are awake is the rung dial.**
Level 4's sky at roughly 23% is the "hard to earn" you asked for, and it arrives for free.

Levels 3 and 4 are bookmarked until their specializations are decided, but the hand sizes are
reserved for them.

**The flavour question is yours:** nine walkers per road, each holding tonight's mansion, each
carrying one more waking threat than the last. What they are called and how the climb reads is
Design's, and the copy rule stands — no em dashes in anything the player sees.

## 5. Mansions will not be equally hard, and that is now the plan

Forcing tonight's mansion into every hand on its road swings difficulty by 49 points on its
own, because the Thread in her hand puts the player at 43% and the Glance at 92%. That is
wider than the ladder. Compensating for it flattens the ladder to seven points.

Justin's call: **mansions may vary, levels must scale.** So the 28 mansions become a
difficulty-ordered campaign rather than 28 equal ones. Two consequences for you:

1. **The order the player meets them in is now a design decision**, not an arbitrary one.
   Gentle mansions first. `cardstrength.json` has all 28 ranked.
2. **§1's rework will compress this.** Fixing the four inert signatures and the two outliers
   narrows the 49-point spread to roughly 25, which makes the ordering less load-bearing.

## 6. Still open, and still yours

- **The run structure**, and with it the portrait layout. These are one job, not two: a run is
  a vertical sequence of boards and the road wants to run away from the player rather than
  across a 390px phone screen. The current stage is a fixed 932 x 450 landscape world with no
  media queries.
- **Walker rung reorder** — still unverified, and now known to be unmeasurable by depth.
- **Levels 3 and 4** — what "familiar" and "unleashed" actually grant. Level 3 currently sheds
  the card's labels, which is a difficulty increase on the player's side, not a power.
