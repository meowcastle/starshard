# Handoff: gameplay, 25 August 2026

The complete mechanical spec for Manzil, measured end to end. **Gameplay only** — nothing here
is about distribution, accounts or policy. Everything is measured against the reference engine
at its 24 Aug state, or against `research/manzil-engine-v7-l34.js`, which is that engine plus
seven patches for levels 3 and 4.

**Paths — corrected 25 Aug after Code's review.** Two `research/` directories exist and they
are different, and the original wording here got it backwards. To be exact:

- **`Star Shard v3 Build Plan/research/manzil-engine-v6.js`** is the reference engine. That one
  file, and only that one, lives in the Build Plan folder.
- **Everything else cited in this document lives in the repo-root `research/`** — the v7
  engines, `cardstrength.json`, `dealfix.js`, `ladder-spec.js`, `ladder-l1l2.json`,
  `gen_cases.py`, `v6diff.js`, `v6diff.py`, `sig28-all.json`, and
  `manzil-v6-conformance-24aug.md`.

The conformance doc **does exist**, at `research/manzil-v6-conformance-24aug.md`. A search of
the Build Plan folder will not find it, which is what the original wording caused.

**Reading the numbers.** Every percentage is the *player's* board win rate, so **lower means
harder**. Cells are 560 to 1,008 boards. Anything inside about ±3.5 points is noise. Target
bands: careful **55-65**, casual **35-45**, skill gap **20+**.

**Companion evidence.** `research/manzil-v6-conformance-24aug.md` and
`research/manzil-l34-options.md`. Every claim below cites a section there.

---

## 1. The loop

The moon sits in one of 28 mansions each night. That is tonight's mansion.

A board is nine slots in a row. Each player holds five cards with a number on the left edge
and a number on the right. Players alternate placing. A placed card's left number fights its
left neighbour's right number, and its right number fights its right neighbour's left. The
bigger number takes the neighbour and flips it. When all nine slots are full, whoever owns
more wins the board.

To claim a mansion you walk its road: **eight walkers, then the sky.** Win the road and that
mansion's card rises one level. The road re-arms when the moon comes round again.

**28 mansions x 4 levels x 9 battles = 1,008 battles.**

---

## 2. What makes it hard, and what does not

**Her thinking does nothing.** Search depth was measured from 5 to 22. The strong player moved
**0.2 points** across that entire range and the weak player moved **0.0** (conformance §8).

Two consequences:

1. **Delete the `+ this._mlvl(tonight) * 2` term** at `Manzil - The Empty District.dc.html:2571`.
   Levelling a card does not make its road harder. That term is inert.
2. **The rung's depth numbers are inert too.** `[3,4,5,6,7,8,9,11]` and the boss's 14 produce
   no gradient. Pin depth at 8 for everyone and stop treating it as a tuning parameter.

**What does work is her hand**, and it is two dials (conformance §10.1):

| she holds | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|
| weak cards, asleep | 96.9 | 90.2 | 79.0 | 69.6 | 68.3 |
| mid cards, awake | 97.3 | 83.0 | 69.6 | 59.4 | 54.5 |
| strong cards, awake | 81.3 | 58.5 | 37.9 | 28.1 | 23.2 |

97% down to 23%. **Hand size is the level dial. Card quality is the rung dial.**

Two things that also do not work as dials: **planets in her hand** (awake mansion signatures
beat planets, so swapping companions for planets makes her *weaker*, 63.4 to 67.9), and
**best-of-N battles** (§7).

---

## 3. The level system

| level | name | what the player gets |
|---|---|---|
| 1 | claimed | the card, numbers only |
| 2 | awake | its signature fires |
| 3 | familiar | its quadrant's grant (§3.1) |
| 4 | unleashed | the standard bearer (§3.2) |

### 3.1 Level 3 — four grants, one per quadrant

The quadrants come from `mansions-table.json`'s `fy_god` column, unmodified. Mansion 2 is
blank there and belongs to Byakko by position. Four contiguous blocks of seven.

| symbol | mansions | grant | what it does |
|---|---|---|---|
| **Byakko** white tiger | 1-6, 28 | the guard | cannot be flipped by a tie |
| **Suzaku** vermilion bird | 7-13 | the second strike | its flip carries one slot further |
| **Seiryuu** azure dragon | 14-20 | the turn | may be lodged either way round |
| **Genbu** black tortoise | 21-27 | the return | if flipped, returns to hand instead of changing sides |

