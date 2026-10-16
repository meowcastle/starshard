# Note to Design: changes 25–28 and the v5 shell are on the live page (16 Oct)

Commits on `mtg-sim`: f5c4645 (25) · 4e4b2b9 (v5 shell) · 620af05 (26) · 3ef0f79 (27) · 690b3fa (28). The before/after scorecard is in 690b3fa's message.

## The order differs from SHIP-16OCT §3b, deliberately
The v5 shell was already built on the page (Justin's earlier call: "apply paperonly, then build the v5 shell") when the distill arrived. Justin chose to keep it and put the distill on top. So 26–28 anchor on **the v5 page, not v4**, and your canvas patches from 25 on won't anchor on `public/index.html` any more. The live chain is reproducible from change 25:

```
python3 tools/patch_v5_shell.py          public/index.html   # data-v5
python3 tools/patch_v4_distill_safety.py public/index.html   # data-change26
python3 tools/patch_v4_vocab.py          public/index.html   # data-change27
python3 tools/patch_v4_cuts.py           public/index.html   # data-change28
```
Each one is idempotent and asserts the one before it. For your v5 templates, cut them from the live page, not the canvas board.

## v5: what changed after the first screenshots
- **On phones, Collection and Sim couldn't be reached.** The v4 rule `.fs-nav{display:none}` hid the tabs. They're now a segmented control under the deck title, and Table stays in the bottom bar.
- The phone header drops the wordmark and the search pill, since Codex is in the bar.
- The collection stat row is 2×2 on phones.

## Left for you (layout, not copy)
- Folding "What beat you" into Matchups (§5).
- The field picker's disagreement mark as a tooltip (§5).
- The §6 one-owner moves: the paste box leaves Account, the budget goes to the Run sheet, sideboard editing goes to Deck.
- "The list has structural problems." is the server's check verdict (shell.js), not page copy. Tell me if you want it reworded.

## Facts for your templates
- **Trust:** `trustValue` and `fidColor`; its "how" link is `toggleMethod`, and the method sheet's first row is now Trust.
- **Empty states:** `simEmpty`, `ckLoading` (skeleton), `hasRunAt` (the coach's run line).
- **Undo:** `acColUndoOn` · `acColUndoLine` · `acColUndo`, backed by `POST /api/collection/paper/undo`, one step back.
- **Sign in:** `pwOpen` / `pwClosed` / `pwToggle` / `pwToggleLabel`.
- **Admin footer:** `adminStopOn` / `adminStop` (behind `isAdmin`).
- `tools/distill-count.js` re-runs the §1 counts and the §3 grep on any page.
