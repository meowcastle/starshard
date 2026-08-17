# GENERATION.md — the 784 pass

**16 August 2026.** The constitution for layer B: 784 combination readings,
generated once, reviewed in full, shipped as static data. `CHART-BUILDER.md`
§2 for why this is not a runtime call.

**784 = 28 sun-mansions × 28 moon-mansions. Order is meaningful** — `6·10`
is not `10·6`. The key is zero-padded: `COMBO.06·10`.

---

## 0. The failure this pass exists to avoid, and it is not the one I expected

Eight readings were written by hand before this spec existed. Diffing them
found the real risk, and it is not tone drift.

**Every mansion appears in 56 cells** — 28 as the sun's, 28 as the moon's.
When two of the hand-written readings shared a mansion, they reached for the
same fact and produced near-identical sentences:

| cells | shared mansion | duplicated |
|---|---|---|
| Craig `4·11`, Suyin `23·4` | The Follower | *"and here is the fact the name never mentions. aldebaran is far brighter than any star in the cluster it follows."* — **verbatim, both as a pull-quote** |
| Adam `28·8`, Jerry `1·8` | The Ghost | praesepe at 0° cancer, described in near-identical words |
| Corey `9·12`, Adrian `9·22` | The Glance | both open on the eye and *al-ṭarf* |

Two users compare shards, find the same sentence, and the product is Co–Star
with better typography. **This is the exact failure `CHART-BUILDER.md` §2
names as the reason for individually inspecting every cell.**

### The rule that follows, and it is the spine of this document

> **The portrait owns the mansion. The combination owns the interaction.**
>
> `MANSION.nn.*` says what The Storm *is*. It renders on the same page,
> directly below. A combination cell that explains the mansion is printing
> the same paragraph twice, forty lines apart.

**The combination may use, per mansion: the epithet, the keyword, and
nothing else.** No star names. No tradition names. No deities. No election
lore. No guardian animals. Those are all in the portrait, on screen,
already.

What the combination *is* allowed to say is the only thing the portrait
cannot: **what it is like to be both of these at once.**

---

## 1. The six slots

Fixed shape, every cell. Design's markup renders these in this order and
the order is load-bearing.

| slot | words | job |
|---|---|---|
| `lead` | 25–40 | the two mansions as one sentence. Sets the paradox and stops |
| `sun` | 55–75 | what the sun's mansion does **in this pairing** |
| `moon` | 50–70 | what the moon's mansion does **against that sun** |
| `pull` | 20–35 | the fusion. Rendered as a pull-quote. **The line someone screenshots** |
| `tension` | 60–80 | what the pairing makes hard, or what it gets called |
| `cost` | 50–70 | what it is unusually good at, and what that costs |

**~290 words per cell. 784 × 6 = 4,704 strings.**

**`sun` and `moon` are about the pairing, not the mansion.** The test: could
this paragraph appear unchanged in a cell with a different partner mansion?
If yes it belongs in the portrait, and it is already there.

**`cost` says what it costs. It never says what to do about it.**
`WRITING.md`: name the tension, don't prescribe the virtue.

---

## 2. The diagonal — 28 cells that break the template

Sun and moon in the same mansion. `NAMING.md` takes the I Ching's doubled
hexagrams as precedent: the eight doubled trigrams get their own names, not
blends. **`The Storm of the Storm` is not a name.**

- **Name:** the epithet alone, doubled in the address. `6 · 6`, *The Storm*.
- **`lead`** cannot state a paradox, because there is no second term. It
  states an **absence of counterweight**.
- **`sun` and `moon`** must not restate each other. One takes the mansion
  outward, one takes it inward. The sun's is how the room receives it; the
  moon's is what it is like from inside.
- **`pull`** is the concentration itself.
- These 28 are the most likely to read as filler and the most likely to be
  a user's favourite thing about their shard. **Write them last, by hand,
  after the other 756 have taught the voice.**

---

## 3. What the generator receives — derived facts only

`PRODUCT.md` §8, unchanged and non-negotiable. The generator sees **no birth
data**. Not a date, not a time, not a place, not a name, not a sign, not a
degree. It receives two mansion numbers and their portraits.

```json
{
  "address": "06·10",
  "sun":  { "n": 6,  "epithet": "The Storm",  "keyword": "no undo",
            "portrait": "<MANSION.06.claim + synthesis + election + archetype>" },
  "moon": { "n": 10, "epithet": "The Throne", "keyword": "the carved chair",
            "portrait": "<MANSION.10.*>" },
  "relation": "opposite" | "adjacent" | "same" | "none",
  "farlight": false
}
```

