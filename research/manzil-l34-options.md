# Levels 3 and 4 — options, with the measurements attached

> **NUMBERS SUPERSEDED — read `research/README-MANZIL.md` first.**
> The design reasoning and the Four Symbols structure stand. **Every win-rate figure here was
> measured before the hand-order tiebreak was fixed**, and §6's stress test was redone after.
> Current numbers, including the final form of the four grants:
> `docs/handoffs/HANDOFF-GAMEPLAY-25AUG.md` Appendix B.

**25 August 2026.** Written because levels 3 and 4 currently grant no mechanical power: since
the 22 Aug re-baseline `makeCards` applies its `+1` unconditionally and `lvl` is inert, so
"familiar" sheds the card's labels and "unleashed" claims the mansion, and neither changes a
board. Justin wants teeth.

**Evidence:** `manzil-v6-conformance-24aug.md` for the engine measurements below, and
`manzil-loop/dormant-powers.md`, `card-minigames.md` and `decade-games.md` for the design
literature. Every win-rate figure is the player's, measured on the reference engine, 784
boards a cell, mid-game player carrying a pack of twelve.

---

## 0. The reframe this whole document rests on

**Teeth are not the same as power, and your own research says so twice.**

`dormant-powers.md` §Implications 2: *"The specific error is gating power rather than
information."* Monster Hunter's research levels are the working precedent and they grant zero
combat advantage.

`card-minigames.md` §6: *"28 x 4 levels is enough only if levels change decisions; make L3/L4
lateral."*

So the target is not a bigger number. It is **more decisions per turn, and decisions that only
a player who knows the card can make.** That is what makes a level feel earned rather than
issued. Every option below is built that way, and the ones that fail the test are marked.

Two constraints that are not negotiable, both from the same sources: signature moves are
**additive, never agency-removing** (`card-minigames.md` §3), and there must be **no second
numeric progress track** — no "7/28 attuned" counter beside the familiarity law
(`dormant-powers.md` §6).

---

## 1. What the baseline actually is

A player carrying a pack of twelve, chart five awake and seven asleep, wins **33.7%** of
boards. That is the number every option below moves.

For scale, the same player at a pack of five wins 62.5%. The collection is costing them 29
points, which is the problem §7 of the conformance doc describes. **Some of that is L4's job
to give back**, which is why the deal options below are not just power, they are the fix.

---

## 2. Level 3 — options

### 3A. The card turns *(recommended)*

**What:** a familiar card becomes two-faced. You choose which face goes left when you lodge
it. Exactly the Throne's existing property, extended by level.

**Measured:** +4.7 with two cards familiar, +6.6 with five. Gentle, and it scales sub-linearly
because the second turnable card is worth less than the first.

| cards at L3 | win rate | delta |
|---|---|---|
| baseline | 33.7 | — |
| 1 | 33.7 | +0.0 |
| 2 | 38.4 | **+4.7** |
| 3 | 38.4 | +4.7 |
| 5 | 40.3 | +6.6 |

**Why it fits.** It is pure decision — the card's numbers do not change, its signature does not
change, and a player who does not understand the card gains nothing from being able to turn
it. It is the most literal possible reading of "you know it by sight now": familiarity is
being able to handle the thing either way round. It is already in the engine (`twoFaced`,
and both agents already iterate `[false, true]` for it), so the resolver needs no new code.

**Cost:** the Throne loses its uniqueness. Worth deciding whether the Throne then gets
something else, or whether it simply becomes the card that starts where others arrive.

### 3B. Familiar ground

**What:** the card counts as *home* on its own mansion's slot **and the two either side**,
widening `isHome`. Cards whose signature keys off home (the Storm) get it more often.

**Why it fits.** Thematically exact — you know the neighbourhood, not just the house. It is
lateral: it changes where you want to place the card, not how strong it is.

**Unmeasured.** Only the Storm reads `isHome` today, so the effect is currently near zero and
would need more cards keyed to home before it is worth anything. Flagging it as a direction,
not a proposal.

### 3C. Keep it information-only *(the current design)*

**What:** the card sheds its labels; you know it by sight.

**Why it is defensible:** it is exactly what `dormant-powers.md` recommends, and it is free.

**Why it does not answer the brief:** it has no teeth by construction, and it is in fact a
difficulty *increase* on the player's side — you now have to remember the numbers.

**A warning worth checking before anything ships.** `card-minigames.md` §2 says the familiarity
law *"must hide flavour, never numbers or the active signature"*, citing Tetra Master as the
cautionary case. If "sheds its labels" currently hides the numbers rather than the flavour
text, that is the named failure mode and it should be corrected regardless of what L3 becomes.

---

