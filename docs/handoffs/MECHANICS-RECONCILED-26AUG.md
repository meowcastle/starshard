# Design's arena doc against the engine, and a clean system

**26 August 2026.** Every line below traces to `research/ref-boss.js` — the merged reference, which
is what `manzil-engine-v6.js` and the server run. Design's document describes
`Manzil - The Empty District.dc.html`. **They are two different games in about a third of the
cards.**

---

## Part 1. Where the two documents disagree

### Severe — the card is a different card

| # | card | Design's client | the engine |
|---|---|---|---|
| **18** | **the heart** | Beats: +2 on its holder's turn, −2 on the other's. Strikes like a nine, holds like a five. L3 tap holds the beat; L4 tap bursts it and takes both neighbours. | **Counts two while your side holds less of the road.** A comeback card. No beat, no tap, no burst. |
| **20** | **the flock** | Counts two while any card stands beside it. | **Turns whatever it claims** to its other face as it joins. Not a counting card at all. |
| **28** | **the thread** | Changes the board's shape: station one and station nine become neighbours. | **Takes both ends of the road** for its side at the count. A counting card. Adjacency is never altered. |
| **27** | **the guide** | A tap: trades places with one of her cards, once a board. | **Swaps the two cards standing either side of it** as it lands. Not a tap, not her card specifically. |

### Design has an effect the engine does not implement

| # | card | the extra thing | engine |
|---|---|---|---|
| 3 | the gathered stars | "strikes both its sides again every time she lodges anywhere" | counts two, nothing else |
| 16 | the claws | "as they land they also strike two stations out" | only the −2 on whoever claims them |
| 11 | the mane | "both faces fight +2 while a card stands on either side" | no number change at all; only reassigns whose the station is |
| 19 | the root | "cannot be taken for the rest of the board" | +1 on your first lodge, no immunity |
| 21 | the empty district | "cannot be taken while five or more stations are still open" | no immunity |
| 7 | the return | "once a board, **wherever it stands**" | **only on its own mansion** |

### The engine has an effect Design's doc does not mention

| # | card | the missing thing |
|---|---|---|
| **21** | **the empty district** | **It silences both stations beside it — they count for nobody.** This is the strongest single effect on the board and it is absent from Design's description. |
| 14 | the jewel | Immune to softening entirely, not just a floor of seven. |
| 2 | the bearer | Locks the ground of a friendly card that *lodges* beside it, as well as one it claims. |
| 26 | the chamber | Safe for two turns, not one (`age <= 1`). |

### Planets and grants

- **Saturn.** Design says "locks its ground." The engine says **cannot be flipped**. Those are
  different mechanics — a ground lock is about scoring, immunity is about capture. Design's wording
  describes the bearer's effect, not Saturn's.
- **Suzaku's tap.** Design: strikes again "showing the face it already shows." My build turns first
  if the card is two-faced. **Design's version is correct and mine was wrong** — I proved in a vector
  that the forced turn can cost the throne its strike.
- **Seiryuu's grant is dead in the client.** Design flags this as a known gap. It matters more than
  the note suggests: **Seiryuu's two-facedness is the only one of the four grants that measures as
  doing anything** (+7.1 against a noise floor of 3.5). The other three measured at +1.2, +1.6 and
  +1.8. The one grant that works is the one that is not wired.
- **"A captured card is never yours to tap."** Design has independently closed the card-theft hole I
  flagged. Correct, and it should be written into the engine as `tapOwnCardsOnly`.

### My own error, for the record

My inventory yesterday said the hideaway "counts two on its own ground." The code is
`if (c.ab === "hideaway") w += 1` — **unconditional**. Design's "counts two for whoever holds it" is
the accurate one.

### Entirely new in Design's doc, not in the engine

Night laws, the five boss rules, the mansion-18 law, best-of-five matches, the nine marks, and the
level-4 "specialty of its own." None of these exist in the resolve path. That is fine for the ones
that are proposals; it is not fine that they are written in a document titled *source of truth*.

---

## Part 2. The clean system

Design's nine marks contain a category error that is the source of most of the mess: **`⊙ tap` and
`◷ first` are not what an ability does, they are when it happens.** Mixing what with when is why
twenty-eight cards feel like forty.

Split them and the whole set collapses.

### Five classes. Every ability in the game is exactly one.