**The rule that makes it balance: three of the four fire only on or beside the card's own
mansion slot** (`isHome`). The turn is the exception, because the face is chosen at lodge time.

This was forced by measurement, not chosen for flavour. Ungated, the four together were
**+42.8**, putting a pack of twelve at 76.5% — eleven points above band. Home-gated they are
+23.6 and land inside every target. It also gives `isHome` a job; today only the Storm reads it.

Measured at a pack of twelve, 784 boards a cell:

| at level 3 | careful | casual | gap |
|---|---|---|---|
| nothing (today) | 33.7 | 21.9 | 11.8 |
| seiryuu, the turn | 37.4 | 29.0 | 8.4 |
| byakko, the guard | 34.7 | 23.7 | 11.0 |
| suzaku, the strike | 37.4 | 24.4 | 13.0 |
| genbu, the return | 41.7 | 23.6 | 18.1 |
| **all four** | **57.3** | **37.0** | **20.3** |

**All three bands hit at once.** The four are superadditive: 16.4 individually, 23.6 together.

### 3.2 Level 4 — the standard bearer

`deal(pack, seed, tonight, guarantee, standard)`. The player nominates **one** unleashed card
as tonight's standard; it is guaranteed into the five alongside tonight's mansion. Worth +5.8.

**One, never more.** At five auto-dealt cards the player holds the same five every board,
which is exactly the pack-of-five condition that made the opening solvable. Measured at +26.9
and it re-solves the game.

The measured value is a **lower bound** — the harness nominates mechanically, not
intelligently. A player choosing the right card for tonight does better, and that gap is the
mechanic.

### 3.3 The progression stops collapsing, which was the real problem

| pack | L1/L2 only | + the L3 grants | + the standard bearer |
|---|---|---|---|
| 6 | 52.2 / 28.8 | 59.4 / 36.9 | 60.7 / 32.4 |
| 12 | **33.7** / 21.9 | 57.3 / 37.0 | 54.5 / 36.2 |
| 20 | 29.1 / 16.7 | 48.7 / 36.4 | 54.0 / 31.6 |
| 28 | **21.8** / 12.1 | 49.9 / 28.6 | 48.5 / 27.6 |

The left column falls 52 to 22 as the player collects. The right is roughly flat, 61 to 49.
**Collecting mansions no longer makes you worse** (conformance §7).

---

## 4. The walkers' ladder

`research/ladder-spec.js` generates it. `research/ladder-l1l2.json` is all **504 hands**
(2 levels x 28 mansions x 9 rungs) with a measured win rate for each.

**Level sets her hand size:** L1 = 5, L2 = 6, L3 = 7, L4 = 8.

**Rung sets how many strong cards she holds and how many are awake:**

| rung | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (sky) |
|---|---|---|---|---|---|---|---|---|---|
| strong cards | 0 | 1 | 1 | 2 | 2 | 3 | 3 | 4 | all |
| of those, awake | 0 | 0 | 1 | 1 | 2 | 2 | 3 | 4 | all |

Tonight's mansion always sits in her hand and fills the first strong slot. The rest are picked
by a hash of (mansion, level, rung), so a given road always deals the same walkers. **A strong
card asleep is the half-step** that turns six usable steps into nine.

| rung | level 1 | level 2 |
|---|---|---|
| 1 | 93.0 | 83.8 |
| 4 | 87.4 | 76.9 |
| 7 | 78.7 | 69.3 |
| **9 (the sky)** | **64.0** | **47.8** |

Level 1 is monotone across all nine. Level 2 has two ~1.5 point bumps at rungs 2 and 5, inside
noise. Level 2 is harder than level 1 at every rung, and at the sky for 24 of 28 mansions.

**Mansions are not equally hard, by design.** Level 1's sky ranges 28.6 to 92.9 across the 28.
Sorted gentlest first, which is the suggested campaign order:

> the mane, the jewel, the claws, the heart, the bearer, the chamber, the ghost, the turning …
> hardest: the gate, the void, the throne, **the listener, the thread**

**Each individual cell is only 28 boards (±18 points).** The aggregate curve and the ranking
are solid; a single mansion-rung figure is not. Raise `REPS` before authoring exact values.

---

## 5. The deal

