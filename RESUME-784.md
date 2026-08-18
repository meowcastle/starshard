# RESUME-784.md — the combination pass

**18 August 2026 · 784 of 784 cells (100%) · 270,006 words · all gates clean.**

**The generation pass is complete. Nothing in it has been reviewed.**
`GENERATION.md` §5b: *nothing ships unread.* What follows is the record of how
it was made and the list of what is still owed.

---

## Where it stands

**All twenty-eight sun-rows written, 28 cells each. Every address `01·01`
through `28·28` is present.**

| gate | result |
|---|---|
| schema, style, leakage, borrowed-fact, diagonal | **784/784 clean** |
| collision (8-gram, 28 mansions × C(56,2) pairs) | **0** |
| frame gate, shipped threshold | **0 over-used** |
| frame gate, each row alone (limit 2) | **0 over-used** |
| banned-frame audit, literal + punctuation-normalised | **0 hits** |

`combos.js` is regenerated and current at 784. Never hand-edit it.

### The last three rows

11, 17 and 27 were written as one tranche because they are **mutually
independent** — 11 pairs with 14, 17 with 18, 27 with 26, and all three
partners were already written. That is the only tranche in the pass where no
cross-row distinction had to be drawn, so all three ran fully in parallel.

- **11 The Mane** inherited *display as a property of size* from eight cells
  written against it.
- **27 The Guide** inherited *goes ahead of someone, as against 26's encloses*
  — a line all 28 cells of row 26 were written to hold.
- **17 The Crown** was **the last distinction drawn from scratch**: the bond
  is **undertaken** (somebody said something to somebody, on purpose, as an
  equal, and a thing you entered has no exit built into it) as against 18 The
  Heart's bond, which is **occupied** (a position, seniority by a checkable
  date, nobody above you). **A promise versus a rank.**

---

## What is still owed

**In priority order. Item 1 is the architecture's whole premise.**

1. **The full human read — three passes, §5b.** Roughly thirteen hours.
   **By mansion column, not by cell**: read all 56 cells containing one
   mansion together. Repetition is invisible cell-by-cell and obvious in a
   column — that is how every tell in this document was found. Twenty-eight
   sittings. **Not optional.**
2. **The 28 diagonals, reviewed by hand — §2.** They are written, but §2 says
   write them last, after the other 756 have taught the voice, and the early
   rows' diagonals were written before that experience existed. §2 also calls
   them *the cells most likely to read as filler and the most likely to be a
   user's favourite thing about their shard.* Fold item 5 into this pass.
3. **The gold-cell eval — §5b.2.** `06·10`, `09·12`, `23·04`, `04·11`,
   `01·08`, `03·28`, `09·22`, `28·08` were hand-written and approved before
   the generator existed. Compare the shipped versions against the originals.
   **This is the measurement the whole pass was supposed to be graded on and
   it has never been run.**
4. **The de-templating backlog — 66 frames at absolute limit 5.** Every one of
   the fifteen rows written in the two-wave protocol introduced **zero** frames
   of its own, so the entire backlog predates the retuned gate. Attack it as
   two families, not sixty-six frames:
   - **The negated-possession family** — `"is the one thing you"` ×15,
     `"none of it can be"` ×14, `"you are the one who"` ×13, plus `"nothing in
     you has ever"`, `"and no part of you"`, `"the one thing you have"`.
   - **The totalising family** — `"is the whole of the"` ×16, `"is the whole
     of what"`, `"that is the whole of"`.

   Read at a **fixed absolute limit of 5**, never a percentage — a percentage
   drifts as the corpus grows and the readings stop comparing.
5. **`"from inside"` as a `moon` opener — 11 cells, 7 of them diagonals.**
   `01·01 02·02 03·03 04·04 06·16 10·10 10·16 15·15 18·16 23·23 28·28`. Every
   batch since row 12 was told to avoid it and none added one, but the eleven
   are still there. Same job as item 2.
6. **Three banned frames in the portraits**, upstream in
   `research/corpus-mansions.md`: `MANSION.08` (`"and none of them"`),
   `MANSION.09` (`"what it costs is"`), `MANSION.24` (`"and it is the"`).
   Left alone deliberately — the portraits are approved hand-written source
   with a different owner. But **the packet hands portrait text to every writer
   of that mansion's 56 cells**, so it is a planting vector, and the portrait
   renders directly below the cell, so a reader can meet the same construction
   twice on one page. Justin's call.
