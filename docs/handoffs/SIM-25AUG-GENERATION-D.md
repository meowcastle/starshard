# Sim on the rebased engine — 25 August 2026, evening

**Engine measured:** `Star Shard v3 Build Plan/research/manzil-engine-v6.js`, **36,625 bytes**,
mtime 20:14. This is Code's reference-first rebase of Design's slate. Every number below came off
that file. Nothing here was measured on a patched hybrid.

**This is generation D.** Generation C (`research/sig28-all.json`, Appendix B of the gameplay
handoff) is superseded for card worths. Add a row to `README-MANZIL.md`.

---

## 0. Gates

| check | result |
|---|---|
| conformance vectors | **60/60** |
| server copy `starshard-api/lib/manzil-engine.js` | reference **verbatim** + the 6-line banner |
| POOL numbers, ability tags, twoFaced flags vs pre-rebase | **0 changes** across all 28 |

The rebase went the right direction and the sync discipline held. Both good.

**But 60/60 is not the same gate as 51/51, and this matters.**

| | count |
|---|---|
| vectors kept from the old suite | **26** |
| vectors removed or renamed | **25** |
| vectors added | **34** |

Half the old assertions are gone. The new suite proves the engine is internally consistent with
Design's rewritten cards; it does **not** prove that nothing regressed against the old behavior,
because the assertions that would have caught a regression were themselves rewritten. This is not
a criticism of the rebase, it is unavoidable when the cards change. It is a reason not to read
"60/60" as "60/60 plus the old 51."

The 34 additions are mostly real coverage, including a proper `[sky]` block for the second seat.
That was the gap that let the owner-relative bugs live as long as they did.

## 1. Behavior moved a lot

2,000 level-2 boards, pre-rebase engine vs rebased engine, same inputs:

| | |
|---|---|
| boards that play identically | **346 / 2000 (17.3%)** |
| boards that changed | 1,654 |
| of those, the **winner** flipped | **610 (30.5% of all boards)** |

Card numbers did not change. Ability tags did not change. So all of this comes from the rewritten
ability logic. A rewrite this wide invalidates every figure measured before 20:14 today.

## 2. All 28 signatures, re-measured

`sig28all.js` against the rebased engine. 784 boards a cell, ~1.8pp standard error, so treat
anything under ~3.5pp as indistinguishable from zero.

| | generation C | generation D |
|---|---|---|
| **work** | 8 | **12** |
| **inert** | 18 | **16** |
| **hurt their holder** | 2 | **0** |

**Both cards that actively hurt the walker holding them are fixed.** That was the worst class of
bug and it is gone.

Biggest movers:

| card | genC | genD | delta |
|---|---|---|---|
| the empty district | −7.3 | **+10.7** | +18.0 |
| the ghost | +2.8 | +9.1 | +6.2 |
| the hideaway | −0.8 | +5.2 | +6.0 |
| the hand | 0.0 | +5.5 | +5.5 |
| the return | −4.5 | +0.3 | +4.7 |
| the glance | −0.4 | +3.7 | +4.1 |
| **the root** | **+6.0** | **−0.3** | **−6.3** |
| **the turning** | +9.6 | +4.5 | −5.1 |
| **the gathered stars** | **+4.2** | **−0.6** | **−4.8** |

Read the last three carefully. **Three cards that worked in generation C stopped working.** The
root and the gathered stars are now inert. Nothing in the rewrite brief asked for that, so it is
either a side effect of the owner-relative changes or a deliberate rebalance nobody wrote down.
Worth one question to Design before anyone assumes it is intended.

Still inert after the rewrites, in order of how close they are to mattering: the heart (+3.3), the
drum (+2.2), the bearer (+2.0), the follower (+1.7), the claws (+0.6), the guide (+0.5), the
return (+0.3), the jewel (+0.1), the flock (0.0), the void (−0.1), the root (−0.3), the gathered
stars (−0.6), the mane (−0.6), the chamber (−0.9), the storm (−1.0), the veil (−1.0).

