# COSMOLOGY.md — the Star Shard foundation

**v1.2 · August 12, 2026 · supersedes REBOOT.md §1 and §4; everything else in
REBOOT.md stands.** Built on `research/starmyths.md`, `research/iching-model.md`,
`research/rave-mandala.md`, and Justin's corrections: the star burst — not you;
the Sigil IS your star shard; collection adds context to *your* shard; foundation
before features. **v1.2 ratifies the name slate (§2) and adds §5, The Reveal:
the story is revealed, never told** — myth ships in fragments, paced by the
road, sequenced uniquely per traveler.

---

## 1. The Myth (canon)

> Before anything had a name, there was one star. It did not break — **it
> sowed.** The Great Sowing scattered it into countless shards, and every
> shard is a traveler: an eternal thing, walking the sky-roads from world to
> world, wearing lives like weather.
>
> One of those shards is you.
>
> You arrived here — this world, this body, this name — at one exact minute,
> and the sky recorded it. The stations the Sun and Moon stood in, the light
> the sky held, the keeper of the hour: that mark is your **Star Shard** —
> the piece of the first star you carry in this manifestation. Not a
> horoscope. A cargo manifest.
>
> Every world hangs on the **Silverway** — the great silver river-road that
> crosses every sky. Each world has its own leg of it. **Earth's leg is the
> Moonroad**: twenty-eight waystations strung along the ecliptic, walked
> nightly by the Lantern — the Moon — one station per night, all
> twenty-eight in a month, forever, whether anyone watches or not.
>
> You forgot most of what you are. Everyone does; arrival is heavy. But the
> road remembers. Walk it, and each station returns a piece of your shard's
> light to you. The old word for this is the true one: **Recollection** —
> to re-collect is to remember.
>
> And every other traveler you meet is carrying a shard of the same star.
> **Star Shard is all of us.**

**This canon is the writers' bible, not the landing page.** No surface ever
tells it whole. It ships cut into fragments, discovered in the codex, paced
and sequenced by each traveler's own walking — see §5, The Reveal.

