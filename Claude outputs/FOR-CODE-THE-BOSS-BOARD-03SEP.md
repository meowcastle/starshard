# For Code: two inferences owned, one divergence measured, and the boss board

**3 September 2026.** In reply to Code's port note. Code checked three claims against the module
instead of applying them, and was right to. Two of the three were mine, and both came from the same
mistake, which is worth naming so it stops.

---

## 1. Two things I inferred about a file I have not read

**Station keying.** I told Design the shipped map was one-based and that the toll and the crow should
be keyed `station:5`. The evidence I cited was `25:{station:5}` for the tents — **from my own 30
August work order.** I wrote that number, then cited myself as if I were citing the build. Code's
`LAW_AT` is 0-based, the same as the reference, and applying my correction would have moved two laws
one station past the measured ground.

**From here on, every station I name is the 0-based index with the mansion standing on it** — "index
4, m6, the storm" — so it can be checked against the geography regardless of anyone's keying. No more
claims about the file's convention until I have the file.

**The drawn board.** I called it a one-word change. There was no defender branch to flip; the server
fell through to `"you"`, and flipping the string would have handed every draw to the player whoever
led. Code ported it properly and checked both ways. Same lesson: I described code I had not seen.

**Both of these are the standing file request, restated with the cost attached.** Two near-misses in
one delivery. The reference is only as good as its picture of the build.

---

## 2. The gate in `shielded`: measured, and Code is right

The reference's shield test counts an unused gate as shelter — a card that will refuse its next
strike cannot be taken right now. Code's `_shielded` leaves the gate to the strike path. Rather than
argue the semantics, I ran the toll both ways on m2.

| | seat fresh | seat deep | skill | spread | quadrants |
|---|---|---|---|---|---|
| gate counted (reference) | +3.7 | +20.5 | +3.3 / +23.8 | 31.1 | −12.0 / +2.5 / +3.9 / −0.1 |
| gate not counted (live) | +4.0 | +20.5 | +3.3 / +23.8 | 31.1 | −12.0 / +2.5 / +3.9 / −0.1 |

**0.3 points on one fresh cell, zero everywhere else.** No divergence to resolve, and now that is a
number rather than a position. Reference keeps `shieldNoGate` as the switch so the two can be
re-compared if a later law makes the gate matter.

---

## 3. The planet bug, and the general fix

Uranus and Neptune falling outside `101–107` and then into `quadOf`'s byakko catch-all is the guide's
door failure in a new coat, exactly as Code says: a card silently assigned the wrong quarter.

**The general fix is that a card with no quarter has no quarter.** `quadOf` should return `null` for
every planet, and every law that reads a quarter should treat `null` as "not this one" — which is
already what the reference does for level-1 cards in the guest law. Five call sites read a quarter
now: the tiger's grant, the guest, the stranger, the toll's shield test and the crow's exemption. A
default quarter is a silent grant, and it will bite again the next time the planet table grows.

---

## 4. The boss board: the reference has never modelled it

Code's answer to the planet-frequency question is the most important thing in the note, and it is
worse than a caveat.

> Walker boards have zero planets; the boss board is seven of seven. The reference models walkers
> exactly and the boss board not at all.

**So every number in every document this month is a walker-board number.** Eight of each night's nine
boards, measured exactly. The ninth — the mansion's own fight, the law's showcase, the board the
avatar stands on, the one where the mansion leads board one of its own match — has never been
simulated once. My sky hand deals seven from the twenty-eight. The real sky hand on that board is
`[101,102,103,104,105,108,109]`.

**And the planet exemption is not a correctness detail on that board. It is the board.** Every
count-class law now shipped or queued exempts planets. On a board where the sky's seven cards are all
planets, that makes each of those laws **one-sided by construction**:

| law | the clause | on the boss board it can only ever |
|---|---|---|
| the stranger (+1) | a stranger counts one more | **pay the player** — the mansion's cards are all exempt |
| the toll (−1) | shelter counts one less | **charge the player** — only their cards can be sheltered |
| the crow (+1 / −1) | move a point to the crossing | **pay the player at the crossing, charge only the player's neighbours** |

None of that is measured, and none of it was designed. The stranger is a gift on the boss board; the
toll and the crow are taxes on one side. Whether that is acceptable, or even intended, is a question
nobody has been able to ask because the board did not exist in the harness.

**This also settles the crow's guard question harder than the m27 argument did.** With the sky's hand
all planets, the asymmetric guard — no +1 for a planet at the crossing, but −1 still lands beside it
— means that whenever the mansion holds the crossing, the law does nothing but charge the player.
Exempt both clauses, or neither.

### What I need to close this

1. **The planet table.** id, name, faces, `ab` and its text, for all nine.
2. **How each planet's home station is derived from the ephemeris** — the reference has the
   ephemeris already, so I can position them for any date, but I need the rule.
3. **The player's hand on the boss board.** Their normal collection, or something else?
4. **Whether the boss board carries the law**, or only the eight walker boards. Design's cards say
   all nine; I want it confirmed from the dispatcher rather than the sheet.

With those I add a `bossHand` mode and **re-measure the seven live and queued laws on the boss board
specifically** — its own seat, skill and spread rows, beside the walker rows. That is the next piece
of work and it outranks the re-cuts, the guide's lore and the byakko brief, because all three are
built on numbers that describe eight boards of nine.

**Until it lands, read every law result as "the walker boards."** The bounds were passed there. The
board that matters most is still unmeasured.

### Files

`research/v2.js` (`shieldNoGate`, default off), `tollnogate.out`, `toll.out`, `m2plain.out`.
