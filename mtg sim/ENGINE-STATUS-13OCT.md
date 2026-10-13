# Forge Sim engine: where it stands (13 Oct 2026, evening)

From Code, for research to review. Everything specific to the engine: how games are played, what our pilot changes, what the logs measure, what each experiment found, what is live, and what is open. The page, coach copy and design work are out of scope here except where they read engine output. Commits are on branch `mtg-sim`; the detailed write-ups are the dated NOTE-TO-RESEARCH files in this folder and `forge-pilot/README.md`.

## 1. How a game is played

**Forge 2.0.15 is the rules engine and the default player.** Every game is Forge's AI against Forge's AI unless our pilot takes some decisions for one seat.

Two ways a pairing is played:

| Path | When | What it is |
| --- | --- | --- |
| `forge sim` | 1v1 pairings with no pilot and no log, and all Commander pods | Forge's own command-line simulator, `-n` games, 120 s clock a game |
| The bridge | A deck with a pilot, or a pairing being logged | `forge-pilot/`, mtg-bench's GPL bridge (upstream 0870cb6) with our changes: Forge runs the game, and at each decision asks our pilot over a local socket; a decision the pilot doesn't own goes straight back to Forge's AI with no round trip |

**Bridge parity (Phase 0):** with Forge deciding everything, the bridge's results match `forge sim` within noise (5 pairings, p ≈ 0.6). Speed: 1.66 against 1.53 s a game in the Phase 0 pairing; measured again today on an unpiloted pairing, **31.5 s against 24.3 s of play for the same 20 games (about 30% slower)**, the log adding another 8%. The overhead is in the bridge's per-decision plumbing and has not been profiled.

**What our changes to the bridge do** (`forge-pilot/README.md` has the list): decision kinds owned per seat (`--own0/--own1`, the rest delegated); Constructed by default; many matches per process (`--matches`, match *i* seeded seed + *i*, so any one replays); Forge's per-game clock (a timed-out game is a draw); player names and log captions as `forge sim` writes them, so one parser reads both; between-game sideboarding through Forge's own sideboard hook; the play-out search (§4); the per-turn log (§5); the no-chump block rule (§3.4). Source is compiled as UTF-8 (the container defaulted to ASCII), and the build skips macOS `._` metadata files.

**Forge facts that shape everything below:** Forge's AI always chooses to play first. It mulligans only on 0–1 lands, all lands, or 6+ of 7. It plays any deck named "Control" (or with average mana value over 3) with its non-aggro profile, which reserves mana for instants. Its position score (`GameStateEvaluator`, §5.3) has no term for open mana.

## 2. Measuring against real results

**Calibration** (`calib.js`): on every meta pairing with both Forge games and real tournament results, Forge's error is fitted as a per-deck bias on the log-odds scale (logit F − logit R = β_A − β_B), ridge-pulled toward zero, the pull estimated from the data. A brew's matchups are corrected with the β of the meta deck it reads closest to.

**Fidelity** (`calib.fidelity`): real results fitted as logit R = k · logit F. k = 1 means Forge's matchups carry over as they are; 0 that they carry nothing. **Live: k = 0.07 (−0.05 to 0.18) on 1,063 real games** (Melee paper and MTGO Challenges, the last 42 days), deck-strength correlation r = 0.52.

**Fixed today:** the β solver was coordinate descent, which stalled along the all-decks-shift direction when a deck's evidence far outweighs the pull (found by the new test: betas right relative to each other, all 0.35 high). It is now an exact solve. On the live fit the largest change is 2 × 10⁻⁸, so no number moved, but it would have mattered as real data grows.

**Tests** (`npm test`, 15): `score.js` against hand-worked numbers (best of three, top 8, a 60-game range, play/draw correction, uncounted matchups), `calib.js` on pairings with known betas and k, and durable saves (ten kill -9s mid-save).

## 3. Our pilot

### 3.1 What runs in production

