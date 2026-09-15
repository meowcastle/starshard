# The nine laws: seven plains, nine first cards, seven second cards, and one bug that touched every bird row on the calendar

**13 September 2026. For Design (cc Code).** The whole batch, on the windows Design named, with
the amended pre-sheet reads (deep seat both windows, door split both windows) for every night.
896 boards a cell, two seeds, walker boards. 159 vectors in the station-law suite. Every row in
this memo is on the engine **after** the fix described first, and every plain was re-cut on it.

---

## 0. The phantom strike: a reference bug, found by 7a, fixed, sized

The return's signature queues a delayed strike (`g.pending`). The search runs on shallow copies of
the game that share that array, so **every hypothetical return-lodge the search tried left a real
entry behind**, and two moves later a real strike fired from whatever card stood there. Measuring
7a's far-strike rate showed 128 fires a board. Fixed: the queue is written on real placements
only, and `playBoard` now re-runs the chosen move for real, always.

**Size.** Re-cutting two plains on the fixed engine: seat and skill move within 2 points (noise),
but the deep fixed-hand **bird cell moves −10.2 on m9 and −3.7 on m3's road**, because the return
is a bird card and the phantom strikes were its strikes. So:

- Seat, skill, spread-shape verdicts on the scorecard are safe.
- **Every deep quadrant row's bird column since the return's signature was written is inflated,
  by up to about ten**, and spreads that had the bird on top are up to that much too wide.
- **A full re-baseline of the fifteen shipped laws is now the first item of the loop bookmark**:
  thirty runs, one evening. I have not done it here; this batch was the priority.

Nothing in the client is affected; the bug was mine.

## 1. The plains, both windows

Design's lookup predicted each window from a road already measured, and the lookup was right in
shape every time; the numbers below are the re-cut ones. **Door split is the fresh row, quarter
shares of the first door card (par 25).**

