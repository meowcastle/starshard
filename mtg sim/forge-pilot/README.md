# forge-pilot

A bridge that lets our own pilot make some of a Forge player's decisions while Forge's AI
makes the rest. Phase 0 of `../SCOPE-EXTERNAL-PILOT-12OCT.md`.

`bridge/` is the Java bridge from zachmay/mtg-bench (GPL-3.0, `LICENSE`), copied at upstream
commit `0870cb69a15f785ccc9d1dfcfd147491f177ed83` (4 Oct 2026) and reviewed before use: its
only network use is one connection back to the harness on the loopback address, and it
writes no files. `InputDriver`, `AgentGuiGame`, `AgentControllerHuman` and
`LobbyPlayerAgentHuman` are upstream's human-controller spike, loaded only with
`--human true`; we don't use them.

Our changes, each marked `starshard:` in the source:

- `--own kind,kind,...`: the decision kinds the pilot owns. Every other kind goes straight
  to Forge's AI with no round trip, so the rest of the game plays as `forge sim` does.
  `--own none` hands everything to Forge.
- An answer may carry `"delegate": true` (Forge's AI decides). Upstream treated a missing
  answer to an attack, a block or a mana payment as a forfeit (no attack, no block, cast
  cancelled), which is right for scoring an agent and wrong for us.
- `--matches N`: N matches in one process, match i seeded with seed + i.
- `--type`: the game type, Constructed by default as `forge sim` plays (upstream: Draft).
- `build.sh` compiles from a path with spaces.

Build: `bridge/build.sh <forge-gui-desktop-…-jar-with-dependencies.jar>`
→ `bridge/build/mtg-bench-bridge.jar`. Run with Forge's install directory as the working
directory:

    java -cp <forge jar>:<bridge jar> forge.bridge.AgentBridge --port P --token T \
      --deck0 a.dck --deck1 b.dck --external0 true --external1 true --games 3 --seed 42 \
      --max-turns 60 --stops all --own mulligan,play_draw --matches 14

The protocol is JSON lines over the socket: `hello` (token), `decision` → `answer`
(`choice` ids, or `delegate`), `between_games` → `answer`, `game_start`, `game_end`
(winner, onThePlay, turns, reason, log), `match_end`.

## Phase 0 result (12 Oct 2026)

With `--own none` (Forge's AI makes every decision through the bridge), five meta pairings
played ~35–40 games a side each way, against `forge sim` with the same lists. Deck A's game
win rate: 21% vs 28%, 88% vs 88%, 66% vs 78%, 37% vs 23%, 57% vs 53%. No gap is
significant, and together they're what chance gives (p ≈ 0.6), so the bridge adds no
bias of its own.

Speed: Forge's start-up is ~6 s and a game ~2-3 s, so one best-of-three per process spent
half its time starting. `--matches N` plays N matches in one process (match i seeded
seed + i): 14 matches ran at 1.66 s a game against `forge sim`'s 1.53 for the same pairing,
one process each, start-up included.

## Phase 1 (12 Oct 2026)

`../pilot.js` runs matches through the bridge and owns, per seat, mulligans (`pilot.keep`:
2-5 lands, 2-4 at six cards, only with a spell those lands can cast early) and real
between-game sideboarding: Forge calls `PlayerController.sideboard` before games 2 and 3, and
the bridge asks the pilot for the new main deck (`sideboard` → `answer { main: {name: qty} }`).
Checked in the game logs: a boarded-in card appears only in games 2-3, the card it replaced
only in game 1. `--own0`/`--own1` set the owned kinds per seat.

Self-play, the pilot's mulligans against Forge's, mirror decks, seats swapped, fixed seeds,
12 decks: 50% of 489 games (likely 49-51%). No stronger, as expected: the two rules disagree on
only a few opening hands in a hundred (7-card keeps 79% vs ~81%), and Forge always choosing
to play is already right for Standard. A first run read 34%; that was a bug (our card cache
keeps no `produced_mana`, so every hand looked uncastable and went to five).

## The reactive probe (12 Oct 2026)

Forge underrates the decks built on instants (Azorius Control 19% under `forge sim` vs 38%
real; Dimir Excruciator 29% vs 49%) and overrates the proactive ones (Lifegain 70% vs 45%,
Boros Dragons 72% vs 47%). `pilot.js`'s `reactive` policy owns a control seat's priority:
counter their creature, planeswalker or 2+ mana spell; kill an attacker with instant
removal; play the land, and don't spend below a held counter's cost. Forge decides the rest.
`tools/probe-reactive.js`, every real-data pairing, ~37 games a variant, through the bridge:

| | real | Forge decides | reactive | mirror, pilot vs stock |
|---|---|---|---|---|
| Azorius Control | 38% | 9% | 17% | 69% of 71 |
| 4c Control | 50% | 41% | 39% | 57% of 70 |

k over the 36 pairings: 0.02 → 0.04, inside noise. The pilot makes Azorius Control much
stronger and closer to real; 4c Control (fewer counters, wants to tap out) doesn't move.
Two decks can't move k, and the other half of the gap is the aggro decks Forge overrates.
The bridge baseline (9%) sits below the calibration's 19% because the calibration's boarded
games used sideboard plans and the probe's lists carry no sideboards; compare pilot to stock
on the bridge only.

### Second pass (12 Oct 2026, evening)

`tools/dead-cards.js` found cards Forge never casts though no script hint says so: Azorius
Control's 4 Countersculpt (its extra "behold a Jace or pay {1}" cost) and 4 Jace's Machinations
(no AI logic), Bant Airbending Combo's 4 Appa, Steadfast Guardian (flash creature never cast),
plus the already-flagged Springleaf Drum. The policy gained rule 4 (their end step: instant
removal on a creature, then the biggest spare instant or flash card). Against the live
calibration (51 pairings):

| | real | Forge decides | reactive | mirror, pilot vs stock |
|---|---|---|---|---|
| Azorius Control | 41% | 13% | 27% | 82% of 66 |
| 4c Control | 49% | 41% | 40% | 62% of 69 |
| Dimir Excruciator | 50% | 32% | 37% | 47% of 70 |
| Bant Airbending Combo | 22% | 28% | 41% (32 games) | 38% of 72 |

k 0.06 → 0.10 (−0.01 to 0.22). The rules make the control decks stronger and Azorius closes
half its gap to real; they don't help Dimir Excruciator's mirror and make the combo deck
weaker. A rule set has to be per archetype and earn its place in its own mirror.

## Search (research, 12 Oct 2026; not used in production)

Forge's own full look-ahead isn't the route: in the mirror against stock it won 11 of 24
games that finished, 15x slower, and processes died mid-run (16 of 40 games never finished).

`Search.java` is our own: flat Monte Carlo on a seat that owns `search`. At its main-phase
plays with a real choice (land drops stay Forge's), each candidate (pass, each spell or
ability, Forge's own pick among them) is played out on copies of the game (Forge's
GameCopier): plain Forge AI on both sides, the searcher's first choice forced, libraries
reshuffled, for `--search-turns` turns, then scored as my position minus the opponent's
(Forge's GameStateEvaluator; a win or loss ±3000). Forge's pick stands unless another beats
it by `--search-margin` standard errors (default 2). Known shortcuts in this version: copies
see the opponent's real hand; candidates are base abilities only. About 5 minutes a game at
6 play-outs (the first version). `tools/mirror-gate.js ... search` measures it against stock in the mirror.

### Making it affordable (13 Oct 2026)

Since the first version, copies deal the opponent a random hand from their hidden cards (no
peeking), and three economies were added (`Search.choose`): a screen (each move scored once
to the end of this turn; a clear leader by more than `--search-screen` points skips the
play-outs, otherwise only moves within that distance go on), sequential halving within a
total `--search-rollouts` budget, and `--search-turns 1` (one full turn cycle). Same four
decks, mirror vs stock, 8 matches a half, seeds fixed (a rerun reproduces game for game):

| Settings | Win rate vs stock | 95% range | Seconds a game |
| --- | --- | --- | --- |
| 4 play-outs a move, 4 turns, no screen (baseline) | 57% of 168 | 49–64% | ~80 |
| budget 16, 1 turn, no screen | 60% of 161 | 53–68% | ~57 |
| budget 16, 1 turn, screen 50 | 57% of 159 | 50–65% | ~36 |
| budget 16, 1 turn, screen 150 | 53% of 165 | 46–61% | ~35 |
| **budget 8, 1 turn, screen 50 (now the default)** | **57% of 161** | **50–65%** | **~18** |

The horizon cut was free; a loose screen (150) was the one cut that cost strength. The
default keeps the baseline's strength under the 20 s target. Per deck it is still mostly
noise at this sample (48–63%), so no deck clears the 55% gate on its own yet.
