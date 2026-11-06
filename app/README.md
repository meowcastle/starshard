# app/: the Star Shard web app

**Created 27 October 2026 by the night shift (packet SS0).** This folder is the new
Star Shard interface that goes live at the root of starshard.net. Nothing in it is built
yet; SS4 scaffolds it. This file records the decisions it is built to, so that every later
packet starts from the same page. The brief is `STARSHARD-LAUNCH.md`; the queue is
`BACKLOG.md`.

## Build decisions (STARSHARD-LAUNCH.md §2.5, restated)

**Stack.** React 18 and esbuild, both already devDependencies, producing a static bundle.
No in-browser Babel, no dc-runtime, no `new Function`. The `.dc.html` runtime that the
current Star Shard pages and the Manzil game use is not carried into `app/`.

**Styling.** CSS as a token sheet of custom properties. The values come from Manzil V2
(§2.2): the warm near-black radial ground (`#1E1706` to `#080502`), parchment text
`#F2EAD6`, gold `#F0D89A`, muted `#9A8A5E`, amber `#FFB000` for whatever is live or lit;
Cormorant Garamond 600 for headings and Karla for everything else; lowercase copy, outlined
ghost buttons, 1 px hairlines, no radius, a faint starfield. `DESIGN-SYSTEM.md`'s teal palette
and type are retired. Its §3 spacing grid (4 · 8 · 12 · 16 · 24 · 32 · 48 · 64) and its §6
accessibility floor stand. The reference for layout is the "Star Shard Web App" design
canvas (fourteen boards); where a board and the shipped game disagree, the game wins (§0).

**Engine.** `astro.js`, `sky.js`, `stations.js`, `reading.js`, `transits.js`, `findings.js`,
`format.js` and `tz.js` are imported from the repo root as they are. They carry the 202
tests and are not rewritten inside `app/`. `api.js` stays the only module that calls
`fetch()`.

**Where it lives.** Source in `app/`, built to `dist/`, deployed to the site root. The
September Manzil build (`Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html`) is
served at `/play` as its own page with no shell chrome over the stage; its lobby's back link
returns to the shell. `star-shard/` and the Star Shard `.dc.html` files are retired after
launch, not before, by moving them to `_to_delete/`.

**The map (§2.3, APP-FRAMEWORK.md).** One app, three persistent sections and no dashboard.
Desktop at 1024 px and above: a text nav in the header (home · tonight · your chart · your
shard · codex · play · account chip) over a twelve-column page. Phone: a five-tab bar.
Routes: home, tonight, chart, shard, codex, station/:slug, play, account, signin, signup,
reset, verify, privacy, terms. The first run is one stepped route, not twelve page swaps,
and the account prompt comes after the shard is revealed.

**The chart wheel.** One SVG component drawn to scale from the engine's longitudes, with
the 28 stations as an outer ring, tested against three known charts.

**`combos.js`.** 1.5 MB today; split per cell and fetched on demand. First load under 600 KB
gzipped on a phone, under one second to first paint on broadband.

**Accessibility floor.** Real `<button>` and `<label>` elements, visible focus states,
14 px minimum body text on phone, contrast checked against the dark ground (gold and muted
on near-black), `aria-` attributes from the first component, decorative motion disabled
under `prefers-reduced-motion`.

**Tests.** Playwright smoke per route against a local static server, at 390 px and 1440 px,
plus the existing 202 engine tests. `npm run build:app` is the build command SS4 adds.

**Words a visitor reads.** `WRITING.md` and the vocabulary law in `COSMOLOGY.md` §2 bind
every string: the 28 are *stations*, never mansions, on any surface a visitor sees; no em
dashes; no new noun without Justin's sign-off.

## Ground (SS0, 27 October 2026)

Recorded from the night shift's run on the Mac's Linux VM. Host app Node is 24.22.0; the VM
that runs the gates has Node v22.23.4 and npm 10.9.9, Python 3.10.12, Linux 6.8 aarch64.

| package | version |
|---|---|
| react, react-dom | 18.3.1 |
| esbuild | 0.24.0 |
| playwright | 1.62.1 |
| @babel/standalone | 7.29.0 |
| astronomy-engine | 2.1.19 |

Gates on 27 Oct: `npm test` 202/202; `npm run bindings` 408 bindings, none missing;
`npm run selfhost` all three runtime files verified against `support.js`'s SRI hashes.

`npm ci` cannot run from the night shift: it deletes `node_modules/` first, and the agent's
mount forbids deletion. `npm install --no-audit --no-fund` against the existing tree is the
substitute (it added the one missing platform binary and changed no tracked file). Justin can
run `npm ci` on the Mac when he wants a clean tree.

## Scaffold (SS4, 1 November 2026)

**Layout.**

```
app/
  package.json      build:app · serve:app · smoke:app (run here, or `npm --prefix app run build:app` from the root)
  build.mjs         esbuild: src/main.jsx -> dist/assets/app.js + app.css; one index.html per route and per station; copies privacy/ and terms/
  serve.mjs         a static server for dist/ with the index.html fallback (port 4173)
  src/
    index.html      the page template ({{title}}, {{description}}, {{url}})
    routes.mjs      the route table, shared by the build and the bundle
    tokens.css      every color, type size and spacing value, read from the V2 game file
    shell.css       the chrome and the page archetype pieces
    main.jsx        entry: mounts the shell, maps routes to pages
    router.jsx      history router and Link (no dependency)
    shell.jsx       header, text nav, five-tab bar, account chip, footer, the game's icons
    pages.jsx       the pages as the scaffold leaves them (eyebrow, title, one line, doors)
    station-index.json  generated by build.mjs from stations.js (number, epithet, slug, position)
  dist/             build output; not committed
test/smoke-app.mjs  Playwright: every route at 390 px and 1440 px, no console errors (the SS4 gate)
```

