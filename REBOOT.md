# The Moonroad — Star Shard's bespoke cosmology

**The reboot architecture.** August 12, 2026 · built on `research/iching-model.md`
and `research/rave-mandala.md` · supersedes the four-shard product structure;
keeps the engine, the corpus, the ethics floor, and the voice.

---

## 0. The diagnosis, stated once

The current product is four borrowed traditions in four windows — a buffet.
Each dish is well-researched; nothing *generates* anything. There is no grammar
to learn, no reason shard #12 relates to #13, no move a user can make except
"read another paragraph." A game you're excited to maintain and learn from
needs what the I Ching has and we don't: **a small alphabet, a composition
rule, and a change operator** — so that literacy, not collection, is the game.

The research says this is buildable, and most of the machine already exists.
What follows is one system: one wheel, one grammar, one cast, one fiction.

---

## 1. The fiction (told first, because everything hangs on it)

*Manāzil al-qamar* literally means **the way-stations of the moon** — the
stopping-places on the moon's road. The fiction was inside the etymology the
whole time:

> **You are a star-seed** — a traveler sown from the sky. The sky you fell
> from shattered into 28 waystations strung along one road: **the Moonroad.**
> Every night the Moon — the Lantern — walks it, one station per night, all
> 28 in a month, forever. Your birth minute is the moment your seed struck
> the road: the stations the Sun and Moon stood in, the light the sky held,
> the hour's keeper — that's your **Sigil**, the mark of where you landed.
> The daily practice is walking the road with the Lantern. The codex teaches
> you to read it. The runner *is* the road.

Note what this does to the two things that already work: the **intro
animation** becomes the seed falling / the sky shattering into the 28 — the
myth's opening scene. The **side-scroller** stops being an easter egg and
becomes the literal metaphor made playable: running the road between
stations. And the Win95 chrome survives as fiction too — the interface is
your **receiver**, the little terminal a star-seed uses to read the sky.
Retro-futurist, not retro-nostalgic.

The honest origin myth — the inversion of Ra Uru Hu's "Voice" (research
lesson #9): **"No voice in the night. Four old maps, one real sky, one new
road."** Our provenance — documented sources, verifiable astronomy, published
math — *is* the mythology. It's also the only origin story that can't
collapse.

---

## 2. The grammar

### 2.1 The alphabet (15 concepts generate everything)

| Atom | Count | What it is | Source |
|---|---|---|---|
| **Skies** (courts) | 4 | the four quarters of the wheel — the four legs of the voyage | the four quadrant-spirits (Azure Dragon etc.), reskinned |
| **Keepers** (roads) | 7 | the seven luminaries; each station belongs to one, cycling 7×4 through the 28 | the canonical xiù luminary cycle `[VERIFY exact per-station order from the HandWiki table]` — and it meshes with the weekday system we already built |
| **Steps** (facets) | 4 | each station divides in four; the Moon crosses one step in ~6 hours | nakshatra pādas precedent (27×4); position-is-meaning |

**Shard = Station × Step.** 28 × 4 = **112 shards** — the large bespoke
symbol space, every unit anchored to the verified corpus. A user who learns
4 Skies + 7 Keepers + 4 Steps (15 ideas) can *derive* a reading for any of
the 112 — I Ching principle #1 (small alphabet, deep composition) and #2
(morphemes → sentences). "The Void, entering, under Saturn's keeping, in the
Deep Sky" is a *sentence*, and after a week a user can parse it unaided.
That is the game.

