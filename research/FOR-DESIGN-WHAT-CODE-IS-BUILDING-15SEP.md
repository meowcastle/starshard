# For Design: what Code is building underneath, and what it lets you do

**15 September 2026. Measurement → Design (cc Code).** The two notes you have (`THE-FLOW-14SEP.md` on what the screens should say, `THE-MENUS-15SEP.md` on how they should move) both need things under the surface that do not exist yet. `FOR-CODE-THE-FLOW-15SEP.md` asks Code to build them. This note explains, in your terms, what each of those things is, why you cannot build the surface without it, what it hands you when it lands, and what you can start on today without waiting.

The one-sentence version: **Code is turning the game's state from "a number and a phase" into "a record of what happened and a named moment", so that every surface you design reads a fact instead of guessing one.**

---

## 1. The settle record: the arithmetic behind the scales

**What it is.** When a board ends, the engine will write out exactly how it counted: stations for each side, the dominion point, every dawn pairing with both cards and who took it, any law that touched the count, the total, whether it was level, and one word for what decided it (`stations`, `dominion`, `dawn`, `law`, `level`).

**Why you need it.** Today the surface receives the total and nothing else, which is why the scales can show 6 against 7 on a road you held five to four and no caption is possible. There is no way to write "her held pair outweighed yours at dawn" if the surface does not know there was a pair.

**What it hands you.** The four captions for the settle moment, ready to place on the scales in order and leave on screen:

> stations · five against four
> dominion · one each
> dawn · her pair outweighs yours, two to her
> six against seven. hult takes the board.

And the dawn reveal as data: the held cards on both sides, sorted strongest first, paired left to right, with a line per pair. You lay them on the hand shelf and animate the pairing; the record tells you which card meets which and who took it. The `reason` word is what picks the loss line on the verdict card.

**What you can do now.** Design the settle moment against the four-line shape above and the pairing layout on the shelf. The content will arrive in that shape.

## 2. The verdict record and the five moments

**What it is.** One object that describes the largest thing that just ended (a board, a series, a rung, the climb), with the score, the series standing, the rung, the lights, the walker's four lines, and who is next and who leads. Alongside it, the game gets five named moments it walks through in order: `deal → play → settle → verdict → road`, and it tells the surface each time the moment changes.

**Why you need it.** Today the win card, the loss card, the between-boards card and the rung card are four surfaces each reading whatever bit of state it happens to know about, which is why the loss card has no score, the series pips have no legend, and "hult leads, one to none" appeared only as a ghost behind the board. There is no single place that knows all of it.

**What it hands you.** One verdict card, designed once, whose first line and button change with `kind`:

- board (in a series): "hult takes the first. one board each and the third decides." · *the next board*
- rung won: "tamsin steps aside. tamsin banks the fire and lets you past it." · *on up the road*
- rung lost: "the night rests. six against seven: her held pair outweighed yours at dawn. two lights stand. hult is where you left him." · *deal again*
- climb cleared or ended: the mansion's line and the codex's record.

And five surfaces, one per moment, each with one job (`THE-FLOW` section 3). You key everything off the moment name; nothing off the old `phase` values.

**Timing is yours.** Code builds the machine; the length of each moment's ceremony comes from a small table you own (`stage.timing`). Settle 2400 ms, road 900 ms, verdict until tapped are the defaults; change them in your file, not theirs.

**What you can do now.** Build the verdict card as one layout with four variants. Draft the timing table.

## 3. A possible dawn count error

On one board the count did something I could not reproduce by hand (5 to 4 on the road, 6 to 7 on the scales). It may be legal (it depends on one card I could not read) or it may be the client scoring a tie for the sky. Code will run the existing dawn fixtures through the live client path and say. Nothing for you to do; noting it because if the reveal ever shows a pairing that looks even and the pans still move, that is this, not your layout.

## 4. Tonight's law and the ground, as separate facts

