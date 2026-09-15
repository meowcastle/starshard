# Handoff: Design, 22 August 2026

A research session simulated the randomness question end to end: shuffle mechanics, the
doubling cube, dormant abilities, difficulty scaling and the signature slate. **Nothing was
changed in the prototype, the sheets, or `research/combos.json`.** Everything below is a
decision you own or a consequence of one.

**Paths.** Relative to the **starshard.net repo root**, not the Build Plan folder. Both have
a `research/` directory and they are different.

**Required companion.** `research/manzil-randomness.md` carries the full evidence for every
call below, `research/manzil-signatures.md` carries the signature measurements, and
`research/manzil-loop/sim-pack-21aug.tgz` carries the engines and raw JSON. All three should
travel with this document.

**Reading the numbers.** Every figure is percentage of **boards** won, careful play is the
2-ply agent, casual is 1-ply, two seeds minimum, 448 to 1,792 boards per cell. Deltas travel
between ports; absolutes do not. Target bands: careful **55-65**, casual **35-45**.

---

## 0. The one-line summary

The game is solved because the first move is the same every night, and it does not scale
because there is no difficulty curve, only a cliff. Two engine changes fix both. A third
change to what levelling means fixes onboarding. The signature slate is yours.

---

## 1. Card numbers stop levelling. Levelling grants the signature and the familiarity law.

Report: `manzil-randomness.md` §7. Engine: `research/progress.py`.

Today L1 is base numbers with no ability, L2 wakes the ability, L3 adds +1 to the lower
face, L4 adds +1 to both. Each step is worth about **23 points of win rate**, which means
the level ladder *is* the game:

| starter twelve, all cards at | careful | casual | skill gap |
|---|---|---|---|
| L1 | **12.4** | 11.0 | **1.4** |
| L2 | 35.8 | 16.1 | 19.7 |
| L3 | 59.4 | 36.7 | 22.7 |
| L4 | 80.2 | 51.5 | 28.7 |

A new player at L1 wins 12% of boards with a **1.4-point skill gap**. Careful play is worth
nothing, because a base-numbered mansion cannot answer a planet. **A twelve at L1 cannot
ship.**

**Decision: re-baseline all 28 mansions at today's L3 values.** Those become the card.
Delete the numeric component of levelling entirely. L2 wakes the signature; L3 and L4 carry
the familiarity law only, shedding the name then the move then everything but the art.

With numbers frozen and only signatures waking:

| signatures awake | careful | casual | skill gap | avg margin |
|---|---|---|---|---|
| 0 of 6 | 33.5 | 25.6 | 7.9 | 3.40 |
| 3 of 6 | 47.4 | 33.9 | 13.5 | 2.88 |
| 6 of 6 | 59.4 | 36.7 | **22.7** | 2.41 |

Twenty-six points of runway carried entirely by abilities, margins tightening the whole way,
and the **skill gap grows as you progress** rather than being bought with numbers.

Control, so this is not misread: with base numbers and abilities alone, 0 of 6 reads 12.4%
and 3 of 6 only reaches 24.7%. Abilities cannot carry a player who is numerically outgunned.
**The +1 has to be in the card from night one, not earned.**

## 2. The starter twelve ships awake

Consequence of §1. A fully asleep twelve reads careful 33.2 / casual 27.3 with a **5.9-point
skill gap** — a new player cannot distinguish good play from bad during exactly the window
in which they decide whether to keep playing.

**Decision: the starter twelve ships with its signatures already awake.** Every mansion
collected after the starter arrives at L1 asleep and wakes at L2 through play. The engine
rule (`lvl < 2` silences the ability) is unchanged; the starter is simply granted at L2.

Open, yours: **which twelve.** The sim used a stand-in (Storm, Throne, Crown, Heart, Blaze,
Jewel, Follower, Gathered Stars, Root, Return, Chamber, Turning) picked from the prior card
ranking. It is a floor, not a recommendation.

## 3. Five dealt from a drafted twelve at the start of each board, revealed in full

Report: `manzil-randomness.md` §2. Engines: `draw_sim.py` through `draw_sim5.py`.

The opening is solved: seven of ninety openings win **100% of boards on all 28 nights**,
replicated on four seeds. Every AI-side countermeasure was tested and failed, including the
28 night rules (§6 below).

Every mechanism that shuffles **during** the board destroys the game:

| | careful | casual | **gap** | night-to-night variety |
|---|---|---|---|---|
| shipped, fixed five | 73.5 | 35.4 | **38.1** | 18.0 |
| draw 3 from shuffled 28 | 27.8 | 17.2 | 10.6 | 9.2 |
| draw 6 from shuffled 28 | 55.2 | 37.8 | 17.4 | 10.9 |
| choose 1 of 3 with carry | 44.6 | 32.1 | 12.5 | 17.5 |

The gap collapse is the game becoming luck. The variety collapse is worse and was not
expected: shuffling does not make nights differ, it averages them into one soup.

Deck size makes it monotonically worse (deck 8 → gap 28.2; deck 28 → gap 10.9), which rules
out a Slay-the-Spire acquisition model. You lodge five cards a board, so every card acquired
is pure dilution.

**Decision: deal five from a drafted twelve at the start of each board and reveal them in
full.** Randomness before the board, in the open. Full information inside the board, so
reading ahead still pays.

| | careful | per seed | casual | gap | flips |
|---|---|---|---|---|---|
| shipped | 73.5 | 74.5 / 72.9 / 72.3 / 74.5 | 35.4 | 38.1 | 4.06 |
| **dealt five of twelve** | **58.7** | 57.9 / 58.8 / 57.3 / 60.9 | **36.4** | **22.3** | 3.69 |

Exploit scan: **0 of 90 openings win all 28 nights**, down from 5. Best opening 85.3%,
perfect on 9 nights of 28. Both players land in band for the first time in the study, at a
cost of 15.8 points of skill gap.

It is also the **most dramatic** configuration measured — see §5.

Open, yours: whether the mansion the Moon occupies tonight is guaranteed in the dealt five.
One line of rules, free thematically, and it pre-empts the mulligan request that will
otherwise arrive in the first week of playtesting.

## 4. Difficulty comes from how well she plays, never from what she is given

Report: `manzil-randomness.md` §8. Engines: `scaling.py`, `ladder.py`, `calib.py`.

**The test for any difficulty lever: does it lower the win rate without lowering the skill
gap?** A sky who beats you regardless of how well you play has not made the game harder, she
has made it luckier. Four levers, veteran player, against 60.4% careful and a 22.6 gap:

| lever | win rate | skill gap | |
|---|---|---|---|
| she reads deeper, 8 → 24 | 60.4 → 49.3 | 22.6 → **25.3** | **use** |
| she reads deeper, 8 → 12 | 60.4 → 50.4 | 22.6 → **24.2** | **use** |
| ties go to her | 60.4 → 36.0 | 22.6 → 16.1 | banned |
| she leads every board | 60.4 → 38.7 | 22.6 → 12.7 | banned |
| both together | 60.4 → 23.7 | 22.6 → **3.8** | banned |

**Why there is currently no curve.** Her hand strength, swept against player power:

| abilities awake | 1 planet | 2 | 3 | 4 | **5** |
|---|---|---|---|---|---|
| 0 | 69.2 | 86.5 | 67.6 | 68.9 | **29.9** |
| 6 | 91.8 | 94.0 | 81.4 | 84.1 | **60.4** |

One to four planets sits between 68% and 94%. The fifth drops it 24 to 39 points. **The
entire difficulty of Manzil lives in one card.** There is nothing between trivial and a wall.

**The dial that works**, her signatures set aside so the effect is clean:

| she reads | careful | casual | skill gap |
|---|---|---|---|
| 0 (greedy) | 87.6 | 68.3 | 19.3 |
| 8 (shipped) | 71.1 | 54.5 | 16.6 |
| 12 | 59.2 | 43.5 | 15.7 |
| 24 | 58.2 | 38.2 | **20.0** |

Twenty-nine points on one legible dial with the gap intact at both ends.

**Decision: the nine-rung ladder is built on reading depth.** Rungs one to eight are walkers
with ordinary hands and no planetary signatures, depth climbing 0 to 24. Rung nine is the
sky: deep reading plus her five signatures plus Jupiter's weight. The 21 August "she reads
deeper each rung" decision is correct and this is the evidence for it, with two adjustments:
**the useful range is 8 to 24, not 8 to 12**, and **going below 8 is not an easier setting** —
a purely greedy sky is a different opponent, not a weaker one.

Anchors: a beginner at rung ~4 reads 55.8% with a 22.0 gap; a veteran at rung 8 reads 58.2%
with a 20.0 gap; the full sky holds a veteran to 50.4% with a 24.2 gap. The same ladder
serves both because they stand on different rungs of it, and how high you can climb is the
readout of progress.

