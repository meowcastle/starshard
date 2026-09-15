# Why card mini-games and small card duels stay beloved for years — and where they fail

*Research notes for MANZIL-LOOP.md · agent report, 19 Aug 2026. Sources inline; anything not verified is flagged.*

## 1. Triple Triad (FF8) → FFXIV revival; Tetra Master as the cautionary contrast

**Core loop (FF8):** place five 4-number cards on a 3×3 grid, bigger number flips the neighbour, win the opponent's cards, refine them into items (Card Mod), repeat with every NPC in the world. Match length: ~1–3 minutes (9 placements). 110 cards across ten levels; L1 totals 10–13, L10 totals 26–29 ([FF Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII))).

**Why it's the gold standard:** (a) *Stakes*: "the ability to win opponents' cards creates meaningful consequences and investment" — the trade rules (One/Diff/Direct/All) are the loop's engine ([PC Gamer](https://www.pcgamer.com/why-i-love-triple-triad-in-final-fantasy-viii/)); (b) *ubiquity* — nearly every NPC plays, so the world is the opponent list; (c) *rules modules* as opt-in complexity — Open, Same, Same Wall, Sudden Death, Random, Plus, Combo, Elemental exist *per region*, and spread/abolish stochastically when you cross regions, with the Queen of Cards as the player's lever; (d) director Kitase explicitly wanted "realistic elements from physical collectible card games, like trading with friends and regional rule changes" ([Wikipedia](https://en.wikipedia.org/wiki/Triple_Triad)); (e) integration — Card Mod means cards have value *outside* the card game. Mastery = knowing which card's number-arrangement owns which corner, and reading the AI, which draws randomly from level-based pools and "never play[s] two of the same card in a hand".

