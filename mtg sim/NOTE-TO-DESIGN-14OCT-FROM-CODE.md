# Note to Design (14 Oct 2026, from Code): changes 9, 10 and 11 on the server

Replies to `NOTE-TO-CODE-14OCT-LEAKS.md`, `NOTE-TO-CODE-13OCT-LOG-MATCH.md` and `NOTE-TO-CODE-14OCT-GUIDE-AND-WEEKLY.md`. Commits 2c041a8 and 489d352 on `mtg-sim`. They go live with the next NAS rebuild.

## Change 9, Log a match: live as drawn
- `patch_v4_logmatch.py` is applied to `public/index.html`.
- `POST /api/brews/:id/real` takes `{ opponent, won, onPlay, source, at }` and returns the brew. It sends 400 "pick the opponent and the result" when either is missing.
- Hand-logged matches sit in the same list as the parsed ones, so `real` pools both.
- `real.source` reads:
  - "Arena Bo1", "Arena Bo3" or "Paper" when every match is the same;
  - "Arena and paper" when they mix with paper;
  - "Arena Bo1 and Bo3" otherwise.

## Change 10, Your play with this deck: live as drawn
- `patch_v4_leaks.py` is applied. `brew.real.leaks` is in `log-leaks.js`'s shape, pooled over every parsed match on the brew.
- The Mac counts each match and sends only the counts and moments, never the game log. Moments carry 8-character match ids and no opponent names.
- Hand-logged matches have no log, so they count in the record but not in the leaks.
- The Arena parser now writes `attack`, `block` and `combat` records, Arena's step on casts (`Step_Upkeep`, `Step_End` ...) and the stack size. So the open-board tile is measured now.
- On Justin's three games:
  - attacked with everything into an empty board 6 of 6 (100%);
  - lethal never stood on the board, so "took lethal" stays "not measured yet", correctly;
  - the other six tiles are your numbers.
- Checked:
  - in a render of the page with fixture brews, the tiles read 0.9, 11%, 33%, 100%, —, 0%, 67%;
  - on a local server, the worker route stored the leaks and `real.leaks` came back pooled.

## Change 11, the guide: the endpoint is live; three gaps against the spec
`GET /api/brews/:id/guide?v=n` (owner) returns your shape, with additions:

```
{ title, owner, format, version, writtenAt, run: {id, v, oppSet, n}, field: {date, label, n},
  summary: {text, nearest, p, lo, hi, top8: {p, lo, hi} | null, rounds},
  plan: {title, text, evidence, basis} | null,                 // the run's readout (weakness + note)
  matchups: [{opponent, metaPct, p, lo, hi, role, text, at, evidence, basis}],
  hands: [], mulligan: {text, at, graded: 'untested'} | null,
  sideboard: guide.rows | null, sideboardAt,
  cards: [{name, qty, was, text: null, whenCast: {p, n, turn}, lift, arena: null}],
  changes: [{v, at, diff, note, result: {p, delta} | null}],   // newest first
  real, method,
  missing: ['readout' | 'pilot' | 'mulligan' | 'sideboard' | 'run'],   // the sections to render as "not written yet · ask the coach"
  missingPilot: [opponent names with no pilot-mode text yet],
  share: {token, v} | null }
```

Sharing:
- `PATCH /api/brews/:id {share: true}` mints a token, and `{share: false}` revokes it.
- `GET /api/guide/:token` needs no login. It returns the same document with `shared: true`, `owner` (the account name; there is no separate display name) and no `real`, so the player's own games stay private.

**The three gaps:**
1. **Keep or ship.** The mulligan mode writes prose, not rows. `hands` stays empty until the per-hand-class batch exists. Until then, show `mulligan.text` marked "untested".
2. **Card choices.** `text` is null: the coach has no per-card prose today, only the readout's options. `arena` is null too: the Arena log counts leaks, not per-card results.
3. **Matchups.** `role` comes from the sideboard guide's rows, so it is null until the sideboard mode has run. Pilot-mode answers are stored with their opponent from now on. Answers already in a thread have no opponent recorded, so those matchups show as missing until asked again.

Also changed:
- `changes[].note` reads the note given when a version is saved. Notes are kept on the version from now on; older versions have none.

**Routes still needed:**
- The page routes `/g/:brew/v:n` and `/g/:token` serve nothing yet. Once you hand me the template, I'll serve it at both, filled from these two endpoints.

## Change 12, the weekly rerun: not started
Next after this, as specced.

One thing to settle first: you suggested a notification email when a brew moves. The sim has no mail sending of its own; Star Shard's Resend setup is the other product's. Until Justin decides on mail, I'll build the badge only.
