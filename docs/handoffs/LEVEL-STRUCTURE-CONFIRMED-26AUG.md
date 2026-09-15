# Does the level structure work? Yes, with two numbers fixed and one refinement

**26 August 2026.** Confirming before drafting, as asked. Everything measured on
`research/ref-simple.js`, awake-first shuffle, twelve drawn and seven kept, eleven stations, the
mansion fight. Two seeds a cell.

---

## 1. "Enhance your numbers OR take the ability" — a real choice, at exactly one setting

Measured with the whole hand raw, then bumped, then woken:

| the player's twelve | careful |
|---|---|
| every card raw, no bump | 18.4 |
| every card raw, **+1** to both faces | **39.6** |
| every card raw, **+2** to both faces | **65.9** |
| every card **awake**, no bump | **49.4** |

**A signature is worth about +1.4 on both faces.**

Which settles the branch:

- **At +1 the choice is real.** Abilities are worth slightly more on average, and it varies enormously
  card by card. The listener's signature is far above +1; the veil's is far below. A player weighing
  them per card is doing genuine work.
- **At +2 the choice is dead.** Numbers beat abilities by a distance and every rational player takes
  numbers on nearly every card.

> **The number branch is +1 to both faces. Never +2.**

**And a connection worth naming.** Earlier in this project a signature measured as worth about
+1 *total across all twenty-eight cards* — nearly nothing. It is now worth +31. Nothing about the
cards changed. **The awake-first shuffle is what made abilities worth anything**, because before it
your hand was mostly cards whose abilities were asleep. The shuffle fix and the ability-value problem
were the same problem.

## 2. The level-4 lock — the cap is two

Locking N of your seven into every hand:

| locked | careful | casual | **gap** | close | **blowout** | the hand |
|---|---|---|---|---|---|---|
| 0 | 49.4 | 30.0 | 19.4 | 23% | **46%** | all seven vary |
| 1 | 47.9 | 25.5 | 22.4 | 23% | 49% | six vary |
| **2** | **55.2** | 27.6 | **27.6** | 20% | 53% | **five vary** |
| 3 | 57.3 | 30.2 | 27.1 | 20% | 56% | four vary |
| 5 | 59.0 | 37.1 | 21.9 | 19% | 58% | two vary |
| 7 | 66.1 | 30.4 | **35.7** | 27% | **64%** | **nothing varies — the same hand every night** |

**Two is the cap.** It has the highest skill gap of any workable setting, it lands careful play at the
band floor, and it leaves five of seven slots turning over every night.

**Three is defensible** and nearly identical on skill, at the cost of four more points of blowouts.

**Seven ends the game.** Every night becomes the same hand, the shuffle stops existing, and blowouts
hit 64% — the daily draw is the thing that makes this a game you come back to and locking it all
deletes it. The cap is not a tuning detail, it is load-bearing.

**One caution.** Every lock raises blowouts, from 46% at zero to 53% at two. That is the problem the
cascade removal fixes, and it is worth doing both together: no cascade plus two locks should land
around 55 careful, a gap in the high twenties, and blowouts in the mid forties. **That would be the
best configuration measured in this project.**

## 3. One refinement to the structure, and it saves you twenty-four abilities

As written, two choice points at L2 and L3 means **fifty-six abilities to design**. With seven
permutations available, that is eight variants of each — and the redundancy problem returns at double
scale.

**Make the two slots different in kind:**

| level | the choice |
|---|---|
| **1** | numbers only |
| **2** | **+1 to both faces** — or — **this card's own signature** |
| **3** | **+1 to both faces** — or — **your quadrant's grant** |
| **4** | this card is in your hand every night (max two cards) |

**Twenty-eight signatures plus four grants. Thirty-two, not fifty-six.**

And it does three things at once. The player learns four grants rather than twenty-eight. Your copy
of a card differs from mine — four builds per card, which is the deckbuilding depth this game has
never had. And the quadrant becomes something you *feel* rather than a colour on the frame, because
by level three every card you own is expressing its animal.

**Four builds per card:** +2 numbers · +1 and the signature · the signature and the grant · +1 and
the grant.

## 4. The animals, and the permutations they own

Seven permutations, four animals, and the split falls out of the real symbolism rather than being
forced onto it.

| animal | mansions | permutations it owns | why |
|---|---|---|---|
| **Byakko** the white tiger | 1-6, 28 | **deny a fight** · **lower a number** | west, autumn, metal. Hardness and diminishment. The tiger holds. |
| **Suzaku** the vermilion bird | 7-13 | **add a fight** · **raise a number** | south, summer, fire. Amplification and reach. The bird strikes. |
| **Seiryuu** the azure dragon | 14-20 | **turn a card** · **move a card** | east, spring, growth. Change of state and position. The dragon shifts. |
| **Genbu** the black tortoise | 21-27 | **change the worth** · **change the owner** | north, winter, water. Depth, foundations, what endures. The tortoise counts. |

Numbers appear twice because they split cleanly by direction: the tiger weakens what comes at it,
the bird strengthens what it sends out. That is metal against fire, and it reads.

**This means many current cards move.** The listener sits in Genbu but strikes; the thread sits in
Byakko but counts. Rebuilding from the ground up means re-theming those to their animal, which is the
job — flagging it so nobody is surprised when a familiar card does something new.

## 5. Two decisions I need before drafting

**Is the L2/L3 choice reversible?** Levelling is gated to one night a month per mansion. A permanent
wrong choice strands a card for months, which is punishing. A free re-pick has no weight. My
recommendation: **re-choosable on that mansion's own night, and it costs the night's progress.** You
keep the card, you spend the night.

**Does the lock cap grow?** Two is right for a full collection. Whether a player earns a third at some
milestone is a progression question rather than a balance one — three still works, five does not.

---

## Confirmed

The structure works. The numbers that make it work are **+1 on the number branch** and **two on the
lock cap**, and the refinement is **signature at level two, quadrant grant at level three**.

Ready to draft the twenty-eight against the four animals and the seven permutations.

### Files

`research/choice.js`, `research/lock.js`.
