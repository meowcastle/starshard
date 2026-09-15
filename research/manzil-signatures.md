# The twenty-eight signatures

*Draft, 21 August 2026. One signature per mansion, grouped into six families so a player
learns six ideas rather than twenty-eight. Seven are shipped today and unchanged; twenty-one
are new. Implemented in `research/sig28.py` and measured in `research/sigtest.py`.*

---

## When a signature is awake

Today a card at L1 has no signature at all. `Rules` silences it: `if lvl < 2: ab_eff = None`.
It wakes at L2 and never sleeps again. Her planets are a separate case, hardcoded at L3 with
their abilities always live, and the walkers' loaner mansions never have one.

That rule stays, with one addition, because §7 of the randomness doc measured what a fully
asleep twelve plays like: **careful 33.2%, casual 27.3%, skill gap 5.9.** A player whose
whole collection is at L1 cannot tell good play from bad. So:

**The starter twelve ships awake.** That is what makes it a starter twelve rather than
twelve pieces of cardboard. Every mansion collected *after* the starter arrives at L1 asleep
and wakes at L2 through play.

Onboarding is then a real game from the first night, and the progression is real for
everything that follows it.

---

## The six families

Each family is one idea. The members differ in the condition, not the mechanism.

| family | the idea |
|---|---|
| **The Strong** | fights at +1 while a condition holds |
| **The Covered** | cannot be taken while a condition holds |
| **The Reach** | acts past its own neighbour |
| **The Count** | weighs more than one at the count |
| **The Turn** | changes its faces, or what it is worth once taken |
| **The Meddle** | changes the numbers or the ground around it |

---

## The slate

Wording is final-draft, house voice: state the effect, do not explain it.
**Bold** marks the seven that ship today.

### The Strong

| # | card | faces | signature |
|---|---|---|---|
| 18 | **The Heart** | 7/7 | **Fights at +1 while she holds more of the road.** |
| 5 | **The Blaze** | 5/6 | **Keeps the ground it lodges on.** |
| 4 | The Follower | 7/7 | Fights at +1 beside one of yours. |
| 11 | The Mane | 6/5 | Fights at +1 while nothing on the road shows a higher number. |
| 23 | The Drum | 4/7 | Fights at +1 on every second card. |

The Follower follows the Pleiades and is stronger in company. The Mane is display, and
loses it to anything louder. The Drum keeps a beat, so it is strong on the even placements
and ordinary on the odd ones, which makes *when* you lodge it a decision.

### The Covered

| # | card | faces | signature |
|---|---|---|---|
| 6 | **The Storm** | 8/5 | **Cannot be tied.** |
| 14 | **The Jewel** | 7/7 | **Cannot be softened.** |
| 15 | The Veil | 8/2 | Cannot be taken on its lower face. |
| 26 | The Chamber | 7/5 | Cannot be taken between two of yours. |
| 2 | The Bearer | 6/4 | Nothing takes her by one. |

The Veil is the sharpest fit in the slate: an 8/2 whose 2 is covered is a card with one
number. The Chamber is a room with walls, and the walls are your own cards. The Bearer bears
the blow, so a 7 does not take her 6.

### The Reach

| # | card | faces | signature |
|---|---|---|---|
| 16 | The Claws | 6/6 | Strikes past what it takes. |
| 13 | The Hand | 7/4 | Reaches a slot further on its higher face. |
| 28 | The Thread | 5/6 | At an end of the road, the ends are neighbours. |
| 9 | The Glance | 4/6 | Her strongest card drops one on the face it turns to you. |
| 22 | The Listener | 7/4 | She lodges beside it. |

The Thread is the cord that ties the wheel closed, so it closes the road into a ring while
it stands at either end. The Listener does not fight, it *baits*: her next card is drawn to
the slot beside it, which is a way of choosing where she goes.

### The Count

| # | card | faces | signature |
|---|---|---|---|
| 17 | **The Crown** | 6/6 | **Counts two at the ends of the road.** |
| 3 | The Gathered Stars | 7/6 | Counts one more for each of yours beside it. |
| 20 | The Flock | 6/6 | Counts two in a row of three. |
| 21 | The Empty District | 2/8 | Counts three alone. |
| 1 | The Gate | 6/5 | Counts two while nothing stands before it. |
| 7 | The Return | 7/6 | Counts two beside its like. |

