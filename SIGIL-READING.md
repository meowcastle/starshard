# SIGIL-READING.md — the arrival grammar

**v1.1 · August 12, 2026 · adds §7, The Full Reading — the depth layer.** The MVP is the Sigil: you arrive, you get your
Star Shard, and everything builds from that first piece. This file is the
one system that was still missing — **the composition grammar that turns
seven computed parts into one reading that feels like a revelation instead
of a form printout** — plus the exact prose inventory it needs. Companion
to COSMOLOGY §3.3 (the parts) and DESIGN-BRIEF v2 §S1–S2 (the surfaces).

---

## 1. The thesis: uniqueness is structural, prose makes it felt

The system already guarantees uniqueness. Sun position (112 states) × Moon
position (112) × facing (28) × Keeper (7) — with Light, Farlight, and gait
*derived* from those — yields **millions of distinct Sigils**, and even the
headline alone (gait × Sun epithet, 5 × 28) gives 140 identity handles
before a single derived part is mentioned. Nobody needs to invent more
astrology to make the Sigil individual. What makes it *feel* individual is
that the reading talks about the **relations between the parts** — because
the relations are the thing no one else shares. A form printout reads each
part in isolation; a revelation shows the parts answering each other. That
is a grammar problem, and this file solves it.

## 2. The choreography — nine beats, phone-first, one thought per screen

The reveal order is a design decision with a punchline: geometry first,
identity last, so the gait lands as a *deduction the traveler watched
happen* rather than a label from a quiz.

| # | Beat | What happens | Source text |
|---|---|---|---|
| 1 | **The ring** | the dark ring draws itself; no words, or six ("the sky kept a record. here.") | — |
| 2 | **The strike** | Sun mark lights: "you landed in **The Gathered Stars**, in its Dwelling" + 2–3 sentences | station core, strike frame |
| 3 | **The root** | Moon mark lights; text must reference the strike | station core, root frame |
| 4 | **The glow** | natal Light, one line ("you arrived under a light still filling") | 8 glosses |
| 5 | **The hand** | Keeper of the birth day, one line | 7 glosses |
| 6 | **The facing** | rising station, one line (skipped without birth time) | station core, facing frame |
| 7 | **The answering star** | Farlight: "across the wheel, **The Ghost** answers you — the full moon of every birthday you will ever have rises there." | 1 template |
| 8 | **The gait** | the punchline, derived aloud from beats 2–3: "your sun and moon stand in the same sky. you walk **Homebound**." + permission line | 5 gait readings |
| 9 | **The handle** | the title card / share moment: name + "Homebound of The Gathered Stars" + the ring + one strange line: *"this mark is older than your name."* | headline formula |

Total on-screen prose ≈ 150–220 words across the beats. Each beat is one
screen-height on phone; the ring persists and gains light beat by beat —
the reading *is* the ring being explained.

## 3. The weave rules (what makes it feel written, not filled-in)

1. **The rule of the second reference.** Every beat after the strike must
   name at least one earlier beat: the root speaks relative to the strike
   ("where the strike is loud, your root is a quiet current…" when they
   conflict; "…the same sky twice" when they agree), the answering star
   answers the strike, the gait derives from both. Relations over parts,
   always.
2. **Deterministic variation.** Connective templates ship 3–4 variants
   each, selected by a stable hash of the Sigil — the same person always
   receives the same reading, word for word. Re-reading feels fated;
   comparing with a friend shows real difference, not a reshuffle.
3. **Register:** second person · journey vector (arrived, carried,
   bound-for) · tier-0 vocabulary only (kindle, walk, cross — no
   Recollection, no Silverway, no Sowing) · lowercase warmth per the voice.
4. **Never explain the machinery on this surface.** No "in Chinese
   astrology…" — the four traditions live on the cards and in the
   grimoire, where they are credited fully. The arrival reading is all
   sky and self.
