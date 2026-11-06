# Archetypes, deck plans and posture profiles for the Standard pilot (research, 13 Oct 2026)

Doc: https://claude.ai/code/artifact/705a9b75-311b-4c9c-9ce3-ad8aaa778b86

## The taxonomy: strategy and plan

A Standard deck is described on two levels, and the pilot needs both. **Strategy** is the role it takes against most of the field (aggro, midrange, control, combo, with tempo and ramp as the two common hybrids). **Plan** is what the cards are actually doing to win, and it is the level that tells a pilot what to hold, what to deploy and what to answer. Two aggro decks with different plans (go-wide with anthems; one evasive threat protected) mulligan, attack and sideboard differently; two decks with the same plan in different colours play almost alike. The strategy level is what the sim's `style.kind` already guesses; the plan level is new.

The current meta decks placed, from Karsten's September 2026 Metagame Mentor (400+ winning lists, 18–31 Aug 2026; https://www.magic.gg/news/metagame-mentor-the-top-standard-decks-for-september-2026s-rcqs) and the sim's own Oct 12 Goldfish top 12. Shares are Karsten's winner's-share figures where he gives them.

| Deck | Share | Strategy | Plan | What it is doing |
| --- | --- | --- | --- | --- |
| Mono-Green Landfall | 27.8% | midrange (fast) | landfall engine | Several plans in one list: fast Chocobo starts, turn-four Harmonizer, long games on Sapling Nursery and Ba Sing Se; Escape Tunnel and Fabled Passage with Icetill Explorer for repeated landfall. Little interaction |
| Dimir Midrange | 12.1% | midrange | disrupt and clock | Cheap evasive creatures backed by removal, discard and counters; Enduring Curiosity and Kaito for card advantage |
| Izzet Spellementals | 10.8% | tempo / spells | spells-matter, graveyard sweeper | Cheap cantrips and interaction; Eddymurk Crab and Hearth Elemental fill the yard and make Sunderflock a one-sided reset |
| Selesnya Landfall | 4.0% | midrange | landfall engine + instant answer | Mono-Green with Erode as an instant that also triggers landfall; Dyadrine for cards |
| Azorius Momo | 3.3% | aggro | go-wide fliers, lifelink | Turn-one Momo, Springleaf Drum, Sage of the Skies; a flying lifelink force with anthems |
| Four-Color Control | 3.3% | control | removal, sweepers, draw into a finisher | Tablet of Discovery into Jeskai Revelation, chained with Flashback |
| Mardu Discard | 3.0% | aggro / combo | discard-as-value | Iron-Shield Elf and Hardened Academic turn discard into growth and damage; a turn-three kill exists |
| Dimir Excruciator | 2.9% | midrange with a combo finish | library attack | Doomsday Excruciator sets both libraries to six; Restless Reef forces the empty draw. Interaction until then |
| Azorius Artifacts | 2.9% | midrange | artifacts synergy | United Battlefront finds cheap artifacts; Simulacrum Synthesizer makes Constructs; Snare, Starcage, Reliquary interact |
| Orzhov Life Gain | 2.5% | midrange | lifegain engine | Hinterland Sanctifier, Case of the Uneaten Feast, Haliya, Lunar Convocation turn life into cards and bodies |
| Mono-Black Aggro | 2.3% | aggro | menace beats + reach | Nighthowl Pursuer, Desolation Prowler, Gollum; direct damage to finish |
| Izzet Aggro / Prowess | 2.1% | aggro | spells-matter beats | Prowess bodies pumped by cheap spells; burn as reach |
| Boros Dwarves | 1.5% | aggro | go-wide tribal | Cheap dwarves and payoffs; the widest board in the format |
| Boros Mobilize / Boros Dragons | 1.5% / <1% | aggro | go-wide tokens / fliers | Mobilize tokens; Dragons attack over ground blockers |
| Bant Airbending | 1.5% | combo | fast combo | Assembles its pieces and wins in one turn; exploits Landfall's thin interaction |
| Azorius Control | 1.1% | control | counters, instant removal, card advantage | The classic draw-go shell: hold answers, win late |
| Jeskai Artifacts | 1.0% | midrange | artifacts synergy | As Azorius Artifacts with red reach |
| Jund Sacrifice | <1% (in the sim's top 12) | midrange | sacrifice engine | Fodder and sacrifice outlets into drain and value |
| Temur Omniscience | 1.0% | combo | fast combo | Cheats Omniscience into play and wins the same turn |

**The plan list the classifier needs**: go-wide (tokens, tribal, anthems); go-tall (one protected threat); evasive beats (fliers, menace); burn and reach; spells-matter (prowess, cantrip-dense); landfall engine; sacrifice engine; lifegain engine; artifacts synergy; graveyard value; discard-as-value; disrupt-and-clock; counters-and-card-advantage (draw-go control); sweepers-into-finisher (tap-out control); fast combo; library attack; ramp-into-haymakers. Seventeen plans cover every named deck above and every "other" deck Karsten lists. A deck can carry two (Landfall is engine + go-wide; Excruciator is disrupt-and-clock + library attack); a two-plan deck gets the primary plan's profile with the second's finisher rule.

Karsten's matchup remarks are the first test data: Spellementals slightly favoured against Landfall; fast combo (Omniscience, Airbending) exploits Landfall's thin interaction; fliers get over its ground blockers; sweeper control with answers to Nursery and Ba Sing Se out-grinds it; Dimir Midrange poorly placed against both; Life Gain poor against Landfall. The sim's Oct 12 run already has Spellementals as the #1 deck at 51% against the field, the right neighbourhood.

## Card function tags

Scryfall's community Tagger maintains functional "Oracle tags" on every card, searchable as `otag:` / `oracletag:` / `function:` (https://scryfall.com/docs/syntax): removal, counterspell, board-wipe, card-draw, ramp, burn, lifegain, tutor, discard, reanimation, mana-rock, token-generator and several hundred finer ones. The sim already talks to Scryfall; one more query per card at import gets its tags. Coverage on a card released this month can lag by days to weeks, so the tags need an Oracle-text fallback for the dozen functions that matter most to the pilot. (Scryfall is not reachable from the research session's network; Code should measure coverage on the top-20 lists.)

