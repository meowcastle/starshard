# The level-2 choice, measured card by card

**26 August 2026.** Engine: `research/v2.js`, purpose-built for this, **28/28 signature vectors**
before a single number was taken. Nine stations, seven a hand from all twenty-eight, no tie cascade.
896 boards a cell, two seeds. The test card is guaranteed into the player's hand; everything else in
the deck is awake, so this measures the marginal value of *this card's choice* inside a real deck.

**5 signature wins · 7 a real choice · 16 numbers win.**

---

| # | card | quad | signature | +1/+1 | choice |
|---|---|---|---|---|---|
| 7 | the return | suzaku | 74.3 | 59.4 | **+15.0** |
| 24 | the void | genbu | 65.0 | 52.5 | **+12.5** |
| 1 | the gate | byakko | 58.5 | 50.3 | **+8.1** |
| 22 | the listener | genbu | 57.9 | 53.0 | **+4.9** |
| 23 | the drum | genbu | 60.0 | 56.8 | **+3.2** |
| 28 | the thread | byakko | 56.8 | 55.7 | +1.1 |
| 5 | the blaze | byakko | 55.4 | 55.4 | 0.0 |
| 9 | the glance | suzaku | 52.8 | 53.0 | −0.2 |
| 10 | the throne | suzaku | 68.0 | 68.9 | −0.9 |
| 15 | the veil | seiryuu | 54.5 | 55.8 | −1.3 |
| 2 | the bearer | byakko | 47.7 | 49.7 | −2.0 |
| 19 | the root | seiryuu | 61.5 | 63.7 | −2.2 |
| 3 | the gathered stars | byakko | 59.5 | 62.5 | −3.0 |
| 20 | the flock | seiryuu | 56.5 | 59.6 | −3.1 |
| 17 | the crown | seiryuu | 55.0 | 58.3 | −3.2 |
| 25 | the hideaway | genbu | 52.0 | 55.5 | −3.5 |
| 26 | the chamber | genbu | 55.2 | 58.7 | −3.5 |
| 27 | the guide | genbu | 51.7 | 55.2 | −3.6 |
| 21 | the empty district | genbu | 57.7 | 62.3 | −4.6 |
| 13 | the hand | suzaku | 51.8 | 56.7 | −4.9 |
| 14 | the jewel | seiryuu | 60.7 | 65.6 | −4.9 |
| 12 | the turning | suzaku | 56.4 | 61.3 | −4.9 |
| 6 | the storm | byakko | 55.4 | 60.9 | −5.6 |
| 4 | the follower | byakko | 59.2 | 66.9 | −7.7 |
| 11 | the mane | suzaku | 48.7 | 57.0 | −8.4 |
| 18 | the heart | seiryuu | 56.9 | 66.1 | −9.2 |
| 16 | the claws | seiryuu | 50.7 | 60.7 | −10.0 |
| 8 | the ghost | suzaku | 49.7 | 61.0 | **−11.4** |

---

## Four patterns, and three of them are fixable

### 1. Anything that helps both sides loses badly

The three worst-behaved effects in the deck all give the opponent the same gift they give you.

- **the ghost** (−11.4): warms a neighbour two higher, *whoever holds it*
- **the mane** (−8.4): lifts both neighbours, *whoever holds them*
- **the hideaway** (−3.5): shelters both neighbours, *whoever holds them*

This is the fourth time in this project that a symmetric effect has measured as a loss. The
opponent's search is better at arithmetic than a person is, so it exploits a shared buff harder than
the player does. **Give the opponent nothing.**

**Fix:** the ghost warms your card and the warmth is lost if the card changes hands. The mane lifts
only the cards you hold. The hideaway shelters only your side. All three keep their lore, which was
never about generosity to an enemy.

### 2. One-shot placement effects sit under the bar, exactly as predicted

**the claws** (−10.0), **the heart** (−9.2), **the flock** (−3.1), **the root** (−2.2). All fire
once, on landing, on one or two targets. +1 on both faces helps in every fight that card is ever in,
and one clever placement cannot match that.

**Fix:** make them persistent or repeatable. The claws should push *every* enemy card that lands
beside them, not one on arrival. The heart's tap should be usable every turn it is on your side
rather than once a board.

### 3. Count effects are where the value is

Three of the five winners are Genbu counts: **the void, the listener, the drum**. The count is
guaranteed at the end of the board, so a count effect cannot be played around. Faces can be dodged;
the count cannot.

Worth knowing when writing the remaining twenty-seven mansion rules and any future card.

### 4. The bump is worth more on a high-faced card, which is a real design fact

+1 on an **8/7** makes a **9/8**, which is close to unbeatable. +1 on a **9/3** makes a **9/4**,
because nine is the ceiling.

That is most of why the follower (8/7), the heart (8/7) and the jewel (8/7) lose to numbers while the
void (9/3) and the return (7/7 with a big signature) do not. **Cards with high faces are numbers
cards.** That is not a bug and it should not be balanced away. It means the level-2 choice is
*card-dependent in a way a player can learn*, which is exactly what makes it a decision worth making.

The three cards where I would simply accept "numbers win": the follower, the jewel and the heart.
They are beaters and the game should say so.

## What I would change, and what I would leave

**Change, because they are broken rather than merely losing:**

| card | now | change to |
|---|---|---|
| the ghost | warms whoever holds it | warms your card; the warmth goes when the card does |
| the mane | lifts whoever stands beside it | lifts only cards you hold |
| the hideaway | shelters whoever stands there | shelters only your side |
| the claws | pushes one card on landing | pushes every enemy card that lands beside it |
| the heart | one tap a board | a tap every turn it is yours |

**Leave alone, because losing to numbers is the right answer for them:** the follower, the jewel, the
heart's faces, and the throne, which is already a coin flip at −0.9 and is doing exactly what it
should.

**Watch, because they win by a lot:** the return at +15.0 and the void at +12.5 are outside the band.
The return's delayed strike may want to fire once rather than on both neighbours; the void's tax may
want to be one side rather than two.

## The honest verdict

Sixteen of twenty-eight is too many cards where the choice is fake. But the old set measured as worth
about **+1.4 across all twenty-eight together**, and this one has five cards individually worth more
than that. The direction is right and the remaining work is specific rather than structural.

**One more pass on the five broken effects and the two runaways should land it near half and half,
which is where a real choice lives.**

### Files

`research/v2.js` (the engine), `research/v2vec.js` (28 vectors), `research/v2meas.js` (this table),
`research/v2meas.json`.
