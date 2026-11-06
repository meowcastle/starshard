# Are we solving the right problem? Method review (research, 14 Oct 2026)

Justin's question: are we chasing granular fixes while something holistic throttles us, and what can we borrow from how complex game engines and simulations are built and validated? Short answer: **yes, partly.** The engine work is real, but the instrument we judge it with can barely see the effects we are looking for, and the way we tune the pilots (one hand-written rule at a time) is the slowest known method for this kind of problem. Four borrowings fix most of it.

## 1. The throttle: our ruler is mostly noise
Computed tonight on the real matches (MTGODecklistCache, Sept–Oct, top 11 archetypes, 54 pairings with data, median 7 matches each):

- **The real per-pairing win rates are 77% noise.** Split-half reliability of the real matchup rates is 0.13 (0.23 at full size). Observed spread 15.1 points, of which 12.8 is sampling noise; the true spread of matchup edges in this format is about **8 points**.
- **The sim side attenuates k by construction.** Regressing real on sim with sampling noise in the sim estimates (errors-in-variables) shrinks the slope by true² / (true² + noise²). With an 8-point true spread, **a perfect engine would show k ≈ 0.50 at 40 games a pairing, 0.67 at 80, 0.80 at 160, 0.91 at 400.** The fidelity probes ran 20–40 games a pairing; our measured 0.06–0.09 is far below even that ceiling, so the gap is real, but the scoreboard bar of 0.40 means nothing without a game count, and every A/B this week that came back "inside the noise" was run at a size that could not have shown a 4-point effect.

That is the holistic throttle: we have been running careful experiments with a ruler that can't resolve the thing measured. It also explains why so many plausible fixes "did nothing".

## 2. Borrowings

### A. Chess engine testing: sequential tests and two stages (Stockfish's Fishtest)
Stockfish accepts or rejects every change with an **SPRT** (sequential probability ratio test): games are played until the evidence crosses an upper or lower bound, which uses the fewest expected games for a chosen error rate, and a change must pass a short screen before a longer confirmation. The cost of confirming an effect grows with 1/effect², so small effects are expensive and must be screened, not guessed.
**For us:** every pilot change goes through an SPRT on the affected decks' field win rate (H0: no change, H1: +3 points; α = β = 0.05), stage 1 on the deck's own pairings, stage 2 on the full field for side effects. Common random numbers (same seeds on both arms, already done) make it several times cheaper. This replaces fixed-size batches and the "inside noise" verdict.

### B. Fitting a simulator to data: calibration of agent-based models
The agent-based modelling field has the exact problem we have (a simulator with behavioural knobs, real-world summary statistics to match, each run expensive) and settled methods: **simulated method of moments** (choose parameters that minimise the distance between simulated and real summary statistics), **ABC**, and, for expensive simulators, **surrogate models / Bayesian optimisation** that pick the next parameter set to try. A JASSS paper shows that a regression from random runs to parameters (elastic net over many candidate statistics) degrades gracefully when runs are few.
**For us:** stop writing pilot rules one by one. Make each profile a set of **numeric knobs** (hold threshold for counter mana, sweeper trigger margin, attack-into-blockers threshold, mulligan land/curve bounds, deploy-vs-hold for finishers, end-step vs main-phase casting propensity: about 10–15 numbers), and fit them so the simulated **behaviour statistics** (the six we measure, against the human baseline) and **archetype field rates** (against real, with intervals) match. A Bayesian optimiser proposes knob settings; each proposal costs one batch; 30–60 batches converge. The rules we have written become the starting point and the knob ranges, not the end state.