**The tag set** (each one changes a decision):

| Tag | Means | Decided from | Why the pilot cares |
| --- | --- | --- | --- |
| `threat` | a permanent that wins if unanswered: creature, planeswalker, or an engine | type + P/T or loyalty; `engine` from text ("whenever", "at the beginning of") | What to deploy; what the opponent must answer |
| `threat.evasive` / `.wide` / `.tall` | flying, menace, unblockable; makes tokens; grows or is protected | keywords, text | Attack posture, which blocks matter |
| `answer.instant` / `answer.sorcery` | destroys, exiles, bounces, or counters | `otag:removal`, `otag:counterspell`, instant vs sorcery, flash | Hold at instant speed or fire on my turn |
| `answer.target` | creature, noncreature, any permanent, spell | text ("target creature", "target nonland permanent", "counter target") | Which threat it can hit; the unanswered-permanent rule |
| `sweeper` | hits all or many creatures | `otag:board-wipe`, text | Timing against go-wide; what go-wide must play around |
| `card-advantage` / `selection` | draws two or more, or looks and chooses | `otag:card-draw`, text (draw two, look at the top, surveil, scry) | End-step spending; grind posture |
| `reach` | damage or life loss to players | `otag:burn`, text ("any target", "target player") | Aggro's finishing math; what control must stay above |
| `protection` | counters or protects my own threat | hexproof, ward, "return to hand", own-spell counter text | Go-tall posture |
| `mana` / `ramp` | extra lands or mana | `otag:ramp`, `otag:mana-rock`, land search | Curve assumptions; land count against Karsten |
| `engine.<kind>` | landfall, sacrifice, lifegain, artifacts, spells-matter, graveyard, discard | trigger text | Which plan the deck is; what the opponent should answer first |
| `finisher` | ends the game from a stable board | hand-curated per meta deck; else `threat` with MV ≥ 5 | Control's clock; when to stop holding |
| `combo-piece` | part of a known combo | hand-curated per format | Combo pilot: assemble and protect; opponent: what to counter |

`finisher` and `combo-piece` are a short curated list kept with the meta snapshot the way `deck-classes.js` is today.

