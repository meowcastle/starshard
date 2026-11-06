# Note to Code: change 24, the brew check and "Optimize my brew" (16 Oct)

From Research + Design. This is the app's main job in one block: upload a collection, upload a deck, and be told how to make the deck competitive against the meta. Everything below the block (collection, craft, coach, runs) already exists; this is the front door that orders it.

Patch: `design/incoming/patches/patch_v4_check.py`, after change 23 (order: … brewfrom, buylinks, check). Idempotent, marker `data-change24`. Hides until `ver.check` exists.

## What it draws (top of the Deck tab)
A card with a verdict line ("The list has structural problems." / "Close to the shell, a few fixes." / "Built right."), then three columns:
1. **Curve, yours vs the shell:** bars per mana value, green yours, grey the shell's average; amber where you're 3+ cards off. Your average vs the shell's.
2. **Mix, yours vs the shell:** Creatures · Removal · Interaction · Card draw · Lands, your count against the shell's, amber when outside tolerance.
3. **What to fix first:** up to five findings, each with a fix, severity-coloured.
Then **Optimize my brew**.

## Server work

### 1. `ver.check` (computed on paste/edit, cached per version)
```
{ archetype, shellPct, lists, avgMv, curve: [n0..n7+], mix: [{k, mine, norm, tol}], findings: [{sev, text, fix}], collection }
```
- **Shell:** the archetype whose core (cards in ≥ 80% of its real lists in the Codex) overlaps the deck most, by count. `shellPct` = share of that core the deck has. `lists` = how many real lists the norms come from.
- **Curve and mix norms:** averages over those lists. Card roles come from the Codex's card tags: *removal* (destroy/exile/damage to a creature or planeswalker, −X/−X), *interaction* (counters, discard, hand attack, stax-like), *card draw* (draw, impulse, investigate), *creatures*, *lands*. Tolerances: creatures 3, removal 2, interaction 2, draw 2, lands 1.
- **Findings, in order of severity:**
  - `high`: illegal cards; fewer than 60; removal 4+ under the shell; lands 2+ off Karsten's count for the average mana value and colour requirements (use the Karsten tables the mana mode already has); a two-colour deck with no dual lands.
  - `mid`: a curve bucket 3+ off the shell; 5+ singletons in a 60 (consistency); interaction or draw 2+ under; more than 4 cards at 5+ mana outside a ramp shell.
  - `low`: 1 land off; one bucket 2 off; a card the shell never plays (Codex play rate < 5% in the archetype).
  - Each finding's `fix` names cards: the shell's picks for that role, owned ones first (the collection), with a price when not owned.
- **`collection`:** one line: "Your paper collection covers 55 of 60; the two Squall and Koth you're short cost about $41."

### 2. `POST /api/brews/:id/optimize { from }` → the brew, with `versions[].optimize = { status, steps }`
The chain, respecting `settings.budget.mode` (owned / up to $X / anything):
1. **Structure:** apply the high and mid fixes as swaps from the collection (or within budget): removal up to the shell's count, lands to Karsten, singletons consolidated to the best of each pair (by Codex win-when-cast), curve trimmed toward the shell. Save as a new version with a note listing every swap.
2. **Run** it against the week's field (top 10).
3. **Matchups:** from the run, take the two matchups costing the most top-8 odds and run the swap SPRT on the shell's picks against them (owned first). Keep what beats the noise.
4. **Write it up:** the coach's readout for the result, plus the sideboard guide. Post it to the thread, which is why the button lands on the Coach tab.
Progress shows as the usual run states; `optimize.status` ∈ preparing · structure · running · matchups · writing · done, surfaced in the Coach thread as one line each.

### 3. The collection paste accepts the binder format
Justin's binder export is Arena/Moxfield text: `1 Mind Twist (SPG) 166`, `1 Expropriate (SLD) 2396 *F*`. Parse `qty name (SET) number [*F*]`, drop set, number and foil marker, sum by name. Also accept ManaBox CSV and plain `qty name`.

## A worked example: Justin's binder (white binder main, 16 Oct)
48 cards on 40 lines. By set: Reality Fracture 23, Avatar 9, Secret Lair 5, Marvel 2, one each from Special Guests, promos, Commander Masters, commander decks, Duskmourn, Foundations Jumpstart. Standard-legal: about 35 (FRA, TLA, MSH, DSK); the Secret Lair, Commander Masters, commander-deck, Special Guests and promo cards aren't. Nearly all singletons, across white, blue, black and green.

The check's honest output for this collection is: no Standard shell has more than a handful of its core here. "Brew from your collection" should say so ("your collection carries no shell above 15% of core") and point to the cheapest shells to finish instead of pretending. The three Teyo, Lightshield Expert and two Toph are the only playsets-in-progress; the Jace, Omnath and Edgar are the strongest single cards and the Codex can say which shells play them.

Tested on the canvas with a synthetic `check` on the Squall list, at 1440 and 390.
