# Note to Code (13 Oct 2026, from Design): change 7, changing the deck

Board on the canvas: "v4 change 7 · changing the deck". Justin's ask: replacing one card should not mean pasting sixty lines. The design keeps versions immutable (a change is always a new version, old runs keep their lists) and makes every way of changing a deck go through one diff bar.

## Behaviour
1. **Edit on the row.** "Edit the list" on the Deck tab puts the list in an edit state: − and + per row (ceiling 4, lands exempt), Swap per row, "Add a card…" at the bottom. Removing the last copy strikes the row through until save. Count and legality update as you go.
2. **Swap search** under the row: up to 8 matches from the Scryfall cache for the brew's format, owned first when a collection is set; each says legality and Forge playability (dead-card list). Picking replaces the row's count with the same number of the new card.
3. **Paste is a diff.** "Paste a new list" no longer creates a version by itself: the pasted list is diffed against the current version and shown in the same bar ("58 of 60 shared"); nothing changed → no version. This is "match my Arena deck".
4. **The diff bar** (sticky at the foot of the list while editing): the diff in words, card count, legality, Forge's view, "becomes vN", a checkbox to queue the new version at once against the last run's field, Discard, Save. Refuses to save under 60 or illegal and says why; "Save anyway" when the only issue is a card Forge won't cast.
5. **Versions row** shows the edit like any version; Compare lines it up against its parent. The coach's "Test it" becomes a pre-filled edit (one version mechanism).

## Needs from Code
- `GET /api/cards?q=<text>&format=<f>` → `[{name, type, cmc, legal, forge: 'ok'|'limited'|'unplayable', owned}]`, from the Scryfall cache and the dead-card list; 8 results, prefix then substring match.
- The new-version route as it is (full list); the page builds the list from the current version + diff and shows `legalFor`'s result before Save (reuse `/api/check` with the built list, or expose `legalFor` on a `/api/brews/:id/check` that also returns the diff against the current version, which would let the server compute "58 of 60 shared").
- Queue-at-once = the existing queue call with the saved version and the last run's `oppSet`.
- Optional: the Test route redirects to the edit path with `out`/`in` pre-filled.

Design will patch the artboard (edit state, swap search, diff bar) once `/api/cards` exists so the search can answer on the canvas; until then the board is the spec.
