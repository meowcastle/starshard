# manzil-weakspots.md: the game as it currently ships

**21 August 2026.** A fresh look at Manzil in its current form, not at any proposal.
Engine: `research/manzil_sim_fix.py`, a port of `Manzil - Prototype.dc.html` as exported
20 Aug, with three fidelity corrections listed in §7. Fidelity check: careful play
measures 72.8 / 67.9 % on two seeds against Design's independent JS port at 74.9 %.
Roughly 500,000 boards across the run. Bands, unchanged: careful 55–65 %, casual 35–45 %,
flips 4+ per board. Raw data: `research/manzil-loop/probe-cards.json`,
`probe-dynamics.json`, `probe-ladder.json`.

Two things first, because they frame everything else. **The density pass worked**: flips
are 3.7–4.0 a board against 1.5 in July, turn four stopped being arbitrary tidy-up (its
value spread nearly tripled), and the Same rule cut first-move advantage in mirror play
from 78 % to 59 %, which is the single largest improvement anyone has made to this game
and nobody has claimed credit for it. **And the pool got healthier**: top-to-bottom card
spread fell from 14× to about 2.5×, and a hand of sevens went from 0 % to 40 %.

What follows is what is still wrong.

---

## 1. The opening is solved, and it is a one-move lookup · **severity: critical**

Forcing each of the 54 possible first moves and then playing the remaining eight lodges
normally, 224 boards per opening, two seeds:

| opening | board win %, leading |
|---|---|
| **The Throne at slot 8** | **100.0** |
| **The Crown at slot 8** | **100.0** |
| The Throne at slot 6 | 96.4 |
| the shipped heuristic's own pick (Blaze at 6) | 75.4 |
| The Heart at slot 8 | 0.0 |

Two openings win **every board on every one of the 28 nights, on both seeds**. This is not
a strong line, it is a solved one: the sky is deterministic, so the first move of every
board has a posted answer, and the answer does not even depend on which mansion tonight is.

The cheapest fix is the one already half-built. `_skyMove` breaks evaluation ties with an
FNV date-seed, which keeps the night identical for everyone while varying it across
nights. It currently only fires when her *top-rated* moves tie exactly. Widening it to
choose among moves within a small epsilon of the top would break the lookup without
touching the ruleset, without making her weaker, and without introducing anything a player
would experience as randomness.

## 2. The walkers' ladder is no longer a ladder · **severity: high**

The ladder was calibrated on 19 August, before the density pass. Re-measured now, 224
boards a rung:

| rung | careful now | careful, 19 Aug | casual now |
|---|---|---|---|
| 1 imra | 100.0 | 89 | 92.4 |
| 2 sef | 98.7 | 53 | 72.8 |
| 3 odel | 91.5 | 81 | 54.0 |
| 4 brann | 95.5 | 32 | 59.4 |
| 5 the quiet one | 95.1 | 58 | 79.9 |
| the hardened sky | **58.9** | 54 | 35.3 |

A careful player now wins **91–100 % of every rung**. The ramp is gone, and the reason is
structural rather than a tuning slip: walkers hold loaner-grade cards with **no signatures
at all**, while the player holds five signature cards, and signatures are now worth +6 to
+11 points each. The five rungs are a three-minute formality before the only real board.

The boss, meanwhile, is the healthiest number in this document: **58.9 % careful, 35.3 %
casual**, both inside band. The ladder is the broken half, not the sky.

The cheap fix: give the walkers signatures. They are other players' hands, and other
players own cards with woken signatures, so this is more lore-true than the current
state, not less.

## 3. Two shipped signatures have the wrong sign · **severity: high, cost to fix: low**

Paired ablation, 120 random hands containing the card, 56 boards each, ability on versus
off under identical RNG:

| signature | delta | ±2 SE |
|---|---|---|
| blaze, keeps its ground | **+10.7** | 1.9 |
| storm, cannot be tied | **+10.5** | 1.9 |
| heart, fights +1 behind | +8.0 | 1.6 |
| throne, chooses its faces | +6.0 | 1.7 |
| crown, counts two on edges | **−1.4** | 1.2 |
| jewel, cannot be softened | **−2.3** | 0.6 |
| hideaway, silences its mansion | **−4.2** | 1.2 |

Three of the seven live signatures make the card **worse**, and Jewel's result is nearly
four standard errors from zero. The mechanisms are legible once measured. Crown's +1 edge
weight goes to *whoever holds the slot*, so it doubles the loss when the sky takes your
edge, and a 6|6 body cannot hold an edge against Saturn or Mars. Jewel's only effect is
Venus-immunity, and an unsoftened 7|7 is a better prize for the sky once she takes it.
Hideaway silences a slot you were mostly going to win: it costs −7.3 on strong hands and
−1.0 on weak ones.

This is the same law Design derived in Addendum 7 about the −1 family, arriving from
another direction: **after the tie pass, any move that changes the arithmetic is spending
something**, and three of these spend more than they buy.

## 4. Careful play is ten points past the band, and a quarter of it is the tie rule · **severity: high**

Careful sits at 67.9–72.8 % against a 55–65 % target. Two known causes are already
documented and neither is fixed in the shipped build: the Storm's defensive tie-immunity
(Addendum 7 measured 74.9 %, the head-to-head 72.1 %, and Addendum 8 recommended replacing
it) and the tie rule at the count. **24.8 % of careful boards end in a tied count**, and
every one is awarded to the player. That was the right call when ties were dead, and it is
now paying the player twice for the same fact. It is also invisible as a skill outcome:
you drew, and were handed the win.

Worth noting the asymmetry: **casual play is now inside band** at 39–44 %. The problem is
one-sided.

## 5. The first half of a board carries no information · **severity: medium**

Tracking the running count differential turn by turn, careful play:

| after turn | eventual winner already ahead | board dead level |
|---|---|---|
| 1 | 56.2 % | 0 % |
| 2 | 60.2 % | **52.5 %** |
| 3 | **55.9 %** | 15.1 % |
| 5 | 63.4 % | 13.5 % |
| 7 | **86.1 %** | 14.1 % |

After three of the nine lodges the count predicts the winner **55.9 %** of the time, a coin
flip, and over half of boards are dead level after two. The honest break is turn seven, and
34 % of boards change leader after it. The earlier worry was a game decided by turn three;
the shipped reality is the inverse, and it carries its own risk: four of the nine turns
feel free, which reads as "nothing I did mattered until the end". Turn one still offers 51
legal moves with a **4 %** unique-best rate.

## 6. The deck screen still has one right answer · **severity: medium**

Under 1 % of 1,250 sampled hands land inside the 55–65 % band; the median hand wins 14 %.
The shipped chart five wins 72–74 % and holds five of the six signature cards; the same
five stripped of signatures wins 4.7 %. Hand win rate correlates with signature count as
strongly as with total face value.

The good news is real and should not be lost: the *numbers* problem is fixed. Storm 8|5 is
now the worst card in the pool on numbers alone and the 7|7s are the best, so "bring the 8s
and 9s" is dead. But the spread simply moved onto the signature axis, and 21 of 28 cards
still have no signature. That is the same shape of problem with a different label, and the
answer is the one already on the Signature Pass sheet: give the remaining cards signatures,
now scored against the law in §3.

## 7. Three port-fidelity notes, and one live-code smell

Corrections made to the Python engine during this run, all verified against
`proto_cur.js`: Crown ships at **level 1** in the chart five (ability asleep), the prior
port had it awake; **Hideaway was missing entirely** from the port, so every previous
"all signatures" measurement in this repo was really a six-signature measurement; and an
L1 Storm claimed ties in the port where the shipped code gates on level 2.

One thing in the shipped JS worth a look rather than a fix: `_tryFlip`'s local `storm`
variable is dead code while the Same rule is on, because ties flip for everyone. It becomes
live the moment anyone toggles Same off, which is exactly the lever under test.

