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
