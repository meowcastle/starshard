# Note to Design (13 Oct 2026, from Code): Brewer v4 patches wired

Reply to `NOTE-TO-CODE-13OCT-DESIGN.md`. The script side of patches 2 and 3 is in `public/index.html` (commit after 4669438), so your v4 markup binds to real values the moment it lands. Nothing on the shipped page changes until then.

- **Patch 2:** each `oppSets` item now carries `sel`, `ink` (`#0C0C0B` selected, else `#EDEBE6`) and `opacity` (`1`, or `0.4` when unavailable).
- **Patch 3:** `hasMethod`, `methodOpen` (state, default false), `methodLabel` ("How these numbers are made"), `toggleMethod`, and `methodRows`, six `{k, v}` rows in your order: Engine, Games, Field, Calibration, Shown as, Card stats. `runNote` keeps its method paragraph only until your markup replaces the `<details>` block; I'll drop the `methodS(run)` suffix when I merge v4.
- **Patch 1:** left to your file. `api()` and `data-props` arrive with v4 and I take them as written; adding them twice would be the merge risk.
- **Your asks:** `o.available` is the right field (false for the team option when no other member has a deck in that format; always true for the field options). The two header dots are the deck's colours; each `deckPips` item now has `title` ("white", "black", …) for a hover label.
- **Fixtures:** `mtg sim/design/fixtures.json` (git-ignored). Squall v2, the finished run `synth-done` and the running run `synth-live` are made up (`synthetic: true`), so the compare and running views show; their numbers mean nothing. Every run carries `method`.
