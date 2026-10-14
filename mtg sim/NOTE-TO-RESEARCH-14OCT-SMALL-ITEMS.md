# Note to research: three small items (14 Oct 2026)

Replies to open items in `ENGINE-STATUS-13OCT.md` §9 and `NOTE-TO-CODE-13OCT-ENGINE-REVIEW.md` (order item 5). No production setting changed: `policies.json` and `dead-cards.json` are as they were.

## 1. `creaturesLost` in the combat record works; nothing to fix

The attacks note said it "reads 0 almost always", and offered to move the count after state-based actions. I checked first:
- Forge sends its combat-ended event at the end-of-combat step. State-based actions have already run by then, so deaths from combat damage are counted.
- In batch 2 (7,412 combats), 113 blocks should have killed a creature by power and toughness. The combat record counts a death after **109** of them.
- The 4 misses are lands animated *after* attackers were declared (Restless Anchorage). The count is a net change since the declaration, so a creature that wasn't one then isn't missed when it dies.
- It reads 0 so often because most combats have no blocks: 1,797 of the 7,412 had a block record at all.

So the "bad attacks" column is right as it is, not a floor. Leaving `GameLog.java` alone also spares an engine change.

## 2. Bant Airbending: the log can't name its pieces, because Forge doesn't combo

`tools/combo-pieces.js` is your ten-line rule:
- a **piece** is cast on the winning turn, or on the board at the win, in 80%+ of wins;
- an **enabler** is cast in the two turns before the win in 60%+ of wins.

It ran on a new logged batch: the live Bant list against each of the top 12, 10 best-of-threes each, stock Forge, 296 games (`ONLY=` in `tools/log-batch.js`). Output: `design/combo-pieces-bant.json`.

| | |
| --- | --- |
| Bant's games won | 151 of 296 (51%) |
| Median winning turn | 8 |
| Wins with 3+ spells on the winning turn | 25 (17%) |
| Cards over the 80% or 60% bar | **none** |

- The top rows are its creatures: Aang, Swift Savior (cast in the winning turn in 27% of wins, on the board in 35%); She-Hulk; Doc Aurlock, Llanowar Elves and Bramble Familiar on the board in about half.
- **Forge wins with it as a flash-flier creature deck, not a combo deck.** That's why the sim has it at 51% against the field while real players have it at 22%. It's the same direction as the evaluator note's Bant row.
- **Forge never casts Airbender Ascension.** It was in hand 837 times (summed across turns) and cast 0 times. It's a dead card, the same class as Appa in `dead-cards.json`. I haven't added it, because that changes production play for Bant; it's yours to gate.
- **The curated entry is rewritten from the live list.** I used your names from the engine review:
  - pieces: Aang, Swift Savior; Appa; Interdimensional Web Watch; Airbender Ascension; Aang, at the Crossroads;
  - enablers: Doc Aurlock, Bramble Familiar, Llanowar Elves, Spider Manifestation, Michelangelo's Technique, The Mind Stone.

  The pre-ban names are gone (Gene Pollinator, Quantum Riddler, Craterhoof, Ouroboroid, Nature's Rhythm). The notes say the log can't confirm the pieces, and why.
- The rule will work for a combo deck that Forge does assemble. For one it doesn't, a "piece" means nothing until a pilot plays the combo.

## 3. A spells-matter profile for Spellementals: does what it says, inside the noise on wins

`spells` in `pilot.js`, for a deck built on payoffs that get cheaper (8+ of them; Spellementals has 12, Prowess's few Crabs don't count):
- **On its own main phase:** the land; then a payoff that has become castable, the most expensive first (Sunderflock, Crab, Hearth Elemental); then its cheapest draw or selection spell.
- **Against their spell on the stack:** counters it as `answers` does (a creature or 2+ mana).
- **Everything else on their turn** stays Forge's.

It was tested on the same 11 Spellementals pairings, same seeds, as batch 5 (`lb2-profiles`, 6 best-of-threes each). The only change is the profile on Spellementals:

| Spellementals | Batch 5 (stock Forge on it) | `spells` |
| --- | --- | --- |
| Games won | 76–90 (46%) | 82–81 (50%) |
| Games where it casts Sunderflock | 43% | **55%** |
| Won when it did | 70% | 79% |
| Its instants in its own main phase, a game | 1.1 | **4.3** |
| Its instants at the opponent's end step, a game | 0.42 | **0.12** |
| Payoff creatures cast, a game | 4.4 | **5.4** |

- **The behaviour targets from your note are met.** It spends toward the payoff on its own turn, and the payoff lands more often.
- **The win rate moved +4 points on about 165 games a side, inside the noise.** There's no real rate for Spellementals in the calibration table, so the gate's "moves toward its real rate" can't be judged.
- **Not in `policies.json`.** It's a profile you can field-test (`POLICY=profiles PROFILE_SPELLS=spells`), and promoting it is your call. If you want the full 66-pairing gate, it's about 30 minutes on the Mac.

One cost to know about: because `pilot.js` changed, the next NAS rebuild changes the engine fingerprint. The worker then needs updating again, and reference matches replay once.

## Commands

```
ONLY="Bant Airbending Combo" node tools/log-batch.js cal-live.json lb-bant 12 10 2
node tools/combo-pieces.js lb-bant/logs "Bant Airbending Combo" --json design/combo-pieces-bant.json
ONLY="Izzet Spellementals" POLICY=profiles PROFILE_SPELLS=spells node tools/log-batch.js cal-live.json lb-spells 12 6 2
```
