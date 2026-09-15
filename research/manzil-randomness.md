# Randomness, the shuffle, and the cube

*Research run, 21 August 2026. Four literature agents plus five simulation phases.
Engines: `research/draw_sim.py`, `draw_sim2.py`, `draw_sim3.py`, `draw_sim4.py`,
`draw_sim5.py`, all against the verified 21 August port `manzil_sim_cur.py`.
Raw numbers: `research/manzil-loop/draw-results.json`, `draw2-results.json`,
`draw2gh-results.json`, `draw3-results.json`, `draw4-results.json`, `draw5-results.json`.
Literature: `manzil-loop/randomness-theory.md`, `draw-architecture.md`,
`cube-and-stakes.md`, `dormant-powers.md`.*

---

## 0. The short answer

You asked for a shuffle. The evidence says **shuffle at the right moment or not at all**,
and the moment is *before the board, in the open* — not during it, in your hand.

- Every version of "draw from a shuffled deck mid-board" that was tested **destroys the
  skill gap**: the difference between careful and casual play falls from 40 points to
  between 5 and 16. That is the game becoming luck.
- **Dealing five from a drafted twelve at the start of each board and revealing them in
  full** breaks the solved opening completely (0 of 90 openings win all 28 nights, down
  from 5) **and lands both agents inside their target bands for the first time**
  (careful 59.4%, casual 36.7%).
- The **cube does not work yet**, and the reason is not tuning. Against an opponent who
  cannot err, a doubling cube is worth exactly zero. Measured: match-level skill gap
  59.5 without it, 58.2 with it. It made the game slightly *less* skillful.
- **"No powers until you claim the mansion" needs 9.7 to 24.5 years** of daily play to
  finish, and a player with no signatures awake has a skill gap of 5.6 points. That is a
  new player being handed a coin flip. The idea is good; the mechanism is a fifty-fold
  miscalibration.
- And one correction to my own earlier work: **the 28 authored night rules do not fix the
  opening.** I recommended them for that job on 21 August. Tested, they cut the number of
  always-winning openings from 5 to 2, and the best opening still wins 100%.

---

## 1. Method, and how much to trust it

Every cell is at least 448 boards, most are 896 or more, all replicated across two seeds
(11 and 97), all 28 nights, both leads. "Careful" is the 2-ply agent, "casual" is 1-ply.
Target bands from prior addenda: careful 55-65% of boards, casual 35-45%, flips 4+.

Three honest caveats before any of the numbers are used:

1. **Absolute win rates do not travel between ports; deltas do.** The Python port reads
   72-73% careful where Code's independent JS port reads 74.9%. Compare rows, not values.
2. **The blind agent understates skilled hidden-information play.** When I hide the sky's
   hand, my agent reasons against her whole pool — worst-case, no inference. A real player
   forms beliefs and narrows them. So the measured cost of hiding is an upper bound.
3. **The simultaneity agent is cruder still.** It averages over her plausible blind moves.
   It does not model yomi, which is the entire point of simultaneous play. Treat section
   3.4 as a floor, not an estimate.

---

## 2. Findings

### 2.1 The disease is solvability, not determinism

This is the frame correction, and all four literature agents arrived at it independently.
Sirlin's list of cures for a solved game is "unknown elements, hidden information, **or**
randomness," in that order, and randomness is last for a reason. Chess did not fix the
opening book with dice; Fischer fixed it with Chess960, which is randomisation that is
**pre-game, symmetric, one-shot, and fully visible**.

The distinction matters because it changes what you are shopping for. You do not need
luck. You need the first move to stop being the same move.

Worth knowing, because it cuts against the instinct: the only controlled experiment
either agent could find (IEEE CoG 2021, n=18) found that **input** randomness significantly
*lowered* player satisfaction (p = 0.024) while output randomness had no measurable effect
(p = 0.859). What predicted satisfaction was not the timing of the randomness but whether
the player had control over its degree. That is a small study and I would not build a
company on it, but it points the same way as everything else here.

### 2.2 Every mid-board shuffle flattens the skill gap

| configuration | careful | casual | **gap** | flips | night-sd |
|---|---|---|---|---|---|
| **shipped: fixed chart five** | **73.1** | **32.9** | **40.2** | 4.16 | 18.0 |
| draw 3 from shuffled 28 | 27.8 | 17.2 | 10.6 | 4.88 | 9.2 |
| draw 4 from shuffled 28 | 37.1 | 20.4 | 16.7 | 4.97 | 11.3 |
| draw 5 from shuffled 28 | 45.8 | 26.8 | 19.0 | 4.92 | 10.3 |
| draw 6 from shuffled 28 | 55.2 | 37.8 | 17.4 | 5.53 | 10.9 |
| random five, no refill | 16.7 | 10.6 | 6.1 | — | — |
| choose 1 of 3, drafted 12 @L2 | 47.1 | 38.2 | 8.9 | — | 11.3 |
| choose 1 of 3 + carry, drafted 12 @L3 | 44.6 | 32.1 | 12.5 | — | 17.5 |

Two things to read here. First, the gap collapses in every row. Second, **night-sd falls
too** — from 18.0 to around 10. That is the number I did not expect and it is the most
damaging one. Night-to-night variety is currently one of Manzil's real assets: some nights
are 34% and some are 100%, and that difference is the ephemeris talking. Shuffling your
hand does not add variety, it **averages the nights together into one soup**. You would be
trading the thing that makes tonight feel like tonight for noise.

