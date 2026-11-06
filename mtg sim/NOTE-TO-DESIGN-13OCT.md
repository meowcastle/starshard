# Note to Design (13 Oct 2026): Brewer v4

From the research session. Full review: `REVIEW-DESIGN-CODE-13OCT.md` in this folder (or the Claude Doc "Sim Design and Code Review"). Build v4 as a new artboard beside v3; keep every binding in `public/bindings.md` (Code's canonical list, 13 Oct); Code will tell you when its items 3 and 4 land so you copy the page after them.

## What to keep
The look (near-black, Manrope + JetBrains Mono, one lime accent, art as the only colour), the Coach screen as it is (eyebrow, answer, prose, one link down), the three-step paste wizard, the brew header, the run panel's footer line.

## The five changes, in order
1. **Results = one Stat + four sections of rows.** Header: match win rate against this week's field, its range, games played, and one "How these numbers are made" link (Code is making a single `method` object for it). Sections: Your matchups (first column = meta-share width, then verdict, rate with range, chevron), What would raise your odds, How each card played, What beat you. Each row's game 1 / boarded / benchmark / "calibrated against N real games" goes behind the chevron. Remove the share-of-field bar, the three method sentences, "Not played, counted as even", and the pod block until pods exist. Fits one screen at 1440×900 above the fold.
2. **Deck = the list as the hero.** The 60 (+15) in curve order, art on hover; sideboard plan beside it; one Versions row above with "compare →"; name and cover editing in the header. Field, Goal, Considering, Sources become sections only when they have content (Code is adding real flags: hasGoals, hasConsidering, hasSources, podCount).
3. **Run target as a segmented control.** Done on the thread's canvas (v4 artboard and the "before and after" board): three pills, selected one filled, its description and time under it, unavailable dimmed. Copy it.
4. **Tokens.** Nine colours (ground #0C0C0B, panel #121211, hairline rgba(255,255,255,.08), ink #EDEBE6, muted #8F8D86, dim #5C5B56 → raise to ≥ #6E6D67 for any text under 17px (2.9:1 today), accent #C5EC7A, warn amber, four matchup colours), five sizes (34 / 22 / 17 / 15 / 13), one radius (6–8). Laws: amber means "not counted" and nothing else; mono means a date, a version or a count. Write them at the top of the artboard's `<helmet>` as CSS variables and put the page on them.
5. **Name the marks or drop them.** The two colour dots in the brew header get a hover label (the deck's colours) or go. The diamond stays (it is the mark).

## Writing
Four fourth-wall sentences to remove ("How these numbers were made", "Read from Forge's game logs…", the snapshot/scrape line, "Numbers under 30 games show hatched" on Coach): all of it moves into the one method link. Everything else is in house style; keep the eyebrows to one per block.

## Hand back
A Brewer v4 artboard with the changes above, mock data updated to the shipped shapes (`bindings.md` lists them), and a one-line change log. Code wires it against `bindings.md`.
