# v6 conformance: the rejection is upheld

*22 August 2026, reply to the conformance rejection of `manzil-v6-check.md`.*

**You were right and the report's numbers do not count.** My port was unfaithful, the
headline was sign-reversed, and I did not run the vectors because I did not know the suite
existed — `manzil-sim-brief.md` and `manzil-engine-v6.js` live in the Build Plan folder's
`research/`, and the brief I was working from was the root's `ENGINE-BRIEF.md`. That is an
explanation, not an excuse: the vectors exist and the report should have found them.

---

## 1. The vector run you asked for

`research/v6vectors.py` ports all 33 vectors to Python and runs them against
`research/manzil_v6.py`.

**As submitted: 31/33.** The two failures were the two mechanics I had knowingly not
implemented, and both make the player stronger:

| vector | why it failed |
|---|---|
| the gate takes the lead | `mkGame`'s opening rule was absent. My port had no notion of the Gate stealing her lead. |
| the return comes home once | My `resolve` dropped the returned card instead of handing it back. |

The vectors caught two more that they do not test for, found while porting:

- **The Glance never fired.** In the engine `playBoard` sets `glanceOn` automatically after
  you lodge it. I had it filed as player-activated and never set it.
- **Her move had a tiebreak the reference does not have.** I carried the deployed
  `_skyMove`'s positional nudge `(l+r)*0.1 + (8-i)*0.01` into the port; the reference engine
  has no nudge and takes the first best on a strict `>`. My casual agent also broke ties at
  random where the reference is deterministic.

All four ran the same direction: **against the player.** That is the sign reversal.

**Fixed: 33/33.** The agents are now line-for-line ports of `youMove` / `skyMove` /
`playBoard`, the deal is the exact xorshift, and the Gate, the Return and the Glance work.

## 2. The fixed port reproduces the reference exactly

Your config: her hand `[101..105]` at depth 8, `makeCards({lvl:2})`, twelve
`[6,10,17,18,5,4,3,19,7,26,12,14]`, careful `youDepth 8`, casual `youDepth 0`, 28 nights ×
seeds 1-8 × both leaders = 448 boards.

| cell | my report (bad port) | reference engine, node | **my fixed port** |
|---|---|---|---|
| pack of 5, careful / casual | 60.1 / 45.1 | 73.2 / 26.8 | **73.2 / 26.8** |
| pack of 12, careful / casual | 43.9 / 28.1 | 71.2 / 47.1 | **71.2 / 47.1** |
| pack of 12, no guarantee | 46.0 / 26.2 | 68.5 / 50.4 | **68.5 / 50.4** |
| her depth 8 · 12 · 14 · 24 | flat ~45 past 11 | 71.2 · 71.2 · 71.2 · 71.0 | **71.2 · 71.2 · 71.2 · 71.0** |

Every cell agrees to the decimal. The ports are now one engine.

## 3. Two of your four rows do not reproduce on your own engine

> **RETRACTED, same day.** Both rows reproduce. The variable is **hand order**: the engine's
> agents are deterministic with a strict `>` tiebreak, so the card list is consumed as a
> sequence, not a set. Your 62.5 / 37.5 is exact on the build's chart-five order
> `[5,6,10,17,18]`; I had used `[6,10,17,18,5]`, the first five of your twelve — same five
> cards, **11 points apart**. Your depth row reproduces on the *sorted* twelve (71.0 · 67.4 ·
> 67.2 · 66.5 against your 68.3 · 67.0 · 67.0 · 66.5, tail exact) rather than the as-listed
> one. My apologies for the accusation. Full working in
> `research/manzil-district-check.md` §4, which also argues the brief should pin the ordering
> or randomise the tiebreak, since eleven points hiding in list order is a property of the
> harness rather than of the game. The section below is left as written for the record.

Your **pack of 12** rows reproduce exactly — 71.2 / 47.1 and 68.5 / 50.4 — which is what
confirms I read your config correctly. Two do not:

| your row | you reported | the engine gives |
|---|---|---|
| pack of 5, careful / casual | 62.5 / 37.5 | **73.2 / 26.8** |
| careful at her depth 8 → 12 → 14 → 24 | 68.3 · 67.0 · 67.0 · 66.5 | **71.2 · 71.2 · 71.2 · 71.0** |

The depth row is internally inconsistent with your own table: its depth-8 cell reads 68.3
while the pack-of-12 row reads 71.2 for the same configuration. And the pack-of-5 row cannot
carry seed variance at all — `deal` returns the pack unchanged at five, so all eight seeds
give the same hand and only 56 distinct boards exist. Both of your figures are exact
fifty-sixths (35/56 and 21/56), as are mine (41/56 and 15/56), so this is a real
disagreement and not rounding.

Not a challenge to the verdict, which stands. Worth a re-run on your side before either row
is used.

## 4. What the corrected numbers say

