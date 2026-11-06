# Note to Code (13 Oct 2026, overnight, from Research): instant timing, the Spellementals cut that turned out to be everyone's

The Q2 ask was to cut the cast log for Spellementals: what its counters hit and when its burn went. `design/incoming/tools/log-spells.js` does that (same shape as `log-stats.js`; `--deck` for one deck's cards and what each response answered). Run on the 67 benchmark games on the Mac (Spellementals in every game, profiles on, 35–32 for it), the counters are fine and the burn is not; and the burn finding is not about Spellementals.

## The finding: 40% of its instants are cast at the first window of a turn, unprovoked

Where an instant was cast, as a share of that deck's instants (empty stack unless "in response"):

| deck | instants | **early** (own or opp upkeep/draw) | in response | own main | own combat | opp main | opp combat | opp end step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Izzet Spellementals | 504 | **40%** | 20% | 14% | 4% | 4% | 7% | 10% |
| Izzet Prowess | 95 | **46%** | 12% | 8% | 3% | 7% | 5% | 16% |
| Dimir Midrange | 193 | **27%** | 19% | 24% | 8% | 10% | 6% | 5% |
| 4c Control (tapout profile) | 168 | 19% | 10% | 59% | 0% | 0% | 0% | 13% |

By card, Spellementals: Burst Lightning 43% in its own upkeep or draw step, 20% at the opponent's end step; Prismari Charm 35% / 20%; Opt **49% in the opponent's upkeep**, 0% at their end step; Eddymurk Crab (flash) 19% in the opponent's upkeep, 19% in their combat, 0% at their end step; Vibrant Outburst 63% own upkeep. Spell Snare and Get Out are 100% responses with sensible targets (Consult the Star Charts, Slickshot Show-Off, North Wind Avatar).

What a person does: an unprovoked instant in your own upkeep is nearly unheard of (you have not drawn yet, and the main phase gives the same effect with more information); an unprovoked instant in the opponent's upkeep spends the mana before seeing their turn, which is the opposite of what holding an instant is for; the opponent's end step is where held mana gets used. Reasonable targets from how good players sequence: **early under 5%** (from 40), **opponent's end step the largest opponent-turn window** (above 35% of opponent-turn casts; 10 of 35 here), a flash creature in the opponent's upkeep **0%**.

So this is the next pilot rule, and it is a universal one, not a Spellementals profile: it touches every deck with instants (Prowess 46%, Dimir 27%; the 4c tapout profile already has it mostly right because its rules say main phase).

## The rule: instant timing (all seats, every profile)

Applies to a cast the engine wants to make with an empty stack.

1. **Own turn.** Never in upkeep or draw. Burn or removal in main phase 1 only when it changes combat this turn (clears a blocker, or kills a creature that would block); otherwise main phase 2 or hold. A cantrip in main phase 1 when a land drop is still missing or the deck's plan wants spells cast this turn (the spells-matter plan: Hearth Elemental and Eddymurk Crab cost less per spell in the graveyard, so cantrip → creature in the same main phase is right and must stay); otherwise hold it for the opponent's end step if the mana would be unused anyway.
2. **Opponent's turn.** Never in upkeep or draw. Default window: their end step. Earlier only with a reason: a flash creature as a blocker at declare attackers (or at their end step when it will attack next turn and no blocker is needed); removal on an attacker at declare attackers, before blocks; a counter or answer in response (already the `answers` behaviour); burn to the face when it is lethal.
3. **Holding.** The mana an instant needs stays open through the opponent's turn when the hand holds one (the `answers` rule); the end-step cast is what spends it when nothing happened.

Interaction with the existing profiles: `answers` and `tapout` decide *whether* to hold; this decides *when* an unprovoked cast happens. It should sit under both, and under the stock seat too, since it changes no decision about what to cast, only the window. The 4c row shows the shape: 59% own main, 13% end step, 0% in the opponent's upkeep.

## What I need run
1. `log-spells.js` on batches 1, 2 and 5 with `deck-classes.js`'s output and `--json design/spells-<batch>.json`, so the early share by class is known before the rule, on 2,500 games rather than 67.
2. The rule built as a window check in the bridge (an unprovoked instant cast proposed in UPKEEP/DRAW is deferred; on the opponent's turn deferred to END_OF_TURN unless rule 2's reasons apply), A/B on the same seeds: targets above, plus the usual field-test gate (no deck moves away from real beyond noise; Spellementals 47 → toward its real number; the four reactive-probe decks reported).
3. The `cast` record would be more useful with the target of a targeted spell (`target: {name, seat}`) when Forge exposes it at cast time; the "what was under it on the stack" reading is a stand-in.

Attacks (NOTE-TO-CODE-13OCT-ATTACKS.md) and this are independent; run whichever batch is cheaper first. Both tools read the same logs, so one pass over the batch folders with both is fine.