**Deck size makes it worse monotonically**, which kills the Slay the Spire idea outright:

| deck (draw 3) | careful | casual | gap |
|---|---|---|---|
| 8 | 55.2 | 27.0 | 28.2 |
| 12 | 37.8 | 21.0 | 16.8 |
| 16 | 35.2 | 17.8 | 17.4 |
| 20 | 28.1 | 16.8 | 11.3 |
| 24 | 28.8 | 16.2 | 12.6 |
| 28 | 27.6 | 16.7 | 10.9 |

In Slay the Spire, adding a card is a choice with a cost, and the whole strategic texture
comes from that tension. Here it is not a tension, it is a punishment: **every card you
acquire makes you worse and makes the game luckier.** You lodge only five cards a board, so
a bigger deck is pure dilution with nothing on the other side of the ledger. The draw
research puts it in exposure terms: 28 cards with 7 seen is **25% deck exposure**, which is
Magic territory with no mulligan and five plays. Marvel Snap runs 75%. Balatro ~73%.
Nothing shipped lives where draw-3-from-28 would put you.

### 2.3 Most of the collapse is card power, not randomness — and that is its own problem

I split the two causes by re-running draw-3-from-28 with the whole deck at each level:

| every card at | careful | casual | gap |
|---|---|---|---|
| L1 (loaners) | 20.1 | 14.3 | 5.8 |
| L2 + signatures | 25.3 | 16.8 | 8.5 |
| L3 | 34.4 | 22.6 | 11.8 |
| L4 | 72.6 | 47.2 | 25.4 |

A maxed collection survives a shuffle fine. A new player's does not, because your chart
five are levelled and the other 23 are L1 loaners facing five levelled planets. **A shuffle
deck silently converts Manzil into a collection-gated game**, where the honest answer to "I
keep losing" is "come back in four months." That is a worse ethics-floor problem than
anything in the dormant-powers proposal.

### 2.4 The fix that works: deal the five before the board, and show them

This is the Chess960 move. Keep full information *inside* the board — you still see your
whole hand, you still see her five planets, 2-ply lookahead still pays — but which five you
hold is dealt fresh each board from a drafted pool.

| configuration | careful | casual | gap | flips | night-sd |
|---|---|---|---|---|---|
| five of a drafted 12, all L2 | 35.8 | 16.1 | 19.7 | 3.73 | 8.7 |
| **five of a drafted 12, all L3** | **59.4** | **36.7** | **22.7** | 3.63 | 14.2 |
| five of a drafted 12, proto levels | 37.8 | 18.0 | 19.8 | 3.69 | 8.7 |
| five of all 28, all L3 | 26.3 | 15.0 | 11.3 | 4.53 | 9.3 |
| five of 12 @L3 + rotating night rules | 50.8 | 34.2 | 16.6 | 3.51 | 13.2 |

And the exploit scan, which is the number that matters:

| configuration | best opening | openings winning **all 28 nights** |
|---|---|---|
| shipped | 100.0% | **5 of 90** |
| 7 night rules rotating | 100.0% | 2 of 90 |
| 28 night rules | 100.0% | 3 of 90 |
| choose-1-of-3 + carry, drafted 12 @L3 | 76.2% | **0 of 90** |
| **dealt five of 12 @L3** | **85.3%** | **0 of 90** (best is perfect on 9 nights) |
| dealt five of 12, proto levels | 69.2% | **0 of 90** |

`M L3: five of a drafted 12` is the only row in this entire study where **careful and
casual both land inside their target bands** (55-65 and 35-45) and the opening book is
gone.

Because this is the recommendation, it was replicated on four seeds at 560 boards per
seed, against the shipped configuration measured the same way:

| | careful | per seed | casual | gap | flips |
|---|---|---|---|---|---|
| shipped, fixed chart five | 73.5 | 74.5 / 72.9 / 72.3 / 74.5 | 35.4 | 38.1 | 4.06 |
| **dealt five of 12 @L3** | **58.7** | 57.9 / 58.8 / 57.3 / 60.9 | **36.4** | **22.3** | 3.69 |

Spread across seeds is 3.6 points on the headline row and 2.2 on the control, so the
15.8-point cost in skill gap is real and not seed noise. That is the price of admission,
and it is far smaller than any mid-board shuffle charges.

Two things it does not fix, stated plainly:

- **Flips fall to 3.69**, under the 4+ floor. The density pass from 20 August was tuned
  against a fixed five and does not survive the change. A first probe of the obvious levers:

  | dealt five of 12 @L3 | careful | casual | gap | flips |
  |---|---|---|---|---|
  | shipped rules | 59.4 | 36.7 | 22.7 | 3.63 |
  | tie goes to the sky | 42.4 | 28.6 | 13.8 | 3.63 |
  | Storm off | 51.3 | 37.2 | 14.1 | **4.14** |
  | Storm strikes at +1 | 51.2 | 37.9 | 13.3 | **4.19** |

  Both Storm changes clear the floor, and both cost about 8 points of careful play and 9
  of skill gap. So density is recoverable but not free, and the Storm rework from
  Addendum 8 should be re-decided against the dealt five rather than against the fixed
  five it was measured on.

  **But see §2.4b before spending anything on this.** The 4+ flip floor was set as a proxy
  for drama, and drama is now measured directly, which puts the 3.69 in a different light.
