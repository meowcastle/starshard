# What would make the app valuable beyond the sim (research, 14 Oct 2026)

The question: we are refining the simulator; what around it would MTG players use, come back for, or pay for? Method: what the existing tools offer and charge, what players pay for outside tools, what the open-source and startup crowd is building toward, and what we already have that none of them do.

## 1. The landscape, in one paragraph each

**Arena companions (Untapped.gg, MTGA Assistant).** Deck tracker overlay, draw odds, opponent's revealed cards, personal statistics (ladder chart, deck win rates, matchup stats), draft ratings, and "find decks you can build from your collection". This is the mass-market layer: millions of installs, premium subscriptions for the statistics. They record what happened; none of them says what you should have done.

**Deck builders (Moxfield, Archidekt, TappedOut).** Lists, versions, goldfish playtesting, prices, Commander tools. Moxfield's roadmap right now is version control, printings and collections; nothing about play quality. Draftsim's deck-tester ranking puts Forge second behind XMage and describes it as "centered around playing against an AI", which is the thing we have industrialised.

**Tournament prep (MyDeckStats, Spellrack, mtg-meta-analyzer).** MyDeckStats: log every round, meta win rates with confidence intervals over 60/180 days, an opponent scout, a mulligan simulator, saved sideboard plans, a printable sideboard sheet; premium €1.99/month adds "a plan for each matchup", "Choose a deck", "Fix my deck". Spellrack pitches itself as "the spreadsheet you have open next to Moxfield": Karsten per-pip mana math, combo detection, a mulligan trainer, local-store inventory, Swiss tiebreakers. Zuxas's desktop analyzer scrapes 110,786 real Standard matches from melee.gg, builds a matchup matrix, an "Event Optimizer" (top-cut probability, breaker math), blunder detection, a puzzle trainer with ratings, and reads the player's own Arena log. All three are built by people solving their own tournament weekend.

**Paid guides and coaching (Metafy, Fiverr, GamerSensei).** A single Standard deck guide on Metafy (Izzet Prowess, by one grinder) sold 170+ copies: sideboarding matrix, nine matchups, keep-or-mull, card choices with reasons, a post-Pro-Tour update. Coaching sessions sell deck review and replay review. This is what players pay real money for: a plan for their deck against the field, and someone to tell them where they are losing.

**Sim-as-a-service (Grim.Cards, DeckCortex, ManaForge, manamind).** Grim.Cards runs a custom Forge build: each submitted deck plays a fixed gauntlet of five meta decks, gets an S–F "Power Score", and the white paper says plainly the results "describe engine behaviour, not human play". Their one Trustpilot review is a 3-star complaint that the AI "attacked arbitrarily with a Llanowar Elf", to which the company replied that Forge struggles with sequencing and pointed to log-based tuning. manamind (open source) has an open issue specifying exactly our product: per-matchup win rates with Wilson intervals, meta-weighted score, screen-then-confirm swap testing, post-board sideboard plans, with the caveat that agent skill per archetype must be shown. Nobody has shipped the calibrated version.

## 2. What we have that none of them have

- A fidelity number (k) against 1,063 real tournament games, pilots that moved Azorius Control from 16% to 31% toward a real 41%, and a field-test gate. Grim.Cards' disclaimer is our headline: "we measured how wrong Forge is and corrected for it".
- A coach that writes the Metafy guide's sections (sideboard matrix, matchup plans, mulligans, mana, version review) from the deck's own games, with evidence grades.
- The instruments: per-turn logs and the three statistics tools (unspent mana, held instants, attacks, spell timing). They were built to grade Forge. Pointed at a person's Arena log they grade the person.
- Versions as a first-class object, with every version runnable against any week's field.

## 3. Findings: what to add, in order of value per effort

### A. "Your leaks with this deck" (the Arena log as a mirror)
Untapped tells you your win rate; nobody tells you *why*. The tools now exist: unspent mana per turn, held instant used or wasted, open-board turns not attacked, lethal missed, instants cast at the wrong window, mulligan keeps by hand. Run them on the player's own Arena log and show the five numbers beside the pilot targets and beside Forge's: "you leave 1.0 mana unspent a turn (a strong pilot: 0.6); you held a counter and never used it 43% of the time; two missed lethals in three matches". With the game-by-game breakdown ("match 2, turn 7: 6 power on board, opponent at 5, you attacked with one") this is the replay-review a coach charges for, automated. It is one tool pass plus a Results-tab panel; the parser (656a908) already produces the sim's log format from Player.log, so the statistics tools run unchanged. The iPad gap (no log) is the only limit, and "Log a match" covers the record if not the leaks.

