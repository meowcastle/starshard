# Research: Archidekt, EDH Play, and what the sim should take from them (20 Oct 2026)

Justin's ask: his friend says Archidekt is the place to build Standard decks and EDH Play lets you play your own deck or other people's. "We need a better way for users to do a choose-your-own-adventure with their made-up decks and collections, with links out to Card Kingdom and TCGplayer under every card, and the estimated value of the collection."

## What they are

**Archidekt** is the deck builder people already use. It's free with ads; Patreon removes them. You drag cards into stacks grouped by category, search with Scryfall syntax, see a red "Errors" badge when a deck isn't legal, and can pin up to 150 cards to a clipboard while you brew. It keeps a change history of every deck, has collaborators who edit live, and has a playtester (manual: draw, mulligan, move cards, track life; "no gameplay assistance or rules enforcement"). Since September 2026 the playtester has an "interaction simulator" for goldfishing; the post wasn't readable, so what it simulates is unknown.
Collection: import text or CSV (ManaBox exports CSV, so that path works); owned cards are highlighted in the builder and you can filter to "only cards I own" (the feature reviewers praise most: "turns a collection from an inventory into a shortlist"). Prices from TCGplayer, Card Kingdom, Cardmarket and Cardhoarder, two shown side by side. **Total collection value exists but is hidden** behind a "Data" link on the collection page; users have asked for it on the main view. Buying: per-card links to Card Kingdom carry Archidekt's affiliate code (`cardkingdom.com/catalog/search?filter[name]=…&partner=archidekt`, the page shows "Affiliate code 'archidekt' applied"), and a whole list can go to Card Kingdom's Deck Builder pre-filled.
What it doesn't do: tell you whether the deck is any good against the field. It checks legality and counts, not matchups.

**EDH Play** (edhplay.com) is a free browser table for playing Commander. You paste a list (Moxfield and Archidekt exports work), then play by hand: "Open Playtest to run a game with no opponents, or add seats and control every board yourself." Other opponents are real people in public or private rooms (Discord of 24,000+); no AI. Works on phones in landscape and saves to the home screen, like ours. Keeps a history of finished games (recent ones free, full stats on Patreon). Formats: Commander, Brawl, Pauper EDH, Limited, draft against bots, and a no-rules "Free" format; Standard isn't listed. No rules engine; you move the cards yourself.

**Related:** Playgroup.gg's playtester takes a Moxfield or Archidekt **link** and adds "Sparring" phantom opponents who counter spells and remove threats, which is a crude version of what our Forge pilot does properly.

## What it means for the sim

Archidekt owns building. EDH Play owns playing by hand. Nobody tells you how a paper Standard deck does against this week's field with the cards you own, and what to buy. That's still our job, and it's still empty. So: **don't rebuild Archidekt; be the place you bring an Archidekt deck to find out if it's good.**

