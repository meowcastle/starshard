# Dawn: the held cards fight in the sky, four forms measured, and the komi that handicap games need is not the komi even games need

**14 September 2026. For Design (cc Code).** The Triple Triad thread, built and measured. When the
road fills, the cards each side still holds are shown; the follower always holds three to the
leader's two. Four forms of what happens next, each read three ways: on the mirror board (equal
decks, both careful, the PvP shape), on the fresh ladder as whole climbs (Code's handicap and
cautions, the single-player shape), and at full collection. 163 vectors green. `research/v2.js`
dial `dawn`, `research/climb.js` takes any dial as a seventh argument.

## The four forms

| form | the sentence |
|---|---|
| **pair** | strongest held card against strongest, down the line; each pairing worth one to the higher card; a card with no opponent scores unopposed; ties to nobody |
| **duel** | the pairings only; a card with no opponent scores nothing |
| **top** | one duel: each side's strongest held card, winner takes one |
| **count** | every held card counts one; no duel (a flat komi of one to the follower) |

The search sees dawn at every full-board count, so both sides weigh holding a card back against
lodging it. That is the layer: the leader's fifth card is now a choice between the last word on
the road and a stronger hand at dawn, and it is a choice the mirror makes too.

## 1. On the mirror board (equal decks): every form flips the seat, and the flip is the size of the seat

m9, 896 boards, both careful, fresh deck:

| | you lead | she leads | seat |
|---|---|---|---|
| plain | 53.2 | 51.0 | +2.2 |
| top | 50.7 | 55.6 | −4.9 |
| duel | 49.8 | 57.4 | −7.6 |
| count | 42.4 | 63.8 | **−21.4** |
| pair | 38.5 | 67.2 | **−28.7** |
| pair, ties to the defender | 29.9 | 73.2 | −43.3 |

Across all 28 windows at 224 boards a cell, **duel shifts the seat by −9.8 on average**: plain
mean +4.9, duel mean −4.9. On equal decks the leader's seat is worth about five points and one
held card is worth about ten, so the pairings flip the sign and leave the size. Pair and count
are far past that. **For duels between players, top or duel is the only size that is honest, and
duel already overshoots on a third of the windows.**

## 2. On the fresh ladder (whole climbs, careful player, 100 a night)

| form | p by rung (singles 1–4, then bo3, mansion) | seat gap in the singles | clear |
|---|---|---|---|
| none (baseline) | 74 · 59 · 74 · 58 · 66 · 62 · 66 · 62 · 62 | **16** | 30.2% |
| top | 74 · 61 · 73 · 60 · 65 · 64 · 63 · 63 · 63 | 13 | 28.9% |
| **duel** | 71 · 63 · 71 · 63 · 64 · 64 · 63 · 63 · 65 | **8** | 29.5% |
| **count** | 66 · 69 · 65 · 68 · 62 · 67 · 62 · 68 · 66 | **−3** (flat) | 30.4% |
| pair | 62 · 74 · 60 · 73 · 59 · 69 · 60 · 70 · 67 | −13 (inverted) | 28.7% |

**Count evens the ladder's seat almost exactly** (66/69), **duel halves the gap** (71/63), pair
inverts it, top barely touches it. The clear rate does not move with any of them, which is right:
dawn moves who wins from which seat, not how many boards the player wins; the lanterns still fall
in the singles, just not so lopsidedly on the she-leads ones.

At full collection (30 climbs a night) the same holds: duel takes the singles from 80/51/64/51 to
77/55/57/56, count flattens them further, and the clear rate stays at 6–7%. Dawn does not touch
the mirror problem, and was never going to.

## 3. The finding under the numbers

**The komi a handicap game needs is bigger than the komi an even game needs, and it is the
opposite of Go.** In Go, handicap games drop komi to half a point because the stones already
compensate. Here, the handicap makes the *player* the stronger deck, and a stronger deck gets
more out of leading: the seat is worth 16 on the fresh ladder and 5 on the mirror. So the form
that fixes the ladder (count, or pair) breaks even play, and the form that is honest in even play
(top, or duel) only half-fixes the ladder. One rule cannot do both jobs at the right size.

That leaves three ways to cut it, and this is Design's call:

- **Ship duel everywhere.** The fun form, the hold-back layer intact, the ladder's singles gap
  halved (16 → 8), and even play tilted about as far toward the follower as it was toward the
  leader. Honest, symmetrical, and the one I would play.
- **Ship duel, and fix the rest of the ladder's seat with the format.** Letting the player lead
  every walker rung (one line in `_simClimb`'s leader rule) takes the fresh singles to
  76 · 74 · 75 · 70 with no law at all, and the clear rate to **40.9%**; with dawn/top on top of
  it, 74 · 73 · 73 · 68 and 37.8%. The format fix is larger than any komi and costs nothing in
  even play because it never applies there. Duel for the layer, the leader rule for the seat.
- **Ship count on walker boards and nothing in duels.** The exact ladder fix, no layer, and two
  rules where the game has had one. I would not.

## 4. What to watch if duel ships

The fresh skill gap. On m9 duel took careful-versus-careless from 9.3 to 13.5 and count to
17.7: dawn rewards the player who thinks about their hand, which is the point, and it widens the
gap between a thoughtful new player and a grabby one. The ladder already punishes grabby play
four and a half to one; dawn adds to that. It is the right direction, and it should be said out
loud on the level that teaches it.

And the level board. The road already gives a level board to the defender, which is a komi of
its own, worth about a point on one board in ten. Dawn stacks on it. If dawn ships, the level
rule should be re-read; the two together may be one too many for even play.

### Files

`research/v2.js` (`dawn` pair | duel | top | count, `dawnTie`), `research/wardvec.js` (163),
`research/climb.js` (`LEAD=you` env for the leader rule; seventh argument for any dial),
`research/dawnsweep.sh` + `*.sw` (the 28-window mirror sweep), `dawn_*_t9.out`,
`dawn_pair_t17.out`, `dawn_pair_t24.out`, `climb_dawn_pair/duel/top/count.out`,
`climb_full_duel_a/b.out`, `climb_full_count_a/b.out`, `climb_leadyou.out`,
`climb_leadyou_top.out`.