**What the shell is.** A header with the brand mark (the game's star-shard icon), the text
nav at 1024 px and up (home · ☾ tonight · ☉ your chart · ✦ your shard · codex · play) and the
account chip; below 1024 px the nav gives way to a five-tab bar (tonight · your chart · your
shard · codex · play) built from the game's pause-menu buttons (the dashed 44 px ring, the
book, the cards, the constellation). Home is reached from the brand mark on a phone;
account from the chip. The footer carries privacy, terms and account. The ground is the
game's radial night with its own film grain.

**Values.** `tokens.css` reads the V2 file: ground `#120D06` to `#0A0603` to `#050302` over
body `#040302`; parchment `#F2EAD6`, ink `#D8C89C`, gold `#F0D89A`, amber `#FFB000`, muted
`#9A8A5E`; the gold hairline at .12, outlines at .22, .3, .55 and .7; Karla and Cormorant
Garamond 600 at the weights the game loads; the game's button (gold outline, the .2 to .07
gold fill, the 3 px drop and glow, 5 px radius). The spacing scale is 4 to 64. Body text
is 16 px on desktop and 15 px on a phone (floor 14); every control is 44 px; the focus ring
is 3 px amber at 2 px offset; the grain stops under `prefers-reduced-motion`.

**Routes.** `/`, `/tonight`, `/chart`, `/shard`, `/codex`, `/station/:slug` (28, from
`stations.js`), `/play`, `/account`, `/signin`, `/signup`, `/reset`, `/verify`; `/privacy/`
and `/terms/` are SS3's static pages, copied into `dist/` and linked as full pages. The
build writes an `index.html` per route and per station so any static host serves every URL
without rewrite rules; `serve.mjs` falls back to the root `index.html` for anything else,
and `dist/404.html` exists for hosts that serve one. An unknown URL renders the not-found
page inside the shell.

**The account chip and the API.** `shell.jsx` asks `api.me()` once on load and shows the
name or "sign in". On `localhost` and `127.0.0.1` it does not call the network at all (there
is no `api.localhost`), so a local smoke run has no connection errors; SS8 wires the real
pages.

**The build command.** The root `package.json` is outside the night shift's write list, so
the scripts live in `app/package.json`. From the root: `npm --prefix app run build:app`,
`npm --prefix app run serve:app`, `node test/smoke-app.mjs`. If Justin wants the root alias
the SS4 gate names, it is one line in the root manifest: `"build:app": "npm --prefix app run build:app"`.

**The smoke on the Mac.** `test/smoke-app.mjs` needs a Chromium that Playwright can launch
(`npx playwright install chromium` once). The night shift's VM cannot download it (the
allowlist blocks the Playwright CDN), so the night shift builds on the Mac and runs the smoke
in its sandbox against the same `dist/` with `SMOKE_OFFLINE=1` (Google Fonts unreachable
there; those two loads per page are reported as warnings, everything else stays strict).

## Home and Tonight (SS5)

**The one sky.** `src/tonight.js` asks `GET /api/tonight?tz=<the device's zone>` once per
load and keeps the answer for the session. When the API does not answer (a local static
server, a dropped connection) `src/sky-device.js` computes the same shape on the device:
`astro.js` for the Moon and the Sun, the game's night anchor (06:00 to 06:00, read at
21:00 local), the server's own ten-minute search and bisection for the next crossing, and
Schlyter's elements, `ephemeris2.js`'s table verbatim, for Mercury to Saturn. The answer
carries `engine` and `source` so a page can say where its sky came from.
`test/tonight-fallback.test.mjs` (part of the root `npm test`) holds the device sky against
`starshard-api/lib/tonight.js` over 730 nights in New York: the Moon's station, degree and
next crossing agree exactly; the five planets stay within 0.17 degrees.

