# Ship order for Code (16 Oct 2026)

> **23 Oct: build from `HANDOFF-TO-CODE-23OCT-STRATEGY-FIRST.md`.** It replaces §0's build order. The prototype is in `design/prototype-23oct/`.


Justin says ship. Everything is in `mtg sim/`. Do it in this order; each step is independently shippable, so rebuild and test after each one rather than at the end. Research + Design (this thread) re-bases any patch whose anchor fails: send the anchor name.

## 0. NEW DIRECTION (23 Oct): strategy-first
Read `STRATEGY-FIRST-REBUILD-23OCT.md` first; it supersedes the tab layout in §3 and the order below where they conflict. Three tabs (Strategy · Test · Book), the engine program E1–E7 with the Squall golden test, and a stop on dial fitting toward absolute real rates. Board: `design/DESIGN-STRATEGY-FIRST-23OCT.html`. The method it comes from: `design/incoming/WB-FF-THREAD.md`.

## 0. Read first
- `HANDOFF-TO-CODE-15OCT.md`: the index of the eleven patches, their notes, and the server work for each.
- `design/VOICE-AND-LEXICON-15OCT.md`: how every new string reads, and the coach prompt's rules.
- `design/DESIGN-V5-JOURNEY-16OCT.md`: the shell we're going to.

## 1. The eleven patches (front end, one command each, in order)
```
cd "mtg sim"
for p in voice change15 polish motion table list craft paper brewfrom buylinks check paperonly askbar; do
  python3 design/incoming/patches/patch_v4_$p.py public/index.html || break
done
```
Each prints `patched` or `already applied`. A failing anchor stops the loop and names itself. Nothing here needs the server; the page degrades to today's behaviour wherever data is missing.

**Dry-run on the live `public/index.html` (16 Oct, after your commit 7a6e8a7):** voice, change15, polish, motion report `already applied` (you shipped them in 796ae08); table through check all apply cleanly; the result has every marker 7–24 and its script parses. Change 19's sign-up part skips itself because your `S.signupOpen` gate is already there.

## 2. Server work, in the order the journey needs it
1. **Collection** (NOTE-TO-CODE-16OCT-CRAFT.md, -BREWFROM.md, -CHECK.md §3): `GET /api/collection` (paper shelf from `POST /api/collection/paper`, accepting ManaBox CSV, Moxfield CSV, and `qty name (SET) num *F*` lines; Arena shelf from the Mac log), `rows[].type/rarity/price/buy` on check and versions.
2. **The brew check** (NOTE-TO-CODE-16OCT-CHECK.md §1): `ver.check` from the Codex's archetype norms. This is the first screen after paste and the core of the product; it needs no games.
3. **Optimize** (NOTE-TO-CODE-16OCT-CHECK.md §2): `POST /api/brews/:id/optimize`, the chain structure → owned swaps → run → matchup swap tests → write-up. Honour `settings.budget.mode` (NOTE-TO-CODE-16OCT-BREWFROM.md §A).
4. **Craft and the field** (NOTE-TO-CODE-16OCT-CRAFT.md §3–5): `brew.craft`, `/api/field/craft`, `POST /api/brews/:id/versions`.
5. **Brew from your collection** (NOTE-TO-CODE-16OCT-BREWFROM.md §C): `/api/collection/brews` and `/start`.
6. **Mail and code sign-in** (NOTE-TO-CODE-15OCT-CHANGE15.md, NOTE-TO-CODE-14OCT-EMAIL.md): Resend is verified; Justin has the key in `.env` and the webhook secret.
7. **Phone** (NOTE-TO-CODE-16OCT-PHONE.md): manifest, service worker, push, `games`/`mulls` on log-a-match.
8. **Small**: `GET /api/public {signup}`, `weekly.seen`, `rows[].buy`, `missing[]` on brew/field rows, `source` defaults to `'Paper'`.
9. **Coach prompt**: the five voice rules plus rule zero (paper), the Cards dial, the collection and prices in context, the Fan Content notice in the page footer and every email.

## 3. The v5 shell (DESIGN-V5-JOURNEY-16OCT.md, revised 16 Oct evening, "What Code builds")
After 1 and 2 work: header with the deck picker and three tabs **Deck · Collection · Sim**; the coach docked as a column on every tab (Ask bar on phones); Collection as its own tab, paper only; the Run sheet. The fold table says where every v4 piece goes. Design cuts the three tabs as templates once you confirm the shell.

## 3a. Saved state (NOTE-TO-CODE-16OCT-STATE.md, 16 Oct evening) — do this before anything else
Justin's review of the live page: Optimize silently made v4 and ran it instead of his v3; the NAS rebuild dropped the in-memory queue so the run shows "stopped at game 0" with no cause; the Optimize button sticks. Bugs first (persist the queue, benchmark yields to user runs, optimizing flag, stopped-run causes), then the Save sheet / explicit Current / Optimize sheet + stepper / Versions ledger.

## 3b. Distill (DECK-BENCH-DISTILL.md, 16 Oct)
A copy and structure cut measured against the page. Its §7 safety fixes (seven Arena strings that survived change 25, collection paste with no undo, password form still first, crash text on the player's screen) ship as change 26 **before** the v5 shell; the vocabulary rename (27) and the end-user cuts (28) follow on v4; the one-owner moves are v5 work. The before/after board is "ux-distill · current vs suggested" on the canvas, far left.

## 3c. Collection tab, direction C (NOTE-TO-CODE-20OCT-COLLECTION.md, 20 Oct)
Justin chose "Paths" with the binder behind it: value line with both shops, four ways to start from your cards, the missing table with TCGplayer and Card Kingdom on every row, the binder with the deck laid over it. After 3a.

## 4. Engine (unchanged, still the critical path for trust)
Excruciator combo profile → error dial at every priority + combat → knobs and optimiser → a 160-games-a-pairing baseline for Research to score against the ship bar.

## 5. Justin's test, once 1–2 are up
1. Paste the white binder (`1 Mind Twist (SPG) 166` format) on Account; expect "48 cards" and the Arena shelf labelled "Arena (practice)".
2. Paste a deck; expect the Check in under a second, with a shell, a curve, a mix, and findings that name owned cards.
3. Optimize; expect a new version, a run, and the coach's write-up in the thread.
4. Results: headline, stat row, one trust line, matchups worst-first, every missing card a TCGplayer link.
5. Guide: sideboard sheet, roles, keep/ship; "your play" below.
6. On the phone: Add to Home Screen, Table tab, log a match from the counter.

## Files (all in `mtg sim/`)
- `HANDOFF-TO-CODE-15OCT.md`, `SHIP-16OCT.md` (this), `DECK-BENCH-DISTILL.md`
- `design/incoming/patches/patch_v4_{voice,change15,polish,motion,table,list,craft,paper,brewfrom,buylinks,check}.py`
- `NOTE-TO-CODE-15OCT-{VOICE,CHANGE15,POLISH,MOTION}.md`, `NOTE-TO-CODE-16OCT-{PHONE,LIST,CRAFT,BREWFROM,BUYLINKS,CHECK}.md`
- `design/VOICE-AND-LEXICON-15OCT.md`, `design/DESIGN-MOBILE-FUNCTIONAL-15OCT.md`, `design/DESIGN-V5-JOURNEY-16OCT.md`
- Research behind it: `RESEARCH-FIELD-TEST-15OCT.md`, `RESEARCH-MARKETPLACE-16OCT.md`
- The canvas: https://claude.ai/artifact/Uz5CQfyQ7frqGdu1PKUTFK (boards "Deck Bench – Brewer v4" with changes 6–24 live, and "v5 · the journey")