## 3. Level 4 — options

### 4A. The standard bearer *(recommended)*

**What:** you nominate **one** unleashed card as tonight's standard. It is guaranteed into your
five, alongside the existing tonight's-mansion guarantee.

**Measured:**

| unleashed cards auto-dealt | win rate | delta |
|---|---|---|
| baseline | 33.7 | — |
| 1 | 39.5 | **+5.8** |
| 2 | 44.1 | +10.4 |
| 3 | 45.9 | +12.2 |
| 5 | 60.6 | **+26.9** |

**The bound is the point.** At five auto-dealt cards the player holds the same five every
board, which is precisely the pack-of-five condition that made the opening solvable in the
first place. **Do not make this a blanket rule.** One per night is +5.8, it is a real and
felt power, and it cannot collapse the variety.

**Why it fits.** It is a decision made before the board rather than on it: which of your
claimed mansions do you carry tonight? That is a genuine expression of mastery, it gives the
collection a reason to grow that is not raw power, and it partly repays the 29 points the
collection costs.

It also composes with the awake-floor in `HANDOFF-CODE-25AUG.md` §4 rather than duplicating
it: the floor stops the hand being blanks, the standard lets the player choose one of them.

### 4B. The mansion's own night

**What:** on a mansion's own night, its unleashed card cannot be flipped.

**Why it fits.** It is enormous and it happens once every 28 days per card, which is the
game's natural rhythm and matches the ethics floor's existing instinct that the loudest things
should track real sky events. It makes the calendar matter without gating anything behind it —
miss the night and you have lost nothing permanent, the moon comes back.

**Risk, and it is real.** "Cannot be flipped" is agency-removing for the opponent, which
`card-minigames.md` §3 warns against directly. A softer version — the card cannot be flipped
*by a tie*, or cannot be flipped *while it is on its home slot* — keeps the ceremony and
leaves the opponent a line. **Unmeasured; worth simulating before committing.**

### 4C. It opens the station in Star Shard *(recommended alongside, not instead)*

**What:** claiming a mansion at level 4 opens that station's reading in the astrology app.

**Why it fits.** This is your own `card-minigames.md` §11 — *"let a claimed mansion feed back
into Star Shard proper."* It has **zero balance cost**, it cannot be exploited, and it is the
only option here that makes the two products load-bearing for each other. The game's whole
strategic argument is that "you play for your reading" is the thing no incumbent has. This is
the mechanism that makes that sentence literally true.

It is also the only L4 reward that a player who has stopped caring about win rates still
wants.

### 4D. Per-mansion ascension

**What:** unleashing a mansion opens a harder version of its road, opt-in.

**Why it fits.** `card-minigames.md` §10: *"mastery at month 12 needs a ladder that isn't a
streak (per-mansion Ascension)."* The ladder for it already exists — `ladder-spec.js` reserves
hand sizes 7 and 8, so an ascended road is a two-line change.

**Why it is not the primary:** it is content for the small tail of players who finish, not
teeth for the level itself. Ship it after 4A, not instead.

---

## 4. The shape I would take

**L3 = the card turns.** One property, already in the engine, +5 points, pure decision, and it
is the honest mechanical reading of "familiar."

**L4 = the standard bearer, plus the station opens in Star Shard.** One card carried by choice
each night, +6 points and bounded so it cannot re-solve the opening, and the claim means
something outside the game entirely.

Then **4B as the ceremony** once someone has simulated the softer version, and **4D as the
endgame** when there is an endgame to serve.

That gives each level a different *kind* of teeth rather than four sizes of the same tooth:

| | what you get | the kind of thing it is |
|---|---|---|
| L1 claimed | the card | ownership |
| L2 awake | the signature | power |
| L3 familiar | the turn | a decision on the board |
| L4 unleashed | the standard, and the station | a decision before the board, and a reason outside it |

---

## 5. Open questions this cannot answer

1. **Does "sheds its labels" hide numbers or flavour?** If numbers, fix it regardless (§2, 3C).
2. **Does the Throne get something back** if two-faced becomes L3's grant?
3. **4B needs simulating** in its softer forms before it is committed to.
4. **The road-shard question from `dormant-powers.md` §8 is still unanswered in writing** — are
   the 28 shards formally independent of the signatures, or bound to them? That one sentence
   determines whether any of this is permissible under the ethics floor, and it has been open
   since the dormant-powers report.

---

## 6. Level 3 stress-tested — added 25 Aug

Before committing to 3A, the turn was measured across the whole progression rather than at one
point. 784 boards a cell. Bands: careful **55-65**, casual **35-45**, skill gap **20+**.

### 6.1 How it scales