| class | the question it answers | permutations |
|---|---|---|
| **NUMBERS** | what does this card fight with | **3** |
| **STRIKES** | does a fight happen outside the normal exchange | **3** |
| **HOLDS** | can this card be taken | **2** |
| **MOVES** | where is this card, and which way does it face | **3** |
| **COUNTS** | what is this station worth, and whose is it | **2** |

**Thirteen permutations. That is the whole game.**

### Six triggers. Every ability is exactly one.

**on lodge** · **on claim** · **on being struck** · **at the count** · **always** · **on tap**

Every card is one class and one trigger. Two words describe any card in the deck.

### The permutations, fixed

**NUMBERS** — never below 1, and only three magnitudes exist:
- **−1 to a field** (everything beside it, both sides) — the void
- **−2 to one card** (targeted, spent once) — the ghost, the glance, the claws
- **+1 to your own** — the root

*Floors:* the jewel is the single exception — never below seven, and immune to softening.
**One exception card only. If a second one is ever printed, delete this rule and make it a class.**

**STRIKES** — three, and they differ by *when*, not by how hard:
- **strike again** from where you stand — Suzaku's tap
- **strike one further** — Mars
- **strike back** when something is taken — the listener (on lodge beside), the drum (on claim
  anywhere), the follower (on claim beside)

**HOLDS** — two, and only two:
- **ties cannot take it** — the storm, Byakko's guard
- **nothing can take it** — Saturn; the chamber, with a two-turn timer

**MOVES** — three:
- **turn a face** — the veil, the turning, the flock, the throne, Mercury, Seiryuu
- **step to an empty station** — the hand
- **back to hand** — the return, Genbu's tap

**COUNTS** — two, and this is where "grounds" lives:
- **worth one more** — dominion, the gathered stars, the crown, the empty district, the hideaway,
  the heart, Jupiter
- **counts for someone else** — the mane, the thread, and the two *grounds* cards, the bearer and
  the blaze, which lock a station's scorer separately from its holder

*Silence* — a station worth nothing to anybody — currently belongs to one card, the empty district.
Same rule as the jewel: one exception is a card, two is a class.

---

## Part 3. The redundancy, named

Sorted into the system, the duplicates are obvious.

**Three cards are the same card.** The gathered stars, the empty district and the hideaway are all
`COUNTS · worth one more · always`, unconditional, no rider. The district at least also silences.
The other two are indistinguishable in play.

**Two pairs differ only by trigger.**
- The ghost and the glance are both `NUMBERS · −2 targeted · once`. One triggers on an enemy landing
  beside it, the other on the enemy's next card anywhere. In play they are the same card.
- The bearer and the blaze are both `COUNTS · grounds`. One on claim, one on lodge.

**Two more differ only by trigger.** The turning and the veil are both `MOVES · turn a face`. One
fires when it lands, the other when something lands beside it.

**Four cards are conditional counts** — the crown, the heart, and in Design's version the flock and
the district. Three of the four conditions are "while a neighbour is yours" in different words.

**That is nine of twenty-eight doing four jobs.** It is most of why sixteen signatures measure as
worth nothing: the search does not care which of three identical cards you played.

---

## Part 4. What I would do

1. **Pick one document.** Two source-of-truth files describing different games is how the
   return-routing bug survived four differentials. The engine is testable; the client is shippable.
   They have to be reconciled card by card before anything else in this list matters.
2. **Wire Seiryuu.** It is the only grant that works and it is dead in the client.
3. **Take Design's Suzaku over mine.** Strike showing the face you already show. No forced turn.
4. **Collapse the three unconditional counters into one**, and give the other two a different class.
   The deck has room for exactly one "counts two, always."
5. **Merge the ghost and the glance**, and the turning and the veil. Free the slots.
6. **Apply the two-word test to every card**: one class, one trigger. Anything that needs three
   clauses to describe is doing two cards' work, and the heart in Design's version currently needs
   six.
7. **Keep the silence and the jewel as the two named exceptions**, and hold that line. Every future
   card is one of the thirteen permutations or it is a rules change, and a rules change gets tested.

### Where the classes come from

`faceOf` is NUMBERS. `resolve`'s queue is STRIKES. `safeNow` and `tryFlip`'s early returns are
HOLDS. `lodge`'s trigger block is MOVES. `slotW` and `ctxOf` are COUNTS. The five classes are not a
taxonomy I invented over the cards — they are the five places in the engine where an ability can
attach. There is nowhere else for one to live.