### B. The generated deck guide (a page, exportable, shareable)
The coach's modes already produce the pieces; assemble them into one document per version: the plan, the role in each matchup (beatdown or control, from the profiles), keep-or-mull by matchup, the sideboard matrix as a printable sheet (MyDeckStats' one export; the RCQ player's table card), card choices with the sim's evidence, what changed since the last version and what it did. Metafy proves people pay $10–30 for this written by a grinder; ours updates every week with the meta and is specific to their 75. Make it a shareable, read-only page: it is also the thing a content creator (Justin's own channel) would post.

### C. Weekly "your deck vs this week's field", pushed
We already run the weekly round robins. When the meta list changes, rerun each saved deck's last version against the new field in the background and tell the owner only when something moved: "Squall 52 → 47 this week: Landfall rose to 28% and you are 38% against it; the coach's sideboard guide is updated." That is the retention loop nobody in the list has, because nobody else has the compute pointed at the user's own list. Email or a badge; the digest is one paragraph.

### D. "What should I craft / the cheapest version that loses the least"
Untapped's most-used collection feature is "decks you can build". We can do the next step: given a collection (Arena export or a wildcard count), find the substitutions that cost the fewest wildcards and run them: "with 2 rare wildcards, Leyline Axe for Leyline of the Void costs 1.5 points; the full list costs 4 rares for +3 points". Quantified budget building is unique to a sim with calibrated numbers, and it is where new Arena players spend most of their decision time. Paper prices (Scryfall) give the same answer for the LGS player.

### E. Event mode: top-8 odds, breaker math, the table card
The Top-8 estimate exists; add the rest of the RCQ weekend: rounds from the event (already in settings), the expected field weighted by the store's last results if the player logs them, the "you need X–Y to make it" line between rounds, and a printable table card with the sideboard matrix and the mulligan rules for each matchup. mtg-meta-analyzer and MyDeckStats both built this for themselves; the user has told us the event and date already.

### F. Mulligan trainer with real stakes
Spellrack and MyDeckStats have trainers with no ground truth. Ours can show a hand, ask keep or ship, and answer with the sim: "this hand wins 44% against Landfall on the draw; a mulligan to six wins 41%; keep". Hands come from the player's own list; the numbers from the engine (one hand = a 40-game batch on the Mac, cacheable per hand class). The learning tool is a side effect of the mulligan work already in the pilot plan.

### G. Real matches as the ground truth, visibly
MTGODecklistCache (melee.gg, topdeck.gg) is already the calibration source. Show it: "Dimir Midrange beats Landfall 47% in 1,200 real matches this month; Forge says 44%, corrected 46%". MyDeckStats charges for exactly this table (with wider intervals, from self-reported rounds). It costs nothing: the data is on the server, the page needs one more column.

### H. Lower on the list
- **Commander.** The largest format and where Grim.Cards aims its gauntlet; Forge plays four seats but the games are long, the politics are not modelled, and the "bracket" question (power level 1–5) is better answered by rules than by games. Worth a bracket estimator from the tagger (fast mana, tutors, extra turns, game-changers list) before any simulation.
- **Limited.** 17lands owns the data; a Forge draft sim with Forge's picks would not beat it. Skip.
- **Opponent scouting** (MyDeckStats' Scout) matters for store regulars; a notes field per opponent from "Log a match" covers it.
- **Replay video** (MTG Circle's CardFlow) is a separate product; the log gives us the decisions without the video.

## 4. What this says about positioning
Every tool in the list records or displays; the two that simulate disclaim their own numbers. The thing nobody sells is the answer to "what should I change, and where am I losing?", with numbers that have been checked against real play. A and B are that answer; C is the reason to come back; D is the reason a new Arena player signs up; G is the proof. The sim's accuracy work is not a detour from the app's value, it is the moat under all five.

## Sources
- Untapped.gg companion features: https://mtga.untapped.gg/companion
- Draftsim, deck testers ranked (Forge #2, "centered around playing against an AI"): https://draftsim.com/mtg-deck-tester/
- MyDeckStats features and pricing (€1.99/month): https://mydeckstats.com/ · sideboard planner: https://mydeckstats.com/docs/mtg-sideboard-planner
- Spellrack's "why" page (bracket scoring, Karsten per-pip math, combo detection, mulligan trainer): https://spellrack.com/why-spellrack
- Moxfield roadmap: https://moxfield.nolt.io/roadmap
- Zuxas/mtg-meta-analyzer (262k real matches, Event Optimizer, blunder detection, puzzle trainer, Arena log import): https://github.com/Zuxas/mtg-meta-analyzer
- Grim.Cards white paper, 1 July 2026 (custom Forge, five-deck gauntlet, "not predictions of how those decks would perform at a table"): https://grim.cards/case-study/2026-07-01 · Trustpilot: https://nz.trustpilot.com/review/grim.cards
- manamind issue #48, deck evaluation vs the meta: https://github.com/anchapin/manamind/issues/48
- Metafy Standard Izzet Prowess guide (170+ purchases; sideboarding matrix, nine matchups, keep-or-mull): https://metafy.gg/guides/view/standard-izzet-prowess-p1EklrHiw5N
- MTG coaching market: https://www.streamscheme.com/magic-the-gathering-coaching/
- MTG Circle / CardFlow replays: https://cardgamebase.com/?p=42853
- DeckCortex: https://deckcortex.com/ · ManaForge: https://manaforge.tools/en
- Mana base math and calculators: https://scrollvault.net/guides/mana-bases.html
