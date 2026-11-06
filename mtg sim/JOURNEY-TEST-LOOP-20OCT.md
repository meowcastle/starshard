# The test loop: the user journey, optimized for testing the deck (20 Oct 2026)

Justin: "This all needs to serve the goal of testing the deck, running sims. Think through the user journey and optimize for that, with Archidekt and EDH Play as guidelines for what users already use." Board: "the test loop" on the canvas (far left); file `design/DESIGN-TEST-LOOP-20OCT.html`.

## The loop
Every screen serves one loop. A player comes back to it every time they change a card or the field shifts.

| # | Step | What the player does | What they already know it from |
|---|---|---|---|
| 1 | Bring the deck | Paste, upload, or an Archidekt link; lands on the deck, checked in under a second | Archidekt: the deck page is home |
| 2 | Run it | One button with the cost up front: "Run v3 · this week's top 10 · ~30 min" | EDH Play: paste and play, no setup |
| 3 | While it runs | Draw a sample hand, read the check; results fill in; leave and get a ping | Archidekt's playtester, EDH Play's goldfish |
| 4 | See where it loses | Matchups worst-first; each weak row has **Test a fix** | nobody does this; it's ours |
| 5 | Test one change | A fix for that matchup, run against that deck only (minutes), v4 vs v3 on the same games | ours |
| 6 | Keep it | Make v4 current, then the paper checklist: what comes out, what goes in, what to buy | Archidekt: history, owned cards, buy links |
| 7 | Play it | Log real games at the table; next week's field reruns it | EDH Play: game history |

What we take from the two tools: Archidekt's deck page as home, edit in place, owned cards marked, prices beside each card, a playtester, a change history; EDH Play's paste-and-go, goldfish, and a history of games played. What we don't copy: Archidekt's building tools (people build there and bring the deck here) and EDH Play's multiplayer table (we're a test bench, not a place to play strangers).

## What changes, and why it serves testing

### 1. The header always offers the next step
Change 30's state line gets one button at the end, the next step in the loop:
`v3 · not run yet` **Run v3 · ~30 min** → `v3 · running · 61 of 200` **Draw a sample hand** → `v3 · 52% vs the field` **Fix Azorius (27%)** → `v4 · tested vs Azorius · +9 per 100` **Make v4 current** → `v4 · current` **Update your paper deck · 4 changes** → `v4 · in your sleeves` **Log a match**.
It walks a new player through the loop without a tutorial and tells a returning one where they left off. This is the "go through the process with the user" Justin asked for on the 16th.

### 2. Targeted tests are the default way to try a change
Today the only test is a whole-field run (30 min to 2 h). That makes trying ideas expensive, so players don't. Instead:
- Every matchup row below even gets **Test a fix**. It opens a sheet titled "Fix Azorius Control" with one line on why you lose (from the run's games) and 2–4 fixes: owned swaps first, sideboard changes for G2–3, then buys with both prices. These come from the same Suggestions source, filtered to that matchup.
- **Test vs Azorius · 200 games · ~6 min** saves the fix as v4 (v3 stays current) and runs v4 against that one deck, reusing the base run's seeds so both versions play the same shuffles and the sim's bias cancels.
- The result is a comparison card: `v3 27% → v4 36% · +9 per 100 · outside the noise (±6)`, one line on what it means for the whole field, and three choices: **Make v4 current** · **Run v4 on the whole field** · **Try another fix**.
A player tries three fixes in twenty minutes instead of one an hour. The whole-field run becomes the confirmation, not the starting point.

### 3. Keeping a version ends on a paper checklist
"High stakes to update a deck: you resleeve, get new cards" (Justin, 16 Oct). Making v4 current opens **Update your paper deck**: take out / put in, card by card, with tick boxes; cards you don't own show both prices. **Done · v4 is in my sleeves** sets a "sleeved" version, which is what the Table logs games against. Print the swap list for the shop.

### 4. Use the wait
The Deck tab gets a sample hand (draw 7, mulligan, draw), Archidekt-playtester style, with a line from 1,000 simulated hands: keep rate and how often you have a turn-2 play. It turns the check's mana finding into something you feel, and gives the player something useful to do during a run.

### 5. Where each step lives
- **Deck** (home): bring it, the check, sample hand, versions, the paper checklist, the list.
- **Sim:** run, matchups worst-first, test a fix, the comparison, the plan.
- **Collection:** what you own, what's worth buying, what you could build next (direction C).
- **Table** (phone): play it, log it.
- **Coach** (column on every tab): explains any step; a fix it proposes lands in the same Test sheet as any other.

## For Code
1. **A one-opponent run:** an `oppSet` like `vs:<deck id>` that plays one field deck, G1 + post-board, at ~200 games, and reuses the base run's pairing seeds for that deck (`seedOf` already makes seeds per job and pairing; store the base run's seed per opponent and pass it). The craft swap tests (server.js ~1218–1244) already run variants against a base run; this is that, saved as a version and shown.
2. **Comparison result:** paired difference in "per 100 matches" with the noise band, plus the field-weighted effect (matchup change × field share).
3. **Fix sheet source:** Suggestions filtered to one matchup: owned swaps, sideboard swaps for G2–3, buys; plus a one-line "why you lose" from the run's game logs (the leaks and threat-answer tools already find it).
4. **Header next-step button:** derived from version state + latest run + whether a tested version beats current + sleeved version.
5. **Paper checklist:** `POST /api/brews/:id/sleeved {v}`; the checklist's ticks are page state only; Table logs against the sleeved version.
6. **Sample hand:** client-side shuffle of the current list; the 1,000-hand line from the check's mana model.
Order: 1 → 2 → 3 (the loop works end to end), then 4, then 5 and 6. These sit after the distill-2 fixes and alongside Collection direction C.

## Open for Justin
- Should a fix test the **sideboard plan** (G2–3 only) separately from **main deck** changes? The sheet labels them; the run already plays G1 and post-board, so the comparison can show both rows if you want.
