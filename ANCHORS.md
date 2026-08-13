# ANCHORS.md — the shared-sky law

**v1 · August 12, 2026 · binding on all surfaces, the corpus, and the
generative layer.** Justin's correction, on the record: *"astrology works
because people agree on the archetypes even if they have never studied
them. everyone knows Jupiter is a planet. the framework must be anchored so
people buy in easily — not gatekeep for scholars."*

> **Scope note (added with INSTRUMENT.md):** this law governs *how a
> reading opens* — the door, not the room. It is not the product. Read
> alone it produces "your Aries, refined," which is a zodiac generator and
> explicitly not what we are building. `INSTRUMENT.md` defines what the
> reading becomes once the reader is inside: ten traditions each doing one
> job, and the I Ching's changing-line mechanic as the engine. Anchors
> open every section; the instrument supplies the depth.

## 1. The law

**Every meaning-carrying sentence leads with a sky-object the reader
already knows.** Coined vocabulary never *introduces* a concept — it
*nicknames* a concept the reader has already been given through something
they walked in knowing. If a sentence would confuse someone's mom, it
leads with the shared object and demotes the coined word to second
position or cuts it.

The shared objects — the equity we get for free, no teaching required:

| Anchor | What people already believe | Cost to use |
|---|---|---|
| **The 12 signs** | everyone knows their sign; Scorpio/Aries/etc. carry vibes without study | zero — the most successful archetype system on earth |
| **The planets** | Jupiter = big luck, Mars = fight, Venus = love, Saturn = time/discipline, Mercury = messages. Pop culture (incl. Sailor Moon — *this audience*) pre-installed them | zero |
| **Moon phases** | "born under a full moon" needs no explanation; everyone believes the full moon does something | zero |
| **Weekdays** | Sun-day, Moon-day, Saturn-day are *in the words* | zero |
| **Mercury retrograde** | a meme this audience already speaks fluently | zero |
| **Named stars & known constellations** | Antares "the scorpion's heart," Orion, the North Star | near zero |
| **Visible events** | eclipses, meteor showers, supermoons | zero |

## 2. The re-anchoring map — what leads, what nicknames, what hides

| System element | LEADS with (shared) | Nickname (kept, second position) | Hidden until deep tiers |
|---|---|---|---|
| Station | **its zodiac sign + real stars**: "deep in Scorpio, crowned by the three stars on the scorpion's brow" | the epithet ("The Crown") as the collectible card name | station numbers, degree spans |
| Step | plain motion: "just arriving in / deep in / about to leave" | — | "Entering/Dwelling/Turning/Leaving" as proper nouns |
| Natal Light | **"born under a full moon"** (the phase, plainly) | "the glow" | phase indices |
| Keeper | **the weekday + its planet**: "born on a Sunday — the Sun's own day, it's right there in the word" | "the hand that carried you" | the term *Keeper*, the luminary cycle |
| Type | **the sun–moon relationship, said plainly**: "your sun and moon were on opposite sides of the sky" | the type name (already plain English) | Sky arithmetic |
| Farlight | **the birthday full moon** (a real, checkable phenomenon) | "the answering star" | the +14 formula |
| Rising | **"Scorpio was rising"** — astrology-native, people know this phrase | "the facing" | — |
| Current (tārābala) | — | — | **hidden entirely from surfaces for now.** Zero shared equity; resurfaces later as discovered depth or not at all |
| The Moonroad itself | **"the moon visits one of 28 skies each night"** — just the moon moving, true and visible | the Moonroad | everything else |

**The buy-in bridge, stated once and used everywhere:** *"everyone knows
their sign. almost nobody knows their sky within it."* The 28 stations are
sold as the **precision layer on top of the 12 signs** — you arrive knowing
Aries, we show you *which* Aries. Specialness through refinement of a
system people already trust, not replacement of it.

**The repeatability test (every reading must pass):** can the user tell a
friend what they got in words the friend already understands? "aries sun,
scorpio moon, scorpio rising, born under a full moon on a sunday" — yes.
"strike in the second station at the Leaving, sun-keeper, windfall
current" — no. The first is the surface; the second is the engine.

## 3. What this does NOT change

The engine, the math, the 112 shards, the collection game, the epithets as
card names, the type names, the Reveal, the ethics floor — all unchanged.
This is a **semantic layering inversion**, not a system change: the shared
sky becomes the carrier of meaning; the coined layer becomes flavor,
nickname, and *discovered* depth. It composes perfectly with the Reveal
doctrine: tier-0 vocabulary is now defined as *shared-sky language*, and
the esoterica that used to sit on the surface becomes what walking
uncovers. The scholars' layer (four traditions, station lore, the hidden
sidereal track) stays — in the grimoire and the deep registers, where
finding it is the reward.

## 4. The generative layer's constitution (approved: transit-based readings)

The daily/periodic generative readings speak **planet language on real
transits** — the shared archetypes moving across YOUR anchored chart:
"Mars crosses your sun's sky this week" · "Mercury stations retrograde in
your rising sign" · "the full moon lands on your answering star tonight."
Rules, in force from the first prompt written:

1. **Anchor law applies** — planets, signs, phases lead; road-vocabulary
   only as established nicknames.
2. **Register law applies** (physics-paradox.md §0) — no mechanism claims;
   counsel frame, tendency not prediction; tension named, not just praise.
3. **Privacy:** the model receives *derived placements only* (signs,
   stations, phases, type) — never birth date, time, or location.
4. **Determinism where it matters:** one generation per user per window,
   stored — re-opening the app re-reads the same text; the sky changes the
   reading, not the reload button.
5. **The corpus is the voice bible** — the hand-written readings define
   the voice the model is constrained to; generative extends the corpus,
   never freelances past it.
6. **Audience floor:** 25% minors — the same content rules as everything
   else, plus generation-time moderation.
7. ~~**Engine prerequisite:** planet positions need restoring.~~
   **STRUCK, Aug 13** — verified false. The vendored
   `astronomy-engine.js` exports the full API (147 symbols including
   `Body`, `GeoVector`, `Ecliptic`); planet longitudes and retrograde
   detection work today with no re-vendoring. See `PRODUCT.md` §0.

## 5. Order of work

1. This law lands in the corpus **before** the 13k words are written
   (the pilot is already re-anchored: `research/reading-pilot.md` v2).
2. SIGIL-READING §7 gains the anchor rule; corpus batches follow it.
3. Code: hotfix (daily line out of natal slot) → `fullReading()` →
   planet-position restoration for the transit layer.
4. Generative prompt design starts after the first corpus batches exist
   (the voice bible must exist before the model imitates it).
