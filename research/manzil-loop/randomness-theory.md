# Input vs Output Randomness, and How Games Make Luck Feel Fair

*Research report for **Manzil** — a 1×9 lunar-mansion board game, currently solved by seven opening moves, seeking randomness that breaks determinism without destroying perceived skill.*

Compiled 2026-08-21.

---

## How to read the verification markers

Because the ask was rigour about provenance, every substantive claim carries a marker:

| Marker | Meaning |
|---|---|
| **[V]** | Verbatim quote, fetched from the primary source (or the publisher's own reprint of it) |
| **[V2]** | Verbatim quote, but reached through a secondary source that quotes the original (interview write-ups, news posts). The wording is as that outlet published it; I could not see the original recording/tweet. |
| **[P]** | Paraphrase or summary. Not the author's words. |
| **[U]** | Unverified, disputed, or a number I believe is wrong. Flagged in-line. |
| **[OWN]** | My own calculation or analysis, not from any source. |

Two sources I could not reach directly and want to be honest about: **keithburgun.net** and **blog.prismata.net** both serve an HTTPS→HTTP redirect loop that defeated every fetch path available to me, and `web.archive.org` was blocked. For both authors I used the publishers' own authorised reprints — Burgun on [Game Developer](https://www.gamedeveloper.com/design/randomness-and-game-design), Grant on [GameDev.net](https://www.gamedev.net/articles/game-design/game-design-and-theory/luck-in-games-why-rng-isnt-the-answer-r3877/) and [Game Developer](https://www.gamedeveloper.com/design/removing-rng-how-eliminating-luck-can-benefit-strategy-card-games) — which carry the same text under the same bylines. Quotes drawn that way are marked **[V]** but the reprint URL is what I cite.

---

## 1. The input/output distinction: who said it, what it claims, and why it is weaker than it looks

### 1.1 Provenance

The popular attribution is to Keith Burgun. That is roughly half right.

**Earliest traceable use: Geoff Engelstein and Ryan Sturm, *Ludology* podcast, 2012.** The Kind Fortress design-patterns essay states that "Geoff Englestein and Ryan Sturm popularized these concepts in their June 2012 Ludology podcast episode and subsequent GameTek segment" **[P**, from [Kind Fortress, "Design Patterns: Random Loops", 3 Oct 2018](https://www.kindfortress.com/2018/10/03/design-patterns-random-loops/)**]**. The segment itself survives as [*Ludology*, "GameTek Classic 183 – Input Output Randomness"](https://ludology.libsyn.com/gametek-classic-183-input-output-randomness), re-published 16 Sep 2018, described as "In this classic GameTek, Geoff looks at the relationship between luck and strategy" **[V]**. The word "Classic" and the 2018 re-publication date confirm this is a rebroadcast of an earlier segment; I could **not** independently confirm the original June-2012 air date **[U]**.

**The definitions that circulate came from Burgun.** In ["Randomness and Game Design"](https://www.gamedeveloper.com/design/randomness-and-game-design) (Game Developer, 15 Oct 2014), Burgun writes:

> "Output randomness is noise injected between the player's decision and the outcome." **[V]**

> "Input randomness — this type of randomness informs the player before he makes his decision." **[V]**

**Field usage splits on attribution.** The peer-reviewed [IEEE CoG 2021 study](https://ieee-cog.org/2021/assets/papers/paper_259.pdf) cites *Burgun* for both definitions. Frank Lantz, writing on Balatro, credits *Engelstein* ([franklantz.substack.com, 29 Mar 2024](https://franklantz.substack.com/p/playing-balatro)) **[P]**. Skeleton Code Machine credits *Engelstein* via the GameTek episode ([28 Nov 2023](https://www.skeletoncodemachine.com/p/input-output-randomness-part-1)) **[P]**.

**Bottom line:** Engelstein/Sturm framed it; Burgun sharpened it into a normative rule and made it a slogan. Neither is a "discoverer" in any strong sense — the underlying idea (does the dice roll happen before or after you commit?) is older than the vocabulary.

### 1.2 Burgun's actual claim — stronger than most people who cite him realise

Burgun's argument is causal, not aesthetic. Output randomness cuts the chain connecting a decision to its consequence:

> "The tie has been severed, and we can no longer use my move as contextual nuance for our current game state." **[V]**

> "Having a system be entirely deterministic causes your emergent complexity to be maximally effective." **[V]**

> "In the deterministic game, the current game state has ties to every part of the entire timeline." **[V]**

His conclusion is close to absolutist:

> "Output randomness in all its forms is to be avoided. The only time you should use randomness of that kind is if you're making a gambling machine, or if you're insecure about the depth of your system." **[V]**

But he grants a substantial exception, which people quoting him usually drop:

> "I'm not arguing that there is no place for any kind of randomness in game design. In fact, I argue strongly in favor of well-balanced, low-variance input randomness in multiplayer games. And single player games require input randomness." **[V]**

Note the two qualifiers on the endorsement: **well-balanced** and **low-variance**. Burgun is not saying "input randomness is fine." He is saying input randomness is fine *if it is small and symmetric*. This matters enormously for Manzil, where a shuffle can easily be neither.

Burgun later softened the binary himself. Kind Fortress reports a 2015 Burgun position that input and output are not discrete categories but a spectrum defined by how much *time to respond* the player gets — "The less time a player has to respond to the random event, the more … output random" the design becomes **[V2**, quoted by [Kind Fortress](https://www.kindfortress.com/2018/10/03/design-patterns-random-loops/); I could not reach the original Burgun post**]**.

### 1.3 Counter-argument 1: the binary is a loop, not a line (Engelstein)

Engelstein — one of the people who framed the distinction — is also on record dissolving it. Kind Fortress summarises: input and output randomness form cyclical patterns, because a random outcome becomes the input to the next decision, which generates a new random outcome **[P]**. That is exactly true of any repeated card game. In a five-round Manzil match, "output randomness in board 2" is functionally "input randomness for board 3." The label depends entirely on where you draw the boundary of "the decision."

### 1.4 Counter-argument 2: Elyot Grant — input randomness does not save you

Grant, designer of the deliberately RNG-free *Prismata*, is the strongest published critic of the "just use input randomness" answer. His core position is that the *timing* of randomness is a second-order concern; what matters is **how much of the outcome variance it controls**, and card-draw randomness — which is textbook input randomness — controls a lot of it.

His taxonomy is five-way rather than two-way ([GameDev.net reprint, 24 Oct 2014](https://www.gamedev.net/articles/game-design/game-design-and-theory/luck-in-games-why-rng-isnt-the-answer-r3877/)) **[P]**:

1. **Absolute luck** — "coin flips, die rolls, waiting for the result after going all in pre-flop in poker" **[V]**
2. **Execution luck** — "unavoidable variance in performance due to imperfect skill, such as basketball players who sink only 70–90% of free throws" **[V]**
3. **Yomi luck** — mind-reading in simultaneous-choice / hidden-information situations **[P]**
4. **Soft RNG luck** — card drawing and randomised effects where "players are given an opportunity to react to different situations" **[V]** — *this is precisely what the input-randomness camp calls the good kind*
5. **Outcome uncertainty** — "situations in which the final outcome of a choice is not visible to players, even though it may be deterministic" **[V]**

His empirical case is the one worth stealing:

> "popular player Tidesoftime, who is currently ranked 4th in the global ELO rating, has won only 63% of his matches" **[V]**

> "With that win rate, a player will lose a best-of-five series over a quarter of the time, meaning that most tournaments (televised ones in particular) don't have nearly enough games to have a high likelihood of rewarding the most skilled players." **[V]**

**[OWN]** That arithmetic checks out: at p = 0.63 per game, best-of-five win probability is 0.733 — the stronger player loses 26.7% of Bo5 matches. Grant's "over a quarter" is exact.

He also offers the contrast figure:

> "Unlike in chess — where the best player in the world is a 91% favourite when playing a single match against the 100th-best player — in Hearthstone, the best player is often only a marginal favourite when playing any reasonably good player" **[V]**

**[U] — this 91% number is almost certainly wrong.** **[OWN]** A 91% single-game expectation implies a ~402-point Elo gap. On the [January 2026 FIDE list](https://en.chessbase.com/post/fide-ratings-january-2026), #1 Carlsen is 2840 and #100 is 2628 — a 212-point gap, giving an expected score of **77.4%**, not 91%. Even at 2014 spreads (~240 points) it lands near 80%. Grant may have meant a multi-game *match* rather than a single game, in which case 91% is plausible. **The qualitative claim survives intact** — 77% vs 63% is still an enormous difference in skill expression — but do not repeat the 91% figure as fact.

Grant's constructive proposal is *pre-game* randomness only:

> "Randomness is used before the game begins to generate novelty in a way that is as fair as possible for both players, and once the game begins, there is no additional RNG whatsoever." **[V**, [Game Developer reprint, Dec 2014](https://www.gamedeveloper.com/design/removing-rng-how-eliminating-luck-can-benefit-strategy-card-games)**]**

He is explicit that this is the Chess960 move **[P]**. And he is candid about the price:

> "Prismata was really hard to balance. We had to restart over a dozen times." **[V]**

He estimates three years on balance alone **[P]**. Crucially, he also names the failure modes of the fully deterministic version of his own hypothetical game ("DeckHand"): **opening memorisation overshadows strategic play; repetitive matchups lack variety; unwinnable positions push win-rates to near-zero** **[P]**. This is *exactly Manzil's current condition* — the seven-opening solution is the "opening memorisation" failure, arrived at by a designer who removed randomness on purpose.

### 1.5 Counter-argument 3: Sirlin — randomness is anti-solvability infrastructure

David Sirlin, usually cited as the anti-luck fighting-game partisan, actually holds the opposite of the position attributed to him. In ["Solvability"](https://www.sirlin.net/articles/solvability):

> "Designing competitive strategy games is a constant fight against solvability." **[V]**

> "Randomness has a real stigma, but it's important to understand that it's a valid tool to keep your game out of the dangerous pure solution category." **[V]**

> "As more and more is known about Chess over the years, the more structured the opening books become (the set of known-good opening moves) and the more important memorizing them becomes" **[V]**

> "In order to make a game with a mixed solution, incorporate some sort of unknown elements, hidden information, or randomness." **[V]**

Note the ordering in that last sentence: **unknown elements, hidden information, or randomness.** Randomness is third on Sirlin's list, and his own designs reach for the first two. From ["Designing Yomi"](https://www.sirlin.net/articles/designing-yomi) (21 Aug 2014):

> "Double blind decisions are a very useful tool in fighting against solvability in games. Games with perfect information and no randomness inevitably degenerate into more and more memorization…" **[V]**

And his account of why fighting games do not need dice — they are *already* imperfect-information games:

> fighting games are "double blind though because of the speed of the gameplay. At the exact moment you jump, you do not know if the opponent threw a fireball or not…" **[V]**

**This is the single most under-used idea in the Manzil brief.** Sirlin's position is that a deterministic perfect-information game degenerates, but the fix does not have to be a shuffle — simultaneous commitment produces the same anti-solvability effect *without any luck at all*, and it yields mixed-strategy (Nash) play rather than a fixed opening book.

> "A mixed strategy is a set of pure strategies where you assign a probability to each one." **[V]** — "If a certain mixed strategy is the optimal way to play, we'll call that a mixed solution." **[V]**

A game whose solution is a *mixed* strategy is not "solved" in the way Manzil is currently solved. The optimal play is a probability distribution the player must generate themselves, and executing it well against a reading opponent is a skill.

### 1.6 Counter-argument 4: the one experiment anybody actually ran, and it went the wrong way

[Zhang, Monteiro, Liang, Ma & Baghaei, "Effect of Input-output Randomness on Gameplay Satisfaction in Collectable Card Games", IEEE CoG 2021](https://ieee-cog.org/2021/assets/papers/paper_259.pdf) built a purpose-made CCG ("Dream Cage") in four conditions — input randomness only, output randomness only, both, neither — and ran 18 participants across four days with Latin-square counterbalancing, measuring with the GUESS satisfaction instrument **[P]**.

The result contradicts the folk theory:

- Conditions **with** input randomness scored *lower* satisfaction (M = 21.836) than conditions without (M = 22.991), F(1,15) = 6.275, **p = 0.024**, ηp² = 0.295 **[P]**
- The input-randomness-only condition was the **least-liked of all four** (M = 21.598) **[P]**
- **Output randomness had no significant effect at all**: F(1,15) = 0.33, p = 0.859 **[P]**
- The authors' summary: "The game with input randomness was the least liked version in our experiment." **[V]**

Caveats I want to state plainly **[OWN]**: n = 18 is small; it is a single custom game with a single-player AI opponent; 15-minute sessions cannot capture the *long-run* value of variance (novelty, replayability, meta-freshness), which is the main thing input randomness is supposed to buy. The study measures first-impression satisfaction, not durability. Still — it is the only controlled test of the input/output claim I could find, and it found the opposite of the received wisdom. Anyone citing "input randomness is better" as settled fact is citing a slogan, not evidence.

The authors' own interpretive gloss is more useful than the headline: satisfaction tracks the **illusion of control**, and "randomness on its own was not pleasurable but not having control over the degree of randomness was a nuisance" **[V]**. Which reframes the whole question: it is not *when* the randomness lands, it is **whether the player has levers that let them act on it**.

---

## 2. Garfield on randomness: catch-up, excuse, and widening the strategy pool

Garfield's canonical statement is not in *Characteristics of Games* — it is his Game Developer Magazine column, ["Getting Lucky" (November 2006)](https://www.superdan.net/download/blog/deltasdnd/Garfield_GettingLucky_GDM_November_2006.pdf). I was able to read that PDF directly, so the quotes below are **[V]**.

*(On the book: [Elias, Garfield & Gutschera, "Characteristics of Games", MIT Press, 2012](https://www.penguinrandomhouse.com/books/655769/characteristics-of-games-by-george-skaff-elias-richard-garfield-and-k-robert-gutschera-foreword-by-eric-zimmerman-and-peter-whitley/) — the relevant material is Chapter 5, "Indeterminacy": §5.1 Randomness (p. 137), §5.2 Luck and Skill (p. 150), §5.3 Hidden Information (p. 167). I could confirm the chapter structure but **could not obtain the chapter text**, so I am not attributing any quotation to the book. **[U]** Treat any "Characteristics of Games says X" claim in this report's absence as unverified.)*

### 2.1 His definition

> "I define luck in games as uncertainty in outcome. If better players always win against weaker opponents, then there is no luck in the game." **[V]**

This is an *outcome-based* definition, not a mechanism-based one. Under it, a deterministic game where the second player can always be out-thought has no luck — and a deterministic game with a known seven-move solution has *no luck and no game*.

### 2.2 Randomness as a widener of the competitive pool (verified)

> "the more luck there is in a game, the more easily skilled and unskilled players can play together." **[V]**

> "high-luck games broaden the range of competition." **[V]**

> "A game with low luck can be a fine game of course, but it demands that players of similar skill always compete against each other only." **[V]**

### 2.3 Randomness as a widener of the *strategy* pool (verified)

> "Luck in games often broadens the type of strategies that people can use, adding variety to the game." **[V]**

> "no one will believe as a rule they are always the best, which might lead to more players exploring more and different strategies." **[V]**

> "the expert player may even enjoy the freedom of exploring parts of the tech tree that are generally less effective." **[V]**

And the mechanism by which luck re-weights which *skills* matter — this is the sharpest idea in the essay:

> "if a game involves two skills, A and B, and A is very important to winning the game, while B is not so important — by making it so that A has more luck involved you can raise B's relative importance." **[V]**

**[OWN]** Read that as a design dial rather than a platitude. Randomness applied *selectively* is a way of demoting a dominant skill. If Manzil's dominant skill is currently "recall the solved opening," injecting randomness *specifically into opening conditions* demotes recall and promotes evaluation — without adding luck anywhere else.

### 2.4 Randomness as an excuse — the "ego crutch" (verified)

Garfield has a section literally headed **Ego crutch**:

> "Many people take pleasure in blaming their defeats on bad luck, but have no problem taking credit for their victories, regardless of the circumstances." **[V]**

> "it is protecting their egos, just as surely as it can injure the ego of a skillful player." **[V]**

> "When skilled players have played the better, more skillful game and still lose, they say, begrudgingly, that only fate is to blame." **[V]**

He also notes luck "removes players' ego crutches" and "increases the variety of the gameplay" **[V]** — the phrasing is two-edged in the original and I am flagging that I am quoting fragments as they appear.

### 2.5 On catch-up — Garfield is subtler than the standard citation

Garfield does *not* frame luck as a catch-up mechanic in the rubber-banding sense. What he says is about risk-taking behaviour:

> "With the uncertainty luck brings, the most conservative players will have to take crazy chances if they want to succeed from time to time." **[V]**

**[U] Flag:** the common paraphrase "Garfield says randomness is a catch-up mechanic" is **not supported** by the text of "Getting Lucky." The catch-up-adjacent claim in the essay is about *broadening who can compete*, not about *narrowing a lead within a game*. If you want an authority explicitly hostile to catch-up mechanics, that is **James Ernest**, whose Gen Con 2012 [*Volatility in Game Design*](https://static1.squarespace.com/static/5e1ce8815cb76d3000d347f2/t/5e2250e25dfafe47d32d5f49/1579307234917/Volatility+in+Game+Design.pdf) notes state: "Unless they are baked into the fundamental structure of the game, Catchup features are usually terrible." **[V]**

*(Provenance note: this PDF surfaces in search under Garfield's name and builds on his work, but it is authored by **James Ernest**, crediting Garfield and Dave Howell. Do not cite it as Garfield.)* **[V]** Ernest's own framing is useful anyway: he splits randomness into **cosmetic** (no bearing on strategy or outcome), **biased** (gives resources unfairly to one player — "easiest to design but problematic"), and **fair** ("hardest to employ; doesn't favor one player over another") **[P]**. And: "Usually when a game has the right mix of luck and skill, it appeals to the broadest range of possible players: hardcore players have something that will give them an edge, and casual players don't feel like their chances are too low." **[V]**

### 2.6 The cost, in Garfield's own accounting

> "The only cost of all these terrific benefits is that skillful players must manage to swallow their pride and settle for winning a majority of the time, rather than all the time." **[V]**

> "a long game with a lot of luck does threaten to frustrate the more skillful players, who don't want to invest a lot of time and energy on a spurious outcome." **[V]**

**[OWN]** That second line is a direct constraint on Manzil's best-of-five structure: the longer the match, the less luck it can tolerate per board before the time investment feels wasted. A short game can be luckier than a long one.

### 2.7 Garfield in 2012, on the same themes

From [The Opinionated Gamers interview, 2 Jul 2012](https://opinionatedgamers.com/2012/07/02/the-art-of-design-interviews-to-game-designers-20-richard-garfield/):

> "Most people think of Luck and Skill in games as being opposites — but games like poker show otherwise, you can have a lot of both." **[V]**

> "There are many tools one can use to balance the amount of luck in a game, and the perception of luck, which is often just as important." **[V]**

> "The key goal for me is to make decision points that the best answer is unknown but players can develop cognitive tools to help them decide." **[V]**

> **"I think it tends to be better to have randomness come from different choices rather than just random success or failure."** **[V]**

> "The two ways to reduce the influence of luck from dice is to make more rolls that are hard to rank, and to simply make more rolls." **[V]**

> "Similarly many games with no apparent luck actually do have some luck in practice." **[V]**

**[OWN]** That bolded line is the input/output distinction stated by Garfield in 2012 without the vocabulary — and stated better, because it names the *design substitution* ("randomness in the choice set, not in the resolution") rather than a timing rule. It is also, for the record, note-perfect advice for Manzil: randomise **which cards you get**, never **whether your 7 beats their 6**.

---

## 3. Case studies: games that bolted randomness onto (or off of) a deterministic core

### 3.1 Marvel Snap — the explicit, self-conscious input-randomness game

Ben Brode, having spent a decade being publicly beaten up over Hearthstone's RNG, built Marvel Snap around the doctrine:

> "A big goal we had with Marvel Snap was to add a ton of variance, but focus it on 'Input Randomnes' [sic] — where you see the random events *before* you make your decisions. You have more control this way, and it feels more strategically satisfying." **[V2**, [@bbrode, X](https://x.com/bbrode/status/1584768759885336576), 25 Oct 2022 **[OWN]** — timestamp derived from the tweet's snowflake ID; the platform blocks direct fetch, so the text is as reproduced by search indexing, including the typo**]**

Mechanically the implementation is the interesting part **[OWN]**: Snap's three Locations are drawn randomly per match but revealed **one per turn over turns 1–3**, so the randomness arrives as a *staggered stream of new information* rather than a single up-front reveal. Both players see the same locations at the same time. Random effects on the board are visible before you commit your cards for the turn. The game is 6 turns long and matches run under 5 minutes.

Brode's defence of the most-hated locations is the perceived-fairness argument in its purest form, from a [Twinfinite interview, 17 Nov 2022](https://twinfinite.net/marvel-snap/ben-brode-defends-marvel-snaps-most-hated-locations/):

> "I think those locations are actually quite skill-testing! A lot of people don't like randomness because they feel like if this wasn't random, I would've won, but **both players are feeling the same amount of randomness**." **[V2]**

> "The player who is better at adapting on the fly and puzzling out a situation is going to do better in that situation." **[V2]**

> "It does change the experience and adds some emotional variance to playing the game, and I think that matters." **[V2]**

He also invokes a "rough edges" philosophy — deliberately keeping high-variance elements that "don't come up that often" because they "add a huge amount of texture" **[V2]**.

**The complication.** At GDC 2023, Brode's stated principle was broader than his tweet: he told designers to "**Embrace randomness — input or output**," and framed the goal as landing in the "high luck, high skill" quadrant: "Games in the 'high luck, high skill' category I think are super fun, because they include a ton of interesting decisions, but they also have exciting moments." **[V2**, [MobileGamer.biz, 23 Mar 2023](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/)**]** So even Snap's designer does not treat the input/output line as a law. He treats it as an emphasis.

**[OWN] Verdict:** the input-randomness framing plainly *worked commercially and critically*, and the symmetry argument ("both players are feeling the same amount") is the honest core of it. But note that Snap pairs its randomness with two independent skill amplifiers — the **snap/retreat stake-raising mechanic** (a poker-style bet on your own read) and **simultaneous hidden play each turn**. The variance is tolerable partly because Snap gives you a way to *express* confidence about it. Randomness alone was not the design.

### 3.2 Hearthstone — the counter-example, and the most instructive one

Hearthstone is the case where randomness was added generously and *partially backfired*, and the designers said so on the record.

**The defence.** Ben Brode, Sept 2016 ([HearthPwn, 23 Sep 2016](https://www.hearthpwn.com/news/1745-ben-brode-on-randomness-in-hearthstone-karazhan)):

> "Randomness is important for Hearthstone." **[V2]**

> "There is not a scale that goes from skill to random which you need to tune, the two can coexist." **[V2]**

> "Discover is a great example of a random effect that adds skill to the game." **[V2]**

> "Randomness can still feel bad, especially when you've played a long game and the game is decided on a random outcome." **[V2]**

Mike Donais, quoted in [Matthew Gallant's taxonomy](https://gangles.ca/2016/09/12/hearthstone-randomness/): "RNG gets your emotions really high and really low… makes you want to come back and play more." **[V2]**

**The taxonomy worth stealing.** Gallant ("A Taxonomy of Randomness in Hearthstone", 12 Sep 2016) classifies Hearthstone's randomness into ~9 kinds, ordered roughly by how much player agency sits between the roll and the result **[P]**:

| Kind | Agency | Example |
|---|---|---|
| Coin flip | none | Ogre miss chance |
| Random target | high — you can shape the board first | Deadly Shot ("1 in 7 chance at worst") |
| Small set | moderate — bounded, all outcomes useful | Totemic Call (4 totems) |
| **Catalogue** | **low — draws from the entire card pool** | **Piloted Shredder, Yogg-Saron** |
| **Discover** | **high — random *offer*, player *chooses*** | Discover cards |
| Deck contents | high — you built the deck | shuffle/draw effects |
| Discard | moderate — playable around | Warlock discard |
| Opponent's deck | none | Thoughtsteal |
| Joust | low | Joust cards |

Gallant's key structural insight **[P]**: **Discover** — offer three random options, let the player pick one — "reduces swing outcomes through player agency." It converts a roll into a *choice*. Brode independently called it "a great example of a random effect that adds skill."

**The backlash.** The two named villains behave differently and it matters.

- **Piloted Shredder** (4-mana 4/3, Deathrattle: summon a random 2-cost minion) — *catalogue* randomness at a *moderate* magnitude, played every game, in every deck. Gallant identifies it as the card that made catalogue randomness *standard* rather than exotic **[P]**. Its problem was not swinginess per game; it was that a card of that power level made every board state slightly unresolvable, all the time.
- **Yogg-Saron** (10-mana: cast a random spell for each spell you cast this game, with random targets) — catalogue randomness at *maximum* magnitude, once per game, decisive. Gallant notes it can "decide a game instantly" **[P]**.

Brode's post-mortem on Yogg is unusually candid ([Kotaku, 9 Apr 2018](https://kotaku.com/hearthstone-director-reveals-the-craziest-card-weve-eve-1825114809)):

> "We wanted that card to be crazy and fun for a certain type of player who likes unpredictability and connected stories" **[V2]**

> "**But we knew that it was the kind of randomness that really frustrates high level players.**" **[V2]**

> "But it was also super fun. And so we were like, 'Okay, how do we change this card?' We can't nerf it. It already costs 10 mana. The power level's in the battlecry. So, we made a change where he stops casting spells if the spells kill himself." **[V2]**

The nerf shipped **28 Sept 2016** ([Shacknews](https://www.shacknews.com/article/96969/hearthstones-yogg-saron-and-aggressive-decks-getting-nerfed)) after complaints that "the game was becoming too random" following high-profile tournament games: Yogg would stop casting if destroyed, silenced, transformed, or bounced **[P]**. **[OWN]** Note what that fix actually is: it does not reduce the randomness. It **bounds the tail** — it caps the worst case by giving the *sequence* a stopping condition. That is a variance-shaping intervention, not a luck-removal intervention, and it is the kind of thing Manzil can do cheaply.

**[OWN] Verdict:** Hearthstone shows that the input/output framing is insufficient. Piloted Shredder's randomness is technically *output* (resolves after you decide to play it) but Yogg's is too — and the community reaction to the two was different in kind. What predicted the backlash was **magnitude relative to the size of the decision** and **whether high-level play could route around it**, not timing.

### 3.3 Into the Breach — the maximal version of "all randomness before the turn"

Subset Games moved deliberately from FTL's heavy RNG to a near-deterministic tactics game. Justin Ma, [Game Developer / Road to the IGF, 23 Feb 2018](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-):

> "We preferred games with clear rulesets, and were interested in pursuing something with less randomness than FTL." **[V2]**

> "**We wanted to make something where every death felt like your own fault. This lead us to use of telegraphed enemy attacks as a core mechanic.**" **[V2]**

> "When every enemy attack is telegraphed and there's no random chance in your attack options, the game starts to feel like a puzzle." **[V2]**

> "It's important to me that when you fail at a goal, it's very clear how or why you failed so that you can feel like you can improve. As I've mentioned before, we hope the limited reliance on random chance in Into the Breach helps make the player feel in control." **[V2]**

**[OWN]** The structure is worth naming precisely, because it is the cleanest template available to Manzil. Into the Breach *is* random — enemy spawns, mission modifiers, pilot and weapon rewards, island layout are all generated. But within a single turn, **100% of the randomness has already resolved and been displayed** before the player acts. The enemy's next move is shown as an arrow on the board. Damage is exact. There is no to-hit roll. The player is solving a fully-specified constraint problem whose *parameters* were dealt randomly.

Ma's phrase "**every death felt like your own fault**" is the perceived-fairness thesis in five words, and it points at the actual causal claim: perceived fairness is not produced by *less* randomness, it is produced by **attributability** — the player being able to reconstruct exactly why they lost.

### 3.4 Slay the Spire — randomness as the *content*, determinism as the *resolution*

**[OWN]** Slay the Spire's split is almost identical to Into the Breach's, applied to a deckbuilder: the run (map, card offers, relics, shops, elite/event placement, enemy encounter selection) is heavily random; the *combat* is almost perfectly deterministic — attacks do exactly the stated damage, and every enemy telegraphs its next intent above its head. Your draw order is the only in-combat randomness, and cards like Foresight/scry effects and draw manipulation exist to sell agency back to you.

Anthony Giovannetti's GDC 2019 talk ["Slay the Spire: Metrics Driven Design and Balance"](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf) is mostly about process rather than randomness; the useful line is **"Data is evidence, but not a conclusion."** **[V]** He also describes the 20-level Ascension ladder as the mechanism for stratifying player skill **[P]**, and cites 18,168 pieces of Discord feedback **[V]**. **[U]** I could not extract per-Ascension win-rate targets or card pick-rate thresholds from the slide deck; if those numbers matter, the GDC Vault video is the place to look.

On scale: a [community analysis of the developers' 2020 data dump](https://foxrow.com/slay-the-spire-statistical-analysis) (Ryan, 14 Dec 2020) reports **18 million runs** and **1.6 million victories — a 9% overall win rate** **[V]**. **[OWN]** That figure is a useful gut-check on tolerable variance: a 9% aggregate win rate would be catastrophic in a head-to-head competitive game and is completely fine in a single-player roguelike, because the *comparison class* is your own past runs, not another person.

### 3.5 Balatro — high variance sold honestly

Frank Lantz's essay ["Playing Balatro"](https://franklantz.substack.com/p/playing-balatro) (29 Mar 2024) is the sharpest thing written about it. His central warning:

> in a high-variance game, "taking a random sample from that distribution gives you *next to no information* about the shape of the overall curve" **[V]**

i.e. **you cannot evaluate your own strategy from your own results**. He nonetheless affirms genuine depth — "by carefully thinking through these situations I can feel myself learning, developing a better understanding of the game" **[V]** — while explicitly comparing the feedback loop to a slot machine: "Slot machines are creatures that have evolved to feed on this behavior by generating a signal that sounds like the message 'keep digging' but is really only a complicated kind of noise." **[V]**

**[OWN]** Balatro's structural answer to variance is worth noting because it is cheap and copyable: the game is **seeded** (you can replay an identical seed, which converts "was I unlucky?" into a checkable question), **shop rerolls** are a purchasable resource (paying to convert luck into choice), and the **blind-skip** mechanic lets you decline a hand you can't beat in exchange for a tag. Every one of those is a lever that gives the player *control over the degree of randomness* — precisely the thing the IEEE CoG participants said they wanted (§1.6).

### 3.6 Chess960 — pre-game randomisation as a direct answer to a solved opening book

The closest structural precedent for Manzil's specific problem. Fischer's stated aim was to end "the complete dominance of opening preparation in classical chess" **[P**, [Wikipedia: Chess960](https://en.wikipedia.org/wiki/Chess960)**]**, in his own words:

> "I want to keep the old chess flavor. I want to keep the old chess game. But just making a change so the starting positions are mixed, so it's not degenerated down to memorization" **[V2**, condensed from a radio interview as reproduced by Wikipedia**]**

960 positions; introduced publicly 19 June 1996 in Buenos Aires; **the position is randomised before play, identical for both players, and fully visible** **[P]**. It is symmetric, one-shot, pre-decision randomness that destroys a memorised solution while adding zero in-game luck.

### 3.7 Magic's mulligan — variance *reduction* as a shipped feature

Worth including because it shows randomness is a two-way dial, not a one-way tap. Wizards' rationale for the London mulligan ([Ian Duke, 3 Jun 2019](https://magic.wizards.com/en/news/announcements/london-mulligan-2019-06-03)):

> "A player who mulligans once against an opponent who keeps seven cards, in general, is at more of a disadvantage than we're comfortable with." **[V]**

> the change "greatly reduces the number of games where a player's deck and strategy simply don't function at all" **[V]**

They also name the risk: "combo decks could abuse a very strong mulligan to much more reliably assemble a combo early in the game" **[V]**. **[OWN]** The general lesson: when you add draw randomness, you will simultaneously need a **re-draw / mitigation mechanic**, and that mechanic will itself become a balance surface.

---

## 4. Perceived fairness: what players actually attribute wins and losses to

### 4.1 The bias is real, recent, and measured

The best evidence I found is [Okamoto, Taylor, Kubo, Ishii, De Martino & Cortese, "Blaming luck, claiming skill: Self-attribution bias in error assignment", *PLOS Computational Biology*, 16 Dec 2025](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1013787).

Design: 66 participants (51 analysed) played a whack-a-mole-style visuomotor touchscreen task with two hidden regimes — a **skill** regime where feedback tracked their accuracy, and a **random** regime where feedback was independent of performance. On each trial they had to infer which regime was active and rate confidence **[P]**.

Findings:

- Participants "credited positive outcomes to their own ability, while attributing negative outcomes to randomness" **[V]** — they chose the skill explanation significantly more often after positive feedback than negative, **Z = 5.99, P < 0.001** **[P]**
- Overall inference accuracy 65% (above 50% chance, P < 0.001) **[P]**
- **Their subjective estimate of their own motor-ability threshold was ~2× the true threshold** (Z = 5.48, P < 0.001) **[P]** — i.e. systematic self-overestimation of skill
- Asymmetric belief updating: positive feedback weighted more than negative, αpos > αneg, Z = 5.08, P < 0.001 **[P]**
- The bias caused *behavioural* consequences: participants switched their regime inference more readily when reality contradicted a self-flattering story **[P]**
- Notably: "distorted self-perception shaped behaviour, it did not affect confidence; instead, **self-attribution bias led to overconfidence in external blame**" **[V]**

**[OWN]** That final clause is the design-relevant result. Players are not merely wrong about luck — they are *confidently* wrong about it, and their confidence attaches specifically to the external-blame story. A design that gives players a legible external cause to blame will get that cause blamed **with high confidence**, whether or not it was decisive. Corollary: if you add a shuffle to Manzil, the shuffle **will** be blamed for every loss, at a rate far above its true causal contribution. That is a certainty, not a risk.

This is also exactly what Garfield described qualitatively in 2006 ("blaming their defeats on bad luck, but have no problem taking credit for their victories") — nineteen years before someone measured it.

### 4.2 Perceived fairness is a separate construct from actual fairness

[Freeman, Wu, Nower & Wohn, "Pay to Win or Pay to Cheat: How Players of Competitive Online Games Perceive Fairness of In-Game Purchases", *PACM HCI* Vol. 6, CHI PLAY, Oct 2022](https://yvettewohn.com/wp-content/uploads/2022/12/2022_chiplay.pdf) content-analysed 2,685 Reddit posts across five games (NHL, FIFA, Madden, Hearthstone, MTG Arena), 25 codes, 87% interrater reliability **[P]**.

Results: the player base does not converge — 29.47% held that gameplay stays fair despite purchases, 29.98% held that purchases damage fairness, 35.14% discussed obstacles to fairness **[P]**. Between-game differences were significant (p < 0.001), with Hearthstone perceived *most* fair of the five **[P]**.

**[OWN]** Two takeaways. First, "perceived fairness" behaves like an opinion distribution, not a property of the game — a roughly even three-way split on the *same* mechanics. Second, it is only weakly coupled to variance: Hearthstone, the game in this set with by far the most in-match RNG, was the one perceived as most fair. Fairness perception here tracked *access and symmetry of resources*, not randomness.

### 4.3 The mechanism-level result: it's the levers, not the dice

The IEEE CoG study (§1.6) again: "randomness on its own was not pleasurable but not having control over the degree of randomness was a nuisance" **[V]**, framed via the **illusion of control** literature **[P]**.

[Yin & Xiao, "The Reward for Luck: Understanding the Effect of Random Reward Mechanisms in Video Games on Player Experience", CHI '22](https://www.robertxiao.ca/research/reward-for-luck/) analysed 35 random-reward systems and interviewed 14 players **[P]**. Their design factors: how non-optimal rewards are *presented*, the balance between chance and skill, audiovisual framing of expectations, and the relationship between resource investment and reward value **[P]**. **[U]** I could not extract per-dimension numeric effects — the ACM full text is paywalled/403 and the author's summary page does not carry them.

**[OWN] Synthesis of §4.** The literature converges on something narrower and more actionable than "make it feel fair":

1. Players will attribute losses to randomness regardless (PLOS, high confidence, robust effect).
2. What they can be given instead is **attributability** — a legible causal story for the loss (Into the Breach's "your own fault").
3. What predicts satisfaction is not the *quantity* of randomness but **control over its degree** (IEEE CoG, CHI '22).
4. **Symmetry** is the strongest available rhetorical and actual defence (Brode: "both players are feeling the same amount of randomness"), and it is *checkable by the player*, which is why it works.

---

## 5. Measuring "is this still a skill game": the proxies and the real numbers

### 5.1 Elo-spread as the workhorse proxy

The most rigorous published attempt is [Duersch, Lambrecht & Oechssler, "Measuring skill and chance in games"](https://www.uni-trier.de/fileadmin/fb4/prof/BWL/FIN/Veranstaltungen/duersch--Skill_and_chance_2018-03-07.pdf) (working paper 7 Mar 2018; later in *European Economic Review*, 2020).

Method **[P]**: fit a best-fit Elo rating to every player in a game's population, then take the **standard deviation of the resulting rating distribution** as the skill measure — "The wider this distribution (measured by its standard deviation), the more heterogeneous are the player strengths" **[V]**. To set a threshold for "predominantly skill," they construct a **50%-Chess benchmark**: real chess games with half the outcomes replaced by coin flips.

| Game | Elo SD | p_sd (%) | vs. 50%-Chess threshold |
|---|---:|---:|---|
| **Chess** | **123.4** | 67.0 | reference (pure skill) |
| *50%-Chess benchmark* | *28.1* | *54.0* | *threshold* |
| Tetris | 52.4 | 57.5 | above |
| Jewels | 27.1 | 53.9 | ~at |
| Rummy | 14.7 | 52.1 | below |
| **Backgammon** | **12.3** | 51.8 | below |
| Yahtzee | 9.7 | 51.4 | below |
| Crazy Eights | 7.5 | 51.1 | below |
| **Poker** | **6.0** | 50.9 | below (≈25%-Chess) |

Headline: poker contains "about as much skill as chess when 3 out of 4 chess games are replaced by a coin flip" **[P]**. All games showed statistically significant skill (p < 0.001) **[P]**.

**[OWN] Caveats — important.** Elo SD is a property of the *player pool*, not the game. A game with a wide skill range of participants will show a wider SD regardless of its luck content, and vice versa. These figures come from one online platform's populations, so cross-game comparison is confounded by who plays what. The *ordering* (chess ≫ backgammon > poker) is robust and matches every other line of evidence; the *magnitudes* should be treated as platform-specific.

### 5.2 Head-to-head win-rate spread — the numbers you can actually quote

| Domain | Stronger-player win rate | Source |
|---|---|---|
| Chess, #1 vs #100 (single game, Jan 2026) | **~77%** (2840 vs 2628 = 212 Elo) | **[OWN]** calc from [FIDE Jan 2026](https://en.chessbase.com/post/fide-ratings-january-2026) |
| Chess, #1 vs #100 — Grant's claim | 91% | **[U]** implies ~400 Elo; unsupported |
| Hearthstone, world-#4 ranked player, all matches | **63%** | Grant, quoting Tidesoftime **[V]** |
| Hearthstone, "very strong" Legend player | **60%** is "the mark of a very strong player" | [PC Gamer, 15 Apr 2016](https://www.pcgamer.com/should-the-skill-of-competitive-hearthstone-players-be-primarily-assessed-on-results/) **[P]** |
| Poker (2010 WSOP), predicted-skilled vs field, head-to-head | **54.9%** | [Levitt & Miles 2011](https://pricetheory.uchicago.edu/levitt/Papers/WSOP2011.pdf) **[V]** |
| MLB, prior-year playoff team vs non-playoff team | **55.7%** | Levitt & Miles, as their comparison anchor **[V]** |

Levitt & Miles' fuller result, from 57 tournaments / 32,496 entrants / $185M in prizes: high-skill players returned **+30.5% ROI** (> $1,200/player/event) vs **−15.6%** for everyone else; excluding the Main Event, **+9.8% vs −13.8%** **[V]**. They conclude poker's predictability is "similar to that between teams in Major League Baseball" **[V]**.

**[OWN]** The single most useful framing here: **elite poker skill produces a 54.9% edge per encounter.** That is what a decade of professional mastery buys in the most-studied skill-and-luck game in the world. Any designer who thinks 60% is a low skill ceiling is calibrated wrong.

### 5.3 Games-to-significance — the table Manzil should actually design against

**[OWN]** All figures below are my own computation. `n@80%` = number of games needed for a two-sided binomial test at α = 0.05 to detect that the stronger player's true rate differs from 50%, with 80% power. Bo*k* columns = probability the stronger player wins a best-of-*k* match.

| True per-board win rate | Bo3 | **Bo5** | Bo7 | Bo9 | games to significance (n@80%) | implied Elo gap |
|---:|---:|---:|---:|---:|---:|---:|
| 0.52 | .530 | **.537** | .544 | .549 | 4,903 | 14 |
| 0.55 | .575 | **.593** | .608 | .621 | 783 | 35 |
| 0.58 | .619 | **.647** | .671 | .690 | 304 | 56 |
| 0.60 | .648 | **.683** | .710 | .733 | 194 | 70 |
| 0.63 | .691 | **.733** | .766 | .793 | 114 | 92 |
| 0.65 | .718 | **.765** | .800 | .828 | 85 | 108 |
| 0.70 | .784 | **.837** | .874 | .901 | 47 | 147 |
| 0.75 | .844 | **.896** | .929 | .951 | 29 | 191 |
| 0.80 | .896 | **.942** | .967 | .980 | 19 | 241 |
| 0.91 | .977 | **.994** | .998 | .999 | 9 | 402 |

Read this against Manzil's best-of-five structure. **Bo5 amplifies a per-board edge by roughly the amount shown in the bolded column.** A 0.60 per-board edge becomes a 0.683 match edge. A 0.70 becomes 0.837. Best-of-five is doing meaningful skill-amplification work already — going to Bo7 buys another ~3 points at p=0.65 and less at the extremes.

### 5.4 The proxies, ranked by usefulness for Manzil

**[OWN]**

1. **Bot-ladder win-rate spread** — the single most practical: build a strong solver-bot, a medium bot, and a random-legal-move bot, and measure `P(strong beats random)` and `P(strong beats medium)`. If `P(strong beats random)` drops below ~0.85 after adding the shuffle, you have added too much luck. If it stays at 1.00, you probably have not broken determinism.
2. **Best-response gap** (the K in Silver's framework, below) — expected score of perfect play vs. uniform-random play, from the opening position, averaged over shuffles. This is directly computable for a 9-slot board and is the cleanest single number.
3. **Games-to-significance** — from §5.3, derived from #1.
4. **Opening-book coverage** — % of shuffles for which a single memorised first move is optimal. Currently 100% (seven moves cover all 28 nights). Target: low.
5. **Decision entropy** — how many distinct first moves are optimal across the shuffle space. Currently ≤7. This is the direct measure of the thing the designer is trying to fix.
6. **Elo SD of the live population** — only meaningful once there is a population; use Duersch et al.'s method and the 50%-Chess benchmark as the sanity threshold.

### 5.5 A caution on one recent source

The preprint ["Quantifying Skill and Chance: A Unified Framework for the Geometry of Games"](https://arxiv.org/html/2511.11611v1) (David H. Silver, Remiza AI, Nov 2025) proposes a Skill–Luck Index S(𝒢) = (K−L)/(K+L) ∈ [−1,1], where **K (Skill Leverage)** is "the advantage of optimal decision making over a fixed random baseline" **[V]** and **L (Luck Leverage)** is "the counterfactual swing attributable to chance outcomes under a fixed policy" **[V]**. It reports Chess S = +1.0, Backgammon S = 0.0 (volatility Σ = 1.20), Poker S = 0.33 (K = 0.40±0.03, Σ = 0.80), Baccarat S = −1.0.

**[U] Use with caution.** This is an unrefereed arXiv preprint from a single author at a small company, and the tabulated game values read as illustrative model outputs rather than measurements on real play data. **[OWN]** Backgammon at S = 0.0 is hard to square with Duersch et al.'s finding that backgammon shows significant, measurable skill. However, **the K definition — best-response value minus random-baseline value from the start state — is a genuinely good metric and is exactly computable for a game the size of Manzil**. Take the metric; leave the table.

---

## Implications for Manzil

**1. You do not have a randomness problem. You have a *solvability* problem — and Sirlin's three-item list puts randomness last for a reason.** The complaint is that seven memorised openings win 100% of boards. The literature's ranked answers are "unknown elements, hidden information, **or** randomness" ([Sirlin](https://www.sirlin.net/articles/solvability)), and Sirlin's own designs — including a *card game* — reach for hidden information first. Before you shuffle anything, price the alternative: **make card placement simultaneous and double-blind**. Both players secretly choose a card and a slot; both reveal; conflicts resolve by a stated priority rule. That single change destroys the opening book, adds *zero* luck, converts the optimal strategy from a lookup table into a mixed strategy the player must generate under pressure, and creates yomi — the read-your-opponent skill Sirlin considers the highest form of the genre. It also composes with the astrology skin (two forces committing simultaneously, revealed together) far better than a shuffle does.

**2. If you shuffle, shuffle *before* the board and show everything — the Chess960 move, not the Hearthstone move.** The precedent that matches your exact failure mode is [Chess960](https://en.wikipedia.org/wiki/Chess960), invented by a world champion to kill a memorised opening book, using randomisation that is **pre-game, symmetric, one-shot, and fully visible**. The Manzil translation: at the start of each board, deal the player a hand of 5 from a larger pool (say 8–9 of the 28 mansions), **reveal it fully**, and reveal the sky's five planets and their slot preferences at the same time. Both players have complete information from move one; the *position* is what varies. Grant's Prismata does exactly this and he is emphatic about the formula: "Randomness is used before the game begins … and once the game begins, there is no additional RNG whatsoever."

**3. Randomise *which cards*, never *which number wins*.** Garfield, 2012: "I think it tends to be better to have randomness come from different choices rather than just random success or failure." Your combat resolution — bigger face claims the card, ties flip — is legible, deterministic, and instantly verifiable by the player. **Do not touch it.** No ±1 rolls, no percentage flip chances, no "the Moon is void-of-course so this attack fizzles." Every unit of luck you add should land in the *composition of the choice set*, never in the *resolution of a chosen action*. This is the one rule in this report that no source disagrees with.

**4. Build the Into the Breach guarantee: every loss must be reconstructible.** Justin Ma: "We wanted to make something where every death felt like your own fault." The [PLOS 2025 finding](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1013787) says your players will attribute losses to the shuffle **with high confidence**, well above its true causal weight — self-attribution bias produced "overconfidence in external blame" at Z = 5.08, P < 0.001. Your only defence is attributability. Concretely: after each board, show a **post-mortem** — the position at the critical move, what you played, what the best line was, and how many cards it was worth. Reframing "you got unlucky" into "you got a hard hand and misplayed slot 6" is the whole ballgame. It converts the loss from a story about the sky into a story about the player, which is both truer and more motivating.

**5. Give the player levers over the degree of randomness — this is the empirically supported variable, not the amount of randomness.** The [IEEE CoG 2021 study](https://ieee-cog.org/2021/assets/papers/paper_259.pdf) found input randomness *lowered* satisfaction (p = 0.024) while output randomness had no effect (p = 0.859), and attributed the result to control, not timing: "randomness on its own was not pleasurable but not having control over the degree of randomness was a nuisance." Balatro monetises exactly this (shop rerolls, blind skips, seeded runs); Hearthstone's most-praised random mechanic is **Discover** — three random offers, player picks one, which Brode called "a great example of a random effect that adds skill." For Manzil: **draw 7, keep 5** (a mulligan, in the astrology skin: "election" — choosing your hour). Or a once-per-match re-deal. The randomness stays; the helplessness goes.

**6. Symmetry is the argument you will have to make out loud, so build a game where it is actually true.** Brode's defence — "both players are feeling the same amount of randomness" — works because players can *check* it. Manzil's asymmetry is a problem here: **the sky is deterministic and the player is not.** If you shuffle only the player's hand, you have created textbook **"biased" randomness** in James Ernest's taxonomy ("gives resources unfairly to one player; easiest to design but problematic"), and you will get the worst of both worlds — a player who loses to a *fixed* opponent because of *their own* bad draw. That is the least defensible arrangement possible. Either randomise the sky too (the real ephemeris already gives you 28 nights of variation — lean on it: let the night be drawn rather than chosen, or let planetary positions carry a visible-but-varying strength), or give the player enough mitigation (point 5) that draw quality stops being decisive.

**7. Keep best-of-five, and use it as your variance budget.** From my table in §5.3: Bo5 converts a 0.60 per-board edge into a 0.683 match edge and a 0.70 into 0.837. That is real amplification for free. But heed Garfield's cost clause — "a long game with a lot of luck does threaten to frustrate the more skillful players, who don't want to invest a lot of time and energy on a spurious outcome." Marvel Snap's answer was 6 turns and sub-5-minute matches; a 9-slot board is comparably short, which is *why* it can afford variance. **Do not lengthen the match to compensate for luck you added.** Add less luck instead.

**8. Set numeric targets before you build, and instrument against them.** Concretely: (a) a strong solver-bot should beat a random-legal-move bot **≥ 90%** of boards after the change — if it drops below ~85%, you have overshot; (b) the **best-response gap K** (perfect play vs. uniform-random play from the opening, averaged over deals) should stay large — this is computable exactly on a 9-slot board and is the cleanest single skill number available to you; (c) **opening-book coverage** — the fraction of deals where one memorised first move is optimal — should fall from its current 100% to under ~15%; (d) a strong human vs. a competent human should land near **0.60–0.70 per board**, which is chess-like enough to feel skillful (poker's elite edge is only 0.549) and gives a 0.68–0.84 Bo5 match rate. Every one of these is measurable in a weekend with a bot harness, before any art is made.

**9. Bound the tail rather than removing the swing — the Yogg-Saron fix, not the Yogg-Saron deletion.** Your Combo rule (a tie-flipped card attacks its own neighbours) is a *chain* mechanic, and chains are where variance goes non-linear: a single flip can cascade across the road and decide a board in one move. When Blizzard hit the same problem, they did not reduce Yogg's randomness, they gave the sequence a **stopping condition**. Manzil's equivalent: cap combo depth (a chain propagates at most 2 steps), or make each successive link require a strictly larger margin. You keep the drama and the highlight-reel moment; you cap the 1-in-20 board that a player could not have influenced. Test whether the current Combo rule already produces an unbounded tail before you add *any* draw randomness on top of it — you may find the variance problem you are about to create already exists.

**10. Resist the aesthetic temptation to make the *sky* random.** The astrology skin makes "the heavens are capricious" feel thematically irresistible. It is the wrong instinct — and it is precisely the "random success or failure" Garfield warns against. The sky's determinism is the game's best feature: it is a real ephemeris, it is *true*, and it means the player is solving a genuine external structure rather than fighting a die. The theme actually argues for point 1 and point 2: in traditional astrology the sky is fixed and knowable, and the practitioner's art is **election** — choosing *when* and *with what* to act. Randomise the practitioner's resources (which mansions are available tonight), never the sky's behaviour. That is both better design and better astrology.

---

## Source index

**Theory — primary**
- Keith Burgun, ["Randomness and Game Design"](https://www.gamedeveloper.com/design/randomness-and-game-design), Game Developer, 15 Oct 2014
- Richard Garfield, ["Getting Lucky"](https://www.superdan.net/download/blog/deltasdnd/Garfield_GettingLucky_GDM_November_2006.pdf), Game Developer Magazine, Nov 2006
- Richard Garfield, [interview](https://opinionatedgamers.com/2012/07/02/the-art-of-design-interviews-to-game-designers-20-richard-garfield/), The Opinionated Gamers, 2 Jul 2012
- Elias, Garfield & Gutschera, [*Characteristics of Games*](https://www.penguinrandomhouse.com/books/655769/characteristics-of-games-by-george-skaff-elias-richard-garfield-and-k-robert-gutschera-foreword-by-eric-zimmerman-and-peter-whitley/), MIT Press, 2012 — Ch. 5 "Indeterminacy" (**text not obtained**)
- David Sirlin, ["Solvability"](https://www.sirlin.net/articles/solvability) and ["Designing Yomi"](https://www.sirlin.net/articles/designing-yomi), 21 Aug 2014
- Elyot Grant, ["The role of luck in games / Why RNG isn't the answer"](https://www.gamedev.net/articles/game-design/game-design-and-theory/luck-in-games-why-rng-isnt-the-answer-r3877/), 2014; and ["Removing RNG"](https://www.gamedeveloper.com/design/removing-rng-how-eliminating-luck-can-benefit-strategy-card-games), Dec 2014
- Geoff Engelstein, [*Ludology* "GameTek Classic 183 – Input Output Randomness"](https://ludology.libsyn.com/gametek-classic-183-input-output-randomness)
- James Ernest, [*Volatility in Game Design*](https://static1.squarespace.com/static/5e1ce8815cb76d3000d347f2/t/5e2250e25dfafe47d32d5f49/1579307234917/Volatility+in+Game+Design.pdf), Gen Con 2012

**Theory — secondary / commentary**
- [Kind Fortress, "Design Patterns: Random Loops"](https://www.kindfortress.com/2018/10/03/design-patterns-random-loops/), 3 Oct 2018
- [Skeleton Code Machine, "Input-Output Randomness (Part 1)"](https://www.skeletoncodemachine.com/p/input-output-randomness-part-1), 28 Nov 2023
- [Frank Lantz, "Playing Balatro"](https://franklantz.substack.com/p/playing-balatro), 29 Mar 2024
- [Matthew Gallant, "A Taxonomy of Randomness in Hearthstone"](https://gangles.ca/2016/09/12/hearthstone-randomness/), 12 Sep 2016

**Case studies**
- Ben Brode [on X](https://x.com/bbrode/status/1584768759885336576), 25 Oct 2022; [Twinfinite](https://twinfinite.net/marvel-snap/ben-brode-defends-marvel-snaps-most-hated-locations/), 17 Nov 2022; [MobileGamer.biz / GDC 2023](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/), 23 Mar 2023; [HearthPwn](https://www.hearthpwn.com/news/1745-ben-brode-on-randomness-in-hearthstone-karazhan), 23 Sep 2016; [Kotaku](https://kotaku.com/hearthstone-director-reveals-the-craziest-card-weve-eve-1825114809), 9 Apr 2018
- [Shacknews, Yogg-Saron nerf](https://www.shacknews.com/article/96969/hearthstones-yogg-saron-and-aggressive-decks-getting-nerfed), 28 Sep 2016
- Justin Ma, [Road to the IGF: Into the Breach](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-), 23 Feb 2018
- Anthony Giovannetti, [GDC 2019 "Slay the Spire: Metrics Driven Design and Balance"](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf); [Fox Row statistical analysis](https://foxrow.com/slay-the-spire-statistical-analysis), 14 Dec 2020
- [Chess960](https://en.wikipedia.org/wiki/Chess960); Ian Duke, [London Mulligan announcement](https://magic.wizards.com/en/news/announcements/london-mulligan-2019-06-03), 3 Jun 2019

**Empirical**
- [Zhang, Monteiro, Liang, Ma & Baghaei, "Effect of Input-output Randomness on Gameplay Satisfaction in Collectable Card Games", IEEE CoG 2021](https://ieee-cog.org/2021/assets/papers/paper_259.pdf)
- [Okamoto et al., "Blaming luck, claiming skill", PLOS Comp. Biol., 16 Dec 2025](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1013787)
- [Freeman, Wu, Nower & Wohn, CHI PLAY 2022](https://yvettewohn.com/wp-content/uploads/2022/12/2022_chiplay.pdf)
- [Yin & Xiao, "The Reward for Luck", CHI '22](https://www.robertxiao.ca/research/reward-for-luck/)
- [Duersch, Lambrecht & Oechssler, "Measuring skill and chance in games"](https://www.uni-trier.de/fileadmin/fb4/prof/BWL/FIN/Veranstaltungen/duersch--Skill_and_chance_2018-03-07.pdf), 2018 / *EER* 2020
- [Levitt & Miles, "The Role of Skill versus Luck in Poker"](https://pricetheory.uchicago.edu/levitt/Papers/WSOP2011.pdf), 2011
- [PC Gamer, Hearthstone skill assessment](https://www.pcgamer.com/should-the-skill-of-competitive-hearthstone-players-be-primarily-assessed-on-results/), 15 Apr 2016
- [FIDE ratings, January 2026](https://en.chessbase.com/post/fide-ratings-january-2026)
- **[U]** [Silver, "Quantifying Skill and Chance"](https://arxiv.org/html/2511.11611v1), arXiv preprint, Nov 2025 — unrefereed, use metric not table
