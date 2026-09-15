# Handoff: Design — the card set, 25 August 2026

A work order, not a report. The evidence for every number is in
`research/manzil-v6-conformance-24aug.md` and `research/manzil-l34-options.md`; the raw table
is `research/sig28-all.json`. **Nothing in any `.dc.html` was touched.**

**Paths.** Relative to the **starshard.net repo root**. The game's source of truth is
`Star Shard v3 Build Plan/Manzil - The Empty District.dc.html`. Everything cited below —
`sig28-all.json`, `sig28all.js`, `cardstrength.json`, `ladder-spec.js`,
`manzil-v6-conformance-24aug.md` — is in the **repo-root** `research/`, not the Build Plan one.
Only `manzil-engine-v6.js` lives in the Build Plan folder.

**Reading the numbers.** Every figure is the *player's* board win rate, so **lower means
harder**. A signature's "worth" is how many points it takes off the player when it is awake in
her hand versus asleep. 784 boards a cell, so **anything inside ±3.5 is indistinguishable from
zero.**

**Copy rule.** No em dashes in anything a player reads. Internal prose is unconstrained.

---

## Sequencing — you are on the critical path, start now

**The card set is the long pole.** Code's remaining work either does not touch the cards, or
has to wait for you, so nothing is gained by holding you back.

| phase | Design | Code |
|---|---|---|
| **1, now** | start the slate rewrite (§1-§4) | the tiebreak fix, two engine bugs, starter pack |
| **2** | slate continues | the deal, and the ladder *generator* |
| **3, sync** | slate lands | regenerate the ladder, port levels 3 and 4, calibrate together |

**Why Code goes first on phase 1 even though you are the long pole.** Their first item fixes a
bug where the engine picks between equally good moves by which card sits earliest in the hand.
Until it lands, **any measurement of a rewritten card carries about ±18 points of noise** — you
would be guessing whether your new Veil works. It is a prerequisite for your work being
measurable, not just for theirs. It is days, not weeks.

**Two one-line changes in your file, and they travel together.** Both are in
`Manzil - The Empty District.dc.html`, which you own and are about to be working in:

1. **Line 2571** — delete the inert `+ this._mlvl(this._tonight()) * 2` term. Levelling a card
   does not make its road harder; that addend measures as doing nothing at all.
2. **Line 2383** — the starter pack. Today it reads
   `cast.five.concat(pool.slice(0, 7))`, which is the chart five plus seven filler, **a pack of
   twelve**. It should be `pool.slice(0, 2)`, **a pack of seven**. The `7` already in that line
   is the filler count, not the pack size, so do not read "make it seven" as "already done."

Why seven: with a small pack you hold nearly the same cards every board, which is what made the
opening solvable. Twelve is too dilute and measures nine points below band.

**What is deliberately held until you are done.** The walkers' ladder and the level-3 and 4
calibration are both tuned against `research/cardstrength.json`, which ranks cards by measured
strength. **Eighteen signatures coming alive will rewrite that ranking**, so building those now
means building them twice. That is why they are phase 3 and why the campaign order in §8 is
marked provisional.

**What you can use to check your own work.** `research/sig28all.js` measures any signature the
same way §1 was measured. Run it on a rewritten card and you get a number in the same units,
comparable to the table. It takes about seven minutes for all 28.

## 0. The one thing that matters most

**Only 8 of your 28 signatures do anything.** Eighteen measure as zero and two make their
holder worse. Everything else in this document is smaller than that.

The engine work is done and the numbers land where you want them. What is left is whether the
cards are interesting, and that is entirely yours.

---

## 1. The full slate, measured

| card | worth | verdict |
|---|---|---|
| the listener | **+17.7** | works |
| the thread | **+12.2** | works |
| the turning | **+9.6** | works |
| the blaze | **+8.0** | works |
| the root | **+6.0** | works |
| the throne | **+5.9** | works |
| the gate | **+5.4** | works |
| the gathered stars | **+4.2** | works |
| the ghost | +2.8 | inert |
| the mane | +1.8 | inert |
| the follower | +0.8 | inert |
| the crown | +0.5 | inert |
| the flock | +0.4 | inert |
| the hand | 0.0 | inert |
| the jewel | 0.0 | inert |
| the heart | 0.0 | inert |
| the guide | 0.0 | inert |
| the storm | −0.4 | inert |
| the glance | −0.4 | inert |
| the drum | −0.8 | inert |
| the hideaway | −0.8 | inert |
| the claws | −0.9 | inert |
| the chamber | −0.9 | inert |
| the veil | −1.0 | inert |
| the bearer | −1.8 | inert |
| the void | −1.8 | inert |
| **the return** | **−4.5** | **hurts its holder** |
| **the empty district** | **−7.3** | **hurts its holder** |

## 2. The cheap fix does not work, and this saves you a wasted pass

The obvious theory is that the dead cards are too *narrow* — that they fire so rarely they
cannot move a number. **Tested and refuted:**

| | signatures that work |
|---|---|
| unconditional (fire whenever the card is in play) | 5 of 14 |
| conditional (home, first, young, adjacency, once a board) | 3 of 14 |

Roughly the same rate. And **nine unconditional signatures are dead** — the Jewel, the Claws,
the Void and the Empty District all fire every single time and still measure nothing or worse.