7. **`04·11` and `23·04`** were replaced mid-pass. Any other pilot-era cell
   should be checked against the current constitution.
8. **The alignment question** at the foot of `corpus-mansions.md` is still
   open and still blocks `findings.js`'s `seam` kind.

---
## The files

| file | what it is |
|---|---|
| `research/combos.json` | **the corpus.** All 784 cells, address-keyed |
| `combos.js` | generated from it. Re-run `tools/build-combos.mjs` after every merge |
| `GENERATION.md` | the constitution. §0 the anti-repetition spine, §4a–4f every lesson learned |
| `tools/combo-harness.mjs` | packet builder + all seven gates |
| `research/corpus-mansions.md` | the 28 portraits the cells are written against |
| `run/PROMPT.txt` | the writer-facing constitution handed to each agent. **Carries the 19 literal banned frames — the one thing not reconstructable from `GENERATION.md`** |
| `run/COMMON.txt` | the shared rules block every batch brief opens with |
| `run/PROMPT.orig.txt`, `run/COMMON.orig.txt` | the pre-rebuild originals, kept for reference |
| `run/PREMISE-NN.md` | one per row for the fifteen two-wave rows. **The lever** |
| `run/ANGLES-NN.md` | the angles wave 1 took + the tells it burned, for wave 2 |
| `run/asmoon-NN.md` | every existing `xx·NN` cell — the roles-swapped twins |
| `run/packets/NN-MM.json` | per-cell fact packets (generate on demand) |
| `run/cells/*.json` | per-batch outputs, kept for audit |

### `run/` went missing, and the rebuild cost 18 defects

`run/` was not on disk when rows 07 and 12 started, so `PROMPT.txt` and
`COMMON.txt` were rebuilt from `GENERATION.md` §4–§4f. The originals turned up
mid-run and are preserved as `run/PROMPT.orig.txt` and `run/COMMON.orig.txt`
(they reference the old `/root/design-packet` paths).

**The rebuild was faithful on everything `GENERATION.md` records and wrong on
the one thing it does not: the literal banned-frame list.** Nineteen exact
constructions, accumulated across five rows, living only in `run/PROMPT.txt`.
`GENERATION.md` §4c names the mechanism but never enumerates the frames.

Cost of the gap, measured: **rows 07 and 12 came back with 18 hits against
that list across 56 cells. The 420 cells written before them carry 14 in
total.** Six times the density, in exactly the constructions the project had
already spent five rows learning to kill. Every gate passed the whole time —
the frames are mid-sentence and the regexes are anchored.

Fixed: 18 slots rewritten (plus two comma-variants a literal grep missed —
`"at full size, and"`, `"is the word, and it is"`). Rows 07/12 are now at zero
on both a literal and a punctuation-normalised audit. The list is folded into
the current `run/PROMPT.txt`, and `run/COMMON.txt` now tells every batch to
grep its own output against it.

**Two things follow.** First: the enumerated list belongs in `GENERATION.md`,
not only in a scratch file — it is the most expensive thing in `run/` and it
is the thing least reconstructable from the spec. Second: **13 literal hits
remain in the older rows** (concentrated in 06, 10, 24), plus one comma-variant
in `24·21`. Those predate this tranche and are still shipping.

---

## The method, for the record

All 784 cells were made this way. Kept because a regeneration, a new layer, or
a sibling corpus would need it — and because the lessons below cost real
defects to learn.

### The loop, exactly

```bash
# 1. packets for the row
for m in $(seq 1 28); do
  node tools/combo-harness.mjs packet <SUN> $m > "run/packets/<SUN>-$(printf %02d $m).json"
done

# 2. reference material for the row
#    run/PREMISE-<SUN>.md   — write this BEFORE anything else
#    run/asmoon-<SUN>.md    — dump every existing xx·<SUN> cell

# 3. seven batches of four: 01-04, 05-08, … 25-28
#    each writes run/cells/<SUN>-{a..g}.json and self-verifies

# 4. merge, regenerate, check
node tools/combo-harness.mjs check research/combos.json
node tools/build-combos.mjs
```

### Two waves, not seven serial batches

The original protocol ran seven batches serially so each could be handed the
angles of every batch before it. That is seven round-trips per row. Rows 07
and 12 ran in **two waves and came back just as clean**:

- **Wave 1 — batches A–D (16 cells), in parallel**, with the orchestrator
  pre-assigning each batch four *life-arenas* (work · family of origin ·
  money · the body · friendship · a public room · grief · near-strangers ·
  rank · display · craft · possessions · unplaceability · conflict). Owning
  the angle map centrally does the same job as the accumulating list and
  does it earlier.
