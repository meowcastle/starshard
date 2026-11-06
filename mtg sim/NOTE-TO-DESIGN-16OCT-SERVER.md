# Note to Design: the server for changes 18–24 is built (16 Oct)

Patches 18–24 are on the page as shipped (bindings clean, the render test unchanged). The server work from SHIP-16OCT.md §2 is done. Where the server's answer differs from what a patch assumes, it's listed here, most important first.

## 1. The Arena shelf has no cards (change 20)
Arena no longer writes the card collection to Player.log: `PlayerInventory.GetPlayerCardsV3` is gone from current logs. Only the wildcards are there, in the login's `StartHook` → `InventoryInfo`. So `GET /api/collection` returns:

```
arena: { at, source: 'arena-log', cards: {}, wildcards: { common, uncommon, rare, mythic } }
```

Anything that counts owned cards on the Arena shelf will read "you own 0 of 60" and bill every rare. Please show only the wildcards on that shelf when `cards` is empty, for example "88 common · 105 uncommon · 3 rare · 2 mythic wildcards", and keep the craft bill off it. `brew.craft` and `/api/field/craft` carry paper rows only, for the same reason.

## 2. The brew check when a list has no shell (change 24)
A list sharing under 30% of every meta deck's core is checked against the rules alone (mana, legality, one-ofs, cards at 5+). Comparing it with the nearest shell gave nonsense: your Squall list against Lifegain read "cut 16 at 4 mana". In that case:
- `archetype` is `null` and `closest` names the nearest deck. `shellPct` stays.
- `curve` is `null` and `mix` is `[]`, so your grey bars and the mix column are empty.
- One `low` finding says it: "No meta deck shares more than 4% of its core with this list (closest: Lifegain), so it's checked against the rules, not a shell."

The verdict then reads "Built right." when the rules pass, which is fair. You may want a different title for the no-shell case.

Field meanings:
- `avgMv` is the shell's average, as your note line reads it. The list's own average is `mineAvgMv`, in case you want it.
- `mine` holds the list's curve, same buckets as `curve`.

## 3. Brew from your collection: the "nothing close" case (change 22)
When no shell reaches 60% of its core, the reply carries a `note`: "Your collection carries no shell above N% of its core. The cheapest to finish:". The three cheapest shells follow, marked `far: true`, each with a `why` like "you own 14 of 60; about $152 to finish". The page doesn't show `note` yet. It belongs above the rows.

Field label: `field` reads "Standard field · 20 decks", so your "Against the " prefix fits.

## 4. Optimize (change 24)
- `brew.optimize` holds `{ status, from, v, test, final, steps }`.
- Each version Optimize touches also carries `ver.optimize` as `{ status, steps, final }`.
- `steps` is one `{at, status, text}` per line. Each line also goes into the Coach thread with `kind: 'optimize'`.
- Statuses: preparing · structure · running · matchups · writing · done · failed.
- `final` is the version to play.

## 5. Logged matches and the phone (change 18)
- `/real` takes `games: [{won, onPlay, mull}]`, `mulls` and an optional `id`; the server files an id once. The service worker stamps an id on every logged match, so a replay never files twice.
- **Offline:** the service worker answers `202 {queued: true, note: 'Saved on this phone; it sends when you are back online.'}`. Today `lmSave` drops the match from view silently. Please show `note` when `queued` is set.
- **Push switches:** `account.mail.push = { runDone, digest, coach, rounds }`, defaults on, on, on, off. `PATCH /api/account {mail: {push: {...}}}` sets them. Sending is live for run finished, weekly moved and coach answered. "Between rounds" is stored but sends nothing yet.
- **Install:** `/manifest.webmanifest`, icons at 180, 192, 512 and maskable 512 (the diamond on #0C0C0B), and `/sw.js`, registered from the page head. Your Account switch's `navigator.serviceWorker.ready` now resolves.

## 6. Buy links (change 23)
`rows[].buy` is the plain TCGplayer product page (`https://www.tcgplayer.com/product/<id>`). Scryfall's `purchase_uris.tcgplayer` is Scryfall's own affiliate redirect, so I take the product page out of it. Your `AFF` constant is the only affiliate code anywhere.

`rows[].price` comes from the printing Scryfall returns, or the cheapest priced printing when that one has none. Basic lands have no price.

## 7. Also live
- `GET /api/public` returns `{signup, forge}`.
- `rows[].type` and `rows[].rarity` (lands: `land`) on every row, old versions included. Prices refresh weekly.
- `missing[]` on collection-brew and field-craft rows.
- `POST /api/brews/:id/versions` takes `{from, swaps, note, run: true}`.

## Not built
- The guide's "card choices" line saying a choice was made for the collection ("Haliya over Jecht: owned, −3.4"). The coach knows the collection and the dial now, but the guide doesn't add that line itself.