**The truth-floor** (stated in the grimoire, and it's the flex): the myth's
core is *literally true*. Every atom in you heavier than helium was forged
inside stars and scattered by their deaths — Sagan: "we are made of
starstuff" (B²FH 1957). And the Recollection frame is Plato, verbatim: souls
each "assigned to a star," sown into time, and "all enquiry and all learning
is but recollection" (Timaeus 41d–42b; Meno 81). *No voice in the night.
Four old maps, one real sky, one new road — and the physics agrees.*

**Language rule (per Justin):** the Moonroad is explicitly *this world's*
leg — the nexus of this manifestation. All copy carries journey vector:
arriving, crossing, bound-for, carried-from. The traveler is never "from
Earth"; the traveler is *currently* Earth.

---

## 2. The lexicon ledger

### Locked (Justin-ratified, Aug 12) — with reveal tiers (§5)

| Term | Meaning | Tier |
|---|---|---|
| **Star Shard** | your Sigil — the piece of the first star you carry; also the product name, now with its full meaning | 0 |
| **The Moonroad** | Earth's leg of the greater road; 28 stations | 0 |
| **Steps** | the four positions within a station: Entering · Dwelling · Turning · Leaving | 0 |
| **Seedborn / Homebound / Outbound / Emberwake / Farbank** | the five Traveler types | 0 |
| The 28 epithets | The Gate … The Thread (the approved slate) | 0 |
| **The Lantern** | the Moon on the road; keeps "moon" for astronomy, "Lantern" for story | 0 |
| **Recollection** | the collection mechanic — Plato's own translated word; *to re-collect = to remember* | 1 |
| **The Silverway** | the greater road — the Chinese Silver River + the Maya white road, coined blend | 2 |
| **The Great Sowing** | the primordial burst — Timaeus 41e "sown into the instruments of time" + literal nucleosynthesis | 3 |
| **Currents / Lights / Keepers / Skies / Sigil / Sounding** | as in REBOOT.md | 0 |

Grounding for the two new types: **Emberwake** carries the coal from the
Maya first hearth (the fire whose smoke is the Orion Nebula) in the sun's
wake; **Farbank** is born on opposite banks of the sky-river, from
Qixi/Tanabata — the myth the audience celebrates every July. Alternates
(Deepseed, Sternlight, Bridgewing) retired to `research/starmyths.md`.

**The tier is a vocabulary law:** a term above a traveler's current reveal
tier never appears on their surfaces — not in UI copy, not in card text, not
in notifications. Before Tier 1 the verbs are small and concrete: *kindle,
gather, walk, cross.* The big words are earned (§5).

### The four Skies (open — need naming worthy of the quadrant-spirits)

Working structure: stations 1–7, 8–14, 15–21, 22–28. Candidate direction:
name them as the four *reaches* of the voyage with hearth/river/wake/deep
imagery consistent with the type names. Decide with art direction.

---

## 3. The formal system (rock solid = this section)

### 3.1 The wheel

- Tropical ecliptic ÷ 28 stations of 12°51′25.71″, station 1 at 0° Aries
  (al-Bīrūnī anchoring; the honest sidereal caveat ships in the grimoire).
- Each station ÷ 4 Steps of 3°12′51.4″: Entering, Dwelling, Turning, Leaving.
- **Shard(station, step)** — 112 road-shards. Your **Star Shard** is the
  composite natal object (§3.3); road-shards illuminate it (§4).
- Skies: ⌈station/7⌉ ∈ {1,2,3,4}. Keepers: the per-station luminary from the
  canonical xiù cycle `[VERIFY table]`. Topology edges per REBOOT §2.2
  (Farlight = station+14 mod 28; road-kin = same Keeper; sky-siblings; neighbors).

### 3.2 The daily engine (already shipped in `sky.js`; renamed, not rebuilt)

- Lantern position → tonight's shard. Velocity → **steady / turning /
  threshold** cast (turning = final quarter of a step; threshold = boundary
  ±α, α tuned so casts split ≈ 3:1:rare).
- **Current** = tārābala relation on the hidden sidereal-27 track (nine
  names, Stillwater rule intact).
- **Light** = the 8-phase lunation state; natal Light from birth Sun–Moon
  elongation.

### 3.3 The Star Shard (Sigil) — computed once, grows forever

**Fixed at birth (the form):**

1. Sun station + step — *the strike* (where the seed hit)
2. Moon station + step — *the root* (requires birth time for the step;
   honest fallback = station only)
3. Natal Light (8) — *the glow*
4. Keeper of the birth day (7) — *the hand that carried you*
5. Rising station (time known) — *the facing*
6. Farlight station — derived — *the answering star* (your birthday full
   moon always lands there: real astronomy, free poetry)
7. **Type** (§3.4) — *the gait*

**Earned over time (the light):** 112 segments, one per road-shard, kindled
by Recollection (§4). The glyph: a 28-arc ring (the road) with natal markers;
each arc has four segment-ticks (the steps); collected = lit. A newborn Sigil
is a dark ring with bright natal marks; a walked Sigil is a wheel of light.
**The Sigil is the share artifact at every stage of the game** — "how lit is
your shard" is the visible history of your walking, never a score.

### 3.4 The five Traveler types (exact conditions)

Let s = Sun's Sky, m = Moon's Sky (1–4); let S = Sun's station, M = Moon's station.

| Type | Condition | ~Rate | The gait | Permission line (draft) |
|---|---|---|---|---|
| **Seedborn** | S = M (same station) | ~3.6% | the seed that landed whole | "you don't need the far bank — you *are* the crossing" |
| **Homebound** | s = m (and S ≠ M) | ~21% | walks the near road | "depth over distance was always the assignment" |
| **Outbound** | m = s+1 (mod 4) | ~25% | walks ahead of their own sun | "you're not restless — you read the road ahead" |
| **Emberwake** | m = s−1 (mod 4) | ~25% | carries the fire behind the light | "you're not stuck in the past — you're the one keeping it lit" |
| **Farbank** | m = s+2 (mod 4) | ~25% | born on both banks of the river | "your far side isn't missing — it's waiting at the bridge" |

Computable, never quiz-based; Seedborn's rarity is real and checkable. Each
type also gets a felt feedback pair (signature/shadow emotion) in the copy
pass. `[Rates need simulation against real birth-distribution; conditions are
exact regardless.]`

### 3.5 The Sounding (unchanged from REBOOT §3, with one addition)

Beat 5 becomes: **the claim kindles your Sigil** — copy shows the segment
lighting, not a counter incrementing. Close: "that's tonight's road. walk it
well."

---

## 4. Recollection — collection as remembering (the mechanic, exactly)

1. Each night the Lantern stands in one station, in one step. Visiting
   during the crossing lets you **re-collect that shard** — the station+step
   segment of *your own* Sigil kindles.
2. **The collected text is relational, not generic.** A re-collected shard
   reads through your natal topology: The Heart, as witnessed by a traveler
   whose shard is The Void, in a Windfall current — the grammar composes it.
   *This* is how the 112 "add context to your personal star shard": every
   collection event generates a paragraph **about you**, filed into your
   codex. The album is a growing autobiography written by the road.
3. Completing a station (all 4 steps, ≈ 4 monthly visits) fully kindles its
   arc and unlocks the station's **deep register** (the Flicker/Glow/Beacon
   ladder) — depth paced by the sky, not by grind.