**Caveat before authoring exact rung values.** Reading depth is clean when her signatures are
set aside but **non-monotonic with them live**: shipped depth 8 is close to her *weakest*
setting, and both greedier and deeper play beat it. Her five signatures are worth about 23
points on their own. That interaction has not been untangled and should be before rung
numbers are written into data.

## 5. Retire the 4+ flip floor. Use drama directly.

Report: `manzil-randomness.md` §2.4b. Engine: `drama.py`.

The flip floor was always a stand-in for "the board should feel eventful." Eventfulness is
now measurable:

| careful play | lead changes | comeback wins | avg margin | boards within 1 card | flips |
|---|---|---|---|---|---|
| shipped, fixed five | 2.13 | 30.5% | 2.90 | 37.8% | 4.16 |
| **dealt five of twelve** | 1.92 | **37.3%** | **2.41** | **39.6%** | 3.69 |
| draw 3 from shuffled 28 | 1.72 | 19.9% | 3.48 | 27.7% | **4.53** |

The shuffle deck has the most flips and the least drama in the study: cards changing hands
constantly while the outcome was never in doubt. The dealt five gets more comebacks, closer
boards and more single-card finishes with **fewer** flips.

**Decision: the 4+ flip target is retired.** Keep flips as a diagnostic. Do not spend skill
gap buying them back — the Storm reworks that clear the floor cost about 8 points of careful
play and 9 of skill gap, which is selling the thing to buy the proxy.

## 6. The 28 night rules are variety, not the fix. I was wrong about that.

The 21 August weakspot addendum said promoting the night rules from flavour to fix was "the
only mechanism identified that breaks the solved opening." Tested with seven rule families
rotating by night:

| | best opening | wins all 28 nights | careful | gap | variety |
|---|---|---|---|---|---|
| shipped, one rule | 100.0% | 5 of 90 | 73.1 | 40.2 | 16.6 |
| 7 rules rotating | 100.0% | 2 of 90 | 69.4 | 35.0 | 22.7 |
| 28 rules | 100.0% | 3 of 90 | 73.3 | 41.0 | 19.8 |

A strong opening is strong under most rule sets. Changing the rule changes which line
follows; it does not make the line unknowable.

**They stay on the roadmap as variety**, which is what they were originally for and which
they deliver well: night-to-night variation rises from 16.6 to 19.8 with no loss of skill
gap. **Rescope them accordingly** — they were carrying the largest item on the list and no
longer need to.

## 7. The Moonstone waits

Report: `manzil-randomness.md` §2.7, and `manzil-loop/cube-and-stakes.md` for the full
literature pass.

A doubling cube's entire expected value is the opponent's error rate. The sky plays a fixed
heuristic against a public ephemeris, so for a competent player that rate is approximately
zero. Measured: match-level skill gap **59.5 without the cube, 58.2 with it**, and matches
shortened from 3.78 boards to 3.08. It made the game slightly less skillful and shorter.

Two structural problems beyond that: in a first-to-three an unrestricted cube turns a 2-1
lead from 75% into 50%, so the score stops meaning anything, and Crawford — the standard
patch — costs a 2-0 leader 12.5 points and switches the headline mechanic off for the
climactic board.

**Decision: hold the Moonstone until §3 ships.** A dealt hand is the shared uncertainty a
stake mechanic needs. When it does ship: one call per match, forced before the third
placement, which sidesteps Crawford and gives a clean 25% take point.

## 8. Signatures: yours, and here is the calibration bar

You already have a full slate in `Manzil - Signature Pass.dc.html` and it is the one to
build from. I drafted a competing 28 and measured them; **the measurements are the useful
part, not my wordings.** `research/manzil-signatures.md` has the full table.

**What a signature needs to be worth.** Each card forced into every hand, signature live
versus silenced, 1,680 boards per condition:

| band | worth | examples from the measured slate |
|---|---|---|
| real | +12 to +15 | Storm (cannot be tied) +15.4, a reach-one-further strike +15.0, an immunity on the low face +14.8 |
| solid | +4 to +9 | Throne +5.2, Jewel +4.8, Crown +4.5 |
| too small to feel | +1 to +3 | six of mine landed here |
| inert | 0.0 | five of mine, and **the Hideaway as shipped** |
| harmful | negative | **the Heart as shipped, −8.8** |

**Two findings that bear on your slate directly.**

**The Heart is broken today.** "Fights +1 while she holds more of the road" measures
**−8.8**: a card that is strong only while you are losing rewards falling behind and is dead
once you are ahead. Your sheet already replaces it with "safe while touching your card,"
which does not have that shape. Good call, and now there is a number behind it.