- **It depends on the twelve being levelled.** At proto levels the same design reads
  37.8 / 18.0. So this is a design for a player with a real collection, and the onboarding
  path has to be solved separately — most likely by levelling the loaners rather than by
  levelling the player.

### 2.4b Flips are the wrong excitement metric, and the dealt five is more dramatic, not less

The 4+ flip floor has always been a stand-in for "the board should feel eventful." It is
now possible to measure eventfulness directly. Four proxies, careful play, 896 boards per
row: how often the lead changes hands, how often the winner was behind after six
placements, the average final margin, and how often the board finishes within one card.

| | lead changes | comeback wins | margin | boards within 1 | flips |
|---|---|---|---|---|---|
| shipped, fixed chart five | 2.13 | 30.5% | 2.90 | 37.8% | 4.16 |
| **dealt five of 12 @L3** | 1.92 | **37.3%** | **2.41** | **39.6%** | 3.63 |
| dealt five of 12, proto levels | 1.75 | 29.6% | 2.56 | 40.1% | 3.69 |
| draw 3 from shuffled 28 | 1.72 | 19.9% | 3.48 | 27.7% | **4.53** |

Two things fall out of this and both matter.

**The dealt five is the most dramatic configuration measured.** More comeback wins than
shipped (37.3% against 30.5%), closer boards (margin 2.41 against 2.90), more boards
decided by a single card. It gets there with *fewer* flips, which means the flip count was
never measuring what it was standing in for.

**Draw-3-from-28 has the most flips and the least drama of anything tested.** Highest flip
count in the study, lowest comeback rate, widest margins, fewest close boards. That is
churn without tension: cards changing hands constantly while the outcome was never in
doubt. It is the clearest single illustration of why a mid-board shuffle feels busy and
plays flat.

So the flip floor should be **retired as a target and kept as a diagnostic**. The 3.69
under the dealt five is not a defect to fix; spending 8 points of careful play and 9 of
skill gap to buy flips back (the Storm rows above) would be buying the proxy and selling
the thing it was a proxy for.

### 2.5 The 28 night rules do not fix the opening. I was wrong about that.

On 21 August I wrote that promoting the 28 authored night rules from flavour to fix was
"the only mechanism identified that breaks the solved opening without weakening her," and
that it should be scoped as the big piece of work. Tested with seven rule families rotating
by night (ties to the sky, no Same, no Combo, wrapped road, she reads deeper, Storm off,
plain), that is not what happens.

| | best opening | wins all 28 nights | careful | casual | gap | night-sd |
|---|---|---|---|---|---|---|
| shipped, one rule | 100.0% | 5 of 90 | 73.1 | 32.9 | 40.2 | 16.6 |
| 7 rules rotating | 100.0% | 2 of 90 | 69.4 | 34.4 | 35.0 | 22.7 |
| 28 rules (7 x 4 phases) | 100.0% | 3 of 90 | 73.3 | 32.3 | 41.0 | 19.8 |

The mechanism is obvious in hindsight: **a strong opening is strong under most rule sets.**
Throne at slot 8 is not exploiting the Same rule or the tie-count, it is exploiting the fact
that her reply is computable. Changing the rule changes which line follows; it does not make
the line unknowable.

What the night rules *do* deliver is real and worth keeping: **night-sd rises from 16.6 to
19.8-22.7 with no loss of skill gap** (41.0 at 28 rules). That is the "every night is a
different puzzle" property, cheaply. So they stay on the roadmap — as variety, which is what
they were originally for, not as the fix. Scope them accordingly, which is a relief, because
they were scoped as the largest item on the list.

### 2.6 Hiding her hand costs the careful player, and only the careful player

| | careful | casual | gap |
|---|---|---|---|
| she draws 5 of 5, open | 74.9 | 34.5 | 40.4 |
| she draws 5 of 5, blind | 71.0 | 34.5 | 36.5 |
| she draws 5 of 8, open | 84.5 | 41.7 | 42.8 |
| she draws 5 of 8, blind | 80.4 | 41.7 | 38.7 |
| she draws 5 of 10, open | 84.7 | 42.0 | 42.7 |
| she draws 5 of 10, blind | 73.1 | 42.0 | 31.1 |

Casual is untouched by definition (1-ply never looks at her hand). Careful drops 4 to 12
points. So hiding her hand, in this crude form, **removes skill expression rather than
adding it** — it takes away the reward for reading ahead and gives nothing back, because my
agent cannot do the inference a person would.

Caveat 2 from §1 applies at full strength here. The literature is emphatic that hidden
information is the better cure than randomness, and the cube agent makes hiding the sky's
hand the precondition for a stake mechanic working at all. I would not close this door on my
numbers. But I would note the specific structural problem: **in Manzil her hand is barely
hideable.** She always plays the same five planets. Hiding them hides the *order*, not the
identities. That is why the F-series had to invent extra bodies to make hiding mean anything,
and the extra bodies I invented are ability-less, which weakened her and confounds the
absolute levels. Read the open-versus-blind deltas, not the columns.

### 2.7 The cube: not yet, and the reason is structural

| | match win | boards/match |
|---|---|---|
| no cube, careful | 85.2% | 3.78 |
| no cube, casual | 25.7% | — |
| cube, careful | 88.0% | 3.08 |
| cube, casual | 29.8% | 3.65 |
| **match-level skill gap** | **59.5 without, 58.2 with** | |

