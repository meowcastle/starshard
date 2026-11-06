# MANZIL-TCG.md — the ground-up rebuild

**6 October 2026.** Manzil re-founded as a trading card game. Built on four research runs
this session (`research/tcg-battlefield.md`, `tcg-cards.md`, `tcg-formats.md`,
`print-once.md`), two live watches of MTG Arena (`research/ARENA-LESSONS.md`), the August
simulation work (`research/manzil-randomness.md`), and the canon in `COSMOLOGY.md` and
`SHARD-MODEL.md`. Nothing here is built or simulated yet. It is a foundation to argue with,
then to sim, then to build.

The order is yours: what Manzil is → the arena → the cards → the permutations → the print
policy → the universe and the person holding the cards.

---

## 0. What Manzil is

Four old maps of one sky — Arabic manāzil, Indian nakshatras, Chinese xiù, Japanese sukuyō —
agreed to divide the Moon's road into twenty-eight houses. Manzil is a card game played on
that road, against the real sky, tonight. Your opponent's pieces are where the planets
actually are. Your deck is drawn from your own birth sky. Every card is a place or a power
those four cultures named, and every night the game is different because the world is.

That last sentence is the whole thesis and it is the thing no other card game can say. The
August research proved the current ruleset does not earn it: the opening is solved, the board
narrows, cards act once, and the sky is decoration on a Triple Triad clone. **The rebuild's job
is to make the sentence true mechanically.**

The one measure from `SHARD-MODEL.md` carries over whole: everything is ranked by how rare it
is, in bits. A card's night, a deck's legality, a Night Edition's number — all of it can be
computed from the ephemeris and none of it has to be asserted.

### What the simulations and the Arena watch told us, in one table

| Manzil today | Arena | the fix lives in |
|---|---|---|
| option space **narrows** every placement (9 slots, 5 plays) | **widens** every turn (one land per turn) | the arena (§1) |
| every card costs the same | a curve: cheap early, expensive late | the cost system (§2.4) |
| a card acts once, at placement, then is a number | permanents compound (a 2/2 became a 12/10) | card types and triggers (§2.3, §2.5) |
| commitment is unilateral | combat is two-sided and simultaneous | the veil and the retrograde (§1.3) |
| outcome bounded by nine slots | unbounded (46 damage in a turn) | scoring (§1.1) |
| 28 cards, ~10⁵ hands, solved openings | 10³² decks, formats, drafts | permutations (§3) |
| the sky is skin | — | the sky as engine (§1.1, §2.4, §3) |

---

## 1. The arena

### 1.1 The Moving Sky

**Keep the road. Make it move.**

Nine mansions are visible at once, drawn in true order from the ring of twenty-eight,
starting from wherever the Moon stands tonight. At the end of each full round the leftmost
mansion **sets**: whoever holds it banks it, and the next mansion in the real sequence
**rises** on the right — with whatever planet the ephemeris says is standing in it already
there. The road never fills. The night ends when the Moon has crossed a set number of mansions
(a *watch*), or when a player reaches a point target.

What this does, against the four defects:

- **Widens.** The slot count is constant, so the option space never collapses. You are always
  choosing among nine places, not among the two left over.
- **Compounds.** A card does not score when it is placed; it scores when its mansion sets,
  turns later, if you still hold it. Holding ground across rounds is worth something.
  Recapturing a card the round before it sets is a real counter.
- **Raises the ceiling.** Points banked over a night are unbounded by nine. A dominant board
  earns more than a narrow one, so blowouts and comebacks both exist.
- **Uses the sky.** This is the only architecture in the research that makes the ephemeris
  the *engine* rather than the wallpaper. The next mansion to rise, and the planet already in
  it, are facts about tonight. The game is literally the Moon's motion.

It also answers the biggest finding from the Arena watch directly: the road widens because the
sky keeps arriving.

### 1.2 Occultation — the second axis

