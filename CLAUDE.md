# CLAUDE.md — Star Shard

Read this before touching anything. It is short on purpose.

## What this is (post-reboot)

**Star Shard is a divination game played against the real sky.** The user's
birth minute computes their **Sigil** — a dark ring of 28 arcs with bright
natal marks; their personal Star Shard. Each night the Moon stands in one of
28 stations on the **Moonroad**; visiting kindles one segment of the user's
own ring and files a relational paragraph into their codex. The story is
revealed through play, never told up front. Single page, no framework of our
own, no build step. The reference docs, in reading order: `BLUEPRINT.html`
(the system map) → `COSMOLOGY.md` (canon + formal system + data model) →
`SIGIL-READING.md` (the arrival grammar). For the current build, not
`DESIGN-BRIEF.md` v2 — it's superseded piecemeal and left as historical
record: `UX-FLOW.md` (the arrival screens, replacing its §S1) →
`PRODUCT.md` (everything after arrival: the Deep Chart, the daily/weekly)
→ `PLATFORM.md` (web vs. app, decided) → `DESIGN-HANDOFF.md` (the actual
packet sent to Claude Design) → `WRITING.md` (the house style).

It is a standalone astrology product — **not** tied to a creator's
brand (that pivot is on the record, Aug 13). Audience assumptions that
still hold: phone-first, skews female, a meaningful share aged 13–17.
Positioning is **astrology app first, game mechanics as the retention
layer** — see `PLATFORM.md`.

The **front end was rebuilt from scratch** against this reboot; the engine
modules and the database carried forward. The old four-shard flip flow
(houses / archetype / mansion / weekday) is retired; its computations live
on inside the Sigil. Status (updated 18 Aug): `Star Shard v4.dc.html`
(repo root) is the live page now — the "calm pass" Design export, fully
re-wired to the real engine/corpus/combos/findings pipeline (same pattern
`Star Shard v3.dc.html` used: Design's markup, Code's script). `deploy.sh`
ships it as `index.html`. **`Star Shard v3.dc.html` is retired** — per
Justin's call ("v3 is outdated and not needed anymore"), it stays in the
repo as historical reference only, same as `Star Shard v2 (archived).dc.html`,
and is not deployed. `ios-frame.jsx` (repo root, copied from the Build
Plan folder) is a real runtime dependency of v4's markup — the device-
frame wrapper Design's export uses — not decoration; it ships in
`FRONTEND_FILES` alongside the engine modules.

