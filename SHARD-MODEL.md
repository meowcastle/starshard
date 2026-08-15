# SHARD-MODEL.md — the chart is the foundation, the shard is the evolution

**August 14, 2026.** How the Star Shard reads the chart. **Science first,
lore second** — every line of copy in the shard must be generated from a
computed finding named in this document. If a passage cannot point at a
number here, it is decoration.

Follows `INNOVATION.md`, which established what is actually unoccupied.

---

## 1. The one measure

The three unoccupied things turned out to share a unit, and that is the
spine of the whole product:

> **Everything Star Shard says is ranked by how rare it is.**

- **Your chart** ranks its highlights by rarity.
- **Your shard**'s centrepiece is *lifetime* rarity — how often this has
  happened to **you**.
- **Every fragment** you gather carries its own count.

Rarity is measured in **bits**: `−log₂(P)`. A sun sign is `−log₂(1/12)` =
**3.6 bits**. A sun mansion is `−log₂(1/28)` = **4.8 bits**. A sun step is
**6.8 bits**. Same unit, everywhere, so a chart finding and a shard
finding can be sorted against each other on one axis.

**This is what lets the shard be honestly deeper than the chart rather
than merely claiming to be.** The chart tells you *what* you are. The
shard tells you *how rare that is, how it moves, and what four traditions
each called it.* Depth is earned by computing things the twelve-fold view
does not compute — never by asserting it.

---

## 2. YOUR CHART — the foundation

> Justin: *"the body in the chart should be all the important highlights
> of someone's chart, generated based on what is most interesting."*

"Most interesting" needs a function, or it becomes whatever the model felt
like that day. Three factors, multiplied:

```
score = rarity_bits × prominence × tension
```

**rarity_bits** — `−log₂(P(feature))`, estimated by Monte Carlo over the
ephemeris, not by assertion. Precomputed once and shipped as a table.

| feature | P | bits |
|---|---|---|
| Sun in a sign | 1/12 | 3.6 |
| any two points in the same sign | 8.2% | 3.6 |
| any two points in the same mansion | 3.4% | 4.9 |
| an aspect inside 1° orb | ~2% per pair | 5.6 |
| three points in one mansion | rare — compute | ~10+ |

**prominence** — Sun · Moon · Ascendant · Midheaven = **1.0**; Mercury,
Venus, Mars = **0.7**; Jupiter, Saturn = **0.5**; outers = **0.35**.
Multiply by **1.5** if within 10° of an angle. A rare configuration among
points nobody feels is not interesting.

**tension** — **×1.3** if the feature contradicts a higher-ranked one.
Contradiction is what makes a reading feel true, and it is the mechanism
`WRITING.md` calls *accuracy that includes the cost*.

**Ship the top 5–7, and print the bits.** A reader who sees *"4.9 bits —
about 1 in 28"* next to a passage learns the scale, and by the third visit
they are reading the number before the prose. That is the fluency the
whole product is trying to build.

**The chart uses ordinary astrology throughout** — signs, houses, aspects,
orbs, retrogrades. `WRITING.md`'s de-paraphrase law applies without
exception. Nothing coined lives here.

---

## 3. YOUR SHARD — the evolution

Five findings the twelve-fold view **structurally cannot produce.** Every
one is measured, not asserted.

### a. Resolution — the shard discriminates where the chart cannot

A sign is 30°; a mansion is 12°51′25″; a step is 3°12′51″. So:

> your sun sign is shared by **1 in 12**.
> your sun's mansion by **1 in 28**.
> your sun's step by **1 in 112**.

**Same sky, 2.33× finer, and the finer cut is the moon's own.** Twelve is
a solar count — the sun takes a month per sign. Twenty-eight is a lunar
count — **the moon crosses one a night, which is why there are
twenty-eight.**

### b. Co-location — where the two views disagree about your own chart

Because mansion boundaries and sign boundaries only coincide at the four
cardinal points, **8 of the 28 mansions straddle a sign boundary.** So the
two views disagree about pairs of points, in both directions:

| | frequency |
|---|---|
| same sign, **different mansion** — *chart joins, shard splits* | 5.24% of pairs |
| same mansion, **different sign** — *chart splits, shard joins* | 0.44% of pairs |

Measured over 9,477 sampled nativities, 1975–2015, ten planets, 45 pairs
each:

> **mean 3.48 disagreements per chart. Only 5.0% of people have none.
> And 21.7% of charts contain at least one of the uncanny direction —
> two points the chart calls separate that the shard puts in one place.**

**This is the single best demonstration the shard has**, because it is a
finding about *their own chart* that their own chart cannot make, and it
is checkable in thirty seconds against any other site.

*Worked example — Justin's chart, five disagreements, above the mean:*

