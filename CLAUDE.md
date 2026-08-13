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
`SIGIL-READING.md` (the arrival grammar) → `DESIGN-BRIEF.md` v2 (what Design
is building).

It is a web property for Suyin (@suyinsama) — Vocaloid/Hatsune Miku cosplay,
~13M monthly views, audience 62% female, 25% aged 13–17, and overwhelmingly on
phones. That last fact should inform most decisions.

The **front end was rebuilt from scratch** against this reboot; the engine
modules and the database carried forward. The old four-shard flip flow
(houses / archetype / mansion / weekday) is retired; its computations live
on inside the Sigil. Status: `Star Shard v3.dc.html` is the live page —
**a Code-authored stopgap**, not a Claude Design export (no fresh export
existed with a real binding manifest when it was built), using the
`sig.*`/`snd.*` namespace `DESIGN-BRIEF.md` v2 specifies so a future real
handoff reconciles cleanly. `Star Shard v2 (archived).dc.html` is retired,
kept only as reference. What shipped, in order: `sigil.js` (natal
derivation, the arrival grammar, ring geometry, and — added after
INSTRUMENT.md landed — `movingLight()`, the Becoming); `sky.js`'s
station/step cast kinds; the `sigil`/`recollection` DB tables (additive,
alongside the untouched `deck` table); `reading.js`'s composers, now
against the real corpus (`reading-copy.js`, per `PORT-SPEC.md`) instead of
placeholder prose. See `docs/archive/STATUS.md` for the day-by-day trail.

**Receipt protocol, for whenever a real Claude Design export actually
lands** (still binding, nothing here is retired):

1. **Diff it against the current markup, not the archived v2 page.**
2. **The export's script block is disposable mock wiring.** Rebuild the
   `x-dc` block thin — state + lifecycle + `renderVals()` — wired to real
   modules. Any hardcoded sample text in the export is placeholder by
   contract (Design is instructed never to import engine modules).
3. **Expect namespaced bindings** — `sig.*` (arrival/ring), `snd.*`
   (Sounding), `cdx.*` (codex), `crd.*` (cards); auth + `deck` shared
   unprefixed — and a **binding manifest** in the handoff notes. If the
   manifest is missing, run `npm run bindings` to inventory, map each name to
   a module source, and **flag anything unmappable — do not guess.**
4. Verify no engine imports snuck into the export, and that the `<helmet>`
   meta/OG tags survived.
5. Reconcile against the stopgap's own bindings (`BINDINGS.md`) rather than
   assuming a wholesale replacement is needed — the namespace was chosen
   specifically to make this a diff, not a rewrite.

Explicitly deferred (on the record, Justin's call): new minigames, more
easter eggs, community features, the Remembering endgame, paradox cards,
Undertext rendering, event-foil curriculum, the Full Reading's page surface
(`reading.js`'s `fullReading()` is built and tested; nothing renders it
yet — no spec says where it lives in the UI).

## The one thing that will break this repo

**Two agents work here: Claude Design and Claude Code. They must never edit the
same file in the same cycle.** A Claude Design handoff *replaces* the
`.dc.html` page — it does not merge it, and git will not warn you.

You (Claude Code) own everything except the markup:

| Yours | Claude Design's | Generated — never edit |
|---|---|---|
| `astro.js` `sky.js` `sigil.js` `deck.js` `events.js` `astronomy-engine.js` `format.js` `tz.js` `api.js` `reading.js` `starshard-api/**` `test/**` `tools/**` | `*.dc.html` markup + `<helmet>` | `support.js` |

**Shared seam:** the `<script type="text/x-dc">` block at the bottom of the
`.dc.html`. Keep it thin — state, lifecycle, and `renderVals()` only. Full table
and workflow rules in `OWNERSHIP.md`.

## Architecture

```
Star Shard v3.dc.html
  ├─ markup            Claude Design (currently: a Code-authored stopgap —
  │                    see "Status" above)
  ├─ <helmet>          Claude Design  (fonts, styles, meta/OG tags)
  └─ <script x-dc>     SHARED — state + lifecycle + renderVals(), nothing else
       │
       ├─ astro.js     ephemeris, houses, lunar mansion, weekday
       ├─ sigil.js     the Sigil: natal derivation, type, movingLight()/the
       │               Becoming, readingPlan(), SVG ring
       ├─ sky.js       daily engine: moon phase, tārābala, planetary hours,
       │               station+step+cast kinds
       ├─ deck.js      the collection game: claim windows, grace, returns —
       │               server-side claimability check for POST /api/recollection
       ├─ events.js    the event calendar: dated sky events, foil conditions
       ├─ astronomy-engine.js   vendored third-party (sunrise/sunset only)
       ├─ format.js    degFmt, ordinal, place/birth lines
       ├─ tz.js        historical UTC offset + DST for a birth moment
       ├─ api.js       ALL network I/O
       ├─ reading.js   the Sigil/Sounding composers: arrivalReading(),
       │               fullReading(), soundingReading()
       ├─ reading-copy.js   generated: the real corpus, browser-side (PORT-SPEC.md)
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

- **Privacy.** Birth date, time and coordinates are computed in the browser and
  are never sent to our backend. The only outbound call carrying user input is
  the Open-Meteo city lookup, which gets a place name and nothing else. This is
  the product's strongest differentiating claim — do not break it. (Storing the
  *derived* sigil object server-side per account is allowed by COSMOLOGY §7;
  storing birth data is not.)
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

## Open decisions — ask, do not guess

- **The Keeper table** — the per-station luminary cycle is `[VERIFY]`-blocked
  pending research. Placeholder + loud flag until cleared.
- **W6.** The account system runs a password database; with reveal state and
  Recollection it now stores real progression. Still no email verification,
  no account deletion, no data export — and a quarter of the audience is
  13–17. This needs a decision before public launch; raise it, don't decide
  it.

Full findings and reasoning: `docs/archive/AUDIT.md` (historical) · current system:
`BLUEPRINT.html` · `COSMOLOGY.md` · `SIGIL-READING.md`.
