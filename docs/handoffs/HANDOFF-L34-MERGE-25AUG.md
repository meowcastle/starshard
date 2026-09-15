# Levels 3 and 4 — the merge handoff

**25 August 2026, night.** Design asked three questions and said no sim answers the biggest one.
I built the sim. This answers all three, and it changes two of Design's four grant worths and
turns up a live bug in the shipped engine.

**Engine used:** `research/ref-l34.js` — the generation-D reference (36,625 bytes, the rebased one)
with the quadrant grants ported on, reference-first. **60/60 vectors. 2,000/2,000 identical to the
reference at level 2**, which is the correct result because grants are inert below L3.

**Noise floor: 784 boards a cell, standard error 1.8pp. Anything under about 3.5pp is not real.**
Read every "+1.2" below as zero.

---

## 0. Read this before anything else: a live bug

`playBoard` sends every returning card to the player's hand, whoever owned it.

```js
// the shipped line, in both the reference and the server copy:
if (mv.r.ret.length) { g.you = g.you.concat(mv.r.ret); g.retUsed = true; }
//                     ^^^^^ always the player
```

`mv.r.ret` holds the **defender's** card. So when the player flips her Return on its own ground,
her card does not come home. It **defects into the player's hand.** She loses a card, the player
gains one, on the same move.

Verified directly against the engine's own `[sky] the return comes home once` setup: her card 7
returns, and lands in `you`.

**The fix**, one line:

```js
if (mv.r.ret.length) {   // a returning card belongs to the side that did NOT move
  const back = side === "you" ? "sky" : "you";
  g[back] = g[back].concat(mv.r.ret); g.retUsed = true;
}
```

Still 60/60 vectors. Changes **34 of 2,000** level-2 boards.

**This is the third instance of the same trap** — after the ten `"you"` hardcodes the 24 August
change fixed, and after `grantOf` filtering `c.id > 28` and killing every loaner copy. Assume a
fourth exists.

**And the vector suite does not cover it.** All 60 vectors call `resolve` directly; none exercises
`playBoard`'s hand bookkeeping, which is where this lives. That gap needs two new vectors, one per
seat, before anything else in this document is trusted.

Everything below was measured **with the fix in**. Without it the numbers are wildly different and
wildly wrong, which is most of why the answers here are calmer than expected.

---

## 1. Design's question three: does her hand get the grants?

Design called this "the biggest decision in the merge" and expected it to either fix the skill gap
or invert it. **It does neither. It barely registers.**

