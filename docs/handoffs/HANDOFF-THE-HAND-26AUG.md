# The hand, the road, and one thing I got wrong

**26 August 2026.** Justin opened up hand size, deal and board length. This measures all three.

**Engine:** `research/ref-tap.js`, which is 2,000/2,000 identical to the merged reference at level 2.
Pack held constant at twelve throughout so hand size is the only thing moving.

Two metrics beyond balance, because the question was what makes the game **interesting**, not just
fair: **close** is the share of boards decided by one slot or less, **blowout** the share decided by
four or more.

---

## 0. A retraction first

**My earlier claim that hand size is "the one dial that moves the number further than every ability
change combined" was overstated.** That came off a run where hand size was confounded with the taps
being switched on and a wider pack. Isolated, it does something real but narrower, described below.

**And two "discoveries" in my first pass here were noise.** A road of eleven with seven-card hands
read a 22.8 skill gap on one seed; on a second it read 13.9, a spread of ±8.9. A road of seven read
23.0; averaged over three seeds it is 20.9. **Single-seed cells on this board swing by up to nine
points.** The standing convention is two seeds and I ran one. Everything below is two or three.

---

## 1. The real problem, and it is levels 3 and 4

Her hand grows with level: five, six, seven, eight. The player's is five forever. Here is what that
does at rung 9, the mansion's own sky.

| her hand | the player's | careful | casual | gap | blowouts |
|---|---|---|---|---|---|
| 5 (level 1) | 5 | 51.8 | 36.0 | 15.8 | 36% |
| 6 (level 2) | 5 | 40.6 | 24.0 | 16.6 | 40% |
| **7 (level 3)** | 5 | **30.6** | 17.0 | 13.6 | 49% |
| **8 (level 4)** | 5 | **20.5** | 14.5 | **6.0** | **60%** |

**By level 4 a careful player loses four boards in five, three fifths of them are blowouts, and
skill is worth six points.** That is not a difficulty curve, it is a wall. And it is the level the
project is currently building toward.

Now the same ladder with the player's hand matched to hers:

| both hands | careful | casual | gap | unplayed | blowouts |
|---|---|---|---|---|---|
| 5 | 51.8 | 36.0 | 15.8 | 0.7 | 36% |
| 6 | 51.4 | 33.7 | 17.7 | 1.8 | 36% |
| 7 | 50.9 | 32.4 | 18.5 | 2.7 | 40% |
| 8 | 44.9 | 26.4 | 18.5 | 3.6 | 40% |

**Difficulty stays flat instead of collapsing.** Careful play holds near 51% from level 1 to level
3 and only eases to 45% at level 4, and the skill gap improves as you climb rather than evaporating.

That is what matching the hand buys: **it fixes levels 3 and 4.** It does not, on its own, fix the
skill gap, which sits at 18.5 against a 20+ target. That is the correction to my earlier claim.

The `unplayed` column is why it works. At five cards the player has 0.7 cards left at the end, so
there is almost no choosing — you play what you were dealt. At seven you hold 2.7 back, so which
cards you spend and which you keep becomes a real decision. **Choice is what skill needs somewhere
to live.**

## 2. Level 3 supplies the missing gap

The same 5-v-5 board, with the tap system switched on properly (cards actually built at level 3,
grants both sides, own cards only, her agent tapping). Three seeds:

| rung | careful | casual | gap |
|---|---|---|---|
| 1 | 82.4 | 51.9 | 30.5 |
| 3 | 79.9 | 48.2 | 31.7 |
| 5 | 77.9 | 45.3 | 32.6 |
| 7 | 66.2 | 38.2 | 28.0 |
| **9 (the sky)** | **53.3** | 32.4 | **20.9** |

**Careful play in the 55-65 band's neighbourhood and a gap over 20, at every rung.** Without the
taps the same board reads a 15.7 gap at rung 9.

So the two pieces do different jobs and both are needed:

> **Matched hands stop levels 3 and 4 collapsing. The tap supplies the skill gap. Neither does the
> other's job.**

## 3. Road length changes how the game feels, not how it balances

I swept the road from five slots to thirteen. On balance and skill gap, **once you use enough seeds
the differences disappear** — rung 9 gaps land between 17 and 21 across the whole sweep, which is
inside the noise.

One effect is real, monotone, and shows at every rung: **a shorter road produces closer games.**

| | close | blowout |
|---|---|---|
| road 7, across rungs 1-9 | 20-31% | 37-55% |
| road 9, same rungs | 17-25% | 45-60% |

Five rungs out of five point the same way. A nine-slot board with ten cards fills almost exactly,
so the count runs away and roughly half of all boards are decided by four slots or more. Shorten it
and more boards come down to the last placement.

**A shorter road is a texture decision, not a balance one.** Worth having if blowouts are the
complaint. Not worth having if the goal is the skill gap, because it does not move it.

**And it happens to fit the fiction.** Seven mansions is exactly one of the Four Symbols — a road of
seven is one quadrant of the sky, walked end to end. Twenty-eight divides into four sevens, and the
board would divide the same way.

## 4. What I would do

1. **Grow the player's hand with the level, matching hers.** Five, six, seven, eight. This is the
   change that stops levels 3 and 4 being unplayable, and it is the one that has to happen before
   L3 ships to anyone.
2. **Ship the tap.** It is what puts the skill gap over target. Gate it to cards that started in
   your hand first, per the earlier note.
3. **Treat the road length as a separate, later, optional call.** It buys closer games and nothing
   else measurable. Try seven if blowouts turn out to be the thing testers complain about.
4. **Do not chase single-seed peaks.** Two seeds minimum on this board, three when the cell is going
   to decide something. I lost an hour to two peaks that were not there.

### What was not tested

Shuffling and deal composition beyond pack size. The starter pack `5, 6, 10, 17, 18` is still two
Byakko, one Suzaku, two Seiryuu and **zero Genbu**, so a player never meets one of the four quadrant
grants from the opening pack. That is unchanged and still worth fixing.

### Files

`research/hands.js` (the grid), `research/roads.js` and `research/roads2.js` (the road sweep, one
seed then two), `research/final.js` (three seeds across the ladder).
