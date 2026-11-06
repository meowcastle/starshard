# Engines for the Sim: What to Build On

Research doc, 12 Oct 2026 · live copy: https://claude.ai/code/artifact/3b70239e-b2e4-4792-bcbc-7bbab14be122

## The answer

**Scope:** this reads "engines" as the three layers the sim runs on, the rules engine that plays the cards, the pilot engine that makes decisions, and the data engine that turns results into calibrated numbers, and asks which to build on for each. **For:** Justin, then Code. **Status:** survey and recommendation; nothing built.

Keep Forge as the rules engine, build the pilot as our own search layer on the bridge we already have, and keep the data engine in-house. No other rules engine matches Forge on the one thing that cannot be built by us: card coverage that keeps up with Standard. The two new open-source engines built for AI research (Arcana in Rust, Argentum in Kotlin) have the agent-facing APIs Forge lacks, but one has never measured its speed or verified its 20,590 auto-generated cards against real play, and the other does not publish an implemented-card count; both are one-person projects with no releases ([Arcana](https://github.com/levineuwirth/arcana), [Argentum](https://github.com/wingedsheep/argentum-engine)). XMage has Forge-level coverage but no batch mode and an AI its own maintainers call slow and buggy. A custom engine is a year of work before it plays its first Standard deck, and then it is a card-coverage treadmill forever.

For the pilot, the evidence from Code's own runs and from the literature points the same way: rule sets do not generalise (only Azorius Control passed the mirror gate), full lookahead on Forge's evaluator is too slow, and the thing that works in every comparable game is shallow search over a small set of uncertain decisions with a cheap leaf evaluator. Reinforcement learning is not ready for this: the 2026 MTG RL benchmark covers 56 cards and five archetypes, trains for 150 GPU-hours, and its best agents still lose to a hand-written heuristic on two of five decks ([Causal RL benchmark](https://arxiv.org/pdf/2605.06066)); MageZero and the PPO forks are per-deck and retrain with every meta. LLM pilots are strong enough now to be interesting, with the top models winning 75–100% of MageBench games against the built-in AI, but at $0.40–$9 a game they are a research tool, not a production pilot for 5,000-game runs ([MageBench Season 1](https://benchmarklist.com/benchmarks/mage_bench_season1/)). Their place is the rare, expensive decisions: sideboard plans, mulligans in unfamiliar matchups, and reviewing the pilot's logs.

For the data engine, the in-house stack is already the right shape (Jiliac decklist cache, MTGGoldfish shares, empirical-Bayes calibration in `calib.js`); what it needs is the population tagging and recency weighting from the pilot-questions doc, not a new engine.

The one build that would change the picture: a learned leaf evaluator trained on our own production logs, which the Hearthstone result says beats play-outs for both strength and cost. It is a week of work, it runs on the NAS, and it is the only piece on the list where owning it buys something Forge cannot give us.

## What the sim needs an engine to do

Drawn from the accuracy research, the pilot questions, and the Standard and Limited player research. Each requirement names the layer that owns it.

| # | Requirement | Layer | Why it matters |
| --- | --- | --- | --- |
| 1 | Play every card in the current Standard, within days of a set's release, with the rules enforced correctly | Rules | Release weeks are when the sim is asked about cards nobody has tested; a missing card is a dead card |
| 2 | Run headless at 5–15 games a minute per core, seeded and reproducible | Rules | 40–200 games per pairing over a 16-deck field, every week, on a NAS and a Mac |
| 3 | Expose every decision to an external pilot with the legal options and an honest (hidden-information) view of the state | Rules + pilot | Our pilot, our rules; Forge's AI as the fallback |
| 4 | Let the pilot copy and advance the game state cheaply, for search | Rules | Flat Monte Carlo and any lookahead need it; it is the single cost driver in the current searcher |
| 5 | Give a static score of a position, with combat predicted | Pilot | The leaf of any search and the gate for "is this decision uncertain" |
| 6 | Hold up instants on purpose, keep by matchup, assign a role per matchup and turn, board between games | Pilot | The four systematic errors that make Forge underrate instant-based decks and overrate proactive ones |
| 7 | Be measurable: self-play vs stock on fixed seeds, mirror gate, per-decision logs | Pilot | Nothing ships without the mirror gate; nothing is tuned to k directly |
| 8 | Take real results from paper and MTGO, tag them by population and date, and calibrate per archetype with honest ranges | Data | k is the only accuracy number that counts; the users' population is RCQ and store, not Pro Tour |
| 9 | Know the field: metagame shares, archetype labels, sideboards, each week | Data | Deck choice is 10–30 points at a Pro Tour; the sim's product is "best positioned against this week's field" |
| 10 | Run on hardware we own, under GPL, with no per-game API cost in the main loop | All | Thousands of games a week; an LLM in the loop at $0.40–$9 a game is a research budget, not a production one |

## Rules engines compared

Forge wins on the requirement no amount of our own work can substitute for, card coverage with cadence, and it already meets the headless, seeded and external-pilot requirements through the bridge Code built. The newer engines are better designed for agents and worse at being Magic.

| Engine | Cards and cadence | Headless and speed | Agent API | Licence, health | Verdict for us |
| --- | --- | --- | --- | --- | --- |
| [Forge](https://github.com/Card-Forge/forge) (Java) | About 34,000 card scripts; daily snapshots; new sets scripted within days of spoilers by a large contributor base (74,888 commits, 2.7k stars) | `forge sim` CLI, seeded; 6 s median game in our production (10–15 games/min per core); `GameCopier` for search, costly but working | None official; mtg-bench's `PlayerControllerExternal` bridges 57 of 112 decisions with AI fallback; Phase 0 proved it matches `forge sim` at the same speed | GPL-3.0; the most active Magic engine | **Keep.** Everything we have is built on it and nothing else matches requirement 1 |
| XMage (Java) | About 32,500 card classes, comparable to Forge, maintained by a large community | Client-server; no batch or sim mode; AI-vs-AI only as test harnesses | mage-bench drives it for LLM play through a server bridge; usable but heavier than Forge's | MIT/GPL mix; healthy | A second opinion on rules bugs, nothing more; its "mad" minimax AI is slow and buggy by its maintainers' account (accuracy doc) |
| Magarena | Frozen; last release December 2019, no modern Standard cards | Fast, with the strongest open MCTS AI of its era | Built-in MCTS player | Dormant | Not usable for Standard |
| [Arcana](https://github.com/levineuwirth/arcana) (Rust, Python bindings) | 20,590 cards generated by an agentic pipeline, each passing a behavioural test; no release; one maintainer, 2 stars | Targets of 20,000 games/s single-threaded and 10 µs observation encoding, "never formally measured" | The best agent surface in the field: legal-action enumeration, information-set projection, flat Monte Carlo, PIMC, ISMCTS, learned-value leaf, Gymnasium env | MIT; the author calls its RL arcs "closed, documented negative results" | Watch. If its speed claims hold and its generated cards survive real decks, it is the engine a search pilot wants; today it is unverified |
| [Argentum](https://github.com/wingedsheep/argentum-engine) (Kotlin) | Cards as a Kotlin DSL with scenario tests, human-reviewed; per-set completion tracker but no total count published; 11,900 commits, 57 stars | Deterministic engine library; Spring server; Gym HTTP transport called a "scaffold" | Built-in search AI, optional LLM AI, Gym server for training | Licence file present, type not shown; one main author, active | Watch for the same reason; its human-reviewed card pipeline is the more trustworthy of the two, and the slower |
| [mtg-kernel](https://manifund.org/projects/reproducible-research-on-self-play-generalization-in-magic-the-gathering) (Rust) | Deterministic kernel with an XMage bridge for cross-checking; unfunded research project, no results | Unknown | Gym-style | Unfunded | Not usable |
| [Causal RL benchmark](https://arxiv.org/pdf/2605.06066) env | 56 Standard-2025 cards, five archetypes, anonymous repo | Gymnasium, Stable-Baselines3 | 3,077-dim observation, 478 masked actions | Anonymous for review | A research harness, not an engine |
| Our own engine | Zero cards on day one; every set forever after | Could be fastest | Could be best | Ours | Only if we wanted to be a rules-engine project instead of a sim; a year to first Standard deck, then a treadmill |

**What a new engine would have to beat.** Forge's weaknesses are real and all on the AI side: no official pilot API, a copy cost of a whole game per search node, an evaluator with known blind spots, and card scripts that mark some cards unplayable for the AI (`AI:RemoveDeck`). None of those is a rules problem. The bridge fixes the first; the pilot-questions doc has the plan for the second and third; the dead-card harness handles the fourth. A new engine would fix all four and lose requirement 1.

**The one scenario that changes the verdict.** If Arcana or Argentum reaches verified Standard coverage with a release and someone other than its author running real decks on it, its agent API and (for Arcana) copy speed would cut the search cost problem by orders of magnitude. The cheap way to track that: once a quarter, run our top-8 Standard field through either engine's CLI and count the cards that fail to load or play. Until that count is zero, the question is closed.

## Pilot and search engines compared

The pilot is where the sim's accuracy lives, and it is the layer with the most options. Ranked by what the evidence says each can deliver for us, at what cost.

| Approach | Strength shown | Cost per game | Maintenance | Where it fits |
| --- | --- | --- | --- | --- |
| Forge's heuristic AI (stock) | Baseline; underrates instant-based decks by 15–20 points, overrates proactive decks against them (Code's 12 Oct note) | 6 s median | None, Forge's | The fallback for every decision we have not taken over |
| Forge hybrid and full simulation | Hybrid: no gain. Full: 15x slower, processes die | 27 s a game (full) | None | Hybrid's depth-zero veto is reusable inside our search; full simulation is not |
| Hand-written rule sets (our reactive pilot) | Azorius Control 13% to 27% (real 41%); passes the mirror gate only for that deck; hurts four others | About stock | A rule per deck class, forever | Keep for the decks that pass the gate; stop writing new general rules |
| Flat Monte Carlo on `GameCopier` (ours, in progress) | 59% vs stock in the leaky run; honest run pending | 5 min a game today; 10–25 s with the three cuts in the pilot-questions doc | Ours; small | The main pilot, once gated to uncertain decisions and raced |
| MCTS with determinization ([Cowling, Ward, Powley](https://eprints.whiterose.ac.uk/75050/1/EnsDetMagic.pdf)) | 50.5% vs a strong expert-rules AI at 0.2 s a decision, searching card play only | Seconds a game | Ours | The next step after flat Monte Carlo if the card-play decision needs a tree rather than a race; same engine hooks |
| Learned leaf evaluator ([Hearthstone result](https://ar5iv.arxiv.org/html/1808.04794)) | Value network at the leaf beat full rollouts 78–82% at the same time budget | Microseconds per evaluation after training | Retrain per format change, from our own logs; automatic | The cheapest upgrade with the best evidence; replaces play-outs at uncertain decisions |
| Reinforcement learning (PPO, AlphaZero-style) | 2026 benchmark: PPO beats random, loses to a hand heuristic on 2 of 5 archetypes after 150 GPU-hours on 56 cards; MageZero one deck 16% to 66% vs XMage minimax | Training per deck and per meta; GPU | Retrain every set | Not now; the card pool and meta change faster than training cycles, and the results do not yet beat heuristics |
| LLM pilot ([MageBench](https://benchmarklist.com/benchmarks/mage_bench_season1/), [mtg-bench](https://github.com/zachmay/mtg-bench)) | Top models 75–100% vs the built-in AI over 4–16 games; mid models 50%; a game is 50–250 decisions | $0.40–$9 a game, about 5 min | None, but non-deterministic and unseedable | The rare decisions and the review: sideboard plans (already), mulligans in new matchups, and reading pilot logs for systematic errors; never the main loop |

**Why search and not learning, for now.** Three facts decide it. The card pool changes every three months and a new Standard set is 250–300 cards, which resets any learned policy's inputs; search needs no retraining, only the evaluator's features. The strongest open result on Magic specifically is still search (Cowling et al.), and the strongest RL results are per-deck or Pauper-only. And our pilot must be measurable against stock on fixed seeds, which a stochastic learned policy makes harder, not easier.

**Why a learned evaluator, but not a learned policy.** The evaluator's job is narrow: given a mid-game state, how likely is this side to win. That is a supervised problem on data we generate for free (every production game has the evaluator's features per turn and a result), it is cheap to retrain when a set lands, and it slots into the search as a leaf. Chess and Hearthstone both found that a decent value function beats rollouts; Forge's hand-written `GameStateEvaluator` is the baseline it has to beat, and its blind spots (no value for open mana, no relative creature value) are exactly the features to add.

**Where the LLM earns its keep.** `sideboard.js` already uses one, and the audit shows 91% agreement with real pilots. Two more jobs fit the same shape (rare, expensive, judgement-heavy): a mulligan oracle for matchups the rule set has not seen, consulted once per new pairing and cached; and a log reviewer that reads a losing game's decision trace and names the systematic error, which is how Code found that control decks were leaving mana unused. Both are a call per pairing or per run, not per decision.

## Data and calibration engines

The data layer is the one the sim already owns outright, and it is the one that carries the level (Q2 in the pilot-questions doc): the pilot removes systematic error, the calibration sets the numbers to the users' field. Nothing here needs a new engine; it needs the inputs widened and tagged.

| Input | Source | What it gives | Status |
| --- | --- | --- | --- |
| Real results | [Jiliac/MTGODecklistCache](https://github.com/Jiliac/MTGODecklistCache): Melee and topdeck.gg paper events, MTGO Challenges read from mtgo.com | Decklists with sideboards and standings; 1,063 games in calibration as of 12 Oct | In; needs population and date tags, archetype-label confidence |
| Metagame shares and archetype labels | MTGGoldfish (paper and MTGO), MTGTop8, Karsten's weekly Metagame Mentor tables for Regional Championships and Pro Tours | The field the matrix is run against; the labels real decks are filed under | In (Goldfish, Top8); Karsten's tables are the better archetype-share source and are hand-curated |
| Card data | Scryfall | Oracle ids, legality, the `f:standard` list for the dead-card harness | In |
| Arena data | Untapped.gg (win rates by deck and matchup, play/draw, mulligans) | The only large constructed dataset with per-game detail | Behind a login; not reachable from the sim. Worth asking whether an export exists, because it is the dataset that would settle play/draw and mulligan costs for constructed |
| Calibration | `calib.js`: per-archetype beta on log-odds with empirical-Bayes pull, k as the fidelity measure, Bo3 match formula | Honest ranges; the one accuracy number | In; add level covariate, recency half-life, per-population fits |
| Statistics stack | Node, in-process | Enough for the fits above | In; if the fits grow (per-population, per-class, time-varying), a notebook or a small Python service with `statsmodels` next to the server is the step up, not a database |

**The data engine's two jobs.** First, the weekly field: shares, labels, sideboards, from Goldfish and Karsten, which decides which pairings get run. Second, the calibration: real games tagged by population and date, fitted per archetype, reported as k with a range. Both are batch jobs that run on a schedule, and both are cheap next to the games themselves. The rule from the accuracy work order stands: never loosen the pull to make the page look calibrated, and never tune the pilot to k.

## Recommended architecture

*Diagram in the live doc: sim architecture, three layers.* In text:

```
Sim server + UI (Node, NAS) + Mac worker
   |                                  |
   v                                  v
Pilot layer (ours: pilot.js + bridge jar)  <--field-- / --logs-->  Data layer (ours: realdata.js, calib.js, meta.js)
   |                                                                  |
   v                                                                  v
Rules engine: Forge 2.0.15 (kept)                                   External sources (Jiliac, Goldfish, Top8, Karsten, Scryfall)
                                                                      |
                                                                      v
                                                                    Watch list, not built on: Arcana, Argentum, RL agents, Untapped export
```

The rules engine stays Forge and is the only layer we do not own. The pilot layer is ours and sits between the server and Forge on the bridge socket; it answers the decisions it has rules or search for and declines the rest to Forge's AI. The data layer is ours, runs on a schedule, and feeds the server two things: the field to run against and the calibration to report with. Nothing on the watch list is wired in; each has a one-line test for when it would be.

## Build plan by phase

Each phase ends on a number, and the next phase does not start until it reports. Efforts are Code-session days.

| Phase | Build | Effort | Gate |
| --- | --- | --- | --- |
| 0. Baseline (now) | Finish the honest Monte Carlo run; record win rate vs stock and seconds per game | In progress | A baseline row in the pilot benchmark table |
| 1. Affordable search | The three cuts from the pilot-questions doc: uncertainty gate, sequential halving, one-cycle horizon with `GameStateEvaluator` at the leaf | 3–5 days | Under 20 s a game; win rate vs stock within noise of the baseline |
| 2. Measured combat | Log counts (lead changes, loser-ahead, race crossings); posture rule per matchup with the hybrid veto on the top five pairings | 2–3 days | Mirror gate passed on those pairings; loser-ahead rate falls |
| 3. Calibration by population | Level and date tags on real games; paper / MTGO / pooled fits; recency half-life; k per population on the page | 2–3 days | k's range narrows; headline differs across fits by less than the range |
| 4. Dead cards at scale | Per-card harness over Scryfall `f:standard`; `dead.json`; deck check reads it; rerun per set | 2 days + 3–6 h of NAS time | Reproduces the three known dead cards; a release-week report |
| 5. Fidelity test | Three pilots (stock, gated, everywhere) on the same round robin and seeds; refit; per-class betas | 2 days + overnight runs | Control betas shrink, aggro betas do not flip; piloted numbers may become the headline |
| 6. Learned leaf | Value model on production logs (evaluator features + open mana, hand composition, deck posture) at the leaf of the search | 5–7 days | Same win rate vs stock as play-outs at a tenth of the time; retrain script runs per set |
| 7. LLM rare calls | Mulligan oracle per new pairing (cached); log reviewer that names a systematic error per losing run | 2–3 days | One new systematic error found and fixed by a rule or a search change |
| Quarterly | Run the top-8 field through Arcana's and Argentum's CLIs; count cards that fail | Half a day | Zero failures for two quarters before any port is considered |

**What this does not include.** A new rules engine, an RL pilot, or an LLM in the main loop. Each has a line above that says what would reopen it: a verified Standard-complete agent-first engine, an RL result that beats a hand heuristic on a full Standard pool, or LLM cost per decision falling by two orders of magnitude.

**Total.** About four working weeks of Code time for phases 1–7, in the order shown, with phases 1 and 3–4 able to run in parallel. The sim is usable throughout; each phase only changes what the page is allowed to claim.

## Sources

All pages opened 12 Oct 2026.

Rules engines:

- [Card-Forge/forge](https://github.com/Card-Forge/forge) (GPL-3.0, Java; daily snapshots); [Forge wiki: AI](https://github.com/Card-Forge/forge/wiki/ai); [Arcana](https://github.com/levineuwirth/arcana) (Rust, MIT; 20,590 generated cards, speed "never formally measured"); [Argentum Engine](https://github.com/wingedsheep/argentum-engine) (Kotlin; Kotlin DSL cards with scenario tests, Gym transport "scaffold"); [mtg-kernel proposal on Manifund](https://manifund.org/projects/reproducible-research-on-self-play-generalization-in-magic-the-gathering); [mtg-bench](https://github.com/zachmay/mtg-bench) (the bridge we build on); XMage and Magarena as assessed in `RESEARCH-ACCURACY-12OCT.md`

Pilots and search:

- [Cowling, Ward and Powley, Ensemble Determinization in MCTS for Magic: The Gathering](https://eprints.whiterose.ac.uk/75050/1/EnsDetMagic.pdf) (2012); [Świechowski, Tajmajer and Janusz, Improving Hearthstone AI by Combining MCTS and Supervised Learning](https://ar5iv.arxiv.org/html/1808.04794) (2018)
- [Causal Reinforcement Learning for Complex Card Games: A Magic: The Gathering Benchmark](https://arxiv.org/pdf/2605.06066) (2026; 56 cards, five archetypes, PPO vs heuristics); MageZero and the PPO fork as assessed in `RESEARCH-ACCURACY-12OCT.md`
- [MageBench Season 1](https://benchmarklist.com/benchmarks/mage_bench_season1/) (LLM win rates and cost per game, as of 28 May 2026)
- Forge source: `SpellAbilityPicker`, `GameStateEvaluator`, `GameSimulator`, PR #11436, as cited in `RESEARCH-PILOT-QUESTIONS-12OCT.md`

Data:

- [Jiliac/MTGODecklistCache](https://github.com/Jiliac/MTGODecklistCache); [MTGGoldfish Standard metagame](https://www.mtggoldfish.com/metagame/standard); [MTGTop8](https://www.mtgtop8.com/format?f=ST); Karsten's [Metagame Mentor](https://magic.gg/news/metagame-mentor-the-top-standard-decks-of-july-2026) series; [Untapped.gg](https://mtga.untapped.gg/en); [Scryfall](https://scryfall.com)

Our own docs in `mtg sim/`: `NOTE-TO-RESEARCH-12OCT.md`, `RESEARCH-ACCURACY-12OCT.md`, `RESEARCH-PILOT-QUESTIONS-12OCT.md`, `RESEARCH-STANDARD-PLAYER-12OCT.md`, `RESEARCH-LIMITED-PLAYER-12OCT.md`, `SCOPE-EXTERNAL-PILOT-12OCT.md`, `WORKORDER-ACCURACY-12OCT.md`.

Not verified: Arcana's and Argentum's card counts against real Standard decks (neither publishes a run); Argentum's licence type; the MageBench engine (not named on its page). The "about four working weeks" total is my estimate from the per-phase efforts, not a quote.
