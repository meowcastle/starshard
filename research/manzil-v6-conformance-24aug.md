# Manzil v6, re-conformed against the 24 Aug engine — 25 August 2026

> **SUPERSEDED IN PART — read `research/README-MANZIL.md` first.**
> §1 and §2 (the port was broken; here is the harness that catches it) still stand.
> **§3 through §14 were measured before the hand-order tiebreak was fixed** and understate the
> player by 4 to 11 points. In particular §5 recommends a starter pack of six; the answer is
> now **seven**. Current numbers: `docs/handoffs/HANDOFF-GAMEPLAY-25AUG.md` Appendix B.

Re-run because `Star Shard v3 Build Plan/research/manzil-engine-v6.js` changed on 24 Aug at
16:15 and no number had been re-measured against it. Supersedes nothing outright, but see §4:
**the pack-of-12 row in the 22 Aug table does not reproduce and should be treated as void.**

Method: the reference engine is the source of truth. Every figure below is produced by
running the JS engine directly, not the Python port, so port fidelity is not in the
measurement path. The port was re-conformed separately (§1) so future Python work can resume.

---

## 1. The port was broken, and is fixed

`manzil-engine-v6.js` grew from 22,774 to 27,100 bytes. The change is one theme: **ten
abilities that were hardcoded to only fire for `"you"` now fire for either hand.** Gate,
heart, bearer, ghost, chamber, glance, blaze, return, turning, listener. The engine's own
vector suite grew from 33 to 51 and passes 51/51.

`manzil_v6.py` still carried all ten `"you"` hardcodes.

**Measured divergence, 400 random boards, unpatched port against the 24 Aug engine: 167/400
identical.** It disagreed on 58% of boards. Every number produced by that port after 24 Aug
16:15 would have been wrong.

Fixed. The ten symmetry fixes are ported, plus one that the old vector suite never caught:

> **`skyMove` never saw the pending glance.** In JS the agents read `g.glanceOn` and
> `g.retUsed` off the game object, so both agents and their nested reply searches see them.
> The Python `sky_move`/`best_you_reply` took neither as a parameter. This was a latent
> divergence, not a new one, and it is exactly the class of bug open item 8 predicted:
> *"nothing constrains `youMove`/`skyMove`/`playBoard`, which is where all three of my worst
> divergences lived."*

Glance appeared in the player's hand in **21 of 21** residual diverging boards, which is how
it was found.

**Conformance now:**

| check | result |
|---|---|
| the 33 vectors | 33/33 |
| differential, 400 boards, depths 0/8 | 400/400 identical |
| differential, 2,000 boards, depths 0-16, hands of 2-6 | **2,000/2,000 identical** |
| `deal()`, 400 pack/seed pairs | 400/400 identical |

## 2. Open item 8 is closed, by a harness rather than by three vectors

`research/v6diff.js` + `v6diff.py` + `gen_cases.py` run the same random boards through both
engines and compare winner, both counts and flip totals. It constrains `youMove`, `skyMove`
and `playBoard` end to end, which no hand-written vector set was going to do. Run it before
trusting the port:

```
python3 gen_cases.py 77 2000
node v6diff.js ./manzil-engine-v6.js > js.json
python3 v6diff.py cases.json > py.json      # then compare
```

## 3. The 24 Aug engine change barely touches single player

| pack | careful 22aug → 24aug | casual 22aug → 24aug |
|---|---|---|
| 5 | 62.5 → 62.5 (+0.0) | 37.5 → 37.5 (+0.0) |
| 12 | 47.6 → 47.6 (+0.0) | 25.7 → 25.7 (+0.0) |
| 28 | 30.1 → 28.6 (−1.5) | 20.5 → 18.9 (−1.6) |

Same harness, same seeds, only the engine swapped. 672 boards per cell.

**Why it is ~zero:** the sky at her table holds the planets (101-105), whose abilities are
saturn/mars/venus/mercury/jupiter, not the ten mansion abilities that were made symmetric.
The walkers are loaner mansions with `ab: null`. So no opponent in single player has ever
held one of the fixed abilities.

**The symmetry fix is a PvP fix.** It matters exactly where both hands hold real mansion
cards, which is the new Socket.io lobby. Single-player tuning done before 24 Aug survives.