5. **The honest fallback ladder** (no birth time): skip the facing beat;
   root names the station without the step, phrased as depth not absence
   ("your root reaches into The Heart — where in its waters, only the hour
   would tell"). If the Moon changed station that day, say so — "you
   arrived on a crossing day; your root stands at a door" — the edge case
   becomes the *best* reading, not an apology (protocol completeness:
   rare configurations get special content, per the I Ching file).

## 4. The prose kit — exactly what needs writing (and what already exists)

The 112 step-texts are **not** in this kit — they serve the nightly
Sounding and can trail the MVP. Arrival needs:

| Piece | Count | Status |
|---|---|---|
| Station cores | 28 | **EXIST** — the corpus (pilot + batches). Needs the **tagging pass**: mark each entry's strike-line (outward) and root-line (inward) so the frames can quote them |
| Strike / root / facing frames | 3 templates | new |
| Step glosses (Entering·Dwelling·Turning·Leaving × strike/root role) | 8 | new |
| Light glosses (8 phases) | 8 | new |
| Keeper glosses | 7 | new — blocked on the Keeper table `[VERIFY]` |
| Gait readings + permission lines | 5 | drafted in COSMOLOGY §3.4 — finish + felt-feedback pairs |
| Farlight template | 1 | new |
| Agreement/conflict connectives (root↔strike) | ~8 variants | new |
| Headline formula + strange-line variants | ~4 | new |
| **Total new prose** | **~60 short pieces** | one batched writing pass, same method as the mansions |

## 5. What each side needs (so nothing blocks)

**Claude Code:** `sigil.js` per COSMOLOGY §7 — plus one addition from this
file: expose `readingPlan(sigil)` returning the ordered beats with slot
values and the variant hash, so the composer (`reading.js`) just fills
templates. Keeper table `[VERIFY]` is the only research blocker.

**Claude Design:** S1 builds against this beat order — nine screens, ring
persistent and accruing light. Placeholder strings are fine; the binding
namespace is `sig.*` per DESIGN-BRIEF v2. The share render (S2) is beat 9.

**Content (me):** the ~60-piece kit + the corpus tagging pass. Verify pass
on all of it before it ships, per house practice.

## 6. Answer to the fork, on the record

*Do we need more systems, or do we need prose?* Neither, mostly: the
formal system is finished and the uniqueness is already structural. We
needed **this one grammar** — now spec'd — and a **~60-piece prose kit**,
which is days of writing, not weeks. Everything else (the 112, paradox
cards, Undertext, foils) builds *from* this first piece, exactly as the
MVP intends.

## 7. The Full Reading — the depth layer (added after launch review)

**The diagnosis, measured on the live build:** the shipped arrival reading
totals **~212 words** for a complete chart. astro.com's natal reading — the
7 benchmark — is a multi-page interpretive *document* (2,000+ words of
placement-specific psychological prose). Ours is captions. Three concrete
faults: (1) the strike body is the card-back entry — 60 words of kawaii
card voice written for a different surface; (2) the root body is literally
the *daily-crossing* line ("the moon wears The Crown **tonight**…") jammed
into a natal beat — wrong register, actively confusing; (3) every other
beat is a one-liner, and nothing weaves the parts into a portrait, so the
relational thesis (§1) exists in the math but not in the prose.

**The fix is a second layer, not a different first layer.** The nine-beat
arrival stays cinematic and short — it is choreography. Beneath it: **the
Full Reading**, one scrollable document (~900–1,200 words), the actual
astro.com competitor, reached from beat 9 ("read the full shard") and
permanently page one of the codex.

**Structure** (sections, with word budgets): opening address (~50) · I. The
Strike — station body in strike voice + step inflection (~180) · II. The
Root — station body in root voice, *written against the strike* (~180) ·
III. The Glow — the light, derived aloud from the sun–moon geometry (~90) ·
IV. The Hand — keeper (~70) · V. The Facing (~80) · VI. The Answering Star
(~90) · VII. The Gait — the synthesis portrait: the deduction, the named
tension, the permission (~200) · close: the handle + the strange line +
the bridge to tonight's crossing (~60).

**The four rules that make it a 7 and not a longer 2:**

0. **The anchor law (ANCHORS.md — added after Justin's correction, and it
   governs the other three).** Every section opens on sky-equity the
   reader walked in with — their sign, the moon phase, the weekday's
   planet, a named star. Coined vocabulary nicknames, never introduces;
   Currents and Steps-as-proper-nouns are hidden from surfaces entirely.
   Every reading must pass the repeatability test: the user can tell a
   friend what they got in words the friend already understands.

1. **Name a tension, not just a gift.** Every section may flatter; the
   gait section *must* also name the cost ("too quick to move on, too slow
   to let go — both accusations are wrong"). Praise without friction reads
   as horoscope filler; named tension reads as being seen.
2. **Show the work.** At least twice, the reading derives one part from
   another in plain sight ("your light is full *because* your banks are
   far — a moon stands full only when it faces the sun across the whole
   sky"). This is our structural advantage over every static-text
   competitor: the parts genuinely are connected, so the prose can prove it.
3. **Register split, by law.** The Full Reading and arrival run in the
   quiet-mythic voice (lowercase, journey vector, no emoji). The kawaii
   card voice ("treasure-keeper energy ♡") lives on card faces and daily
   surfaces only. The card-back corpus is NOT reused as reading bodies.

**Corpus v2 (replaces §4's kit — this is the real writing pass):** 28
strike bodies (~150w) · 28 root bodies (~140w, each written with
same-sky/far-sky variants of its opening clause) · 28 facing lines (~40w) ·
28 answering lines (~30w) · 4×2 step inflections (~35w) · 8 light passages
(~80w) · 7 keeper passages (~60w) · 5 gait syntheses (~180w, slotted for
epithets) · connective tissue (~600w). **Total ≈ 12–13k words**, written in
six batches with the mansion method (pilot → batches → verify pass).
Pilot: `research/reading-pilot.md` — one complete Full Reading at target
quality, composed from the real engine's output for a sample chart.

**For Claude Code (small, and one hotfix):** HOTFIX now — stop rendering
`dailyCrossing` as the arrival root body (drop the body until corpus lands;
the daily line belongs to the Sounding only). Then: `fullReading()` in
reading.js — same beats, long slots, sectioned output; `stations.js` schema
grows `strikeBody`, `rootBody`, `facingLine`, `answerLine` (birthEntry
stays, for card backs); determinism unchanged. No new systems.
