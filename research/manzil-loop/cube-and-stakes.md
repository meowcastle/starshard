# Stake, Doubling and Press-Your-Luck: Do They Amplify Skill or Dampen It?

**Research brief for *Manzil* — the "calling the sky" / Moonstone mechanic**
Prepared 2026-08-21. Topic: stake mechanics and their effect on the skill/luck ratio.

**Sourcing conventions used below.** Direct quotes reproduced from a source page are in
quote marks with a link. Where I am relaying a claim through a secondary summary rather
than the original text, it is marked **[relayed]**. Where a claim is widely repeated but I
could not verify it against a primary source, it is marked **[unverified]**. Section 6 is
my own arithmetic, not sourced — every number there is derived from stated assumptions and
most are checkable by hand in one or two lines.

---

## 0. The short answer

Stake mechanics do not amplify skill in general. They amplify **one specific kind of
skill — probability estimation under shared uncertainty — and they simultaneously dampen
another: the slow accumulation of positional advantage.** Which effect dominates depends
on properties of the underlying game that *Manzil, as currently described, does not have*.

A doubling cube converts a game about *playing well* into a game about *knowing how well
you are playing*. That conversion needs four preconditions:

1. **Shared irreducible uncertainty** — after both players have thought as hard as they can,
   the outcome is still genuinely in doubt for both. In backgammon the dice guarantee this.
2. **A continuous equity gradient** — the win probability drifts through the disputed
   region (roughly 55–85%) rather than jumping past it.
3. **Enough remaining game** — after a take, there must be enough play left for the taker's
   equity to recover.
4. **A live take/drop asymmetry** — a take point strictly between 0 and 50%, so both taking
   and dropping are live options across a meaningful band.

*Manzil* as described fails (1) hard and (2) moderately, and a best-of-five fails (3). The
detailed verdict and the conditions that would change it are in §7.

---

## 1. The backgammon doubling cube

### 1.1 History: the 1920s New York origin

