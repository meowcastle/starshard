# Learned evaluator and per-turn logging: closing the control gap (research, 13 Oct 2026)

Doc: https://claude.ai/code/artifact/273311fb-9e0c-4828-b442-d3f6a577ef65

## What the fidelity table says

The 13 Oct probe (60e0ad1) shows three separate failure modes, and search touched only one of them. That is why k moved from 0.06 to 0.08, inside the noise, at ten times the cost of a normal game.

| Deck | Real | Forge alone | Reactive pilot | Search on both seats | What is missing |
| --- | --- | --- | --- | --- | --- |
| Azorius Control | 41% | 13% | 27% | 20% | Instant-speed play: passing with mana open, answering at the right moment. Search decides main-phase plays only, so it cannot reach this layer; the cheap reactive rules do, and beat it by 7 points |
| 4c Control | 49% | 41% | 40% | 46% | The same layer, but the deck has more sorcery-speed plays, so main-phase search helps a little |
| Dimir Excruciator | 50% | 32% | 37% | 31% | Combat and the race: attack and block decisions over a long midrange game. No pilot moves it; nothing we have built touches combat yet |
| Bant Airbending Combo | 22% | 28% | 41% | 31% | The opposite error: Forge overrates the combo deck, and the reactive pilot makes it worse by 13 points. Which seat the pilot sat on in that row decides whether this is the combo seat playing better or the answer seat playing worse (open question for Code) |
| k | | 0.06 | 0.10 | 0.08 | How much of Forge's matchup edge carries over to real results. All three are inside each other's noise on 1,063 real games |

Two conclusions follow. Search stays research-only, as Code decided: it is the wrong tool for the two gaps that matter. And the reactive rules are the right shape (a rule about a layer Forge does not play) but they cannot be tuned by hand per deck; the Bant row shows a rule that helps one seat hurting another. What is needed is a way to score a game state that knows what a position is worth, so that passing with mana open, attacking, blocking and casting can all be judged by the same measure. That is the learned evaluator, and the per-turn logs are its training data and, first, the instrument that says exactly where Forge goes wrong.

## Per-turn logging: what to record

Log one record per decision point the pilot sees through the bridge, plus one at the end of each turn, and the game's result. The bridge already receives every priority pass; the record is a snapshot of the state as the pilot sees it, Forge's own static score of that state, what was decided, and later the outcome. Nothing in it needs the search layer.

**One record** (JSON, one line per record, one gzipped file per game, named by run id and pairing):

| Field | Contents | Why |
| --- | --- | --- |
| `when` | turn number, whose turn, phase/step, who holds priority, on play or draw | Every combat and open-mana question is a question about when |
| `me` / `opp` | life, poison, lands total and untapped, open mana by colour, cards in hand, library size, graveyard size, exile size | The cheap state every evaluator starts from |
| `board` | one entry per permanent: card id, controller, tapped, summoning sick, power/toughness as modified, counters, keywords present (flying, lifelink, deathtouch, first strike, menace, trample, hexproof, indestructible), planeswalker loyalty | The combat layer lives here |
| `hand` | my cards (ids, mana value, castable now yes/no); for the opponent, count only, plus known cards (revealed, drawn from a known tutor) | Castable-now is what a human reads when deciding to pass with mana open |
| `stack` | what is on the stack when priority arrives, if anything | Instant-speed decisions are decisions about a stack |
| `static` | Forge's `GameStateEvaluator` score for each side, as the AI computes it | The first thing to calibrate: where does Forge's own score mislead it |
| `decision` | what was asked (declare attackers, declare blockers, cast or pass, mulligan, target) and what was answered, with who answered (Forge, pilot rule, search) | The label of the error later |
| `combat` (end of combat only) | attackers declared, blocks assigned, damage dealt each way, creatures lost each side, life change | Lets the combat stats be computed without replaying |
| `outcome` (end of game) | winner, turn count, final life, reason (damage, deck-out, concede, clock) | The training target |

**Volume.** A Standard game runs 8–14 turns and 10–25 decision records; at roughly 1.5 KB a record, a game is 20–40 KB gzipped to 5–8 KB. A production run of 800 games is 5 MB; the weekly calibration round robins, at the current field, another 5–10 MB a week. One year of everything fits in a few gigabytes on the NAS. Keep every record; sampling can happen at training time, not at logging time.

**Where it hooks in.** The bridge's `PlayerControllerExternal` already sees every question Forge asks the pilot; a `--log <dir>` flag that serialises the question's state before answering (and the answer after) covers decisions. Turn ends and game results come from the existing stdout log that `cardstats.js` parses, so the two can be joined on game index. The run record carries the pilot version string, so logs from different pilots never mix.

