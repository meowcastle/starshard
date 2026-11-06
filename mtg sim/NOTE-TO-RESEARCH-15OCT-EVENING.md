# Note to research: the Excruciator plan is live, Azorius isn't fixed by holding counter mana, and where Lifegain's and Dragons' errors come from (15 Oct, evening)

## 1. The Excruciator combo profile: promoted
The sequential test against production (deadcards) ended in H1 at round 17, after 906 games an arm.

**Results:**
- **Game rate:** 33.6% → 39.0%. The real rate is 51%, counted in matches.
- **By opponent:** up or level against 10 of 11. The biggest moves were 4c Control (61 → 87%) and Izzet Prowess (38 → 52%). Boros Dwarves went 20 → 18%, inside the noise.
- **Mirror:** clean. 33 games, median 20 turns, no stalls.

`policies.json` now has "Dimir Excruciator": "combo" (9e9c1c7). It's live on the NAS and the Mac worker. Excruciator is still well under real, so this is part of its gap, not all of it.

## 2. Azorius Control: the diagnosis, and two profiles that don't move it
**What the logs show** (the 2,437-game targets batch, 398 Azorius games):
- **Counter mana:** in 32% of the opponent's turns where Azorius held a counter (with 3+ lands), it had under two lands open. In two thirds of those turns the opponent cast a threat.
- **Where the mana went the turn before:**
  - The Theorist, Jace Beleren: 39%
  - animating Restless Anchorage: 37%
  - Map tokens: 21%
  - Pinnacle Starcage: 18%
- **Gaps in the old rule:** 'reactive' rule 3 (hold counter mana) only looked at spells, never at abilities, and production plays 'answers', which drops it altogether.
- **One worked loss to Dragons:** Countersculpt sat in hand from turn 15 while two Clarion Conquerors and a Smaug resolved, because Anchorage's animation tapped the deck out each turn. Smaug then hit for 10.
- **What isn't the problem:**
  - Win conditions: Forge turns them on, as found on 14 Oct.
  - Early damage: median life is still 13 on own turn 9 against the aggro decks.
  - Removal targeting: it hits the biggest creature 74–93% of the time.
- **Idle answers:** with a legal target in play and the mana to cast it, Seam Rip and Pinnacle Starcage sit unused about half the time.

**The 'drawgo' profile (ded93e4, on trial).** On our own turn with an empty stack, Forge chooses as usual, but a play that would leave fewer open lands than the cheapest counter in hand costs is vetoed, and the seat passes. This needed a bridge change: a delegated priority answer can now carry `veto: [ids]`. The cost of an ability is read from its label, and a land's own ability counts one more for the land itself.

Always allowed:
- lands and loyalty abilities;
- anything once the opponent's hand is empty;
- a planeswalker onto a board where the opponent has no creature.

Behaviour moved as intended: turns short of counter mana fell from 36% to 10% against Dragons in a smoke test.

**Results:**

| Version | Rounds | Production | drawgo | Verdict |
| --- | --- | --- | --- | --- |
| v1: own sweepers and removal also vetoed | 17 | 34.0% | 30.6% | H0 |
| v2: own answers never vetoed | 40 (the limit) | 32.5% | 32.6% | undecided: level over 2,104 games an arm |

**My reading:** keeping counter mana up is not what the sim's Azorius is missing. Holding mana costs about as much as it saves, because the deck then deploys Jace and its land threat later. A real Azorius player's edge must lie elsewhere. My candidates, in order:
1. **What to counter:** the logs count opponent spells that "matter" as mana value 2+ or any creature/planeswalker, and Forge counters Tablet of Discovery and Stock Up as readily as a Smaug.
2. **Removal timing:** Get Lost is often cast in our own upkeep or draw step (Forge), after the creature has already hit.
3. **Seam Rip and Starcage sitting idle.**

**Question 1:** Which of these does a strong human Azorius player do differently, in your reading of the deck? Or is the 44% real rate partly the field's misplays against a draw-go deck, which Forge on the other seat doesn't make?

## 3. Lifegain and Boros Dragons: where their errors come from
**Matchup errors** (160-game baseline, sim minus real, with real matches in brackets):

**Lifegain:**
- Concentrated against the two decks the sim underplays:
  - Excruciator: +66 (16)
  - Azorius: +52 (10)
- Against the creature and midrange decks it's close:
  - Dimir Midrange: −3 (22)
  - Landfall: +9 (18)
  - Prowess: +10 (10)
- So Lifegain needs no profile of its own. The Excruciator and Azorius fixes are its fix.

**Removal on Lifegain's creatures (your question 2 of this morning):**
- Opponents aim at them 40% of the time and remove 62%, about the field average (aimed at 40–51%, removed 44–79%).
- Haliya is aimed at 42% and removed 82%; Amalia is aimed at 57%.
- So the sim's slow decks don't spare the engine creatures. The answer to your question is no; the error lies elsewhere.

**Boros Dragons:**
- Overrated against nearly everyone, by +15 to +36 points, including well-sampled pairings:
  - Izzet Spellementals: +32 (30)
  - Mono-Green Landfall: +25 (16)
- No single card explains it. With none of its key cards on the battlefield in its first four turns, it still wins 65% of games (66% overall).
- Its creatures are answered at normal rates.
- This looks like the general effect of Forge piloting a proactive creature deck closer to perfectly than people do. That's what the per-style dial is for, not a deck profile.

**Question 2:** Agreed that Dragons (and Dwarves) go to the aggro dial, and Lifegain to nothing until the control and combo decks are re-scored?

## 4. Next on my side
- **A fresh 160-game baseline** with the Excruciator profile live. The Azorius result decides whether one is promoted first.
- **Then the per-style dial fit** against that baseline.
