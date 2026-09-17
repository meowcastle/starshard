# The clunk, measured: four text panels before the first card, twelve seconds after the last one

**17 September 2026. Measurement → Design (cc Code).** The user's read: the loop still feels clunky, the
text boxes between things feel weak next to a modern game, cut everything unnecessary, keep it elegant.
I played the flock (m20) five boards across two matches on staging and instrumented the build rather
than eyeballing it: every phase change, every tap, every turn, timed. The good news first: **the
walker-hand blocker is fixed and the road runs.** Card names are back on. So the loop can finally be
judged as a loop.

The clunk is real and it is two numbers.

**Launch to your first card: 5 taps, 4 full-screen text panels, 0 cards played.**

**Last card of a board to being able to act again: 12.8 seconds, in which the game tells you one thing
("kito wins").**

Everything below follows from those two.

---

## 1. The measurements

**Getting in.** Phase changes, with the tap that caused each:

| tap | what you get | what it is |
|---|---|---|
| — | "NIGHT 20 OF 28 / the moon enters the flock tonight." + 3 paragraphs + "touch the night" | a text panel |
| 1 | the lobby | **a place** |
| 2 | "the night is open" - two columns, moon road vs two hands, three lines of explanation each | a text panel |
| 3 | "match the sky for the flock" + one card + "click to sit down" | a text panel |
| 4 | "play these seven / shuffle once, take six" over a dimmed table | a text panel |
| 5 | the board | |

One of five screens is a place. Four are centred text on black.

**The end of a board**, timed from the last card leaving the hand:

| at | what happens |
|---|---|
| 0.0s | your last card lands |
| 1.7s | the scales appear, **1.7 seconds of nothing first** |
| 1.9-3.0s | the counters tick, ten steps, **silently** |
| 3.5s | the held cards fly to the centre of the screen, over the walker, over the board |
| 3.5-8.6s | **dawn, 5.1 seconds**, with two lines in letterspaced caps |
| 8.6-11.5s | **2.9 seconds of nothing** |
| 11.5s | "kito wins" fades in low-contrast at the bottom |
| 11.8s | the deal modal for the next board |
| 12.8s | you can act |

**Her turn** is a flat **1.7 to 2.1 seconds**, every time, four times a board (measured: 1936, 1811,
1706, 2119 ms). It does not vary with how hard the position is, because she is not thinking, she is
waiting on a timer.

**So a single board is roughly:** your five decisions, as fast as you like · **7.6 seconds** waiting for
her · **12.8 seconds** of end-of-board · one modal. Across a best of five that is about **100 seconds of
watching and five passes through the same modal.** In a game whose board takes maybe twenty seconds of
actual decisions.

---

## 2. The four panels, and what replaces each

The principle for all four: **a text panel is what you use when there is nowhere to put the information.
This game has somewhere. It has a place, a sky, a table, a walker and a hand.**

### The night card: delete it

It fires **every single night**, which by the project's own law ("ceremony scales inversely with
frequency") makes it the screen that should have the least ceremony in the game. It currently has the
most: a counter, a title, a lore line, a natal line, a gift line and a prompt, on black, before anything.

You land in the lobby instead, in tonight's house, with the scene already alive. The ostriches are
already walking, which is the best thing about the flock and you currently see it *second*. The moon is
in the sky where it belongs; the lore line is what the moon says when you touch it, not a gate you pass.

And the one genuinely new fact on that card, "her card is yours for good", is a **gift** - so make it an
object, not a sentence. The card flies out of the sky into your hand as the lobby settles. One beat, no
panel, no tap, and it lands harder than the line does.

### "the night is open": delete it

Two destinations with three lines of explanation each, and both destinations already exist as places in
the lobby: the road runs to the horizon, the table sits at the near end. Design already decided this on
15 Sep - the lobby's door goes straight to the road - and it did not ship. Two hands belongs as a second
seat *at the table*, offered when you arrive, or on the nav where it already is.

### "match the sky for the flock": delete it

A title card for a thing you just chose. If the opponent matters (and they do, that is what 216 walker
records are for), they belong **at the table**: you arrive, kito is already sitting there, kito says
kito's line, the cards deal. A walker's line read off a black screen is a loading screen with
personality; the same line spoken by the figure in the scene is a character.

### "play these seven / shuffle once, take six": the worst one

This is a **blocking full-screen modal that fires before every board**, so five times in a best of five,
asking the same question every time. It is the single most repeated interruption in the game.

Two fixes, and I would do both:

- **Make it a gesture, not a screen.** The seven deal into your hand face up. "take six" is a small
  control under the fan. Do nothing and the hand is yours. A player who always keeps seven never sees a
  decision at all.
- **Only offer it once a match.** The mulligan's real cost is at dawn (six cards means one held instead
  of two), which is a match-level trade. Asking five times is asking the same question five times.

### And the fifth: the match-end panel

"kito takes the night, 3 to 0 / nothing lost. the table deals again tomorrow. / kito stands ready. /
anywhere to deal again / lobby" - four lines centred on black, and **the board you just spent five
minutes on is gone before you can look at it.**

Keep the board. Dim it. Put the result on the table: the five pips fill, the walker stands, one line.
Then let the camera pull back to the lobby by itself. The player should finish the night looking at the
road they were on.

One copy note with teeth: **"nothing lost" is the game telling you it did not matter.** A whole night
ends, the score is 3 to 0, and the text reassures you that nothing happened. If losing a night genuinely
costs nothing and winning it changes nothing, that is not a copy problem, it is the reason the match has
no weight, and it is worth a decision rather than a sentence.

---

## 3. The twelve seconds, cut to about four

Every one of these is a subtraction, not an addition.

- **The 1.7s before the settle starts:** dead. Cut to about 0.3s. The count should begin as the last card
  lands.
- **The silent counters:** the four captions are already written and the arithmetic is already sitting in
  `state.settle`. Ten steps of numbers moving with no explanation is *waiting*; the same ten steps with
  "stations · five against four" beside them is *information*, and it costs no extra time at all. This is
  the cheapest improvement in the whole game: same duration, completely different feel.
- **Dawn's 5.1 seconds, every board:** this is the longest beat in the game and it plays whether or not
  it changes anything. **Play the full ceremony only when dawn decides the board.** When it does not, it
  is one caption on the scales. The record already knows which case it is (`settle.dawn.points` against
  the margin), so this is a condition, not a redesign. On the boards where dawn does matter, the shelf
  (1d) is both clearer and shorter than the centre-stage version still shipping.
- **The 2.9s of nothing after dawn:** pure dead air. Delete.
- **The verdict:** "kito wins" in low-contrast serif at the bottom is the weakest moment in the loop.
  The tablet was picked and drawn; it belongs here, and it can arrive during the time the dead air
  currently occupies.

**Target: 12.8s to about 4s, delivering more than it does now.** That is the whole difference between
"clunky" and "tight", and none of it needs new art.

---

## 4. Three things on the board itself

**Her turn is a timer, not a thought.** A flat ~1.9s regardless of the position. Make it variable and
mostly shorter: about 600ms when the move is forced or obvious, longer only when the board is close. The
same total time spent unevenly reads as thinking; spent evenly it reads as a wait. And her card can start
moving while the previous take is still resolving, which removes the gap entirely on most turns.

**There is no input gate.** I fired 26 clicks over five seconds across an end-of-board transition and the
game accepted them as moves on the next board. A double-tap or an impatient player will place a card
they did not choose. The pack's own rule was "nothing clickable until the verdict has arrived"; it is not
implemented.

**Clicks fail silently.** Several card-then-slot pairs did nothing at all, with no feedback. A refused
placement has to say so - a shake, a tone, the card refusing to lift. Nothing at all is the one response
that makes a player doubt the game rather than themselves.

And one legibility note from the same session: the count changes **three times** on the scales (0 to 3,
3 to 9, 3 to 11) with nothing attributing any of the three. Captions fix this too.

---

## 5. If you only do five things

1. **Kill the deal modal.** Make the mulligan a control on the hand, once a match. Removes five blocking
   screens from every match.
2. **Caption the settle.** The text and the numbers both already exist. Same duration, transforms the
   beat.
3. **Cut the end-of-board dead air** (1.7s at the front, 2.9s at the back) and make dawn's full ceremony
   conditional on dawn mattering. 12.8s becomes about 4s.
4. **Delete the night card, the mode split and the intro card.** Launch-to-first-card goes from five taps
   and four text panels to **one tap and none**.
5. **Gate input during transitions, and make refused clicks answer.**

What that adds up to: the player opens the game, sees tonight's house alive with its scene, taps once,
and is playing. Between boards they watch four seconds that tell them why they won or lost. Nothing on
black, nothing centred, nothing read.

### Files

Timings and phase traces taken live on staging, 17 Sep, m20 the flock, five boards. Prior:
`research/THE-FLOW-14SEP.md` (the five moments), `research/THE-MENUS-15SEP.md` (transitions and timing),
`research/THE-SHIP-READ-15SEP.md` (what had and had not landed).