Level 3, her hand is seven, rung 9 (the mansion's own sky). Baseline with no grants at all: **26.1
careful.** The number is the player's win rate.

| grant | cards | player only | both sides | walker only |
|---|---|---|---|---|
| the guard | 1-6, 28 | 27.3 | 26.7 | 26.3 |
| the lead | 7-13 | 27.9 | 28.1 | 26.3 |
| **the turn** | 14-20 | **33.2** | **32.5** | 25.9 |
| the return | 21-27 | 27.7 | 28.2 | 28.3 |

Read the last column. Every grant in her hand alone lands between 25.9 and 28.3 against a 26.1
baseline. **Grants in the walker's hand do nothing measurable.** She has them at line 4015 today
and it costs nothing.

**So: give them to both sides.** Not because symmetry helps, but because it is free, it is what
players will expect, and asymmetric rules are where the last three bugs came from.

## 2. Two of the four grants do not work, and one does not work the way Design measured it

Against the same 26.1 baseline, in the player's hand:

| grant | Design's measured worth | measured here | verdict |
|---|---|---|---|
| the turn | +7.5 | **+7.1** | **confirmed. Ship it** |
| the guard | +3.2 | +1.2 | inert |
| the lead | +3.1 | +1.8 | inert |
| the return | +4.7 | +1.6 | inert |

Only the turn survives. The other three are inside the noise floor.

**One caveat on the return that cuts the other way, and Design should know it.** The fixed starter
pack is `5, 6, 10, 17, 18`, which is **two Byakko, one Suzaku, two Seiryuu and zero Genbu**. The
player almost never holds a return card, so its player-only column is under-powered by
construction. Its walker-only column (+2.2) is the trustworthy one, and it is also inert. The
conclusion holds, but the pack composition is a separate problem: **as written, the starter pack
decides which of the four grants a player ever meets, and one of them they never meet at all.**

### Why three of four are inert, which is the useful part

The turn adds an **option**: every Seiryuu card can now be lodged either way round, so the branching
factor of the player's turn roughly doubles. The guard, the lead and the return each add a
**condition**: a tie resolves differently, a first move changes hands, a flip is refused once.

On a nine-slot board where the count decides and both agents search eight moves deep, a
depth-8 search routes around a condition and cannot route around an option.

> **Effects that add options work. Effects that add conditions do not.**

That is the same finding as the sixteen inert signatures, which are also mostly conditional
modifiers. It is one law, and it should govern both redesigns.

## 3. Design's question two: what is L4?

**"The grant fires twice" is not a coherent rule for three of the four.** The guard and the turn
are passive properties with no firing to count. The lead is inherently once, because a board has
one opening move. Only the return is once-a-board, so "twice" is a rule for seven cards out of
twenty-eight.

I tested the alternative that does generalise — **L4 drops each grant's positional condition**
(the guard holds a tie anywhere rather than on or beside its own ground; the return comes home from
anywhere rather than only its own ground):

| | careful | casual | gap |
|---|---|---|---|
| L3 grants, both sides | 37.1 | 19.4 | 17.7 |
| L3 + L4 uncondition | **30.4** | 14.3 | 16.1 |

**It makes the game harder and the gap smaller.** Both worse.

The reason is structural and it is a warning about the whole L4 design: **her hand grows with
level and the player's does not.** Five for the player at every level; five, six, seven, eight for
her. So any symmetric "more power" rule is worth more to the side holding more cards, which is
always her. **An L4 that scales with hand size will systematically favour the walker.**

**My answer to question two: do not design L4 yet.** Three of the four grants do not work at L3.
An L4 built on top of them is sharpening a blade that has no edge. Fix L3 first, then L4 becomes a
much easier question because there will be something real to sharpen.

## 4. Design's question one: mansion 2

Byakko, by position. It is already how the table reads, it is what the engine does, and nothing
measurable turns on it. **Decided, no work needed.**

---

## 5. What I would change, and it kills the Throne debt

Redesign the three inert grants as option-adding rather than condition-adding. One of them lands
exactly on the debt Design flagged:

| quadrant | today, inert | proposed |
|---|---|---|
| **Suzaku** 7-13 | the lead: steals the opening move | **once a board, you may tap a lodged card of yours and act on it in place** |
| **Byakko** 1-6, 28 | the guard: cannot be flipped by a tie | **once a board, you may refuse one flip** — a decision, not a property |
| **Genbu** 21-27 | the return: comes home once | **once a board, you may pick up one of your lodged cards and lodge it again** |
| **Seiryuu** 14-20 | the turn: lodge either way round | **unchanged. It is the one that works** |

**The Throne is mansion 10. Mansion 10 is Suzaku.** So the zoom copy's standing promise — "once a
board you may tap it after it lands to turn it in place" — stops being a bespoke debt and becomes
the flagship instance of the Suzaku grant. Same new move kind Design already scoped: a tappable
lodged card, a per-board flag, a re-resolution pass through the existing queue. One implementation,
one debt cleared, one dead grant replaced.

All three proposals share that machinery. Build the tappable-lodged-card move once and all of
Suzaku, Byakko and Genbu light up together.

**Cost, honestly:** this is more than the "cheap half" Design offered to start on, and it needs her
AI to know when to use a tap, which is a new move type in both agents. It is not a small change. I
think it is the right one, because the cheap half as specified ships three grants that measurably
do nothing.

**If you want the cheap half anyway:** ship the data table plus the turn, both sides, and hold the
guard, the lead and the return. That is real, it is +7.1, and it is honest. Do not ship the other
three as-is and call the level mechanical.

## 6. The pilot houses problem is worse than Design said

Houses 21-28 cover Genbu 21-27 plus mansion 28, which is Byakko. So the pilot can test **the return
and one guard card.**

Those are two of the three grants that do not work. **The turn — the only one that does — is
mansions 14 to 20, and none of them is open.**

Testing L3 in the pilot houses as they stand would show a level that does nothing, which is exactly
what the numbers predict and exactly the wrong conclusion to draw. **Open one Seiryuu house, or
open the test house off the moon ring.** This is now blocking, not a nice-to-have.

## 7. One thing not to carry across

`research/manzil-engine-v7-tiebreak.js` has a dead branch: the cascade checks
`fromGrant === "strike"` while the quadrant table assigns Suzaku `"lead"`. Left over from an
earlier draft where Suzaku granted the second strike. It never fires. **Do not port it.** My port
onto the generation-D reference does not carry it.

---

## 8. Sequence

1. **Fix the return destination** and add the two `playBoard` vectors that would have caught it.
   One line and two vectors. Do this before anything else; it is a live bug in the shipped server
   copy.
2. **Decide the redesign in §5**, or accept the cheap half in its honest form (the table plus the
   turn only).
3. **Open a Seiryuu house or the test house.** Nothing about L3 can be validated in the pilot
   without it.
4. **The data table plus the turn**, both sides. This is the half that is genuinely cheap and now
   genuinely testable.
5. **The tappable-lodged-card move**, if §5 is accepted: engine, both agents, then the Throne's
   copy debt closes with it.
6. **Re-measure and add conformance vectors** for every grant, per seat, before L4 is discussed
   again.

### Reproducing

| what | file |
|---|---|
| the engine | `ref-l34.js`, and `ref-l34-fix.js` with the return fix |
| grant symmetry and the L4 test | `grants.js` |
| per-quadrant isolation | `fixiso.js` (post-fix), `iso.js` (pre-fix, kept as evidence) |

**One methodological note, because it nearly cost me this whole document.** My first port set the
turn's `twoFaced` flag inside `makeCards`, which has no access to the game state, so Seiryuu cards
were two-faced in every configuration including the no-grant baseline. The turn read exactly
0.0/0.0/0.0. Exact zeros mean a broken port, not a weak effect, every time. I caught it, moved the
turn to the point of use, and re-ran everything. The numbers above are from the corrected port.
