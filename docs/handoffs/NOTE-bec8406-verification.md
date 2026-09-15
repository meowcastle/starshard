# bec8406, verified — two corrections to the commit record

**26 August 2026.** I re-ran the gates against the merged files on disk rather than trusting the
commit message. **The merge is faithful and the work is good.** Two claims in the description are
wrong in ways that will mislead whoever reads the log later, so they are recorded here.

## What checks out

| check | result |
|---|---|
| conformance vectors, on the file at `Star Shard v3 Build Plan/research/manzil-engine-v6.js` | **80/80** |
| server copy `starshard-api/lib/manzil-engine.js` | reference **verbatim** + the 6-line banner |
| the 18 tap vectors, re-run against the merged file | **18/18** |
| `playBoard` hand-bookkeeping vectors | present, **one per seat**, which is the gap that let the bug live |
| merged engine vs the engine the measurements were taken on, 2,000 level-2 boards | **2,000/2,000 identical** |

That last row is the one that matters for planning: **every number in
`HANDOFF-TAP-MEASURED-25AUG.md` transfers to the merged engine unchanged.** Nothing needs
re-measuring to be quoted.

## Correction 1: it is not 2,000/2,000 identical to pre-merge, and the live effect is not none

Measured against the pre-merge reference at level 2: **1,966/2,000.** Thirty-four boards changed.

Those thirty-four are the returning-card fix, and they are **at level 2, which is what production
actually runs.** Confirmed: the PvP lobby builds its cards with `engine.makeCards({ lvl: 2 })`.

So in a ranked match, before this commit, a player's Return card flipped on its own ground went
into the **opponent's** hand. After it, it goes back to its owner's. That is the correct
behaviour and it is a good change. It is not *no* change.

**The accurate statement:** the grants and the taps are inert in production. The return fix is
live and intentional, and it affects roughly 1.7% of level-2 boards.

This matters because "net effect on the live game: none" is the sentence someone will quote in
three weeks when a PvP result looks different from a replay recorded before the merge.

## Correction 2: not everything defaults off

Measured on a bare `mkGame`:

| field | default |
|---|---|
| `tapMode` | `false` |
| `skyCanTap` | `false` |
| `tapOwnCardsOnly` | `false` |
| `tapCostsTurn` | `false` |
| `l4` | `null` |
| **`grantSides`** | **`"both"`** |

The three passive grants are not behind a flag. They are gated by `grantSides` **and** the card
being level 3 or above. With `grantSides` defaulting to `"both"`, any card at level 3 gets its
passive grant with nothing switched on.

**It is harmless today**, and I checked rather than assumed:

- the lobby pins `lvl: 2`, so no mansion card reaches the gate
- `PLANETS` are hardcoded `lvl: 3`, but `grantOf` excludes ids 101-105 explicitly
- the only other `lvl: 3` call sites in the engine file are the vector harnesses themselves
- `manzil-lobby.js` is the sole importer of the engine outside research

**But it is a live trap.** The day anyone changes that `lvl: 2` to `lvl: 3`, or passes a `levels`
map with a 3 in it, the guard, the lead and the return switch on silently. No flag is flipped and
no one decides anything.

**One line:**

```js
grantSides: cfg.grantSides || "none",   // grants opt in, same as the taps
```

Then "all defaulting off" is true as written, and turning grants on becomes as deliberate as
turning taps on.

## Agreed, and unchanged

Both open items in the commit stand as written.

`tapOwnCardsOnly` must default `true` the moment any of this turns on. As built, a captured black
tortoise card can be tapped home into the capturing player's hand permanently, which is card theft
out of the opponent's deck. It is the same defect family as the return bug, arriving through a new
door, and it was the fourth instance found this session.

The hand-size asymmetry does deserve its own round. Her hand runs 5, 6, 7, 8 by level and the
player's is 5 forever, so every symmetric ability is worth more to whoever holds more cards, which
is always her. In the fair build — symmetric taps, own cards only, her agent tapping — moving the
player's hand from five to seven takes careful play from 33.5% to 51.9% and the skill gap from
13.9 to 23.7, against a 20+ target that nothing else measured this session has reached without
borrowing from an unfinished system.

---

*Verification files: `/tmp` runs against the committed engine; the measurement engine they were
compared to is `research/ref-tap.js`. Both gates reproduce on demand.*
