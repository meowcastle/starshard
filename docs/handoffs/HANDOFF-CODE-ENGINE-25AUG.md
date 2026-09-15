# Handoff: Code — the engine, 25 August 2026

A work order, in dependency order. **Item 1 blocks everything else** and that is not a
stylistic preference, it is because tuning against the current engine is tuning against
±18 points of noise.

Evidence: `research/manzil-v6-conformance-24aug.md` and the appendices of
`research/../docs/handoffs/HANDOFF-GAMEPLAY-25AUG.md`. Reference implementations are in
`research/`; **the live engine was not touched.**

**Paths — corrected 25 Aug after Code's review.** Two `research/` directories exist and they
are different, and the original wording here got it backwards. To be exact:

- **`Star Shard v3 Build Plan/research/manzil-engine-v6.js`** is the reference engine. That one
  file, and only that one, lives in the Build Plan folder.
- **Everything else cited in this document lives in the repo-root `research/`** — the v7
  engines, `cardstrength.json`, `dealfix.js`, `ladder-spec.js`, `ladder-l1l2.json`,
  `gen_cases.py`, `v6diff.js`, `v6diff.py`, `sig28-all.json`, and
  `manzil-v6-conformance-24aug.md`.

The conformance doc **does exist**, at `research/manzil-v6-conformance-24aug.md`. A search of
the Build Plan folder will not find it, which is what the original wording caused.

**The shipping engine** is `research/manzil-engine-v7-tiebreak.js`. It is
`manzil-engine-v6.js` plus the changes below, and it passes **51/51 vectors**.

**Git: report only, do not commit.** Standing choice, unchanged.

---

## Sequencing — take items 1-4 now, hold 6 and 7

Your list splits into two kinds of work, and mixing them wastes a pass.

**Corrections. No card dependency, and they never need redoing:**
items **1** (tiebreak), **2** (the two v6 bugs), **3** (depth deletion), **4** (starter pack).
None of these care what is printed on the cards.

**Calibration. Will need redoing if the slate changes:**
items **6** (the ladder) and **7** (levels 3 and 4). Both are tuned against
`research/cardstrength.json`, which ranks cards by measured strength. Design is about to
rewrite eighteen dead signatures, which **rewrites that ranking**: the strong/mid/weak tiers
move, every rung's difficulty moves, and the level-3 grants were calibrated against a slate
where two thirds of the cards do nothing. Build them now and you build them twice.

| phase | you | Design |
|---|---|---|
| **1, now** | items 1, 2, 4 — then re-measure | starts the slate rewrite |
| **2** | item 5 (the deal), and port the ladder *generator*, not its output | slate continues |
| **3, sync** | re-run `cardstrength.js`, regenerate the ladder, port levels 3 and 4, calibrate | slate lands |
| **4** | item 8 (PvP) | |

**Item 1 is not just yours.** Until the tiebreak lands, Design cannot measure whether a
rewritten card works either — every number carries about ±18 points of noise. Getting it in
quickly unblocks both sides.

**Item 3 goes to Design.** The line 2571 deletion is inside
`Manzil - The Empty District.dc.html`, which they own and are about to be working in. Let them
remove it as part of their pass rather than scheduling a Design-free cycle for one line.

## 1. The tiebreak — do this first, alone, and re-measure after

**The bug.** Both agents used a strict `>`, so among equally-scored moves whichever came
**first in hand order** won. On one representative board **eighteen moves tied for best** and
the engine chose between them by hand position.

**The cost.** The same five cards in a different order swing the win rate by **17.9 points for
careful play and 25.0 for casual**.

**The fix.** Break ties on a stable hash of the move itself rather than its position:

```js
function moveKey(g, id, i, rev) {
  let h = (((id * 73856093) ^ (i * 19349663) ^ ((rev ? 1 : 0) * 83492791)
            ^ ((g.tonight || 1) * 2654435761)) >>> 0);
  h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
  return h >>> 0;
}
// then at both agent sites:
const key = moveKey(g, id, i, rev);
if (best === null || score > best.score || (score === best.score && key > best.key))
  best = { id, i, rev, score, r, key };
```

Two sites: `skyMove` and `youMove`. `bestYouReply` compares scalars and needs no change.

**Result: the spread goes from 17.9 to 0.0.**

**Three vectors will fail** — "the careful agent's move", "her move on the same board", and
"a full board plays out". All three are agent-level and all three were verified to be genuine
ties, so they encoded hand order rather than correctness. Re-baseline them to `10@8`,
`104@1` and `you/7/4`. Back to 51/51.

**And then stop and re-measure.** The old tiebreak was systematically picking the *worse* of
the tied moves, so the player gets 4 to 11 points stronger everywhere. Item 4's starter pack
number and Item 6's ladder were both re-measured after this landed; anything else tuned
before it needs redoing.

