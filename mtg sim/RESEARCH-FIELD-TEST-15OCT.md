# Field test: the sim against everything a player could use instead (15 Oct 2026)

The question: a Standard player opens a tool before FNM or an RCQ. What does each tool answer, what does it charge, and where does ours win or lose? This updates RESEARCH-APP-VALUE-14OCT.md with what moved since, and with the shops and creators Justin named. "Metabox" didn't turn up as a product; I've read it as ManaBox (the collection app), and I've covered the "Meta" sites (MTGGoldfish, AetherHub, mtgtop8) as well.

## 1. The field, one line each

| Tool | Answers | Charges | Checked against real play? |
|---|---|---|---|
| **Untapped.gg / Arena Tutor / MTGA Assistant** (Arena companions) | what happened: draw odds, opponent's revealed cards, your win rate per deck | free + premium stats | n/a, they record |
| **Moxfield / Archidekt / TappedOut / Deckstats** (builders) | the list: versions, prices, curve, goldfish hands, probability | free | no play |
| **ManaBox / Dragon Shield / Delver Lens / Cards AI** (phone scanners) | what you own, what it's worth, an opening-hand simulator | free–$9/mo | no |
| **TopDecked** (phone tournament app) | life counter, tournament runner, deck builder, a "virtual battlefield" | $3–8.50/mo, 2.8K ratings at 4.8 | no |
| **MTG Playbook** (phone) | life counter that logs the match: deck, opp deck, play/draw, mulligans; win rate by matchup | free | your own record only |
| **MTGGoldfish / mtgtop8 / AetherHub** (meta sites) | what the field is, what won, prices | free + premium | they *are* the real results |
| **MyDeckStats / Spellrack / mtg-meta-analyzer** (prep tools) | meta win rates with intervals, sideboard sheet, mulligan trainer, breakers | free–€2/mo | real results, self-reported or scraped |
| **TCGplayer / Card Kingdom** (shops) | buy the list: paste → cart, version and condition filters | the cards | no analysis at all |
| **Tolarian Community College** (The Professor) | product reviews, sleeves/mats/sets; a Card Kingdom affiliate | free | n/a |
| **Metafy guides** (grinders) | a written plan for one deck: sideboard matrix, matchups, keep/mull | $10–30 per guide | one person's reps |
| **Grim.Cards** (built on Forge's simulator) | a 0–100 Power Score with a letter grade, card-level coaching, a leaderboard | free | **no**; its own white paper says engine behaviour, not human play |
| **Spellbook** (robmillersoftware/mtg-deckbuilder, open source) | chat builds a Standard deck, then Forge plays it vs the top 5, swap-tests cards, writes a report | free, self-hosted, 0 stars | no |
| **manamind** (open source) | the spec for our product, unbuilt | free | no |

## 2. What moved since 14 Oct

1. **Grim.Cards now sells coaching, not just a score.** The About page describes a "counterfactual learning system" that compares each AI decision with alternatives to find the cards and play patterns that improve outcomes, and "card-level coaching and counterfactual suggestions" on every submitted deck. Still free, still no games-per-gauntlet number, still no fidelity check. They are moving toward our coach from the engine side.
2. **Spellbook merged Forge simulation on 8 Oct** (PR #61). It is our method in miniature: a gauntlet of five real meta lists, Wilson intervals, "favored" only when the whole interval clears 50%, and a swap search that screens then confirms. It runs at 0.6 games a second on one machine, so it does 8 screening + 12 confirmation games a matchup and most builds come back unchanged. The author says so in the report. That is the honest version of what Grim.Cards sells, and it is one `docker compose up` away from anyone.
3. **No one has a phone deck tracker, and no one will.** Untapped's help page is blunt: iOS and Android sandbox the Arena app, so a tracker "cannot read game data", and screen recording is "also not feasible". Every phone app in the field is a collection scanner, a life counter, or a match log. This settles what the sim's phone app is *not*.

## 3. The scorecard: us against each

Rated on what the player gets back before an event. ● we win, ◐ even, ○ they win.

| Dimension | Us | Best in field | Verdict |
|---|---|---|---|
| Win rate vs the week's field, with a range | yes, 10–20 real lists, calibrated, k published | Grim.Cards (uncalibrated), Spellbook (5 lists) | ● |
| Honesty about the engine | a trust line on every page, k, pilots graded | Spellbook's report note; Grim's white paper | ◐ (Spellbook is honest too) |
| "What should I change" | coach + levers + version compare + swap SPRT | Spellbook's swap search; Grim's counterfactuals | ● on evidence, ○ on the chat-builds-the-deck flow |
| Sideboard plan, matchup roles, mulligans | generated per 75, evidence-graded, printable guide | Metafy ($10–30, one grinder, one list) | ● |
| Your own leaks | per-turn grading from the Arena log | nobody | ● |
| Real-results table (matchup matrix) | we have the data, it is on the Codex | MyDeckStats, mtg-meta-analyzer, MTGGoldfish | ◐, theirs is bigger and public |
| Weekly rerun, pushed | spec'd, badge drawn | nobody | ● once built |
| Collection / what to craft | not started | Untapped, ManaBox, GrimDeck | ○ |
| Buy the list | not started | TCGplayer, Card Kingdom (paste → cart) | ○, cheap to add as links |
| At the table: life counter, match log | Log a match only | TopDecked, MTG Playbook | ○ |
| Phone | responsive page as of change 16 | TopDecked (native, 4.8★) | ○ until the app exists |
| Price | free, credits recorded | most are free; TopDecked $3–8.50/mo; MyDeckStats €2/mo | ◐ |

## 4. What to take from each

- **From Spellbook:** the honest report shape. "Favored" only when the interval clears 50%; say why a swap was not kept; show a sample win and a sample loss. We have the first two; add the sample games to the matchup row's detail (one won log, one lost, three lines each). Also: watch this repo. If someone hosts it, it is the free version of us at 20 games a matchup.
- **From Grim.Cards:** the counterfactual framing is good product language even if their engine isn't checked. Ours exists already (the levers panel and the version compare). Say "if you cut X for Y, +2.1" the way they do, with our range attached.
- **From MTG Playbook and TopDecked:** the life counter is the match logger. Nobody at an RCQ opens a form between rounds; they open a life counter. If the counter records the result, opponent deck, play/draw and mulligans at 0 life, "Log a match" becomes free. This is the one phone feature with no desktop equivalent.
- **From MyDeckStats and mtg-meta-analyzer:** the printable sideboard sheet is the paper player's product. Ours is in the guide already; make sure it prints on one side of letter paper from a phone.
- **From TCGplayer and Card Kingdom:** "buy this list" is one link (TCGplayer Mass Entry, Card Kingdom's deck builder accepts a pasted list). Add it to the Deck tab and the guide. Affiliate links are allowed under the Fan Content Policy as sponsorship, as long as they don't gate anything.
- **From the Professor:** his audience is paper and Commander; he reviews physical product and does not endorse software. Not a channel for us now. The Card Kingdom affiliate model he runs on is the model for our buy links.
- **From Untapped:** personal statistics pages were their big 2026 launch (win rate by deck, ladder chart). Ours should be *what you did wrong*, not *what you did*. Keep that line.

## 5. Where the sim still loses, and the order to fix it

1. **The engine** (unchanged, critical path): the gap between our numbers and real results is the whole pitch. Grim.Cards' coaching and Spellbook's report both ship on an unchecked engine; if ours ships checked and theirs don't, we win the category. If ours ships unchecked, we are Grim.Cards with better typography.
2. **Collection and craft** (D in the 14 Oct doc): the only one of their features a new Arena player misses on day one. Arena collection export → "what you can build" → "what to craft for the fewest wildcards per point".
3. **The phone app** (next doc): results, coach, guide, log a match via the life counter, weekly push. Not a tracker.
4. **Buy links** on Deck and Guide: an afternoon.
5. **Sample games** in the matchup detail: an afternoon, once the logs are on the server.

## Sources
- Grim.Cards: https://grim.cards/ · about: https://grim.cards/about · white paper: https://grim.cards/case-study/2026-07-01
- Spellbook, Forge simulation PR #61 (merged 8 Oct 2026): https://github.com/robmillersoftware/mtg-deckbuilder/pull/61 · repo: https://github.com/robmillersoftware/mtg-deckbuilder
- Untapped on why no mobile tracker: https://help.hearthsim.net/en/articles/5578473-why-is-there-no-deck-tracker-for-mtg-a-on-mobile-devices · personal stats pages: https://invenglobal.com/articles/9111/untappedgg-launches-personal-statistics-profile-pages-for-mtg-arena
- Arena Tutor (Draftsim): https://draftsim.com/arenatutor/
- TopDecked MTG (App Store, pricing tiers): https://apps.apple.com/app/id1173388234
- MTG Playbook (App Store): https://apps.apple.com/us/app/id6446243687
- Card Kingdom deck builder: https://blog.cardkingdom.com/card-kingdom-deck-builder-update/ · Professor affiliate: https://blog.cardkingdom.com/card-kingdom-affiliates-tolarian-community-college/
- Phone app round-ups: https://www.cardsaiapp.com/blog/best-magic-the-gathering-apps · https://grimdeck.com/blog/best-mtg-deck-builder-sites · https://www.scanyourmtg.com/mtg-collection-tracker/
- Tolarian Community College: https://mtg.wiki/page/Tolarian_Community_College
- Earlier landscape (Untapped, Moxfield, MyDeckStats, Spellrack, mtg-meta-analyzer, Metafy, manamind): RESEARCH-APP-VALUE-14OCT.md