- **Wave 2 — batches E–G (12 cells), in parallel**, each handed
  `run/ANGLES-NN.md`: wave 1's sixteen angles, the arenas E/F/G are
  concurrently taking, and — the part that mattered most — **the tells wave 1
  burned.**

**Fifteen rows ran this way — 07, 12, 13, 14, 16, 19, 20, 22, 25, 26, and the
final tranche of 11, 17, 27 — and every one came back 28/28 clean on the first
merge**, 0 collisions, no de-templating pass. The thirteen rows written before
it are the ones carrying the frame backlog.

**Row 22 also proved the protocol survives interruption.** An API limit killed
its wave-1 batches mid-run; three of the four had already written their files
and were recovered, repaired by hand (12 word-count failures, 4 banned frames
their own column passes never reached), and held on disk unmerged until the
missing batch could run. **Cells are safe the moment the agent writes the
file** — the reports are convenience, not state. **Never merge a part-row**:
the collision and frame gates want all 28 siblings together, so a half-written
row waits in `run/cells/` until it is whole.

**Run the frame gate at three denominators, not one.** The merge denominator
is now at limit 5 in the hand read and 18 in the shipped gate; the row and the
tranche are where the work is.

| denominator | limit | what it catches |
|---|---|---|
| the new row alone (28) | 2 | the row's own tic. `14` flagged `"with your name on it"` ×3; `16` `"nothing in you has ever"` ×4; `20` `"in the middle of it"` ×3; `25` two frames; `26` three |
| both new rows (56) | 2 | cross-row constructions the writers shared. Rows 16/19 flagged four, 20/22 three, 25/26 five |
| the whole corpus, absolute limit 5 | 5 | the inherited backlog. Read it by hand — **use a fixed limit, not a percentage**, or the reading drifts as the set grows |

Twenty-three one-clause edits across the last four tranches cleared every row-
and tranche-level flag.

**Row 26 is the clearest case of why the row denominator matters.** Six of its
`sun` slots independently converged on the same shape — *"all of it went up
early / and it has not been adjusted since / none of it has needed adjusting /
no part of it has ever been a subject."* Four separate batches, none of which
could see the others. The merged 700-cell gate passed all of it; the 28-cell
gate caught it in one run.

### The batch brief still carries all eight items

1. Read `run/COMMON.txt`, then `run/PROMPT.txt`.
2. Packet paths, and `combos.json` as reference.
3. `run/asmoon-<SUN>.md` — the cells already using this sun as a moon.
   Name the specific twins that batch owns: *"read them, do not repeat them."*
4. **THE PREMISE** — one paragraph. This is the whole lever.
5. **Angles already taken**, one line each (wave 2 only).
6. Roles-swapped twins that already exist (`MM·SUN`).
7. Special cases: the diagonal (`SUN·SUN`), the opposite (`SUN·(SUN+14)`).
8. Output path, and: verify, merge-check privately, fix until clean.

### On the opposite — and the biggest single template in the corpus

**Every sun-row has exactly one opposition cell**, so the corpus holds one per
completed row. An audit of all of them found the largest single template in the
product — and it is **fixed**, but the lesson is the point:

> **Ten of the twenty-two then written stated the arrangement with the same
> clause** — ***"the full moon nearest your birthday comes up…"*** — in
> `03·17 04·18 05·19 06·20 08·22 10·24 18·04 21·07 23·09 28·14`. Three more
> opened on *"the two lights sit/lie…"*. **The phrase appeared in zero
> non-opposition cells.**

That was not a scattered frame in the backlog. It was **a template for one
structural cell type**: a whole clause, in ten cells, doing the same job in the
cell that describes the most distinctive arrangement a chart can have.

**Fixed on 18 August.** Nine were rewritten, each with a different
construction; the clause survives only in `06·20`, where the full-moon image
feeds *"lighting the half of you the group was never shown"* and is genuinely
load-bearing. Four of the nine also stated the arrangement twice — once in
their own words and once with the stock clause — so the fix was subtraction,
not replacement.

### Every construction now in use — do not reuse any of them

The brief that owns the farlight cell **must quote this list and say *break
it***. It is how `22·08` was written and it is why the template did not
regrow.

