# What Slay the Spire and Magic are built on, and what Manzil is missing

**26 August 2026.** A deep dive on the two games Justin named, mapped onto what we have actually
measured in Manzil. Research from primary design sources: Rosewater's *Making Magic* columns and
Giovannetti's interviews and the StS wikis. Measurements from `research/ref-cost.js`, a new build.

---

## The one-line version

> **Slay the Spire and Magic are both built on a per-turn budget that forces a choice among
> several available cards. Manzil places exactly one card per turn, so it has no such choice, and
> that is why twenty-eight hand-designed abilities measure as worth about one point of raw stat.**

Everything below is that sentence with evidence under it, including a test I ran that failed and
taught me the sharper version.

---

## 1. What the two games actually run on

**Slay the Spire.** Three energy a turn. You draw five cards. You play two to four of them and
discard the rest. Giovannetti says the cost system exists because he wanted players *"to strategize
hand management rather than simply play everything available."* Every turn is a small knapsack
problem against a deadline you can see.

**Magic.** Rosewater, on why costs exist at all: *"By making spells have a cost, you are able to
make different cards important at different parts of the game."*

Unpack that, because it is the load-bearing idea. **In a system with no cost, cards compete on one
axis: raw power.** On one axis there is exactly one best card and everything else is strictly
dominated. Design space collapses to a point. **Cost adds a second axis, and two axes give you a
frontier instead of a maximum** — a cheap modest card and an expensive great one are both
undominated, because they are good at different moments. That is what makes a twenty-thousand-card
game possible instead of a twenty-card one.

**Manzil has one axis.** You place one card per turn, always, for free. So every card is compared
to every other card on a single question: which is stronger here. An ability can only add power,
and adding power to a card you were going to play anyway is worth very little.

**That is the mechanism behind the measurement.** Twenty-eight abilities, worth about +1 to every
card's numbers, is not twenty-eight badly designed abilities. It is what one axis does.

## 2. I tried to add a cost. It did not work, and the failure is the finding.

I built a lodging cost into the engine: a budget of nights per board, a card lodged on its own
mansion is free, anywhere else costs one. Thematically clean, uses `isHome` which already exists.
Sixty of sixty vectors still pass, and with no budget set it is 2,000 of 2,000 identical to before.

Road nine, seven cards each, her hand at level three with taps, two seeds:

| budget | careful | casual | **gap** | blowouts | cards placed |
|---|---|---|---|---|---|
| none (today) | 36.7 | 21.3 | **15.4** | 48% | 9.0 |
| 6 | 36.7 | 21.3 | 15.4 | 48% | 9.0 |
| 5 | 36.7 | 21.3 | 15.4 | 48% | 9.0 |
| 4 | 41.9 | 27.1 | 14.7 | 50% | 8.7 |
| 3 | 54.9 | 41.2 | **13.7** | 46% | 7.3 |

And the ability question directly, every card awake versus every card asleep with +1 to its numbers:

| budget | all abilities on | no abilities, +1 numbers | abilities are worth |
|---|---|---|---|
| none | 36.7 | 33.8 | +2.9 |
| 5 | 36.7 | 33.8 | +2.9 |
| 4 | 41.9 | 42.0 | −0.1 |
| 3 | 54.9 | 57.1 | **−2.2** |

**The gap narrows and the abilities get worse.** The opposite of the prediction, twice.

**Why.** In Slay the Spire the budget binds *inside a turn*: five cards available, three energy, so
you choose two or three and leave the rest. In Manzil you place one card per turn no matter what. A
budget therefore does not make you choose *between cards*, it makes you *stop early*. It is a
turn-count limit wearing a cost's clothing.

> **You cannot budget a resource that is already rationed to one.**

Which sharpens the diagnosis considerably: Manzil's problem is not that cards lack a price. It is
that **a turn contains exactly one decision**, so there is nothing for a price to arbitrate.

## 3. The law that follows, and it is already in our data

