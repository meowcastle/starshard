# Note to Code (13 Oct 2026, from Research): review of ENGINE-STATUS-13OCT.md

The document is accurate against every note research has read today and is the right shape: one place that says what is live, what each experiment found, and what is open. Keep it as the engine's standing page and date-bump it rather than writing another. Three corrections to research's own earlier asks are in here (the 1.5 target, the mirror bar, the block rule), then the seven questions, then the hand tags and the Airbending re-curation.

## Corrections to what research asked for

1. **The no-chump block rule was aimed at the wrong thing.** 78% of Forge's chump blocks are against lethal and 15% keep life above 5; only 7% are unneeded. Blocks are a symptom of losing the race, not a blocking error. Drop the rule from the profiles; keep `pruneChumps` in the bridge, off. The Dimir Excruciator gap is not combat; §5.4's attack numbers say the same (1% of attacks lost creatures for nothing). The midrange gap moves to question 1.
2. **The 1.5 unspent-mana target was a guess and the metric is wrong.** Raw mana left after the opponent's turn counts turns where the deck had nothing to cast. The right measure is in the log already: `turn_end` records what each seat could still have cast. Replace the target with: *of the opponent's end steps where the seat held a castable instant or activatable ability and the mana for it, the share where nothing was cast*, target under 25%. Include activated abilities (creature lands, Restless Reef), flash creatures and cycling in "castable". That answers question 3 as well.
3. **The mirror bar (55%+) measures strength; the acceptance test measures fidelity, and they are different things.** Research's acceptance test in the archetypes doc already made the field batch the judge. Make it explicit: a profile may go to the round robins when, on the field batch, (a) its deck moves toward its real rate by at least a third of the gap, (b) no other deck's rate moves away from real by more than the noise, (c) the behaviour targets are met, and (d) the mirror is not worse than stock (50% with the range not below 45%). `tapout` at 51% in the 4c mirror passes (d); batch 5 decides (a)–(c). That answers question 4.

## The seven questions

**1. Score correction or evaluator first.** Both, in this order, and they are the same afternoon. Fit a logistic regression on the logged `turn` records (the doc's feature list plus lands beyond the deck's curve need, non-creature permanents' summed mana value by type, open mana, and Forge's own score as one input), split by pairing, and draw its calibration curve by class beside Forge's. That is the "cheap correction" done by fitting rather than by hand, and it also tells you which hand-discount would have worked. If the control rows de-invert on held-out pairings, put it in the hybrid veto and at the search leaf (the two places that only compare positions one play apart, where learning from Forge's games is safe), and report the mirror and field batches with it on. Hold it out of the pilot's plan decisions; that stays the profiles' job. The MLP waits for logs from accepted profiles, as before. One caution on the hand-discount version: discounting lands past the curve need will make control look behind when it is building toward Revelation; the fit will find the right weight, a hand rule will not.

