# Draw and Deck Architecture

### Research for *Manzil* — hand size, deck size, draw rate, consistency, dilution

---

**How to read the claim flags in this document**

| Flag | Meaning |
|---|---|
| **[Q]** | Direct quotation from a named source, linked inline |
| **[P]** | Paraphrase of a source's argument — the source says this, but not in these words |
| **[CALC]** | My own arithmetic, computed for this report. Not from a source. Method shown |
| **[UNVERIFIED]** | Widely repeated but I could not source it to a primary or authoritative page |

Every game-rules number below is sourced or flagged. Where two sources disagreed I say so.

---

## 0. The one metric that organises this whole question

Before the case studies, the frame. Almost every design decision in this brief collapses into a single ratio:

> **Deck exposure** = (cards you actually see in one game) ÷ (cards in your deck)

That number decides whether a deck is a *plan you execute* or an *identity you inhabit*. Everything else — mulligans, Discover, thinning, choose-1-of-3 — is machinery for moving that number, or for buying back agency when the number is low.

Here is the landscape. Rules numbers are sourced in the sections below; the exposure percentages are **[CALC]** (simple division; two-card-combo figures use the hypergeometric distribution).

| Game | Deck | Cards seen per game | Exposure | P(specific card) | P(both of 2 specific) |
|---|---:|---:|---:|---:|---:|
| Marvel Snap | 12 | 9 | **75%** | 75.0% | 54.5% |
| Balatro (per blind, ceiling) | 52 | ~38 | **~73%** | — | — |
| Gwent | 25 | 16 | **64%** | 64.0% | 40.0% |
| Slay the Spire (Ironclad opener) | 10 | 5/turn → all 10 every 2 turns | **100%/2 turns** | — | — |
| Dominion (opening deck) | 10 | 5/turn → all 10 every 2 turns | **100%/2 turns** | — | — |
| Hearthstone (~turn 8, on the play) | 30 | ~11 | **37%** | 36.7% | 12.6% |
| Magic (~turn 6, on the play) | 60 | ~12–13 | **~21%** | 21.7% | 4.4% |
| **Manzil option (a): draw-3 from 28** | **28** | **7** | **25%** | **25.0%** | **5.6%** |
| Manzil variant: draw-3 from 14 | 14 | 7 | 50% | 50.0% | 23.1% |
| Manzil variant: draw-3 from 12 | 12 | 7 | 58% | 58.3% | 31.8% |
| Manzil variant: draw-3 from 9 | 9 | 7 | 78% | 77.8% | 58.3% |

**The headline for this project, stated up front:** the proposed draw-3-from-28 sits at **25% exposure — Magic territory**, not Snap territory. A 28-card deck in a game with five placements per board gives you *less* control over your draw than a 60-card Magic deck gives a Magic player, because Magic at least plays out over more turns with mulligans and card selection. Manzil would have neither.

The Snap comparison is the one to internalise. Snap and Manzil are structurally near-identical — short game, few placements, a board that fills — and Snap answered the same question with **12 cards, not 28**.

---

## 1. Marvel Snap: the deliberately tiny deck

### The rules

