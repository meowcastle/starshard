# Handoff to Code · Strategy-first rebuild (23 Oct 2026)

From the Research + Design thread. This is the one note to build from. It replaces the build order in SHIP-16OCT §0 and the screen list in STRATEGY-FIRST-REBUILD §3.

## 0 · What this is, in one paragraph
The sim becomes a place where a brewer develops **their deck's own strategy**, following the method of the W/B Final Fantasy thread:
1. Name what the deck is trying to do.
2. Find what stops it.
3. Take the best answers from all of Standard.
4. Test each change against the previous version on the same games.
5. Sideboard.
6. Carry a matchup plan to the table.

Meta decks are the opponents, never the template. This also puts the engine where it is trustworthy. Your 19–23 Oct numbers (mean error 11.6, rank correlation ≈ 0) say it can't rank the field. Same-seed paired comparisons are reliable, and they're exactly what refining needs.

## 1 · Sources, in order of authority
When two disagree, the higher one wins.

1. **The prototype**: `design/prototype-23oct/Main.dc.html` (desktop) and `Mobile.dc.html` (phone). It's also on the private canvas "Deck Bench · strategy-first prototype". Every screen, label, panel and sheet is there and clickable. The data in it is illustrative.
2. **`FUNCTION-INVENTORY-23OCT.md`.** Every live and planned function (~70), and where each one now lives. Nothing on the live site is dropped. **Use it as the checklist:** when you retire a live screen, every row from it must work in its new home.
3. **`DECK-BENCH-DISTILL-3.md`.** The vocabulary, copy budget and one-owner rules. DISTILL (16 Oct) and DISTILL-2 (20 Oct) still apply where 3 doesn't override them.
4. **`STRATEGY-FIRST-REBUILD-23OCT.md` §2 and §4.** The objects and the engine program **E0–E7**, each with its acceptance check. Read §4 in full. Its §3 screen list and §5 tab names are **superseded** by the prototype (see §2 below).
5. Background, if you need the why:
   - `REFINE-BY-STRATEGY-23OCT.md` and `design/incoming/WB-FF-THREAD.md`: the thread's method, and the golden-test deck (Squall voltron, final 60 + sideboard).
   - `JOURNEY-TEST-LOOP-20OCT.md`.
   - `NOTE-TO-CODE-20OCT-COLLECTION.md`: collection direction C, shop links.

