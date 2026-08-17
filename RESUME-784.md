# RESUME-784.md — how to pick up the combination pass

**17 August 2026 · 392 of 784 cells done (50.0%) · 134,209 words · all gates clean.**

Everything needed to continue is on disk. No state lives in a session.

---

## Where it stands

**Fourteen sun-rows complete, 28 cells each:**

```
01 The Gate          08 The Ghost         18 The Heart
02 The Bearer        09 The Glance        21 The Empty District
03 The Gathered      10 The Throne        23 The Drum
04 The Follower      15 The Veil          24 The Void
06 The Storm                              28 The Thread
```

**Fourteen rows remain:** 05, 07, 11, 12, 13, 14, 16, 17, 19, 20, 22, 25, 26, 27.

---

## The files

| file | what it is |
|---|---|
| `research/combos.json` | **the corpus.** 392 cells, address-keyed, merge target |
| `GENERATION.md` | the constitution. §0 the anti-repetition spine, §4a–4f every lesson learned |
| `tools/combo-harness.mjs` | packet builder + all seven gates |
| `research/corpus-mansions.md` | the 28 portraits the cells are written against |
| `run/PROMPT.txt` | the writer-facing constitution handed to each agent |
| `run/COMMON.txt` | the shared rules block every batch brief opens with |
| `run/packets/NN-MM.json` | per-cell fact packets (generate on demand) |
| `run/cells/*.json` | per-batch outputs, kept for audit |

---

## The loop, exactly

```bash
# 1. packets for the row
for m in $(seq 1 28); do
  node combo-harness.mjs packet <SUN> $m > "run/packets/<SUN>-$(printf %02d $m).json"
done

# 2. seven agents, four cells each: 01-04, 05-08, ... 25-28
#    each writes run/cells/<tag>-{a..g}.json and self-verifies

# 3. merge and check
node combo-harness.mjs check combos.json
```

**Batch brief template** — every one has carried these, and the format is
what keeps rows clean on the first merge:

1. Read `run/COMMON.txt`, then `run/PROMPT.txt`.
2. Packet paths, and `combos.json` as reference.
3. **The list of cells already using this sun as a moon** — "read them, do not
   repeat them."
4. **THE PREMISE** — one paragraph. See below; this is the whole lever.
5. **Angles already taken** by earlier batches in the same row, listed one line
   each. Batch A has none; batch G has twenty-four.
6. Any roles-swapped twins that already exist (`MM·SUN`) — "read it and make
   yours a different life."
7. Special cases: the diagonal (`SUN·SUN`), the opposite (`SUN·(SUN+14)`).
8. Output path, and: verify, merge-check privately, fix until clean.

---

## The premise line — do not skip this

`GENERATION.md` §4e. **One paragraph naming what a sun in this mansion *is*,
handed to every agent writing the row.** It is the single strongest predictor
of whether a row comes back clean.

Rows 06 and 10 were written without one; 06 needed a full de-templating pass.
Every row since has had one and **none has needed a revision pass.**

**Where two mansions are thematically adjacent, the premise must name the
distinction, not just the theme.** The pairs already handled, as models:

- **21 vs 24** — capacity by vacancy, *filled without being offered* · versus
  *space deliberately offered*
- **18 vs 10** — seniority *earned by a checkable date, nobody above you* ·
  versus a *carved chair, inherited*, and the question of desert
- **8 vs 2 vs 21** — *gives continuously, no gate, cannot see its edge* ·
  versus *holds one chosen thing through a term and controls release* ·
  versus *an absence others fill*

**Still to draw, for the remaining rows:** 5 vs 9 (both perception — the
searching *face* versus the *grip*), 13 vs 14 (both making), 19 vs 16 (both
going two ways down), 25 vs 26 (shelter: the single pole versus the wall),
26 vs 27 (both close the road), 7 vs 12 (both about return and change),
11 vs 14 (both display), 17 vs 18 (both bonds), 20 vs 22 (both group-adjacent).

---

## Rules that were learned the hard way

- **A ban produces a paraphrase.** `"the cost is"` was banned and the writers
  routed into `"what it costs is"`, which reached a third of one row. Every
  prohibition must be paired with what the slot does *instead*. §4c.
- **The gate is a floor, not a verdict.** Regexes are anchored and miss frames
  mid-sentence. Every brief carries the rule that generalises: **if three of
  your slots of one kind open alike, two are wrong.** §4f.
- **Semantic duplicates are invisible to every gate.** Mansions 1 and 24 both
  carried the keyword *"the opening"* for eleven rows. Found by printing the
  packet header, not by a tool.
- **The frame gate loosens as the set grows** if the threshold is a
  percentage. Fixed at `n=5, pct=0.03`, floor 2 — tuned empirically. §4d.
- The harness counts a spaced em dash as a word, so a lead with two dashes
  reads ~2w over a hand count. Not fixed; know it.

---

## What still has to happen after 784

1. **The 28 diagonals reviewed by hand.** They are written, but `GENERATION.md`
   §2 says write them last after the others have taught the voice — the early
   rows' diagonals were written before that experience existed.
2. **The full human read, three passes** — §5b. By mansion column, not by
   cell. Thirteen hours. Not optional; it is the architecture's whole premise.
3. **`04·11` and `23·04`** were replaced mid-pass. Any other pilot-era cell
   should be checked against the current constitution.
4. **The alignment question** at the foot of `corpus-mansions.md` is still
   open and still blocks `findings.js`'s `seam` kind.