**From tags to a deck profile.** Sum over the 60 and the 15: threat count and curve, interaction count split instant/sorcery and by target, sweeper count, card-advantage count, reach total, engine kind and piece count, land count and colour sources against Karsten, average mana value, one-drop count. Twelve numbers plus the engine kind. The classifier maps the vector to a plan (nearest meta deck, engine tag as a hard key); the coach reads it for what is missing. First check (an hour): tag the top 20 meta lists and see each lands on the plan a human would name; where one does not (Excruciator reads as disrupt-and-clock until `combo-piece` marks Excruciator and Reef), the curated lists are the fix.

## Reading a brew

**What plan is this?** The engine tag decides when there is one. Without one, the numbers: 20+ creatures, average MV under 2.3 and reach is aggro (go-wide if tokens or cheap bodies, evasive if fliers/menace); 8+ instant-speed answers and fewer than 10 threats is draw-go control; sweepers and sorcery-speed answers, tap-out control; 10–16 threats with 8–12 answers is midrange, disrupt-and-clock if the threats are evasive and the answers include discard or counters. Two or more `combo-piece` cards is combo. The nearest meta deck is named on the page ("your list reads as go-wide aggro, closest to Boros Dwarves"), and the sideboard plans and calibration prior for a brew start from it instead of from nothing.

**What is missing for that plan?**

| Plan | Threats | Answers | Lands (60) | Also expects | A common hole |
| --- | --- | --- | --- | --- | --- |
| go-wide aggro | 24–28 creatures, 12+ one- and two-drops | 0–4, cheap | 20–22 | anthems or a width payoff; some reach | no plan against a sweeper; 24 lands |
| evasive / go-tall aggro | 16–22 | 4–8 | 21–23 | protection or haste; reach | no way through a single big blocker |
| spells-matter (tempo) | 8–14 payoff bodies | 10–16 cheap instants, cantrips | 20–22 | 8+ cantrips; a graveyard or cost payoff | too few payoffs for the spell count |
| disrupt-and-clock midrange | 10–16, evasive | 8–12 incl. discard or counters | 24–26 | 2–4 card-advantage pieces | no card advantage |
| engine midrange | 12–20 incl. 8+ engine pieces | 4–8 | 22–26 (landfall 26–28) | enablers:payoffs about 2:1 | payoffs without enablers, or the reverse |
| draw-go control | 4–8 finishers | 10–14 instant-speed, 2–4 sweepers | 26–27 | 4–6 card-advantage; noncreature answers | no answer to planeswalkers or enchantments |
| tap-out control | 6–10 | 8–12 sorcery-speed, 3–4 sweepers | 25–27 | a finisher that wins alone | too few finishers |
| fast combo | the pieces | 4–8 protection or counters | 20–24 | 6+ selection or tutors | no protection, no backup plan |
| ramp | 6–10 haymakers | 4–6 | 24–26 + ramp | 8+ ramp pieces | no early defence |

**Will it function?** Karsten colour sources (live) against the plan's land count; dead cards weighted by whether they are engine pieces; curve against the plan; reach against the plan. Each check is one row on the Deck tab's facts line or one coach option, worded as a player would: "Boros Dwarves runs 20 lands; you have 24."

**What to test.** The nearest meta deck's worst matchups first; the plan's known weakness as a second ranking when the run is short; then Compare, one change, same field, same pilot.

## Posture profiles: how each plan is piloted

No dataset of professional Standard games exists (Arena logs are private; 17lands covers Limited), so "how a pro plays this" comes from the written strategy canon. Its spine is Flores' role question, "Who's the Beatdown?" (1999, https://articles.starcitygames.com/articles/whos-the-beatdown/) and his eight principles (2012, https://articles.starcitygames.com/articles/eight-core-principles-of-whos-the-beatdown/): in every matchup one deck is the beatdown and the other the control; role is decided by relative speed, damage, removal and inevitability; it changes on the play versus the draw and as the game develops; misassigning it is how good decks lose.

A **profile** is a small object the bridge pilot reads for a seat: role by opposing plan, mulligan rule, deploy-or-hold rule, attack/block posture, timing rules, end-step spending, sideboard priorities. The reactive pilot that moved Azorius from 16% to 25% is the first third of the draw-go profile; the three decks it hurt are decks whose profiles say deploy.

