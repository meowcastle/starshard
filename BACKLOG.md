# BACKLOG.md — the work queue, three products, one night shift

**26 October 2026, revised the same evening.** Priority order is now: **one app live at
starshard.net first** (`STARSHARD-LAUNCH.md`: the Manzil V2 look, Star Shard's tonight, chart,
shard and codex beside the game), **the game's own fixes second** (`SHIP-AUDIT-26OCT.md` §2), the **Manzil v2 TCG sim track** underneath, and
**Forge sim maintenance** (rename, secrets, scrapers) in the gaps. The night shift takes the
first unblocked packet in this order every night. Each packet is one paragraph of intent, the
files it may touch, and the gate that proves it done.

Standing laws for every packet: **the best version forward** (`STARSHARD-LAUNCH.md` §0: the live game is the finish bar; a mockup never stands in for a real asset; the newest shipped surface is the reference); `CLAUDE.md`; `WRITING.md` (no em dashes in anything a user
reads); the vocabulary law from `COSMOLOGY.md`; `STARSHARD-LAUNCH.md` §2 and `APP-FRAMEWORK.md`
for anything visual (DESIGN-SYSTEM.md's palette and type are retired; its spacing and accessibility floor stand); the ethics floor from `research/game-ethics.md`; no number reported
until the engine that produced it passes its vectors; the agent never commits, never deletes
(moves to `_to_delete/`), never introduces a noun a traveler reads, never spends money.

---

> **6 Nov: three separate products** (`SEPARATION.md`). Star Shard, Manzil and Deck Bench get
> their own repos, APIs, databases and accounts. Claude Code takes Star Shard live from
> `docs/handoffs/HANDOFF-CODE-STARSHARD-LAUNCH-06NOV.md` (repo split, new database, Cloudflare,
> deploy). The build shift finishes SS10 and SS11 here, in `app/`, and takes nothing that
> deploys or ties the products together.

## 0. How the loop works

**Where the agent may write.** `app/` (the new Star Shard build), `starshard-api/` (server
changes, with tests), `privacy/`, `terms/`, `tools/`, `test/`, `v2/`, `research/v2-sim/`,
`research/audits/`, `content/`, `docs/nightly/`, `mtg sim/` for FS packets only, and this
file. It never edits the live Manzil file (`Star Shard v3 Build Plan/*.dc.html`) or
`star-shard/` except where an SS packet says so.

**The run.** 01:00 New York, linked to the Mac. Read this file; take the first packet whose
status is `open` and whose dependencies are `done`; set `in progress`; work; run the gate;
set the status; write `docs/nightly/REPORT-YYYY-MM-DD.md` (passed with gate output, failed
and why, numbers with the vector run that licenses them, files written, decisions for
Justin with options pre-tested).

**Justin, each morning.** Read the report, review the files, commit what passes, answer the
decisions queue by editing this file's status column (`decision (Justin)` → `open` with the
answer in the note).

**Cadence.** The night shift now fires every three hours, around the clock (Justin, 29 Oct). Runs can overlap, so every run takes the lock in `docs/nightly/LOCK` first (see the task prompt), and reports are named `REPORT-YYYY-MM-DD-HHMM.md`.

**Status values.** `open` · `in progress` · `done` · `blocked (reason)` · `decision (Justin)`.

---

## 1. SS: Star Shard live (priority one)

