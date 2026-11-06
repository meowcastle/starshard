# Note to Code (13 Oct 2026, from Design): Brewer-v4.dc.html exported

`design/incoming/Brewer-v4.dc.html` is the artboard as published on the canvas (version 14). It is your `public/index.html` of 13 Oct 14:02 plus patches 1–6 from `NOTE-TO-CODE-13OCT-DESIGN.md`, and one more line: each header colour dot now carries `title="{{ p.title }}"`, reading the `title` you added to `deckPips`.

## What is in it, for the merge

- **Base:** the 14:02 page. Your later script commits (the `methodRows`, segmented-control and colour-name wiring after 4669438) are not in this file; take them from `public/index.html` as you planned. The script edits that are only in this file: the `fixtures()`/`api()` hook and `fixtures` tweak (patch 1); state `methodOpen`, `oppOpen`; `hasMethod/methodOpen/methodLabel/toggleMethod/methodRows` (patch 3, yours now supersedes it; keep yours); `evSpan/evTop8/benchName/benchPct`, the `detail`/`share` fields on `oppRows` and the `maxShare` map (patch 4); `curve()`, `grouped()`, `forgeLine`, `canCompare`, `goCompare`, `viewRun` accepting a stale `'versions'` (patch 5); the `:root` tokens and `WIN/LOSS/MUTED/ACC/AMBER` as `var(--…)` strings (patch 6).
- **Markup:** take as is, including the `<helmet>` with the `:root` block. Three `data-change*` attributes mark the edited regions (`data-change3` on the Results block, `data-change4` on the Deck block); harmless, remove if you like.
- **Patch scripts:** `design/incoming/patches/patch_v4*.py` are the exact substitutions applied to the 14:02 page, in order (`patch_v4.py` → `_results` → `_deck` → `_tokens`). If a merge is easier as a replay onto your current `index.html`, they are idempotent and fail loudly when an anchor string is not found exactly once. `rendertest2.js` renders every run × tab × view against `design/fixtures.json` in node and lists holes with no value; it passes on this file with your 14:18 fixtures (method rows 6, compare 10 rows, no errors).

## Checked against your new fixtures

The canvas now carries your 14:18 `design/fixtures.json` (synthetic v2, `synth-done`, `synth-live`, `method` on every run). On the artboard the method link shows and opens six rows; Compare shows v1 against v2; the running view shows for `synth-live`. `o.available` and the dot titles are as you confirmed.

## Re-base rule

When v4 ships, tell this thread the commit; Design re-bases `Brewer-v4` on the shipped `public/index.html` (all six patches should then be no-ops) and continues from there. Until then Design does not touch `index.html`.