**Failure mode, even here:** the Random rule "is so atrociously unfair it almost breaks the game" — it strips deck choice; players spend hours abolishing it ([PC Gamer](https://www.pcgamer.com/why-i-love-triple-triad-in-final-fantasy-viii/); [TheGamer](https://www.thegamer.com/final-fantasy-8s-triple-triad-is-the-greatest-minigame/) calls regional rules "frustrating"). Lesson: rule modules that *remove* player agency are hated; modules that *add* interactions (Plus/Same/Combo) are loved.

**FFXIV's additions:** 451+ unique cards as of 7.35; 16 special rules (Plus, Same, Reverse, Fallen Ace, Combo, Random, Order, Chaos, Swap, Draft, Sudden Death, All Open, Three Open, Roulette, Ascension, Descension); NPCs with fixed decks and fixed personal rules, *plus* regional rules that rotate daily; cards drop only on wins at per-NPC percentages; deck restrictions tied to collection size (under 30 cards: four 1★ + one any; 60+: four 1–3★ + one 1–5★); Open Tournaments every two hours in Draft format, Manderville tournaments biweekly ([ConsoleGamesWiki](https://ffxiv.consolegameswiki.com/wiki/Triple_Triad), [arrtripletriad.com](https://arrtripletriad.com/en/how-to-play)). The content-freshness lever here is mostly **new opponents with curated decks** and **rule combinations**, not new boards.

**What FFXIV players complain about** (SE forum "Please fix Triple Triad"): Swap/Chaos "not fun" ("a 3-star card swapped for a 5-star card…is a guaranteed win"); 4★ cards are "solely collector's items" since 5★ dominate; NPCs "who have two five-star cards" violate the player's own restrictions (rubber-banding by fiat, resented); Same+Plus with hidden cards makes "some random card that you had no way of predicting flip the entire table"; Draft tournaments hand some players "objectively 'better' sets" ([SE forum thread](https://forum.square-enix.com/ffxiv/threads/430969)). Card-drop grind is the other chronic complaint ([TheGamer](https://www.thegamer.com/final-fantasy-14-triple-triad/)).

**Tetra Master (FF9):** 4×4 grid, 8 arrow directions, four stats (attack, type P/M/X/A, physical def, magic def, 0–F), and a battle formula where "the actual values used are determined by subtracting a random number between 0 and the respective base value" so "any given card, no matter how good it may be, can be defeated by any other given card" ([Caves of Narshe](https://www.cavesofnarshe.com/ff9/tetramaster.php)). Cards evolve randomly; identical cards have different arrows; "Cards in TM have no use outside of playing more TM"; "the rules become obscure" at the exact moment a combat resolves ([Cantrip](https://cantrip.wordpress.com/2017/02/14/tetra-master-in-final-fantasy-ix/)). Failure mode: *hidden stats + RNG resolution + no external stakes*. Triple Triad's arithmetic is visible; Tetra Master's is not. That is the whole difference.

## 2. Gwent-in-Witcher-3 vs standalone Gwent

**Core loop (W3):** beat named NPCs and innkeepers across the map to win their cards, build a faction deck, enter quest tournaments. Match ~5–10 min (best of three rounds). "Half the fun is adventuring to find each card" ([TheGamer](https://www.thegamer.com/the-witcher-3s-gwent-is-fun-because-of-the-adventure/)). The "perfect minigame" analysis lists: optional, a *distinct* experience from the main game, collect-them-all, simple rules with per-deck strategy, and sustained incentives (quests, tournaments, achievements) with opponents that scale ([gamedevsjourney](https://gamedevsjourney.substack.com/p/what-we-can-learn-from-the-perfect)).

**Why standalone struggled:** stripped of the world it is "the shallow card game it is"; the power fantasy (your over-tuned deck vs fixed NPCs) cannot survive balance-for-PvP. The Midwinter patch (100+ cards, overcomplication) caused "massive backlash"; "stale, repetitive seasons" ([Gfinity](https://www.gfinityesports.com/article/how-cd-projekts-gwent-rose-to-glory-and-why-losing-it-still-cuts-deep)). CDPR ended active development after 2023, handing balance to a community council ([Game Developer](https://www.gamedeveloper.com/business/cd-projekt-ending-active-development-on-gwent-after-2023)). Steam all-time peak 4,862 (May 2020); ~480 average in July 2026 ([SteamCharts](https://steamcharts.com/app/1284410)). **Lesson for Manzil:** the minigame's retention comes from *where cards come from* and *who you play*, not from the rules' competitive purity.

## 3. Marvel Snap

**Core loop:** 12-card deck, 6 turns, 3 locations with revealed effects, simultaneous plays, snap/retreat to double or cap stakes; a match is ~3 min ([mobilegamer.biz / Brode GDC](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/)). Brode: "less about making the game simple and more about maximizing the depth of the complexity we chose to add"; the snap came from "the doubling cube from backgammon"; retreat displays "Escaped!" because it "zeroes out the emotional negativity" ([Apple Developer](https://developer.apple.com/news/?id=sosm2p7q)). Hagman: "Because you can retreat and only lose one cube…you can lose a ton of games and feel great"; 12 cards is "really tight…and yet you still have that agonising point of 'Do I play this to the left or to the middle?'" ([GamesHub](https://www.gameshub.com/news/features/marvel-snap-designer-interview-kent-erik-hagman-smart-card-game-design-31692/)). Freshness = a new card weekly + a featured/hot location + monthly season.

**Retention/monetization critique:** peak ~$14M/month (Dec 2022) then decline; Spotlight Caches (July 2023) reworked "after significant outcry" ([Naavik](https://naavik.co/digest/marvel-snap-card-acquisition-spotlight-caches/)). In 2026 the complaint is unchanged ([The Star, Aug 2026](https://www.thestar.com.my/tech/tech-news/2026/08/15/marvel-snap-slowly-levelling-up-three-upgrades-and-three-features-that-need-work)). Steam: peak 18,967 (Aug 2023), ~1,800 avg in mid-2026 ([SteamCharts](https://steamcharts.com/app/1997040)). Failure mode: *the loop is excellent; the acquisition economy is what players leave over.*

## 4. Balatro, Inscryption, Slay the Spire, Luck Be a Landlord (solo loops "against nothing")

**Balatro** — play poker hands to beat an exponentially escalating Ante, buy Jokers that multiply each other. Run ~30–60 min; a single ante ~5 min is the real "one more" unit. LocalThunk: concept "started as inspiration from…Big 2 and videos…about Luck Be a Landlord"; he dislikes "the 'gamery' language of fantasy and combat" ([TouchArcade](https://toucharcade.com/2024/03/18/balatro-interview-mobile-port-localthunk-dlc-plans-updates-new-jokers-demo-feedback/), [Balatro Timeline](https://localthunk.com/blog/balatro-timeline-3aarh)). 50,000 copies in the first two hours, 119k day one; 5M+ by early 2025 ([Windows Central](https://www.windowscentral.com/gaming/the-numbers-on-that-page-made-no-sense-balatro-developer-recalls-his-amazement-at-selling-50-000-copies-of-his-game-which-went-on-to-sell-5-million)). The pull is "what high-scoring machine can I put together next" ([errorandexp](https://errorandexp.substack.com/p/unpacking-balatros-addicting-game)). **Lesson:** an opponent is optional if the *score itself* is the drama.

**Slay the Spire** — 18M runs analysed from 2020: 9% overall win rate; winning runs cluster at 60–80 min, losing runs average 23 min ([Fox Row](https://foxrow.com/slay-the-spire-statistical-analysis)). Ascension 1–20 is the long-tail. A 9% win rate is *fine* when losing is fast and informative.

**Inscryption** — Leshy's upcoming cards sit face-up in a queue, so the opponent is *fully readable*. Mullins: "not much planning went into the core rules…rapidly created during the 48-hour game jam"; what retains is "outside of the rules…the mysterious antagonist" ([Game Developer](https://www.gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption)). Kaycee's Mod = Inscryption's Ascension. **Directly relevant:** a deterministic, visible opponent is not a weakness if the board state itself is rich.

**Luck Be a Landlord** — the "opponent" is a rent bill that escalates ([Wikipedia](https://en.wikipedia.org/wiki/Luck_Be_a_Landlord)). Escalation curve replaces opponent.

## 5. Hearthstone Battlegrounds / Dungeon Run

**Dungeon Run (2017):** Kosak: "Dungeon Runs play so fast, it doesn't feel bad to lose"; bosses were designed to counter the dominant strategy ([GamesRadar](https://www.gamesradar.com/in-hearthstones-kobolds-catacombs-dungeon-runs-play-so-fast-it-doesnt-feel-bad-to-lose-says-blizzard/)). Lesson: *authored AI opponents whose decks exist to punish a specific player habit* is how PvE makes you change your plan.

**Battlegrounds:** one tribe randomly excluded per game ([Out of Games](https://outof.games/news/1432-hearthstones-battlegrounds-implements-shifting-minion-pools/)). Loewen (2026): "by changing what content is available from season to season, it lets you both experience new stuff and recontextualize old stuff" ([Screen Rant](https://screenrant.com/hearthstone-battlegrounds-blizzard-interview-2026/)). Finishing 1st–4th of 8 is positive; retention from "the excitement of what can go right rather than the fear of what could go wrong" ([PC Gamer via PressReader](https://www.pressreader.com/usa/pc-gamer-us/20200421/282784948573303)). Battlegrounds' share of Hearthstone players: **unverified**.

## 6. Pokémon TCG Pocket, Master Duel solo, Artifact, LoR Path of Champions

**TCG Pocket:** every change shortens and de-variances the match ([Game8](https://game8.co/games/Pokemon-TCG-Pocket/archives/474638)). ~$1.3B first-year revenue (AppMagic est.), 150M downloads ([NintendoReporters](https://www.nintendoreporters.com/en/news/general/pokemon-tcg-pockets-first-year-13b-estimated-revenue-and-record-player-engagement/)). MAU fell ~41% YoY (39M → 23M, Apr–Jun 2026 vs 2025) per DeNA ([Game Rant](https://gamerant.com/pokemon-tcg-pocket-player-count-loss-changes/)). Failure mode: a collection loop with thin play depth decays once the collection novelty does.

**Master Duel Solo Mode:** onboarding content, not an endgame ([Yugipedia](https://yugipedia.com/wiki/Solo_Mode)). A PvE mode that is *only* a curriculum doesn't retain.

**Artifact:** "much information is hidden—not 'hidden information' in a game-theoretic sense but hidden offscreen"; heavy uncontrolled RNG; no progression ladder at launch ([Game Developer](https://www.gamedeveloper.com/design/why-artifact-failed)). Three lanes you can't see at once is an anti-pattern; Manzil's 1×9 single row is a *good* call on this axis.

**LoR Path of Champions:** after the Jan 2024 layoffs Riot redirected "from PvP to the PvE game mode Path of Champions" ([Wikipedia](https://en.wikipedia.org/wiki/Legends_of_Runeterra)). GameRiv's "doubled player counts" claim is **unverified** ([GameRiv](https://gameriv.com/focusing-on-pve-in-lor/)).

## 7. Design theory

- **Small number spaces.** Triple Triad lives on *arrangement*, not card count. Rosewater's New World Order: comprehension and board complexity stay low at the entry tier; *strategic* complexity is "invisible to new players" and can stay high ([Making Magic](https://magic.wizards.com/en/news/making-magic/new-world-order-2011-12-05)).
- **Rules modules as complexity opt-in.** Additive modules (Plus/Same/Combo/Elemental, Ascension) are celebrated; subtractive or randomizing modules (Random, Chaos, Swap, Roulette) are the most-hated elements in both FF8 and FFXIV.
- **Fair AI.** Rubber-banding is resented ([Game Wisdom](https://game-wisdom.com/critical/rubber-banding-ai-game-design)); FFXIV players resent NPCs that break the player's deck limits. Dungeon Run's alternative: *authored* counter-decks rather than stat cheats.
- **Readable but deep.** Inscryption, Snap, Triple Triad show; Tetra Master hides and died. Garfield's luck-vs-skill talk ([Board Game Design Lab](https://boardgamedesignlab.com/luck-vs-skill-with-richard-garfield/)) — paraphrase, transcript not fetched.
- **How many cards before deck choice is expressive?** No source gives a number; the expressive unit is *number of viable archetypes × number of meaningful slots*, not raw card count.

## Implications for Manzil (candid)

1. Decision density on a 1×9 row is the real risk, not the AI. Make *every* placement interactive (wrap, or contiguous fill).
2. The familiarity law must hide flavour, never numbers or the active signature (Tetra Master direction otherwise).
3. Signature moves are rules modules: additive, never agency-removing. Mercury's reverse and Uranus's swap are Random/Swap-class.
4. Deterministic AI + same duel for everyone is a strength — if the AI is *authored* (per-night intent), not just greedy.
5. Best-of-five is probably too long for the unit of play and too short for mastery; consider one board = a match, night = Bo-N, or a Snap-style concede.
6. 28 × 4 levels is enough only if levels change *decisions*; make L3/L4 lateral.
7. The walking five is expressive iff there are ~4–6 named archetypes.
8. Collection loop is slow and defensible, if game-shards are visible on the card.
9. Freshness from opponents and boards, not cards.
10. Mastery at month 12 needs a ladder that isn't a streak (per-mansion Ascension).
11. Stakes: let a claimed mansion feed back into Star Shard proper.
12. Verify first-player advantage and AI exploitability by brute force (done: see manzil-sim-report.md).

**Not verified:** Battlegrounds' player share; LoR PoC "doubled players"; Garfield transcript; any formal game-theoretic solution of Triple Triad.
