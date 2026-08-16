# APP-FRAMEWORK.md — the map, the archetypes, the kit

**v1 · August 14, 2026.** Binding on Claude Design. `UI-PRINCIPLES.md` is
the *why*; this is the *what to build*. Read that first — this assumes it.

> Justin, Aug 14: *"we still need clarity on the dashboard and flow of the
> app. Right now we don't have one and the flow isn't working."*

---

## 1. Why the flow isn't working

The app has **twelve full-page `sigIs*` gates and no persistent chrome.**
Every screen swaps the entire page. There is no tab bar, no back stack, no
element that survives a transition.

```
S0  burst      → 3 states     S2a tonight    ⇄ this week
S0b story      → 4 states     S2  profile    → 5 tabs
S0c how                       S2c push
S1  entry                     S3  sounding   → 5 states
A2  compute                   S2b share
```

That is not an app. **It is a wizard machine** — a linear sequence where
you are always somewhere with exactly one way forward. It explains both
complaints at once: there is no dashboard because there is no *place*, and
the flow doesn't work because there is no *map*.

Frank Rausch's taxonomy names the two things we're missing. **Flat
navigation** — a persistent bar where *"each section maintains independent
navigation state"* — and **drill-down**, which is *"stateless and
modeless."* We have neither. We have embedded step-by-step navigation,
which Rausch says to use for wizards, with the explicit caveat: *"if you
expect users to perform the process frequently, consider merging the steps
into a single view."*

---

## 2. We do not want a dashboard

This is worth arguing, because "dashboard" is the intuitive word and the
evidence is against it.

NN/g's definition is narrow: dashboards suit users who must **monitor**
information and **respond swiftly**, and the two legitimate kinds are
operational and analytical. Both are *jobs*. **If there is no decision the
numbers change, a dashboard is decoration.**

The field evidence is one-directional:

- **Oura went the other way.** Five tabs — Home, Readiness, Sleep,
  Activity, Resilience — collapsed to three. Their PM, verbatim: *"We
  wanted to make the Today tab like the 'Top Stories' page of a news
  app."* The dashboard survived, **demoted to tab 2.**
- **Fitbit's dashboard home drew sustained backlash** — cluttered despite
  the stated intent to simplify.
- **Apple, WWDC22, on this exact question:** *"Never use 'Home' as a
  catchall… If this is your app, consider removing the Home tab
  altogether. The redundancy of features prohibits people from
  understanding where things belong."*
- **Every Apple Design Award winner in our shape is a reduction story.**
  grug (2026, Delight) has *zero navigation* — one wisdom a day, no
  archive, by design. Moonlitt (2026, Interaction) has *no tab bar* — one
  resolved object and a bottom toolbar. Gentler Streak's root is an
  interpretation, not a number: *"Statistics are just numbers. Without
  knowing how to interpret them, they are meaningless."*

The useful distinction the research yields:

| | shows | right when |
|---|---|---|
| **Dashboard** | state, simultaneously | the user has a monitoring job with a response |
| **Digest** | a ranked, truncated set of doorways | several things matter, but their order changes daily |
| **Single-object home** | one resolved thing | exactly one thing is true right now |

**The failure mode is shipping a dashboard while believing you shipped a
digest.** Tonight is a single-object home. One reading is true tonight.

---

## 3. The map

Three content types, three destinations, **one level to everything.**

```
┌──────────────────────────────────────────────────────────────┐
│  FIRST RUN  (once, linear, no chrome — a wizard is correct)   │
│  burst → story → entry → compute → your shard, revealed       │
│                                        └→ the nightly reminder│
└──────────────────────────────────────────────────────────────┘
                              ↓  lands in the app, and never leaves it

┌───────────────┬───────────────────┬──────────────────────────┐
│  ☾  TONIGHT   │  ☉  YOUR CHART    │  ✦  YOUR SHARD           │
│  the reading  │  the document     │  the 28, and the record  │
├───────────────┼───────────────────┼──────────────────────────┤
│ single-object │ reference         │ collection               │
│ tonight/week  │ sky · houses ·    │ ring · 12 of 28 ·        │
│ push ↓ to the │ pattern ·         │ tap a lit station → the  │
│ named         │ traditions ·      │ night you walked it      │
│ placement     │ becoming          │                          │
└───────────────┴───────────────────┴──────────────────────────┘
        share ⤴ modal            search ⤴ modal
```

**Why three, and why these three.** The depth-vs-breadth literature
(Landauer & Nachbar 1985 onward) consistently favours breadth — but
Burnett et al. (2013) supplies the condition that matters: **breadth wins
only when the menu is *structured*, i.e. the user can predict where things
are.** Three fixed, permanently-present, clearly-different content types
is the structured case. It is also, independently, the shape Oura arrived
at after abandoning five.