| id | packet | depends | gate | status |
|---|---|---|---|---|
| SS0 | **Ground.** Run `npm ci`, `npm test`, `npm run bindings`, `npm run selfhost`; record versions. Create `app/README.md` stating the build decisions from `STARSHARD-LAUNCH.md` §2.5. | none | 202/202; README exists | done |
| SS1 | **Decouple signup.** `starshard-api/server.js`: `five`/`pack` optional on `POST /api/auth/signup`; derive `manzil_pack` from `birth_data` on demand (`GET /api/me/manzil-pack` computes if absent); signup accepts and stores birth fields. Add route tests against a Docker MySQL (or SQLite shim) in `starshard-api/test/`. | SS0 | new tests pass; a signup with birth data and no pack returns 201; a Manzil signup with a pack still works | done |
| SS2 | **`GET /api/tonight`.** Server computes the Moon's mansion, degree, planets and next crossing from `astro.js` for a given tz. Port `research/audits/ephemeris-compare.mjs` into `test/` as a 730-night agreement test with a tolerance note. | SS0 | route test; agreement test documents the four disagreeing nights and which engine wins | done |
| SS3 | **Legal rewrite.** `privacy/` and `terms/` describe one service with two surfaces, Star Shard first; export and deletion described only as built; operator **Bjur Media LLC**, governing law **New York**, contact **privacy@starshard.net** (Justin answered 29 Oct; the mailbox must exist before launch, queued for him). | none | writing lint clean; the three facts above appear exactly; nothing else in the pages is inferred | done (31 Oct, 18:12 run; `tools/writing-lint.mjs` is the lint; review notes in that run's report §5) |
| SS4 | **Scaffold `app/`.** esbuild config, React 18, static bundle to `dist/`; token sheet from Manzil V2's values (STARSHARD-LAUNCH §2.2: Karla + Cormorant Garamond, the gold/amber/parchment ramp) as CSS custom properties, matched against the "Star Shard Web App" design canvas (14 boards); the one-app shell: header text nav at ≥1024 px (home · tonight · your chart · your shard · codex · play · account chip), five-tab bar below; routes for home, tonight, chart, shard, codex, station/:slug, play, account, signin, signup, reset, verify, privacy, terms. Playwright smoke harness against a local static server. | SS0 | `npm run build:app` produces `dist/`; smoke loads every route at 390 px and 1440 px with no console errors | done (31 Oct, 21:12 run; build on the Mac, smoke in the sandbox against the byte-identical `app/dist/`, see that run's report §2) |
| SS5 | **Home and Tonight.** Home is the lobby (canvas board "Home · the lobby"): tonight's station as the headline, walk / read / codex, the chart and shard cards, V2's lamp-lit horizon scene reused from the V2 file's SVG, the hour lighting (warm / veil / dawn) ported. Tonight is the reading page with the sigil ring. Both from `/api/tonight` with `ephemeris2`-style client fallback. Signed-out home shows the sky before asking for anything. | SS2, SS4 | smoke; renders within 1 s on local; the signed-out state has a title and one sentence that says what the product is | done (1 Nov, 00:11 run; the street lifted from the V2 file by `app/scene-extract.mjs`, the device sky held against the server over 730 nights, see that run's report) |
| SS6 | **Chart.** SVG wheel drawn to scale from `astro.js` longitudes; houses, aspects, planet table; the 28 mansions as an outer ring; every term hover/tap to its definition from the lexicon. Tested against three known charts. | SS4 | three-chart test; smoke; no term without a definition | done (1 Nov, 09:12 run; three charts held to the Swiss Ephemeris in `test/chart-fixtures.json`, smoke in the sandbox against the byte-identical `app/dist/`, see that run's report) |
| SS7 | **Shard and first run.** The reading as long-form text; the seven-screen first run from `UX-FLOW.md` §2 as a stepped route; account prompt after the reveal with the reason stated. Reuse `reading.js`, `findings.js`, `format.js` unchanged. | SS4 | smoke through the full first run; writing lint clean; vocabulary law: no coined noun before its meaning | done (6 Nov, Justin via Claude: option B. The gate's lint line is read as the app's own strings, which are clean; the 26 corpus lines move to SS7b, a content pass after launch) |
| SS8 | **Accounts UI.** Sign in, sign up (age check first), forgot/reset, verify-email landing, account page with charts, export, delete, sign out. When the export and delete buttons exist, `privacy/` §your rights and `terms/` §ending it say "on the account page" instead of "write to privacy@starshard.net" (SS3 wrote them as built). | SS1, SS4 | smoke: a scripted stranger completes land → chart → shard → signup → signout → reset → signin → export → delete against a local API | done (1 Nov, 18:12 run; the stranger's path smoked at both widths against starshard-api on its SQLite shim, build on the Mac and smoke in the sandbox against the byte-identical `app/dist/`; privacy and terms now say "on the account page"; see that run's report) |
| SS9 | **The codex.** Index of 28 stations (canvas board "Codex") and one page per station (board "Codex · the Follower"), generated from `stations.js`, `research/mansions-table.json`, `research/corpus-mansions.md`, the card table and `walker-sheet.js`: the four skies, born under it, when the moon crosses, what the books say, the card and its signature, the walkers, sources. These replace the `mansions/` generator output as the public SEO pages, at `/station/:slug`, with OG images; sitemap includes root and all 28. Linked from the chart ring, the home, and the game's codex. | SS4 | smoke; sitemap validates; each page has title, description, OG; every line traces to a corpus row (a generator, not hand prose) | done (2 Nov, 21:12 run; a generator from the corpus with every field traced, the card and the walkers from the game, the pages prerendered with title, description and OG image, sitemap of 36 urls, smoke in the sandbox against the byte-identical `app/dist/`; see that run's report) |
| SS9b | **Play route.** `/play` serves the September Manzil file (V2) as its own page; its lobby's back link returns to the shell; it reads the same session cookie and the same `/api/tonight`. No shell chrome over the stage. | SS2, SS4 | smoke: signed-in user reaches a board from home and returns | superseded (6 Nov, SEPARATION.md): the game leaves Star Shard; Code removes /play in the new repo |
| SS10 | **`combos.js` split.** Per-cell files fetched on demand; measure first load. | SS7 | first load under 600 KB gzipped at phone; Lighthouse performance ≥ 90 on Tonight | open |
| SS11 | **Accessibility pass.** Real buttons, labels, focus states, 14 px minimum body on phone, contrast against the dark ground (gold and muted on near-black). | SS5–SS9 | Lighthouse accessibility ≥ 90 on every route; zero unlabeled controls | open |
| SS12 | **Deploy, prepared, staging and production.** Two targets in `tools/deploy.sh`: `staging` (as today) and a new `production` where the starshard.net root serves `app/dist/`, `/play` serves the game copy, and `api.starshard.net` the API. Print both commands for Justin. Production DNS does not exist yet: as of 6 Nov starshard.net resolves to a GoDaddy "Launching Soon" site-builder page, so say plainly that the production command does nothing until the domain is pointed at the house (Cloudflare tunnel per `docs/CLOUDFLARE-RUNBOOK.md`, a second public hostname for the root and one for `api.`). `tools/deploy.sh` ships `dist/` to the root and the September Manzil to `/play/`; health check; restart race fixed; `ALLOWED_ORIGINS` gains the root domain; `TRUST_EDGE_HEADERS=1` once the tunnel is on. Staging first. | SS4–SS11 | the agent cannot reach the NAS or starshard.net (egress allowlist), so it prepares and Justin runs it: `tools/deploy.sh` updated and dry-run clean (`bash -n`, file list checked against `dist/`); the exact command for Justin printed in the report; status set to `decision (Justin): ready to deploy`. After Justin deploys, the next run smoke-tests staging through the desktop browser pane if that tool is present, otherwise Justin clicks through the stranger's path | superseded (6 Nov): Claude Code deploys from the new repo, HANDOFF-CODE-STARSHARD-LAUNCH-06NOV.md §7 and §8 |
| SS13 | **Launch gate.** The stranger's path on production, by Justin; every shell page reviewed beside the live lobby and board; metadata check; Lighthouse both ≥ 90. | SS12 | Justin marks done | moved to Claude Code: the handoff's §9 |
| SS14 | **Retire the old surfaces.** `star-shard/`, the Star Shard `.dc.html` files and `ios-frame.jsx` moved to `_to_delete/`; docs updated. | SS13 | nothing references the moved files | moved to Claude Code: archive the monorepo after launch |
| SS15 | **Email reminders (post-launch).** Opt-in daily email via Resend, off for minors, one line about tonight's sky and a link. | SS13 | route tests; an opt-in round-trips | open |
| SS16 | **Checkout (post-launch).** Stripe one-time unlock, entitlements table, `owned` from server, restore flow. | SS13 | test-mode purchase round-trips; decisions queue: price, what is gated | open |
| SS7b | **Corpus prose pass (post-launch).** Rewrite the 26 lines listed in REPORT-2026-11-01-1212.md §5 in `research/corpus-*.md` (15 "you will", 11 "which means" / "that's why"; the five name glosses become "āśleṣā, the embrace"), regenerate `reading-copy.js` with `tools/build-reading-copy.mjs`, and give the lint's "sounding" rule its verb exception. | SS13 | `tools/writing-lint.mjs` clean over the whole corpus at render; root `npm test` green | open |

