# BACKLOG-V2.md — the Manzil v2 (TCG) packets, in full

**26 October 2026.** Fork 2 answered: Manzil goes straight to the TCG rebuild (`MANZIL-TCG.md`).
This file is the work queue a nightly agent runs from. Each packet is one paragraph of intent,
the files it may touch, and the gate that proves it done. The agent takes the top unblocked
packet, does the work in the folders named here, runs every gate, and writes a morning report.
It never touches the live September build and never commits; Justin reviews the report and
commits what passes.

Standing laws for every packet: `CLAUDE.md`; `WRITING.md` (no em dashes in anything a
traveler reads); the vocabulary law from `COSMOLOGY.md` (one new noun per surface, and only
for a thing astrology has no word for); the ethics floor from `research/game-ethics.md`
(no loot boxes, currency, stamina, streaks or paid randomness; the shards clause is lifted);
no number is reported until the engine that produced it passes its vectors.

---

## 0. How the loop works

**Where the work lives.** All v2 work goes under two new folders so nothing can touch the
live game: `v2/` for the engine and the playable build, `research/v2-sim/` for the simulator,
vectors, results and reports. The agent writes files there and nowhere else, except
`docs/nightly/` for reports and this file's status column.

**The nightly run.** A cloud scheduled task fires at 01:00 New York, linked to the Mac.
It reads this file, picks the first packet whose status is `open` and whose dependencies are
`done`, works for at most the window, runs the packet's gate, sets the status (`done`,
`blocked`, or `open` with a note), and writes `docs/nightly/REPORT-YYYY-MM-DD.md`.

**The morning report** has five parts, in this order, each a few lines: what passed (with the
gate output pasted), what failed and the exact reason, numbers produced (with the vector run
that licenses them), files written, and a decisions queue for Justin with options pre-tested.

**What the agent never does.** Commit or push. Edit anything outside the folders above.
Introduce a noun a traveler reads. Spend money. Merge. Guess at taste: it measures and asks.

**Status values.** `open` · `in progress` · `done` · `blocked (reason)` · `decision (Justin)`.

---

## 1. Prerequisites (night one)