The best-documented account is the [New England Backgammon Club's "Early Doublers & Cube
Evolution"](https://nebackgammon.org/index.php/early-doublers/), which distinguishes three
phases:

- **Doubling as a verbal act (~1925).** The earliest published reference is Grosvenor
  Nicholas's *Modern Backgammon* (April 1928), which says a player may "double the stake"
  with no physical device mentioned. The practice is attributed to **Grand Duke Dmitri of
  Russia**, allegedly in a match against **Aksel de Wichfeld** of Denmark; a 1931 *Harper's
  Bazaar* piece dates the innovation to "five years ago," i.e. c. 1925. **John P. Wemple** is
  credited with bringing it to New York society, and the **Racquet & Tennis Club** in New
  York was central to its adoption. **[relayed]**
- **"Doubling by matches" (~1929).** Stakes were tracked with ordinary parlour matches laid
  on the bar. Wikipedia's [Backgammon](https://en.wikipedia.org/wiki/Backgammon) article
  likewise says the cube "was first introduced in the 1920s in New York City among members
  of gaming clubs on the Lower East Side," with doubles recorded using "common parlour
  matches."
- **The physical cube (~May 1930).** **Grosvenor Nicholas** claimed in his 13 May 1931
  *Evening Standard* column to have "originated and introduced" the cube "about a year
  ago." The first known image of a doubling cube is a **Marshall Field & Company
  advertisement in the *Chicago Tribune*, 26 May 1930**. **Elizabeth Clark Boyden** gives
  the first explicit description (1930) of *turning* the cube and *pushing* it toward the
  opponent. **[relayed]**

**The Vogue 1929 quote.** Frank Crowninshield, "Bridge or Backgammon?", *Vogue*, 1929, as
quoted by the NEBC page:

> "Backgammon, as a game, was a dead and discarded pastime relegated to old men in chimney
> corners until the practise of doubling — 'doubling by matches,' as it is called — was
> injected into it and gave it a new stimulus . . ."

This is the load-bearing historical fact for *Manzil*: **the cube did not make backgammon
deeper, it made backgammon *interesting to gamble on*, and that is what revived it.** The
depth arrived as a consequence, not as the motivation.

Oswald Jacoby's own [history of the
game](https://bkgm.com/books/JacobyCrawford/HistoryOfBG/) confirms the motive: before
doubling, "many games were essentially decided early but required lengthy play to
completion." Doubling made continuing tolerable by raising the money. Jacoby: "Doubling and
redoubling has really livened up the game." **[relayed]**

### 1.2 The rules, exactly

From [Wikipedia: Backgammon](https://en.wikipedia.org/wiki/Backgammon) unless noted.

- **The cube** starts centred, on 1 (the face showing 64). Either player may propose
  doubling at the *start of their turn*, before rolling.
- **Take or drop.** The opponent must accept ("take") or resign the game at the current
  stake ("drop"/"pass").
- **Ownership.** "Whenever a player accepts doubled stakes, the cube is placed on their
  side of the board with the corresponding power of two facing upward, to indicate that the
  right to redouble belongs exclusively to that player." There is "no limit on the number
  of redoubles." Although 64 is the highest printed face, "the stakes may rise to 128, 256,
  and so on."
- **Beaver** (money play): the player accepting a double may immediately double again while
  *retaining* ownership. The original doubler may refuse (losing the current doubled stake)
  or play on at 4× the original.
- **Raccoon**: the beavered player may double the stakes once more; the opponent resigns or
  plays at 8× the original, with the beaverer still owning the cube. (A further extension
  sometimes called an "otter" is folklore in some clubs — **[unverified]**.)
- **Jacoby rule** (money play only): gammons and backgammons count double/triple *only if
  the cube has been offered and accepted*. Named for Oswald Jacoby. Purpose, per
  [backgammon-mfg](https://www.backgammon-mfg.com/News/what-is-the-jacoby-rule-in-backgammon.html):
  to accelerate play and prevent "invalid games" where a player with an obvious advantage
  has no incentive to double. **[relayed]** Not used in match play.
- **Crawford rule** (match play): when a player first reaches a score one point short of
  the match, "neither player may use the doubling cube for the following game." Normal
  doubling resumes afterwards. Named for **John R. Crawford** (4 Aug 1915 – 14 Feb 1976),
  Bermuda Bowl bridge champion and co-author with Jacoby of *The Backgammon Book* (1970)
  ([Wikipedia](https://en.wikipedia.org/wiki/John_R._Crawford)). *Caution: at least one
  secondary backgammon site gives Crawford's dates as 1931–1989, which is wrong — treat
  commercial backgammon content farms with suspicion.*
- **Free drop**: post-Crawford, when the trailer needs an *even* number of points, the
  leader may decline an early double and start the next game at even odds instead
  ([bkgm match play doubling](https://bkgm.com/articles/mpd.html)).
- **Holland rule**: post-Crawford, no double until two rolls each have been played. Common
  in 1980s tournaments, now rare.
- **Automatic doubles**: if both players roll the same opening number, the cube is
  incremented. Not an official rule; not used in match play.

### 1.3 The mathematics

#### The 25% take point

The foundational result, from [Peter Bell, "The Doubling
Cube"](https://bkgm.com/articles/Bell/TheDoublingCube/): if you take and lose you lose
2 units; if you drop you lose 1; if you take and win you win 2. That is a **3-to-1 payoff**,
so **take when your winning chances exceed 25%** — equivalently when cubeless equity
exceeds −0.5.

The conversion is `E = 2P − 1` and `P = (1 + E)/2` (no gammons). Bell's worked
gammon-adjusted example: 10% win-gammon, 20% win-single, 45% lose-single, 25% lose-gammon
gives `2(0.1) + 0.2 − 0.45 − 2(0.25) = −0.55` — a marginal drop.

**Note the identity with poker.** The pot-odds break-even is `call ÷ (pot + call)`
([Wikipedia: Pot odds](https://en.wikipedia.org/wiki/Pot_odds)). Facing a double, you are
"calling" 1 into a pot of 3 → 25%. *The backgammon take point and the poker pot-odds
call threshold are the same equation.* This is worth saying out loud to the designer: a
cube is a bet-or-fold with the bet size fixed at pot-sized.

#### The doubling window and the 80/20 result

[Keeler & Spencer, "Optimal Doubling in Backgammon" (*Operations Research* 23(6), 1975;
text at bkgm)](https://bkgm.com/articles/KeelerSpencer/OptimalDoublingInBackgammon/) model
the win probability as a continuous random walk on [0,1]. Their Lemma 1: from state *x*,
the probability of reaching *x+b* before *x−a* is `a/(a+b)`. Their Theorem 1 gives the
optimal doubling point and the optimal folding point as equal, at **0.8** — so **double at
80%, take at 20%** with a fully live cube and unlimited redoubles. In their non-continuous
endgame analysis the doubling point "approaches 0.8 rather slowly," with actual cutoffs of
0.65–0.73 and folding points 0.76–0.79.

The practical figure quoted in play is the **doubling window of roughly 70%–78%**
([Wikipedia: Backgammon match strategy](https://en.wikipedia.org/wiki/Backgammon_match_strategy)),
i.e. the band in which both a double and a take are correct. Bill Robertie's racing
heuristics via Bell: **double with an 8% racing lead, take when trailing by ≤12%, redouble
with a 9% lead.**

#### Finite doubles — directly relevant to a capped "Moonstone"

[Ju, Leifer, Miller, Padmanabhan, Sun, Tichi, Tocher & Wallace, "Optimal Doubling
Thresholds in Backgammon-like Stochastic Games" (11 Oct
2024)](https://web.williams.edu/Mathematics/sjmiller/public_html/math/papers/Backgammon_ArtCurtis_OptimalDoublingThresholds10Oct2024.pdf)
give a closed form for the threshold with **k doubles remaining**:

```
d_k = 4/5 + (1/5)·(−1/4)^k
```

So `d_1 = 0.75`, `d_2 = 0.8125`, `d_3 = 0.796875`, converging to the Keeler–Spencer 0.8.
They also give the general form for a raising cube with multiplier *y* on acceptance and
forfeit *x*:

```
d_k = y(x+1)/(2y+xy−x) + [x(x+1)(y−1) / 2(2y+xy−x)]·(−(y−x)/(y(x+1)))^k
```

**Implication for Manzil:** if the Moonstone can be played only once, the cash point is
**75%** and the take point is **25%** — the same 25% as the classical rule, which is a
pleasant coincidence to design around.

#### Janowski's cube formula and cube efficiency

Rick Janowski's model, as implemented in GNU Backgammon
([manual](https://www.gnu.org/software/gnubg/manual/html_node/Basic-formula-for-cubeful-equities.html)):

```
E(cubeful) = E(dead)·(1 − x) + E(live)·x
MWC(cubeful) = MWC(dead)·(1 − x) + MWC(live)·x
```

where **x is the cube life index / cube efficiency**: `x = 0` means the cube is dead,
`x = 1` means perfectly live. "In reality x is somewhere in between, with typical values
around 0.6 – 0.8."

GNU's actual values
([manual](https://www.gnu.org/software/gnubg/manual/html_node/The-cube-efficiency.html)):

| Position type | x |
|---|---|
| One-sided bearoff | 0.60 |
| Race | 0.60 → 0.70, linear in pip count (40 pips → 0.60, 120 pips → 0.70) |
| Crashed | 0.68 |
| Contact | 0.68 |
| Mutual holding games | "intuitively lower" (no value given) |
| Backgames | "often low" (no value given) |

**Why holding games and backgames have low efficiency matters for Manzil.** Those are
positions where equity moves in *large jumps* — a shot hits or it doesn't. Mark Higgins'
[jump model](https://arxiv.org/abs/1203.5692) ("Cube Handling In Backgammon Money Games
Under a Jump Model," 2012) makes this explicit: he replaces Janowski's continuous evolution
with a series of random jumps and derives take/cash points as functions of **jump
volatility σ**. He notes that "when jump volatility is zero the jump model reduces to the
live cube limit," and finds an empirically optimal constant jump volatility of **9.1%**
from bot self-play (vs. 9.4% from direct statistical estimation). **[relayed]**

**The general law: smooth equity paths make the cube efficient; chunky equity paths make it
inefficient.** A nine-slot board where one placement can flip three cards is a chunky path.

#### Match equity tables

[Kit Woolsey's match equity table](https://bkgm.com/articles/Woolsey/TheMatchEquityTable/)
is the canonical one. Selected values (leading player's match-winning chance, points-away
by points-away):

| away \ away | 1 | 2 | 3 | 4 | 5 | 7 |
|---|---|---|---|---|---|---|
| **1** | 50 | 70 | 75 | 83 | 85 | 91 |
| **2** | 30 | 50 | 60 | 68 | 75 | 85 |
| **3** | 25 | 40 | 50 | 59 | 66 | 76 |
| **4** | 17 | 32 | 41 | 50 | 58 | 70 |
| **5** | 15 | 25 | 34 | 42 | 50 | 63 |
| **7** | 9 | 15 | 24 | 30 | 37 | 50 |

Woolsey: "in order to make intelligent cube decisions during a match, it is essential to
know what your chances of winning the match are at various match scores." He emphasises
**cube leverage for the trailer**: "if he doubles, the leader can never redouble, but if
the leader doubles and the trailer takes, then the trailer will immediately whip it back
to four."

Corresponding market windows from [bkgm's match play doubling
page](https://bkgm.com/articles/mpd.html): 2-away/3-away → take/refuse band 34–75;
3-away/2-away → 25–66; 2-away/2-away → 30–70. And the normalisation used to compare errors
across scores, **EMG** ([Wikipedia](https://en.wikipedia.org/wiki/Backgammon_match_strategy)):

```
EMG = 2·(MWC − MWC_lose) / (MWC_win − MWC_lose) − 1
```

#### Woolsey's Rule and its limits

**Woolsey's Rule**: *"If you aren't sure whether your opponent has a correct take, you
**must** double."*
[Douglas Zare's analysis](https://bkgm.com/articles/Zare/WoolseysRuleInMatchPlay/index.html)
shows this is a money-play rule that breaks in match play. Zare's numbers: in money play,
doubling from a dead-lost position needs roughly **33% bad passes** to be justified; in
match play the required error rate ranges from **12–14%** in gammonish positions while
leading 3-away, up to **63–77%** when leading 2-away. **[relayed]**

This is the first warning sign for a short match: **the same cube action is right at one
score and catastrophically wrong at another, and the difference is not intuitive.**

#### Kleinman's framing

Danny Kleinman ([The Care and Feeding of the Doubling Cube, Part
1](https://bkgm.com/articles/Kleinman/CareAndFeedingPart1/index.html)) treats cube
ownership as a **financial call option** — you may exercise it to force the opponent out, or
hold it as an investment in higher stakes. His gammon adjustment:

```
X = W + (G − g)/2 + (B − b)
```

and his opponent-modelling rule: double at 75% against a normal (25% take point) opponent;
double *closer to their actual take point* against a liberal taker; double at their *point
of first pass* against a conservative one. **[relayed]** Note the implication: **optimal
cube play depends on modelling the opponent's errors, not just on the position.** That is
a poker-shaped skill, not a chess-shaped one.

### 1.4 Does the cube actually increase the skill differential? What the numbers say

This is the claim the designer wants stress-tested. Here is the honest state of the evidence.

**Evidence for.**

- **Cube decisions contain no luck at all.** Douglas Zare, [A Measure of
  Luck](https://www.bkgm.com/articles/Zare/AMeasureOfLuck.html), defines luck as "the
  equity you gain through the roll of the dice" — equity after the roll minus equity
  before, under best play. On that definition, **the doubling cube itself involves no luck,
  only skill**, and "the outcome of a match or money game equals the net luck plus the net
  skill difference." So every unit of match outcome attributable to cube decisions is by
  construction a unit of pure skill. **[relayed]**
- **Cube decisions carry roughly a third of measured error.** On the two-plus-two
  backgammon forum, **Bill Robertie** gives Snowie error-rate benchmarks (millipoints per
  move): elite 2.5–3.0, strong 3.0–4.0, top players of 1979–84 4.5–5.5, Snowie itself
  1.0–1.5 — and states that **"about 2/3 of these error rates are contributed by checker
  play, and about 1/3 from cube errors."** Hallberg (2004 world championship finalist)
  confirms the split.
  ([thread](https://forumserver.twoplustwo.com/138/backgammon-forum-hosted-bill-robertie/snowie-cube-error-rates-754563/))
  **[relayed]** This is the single best number available for the question "how much of a
  match's skill content lives in cube decisions": **about one third**, on far fewer
  decisions than checker play — so cube decisions are *individually* far more
  consequential.
- **The bot rating bands.** GNU Backgammon's [overall
  rating](https://www.gnu.org/software/gnubg/manual/html_node/Overall-rating.html) folds
  checker and cube error into one normalised error rate per move (×1000 = "PR"):

  | Normalised error/move | Rating |
  |---|---|
  | 0.000–0.002 | Supernatural |
  | 0.002–0.005 | World Class |
  | 0.005–0.008 | Expert |
  | 0.008–0.012 | Advanced |
  | 0.012–0.018 | Intermediate |
  | 0.018–0.026 | Casual |
  | 0.026–0.035 | Beginner |
  | >0.035 | Awful! |

  The rating formula explicitly weights the two components separately, e.g. the FIBS-rating
  form quoted on rec.games.backgammon:
  `FIBSr = 2050 − (checker(N)·Checker_mEMG + Cube(N)·Cube_mEMG)`
  with weights depending on match length N
  ([thread](https://groups.google.com/g/rec.games.backgammon/c/G3H_NpSVgZo/m/1AKah9pLCAAJ)).
  **[relayed]**
- **The qualitative consensus.** [gamesprecipice](https://www.gamesprecipice.com/doublingcube/):
  "The doubling cube adds an entire level of strategy to Backgammon that didn't exist prior
  to its creation… Strategic use of the doubling cube puts control into the hands of
  players, rather than fate of the dice." **[relayed]**

**Evidence against / caveats.**

- **A widely-repeated overstatement.** [backgammon.com's cube
  page](https://backgammon.com/learn/doubling-cube) asserts that "cube decisions account for
  a larger share of overall error than checker play decisions in typical games." **This
  directly contradicts Robertie's 2/3–1/3 split and should not be relied on.** Flagged as
  **[unverified]** and probably wrong.
- **Match length, not the cube, is what makes skill show.** Michael Simborg, [Luck vs.
  Skill in Backgammon](https://bkgm.com/articles/Simborg/LuckVsSkill/index.html): "I have
  seen rank beginners beat experts in single games. I have even seen it in 3 and 5 point
  matches." For an 11-point match beginner-vs-expert, "the odds of a rank beginner beating
  an expert… are well under 10 to 1." His own worked case: world-class vs intermediate over
  a **3-point match** → "I should beat this person 93 percent of the time," i.e. he loses
  7 in 100. **[relayed]** *A 3-point match is exactly Manzil's best-of-five.*
- **The cube shortens the match, and shorter matches favour the underdog.** This is my own
  arithmetic (§6.3) and it is the most important counterweight to the "cube = more skill"
  slogan: in a *fixed-length* match, doubling raises the points per board, which reduces the
  number of boards, which raises variance.

**Synthesis.** The defensible version of the claim is:

> The cube amplifies **decision skill under uncertainty** (a third of total measured error,
> concentrated in a handful of moments per match, with individually enormous stakes), and it
> dampens **positional skill** by shortening the match. In backgammon the first effect wins
> because there is a lot of decision skill to have and matches are long (11, 15, 25 points).
> In a 3-point match the second effect is comparable in size.

---

## 2. Marvel Snap: snap / retreat

### 2.1 The cube economy, exactly

Sources: [untapped.gg's snapping & retreating
wiki](https://blog.snap.untapped.gg/marvel-snap-wiki-snapping-retreating), the [official
help centre](https://marvelsnap.helpshift.com/hc/en/3-marvel-snap/faq/95-what-do-cubes-do/),
and [Mastering Snap](https://masteringsnap.com/to-snap-or-not-to-snap/).

- Each match starts at **1 cube** at stake.
- Each player may **snap once per game**, doubling the stake. "When a player snaps, the
  cubes up for grabs will be doubled **at the end of the turn**" — so the opponent gets a
  chance to retreat **before** the increase lands. That is the take/drop window.
- "After the end of the final turn of the game (usually turn 6) the stakes will **double
  automatically**."
- Therefore reachable final stakes are **1, 2, 4, or 8**. No snaps → 2. One snap → 4. Both
  snap → 8.
- **Retreating** ends the game immediately and you lose the *current* (not the pending)
  stake. Ties transfer no cubes.
- **Cubes are the ladder currency**: "Winning ranked battles will get you cubes, which
  allow you to unlock Ranked rewards and reach higher ranking tiers." You can win up to 8
  cubes in a single match.

Note the two deliberate differences from backgammon, both cited by Zvi Mowshowitz in
[Marvel Snap: Phase 1](https://www.lesswrong.com/posts/hNa4JBgtuhb8tY3je/marvel-snap-phase-1):
**hidden information** (your snap represents a hidden hand, "similar to poker betting"),
**automatic doubling** at the end (which "prevents forced retreats"), and **no cube passing**
(each player snaps once; the cube never returns to the opponent). **[relayed]**

### 2.2 The take points

Two independent sources derive the same thresholds:

- **Facing a snap late (turn 6), retreat costs the current stake and the doubled game is
  symmetric → 25% take point.**
- **Facing a snap earlier, when the pending automatic double is still ahead of you → 37.5%.**
  [Eric Guan](https://ericguan.substack.com/p/marvel-snaps-ancient-inspiration):
  "Snap also adds an additional twist with the automatic doubling on the final turn," which
  "raises the forfeit threshold to 37.5%."
  [Mastering Snap](https://masteringsnap.com/to-snap-or-not-to-snap/): turn-6 snap → 25%
  minimum win probability to call; turn-3 snap → "37.5% odds of winning to call."

Check the arithmetic: opponent snaps while stake is 1, so if you play on the final stake
will be 4. Retreat now costs 1. Play on: `4p − 4(1−p) = 8p − 4`. Indifference at
`8p − 4 = −1` → **p = 3/8 = 37.5%**. The automatic end-of-game double makes Snap's take
point *tighter* than backgammon's — i.e. it is easier to be pushed off a hand.

Mastering Snap's EV expressions, as written on the page:

```
no snap  : P(retreat)·1  − P(stay & lose)·2 + P(stay & win)·2
with snap: P(retreat)·1  − P(stay & lose)·4 + P(stay & win)·4
                          − P(snapped & lose)·8 + P(snapped & win)·8
```

### 2.3 What Second Dinner actually said

The primary source is Ben Brode's GDC 2023 talk, **"Designing MARVEL SNAP"** ([GDC
Vault](https://gdcvault.com/play/1029024/Designing-MARVEL-SNAP); free video at
`youtube.com/watch?v=HjhsY2Zuo-c`). The session description states the game "took it in a
whole new direction with three-minute battles, locations" and **incorporates mechanics
borrowed from backgammon**.

Quotes, via Apple's ["Behind the Design: MARVEL
SNAP"](https://developer.apple.com/news/?id=sosm2p7q) (attributing the idea to co-founder
**Hamilton Chu**):

> "He said, 'You know what would be really fun? Incorporating the doubling cube from
> backgammon.' We tried it and immediately realized we were onto something."

> "If you decide to leave because it's strategically correct, that's not losing!"

> "'Escaped' zeroes out the emotional negativity."

Via [mobilegamer.biz's writeup of the GDC
talk](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/):

> "It made losing feel like victory. It's a strategic retreat where you don't fall victim
> to your opponent's gambit."

and, importantly, **Brode "ran through nine different variations of the doubling cube
mechanic his team prototyped before they ended up with the more straightforward one in the
game today."** **[relayed]** — nine prototypes to land on "one snap each, auto-double at
the end."

[Notes from the talk](https://stevelilley.com/2026/03/17/gdc-talks-gdc-2023-designing-marvel-snap/)
record the design goals as **agency and comeback** ("retreat early as the bet was increased,
making them feel smart for leaving early before losing more resources") under the slogan
**"zero sum games = zero fun."** The team's stated analogy was poker: "betting and bluffing
in poker adds a lot of depth to a rather simple game." **[relayed]**

**The design lesson for Manzil is precise: Second Dinner's stated reason for the cube was
not depth, it was *loss mitigation*.** The snap exists so that losing players have a way to
lose less and feel clever about it. Depth was the second-order benefit.

### 2.4 The "retreat is a skill" discourse and what data exists

- Marvel Snap Zone's ["Cube Rate or Win Rate?"](https://marvelsnapzone.com/cube-rate-or-win-rate/)
  argues explicitly that the two come apart: a deck can have a high win rate and a low cube
  rate (you aren't snapping enough) or the reverse. Their example: a Sera Dark Ctrl deck at
  **57.38% win rate, 0.53 cube rate.** The conclusion is the key one:
  > "Snapping effectively is not a deck factor, it's a gameplay attribute; therefore, if you
  > play a high win rate deck and Snap well, you're likely to have more success than
  > pursuing high cube rate decks with low win rates."
  **[relayed]** — i.e. **cube skill is separable from deck strength and is measured on a
  different axis.**
- Population data from Marvel Snap Zone's
  ["Snapalytics"](https://marvelsnapzone.com/snapalytics-more-cubes-on-tuesdays/) (tracker
  users, so self-selected): cube rate at ranks 70–99 averages **0.9 cubes/game at the start
  of a season and 0.2 at the end**; "a player with a cube rate over 1.0 is rare enough, and
  there are **20 times more of them than those with a cube rate over 2.0**." Some players
  sustain **>3.0 over 50+ games.** **[relayed]** The extreme right tail of cube rate is far
  above what any plausible win-rate advantage alone could produce — that is the strongest
  available empirical hint that **snap/retreat skill compounds harder than deck skill.**
- **[unverified]** I could not find a study attributing a specific fraction of rank progress
  to cube decisions vs. deck strength. Zvi explicitly declines to quantify it, noting only
  that opponents improve at deck-building faster than at snap/retreat.
- Zvi's taxonomy of snaps is worth stealing: **bluffing snaps** (force a retreat),
  **edge snaps** (put the opponent to a hard decision with a real advantage), **winning
  snaps** (they should have retreated and will regret not doing so).
- One structural criticism worth noting: [snap.fan on the Infinite
  Climb](https://snap.fan/news/marvel-snap-getting-rid-of-the-infinite-climb/) — "One player
  betting on the outcome of a game (with cubes) while at a rank floor against someone who
  isn't, is inherently unfair." **Asymmetric downside turns a stake mechanic into a
  free-roll for one side.** **[relayed]**

---

## 3. Poker: bet/fold as the same idea

### 3.1 The math is the same equation

[Pot odds](https://en.wikipedia.org/wiki/Pot_odds): "the ratio of the current size of the
pot to the cost of a contemplated call." Break-even equity = `call ÷ (pot + call)`. A $30
pot and a $10 call → 3:1 → 25%. Worked example from the same page: a turn flush draw with
9 outs is 9/46 ≈ 19.6% (4:1); a $50 pot with a $10 bet gives 5:1 pot odds; 4:1 beats 5:1,
so call. **Implied odds** add expected future betting: a $1 call into a $10 pot with 4 outs
(10.75:1, 8.5%) is a fold on raw odds and a call at 11:1 implied.

So: **backgammon's take point, Marvel Snap's retreat point and poker's calling threshold
are one formula.** The differences are entirely in what generates the uncertainty (dice,
hidden cards, hidden hands) and in whether the bettor can bluff.

### 3.2 The "betting is what makes it a skill game" argument, quantified

- **Noga Alon, ["Poker, Chance and
  Skill"](https://www.cs.tau.ac.il/~nogaa/PDFS/skill.pdf)** analyses simplified Hold'em-like
  models. Proposition 4.1: against a random-playing opponent, a skilled player's expected
  gain is **1/8 chip per hand** with **variance 15/64**. Proposition 5.2 (CLT): after **60
  hands** the probability the unskilled player is ahead is ≈ **0.0227**; after **240 hands**
  it drops **below 1/30,000**. His conclusion: "the skill component in poker… which gives
  some advantage in a single hand, provides a major advantage in a sequence of games," and
  "poker is predominantly a game of skill." **[relayed]** *(The page does not itself
  reference a Dutch legal proceeding, contrary to how it is often cited.)*
- **The Cigital / PokerStars study (27 March 2009).** Data from PokerStars' World Record
  Week (December 2008): **103 million hands** analysed; **75.7%** of hands "did not go to
  showdown," and at showdown the strongest hand won only **50.3%** of the time. The widely
  quoted "**88% skill**" headline is a derived figure whose derivation is not transparent.
  ([PokerNewsDaily
  writeup](https://www.pokernewsdaily.com/study-reveals-poker-is-a-game-of-skill-1724/))
  **[relayed and partially unverified]** — treat 103M/75.7%/50.3% as usable, treat "88%
  skill" as advocacy arithmetic commissioned by an interested party.
  The load-bearing logic is nonetheless exactly the Manzil-relevant one: *three quarters of
  poker hands are decided by betting rather than by comparing cards*, so betting is not a
  layer on top of the game, it **is** the game.
- **Levitt & Miles, "The Role of Skill Versus Luck in Poker: Evidence from the World Series
  of Poker"** (NBER w17023; *Journal of Sports Economics* 15(1), 2014;
  [PDF](https://pricetheory.uchicago.edu/levitt/Papers/WSOP2011.pdf)). 2010 WSOP,
  **32,496 player-entries**; **720 players (2.2% of entrants, 12.1% of entries)** classified
  ex ante as high-skill. Results: **high-skill ROI +30.5%, all others −15.6%** — a
  **46.1-point** gap. In head-to-head terms the high-skill player wins **54.9%** of
  matchups, which they compare to MLB playoff teams winning **55.7%** of their games the
  following season. Their read: "strong evidence in support of the idea that poker is a
  game of skill."
- **The Dutch litigation is genuinely split, and the split is instructive.** An
  **Amsterdam court, 24 January 2014**, after a seven-year trial and relying on "research
  conducted by a group of independent experts," found poker "first and foremost a game of
  skill, not of chance"
  ([PokerNews](https://www.pokernews.com/news/2014/01/amsterdam-court-rules-poker-a-skill-game-17340.htm)).
  The **Amsterdam Court of Appeals reversed in March 2016**, defining a game of chance as
  "every game in which the probability of winning depends on chance, **even if the
  probability increases with more proficiency or greater skill of the player**"
  ([PokerNews](https://www.pokernews.com/news/2016/03/dutch-court-rules-poker-a-game-of-chance-24265.htm)).
  **[relayed]**
  **The lesson for a designer: "skill dominates" and "chance is present" are not opposites.**
  A stake mechanic makes the skill more *visible* and more *rewarded*; it does not make the
  randomness go away, and it can make the game feel more gambling-like to outsiders.

---

## 4. Press-your-luck elsewhere: what makes a stake decision interesting

### 4.1 The design principle: calibrated opacity

The clearest statement is at [gameideas.net's push-your-luck
page](https://www.gameideas.net/push-your-luck):

- **Too transparent** — "If winning odds are easily calculable (like Pig's static 1/6 bust
  chance), the mechanic becomes boring quickly."
- **Too opaque** — "If probabilities are unclear, players experience frustration rather than
  tension."
- **The sweet spot** — "fuzzy but not completely hidden math creates 'an addictive quality'."

They also quote Reiner Knizia: "the stakes are rising. If things go wrong, you lose it all.
Great risks bring great rewards — or utter defeat!" **[relayed]**

The [Board Game Design Course](https://boardgamedesigncourse.com/game-mechanics-sometimes-you-want-to-push-your-luck/)
adds three structural requirements: **escalating risk**, **information management** (enough
signal to decide, not enough to compute), and **catch-up** (partial rewards on a bust so the
system doesn't produce runaway leaders). Their stated failure mode: "Games fail when
consequences feel arbitrary or when risk-taking becomes mathematically inferior to
conservative play." **[relayed]**

### 4.2 The exemplars

- **Can't Stop** (Sid Sackson, Parker Brothers 1980,
  [Wikipedia](https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game))). Three neutral
  runners; columns 2–12 with lengths **3, 5, 7, 9, 11, 13, 11, 9, 7, 5, 3** — lengths track
  the two-dice distribution. You bust when none of the four dice can be paired into an open
  runner column. Three columns wins.
  **Why the decision stays interesting:** the bust probability is *not* static. It is
  determined by which three columns you committed to, so **the risk you face is a product of
  your own earlier choices**, and it changes every roll. The [Thoughtful
  Gamer](https://thethoughtfulgamer.com/2022/07/11/cant-stop-review/) notes the design
  "encourages risk taking by making two rolls safe" — a deliberate foot-in-the-door.
- **Incan Gold / Diamant** ([rules](https://www.64ouncegames.com/pages/incan-gold)). 30
  quest cards: 15 treasure and 15 hazard (**3 each of 5 hazard types**). Simultaneous secret
  Torch/Camp choice. Treasure divides among those still in, rounded down, remainder stays on
  the card; leavers split everything left behind. **The second hazard of the same type ends
  the round and everyone still inside loses everything they took.**
  **Why it's interesting:** the risk is *shared and social*. Your bust probability depends on
  how many other players are still in (dividing the treasure) and the accumulated leftovers
  make staying more attractive as fewer remain. It is press-your-luck **against the other
  players' nerve**, not against the deck.
- **The Quacks of Quedlinburg** (Wolfgang Warsch;
  [rules PDF](https://gusandco.net/wp-content/uploads/2018/10/Quacksalber_Rules_English_v1.pdf)).
  The pot explodes when drawn **white chips exceed a total of 7**. On explosion you must
  choose **either** victory points **or** coins, not both. The **rat-tail** catch-up lets
  trailing players start each round further along, one space per rat-tail of deficit. The
  **flask** lets you return the last chip drawn once per round — but "if the last chip drawn
  causes the pot to explode, the flask can no longer be used."
  **Why it's interesting:** you build the bag, so **you author your own risk curve**, and the
  explosion is a *partial* loss, not a total one — exactly the "catch-up / partial reward"
  requirement above.
- **Balatro — the blind skip.** ([wiki: Skip](https://balatrowiki.org/w/Skip),
  [Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes)). Only Small and Big blinds
  can be skipped; Boss blinds cannot. Skipping grants **1 of 24 Tags** but forfeits the
  blind's money (**$3 Small / $4 Big / $5 Boss / $8 Showdown Boss**), the shop visit, the
  interest, and the joker/hand scaling. Score requirements: Small = 1× ante base,
  Big = 1.5×, Boss = 2× (The Wall 4×, Violet Vessel 6×).
  **This is the cautionary example.** The wiki's verdict is that skipping is "generally
  ill-advised" and "especially detrimental on Gold Stake, where economy, interest, and shop
  visits are vital," with only narrow exceptions (Loyalty Card, Perishable jokers).
  **[relayed]** In other words: *a stake decision that resolves into a near-constant answer
  once players understand the economy.* The tension evaporated as the community solved it.
- **Slay the Spire — elites and campfires.** The best framing I found
  ([Spire Builds](https://www.spirebuilds.com/guides/rest-vs-upgrade-guide)) is that
  **health is a currency, not a score**: "It is a resource you spend to gain cards, relics,
  and upgrades," and "an upgrade can be better than a rest if it prevents more damage than
  the rest would heal." The guide explicitly refuses to give HP thresholds — "This table is
  a starting point, not a law" — because the right answer depends on which specific future
  fight can punish you. **[relayed]**
  **Why this decision *stays* interesting where Balatro's skip did not:** the stake is paid
  in a resource (HP) that is convertible into other resources at a rate that changes with
  your deck. There is no stable formula because the exchange rate is itself a function of
  the run.

### 4.3 The transferable rule

> A stake decision is interesting exactly when **its correct answer is a function of
> something the player must model rather than compute**: the opponent's nerve (Incan Gold),
> their error tendencies (Kleinman's opponent-adjusted double points), a bag you built
> yourself (Quacks), or a future you can see but not evaluate (Slay the Spire). It becomes
> tedious the moment the answer is a function only of numbers on the table (Balatro's skip
> on Gold Stake, backgammon's post-Crawford mandatory double).

---

## 5. Failure modes

### 5.1 Degenerate scores — where the decision has no content

Backgammon has several, and they are all *more* prevalent in short matches:

- **Double match point (DMP)**: both players one point away. The cube is irrelevant; nobody
  ever doubles, or the double is meaningless. A pure dead spot.
- **Post-Crawford mandatory double**: the trailer "should nearly always double immediately"
  ([BackgammonHit](https://backgammonhit.com/articles/crawford-rule-backgammon/)). No
  decision at all — just an action you must remember to take.
- **2-away/2-away**: the rule of thumb collapses to "double as soon as you're slightly
  ahead, and don't hesitate if unsure" and "accept any cube… if you believe you can win at
  least 1/3 of the games"
  ([Nextgammon](https://nextgammon.com/en/blog/backgammon-rules-of-thumb-for-decision-making)).
  **[relayed]** That is a memorised formula, not a judgement.
- **Free drop**: mechanical once you know the parity rule.

**In a match to 3 points, a majority of reachable score states are in this degenerate set.**
That is the single most damaging structural fact for a Manzil cube; §6.1 quantifies it.

### 5.2 The leader-erasure problem, and why the Crawford rule exists

Without Crawford, an unrestricted cube in a short match **destroys the meaning of the
score**. At 1-away/2-away the trailer simply doubles; whether the leader takes or drops, the
result is 50/50. See §6.1 for the exact numbers: a 75% position becomes a 50% position.

The Crawford rule is a patch — and note what kind of patch it is. **It removes the cube from
one entire game.** In a 25-point match that costs you 4% of the match. In a best-of-five it
costs you up to a third of the match, and it removes the cube from *the most dramatic board
of the match*.

### 5.3 The perfect-information collapse

This is the fatal objection for a deterministic game, and the chess community has already
worked it out. From a [Chess.com variants
thread](https://www.chess.com/forum/view/chess960-chess-variants/doubling-cube):

> "A BG advantage is much more volatile than a chess one."

and the structural objections listed there: perfect information means a strong player "can
often calculate positions accurately, removing the speculative element"; nobody will ever
take a cube from a much stronger opponent; and a leader can "double every game and play for
a draw, hastening the end and a win." **[relayed]** No actual chess implementations were
found — which is itself evidence.

§6.4 gives the formal version: **in a game both players can solve, the cube is worth exactly
zero against a rational opponent.** It becomes a resignation button.

### 5.4 Adverse selection — the double as a signal

The deeper version of 5.3: a double is *information*. If the doubler is better at evaluating
the position, then "my opponent doubled" is strong evidence that dropping is correct, and a
rational opponent drops every time. The mechanic then transfers exactly the opponent's
mistakes and nothing else — and worse, it *teaches* the opponent to always drop, at which
point it transfers nothing.

The only thing that stops this collapse is the **ability to bluff**. That is precisely why
Marvel Snap's snap works and a chess cube would not: Snap's hands are hidden. §6.4
quantifies the bluffing equilibrium.

### 5.5 Asymmetric stakes

Marvel Snap's rank floors create games where one player can lose cubes and the other
cannot — "inherently unfair"
([snap.fan](https://snap.fan/news/marvel-snap-getting-rid-of-the-infinite-climb/)).
**[relayed]** Any Manzil stake mechanic that interacts with an outer progression
(streaks, dailies, the moon's phase) risks the same asymmetry.

### 5.6 The tedium modes

- **The obligatory action** (post-Crawford double) — a click you must not forget.
- **The solved economy** (Balatro's skip on Gold Stake) — a decision the community resolves
  into a constant.
- **The unbounded escalation** — beavers and raccoons exist in money play and are omitted
  from tournament play for a reason; each extra doubling level multiplies the variance
  without adding a new *kind* of decision.
- **The lookup table** — if the correct take point at each score is a number the player must
  memorise (Woolsey's table is 15×15 = 225 entries), you have added homework, not depth.
  Manzil's version would be small (9 entries) — which is good for learnability and bad for
  depth, because a 9-entry table gets memorised in a week.

### 5.7 What the cube requires of the underlying game — checklist

| Requirement | Backgammon | Marvel Snap | Poker | Manzil (as described) |
|---|---|---|---|---|
| Irreducible shared uncertainty at decision time | dice | hidden hands + hidden future draws | hidden cards | **none** (perfect info, deterministic resolution) |
| Smooth equity gradient through 55–85% | yes (x ≈ 0.68) | partly | yes | **no** — 9 plies, each flipping 0–3 cards |
| Enough game left after a take | ~30+ rolls | 3–4 turns | streets | **~4 placements** |
| Bluffing possible | no (but not needed — dice supply the doubt) | yes | yes | only if hands are hidden |
| Match long enough that the cube doesn't dominate | 11–25 pts | ladder of hundreds of games | thousands of hands | **3 points** |

---

## 6. Original analysis: what a cube would actually do to a best-of-five

*All of this section is my own arithmetic under stated assumptions. It is not sourced. The
match-equity numbers are exact fractions and each is checkable by hand; I also reproduced
them with an independent numerical Brownian-model solver.*

**Assumptions**: first to 3 board-wins ("best of five"); equal players; each board 50/50
cubeless; no gammon-equivalent; cube values 1 / 2 / 4 (4 wins the match outright).

### 6.1 Match equity tables for a best-of-five

**Cubeless** (A's match-winning chance, by points still needed):

| | B needs 1 | B needs 2 | B needs 3 |
|---|---|---|---|
| **A needs 1** | 50.00% | 75.00% | 87.50% |
| **A needs 2** | 25.00% | 50.00% | 68.75% |
| **A needs 3** | 12.50% | 31.25% | 50.00% |

**With an unrestricted cube, no Crawford rule:**

| | B needs 1 | B needs 2 | B needs 3 |
|---|---|---|---|
| **A needs 1** | 50.00% | **50.00%** | 75.00% |
| **A needs 2** | **50.00%** | 50.00% | 62.50% |
| **A needs 3** | 25.00% | 37.50% | 50.00% |

The 1-away/2-away cell is hand-checkable and devastating. A needs 1, B needs 2. B doubles
immediately. If A takes, the game is decisive for both (A wins → match; B wins 2 → match) →
50%. If A drops, B gets 1 point → 1-away/1-away → 50%. **A leading 2–1 in a best-of-five is
worth 75% without a cube and exactly 50% with one.** The cube deletes the lead.

**With a Crawford rule** (the board immediately after anyone reaches 1-away is played
without the cube), pre-Crawford scores:

| | B needs 1 | B needs 2 | B needs 3 |
|---|---|---|---|
| **A needs 1** | 50.00% | 75.00% | **75.00%** |
| **A needs 2** | 25.00% | 50.00% | **62.50%** |
| **A needs 3** | 25.00% | 37.50% | 50.00% |

**Cost of the cube to the leader, even with Crawford:**

| Score | Cubeless | Cubeful+Crawford | Change |
|---|---|---|---|
| 1-away / 3-away (leading 2–0) | 87.50% | 75.00% | **−12.50 pts** |
| 2-away / 3-away (leading 1–0) | 68.75% | 62.50% | **−6.25 pts** |
| 1-away / 2-away (leading 2–1) | 75.00% | 75.00% | 0.00 |

Without Crawford the 1-away/2-away cell loses **25 points**. So: *Crawford is not optional;
it is load-bearing.* And it still costs the 2–0 leader 12.5 points of match equity — the
cube meaningfully devalues getting ahead.

### 6.2 A single cube error is worth ~5–25% of the whole match

At 1–1 in a best-of-five (2-away/2-away, pre-Crawford), if A doubles from 1 to 2, the
doubled board decides the match, so **B's equity from taking = B's chance of winning that
board (p)**, and **B's equity from dropping = 25%** (the score becomes 1-away/2-away with
Crawford in force). B's take point is therefore **25%**.

| B's board equity p | Take | Drop | Cost of the wrong choice |
|---|---|---|---|
| 20% | 20.0% | 25.0% | 5.0 pts |
| 30% | 30.0% | 25.0% | 5.0 pts |
| 40% | 40.0% | 25.0% | **15.0 pts** |
| 50% | 50.0% | 25.0% | **25.0 pts** |
| 60% | 60.0% | 25.0% | **35.0 pts** |

Compare with the cost of ordinary play errors at the same score. One board at 2-away/2-away
is worth `75% − 25% = 50` match-equity points. A board misplay that costs 10% of *board*
equity therefore costs **5 match points**. A single wrong drop at 50% board equity costs
**25**.

**That is the skill-amplification claim, quantified: at the most common score in a
best-of-five, one take/drop decision is worth five ordinary blunders.** This is the
strongest argument *for* a Manzil cube — and it is real, provided the take/drop decision is
genuinely hard (which §6.4 says it will not be).

### 6.3 The cube shortens the match, and that helps the weaker player

If every board gets doubled and taken (the common case at short match scores, where taking
is usually right), a best-of-five effectively becomes a **best-of-three**. Match-winning
chance for a player with a per-board edge *q*:

| per-board win % | best of 5 | best of 3 | change for the favourite |
|---|---|---|---|
| 52% | 53.75% | 53.00% | −0.75 pts |
| 55% | 59.31% | 57.48% | **−1.84 pts** |
| 60% | 68.26% | 64.80% | **−3.46 pts** |
| 65% | 76.48% | 71.83% | **−4.66 pts** |
| 70% | 83.69% | 78.40% | **−5.29 pts** |

*(An independent Brownian-model solver, with both players using optimal live-cube
thresholds, reproduces these to within 0.02 points — e.g. 57.47% vs 57.48% at q = 55%.)*

**So the cube's two effects point in opposite directions and are the same order of
magnitude in a best-of-five:** it adds up to ~25 points of equity swing on individual
cube decisions (§6.2), and it subtracts ~2–5 points from the better *player's* match win
rate by shortening the match (§6.3). The cube is a net gain for skill only if cube skill
differences are larger than board-play skill differences. In backgammon they are (a third of
error on a handful of decisions, per Robertie). In *Manzil* they would not be — see next.

### 6.4 The perfect-information collapse, formally

Model the board as decided at the deal: outcome R ∈ {A wins, B wins}, 50/50. Stake 1;
A may double once to 2; B takes or drops.

**Case 1 — both players can solve the board.** A doubles only when A knows they win. B
infers this with certainty and always drops. A gains +1 on every board A wins and loses −1
on every board A loses. **Expected value of the cube: exactly 0.** The Moonstone is a
resignation button with a dramatic name.

More generally, if B takes with (error) frequency *t*, A's gain from the cube is
`q·t/2` per board where *q* is the probability A can solve the board. **The cube is worth
precisely the opponent's mistakes, and a rational opponent's best response drives it to
zero.**

**Case 2 — A knows the outcome, B does not, and A may bluff.** Now it is the poker
clairvoyance game and it has a proper mixed equilibrium:

- A doubles with **all** winning boards and bluffs with **1/3** of losing boards.
- Then P(A actually winning | A doubled) = **3/4**, which makes B exactly indifferent
  between taking (EV −1) and dropping (EV −1).
- B takes **2/3** of doubles, which makes A exactly indifferent between bluffing and not.
- A's EV: **+5/3 points on a winning board**, −1 on a losing board → **+1/3 point per
  board**, versus 0 with no cube.

**That is the whole design question in one line: the cube is worth 0 if the board is
solvable by both, and worth 1/3 of a board per board if it is solvable by one and bluffable.
Neither of those is a good game.** What you actually want is the backgammon case — nobody
can solve it, and the cube pays for *estimating* better.

### 6.5 Is a Manzil board solvable?

Rough branching-factor count for a 9-slot board where one player places 5 cards and the
other 4, all cards visible:

```
45 × 40 × 28 × 24 × 15 × 12 × 6 × 4 × 1 ≈ 5.2 × 10^9 leaf paths
```

With alpha-beta and transposition tables this is **seconds of computer time** and therefore
fully solved by any companion app or bot. A strong human sees perhaps 3–4 plies. So a
perfect-information Manzil board sits in the worst possible spot: **unsolvable by humans,
trivially solvable by machines.** A cube in that game is a calculation-depth tax that a
solver trivialises — and if the sky's five planet cards are derivable from a public
ephemeris, the "hidden hand" that would save the mechanic isn't hidden at all.

---

## 7. Implications for Manzil

**Verdict, stated plainly: a backgammon-style doubling cube does not work in a best-of-five
of a near-deterministic, perfect-information board game. Not "works less well" — it
structurally does not function.** It fails on three independent grounds, any one of which
would be sufficient: no shared uncertainty (§6.4: EV exactly 0 against a rational opponent),
too short a match (§6.1: the cube deletes the meaning of the score, and the Crawford patch
costs a third of the match), and negative interaction with the fixed match length (§6.3:
shortening the match helps the weaker player by 2–5 points).

That said, **a stake mechanic can work in Manzil** — just not this one. Here is what to do
instead, and what would have to be true first.

1. **Decide first whether the Moonstone is a two-player mechanic or a solitaire one, because
   they are different designs.** Against a human, a Moonstone is a doubling cube and needs
   everything in §5.7. Against "the sky" — an algorithm playing a publicly-derivable
   ephemeris hand — it is not a cube at all, because the sky cannot take, drop, bluff, or
   err. Against the sky, the correct reference class is **Balatro's skip, Quacks' bag, Incan
   Gold's torch**: a solitaire press-your-luck. Build that one first; it is the one that
   works today.

2. **The cube's value is exactly your opponent's error rate, so give the opponent something
   they can be wrong about.** §6.4 is unambiguous: `EV = q·t/2`. If the sky's five planets
   are public knowledge from tonight's ephemeris, `t = 0` for any competent player and the
   Moonstone is decoration. **Hide the sky's hand** — deal the sky's five planets face-down
   and reveal them as played — and you convert Manzil from a solved-lookahead game into a
   game of genuine estimation. *This single change is the precondition for every other
   recommendation below.* Even better: keep the ephemeris as the *deck* (this month's sky
   determines which planets are in play) but randomise the *order and timing*, so the flavour
   survives and the information asymmetry is real.

3. **If you want the cube to be bluffable, hide the player's hand too — and accept that you
   are building a poker game.** §6.4 Case 2 gives a clean equilibrium: bluff 1/3, call 2/3,
   and the informed side earns +1/3 board per board. That is a real, deep mechanic (it is
   Marvel Snap's), but it changes Manzil's genre. Second Dinner explicitly cited poker, not
   backgammon, as the *reason* the snap has depth ("betting and bluffing in poker adds a lot
   of depth to a rather simple game"), even though the *mechanic* came from backgammon. Be
   deliberate about which one you are copying.

4. **If a cube ships, cap it at one double per board, and put the decision early.** With
   exactly one double available the closed form gives a cash point of **75%** and a take
   point of **25%** (Ju et al., `d_1 = 4/5 + (1/5)(−1/4) = 0.75`) — clean, teachable, and it
   coincides with the classical 25% rule. Force the offer before the third placement, while
   equity is still genuinely uncertain, exactly as Tichu forces Grand Tichu after 8 of 14
   cards ([Tichu](https://en.wikipedia.org/wiki/Tichu): Grand Tichu ±200 on 8 cards, Tichu
   ±100 on 14). **A declaration made on partial information is a real decision in a
   deterministic game; a double made on complete information is not.**

5. **You will need a Crawford-equivalent, and in a best-of-five it is expensive.** §6.1: at
   2–1 up, an unrestricted cube turns a 75% position into a 50% position — the score stops
   meaning anything. Crawford fixes that cell exactly, but it costs the 2–0 leader
   12.5 points of match equity and it removes the stake mechanic from one of only five
   boards. **If you cannot stomach a rule that switches your headline mechanic off for the
   climactic board, you cannot have an unrestricted cube.** A single-use, once-per-match
   Moonstone (rather than once-per-board) sidesteps this entirely and is the cheaper design.

6. **Lengthen the match or accept that the cube helps the underdog.** §6.3: with every board
   doubled, a best-of-five *is* a best-of-three, costing a 60%-per-board player 3.5 points
   of match win rate. Backgammon plays 11, 15 or 25 points for exactly this reason. If
   Manzil's identity requires a short match (and "five boards, five planets, one night"
   sounds like it does), then **do not add a mechanic whose main structural effect is to
   make the match shorter.** A stake that changes *how much a board is worth* without
   changing *how many boards remain* — a side-pot, a scoring multiplier that doesn't
   accelerate the match — avoids this entirely.

7. **The strongest argument for a stake mechanic is §6.2, and it survives the verdict.** At
   1–1 in a best-of-five, one take/drop decision is worth up to **25 points of match
   equity** — five times what a 10%-of-a-board misplay costs. Concentrating consequence into
   a few legible moments is genuinely good design and is why the mechanic is worth pursuing.
   The catch is that this only pays if the decision is *hard*. Build the uncertainty first
   (point 2), then the leverage is free.

8. **Design against the tedium modes explicitly, because a 3-point match generates them
   fast.** With only nine reachable score states, players will memorise the correct take
   point at each one within a week — you will have built a 9-entry lookup table, not a
   judgement. Backgammon's degenerate spots (DMP, post-Crawford mandatory doubles, the free
   drop) are a small fraction of a 25-point match and a *majority* of a 3-point one. Either
   make the take point depend on something unmemorisable (opponent read, hidden information,
   a variable board-worth) or accept that the decision is flavour.

9. **Take Ben Brode's actual reason seriously: the snap exists to make losing feel like a
   choice.** "It made losing feel like victory. It's a strategic retreat where you don't
   fall victim to your opponent's gambit," and renaming retreat to *Escaped* "zeroes out the
   emotional negativity." Second Dinner prototyped **nine variants** before shipping the
   simplest. For Manzil the equivalent framing is ready-made and thematically perfect:
   **reading the sky and declining the omen is not losing, it is prudence.** If the Moonstone
   ships mainly as a dignity valve rather than as a depth mechanic, that is a legitimate and
   well-precedented design goal — and it is achievable even in the near-deterministic version,
   where the pure-depth version is not.

10. **Recommended build order.** (a) Ship the solitaire version first — a Moonstone you stake
    *against the sky* before a board begins, with a payout that scales and a decline that is
    framed as prudence. Balatro/Quacks/Incan Gold are the reference class; it needs no
    information asymmetry to work, only a payoff curve the player can feel but not compute
    ("calibrated opacity"). (b) In parallel, prototype the hidden-sky variant (point 2) and
    measure whether skilled players' pre-board win-probability estimates actually diverge
    from the truth. If they do — if there is real estimation error to reward — then and only
    then (c) add a capped, early, once-per-match human-vs-human cube per points 4–6.
    **If the estimation error turns out to be near zero, you have your answer: Manzil's
    stake mechanic is press-your-luck, not a doubling cube, and no amount of tuning will
    change that.**

---

## Sources

**Backgammon — history and rules**
[New England Backgammon Club, Early Doublers & Cube Evolution](https://nebackgammon.org/index.php/early-doublers/) ·
[Wikipedia: Backgammon](https://en.wikipedia.org/wiki/Backgammon) ·
[Wikipedia: Backgammon match strategy](https://en.wikipedia.org/wiki/Backgammon_match_strategy) ·
[Oswald Jacoby, The History of Backgammon](https://bkgm.com/books/JacobyCrawford/HistoryOfBG/) ·
[Wikipedia: John R. Crawford](https://en.wikipedia.org/wiki/John_R._Crawford) ·
[BackgammonHit: the Crawford Rule](https://backgammonhit.com/articles/crawford-rule-backgammon/) ·
[Backgammon-mfg: the Jacoby Rule](https://www.backgammon-mfg.com/News/what-is-the-jacoby-rule-in-backgammon.html)

**Backgammon — mathematics**
[Peter Bell, The Doubling Cube](https://bkgm.com/articles/Bell/TheDoublingCube/) ·
[Keeler & Spencer, Optimal Doubling in Backgammon (1975)](https://bkgm.com/articles/KeelerSpencer/OptimalDoublingInBackgammon/) ([journal](https://pubsonline.informs.org/doi/10.1287/opre.23.6.1063)) ·
[Zadeh & Kobliska, On Optimal Doubling in Backgammon (1977)](https://www.bkgm.com/articles/ZadehKobliska/OnOptimalDoublingInBackgammon/index.html) ·
[Ju, Leifer, Miller et al., Optimal Doubling Thresholds in Backgammon-like Stochastic Games (2024)](https://web.williams.edu/Mathematics/sjmiller/public_html/math/papers/Backgammon_ArtCurtis_OptimalDoublingThresholds10Oct2024.pdf) ·
[Higgins, Cube Handling Under a Jump Model (2012)](https://arxiv.org/abs/1203.5692) ·
[GNU Backgammon: cubeful equity formula](https://www.gnu.org/software/gnubg/manual/html_node/Basic-formula-for-cubeful-equities.html) ·
[GNU Backgammon: cube efficiency](https://www.gnu.org/software/gnubg/manual/html_node/The-cube-efficiency.html) ·
[GNU Backgammon: overall rating](https://www.gnu.org/software/gnubg/manual/html_node/Overall-rating.html) ·
[Kit Woolsey's Match Equity Table](https://bkgm.com/articles/Woolsey/TheMatchEquityTable/) ·
[Douglas Zare, Woolsey's Rule in Match Play](https://bkgm.com/articles/Zare/WoolseysRuleInMatchPlay/index.html) ·
[Douglas Zare, A Measure of Luck](https://www.bkgm.com/articles/Zare/AMeasureOfLuck.html) ·
[Danny Kleinman, Care and Feeding of the Doubling Cube I](https://bkgm.com/articles/Kleinman/CareAndFeedingPart1/index.html) ·
[bkgm, Match Play Doubling Strategy](https://bkgm.com/articles/mpd.html) ·
[Michael Simborg, Luck vs. Skill in Backgammon](https://bkgm.com/articles/Simborg/LuckVsSkill/index.html) ·
[Robertie on Snowie cube error rates (2+2)](https://forumserver.twoplustwo.com/138/backgammon-forum-hosted-bill-robertie/snowie-cube-error-rates-754563/) ·
[Error rate vs. win probability (rec.games.backgammon)](https://groups.google.com/g/rec.games.backgammon/c/G3H_NpSVgZo/m/1AKah9pLCAAJ) ·
[Nextgammon, Rules of Thumb](https://nextgammon.com/en/blog/backgammon-rules-of-thumb-for-decision-making) ·
[backgammon.com, The Doubling Cube](https://backgammon.com/learn/doubling-cube) *(contains at least one claim contradicting Robertie)* ·
[gamesprecipice, The Doubling Cube](https://www.gamesprecipice.com/doublingcube/)

**Marvel Snap**
[GDC Vault: Designing MARVEL SNAP (Ben Brode, GDC 2023)](https://gdcvault.com/play/1029024/Designing-MARVEL-SNAP) ·
[Apple Developer, Behind the Design: MARVEL SNAP](https://developer.apple.com/news/?id=sosm2p7q) ·
[mobilegamer.biz on the GDC talk](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/) ·
[Steve Lilley's GDC talk notes](https://stevelilley.com/2026/03/17/gdc-talks-gdc-2023-designing-marvel-snap/) ·
[Pocket Tactics on the GDC talk](https://www.pockettactics.com/marvel-snap/ben-brode-gdc) ·
[Untapped.gg: Snapping & Retreating](https://blog.snap.untapped.gg/marvel-snap-wiki-snapping-retreating) ·
[Official help centre: What do cubes do?](https://marvelsnap.helpshift.com/hc/en/3-marvel-snap/faq/95-what-do-cubes-do/) ·
[Mastering Snap: To Snap or Not to Snap](https://masteringsnap.com/to-snap-or-not-to-snap/) ·
[Eric Guan, Marvel Snap's Ancient Inspiration](https://ericguan.substack.com/p/marvel-snaps-ancient-inspiration) ·
[Zvi Mowshowitz, Marvel Snap: Phase 1](https://www.lesswrong.com/posts/hNa4JBgtuhb8tY3je/marvel-snap-phase-1) ·
[Marvel Snap Zone: Cube Rate or Win Rate?](https://marvelsnapzone.com/cube-rate-or-win-rate/) ·
[Marvel Snap Zone: Snapalytics](https://marvelsnapzone.com/snapalytics-more-cubes-on-tuesdays/) ·
[snap.fan: Getting Rid of the Infinite Climb](https://snap.fan/news/marvel-snap-getting-rid-of-the-infinite-climb/) ·
[Marvel Snap Zone: Ultimate Snapping Strategy Guide](https://marvelsnapzone.com/the-ultimate-snapping-strategy-guide-for-marvel-snap/)

**Poker**
[Wikipedia: Pot odds](https://en.wikipedia.org/wiki/Pot_odds) ·
[Noga Alon, Poker, Chance and Skill](https://www.cs.tau.ac.il/~nogaa/PDFS/skill.pdf) ·
[Levitt & Miles, The Role of Skill Versus Luck in Poker (NBER w17023 / JSE 2014)](https://pricetheory.uchicago.edu/levitt/Papers/WSOP2011.pdf) ·
[PokerNewsDaily on the Cigital/PokerStars study (2009)](https://www.pokernewsdaily.com/study-reveals-poker-is-a-game-of-skill-1724/) ·
[PokerNews: Amsterdam court rules poker a skill game (2014)](https://www.pokernews.com/news/2014/01/amsterdam-court-rules-poker-a-skill-game-17340.htm) ·
[PokerNews: Dutch court rules poker a game of chance (2016)](https://www.pokernews.com/news/2016/03/dutch-court-rules-poker-a-game-of-chance-24265.htm)

**Press-your-luck**
[gameideas.net: Push-Your-Luck](https://www.gameideas.net/push-your-luck) ·
[Board Game Design Course: Sometimes You Want to Push Your Luck](https://boardgamedesigncourse.com/game-mechanics-sometimes-you-want-to-push-your-luck/) ·
[Wikipedia: Can't Stop](https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)) ·
[The Thoughtful Gamer: Can't Stop review](https://thethoughtfulgamer.com/2022/07/11/cant-stop-review/) ·
[Incan Gold rules (64 Ounce Games)](https://www.64ouncegames.com/pages/incan-gold) ·
[Quacks of Quedlinburg rules PDF](https://gusandco.net/wp-content/uploads/2018/10/Quacksalber_Rules_English_v1.pdf) ·
[Balatro Wiki: Skip](https://balatrowiki.org/w/Skip) ·
[Balatro Wiki: Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes) ·
[Spire Builds: Rest vs Upgrade](https://www.spirebuilds.com/guides/rest-vs-upgrade-guide) ·
[Wikipedia: Tichu](https://en.wikipedia.org/wiki/Tichu)

**Doubling in deterministic games**
[Chess.com variants forum: Doubling Cube](https://www.chess.com/forum/view/chess960-chess-variants/doubling-cube)