**Starter pack of six, and the sixth card ships awake.** One line, and it is what breaks the
solved opening — `deal` does not fire at five or fewer, so with exactly five you hold all five
every board and six openings win every night.

| pack | careful | casual |
|---|---|---|
| 5 | 62.5 | 37.5 |
| **6 awake** | **57.5** | 32.8 |
| 6 asleep | 52.1 | 30.7 |
| 12 | 46.1 | 24.4 |

Awake matters: 57.5 is in band, 52.1 is not.

**Add an awake-floor of three.** Guarantee at least three signature-live cards in the five,
alongside the tonight's-mansion guarantee. `research/dealfix.js` has the implementation.

| pack | shipped | floor 3 |
|---|---|---|
| 12 | 36.8 / 18.6 | **47.6 / 24.3** |
| 28 | 31.1 / 14.7 | **42.6 / 21.6** |

Floor 1 is worth nothing, floor 2 is half. The lever is three.

---

## 6. The card slate — Design's list, with names

Measured one card at a time, companions asleep, 1,008 boards each (conformance §11).

**Two cards carry the set:** the Thread (**+13.9**) and the Listener (**+6.8**).

**Four signatures are inert** — not mistuned, *inert*:

| card | worth |
|---|---|
| the veil | −1.7 |
| the ghost | −0.9 |
| the mane | −0.1 |
| the heart | 0.0 |

All inside noise of zero. `sig28.py` should be re-pointed at this question and run across all
28 before the slate is rewritten again. The earlier competing slates were both scored on a
measure that could not see this.

**The Chamber is on the wrong side.** It costs its holder **4.3 points**, and the reason is
confirmed rather than guessed (conformance §13): a greedy opponent's mean regret falls from
8.31 to 7.16 and their perfect moves rise from 57.9% to 62.4% when the Chamber is in play.
**It protects a card by removing the opponent's mistake.** That is a real and unusual mechanic
worth keeping — as a tool the player aims at the sky, not as a card sitting in the pool
punishing whoever draws it.

**Byakko's guard is nearly inert at +1.0.** Home-gated it fires too rarely; a tie on or beside
your own slot is a narrow event. Ungated it was +11.7 but flattened the board (flips fell 4.86
to 3.79). It needs a middle setting and that is a design judgement, not a number to pick from
a simulation. Do not let a fifth inert signature ship.

**The Throne needs a replacement** if the turn is granted to Seiryuu. The Throne is mansion 10
and sits in **Suzaku**, so 21 of 28 mansions never gain the turn and it stays distinctive for
most of the set. For the seven that catch up: the recommendation is **it turns in place** —
once a board, after landing, you may flip it. That needs a new kind of move (an action that
spends a turn without lodging a card), which means changing move generation in both agents.
Specify it separately; it is bigger than the seven L3 patches.

---

## 7. Battle length

**Do not make the walker battles best-of-N** (conformance §9). Lead alternating as the game
does it:

| format | strong player | weak player | boards |
|---|---|---|---|
| best of 1 | 69.1 | 33.4 | 1.00 |
| best of 5 | 69.3 | 29.1 | 3.94 |

Four times the boards for **0.2 points** of skill expression, and six points off the weak
player. `randomness-theory.md` §5.3 predicted amplification because it assumed independent
boards. They are not — the lead alternates and the lead is worth a great deal, so a longer
match hands each side the good lead in turn and washes out.

If a longer match is ever wanted, **the lead has to stop alternating.** Then §5.3 becomes real.

---

## 8. PvP — measured for the first time, and it has two problems

Everything above is single player. The 24 Aug symmetry fix was a PvP fix and nothing had ever
been measured with both seats holding real mansion cards. Both hands real mansions, 560 boards
a cell:

### 8.1 The tie rule hands one seat eight points

| ties go to | seat A | seat B | draws |
|---|---|---|---|
| **you** (the shipped setting) | **59.5%** | 40.5% | 0.0% |
| the sky | 51.3% | 48.8% | 0.0% |
| a draw | 51.3% | 40.5% | 8.2% |

`tieRule: "you"` is a deliberate player-favouring rule and it is right for single player. **In
PvP it gives whichever seat is "you" a free 8.2 points.** It must not carry across. Ties should
be draws in PvP, or the rule should alternate with the lead.

