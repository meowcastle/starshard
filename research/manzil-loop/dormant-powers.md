# Dormant Powers

**Unlocking ability through acts of play — dormant abilities, mastery-gated mechanics, and the risks**

Research note for *Manzil*. Compiled 2026-08-21.

---

## How to read this document

**Verification key** — applied inline throughout:

- **[V]** — Verified against a primary or authoritative source I read directly (designer talk, published paper, official wiki/announcement).
- **[P]** — Paraphrased. The source page was fetched and summarised by an extraction tool; quoted text is as that tool rendered it. Treat quotes as substantively accurate but re-check exact wording before publishing any of them.
- **[A]** — Anecdotal. Forum/community opinion. Evidence of *sentiment*, never of fact. Useful precisely because player sentiment is the thing we are trying to predict.
- **[C]** — My own calculation or inference, not a sourced claim.

**A caveat on the whole corpus.** There is a large, high-quality literature on knowledge-as-progression, and a large, high-quality literature on onboarding. There is almost *no* published design literature on the specific proposal at hand — "a per-instance unlock keyed to a real-world calendar state." What exists is adjacent: achievement-design guidelines, dark-pattern taxonomies, and the recorded behaviour of players facing calendar-locked content. Section 5 is therefore the most inferential part of this report and is flagged as such. It is also the part where the evidence points most decisively in one direction.

---

## 1. Mechanics unlocked by doing a thing, not by filling a bar

### 1.1 The canonical case: Outer Wilds, where knowledge is the *only* progression

