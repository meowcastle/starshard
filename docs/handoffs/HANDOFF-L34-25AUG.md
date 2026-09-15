# Handoff: levels 3 and 4, 25 August 2026

A working reference implementation, measured. **The live engine was not touched.** Everything
is in `research/manzil-engine-v7-l34.js`, which is `manzil-engine-v6.js` plus seven surgical
patches. Read it as a proposal to port, not as a drop-in replacement.

**Paths.** Relative to the **starshard.net repo root**. The engine this was branched from is
`Star Shard v3 Build Plan/research/manzil-engine-v6.js` at its 24 Aug state.

**Required companions.** `research/manzil-l34-options.md` §7 for the design argument,
`research/manzil-v6-conformance-24aug.md` for the measurement conventions.

---

## 0. The one-line summary

Level 3 grants a different power to each of the four quadrants of the sky, each one firing
only on the mansion's own ground, and the four together move a player carrying twelve cards
from 33.7% to 57.3% — into band on all three targets at once, for the first time.

---

## 1. Safety first: it changes nothing until a card reaches level 3

Three regression guarantees, all passing:

| check | result |
|---|---|
| the engine's own vector suite | **51/51** |
| v7 vs v6, 2,000 random boards, no card above L2 | **2,000/2,000 identical** |
| `deal()` with no standard nominated, 400 pack/seed pairs | **400/400 identical** |

The variant is a strict superset. A save file with nothing at level 3 plays the same game.

## 2. The four grants — Design owns which, Code owns how

The quadrants come from `mansions-table.json`'s `fy_god` column, unmodified. Mansion 2 is
blank there and is assigned to Byakko by position.

| symbol | mansions | grant | what it does |
|---|---|---|---|
| **Byakko** white tiger | 1-6, 28 | **the guard** | cannot be flipped by a tie |
| **Suzaku** vermilion bird | 7-13 | **the second strike** | its flip carries one slot further |
| **Seiryuu** azure dragon | 14-20 | **the turn** | may be lodged either way round |
| **Genbu** black tortoise | 21-27 | **the return** | if flipped, returns to hand instead of changing sides |

### The rule that makes it work: your power is on your own ground

**Three of the four fire only when the card is on or beside its own mansion's slot**
(`isHome`). The turn is the exception, because you choose the face at lodge time.

This was not a flavour decision, it was forced by measurement. Ungated, the four grants
together were **+42.8**, putting a pack of twelve at 76.5% — eleven points above band. Gated
to home, the same four are +23.6 and land inside every target. The gate is what turns four
overpowered abilities into a system.

It also gives `isHome` a job. Today only the Storm reads it.

### Exact code locations in v7

| grant | where | the change |
|---|---|---|
| all | after `POOL` | `QUADRANT` map + `grantOf(g, c)`, which returns null below `lvl 3` |
| turn | `makeCards` | `twoFaced: p[3] === "throne" \|\| q3 === "turn"` |
| guard | `tryFlip` | the `tie` condition gains `&& !(guard && on-or-beside home)` |
| strike | `resolve` cascade | reuses the existing mars/drum continuation, gated on `isHome` |
| return | `tryFlip` + `lodge` | `if (tGrant === "return" && !g.retUsed && isHome(...)) return "return"` |

The return is deliberately gated on **`g.retUsed`, not the card's own `came` flag**. Using
`came` lets every Genbu card in the hand return once each, which measured +16.7 on its own.
One return per board across the whole hand is the intended reading.

## 3. What it measures

Pack of twelve, 784 boards a cell. Bands: careful **55-65**, casual **35-45**, gap **20+**.