| Plan | Role against | Mulligan keeps | Deploy or hold | Attack and block | Timing rules | Sideboard priority |
| --- | --- | --- | --- | --- | --- | --- |
| go-wide aggro | beatdown vs everything except faster aggro; control only vs slower combo-less decks when behind on board | 2–4 lands with 2+ plays by turn 2; ship 5-landers and hands with no one- or two-drop | deploy on curve; hold only a pump or anthem until blocks | attack with everything that survives the predicted block; never chump; block only when the race is lost | play around a sweeper only when the opponent's plan has one and mana is open: deploy two, hold the rest | out: top end; in: anti-sweeper, protection, one-drops on the play |
| evasive / go-tall | beatdown vs midrange and control; control vs go-wide (block, race in the air) | 2–4 lands, one threat, one protection or answer | one threat at a time with protection mana up vs instant removal | attack in the air every turn; block the ground with non-essential bodies | protect the threat over adding a second; count the clock | in: protection vs removal-heavy; cheap blockers vs faster aggro |
| spells-matter (tempo) | beatdown vs control and engines; control vs aggro, then flip | 2–3 lands, a cheap payoff, 2+ cheap spells | deploy a payoff, spend spells on the opponent's turn when it is safe; cantrip at end step | attack when pump math wins; block rarely | counter the card that beats your plan, not the first spell; keep one answer for the engine piece | out: dead cantrips vs aggro; in: cheap removal vs aggro, counters vs control |
| disrupt-and-clock midrange | beatdown vs control and combo; control vs aggro and engines, flipping once stable | 3–4 lands, a two-drop, an answer | a threat per turn; hold one answer for the opponent's best threat class | attack with evasive threats; block with the rest when control; trade when beatdown only if ahead on cards | discard early (turns 1–2), counters late; cash card advantage before the second threat | in: discard and counters vs control; cheap removal vs aggro |
| engine midrange | beatdown vs control; control vs aggro until the engine is online | 3–4 lands (landfall 4), an enabler and a payoff | enablers first, payoff when it triggers the same turn; hold the second payoff behind a sweeper | attack once the engine produces more than it loses; block to protect the payoff | sequence for trigger count (landfall: land after enabler, fetch at end step); never expose two payoffs to one sweeper | in: answers to the opposing engine; protection for the payoff |
| draw-go control | control vs everything except faster control (more card advantage is control) | 3–5 lands, two answers, one card-advantage piece; ship hands with no answer by turn 3 | hold: pass with counter or instant removal up whenever the opponent can cast a threat; deploy a finisher only when the opponent is empty-handed or tapped out, or when losing the long game | block with finishers only; take damage early, stabilise, one evasive finisher | answer engines and planeswalkers on sight; let small creatures resolve and sweep; spend unused mana at the opponent's end step every turn | out: counters vs aggro; in: cheap removal, lifegain; vs combo: counters, discard |
| tap-out control | control vs aggro and midrange; beatdown vs draw-go | 3–4 lands, a sweeper or two early answers | deploy on your own turn: sweeper at 3+ creatures (2 if dying), finisher when the board is clear | block freely with anything that trades; chump only to reach the sweeper | hold the sweeper until one card trades for two or more; bait counters with the lesser threat | in: counters and discard vs control; sweepers vs go-wide |
| fast combo | beatdown vs everything slower; control vs faster aggro until the combo turn | a piece and selection; ship hands that cannot combo by turn 4 | protect and assemble; deploy only pieces and protection; hold a counter for their answer | do not attack; block only to survive | go off when protection mana is up and the opponent is tapped low, or the turn before you die | in: protection vs interactive decks; speed vs aggro |
| library attack (Excruciator) | control until the finish is castable, then beatdown for one turn | as disrupt-and-clock | interaction and card advantage; the finisher when protected or unanswerable | as midrange | count the opponent's library and life; the finish is a lock, not a race | as disrupt-and-clock |
| ramp | control early, beatdown once the haymaker lands | 3 lands + ramp + one haymaker | ramp every turn until a haymaker is castable, then one per turn | block early with ramp creatures; attack with haymakers | hold the second haymaker behind a counter when the opponent has one | in: early blockers vs aggro |

