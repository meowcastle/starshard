# The levels check: 28 houses read the same, and the mirror is not a mirror

**17 September 2026. Measurement → Code (cc Design).** Verification pass requested alongside `FOR-CODE-THE-CARDS-17SEP.md`: confirm the houses all operate the same. Run on staging 17 Sep against a reset climb record (0 of 28 walked), reading the live client's card table, the mirror deck, the copy table and the codex surface on four sampled houses. Two clean results and three faults, one of which matters.

---

## 1. The data is uniform across all 28 houses — clean

| check | result |
|---|---|
| houses present | **28 / 28** |
| mirror records present | **28 / 28** |
| missing fields, any house | **0** |
| blank `name` / `abText` / `sig` / `quad` / `verb` / `fires` | **0** |
| faces outside 1–10 | **0** |
| quadrant split | **byakko 7 · suzaku 7 · seiryuu 7 · genbu 7** |
| `surfaces` copy rows | 28 |
| distinct key shapes | 2 — and legitimately so: the five planet cards carry an extra `planet` key |

Nothing to do here. The house table is in good order.

## 2. The codex surface is identical house to house — including the same bug

Four houses sampled from different quadrants: **33 text blocks each, the same four labels each** (`ITS CARD`, `ITS LAW`, `ITS ROAD`, `ITS BOARD`), **and `ITS HOURS` clipped below the frame on all four.** So the overflow I reported this morning is not a one-house layout accident; it is the panel, on every night. Consistent behaviour, consistently broken. One fix covers 28 houses.

## 3. The fault that matters: the mirror deck does not mirror

The difficulty model in this project is that the opponent is a mirror of the player's collection. On a fresh collection it is not. Five cards differ:

| house | you | sky |
|---|---|---|
| the blaze | lvl 2 | lvl 1 |
| the ghost | lvl 2 | lvl 1 |
| the glance | lvl 2 | lvl 1 |
| the throne | lvl 2 | lvl 1 |
| **the storm** | lvl 3, `ab: null` | lvl 3, **`ab: "storm"`** |

**Read the first four carefully before acting on them.** Faces match exactly on all four, and the ability is off on both sides, so *today* the level difference changes no number on any board. It is latent, not live: `lvl` is what gates ability and grant activation, so the moment any of those four wakes for the player it will not wake for the sky, and the mirror silently drifts. Worth fixing as a correctness matter, not as a live balance bug.

**The storm is live and it is the wrong way round.** Both sides hold it at level 3 with identical faces, and the sky's copy has its signature awake ("no ties against it") while the player's does not. Across all 28 cards:

> **player: 0 live abilities. sky: 1.**

On a fresh collection the opponent is strictly ahead by one signature, and it is on the house that is the player's own sun. That is the opposite of the intended asymmetry, it lands on the card a new player is most likely to notice, and it is on m6, which our own tables already show as the hardest night on the ring at a 3% clear rate. I cannot tell from outside whether the player's storm is suppressed by a grant gate or the sky's is wrongly promoted; the fix should say which.

**What this costs the numbers.** Every fresh-deck figure we have published assumes an exact mirror. If the shipped fresh mirror is one signature ahead, the fresh clear rates are measured against a slightly easier opponent than the one players face. I will not re-run the tables until Code says which side is wrong, because the correction changes which way to re-run them.

## 4. A second, smaller mismatch: our "fresh deck" is not the client's

Our harness models a fresh collection as the sun at level 3 plus five planets at level 2 — six elevated cards. The live fresh collection has **five**: one at level 3 (the storm, the sun) and four at level 2 (mercury, venus, mars, moon). So the reference fresh deck is one level-2 card stronger than a real new player's.

This is small and it is in the player's favour in our sims, which means our fresh clear rates are, if anything, slightly optimistic. I will align `preview.js`, `climb.js` and `drawtab.js` to the client's five-card shape and note the delta in the next table rather than silently restating old numbers.

## 5. House 22 has no walkers, and the thing it was waiting for is decided

The walker sheet covers **27 of 28 houses, 8 walkers each, 216 records**. House 22, the roof, is absent, documented in the sheet header as "held pending the komi decision and has no roster."

That decision landed on 15 September: `THE-DRAW-TABLE-15SEP.md` settled the level rule (the defender stands) across five forms, two decks and 28 nights, and `THE-HUSH-NIGHTS-15SEP.md` closed the hush question. **Nothing is blocking the roof's roster any more, and nobody has picked it up.** It is eight records of Design's time and it is the last house without a road.

## 6. Summary

- All 28 houses are structurally identical in data and on the codex surface. The "do they all behave the same" answer is **yes**.
- They are also identically broken in one place: `ITS HOURS` clips below the frame on every house.
- The mirror is one live signature short on the player's side, on a fresh collection, on the player's own sun house. **This is the one to fix first**, and it needs a ruling on which side is wrong before I re-run any fresh-deck table.
- Four further level mismatches are latent today and should be closed as correctness.
- Our reference fresh deck is one card stronger than the client's; I will align it.
- House 22's roster is unblocked and unowned.

### Files

`research/FOR-CODE-THE-CARDS-17SEP.md` (the restructure this verifies alongside), `research/THE-ROAD-TEXT-17SEP.md`, `research/THE-DRAW-TABLE-15SEP.md` and `research/THE-HUSH-NIGHTS-15SEP.md` (the komi decision that unblocks house 22), `research/preview.js`, `research/climb.js`, `research/drawtab.js` (to be aligned per §4).