## 2. Two bugs in the shipped v6 engine

**2a. `skyMove` cannot turn a two-faced card.**

```js
// shipped:
const revs = g.C[id].ab === "mercury" ? [false, true] : [false];
// fixed:
const revs = (g.C[id].ab === "mercury" || g.C[id].twoFaced) ? [false, true] : [false];
```

`youMove` and `bestYouReply` both check `twoFaced`; `skyMove` never did. **Consequence today:
the Throne has never been able to turn in her hand.**

**2b. `tieRule` must not carry into PvP. — ALREADY DONE, verified.** `starshard-api/lib/manzil-lobby.js:253`
already sets `tieRule: 'a draw'` on every PvP match, with a comment saying so. No change needed.
The finding below is left in for the record and because it explains *why* that line matters.

Original finding: `tieRule: "you"` is right for single player, where
it should favour the human. Between two people it hands whichever seat is `"you"` a free
**8.2 points** (59.5% vs 40.5%). Neutralise it and the seats sit at 51.3 / 48.8, so the game
itself is even. **Ties are draws in PvP**, or the rule alternates with the lead.

Note the string the engine actually tests is `"the sky"`, not `"sky"`.

## 3. Delete the reading-depth dial

Search depth measured from 5 to 22 moves the strong player **0.2 points** and the weak player
**0.0**. It is inert.

1. **Remove `+ this._mlvl(tonight) * 2`** at `Manzil - The Empty District.dc.html:2571`.
2. **The rung depth numbers are inert too** — `[3,4,5,6,7,8,9,11]` and the boss's 14 produce
   no gradient. Pin depth at 8 for everyone.

That file is a Design artifact and they are about to be working in it. **Per the sequencing
above, this one goes to Design** rather than scheduling a Design-free cycle for a single line.
It is listed here so you know it is happening and why.

## 4. The starter pack is seven — corrected, and it is Design's line

Re-measured after item 1, 896 boards a cell: pack of 6 = 68.9 careful (over band), **7 = 63.5**,
8 = 58.0. Band is 55-65. Six was the old answer at 57.5 and it is wrong now.

**The original wording was too vague to act on. Precisely:**

"The pack" is `manzil-ed-pack` — the pool `deal()` draws five from each board. It is built at
`Manzil - The Empty District.dc.html:2383`:

```js
const pack = cast.five.concat(pool.slice(0, 7));   // chart five + 7 filler = a pack of TWELVE
```

**A pack of seven means:**

```js
const pack = cast.five.concat(pool.slice(0, 2));   // chart five + 2 filler = a pack of SEVEN
```

**Read that twice.** The literal `7` already in that line is the count of *filler* cards, not
the pack size. "Make the pack seven" does **not** mean the line is already correct.

**And this line is in a Design-owned file**, so like item 3 it goes to Design, not to you. Both
one-line changes live in the same file and should travel together.

Note also `ownAll` at the same file's props: with it false a visitor owns only their chart
five, so the effective pack is five and `deal` never fires. That is a separate config from the
pack size and worth checking when the change lands.

## 5. The deal

`deal(pack, seed, tonight, guarantee, standard)`.

**5a. An awake-floor of three.** Guarantee at least three signature-live cards in the five,
alongside the existing tonight's-mansion guarantee. Reference implementation in
`research/dealfix.js` — same xorshift, one extra guarantee pass before the random fill. Floor
1 buys nothing, floor 2 is half the effect; the lever is three.

**5b. The standard bearer.** One nominated level-4 card, guaranteed into the five. **One,
never more** — at five auto-dealt the player holds the same five every board, which is exactly
the condition that made the opening solvable. Passing no standard leaves `deal` byte-identical
(verified 400/400).

## 6. The walkers' ladder

`research/ladder-spec.js` generates it; `research/ladder-l1l2.json` is all 504 hands.

**Level sets her hand size:** L1 = 5, L2 = 6, L3 = 7, L4 = 8.

**Rung sets how many strong cards she holds and how many are awake:**

| rung | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (sky) |
|---|---|---|---|---|---|---|---|---|---|
| strong cards | 0 | 1 | 1 | 2 | 2 | 3 | 3 | 4 | all |
| of those, awake | 0 | 0 | 1 | 1 | 2 | 2 | 3 | 4 | all |

Tonight's mansion always sits in her hand and fills the first strong slot; the rest are picked
by a hash of (mansion, level, rung) so a road always deals the same walkers. **A strong card
asleep is the half-step** that turns six usable steps into nine.

Do **not** build rungs by walking weak/mid/strong tiers — tried, and four adjacent pairs came
out statistically identical.

**Re-run the generator after any slate change.** It reads its ranking from
`research/cardstrength.json`, and Design fixing the eighteen dead signatures will move it.