This family is what makes the four 6/6 cards play differently. The Crown wants an end, the
Flock wants a run, the Claws want a target, the Ghost wants to be taken. Same two numbers,
four different games.

The Empty District is the starless stretch and rewards isolation, which is the opposite of
everything else in the family. The Return is Punarvasu, the Twins, and pairs with any card
of yours showing the same two numbers.

### The Turn

| # | card | faces | signature |
|---|---|---|---|
| 10 | **The Throne** | 6/9 | **Chooses its faces.** |
| 12 | The Turning | 7/5 | Turns its faces when the road is half full. |
| 8 | The Ghost | 6/6 | Taken, it counts for no one. |

The Turning is the weather-change star. Lodge it as a 7/5 and it becomes a 5/7 on the fifth
card, which means it should be lodged *against* the shape of the board rather than with it.
The Ghost is ghost-vapour: taking it wins nothing.

### The Meddle

| # | card | faces | signature |
|---|---|---|---|
| 25 | **The Hideaway** | 5/6 | **Silences its mansion.** |
| 24 | The Void | 9/2 | Nothing beside it holds its own mansion. |
| 19 | The Root | 7/6 | What it faces drops one. |
| 27 | The Guide | 6/5 | Yours count two on their own mansions. |

The Void and the Guide are the same axis pointed in opposite directions, which is the right
shape for the two cards the naming sheet says people should fight over. The Void empties the
ground beside it; the Guide leads your cards home.

---

## What the numbers say

Aggregate, dealt five from a drafted twelve, every mansion signed at L3:

| | careful | casual | gap | flips | margin |
|---|---|---|---|---|---|
| *today: 7 signed, reads 8* | *60.4* | *37.8* | *22.6* | *3.50* | *2.39* |
| all 28 signed, reads 8 | 69.9 | 44.9 | **25.0** | **3.97** | 2.49 |

Flips rise from 3.50 to 3.97 and the skill gap from 22.6 to 25.0. The real signatures beat
the recycled placeholders from §9 of the randomness doc on both counts, which is the
expected direction and a mild check that the slate is doing something rather than adding
noise. It runs about ten points hot, which the reading-depth dial covers.

### What each signature is worth

Each card forced into every hand, its signature live versus silenced, 1,680 boards per
condition, two seeds. The delta is what the signature adds to careful play.

| card | signature | worth | | card | signature | worth |
|---|---|---|---|---|---|---|
| **The Storm** | cannot be tied | **+15.4** | | The Void | nothing beside it holds its mansion | +3.4 |
| The Claws | strikes past what it takes | **+15.0** | | The Flock | counts two in a row of three | +2.9 |
| The Veil | cannot be taken on its lower face | **+14.8** | | The Return | counts two beside its like | +2.5 |
| The Hand | reaches a slot further | **+14.6** | | The Gate | counts two while nothing precedes it | +2.0 |
| **The Blaze** | keeps its ground | **+13.4** | | The Thread | the ends are neighbours | +2.0 |
| The Root | what it faces drops one | **+13.4** | | The Follower | +1 beside one of yours | +1.1 |
| The Drum | +1 on every second card | **+12.0** | | The Glance | her strongest drops one | +1.1 |
| The Ghost | taken, it counts for no one | +8.2 | | The Bearer | nothing takes her by one | +0.4 |
| **The Throne** | chooses its faces | +5.2 | | The Turning | turns at the half | +0.2 |
| **The Jewel** | cannot be softened | +4.8 | | The Chamber | safe between two of yours | **0.0** |
| **The Crown** | counts two at the ends | +4.5 | | **The Hideaway** | silences its mansion | **0.0** |
| The Guide | yours count two at home | +4.1 | | The Mane | +1 while nothing shows higher | **0.0** |
| The Gathered Stars | one more for each beside it | +3.8 | | The Listener | she lodges beside it | **−0.2** |
| | | | | The Empty District | counts three alone | **−8.2** |
| | | | | **The Heart** | +1 while she holds more | **−8.8** |

