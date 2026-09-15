# The tap, measured — 25 August 2026, late

Design asked for these numbers to come off a harness on paired boards, per seat, before any of it
counts as canon. Here they are.

**First: the Throne correction is accepted.** It was implemented, gated on `throneUsed`, wired to
the slot tap. The zoom copy was telling the truth and my handoff called it a debt. That was wrong,
it is corrected in the record, and the vermilion bird generalising it is a better outcome than the
one I proposed.

**What I built.** The tap, to Design's spec, on the generation-D reference:
`research/ref-tap.js`. One move kind, three quarters, `inPlace` semantics (nothing is lodged, no
lodge signature fires twice), free, keeps the turn, once per card a board.

| gate | result |
|---|---|
| engine conformance vectors | **60/60** |
| new tap vectors, three quarters × two seats | **18/18** (`research/tapvec.js`) |
| level-2 differential vs the reference | 1,966/2,000 — exactly the 34 boards the return fix moves, nothing else |

784 boards a cell, standard error 1.8pp. **Anything under about 3.5pp is not real.**

---

## The headline, and then the asterisk

Level 3, rung 9, the mansion's own sky. The player's win rate.

| build | careful | casual | gap |
|---|---|---|---|
| no grants — what L3 does today | 26.1 | 19.3 | 6.9 |
| the old passive grants | 37.1 | 19.4 | 17.7 |
| **the taps, exactly as built** | **48.2** | **27.8** | **20.4** |

**The tap redesign beats the passive grants on every axis, and it is the first thing measured all
session to clear the 20-point skill-gap target.** Design's instinct was right and the numbers back
it.

**Now the asterisk, and it is large.** That 20.4 is borrowed from two things that are not decided
yet, and both are currently set to the setting that flatters the player.

| build | careful | casual | gap |
|---|---|---|---|
| the taps, exactly as built | 48.2 | 27.8 | 20.4 |
| only cards that started in your hand may tap | 38.6 | 22.2 | 16.5 |
| as built, but her agent can tap too | 36.1 | 22.8 | 13.3 |
| **both settled fairly** | **30.0** | **18.0** | **12.0** |

Settle both the honest way and the tap redesign lands **below** the passive grants it replaced.
That is not an argument against the tap. It is an argument that the tap is not what was carrying
the number.

---

## 1. The one nobody has raised: can you tap a card you captured?

`tapKind` checks slot ownership. A card you took from her is a card you control. **So as built, you
can tap her cards once you have taken them.** Worth 9.6 points at rung 9.

And it has an edge that should stop the build:

> Capture her black tortoise card. Tap **call it home**. It comes off the board and into **your**
> hand, permanently. You have stolen a card out of her deck with one tap.

Verified directly: card 221 lodged by her, flipped to the player, `tapKind` returns `home`, and the
returning id goes to the tapper.

**This is the same defect as this morning's return bug arriving through a new door.** That one sent
every returning card to the player's hand regardless of owner. This one lets the player claim her
card deliberately. Fourth instance of the family. I said to assume there was a fourth.

**Recommendation: only cards that started in your hand may tap.** `g.C[id].who === own`, one
condition in `tapKind`. It costs 9.6 points of measured player advantage, which is the point:
that advantage was not real.

If Design wants captured cards to stay tappable for the strike and the lock, that is arguable and
I would listen. But **call it home must never fire on a card you did not bring**, or the tap is a
card-theft engine.

## 2. Her agent not tapping is worth 12 points

Design flagged this and said it does not matter today because walker fives are L1 vanilla. That is
true today. It is worth **12.1 points** the moment it stops being true, which is the moment her
hands wake or PvP deals both sides at true levels.

Per quarter, with both questions settled fairly and both sides able to tap:

| quarter | in the player's hand only | both sides |
|---|---|---|
| vermilion bird, strikes again | 31.3 | **22.2** |
| white tiger, locks its ground | 26.4 | 26.4 |
| black tortoise, comes home | 26.3 | 26.0 |

