# The Empty District build, measured

*22 August 2026, against `manzil/index.html` at a7209e5. Run on the reference engine
`manzil-engine-v6.js` with the build's own card table: chart five `[5,6,10,17,18]` awake at
L2, every other mansion a loaner at L1 with no signature, walkers as loaner mansions on her
side. Driver: `research/district.js`, `district2.js`.*

## 1. What the ownAll flip did

Flipping `ownAll` to false is the right fix for the routing bug, and it has a second effect
worth naming: **a visitor owns five mansions, so the pack is five, so `deal` never fires.**
It returns the pack unchanged at five or fewer. The friend-build is therefore the fully
deterministic configuration — no randomness anywhere in it.

That is fine for the road. It is not fine at the top.

## 2. The climb, rung by rung

Careful / casual, the eight coded walker hands at their coded reply weights, then the sky.

| rung | she reads | the Empty District's own night | across all 28 nights |
|---|---|---|---|
| 1 | 3 | 100.0 / 100.0 | 100.0 / 60.7 |
| 2 | 4 | 100.0 / 100.0 | 100.0 / 85.7 |
| 3 | 5 | 50.0 / 50.0 | 89.3 / 55.4 |
| 4 | 6 | 100.0 / 50.0 | 98.2 / 85.7 |
| 5 | 7 | 100.0 / 100.0 | 96.4 / 73.2 |
| 6 | 8 | 100.0 / 100.0 | 83.9 / 78.6 |
| 7 | 9 | 100.0 / 50.0 | 94.6 / 71.4 |
| 8 | 11 | 100.0 / 100.0 | 89.3 / 69.6 |
| **9, the sky** | 14 | **100.0 / 50.0** | **66.1 / 42.9** |
| *the sky at her table* | *8* | | *62.5 / 37.5* |

**For a first-time player the arc is real.** Casual play runs 60-86% on the road and drops to
43% at the sky. That is a ladder that teaches and then bites, which is what the build is for.

**For anyone playing carefully it is a walkover.** 84-100% on every rung, and **100% at every
single rung including the sky on the Empty District's own night.** If the build lands a
visitor on mansion 21's night, the entire climb is unlosable for a player who thinks about
their moves. The eight rungs read as filler and the boss is not a boss.

## 3. The climax is solved, and by more than one line

Forced-opening scan, player leading, all 28 nights:

| | best opening | perfect nights | openings winning **every** night |
|---|---|---|---|
| her table, reads 8 | the storm at slot 3 | **28 of 28** | **6** |
| the road boss, reads 14 | the blaze at slot 7 | **28 of 28** | **7** |

Six openings win every board on every night at her table; seven do against the road boss.
With a five-card pack there is no deal and nothing else in the build is random, so these are
not tendencies, they are the whole game.

**How much this matters depends on what the build is for.** As a demo you hand a friend for
twenty minutes, the risk is low: nobody finds a six-line opening book by accident. As
something shared around, the climax is a lookup, and the first person who posts "open the
Blaze at slot 7" ends it for everyone who reads that.

**And there is no tuning fix.** With a pack of exactly five you hold all five every board, so
no deal can fire and no shuffle exists to break the determinism. The options are structural:
grant a starting pack larger than five so the deal has something to do, or accept that
pre-claim nights are deterministic and let the road carry the experience.

## 4. Retraction: Code's two "non-reproducing" rows do reproduce

My conformance reply said two rows of Code's table did not reproduce on their own engine.
**That was wrong and the cause is mine.** Both reproduce; the variable is **hand order**.

The engine's agents are deterministic and break ties with a strict `>`, taking the first best
in iteration order over the hand. So the order of the card list is a live input:

| pack of five, same five cards | careful | casual |
|---|---|---|
| `[6,10,17,18,5]` — how I ran it, first five of their twelve | 73.2 | 26.8 |
| `[5,6,10,17,18]` — the build's chart-five order | **62.5** | **37.5** |
| `[18,17,10,6,5]` — reversed | 64.3 | 21.4 |

Their 62.5 / 37.5 is exact on the build's own ordering. Eleven points of careful play sat in
the order of a list.

Their depth row resolves the same way. Run on the **sorted** twelve rather than the
as-listed one:

| her depth | 8 | 12 | 14 | 24 |
|---|---|---|---|---|
| they report | 68.3 | 67.0 | 67.0 | 66.5 |
| sorted twelve | 71.0 | 67.4 | 67.2 | **66.5** |
| as-listed twelve | 71.2 | 71.2 | 71.2 | 71.0 |

Three of four land on or beside their figures and the tail is exact, against an as-listed
column that is flat. Their depth row was run on a different ordering from the row above it.

**So the conformance contract has a hole neither of us recorded.** The config block specifies
the pack as a *set* and the engine consumes it as a *sequence*. Worth adding to the brief:
either pin the ordering as part of the config, or break ties randomly across seeds so order
stops mattering. The second is better — order-sensitivity of eleven points is a property of
the harness, not of the game, and it will keep producing arguments like this one.

## 5. What I would do

1. **Decide what the friend-build is for.** A twenty-minute demo can live with a solved
   climax. A link that circulates cannot.
2. **If it circulates, grant a starting pack above five** so the deal fires. Nothing else
   removes the book, because nothing else in the build is random.
3. **Check what night a visitor lands on.** On mansion 21's own night the climb is 100% at
   every rung for careful play. If the build forces its own mansion, the ladder has no
   tension for anyone who thinks.
4. **The road is well-shaped for the player it is for.** Casual 60-86% falling to 43% at the
   sky is a real arc. Leave it alone.
5. **Pin hand order in the sim brief**, or randomise the tiebreak.