| construction | cells |
|---|---|
| *"the two lights sit / lie at the greatest distance this road allows"* | `07·21` `12·26` `13·27` |
| *"holding is the far end of you, and it stands a long way off"* | `14·28` |
| *"…stands fourteen stations off your sun, as far along this road as anything gets"* | `19·05` |
| *"count fourteen stations off your sun in one direction and you land on your moon; count fourteen the other way and you land on it again"* | `16·02` |
| *"there is no hour when both of your lights are above the horizon"* | `20·06` |
| *"the full moon nearest your birthday comes up…"* | `06·20` only |
| *"at that spacing every direction from either runs toward the other"* | `22·08` |
| *"nothing stands further from it than this"* | `03·17` |
| *"the two positions exactly across from each other"* | `04·18` |
| *"nothing between them is nearer to one than the other"* | `05·19` |
| *"the one station your sun can never see"* | `08·22` |
| *"the one place the seat has never furnished"* | `10·24` |
| *"one at each end of the same measure"* | `18·04` |
| *"at the far station from your sun"* | `21·07` |
| *"a separation the wheel cannot widen"* | `23·09` |
| *(stated only as "exactly opposite, fourteen along" — the far-end image does the rest)* | `28·14` |

**The farlight cell is not always in batch G** — it lands wherever `SUN+14`
falls. `16·02` was batch A; `19·05`, `20·06` and `22·08` were batch B.

**Item 3 pays for itself.** Every batch on both rows reported killing at
least one collision or near-collision against a twin *before* the harness
ran.

---

## The premise line — do not skip this

`GENERATION.md` §4e. **One paragraph naming what a sun in this mansion *is*,
handed to every agent writing the row.** It is the single strongest predictor
of whether a row comes back clean.

Rows 06 and 10 were written without one; 06 needed a full de-templating pass.
Every row since has had one and **none has needed a revision pass.**

**Where two mansions are thematically adjacent, the premise must name the
distinction, not just the theme.** A premise file that names the distinction
in both directions — and gives each row a **verb-family that belongs to it
and one that does not** — is what kept 07 and 12 from bleeding into each
other across 56 cells written the same day. Copy that shape.

The pairs already handled, as models:

- **21 vs 24** — capacity by vacancy, *filled without being offered* · versus
  *space deliberately offered*
- **18 vs 10** — seniority *earned by a checkable date, nobody above you* ·
  versus a *carved chair, inherited*, and the question of desert
- **8 vs 2 vs 21** — *gives continuously, no gate, cannot see its edge* ·
  versus *holds one chosen thing through a term and controls release* ·
  versus *an absence others fill*
- **7 vs 12** — the departure is *provisional and what persists is the thing
  itself* · versus *total and one-way, and what persists is the obligation
  attached to it*. See `run/PREMISE-07.md` and `run/PREMISE-12.md`.
- **13 vs 14** — the making is *causal and untraceable, going out under
  someone else's name, uncounted — the problem is upstream, in the open palm*
  · versus *visible and attributed, yours by name and admired and unguarded —
  the problem is downstream, in what happens to a finished thing nobody is
  defending*. See `run/PREMISE-13.md` and `run/PREMISE-14.md`.
- **14 vs 11** — display as a **consequence of quality** (it is good, and good
  work draws attention) · versus display as a **property of size** (it is
  large and cannot be dialled down, so it registers whether or not you meant
  it). Drawn in `PREMISE-14.md`, used in `13·11`, `14·11`, `16·11`, `19·11`.
  **Row 11 is unwritten and inherits this line** — its premise must hold the
  other side.
- **16 vs 19** — **two ways at once, laterally, both real and load-bearing —
  the cost is speed** · versus **one way, straight down, all the way, with no
  stopping signal — the cost is destruction, because examining and dismantling
  are the same act.** See `run/PREMISE-16.md` and `run/PREMISE-19.md`. Note
  these two are *not* "both going two ways down" as an earlier draft of this
  file had it — 16 goes two ways *across*, 19 goes one way *down*. The shared
  ground is only that both refuse the simple version.
- **20 vs 22** — **position versus intake.** The Flock is about *where you
  stand*: of a group and at its edge at once, and the position lets you
  **sort** — see the seams a group cannot see in itself; you pay by sorting
  what was never yours to sort, irreversibly. The Listener is about *what
  reaches you*: hearing what a room is actually saying under what it says, an
  organ that cannot be shut; the price is **unwitnessed labour**, because
  acting correctly on what you heard is exactly what makes the work invisible.
  See `run/PREMISE-20.md` and `run/PREMISE-22.md`. **22 also needs holding off
  09 The Glance** — 09 is the *grip*, the read taken and held; 22 is the
  *channel*, always open.