**You are right about the direction and my #1 recommendation is withdrawn and inverted.**
At a pack of twelve she is too soft, not too hard: careful **71.2** against a 55-65 band and
casual **47.1** against 35-45. Both above.

**"Collecting makes you weaker" is wrong up to twelve and right past it.** Pack sweep on the
reference:

| pack | careful | casual | skill gap |
|---|---|---|---|
| 5 | 73.2 | 26.8 | **46.4** |
| 8 | 73.9 | 45.8 | 28.1 |
| 10 | 64.7 | 47.5 | 17.2 |
| **12** | **71.2** | **47.1** | **24.1** |
| 16 | 59.8 | 31.0 | 28.8 |
| 28 | 38.8 | 26.8 | 12.0 |

Careful play is flat from five to twelve and then falls off a cliff: 71.2 at twelve, 38.8 at
twenty-eight. **The twelve cap is load-bearing, not cosmetic.** The middle is bumpy because
composition matters as much as size — pack of 10 reads 64.7 and pack of 12 reads 71.2 on the
same twelve minus two cards.

**What the deal actually does is halve the skill gap: 46.4 at five, 24.1 at twelve.** That is
the honest description, and it is the same trade the randomness research measured for the
dealt five (38.1 → 22.3 on the old build). It buys an unsolved opening and pays for it in
skill expression. 24.1 is still above the 20 target, so the price is affordable.

**Her depth dial does nothing for careful play and does move casual**, which splits the
difference between us:

| her depth | 8 | 10 | 12 | 14 | 18 | 24 |
|---|---|---|---|---|---|---|
| careful | 71.2 | 69.9 | 71.2 | 71.2 | 71.0 | 71.0 |
| casual | 47.1 | 44.6 | 42.9 | 41.7 | 40.8 | 41.1 |

"Four settings, not nine" overstated it for casual, as you said. For careful it *understated*
it: the dial is flat across the entire range. Whatever tunes her against a strong player, it
is not this.

## 5. The opening: worse at five than I reported, better at twelve than you might hope

Forced-opening scan on the reference engine, deterministic agents, player leading:

| | best opening | perfect nights | openings winning all 28 nights |
|---|---|---|---|
| pack of 5 | **the storm at slot 3, 100.0%** | **28 of 28** | **2 of 54** |
| pack of 12 | the chamber at slot 6, 93.8% | 17 of 28 | 0 of 117 |

My report said 98.8% and zero openings at a pack of five. **That was the broken port
flattering the build.** The truth is that the game is still fully solved for a five-card
pack — the Storm at slot 3 wins every board on every night, exactly as the Throne at slot 8
did before.

At twelve the deal does its job but less cleanly than my bad port suggested: 93.8% with 17
perfect nights is not a book, but it is not far from one either.

So the structural flag survives and gets sharper. You called it "a flag, not a fire" because
early game routes through the road rather than her table. That holds. But the flag is that
**the deal is off by default** — a player who has not built a pack past five is playing the
solved game — and the fix is one line: make the starter pack twelve rather than five, or
have `deal` fire at any pack size.

## 6. The guarantee

Careful 71.2 with, 68.5 without. Casual 47.1 with, 50.4 without. Mixed sign, as you said:
it helps careful by 2.7 and costs casual by 3.3. My "costs two points" is withdrawn. Keep it
for the reason it was always for.

## 7. Withdrawn, and what still needs doing

**Withdrawn from `manzil-v6-check.md`:** §1 in full (the twelve is not below band, and the
"collecting makes you weaker" delta was sign-reversed between five and twelve); §5's
guarantee cost; §2's pack-of-five exploit figures, which were too kind.

**Still standing:** the pack ≤5 deal bypass, now with a 100% opening behind it. The depth
floor. The observation that the depth dial is coarse, sharpened to *flat for careful*.

**Unverified and mine to redo:** §3's walker-rung reorder and the rung-8-to-sky cliff. Walker
hands live in the prototype, not the engine, so the conformant port cannot reach them
directly. I have the eight hands from the deployed `index.html` and can re-run them through
the fixed port on request; the reorder would then be a pure data change as you say.

**One ask back.** `manzil_v6.py` now passes the suite and matches the reference to the
decimal, but the vectors only cover mechanics — nothing in them constrains `youMove`,
`skyMove` or `playBoard`, which is where my three worst divergences lived and where any
future port's will too. Three agent-level vectors would close that hole: a fixed board with a
named best move at `youDepth 0` and at `youDepth 8`, and one full board from a fixed hand
with an expected final count.

---

## Files

- `research/v6vectors.py` — the 33 vectors in Python, runnable against any port.
- `research/manzil_v6.py` — fixed; 33/33 and cell-exact against the reference.
- `research/conform.py`, `conform.js`, `conform2.js`, `conform3.js` — the comparison runs
  and the forced-opening scan.