The cube did nothing for skill and shortened the match from 3.78 boards to 3.08. The
research explains why, and the argument is clean enough that I would take it over my own
model: **a doubling cube's entire expected value is your opponent's error rate.** The formal
result the cube agent derived is `EV = q·t/2` where `t` is the opponent's take/drop error
frequency. The sky plays a fixed heuristic against a public ephemeris. For a competent
player `t` is approximately zero, so the Moonstone is decoration.

Three more findings worth carrying forward:

- In a first-to-3, an unrestricted cube turns a 2-1 lead from 75% into 50%. **The score
  stops meaning anything.** Backgammon needs the Crawford rule to patch exactly this cell,
  and in a five-board match Crawford costs a 2-0 leader 12.5 points of match equity and
  switches your headline mechanic off for the climactic board.
- A cube shortens best-of-five into best-of-three, which is worth about 3.5 points *to the
  weaker player*. You would be adding a mechanic whose main structural effect is to help
  whoever is behind on skill.
- The argument *for* it survives all of that: at 1-1 in a best-of-five, a single take/drop
  decision is worth up to **25 points of match equity**, five times what an ordinary misplay
  costs. Concentrating consequence into a few legible moments is genuinely good design.
  It just needs uncertainty to exist first.

So: **the cube is a second-order mechanic. It becomes available once §2.4 ships**, because a
dealt five is genuine shared uncertainty. Build it after, not now. And if it ships, cap it
at one call per match, forced before the third placement, which sidesteps Crawford entirely
and gives a clean 25% take point.

### 2.8 Simultaneous placement: interesting, unresolved, probably a different game

Agent 1's headline recommendation was to skip randomness entirely and make placement
simultaneous and double-blind. Both sides commit secretly, both reveal, conflicts on the
same slot resolve by a stated rule. It kills the opening book with zero luck added and
creates yomi.

| | careful | casual | gap | night-sd |
|---|---|---|---|---|
| simultaneous, she plays her top move | 76.6 | 58.7 | 17.9 | **29.7** |
| simultaneous, she picks 1 of her top 2 | 83.5 | 63.6 | 19.9 | 15.9 |
| simultaneous, she picks 1 of her top 3 | 85.9 | 65.8 | 20.1 | 10.9 |

Casual play nearly doubles (32.9 to 58.7) because her heuristic is *reactive* and
simultaneity takes away her ability to react. She would need rebuilding from scratch. And
night-sd at 29.7 is the highest number in the entire study, by a lot.

I am flagging this as **unresolved rather than recommended**, because caveat 3 is doing
heavy lifting: my agent does not bluff, does not model her modelling it, and the whole value
of the mechanic is in exactly that. It also changes the genre, and it is a much larger build
than §2.4. But the night-variety number is high enough that it deserves a proper look rather
than a footnote.

**The exploit scan under simultaneity is not reported here because my scan was defective** —
it enumerated the 90 openings but never actually forced them into the game, so it measured
the same unforced board ninety times. Whether an opening book survives simultaneous
placement is therefore **unmeasured**. It should be the first thing checked if this option
is pursued.

---

## 3. Your four proposals, each with a verdict

**"Shuffle the whole 28, draw 3 at a time."** *No.* Careful play falls to 27.8%, the skill
gap to 10.6, and night-to-night variety halves. 25% deck exposure with no mulligan and five
placements is a spot no shipped card game occupies. The 28 is a beautiful collection number
and a bad deck number.

**"Cards you acquire shuffle into your whole deck, Slay the Spire style."** *No, and it is
backwards here.* The deck-size table shows every acquisition making you weaker and the game
luckier. StS makes dilution a real decision because you draw 5 of your deck every turn and
cards do things when drawn; Manzil lodges five cards a board and a card in your deck that
you never draw did nothing at all. Progression should live in **which twelve you own and
draft**, not in mid-run accretion.

**"Start with all cards but a shuffled hand, 3 at a time."** *Nearly — with one change.*
Deal the five **before the board and show them**, drafted from twelve, rather than drip-fed
three at a time during it. That is the row that works. The instinct was right; the timing
was wrong. Choose-1-of-3 also kills the exploit (0 of 90) but costs another 10 points of
skill gap and does not put either agent in band.

**"No powers until you claim the mansion for the first time."** *No, in that form — but the
idea is salvageable and the salvage is better than the original.* The dormant-powers agent
modelled it: the literal version (right mansion, right slot, right night) needs **9.7 to
24.5 years** of daily play to complete, the night-only reading needs 0.7 to 4 years, and
dropping the calendar entirely needs 12 to 35 nights. That is a 250x spread across readings
of the same sentence, which is the tell that the mechanism is uncalibrated rather than
mistuned. The sim adds the other half: with **no signatures awake the skill gap is 5.6
points**. A new player would be playing a coin flip during precisely the window in which
they decide whether to keep playing.

The diagnosis I would keep: **you are gating power when you meant to gate meaning.** Monster
Hunter's ecological research, the closest working precedent, unlocks map legibility and
grants zero combat advantage. Two better shapes, both from the report:

- **First Light (recommended).** All 28 signatures live from night one. What claiming a
  mansion on its own night unlocks is *commemoration* — its true name appears on the face,
  it takes a permanent mark, its shard opens a further stanza. You keep the entire emotional
  payload of "I took al-Thurayyā on al-Thurayyā's night," it costs onboarding nothing, it
  skill-gates nothing, and it composes with the familiarity law instead of competing with it.