| pack | cards at L3 | careful | casual | skill gap |
|---|---|---|---|---|
| 6 | none | 52.2 | 28.8 | 23.4 |
| 6 | half | 60.7 | 28.8 | 31.9 |
| 6 | **all** | **74.1** | 37.1 | 37.0 |
| 12 | none | 33.7 | 21.9 | 11.8 |
| 12 | half | 44.8 | 30.2 | 14.6 |
| 12 | **all** | **69.1** | 42.7 | 26.4 |
| 28 | none | 21.8 | 12.1 | 9.7 |
| 28 | half | 39.7 | 25.6 | 14.1 |
| 28 | **all** | 52.7 | 33.3 | 19.4 |

**The honest answer to "does it overpower": at full adoption, yes, by about four points.** A
pack of twelve with every card familiar puts careful play at 69.1 against a 55-65 band.

**But read the column above it.** The same pack with no card familiar sits at **33.7, which is
twenty-one points *below* band.** The current state is far more broken than the L3 state. The
turn is not adding power to a balanced game; it is most of the cure for the collection penalty
measured in conformance §7, where growing from five cards to twenty-eight costs the player
forty points.

The sweet spot is roughly **eight to ten of twelve familiar**, which lands inside the band.
Natural pacing already delivers that: one level per climb, roads re-arming with the moon, so a
full twelve at L3 is months of play, not a weekend.

**One edge case worth naming.** A player who levels a small pack rather than collecting a large
one reaches 74.1 at a pack of six. That path is available — re-climbing the same roads levels
without acquiring — and it is the strongest line in the game. Either it is fine as a
connoisseur's route, or acquisition needs to be the cheaper way to get stronger. A decision,
not a bug.

### 6.2 Does it change how a board feels? No.

| cards at L3 | win | flips | margin | close boards |
|---|---|---|---|---|
| 0 | 33.7 | 4.86 | 3.19 | 28.2% |
| 3 | 38.4 | 5.35 | 3.16 | 29.8% |
| 6 | 44.8 | 5.42 | 3.30 | 28.7% |
| 12 | 69.1 | 5.82 | 3.58 | 27.9% |

**Flips rise about 20%, margins barely move, and the close-board rate is flat.** Boards get
busier without becoming blowouts, which is the healthy direction. The game does not become a
different game; it becomes a more active version of itself.

### 6.3 It makes the opening harder to solve, not easier

`randomness-theory.md` §5.4's metric #5 — how many distinct first moves are optimal across the
shuffle space — is the direct measure of the thing the deal exists to fix. Measured across 392
boards:

| pack | cards at L3 | distinct openings | most common | openings covering 80% |
|---|---|---|---|---|
| 12 | none | 33 | 57.4% | **5** |
| 12 | half | 22 | 57.4% | 4 |
| 12 | **all** | **41** | **41.8%** | **10** |
| 28 | none | 42 | 18.1% | 19 |
| 28 | all | 56 | 12.0% | 16 |

**At a pack of twelve the memorisable opening book doubles, from five openings to ten, and the
dominant opening falls from 57% to 42%.** Turning a card is a second axis of choice at every
placement, so it multiplies the decision space rather than adding to it.

At a pack of six it changes almost nothing (12 distinct to 15), because at six you hold the
same cards regardless. The turn's diversity benefit arrives with the collection.

### 6.4 The cost, stated plainly

**It widens the skill gap.** At a pack of twelve, 11.8 to 26.4. Careful play gains 35 points
and casual gains 21. That is what a decision-based mechanic does by construction — a choice is
only worth something to a player who knows what to do with it — and it moves the gap from
below target to above it. If casual accessibility is weighted more heavily than skill
expression, this is the line item to argue with.

### 6.5 Verdict

**Confirmed, with pacing.** The turn does not distort the board, it improves the opening, and
its power lands in a range that repairs rather than breaks the progression. The overshoot is
four points at full adoption, against a twenty-one point undershoot today.

Two guardrails worth deciding before it ships:

1. **Do not grant it to the Throne** — it is already two-faced, so decide what the Throne gets
   instead.
2. **Watch the small-pack levelling line** (§6.1). If 74.1 at a pack of six is unwelcome, the
   cleanest brake is making the turn arrive at L4 alongside the standard bearer rather than at
   L3, which halves how many cards ever have it.

---

## 7. Per-mansion L3 grants, and the Throne — added 25 Aug

Justin's question: what if the turn is one mechanic among several, and L3 grants differ by
mansion? The structure to hang that on already exists in the corpus.

### 7.1 The Four Symbols are already in the table

`research/mansions-table.json` carries an `fy_god` column: the four quadrants of the Chinese
sky. **28 mansions, four groups of seven, and they are contiguous.**

