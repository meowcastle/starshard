# Manzil — the twenty-eight mansions

**Card specification, 27 August 2026. For Design.** Pasted from Code's sheet, verbatim; this file is
the copy of record in the project. Measured on `research/v2.js`, 52 vectors green, 896 boards a cell,
two seeds. Nine stations, no tie cascade, awake-first shuffle.

> **AMENDED 27 August 2026 by the measured run** ("shipped: the new ladder, the raised ceiling, the
> balanced deck"). All three changes are built and live, and the run amended two of my own numbers:
> **level 3's number branch is +1, not +2** (at +2 the points compound with the grant the card already
> carries and beat almost every signature: 15 of 28 live, against 21 at +1), so the budget is **+4**
> across the two faces (2, 1, 1) and the highest reachable face is **13**, not 14.
>
> **The "blowouts near 50%" flag is withdrawn.** It was a property of an older harness (eleven
> stations, twelve drawn and seven kept, tie cascade live) and was never a fact about this game. On
> the current harness the worst cell is 24% and most sit between 2% and 9%.
>
> Faces below are the balanced set, with the bearer, the storm, the hand and the veil **mirrored** to
> level the deck's left/right totals at 179/179. Signatures, verbs and moments are unchanged.

| | |
|---|---|
| live choice at level 2 | **22 of 28** |
| live choice at level 3 | **21 of 28** |
| blowouts, old order → new | **24% → 2%** |
| close games, old order → new | **38% → 69%** |
| skill gap, every rung with an ability | **23 to 24** |
| skill gap, the all-numbers path | **6.7** |
| left/right deck totals | **179 / 179** (was 189 / 169) |
| side bias, bump-left vs bump-right | **+1.0** (was +8.3) |

---

## 1. How a card levels

A card levels only by beating its own mansion, on a night the moon stands in it. One mansion a night,
so the ladder cannot be rushed.

| level | what the player gets |
|---|---|
| **1** | The two faces and nothing else. A card fights with the face pointing at what it is fighting. Bigger takes it, equal takes it too. |
| **2** | **Choose:** +2 to **one face, the player picks which** — or — this card's **quadrant grant**. |
| **3** | **Choose:** +1 to **one face** — or — this card's **signature**. |
| **4** | **+1 to one face**, the player picks which, plus the full artwork, its animation, a respec, and **presetting**. |

**The number branch is points on ONE face**, concentrated rather than spread, so every level-up is a
positional decision: a lopsided card wants to stand somewhere specific on the road. Which face to
raise is worth **2.8 points** on average at level 2, three or more on ten cards, and the direction
genuinely varies — the throne wants its left raised by 6.5 points, and so do the listener, the storm,
the void and the chamber, while most of the rest want the right.

**Two at the second door, one at the third.** I proposed +2 at both. Measured, +2 at the third door
leaves only 15 of 28 cards with a real choice against 21 at +1, because by then the card already
carries its quadrant grant and a second pair of points compounds with it past almost every signature
— Suzaku worst of all, since reach plus a big face strikes two stations with that big face.

**The grant comes before the signature**, and the reason turned out to be bigger than teaching order.
Moving it to the second door took blowouts from **24% of boards to 2%** and close games from **38% to
69%**, with the skill gap unchanged. Signatures early make swingy boards; grants early make tight
ones. That is the best result this project has produced, and the early game is where it lands.

**The number budget.** A fully levelled card carries **+4 across its two faces**: +2, +1, +1, spread
however the player likes. Poured into one side, a base 9 reaches **13**.

**The all-numbers path has a skill gap of 6.7**, against 23 to 24 for every path that includes an
ability. Taking points at every door is a legitimate choice and a much shallower game — and it is why
the numbers must never be the *correct* choice on many cards.

**Presetting.** A level-4 card may be locked into every hand. **Maximum two cards locked at once**,
each taking one of the seven slots. Every later win over that mansion grants another respec.

## 2. Where a player starts

| level | which cards |
|---|---|
| **3** | the **sun's mansion** — two doors open: grant and signature, or numbers instead of either |
| **2** | the **five planets' mansions** — one door open |
| **1** | the other **twenty-two** — numbers only |

**The hand:** seven shuffled from all twenty-eight, not chosen. **The mulligan:** one look. Six.
**The board:** nine stations, one card lodged per turn, then the count.

## 3. The four grants

| quadrant | mansions | the grant | at L2 | at L3 |
|---|---|---|---|---|
| **Byakko**, the tiger | 1-6, 28 | **The ground holds.** This card cannot be taken. | +2.4 | +0.4 |
| **Suzaku**, the bird | 7-13 | **Your strikes carry two stations**, not one. | **+4.2** | **−3.1** |
| **Seiryuu**, the dragon | 14-20 | **It may be lodged either way round.** | **−3.4** | +3.6 |
| **Genbu**, the tortoise | 21-27 | **The empty shell.** Once she takes this station, it counts for nobody. | +0.8 | −0.9 |

