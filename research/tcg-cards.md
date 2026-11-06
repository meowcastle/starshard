# Card-system research for Manzil

*Research date: 6 Oct 2026. Web sources are linked inline. Claims marked **[unverified]** come from memory or from a source that was ambiguous and should be checked before being relied on. Claims marked **[domain]** are astrological facts the design leans on; they are standard in the literature but were not fetched during this session.*

---

## 0. The diagnosis, restated in TCG terms

Watching MTG Arena the designer saw: flat cost (no curve), one card type, static modifiers, no compounding, nothing that improves another card. In Rosewater's vocabulary the current Manzil deck is **28 modular, static, costless permanents of one type and one "color."** Every design lever below exists to break one of those five adjectives.

A useful frame from Rosewater's linear/modular essay: *linear* cards "clump together in obvious groups" with "very narrow but focused synergy" (tribes, slivers, morph), while *modular* cards are "a bunch of Legos" where "each individual piece can fit with many other individual pieces" (equipment, imprint). "The power of slivers is that each one makes the collective group stronger." ([Come Together, 2003](https://magic.wizards.com/en/news/making-magic/come-together-2003-10-06-0)). Manzil today has no linear glue at all; the proposal at the end adds some.

---

## 1. How Magic's card architecture generates variety

### 1.1 The color pie: identity by restriction

Rosewater's founding argument is that the pie exists to **restrict**: "Restrictions while frustrating short term, are critical to happiness long term." Without it, "there'd be no white weenie or green Stompy deck, just a speed creature deck." Target: "The more different black is from green, the better. I want colors that are blaringly unique in what they represent." ([The Value of Pie, 2003](https://magic.wizards.com/en/news/making-magic/value-pie-2003-08-18-0))

