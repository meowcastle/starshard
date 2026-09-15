# The level-2 choice, second pass

**26 August 2026.** Seven changes made, vectors re-verified **28/28**, re-measured on the same
harness. 896 boards a cell, two seeds.

| | pass one | pass two |
|---|---|---|
| signature wins | 5 | **6** |
| a real choice | 7 | **9** |
| numbers win | 16 | **13** |

**Fifteen of twenty-eight now have a live choice, up from twelve.** Moving the right way, still not
half and half.

---

## What each change did

| card | change | before | after |
|---|---|---|---|
| **the claws** | pushes every enemy card that lands beside it, not one on arrival | −10.0 | **+6.3** |
| **the flock** | *(no change — see below)* | −3.1 | **+11.9** |
| the return | comes back only if it took nothing on the way in | +15.0 | +10.8 |
| the void | taxes the station to its right, not both | +12.5 | +9.5 |
| the ghost | warms your card, warmth leaves with the card | −11.4 | −6.9 |
| the mane | lifts only cards you hold | −8.4 | −4.7 |
| **the hideaway** | shelters only your side | −3.5 | **−4.6** |
| **the heart** | a tap every turn instead of once a board | −9.2 | **−11.3** |

**The claws fix is the model.** Turning a one-shot placement effect into a standing threat moved it
sixteen points. That is the single clearest confirmation of the pattern: persistent beats punctual.

**The flock jumped without being touched, and that is a bug I fixed by accident.** The claws change
required `resolve` to find where a card actually ended up after landing, because the claws now
displace it. The flock also displaces itself, by swapping with a neighbour, and **it had been
striking from the wrong station all along** — the engine attacked from the slot the flock left rather
than the one it arrived at. Fixing the lookup fixed the flock. Worth knowing that any future card
which moves itself on landing needs that same check.

**Two changes backfired and I would revert both.**

The hideaway got *worse* when restricted to your own side, because it now only pays when both
neighbours are yours, which is rarer than it sounds. The shared version was closer.

The heart got worse with a free tap every turn. That is more likely the agent thrashing than the
card being bad, since an always-available move with no cost invites the search to keep repositioning.
Either the tap needs a cost, or once a board was right.

## The thing I have been refusing to use, and should

Four of the thirteen cards where numbers win have a face of **8 or 9**:

| card | faces | choice |
|---|---|---|
| the heart | 8/7 | −11.3 |
| the follower | 8/7 | −7.5 |
| the jewel | 8/7 | −4.7 |
| the throne | 7/9 | −4.6 |

**+1 on an 8/7 makes a 9/8, which is close to unbeatable.** No signature I can write will beat that,
because the signature is competing against near-immunity. These are not badly designed cards. They
are cards whose *numbers* make the choice impossible.

I said at the top of the first draft that faces were balanced and tested and I would not touch them.
**That was the wrong constraint.** The faces are the correct dial for this problem, and they are the
only one that will move these four.

**Bring the heart, the follower and the jewel down to 7/6 and the throne to 7/7**, then re-measure.
That is a smaller change than rewriting four signatures and it targets the actual cause.

## Where it stands

**Signature wins (6):** the flock, the return, the void, the gate, the claws, the listener.
**A real choice (9):** the glance, the blaze, the drum, the thread, the gathered stars, the bearer,
the crown, the turning, the root.
**Numbers win (13):** the rest.

The nine in the middle are the healthiest part of the set. Every one of them sits inside three points
of even, which means a player weighing that card is doing real work rather than reading an obvious
answer.

## Next, in order

1. **Lower the four high faces.** Heart, follower and jewel to 7/6; throne to 7/7. Re-measure. This
   should move four cards at once.
2. **Revert the hideaway and the heart's tap.** Both changes made things worse.
3. **Look at the remaining nine losers as signature problems**, not face problems: the storm, the
   chamber, the veil, the hand, the guide, the empty district, the hideaway, the mane, the ghost.
4. **Then measure the level-3 grants**, which have not been touched at all yet.

### Files

`research/v2.js`, `research/v2vec.js` (28 vectors, updated to the new spec),
`research/v2meas.js`, `research/v2meas.json`.
