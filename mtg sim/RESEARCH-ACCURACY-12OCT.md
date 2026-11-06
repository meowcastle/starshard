# Forge Sim Accuracy Research

Research doc, 12 Oct 2026 · live copy: https://claude.ai/code/artifact/ae2b7e4b-4f9b-40ed-a124-0a408acd4d7e

## Summary

Today the sim's matchup numbers carry no measurable information about real Standard results: our own fidelity check on 12 Oct put the carry-over at k = 0.00 (95% range −0.22 to 0.22) on 584 real games. That is not a verdict on the idea. It is what you get from 20 games per pairing on both sides, an AI that plays control and combo badly, and three measurement bugs we can fix.

What the sim can do well: compare two versions of an aggro or midrange list, check a mana base and curve under real draws, and rank fast matchups against each other. What it can't: predict a control or combo matchup, or any matchup to better than about ±20 points at today's game counts.

The five changes to make first, all doable this week, none needing a new engine:

1.  Flag cards Forge's AI can't play and show decks as "57 playable" (half the "bad" results are decks playing short).

2.  Count draws separately and raise the game clock to 600 seconds.

3.  Fix who plays first: alternate game 1 starts with seeds; keep loser-plays for games 2–3.

4.  Play 40 games per opponent, then add games only where the range still crosses 50%.

5.  Mark each archetype's posture so Forge pilots control decks as control, and give control seats the Cautious profile.

Then rebuild Forge with its hybrid simulation AI switched on, and widen the real-data net to MTGO. Measure every one of these by one number: does k move away from zero.

## What we have today

The sim plays Forge 2.0.15's AI against itself, 20 games per opponent, and corrects the result against real tournament data. Read from the code in mtg sim/ on 12 Oct.

| Part               | What it does now                                                                                                                                                  | What that means for accuracy                                        |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| Engine             | Forge's built-in AI pilots both decks; the default AI profile unless a deck asks for another                                                                      | Both sides play at Forge's skill, not a human's                     |
| Games per opponent | 20 per phase (game 1 and post-board), with extra games added where the 95% range is widest                                                                        | 20 games gives a range of roughly ±20 points on one matchup         |
| Play/draw          | Forge alternates: the loser plays first next game; the server reads who went first from the log                                                                   | Fair over a run, but not the real coin-flip-then-loser-chooses rule |
| Deck archetype     | Forge plays defensively only when the deck's name contains "Control" or its average mana value is over 3; the sim appends "Control" when a brew is marked control | A control deck under the wrong name attacks like an aggro deck      |
| Sideboarding       | Forge never sideboards. One Claude call writes both sides' plans per pairing; games 2–3 use the pre-boarded lists                                                 | The plan is a model's guess, not the real opponent's                |
| Mulligans          | Forge's own mulligan logic (its AI profile's land-count rules)                                                                                                    | Not the London-mulligan judgement a pro makes                       |
| Real data          | Jiliac/MTGODecklistCache: Melee and topdeck.gg paper events, each deck filed under its nearest meta archetype by main-deck overlap                                | Real results exist, but archetype matching is approximate           |
| Calibration        | One "how much Forge overrates this deck" number per archetype, fit on the log-odds scale, pulled toward zero unless there is a lot of data                        | Only moves a matchup a few points until far more real games are in  |
| Card stats         | Parsed from Forge's full game log: cast turn, win rate when cast, damage, mulligans                                                                               | Depends on Forge's play, so a card the AI misplays reads as weak    |

The number that matters most is in calib.js: the fidelity check fitted on 12 Oct, 32 pairings and 584 real games, found **k = 0.00 (95% range −0.22 to 0.22)**. k is how much of Forge's matchup spread carries over to real results; 1 means Forge's matchups are real, 0 means they carry no information. On today's data, Forge's raw matchup percentages predict nothing about real Standard matchups. The rest of this doc is about why, and what moves k off zero.

## Where Forge's AI falls short

