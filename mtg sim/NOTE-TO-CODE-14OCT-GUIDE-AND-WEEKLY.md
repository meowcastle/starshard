# Note to Code (14 Oct 2026, from Design): change 11, the deck guide; change 12, the weekly rerun

Items B and C of RESEARCH-APP-VALUE-14OCT.md. The guide is drawn as a board ("v4 change 11 · the deck guide", `design/incoming/Deck-guide.dc.html`) with real numbers from Squall's fixtures; the weekly rerun is a spec, since it is all server.

## Change 11: the guide
One rendered, read-only document per brew version at `/g/:brew/v:n` (owner) and `/g/:token` (shared). Sections, in order, each straight from a coach mode the server already has: summary (reading + run headline + top-8), **The plan** (readout), **Matchups and roles** (pilot mode per opponent: you win / role / how it goes), **Keep or ship** (mulligan mode: hand classes with the win rate on the play and on the draw), **Sideboard sheet** (`guide.rows`), **Card choices** (readout + the run's card statistics + the Arena line from change 10), **What changed** (versions with diff, note and result), **How these numbers are made** (method). A section not written yet renders as "not written yet · ask the coach" with that mode's pill, so the page doubles as the prep checklist.

Endpoint: `GET /api/brews/:id/guide?v=n` →
```
{ title, version, writtenAt, run: {id, v, oppSet, n}, field: {date, n}, summary: {text, p, lo, hi, top8},
  plan: {text, evidence, basis},
  matchups: [{ opponent, metaPct, p, lo, hi, role: 'beatdown'|'control', text, evidence, basis }],
  hands: [{ hand, play: {keep, p, six}, draw: {keep, p, six} }],      // from the mulligan mode; p from a cached batch per hand class
  sideboard: guide.rows,
  cards: [{ name, qty, was, text, whenCast: {p, n}, arena: {text} | null }],
  changes: [{ v, at, diff, note, result: {p, delta} | null }],
  method: run.method }
```
Share: `PATCH /api/brews/:id {share: true|false}` mints or revokes a token; the public page shows the owner's display name only. "Print the table card" is a print stylesheet on the same page: Sideboard sheet + Keep or ship, mono, no colour.

The mulligan numbers need a small batch per hand class (160 hands a class, Mac, cached by class × opponent); until that exists the Keep or ship rows can carry the coach's verdict without a percentage, graded "untested".

I will draw the page itself as a `.dc.html` template over this JSON once the route answers on the canvas (same pattern as change 7: fixtures first).

## Change 12: the weekly rerun, pushed
When the weekly meta list changes (`meta.js` refresh), for each brew with a run in the last 60 days: queue the latest version against the same `oppSet` on the new field, background priority (after calibration round robins), one run per brew per week. When it finishes, compare with the previous run on the old field and write `brew.weekly = { at, field, p, prev, delta, movers: [{opponent, metaPct, prevPct, p, prevP}], guideUpdated }`. Notify only when `|delta| ≥ 3` or a matchup moved ≥ 8 points: one paragraph, email if the account has one, otherwise a badge on the deck row: "Squall 52 → 47 this week: Landfall rose to 28% and you are 38% against it; the sideboard guide is updated." The guide's Matchups section marks rows that moved since the owner last opened it.

Cost control: a brew whose owner has not opened the site in 30 days stops being rerun until they do. Design will draw the badge and the digest once the shape exists.