The four Steps carry position semantics (principle #5) — the same station
means differently by step:

- **Entering** — the threshold reading: what this station asks as you arrive
- **Dwelling** — the station's full voice; its center
- **Turning** — the pivot: what changes here
- **Leaving** — the gift you carry out

Birth time finally *matters* — the Moon crosses a step in ~6 hours, so the
natal Moon-shard is time-sensitive in a way the current product never was.
(Unknown birth time: the honest fallback is station-only, no step — same
policy as houses today.)

### 2.2 The topology (principle #6: internal echoes)

Every shard is formally connected to others, and every connection is *real
astronomy*, not decoration:

- **The Farlight** — the station 14 away (180° opposite). Real hook: **your
  birthday full moon always falls in your Farlight station** — the sky
  itself pairs you with your opposite every year. (This is our clean,
  non-infringing analogue of HD's Sun/Earth complement — derived from the
  actual geometry of full moons, which nobody owns.)
- **Road-kin** — the 3 other stations under your Keeper (the 4 Jupiter
  stations, etc.)
- **Sky-siblings** — the 6 other stations in your Sky
- **The neighbors** — stations ±1: where the Lantern came from and goes next

Readings can travel these edges ("your Farlight is The Heart — the station
that answers yours"). The corpus stops being a flat list of 28 and becomes a
connected world.

### 2.3 The change operator (principle #3 — the one that makes it the Changes model)

The I Ching fakes motion with randomness. **We don't have to — the Moon is
actually moving.** Every cast is computed from the Lantern's real position
and real velocity:

- Mid-step → a **steady cast**: one shard, read in place.
- Within the final quarter of a step (~90 min) or of a station (~6 h) → a
  **turning cast**: the reading is a pair — *present shard → becoming
  shard* — the two-hexagram narrative arc, generated by the actual sky.
- Exactly at a boundary (rare, minutes-wide) → a **threshold cast**, with
  its own text — principle #11: rare configurations get special content.

Tuned texture (principle #4): steady : turning ≈ 3 : 1, matching the I
Ching's stability bias — change is eventful, not constant. And the rarity is
honest: the sky decides, and anyone can check.

### 2.4 The Currents (the nine relations — already built)

`sky.js`'s tārābala engine becomes the **nine Currents** — the relation
between your natal station and today's, the day's weather *for you
specifically*: working names — Homecoming, Windfall, Crosswind, Haven,
Undertow, Ascent, Stillwater, Companion, Kindred. (Stillwater is the
sit-quietly day, per the no-doom rule.) Two users standing at the same
station on the same night get different Currents — personalization from
grammar, not from templates.

### 2.5 The Lights (the eight — already computable)

The moon's phase is the sky's **Light** — the global state every traveler
shares that night (the Wordle property: everyone gets the same moon). Your
natal Light (birth lunation phase) is the eighth line of your Sigil.

---

## 3. The Cast — one protocol replaces four windows

**The Sigil** (natal, computed once, drawn as a constellation-glyph — this
is the shareable chart artifact, our answer to the bodygraph *in function
only*):

1. Sun station + step — *where your seed was struck* (the day-side of you)
2. Moon station + step — *where your seed took root* (the felt side)
3. Your Light — the birth lunation phase (initiator / perfecter / distiller…)
4. Your Keeper — the birth-day's luminary (the weekday system, absorbed)
5. Rising station (time known) — *the direction you face on the road*
6. Your Farlight — derived, free, always listed

The four old shards don't die — they fold in as the **four depths of one
reading**: houses = the Sun's standing, archetype = the Moon's mirror,
mansion = the station itself, hearth = the Keeper. Same corpus, one spine.

**The Sounding** (daily, ~90 seconds — replaces today.exe):

1. Tonight's shard (station + step) — where the Lantern stands
2. Steady / turning / threshold — and the becoming-shard if turning
3. Your Current — the day's stance for you
4. The Light — the sky's shared state
5. The claim — tonight's card, if unclaimed
6. The close — "that's tonight's road. walk it well." (session-end signal,
   per the ethics floor)

Counsel frame throughout (principle #10): every text is image + stance —
"what does this night favor" — never prediction. The corpus voice we already
built ("maybe luck is just an open space…") is exactly this register; the
writing survives the reboot untouched.

---

## 4. The typology — identity handles, computed honestly

Five **Traveler types**, derived from the Sun→Moon relation on the wheel
(computable, never quiz-based — HD lesson #5), working names:

| Type | Condition | ~Rate |
|---|---|---|
| **Homebound** | Sun and Moon in the same Sky | ~25% |
| **Outbound** | Moon one Sky ahead of Sun | ~25% |
| **Returning** | Moon one Sky behind | ~25% |
| **Farborne** | Moon in the opposite Sky | ~25% |
| **Seedborn** | Sun and Moon in the *same station* | **~3.5%** — the rare one |

Each type gets one imperative line (the permission sentence — "you're not
flaky, you're Outbound: you read the road ahead") and a felt feedback pair
(lesson #6). The scarcity gradient is real and checkable — Seedborn is rare
because new-moon births near your Sun's station are rare, not because we
said so. `[Design-open: rates need simulation; names need Justin.]`

**The vertical axis** (Gene Keys lesson #7, using the ladder we already
invented): every shard reads in three registers — **Flicker / Glow /
Beacon** — the strength over-turned, the strength, the strength fulfilled.
The codex opens deeper registers as you walk with a station across months
(the Moon returns every 27.3 days — the deepening is paced by the sky, not
by a grind; nothing purchasable, per the floor).

---

## 5. The cards

- **112 shard cards** — the collectible core. A station's card is claimable
  during its ~24h crossing (the engine built for this survives intact); the
  *step variant* you claim is the step the Lantern is in when you visit.
  Completing a station = four visits across four months. Full album ≈ four
  sidereal months of gentle play — the long game, with every empty slot
  showing its live return-countdown (ethics floor, unchanged).
- **9 Current cards + 8 Light cards** — earned by encounter (first Stillwater
  day, first full-moon Sounding…), not by grind.
- **Foils** = real sky events only (eclipse in the station, full moon in the
  station, your Homecoming night — the Lantern in your natal station), per
  the no-odds principle: *"no odds to disclose; the sky is the drop table."*
- Every card back carries the four-culture scholarship (the verified corpus)
  — the historical analogues are the *depth* of a bespoke card, exactly as
  requested.

---

## 6. IP position (from the legal research — the guardrails)

What we build on is unowned or ours: the mansions predate every modern
system; the I Ching's structure is ancient and public domain (we borrow its
*principles*, not its hexagrams); real astronomy is free; **our corpus text
is the protectable asset** — it is our *Rave I'Ching* equivalent, and it's
already written and verified.

Hard avoid-list (per the Jovian/Gene Keys research): no bodygraph-like
organ diagram, no "gates/channels/centers," no 88° calculation, no
Manifestor/Generator-family names, no Shadow/Gift/Siddhi as a labeled triad,
no 64-on-the-wheel cloning. Our wheel is 28 — a different number from a
different tradition with better daily cadence than HD's 5.6-day gate
transits. **Register the coined marks early** (Moonroad, Sigil, Sounding,
the type names, "Star Shard" itself) — the research's clearest lesson is
that Human Design leaked its own name by being generic.

---

## 7. What survives the reboot (most of it)

| Asset | Fate |
|---|---|
| `astro.js`, `sky.js`, tārābala track, phases, planetary hours | **Core engine — unchanged.** Currents/Lights/Keepers are reskins of what shipped |
| The 28-entry corpus + verify report | **Becomes the station layer of the codex** — untouched; steps add 3 new short registers per station over time |
| Deck claim windows, event calendar, ethics floor | **Unchanged**; step-variants extend the schema |
| 28 permalink pages | Become station pages of the Moonroad; regenerate with new frame |
| Design system (teal/cream, card context, foil) | Unchanged |
| The four shard windows, "shatter the sky" flow | **Replaced** by Sigil + Sounding |
| duet.exe | Rebuilt later on the sukuyō relation engine as **Crossings** between two travelers |
| Shard Runner | Promoted: running the Moonroad — station-to-station levels, meteor-shower unlock kept |
| Intro animation | Becomes the myth's opening: the shattering, the seed, the road |

**Build order:** (1) naming pass with Justin → (2) the Sigil computation +
glyph (mostly existing math + new composition) → (3) the Sounding screen
(replaces today.exe; the five-beat structure already specced for Design) →
(4) step-level content pass (112 short texts — the one big new writing job:
~4 × 28 × 60 words ≈ 7k words, batched like the mansions were) → (5) the
album regrown to 112 → (6) types + registers → (7) runner-as-road.

---

## 8. Open questions for Justin (the naming pass)

1. **System name:** "the Moonroad" is the working name for the wheel — keep,
   or push further into star-seed language?
2. **The atom names:** Skies / Keepers / Steps / Currents / Lights / Sigil /
   Sounding — which stick, which fight the vibe?
3. **Type names:** Homebound / Outbound / Returning / Farborne / Seedborn —
   right family?
4. **Register names:** Flicker / Glow / Beacon?
5. **How hard to lean the fiction:** full second-person myth (the codex
   speaks to "traveler") vs. light frame around the existing warm voice?
6. The four Skies need names worthy of the four spirit-animals they reskin —
   this is an art-direction decision as much as a writing one.

*The wager, stated plainly: the buffet becomes a language. Learn 15 words,
read 112 shards, walk one road every night with the real moon. That's a game
you maintain because it's a literacy you're building — and nobody else can
ship it, because nobody else did the scholarship.*
