# The playthrough, in plain english

**17 September 2026.** Same findings as `THE-CINEMA-READ-17SEP.md`, without the numbers and the jargon.

---

## The one sentence

You asked me to trim the fat, clean up the transitions, and make it cinematic. The trim worked. The transitions got fixed. But in the process the game stopped telling you who won and why, and that was the part that was supposed to become the cinematic bit.

## What got better

**The cards shut up.** A card sitting on the road used to have a name, a planet name, a planet symbol and two numbers on it. Now it has two numbers and a small symbol. That's it. The road finally looks like a road instead of a page of records. This is the single biggest improvement and you can feel it immediately.

**The hand shut up too.** Same treatment.

**The font bug is fixed.** There was a third typeface showing up that nobody chose. It was a fallback, meaning the browser couldn't find a font you asked for and substituted something. It's gone.

**The black screen is gone.** Clicking into your cards, the codex or the ledger used to fade through pure black for three to five seconds. Now the new screen is just there in about a quarter of a second, and the screen never goes dark. This was the ugliest thing in the build and it's fixed.

## What broke, or rather, what got cut too far

**The game no longer tells you the result.**

Here's what happens now when a board ends. A beautiful brass balance beam swings up. Little counters drop into the two pans. The beam tilts. "kito wins" appears for about a second and a half. Then you're dealt a new hand.

That's it. No score. No reason. No "she took it at dawn because her pair outweighed yours." No walker saying anything. No lights. The only record that a board even happened is a tiny diamond filling in at the top right corner of the screen.

You played that board for about 85 seconds. The game spent 6 seconds on the outcome, and only about 1.5 of those seconds on actually telling you anything. The proportions are backwards.

**And here's the frustrating part: the words already exist.**

The engine calculates the full breakdown. I read it live off a real board: stations 3 to 6, dominion nothing, cards one to her, dawn one to you, total 4 to 7. Five separate reasons, all correct, all sitting right there in the game's memory.

The sentences to describe them are also already written and sitting in the file Design owns: "stations · three against six", "dominion · one each", "dawn · one to you".

And the timing for how long to show each one is written down too: four captions, 600 milliseconds apart.

So the numbers exist, the sentences exist, the timing exists, and **none of it is shown to the player**. The scale counts up to a total and says nothing about how it got there.

**The verdict card doesn't exist at all.** Design wrote out exactly how it should behave, down to the millisecond, and that specification is sitting inside the shipped game. But the code that would actually run it was never built. Of the seven things I handed Code on the 15th, this is the only one that didn't ship.

**And the one line that does appear is hidden behind scenery.** The "why you lost" line draws underneath the balance beam's legs and one of the ostriches. I couldn't read it in a screenshot.

## Two smaller things

**The menus pop.** They're fast now, which is good, but everything on them appears in one instant blink. Your cards screen goes from 4 things to 46 things in a single frame. Compare that to the deal, where seven cards land one after another over about a second, which feels great. The instruction to do that everywhere is already written in Design's file and isn't being used.

**The dawn moment never got the trim.** Card names came off the board, but at the dawn reveal they come right back on, plus planet names, all at tiny size, on cards you can't do anything with. That moment is still as cluttered as it was before.

## On "cinematic" and "timeless"

These turned out to be the same instruction, which surprised me.

Cinematic isn't more motion. It's **one thing happening at a time with the camera pointed at it.** Your deal already does this and it's the best second in the game. The balance beam does it too. Everywhere the game still feels flat is a place where six things appear at once and none of them is the important one.

Timeless is what you get when what's on screen is **an object doing something**, rather than a label in a box. A brass beam that tilts under weight will still look right in ten years. A caption in a rounded rectangle won't. You've already made that choice correctly twice, with the beam and with the ghost outlines of the empty stations. The rest of the text hasn't been converted yet.

So both words point the same way: fewer things, each one bigger, arriving in order, and the most important one arriving last.

## What to do, in order

1. **Code builds the verdict.** This is the missing beat. Everything else on this list is decoration. Design's timings are already in the game waiting for it.
2. **Show the four captions on the scale.** Nobody has to write anything or invent anything. The numbers, the sentences and the timing are all already there. This is plugging in a cable.
3. **Move the result line off the scenery** and make it the biggest thing on screen in its moment, instead of the smallest thing hidden behind an ostrich.
4. **Cut the names off the dawn cards.** Just the totals.
5. **Let the menus arrive in order** instead of blinking in complete. The number to use is already written down.
6. **Make it obvious whose card is whose** on the road. Right now both sides look nearly identical and the only difference is a small bar underneath.
7. **Finish the type sizes.** Still six sizes on one screen where there should be three, and the house name, which never changes, is still the loudest thing on the board.
8. **Small fixes:** the codex panel is cut off at the bottom, the floating "claimed by" line overlaps the cards, and two of those lines are missing the word "the".

Number 1 is Code's job and it doesn't block anything else. Everything from 2 down is in files Design already owns.
