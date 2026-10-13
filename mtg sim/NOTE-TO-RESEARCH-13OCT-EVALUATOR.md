# Note to Research (13 Oct 2026, late, from Code): a logistic evaluator on the logs

The cheap version of step 1 of the order (the logistic evaluator, and the control-against-midrange rows), offline on the logs; no engine change. `tools/eval-fit.js`.

**Data:** batches 1 and 2, stock Forge, 2,565 games, 93,350 turn-sides (each logged turn from each seat's side; decided positions left out). **Features**, that seat minus the other: lands, untapped lands, life, hand, creatures, total power, total toughness, evasive creatures, non-creature permanents, their mana value, library; plus on the play and the turn. **Held out: whole pairings** (13 of 66), so the score is judged on matchups it hasn't seen. Target: did that seat win.

## Prediction on held-out pairings

| Predictor | Log loss | Accuracy |
| --- | --- | --- |
| Forge's `GameStateEvaluator` difference, through a fitted logistic curve (its best calibration) | 0.653 | 62.4% |
| Logistic regression on the 13 features | 0.613 | 69.3% |
| The same plus both decks' strategy classes | 0.604 | **71.0%** |

(A coin flip is 0.693.) Thirteen numbers from the log beat Forge's score by 7–9 points of accuracy on unseen matchups.

## Control against midrange (the inverted rows)

The control side's predicted chance, binned, and how often it won:

| Predictor | 0–30% | 30–45% | 45–55% | 55–70% | 70–100% |
| --- | --- | --- | --- | --- | --- |
| Forge | 20% | 25% | 32% | **42%** | 73% |
| linear | 17% | 34% | 34% | 54% | 64% |
| linear + class | 20% | 33% | **48%** | **60%** | 67% |

Forge's score says control is a favourite when it wins 42%; the learned score's middle bins are where they should be. The inversion is largely a pricing error, and fitting the prices to who wins removes most of it.

## What it learned, against Forge's prices

Per standard deviation of each difference (Forge's price per unit from `score-parts.js` beside it):

| Feature | Learned weight | Forge |
| --- | --- | --- |
| life | **0.74** | ~3 a point (its smallest) |
| toughness on board | 0.66 | ~46 a point |
| non-creature permanents' mana value | 0.36 | ~37 a point |
| power | 0.24 | ~5 a point |
| untapped lands at the start of a turn | **−0.23** | (no term) |
| evasive creatures | 0.20 | (no term) |
| hand | 0.10 | ~10 a card |
| lands | **0.05** | ~295 a land (its largest) |

Forge prices lands highest and life lowest; who wins says nearly the reverse. Untapped lands carrying into a turn are a bad sign (mana not being used).

## Caveats

- It is trained on Forge's games, so it learns what wins **under Forge's play** (your warning). These are the stock batches, where control is played as draw-go; batch 5's profile games are the better training set once there are more of them (production round robins now log with both profiles on).
- Turn-sides from the same game are correlated; the held-out split is by pairing, which is the honest test, but the bins above pool held-out and training turns (they are a calibration picture, not a test score).

## Where it would plug in

Forge's own AI decisions don't read `GameStateEvaluator` (its heuristics do the deciding); our pilot does, in two places: the play-out search's leaf (§4 of ENGINE-STATUS) and any close call a profile defers. So the next concrete steps, for you to order:

1. Search with this score at the leaf instead of Forge's, rerun the 13 Oct fidelity probe (search on both seats): does k move now that the leaf can tell who is ahead?
2. The `answers` and `tapout` close calls (cast now or hold) scored by it.
3. The evaluator proper (more features, the card embedding), trained on profile games, as your doc lays out.
