# Why the Storm at slot 3 wins every night

*26 October 2026. The first packet from "what can the sim do for the loop": the Forge-style
loss-reason layer wired to the conformant v6 engine and pointed at the August exploit.
Engine: `research/manzil_v6.py`, 33/33 on Code's vectors, re-run today before any number
below was taken. Scripts: `whyloss.py`, `minimax.py` (both in `research/manzil-loop/`).*

Configuration throughout: the Empty District friend-build table (`ownAll:false`, chart five
`[5,6,10,17,18]` at L2, every other mansion loaned and silent), no deal, you lead, her table
reading at depth 8, your agent at depth 8, all 28 nights.

---

## 0. The answer in three lines

1. **Against her agent**, the Storm at 3 is not a forced win. On every night, 11 to 19 of her
   48 possible first replies go on to win. She picks none of them. The opening book is a book
   of lines *her reader* loses.
2. **Under perfect play by both sides**, the Storm at 3 *is* a forced win for you, on every
   night solved (28/28, full game tree, roughly 230,000 nodes a night).
3. **So is the empty board.** Whoever leads wins under perfect play, 7 nights of 7 tested for
   each leader. The road has nine slots; the leader places five cards to the follower's four
   and has the last word. The Storm at 3 is one of six openings that happen to be easy to
   execute against a greedy reader. The structural fact underneath it is the odd road.

---

## 1. The forced-opening scan, reproduced

54 openings (five cards, nine slots, the Throne two-faced), all 28 nights, reference agents.

| opening | nights won |
|---|---|
| Heart @1, Crown @2, Crown @7, Storm @3, Storm @5, Storm @6 | **28/28** |
| Crown @4, @5, @6; Blaze @7 | 27/28 |
| Crown @3; Throne @6 (either face); Throne @2 reversed | 26/28 |

Six at 28/28, as the August district check found.

## 2. The lock point

For each of her four decision points on a board, every legal alternative was played out by
the reference agents. The lock point is the earliest decision at which all her alternatives
still lose.

| her move | alternatives that win, range over 28 nights |
|---|---|
| 1st (48 options) | **11 to 19** |
| 2nd (24 to 30 options) | 1 to 6 |
| 3rd (12 to 16 options) | 0 to 2 |
| 4th (4 to 6 options) | 0 |

Lock point: her 3rd move on 22 nights, her 4th on 6. Never her 1st. The opening alone decides
nothing against her; her first two replies do.

## 3. The modal line

Identical on 20 of 28 nights. Margin is you minus sky after each placement.

```
you   Storm   @3                 +1
sky   Saturn  @4  flips Storm    -2
you   Throne  @2  flips Storm    +1
sky   Venus   @1  softens, flips Throne   -2
you   Crown   @0  flips Venus    +2
sky   Mars    @8                 +1
you   Blaze   @5                 +2
sky   Mercury @7                  0
you   Heart   @6  flips Mercury, who was standing on his own mansion   +5
```

Final road, night 1: Crown · Venus · **Throne** · Storm · **Saturn** · Blaze · Heart · Mercury · **Mars**
(bold is hers). Count 8 to 3: you hold six cards, plus the Crown at the road's edge, plus the
dominion Mercury had earned on his home mansion and lost when the Heart took him.

The whole fight is on the left third of the road where you hold one more card than she does
and place last. Her fourth card lands with nothing to answer it; your fifth swings the count
from level to +5. **The margin is card count.** No cascade decided the board. Tempo did, and
her last card was placed where your last card could take it.

## 4. What her evaluation sees

Her reader scores a move as `(her margin now) × 10 − (your best immediate reply) × depth`.
Night 1, her first move:

| reply | margin now | your best answer | her score | result |
|---|---|---|---|---|
| Saturn @4 (chosen) | +2 | +1 | +12 | loses |
| Mercury @4 | +2 | +1 | +12 | loses |
| Jupiter @4 | +3 | +4 | −2 | **wins** |
| Jupiter @0 | +1 | +4 | −22 | **wins** |
| Venus @6 | 0 | +3 | −24 | **wins** |
| Mercury @0 | 0 | +3 | −24 | **wins** |
| Venus @7 | 0 | +4 | −32 | **wins** |

Every winning reply concedes the Storm and develops the far side of the road. Every one of
them scores badly because conceding looks like losing two points now. Her reader cannot see
that a left-side fight is one she loses with four cards against five.

## 5. Checks that this is not an artefact of one setting

| variation | you win |
|---|---|
| her depth 0 / 4 / 8 / 12 / 16 / 24 | 26 / 27 / 28 / 27 / 27 / 27 of 28 |
| her hand order, all 24 permutations | min 27, max 28, mean 27.5 |
| the other five all-28 openings | a winning sky first reply exists on 28/28 nights for every one of them |

Depth does not rescue her and order does not either. Her evaluation is wrong in shape, not in
distance.

## 6. Perfect play

`minimax.py` solves the full game tree (win/loss, both sides optimal, transposition table,
reference move tried first). Hand and Guide remain unmodelled as in the engine.

| position | result |
|---|---|
| Storm @3, then perfect play | **you win, 28/28 nights** |
| empty board, you lead, nights 1 5 10 15 20 25 28 | **you win, 7/7** |
| empty board, sky leads, same nights | **sky wins, 7/7** |

The leader has a forced win on every night tested. That is the finding under the finding: a
nine-slot road with five-card hands gives the leader five placements to four and the last
word, and with perfect play that is decisive regardless of which cards are in the hands.

The live build alternates the lead across the five boards of a night (`nextLeader` in
`_freshRound`) and sets the road to `min(9, 2n + (leader is you ? 1 : 0))`, so the leader
always places last. Round one's leader is you. Under perfect play on both sides a night is
therefore 3 to 2 to the player, every night, before a card is turned.

## 7. What this changes

**The pack-of-twelve deal stays.** It kills the memorised book and adds nightly variety,
and it is one data change. Nothing here argues against it.

**Her agent is the cheaper, deeper fix, and it was invisible until today.** She needs two
things her reader lacks: a sense of tempo (who places last in a contested region) and a
willingness to concede a bait card. That is a reader change, not a rules change, it needs no
new vectors, and it lifts every table on the ladder at once. It should enter Phase A as a
packet with the forced-opening scan as its gate. It also explains the August result that her
depth dial is flat for careful players: deeper search on a wrong evaluation finds nothing.

**The odd road is a design question, not a bug to fix today.** Leader-wins-under-perfect-play
is normal for small perfect-information games and the live sky is nowhere near perfect. But
it does mean the night's structure is carried entirely by her imperfection, and that a strong
human against a strong sky would see 3 to 2 forever. The TCG rebuild's moving road removes
the fixed nine and the last word with it, which is one more argument for it. For v1, the
honest options are: leave it (the sky is weak and the deal adds variance), alternate who leads
board one by night parity, or let the follower place last on an even road. Each is a sim run
against the bands before it is a decision.

## 8. Files

- `research/manzil-loop/whyloss.py`: forced-opening scan, lock point, margin trace, attribution.
- `research/manzil-loop/minimax.py`: full-tree solver; `solve_opening`, `solve_empty`.
- `research/manzil-loop/why_storm3.json`: per-night results for Storm @3.
- Logs: `mm_storm3.log`, `mm_empty_*.log`.

Run `python3 v6vectors.py` first. If it does not say 33/33, nothing above counts.