| symbol | direction | mansions |
|---|---|---|
| **Byakko**, the White Tiger | west, autumn, metal | 1-6 and 28 |
| **Suzaku**, the Vermilion Bird | south, summer, fire | 7-13 |
| **Seiryuu**, the Azure Dragon | east, spring, growth | 14-20 |
| **Genbu**, the Black Tortoise | north, winter, water | 21-27 |

Mansion 2 is blank in the table and belongs to Byakko by position; that is a data gap, not a
fifth group. Note that Byakko wraps 28 round to 1, which is also how the road wraps.

This is not an invented taxonomy. It is real astronomy, it is already in the content bank
`CONTENT.md` is built on, and it is teachable in one line: *the Dragon's mansions bend, the
Tiger's mansions hold.*

### 7.2 Four grants, one per quadrant

Each matched to its symbol's character, each expressible in the engine today, each additive:

| symbol | L3 grant | what it does | engine hook |
|---|---|---|---|
| **Seiryuu** (dragon, growth) | **the turn** | lodge it either way round | `twoFaced` |
| **Byakko** (tiger, metal) | **the guard** | cannot be flipped by a tie; a bigger number still beats it | `tieRule` / `safeNow` |
| **Suzaku** (bird, fire) | **the second strike** | its flip carries one slot further | the cascade queue |
| **Genbu** (tortoise, water) | **the return** | once a board, if flipped it comes back to hand instead of changing sides | the Return's `ret` |

Four *kinds* of decision rather than four sizes of one. A player learns "I am holding two
Dragons tonight" as a plan, not a stat.

### 7.3 What the measurement says, and what it does not

The turn granted to one quadrant instead of all 28, 784 boards a cell:

| pack | who can turn | careful | casual | skill gap |
|---|---|---|---|---|
| 12 | nobody (today) | 33.7 | 21.9 | 11.8 |
| 12 | **one quadrant** | **37.4** | 29.0 | 8.4 |
| 12 | two quadrants | 45.0 | 33.3 | 11.7 |
| 12 | all 28 | 69.1 | 42.7 | 26.4 |
| 28 | nobody | 21.8 | 12.1 | 9.7 |
| 28 | **one quadrant** | 24.7 | 18.4 | 6.3 |
| 28 | all 28 | 52.7 | 33.3 | 19.4 |

**One quadrant is +3.7 careful where all 28 was +35.4.** It also *narrows* the skill gap
rather than widening it, because a turnable card reaches a given hand rarely enough that
casual play gains proportionally more from having the option at all.

**What this does not measure:** the other three quadrants getting their own grants. Only the
turn was simulated. With all four grants live the total will land well above the one-quadrant
row and below the all-28 row, depending on how strong the other three are.

**And that is the real argument for the idea.** A single blanket grant gave one dial with two
settings, and "on" overshot the careful band by four points. **Four family grants give four
independent dials.** The Dragon's turn can stay strong, the Tortoise's return can be tuned
weak, and the total can be landed inside 55-65 deliberately rather than hoped into it. That is
a materially better position to be in, and it is worth the extra design work.

**The cost, stated honestly.** Four grants is four things to design, balance and teach, and
§11 of the conformance doc found that four of the eight signatures already in the game are
inert. The risk of adding four more inert things is real. Mitigate it by measuring each grant
the way `l3test.js` measured the turn, before any of them ships.

### 7.4 The Throne — the question mostly answers itself

**The Throne is mansion 10, Al-Jabha, the Lion's Forehead. It is in Suzaku, not Seiryuu.**

So if the turn is the Dragon's grant, the Throne is not made redundant by 27 cards. It is
matched by seven, and only once those seven reach L3. For twenty-one of twenty-eight mansions
it stays the only card that arrives turnable.

That is most of the problem gone. What is left is that seven Dragons eventually catch up, so
the Throne should still get something. Three options, ranked:

**1. It turns in place *(recommended)*.** Once a board, after it has landed, you may flip the
Throne to its other face. The Dragons choose at lodge time; the Throne can change its mind.
Strictly beyond what any L3 grant gives, simple to implement, and it reads correctly — a
throne rules, it does not merely sit.

**2. It seats others.** A card lodged next to an awake Throne may be turned, whatever its
quadrant. An aura rather than a self-buff, and the most thematically exact of the three.
More work: the lodge step has to check adjacency before offering the reversed face.

**3. It arrives where the Dragons climb to.** Change nothing. The Throne is simply the card
that starts at L3. Honest, free, and thin — but defensible if the slate rework has bigger
problems to solve first.

I would take 1 now and hold 2 as the version to build if the Throne needs to feel special
again later.
