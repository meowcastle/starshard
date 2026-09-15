# The deployed copy, read: the conformance pack against your module, two real divergences, one old one

**14 September 2026. For Code (cc Design).** The 13 Sep folder, read as promised: the pack run
against `manzil-engine-current.cjs` through a thin adapter (`research/conform-code.js`, yours to
keep and run), the maps checked against the decided calendar, and the client's planet guards
checked against the boss hand. **The maps are right. The module has two divergences from the
reference, one of them serious, and the client still has the September 3 one.**

---

## 1. The pack against your module: 21 of 23, one skipped

Adapter: each case sets `LAW_AT[night] = {kind, station}` for its duration, builds the deck with
`cards({levels})` + `ladderOpponentCards` (the mirror, ids 201..228), seeds slots with `by` set to
the owner, and drives strikes through `resolve` (your module has no bare strike; re-lodging the
striker is the honest equivalent and it passed on every case that does not chain). Counts through
`counts`, faces through `faceOf`. The posts case is skipped: the posts never shipped.

| result | cases |
|---|---|
| **pass** | beat, shell ×2, reach ×2 (printed faces at range hold), toll ×3 (the shield test agrees with the strike path), crow (perch alone), price ×3 (the station's, not the card's), guest ×2, plant (slid window, takeable once, rooted after), turn, hush, stranger ×2 (both rows), razor ×2 |
| **FAIL** | **crow: a point moves from the richer neighbour to the crossing** — counts 2,1; the neighbour is never charged |
| **FAIL** | **reson: carries one further, once only** — the module carries twice |
| skip | post (unshipped) |

### The serious one: `isQuarterless(id) { return id >= 101 }` swallows the mirror deck

The mirror's cards are ids **201..228**. `id >= 101` calls every one of them a planet. Five sites
read it, and every one of them is a law clause that is now **one-sided against the player on
every walker board that goes through the module**:

| line | clause | what happens to a sky mirror card |
|---|---|---|
| 444 | `shielded()`: planets are unmeasured, return false | **no sky card is ever sheltered**: the toll never charges her, the price never softens her, the open gate has nothing to pierce on her side |
| 456 | `crowPays()`: skip quarterless neighbours | **the crow never charges her neighbour**; only the player's pays |
| 490 | open gate: `!isQuarterless(t.id)` | her card at the open station keeps every deny |
| 737 | crow perch guard | her card at the perch switches the crow off |
| 745 | stranger: `!isQuarterless(s.id)` | **her tortoise card on tiger ground never counts one more** |

The self-check at 2320 tests 101, 107, 108, 109, 28 and 1, and never a 2xx. That is why it is
green. The pack caught it on the first case with a sky neighbour.

**Fix:** `function isQuarterless(id) { return id >= 101 && id <= 109; }` (or `< 200`), and add
`!E.isQuarterless(201) && !E.isQuarterless(228)` to the self-check. One line, and every
measurement the module has produced with the mirror deck since the 108/109 fix landed has the
laws above running for one side only; anything read off `playMatch`/`playPush` in that window
should be re-read.

### The second: the drum carries twice when the origin is the law station

Line 697: `if (law.kind === "reson" && (to === law.station || from === law.station))` queues a
further hop. The queued hop is tagged `reson: true` and then runs through the same clause, and
its `from` **is** the law station, so it queues a further hop again. On the pack's board (a
strike into the station, victims at 3 and 4) the module takes both; the reference takes one.
Your own comment says "not recursive"; the code is.

**Fix:** carry the tag in and check it: the clause runs only when the strike being resolved is
not itself a reson hop. The flag already exists on the queue entry; it just is not read.

## 2. The maps: right, and ahead of the decision note

`LAW_AT` and `_lawSt` agree with each other and with the calendar at every entry, 0-based, and
each resolves to the mansion the row was measured on. Three folds are already in that the 13 Sep
decision note had as waiting: **m6 the eye, m15 the hush, m24 the void**, with `BOARD_OFF` /
`_boardOff` carrying 6, 15 and 24 at four. The void's clause stacks with the void card's own
signature, as the reference does. **Nothing on the map is a station off.** The nine new houses
are correctly lawless; m20 and m22 correctly carry no offset yet.

The eye's entry is the defender form (`a.owner === g.leader` refuses the tie; the answerer's
takes), which is the measured one. Confirmed.

## 3. The client: the September 3 finding is still open

The boss hand in the client is `[101, 102, 103, 104, 105, 108, 109]`. **All seven client planet
guards still read `id >= 101 && id <= 107`**, and `_quad(m)` still ends in a byakko catch-all. So
108 and 109 are tiger cards on the boss board, untakeable under the byakko grant, at seven sites.
The module fixed its half of this on 3 Sep (`quadOf` returns null, `isQuarterless` at the sites
above); the client half was never ported. The client-side fix is the same shape as the module's
should be: `id >= 101 && id <= 109` at the seven sites, and `_quad` returning null above 100.

## 4. For the record

- `research/conform-code.js` runs the pack against your module in under a second. It belongs in
  your check suite beside the self-checks; it is the test that would have caught both of the
  above on the day they were written.
- The reference (`research/v2.js`) has its own fix from 13 Sep, disclosed in the nine-laws memo:
  the return's delayed strike leaked from the search into real play. Your module's `reArm` runs
  in `resolve` on real placements only and does not have this problem.

### Files

`research/conform-code.js` (the adapter and runner), `research/conformance.json` (the pack, 24
cases), the module and client as delivered in `Starshard Code to Design Sep 13.zip`.