With ties neutralised the seats are 51.3 to 48.8 — **the game is fundamentally even.**

### 8.2 Moving second is worth ten points

Ties as draws, split by who placed first:

| | seat A wins | seat B wins |
|---|---|---|
| seat A leads | 41.1% | **51.1%** |
| seat B leads | **52.1%** | 40.4% |

**The player who moves second wins about 51% against about 41%.** Nine slots and five cards
each means ten cards for nine slots, so the second player places the last card and gets the
final answer.

This is also why the lead alternates per board, and it means **a PvP match must have an even
number of boards or an alternating lead**, or the seating decides it. It is the one place
where §7's argument reverses: in PvP the alternation is load-bearing rather than pointless.

### 8.3 The L3 grants do not help the second seat

Both seats at L3 measures the same as only seat A at L3 (70.2 vs 70.4). Seat B gains nothing
measurable from its own grants. **Unexplained and worth investigating before PvP ships with
levels.** It is the same shape as the bug the 24 Aug engine change fixed, and the same shape as
a bug I found in my own variant while writing this — `grantOf` was excluding every loaner copy
by id, so the second seat's grants never fired at all. That one is fixed; whether anything
similar remains is untested.

---

## 9. What is left

### Code

1. **Starter pack to six, sixth card awake.** One line. Unblocks the solved opening.
2. **Delete the depth term** at line 2571, and stop varying depth by rung.
3. **Awake-floor of three in `deal()`.** `research/dealfix.js`.
4. **Port the ladder generator** — `research/ladder-spec.js`, 504 hands.
5. **Port the L3/L4 engine** — `research/manzil-engine-v7-l34.js`, seven patches.
6. **PvP: ties are draws, and the board count is even.** §8.1, §8.2.
7. **Investigate §8.3** before PvP ships with levels.
8. **Pin the hand ordering or randomise the tiebreak.** Hand order alone is worth **17.9
   points to careful play and 25.0 to casual** on identical cards (conformance §4). It is
   larger than anything else on this list and every number anyone measures — mine included —
   carries about ±9 points of free variance until it is fixed.

### Design

1. **Byakko's guard** — pick its middle setting (§6).
2. **The four inert signatures** — Veil, Ghost, Mane, Heart (§6).
3. **The Chamber's side** — player tool or rewrite (§6).
4. **The Throne's replacement** (§6).
5. **The campaign order** — gentlest mansion first, ranking in `cardstrength.json` (§4).
6. **The run structure.** Still the largest open gameplay item and unmeasured by anything here.

### The regression protocol, which now exists

Any engine change: run `v6diff.js` with nothing above L2 and it must stay at **2,000/2,000**,
and the vector suite must stay at **51/51**. That harness is what caught a 58%-divergent port
and it is what will catch a bad port of these patches.

**Re-run `ladder-spec.js` after any slate change.** It is built on the ranking in
`cardstrength.json`, and fixing the inert signatures will move it.

---

# Appendix: the open items, worked — 25 August, later

Four of the open items were closed by measurement rather than judgement. Two of them turned up
bugs in the **shipped v6 engine**, not in the level-3 patches.

## A1. `skyMove` cannot turn a two-faced card — a v6 bug, now fixed

```js
// shipped:
const revs = g.C[id].ab === "mercury" ? [false, true] : [false];
// fixed:
const revs = (g.C[id].ab === "mercury" || g.C[id].twoFaced) ? [false, true] : [false];
```

`youMove` and `bestYouReply` both check `twoFaced`. `skyMove` never did, so it only ever
considered reversing Mercury.

**Consequence today, before any level-3 work: the Throne has never been able to turn in the
sky's hand.** Her only two-faced card has been playing at half its move set since it shipped.

## A2. §8.3 resolved — the grants were asymmetric, and now are not

With ties neutralised so seat bias is out of the picture, giving a grant to one seat at a time:

| grant | only seat A | only seat B (before) | only seat B (after A1) |
|---|---|---|---|
| the turn | +8.2 | **+0.0 dead** | **+7.7** |
| the guard | +1.0 | −0.9 | −0.9 |
| the strike | −0.2 | −0.4 | −0.4 |
| the return | +1.7 | +1.0 | +1.0 |

The turn is symmetric now, and both seats at level 3 measures 52.7% — even, as it should be.

