# Note to Design: Justin's calls from the live review (16 Oct, 3:30 pm)

These come straight from Justin, with screenshots, while he used the live page this afternoon. They adjust NOTE-TO-CODE-16OCT-STATE.md's A–C. Where they disagree, these win.

## 1. Optimize gives suggestions; it doesn't act, and it lives in Collection
> "Optimize should be in the collection area, it should provide ideas and suggestions, but clicking it shouldn't just change a bunch of shit."

- Pressing it shows suggestions, fed by his paper collection: structure fixes, owned swaps, and buys worth making with prices. **Nothing is saved and nothing runs.**
- Each suggestion has its own explicit action (Apply, which leads to the Save sheet with the diff). Testing a suggestion in a run is a separate choice, with the run sheet saying what it will do.
- So B's "Start → stepper → v4 is ready" flow becomes "Suggest → list → apply one". The four-step automatic chain is gone from the player's side.

## 2. Versions are a chooser; the Deck page leads with the current deck's sim highlights
> "Versions [are] not that interesting; should be a click down and you choose, then it shows you all the stats. If you want a compare, fine, but more importantly there [are] stats on that current deck, like all the highlights from the sim. Much better info."

- **Versions:** a dropdown on the deck header ("Squall · v3 ▾"). Pick a version and the page shows that version's stats. Compare is an option inside it, not a section.
- **Deck page, top:** the current version's sim highlights. That's the headline number, the worst and best matchups, the cards that over- and under-performed, and the plan's key line. Today that information sits on the Sim tab while Deck leads with the version ledger.

## 3. The coach column resizes
> "This should be something I can grab and resize to make coach bigger and stats smaller or vice versa."

**Built and live:** drag the column edge (300–900px; the main column keeps at least 560px), double-click to reset, and the width is remembered per browser. Keep the grip (`.fs-grip`, `data-grip`) in your templates.

## 4. What Code fixed today that your templates must keep
All of it is in the live `public/index.html`. Cut templates from that file, not the canvas.
- **Header line:** `deck.versionLabel` now states the truth, e.g. "saved Oct 16 · stopped" or "from Optimize Oct 16 · running 12%".
- **Server fields:** `d.current` (the version that is the deck), plus `origin` and `state` on every version.
- **Optimize progress:** shown in `ckSub` while it works ("Optimize · step 2 of 4 …"), until your design replaces it.
- **Stopped runs:** `simStopped` · `stopLabel` · `stopRerun` · `stopRerunLabel`.
- **Plan ↗:** it 404s, because `/g/:brew/v:n` was never served. Code is serving your `Guide.dc.html` there with the next server deploy.

## 5. Server endpoints ready for your sheets
- `POST /api/brews/:id/current {v}` and `DELETE /api/brews/:id/versions/:v`.
- `GET /api/brews/:id/estimate?v=&oppSet=` returns a ready line, e.g. "Run v3 · 200 games · ~30 min · top 10".
- `GET /api/brews/:id/optimize/preview?from=` shows what it would change, without saving. Code is reworking it into the suggestions list in §1.
