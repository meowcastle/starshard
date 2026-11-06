# Note to Code: the Collection tab, direction C with the binder behind it (20 Oct)

Justin picked direction C ("Paths") from the board "Collection · three directions" (canvas, far left; file `design/DESIGN-COLLECTION-DIRECTIONS-20OCT.html`), with B ("Binder") one tap behind it. Research behind it: `RESEARCH-BUILDERS-20OCT.md`. This replaces the v5 Collection layout; the change-30 state work (NOTE-TO-CODE-16OCT-STATE.md) still goes first.

## The tab, top to bottom (desktop; phone is the right-hand frames on the board)
1. **Value line:** `Collection  $212  48 cards · $238 at Card Kingdom · Binder` and **Update from ManaBox**. One line, not a stat row. "Binder" opens view B.
2. **"Where next with your cards?"** Four path cards, the current deck's first:
   - **Keep building** the current deck: `41 of 60 · $184 to finish; $70 of it moves the number` + owned bar. Scrolls to the missing table.
   - **From what you own:** the top of `/api/collection/brews` (cheapest to finish): name, owned of size, $ to finish, share of the field. "Start it as a deck" creates a new deck (not a version of this one) and goes to its Deck tab.
   - **From a meta deck:** a picker of this week's field; the server swaps owned cards in where a card of the same role exists (start simple: exact-name matches plus basic lands), returns owned of 60 and $ to finish. "Start it" creates a new deck.
   - **Blank brew:** colours + shell picker → new deck, check runs as cards are added.
   None of these touch the current deck. The coach says so once.
3. **Missing for <deck> · worth first:** qty · card · worth (the swap test's points, `≈ 0 · <owned card> covers it`, or `not tested` before a run) · TCGplayer $ · Card Kingdom $, both prices links. Capped at the rows that matter; "15 more under $1 · all 19 in the cart link".
4. **Buttons:** `Buy the 3 worth it · $79` (TCGplayer Mass Entry, only the worth-it rows) and `$87 at Card Kingdom`.
Coach column: reads Collection; mode pills are the Cards dial.

## View B, the binder
Card tiles 6 across (3 on phone), sorted current-deck-first then by value. The overlay toggle "<deck> over my binder" is on by default: green outline = in the deck, amber dashed ghost tile = missing (qty `+2`, tap to buy), no mark = in no deck. Under each tile, both prices as links. "Grid · List" toggles to direction A's table (have · card · set · in decks · TCGplayer · Card Kingdom), with filters All / In <deck> / Missing / Not in a deck. Card images from Scryfall's image URIs (small size), already allowed by the Fan Content Policy as card images.

## Prices and links (every card, every tab)
- **TCGplayer:** Scryfall `prices.usd` (already used). Per-card link: Scryfall `purchase_uris.tcgplayer` when present, else the search fallback from change 23. Whole lists: Mass Entry (change 23).
- **Card Kingdom:** needs a daily price source. Check MTGJSON's daily price file for Card Kingdom retail first; if it's not there, Card Kingdom publishes a price list feed (verify). Per-card link: `https://www.cardkingdom.com/catalog/search?filter[name]=<name>&partner=<CK_PARTNER>` (pattern confirmed live; Archidekt uses `partner=archidekt`). Whole lists: verify whether `https://www.cardkingdom.com/builder?c=` accepts a pre-filled list (one open-source app says yes); if not, keep copy-list + open builder.
- **Affiliate codes** come from config: `TCG_AFFILIATE`, `CK_PARTNER`. Empty = plain links. Every shop link `rel="noopener sponsored"`; one footer line: "Shop links may earn Deck Bench a commission." Justin applies to both programs. **Never on the owner's own purchases:** when the signed-in account is the owner or an admin, build every shop/cart link without the affiliate/partner codes (TCGplayer: "Affiliate links are not for personal use").
- **Collection value** = sum of qty × price per source, computed server-side daily with the prices, returned on `GET /api/collection` as `value:{tcg, ck, at}`; per-row `price:{tcg, ck}` and `buy:{tcg, ck}`.

## Imports (from the research)
- Archidekt and Moxfield **deck links** on paste: detect the URL, fetch the public deck server-side, turn it into the text list. Verify Archidekt's public deck endpoint and that it needs no login (I couldn't read the source that shows it).
- Archidekt **collection CSV** through the same importer as ManaBox (map its columns).
- "Open in Archidekt" on a version: copy the list in Archidekt's text format and open archidekt.com's import.

## Order
1. Card Kingdom price source + `value` + per-row prices/links (smallest, visible everywhere).
2. Value line, missing table with both shops, the two buy buttons.
3. Path cards (keep building, from what you own first; meta-deck and blank next).
4. Binder view with the overlay.
5. Deck-link and Archidekt-CSV import.