A card may be placed on an **occupied** mansion if its elevation is higher (the elevation law
already in CLAUDE.md, promoted from tiebreak to mechanic). The lower card is **occulted**:
inert but still owned. When the upper card is captured, the lower one is uncovered and
re-resolves its captures as if just placed.

So nine slots never close, a card can act more than once, stacks have history, and a single
capture can swing two or three cards. Elevation becomes the game's second number, which is
what the elevation law was always reaching for. Risk: elevation dominance — the elevation
distribution needs to be flat enough that low cards keep a role (they are good *first* on a
slot, to be covered by friends). That is a sim question, not a design question.

### 1.3 The veil and the retrograde — two-sided commitment

Two additions that give the opponent a say in your move, with no new phase:

- **The veil.** Each player may hold one card face-down on the road. It reveals and resolves
  when a neighbour is placed beside it, or when its mansion sets. A hidden answer.
- **The retrograde.** Two per night. When the opponent places a card, spend one to flip which
  of its numbers faces which way *before* captures resolve. A reaction window.

This is the minimum two-sided layer, and it is what Arena's combat does: the attacker commits,
the defender gets to answer, neither controls the outcome alone. It also closes the August
loop — simultaneous commitment scored the highest night-to-night variety number in the whole
randomness study (29.7 against 18.0 shipped) and I could not model it. The veil is the cheap
form of it. Both words are exact astronomy.

### 1.4 What is retired, and what survives

Retired: the full board as the end condition; the fixed five as the deck; the sky as five
static planets; best-of-five boards as the match shape (a *night of N watches* replaces it).

Survives untouched: the two faces and the facing-number capture (this is Manzil's signature
and every option that removed it was ranked last); ties flip and cascade; dominion; the
elevation law; the 28 epithets; the walkers' road as the on-ramp; the ethics floor.

**The composite — Moving Sky + Occultation + Veil/Retrograde — is the recommendation.** The
Rising Road (a road that only grows) was already proven in testing but still fills, so the
ending is the same forced endgame, later. Three Watches (Snap on a road) is the best pure
two-sided option but needs simultaneous turns and fixes neither compounding nor the ceiling;
it is the right *format* (§3), not the right base.

---

## 2. The cards

### 2.1 The pie: five planets, with Sun and Moon neutral

A pie is a prohibition list with a frequency dial. Manzil's is already on the table — the sky
plays five planets, so the player's cards should speak the same five words. Seven classical
planets divide 28 exactly (7 × 4, as the Chinese xiù assign the luminaries in a repeating
sequence); Sun and Moon become the neutral pool so the five colored slices each get enough
cards at launch.

| house | philosophy | owns | never |
|---|---|---|---|
| **Saturn** | endurance, boundary, time | immunity to capture, delayed triggers, locking a mansion, high single faces | moves cards; gains tempo |
| **Mars** | force, severance | capture triggers, face damage to neighbours, destroying talismans | protects; recovers |
| **Venus** | attraction, conversion | flipping captured cards back, bonded pairs, scoring without capture | destroys; direct capture |
| **Mercury** | motion, exchange, information | swapping, rotating faces, peeking, replacing | raises faces permanently; locks |
| **Jupiter** | growth, amplification | counters, doubled dominion, growing over rounds | removes; information |
| *Sun* (neutral) | dominion | the dominion rule itself; generic cards | — |
| *Moon* (neutral) | phase, change | cards keyed to the lunar quarter | — |

The Chaldean order gives the ally/enemy wheel for free — neighbours in the order are allies,
opposites are enemies — so two-house decks have texture exactly as MTG's pentagon does.

**The second axis is the four Skies.** `COSMOLOGY.md` left them open: "stations 1–7, 8–14,
15–21, 22–28… name them as the four reaches of the voyage." The research lands on the Chinese
quadrants — Azure Dragon (east), Vermilion Bird (south), White Tiger (west), Black Tortoise
(north) — seven mansions each, which is exactly the open slot and exactly the SWU
heroism/villainy move: a *where* crossing the planetary *how*. Every mansion gets one planet
and one Sky; 7 × 4 covers all 28 once. The quadrant-spirits COSMOLOGY asked for are already
the quadrant beasts.

