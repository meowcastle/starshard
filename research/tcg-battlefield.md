# Battlefield research for Manzil's arena redesign

*Compiled 6 Oct 2026. Web sources inline. Claims marked **[unverified]** are my inference or memory, not confirmed against a source in this pass.*

## The diagnosis, restated

Manzil today: a 1x9 road; two players alternate placing a card with a left and right number; the bigger facing number captures a neighbour; ties flip and cascade. 28 mansion cards; the opponent plays five planets positioned by the real ephemeris. Best of five boards.

Observed against MTG Arena: Manzil's option space **narrows** with every placement (9 slots, each use removes one), while Magic's **widens** (one land per turn, more castable each turn). Four linked defects:

1. **Narrowing** — the branching factor is monotone-decreasing; the last three turns are nearly forced.
2. **Unilateral commitment** — the placing player resolves everything; the opponent only watches.
3. **No compounding** — a card acts once, at placement, then is inert. No engines, no "state that grows".
4. **Bounded ceiling** — nine slots cap the swing; a blowout and a squeaker look alike.

Everything below is read through those four lenses.

---

## 1. How the great TCG battlefields widen and build an arc

### Magic: the zone structure and why each zone exists

The [MTG wiki's zone page](https://mtg.wiki/page/Zone) lists seven zones with three properties each (public/hidden, shared/non-shared, ordered/unordered): **library** (hidden, private, ordered), **hand** (hidden, private, unordered), **battlefield** (public, shared, unordered), **graveyard** (public, private, ordered), **stack** (public, shared, ordered), **exile** (public, shared, unordered) and **command**. Reading it functionally:

| Zone | What it does for the game |
|---|---|
| Library | Hidden future; the source of variance and the "deck-out" clock |
| Hand | Hidden present; the source of bluffing and of instants' "gotcha" |
| Battlefield | Persistent public state — the thing that compounds turn to turn |
| Graveyard | Public *past* that cards can reference (recursion, threshold); gives spent cards a second life |
| Stack | The ordered reaction window; the only reason "respond" is a verb in Magic |
| Exile | A graveyard that cards *cannot* reach; exists so removal can be final and so cards can be "parked" (suspend, adventure) |
| Command | Out-of-game permanents (commanders, planes) that are always available |

The crucial design point is not the zones themselves but that a card's *lifecycle passes through several of them* and can loop back (graveyard to hand, exile to battlefield). Manzil has effectively two zones: hand and road. Nothing in Manzil has a past or a future.

**Why mana widens the game.** Mark Rosewater's [Mana Action (2011)](https://magic.wizards.com/en/news/making-magic/mana-action-2011-05-30) gives seven reasons the land system is good design; the three that matter for Manzil are: it *controls flow* (without costs "players would cast most cards immediately"), it *creates dramatic escalation* — optimal duels "start small and build" like stage combat — and it *manages choices*: early turns offer few options, mid-game moderate, late game abundant. That last one is the exact inverse of Manzil's curve. Rosewater's older [Land, My Land (2003)](https://magic.wizards.com/en/articles/archive/making-magic/land-my-land-2003-03-31) covers the same ground from the player-frustration side (mana screw as the price of the arc).

Note Rosewater has also [said](https://tappedout.net/mtg-forum/general/mark-rosewaters-comments-on-the-game-focusing-on-the-battlefield) that most players prefer permanents on the battlefield over stack interaction, so Wizards leans board-centric. Lesson: the board should be where the drama is; the reaction window is seasoning, not the meal.

### Hearthstone: the 7-minion cap

The [Hearthstone wiki](https://hearthstone.wiki.gg/wiki/Board_space) records the rule — "Each player is allowed seven minions" — and its edge cases (full board blocks summons; Mind Control on a full board kills instead of steals; Magnetic momentarily allows an 8th). No official rationale is given. The cap exists to bound UI and to make board-flood a real cost; Dean Ayala has said "it's just a matter of time before we see a permanent slot in addition to the 7 minions… they just need to figure out the UI/UX/Design" ([Q&A #23](https://outof.games/hearthstone/3456-dean-ayalas-hearthstone-community-qa-23-8th-board-slot-2022-expansions-locked-in-hearthstone-manga)). Key contrast with Manzil: Hearthstone's 7 slots are per-player and **recycle** — minions die and free the slot — so the cap is a ceiling on *density*, not on *total actions*. Manzil's 9 slots are a ceiling on total actions.

### Legends of Runeterra: attack token and spell mana

Per the [Mobalytics Hearthstone-to-LoR guide](https://mobalytics.gg/blog/hearthstone-players-guide-legends-of-runeterra/): rounds alternate the **attack token** ("one player is given the attack token at the start of every round, and it alternates"); unspent mana banks as **spell mana** ("store up to 3 excess mana… can only be used to cast spells, not creatures"); spells have three speeds (**burst** resolves instantly, **fast** allows a response, **slow** can be answered); and the **defender chooses blocks**. Two Manzil-relevant ideas: (a) the attack token is a *shared scarce right* that alternates, which makes "whose round is it" a strategic resource rather than mere sequencing; (b) spell mana lets you *bank* unused tempo as reactive capacity — a way to widen without adding slots.

### Marvel Snap: three lanes, locations revealed over time, simultaneous reveal

Rules per [Marvel Snap Zone](https://marvelsnapzone.com/how-to-play-marvel-snap-for-beginners/): only the left location is revealed at start; the middle reveals before turn 2, the right before turn 3; four cards max per location; energy 1→6 over six turns; win **two of three** locations, ties broken by total power; cards reveal after both commit, "with the player who is currently winning having their card(s) revealed first". The [Game Developer](https://www.gamedeveloper.com/game-platforms/designers-don-t-sleep-on-marvel-snap-s-simultaneous-turns) piece argues the simultaneous turn is the core innovation: "the only information each of them has is the cards that were played the previous round", so players predict *what* and *where*. The three locations widen the option space spatially (12 slots, growing information), the energy curve widens it temporally, and the two-of-three win means a lane can be *conceded* — a tactical sacrifice Manzil's single road cannot express. Snap's cube/retreat system ([same source](https://marvelsnapzone.com/how-to-play-marvel-snap-for-beginners/)) is a meta-wager layer; it is the mechanism that makes a lost game *cheap* and a won game *big*, raising the outcome ceiling without touching the board.

### Flesh and Blood: pitch, arsenal, combat chain

From [Star City Games' how-to-play](https://articles.starcitygames.com/flesh-and-blood/how-to-play-flesh-and-blood-2/) and the [comprehensive rules](https://fabtcg.com/documents/531/FaB_Comprehensive_Rules_v2_9_0_access.pdf): every card has a pitch value (1–3 resources); pitched cards go to the bottom of the deck, so the deck *cycles* and pitch-ordering is a skill; the **arsenal** is one face-down card kept between turns (a tiny private "bank"); combat is a **chain** of links where the defender plays defense reactions and the attacker attack reactions. FaB's answer to "cards act once" is that every card is three cards: a resource, an attack, or a block. Its arc comes from the hand refilling to intellect each turn while life drains — a *resource that stays flat while the clock runs*.

### Lorcana: a race instead of a kill

Per [SCG's beginner guide](https://articles.starcitygames.com/lorcana/a-complete-beginners-guide-for-disney-lorcana/) and [Wargamer](https://www.wargamer.com/disney-lorcana/rules-violence): one inkable card per turn goes face-down to the inkwell (a land drop by another name — Lorcana *widens* exactly like Magic), characters enter "wet" and cannot act until next turn, and each ready character chooses **quest** (gain lore) or **challenge** (fight an exerted character). First to 20 lore wins. The design point is that the win condition is a *race on a shared track* and the interaction is *tempo denial* (challenging a quester), not damage to a face. Each exertion advances only one objective, so the quest/challenge dilemma is the whole game.

### Yu-Gi-Oh: zone layout

[Yugipedia](https://yugipedia.com/wiki/Field): 5 Main Monster Zones, 5 Spell/Trap Zones, 1 Field Zone, Deck, Extra Deck, Graveyard, plus **two shared Extra Monster Zones** in the centre that "neither player owns until occupied", and Pendulum Zones that are only Pendulum Zones "while occupied by a Pendulum Monster". Two relevant tricks: *contested shared zones* (a slot both players want) and *context-dependent zones* (a slot whose rules depend on what sits in it). YGO also has no resource curve at all — its option space widens through card advantage and combo chains, which is why it is the most "solitaire" of the big games.

### Gwent: rows and rounds

Per the [standalone guide](https://consolepulse.com/multiplatform/the-witcher/guides/gwent-complete-beginner-guide-standalone-game-hub) and the [Homecoming preview](https://techraptor.net/content/gwent-homecoming-preview): the Witcher 3 game had three rows (melee/ranged/siege); Homecoming cut to two because "rows matter much more now" when fewer and when effects are row-locked. The real engine is **best-of-three rounds with passing**: a round ends when both pass, card advantage (entering a round with more cards) is the central currency, and tactics like *bleeding* (forcing good cards out in round 2) and *dry passing* exist. Homecoming also added a 10-card hand limit with 3 draws per round specifically to kill the degenerate "win R1, dry-pass R2" line. Gwent is the canonical "best-of-boards" game and shows its failure mode: without a cost to passing, the multi-round structure collapses to one round.

### Triple Triad: the 3x3 and the FFXIV rule variants

The FF8 original ([StrategyWiki](https://StrategyWiki.org/wiki/Final_Fantasy_VIII/Cards)): Open, Random, Same, Same Wall (edges count as A), Plus, Combo, Elemental (+1/-1 on matching/non-matching element squares), Sudden Death; trade rules One/Diff/Direct/All. FFXIV ([Console Games Wiki](https://ffxiv.consolegameswiki.com/wiki/Triple_Triad)) adds **Ascension/Descension** (placing a type card gives +1/-1 to all cards of that type in both hands — the only rule that makes the board *compound*), **Order** (play in deck order), **Chaos** (random forced card), **Reverse** (lower wins), **Fallen Ace** (1 beats A), Swap, Roulette, Draft. The [GamerGuides strategy page](https://gamerguides.com/final-fantasy-viii/extra/in-depth-guides/triple-triad) is explicit that Same/Plus/Combo turn the game "from deterministic card strength comparisons into cascading tactical chains". Manzil's tie-flip cascade is already Combo; what it lacks is anything like Ascension (board-wide compounding) or Elemental (position that *modifies* value — this is where Manzil's planets already sit).

**Is Triple Triad solved?** No published solution found; the game is tiny (9 placements, 5 cards each, perfect information under Open), so it is almost certainly solvable by brute force **[unverified]**. Its longevity in FFXIV comes from the *collection* and the *rule variants*, not from depth of the base 3x3. That is the warning for Manzil: a 1x9 with public hands is strictly smaller than TT's 3x3.

---

## 2. Spatial card games: what makes position deep instead of solved?

| Game | Spatial core | Resource curve? | What keeps it from being solved |
|---|---|---|---|
| Triple Triad | 3x3, 4 facing numbers | None | Hidden hands (without Open); rule variants |
| Tetra Master ([Caves of Narshe](https://mail.cavesofnarshe.com/ff9/tetramaster.php)) | 4x4 with 0–6 random blocked squares; 8 directional arrows; battle stats | None | Random blocks and randomized battle math — the guide calls it "sheer dumb luck". Negative lesson: randomness is not depth. |
| Culdcept ([RPGFan](https://www.rpgfan.com/review/culdcept-begins/)) | Monopoly loop; creatures on territories; tolls; **chain bonuses** for same-element territories; land levelling | Yes — magic accumulates; lap bonuses | Economy compounds; territory is persistent and contestable via invasion battles |
| Onitama ([Wikipedia](https://en.wikipedia.org/wiki/Onitama)) | 5x5, five pieces | None, but **shared rotating move cards**: the card you use passes to your opponent | "Which [cards] depends on when each movement card is played" — using a card hands it over. Pure two-sided commitment. |
| Hive ([Wikipedia](https://en.wikipedia.org/wiki/Hive_(game)); [arXiv 2025](https://arxiv.org/html/2506.03492v1)) | No board; pieces *are* the board; One Hive rule; placement only adjacent to own pieces | None | PSPACE-hard when generalised; the authors say complexity "lies… in the geometry of the game and its abstract rules (like the One Hive rule) rather than in the exact movement of the pieces". **Constraint rules make geometry deep.** |
| Smash Up ([Opinionated Gamers](https://opinionatedgamers.com/2018/10/11/smash-up/)) | Bases (players + 1) with **breakpoints**; top three contributors score; base replaced | Minion+action per turn (flat) | Multiple simultaneous contested sites; choosing *which* fight to join |
| Summoner Wars 2e ([Space-Biff](https://spacebiff.com/2021/04/16/summoner-wars-2/)) | Grid; summon adjacent to gates | Yes — magic from discarding or kills (no longer from killing own units) | Kill-the-summoner objective; fragile gates punish turtling |
| Faeria ([wiki](https://faeria.gamepedia.com/Battlefield)) | Hex sea; you **build land** each turn (2 neutral or 1 coloured) adjacent to your own; wells give faeria to adjacent creatures | Yes — land *is* the mana *and* the board | Land placement is both resource and territory; "poor positioning early can severely limit future options" |
| Duelyst ([Roy Tang](https://roytang.net/2017/02/review-duelyst/)) | 9x5 grid; generals move; units move 2 and attack | Yes — HS-style mana + mana tiles on board | Backstab/Blast/Provoke make geometry matter; "strictly more skill-based" |
| Kards ([Wikipedia](https://en.wikipedia.org/wiki/Kards)) | Support line (4) → **front line (5), which only one player can hold at a time**; moving forward costs Kredits; no retreat | Yes — Kredits ramp to 12 | A single contested middle lane that is itself a resource |
| Stormbound ([wiki](https://stormboundkingdomwars.fandom.com/wiki/Frontline)) | 4x5; units march forward each turn; you may only deploy **behind your frontline**, which advances with your furthest unit and retreats when it dies | Yes — mana ramps | The playable region *grows and shrinks* with board state — the clearest "widening board" in a card game |
| Battle Line / Schotten Totten ([Meeple Mountain](https://www.meeplemountain.com/boardgame/battle-line)) | **Nine flags in a line**; 3-card poker formations each side; win 5 flags or **3 adjacent** | None | A 1x9 that is deep: each flag is a two-sided layered contest, and adjacency is a second win axis. The closest existing relative of Manzil's road. |
| Air, Land & Sea ([Game Rules](https://gamerules.com/rules/air-land-sea/)) | Three theatres; play face-up to matching theatre or face-down as 2 anywhere; **withdraw** early to concede fewer VP | None; 6 cards per battle | Withdrawal timing; multi-battle race to 12 |
| Star Wars Unlimited ([Behind Unlimited](https://starwarsunlimited.com/articles/behind-unlimited-leading-from-space)) | Two "mutually exclusive arenas" (ground/space) | Yes — one resource per turn | Designer Tyler Parrott: multiple arenas "improved the strategic decision making… while also reinforcing the thematic excitement" |
| Riftbound ([LoL wiki](https://wiki.leagueoflegends.com/en-us/Riftbound_(game))) | Shared battlefields; **conquer** for 1 point, **hold** through a full turn for another | Yes — runes; exhaust or recycle | Territory control to 8 points, not damage racing |

**Synthesis — what makes positional capture deep:**

1. **Constraint rules over the geometry**, not more geometry (Hive). A rule like "you may only place adjacent to your own cards" or "the hive may never split" generates PSPACE-hard structure on a trivial tile set.
2. **Layers per site** (Battle Line, Smash Up): a position that takes more than one card to settle creates a build-up and a reveal, and multiplies the branching factor by the number of still-open sites.
3. **A playable region that moves** (Stormbound, Kards): where you *may* play is a function of board state, so position buys options.
4. **Two win axes on one line** (Battle Line's 5-of-9 OR 3-adjacent): forces a choice between spreading and concentrating.
5. **Hidden information in placement** (Snap face-down reveal, ALS face-down as 2, Onitama's known-next-card).

**Who added a resource curve successfully?** Faeria (land is the curve *and* the board — elegant but it made the game slow and niche), Kards and Stormbound (conventional ramp bolted onto a positional board — works, but the positional layer carries the identity), Culdcept (economy compounds via chains — the territory *is* the engine), Summoner Wars 2e (magic from kills — compounding via combat). None of the pure placement games (TT, Tetra, Battle Line, Onitama) have a curve, and none of them widens; they are all **finite-placement puzzles**. That is the category Manzil is currently in, and the question is whether to leave it or to be the best of it.

---

## 3. Two-sided commitment: agency on the opponent's turn

Three families of mechanism give the non-acting player agency:

**a) Reaction windows (the stack, instants, LoR fast/slow spells, FaB defense reactions).** Rosewater's [Instant Winners](https://magic.wizards.com/en/articles/archive/making-magic/instant-winners-2003-06-23): "The game is simply less fun if the players aren't interacting"; "'gotcha moments' come from the instants." The window exists because hidden hand + a legal moment to act = bluff. LoR's speeds show the dial: *burst* (no response), *fast* (response allowed), *slow* (only when nothing else is happening).

**b) Defender's choice (combat).** Magic's attacker declares, defender assigns blocks; LoR's defender "chooses which units to block and with what"; Lorcana's challenger may only hit *exerted* characters, so the defender's prior choices (quest or not) are the defence. Combat is two-sided because both players make a decision inside one exchange.

**c) Simultaneous or hostage commitment.** Snap's simultaneous reveal; Onitama's "the card you use becomes your opponent's"; Mindbug's two Mindbugs per player that "take control of an opponent's creature the moment it's played" — per [Meeple Mountain](https://www.meeplemountain.com/reviews/mindbug/), "every card you play could end up in the hands of your opponent." These make *every* placement a two-sided question without adding a phase.

**Minimum rules addition for a placement game.** Ranked by rules weight, smallest first:

1. **One face-down card (FaB's arsenal / ALS's face-down 2).** Each player may keep one card face-down in a slot; it flips (reveals its numbers and resolves captures) when a neighbour is placed, or at end of board. Zero new phases; one new state. Adds bluff and a defender's answer.
2. **Mindbug-style tokens.** Each player has N "retrograde" tokens per match; when the opponent places a card, you may spend one to make it *yours* (or to reverse which number faces). The opponent then places again. Two tokens per match is enough to haunt every placement.
3. **Defender chooses the facing.** When your card is placed next to mine, *I* choose which of your numbers faces mine (or whether a tie flips). This is combat's "defender assigns blocks" compressed into one choice.
4. **Simultaneous placement (Snap).** Both choose slot+card, reveal together, resolve in a fixed order. Heaviest UI change, biggest payoff for a single-road game where there are only two players and one axis.

---

## 4. Board shapes that keep "the road" but widen

The fiction: a nine-mansion stretch of sky the moon travels. The constraint: keep it a road.

- **A road that grows (match-as-ascent, already tested 3→5).** This is Stormbound's frontline and Faeria's land-building: the playable region expands with time or with your own placements. Generalised: start with 3 mansions, one new mansion opens each turn (the moon rises into it) until 9. Branching factor rises from 3 toward a plateau instead of falling from 9. Pair with Kards' rule that advancing costs something.
- **A road that wraps.** Slot 9 is adjacent to slot 1 (the 28 mansions are a ring; the 9 visible are a window on it). Removes the two "safe" ends that make end-slots dominant in TT-likes; every card has two neighbours. Cheap, but does not widen by itself.
- **A road that scrolls (the moon moves).** Each turn the leftmost mansion sets (leaves the road, scoring whoever holds it) and a new one rises on the right. Slot count stays constant, so option space never narrows; cards have a *past* (scored) and the board has a *future* (the next mansion is known from the ephemeris). This is a conveyor — closest to ALS's rolling battles and Riftbound's "hold through a turn to score". It also uses the real sky: the next mansion to rise is literally the next in the sequence.
- **Multiple lanes (sky vs earth).** Star Wars Unlimited's two arenas and Kards' two lines: a sky road where the planets stand and an earth road where mansions stand, with vertical adjacency between lanes. Cards legal in one lane or the other (or both at a cost). Widens by doubling slots and by adding a second adjacency axis.
- **Stacking on occupied slots (occultation).** Hive and Culdcept both let a site hold more than one piece; Culdcept levels land; Battle Line builds three cards per flag. In Manzil: a card may be placed *over* an occupied mansion if it is higher (the existing **elevation law**); the lower card is occulted (inactive) until the upper card is captured, which uncovers it. Each slot becomes a stack with history, giving nine sites an effectively unbounded capacity and a compounding "uncover" dynamic.
- **A second axis (height/altitude).** The elevation law already exists. Make altitude a *lane*: high/middle/low across the same nine mansions (a 3x9), with capture only along a row and "falling" between rows. This is Gwent's rows crossed with TT's capture; the Homecoming lesson is that fewer rows with strong row-rules beat more rows with weak ones.

---

## 5. Win conditions beyond "most cards when full"

- **Life total as clock.** The standard. Its virtue is that it bounds game length and lets any card contribute to the clock; its vice is that it makes the board instrumental. Hearthstone, Magic, FaB (life 20–40, hands refill: a clock that runs while resources stay flat).
- **Points race on a shared track (Lorcana 20 lore; Smash Up 15 VP; ALS 12 VP; Riftbound 8 points).** The race makes *tempo denial* the interaction (challenge a quester) and lets a board be abandoned without losing. Riftbound's split between **conquer** (immediate point) and **hold** (a point for surviving a full turn) is the best existing model for "capture-and-hold" in a card game.
- **Capture-and-hold territory (Culdcept, Riftbound, Kards' frontline).** Position is worth points *over time*, so a card acting once at placement is no longer the ceiling — a card that holds for three turns earned three times.
- **Two-of-three lanes (Snap, ALS).** Converts a single contest into a portfolio; losing a lane is a tactic. Snap breaks ties with total power so the lanes still matter in aggregate.
- **Adjacency victory (Battle Line's 3 adjacent flags).** A second, concentrated win axis on a linear board; the only one of these designed for a 1x9.
- **Best-of-boards (Gwent, Manzil's best of five).** Works only if a board can be *lost cheaply* and resources carry across boards (Gwent's card advantage). Without carry-over, best-of-five is five independent coin flips with the same expected value; with carry-over it becomes a resource game about *when to spend*. Gwent's Homecoming hand-limit fix shows the degenerate case to design against.
- **Wager/stakes layer (Snap cubes).** Orthogonal to the board; raises the outcome ceiling by letting a confident player multiply the stakes and a losing one retreat cheap.

---

## Design options for Manzil's arena

Each option names what it fixes (W = widening, 2S = two-sided commitment, C = compounding, X = ceiling), what it costs, and what it does to the astrology.

### A. The Rising Road (growth curve as land drops)
The board opens with three mansions lit. At the start of each of your turns a new mansion rises (3→9 over six turns, or 3→9+ if the road is allowed to exceed nine as a "long night"). Cards may only be placed on lit mansions. Optionally a card's *strength* is modified by how long its mansion has been lit (older sky, stronger station), giving early slots a time value. **Fixes:** W (branching rises instead of falls, directly Rosewater's "early few, late many"). Partially C if lit-duration modifies strength. **Costs:** Game length is now fixed by the curve, not the hand; the first two turns are nearly trivial (same as Magic's turn 1); needs a rule for what happens when the road is full before hands are empty. **Fiction:** Excellent — the moon literally ascends through the mansions over the night; the ephemeris decides which mansion rises next. This formalises the already-tested "match-as-ascent".

### B. The Moving Sky (scrolling conveyor)
Nine mansions visible at any time, drawn from the 28-ring. At the end of each full round the leftmost mansion *sets*: whoever holds it banks a point (or the card itself, to a "set" pile), and the next mansion in the real sequence rises on the right, empty. The road never fills; the game ends when the moon has crossed N mansions or a player reaches a point target. Captures still work as now, but a captured card held until it sets is what scores. **Fixes:** W (constant slot count — option space never narrows), C (holding a position across turns earns; recapturing a card before it sets is a real counter), X (points are unbounded by nine, so blowouts exist). **Costs:** Loses the "full board" finality that makes TT satisfying; needs a clock (number of settings); the rightmost new slot is always empty and may be degenerate ("always play right") — fix by making the new mansion rise with a planet already in it per the ephemeris. **Fiction:** The strongest of all options — the road *is* the moon's motion, the ephemeris supplies the next mansion and the planets already standing in it. Nothing else here uses the real sky this directly.

### C. Sky and Earth (two lanes, vertical capture)
Two 1x9 roads: the sky road where the five planets stand (positioned by the ephemeris) and the earth road where mansions are placed. A card placed on earth faces left and right as now, and also *up* against the planet above it; planets face down. Some mansions may be played to the sky lane to stand beside planets (at a cost, or only if they out-elevate). **Fixes:** W (18 slots, two adjacency axes), 2S weakly (the planets are an opponent that "already committed", which you must answer), X (two lanes to score; tiebreak by total). **Costs:** Doubles UI; the left/right/up numbers need a third value on each card or a reuse rule; the planets as a fixed opponent are not a *player* — this fixes the sky's agency, not the human opponent's. **Fiction:** Very good — sky/earth is native to the mansion tradition; the elevation law becomes the gate between lanes.

### D. Occultation (stacking on occupied slots)
Keep 1x9. A card may be placed on an occupied mansion if its elevation is higher (the existing elevation law); the lower card is occulted — inert, but still owned — and is uncovered (and re-resolves its captures as if just placed) when the upper card is captured. Captures resolve on the top card only. Scoring counts every card in every stack at the end. **Fixes:** W (nine slots never close; every slot stays legal for a higher card), C (stacks have history; uncovering re-fires a card, so cards act more than once), X (card count scored is the hand size, not nine; stacks can swing by two or three on one capture). **Costs:** Elevation now dominates — needs the elevation distribution to be tight enough that low cards still have a role (they are good *first* on a slot, since they can be covered by friends as protection); reading a stack is harder than reading a slot; cascades get longer. **Fiction:** Good — occultation (one body hiding another) is real astronomy, and the planets occulting mansions is already in the ephemeris.

### E. Three Watches (Snap on a road)
Cut the road into three watches of three mansions (evening, midnight, dawn). Only the first watch is revealed at the start; the second lights before turn 2, the third before turn 3, each with its planets per the ephemeris. Both players choose card+slot each turn and reveal simultaneously; the player currently ahead reveals first. Win two of three watches (most cards in each), ties by total. **Fixes:** 2S (simultaneous commitment: every placement is a guess about the other's), W (information widens turn by turn even if slots do not), X (three sub-contests plus conceding a watch as a tactic). **Costs:** Simultaneous turns need a new client flow and a deterministic resolution order; captures across watch boundaries must be decided (allow them, so the road is still one road); the nine-slot ceiling is untouched. **Fiction:** Good — a night in three watches is traditional; the dawn watch being unknown until turn 3 mirrors not yet being able to see that part of the sky.

### F. Stations (Battle Line on the road)
Nine mansions; each side may commit up to two cards to each mansion over the game, stacked as a "station". A mansion is claimed when one side's station beats the other's (sum, or the existing left/right duel resolved between the top cards) and the loser cannot improve — or, as in Battle Line, when the claimant can prove no remaining card could change it. Win five mansions **or three adjacent**. **Fixes:** W (up to 36 placements across 18 slots; every open mansion stays live until claimed), 2S (each mansion is a two-sided build-up — my commitment answers yours), X (two win axes; concentrated vs spread). **Costs:** Hand of five is far too small — needs a draw each turn and a bigger pool (the 28 mansions become a shared draw deck, which they arguably should be); capture-by-facing-numbers must be redefined as station-vs-station; much slower. **Fiction:** Adequate — "stations of the moon" is a literal translation of *manāzil*, and the three-adjacent victory reads as the moon's three-night passage through a region.

### G. The Veil and the Retrograde (minimum two-sided layer, any board)
Keep whatever board. Add two things: (1) **the veil** — each player may hold one card face-down on the road; it reveals and resolves when a neighbour is placed beside it or at board end; (2) **retrograde tokens** — two per match; when the opponent places a card, spend one to flip which of its numbers faces which way *before* captures resolve (a planet going retrograde reverses its motion). **Fixes:** 2S only, but cheaply and fully — the veil gives a defender's hidden answer, the retrograde gives a reaction window with no new phase. **Costs:** Face-down state in UI; the retrograde must be limited or every placement becomes a coin flip; adds nothing to W, C or X. **Fiction:** Excellent — veiled stars and retrograde motion are both exact.

### H. The Lunar Clock (race win condition, any board)
Replace "most cards when full" with a race: each capture scores a *light* point immediately; holding a mansion whose planet is in dignity at the end of a round scores another (Riftbound's conquer/hold). First to 14 (half the 28) across boards; a board ends when full or when a player passes twice (Gwent). Best-of-five becomes a continuous race with carry-over, and passing becomes a real decision. **Fixes:** X (score is unbounded by nine; a dominant board earns more), C (holding earns over time), partially W (passing/holding is a new option every turn). **Costs:** Needs the Gwent fix against dry passing (e.g. a passed player still draws, or the opponent may keep placing against an empty side); the per-board finish loses crispness. **Fiction:** Good — accumulating light toward the full moon.

### Ranking

1. **B. The Moving Sky.** Fixes all four defects with one rule change (the leftmost mansion sets each round), and it is the only option that *uses* the ephemeris rather than decorating with it. Manzil's identity — the real sky, tonight — becomes its board engine. Pair with G.
2. **D. Occultation.** The cheapest fix to W, C and X that keeps the 1x9 and the capture rule untouched, and it promotes the elevation law from a tiebreak to the game's second axis. Highest risk is elevation dominance; test with a flat elevation curve first.
3. **G. The Veil and the Retrograde.** Not a board at all, but it should be added to whichever board wins. It is the minimum two-sided layer and the fiction is perfect.
4. **A. The Rising Road.** Proven in testing already; fixes W cleanly. Loses to B because a road that only grows still fills, so the ending is the same forced end-game, just later.
5. **E. Three Watches.** The best option for two-sided commitment and the most "modern" feel, but simultaneous turns are the largest client change and it does not fix compounding or the ceiling.
6. **H. The Lunar Clock.** Should be layered on B or D rather than stand alone; the Gwent dry-pass problem is real.
7. **C. Sky and Earth.** Thematically lovely but it widens the fight against the sky, not against the opponent, and a third facing number per card is a heavy card-design cost.
8. **F. Stations.** The deepest *as a standalone abstract* and the closest relative (Battle Line is a proven 1x9), but it rebuilds Manzil into a different game — the facing-number capture that is its signature would have to go.

**Recommended composite:** B + D + G. A scrolling nine-mansion window on the real sky, where a higher card may occult a lower one, where each player holds one veiled card and two retrogrades, and where a mansion scores for whoever holds it when it sets. Option space is constant, every card can act more than once, the opponent has a hidden answer and a reaction, and the score is unbounded by nine.