**Why the chart is a tab and not a push.** The test from the field:
*is it visited for its own sake, and does it need its scroll position
preserved?* Flighty's Passport and Oura's My Health are tabs for exactly
this reason; Things' Logbook is a push because nobody opens it daily.
Ours is opened for its own sake — it is the buy-in and the share.

**Why there is no fourth tab, and this is the important one.** Past
readings are the trap. Apple Journal shipped a reverse-chron feed as its
root with no way to browse — *"no tags, no folders, no compact view, and
no way to browse by date"* — and had to retrofit search and an Insights
page in iOS 18. A feed home is **a capture optimum and a retrieval
pessimum**: free on day 1, ruinous on day 400.

We avoid it because of §0 of `UI-PRINCIPLES.md`. **The shard is the
collection *and* the archive.** Twenty-eight segments; each lit one holds
the night you walked it. Tapping a segment is how you re-read. That
collapses what would have been a fourth destination into an object we
already have, and it gives the collection a **progress denominator**
(*12 of 28*) that feed-shaped content can never have.

Day One does the complementary move worth stealing: its Today view folds
in *"On This Day"* entries from previous years, so the archive earns its
keep daily instead of waiting to be visited. Once we have a second cycle
of data, **tonight's screen should carry one line: *last time the moon
crossed here, you wrote ___*.** That is a database query, not a model
call, and the retention research says it lands harder than anything
generated.

### What is a tab, a push, a sheet

| | rule | ours |
|---|---|---|
| **Tab** | a different *kind* of content with its own hierarchy and preserved state | the three above. Nothing else, ever |
| **Push** | a more specific view of what you're already looking at; chevron implies it; tab bar stays anchored | reading → the placement it drew on; shard → one station; chart section → one house |
| **Sheet** | a self-contained detour you return *from*. It covers the tab bar by design | share, search, settings, sign-in. **Nothing you return *to* is a sheet** |

Three more rules, all from Apple:

- **Never name a tab "Home."** Name it the content. Oura named it *Today*;
  Flighty named it *My Flights*.
- **Never switch tabs programmatically.** This has one live violation:
  tonight's drew-on link binds `sigToChart`, the same handler as the tab
  bar. It must become a **push** onto tonight's stack instead.
  **Never switch tabs programmatically.** *"Transporting someone to
  another tab by tapping on an element within a view is jarring and
  disorienting."*
- **The tab bar is persistent** — except under a modal, which is the one
  sanctioned exception.

**The first run is the exception, and it should be.** No chrome, linear,
a wizard — because it happens once. `UI-PRINCIPLES.md` §2's rule holds:
ceremony scales inversely with frequency. The burst and the story are
correct exactly once and wrong on night two.

---

## 4. Three screen archetypes

This is the part that stops every new screen being invented. Every screen
in the app is one of these three, and the archetype dictates the order.

### A · READING — prose is the content
> tonight · a station's passage · a house passage · the weekly

```
page header      eyebrow (date//context) · title
prose            ONE measure. No container. Body size.
                 This is the content — nothing may sit above it
link down        one, specific, naming its source
─────────────    (separator, not a card)
section          supporting material, in rows
```
**Laws.** No cards. Hierarchy comes from type and space only. Exactly one
prose measure per screen. If a second block of prose needs a container to
be distinguishable, the hierarchy is wrong.

### B · REFERENCE — rows are the content
> your chart and its five sections

```
page header      title (+ segmented control if lensing the same objects)
section          header · rows(1–n)
section          header · rows(1–n)
empty state      required for every section that can be empty
```
**Laws.** Rows, not cards — NN/g: cards *"deemphasize the ranking of
content,"* are *"less scannable than lists,"* and *"take more space."*
Homogeneous content is a list. Disclosure chevron **only** where it
navigates.

### C · COLLECTION — the object is the content
> your shard

```
hero object      the ring, lit to state. Large. Centred
progress         12 of 28 · monospace
grid or list     the 28, lit and dark, each tappable
empty state      before the first walk
```
**Laws.** The hero is the largest thing on screen. Dark stations are
visible, not hidden — the incompleteness is the mechanic. Tapping a lit
one pushes to the night you walked it.

---

## 5. The kit — eleven components, and no twelfth

Named after what they are. No atoms, no molecules — at eleven components
that taxonomy has nothing to organise, and Brad Frost himself now says
*"the specific labels have never been the point."*

| # | component | purpose (one sentence) | don't use when → instead |
|---|---|---|---|
| 1 | **Screen** | One of the three archetypes above. | — |
| 2 | **Page header** | Eyebrow + title + at most one action. | you want a second action → toolbar |
| 3 | **Section** | The only legal way to group rows. | there's one row → plain Row |
| 4 | **Prose** | Body-size text at one measure, no container. | it's a label/value pair → Stat |
| 5 | **Row** | Leading label, trailing value, optional chevron. | it's tappable as a whole *and* heterogeneous → Card |
| 6 | **Stat** | A computed value with its label. | the value is prose → Prose |
| 7 | **Card** | A heterogeneous unit tappable as a whole. | content is homogeneous → Section of Rows |
| 8 | **Badge** | Status or type, one word. | it's decoration → delete it |
| 9 | **Primary action** | The one thing to do here. | there are two → one is secondary |
| 10 | **Sheet** | A detour you return from. | you return *to* it → Tab or Push |
| 11 | **Empty state** | What this looks like before it's true. | never — every collection needs one |