Forge's developers say it themselves: the AI "is not trained", "uses basic rules and can be easy to overcome", is strongest with aggro and midrange, "poor to OK" with control, and "pretty bad for most combo decks" ([Forge wiki: AI](https://github.com/Card-Forge/forge/wiki/ai)). The points below come from reading the current Forge source (forge-ai, master as of 12 Oct 2026) and its issue tracker, not from the wiki alone.

| Area                    | What the AI actually does                                                                                                                                                                                                                                                                                      | Why it skews Standard results                                                                                                       |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Counterspells           | Never holds mana up on purpose. Counterspells are left out of normal play and only fire if mana happens to be free when something hits the stack; the target is judged almost only by mana value ([AiController / CounterAi](https://github.com/Card-Forge/forge/tree/master/forge-ai/src/main/java/forge/ai)) | Any deck built around instant-speed interaction (Dimir, Azorius, Jeskai control) plays far below its real strength                  |
| Reading the stack       | A profile flag literally says the AI "is not smart enough to predict whether a kill spell on stack is countered" ([Default.ai](https://raw.githubusercontent.com/Card-Forge/forge/master/forge-gui/res/ai/Default.ai))                                                                                         | Removal-heavy decks waste cards into permission                                                                                     |
| Attacks and blocks      | Aggression is a 0–6 number from force ratios, life and random profile rolls; combat tricks and the opponent's open mana are handled by a random chance, not lookahead ([AiAttackController](https://github.com/Card-Forge/forge/blob/master/forge-ai/src/main/java/forge/ai/AiAttackController.java))          | Combat-math decks (prowess, pump, flash blockers) are misplayed on both sides                                                       |
| Deck posture            | Plays defensively only if the deck name contains "Control" or average mana value is over 3 ([PlayerControllerAi.setupAutoProfile](https://github.com/Card-Forge/forge/blob/master/forge-ai/src/main/java/forge/ai/PlayerControllerAi.java))                                                                    | A low-curve control or tempo deck is piloted like aggro unless we rename it (the sim does this when a brew is marked control)       |
| Mulligans               | Land count only: keeps 2 to n−2 lands, bottoms toward half lands. No curve, colour or matchup judgement; code comment: "still suboptimal (but fast)" ([ComputerUtil.wantMulligan](https://github.com/Card-Forge/forge/blob/master/forge-ai/src/main/java/forge/ai/ComputerUtil.java))                          | Keeps hands a pro would ship, and vice versa; the London rule itself is on by default                                               |
| Play/draw               | The AI always chooses to play first; the loser of each game plays first in the next ([PlayerControllerAi.chooseStartingPlayer](https://github.com/Card-Forge/forge/blob/master/forge-ai/src/main/java/forge/ai/PlayerControllerAi.java))                                                                       | Correct for game 2–3; for a run of independent games it means the loser is always on the play, which drags every matchup toward 50% |
| Sideboarding            | Off in sim mode: SimulateMatch builds bare game rules and never enables AI sideboarding ([SimulateMatch.java](https://raw.githubusercontent.com/Card-Forge/forge/master/forge-gui-desktop/src/main/java/forge/view/SimulateMatch.java))                                                                        | Our pre-boarded lists are the only way; the engine can't do it                                                                      |
| Cards it can't play     | A card with no AI logic for its effect returns CantPlayAi and is never cast. Cards marked AI:RemoveDeck:All are stripped from the AI's options entirely. The generic fallback "selects the first eligible card without evaluating" ([issue \#12190](https://github.com/Card-Forge/forge/issues/12190))         | A deck with one such card is quietly playing 56 cards                                                                               |
| "You may" and self-harm | Always says yes to optional effects, pays cumulative upkeep until it dies, stacks redundant removal in response to removal ([issue \#3674](https://github.com/Card-Forge/forge/issues/3674)), activates planeswalkers into its own damage ([\#11799](https://github.com/Card-Forge/forge/issues/11799))        | Specific Standard cards become liabilities in the AI's hands that are assets in a human's                                           |
| The clock               | A game over -c seconds (ours: 180) is scored as a draw ([SimulateMatch.java](https://raw.githubusercontent.com/Card-Forge/forge/master/forge-gui-desktop/src/main/java/forge/view/SimulateMatch.java))                                                                                                         | Long control mirrors and loops become draws, which the headline hides                                                               |
| Simulation AI           | Forge has a lookahead AI (SpellAbilityPicker, depth 3, plus a July 2026 "hybrid" mode that vetoes bad heuristic plays, [PR \#11436](https://github.com/Card-Forge/forge/pull/11436)), but the sim command never turns it on; the -a flag only picks heuristic profiles                                         | We are running the weakest of Forge's three AI modes                                                                                |

Two things no one has measured: Forge AI against humans, and Forge AI-vs-AI matchups against real tournament results. The two public projects that run `forge sim` at scale both decline to claim their numbers predict human play ([Grim.Cards case study](https://grim.cards/case-study/2026-07-01), 4,808 games; [mtg-deckbuilder PR \#61](https://github.com/robmillersoftware/mtg-deckbuilder/pull/61)). Our own k = 0.00 is, as far as I can find, the first such measurement, and it agrees with their caution.

The AI profiles (Default, Cautious, Reckless, Experimental) change about 25 heuristic knobs each: counter chances by mana value, attack-into-trade odds, mulligan threshold (4, or 3 for Reckless), planeswalker defence, combat-trick holding. Experimental is not a smarter AI, only Default with different dials ([res/ai](https://github.com/Card-Forge/forge/tree/master/forge-gui/res/ai)). The -s seed flag makes a run reproducible, which matters for A/B tests below.

## The gap between Forge and real Standard

A real Standard match result is the product of four things the sim handles differently: who plays first, whether each hand is kept, what gets sideboarded, and who is piloting. Each one is a known, repeatable bias, which is why the calibration model can in principle absorb some of it, and why it can't absorb all of it on 584 games.

**Play and draw.** The player on the play wins more often than half in every constructed format measured; Untapped.gg published on-play and on-draw win rates for Standard from over 600,000 Arena games in 2019 ([Untapped.gg](https://x.com/UntappedGG/status/1189154634864058368); the exact figures sit behind a login wall, so treat the usual 52–55% figure as approximate). The effect is bigger for fast aggro decks and smaller for control. Forge's loser-plays-first rule over 20 independent games means each deck is on the play about half the time, which is fine for a symmetric average but wrong for a best-of-three model, where game 1 is a coin flip and the loser chooses after that.

**Mulligans.** 17lands measured the London mulligan on Bo3 draft and found mulliganed hands became more competitive, not that mulligans vanished ([17lands blog, Oct 2019](https://blog.17lands.com/posts/london-mulligan/)). Forge's AI mulligans on land count alone and never for a matchup-specific reason, so it keeps a 7 a pro would ship against aggro and ships a 7 a pro would keep against control. This moves specific matchups, not the average.

**Sideboarding.** Experienced analysts refuse to mix game-1 and post-board win rates because they differ by matchup; Modern Nexus's MTGO study used match win rate only, on "just over 5,700 matches", for that reason ([Modern Nexus](https://modernnexus.com/matchups-and-win-rates-top-tier-decks-part-2/)). Our post-board games use a Claude-written plan for both sides. That is better than no plan, but it is a guess at what two specific pilots would do, and Forge then pilots the boarded 60 with the same weaknesses as game 1, so a plan built around holding up counters gains nothing.

**Pilot skill.** Pro Tour archetype win rates spread from about 44% to 65% with 95% ranges of ±5–6 points even at 300 matches ([Karsten, Pro Tour MH3](https://www.magic.gg/news/metagame-mentor-wins-and-lessons-from-pro-tour-modern-horizons-3); [Karsten, Pro Tour Marvel](https://www.magic.gg/news/metagame-mentor-modern-win-rates-and-lessons-from-pro-tour-marvel-super-heroes)). Those are the best players in the world on tuned lists. Our real-data source is Melee and topdeck.gg paper events, where the field is RCQs and store championships, a weaker and more varied set of pilots. So even a perfect simulator would be calibrated against a different population than the one a "competitive Standard" question usually means.

**Archetype matching.** Real decks are filed under the nearest MTGGoldfish archetype by main-deck overlap. A 75-card list that is 60% one archetype and 40% another gets counted as the first. Every real game used in calibration carries that labelling noise on top of the result noise.

## How win rates get measured, and how many games it takes

At 20 games a matchup number is almost meaningless on its own: a true 50% matchup will read anywhere from 28% to 72% one run in twenty. The ranges below are pure statistics and apply to Forge and to humans alike. They are the floor under every other improvement.

*Chart in the live doc: 95% range on a measured win rate vs games played, at p = 0.5.*

| Games | 95% range (points) |
| --- | --- |
| 20 | ±21.9 |
| 40 | ±15.5 |
| 100 | ±9.8 |
| 200 | ±6.9 |
| 400 | ±4.9 |
| 1000 | ±3.1 |

(1.96×√(p(1−p)/n); ±5 is roughly the precision Pro Tour analyses reach at about 300 matches.)

The field's own standard is the match, not the game. Pro Tour archetype tables from Frank Karsten report 95% ranges of about ±6 points on 300 matches ([Karsten, PT MH3](https://www.magic.gg/news/metagame-mentor-wins-and-lessons-from-pro-tour-modern-horizons-3)); Modern Nexus's MTGO league study needed 5,700 matches across 28 events to call any deck's win rate significant ([Modern Nexus](https://modernnexus.com/matchups-and-win-rates-top-tier-decks-part-2/)); Untapped.gg's ladder numbers come from hundreds of thousands of games ([MTG Arena Zone on Untapped's 240,000-match sample](https://mtgazone.com/untapped-gg-most-popular-ladder-decks/)). A best-of-three amplifies a game edge: a 55% game win rate is a 57.5% match, 60% is 64.8%, 65% is 71.8% (computed from p²(3−2p), the standard match formula also in our calib.js).

What this means for us, in order:

1.  Our 584 real games across 32 pairings is about 18 per pairing, which is why the calibration fit finds no signal (k = 0.00 ± 0.22). The real side is as thin as the Forge side.

2.  Adding Forge games is cheap (seconds each). Adding real games is not; they arrive at the rate paper Standard is played and reported, roughly a few hundred a week across Melee and topdeck.gg.

3.  So the lever on the Forge side is to spend games where they change a decision: 100 games on the three closest matchups beats 20 on each of twelve. The server already does a version of this (extra games where the 95% range is widest); the first pass should be bigger.

4.  The lever on the real side is archetype pooling, which the calibration already does, plus adding sources: MTGO results in the same Jiliac archive, and Untapped.gg or MTGGoldfish matchup tables if they can be read.

## What we can implement now

Ranked by accuracy gained per day of work. The first five are the ones I'd do this week; none of them needs a different engine. Each row says what it fixes and how we'd know it worked, because the honest answer to "is it more accurate" is the fidelity number k and nothing else.

| \#  | Change                                                                                                                                                                                                                                                                                                   | What it fixes                                                                                                                                                   | Effort                                                                           | How we'd measure it                                                                                                                                  |
|-----|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1   | **Flag and count unplayable cards.** Before a run, read each card's Forge script (res/cardsfolder/\<letter\>/\<name\>.txt) for AI:RemoveDeck:All, and parse the "AI can't play" warning Forge prints at game 1. Show the deck as "57 playable cards" and refuse to calibrate on decks with flagged cards | Decks that are quietly playing short; combo and engine cards the AI never casts. Today those games count as real evidence                                       | 1 day                                                                            | Count of flagged cards per meta deck; any matchup where a flagged deck appears gets a warning on the Results tab                                     |
| 2   | **Separate draws from losses, and raise the clock.** Report draw rate per pairing; run at -c 600; exclude pairings with over 10% draws from the headline                                                                                                                                                 | A 180-second clock turns slow control games into draws, which then read as 50%                                                                                  | Half a day                                                                       | Draw rate before and after, per archetype                                                                                                            |
| 3   | **Fix play/draw for best-of-three.** Game 1: use Forge's -s seed and start half the game-1 runs with each deck first (two batches, swapped order). Games 2–3: the real rule is loser chooses, and the loser nearly always plays, which Forge already does                                                | The current loser-plays-first across 20 independent games drags every matchup toward 50% and hides the on-the-play edge that decides aggro mirrors              | 1 day                                                                            | Split every result into on-play and on-draw rates (the log already records who went first); the gap should match the 52–55% the real world shows     |
| 4   | **Spend games where they matter.** 40 games first pass; then keep adding games only to pairings whose range still crosses 50% or whose meta share is above 5%; cap at 200                                                                                                                                | ±22 points at 20 games means the ranking of opponents is mostly noise. Forge games cost seconds; the Mac worker adds capacity                                   | 1 day (the server already has the extra-games loop)                              | Width of the headline's 95% range on a top-8 gauntlet, before and after                                                                              |
| 5   | **Pilot the control decks as control.** Mark every meta archetype's posture (aggro, midrange, control, combo) once, and pass it through the deck name so Forge's pilotsNonAggroDeck fires; use the Cautious profile for control seats and Default or Reckless for aggro seats via -a                     | Forge attacks with a control deck as if it were aggro unless the name says "Control". This is the single cheapest change to how the AI plays                    | Half a day                                                                       | A/B on the same seed: control archetypes' win rates vs the field before and after; the calibration betas for control decks should shrink toward zero |
| 6   | **Rebuild Forge with hybrid simulation on.** A one-line change to SimulateMatch passes USE_HYBRID_SIMULATION; Forge then checks each heuristic play with a depth-0 lookahead and vetoes the bad ones ([PR \#11436](https://github.com/Card-Forge/forge/pull/11436))                                      | The weakest AI mode is the one sim uses. Hybrid is the cheapest upgrade the engine offers                                                                       | 2 days (build from source, measure speed, keep the Mac worker on the same build) | Games per minute before and after; then k on the same real data                                                                                      |
| 7   | **Audit the sideboard plans against real lists.** The Jiliac archive has every real player's sideboard. For each meta pairing, compare Claude's plan with what the real pilots boarded (cards that appear in the real 60 for that matchup more often than in game 1)                                     | A plausible plan is not the real plan; a plan built around holding up counters is wasted on this AI                                                             | 2 days                                                                           | Share of Claude's "in" cards that real pilots also bring in, per pairing                                                                             |
| 8   | **Widen the real-data net.** Add the MTGO results in the same archive (Challenges and Leagues are in Jiliac's cache), and weight events by level: Pro Tour and RC over RCQ over store championship                                                                                                       | 584 real games is why k is unmeasurable. MTGO alone would multiply it several times, and MTGO pilots are closer to "competitive" than store-championship fields | 2 days                                                                           | Real games per pairing; the width of k's range                                                                                                       |
| 9   | **Report k and the calibration betas on the page.** Show "Forge agrees with real results k = 0.3 on 2,100 games" next to every headline, and the per-archetype overrate number on each opponent row                                                                                                      | Users read a 57% as a prediction. It isn't until k is well above zero                                                                                           | Half a day                                                                       | None needed; this is honesty, not accuracy                                                                                                           |
| 10  | **Tune one AI profile per archetype class.** Fork Default.ai into Aggro.ai, Midrange.ai, Control.ai; set counter chances, attack-into-trade, mulligan threshold and combat-trick holding per class; pit them with -a on fixed seeds                                                                      | Profiles are 25 dials each; the shipped four were never tuned for Standard archetypes                                                                           | 3–5 days, iterative                                                              | Self-play tournaments on fixed seeds, then k                                                                                                         |

Three things not to do, with the reasoning:

- **Don't let the calibration move numbers more than the real data supports.** The 12 Oct fit already found the right answer: with the pull at its maximum, a deck needs a lot of real games before its matchup moves more than a few points. Loosening that to make the page look calibrated would be fitting noise. The earlier fixed pull of 2 moved Lifegain from 14% to 46% on 8 units of evidence; that was the bug, not the feature.

- **Don't tune the AI by whether the numbers match real results.** Tune it by whether it plays better (self-play strength on fixed seeds, draw rate, cards cast), then check k. Tuning to k directly would overfit to this month's meta.

- **Don't trust card-performance stats for cards the AI can't play well.** "Win rate when cast" for a counterspell reflects Forge's counterspell play, not the card. Flag those rows the same way as \#1.

## What we can't fix without a different engine

No amount of tuning makes Forge's heuristic AI hold up a counterspell on purpose, read the stack under permission, or see a combo line; those are architecture, not dials. The honest ceiling for this engine is "how these lists play when both sides are piloted at a strong club player's level with no instant-speed judgement." That is still useful for aggro and midrange mirrors and for curve and mana questions, and nearly useless for control and combo matchups.

| Option                                                                                     | What it would give                                                                                                                                                                                                                                                                                                                                                                   | Why not now                                                                                                                                                                                                                                                                                      |
|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Forge full simulation AI (depth-3 lookahead, USE_FULL_SIMULATION)                          | Real lookahead on every play, including instants                                                                                                                                                                                                                                                                                                                                     | No published speed or strength numbers; the code notes its random source is global so it can't run in parallel inside one process; expect games to take minutes, not seconds ([forge-ai/simulation](https://github.com/Card-Forge/forge/tree/master/forge-ai/src/main/java/forge/ai/simulation)) |
| XMage's minimax AI ("Computer - mad")                                                      | A second opinion from a different engine with comparable card coverage (32,500 card classes)                                                                                                                                                                                                                                                                                         | No batch mode; AI-vs-AI exists only as test harnesses; its MCTS player is described by its own maintainers as slow and buggy ([XMage issue \#7075](https://github.com/magefree/mage/issues/7075))                                                                                                |
| Learned agents on XMage: MageZero (AlphaZero-style, Sept 2026) and jackmaiorino's PPO fork | The only projects where a learned player beats or matches the built-in AI: MageZero reports one deck going from 16% to 66% against XMage minimax in self-play ([MageZero](https://github.com/WillWroble/MageZero)); the PPO fork reached about 50% against the minimax player after 50,000 episodes on a 10-node cluster ([jackmaiorino/mage](https://github.com/jackmaiorino/mage)) | Both are per-deck or Pauper-only, research code, and need GPU or cluster time per deck; a new Standard meta every few months would mean retraining                                                                                                                                               |
| Magarena's MCTS AI                                                                         | The strongest-reputation open AI in its own 2016 benchmark ([Magarena AIComparison](https://github.com/magarena/magarena/wiki/AIComparison))                                                                                                                                                                                                                                         | Last release December 2019; no modern Standard cards ([releases](https://github.com/magarena/magarena/releases))                                                                                                                                                                                 |
| LLM pilots (mage-bench runs frontier models through XMage)                                 | Could in principle sideboard, hold up mana and read the stack                                                                                                                                                                                                                                                                                                                        | The project's own summary is that frontier models "play pretty bad Magic", and a game costs a model call per decision ([mage-bench](https://github.com/GregorStocks/mage-bench))                                                                                                                 |

The realistic path to a better engine is Forge's own hybrid simulation (row 6 above), then full simulation for overnight runs where minutes per game is acceptable. Everything else is a research project.

## Sources

Our own code (mtg sim/ as of 12 Oct 2026): calib.js (the calibration model and the fidelity measurement), forge.js (how Forge is run and read), sideboard.js, cardstats.js, realdata.js, server.js, README.md.

Forge engine, read directly from the current source:

- [Forge wiki: AI](https://github.com/Card-Forge/forge/wiki/ai), the developers' own description of its strengths and weaknesses

- [SimulateMatch.java](https://raw.githubusercontent.com/Card-Forge/forge/master/forge-gui-desktop/src/main/java/forge/view/SimulateMatch.java), the sim command: flags, clock, no sideboarding, no simulation AI

- [Default.ai](https://raw.githubusercontent.com/Card-Forge/forge/master/forge-gui/res/ai/Default.ai) and the [res/ai](https://github.com/Card-Forge/forge/tree/master/forge-gui/res/ai) profiles

- [PlayerControllerAi.java](https://github.com/Card-Forge/forge/blob/master/forge-ai/src/main/java/forge/ai/PlayerControllerAi.java), the "Control" name rule and the always-play-first choice

- [AiAttackController.java](https://github.com/Card-Forge/forge/blob/master/forge-ai/src/main/java/forge/ai/AiAttackController.java) and [ComputerUtil.java](https://github.com/Card-Forge/forge/blob/master/forge-ai/src/main/java/forge/ai/ComputerUtil.java) (mulligans)

- [forge-ai/simulation](https://github.com/Card-Forge/forge/tree/master/forge-ai/src/main/java/forge/ai/simulation) and [PR \#11436, hybrid simulation](https://github.com/Card-Forge/forge/pull/11436)

- [Card-scripting API](https://github.com/Card-Forge/forge/wiki/Card-scripting-API), the AI:RemoveDeck and AILogic hints

- Issues [\#3674](https://github.com/Card-Forge/forge/issues/3674), [\#11799](https://github.com/Card-Forge/forge/issues/11799), [\#12190](https://github.com/Card-Forge/forge/issues/12190)

Other simulators and AI research:

- [Grim.Cards case study](https://grim.cards/case-study/2026-07-01), 4,808 Forge games, with its disclaimer

- [mtg-deckbuilder PR \#61](https://github.com/robmillersoftware/mtg-deckbuilder/pull/61), Forge throughput and interval reporting

- [MageZero](https://github.com/WillWroble/MageZero), [jackmaiorino/mage](https://github.com/jackmaiorino/mage), [mage-bench](https://github.com/GregorStocks/mage-bench), [XMage issue \#7075](https://github.com/magefree/mage/issues/7075)

- [Magarena AI comparison](https://github.com/magarena/magarena/wiki/AIComparison) and [releases](https://github.com/magarena/magarena/releases)

Real-world measurement:

- [Karsten, Pro Tour Modern Horizons 3 win rates](https://www.magic.gg/news/metagame-mentor-wins-and-lessons-from-pro-tour-modern-horizons-3) and [Pro Tour Marvel](https://www.magic.gg/news/metagame-mentor-modern-win-rates-and-lessons-from-pro-tour-marvel-super-heroes)

- [Modern Nexus, matchups and win rates from MTGO dailies](https://modernnexus.com/matchups-and-win-rates-top-tier-decks-part-2/)

- [17lands, impact of the London mulligan](https://blog.17lands.com/posts/london-mulligan/)

- [Untapped.gg, on-play and on-draw win rates from 600,000 games](https://x.com/UntappedGG/status/1189154634864058368) (figures behind a login; cited for the effect's existence, not its size)

- [MTG Arena Zone on Untapped.gg's 240,000-match Standard sample](https://mtgazone.com/untapped-gg-most-popular-ladder-decks/)

- [Jiliac/MTGODecklistCache](https://github.com/Jiliac/MTGODecklistCache), the archive our real results come from

Searched for and not found: any study of Forge AI against humans, or of Forge AI-vs-AI matchups against tournament results; a published play-vs-draw percentage for current Standard outside paywalled trackers. The slightlymagic.net forum threads on Forge AI could not be opened from this environment.
