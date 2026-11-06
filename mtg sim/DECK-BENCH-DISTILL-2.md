# DECK-BENCH-DISTILL-2 (20 Oct 2026): second pass on the live page

Scope: `public/index.html` as of d4ae38b (v5 shell, changes 26–30, Suggestions, the coach acting on request, Archidekt import). Journey: Deck · Collection · Sim · coach, then Account and sign-in. Line numbers are from that commit; **re-grep the quoted string before editing.** Measured with `tools/distill-count.js` plus a full string pull (620 visible strings).

## 1 · Verdict
The first distill held: every row of its scorecard is at target (Forge, Arena, brew, meta, guide, sign-in clutter, "Safe to close the tab": all 0). The drift is now in what was built since: the new features each arrived with their own name and their own reassurance, so one idea (build from your collection, suggestions, restart, trust, a change's worth) is said three to six ways.

### Scorecard (count → target)
**First pass, re-measured (all at target):** brew 0 · Forge 0 · opponent 0 · meta 0 · guide 0 · within the noise 0 · crashed 0 · stopped early 0 · "Safe to close the tab" 0 · Arena 0 · wildcard 0 · old sign-in labels 0 · server/worker/Mac/bridge 0.

**New drift:**

| Measure | Now | Where (live lines) | Target |
|---|---|---|---|
| Names for "decks your cards can make" | **6** | "Build one from your collection" 167 · "+ build from my collection" 233 · "What you could build" 248, 544 · "The field, by what you can build" 541 · "Decks your collection can carry…" 1390 · "Cheapest deck you could build" 1904 | 1 · **What you could build** |
| Screens that render it | **2** | brew-from screen 246–251 · Collection tab 544–548 | 1 · Collection |
| Names for suggestions | **3** | "Suggest improvements" 1373 · "Suggestions for v3" 522 · "Optimize stopped… Press Optimize" 1940 | 1 · **Suggestions** (button "Suggest") |
| "Nothing changes until you save" per Suggestions block | **3** | 527 · 1374 (twice in one string) | 1 |
| Places the collection is pasted | **2** | Account 283–287 · Collection "Update from ManaBox" 520 (opens Account) | 1 · Collection |
| Buy buttons for a list | **3** | Deck "Buy this list" 669 · Collection "Buy the missing ↗" 525, 533 | 1 · Collection |
| Ways the trust read is phrased | **5** | "versions yes · matchups weak" 1366 · "fair on versions, weak on matchups" 1644 · "Sim read, not a forecast." 1636 · the 1638 sentence · "the sim pilots this worse than people" 1578 / "which the sim pilots badly" 1698 | 1 label + the method sheet |
| Units for "what a change is worth" | **4** | "matches per 100" 1643 · "wins per 20 games" 1826 · "losses in 100" 1665 · "points of top-8 odds" 1507 | 1 · **per 100 matches** |
| Ways a restart is reported | **4** | "the sim restarted" 1325 · "The sim restarted before this run finished. Run it again." 1488 · "lost in a restart while queued" 1489 · "was lost to a restart" 1790 | 1 |
| Words for the thing playing the games | **4** | "the sim" · "The engine stopped" 1488–89 · "the stock pilot" 1430 · "the sim's AI" / "the AI" 1681, 1771, 1786 | 1 · **the sim** |
| Meanings of "Plan" | **2** | sideboard plan (Plan ↗ 368, 661, 664) · billing plan (Account 271, 273, 1257) | 1 (billing → **Credits**) |
| Labels for the sign-in name field | **2** | "Name" 149 · "Username" 151 | 1 · **Username** |
| Names for the method sheet | **2** | "how" 426 · "how these numbers are made" 1426 | 1 · **how** → sheet titled "How it's measured" |
| "paper" as a label | **3** | "Paper" 284 · "Replace the paper collection" / "Paste your paper collection" 1284 | 0 |
| Fact lines above the Deck highlights | **2 lines, 9 fragments, 2 edit links** | 590–591: cards · legal · plays · Goal · constraints · "Edit name and cover" · "Reads as" · "Edit goal and constraints" | 1 line + **Edit** on the header |
| Copy for a feature that no longer exists | **1** | "Optimize stopped: … Press Optimize to try again." 1940 | 0 |

## 2 · Method
Pulled every markup and script string from the live page, ran `tools/distill-count.js` for the first-pass rows, then walked Deck → Collection → Sim → coach → Account → sign-in, counting each concept's names and each fact's appearances per screen.

## 3 · Vocabulary law (additions to DECK-BENCH-DISTILL.md §3, which still stands)
| Concept | THE word | Retired in UI strings |
|---|---|---|
| decks your cards can make | **What you could build** | build from my collection, decks your collection can carry, by what you can build, cheapest deck you could build (as a title) |
| the list of changes the sim proposes | **Suggestions** / button **Suggest** | Optimize, Suggest improvements |
| what a change is worth | **per 100 matches** ("+3 per 100") | wins per 20 games, losses in 100, points of top-8 odds, pts |
| the thing playing the games | **the sim** | the engine, the stock pilot, the AI, the sim's AI |
| a run lost to a restart | **"The sim restarted; it's back in the queue."** (or "…Run it again." if it can't requeue) | lost in a restart, was lost to a restart |
| what you pay with | **Credits** | Plan (for billing) |
| the account's login name | **Username** | Name (on the sign-in form) |
| the method sheet | link **how** → "How it's measured" | how these numbers are made |
| the cards you own | **collection** | paper, paper collection |

**Grep rule** (zero hits in visible strings): `Optimize|Suggest improvements|the engine|stock pilot|the AI\b|wins per 20|losses in 100|points of top-8|lost (in|to) a restart|paper collection|>Paper<|carry|how these numbers are made`. Add these to `tools/distill-count.js`.

## 4 · Copy budget (what's new since the first pass)
- **Suggestions block:** title "Suggestions for v3" + button. One line under the title, stated once: "Nothing changes until you save one." Cut the 527 footer and the second half of the 1374 sentence.
- **Highlights:** six stats, labels above, no sentence under them except the plan line. Trust is one stat; its sub-label is the only hedge on the Deck tab.
- **Deck tab facts:** one line, `60 cards · Standard legal · every card plays · Goal: Competitive tournament`, then nothing. Name, cover, goal and constraints are one **Edit** on the header (already on Code's open list).
- **Status:** a run that stopped shows the header pill and one cause line, the same words on Deck, Sim and in the coach column.

## 5 · End-user cut list
| Screen | Cut (quoted) | Keep / change to |
|---|---|---|
| Paste 167 | "No list yet?" · "Build one from your collection" | "No list yet? **What you could build**" → Collection tab paths |
| Decks drawer 233 | "+ build from my collection" | "+ What you could build" → Collection tab |
| Brew-from screen 246–251 | the whole screen ("What you could build" title, bfNote, table) | Removed; its table is the Collection tab's path cards + "What you could build" list (direction C) |
| Collection 520 | "Update from ManaBox" opening Account | Opens the paste/upload sheet in place on Collection |
| Collection 522, 527, 1373–1374 | "Suggest improvements" · "Fixes from the deck check, swaps from your collection, buys worth making and the coach's matchup swaps. Nothing changes until you save one." · "Nothing changes until you Apply one. Apply opens the Save sheet with that change; "Save and run" tests it." | Button "Suggest" / "Refresh"; sub-line "Nothing changes until you save one." Empty: "Nothing to change." |
| Collection 525, 533 | "Buy the missing ↗" ×2 | One buy row under the missing table: "Buy the 3 worth it · $79" + "$87 at Card Kingdom" (direction C) |
| Collection 535, 541, 544 | "What each card is worth" · "The field, by what you can build" · second "What you could build" | Folded into C: the missing table has a Worth column; "What you could build" appears once |
| Deck 590–591 | "Edit name and cover" · "Reads as …" · "Edit goal and constraints" · constraints fragments | One facts line + **Edit** on the header; "Reads as" moves into the highlights' plan line, which already says it ("…closest to Lifegain") |
| Deck 669 | "Buy this list" · "TCGplayer ↗" · "Card Kingdom ↗" | Removed from Deck; Collection owns buying |
| Deck highlights 1366 | "versions yes · matchups weak" | Same label as Sim: "fair · versions yes, matchups weak" (one string, used in both) |
| Deck check 1940 | "Optimize stopped: … Press Optimize to try again." | Delete (Optimize is gone) |
| Sim trust 1578, 1636, 1638, 1644, 1698 | "Sim read, not a forecast." · "The sim overrates some decks. Against N real matches its matchup calls don't yet beat a coin flip — compare your versions, trust your own reps on matchups." · ": the sim pilots this worse than people, expect it to read low" · "which the sim pilots badly" | Trust stat label (above) on the page; the 1638 sentence lives in the "How it's measured" sheet once; per-matchup "reads low" becomes a small amber "pilots low" tag on that row |
| Sim worth 1507, 1643, 1665, 1826 | "points of top-8 odds" · "What each change is worth, in matches per 100." · "losses in 100" · "Changes are wins per 20 games. With about N games a side, a change under X is inside the noise." | Everything in **per 100 matches**; the noise line: "Under ±X per 100 is inside the noise." |
| Sim / header 1325, 1488–89, 1790 | "the sim restarted" · "The sim restarted before this run finished. Run it again." · "The engine stopped …" · "lost in a restart while queued" · "the engine stopped before any game completed" · "was lost to a restart" | One cause line per case: "The sim restarted; it's back in the queue." / "The sim stopped before a game finished. Run again." |
| Sim method 1430 | "casts the cards the stock pilot never casts" | "casts cards an untuned AI never casts" → "plays the cards most sims skip" (method sheet only) |
| Sim 1681, 1771, 1786 | "under the sim's AI" · "AI: now and then" · "under the same AI" | "in the sim" · "casts it now and then" · "in the same sim" |
| Sim 426, 1426 | "how these numbers are made" / "hide how these numbers are made" | "how" / sheet "How it's measured" with a close button |
| Account 271, 273, 1257 | "Plan" ×2 (billing) | "Credits" (balance, what's included), so "Plan" only ever means the sideboard plan |
| Account 283–287, 1284 | "Paper" · "Replace the paper collection" · "Paste your paper collection" · the paste box | Moves to the Collection tab (above); Account keeps one line "Collection · 48 cards · Update on Collection" |
| Sign-in 148–151 | "Name" (sign-up form) | "Username" on both forms |

## 6 · Admin
- 240: the Forge update notice with `FORGE_VERSION=` and "in the sim's .env, then rebuild." Confirm it renders only when `me.isAdmin`; it's an infra string on a player surface otherwise.
- "Model usage" in the drawer footer: admin only.

## 7 · One owner per thing
| Thing | Owner | Remove from |
|---|---|---|
| Collection import | Collection tab ("Update from ManaBox" opens the sheet there) | Account paste box 283–287 |
| Buying cards | Collection (missing table + buy row) | Deck "Buy this list" 669; Suggestions' "Buy the missing ↗" 525 keeps its per-row buy links only |
| Decks your cards can make | Collection (path cards + list) | brew-from screen 246–251 |
| Trust wording | one string constant, used on Deck highlights and Sim stat | the second copy at 1366 / 1644 |
| Deck name, cover, goal, constraints | header **Edit** | the two links in 590–591 |

## 8 · Safety and bugs, first
1. **Dead Optimize path (1940):** a version with an old `optimize.status === 'failed'` still prints "Press Optimize to try again", pointing at a button that no longer exists. Remove the branch.
2. **Admin notice (240):** verify the `isAdmin` gate.
3. **The coach switching current on instruction** is Justin's call and has Undo in the thread: reversible, passes law 5. Keep the "from the coach" label on the header line; it's the only signal on other tabs.
4. Already fine: delete deck (asks once), delete version (asks once), delete account (Keep/Delete), cancel run (asks once), collection replace (Undo), dead card on save (asks once).

## 9 · The five laws
1. One word. 2. Label-sufficient. 3. One fact, one place. 4. Tier. 5. Reversible or confirmed. (Unchanged from the first brief.)

## 10 · Execution order
1. §8 fixes (one small commit).
2. Vocabulary (§3) across UI strings; extend `tools/distill-count.js` with the new grep; zero hits.
3. Cuts (§5) that don't depend on direction C: Deck facts line + header Edit, Trust string, units, restart lines, method sheet name, Account "Plan" → "Credits", sign-in label.
4. With the Collection direction C build (`NOTE-TO-CODE-20OCT-COLLECTION.md`): the one-owner moves (§7) and the Collection/brew-from cuts. Don't do these twice; they're the same work.
5. Re-measure: re-run the §1 table; every row at target; paste before/after into the commit.

## 11 · Constraints and verify
No visual redesign (same tokens), no capability removed (brew-from's content lives on in Collection; the paste lives on in Collection; buying lives on in Collection), no new dependencies, the patch chain stays idempotent. Verify: script parses, `rendertest`/flow tests green, the grep rule returns zero visible hits, walk Deck → Collection → Sim → coach → Account against the five laws.

## Where "suggested" may feel too bare (for Justin)
- **No buy button on the Deck tab.** You'll be on Deck when you decide to buy. The Collection tab is one tap away and has the better button (only the cards worth buying, both shops), but if you miss it, the fix is a single "Buy what's missing →" link on Deck that opens Collection, not a second buy row.
- **The trust sentence leaves the page.** "Its matchup calls don't yet beat a coin flip" moves into the "How it's measured" sheet; the page keeps "fair · versions yes, matchups weak". Same trade as last time; the label carries it.
- **One unit everywhere.** "Per 100 matches" replaces "points of top-8 odds", which is the number tournament players actually think in. If you'd rather lead with top-8 odds, pick that one instead; the point is one, not which.
