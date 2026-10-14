# Note to Design (14 Oct 2026, from Code): changes 9, 10, 11 and 12 on the server

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

## Change 12, the weekly rerun: built as specced, badge only
It goes live with the next NAS rebuild.

**When it runs:**
- Every 6 hours the server reads MTGGoldfish's top 20 for each format with brews and fingerprints the names and shares.
- The first reading is only a baseline. When the fingerprint changes, the field has changed.
- After a change, each brew is rerun once if all of these hold:
  - it has a field run (top 10 or top 20) from the last 60 days that predates the change;
  - its owner has opened the site in the last 30 days;
  - it hasn't had a weekly rerun in the last 7 days;
  - nothing of it is already running;
  - its newest version is still legal.
- The rerun plays the newest version against the same opponent set, at background priority: it waits behind people's runs, like calibration.

**What it writes**, once the rerun finishes. It's compared with the brew's previous field run, the same version where there is one:

```
brew.weekly = { at, run, prevRun, v, prevV, field: {date, label},
  p, prev, delta,                 // fractions, like every other score (0.47, 0.52, -0.05)
  movers: [{ opponent, metaPct, prevPct, p, prevP, new }],   // up to 6, the biggest effect on the headline first
  notify,                         // |delta| >= 3 points, or a matchup moved 8+
  text,                           // "Squall 52 → 47 this week: Mono-Green Landfall rose to 28% and you are 38% against it (was 47%)."
  guideUpdated: false, seen }
```

- A mover is a matchup that moved 8+ points, a deck whose share moved 3+ points, or a deck new to the field.
- `run.weekly: true` marks the rerun in the runs list, so it can read "weekly rerun" rather than looking like something the owner started.

**What the page does:**
- **The badge:** show `weekly.text` on the deck row when `weekly.notify && !weekly.seen`.
- **Clearing it:** `PATCH /api/brews/:id {weeklySeen: true}`, when the owner opens the brew.
- **The guide:** each matchup row now carries `moved` (that opponent's mover entry, or null). It's set when the weekly rerun is the guide's run and the owner hasn't opened the guide since. Opening the newest version's guide resets it. The public share link never carries it.

**Different from the spec:**
1. **No email.** The sim sends no mail; Star Shard's mail setup belongs to the other product. That stays open until Justin decides.
2. **`guideUpdated` is always false.** The sideboard guide is written by the coach when asked, at a model call per opponent, so it isn't rewritten on its own each week. Drop "the sideboard guide is updated" from the badge until Justin wants that cost.
3. **The first field reading after the rebuild is a baseline,** so the first reruns come with the first real change after it, not on day one.

Checked:
- `test/weekly.test.js` covers the comparison and the badge text (5 cases; 26/26 in total).
- On a local server, a field change queued the rerun against the same 10 opponents.

## The coach's answers stream (later the same day)
The coach's prose answers (chat questions; the pilot, mulligan, mana and review modes) now appear as they're written, instead of after a 20–60 second "Thinking…".
- `GET /api/brews/:id/draft` returns `{ thinking, draft }`, the answer so far. The page polls it every 0.6 s while a brew is `thinking`, and reloads the brew once it's done.
- In the thread, the pending coach message shows `draft` in place of "Thinking…", with "writing…" where its time would go. No markup changed.
- The readout and the sideboard guide are structured answers, so they still arrive whole.

The deck list's mana dots changed too: one dot per mana, generic mana outlined, coloured mana solid, hybrid split. It's the `ms-pip-*` classes at the end of the `<style>` block, with no markup change.
