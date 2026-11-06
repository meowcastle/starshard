# v2/: the Manzil TCG rebuild

The engine and the playable build for Manzil v2, the trading card game laid out in
`MANZIL-TCG.md`. Nothing in this folder touches the live September game
(`Star Shard v3 Build Plan/`, served at `/play`); the two share the sky, the cards and the
cookie, and nothing else.

## What goes here

- `engine/` (C2 onward): the JS reference engine, a port of the Python simulator that
  passed its gates, with the same vectors.
- `play/` (B1 onward): the playable build, on the shell's token sheet and the V2 scenes.
- `README.md`, this file.

Until C2 the folder holds only this file. The rules are simulated first, in Python, under
`research/v2-sim/`; a mechanic reaches this folder only after it has passed the bands, the
exploit scan and the drama proxies there. The order and the gates are in
`docs/BACKLOG-V2.md`.

## How to run it

Nothing to run yet. When `engine/` lands: `node v2/engine/vectors.mjs` runs the vectors;
when `play/` lands: `npm run build:v2` and open `v2/play/dist/`.

## Laws that apply

`CLAUDE.md`; `WRITING.md` (no em dashes in anything a traveler reads); the vocabulary law
from `COSMOLOGY.md` (one new noun per surface, and only for a thing astrology has no word
for; every new noun is queued for Justin before a traveler reads it); the ethics floor from
`research/game-ethics.md`; `STARSHARD-LAUNCH.md` section 0 (the shipped game is the finish
bar) and section 2 (the look). Lints: `node tools/writing-lint.mjs <file>` and, from P0.5,
`node tools/noun-ledger.mjs v2/`.
