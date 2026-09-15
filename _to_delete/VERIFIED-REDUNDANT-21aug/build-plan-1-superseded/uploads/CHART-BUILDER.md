# CHART-BUILDER.md — the Star Shard reading, end to end

**15 August 2026.** The centrepiece. Eight charts were run by hand through
the shipped modules to find out what the machine actually has to do —
Justin, Suyin, Corey, Adrian, Adam, Jonah, Craig, Jerry. This is what
those runs proved, and what each side builds.

Read `SHARD-MODEL.md` first for the method. This is the build.

---

## 1. What the eight runs proved

**The archetype layer works.** Eight charts, eight readings, none
interchangeable, and three produced findings that could not have been
written in advance — Jonah's sun-and-moon naming the same wound from
opposite ends, Craig's ascendant eleven arc-minutes from a door, Jerry's
moon, midheaven and Uranus all in one mansion.

**And it exposed the real gap. The corpus has no mansions in it.**

`reading-copy.js` holds 112 `STATION.n.{strike|root|facing|answer}`
slots — every one written as *"your sun landed on…"*. They are keyed to
**which light arrives**, not to **what the place is.** So when a reading
needs to teach The Storm as a standing archetype, there is nothing to
pull, and I wrote all sixteen mansion portraits fresh, eight times.

> **The 28 mansions need to exist as places before they can be inherited
> as placements.**

---

## 2. Three layers, and the line between them

| layer | count | where it lives | changes per user? |
|---|---|---|---|
| **A · FIXED** | 28 mansion portraits + the four-tradition data | corpus + `stations.js` | never |
| **B · COMPOSED** | 784 combination readings | pre-generated, curated, shipped static | never *(selected, not written)* |
| **C · GENERATED** | the signature | runtime | every user |

### A — the mansion portrait. New slot family: `MANSION.n`

What The Storm **is**, with nobody in it. What the four traditions each
saw, what they share, what the election books used it for, the guardian
and keeper, and the one line that makes it an archetype rather than a
data record. **~250 words × 28.** Mine to write.

The existing `STATION.n.*` slots stay exactly as they are — they answer
*what it means that **your sun** is here*, which is a different question
and still needed.

### B — the combination. 784, pre-generated, static

This is the discovery from the eight runs, and it changes the
architecture. **The combination reading is the best part of the product
and it does not have to be generated at runtime.**

784 pairings × ~350 words is a large but bounded corpus. Generate it once
against the 28 portraits, **read all 784**, fix the bad ones, ship it as
data. `NAMING.md` already established 784 is reviewable in about thirteen
hours.

**What this buys, and it is most of the argument:**

- **deterministic** — the same shard reads identically forever, which is
  what makes it a birthright rather than a slot machine
- **reviewable** — no user ever sees a sentence nobody read
- **free at runtime**, and offline-capable
- **no visible templating** — the failure that caught Co–Star — because
  every cell is individually inspected
- it survives the ethics floor without a moderation pass on the hot path

### C — the signature. Runtime, and only this

The one thing that genuinely cannot be pre-written, because it depends on
**which finding wins**, and the finding space is unbounded: co-locations,
piles, boundary registers, disagreement counts, tradition dissent.

~250 words. One generation per user, stored, never regenerated.

**The constitution from `PRODUCT.md` §8 applies unchanged: the model
never sees birth data.** It receives derived facts only — mansion
numbers, epithets, the finding, its measured rate. Not a date, not a
place, not a time.

---

## 3. What Code builds — five things

### 3.1 `findings.js` — the ranker *(new, pure, testable)*

The heart of it. Enumerate every candidate finding in a chart, score,
sort, return the winner plus runners-up.

```
enumerateFindings(chart, sigil, { timeKnown }) -> Finding[]
  Finding = { kind, points[], mansion, detail, rate, bits, prominence, score }
```

Candidate kinds, all seen in the eight runs:

| kind | example from the runs |
|---|---|
| `colocation` | Justin: moon + midheaven, one mansion, two signs |
| `pile` | Jerry: moon + MC + Uranus all in The Ghost |
| `boundary` | Craig: rising 0.18° from a door |
| `quiet` | Adrian: only one chart/shard disagreement |
| `dissent` | Justin: the traditions disagree about mansion 10 |
| `seam` | Adam: sun in the mansion India does not count |
| `type` | any Seedborn — report only when rare |

