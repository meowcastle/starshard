# The format table, and the four calls: the crow's half, the beat's second pair, the hush's second pair

**14 September 2026. For Design (cc Code).** The format table asked for on 13 Sep, closed form, and
the three measurement calls from the after-re-baseline note. 896 boards a cell, walker boards,
fixed engine, 160 vectors green. Read against `rb_plain_t4/t17/t18.out`.

---

## 1. The format table

The live format as the runner has it: rungs one to four single boards, five to eight best of
three, the mansion best of five; three lanterns; a lost rung costs one lantern and is retried
from the same rung; clear is the mansion won before the third lantern goes out. Pure arithmetic
over a flat per-board win rate p (`research/format.py`, exact, no sampling).

| p per board | **P(clear)** | boards a climb | lanterns lost | where the wipes fall: singles / bo3 / mansion |
|---|---|---|---|---|
| 0.50 | **3.3%** | 7.7 | 2.95 | 66% / 29% / 2% |
| 0.55 | 7.9% | 9.1 | 2.89 | 56% / 33% / 3% |
| 0.60 | 16.3% | 10.8 | 2.75 | 46% / 34% / 5% |
| 0.65 | 29.1% | 12.6 | 2.54 | 35% / 31% / 5% |
| 0.70 | **45.5%** | 14.3 | 2.22 | 26% / 25% / 4% |
| 0.75 | 63.3% | 15.7 | 1.83 | 17% / 17% / 3% |
| 0.80 | 79.3% | 16.6 | 1.39 | 10% / 9% / 1% |
| 0.85 | 91.0% | 16.8 | 0.96 | 5% / 4% / 1% |

**The board win rate a clear rate needs:** 10% of climbs → p 0.565 · 25% → 0.636 · a third →
**0.663** · half → **0.713** · three quarters → 0.786 · nine in ten → 0.845.

**The storm's format** (nine best-of-threes, two lanterns) is harsher at every p: 1.1% at 0.50,
8.4% at 0.60, 32.9% at 0.70, 72.1% at 0.80, and 20 boards a climb at the top. The best-of-three
everywhere does not soften the coin flip; the second lantern does the killing.

**Three things the table says that the runner could not:**

- **At a coin flip, two thirds of all wipes are in the four singles.** Design saw lanterns cluster
  at walkers two and three; that is not the nights, it is the singles. A single board is the only
  rung where one lost coin flip is one lost lantern, and there are four of them before any
  best-of-three softens the variance. The bo3 rungs kill 29% and the mansion 2%.
- **The mansion is not where climbs end, at any p.** Its share of wipes peaks at 5% around
  p = 0.65 and falls both ways. Whatever the boss fight is for, it is not the difficulty.
- **Every measured fresh board sits between 41% and 56% against the mirror**, and the mirror at
  50% clears one climb in thirty. So the clear rate at fresh is a handicap question, not a night
  question, exactly as Design read it: **whatever `_handicapFor` does at fresh has to lift the
  fresh player from about 50% to about 65–70% per board for a third to half of climbs to clear**,
  and the night geography is a second-order term until it does. That is the sentence the design
  did not have in writing; here it is, with the number.

## 2. The crow, half-strength: the debit is the crow, the credit is the seat

Design suspected a free take at the perch. The reference crow has no take; it is two count lines,
the crossing counts one more and the richest neighbour one less. So the half forms are the two
lines apart, on m4's road against the re-baselined plain.

| form, m4 door-first | seat f/d | skill f/d | spread | bya · suz · sei · gen | shape | |
|---|---|---|---|---|---|---|
| the crow as shipped | **+10.2** / −0.2 | +1.4 / −4.2 | 47.1 → 29.3 −17.8 | −17.1 · +2.3 · +7.2 · +0.7 | narrows, one-sided | fail (seat) |
| credit only: the crossing counts one more | +4.0 / +3.0 | **−11.1** / +1.0 | 47.1 → 42.6 −4.5 | −6.5 · +4.5 · −19.5 · +2.1 | NARROWS | fail (skill) |
| **debit only: the richest neighbour counts one less** | **+2.0 / −4.3** | **+7.1** / +0.9 | 47.1 → **30.2 −16.9** | −11.5 · −4.7 · −6.1 · +5.4 | **NARROWS** | **pass** |

