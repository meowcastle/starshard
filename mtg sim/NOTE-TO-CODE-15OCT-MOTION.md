# Note to Code: change 17, motion (15 Oct)

From Research + Design. Patch: `design/incoming/patches/patch_v4_motion.py`.
- Apply it after change 16. The order is voice, change15, polish, motion.
- It's idempotent (marker `data-change17`).
- It's CSS plus a few class and index fields. No server work.

## The system
- **One easing curve:** `--ease: cubic-bezier(.22,.8,.24,1)`, a fast start with a long soft landing. `--ease-io` is used only for the looping "thinking" breath.
- **Three speeds:**
  - 140ms: hover and press.
  - 280ms: tabs, opened rows and the slide-over.
  - 600ms: bars drawing.
- **Stagger:** 26ms a row, capped at row 14, so a long list never waits more than about 0.4s.
- **Only the "thinking" state loops.** `prefers-reduced-motion` turns everything off (change 16's rule).

## Where it moves
| Element | Motion |
|---|---|
| Headline number | rises and sharpens out of a 6px blur (0.7s) |
| Relative line, stat row | follow the number in, 2 and 4 steps behind |
| Matchup rows | arrive in order |
| Meta-share bar | fills from the left |
| Range bar | draws out from its centre |
| Win-rate dot | lands on its value with a small overshoot, after the bar |
| Opened matchup detail | drops in 4px |
| Chevron | nudges right on hover |
| Tabs | the accent underline grows under the active tab (`data-on`, `::after` scaleX) and replaces the border colour swap |
| Leak tiles | stagger in; lift 2px on hover |
| Deck list | rows arrive in curve order; new rows while editing animate in too |
| Coach thread | new messages fade up; while the coach is thinking, its diamond breathes and "Thinking…" has a slow light sweep |
| Primary buttons (accent fill) | brighten on hover, press down 1px |
| Pills | border lightens on hover |
| Account switches | the knob glides |
| Phone slide-over | glides in from the left |

All of these are mount animations, so the 2.5s poll re-render doesn't replay them. They play when a tab opens, a run is picked, or a row is added.

New val fields: `tabCoachOn/ResultsOn/DeckOn` ('1'/'0'), `g.i`, `m.i` (leak tiles), `c.i` (deck rows), and `dia` / `textCls` on the thinking message.