| | |
|---|---|
| Sun 16° Gem · Jupiter 18° Gem | same sign, **mansions 6 and 7** — the shard splits them |
| Moon 26° Cnc · Venus 2° Cnc | same sign, **mansions 10 and 8** |
| Moon 26° Cnc · Mars 24° Cnc | same sign, **mansions 10 and 9** |
| Venus 2° Cnc · Mars 24° Cnc | same sign, **mansions 8 and 9** |
| **Moon 26°51′ Cnc · MC 5°48′ Leo** | **different signs, both mansion 10** |

That last row is the product. Those two points are 8.95° apart — **just
outside the standard 8° conjunction orb**, and in different signs, so
whole-sign practice separates them and most software will not flag them.
**No ordinary chart reading will ever tell him his Moon and his Midheaven
are in the same place.** The shard does, on day one, for free.

Also: **Saturn, Uranus and Neptune all sit in mansion 22.** The chart sees
a Capricorn stellium — a 30° window. The shard sees one mansion — 12.86°.
A 2.33× tighter claim about the same fact.

### c. Lifetime rarity — the centrepiece

`INNOVATION.md` §3c: **no astrology software anywhere computes how rare a
transit is for a specific person across their own life.** This is the
shard's headline and the thing a working astrologer would open the tool
specifically to get.

**The primitive:** for any contact between a transiting body and a natal
point, scan birth → death-horizon, find every window, and return
`{ occurrences_before_now, previous_window, next_window, total_in_life }`.

**On the shard it attaches to three things:**

1. **Every fragment.** Gathering mansion *n* tonight reports *"the 41st
   time the moon has crossed here since you were born"* — trivially
   computed from the sidereal month. That converts a checklist into a
   record.
2. **Every slow transit.** *Uranus sextile MC: 0 occurrences in your life.
   Previous window closed 22 Aug 1970. Next opens 2052.*
3. **Configurations.** Tonight's mansion **plus** the current slow
   backdrop. Most nights this has happened before. Some nights it has
   **never** happened, and those nights are the ones people will
   screenshot.

**Rule: never fake it.** If a configuration is common, say so. *"The 41st
time"* is honest and still lands; *"unprecedented"* every night is
Co–Star, and it gets caught.

### d. Concordance — what the four traditions each say about *your* places

`INNOVATION.md` §3b: a century of harmonising, unopposed. Robson's *"one
lost system"* line is still being repeated verbatim. **Nobody renders the
disagreement.**

Every mansion carries a match flag. For a given traveler: **how many of
your own placements sit on mansions the four traditions agree about?**
That is a personal, computed, never-before-offered number — and it is
free, because the flags already exist and `reading.js` already refuses to
smooth them.

**Data gap to close first: only 12 of 28 stations currently carry a match
flag (10 STRONG, 2 PARTIAL). Sixteen are unmarked.** The concordance layer
cannot ship until that table is complete, and completing it is a research
pass, not an engineering one.

**And the frame must be visible.** Arabic manāzil are 28 equal segments
usually reckoned tropically in the Western revival; nakshatras are 27
equal segments in a sidereal frame; **Chinese xiu are 28 *unequal*
segments defined by determinative stars and historically measured in right
ascension, not ecliptic longitude.** Two competent practitioners assign
the same chart to different mansions. **The honest instrument shows its
frame and lets you change it.** Asserting a single answer is the one thing
that would get us dismissed by the people we most want reading it.

### e. The Becoming — the moving light

The natal point sitting nearest a mansion boundary, advanced one mansion.
*Justin's Sun is 0.92° from its leading edge — the "door" register, the
tightest there is.*

**Cite the lineage, do not claim invention.** `INNOVATION.md` §2 —
boundary proximity is Vedic *gandanta* and *nakshatra sandhi*;
proximity-means-the-next-unit-is-arriving is **Vimshottari** and
progressed-Sun doctrine. What is ours is the *selection rule* (choose
among Sun/Moon/Ascendant by nearness to an edge, where Hellenistic
selection uses dignity and sect) and **decoupling the advance from time.**
Presented as a synthesis it is defensible. Presented as invention it gets
filed under *made up*.

---

## 3b. How many shards are there — the cardinality

> Justin: *"wouldn't that shard be the whole combo of the 28 and the 12
> sun signs and the moon rising etc.?"*

Composite, yes. **But signs and mansions do not multiply, and that is the
most important structural fact about the shard.**

### Signs and mansions are nested, not independent

A mansion is 12°51′; a sign is 30°. Overlay the two partitions and you do
**not** get 12 × 28 = 336 cells. You get **36** — because their boundaries
coincide at the four cardinal points, so 28 + 12 − 4 = 36 distinct
regions. At step resolution it is **120 cells, not 112 × 12.**

**Knowing your mansion usually tells you your sign for free.** Only **8 of
the 28** mansions straddle a sign boundary (and 8 of the 112 steps). For
the other twenty, the sign is entailed. In information terms the mansion
carries 4.8 bits, the sign 3.6, and the pair carries **5.2 — not 8.4.**