**Ship the debit alone.** It keeps 16.9 of the 17.8, brings the seat to +2.0, lifts the skill gap
7.1, and is a true NARROWS (the tiger down, the tortoise up) where the full crow was one-sided.
Kind `crow` becomes one `_slotW` line: the richer of the crossing's two neighbours counts one
less, ties to the station nearer the door. The `+1` at the crossing is deleted.

**This is the third time the same lesson has landed this week, and it is now a rule.** The
release on the listener: credit only heated the seat +12, debit only cooled it. The void on its
own night: `right` (with the credit) ran +4. The crow: the credit alone is +4 seat and −11 skill.
**A crossing that counts one more is a last word worth one more, and the last word is the
leader's on every nine-station road.** Into the pre-sheet, beside the door rule and the deferral
rule: *no credit at the crossing.* Debits carry; credits heat.

## 3. The beat: second seed pair, accepted

| t18, the heart's road | seat f/d | skill f/d | spread | shape |
|---|---|---|---|---|
| seed pair A | +0.2 / −1.8 | +3.0 / −1.7 | 24.7 → 29.8 +5.1 | WIDENS |
| seed pair B | −1.3 / −2.7 | +2.5 / −2.1 | 23.8 → 27.7 +3.9 | ROTATES |
| **mean** | −0.6 / −2.3 | +2.8 / −1.9 | **+4.5** | |

Under five on the mean, as Design's rule asked. **Accepted.** It is a small widening on every
seed and a small cooling with it; the beat is not a narrowing law and never was.

## 4. The hush: second seed pair, the widening is real, and the fresh seat is louder than reported

| t17, the district's slid road | seat f/d | skill f/d | spread | bya · suz · sei · gen | shape |
|---|---|---|---|---|---|
| seed pair A | −6.5 / −3.2 | +12.5 / −4.8 | 22.6 → 30.5 **+7.9** | +6.5 · **−13.5** · +10.6 · +6.5 | WIDENS |
| seed pair B | **−13.0** / −1.7 | +3.9 / −2.4 | 22.7 → 29.6 **+6.9** | +6.2 · **−15.7** · +7.2 · +0.7 | WIDENS |
| mean | −9.8 / −2.5 | +8.2 / −3.6 | +7.4 | | |

**The widening holds on the second pair, and it is the bird both times.** Design's placement
flag stands on two pairs now. Two things to add to it. The fresh seat is **−9.8 on the mean and
−13.0 on pair B**, over the bound in the cooling direction: the hush is a stronger seat law on this
road than the first pair showed, and it is the seat that a fresh player meets. And the fresh
skill gap swings +12.5 / +3.9 between pairs, which is the widest seed-to-seed swing I have seen on
a skill row; the district's slid road is a noisy board, and any future row on it should be two
pairs by default.

**Nothing to pull**, per the call. But the pilot house now carries a bird flag, a fresh-seat flag,
and a noise flag, and it is the road a new player meets first. When the komi decision is taken,
this is the night to re-read beside the listener.

## What Code gets from this

- Kind `crow`: delete the credit line; keep the richest-neighbour debit. One line fewer.
- Kind `beat`: unchanged.
- `_nightSpread[21]`: 30.5 on pair A, 29.6 on pair B; take 30.0.
- Nothing for the format. The table is Design's to state a target against; Code's
  `_handicapFor` is the lever it points at.

### Files

`research/format.py` (the table, exact), `research/v2.js` (`crowN` both | credit | debit),
`research/runN.js` (`SEEDOFF` for a second seed pair), `crow_credit_t4.out`, `crow_debit_t4.out`,
`rb2_plain_t17/t18.out`, `rb2_law_beat.out`, `rb2_law_hush.out`.