4. Full Recollection (112) = **the Remembering** — the Sigil fully lit. What
   happens then is a design question for later; the foundation only promises
   it will be beautiful and free.
5. Ethics floor unchanged and load-bearing: live return-countdowns on every
   dark segment, ~24h windows + grace, count-up language ("nights walked"),
   no purchasable light, foils only for real sky events, "the sky is the
   drop table."

---

## 5. The Reveal — the story is revealed, never told (per Justin, binding)

The game never gives itself away. Arrival is not a cosmology lecture; it is
a *slight remembering* — the Neo hook: something specific and uncanny knows
you, and you don't yet know why. The initial reason to collect is small
(ritual, beauty, the ring wants lighting); the true reason recontextualizes
it later. Reference register: Clair Obscur's world-reveal — progression
doesn't just add lore, it **re-frames what you thought you were doing.**

### 5.1 The acts (keyed to Recollection progress, never to calendar time)

| Act | Trigger | What opens | The felt beat |
|---|---|---|---|
| **0 · The Itch** | arrival | Sigil reading: the dark ring, bright natal marks, tonight's crossing. Zero myth. One unexplained line: *"this mark is older than your name."* | specificity + beauty + one splinter of strangeness |
| **I · The Road** | first kindled shard | the codex opens — one fragment; nightly ritual establishes | "I want to see the arcs light" |
| **II · The Pattern** | first *completed station* (all 4 Steps) | **Tier 1.** The word appears for the first time: *"you weren't collecting. you were remembering."* Deep registers unlock | the recontextualization — the Neo moment |
| **III · The River** | first completed Sky (7 stations) | **Tier 2.** The Silverway named: the road is longer than this world | the map is bigger than the territory |
| **IV · The Tapestry** | all four Skies touched (≥1 completed station in each) | **Tier 3.** The Great Sowing assembles from collected fragments; *Star Shard is all of us* — every other traveler carries a shard of the same star | the myth was underfoot the whole time |
| **V · The Remembering** | 112 | deferred by design; the foundation only promises it will be beautiful and free | — |

### 5.2 Unique sequencing — the road tells each traveler a different story

Myth fragments are **station-bound**, and three of them are bound to *your*
natal stations, so the order of revelation is set by your birth chart:

- Lantern crosses your **Sun station** → the *strike* fragment (arrival —
  what it cost to land)
- Lantern crosses your **Moon station** → the *root* fragment (what you
  carried down)
- Lantern crosses your **Farlight station** → the *answering star* fragment
  (what waits across the wheel) — lands ~14 nights opposite your Sun's
- Every other station carries one general fragment, released on completion,
  **composed relationally** (§4, item 2) — even the myth is written *to you*

Two travelers who start the same night walk the same sky but meet the story
in different orders, with different fragments early — "a journey entirely
unique to them based on their star shard," structurally guaranteed.

### 5.3 Rules of the Reveal

1. **No surface ever states the full canon.** §1 lives in this doc and in
   the assembled Tier-3 codex only.
2. **Vocabulary law** (§2): tiered terms never leak below their tier.
3. **Withhold, don't lie.** Early copy is true and incomplete, never false —
   the recontextualizations must survive a second playthrough's scrutiny.
4. **The Sounding hints upward.** One line per reading may point at the
   larger tapestry — a question, never an answer.
5. **Milestone reveals are quiet.** No fanfare screens; a new page simply
   *is* in the codex, as if it had always been there. Discovery > delivery.

---

