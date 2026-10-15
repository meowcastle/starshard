# Note to research: where the sim's misses come from (15 Oct 2026)

From the 160-game production logs (9,673 games, all 66 pairings) and the first bridge error-dial level. No new runs; the tool is `tools/log-misses.js`.

## 1. The bridge error dial, first level
At 10% of plays skipped and 10% of attackers and blockers withdrawn (both seats, any timing), 15 best-of-threes a pairing:

| | Baseline | JS dial 0.1 | Bridge dial 0.1/0.1 |
| --- | --- | --- | --- |
| Spread (sd, points) | 21.3 | 17.4 | 19.8 |
| Mean error | 16.5 | 13.1 | 15.4 |
| Inside the real range | 3 of 12 | 4 of 12 | 4 of 12 |

Levels 0.2/0.2 and 0.1/0.3 are running. Section 2 is why I don't expect either to reach the bar.

## 2. The errors belong to the decks, not the matchups
In the matchup table (sim minus real, match scale), most decks miss in the same direction against nearly every opponent.
- **Rated too high:** Boros Dragons is +23 to +45 against nearly everyone. Lifegain is +16 to +75.
- **Rated too low:** Dimir Excruciator is −19 to −75 against nearly everyone.
- **Lean the same way, against fewer decks:** Azorius Control and Izzet Prowess.

A dial that makes both seats sloppier moves every pairing toward 50%. It narrows the spread a little, but it can't lift one group while lowering the other.

By play style (`classes2.json`):

| Style | Decks and error |
| --- | --- |
| Aggro | Dragons +31, Dwarves +19 |
| Control | Azorius −22, 4c −9 |
| Tempo | Spellementals +1, Prowess −14 |
| Midrange | Lifegain +31, Dimir Midrange +18, Jeskai +7, Landfall +1, Jund −14, Excruciator −32 |

If a per-style dial (your step 3) took out each style's mean error exactly, the mean error would fall from 16.5 to about 12. The rest sits in four midrange decks, and those need deck-specific work.

## 3. The general pilot measures don't separate the decks
These rates are about the same for all 12 decks, so none of them explains the misses:
- **Kept seven:** 73–88% (except Dwarves, at 49%, which is still rated too high).
- **Missed land drops:** 0–5%.
- **Blocks left on the table:** 56–78%.
- **Threats answered the turn they land:** Azorius 92%, 4c 85%.

**Board wipes in clear spots** (they have 3+ creatures and 2+ more than us, and the wipe is affordable; cast that turn or the next):

| Deck | Wipe | Cast in clear spots |
| --- | --- | --- |
| Azorius Control | Day of Judgment | 74% |
| Dimir Excruciator | Deadly Cover-Up | 73% |
| 4c Control | Deadly Cover-Up | 49% |

The 4c number is somewhat low, but not low enough to account for its error.

**The one measure that does separate them:** the decks rated too low die holding more cards.

| Decks | Cards in hand at a loss |
| --- | --- |
| 4c Control, Dimir Excruciator | 4.3 and 4.2 |
| Azorius Control | 3.1 |
| Aggro decks | 1.6–2.7 |

What 4c and Excruciator are holding:
- **4c Control:** Jeskai Revelation (0.99 per lost game), Deadly Cover-Up, Together as One and Inevitable Defeat.
- **Dimir Excruciator:** Day of Black Sun (0.66; this run predates its X-wipe rule), Superior Spider-Man and the Excruciator itself, which fits the combo note.

## 4. Questions for you
1. Should the per-style dial be fitted (one value per style, set per seat), knowing it closes about a third of the gap at best? Or should the four midrange outliers come first? Lifegain and Dimir Midrange are rated too high, Excruciator and Jund too low.
2. Lifegain is +62 against Azorius and +75 against Excruciator, both with 15+ real matches. Do real players of the slow decks kill the lifegain engine creatures first, before they snowball? The logs don't record removal targets, so I can't tell whether Forge spends its removal on the wrong creature. If that's the likely fault, I'll add targets to the bridge log next.
3. Does `classes2.json` file Lifegain correctly under midrange? It behaves like the aggro decks here.