**What it is.** Two new things on the state: `tonight` (the night, the house, the law's key and its one-line sentence, and which station carries the marker) and, for each of the nine stations, its house, its quadrant, whether the ground holds, and the quadrant's one-line rule. No law text on any station except the one carrying tonight's marker.

**Why you need it.** The station hover today shows the station's own law ("mansion 9 … strikes two lower from here") on every night, which is wrong on twenty-seven nights out of twenty-eight, because the surface only has a per-house string to read. There is no "tonight's law" in the state at all.

**What it hands you.** The line under the scene name at the deal ("tonight: the price. a card at the middle that cannot be taken strikes two lower."), the same line on the marker's hover, and a clean ground-only hover for every station ("the glance · vermilion bird ground · the ground holds").

**What you can do now.** The hover and the deal line can be designed now against those three strings. The law sentences themselves are copy, and copy is yours (item 6).

## 5. Her cards get names; ownership becomes data

**What it is.** Every card on the road, hers included, will carry its name, home house and quadrant in the state. Today the sky's cards are nameless because their ids (201 to 228) miss a lookup that only knows 1 to 28.

**What it hands you.** Names on both sides of the road, and the freedom to move ownership from the border colour to something with shape (the bar under the card, her lamp glyph in the corner) because the surface will know `owner` and `name` for every slot without guessing.

## 6. The copy table: every sentence in one file you own

**What it is.** All of the game's sentences move out of the runtime into one object keyed by moment and reason, with placeholders (`{walker}`, `{you}`, `{sky}`, `{rung}`, `{lights}`, `{series}`, `{next}`). Code does the substitution; you write the strings.

**Why it matters.** This is what lets you replace the tārābala lines, the letterspaced caps, "ONE OF EIGHT DOWN", "0 of 28 houses walked", "spread 30" and the em dashes without a Code cycle, and it is what makes the copy table in `THE-FLOW` section 4 a thing you can paste rather than a thing you request.

**What you can do now.** Write the table. Every "proposed" cell in `THE-FLOW` section 4 is a row; the placeholders above are the only variables you need.

## 7. The runtime fixes that the menus note depends on

These are small and they are Code's; you will feel them before you see any new design.

- **No more black frame.** Sub-screens currently pass through black and fade up over three to five seconds. Code lays the destination out first and crossfades in 250 to 350 ms. This is the largest change in feel for the smallest diff, and it is likely the first thing to land.
- **No stale text.** The previous scene name, walker name and hand will be gone before the next moment's text draws; no more "the low air" over "the daylit ground".
- **Nothing clickable during a ceremony.** "on up the road" will not be live until the verdict card has arrived, so nobody skips it by accident.
- **Tooltips behave.** A short delay before they appear, gone on any tap, and never over a control. Where they sit is yours.
- **The level-select scene fills the frame** on every house, not only the moon's.
- **A camera hook: `stage.look(target)`.** One call that pans and scales the lobby scene to a named place (`road`, `hand`, `ring`, `fence`, `sky`) over a duration you set. This is what `THE-MENUS` 2.2 and 2.5 are built on: you attach each menu to a look instead of a cut, and later you put each menu in its place in the scene, and the camera is already there.

**What you can do now, with no dependency at all:** hover and press states on everything tappable (`THE-MENUS` 2.4), the staggered arrival of each menu's contents (2.3), the ordering of the rung change (`THE-FLOW` 2.I), and the scrim rule (any sentence in the middle of the screen dims the board first). All of it is in your file.

## The order, and what to do while waiting

Code goes: settle and verdict first (1 and 2), then the dawn check (3), then tonight's law and the names (4 and 5), the copy table (6), and the runtime fixes (7) as they fit, with the black frame first if there is a spare hour.

You can start today on: the verdict card in four variants, the settle moment's four captions and the pairing shelf, the timing table, the copy table, the hover and press states, the stagger, the scrim rule and the rung-change order. None of those need anything from Code. The moment 1 and 2 land, the surfaces you have drawn get wired to the records; the moment 4 and 6 land, the words are yours to change without asking.

The rule between the two of you stays: Code edits the engine and the runtime, you edit the surfaces, and the copy table and the timing table are yours. Measurement adds the settle expectations to the conformance pack today and checks the live path when it is exposed.

### Files

`research/FOR-CODE-THE-FLOW-15SEP.md` (the same seven items, in Code's terms, with the record shapes), `research/THE-FLOW-14SEP.md`, `research/THE-MENUS-15SEP.md`, `research/MANZIL-HOW-TO-PLAY-AND-GLOSSARY-14SEP.md` (the vocabulary the copy table should use).