**Scoring is `SHARD-MODEL.md` §2: `rarity_bits × prominence × tension`.**
Prominence weights sun/moon/rising/MC at 1.0, personal planets 0.7,
outers 0.35. **A finding involving only outer planets is generational,
not personal, and must never win.**

### 3.2 `rates.js` — measured constants *(new)*

Everything below was measured this session and must ship as a table, not
recomputed at runtime.

| fact | rate |
|---|---|
| any two points, same mansion + different signs | **0.45%** — 1 in 221 |
| 3+ points in one mansion | **20.5%** · 4+ : 2.5% |
| nearest light within 1.0° of an edge | 14.9% · within 0.5°: 7.6% · **within 0.25°: 3.8%** |
| chart/shard disagreements | mean **3.36**; 0: 5.0% · 3: 21.3% · 5+: 25.1% · 9+: 2.0% |
| traveler type | seedborn **3.48%** · homebound 21.3% · other three ~25% each |

**And the one that must be enforced in code, not just documented:**

> **The 784-archetype grid is uniform — 99% of cells within ±10%.
> Sun-mansion spread is 6.9% (orbital eccentricity), moon-mansion 0.6%.
> `rates.js` must refuse to emit a rarity for any uniform-by-construction
> fact.** Mansion, step, archetype and weekday are named, never counted.

### 3.3 `shardReading()` in `reading.js` *(new composer)*

```
shardReading({ sigil, chart, stations, copy, combos, finding }) -> Blueprint
```

Assembles: hero → combination (looked up from `combos` by `s·m`) →
mansion portrait for the sun's → portrait for the moon's → signature.
**Pure. No network, no model call.** The signature text arrives as an
argument.

### 3.4 The generation path — `api.js` only

`api.js` is the only module permitted to call `fetch()`. The signature
generation goes through it, carrying derived facts only, with the
`PRODUCT.md` §8 constitution as system prompt. **One generation per user,
stored on first arrival, re-read forever after.** A hand-written fallback
ships for every finding kind — the user must never see an error where a
reading should be.

### 3.5 What to leave alone

`transits.js` and the daily/weekly path do not change. **The Star Shard
surface carries no dates, no orbs, no transit language** — verified zero
across all eight test pages. The bridge between them is one line at the
foot of the blueprint and nothing more.

---

## 4. What Design needs

The blueprint is **archetype A** from `APP-FRAMEWORK.md` — prose is the
content, no cards, hierarchy from type and space. Five components, and
three of them are new:

| component | notes |
|---|---|
| **Hero** | address `6 · 10`, the name over two lines, three lines of mono context. **No rarity number here** — it is uniform for everyone |
| **Combination** | the longest prose run in the app. One measure. One pull-quote |
| **Mansion portrait** ★ | glyph, epithet, degree span, the four-tradition grid, the election line. **Appears twice in the blueprint and once per mansion in the codex — build it once, use it 30 times** |
| **Tradition grid** ★ | 64px label column + text. Dissent gets a colour, never a badge |
| **Signature card** ★ | the only enclosed element on the page. Big number *or* a phrase — several charts have no number and must not look broken |
| **Pull-quote** | left rule, 19px. Two per page maximum |

**Three specific things the eight runs surfaced:**

1. **The signature is sometimes not a number.** Adam's was *"the seam,
   the ghost, and the void."* Adrian's was *"1."* Jerry's was *"three in
   the manger."* The component must hold a phrase as comfortably as a
   figure.
2. **Names run long.** *The Gathered Stars of the Thread* is 32
   characters and must set on two lines without shrinking.
3. **The mansion portrait is also the codex page.** Twenty-eight of them
   exist as destinations in their own right. Same component.

---

## 5. What I owe

1. **28 mansion portraits** (`MANSION.n`) — ~250 words each, ~7,000
   total. **Blocks everything downstream.**
2. **The generation prompt** for the 784 pass, plus the review protocol.
3. **The signature constitution** — how a finding becomes a paragraph,
   with the eight worked examples as few-shot.
4. **Fallback signature copy** for every finding kind in §3.1.

---

## 6. Order

```
me      28 mansion portraits ─────────────┐
                                          ├─→ generate 784 ─→ review ─→ ship static
code    findings.js + rates.js ───────────┘
        shardReading()  ─→  api.js signature path
design  mansion-portrait component ─→ blueprint layout
```

**`findings.js` and the portraits are independent and both are on the
critical path.** Everything else waits on them.