- **Many Doors**, if real dormancy is load-bearing: start every player with 5 to 7 already
  awake (endowed progress: 19% versus 34% completion in the canonical study), and give each
  card several *sufficient* wake paths — claim it on its own night, or claim it three times
  on any night, or lose to it three times, or reach L2 with it. Redundancy turns a gate into
  a shortcut and makes nothing missable.

One decision blocks both, and it is one sentence: **are signature abilities formally
independent of the road-shards?** If a mansion's signature is narratively bound to its shard,
gating it behind winning a claim is skill-gating shard-adjacent content and the ethics floor
forbids the whole proposal regardless of tuning.

---

## 4. What I would ship, ranked

1. **Deal the five before the board, from a drafted twelve, fully revealed.** The one
   configuration that kills the opening book and puts both agents in band. Twelve is the
   number Marvel Snap arrived at from an almost identical brief, and twelve signs against
   twenty-eight mansions is a free thematic hook.
2. **Level the loaners, or level them faster.** §2.3 is the hidden blocker: the whole design
   in (1) reads 59.4/36.7 at L3 and 37.8/18.0 at proto levels. Decide how a new player gets
   a competitive twelve without grinding, because right now the answer is that they do not.
3. **Guarantee a floor rather than adding a mulligan.** The mansion the Moon actually
   occupies tonight is always among your dealt five. One line of rules, free thematically,
   and it pre-empts the "I had nothing to open with" complaint that will otherwise generate
   a mulligan request in the first week of playtesting. Snap solved the same problem with a
   single card rather than a system.
4. **Retire the 4+ flip floor as a target.** §2.4b measures drama directly and the dealt
   five wins on it with fewer flips. Keep flips as a diagnostic, not a gate, and do not
   spend skill gap buying them back.
5. **Keep the 28 night rules, rescoped as variety.** They buy night-sd 16.6 to 19.8 at no
   cost to skill. They are not the fix and should stop being scoped as one.
6. **First Light instead of dormant powers.** All abilities live, claiming grants
   recognition.
7. **Hold the cube until (1) ships**, then one call per match, forced before the third
   placement.
8. **Prototype simultaneous placement separately.** Highest variety number in the study,
   worst-modelled, biggest build. It deserves a real look, not a decision made off my agent.

---

## 5. Things the literature says that the sim cannot

- **Attributability is the whole defence against added luck.** A December 2025 PLOS
  Computational Biology study found players attribute losses to external causes with high
  confidence and well above the true causal weight (Z = 5.99, p < 0.001; self-estimated
  ability roughly double the true value). If you add a deal, you must add a post-mortem: the
  position at the critical move, what you played, what the best line was, what it was worth.
  Into the Breach's rule — every loss must be reconstructible as your own fault — is the
  standard to hit.
- **Randomise which cards, never which number wins.** Garfield, 2012: randomness is better
  coming "from different choices rather than just random success or failure." Your
  resolution rule is legible and instantly checkable. Do not touch it. No plus-or-minus
  rolls, no percentage flips, no void-of-course fizzles.
- **Give the player a lever over the degree of randomness**, since that is what the one
  controlled study found actually predicts satisfaction. A re-deal once per match, or an
  election of the hour, does more for the feel than any amount of tuning the deal itself.
- **Symmetry has to be checkable.** Brode's defence of Snap's randomness is that both
  players feel the same amount. If you shuffle only the player's hand against a fixed sky
  you have built what James Ernest calls *biased* randomness — the least defensible
  arrangement available, a player losing to a fixed opponent because of their own bad draw.
  This is the strongest single argument for dealing from a **drafted** pool that the player
  chose, rather than from the raw 28.
- **Cap the combo chain before adding any variance on top of it.** A tie-flipped card that
  attacks its own neighbours is an unbounded chain, and chains are where variance goes
  non-linear. Blizzard's fix for the same problem was a stopping condition, not a deletion.
  Worth measuring the current tail before adding a deal.

---

## 6. What to decide

1. Twelve-card drafted deck, or keep the fixed chart five and accept the opening book?
2. If twelve: how does a new player get a levelled twelve without grinding?
3. Are signature abilities formally independent of the road-shards? (One sentence, blocks
   the whole dormancy question.)
4. Does the Moon-mansion floor go in the deal?
5. Is simultaneous placement worth a prototype, or is it a different game?
6. Flip density re-tune: before or after the deal ships?

---

## 7. Addendum, same day: the starter twelve and what levelling should carry

*Three decisions taken after the above was written: the onboarding fix is a **starter
twelve**; the never-skill-gate-the-shards clause is **lifted**; abilities should wake at
**L2** as the thing to work toward. Engine: `research/progress.py`, data
`research/manzil-loop/progress.json`.*

**Abilities already wake at L2.** That is the shipped rule today (`Rules`: `if lvl < 2:
ab_eff = None`). So the instinct is correct and already built. The real question is not
whether levelling grants abilities. It is whether levelling should *also* grant numbers,
which it currently does, and that turns out to be the whole problem.

### 7.1 The level ladder is the game, and that is a power curve, not a mastery curve

Starter twelve, dealt five, every card at the same level:

| | careful | casual | skill gap |
|---|---|---|---|
| L1: base numbers, no ability | **12.4** | 11.0 | **1.4** |
| L2: base numbers, ability | 35.8 | 16.1 | 19.7 |
| L3: +1 low face, ability | 59.4 | 36.7 | 22.7 |
| L4: +1 both faces, ability | 80.2 | 51.5 | 28.7 |

