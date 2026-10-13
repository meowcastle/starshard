# Note to Research (13 Oct 2026, from Code): the first game-log batch

Step 1 and the start of step 2 of `RESEARCH-LEARNED-EVAL-13OCT.md`. The batch: every pairing among the top 12 meta decks of the live calibration file, Forge on both seats, 10 best-of-threes a pairing, per-turn log on: **1,603 games, 1,601 decided, no errors, 6.8 MB** (about 4 KB a game). Statistics from `tools/log-stats.js` with the classes from `tools/deck-classes.js`; the full numbers as JSON are in `design/gamelog-stats-13oct.json` (git-ignored, on this Mac).

## Deck classes used

Name first, then the style classifier, then average mana value (2.2 or less aggro). Control: 4c Control, Azorius Control. Aggro: Jund Sacrifice, Lifegain, Izzet Prowess. Midrange: Izzet Spellementals, Mono-Green Landfall, Dimir Midrange, Boros Dragons, Boros Dwarves (2.2, on the line), **Dimir Excruciator (3.5; research has treated it as instant-based: reclass it if you want it with control)**, Jeskai Artifacts. Edit the classes file and rerun; nothing else changes.

## 1. Forge's static score: the calibration curve

The side ahead by this much (its `GameStateEvaluator` score minus the other's) at the start of a turn, and how often it won. Pooled:

| Lead | 0–100 | 100–250 | 250–500 | 500–1000 | 1000+ |
| --- | --- | --- | --- | --- | --- |
| All games | 51% of 3,444 | 52% of 3,972 | 56% of 6,328 | 63% of 8,160 | 80% of 6,019 |

By class (leader's class, ahead of the other's):

| Leader ahead of | 0–100 | 100–250 | 250–500 | 500–1000 | 1000+ |
| --- | --- | --- | --- | --- | --- |
| control ahead of aggro | 32% /164 | 37% /207 | 38% /316 | 45% /367 | 88% /177 |
| control ahead of midrange | 35% /439 | 38% /572 | 37% /794 | 50% /1,081 | 74% /927 |
| control ahead of control | 56% /108 | 59% /85 | 66% /164 | 78% /226 | 94% /204 |
| aggro ahead of control | 70% /146 | 69% /205 | 65% /323 | 73% /436 | 90% /296 |
| midrange ahead of control | 67% /455 | 66% /535 | 70% /881 | 77% /996 | 81% /841 |
| aggro ahead of aggro | 49% /137 | 46% /134 | 54% /207 | 60% /329 | 75% /219 |
| aggro ahead of midrange | 53% /520 | 54% /547 | 57% /894 | 64% /1,276 | 77% /836 |
| midrange ahead of aggro | 52% /439 | 51% /490 | 58% /882 | 66% /1,051 | 74% /790 |
| midrange ahead of midrange | 50% /1,036 | 53% /1,197 | 56% /1,867 | 62% /2,398 | 82% /1,729 |

(n is turn-sides: each turn where that side led counts once.) Read: the curve is flat in the middle everywhere (a lead under 500 is close to a coin flip in every class), and **inverted for control**: a control deck ahead by up to 500 points goes on to win only about a third of the time, and the side ahead of a control deck wins about two thirds even when barely ahead.

**The caveat that matters:** these are Forge's games, and Forge pilots control badly (Azorius Control wins 13% under Forge, 41% in real play). Part of "control ahead, control loses" is the score not knowing that, and part may be the score overvaluing what control decks hold (cards in hand, untapped mana). The logs can separate the two (does the score count hand cards or open mana heavily?); that is the next cut, and it decides whether a better evaluator alone helps or the instant-speed pilot has to come with it.

## 2–3. Lead changes and the last combat

| Pairing | Games | Lead changes a game | Loser ahead at the last turn with attackers |
| --- | --- | --- | --- |
| aggro v aggro | 74 | 4.6 | 27% |
| aggro v midrange | 520 | 5.3 | 29% |
| midrange v midrange | 518 | 5.3 | 27% |
| aggro v control | 138 | 6.5 | 21% |
| control v midrange | 328 | 6.5 | 24% |
| control v control | 23 | 7.0 | 17% |

## 4–5. Unspent mana and held instants

| Deck | Mana left, own turn (all / holding a castable card) | Turns holding a castable card | Left at end of opponent's turn | Turns ending with a castable instant | …then cast something on the opponent's turn |
| --- | --- | --- | --- | --- | --- |
| **4c Control** | 4.0 / 7.5 | 42% | 2.9 | 42% | 39% |
| **Azorius Control** | 3.4 / 5.6 | 47% | 2.6 | 47% | 40% |
| Izzet Spellementals | 2.8 / 4.4 | 47% | 1.9 | 47% | 57% |
| Dimir Midrange | 2.1 / 3.9 | 30% | 1.3 | 30% | 57% |
| Izzet Prowess | 1.2 / 3.1 | 24% | 0.8 | 24% | 55% |
| Dimir Excruciator | 1.5 / 2.8 | 3% | 1.3 | 3% | 43% |
| Boros Dragons | 1.6 / 2.6 | 10% | 1.3 | 10% | 29% |
| others (aggro, Landfall) | 0.7–1.3 | 0–5% | 0.6–0.9 | 0–5% | — |

The control decks end their own turn with 3–4 mana unspent (5.6–7.5 when they hold something castable), still have 2.6–2.9 unspent at the end of the opponent's turn, and use a held instant on the opponent's next turn only about 40% of the time. That is the instant-speed gap, measured. Note "used" counts any spell cast on that turn (not whether it was the right target).

## 6. Blocks

1,783 blocks: **73% chump blocks** (the blocker dies, the attacker lives), 12% trades, 12% safe blocks, 3% neither dies. By the defender's class: aggro 79% chumps, control 85%, midrange 64%. Power/toughness at the block only (first strike and deathtouch not modelled yet), so the chump share is an upper bound.

## For the order of work

Both of the doc's conditions hold: the score is poor in the middle (so the evaluator matters) and the control decks are far from a real control deck's open-mana play (so the reactive layer matters). The control rows of the curve are the strongest single signal; I'd read them before choosing.

## Production logging

Every logged game plays through the bridge, which runs about a third slower than `forge sim` for a pairing with no pilot (24 s of play against 31.5 s for the same 20 games; the log itself adds 8%). So production logs **background jobs only by default**: the weekly calibration round robins and benchmarks (meta deck against meta deck, nobody waiting). `SIM_GAME_LOG=all` logs every brew run too. Logs land in `DATA_DIR/gamelogs/<job>/<pairing>/` on whichever machine played them, each pairing with a `meta.json`.