## 4. Hand order is worth more than anything else being tuned

Same twelve, same dealt five, only the order the hand is handed to the agent varies. 40
orderings, 56 boards each:

| | min | median | max | spread |
|---|---|---|---|---|
| careful | 37.5 | 46.4 | 55.4 | **17.9** |
| casual | 14.3 | 25.0 | 39.3 | **25.0** |

The conformance doc flagged this in §3 on 22 Aug and it is still not addressed. **Nothing
else on the tuning list moves the number this much.** Until the brief pins the ordering or
randomises the tiebreak, any single-configuration figure carries roughly ±9 points of free
variance and two runs can disagree without either being wrong.

**Consequence for the 22 Aug table.** Its pack-of-5 row (62.5 / 37.5 / 25.0) reproduces
exactly, because `deal` returns the pack unchanged at five or fewer, so ordering is fixed.
Its pack-of-28 careful row (38.8) also reproduces. **Its pack-of-12 row (71.2 / 47.1) does
not reproduce under any configuration tried here, including on the 22 Aug engine**, where the
same harness gives 47.6 / 25.7. 71.2 also sits above the maximum of the 40-ordering sweep.
Treat that row as void and do not build on "she is too soft at a pack of twelve" — see §5.

## 5. Starter pack size, isolated from composition — open item 1

The earlier sweep confounded size with which cards were in the pack. This one holds the chart
five fixed and draws the remainder at random, resampling 16 packs per size, 896 boards a cell.

Bands: careful **55-65**, casual **35-45**, skill gap **20+**.

| pack | careful | casual | gap | flips | close% |
|---|---|---|---|---|---|
| **5** | **62.5** | **37.5** | 25.0 | 4.66 | 25.0 |
| **6** | **57.5** | 32.8 | 24.7 | 4.71 | 32.5 |
| **7** | **55.8** | 27.1 | **28.7** | 4.93 | 33.9 |
| 8 | 49.9 | 27.2 | 22.7 | 5.02 | 32.1 |
| 9 | 48.3 | 28.8 | 19.5 | 4.93 | 32.5 |
| 10 | 49.6 | 26.8 | 22.8 | 5.02 | 33.8 |
| 12 | 46.1 | 24.4 | 21.7 | 5.02 | 32.3 |
| 14 | 45.5 | 24.9 | 20.6 | 5.06 | 30.9 |
| 16 | 41.5 | 23.9 | 17.6 | 5.30 | 28.7 |
| 20 | 39.3 | 21.3 | 18.0 | 5.38 | 24.4 |
| 28 | 38.8 | 21.4 | 17.4 | 5.40 | 23.7 |

**Careful play falls monotonically, 62.5 to 38.8. More cards makes the game harder, not
easier.** There is no plateau from five to twelve and no cliff at twenty-eight. The 22 Aug
reading of this curve was an artifact of a single curated twelve at a favourable ordering.

**What this changes.** "Raise the starter pack above five" is still correct, because `deal`
does not fire at five or fewer and that is what makes the opening solvable. But the size has
a price nobody had costed: **every card added past five moves casual play further below
band**, and casual is the audience the free game is for.

**Recommendation: six or seven, not twelve.**

- **Six** is the minimum that fires the deal. Careful 57.5, in band. Casual 32.8, two points
  under. Smallest disturbance to a curve that was already tuned at five.
- **Seven** has the widest skill gap on the board at 28.7, careful still in band at 55.8, and
  the close-board rate climbs to 33.9% from 25.0% at five, so boards get tighter as well as
  more varied. It costs another five points of casual.
- **Twelve is off the table on this evidence.** Careful 46.1 is nine points below band and
  casual 24.4 is ten under.

Pick six if the priority is not disturbing casual play, seven if it is skill expression.

## 6. Caveats, stated so they can be argued with

1. **Cells are 896 boards**, so a 95% interval is roughly ±3.3 points. Differences under
   about five points in §5 are not individually significant. The monotone trend across eleven
   sizes is.
2. **Ordering is not pinned in §5** — it is randomised through `deal`, and §4 says that is
   worth up to 18 points on a single configuration. Averaging over 16 packs × 2 leaders × 28
   nights is what makes the column trustworthy; no individual row is.
