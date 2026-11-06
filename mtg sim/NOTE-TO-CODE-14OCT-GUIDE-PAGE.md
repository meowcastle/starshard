# Note to Code (14 Oct 2026, from Design): the guide page template

`design/incoming/Guide.dc.html` is the page for `/g/:brew/v:n` and `/g/:token`, in the Brewer's own framework (an `<x-dc>` markup block and a `DCLogic` component with the fixtures hook), so your pipeline treats it like `Brewer-v4.dc.html`. Render tests pass on the fixture document (owner route and token route); the canvas carries a `path` prop to switch between them.

## What it does
- Reads the route: `/g/<brew>/v<n>` → `GET /api/brews/<brew>/guide?v=<n>`; `/g/<token>` → `GET /api/guide/<token>`. A login error on the owner route renders "This guide is private. Sign in to the Brewer, or ask its owner for the shared link."
- Renders your document: crumbs and byline, title, the summary sentence with the calibrated win rate, range and top-8 line; a contents row (sections still missing are dimmed); The plan; Matchups and roles (share, you win, role chip, the pilot text with its evidence; a missing matchup says "not written yet · ask how to play it", linking the Brewer's coach with `?deck=&tab=coach&ask=pilot&opponent=`); Keep or ship (rows when `hands` has them, else `mulligan.text` marked untested, else the todo); Sideboard sheet (`sideboard` rows with role and balance, the why under each row); Card choices (won when cast · count, lift; `text` when present); What changed (newest first, note in quotes); How these numbers are made (from `method`).
- Owner only: a Share pill (`PATCH /api/brews/:id {share}`; the page shows the link `/g/<token>` from `share.token`), Back to the deck. Everyone: **Print the table card** — a print stylesheet keeps only the title, Keep or ship and the Sideboard sheet, in black on white, without the "why" rows.
- The three gaps render as designed: empty `hands` → the coach's mulligan prose, marked untested; null `cards[].text` → the row shows the numbers only; null `role` → an em dash in the role column until the sideboard mode has run.

## For the Brewer
Two small links on the Brewer page, both one line each, which I will add to the artboard in the next export rather than now, to keep this one clean: "Open the guide" in the Deck tab's header row (to `/g/<id>/v<n>`), and the same under the Results headline. The `?deck=&tab=&ask=&opponent=` query the guide links back with needs the Brewer to read it on load (select the deck and tab; pre-fill the coach mode and opponent) — your call whether now or with the weekly badge.

## Fixtures
`fixtures.json` on the canvas now holds `/api/brews/<id>/guide` and `/api/guide/*` in your shape, assembled from Squall's run and readout with invented pilot and sideboard text, so the page can be checked on the canvas without the server.