**Every prohibition names its replacement.** A "don't" without an
"instead" gets ignored — this is why GOV.UK's component pages always say
*"For those use a `<table>`, `<ul>` or `<ol>`."*

**The gate for a twelfth:** it must appear **three times** in real
screens, and it must fail the "Unique" test against all eleven above.
Speculative components don't get built.

---

## 6. The layout grammar

### The one rule that fixes most incoherence

> **Internal ≤ external.** The space *around* an element must be greater
> than or equal to the space *within* it.

Corollary, and this is the version to check against: **space between
sections > space between rows > space between lines.** If that ordering is
ever violated, the grouping is wrong — and no card will rescue it.

### The scale

`4 · 8 · 12 · 16 · 24 · 32 · 48`. Ship it as tokens the layout can only
accept from — that single move is what ends invented padding.

**Do not build a baseline grid.** Apple's own leading values are 41, 34,
28, 25, 22, 21, 20, 18, 16, 13 — not on an 8pt rhythm — so a hard baseline
grid is **actively incompatible with Dynamic Type.** Space between blocks;
let text set its own leading.

### The container ladder — use the weakest thing that works

1. **space** ← Apple lists negative space first, before shapes and colour
2. **type role** (size + weight)
3. **colour tier** (`label` → `secondaryLabel` → `tertiaryLabel`)
4. **separator**
5. **section header**
6. **background shape**
7. **card** ← only if heterogeneous *and* tappable as a whole

**The test: delete the card. If the content still parses, the card was
decoration.**

### Seven type roles, and everything else is illegal

Mapped onto Apple's Dynamic Type so we inherit the scaling for free.

| role | style | used for |
|---|---|---|
| Screen title | Large Title 34 | one per screen |
| Section head | Title 2 22 | archetype A section breaks |
| Row title | Headline 17 semibold | archetype B |
| **Prose** | **Body 17** | **the reading. The most important role** |
| Secondary | Subhead 15 | annotation under prose |
| Eyebrow | Footnote 13 | date, context, section labels |
| Numeric | Caption 1 12 mono | degrees, counts, countdowns |

Two weights only — Regular and Semibold. **Never Ultralight, Thin or
Light**; Apple: *"difficult to read, especially at small sizes."*
De-emphasise with colour tier, never with thinness.

---

## 7. Dark-first, honestly

**The debt we're taking on.** Piepenbrock et al. (2013) found light mode
outperformed dark on visual acuity and proofreading, in both younger and
older adults, and **the advantage grows as text gets smaller**. Users did
not perceive the difference; it was there anyway. NN/g still recommends
dark mode for long-form reading apps — so dark-first stands, but **the
deficit is paid back in type**: larger body size, generous leading, no
light weights, and a light option retained.

**No shadows.** They're a light-mode mechanism — a dark shadow on a dark
ground carries no information. Elevation comes from **surface steps**:

| token | use |
|---|---|
| `surface-base` | the page |
| `surface-raised` | grouped content within it |
| `surface-overlay` | sheets and menus |

Each step 5–8% luminance. This maps directly onto Apple's
`systemGroupedBackground` set, which is already dark-tuned and
contrast-tested — map onto it semantically rather than rebuilding it.

**Colour.** Accents get **lighter and less saturated** on dark, not more —
saturated colour on a dark ground creates optical vibration. Body text
off-white, never pure white; ground tinted, never pure black. Contrast
floor 4.5:1, and Apple asks for **7:1 on small text**.

**Liquid Glass sits above all of this.** Our identity is the *content
layer*, which is exactly where Apple permits it — *"Don't use Liquid Glass
in the content layer"* is a rule about chrome. So: **the tab bar is
system.** Don't style it. `tabBarMinimizeBehavior(.onScrollDown)` gets it
out of the way while reading, for free.

---

## 8. What Design does first

1. **Build the tab bar.** Three tabs, system-styled, persistent. This one
   change converts a wizard machine into an app.
2. **Rebuild tonight as archetype A** — reading first, one link down,
   the claim as a receipt. `UI-PRINCIPLES.md` §2c.
3. **Collapse the five sounding beats into that one screen.** Keep the
   paced version for the four special crossings only.
4. **Make the shard a destination**, not the end of a wizard. Ring, *12 of
   28*, the grid, and a lit segment pushes to the night you walked it.
5. **Delete every `beat N ·` label**, and apply the five ring→shard string
   swaps.
6. **Then** publish the eleven components with a one-sentence purpose and
   a "don't use when → instead" line each. Not before — write them from
   screens that exist, never speculatively.