3. **Sky depth fixed at 8** throughout, her table. The walkers' ladder was not re-run; it was
   in the timed-out first pass and is still open.
4. **Nothing here measures the friend-build at `/manzil`.** §3 of the 22 Aug summary rests on
   `district.js`, which was not re-run. Its conclusion should hold, since §3 above shows the
   engine change is inert for loaner walkers, but it is unverified.

---

## 7. What the pack actually is, and the progression problem — added 25 Aug

Three things were being conflated. Separating them:

- **PvP needs no fix. It already got one.** The 24 Aug symmetry change *is* the PvP fix.
  §3 raised it only to explain why the single-player numbers did not move.
- **Nothing was removed.** "Drafting your twelve for tonight's road" was *withdrawn as a
  proposal* on 22 Aug and never built. "Pack of 12" in these tables means *twelve mansions
  owned*, not a picking step.
- **The hand is always five.** `deal()` returns five every board and only fires above a pack
  of five. Pack size changes the *pool*, never the hand.

### The pool is a difficulty dial that runs backwards

New cards arrive the way the game describes them: *"seven on loan, asleep at level one:
numbers only, no move yet."* §5 measured everything awake, which is the best case. Measured
both ways, 12 random packs per size, 672 boards a cell:

| pack | all awake careful/casual | as the game gives them | cost of being asleep |
|---|---|---|---|
| 5 | 62.5 / 37.5 | 62.5 / 37.5 | 0.0 |
| 6 | 58.2 / 32.7 | 52.1 / 30.7 | 6.1 |
| 7 | 57.3 / 28.3 | 50.0 / 24.9 | 7.3 |
| 8 | 50.6 / 28.1 | 40.6 / 23.1 | 10.0 |
| 12 | 47.6 / 25.1 | **36.8 / 18.6** | 10.8 |
| 28 | 39.1 / 20.8 | **31.1 / 14.7** | 8.0 |

**Growing from five to twelve costs careful play 25.7 points and casual 18.9.** Waking every
one of those cards recovers only about eleven. **Collecting mansions makes the player weaker,
and finishing the collection does not undo it.**

This is not a bug in the deal. It is the same fact as the solved opening, seen from the other
side: at a pack of five you hold all five every board, and *that consistency is both why the
opening is solvable and why the win rate is 62.5.* You cannot keep the number and lose the
solve. They are one property.

Since the 22 Aug re-baseline, level does not touch numbers at all (`makeCards` applies the
+1 unconditionally and `lvl` is inert). The only power a level grants is waking the
signature, and the table above prices that at ~11 points against a ~26 point loss.

### Two levers, for two different problems

**1. The starter pack: six, shipped awake.** Careful 58.2, in band. Casual 32.7, 2.3 under.
It is the smallest pack that fires the deal, so it is the cheapest possible fix for the
solved opening. Note the price is real and unavoidable: **any deal at all costs casual play
about five points**, because variance hurts the weaker agent more. Seven awake is defensible
too (57.3 / 28.3, widest skill gap) but it costs another four points of casual.

The extra card must ship **awake**. At six, awake is 58.2 and asleep is 52.1 — that six-point
gap is the difference between in band and below it. This is consistent with the existing
decision that the starter pack ships with its signatures awake.

**2. An awake-floor in `deal()`, for the collection curve.** Guarantee a minimum number of
signature-live cards in the five, alongside the existing tonight's-mansion guarantee:

| pack | floor 0 (shipped) | floor 1 | floor 2 | floor 3 |
|---|---|---|---|---|
| 8 | 40.6 / 23.1 | 41.2 / 23.1 | 44.2 / 23.5 | 46.6 / 26.6 |
| 12 | 36.8 / 18.6 | 36.6 / 18.8 | 40.0 / 22.8 | **47.6 / 24.3** |
| 16 | 33.2 / 19.9 | 34.8 / 21.0 | 37.1 / 20.5 | 40.9 / 23.5 |
| 28 | 31.1 / 14.7 | 34.1 / 15.2 | 38.1 / 17.3 | **42.6 / 21.6** |