Each level is worth roughly **23 points of win rate**. A new player holding an unlevelled
twelve wins 12.4% of boards, and their **skill gap is 1.4** — careful play is worth
almost nothing, because a base-numbered mansion simply cannot answer a planet. Whatever
else is true, **a twelve at L1 cannot ship.** That is not a difficulty curve, it is a wall
with a grind on the far side of it.

### 7.2 Freeze the numbers and let abilities carry the progression

Same starter twelve, numbers frozen at today's L3 values from night one, abilities waking
one at a time (the twelve contains six signature cards: Storm, Throne, Crown, Heart, Blaze,
Jewel):

| abilities awake | careful | casual | skill gap | avg margin |
|---|---|---|---|---|
| 0 of 6 | 33.5 | 25.6 | 7.9 | 3.40 |
| 1 of 6 | 39.5 | 29.8 | 9.7 | 3.07 |
| 2 of 6 | 44.3 | 29.2 | 15.1 | 2.90 |
| 3 of 6 | 47.4 | 33.9 | 13.5 | 2.88 |
| 4 of 6 | 47.5 | 31.5 | 16.0 | 2.72 |
| 5 of 6 | 59.8 | 35.2 | 24.6 | 2.35 |
| **6 of 6** | **59.4** | **36.7** | **22.7** | 2.41 |

This is the shape you want and it does three things at once.

- **Day one is playable.** 33.5% instead of 12.4%. A new player loses more than they win,
  which is correct against the sky, but they are in the game.
- **The runway is real and it is long.** Twenty-six points of win rate, delivered entirely
  by waking abilities. That is a genuine progression arc with no number inflation anywhere
  in it.
- **The game gets tenser as you progress, not just easier.** Average margin tightens
  monotonically, 3.40 down to 2.41. And the **skill gap grows from 7.9 to 22.7**, which
  means the game becomes *more* about skill the further in you get. That is the opposite of
  what the current ladder does, where the gap is bought with numbers.

The control confirms the numbers have to be re-baselined rather than earned: with base
numbers and abilities alone, 0 of 6 reads 12.4% and 3 of 6 only reaches 24.7%. **Abilities
cannot carry a player who is numerically outgunned.** The +1 to the low face has to be in
the card from the start.

### 7.3 What this means concretely

1. **Re-baseline the 28 mansion cards at today's L3 values.** That becomes the card, full
   stop. Delete the numeric component of levelling.
2. **The starter twelve ships at those numbers with zero abilities awake.** Day one is
   33.5% careful, and every ability you wake is a felt, measurable gain rather than a
   number nudge.
3. **L2 wakes the ability. L3 and L4 stop touching numbers** and carry the familiarity law
   instead: the face sheds its name, then its move, then everything but the art. Levelling
   becomes about *knowing* the card, which is what the familiarity law was always for.
4. **The 21 remaining signature-less cards are now the critical path.** Under this design,
   a card without a signature has no progression at all. Six signatures carry a twelve;
   twenty-eight cards need something closer to twenty-eight.
5. **Skill-gating is no longer constrained** per the 21 August decision, so the dormancy
   design is free to be whatever plays best. The evidence still favours **starting some
   awake** over starting none: 0 of 6 has a skill gap of 7.9, which is close to a coin flip
   for a beginner, and 2 of 6 nearly doubles it to 15.1 while keeping the win rate at 44%.
   Two or three awake at the start is a better first hour than zero, and it costs nothing
   from the runway.

---

## 8. Addendum: scaling. Two curves, and which levers are allowed to move

*§7 presented player power against a **fixed** sky, which reads as "the game gets easier as
you progress." That is a fair objection and it is the right one. This section separates the
two curves and finds which difficulty levers are usable. Engines: `research/scaling.py`,
`ladder.py`, `calib.py`, `dignity.py`. Data in `research/manzil-loop/`.*

### 8.1 What "harder" should mean

Three numbers, and only one of them should stay still.

- **Player power** rises as abilities wake. Measured in §7: 33.5% to 59.4%.
- **Sky difficulty** must rise with it, or the game does get easier.
- **The experienced win rate** is the product of the two and should stay roughly flat, near
  55-60% of boards for a careful player.

And a fourth number is the one that says whether the difficulty is any good: **the skill
gap should grow.** That is what a game getting harder ought to feel like — not that you lose
more often, but that playing carelessly costs more. A sky who beats you regardless of how
well you play has not made the game harder, she has made it luckier.

**So the test for any difficulty lever is: does it lower the win rate without lowering the
skill gap?** Four were tested at 6 of 6 abilities awake, against the shipped baseline of
60.4% careful and a 22.6-point gap:

| lever | win rate | skill gap | verdict |
|---|---|---|---|
| she reads deeper (8 to 24) | 60.4 → 49.3 | 22.6 → **25.3** | **good** |
| she reads deeper (8 to 12) | 60.4 → 50.4 | 22.6 → **24.2** | **good** |
| ties go to her | 60.4 → 36.0 | 22.6 → 16.1 | bad |
| she leads every board | 60.4 → 38.7 | 22.6 → 12.7 | bad |
| both at once | 60.4 → 23.7 | 22.6 → **3.8** | very bad |

Only one family passes. **Difficulty has to come from her playing better, not from her
being given more.** Every advantage handed to her shrinks the set of positions where the
player's choice changes the outcome, and that is the definition of a luck game. The last
row is the clearest: a sky who leads and wins ties beats a careful player 76% of the time
while careless play does almost as well, gap 3.8.