v4's known gaps against the export, all deliberate scope calls made when
it was ported (not oversights): the per-planet/angle detail cards show
real position/house/mansion facts only, not invented interpretive prose
(no composer exists for that); the "in your life" lifetime-rarity line
was dropped entirely (no engine computes it — the single biggest
still-unbuilt piece per `SHARD-MODEL.md`'s own innovation claim); the
onboarding form is wired best-effort against its own free-text date/
place fields (loose `Date` parsing, first geocode match, no manual-
coordinate fallback — the markup has no fields for one); Manzil's
"the covered well" door is forced off (`gameNightOn: false` unconditionally)
since Manzil itself is still WIP.

Beyond the arrival/Sounding pipeline, the live page now also carries: the
**shard blueprint** (`sigStep: 'shard'` — sun-mansion × moon-mansion as
the natal-chart-as-object, per `CHART-BUILDER.md`/`SHARD-MODEL.md`:
the combination reading from the 784-cell corpus, two mansion portraits,
a `findings.js`/`rates.js`-driven signature card, the farlight), the
**chart wheel** (real natal positions for all ten planets + angles,
`transits.js`'s `natalPlanetPositions()`/`fullNatalAspects()`), and a
**motion layer** (ring morph on tab switch, the kindle sweep+flare on
claim). `transits.js` is fully wired now — the "not yet wired into
reading.js or the page" note from the reboot is stale; see Architecture
below. See `docs/archive/STATUS.md` for the day-by-day trail through
Aug 13; `RESUME-784.md` and `GENERATION.md` for the corpus pass since.

**Receipt protocol, for the next Claude Design export** (binding —
confirmed useful by the one real export received so far, with two of its
own predictions corrected below):

1. **Diff it against the current markup, not the archived v2 page.**
2. **The export's script block is disposable mock wiring.** Rebuild the
   `x-dc` block thin — state + lifecycle + `renderVals()` — wired to real
   modules. Any hardcoded sample text in the export is placeholder by
   contract (Design is instructed never to import engine modules).
3. ~~Expect namespaced bindings (`sig.*`/`snd.*`/`cdx.*`/`crd.*`) and a
   binding manifest.~~ **Corrected by experience:** the one real export
   received (`Star Shard v3 Build Plan/Star Shard v3.dc.html`, then
   `v4.dc.html`) used flat, unprefixed, ad-hoc mock state instead (`sel`,
   `selM`, `cd`, `ob*`, `acct*`) and shipped no binding manifest. Don't
   wait for one — run `npm run bindings` to inventory the export's own
   bindings, map each to a real module by hand, and **flag anything
   unmappable, do not guess.**
4. Verify no engine imports snuck into the export. ~~And that the
   `<helmet>` meta/OG tags survived.~~ **Corrected by experience:** the
   real exports received so far ship with fonts only in `<helmet>` — no
   `<title>`, no OG/meta at all. Don't assume they'll be there to
   "survive" — the live page's own `<title>`/OG tags have to be
   preserved by hand during the merge, every time.
5. Reconcile against the live page's own bindings (`BINDINGS.md`) rather
   than assuming a wholesale replacement is needed — port screen by
   screen, the way the chart wheel went in from `v3.dc.html`. `v4.dc.html`
   is next in line; its funnel/onboarding/shard screens carry two
   assumptions (email magic-link auth, a web-side IAP gate) that need
   Justin's call before porting — see Open decisions.

**Then, the app wrapper** (`PLATFORM.md` — decided Aug 13). Ships to the
App Store as a **Capacitor wrapper around the existing web build, not a
rewrite**. It must add native value beyond a web clipping or Apple
rejects it under guideline 4.2.2:

1. **Native push** — the whole reason. iOS web push only reaches users
   who manually added to home screen (~10–15× smaller audience), and the
   nightly loop depends on the reminder.
2. **Native IAP** for the one-time unlock, with **server-side
   entitlement** — a localStorage flag is forgeable, and Safari evicts
   it under storage pressure.
3. **Offline caching** of the Deep Chart — it never changes, so it's the
   ideal offline artifact.
4. Icon, splash, home-screen presence, safe-area handling.

The web build stays live and free: the shareable chart, the
Reddit-linkable demo, and the 28 station permalinks (an SEO asset we
already own). One account, entitlement on both.

Explicitly deferred (on the record, Justin's call): more easter eggs,
community features, the Remembering endgame, paradox cards, Undertext
rendering, event-foil curriculum, the Full Reading's page surface
(`reading.js`'s `fullReading()` is built and tested; nothing renders it
yet — no spec says where it lives in the UI), the daily/weekly generative
pipeline itself (`transits.js` — the engine piece it needs — is built and
tested per PRODUCT.md §11.1, but the LLM prompt/moderation/storage pipeline
around it has open decisions per PRODUCT.md §12b — which model, where it
runs — that aren't Code's to make silently).

**Minigames are no longer flatly deferred** — Design has a locked v2
ruleset for a minigame ("Manzil": road-building solitaire against the
moon's 28-station walk) with a working prototype
(`Star Shard v3 Build Plan/Manzil - Prototype.dc.html`), separate from
the road-shards (its wins award a distinct "game-shard" set; the 28
never become skill-gated, per the ethics floor below). This is stale —
Code has since built a real Socket.io matchmaking lobby + PvP validator
(`starshard-api/lib/manzil-lobby.js`/`manzil-engine.js`) for the deployed
copy (`Star Shard v3 Build Plan/Manzil - The Empty District.dc.html`,
synced to `manzil/index.html`), and, as of 24 Aug 2026, **Manzil requires
the same account as Star Shard to play at all** — email, password, a
username, and real birth date/time/place, enforced both by the client's
phase-gate and server-side by the lobby rejecting any socket without a
valid session cookie (see the Privacy invariant below for why birth data
now lives server-side). Star Shard itself stays account-optional,
unchanged. Its own rules doc (`Manzil - Rules & Cards.dc.html`)
still describes an earlier, superseded ruleset (banking/points, a
112-card deck) rather than the locked one — read the locked description
in the Build Plan's own `CLAUDE.md`, not the rules file, until that's
reconciled.

## The one thing that will break this repo

**Two agents work here: Claude Design and Claude Code. They must never edit the
same file in the same cycle.** A Claude Design handoff *replaces* the
`.dc.html` page — it does not merge it, and git will not warn you.

You (Claude Code) own everything except the markup:

| Yours | Claude Design's | Generated — never edit |
|---|---|---|
| `astro.js` `sky.js` `sigil.js` `transits.js` `deck.js` `events.js` `astronomy-engine.js` `format.js` `tz.js` `api.js` `reading.js` `findings.js` `rates.js` `starshard-api/**` `test/**` `tools/**` | `*.dc.html` markup + `<helmet>` | `support.js` `stations.js` `reading-copy.js` `combos.js` |

`stations.js`/`reading-copy.js`/`combos.js`/`mansion-depth.js` regenerate
from source (`research/mansions-table.json` + `tools/build-mansions.mjs`;
`research/corpus-*.md` + `tools/build-reading-copy.mjs`;
`research/combos.json` + `tools/build-combos.mjs`;
`research/mansions-table.json` again + `tools/build-mansion-depth.mjs`) —
hand-editing the output is exactly the stale-export failure mode below,
aimed at yourself. **Corrected (18 Aug, verified by hand rather than
trusted from an earlier note):** `mansion-depth.js` is not dead code or
an abandoned orphan — it's a real, current, generated artifact, same
tier as the others. It's genuinely unwired (no `.dc.html` page imports
it, and it's absent from `tools/deploy.sh` on purpose, not by oversight)
because nothing consumes it yet: `reading.js`'s DEPTH tab
(`depthReading()`) uses `stations.js`'s plainer per-station data instead,
and `mansion-depth.js` is a richer, per-tradition-match-flagged
alternative shape sitting ready for whenever that tab wants it. It's
also not an ES module like its siblings — it sets `window.MANSION_DEPTH`
via a plain `<script>` tag, not `export`/`import` — so wiring it in means
a `<script src>` tag, not a dynamic `import()`.

**Shared seam:** the `<script type="text/x-dc">` block at the bottom of the
`.dc.html`. Keep it thin — state, lifecycle, and `renderVals()` only. Full table
and workflow rules in `OWNERSHIP.md`.

## Architecture

```
Star Shard v4.dc.html
  ├─ markup            Claude Design-sourced (the "calm pass" export,
  │                    ported per the receipt protocol below). Static
  │                    per-example prose in the export (the combination
  │                    reading, mansion portraits, tonight's reading) was
  │                    converted to real `{{ bindings }}` in place — same
  │                    DOM/CSS, real data. `Star Shard v3.dc.html` is
  │                    retired (see "Status" above), kept for reference.
  ├─ ios-frame.jsx     Design-sourced device-frame wrapper the markup's
  │                    `<x-import>` depends on — a real runtime file, not
  │                    a design reference; deployed alongside the engine.
  ├─ <helmet>          Claude Design owns the fonts/styles; title+OG/meta
  │                    are Code's to preserve by hand on every merge — real
  │                    exports so far don't carry them (see receipt protocol)
  └─ <script x-dc>     SHARED — state + lifecycle + renderVals(), nothing else
       │
       ├─ astro.js     ephemeris, houses, lunar mansion, weekday
       ├─ sigil.js     the Sigil: natal derivation, type, movingLight()/the
       │               Becoming, readingPlan(), SVG ring,
       │               fullNatalAspects() (the chart wheel's aspect grid)
       ├─ sky.js       daily engine: moon phase, tārābala, planetary hours,
       │               station+step+cast kinds
       ├─ deck.js      the collection game: claim windows, grace, returns —
       │               server-side claimability check for POST /api/recollection
       ├─ events.js    the event calendar: dated sky events, foil conditions
       ├─ astronomy-engine.js   vendored MIT build — FULL api (147 exports:
       │               Body, GeoVector, Ecliptic).
       ├─ transits.js  aspect geometry (classifyAspect()) +
       │               planetPositions()/natalContacts()/pickLiveTransit()
       │               (the daily's live transit, PRODUCT.md §7 — wired,
       │               not just built) + natalPlanetPositions() (natal
       │               Mercury-Pluto, since astro.js's chart object never
       │               carries them — shared by findings.js and the wheel)
       │               + weekTightestContact()/standingWeather() (the weekly)
       ├─ findings.js  the shard's ranker (CHART-BUILDER.md §3.1): seven
       │               candidate finding kinds, five implemented
       │               (colocation/pile/boundary/quiet/type/dissent are
       │               live; `seam` is a no-op pending the nakshatra
       │               alignment call below), scored rarity×prominence×tension
       ├─ rates.js     the measured-constants table findings.js scores
       │               against — refuses to emit a rarity for anything
       │               uniform-by-construction (mansion/step/archetype/weekday)
       ├─ format.js    degFmt, ordinal, place/birth lines
       ├─ tz.js        historical UTC offset + DST for a birth moment
       ├─ api.js       ALL network I/O
       ├─ reading.js   arrivalReading(), fullReading(), soundingReading(),
       │               weeklyReading(), patternAspects(), houseReading(),
       │               depthReading() — all real, all wired
       ├─ reading-copy.js   generated: STATION.* (the real arrival/Sounding
       │               corpus, PORT-SPEC.md) + MANSION.* (the shard
       │               blueprint's 28 portraits, CHART-BUILDER.md layer A) —
       │               tools/build-reading-copy.mjs from research/corpus-*.md
       ├─ combos.js    generated: the 784-cell sun-mansion×moon-mansion
       │               combination corpus (CHART-BUILDER.md layer B,
       │               GENERATION.md) — complete as of 18 Aug, gate-clean,
       │               NOT yet human-reviewed (GENERATION.md §5b) —
       │               tools/build-combos.mjs from research/combos.json
       └─ sigil-copy.js     placeholder prose — Sounding only; arrival is real

starshard-api/          Express 4 + MySQL: accounts, sigil, recollection

mansions/               generated: 28 static permalink pages + index + OG
                         images — tools/build-mansions.mjs regenerates it,
                         never hand-edit (see OWNERSHIP.md)
```

## Runtime constraints — these are not negotiable

1. **No top-level `import` in the script block.** The dc-runtime transpiles it
   with Babel presets `["react","typescript"]` — no module transform — and
   evaluates it inside `new Function(...)`. A static import is a syntax error.
   Modules load via `await import()` in `componentDidMount`; that is why
   `renderVals()` guards on `ready` and falls back to an inert state.
2. **`support.js` fetches React, ReactDOM and `@babel/standalone` from
   unpkg.com on every page load** — ~3.3MB before first paint, and the script
   block is transpiled in the browser. If unpkg is unreachable the page renders
   raw `{{ mustaches }}`. `tools/vendor.mjs` mirrors them locally for tests.
   Self-hosting them in production is an open improvement. `astronomy-engine.js`
   does not repeat this: it's vendored and committed (`tools/vendor-astronomy.mjs`
   regenerates it), not fetched from a CDN.
3. **Nothing outside `api.js` may call `fetch()`.**

## Invariants

- **Privacy — reversed 24 Aug 2026, on purpose.** This invariant used to read
  *"birth date, time and coordinates are computed in the browser and are never
  sent to our backend"*, and called that the product's strongest differentiating
  claim. **That rule is dead.** Manzil now requires an account to play and that
  account is Star Shard's, so real birth date/time/place lives server-side in
  `birth_data`, written transactionally alongside `users` at signup. Justin was
  asked directly, given the conflict, and chose full birth data over a narrower
  age-gate-only version. Do not "restore" the old rule because you found it
  quoted somewhere older — `OWNERSHIP.md`, `DESIGN-BRIEF.md` and
  `docs/archive/REVIEW.md` all still carry the pre-reversal phrasing and are
  wrong until edited.

  What replaces it. These are the enforceable parts:

  1. **`api.js` is still the only thing that may call `fetch()`.** Unchanged,
     and it matters more now rather than less.
  2. **Store inputs, derive everything else.** A chart is a deterministic
     function of its inputs, so `birth_data` holds the inputs and nothing
     downstream of them. The *derived* sigil keeps its table (COSMOLOGY §7).
     Do not add tables that cache readings, transits or interpretations — each
     one widens the deletion surface and buys nothing we can't recompute.
  3. **Deletion and export are obligations now, not courtesies.**
     `DELETE /api/me` and `GET /api/me/export` are what GDPR Art. 15/17 and App
     Store review 5.1.1(v) get satisfied by. Every new user-scoped table carries
     `ON DELETE CASCADE` to `users` *and* appears in the export. One without the
     other is a bug, not a follow-up.
  4. **`birth_date` is an age signal, and that is a compliance trigger.** The
     moment signup stores a date of birth, this codebase has actual knowledge of
     whether a user is under 13. Read it for gating and nothing else. See the
     ethics floor's minors clause below.
  5. **The surviving claim is "it explains itself", not "we never see it".**
     `PLATFORM.md` leads on explainability and buy-it-once; both survive intact.
     No product copy may say or imply that birth data stays in the browser.
- **No logic in the markup.** If you want a computation inside `{{ }}`, it goes
  in a module and comes back through `renderVals()`.
- **`astro.js` is verified, not vibes.** See below before you "improve" it.
- **The ethics floor** (COSMOLOGY §4.5): count UP, never down · live
  return-countdowns · ~24h windows + grace · no paid pulls, no currency ·
  foils only for real sky events · notifications opt-in, off by default for
  minors. These are load-bearing product decisions, not copy suggestions.
- **The vocabulary law** (COSMOLOGY §2/§5): mythic terms are tier-gated; the
  reveal-state tier controls which strings render. Build the gate into the
  template layer, not into per-surface if-statements.

## Verify before you commit

```bash
npm run check      # regenerate BINDINGS.md + fail on mismatch, then run tests
npm test           # degFmt, weekday, cusps, ascendant, no-regression + NEW sigil/step tests
npm run bindings   # fails if the markup binds a name renderVals() omits

# browser smoke test — drives the whole flow and asserts on the result
npm i -D playwright && npx playwright install chromium
node test/smoke.mjs
# offline / CI:
npm i react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0
node tools/vendor.mjs && VENDOR_DIR=./vendor node test/smoke.mjs
```

**Run `npm run bindings` after every Claude Design handoff.** It is the guard
against a design regeneration silently renaming a binding — the failure mode is
a literal `{{ name }}` on the live page.

**Adding a new module the live page imports?** `npm run check` does not
catch a module missing from `tools/deploy.sh`'s `FRONTEND_FILES` list —
it only tests locally, where every file is already present on disk. This
has silently shipped a page that would 404 on a new module in production
before (`combos.js`/`findings.js`/`rates.js`, caught only by remembering
to check by hand). Update `FRONTEND_FILES` in the same commit as any new
top-level `import()` in the script block.

## What the ephemeris is worth

`astro.js` was verified against the Swiss Ephemeris (pyswisseph 2.10.3.2) over
~150,000 generated charts, 1930–2020:

| | mean | max |
|---|---|---|
| Sun longitude | 0.007° | 0.018° |
| Moon longitude | 0.021° | 0.106° |
| Ascendant | 0.003° | 0.119° |
| Placidus cusps | 0.003° | 0.105° |

Sign disagreement: Sun 0.029%, Moon 0.071%, rising 0.009%. Sun's house 0.00%.
`test/fixtures/astro.legacy.mjs` is a frozen pre-refactor copy; the last test
runs 3,000 random sub-polar charts through both and asserts agreement to 1e-9.
**If you change `astro.js`, that test must still pass.**

Above 66° latitude Placidus is undefined, so `placidusCusps()` falls back to
Porphyry and sets `chart.houseSystem = 'porphyry'`. Verified against Swiss
Ephemeris Porphyry: max cusp error 0.06°, zero rising-sign disagreements.

Note for `sigil.js`: a station is 12.857°, a step 3.214° — the Moon's
verified max error (0.106°) is ~3% of a step, so **step assignment near a
boundary is honest to within a rounding sliver**; do not add fake precision
(no seconds-of-arc in UI copy).

## What `sky.js` is worth

Two ephemeris sources, each canonical for a specific thing — deliberate, not
accidental. `astro.js`'s Meeus Sun/Moon stays canonical for tārābala and moon
phase (both only need Sun+Moon longitude, which `astro.js` already computes
and has verified); `sky.js` never recomputes position itself. `astronomy-engine.js`
(vendored, MIT, `tools/vendor-astronomy.mjs`) is canonical only for what
`astro.js` cannot do: sunrise/sunset for `planetaryHours()`. If a future
void-of-course feature uses `astronomy-engine`'s other-planet positions for
"today's Moon," that will be a *different* engine than the one powering
tārābala's "today's Moon" on the same day — both accurate, but not
bit-identical. Know that going in.

`lahiriAyanamsa()` is a linear approximation (not the full Swiss Ephemeris
precession model), fit against 12 real pyswisseph 2.10.3.2 `SIDM_LAHIRI`
reference points (1900–2050, see `test/sky.test.mjs`). The number that
matters isn't the formula's isolated accuracy, it's whether it ever
misclassifies which of the 27 sidereal-nakshatra bins a chart lands in — a
wrong bin doesn't nudge a number, it flips tārābala's favorable/unfavorable
verdict. Run through `astro.js`'s own `moonLongitude()` for 500 charts,
1930–2020: **0 mismatches against Swiss Ephemeris.**

`planetaryHours()` returns `{ available: false }` for genuine polar
day/night — confirmed directly from `astronomy-engine`'s source that
`SearchRiseSet` returns `null` (not an exception) when no rise/set event
exists in a 3-day search window. This is deliberately a short window: a wider
one would silently find the *next* real sunrise/sunset months later and
build nonsense multi-day "hours" out of the gap instead of reporting
unavailability.

## Recently fixed — do not reintroduce

- **Weekday** came from the UT-shifted instant, so 26% of timezone/hour combos
  reported the wrong day. Now `weekdayOf(year, month, day)` uses the local
  calendar date. Someone born 23:00 Saturday in LA is a Saturday's child.
- **`degFmt`** printed `12°60′` on 1/120 of values (12.5% of charts showed one).
  Now carries minutes into degrees and degrees into the next sign.
- **`ascendant()`** returned the Descendant above the polar circle — rising sign
  180° off. Now tests the candidate's hour angle geometrically.
- **Express 4 async handlers** were unwrapped, so a rejected `pool.execute()`
  became an unhandled rejection and killed the process. Every async handler is
  now wrapped in `wrap()` with an error middleware. Verified: dead DB used to
  give HTTP 000 + process exit, now gives HTTP 500 and stays up.
- **Stale-export crashes.** A Design export that imports an engine module
  as a sibling (originally `astro.js`/`shards.js`; `shards.js` no longer
  exists, but the failure mode applies to any engine module) has shipped a
  stale pre-refactor copy four times. The from-scratch rebuild makes this
  moot *only if* the receipt protocol above is followed — check imports on
  every handoff anyway.
- **`setState()` called from inside a function invoked *by* `renderVals()`**
  (as opposed to from an event handler) risks a cascading re-render loop —
  caught once, building the kindle animation, where a first draft started
  the animation's state machine by inspecting `sigJustKindled` inside a
  helper `renderVals()` itself called. Fixed by moving the state
  transition into the actual user action (`sndClaim()`) and having the
  `renderVals()` helper only *read* state, never write it. `renderVals()`
  and anything it calls must stay read-only.
- **Duplicate/mismatched double-"the"**: composing a sentence from two
  epithets (all 28 mansion epithets start with "The ") without stripping
  the leading article produces "The Storm of the The Glance." Strip
  `/^The /` before recomposing "of the ___" — caught live, not by any
  test, building the shard blueprint's hero.

## Open decisions — ask, do not guess

- **The Keeper table** — ~~`[VERIFY]`-blocked pending research.~~ Corrected:
  the research is done (`research/hunger-axis.md`,
  `keeper(station) = CYCLE[(xiu.native_number-1)%7]`) and sigil.js's own
  header says so. It's unbuilt because no composer needs the *per-station*
  Keeper yet (only the birth-day one, a different value that happens to
  share the name) — not because it's still blocked. Build it when the
  "road-kin" topology feature actually needs it.
- **W6, escalated (24 Aug 2026).** Account deletion and data export both
  shipped (`DELETE /api/me`, `GET /api/me/export`) — two of the original
  three gaps are closed. Still no email verification. But the account system
  itself just grew real teeth: Manzil now *requires* an account to play at
  all, and signup requires a real birth date + email + a chosen username —
  not optional profile fields, the price of entry to a free game — for an
  audience that's ~25% aged 13–17. That's a materially higher compliance bar
  (COPPA-adjacent) than "an optional password database" ever was, and no age
  gate exists at signup to act on the birth date being collected. This is
  Justin's shipped call, not something to quietly paper over — raise it again
  before wide launch, don't assume this note means it's handled. **v4's
  onboarding assumes email magic-link auth instead of the password system**
  — a real conflict with W6, not a resolution of it; don't port that part of
  v4 without Justin's call.
- **The nakshatra alignment** (`research/corpus-mansions.md`'s own
  escalation section) — this corpus pairs nakshatra *n* with mansion *n*
  by ordinal index; the classical Sino-Indian correspondence doesn't
  (牛宿 = Abhijit, so the pairing from mansion 22 onward runs one step
  later). Independently checkable by star identification, not just
  convention. Blocks `findings.js`'s `seam` kind and `stations.js`'s
  `hunger` field for mansion 28. Justin's call per the doc itself, not
  Code's or Design's.
- **The $19–24 one-time unlock's IAP/entitlement path** — `PLATFORM.md`
  already calls this app-wrapper-only (a localStorage flag is forgeable;
  Safari evicts it), decided Aug 13. v4's `nightEight` paywall gate is a
  real, wired mock of this on the web build, which the decided plan says
  shouldn't exist there. Don't build the web-side gate without checking
  this is still the call.

Full findings and reasoning: `docs/archive/AUDIT.md` (historical) · current system:
`BLUEPRINT.html` · `COSMOLOGY.md` · `SIGIL-READING.md` · the Star Shard
blueprint system: `CHART-BUILDER.md` · `SHARD-MODEL.md` · `GENERATION.md`.
