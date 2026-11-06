# Note to Code: saved state, versions and runs must be visible (16 Oct, evening)

Justin's review of the live page after 26–28 + the v5 shell: "v3, v4, what happened? I never made a v4. I wanted a sim of v3 and I don't see it anywhere. Updating a deck is high stakes (resleeve, buy cards), so the process has to be obvious." He is right. This is the top of the queue, ahead of the templates and the engine work.

## What actually happened (confirmed in server.js and the worker's data folder)
1. **Optimize made v4 without asking.** `POST /api/brews/:id/optimize` (server.js ~1685) runs `shell.structure` on the chosen version, pushes a new version with the swaps, and then `startRun(b, user, b.optimize.v, 'meta10')` runs **the new version**. The header's deck picker then shows v4. The only signal is a coach-thread line "Saved as v4". His v3, the one he edited by hand, was never run; Compare says so ("v3 hasn't run yet").
2. **The run "stopped at game 0" because the queue is in memory.** `const jobs = new Map(); const queue = []` (server.js:156). Justin rebuilt the NAS container at ~13:59 after your commits; every queued and running job vanished, `jobOf()` returns null, `runView` reports `lost`, and the page shows "Stopped at game 0 of 200" with no reason, because the reason now lives behind `isAdmin` (change 26). The worker on the Mac was also busy with the benchmark gauntlet job `d48cf50b8d` (owner `benchmark`, created 18:10 UTC, still writing game logs at 18:39), so a user run would have sat behind it with no indication either way.
3. **"Optimizing…" never comes back.** index.html ~1798: `optimizing = status && status !== 'done'`. Once the run was lost, `optimize.status` is `failed`, which still reads as optimizing; the button is dead until the next Optimize, which the server refuses with 409 only while status isn't done/failed, so the page and server disagree.


## Revised 17 Oct morning, after NOTE-TO-DESIGN-16OCT-JUSTIN-CALLS.md
Justin's calls win over B and the ledger: Optimize **suggests and never acts** (a list on the Collection tab, each row with its own Apply → Save sheet; no automatic chain); versions are a **chooser on the header** that carries origin, date, result and Make current; the **Deck tab leads with the current version's sim highlights**. The board `design/DESIGN-STATE-30-17OCT.html` is redrawn to that. Still outstanding from §Fix first: the queue is not yet persisted (`jobs.json` absent), benchmark jobs don't yield, and the Optimize flag; do those before the new screens.

## Fix first (bugs)
- **Persist the queue.** Write `jobs` and `queue` to `jobs.json` beside `history` on every change; on boot, re-queue anything that was `queued` or `running` and tell the thread once: "The sim restarted; v4 is back in the queue." A rebuild must never lose a run. (You already do the equivalent for `preparing` at server.js:332.)
- `optimizing = ['structure','running','matchups','writing'].includes(status)`; `failed` and `done` release the button, and `failed` shows one line under the check: "Optimize stopped: the run was lost. Run again."
- A stopped run with 0 games shows **why** to the player when the cause is ours (restart, worker offline, worker busy) in plain words: "The sim restarted" / "The worker is offline" / "Waiting behind a benchmark run · about 40 min". Only crash dumps stay behind `isAdmin`. Rewrite the §7.4 rule as: *the player always gets a cause they can act on; the player never gets a stack trace.*
- **Benchmark jobs yield to user runs.** A user run goes ahead of `owner: 'benchmark'` in the queue, or the benchmark pauses at the next pairing. Right now the worker's one slot can be held for an hour by a job nobody is waiting on.
- The Sim tab for a run with 0 games renders the full matchup table ("Not played yet" × 10), the leaks table ("Lost · 0 games") and an empty Mix panel. Rule 4 of the v5 doc: a section with no data isn't rendered. Show the run's status card and nothing else.

## The process (design, change 30)
One rule: **nothing changes what "the deck" is without the player seeing it happen.** Three moments, each with a sheet or an inline stepper.

