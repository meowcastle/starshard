# Every mechanic in Manzil, as the engine actually implements it

**26 August 2026.** Read off `research/ref-boss.js` — the merged reference plus the tap plus boss
traits. Not from memory. Anything marked **proposed** is built and measured but not switched on in
production.

---

## 1. The board

| mechanic | what it does |
|---|---|
| **The road** | A single row of stations. Nine today, eleven proposed. Station 1 is tonight's mansion; each station after it is the next mansion the moon will cross. |
| **Adjacency** | Strictly one-dimensional. A card touches only the station immediately left and right of it. No wrapping at the ends. |
| **Lodging** | One card placed per turn, sides alternating. The board ends when every station is filled or both hands are empty. |
| **Home / dominion** | A card standing on its own mansion counts for two instead of one. This is the single most reliable source of points in the game. |
| **The count** | At the end, each side adds up what its stations are worth. Highest total wins. |
| **Tied counts** | A drawn count goes to the player. Configurable (`tieRule`) — used to give PvP a fair rule. |

## 2. Striking — how a card is taken

| mechanic | what it does |
|---|---|
| **The strike** | When you lodge a card, it attacks both neighbours. Your facing number against theirs. |
| **Higher takes it** | A bigger facing number flips the neighbour to your side. |
| **Ties flip too** | Equal numbers also take the card. This is the rule most of the special cases exist to bend. |
| **The tie cascade** | A card taken *by a tie* then strikes onward into **both** of its own neighbours. This is where big swings come from. |
| **The strike onward** | Mars, and the drum, push a normal flip one station further than it would otherwise reach. |
| **Free strikes** | Some cards attack without being played: the listener strikes anything that lands beside it, the drum answers anything taken from its side from wherever it stands, the follower answers when the card to its right is claimed. |

## 3. Face modifiers — the numbers a card fights with

Every fight uses the card's *facing* number, adjusted live. All of these stack.

| mechanic | what it does |
|---|---|
| **Softening** | The general name for anything that lowers a card's facing number. |
| **Clawed, −2** | Whoever takes the claws fights two lower afterwards. |
| **Ghosted, −2** | The first enemy card to land beside the ghost is chilled. Once only. |
| **Glanced, −2** | The next card the opponent plays after the glance lands is weakened. |
| **The void, −1** | Everything standing beside the void fights one lower, either side's cards included. |
| **Venus, −1 permanent** | Venus permanently lowers the facing number of both neighbours as it lands. Not a temporary state. |
| **The root, +1** | The only positive modifier. The first card you lodge all board fights one higher. |
| **Floor of one** | No card can be softened below 1. |
| **Immunity to softening** | The jewel ignores every modifier above, and has a floor of **7** instead of 1. It is the only card that cannot be softened. |

## 4. Safety — cards that cannot be taken

| mechanic | what it does |
|---|---|
| **Saturn** | Cannot be flipped by anything, ever. |
| **The chamber** | A friendly card beside the chamber cannot be taken on the turn it lands or the turn after. A shield with a timer. |
| **The storm** | No tie can take it, anywhere on the road. A bigger number still can. |
| **The guard** (proposed) | The Byakko quadrant's level-3 grant: holds a tie on or beside its own mansion. |

## 5. Leaving the board

| mechanic | what it does |
|---|---|
| **The return** | Once a board, standing on its own mansion, instead of being flipped it goes back to its owner's hand to be played again. |
| **The hand** | When an enemy lands beside it, the hand steps aside to the first empty station on the road. It dodges rather than fights. |
| **The tap: call it home** (proposed) | The Genbu quadrant's tap. Pick up one of your own lodged cards and lodge it again later. |

## 6. Counting — what a station is worth

Base is one point per station you hold. Then:

| mechanic | what it adds |
|---|---|
| **Dominion** | +1 for a card on its own mansion. |
| **The gathered stars** | +1, always. |
| **The empty district** | +1, always, **and** it silences both neighbours — they count for nobody. |
| **The hideaway** | +1 on its own ground. |
| **The crown** | +1 while a station beside it is also yours. |
| **The heart** | +1 while your side holds *less* of the road than theirs. The only catch-up mechanic in the game. |
| **Jupiter** | +1. |
| **The mane** | Does not add points. It hands *its own station's* count to whoever holds both cards beside it. |
| **The thread** | Does not add points. It takes both ends of the road for its own side, whoever is standing there. |
| **Silence** | A silenced station counts for nobody. Only the empty district does this. |
| **The ground lock** | A station's *scoring* owner can be locked separately from who physically holds the card — see the blaze and the bearer below. So a card can be taken and still count for the other side. |

## 7. The twenty-eight signatures, one line each

Numbers shown are the card's left and right faces.

