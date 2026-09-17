# The text census: 41 pieces of text at seven sizes, and the one that decides the board is 9px

**17 September 2026. Measurement → Design.** Second pass on the user's note, from the right angle this
time: not the loop's shape but **the text sitting on the play surface**. I counted it rather than
described it. Every visible text node on screen, at every beat of a board, with its size and position.

The finding in one line: **more than half the text on the board is printed on the cards, none of it is
needed to make a move, and the one sentence that decides the board is the smallest thing on screen.**

---

## 1. The count

Every visible text element, measured live on the flock:

| beat | text elements | of which numbers | type sizes on screen |
|---|---|---|---|
| the lobby | **6** | 0 | 2 |
| "the night is open" | 9 | 0 | 3 |
| the intro card | 3 | 2 | 3 |
| the deal ("play these seven") | **27** | 14 | **6** |
| board, 2 cards down | 28 | 17 | 5 |
| board, 6 cards down | 34 | 21 | 5 |
| board full | 37 | 24 | 5 |
| **dawn** | **41** | 24 | **7** |

The lobby is six pieces of text and it is the calmest screen in the game. The board is thirty-seven and
dawn is forty-one. **That is the whole complaint, in numbers.**

Seven type sizes at the peak: 9, 10, 11, 16, 17, 21 and 38px. That is not a type ramp, it is a list of
sizes, and it is most of why the screen reads as cluttered rather than composed.

## 2. Where the 41 come from

The dawn beat, itemised:

| source | count | needed to make a move? |
|---|---|---|
| card corner numbers (2 per card, up to 16 cards) | **24** | **yes** - this is the game |
| card names printed on the face | **11** | no |
| planet names printed on the face ("jupiter", "mars", "saturn", "sun") | **4** | no |
| planet glyphs (☉ etc.) | 1-4 | no |
| the two scale totals (38px) | 2 | yes |
| a bare "=" at centre (17px) | 1 | no |
| the house header, the scene line, the walker's name | 3 | one of three |
| **the dawn result: "12 against 12 · even, nobody scores"** | **1, at 9px** | **yes, and it is the smallest thing on screen** |

**Twenty of the forty-one are card names, planet names and planet glyphs.** Half the text on the play
surface is printed on the cards and none of it is used to decide anything. A move is: compare my card's
facing number to the neighbour's facing number. That is the two corner numbers. Everything else on the
card face is identity, and identity is what the **art** is for, and the art is already distinct per card
and already tinted by quadrant.

Worse, the names physically collide with the art. On the board the name is drawn across the middle of
the card, over the glyph it is naming: "the void" sits across its own circle, "the hideaway" across its
own triangle. Both lose.

## 3. The inversion that makes it feel bloated

Look at the dawn beat again and rank by size:

- **38px:** two numbers on the scales
- **21px:** "the flock", the house name, which has not changed and will not change
- **17px:** an equals sign
- **16px:** "kito"
- **11px:** eleven card names and four planet names
- **10px:** "at the table tonight"
- **9px:** twenty-four card numbers **and the sentence that just decided the board**

The single most important line in the whole beat, the one that says why you won or lost, is set at the
same size as a card's corner value and parked off to the right of centre. Meanwhile the biggest words on
screen are the name of a house that cannot change and the word "kito".

Nothing here needs to be *added*. The hierarchy just needs to be inverted.

## 4. What I would cut

**On the card, on the board: numbers only.** Drop the name, the planet name and the planet glyph from
every card standing on the road. That is **19 of 41 elements gone in one change**, the art gets its own
space back, and nothing about making a move is lost. The name comes back on hover and in the zoom panel,
where a player who wants it is asking for it.

**On the card, in hand: the name on the selected card only.** Seven names in the hand is seven labels
you read once and then never again. One name, on the card you have picked up, is the same information at
a seventh of the cost.

**Off the board entirely:** the house header (it is on the lobby, the level select and the codex; the
board does not need to be told which house it is standing in), the equals sign, and either the scene
line or the walker's name, not both, at the top.

**The seat line** ("the last word is yours") earns its place, but it is 9px at 0.8 opacity, which is
where you put something you do not mean. Either it matters and it is legible, or it goes.

**The dawn result becomes the largest text in its own beat.** Centre, above the scales, at the size the
scale totals currently use. One line, and it stays until the next board.

**The type ramp: seven sizes to three.** One for card numbers, one for names and labels, one for the
count and the verdict. Nothing else.

## 5. The count after

| beat | now | after |
|---|---|---|
| the deal | 27 | **9** (seven numbers pairs collapse to numbers only, one name on the selected card, two controls) |
| board full | 37 | **20** (18 numbers + the seat line + the walker) |
| dawn | 41 | **23** (the same 20, plus the dawn line, plus the two totals) |

Same information available, a third of the marks on screen, and the important things are the big ones.

## 6. Two things I found while counting

**Three font families, and one of them is a fallback.** Karla on 761 elements, Cormorant Garamond on 26,
and **Times on 20**. The principles say two families. Times is a system serif, which means twenty
elements are asking for a font that is not loading and getting the browser's default instead. Worth
finding, because it will read as "slightly wrong" on every screen it touches without ever being
obviously broken.

**The caps lines are real capitals, not a CSS transform.** I checked for `text-transform` and there is
none anywhere in the build. So "SHE TURNS THE CARD SHE KEPT BACK" is literally typed that way in the
dawn binding, which means the dawn beat is still reading its old inline strings rather than the copy
table, where the same line is already written in lower case. Rebinding dawn to `COPY.settle.*` removes
the caps and shortens the lines in the same move.

## 7. In order

1. **Names, planet names and planet glyphs off the cards on the board.** One change, nineteen fewer
   elements, and the art gets its space.
2. **One name in the hand, on the selected card.**
3. **Invert the hierarchy at dawn**: the result line largest and centred, the house name off the board.
4. **Seven type sizes down to three.**
5. **Rebind dawn to the copy table**, which removes the capitals for free.
6. Find whatever is falling back to Times.

Nothing in this list adds a screen, a panel or a word. Every item is a subtraction, and together they
take the play surface from forty-one marks to about twenty.

### Files

Census taken live on staging, 17 Sep, m20 the flock, three boards. Companion:
`research/THE-CLUNK-17SEP.md` (the loop's shape and timings).
