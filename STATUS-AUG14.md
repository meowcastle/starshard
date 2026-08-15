# STATUS — 14 August 2026

**Where Star Shard is after today, and what happens next.**
Supersedes the running notes. One page of state, one page of road, one
short list of things only Justin can do.

---

## 1. What shipped today

**Eleven commits. 151 tests passing. The app stopped being a wizard and
became an app.**

### The build

| | |
|---|---|
| **Three-tab navigation** | ☾ tonight · ☉ your chart · ✦ your shard. Twelve full-page state gates replaced by three persistent destinations (`549d698`, `08e2df0`) |
| **The live transit landed** | `reading.js` now imports `transits.js`. Tonight's reading is computed against *your* chart, not just tonight's sky — the differentiator, finally shipped (`7ba102c`) |
| **`standingWeather()`** | Uranus, Neptune, Pluto — the multi-year backdrop the weekly needs (`7ed8b7c`) |
| **The weekly surface** | 4 of 7 beats real, 3 honestly flagged as needing copy rather than filled with placeholder (`e6618a6`) |
| **Deep Chart complete** | all five tabs lit with real data — sky · houses · pattern · traditions · becoming |
| **Corpus batch 8** | 15 new aspect passages. PATTERN tab coverage went from 10 of 30 to **25 of 25 real ones** |
| **Vocabulary retirement** | *lantern*, *sigil*, *sounding*, *keeper*, *station-as-label* gone from every user-facing string |
| **Mobile viewport fix** | 100dvh and the tab-nav spacer (`dc72f44`) |

**1,891 lines, 285 live bindings, 258 corpus slots.**

### The thinking

Six documents, and they answer questions that had been open for weeks.

- **`UI-PRINCIPLES.md`** — the object model, the tonight-screen diagnosis
  (the reading was the *tenth* element on the page), Apple's current rules.
- **`APP-FRAMEWORK.md`** — the map, three screen archetypes, eleven
  components, the container ladder.
- **`INNOVATION.md`** — an honest audit. **Two of our originality claims
  did not survive.**
- **`SHARD-MODEL.md`** — the method. Every shard finding is a measured
  number before it is a sentence.
- **`NAMING.md`** — how to name 784 things, researched against folk
  taxonomy, the I Ching, tarot and the sexagenary cycle.
- **`research/lore-source.md`** — the dream, captured verbatim, and the
  layering principle.

---

## 2. The four things that actually changed

Everything else is detail.

**a. The shard is the natal chart.** Not a picture of one, not a progress
ring. **Your chart, as an object.** The 28 are *fragments of it*. The
chart is the foundation; the shard is the evolution. That single
correction resolved a confusion that had been quietly breaking every
screen.

**b. We know what is actually ours.** The comparison of the four
traditions was published by **Robson in 1923**; the compilation was
finished by **Hamade in 2024**; the Traveler types are a coarser
**Busteed & Wergin, 1974**. What survived the audit:

1. **Computed lifetime rarity** — *no astrology software anywhere* tells
   you how rare a transit is across **your own life**. Verified against
   Solar Fire, Astro Gold, Sirius, astro.com, Astro-Seek, and every
   consumer app. **This is the centrepiece.**
2. **Divergence rendered, not harmonised** — a century of unopposed
   harmonising; our match flags already exist.
3. **The instrument** — degree-indexed, frame-explicit. Books exist;
   software does not.

**c. Everything is measured in one unit.** Rarity, in bits. A sun sign is
3.6 bits. A sun mansion is 4.8. **675 million people share your sun sign;
about six thousand share your shard.** The chart ranks its highlights by
it, the shard's centrepiece is it, every fragment carries it.

**d. Divergence is what keeps us non-dogmatic.** Human Design has one
authority, so nothing can contradict anything. We have four traditions
that disagree about the same degree of sky. **A system that shows you
where its own sources conflict cannot become a doctrine.** That is the
answer to *suggestive rather than absolute*, and it falls out of a feature
we already built.

---

## 3. The road