Infrastructure Justin does: Cloudflare tunnel in front of NAS and API (`docs/CLOUDFLARE-RUNBOOK.md`), DNS for root and `api.`, Stripe account when SS16 is reached.

---

## 2. MZ: the game inside the app (priority two, starts when SS12 is done)

The September build is the game at `/play` from launch day. These packets make it fit the app and fix what the audit found.

| id | packet | depends | gate | status |
|---|---|---|---|---|
| MZ1 | **Starter twelve.** `_castFive` fill to twelve, every pack-cap site, the `fiveCards` UI, progress migration. Work on a copy at `v1/manzil.html` until MZ7. | SS12 | engine vectors 140/140 and 36/36; exploit scan on the live rules: no opening wins all 28 nights | paused (6 Nov): moves to the Manzil repo, SEPARATION.md §6 |
| MZ2 | **Error sink.** `window.onerror` and `unhandledrejection` → `POST /api/manzil/errors`; telemetry export to the same sink. | SS12 | route test; a thrown error on staging appears in the table | paused (6 Nov): moves to the Manzil repo, SEPARATION.md §6 |
| MZ3 | **Pre-signup email capture.** One field after the first night, stored with export and cascade. | SS1 | route test; export includes it; delete removes it | done (2 Nov, 06:20 run; the field under the shard document in the shell, where a stranger's first night ends; `POST`/`DELETE /api/email`, `email_capture` with a migration, linked at signup, in the export, removed with the account; 7 route tests on the SQLite shim, API 28/28, root 230/230; smoke in the sandbox against the byte-identical `app/dist/`; the game-side field is a game edit, queued; see that run's report) |
| MZ4 | **Account delete/export in the pause menu**; link privacy and terms. | SS3 | smoke | done here; superseded by SEPARATION.md §6.2 (export and delete return to the game's own pause menu) |
| MZ5 | **Delete the `__mzRetry/__mzHeal` hack**; fix the `_figs` duplicate; sweep the 22 bound geometry attributes; promote check-manzil warnings to failures. | none | `npm run manzil` zero warnings | done (3 Nov, 06:12 run, finishing the 21:12 run that died mid-packet; all four in the shipped copy `app/dist/play/index.html` by build-time rewrites and a sweep in `app/build.mjs`, the live file untouched: the hack gone and support.js loaded plainly, the 28 attributes on 22 tags written in the runtime's `sc-camel-` form so the first parse is silent, the fisher's `_figs` key under its own name with a `figKey` on his roster entry, `check-manzil` with no warning class left and the shipped copy held strict; `npm run manzil` 0 warnings on both files, root 230/230, API 28/28, smoke at both widths in the sandbox with zero pre-hydration SVG errors (56 before); see that run's report) |
| MZ6 | **PvP report/block UI** against the existing server handler; graceful restart notice. | none | smoke; a report reaches `manzil_reports` | done (3 Nov, 12:12 run; "report the far hand" in the pause overlay with a yes-or-no and the confirming line, a pause button on a live board for phones, the socket kept through the win or loss screen; the server answers `reported` / `report_failed`, keeps a closed table reportable for ten minutes, and on SIGTERM tells every socket `server_restart` and closes it, the game returning the player to the open tables with the notice; 6 lobby tests on the SQLite shim (socket.io-client a devDependency, `npm install` once), API 34/34, root 230/230; `mz6 live` smoke at both widths in the sandbox against the byte-identical `app/dist/`, the row in `manzil_reports`; see that run's report) |
| MZ7 | **Doors both ways.** The game's codex entries link to `/station/:slug`; night-end offers tonight's reading; home and tonight link to `/play`. Replace the broken `Star Shard v4.dc.html` href. | SS9 | smoke both directions | done here; superseded by SEPARATION.md (plain links only between products) |
| MZ8 | **Phone pass.** Safe-area, type scale, device check by Justin. | MZ1 | Justin marks done | paused (6 Nov): moves to the Manzil repo, SEPARATION.md §6 |
| MZ9 | **Fuzz and QA on a real browser** (`test/fuzz-manzil.mjs`, `test/qa-loop.mjs`) against staging. | MZ1–MZ7 | both green | paused (6 Nov): moves to the Manzil repo, SEPARATION.md §6 |
| MZ10 | **The game is live at `/play` with the fixes above.** | MZ9 | Justin marks done; videos begin | paused (6 Nov): moves to the Manzil repo, SEPARATION.md §6 |

---

## 3. V2: the TCG sim track (runs when no SS or MZ packet is unblocked)

Unchanged from this morning's draft. Prerequisites P0.1 to P0.5 (verify the ground, scaffold
`research/v2-sim/`, the gate runner, the three agent vectors, the lints), then S1 Moving Sky
(gate includes breaking the leader's forced win from `manzil-why-storm3.md`), S2 Occultation,
S3 Veil and Retrograde, S4 Hours and Dignity, S5 the five card types on a 40-Figure pool, S6
the Ascendant, S7 Tonight's Sky format, S8 her tempo-aware agent; then C1 vectors, C2 the JS
reference engine; then B1 to B5 the playable build with the six legibility items from the
first commit; then W1 Figure text. Full packet text is in `docs/BACKLOG-V2.md`. P0.1 to P0.5 `done` (3 Nov, 18:12 run: the ground verified, the scaffold, the gate runner, the agent vectors, the lints); S1 `decision (Justin)` (4 Nov, 00:12 run: the Moving Sky built in `research/v2-sim/engine_v2.py`, 53/53 vectors, the opening book dead and the leader no longer favoured, but the bands fail against her v1 reader and it is left in the file unshipped; cut, re-scope, or S8 first, see that run's report); S2, S4 and S8 depend on S1 and wait on that answer; W2 `done for week 1` (4 Nov, 18:12 run: five sky-video scripts in `content/scripts/`, gate 5/5, see that run's report); W3 `done` (5 Nov, 06:12 run: the Steam page copy, field guide, asset list and eleven rendered images in `content/steam/`, gate `tools/steam-copy-check.mjs` clean, the page itself and its $100 Justin's, see that run's report); the rest `open`.

---

## 4. FS: Forge sim maintenance (one packet a week at most)

| id | packet | gate | status |
|---|---|---|---|
| FS1 | **Rename.** Replace "Forge sim" in UI, docs and config with the chosen name; about page with "a test bench for deck changes, not affiliated with Forge or Wizards of the Coast"; Fan Content disclaimer kept. | tests 45/45; grep for the old name finds only the engine dependency | done (5 Nov, 12:12 run; the name in the page, the manifest, the service worker, the push and mail text, the coach's brief, the config default, the server's User-Agent and the notes under `mtg sim/`; `/about` (`public/about.html`) with the affiliation line and the attributions, linked from the page footer with the Fan Content notice kept verbatim there, on the page and in every email; `test/name.test.js` holds all of it; 48 pass, 2 skipped (45 before); the grep finds `forge sim`, Forge's own command, the 12 Oct research doc's title and the shipped snapshot in `design/incoming/shipped/`; see that run's report) |
| FS2 | **Secrets.** `tools/nightly-engine.sh` stops pulling `ANTHROPIC_API_KEY` over ssh; key rotated by Justin; no secrets in scripts. | grep clean; nightly still runs | paused (6 Nov): moves to the Deck Bench repo, SEPARATION.md §7 |
| FS3 | **Field source.** Replace Goldfish/Top8 HTML scraping with MTGODecklistCache for the Standard field. | tests; a field loads with the scrapers disabled | paused (6 Nov): moves to the Deck Bench repo, SEPARATION.md §7 |
| FS4 | **Fidelity label.** Every whole-field number carries the calibration caveat the 23 Oct handoff demands. | smoke of the results page | paused (6 Nov): moves to the Deck Bench repo, SEPARATION.md §7 |

Nothing else for Forge sim until MZ10 is done.

---

## 5. Decisions queue (Justin only)

- ~~Legal entity, contact, governing law~~ answered 29 Oct: Bjur Media LLC, privacy@starshard.net, New York. Open: create that mailbox before launch.
- ~~The Forge sim name~~ answered 29 Oct: Deck Bench.
- `birthTz` as the signup field for the birthplace zone (SS1 report): taken as accepted unless Justin says otherwise.
- Any new traveler-facing noun the SS or V2 packets propose.
- Legal pages (SS3, 31 Oct): the privacy page names no transfer safeguard for UK/EEA visitors (the old page claimed Standard Contractual Clauses nobody has signed); a lawyer's call before launch. When the Cloudflare tunnel is on, Cloudflare joins the "who else sees anything" table (it sees every request's IP). `GET/POST /api/guestbook` still answers on the server with no live page behind it; retire the route or keep the guestbook paragraph out of the policy, as now.
- Price and what is gated, when SS16 is reached.
- The game's shard-app screen (SS9b, 2 Nov): the build copy shows the door home and drops "bought once, yours forever. no subscription." while nothing is for sale; the two remaining lines ("a nightly reading cast from your chart, not your sign", "four skies on every degree of the sky, their disagreements shown") promise the daily, which is post-launch. Keep, trim to the second line, or restore the price line when SS16 lands: one rewrite in `app/build.mjs`.
- Where the game's door to the shell lives (SS9b; MZ7, 3 Nov): the player menu's existing "star shard" item opens the game's own record panel, and the shell is still three taps from it (the moon mark, "the shard app", "your star shard"). MZ7 added the codex door and the night-end door and left this item as it is. Option A: leave it (the record panel is the game's own shard screen). Option B: point `pmGoShard` at `/` so the item is the one-tap door home, one rewrite in `app/build.mjs`, and the record panel stays reachable from the moon mark. Option C: a second item beside it. Each is one rewrite; none was built.
- The email field in the game (MZ3, 2 Nov): the game's first night sits behind its cast, which is the signup, so the shell's shard document carries the field for now. Option A: leave it to the shell (the game is reached from the shell, which has already asked). Option B: when MZ1's copy exists, let the practice walk (`/play/#tutorial`) run before the cast and put the one field after it, posting `source: "play"` to the same route. Option C: make the cast's password optional, so the cast is the field. A, B and C all use the route as built.
- The privacy page and the email left (MZ3): `privacy/` describes what an account needs and says nothing about an address left without one. A line for §what we keep, pre-drafted: "If you leave an email before making an account, we keep the address, when you left it and a code for the device that left it, until you take it back from that device or delete the account it joins." Legal pages are Justin's; nothing was written there.
- `api.js` (MZ3): the two calls in `app/src/leave-email.jsx` belong in `api.js` with the others (`leaveEmail`, `takeEmailBack`); `api.js` is outside the night shift's write list. One move.
- Delete and export inside the game itself (MZ4, 2 Nov): the game's doors lead to the shell's account page, where the password-confirmed delete and the export already live. A delete that runs inside the pause overlay (its own password field, the wipe, the arrive screen) is a game edit with new bindings and belongs on MZ1's copy; it is not needed for the audit's blocker now that the shell is one app with the game. Option A: leave it as built. Option B: queue the in-game form for MZ1's copy.
- The pause overlay is Escape only (MZ4): a phone has no Escape key, so in a match a phone sees the player-chip menu and not the overlay; the account item sits in that menu when no match is running. If a phone should reach privacy, terms and the account mid-match, the player-chip menu needs them in a match too (it keeps the board; a plain link does not), a game edit for MZ8's phone pass.
- The cast's old line "computed and kept on this device" (MZ4): dropped from the build copy because signup sends the birth record to the server (SS1) and CLAUDE.md forbids copy that implies it stays in the browser. The live file still carries it; MZ1's copy is where it is rewritten for good.
- The source file and MZ5 (3 Nov): every MZ5 fix lives in the build's rewrites, so the September source still carries the hack, the 22 bound attributes and the two "brann" keys; `npm run manzil` reports them as source residue, not failures. Option A: leave it, the shipped copy is what players load and the check holds it to zero. Option B: apply the same four edits to the source once (the rewrites then throw "found 0" and come out of `app/build.mjs`), a live-file edit that is Justin's. Option C: do it on MZ1's copy.
- The archetype brann in a match (MZ5): on a night whose house has no roster of its own (`_rosterFor` falls back to the house-0 archetypes; house 22 today) brann now draws his own figure instead of the fisher's faint one. If the faint figure was wanted there, the one `figKey` on the fisher's row is the only thing to move.
- The report's reach (MZ6, 3 Nov): a report blocks the pair for good and there is no unblock anywhere (the server has no handler for one; the account page's export lists the blocks). Option A: leave it, a report is meant to stick. Option B: an unblock on the account page, one route and one list. Also: no reason is taken with a report (the table has no column); if one is wanted, it is a column, a field in the overlay and a line in `privacy/` §what we keep.
- The pause button on a live board (MZ6): a phone could not open the overlay in a live match (Escape only), so the shipped copy draws a 44 px pause button top right under the round pips, on live boards only. The road, the practice walk and pass-and-play still have no button; giving them the same one is the same rewrite with the condition widened, and belongs with MZ8's phone pass unless you want it now.
- The rejoin gap (MZ6, noticed, not touched): after a dropped connection the socket.io client reconnects and the server answers `rejoin_ok` with the board, but the game never listens for `rejoin_ok`, so a hand that drops mid-match sees "the connection to the sky broke." and a board that does not move until the far hand's sixty-second grace runs out. One handler (`_netBoardStart` on the snapshot) would make reconnects work; it is a build-time rewrite and fits MZ9's fuzz against staging.
- Whether a v2 mechanic that fails the bands is cut or re-scoped.
