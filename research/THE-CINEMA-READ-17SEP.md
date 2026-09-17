# The cinema read: what the trim landed, what it cut too far, and the one beat that is still a spreadsheet

**17 September 2026. Measurement → Design (cc Code).** Playthrough of updated staging, 17 Sep, m20 the flock, two full boards plus a tour of the hand, the codex and the ledger. Every visible text node counted at each beat, every screen change timed at 40 ms resolution, `state`, `stage.timing` and `window.manzil._copy` read live. Method and baseline: `THE-TEXT-CENSUS-17SEP.md`.

The short version: **the board got quiet, the transitions got fast, and the payoff got deleted.** The trim was aimed at clutter and it hit clutter. It also hit the ceremony, and the ceremony was the part that was supposed to become cinematic. The build is now elegant and slightly hollow. Everything needed to fix that is already in the client.

---

## 1. The count, then and now

| beat | 14 Sep | 17 Sep | sizes |
|---|---|---|---|
| lobby | 6 | 8 | 3 |
| the night is open | 9 | 9 | 5 |
| intro card | 3 | 5 | 2 |
| deal | 27 | **18** | 6 |
| board, 2 down | 28 | 21 | 4 |
| board, full | 37 | **31** | 4 |
| dawn (settle peak) | 41 | **40** | 4 |

Three real wins, measured:

- **Names are off the board and off the hand.** A placed card now shows two numbers and a home glyph and nothing else. That is the call from this morning, shipped, and it is the single biggest reason the board reads as a board instead of a table of records.
- **The home mark survived the cut.** `☉ ♂ ☿` are still there at the corner. Dominion stayed visible without costing eleven characters. This was the amendment and it landed correctly.
- **Times is gone.** Two families now, Karla 27 and Cormorant Garamond 2 at the deal. The fallback that was rendering on twenty elements is fixed.

And one that did not land: **the dawn shelf never got the memo.** At the settle peak the census finds `the throne`, `the empty district`, `mars`, `venus`, `mercury`, all at 9 px, on the held cards. Names came off the board and went straight back on at the one beat where nobody has a decision to make. 40 against 41 is not a trim.

## 2. The transitions are fixed, and they are now too fast to be transitions

The black frame is gone. Every screen change measured:

| from → to | root opacity floor | time to full content |
|---|---|---|
| lobby → your cards | 1.00 | 285 ms |
| lobby → the codex | 1.00 | 174 ms |
| lobby → the ledger | 1.00 | 148 ms |
| lobby → mode select | 1.00 | ~120 ms |

The root never dims. Three to five seconds of black became under three hundred milliseconds of nothing. That is the largest change in feel in the build and it cost the least.

But the content **arrives as a single block**. Your cards goes 4 elements to 46 in one 115 ms step. The codex goes 8 to 34 in one 125 ms step. Design's own table says `screen.stagger: 60` and nothing staggers. A page that snaps into existence complete reads as a document loading; a page whose parts arrive in order reads as a camera finding them. The deal already does this correctly (7 cards landing 120 ms apart over a second, and it is the best-feeling second in the game). The nav screens are asking for the same treatment and the number is already written down.

## 3. The settle beat: the scale is right, the words are missing, the verdict does not exist

**What is genuinely excellent.** The balance beam is the best thing in the build. Pans fill with pips, the beam tilts under the weight, `+1` floats up off the dominion cards. It is a physical object doing arithmetic in front of you. It is the answer to "text boxes feel weak" and it works. Keep it, protect it, build the rest of the game's ceremony out of the same material.

**What is missing, in order of how much it costs.**

**a. The four captions are written, timed, and never shown.** The copy table has them:

> `settle.stations` = "stations · {you} against {sky}"
> `settle.dominion.each` = "dominion · one each"
> `settle.dawn.sum.you` = "dawn · {n} to you"

Design's timing table has `settle.captions: 4` at `caption: 600`. The surface shows neither. The pans just count up. So the player sees the number change and never learns which of the five terms moved it. On the board I measured, the record was exact:

```
stations  3 : 6      dominion 0 : 0     cards 0 : 1
dawn      1 : 0      total    4 : 7     winner sky
```

Five terms. The scale showed one of them: the total. The other four are computed, correct, sitting on `state.settle`, and thrown away by the surface.

**b. There is no verdict.** `state.verdict` does not exist. `state.moment` does not exist either; it mirrors `phase`. The observed sequence is `deal → play → settle → play → deal`. There is no verdict moment and no road moment. What the player gets after the board is decided: "kito wins" for about 1.5 seconds, and then the next deal. No score, no reason, no walker, no lights. The pip in the top-right corner is the entire record that a board happened.