**But the other three are worth roughly a third as much in PvP as in single player.** The
reason is structural: slot 0 of the board *is* tonight's mansion, and single player guarantees
tonight's mansion into your five, so you always hold a card whose home is on the board. A
random PvP hand has no such guarantee, and the three home-gated grants rarely fire.

Giving both PvP hands the same guarantee recovers part of it (guard +1.0 → +1.8, return
+1.7 → +2.5) but not all. **The strike measures 0.0 in PvP under both conditions and joins
Byakko's guard as a grant that needs redesign, not retuning.**

## A3. Hand ordering — solved, and it was worse than reported

The agents used a strict `>`, so among equally-scored moves whichever came **first in hand
order** won. On one representative board, **eighteen moves tied for best** and the engine chose
between them purely by hand position.

Fixed by breaking ties on a stable hash of the move itself (card, slot, face, night) rather
than its position in the hand. `research/manzil-engine-v7-tiebreak.js`.

| | careful spread | casual spread |
|---|---|---|
| shipped | 37.5-55.4 (**17.9**) | 14.3-39.3 (**25.0**) |
| hashed tiebreak | 46.4-46.4 (**0.0**) | 21.4-21.4 (**0.0**) |

**The variance is gone entirely.** Three of the 51 vectors failed and all three were the
agent-level ones; each was verified to be a genuine tie, so they encoded hand order rather
than correctness. Re-baselined, back to **51/51**.

## A4. And the consequence nobody will like

Removing the noise moves the signal. Every number in this document was measured on the old
tiebreak:

| pack | | L1/L2 only | + the L3 grants |
|---|---|---|---|
| 6 | old | 52.2 / 28.8 | 59.4 / 36.9 |
| 6 | **fixed** | **63.3 / 30.7** | **79.1 / 34.3** |
| 12 | old | 33.7 / 21.9 | 57.3 / 37.0 |
| 12 | **fixed** | **42.6 / 19.6** | **65.8 / 39.3** |
| 28 | old | 21.8 / 12.1 | 49.9 / 28.6 |
| 28 | **fixed** | **25.4 / 10.6** | **48.9 / 30.2** |

The old tiebreak was systematically choosing worse moves for the player. With it fixed the
player is 4 to 11 points stronger everywhere, which pushes the level-3 system over band at
small packs.

**So the sequencing matters and it is not optional: land the tiebreak fix first, then
re-calibrate.** Tuning the starter pack, the ladder or the grants against the old tiebreak is
tuning against ±18 points of noise. Concretely, after it lands:

1. **Re-run `ladder-spec.js`.** All 504 hands were measured on the old tiebreak.
2. **Re-check the starter pack.** Six was chosen at 57.5 careful; on the fixed tiebreak a pack
   of six measures 63.3 without any level-3 grant at all, so six may now be too generous.
3. **Re-tune the level-3 grants.** A pack of twelve lands at 65.8, marginally over band. A pack
   of six lands at 79.1, which is the small-pack levelling line from `manzil-l34-options.md`
   §6.1 showing up larger — acquisition needs to be cheaper than levelling, or that is the
   dominant strategy.

## A5. What is still genuinely open

Everything below needs a decision, not a measurement:

- **Byakko's guard** and **Suzaku's strike** both need redesign. Neither survives PvP and
  neither is worth more than a point in single player.
- **The four inert signatures** — Veil, Ghost, Mane, Heart.
- **The Chamber's side of the table.**
- **The Throne's replacement**, now that A1 means it can finally turn in her hand too.
- **The run structure.**

---

# Appendix B: the open items, resolved — 25 August, final

Every number below is on the **fixed tiebreak** and supersedes the body of this document
wherever they disagree. The engine is `research/manzil-engine-v7-tiebreak.js`, **51/51 vectors**.

## B1. The starter pack is seven

Re-measured after the tiebreak fix, 896 boards a cell:

| pack | careful | casual | gap |
|---|---|---|---|
| 5 | 75.0 | 33.9 | 41.1 |
| 6 | 68.9 | 31.4 | 37.5 |
| **7** | **63.5** | 28.6 | 34.9 |
| 8 | 58.0 | 27.2 | 30.8 |
| 9 | 53.6 | 27.3 | 26.3 |

**Six is no longer the answer.** It measured 57.5 on the old tiebreak and 68.9 on the fixed
one. Seven is the smallest pack that clears the band, and the close-board rate rises to 30.9%
from 25.0% at five, so boards get tighter as well as more varied.

