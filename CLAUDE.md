# CLAUDE.md — Star Shard

Read this before touching anything. It is short on purpose.

## What this is

A kawaii Windows-95 desktop simulation that computes a real natal chart and
returns it as four collectible "shards": Placidus houses, a Jungian archetype,
one of the 28 *manāzil al-qamar* (classical Arabic lunar mansions), and the
"Monday's Child" folk rhyme. Single page, no framework of our own, no build step.

It is a web property for Suyin (@suyinsama) — Vocaloid/Hatsune Miku cosplay,
~13M monthly views, audience 62% female, 25% aged 13–17, and overwhelmingly on
phones. That last fact should inform most decisions.

## The one thing that will break this repo

**Two agents work here: Claude Design and Claude Code. They must never edit the
same file in the same cycle.** A Claude Design handoff *replaces*
`Star Shard v2.dc.html` — it does not merge it, and git will not warn you.

You (Claude Code) own everything except the markup:

| Yours | Claude Design's | Generated — never edit |
|---|---|---|
| `astro.js` `sky.js` `deck.js` `events.js` `astronomy-engine.js` `format.js` `tz.js` `api.js` `wheel.js` `card.js` `reading.js` `windows.js` `shards.js` `duet.js` `starshard-api/**` `test/**` `tools/**` | `*.dc.html` markup + `<helmet>`, `.image-slots.state.json` | `support.js` `image-slot.js` |

**Shared seam:** the `<script type="text/x-dc">` block at the bottom of the
`.dc.html`. Keep it thin — state, lifecycle, and `renderVals()` only. Full table
and workflow rules in `OWNERSHIP.md`.

## Architecture

```
Star Shard v2.dc.html
  ├─ markup            Claude Design
  ├─ <helmet>          Claude Design  (fonts, styles, and the missing meta tags)
  └─ <script x-dc>     SHARED — state + lifecycle + renderVals(), nothing else
       │
       ├─ astro.js     ephemeris, houses, lunar mansion, weekday
       ├─ sky.js       daily engine: moon phase, tārābala, planetary hours
       ├─ deck.js      the collection game: claim windows, grace, returns-in-N-days
       ├─ events.js    the event calendar: dated sky events, foil conditions
       ├─ astronomy-engine.js   vendored third-party (sunrise/sunset only)
       ├─ format.js    degFmt, ordinal, place/birth lines
       ├─ tz.js        historical UTC offset + DST for a birth moment
       ├─ api.js       ALL network I/O
       ├─ wheel.js     chart-wheel SVG coordinates
       ├─ card.js      share-card PNG   (CARD block is design-tunable)
       ├─ reading.js   shard text, woven reading, duet text
       ├─ windows.js   window manager   (LAYOUT block is design-tunable)
       └─ shards.js / duet.js   written content

starshard-api/          Express 4 + MySQL: accounts + saved window layout

mansions/               generated: 28 static permalink pages + index + OG
                         images — tools/build-mansions.mjs regenerates it,
                         never hand-edit (see OWNERSHIP.md)
```

## Runtime constraints — these are not negotiable

1. **No top-level `import` in the script block.** The dc-runtime transpiles it
   with Babel presets `["react","typescript"]` — no module transform — and
   evaluates it inside `new Function(...)`. A static import is a syntax error.
   Modules load via `await import()` in `componentDidMount`; that is why
   `renderVals()` guards on `ready` and falls back to `inertWin()`.
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
  the product's strongest differentiating claim — do not break it.
- **No logic in the markup.** If you want a computation inside `{{ }}`, it goes
  in a module and comes back through `renderVals()`.
- **`astro.js` is verified, not vibes.** See below before you "improve" it.

## Verify before you commit

```bash
npm run check      # regenerate BINDINGS.md + fail on mismatch, then run tests
npm test           # 12 tests: degFmt, weekday, cusps, ascendant, no-regression
npm run bindings   # fails if the markup binds a name renderVals() omits

# browser smoke test — drives the whole reading flow and asserts on the result
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

## Open decisions — ask, do not guess

- **W2.** Resolved — the LLM path is deleted. `weave()`/`duetText()` in
  `reading.js` now assemble each paragraph from opener/connective/mansion/
  closer variants in `shards.js`/`duet.js` (`seededPick()`, deterministic per
  chart). Combined with the 12×12×28×7 = 28,224 underlying combinations, the
  paragraph shape itself varies too, not just the swapped-in nouns.
- **W6.** The account system runs a password database to persist *window
  positions* — it does not save the user's chart. Password reset now exists
  (Resend-backed, hashed/expiring/single-use tokens). Still no email
  verification, no account deletion, no data export, and a quarter of the
  audience is 13–17. Decide whether those are needed, or whether to scope the
  system back down.

Full findings and reasoning: `AUDIT.md`.
