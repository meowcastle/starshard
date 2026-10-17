# Note to Design: change 30 is built (17 Oct)

Built from `design/DESIGN-STATE-30-17OCT.html` by `tools/patch_state30.py`, on top of the live page. Tested in a browser against a copy of Justin's real Squall data, with no page errors.

## Already done before your note (it read an older server)
- **The queue is persisted.** It's `data/jobs-live.json`, not `jobs.json`, which is why you didn't find it. It's written every 5 s and on SIGTERM, and restored on boot. A restart re-queues the run and tells the thread "The sim restarted; v3's run is back in the queue." Tested in three states: preparing, queued, mid-game.
- **Benchmark runs yield.** `claim()` serves people's runs first, and the queue position counts only people's runs.
- **The Optimize flag** is gone with Optimize: it's Suggestions now (Justin's call).
- **Stopped runs say why.**
- **Ask bar (29)** is applied.

## Built from the board
1. **Header line:** `v3 ▾ · current · saved Oct 16 · [pill] · cause · action`. The pill shows one of: not run yet, running · 61 of 200, queued, NN% vs the field, or stopped. The action is "Run again" when stopped, or "Make vN current" on a version that isn't current.
2. **Versions chooser** opens from `v3 ▾`. Each row shows origin, date, a note or diff, and a result pill. Picking a row makes the whole page read that version: highlights, list, Plan ↗ and Run. Its actions are Make current, Compare vN to vCur, Delete (asks once), and New version. The Deck tab's Versions table is removed.
3. **Highlights:** Top 8 · Worst · Best · Over-performed · Under · Trust, then "The plan:" line and Open the plan ↗.
   - Nothing stores a written plan yet, so the plan line is composed from the version's reading ("Midrange lifegain engine (16 lifegain cards), closest to Lifegain."). It adds beatdown/control roles once a sideboard plan exists.
   - The card stats say "when cast", not "when drawn", because cast is what the sim measures.
4. **Suggestions:** tag pills (mana / owned / buy / coach). Buy rows carry the price and a TCGplayer link. Apply opens the Save sheet with that diff.
5. **Save sheet** (the edit bar):
   - Title "Save as v6?", with "from v3 · 59 of 60 shared".
   - The diff, then the facts line, then a note field.
   - Buttons: Save and run · Save as v6 · Cancel, with "v3 stays as it is".
   - "Save and run" saves, then opens the Run sheet. The run itself is still the player's press.
6. **Run sheet:** title "Run v3 · 800 games · about 2.0 h" and a Cancel button. The Cards dial row is not on it yet; it's still in goal settings.
7. **Coach messages** that belong to a run carry its version. The coach column's run header now names the run's own version; it used to print the deck's version beside another version's diff.
8. **Collection:** "No collection yet" appears once.

## One deliberate difference: §D, the coach's versions
Justin asked for the opposite of §D on the 16th: "if I tell coach I want an updated deck with x cards, it will update the version and it will go live." So the coach only edits the deck when asked:
- A clear instruction saves the version and makes it current.
- "Save it but don't switch" keeps the current version.
- A vague wish gets a proposal and a question, nothing saved.
- Every action is a line in the thread with **Undo**.
- The version is labelled "from the coach" in the chooser and on the header line.

Nothing is created silently, which was the point of §D. Only who switches current differs, and that's Justin's call.

## Still open
- Folding "Edit name and cover" and "Edit goal and constraints" into one Edit on the header.
- Hiding "What you could build" until there's a collection.
- The Cards dial on the Run sheet.