**What is not an axis:** the four cultural skies. Every mansion exists in all four; making them
mechanical would say one culture is better. They are **frames** — four art treatments of the
same card (§4).

### 2.2 The keystone: the Ascendant

Every deck is led by one Ascendant — a planet in a sign. It fixes the deck's house and Sky,
applies a soft off-house penalty for splashing (SWU's +2, not One Piece's hard lock, so every
future card has a home), and carries the one rules exception that makes the deck a *deck*.

**And it is personal.** Your Ascendant is read from your own chart: the Moon's mansion at your
birth, or the planet ruling it. That is the Commander move — the keystone is a *person* players
bond with — and in Manzil the person is you. Deck legality derives from your birth sky. No two
travelers start with the same legal pool. This is where "personalize everything" becomes a
rule rather than a skin.

### 2.3 Five card types, one grammar

| type | is a | role | what it fixes |
|---|---|---|---|
| **Mansion** | place | the existing 28: two faces, one ability, dominion on its own square | the basic land; the permanent cast |
| **Figure** | agent | the talismanic image, deity or beast of a mansion; has faces and *acts*; may be Legendary | the creature; the thing people love; one mansion can have many Figures across sets |
| **Talisman** | object | attaches to a placed card and survives its capture; +1 face, a keyword, or a trigger | the compounding device — Arena's Buster Sword |
| **Aspect** | event | played in response: a planet moving adjacent, a capture, a mansion setting | the instant; the only type that uses the event system both ways |
| **Omen** | global | "as long as" effects on the whole road; the 12 signs live here | keeps statics off Mansions and Figures so those stay trigger-driven |

Supertypes: **Legendary** (unique Figures), **Fixed** (the 28 Mansions — never changed
functionally, only re-framed), **Sect: Day / Night** (a small bonus for the sect matching the
real hour of play).

The 28 signatures Design shipped in August are not lost. They become the Mansion cards'
abilities — the basic-land cycle — and the research's note on them stands: nearly all are
static conditions. The triggered design space moves to Figures.

### 2.4 Cost: Hours and Dignity

Two things the research was unanimous on: with roughly five plays a game, **cost must never
consume a card** (pitch and inkwell are 20% of the game per card); and a game this short needs
a Snap-style turn-indexed curve.

1. **Hours** (generic). Round N grants N Hours. Cards cost 0–5. A 5-cost Figure can only be the
   last play of a watch; a 1-cost Talisman fits anywhere. Unspent Hours carry over only into
   Aspects, capped at two, so passing has a reason.
2. **Dignity** (colored). A card's house requirement is met when its planet is **in dignity
   tonight** — domicile or exaltation, read off the real sky — *or* when you hold enough cards
   of that house on the road. Some nights Mars is cheap and Venus is dear. **The ephemeris
   becomes a rotating format**, which is what a print-once game can never get from reprints.

Together these give the arc the Arena watch found missing: cheap cards and expensive cards
exist, the first play is small, the last play is large, and *which* cards are cheap changes
with the sky.

### 2.5 Eight triggers, one static

Rosewater's lenticular principle: depth lives in triggers, and the single most lenticular
trigger is the death trigger. The familiarity law — a card that sheds its text as it levels —
is lenticular design made physical: L1 prints the full rule, L4 prints only the keyword.

| word | rules | reading |
|---|---|---|
| **Rise** | when this is placed | the ETB |
| **Set** | when this is captured, or its mansion sets | the death trigger |
| **Transit** | whenever a sky planet moves adjacent | the ephemeris as events, not just position |
| **Conjunct** | *as long as* a same-house card is adjacent | the one static; Venus primary |
| **Occult** | faces hidden until Rise or Set | Mercury's information |
| **Exalt N** | put N counters on a card you hold | the compounding counter; Jupiter |
| **Retrograde** | return a Set card | recursion; Venus, Moon |
| **At dusk / at dawn** | at the start / end of your round | the delayed trigger; Saturn |