`relation` is computed, not editorial: `same` when the mansions match,
`opposite` when 14 apart, `adjacent` when 1 apart, otherwise `none`. It is
the one structural fact the pairing has that neither portrait contains, and
**`opposite` is the interesting one** — the moon standing in the sun's
farlight is a real and nameable arrangement.

---

## 4. The prompt

> You are writing one cell of a 784-cell corpus for an astrology product.
> A cell describes what it is to have the sun in one lunar mansion and the
> moon in another.
>
> You will be given two mansion portraits. **Those portraits render on the
> same page as your text, directly below it.** Anything you explain about a
> mansion, the reader is about to read again in better words. Do not
> describe the mansions. Write only what happens when a person is both.
>
> **You may name each mansion by its epithet and its keyword. Nothing
> else.** No star names, no tradition names, no deities, no election lore,
> no guardian animals.
>
> Return six fields: `lead`, `sun`, `moon`, `pull`, `tension`, `cost`, to
> the word counts given.
>
> **Voice.** Second person. Lowercase throughout except proper nouns and
> mansion epithets. No first person — "we" appears nowhere. The reader is
> the subject of every sentence. Attribute every value judgement to the
> traditions; the product has no opinions.
>
> **Banned:** announcing a reveal ("here's the part nobody knows"),
> labelling the move ("the cost is…"), not-X-but-Y ("this isn't
> restlessness, it's…"), meta-commentary about the reading, throat-clearing
> openers, and any sentence whose subject is the app.
>
> **Recognition, not flattery.** Accuracy that includes the cost is what
> gets screenshotted. A compliment is not. Say the hard thing plainly and
> do not soften it with advice.
>
> **Say the astrology word.** Use the real term, define it once in four
> words on first contact, then use it forever. Never paraphrase a technical
> term into a description of itself.

### 4a. Amendments from the pilot — the gates the first draft was missing

Eight cells were generated blind against §4 as originally written. Seven of
eight passed every mechanical gate and **seven of eight fabricated.**

| cell | invented |
|---|---|
| `06·10`, `09·12` | *"the older readings gave these two stretches of sky opposite work"* |
| `23·04`, `28·08` | *"the old books call neither reading wrong"* |
| `04·11` | *"the tradition is blunt about this trade"* |
| `23·04`, `03·28`, `09·22` | **aversion** — a sign-based term, applied to mansions |
| `04·11` | **significator**, defined inline as though the product used it |

**Nobody said any of that.** The election lore lives in
`MANSION.nn.election`, attributed, on the same page. A combination cell that
reaches for *"the old books"* is manufacturing an authority to borrow its
weight — and for a product whose entire position is **recovery, not
invention**, a fabricated attribution is the most expensive error available.
`INNOVATION.md`: the credibility play runs straight through practitioner
trust, and this is precisely what a practitioner checks.

> **The combination attributes nothing.** No *"the old books"*, no *"the
> traditions"*, no *"every tradition"*. The portrait does all attribution.
> The combination speaks only about the reader.

**And the vocabulary is a whitelist, not a blacklist.** `WRITING.md`'s free
vocabulary is the planets, the twelve signs, sun / moon / rising, the
houses, the five aspects, retrograde, new and full moon, and orbs in
degrees. **Everything else is off-limits in a combination cell.**
*Significator* and *aversion* are real terms and both are outside it — and
*aversion* describes signs, not mansions, so applying it here is a category
error a reader can catch.

The failure has a shape: asked to sound authoritative about a pairing that
has no inherited literature, the generator invents the literature. **The
pairing genuinely has none — 784 mansion combinations are not a tradition
anyone wrote down.** That is exactly why this layer is generated, and it has
to carry its authority in the observation itself.

Both are now gates in `combo-harness.mjs`, and they run before a human reads
a cell.

### 4c. The Storm's row — what 30 cells found that 8 could not

The full sun row for mansion 6 was drafted: 28 cells sharing one sun, the
maximum-collision-pressure configuration in the corpus. **30/30 passed every
gate including collision.** Then the column was read as a unit — protocol
§5b.1 — and the gates turned out to be blind to the actual problem.

| frame | cells | of 30 |
|---|---|---|
| *"what it costs is"* | 10 | **33%** |
| *"at full size and"* | 8 | 27% |
| *"X is the word, and it comes from…"* | 7 | 23% |
| *"what that costs is"* | 5 | 17% |
| *"there is no way to"* | 5 | 17% |
| *"you have never once"* | 4 | 13% |

**No two cells share an 8-gram. They share a *grammar*.** At 784 cells,
*"what it costs is"* appearing in a third of them would be the most visible
template tell in the product — and it sits in the emotional payload slot,
which is the worst place for one.

**The mechanism is worth naming, because it will recur.** `"the cost is"`
was banned as a style tic in the first draft of this document. The
generators did not stop labelling the move — they **routed around the ban
into a synonym.** Banning a phrase produces a paraphrase, not a better
sentence. A ban has to be paired with a positive instruction about what the
slot does instead, or it just moves the tell one word to the left.

**Two responses, both now live:**

1. **The frame gate.** No 4-gram may appear in more than 10% of a checked
   set (floor of 2). `combo-harness.mjs check` runs it alongside collision
   and exits non-zero. It found all thirteen in under a second.
2. **`cost` may not announce itself.** The slot's job is to say what the
   pairing is unusually good at and what that costs. It does that by
   describing the trade, never by introducing it. If a cell can be
   rewritten to start at the second clause, it should be.

**The 30 drafted cells pass every gate except this one.** They need a
de-templating pass before they ship — which is cheaper now, at 30, than at
784, and is the entire argument for running tranches instead of a sweep.

### 4d. The Throne's row — the fix held, and the gate was wrong

Mansion 10's full sun row, 28 cells, generated with §4c's **positive**
instruction in the prompt from the start rather than discovered afterward.

**58/58 clean on the first merge. No de-templating pass needed.** The
previous row needed one over 24 of 30 cells. Stating what the `cost` slot
*does* — describe the trade, never introduce it — cost four lines of prompt
and removed an entire revision cycle.

**But the frame gate itself was wrong, and the second row exposed it.** The
threshold was 10% of the checked set. At 30 cells the limit was 3; at 58 it
was 6; **at 784 it would have been 79.** The gate loosened exactly where
repetition becomes more visible. A reader comparing two shards does not care
about the denominator.

Retuned empirically against the real 58-cell set:

| n-gram | threshold | flagged | verdict |
|---|---|---|---|
| 4 | 10% | 0 | blind — misses live constructions |
| 4 | 3% | 46 | useless — flags ordinary English (*"and the people who"*) |
| 5 | 5% | 1 | still loose |
| **5** | **3%** | **6** | **all six are real constructions** |
| 6 | 3% | 0 | blind again |

**Now `n = 5`, `pct = 0.03`, floor 2.** Five words recurring in more than 3%
of cells is a construction; four words is often just English. The six it
caught — *"and not one of them"* ×4, *"not one of them knows"* ×3, *"and
every one of them"* ×3 — are the same instinct as the last row's, one
generation on: **the writers had stopped announcing the cost and started
announcing the count.**

Twelve one-clause edits cleared all six. The lesson from §4c holds and
generalises: **the tell moves. Each gate finds the current one and the next
row invents a new one**, so the frame gate has to be re-read by a human every
tranche, not trusted to stay calibrated.

### 4e. The premise line — the cheapest quality lever found so far

Five rows in, the clearest predictor of whether a row repeats itself is
**one sentence given to every agent writing it.**

| row | premise supplied | outcome |
|---|---|---|
| 06 The Storm | none — portrait only | needed a full de-templating pass, 24 of 30 cells |
| 10 The Throne | none | clean, but angles clustered around visibility |
| 24 The Void | *space deliberately offered; a person who makes room* | clean, widest angle spread so far |
| 15 The Veil | *unplaced rather than hidden* | clean; the distinction did all the work |
| 21 The Empty District | *capacity by vacancy — an absence others fill without asking, then treat as always furnished* | clean; **and it had to be written against two neighbours** |

**Mansion 21 is the case that proves it.** Its portrait and mansion 24's
both describe emptiness. Without a premise the two rows would have
collapsed into each other — 56 cells saying the same thing about space. The
brief drew the line explicitly (*offered* versus *filled without being
offered*) and told every agent to read `24·xx` cells and steer away. One
agent reported back that it had avoided "offer / clear / make-room verbs
entirely: these are deposits made on assumption, not space given."

> **Every row gets a premise line before it is written, and where two
> mansions are thematically adjacent the premise must name the
> distinction, not just the theme.**

The adjacency map worth writing before the remaining rows: 21/24 (both
emptiness), 15/21 (both about not being placed), 2/8 (both containers),
4/12 (both about what a pursuit accumulates), 1/7 (both arrival).

### 4f. The gate is not sufficient, and the writers now know it

By row five the agents were catching their own tells unprompted — label-first
`tension` openers, repeated `cost` openers, a not-X-but-Y that slipped past
the regex. Two caught cross-batch frame collisions against cells written by
*other* agents in earlier waves and fixed their own side. One reported
plainly: **"the harness misses several literal banned frames, so I audited
separately"** — and it was right; the regexes are anchored and some frames
appear mid-sentence in forms the pattern does not reach.

That is the correct posture and it should be stated rather than left to
luck: **the gate is a floor, not a verdict.** Every batch brief now carries
the general rule — *if three of your slots of one kind open alike, two are
wrong* — because that rule generalises and a banned-frame list never will.

### 4b. What the pilot got right, and it is the expensive part

**Zero collisions across 8 cells, including both deliberate traps** —
`23·04` / `04·11` share The Follower, `01·08` / `28·08` share The Ghost, and
neither pair repeats a phrase. The hand-written set failed this exact test
twice. **The §0 architecture works.**

The writing lands where it obeys §0 — these came out of the pairing and
could not have come from either portrait:

> you inherit your own worst half-hour as precedent, and precedent, once
> seated, is binding on you. — `06·10`
>
> nothing handed to you can be entered as evidence, and nearly everything
> you have was handed to you. — `04·11`
>
> a room can answer you in full and still land as silence, because the voice
> you were checking against is not in it. — `23·04`

**`relation` is being dropped from the packet.** Three generators ignored it;
the fourth hallucinated *aversion* out of a `none`. A field whose only
observed effect is to invite invention is worse than absent. `opposite`
returns later as an explicit farlight flag, or not at all.

---

**Few-shot: `06·10`, `09·12`, `28·8`** — Justin, Corey, Adam. Three
different structural situations (plain pair, adjacent-ish pair, seam
mansion), all hand-written, all approved. They are re-cut to the six-slot
shape in `combos-goldset.json`.

---

## 5. Review protocol

**Nothing ships unread.** 784 cells at ~290 words is roughly thirteen hours
of reading. That is the price of the architecture and it is the cheapest
part of it.

### 5a. Automated gates — run before any human reads a cell

| gate | test | fails on |
|---|---|---|
| **schema** | six fields present, word counts in range | any |
| **style** | the seven `WRITING.md` regexes, same as the corpus check | any hit |
| **leakage** | no date, time, place, sign, or degree token | any hit |
| **borrowed-fact** | no star name, deity, tradition name, or animal from either portrait | any hit |
| **collision** ★ | for each mansion, across all 56 cells containing it, no shared 8-gram | any pair |
| **diagonal** | the 28 same-mansion cells use the doubled template | any |

**The collision gate is the one that matters.** It is a direct mechanical
test of §0: 28 mansions × C(56,2) = 42,840 pair comparisons, seconds to run,
and it catches the Aldebaran duplication before a human ever sees it.

### 5b. Human read — three passes, cheapest first

1. **By mansion, not by cell.** Read all 56 cells for one mansion together.
   Repetition is invisible cell-by-cell and obvious in a column. Twenty-eight
   sittings.
2. **The eight gold cells, blind.** Generate `6·10`, `9·12`, `23·4`, `4·11`,
   `1·8`, `3·28`, `9·22`, `28·8` and compare against the hand-written
   originals. **These are the eval set** — the machine is measured against
   text that already passed.
3. **The diagonal, last, by hand.**

### 5c. Kill criteria

A cell is rewritten, not patched, if it: describes a mansion instead of the
pairing · shares an 8-gram with any sibling · offers advice · reads as
flattery · or could be about a different pairing with two words changed.

---

## 6. Order

```
1. harness + fact packets                        ← built
2. pilot: the 8 gold cells, generated blind      ← running
3. grade against gold; revise this document
4. 756 cells in mansion-major order (collision gate needs siblings together)
5. the 28 diagonals, by hand
6. full read, three passes
```

**Step 3 is the gate.** If the pilot cannot match text that already passed,
the prompt is wrong and generating 756 more cells only multiplies the
mistake.
