# Scope: our own pilot on Forge's rules engine (12 Oct 2026)

**For:** Justin, then the Code session · **Status:** scoped from Forge's source and a working reference project, nothing built yet

## The short version

Forge lets a separate program make every decision in a game while Forge enforces the rules. There is no official "external player" in Forge, but there is a working open-source one built against our exact Forge version (2.0.15), **mtg-bench** by zachmay ([github.com/zachmay/mtg-bench](https://github.com/zachmay/mtg-bench), GPL). It is a 4,250-line Java plugin jar, not a Forge fork, that starts Forge headless, puts an external pilot in either seat, sends each decision as a JSON line over a local socket with the visible game state and the legal options, and falls back to Forge's own AI for anything the pilot declines. Our fastest path is to reuse it.

What that buys: a pilot we own and can improve, with Forge's card coverage for free forever, and a fair test (our pilot vs Forge's stock AI, same lists, same seeds).

Estimate for a usable first version: **about one working week** on the subclass route, a weekend if we fork mtg-bench's `bridge/` directly and swap its socket client for ours. The pilot's *intelligence* is open-ended after that; the plumbing is not.

## How Forge exposes decisions (confirmed from source, master at 12 Oct)

- Every player is a `PlayerController` with **112 abstract decision methods** ([PlayerController.java](https://github.com/Card-Forge/forge/blob/master/forge-game/src/main/java/forge/game/player/PlayerController.java)): priority and spell choice (10), targeting, modes, X and costs (14), mulligan/keep/bottom/play-draw/sideboard (5), attacks, blocks and damage (10), generic choices like "choose a creature", "you may", numbers, colours, scry order, discards, tutors (~45), plus notifications that can be no-ops.
- Forge ships two controllers: the AI (`PlayerControllerAi`) and the human one. The cheapest external pilot is a **subclass of the AI controller** that overrides the methods it wants and calls `super` for the rest. mtg-bench's `PlayerControllerExternal` does exactly this: 57 methods overridden, the other 55 inherited, with a guard so that when the AI is handling a decision its sub-decisions stay with the AI.
- Legal actions and mana math don't need re-implementing. Forge's AI helpers are public: which spells are castable now, whether a cost can be paid, which lands to tap, creature evaluation, and a game-state scorer with copy-and-simulate ([ComputerUtilMana](https://github.com/Card-Forge/forge/blob/master/forge-ai/src/main/java/forge/ai/ComputerUtilMana.java), `ComputerUtilCard`, `forge.ai.simulation.GameStateEvaluator`).
- Hidden information: Forge's own network layer filters what a seat may see through `CardView.canBeShownTo`. A serializer that goes through the same views is honest by construction.
- Starting headless needs no Forge patch: a `main` on the release jar's classpath calls the same five lines `forge sim` does (set the headless GUI, load the card database, make a Match, create a game, start it). mtg-bench's `AgentBridge` is that main.

## What mtg-bench already does

| Piece | What it has | Reuse? |
| --- | --- | --- |
| `AgentBridge.java` | Starts Forge headless, one JVM per match, `--deck0/--deck1 --external0/1 --games --seed --max-turns`, loop guard, turn cap | Yes, as is |
| `PlayerControllerExternal` | AI subclass, 57 decisions bridged, AI fallback with `delegated` notices | Yes |
| Protocol ([PROTOCOL.md](https://github.com/zachmay/mtg-bench/blob/main/docs/PROTOCOL.md)) | JSON lines: `decision{rid, kind, state, options[], min, max}` → `answer{rid, choice}`; kinds cover play/draw, mulligan, London bottom, priority, targets, modes, X, mana, attackers, blockers, damage, triggers, scry, surveil, search, discard, confirm | Yes; our pilot is a Node process on the other end, which fits the sim's stack |
| `StateView.java` | Per side: life, hand (own) / hand size (theirs), battlefield with tapped/sick/damage, graveyard, exile, mana pool, lands played; stack top-first; combat; recent log | Yes |
| `InputDriver` + human-controller route | Drives Forge's human controller headless so Forge validates legality as for a human | Later, if the AI-subclass route proves leaky |
| Throughput | Bots-only Bo3 "about a minute with two JVMs", so roughly 10–15 games/min per JVM; LLM-piloted ~5 min/game, 50–250 decisions/game | Expect our rule-based pilot near the bots-only figure |

License note: mtg-bench and Forge are GPL. Our bridge jar would be GPL too. Fine for a private tool; it only matters if we ever distribute it.

## The plan, in phases

**Phase 0, prove the plumbing (1 day).** Build mtg-bench's `bridge/` against our 2.0.15 jar in the Docker image. Run a Bo3 with both seats set to delegate everything to the AI. On the same seed and lists, the result must match `forge sim`. Measure games per minute on the NAS and the Mac.

**Phase 1, pilot v1 (2–3 days).** A Node process `pilot.js` speaking the protocol, answering only:
- play/draw: always play (what the AI does; now ours to change);
- mulligan and London bottom: keep/ship on lands *and* curve *and* colours, with a matchup rule (ship slow 7s against aggro, keep reactive hands against control), and bottom the worst card by a simple score rather than "toward half lands";
- sideboarding between games: hand Forge the plan we already have from `sideboard.js` (Forge's own sideboarding is off in sim mode; here the controller's `sideboard()` method runs between games, so Bo3 becomes real instead of pre-boarded lists);
- everything else: decline, so Forge's AI plays the turns.

Measure: pilot v1 vs stock AI, same lists, same seeds, both seat orders, 200 games per pairing on the top-8 field. That is the self-play metric the accuracy work order asked for, and it is what Forge's own developers use.

**Phase 2, the decisions the AI gets wrong (1–2 weeks, iterative).** Priority on the opponent's turn for reactive decks: pass with mana open when the hand holds a counter or instant-speed removal and the opponent has a castable threat; counter by *threat value* (Forge's creature evaluator plus card cost) rather than mana value alone. Attacks and blocks: start from Forge's predicted combat and veto attacks into a visible bad block. Each change is one override, A/B tested on seeds before it stays.

**Phase 3, lookahead (later).** Two options once v2 is stable. In Java, inside the controller: Forge's `GameCopier`/`GameSimulator` to score each candidate play one ply deep, which is what Forge's hybrid simulation does, but now under our rules. Or model-assisted decisions for the few that matter most and happen rarely (mulligans, sideboarding, the first main phase of a combo turn), where a model call per decision is affordable.

## How it fits the sim

- `forge.js` today spawns `java -jar forge.jar sim …`. It would instead spawn `java -cp forge.jar:bridge.jar forge.bridge.AgentBridge --port … --external0 true …` and connect `pilot.js` on the port. Game results and the full log still arrive on stdout, so `cardstats.js` and the result parser stay.
- One JVM per pairing is already how the server and the Mac worker run, so parallelism is unchanged; `worker.js` ships the bridge jar and `pilot.js` alongside Forge.
- The pilot's version string becomes part of the run record, next to Forge's, so results from different pilots never mix in calibration.
- The `tainted` flags from the accuracy order still apply: a card Forge's AI can't play is a card our pilot can't play either, until we override that decision kind.

## What this does not solve

- **The rules engine stays Forge's.** Card coverage, bugs and the daily snapshot cadence are theirs. That is the point.
- **A better pilot does not by itself make the numbers match tournaments.** It makes them match *strong play*; the calibration against real results still needs more real games, which is a separate problem (see the accuracy work order).
- **Combinatorial decisions** (damage assignment, convoke, mana combinations) are the hard corners; leave them with the AI until something measurable depends on them.

## First step

Phase 0 only: build the bridge in the Dockerfile behind a build arg, run one seeded Bo3 both ways, and record games per minute. One day, reversible, and it tells us whether the rest is a week or a month.
