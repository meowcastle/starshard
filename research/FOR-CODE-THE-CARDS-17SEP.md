# For Code: restructuring the between-board cards so a fact can only be said once

**17 September 2026. Measurement → Code (cc Design).** What to build under the road's interstitial cards, in the same shape as the settle record of 15 Sep. `THE-ROAD-TEXT-17SEP.md` is the evidence; this is the build. Standing rule holds: Code owns the engine and the runtime, Design owns the `.dc.html` surfaces and every string. **Nothing below asks Code to write or cut copy.** It asks for the structure that makes the cuts possible and stops them growing back.

**The diagnosis in one line.** A card today is a bag of independently authored strings rendered beside independently authored pictures, so no single place owns a fact, and the same fact gets stated two or three times. On the wipe card, "your lights are restored" is said by a sentence, by three moon glyphs, and by a second sentence; "you are back at the first walker" is said four times. Of 64 words, about 45 repeat something already on screen.

The fix is not shorter strings. It is **one owner per fact**, enforced by the runtime.

---

## 1. The card record

One object per interstitial, emitted with the moment, the same way `state.settle` is emitted at the end of a board. Every fact appears **exactly once**, typed, with no prose in it at all.

```js
state.card = {
  kind: "walker.first" | "walker.return" | "board.won" | "board.lost"
      | "rung.won"     | "rung.lost"     | "climb.wiped" | "climb.cleared",

  score:    { you: 6, sky: 6, reason: "level" } | null,   // reason as in settle.reason
  lights:   { standing: 1, cap: 3, lost: true },          // the fact, not a sentence
  rungs:    { index: 0, total: 9, taken: 0 },             // ditto
  walker:   { id:"merit", name:"merit", them:"them" },
  opponent: { handicap: 0.75, caution: 2, awake: true },  // the dials, as numbers
  night:    { key: "naidhana", name: "the death-like night" },
  next:     { walker: {...}|null, leads: "you"|"sky" }
}
```

Nothing here is a string the player sees. Design's copy table turns the typed fields into the one line each card is allowed.

**Invariants to assert in the module**, so the record cannot drift from the board: `lights.standing + (lights.lost?1:0) <= lights.cap`; `rungs.taken <= rungs.index`; `score` non-null for every `board.*` and `rung.*` kind and null for `walker.*`; `kind === "climb.wiped"` implies `lights.standing === 0`.

## 2. The channel registry: the part that actually fixes it

Each fact gets **one channel**, declared once, and the runtime refuses to render it twice.

| fact | channel | never in copy |
|---|---|---|
| `lights` | the moon glyph row | "light", "lights", "lit", "sliver", "dark" as a light-count |
| `rungs` | the diamond row | "rung", "nothing had been taken", "first walker" as a position |
| `score` | the one score line | — (this *is* its channel) |
| `opponent` | a fixed mark beside the walker | "awake", "every card", "gives nothing away twice" |
| `walker` | the walker's own line | the walker's name more than once per card |
| `night.key` | a label under the title | the appositive form ("naidhana, the death-like night:") |

**Build it as a dev-mode assertion, not a doc.** At render, for each copy string the card resolves, test it against the forbidden-token list for every channel already present on that card, and throw in dev / warn once in production with the key name. That single check is what stops this returning after the next copy pass, and it is about thirty lines.

I will supply the token list as a data file with the conformance pack so it is versioned rather than pasted.

## 3. The card budget

A small config Design owns, in the same file as `stage.timing`:

```js
stage.cardBudget = { blocks: 4, sizes: 3, words: 24 }   // per interstitial
```

The runtime counts the text blocks, distinct font sizes and words it actually rendered, and warns in dev when a card exceeds its budget. Measured today: the wipe card is **8 blocks, 5 sizes, 64 words**; the loss card **6 / 5 / 54**; the walker's first meeting **3 / 3 / 32**. The budget makes the regression visible on the day it happens instead of two months later.

## 4. The walker fields

The sheet's `in` field currently carries three jobs in one paragraph: an image, an authorial gloss, and a rules clause. 64% are two or more sentences; 24% have a mechanical clause welded on, in 20 wordings of the same few dials, and `"the hand is yours, every card of it awake."` appears **26 times verbatim**.

Code's part is only this:

- **Read `walker.in` as one line.** Take the first sentence and stop, or better, take the field as Design will re-author it: one line, no gloss. Do not concatenate fields.
- **Stop sourcing the dials from prose.** `opponent.handicap`, `opponent.caution` and `opponent.awake` come from the roster record, not from a sentence in `in`. Once they are on the record, the rules clauses in the copy become dead text that Design can delete without changing behaviour. **This ordering matters: the record lands first, the copy pass follows, and nothing breaks in between.**
- **Add `walker.hint`**, fed from those same dials, so the `tell` can finally do the job the sheet documents for it ("a hint at how the mirror plays this rung"). Today **none of the 216 tells carry any play information**. The hint is Design's to word; the data has to exist first.

## 5. Point the table at the road's cards

The road renders the itemised settle correctly today:

```
stations   four against five
dominion   one against none
dawn       even, one each
──────────────────────────
total       six against six
```

The table mode renders none of it, and has no verdict beat at all: it goes `settle → play → deal` with no `verdict` and no `road` moment, and `state.verdict` is absent there. This is a mode gap, not a missing feature. **Point the table at the same component and the same record.** This also supersedes item 2 of `FOR-CODE-THE-FLOW-15SEP.md`: the machine exists, it is wired on one path only.

## 6. One runtime bug, still open

Clicking an occupied station while holding a card does nothing and says nothing. Same finding as `THE-CLUNK-17SEP.md`, still reproducible on the road today. Either the click does something or it refuses visibly; silence reads as a dropped input.

## 7. Order, and who is blocked on whom

1. **The card record (§1)** — nothing else can be built on top of it, and it is the same shape as `settle`, which already works.
2. **The dials onto the record (§4)** — unblocks Design's copy pass. Until this lands, deleting the rules clauses would delete behaviour.
3. **The channel registry (§2)** — lands with or just after the copy pass, so the new strings are checked from the first day.
4. **The table pointed at the road's component (§5)** — independent, half a day, and it is the largest felt change for a table player.
5. **The card budget (§3)** and **the click fix (§6)** — small, any time.

Design is blocked on 2. Nothing is blocked on 3, 4, 5 or 6.

**What Measurement does in parallel.** The forbidden-token data file for §2; card-budget expectations added to the conformance pack so `conform-code.js` checks blocks, sizes and words per kind; and a structural pass across houses confirming every night renders the same card kinds, which is the check that this refactor has to preserve.

### Files

`research/THE-ROAD-TEXT-17SEP.md` (the census and the verbatim cards), `research/THE-TEXT-CENSUS-17SEP.md` (the method), `research/FOR-CODE-THE-FLOW-15SEP.md` (item 2, superseded by §5), `research/THE-CLUNK-17SEP.md` (§6), the walker sheet of 15 Sep.
