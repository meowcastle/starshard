# INSTRUMENT.md — the divination instrument

**v1 · August 12, 2026 · the synthesis spec.** How ten traditions compose
into one bespoke form of divination that belongs to Star Shard and nothing
else. Reconciles ANCHORS.md (accessibility) with the breadth of the
research corpus. Binding on the corpus, the generative layer, and the
build.

---

## 1. The correction

ANCHORS.md was right and incomplete. Leading with shared sky-objects is
how people get in the door — but a door is not a room. Written to its own
logic, the anchor law produces *"your Aries, refined,"* which is Co–Star
with extra steps. Justin: **"we have all this breadth. it's not a zodiac
sign generator. borrow from the literature to make something unique."**

The failure was never the anchors — it was that **ten traditions were all
saying the same kind of thing.** Four cultural names sat on a card as
decoration. The I Ching gave us a nightly cast kind and nothing else. The
houses were computed and never used. The Jungian archetypes were dropped
in the reboot. Breadth without a division of labor is just a longer
paragraph.

**The fix: every tradition gets exactly one job it alone does.** That's a
grammar of ten instruments playing different parts, not ten voices reading
the same line. And one of them — the I Ching — stops being a flavor and
becomes the engine that makes this *divination* instead of description.

| The reading answers | Job | Source tradition |
|---|---|---|
| **where you landed** | the ground | tropical sign + degree (Western) |
| **what that ground looks like** | the image | Arabic *manāzil* — the real asterism and its name |
| **who keeps it** | the guardian | Chinese *xiù* — the station's animal, and its luminary (the Keeper) |
| **what it wants** | the hunger | Indian *nakṣatra* — deity + symbol |
| **how others read you there** | the mirror | Japanese *sukuyō* — the relational register |
| **which of the four skies you belong to** | the banner | the Four Symbols (§5) |
| **where in a life it happens** | the arena | Placidus houses (Western) |
| **the light you arrived under** | the visibility | lunation phase |
| **the hand that carried you** | the temper | planetary weekday ruler |
| **who you are becoming** | **the change** | **the I Ching's changing lines (§3)** |
| **when it's moving** | the weather | *tārābala* — hidden track, timing only |
| **the voice it speaks in** | the register | Jungian archetype (per-type voice) |
| **the floor under all of it** | the truth | physics (`physics-paradox.md`) |

Nothing here is invented for flavor: each column is a real tradition doing
the job that tradition actually did. That is what "borrow from the
literature" earns us — the synthesis is ours, the parts are honest.

---

## 2. The instrument, stated in one paragraph

*Star Shard reads the sky the minute you arrived as a position on a
28-station road, and — this is the part no one else does — it finds the
one part of your chart that was **about to change**, and reads what it is
becoming.* Everything else in the system exists to make that sentence
land: the anchors get you in, the four traditions give the stations depth
no zodiac app has, the road gives the nightly ritual, and the Becoming
gives you a reason this is divination and not a personality test.

---

## 3. The Becoming — the engine (the I Ching's real gift)

`research/iching-model.md` §1 named the mechanic we failed to use: **"old"
is not a third symbol — it is a change operator attached to a symbol.** A
moving line reads as itself *now* and flips to generate a second figure:
present → tendency. Three thousand years of adaptations, and **no
successful one drops the two-figure mechanic.** We dropped it.

Restoring it, honestly, from real astronomy:

**3.1 The moving light.** Each of your three lights (Sun, Moon, Rising)
sits somewhere inside its station. Compute each one's distance to the
station's forward edge. **The light nearest an edge is your moving
light** — the place where the sky was, quite literally, about to become
something else at the minute you arrived.

**3.2 The Becoming.** Advance the moving light one station. That second
station is your **Becoming** — not a prediction, a *tendency*: the I
Ching's counsel frame exactly (`iching-model.md` §10). Your Sigil is
therefore always two figures: what you are, and what you are turning
into. The ring shows both — the natal mark solid, the Becoming mark
hollow, one arc ahead.

**3.3 Intensity is real, and it is the rarity texture.** How close the
moving light sits to the edge sets the reading's register:

| Distance to edge | Register | ~Rate | The reading |
|---|---|---|---|
| < 1° | **at the door** | ~8% | the transformation is already happening; the Becoming is read almost as loudly as the natal station |
| 1–3.2° (the Leaving step) | **ripening** | ~17% | a real, named tendency with a clear direction |
| 3.2–6.4° | **leaning** | ~25% | a quiet pull, offered as a question |
| > 6.4° | **rooted** | ~50% | the Becoming is distant — and *that* is the reading: you are here to be here |

Same shape as the yarrow stalks' engineered asymmetry — stability
outweighs change ~3:1, and a rare cast *feels like an event*
(`iching-model.md` §4). Nobody is left out: a rooted chart gets the
"planted" reading, which is a real and enviable result, not a null state.

**3.4 The Echo (the backward case).** A light in the first eighth of its
station has *just* arrived — it still carries the previous station. That's
the **Echo**: what you brought with you. A chart can have both (one light
ripening, another echoing) — and the pair is the strongest, rarest reading
the instrument produces.

**3.5 Which light moves is itself the meaning.**

- **Sun moving** — the identity is in transit; the person people know is
  not the final draft
- **Moon moving** — the inner life is turning; what feeds you is changing
- **Rising moving** — the meeting-place is changing; how you enter rooms
  is not settled

**3.6 Ties get special content** (protocol completeness, `iching-model.md`
lesson 11): two lights within 0.5° of their edges = **the double door**,
one of the rarest configurations, with its own written passage.

**3.7 Worked example — the real sample chart.** Born April 12 1998,
9:14pm, Chicago:

- Sun 23.0° Aries — **2.74° from leaving The Bearer** ← the moving light
- Moon 5.6° Scorpio — 2.96° from leaving The Crown ← near-tie: *double door*
- Rising 14.4° Scorpio — 7.07° from its edge (rooted)

Her Becoming is **The Gathered Stars** — the Pleiades; Indian *Kṛttikā*,
whose symbol is the **blade and the flame**, the sky of cutting away.
So the instrument says, from nothing but real positions: *a bearer at the
door of the fire. you have carried this as far as carrying goes; what's
next isn't more carrying, it's choosing what to put down and what to burn.*
And the Moon a whisper behind it — a second door, in her inner life,
opening at the same time.

No zodiac generator produces that sentence, because no zodiac generator
knows the sky was about to change.

---

## 4. The four-axis station grammar

Each station is read on four axes, one per tradition, each doing its own
job — this is the depth that makes 28 stations worth more than 12 signs:

| Axis | Tradition | Data (all present in `mansions-table.json`) |
|---|---|---|
| **the image** | Arabic *manzil* | `meaning_en`, `asterism`, `determinant_star` |
| **the guardian** | Chinese *xiù* | `xiu.animal` — dog, rooster, tiger, fox, rat, wolf… |
| **the hunger** | Indian *nakṣatra* | `nakshatra.deity`, `nakshatra.symbol` |
| **the mirror** | Japanese *sukuyō* | the relational register (`sukuyo_kanji` + lore) |

**The guardian animal is the accessibility win we were missing.** Every
station has a real animal from Chinese tradition — everyone understands
"your sky is kept by a fox" with zero study, and it is scholarship, not
invention. Animals do for the stations what signs do for the zodiac: an
instant, ownable handle. Expect the animals to become the merch, the
collection hooks, and how people say their result out loud.

**Match flags stay honest** — where the traditions disagree (`PARTIAL`,
`DIVERGENT`), the reading says so plainly: *"the arabs and the chinese saw
different creatures in these same stars — you get both."* Disagreement is
content, not a bug.

**Data gap — CLOSED** (`research/hunger-axis.md`, Aug 12): all 27
nakṣatra deities, symbols, lords and gaṇa are filled, with original
English hunger drafts written from deity+symbol only (the circulating
*śakti* list is a modern systematization with a copyright profile — the
file gives the safe-harbor method and the four material source
disagreements). Station 28 has no nakṣatra by construction (27 vs 28) —
that seam is written as content, never faked.

