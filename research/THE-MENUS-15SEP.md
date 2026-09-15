# The menus: from panels to places

**15 September 2026. Measurement → Design (cc Code).** A companion to `THE-FLOW-14SEP.md`. That note was about what the game says; this one is about how the screens move. The user's read after the playthrough was that every menu and every transition "feels like a box with text, not an interactive experience", and that is exactly what the playthrough shows. This note says why, and lists the fixes in order of cost, with a timing number and a reference game beside each so nothing here is taste.

One caveat up front: the research we did last week was on the loop and the rules (komi, the first-player seat, what a loss should give back), not on menus. The references below are the games we already cited in MANZIL-LOOP, read for their surfaces rather than their rules. The timing figures are the standard ones from interface research and animation practice, not from our own measurement.

---

## 1. Why it feels stiff

Watch any menu open on staging and the same four things happen. The world stops. The frame goes to black. Text appears complete, at a fixed position, three to five seconds later. The world resumes behind it as a dimmed backdrop. Every screen (cards, star shard, ledger, codex, level select, the rung title, the loss card) is the same shape: a panel laid over a paused scene.

The games that feel alive do the opposite on all four counts. The world never stops. There is never a black frame. Things arrive one at a time from where they live. And the "menu" is a part of the scene the camera turns to look at. Inscryption never leaves the table: you look up at the opponent, down at the cards, sideways at the candles. Hades opens the codex as a book on a desk you walk to. Balatro's shop is the same table with different cards on it. Slay the Spire's map is a scroll you unroll over the road you are on.

The good news is that Star Shard already has the scene. The lobby is a road, a fence, a sky with the moon and its two companions, a ring of twenty-eight houses, a walker at the gate. Every menu already has a home in it. Nothing below needs new art; it needs the camera to move instead of cutting, and the contents to arrive instead of appearing.

## 2. The fixes, cheapest first

### 2.1 Kill the black frame (an afternoon)

The single biggest win. Every screen change currently passes through a fully black frame and then fades up over three to five seconds; the star shard even paints its text over the lobby first and re-lays. Remove the black entirely: the new screen's content should be in the tree and laid out before the old one starts to leave, and the crossfade between them should be short.

**Timing:** 250 to 350 ms for the whole change. The reason for the number: an action that completes within about 400 ms is read as continuous by the person who caused it; over that, it reads as waiting (the Doherty threshold, 1982, and every modern platform guideline since; Material and Apple both put screen transitions at 200 to 400 ms). Three to five seconds is ten times too slow and is most of what "stiff" means.

**Reference:** Balatro. Nothing in it ever goes to black; the shop, the pack, the run summary are all the same table re-dressed in well under half a second.

### 2.2 Pan, tilt or zoom; never cut (a day)

Once the black frame is gone, replace each remaining crossfade with a movement of the scene you already have. The altitude climb between rungs (the dot moving, the scene name changing, the ground line rising) is the one transition in the game that already works this way, and it is the one that feels right. Make every other change the same kind of thing.

A suggested camera for each menu, using what is already on screen:

| menu | where it lives in the scene | the move |
|---|---|---|
| cards | your hand, at the bottom edge | the camera tilts down; the seven fan up from the bottom into the collection grid |
| codex | the ring of houses, in the sky | the camera tilts up; the moon's companions spread into the ring you already draw on level select |
| level select | the same ring | same tilt; the codex and level select are one place seen twice, and should be one screen with two modes |
| ledger | the fence posts along the road | the camera pans along the fence; the record hangs on the posts (boards won and lost as marks on the rail) |
| star shard | your own sky | the camera looks past the moon; the reading is behind it, not in front of it |
| the loss card | the road itself | no camera move; the board dims to a fifth and the walker steps forward |
| the rung title | the climb | already right: the dot moves, the sky clears, the walker steps in |

**Timing:** the move itself 300 to 400 ms with an ease-out (fast start, soft landing), never linear. The content is already there when the move lands; it does not fade in afterwards.

**Reference:** Inscryption for the head-turn; Slay the Spire for the map that unrolls over the road rather than replacing it.

### 2.3 Stagger the arrival (a day)

Text on every menu currently pops in complete. The eye reads a complete block as a document. Let things arrive in order, a beat apart, from the place they belong: the title first, the lines after it, a card sliding in from the edge it lives on, a number counting up from zero.

