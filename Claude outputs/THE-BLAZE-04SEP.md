# The blaze: three candidates, none of them a level yet

**4 September 2026. For Design.** 1a with both dials, 1b, and the m5-plain row that 1c was waiting
on. 78 vectors in the station-law suite, 172 across six, all green. 896 boards a cell, two seeds.
**Walker boards — the standing caveat: the boss board is still unmodelled.**

**The soft ground fails harder on seat than anything measured. The brand passes every bound in all
three forms and does nothing to the tiger in any of them. The 1c gate answers against running it.
And the reason all three miss is the same reason, and it points at what the blaze's law has to be.**

Mansion 5 plain: byakko **72.7**, suzaku 62.8, seiryuu 41.5, genbu 41.6. Spread **31.2**, seat
+6.3 / +20.3, skill +3.3 / +24.1. **The tiger wins this night holding two stations of nine.** That is
the portable grant, exactly as the sweep said, and it is the whole story of what follows.

| | seat fresh | seat deep | spread | byakko | |
|---|---|---|---|---|---|
| 1a brand, lodge, −2 | +1.8 | +4.8 | 31.2 → 29.6 | **+0.2** | pass, inert on the tiger |
| 1a brand, lodge, −1 | +2.4 | +3.8 | 31.2 → 28.8 | **+0.3** | pass, inert on the tiger |
| 1a brand, take, −2 | +0.2 | +1.8 | 31.2 → 30.9 | **+0.1** | pass, inert everywhere |
| **1b the soft ground** | **−14.6 — fails** | **−11.4 — fails** | 31.2 → 31.8 | −20.9 | **fail, seat inverts** |

---

## 1b — the soft ground: the seat inverts

| gate | plain | the law | delta | |
|---|---|---|---|---|
| **seat, fresh** | +6.3 | **−8.3** | **−14.6** | **fail** |
| **seat, deep** | +20.3 | +8.9 | **−11.4** | **fail** |
| skill | +3.3 / +24.1 | +5.7 / +22.8 | +2.4 / −1.3 | pass |
| spread | 31.2 | 31.8 | +0.6 | flat |
| byakko / suzaku / seiryuu / genbu | | | **−20.9** / 0.0 / +0.2 / **−10.6** | rotates |

**The largest seat move in either direction any law has produced, and it goes through zero.** On a
fresh collection the follower now beats the leader by eight.

Design's central claim was that it never pays the lodger, because whoever stands at the middle *"is
the leader exactly as often as it is not."* **That is the sentence that turned out to be wrong.** The
leader lodges the middle more often — it is the most valuable station and the leader chooses first —
so soft ground is a tax that lands on the leader far more than half the time. It is the answer's seat
exposure with the sign flipped, and it over-corrects all the way through fair into unfair the other
way.

**The quadrant row is the guide's door in a new coat.** Byakko −20.9 and genbu −10.6, with the bird
and the dragon untouched. Soft ground punishes *sitting* on the middle, and the two quarters that sit
are the tiger, who holds ground, and the tortoise, who holds count. The bird and the dragon do not
sit. So the law charges the top quarter and the bottom quarter together, and the spread does not move
an inch — it rotates instead.

**Not salvageable by changing the number.** The seat inversion is structural: any law that makes the
middle worse to hold pays the follower, because the leader is the one who ends up holding it. The
one-footed, the carry and now the soft ground have each found a different way to say this.

## 1a — the brand: safe in every form, and it never finds the tiger

All three forms pass every bound. **In all three, byakko moves less than a third of a point.**

The lodge forms lift the dragon (+7.5 at −2, +5.4 at −1) and narrow the board by that much; the take
form is inert everywhere, every quadrant inside 2.3. Seat costs run +1.8 to +4.8 on the lodge forms —
Design's named risk, real but small — and +0.2 on the take form, which is the answer's shape doing
the answer's thing.

**Why it misses, and this is the finding.** The brand charges *faces*. Design's thesis was that on a
night where one quarter stacks big faces at the middle, the stack pays. **The tiger does not win m5
with faces, and it does not win it at the middle.** It wins with two stations of ground and seven
cards that cannot be taken anywhere. A −2 on the biggest face beside the crossing marks a card that
was never going to be taken regardless, and the board does not notice.

**The three tiger-night laws that worked all touched the grant or the count.** The toll charged
shelter, which is the grant by another name: −12.0. The crow charged the richest station's worth:
−16.0. guestStrip stripped the grant at one door: −3.9. The brand touches none of those. It is the
right shape of law for a night won by numbers, and this is not one.

**Hold it, in all three forms.** The sentence is good and the take form especially is clean; it will
land on a night where faces are the lever. Fight-class stays unbeaten on the bounds and is now
0-for-2 on actually moving a tiger night, which is a different scorecard and worth keeping
separately.

## 1c — the first mark: the gate answers against it, with a number

Design's condition was *"run it only if the m5-plain row shows seat is already low enough to spend."*
**m5's seat is +6.3 fresh, +20.3 deep — mid-table, not low.** m3 is +3.8, m2 is +4.0. There is
nothing to spend.

And the soft ground has just measured how sensitive this night's seat is to a middle-station law:
**fourteen points, from one clause.** 1c rewards the first lodger of the middle, which is the soft
ground's exposure with the sign reversed. On a +6.3 board that is a plausible +20. Do not run it as
written.

---

## What the blaze's law has to be

Two nights in a row have now said the same thing from opposite directions. **On a tiger night, the
lever is the count or the shelter, never the face.** The brand is face-class and inert; the toll and
the crow are count-class and were the two best results of the brief.

Design's instinct on 1c was right about the *class* — count is the workhorse — and the read named its
own flaw honestly: it is a seat law wearing a spread law's coat, because it rewards arriving first.
**The fix for that is the one dial that has worked every time it has been tried:** condition the mark
on a take rather than a lodge. The shell counts for nobody once taken. `plantOnTake` roots only after
a change of hands. Both removed the first-mover reward entirely, because the leader cannot profit by
arriving; only by being answered.

So the sentence I would want to measure is 1c with that dial — something in the shape of *what is
taken from the middle still counts for the hand that lost it.* It is the blaze's old signature, it is
count-class, it charges the taker rather than rewarding the lodger, and it is the shell's cousin
exactly as Design described 1c, moved one notch in the direction that has passed three times. I have
not written the sentence and will not; that is Design's. But the mechanism is `plantOnTake`'s and it
is one dial in the reference already.

**The blaze card itself is worth a second look in this light.** Its signature marks a neighbour's face
on lodge. On its own night that is the wrong verb for the ground, and the level may want the ground to
do the thing the card *cannot* — count — rather than the thing it already does.

### Files

`research/v2.js` (`brandAt`, `brandN`, `brandOnTake`, `softAt`, `softBy`, all default off),
`research/wardvec.js` (78 vectors), `m5plain.out`, `brand2.out`, `brand1.out`, `brandtake.out`,
`soft.out`.