Alex Beachum's GDC 2021 talk is the primary designer source, and it is unusually blunt about what the team refused to do. **[V/P]** The slides list the game's reward set as, simply, **"Knowledge"** — explicitly contrasted against "experience points, abilities, items, upgrades, customization, unlocked areas, NPC relationships, scores, and collectibles." The design rule was **"a maximally nonlinear gameplay experience… no gating; nothing is off-limits."** ([Beachum, GDC 2021 slides](https://media.gdcvault.com/GDC+2021/beachum_gdc_2021(1).pdf))

Three details from that talk matter enormously for Manzil:

1. **They refused to make the player care on a schedule.** "Average time from game start to players investigating Nomai text ranges from 30 minutes to 2-3 hours. We don't force players to care." **[P]**
2. **The knowledge log records only what the player is certain to know.** "Entries are only what we're 100% certain the player knows from reading that piece of found text. NO leaps of logic, no inferences." **[P]** The game tracks knowledge scrupulously *so it can be permissive*, not so it can gate.
3. **They accepted alienating people.** The approach "would alienate certain player types… And that's okay!" **[P]**

The crucial structural point: Outer Wilds is the canonical knowledge-progression game and it contains **zero mechanical gates**. Knowledge is progression *because nothing else is withheld*. The proposal on the table for Manzil inverts this — it uses an act of play as a *lock*. That is a different design, and it does not inherit Outer Wilds' evidence.

### 1.2 What knowledge-gating buys you

From the best survey of the form ([Joseph Mansfield, "Metroidbrainia," Thinky Games](https://thinkygames.com/features/metroidbrainia-an-in-depth-exploration-of-knowledge-gated-games/)) **[P]**:

- **Order-independence.** "Knowledge gates don't require in-game state changes, so each player's journey is truly their own."
- **Recontextualisation.** Systemic knowledge lets a game "completely recontextualize earlier parts."
- **Teaching without tutorials.** Solving one puzzle "could give you the knowledge needed to explore somewhere else entirely."
- **Structural freedom.** Because the gate lives in the player's head, the game can randomise its own structure.

Mansfield distinguishes **systemic knowledge** (rules that generalise) from **non-systemic knowledge** (arbitrary codes and facts). This distinction is the single most transferable idea in the whole survey. Manzil's proposed unlock is *non-systemic*: "I have claimed mansion 14 in the right conditions" is a fact about my save file, not a rule about the world. Non-systemic knowledge does not recontextualise anything and does not generalise to the next card.

A useful counter-taxonomy ([azhdarchid, "Against 'Metroidbrania'"](https://azhdarchid.com/against-metroidbrania-a-landscape-of-knowledge-games/)) **[P]** argues the label has expanded until it is "all but *useless*," and separates true knowledge-gating from **deduction games** where progression depends on *proving* correctness. Manzil's proposal is neither: it is a state-flag unlock wearing knowledge-game clothes.

### 1.3 Where knowledge-gating fails — four documented failure modes

**(a) Brute force defeats the gate.** Fez's Black Monolith puzzle had no discoverable logic. The community organised, and after **18 hours and 66,227 attempts** the answer fell out of exhaustive search. ([Kotaku](https://kotaku.com/a-look-back-at-fezs-unsolvable-black-monolith-puzzle-1794358854)) **[P]** The verdict: "The fact that no one had been able to discern the hidden logic behind how to solve the puzzle without brute forcing it made the entire affair feel incomplete."

Obra Dinn's famous "rule of three" — the game only confirms identifications in batches of three, specifically to defeat one-at-a-time guessing — is the sophisticated answer to this problem, and even it leaks. ([Film Stories](https://filmstories.co.uk/features/exploring-return-of-the-obra-dinns-rule-of-three/)) **[P]** Players learned to use partial confirmations as an oracle: "you've solved the puzzle using your brain, yes, but that wasn't an actual deduction, you simply figured out how to manipulate the game design."

**(b) No failure feedback becomes "check online."** Tunic's Holy Cross input puzzles give no signal distinguishing *wrong answer* from *fumbled input*. Player summary **[A]**: "For long sequences, trial and error is not an option. It's like trying to fix a program without debugging measures, not even print log." And the consequence: "Do I try to input it six times to cover all ambiguities? Yeah nope… So better just check online." ([Steam discussion](https://steamcommunity.com/app/553420/discussions/0/3194747223959594715/))

**(c) Replay collapses.** "These games are really difficult to replay, because, well, you already know the secrets." ([Nintendo Life](https://www.nintendolife.com/features/what-the-heck-is-a-metroidbrainia-introducing-the-newest-genre-on-the-block)) **[P]** For a *daily* game like Manzil this is the sharpest warning in the section: a one-time unlock has a one-time payload, and after night 30 the mechanic contributes nothing.

**(d) Players finish without noticing.** Mansfield flags games where players "guess, stumble, or even brute-force their way through," and the resulting "Huh, this is a really short game!" reaction. **[P]**

### 1.4 Two systems that get "unlock by doing" right — and what they actually unlock

**Monster Hunter World's Ecological Research** is the closest real precedent to Manzil's proposal, and the detail that matters is *what it gives you*. Research level rises by finding a monster's tracks and clues. What it unlocks is: Level 1 "guidance to next track," Level 2 "guidance to monster's location," Level 3 "destination and status shown on map." ([GameWith](https://gamewith.net/monsterhunterworld-iceborne/article/show/10649)) **[P]**

**The unlock is purely informational. It confers no combat advantage.** The hunter who has never seen a monster fights it with exactly the same weapon and exactly the same numbers; what she lacks is *legibility*. That distinction — gate the map, never gate the sword — is, in my judgement, the most directly applicable finding in this entire report. **[C]**

The wider commentary agrees that MH's real progression is player knowledge, not character power: "You get better at Monster Hunter World as a player… you've mastered your weapon." ([Atomic Bob-Omb](https://atomicbobomb.home.blog/2020/02/15/monster-hunter-world-player-knowledge/)) **[P]** The same essay names the cost: new players face a steep curve because "the game isn't great about explaining."

**Hollow Knight's charm notches** are a hybrid worth studying because they are gated on a *counter you cannot lose*. Salubra sells four notches, each gated on how many charms you own: **5 charms / 120 Geo, 10 / 500, 18 / 900, 25 / 1400.** ([Hollow Knight Wiki](https://hollowknight.wiki/w/Salubra)) **[V]** Others are found by exploration. Note the shape: the requirement is *possession*, not *performance*. You cannot fail to own a charm you already own. Nothing is timed. Nothing is missable. Nothing depends on a die roll. The gate is legible, monotonic, and always closing.

### 1.5 Section verdict

Knowledge-as-progression buys order-independence, recontextualisation, teaching-without-tutorials, and a real feeling of personal mastery. It buys those things when the knowledge is **systemic** (a rule you can apply again) and when the game is otherwise **ungated**. It fails when the knowledge is **arbitrary**, when **failure gives no feedback**, when **brute force is cheaper than thought**, and — for a daily game — when the **payload is one-time**.

---

## 2. "The ability wakes when you use the card correctly once"

This specific pattern — power that switches on in response to an act — has a long and mostly cautionary history.

### 2.1 Use-based growth and its exploit problem

**Final Fantasy II (1988)** is the origin story. Stats grew only through use: cast spells to raise magic, land hits to raise weapon skill. Two things happened. **[P]** ([Goomba Stomp](https://goombastomp.com/not-final-fantasy-ffiis-intriguing-flawed-progression-system/))

- **Command-cancellation:** the game could not distinguish a cancelled action from a completed one, so toggling confirm/cancel yielded "the equivalent experience of, say, thirty physical attacks in a relatively short space of time."
- **Friendly fire:** players attacked their own party to inflate HP and defence.

The structural cause is worth naming precisely: developing four characters "quarter[ed] the amount of growth an individual party member can achieve per battle," so the honest path was intolerably slow and the dishonest path was trivially fast. **[P]**

**Oblivion (2006)** shows the same failure in a subtler, more instructive form. Because level-ups were triggered by *major* skills and attribute bonuses came from *minor* skills, optimal play required playing against your own character concept. PC Gamer's retrospective **[P]**: "If you played to the fantasy of your class, by sneaking around picking locks and shooting people if you were a thief for instance, you'd trigger a level-up too fast." The optimisation trap: "your thief would be better off spending half their time glomping around in heavy armor hitting people with hammers and casting spells." ([PC Gamer](https://www.pcgamer.com/games/rpg/praise-the-nine-oblivion-remastered-doesnt-make-you-grind-your-minor-skills-to-level-efficiently-and-increasing-endurance-boosts-your-hit-points-retroactively/)) The 2025 remaster deleted the whole structure: all skills contribute, everyone gets 12 points per level.

**The transferable law: whatever you make the trigger, players will optimise directly toward the trigger and away from the game.** If Manzil's ability wakes on "claim this mansion," some players will build lines whose only purpose is to claim that mansion — playing worse Manzil in order to own more Manzil. **[C]**

### 2.2 The purest form of the proposal: Blue Magic

Final Fantasy V's Blue Mage learns a spell by *being hit by it* — the exact structure of "the ability wakes when you use the card correctly once." ([RPG Site](https://www.rpgsite.net/feature/11955-final-fantasy-v-blue-magic-how-to-learn-every-spell-for-the-blue-mage)) **[P]**

What actually happened to that design:

- **It produced guide-dependence as a structural necessity**, not as a player failing. Some enemies "never actually use their Blue Magic skills naturally — you can only trigger them yourself via a Beastmaster." Certain spells additionally require the character to be at a specific level. **[P]**
- **It produced missable content.** One-time bosses and non-revisitable dungeons mean some learning opportunities do not come back. **[P]**

Blue Magic is beloved *as flavour* and notorious *as a completion structure*. The flavour survives without the missability; the missability adds nothing but anxiety. **[C]**

### 2.3 Learn-by-risking: NetHack's use-identification

NetHack's use-ID is the version of this pattern that works, and it works because the act carries real, immediate, *in-fiction* stakes. Drinking the unknown potion identifies it and may also polymorph you. The wiki's own advice — "Always remember to take the utmost care when use-identifying things. Check its beatitude using a pet or altar. Check potions using a unihorn" — describes a whole culture of hedged experimentation. ([NetHack Wiki](https://nethack.fandom.com/wiki/Identification)) **[P]**

The lesson: **use-ID is interesting when using the thing is a gamble, and tedious when it is a formality.** A Manzil unlock that requires you to claim a mansion is a formality dressed as a gamble — you were going to try to claim it anyway. **[C]**

### 2.4 Triple Triad's card levels are not what the brief assumes

Worth correcting, since Manzil's L1–L4 shares vocabulary. In FF8, a Triple Triad card's "level" is a **fixed rarity tier, not earned progression**: Levels 1–5 monsters, 6–7 bosses, 8–9 Guardian Forces, 10 characters, with level determining stat range (L1 cards have "ranks up to 6 and total values ranging from 10-13"; L10 "ranks up to A and total values ranging from 26-29"). ([Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII))) **[P]** **Cards do not level up in Triple Triad.** Manzil's L1–L4 is its own invention and inherits no precedent here.

What Triple Triad *does* have is the more interesting and more cautionary mechanic: **rules mutate between regions semi-randomly.** When you carry a rule set into a new region, "a rule from the previous region not used in the new region may spread to the new region; a rule from the new region may be abolished; or, there may be no change." **[P]** This is the famous "rule contamination" problem — a system where the player's own play silently changes the rules of future play, in a direction she did not choose and cannot easily reverse. Players built elaborate folk protocols to avoid contaminating regions. **[C]** If Manzil ever makes an unlock *change* how a card behaves in ways the player did not opt into, this is the failure mode to fear.

### 2.5 Slay the Spire's unlocks, and the backlash

**How it works.** Runs award points; "hitting a point milestone unlocks the next batch of items," and unlocks are character-specific. ([Indie Game Culture](https://indiegameculture.com/slay-the-spire-getting-started/)) **[P]**

**The backlash comes in two flavours, and only one of them is about learning.**

*Flavour one — pool dilution.* "As I unlock things it just makes my games more inconsistant due to a larger pool, so instead of it being a reward it ends up just being a crutch that just lowers my odds and cripples strats." **[A]** ([Steam](https://steamcommunity.com/app/646570/discussions/0/1699415798768673044/)) And: "Great, more hyper specific trash cards that fill the pool while being useless 90% of the time, resulting in dead draws." **[A]** ([Steam](https://steamcommunity.com/app/646570/discussions/0/1692659135923825846/)) *This flavour does not apply to Manzil* — Manzil's 28 cards are fixed, so unlocking cannot dilute anything.

*Flavour two — the learning period is a worse game.* This one applies directly: **"It is super silly that the cards are locked in the first place and makes the first 3-10 (whatever it is) hours of the game worse than they should be."** **[A]** ([Steam](https://steamcommunity.com/app/646570/discussions/0/1742232339929900615/?ctp=2))

The defences are real but weak: "Whenever I play a game that has locked content you can earn… I feel rewarded due to progression," countered by the same thread's complaint that a milestone hit with nothing new attached "is kind of a letdown." **[A]** Note also the recurring confusion in these threads that cards appear in runs *before* their unlock notification fires — a reminder that unlock bookkeeping is itself a legibility problem. **[A]**

### 2.6 Hearthstone: the arc from gating to giving

Hearthstone's Basic set was historically unlocked by levelling each class. The 2021 Core Set announcement is the interesting document because of *what it changed*: **"The Core Set will be free for all players,"** granted automatically — "When you log in after rotation, you'll automatically be granted the new Core Set cards equal to your current level" — with the stated goal of "a modern collection of starting cards to players of all types and mak[ing] Hearthstone even more approachable for newcomers." ([Blizzard](https://hearthstone.blizzard.com/en-us/news/23620129/introducing-the-core-set-and-classic-format)) **[V]**

Blizzard does not frame this as fixing a mistake — they frame it as approachability. **[V]** But the direction of travel is unambiguous, and it is the direction every mature card game has travelled: *the foundational set gets freer and more automatic over time, never less.* **[C]**

### 2.7 Section verdict

Every historical implementation of "power switches on when you do the thing" has generated one of three artefacts: **an exploit** (FF2), **an anti-fantasy optimisation** (Oblivion), or **a guide dependency plus missable content** (Blue Magic). The one clean case (NetHack) works because the act is a genuine risk, and the one clean *modern* case (Monster Hunter research) works because what unlocks is **information, not power**.

---

## 3. New-player experience risk

### 3.1 The empirical case against elaborate gating for simple games

The strongest study here is Andersen et al., *The Impact of Tutorials on Games of Varying Complexity* (CHI 2012), run across **45,000+ players** in three games with **eight tutorial conditions** manipulating presence, context-sensitivity, freedom, and on-demand help. ([PDF](https://grail.cs.washington.edu/wp-content/uploads/2015/08/andersen2012tio.pdf)) **[V/P]**

Findings:

- **Complex game:** Foldit players with context-sensitive tutorials "played 75% more levels and 29% longer than those with no tutorials."
- **Simpler games:** in Refraction and Hello Worlds, "tutorials had a surprisingly negligible effect on player engagement."
- **The conclusion:** "the usefulness of tutorials depends greatly on game complexity" and tutorials "may not be worth the investment… in games with mechanics that are more easily discovered."
- **The counterintuitive one:** adding an on-demand help button *increased* quitting — "players with on-demand help completed 12% fewer levels than those without" in Refraction.

**Manzil's core rule — bigger facing number claims the neighbour, ties flip too — is at the Refraction end of the complexity spectrum, not the Foldit end.** **[C]** That is an argument that Manzil does not need much scaffolding at all, and it is *also* an argument that Manzil cannot afford to be a stripped-down version of itself for weeks: the base game is simple enough that a version with 28 abilities dormant is not "an easier Manzil," it is "Manzil with the interesting part removed."

### 3.2 The pacing trap, named

Josh Bycer's framing is the most useful vocabulary I found. ([Game Developer](https://www.gamedeveloper.com/design/pacing-problems-in-game-design)) **[P]**

- **Front-loading** (everything at once): "it's very easy for someone to have trouble learning the game when everything is given to them from the start."
- **Slow burn** (drip-feed): "the player gives up out of boredom and not wanting to waste their time."
- **The named failure:** drip-feeding creates a **"real game begins at X"** problem, where significant content is locked behind tedious early stages.

Both extremes lose players; they differ only in whether the player leaves confused or bored. Bycer's own prescription is to let players **control pacing** rather than being marched through it.

### 3.3 What "losing them in hour one" costs, numerically

Mobile benchmark data: **Day-1 retention ~27%** (2025) or ~22% (2026 medians); **Day-7 ~4%**; **Day-30 under 1%** across all mobile games; by genre, Puzzle runs D1 31.85% / D7 12.18% / D30 5.35%. The same source claims "about 60% of players quit games that get too hard too quickly" and that "good onboarding can lift retention by up to 50%." ([Segwise, citing Adjust / Business of Apps / Mistplay](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies)) **[P — vendor marketing content; treat the "60%" and "50%" figures as directional only, the retention medians as more reliable.]**

The arithmetic is unforgiving. **[C]** If ~75% of players are gone by Day 2 and ~96% by Day 8, then any unlock schedule measured in *lunar cycles* is a schedule the overwhelming majority of players will never see the end of. A design whose good version arrives in month six is, for almost everyone who ever installs it, a design that never arrives.

### 3.4 The counter-position, fairly stated

**Restrictions genuinely do breed creativity.** Rosewater lists it under "Rules" in *Ten Things Every Game Needs*: "Restrictions breed creativity" and "Game playing is essentially about overcoming obstacles." ([Wizards](https://magic.wizards.com/en/news/making-magic/ten-things-every-game-needs-part-1-2011-10-24)) **[P]** But read the context — he is talking about the *rules of play*, not about withholding rules from the player. Restriction breeds creativity when it constrains the *space of moves*; it breeds boredom when it constrains the *space of content*.

**Staged complexity is real and defensible.** Rosewater's *New World Order* is the best-documented case. The problem it solved: "Complexity creep was increasing our barrier to entry, making it harder and harder for new players to learn how to play." ([Wizards](https://magic.wizards.com/en/news/making-magic/new-world-order-2011-12-05)) **[P]** His three-way split is directly useful for Manzil:

- **Comprehension complexity** — understanding what a card does.
- **Board complexity** — "Just one card, for example, can change the design tree from a few choices to a double-digit number of choices."
- **Strategic complexity** — "beginners can't see strategic complexity. It requires a certain amount of game knowledge before it's visible."

That last line is the crux. **Manzil's signature abilities are mostly strategic complexity, and strategic complexity is invisible to beginners anyway.** **[C]** A new player who sees "this card cannot be tied" does not experience it as a burden — she experiences it as a fact she will understand later. NWO's actual prescription was never "hide mechanics from new players"; it was "put fewer complicated cards at *common*" — i.e. control *density*, not *availability*.

**Opt-in escalation beats imposed gating.** Slay the Spire's Ascension system is the model. Twenty stacking difficulty modifiers, each unlocked by a win with that character, entirely voluntary. ([stswiki](https://www.stswiki.com/guides/all-ascension-levels)) **[P]** The design argument for it ([Frostilyte](https://frostilyte.ca/2020/04/16/more-games-should-handle-difficulty-like-slay-the-spire/)) **[P]**: each level "only makes Slay the Spire marginally more difficult… there isn't ever a steep increase," so players "are able to slowly improve with each of these discrete changes and bump up the difficulty once you feel you're ready." The author argues ascension levels function as *teaching tools*, forcing engagement with cards previously dismissed.

**Into the Breach** carried FTL's unlockable squads forward, and the designers note something counterintuitive: pre-defined squads *reduce* the randomness a player encounters, "since ships are fairly well defined before the player even starts gathering upgrades." ([Game Developer](https://www.gamedeveloper.com/design/-i-into-the-breach-s-i-designers-explain-how-to-follow-up-from-a-hit-game)) **[P]** Note that the *default* squad is never withheld — unlocks add lateral variety, not baseline power.

### 3.5 Section verdict

The counter-position is strong on **density** and weak on **availability**. Every defensible case of staged complexity — NWO, Ascension, Into the Breach — controls how much complexity arrives *at once*, or makes escalation *opt-in*, or adds *lateral* options. None of them makes the baseline game weaker than its finished form. The proposal as stated does exactly that, in a game simple enough that Andersen's data says it did not need the scaffolding.

---

## 4. Completion anxiety and the risk of a chore list

### 4.1 Fixed distributions make the checklist legible — and that cuts both ways

The LCG model's design virtue is that the set is knowable: no randomised packs, no chase rares, you can buy exactly what exists. The cost is that *you can also see exactly what you do not have*. Arkham Horror LCG's canonical warning ([Way Too Many Games](https://waytoomany.games/2021/01/01/arkham-horror-the-card-game-is-a-fantastic-wallet-killer/)) **[P]**: "*AHLCG* is a dangerous place for completionists to go; though I'm ultimately happy that I did," with a full collection at "just over $1,000."

**Manzil's 28 mansions are a fixed distribution.** The set is small, closed, named, and enumerable. That is exactly the condition under which a collection becomes a checklist. **[C]**

### 4.2 The psychology, with the actual studies

**The endowed-progress effect.** Nunes & Drèze (2006), *Journal of Consumer Research* 32(4), 504–512, "The endowed progress effect: How artificial advancement increases effort." 300 car-wash customers; one group got an 8-stamp card starting at zero, the other a 10-stamp card with 2 already stamped. Identical real effort. Over nine months: **19% completion for the 8-stamp card vs 34% for the pre-stamped 10-stamp card.** ([Coglode summary](https://www.coglode.com/nuggets/endowed-progress-effect)) **[P — figures via Coglode's summary; I did not read the original paper. The 2006 JCR citation is standard and reliable.]** Coglode's own "boundary conditions" section is empty, so treat generalisation with care.

This effect is the single most actionable finding in this section, and it points the opposite way from the proposal. **Manzil should start the player with several mansions already awake.** **[C]**

**The Zeigarnik and Ovsiankina effects.** Zeigarnik (1927) found people remember interrupted tasks better than completed ones — "each task we start produces a form of psychological tension." Ovsiankina (1928) found people feel "a stronger urge to complete interrupted or unfinished assignments" than to start new ones, producing "intrusive thoughts." ([Ness Labs](https://nesslabs.com/unfinished-tasks)) **[P]** The same source's caveat is the important half: "prolonged incompletion can trigger anxiety, rumination, and difficulty disengaging."

An incomplete 28-slot grid is a Zeigarnik engine. That is exactly why it will drive engagement — and exactly why, if the remaining slots are not closable by the player's own effort, it converts into a standing irritant. **[C]**

### 4.3 What a long checklist does to a beautiful thing

Breath of the Wild's 900 Korok seeds is the cautionary tale at scale. The first completionist took **179 hours over 12 daily sessions**; another said the experience was a "grind like no other" and warned people "never to try it." The reward is a golden turd; the finisher's reaction was that the developers were "insulting the people who wanted to complete a tedious task" and that all his effort "was just dropped in the toilet." ([Vice](https://www.vice.com/en/article/finding-all-900-korok-seeds-in-breath-of-the-wild-is-a-journey-into-madness/)) **[P]**

The Koroks are *charming* in ones and twos. They are charming as a surprise in the grass. The moment they became a 900-item list, they became an obligation, and the charm inverted into resentment. **[C]**

Manzil's 28 mansions are the same kind of object: individually poetic, collectively enumerable. The difference between "the Pleiades came out tonight" and "3/28 mansions attuned — 25 remaining" is entirely a matter of presentation, and presentation is a choice the design makes.

### 4.4 A note on what Manzil already has

The **familiarity law** is, structurally, an *anti-checklist*. It produces a progress signal that is qualitative, visible on the object itself, and impossible to render as a percentage. A card at L4 is mostly art; you know what it is because you know it, not because a counter says 4/4. That is a rare and valuable property, and it is worth protecting from any system that would introduce a second, numeric, enumerable progress track running alongside it. **[C]**

---

## 5. Per-instance unlock: reasonable or cruel?

This is the decisive section, so let me do the arithmetic before the argument.

### 5.1 The astronomical baseline

The Moon traverses all 28 mansions in one **sidereal month = 27.3 days**, spending **~0.975 days** in each, at **~12°51′** per mansion. ([Renaissance Astrology](https://www.renaissanceastrology.com/mansionsmoon.html)) **[V/P]**

So: **each mansion is "the mansion of the night" roughly once every 27.3 days.** A player who plays every single night gets exactly one shot per mansion per lunar cycle. That is the ceiling, before any other condition is applied.

### 5.2 The arithmetic **[C — my own calculation throughout §5.2]**

Assumptions, all parametric and all adjustable: a 28-card pool; the player sees ~4–5 cards in a game; some number of games per night; a per-attempt claim success rate *w*. Expected time until **all 28** cards are unlocked (this is a coupon-collector / max-of-geometrics problem, so the *tail* is what hurts, not the mean).

**Variant A — "claim the card on its own mansion-night," any slot:**

| games/night | hand | win rate | mean | median | p90 | p99 |
|---|---|---|---|---|---|---|
| 1 | 5 | 0.60 | 34.7 cycles (**2.6 yr**) | 33 | 50 | 70 |
| 3 | 5 | 0.60 | 12.6 cycles (**0.9 yr**) | 12 | 18 | 26 |
| 3 | 5 | 0.75 | 9.7 cycles (**0.7 yr**) | 10 | 14 | 20 |
| 1 | 4 | 0.50 | 53.0 cycles (**4.0 yr**) | 51 | 76 | 108 |

**Variant B — the proposal as literally written: "mansion 14 on the night mansion 14 is at slot 3" (slot 1-in-9):**

| games/night | hand | win rate | mean | median | p90 |
|---|---|---|---|---|---|
| 1 | 5 | 0.60 | 327.9 cycles (**24.5 years**) | 310 | 467 |
| 3 | 5 | 0.60 | 130.2 cycles (**9.7 years**) | 124 | 186 |

**Variant D — "claim the card once, any night, any slot" (for comparison):**

| games/night | win rate | mean | median | p90 | p99 |
|---|---|---|---|---|---|
| 1 | 0.60 | **34.7 nights** | 33 | 50 | 70 |
| 3 | 0.60 | **12.6 nights** | 12 | 18 | 26 |

**The headline: the literal proposal takes between ten and twenty-five years to complete. The night-only version takes between eight months and four years. Dropping the calendar condition entirely takes between two weeks and ten weeks.**

That is not a tuning problem. A factor of roughly **250×** separates the strict version from the loose one. There is no parameter value that rescues Variant B.

Two further notes. First, the *tail* is the design, not the mean: at 3 games/night in Variant A, the median player finishes in 12 cycles but the p99 player waits 26 — and that unlucky player's last card is a card she has spent two years being told she is not allowed to use properly. Second, this all assumes **daily play with no missed nights**, which §3.3's retention data says essentially nobody does.

### 5.3 What the design literature says about conditions like this

**Achievement design guidelines.** The RetroAchievements standards are the most explicit normative document I found on exactly this class of condition. Named as unwelcome: **[P]** ([RetroAchievements docs](https://docs.retroachievements.org/guidelines/content/unwelcome-concepts.html))

- **"Overly RNG Reliant Without Purpose"** — conditions that "rely entirely on randomness and does not serve a purpose, especially when there are extremely low odds."
- **"Pointless Excessive Grinding"** — "long, repetitive tasks that confer no unique in-game rewards."
- **"Secret Achievements"** — "when the player has no indication of what they're going after."
- **"Requires Complete Perfection Over a Long Session"** — "a long task where the slightest mistake will end in failing the challenge."

The proposal as written trips at least the first and arguably the second.

**Dark-pattern taxonomy.** The temporal dark patterns catalogued from Zagal, Björk & Lewis, *Dark Patterns in the Design of Games* (FDG 2013) include **"Playing by Appointment: Being forced to play according to the game's schedule instead of yours"** and **"Wait To Play: In-game timers that make you arbitrarily wait for something."** ([DarkPattern.games](https://www.darkpattern.games/pattern/1/temporal-dark-patterns.html), crediting Zagal/Björk/Lewis) **[P — definitions via the catalogue site; I was unable to retrieve the full FDG paper, so the attribution is second-hand.]**

An unlock that can only fire on one specific night per lunar month is, definitionally, playing by appointment. It does not become less so because the appointment is set by the Moon rather than by a server.

**FOMO critique.** Josh Bycer's summary judgement on time-gated capability: holding content **"hostage is not how you can build a long-term sustainable game."** He specifically calls out gameplay-affecting scarcity as worse than cosmetic scarcity: "If you're trying to build a team or strategy around a certain style, you are going to need those characters to complete it." ([Game Wisdom](https://game-wisdom.com/critical/fomo)) **[P]**

### 5.4 What players actually do when you gate on a calendar

This is the most direct behavioural evidence available, and it is unambiguous: **they cheat the clock.**

Animal Crossing's "time travel" — manually setting the system clock — exists specifically to bypass seasonal fish and bugs, limited-time events, shop restocks, construction timers, and merchant stock. Nintendo's response is instructive: they impose *consequences* (turnips rot, weeds multiply, bed head, villagers may move, missed events) rather than attempting prevention, and **Nintendo explicitly does not consider it cheating**; producer Hisashi Nogami said only that "playing without traveling would probably be the ideal way." ([Nookipedia](https://nookipedia.com/wiki/Time_travel)) **[P]**

The lesson is not "players are dishonest." The lesson is: **when a game makes content contingent on a calendar, a large fraction of the audience routes around the calendar, and the most player-respecting studio in the industry chose to accommodate that rather than fight it.** **[C]**

A parallel signal, indirect but telling: searching for Stardew Valley's seasonal Community Center bundles returns almost nothing but checklists, trackers, and "efficient completion strategy" guides. **[C]** Calendar-gated collections do not produce contemplation; they produce spreadsheets. Manzil's entire aesthetic thesis is the opposite of a spreadsheet.

### 5.5 The ethics-floor collision

Manzil's stated floor: the 28 road-shards are never skill-gated; no loot boxes, no currency, no stamina, no streaks, no paid repair, **no missable-forever content**.

| Floor clause | Does the strict proposal violate it? |
|---|---|
| Road-shards never skill-gated | **Depends on a design question you must answer.** If a mansion's signature ability is narratively bound to that mansion's road-shard, then gating the ability behind winning a claim *is* skill-gating shard-adjacent content. If abilities are strictly mechanical and shards are strictly narrative, it survives. **This ambiguity should be resolved explicitly, in writing, before any version of this ships.** **[C]** |
| No streaks | **At risk.** A once-per-lunar-cycle window creates de facto streak pressure — miss the night, wait a month. That is functionally a streak with a 28-day period. **[C]** |
| No stamina / no waiting | **Violated in spirit.** "Wait To Play" and "Playing by Appointment" are the same family. **[C]** |
| No missable-forever content | **Violated in practice, if not in principle.** Nothing is *technically* missable — the Moon comes back. But at a p99 of 26–70+ lunar cycles (§5.2), and with D30 retention under 1% (§3.3), the difference between "you'll get it in six years" and "you'll never get it" is not a difference the player can perceive. **[C]** |

### 5.6 Section verdict

**The per-instance unlock as literally proposed — mansion N *and* the right slot *and* the right night — is cruel, and not marginally so.** It takes an order of magnitude longer than a human relationship with a daily game lasts. It converts the Moon from a source of meaning into a source of scheduling. It creates streak pressure the ethics floor forbids. It will be routed around by clock manipulation where possible and by guide-following where not.

**The night-only version is not cruel but is still wrong-shaped**: eight months to four years, a stripped-down game during the entire learning period, and a one-time payload after that.

---

## Implications for Manzil

### 1. Verdict on "no powers until you claim the mansion": reject the raw version.

As literally specified — the ability wakes only when you claim that specific mansion in that specific slot on that specific night — the design requires **9.7 to 24.5 years** of daily play to fully unlock (§5.2, my calculation). Even the charitable night-only reading needs **0.7 to 4 years**. Against Day-30 retention under 1% (§3.3), that means the overwhelming majority of players would experience *only* the dormant version of Manzil and never once see the game you actually designed. The idea is beautiful and the mechanism is a fifty-fold miscalibration. Keep the idea; discard the mechanism.

### 2. The specific error is gating **power** rather than **information**.

Monster Hunter's research levels — the closest working precedent — unlock scoutfly guidance and map legibility and **grant zero combat advantage** (§1.4). The hunter who has never seen a monster fights it with the same sword. Manzil already has an information system with a strong thesis: the familiarity law. The proposal should live there, not in the power layer.

### 3. Better-shaped variant **A — "First Light" (recommended primary).**

**All 28 signature abilities are live from the first night. Nothing is ever dormant.** What the act of claiming unlocks is *commemoration*: the first time you claim a mansion on its own night, that card receives its First Light — its true name is revealed on the face, it gains a permanent visual mark, and its shard's text opens a further stanza. The mechanical power was always there; what you earn is *recognition*. This preserves the entire emotional payload of "I took Al-Thurayya on Al-Thurayya's night," costs the new-player experience nothing, cannot be missed forever (the Moon returns), skill-gates nothing, and is immune to the exploit dynamic in §2.1 because there is no power to optimise toward. It also composes cleanly with the familiarity law rather than competing with it.

### 4. Better-shaped variant **B — "Many Doors" (recommended if you insist on real dormancy).**

Keep dormancy, but make it **over-determined and head-started**:
- Begin every player with **5–7 mansions already awake** — the endowed-progress effect (19% → 34% completion, §4.2) says a visible head start is worth more than the same effort with no head start.
- Waking a card has **several sufficient paths**, not one necessary one: claim it on its own night (instant, the elegant path), *or* claim it any three times on any nights, *or* lose to it three times, *or* reach L2 with it. Redundancy is what converts a gate into a shortcut.
- Because no single path is required, **nothing is missable**, no appointment is imposed, and the calendar becomes a grace note rather than a lock.

Expected completion under the any-night path is **12–35 nights** (§5.2, Variant D) — roughly two to ten weeks, which is a human timescale.

### 5. Consider variant **C — "The Sky Withholds," as an opt-in mode.**

If dormancy is aesthetically load-bearing, ship it the way Slay the Spire ships Ascension (§3.4): a **voluntary** mode that experienced players choose, never the default. Frostilyte's argument applies directly — opt-in escalation teaches, imposed gating gatekeeps. This also gives the mechanic somewhere to live permanently instead of expiring after the unlock phase (§1.3d).

### 6. Do not build a second, numeric progress track.

The familiarity law is an anti-checklist: a qualitative signal carried on the object itself, unreducible to a percentage (§4.4). A "7/28 mansions attuned" counter running beside it would import exactly the LCG completion anxiety of §4.1 and the Korok inversion of §4.3 — where an individually charming thing becomes collectively an obligation. If First Light marks are shown at all, show them **on the cards**, never as a tally, and never with a remainder.

### 7. Whatever the trigger is, expect players to play toward the trigger.

FF2 gave us cancel-command grinding; Oblivion gave us thieves in heavy armour (§2.1). If waking mansion 14 is valuable and the trigger is "claim mansion 14," some fraction of players will construct lines whose purpose is to satisfy the trigger rather than to win the night — playing worse Manzil in order to own more Manzil. Variants A and B both defuse this: A because there is no power at stake, B because the redundant paths mean no single line is uniquely efficient.

### 8. Resolve the road-shard question explicitly, in writing, before implementing anything.

The ethics floor says the 28 road-shards are never skill-gated. If a mansion's signature ability is narratively bound to its shard, then gating the ability behind *winning a claim* is skill-gating shard-adjacent content (§5.5). Either (a) shards and abilities are formally independent and the floor holds, or (b) they are bound and the whole proposal is out of bounds regardless of tuning. This is a one-sentence decision that determines whether the rest of the design is even permissible.

### 9. If any calendar condition survives, add an explicit relief valve — and expect the clock to be attacked anyway.

Animal Crossing's history is the evidence: players time-travel to bypass seasonal gating, and Nintendo chose to *accommodate* rather than prevent it (§5.4). If Manzil ever makes something contingent on tonight's sky, assume a meaningful fraction of players will change their device clock. Design for that honestly — either make the condition irrelevant enough not to be worth cheating, or make an in-fiction alternative available ("the sky remembers"), so that honest players are never worse off than clock-setters.

### 10. Trust the simplicity; the data says you can.

Andersen et al. found tutorials paid off for complex games (Foldit: +75% levels, +29% time) and had "surprisingly negligible" effect on simple ones — and that on-demand help *increased* quitting by 12% in the simplest game (§3.1). Manzil's core rule fits on one line. Rosewater's own framing is that "beginners can't see strategic complexity" anyway (§3.4) — a new player reading "this card cannot be tied" does not experience burden, she experiences a promise. **A version of Manzil with all 28 abilities live is not a harder Manzil; it is simply Manzil. A version with them dormant is Manzil with its poetry removed for the exact period during which the player is deciding whether to keep playing.**

---

## Source index

**Knowledge-as-progression**
- [Alex Beachum, "Sparking Curiosity-Driven Exploration Through Narrative in Outer Wilds," GDC 2021 (slides PDF)](https://media.gdcvault.com/GDC+2021/beachum_gdc_2021(1).pdf)
- [Joseph Mansfield, "Metroidbrainia: An in-depth exploration of knowledge-gated games," Thinky Games](https://thinkygames.com/features/metroidbrainia-an-in-depth-exploration-of-knowledge-gated-games/)
- [azhdarchid, "Against 'Metroidbrania': a Landscape of Knowledge Games"](https://azhdarchid.com/against-metroidbrania-a-landscape-of-knowledge-games/)
- [Nintendo Life, "What The Heck Is A 'MetroidBrainia'?"](https://www.nintendolife.com/features/what-the-heck-is-a-metroidbrainia-introducing-the-newest-genre-on-the-block)
- [Kotaku, "A Look Back At Fez's Unsolvable 'Black Monolith' Puzzle"](https://kotaku.com/a-look-back-at-fezs-unsolvable-black-monolith-puzzle-1794358854)
- [Film Stories, "Exploring Return of the Obra Dinn's rule of three"](https://filmstories.co.uk/features/exploring-return-of-the-obra-dinns-rule-of-three/)
- [Vice, "The Delicate Balancing Act of Making a Video Game Built on Secrets" (Tunic / Andrew Shouldice)](https://www.vice.com/en/article/the-delicate-balancing-act-of-making-a-video-game-built-on-secrets/)
- [Steam, "Fundamental issue with HOLY CROSS mechanic" (Tunic)](https://steamcommunity.com/app/553420/discussions/0/3194747223959594715/)
- [GameWith, "MHW: Iceborne — What is the Ecological Research & How to Raise Research Level"](https://gamewith.net/monsterhunterworld-iceborne/article/show/10649)
- [Atomic Bob-Omb, "Monster Hunter World & Player Knowledge"](https://atomicbobomb.home.blog/2020/02/15/monster-hunter-world-player-knowledge/)
- [Hollow Knight Wiki, "Salubra" (charm notch thresholds)](https://hollowknight.wiki/w/Salubra)

**Use-based unlocks and card-game precedent**
- [Goomba Stomp, "Final Fantasy II's Intriguing but Flawed Progression System"](https://goombastomp.com/not-final-fantasy-ffiis-intriguing-flawed-progression-system/)
- [PC Gamer on Oblivion's efficient-levelling problem and the remaster's fix](https://www.pcgamer.com/games/rpg/praise-the-nine-oblivion-remastered-doesnt-make-you-grind-your-minor-skills-to-level-efficiently-and-increasing-endurance-boosts-your-hit-points-retroactively/)
- [RPG Site, "Final Fantasy V Blue Magic: how to learn every spell"](https://www.rpgsite.net/feature/11955-final-fantasy-v-blue-magic-how-to-learn-every-spell-for-the-blue-mage)
- [NetHack Wiki, "Identification"](https://nethack.fandom.com/wiki/Identification)
- [Final Fantasy Wiki, "Triple Triad (Final Fantasy VIII)" — card levels and rule spreading](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII))
- [Indie Game Culture, "Slay the Spire Getting Started Guide" — unlock milestones](https://indiegameculture.com/slay-the-spire-getting-started/)
- Slay the Spire unlock backlash threads: [Unlocked cards are a negative](https://steamcommunity.com/app/646570/discussions/0/1699415798768673044/) · [Annoyed by unlocks](https://steamcommunity.com/app/646570/discussions/0/1692659135923825846/) · [Question about supposed "Unlocks"](https://steamcommunity.com/app/646570/discussions/0/1742232339929900615/?ctp=2)
- [Blizzard, "Introducing the Core Set and Classic Format" (Hearthstone)](https://hearthstone.blizzard.com/en-us/news/23620129/introducing-the-core-set-and-classic-format)

**New-player experience**
- [Andersen et al., "The Impact of Tutorials on Games of Varying Complexity," CHI 2012 (PDF)](https://grail.cs.washington.edu/wp-content/uploads/2015/08/andersen2012tio.pdf)
- [Josh Bycer, "Pacing Problems in Game Design," Game Developer](https://www.gamedeveloper.com/design/pacing-problems-in-game-design)
- [Mark Rosewater, "New World Order"](https://magic.wizards.com/en/news/making-magic/new-world-order-2011-12-05)
- [Mark Rosewater, "Ten Things Every Game Needs, Part 1"](https://magic.wizards.com/en/news/making-magic/ten-things-every-game-needs-part-1-2011-10-24)
- [Frostilyte, "More games should handle difficulty like Slay the Spire"](https://frostilyte.ca/2020/04/16/more-games-should-handle-difficulty-like-slay-the-spire/)
- [stswiki, "All Ascension Levels"](https://www.stswiki.com/guides/all-ascension-levels)
- [Game Developer, "Into the Breach's designers explain how to follow up from a hit game"](https://www.gamedeveloper.com/design/-i-into-the-breach-s-i-designers-explain-how-to-follow-up-from-a-hit-game)
- [Segwise, mobile game retention benchmarks](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies) *(vendor content — directional only)*

**Completion anxiety**
- [Coglode, "Endowed Progress Effect" — summarising Nunes & Drèze, JCR 32(4), 2006](https://www.coglode.com/nuggets/endowed-progress-effect)
- [Ness Labs, "The psychology of unfinished tasks: the Zeigarnik and Ovsiankina effects"](https://nesslabs.com/unfinished-tasks)
- [Way Too Many Games, "Arkham Horror: The Card Game is a Fantastic Wallet Killer"](https://waytoomany.games/2021/01/01/arkham-horror-the-card-game-is-a-fantastic-wallet-killer/)
- [Vice, "Finding All 900 Korok Seeds in Breath of the Wild Is a Journey Into Madness"](https://www.vice.com/en/article/finding-all-900-korok-seeds-in-breath-of-the-wild-is-a-journey-into-madness/)

**Calendar-locked and rare-state conditions**
- [Renaissance Astrology, "The Mansions of the Moon"](https://www.renaissanceastrology.com/mansionsmoon.html)
- [RetroAchievements, "Unwelcome Concepts"](https://docs.retroachievements.org/guidelines/content/unwelcome-concepts.html)
- [DarkPattern.games, "Temporal Dark Patterns"](https://www.darkpattern.games/pattern/1/temporal-dark-patterns.html) *(catalogue crediting Zagal, Björk & Lewis, FDG 2013)*
- [Zagal, Björk & Lewis, "Dark Patterns in the Design of Games," FDG 2013 — abstract](https://core.ac.uk/outputs/301007767) *(full text not retrieved)*
- [Josh Bycer, "How Video Games Abuse The Fear of Missing Out," Game Wisdom](https://game-wisdom.com/critical/fomo)
- [Nookipedia, "Time travel" (Animal Crossing)](https://nookipedia.com/wiki/Time_travel)
