# Session summary, 20-22 August 2026 — read this to restart

A research session that started as "how do we make Manzil addictive and fulfilling" and ended
with the game's core loop rebuilt, a conformant simulator, and a rollout plan. Everything
below is either a decision, a measurement, or an open item. Nothing here is speculation
unless it says so.

---

## 1. What got decided about the game

All of these are **locked and most are already shipped** in `manzil/index.html` at a7209e5.

| decision | state |
|---|---|
| Re-baseline all 28 cards at their old L3 numbers; levelling never touches numbers again. L2 wakes the signature, L3/L4 carry the familiarity law | **shipped** |
| Deal five from a drafted pack at the start of each board, revealed in full | **shipped** |
| All 28 mansions carry a signature | **shipped** (Design's slate) |
| Starter pack ships with its signatures awake | shipped via chart five |
| Difficulty comes from how well she plays, never from what she is given. Ties-to-her and she-leads are **banned** as levers | partly shipped |
| Nine-rung ladder: eight walkers, then the sky | shipped |
| The never-skill-gate-the-road-shards clause of the ethics floor is **lifted** | decision only |
| The 4+ flip floor is retired as a target; drama is measured directly instead | decision only |
| The 28 night rules are **variety, not the fix** for the opening — rescope them small | decision only |
| The Moonstone/cube waits until the deal ships | decision only |

**Withdrawn on the evidence during this session** (four of them mine): widening her seeded
tiebreak; the 28 night rules as the fix for the solved opening; a deepened dominion for
signature-less cards; drafting your twelve for tonight's road.

## 2. Where the build actually stands, measured

Numbers from the conformant port, matching the reference engine to the decimal. Bands are
careful **55-65**, casual **35-45**, skill gap **20+**.

| the player carries | careful | casual | skill gap |
|---|---|---|---|
| pack of 5 (the live default) | 62.5 | 37.5 | 25.0 |
| **pack of 12** | **71.2** | **47.1** | **24.1** |
| pack of 28 | 38.8 | 26.8 | 12.0 |

**She is too soft at a pack of twelve, not too hard** — both agents sit above band. Careful
play is flat from five to twelve and then falls off a cliff by twenty-eight, so **the twelve
cap is load-bearing.**

**What the deal actually buys:** it halves the skill gap, 46.4 at five to 24.1 at twelve. It
purchases an unsolved opening and pays in skill expression. Still above the 20 target.

**Her reading-depth dial is flat for careful play** (71.2 → 71.0 across depth 8 to 24) and
moves casual (47.1 → 41.1). Whatever tunes her against a strong player, it is not this.

## 3. The Empty District friend-build — the live thing at /manzil

`ownAll` was flipped true → false to fix a routing bug. Correct fix, with a side effect:
**a visitor owns five mansions, so the pack is five, so `deal` never fires** (it returns the
pack unchanged at five or fewer). The friend-build has no randomness in it at all.

- **The climb works for its audience.** Casual runs 60-86% across the eight walker rungs and
  drops to 42.9% at the sky. A real arc.
- **It is a walkover for anyone careful:** 84-100% on every rung. **On mansion 21's own night
  it is 100% at every rung including the sky.**
- **The climax is solved.** Six openings win every board on every night at her table; seven
  against the road boss. The Storm at slot 3 and the Blaze at slot 7 are the cleanest.
- **No tuning fixes this.** With exactly five cards you hold all five every board. The only
  fix is a starting pack above five.

## 4. The conformance episode — read this before trusting any older number

Code rejected my first v6 report. **They were right.** My Python port was unfaithful and the
headline finding was sign-reversed. Four divergences, all running against the player: the
Gate's lead-steal and the Return-to-hand were unimplemented; the Glance never fired; and I had
carried the deployed `_skyMove`'s positional nudge into an agent whose reference has no
tiebreak at all.

**Fixed. `research/manzil_v6.py` now passes 33/33 vectors and matches the reference engine
cell-for-cell.** Run the suite with `python3 research/v6vectors.py`.

**One methodological finding worth carrying:** the reference agents are deterministic with a
strict `>` tiebreak, so **hand order is a live config variable worth 11 points**. Same five
cards in a different order moved careful play from 62.5 to 73.2. Both of Code's rows I had
accused of not reproducing did reproduce — under a different ordering. Retracted in
`manzil-v6-conformance.md` §3. The brief should either pin the ordering or randomise the
tiebreak.

## 5. Strategy — `ROLLOUT.md` is the plan

Supersedes `MARKET.md` §1, §2, §6 (they assumed an audience that no longer exists) and
`PLATFORM.md`'s cold-start plan. `PLATFORM.md`'s platform decision stands.

**The constraint is zero audience.** Kickstarter, a Steam launch and App Store revenue all
*consume* an audience. Only one thing generates one: a free game that spreads. So it goes
first and everything queues behind it.

**Flow: free game → astrology app → Steam and the deck.** The game is the funnel, the app is
the business, Steam and the deck are SKUs two and three and neither is load-bearing.

- **Phase 0, now, free.** Fix the solved opening (starter pack above five). Add a run
  structure — 28 mansions is already a run length, and both researchers called this the
  highest-leverage change available. Fix the `-2` script bug. Ship email capture.
- **Phase 1, $100.** itch.io browser build and a Steam Coming Soon page. **Kill criterion:**
  if the itch build cannot beat the itch median (1,582 views, 113 downloads), Steam will not
  rescue it.
- **Phase 2, months 2-4.** Capacitor wrapper, App Store. Free chart and game; $19-24 one-time
  for reading depth. Hard paywall, no trial.
- **Phase 3, months 4-6, ~$1,000.** Commission 4-6 finished cards **out of pocket first**,
  then Kickstarter **as a deck, not a video game** (80% vs 33% funding rate, same 28
  illustrations). Ask $6,500. Needs ~40 named day-one backers.
- **Phase 4, months 7-12.** Steam last, with real art and a run structure. **Next Fest goes
  here** — one per title ever; October 2026 registration closes 31 August and should be
  deliberately let pass.

Total cash out before revenue: **~$800-1,700.**

**`CONTENT.md`** is the channel, and it closed the plan's biggest hole. The bank already
exists in `research/mansions-table.json` — 28 mansions × 4 traditions, pre-sorted by whether
the skies agreed (14 STRONG, 10 PARTIAL, 4 DIVERGENT). Commitment is five short videos a week
for twelve weeks, measured in **email signups per thousand views**, not views.

## 6. Open, in rough priority order

1. **Starter pack size.** One line, blocks Phase 0 and the friend-build's solved climax.
2. **The run structure.** Biggest single lever on the game's commercial ceiling.
3. **The `-2` script references** (`ephemeris2.js`, `manzil-art2.js`). Third drop running. In
   a packaged desktop build this is a white window.
4. **Email capture in the free flow.** Now blocking the whole strategy, not a nicety.
5. **Signature rework.** Design owns the slate. My competing 28 measured 14 needing work,
   including two shipped ones — the Heart at **−8.8** and the Hideaway at **0.0**. Design has
   since rewritten both. Their slate is untested; `research/sig28.py` and `sigtest.py` will
   measure it in about forty minutes of compute.
6. **Walker rung reorder** — unverified. Measured on the broken port, needs a re-run. The
   eight hands appear mis-ordered by difficulty.
7. **Untangle her reading depth from her signatures** before authoring exact rung values.
8. **Three agent-level vectors.** The suite covers mechanics only; nothing constrains
   `youMove`/`skyMove`/`playBoard`, which is where all three of my worst divergences lived.

## 7. Files

**Strategy (repo root):** `ROLLOUT.md`, `CONTENT.md`, `PLATFORM.md`, `MARKET.md` (part void).

**Research (`research/`):** `manzil-randomness.md` (the big one — nine sections),
`manzil-signatures.md`, `manzil-v6-check.md` (**superseded, numbers void**),
`manzil-v6-conformance.md`, `manzil-district-check.md`, `steam-economics.md`,
`kickstarter-plan.md`, plus `manzil-loop/` for the literature reports and all raw JSON.

**Engines (`research/`):** `manzil_v6.py` (conformant, use this), `v6vectors.py` (the suite),
`sig28.py` + `sigtest.py` (signature measurement), and the older `draw_sim*.py` family from
the randomness work. Archived together in `manzil-loop/sim-pack-22aug.tgz`.

**Handoffs (`docs/handoffs/`):** `HANDOFF-DESIGN-22AUG.md` is the one Design built from.

## 8. Working notes for the next session

- The repo is at **`/Users/justinbjur/Desktop/starshard.net`**. `device_commit_files` needs
  that absolute path — the `$HOME/mnt/...` mount path is rejected.
- **Two different `research/` directories exist**: the repo root's, and one inside
  `Star Shard v3 Build Plan/`. The reference engine and sim brief live in the *Build Plan*
  one. This has caused a real error already.
- **Git: report only, do not commit.** Standing choice.
- **No em dashes in product copy.** Internal docs are fine.
- `device_bash` cannot delete — move files to `_to_delete/` instead.
- Sim convention: at least 448 boards per cell, two seeds, report deltas rather than
  absolutes, and **run the vectors before reporting any number**.
