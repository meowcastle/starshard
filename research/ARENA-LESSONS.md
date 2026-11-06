# What Arena teaches Manzil

*6 October 2026. Three live watches of MTG Arena, four games, roughly 25 frames captured from
`com.wizards.mtga` plus a timestamped pacing log. Record: one comfortable win (27-12), a loss
to 46 damage in one swing, a loss from behind (0-21), and a blowout win (44-7, last frame).
This doc rolls up `manzil-vs-arena.md` (the engagement layer) and `manzil-arena-mechanics.md`
(the rules), and adds what the third watch found: pacing, the economy, and legibility.*

Arena is thirty years of design with a large company behind it. The exercise was never "copy
Arena." It was: **which of its moves are cheap, and which does Manzil structurally lack?**

---

## The one-paragraph answer

Arena's game **widens** and Manzil's **narrows**. Magic adds a resource every turn, so your
options grow until the game ends; Manzil removes a slot every placement, so your options shrink
until you often have one legal move. Underneath that sits one missing rule — every Manzil card
costs exactly the same. On top of it sits a missing layer — Arena explains every single thing
it does, and Manzil's most interesting mechanic, the cascade, explains nothing. The first is a
ruleset change. The second is a week of UI work and is the cheaper win.

---

## Part one: the rules

### The option space widens or narrows

Manzil: nine slots, five placements, every placement removes a slot. Arena: one land per turn,
so turn one you can cast a 1-drop and turn six almost anything. **A game that widens builds
tension. A game that narrows releases it.**

### Everything costs the same

The Void (9/2) and the Glance (4/6) each cost one slot. With no cheap card and no expensive
card, there is no curve, no anticipation, no reason to hold a card, and card choice collapses
into "which number helps here." Mana is upstream of almost everything good in Magic.

### Cards compound

The clearest single image from all four games: **Aerith entered as a 2/2, became a 7/5 when
Buster Sword was equipped, and finished as a 12/10** as lands kept triggering counters. In
game one, Jaliya went 3/3 → 4/4 the same way. A card played on turn three was still getting
better on turn nine, untouched.

Manzil's cards do their work once, at placement, and then become a number.

### Abilities fire on events

Koth reads *"whenever a Plains you control enters, put a +1/+1 counter on target creature."*
It is an event listener, so the board becomes a machine the player assembles. Manzil's 28
signatures are almost all **static conditions** that modify a comparison. Converting a handful
into triggers would give the board machinery without touching the core rule.

### Equipment

Buster Sword is a card whose only job is to make another card better, persistently. That is
combinatorial building — two cards that are mediocre alone and strong together. Manzil has no
card that improves another card after it lands.

### Combat is a two-sided simultaneous decision

Attacker declares, defender declares, both reveal. Neither controls the outcome alone. In game
two this turned a losing board into a stable one through a block the opponent could not
prevent.

**This is the simultaneous double-blind placement idea from the August randomness research** —
the highest night-to-night variety number in the entire study (29.7 against 18.0 shipped) with
zero luck added, which I marked unresolved because my agent could not model bluffing. A
simulator and a shipped billion-dollar product now point the same way independently.

### The ceiling is unbounded

46 damage in one turn from an 11/8. Nothing caps a swing. That is why four games told four
different stories, while Manzil's 28 nights produce boards of broadly the same shape.
**Engagement is not only good positions; it is different kinds of game.**

---

## Part two: what the game does around the rules

### It narrates everything

Three mechanisms, running constantly:

- **Plain-language labels on the opponent's actions** — *"Scry: 1 top, 0 bottom."*
- **The card blown up large with full rules text while it resolves**, gold-bordered when it is
  the decisive play — *Shoot the Sheriff · Destroy target non-outlaw creature.*
- **An arc of light from cause to effect** — Koth triggering, a glowing trajectory sweeping to
  the creature receiving the counter.

**This is the most transferable thing in the whole session.** Manzil's cascade — a tie flips a
card, that card attacks its own neighbours, the chain runs 3-6 flips a board — is exactly the
moment a player would wonder what happened. Unnarrated it is noise. Narrated, one arc per link
naming its cause, it is the best moment in the game.

### State is visible without arithmetic

- **Live condition counters on cards.** Jaliya's ability triggers *"if you've gained 5 or more
  life this turn"*, and the card displayed a running **13** beside it. You never count whether
  a card's condition is on; the card tells you.
- **Status rendered as objects.** A creature locked by White Auracite wore **blue chains**. You
  read the board's state at a glance.
- **Castable cards outlined in your hand.** When nothing is outlined, you know you have no play.

Manzil's signatures are full of conditions — *+1 while both neighbours stand*, *counts two
alone*, *safe as it lands*. **Each one should show whether it is currently live.** This is the
cheapest item on the list.

### The score is a live clock

Life totals moved every turn and stay on screen at both ends — 20 → 21 → 24 → 25 → 27 against
20 → 17 → 18 → 12 in game one. Manzil's count resolves when the road fills.

### Agency over the randomness