### 8.2 The reason nothing scales right now: it is a step, not a curve

Her hand strength, swept against player power, reading depth 8:

| abilities awake | 1 planet | 2 planets | 3 planets | 4 planets | **5 planets** |
|---|---|---|---|---|---|
| 0 careful | 69.2 | 86.5 | 67.6 | 68.9 | **29.9** |
| 0 gap | 15.5 | 34.3 | 25.0 | 26.2 | **3.3** |
| 2 careful | 79.5 | 89.1 | 71.4 | 73.7 | **45.8** |
| 4 careful | 83.2 | 90.8 | 75.7 | 74.3 | **47.6** |
| 6 careful | 91.8 | 94.0 | 81.4 | 84.1 | **60.4** |
| 6 gap | 31.1 | 33.7 | 29.0 | 32.5 | 22.6 |

Everything from one to four planets sits in a band between 68% and 94%, which is to say
trivially winnable. Add the fifth and it drops 24 to 39 points at every level of player
power. **There is no middle.** The whole difficulty range of Manzil is compressed into a
single card, and below that card the game is a formality.

That is why progression cannot be balanced today. There is nothing to tune: one step, and
it is a cliff.

### 8.3 The dial that works, sized

With her planetary abilities set aside so the effect is clean, reading depth alone, player
at 6 of 6 abilities:

| how deep she reads | careful | casual | skill gap |
|---|---|---|---|
| 0 (purely greedy) | 87.6 | 68.3 | 19.3 |
| 8 (shipped) | 71.1 | 54.5 | 16.6 |
| 12 | 59.2 | 43.5 | 15.7 |
| 24 | 58.2 | 38.2 | **20.0** |

**Twenty-nine points of difficulty on one legible dial, with the skill gap intact at both
ends.** That is a real curve, and it has as many steps in it as you want to author.

Design's 21 August decision, "she reads deeper each rung," is therefore the correct
mechanism and this is the evidence for it. Two adjustments to how it was scoped: the useful
range is **8 to 24, not 8 to 12**, and going *below* 8 is not an easier setting. A purely
greedy sky is a different opponent, not a weaker one.

Her planetary abilities are the coarse dial, worth about 23 points on their own, and they
cost skill gap when they come on. Weight bonuses in the style of Jupiter's are the worst
dial tested: five bodies carrying one drops the gap from 22.0 to 11.2. Use her abilities to
separate the walkers from the sky, and her reading depth for everything in between.

### 8.4 A nine-rung ladder that actually scales

Rungs one to eight are walkers: ordinary hands, no planetary abilities, **reading depth
climbing 0 to 24**. Rung nine is the sky: deep reading *plus* her five planetary abilities
*plus* Jupiter's weight. Measured anchor points:

| | careful | skill gap |
|---|---|---|
| beginner (0 abilities) vs rung ~4 (reads 8, no bonuses) | 55.8 | 22.0 |
| veteran (6 abilities) vs rung 8 (reads 24, one bonus) | 58.2 | 20.0 |
| veteran (6 abilities) vs rung 9, the full sky (reads 12) | 50.4 | 24.2 |

Both ends land near the 55-60% target with the gap above 20. **The same ladder serves a
beginner and a veteran because they stand on different rungs of it**, and how high you can
climb is itself the readout of your progress. That is the scaling you asked for, and it
needs no new systems: nine rungs and a monotonic hardening are already the decision on the
sheet.

### 8.5 Caveats on this section

- `dignity.py` varies weight bonuses by overwriting the planets' `ab` field, which also
  strips Saturn's, Mars's, Venus's and Mercury's signatures. So those rows measure "weight
  bonus **without** her abilities," not the shipped sky. The difference is large and worth
  stating: at 0 abilities awake, a sky with Jupiter's bonus but no planetary signatures
  gives the player 52.8%, while the real shipped sky gives 29.9%. **Her five signatures are
  worth about 23 points on their own.**
- The reading-depth sweep in `ladder.py` is non-monotonic *with her signatures live*
  (shipped depth 8 is close to her weakest setting; both greedier and deeper play beat it).
  The clean monotonic curve in §8.3 is with signatures set aside. Both facts are real; the
  interaction between her depth and her signatures has not been untangled and should be
  before the ladder is authored.
- All win rates here are boards, careful is 2-ply, casual is 1-ply, two seeds, 672 to 896
  boards per cell. Deltas travel between ports; absolutes do not.

---

## 9. Addendum: the 21 unsigned mansions. Two cheap answers tested, both fail.

*Engines: `research/dominion.py`, `confirm.py`. Data `manzil-loop/dominion.json`,
`confirm.json`.*

### 9.1 The problem, stated

The 28 cards carry only **15 distinct number-pairs**, and 7 have signatures. The Ghost, the
Claws and the Flock are all 6/6, exactly like the Crown, with no ability. Three mansions
that are the same card with different names.

| faces | cards |
|---|---|
| 6/6 | Ghost, Claws, **Crown**, Flock |
| 6/5 | Gate, Mane, Guide |
| 7/6 | Gathered Stars, Return, Root |
| 7/7 | Follower, **Jewel**, **Heart** |
| 5/6 | **Blaze**, **Hideaway**, Thread |
| 7/5 | Turning, Chamber |
| 7/4 | Hand, Listener |

