# Manzil: sim brief

For a coding agent with a Python or JS runtime. Everything needed to run the experiments is
in this project; nothing has to be inferred from prose.

## Start here

1. `research/manzil-engine-v6.js` is the ruleset. It is a port of `Manzil - Prototype.dc.html`
   as shipped, and it is the reference implementation for anything you build.
2. Run `runVectors()` first. **37 vectors, all must pass.** They cover the three base laws,
   dominion, jupiter, saturn's locked ground, one per signature, and four agent-level
   anchors (both agents' moves on a fixed board, her move, one full playout) that constrain
   `youMove` / `skyMove` / `playBoard`. If you re-implement in
   another language, port the vectors too, and do not report a number until they pass.
   This is not ceremony: the previous sim round measured a build two days stale and its
   headline finding described code that no longer existed.
3. `research/manzil-v6-handoff.md` has the current state and what replicated.
4. `Manzil - Rules & Cards.dc.html` is the printed ruleset; `Manzil - Signature Pass.dc.html`
   is the per-card record with the measurement behind each wording.

Node usage:

```js
const E = require("./research/manzil-engine-v6.js");
console.log(E.runVectors().filter(v => !v.pass));         // expect []
const C = E.makeCards({ lvl: 2 });                        // all signatures awake
const hand = E.deal(PACK, seed, tonight, true);           // five from a twelve
E.playBoard({ C, tonight, you: hand, sky: [101,102,103,104,105],
              leader: "you", depth: 8, youDepth: 8 });
```

`depth` is her reading depth (the two-ply reply weight). `youDepth` is the player agent's:
8 is the careful player, 0 is the casual one. `makeCards({ legacyBase: true })` reproduces
the pre-22-August numbers, `{ lvl: 1 }` puts every signature to sleep, `{ silence: id }`
silences one card for an ablation.

## Reading the numbers

Percentage of **boards** won. Careful play is the 2-ply agent, casual is 1-ply. Two seeds
minimum, and report boards per cell. Deltas travel between ports; absolutes do not.

**Target bands: careful 55-65, casual 35-45, skill gap above 20.**

Where the shipped game sits now — canon, 22 Aug, two ports cell-exact: her planets at
depth 8, `deal` from the stand-in twelve, seeds 1–8, both leaders, 448 boards/cell. At
pack ≤5 the deal never fires and hand ORDER moves the result (~11 pts), so name it:

| | careful | casual | gap |
|---|---|---|---|
| shipped twelve, signatures awake | 71.2 | 47.1 | 24.1 |
| twelve, guarantee off | 68.5 | 50.4 | 18.1 |
| chart five `[5,6,10,17,18]` (no deal) | 62.5 | 37.5 | 25.0 |
| the twelve's first five `[6,10,17,18,5]` | 73.2 | 26.8 | 46.4 |

**Both bands sit above target at the twelve: she is too soft at her table**, and her
reading depth is flat for careful play from 8 to 24, so depth is not that lever. The deal
buys the unsolved opening by halving the skill gap (46.4 undealt → 24.1 dealt); the twelve
cap is load-bearing (a 28-pack reads 38.8 careful, pack 16 reads 59.8). A five-card pack is
fully solved: the storm at slot 3 wins all 28 nights.

Both bands are at their lower edge. The player agent is a plain 2-ply that cannot use the
hand or the guide, so treat careful as a floor.

## The experiments, in order of what they unblock

### 1. Which twelve is the starter twelve

The twelve above is a stand-in: `[6, 10, 17, 18, 5, 4, 3, 19, 7, 26, 12, 14]`. It ships with
its signatures awake and is a new player's whole first impression, so it decides whether the
opening week reads as a game or a slot machine.

Sweep candidate twelves for: careful and casual in band, a gap above 20, no single opening
winning on more than about a third of the 28 nights, and no card in the twelve measuring at
zero when ablated out of it. Report the best three with their per-card ablations.

Constraint: the five chart-owned mansions (5, 6, 10, 17, 18) are always owned, so they are
in every candidate.

### 2. The nine rungs of the walkers' road

An unclaimed mansion's night is eight walker boards then the sky herself. Difficulty comes
only from how far ahead she reads: giving her ties or the lead was measured to shrink the
skill gap, which makes the game luckier rather than harder, and both are banned.

Currently authored, not measured: `[3, 4, 5, 6, 7, 8, 9, 11]` across the eight rungs, 14 at
the sky, 10 for walkers on a claimed night, 12 at her table.

The known caveat: reading depth is clean when her signatures are set aside but **non-monotonic
with them live**, and her five planet signatures are worth about 23 points on their own. Untangle
those two before proposing rung values. Then find a ladder where a beginner is in band on the
low rungs and a veteran is in band at the top, and say which rung each of those players tops out on.

Useful range is 8 to 24. Below 8 she is a different opponent, not a weaker one: a purely
greedy sky wins *more*.

### 3. What levels 3 and 4 are worth

Numbers are now frozen: every card carries what used to be its L3 value from its first night,
and levelling only wakes the signature at L2 and then wears the printed labels off the face.
That leaves L3 and L4 with no mechanical content, and it un-prices the old target of
"level 4 on everything takes about a year."

This is a design question the sim can inform: measure what each candidate is worth before it
is written. Candidates worth testing are sharpening the signature rather than the numbers
(a condition loosening, a reach extending), moving levels from the card to the mansion, and
collapsing to two levels. Anything that puts numbers back on a level ladder is out: that is
the thing the re-baseline just removed.

### 4. Double-blind placement

Both sides commit a placement at once. It scored the highest night-to-night variety in the
whole study, 29.7 against 18.0, and adds no luck, but her heuristic is reactive and would need
rebuilding, no agent models the bluffing that is the entire point, and the previous exploit
scan for it was defective. Whether an opening book survives is **unmeasured**. Treat as
research, not a candidate.

### 5. The Moonstone, if you get this far

`Manzil - The Moonstone.dc.html` is the paper design for a doubling cube. It was held until a
dealt hand existed, because a stake mechanic needs shared uncertainty and the sky is a fixed
heuristic against a public ephemeris. The deal now exists, so the earlier measurement
(match-level skill gap 59.5 without the cube, 58.2 with it, matches shortened from 3.78 boards
to 3.08) is worth repeating on the dealt hand before ten paper matches are played.

## Rules that are settled, and are not for tuning

- Ties flip, both ways, and a card taken by a tie attacks both its own neighbours.
- Tied counts at the end of a board are yours.
- A card's two numbers never change.
- Dominion: a card on its own mansion counts two, and the ground keeps that weight whoever
  holds the card. Jupiter counts two everywhere, three on his own mansion.
- She is deterministic. Where her arithmetic ties, a date seed breaks it: the same for
  everyone tonight, different tomorrow. Nothing else is random except the deal.
- The 28 road-shards are never skill-gated. Winning is not required to collect a mansion.
- The 4-or-more flip floor is retired. Flips stay a diagnostic; do not spend skill gap buying
  them. Use lead changes, comeback wins, average margin, and boards decided by one card.

## What to hand back

Deltas against the table above, boards per cell, seeds used, and the vector run. For any
proposed change, the ablation that isolates it. If a finding contradicts something in the
rules sheet, say so plainly and name the vector that proves it.