### A · Saving a version
- Editing the list or pasting a new one ends on a **Save sheet**: the diff (−/+ rows, "54 of 60 shared"), a note field, and two buttons: **Save as v4** · **Save and run**. Cancel keeps v3 untouched. No silent versioning anywhere else.
- The header's deck line always carries the state: `Squall · v3 · saved Oct 16 · not run yet` / `· 57% on Oct 16 field` / `· running 12%` / `· stopped`. That line is the truth; the picker lists every version with the same state.
- **Current** is explicit. Each version row has "Make current"; Run, Plan, Collection and the coach all read the current version; the header says which one is current. Optimize never changes current on its own.

### B · Optimize
- Before: a **sheet**, not a button. "Optimize v3: fix structure first and save it as v4 (v3 stays). Then run v4 against this week's top 10 and test the coach's swaps. About 40 minutes. Your collection: owned only." Buttons **Start** · Cancel. The Cards dial sits on this sheet.
- During: the check card becomes a **stepper** with the four steps and their state: `Structure · saved v4 (−Squall −SeeD +Plains)` ✓ · `Run v4 · 61 of 200` ● · `Swap tests` ○ · `Write-up` ○, with **Cancel** and "v3 stays current until you choose v4". The coach column mirrors it in one line per step (it already does; the steps are `optimize.steps`).
- After: "v4 is ready · 52% vs the field (v3 not run)" with **Make v4 current** · **Run v3 to compare** · **Discard v4**. Nothing is current until he says so.

### C · Running
- Run sheet title says what it will do: "Run v3 · 200 games · ~30 min · Oct 16 field". If v3 is edited but unsaved, the sheet says "Save v4 first?".
- Running state is one pill on the header line and the Sim tab, with the queue position when it's waiting ("queued · 2nd · behind a benchmark run").
- Stopped: pill + cause + **Run again**, never a bare "Stopped".


### D · The coach's versions go through the same door
Justin asked you (0506bbf) for the coach to update the version when told to. Keep it, but it lands like every other version: a ledger row `From: Coach · "add 2 Get Lost"`, the header line `v5 · from the coach · v3 stays current · Make v5 current`, and the coach's reply says "Saved as v5; v3 is still current. Say 'make it current' or tap it in Versions." Only an explicit "make it current" / "go live" in the ask switches current. No version is ever created silently, by anyone.

### Versions table (Deck tab)
`v · when · from (pasted / edited / Optimize) · result (57% · not run · running · stopped) · Current ● · Run · Compare`. Sorted newest first. The diff opens inline. This is the saved-state ledger Justin asked for; everything else points at it.

## Smaller things from the same screenshots
- Collection tab empty state appears twice ("No collection yet" under the title and again as a row) plus "no paper collection or no field yet" (lowercase; "paper" is retired). One block: title "Collection", one line "No collection yet", one button "Paste your ManaBox export". "What you could build" isn't rendered until there is a collection.
- Deck tab goal line ("Goal: Competitive tournament · consistent  nothing fixed  competitive · Edit goal and constraints") is four fragments; "Edit name and cover" and "Edit goal and constraints" are green links in a facts line. Fold both into one "Edit" on the deck header; the goal shows as one phrase.
- The coach thread shows old write-ups (Oct 12, Oct 13) for older versions above the new run with no version label. Each coach message that belongs to a run carries its version pill (`v2 · Oct 12`), and the thread opens scrolled to the current version's run.
- Ask bar: change 29 (`patch_v4_askbar.py`) fixes the bleed-through; it dry-runs clean on the current page.

## Order
1. Queue persistence + benchmark yield + optimizing flag + stopped-run causes (bugs; one commit).
2. Save sheet, header state line, explicit Current (A).
3. Optimize sheet + stepper + after-state (B), Run sheet copy (C).
4. Versions table, Collection empty state, goal line, coach version pills.
The drawings are done: `design/DESIGN-STATE-30-17OCT.html` (also the "change 30 · saved state" board on the canvas): the header state line with its four states, the Save sheet, the Optimize sheet, the stepper and the after-state, the Versions ledger, the Run sheet and the stopped card. Build 1 now; 2–4 from the board.