**Suzaku and Seiryuu are inverses, and that is the one thing the new order made worse.** Suzaku's
grant is reach, worth more than any of its own signatures, so four of its seven cards go to numbers at
level 3. Seiryuu's grant is weak alone but its signatures are the strongest in the deck, so a dragon
player takes points early and the move late — a coherent identity rather than a fault, though −3.4 at
level 2 is out of band.

## 4. The twenty-eight

**L2** is how much the **grant** beats +2 on the card's better face. **L3** is how much the
**signature** beats +1, with the grant already taken. Near zero is a live choice; a positive number
means the ability wins, a negative one means the points do. **side** is what choosing the right face
is worth, and **better** names it. ◆ marks a card that reaches outside its quadrant's two permutations.

### Byakko, the white tiger
*west · autumn · metal · deny a fight & lower a number*

| # | card | faces | signature (level 3) | does | fires | L2 | L3 | side | better |
|---|---|---|---|---|---|---|---|---|---|
| 1 | the gate | 6/6 | The first strike against it does not land. | deny a fight | on being struck | **+4.7** | −2.9 | 4.5 | right |
| 2 | the bearer | **5/6** | Anything striking a card beside it fights two lower. | lower a number | always | +2.7 | +3.0 | 2.6 | right |
| 3 | the gathered stars | 7/7 | Cannot be taken while a card beside it is yours. | deny a fight | always | +1.2 | −1.7 | 3.1 | right |
| 4 | the follower ◆ | 8/7 | When a card beside it is taken, it strikes back. | add a fight | on being struck | **−3.9** | **+4.7** | 7.0 | right |
| 5 | the blaze | 6/6 | Marks one enemy card beside it two lower, for good. | lower a number | on lodge | **+5.1** | +0.9 | 0.9 | right |
| 6 | the storm | **6/8** | No tie takes it. | deny a fight | on being struck | +2.5 | −1.8 | 2.1 | left |
| 28 | the thread | 6/6 | Everything standing beside it fights one lower, both sides. | lower a number | always | **+4.6** | +0.7 | 1.9 | right |

### Suzaku, the vermilion bird
*south · summer · fire · add a fight & raise a number*

| # | card | faces | signature (level 3) | does | fires | L2 | L3 | side | better |
|---|---|---|---|---|---|---|---|---|---|
| 7 | the return | 7/7 | If it took nothing on the way in, it strikes again a turn later. | add a fight | on lodge | **+7.7** | **+3.8** | 1.5 | right |
| 8 | the ghost ◆ | 7/6 | Take the ghost and you trade places with it: the striker changes hands too. | change the owner | on being struck | +3.0 | −1.7 | 3.2 | right |
| 9 | the glance | 5/6 | It watches the station opposite it across the road and strikes there, as it lands and whenever anything lands there. | add a fight | on lodge, always | +0.7 | **−5.9** | 2.7 | right |
| 10 | the throne | 7/9 | Whatever it takes fights one higher afterwards. | raise a number | on claim | **+6.0** | −1.3 | 6.5 | left |
| 11 | the mane | 6/6 | Cards you hold beside it fight one higher. | raise a number | always | **+5.7** | **−5.4** | 2.7 | right |
| 12 | the turning | 7/6 | What it takes strikes onward the same way. | add a fight | on claim | **+5.1** | **−5.8** | 1.0 | right |
| 13 | the hand | **5/7** | What you lodge beside it lands one higher, for good. | raise a number | on lodge | +1.5 | **−5.5** | 5.7 | right |

### Seiryuu, the azure dragon
*east · spring · growth · turn a card & move a card*

| # | card | faces | signature (level 3) | does | fires | L2 | L3 | side | better |
|---|---|---|---|---|---|---|---|---|---|
| 14 | the jewel | 9/5 | It turns to meet whatever lands beside it with its stronger face. | turn a card | always | +2.8 | **+5.5** | 1.8 | right |
| 15 | the veil | **3/8** | The first card that lands beside it is turned around. | turn a card | on lodge | +0.1 | **−4.0** | 2.7 | right |
| 16 | the claws | 7/6 | Any card of hers that lands beside them is shoved along one station. | move a card | always | **−4.7** | **+9.5** | 2.7 | right |
| 17 | the crown ◆ | 7/6 | What it takes cannot be taken back. | deny a fight | on claim | **−5.2** | +0.1 | 2.1 | right |
| 18 | the heart ◆ | 8/7 | When the road fills, it strikes both its neighbours once more. | add a fight | at the count | **−4.6** | −1.8 | 3.8 | right |
| 19 | the root | 7/7 | Both cards beside it turn around as it lands. | turn a card | on lodge | **−7.9** | −0.6 | 1.8 | right |
| 20 | the flock | 7/6 | It and one card beside it trade places. | move a card | on lodge | **−4.0** | **+16.7** | 1.3 | right |

### Genbu, the black tortoise
*north · winter · water · change the worth & change the owner*

