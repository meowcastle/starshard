# Handoff: Code, 25 August 2026

The balance system, specified. Separate from `HANDOFF-CODE-24AUG.md`, which covers accounts
and is unaffected by anything here.

**Paths.** Relative to the **starshard.net repo root**, not the Build Plan folder. Both have a
`research/` directory and they are different. The reference engine is
`Star Shard v3 Build Plan/research/manzil-engine-v6.js`.

**Required companion.** `research/manzil-v6-conformance-24aug.md`, sections cited inline.

---

## 0. The one-line summary

Delete two dials that do nothing, add one that does everything, and put a floor in the deal so
collecting cards stops making the player worse.

---

## 1. First, the port is fixed and there is now a harness — use it

`research/manzil_v6.py` was non-conformant against your 24 Aug engine: **it disagreed on 58%
of boards** (167/400), because it still carried all ten of the `"you"` hardcodes you made
symmetric. Fixed, plus one your vector suite never caught:

> `skyMove` never saw the pending glance. In JS the agents read `g.glanceOn` and `g.retUsed`
> off the game object; the Python `sky_move` and `best_you_reply` took neither as a parameter.

**Conformance now: 33/33 vectors, 2,000/2,000 boards across depths 0-16, 400/400 on `deal()`.**

`research/v6diff.js` + `v6diff.py` + `gen_cases.py` are a differential harness: the same random
boards through both engines, comparing winner, both counts and flips. It constrains
`youMove`, `skyMove` and `playBoard` end to end, which closes open item 8. **Run it after any
engine change** — that is the whole point of it:

```
python3 gen_cases.py 77 2000
node v6diff.js ./manzil-engine-v6.js > js.json
python3 v6diff.py cases.json > py.json      # then compare
```

## 2. Delete the reading-depth dial

Her search depth is flat from 5 to 22 (conformance §8): the strong player moves 0.2 points
across that whole range, the weak player 0.0.

1. **Remove the `+ this._mlvl(tonight) * 2` term** at `Manzil - The Empty District.dc.html:2571`.
   Levelling a card does not make its road harder; that term is inert.
2. **The rung's depth number is also inert.** `[3,4,5,6,7,8,9,11]` and the boss's 14 are
   producing no gradient. Difficulty must come from the hands.
3. Keep a fixed depth (8 is fine) for everyone. It is not a tuning parameter.

## 3. Add the hand-size dial

Player always holds five. What she holds is the entire difficulty system (conformance §10.1):

| her hand | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|
| weak cards, asleep | 96.9 | 90.2 | 79.0 | 69.6 | 68.3 |
| mid cards, awake | 97.3 | 83.0 | 69.6 | 59.4 | 54.5 |
| strong cards, awake | 81.3 | 58.5 | 37.9 | 28.1 | 23.2 |

**The rule to implement:**

- **Level sets her hand size.** L1 = 5, L2 = 6, L3 = 7, L4 = 8. Levels 3 and 4 are bookmarked
  but reserve the sizes.
- **Rung sets how many of her cards are strong-tier and awake**, 0 at rung 1 climbing to all
  of them at the sky. That single variable runs 84.6 down to 60.7 at a hand of five and is the
  only one that moves cleanly.
- **Tonight's mansion is always in her hand.** Kept, at the cost of mansions differing in
  difficulty, which is now the intended design (§5 of the Design handoff).

Do **not** build the rungs by walking the weak/mid/strong tiers. Tried, and four adjacent
pairs came out statistically identical because the weak and mid tiers barely differ.

**The generator is written and measured: `research/ladder-spec.js`.** Run it and it emits
`research/ladder-l1l2.json`, all 504 hands (2 levels x 28 mansions x 9 rungs) with a win rate
for each. The rung table it implements:

| rung | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (sky) |
|---|---|---|---|---|---|---|---|---|---|
| strong cards in her hand | 0 | 1 | 1 | 2 | 2 | 3 | 3 | 4 | all |
| of those, awake | 0 | 0 | 1 | 1 | 2 | 2 | 3 | 4 | all |

Tonight's mansion always sits in her hand and fills the first strong slot; the rest are picked
by a hash of (mansion, level, rung), so a given road always deals the same walkers. A strong
card *asleep* is the half-step that turns six usable steps into nine.

Measured, 784 boards a rung: **level 1 runs 93.0 down to 64.0 and is monotone across all nine.**
Level 2 runs 83.8 down to 47.8 with two ~1.5 point bumps at rungs 2 and 5, both inside noise.
Level 2 is harder than level 1 at every rung.

**Re-run `ladder-spec.js` after any change to the signature slate** — it is built on the
ranking in `cardstrength.json`, and fixing the four inert signatures will move it.

The tier lists and the wider recipe space (99.6% down to 31.7%, indexed by hand size, tier and
awake count) are in `research/grid.json` and `research/fullgrid.json`.

## 4. Put a floor in `deal()`

Collecting mansions currently makes the player worse. Growing from five cards to twelve costs
careful play 25.7 points, and waking all of them recovers only about eleven (conformance §7).

Add a minimum number of signature-live cards to the five dealt, alongside the existing
tonight's-mansion guarantee:

| pack | shipped | floor 3 |
|---|---|---|
| 12 | 36.8 / 18.6 | **47.6 / 24.3** |
| 28 | 31.1 / 14.7 | **42.6 / 21.6** |

**Floor of three.** Floor 1 is worth nothing and floor 2 is half the effect. Worth about +11
careful at both pack sizes. `research/dealfix.js` has the exact implementation used to measure
it — same xorshift, one extra guarantee pass before the random fill.

This does not restore the pack-of-five number and nothing will. It stops the collection curve
collapsing as the player grows toward 28, which is the arc the game is built on.

## 5. Do not make the walker battles best-of-N

Measured (conformance §9), lead alternating as the game does it:

| format | strong player | weak player | boards |
|---|---|---|---|
| best of 1 | 69.1 | 33.4 | 1.00 |
| best of 5 | 69.3 | 29.1 | 3.94 |

**Four times the boards for 0.2 points of skill expression, and six points off the weak
player.** `randomness-theory.md` §5.3 predicted amplification because it assumed independent
boards; they are not, because the lead alternates and the lead is worth a lot.

If a longer match is ever wanted, **the lead has to stop alternating** — fix it or randomise
it — and the amplification becomes real. Until then, single boards for the eight walkers.

## 6. Pin the hand ordering

The agents are deterministic with a strict `>` tiebreak, so the order the five are handed over
is worth **17.9 points to careful play and 25.0 to casual** on identical cards (conformance
§4). It is larger than anything else on the tuning list and it is still unaddressed.

**Either pin the ordering in the brief or randomise the tiebreak.** Until one of those, any
single-configuration measurement carries about ±9 points of free variance and two honest runs
can disagree without either being wrong.

## 7. Starter pack

One line, and it unblocks Phase 0: **the starting pack is six, and the sixth card ships
awake.** Below six the deal never fires and the opening stays solved.

## 8. Ownership and sequencing

- The engine and `deal()` are yours. The signature slate and the card set are Design's.
- `Manzil - The Empty District.dc.html` is a Design artifact. §2's one-line deletion at 2571
  needs to go through Design or be explicitly handed to you for that file, in a cycle where
  Design is not in it.
- **Git: report only, do not commit.** Standing choice, unchanged.