| night | window | seat f/d | skill f/d | bya · suz · sei · gen | spread | door: bya/suz/sei/gen | leader |
|---|---|---|---|---|---|---|---|
| **m7** | door-first m7..m15 | +9.0/**+13.3** | **+17.6**/+24.7 | 38.7 · 47.4 · 52.2 · 34.6 | 17.6 | 36/22/14/28 | 72% |
| | slid m3..m11 | +4.5/**+26.6** | +9.3/+24.4 | 58.6 · 44.5 · 41.6 · 47.8 | 17.0 | **47**/12/14/28 | 73% |
| **m8** | door-first m8..m16 | **+11.5**/+15.5 | +12.5/+31.5 | 37.2 · 46.4 · **64.5** · 36.6 | 27.9 | 18/33/24/25 | 69% |
| | slid m4..m12 | +4.4/+28.0 | +8.6/+27.0 | **77.3** · 51.8 · 47.7 · 30.2 | 47.1 | 38/22/22/18 | 75% |
| **m11** | door-first m11..m19 | +7.3/+18.8 | +8.9/+29.1 | 32.8 · 34.3 · 55.9 · 33.3 | 23.1 | 36/23/14/27 | 73% |
| | slid m7..m15 | +9.0/+13.3 | +17.6/+24.7 | 38.7 · 47.4 · 52.2 · 34.6 | 17.6 | 36/22/14/28 | 72% |
| **m13** | standard m13..m21 | +3.0/+16.1 | +12.5/+26.3 | 35.6 · 33.4 · 48.3 · **22.5** | 25.8 | 18/31/21/30 | 70% |
| | slid = m9's road | +2.2/+19.2 | **+19.3**/+27.6 | 36.9 · 43.3 · 51.2 · 29.8 | 21.4 | 24/38/21/17 | 72% |
| **m14** | door-first m14..m22 | +7.9/+15.6 | +12.3/+24.4 | 37.7 · 29.8 · **70.9** · 33.7 | **41.1** | 28/14/34/24 | 72% |
| | slid m10..m18 | +5.2/+16.5 | +8.1/+30.7 | 23.8 · 37.8 · 68.1 · 35.6 | 44.3 | 22/31/12/34 | 71% |
| **m16** | door-first m16..m24 | +3.5/+16.9 | +5.5/+26.7 | 37.7 · 44.8 · 55.1 · 32.7 | 22.4 | 21/26/34/18 | 68% |
| | slid m12..m20 | +4.4/+21.2 | +2.0/+27.8 | 40.7 · 35.3 · 53.3 · 46.1 | 18.0 | 30/26/15/28 | 70% |
| **m17** | door-first m17..m25 | +3.5/**+8.7** | +8.3/+21.8 | 42.7 · 48.3 · 54.7 · 32.1 | 22.6 | 18/27/42/13 | 73% |
| | slid = m13's road | +3.0/+16.1 | +12.5/+26.3 | 35.6 · 33.4 · 48.3 · 22.5 | 25.8 | 18/31/21/30 | 70% |
| **m20** | door-first m20..m28 | +4.0/+15.6 | +3.2/+22.2 | **67.0** · 26.0 · 29.7 · 54.4 | **41.0** | 25/35/28/12 | 68% |
| | **slid m16..m24** | +3.5/+16.9 | +5.5/+26.7 | 37.7 · 44.8 · 55.1 · 32.7 | **22.4** | 21/26/34/18 | 68% |
| **m22** | door-first m22..m2 | **+13.8/+24.7** | +6.0/+21.1 | 60.5 · 24.6 · 35.4 · 53.2 | 35.9 | 26/15/22/37 | 71% |
| | **slid m18..m26** | **−2.0/+12.8** | +11.5/+26.5 | 52.6 · 36.9 · 51.0 · 27.9 | 24.7 | 20/29/38/14 | 71% |

**Two window calls to revisit.** m7: Design chose slid, but slid has deep seat **26.6** (over the
absolute flag) against door-first's 13.3, and door-first carries a fresh skill gap of 17.6, the
calendar's second best after m9. Door-first is the better road on the two columns the pre-sheet
rule exists to read; the slide only helps fresh seat (9.0 → 4.5). m8: door-first is right, and the
lookup's 35.0 was optimistic; the dragon owns it at 64.5 (the bird column having lost its phantom
strikes). m20 and m22: the slides do exactly what the lookup said, −18.6 and the seat cure.

## 2. The first cards

| id | night | window | seat f/d | skill f/d | spread | shape | verdict |
|---|---|---|---|---|---|---|---|
| 7a the second strike | m7 | slid | −0.7 / 0.0 | −0.6 / +0.2 | 17.0 → 18.6 +1.6 | flat | pass, **inert** |
| 8a the haunted station | m8 | door-first | +5.8 / +0.3 | +5.5 / −0.6 | 27.9 → 44.1 **+16.2** | WIDENS | **FAIL** |
| 11b the two ribs | m11 | door-first | +3.9 / **−7.4** | +2.3 / −3.2 | 23.1 → 24.1 +1.0 | flat | pass, small |
| 13a the steady hand | m13 | standard | **−13.9 / −10.7** | +1.8 / −1.1 | 25.8 → 35.5 **+9.7** | WIDENS | **FAIL** (seat, spread) |
| 14a the unarmed | m14 | door-first | **−9.6** / +1.0 | −4.3 / +2.1 | 41.1 → 36.8 −4.3 | narrows, one-sided | **FAIL** (seat, by 1.6) |
| 14b the bright face | m14 | door-first | −1.4 / −2.9 | −1.4 / −4.1 | 41.1 → 32.4 **−8.7** | narrows, one-sided | **pass** |
| 16b the scales | m16 | door-first | **−17.1 / −17.9** | −0.7 / −6.2 | 22.4 → 20.4 −2.0 | flat | **FAIL** (seat), see below |
| 17a the crown holds | m17 | door-first | −0.7 / −1.0 | −0.3 / +4.0 | 22.6 → 26.1 +3.5 | flat | **pass** |
| 20b the slide alone | m20 | slid | plain: +3.5/+16.9 | +5.5/+26.7 | 41.0 → 22.4 **−18.6** | | **ships** |
| 22b the release | m22 | slid | +6.1 / **+11.2** | −1.2 / +1.3 | 24.7 → 11.8 **−12.9** | NARROWS | **FAIL** (deep seat, by 3.2) |

**The far-strike row on 7a**, real placements: armed 0.29 a board, fires 0.16 (the lodger has to
still hold the card two moves on), takes 0.06 fresh and 0.02 deep. One board in seventeen sees a
take. Inert because it almost never happens, which is the return card's own fate as a signature.

## 3. The second cards, where the first tripped or the sheet asked

| id | night | seat f/d | skill f/d | spread | shape | verdict |
|---|---|---|---|---|---|---|
| 8b the vapour | m8 | −1.3 / −2.7 | −3.2 / −2.3 | 27.9 → 31.2 +3.3 | flat (bird −9.9) | pass, inert |
| 8c the goat's gap | m8 | **−6.3** / −3.7 | +4.7 / −1.0 | 27.9 → 30.4 +2.5 | flat | **pass** |
| 13b the crossbar | m13 | +2.0 / +0.8 | −0.3 / +1.6 | 25.8 → 21.9 **−3.9** | narrows, one-sided (tiger +4.5, tortoise +3.6) | **pass** |
| 14c the horn | m14 | +5.7 / +2.1 | −0.5 / −0.2 | 41.1 → 33.3 **−7.8** | NARROWS | pass |
| 16a the pinch | m16 | **+44.2 / +26.6** | +22.5 / +4.7 | 22.4 → 34.8 +12.4 | WIDENS | **FAIL**, see below |
| 22a the ear | m22 | +2.0 / +2.9 | −2.1 / −0.9 | 24.7 → 26.0 +1.3 | ROTATES | pass, inert |
| *diag: the void's own lines, debit right* | m22 | **+12.0 / +8.2** | +0.7 / −4.5 | 24.7 → 20.0 −4.7 | NARROWS | fail |
| *diag: the eye, defender* | m22 | **−4.9 / −6.7** | −1.2 / −0.5 | 24.7 → 24.4 | flat | pass, **4th night** |
| *diag: the release + the eye* | m22 | −5.5 / +5.7 | +0.8 / +2.1 | 24.7 → 22.8 −1.9 | ROTATES | inside, but the narrowing is gone |

---

## 4. Night by night

**m7 the return.** 7a is inert by rate, not by size: the second strike needs an empty take, then
the same card still standing two moves later. Nothing to ship. **Recommend the door-first window
and no law**: deep seat 13.3, fresh skill 17.6, spread 17.6, inside every bound. The slid road
Design named has a deep seat of 26.6 and should not be the return's night.

**m8 the ghost.** The haunt widens 16.2: the tiger −18.4, the tortoise +9.3. A law that passes the
striker's card to the victim is a tax on the side whose cards cannot be taken and so are the ones
striking, and that is the tiger. Retired. **The gap did not trip.** Design expected the spread
bound; it reads flat (+2.5) with seat −6.3 fresh, the largest cooling on the night, and skill up
4.7. The vapour passes and does nothing. **8c is the pass with a purpose on m8**, if a chain-owner
law is a fiction Design wants; the dragon at 64.5 is untouched by any of the three.

**m11 the mane.** The ribs pass: deep seat −7.4, fresh +3.9, spread +1.0. Genbu stress row −1.7,
nothing to see. It moves the deep seat and little else. Design's rule was "11c is the second
plain bird night if 11b moves the seat"; it moves the deep seat seven the right way and the fresh
seat four the wrong way. **Either ships**; the ribs is a small cooling law with a clean fiction,
no-law is a fair board at 23.1.

**m13 the hand.** The steady hand fails twice: seat −13.9 fresh, and the board widens 9.7. The
turn's precedent did not carry: a permanent +1 at both flanks is a lot of number on a road the
dragon already tops. **The crossbar passes and is the surprise Design hoped for**: seat +2.0,
spread −3.9 with the tiger +4.5 and the tortoise +3.6, the floor lifted. A law that reads the
opponent's signatures and does nothing else is portable by construction (it conditions on a card
property, the verb, not on a comparison), and here it is gentle in the right direction.
**Recommend 13b.** The stillness class opens at 1/1.

**m14 the jewel.** The unarmed trips the seat bound by 1.6 (−9.6 fresh). **The bright face, the
control, is the best row on the night**: seat −1.4, spread −8.7, and all of it off the dragon
(−8.4), which owns the board at 70.9. The horn narrows 7.8 with a small seat rise. **Recommend
14b**: the card that was written to be wrong is the one that works, because on the jewel's own
night the dragon's advantage is its lopsided cards, and a crossing that reads every card at its
stronger face is a crossing where lopsidedness stops mattering.

**m16 the claws.** Two results, neither a ship. **The scales cool the seat by 17 on both rows**,
deep seat 16.9 → −1.0, tiger −16.7, bird −11.0, dragon −13.7, tortoise flat, spread unchanged. That
fails the ±8 bound the way a fire hose fails a watering can. **It is the strongest seat instrument
ever measured, by a factor of three over the eye, and it is a count law with no strike in it.**
Hold it for the loop's komi question; a half-strength scales (lighter pan −1 on one side only, or
the beam weighed) is the obvious dial if Design wants it as a law. **The pinch is a lesson**:
seat +44. Any square that cannot be filled until the road is nearly full is filled by the ninth
card, and the ninth card is the leader's; the pinch makes the flanks those squares. I checked it
at the door pair too (+35): it is not the claws, it is the deferral. **Move laws that defer a
square are last-word laws.** m16 ships no-law (22.4, inside every bound) or waits for the scales
at half strength.

**m17 the crown.** The hold passes: seat −0.7/−1.0, spread +3.5, the bird −11.0. **The deny class
has its first pass on fair ground, and it is a pass that does not narrow.** The crown keeps its
theme; the class stays open at 1/5. Whether a flat law with a bird tax is worth the crown's night
is Design's call; it is inside every bound and it is the plant's exact branch.

**m20 the flock.** The slide is the law. 41.0 → 22.4, seat unchanged, no sentence needed.

**m22 the listener.** The slide is the seat cure (+13.8 → −2.0 fresh, 24.7 → 12.8 deep), as the
12 Sep pre-sheet said. **The release then narrows 12.9 and lifts the tortoise from 27.9 to 39.4,
which is precisely the brief, and heats the deep seat 11.2, which is 3.2 over the bound.** The
void's own lines are worse here (+12.0 fresh). The ear is inert. The eye reads −4.9/−6.7 on a
fourth night and is now beyond question as the seat instrument; paired with the release it brings
the seat inside but the narrowing collapses into a rotation. **So the listener has a narrowing law
3.2 over one bound and a seat law that undoes it.** My read: the release at deep +11.2 on a slid
plain of +12.8 is an absolute deep seat of 24.0, under the 25 flag; if the bound policy the
bookmark owes moves at all, this is the row that moves with it. Until then the listener is the
slide alone (22c), which is already a better night than the one that shipped.

## 5. What the batch says about the ring

- **Two laws ship clean and both are second cards** (the crossbar, the bright face). One first
  card passes with a purpose (the ribs, the hold) and one second card does (the gap).
- **Three nights are the slide or no-law** (m7 door-first, m16, m20), and m11 could be.
- **Two instruments went on the shelf**: the scales (seat −17) and, from the last sheet, the eye
  (seat −5, four nights). The komi question now has a strong and a gentle lever to choose from.
- **One tempo law**: deferring a square hands the leader the last word. It belongs beside "the
  door is a leader's square" in the pre-sheet rules; no move law should defer a square.
- **The bird columns need re-cutting** across the scorecard, per section 0.

### Files

`research/v2.js` (nine-laws dials: `againAt`, `hauntAt`, `ribsAt`, `handAt/handN`, `armAt/armN`,
`scales`, `voidN` left, `vapourAt`, `gapAt`, `stillAt`, `hornAt`, `pinchAt`, `earAt`; the pending
fix), `research/wardvec.js` (159), `research/againrate.js`, `research/ninetab.py` (every table
above), `p_t3/4/7/8/10/11/12/13/14/16/17/20.out`, `m22plain.out`, `m22plain_slid.out`, and one
`.out` per law row named as in the tables.