| # | card | faces | signature (level 3) | does | fires | L2 | L3 | side | better |
|---|---|---|---|---|---|---|---|---|---|
| 21 | the empty district | 3/8 | Counts two, and silences the enemy cards standing beside it. | change the worth | at the count | +2.2 | +2.3 | 3.7 | right |
| 22 | the listener | 7/5 | Counts one more for every card standing beside it. | change the worth | at the count | +0.3 | **+3.9** | 3.5 | left |
| 23 | the drum | 5/7 | The station on its right counts for the drum's side. | change the owner | at the count | −1.5 | −1.5 | 3.3 | right |
| 24 | the void | 9/3 | Counts two, and the station on its right counts one less. | change the worth | at the count | +1.6 | **+4.1** | 0.8 | left |
| 25 | the hideaway | 6/6 | Counts nothing itself; both stations beside it count one more. | change the worth | at the count | +1.8 | **−8.9** | 2.2 | right |
| 26 | the chamber | 7/6 | Counts two while it has never been taken, and four if it is still untouched when the road fills. | change the worth | at the count | +0.3 | −0.7 | 0.7 | left |
| 27 | the guide | 6/6 | Your cards standing on their own mansion count one more. | change the worth | at the count | +0.6 | **−5.7** | 2.1 | right |

**Level 2: 8 grant wins · 14 a real choice · 6 numbers win.**
**Level 3: 8 signature wins · 13 a real choice · 7 numbers win.**

## 5. Wiring notes

**Seven things a card can do:** change a number · turn a card · add a fight · deny a fight · move a
card · change what a station is worth · change whose a station is. **Six moments:** on lodge · on
claim · on being struck · at the count · always · on tap. Every signature and grant is one
permutation and one trigger.

**FLAG — Suzaku's signatures lose to its own grant.** Four of its seven cards go to numbers at level 3
(the mane −5.4, the turning −5.8, the hand −5.5, the glance −5.9) because reach compounds with a
raised face. This is the largest remaining problem on the sheet, and it is one quadrant, not four
cards: either the signatures get stronger, or reach stops compounding with the number branch.

**FLAG — Seiryuu's grant sits at −3.4 at level 2.** Either accept that Seiryuu is the
numbers-then-signature quadrant, or give the dragon something with more standalone value.

**FLAG — two cards left outside the band:** the hideaway at −8.9 and the root at −7.9.

**FLAG — Seiryuu carries two cards outside its permutations.** The crown denies a fight and the heart
adds one. Either retheme the crown as a turn, or widen the rule to two. Decide before the art brief.

**The blowout flag is withdrawn** — see the banner. It measured 24% at worst and 2–9% typically, and
the old "near 50%" came from a harness this game no longer uses.

## 6. Two rules the whole design rests on

Depth goes in the faces and the fights, where the player can see it. The count stays simple.

A mansion's rule changes the geometry, never the arithmetic.

---

## Where the live build stands against this sheet (27 Aug 2026, re-checked at end of day)

Checked line by line against `Manzil - Game Prototype V1.dc.html`.

**Everything in this sheet is now applied, including the engine update and its amendments.** The
ladder (§1: grant at the second door against +2, signature at the third against +1, one last point at
the fourth), the starting levels (§2), the hand of seven, the one-look mulligan (7 then 6), presetting capped at two,
the respec, all four grants in §3 (passive, no taps), **the faces of all 28 including the four
mirrored**, and **the signatures of all 28** — the slate is wired in `_lodge` / `_resolve` / `_slotW` /
`_faceOf`, and the cards screen reads quadrant, level, faces and signature off the card data.

The face cap is gone from card construction (the floor of 1 stays in `_faceOf`). A card's two number
increments are stored per side (`aS` / `bS` / `c` in `manzil-v2-build`), and the level-up doors on the
card's own page ask **which face** with two buttons rather than one, so a door is never left half
open. Saved builds from the old order are migrated once (`manzil-v2-buildv: 2`): signature and grant
swap doors, and number picks are **dropped so the door reopens**, because the choice a player made no
longer exists as they made it.

The earlier reading of this section ("does not match: the faces / the signatures") was written
mid-pass and is superseded. One artefact of that pass was caught and fixed at the same time: the
sheet's faces were copied into the build's `pool` while the 22 Aug re-baseline (+1 on the lower
side) was still being applied on top, so every card fought a point above the measured slate. The
bump is removed — **the pool now holds the sheet's numbers and nothing is added to them.** Any
measurement taken against the build between the faces landing and this fix is a point high.

**Open, for design:** Suzaku's signatures against its own grant (the largest item), Seiryuu's grant at
level 2, the hideaway and the root, the seiryuu permutation outlier, and the throne's turn-in-place,
which survives in the build from the old slate and has no home on this one. **Answered 27 Aug 2026:**
the mansion's own cards play at **the player's level for that mansion**, doors and all, so the mirror‑
match numbers hold and the ninth step does not soften as the player climbs.