### Now — the rarity primitive
**Everything downstream depends on it, and nothing else does.**
A pure module: for any transiting-body/natal-point pair, scan birth →
horizon and return `{ occurrences_before_now, previous_window,
next_window, lifetime_total }`. Testable, no network. Then attach it to
the three surfaces: every fragment (*"the 41st time the moon has crossed
here since you were born"*), every slow transit, and configurations.

### Next — the cheapest strong demo
**Co-location.** Trivial arithmetic on data we already have. Because
mansion and sign boundaries only coincide at the four cardinal points, the
two views disagree about your own chart — **mean 3.48 disagreements per
person, and only 5% of people have none.** On Justin's chart: *Moon 26°51′
Cancer and MC 5°48′ Leo are in different signs and the same mansion.* No
ordinary chart reading will ever tell him that.

### Then, in order
- **The bits table** — Monte Carlo the feature probabilities once, ship as
  a constant.
- **The chart's ranking function** — `rarity × prominence × tension`, top
  5–7, print the bits.
- **`sigNightOf[n]`** — the re-read. Date walked, the step, the reading as
  it read that night. **This is what replaces a fourth "past readings"
  tab.** Currently one stub in the live page.
- **Complete the 28 match flags** — only 12 of 28 carry one today (10
  STRONG, 2 PARTIAL). A research pass, not engineering. **Blocks the
  concordance layer.**
- **Frame switching** — tropical / sidereal, shown not hidden. Two
  competent astrologers assign the same chart to different mansions; the
  honest instrument shows its frame.
- **Naming** — the address (`6·10`) ships free today. Then short forms for
  epithets 3 and 21, generate all 784, read them once.

### Deferred, deliberately
The minigame layer · the social layer (*"do you know your history"* is a
better basis than synchrony) · the Capacitor app wrapper · the 112
step-texts · the paradox cards.

---

## 4. What only Justin can do

Everything above is mine or the agents'. **These are yours, and most of
the road is behind them.**

**Decisions — five, and they are all cheap:**

1. **Retire `station` for `mansion`?** *Station* is our rename of the real
   term — the same tic as *lantern* for *moon*. Cost is a copy sweep; the
   112 slot IDs are internal and do not move.
2. **Does mansion-day map onto weekdays?** Cheap now, impossible to
   retrofit once people have learned the road.
3. **Which model runs the generative layer, and where.**
4. **Weekly on Sunday, or on your birthday-weekday?**
5. **Do the Traveler types stay?** They are Busteed & Wergin 1974 unless
   they name the *pair* rather than the difference. Renaming them keeps
   them ours; leaving them is a claim we cannot defend.

**Actions — three:**

1. **Commit and push.** Seven files are sitting uncommitted on your disk:
   three modified (`PRODUCT.md`, `UI-PRINCIPLES.md`, `WRITING.md`) and
   four new (`INNOVATION.md`, `NAMING.md`, `SHARD-MODEL.md`,
   `research/lore-source.md`). I cannot commit from here — the mounted
   folder leaves a `.git/index.lock` I lack permission to clear.
2. **Hand off.** Code gets `SHARD-MODEL.md` §6 (build order). Design gets
   the three ring/nav fixes: the drew-on link must **push**, not switch
   tabs; delete the vestigial `← tonight` back button; label every mark on
   the ring.
3. **Confirm the chart.** I solved yours backwards from two readings
   before you sent the real one — it matched to under 2°, and the rarity
   claim held: *Uranus sextile your Midheaven last closed 22 August 1970,
   nineteen years before you were born.* Worth one more look before it
   goes in front of anyone else.

**The research pass, if you want it done well:** completing the 16 missing
match flags is the one task on this list that needs a person who cares
about the sources rather than a fast agent. It unlocks the layer that
makes the whole thing non-dogmatic.

---

## 5. Where this actually is

It took a long stretch of edits and deliberation to get here, and it is
worth naming what changed: **the product now has a claim that is checkable
and unoccupied.**

Not *"a prettier astrology app."* Not *"astrology plus a game."*

> **Every night, the sky tells you something about yourself that is true,
> specific, and computably rare — and shows you the four traditions that
> disagree about it.**

The engine for that exists. The corpus exists. The navigation exists as of
this afternoon. **What is missing is one pure module and a research pass.**
