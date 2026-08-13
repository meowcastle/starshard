# PORT-SPEC.md — corpus → engine

**v1 · August 12, 2026 · for Claude Code.** How the five corpus files
become the reading the site actually renders. Nothing here changes the
formal system; it is a data-plumbing spec plus one composer function.

**Source of truth is the markdown, not the JS.** Same posture as the
mansion permalinks: `tools/build-mansions.mjs` parses
`research/mansions-*.md` and the generated output is never hand-edited.
Do the same here — a build tool parses the corpus, emits a module, and
the prose keeps living in `research/` where it gets edited, verified and
reviewed. Hand-transcribing 13,215 words into JS would guarantee drift.

---

## 1. Inputs

| File | Contains |
|---|---|
| `research/corpus-spine.md` | 50 chart-independent slots (open, steps, fallbacks, lights, keepers, moving, becoming, echo, double door, connectives, gaits, closes) |
| `research/corpus-stations-01-07.md` | stations 1–7 × 4 slots |
| `research/corpus-stations-08-14.md` | stations 8–14 × 4 slots |
| `research/corpus-stations-15-21.md` | stations 15–21 × 4 slots |
| `research/corpus-stations-22-28.md` | stations 22–28 × 4 slots |

**Validated counts** (assert these in the build; a mismatch means the
corpus was edited in a way that broke a slot):

- total slots **162** — 50 spine + 112 station
- station slots exactly **112** (28 × {strike, root, facing, answer}),
  none shorter than 40 words
- interpolation tokens present in bodies: `becomingEpithet`,
  `birthPlace`, `echoEpithet`, `moonSign`, `sky`, `sunEpithet`,
  `sunSign`, `typeLabel`

## 2. The parse contract

A **slot marker** is an id matching `^[A-Z][A-Z_]*(\.[A-Za-z0-9_]+)+$`
appearing either as a bold-only token (`**LIGHT.full**`) or as an `###`
heading (`### GAIT.farbank`). Body rules, in order — all three matter,
each was found by actually parsing the files:

1. **Capture the remainder of the marker's own line.** Many slots are
   written `**CLOSE.1** — body starts here…`. Strip a leading em dash /
   hyphen and whitespace. Missing this silently drops the first sentence
   of ~40 slots.
2. **Continue until** the next slot marker, a `---` rule, a `##`/`#`
   heading, a table row (`|`), a blockquote (`>`), or an italic
   editorial line (a line beginning `*` followed by a letter).
3. **Strip a leading italic parenthetical** — `### GAIT.farbank` is
   followed on-line by `*(sun and moon in opposite banners)*`, which is
   an editorial annotation, not copy.

Normalize internal whitespace to single spaces; keep paragraph breaks if
the renderer wants them (blank line inside a body = paragraph break).

**Markdown in bodies is limited to `**bold**` and `*italic*`.** Do not
ship a markdown parser to the client — convert at build time to whatever
the renderer wants (`<em>` / `<strong>`, or a `{text, emphasis}` token
array). Bold is used for the anchor words (sign names, station epithets,
key terms) and Design will want to style it.

## 3. Output module

`reading-copy.js` — generated, never hand-edited, header comment saying
so and naming `tools/build-reading-copy.mjs`. Shape:

```js
export const COPY = {
  'OPEN.address.1': '…',
  'GAIT.farbank': '…',
  'STATION.24.strike': '…',
  …
};
export const STATION_SLOTS = 112;   // build-time assertions
export const COPY_VERSION = '<hash of the five source files>';
```

Flat keyed map, not nested — the composer looks up by exact id, which is
how the corpus is written and how it stays diff-able.

**Delete `sigil-copy.js`** once `fullReading()` is green. It was always
labelled placeholder; every one of its arrays now has a real counterpart.
Keep its `STEP_NAMES` export or move the equivalent into `sigil.js` —
it's structural, not prose.

## 4. `fullReading(sigil, ctx)` — the composer

Returns an ordered array of sections; the renderer decides presentation.
No prose lives in this function.

```js
{ sections: [ { id, title, blocks: [ {slot, text} ] } ], meta: {…} }
```

**Section order** (this supersedes SIGIL-READING §7's list, which
predates the Becoming):

| # | Section | Slots, in order |
|---|---|---|
| — | opening | `OPEN.address.{1-3}` (seeded) |
| I | your sun | `STATION.<sun>.strike` + `STEP.sun.<step>` |
| II | your moon | `CONNECT.root.<relation>` + `STATION.<moon>.root` + `STEP.moon.<step>` |
| III | the light | `LIGHT.<phase>` |
| IV | the day | `KEEPER.<weekday>` |
| V | the horizon | `STATION.<rising>.facing` |
| VI | the answering sky | `STATION.<farlight>.answer` |
| VII | how you walk | `GAIT.<type>` |
| VIII | what you're becoming | `MOVING.<which>` + `BECOMING.<register>` (+ `ECHO.body`, + `DOUBLE_DOOR.body`) |
| — | close | `CLOSE.{1,2,3}` |

**Why the Becoming comes after the gait:** the gait synthesizes the fixed
chart, the Becoming is the forward turn, and the close hands off to
tonight's crossing. Ending on transformation → "the first crossing is
tonight's" is the handoff into the game loop. (The nine-beat *arrival*
choreography in SIGIL-READING §2 keeps its own order — that surface is
short and lands on the handle. Two surfaces, two orders, one corpus.)

**Selectors:**

