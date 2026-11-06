# Note to Code: change 19, the list and the door (16 Oct)

From Research + Design. Patch: `design/incoming/patches/patch_v4_list.py`, after change 18 (order: voice, change15, polish, motion, table, list). Idempotent, marker `data-change19`.

## What it draws
1. **Deck list grouped by type.** Creatures · Planeswalkers · Battles · Instants · Sorceries · Enchantments · Artifacts · Lands, each with its count, cards in curve order inside each group. The note reads "by type, then curve". If a row has no `type`, the whole list falls back to today's curve order, so it's safe to ship before the server change.
2. **Buy this list** on the Deck tab, under the sideboard guide. TCGplayer opens Mass Entry with the list filled in (`/massentry?productline=Magic&c=4 Card||3 Card`). Card Kingdom copies the list to the clipboard and opens their builder (they have no URL that takes a list). The note says the sim takes nothing from them yet; when an affiliate code exists, add it to the TCGplayer URL and change the note. Allowed under the Fan Content Policy as sponsorship, since nothing is gated.
3. **Sign-in with sign-up closed.** The page reads `GET /api/public` → `{signup: bool}` at load. Closed: "Sign-up is closed while the sim is calibrated. Members sign in below." and the "Make an account" path hides. Open: as before.

## Server work
- `rows[].type`: the card's type line (or just the first type word) on every row the check returns and every saved version. Forge's card data has it. One field.
- `GET /api/public` → `{ signup: SIM_SIGNUP === 'open', forge: version }`. No auth.

Tested on the canvas fixtures (types added by hand there for the Squall list, so the grouping shows; the real ones come from Forge).