Ability words, italic and ruleless, group set mechanics by trigger: *Eclipse —*, *Syzygy —*.
Commons get one trigger and may affect one other card — New World Order's budget, which is
how 28 Mansions stay readable while Figures get to be clever.

### 2.6 Launch skeleton

About 168 functional cards, inside the range of every modern launch (Lorcana 204, FaB 226, SWU
252): 28 Fixed Mansions; 70 Figures across three rarities; 26 Talismans; 24 Aspects; 16 Omens
(the twelve signs and four quarters); 5 Ascendants. Roughly 55% common, 25% uncommon, 20%
rare and legendary. Three to five named mechanics a set; two novel archetypes out of ten, the
rest familiar — the novelty budget Wizards actually uses.

---

## 3. The permutations

The honest count first: 28 cards is about 10⁵ hands. A 260-card Magic set is 10³². Manzil
cannot get its variety from pool size and should stop trying. **It gets it from three other
sources, and the research says those are the ones players love anyway: the sky, authored
rules, and identity.**

Commander's lesson, stated plainly, is that the most popular format in the most successful
card game ever was *made by players*, fits in one sentence, solved a problem the publisher
ignored, and never expired — and that its keystone is a person. The player-made formats that
died (Tiny Leaders, paper Brawl) died because small pools were solved in weeks. That is the
exact failure the August sims found in Manzil, and the ladder below is built so that no single
rung can be solved for long.

| # | format | the one rule | for | variation from |
|---|---|---|---|---|
| 0 | **Tonight's Sky** | her hand is the real sky at your location; one of 28 night rules is in force, chosen by the Moon's mansion | everyone, every night, three minutes — the front door | the world |
| 1 | **The Sky's Temper** | the night rule plus a weather rule from the week's aspects (Mercury retrograde = Order, Full Moon = All Open, eclipse = Reverse) | daily players wanting a longer puzzle | ~378 rule pairs |
| 2 | **Ascendant** | your natal Moon mansion is your commander — always available, returns when captured; N singletons legal to your chart | the core community; the format people build identity around | asymmetry: 28 commanders × chart-derived pools |
| 3 | **House Rules** | Ascendant with an agreed bracket and a short opt-in list of mansions | playgroups | the social contract |
| 4 | **Conjunction** | Ascendant, no contract, one fixed sky per season, ranked | competitive; the one you balance for | skill; the seasonal sky resets the solution |
| 5 | **Sealed Night** | nine random mansions plus your Moon; build five | new players, events | C(28,9) ≈ 6.9M pools |
| 6 | **Draft the Sky** | pick alternately from the night's twelve visible mansions, face up; the leftovers become the sky | groups of two to four; the purest skill test | the pool plus intent |
| 7 | **The Year** | 28 consecutive nights with one commander, each night authored, relics accrue | solo; the monetisable spine | progression plus the real sky |

Four principles from the research, all of which the August night-rules work already obeys:
every rule is one sentence; vary on different axes (information, ownership, order, scale,
capture logic, chaining) rather than six flavours of one; **rotate identity before rotating
cards** — with 28 you cannot ban, but you can retire a dominant Moon for a season, FaB's Living
Legend; and publish the social contract before the competitive scene exists, because Commander
in September 2024 is what happens when prices arrive before governance.

FFXIV's Triple Triad — fifteen stackable one-sentence rules across two ownership layers,
per-opponent and daily-regional — is the direct template for the 28 night rules and the
walkers. It is also the closest ancestor to Manzil, and it is a warning: Triple Triad survives
on collection and rule variants, not depth. Rungs 2 through 6 exist so Manzil does not.

---

## 4. The print policy

**Scarcity lives in the edition, never in the game piece.**