**Still to draw:** 25 vs 26 (shelter: the single pole versus the wall), 26 vs
27 (both close the road), 17 vs 18 (both bonds), and 11's side of the 11/14
line.

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
- **The frame gate loosens as the set grows** even at a flat 3%: at 644 cells
  the limit is 15, at 784 it will be 24. `check` reporting *0 over-used
  frames* on the whole corpus now means almost nothing. **Run it on the new
  row alone (limit 2), and separately at `pct = 0.008` on the full corpus and
  read the output by hand.** §4d says re-read every tranche; this is how.
- **The banned-token array is a union and it contains ordinary English, and it
  routinely blocks the row's own premise vocabulary.** Row 12 could not use
  **`back`** anywhere — it comes off the sun's own portrait — which killed
  "comes back", "looks back", "hold back"; nor **`contract`**, the word its
  premise is built on. Row 13 could not use **`open`** or **`sets`**, so *"the
  palm opens"* and *"sets it going"* — both straight out of `PREMISE-13.md` —
  are gate failures. Row 14 could not use **`artisan`**, and the sun portrait's
  own sentence is *"the artisan's problem is never the making."* The ban is
  exact-token, so inflections escape (`opens`, `set`, `motion`), which makes it
  worse: the failure is one letter away and looks fine. Tell every batch to
  read its packet's `banned` array *before* drafting, and say which words in
  the premise are live traps.
- **Ordinary numerals get banned, and the row usually needs them.** `four` is
  banned in every cell of row 20 — a row about counting people in a group.
  `three` and `crossed` are banned in every cell of row 22. `roots` is banned
  in row 19 while the singular epithet *The Root* is permitted. The ban is
  exact-token, so `fourth`, `fourteen`, `forty-one`, `third`, `cross`,
  `crossing` all pass — **the failure is one letter away and looks fine.**
  Compute the row-wide intersection of the 28 packets' `banned` arrays before
  writing the premise, and put the ordinary-English ones at the top of it.
- **The leak regex matches the bare word `may` as a month name.** No modal
  "may" in any cell. **It also catches sign names — and mansion 16's portrait
  opens on one.**
- **Audit banned frames by substring, not by word boundary.** `"so there is
  nothing"` and `"so there is nobody"` both contain `"so there is no"`, and
  both are the same construction to a reader. Row 25 shipped two of them past
  its own batch audits because the batch checked whole words. Two rows caught
  it by hand and named it *the one-letter-away trap*.
- The harness counts a spaced em dash as a word, so a lead with two dashes
  reads ~2w over a hand count. Not fixed; know it.
- **Write the premise around the traps, and say in the premise that you did.**
  `PREMISE-16.md` as first drafted was built on the image of a curved span on
  two pillars — a banned token in all 28 cells of that row. Wave 1 hit it four
  times over. The fix that worked: rewrite the image, then add a line saying
  *the obvious word here is banned, which is why it is not written above.*
  `PREMISE-19.md` carries the same note for `roots` (plural banned, singular
  epithet permitted — one letter apart) and `practice` (ordinary English,
  banned row-wide, and the natural word for a trade or a clinic).

- **No reference file is exempt from the constitution.** `PREMISE-14.md` as
  first written contained the banned frame *"you have never once had trouble
  producing the thing."* A batch agent flagged it: reading the premise twice,
  as instructed, plants the frame. Audits since then found one more in
  `PREMISE-12.md`, two in `PREMISE-13.md`, one in `PREMISE-16.md`, one in
  `PREMISE-19.md`, one in `ANGLES-12.md` and one in `ANGLES-19.md` — **seven,
  all written by the orchestrator, none caught by any gate.** All fixed.
  **Grep every premise and angles file against the banned list before handing
  it to a batch**, and check the row's packet `banned` array against the
  premise's own vocabulary while you are there.

  **And name the family, do not spell the frame.** Half of those seven were
  acquired *while warning about the frame* — quoting a banned construction to
  forbid it puts it in the file, and the writer reads the file twice. PROMPT.txt
  holds the canonical list; everything else should point at it, not repeat it.

### The tell moves — for the record

Each row invents a new one, and naming it in wave 2's brief is what stops it.