**The Hideaway is inert today**, at exactly 0.0. Silencing its own mansion silences its own
dominion, so it cancels itself out. Your "numbers hidden until fought" is a different and
much better mechanic.

**Two on your sheet need a decision first.** *The Glance* — "reveals one of her closed
cards" — and *The Listener* — "her next card plays face-up" — both assume she has closed
cards. Her five planets are public by design and that publicness is one of the game's better
ideas. Either those two need rewriting, or hidden information is a rules change that has to
be taken first. For what it is worth, §2.6 measured hiding her hand: it costs careful play 4
to 12 points and gives nothing back, though that is a floor, since the agent cannot infer the
way a person would.

**Free read-across from the measured slate**, where your mechanic matches one I tested:

| your card | your signature | closest measured mechanic | worth |
|---|---|---|---|
| The Drum | its claim strikes one further | reach past what it takes | **+15.0** |
| The Storm | claims ties | unchanged | +15.4 |
| The Blaze | its claims are final | unchanged | +13.4 |
| The Thread | the board wraps, edges touch | wrap while at an end | +2.0, and yours is stronger |
| The Gathered Stars | counts as two | Crown's counts-two | +4.5 |

**The harness is yours.** `research/sig28.py` implements a full 28 against the 21 August port
and `research/sigtest.py` runs the per-signature sweep. Swap the wordings for yours and it
will tell you which of your twenty-eight are inert before anyone builds them. That took about
forty minutes of compute for the full slate.

**One number to watch through the pass:** a twelve built only from the twenty-one
*non-shipped* cards. My draft reads 35.6% with a 9.9-point gap, which is bottom-heavy. It
should reach the fifties with a gap above eighteen before the slate is final.

## 9. Withdrawn on the evidence

Four recommendations are dead, three of them mine from this session or the last:

- **Widening her seeded tiebreak** (weakspot report §1). Tested at 0.5 through 10. Nothing
  takes the best opening below ~75% and everything that dents it costs the casual player 10
  to 15 points.
- **The night rules as the fix for the opening** (weakspot addendum). See §6.
- **A deepened dominion for signature-less cards.** A twelve of unsigned cards goes 17.1% to
  22.1% with tripled home value, against 58.0% for a signed twelve. Dominion fires on one or
  two slots a board; an ability fires every placement.
- **Drafting your twelve for tonight's road.** 42.9% against 58.0% for a fixed twelve, and
  deepening dominion makes it worse (32.3%). Forcing tonight's nine mansions into the twelve
  means taking bad cards.

## 10. Still open, and yours

1. Which twelve is the starter twelve.
2. Whether the Moon's mansion is guaranteed in the dealt five.
3. The signature slate, including the Glance and Listener question in §8.
4. Whether simultaneous double-blind placement gets a prototype. It scored the highest
   night-to-night variety in the entire study (29.7 against 18.0 shipped) and adds zero luck,
   but her heuristic is reactive and would need rebuilding from scratch, my agent does not
   model the bluffing that is the entire point, and my exploit scan for it was defective so
   whether an opening book survives is **unmeasured**.
5. Untangling her reading depth from her signatures before rung values are authored (§4).

## 11. Where it lands in the prototype

`Star Shard v3 Build Plan/Manzil - Prototype.dc.html`, by method:

- **`_cards()`** — the card table. §1 re-baselines all 28 to their L3 numbers and removes the
  numeric effect of `lvl`. The `lvl < 2` gate on abilities stays as-is.
- **The hand setup** — §3 replaces the fixed chart five with a deal of five from a
  twelve, rolled at the start of each board and shown in full.
- **`_skyMove` / `_bestYouReply`** — §4. The reply weight becomes the ladder's dial, per rung,
  range 8 to 24. It is currently a constant.
- **`_tryFlip` and `_resolve`** — untouched by these decisions. The signature pass will touch
  both; `research/sig28.py` shows the hooks each family needs.
- **`_boardWinner`** — untouched. Tie-count-to-you stays.

## 12. What done looks like

- All 28 mansions carry their L3 numbers in `_cards()` and levelling no longer changes them.
- A board opens by dealing five from a twelve, face up.
- The reply weight is per-rung data rather than a constant, and no rung gives her ties or the
  lead.
- Careful play sits **55-65%** of boards and casual **35-45%** at every rung, with a skill gap
  above **20**.
- No single opening wins on more than about a third of nights.
- The signature slate is sim-checked and nothing in it measures at zero or negative.
