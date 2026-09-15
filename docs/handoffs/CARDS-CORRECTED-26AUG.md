# Six broken cards, why they broke, and the fixes

**26 August 2026.** Justin called out five cards as useless. He was right about all five, and a
sixth is broken the same way. I played the live build at staging.starshard.net to check rather than
argue.

---

## What playing it confirmed, and what I should have checked first

Four facts about the board that I wrote abilities in violation of:

1. **A taken card does not move.** It flips in place and changes colour. I watched my void get
   claimed at station three and stay at station three.
2. **The board fills completely.** By the time my hand was down to two cards every station held a
   card. No station is empty at the count.
3. **"Still stands" is always true.** A card that has been taken is still on the board. Nothing
   leaves except a returning card.
4. **Striking the same target twice with the same numbers is a no-op.** If you won you already took
   it; if you lost you lose again.

Every one of the broken cards violates one of those four. **I wrote thirty-two abilities without
opening the game.** That is the actual failure and it is not a small one.

---

## The six, and what they should be

### 10 · the throne — strictly worse than the alternative

**What I wrote:** fights one higher on the side facing tonight's mansion.
**Why it is dead:** that is +1 on **one** face. The level-2 alternative is +1 on **both**. There is
no board state where you take this. It is a dominated option, which is worse than a weak one.

**Fixed — raise · on claim:** *Whatever the throne takes fights one higher for the rest of the board,
whoever holds it.*

Now it compounds. Take a card early with the throne and that card is stronger for every exchange
after, on your side of the line. It beats +1/+1 on a board where the throne connects and loses to it
on a board where the throne sits in a corner. That is a real choice.

### 17 · the crown — the ability has no trigger

**What I wrote:** if the card the crown stands beside is taken, the crown steps to stay beside it.
**Why it is dead:** taken cards do not move. The crown is already beside it. The sentence describes
nothing.

**Fixed — move · on lodge:** *As the crown lands it takes the station beside it, and the card that
was there steps into the crown's place.*

The crown displaces rather than fights. "Not the spark, the keeping" reads as taking the ground and
letting the other stay on the road. It only works while a station is open, which makes it an early
card, and that is fine.

### 21 · the empty district — the condition never fires

**What I wrote:** counts three while a station beside it is empty.
**Why it is dead:** the board fills. At the count nothing is empty. The clause is decoration.

**Fixed — worth · at the count:** *The empty district counts two, and the station beside it counts
for nobody.*

This is the engine's real district, and it is one of only three signatures that measured as doing
real work. I removed it in the name of simplifying ownership and I was wrong to. **Silence stays as
the one named exception.** It is the card's whole identity: the blank station that takes the sky
around it with it.

### 24 · the void — same failure, worse

**What I wrote:** counts three while nothing stands beside it, and one otherwise.
**Why it is dead:** nothing is ever alone at the count. The card's signature is literally "no
effect," and I shipped it in a document.

**Fixed — worth · at the count:** *The void counts two, and both stations beside it count one less
for whoever holds them.*

It holds space by taking it from its neighbours, both sides alike. That is "extremely good at holding
space and notably worse at being held," it is always live, and it makes placing the void a real
decision because it costs you too.

### 4 · the follower — accidentally unkillable

**What I wrote:** while the card to its left still stands, the follower cannot be taken.
**Why it is broken:** everything always stands. The follower is permanently immune from the moment
anything is to its left. That is the strongest card in the game by a mile, by accident.

**Fixed — deny · always:** *While the card to its left is yours, the follower cannot be taken.*

Now it depends on ownership, which changes constantly, and the opponent has a way to answer it: take
the card it is following.

### 7 · the return — a no-op

**What I wrote:** strikes twice as it lands, once then once again.
**Why it is dead:** same numbers, same targets. The second strike can never do anything the first
did not.

**Fixed — add a fight · on claim:** *The first time a card lands beside the return, the return
strikes it back from where it stands.*

A second fight at a different moment with a different board in front of it. That is what "coming back
counts as going forward" should feel like.

### 27 · the guide — technically fine, practically narrow

**What I wrote:** every card on its own mansion counts for the side that lodged it.
**Why it is thin:** only the mansions on tonight's road can have dominion at all, and only a couple
of those will be in a hand. Some nights it does nothing.

**Fixed — worth · at the count:** *While the guide stands, every one of your cards on its own mansion
counts one more.*

Always has a target if you have any home card, which is most nights, and it rewards the play the game
already wants you to make.

### 26 · the chamber — this one works, the wording did not

"Changed hands" means taken by the opponent. Say it plainly: **counts two while it has never been
taken.** A card you placed somewhere safe and defended all board. That is a real decision and it
stands.

---

## The bigger thing this exposed

**A rigid quadrant-to-permutation map produces broken cards.** The crown was the hardest card in the
set to write, and the reason is that mansion 17 sits in Seiryuu, whose permutations are turn and
move, while the crown's lore is about *keeping* — which is a deny or a count. I forced it and got a
sentence that does nothing.

**Make the map a strong default, not a straitjacket.** Each quadrant owns two permutations and gets
one card that reaches outside them. Four exceptions across twenty-eight is not enough to blur the
identity, and it is enough to stop the lore being bent into nonsense.

## What I am doing differently

The two-word test was not enough. **Every card needs a scenario written next to it** — a specific
board, a specific placement, what changes. Every one of these six would have died at that step in
thirty seconds.

Before the next draft I will play a full board for every card that is not obviously always-on, and
the scenario goes in the document beside the rule.

## One correction to my own reading

I counted five open stations at the start and said the live road was short. **Wrong — the road fans
and scrolls, and it is nine stations with five cards a side**, which is the shipped spec and the one
most of this week's simulation has used. Nothing about the balance numbers needs reconciling. The
seven-from-twenty-eight structure is our new design and is not live, which is the whole reason to go
and look at a real board rather than reason from the engine.

**None of the four facts depend on road length.** A taken card not moving, the board filling, "still
stands" always being true, and a restrike being a no-op are all true at nine stations, and they are
what killed the six cards.