**Required hedges on this axis:** the guardian animals are **Song
dynasty** (*qínxīng* tradition, first recorded 11th c.), not Han and not
"ancient" — the mansions and the Four Symbols are the ancient part.
Two animals stay mythical in English (xièzhì, yàyǔ); never "unicorn,"
never "porcupine."

---

## 5. The four Skies are the Four Symbols (structural fix + open decision closed)

The Skies were an arbitrary 1–7 / 8–14 / 15–21 / 22–28 cut. The table
shows the real structure: the 28 mansions have always been grouped into
**four quadrants of seven**, each with its guardian — and in our
numbering they land contiguously (mod 28):

| Sky | The Four Symbols | Our stations |
|---|---|---|
| **The White Tiger** (west / autumn) | 白虎 | 28, 1–6 |
| **The Vermilion Bird** (south / summer) | 朱雀 | 7–13 |
| **The Azure Dragon** (east / spring) | 青龍 | 14–20 |
| **The Black Tortoise** (north / winter) | 玄武 | 21–27 |

Adopting these as the Skies costs nothing structurally — still four
contiguous groups of seven, so the Traveler-type arithmetic (§3.4 of
COSMOLOGY) is unchanged apart from a rotated boundary — and it buys: an
authentic name for a thing we had invented, a banner-level identity people
already recognize from a decade of anime and games, and one less open
decision. **Requires:** re-running the type-rate simulation on the rotated
boundaries, and English names on product surfaces with the Chinese
credited in the glossary (the Four Symbols are ancient astronomy — Fushigi
Yūgi borrowed them too; our no-FY rule is about *its* characters and art,
not the constellations).

---

## 6. What this unlocks (later — not now)

- **Your Becoming station lights up on the road** roughly once a month —
  a personal event the sky schedules, free.
- **Transits move your moving line**: as planets cross your stations, a
  different light comes to a door. The daily generative reading gets a
  real spine instead of a mood.
- **The Sigil is two figures**, so sharing has a hook: *what you are →
  what you're becoming.*
- **Collecting your own Becoming** is the obvious first quest.

---

### 5.1 The Keeper table is resolved (blocker closed)

The per-station luminary — `[VERIFY]`-blocked since the reboot and
holding up `sigil.js` — was encoded in the traditional mansion names the
whole time: 婁**金**狗, 昴**日**雞 — mansion + luminary + animal, the
middle character cycling 木金土日月火水 (Jupiter, Venus, Saturn, Sun,
Moon, Mars, Mercury). Verified against the Siku Quanshu's *演禽通纂*;
distribution is exactly 4 stations per luminary. **Rule:**
`keeper(station) = CYCLE[(xiu.native_number − 1) mod 7]`. Full table and
sourcing: `research/hunger-axis.md` §0–1. The placeholder comes out.

## 7. Engine deltas (Claude Code — all small)

1. `movingLight(sigil, lons)` → `{ which: 'sun'|'moon'|'rising', degToEdge,
   register, becomingStation, echo? }` — pure arithmetic on longitudes
   already computed; tests for boundary cases and ties.
2. `deriveSigil` returns `becoming` + `movingLight`; ring data marks the
   Becoming arc hollow.
3. `skyOf()` switches to the Four-Symbols quadrant table; re-run type
   rates.
4. `stations.js` grows `animal`, `guardianSky`, `hunger` (deity/symbol),
   `signSpan`.
5. Reading composer gains the Becoming section (§3) and the four-axis
   station block (§4).

## 8. Guardrails

- **ANCHORS still governs the door.** Anchors open every section; the
  instrument's depth arrives *after* the reader is standing on ground they
  know. The Becoming is stated in plain language — "one part of your chart
  was about to change" needs no glossary.
- **Respect architecture unchanged**: coined words and English on
  surfaces, traditions credited by name in the glossary, no living
  culture's lexeme as a product label, match flags never hidden.
- **Counsel frame, never prophecy** — the Becoming is a tendency
  contingent on conduct, per the I Ching's own stance and
  `physics-paradox.md` §5's open-future note.
- **No new systems after this.** This closes the design phase: the
  instrument is complete, and what remains is corpus + build.