If a turn holds one decision, then the only way to make an ability worth something is to give the
turn **another kind of decision**. Not more power. More decisions.

Every measurement this project has taken says the same thing once you read it this way:

| what we measured | worth | what kind of thing it is |
|---|---|---|
| the turn grant, cards lodge either way round | **+7.1** | **a second decision: which face** |
| the tap, act on a card already standing | **~+5 gap** | **a second decision: whether to tap** |
| the guard, cannot be flipped by a tie | +1.2 | a condition on an existing decision |
| the lead, steals the opening move | +1.8 | a condition |
| the return, comes home once | +1.6 | a condition |
| sixteen of twenty-eight signatures | under +3.5 | almost all conditions |

**Every effect that added an option worked. Every effect that added a condition did not.** That was
visible in the L3 handoff as an observation. It now has a mechanism behind it: an option widens the
decision space, a condition only reprices a decision you were already making, and a depth-eight
search reprices better than a person does.

**Design's tap redesign was more right than any of us said at the time.** It is not a card power.
It is a second decision per turn, which is the axis the game does not otherwise have.

## 4. The thing to be careful about, and it is exactly what Justin flagged

He wrote: *"best card combo in sls can basically determine whether you win or lose at the highest
challenge."* True, and Slay the Spire gets away with it for one reason: **the player built that
deck.** Drafting is the game. Giovannetti's favourite part is *"the actual building of your deck."*
Losing to your own construction is a lesson; winning with it is authorship.

**Manzil's deck is a birth chart. The player did not build it.** So if card power decides games
here, you get all of Slay the Spire's determinism and none of its authorship. That is the one
import that would be actively poisonous.

Which is an argument *for* keeping abilities modest and putting depth in play rather than in
cards — which is what Justin said he wanted, and what the numbers independently support. Worth
naming that these agree, because it means the cheap path and the good path are the same path here.

## 5. Five things to take from these games that do fit

Ranked by value against effort, and all five happen to fit the astrology rather than fight it.

### 1. Show what the sky will do

Slay the Spire's Intent system is its keystone. Enemies originally did **not** telegraph; the team
added a preview, then icons, and found that showing the **exact number** rather than a symbolic
range raised engagement and depth. The stance is *randomness in the inputs, determinism in the
resolution* — you never lose to a die roll mid-fight, you lose to a decision made under known
information.

**Manzil's sky is already a deterministic agent.** Her move is computable before she makes it. So
this is nearly free: show what she will play and where. It converts every turn from a guess into a
solvable problem, which is the single largest source of skill expression in Slay the Spire, and we
currently give it away for nothing.

The measure of how much this is worth: Runic Dome, the relic that *hides* Intents, is priced at a
whole extra energy. The designers know exactly what that information costs.

### 2. Let the player choose which cards they bring

Removal and thinning are Slay the Spire's real progression. The asymmetry is exact: **adding a card
is a bet, removing one is a proof.** Adding raises your ceiling and lowers your floor; removing
raises your floor and touches nothing else. Roguelikes kill you on your floor.

Manzil has no thinning, no removal, no drafting. But it has a natural version sitting unused:
**choose seven of your twelve before the board.** That is a real construction decision, it happens
every night, it costs one screen, and it turns the chart from a hand you were dealt into a hand you
selected from. It also creates the pressure Slay the Spire gets from the Skip button — a reason not
to want every card.

### 3. Relics, which is to say transits

Relics are permanent, always-on, never drawn, and immune to deck dilution. That is what makes them
structurally different from cards: a card's value is probabilistic, a relic's is certain. And they
set a run's thesis before the deck exists. Giovannetti: *"I didn't want it where you play the game
and every time you build the same deck because I think it's actually pretty boring."*

**Tonight's transits are relic-shaped and we already compute them.** An always-on modifier, not
chosen by the player, that changes what tonight's board rewards. Mars somewhere makes ties bite;
Saturn somewhere makes ground stick. It makes the daily board genuinely different instead of the
same board with a different mansion name, and it is the only mechanism on this list that adds
variety without adding content.

