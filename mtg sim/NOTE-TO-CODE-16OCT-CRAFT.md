# Note to Code: change 20, collection and craft (16 Oct)

From Research + Design. The one feature every Arena companion has and we didn't (item D in RESEARCH-APP-VALUE-14OCT.md; "collection / what to craft ○" in the 15 Oct field test). Ours adds what theirs can't: the sim prices each substitute in points.

Patch: `design/incoming/patches/patch_v4_craft.py`, after change 19 (order: voice, change15, polish, motion, table, list, craft). Idempotent, marker `data-change20`. Everything hides when `/api/collection` is empty, so it ships safely before the server work.

## Two shelves
An Arena collection and a paper collection are different things (Justin's are), so the collection has two shelves, `arena` and `paper`. It opens on the paper shelf (the sim is a paper tool; change 21); a pill flips to "Arena (learning)". Arena talks in wildcards; paper talks in dollars and links to TCGplayer with only the missing cards.

## What it draws (Deck tab)
1. **Facts line:** `you own 56 of 60 on Arena · 1 rare + 3 mythic to craft · short 3 mythic`, or `you own 55 of 60 in paper · about $61 to buy`.
2. **Your collection** (left, under the lists): the missing cards with have/need and rarity, the wildcard bill against what the player holds, then **What each card is worth**: every substitution the sim tested, `− 1 The Aetherspark → + 1 Lion Heart · saves 1M · −0.8 (−2.6 to +1.0)`. Red when the whole range is below zero (a real cost), plain when it spans zero (inside the noise).
3. **Build the owned version:** takes the swaps whose range spans zero, makes a new version from them, and runs it. The note says what it saves and that the rest cost real points: craft those.
4. **The field, by what you can build** (right): this week's decks sorted by the wildcards you'd need, with a bar for the share you own; "buildable" in green. Tap opens the Codex archetype.

## Server work
1. **`GET /api/collection`** → `{ arena: { at, source: 'arena-log', cards: { "Card Name": qty }, wildcards: { common, uncommon, rare, mythic } }, paper: { at, source: 'ManaBox export', cards } }`; either shelf may be missing; 404 when both are.
   - **Paper shelf:** `POST /api/collection/paper` with a pasted ManaBox or Moxfield collection export (CSV: name, set, qty; the parser can ignore everything but name and qty, summing printings). Design will draw the paste box on the Account screen; for now the endpoint is enough.
   - Source: the Mac's Arena `Player.log` with detailed logs on. The collection and inventory are logged at login (the `PlayerInventory.GetPlayerCardsV3` and `PlayerInventory.GetPlayerInventory` responses; card ids map to names through the Arena card database the parser already uses). Verify the exact entry names against a current log; they've been renamed before.
   - The worker posts it to the server the way it posts real games (change 8). Basic lands count as owned.
   - Later: a paste box for a ManaBox/Moxfield collection export for paper players.
2. **`rows[].rarity`** and **`rows[].price`** (TCGplayer market, USD, from Scryfall's `prices.usd`, refreshed with the weekly meta) on check and saved versions, with `type` from change 19. Lands are rarity `land`.
3. **`brew.craft`** = `{ at, run, rows: [{ shelf: 'arena'|'paper', out, in, saves: {rare: 1}, savesUsd, delta, lo, hi, games }] }`, one set of rows per shelf the player has (the missing cards differ), from the swap SPRT (tools/sprt.js) run after a brew's run finishes, for each missing card: candidates are owned cards of the same type and colour within ±1 mana value, ranked by the Codex's play rate in the archetype; test the top one per missing card, 320 games, against the full list. `delta` is in points of field win rate.
4. **`POST /api/brews/:id/versions`** `{ from, swaps: [{out, in}], note, run: true }` → the brew with the new version queued. (Deck editing's save path may already cover this; if so, map to it.)
5. **`GET /api/field/craft`** → `{ arena: { field, rows: [{ name, metaPct, owned, size, need: {rare, mythic, …} }] }, paper: { field, rows: [{ name, metaPct, owned, size, usd }] } }` for the current top-10/20 list against each shelf. Cheap: a set difference per deck; `usd` sums the missing cards' prices.

## Tested
Canvas fixtures with a synthetic collection (`/api/collection`), `brew.craft` and `/api/field/craft`; rarities added by hand to the Squall list for the canvas. Rendered at 1440 and 390 with nothing overflowing.