**So do not widen trigger conditions and expect it to help.** There is no single change that
repairs eighteen cards.

## 3. What to rebuild them out of

Five shapes are proven to work in this engine. Every replacement should be one of these, or a
variation on one, unless you have a reason to gamble:

| shape | the card that proves it | what it does |
|---|---|---|
| **strike what lands beside it** | the listener, +17.7 | reacts to the opponent's placement |
| **count differently** | the thread, +12.2 | changes how slots are scored |
| **turn a neighbour** | the turning, +9.6 | flips an adjacent card to its other face |
| **keep the ground** | the blaze, +8.0 | the slot stays yours even after the card flips |
| **take the lead** | the gate, +5.4 | seizes the opening move |

The listener is worth three times the gate, so **reactive beats static** in this engine. That
is the single most useful design fact in the table.

**Two rules that hold regardless:** signatures are additive, never agency-removing (a card
that says "you cannot" removes the opponent's line), and nothing should need a second numeric
progress bar to explain it.

## 4. The two that hurt their holder

**The Empty District, −7.3.** The worst card in the set, and it is unconditional, so it is not
a rarity problem. It needs a rewrite, not a tune.

**The Return, −4.5.** Its signature brings the card home instead of letting it flip. That
should be good, and it measures as a liability. Worth understanding before rewriting, because
the same mechanic is Genbu's level-3 grant and *there* it measures +4.7. The difference is
that the grant is bounded to once a board on its home ground; the card's own version is not.
**The bound may be what makes it work.**

## 5. The Chamber — keep the mechanic, move it

The Chamber makes whoever holds it play *worse*, and the reason is confirmed rather than
guessed: a greedy opponent's mistakes fall measurably when the Chamber is on the board. It
protects a card by **removing the opponent's tempting error**, so they stumble into a better
move.

Its win-rate cost is only −0.9 under current conditions, inside noise. The mechanic is real;
the magnitude is not, today.

**Decision taken: it never appears in a walker or sky hand.** It becomes a tool the player
aims at her. That is one line in `ladder-spec.js` and costs nothing.

## 6. Level 3 — the four quadrant grants

From `mansions-table.json`'s `fy_god` column, unmodified. Four contiguous blocks of seven.
Mansion 2 is blank in the table and belongs to Byakko by position; **that is a data gap worth
filling.**

| symbol | mansions | grant | reads as | worth |
|---|---|---|---|---|
| **Seiryuu** azure dragon | 14-20 | **the turn** — lodge it either way round | you know it by sight, so you can handle it either way | +7.5 |
| **Byakko** white tiger | 1-6, 28 | **the guard** — cannot be flipped by a tie, on or beside its own slot | the tiger holds its ground | +3.2 |
| **Suzaku** vermilion bird | 7-13 | **the lead** — it seizes the opening move | fire strikes first | +3.1 |
| **Genbu** black tortoise | 21-27 | **the return** — comes home instead of flipping, once a board on its own ground | the shell endures | +4.7 |

**Suzaku's original cascade was cut.** Every version with real power collapsed the skill gap
from 23 to 7.6, because a cascade rewards whoever swings hardest and a careless player swings
constantly. The lead replaces it.

**The rule that ties them together, and it is worth naming in the copy:** three of the four
only work on the card's own ground. *A mansion comes into its power at home.*

## 7. The Throne

The Throne's whole signature is that it is two-faced, and Seiryuu's grant is the turn. The
Throne is mansion 10, so it sits in **Suzaku** — 21 of 28 mansions never gain the turn and it
stays distinctive for most of the set. But seven Dragons eventually catch up.

**Recommended: it turns in place.** Once a board, after it has landed, you may flip it to its
other face. The Dragons choose at lodge time; the Throne can change its mind. It needs a new
kind of move in the engine, so it is a joint item with Code rather than a card rewrite.

**Also worth knowing:** the sky could never turn a two-faced card at all until today. That was
a bug in the shipped engine, now fixed, so the Throne in her hand is about to get better than
it has ever been. Re-check how it feels.

## 8. The campaign order

Mansions are **not** equally hard, and that is now the intended design. Sorted gentlest first,
which is the suggested order for a player to meet them:

> the mane, the jewel, the claws, the heart, the bearer, the chamber, the ghost, the turning …
> and hardest: the gate, the void, the throne, **the listener, the thread**

The two hardest roads are the two strongest cards. That is not a coincidence — every road puts
its own mansion in her hand. **Fixing the eighteen dead signatures will reshuffle this list**,
so treat the order as provisional until the slate settles.

## 9. Still open and still yours

- **The run structure**, and the phone layout with it. These are one job: a run is a vertical
  sequence of boards, and the current stage is a fixed landscape rectangle with no phone
  support at all. Untouched by any of this work and still the largest gameplay item.
- **What "familiar" hides.** If shedding the card's labels hides the *numbers* rather than the
  flavour text, that is a known failure mode and worth correcting whatever else changes.

## 10. Ownership

`Manzil - The Empty District.dc.html` is yours. Code's work order
(`HANDOFF-CODE-ENGINE-25AUG.md`) includes one deletion inside that file, at line 2571. **That
needs to happen in a cycle where you are not in the file**, or be handed to them explicitly.