Against a 26.1 baseline: the strike is the only one that does anything, it is worth **+5.2** in the
player's hand, and when she can use it too it goes to **−3.9** — she uses it better than the player
does. The lock and the come-home are inert in every symmetric configuration.

She uses it better because she is holding seven cards and the player is holding five. Which is the
next section, and it is the real finding.

## 3. The actual problem is hand size, and it is not an ability problem

Her hand grows with level. Five, six, seven, eight. **The player's is five at every level.**

So every symmetric ability is worth more to whoever holds more cards, and that is always her. This
is the third time today the same shape has produced a wrong-looking result, and it explains a
pattern going back much further: sixteen inert signatures, three inert L3 grants, and a skill gap
that has never once hit its target in any configuration measured this session.

The fair build — symmetric taps, own cards only, her agent tapping — varying only the player's
hand:

| the player's hand | careful | casual | gap |
|---|---|---|---|
| 5 (today) | 33.5 | 19.6 | 13.9 |
| 6 | 44.1 | 23.2 | 20.9 |
| **7 (matching hers at L3)** | **51.9** | **28.2** | **23.7** |

**Match her hand size and the target lands, honestly, with no asymmetric help.** Careful 51.9
against a 55-65 band, gap 23.7 against a 20+ target. Nothing else measured this session gets close
without borrowing from an unfinished system.

*Method note: this table widens the pack to nine so a seven-card hand can be dealt, so its rows are
comparable to each other but not to the tables above, where the pack is seven. The shape is what
matters and the shape is monotone and steep.*

**I am not proposing the player's hand becomes seven tomorrow.** Twelve to fourteen cards for nine
slots changes the board's whole character and runs straight into Code's second-mover finding. What
I am saying is that **the ability redesigns have been fighting a structural asymmetry**, and that
one dial moves the number further than every ability change made today put together.

## 4. The free tap is fine. The reasoning for it is not.

Design reasoned that a tap costing a turn would never be taken, since a turn is worth more than any
of the three.

| | careful | casual | gap |
|---|---|---|---|
| the tap is free | 36.1 | 22.8 | 13.3 |
| the tap costs a turn | 37.1 | 25.1 | 12.0 |

Every difference is inside the noise floor, **and the taps are still taken.** The mechanic does not
collapse when it costs a turn; it plays about the same.

So keep it free, because free feels better and nothing argues against it. Just do not keep it free
on the grounds that the alternative is unplayable, because it is not. Cheap decision, correctly
made, wrong reason.

## 5. The forced turn can cost the throne its strike

Design's spec: the vermilion bird strikes "turning first if it has two faces." That is
unconditional in the build, and it can be bad. Proven in a vector:

> The throne stands at 7/9 beside her void, which shows 9. Its right face of 9 would tie and take
> it. The tap turns it first, so it strikes with 7 and the void holds.

**Should the turn be optional?** A tap that offers turn-then-strike *or* strike-as-you-stand is one
extra branch and strictly better for the player. If the answer is that the turn is the flavour and
it stays mandatory, that is a fine answer, but it should be a decision rather than a side effect of
the sentence.

## 6. What I would hand back

1. **Gate the tap to cards that started in your hand.** One condition. Do it before anything else;
   as built, call-it-home steals cards out of her deck.
2. **Decide whether the throne's turn is optional.** One branch either way.
3. **Build the tap into her agent.** Design already named this as next and it is right, but note it
   costs 12 points when it lands, so the difficulty pass has to come after it, not before.
4. **Then re-measure.** These numbers are the fair build's, and the fair build is not what is
   running today.
5. **Separately, and bigger than L3: put the player's hand size on the table.** It is the one dial
   that reaches the target without borrowing.

### Files

| what | where |
|---|---|
| the engine with the tap | `research/ref-tap.js` |
| the 18 tap vectors | `research/tapvec.js` |
| the measurement runs | `research/taps.js`, `research/taps2.js`, `research/handsize.js` |

Every number above is from `ref-tap.js`, 25 August, 60/60 engine vectors and 18/18 tap vectors.
