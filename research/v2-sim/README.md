# research/v2-sim/: the Manzil v2 simulator

The simulator, the vectors, the gate runner, the results and the reports for the TCG
rebuild (`MANZIL-TCG.md`, packets in `docs/BACKLOG-V2.md`). Everything here is Python 3,
standard library only. Nothing here is a traveler-facing surface.

## Layout

- `base/`: the 22 August sim pack, extracted untouched from
  `research/manzil-loop/sim-pack-22aug.tgz` (P0.1). `manzil_v6.py` is the port of the
  deployed engine, `manzil-engine-v6.js` the JS reference it conforms to, `v6vectors.py`
  the 33 conformance vectors, `v6run.py` the bands, `v6exploit.py` the opening scan,
  `drama.py` the drama proxies, `manzil-loop/` the August result files. Read it, do not edit
  it; later engines are compared against it.
- `engine_v1.py`: `base/manzil_v6.py`, byte for byte (P0.2). The baseline every v2 engine
  is measured against. Do not edit it; `engine_v2.py` is where the mechanics go.
- `vectors_v1.py`: runs the 33 vectors against `engine_v1.py` (or any engine named on the
  command line) from this folder, without touching the suite in `base/`.
- `vectors_agents.py`: the 33 plus three agent vectors (youMove, skyMove, playBoard), 36
  in all, every expectation from the JS reference. `agents_ref.cjs` writes those
  expectations to `vectors_agents.json` (run it again only if the reference changes; the
  repo is `"type": "module"`, so the script loads the engine by hand as CommonJS).
- `gates.py`: one command for vectors, bands, the forced-opening scan, the drama proxies
  and the leader solve, printing a pass or fail table. For a moving-sky engine the solve
  is the engine's own, capped at `SOLVE_CAP` nodes a call; the six-set night does not fit
  this shell (see the 4 November report), so solve parts from a longer run elsewhere are
  read as they are, `solved` false when the budget ran out. It runs in parts
  (`--part bands5`, `--part solve-sky-15`, ...) saved under `results/parts/<engine>/`, and
  `--assemble` builds the table from them; with no flag it runs every part and assembles.
  The night shift's shell kills a process at 180 seconds, so there it runs part by part:
  vectors and bands5 together (about 50 s), bands12 (45 s), scan (60 s), three you-leads
  solves a call (about 45 s each), two sky-leads solves a call (60 to 100 s each).
- `engine_v2.py` (S1 onward): the v2 engine, one mechanic per packet, each behind a flag,
  each with its own vectors. S1, the Moving Sky (`MOVING_SKY = True`): nine stations
  visible, the leftmost sets and is banked at the end of every round, the next rises on the
  right with her planet already standing on it when it is that planet's home, six sets a
  night and then dawn, a card scoring when its station sets and never when it is placed.
  The v1 primitives are imported unchanged, so the 33 pass against it. `python3
  research/v2-sim/engine_v2.py 7 sky` plays one night aloud. Its game surface (new_game,
  legal_moves, place, pass_turn, play_board, finish, Solver, solve_empty) is what
  `gates.py` drives when an engine declares `MOVING_SKY`.
- `vectors_s1.py`: the 33, seventeen Moving Sky rule vectors authored by hand from the
  spec, and three agent snapshots of engine_v2 itself (`vectors_s1.json`, refreshed with
  `--snapshot` only when the engine is meant to change; they are the expectation C2's JS
  port must meet, not conformance to an outside reference).
- `s1_watch.py`: the watch length as a dial (3 to 10 sets) on both packs, with the leader's
  share of careful boards. `s1_variants.py`: two re-scopes pre-tested as monkeypatches over
  engine_v2 (the lead alternating by round; the rising station arriving empty).
- `results/`: `gates-<engine>-<stamp>.json` from each assembled run, `parts/` beneath it,
  `baseline_v1.json` (the v1 numbers a v2 engine's drama proxies are held to) and
  `gates-engine_v1-run.log`, the 3 November run that licensed the baseline.

## How to run it

    python3 research/v2-sim/vectors_v1.py              # 33/33 against the baseline
    python3 research/v2-sim/vectors_agents.py          # 36/36, the agents too
    python3 research/v2-sim/vectors_s1.py               # engine_v2: the 33, the S1 rules, the snapshots
    python3 research/v2-sim/gates.py                   # the whole gate, engine_v1
    python3 research/v2-sim/gates.py engine_v2         # a v2 engine against the bands and the baseline
    node tools/writing-lint.mjs <file>                 # the house style
    node tools/noun-ledger.mjs v2/                     # the vocabulary law

From inside `base/`, the August scripts still run as they did: `python3 v6vectors.py`.
The scripts in `base/` that write results write to `/home/claude/`, the August machine's
home; they are kept for the record and `gates.py` writes under `results/` instead.

## The bands

Careful play wins 55 to 65 percent of nights, casual play 35 to 45, with a skill gap of 20
or more; no single opening wins all 28 nights; drama proxies (lead changes, comebacks,
close finishes) at or above v1. The known v1 numbers the gate runner must reproduce before
it is trusted are in `docs/BACKLOG-V2.md` P0.3 and in `research/manzil-v6-conformance.md`
section 2 (the configuration that gives 73.2 / 26.8 on the pack of five is written there:
her hand 101 to 105 at depth 8, the chart five in the order `[6,10,17,18,5]`, careful at
depth 8, casual at depth 0, 28 nights, seeds 1 to 8, both leaders). Hand order changes
the number; the harness pins it.

## Versions

Recorded at P0.1, 3 November 2026, in the Mac's Cowork VM where the night shift runs:
node v22.23.4, Python 3.10.12.