Game four, the cleanest example. He kept a **risky two-land hand on the play** — the mulligan
screen states the cost of the alternative, *"You will return 1 card to the bottom of your
library"* — and the next frame showed the **Swamp he drew, blown up large.** Choose your risk,
the draw resolves it, the game shows you the resolution.

The August research's one controlled study found that what predicts satisfaction is **control
over the degree of randomness**, not the amount. This is that, end to end. Manzil deals you five
and offers no decision about them.

### The opponent is a person

Names, faces, a title for you, and status lines — *"waiting for their initial mulligan choice"*,
*"kept a hand of 7"*. Manzil's walkers already have names — imra, sef, odel, brann, the quiet
one — and the names currently do almost no work.

---

## Part three: pacing and the economy (third watch)

### The opponent's turn is dead time

Timed across game three: **his turns ran about 35 seconds, hers about 65**, and through hers his
hand showed no castable outlines. He watched himself take 8 with no decisions to make. Arena has
real dead time.

Manzil has none — the sky moves instantly. That is an advantage, but it also means her move
carries no dread at all. A short narrated beat on her move buys the tension without the wait.

### The hardest decisions come when losing

At 9 life against 21, nothing on the board changing, **he spent 80-plus seconds on a single
turn searching for an out.** Losing in Arena is a problem to solve. With an open hand and a
deterministic sky, a careful Manzil player can often see a board is dead before it ends, and
there is nothing left to search for.

### Rewards arrive in silence, and slowly

Same home screen, three games apart:

| | before | after |
|---|---|---|
| gold | 9,600 | **9,700** |
| quest: cast 20 red or green | 1/20 | 1/20 |
| quest: cast 20 blue or green | 0/20 | 0/20 |
| quest: wins | 2/15 | **3/15** |
| XP orb | 14/15 | **✓** |

**Three games bought 100 gold and one checkmark.** A pack is 1,000. There is no reward screen
between games — every game ended *result → rank badge → straight back to the queue*, under
forty seconds from a 46-damage loss to a new VS splash. Progress waits on the home screen.

**Two of four daily quests asked for colors he doesn't play.** He's mono-white; "cast 20 red or
green" made no progress. That is a collection nudge dressed as a daily task — try another deck,
build another deck. Manzil has a natural version: *claim three mansions with a card you've never
lodged.* Make it weekly, or give it a catch-up window — daily tasks sit next to the
daily-login-reward pattern that UK regulators treat as a nudge technique.

### Losses are cushioned

Two straight losses and the rank stayed at **Silver Tier 2**. The defeat screen shows your rank,
not your mistake, plus a "View Battlefield" button if you want to study what killed you —
offered, not forced. Manzil's road already does a version of this (*fall off and the ladder
waits where you left it*). Keep it.

### Every game looks different

Four battlefields in four games: a stone temple, a glass room, a desert, a clockwork hall. Pure
cosmetic variety with no mechanical cost. Manzil already has the hook — every night is a
different mansion. **The board could wear tonight's mansion.**

---

## One strategic note

His avatar is **Squall, from Final Fantasy VIII**, and his deck ran Aerith and the Buster Sword
from the Final Fantasy crossover. Triple Triad — Manzil's direct ancestor — is *Final Fantasy
VIII's card game.* The audience for a Triple Triad descendant is sitting in Arena's matchmaking
pool right now, playing those exact characters. Worth remembering when the content plan picks
its first communities.

---

## What to do, ranked by cost

**Cheap — UI only, no ruleset change, about a week between them:**

1. **Narrate her move and draw the cascade.** One arc per flip, naming its cause. The single
   highest-value item in this doc.
2. **Show whether each signature's condition is live.** A glow or a small counter. Cheapest item
   here, and every card with a condition needs it.
3. **A live count that moves on every flip**, visible at both ends of the road.
4. **Render state as objects** — a card that is safe, silenced or locked should look it.
5. **The board wears tonight's mansion.**
6. **Name the walkers on screen and give them status lines.**

**Medium:**

7. **A keep-or-redeal before board one**, with the cost printed.
8. **A menu that shows what you are partway through.**
9. **A weekly task that nudges toward unused cards.**

**Ruleset changes — expensive, and the ones that move the ceiling:**

10. **Differentiated card costs**, so the option space widens instead of narrowing.
11. **Triggered signatures** — event listeners rather than static modifiers.
12. **Cards that improve other cards after landing** — equipment, counters, anything that
    compounds.
13. **Two-sided simultaneous commitment.** The sim and Arena agree; it needs her AI rebuilt.

Items 1-6 make the current game legible. Items 10-13 make it a different game. The August
research already said the second set is where the commercial ceiling lives, and four games of
watching a player's face light up at a 12/10 Aerith is the same finding in a form a spreadsheet
can't produce.

---

## Not captured

The game-four victory screen — capture dropped at 44-7 when the Mac's screen-capture system
stopped responding, most likely the display sleeping or locking during the transition. The
defeat screen was captured twice and the pattern is clear enough to stand.