**What not to log.** Hidden information the pilot should not have (the opponent's hand, the library order). The log must be what a player could see, or the evaluator trained on it will learn to cheat and its scores will be wrong in play.

## What to measure from the logs first

Before any model, six statistics per pairing answer the open questions from the 12 Oct research round with our own data instead of guesses. Each is a short script over the records and should be in the run payload for Code's own reading before it reaches any page.

| Statistic | Computed how | What it tells us |
| --- | --- | --- |
| Static-score calibration | Bin Forge's `static` score at the start of each turn; plot the share of games the leader won per bin | Where Forge's own evaluator is overconfident. If a +40 lead wins only 60% of the time in control matchups, that is the error search inherits at every leaf |
| Lead changes | Count turns where the leader by `static` flips, per game | Q4 from the research round: how often is the game decided late, by combat, rather than early by the curve |
| Loser ahead before last combat | Share of games where the eventual loser led by `static` at the start of their final combat | The size of the combat error in games, not points |
| Unspent mana | Mana available minus mana used, per turn, for each seat, split by whether a castable card was in hand | The classic AI misplay. A control deck that leaves mana unused with a castable answer in hand is either holding it correctly or stuck; splitting by what happened on the stack next tells which |
| Passed with answer, then answered | Of turns where the pilot passed with a counter or removal castable, how often it then cast one on the opponent's turn, and whether the target was the opponent's best permanent by Forge's own creature evaluator | Measures the instant-speed layer directly. Real control decks do this most turns; Forge alone almost never |
| Trades and chump blocks | From `combat`: creatures lost each side per combat, and blocks where the blocker died without killing or saving life that mattered | The block decisions humans most often call wrong in AI play |

Two of these decide the next step. If the static-score calibration curve is poor (a 60-40 lead that wins about half the time), the learned evaluator is the priority, because every search and every veto reads that score. If it is good but unspent-mana and passed-with-answer are far from what the real decks do, the reactive rules are the priority and the evaluator can wait. On the 13 Oct table my expectation is both, with the first worse in control matchups and the second worst for Azorius, but the logs should say.

For the Bant Airbending row, one more cut: split the reactive-pilot games by which seat the pilot sat on. If the pilot on the answer seat lost more to Bant than Forge alone did, its rules are passing on threats that must be answered on sight; if the pilot on the Bant seat won more, Forge was leaving mana open against itself. Either way the fix is a scoring question, not a rule.

## The learned evaluator

A small network that takes a game state and returns the probability that the active player wins, trained on the logs above. The precedent is the Hearthstone work of [Świechowski, Tajmajer and Janusz (2018)](https://arxiv.org/abs/1808.04794), the closest published case: a value network replaced rollouts at the leaves of MCTS and raised the agent's win rate against plain MCTS from 73.5% to 82.0% as first player and from 26.5% to 50.2% as second, at the same half-second per move.

**Target.** Did the active player win. Trained with a two-way softmax (win / lose), so the output is a probability, not a score; a draw by clock counts as half.

**Features** (a fixed vector built from one log record; the Hearthstone network used 750 numbers, ours will be of the same order):

- Scalars for each side: life, poison, lands total, lands untapped, open mana by colour, hand size, library size, graveyard size, turn number, on play, whose turn, phase as one-hot.
- Board, per side: creature count, total power, total toughness, largest power, count with each keyword (flying, lifelink, deathtouch, first strike, menace, trample, hexproof, indestructible), count untapped, count summoning sick, planeswalker count and total loyalty, noncreature permanent count. Fixed-length, so a board of any size fits.
- Cards: a learned embedding per card id, 10–16 numbers, summed over my hand, over my board and over the opponent's board, plus the same for the opponent's known cards. Hearthstone used word2vec on card text; card ids with a learned table are simpler and our card pool is the Standard-legal set, about 3,000 cards.
- Matchup: archetype tags for both decks from the existing classifier (`style.kind`), so the network can learn that the same board means different things in different matchups.

**Model.** Three dense layers, 256-128-64, tanh, softmax out, Adam at 0.001: the Hearthstone recipe. It trains on a laptop CPU in minutes per million rows and runs in well under a millisecond per state, which matters because search will call it thousands of times per decision. Export to ONNX; inference in Node through onnxruntime, or in the Java bridge itself if the call overhead across the socket is too high.

**Data volume and accuracy.** Hearthstone reached 0.76 validation accuracy on 3.5 million states and 0.78–0.79 after 64 rounds of self-play retraining. At 15–25 records a game, our existing weekly round robins and production runs give roughly 100,000–200,000 states a month; a one-off batch of 20,000 games on the NAS over a weekend adds 300,000–500,000. Expect 0.70–0.75 at launch, with the number climbing as the logs grow. The honest comparison is Forge's own static score put through the same calibration test, which the section above measures; the evaluator earns its place the day it beats it on held-out games.

**Train, validate, retrain.** Split by game, never by record, or the network memorises games. Hold out whole pairings as well as whole games, so the accuracy reported is on matchups it has not seen. Retrain from scratch when the field changes (new set, rotation), on a window of the last 8–12 weeks of logs, the same way the calibration refits weekly.

## Where it plugs in

The same number, a win probability for a state, serves four places that today use four different judgements.

| Place | Today | With the evaluator | Cost |
| --- | --- | --- | --- |
| Attacks and blocks | Forge's combat AI, which no pilot so far has touched (the Dimir row) | Enumerate the candidate attack sets (and block assignments) Forge already generates, simulate each to end of combat with `GameCopier`, score the resulting state, take the best. One copy and one evaluation per candidate: tens of milliseconds a combat, not seconds | The first real fix for the midrange gap; this is where the Hearthstone and the MCTS-for-Magic results found the largest gains |
| Passing with mana open | The reactive rules (hand-written, per deck class) | Score two states: cast the best main-phase play now, or pass holding the answer and let the opponent's likely next turn resolve. The rules stay as a prior; the evaluator decides the close calls | Replaces per-deck tuning with one measure; fixes the Bant row's seat asymmetry because both seats are judged the same way |
| The leaf of search | `GameStateEvaluator` after a one-turn-cycle play-out | The evaluator at the leaf, and the play-out can stop earlier (Hearthstone stopped after the opponent's last move of the turn). This is what brought search from 10x the time of a game toward 3–5x | Search becomes affordable enough to leave on for the few decisions the margin test selects |
| The hybrid veto (PR #11436) | Depth-0 static score before and after a play | The same, with the evaluator | Free once it exists |

**Integration path.** Keep the pilot in Node. Export the model to ONNX; `onnxruntime-node` runs the 256-128-64 network in about 0.1 ms per state on the NAS, so even a combat with 50 candidates costs under 10 ms of scoring; the `GameCopier` simulation of each candidate is the larger cost and already exists. If the socket round trip for each candidate state proves too slow, move the scoring into the Java bridge with onnxruntime's Java binding; the model file is the same.

**A/B discipline, unchanged.** Every use above is one override, tested against stock Forge on fixed seeds, both seat orders, 200 games per pairing on the top-8 field, before it stays. Self-play strength first; then k against real games. A change that raises strength and lowers k is wrong for this sim and comes out.

## What it will not fix, and the honest test

The evaluator learns from Forge's games, so it learns what wins under Forge's play, not under human play. That is enough to make Forge play its own positions better (the Hearthstone gains were exactly that), and better play on both seats is what removes the systematic errors behind the control rows. It is not a model of how a person pilots Azorius; we have no human game records for Standard (Arena logs are private, 17lands covers Limited), so the Maia route of training on human moves is closed to us. The pilot's fidelity is still measured one way only: k against real tournament results, by population, after each change.

Two more limits. A card the AI cannot cast (the dead-card list) leaves no useful trace in the logs, so the evaluator cannot rescue it; the dead-card harness stays its own item. And the evaluator inherits any bias in the logs: if most games come from the top-10 field, its scores in fringe matchups will be weaker, which the held-out-pairing validation will show as lower accuracy there, and the page should keep hatching those rows.

The test that says this work paid off, in order: the static-score calibration curve from the logs shows where Forge misjudges; the evaluator beats that curve on held-out games; combat and open-mana overrides using it raise self-play strength on fixed seeds; and then Azorius Control moves from 20% toward 41% and Dimir Excruciator from 31% toward 50% without Bant Airbending moving further from 22%. If k on 1,063 real games rises past the 0.10 the reactive pilot reached, the gap is closing; if strength rises and k does not, the sim is learning to beat Forge, not to predict people, and that is the signal to stop and look at the population question instead.

## Order of work and effort

1. **Logging** (1–2 Code-days). The `--log` flag in the bridge, the record above, the join with the stdout game log, the pilot version in the file name. Turn it on for every run from then on; the weekend batch of 20,000 games can start the moment it works.
2. **The six statistics** (1 day). Scripts over the logs; the static-score calibration curve first. Read them before deciding anything below; the Bant seat split is part of this step.
3. **Reactive rules, kept and extended** (ongoing, small). They beat search on Azorius by 7 points and cost nothing at run time. Extend them where the passed-with-answer statistic says Forge is furthest from a real control deck.
4. **Evaluator v1** (2–3 days once 300,000+ records exist). Features, the 256-128-64 network, held-out-pairing validation, ONNX export, the calibration curve against Forge's static score.
5. **Combat override** (2–3 days). Candidate attacks and blocks scored by the evaluator; A/B on seeds; this is the item aimed at the Dimir row.
6. **Open-mana decision** (2 days). The evaluator judging pass-or-cast, with the reactive rules as the prior; aimed at the Azorius and Bant rows together.
7. **Search leaf** (1 day, optional). Swap `GameStateEvaluator` for the evaluator at the leaf and re-run the 13 Oct probe; search becomes affordable or stays research-only on the numbers.
8. **Retraining cadence** (half a day). Weekly refit on a rolling window, next to the calibration refit, with the accuracy and the calibration curve recorded in the run's `method` object so the page can say which pilot and which evaluator produced a number.

About three Code-weeks in total, with steps 1–3 giving a readable answer to "where does Forge go wrong" in the first week, before any model is trained. The research thread's part is step 2's reading and the design of the features in step 4; the plan above does not touch any file Code is working in now.

Sources: [Świechowski, Tajmajer, Janusz, Improving Hearthstone AI by Combining MCTS and Supervised Learning Algorithms (2018)](https://arxiv.org/abs/1808.04794); the 12 Oct research rounds in this project (pilot questions, engines, accuracy work order); Code's fidelity probe 60e0ad1 and NOTE-TO-DESIGN-13OCT-FROM-CODE.md.