`stage.timing.verdict` is fully specified in the client (`dim: 250`, `arrive: 350`, `buttonLive: 550`, `hold: "until tapped"`, `moonsOut: 350`). Design wrote a ceremony. The runtime does not run it. This is item 2 of the Code handoff and it is the only item of the seven that did not ship.

**c. The one line that is shown is unreadable.** "kito wins" renders at the bottom centre with its reason line underneath, and the reason line draws *behind the scale's legs and the ostrich art*. I could not read it from a screenshot. The single sentence that says why you lost is occluded by scenery.

**d. Total elapsed: 6.2 seconds** from the last card landing to the next deal, of which about 1.5 s is the result. For comparison the player spent 85 seconds playing the board. The ratio is wrong in the direction nobody expected: the game now spends less time on the outcome than on the shuffle.

## 4. Six things that are not the big finding but are on screen

1. **Ownership is hard to read.** Both sides' cards carry the same gold border once placed. The only tell is a small bar under the card, and hers and mine differ by about two shades. On a nine-card road that is the first thing the eye should resolve and currently it is the last.
2. **The floating "claimed by" line collides with the cards.** It draws at y 268 while the card tops sit at y 267. On three of my four placements it overlapped the art.
3. **Copy inconsistency in that same line:** "claimed by the chamber", "claimed by the claws", "claimed by the gathered stars", but "claimed by moon" and "claimed by sun". Two rows are missing their article.
4. **The codex clips.** The right panel overflows the stage and cuts mid-sentence at "ITS HOURS · claimed, the table is yours". Content is taller than 430.
5. **Letterspaced caps survive on the codex** ("THE CODEX · 28 OF 28 HOUSES WALKED", "ITS CARD", "ITS LAW"). There is still no `text-transform` in the app, so these are literal strings, which means the codex is not reading the copy table either. Same tell as the dawn shelf: the rendered header is "dawn · the held cards" while the table says "dawn: the held cards".
6. **The house name is still the loudest thing on the play surface.** "the flock" at 21 px, above "play these seven" at 17 px, on a screen where it has not changed all night and is also printed on the lobby, the level select and the codex. Type sizes are 4 on the board but 6 at the deal. The three-size ramp did not ship.

## 5. What cinematic means here, and what timeless means, and why they are the same instruction

Cinematic is not more motion. It is **one thing happening at a time, with the frame pointed at it.** The deal already does this: seven cards, one after another, nothing else moving. The settle scale does it too. Every place the build still feels flat is a place where several things arrive at once and none of them is favoured: the nav screens popping in complete, the settle showing a total with no terms, the verdict not existing so the beat has no close.

Timeless is what you get when the thing on screen is an **object and a number** rather than a label and a panel. A brass beam that tilts will look correct in ten years. A caption in a rounded box will not. The build already chose correctly twice (the beam, the ghost stations). The remaining text is the part that has not been converted yet, and the conversion is mostly deletion plus one promotion.

So the instruction is the same for both words: **fewer things on screen, each one larger, arriving in order, and the most important one last.**

## 6. What I would do, in order

1. **Build the verdict.** `state.verdict` and the five named moments (item 2 of `FOR-CODE-THE-FLOW-15SEP.md`). Everything else on this list is cosmetic; this one is the missing beat. Design's timings are already in the client waiting for it. **Code.**
2. **Render the four settle captions.** The strings are in the copy table, the record is on `state.settle`, the cadence is in `stage.timing`. This is wiring, not authoring, and it turns the scale from a number into an argument. **Design, once 1 lands; the data is already there today.**
3. **Move "kito wins" and its reason off the scenery**, and make the reason the largest text in its own beat. Right now it is the smallest and it is behind an ostrich. **Design.**
4. **Cut the dawn shelf's names and planet names.** Five held cards need their totals and nothing else. 40 goes to about 28 and the beat stops competing with itself. **Design.**
5. **Stagger the nav screens at the 60 ms already in the table.** One line of intent, applied to four screens, and every menu stops popping. **Design.**
6. **Give ownership a shape, not a shade.** The bar under the card is right in principle and two shades too subtle in practice. **Design.**
7. **Finish the type ramp to three sizes**, and demote the house name below the beat's own headline. **Design.**
8. **Fix the codex overflow and the "claimed by" collision and the two missing articles.** **Design, half an hour.**

Items 2, 4, 5, 6, 7 are all in files Design owns. Item 1 is Code's and blocks nothing else on this list.

### Files

`research/THE-TEXT-CENSUS-17SEP.md` (the baseline census and method), `research/FOR-CODE-THE-FLOW-15SEP.md` (items 1 and 2, still open), `research/THE-MENUS-15SEP.md` (the stagger and the look), `research/THE-CLUNK-17SEP.md` (the loop timings).