| id | packet | files | gate | status |
|---|---|---|---|---|
| P0.1 | **Verify the ground.** Extract `research/manzil-loop/sim-pack-22aug.tgz` into `research/v2-sim/base/`, run `v6vectors.py`. Record node and python versions on the Mac. | `research/v2-sim/base/` | `33/33 pass` printed; versions in the report | done (3 Nov, 18:12 run; `manzil_v6.py: 33/33 pass` from `research/v2-sim/base/`; node v22.23.4, python 3.10.12 in the Mac's Cowork VM; see that run's report) |
| P0.2 | **Scaffold.** Create `v2/README.md` (what this folder is, how to run it), `research/v2-sim/README.md`, `docs/nightly/`. Copy `manzil_v6.py` to `research/v2-sim/engine_v1.py` untouched as the baseline. | as named | folders exist; baseline runs the vectors from its new home | done (3 Nov, 18:12 run; `v2/README.md`, `research/v2-sim/README.md`, `docs/nightly/` already there; `engine_v1.py` byte-identical to `base/manzil_v6.py` (cmp); `research/v2-sim/vectors_v1.py` runs the untouched suite against it from its new home, `engine_v1.py: 33/33 pass`; see that run's report) |
| P0.3 | **The gate runner.** `research/v2-sim/gates.py`: one command that runs vectors, bands (careful 55–65 / casual 35–45 / gap 20+), the forced-opening scan (no opening wins all 28 nights), the drama proxies, and the perfect-play leader solve on a sample of nights, and prints a pass/fail table. | `research/v2-sim/gates.py` | runs green against `engine_v1.py` for vectors; bands and scan report the known v1 numbers (73.2/26.8 pack five; six all-28 openings; leader wins 7/7) | done (3 Nov, 18:12 run; `gates.py` runs in parts that fit the shell's 180 s window and assembles the table; against `engine_v1.py`: vectors 33/33, pack of 5 careful 73.2 / casual 26.8 and pack of 12 71.2 / 47.1 to the decimal, the six all-28 openings by name, the leader 7/7 for each side with the October node counts; drama proxies recorded as the baseline in `results/baseline_v1.json`; see that run's report) |
| P0.4 | **The three missing agent vectors.** Add vectors for youMove, skyMove and playBoard to the suite so the engine gate covers the agents. | `research/v2-sim/vectors_agents.py` | 36/36 against the v6 JS reference | done (3 Nov, 18:12 run; `agents_ref.cjs` takes the three answers from `base/manzil-engine-v6.js` into `vectors_agents.json`, each one string over 28 nights at both depths, positions scripted with resolve; `vectors_agents.py`: `engine_v1.py: 36/36 pass`; a tiebreak flipped from > to >= on a scratch copy fails all three and none of the 33; `gates.py` now runs the 36; see that run's report) |
| P0.5 | **Lints.** `tools/writing-lint.mjs` (em dashes, banned phrases from WRITING.md) and `tools/noun-ledger.mjs` (every traveler-facing noun in `v2/` checked against the lexicon in COSMOLOGY.md). | `tools/` | both run clean on the September build's copy as a baseline, or list exactly what they flag | done (3 Nov, 18:12 run; `tools/writing-lint.mjs` stood from SS3; `tools/noun-ledger.mjs` new: retired nouns, the unspent Moonroad, capitalised coinage not in COSMOLOGY section 2, and with `--words` lower-case coinage, plus a ledger of the coined terms met by tier; on the shipped September copy the writing lint lists 19 (16 mansion, 2 lanterns, 1 "you will") and the ledger 19 (the same 16 mansion and 2 lanterns, plus "Code's ladder" in a provisional note); `v2/` clean on both; see that run's report) |

---

## 2. The simulator track (one mechanic at a time, each against the bands)

Every packet here extends `research/v2-sim/engine_v2.py` from the previous one, keeps the
v1 tests it does not deliberately break, and adds vectors for the new rule. A mechanic that
fails the bands is reported with its numbers and left in the file behind a flag; it is not
deleted and not shipped.

| id | packet | depends | gate | status |
|---|---|---|---|---|
| S1 | **The Moving Sky.** Nine visible mansions. At the end of each round the leftmost sets and is banked by its holder; the next mansion in the real sequence rises on the right, with tonight's planet already standing on it if one is there. Six rounds a night to start. Cards score at set, not at placement. | P0.3 | bands; exploit scan; **leader-advantage solve no longer 100% for the leader** (today's finding is the baseline to beat); drama proxies at or above v1; a written one-paragraph read of what it feels like | decision (Justin): built and gated (4 Nov, 00:12 run; `research/v2-sim/engine_v2.py` behind `MOVING_SKY`, 53/53 vectors: the 33, seventeen S1 rules, three snapshots). The road does what it was built for: no opening wins all 28 nights (best 26, v1 had six), and the leader is no longer favoured (the follower's last word: the leader wins 36 to 39 percent of careful boards against 66 and 50 in v1, and loses under perfect play on 12 of 14 three-set and 12 of 14 four-set nights; the six-set solve does not fit the shell, two nights unsolved at 1.5M nodes). The bands fail against her v1 reader: pack of five careful 67.9 / casual 55.4 / gap 12.5, pack of twelve 77.0 / 55.8 / 21.2, and the comeback proxy falls (32.1 and 34.6 against 55.4 and 43.8). Left in the file, not shipped. Cut, re-scope, or run S8 (her agent) first and re-measure; the watch-length table and two re-scopes are pre-tested in that run's report §5 |
| S2 | **Occultation.** A card may be placed on an occupied mansion if its elevation is higher; the covered card is dormant and still owned; if the top card flips, the one beneath is uncovered and fights as freshly placed. Elevation table from `MANZIL-TCG.md` §2. | S1 | bands; scan; mean cards-acting-more-than-once per board > 0.5; no infinite cascade (guard never trips) | open |
| S3 | **Veil and Retrograde.** One face-down card on the road that reveals on adjacency or at set; two retrogrades a night that flip an opponent's faces before the fight resolves. Her agent gets both. | S2 | bands; scan; **the two-sided test from `manzil-randomness.md`: night-to-night variety ≥ 25 with no added luck** | open |
| S4 | **Hours and Dignity.** Round N gives N to spend; cards cost 0 to 5; a planet's cards cost one less on nights that planet is in dignity (table from the astronomy in `COSMOLOGY.md`). Prototype costs for the 28 Mansions. | S1 | bands; scan; the option-space curve widens (legal plays per round rise, not fall) | open |
| S5 | **The five card types on a 40-Figure prototype pool.** Mansions, Figures (numbers plus one trigger each from the eight), Talismans, Aspects, Omens. Figures drawn from `research/corpus-mansions.md` per mansion. Eight triggers implemented as event listeners. | S2, S4 | bands at three deck archetypes; scan; per-card worth measured with a `sigtest.py` port and every card within ±10 of the median | open |
| S6 | **The Ascendant.** A leader card read from the natal Moon's mansion, always available, returns when flipped; the planet-of-the-leader runs free, others cost one more. | S5 | bands across the 28 possible leaders with no leader above 70 or below 45 careful | open |
| S7 | **Tonight's Sky format.** The daily: six rounds, one night rule by the Moon's mansion (reuse the 28 night rules from `research/manzil-loop/nightrules.py` as a start). | S3, S4 | bands on all 28 nights; no night outside 45–75 careful | open |
| S8 | **Her agent for v2.** A reader that values tempo and can concede bait (today's `manzil-why-storm3.md`), with the depth dial kept for casual. | S1 | scan clean at depth 8; the v1 depth-flatness gone (careful moves ≥ 5 points across depth 0–24) | open |

---

## 3. Conformance for v2

| id | packet | depends | gate | status |
|---|---|---|---|---|
| C1 | **The v2 vector suite.** Every rule in S1–S8 gets vectors in the style of `manzil-engine-v6.js`, authored in Python first. | S1 onward, incremental | each S packet lands with its vectors; suite count in the report | open |
| C2 | **The JS reference engine.** `v2/engine.js`, ported from `engine_v2.py` method for method, with `runVectors()`. | S7, C1 | all v2 vectors pass in both languages; cell-exact on three measured configurations | open |

---

## 4. The playable build

| id | packet | depends | gate | status |
|---|---|---|---|---|
| B1 | **`v2/index.html`, Tonight's Sky only.** Reuse the September shell (sky, deal, count, sound) on `v2/engine.js`. Built legible from the first commit: her move narrated in a line; one arc per flip in a cascade naming its cause; every condition shows whether it is live; a live count at both ends; safe, silenced and veiled states rendered as objects; the board wears tonight's mansion; walkers named with status lines. | C2 | Playwright smoke green (`test/smoke-v2.mjs`); writing lint clean; noun ledger clean; a full night playable on staging behind `?v2=1` | open |
| B2 | **Keep or redeal before board one**, with the cost printed. | B1 | smoke; the choice logged in telemetry | open |
| B3 | **Email capture in the free flow** (the Phase 0 item, now in v2). | B1 | smoke; an address round-trips to the API test suite | open |
| B4 | **Night Editions, the record.** For every night played, write the dated, numbered edition record (sky, mansion, count); no art yet. | B1 | records written and readable; the count published per night | open |
| B5 | **Ascendant format** behind a second flag. | S6, B1 | smoke; a full match playable | open |

---

## 5. Content the agent can author

| id | packet | depends | gate | status |
|---|---|---|---|---|
| W1 | **Figure text for 28 mansions**, two Figures each from the four traditions, numbers and trigger from S5's measured pool. Drafted to the writing law; every new noun queued for Justin. | S5 | lints clean; worth within band; decisions queue lists every proposed noun | open |
| W2 | **Video scripts, five a week**, from `research/mansions-table.json` and `CONTENT.md`'s ten cold opens, filed under `content/scripts/`. | none | each script under 90 seconds read aloud; agreement flag cited | done for week 1 (4 Nov, 18:12 run; five scripts in `content/scripts/` for 8 to 14 November, four of them airing on the night the moon stands in their station, from cold opens 1, 5, 3, 9 and 2; `tools/script-length.mjs` is the gate: 5/5 under 90 s at 130 words a minute, 64 to 83 s, every flag cited from the table; writing lint clean; week 2 is the next W2 pass, cold opens 4, 8, 6, 7 and 10 queued in the README; see that run's report) |
| W3 | **Steam page copy and asset list.** | none | copy lint clean; asset list with sizes | done (5 Nov, 06:12 run; `content/steam/`: the strings a visitor reads in `copy.md` (short description 270 characters, the about text in the game's voice, every claim true of the shipped game, the rebuild's lines held off the page), the field guide in `page.md`, the asset list in `assets.md` with every size read from the Steamworks docs that day, and the eleven store, community and library images rendered from the lobby's street scene and the game's own mark by `tools/steam-capsules.mjs`, the card faces (placeholder linework by their own file's word) kept off every image; gate `tools/steam-copy-check.mjs`: writing lint clean over 4 files, noun ledger clean over the copy, 12 assets with sizes, 11 files at the size their name says; root 230/230; whether the page goes up before the commission, the hour, the case and the price are Justin's, pre-tested in the README; see that run's report) |

---

## 6. Decisions queue (Justin only)

Items the agent will raise and never settle:

- Any new noun a traveler reads (W1 will produce many).
- Whether a mechanic that fails the bands is cut or re-scoped (S packets).
- The night-rule set for Tonight's Sky if the 28 existing rules fail S7's gate.
- The odd-road question from `manzil-why-storm3.md` if the Moving Sky does not remove it.
- Art direction, Design's slate, anything with a price.

---

## 7. Not in this file

The videos themselves. Apple review. Kickstarter copy. The merge. Forge sim, which gets its
night shift and nothing else.