## 7. Levels 3 and 4

Seven patches, all in `research/manzil-engine-v7-tiebreak.js`.

| grant | where | the change |
|---|---|---|
| all | after `POOL` | `QUADRANT` map + `grantOf(g, c)`, returns null below `lvl 3` |
| the turn | `makeCards` | `twoFaced: p[3] === "throne" \|\| q3 === "turn"` |
| the guard | `tryFlip` | the `tie` condition gains `&& !(guard && on-or-beside home)` |
| the lead | `mkGame` | `hasGate` also matches `grantOf(...) === "lead"` |
| the return | `tryFlip` + `lodge` | `if (grant === "return" && !g.retUsed && isHome(...)) return "return"` |

**`grantOf` must not exclude cards by id.** An earlier draft filtered `c.id > 28`, which is
every loaner copy the second seat holds, and the second player's grants never fired at all.
Exclude the planets (101-105) explicitly instead. This is the same shape as bug 2a and the
same shape as the `"you"`-only bug the 24 Aug change fixed. **Assume it is a recurring trap in
this codebase.**

**The return is gated on `g.retUsed`, not the card's own `came` flag.** Using `came` lets every
Genbu card return once each, which measured +16.7 on its own.

## 8. PvP

Everything above is single player. Three findings:

1. **Ties** — item 2b.
2. **Moving second is worth ten points** (51% vs 41%). Nine slots and five cards each means
   ten cards for nine slots, so the second player places the last card. **A match needs an even
   board count or an alternating lead**, or the seating decides it.
3. **The level-3 grants are worth about a third as much in PvP.** Slot 0 of the board *is*
   tonight's mansion, and single player guarantees tonight's mansion into your five, so you
   always hold a card whose home is on the board. A random PvP hand does not. Giving both PvP
   hands the same guarantee recovers part of it. **Not solved; flagged.**

## 9. The regression protocol

This is what caught a 58%-divergent port and it is what will catch a bad port of any of the
above.

```
python3 gen_cases.py 77 2000
node v6diff.js ./manzil-engine-v6.js > js.json
python3 v6diff.py cases.json > py.json      # then compare
```

Two gates, both must hold after every engine change:

- **the vector suite at 51/51**
- **the differential at 2,000/2,000** with no card above level 2

The second one is the important one. It constrains `youMove`, `skyMove` and `playBoard` end to
end, which no hand-written vector set was ever going to do.

## 10. The order

1. **The tiebreak** (item 1), alone, then re-measure.
2. **The two v6 bugs** (item 2).
3. **Starter pack seven** (item 4) — one line.
   *(The depth deletion, item 3, is Design's: it lives in their file.)*
4. **The deal** (item 5).
5. **The ladder** (item 6) — hold until the slate lands.
6. **Levels 3 and 4** (item 7) — hold until the slate lands.
7. **PvP** (item 8), last, and item 8.3 is still open.

---

# Verification of the 25 Aug implementation

Code applied items 1 and 2a to `Star Shard v3 Build Plan/research/manzil-engine-v6.js`,
re-baselined the three vectors, synced the server copy, fixed the client's `_skyMove`, and
deployed to staging. **Independently checked, all of it holds:**

| check | result |
|---|---|
| their engine, vector suite | **51/51** |
| hand-order spread, 40 orderings | **0.0 careful, 0.0 casual** (was 17.9 / 25.0) |
| their engine vs the v7 reference, 2,000 random boards | **2,000/2,000 identical** |
| `skyMove` two-faced fix | present, line 249 |
| client `_skyMove` | fixed, line 3028 |
| server copy vs reference | identical apart from the six-line SYNCED FILE header |
| lobby `tieRule` | `'a draw'`, line 253 — item 2b was already correct |

**Item 1's acceptance criterion is met.** The spread is gone, and their engine and my reference
agree on every one of 2,000 boards.

## Three corrections to this document, all mine

1. **The paths header was backwards** and has been fixed above. It sent readers to the Build
   Plan folder for files that live in repo-root `research/`.
2. **`manzil-v6-conformance-24aug.md` was reported missing. It is not.** It is at
   `research/manzil-v6-conformance-24aug.md`, 27,843 bytes. The false negative was caused by
   correction 1.
3. **Item 4 was too vague to act on**, and has been rewritten with the exact line and the exact
   change. Code was right to stop and ask rather than guess.

## One consequence of their work

**The reference engine has moved.** `manzil-engine-v6.js` now contains the tiebreak and the
two-faced fix. The v7 files in repo-root `research/` were branched from the *pre-fix* base.
They have been checked against the new reference and still agree on 2,000/2,000 boards, so
nothing is broken — but **any future port should re-branch from the current reference**, not
from the v7 files, or the tiebreak will be applied twice.
