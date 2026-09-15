# The gate: all five rows pass, and the sheet picked the wrong winner by half a point

**5 September 2026. For Design.** 1a on both dials, 1b on both, and 1c as control. 105 vectors in
the station-law suite, 199 across six, all green. 896 boards a cell, two seeds. Walker boards.

**Nothing failed. Every row on this sheet is inside every bound, which has not happened before.**
That makes the choice a question of shape rather than safety, and on shape **1b at −2 is the pick,
not 1a** — narrowly, and for a reason the sheet did not have.

Mansion 1 plain: byakko **76.6**, suzaku 52.3, seiryuu 33.5, genbu 25.8. Spread **50.8**, seat
+5.9 / +31.3, skill **−0.0** / +31.5. *(The widest board and the second-highest deep seat in the
tested set, and note the fresh skill gap is already zero before any law.)*

| | seat fresh | seat deep | spread | byakko | shape | |
|---|---|---|---|---|---|---|
| 1a the open gate, every strike | +0.4 | −2.5 | 50.8 → 42.6 **−8.2** | **−8.0** | narrows, one-sided | pass |
| 1a the open gate, first only | +0.4 | −3.4 | 50.8 → 43.1 −7.7 | −7.6 | narrows, one-sided | pass |
| **1b the two posts, −2** | **+0.2** | +1.5 | 50.8 → 42.2 **−8.6** | −4.2 | **NARROWS** | **pass** |
| 1b the two posts, −1 | +0.2 | +1.2 | 50.8 → 47.4 −3.4 | −0.6 | narrows, one-sided | pass |
| 1c the price, again | +0.1 | +0.7 | 50.8 → 49.5 −1.3 | −1.3 | flat | pass |

---

## Why the posts win on shape

The two big rows are within half a point of each other on size — the open gate takes 8.2 off the
spread, the posts take 8.6. **The difference is which end of the board moves.**

| | byakko | suzaku | seiryuu | genbu |
|---|---|---|---|---|
| the open gate | **−8.0** | +1.7 | +3.3 | **+0.2** |
| **the two posts, −2** | −4.2 | **+5.4** | **+3.7** | **+4.4** |

**The open gate narrows by pulling the top down and leaving the floor where it is.** The tortoise
moves two tenths of a point. The board gets shorter at one end.

**The posts narrow by pulling the top down *and* lifting the floor** — genbu +4.4, suzaku +5.4,
seiryuu +3.7. It is the only row on the sheet the shape metric calls a true NARROWS, and on a board
where the bottom quarter is at 25.8 the floor is the half that needs raising. **On the widest board
in the tested set, a law that only lowers the ceiling leaves the tortoise exactly as badly off as it
found them.**

That is a genuinely close call and I want to be clear it is close: half a point of spread, and the
open gate has the better deep-seat row (−2.5 against +1.5). If Design prefers the gate's fiction —
and the fiction is better, a house whose door does not shut is a good level — the open gate is a
defensible ship. **But the posts do the thing the byakko brief exists to do, and the gate does half
of it.**

## The dial answers

**Open gate: `openN` makes almost no difference.** Every strike −8.2, first strike only −7.7, and the
seat rows are identical to a tenth. That is worth knowing on its own: **on this night the crossing is
rarely contested more than once**, so "pierce every strike" and "pierce the first" are nearly the
same law. Design offered `openN` 1 as the gentler notch in case the tiger fell under the bird; it
never did — byakko stays top at 68.6. The gentler notch is not needed and buys nothing.

**Posts: −2 or nothing.** At −1 the law is 3.4 of narrowing and byakko −0.6, which is close to the
crowd's −1 row: safe and nearly inert. The whole effect lives in the second point.

## 1c the price, again: the control did its job and says something new

**Flat: spread −1.3, every quadrant inside 1.4, seat +0.1.** The price passes on m1 and does almost
nothing there.

**And that is not a failure, it is the portability rule working.** I ran the price on four nights
this morning — m2, m3, m4, m5 — and it was 4/4, narrowing between 4.6 and 11.9. **m1 is its fifth
night and its smallest effect.** The law is portable in the sense that matters (it never breaks a
board) and its *size* varies with how much shelter is on the road.

That last part is the finding. On m1 the tiger holds six stations of nine and the middle is m5,
tiger ground — so shelter at the crossing should be *more* common, not less, and the price should
bite harder. It bites less. **The reason is that the price only charges a sheltered card that
chooses to strike from the crossing, and on a board the tiger is already winning 76.6, the tiger's
cards at the middle do not need to swing.** The law prices an action nobody is taking.

**So the price's clause needs company to matter, which is exactly what 1b is.** Two posts instead of
one station, and the effect goes from −1.3 to −8.6 on the same night with the same condition. That
is the cleanest demonstration on the sheet that **the shelter-price family scales with the number of
stations it stands on, not with the strength of the setting.**

**Design's portability debt is paid twice over**: the price now has five nights and is 5/5.

## Recommendation

**Ship the two posts at −2.** `lawAt {1:{station:[4,6], kind:"post"}}` in Design's numbering,
**indices 3 and 5** in the reference and in Code's map — m4 the follower and m6 the storm, both tiger
ground, with m5 the blaze plain between them. Best spread row on the sheet, the only true NARROWS,
seat +0.2, and it lifts the floor that m1's board most needs lifting.

**The open gate is the honourable second** and I would not argue hard against it. If it ships,
`openN` should be **all** — the gentler notch changes nothing and costs a clause.

**Two build notes.** The pair station is a first for `_lawSt`, as Design flagged; the reference took
it as a list and nothing else needed changing, so the shape is cheap. And the law-explains-itself
problem is real — two tells rather than one — but the two posts are symmetrical around the opening,
which is a picture a player can read in one look. That is the version of two-station that has the
best chance of teaching itself.

**One flag for the level, not the law.** m1's fresh skill gap is **−0.0 before any law**, and every
row on this sheet leaves it there. Careful and careless play are worth the same on the gate's night
to a new collection. No law on this sheet caused it and none of them can fix it; it is a property of
the night. Worth knowing before the gate is anyone's first boss.

### Files

`research/v2.js` (`openAt`, `openN`, `postAt`, `postN`, all default off),
`research/wardvec.js` (105 vectors), `m1plain.out`, `openall.out`, `open1.out`, `post2.out`,
`post1.out`, `price_m1.out`.
