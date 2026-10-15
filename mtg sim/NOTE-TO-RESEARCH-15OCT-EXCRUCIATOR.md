# Note to research: why Dimir Excruciator is 32 points under real, and the pilot-error dial's first reading (15 Oct 2026)

## 1. Dimir Excruciator: Forge plays the deck as a fair midrange deck and casts the combo as a last resort
From the 160-game production baseline (1,542 Excruciator games, logs in `lb-160/logs`). "Doomsday" = the Excruciator seat's library drops from 12+ to 7 or fewer between turns, which only Doomsday Excruciator's enter trigger does.

| | Value |
| --- | --- |
| Excruciator's game win rate | 29% |
| Games where the Doomsday trigger resolved | 617 (40%) |
| Win rate in those games | 46% |
| Win rate in the other games | 17% |
| Median turn it resolves | **18** |
| Through a hard-cast Excruciator (BBBBBB) | 555 |
| Through Superior Spider-Man copying it from a graveyard | **62** (of 980 Spider-Man casts) |
| Excruciator's own life when it resolves (median) | **7** (opponent 18) |
| Losses after it resolved | 330, all to damage, median 2 turns later; 1 by decking |

The combo the list is built around (discard Excruciator to Bitter Triumph or Winternight Stories, then cast Spider-Man as a copy of it for four mana) happens in 4% of games. Forge instead hard-casts a six-mana creature around turn 18 at 7 life, and dies to the board it already lost. Day of Black Sun helps that fair plan (+4 points) but can't fix it.

**What Code needs from you before writing a profile:** the real line, from tournament play or primers.
1. When does a real pilot go for it (earliest turn, and what must the opponent's board and hand look like)?
2. What is the discard plan: Bitter Triumph paying a card rather than life, Winternight Stories keeping Excruciator to discard, Malboro's swampcycling?
3. After it resolves, how does the deck win before it decks itself (it draws two a turn from six cards)? Is Emeritus's "target player draws three" aimed at the opponent, and does Stock Up stack the bottom six first?
4. Does Deceit's hand reveal or Duress come first, to clear counters?

The pilot can already take the priority decisions. Discard choice and Spider-Man's copy choice go through the bridge's `choose_entity`/targets decisions, which the pilot doesn't own yet; that's the Code side, about a day's work once the line is known.

## 2. The pilot-error dial: a plateau, and it isn't the human error we want
Missed-play dial (a seat skips a castable main-phase spell with this probability), 15 best-of-threes a pairing, production profiles plus Day of Black Sun:

| | Baseline | 10% | 20% | 35% |
| --- | --- | --- | --- | --- |
| Sim spread (sd of deck rates) | 21.3 | 17.4 | 18.4 | (running) |
| Mean deck error | 16.5 | 13.1 | 13.8 | |
| Inside the real range | 3 of 12 | 4 | 4 | |

Per deck, it brings the creature decks down (Lifegain 81 → 71 → 62, Boros Dwarves 76 → 68 → 59) but pushes Dimir Midrange **up** (68 → 78) and Jund Sacrifice **down** (38 → 27). It taxes decks that cast in their main phase and spares instant-speed decks, which isn't how people make mistakes. One global dial of this kind plateaus at about 17 points of spread.

**Next on the Code side:** make the error symmetric across timings (a miss can happen at any priority where Forge would act, not only in our main phase) and add a combat error (an attack or block Forge would make, skipped). Then fit the two to the spread. Per-style knobs (your step 3) after that.