Marvel Snap decks contain **exactly 12 cards, with no duplicates permitted** — [BlueStacks' guide states](https://www.bluestacks.com/blog/game-guides/marvel-snap/mvsn-deck-building-guide-en.html): **[Q]** *"Each deck in Snap can contain up to 12 cards each, and none of these cards can be duplicates of one another."*

The draw structure, as [Zvi Mowshowitz summarises it](https://www.lesswrong.com/posts/hNa4JBgtuhb8tY3je/marvel-snap-phase-1): **[Q]** *"Decks are twelve unique cards. Games last at most six turns. You start with three cards and draw one each turn."*

So: **3 + 6 = 9 of 12 cards seen. 75% exposure.**

### Why 12 — in the designers' own words

Ben Brode, [on X](https://x.com/bbrode/status/1584762939868737537), reproduced [here](https://outof.games/news/5513-ben-brode-on-marvel-snaps-lack-of-mulligan-developer-insights/):

> **[Q]** *"In Marvel Snap, we wanted decks to be really small. Deckbuilding is one of the hardest things for players to do in card games. Generally, the smaller the deck, the less variance you have."*

Two distinct reasons in one sentence, and they are worth separating:

1. **Deckbuilding cost.** A 12-card deck is a tractable authoring task. This is a *player-facing UX* argument, not a variance argument.
2. **Variance.** Smaller deck → higher exposure → the deck you built is the deck you play.

To the Guardian, [Brode added](https://www.pressreader.com/usa/the-guardian-usa/20221112/282024741243323): **[Q]** *"a 12-card deck is actually not that different strategically from traditional collectible card games"* — and, on the design brief that produced it, **[Q]** *"I had this craving for a bite-size experience that had all of the fun and strategy that makes me such a card game fan"*, plus **[Q]** *"complexity is a huge one. We have to make really elegant designs that have low complexity, but lots of depth."*

Kent-Erik Hagman, Snap's associate design director, [gave the sharpest operational version of the point](https://www.gameshub.com/news/features/marvel-snap-designer-interview-kent-erik-hagman-smart-card-game-design-31692/), explaining why he restricts card-draw effects:

> **[Q]** *"it's only a 12-card deck, drawing one card is very significant compared to if your deck was 50 or 75 cards."*

And on the perceived-simplicity trap: **[Q]** *"You think, 'Oh, there's only six turns and there's only twelve cards, how complicated could it be?'"* He also framed the small pool as a **learnability** asset: **[Q]** *"With the small pool of Marvel Snap cards, I do kind of innately learn that stuff more easily because there are only so many things that can counter other things."*

> ⚠️ **Note on the GDC talk.** The brief cites GDC 2023's *"Designing MARVEL SNAP."* I could not obtain a transcript or slide deck containing a "why 12" passage. The [one public write-up I found](https://stevelilley.com/2026/03/17/gdc-talks-gdc-2023-designing-marvel-snap/) covers the talk's *other* themes — designers as **[Q]** *"chefs that collect ideas as ingredients"*, the principle **[Q]** *"zero sum games = zero fun"*, the doubling cube generating **[Q]** *"little victories for the losing players"*, and Richard Garfield's luck/skill spectrum — but says nothing about deck size, hand size, or draw rate. **The deck-size reasoning above comes from Brode's and Hagman's interviews, not from the GDC talk.** Treat any claim that GDC contains a "why 12" segment as **[UNVERIFIED]**.

### The draw math, and why it is brutal

Snap's own community has done this arithmetic thoroughly. From [Marvel Snap Zone](https://marvelsnapzone.com/card-probability-calculation-in-marvel-snap/), the cumulative odds of having seen a given card:

| Turn | Cards seen | P(specific card) |
|---|---:|---:|
| 0 (opening) | 3/12 | 25% |
| 1 | 4/12 | 33.3% |
| 2 | 5/12 | 41.7% |
| 3 | 6/12 | 50% |
| 4 | 7/12 | 58.3% |
| 5 | 8/12 | 66.7% |
| 6 | 9/12 | **75%** |

[PlaySNAP's "The Brutal Odds Of Marvel Snap"](https://playsnap.pro/posts/fundamentals/The-Brutal-Odds-Of-Marvel-Snap/) pushes it to combos: a specific **two-card combo by turn 5 lands only ~42%** of the time — **[Q]** *"only 42%"*, less than a coin flip — rising to **[Q]** *"nearly 60%"* if you build in redundant backups. **[CALC]** confirms: (8/12)×(7/11) = 42.4%.

**The lesson that transfers directly to Manzil: even at 75% exposure — the highest in the comparison table — a two-card interaction is a coin flip.** In a 28-card Manzil deck seeing 7, the same two-card interaction is **5.6%** **[CALC]**. It effectively does not exist. Any Manzil design where two specific mansions combine is dead on arrival at 28 cards.

### How the deck interacts with the snap mechanic

This is the piece of Snap's architecture most often missed, and it is the one most relevant to *Manzil*'s best-of-five structure.

Snap does **not** eliminate variance. It has a 12-card deck *and* random locations *and* no mulligan. What it does is **relocate the consequences of variance out of the individual game**. Zvi again:

> **[Q]** *"At first the stakes are one cube. Each player can snap once per game, doubling that to two once the current turn ends. Stakes automatically double after turn six ends, as well, max stakes is 8 cubes. At any time, you can retreat and only lose current stakes."*

The retreat option converts "I drew badly" from a loss into a **cheap** loss. The variance is still there; the *cost* of variance becomes a decision. Hagman on the emotional effect: **[Q]** *"You can feel really good about that loss... you're smiling even though you lost the cube."* He credits the backgammon doubling cube, saying it **[Q]** *"adds all kinds of depth of strategy without creating any new gameplay mechanics."*

And here is the causal chain that matters most for *Manzil*, because it runs in the opposite direction to intuition:

Brode explains the small deck **reduced** variance, so the team **removed** the mulligan to put some back — and then had to solve the resulting complaint with content rather than systems. Early testers hated having no turn-one play. The fix: **[Q]** *"We moved Quicksilver into the starting deck"* — a card whose ability is to always appear in your opening hand. Result: **[Q]** *"Immediately, the mulligan feedback dried up. Who needs to mulligan when you always draw your 1-drop?"* Brode later noted **[Q]** *"you know what I haven't heard ONCE? 'I wish there was a mulligan'"*.

**Three transferable principles:**

1. Deck size and mulligan are a *joint* variance budget. Shrink the deck and you have spent budget you may want back elsewhere.
2. A "no playable card" complaint is usually a **content** problem, not a **system** problem. One guaranteed-opening card beat a whole mulligan subsystem.
3. Variance is more tolerable when the player controls **how much they have staked** on it.

---

## 2. Dilution, thinning, and the orthodoxy

### The math of dilution

The dilution effect is pure arithmetic, and it is strongly **non-linear in deck size** — which is precisely why it matters for a 28-card design. **[CALC]**, holding "cards seen per game" fixed at 7:

| Deck grows | P(specific card seen in 7) | Relative loss |
|---|---:|---:|
| 9 → 10 | 77.8% → 70.0% | −10.0% |
| 12 → 13 | 58.3% → 53.8% | −7.7% |
| 16 → 17 | 43.8% → 41.2% | −5.9% |
| 20 → 21 | 35.0% → 33.3% | −4.8% |
| 28 → 29 | 25.0% → 24.1% | −3.4% |

**Read this table twice.** It says the *pain* of adding a card is largest in small decks — and that is exactly why small-deck games (Snap: fixed 12; Dominion: thin aggressively) make deck size a first-class mechanic, while large-deck games can absorb filler. It also says something uncomfortable about a Slay-the-Spire-style acquisition model bolted onto 28 cards: **at 28, adding a card barely matters.** Acquisition would feel weightless. There is no tension to play with.

### Slay the Spire

Rules baseline: **draw 5 cards at the start of each turn** ([confirmed here](https://tck.mn/blog/a-slay-the-spire-puzzle/mechanics/): **[Q]** *"At the start of each turn, I draw 5 cards into my hand"*), **max hand size 10**, and **[Q]** *"if at any point I attempt to draw a card but my draw pile is empty, all the cards in my discard pile get shuffled and then moved back to the draw pile."*

Starting decks: **Ironclad 10 cards** — Strike ×5, Defend ×4, Bash ×1 ([wiki](https://slaythespire.wiki.gg/wiki/Ironclad)); **Silent 12 cards** — Strike ×5, Defend ×5, Survivor ×1, Neutralize ×1 ([wiki](https://slaythespire.wiki.gg/wiki/Silent)).

**The structural fact that drives the whole orthodoxy:** at 10 cards and 5 drawn per turn, you cycle your entire deck **every two turns**. Deck size is not a background statistic; it is the number of turns before your good card comes back around.

Card acquisition is a **choose-1-of-3-or-skip**: [the wiki states](https://slay-the-spire.fandom.com/wiki/Card_Rewards) **[Q]** *"Each card reward allows the player to choose one of three cards, but the player can also skip the card reward altogether."* Rarity weights are 60/37/3 (common/uncommon/rare) after normal fights, 50/40/10 after elites, 100% rare after bosses, with a rarity-offset system that increases rare odds after runs of commons. Relics modify the offer width: **Question Card** → 4 cards, **Busted Crown** → 1 card.

**Community consensus** — with the important caveat that it is *not* "always thin":

- The pro-thinning case, from a [Steam thread](https://steamcommunity.com/app/646570/discussions/0/1692662484248176283/): **[Q]** *"3 strike, 5 offense, 5 defense: the bad strike take 23% of the deck"* versus **[Q]** *"3 strike, 15 offense, 15 defense: the bad strike take 9% of the deck."* Same thread's stated workable range: **[Q]** *"20~35 seem fine"*, and **[Q]** *"until you're good enough at the game, a deck bigger than 30 cards is more often than not a death sentence."*
- The [strategy guide at slaythespire.gg](https://www.slaythespire.gg/guides/strategy) frames Powers as doubly good because **[Q]** *"you gain a permanent benefit and your deck gets slightly thinner, improving consistency"*, and treats forced additions as the enemy: Book of Stabbing **[Q]** *"diluting your deck and choking your turns"*, Slaver Trio **[Q]** *"reducing consistency."*
- The dissent, from [another Steam thread](https://steamcommunity.com/app/646570/discussions/0/3428846977645038666/): **[Q]** *"don't be afraid to fatten your decks up a bit. Every card you add that is better than a basic strike/defend increases the average value."* Which is the correct refinement — **dilution is about average card quality, not card count.** Adding an above-average card to a below-average deck is an improvement even though it lowers the draw odds of every individual card.
- [Spire Builds](https://www.spirebuilds.com/guides/understanding-card-rewards) gives the practical heuristic: skip when **[Q]** *"Your deck is already over 25 cards"*, because **[Q]** *"Larger decks draw key cards less often."*
- [sts2front](https://sts2front.com/tips/when-to-skip-cards/) states the principle most cleanly: your deck **[Q]** *"still pays for every card you add"*, and **[Q]** *"skipping often preserves value by keeping future turns coherent."*

### Dominion, and the Chapel orthodoxy

Dominion is where thinning became doctrine. Per [Wikipedia](https://en.wikipedia.org/wiki/Dominion_(card_game)): **[Q]** *"each player gets the same starting deck of ten cards, consisting of seven Copper cards (low-value treasure) and three Estate cards (low-value victory)"*, and **[Q]** *"Each player shuffles their deck and draws the top five cards to form their hand"*, with the discard reshuffled when the deck runs out.

Ten cards, five drawn per turn: **you see your entire deck every two turns.** Identical structure to Slay the Spire's opener — no coincidence.

[Dominion Strategy's Chapel article](https://dominionstrategy.com/2010/11/17/dominion-chapel/) is the canonical text. **[P]** The site argues Chapel is the strongest card in the base game, to the point that the base set split into "games with Chapel" and "games without." Chapel trashes up to 4 cards from hand; the endgame ideal cited is a **5-card deck** of "Chapel and four Golds." The urgency argument: **[Q]** *"The more you delay, the more difficult it is to streamline your deck."* And on resilience: **[Q]** *"Chapeled decks will be so far ahead that they can usually shrug off these attacks and stay in front."*

**Why this is the most extreme datapoint available:** at a 5-card deck with a 5-card hand, exposure is **100% every single turn**. Variance is *zero*. Dominion demonstrates that if you let players thin without limit, optimal play converges on eliminating randomness entirely — and players find that *fun*, which is the real warning. Give a Manzil player unlimited thinning of a 28-card deck and they will grind it to 6 mansions and never look back.

### The counterpoint: Roguebook deliberately inverted it

Worth reading before committing to the thinning orthodoxy. Roguebook's Jean-Michel Vilain, [to Game Developer](https://www.gamedeveloper.com/design/tackling-deckbuilding-design-in-abrakam-s-roguebook):

> **[Q]** *"We've decided to go in the exact opposite direction: design the game so that the player has enough motivation to usually end up with large decks of cards."*

**[P]** The reasoning: larger decks force improvisation and prevent reliably cycling into the same combo every run. Mechanically they granted a **deck-size perk every four cards added** ([per Zvi's review](https://thezvi.wordpress.com/2021/07/05/spoiler-free-review-roguebook/)) — an explicit subsidy for dilution.

The honest verdict from that review is instructive: it partly failed. **[Q]** *"they can be quite good, and did push me towards adding cards I would not have otherwise added"* — but **[Q]** *"I never felt much temptation to go big. I'd finish with 18 or 22 cards most games, and never seriously considered going beyond 26."*

**Lesson: you can pay players to dilute, but the payment has to be large, and even then thinning instincts dominate.** If Manzil wants a large deck, the large deck must be *forced* by the rules, not incentivised.

### The forced-singleton constraint

*Manzil*'s 28 cards are 28 distinct lunar mansions. That is a **forced singleton deck** — there is no such thing as a second copy of a mansion. This is not a neutral fact, and two precedents bracket it:

- **Marvel Snap** makes singleton mandatory at 12 cards and pays for the lost consistency with high exposure (75%).
- **Hearthstone Highlander** makes singleton *optional* at 30 cards and pays for it with an enormous payoff card. The [Hearthstone wiki](https://hearthstone.wiki.gg/wiki/Highlander) states the trade explicitly: **[Q]** *"All Highlander cards have extremely powerful effects for their mana cost, which is balanced by the reduced consistency of the rest of your deck."*

**Manzil inherits singleton for free from its theme and must therefore buy consistency back somewhere else** — via deck size, draw width, or selection. It cannot buy it with redundant copies. This is the single most consequential structural fact in the brief, and it argues hard against a 28-card deck.

---

## 3. Hand size and mulligans as variance dampers

Each mechanism below manipulates a different variable. Naming which is which is the useful part.

### Magic: the London mulligan — *quality without quantity loss*

[Wizards' official announcement](https://magic.wizards.com/en/news/announcements/london-mulligan-2019-06-03): each mulligan means you **[Q]** *"draw a new hand of cards equal to their starting hand size, then puts a number of those cards equal to the number of times that player has taken a mulligan on the bottom of their library in any order."*

The stated problem: **[Q]** *"A player who mulligans once against an opponent who keeps seven cards, in general, is at more of a disadvantage than we're comfortable with."*

The evidence claim: **[Q]** *"We've tested the new London mulligan internally for more than six months"*, and the data showed it **[Q]** *"closes the gap between a player who mulligans and an opponent who doesn't, and also how it greatly reduces the number of games where a player's deck and strategy simply don't function at all."*

Lineage, per the [MTG Wiki](https://mtg.wiki/page/Mulligan): the **original** (1994) allowed a redraw only on 0 or 7 lands; **Paris** (1997) let you mulligan for any reason but each new hand was one card smaller; **Vancouver** (2015) added a scry 1; **London** (2019, standard from Core Set 2020) draws a full 7 every time and bottoms N. Designer intent, per the wiki: **[Q]** *"increased chance of a competitive game where either player might win."*

**What it actually does mechanically:** the old mulligans traded **card quantity** for a fresh random hand. London separates the two — you always *select* from 7, then pay in quantity. **The player's ability to filter is decoupled from the penalty they pay.** That is the elegant bit, and it is directly portable.

### Hearthstone — *asymmetric hand size as a first-player-advantage corrector*

Per [Blizzard's "Opening Moves: Mulligans"](https://news.blizzard.com/en-us/article/21363040/opening-moves-mulligans): the player going first sees **3 cards**; the player going second sees **4 cards plus The Coin**. Any number may be shuffled back and replaced.

⚠️ **[UNVERIFIED]** I could not find published Blizzard *design reasoning* for these specific numbers. The linked article is strategy guidance, not a design postmortem. The "asymmetric hand corrects first-player advantage" reading is my inference, not a sourced claim.

**What it does:** filters *and* dampens tempo asymmetry with one lever. Two problems, one mechanism.

### Legends of Runeterra — *free full filtering*

Opening hand of **4**; **[Q]** *"Players draw 4 cards and have the option to decide which ones to keep and which ones to replace for other random cards from the deck"* ([gamepressure](https://www.gamepressure.com/legends-of-runeterra/mulligan-card-slection/zdcf40)). Critically: **[Q]** *"The exchange of cards does not result in any penalty."*

⚠️ **[UNVERIFIED]** LoR's 40-card deck size and 10-card hand cap are widely reported but I did not confirm them on an authoritative page in this pass. Whether replaced cards can be redrawn is likewise unconfirmed here.

**What it does:** a **costless** mulligan. LoR decided the variance-reduction was worth more than the tension of paying for it. This is the maximally player-friendly end of the spectrum, and it is the natural reference point for a game like Manzil that is already fighting to preserve solvability-adjacent clarity.

### Slay the Spire — *the hand is a window, not a commitment*

Draw 5 per turn, max hand 10, discard-reshuffle. No mulligan at all, because with a 10-card deck the cycle *is* the mulligan: a card you miss this turn comes back in two.

**The general principle: high enough exposure makes mulligans unnecessary.** Snap reached the same conclusion by a different route.

### Balatro — *discards as an in-play mulligan you can spend*

Base deck **52 cards**, base hand size **8** ([Balatro wiki](https://balatrowiki.org/w/Hand_size)). Per blind: **4 hands and 3 discards** — from a [Steam thread](https://steamcommunity.com/app/2379780/discussions/0/4346606879509568633/), **[Q]** *"By default you have 4 hands and 3 discards"*, corroborated by **[Q]** *"I believe the default is 3 discards per round, so with the red deck, you should be getting 4 discards per round. Default is 4 hands per round."* Each play or discard moves **up to 5 cards** ([wiki](https://balatrowiki.org/w/Discards)), then you refill: **[Q]** *"If the number of cards in hand meets or exceeds your Hand Size, you will not draw any cards after playing a Hand or Discard unless and until the number of cards in hand is fewer than your Hand Size."*

**[CALC]** Ceiling exposure per blind: 8 + 5×(4+3−1) = **38 of 52 ≈ 73%**. In practice lower, because you usually beat a blind before exhausting your hands. Even so, Balatro's real exposure is Snap-like, not Magic-like — a fact obscured by the nominally huge 52-card deck.

**What the 8-card hand actually does:** it is not primarily a *draw* mechanism, it is a **combinatorial** one. You only play 5, so 8 means you choose 5 from 8 — C(8,5) = 56 possible plays every turn **[CALC]**. The hand is a search space, not a queue. And the discards are a **mulligan you can spend mid-combat**, with an explicit budget.

LocalThunk, [to Rogueliker](https://rogueliker.com/balatro-interview/), is candid that variance is high by design: **[Q]** *"There is a lot of randomness, possibly too much"* — and that the skill is in **[Q]** *"mitigating risk and having a build that can't be easily countered while still being powerful enough to win."*

### Summary of what each mechanism actually manipulates

| Mechanism | Variable manipulated | Cost to player | Effect on *feel* |
|---|---|---|---|
| London mulligan | Hand *quality*, paid in *quantity* | Explicit, escalating | "I was allowed to try again" |
| Hearthstone mulligan | Hand quality + tempo symmetry | Free | "The game gave me a fair start" |
| LoR mulligan | Hand quality | Free | Invisible; players don't notice it working |
| StS 5-draw / 10-deck | Deck *cycle rate* | None | "My deck is a machine, not a lottery" |
| Balatro 8-hand | Play-*combination* space | None | "I am solving, not receiving" |
| Balatro discards | Mid-game re-draw | Budgeted resource | "I chose to spend a re-roll" |
| Snap: Quicksilver | Guaranteed opening *floor* | None | "There is always something to do turn one" |
| Snap: retreat/cube | *Stake* on a bad game | Skill-gated | "Losing badly was cheap" |

---

## 4. Draw-N-of-M, open information, and the Triple Triad ancestry

### Hearthstone's Discover — the canonical variance-with-agency pattern

Discover presents **three random cards; you take one, the other two are discarded.**

The design intent, from senior designer **Mike Donais**, [quoted at SiliconANGLE](https://siliconangle.com/2015/11/12/hearthstone-devs-say-league-of-explorers-new-discover-mechanic-is-all-about-fun/):

> **[Q]** *"When you have more cards in your hand, you have more options. Having more options makes the game more fun, so we want to give you more options."*

**[P]** The same piece notes Discover deliberately limits options through the pick-one-of-three structure, mirroring Arena drafting, and that it prevents games feeling repetitive without surrendering control.

The best structural analysis is [Dominic Calkosz's "Discover the Design"](https://dominic-calkosz.com/blog/discover-the-design), which enumerates **twelve** design purposes served by the single mechanic and frames it through Jesse Schell's elegance criterion — **[Q]** *"the elegance of a game element can be measured by the number of purposes that it serves."* The central claim:

> **[Q]** *"combats this issue with an emphasis on player agency: you get to choose the card you take"*

and that Discover lets players **[Q]** *"continue to make decisions about what cards you play with *during* the game."*

The taxonomy piece — [gangles.ca, "A Taxonomy of Randomness in Hearthstone"](https://gangles.ca/2016/09/12/hearthstone-randomness/) — places Discover precisely: it draws from the whole catalogue, but **[Q]** *"discover cards present the player with 3 random options; the player draws one and discards the other two. This is powerful because the player can choose the card that best fits their situation."*

That article also raises the **cost**, which designers usually skip: Discover **[P]** dampens the emotional peaks. It **[Q]** *"fails to create the 'highs and lows' and 'novel situations'"* that raw randomness generates. The summary line is worth keeping: **Discover makes randomness feel like versatility rather than chaos** — which is great, and is also a flattening.

### The academic evidence on input randomness

The most useful hard finding for this brief: [Effect of Input-output Randomness on Gameplay Satisfaction in Collectable Card Games](https://arxiv.org/pdf/2107.08437) (IEEE CoG 2021).

**[P]** Method: a purpose-built CCG (*Dream Cage*), 18 participants, four consecutive days, Latin-square design across four conditions — input randomness only, output randomness only, both, neither. Satisfaction measured with the GUESS instrument.

Findings:
- **[Q]** *"Satisfaction in all conditions without input randomness was greater than with IR"* (p = 0.024; M = 22.991 without vs M = 21.836 with).
- **Output randomness had no significant effect** (p = 0.859).
- **[Q]** *"Input randomness significantly impacted game satisfaction in collectable card games. The game with input randomness was the least liked version in our experiment."*

⚠️ **Caveats worth stating in the GDD:** n = 18, one bespoke game, small effect size. This is suggestive, not settled. But note the direction — **it is the *draw* (input) randomness that hurt satisfaction, not the dice-roll (output) randomness.** *Manzil* currently has essentially zero input randomness on the player side. Option (a) would introduce input randomness as the primary new variance source, which is precisely the kind this study found players liked least.

### Mark Rosewater's framework — the most directly usable published guidance

[Variance, Part 1](https://magic.wizards.com/en/news/making-magic/variance-part-1-2019-12-16) defines variance as **[Q]** *"how differently a gameplay element plays out from one play experience to the next"* and maps it against a perpendicular **player choice** axis, producing a 2×2:

| | Low variance | High variance |
|---|---|---|
| **High choice** | experienced competitive players | experienced casual players |
| **Low choice** | newer competitive players | beginners |

[Variance, Part 2](https://magic.wizards.com/en/news/making-magic/variance-part-2-2020-03-02) gives ten lessons. The ones that bear on this brief:

- **Lesson 3:** **[Q]** *"High-choice, high-variance cards can show up in greater number... because they tend to add variance without making players unhappy."* → **This is the entire argument for choose-1-of-N.**
- **Lesson 5:** hide variance inside natural game elements. **[P]** Players accept "draw a card" as organic because shuffled decks are foundational to card games; the same randomness delivered by a coin flip reads as arbitrary.
- **Lesson 6:** enable player mitigation — pairing random effects with selection effects (scry alongside cascade) makes randomness feel manageable rather than oppressive.
- **Lesson 7:** avoid high-variance *symbols*. Coin flips *signal* "pure luck" more strongly than library manipulation does, even at identical actual variance.
- **Lesson 10:** **[Q]** *"It's a tool. It can be used to make games better or make games worse. It matters how you use it."*

**Lesson 7 has a specific implication for Manzil's astrology skin:** drawing a mansion from a shuffled deck reads as *fate*, which is thematically load-bearing. A "roll to see which mansion" would read as arbitrary. Same mathematics, very different reception. The theme is doing free work here — use it.

### Gwent — the "see most of your deck" model

Per the [Gwent wiki](https://gwent.fandom.com/wiki/Rules): **minimum 25-card deck** (upper bound governed by the provision system rather than a hard cap); **[Q]** *"each player draws 10 cards from their deck"* to open; rounds 2 and 3 each add **[Q]** *"three random cards from their deck"*; and **[Q]** *"Players can mulligan 3 card from their hand at the start of any Round."* Best of three rounds.

**[CALC]** 10 + 3 + 3 = **16 of 25 = 64% exposure**, plus up to 9 mulligans across three rounds. Gwent's answer to variance is **width**: a very large opening hand relative to deck size, refreshed between rounds, with repeated free filtering. It is the "give the player almost everything and let them sequence it" school.

Structurally this is the closest published model to a *Manzil* board — a limited number of placements, a best-of-N match, and hand-as-plan rather than hand-as-queue.

### Triple Triad — the direct ancestor, in detail

This is *Manzil*'s parent, so precision matters.

**Base game (FF8).** Each player takes **five cards** onto a **3×3 grid** of nine squares. Per [Gamer Guides](https://gamerguides.com/final-fantasy-viii/guide/extra/in-depth-guides/triple-triad): **[Q]** *"Each player will pick five cards to form their hand and will take turns placing these cards on a 3x3 grid."*

**The scoring detail that Manzil must resolve.** Five cards each is ten cards for nine squares, so someone ends with a card in hand. Triple Triad counts it: **[Q]** *"Whomever has the most cards in their possession (not necessarily on the board) at the end of the game wins."* The unplayed card counts as yours. **[P]** In practice, one player places five and the other four, and the fourth-placer's remaining card is scored as theirs.

⚠️ **[UNVERIFIED]** Sources are unanimous that the hand card counts, but I could not confirm on an authoritative page whether the first player is always the one who places five.

**Hand-selection and information rules — the ones ancestral to this brief:**

| Rule | Effect | Variable it touches |
|---|---|---|
| **Open** (FF8) | **[Q]** *"allows you to see your opponent's cards"* | Information |
| **Random** (FF8) | **[Q]** *"Instead of picking five cards of your choice to form your hand, five cards are randomly selected from your library (the collection of all cards you possess)"* | **Hand selection** |
| **All Open** (XIV) | **[Q]** *"all five cards in each deck are made visible to both players"* | Information |
| **Three Open** (XIV) | **[Q]** *"three random cards in each deck are made visible to both players"* | Partial information |
| **Order** (XIV) | **[Q]** *"you are required to play each card in the order that it appears in your deck"* | **Sequencing agency** |
| **Chaos** (XIV) | **[Q]** *"the card you play each turn is selected at random from your deck"* | **Sequencing agency (destroyed)** |
| **Swap** (XIV) | **[Q]** *"one card from your deck is switched with one of your opponent's before the match begins"* | Hand composition |
| **Roulette** (XIV) | **[Q]** *"the advanced rules for the match will be chosen at random"* | Meta-rule |

Sources: [FF8 rules at jegged.com](https://jegged.com/Games/Final-Fantasy-VIII/Triple-Triad/Rules-and-Overview.html), [Gamer Guides](https://gamerguides.com/final-fantasy-viii/guide/extra/in-depth-guides/triple-triad), [the official FFXIV Lodestone rules page](https://na.finalfantasyxiv.com/lodestone/playguide/contentsguide/goldsaucer/tripletriad/), and a [community guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2804293901).

**Capture-resolution rules** (a different axis — these add combo depth, not variance): **Same** — matching adjacent numbers flip, enabling **Combo** chains; **Plus** — matching *sums* of adjacent pairs flip; **Reverse** — **[Q]** *"the conditions for capturing cards are switched so that smaller numbers are more powerful than larger numbers"*; **Fallen Ace** — **[Q]** *"the all-powerful 'A' becomes susceptible to capture by the lowly '1'"*; **Ascension / Descension** — type-grouped cards gain or lose 1 per matching type in play; **Elemental** (FF8) — board squares carry elements giving **[Q]** *"+1 to all four numbers"* on match, **[Q]** *"a penalty of -1"* otherwise; **Sudden Death** — a drawn match restarts with the cards each player controlled at the end.

**FFXIV's deck-construction constraint is the most quotable finding in this whole section.** From the Lodestone: five-star cards — **[Q]** *"only one card may be placed in a deck"*; four-star — **[Q]** *"up to two cards may be placed in a deck"*; and **[Q]** *"Only one four star card may be placed in a deck when it also contains a five star card."*

Read what Square Enix actually did there. Faced with a five-card hand drawn from a large collection, **they did not randomise the hand and they did not enlarge it. They capped power density.** The variance lever they chose was **rarity budget**, not draw. Given the same problem *Manzil* faces, the direct ancestor's answer was: keep the hand chosen and open; constrain what may go into it.

**And note the FF8 metagame verdict on Random.** Random is famously the rule players *sought out* — because a random hand from a strong collection tends to beat a hand-picked one from a weak collection, and because in FF8's card-trading economy it protected your best cards. **[UNVERIFIED]** as a sourced claim; it is widely-held community lore rather than something I could pin to an authoritative page. But it does illustrate a real principle: **randomising hand selection changed the strategic locus from in-match play to collection-building.** That is a big shift, and it is exactly the shift option (a) would make in *Manzil*.

---

## 5. The "choose 1 of N" family

### Why being *offered* random options feels different from being *dealt* a random hand

Three mechanisms, distinguishable and each independently real.

**(i) Order-statistics: choosing genuinely gives you better cards.** **[CALC]** Model card fit for the current position as uniform on [0,1]. A dealt card has expected percentile **50%**. The best of N offered:

| Options | Expected percentile of the card you take |
|---:|---:|
| 1 | 50.0% |
| 2 | 66.7% |
| **3** | **75.0%** |
| 4 | 80.0% |
| 5 | 83.3% |
| 6 | 85.7% |

Note the shape: **the jump from 1→3 is worth 25 percentage points; from 3→6 only another 11.** Diminishing returns bite immediately. Three is not an arbitrary industry convention; it is close to the knee of the curve. This is very likely why Hearthstone Discover, Slay the Spire card rewards, and Balatro's base booster packs all landed on three independently.

**(ii) Attribution.** A dealt bad card is something the game did to you. A chosen mediocre card is something you decided. Rosewater's Lesson 3 is exactly this: high-choice high-variance content **[Q]** *"add[s] variance without making players unhappy."* The variance is unchanged; the blame moves.

**(iii) It reveals the possibility space.** The two cards you *don't* take teach you what exists. In a 28-card astrological deck where every card is a named lunar mansion with real semantic content, this is a substantial and free pedagogical benefit.

### The family, catalogued

| Game | Pattern | Width | Skip? |
|---|---|---:|---|
| Hearthstone Discover | 1 of 3 from catalogue | 3 | No |
| Slay the Spire card reward | 1 of 3 from class pool | 3 (4 with Question Card, 1 with Busted Crown) | **Yes** |
| Balatro Arcana/Celestial/Standard pack | 1 of 3 | 3 | Yes (skip the pack) |
| Balatro Jumbo pack | 1 of 5 | 5 | Yes |
| Balatro Mega pack | **2** of 5 | 5 | Yes |
| Balatro Buffoon (Joker) pack | 1 of 2 | 2 | Yes |
| Balatro Spectral pack | 1 of 2 | 2 | Yes |
| Draft (MTG/Arena) | 1 of ~15, decreasing | Variable | No |

Balatro pack structure from the [wiki](https://balatrowiki.org/w/Booster_Packs): Arcana/Celestial/Standard are **[Q]** *"Choose 1 of up to 3"* at normal, **[Q]** *"Choose 1 of up to 5"* at Jumbo, **[Q]** *"Choose 2 of up to 5"* at Mega; Buffoon and Spectral run 1-of-2 / 1-of-4 / 2-of-4.

Balatro's shop is worth calling out separately: cash → items, jokers, packs, and **[Q]** *"a voucher which grants an immediate permanent upgrade"* ([Wikipedia](https://en.wikipedia.org/wiki/Balatro_(video_game))). The shop is a *second* choose-from-a-random-set layer sitting on top of the packs. **[P]** Balatro stacks randomness-with-agency at every level rather than reducing randomness anywhere.

### The under-discussed member: **skip**

Slay the Spire's **1-of-3-or-nothing** is a materially different mechanic from Hearthstone's **1-of-3-mandatory**, and the difference is the whole thinning orthodoxy. Discover always adds a card because Hearthstone has a 30-card deck where one added card is noise. StS lets you decline because at deck size ~15 an added card is *signal*.

**Rule of thumb this suggests: offer skip when your deck is small enough that dilution is felt.** Using the **[CALC]** dilution table above — the pain of one added card is 10% relative at deck 9, 7.7% at 12, but only 3.4% at 28. Skip is a meaningful choice below roughly 15 and near-meaningless above roughly 25.

---

## 6. Is there published guidance on hand : deck : turns ratios?

**Short answer: no, and I want to be straightforward that I looked.** There is no widely-cited formula. What exists:

- **[Ian Schreiber, *Game Balance Concepts*, Level 4](https://gamebalanceconcepts.wordpress.com/2010/07/28/level-4-probability-and-randomness/)** — the standard free curriculum on this. He covers drawing without replacement rigorously (**[Q]** *"each card you draw influences what's left in the deck"*), and the information point that matters for open-hand designs: **[Q]** *"If I pull a card from the deck but don't look at it, I have no additional information, so the probabilities haven't really changed."* His guidance is deliberately **procedural, not prescriptive**: **[Q]** *"If a game you're designing has any randomness, this is a great excuse to analyze it"* — decide what should feel right, then check whether the actual probabilities match. **[P]** He offers no target ratios.
- **[Board Game Designers Forum, "Card to player ratios"](https://www.bgdf.com/forum/game-creation/mechanics/card-player-ratios)** — the consensus is explicitly that **no universal formula exists**. The most useful contribution is InvisibleJon's inversion: **[Q]** *"Ask yourself how likely you want a card to be drawn from a complete deck. This tells you how many cards (of that type) should be in the deck, relative to the total number of cards in the deck."* One participant offers **[Q]** *"you need about seven cards per player"* for their own game while conceding **[Q]** *"the mechanics of my card game are truly weird."*
- **[Game Developer, "Designing for deck-building in video games"](https://www.gamedeveloper.com/design/designing-for-deck-building-in-video-games)** — no numbers on deck size or draw, but one directly relevant line on **choice width**: **[Q]** *"Be aware that there is such a thing as too much choice -- asking the player to choose five cards from their deck leads to much more interesting decision-making than asking them to choose 20."*
- **[Anthony Giovannetti's GDC 2019 Slay the Spire talk](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf)** — the obvious place to look for empirical deck-size data, and it is not there. The talk is about metrics *process*: 250+ cards, the goal **[Q]** *"Every card should have a place!"*, the caution **[Q]** *"Data is evidence, but not a conclusion"*, and 18,168 pieces of Discord feedback. **No published pick rates, skip rates, or deck-size distributions.** ⚠️ Anyone citing StS deck-size metrics is not citing this talk.

**So: the ratios must be reverse-engineered from shipped games.** Which is what section 0's table does. The pattern that emerges across every game examined:

> **Games whose deck is a plan you execute run 60–80% exposure. Games whose deck is a long-run identity run 20–40% exposure — and every one of them buys back agency with mulligans, card selection, or Discover-style choice.**

There is no shipped design I found that sits at 25% exposure with *no* mulligan, *no* selection, and only five placements. That combination — which is exactly *Manzil* option (a) as briefed — is unoccupied territory, and probably for a reason.

---

# Implications for Manzil

**1. Do not put all 28 mansions in one deck.** At 28 cards and 7 seen, exposure is **25%** — Magic-with-no-mulligan territory **[CALC]**. Any specific mansion appears in one board in four; any *pair* of mansions co-appears **5.6%** of the time. Every synergy, every "these two mansions are in trine" interaction, every piece of astrological cleverness you might write becomes a once-in-eighteen-boards curiosity that most players never see. The 28 is a beautiful *collection* number and a bad *deck* number. Keep 28 as the corpus; make the deck a subset.

**2. Recommendation: a 12-card deck, drafted from the 28 between matches.** Twelve is the number Marvel Snap arrived at from an almost identical brief — short game, small board, no duplicates, mobile-legible — and Brode's stated reasons apply verbatim: **[Q]** *"Deckbuilding is one of the hardest things for players to do in card games. Generally, the smaller the deck, the less variance you have."* At deck 12 seeing 7, a specific mansion shows up **58%** of boards and a specific pair **32%** **[CALC]** — enough that synergy is a real strategy rather than a lottery. Twelve also gives you a natural astrological hook (twelve signs against twenty-eight mansions) that costs nothing and reads instantly. Second choice: 14, at 50% / 23%. Do not go above 16.

**3. Your 28 mansions are a forced singleton, and you cannot ignore what that costs.** There is no second copy of al-Thurayyā. Both precedents make this explicit — Snap mandates singleton and pays for it with 75% exposure; Hearthstone Highlander permits it and pays for it with **[Q]** *"extremely powerful effects... balanced by the reduced consistency of the rest of your deck."* Manzil gets the constraint free from its theme and must therefore buy consistency back through **deck size**, since it cannot buy it with copies. This is the single strongest argument in this report against a 28-card deck.

**4. Use choose-1-of-3, not draw-3-refill — but notice they are nearly the same thing, and the difference is the point.** With a hand of 3 refilled after each placement, you choose 1-of-3 on every turn anyway; the only mechanical difference is that rejected cards *persist*. That sounds strictly better and is not. Two duds in your opening three sit there for the whole board, and by placement five your effective choice has narrowed toward 1-of-1. A true choose-1-of-3 — three offered, one lodged, two returned to the deck — guarantees a **75th-percentile pick on every single placement** **[CALC]**, floor included, with no clogging. It also reads perfectly as the sky offering three mansions and the player electing one. **Given that the whole reason to add draw is agency-preserving variance, take the version that preserves agency on every turn rather than degrading toward none.**

**5. But do not fully discard the memory — offer a one-card carry.** Pure choose-1-of-3 with no persistence removes all planning: you can never *hold* a strong mansion for a slot that isn't open yet, which is precisely the kind of decision that makes lane games good. Suggested shape: **three offered, lodge one, keep one in reserve, return one to the deck.** The reserve card joins next turn's offer, making it functionally 1-of-3-with-one-carried. This preserves setup play without letting duds accumulate. Flagged as untested design, not a sourced pattern.

**6. Kill the Slay-the-Spire acquisition model. At 28 cards it is mathematically inert, and at 12 it is a nuclear weapon.** **[CALC]** shows adding one card to a 28-deck costs 3.4% relative draw odds — imperceptible, so acquisition would carry no weight and the "reward" would land flat. Add one card to a 12-deck and it costs 7.7%, which *does* matter — but then you have imported the entire Slay the Spire thinning orthodoxy, and with it the Dominion endgame: Chapel-style optimisation converges on **[P]** a five-card deck with zero variance, which is the game you already have and are trying to move away from. Roguebook tried to pay players to dilute and mostly failed — **[Q]** *"I never felt much temptation to go big."* Manzil's deck should be **drafted between matches, fixed within a match.** Progression belongs in which twelve mansions you own and choose, not in mid-run accretion.

**7. Keep the sky's five planets fully open, and consider Three-Open on your own deck.** *Manzil*'s ancestor already ran this experiment and shipped every setting: FF8's **Open**, FFXIV's **All Open** and **Three Open**. Your opponent is the real ephemeris — public, knowable, checkable against the actual sky — so hiding it destroys the game's best idea for no gain. Keeping the sky fully open while your own next-three is a fresh offer produces exactly the asymmetry the theme wants: **the heavens are known and fixed; what falls to your hand is not.** That is a better statement of the fantasy than the current fully-solved version, and mechanically it is Rosewater's Lesson 6 — random supply paired with player selection.

**8. Do not add a mulligan. Add a floor instead.** Snap's whole arc is the argument: they shrank the deck, cut the mulligan, took the complaint, and fixed it with **one card** — **[Q]** *"We moved Quicksilver into the starting deck"*, after which **[Q]** *"the mulligan feedback dried up."* The Manzil equivalent is a guaranteed-availability mansion: the mansion the Moon actually occupies tonight is always among your three offered on the first placement. It is free thematically, it is one line of rules, and it eliminates the "I had nothing to open with" complaint that will otherwise generate a mulligan request within a week of playtesting. Do the content fix, not the system fix.

**9. Resolve the 5-cards-into-9-slots arithmetic explicitly, because Triple Triad's answer changes the whole endgame.** Two players lodging five each is ten cards for nine slots. Triple Triad's rule is that the leftover counts: **[Q]** *"Whomever has the most cards in their possession (not necessarily on the board) at the end of the game wins."* With a *refilling* hand you end holding two cards, so this scoring rule becomes incoherent — a second reason to prefer choose-1-of-3 (where you hold nothing) over draw-3-refill. If you keep a persistent hand, either score only the board, or state clearly that one player lodges five and the other four with the fifth counted.

**10. Spend the variance budget on the board, not the draw — and remember best-of-five is already a damper.** **[CALC]**: a 60%-per-board edge becomes a **68%** match win at best-of-five (vs 65% at best-of-three). The match format is already absorbing per-board noise, which means you can afford *more* per-board variance than a single-game format could. But the [IEEE CoG study](https://arxiv.org/pdf/2107.08437) found it was specifically **input** randomness that hurt satisfaction — **[Q]** *"the least liked version in our experiment"* — while output randomness was neutral (p = 0.859). Combine those and the conclusion is clear: get your variety from **board state and the nightly ephemeris**, not from a deep shuffled deck. Every night the sky deals a genuinely different five planets in genuinely different degrees. That is a free, thematically perfect, *non-input* variance source that no competitor has. It is the whole reason this game should exist. Lean on it instead of a 28-card shuffle, and take Rosewater's Lesson 7 as licence: a mansion arriving from a shuffled deck reads as **fate** and will be forgiven; a die roll would read as arbitrary and would not.

---

## Sources

**Marvel Snap**
- [Ben Brode on X — deck size and variance](https://x.com/bbrode/status/1584762939868737537) · [thread reproduced at Out of Games](https://outof.games/news/5513-ben-brode-on-marvel-snaps-lack-of-mulligan-developer-insights/)
- [Kent-Erik Hagman interview, GamesHub](https://www.gameshub.com/news/features/marvel-snap-designer-interview-kent-erik-hagman-smart-card-game-design-31692/)
- [Ben Brode, The Guardian](https://www.pressreader.com/usa/the-guardian-usa/20221112/282024741243323)
- [Second Dinner on onboarding and card design, mobilegamer.biz](https://mobilegamer.biz/second-dinner-reveals-the-secrets-of-marvel-snaps-onboarding-and-card-design/)
- [Card probability calculation, Marvel Snap Zone](https://marvelsnapzone.com/card-probability-calculation-in-marvel-snap/) · [The Brutal Odds Of Marvel Snap, PlaySNAP](https://playsnap.pro/posts/fundamentals/The-Brutal-Odds-Of-Marvel-Snap/)
- [Zvi Mowshowitz, "Marvel Snap: Phase 1"](https://www.lesswrong.com/posts/hNa4JBgtuhb8tY3je/marvel-snap-phase-1)
- [Deck building basics, BlueStacks](https://www.bluestacks.com/blog/game-guides/marvel-snap/mvsn-deck-building-guide-en.html)
- [GDC 2023 talk notes, Steven Lilley](https://stevelilley.com/2026/03/17/gdc-talks-gdc-2023-designing-marvel-snap/) *(no deck-size content)*

**Dilution and thinning**
- [Dominion: Chapel, Dominion Strategy](https://dominionstrategy.com/2010/11/17/dominion-chapel/) · [Dominion rules, Wikipedia](https://en.wikipedia.org/wiki/Dominion_(card_game))
- [Slay the Spire strategy guide](https://www.slaythespire.gg/guides/strategy) · [Card Rewards wiki](https://slay-the-spire.fandom.com/wiki/Card_Rewards) · [Ironclad](https://slaythespire.wiki.gg/wiki/Ironclad) · [Silent](https://slaythespire.wiki.gg/wiki/Silent) · [mechanics reference](https://tck.mn/blog/a-slay-the-spire-puzzle/mechanics/)
- [Small deck vs big deck, Steam](https://steamcommunity.com/app/646570/discussions/0/1692662484248176283/) · [Minimising bad draws, Steam](https://steamcommunity.com/app/646570/discussions/0/3428846977645038666/)
- [Understanding card rewards, Spire Builds](https://www.spirebuilds.com/guides/understanding-card-rewards) · [When to skip cards, sts2front](https://sts2front.com/tips/when-to-skip-cards/)
- [Roguebook deckbuilding, Game Developer](https://www.gamedeveloper.com/design/tackling-deckbuilding-design-in-abrakam-s-roguebook) · [Roguebook review, Zvi](https://thezvi.wordpress.com/2021/07/05/spoiler-free-review-roguebook/)
- [Highlander, Hearthstone wiki](https://hearthstone.wiki.gg/wiki/Highlander)

**Mulligans and hand size**
- [The London Mulligan, Wizards](https://magic.wizards.com/en/news/announcements/london-mulligan-2019-06-03) · [Mulligan history, MTG Wiki](https://mtg.wiki/page/Mulligan)
- [Opening Moves: Mulligans, Blizzard](https://news.blizzard.com/en-us/article/21363040/opening-moves-mulligans)
- [LoR mulligan, gamepressure](https://www.gamepressure.com/legends-of-runeterra/mulligan-card-slection/zdcf40)
- [Balatro hand size](https://balatrowiki.org/w/Hand_size) · [discards](https://balatrowiki.org/w/Discards) · [booster packs](https://balatrowiki.org/w/Booster_Packs) · [Wikipedia](https://en.wikipedia.org/wiki/Balatro_(video_game)) · [base hands/discards, Steam](https://steamcommunity.com/app/2379780/discussions/0/4346606879509568633/) · [LocalThunk interview, Rogueliker](https://rogueliker.com/balatro-interview/)

**Randomness, choice, and Discover**
- [Discover design intent, SiliconANGLE](https://siliconangle.com/2015/11/12/hearthstone-devs-say-league-of-explorers-new-discover-mechanic-is-all-about-fun/) · [Discover the Design, Dominic Calkosz](https://dominic-calkosz.com/blog/discover-the-design) · [A Taxonomy of Randomness in Hearthstone](https://gangles.ca/2016/09/12/hearthstone-randomness/) · [Stick or twist, Game Developer](https://www.gamedeveloper.com/design/stick-or-twist-balancing-randomness-and-strategy-in-i-hearthstone-i-)
- [Rosewater, Variance Part 1](https://magic.wizards.com/en/news/making-magic/variance-part-1-2019-12-16) · [Part 2](https://magic.wizards.com/en/news/making-magic/variance-part-2-2020-03-02)
- [Effect of Input-output Randomness on Gameplay Satisfaction in CCGs (IEEE CoG 2021)](https://arxiv.org/pdf/2107.08437)
- [Schreiber, Game Balance Concepts Level 4](https://gamebalanceconcepts.wordpress.com/2010/07/28/level-4-probability-and-randomness/) · [Giovannetti, GDC 2019](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf)

**Triple Triad and Gwent**
- [FFXIV Triple Triad, official Lodestone](https://na.finalfantasyxiv.com/lodestone/playguide/contentsguide/goldsaucer/tripletriad/) · [community rules guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2804293901)
- [FF8 rules, jegged.com](https://jegged.com/Games/Final-Fantasy-VIII/Triple-Triad/Rules-and-Overview.html) · [Gamer Guides](https://gamerguides.com/final-fantasy-viii/guide/extra/in-depth-guides/triple-triad) · [StrategyWiki](https://strategywiki.org/wiki/Final_Fantasy_VIII/Cards) · [Wikipedia](https://en.wikipedia.org/wiki/Triple_Triad)
- [Gwent rules wiki](https://gwent.fandom.com/wiki/Rules)

**Design-ratio guidance**
- [Card to player ratios, BGDF](https://www.bgdf.com/forum/game-creation/mechanics/card-player-ratios) · [Designing for deck-building, Game Developer](https://www.gamedeveloper.com/design/designing-for-deck-building-in-video-games)