**The street.** `src/scene.html` and `src/scene.css` are generated by `scene-extract.mjs`
from the shipped game file ("Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html"):
the lobby stage's sky and ground, the district's far, mid and near bands, the alley walls,
the lines overhead, the lamps, the lit windows, the street's life and the four set pieces,
every SVG byte the game's, resolved the way the game's own renderVals resolves them at
street level on a generic night. Layers that are invisible at street level (the tower, the
bridge, the high clouds, the aurora, the milky way, the climb's stars) are left out. The
hour of the night is a CSS table in `scene.css`: the game's four walk steps (dusk, full
dark, the small hours, the hour before dawn), which the game ties to the level and the
shell ties to the clock (`hourStep()` in `tonight.js`: 17 to 21, 21 to 01, 01 to 04, 04 to
07; daylight gets the first set). `src/scene.jsx` mounts the fragment at the stage's 932 by
430 and scales it to the width it has; on a phone it is held to a minimum height and the
walls crop. Re-run `node app/scene-extract.mjs` from the root when the game file changes;
the build never reads the game file. The fragment is 37 KB raw, 7 KB gzipped; the build
imports it as text (esbuild's `.html` loader).

**The ring.** `src/ring.jsx` is the game's codex ring (its `_codexVals`): 300 by 300,
radius 118, station 1 at the top and the rest clockwise, the four quarters in the game's
four colours, the moon's station breathing in amber. Each segment is a link to its station
page. `marks` carries the ☉ and ☽ at their stations; SS7 adds the natal marks.

**Home** is the lobby: the street under the real hour, tonight's station as the headline
("the moon is in the glance"), the one sentence that says what the product is, the three
doors (walk, read, the codex), the two cards (your chart, your shard; cards because each is
heterogeneous and tappable as a whole, the one case APP-FRAMEWORK allows), and one note with
the station's range and the next crossing. **Tonight** is archetype A: eyebrow and title,
the ring with the moon lit, one measure of prose with the degree and the position word
(entering, dwelling, turning, leaving), the link down to the station page, then the planet
rows (glyph, name, ℞ when retrograde, degree and sign, station), the next crossing, and the
one line to the game.

**Vocabulary** on both pages: station, the codex, your chart, your shard, the road (the
game's own word for the walk), the four position words. "Mansion" appears nowhere; no new
noun.

## Your chart (SS6, 1 November 2026)

**The engine.** `src/chart-engine.js` is pure JavaScript, run in Node by
`test/chart.test.mjs` and in the browser by the page. `astro.js` is the engine of record for
the Sun, the Moon, the ascendant, the midheaven and the Placidus cusps (Porphyry above 66°,
as `astro.js` already decides); the vendored `astronomy-engine.js` gives Mercury to Pluto
with a one-hour rate for the retrograde flag, imported on demand so it lands in its own
chunk (`build.mjs` now splits; the first load does not carry the 108 KB); `tz.js` turns the
wall-clock time at the birthplace into the UT offset; `transits.js`'s `classifyAspect()` is
the one orb table for every pair of the ten bodies plus the ascendant and midheaven (the two
angles are never aspected to each other). Stations are `astro.js`'s `mansionOf()`, 1-based.
The three known charts are `test/chart-fixtures.json`: the Swiss Ephemeris (pyswisseph
2.10.03, Moshier ephemeris, Placidus) for Greenwich at J2000, New York 1985 and Sydney 1992;
the test holds every longitude, sign, house, station and retrograde flag to them.

**No birth time** casts a noon chart: no houses, no ascendant, no midheaven, the moon with a
stated 6.5° either way (drawn as a stretch on the wheel). **No matched place** (a city typed
and never picked from the list) casts the same way.

**The birth record** is `api.js`'s birth shape, kept in `localStorage` under
`starshard-birth` (`src/birth.js`) so a visitor with no account has a chart; signed in, the
server's `GET /api/me/birth` wins and a new record is also sent up with `saveBirth` (the
game's one-time chart grab contract). The form (`src/chart.jsx`, `BirthForm`) is date, time
or "not known", and a place looked up through `api.geocode()` (Open-Meteo, the game's own
lookup); a picked place carries its coordinates and time zone.

**The wheel** (`src/wheel.jsx`): 600 by 600, the ascendant at the left and the zodiac
counter-clockwise as printed charts draw it (0° aries at the left on a noon chart). Outside
in: the 28 stations as the outer ring (the game's codex ring, the same quarter colours and
gap, the natal moon's station lit the way the game lights tonight's; each segment a link to
its station page), the twelve signs with their glyphs, a degree scale, the twelve houses with
cusps and numbers, the ascendant and midheaven as the heavy lines (AC, MC, DC, IC), the ten
bodies at their longitudes with their degrees (glyphs pushed apart where they crowd, a tick
keeping the true place), the aspects as lines across the centre (the game's teal for trines
and sextiles, its red for squares and oppositions; conjunctions are in the list, not drawn).
Every glyph carries U+FE0E so phones draw it as text, not colour emoji.

**Every term is a Term** (`src/term.jsx`, `src/lexicon.js`): a real button set inline in its
sentence, its definition a hover, a focus or a tap away, kept on screen by a measure and
shift. The lexicon holds the ten bodies, the twelve signs, the twelve houses, the five
aspects, the four angles, retrograde, station, cusp, orb, placidus, porphyry, tropical and
"noon chart"; a term it does not hold renders as plain text marked `data-term-missing`, which
the smoke refuses. The page is archetype B: header, the wheel beside the planet rows at 1024
px and up, then the houses, the aspects (tightest first, with the plain names from
PRODUCT.md), the stations, and the doors (change the birth data; keep this chart, to signup,
for SS8; your shard).

**Vocabulary:** station is the one coined noun; everything else is the astrology word, defined
once. "Mansion" appears nowhere.

## Your shard and the first run (SS7, 1 November 2026)

**Two surfaces, one corpus.** `/shard` with no birth record is the first run from
`UX-FLOW.md` section 2, one stepped route in `src/shard.jsx`: the burst (one point of light,
then the star breaks into shards that settle into a night sky; eight seconds on a first
visit, two on a return, a skip from the first second), the arrival (three beats), how this
works (the four sky-maps with real names, the ring with tonight's moon, `computed on this
device`), the ask (the chart page's own `BirthForm`, its button reading "read the sky"), the
compute (a readout of the real values, typed line by line: the sun, the moon, the horizon,
the phase, the moon's station, then "shard found"), the reveal (the shipped game's shard
screen: its eyebrow, the ring with the natal marks, the name in Cormorant, the sun's and the
moon's station cards with the game's own art and lines, one strange line, one button), then
the account prompt with its reason. "read your shard" opens the document. `/shard/start`
replays the arrival for anyone; a returning visitor's skip goes straight to the compute.
`prefers-reduced-motion` draws every screen at once.

**The document** is the reading as long-form text at one measure: the shard's name as the
title, the sub line (sun, moon, rising, the phase), the ring beside the opening and the one
checkable rarity (`findings.js`, with `rates.js`'s measured rate as "1 in N"), then eight
sections in `UX-FLOW.md` section 3's order under headers made only of words the reader
arrived knowing ("your sun is in pisces", "aries was rising", "how you walk"), each opening
with its plain fact (the corpus's `LEAD.*` lines), then the corpus body, then "where this
comes from" folded away (`stations.js`: the arabic, indian and chinese names and meanings,
the stars, the animal and its guardian, the disagreement note when the traditions do not
match, the door to the station page). The close, the three-line recognition beat, the invite
to tonight with tonight's station, and the doors: come back tonight, your chart, keep this.

**The engine** (`src/shard-engine.js`, pure, tested by `test/shard.test.mjs`): `astro.js`'s
`computeChart`, `sigil.js`'s `deriveSigil` and `readingPlan`, `reading.js`'s
`arrivalReading` and `fullReading`, `findings.js`'s `enumerateFindings`, `format.js`'s
`degFmt`, all imported as they are. The corpus (`reading-copy.js`, 62 KB gzipped), the
station table and the planet engine load on demand in their own chunks. The shard's name is
the game's: the sun's station of the moon's ("the gate of the thread"), or "twice over" when
they share one; the traveler type lands in "how you walk", where the corpus derives it.

**The house style at render** (`src/house.js`): the corpus was written before `WRITING.md`
fixed the two rules `tools/writing-lint.mjs` enforces mechanically, so every corpus string
passes through `house()` on its way to the page: em dashes become comma pairs (a colon or a
period where the corpus already had one; "to" inside a degree range), "mansion" becomes
"station", and the title-case epithets and type names `reading.js` interpolates are lowered.
Nothing else in the prose is touched; the lint's prose rules (prophecy, throat-clearing) are
the corpus's own to fix (the run report lists the lines).

**The game's assets** come through `app/game-extract.mjs`: the station art from
`manzil-art2.js` (`src/station-art.json`, 87 shapes, with the keyframes they name in
`src/station-art.css`) and the 28 lines of observation from the game's `_mPoem` table
(`src/station-poems.json`). Re-run it from the root when either changes; the build never
reads the game file.

**Vocabulary:** shard and station are the coined nouns; the five type names appear once each
in the gait and the close, after the corpus has derived them; "mansion" appears nowhere.

## Accounts (SS8, 1 November 2026)

**Five pages, one store.** `src/account.jsx` holds sign in, sign up, forgot and reset, the
verify-email landing and the account page; `src/account.js` holds who is signed in (one
store read by `useMe()` everywhere, written by the pages when a sign in, a sign up, a reset or
a sign out changes it; before SS8 the shell asked `/api/me` once at mount and nothing could
change the answer without a reload) and the shell's own words for the server's error codes.
`api.js` at the root stays the only module that calls `fetch()`.

**Sign up runs the age check first** (`POST /api/auth/age-check`), before any other field is
shown: the birth date alone, prefilled from the chart on the device when there is one. A date
under the regional minimum opens nothing (the game's own line: "the sky asks you to come back
in a year or two", with a way back for a mistyped date); a date old enough opens a name, an
email and a password. The chart cast on the device goes with the account when its date is the
one checked (`birthTime`, `birthTimeKnown`, `placeName`, `lat`, `lon`, and the birthplace zone
as `birthTz`; `tz` on the body stays the device's region signal for the gate, as `api.js`
fills it). Sign in takes an email or a name (the server's login accepts either).

**The mail's links** go to the site root with the token after a `#` (`/#resetToken=...`,
`/#verifyEmail=...`), the shape `starshard-api/server.js` already sends; `main.jsx` opens
`/reset` or `/verify` for them whatever path the link was opened on, the router keeps the
hash, and the page clears it from the address bar once the token is spent.

**The account page**: the chart the account keeps (`birthWords`, the doors to the chart, the
shard and the game), a copy of the data (`GET /api/me/export`, downloaded as
`star-shard-data.json`), a reset link for the password, the confirmation mail again while the
address is unconfirmed, sign out (the chart stays on the device), and the delete folded under
its own header: the password first, then `DELETE /api/me`, then the device's record is
cleared and the page says the account is gone. Signed out, `/account` is a sign-in prompt.

**The smoke's stranger** (`test/smoke-app.mjs`, the SS8 block) boots `starshard-api` in
process against its SQLite shim and serves the build at `http://starshard.test` with the API
at `https://api.starshard.test`, both answered by Playwright routes (the API route keeps the
session cookie, one jar per stranger), so the shell talks to a real local server the way it
talks to production. `cd starshard-api && npm install` once; without it the block reports
itself skipped and fails the run.

**Legal pages**: `privacy/` ("your rights") and `terms/` ("ending it") now point at the
account page for the copy and the deletion, as the packet asked once the buttons existed.

## The codex (SS9, 2 November 2026)

**A generator, not hand prose.** `app/codex-extract.mjs` gathers one record per station into
`src/codex.json` (and the small `src/codex-index.json` the index and the ring read) and names
the source row of every field in a `trace` map: the epithet, slug, range, stars and kanji from
`stations.js`; the Indian and Chinese rows from `research/mansions-table.json`; the Japanese
star-name, the guardian, the match flags (the "sixteen match flags" table) and the alignment
note for stations 22 to 28 from `research/corpus-mansions.md`; the five `MANSION.nn` slots
(claim, synthesis, election, archetype, keyword) and the two `STATION.nn` slots the page uses
for "born under it" (strike, facing) from `reading-copy.js`; the card's two faces and its
signature (text, verb, when it fires) from the shipped game's own `pool` and `ABS` tables;
the walkers of the house (name, figure, the line on the way in) from `walker-sheet.js`; the
line of observation from the game's `_mPoem` (game-extract.mjs). Re-run it from the root
when any of those change: `node app/codex-extract.mjs`. The build refuses to run without 28
records. Every corpus string passes through `house()` on its way to the page, as the shard's do.

**The index** (`src/codex.jsx`, `Codex`): the ring with tonight's moon lit (the device sky
when the API is away), one line saying where the moon is and when it crosses next, then the
28 as rows: number, the card's art, the epithet, the corpus's keyword, the range, the kanji;
tonight's row marked. **A station page** (`Station`, `StationArticle`): the card the game deals
for it (the quarter's wash, the gold border, the art, the two faces at the edges they fight on,
the signature) beside the corpus's claim and archetype; then, at one measure, the four skies
(arabia, india, china, japan, the stars, with the synthesis under the grid and the match flag
as the corpus's own test sentence), born under it (the sun's station reading), when the moon
crosses (`src/crossings.js`: the next three visits from `astro.js`, entry and exit to the
minute, framed as presence and return, never a countdown), what the books say (the election
slot), the card and its signature (left face, right face, signature, fires, what it does),
the walkers (none for 22: the roof has no roster yet), sources, and the doors to the two
neighbours. The full records load on demand in their own chunk (47 KB gzipped); the first
load carries the index only.

**The public pages.** `build.mjs` now bundles `src/prerender.jsx` for Node and renders the
codex and every station page to static markup inside `#app`, so a crawler (or a reader with
no script) gets the text; the bundle renders the whole page over it on load (the smoke waits
for the bundle's own `main`, not the prerendered one). Each station's `index.html` carries a
title, a description made of the corpus's claim, `og:type article`, `og:title`,
`og:description`, `og:url`, `og:image` (1200 x 630) and `twitter:card summary_large_image`.
`dist/sitemap.xml` lists the root, the seven public routes and the 28 stations;
`dist/robots.txt` names it. The old `mansions/` output and the root `sitemap.xml` are the
generator's and are not touched; the deploy (SS12) ships `dist/` to the root, which replaces them.

**The link images.** `app/og-render.mjs` draws one JPEG per station (`app/og/<slug>.jpg`,
about 50 KB each) in the game's language from the same `codex.json` and the station art,
with Playwright's Chromium. The night shift's VM has no browser and no route to Google Fonts,
so the 28 were rendered in the sandbox with the `@fontsource` Karla and Cormorant Garamond
files (`--fonts <dir>`); on the Mac, `npx playwright install chromium` once and
`node app/og-render.mjs` runs as is. `build.mjs` copies them to `dist/og/` and writes the
`og:image` tags for the ones present.

**The smoke** gained an SS9 block (the index, the follower's page end to end, the next door)
and a static check after the browser closes (every station's metadata and prerendered
article, the sitemap well-formed and complete, robots.txt).

**Vocabulary:** station, codex, shard, the card's own words from the game (face, signature,
fires, lodge, claim, the count). No new noun. "Mansion" appears nowhere a visitor reads.

## The play route (SS9b)

**Where.** `/play/` is the game itself, the September Manzil file ("Star Shard v3 Build
Plan/Manzil - Game Prototype V2.dc.html") served as its own page: no shell chrome over the
stage, the same origin, the same session cookie, the same `api.js`. In `routes.mjs` the
route is `external: true`, so the header nav and the tab bar hand it to the browser as a full
navigation (the `Link` already did that for the legal pages); the shell renders no play page,
and the four doors to the game (home, tonight, the account page, the codex's card note) point
at `/play/`.

**How it is built.** `build.mjs` step 7 writes `dist/play/index.html` as a copy of the game
file with six rewrites applied at build time, each of which must match exactly once (a new
delivery of the game that moves a line fails the build rather than shipping a broken door):
`<base href="/play/">`, a title, a description and the OG tags in the head; the bridge
script after `ephemeris2.js`; the retired "your star shard" anchor's href (it pointed at the v4
file) to `/`; the codex's "open star shard" href from the production root to `/shard`; and
the shard-app screen (the lobby's moon mark, "star shard", then "the shard app"), which
shipped as a dashed "under construction · the door opens soon" box: the box is now the
door, `<a href="/" data-mzdoor="shell">your star shard ›</a>` in the game's own gold button
and the game's own words, the line "the sign-up will live here" is gone ("esc steps back"
stays), and "bought once, yours forever. no subscription." is not shown while nothing is for
sale (the decisions queue has it). The source file is never edited, the same rule as
`tools/selfhost-runtime.mjs`.

Beside it in `dist/play/`: `support.js` is the self-hosted dc-runtime (`build/support.js`,
built by `tools/selfhost-runtime.mjs` from the pristine root copy on every build, so
unpkg.com is not in the critical path), `ephemeris2.js`, `manzil-art2.js`,
`socket-io-client.js`, `api.js`, `manzil-copy.js`, `tz.js`, the two reference sheets the
lobby links to (the rules sheet and the user's manual, from `manzil/`, with their
`../support.js` turned into `./support.js`) and `doc-page.js`. The runtime's three vendored
dependencies (React, ReactDOM, Babel standalone, 3.2 MB, loaded once and cached) go to
`dist/vendor/`, root-absolute as the shim expects. The game stays what it is: an in-browser
Babel compile of a 1.8 MB file. It boots in about half a second from a local origin.

**One sky.** `app/play/tonight-bridge.js` loads right after `ephemeris2.js`. The shell keeps
every `/api/tonight` answer in `localStorage` under `starshard-tonight` (`src/tonight.js`);
the bridge reads that key synchronously before the runtime boots and, when it holds tonight
(same night, same zone), `ManzilEphem.mansionOf(name)` with no date and `nightRuler()` with
no date answer from the server's sky, so the game opens on the station the shell showed.
Every dated call and every night the key does not cover falls through to `ephemeris2.js`
as shipped. The bridge then asks the API once (through `api.js`'s own `API_BASE`) and keeps
the answer for the next load. `ManzilEphem.source` says which engine answered.

**The smoke** gained an SS9b block at both widths: an account made through `/play/api.js`
with a birth record, home signed in with the sky kept, the nav (the tab on a phone) to
`/play/`, no shell chrome, the base, the title, the bridge answering from the API with the
shell's station, the rotate prompt in portrait, the lobby signed in, the moon road to a board
(nine slots, a hand), the pause menu and leaving the road, the moon mark to the shard app and
its door back home with the session intact, the account deleted. The game's screens are divs
with `onClick` and hints that fade in with pointer-events off, so the smoke taps at the
centre of the element that carries the words (or the stage) rather than through Playwright's
actionability checks. The browser logs every `{{ x }}` it meets in the raw template's SVG
attributes before the runtime boots; the smoke counts those 28 as the dc format's own and
fails on anything else.

**Vocabulary:** play, star shard, the shard app, the game's own words. No new noun.

## One field after the first night (MZ3, 2 Nov 2026)

**Where it is.** The shard document is the first night the shell gives a stranger: the burst,
the ask, the compute, the reveal, the reading. Under the reading, beside the account door, a
visitor with no account can leave one thing: an email (`src/leave-email.jsx`, drawn by
`src/shard.jsx`'s invite section). It is not drawn for a signed-in visitor, when the device's
birth record says the visitor is under thirteen, or when there is no API to answer (a local
static server), the way the chip stays signed out there. The game's own first night sits
behind its cast, which is the signup, so the game has no pre-signup night to put a field
after; a field there is a game edit, queued with MZ1's copy and MZ7's doors.

**What the server keeps.** `POST /api/email` takes the address, a random id the device made
for itself (`starshard-device`, 32 hex characters, stored only as its sha256), the birth date
the chart was cast from (for the age gate, with the request's own region read, as at signup;
nothing from it is stored), the device zone and a `source` (`shard` or `play`). One row in
`email_capture` (`starshard-api/schema.sql`, `migrations/2026-11-02-email-capture.sql`): the
address, the hash, the zone, the source, when. A repeated address answers 200 and changes
nothing, so the route never says whether an address is known. `DELETE /api/email` with the
same device id removes the row while no account owns it. At signup the row with that address
becomes the account's in the signup transaction; an address that already has an account is
linked from the start. The export carries it as `emailLeft`; `DELETE /api/me` removes it by
account and by address, so a row left from another device goes too. Nothing is sent to the
address yet: SS15 is the nightly mail, and the copy says so ("when the nightly mail begins").

**The client.** `api.js` at the repo root is the one module that calls `fetch()`; this run
could not write it, so `leave-email.jsx` makes its two calls against `api.js`'s `API_BASE`
until they move in. The device remembers the address it left under `starshard-email-left`
so a reload shows "take it back" rather than the field again.

**Tests.** `starshard-api/test/email-capture.test.js` (7 tests: the row and nothing else,
idempotence, the four refusals, the device taking it back, the link at signup with export and
delete, the link when the account came first, the unlinked row removed by address). The
stranger's path in `test/smoke-app.mjs` leaves the address under the shard, checks the row
and the hash, reloads, takes it back, leaves it again, and later checks the link, the export
and the delete.

**Vocabulary:** email, the nightly mail, leave it, take it back. No new noun.

## The account's doors inside the game (MZ4)

**2 November 2026, the 15:12 run.** Export and delete live on the shell's account page (SS8;
`privacy/` and `terms/` say "on the account page"), so the game links there instead of growing
a second delete flow. Three build-time rewrites in `build.mjs`, each asserted to match once,
the source file untouched:

- **The pause overlay** (Escape, in a match): "privacy" and "terms" join "sound" and "log out";
  a second row carries "a copy of your data" (`/account#acct-data-h`) and "delete the account"
  (`/account#acct-del-h`), the delete in the ember the overlay already uses for "forfeit the
  climb". All four open in a new tab: the night holds, nothing on the board is lost.
- **The player-chip menu**, the one menu a phone reaches: an "account" item beside "log out",
  drawn like it (the dashed circle, a line glyph, the 9.5 px label), shown when no match is
  running, a plain link to `/account` in the same tab.
- **The cast's last step** (the password): the line under the cast button said the record was
  "computed and kept on this device", which stopped being the whole truth when signup began
  sending it to the server (SS1). It now reads "making an account agrees to the terms; the
  privacy page says what is kept and why", both linked, in a new tab so the cast keeps its
  fields.

**The account page** (`src/account.jsx`): a hash of `#acct-data-h` or `#acct-del-h` scrolls to
that section once `me` is known (the browser's own jump happens before the page renders), and
`#acct-del-h` opens the delete fold. After a delete, `clearDeviceAfterDelete()` removes every
`manzil-*` key (the game's progress, birth record, signed-in name, telemetry, settings) and the
shell's own markers (`starshard-burst-seen`, `starshard-email-left`), so "nothing of it stays
on this device" is true for the game as well; the sky cache and the device's id stay.

**Tests.** `test/smoke-app.mjs`: `mz4 account doors` inside the play route (the pause overlay's
four doors by href, label, target and position in the viewport; the player menu's "account"
item clicked through to `/account` signed in; the delete from `#acct-del-h` with the fold open
and in view; the device swept) and `mz4 static` (the cast line in `dist/play/index.html`, the
door count, no em dash).

**Vocabulary:** account, privacy, terms, a copy of your data, delete the account. No new noun.


## The game file's console and the duplicate figure (MZ5)

**3 November 2026, the 06:12 run** (finishing what the 21:12 run began). Four fixes, all on the
shipped copy `dist/play/index.html`, by rewrites and a sweep in `build.mjs`; the September
source is not edited and `tools/check-manzil.mjs` now checks both files with one rulebook.

- **The reload hack.** Lines 6 to 8 of the source carried `__mzRetry/__mzHeal`, a cache-busting
  re-fetch of support.js, manzil-art2.js and ephemeris2.js written for the retired `manzil/`
  subdirectory deploy. The build copies every file the page loads beside it, so the shipped page
  loads support.js plainly and a missing file is a build failure, not a reload.
- **The geometry sweep.** The browser parses the raw template before the runtime boots, and a
  mustache in an SVG geometry attribute (`viewBox="{{ s.artBox }}"`, `cx="{{ d.x }}"`,
  `d="{{ ln.d }}"`, `x="{{ cdxSunX }}"`) is a console error at that first parse, 28 per boot.
  The build writes each as the runtime's own `sc-camel-<attr>` form (support.js, `CAMEL_ATTR`):
  unknown to the browser's parse, read by the runtime as the same React prop, the real attribute
  on the element after hydration. The count is asserted (`GEOM_SWEEP = 28`, on 22 tags), so a
  delivery that adds a site fails the build here and `check-manzil` on the output.
- **The duplicate `_figs` key.** Two men are named brann: the archetype of the house-0 roster
  (op .95, the walkers screen's trio, and a match on a night whose house has no roster of its
  own) and house 24's walker, the fisher (op .34, one of that house's faint silhouettes). An
  object literal keeps the last key, so the archetype's drawing was unreachable. Walkers are drawn
  by name first, so the fisher's figure moves under its own key, `"brann (the fisher)"`, named by
  a new drawing-only field on his roster row, `figKey`, which the three match readers consult
  before the name. Nothing else declares one; a static walk of every roster against the readers
  shows 223 walkers drawing exactly the figure they drew before and the fisher drawing his, with
  the archetype's key and the trio's reader as the source wrote them. (`fig` is the seat and is
  not repurposed.)
- **check-manzil.** No warning class remains. On the shipped copy a bound geometry attribute, a
  duplicate `_figs` key or the reload hack is a failure; on the source they are reported as
  residue with their counts, the size the sweep is held to. `node tools/check-manzil.mjs <file>`
  holds one file to the shipped rules.

**Tests.** `npm run manzil` (both files, 0 warnings); `test/smoke-app.mjs`: `mz5 geometry`
inside the play route (zero pre-hydration SVG attribute errors where 56 were counted before, every
`viewBox` and `cx` on the board numeric after hydration, no `sc-camel-` attribute or mustache
left in the live DOM, `__mzRetry/__mzHeal` undefined) and `mz5 static` (the shipped file).

**Vocabulary:** nothing a traveler reads changed. No new noun.

## The far hand reported, and the sky's restart (MZ6)

**3 November 2026, the 12:12 run.** The server had the handler (`report_player` writes
`manzil_reports` and `manzil_blocks`; the matcher skips a blocked pair) and the game never emitted
it; a deploy restarted the lobby with every live match lost and no word to anyone. Both halves
are done, the game's half by seven rewrites in `build.mjs` on the shipped copy, the source never
edited.

- **The server** (`starshard-api/lib/manzil-lobby.js`). `report_player` answers: `reported` once
  the row and the block are written, `report_failed` (`no_such_match`, `server_error`) when they
  are not; one row per reporter per match, a second tap answers `reported` again and writes
  nothing. A closed table stays reportable for ten minutes (`REPORT_WINDOW_MS`, seats only; the
  matcher never sees it), so a report can follow the match from its win or loss screen. The lobby
  returns `{ shutdown, stats }`; `server.js` calls `shutdown` on SIGTERM and SIGINT (the way
  `tools/deploy.sh` stops the process): every connected socket hears `server_restart`, the queue
  and the matches are let go, each socket is closed from the server side (the client does not
  reconnect from that, where a plain transport drop would have it retry against the new process
  and arrive with no match), the listener closes, the process exits inside the deploy's
  one-second gap (a hard deadline at 800 ms covers a close that hangs).
- **The game.** The socket hears the three answers. It stays, with the match id, through the win
  or loss screen (`_netMatchResult` no longer drops it; the next "find a match" or any leave
  cleans up as before). The pause overlay carries **report the far hand** under "leave match",
  in the ember the overlay uses for leaving; it asks **report the far hand?** with the line "the
  report keeps this match's record. the two of you are never dealt together again." and **no** /
  **yes, report**, drawn like the overlay's own forfeit prompt; after the answer the line
  "reported. the two of you are never dealt together again." stands in its place. A live board
  now has a **pause button** top right under the round pips (44 px, a dashed ring with the pause
  glyph), since the overlay was Escape-only and a phone has no Escape (the decisions queue since
  MZ4). `server_restart` returns a seeking or playing hand to the open tables with "the sky is
  closing for a moment. the table is let go; find a match again in a minute."; the open tables'
  line under the title carries that notice, and "the match ended: the far hand left." which the
  board's log line used to carry under that screen where nobody saw it, until the next "find a
  match" or a step back.

**Tests.** `starshard-api/test/manzil-lobby.test.js` (6; `socket.io-client` is now a
devDependency of the API, `npm install` once): two hands dealt to each other; the report row and
the block, and a second tap writing nothing; `report_failed` for no such match and for a stranger
to it; a report after the table closes; the blocked pair never dealt again; the restart notice and
the server-side close. The SQLite shim learned `INSERT IGNORE`. `test/smoke-app.mjs`: `mz6 live`
at both widths (two signed-in hands to a live board through the local API's lobby, the report
from the overlay on a phone by the button and on the desktop by Escape, the row in
`manzil_reports`, the far hand leaving, and on the last width `lobby.shutdown` with the notice on
the open tables) and `mz6 static` (the shipped file). The socket's websocket upgrade fails against
the smoke's HTTP-only route, as against the NAS's proxy; that one console line is counted, not
failed.

**Vocabulary:** "the far hand", "the sky", "the table" and "the open tables" are the game's own
words for the opponent, the server and the match. No new noun. "report" is the plain verb.

## Doors both ways (MZ7, 3 Nov 2026)

The shell already opened the game: home's "walk tonight's road", tonight's "playable tonight" and
the station page's "play tonight's road" are `/play/` (SS5, SS9, SS9b). MZ7 is the game's two doors
back, both build-time rewrites in `app/build.mjs` on the shipped copy, the September source untouched
(SHIP-AUDIT-26OCT.md section 4.3: "the codex entry for a mansion links to its Star Shard permalink
page, and the night-end screen offers the reading for tonight's mansion").

**The codex.** A house's page in the game carries `a[data-mzdoor="station"]` under the house's line,
beside its card: "the blaze in star shard ›", `href="/station/the-blaze"`. The slug is the house's
name with hyphens for its spaces (`cdxStationHref` in the codex's renderVals), and the build holds
the game's card pool to `stations.js` for all 28 names, so a renamed card fails the build rather
than shipping a dead door. The door sits above the rows on purpose: the rows run past the stage's
430 px and the walkers below them are reached by a scroll; the door is in view on open.

**The night's end.** The win, loss and road-lost screens carry "read tonight ›"
(`a[data-mzdoor="tonight"]`, `/tonight`, the same words as home's own door) beside "lobby" at the
foot of the screen, in the game's gold button. When a claimed house ascends (the "ascended" line,
4C) the door is the house's own page instead. Off on the practice walk and on a table between
friends (`st.duel`). The click stops at the door (`endReadTap`), since the whole end screen is
"anywhere to deal again".

**The old href.** `href="Star Shard v4.dc.html"` was already rewritten to `/` by SS9b (the retired
`display:none` block); the static check asserts no `Star Shard v4.dc.html` is left in the shipped
file, and that the codex's "open star shard" opens `/shard` on this origin.

**Tests.** `test/smoke-app.mjs`: `mz7 doors` at both widths (the shell's three doors, home's as a
full navigation; the codex door bound to the selected house and following a change of house, through
it to the shell's station page with that house's h1 and its own door back; the moon road to a board,
the board played out through the game's dev handle `window.manzil`, our cards on our turn and the
sky's own hand on its, to the end screen; "read tonight ›" beside "lobby", through it to `/tonight`
signed in) and `mz7 static` (the shipped file and the prerendered station page). A note for the next
person who drives a board through the handle: placing the sky's cards as well as ours (the way
`test/fuzz-manzil.mjs` does) races the game's own AI and resolves the board twice; the second
resolution sets the new-moon veil (`nmBeat`) again, and the end screen stays dark. Play one side.

**Vocabulary:** "read tonight" is home's door; "in star shard" the game's own name for the shell;
"the codex", "the house" the game's. No new noun.
