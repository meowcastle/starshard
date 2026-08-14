# UX-FLOW.md — the arrival overhaul

> **⚠ Scope narrowed Aug 14.** This document is now **the first-run flow
> only** — burst → story → entry → compute → the shard, revealed. That
> part still stands, and a paced wizard is correct there because it
> happens once.
>
> **Everything after the first run is superseded by `APP-FRAMEWORK.md`.**
> The returning app is three persistent tabs, not a continuation of this
> sequence. Where this file and APP-FRAMEWORK disagree about a screen a
> returning traveler sees, APP-FRAMEWORK wins.

**v1 · August 13, 2026 · supersedes SIGIL-READING §2's nine-beat
choreography and the arrival half of DESIGN-BRIEF v2 §S1.** For Claude
Design and Claude Code. Everything else — the corpus, the engine, the
formal system — is unchanged. This is about **order, naming, and
pacing**, which is where the current build loses people.

---

## 1. The diagnosis

Three failures, and the first one is mine:

1. **The section labels broke our own anchor law.** `ANCHORS.md` says
   every meaning-carrying moment leads with something the reader already
   knows. The corpus *bodies* obey it — they open on "you're an aries
   sun." But the **headers** say *the strike*, *the root*, *the glow*,
   *the hand*. A first-time reader meets four invented nouns before a
   single familiar one. "What is the strike" is not a question anyone
   should have to ask on screen one. **Those words are now internal-only.**
2. **The front door has no story and no stakes.** The user lands, types
   birth data into a form, and receives text. Nothing bursts. Nothing is
   at stake. The two things that already inspire — the intro animation
   and the runner — prove the product *can* feel like something; arrival
   doesn't.
3. **The surface reads as a journal, not a machine.** Soft, editorial,
   paper-adjacent. It should read as an instrument that is *reading the
   real sky right now* — which is literally what it does.

**The fix in one line:** open with spectacle, hand over one familiar
thing at a time, and never say a coined word before its meaning has
already been felt.

---

## 2. The new first run — seven screens

Phone-first, one thought per screen, thumb-reachable. Times are targets.

### 0 · THE BURST *(~8–12s, first visit only; ~2s after; always skippable)*

Black. One point of light, breathing. It goes — a silent beat, then the
star bursts into thousands of drifting shards that scatter, slow, and
settle into the actual night sky. The last shard drifts toward the
viewer and holds.

Copy, one line at a time, timed to the burst:

> **the sky paints stories.**
> **shards are born every second.**
> **one of them is on its way to you.**

*(Skip control visible from second 1. Never trap anyone.)*

### 1 · THE ARRIVAL *(story, ~15s)*

The settled starfield. Slow drift. Copy, big, three beats:

> a star broke apart a long time ago and became everything —
> the iron in your blood, the calcium in your teeth, the water you
> drank this morning.
>
> **that part is not mythology. it's physics.**
>
> the rest of this is the story humans built on top of it, for four
> thousand years, on every continent, looking up.

*(This is the truth-floor doing its job at the front door instead of
buried in the grimoire. It is the single most credible thing we own and
it costs nothing to say early.)*

### 2 · HOW THIS WORKS *(the credibility screen — before we ask for anything)*

Justin's call: this lands **before birth entry**, so we earn the data
before we request it. Terminal-plain, four short lines with real names:

> **star shard reads four sky-maps at once.**
>
> `ARABIA` — the 28 waystations of the moon, mapped by desert
> astronomers who navigated by them
> `INDIA` — the same sky, cut differently: the nakṣatras and what each
> one wants
> `CHINA` — the same stars again, each kept by an animal and a planet
> `EUROPE` — the zodiac you already know your sign in
>
> and one thing that isn't a sky-map at all: **the changes model** —
> the three-thousand-year-old idea that anything real contains the seed
> of what it's turning into. that's why your reading has a second half.
>
> we compute all of it from the actual position of the sun and moon at
> the minute you were born. **no quizzes. nothing is sent anywhere.**

### 3 · THE ASK *(birth entry)*

Instrument-panel, not a form. Date, time (optional, and *say* what it
unlocks), place. One line of reassurance in monospace:

> `computed on this device · never uploaded`

### 4 · THE COMPUTE *(~3–4s, and worth every millisecond)*

Do **not** hide this behind a generic spinner. Show the machine working
— a live terminal readout that is telling the truth:

```
> resolving sky over chicago · 12 apr 1998 · 21:14
> sun ......... 23.0° aries
> moon ........ 5.6° scorpio
> horizon ..... scorpio rising
> phase ....... full
> cross-referencing 4 sky-maps ...
> ✦ shard found
```

This is the single cheapest credibility win available. People believe
what they watch get calculated.

### 5 · THE SHARD *(the reveal)*

The ring draws itself, natal marks ignite, and the handle lands:

> **farbank of the bearer**
> aries sun · scorpio moon · scorpio rising · born under a full moon

Then one strange line, and one button: **`read your shard →`**

### 6 · THE READING *(§3 — progressive, sign-first)*

---

## 3. The reading, re-ordered and re-labelled

**The law: a section header may only contain words the reader arrived
knowing.** Coined names are earned later, in the codex, if ever.