Concretely: the ledger's "20 · 14" should count, the way the scales already do. The codex ring should light around to tonight's house rather than appear lit. The cards in the collection should deal into the grid, top row first, a few frames apart. On the "steps aside" card the walker should actually step aside (a 300 ms slide, then the next walker's name arrives). The lantern moons on the loss card should go dark one at a time, with the dark one going last.

**Timing:** 40 to 80 ms between siblings, so a row of seven cards takes under half a second to land; each element's own move 200 to 300 ms; every move has a little overshoot and settle (the animation principles of anticipation, follow-through and ease apply to a card landing on a shelf exactly as they do to a character). Never more than about 600 ms before a screen is fully usable, or it becomes a thing the player waits through on the tenth visit. Ceremony scales inversely with frequency: the codex, opened rarely, can take its 600 ms; the cards screen, opened often, should be under 400.

**Reference:** Hades' boon and codex screens, Balatro's score count. Both are numbers and lines that arrive, not appear.

### 2.4 Respond before the click (half a day)

Nothing on the menu row or the sub-screens responds to hover. A control that does nothing until it is pressed reads as a label. A slight lift (2 to 4 px), a brighten, and a 100 ms ease on hover, plus a press-down on click, is the cheapest signal that a thing is a thing. Same for the ring's marks, the collection's cards, the rung platforms on the lobby road.

**Timing:** hover response under 100 ms (the threshold for "instant"); the lift itself 120 to 150 ms.

### 2.5 Make the menus places (a week; the one that changes what it is)

Everything above makes the panels move well. This one removes the panels. Each menu becomes the part of the scene the table in 2.2 names, drawn in the scene's own perspective, so there is no "menu" at all: there is the road, and you look at different parts of it. The menu row at the bottom becomes unnecessary once each place has a mark in the scene you can tap (the hand, the moon, the fence, the gate); keep the row as a fallback under the player's name, but the scene is the menu.

This is also where the lobby stops being empty. The rungs you have climbed are lit on the road; the lights stand as moons beside it; the standing sentence from the codex ("the fifth rung. two lights stand. hult leads, one to none.") sits under the title. A player who opens the game sees where they are without opening anything.

**Reference:** Inscryption's cabin and Hades' House are the two clearest cases of a menu that is a room. Neither has a menu screen in the ordinary sense; both are easier to navigate than any menu screen.

### 2.6 Sound (in parallel, whenever audio starts)

There is none. A menu with no sound will always feel like a document, whatever it does visually. The minimum: one soft tick when a card is touched, one tone when the camera moves, one low note when the scales settle, one for a light going out. Four sounds cover every transition in the game. The walkers' bubbles should not be voiced; the tick is enough.

## 3. The order for Design

1. Remove every black frame and bring all screen changes under 350 ms (2.1).
2. Hover and press states on every tappable thing (2.4).
3. Camera moves in place of crossfades, per the table (2.2).
4. Staggered arrival on every menu and every card (2.3).
5. Menus as places; the lobby shows the standing (2.5).
6. Four sounds (2.6).

Items 1 to 4 are a few days and can ship separately. Item 5 is the one that turns the site into a game, and it should be designed as a whole before any of it is built, because it decides where every mark in the scene lives.

## 4. The rules, in one place

For the principles doc, if you want to fold them in:

- No transition passes through black.
- A screen change is a movement of the scene, 250 to 400 ms, eased out, with the destination already laid out.
- Things arrive from where they live, 40 to 80 ms apart, and settle with a small overshoot.
- Nothing takes more than 600 ms to become usable; frequent screens under 400.
- Every tappable thing responds within 100 ms of hover.
- Every menu is a part of the scene; the row at the bottom is the fallback, not the way in.
- Frequency decides ceremony: the rarer the moment, the longer it may take.

## 5. For Code

The camera moves in 2.2 assume the lobby scene is one drawing that can be translated and scaled as a unit; if the sub-screens are separate layouts stacked over it, the cheap version is to keep them stacked but transform the lobby underneath in the same direction as the reveal (tilt down for cards, up for codex), so the eye reads one scene. The stagger in 2.3 is one transition-delay per sibling. The black frame in 2.1 is most likely an opacity fade on the whole app root rather than on the screen; worth checking before anything else, because that one change is most of the felt difference.

### Files

`research/THE-FLOW-14SEP.md` (the moments and the copy), `research/THE-FLOW-IN-PLAIN-ENGLISH-14SEP.md`. Reference games as cited in `MANZIL-LOOP.md`.