> **The shard does not multiply the chart. It refines it.**

That is the honest version of *same sky, cut finer*, and it is a better
story than a bigger number would have been.

### What does multiply: the three lights

Sun, Moon and Ascendant are genuinely independent — the Moon's elongation
from the Sun is near-uniform, and the Ascendant depends on the hour and
the latitude. **That is where the combinatorics actually live.**

| the shard, by tier | count | bits | share it, of 8.1bn |
|---|---|---|---|
| sun sign | 12 | 3.6 | ~675M |
| sun sign × moon sign | 144 | 7.2 | ~56M |
| **sun mansion × moon mansion — THE ARCHETYPE** | **784** | **9.6** | **~10M** |
| + rising mansion — the shard | 21,952 | 14.4 | ~370k |
| all three at step resolution — the exact shard | **1,404,928** | 20.4 | **~6,000** |

> **675 million people share your sun sign. About six thousand share your
> shard.**

### Why only these three

The other bodies are excluded on principle, not for simplicity.

- **Mercury never exceeds 28° from the Sun; Venus never exceeds 47°.**
  Their mansions are heavily constrained by the Sun's, so they are
  partly redundant — they inflate the state count without adding
  proportional information.
- **The outer planets are generational.** Uranus spends about three years
  in one mansion, Neptune six, Pluto twelve or more. Everyone born in
  those years shares them. They are not personal and must never be part
  of the shard's *identity* — though they remain the backdrop layer
  (§3c, and `PRODUCT.md` §7b's `standingWeather()`).

**Sun, Moon and Ascendant are the only three that are both fast enough to
be personal and independent enough to multiply.**

### The content economics — this is the good news

The archetype tier is compositional, so the writing does not scale with
the combinations:

```
28 sun-mansion passages  +  28 moon-mansion passages  =  56 written
                                                     →  784 archetypes
                            + 28 rising passages      =  84 written
                                                     →  21,952 shards
```

**We have already written the 56.** They are the corpus's
`STATION.n.strike` (the sun's mansion) and `STATION.m.root` (the moon's).
The 784 archetypes exist today; nothing surfaces them.

### Verified, not assumed

Sampled 29,220 moments, 1990–2010:

- **All 784 sun × moon pairs occur.** No dead combinations.
- Near-uniform: **0.103%–0.157%** against an expected 0.128%.
- Sun-mansion frequency ranges **3.43%–3.69%** against 3.57% uniform —
  Earth's orbital eccentricity, real and small.

**One honest caveat that decides where the identity sits.** The Ascendant
is *not* uniformly distributed: birth hours cluster, and at high latitudes
the signs of long and short ascension skew it badly. So the 21,952 and
1.4M tiers are counts of **distinct states, not equally likely ones**, and
a rarity claim at those tiers needs the caveat attached.

**The 784-archetype tier is the one where the mathematics is clean.** That
is the tier to build the named identity on — not merely because 784 is
memorable, but because it is the deepest level at which we can state a
rarity honestly without a footnote.

---

## 4. What must change

**The Traveler types must name the pair, not the difference.**
`INNOVATION.md` §2: our types are a coarser Busteed & Wergin (1974). The
one real difference is that we quantise each light to its own mansion
before subtracting — which puts a person in a different bin **49.9%** of
the time — but our type *names* then discard exactly that information.
Name the pair (*mansion 6 sun, mansion 10 moon*) and the finding is ours;
name only the gap and it is theirs, with noise.

**Correct Seedborn to 3.5%** (measured 3.52%, uniform expectation 3.57%).
`WRITING.md` currently says 3.4%.

**Fix the 27-vs-28 framing.** India has its own 28-nakshatra variant;
Abhijit is Indian. The seam is intra-Indian first.

---

## 5. The lore layer

**Order of operations, and it is not negotiable:**

```
compute the finding  →  rank it by bits  →  select the passage  →  write the prose
```

Lore never generates a finding. Lore **dresses** a finding that already
exists as a number. The archetypes, the epithets, the four traditions'
names — all of that is the *voice* the measurement speaks in.

**The test:** delete every coined word from a shard passage. If a
checkable claim about the reader's sky survives, the passage is sound. If
only atmosphere survives, it is decoration and it gets cut.

---

## 6. Build order

1. **The rarity primitive** — window scan over any transiting/natal pair,
   returning occurrences-before-now, previous, next, lifetime total. Pure,
   testable, no network. **Everything else depends on it.**
2. **The bits table** — Monte Carlo the feature probabilities once, ship
   as a constant.
3. **Co-location** — trivial arithmetic on data we already have, and the
   best demo in the product. **Cheapest win on this list.**
4. **The chart's ranking function** — score, sort, take 5–7.
5. **Complete the 28 match flags** (research pass), then concordance.
6. **Frame switching** — tropical / sidereal, shown not hidden.