## B2. Only 8 of 28 signatures work

The full slate, one card at a time, 784 boards each, on the fixed tiebreak
(`research/sig28-all.json`).

**The eight that work:** the listener **+17.7**, the thread **+12.2**, the turning **+9.6**,
the blaze **+8.0**, the root **+6.0**, the throne **+5.9**, the gate **+5.4**, the gathered
stars **+4.2**.

**Two hurt their holder:** the return **−4.5**, the empty district **−7.3**.

**Eighteen are inert** — all inside ±3.5 of zero: ghost, mane, follower, crown, flock, hand,
jewel, heart, guide, storm, glance, drum, hideaway, claws, chamber, veil, bearer, void.

**Two-thirds of the card set's signatures do nothing measurable.** This is the single largest
open item in the game and it is Design's.

## B3. The cheap explanation is wrong, and that matters

The obvious hypothesis was that the dead ones are too narrow to fire. **Tested and refuted:**

| | signatures that work |
|---|---|
| unconditional (fire whenever the card is in play) | **5 of 14** |
| conditional (home, first, young, adjacency, once a board) | **3 of 14** |

Roughly the same rate, and nine *unconditional* signatures are dead — the Jewel, Claws, Void
and Empty District all fire every time and still measure nothing or worse.

**So widening the trigger conditions will not fix this.** There is no one change that repairs
eighteen cards. The realistic route is to rebuild the dead ones out of the shapes already
proven in the engine: taking the lead (the Gate), keeping the ground (the Blaze), turning a
neighbour (the Turning), striking what lands beside it (the Listener), and counting
differently (the Thread).

## B4. The four grants, final form

| symbol | grant | how it is bounded | worth |
|---|---|---|---|
| **Seiryuu** dragon | **the turn** — lodge it either way round | unbounded | **+7.5** |
| **Byakko** tiger | **the guard** — cannot be flipped by a tie | on or beside its home slot | **+3.2** |
| **Suzaku** bird | **the lead** — it seizes the opening move | unbounded, like the Gate | **+3.1** |
| **Genbu** tortoise | **the return** — returns to hand instead of flipping | on home, once a board | **+4.7** |

**Suzaku's cascade is retired.** Every setting with real power collapsed the skill gap from 22
to 7.6, because a cascade rewards whoever swings and a greedy player swings constantly. The
lead replaces it, modelled on the Gate, which is one of the eight signatures that work.

**Byakko's guard was never inert** — the +1.0 reading was the old tiebreak's noise. On the
fixed engine it is +3.2 home-gated and +8.7 once-a-board. Home-gated is the shipped setting
because it lands the whole system in band at the packs most players will actually hold:

| pack | nothing at L3 | all four at L3 |
|---|---|---|
| 7 | 51.7 / 26.3 | 65.6 / 30.6 |
| **12** | 42.6 / 19.6 | **63.6 / 39.4** |
| 20 | 34.2 / 18.9 | 49.4 / 32.7 |
| 28 | 25.4 / 10.6 | 44.0 / 26.7 |

**A pack of twelve lands careful at 63.6 and casual at 39.4 — both in band.** The once-a-board
guard is stronger late (56.9 at a pack of twenty) and is the setting to revisit if the endgame
proves too thin.

One caution: **the lead narrows the skill gap** (23.0 to 15.5 on its own), because it helps
casual play more than careful. It is the weakest of the four on that measure and worth watching
if the gap ever becomes a problem.

## B5. The Chamber

**Player-only.** Excluded from walker and sky hands — one line in `ladder-spec.js`.

For the record: its cost to its holder is **−0.9 on the fixed tiebreak with a pack of seven**,
inside noise, not the −4.3 measured under the old conditions. The *mechanism* is still
confirmed (a greedy opponent's regret falls from 8.31 to 7.16, and their perfect-move rate
rises from 57.9% to 62.4%), but the win-rate consequence is currently too small to matter. It
is being kept out of her hands as cheap insurance, not because it is doing damage today.

## B6. Still open, and all of it needs a person

- **The eighteen inert signatures** (B2, B3). The largest item in the game.
- **The two that hurt their holder** — the Return and the Empty District.
- **The Throne's replacement**, now that A1 lets it turn in her hand for the first time.
- **The run structure.**
