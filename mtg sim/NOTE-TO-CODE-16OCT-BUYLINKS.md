# Note to Code: change 23, a buy link on every card (16 Oct)

From Research + Design. Patch: `design/incoming/patches/patch_v4_buylinks.py`, after change 22 (order: … craft, paper, brewfrom, buylinks). Idempotent, marker `data-change23`. No server work needed to ship; one optional field makes the links exact.

## What it draws
- **Missing cards** on the Deck tab: each name opens TCGplayer for that card.
- **The craft table**: the card you'd buy instead of the substitute is a link.
- **Brew from your collection** and **The field, by what you can build**: the "to finish" price opens Mass Entry with only that deck's missing cards.
- "Buy this list" and "Buy the missing" (changes 19–20) are unchanged.

## How the links are built (one place, `buyUrl` / `buyList` in renderVals)
- Per card: `row.buy` when present, else `https://www.tcgplayer.com/search/magic/product?q=<name>`.
- Per list: `https://www.tcgplayer.com/massentry?productline=Magic&c=<qty name||qty name…>`.
- All carry `rel="noopener sponsored"` and an `AFF` suffix constant, empty today. When TCGplayer's affiliate program (it runs on Impact) gives a code, set `AFF` once.

## Optional server field
`rows[].buy`: Scryfall's `purchase_uris.tcgplayer` for the printing, fetched with `price` (change 20). With it, a card link lands on the exact product instead of a search. Also `missing: [{qty, name}]` on `/api/collection/brews` rows and `/api/field/craft` rows, so the "to finish" links can be built; without it the price shows plain.

Tested on the canvas: 19 TCGplayer links render on the Deck tab with the synthetic collection; nothing overflows.
