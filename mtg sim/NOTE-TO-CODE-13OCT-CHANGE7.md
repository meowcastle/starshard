# Note to Code (13 Oct 2026, from Design): change 7 is drawn against your endpoints

`design/incoming/Brewer-v4.dc.html` now carries change 6, the overlap fix, change 8 (real games) and change 7, in that order. `design/incoming/patches/patch_v4_edit.py` is the replayable patch for change 7; run it after `patch_v4_coach.py` and `patch_v4_real.py` (its anchors assume both). Render tests pass on every run × tab × view; the edit state was exercised end to end against the fixtures (start, − to zero, Add a card, Swap, Discard).

## What the page does now
- **Edit the list** (link in the Main header) turns the Deck tab's rows into the edit state: − and + on every row (ceiling 4, lands exempt), **Swap** opens a search under the row, **Add a card…** at the foot of the main list opens the same search. A count at zero keeps the row, struck through; the count colour says up (`--win`) or down (`--loss`); a card not in the current version carries a small "new". The Main · N count and the curve read from the draft as you go.
- **The diff bar** sits sticky at the foot of the main column: the change in words (removals first), a facts line (cards · legality · Forge · becomes vN), problems (under 60, over 15 side, illegal cards in `--loss`; Forge-dead cards in `--amber` with "You can save anyway"), the queue-at-once check, Discard, Save as vN / Save anyway. Save is dimmed until there is a change, 60+ main, ≤15 side and nothing illegal.
- **Paste a new list** against an existing brew no longer creates a version: after your `/api/check` it lands in the same edit state with the pasted list as the draft, so the diff bar shows what changed and the person saves from there. New brews are untouched.

## What it calls (your shapes, unchanged)
- `GET /api/cards?q=&format=` after 2 characters, debounced 250 ms; shows `name`, `type`, and a note from `legal`/`legality`/`forge`/`owned` (not legal and banned in `--loss`; limited/unplayable amber; missing `--loss`; "· owned" when true).
- `POST /api/brews/:id/check {list}` 300 ms after every change; reads `legality`, `forge`, `becomes`, `saveable`, `problems` is not shown verbatim (the page words the count problems itself; the illegal cards come from `legality.illegal` with `legalIn`).
- Save: `POST /api/brews/:id/versions {list, note}` with `note` = the diff in words ("-1 Leyline of the Void, +1 Leyline Axe"), then if the box is ticked the existing `POST /api/brews/:id/run {oppSet, v}` with the last done/running run's `oppSet` and the new version number.
- On the canvas (no server) the search answers from the account's own lists and the check is skipped; nothing to wire for that.

## State and methods (for bindings.md)
State `ed: null | { id, rows[{...row, orig, added}], swap: key|'add'|null, q, hits, hitsNote, chk, queue, err }`. Methods `edStart(d, pastedRows?)`, `edSet(key, qty)`, `edOpen(key)`, `edQuery(q)`, `edPick(hit)`, `edCheck()`, `edSave(d, words)`, helpers `edKey`, `edRowsFrom`, `edUpdate`, `edList`. Row keys are `section|name`.
Holes: `editing`, `notEditing`, `startEdit`, per row `qtyColor deco rowOp tag dec inc decOp incOp swap swapColor swapping`; search `edQ edQuery edPlaceholder edHits[{name,type,note,noteColor,pick}] edHitsNote edAdding edAddOpen`; bar `edDiff[{sign,color,name}] edDiffNote edFacts edProblems[{text,color}] edQueueLabel edQueueFill edToggleQueue edDiscard edSave edSaveLabel edSaveBg edSaveInk`.

## Left as is
- The coach's "Test it" still goes through your `/test` route. Making it open the edit state with the swap pre-filled is one line once you want it (`edStart(d)` then `edPick` for the in-card with `swap` set to the out-card's key); I held off so the two mechanisms don't fight in the same week.
- Sideboard rows get − + Swap too, but Add a card… is main-only for now; say if you want it on the side.
