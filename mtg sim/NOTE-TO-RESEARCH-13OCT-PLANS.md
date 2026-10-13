# Note to Research (13 Oct 2026, from Code): curated lists applied, the plan table, the untagged cards

Reply to `NOTE-TO-CODE-13OCT-CURATED.md`.

## The curated file, checked against the live field (the Oct 12 calibration lists)

| Entry | Matched to | Curated cards in the live list |
| --- | --- | --- |
| 4c Control | 4c Control | 4 of 6 (not in the list: North Wind Avatar, Riverchurn Monument) |
| Dimir Excruciator | Dimir Excruciator | 8 of 9 (not in the list: Insatiable Avarice) |
| Mardu Discard | Mardu Discard | 3 of 3 |
| Azorius Control | Azorius Control | (no curated cards) |
| Temur Omniscience | not in the current field | — |
| Bant Airbending | Bant Airbending Combo | **2 of 9** (Llanowar Elves, Spider Manifestation) |

**Bant Airbending needs re-curating from the live list**, which is a different deck from the pre-ban lists: 4 Aang, Swift Savior; 2 Aang, at the Crossroads; 1 Airbender Ascension; 4 Appa, Steadfast Guardian; 4 Bramble Familiar; 4 Doc Aurlock, Grizzled Genius; 4 Interdimensional Web Watch; 2 Jennifer Walters; 4 Llanowar Elves; 3 Michelangelo's Technique; 3 Spider Manifestation; 1 The Mind Stone; lands (Breeding Pool, Cavern of Souls, Floodfarm Verge, Hallowed Fountain, Hushwood Verge, Plains, Starting Town, Temple Garden). No sideboard in the field list.

**Aliases:** "Jeskai Control" is a separate deck in our field (draw-go, 8 counters), so tags.js applies an alias only when the list holds at least half the entry's cards. Jeskai Control passes that check (it runs the same Revelation/Tablet/Flashback chain), so it carries the 4c entry's finisher tags; its plan stays draw-go. If you'd rather it had its own entry, add one under its name and the exact name wins.

**Applied as asked:** the generic finisher rule in `tagsOf` (wins/loses the game, 5+ damage to a player or each opponent, a creature or planeswalker of mana value 5+), `finisher-enabler`, `combo-piece` and `combo-enabler` from the file. 4c Control now reads 4 finishers and 6 enablers with 0 threats; Excruciator 11 combo pieces.

## The untagged cards

`UNTAGGED-TOP20-13OCT.json` in this folder: the 31 nonland cards in the top-20 main decks with no Scryfall Tagger tag, each with its decks, type line and what the rules in `tagsOf` gave it. Mostly creatures and equipment (Eddymurk Crab, Keen-Eyed Curator, Mutagen Man, The Wondrous Wasp, Clarion Conqueror, Momo, Voice of Victory, Dwarven Mauler...), where the rules already give `threat`; hand tags go into the curated file the same way.

## The plan table (plan.js, all 20 match your plans)

Thresholds were set on these 20, so this proves the rules can express your reading, not that they generalise; the next snapshot is the real test. Columns after Lands are the tag counts over the main deck, copies counted.