| Deck | Pilot | Why |
| --- | --- | --- |
| Azorius Control | `reactive` | The only deck that passes the mirror gate with it (82% in its own mirror against stock Forge) |
| Any deck holding a card Forge never casts | `deadcards`: casts only those cards (Countersculpt, Jace's Machinations, Appa, Steadfast Guardian on 2.0.15) | The dead-card finder |
| Everything else | Forge's AI | — |

`SIM_PILOT=0` turns it off. Every job records its **engine identity**: Forge version, pilot rules tag (a hash of `policies.json` and `dead-cards.json`), pilot code hash (`pilot.js` and the bridge's Java source). A worker on another engine is refused at claim and at report; benchmarks are reused only by runs on the same engine. Live engine: `2.0.15|0e428316/a5c199f7`.

### 3.2 The rule sets (`pilot.js`)

- **`reactive`** (12 Oct): (1) counter the opponent's spell that matters; (2) instant removal on an attacker; (3) in my own main phase, play the land and don't spend below counter mana; (4) at the opponent's end step, removal on a creature, else the biggest spare instant.
- **`answers`** (13 Oct): `reactive` without rule 3.
- **`tapout`** (13 Oct, the tap-out control profile): on the opponent's turn as `answers`; in my own main phase play the land, then a sweeper only against 3+ creatures (2 at 10 life or less), else the biggest castable non-counter spell, permanents first.
- **`deadcards`**: only the cards Forge never casts.
- **Mulligans** (`keep`, Phase 1): keep 2–5 lands (2–4 at six) only with a spell castable early from the hand's own colours. Self-play 50%: Forge's mulligans are less bad than the docs assumed.

### 3.3 Mirror gate results (pilot on one seat against stock Forge, the same deck on both sides; pass = 55%+ with the range above 50%)

| Rule set | Result |
| --- | --- |
| `reactive`, all 20 meta decks (12 Oct) | Only Azorius Control passes (72–82%); it hurt four decks (Boros Dwarves 37%, Lifegain 40%, Jeskai Control 40%, Dimir Midrange 41%) |
| `answers` | Azorius Control 72% of 68 (passes); 4c Control 41% of 73 (fails) |
| `tapout` | 4c Control **51% of 69** (fails the bar, but the first rule set that doesn't play 4c worse than Forge; against the field it moves 4c 45% → 47%, §5.4) |
| play-out search (§4), four decks | 57% pooled; no single deck passes at ~40 games |
| no-chump blocks, eight decks | every deck 48–50%: no effect (§5.4) |

### 3.4 Blocks

`pruneChumps` (bridge, off unless a seat owns `nochump`): Forge declares its blocks, then a block where the blockers die and the attacker lives (first strike, double strike, deathtouch, indestructible counted) is removed unless the damage it stops is needed to stay above 5 life. It changed nothing because Forge's chump blocks are almost all forced (§5.4).

## 4. Play-out search (research only)

`Search.java`: flat Monte Carlo at main-phase decisions with a real choice (land drops stay Forge's). Each candidate is played out on copies of the game (Forge's `GameCopier`): Forge's AI on both sides, the searcher's first choice forced, libraries reshuffled, the opponent's hand re-dealt from their hidden cards, for one turn cycle; scored as my position minus the opponent's (Forge's evaluator, a win or loss ±3,000). Forge's choice stands unless another beats it by 2 standard errors. Screening and sequential halving keep the cost down.

| Settings | Win rate against stock (mirror, 4 decks) | Seconds a game |
| --- | --- | --- |
| 4 play-outs a move, 4 turns | 57% (49–64%) | ~80 |
| budget 16, 1 turn, no screen | 60% (53–68%) | ~57 |
| budget 16, 1 turn, screen 50 | 57% (50–65%) | ~36 |
| **budget 8, 1 turn, screen 50 (default)** | **57% (50–65%)** | **~18** |

**Fidelity with search on both seats** (51 real pairings): k 0.06 → 0.08, inside noise; Azorius Control 13% → 20% (real 41%), Dimir Excruciator unchanged. Search decides main-phase plays; the control gap is instant-speed play. **Search stays research-only.** Forge's own full simulation was also tried: 11 of 24 finished games, 15× slower, processes dying.

## 5. The per-turn game log

### 5.1 What it records

`GameLog.java` (bridge `--log <dir>`): one gzipped JSON-lines file per game, built from Forge's game events, so it records the same whoever decides. About 4 KB a game.

| Record | Contents |
| --- | --- |
| `game` | match, game, the two deck names |
| `turn` | turn, active seat; the board (each permanent's seat, kind, tapped, sick, power/toughness, keywords, loyalty, counters, mana value); each seat's view (life, poison, library, graveyard, exile, hand size, lands, untapped lands, and its **own** hand only); Forge's `GameStateEvaluator` score for each seat |
| `cast` | every spell and ability put on the stack: seat, card, spell or ability, stack depth, mana value, kind (creature, planeswalker, instant…), instant speed |
| `attack` | attackers (power, toughness), untapped defenders |
| `block` | each block: blocker and attacker power/toughness and combat keywords (first strike, double strike, deathtouch, indestructible, trample) |
| `combat` | life change and creatures lost per seat |
| `turn_end` | per seat: untapped lands, mana available, what it could still have cast (instants marked), hand size |
| `end` | winner, turns, who was on the play, reason, final life |

**Two properties checked:** no hidden information (each view carries only its own hand; no library order). **The log does not change the games:** its checks call Forge AI code that draws from the shared random generator, which changed 2 of 12 games in the first version; each record's work now runs with the generator's state saved and restored, and the same seeds give identical games, 12 of 12.

**In production:** background jobs only (the weekly calibration round robins and benchmarks), because logged games go through the bridge (§1). `SIM_GAME_LOG=all` logs every brew run; `off` none. Logs live in `DATA_DIR/gamelogs/<job>/<pairing>/` on whichever machine played them, each pairing with a `meta.json` (decks, mode, phase, engine).

### 5.2 Tools

`tools/log-batch.js` (every pairing among the top N meta decks, with `POLICY=reactive|answers|tapout|profiles`), `tools/log-stats.js` (the six statistics, split by pairing class, the calibration curve by class, `--json`), `tools/score-parts.js` (what Forge's score is made of), `tools/deck-classes.js` (plan and class per meta deck, from `plan.js`).

### 5.3 What Forge's position score is made of

Fitted on 29,000 logged turns (R² 0.93; decided positions, which Forge scores ±2³¹, left out). Per item, as Forge weighs it:

| Item | Points |
| --- | --- |
| a land | ~295 |
| a creature | ~190, plus ~46 a point of toughness and ~5 a point of power |
| any other permanent | ~125, plus ~37 a point of mana value, whatever it does |
| a card in hand | ~10 |
| a point of life | ~3 |
| open mana | no term (the source: `TODO evaluate holding mana open for counterspells`) |

**The control inversion explained:** when a control deck "leads" a midrange deck by 0–500 points (and goes on to win 37%), the lead is lands +131, non-creature permanents +71, creatures −57, hand +1, life −3. Not hand cards or open mana: lands and non-creature permanents priced by mana value while the board is lost.

### 5.4 The batches

All on the top 12 meta decks of the Oct 12 field, every pairing, fixed seeds. Batch 1: 10 best-of-threes a pairing, 1,603 games. Batches 2–5: 6 a pairing, ~960 games each, same seeds across the four.

**Forge's score as a predictor** (the side ahead by this much at the start of a turn, how often it won; stock batch 1):

| Lead | 0–100 | 100–250 | 250–500 | 500–1000 | 1000+ |
| --- | --- | --- | --- | --- | --- |
| all games | 51% | 52% | 56% | 63% | 80% |
| control ahead of aggro | 32% | 37% | 38% | 45% | 88% |
| control ahead of midrange | 35% | 38% | 37% | 50% | 74% |
| aggro ahead of control | 70% | 69% | 65% | 73% | 90% |
| midrange ahead of control | 67% | 66% | 70% | 77% | 81% |
| midrange ahead of midrange | 50% | 53% | 56% | 62% | 82% |

A lead under 500 is a coin flip in every class, and inverted for control. Lead changes: 5.7 a game (4.6 aggro mirrors, 7.0 control mirrors).

**Instant-speed play, stock against the pilots** (batches 2–4):

| Measure | Stock | `reactive` | `answers` | Target (research) |
| --- | --- | --- | --- | --- |
| Azorius: mana left after the opponent's turn | 2.7 | 1.8 | 2.0 | under 1.5 |
| 4c: the same | 3.4 | 2.1 | 2.1 | under 1.5 |
| Azorius: a held instant used after the opponent cast a creature or planeswalker | 45% | 86% | **90%** | over 70% |
| 4c: the same | 48% | 67% | **75%** | over 70% |
| 4c: mana left at the end of its own turn | 4.6 | 3.3 | 3.4 | (tap-out profile's target) |
| aggro decks' unspent mana | 0.7–1.3 | unchanged | unchanged | unchanged |

**Win rates against the other 11** (~160 games a deck, ±8 points of noise):

| Deck | Stock | `reactive` | `answers` | Real |
| --- | --- | --- | --- | --- |
| Azorius Control | 16% | 25% | 26% | 41% |
| 4c Control | 45% | 39% | 41% | 49% |
| Dimir Excruciator | 34% | 28% | 34% | 50% |
| Izzet Spellementals | 47% | 41% | 41% | |
| Dimir Midrange | 50% | 56% | 59% | |
| Mono-Green Landfall | 51% | 60% | 63% | |
| Boros Dwarves | 74% | 66% | 66% | |

With `reactive`, the control-ahead-of-aggro inversion goes (49–64% under 1,000 points); control ahead of midrange stays inverted under every pilot (33–41%).

**Blocks:** 74% of Forge's blocks are chump blocks with keywords modelled (control defending 93%). Of 794 chumps, 622 (78%) were against attacks that would have been lethal, 120 (15%) would have taken life under 5, 52 (7%) were unneeded. Forge's chumps are a symptom of losing, not a blocking error.

**Attacks:** with the defender holding no untapped creatures, Forge attacked with nothing on 7–11% of turns and held some back on 4–5% (this count includes creatures that couldn't attack); 1% of attacks lost creatures for nothing. Combat looks reasonable on both sides.

**Batch 5, profiles by plan** (plan.js decides: 4c Control `tapout`, Azorius Control `answers`, every other deck stock Forge; 965 games):

| Deck | Stock | `answers` on every deck | Profiles by plan | Real |
| --- | --- | --- | --- | --- |
| Azorius Control | 16% | 26% | **31%** | 41% |
| 4c Control | 45% | 41% | **47%** | 49% |
| Dimir Excruciator | 34% | 34% | 32% | 50% |
| Izzet Spellementals | 47% | 41% | 46% | |
| Jund Sacrifice | 47% | 41% | 47% | |
| Dimir Midrange | 50% | 59% | 50% | |
| Mono-Green Landfall | 51% | 63% | 47% | |
| Boros Dwarves | 74% | 66% | 72% | |
| Lifegain | 72% | 72% | 70% | |

4c Control under `tapout`: mana left at the end of its own turn **4.6 → 2.5**; after the opponent's turn 1.9; a held instant used after a creature or planeswalker 81% of 68. Azorius under `answers`: 89% of 284; 2.1 left after the opponent's turn. The first configuration that moves both control decks toward their real rates without moving any other deck outside noise: the profiles touch only the decks whose plan calls for them. (The curve's class rows in this batch use plan.js's classes, which split tempo from aggro, so they are not comparable row for row with batches 1–4; control ahead of midrange is still inverted, 34–51% under 1,000 points.)

**Batch 6, the same with Azorius Control on `reactive`** (same seeds): Azorius 26% (42 of 159) against 31% (50 of 159) under `answers`; every other deck within two games of batch 5. `answers` keeps its lead, and research's rule takes it either way (the smaller rule set, the one the draw-go profile is built on). **Production from 13 Oct evening: Azorius Control `answers`, 4c Control `tapout`.**

## 6. Reading decks: tags and plans

**Tags** (`tags.js`): Scryfall's Tagger, which is a search filter (`otag:`), not a card field: one search per tag over the Standard pool, cached weekly (about 40 requests). Tags that exist in Standard and are used: removal, counterspell, bounce, board-wipe, card-advantage, draw, cantrip, burn, ramp, mana-rock, lifegain, tutor, discard, recursion, reanimate, self-mill, sacrifice-outlet, landfall, protection, anthem. Plus rules on the card: threat, engine, evasive, tokens, instant, spell, discard-payoff, finisher (wins/loses the game, 5+ damage to a player, or a creature/planeswalker of mana value 5+), and answer/counter/sweeper/card-advantage/reach wordings for untagged cards. Research's curated file (`curated-standard-13oct.json`) adds finisher, finisher-enabler, engine, combo-piece and combo-enabler per meta deck, by exact name, by alias only when the list holds half the entry's cards, and for a brew with no name by the entry whose cards it holds most of. **Coverage: 86% of the top-20 lists' nonland cards carry a Tagger tag**; the 31 untagged are in `UNTAGGED-TOP20-13OCT.json`.

**Plans** (`plan.js`): rules on the tag counts and curve name the plan (landfall/sacrifice/lifegain engine, draw-go or tap-out control, discard-as-value, disrupt-and-clock, evasive or go-wide aggro, spells-matter, engine midrange, fast combo), each with its reason; the nearest meta deck by distance over the tag counts, the same plan preferred. **All 20 meta decks land on research's plan** (the thresholds were set on those 20, so the next snapshot is the real test; Bant Airbending reads as combo only by its name until its pieces are re-curated). The full table is in `NOTE-TO-RESEARCH-13OCT-PLANS.md`.

**What's missing** (`plan.missing`): research's per-plan ranges flagged 14 of the 20 tuned lists on their own, so a count is flagged only when it is outside the plan's range and at least 2 lands or 4 cards further out than the nearest same-plan meta deck. No meta deck is flagged.

**In production:** every 1v1 brew version gets a reading (plan, nearest meta deck, what's missing), stored on the version and redone when the calibration field changes; the run payload carries it and the coach is told how the list reads. Live check: the Squall brew reads as a lifegain engine, closest to Lifegain, nothing missing.

## 7. Other engine-side checks

- **Functional deck check** (`functional.js`): land count and colour sources against Karsten's verified table (interpolated by land count; untapped sources for one-drops; spell/land MDFCs 0.4 of a land), flagged only when off what field decks of that curve run and off the nearest meta deck. No meta deck flagged; catches a list 3 lands light or 8 red sources short.
- **Dead-card finder** (`tools/dead-cards.js`): plays each meta deck and lists spells never cast.
- **Draws:** 0 of 5,763 production games; median game 6 s; slowest pairing 59 s against a 120–180 s clock.

## 8. What is live (13 Oct, after the last rebuild)

| Piece | State |
| --- | --- |
| Engine | Forge 2.0.15; pilot rules `0e428316`; code `a5c199f7`; NAS and Mac worker on the same |
| Pilots | **`answers` for Azorius Control and `tapout` for 4c Control** (accepted by research's field-test gate, 13 Oct evening), `deadcards` where they apply; the calibration round robins play both on both seats |
| Logging | background jobs (calibration round robins, benchmarks) |
| Readings | plan, nearest meta deck, what's missing on every 1v1 brew version, in the coach |
| Search, no-chump | built, off |

## 9. Open questions for research

1. **The control-ahead-of-midrange inversion survives every pilot.** §5.3 says it is the score pricing lands and non-creature permanents. Is the right next step the learned evaluator (on logs from accepted profiles, as research set out), or a cheap correction to the score first (discount lands past what the deck needs and non-creature permanents by what they do) to see how much of the inversion it removes?
2. **Spellementals lost about 6 points under both `reactive` and `answers`**, so its cost is not the main-phase hold. Counter-their-spell (countering the first spell rather than the one that matters to its plan) or end-step spending are the suspects. Its profile (spells-matter) is the natural place to fix it.
3. **Unspent mana after the opponent's turn stays about 2.0 for both control decks** under every pilot against a target of 1.5. Is 1.5 right for Forge's card pools (what does a draw-go deck have to spend at end step in these lists), or does end-step spending need a broader rule (activate abilities, cycle, flash creatures)?
4. **Production pilots.** Research asked that the round robins run with accepted profiles on both seats once one passes. None has passed by the mirror bar except `reactive` on Azorius. Should a profile go to the round robins on field-batch evidence (closer to real rates without hurting other decks) rather than the mirror bar, given that mirror strength and fidelity are different things?
5. **The bridge's 30% overhead** is unprofiled. If logging every brew run matters for training volume, it is worth an afternoon to find.
6. **Population.** k is fitted on paper and MTGO together, last 42 days. Research's population question (which field to calibrate against, recency weighting) is still open and is the stop signal research named if strength rises and k doesn't.
7. **Curation still owed:** Bant Airbending's pieces from the live list (in `NOTE-TO-RESEARCH-13OCT-PLANS.md`); hand tags for the 31 untagged cards; Temur Omniscience when it reappears in the field.

## 10. Files

| File | What |
| --- | --- |
| `forge.js` | runs a pairing (`forge sim` or the bridge), engine identity, pilot selection |
| `pilot.js` | the bridge harness and every rule set |
| `forge-pilot/bridge/src/forge/bridge/` | the bridge: `AgentBridge`, `PlayerControllerExternal` (decisions, sideboarding, `pruneChumps`), `Search`, `GameLog` |
| `forge-pilot/policies.json`, `dead-cards.json` | production pilot assignments |
| `calib.js`, `score.js` | calibration and fidelity; a run's numbers |
| `tags.js`, `plan.js`, `curated-standard-*.json` | card tags, plans, research's curated lists |
| `functional.js` | the deck check |
| `config.js`, `store.js` | settings; durable saves |
| `tools/` | probes, gates, batches, statistics |
| `test/` | `npm test` |