### 4. A catch-up feature, because we do not have one

Rosewater lists it as a **need**, not a nicety: *"A game becomes frustrating if a player feels like
he or she has no chance to win... Once you no longer believe you can win, the game stops having
pull."* In Magic the mana curve does the job — the player who is behind keeps drawing cards that
are live.

**Manzil measures 45 to 60 percent blowouts.** That is a game with inertia and no catch-up. Half
the boards stop being games partway through, in Rosewater's literal sense: *"A game needs to have
decisions, and those decisions must matter."*

There is no clean existing candidate for this and it needs design work. The shortest road is the
last placement being worth more, or the trailing side drawing a card. It should be deliberate.

### 5. Lenticular cards, which we half have already

Rosewater's term for a card that reads simply to a beginner and deeply to an expert, *at the same
time*. It works because **strategic complexity is invisible to novices** while comprehension and
board complexity are not. That asymmetry lets you keep the depth that retains experts while cutting
the complexity that repels newcomers.

**Manzil's familiarity law is lenticular design, mechanically enforced** — the card sheds its name
and its text as you level it, so the same object reads differently depending on how much you know.
That is genuinely good and nobody has named it as the strength it is.

The one caution from Rosewater's rules: **the surface reading has to be correct.** His failed
example is a card whose obvious play punishes the beginner. Our version of that risk is a card
whose text is hidden exactly when its ability turns on, which Design already flagged.

## 6. What I would actually change

1. **Stop trying to make abilities stronger.** They are on the wrong axis. Every point of power you
   add gets arbitraged away by a search that is better at arithmetic than any player.
2. **Make each turn hold more than one decision.** The tap is the model. Which face, whether to
   tap, whether to hold. Those are the effects that measured.
3. **Show the sky's move.** Cheapest large win available.
4. **Let the player pick seven of twelve.** Gives the chart authorship without giving up its
   meaning.
5. **Design a catch-up mechanism on purpose.** The blowout rate is the symptom and nothing on the
   roadmap addresses it.
6. **Do not let cards decide games.** Slay the Spire can afford that because the player built the
   deck. We cannot, because the sky did.

### What was not tested

Multi-card turns. If the turn structure changed so a player could lodge more than one card, a real
cost system becomes possible and everything in section 1 applies directly. That is the largest
untested lever and it is a genuine fork in the road rather than a tuning question.

### Sources

Rosewater, *Making Magic*: ["Lenticular Design"](https://magic.wizards.com/en/news/making-magic/lenticular-design-2014-03-31),
["New World Order"](https://magic.wizards.com/en/news/making-magic/new-world-order-2011-12-05),
["Mana Action"](https://magic.wizards.com/en/news/making-magic/mana-action-2011-05-30),
["Ten Things Every Game Needs"](https://magic.wizards.com/en/news/making-magic/ten-things-every-game-needs-part-1-2011-10-24),
["Kind Acts of Randomness"](https://magic.wizards.com/en/news/making-magic/kind-acts-randomness-2009-12-14),
["What Is a Game?"](https://magic.wizards.com/en/news/making-magic/what-game-2018-06-04).
Giovannetti: [PC Gamer interview](https://www.pcgamer.com/slay-the-spire-designer-discusses-new-characters-and-card-game-inspirations/),
[Game Developer on data-driven balance](https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder).
Slay the Spire mechanics: [Ascension](https://slay-the-spire.fandom.com/wiki/Ascension),
[Relics](https://slay-the-spire.fandom.com/wiki/Relics), [Merchant](https://slay-the-spire.fandom.com/wiki/Merchant).

**One correction worth recording:** the widely-quoted "New World Order rules" with numeric limits
(squared creature stats, an eleven-word text limit, a twenty percent vanilla quota) are from
Rosewater's **April Fools** column, not the real one. The real New World Order has no numbers in it,
only the principle that complexity is a budget spent at higher rarities.
