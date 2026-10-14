# Note to research: the dead-card audit at scale (14 Oct 2026)

Replies to item 2 of `NOTE-TO-CODE-14OCT-ENGINE-ORDER.md`. The tool is now `tools/log-dead-cards.js`. The outputs are `design/dead-cards-{batch1,batch2,batch5,production}.json`.

## 1. The tool only saw instants; fixed
`castable` is read at `turn_end`, in the cleanup step, so the bridge's castable list only ever holds instant-speed cards. Under that measure, a creature, sorcery, aura or planeswalker that Forge sits on is invisible. The first pass measured 35–41 cards a batch, almost all instants.

The tool now adds a second measure, `affordable`: the seat's own turns on which the card was in hand with at least its mana value in lands. Colours aren't checked and X counts as 0, so it overcounts a little. A card's chances are the larger of the two measures. The batches now measure 156–159 cards each.

## 2. The 151 production logs are three matchups, not a sample
All 151 are Izzet Spellementals against Dimir Midrange (63), 4c Control (47) or Izzet Prowess (41). The zeros you found there are matchup facts, not deck facts:

| Card | Production | Batches 1, 2 and 5 pooled |
| --- | --- | --- |
| Dimir Midrange's Requiting Hex | 0 of 193 | 52–66% |
| Izzet Prowess's Secret Identity | 0 of 233 | — |

Requiting Hex only kills a creature of mana value 2 or less, and against Spellementals there is rarely one. **Use the batches for the coverage number, not the production logs.**

## 3. Dead at scale: batches 1, 2 and 5 pooled (3,543 games, at least 40 chances, under 10% cast)

| Deck | Card | Type | Cast / chances | Call |
| --- | --- | --- | --- | --- |
| Dimir Excruciator | Day of Black Sun | X sorcery (sweeper) | 0 / 2,380 | **Forge doesn't know it.** It never casts it, in any matchup. |
| Mono-Green Landfall | Meltstrider's Resolve | Aura | 0 / 714 | **Forge doesn't know it.** It never casts it, in any matchup. |
| Azorius Control | Countersculpt, Jace's Machinations | Instants | 4% each | Already on `dead-cards.json`. Production plays them through the `answers` profile; batches 1 and 2 ran stock Forge. |
| Jeskai Artifacts | Pinnacle Starcage | Artifact (sweeper) | 7% | Probably a correct hold: it's situational. Check its board states before ruling. |
| Dimir Excruciator | Harvester of Misery | Creature | 8% | Unclear. A 5-drop creature should be cast more than this; check the colours and the board. |

**The split is 2 Forge doesn't know, 2 already handled, 2 to check.** The counterspells in the 10–30% band (Spell Pierce, Spell Snare, Disdainful Stroke) are correct holds: `affordable` counts turns with nothing to counter.

## 4. Why the two dead cards aren't simply added to `dead-cards.json`
The `deadcards` policy casts a dead sorcery in our first main phase, unconditionally. For an X board wipe that's worse than never casting it.
- **Day of Black Sun** needs a rule: cast when the opponent has at least two more creatures with mana value X or less than we do, with X as large as the mana allows.
- **Meltstrider's Resolve** can go on the list as is, since Forge picks the creature it enchants.

Both go through your gate before production: Dimir Excruciator and Mono-Green Landfall against the top 12.

**Next, once the spells gate (item 1) is off the Mac:**
1. Write the sweeper rule.
2. Run the gate for both decks.
3. Report.

## Item 1, the spells-matter gate: passed and promoted
Run as specified: `POLICY=profiles PROFILE_SPELLS=spells`, all 66 pairings, 6 best-of-threes each. It's compared with batch 5 (the profiles without spells), on the same calibration file and seeds.

| Deck | Before | Spells | Move | Noise (2 SE) |
| --- | --- | --- | --- | --- |
| Izzet Spellementals | 46% (166) | **50%** (163) | +4.5 | ±11.0 |
| Boros Dragons | 68% | 66% | −1.9 | ±10.5 |
| Dimir Excruciator | 32% | 31% | −1.4 | ±10.7 |
| Dimir Midrange | 50% | 51% | +1.2 | ±11.1 |
| Jund Sacrifice | 47% | 46% | −1.1 | ±10.8 |
| The other seven | | | ±0.9 or less | |

- **Against its real rate:** Spellementals is 48% in real play (40–56), so it moves toward real by 2 points. It was inside the interval before and is inside it now.
- **No other deck moved more than 2 points.**
- **The mirror** (`tools/mirror-gate.js`, spells against stock, seats swapped, fixed seeds): **73% of 71 (63–84)**, a pass.
- **Promoted:** `forge-pilot/policies.json` 2.0.15 now has Izzet Spellementals → spells. The engine key becomes `2.0.15|cfaf121c/610cbfa5` with the next NAS rebuild and worker update.

**How to read this:** it's a behaviour fix more than an accuracy one. The headline move is inside the noise, but the deck now casts its payoffs the way the profile meant, which is what your behaviour targets asked for. No other deck moved, so the gate's "do no harm" condition holds.
