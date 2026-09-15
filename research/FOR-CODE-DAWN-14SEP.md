# For Code: dawn (duel) and the walker leader rule, as measured, with the fixtures

**14 September 2026. Measurement → Code (cc Design).** The user has pushed the day's decisions.
This is the port note for the two that touch the engine, written so the fold is the reference's
exact shape and the fixtures fail loudly if it drifts. Both are measured in `THE-DAWN-14SEP.md`
and `THE-CLIMB-14SEP.md`.

---

## 1. Dawn, form "duel"

**The sentence.** *When the road fills, the cards each side still holds are shown. Strongest
against strongest, they fight in the sky: each pairing is worth one station to the higher card.
A card with no opponent scores nothing. A tie scores nobody.*

**The arithmetic, exactly as the reference does it** (`v2.js` `dawnPoints`, dial `dawn:"duel"`):

1. Held cards = each side's hand minus any card standing on the road. On a full nine-station
   road that is two for the leader and three for the follower, always.
2. Each held card's strength is its **printed total**, `l + r` from the card table. Printed, not
   the slot's faces: nothing that happened on the road touches a card that never lodged.
3. Sort each side's held totals descending. Pair index 0 with index 0, 1 with 1, for
   `min(yourCount, herCount)` pairings. The follower's third card is never paired.
4. Higher total takes one point for its holder. Equal totals: nobody. No tiebreak.
5. The points are added to the road's count **inside the same count the level rule reads**, so a
   level board after dawn goes to the defender as today. Dawn never creates a level board that the
   level rule does not already handle.

**Where it lives.** In the reference it is inside `finalCounts`, which is the score the search
reads at every full-board position, so both sides weigh holding a card back against lodging it.
The port has to do the same: **the dawn points must be visible to `_replyW`'s full-board
evaluation, not applied after the search has chosen.** If the client's count-at-end and the
search's count-at-end are different code paths, this is the one clause that has to be in both.
The measured seat figures assume the mirror sees dawn; a mirror that cannot see it will hold
nothing back and the numbers will not reproduce.

**What it is not.** Not "pair" (spare card scores), not "count" (every held card scores), not
"top" (one duel). All four are in the reference with their measured rows; duel is the one
decided. Ties do not go to the defender: that form measured −43 on the seat.

**Fixtures.** Three new cases in `research/conformance.json` (27 now), law `dawn`, with a
`hands` field the adapter should pass as the two hands: the base case (6 v 4 from a 5 v 4 road
with three held against four), the leader winning both pairings (7 v 4), and the guard that
dawn is read only on a full road (1 v 1 on a two-card road). `conform-code.js` needs one line to
pass `t.hands` into `mkGame`; the cases use `counts` on a full board, so route them through
whatever the client calls at the end of a board.

**The numbers a correct port reproduces** (the reference, fresh ladder, careful player, 100
climbs a night, all 28 nights): p by rung **71 · 63 · 71 · 63 · 64 · 64 · 63 · 63 · 65**, clear
29.5%, against a baseline of 74 · 59 · 74 · 58 and 30.2%. On the mirror board (equal decks, both
careful, m9, 896 boards) the seat goes from +2.2 to −7.6. If the proving ground reads within a
few points of those on the same settings, the port is right.

## 2. The walker leader rule

**The rule.** On walker rungs one to eight, the player leads the first board of every rung. Loser
leads within a series as before. The mansion is unchanged (the sky leads the first board).

**Why.** The she-leads singles are where fresh climbs die (58–59% against 74% when the player
leads, and each is one lantern). This rule takes the fresh singles to 76 · 74 · 75 · 70 and the
clear rate from 30.2% to **40.9%** with no law and no change to even play, since it never applies
to a duel between players. With dawn/duel on top the singles read 74 · 73 · 73 · 68.

**Where.** `_simClimb`'s leader line for the runner, and whatever the live road uses to seat the
first board of a rung. In the reference it is one condition in `climb.js` (`LEAD=you`).

**Not decided, so not in this note:** whether the format's alternation should survive anywhere on
the walker rungs. Measured only as "player leads every rung".

## 3. Two things this changes that are worth knowing before the fold

- **The level rule now carries two komis.** A level board to the defender is already a small
  compensation to the follower (about a point on one board in ten). Dawn adds another. Between
  equal players they sum to the −7.6 above. If Design later wants the level rule re-read, the
  reference has a `drawTo` dial and it is a one-line change to measure.
- **Dawn widens the skill gap.** On m9, careful against careless went from 9.3 to 13.5. That is
  the intended direction, and it means the sky's caution bands will bite a little harder at
  every rung than the 13 Sep sweep showed. Nothing to port; something to expect.

### Files

`research/v2.js` (`dawn`, `dawnTie`, `dawnPoints`, `finalCounts`), `research/conform.js` +
`research/conformance.json` (27 cases), `research/climb.js`, `research/THE-DAWN-14SEP.md`.
