# Design workflow for the sim (13 Oct 2026)

Claude Design is going away. This is the replacement: the same canvas, living as an artifact in the research thread, fed with real data by Code, and handed back through files Code already reads.

## The pieces

| Piece | Where | What it is |
| --- | --- | --- |
| The canvas | "MTG Arena Deck Simulator" artifact in the research thread | A Design canvas (same editor and `.dc.html` format as Claude Design). Artboards: `Brewer-v4` (the working page), one review board per change, the older screens for reference |
| The page | `project/Brewer-v4.dc.html` on the canvas | The shipped `public/index.html` byte for byte, plus a `fixtures` tweak and a hook in `api()` that answers from `./fixtures.json` on the canvas. Inert in production |
| The data | `mtg sim/design/fixtures.json` (git-ignored) → `project/fixtures.json` on the canvas | Real GET responses, redacted, written by `node tools/fixtures.js`. Never under `public/` |
| The contract | `mtg sim/public/bindings.md` | Every hole and handler the page binds, generated from the page by Code |
| Review boards | `project/<change>-before-after.dc.html` | One per change: the shipped state on the left, the proposed on the right, the reason under it. This is what Justin reviews; no sign-in needed |
| Handoff | `mtg sim/NOTE-TO-DESIGN-*.md` (to the designer) and `NOTE-TO-CODE-*.md` (back to Code) | Files in the folder both sessions read |

## The loop

1. **Code ships a page change** (markup or bindings) and tells the research thread.
2. **Research re-bases `Brewer-v4`** on the new `public/index.html`. Since 7eef0c4 the shipped page carries every design patch and the fixtures hook, so the re-base is `rebase_v4.py`: copy the page, retitle it, and set the `fixtures` tweak's default to true (production ships it false). Design never edits a stale copy; this is the rule that stops the Star Shard merge losses.
3. **Justin refreshes the data** when the brews change: `SIM_URL=https://sim.starshard.net SIM_USER=bluenocturne node tools/fixtures.js` (it asks for the password on the terminal and never writes it). Research stages `design/fixtures.json` to the canvas as `project/fixtures.json`. With the file present, the canvas opens straight into the brews: Coach, Results, Deck and Codex render with real numbers.
4. **Design happens on the canvas**: a change is made on `Brewer-v4`, and a review board shows it before and after. Justin reviews on the board, comments on the canvas, or edits the artboard in place.
5. **Hand back to Code** as `NOTE-TO-CODE-<date>.md`: which markup changed, which bindings are new or renamed (against `bindings.md`), and which review board shows it. Code wires it and ships; back to step 1.

## Rules

- The shipped page is the base. The 6 Oct artboards are history.
- Markup edits on the canvas keep every binding in `bindings.md`; a new binding is proposed in the note, not invented in the markup.
- Fixtures are real data: never committed, never under `public/`, refreshed by Justin, not by a session.
- One review board per change; a change without a board is not reviewed.
- Tokens live at the top of the artboard's `<helmet>` as CSS variables once the token pass lands; both sessions edit the page, neither edits the other's section.

## Where it stands (13 Oct, evening)

- Brewer v4 shipped as 7eef0c4 with all five design changes; the artboard is re-based on it. `design/fixtures.json` carries `method` on every run plus a synthetic v2 and two synthetic runs so Compare and the running view show.
- A design change is handed to Code as the exported artboard in `design/incoming/` (git-ignored) with a NOTE; Code merges scripts and takes markup as is. Lesson from the token pass: a substitution script must not run over the block it just inserted (the `:root` self-reference Code caught).
