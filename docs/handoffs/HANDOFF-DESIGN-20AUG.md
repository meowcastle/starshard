# Handoff: Design, 20 August 2026

A research session simulated the prototype's rules and re-ran the 784 gold
eval. **Nothing was changed in the prototype, the sheets, or
`research/combos.json`.** Everything below is a decision you own or a
consequence of one.

**Paths.** Everything below is relative to the **starshard.net repo root**,
not the Build Plan folder. Both have a `research/` directory and they are
different: the root's holds the sims and the corpus, the Build Plan's holds
the temper work. `run/gold/` exists only at the root.

**Required companion.** The ruleset half of this document is self-contained.
The corpus half is not: the twelve rewrites are text, and the text lives in
`run/gold/proposals.json`. That file has to come with this one.

---

## 1. The flip-density call

Report: `research/manzil-sim-report.md` **Addendum 5**.
Engine: `research/manzil_sim_shape.py` (the v4 rules with geometry, Same,
Combo and the count's tie rule as parameters).
Drivers, all in `research/manzil-loop/`: `shape_sim.py`, `lever_sim.py`,
`lever_sim_2.py`.

The problem: the shipped board flips **2.43 cards per board** under careful
play, and 87 % of turns flip nothing. That is thin for a capture game and
thin against the solitaire family it actually competes with, where every
move cascades.

Measured at 448 boards per agent per config (28 tonights × both leads × 8
reps), replicated on two seeds:

| config | 1-ply win % | 1-ply flips | 2-ply win % | 2-ply flips |
|---|---|---|---|---|
| road, as shipped | 31.9–33.9 | 4.45 | **67.2** | **2.43** |
| tie-count to you only | 42.9 | 4.50 | 82.1 | 2.41 |
| Same only | 17.0 | 6.16 | 48.7 | 4.14 |
| Same + tie-count to you | 24.6 | 6.16 | 65.2 | 4.14 |
| **Same + Combo + tie-count to you** | **31.7–34.4** | **7.8–7.9** | **58.7–58.9** | **5.1–5.3** |
| contiguous + Same | 22.8 | 6.18 | 72.3 | 4.91 |

Target band: 1-ply 35–45 · 2-ply 55–65 · flips 4+.

**Recommendation: adopt the three together, or none of them.** Same alone
drops a careful player to 48.7 %, because your cards lose 50 % of face-offs
to her planets and added volatility favours the stronger side. Ties also go
to the sky at the count today, so one fact taxes the player twice. Combo is
Triple Triad's own rule: a card flipped *by a tie* then attacks its own
neighbours.

Costs: **+1.1 s of animation per board** (~4 s a match) at 0.40 s per flip.
The oracle still wins 14/14 sampled nights, so this raises density and does
**not** touch the copyable-line problem, which stays the seeded tiebreak's
job. The casual player is not fixed by this and cannot be: 1-ply rises more
slowly than 2-ply as flips increase, because a greedy player who attacks
often exposes more cards to the counter-attack. That is the walkers' ladder's
job, and it is doing it.

### Where it lands in `Manzil - Prototype.dc.html`

Three touch points, all already present:

1. **`_tryFlip`**, the wins line. Currently
   `const wins = av > tv || ((storm || bossTies) && av === tv);`
   Same makes the tie clause unconditional. Note `bossTies` is the Storm's
   boss-night rule and `storm` is the card signature: both are subsumed, which
   is §2 arriving from the code side.
2. **`_boardWinner`**, the `tieRule` branch. It already handles `"a draw"` and
   `"tonight's holder"`; **there is no `"you"` branch yet**, so tie-count-to-you
   is a new case rather than a config change.
3. **`_resolve`**, the flip queue. Combo pushes a tie-flipped card's own
   neighbours back onto the queue, the way the Mars chain already does a few
   lines above: `if (C[slots[from].id].ab === "mars") { const far =
   this._nb(to, dir); ... }`. The difference is that Mars pushes one direction
   onward; Combo pushes both, and only when the flip came from a tie.

The Python engine does all three in `research/manzil_sim_shape.py`
(`try_flip`, `play_board`'s winner logic, `resolve`). Toggles are the module
globals `SHAPE`, `SAME`, `COMBO`, `TIERULE`.

## 2. Three things that follow if it is adopted

1. **Storm loses its signature.** "Claims ties" becomes the base rule. Storm
   is worth 21 points in the ablation *because* ties matter, which is the
   same reason universalising it works. It needs a new move.
2. **The Storm's boss-night rule** ("ties are hers tonight") is redundant for
   the same reason and needs replacing.
3. **The Signature Pass sheet needs a re-audit.** Several of the 28 were
   scored in a world where ties were dead.

## 3. MANZIL-LOOP §5.6 is withdrawn

That section recommended contiguous fill to raise density. The data says no:
contiguous moves 2-ply flips only 2.44 → 3.12 and hands the player 83–89 % of
boards, because constraining placement costs her greedy search more than it
costs your lookahead. Wrapped adds ~0.4 flips and little else.

**roadShape is now a feel decision, not a density one.** Playtest it; do not
build to the withdrawn recommendation.

## 4. The corpus: the gold eval has been run

`research/gold-eval.md`. GENERATION.md §5b.2, which RESUME-784 called "the
measurement the whole pass was supposed to be graded on and it has never been
run."

- `combos-goldset.json` is **not on disk**. The eight originals were
  recovered from the approved readings; set is in
  `run/gold/goldset-recovered.json`.
- **All eight cells preserve the pairing's distinction; five of eight are
  better than the approved text at the `cost` slot.** Zero fail §5c.
- The finding is a defect class no gate can see: **367 of 784 cells (47 %)
  assert elapsed adult time about the reader**: 557 sentences, 180 of them
  in `cost`. With ~25 % of the audience at 13–17, "twenty years of the
  hardest evidence available" is not unflattering: it is false. Three of the
  eight gold readings do this, which is where the corpus learned it.
- **Twelve validated rewrites** across five cells in `run/gold/proposals.json`:
  word counts in range, zero banned frames literal and punctuation-normalised,
  zero style hits, and the full harness over a patched corpus returns
  784/784 clean.
- Two to fix regardless of the sweep: **03·28's `tension` gendered reader**
  ("a man holds one shape for two decades", the only clear case in the
  corpus) and **09·12**, which hands every reader one person's marriage
  including "her mother's at the weekend" and "eight years out, remarried."
- **04·11 is Justin's call**: the one cell where the approved distinction was
  not inherited. The substitute is arguably more specific to the pair.

Working rule: edit `research/combos.json` and regenerate with
`tools/build-combos.mjs`. **Never hand-edit `combos.js`.**

## 5. A question, not a spec

Match-as-ascent: board 1 she plays three planets on a shorter road, escalating
to five plus an outer by board 5, with exactly one choice between boards (swap
one of your five, wake a signature for the match, or take a claimed card off
the road). Untested. It is the cheapest available answer to "the match is five
reps rather than a build arc," and it composes with the Moonstone. Treat it as
a prompt.

---

## What done looks like

**Ruleset.** A decision on the three rules together, adopted or declined. If
adopted: the prototype changed at the three touch points above, a **new Storm
signature**, a **new Storm boss-night rule**, and the **Signature Pass sheet
re-audited** against one criterion, that several of the 28 were scored in a
world where ties were dead and may read differently now. Plus the base-layer
lock in `Star Shard v3 Build Plan/CLAUDE.md` updated, since `tieRule = the sky`
is recorded there as foundational.

**roadShape.** A feel call after playtest, not a sim result. Whatever it is,
record it, because the sim cannot settle it and the withdrawn §5.6 will
otherwise keep pointing the wrong way.

**Corpus.** The twelve rewrites applied to `research/combos.json`, regenerated
with `tools/build-combos.mjs`, `node tools/combo-harness.mjs check
research/combos.json` green, and a position on whether the 367-cell calendar
sweep runs now or after the 28 column sittings.

**Not yours to settle:** reopening the `tieRule` lock, and 04·11
keep-or-re-cut. Both are Justin's.