Net: **16 of 28 signatures still do nothing measurable.** That is better than 18 and it is not
close to done.

## 3. The bands, and the part that needs a decision

Aggregate ladder curve, all 28 mansions, 784 boards a rung. Careful is `youDepth 8`, casual is
`youDepth 0`. Target was careful 55-65, casual 35-45, **gap 20+**.

Rung 9 is the mansion's own sky, which is the fight that actually gates progress.

| config | L1 careful | L1 casual | L1 gap | L2 careful | L2 casual | L2 gap |
|---|---|---|---|---|---|---|
| **control** — pre-rebase engine | 55.6 | 42.9 | **12.8** | 47.3 | 29.0 | **18.4** |
| **rebased**, stale ranking | 56.5 | 37.5 | **19.0** | 41.6 | 23.5 | **18.1** |
| **rebased**, ranking rebuilt from genD | 55.0 | 42.1 | **12.9** | 35.7 | 24.4 | **11.4** |

Three things fall out of this.

**The skill gap misses target in every configuration measured, before and after the rebase.** Best
case is 19.0 against a 20+ target; worst is 11.4. A careful player beats a careless one by 11 to 19
points at the sky when the design calls for 20+. **This is not a regression Code introduced. It is
a standing design problem that predates the rebase and nothing in the rebase fixed it.**

**Level 2's sky is now too hard.** 41.6% careful on the stale ranking, 35.7% once the ranking is
rebuilt, against a 55-65 target. A careful player loses roughly two out of three. That will read as
unfair rather than difficult.

**Regenerating `cardstrength.json` makes it harder, not easier.** The third row is what the ladder
becomes once item 6 of the Code work order runs. L2 sky careful drops 41.6 → 35.7. So the ranking
regeneration is not a neutral housekeeping step; it moves difficulty, and it moves it the wrong
way. Sequence a rung retune immediately after it, in the same phase.

**And one correction to `README-MANZIL.md`.** It says the ladder "still produces a monotone curve"
and that "nothing is broken today." Measured on the control — the **pre-rebase** engine — the
aggregate curve is **already non-monotone** (level 1 rung 4 reads 90.7 against rung 3's 88.5).
The monotone claim was generation B, measured on `manzil-engine-v6-AUG24.js`. It stopped being
true when the tiebreak fix landed, not when the slate did. That line should come out.

## 4. What is not in the engine yet

**Levels 3 and 4 are not in the reference.** No quadrant system, no `fy_god` branching. It is still
only in `research/manzil-engine-v7-tiebreak.js`, which is a proposal. The shipped engine tops out
at level 2. Consistent with items 5-8 of the work order being open; noting it so nobody reads
"the engine is updated" as including L3/L4.

## 5. Suggested order

1. **Ask Design about the root, the gathered stars and the turning.** Three working cards went
   inert. Intended or not, the answer changes what gets rewritten next.
2. **Retune the rungs for level 2** before regenerating `cardstrength.json`, or expect to do it
   twice. The genD-ranking row is your preview of where it lands.
3. **Treat the 20+ gap target as its own work item.** No card rewrite has moved it and no rebase
   will. If careful play is meant to be worth 20 points, something structural has to carry it,
   and the L3/L4 quadrant design in `manzil-l34-options.md` §7 is the only proposal on the table
   that plausibly does.
4. Then, and only then, regenerate the ladder.

---

### Reproducing

| what | where |
|---|---|
| the 28-signature table | `sig28all.js` repointed at the reference; output `sig28-D.json` |
| the band curves | `bands.js` (new), both rankings, both levels, both depths |
| the control | same script against the 28,104-byte pre-rebase reference |
| the 2,000-board differential | `cases2.json` through both engines |

Noise floor is ~1.8pp on a single cell. Differences under ~3.5pp are not real.
