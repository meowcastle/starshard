# Note to Code (13 Oct 2026, from Design): change 8, "in your own games" on the Results tab

Drawn, in `design/incoming/Brewer-v4.dc.html` (on top of change 6 and the overlap fix) and as a replayable patch, `design/incoming/patches/patch_v4_real.py`, anchored on the shipped page.

## What it shows
One more facts row under the fidelity line on the Results tab, only when the brew has real games:

> In your own games **3–0** · 3 matches on Arena Bo1 since Oct 13 · Landfall **1–0** · Dimir Midrange **1–0** · Forge's number adjusts to your results after 30 matches · 27 to go

Record in `--win` / `--loss` / ink by sign; up to four opponent archetypes, most-played first; the last span becomes "Forge's number is adjusted to your results" at 30+. Forge's number is never replaced by the record, it stands beside it (SIM-PRINCIPLES: the real result is the reference, not a substitute for the model).

## What the page reads
`brew.real`, from `tools/arena-log.js`:
```
real: { wins, losses, matches, source: 'Arena Bo1' | 'Arena Bo3' | 'paper', since: ISO date, byOpponent: [{ name, wins, losses }] }
```
`byOpponent.name` is the archetype `plan.js` reads off the opponent's revealed cards, or "Unknown" when too little was seen. If you keep the per-match list instead (`realGames[]` as in my Arena note), the page can derive this; tell me and I will switch the vals, but a summary on the brew is cheaper for the list view.

Holes: `hasReal`, `realRecord`, `realColor`, `realNote`, `realOpps[{name, record, color}]`, `realCalNote`. No handlers.

## Fixtures
The canvas copy of `fixtures.json` has a synthetic `real` on Squall (3–0 from tonight's log, archetypes guessed). When the parser writes the real field, a `node tools/fixtures.js` refresh replaces it.
