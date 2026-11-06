# Note to Code: change 16, polish and phone layout (15 Oct)

From Research + Design. Patch: `design/incoming/patches/patch_v4_polish.py`.
- Apply it after changes 14 and 15, in this order: `patch_v4_voice.py`, `patch_v4_change15.py`, `patch_v4_polish.py`.
- It's idempotent (marker `data-change16`).
- No server work needed.

I checked it by rendering the page with the canvas fixtures at 1440px and 390px. At 390px, no element on any screen sticks out past the edge of the screen. The render test is clean.

## What it does
1. **Phone and iPad (under 900px).**
   - The sidebar becomes a slide-over opened from a "Decks ☰" top bar. Picking a deck closes it.
   - Two- and three-column blocks stack: deck list and sideboard, account stats, pod stats.
   - The card-stats and "What beat you" tables scroll sideways inside their own section, so the page itself never scrolls sideways.
   - Type steps down a size.
   - The page used to be fixed at 1100px wide, so on a phone it was a zoomed-out desktop page.
2. **Motion and focus.**
   - Colour and background transitions of 120ms.
   - A 180ms fade-up when a tab opens.
   - Row hover on matchups and the deck list.
   - A keyboard focus ring.
   - `prefers-reduced-motion` turns all of this off.
3. **Results headline.** Range, Top 8 and the most-played deck now sit in one stat row, labels above values, between hairlines. Before, they were three runs of inline text. The weekly line leads with a `this week 52→47` chip.
4. **Fit and finish:**
   - "Everything else" now sorts to the bottom of the matchup table.
   - The sidebar deck row stays on one line.
   - "1v1" is gone from the deck header.
   - Missing or broken card art shows a wash in the deck's colours instead of a broken-image box.
   - The Versions row no longer overlaps ("live" ran into "run v2 on today's field").
   - Deck list rows are 4px tighter.
   - Two leftover long notes are shortened.

All the CSS is in one block at the top of the page's style. It uses class names (`fs-shell`, `fs-side`, `fs-main`, `fs-stack`, `fs-x`, `fs-row`, `fs-in`). The media query overrides inline styles with `!important`, because the page is inline-styled.
