# What Arena does that Manzil doesn't

*6 October 2026. Observed live: eleven frames captured from `com.wizards.mtga` across one
full game (blueassassin vs TmuT, mono-white, win) plus the home screen and the re-queue into
game two. Not a literature review — this is what was on screen.*

Arena is thirty years of design with a large company behind it, so the exercise is not "copy
Arena." It is: **which of its moves are cheap, and which does Manzil structurally lack?**
Seven things, ranked at the end by cost to steal.

---

## 1. The menu shows six things you are partway through

Before a card is played, the home screen carries: **three currencies** (9,600 gold, 850 gems,
a pack counter), **four daily quests each with a progress fraction and a stated payout**
(*1/20 cast red or green spells → 500 gold*; *0/20*; *2/15*; *14/15 → XP*), a **mastery track**
running the full width with visible notches, an **account level** (19), and **three rotating
events, one on a live countdown** (*"Starts in 1:27"*).

Then one enormous **Play** button.

Manzil's menu asks you to pick a night. Arena's menu tells you that six separate things are
nearly finished, and then gives you one button to advance all of them at once.

## 2. The mulligan is an agency moment with the price printed on it

Before turn one: seven cards fanned face-up, two buttons — **Mulligan** / **Keep 7** — and
underneath, *"You will return 1 card to the bottom of your library."*

Three things in one screen. A decision. The information to make it (three lands, four
spells). And **the cost of changing your mind, stated in advance.**

Manzil deals you five and you place one. There is no moment where the game says *here is what
you got, and here is what it costs to ask for different*.

This is worth sitting with, because the August randomness research pointed at exactly this
from the other direction: the one controlled study found that what predicted satisfaction was
**control over the degree of randomness**, not the amount. The draw-architecture agent said
"don't add a mulligan, add a floor," and Design shipped the Moon-mansion guarantee. That was
the right call for *variance*. But the mulligan's real job here isn't variance reduction. It
is handing the player a decision before the game starts.

## 3. Turn one does almost nothing, and that is the point

The turn-one frame is an empty board with a single land on it. By the mid-game frame there
are roughly a dozen permanents. The game **starts at zero and gets bigger**, and the first
thing you do is small.

This is the August "no arc" finding made visible. Manzil's slot one is exactly as powerful as
slot nine; a 2-minute board is flat from end to end. Both researchers independently landed on
*add a run structure* as the highest-leverage change available, and this is why.

## 4. Cards you played five turns ago are still getting better

Jaliya, Guided by Light entered as a **3/3**. Four frames later it is a **4/4** — because Koth
of the Homestead reads *"Whenever a Plains you control enters, put a +1/+1 counter on target
creature"*, and lands keep entering.

So a card played on turn three is **compounding on turn nine**, without being touched.

In Manzil a card does its work once, at the instant of placement, and then sits there as a
number. Nothing you own grows. That is the difference between an investment and a move.

## 5. The score is live, and it moves every single turn

Across the captured game: **20 → 21 → 24 → 25 → 27** for him, **20 → 17 → 18 → 12** for the
opponent. Both numbers are permanently on screen, large, at opposite ends.

The life total is not a tally. It is a resource that moves in both directions, that you spend
and gain, and that tells you continuously whether you are winning. Manzil's count resolves
when the road fills.

## 6. Nothing happens without the game explaining it

Three separate mechanisms, all running constantly:

- **Plain-language narration of the opponent's action.** A floating label reading
  *"Scry: 1 top, 0 bottom"* while their land resolved.
- **The card blown up large with full rules text** while its effect happens — *"White
  Auracite · When this artifact enters, exile target nonland permanent an opponent controls
  until this artifact leaves the battlefield."* You read it as it resolves.
- **An arc of light drawn from cause to effect.** The best frame of the session: a glowing
  trajectory sweeping from Koth across the board to the creature receiving its counter.

That arc is not decoration. It is **an explanation rendered as motion** — which card did it,
where it went, what it did. Arena's whole feedback philosophy is: never let the player wonder
what just happened.

**This is the single most transferable item for Manzil**, because the combo cascade is exactly
the moment a player would wonder. A tie flips a card, that card attacks its own neighbours,
and the chain runs 3 to 6 flips a board. Unnarrated, that is noise. Narrated — each link
drawing an arc and naming its cause — it is the best moment in the game.

It also closes a loop from the August work: the randomness research's fourth point was
*attributability is the whole defence against added luck*, because players attribute losses
to external causes well above the true rate. Arena does attributability continuously, not
just in a post-mortem.

## 7. The opponent is a person, and you can see what they are doing

A VS splash with two named players, two faces, and a title for you (*blueassassin, "The
Virtuous"* vs *TmuT*). Then, on the mulligan screen, *"Your opponent is waiting for their
initial mulligan choice"* — and next game, *"Your opponent kept a hand of 7 cards."* Their
hand is face-down but **countable**.

Manzil's opponent is "the sky": abstract, silent, and it tells you nothing about itself.
The walkers already have names — imra, sef, odel, brann, the quiet one — and currently those
names do almost no work.

## 8. The gap between games is seconds

The captured game ended and the next mulligan screen was up within the same ~100-second
window. No ceremony, no menu round-trip. **Finishing is the fastest route to starting again.**

---

## Ranked by cost to steal

| | change | cost | what it buys |
|---|---|---|---|
| 1 | **Narrate her move in plain language, and draw the cascade** — one arc per flip, naming its cause | low | the combo chain stops being noise and becomes the highlight; attributability for every loss |
| 2 | **A keep-or-redeal before board one**, with the cost printed | low | an agency moment before the game starts; the study-backed "control over randomness" lever |
| 3 | **A live count that moves on every flip**, not a tally at the end | low | a visible clock; tension that builds instead of resolving |
| 4 | **Name the walkers on screen and say what they are doing** | low | an opponent instead of an abstraction; the names already exist |
| 5 | **A menu that shows what you are partway through** | medium | six reasons to press Play instead of one |
| 6 | **Compounding cards — the run structure** | high | the arc. Already the #1 recommendation from August, and this session is the visual proof |

Items 1 through 4 are a week of work between them and none of them touch the ruleset. Item 6
is the one that changes the ceiling.

---

## What this confirms, and what is new

**Confirms:** the August call that Manzil's missing piece is an arc. Turn one doing nothing
and Jaliya growing to 4/4 are the same finding seen from the player's chair.

**New:** the narration layer. Nothing in the August research measured it, because a simulator
cannot see it. Arena spends enormous UI effort on *explaining itself while it plays*, and
Manzil's most mechanically interesting feature — the cascade — is currently its least legible.

**Not captured:** the post-game reward screen. The re-queue was fast enough that I missed it,
and it is where the daily-quest and mastery payouts land. Worth one more capture at the end
of a game, since that screen is the hinge of the whole retention loop.
