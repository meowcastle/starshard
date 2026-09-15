# The foundation, the permutations, and what is only noise

**26 August 2026.** Measured on `research/ref-simple.js` — the merged reference with two
simplification dials, both off by default. 60/60 vectors, 2,000/2,000 identical with both off.

---

## Part 1. The foundation is four things

Strip everything away. A card lands on a station. A number on it faces a number on its neighbour.
The bigger one takes the ground. At the end you count who holds what.

**That is the whole game, and it has exactly four moving parts:**

| the atom | what it is |
|---|---|
| **THE STATION** | a place on the road, and which mansion it belongs to |
| **THE FACE** | the number currently pointing at what you are fighting |
| **THE FIGHT** | one comparison: my face against yours |
| **THE COUNT** | whose station it is, and what it is worth |

**Every mechanic in the game touches one of these four and nothing else.** Not because I sorted them
that way — because those are the only four places in the resolve path an ability can attach. There is
nowhere else for one to live.

## Part 2. The permutations. There are seven.

| atom | operation | what it means |
|---|---|---|
| **FACE** | **change the number** | a face fights higher or lower than printed |
| **FACE** | **turn the card** | the other number faces this way instead |
| **FIGHT** | **add a fight** | a comparison happens that the turn order did not call for |
| **FIGHT** | **deny a fight** | a comparison happens but the ground does not change hands |
| **STATION** | **move a card** | it goes to another station, or back to hand |
| **COUNT** | **change the worth** | this station is worth more than one |
| **COUNT** | **change the owner** | this station counts for someone other than its holder |

**Four atoms, seven operations.** That is teachable on one screen and every card in the deck is one
line: *what it touches, and when.*

**And "when" is separate from "what."** Six triggers: on lodge, on claim, on being struck, at the
count, always, on tap. Design's mark list mixes the two — `⊙ tap` and `◷ first` are triggers wearing
the costume of operations — and that mixing is where the sense of forty cards comes from.

## Part 3. What augments the foundation, and is good

These add depth **inside** an atom rather than adding a new atom. They are the ones to keep and to
build on.

- **Face modifiers.** Three magnitudes: −1 across a field, −2 on one card, +1 on your own. Nothing
  else. They make the comparison worth thinking about instead of reading off the card.
- **Extra fights.** Three shapes: strike again from where you stand, strike one further, strike back
  when something is taken. These give a placement reach beyond its two neighbours.
- **Worth.** Some stations are worth two. Dominion is the anchor — a card standing on its own
  mansion — and it is the one bonus that is legible from across the room.
- **Turning.** The two-faced card is the best mechanic in the game by measurement, +7.1 against a
  noise floor of 3.5, and it is the only one that adds an *option* rather than a rule. It doubles the
  decision without adding anything to learn.

**Everything worth building is in this list.** The measurements have said so four separate times: the
things that give the player another choice work, the things that give the player another rule do not.

## Part 4. What is layering confusion

These do not augment an atom. Each one introduces a *new rule the player must hold in their head* to
read the board correctly.

### The worst: four different rules decide who a station counts for

A new player learns "whoever holds the card." Then they learn four exceptions:

1. **Ground lock** — the bearer and the blaze lock the *scorer* separately from the *holder*. You can
   take a card and not take the point.
2. **The mane** — its station counts for whoever holds both cards beside it.
3. **The thread** — the two ends of the road count for the thread's side, whoever is standing there.
4. **Silence** — the empty district makes both neighbours count for *nobody*, which is a third
   ownership state that exists nowhere else in the game.

**Looking at the board no longer tells you the score.** That is the single largest comprehension cost
in Manzil, and the two most confusing cards, the thread and the district, happen to be the two
strongest. That is the exact inverse of lenticular design: the highest-impact cards are the least
legible.

### The tie cascade

Ties flipping is a good rule. Ties *cascading* — a card taken by a tie then striking onward into both
of its own neighbours — is a second rule bolted to the first, and it means the outcome depends not
just on whether you won the fight but on **how** you won it. That is a genuinely hard thing to hold.

### Three separate ways to be untakeable

The storm resists ties only. Saturn resists everything. The chamber resists everything for two turns.
Same idea, three rules.

### Small ones

- **The jewel** carries two exceptions on one card: a floor of seven *and* total immunity to
  softening.
- **The chamber's timer.** An age counter is a kind of state nothing else in the game uses.
- **Night laws and boss rules** (Design's addition) change the base rules per night, on top of
  everything above.
- **Level four** exists in the level track and means nothing.

## Part 5. Two simplifications, measured

Full collection, eleven stations, the mansion fight, two seeds:

| rule set | careful | casual | **gap** | close | **blowout** | flips |
|---|---|---|---|---|---|---|
| **as it stands** | 49.2 | 30.9 | 18.3 | 22% | **50%** | 7.3 |
| **no tie cascade** | **53.3** | 33.4 | **19.9** | **28%** | **42%** | **5.6** |
| one owner rule | 51.4 | 31.3 | **20.1** | 20% | 57% | 8.0 |
| both together | 53.1 | 42.9 | 10.3 | 26% | 45% | 6.1 |

### Removing the tie cascade improves every single measure at once

Careful play goes up into the band. The skill gap goes up to 19.9. Close games go from 22% to 28%.
**Blowouts fall from 50% to 42% — the largest reduction found in this entire project**, against the
one problem nothing else has touched. And flips per board drop from 7.3 to 5.6, so the board is
calmer and more readable.

**A rule was deleted and the game got deeper.** That is what "easier to learn, harder to master"
looks like when it actually happens.

### Collapsing ownership to one rule is a real trade, not a free win

It raises the skill gap to 20.1, the highest measured, because ownership tricks were invisible and
the search exploited them better than a person can. But blowouts rise to 57% and close games fall to
20%, because the ground-lock cards were acting as a brake on runaway boards.

**So it is a choice, not an obvious yes.** My read: take it anyway, because the comprehension win is
large and the blowout cost is exactly what removing the cascade fixes. But do not take both at once —

### Do not take both

Together the gap collapses to 10.3. With neither the cascade nor the ownership tricks, casual play
improves far more than careful play does. The two simplifications interact badly and the combination
is the worst configuration of the four.

## Part 6. What I would do

1. **Delete the tie cascade.** Best single change available. Simpler rules, better numbers on every
   axis, and it is the only thing that has moved the blowout problem.
2. **Collapse the three untakeable rules into one.** "Cannot be taken." Put the difference in the
   trigger — always, for two turns, against ties — not in the rule.
3. **Pick one ownership rule and hold it.** Four is three too many. If ground lock survives, the
   mane, the thread and silence should not; they each solve the same problem a fourth way.
4. **Keep every face modifier and every extra strike.** These are the good layer. They are visible,
   they are three magnitudes and three shapes, and they are where the remaining depth should go.
5. **Give level four a meaning or delete it from the track.** An empty tier in a visible progression
   is a promise the game does not keep.
6. **Two-word test for every card.** One atom, one trigger. Anything needing three clauses is doing
   two cards' work.

### The rule to hold going forward

> **Depth goes in the FACE and the FIGHT, where the player can see it.**
> **The COUNT stays simple, because that is what they have to read.**

Every measurement in this project agrees with that sentence. The visible mechanics — turning,
modifiers, strikes — are the ones that measured as worth something. The invisible ones — ground lock,
the mane, silence — are simultaneously the hardest to learn and, with two exceptions, the least
valuable.

### Files

`research/ref-simple.js`, `research/simple.js`.