### 1. Come in from where people build
- Accept an **Archidekt or Moxfield deck link** as well as pasted text. Archidekt decks are public by default, so a link should be enough; Code to confirm the address Archidekt serves a public deck from (I couldn't read the source that shows it).
- Accept **ManaBox CSV** for the collection (done) and **Archidekt collection CSV** (same importer, different columns).
- Send it back: "Open in Archidekt" on any version, as an Archidekt-format text list.

### 2. Choose your own adventure = branches, not one line of versions
The paths a player wants, each landing on the Deck tab with the check:
1. **I have a deck:** paste or link it.
2. **Build from what I own:** the "What you could build" list on Collection, each one a starting deck.
3. **Start from a meta deck:** pick Azorius Control from the field, and the sim swaps in your owned cards where it can, then shows what's missing.
4. **Blank brew:** pick colours and a shell, the check guides the rest.

Then the adventure part: any version can **branch** ("Try a path from v3"). v3 → "v3 · Get Lost path" and "v3 · Sunfall path", each with its own run, and the chooser shows them side by side with their numbers. The player picks the winner and makes it current. This is the version ledger from change 30 with one more column (which version it branched from), and it's how a player safely tries ideas without touching the deck they've sleeved.

### 3. Play it yourself (later, and the real edge over EDH Play)
EDH Play's draw is "play your own deck." Forge already supports a human playing against its AI. **"Play v3 against Azorius, Forge plays them"** would be the one thing neither Archidekt nor EDH Play can do: practise the exact matchup the sim says is your worst, against a pilot that plays the meta list. It's a big build (Forge's table in a browser). The cheap first step is Archidekt's: a **sample-hand / goldfish** panel on the Deck tab (draw 7, mulligan, draw turns 2–4, see if the curve works), which pairs with the check's mana findings.

### 4. A buy link under every card, both shops
- Every card row, on Deck, Collection and the matchups' "cards that beat you", gets **TCGplayer $x · Card Kingdom $y**, each a link. Two prices side by side is what Archidekt does and players expect it.
- Card Kingdom per-card: `https://www.cardkingdom.com/catalog/search?filter[name]=<name>&partner=<our code>` (pattern confirmed live with Archidekt's code).
- Whole lists: TCGplayer Mass Entry (`?productline=Magic&c=qty name||qty name`, shipped in change 23) and Card Kingdom's Deck Builder (`https://www.cardkingdom.com/builder`). One source says it takes `/builder?c=` with one card per line; Code to verify before relying on it. Fallback: copy list + open the builder (what change 23 does now).
- **Affiliate codes:** TCGplayer's program pays 3.5% (researched 16 Oct, Impact). Card Kingdom runs one too (Archidekt and The Command Zone use it); terms not public on the pages read, so Justin applies to both. Links carry `rel="sponsored"` and one disclosure line in the footer.

### 5. Collection value, on the main view
Archidekt hides the total behind "Data." Put it in the Collection stat row as the first number: **Collection · 48 cards · $212 TCGplayer · $238 Card Kingdom**, then This deck, To finish, Worth buying first (the v5 row). Per card, the same two prices. Prices update daily.
Where prices come from: Scryfall's daily data has TCGplayer market (already used). Card Kingdom prices need a second feed; MTGJSON's daily price file is the usual open source for Card Kingdom and TCGplayer together; Code to confirm it carries Card Kingdom retail before building on it.

## What to build, in order
1. Buy links under every card (both shops, both prices) and the collection value as the first stat: small, uses what's there, and it's what players see first. Needs the Card Kingdom price feed and the two affiliate sign-ups (Justin).
2. Archidekt/Moxfield link import, and Archidekt CSV for the collection.
3. Branches in the version chooser (change 30 plus one column) and "Start from a meta deck."
4. Sample-hand panel on the Deck tab.
5. Research spike, not a build: Forge human-vs-AI in the browser for "play the matchup yourself."

## Not confirmed
- The Archidekt address for pulling a public deck by link, and whether it needs a login (Code verifies).
- Card Kingdom's Deck Builder accepting a pre-filled list in the URL.
- Card Kingdom's affiliate terms, and whether MTGJSON's price file includes Card Kingdom retail.
- What Archidekt's September "interaction simulator" does.
- Whether EDH Play enforces any rules (everything read says manual).

## Sources
- Archidekt landing and news: https://archidekt.com/landing, https://archidekt.com/news
- EDHREC's guide to Archidekt: https://cloudflare.edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site
- Archidekt forum, total collection value: https://archidekt.com/forum/thread/6133702/1
- Collection tracker comparison (publisher ranks itself first): https://turnzerohq.com/guides/best-mtg-collection-tracker-apps
- Card Kingdom partner link example: https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=Last+One+Standing&partner=archidekt&partner_args=single
- Card Kingdom Deck Builder: https://blog.cardkingdom.com/deck-builder-craft-your-next-deck/ and https://cardkingdom.freshdesk.com/support/solutions/articles/3000037522-can-i-add-a-bunch-of-cards-to-the-shopping-cart-all-at-once-
- Shop link patterns in an open-source MTG app: https://github.com/krakenhavoc/cmd_and_ctrl/pull/3450
- EDH Play: https://edhplay.com/help, https://edhplay.com/play-commander-without-webcam
- Playgroup.gg comparison and playtester (a competitor's own page): https://playgroup.gg/playgroup-live/play-commander-online, https://playgroup.gg/playtest