**Fourteen of twenty-eight are in good shape. Fourteen need a rework pass**, which is
roughly the hit rate the prior addenda predicted, and it lands on the shipped seven as hard
as on the new twenty-one: five of the new cards are among the strongest in the slate, and
two of the seven that ship today are broken.

### The rework list, with diagnoses

**Actively harmful.**

- **The Heart, −8.8.** A card that is strong only while you are losing rewards falling
  behind and is dead once you are ahead. This is the comeback-mechanic trap in its purest
  form and it has been suspected since the flip-density pass. Rebuild it on a condition the
  player controls.
- **The Empty District, −8.2.** "Counts three alone" pays for isolation, and on a
  nine-slot road isolation means surrounded by hers, which means taken. The condition
  rewards a position you lose from. Invert it into a defensive effect.

**Inert. The condition effectively never fires.**

- **The Mane, 0.0.** A 6/5 almost never shows the highest number on the road, so the clause
  is decoration. Invert it: the mane bristles at a rival, +1 while something *higher* stands
  on the road.
- **The Chamber, 0.0.** If both neighbours are already yours, nothing is attacking it.
  Logically self-cancelling. Loosen to one neighbour.
- **The Hideaway, 0.0.** Silencing its own mansion silences its own dominion. Point it at a
  neighbour's mansion instead.
- **The Listener, −0.2.** Baiting her toward a slot is neutral when she was going to take a
  good slot anyway. It needs to bait her somewhere *bad*, or strike as she arrives.
- **The Turning, +0.2.** By the fifth card its fights are usually settled. Trigger it on
  being attacked rather than on a count.
- **The Bearer, +0.4.** A 6/4 rarely meets an attacker exactly one point above it. Widen
  the margin to two.

**Too small to feel.** The Follower (+1.1), the Glance (+1.1), the Gate (+2.0), the Thread
(+2.0), the Return (+2.5) and the Flock (+2.9) all work as written and are simply priced too
low. Scale the condition rather than redesigning: the Follower should count each neighbour
rather than any neighbour, the Glance should take two rather than one.

**Left alone.** Storm, Claws, Veil, Hand, Blaze, Root, Drum, Ghost are in band. The Throne,
Jewel, Crown, Guide, Stars and Void are modest but real and can wait behind the fourteen
above.

### What this does to the aggregate

| | careful | casual | gap | flips |
|---|---|---|---|---|
| today, 7 signed, reads 8 | 60.4 | 37.8 | 22.6 | 3.50 |
| all 28 signed, reads 8 | 69.9 | 44.9 | 25.0 | 3.97 |
| all 28 signed, reads 12 | 66.5 | 39.1 | **27.4** | 3.79 |
| all 28 signed, reads 16 | 66.4 | 37.6 | **28.8** | 3.78 |
| a twelve of only the new signatures, reads 8 | 35.6 | 25.7 | 9.9 | 4.73 |

The last row is the honest one. **A twelve built only from the twenty-one new cards reads
35.6% with a 9.9-point skill gap** — worse than the recycled placeholders scored in §9 of
the randomness doc, because those placeholders were copies of the strong shipped abilities.
The slate as drafted is bottom-heavy. After the rework pass that row is the number to watch:
it should climb toward the fifties with a gap above eighteen before any of this is built.

---

## Notes for implementation

- **Cheap** (data only, no new engine hooks): the whole Strong family, and Crown, Gathered
  Stars, Flock, Empty District, Gate, Return, Ghost, Guide, Void in The Count and The Meddle.
  These are conditions on `face()` and `counts()`.
- **Moderate** (touches the flip resolver): Veil, Chamber, Bearer, Root.
- **Expensive** (touches placement or her move selection): Claws and Hand extend the flip
  queue, Thread changes adjacency, Glance and Turning act on lodge, Listener biases
  `sky_move`.
- Nothing in the slate needs per-slot state beyond what the board tuple already carries,
  which was a deliberate constraint. The one idea cut for needing it was a Return that comes
  back to you the first time it is taken; the Twins reading of Punarvasu does the same job
  statelessly.
- The Glance was originally written as an information ability, revealing her next card. That
  is worth nothing: her hand is public by design. Rewritten as a weakening effect.