It is invisible today because the player holds a fixed five and four of the five are signed.
Draft a twelve from 28 and the choice collapses to "take the seven that do something."

### 9.2 A deepened dominion does not fix it

Proposal tested: a mansion with no signature counts **three** on its own home rather than
two. `PLAIN12` is a twelve built only from cards that have no signature today.

| | careful | casual | gap |
|---|---|---|---|
| PLAIN12, dominion as today | 17.1 | 7.9 | 9.2 |
| PLAIN12, deepened dominion | 22.1 | 11.1 | 11.0 |
| BEST12 (six signed), as today | **58.0** | 35.7 | 22.3 |

Five points. A signature-less twelve stays unplayable and nowhere near a signed one.
**Withdrawn on the evidence.** Dominion fires on at most one or two slots a board, so
tripling it cannot compete with an ability that fires every time the card is placed.

### 9.3 Drafting for tonight's road does not pay either

The companion idea was that dominion would make the nightly draft a real decision, since
nine of the 28 mansions sit on the road each night.

| | careful | casual | gap |
|---|---|---|---|
| fixed twelve, signatures as today | **58.0** | 35.7 | 22.3 |
| drafted for tonight's road | 42.9 | 29.6 | 13.3 |
| drafted for tonight, deepened dominion | 32.3 | 22.9 | 9.4 |

Forcing tonight's nine mansions into the twelve means taking bad cards, and dominion does
not repay it. Deepening dominion makes it worse, not better. **Also withdrawn.**

### 9.4 Signatures are not decoration. They are where the skill lives.

| | careful | casual | **gap** |
|---|---|---|---|
| no card has a signature | 33.2 | 27.3 | **5.9** |
| today: 7 of 28 signed, BEST12 | 60.4 | 37.8 | 22.6 |
| **all 28 signed, BEST12** | 72.0 | 50.4 | 21.6 |
| **all 28 signed, PLAIN12** | **43.6** | 22.1 | **21.5** |

Strip every signature and the game is nearly pure luck: a 5.9-point gap means careful play
is barely distinguishable from careless. Sign all 28 and a twelve built from today's
*worst* cards goes from 17.1% to 43.6%, and its skill gap from 9.2 to 21.5.

**That is the answer. Every mansion needs a signature, and it is load-bearing rather than
flavour.**

### 9.5 The loop carries it, with her reading depth taking up the slack

All 28 signed runs about 10 points hot. The dial from §8.3 covers it:

| all 28 signed, BEST12 | careful | casual | gap | flips | margin | comeback wins |
|---|---|---|---|---|---|---|
| she reads 8 (shipped) | 72.0 | 50.4 | 21.6 | 3.44 | 2.50 | 41.5% |
| **she reads 12** | **64.3** | **39.4** | **24.9** | 3.57 | 2.63 | **40.8%** |
| she reads 16 | 64.0 | 37.6 | 26.4 | 3.56 | 2.64 | 41.1% |
| she reads 24 | 63.8 | 33.8 | **30.0** | 3.56 | 2.64 | 41.2% |
| *reference: today's 7 signatures, reads 8* | *60.4* | *37.8* | *22.6* | *3.50* | *2.39* | *39.4%* |

At reading depth 12 the game is at the top of the careful band with casual in band, the
skill gap is **up** from 22.6 to 24.9, comebacks are **up**, flips are unchanged, and
margins stay near two and a half cards. Nothing degrades. Push her to 24 and the gap
reaches 30.0, the highest recorded in this study.

**So yes, functionally the loop carries a signature on all 28.** It carries it better than
the current seven.

### 9.6 Caveats

- The "all 28 signed" rows recycle **six existing ability types** round-robin across the 28,
  not 28 designed abilities. This measures *capacity*, not balance: it shows the loop does
  not break under 28 live signatures and that they carry the skill gap. It says nothing
  about whether any particular 21 are the right ones.
- The spread between a strong twelve (72.0) and a weak one (43.6) is 28 points even with
  everything signed. Some spread is correct — drafting should matter — but 28 points is
  wide, and it is partly an artifact of recycled abilities landing on numbers they do not
  suit. Real designed signatures should narrow it. Worth re-measuring once they exist.
- Prior history says roughly a third of authored signatures land with the wrong sign:
  Storm, Crown, Jewel and Hideaway all measured net-negative or backwards on first cut.
  Budget for 21 signatures to need about 30 sim-tested and a rework pass.

- All win rates are percentages of **boards**, not matches, unless the row says match.
- Seeds 11 and 97 throughout; every headline row replicated on both.
- `night-sd` is the standard deviation of the per-night win rate across the 28 nights.
  Higher means the nights differ more from each other.
- `BEST12` in the sim is my own pick from the prior card ranking (Storm, Throne, Crown,
  Heart, Blaze, Jewel, Follower, Gathered Stars, Root, Return, Chamber, Turning). It is a
  stand-in for a drafted deck, not a validated one. A real draft would be player-chosen and
  probably better, so read the M rows as a floor.
- The exploit scan forces a named card into the opening hand where the configuration would
  not otherwise guarantee it, so the "best opening" figures are **conditional on holding the
  card**. That is the strong form of the test.
- The cube model is first-order: one double per board, offered after the player's second
  lodge on a count-differential threshold, with a fixed drop threshold for the sky. It is
  not a match-equity-aware cube. Read it as "a naive cube does not help," not as "no cube
  can help."
