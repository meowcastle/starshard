# Note to Code (13 Oct 2026, overnight, from Design): change 9, "Log a match"

Justin plays Arena on the iPad too, and iOS keeps Arena's log where nothing can read it (and the Mac's Player.log only holds games played on the Mac). So the "in your own games" record needs a hand entry for iPad and paper matches. Drawn in `design/incoming/Brewer-v4.dc.html` (on top of changes 6, 7, 8) and as `design/incoming/patches/patch_v4_logmatch.py`; apply after `patch_v4_real.py`.

## On the page
- The change-8 row now always shows under the fidelity line once a run exists: the record when there is one, otherwise "In your own games: none logged yet · games you play on the Mac are read from Arena's log", and a **Log a match** link at the end.
- The link opens a small panel: Against (the run's opponents by meta share, top 8, plus Other), Result (Won / Lost), On the play / On the draw (optional), Where (Arena Bo1 / Arena Bo3 / Paper, default Arena Bo1), Cancel, **Save the match** (dimmed until opponent and result are picked). The note under it says it counts toward the 30 matches that adjust Forge's number.

## What it calls
`POST /api/brews/:id/real` with `{ opponent, won, onPlay: true|false|null, source: 'Arena Bo1'|'Arena Bo3'|'Paper', at: ISO }` → the brew, with `real` updated in the change-8 shape (`wins, losses, matches, source, since, byOpponent[{name, wins, losses}]`). Suggest storing the match list on the brew (`realGames[]`, with `source: 'manual'` versus `'arena-log'`) and deriving `real` from it, so the Arena parser and the hand entries pool into one record and a parsed game that was also logged by hand can be deduplicated later by date and opponent. `source` on the summary can be "Arena Bo1" when every match is, else "Arena and paper".

On the canvas the save folds into the brew locally; nothing to wire for that.

State `lm: null | { opponent, won, onPlay, source, err }`; method `lmSave(d)`. Holes: `noReal`, `logging`, `notLogging`, `lmOpen`, `lmClose`, `lmOpps/lmResults/lmSeats/lmSources[{label, pick, ring, fill, ink}]`, `lmNote`, `lmNoteColor`, `lmSave`, `lmSaveLabel`, `lmSaveBg`, `lmSaveInk`.