Also confirmed, as reassurance: **Combo does not run away.** Five-or-more flips from one
lodge happens once in 500 careful lodges, the observed maximum is five (seven in a 1.2M
state search), and a chain can never reverse the same slot twice, which is structurally
impossible because `try_flip` rejects same-owner targets. The 40-step safety cap never
binds.

---

## Low-hanging fruit, ranked by effect over cost

1. **Widen the seeded tiebreak to an epsilon band** (§1). No ruleset change, no new
   vocabulary, kills the solved opening, keeps the night identical for everyone.
2. **Give the walkers signatures** (§2). Data already exists; it restores the ramp and is
   more lore-true than loaner-grade hands.
3. **Rework Crown, Jewel and Hideaway** (§3). Three cards, all measured, all currently
   worse than having no signature at all.
4. **Take Addendum 8's Storm call** (§4). Replace the defensive immunity with "strikes at
   +1"; measured at 62.3 careful and 41.7 casual, both in band.
5. **Reconsider the tied count** (§4) once the Storm is fixed, because the two interact and
   should be measured together rather than in sequence.
6. **Then the 21 signature-less cards** (§6), scored against the §3 law.

Nothing here requires a new mechanic. Five of the six are edits to things that already
exist.

---

# Addendum: what actually fixes the opening and the ladder

**21 August, later.** §1 and §2 named two problems and guessed at two fixes. Both guesses
were tested. **One was wrong and the other was half right.** Engines:
`research/manzil_sim_eps.py` (epsilon tiebreak), `manzil_sim_vary.py` (her hand varies),
`manzil_sim_ladder.py` (walkers can carry signatures). Data in `research/manzil-loop/`.

## A. The opening cannot be fixed by tuning the sky

§1 recommended widening her seeded tiebreak to an epsilon band. **It does not work.** Every
lever was tried against three forced openings, 224 boards each:

| what was changed | Throne@8 | Crown@8 | careful | casual |
|---|---|---|---|---|
| nothing (shipped) | 100.0 | 100.0 | 72.6 | 42.3 |
| epsilon 2 on every move | 100.0 | 100.0 | 69.9 | 40.2 |
| epsilon 5 on every move | 82.6 | 86.2 | 61.9 | **29.2** |
| epsilon 5, her first three lodges only | 81.7 | 84.8 | 66.1 | 33.0 |
| epsilon 10 on every move | 78.1 | 86.2 | 59.2 | **27.4** |
| boss lookahead (reply weight 12) | 75.0 | 89.3 | 74.1 | 28.9 |
| the road wrapped, no edges | 96.4 | 94.2 | — | — |
| her five drawn from eight planets by night | **100.0** | 85.3 | 69.0 | 48.5 |
| her planet homes drifting nightly | **100.0** | **100.0** | 75.0 | 44.9 |

Nothing takes the best opening below about 75 %, and everything that dents it costs the
casual player 10 to 15 points, because a sky who plays a slightly worse move is a sky who
punishes a greedy player less. The last row matters most: the sim pins her planet homes
where the shipped game reads them from the real ephemeris, so **the obvious hope that live
nightly drift already breaks this is false.** It was checked precisely because the sim
could have been flattering the exploit. It was not.

**The mechanism is not what §1 assumed.** Throne at slot 8 exposes a **6**, its weak face,
and wins every board; Heart at slot 8 exposes a **7** and wins none. It is not a safe move
or a strong face. Against a deterministic opponent each of the 54 openings is a *fully
determined game*, and their outcomes are bimodal: three are certain wins, several are
certain losses, and which is which cannot be reasoned about from the board.

So this is not a balance bug to tune. It is the price of a deterministic sky, and there are
only two honest responses.

**Accept it and change what is claimed.** MANZIL-LOOP §2 already argues the deterministic
daily puzzle is a strength: FreeCell, Into the Breach, Trackmania. But the property those
games have is that **the answer is different every day.** Here the same opening wins on all
28 nights. A puzzle whose solution never changes is a lookup, and it is the one form of
this the research warned against.

