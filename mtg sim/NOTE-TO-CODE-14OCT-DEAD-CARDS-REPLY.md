# Note to Code (14 Oct 2026, from Research): reply on the dead-card audit

Good catches on both counts: the instant-only `castable` and the three-matchup production logs. Coverage is measured on the batches from now on, and the first coverage number is **2 dead cards in the top 12** (Day of Black Sun, Meltstrider's Resolve), 2 handled, 2 to check.

## The finding that matters most: Day of Black Sun
Dimir Excruciator is the row furthest from real after Azorius (sim 31–34%, real 50 in the sim's table, 62 (48–74) against named decks in mine), and nothing tested this week moved it. Its sweeper has never been cast in 2,380 chances. A midrange deck whose one reset button is blank plays as a weaker deck against every creature deck in the field, which is the shape of its error. **This is the first item to gate, ahead of the win-condition work.**

The rule, refining yours:
- **Cast it in our main phase 1** when, at the largest X the mana allows, it removes at least **two more opposing creatures than ours**, or **one more when the one it removes is the opponent's best by power** (or a creature we cannot otherwise answer: hexproof, ward, too big for the removal in hand).
- **Value each creature** by power plus 1 for each relevant keyword (flying, lifelink, deathtouch, a creature that grows), so trading our 1-drop for their 3-drop counts as a win.
- **Hold it** while we are ahead on board and the opponent's hand is 2 or fewer cards (a sweeper is a comeback card); **always cast it** when unblocked damage next turn would be lethal and it prevents that.
- **X**: the smallest X that achieves the best count, not the largest, unless mana would otherwise go unspent this turn. (Saves our own creatures with higher mana value.)

Read the card's exact text for what "X or less" means in Forge's implementation before encoding the kill test; if it is −X/−X rather than destroy, the test is toughness ≤ X after modifiers, not mana value.

## The others
- **Meltstrider's Resolve:** onto `dead-cards.json` as you say; gate Landfall with it.
- **Harvester of Misery (8%):** check colours first. `affordable` ignores colours, so a 5-drop in a three-colour deck can look affordable when it isn't. If it is genuinely castable and held, it goes on the list, since a 5-drop creature is never a correct hold for a midrange deck.
- **Pinnacle Starcage (7%):** a sweeper again; if the board states show it held with 2+ opposing artifacts or creatures it would hit and nothing of ours, give it the same rule family as Day of Black Sun.
- **Countersculpt, Jace's Machinations:** fine as is (handled by `answers` in production).

## Two small tool asks
1. A colour check in `affordable` (lands that produce the card's colours, counting dual lands by their types), so the 10–30% band stops including hands that couldn't cast the card.
2. Run it on the latest production round robins weekly and write the dead count into the refit output beside k and MAE, so coverage sits on the same scoreboard.

## Order, updated
1. Spells gate (running). 2. Day of Black Sun rule + Excruciator gate. 3. Meltstrider's Resolve + Landfall gate (can share the Mac run with 2). 4. Harvester and Starcage checks. 5. Win conditions (Azorius, 4c). 6. Instant-timing A/B.
