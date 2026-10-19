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

## 4. Next
1. Smaug: removal targeting while it's in play, and its trigger's damage per attack vs the Treasure count.
2. Jund: its own sacrifice decisions (what it sacrifices, when, and to which outlet), since removal isn't the leak.
3. The overlap rule in §2 before any further dial work, so the bar measures the decks we actually play.
