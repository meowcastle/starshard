# Karsten colored-source table, verified 13 Oct 2026

Source: Frank Karsten, "How Many Sources Do You Need to Consistently Cast Your Spells? A 2022 Update", TCGplayer Infinite, 8 Feb 2022.
https://www.tcgplayer.com/content/article/How-Many-Sources-Do-You-Need-to-Consistently-Cast-Your-Spells-A-2022-Update/dc23a7d2-0a16-4c0b-ad36-586fcca03ad8/
Read from the live page (tables copied from the DOM), not from memory or a secondary summary.

## The rule
A mana base "consistently" casts a card of mana value M needing N colored pips if there is at least an (89 + M)% probability of drawing at least N colored sources by turn M on the play, conditional on drawing at least M lands by that turn, after mulligans. So 90% for a one-drop, 91% for a two-drop, up to 96% for a seven-drop.

## Main table — colored sources required (60-card deck column assumes 25 lands)

| Cost | Example | 60-card | 80-card | 99-card | 40-card |
| --- | --- | --- | --- | --- | --- |
| C | Monastery Swiftspear | 14 | 19 | 19 | 9 |
| 1C | Ledger Shredder | 13 | 18 | 19 | 9 |
| 2C | Reckless Stormseeker | 12 | 16 | 18 | 8 |
| 3C | Collected Company | 10 | 15 | 16 | 7 |
| 4C | Doubling Season | 9 | 14 | 15 | 6 |
| 5C | Drowner of Hope | 9 | 12 | 14 | 6 |
| CC | Lord of Atlantis | 21 | 28 | 30 | 14 |
| 1CC | Narset, Parter of Veils | 18 | 25 | 28 | 12 |
| 2CC | Wrath of God | 16 | 23 | 26 | 11 |
| 3CC | Baneslayer Angel | 15 | 20 | 23 | 10 |
| 4CC | Primeval Titan | 13 | 19 | 22 | 9 |
| 5CC | Hullbreaker Horror | 12 | 17 | 20 | 8 |
| CCC | Goblin Chainwhirler | 23 | 32 | 36 | 16 |
| 1CCC | Cryptic Command | 21 | 29 | 33 | 14 |
| 2CCC | Garruk, Primal Hunter | 19 | 26 | 30 | 13 |
| 3CCC | Massacre Wurm | 17 | 24 | 28 | 11 |
| 4CCC | Nyxbloom Ancient | 16 | 22 | 26 | 10 |
| CCCC | Dawn Elemental | 24 | 34 | 39 | 17 |
| 1CCCC | Unnatural Growth | 22 | 31 | 36 | 15 |

## 60-card deck by land count

| Cost | 20 lands | 25 lands | 30 lands |
| --- | --- | --- | --- |
| C | 12 | 14 | 15 |
| 1C | 11 | 13 | 14 |
| 2C | 10 | 12 | 13 |
| 3C | 9 | 10 | 12 |
| 4C | 8 | 9 | 11 |
| 5C | 7 | 9 | 10 |
| CC | 18 | 21 | 23 |
| 1CC | 15 | 18 | 21 |
| 2CC | 13 | 16 | 19 |
| 3CC | 12 | 15 | 17 |
| 4CC | 11 | 13 | 16 |
| 5CC | 10 | 12 | 15 |
| CCC | 19 | 23 | 27 |
| 1CCC | 17 | 21 | 24 |
| 2CCC | 15 | 19 | 22 |
| 3CCC | 14 | 17 | 20 |
| 4CCC | 12 | 16 | 19 |
| CCCC | 20 | 24 | 29 |
| 1CCCC | 18 | 22 | 26 |

## Counting rules from the article
- For a one-drop, only untapped sources count (Fabled Passage, Temples, slow lands do not help turn 1).
- Land/spell MDFCs: non-mythic (e.g. Bala Ged Recovery) count as about 0.40 of a land for land count; the back side counts as a colored source per the article's guidance (treat the front as a spell).
- Spell MDFCs castable both ways (Esika): design the mana base for both faces.
- One-shot Treasure generators (Prosperous Innkeeper): about one quarter of a source of any color, for spells of mana value 3+.

## Check of Code's functional-deck examples
- Three numbers in RESEARCH-STANDARD-PLAYER-12OCT.md (13 for a single pip on turn 2, 21 for CC on turn 2, 23 for CCC on turn 3, 14 untapped for a one-drop): confirmed.
- Magmatic Hellkite is {2}{R}{R} (mana value 4): the 2CC row, 16 red sources at 25 lands. Code's "wants 16" is correct. At 20 lands it would be 13, at 30 lands 19, so the check should pick the column by the deck's land count, not assume 25.
- Interpolate for 21–24 and 26–29 lands; Karsten only prints 20/25/30.