| # | Old header | **New header** | Opens with |
|---|---|---|---|
| 1 | *the strike* | **your sun is in aries** | what an Aries sun *is*, plainly — then what almost nobody knows: which stretch of Aries |
| 2 | *the root* | **your moon is in scorpio** | what a moon sign is, in one sentence, before anything else |
| 3 | *the glow* | **you were born under a full moon** | needs no explanation at all — that's the point |
| 4 | *the hand* | **you arrived on a sunday** | the day, its planet, why the old world thought that mattered |
| 5 | *the facing* | **scorpio was rising** | one plain sentence on what a rising sign is |
| 6 | *the answering star* | **the sky opposite you** | the birthday-full-moon fact, stated as the wonder it is |
| 7 | *the gait* | **how you walk** | the synthesis — the type name lands here, *derived aloud* |
| 8 | *the becoming* | **what you're turning into** | the changes model, cashed |

**Every section opens with a one-line "what this is" before it says
anything specific about the reader.** Example, section 1:

> **your sun is in aries.**
> that's the one you already know — the sign everybody means when they
> ask. it's the sky the sun stood in the day you were born, and it
> describes the part of you that *does* things.
>
> here's the part almost nobody knows. the sun crosses more than two
> skies while it's inside aries, and yours was the second one…

That two-sentence preamble is the whole onboarding strategy. It costs
30 words per section and it converts a stranger into someone standing
on familiar ground before we take them anywhere new.

**Progressive depth within each section** — three tiers, revealed by
scroll or tap, never all at once:

1. **the plain fact** (sign + one sentence anyone can repeat)
2. **the specific reading** (the corpus body — the real content)
3. **`where this comes from ▾`** (collapsed: the Arabic name, the
   nakṣatra, the guardian animal, the star names — the scholarship, for
   the people who want it, invisible to those who don't)

Tier 3 is where *al-Buṭayn*, Bharaṇī, the pheasant and Saturn live. Not
gone — **demoted to opt-in.** That single move fixes the overwhelm.

---

## 4. The landing — the realization

The reading must end on **recognition, not information**. Structure:

1. **The synthesis** (§3 row 7) names the type as a deduction the reader
   watched happen.
2. **The tension**, named with its real cost — the corpus already does
   this and it's the strongest writing we have.
3. **The confirmation beat** — new, and the point of the whole flow. One
   short screen, big type, no ornament:

> you probably already knew most of this.
> that's not a trick — it's the point.
> the sky didn't tell us who you are. it gave us somewhere to look,
> and you were already there.

4. **Then, and only then, the invitation:** the ring is mostly dark; the
   moon crosses one station a night; tonight's is *The Gathered Stars*.
   `come back tonight →`

---

## 5. Visual direction — CRT / terminal starfield

Approved: **dark-first instrument panel**, not paper. The current
DESIGN-SYSTEM palette survives; its *application* inverts.

- **Ground:** near-black (deepen `edge-dark`/`teal-900` toward true
  black for the arrival sequence). The cream becomes *ink on
  instruments*, not the page.
- **Light:** `teal-500` as phosphor glow; `pink-500` as the alert/accent;
  `butter-200` for foil and highlight (it's the only accent that clears
  contrast on dark — DESIGN-SYSTEM's own finding).
- **Type:** Baloo 2 keeps the headline warmth so it stays cute rather
  than cold; **monospace for every number, coordinate and readout.** That
  contrast — soft display type + hard machine numerals — *is* the
  futuristic-retro voice.
- **Texture:** scanlines and phosphor bloom, used sparingly (accessibility:
  must be disable-able, and never behind body copy). Chunky pixel edges
  on soft vector art. No paper grain, no serif body, no journal ruled
  lines — those are what read as "journal."
- **Motion:** everything arrives by *drawing itself* — rings trace,
  readouts type, marks ignite. Nothing fades in. Respect
  `prefers-reduced-motion` with instant-draw fallbacks.
- **The ring is the hero object** at every stage.

---

## 6. What changes for each side

**Claude Design:** screens 0–6; the terminal compute readout; the
three-tier disclosure component (the `where this comes from ▾`
collapse); the dark-mode inversion of the design system; the burst
animation (reuse the existing intro animation's DNA — it already works).

**Claude Code:** the section-id → label map below; expose the compute
readout's real values (they exist already — don't fake them); persist
"has seen the burst" so first-run vs return is distinguishable; feed
tier-3 data (Arabic name, nakṣatra, animal, keeper, stars) as structured
fields rather than baked prose.

```js
// section labels — the ONLY strings a first-time reader sees as headers
SECTIONS = [
  { id:'strike',    label:'your sun is in {sunSign}' },
  { id:'root',      label:'your moon is in {moonSign}' },
  { id:'glow',      label:'you were born under a {phaseName}' },
  { id:'hand',      label:'you arrived on a {weekday}' },
  { id:'facing',    label:'{risingSign} was rising' },
  { id:'answering', label:'the sky opposite you' },
  { id:'gait',      label:'how you walk' },
  { id:'becoming',  label:"what you're turning into" },
];
```

**Content (me):** eight "what this is" preambles (~30w each), the burst
and arrival copy above, the how-this-works screen, the confirmation
beat, and tier-3 microcopy. Roughly 900 words — small, and it is the
difference between a stranger bouncing and a stranger staying.

---

## 7. What this does not change

The corpus bodies (all 13k words stand), the engine, the formal system,
the Becoming, the ethics floor, the privacy invariant, the vocabulary
law — in fact this *strengthens* the vocabulary law by extending it from
body copy to headers, where it was leaking. Coined vocabulary is now
**earned or internal, never introductory.**