A floor of three is worth **+10.8 careful at a pack of twelve and +11.5 at twenty-eight**. It
does not restore the pack-of-five number — nothing does — but it stops the collection curve
collapsing as the player grows toward all 28, which is the arc the whole game is built on.
Floor 1 is worth nothing; floor 2 is half the effect; the lever is floor 3.

It is a small change to one function and it does not reopen any locked decision.

### Open after this

- Casual play is below band at every pack size above five, floor or no floor. If casual
  35-45 is still the target, something other than pack size has to give it back.
- The walkers' ladder and `district.js` are still un-rerun (§6 caveats 3 and 4).

---

## 8. Her reading depth does nothing — added 25 Aug

The live game sets her reading depth to `rung + (your card's level x 2)`
(`Manzil - The Empty District.dc.html:2571`). Rungs run 3 to 11, boss 14, so depth spans
about 5 to 22 across the whole climb. Pack of six, 10 random packs a size, 560 boards a cell:

| her reading depth | strong player | weak player |
|---|---|---|
| 3 | 52.5 | 32.7 |
| 5 | 58.4 | 33.2 |
| 8 | 57.9 | 32.7 |
| 11 | 58.6 | 33.8 |
| 14 | 58.8 | 33.4 |
| 17 | 58.8 | 32.5 |
| 20 | 58.6 | 33.0 |
| 22 | 58.6 | 33.2 |

**Flat. From depth 5 to 22 the strong player moves 0.2 points and the weak player 0.0.**

Three consequences, and they are large:

1. **Levelling a card does not make its road harder.** The `+ lvl * 2` term is inert.
2. **The nine-rung ladder is not a difficulty curve.** Rungs 3 through 11 are the same
   difficulty. The gradient the 22 Aug run measured (casual 60-86% across the rungs) comes
   from the *walkers' hands* in `district.js`, which differ per rung, not from depth.
3. **This contradicts a locked principle.** "Difficulty comes from how well she plays, never
   from what she is given" is the stated rule. The data says difficulty comes *entirely* from
   what she is given, and how well she plays does nothing measurable.

If the ladder is meant to be a climb, the rungs have to differ in hands, not in depth. The
depth dial should be dropped or replaced rather than tuned.

---

## 9. Best-of-N buys almost nothing — added 25 Aug

Two of your own documents disagree. `randomness-theory.md` §5.3 computes that a best-of-five
amplifies a per-board edge (0.60 per board becomes a 0.683 match). `manzil-sim-report.md:199`
says it does not, "because boards alternate lead and win rates differ sharply by lead."

Measured on the engine, lead alternating each board as the game does it, 560 matches a cell:

| format | strong player | weak player | gap | boards per battle |
|---|---|---|---|---|
| best of 1 | 69.1 | 33.4 | 35.7 | 1.00 |
| best of 3 | 70.2 | 31.3 | 38.9 | 2.47 |
| best of 5 | 69.3 | 29.1 | 40.2 | 3.94 |
| best of 7 | 70.4 | 27.5 | 42.9 | 5.44 |

**`manzil-sim-report.md` is right and §5.3 does not apply here.** The strong player gains
1.3 points going from one board to seven. The predicted amplification (69% per board should
become ~83% at best-of-five) does not happen at all.

**The gap widens only by punishing the weak player**, 33.4 down to 27.5. That is the opposite
of what a longer match is supposed to buy.

**Why:** §5.3 assumes independent boards. They are not. The lead alternates every board and
the lead is worth a great deal, so a longer match just hands the two sides the good lead in
turn and washes out. The skill edge never compounds.

**Consequences.**

1. **Do not make the eight walker battles best-of-N to add playtime.** It costs about four
   times the boards, returns 1.3 points of skill expression, and takes six points off the
   weaker player, who is the free game's audience.
2. **If a longer match is wanted for its own sake, the lead has to change.** Fix it, or
   randomise it, and the amplification in §5.3 becomes real. Alternating is what kills it.
3. Length should come from the 112 roads, not from longer battles.

---

## 10. The ladder, and why the spec is over-constrained — added 25 Aug

Brief: 28 mansions x 4 levels x 9 battles. Rungs scale up within a level, levels scale up
against each other, difficulty comes from the opponent's hand, every hand on a mansion's road
holds that mansion, and mansion-to-mansion difficulty matches. Levels 1 and 2 only for now.