**Or make her choice genuinely unpredictable per night** — not a jitter on her evaluation,
which is what epsilon does and what costs the casual player, but variation in something
upstream that she then plays well: which planets she holds, how many, where they stand,
which rule the night carries. The night-rule idea from MANZIL-LOOP §9, the 28 authored
skies, is the only proposal on the table that does this, and it is the only one that would
work. **That reframes the 28 mansion rules from flavour into the load-bearing fix.**

## B. The ladder: the hands were built for the old meta

§2 guessed the walkers were weak because they have no signatures. Signatures were tried and
they are not the lever:

| walkers get | r1 | r2 | r3 | r4 | r5 |
|---|---|---|---|---|---|
| shipped (no signatures) | 100.0 | 98.7 | 91.5 | 95.5 | 95.1 |
| 1 to 5 signatures at L2 | 100.0 | 100.0 | 95.1 | 88.8 | 95.1 |
| 1 to 5 signatures at L3 | 100.0 | 76.3 | 97.3 | 67.0 | 96.0 |
| walker leads every rung, reply 8 to 12 | 98.7 | 98.7 | 43.8 | 83.9 | 96.0 |

Erratic, never a ramp. The real cause is in the hands. **The five walker hands were dealt
before the density pass, to the old meta where 8s and 9s ruled.** Rung 1 (imra) is five
sixes, which the card probe now measures as an unwinnable hand at 0.4 %. Rung 5 is Storm,
Veil, Heart, Empty District, Void, which is almost exactly the 19 August best hand and is
now mid-pack.

Rebuilding the five hands from the current ranking, weakest to strongest, with no other
change:

| rung | hand | careful | casual |
|---|---|---|---|
| 1 the newcomer | Glance, Gate, Guide, Mane, Empty District | 100.0 | 86.2 |
| 2 second night | Claws, Veil, Drum, Crown, Flock | 94.2 | 68.8 |
| 3 half a road | Ghost, Turning, Chamber, Bearer, Hideaway | 99.1 | 73.2 |
| 4 most of a road | Thread, Root, Return, Listener, Hand | 100.0 | 76.8 |
| 5 the quiet one | Gathered Stars, Jewel, Throne, Void, Follower | **76.8** | **26.3** |
| the sky | her five planets, reply 12, she leads | 58.9 | 35.3 |

**For the casual player that is a real ladder for the first time**: 86 % on the first rung
falling to 26 % on the last, then the sky at 35 %. For a careful player it is not, and no
configuration tested made it one. Careful play beats every walker arrangement at 77 to
100 %, because a walker holds mansion cards and the same greedy judgment, while the sky is
competitive only through numerically strong planets *and* five signatures. Walkers cannot
have both without becoming the sky.

**Which is probably correct, and worth saying out loud.** The decision sheet's own rule is
that the ladder is "an introduction, never a toll". Its job is to let a casual player win
something before meeting the wall, and rebuilt hands do exactly that. A careful player
clearing five rungs in three minutes is not a failure of the ladder; it is a player who
should be at the boss. The open flag already on the Walkers' Road sheet, **the
skill-shortened ladder**, is the right answer to that half: clear a rung without dropping a
board and skip the next.

## Revised low-hanging fruit

1. **Rebuild the five walker hands** to the current card ranking. One data change, no code,
   restores the ramp for the players the ladder exists for.
2. **Ship the skill-shortened ladder** already flagged on the sheet, so careful players are
   not made to walk a formality.
3. **Rework Crown, Jewel and Hideaway** (§3, unchanged). Still the cheapest real balance win.
4. **Take Addendum 8's Storm call** (§4, unchanged).
5. **Promote the 28 authored night rules from flavour to fix** (§A). This is the only
   mechanism identified that breaks the solved opening without weakening her. It is a much
   larger piece of work than anything else on this list and it should be scoped as such.
6. **Do not widen the epsilon tiebreak.** §1's recommendation is withdrawn on the evidence.
