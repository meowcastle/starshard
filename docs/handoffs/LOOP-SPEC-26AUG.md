# The loop, from opening the app to taking a mansion

**26 August 2026.** A concrete spec, with the parts that were tested marked as tested and the parts
that are still judgement marked as judgement.

**Engine:** `research/ref-boss.js` — the merged reference plus the tap plus board-wide boss traits.
60/60 vectors, 2,000/2,000 identical to the reference with no trait set. Two seeds a cell, 1,120
boards a cell, eleven stations throughout.

---

## The loop

**1. You open the app.** One line, from the sky, built from state we already hold:

> the moon enters al-balda tonight. the district with no stars in it.
> you have stood here twice. it has never let you past the seventh walker.

**2. The road is open, or it isn't.** The moon occupies one mansion a night, so exactly one mansion
can be advanced tonight. Everything already beaten stays open to replay, but replay does not level.
This is the daily hook and it costs nothing to manufacture, because the sky is doing it.

**3. You choose seven.** From your collection, which starts at seven cards and grows to twelve.
Tonight's mansion is in your hand if you own it.

**This step is worth more than it looks.** Measured at the mansion, eleven stations:

| | careful | casual | **skill gap** | blowouts |
|---|---|---|---|---|
| pool of 7, no choice at all | 34.3 | 23.1 | **11.2** | 53% |
| pool of 9, dealt at random | 36.8 | 25.0 | 11.8 | 53% |
| pool of 9, **you pick** | 39.6 | 24.0 | **15.5** | 55% |
| pool of 12, dealt at random | 38.9 | 24.2 | 14.7 | 54% |
| pool of 12, **you pick** | 40.4 | 24.0 | **16.3** | 51% |

**The choice itself is worth about four points of skill gap**, on top of the two points a bigger
pool buys. That is the second largest gain measured in this project, after the tap, and it costs one
screen. It is also the third confirmation of the same law: **decisions raise skill, power does not.**

**4. The road.** Eleven stations, tonight's mansion standing on the first.

**5. The walkers.** Travellers on the road, rising in strength. Measured with a pool of twelve and a
real draft:

| | careful | blowouts |
|---|---|---|
| walker 1 | 86.0 | 63% |
| walker 3 | 83.1 | 60% |
| walker 5 | 75.4 | 60% |
| walker 7 | 70.4 | 57% |
| walker 8 | 69.0 | 55% |
| **the mansion** | **40.4** | 51% |

**Recommendation: cut eight walkers to five.** Walkers one through three are won 83 to 86 percent of
the time and six in ten end in a rout. That is roughly ten minutes of an evening spent on foregone
conclusions, and at nine boards a level the whole thing runs twenty to thirty-five minutes on a
night the player cannot reschedule. Five walkers plus the mansion is twelve to twenty minutes and
loses nothing but the part that was already decided.

**6. The mansion itself.** The avatar arrives. This is the fight.

**7. You take the card**, or level the one you have.

---

## What the mansion does that a walker doesn't

I tested four shapes of boss trait against the same board. The result is clean and it is the same
law again.

| the ninth fight | careful | casual | **skill gap** | blowouts |
|---|---|---|---|---|
| no trait, her hand 7 | 40.4 | 24.0 | 16.3 | 51% |
| **its own station counts double** | 37.4 | 18.9 | **18.5** | 58% |
| **it leads every board** | 39.3 | 21.6 | **17.7** | 52% |
| ties go to the mansion | 33.0 | 20.4 | **12.7** | 51% |
| it holds an eighth card | 29.9 | 16.0 | **13.9** | 56% |

Read the bottom two rows against the top two.

**Giving the mansion more power makes the fight harder and makes skill matter less.** An eighth card
is the biggest difficulty jump on the board and it cuts the skill gap by a fifth. Winning ties is
the same story.

**Giving the mansion a rule about the board makes it harder and makes skill matter more.** Its own
station counting double is the best cell measured here.

> **A mansion's trait must change the geometry, never the arithmetic.**
>
> Positional traits: the station it stands on is worth more. It always moves first. The two ends of
> the road belong to it until taken. Cards beside it cannot be turned.
>
> Never: an extra card, higher numbers, winning ties, an extra tap.

That is a design rule that generates twenty-eight distinct avatars from the lore without any of
them being "the hard one," and it is the tier that Slay the Spire uses at the top of its difficulty
ladder for exactly this reason.

**The recipe I would use:** it leads every board, and its own station counts double. Both are
positional, both tested positive, and both are legible in one sentence to a player.

---

## The cards

**Twenty-eight mansion cards.** Two numbers, one signature each. Nothing changes about this.

**Levels are what a card knows, not what it weighs.** The numbers never change with level.

| level | what you have | what it does |
|---|---|---|
| **you don't own it** | not in your collection | — |
| **level 2** | beaten the mansion once | the signature is awake |
| **level 3** | beaten it twice | the signature plus its quadrant's tap |
| **level 4** | beaten it three times | undesigned, see below |

**Judgement call, and it reverses what I said yesterday: there are no asleep cards in the
collection.** A card you own is awake. Progression is *more cards to choose from* and *higher levels
on the cards you have*, never a hand half full of things that do nothing.

I tested the alternative — a deck seeded with sleeping cards — and it was the worst configuration
measured anywhere in this project. The one fix that rescued it, giving sleeping cards stronger
numbers, then made levelling a card a downgrade, because a signature is worth less than the numbers
it would cost. Simpler to have no dead cards. It also satisfies the rule that the mechanics should
work the same on night one as on night four hundred.

**Level distribution.** Level three is where the tap lives, so it is the real currency. A third of
the collection at level three tested well. Do not gate levels behind anything other than beating
the mansion again, because the moon already gates that to once a month per mansion.

**Level four is still undesigned and should stay that way for now.** The cheap reading, "the grant
fires twice," is incoherent for three of the four quadrants. Every version I tested made the game
worse. It is the right thing to leave empty until level three is proven.

---

## The two things this spec does not fix

**Blowouts, and this journey makes them matter more.** Half of every board still ends decided by
four stations or more, and it is worse on the early walkers, at six in ten. A boss only feels earned
if the climb to it was close, so a structure that builds to a boss raises the cost of this problem
rather than lowering it. Nothing on the roadmap addresses it. It needs a catch-up mechanism designed
on purpose — the trailing side drawing a card, or the last station counting for more.

**The skill gap tops out at 18.5 here against a target of 20.** Close, and every honest thing I have
found has moved it in the right direction, but it is not there. The three levers that worked are the
tap, the draft, and a positional boss trait. All three are decisions. There is no fourth lever of
that kind currently identified, which is why the sixteen dead signatures matter: redesigned as
options rather than conditions, they would be the fourth.

---

## What I would build, in order

1. **The sky's line on open.** One string per mansion per state. Cheapest thing on this list and it
   is the first time the game speaks to the player.
2. **Choose seven from your collection.** One screen, worth four points of skill gap.
3. **Five walkers, not eight.** Deleting work, and it makes the level fit an evening.
4. **The mansion's trait, positional only.** Start with lead plus double station; write the other
   twenty-seven from the lore against the geometry rule.
5. **A catch-up mechanism.** Unspecified, needs design, blocks the boss moment landing.
6. **The sixteen signatures, rebuilt as options.**

### Open questions for Justin

- Are all the battles one sitting, or can the player leave and come back to the same night?
- If the mansion beats you, is the month gone, or can you try again that night?
- Does the avatar play its own cards, or your chart back at you? The second is far stronger and far
  more work.

### Files

`research/ref-boss.js`, `research/loop.js`.
