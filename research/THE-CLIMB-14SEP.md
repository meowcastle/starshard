# The climb: Code's real ladder, whole climbs, and the ladder gets harder the more you own

**14 September 2026. For Design and Code.** The handicap sweep, run as whole climbs in the
reference under Code's ladder as delivered on 13 Sep: the mirror opponent with `HANDICAP_BANDS`
knocking the weakest awake cards to level one, `CAUTION_BANDS` per rung by awake count, the live
format (four singles, four best-of-threes, the mansion best of five, three lanterns, a lost rung
retried), loser leads, draw to defender, tonight's law on tonight's window, the storm's own rules.
200 climbs a night fresh, 60 a month in, 40 full; 28 nights each. `research/climb.js`.

**One caveat before the numbers.** The mansion match is played against the mirror here. The
reference has never modelled the planet hand, so rung nine is a stand-in and the mansion's share
of wipes should be read as a floor.

---

## 1. The answer to the question: Code's handicap works at fresh

| collection | awake | handicap | cautions by rung | player | **clear** | p(board) | boards a climb |
|---|---|---|---|---|---|---|---|
| **fresh** | 6 | 0.75 | 0 0 0 1 1 2 2 2 2 | careful (8) | **30.2%** (3–55) | 65.2% | 13.2 |
| fresh | 6 | 0.75 | same | greedy (0) | **6.6%** (1–16) | 54.3% | 9.1 |
| **a month in** | 14 | 0.50 | 0 0 1 1 2 2 4 4 4 | careful | **24.9%** (0–37) | 63.5% | 13.0 |
| **full** | 28 | 0 | 0 1 2 2 4 4 6 8 8 | careful | **6.9%** (0–23) | 56.3% | 10.4 |

Design's stand-in ladder cleared nothing because its handicap knocked already-level-one cards to
level one. **Code's knocks the awake ones**: at fresh the mirror keeps one awake card of the
player's six, and a careful player wins 65% of boards and clears three climbs in ten. That is
exactly where yesterday's format table put a third of climbs (p 0.663). The handicap is real and
it is doing what a handicap should.

**A greedy player at fresh clears one in fifteen.** Between careful and greedy is a factor of
four and a half on the clear rate, on the same ladder. Skill is the lever, as Design read it, and
the ladder as built rewards it exactly.

## 2. The finding: the ladder gets harder as the collection grows

Fresh 30%, a month in 25%, full **7%**. A player with everything at level three, playing
carefully, clears one climb in fourteen; the same player with five awake cards clears one in
three. **The difficulty inverts with progression.**

The reason is arithmetic. The handicap fades from 0.75 to 0 and the caution rises from 0 to 8 as
the collection grows; both are meant to make the mirror harder as the player gets stronger. But
the player's own strength never rises, because the opponent is a mirror: at full collection she
has every card the player has, at the same level, and plays at the player's own caution. **A full
mirror is a coin flip plus the seat**, and the seat belongs to whoever leads: p by rung at full is
80 · 51 · 64 · 51 · 57 · 51 · 55 · 47 · 48, and the four rungs at or under 51 are the ones she
leads. Nothing a player collects can move that number, because she collects it too.

That is Design's runner's "full collection, margin −2 to −3.6" seen from inside the format: it is
not the caution dial working as designed, it is the mirror working exactly as designed and the
design having no lever left. **The bands assume the player outgrows the opponent. Against a
mirror, nobody outgrows anybody.**

## 3. The seat is where fresh climbs die

At fresh, careful, p by rung is **74 · 59 · 74 · 58** across the four singles: the player leads
rungs one and three and wins three in four; she leads two and four and the player wins under six
in ten. The best-of-threes sit at 62–66 because loser-leads shares the seat out. So on the four
rungs where one lost board is one lost lantern, two of them are played from the wrong seat, and
those two are where the fresh climb goes: 20–49% of all wipes fall in the singles, night by night.

The format table said two thirds of wipes at a coin flip are in the singles; the ladder says which
singles. **The she-leads singles are the ladder's difficulty at fresh**, more than any law, more
than any night.

## 4. The nights, at fresh, careful

| easiest | clear | p | | hardest | clear | p |
|---|---|---|---|---|---|---|
| m21 the district | **55%** | 72.1 | | m6 the storm | **3%** | 52.8 |
| m11 the mane | 43% | 68.0 | | m20 the flock | 15% | 59.2 |
| m15 the veil | 42% | 69.6 | | m16 the claws | 16% | 60.4 |
| m2 the bearer | 39% | 66.6 | | m4 the follower | 18% | 60.8 |
| m7 the return, m8 the ghost | 39% | 67–69 | | m28 the thread | 21% | 60.4 |

The spread across nights is 15 to 55 with the storm aside, which is a real geography once the
player is strong enough to see it, and it does not follow the single-board spread column: the
district (the pilot house, the hush, the bird flag) is the easiest climb on the ring by twelve
points, and the flock, which just took the slide to a 22.4 board, is the hardest. **A night's
climb difficulty is its she-leads single-board win rate, not its quadrant spread.** The
district's p by rung is flat at 70–76 on every seat; the flock's drops to 46 when she leads.

**The storm is unclearable.** 3% fresh, 0% a month in, 0% full: two lanterns, no handicap,
caution plus two, every rung a best-of-three. Whatever the hardest road was meant to be, at
present it is the road nobody finishes, at any depth, playing carefully.

## 5. What this asks for

Three design decisions, none of them mine, each with the measurement that would settle it:

1. **A target clear rate per depth, in writing.** The table in section 1 is the current state.
   If the intent is "fresh a third, deep half", the full-collection bands are the thing to
   change; if the intent is a game that stays hard, the fresh handicap is too kind. Either is a
   coherent game. The present curve, easy then hard, is the one nobody would choose.
2. **The full-collection lever.** Against a mirror there is none in the bands. Options that the
   reference can measure tomorrow: hold a residual handicap at full (0.25 keeps one awake card in
   four knocked down); cap her caution below the player's (full collection at 8 against 8 measured p 56;
   the table says 0.71 is needed for half, so the cap would have to be deep); or make the deep opponent something other
   than a mirror (the planet hand at every rung, once Code's planet table lands). Say which family
   and I will run the sweep.
3. **The seat in the singles.** This is the komi question wearing the format's clothes. The eye
   and the scales are on the shelf as instruments, but the cheapest fix is not a law: let the
   player lead every single board, or lead the first board of every rung, and the she-leads
   singles stop being the wall. One line in `_simClimb`'s leader rule, and I can measure it in an
   hour against the runs above.

And one for Code with no decision attached: the storm's rules produce a road with a clear rate
indistinguishable from zero. That is a number to put beside the "hardest road" brief.

### Files

`research/climb.js` (the runner; `node climb.js <climbs> <fresh|month|full> <player caution> [nights]`),
`climb_fresh_8.out` + `climb_fresh_8b.out` (careful, fresh), `climb_fresh_0.out` (greedy),
`climb_month_8a/b.out`, `climb_full_8a/b/c/d.out`. Every row carries clear, boards, p, rung
reached, lanterns, where the wipes fell, and p by rung.