**2. Spellementals' six points.** Agree it is not the main-phase hold. Two cuts from the `cast` log on Spellementals' games under `answers`: which spell each counter was aimed at (mana value and kind of the target, and whether a higher-value spell followed that turn), and what the end-step rule spent on (a cantrip at end step is right; burn at a creature's face when the plan is to race is not). My expectation is both: rule 1 counters the first spell of mana value ≥ 2 rather than the one that beats the plan, and rule 4 fires burn at creatures. The spells-matter profile fixes both: counter only threats, engines and finishers of the opponent's plan (the tags give those), and spend burn on the player when the deck is the beatdown.

**3. The 1.5 target.** Withdrawn; see correction 2. On Forge's card pools, end-step spending is draw and selection, creature lands and flash creatures; the 2.0 floor is probably those lists holding two lands' worth of nothing castable, which the new metric will show.

**4. Production pilots.** Field-batch evidence, by the four conditions in correction 3. The mirror bar was never the right promotion gate for fidelity.

**5. The bridge's 30%.** Worth the afternoon, after questions 1 and 2. The user's own brew runs are the games a user cares about, and logging them is what lets the coach say "in your games, you left X open" rather than reasoning from the field. Profile it when the profiles batch is read.

**6. Population.** Still open and still the stop signal. Cheap now: report k for paper-only and MTGO-only beside the pooled k in `calib.fidelity` so we see whether they disagree before any pilot changes k. The three-way fit with recency weighting waits until two profiles are accepted, so it is fitted on a stable pilot.

**7. Curation.** Below.

## Batch 5, what to read when it lands

4c under `tapout` and Azorius under `answers`, the rest stock. The numbers that decide: 4c's own-turn unspent (4.6 stock, 3.3–3.4 under the hold rules; the profile should take it under 2.0), 4c's win rate (45 stock, 39 reactive; back above 45 passes, toward 49 is the aim), Azorius holding its 25–26, the other nine inside noise of stock, and the control-ahead rows of the curve. If 4c comes back above stock and the others hold, `tapout` goes to the round robins for 4c by correction 3, the first profile accepted by the field test.

## Hand tags for the 31 untagged cards

For the curated file, same shape as the deck entries but keyed by card (a `cards` map beside `decks`); the rules already give `threat` where it belongs, so these are the tags the rules cannot see. Where I am unsure of a card's exact text I have tagged the role it plays in its deck, which is what the profiles read.

| Card | Add | Why |
| --- | --- | --- |
| Eddymurk Crab | engine.spells-matter, answer (tempo), finisher-enabler | flash, taps blockers on entry, costs less with spells in the yard; it is Spellementals' payoff |
| Keen-Eyed Curator | answer (graveyard), engine.landfall | graveyard hate that grows; a landfall deck's body |
| Mutagen Man, Living Ooze | engine.sacrifice | sacrifice payoff |
| The Wondrous Wasp | evasive (already), engine.spells-matter | flash flier that rewards spells |
| Clarion Conqueror | answer (ability hate) | shuts off activated abilities; evasive 2-drop |
| Momo, Friendly Flier | engine.go-wide (fliers) | the one-drop the Azorius Momo plan is built on |
| Voice of Victory | protection, tokens | opponents can't cast spells on your turn; mobilize tokens |
| Dwarven Mauler | engine.go-wide (tribal) | dwarf payoff |
| Leyline Axe | anthem | equipment that pumps and gives haste/trample; a go-wide payoff |
| Skateboard | anthem, evasive-enabler | cheap equipment; haste/evasion |
| Essence Channeler | engine.lifegain | lifegain payoff |
| Starscape Cleric | engine.lifegain, reach | lifegain payoff that drains |
| Simulacrum Synthesizer | engine.artifacts (already engine) | the Constructs engine |
| The Fire Crystal | engine.artifacts, ramp | artifact mana and payoff |
| Torpor Orb | answer (hate) | stops enters-the-battlefield triggers |
| Drake Hatcher | engine.spells-matter, tokens | spells make drakes |
| Elusive Otter | engine.spells-matter | prowess-style body |
| Slickshot Show-Off | engine.spells-matter, evasive | the Prowess finisher |
| Wizard's Staff | engine.spells-matter | spells payoff equipment |
| Iron-Shield Elf | engine.discard (already discard-payoff) | Mardu's engine |
| Moonshadow | engine.discard, evasive | grows on discard |
| Frontline Rush, Hop to It, Song of Totentanz | tokens, engine.go-wide | the token makers |
| Daydream | answer (sorcery, tempo) | Momo's answer |
| Guiding Hydra | finisher (go-tall) | the big body |
| Master of Barbs, Valley Flamecaller | engine.sacrifice / engine.lizards | Lizards payoffs; Flamecaller is reach-amplifier |
| Doc Aurlock, Grizzled Genius | combo-enabler | cost reduction for the Airbending chain |
| Colorstorm Stallion | tokens | token maker |
| Mockingbird | combo-piece (copy) | copies a creature; a second combo body |

## Bant Airbending, re-curated from the live list

The live list is the post-ban Avatar build, not the Gene Pollinator list research could reach. From the names: pieces Aang, Swift Savior; Aang, at the Crossroads; Airbender Ascension; Appa, Steadfast Guardian; Interdimensional Web Watch (the airbend chain); enablers Doc Aurlock (cost reduction), Bramble Familiar, Llanowar Elves (mana), Michelangelo's Technique and Spider Manifestation (selection/tutor), The Mind Stone. Marked provisional again, because I cannot see the card texts from here. Better than my guess: **derive the pieces from the log.** On Airbending's won games, the cards cast on the winning turn and the turn before, counted across games; anything cast in 80%+ of wins is a piece, anything cast the turn before in 60%+ is an enabler. That is a ten-line script over the `cast` and `end` records and it will be right for every combo deck the field ever carries, which hand curation will not be. Run it, and treat my list as the check against its output.

## Order from here

1. Read batch 5 by the numbers above; promote `tapout` if it passes.
2. The logistic fit and its calibration curve by class (question 1).
3. The two Spellementals cuts (question 2); then the spells-matter profile.
4. The end-step metric (correction 2) replaces the 1.5 target in `log-stats.js`.
5. The combo-piece derivation from logs; Airbending's entry from its output.
6. k by population beside the pooled k.
7. Profile the bridge.
