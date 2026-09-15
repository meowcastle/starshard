# Manzil v6: reply to the 22 August handoff

22 August 2026. Everything here is measured on `research/manzil-engine-v6.js`, a port of
`Manzil - Prototype.dc.html` **as shipped**, not of an earlier build. The port passes 33
conformance vectors (`runVectors()`), one per live law and one per signature.

---

## 1. The port is calibrated, and §1 replicates

The single most important number in the handoff was that levelling numbers, not signatures,
is the game. It reproduces on the real ruleset almost exactly:

| starter twelve | careful | casual | gap | handoff |
|---|---|---|---|---|
| base numbers, signatures asleep | 11.9 | 10.7 | **1.2** | 12.4 / 11.0 / 1.4 |
| base numbers, signatures awake | 32.1 | 32.1 | 0.0 | 35.8 / 16.1 (L2) |
| re-baselined to L3, asleep | 29.8 | 20.2 | 9.6 | — |
| **re-baselined to L3, awake** | **54.8** | **34.5** | **20.3** | 59.4 / 36.7 / 22.7 |

Within half a point on the row that matters. The handoff's deltas travel, its diagnosis is
right, and the two conclusions stand: **a twelve at base numbers cannot ship** (a 1.2-point
skill gap), and **numbers must be in the card from night one**. Signatures alone move the
game 20 points but cannot rescue a card that is numerically outgunned.

Note the third row. Re-baselining without signatures is only 29.8. Neither half works alone.

## 2. What shipped in the prototype today

**All 28 signatures are live.** Previously seven were coded and twenty-one printed a move
that did nothing. The full slate now runs through five hooks: `_faceOf` (every face modifier,
resolved live), `_safeNow` (protection), `_slotW`/`_ctx` (the count), `_resolve` (chains and
strikes), and `_lodge` (placement effects).

**The three reworks owed from addendum 7 are cleared.**

- **The storm** cannot be tied *while it stands on its own mansion*. Unconditional immunity
  measured 74.9% careful, ten points past band, at every directionality.
- **The empty district** is off the −1 axis and onto the count: it counts two while nothing
  of yours touches it. The old version was net negative because it softened your own flank
  and spent ties that already paid you.
- **The thread** is off the wrap, which measured +0.9 careful and 0.0 casual. It now holds
  both ends of the road: the first and last mansions count for whoever holds the thread. The
  wheel closing is a count now, not one extra adjacency.

**Two cards were rewritten a third time.** §8 of the handoff read our sheet's *drafted*
column rather than its decided one, so its two fixes were the drafts we had already rejected.
Both measurements were still right about what is shipped, so both cards moved somewhere new:

- **The heart** was "burns brighter behind" (measured −8.8: a card that is strong only while
  you are losing). It is now an aura: *while the heart stands, nothing of yours can be
  softened.* Her venus lands beside something almost every board, so it fires constantly, and
  it does not reward falling behind.
- **The hideaway** was "its mansion is silent" (measured 0.0: silencing its own mansion also
  silenced its own dominion, so it cancelled itself). It now closes the loudest mansion
  *beside* it. Aimed outward, it cannot cancel itself.

**The glance and the listener are off hidden information.** You were right that her hand is
public: her five planets render as five distinguishable lights, so "reveals one of her closed
cards" was worth nothing. Neither card needed hidden information, only a live effect.

- The glance: **her next card fights at −1.** It sees the blow coming.
- The listener: **it strikes what lands beside it.** When she lodges next to the listener,
  the listener fights first, before the new card resolves.

**The ghost got its condition.** Addendum 7 flagged it at +27 alone. Its softening now only
holds while the road is less than half full, so it is an opening aura that fades.

**§3 shipped: five dealt from a pack of twelve at the start of every board, face up.** The
walking five became a walking twelve; the deal is seeded per night and per board, so it is
the same for everyone tonight and different tomorrow, matching the seeded-sky rule. Tonight's
mansion is guaranteed in the deal when you carry it (`dealGuarantee`, on by default, the open
call from §3 answered the way the handoff leaned). Randomness before the board, in the open;
full information inside it.

## 3. The slate as it now stands

