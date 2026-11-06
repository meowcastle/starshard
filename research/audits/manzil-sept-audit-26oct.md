# Manzil (September build) — ship-readiness audit (26 Oct 2026)

*Independent code audit of the repo snapshot. Tests run; nothing modified. Companion to `SHIP-AUDIT-26OCT.md` §2.*

## Where the build is

- **Live file:** `Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html`, 1,817,651 bytes, 16,892 lines, one file. Markup lines 1-5667 (Design's), one `<script type="text/x-dc">` block from line 5668 to EOF (about 11,200 lines, 308 `_`-prefixed methods, Babel-transpiled in the browser and run via `new Function`). `tools/deploy.sh:87` ships it verbatim as `index.html` to `/volume2/web/starshard-staging` on a Synology NAS (`justin@wreckroom.nyc`, cat-over-ssh), i.e. `staging.starshard.net/`. Backend: `starshard-api/server.js` (Express 4 + MySQL + socket.io) at `api.staging.starshard.net`.
- **Runtime deps loaded by the page:** `support.js` (dc-runtime; `build/support.js` shim points React/ReactDOM/Babel at `/vendor/`), `manzil-art2.js`, `ephemeris2.js`, `socket-io-client.js` (`<script>` lines 7, 381-383); dynamic `import()` of `./api.js`, `./manzil-copy.js`, `./tz.js`, `./socket-io-client.js`. All listed in `FRONTEND_FILES` (`deploy.sh:34`). `walker-sheet.js` is a source (rosters generated from it, line 8873), not loaded at runtime.
- **`npm run manzil`** (`tools/check-manzil.mjs`): static checks only. `data-props` JSON valid; no bare `{{ hole }}` inside `<svg>` whose producer returns a raw array (the React #31 crash class that reached players 6 Sep); `castShapes` producer/template agreement; 45 code-owned behaviour markers present (lines 100-153); walker roster parity with `walker-sheet.js`; `_figs` art for every walker; geometry-attribute mustaches as warnings. Result: pass, 87 svg holes resolved, 45 markers, 5 warnings (15 `svg.viewBox`, 3 `circle.cx`, 2 `path.d`, 2 `text.x` bound mustaches = pre-hydration console noise; duplicate `"brann"` key in `_figs`).
- **`npm test`: 202/202 pass**; none exercise the game. `npm run bindings`: 408, none missing. `npm run selfhost`: all three vendor hashes verified. Engine self-checks: `research/manzil-engine-current.cjs` 140 pass, `starshard-api/lib/manzil-engine.js` 36 pass.

## Feature inventory

| Feature | Status | Evidence |
|---|---|---|
| Nightly sky (moon's true mansion picks the house) | working | `_castFive` 7993 via `window.ManzilEphem` (`ephemeris2.js`, truncated Meeus); `_tonight`/`_nextOpen`/`_moonReach` |
| Walkers' road / ladder (8 rungs + mansion, 3 lives, best-of-3 at rungs 5-8, handicap/caution) | working | `_freshRoadStep` 11068, `_advanceRound(sameRung`, `_handicapFor`, `_cautionsFor`, `_livesMap(`; rosters 8873; only 27 roster rows carry authored `hand:` (padded by `_seven` 6621, by design per 17 Sep) |
| Boss board, 18 station laws, 9 lawless levels, m22 closed | working | `_bossRule`/`_lawSt` 62 refs; boss hand `[101..105,108,109]` 11078 |
| 28 signatures + 5 planets | working | `_simpleMove` 8003-8031 (28 entries); 33 distinct `ab:` keys |
| Mulligan (7 → one look at 6, kept cards stay) | working but inert with a 5-card pack | `_mullAgain` 6644; `_deal` 6605: `if (bag.length <= n) return bag`; `deckSel` capped at 5 at 15755, 16374, 16445, 16464 |
| PvP + lobby | working, fragile | client `_netQueue` 6157 → `io(API_BASE)` polling-first; emits `queue_join/queue_cancel/place/match_ready_ack/leave_match`; server `lib/manzil-lobby.js` in-memory, `MAX_CONNECTIONS 500`, 60 s reconnect grace, authoritative faces/moves, requires session cookie; `report_player` handler exists server-side (line 515) but client never emits it |
| Pass-and-play | working | `duel.mode` non-live paths |
| Sound | working | `_sfxAc` WebAudio, 65 `_sfx` calls, toggle `manzil-v2-sound` 8511 |
| Telemetry | local only | `_devTele` 10367 → `localStorage manzil-v2-telemetry`, export as JSON blob 10442; no server endpoint; no analytics |
| Accounts/login | working | in-page cast→signup→signin; `api.me()` gate 5771; progress sync `_syncProgress` 10968 → `PUT /api/me/manzil-progress` |
| Email capture | only as signup field | `bEmail` input 5115 is step 5 of the account cast |
| Tutorial | working | `_demoScript`, `tut5`, `st.practice && st.tutor` |
| How to play / glossary | working | `_howto` 9437, phases `howto`/`gloss` |
| Levels | 27 of 28 open | m22 closed; `#allopen` hatch |
| Mobile | partial | fixed 932×430 stage scaled by transform; `rotateOn` prompt; touch-hold; one `@media` (reduced-motion, line 248); no safe-area; type-size issues per `research/THE-MOBILE-PORT-15SEP.md` §2 |
| Settings | minimal | pause menu `pauseOn` 2314 (sound, log out); no account delete/export UI (`deleteAccount`/`exportData` in `api.js:201-209`, 0 callers) |
| Codex / ledger / level ring | working | `_codexVals`, `_moonReach`, link to `https://starshard.net` 10657 |

## Bugs and gaps

- No TODO/FIXME/HACK/XXX in the live file. `console.error` ×3 / `console.warn` ×2, all in `_physicsAudit` (8501-8503, dev-only; `_destinations()` lacks rows for several houses).
- **The "-2 script bug" does not reproduce.** `index.html` loads `manzil-art2.js`/`ephemeris2.js` as bare relative `src` (lines 381-382); both are in `FRONTEND_FILES`. The original breakage was the retired `manzil/` subdir deploy, which only has `ephemeris.js`/`manzil-art.js`. Lines 6-8 carry a `__mzRetry/__mzHeal` reload hack for exactly this failure; delete it. `research/THE-AUDIT-17SEP.md:220` reached the same conclusion.
- **Pack of five makes the deal and mulligan dead code.** The cap is hard-coded `5` at six or more sites plus `fiveCards`/`fiveLabel` UI (16334-16349).
- Stale references to `manzil/index.html` in docs only.
- **No global error handler** (`window.onerror`/`unhandledrejection`: 0 hits); a crash blanks the stage silently, which is how the 6 Sep #31 crash went unnoticed.
- **Legal pages unreachable:** `privacy/index.html`, `terms/index.html` deployed, linked from nowhere in V2 or `account/index.html`. Entity/contact unconfirmed (`privacy/index.html:47`; CLAUDE.md W6).
- Canonical-engine drift risk: `research/manzil-engine-current.cjs` is a hand port, not live-synced; walker-sheet "hand" field regressed once (15 Sep).
- `_figs` duplicate `"brann"` key; 22 bound geometry attributes.

## Tests

| Suite | What | Status |
|---|---|---|
| `npm test` (18 files) | astro/sigil/reading/age-gate; nothing Manzil | 202/202 |
| `tools/check-manzil.mjs` | static regression guards | pass, 5 warnings |
| `manzil-engine-current.cjs`, `lib/manzil-engine.js` | engine vectors | 140 / 36 pass |
| `test/fuzz-manzil.mjs` | Playwright vs staging: hostile localStorage, all 27 levels, input spam, viewports | blocked (Chromium + staging host) |
| `test/qa-loop.mjs` | Playwright geometry QA per level | blocked |
| `test/selfhost.mjs` | unpkg-blocked boot | blocked |
| `test/smoke.mjs` | drives Star Shard v4, not Manzil; `smoke-phone.mjs` non-functional | n/a |

Nothing in CI plays a full board headlessly; the dev harness (`_simBoard/_simClimb`, hash `#dev`) is browser-only.

## Blockers (standalone free web game)

1. Account wall with no pre-signup email capture and no in-app deletion/export UI (GDPR; App Store 5.1.1(v)).
2. Legal pages not linked; unconfirmed entity/contact.
3. Starter pack of five → solved opening; deal/mulligan inert.
4. No error reporting; telemetry localStorage only.
5. PvP: single in-memory process, no persistence, polling transport behind a non-upgrading proxy, no client report/block UI.
6. Hosting: residential NAS over a home uplink, cat-over-ssh deploy, Cloudflare tunnel still a runbook (`docs/CLOUDFLARE-RUNBOOK.md`), `TRUST_EDGE_HEADERS` off.
7. Phone: no safe-area CSS, small type, portrait prompt only; not verified on device.

## Should-fix

- Delete the `__mzRetry/__mzHeal` hack once deploy is trusted.
- Accessibility: 0 `aria-`/`role=`; everything is `div`/`onClick`.
- Sweep the 22 bound geometry attributes and the duplicate `_figs` key; promote check-manzil warnings to failures.
- Playwright gate in CI (fuzz + qa-loop) against a local static server.
- `_destinations()` missing rows.
- Password reset depends on Resend configured in prod.

## Later

- PWA (no manifest/service worker) → Capacitor per `PLATFORM.md`; needs a build step emitting a static bundle (no runtime eval of a string, no CDN); `THE-MOBILE-PORT-15SEP.md` §3.
- Steam/itch: itch feasible now (zip of `index.html` + ~25 JS files + `vendor/`) but PvP/accounts need the API host. Steam (Electron) adds eval/CDN concern plus Steamworks; weeks.
- Walker rosters: 25 houses pad hands from the pool.
- Canonical engine ↔ client parity check.

## Star Shard touchpoints

- Shared account/API: `api.js` (`API_BASE = https://api.<hostname>`), `server.js` (one `users` table; `manzil_pack`, `manzil_progress`, `manzil_reports`, `manzil_blocks`), `starshard_session` cookie consumed by `manzil-lobby.js`. `account/index.html` is the shared portal; V2 embeds its own cast/signup.
- Ephemeris not shared: Manzil uses `ephemeris2.js` (`window.ManzilEphem`), Star Shard `astro.js`/`astronomy-engine.js`. Only `tz.js` (`dstInfo`) is shared (lines 8080, 16262).
- Links: V2 codex → `https://starshard.net` (10657); Star Shard v4 "the covered well" door forced off (`gameNightOn: false`).
- Design system: shared dc-runtime, Google Fonts (Karla + Cormorant Garamond), `design-system/`, copy table `manzil-copy.js`.
- Deploy: one `tools/deploy.sh`, one host, one `FRONTEND_FILES`.

## Reuse for v2

The engine is the most reusable piece, but it lives inline in a 1.8 MB `.dc.html`; the standalone port (`research/manzil-engine-current.cjs`, 140 vectors; server twin `lib/manzil-engine.js`) is the thing to carry forward. A TCG with a moving road, figures, hours and dignity rewrites `resolve`/`counts`, so expect to keep the test discipline and the data tables (cards, laws, walkers via `walker-sheet.js`, copy via `manzil-copy.js`) more than the code. Sky/ephemeris (`ephemeris2.js`, `_castFive`, moon-house rule) and the accounts/progress API carry over whole. The PvP lobby (identity, matchmaking, perspective flip, reconnect, block list) is reusable as a shell with the engine swapped. The UI shell (dc-runtime, string-evaluated JSX, 308 methods on one component) should not be carried into v2.

## Effort to ship as-is

| Item | Size | Priority |
|---|---|---|
| Starter pack → 12 (`_castFive` fill + pack cap sites + `fiveCards` UI + progress migration) | 1-2 days | blocker |
| Pre-signup email capture (+ server table/export/cascade) | 0.5-1 day | blocker |
| Account delete/export UI in pause menu | 0.5 day | blocker |
| Link privacy/terms; confirm entity/contact | 2 h + Justin | blocker |
| `window.onerror` + small `/api/manzil/errors` sink (or Sentry) | 0.5 day | blocker |
| Cloudflare tunnel in front of NAS + API; enable `TRUST_EDGE_HEADERS` | 1-2 days | blocker |
| PvP report/block UI; lobby persistence or graceful restart notice | 1-2 days | should |
| Mobile: safe-area, type scale, device pass | 2-3 days | should |
| Playwright CI against local server; promote check-manzil warnings | 1 day | should |
| Remove `__mzRetry` hack, `_figs` dupe, geometry sweep | 0.5 day | should |
| A11y basics | 1-2 days | should |
| Static bundle build (no eval/CDN) → PWA → Capacitor | 1-2 weeks | later |
| itch page (zip) 0.5 day; Steam/Electron 2-3 weeks | later |

Total to a defensible free web launch: about 2 to 3 weeks of focused work, provided staging-side verification (fuzz/qa-loop on a real browser) is run.
