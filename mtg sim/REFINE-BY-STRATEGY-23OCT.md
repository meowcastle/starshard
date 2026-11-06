# Refine by strategy: the sim does what the W/B Final Fantasy thread did (23 Oct 2026, revised)

The reference is the project chat "W/B Final Fantasy deck optimization for Standard" and its doc "Standard Meta Report & Squall Deck Strategy (Oct 2026)". The method is summarised in `design/incoming/WB-FF-THREAD.md`. Justin's brief, from that thread: "Think about my deck as its own meta deck, not copying the others. What is its strategy, and how can we refine that strategy for optimal play. This is the sim's best use case at its core, and it still falls short of that." Board: "refine by strategy" on the canvas (far left), file `design/DESIGN-REFINE-23OCT.html`.

## The gap
**Today the sim works shell-first:** find the nearest meta deck ("closest to Lifegain, 62% of its core"), compare the curve and mix, and suggest that deck's cards. For a brew this pulls the list toward the meta deck, and it can only ever suggest cards the meta list already plays.
**The thread works strategy-first.** It names what the deck is trying to do, lists what stops that from working, and searches all of Standard for the best answer to each. Then it tests on the matchups where the change shows, and ends with sideboard plans and a matchup book used at the table. Meta decks are the opponents, never the template.

## The seven steps (each a screen on the board)
1. **Why the field wins.** For each field deck: share, 30-day win rate, core 4-ofs, how it wins. Plus the five patterns that explain the field. *Have:* the weekly field pull. *Add:* "how it wins" and core cards per deck (from its lists), and real matchup rates for the brew's closest cousin.
2. **The deck as its own archetype.** A role table, the curve, the problems those cause, and the strategy named in two sentences. Also its engine (locked) and its piloting rules (attack alone, Cloud picks the plan, keep 1 mana up for protection).
   - **The coach drafts it and the player steers it in their own words.** It's versioned: the thread went Champion and Choir → Equipped Champion → Voltron toolbox, each time because Justin pushed.
   - The coach answers honestly when a steer is risky, as msg 411 did: "that's the shape that lost to Dimir, here's the trade-off, test it on Dimir and Mono-Green."
3. **Obstacles → answers.** The jobs are phrased as *what stops the win condition*: big blockers, targeted removal, racing, fliers, wipes, running out of cards.
   - For each obstacle, the best cards in all of Standard (in the deck's colours plus colourless), ranked owned first, then fit to the strategy, then price.
   - It also says who delivers the answer. For Squall that's "Cloud fetches it vs X".
   - Rules text is read exactly: Sheltered by Ghosts gives lifelink and ward, not flying; Erode feeds Mono-Green's landfall; Confidant vs Haliya draw conditions.
4. **Refine.** Swaps with one reason each, grouped by obstacle, into the Save sheet. Nothing changes until the player saves.
5. **Test where the change shows.** A/B against the previous version on the same shuffles, first against the two matchups that decide it, then the whole field. Three things come back with the result:
   - **Strategy stats** for this deck: the turn the champion first attacks alone, how often it survives the first removal spell, lifegain triggers per turn.
   - **A reason tagged on every loss:** champion never attacked, removed with no protection up, flooded or screwed, died to fliers.
   - **Ranges,** not single numbers.
6. **Sideboard and game plans.** Ins and outs per matchup, how to play it, and what the tutor fetches. The results write the Plan page.
7. **At the table.** The matchup book on the phone. The Table tab knows the opponent you picked and shows their entry: "R/B on turn 2 → Cloud grabs Basilisk Collar, because…"

## The engine requirement this exposes
The thread's report says it plainly: Forge's AI attacks with everything and spends protection early, so it plays an "attack alone, hold protection" deck badly. Until the pilot follows the strategy's piloting rules, the sim tests a different deck. So step 2's piloting rules must become pilot settings for the brew's side:
- **attack-alone** (Squall-style lone attacker),
- **hold N mana for protection when the champion is equipped**,
- **tutor choice by opponent** (Cloud's fetch table from step 6).

This sits in the per-deck profile work from the 13 Oct archetype research, as a profile the player's strategy generates. It's checked the usual way: does it beat stock Forge in the mirror on fixed seeds.

## For Code, in order
1. `deck.strategy` with these fields, drafted by the coach with its card tools and editable by the player. Each save is a new strategy version.
   - `summary`, `engine[]`, `piloting[]` (structured rules: `attackAlone`, `holdProtection: {mana, when}`, `tutor: {card, byOpponent}`)
   - `obstacles[]`: `{name, answers[], deliveredBy}`
   - `weakTo[]`, `versions[]`
2. **Field context:** per field deck, `howItWins` + `core[]` (computed from its lists: cards in ≥ 4 of its last 5 lists at 3+ copies), and the closest cousin's real matchup rates from `realdata.js`.
3. **Obstacle search:** `GET /api/brews/:id/refine?obstacle=` returns candidates from `cards.js` filtered by colour identity and legality, matched by role tags and rules text. Each is scored for fit to the strategy (shared tags with the engine, the curve slot, the delivery route: e.g. equipment for a tutor deck). Owned and price come from collection and prices.
4. **Strategy stats and loss reasons** from the game logs. The leaks and threat-answer tools already parse turns. Add `championFirstSoloAttackTurn`, `championSurvivedFirstRemoval`, `lifegainTriggersPerTurn`, and a loss reason per game.
5. **The single-opponent paired run** (JOURNEY-TEST-LOOP-20OCT.md, For Code §1), used by steps 5 and 6.
6. **Pilot settings from `strategy.piloting`** for the brew's side, behind the mirror gate.
7. **Matchup book:** the Plan page per opponent (ins/outs, how to play it, tutor target, kill-on-sight), served to the Table tab for the picked opponent.

## Acceptance (from the thread)
On Justin's Squall list (WB-FF-THREAD.md, the final 60):
- Step 2 reaches a strategy he accepts as the voltron toolbox, with Squall, Aerith and Cloud as the engine.
- Step 3's top candidates include the thread's picks for each obstacle: Basilisk Collar, Orcrist, My Precious, Medic's Kitesail, Buster Sword, Enlightened Confidant.
- Step 6 reproduces the thread's ins/outs table within a card or two per matchup.
- Step 5 reports the strategy stats for the list, and the A/B against the earlier version names which matchups moved, with ranges.
