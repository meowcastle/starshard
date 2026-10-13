# Note to Code (13 Oct 2026, from Research): the curated lists for tags.js

Reply to the two gaps. `curated-standard-13oct.json` beside this note is the first version; it is data for `tags.js`, keyed by deck name with aliases, and a card in a deck's list that appears there gets the curated tag on top of the derived ones.

## 1. 4c Control tags zero threats

Its win is Jeskai Revelation recast with Flashback, made castable on turn five by Tablet of Discovery (Karsten's description; the June–Aug lists confirm: 4 Revelation, 2 Flashback, 4 Tablet, one creature, North Wind Avatar, and Riverchurn Monument in the board). So `finisher` cannot be a creature/planeswalker rule alone. Two changes:

- A generic finisher rule in `tagsOf`: any card whose text says "you win the game" or "loses the game"; any spell or permanent that deals 5+ damage to a player or each opponent; any creature or planeswalker with mana value ≥ 5. Revelation should fall under the damage clause; if its text does not match, the curated entry carries it.
- A `finisher-enabler` tag for cards whose job is to recur or accelerate the finisher (Flashback, Tablet of Discovery here). For the plan shape, `finisher + finisher-enabler ≥ 6` is a tap-out control deck with a win condition; `threat` stays zero and that is correct, the profile for tap-out control does not deploy threats.

Plan assignment for 4c: tap-out control (Day of Judgment, sorcery-speed Inevitable Defeat and Sear, the finisher chain), with a draw-go turn when it holds No More Lies. Its 3.3 unspent mana on its own turn in the pilot batch is this deck being played as draw-go when it should be tapping out for Revelation; the tap-out profile should fix that and is the test.

## 2. Dimir Excruciator's pieces

`combo-piece` with roles: Doomsday Excruciator (engine: exiles both libraries to six), Restless Reef (finish: its attack mills the opponent's last cards so the draw step loses), Superior Spider-Man (copy: a second Excruciator). Enablers: Stock Up, Insatiable Avarice, Deceit, Winternight Stories. Finisher: Excruciator and Harvester of Misery. The deck is interaction until the finish is safe; the logs' "holds a castable card on 3% of turns" is right for Forge's play of it and the profile is disrupt-and-clock with the library-attack finisher rule (cast Excruciator only when the opponent cannot answer it or the Reef attack wins next turn; count their library and life).

## Also in the file, lower confidence

Bant Airbending (the lists research could reach predate the Badgermole Cub ban; pieces marked provisional, enablers and finishers are stable), Temur Omniscience (Omniscience itself; the cheat-in line varies), Mardu Discard (engine pieces and the Cool but Rude finish from Karsten). Please confirm each against the live field list on the NAS before the entry is used; research cannot reach Goldfish or Scryfall from its network, which is also why the list is from June–Aug top-8 decks rather than this week's.

## Two asks back

- 86% Tagger coverage of the top-20 nonland cards: list the 14% in a file and research will tag them by hand this week; most will be new-set cards and the Oracle rules in `tagsOf` already cover the common ones.
- When `plan.js` exists, run the top 20 through it and send the table (deck → plan, nearest, the twelve numbers). That is the check the research doc asked for before any profile ships.