## 2 · What the prototype changes from the rebuild doc
| Rebuild doc said | Build this instead |
|---|---|
| Tabs Strategy · Test · Book | **Deck · Test · Matchups · Collection**. The strategy is the first block on Deck. |
| Phone bar Strategy · Test · Book · Table | **Deck · Test · Table · Collection**. Matchups opens from Table (Full plan / All matchups) and from Test's field list (Plan). Back returns to where you came from. |
| "Book" | **Matchups** (Justin's call). In code and data too, if it's cheap. On screen, it's required. |
| Collection under the avatar | **Collection is a tab.** The avatar holds Account. |
| State line "strategy v3 · list v7 · tested vs Dimir +9 · in your sleeves" | **"Viewing v7 ▾ · your deck: v6"**, plus **Make v7 your deck** when they differ, a running pill with Cancel, and Undo. Results live on Test only. One version counter; the strategy has dated history, no number. |
| Obstacle actions Apply / Test | **Try** → the Save sheet ("Try +2 Swiftfoot Boots" · diff · note · **Save as v8 and test vs Dimir** · Save only · Cancel) |
| Strategy is drafted by the coach (no detail) | **E0 · Read the strategy**, plus the first-run "Here's what your deck is doing" screen (§4, P2) |

## 3 · Rules that hold everywhere
- **Vocabulary.** Use "your deck", "Make vN your deck", "Try", "strategy" (deck level), "plan" (one matchup), and "Matchups".
  - **Grep before merge:** zero visible hits for `sleeved|in your sleeves|Keep v|list v|strategy v|Apply|Book\b` in UI strings.
- **Two levels at most.** Level 1 is the tab; level 2 is one panel (desktop) or one bottom sheet (phone). A sheet never opens another sheet. The phone's ask bar hides while a sheet is open.
- **State, cost and risk at level 1.**
  - Running and stopped show on the status line.
  - Credits and time show on the Run sheet before Run.
  - Deletes ask once.
  - Make your deck has Undo for the session, then opens the paper checklist.
- **Mark the exception.** Owned cards carry no label. Missing ones show "need 1 · $6.80".
- **Honest.**
  - No "the sim plays it this way" until E4 passes its mirror gate.
  - Every number on Test and Matchups appears only after a run produced it; before that, show "not tested yet" + Test.
  - Every keyword claim about a card is checked against Oracle text (E5).
- **Affiliate links never on the owner's own purchases.** Signed in as the owner or an admin, every TCGplayer and Card Kingdom link and cart is built without the affiliate or partner parameter. Test: signed in as bluenocturne, no rendered href contains either one.
- **Privacy, as before.**
  - Opponent names never leave the Mac or reach the brew.
  - Real data and fixtures stay in git-ignored `design/`, never under `public/`.

## 4 · Build order (each phase ships on its own and has a check)
Endpoint names below are suggestions; match `server.js` conventions. Existing endpoints to extend: `/api/brews`, `/api/sim`, `/api/jobs`, `/api/field/craft` (paired swap tests), `/api/check`, `/api/plans/audit`, `/api/collection/paper` (+ `/undo`).

**P0 · Saved state and safety (small, first)**
- **What:** the status line exactly as in the prototype, Make vN your deck → paper checklist → Undo, and the affiliate owner rule.
- **Check:** after any coach action or Save, the status line names the new version, and nothing becomes "your deck" without the button.

**P1 · E1 paired targeted runs + the Test verdict card**
- **Engine:** a run against chosen opponents only, reusing the base run's seeds (`seedOf(jobId, i)`), with G1 and post-board separate. SPRT early stop. Results per 100 matches with a 95% range. Generalise the craft swap tests (~server.js 1218) into this.
- **Test tier 1:** "v7 beats v6 against Dimir · +9 per 100 (±6) · 200 games" · Make v7 your deck · Test v7 on the whole field.
- **Accept:** see REBUILD §4 E1 (identical lists within the noise 95% of the time; −4 Erode +4 lands clearly worse vs Mono-Green in ≤200 games).

**P2 · The strategy object, E0 (layers 1, 2, 4) and the Deck tab**
- **Strategy object** (per deck, history kept with dates): summary, engine, win condition, piloting rules, obstacles, weak to. Each list version records the strategy it was saved under.
- **E0, the first read on every new deck** (paste, upload, Archidekt):
  - **Layer 1:** a role table from `tags.js`, plus the curve.
  - **Layer 2:** the engine link graph (payoff ↔ enabler, tutor ↔ targets, build-around text, weighted by copies).
  - **Layer 4:** the coach drafts with a confidence level and asks at most two questions.
  - **The screen:** "Here's what your deck is doing" (title, roles, Strategy · draft, The engine, How it actually wins, Two questions, Save this strategy · Edit in my words · another reading).
  - **No coherent engine:** "This deck doesn't have one plan yet" with half-plan cards. Never invent a strategy.
- **Deck tab:**
  - **Strategy block:** Edit · History, plus the Goal line.
  - **The list by role:** only missing cards marked; Edit mode with Add a card → Save sheet.
  - **The rest:** flags line + Check expand, Considering, Sample hand panel, Export, Name and cover, What stops it.
- **Accept:** the E0 checks in REBUILD §4. The Squall 60 read cold names Squall, Aerith and Cloud and reads "voltron toolbox". Three meta lists read as their archetypes. A random W/B pile gets "no clear plan".

**P3 · E2 telemetry + E3 loss reasons + E0 layer 3**
- **Test tier 2:** "Is the strategy happening?" (Squall: first solo attack, survives first removal, geared by turn 5, attacks made alone) and "Why you lose vs X" (bars + example games).
- **E0 layer 3:** one background run of about 300 games against the top 5. It measures how games are won and runs pull-one-card tests on the same seeds. The draft says "checking how it wins…" and updates when the run lands. Until E4 passes, card text outweighs telemetry and the draft says so.
- **Accept:** REBUILD E2/E3 (hand check of 10 games; 80% on 30 labelled losses).

**P4 · E5 obstacle search + E6 field model → What stops it → Try**
- **What:** obstacle rows (obstacle · who brings it, with share · answers: owned first, then fit, then price · how they're delivered). **Try** on every row.
- **Accept:** REBUILD E5/E6 (the thread's six picks rank top 3 in their rows; the obstacle rows name the thread's decks; zero unverified keyword claims).

**P5 · E4 the strategy-aware pilot**
- **What:** attackAlone, holdProtection, tutorPolicy, equipPriority via `forge-pilot/policies.json` and the bridge.
- **Accept:** the mirror gate (≥55% vs the stock pilot with the same 60) and the champion attacking alone on 80%+ of its attacks. Then re-run the golden test before and after.

**P6 · E7 Matchups from tests + Table**
- **Matchups** per opponent:
  - **The plan:** how they win, what beats your plan, your plan, Cloud grabs, in/out, kill on sight, skip, and the tested line.
  - **Actions:** Edit (amber when ins ≠ outs) · Share · Print · Print all · Share all.
  - **Tests:** ins/outs are tested on G2–3 only.
- **Table (phone):** a life counter, I won/I lost game N, the opponent picker → the plan (ins/outs shown after game 1), Full plan / All matchups, and **End match → log** (games, mulligans, Paper/Arena, logged against your deck).
- **Accept:** REBUILD E7 (Squall's matchup plans within two cards of the thread's table). A logged match shows under Test › More › Your play.

**P7 · The shell, and retiring the old screens**
- **Desktop header:** deck picker (Your decks panel + New deck: paste / upload / Archidekt / from your collection / from a meta deck / start from a strategy, format pills, ⋯ for rename / duplicate / delete) · tabs · search (card panel) · Run ▾ (Run sheet: against, field + week, Bo3/Bo1, the Cards dial, games / time / credits) · avatar (Account: email, credits and usage, notifications, Add to Home Screen, sign out, delete account; admin items for admins).
- **Coach:** a column on desktop with mode pills per tab, Undo lines and questions left; an ask bar on the phone.
- **Test › More:** Cards · Levers · Your play · How it's measured. Every test (weekly reruns included).
- **Collection tab:** value at TCG and CK · Update from ManaBox (sheet + Undo) · Browse the binder · Where next (keep building / from what you own / from a meta deck / blank brew) · Missing worth-first with both shops · Buy the N worth it.
- **Then:** retire the old screens. Walk FUNCTION-INVENTORY row by row first.
- **Accept:** every inventory row works in its new home; the grep rule passes; no level-3 menus.

**Slow down:** stop the nightly dial fitting toward absolute real rates. Keep it only as a health check. The night shift's time goes to E1–E3 runs ("while you slept" tests: overnight paired runs of whatever the user tried that day).

## 5 · Still open (Justin hasn't decided; build the default, keep it one switch)
| Question | Default to build |
|---|---|
| Phone: Matchups inside Table, or a fifth tab? | Inside Table + linked from Test (four tabs) |
| Test result on the status line too? | No. Status line is state only |
| "Show owned" toggle on the list? | No toggle; only missing cards marked |
| Keep the whole-field number for brews? | Keep it in Test's field footer, labelled the sim's read, with "How it's measured" |
| Fix tests: sideboard and main split? | Main changes test G1 + G2–3; sideboard changes test G2–3 only |

## 6 · How to work
- **Hand-off and rebuilds.** Hand questions back through a NOTE file in `mtg sim/`. Don't wait on design for anything §1–§4 already answers. Justin runs the NAS rebuilds.
- **Tests and dependencies.** Keep existing tests green and update selectors that depended on removed strings. Ask before adding a dependency.
- **The PR or ship note** quotes DISTILL-3's scorecard, before and after, and each phase's acceptance result.
