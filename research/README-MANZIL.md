# Manzil research — what is true, and what is not

**25 August 2026.** `research/` holds 99 files and three generations of Manzil numbers that
disagree with each other. This file exists so nobody quotes a dead one.

**If you read only one thing:** the current numbers are in
`docs/handoffs/HANDOFF-GAMEPLAY-25AUG.md`, **Appendix B**. Everything before that appendix,
in every document including that one, was measured on an engine with a bug that added ±18
points of noise.

---

## The three generations, and how to tell them apart

| generation | when | status | how to spot it |
|---|---|---|---|
| **A. broken port** | before 24 Aug 16:15 | **VOID** | any number from `manzil_v6.py` before it was re-conformed. The port disagreed with the engine on 58% of boards |
| **B. old tiebreak** | 24-25 Aug | **SUPERSEDED** | the bulk of this session. Correct method, noisy engine: equal-scoring moves were decided by hand order |
| **C. fixed tiebreak** | 25 Aug, late | **CURRENT** | anything that says "on the fixed tiebreak" or lives in Appendix B |

Generation B is not *wrong* so much as imprecise, and it is **systematically** imprecise: the
old tiebreak picked the worse of two tied moves, so B numbers understate the player by 4 to 11
points. That is why the starter pack answer moved from six to seven.

---

## The live trap, and it is the reason this file exists

**`research/cardstrength.json` is generation B. `research/ladder-spec.js` reads it.**

So the 504 walker hands in `ladder-l1l2.json` are ranked by a stale measurement. Nothing is
broken today — the ladder still produces a monotone curve — but the ranking will move when
either of two things happens:

1. the fixed tiebreak lands in the reference engine (**it has**, as of 25 Aug), or
2. Design rewrites the eighteen inert signatures (**in progress**)

**Do not author exact rung values off `ladder-l1l2.json` until `cardstrength.js` has been
re-run on the current engine and the ladder regenerated.** That is item 6 of the Code work
order and it is explicitly held for phase 3.

There is a second, newer card measurement — **`research/sig28-all.json`, generation C**, all 28
signatures on the fixed tiebreak. It is the one to trust for *what a card is worth*. It is not
yet the one the ladder uses.

---

## Where the current truth lives

| question | answer |
|---|---|
| what should Code build, in what order | `docs/handoffs/HANDOFF-CODE-ENGINE-25AUG.md` |
| what should Design build | `docs/handoffs/HANDOFF-DESIGN-CARDS-25AUG.md` |
| the whole mechanical spec | `docs/handoffs/HANDOFF-GAMEPLAY-25AUG.md` — **read Appendix B first, then the body** |
| what each of the 28 signatures is worth | `research/sig28-all.json` |
| levels 3 and 4, options and reasoning | `research/manzil-l34-options.md` §7 for the design, **§B of the gameplay handoff for the numbers** |

## Documents whose numbers are superseded

Their *findings* mostly stand; their *figures* are generation B.

- **`manzil-v6-conformance-24aug.md`** — §1 and §2 (the port was broken, here is the harness)
  are still true and important. **§3 through §14 are generation B.** Its §5 recommends a
  starter pack of six; the answer is now seven.
- **`manzil-l34-options.md`** — the design reasoning and the Four Symbols structure stand.
  Every win-rate figure is generation B, and §6's stress test in particular was redone.
- **`manzil-v6-check.md`** — generation A. Marked void by the 22 Aug session summary and still
  void.
- **`manzil-randomness.md`, `manzil-signatures.md`, `manzil-weakspots.md`,
  `manzil-district-check.md`, `manzil-sim-report.md`** — generation A or earlier. Read them for
  method and for the literature; do not quote their numbers.

## The engines

| file | what it is |
|---|---|
| `Star Shard v3 Build Plan/research/manzil-engine-v6.js` | **the reference engine.** Now carries the tiebreak fix and the two-faced fix |
| `starshard-api/lib/manzil-engine.js` | the server's synced copy. Never hand-edit; copy from the reference |
| `research/manzil-engine-v7-tiebreak.js` | levels 3 and 4 plus the tiebreak. **A proposal, not shipped** |
| `research/manzil-engine-v7-l34.js` | an earlier L3/L4 draft. Superseded by the above |

**These v7 files were branched before the reference engine was fixed.** They have been checked
against it and still agree on 2,000/2,000 boards, but **re-branch any future port from the
reference**, not from these, or the tiebreak gets applied twice.

## The harnesses, and whether they still work

**Keep and use:**

| file | what it answers |
|---|---|
| `v6diff.js` + `v6diff.py` + `gen_cases.py` | does a port match the engine? **Run after every engine change** |
| `sig28all.js` | what is one signature worth? ~7 minutes for all 28 |
| `cardstrength.js` | ranks all 28 as opponent cards. **Needs re-running on the current engine** |
| `ladder-spec.js` | generates the 504 walker hands |
| `pvp.js` | both seats holding real mansions |
| `movequality.js` | how good are the moves an agent actually picks |

**One-shot probes, kept for reproducibility, not for reuse:** `packsize2.js`, `handsize.js`,
`fullgrid.js`, `depth.js`, `bestof.js`, `handorder.js`, `waking.js`, `dealfix.js`, `l34.js`,
`l3test.js`, `l3open.js`, `quadrant.js`, `regrant.js`, `chamber.js`, `chamber2.js`, `weird.js`,
`ladder2.js`, `ladder3.js`, `v7test.js`, `v7full.js`.

Each answers exactly one question from this session and hardcodes its own configuration. They
are evidence, not tools. **If you re-run one, check which engine it requires at the top** —
several point at `manzil-engine-v6-AUG24.js` or `manzil-engine-v7-l34.js`, which are generation
B baselines.

## The rule that would have prevented all of this

Every figure should say **which engine produced it**. The three generations above are only hard
to tell apart because most documents do not. New measurements should name the engine and the
date in the same sentence as the number.
