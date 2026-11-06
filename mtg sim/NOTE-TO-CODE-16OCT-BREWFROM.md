# Note to Code: change 22, the collection as a brewing input (16 Oct)

From Research + Design. Justin's rule: the sim is a paper tool whose core is brewing competitive decks; the collection is an input to brewing, never a collection manager. Three things follow, plus the one he asked for: the sim should read a collection and suggest strong brews from it.

Patch: `design/incoming/patches/patch_v4_brewfrom.py`, after change 21 (order: voice, change15, polish, motion, table, list, craft, paper, brewfrom). Idempotent, marker `data-change22`.

## A. The Cards dial (coach settings)
`settings.budget` gains `mode: 'owned' | 'usd' | 'any'` and `usd` (number, when mode is usd). The wildcard boxes stay, relabelled "Arena practice".
- **Owned only:** the coach and the swap test pick only from the paper collection. A card outside it that is worth real points still gets mentioned, with its price: "Jecht is worth 3.4 over Haliya. $9.80."
- **Up to $X:** owned cards first; a card outside the collection is suggested only when it is worth points outside the noise and the running bill stays under X.
- **Anything** (default): today's behaviour.
Server: the coach prompt gets the mode, the collection (names and counts) and prices; the swap SPRT's candidate list is filtered by mode. The guide's "card choices" should say when a choice was made for the collection ("Haliya over Jecht: owned, −3.4").

## B. Account: the paper collection
`POST /api/collection/paper { text }` → `{ at, source, cards }`. Accept ManaBox CSV (`Name,Set,Quantity`, more columns ignored), Moxfield CSV (`Count,Name,…`), and plain "4 Card Name" lines; sum printings by name; ignore tokens and art cards. Replace, don't merge. `GET /api/collection` returns both shelves (change 20). The Arena shelf is labelled "Arena (practice)" everywhere now: its only job is "what to craft to practice this list".

## C. Brew from your collection
`GET /api/collection/brews` → `{ field, at, rows: [{ id, name, kind: 'meta' | 'brew', why, owned, size, core, usd, p, lo, hi, brew }] }` and `POST /api/collection/brews/:id/start` → the new brew (version pasted, run queued, `settings.budget.mode = 'owned'`).

How to make the rows, honestly (the sim can't invent decks from nothing; it can fill shells and test them):
1. **Meta shells.** For each archetype in the week's field, the Codex already knows the core (cards in ≥ 80% of lists) and the flex slots (the rest, with play rates). `core` = share of core cards owned by count. Fill every flex slot from the collection: owned cards of the same type and colour within ±1 mana value, ranked by Codex play rate in that archetype, else the most-played list's card. `owned/size` and `usd` follow. Keep archetypes with core ≥ 60%; sort by usd ascending, then core.
2. **Brews around strong owned cards.** Take the player's owned cards with the highest Codex win-rate-when-cast across the field's runs (min 4 copies for a creature or spell, min 2 for a planeswalker). For each, find the archetype shell it is most played in; if that shell isn't already a row, build the list as in 1 with that card forced in. `kind: 'brew'`, `why` names the cards. Cap at 3.
3. **p / lo / hi** come only from a run: the rows start unrun ("—, not run"); "Start this brew" creates the brew and queues it, and `brew` links back so the row reads "Open" afterwards. Don't pre-run the suggestions; it would cost a top-10 run each and most won't be started.
4. Recompute weekly with the field; cache per collection hash.

`why` is one line in the voice guide's register: "4 Squall, 3 Aerith, 2 Ajani and 23 lands you own; the shell that won 3 in 4 vs Jund in your runs".

## Where it shows
- Decks list: "+ brew from my collection" (phones: in the slide-over).
- First-run page: "No list yet? Brew from your collection."
- The screen: deck · owned bar with core % · to finish ($) · vs field (once run) · Start this brew / Open.

Tested on the canvas with synthetic rows and a synthetic paper collection, at 1440 and 390.
