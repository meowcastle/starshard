# Note to research: tonight's engine work (13 Oct 2026, late)

Four things, all measured on data we already had or on short local runs. No production setting changed. Engine identity is unchanged (`2.0.15|8aaf6ccf/a5c199f7`).

## 1. Spellementals under the pilots: keep it on Forge's play

This answers open question 2 in `ENGINE-STATUS-13OCT.md`: why Spellementals lost about 6 points under both `reactive` and `answers`. It comes from the field batches' logs (`lb2-stock`, `lb2-reactive`, `lb2-answers`).

| | Stock Forge | Under the pilots |
| --- | --- | --- |
| Games where it casts Sunderflock | 49% | 27–31% |
| Instants spent at the opponent's end step, a game | 0.65 | 0.9 |
| Creatures cast, a game | 3.3 | about 2.5 |

- **When it does cast Sunderflock it wins 67% of those games.** The payoff is what wins; the pilots starve it.
- **The cause is not the main-phase hold.** The pilots spend its instants reactively at end step, and that mana and those cards never build toward the payoff. A spells-matter deck wants its spells cast on its own turn, toward its threshold, not held as answers.
- **Production already leaves it unpiloted** (`policies.json` names only Azorius Control and 4c Control). No change is needed.
- **The lesson for profiles:** a reactive rule set is a control rule set. A spells-matter deck needs a profile of its own, one that counts toward the payoff, rather than a share of the control one. That is a design question for the profiles, not a bug.

## 2. The learned evaluator, retrained on all six batches

`tools/eval-fit.js` on every log we hold:
- 231,104 turn-sides from 6,433 games.
- Batches: the first log batch, field stock, reactive, answers, profiles, and profiles-r.
- Every fifth pairing is held out whole.

| Predictor | Log loss (a coin flip is 0.693) | Accuracy |
| --- | --- | --- |
| Forge's own score | 0.653 | 61.8% |
| Linear (13 features) | 0.607 | 68.2% |
| Linear + the two decks' classes | 0.593 | 70.4% |

**Control against midrange, linear + class** (the predicted chance for the control side, and how often it won):

| Predicted | Won |
| --- | --- |
| under 30% | 19% |
| 30–45% | 32% |
| 45–55% | 43% |
| 55–70% | 57% |
| over 70% | 70% |

Read:
- The learned score holds at about 70% with the profile games included. It did not overfit to stock play.
- It stays roughly calibrated on the matchup where Forge's own score is inverted.
- The middle bins sit a few points low for control, the same direction as the real data.
- **Still research-only.** At the search's leaf it moved k from 0.08 to 0.07 (inside noise, see the evaluator note). It judges positions well; the search it feeds only chooses main-phase plays.
- `forge-pilot/eval-linear.json` was not re-exported. Nothing in production reads it, and the new fit is within a point of the old one.

## 3. The bridge's overhead is about 10%, not 30%

This answers open question 5. The setup:
- Boros Dragons against Dimir Midrange, unpiloted, on the Mac.
- `forge sim` played 60 games; the bridge played 24 best-of-threes. Each pair ran back to back, three times.

| | Startup and between games | Inside games | Per game |
| --- | --- | --- | --- |
| `forge sim` | 5 s | 62 s | 1.03 s |
| Bridge | 6 s | 69 s | 1.13 s |

Across all three pairs the full-run gap was 11–17%, about 10% of it inside games.

The profile (thread dumps every 250 ms through a 60-match run):
- The game runs on the main thread exactly as in `forge sim`.
- Its running stacks are Forge's AI: `chooseSpellAbilityToPlay`, `getAllPossibleAbilities`, static-ability checks.
- No bridge frame shows up except the `asAi` wrapper that hands the decision to Forge.
- When a seat owns nothing, priority never crosses the socket.
- The earlier 30% was most likely measured while other runs loaded the machine.
- **Not worth an optimisation pass.** If logging every brew run ever matters for volume, the cost is about 10% plus 8% for the log itself.

## 4. Real games: the Arena pipeline

- `arena.js` turns MTG Arena's `Player.log` into our per-turn log format.
- The Mac worker watches `Player.log` and `Player-prev.log` and posts parsed matches to `/api/worker/real`.
- Opponent names never leave the Mac; they are written as "opponent".
- The brew view shows the real record beside the sim's.
- **First data:** Justin went 3–0 on Ladder with Squall.
  - Final life totals: 25 to 3, 38 to 2 and 19 to 14.
  - On the play in matches 2 and 3.
- They will be filed against the brew once the NAS rebuild that carries the route is live.
- **Three matches are an anecdote, not a rate.** The plan, as before, is a brew-level calibration bias once a brew has 30 or more real matches. Below that the real record is shown beside the sim's, never blended into it.

## Also fixed

`forge.js` `runSim` had no handler for a launcher that fails to start (no `java`, no `xvfb-run`): the spawn error was unhandled and took the calling process down, the same class as the `pilot.js` crash fixed earlier today. It now fails that run with a warning; the server marks the pairing failed. This file is not part of the engine hash, so it needs no coordinated rebuild.

## Open, for research

1. **A spells-matter profile** for Spellementals, as above: spend toward the payoff on its own turn, keep counters for what threatens the plan. Worth specifying before more decks of that shape enter the field.
2. **What the learned evaluator is for,** now that it judges well but doesn't move fidelity through main-phase search. The candidate uses:
   - the profiles' close calls (hold or tap out, judged by the score);
   - the coach's "where did this game turn" readout;
   - a blocks and instant-speed search, where the control gap actually lives.