### C. Sports forecasting: the sim is a prior, not the answer
The forecasting systems that work (baseball's projection systems, election and sports models) are not pure simulations; they combine a structural model with observed results in a hierarchical model, so data dominates where it is plentiful and the model fills in where it isn't. Hearthstone's best-known simulator, Bob's Buddy, simulates only one deterministic sub-problem (combat) exactly, across millions of turns, and reports its terminal-failure rate (0.005%); it never claims to simulate the whole game.
**For us:** split the product number into what the sim is good at and what data is good at.
- **Meta deck vs meta deck:** real data first (archetype rates with intervals), shrunk toward the sim where real data is thin (a hierarchical blend; the current β correction is a crude version of this).
- **A brew:** the sim's job is the **difference** between the brew and its nearest meta deck, on the same seeds against the same field; that difference is added to the real rate of the nearest deck. Paired differences are far more accurate than absolute rates (most of Forge's bias cancels, because both decks are piloted by the same AI), and that is the question a brewer asks: is this change better?
- **Validate on the right target:** does the sim get the **direction and size of card changes** right? Real lists evolve week to week; when the field adopts a swap and its results move, does the sim agree? That is a test set we already own and the metric that matches the product.

### D. Card-game AI research: don't switch engines, narrow the problem
Cowling, Powley and Whitehouse's ensemble-determinisation MCTS for Magic matched an expert rule-based player only in a cut-down game (one colour, creatures and lands, simplified combat), with careful pruning; naive search lost badly. Our own search results agree. The lesson is not "more search" but **exact simulation of narrow sub-problems** (opening hands and mulligans by goldfish; mana and colour consistency by hypergeometric math; combat math) and good heuristics for the rest. Those narrow pieces are fast, provably right and need no calibration.

## 3. What changes, concretely
1. **Fix the ruler first (this week).** Report k de-attenuated (Deming / errors-in-variables using the known sim sampling variance) alongside raw, at the archetype-vs-field level with intervals; run fidelity probes at ≥ 160 games a pairing for the decks under test (the Mac can do the top 12 at 160 a pairing, ~10,500 games, in about a night); put the game count beside every k. Replace the ship bar "k ≥ 0.40" with "de-attenuated k ≥ 0.6 and archetype MAE ≤ 4 at ≥ 160 games a pairing".
2. **SPRT gate** for every pilot change, two stages, common seeds.
3. **Knobs, then fit.** Code turns the existing rule sets into parameterised profiles (no behaviour change at the defaults); research defines the target statistics and their weights; a Bayesian optimiser drives batches overnight.
4. **Relative numbers in the product.** A brew's headline becomes "nearest meta deck's real rate + the sim's paired difference", with both shown; the coach's swap tests already are paired differences, so they become the most trustworthy numbers on the page.
5. **Narrow simulators** for mulligans, mana and opening hands, exact and instant, used both in the product and as pilot sub-routines.
6. Keep the dead-card audit and the Day of Black Sun rule; they are real coverage fixes and become knobs too.

## 4. What this saves
Rules written by hand and judged by fixed small batches are the slowest loop we could run: each idea costs a day and most results are unreadable. SPRT cuts games per decision by roughly half to two-thirds at the same confidence; fitting knobs replaces dozens of hand iterations with an overnight search; and judging brews by paired differences sidesteps most of Forge's absolute bias, which is the thing we have spent a week trying to remove by hand.

## Sources
- Fishtest FAQ (SPRT, two-stage testing): https://github.com/official-stockfish/fishtest/wiki/Fishtest-faq · SPRT (Chess Programming Wiki): https://chessprogramming.org/SPRT
- Calibrating agent-based models (JASSS 23/1/7): https://www.jasss.org/23/1/7.html · surrogate-based ABM calibration: https://arxiv.org/pdf/2609.13247
- Cowling, Ward, Powley, ensemble determinisation MCTS in Magic: The Gathering: https://eprints.whiterose.ac.uk/75050/1/EnsDetMagic.pdf
- HSReplay, Bob's Buddy: https://articles.hsreplay.net/2020/05/08/more-on-bobs-buddy/
- Noise ceiling computed from MTGODecklistCache (melee.gg, topdeck.gg), Standard, Sept–Oct 2026: `design/incoming/tools/realdata-model/ceiling.py`
