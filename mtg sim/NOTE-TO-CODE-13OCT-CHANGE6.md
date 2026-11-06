# Note to Code (13 Oct 2026, from Design): change 6, the four controls

`design/incoming/Brewer-v4.dc.html` is the artboard re-based on de8c72d with one patch, `design/incoming/patches/patch_v4_coach.py` (replayable, anchors on the shipped page). Board on the canvas: "v4 change 6 · coach controls and the format choice". All four controls use parts the page already has: the segmented pill from change 1, the Name-and-cover panel's shape, the hatched edge from thin matchups.

## A. Paste step: the format choice
- Markup: a pill row ("Format" · Standard / Pioneer / Modern / Legacy / Vintage) above the check row, with a note after it. State `fsFormat: 'standard'`; const `FORMATS`.
- `/api/check` body gains `format: S.fsFormat`; the create body gains `format: S.fsFormat`.
- `fsFormatNote` reads `check.legality` after a check: "every card is Standard-legal" or "N cards not Standard-legal: Llanowar Elves (Pioneer), …". Your `legalityError` text still arrives as `fsErr` on create and shows in the existing note slot, in `--loss`.
- Holes: `fsFormats[{label, pick, ring, fill, ink}]`, `fsFormatNote`.

## B. Deck tab: the reading and settings row
- One more facts row under the existing one: `hasReading`, `readingPlan`, `readingNearest` (", closest to X"), `goalLabel` (event), `goalExtra` (" · by Oct 25 · 7 rounds · consistent"), `constraintsLabel` ("keeps 3 cards · avoids 1 · budget 4R/2M" or "nothing fixed"), `levelLabel`, `openSettings` link (gated `notEditingSettings`). Under it, `readingMissing` as amber lines: I treat `reading.missing` items as strings (or `.text`); tell me the real shape if it differs.
- The editor (`editingSettings`): event pills, posture pills + `postureNote`, date and rounds inputs, keep / never textareas (one card per line), wildcard inputs, level pills, Cancel / Save. Draft state lives in `S.st` until Save; `saveSettings(d, e)` PATCHes `/api/brews/:id` with `{settings}` in your `cleanSettings` shape (`goal.{event,posture,date,rounds}`, `keep[]`, `never[]`, `budget{rare,mythic}|null`, `level`) and replaces the brew from the response.
- Event labels on the page: RCQ, Store championship, FNM, Arena Bo3, Arena Bo1, No event (keys as in `EVENTS`). Level labels: Teach me / Competitive / Just the numbers.
- State: `settingsOpen, settingsErr, st`. Method: `saveSettings`.

## C. Coach: the modes
- Above the composer: "Ask for" + pills Sideboard guide / How to play a matchup / Mulligans / Mana / Review the versions (`coachModes[{label,title,opacity,ring,fill,ink,go}]`); Review dimmed under two versions; all dimmed while `d.thinking`. Pilot toggles a second row (`pickingOpp`, `pilotOpps`: opponents by meta share, top 8) and the pick sends the request.
- `coachMode(id, mode, opponent)` POSTs `/api/brews/:id/coach` and reloads; the brew is marked thinking locally so the pills dim at once.
- Thread entries append the mode name after the time (`m.kind` → "sideboard guide", "how to play it", "mulligans", "mana", "version review").
- State: `coachMode: 'readout'`, `pilotOpp` (unused for now). Method: `coachMode`.
- Not drawn yet: `b.guide.rows` (the sideboard guide as rows). They belong in the Deck tab's Sideboard plans section as a reason column; next change, once you confirm the row shape `{opponent, in, out, role, why}`.

## D. Suggestions carry their evidence
- Each option row: left edge solid `--win` for strong, hatched `--amber` for weak/untested; `o.evLabel` ("strong evidence · <basis>") in mono after the title; `o.evColor`; opacity .85 on non-strong; "Test it" in the accent only on strong (`o.color`).
- Reads `o.evidence` and `o.basis` from the readout options; a missing grade (readouts written before grades existed) shows as "not graded", hatched like weak, per your flag.

## Asks
- The composer placeholder already shows asks left under 5; the spec asks for it from the first ask (`limits.asks.left` is there; drop the `<= 5`).
- Regenerate `bindings.md` after wiring; the new holes and handlers are the ones named above.
- The fixtures on the canvas predate settings, readings and evidence; after this ships, a `node tools/fixtures.js` refresh lets me check the row against real data.

## E. Added after your reply (same export, re-sent)
- **Sideboard guide rows** in the Deck tab's right column, above Considering: `hasGuide`, `guideNote` ("written <time> from run vN"), `guideRows[{opponent, role ("you are the beatdown" / "you are the control"), roleBg, roleInk, out, in, why, balance ("2 out · 2 in"), balColor (amber when out ≠ in)}]`, read from `d.guide.rows` in the shape you confirmed. The old `plans` block (never wired) is untouched and still hidden.
- **Rounds hint** follows the chosen event: `stRoundsHint` = 7 / 5 / 4 for RCQ / store / FNM, and "no top 8 on the ladder" for the Arena events. Map lives in the page; if `EVENTS` ever changes, send me the numbers or expose them on `/api/me`.

## F. Fix for the composer overlap (seen live, 13 Oct late)
The sticky block above the composer got taller with the "Ask for" and "Against" rows, but its fade still only turned opaque at 32% of the block's height, so the readout's last option showed through under the pills. One style change on that sticky `div`, in `Brewer-v4.dc.html` and in `patch_v4_coach.py` (section C, the replacement side; the anchor is unchanged):

- was: `position:sticky;bottom:0;padding:24px 0 8px;background:linear-gradient(to bottom,rgba(12,12,11,0),var(--bg) 32%)`
- now: `position:sticky;bottom:0;margin-top:8px;padding:20px 0 8px;background:linear-gradient(to bottom,rgba(12,12,11,0),var(--bg) 16px)`

The fade is a fixed 16px, so the block is solid under every row whatever its height, and the readout scrolls under it cleanly. Re-sent: `design/incoming/Brewer-v4.dc.html` and `design/incoming/patches/patch_v4_coach.py`.

## Arena parser (656a908), acknowledged
Your corrections stand: Justin was on the play in matches 2 and 3 (die rolls 19–17 and 20–6) and his seat differed per match; my table in NOTE-TO-CODE-13OCT-ARENA-LOG.md had him on the draw and seat 2 for those. The results (3–0, final life 25/3, 38/2, 19/14) agree. The Results-tab "in your own games" line is drawn next and comes with its own note.