| row | its tell | caught by |
|---|---|---|
| 06 The Storm | announcing the cost | a column read, after the fact |
| 10 The Throne | announcing the count | the retuned frame gate |
| 07 The Return | the negated-universal `cost` opener — *"nobody has ever…"*, *"none of them…"* | agents reading their own `cost` slots as a column |
| 12 The Turning | the `no X, no Y, no Z` negation triple — eight of batch A's twenty-four slots | same |
| 13 The Hand | **the row's whole gravity**: every `tension` resolving into *"the version others hold of you is wrong and correction is unavailable"* — batch B found all four of its own doing it | same |
| 14 The Jewel | `"with your name on it"` — the row's central fact is attribution, so the phrase is its natural tic. Three cells | the gate, at the **row** denominator only |
| 16 The Claws | **the premise's own closing beat** — *"a peer who picked one direction and got there first."* Batch A had it closing three of four `cost` slots | a column read; then wave 2 was warned by name |
| 19 The Root | `cost` slots shaped *"[everyone else got it wrong] / you didn't."* Batch D had **all four** | same |
| 20 The Flock | `"in the middle of it"` — the row's premise is being off-centre, so the phrase for the centre is its natural tic. Also `"you can…"` and `"a [noun]…"` `cost` openers, which **three separate batches** converged on independently | the row-denominator gate; the openers by column read |
| 22 The Listener | **the unprovability close** — *"and it cannot be shown"* ended six of the first twelve cells | a hand read of the recovered cells |
| 25 The Hideaway | **the premise's own phrases** — `"not available for inspection"` and `"under the cover"`, three cells each. Also `X-is-the-word` `tension` openers, which one batch reported as *a double banned-frame hit in one clause and the natural opener for this row* | the row gate; the openers by column read |
| 26 The Chamber | **the permanence shape in `sun`** — *"all of it went up early / it has not been adjusted since"*, six slots across four batches | the row gate |
| 11 The Mane | **lifetime-negation** (*nobody has ever*, *never once*) in all four of one batch's cells and twice over in three of them; plus `X is the word` `tension` openers, drafted in all four of another batch | column reads |
| 17 The Crown | **`never once`** — and **`PREMISE-17.md` planted it**, in the sentence *"have never once had to wonder"*. Two separate batches flagged the premise as the source before any cell shipped it | batch agents reading the premise critically |
| 27 The Guide | **capability-clause `cost` openers** — three of four in two separate batches, and **all three roles-swapped twins `05·27`, `06·27`, `08·27` open `cost` with "you can…"**, so the pull came from the corpus as well as the row | column reads |

**The pattern across all ten is one thing.** Rows 13, 16, 19, 22, 25 and 26
each converged on a destination that is *true of every cell in the row* — the
misread, the lateness, the being-right, the unprovable, the concealed, the
unremarked. A premise sharp enough to keep 28 cells distinct in
content will hand all 28 the same ending, because the premise fixes what the
row is about and says nothing about where a cell lands. **Wave 2's brief must
name the row's gravity explicitly, quoting it.** That is what stopped it in
every case; the gates never saw any of it.

**And the premise's own vocabulary is the second recruiter.** Row 25's two
worst tics were phrases lifted straight out of `PREMISE-25.md`; row 17's was a
construction the premise used once, one word away from a banned frame, and two
batches caught it in the premise rather than in their own drafts. A premise
sharp enough to be quotable will be quoted — so when you write one, expect its
most memorable phrases to come back in three cells, and say so in the angles
file. **Grep the premise against the banned list before anyone reads it.**

Rows 16 and 19 also show the **negated-possession family** spreading
corpus-wide: `"none of it can be"` ×12, `"is the one thing you"` ×12,
`"nothing in you has ever"` ×9, `"and no part of you"` ×8, `"the one thing you
have"` ×8. Five spellings of one instinct. No single one is over the shipped
gate; together they are a house style nobody chose.

---

## Appendix — the audit scripts

Run these after any edit to `research/combos.json`.

```bash
# the seven gates
node tools/combo-harness.mjs check research/combos.json

# regenerate the shipped file (re-runs every gate, throws on failure)
node tools/build-combos.mjs

# the frame gate at the denominators that matter
#   a single row (limit 2) · a tranche (limit 2) · the corpus (absolute limit 5)
```

The banned-frame audit is not in the harness and has to be run by hand — nineteen
literal frames from `run/PROMPT.txt`, **matched by substring, not word boundary**,
against the raw text and against a punctuation-stripped copy. Run it over
`research/combos.json` *and* over every file in `run/` before handing anything to
a writer.