### 10.1 What works — the dials, measured

**Card strength as an opponent card** (`cardstrength.js`, `cardstrength.json`). Player win%
when that card sits in her hand with four random others, 224 boards a card:

| | asleep | awake | the signature is worth |
|---|---|---|---|
| the thread | 82.6 | **42.9** | 39.7 |
| the listener | 88.4 | **51.3** | 37.1 |
| the throne / hideaway / follower | 81-83 | 64 | 17-18 |
| ...20 cards in the middle... | 84-93 | 71-86 | 3-15 |
| the chamber | 85.3 | 89.3 | **−4.0** |
| the glance | 84.4 | **92.0** | **−7.6** |

**Two signatures make their holder weaker.** The Glance costs 7.6 points and the Chamber 4.0.
That is a straight bug in the slate and it hands Design two named targets for open item 5.

**Hand size is the master dial, and nothing else is close.** Player always holds five:

| her hand | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|
| weak cards, asleep | 96.9 | 90.2 | 79.0 | 69.6 | 68.3 |
| mid cards, awake | 97.3 | 83.0 | 69.6 | 59.4 | 54.5 |
| strong cards, awake | 81.3 | 58.5 | 37.9 | 28.1 | 23.2 |

97% down to 23%. That is the whole ladder in one table, and it maps naturally onto the brief:
**hand size is the level dial, card quality is the rung dial.** Level 1 she holds five, level 2
she holds six, and levels 3 and 4 have seven and eight waiting.

Two things that do **not** work as dials: her reading depth (§8, flat), and planets in her
hand — awake mansion signatures beat planets, so swapping companions for planets makes her
*weaker*, 63.4 to 67.9.

### 10.2 The conflict

Three of the brief's requirements cannot hold at once:

1. tonight's mansion is forced into every hand on its road
2. every mansion's road is equally hard
3. the ladder spans a wide difficulty range

**The forced card alone swings 49 points** (Thread 42.9 to Glance 92.0). That is wider than
the ladder being built. Measured both ways:

| | rung 1 to rung 9 | spread between mansions |
|---|---|---|
| uncompensated (companions drawn freely) | 93.2 → 56.4 | 30 to 70 points |
| compensated (companions offset tonight's mansion) | 84.8 → 77.4 | sd 9-18 |

Compensating flattens the ladder to seven points, because the strong companions that made the
hard rungs hard are exactly what has to be given up to offset a strong mansion. **You can have
the range or the uniformity, not both, while requirement 1 stands.**

### 10.3 Three ways out, in the order I would take them

**1. Fix the outlier signatures first.** Six cards cause most of the 49-point spread: the
Thread and the Listener at the strong end, the Glance, Chamber, Mane and Ghost at the weak.
Compress those and the range falls to roughly 25 points, at which point compensation becomes
affordable and requirements 1-3 can all hold. This is open item 5, which was already on the
list, and §10.1 now says exactly which cards and by how much.

**2. Order the 28 mansions by difficulty and make that the campaign.** If mansions cannot be
equal, stop fighting it: sort them and let the player meet the gentle ones first. The
uncompensated ladder's 30-70 point spread stops being an inconsistency and becomes the
game's macro-progression, with the 28-night cycle as its shape.

**3. Relax requirement 1.** Put tonight's mansion in *some* of the nine hands rather than all
nine — the sky's hand and a few walkers. The flavour survives and the companions are freed to
build the ladder.

1 and 2 combine well. 3 is the cheapest if the ladder is needed before Design can revisit the
slate.

### 10.4 What is ready to ship now

`ladder2.js` and `fullgrid.json` hold the measured recipe space, 99.6% down to 31.7%, indexed
by hand size, tier and awake count. Once the requirement-1 question is settled, picking nine
rungs per level out of that table is an afternoon, not a research problem.

---

## 11. The Chamber, and two retractions — added 25 Aug

### 11.1 Retracting the Glance

§10.1 reported the Glance costing its holder 7.6 points. **That was noise.** Re-measured at
1,008 boards a cell (±3.1 points at 95%) with the companions held asleep so the card under
test is the only variable:

| card | asleep | awake | the ability is worth | |
|---|---|---|---|---|
| the thread | 85.4 | 71.5 | **+13.9** | real |
| the listener | 87.0 | 80.2 | **+6.8** | real |
| the chamber | 84.2 | 88.5 | **−4.3** | **real, and negative** |
| the glance | 90.5 | 91.2 | −0.7 | not significant |
| the veil | 88.8 | 90.5 | −1.7 | not significant |
| the ghost | 84.6 | 85.5 | −0.9 | not significant |
| the mane | 89.6 | 89.7 | −0.1 | not significant |
| the heart | 87.7 | 87.7 | 0.0 | not significant |

The Thread's 39.7 in §10.1 also shrinks to 13.9 here, because that measurement let it combo
with awake companions. **Both numbers are true of different situations**; 13.9 is the card's
own contribution, 39.7 is what it is worth in a hand built around it.

### 11.2 Four of eight signatures do nothing at all

The Veil, Ghost, Mane and Heart are all within noise of zero. On its own, a card's signature
being awake changes nothing measurable for four of the eight tested. That is a sharper version
of open item 5 than "14 need work": it is not that they are mistuned, it is that they are
**inert**, and `sig28.py` should be re-pointed at this question.

### 11.3 The Chamber genuinely hurts whoever holds it

Confirmed at −4.3, well outside noise. Three explanations were tested:

**Not a timing artifact.** Shelter that never expires: still −3.3. Shelter only on the turn
the card lands: exactly 0.0, because a card is never the *target* on the turn it lands, so
that version never fires at all.

**Not an exploit by a strong opponent.** This is the decisive one:

| opponent | asleep | awake | ability worth |
|---|---|---|---|
| searching (careful) | 84.2 | 88.5 | −4.3 |
| greedy (casual) | 58.2 | 66.3 | **−8.0** |

**It hurts twice as much against an opponent who does not search at all.** A greedy player
cannot exploit anything, so this is not outplay.

**The hypothesis that fits both results — the Chamber saves the opponent from their own
greed.** A greedy player is weak precisely because they take the tempting flip in front of
them. The Chamber makes that flip impossible, so the greedy player is forced onto a different
move, and the forced move is on average better than the one greed would have chosen. Denying
a bad player their bait improves their play.

**[HYPOTHESIS — not proven.]** It fits the sign, fits it being larger against greedy play, and
fits shelter duration being irrelevant. To confirm: log the opponent's chosen move with and
without the Chamber present and compare the quality of the move actually taken.

**If it holds, this is a card to lean into rather than fix**, but it belongs in the *player's*
hand as an anti-bait tool, and it is a trap in hers. Worth deciding deliberately, because
right now it sits in the pool as a card that quietly punishes whoever draws it.

## 12. The ladder, with mansions free to vary — added 25 Aug

Requirement 2 dropped: mansions may differ, levels must scale. Hand size is the level dial.

| | rung 1 | rung 9 (the sky) | mansion range at the sky |
|---|---|---|---|
| **level 1** — she holds 5 | 90.2 | **60.7** | 19 to 88 |
| **level 2** — she holds 6 | 83.3 | **47.1** | 19 to 81 |
| level 3 — she holds 7 | ~70 | ~28 | *(bookmarked)* |
| level 4 — she holds 8 | ~68 | ~23 | *(bookmarked)* |

Level 4's sky at roughly 23% is what "hard to earn" looks like, and it arrives for free from
the hand-size dial without touching anything else.

**One correction to the rung recipe.** Walking the tiers weak → mid → strong produced four
adjacent pairs within noise of each other, because the weak and mid tiers barely differ. All
of the movement lives in one variable: **how many of her strong-tier cards are awake**, which
runs 84.6 down to 60.7 on its own at a hand of five. Build the nine rungs out of that single
dial and the curve is monotone without fighting noise.

---

## 13. The Chamber theory is confirmed — added 25 Aug

§11.3's hypothesis, tested directly. A greedy player plays out boards against a hand holding
the Chamber, awake and asleep. At every player turn, the move greedy actually took is scored
against the best move available, in the careful agent's own scoring currency. **Regret** is
how much worse the chosen move was. 2,520 player turns per arm.

| | mean regret | perfect moves |
|---|---|---|
| chamber asleep | 8.31 ±0.47 | 57.9% |
| chamber awake | **7.16 ±0.45** | **62.4%** |

Difference **1.15 ±0.65 — significant.**

**The Chamber makes the opponent play better.** Not by outplaying them, by removing the bait.
A greedy player is weak because they take the tempting flip in front of them; the Chamber
makes that flip impossible, they are pushed onto another move, and the move they are pushed
onto is on average closer to what a careful player would have chosen. Perfect moves rise 4.5
points.

That is the whole mechanism, and it explains every earlier result: why the penalty is real
(−4.3), why it doubles against a greedy opponent (−8.0), and why shelter duration is
irrelevant (−3.3 even when permanent).

**This is a real mechanic, not a bug.** A card that protects by denying the opponent a
tempting mistake is a coherent and unusual thing to own. It is simply on the wrong side: it
should be a tool the player aims at the sky, and it is a trap in any hand that draws it
blindly.

---

## 14. The algorithm, levels 1 and 2, all 28 mansions — added 25 Aug

`research/ladder-spec.js` is the generator. `research/ladder-l1l2.json` is its output: all
**504 hands** (2 levels x 28 mansions x 9 rungs) with a measured win rate for each.

### 14.1 The rule

Two lookups and a deterministic pick. No per-mansion authoring.

1. **Level sets her hand size.** L1 = 5 cards, L2 = 6, L3 = 7, L4 = 8.
2. **Rung sets how many of her cards are strong-tier, and how many of those are awake:**

| rung | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (sky) |
|---|---|---|---|---|---|---|---|---|---|
| strong cards | 0 | 1 | 1 | 2 | 2 | 3 | 3 | 4 | all |
| of those, awake | 0 | 0 | 1 | 1 | 2 | 2 | 3 | 4 | all |

3. **Tonight's mansion is always in her hand and fills the first strong slot.** The remaining
   strong slots come from the top ten of the ranking, the rest from the bottom fourteen, picked
   by a hash of (mansion, level, rung) so the same road always deals the same walkers.

The half-steps matter: a strong card *asleep* is the intermediate rung between not holding it
and holding it awake. That is what turns six usable steps into nine.

### 14.2 Measured, 784 boards a rung

| rung | level 1 | level 2 |
|---|---|---|
| 1 | 93.0 | 83.8 |
| 2 | 92.5 | 85.2 |
| 3 | 90.7 | 84.2 |
| 4 | 87.4 | 76.9 |
| 5 | 84.1 | 78.6 |
| 6 | 82.9 | 75.1 |
| 7 | 78.7 | 69.3 |
| 8 | 69.0 | 60.6 |
| **9 (the sky)** | **64.0** | **47.8** |

**Level 1 is monotone across all nine rungs.** Level 2 has two bumps, at rungs 2 and 5, both
about 1.5 points and inside the ±3.5 noise band at this sample size. Worth a re-run at higher
n before authoring, not worth redesigning around.

**Level 2 is harder than level 1 at every rung**, and at the sky for 24 of 28 mansions.

### 14.3 The mansion spread, which is intended

| | gentlest mansion | median | hardest |
|---|---|---|---|
| level 1 sky | 92.9 | 60.7 | 28.6 |
| level 2 sky | 100 | 46.4 | 14.3 |

Ordered gentlest first, which is the suggested campaign order:

> the mane, the jewel, the claws, the heart, the bearer, the chamber, the ghost, the turning,
> ... and hardest: the gate, the void, the throne, **the listener, the thread**

The two hardest roads are the two cards whose signatures actually work (§11.1). Fixing the
four inert signatures will compress this list, so **re-run `ladder-spec.js` after any change
to the slate** — the ranking it is built on lives in `cardstrength.json`.

### 14.4 What is not yet done

- Levels 3 and 4. The hand sizes are reserved (7 and 8) and the same rung table applies, but
  they wait on their specializations being decided.
- Per-cell n is 28 boards, so an individual mansion-rung figure carries about ±18 points. The
  aggregate curve and the mansion ranking are solid; a single cell is not. Raise `REPS` in
  `ladder-spec.js` before quoting any one road.
