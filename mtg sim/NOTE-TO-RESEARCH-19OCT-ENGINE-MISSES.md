# Note to Research: the dial fit, measured, and where the misses come from (19 Oct)

## 1. The per-style dial fit doesn't reach the bar
Batches (scratchpad `eng/`): `lb-160b` baseline, `dA` (aggro 0.2), `dB` (aggro 0.2, midrange 0.1), `dC` (aggro 0.05, midrange 0.225: the fit's best from A and B). 66 pairings each, 15 best-of-threes, profiles pilot, against `cal-live.json` (1,103 real matches).

| | baseline | fit's prediction | measured (dC) | bar |
|---|---|---|---|---|
| mean deck error | 15.2 | 8.3 | **12.9** | 4 |
| sim spread | 19.8 | 13.1 | **17.0** | 4 |
| inside real 95% range | 3/12 | | 4/12 | |

The linear model overstated the gain; refitting with dC moves its best to aggro 0.175 / midrange 0.225 at a predicted 9.8, which I don't trust either. Real deck spread is still indistinguishable from noise (sd 3.5 observed, 4.1 from noise), so the bar effectively asks the sim to put every top deck near 50%. One dial per style can't: the large misses are deck-specific (dC: Boros Dragons +35, Jund Sacrifice −23, Dimir Excruciator −22, Boros Dwarves +21).

## 2. A real-side problem: four decks are compared against different decks
Real decks are filed under the nearest field list at overlap ≥ 0.30 (`realdata.js` MATCH_AT). Measured on the local event cache (36 Melee events + 23 MTGO files), median overlap of the real decks filed under each:

- Loose (most real "X" decks are other builds): **Lifegain 0.41, Izzet Prowess 0.38, Boros Dwarves 0.35, 4c Control 0.35**
- Close: Dimir Midrange 0.65, Jund Sacrifice 0.65, Azorius Control 0.64, Boros Dragons 0.62, Mono-Green 0.62, Izzet Spellementals 0.61

For the loose four, the "real rate" isn't the rate of the list the sim plays, so their error isn't an engine measurement. Proposal: score the bar per deck only on real decks with overlap ≥ 0.55 (or weight by overlap), and report how many real matches that leaves. It will shrink the real sample; that's the honest size of it.

## 3. Boros Dragons (+30 to +35) and Jund Sacrifice (−15 to −23) are real engine misses
Real close builds: Dragons 43% (46 matches), Jund 53% (49). Checked and ruled out:
- **Held removal.** Turns ending with the removal in hand, the mana untapped and a fitting target: Jund Requiting Hex 4%, Deadly Precision 2%, Izzet Impractical Joke 3%, Burst Lightning 1–2% (`tools/log-idle-removal.js`). The low cast rates in `log-dead-cards` are no target, not passivity.
- **Counters left up against the dragons.** Of 639 Dragons threats (MV 3+) against Azorius Control, the opponent held a counter for 337 but had the mana free for 68, 53 without Voice of Victory out (`tools/log-counters-held.js`). Not the main cause.

What the logs do show:
- Dragons over-performs against nearly every deck (+16 to +32 by matchup), not one.
- **Smaug the Magnificent cast by game turn 8** takes Dragons from 67%→100% vs Excruciator, 71%→98% vs Prowess, 58%→84% vs Spellementals, 51%→76% vs Mono-Green (`tools/log-card-impact.js`). Opponents aim at Smaug in 41% of casts and it survives 2.4 turn starts on average. The next check is whether opponents' removal is going elsewhere while Smaug is on the board (log-targets "at the biggest" is 81% overall), and whether Forge resolves Smaug's attack trigger correctly.
- Izzet Spellementals spends 66% of its counters on non-threats (Stock Up, Esper Origins, Jace's Machinations) and 33% on creatures and planeswalkers.

## 4. Second pass (19 Oct afternoon): three more candidates ruled out for Dragons, and Jund is the same miss
- **Smaug's script is right.** Forge's `smaug_the_magnificent.txt` matches the Oracle text (flying, haste, attack trigger = Treasures you control, upkeep Treasure). Its trigger hits the player 81% of the time at a mean 1.6 Treasures.
- **Opponents do aim at Smaug when they can kill it.** `tools/log-threat-answers.js` (removal table from the card texts: what kills a 4/3 flier with the lands on hand). Of 457 opponent turns with Smaug in play, the opponent held a castable answer in only 52. When they held one they mostly fired it at Smaug (4c Control 50%, Spellementals 89%, Dimir Midrange 83%). The only real waste is 4c Control holding Inevitable Defeat (10 turns). Removal at Dragons creatures is spread evenly across its eight creatures (Momo 16%, Sarkhan 16%, Smaug 15%, ...). Every Dragons threat cast early lifts its win rate (Smaug +20, Magmatic Hellkite +14, Sarkhan +13 points); no single card stands out as broken.
- **Sideboarding doesn't explain it.** The calibration batches never sideboarded: the lists have no sideboards, and the bridge only boards a seat that owns `sideboard`. Live runs and the server's own round robin do board (separate post-board games). `tools/log-batch.js` now takes `BOARD=1 SIDES=<history.json>`: each deck gets the newest benchmark list's 15, plans come from `sideboard.js` with the real-pilot hint, and games 2-3 play boarded. Also fixed `pilot.js` applying the plan twice before game 3. Dragons-only batch `eng/dD-board` (same settings as dC):

| | unboarded (dC) | boarded (dD) | real games |
|---|---|---|---|
| Boros Dragons, all 11 opponents | 293-105, 74% | 294-94, 76% | 57-69, 45% |

  Per opponent, boarding moves nothing outside noise.
- **Self-inflicted life loss** (shocklands, Starting Town) is 0-2.4 life a game for every deck. Not a lever.
- **Missed lethal for Jund** (free sacrifices with Biotech/Sackville out) occurs in 5 of 400 games. Not the leak.
- **Mulligans** are normal once Leyline Axe on the battlefield is counted (Dwarves 22%).

Jund's gap sits in its two Boros aggro matchups: vs Dragons 2-29 in the sim, 7-9 real; vs Dwarves 3-30 (no real games). Against the rest Jund is within noise of real except Spellementals and Dimir Midrange. So Jund's -20 and Dragons' +30 are largely one miss: **the sim's proactive Boros decks beat everything far more than real ones do**, and it isn't removal aim, sideboarding, the cards' scripts or mulligans.

What's left, in order of how testable it is:
1. **Blocks and races against fliers.** Forge's AI choices when it's behind against evasive threats: chump or race, holding back attackers. Next: per game, the opponent's attacks while Dragons has a flier out, and its life at the point it stops attacking.
2. **The real Dragons rate.** 126 real games, 45%. The sample is small per opponent (3-30 games), but 45% overall is solid (±9). Pilots of real Dragons may be weaker than the list suggests; that isn't something the engine can fix.
3. **Boarded calibration for the bar.** Since live runs board, the scoreboard batches should too (`BOARD=1`), so the bar measures what players see. It costs one plan call per pairing, once (cached).

## 5. Next
1. Smaug: removal targeting while it's in play, and its trigger's damage per attack vs the Treasure count.
2. Jund: its own sacrifice decisions (what it sacrifices, when, and to which outlet), since removal isn't the leak.
3. The overlap rule in §2 before any further dial work, so the bar measures the decks we actually play.

## 6. Third pass (23 Oct): blocks and races against fliers are ruled out
`tools/log-race.js` reads every opponent turn that starts with the deck holding a flier (power 2+) the opponent can't block, on batches dC and dB (398 and 414 Dragons games):
- **Opponents mostly have no board to race with.** 418 creatures able to attack over 1,127 such turns (0.37 a turn); most of those turns are the control decks, which have no creatures at all.
- **Holding back is real but small.** Of creatures that could attack with nothing able to kill them and couldn't block anything next turn (no flying or reach, every Dragons attacker flies), 28% stayed home (dB: 18%). That's 0.17 power a turn across all opponents (dB: 0.06); the worst are Lifegain 0.66, Jeskai 0.56, Jund 0.42 power a turn. A few points of damage a game at most, nowhere near +30.
- **Blocks are sound.** 42% of opponents' blocks against Dragons are chumps, but 59 of 71 were against an attack that was lethal unblocked; 12 weren't.
- The same counts for Lifegain and Dimir Midrange (also over-strong) show the same small numbers (0.03-0.05 power held a turn by their opponents).

So the opponent AI doesn't lose to Dragons by failing to race or by blocking badly. With this, the Dragons list in §3-4 (removal aim, counters held, Smaug's script, sideboarding, self life loss, mulligans, missed lethal) and races are all ruled out. Next on our side: the overlap rule (§2), so the bar stops scoring four decks against real decks that are mostly other builds.
