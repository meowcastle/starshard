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