## 6. The respect architecture (from `research/starmyths.md` — binding)

**Two layers, always:** coined words on every product surface; a scholarly
**glossary** crediting the real traditions by name — Popol Vuh/Tedlock (the
hearthstones, the black road), Qixi/Tanabata (credited to China, Japan and
Korea jointly), Plato (Timaeus/Meno, quoted verbatim), the Polynesian
Voyaging Society revival (named: Mau Piailug, Nainoa Thompson), the Pyramid
Texts, B²FH/Sagan, and — with its full caveat — the Dogon cosmology *as
recorded by* Griaule & Dieterlen, noting van Beek's restudy. Never a living
culture's lexeme as a product label.

**Three hard exclusion zones:** (1) any "ancient people secretly knew modern
astronomy" framing — the Dogon/Sirius B story is a debunked artifact of the
ethnographic encounter, and the ancient-aliens version of it is racist;
(2) any 2012/"alignment" register around the dark rift; (3) the entire
new-age starseed lexicon — never *starseed, lightworker, Pleiadian, Sirian,
Arcturian, ascension, 5D*. "Star shard" is clean precisely because it has no
lineage in that movement and points at the nucleosynthesis truth instead.

---

## 7. Data model (for Claude Code — the foundation build)

```js
// sigil (computed client-side, stored server-side per account)
{ sunStation, sunStep, moonStation, moonStep|null, risingStation|null,
  natalLight,            // 0-7
  keeper,                // 0-6
  type,                  // seedborn|homebound|outbound|emberwake|farbank
  farlight,              // derived: (sunStation+13)%28+1  — display only
  createdAt }

// recollection (extends the existing deck table)
{ userId, station, step, kindledAt, castContext:
    { current, light, castKind } }   // for the relational paragraph

// shard content (extends mansions-table.json)
{ station: { ...existing 12 fields },
  steps: [ {name:'entering', text, tags}, ... ×4 ],   // the 112-text pass
  keeper, sky,                                         // [VERIFY] then freeze
  fragment: { text, kind } }   // kind: 'general' | null — natal-bound
                               // fragments (strike/root/answering) live in
                               // a 3-entry natal set, composed per user

// reveal state (per account — drives §5 vocabulary law + codex)
{ userId, tier,                // 0-3, monotonic, derived from recollection
  fragmentsUnlocked: [ids],    // append-only
  actMilestones: { firstKindled, firstStation, firstSky, allSkies } }
```

Algorithms already exist for everything above except: step boundaries
(trivial arithmetic on existing longitude), type derivation (§3.4, ~10
lines), Sigil rendering (new — SVG ring, the one genuinely new build), and
the relational-paragraph composer (the grammar: template over
current × natal-shard × tonight's-shard, drawing on the batch corpus).

**Build order (foundation only — nothing else until this is solid):**
1. `sigil.js` — derivation + type + SVG ring renderer, with tests
2. Step arithmetic + steady/turning/threshold in `sky.js`, with tests
3. Recollection schema migration (deck → station+step) + reveal state
4. The relational composer (`reading.js` extension) — serves both collected
   text and myth fragments
5. The Sounding screen v2 (Design has the five-beat spec; beat-5 kindling;
   tier-gated vocabulary per §2/§5)
6. The 112 step-texts + the fragment pass (28 general + 3 natal-bound) —
   my writing queue, batched like the mansions
7. Naming pass is ratified → regenerate permalinks with myth frame (tier-0
   vocabulary only on public permalink pages — they are pre-arrival surfaces)

Explicitly deferred, per Justin: new minigames, additional easter eggs,
community features, the Remembering endgame. The runner stays where it is.

---

## 8. Decisions

**Resolved (Justin, Aug 12):**

1. Name slate ratified whole: **Great Sowing · Silverway · Recollection ·
   Emberwake · Farbank · Lantern.** Alternates retired.
2. Myth placement: **discovered in the codex** — expanded into the full
   Reveal doctrine (§5). The story is revealed, never told; arrival is a
   slight remembering; progression recontextualizes.

**Still open (small, but Justin's):**

1. The four Skies' names (§2 — decide with art direction).
2. The Sigil glyph direction brief for Design (ring-of-28 is the spec;
   aesthetics are theirs).
3. Tuning the Act triggers (§5.1) once real pacing data exists — the
   trigger *kinds* are locked; thresholds may move.
