# DECK-BENCH-DISTILL (16 Oct 2026)

A copy and structure cut for the web app, measured against the source. Scope: the end-user journey Deck · Collection · Sim (plus Account, sign-in, Run, Table) on the live page (`public/index.html` ≡ canvas `project/Brewer-v4.dc.html` after change 25) and the v5 board (`project/Brewer-v5.dc.html`). Nothing here removes a capability; it removes the second, third and fourth way of saying it. Line numbers are from the canvas board on 16 Oct; **re-grep the quoted string before editing**, the live page numbers differ.

## 1 · Verdict

The app says every important thing three to five times, in two to four different words, and still lets two Arena strings through on a paper tool. The fix is a vocabulary table (eight words), a copy budget (if the label says it, there is no helper line), and one owner per piece of data; the v5 shell already does the structural half, so this brief is mostly what v5 must *not* carry over from v4.

### Scorecard (count → target)

| Measure | Now | Where | Target |
|---|---|---|---|
| Words for the deck | 3 · deck 53 · brew 16 · list 28 | "Optimize my brew" 1706, "Brew from your collection" 128/209, "+ brew from my collection" 194, "Paste a new list →" 593, "Edit the list" 596, "← Fix the list" 177 | 1 · **deck** ("list" only for the pasted text) |
| Words for a run | 4 · run 92 · sim 18 · games 26 · Forge 43 | "Check it in Forge" 171, "Forge plays both sides of every game" 1023, "Forge pilots both 75s" 1403, "Forge stopped early" 1462/1467, "Forge won't cast" 1713/1723/1729 | 1 · **run**; **Forge** = 0 on end-user surfaces |
| Words for a pairing | 3 · matchup 15 · opponent 12 · against 10 | "Your matchups" 431, "What beat you" 468, "oppOpen" states | 1 · **matchup** (opponent = the person at the table, Table tab only) |
| Words for the meta | 3 · field 37 · meta 7 · gauntlet 1 | | 1 · **field** |
| Words for the write-up | 2 · plan 32 · guide 5 | "Sideboard plans" 608, "Sideboard guide" 611, "Shared guide link" 1100, Guide tab | 1 · **plan** |
| Words for the noise band | 3 · "inside the noise" 1679 · "within the noise" 1590 · "under ±10 is noise" 1533 | | 1 · **inside the noise** |
| Run-state words | 6 · queued, running, finished, cancelled 1257, crashed 1257, restarted 1257, stopped early 1462 | | 4 · queued · running · done · stopped |
| Trust caveat, places per Results screen | 5 · fidTitle/fidNote, brief "(sim)", runNote 392, leversNote "Test the big ones yourself", lines 1403–1404 | | 1 · the **Trust** stat |
| "Safe to close the tab" | 3 · 182, 392, 1263 | | 1 · the queue toast |
| Win rate shown per screen | 4 · headline, brief sentence, sidebar pill, versions row | | 1 · headline (versions row keeps its own number: it's a different version) |
| Collection coverage shown per flow | 3 · facts line `ownLine`, collection block 622, brew-from 209 | | 1 · Collection stat row |
| Places the collection is pasted | 3 · Account 247, Deck empty state 620 (opens Account), Brew-from empty note 1165 | | 1 · Collection tab, Update button |
| Places the Cards dial / budget is set | 3 · Run panel 556–564, Settings `st.budget` 1600–1613, coach pills 1610 | | 1 · Run sheet (coach pills read it, don't set it) |
| Places the sideboard is edited | 2 · Deck list 596, Guide "Edit in place" 610 | | 1 · Deck |
| Explanatory sentences, heaviest dialog (Run) | 6 · 156, 176, 180×2, 182×2 | | 1 |
| Sign-in labels meaning "sign in" | 4 · "Already a member · sign in" 109, "Members sign in below" 110, "a name and a password" 110, "Email me a code" 114 | | 1 · **Sign in** |
| Arena strings on an end-user surface (rule zero) | 7 · 128, 415, 564×2, 1660, 1668, 1683, 1747 | | 0 |
| Destructive actions without confirmation | 1 · collection paste "It replaces the old one" 247 | delete deck 1029 and delete account 258 ask once; cancel run 1213 asks once | 0 |

Every count is re-run before merge (§10).

## 2 · Method
Strings were extracted from the board (1,133 visible strings, `scratchpad/strings.txt`, `line · M|L · string`; M = markup, L = script literal), counted by regex per noun, and every screen walked end-user first: sign-in → paste → Run → Results → Guide → Deck → Collection → Account → Table → Codex. Admin is only the Account footer (`FORGE_VERSION`, "in the sim's .env, then rebuild" 201) and the Codex "Members' notes" 317.

## 3 · Vocabulary law

| Concept | THE word | Retired in UI strings |
|---|---|---|
| the thing you're building | **deck** | brew (noun), list (except "paste a list" for the text), build (noun) |
| one simulation of it | **run** | sim (as a noun for a run), games (as a noun for a run), Forge, batch |
| the product | **the sim** | Forge, the engine, the server, the bridge, the Mac, worker, NAS |
| a deck pairing | **matchup** | opponent (except Table tab: the person), vs rows as a heading, "What beat you" |
| the decks you'll face | **field** | meta, gauntlet, bench (as a label) |
| the sideboard + keep/ship write-up | **plan** | guide, read, write-up, notes |
| the cards you have | **collection** | binder, shelf, paper (as a label: everything is paper), what you own (as a heading) |
| the state of a card you lack | **missing** | need, to craft, to finish (as a column) |
| a saved snapshot of a deck | **version** | revision, snapshot, new list |
| the LLM | **coach** | assistant, it, the sim (when it's the coach talking) |
| the uncertainty band | **inside the noise** | within the noise, within the margin, ±10 is noise, swing |
| the one trust stat | **Trust** | fidelity, method, how it's made, calibration (end-user) |
| run states | **queued · running · done · stopped** | finished, cancelled, crashed, restarted, stopped early |
| money | **$12** market | price, cost (as a column header), USD |

Brand exception: "Deck Bench" as the product name may appear exactly twice: the page title and the Fan Content footer. "Forge" alone, never.

**Grep rule (zero hits in UI strings before merge; code identifiers like `forgeVer`, `brewId`, `oppOpen` are fine):**
```
grep -nE ">[^<]*\b(brew|Forge(?! Sim)|meta|gauntlet|guide|binder|shelf|wildcard|Arena|opponent|within the noise|within the margin|crashed|cancelled|restarted|stopped early|fidelity)\b" public/index.html
grep -nE "'[^']*\b(brew(?!Id|s\b)|Forge(?! Sim)|Arena|wildcard|guide|opponent)\b[^']*'" public/index.html   # script literals; review hits by hand
```
The Table tab's life counter may say "opponent"; everything else may not.

## 4 · Copy budget
- **Page header** = the deck picker and the three tabs. No kicker, no subtitle, no count line.
- **Headline** = one number + one read ≤ 8 words. The second sentence under it is cut; the stat row carries the facts.
- **Stat row** = four numbers, labels above, one of them Trust. The method link lives inside Trust. Nothing else on the screen hedges.
- **Dialog / sheet (Run)** = title · fields · one primary button · at most one helper line, and only when it carries a format, a constraint, or a reason the user couldn't guess. "You can change this on every run" is none of these.
- **Empty state** = one sentence + one action. The collection one at 620 is three clauses; cut to "No collection yet · Paste your ManaBox export".
- **Status** = one pill. Never pill + sentence + toast. A run is queued · running · done · stopped; the detail (why it stopped) is one line under the pill, once.
- **Sign-in** = logo · "Sign in" · email field · "Send code" · nothing else. Sign-up closed = one line.
- **Buttons** = verb (+ object). No "→", "↗", "▾" as meaning; an external link gets the glyph only where it leaves the site (TCGplayer, Card Kingdom).
- **Helper lines that survive** (they carry a format or constraint): paste help "4 Card Name per line. Deck / Sideboard on their own lines." 137; "Rounds (blank for the event's usual)" 556; "Cards that stay, one per line" 560; the Fan Content notice.

## 5 · End-user cut list

| Screen | Cut (quoted) | Keep / change to |
|---|---|---|
| Sign-in 108–114 | "Name and password. Your decks stay private. No reset yet — save the password. 13+." · "Already a member · sign in" · ": a name and a password." · "Sign-up is closed while the sim is calibrated. Members sign in below." | Title "Sign in", email, button "Send code". Closed: one line "Sign-up is closed for now." Password form stays reachable behind one link "Use a password" until Code retires it |
| Paste 128–156 | "Plain text, an Archidekt or Moxfield export, or an Arena export. Moxfield: More → Export → Copy for MTGA." · "Deck in a box? Scan it with ManaBox or Delver Lens, export text, paste." | One helper: "4 Card Name per line, or paste a Moxfield/Archidekt export." Commander line 154 stays (constraint) |
| Paste result 171/1047 | "Check it in Forge" · "Every card found. Names are already in Forge's spelling." · ". Forge will skip " | "Check the deck" · "Every card found." · "The sim skips …" |
| Run sheet 176–182 | "Anything the coach should keep in mind? Optional." → placeholder only · "You can change this on every run." · "Safe to close the tab. Results fill in as games finish." (toast says it) | Title "Run v3", field picker "Who should it play?" as the label, Cards dial, "Queue the run" (rename **Run**). One helper max |
| Run panel 556–564 | "Arena practice" · "wildcards you'll spend to practice this list on Arena; blank for no limit" (rule zero; the dial is now owned / up to $ / anything) | Delete the field; the Cards dial from change 22 is the budget |
| Results 392 | "Results land as games finish. Early games swing — wait for the full run. Safe to close the tab." | Pill "running · 212 of 560". The toast at 182 already said the rest |
| Results trust ×5 | fidTitle/fidNote block · "(sim)" in the brief · runNote · "Test the big ones yourself" (levers) · "Forge pilots both 75s. Good for comparing your versions; don't call a matchup off it." 1403 · "Forge overrates some decks. Against N real matches its matchup calls don't yet beat a coin flip — compare your versions, trust your own reps on matchups." 1404 | One **Trust** stat: "Trust · fair on versions, weak on matchups" with the method sheet behind it, which holds the 1403/1404 content once |
| Results 415 | "Your games: none yet · log them from the Table tab · Arena games on the Mac count too" | "No logged games yet · Log one" (rule zero) |
| Results 433/450/457/468 | kicker "range · 50% marked" · "What would raise your top-8 odds most" · "How each card played" · "What beat you" | Section titles: "Matchups" · "Levers" · "Cards" · nothing (fold "What beat you" into Matchups, worst-first already says it) |
| Results 1257/1263/1462/1467 | "Forge crashed before any games finished." · "The sim restarted while it was queued." · "The run was cancelled" · " Safe to close the tab." · "Forge stopped early" ×2 | Pill **stopped** + one line: "Stopped at game 61 of 560." The reason goes to the admin log, not the player |
| Results 1023 | "Forge plays both sides of every game." | "The sim plays both sides." (method sheet only) |
| Results 1533/1590/1679 | "cheap cards read low, top end high · under ±10 is noise" · "is within the noise." | "inside the noise" everywhere; the bias caveat moves to the method sheet |
| Guide 608–614 | "Sideboard plans" · "Coach's plan from the last run. Edit in place; amber means ins ≠ outs." · "Sideboard guide" · "Coach's read from the run. Role = who you are post-board. Re-ask after a change." · "the coach's suggestions land here first" | One title **Plan**; one legend line "amber: ins ≠ outs"; edit happens on Deck (§6). In v5 this is the right column of Sim |
| Deck 583–596 | "each run freezes a version" · "you see the diff before it saves · old versions rerun on any week" · "Paste a new list →" · "Compare two versions →" · "editing · − + Swap on any card" · "← Fix the list" | "Versions" (title) · buttons "New version" · "Compare" · "Edit". The diff is shown, not announced |
| Deck 171 | "← Back to the list" | "Back" (one word, the deck is the only place to go) |
| Deck empty state 620 | "Paste your ManaBox export and the sim builds from what you own, prices what you don't, and says which buys are worth it." | "No collection yet" · **Paste your ManaBox export** (opens Collection) |
| Collection 622–631 | "Your collection" · "Buy the missing ↗" · "You own every card. Nothing to craft." · "What each card is worth" · "The field, by what you can build" | v5 Collection tab: stat row, table "Missing", buttons "Buy the 4 worth it · $70", "Build with what I own", section "What you could build". "You own every card." only |
| Collection 1659–1683 (dead Arena branch) | "Arena (practice)" · "to practice this list on Arena · wildcards: " · " · you have the wildcards" · " · by wildcards you'd need" | Delete the branch (change 25 hid it; the strings are still shipped and `isArena` still forks the row builder) |
| Deck 1747 | "learnable on Arena too" | Delete |
| Brew-from 194/209/1165 | "+ brew from my collection" · "Brew from your collection" · "reading your collection against the field…" · "Nothing yet. The server reads the collection against the field once a week; check back after the next field refresh." · "Paste your paper collection on the Account screen first." | Lives in Collection as "What you could build"; empty: "Nothing yet · refreshes with the field on Monday"; no collection: the Collection tab's own empty state. "server" is an infra word |
| Check 1696–1729 | "Optimize my brew" · "Forge plays it / Forge casts it only sometimes / Forge won't cast it" · "every card in Forge" · "; the run would play it as a dead card. You can save anyway." | **Optimize** · "plays · sometimes · won't cast" (pill legend, once) · "Every card plays." · "Dead card in the sim. Save anyway?" |
| Account 229–258 | "reading the account…" · "What the plan allows" · "Payment and receipts are handled by Stripe; the sim never sees your card." · "What you've used" · "Nothing yet. A run or a coach question will show here with what it cost." · "Your collection" + paste help 247 · "This deletes your decks, runs and record for good. There is no undo." · "Delete everything" | Titles "Plan" · "Usage" · "Email" · "Phone". Stripe line → "Billing ↗" button only. Usage empty: "Nothing yet." Collection paste leaves Account (§6). Delete: button "Delete my account", confirm sheet "Deletes your decks and runs. No undo." + one button |
| Account 1116–1119 | "On iPhone: Share → Add to Home Screen. Then open Deck Bench from there." · "Add Deck Bench to your Home Screen for notifications and the Table counter at events." · "Installed. Run finished, weekly changes and coach answers arrive as notifications when they are on." | One line, state-dependent: "Share → Add to Home Screen" / "Installed · Notifications on" |
| Codex 269 | "Every card and deck the sim knows about, with where it's played this week and how it did in your runs. Standard only for now." | Search placeholder "Search cards and decks" |
| Field picker 377–380 | "Sources · blended by default" · "Where sources disagree by 3+ points on a deck, the row is marked." · "Snapshots · run any version against any week" | "Sources" · "Weeks". The disagreement mark gets a tooltip, not a sentence |
| Coach 1316 | "the coach is busy" · "needs two versions" | pill "thinking" · "Compare needs two versions" once (1592 says it already; drop the coach copy) |

## 6 · One owner per thing

| Thing | Owner (v5) | Remove from |
|---|---|---|
| Collection text | Collection tab · "Update from ManaBox" | Account paste box 244–247; Deck empty state keeps the button but it opens Collection; brew-from note 1165 |
| Cards dial / budget | Run sheet | Settings `st.budget` fields 1600–1613 (the coach pills on Collection *show* the dial and jump to the sheet) |
| Sideboard | Deck list (Edit) | Guide "Edit in place" 610; Sim shows the plan read-only with "Edit on Deck" |
| Deck name and cover | Deck header (tap the name) | the wizard step "Name and cover" 571–573 |
| Email | Account | sign-in flow keeps entry only, never settings |
| Win rate | Sim headline | Deck sidebar pill; the brief sentence; Guide header |
| Trust caveat | Sim · Trust stat → method sheet | the five places in §5 |
| Run status | one pill on the Sim headline | runNote 392, toast 1263, bench line 1553 "The next run will queue another." |
| Push / install | Account · "On your phone" | Table tab banner 1119 |
| Field (who to play) | Run sheet | Results field picker 377 (Sim shows which field the run used, read-only) |

## 7 · Safety gaps: fix FIRST
1. **Rule zero leaks.** Seven Arena strings survive change 25 on end-user surfaces: 128, 415, 564×2, 1660/1668/1683 (dead branch still shipped and still forked by `isArena`), 1747. Remove them and the `isArena` fork; `wildcards` leaves `settings.budget`.
2. **Collection paste overwrites with no confirm** (247 "It replaces the old one."). Either confirm once ("Replace 48 cards with 52?") or keep the previous export and show "Replaced · undo" for one session. Prefer the second: reversible beats a dialog.
3. **Sign-up form still advertises "No reset yet — save the password"** (108). With code sign-in shipped, the password path should be the fallback behind a link, not the first form; a lost password today means a lost account.
4. **Stopped runs tell the player about crashes** (1257). Infra failure text is a tier violation and a trust hit; the player sees "stopped", the reason goes to the admin log and the Account footer.
5. **Empty states missing:** Sim tab with no run ("No runs yet · Run"), Collection "What you could build" before the weekly job, coach column before the first run ("Ask about the deck; matchup modes unlock after a run"). Loading state exists for brew-from (210) and account (229); add one for the check (it's sub-second, so a skeleton, not text).
6. **Compare on a one-version deck** shows copy in two places (1592 and the coach 1316): disable the button instead.

## 8 · The five laws
1. **One word.** No retired term in any UI string (§3 grep returns nothing).
2. **Label-sufficient.** No helper text where the label already says it; survivors carry a format, a constraint, or a reason.
3. **One fact, one place.** Win rate, trust, run status, coverage: once per screen.
4. **Tier.** No Forge, server, Mac, worker, .env, bridge, log paths, IDs or crash text on a player surface. Admin lines stay in the Account footer behind the admin flag.
5. **Reversible or confirmed.** Delete deck, delete account, cancel run ask once (they do); collection replace becomes reversible.

## 9 · Execution order (Code)
1. §7 safety fixes, as one patch (`patch_v4_distill_safety.py`, change 26): Arena removal, collection undo, password behind a link, stopped-run copy, empty states.
2. Vocabulary rename across UI strings only (change 27), then run the grep rule. Code identifiers untouched.
3. End-user cuts §5 on the v4 page (change 28): this is what makes v4 tolerable until v5 lands, and v5's templates inherit the strings.
4. Admin + one-owner consolidations §6: these are v5 shell work (collection → Collection tab, budget → Run sheet, sideboard edit → Deck). Do them in the v5 build, not on v4.
5. Re-measure: re-run the counts in §1 on the result; every row at target. Paste the before/after table into the PR.

## 10 · Constraints
- No visual redesign in 1–3: same tokens, colours, type, motion. (v5 is a separate, approved shell change.)
- No feature removed. Anything reached from two places is reached from one, never zero: the password sign-in, the Settings budget, the Account paste all stay reachable until their v5 owner exists.
- No new dependencies.
- The patch chain stays idempotent: each new patch asserts `data-change25` and adds its own marker.
- Tests: `rendertest2.js` across run × tab × view must show no new missing holes; `rt*.js` flow tests pass; fixture strings that the tests match on (e.g. "Queue the run") are updated with the rename.

## 11 · Verify
- `node rendertest2.js project/Brewer-v4.dc.html` clean; script parses (`node -e` on the extracted `<script>`).
- The two grep lines in §3 return zero UI hits.
- Walk both journeys against the five laws: paste → Run → Sim → Deck → Collection → Account, then the admin footer. Each screen: one word, label-sufficient, one fact one place, no infra words, destructive asks once.
- Count table re-run (the regex per noun in `scratchpad/strings.txt` method) and pasted into the PR beside §1.

## Where "suggested" may feel too bare (for Justin)
- **The Run sheet without "Safe to close the tab."** The toast says it once; if people still sit and watch, bring back a single line under the status pill, not three.
- **Stopped runs with no reason.** You will want the crash text while you're the only user. Keep it behind the admin flag (Account footer), not on the player's screen.
- **Trust as one stat.** The sentence "don't call a matchup off it" is the most honest line in the app; moving it into the method sheet means fewer people read it. The compromise is the stat's label: "Trust · fair on versions, weak on matchups" says it in six words, on the screen.