| # | card | faces | what it does |
|---|---|---|---|
| 1 | the gate | 6/5 | Takes the opening move of the board. |
| 2 | the bearer | 6/4 | Any station it claims beside it has its ground locked to the bearer's side permanently. |
| 3 | the gathered stars | 7/6 | Counts two. |
| 4 | the follower | 7/7 | Strikes back whenever the card to its right is claimed. |
| 5 | the blaze | 5/6 | Locks its own station's ground to its side as it lands. Taking the card doesn't take the point. |
| 6 | the storm | 8/5 | No tie can take it, anywhere. |
| 7 | the return | 7/6 | Once a board, on its own mansion, comes back to hand instead of flipping. |
| 8 | the ghost | 6/6 | The first enemy card to land beside it fights two lower. Once. |
| 9 | the glance | 4/6 | The opponent's next card fights two lower. |
| 10 | the throne | 6/9 | Two-faced: may be lodged either way round. Also has a tap to turn in place. |
| 11 | the mane | 6/5 | Its station counts for whoever holds both cards beside it. |
| 12 | the turning | 7/5 | As it lands, flips the strongest enemy card beside it to its weaker face. |
| 13 | the hand | 7/4 | When an enemy lands beside it, it steps aside to the first empty station. |
| 14 | the jewel | 7/7 | Cannot be softened, and never fights below 7. |
| 15 | the veil | 8/2 | The first card that lands beside it gets turned to its other face. |
| 16 | the claws | 6/6 | Whoever takes it fights two lower afterwards. |
| 17 | the crown | 6/6 | Counts two while a station beside it is also yours. |
| 18 | the heart | 7/7 | Counts two while your side holds less of the road. |
| 19 | the root | 7/6 | The first card you lodge all board fights one higher. |
| 20 | the flock | 6/6 | Anything it claims is flipped to its other face as it joins you. |
| 21 | the empty district | 2/8 | Counts two, and silences both stations beside it. |
| 22 | the listener | 7/4 | Strikes anything that lands beside it. The strongest card measured. |
| 23 | the drum | 4/7 | Strikes back whenever anything is taken from its side, from wherever it stands. |
| 24 | the void | 9/2 | Everything beside it fights one lower, including your own cards. |
| 25 | the hideaway | 5/6 | Counts two on its own ground. |
| 26 | the chamber | 7/5 | Friendly cards beside it cannot be taken for their first two turns. |
| 27 | the guide | 6/5 | As it lands, swaps the two cards standing either side of it. |
| 28 | the thread | 5/6 | Takes both ends of the road for its side. |

**Measured worth, for context:** three of these do real work (the listener, the thread, the empty
district). Sixteen measure as doing nothing. All twenty-eight together are worth about one point of
raw numbers.

## 8. The five planets — her cards

| planet | faces | home | what it does |
|---|---|---|---|
| Saturn | 9/5 | the chamber | Cannot be flipped by anything. |
| Mars | 8/6 | the jewel | Its flips carry one station further. |
| Venus | 4/7 | the listener | Permanently lowers both neighbours' facing numbers as it lands. |
| Mercury | 6/5 | the ghost | Two-faced: may be lodged either way round. |
| Jupiter | 7/8 | the bearer | Counts two. |

## 9. Levels and the quadrant grants — proposed, built, not live

| mechanic | what it does |
|---|---|
| **Level 1, raw** | The card's numbers, no signature. In the shuffle, not much use in hand. |
| **Level 2, awake** | The signature works. |
| **Level 3** | The signature plus the card's quadrant grant. |
| **Level 4** | Undesigned. Currently identical to level 3 in the engine. |
| **Byakko** (1-6, 28) | The guard, and a tap: lock this station's ground permanently. |
| **Suzaku** (7-13) | A tap: strike your neighbours again from where you stand, turning first if two-faced. |
| **Seiryuu** (14-20) | Two-faced. May be lodged either way round. **No tap** — its grant is spent on landing. The only grant that measures as working. |
| **Genbu** (21-27) | A tap: come back to hand to be lodged again. |
| **The tap** | A second action in your turn that does not cost you the turn. Once per card per board. Only on cards you brought yourself. |

## 10. Board-wide rules the mansion can carry — proposed

Tested. The rule that came out of it: **a mansion's trait changes the geometry, never the
arithmetic.** Positional traits raise both difficulty and skill; power traits raise difficulty and
lower skill.

| trait | what it does | measured |
|---|---|---|
| **It leads** | The mansion takes the opening move every board. | harder, skill up |
| **Its station counts double** | Station 1 is worth an extra point to whoever holds it. | harder, skill up most |
| ~~It wins ties~~ | Tied counts go to the mansion. | harder, **skill down** |
| ~~An extra card~~ | Eight cards instead of seven. | harder, **skill down** |

## 11. Dials the engine exposes

`grantSides`, `l4`, `tapMode`, `skyCanTap`, `tapOwnCardsOnly`, `tapCostsTurn`, `boss`, `budget`,
`tieRule`, `jupiterMode`, `maneFair`, `len`, `depth`, `youDepth`, `levels`, `homes`, `silence`,
`legacyBase`. All the level-3 and tap dials default off; the engine plays exactly as it did before
unless one is set.

---

## What is deliberately *not* in the engine

- **No cost or energy.** Every card is free to play. One per turn, always. This is the largest
  structural difference from Magic and Slay the Spire and it is why abilities measure as worth so
  little.
- **No card draw or cycling.** Your hand is what you were dealt.
- **No deck thinning or removal.**
- **No player-side tempo.** The throne's turn-in-place is live in the client but the simulation
  cannot model a player choosing when to spend it.
- **No catch-up mechanism** except the heart, which is one card.

### Source

`research/ref-boss.js`. Every row above traces to a specific line in `faceOf`, `slotW`, `ctxOf`,
`lodge`, `tryFlip`, `resolve` or `mkGame`.