- `<relation>` for `CONNECT.root.*`: `sameStation` if sun and moon share
  a station; else `sameSky` if same Four-Symbols banner; else `adjacent`
  if banners differ by 1 (mod 4); else `opposite`.
- `<step>`: `entering|dwelling|turning|leaving` from the quarter of the
  station. Moon overrides: `crossing` if the moon changed station within
  ±6h of birth; `unknown` if no birth time (then also **omit**
  `STEP.moon.*` normal variants).
- `<phase>`: the eight `LIGHT.*` ids map 1:1 onto `moonPhase().index`
  order — assert the names line up rather than trusting index order.
- `<weekday>`: from `weekdayOf()` — the local calendar date, per the
  fix already in `astro.js`. Do not derive it from the UT instant.
- `<which>` / `<register>`: from `movingLight()` (INSTRUMENT §3) —
  `sun|moon|rising` and `door|ripening|leaning|rooted`.
- `<type>`: the five gaits.
- close: `CLOSE.3` if register is `rooted`; else `CLOSE.2` (mentions the
  Becoming); `CLOSE.1` is the neutral fallback.

**Fallback ladder (no birth time):** section V renders `FACING.unknown`
instead of a station facing; section II uses `STEP.moon.unknown`; the
Becoming may only consider sun and moon (a rising with no time is not a
candidate for the moving light, and if the moon's step is unknown its
distance-to-edge is unreliable — **use the sun alone in that case**, and
never report a `door` register off an unknown-time moon).

## 5. Determinism

Same rule as `weave()`: same birth data → same reading, word for word.
Seed every variant pick with `sigilSeed(sigil)` plus the slot family
(`${seed}:open`, `${seed}:close`), reusing `reading.js`'s existing
`seededPick`. `readingPlan()` already returns the variant hash — feed it
through rather than re-hashing. **Do not** seed with anything wall-clock;
`fullReading` must be pure, like `deriveSigil`.

## 6. Interpolation

| Token | Supplied from |
|---|---|
| `{sunSign}` `{moonSign}` | `SIGNS[signOf(lon)]`, lowercase to match voice |
| `{sunEpithet}` `{becomingEpithet}` `{echoEpithet}` | `stations.js` epithets |
| `{typeLabel}` | capitalized traveler type |
| `{sky}` | Four-Symbols banner of the **sun's** station |
| `{birthPlace}` | the city string the user typed |

**Privacy unchanged:** `{birthPlace}` is display-only, client-side.
Nothing in this path sends birth date, time or coordinates anywhere —
only the derived sigil object may be persisted (COSMOLOGY §7).

Unknown token → **throw at build time**, not render time. A `{foo}` that
reaches a user is the same class of bug as a raw `{{ binding }}`.

## 7. Tier gating

The corpus is written entirely in tier-0 vocabulary (ANCHORS + COSMOLOGY
§2) — it contains no *Recollection*, *Silverway* or *Great Sowing*, so
the Full Reading ships at tier 0 with no filtering. Keep the gate in the
render layer anyway: later fragment content will use it, and the check
costs nothing. Add a build-time assertion that the corpus contains none
of the tier-1+ terms — that turns the vocabulary law into a test.

## 8. Acceptance tests

1. **Parse**: 162 slots, 112 station slots, zero bodies < 40 words, zero
   unknown interpolation tokens.
2. **Coverage**: for all 28 sun-stations × 28 moon-stations × 5 types ×
   8 phases × 7 weekdays × 4 registers, `fullReading()` returns every
   section with no empty block and no unresolved token. Sample it
   (a few thousand random sigils) rather than enumerating.
3. **Determinism**: same input twice → byte-identical output; 1,000
   random sigils, no exceptions.
4. **Fallback**: `timeKnown: false` charts render V as `FACING.unknown`,
   II with `STEP.moon.unknown`, and never a `door` register.
5. **Length**: median full reading between 900 and 1,300 words (the
   astro.com-competitive target from SIGIL-READING §7).
6. **Vocabulary law**: no tier-1+ term appears in any tier-0 output.
7. **Smoke**: the existing browser smoke test drives arrival end-to-end
   and asserts a real reading renders — no `{{ }}`, no `{token}`.

## 9. Gates before this ships

- **Station 15 must not ship** until an Arabic-reading reviewer clears
  the `al-Ghafr` question (`research/verify-report.md`, `[NEEDS-HUMAN]`).
  Everything else can go live; gate that one slot set.
- The **verify pass** over batches 2–5 is queued next on my side; the
  claims are footnoted in each batch's production notes. Ports can
  proceed in parallel — corrections will land as markdown edits, which
  is exactly why the markdown stays the source of truth.
- Keeper table is **no longer blocked** (`research/hunger-axis.md` §0):
  `keeper(station) = CYCLE[(xiu.native_number − 1) mod 7]`,
  `CYCLE = [Jupiter, Venus, Saturn, Sun, Moon, Mars, Mercury]`.

## 10. Suggested order

1. `tools/build-reading-copy.mjs` + assertions (§2, §8.1) — smallest
   piece, unblocks everything, catches corpus edits forever after.
2. `movingLight()` in `sigil.js` (INSTRUMENT §7) — the Becoming needs it.
3. `fullReading()` (§4) with tests §8.2–8.4.
4. Wire section VIII into the ring renderer (hollow arc = the Becoming).
5. Delete `sigil-copy.js`; re-point the arrival's nine beats at `COPY`
   so both surfaces share one corpus.
