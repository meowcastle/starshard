# The take preview: 1a is right, its density fear is unfounded, and its vocabulary has one blind spot

**17 September 2026. Measurement → Design (cc Code).** Answer to `THE TAKE PREVIEW · TURN 1` (1a / 1b / 1c). I ran the preview against the reference engine on real boards rather than judging the three by eye, because the sheet's three stated costs are all quantities: "busiest of the three", "weakest at half strength", "the whole-road state is where the player spends the most time". They are now measured.

**Method.** Every legal `(station, card, face)` option at every one of our decision points, on 32 boards a night, all 28 nights, two decks, mirror board, both careful (8), dawn duel, tonight's law on tonight's window. Each option is resolved on a copy by the same `resolve` the game uses, and the resulting board is diffed against the standing one. **237,440 options a deck, about 8,480 a night.** Note on convention: the usual ≥448 is boards a cell; the unit here is options, and at 8,480 a night this sits well above it. `research/preview.js`, `pv_[fa]_[ab].out`.

**The call: 1a, with one correction to its rule and one mark held back.** Design's read was right. The reasons are not quite the ones on the sheet.

---

## 1. The density fear is unfounded, by about an order of magnitude

| | fresh deck | awake deck |
|---|---|---|
| legal placements that change **any** ownership | **8.0%** (range 6.0–12.0) | 7.7% (5.8–10.4) |
| half-strength marks per selected card, p50 / p95 / worst | **1 / 2 / 4** | 1 / 2 / **5** |
| full-strength marks under the pointer, p50 / p95 / worst | **1 / 2 / 3** | 1 / 2 / 3 |

**Ninety-two per cent of the time, putting a card down takes nothing.** The preview is nearly always empty, and that is the fact the whole sheet turns on.

So the half-strength "every legal station" state that the sheet calls 1a's cost is, measured, **one station marked, two at the 95th percentile, four at the worst board I saw in a quarter of a million options.** Not nine stations of clutter. 1a's "two marks per neighbour is the busiest of the three" is true in the abstract and worth roughly two extra marks on screen in practice. That objection does not survive contact with a board, and with it goes the only real argument for 1b.

Under the pointer, the ceiling is three changed stations, so six marks at absolute worst and two normally. This also means the half state and the full state differ by almost nothing in load, which matters for point 3.

## 2. The blind spot: the take does not always happen next door

| | fresh | awake |
|---|---|---|
| changing placements that reach **beyond an immediate neighbour** | **2.6%** | **6.2%** |
| worst nights | m8 the gap · m10 the throne · m23 the drum · m22 · m4 | m10 · m27 · m7 · m8 · m12 the turning |

1a's whole vocabulary is anchored to the touching face: a lit edge on the face that would be compared, and an arrow across that join. On a station two or more away there **is no touching face with the card you are holding**, so 1a cannot draw its mark there at all. It is not that the mark would be wrong; it is that the grammar has no word for it.

That is one changing placement in forty on fresh, one in sixteen on awake, and it fails hardest on exactly the nights whose character *is* reach: the goat's gap, the throne, the turning, the drum. Those nights would silently show less than the truth.

**The correction, and it is small.** The sheet's own safeguard is "the preview must be computed by the same code that resolves the strike, so it can never promise a take the board then refuses." That prevents a false promise. It does not prevent a missing one, because the safeguard is about *which comparison* runs, and the gap is about *where the answer is drawn*. Restate the rule as:

> **Every station whose ownership changes gets the mark. Where the change came from a face touching the previewed station, it also gets the lit edge and the arrow.**

One rule, honest at every distance, no new vocabulary: the distant station simply lights in the ownership colour it is about to become, which is a language we shipped this morning. 1b is not rejected so much as demoted to the four per cent of cases that are its actual job, and 1a keeps the 96 per cent where its teaching works.

## 3. Hold the amber arrow back

| | fresh | awake |
|---|---|---|
| placements that **lose** you a station you already held | **0.00%**, all 28 nights | 0.03% mean, 0.08% worst night |
| nights where it is reachable at all | **0 of 28** | 16 of 28 |

"Both can be true at once, that is the trade" is the sheet's most attractive sentence and it describes something a new player **will never see**. The back-take needs a counter-strike source, and on the shipped calendar there is no sting, no answer and no haunted station: the only route is the follower signature, which is asleep on a fresh collection. On a developed one it fires about once in three thousand placements.

Teaching a two-arrow language where the second arrow never appears is a cost with no return, and it is also a small lie about what the board can do. **Ship the cream arrow alone.** If the back-take is worth showing at all, it is covered for free by the corrected rule in section 2, because a station of yours turning hers is a station whose ownership changes, and it lights the same way. No second arrow to teach, and it is truthful on the sixteen nights where it can happen.

## 4. On 1c, and the number that is not 11

1c is the right second pass and should stay second, but the phone argument in its favour is the reverse of what the sheet assumes. Our stage is 932 by 430, which is an iPhone Pro Max landscape at scale **1.0** exactly. The scale on smaller phones is not "half":

| device (landscape) | stage scale | a 9px number renders at |
|---|---|---|
| iPhone Pro Max | 1.00 | 9.0 px |
| iPhone 14 / 15 | 0.91 | 8.2 px |
| iPhone SE | 0.72 | **6.5 px** |

So the phone pass is gentler than feared for 1a's edge and arrow, and still fatal for 1c alone at the small end. Also: the card corner numbers are authored at **9px, not 11px** — I measured them on staging this morning. 1c's tell is two pixels smaller than the sheet believes it is, which is the difference between marginal and unreadable on an SE. Keep 1c as the pointer-state refinement it is described as, never as the sole tell, and if it ships, the corner numbers want a point or two.

## 5. What I owe this, so it can never lie

The sheet's strongest line is that all three options need the same thing from the build. I will make that mechanical rather than a promise:

**A preview/resolve agreement case in the conformance pack.** For a set of standing boards across all 28 nights, assert that the set of stations the preview marks is *exactly* the set of stations whose ownership differs after the real placement — no station promised that the board then refuses, and no station changed that the preview did not mark. That closes both directions, and it is the only test that keeps the feature honest once laws and signatures start composing. I will add it alongside the 27 existing cases and hand Code the fixtures with it.

## 6. The summary

- **1a**, with its rule restated as *every station that changes, plus the edge and arrow where a face touches*.
- **Cream arrow only.** The amber back-arrow is unreachable for a new player and worth one placement in three thousand for a developed one; the corrected rule covers it without a second word to teach.
- **1c second**, as the sheet says, and not on its own at phone scale. Corner numbers want to grow from 9px first.
- **1b not needed as an option**, because its one measured advantage was the half-strength load and that load is two marks.
- Density is a non-issue: the preview is empty 92% of the time.

### Files

`research/preview.js` (the reach runner), `pv_f_[ab].out`, `pv_a_[ab].out`, `research/v2.js`, `research/laws.js`, `research/THE-PREMIUM-GAP-17SEP.md` (item 1, which this answers), `research/THE-TEXT-CENSUS-17SEP.md` (the 9px measurement).