Three rules above every profile: the **role check runs each turn** (speed, damage on board, removal in hand, inevitability) and posture switches with the answer; **play/draw adjustment** (on the draw, aggro keeps one fewer land and one more answer; control keeps one more land); **sideboarding by role** (out what is dead in the matchup's role, in what lets the deck take the role it wants). Mulligan rules are plan-level approximations of the keep math; the sim's Karsten land table gives the thresholds. Not captured: specific card knowledge, hand reading, bluffing; the learned evaluator is the tool for the first.

## The acceptance test per profile

1. Behaviour from the six log statistics against per-plan targets. Draw-go: unspent after the opponent's turn < 1.5, held instant used > 70% when a threat was cast, finisher deployed when the opponent is empty-handed. Go-wide: own-turn unspent < 1.0, chump blocks < 10%, attacks declared when the predicted block does not kill the attacker. Engine: trigger count per enabler within 20% of the hand's ceiling. Combo: combo turn within one turn of the first possible with protection up.
2. Self-play strength on fixed seeds: profile vs stock Forge with the same deck, both seat orders, 200 games.
3. Calibration curve by class: a control profile is accepted only when the control rows stop being inverted in its games.
4. k per deck: the deck moves toward its real rate by at least a third of the gap with no other deck's k falling. Azorius went 13 → 25 of 41 on a third of its profile; the full profile should pass 30.
5. Karsten's six matchup signs come out with the right sign once both decks run profiles.

Guards: one profile per batch; accepted profiles run on both seats in the calibration round robins; `method.pilot` names the profile version.

## Building it into the sim

| Step | What | Where | Effort | Done when |
| --- | --- | --- | --- | --- |
| 1. Tagger | Scryfall `otag:` at import, Oracle fallback rules for the twelve tags, curated `finisher` and `combo-piece` lists; cached like `aihints.js` | `tags.js` | 2–3 days | top 20 lists tag with no card untagged; Excruciator and Airbending pieces marked |
| 2. Profile + classifier | twelve numbers + engine kind → plan, nearest meta deck; replaces `style.kind` and `deck-classes.js` | `plan.js`; `deck.plan = {plan, nearest, profile}` | 2 days | every top-20 list lands on the plan a player would name; calibration groups by plan |
| 3. Posture profiles in the bridge pilot | one JSON per plan; pilot picks the seat's profile from `deck.plan`, role each turn from Flores' check; reactive rules become draw-go's hold rules; block rule becomes every profile's block posture | `pilot/profiles/*.json`, `pilot.js`; version in `method.pilot` | 1 day per profile; draw-go, go-wide, engine midrange, disrupt-and-clock first (70% of the field) | each passes its acceptance test; round robins switch to profiles |
| 4. The Brewer | facts line gains plan and nearest deck; coach gains "what is missing" rows; method names the profile per seat; sideboard plans and calibration prior from the nearest deck | `index.html` (Design draws the row), `sideboard.js`, `calib.js` | 2–3 days | a pasted brew shows plan, nearest deck and holes before its first run |

Keep straight: the classifier is deterministic and explainable (nearest-neighbour on twelve numbers with the engine tag as key, not a model); profiles are data a person can read and argue with, with acceptance numbers recorded beside each rule; the learned evaluator sits under the profiles (profile decides the plan, evaluator the close calls).

Research owns: the plan shapes and profile tables as first drafts of the JSON; a pass over the top-20 lists with Code's tagger; reading each acceptance batch. Justin: the first brew through the new Deck tab, and whether "reads as" and "missing" say what a player would say.

Sources: Karsten, Metagame Mentor, September 2026; Scryfall search reference (Tagger tags); Flores, Who's the Beatdown? (1999); Flores, Eight Core Principles (2012); this project's 12–13 Oct research rounds; NOTE-TO-RESEARCH-13OCT-GAMELOGS.md and NOTE-TO-RESEARCH-13OCT-PILOT-BATCH.md. The plan shapes and posture tables are research's synthesis of the format's standard strategy writing and the meta lists: a first draft for the profile files, to be corrected by the acceptance batches.