The Reserved List is what "never reprinted" does to a game over thirty years: a format nobody
can afford to enter, a design space nobody can touch, proxies as the real economy, and a $999
non-legal reprint as the logical endpoint. Wizards' own former staff describe it as a
reliance trap they cannot escape, and Rosewater has said he spent years trying. MetaZoo sold
scarcity as the pitch and collapsed in January 2024. Pokémon printed 85 billion cards and still
cannot meet demand. Lorcana reprinted, kept its players, and lost its speculators — which is
the trade you want.

What the games that handle print-once *well* share: the function is always available and the
**treatment** is what is closed. FaB will never reprint a cold foil outside its set; Riot will
never reprint an Overnumber with the same art and frame; both keep every rules-bearing card in
reach. KeyForge is literally print-once and no card is scarce. That is the model.

### Canon and Night Editions

1. **Canon.** Every rules-bearing card exists as the Canon printing: earnable through play,
   purchasable at a fixed posted price, never random, reprintable forever. The Kickstarter
   deck is the Canon printing and says so in its first sentence.
2. **Night Editions.** For each mansion night in a year — *Al-Sharatān, 14 March 2027* — a
   Night Edition of that card exists. Rules-identical to Canon. It differs only in the date,
   the actual ephemeris of that night rendered on it, a stamp, a sequential number, and
   **its rarity in bits** — the `SHARD-MODEL` measure, printed. Digital Night Editions go only
   to accounts that played that night; physical ones are printed in exactly the quantity
   claimed in a posted window after the night, then the plate closes. The window is a fact
   about the calendar, not a promise about value.
3. **How you get one.** Play on the night, free. Attend a sanctioned table. Or order the
   physical print during the window at the posted price. No lottery, no pack, no currency, no
   streak. Missing a night costs nothing in play.
4. **Rotation by sky.** If a format needs retirement, a *year* of Night Editions sets on a
   published astronomical schedule while Canon stays legal everywhere. Nothing is banned for
   value. Errata applies to Canon and every Night Edition carries it.
5. **The 2010 lesson inverted.** Reserve in writing the right to issue Night Edition *art* in
   non-card forms later, and damage replacements marked REPLACEMENT. The edition is closed; the
   image is not — the distinction photography settled in court.

### What the promise says

> Every card you need to play Manzil will always be available at a fixed price, and may be
> reprinted at any time. Night Editions record a real sky on a real date. Each one is issued
> only to people who played on that night or ordered it in the posted window after; once the
> window closes the number is final and published. Night Editions are identical in play to the
> standard card. We will never issue a Night Edition after its window, and we will never sell
> cards by chance.

### What it never says

"Never reprinted," unqualified. "Limited," "rare," "collectible," "investment," any resale
figure, any countdown. "First Edition" against "Unlimited" — LSS dropped it because it makes
the ordinary card the lesser one. Anything about future editions being scarcer. Anything that
binds a balance decision to a card's price.

**The tension, named.** Artificial scarcity is a monetisation pressure because the thing sold
by scarcity is a price. This model refuses to sell a price. It sells **attendance**: proof you
were under that sky. It is the only form of scarcity in the survey players have read as honest
across thirty years, and it happens to be literally true for a game about the Moon. It is also
the only one that fits the ethics floor without an asterisk.

---

## 5. The universe, and the person holding the cards

`COSMOLOGY.md` already has the bible: the Great Sowing, the Silverway, the Moonroad as Earth's
leg of it, Recollection as the collecting verb, the five traveler types, the 28 epithets, and
the law that the story is revealed and never told. The TCG does not need a new universe. It
needs the existing one to show up on cardboard.

**Places and agents.** The 28 Mansions are places and the recurring cast. Agents come from
what the four skies already put in each house: the talismanic image, the nakshatra deity, the
xiù animal. Al-Qalb, the Heart, carries Antares, Jyeṣṭhā's amulet, and the fox of 心 — three
Figures from one mansion, each a different card, each a Night Edition's art on a different
year. Lorcana's "Name – Subtitle" method, applied to a cast four cultures wrote for us.

