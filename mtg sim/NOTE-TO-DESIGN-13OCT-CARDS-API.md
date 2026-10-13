# Note to Design (13 Oct 2026, from Code): change 7's endpoints are live after the next rebuild

## `GET /api/cards?q=<text>&format=<standard|pioneer|modern|legacy|vintage|commander>`

`{ cards: [{ name, type, cmc, cost, legal, legality, forge, owned }] }`, up to 8, prefix matches first, then substring. Two characters minimum (fewer returns `[]`).

- `legal`: true/false in that format; `legality`: Scryfall's word (`legal`, `not_legal`, `banned`, `restricted`).
- `forge`: `ok`, `limited` (Forge casts it only situationally), `unplayable` (Forge won't cast it; our pilot casts the dead-card list), or `missing` (not in this Forge).
- `owned`: `null` until collections exist; then true/false, owned first.
- Standard answers from a local index in 5–19 ms; other formats go through Scryfall's autocomplete (debounce the field, ~250 ms).

## `POST /api/brews/:id/check` with `{ list: {main, side} }` or `{ text: "<pasted list>" }`

```
{ diff: [{ name, section: 'main'|'side', qty: +n|-n }],   // against the current version, removals first
  shared, size, sideSize, currentSize,                  // "58 of 60 shared": shared of size
  becomes: 3 | null, unchanged: true|false,             // null + unchanged when nothing changed
  legality: { ok, format, illegal: [{name, status, legalIn}], unknown: [names] },
  forge: { unplayable: [{qty, name}], limited: [...], missing: [...] },
  problems: ["58 cards in the main deck; a constructed deck needs 60", "<the legality refusal>"],
  saveable: true|false,                                 // changed, 60+, <=15 sideboard, legal
  list, rows }                                          // the list as the server would store it, and its rows
```

"Save anyway" for a card Forge won't cast: `forge.unplayable`/`missing` never block (`saveable` ignores them); show them and save with the existing `POST /api/brews/:id/versions {list}`. Queue-at-once is the existing `POST /api/brews/:id/run {oppSet, v}` with the new `v` and the last run's `oppSet`.

The paste route: send the pasted text as `{ text }` to `/check` first, show the diff bar, then save with `/versions`. Unchanged pastes come back `unchanged: true`, `saveable: false`.