| at level 3 | careful | casual | gap | flips | close boards |
|---|---|---|---|---|---|
| nothing (today) | 33.7 | 21.9 | 11.8 | 4.86 | 28.2% |
| seiryuu only, the turn | 37.4 | 29.0 | 8.4 | 4.99 | 26.5% |
| byakko only, the guard | 34.7 | 23.7 | 11.0 | 4.86 | 27.4% |
| suzaku only, the strike | 37.4 | 24.4 | 13.0 | 5.02 | 29.2% |
| genbu only, the return | 41.7 | 23.6 | 18.1 | 5.03 | 30.9% |
| **all four** | **57.3** | **37.0** | **20.3** | 5.33 | 28.7% |

**All three bands at once.** That has not happened before in this project's measurements.

Note the four are **superadditive**: 3.7 + 1.0 + 3.7 + 8.0 is 16.4 individually, 23.6
together. Holding two quadrants is worth more than holding one twice.

### The progression stops collapsing, which was the real problem

| pack | L1/L2 only | + the four L3 grants | + L4 standard bearer |
|---|---|---|---|
| 6 | 52.2 / 28.8 | 59.4 / 36.9 | 60.7 / 32.4 |
| 12 | **33.7** / 21.9 | 57.3 / 37.0 | 54.5 / 36.2 |
| 20 | 29.1 / 16.7 | 48.7 / 36.4 | 54.0 / 31.6 |
| 28 | **21.8** / 12.1 | 49.9 / 28.6 | 48.5 / 27.6 |

The left column falls 52 to 22 as the player collects. The right column is roughly flat, 61
to 49. **Collecting mansions no longer makes you worse**, which was conformance §7's finding
and the single biggest structural flaw in the game.

## 4. Level 4 — the standard bearer

`deal(pack, seed, tonight, guarantee, standard)`. One nominated unleashed card is guaranteed
into the five alongside tonight's mansion. Passing no standard leaves `deal` byte-identical.

**One, not more.** Measured earlier at five auto-dealt cards the player holds the same five
every board, which is exactly the pack-of-five condition that made the opening solvable.

**The measurement above is a lower bound.** The harness nominates the standard mechanically
(`l4[n % l4.length]`), not intelligently. A player choosing the right card for tonight does
better than the table shows; that is the whole point of the mechanic and it is the part a
simulation cannot value.

## 5. Two things Design has to decide

**1. Byakko's guard is nearly inert at +1.0.** Home-gated it fires too rarely — a tie, on or
beside your own slot, is a narrow event. Ungated it was +11.7 and it flattened the board
(flips fell 4.86 to 3.79, which makes the game static). It needs a middle setting, and that is
a design judgement, not a number I should pick. Options: widen to any slot but only while the
card is young; or keep it home-gated and give Byakko a second, quieter effect.

This is exactly the failure mode conformance §11.2 named — four of eight existing signatures
measure inert. Do not let a fifth ship.

**2. Suzaku's strike collapses the skill gap when ungated.** At full reach it gave casual play
+20.2 and careful +12.6, narrowing the gap to 4.2, because a cascade rewards whoever swings
and greedy players swing constantly. Home-gating fixed it. If the reach is ever widened, watch
that number, not the win rate.

## 6. Not built, and why

**The Throne turning in place** needs a new kind of move — an action that consumes a turn
without lodging a card — which means changing move generation in both `youMove` and `skyMove`.
That is a larger change than these seven patches and it should be specified separately. The
Throne is mansion 10 and sits in **Suzaku**, not Seiryuu, so it is not made redundant by the
turn: twenty-one of twenty-eight mansions never gain it.

**The station opening in Star Shard** is not an engine concern at all. Zero balance cost, and
it is the only L4 reward that survives a player no longer caring about win rates.

## 7. Before any of this ships

1. **Re-run `ladder-spec.js`.** The walkers' ladder is built on `cardstrength.json`, which was
   measured against v6. Cards at L3 change the ranking.
2. **Run the differential.** `v6diff.js` against v7 with nothing above L2 must stay at
   2,000/2,000, and it is the check that catches a bad port of these seven patches.
3. **Decide Byakko** (§5.1) before the slate is locked.
4. **Git: report only, do not commit.** Standing choice, unchanged.