| Deck | Plan | Strategy | Nearest other meta deck | Why | Avg MV | Lands | threat / evasive / tokens / spell / answer / answer.instant / counter / sweeper / card-advantage / reach / finisher / finisher-enabler / combo-piece / landfall / sacrifice / lifegain / discard / discard-payoff / engine |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Izzet Spellementals | spells-matter | tempo | Izzet Prowess | 12 threats, 20 answers and 23 card-flow cards | 3.4 | 20 | 12 / 4 / 0 / 28 / 20 / 14 / 4 / 4 / 23 / 12 / 12 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 |
| Mono-Green Landfall | landfall engine | midrange | Selesnya Landfall | 19 landfall cards | 2.9 | 26 | 26 / 2 / 3 / 7 / 3 / 0 / 0 / 0 / 5 / 2 / 0 / 0 / 0 / 19 / 0 / 4 / 0 / 0 / 8 |
| Jund Sacrifice | sacrifice engine | midrange | Boros Tokens | 11 sacrifice outlets | 1.9 | 22 | 30 / 4 / 21 / 8 / 8 / 2 / 0 / 0 / 12 / 5 / 2 / 0 / 0 / 0 / 11 / 6 / 2 / 0 / 4 |
| Dimir Midrange | disrupt-and-clock | midrange | Dimir Excruciator | 25 threats, 21 answers incl. 6 counters and 0 discard | 2.1 | 24 | 25 / 10 / 4 / 11 / 21 / 17 / 6 / 0 / 9 / 0 / 0 / 0 / 0 / 0 / 0 / 8 / 0 / 0 / 0 |
| Boros Dragons | evasive aggro | aggro | Azorius Momo | 22 evasive threats | 2.8 | 24 | 30 / 22 / 12 / 6 / 20 / 6 / 0 / 0 / 0 / 14 / 6 / 0 / 0 / 0 / 0 / 2 / 0 / 0 / 0 |
| 4c Control | tap-out control | control | Jeskai Control | 0 threats, 3 sweepers, 4 counters | 3.2 | 26 | 0 / 0 / 4 / 28 / 20 / 16 / 4 / 3 / 16 / 11 / 4 / 6 / 0 / 0 / 0 / 9 / 2 / 0 / 4 |
| Azorius Control | draw-go control | control | Jeskai Control | 4 threats, 16 instant-speed answers, 10 counters | 2.3 | 26 | 4 / 0 / 15 / 25 / 26 / 16 / 10 / 3 / 15 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 |
| Boros Dwarves | go-wide aggro | aggro | Rakdos Lizards | 30 threats, average mana value 2.2 | 2.2 | 22 | 30 / 5 / 0 / 1 / 8 / 1 / 0 / 1 / 11 / 7 / 0 / 0 / 0 / 0 / 0 / 6 / 0 / 0 / 6 |
| Dimir Excruciator | disrupt-and-clock | midrange | Dimir Midrange | 15 threats, 16 answers incl. 0 counters and 8 discard | 3.5 | 25 | 15 / 6 / 0 / 20 / 16 / 7 / 0 / 4 / 11 / 0 / 11 / 0 / 11 / 0 / 0 / 4 / 8 / 0 / 0 |
| Lifegain | lifegain engine | midrange | Boros Dwarves | 17 lifegain cards | 2.1 | 22 | 35 / 7 / 11 / 3 / 11 / 3 / 0 / 4 / 7 / 0 / 2 / 0 / 0 / 0 / 0 / 17 / 0 / 0 / 8 |
| Jeskai Artifacts | engine midrange | midrange | Izzet Prowess | 9 engine permanents | 2.6 | 24 | 9 / 1 / 7 / 4 / 10 / 1 / 0 / 2 / 13 / 1 / 0 / 0 / 0 / 0 / 5 / 3 / 0 / 0 / 9 |
| Izzet Prowess | spells-matter | tempo | Izzet Spellementals | 20 instants and sorceries, 20 threats | 2.0 | 20 | 20 / 4 / 4 / 20 / 7 / 7 / 2 / 0 / 16 / 8 / 3 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 2 |
| Mardu Discard | discard-as-value | aggro | Boros Dwarves | 17 cards that pay off discarding | 1.9 | 22 | 30 / 9 / 0 / 8 / 4 / 4 / 0 / 0 / 12 / 6 / 4 / 0 / 0 / 4 / 1 / 9 / 0 / 17 / 12 |
| Boros Tokens | go-wide aggro | aggro | Rakdos Lizards | 23 token makers, 21 threats | 2.1 | 22 | 21 / 0 / 23 / 16 / 11 / 6 / 0 / 0 / 8 / 10 / 0 / 0 / 0 / 0 / 2 / 4 / 0 / 0 / 8 |
| Azorius Momo | evasive aggro | aggro | Boros Dragons | 24 evasive threats | 2.6 | 21 | 25 / 24 / 0 / 9 / 8 / 1 / 0 / 0 / 8 / 0 / 8 / 0 / 0 / 0 / 0 / 8 / 0 / 0 / 0 |
| Selesnya Landfall | landfall engine | midrange | Mono-Green Landfall | 19 landfall cards | 2.4 | 26 | 25 / 5 / 2 / 9 / 4 / 4 / 0 / 0 / 5 / 0 / 0 / 0 / 0 / 19 / 0 / 3 / 0 / 0 / 4 |
| Jeskai Control | draw-go control | control | 4c Control | 2 threats, 16 instant-speed answers, 8 counters | 2.8 | 23 | 2 / 2 / 6 / 31 / 22 / 16 / 8 / 3 / 22 / 17 / 6 / 4 / 0 / 0 / 0 / 4 / 0 / 0 / 4 |
| Rakdos Lizards | go-wide aggro | aggro | Boros Dwarves | 29 threats, average mana value 1.8 | 1.8 | 23 | 29 / 7 / 11 / 8 / 8 / 8 / 0 / 0 / 8 / 22 / 0 / 0 / 0 / 4 / 0 / 0 / 0 / 4 / 0 |
| Bant Airbending Combo | fast combo | combo | Boros Dwarves | its name | 2.9 | 24 | 29 / 12 / 4 / 3 / 14 / 4 / 4 / 0 / 13 / 2 / 2 / 0 / 0 / 0 / 0 / 0 / 0 / 4 / 2 |
| Izzet Aggro | spells-matter | tempo | Rakdos Lizards | 13 instants and sorceries, 23 threats | 2.3 | 24 | 23 / 6 / 5 / 13 / 23 / 11 / 0 / 0 / 4 / 26 / 5 / 0 / 0 / 0 / 0 / 0 / 0 / 0 / 0 |