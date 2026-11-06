# Note to Code (13 Oct 2026): what Design changed on Brewer v4

Design works on the thread's canvas; `project/Brewer-v4.dc.html` there is your `public/index.html` of 13 Oct 14:02 (after items 3 and 4) plus the patch below. Review boards on the canvas show each change before and after.

## Patch 1 · canvas fixtures hook (inert in production)
- `data-props` gains `fixtures` (boolean tweak, default true on the canvas).
- `api()` first tries `./fixtures.json` when the tweak is on or the page runs off-origin; GETs answered by exact path (or a `/*` wildcard key), `/api/login` and `/api/logout` resolve to `{}`. Production never carries the file, so the hook never fires there.

## Patch 2 · run target as a segmented control
- Markup: the `runOpen` panel's three cards become a pill row (`oppSets` loop) with the selected option's `detail` and `time` under it; footer line and Queue button unchanged.
- Bindings added on each `oppSets` item in `setsOf()`: `sel` (boolean), `ink` (text colour, `#0C0C0B` when selected else `#EDEBE6`), `opacity` (`1`, or `0.4` when `!o.available`).

## Patch 3 · the method object bound (this unbinds `runNote`'s method text)
- Status line gains ` · {{ methodLabel }}` link (`toggleMethod`), gated by `hasMethod`; under it a panel gated by `methodOpen` listing `methodRows` (`{k, v}`), six rows: Engine, Games, Field, Calibration, Shown as, Card stats, built from `run.method` the way your `methodS()` builds the sentence.
- State: `methodOpen: false`. renderVals: `hasMethod`, `methodOpen`, `methodLabel`, `toggleMethod`, `methodRows`.
- Removed: the `<details>` "How these numbers were made" at the foot of Results. `runNote` is still computed; you can drop the `methodS(run)` suffix from it now (it was the only reader) and keep the first part if anything else binds it.

## Patch 4 · Results as one Stat and four sections of rows (change 3; board `Results-before-after`)
- Header: the eyebrow and the sentence stay as the one Stat. Under it one line of qualifiers: `evSpan` (field win-rate range, "48–56%"), `evTop8` ("about 1 in 13 (likely 1 in 19 to 1 in 9)", gated by `hasEvent`), `benchName` + `benchPct` ("51 of 100") + the existing `evSure`/`evSureColor` chip text (gated by `hasEvBench`). The fidelity note is one line with its dot, no amber box.
- Removed from markup: the tournament card (`evOdds`, `evRecord`, `evOddsLo`, `evOddsHi`, `evScale`, `evRounds` as a heading, `evNeed`), the share-of-field strip and its legend (`evStrip`, `evLosses`, "Not played, counted as even"), the two sentences `evVs` and `evSureNote`. All still computed; list them as unbound or drop them.
- Matchups: rows are now `<a onClick="{{ g.toggle }}">` with a share column first. New fields on each `oppRows` item: `share` (metaPct, or `E.rest` on the Everything-else row), `shareW` (share / largest share × 100, as a string), `shareS` ("8.4%"), `shareFill` (`#4a4a48`, hatched gradient for Everything else), `isRest`, `open` (boolean), `chevron` ("▸"/"▾"), `toggle` (handler), `detail` (`[{k, v}]`: Games, Field, Earlier runs, Play / draw, Calibration, The #1 deck, Forge, Owner — only the ones with a value). The old `flag` tooltip is unbound; its parts are the `detail` rows. `art`, `artBg`, `artVis` are unbound (thumbnails dropped from the table).
- State: `oppOpen: null` (the open row's opponent name; one open at a time).
- `evTableNote` now says "Open a row…" instead of "Hover a row…".
- Levers: same `levers` fields, rows with dividers instead of bordered cards.
- The fixtures run (37072616) has no `method` object, so `hasMethod` is false on the canvas; a redeploy plus `node tools/fixtures.js` will light the link.

## Patch 5 · Deck is the list (change 4; board `Deck-before-after`)
- The four stat tiles become one line: `deckSize` + `deckLegal`, new `forgeLine` ("every card in Forge" / "N cards not in Forge, skipped", coloured by `forgeColor`), `playsOn` + `playsNote`, the Goal (gated by `hasGoals`), and the `openLook` link (gated by `notEditingLook`). The Name-and-cover block (`editingLook`) sits directly under that line.
- `versionRows` moves from the Results tab to the Deck tab, one row per version (version, date, what changed, results with `r.pick`, `x.rerun`); under it the `goNewVersion` link and a new `goCompare` link gated by new `canCompare` (1v1 and 2+ versions). `goCompare` sets `tab: 'results', view: 'compare'`.
- Results toggle is now "This run · Compare": the Versions button and the `viewVersions` block are gone from markup. `viewRun` is true for `view === 'run' || 'versions'` so a stale state renders the run; `viewVersions` is always false. Unbound: `setViewVersions`, `viewVersionsColor`, `viewVersionsBg`, `forgeCount`, `forgeNote`.
- The list: `mainRows` and `sideRows` are sorted non-lands first by `cmc` (then qty desc, then name), lands last; each row gains `cmcS` ("3", "land", "" when unknown) shown at the row's right edge after the pips, and `divider` (the row's top border colour: `rgba(255,255,255,.16)` where the mana value or land-ness changes, `.06` otherwise). Main takes 1.5fr, the sideboard column 1fr; Sideboard plans, Considering and the delete link are unchanged in that column.

## Patch 6 · tokens (change 5; board `Tokens`, repo page `SIM-TOKENS.md`)
- A `:root` block at the top of the artboard's `<style>` declares 11 colours (`--bg --surface --track --mark --ink --ink-2 --muted --accent --win --loss --amber`), two hairlines (`--line` 8%, `--line-strong` 12%), six sizes (`--fs-xs` 12 … `--fs-xxl` 34) and `--mono`.
- Every inline `font-size`, `font-family:'JetBrains Mono'`, hex colour and white-alpha rule in the markup now reads a variable; so do the script constants `WIN LOSS MUTED ACC AMBER`, the `CHIP` table, `rng()`/`rngS()` colours and the hatch gradients. `MANA` and `SEAT` stay literal.
- #5C5B56 is no longer used for text anywhere (it was 2.9:1); those become `--muted`. As a dot, border or bar it is `--mark`.
- Sizes folded: 10/10.5/11 → `--fs-xs`; 14 → `--fs-s`; 28 → `--fs-xl`.
- To wire: copy the `:root` block into `public/index.html` and apply the same substitutions; the list is in `SIM-TOKENS.md`. No binding changes.

## Asks
- Regenerate `bindings.md` after you wire these so `method` leaves "computed but not bound".
- Confirm `o.available` is the right field for the pod option (used for the dimmed state).
- The two colour dots in the brew header: what do they encode? If they are the deck's colours, a `title` attribute with the colour names is enough; otherwise Design will drop them.