The pie is operationalized as a three-tier **frequency** ranking per color, not a binary. In the 2021 Mechanical Color Pie each effect is **primary** ("shown most frequently, lowest rarity, appears in nearly every set"), **secondary** (regular but less frequent, often with a rider), or **tertiary** (occasional, "often years between appearances, frequently narrow"). "Primary, secondary, and tertiary are relative to how often an effect is used." ([Mechanical Color Pie 2021](https://magic.wizards.com/en/news/making-magic/mechanical-color-pie-2021))

What each color is **not allowed to do** is as load-bearing as what it does (from the same article, paraphrased):

| Color | Primary (owns) | Forbidden / heavily restricted |
|---|---|---|
| White | life gain, combat-conditional removal, tokens, damage prevention, small team pumps | creature tutoring; card draw beyond once/turn; big pumps |
| Blue | card draw, counterspells, bounce, copying, animating artifacts | direct creature destruction; artifact destruction; life gain |
| Black | unconditional creature kill, discard, reanimation, sacrifice, tutor anything | draw without paying life/sacrifice; damage prevention; pumping |
| Red | direct damage, artifact destruction, temporary mana, haste, land destruction, temporary theft | permanent pumps; counterspells; draw except impulsive/wheel/punisher |
| Green | creature tutoring, +1/+1 counters, mana, land animation, artifact destruction | counterspells; free card draw; direct damage; filtering |

Wizards tried a sixth color (purple) during Planar Chaos design and abandoned it; both Bill Rose and Rosewater "had individually decided that it wasn't a good idea" ([The Color Purple, 2007](https://magic.wizards.com/en/news/feature/color-purple-2007-01-29)). The structural reason usually given — a pentagon gives every color exactly two allies and two enemies, which five is the smallest odd number to do — is widely repeated but was not in the fetched article **[unverified as a Rosewater quote]**.

Lesson for Manzil: a pie is a *prohibition list* with a *frequency dial*, and it needs an adjacency structure (allies/enemies) so that pairings have texture.

### 1.2 Card types and supertypes

MTG's object-level variety comes from a small, fixed grammar: permanents (creature, artifact, enchantment, land, planeswalker, battle) vs one-shots (instant, sorcery), with **supertypes** (Legendary, Basic, Snow) layered over them. Abilities are typed by the rules into four kinds: **spell**, **activated** (cost: effect), **triggered** ("when/whenever/at"), and **static** ("as long as"/continuous). Triggered and activated abilities use the stack and can be answered; "static abilities don't use the stack" ([Draftsim, Abilities](https://draftsim.com/mtg-abilities/)). Section 4 returns to this.

### 1.3 Cost + rarity + power budget, and what each rarity is *for*

Rosewater's rarity essay assigns each rarity a job, not just a scarcity ([Nuts & Bolts: Higher Rarities, 2012](https://magic.wizards.com/en/news/making-magic/nuts-bolts-higher-rarities-2012-02-27)):

- **Common** — establishes the set's themes and mechanics; "Don't advance beyond common until your commons are getting the job done."
- **Uncommon** — "the pinch point of the set": twists on common themes, larger bodies, catch-up cards (sweepers), and the **build-around cards that define draft archetypes**.
- **Rare** — "the most breathing room": splashy, wordy, bomb-y; "excite new players when shown rares in isolation."
- **Mythic** — "Every mythic rare has to have the potential to be awesome," but high impact *and* straightforward.

Power does not scale linearly with rarity; **complexity** does (see 1.5).

### 1.4 The design skeleton: rules that make 300 cards feel different from the last 300

The skeleton is a fixed grid of slots coded by rarity and color (CW01 = common white #1). Revisited in 2021 ([Nuts & Bolts #13](https://magic.wizards.com/en/news/making-magic/nuts-bolts-13-design-skeleton-revisited-2021-03-22)):

- **Commons: 101** (19 per color + 6 artifacts). **Uncommons: 80** (13 per color + 10 multicolor + 5 artifacts).
- Creature share at common by color: W 62%, U 50%, B 56%, R 53%, G 59% — the pie expressed as a ratio.
- A mandated **mana curve at common** per color (e.g. white: one 1-drop, three 2-drops, two 3-drops, two 4-drops, one 5, one 5–6).
- A per-color **evergreen keyword menu at common** (white: flying ×2–3, first strike, lifelink, vigilance...; red: haste ×1–2, menace, trample...; blue: flying ×3, flash, hexproof).

Then structural layers from [Nuts & Bolts #15](https://magic.wizards.com/en/news/making-magic/nuts-and-bolts-15-structural-support): "anywhere from three to six named mechanics" per set; unnamed mechanics on two to five low-rarity cards to reinforce archetypes; "_____ matters" themes; mana sinks, deck smoothing, evasion, "threats and answers at every rarity"; and **ten two-color draft archetypes** balanced for novelty: "about two archetypes that are doing something novel, four... a little different, and four... pretty familiar."

So the answer to "how do 300 new cards feel different": the *skeleton* (slots, curve, ratios, keyword menu) is held nearly constant, and difference is injected only through (a) 3–6 named set mechanics, (b) a new world/flavor, (c) the two novel archetypes. Everything else is deliberately familiar. Variety comes from a small number of controlled variables on a fixed chassis.

### 1.5 New World Order: a complexity budget by rarity

Introduced 2008 to fight complexity creep. Three kinds of complexity: **comprehension** (understanding the card), **board** (tracking state), **strategic** (decision depth). Hard rule for commons: a common "cannot affect more than one other card while on the battlefield." Complexity is treated as "a limited resource at common" because beginners' collections are mostly commons. Loosened somewhat with 2024 Play Boosters. ([mtg.wiki: New World Order](https://mtg.wiki/page/New_World_Order); [SCG: NWO and Complexity Creep](https://articles.starcitygames.com/articles/new-world-order-and-complexity-creep/))

### 1.6 Lenticular design

Rosewater's 2014 essay: cards that look simple to a novice and reveal depth to an expert, like a lenticular print. Goal: "add complexity to enhance the game for the more-experienced players without increasing the difficulty for the less-experienced ones." Canonical examples are **death triggers** (Black Cat, Festering Goblin): a beginner sees "a nice surprise when it dies"; a veteran "make[s] attacking and blocking decisions based on the death trigger." ([Lenticular Design, 2014](https://magic.wizards.com/en/news/making-magic/lenticular-design-2014-03-31)). This is directly relevant to Manzil's "familiarity law": a card that sheds text as it levels is the physical embodiment of lenticular design.

### 1.7 Keywords vs ability words vs evergreen vs deciduous

- **Keyword**: a named rules object ("flying", "cycling").
- **Ability word**: an italic label with no rules meaning that groups similar triggered abilities ("landfall", "raid").
- **Evergreen**: in every set. **Deciduous**: "not evergreen, but may show up from time to time in a set that needs it" (kicker, flashback, cycling, vehicles, Food/Treasure tokens). Mechanics get promoted: surveil went deciduous in 2022, evergreen in 2025. ([mtg.wiki: Deciduous](https://mtg.wiki/page/Deciduous); [Draftsim: Evergreen](https://draftsim.com/mtg-evergreen/))

### 1.8 Parasitic vs backward-compatible

A **parasitic** mechanic "only interact[s] with other things in a particular set rather than the rest of Magic" (horsemanship, splice onto Arcane). The opposite is a mechanic whose "strategic depth increases as more cards are printed." ([mtg.wiki: Parasitic](https://mtg.wiki/page/Parasitic)). For a "printed once, never again" game, parasitic set mechanics are a *feature* for collectors but a trap for the card pool — each set must leave hooks the next can grab.

---

## 2. Newer TCGs that built a pie from scratch

| Game (launch) | Identity axes | Deck-identity device | Card types | Cost |
|---|---|---|---|---|
| **Flesh and Blood** (2019) | Class (14+) × Talent; plus Generic | Hero card; "You can only play cards that are generic or share a class and/or talent with your hero" | hero, weapon, equipment (head/chest/arms/legs), attack action, non-attack action, attack reaction, defense reaction, instant, block | **Pitch**: every card has a color stripe; red pitches for 1, yellow 2, blue 3; pitched cards go to bottom of deck |
| **Lorcana** (2023) | 6 inks (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel); up to 2 per deck = 21 pairs (36 ordered) | ink pair | character, action, song, item, location | **Ink any card**: once a turn put an *inkable* card face-down into the inkwell |
| **Sorcery: Contested Realm** (2023) | 4 elements (Fire/Air/Water/Earth) with **thresholds**; Avatar | Avatar + element thresholds | site (Atlas deck), minion, magic, aura, artifact/relic, monument (Spellbook) | **Sites** on a 5×4 grid produce mana *and* element threshold |
| **Star Wars: Unlimited** (2024) | 6 aspects: Vigilance, Command, Aggression, Cunning + Heroism/Villainy | Leader (2 icons) + Base (1 icon) | leader, base, unit (ground/space arena), event, upgrade | **Any card face-down as resource**, 1/turn; **aspect penalty** +2 per missing icon |
| **One Piece** (2022) | 6 colors; Leader fixes deck colors | Leader card | leader, character, event, stage | **DON!!**: shared resource cards that both pay costs and attach for +1000 power |
| **Riftbound** (2025) | 6 domains: Fury, Calm, Mind, Body, Chaos, Order | Legend (sets domains) + Champion + 3 battlefields | legend, champion/unit, spell, gear, rune, battlefield | **Rune deck** (12): exhaust a rune for Energy, recycle it for colored Power |

Sources: FaB — [Wikipedia](https://en.wikipedia.org/wiki/Flesh_and_Blood_(card_game)), [Cardgamer beginner's guide](https://cardgamer.com/games/tcgs/flesh-and-blood/how-to-play-flesh-and-blood-tcg-a-beginners-guide/). Lorcana — [SCG reveal](https://articles.starcitygames.com/news/early-mechanics-and-deckbuilding-details-for-disneys-lorcana-tcg-revealed/), [Lorcana Player card types](https://lorcanaplayer.com/lorcana-card-types/), [Checkpoint interview with Ryan Miller](https://checkpointgaming.net/features/2024/08/talking-the-magic-of-disney-lorcana-with-co-designer-ryan-miller). Sorcery — [Wikipedia](https://en.wikipedia.org/wiki/Sorcery:_Contested_Realm). SWU — [Heroism and Villainy](https://starwarsunlimited.com/articles/heroism-and-villainy), [Inside Unlimited](https://starwarsunlimited.com/articles/inside-unlimited), [Draftsim MTG vs SWU](https://draftsim.com/mtg-vs-star-wars-unlimited/), [Cardgamer aspects](https://cardgamer.com/games/tcgs/star-wars/aspects-in-star-wars-unlimited/). One Piece — [TCGTalk colors guide](https://tcgtalk.com/guides/one-piece-tcg-colors-guide). Riftbound — [LoL wiki](https://wiki.leagueoflegends.com/en-us/Riftbound_(game)), [Rare Candy guide](https://rarecandy.com/blog/what-is-riftbound-a-complete-beginners-guide-2025).

### What they chose differently

- **A hero/leader/legend card as the deck's keystone** is now the default (FaB, SWU, One Piece, Riftbound, Hearthstone). It fixes the pie slice *before* a card is played and gives the deck a face. SWU's designers: "which of several bases to pair them with can result in very different decks, even with the same leader." Lorcana is the exception (pure ink pair, no leader) and compensates with a dense character roster.
- **Two-axis pies.** SWU splits four "how you fight" aspects from a two-value "whose side" axis (Heroism/Villainy), which "are the aspects that are most commonly paired with other aspects on a card." FaB splits Class (how) from Talent (lineage/element). The second axis is cheap to add and roughly doubles the number of distinct deck identities.
- **Soft rather than hard color restriction.** SWU lets you play off-aspect cards at +2 each; Sorcery's thresholds let any deck *try* a second element; Riftbound mixes a 12-rune deck "in any ratio." Hard-locked color (One Piece leader, FaB class) is simpler but makes new-set hooks harder.
- **Sorcery's elements are explicitly mechanical verbs**: Fire = raw damage, Air = movement and random lightning, Water = control and board alteration (drowning/pushing), Earth = "the Physical" (minions, sites, staying power). This is the cleanest small pie in the sample and the only one built on a *spatial* board — the closest cousin to Manzil.
- **Restraint on mechanics per set**: Lorcana's Ryan Miller — "we didn't want to put brand new mechanics in every single set because we had an eye towards our new players."

### Minimum viable pie — how many axes before decks feel different?

Evidence from the sample: every successful launch has **4–6 primary slices** plus **one secondary binary or lineage axis** (SWU: 4+2; FaB: class + talent; Sorcery: 4 elements + avatar; Riftbound: 6 domains + legend; Lorcana: 6 inks, no second axis but 2-ink pairing). Hearthstone shipped with 9 classes + neutral and no second axis. Marvel Snap has **zero** pie (one card type, no colors) and gets variety from 12-card decks, locations, and "simplify – even if your team hates you" ([Brode via MobileGamer](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/)).

Working rule: **one axis of 4–6 "how" identities, each with a prohibition list; one axis of 2–4 "who/where" identities that cross it; one neutral/generic pool.** Fewer than four primaries and pairs stop feeling distinct (3 colors → 3 pairs); more than six and the launch set can't give each slice enough commons.

---

## 3. Cost systems other than mana

| System | Mechanic | What it buys the designer | Fit for ~5 plays/game |
|---|---|---|---|
| **MTG lands** | separate resource cards, 1/turn | mana screw as variance; curve as skill | poor — 5 plays can't absorb dead draws |
| **Hearthstone** | +1 crystal/turn automatically, max 10; 30-card decks ([Wikipedia](https://en.wikipedia.org/wiki/Hearthstone)) | the turn counter *is* the curve; no dead cards | **good** — turn N = N energy maps a 5-turn game onto costs 1–5 |
| **Marvel Snap** | energy = turn number, 6 turns, 12 cards, 3 locations ([MobileGamer](https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/)) | same as HS but tuned for a 6-play game; curve = deck's turn plan | **best analogue** — Snap is the proof that a 5–6 play game can have a real curve |
| **Runeterra spell mana** | unspent mana banks up to 3, spells only ([Riot support](https://support.riotgames.com/legends-of-runeterra/gameplay/let-s-talk-about-mana)) | rewards passing; separates permanent vs one-shot economies | good as a *rider*: unspent light carries into a reactive card |
| **FaB pitch** | pitch red/yellow/blue cards for 1/2/3; pitched cards cycle to deck bottom | every card is both spell and fuel; the deck's color mix is the curve | medium — with a 5-card hand each pitch is a whole play; too punishing unless hands refill |
| **Lorcana inkwell / SWU resource** | any (inkable) card face-down, 1/turn | tempo decision "which card do I sacrifice" (Schaefer: "deciding which card to choose has huge strategic implications") | poor — sacrificing 1 of 5 cards is 20% of the game |
| **Sorcery thresholds** | sites give mana *and* element symbols; cards need N symbols | position-on-board is the colored cost | **strong** — Manzil already has position; "threshold" could be *how many of your planet's mansions/planets are on the grid* |
| **Riftbound runes** | exhaust for energy, recycle for colored power | two-speed cost: generic vs colored | the generic/colored split is worth stealing |
| **One Piece DON!!** | resource cards double as +1000 attachments | the cost token *is* the pump → compounding | **good idea for compounding**: unspent resource becomes a modifier on a placed card |
| **KeyForge** | no costs; choose one of three houses per turn, use only that house ([Cardboard Herald](https://www.cardboardherald.com/reviews/2019/1/28/keyforge-the-other-side-of-the-wall)) | identity-as-cost; "cards have no cost, and you can use all of your toys" | **very good** — a per-turn "which planet do I honor" choice costs nothing and creates a curve of *sequencing* |
| **Dominion** | treasure cards buy cards; deck is the economy ([Wikipedia](https://en.wikipedia.org/wiki/Dominion_(card_game))) | growth loop | not for a 5-play match; but a between-match economy for leveling L1–L4 |
| **Netrunner** | clicks (actions) + credits (money) ([Wikipedia](https://en.wikipedia.org/wiki/Android:_Netrunner)) | two currencies; action economy | clicks fit: "place a card" vs "turn a card" vs "draw" as competing uses of a turn |
| **Ascension** | runes buy cards, power kills monsters **[unverified detail]** | two currencies from the same hand | see Netrunner |

Conclusion for Manzil: with only ~5 placements, **cost must not consume cards**. The viable families are (a) turn-indexed automatic energy (HS/Snap), (b) board-state thresholds (Sorcery), and (c) identity-as-cost (KeyForge house choice). A combination of (a) and (b) is proposed in §7.

---

## 4. Triggered vs static abilities; how cards modify other cards

**Static** ("as long as", keywords like flying): always on, no stack, cannot be responded to; cheap to comprehend but adds **board complexity** because its effect must be re-derived every time state changes. **Triggered** ("when/whenever/at"): fires on an *event*, goes on the stack, can be answered; adds **strategic complexity** because the opponent can play around the event. ([Draftsim: Abilities](https://draftsim.com/mtg-abilities/))

Why triggers generate play and statics don't: a trigger creates a *decision about when*. Lenticular design is almost entirely built on triggers (death triggers, ETB). A static +1 is read once; "whenever a neighbor is captured, +1" is read every turn.

**Compounding devices, and why they work**

- **+1/+1 counters**: flavorless, so they have "a high level of compatibility between thematically unrelated mechanics"; green and white primary. They persist across effects and stack additively, so any card that adds counters improves every other card that cares about counters ([mtg.wiki: +1/+1 counter](https://mtg.wiki/page/+1/+1_counter)). Design rule: only one P/T-counter type per block to protect limited.
- **Equipment / upgrades**: modular (Rosewater's Lego metaphor): one object that makes *any* body better, and survives the body's death. SWU "upgrades" attach to units, leaders *or* bases; One Piece DON!! attaches the resource itself.
- **Auras**: linear — die with the host; higher variance, higher ceiling.
- **Tribal/"matters"**: linear glue; "each one makes the collective group stronger."
- **Ability words** as a family: landfall, raid etc. let a *trigger condition* become the set's identity while effects vary.

New World Order's constraint keeps compounding legible: at common, a card may affect at most **one** other card. Compounding engines live at uncommon (build-arounds) and rare.

---

## 5. Card as collectible: making 28 cards + expansions feel like a universe

- **Cycles** are the cheapest world-building and the main device for making a set feel structured: horizontal (one per color), vertical (same color, three rarities), mega-cycles (Ravnica guilds), mirrored pairs (White Knight / Black Knight). Basic lands are the most-reprinted cycle; Circles of Protection second. ([mtg.wiki: Cycle](https://mtg.wiki/page/Cycle))
- **Flavor text / names / art** carry different loads: names are "slice-of-life identifiers that belong specifically to their planes"; flavor text supplies lines "that extend beyond cards into player conversations"; art "shap[es] external perceptions." Rosewater: "If you make a game that everyone likes but no one loves, it will fail." ([SCG: All Flavor Is Made for Someone](https://articles.starcitygames.com/articles/all-flavor-is-made-for-someone/))
- **Place vs agent.** In MTG a *land* (place) is a resource with no will; a *creature* (agent) acts and dies; a *legendary* is a unique agent. Manzil's 28 mansions are places. A universe needs agents: the natural source is the **talismanic image** of each mansion (the Picatrix gives each manzil an image and a purpose **[domain]**), the nakshatra deities, and the Chinese xiù animals.
- **Lorcana's character method for an owned IP**: the same character appears in many versions named "Name – Subtitle," classed **Storyborn** (as in the film), **Dreamborn** (altered), **Floodborn** (reimagined; carries **Shift**, which evolves a same-named cheaper version). First set had seven Mickeys: two Storyborn, four Dreamborn, one Floodborn ([Cardgamer: Storyborn/Dreamborn/Floodborn](https://cardgamer.com/games/storyborn-dreamborn-floodborn-disney-lorcana/)). Miller on casting characters into inks: Winnie the Pooh as "a Sapphire wizard using honey magic" ([Checkpoint](https://checkpointgaming.net/features/2024/08/talking-the-magic-of-disney-lorcana-with-co-designer-ryan-miller)). Translation: *the 28 mansions are the recurring cast; each set re-casts them under a different sky.*
- **FaB's character method**: one hero per deck, young/adult versions (Aurora "starts with forty life as an adult"), classes as philosophies, equipment as the hero's body; **Living Legend** retires heroes that win too much ([Wikipedia](https://en.wikipedia.org/wiki/Flesh_and_Blood_(card_game))). A retirement rule is a *narrative* event the game produces for free.
- **"Printed once, never again."** Precedents: FaB's reprint policy — "A cold foil card included in a retail booster set will never be reprinted as a cold foil outside of the original set" ([LSS Reprint Policy](https://legacy.fabtcg.com/en/resources/rules-and-policy-center/reprint-policy/)); Riftbound — "we will never reprint an Overnumber that we've printed before with the same art and frame," while functional rarities are kept accessible: "Our goal with these functional rarities is to get players playing and deckbuilding as quickly and seamlessly as possible" ([Collectability in Riftbound: Origins](https://playriftbound.com/en-us/news/announcements/collectability-in-riftbound-origins/)). Both separate **print-once treatments** from **always-available functions**. Netrunner's LCG model is the opposite pole: fixed non-random packs that "virtually eliminate the secondary card market" ([Wikipedia](https://en.wikipedia.org/wiki/Android:_Netrunner)).
- **Set symbol identity**: each MTG set has an expansion symbol and a rarity-colored version; FaB and SWU do likewise **[unverified for exact practices]**. For Manzil the obvious analogue is a **date**: each set is the sky of a specific night, stamped on the card.

---

## 6. How big is a minimum viable launch pool?

| Game | Launch set | Cards | Rarity breakdown | Notes |
|---|---|---|---|---|
| Flesh and Blood | Welcome to Rathe (Oct 2019) | 226 (one LSS article says 225) | Common 132, Rare 48, Super Rare 15, Majestic 10, Legendary 5, Fabled 1 | 4 heroes/classes; per pack 4 generic + 7 class commons ([Wikipedia](https://en.wikipedia.org/wiki/Flesh_and_Blood_(card_game)), [First Look](https://legacy.fabtcg.com/en/articles/first-look-welcome-rathe/)) |
| Lorcana | The First Chapter (Aug 2023) | 204 + 12 Enchanted | Common 72, Uncommon 54, Rare 48, Super Rare 18, Legendary 12 (+12 Enchanted) **[order inferred — the fetched page listed these counts in reverse; verify]** | 6 inks → 34 cards per ink; 1 common of each ink per pack ([Mushu Report](https://mushureport.com/the-first-chapter-booster), [wiki](https://wiki.mushureport.com/wiki/Common)) |
| Star Wars: Unlimited | Spark of Rebellion (Mar 2024) | 252 | 18 leaders, 12 bases, 222 others; C/U/R/Legendary + Hyperspace variants to #435 | rarity counts not found ([Cardgamer](https://cardgamer.com/games/star-wars/star-wars-unlimited-card-list/)) |
| Sorcery | Alpha (May 2023) / Beta (Oct 2023) | 403 | Ordinary (4 per deck), Exceptional (3), Elite (2), Unique (1) — rarity *is* the deck limit | ([Wikipedia](https://en.wikipedia.org/wiki/Sorcery:_Contested_Realm)) |
| Riftbound | Origins (Oct 2025 global) | 298 + overnumbers | Common/Uncommon/Rare/Epic; Legends kept at Rare, Battlefields at Uncommon on purpose | ([Cardgamer rarities](https://cardgamer.com/guides/riftbound-card-rarities/), [Riot](https://playriftbound.com/en-us/news/announcements/collectability-in-riftbound-origins/)) |
| MTG (reference) | a modern Standard set | ~101 C + 80 U + ~60 R + ~20 M **[R/M counts approximate]** | | ([Nuts & Bolts #13](https://magic.wizards.com/en/news/making-magic/nuts-bolts-13-design-skeleton-revisited-2021-03-22)) |

Ratios that recur: **commons ≈ 35–60% of the set**; **rares+ ≈ 25–30%**; the top tier is tiny (5–12 cards). FaB is the outlier with 58% commons because a 60–80-card deck with 3-ofs needs a deep common pool.

For a game with 5-card hands and ~5 plays, the deck is tiny, so the pool can be smaller than any of these — but **not** 28. A pool must support (a) at least one full deck per pie slice, (b) a draft/limited mode, (c) hooks for set 2. A reasonable floor is **~150–180 functional cards**, i.e. the 28 mansions plus ~5× that in agents/events/talismans.

---

## 7. A card architecture for Manzil

Everything below is derived from the research above and from the game's own sky. Astrological structure is marked **[domain]**.

### 7.1 Pick the pie: five planets, with Sun and Moon as the neutral pool

Candidate axes and why they were or weren't chosen:

| Candidate | Divides 28? | Verdict |
|---|---|---|
| **7 classical planets** | 28 = 7 × 4. The Chinese xiù are traditionally assigned the seven luminaries in a repeating sequence, four mansions each **[domain]**. | **Primary pie.** Already in the game as the opponent's pieces (5 of the 7), so the sky and the player share one vocabulary — the mirror SWU achieves by giving leaders and units the same aspects. |
| 4 elements / triplicities | No: 12 signs ≠ 28 mansions; each mansion spans 12°51′, so elements fall unevenly **[domain]** | Reject as primary; keep as *flavor* on sign-level cards. |
| 4 lunar quarters | Yes: 7 per quarter **[domain]** | Use as the **tempo axis** (see 7.4), not identity. |
| 4 cultural skies | Not a division of the 28 — every mansion exists in all four | Use as **art/printing frames and set identity** (§7.6), never as a mechanical axis — mechanics would imply one culture is "better." |
| 4 Chinese quadrants / beasts (Azure Dragon E, Vermilion Bird S, White Tiger W, Black Tortoise N) | Yes: 7 per quadrant **[domain]** | **Secondary axis** (the SWU Heroism/Villainy slot): a "where" that crosses the planetary "how." Each mansion gets 1 planet + 1 quadrant; 7 × 4 covers all 28 exactly once. |
| 12 signs | No | Reserve for a later card type (Signs as "Omens", §7.3). |
| Day/night sect | Sun, Jupiter, Saturn diurnal; Moon, Venus, Mars nocturnal; Mercury either **[domain]** | **Tertiary modifier**, driven by the real clock: cards of the sect that matches the hour of play get a small bonus. |
| Dignities (domicile, exaltation, detriment, fall) | Per planet per sign **[domain]** | **The colored cost** (§7.4). |

**The five houses (colors) and their prohibition lists** — written in the Rosewater primary/secondary/never form:

| House | Philosophy | Primary (owns) | Never |
|---|---|---|---|
| **Saturn** | endurance, boundary, time | immunity to capture ("as long as"), delay triggers ("at dusk"), locking squares, high single faces | never moves cards; never gains tempo |
| **Mars** | force, severance | capture triggers ("whenever you capture"), face damage (−1 to neighbors), destroying talismans | never protects; never recovers from the discard |
| **Venus** | attraction, conversion | flipping captured cards back, bonding pairs ("if adjacent to a Venus card"), lore/score gain without capture | never destroys; never direct capture |
| **Mercury** | motion, information, exchange | swapping cards, rotating faces, peeking at the opponent's hand, "draw/replace" | never raises faces permanently; never locks |
| **Jupiter** | growth, amplification | counters, doubling dominion, "+1 to all your cards of X", growing over turns | never removes; never information |
| *Sun* (neutral) | dominion | generic cards any house can play; the dominion rule itself | — |
| *Moon* (neutral) | phase, change | generic cards keyed to the lunar quarter | — |

Ally/enemy wheel for pairing texture (so two-house decks have character): use the Chaldean order Saturn–Jupiter–Mars–(Sun)–Venus–Mercury–(Moon) **[domain]**; neighbors in the order are allies, opposite are enemies. With Sun/Moon neutral the five planets form a pentagon exactly like MTG's.

**Why five + neutral and not seven:** FaB's generic pool and Hearthstone's neutral cards show that a neutral pool lets every deck find its curve while the colored pool stays small enough to give each slice ~20 commons in a 150-card set. Seven slices at launch would starve each.

### 7.2 Deck keystone: the Ascendant

Every deck is led by one **Ascendant** card (SWU leader / Riftbound legend / FaB hero): a planet in a sign. It fixes the deck's **house** (its planet) and **quadrant** (from the sign's position **[domain mapping to be designed]**), gives the +2-style **off-house penalty** for splashing (SWU's soft lock rather than One Piece's hard lock, so next set's cards always have a home), and carries the one rules-text exception that makes the deck a *deck*. Ascendants are kept at the functional-rarity tier Riot keeps legends at ("we always want players to have access to the decks they want to play").

### 7.3 Card types (one grammar, five objects)

| Type | Place or agent | What it is | Why |
|---|---|---|---|
| **Mansion** (permanent, place) | place | the existing 28: two faces, one ability, dominion when on its own square | the land/battlefield; the recurring cast |
| **Figure** (permanent, agent) | agent | the talismanic image / deity / beast of a mansion; has faces and *acts*; may be **Legendary** (one copy, named) | the creature; the thing players love; Lorcana's "Name – Subtitle" lets one mansion have many Figures across sets |
| **Talisman** (permanent, attached) | object | attaches to a placed card; survives if the host is captured (modular equipment); +1 face, keyword, or a trigger | the compounding device; Picatrix is literally a talisman manual |
| **Aspect** (one-shot) | event | played in response to an event — a planet moving adjacent, a capture, a quarter change | the instant; the only card type that uses the event system both ways |
| **Omen** (permanent, global) | enchantment | "as long as" effects on the whole grid; the 12 signs live here | the static-ability home; keeps statics off Mansions and Figures so those stay trigger-driven |

Supertypes: **Legendary** (unique Figures), **Fixed** (the 28 Mansions — never reprinted functionally, only re-skinned), **Sect: Day / Night**.

### 7.4 Cost: Hours + Dignity

Two-speed cost, after Riftbound's energy/power split, built from systems that don't consume cards:

1. **Hours (generic cost)** — Snap/Hearthstone style: turn N gives N Hours; cards cost 0–5 Hours. In a 5-turn game this *is* the curve: a 5-cost Figure can only be the last play, a 1-cost Talisman can go anywhere. Unspent Hours carry over **only into Aspects** (Runeterra spell mana, cap 2) so passing has a reason.
2. **Dignity (colored cost)** — Sorcery threshold, read off the real sky: a card's house requirement is met when its planet is **in dignity tonight** (domicile/exaltation **[domain]**) *or* when the player has ≥N cards of that house on the grid. So some nights Mars cards are cheap and Venus cards expensive — the ephemeris becomes a rotating format, which is the "set" that reprints never could be.
3. **No card ever pays with a card.** Pitch and inkwell were rejected because one of five hands is 20% of the game.

Optional KeyForge layer for a "simple" mode: each turn declare a house; only that house's cards gain dominion this turn.

### 7.5 Trigger vocabulary (evergreen, max ~8; commons get one trigger and may affect one other card — NWO)

| Word | Rules meaning | Lenticular reading |
|---|---|---|
| **Rise** | when this is placed | the ETB; beginners see a bonus, experts sequence around it |
| **Set** | when this is captured | the death trigger — the single most lenticular trigger per Rosewater |
| **Transit** | whenever a sky planet moves adjacent to this | ties the ephemeris to events, not just position |
| **Conjunct** | as long as a card of the same house is adjacent (static) | the one static keyword; Venus primary |
| **Occult** | this card's faces are hidden until Set/Rise | information for Mercury |
| **Exalt N** | put N +1 counters on a card you control | the compounding counter; Jupiter primary, Saturn secondary |
| **Retrograde** | return a Set card to hand/grid | recursion; Venus/Moon |
| **At dusk / At dawn** | at the start/end of your turn | the delayed trigger; Saturn primary |

Ability words (italic, no rules text) group set mechanics by trigger: *Eclipse —* (when a sky planet is covered), *Syzygy —* (when three of your cards are in a line).

### 7.6 Collectible architecture

- **Cycles**: every set ships a 7×4 horizontal cycle (one Figure per planet per quadrant) and a vertical cycle per house (common Talisman → uncommon Figure → rare Legendary). The 28 Mansions are the permanent Basic-land cycle.
- **Sets are nights.** Each set is named for and stamped with a real date and its sky (set symbol = that night's Moon phase glyph); the four cultural skies are four **frames/treatments** (manzil / nakshatra / xiù / sukuyō) of the same card, à la Lorcana Enchanted or Riftbound Overnumber. This is where "printed once, never again" lives — on treatments and Legendaries — while functional Figures and Talismans stay reprintable in later nights with new art (FaB/Riot model).
- **Flavor text** is the mansion's traditional omen text (the Picatrix purposes, the nakshatra meanings) in the cultural voice of the frame; names are places (Mansions) and persons (Figures).
- **Familiarity law as lenticular design**: L1 prints full rules text; L4 prints only the keyword — the card literally becomes the expert's view.
- **Living Legend analogue**: a Figure that wins enough sanctioned nights is "fixed to the sky" — retired and re-issued as a Mansion variant.

### 7.7 Launch skeleton (target ~168 functional cards)

| | Saturn | Mars | Venus | Mercury | Jupiter | Sun/Moon neutral | Total |
|---|---|---|---|---|---|---|---|
| Mansions (Fixed) | 4 | 4 | 4 | 4 | 4 | 8 | 28 |
| Figures common | 6 | 6 | 6 | 6 | 6 | 6 | 36 |
| Figures uncommon | 3 | 3 | 3 | 3 | 3 | 3 | 18 |
| Figures rare/Legendary | 3 | 3 | 3 | 3 | 3 | 1 | 16 |
| Talismans | 4 | 4 | 4 | 4 | 4 | 6 | 26 |
| Aspects | 4 | 4 | 4 | 4 | 4 | 4 | 24 |
| Omens (12 signs + 4 quarters) | | | | | | | 16 |
| Ascendants | 1 | 1 | 1 | 1 | 1 | — | 5 (+ variants) |
| | | | | | | | **≈168** |

Rarity ratio ≈ 55% common / 25% uncommon / 20% rare+, inside the observed range. Three to five named mechanics per set, two "novel" archetypes out of ten pairings, the rest familiar — per Rosewater's novelty budget.