**Four frames.** Every card can be printed in the manzil, nakshatra, xiù or sukuyō frame — the
same rules, the four names, that tradition's voice in the flavor text. The frame is the
treatment, which is where print-once lives, and it is the one place the four skies are allowed
to differ.

**Sets are nights.** A set is named for and stamped with a real date; its symbol is that
night's Moon phase. Cycles come free: one Figure per planet per Sky each set (7 × 4), and a
vertical cycle per house. The Mansions are the basic-land cycle that is always there.

**The vocabulary law applies.** `COSMOLOGY.md` §2: one new noun per surface, and it must name
something astrology has no word for. Almost everything in this document passes that test
because it *is* astrology's word — aspect, dignity, retrograde, occultation, transit,
exaltation, ascendant, talisman, sect, conjunct. The ones that are not — *Hours* as a cost
name, *Night Edition*, *Figure*, *Omen*, the four Sky names — are tier-gated and need the
sorting rule applied before they reach a traveler.

**The personalization is structural, not decorative:**

- Your **Ascendant** is read from your chart. Deck legality is your birth sky.
- Your **Night Editions** are the nights you were there.
- Your **traveler type** — Seedborn, Homebound, Outbound, Emberwake, Farbank — is the natural
  home for the five launch Ascendant variants.
- Your **Recollection** is the collection: each mansion walked returns a piece of your shard,
  and now that piece is a card.
- The **familiarity law** means your cards look different from everyone else's as you learn
  them, and a Night Edition at L4 is almost pure art — the expert's view, printed.

---

## 6. What this changes from the August work

| August decision | status under the rebuild |
|---|---|
| dealt five from a drafted twelve | **subsumed** — the deck grows to a real deck with a curve; the deal becomes an opening hand |
| re-baseline at L3; levelling never touches numbers | **survives** — levels carry the familiarity law and nothing else |
| all 28 signed | **survives** as the Mansion abilities; triggered design moves to Figures |
| difficulty = her reading depth | **survives** for the walkers; the sky's strength is now also *which* planets stand in the rising mansions |
| nine-rung walkers' road | **survives** as the on-ramp to Tonight's Sky |
| 28 night rules as variety, not fix | **promoted** — they are format 0 and the Temper |
| the Moonstone waits for the deal | **waits for Moving Sky** — a scored night with uncertainty is where a stake mechanic finally has something to bet on |
| ethics floor: skill-gating clause lifted | **unchanged**; the print policy adds the one thing the floor was missing |
| the sim bands (careful 55–65, casual 35–45, gap 20+) | **carry over** as the targets for the new engine |

---

## 7. What to decide, and what to sim before building anything

**Decide:**

1. The composite arena — Moving Sky + Occultation + Veil/Retrograde — or a subset. My
   recommendation is all three; the research ranked them first, second and "add to whatever
   wins."
2. Five planets plus Sun/Moon neutral as the pie, and the four quadrant beasts as the Skies.
   This also closes COSMOLOGY's open item.
3. The Ascendant read from the chart — the commander is you. This is the decision that makes
   the game unforkable from the astrology app, and it should be made knowingly.
4. Canon plus Night Editions as the print policy, with the promise worded as above.
5. Which of the new nouns pass the vocabulary law, and which get retired before they ship.

**Sim, in this order, against the carried-over bands:**

1. Moving Sky alone, against the current 28 at their shipped numbers. Does the opening book
   die? Does careful land in band? What is the right watch length?
2. Add Occultation. Find the elevation distribution at which low cards still have a role.
3. Add the veil and two retrogrades. Measure the skill gap — this is the one the August agent
   could not model, and the engine needs a bluffing opponent before the number means anything.
4. Hours and Dignity on a prototype pool of ~40 Figures. Does a curve appear? Does the
   ephemeris actually rotate which houses are cheap, night to night?
5. The exploit scan on every configuration above, with the vectors run first.

The engine from August (`manzil_v6.py`, 33/33 conformant) is the base to extend. The
battlefield change is the first thing to write, because every other number depends on it.