| card | numbers | signature | family |
|---|---|---|---|
| the gate | 6\|5 | lodges before her lead, once | tempo |
| the bearer | 6\|4 | your neighbours beside it fight +1 | faces |
| the gathered stars | 7\|6 | counts as two at the count | count |
| the follower | 7\|7 | its left face copies what stands left | faces |
| the blaze | 5\|6 | its mansion counts yours, whoever holds the card | count |
| the storm | 8\|5 | cannot be tied on its own mansion | faces |
| the return | 7\|6 | the first time she claims it, it comes home | tempo |
| the ghost | 6\|6 | her cards beside it fight −1 while the road is under half full | faces |
| the glance | 4\|6 | her next card fights −1 | faces |
| the throne | 6\|9 | two-faced: you choose which number faces which way | faces |
| the mane | 6\|5 | +1 while it stands between two cards | faces |
| the turning | 7\|5 | turns her neighbour's numbers as it lodges | geometry |
| the hand | 7\|4 | may be lifted and lodged again once | tempo |
| the jewel | 7\|7 | cannot be softened | faces |
| the veil | 8\|2 | safe the turn it lands | protection |
| the claws | 6\|6 | whatever claims it fights −1 after | faces |
| the crown | 6\|6 | counts two on an edge mansion | count |
| the heart | 7\|7 | while it stands, nothing of yours can be softened | protection |
| the root | 7\|6 | +1 as your first lodge, all board | faces |
| the flock | 6\|6 | when it claims, your cards beside it gain +1 | faces |
| the empty district | 2\|8 | counts two while nothing of yours touches it | count |
| the listener | 7\|4 | strikes what lands beside it | claim |
| the drum | 4\|7 | its claim strikes one further | claim |
| the void | 9\|2 | safe while it stands alone | protection |
| the hideaway | 5\|6 | closes the loudest mansion beside it | count |
| the chamber | 7\|5 | your landings beside it are safe | protection |
| the guide | 6\|5 | may trade grounds with another of your cards | tempo |
| the thread | 5\|6 | holds both ends of the road | count |

Two are player-side tempo the sim cannot use: **the hand** and **the guide** are tap-driven
in the prototype and lodge as plain cards in the port. Everything else measures.

## 4. The conformance contract

`runVectors()` in the engine is the thing to reproduce before any future sim's numbers are
accepted. Thirty-three vectors: the three base laws (ties flip, a tie-flip strikes both its
own neighbours, tied counts are yours), dominion, jupiter's counts-two, saturn's locked
ground, and one per signature. A port that fails any vector is measuring a different game,
which is what happened between the 21 August port and the shipped build:

- the handoff's §4 headline, "the reply weight is currently a constant," described pre-21-August
  code. It has been a per-rung ramp since the road revision.
- its "shipped" baseline read careful 73.5 with 4.06 flips; ours reads 62 to 67 with 5.1,
  because the port predates the flip-density pass (Combo and tie-count-to-you, 20 August).

Both are honest port drift, and both vanish if the vectors run first.

## 5. Still open

1. **The re-baseline itself is a canon change and is not applied.** Card numbers derive from
   star prominence in `research/mansions-table.json`, and the L3 bump is +1 to the lower side
   of all 28. The evidence for doing it is now overwhelming (§1). It needs an explicit yes,
   and it will touch the base-set sheet, the familiarity law's reward, and the "L4 everything
   ≈ a year" pricing.
2. **What L3 and L4 are worth once numbers stop moving.** Familiarity alone is art, not
   reward. The open per-mansion-levels question from 21 August probably answers this.
3. **Which twelve is the starter twelve.** §1's numbers use the handoff's stand-in.
4. **Her reading depth, untangled from her signatures**, before rung values are written. The
   ladder currently ramps 3·4·5·6·7·8·9·11 with 14 at the sky; the handoff's evidence says
   the useful range is 8 to 24 and that below 8 she is a different opponent, not a weaker one.
5. **The 1-ply gap.** Casual sits at 34.5, just under band. The ladder is still the answer,
   not card numbers.
6. **Double-blind placement.** Highest variety in the study, unmeasured for exploits.

## 6. Files

- `Manzil - Prototype.dc.html` — the game. Source of truth.
- `research/manzil-engine-v6.js` — the port, plus `VECTORS` and `runVectors()`.
- `Manzil - Signature Pass.dc.html` — the decision record for the slate. Read the *decided*
  column (`RW`/`NOW`), not the drafted one (`D`).
- `Manzil - Rules & Cards.dc.html` — the printed rules, at v6. Needs a v7 pass for the slate
  and the deal.
