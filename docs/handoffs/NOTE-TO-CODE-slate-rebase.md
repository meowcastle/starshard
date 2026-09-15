# Before you act on Design's slate — 25 August 2026

> **Updated after I tried the port myself and got it wrong.** §1 now specifies the *direction*
> of the rebase, which is the part that matters. My failed attempt is the evidence.

Two things to check first. Design's work is careful and their caveats are honest; neither of
these is a criticism of it. Both are things neither document says.

**Where their work actually is:** `/Users/justinbjur/Desktop/research/` — a **third** research
folder, outside the repo. Not `starshard.net/research/`, not the Build Plan one. The engine is
`manzil-engine-slate-25aug.js` and the table is `v7-slate-25aug.md`.

---

## 1. Do not port their engine as-is. It is missing the 24 August fix.

`manzil-engine-slate-25aug.js` was branched from a **pre-24-August** lineage. Verified on the
Gate:

```js
// the live reference (Star Shard v3 Build Plan/research/manzil-engine-v6.js):
const hasGate = ids => ids.some(id => on(g, g.C[id]) && g.C[id].ab === "gate");
if (g.turn === "sky" && hasGate(g.you)) g.turn = "you";
else if (g.turn === "you" && hasGate(g.sky)) g.turn = "sky";      // ← both hands

// Design's slate engine:
if (g.turn === "sky" && g.you.some(id => on(g, g.C[id]) && g.C[id].ab === "gate")) g.turn = "you";
// ← "you" only. no else branch.
```

The 24 August change made **ten** abilities owner-relative: gate, heart, bearer, ghost, chamber,
glance, blaze, return, turning, listener. Their copy still has the one-sided versions.

Their base `manzil-engine-v6.js` in that folder is **24,130 bytes**; the live reference is
**28,104**.

**It also has no `runVectors` export**, so it cannot self-check. There is no way to tell whether
the port dropped anything else.

**What to do: rebase, and the direction is not optional.**

**Port Design's card changes ONTO the reference engine. Never port the reference's fixes onto
Design's engine.**

I tried it the wrong way round to save time and it failed twice. Seven mechanical `"you"`
hardcodes patched, then an outer guard I had missed patched as well, and **three cards that
demonstrably work in the reference still read exactly 0.0** — the listener (17.7 in the
reference), the turning (9.6) and the root (6.0). Exact zeros are the signature of an ability
that stopped firing, not one that got worse. There are more half-reconciled sites than I found,
and **their engine has no vector suite, so nothing catches it.**

That is the whole argument. The reference has 51 vectors and a 2,000-board differential. Design's
engine has neither. Work must flow toward the thing that can be checked.

So: branch from the current reference, apply Design's slate rewrites to it, then run both gates —
**51/51 vectors** and **2,000/2,000 on `v6diff.js`** with nothing above level 2. Design's recut
switches (`vHand`, `vDrum`, `vMane`, `vHeart`) port across as ordinary config.

## 2. Their table and the handoff's table are not in conflict. They measure different hands.

This is the one that will cause an argument if nobody says it.

| | whose hand holds the card | the question it answers |
|---|---|---|
| **`sig28all.js`** (the handoff table) | **hers** | how much does this card cost the player when a walker holds it |
| **Design's harness** | **yours** | how much does this card gain the player when they hold it |

Both are valid. They are orthogonal, not competing. That is most of why the two tables disagree
on sign and magnitude, on top of the engine difference above.

Examples that look like contradictions and are not:

| card | handoff (in her hand) | Design (in your hand) |
|---|---|---|
| the gate | +5.4 works | +1.0 ±4.4 inert |
| the gathered stars | +4.2 works | 0.0 ±5.3 inert |
| the blaze | +8.0 works | +20.8 ±6.4 works |

**Which one the ladder needs is unambiguous: mine.** `ladder-spec.js` builds *her* hands, so
`cardstrength.json` and `sig28-all.json` are the relevant rankings for rung difficulty.

**Which one card design needs is arguably theirs**, because players hold these cards and that is
where the card has to feel good.

**So keep both.** Name them for the seat they measure rather than picking a winner.

## 3. What this does not change

Design's rewrites are still justified. I checked the four cards where the missing symmetry fix
would most plausibly have caused a false "dead" reading — ghost, glance, bearer, heart — against
the **fixed** engine in `research/sig28-all.json`. They measure +2.8, −0.4, −1.8 and 0.0.

**Still inert with both fixes in place.** They were not chasing a bug. The rewrites are real work
on real problems.

What does not survive is the *numbers*. +11.8 for the ghost came off an engine that differs from
the live one at ten ability sites and uses the opposite seat. The ranking is probably sound; the
figures will not transfer.

## 4. The order

1. Rebase the slate onto the current reference engine.
2. Run both gates: **51/51 vectors**, **2,000/2,000 differential**.
3. Re-measure with `sig28all.js` (her hand) *and* Design's paired harness (your hand). Keep both.
4. **Then** regenerate `cardstrength.json` and the ladder. Not before.

Phase 3 of the Code work order stays where it is. Nothing here moves it earlier.
