# Work order: design and code pass (Code, 13 Oct 2026)

**From:** the research session · **To:** the Code session in `mtg sim/` · **Owner:** Justin
**Why:** `REVIEW-DESIGN-CODE-13OCT.md` (and the Claude Doc it came from). The design side is starting on Brewer v4 in this thread's canvas, built from the **shipped** `public/index.html` (not the 6 Oct v3 artboard): the shipped page carries 168 bindings the artboard never had (`ev*`, `cardRows`, `threatRows`, `levers`, `cmp*`, `look*`, `cx*`). Items 1–2 unblock that; 3–8 are the code review's list; 9–10 are housekeeping.

**Scope rule:** nothing in this order changes a number. `score.js`, `calib.js`, `forge.js`, `pilot.js` are read, not edited, except for the tests in item 7 and the land-count column in item 10.

---

## 1. Fixtures for the canvas (first, half a day)

**What.** A `design/fixtures.json` (git-ignored, never under `public/`: `serveStatic` runs before any auth check, server.js:794, so anything in `public/` is readable by anyone with the URL) so the page renders in the Design canvas with real data shapes and no server: `{ "/api/me": {...}, "/api/brews": {...}, "/api/brews/<id>": {...}, "/api/codex": {...}, "/api/codex/<key>": {...} }`, keyed by the exact GET paths `api()` requests. Content: your own Erode/Squall brews with at least one finished run (so `ev*`, `cardRows`, `threatRows`, `levers` are populated), one running run, one brew with two versions (so `cmp*` and `hasCompare` are true), and three codex entries (a card, an archetype, a term). Strip passwords, tokens, usernames other than yours, and the Anthropic usage lines.

**Where.** `tools/fixtures.js`: signs in locally (`SIM_URL`, a username and password from env, never written to the file), fetches those paths, redacts (passwords, tokens, other members' usernames, usage lines, and the coach threads' model text beyond the readout), writes `design/fixtures.json`, and research publishes it to the canvas as `project/fixtures.json`. Production never contains the file. The Brewer v4 artboard already has the hook: when its `fixtures` tweak is on, or when `/api/me` fails off-origin, `api()` answers GETs from `./fixtures.json` and treats POSTs as no-ops that resolve to the matching GET. Keep that hook when you wire v4 back in; it is behind the tweak and inert in production.

**Acceptance.** Open the canvas artboard with fixtures on: sign-in is skipped, the brew list shows, Coach / Results / Deck / Codex all render with numbers, no console errors except the known `{{ }}` image 404s.

## 2. `public/bindings.md` (an hour)

**What.** The canonical list of every hole and handler the page binds, grouped by screen, one line each: name, type (string / colour / handler / list of {fields}), and the state it reads. Generate it from the Component (`renderVals()` keys) rather than by hand, and regenerate it in `tools/` on demand. `NOTE-TO-DESIGN-06OCT.md` stays as history.

**Acceptance.** Every `{{ x }}` in `index.html` appears in `bindings.md`; nothing in `bindings.md` is unused.

## 3. One method disclosure (half a day)

**What.** Remove the method sentences from the page, matched by meaning not wording (the "How these numbers were made" block, the card-table note beginning "Read from Forge's game logs", the snapshot/scrape line on the Field section, and the hatching rule on Coach) and expose one object, `method`, with: Forge version, pilot version and tag, games per pairing, clock, calibration source and real-game count, the hatching threshold, the "not counted" rule. Design will place one "How these numbers are made" link in the Results header that opens it. Until v4 lands, bind it to the existing block's holes so nothing goes blank.

**Acceptance.** `method` in the run payload; the four sentences gone from markup; the page shows the same facts in one place.

## 4. Hide what is not wired (half a day)

**What.** Real flags, not placeholder strings: `coachLive` (true when an API key is set, the server's existing rule; the coach readout and chat are live) gates the composer; `invites` (false) hides the join screen; `hasGoals`, `hasConsidering`, `hasSources` (false, false, false) hide those Deck sections; `podCount > 0` gates the pod block. The markup stays behind `<sc-if>` so Design keeps it on the artboard.

**Acceptance.** No surface on the page says "not yet" in any wording; the five flags are in `bindings.md`.

## 5. `config.js` (an hour)

**What.** One module reads every `process.env.*` used by `server.js`, `forge.js`, `worker.js`, `pilot.js` (30 names today), names each default, validates the few that must be numbers, and prints the resolved config at boot with secrets masked. Every other file imports from it.

**Acceptance.** `grep process.env` finds only `config.js`; the NAS and the Mac worker print the same block at boot, minus host-specific values.

## 6. Split `server.js`; lift the Component out of the page (2 days)

**What.** `routes/auth.js`, `routes/brews.js`, `routes/sim.js` (sim, jobs, worker claim and report), `routes/codex.js`, `queue.js` (job queue, extra-games allocator, calibration round robins), `limits.js` (daily budgets and asks). `server.js` wires them. In the page, the `Component` class stays inline (the runtime and the canvas both run inline code); `app.js` is the source of truth and a copy step writes it into `index.html`, so Design regenerates markup without touching logic. Build the headless harness for the byte-identical check first (fixtures from item 1 plus a node run of `renderVals()`), or the acceptance cannot be checked.

**Acceptance.** No behaviour change: the same fixtures produce byte-identical `renderVals()` output before and after. `server.js` under 200 lines.

## 7. Durable writes and two tests (half a day)

**What.** Every `writeFileSync` on a `data/*.json` goes through `writeJson(path, obj)`: write to `path.tmp`, `fsync`, rename, keep `path.1`–`path.3`. Tests with `node:test`: `score.js` on a fixed game set with a hand-computed range; `calib.js` on a fixed Forge/real pairing set with a known k and betas.

**Acceptance.** `node --test` passes; kill -9 during a save leaves a valid file.

## 8. Worker claim carries the pilot identity (an hour)

**What.** The claim and report include Forge version, pilot version, bridge jar hash and `SIM_PILOT`; the server refuses a report whose identity differs from the job's and records the identity on the run (`run.engine`). The benchmark tag you already keep becomes this object.

**Acceptance.** A Mac worker on the wrong build cannot report into a NAS run.

## 9. Housekeeping (minutes)

Delete `mtg sim/env.txt` (uncommitted, allow-list names only; the real one is the NAS `.env`). Run the pending NAS rebuild so the functional check and the pilot commit are live. Move the self-play runner out of `pilot.js` into `tools/selfplay.js` if it is not already the same code.

## 10. Karsten, the two remaining pieces (an hour)

The land-count interpolation is done (4d96689; Boros Dragons at 24 lands asks for 15 red sources). Remaining: only untapped sources count toward a one-drop (read "enters tapped" from the card text); a spell/land double-faced card counts 0.4 of a land.

**Acceptance.** A list whose only red sources for a one-drop are tapped duals is flagged; a list with four MDFC lands counts them as 1.6 lands.

---

## Order of commits
1 → 2 → 4 → 3 → 9 → 5 → 7 → 8 → 10 → 6 (the split last, when nothing else is in flight).

**Hand-back rule.** Design's Brewer v4 was copied from the shipped page on 13 Oct before 3 and 4. When 3 and 4 land, tell the research session; it re-bases v4 on the new `index.html` (its own edits are kept as a patch: the run-target segmented control and the fixtures hook) before any further design work, so the merge back never drops Code's markup. Until then, design edits on v4 are limited to that patch.
