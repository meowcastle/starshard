# Forge Sim (sim.starshard.net): Design handoff

**From:** Code · **To:** Claude Design · **Date:** 6 Oct 2026 · **Owner:** Justin
**Status:** a working v0 UI exists in `mtg sim/public/`. Read it to see the moving parts, but don't treat it as a design. This handoff asks for the real UI.

---

## 1. What this is

This is a private web app where Justin and a small group of friends who play competitive Magic test decks against each other and against the current metagame. You pick decks, and **Forge** (an open-source MTG rules engine with an AI player) plays them against each other hundreds of times on Justin's home server. The app tells you who wins, by how much, and why.

The audience is a handful of competitive players who already use MTGGoldfish, Moxfield, 17lands and Untapped.gg. They read win rates and sample sizes fluently. Don't explain Magic to them. Explain **the simulator's limits** to them, because that's the part that's new.

**The one sentence the UI has to make true:** *"I can go from 'what if I play this list into the current meta' to a trustworthy answer without leaving the page, and I know how much to trust it."*

## 2. Decisions already made (Justin, 6 Oct)

| Topic | Decision |
|---|---|
| Access | **Personal accounts, using Star Shard logins.** The same username and password as Star Shard/Manzil. Justin adds friends' usernames to an allow-list, so there's no separate sign-up or invite flow in this app. Each person has their own decks and run history, and there's a **shared team library** everyone can see. |
| Sharing | **Members only.** No public or unlisted share links. Results stay behind login. |
| Formats | **Standard, Pioneer, Commander, cEDH.** Presets, defaults and deck rules are tuned for these. Other formats stay possible but are secondary (tucked under "More formats"). |
| Results depth | Win rate plus **on-the-play vs on-the-draw split**, **card performance**, and an overnight **meta matrix** (every top deck against every top deck). |
| Sideboarding | **Sideboard plans per matchup.** e.g. "vs Izzet: −2 Duress, +2 Negate". Games 2 and 3 of a best-of-three use the swapped list. Forge's AI doesn't sideboard on its own, so this is ours to model. |
| Look | **Pro tool, card-art forward.** Dark, dense and data-first in the spirit of 17lands and Untapped.gg, with Scryfall art crops giving each deck its identity. **Not** Star Shard's design system; this is its own product. |
| Device | **Desktop only.** Design for 1280–1920 wide. Don't spend effort on phone layouts. Below ~1100px it just needs to not break. |

## 3. Hard constraints the design has to respect

These come from the engine and the hardware. They aren't preferences.

1. **Sims are slow and the queue is shared.** Forge takes ~30s to load its card database per run, then roughly **5–30 seconds per game** on the NAS (Commander pods are slower). A 50-game matchup takes minutes. A gauntlet of 8 opponents × 50 games is close to an hour, and a meta matrix runs overnight. One job runs at a time, and everyone else waits in a queue.
   → The UI is **asynchronous by design**. Starting a run is like sending an email, not like loading a page. You need a visible queue with owner, position and an ETA, plus live partial results as they come in. People should be able to leave and come back.
2. **Small samples lie.** 10 games at 70% means almost nothing. Every win rate shows a **95% confidence range** and the game count. Design how that reads at a glance: the range should be visible, not hidden in a tooltip. Results below ~30 games should look provisional.
3. **The AI is the pilot.** Forge's AI is decent with aggro and midrange and weak with combo, intricate control and some Commander interactions. Results mean "how these lists perform when the Forge AI plays both sides." The UI should say this once, clearly and calmly, and not apologize on every screen.
4. **Card coverage.** Forge supports almost every card, but the newest sets can lag and some cards are flagged "AI can't play well". Deck validation has to show three states per card: OK, **unknown to Forge** (skipped), and **AI-limited** (plays but badly). Code will supply this per card.
5. **Data comes from scraped sites.** MTGGoldfish and MTGTop8 can break or be slow. Every meta panel needs a loading state, an error state ("couldn't reach MTGGoldfish, try MTGTop8 or paste a list") and a "last updated" stamp.
6. **Commander is a 4-player free-for-all, Constructed is 1v1.** Result layouts must handle 2, 3 and 4 seats. Commander decks have a commander slot with its own art and a color-identity check.

## 4. Screens

Names are suggestions. Each screen needs empty, loading, error and full states.

### 4.1 Sign in
- Username (or email) + password, labeled as **your Star Shard account**. Link out to Star Shard for "no account / forgot password"; this app has no sign-up or reset of its own.
- A distinct state for "real account, but not on the simulator list yet. Ask Justin to add you."
- Small and quiet. This is a tool, not a landing page.

### 4.2 Home (the dashboard)
- **Your runs**: running and queued at the top with live progress, then recent results as compact rows (decks as art-crop chips, headline win rate with range, game count, format, when).
- **Queue strip**: the NAS is a shared resource. Show who's running what, what position you're in and the ETA. Owners can cancel their own jobs.
- **Team activity**: what friends ran recently, for example "Sam: Izzet Prowess vs top 8 Standard — 54% (±7)". This is the social glue that makes it a group tool.
- **Meta snapshot**: top archetypes for your main format with meta share. Clicking one opens the deck.
- Primary actions: **New matchup**, **Run gauntlet**, **Build/import deck**.

### 4.3 Deck library (mine + team)
- Grid or list of saved decks: art crop (a cover card the user picks, defaulting to the most-played nonland), name, format, colors, owner, last tested and best/worst matchup.
- Filters: format, colors, owner, archetype tag.
- Versions: decks get tweaked, so a deck keeps **versions** ("v3: −1 Opt +1 Spell Pierce"), and results are tied to the version that was tested. Show the version on every result.

### 4.4 Deck editor
- **Import:** paste a list, or a Moxfield/Archidekt/MTGGoldfish/MTGTop8 link, or pick from the meta panel.
- **Build:** card search backed by Scryfall (autocomplete, art, type line, mana cost), with quantity steppers.
- Sections: Main, Sideboard, Commander (Commander formats).
- Live validation per card (OK / unknown to Forge / AI-limited), plus format legality and deck size from Scryfall.
- Stats panel: mana curve, color pips, land count, card types. Hovering any card name shows the full card image, everywhere in the app.
- **Sideboard plans** live here: a list of "vs [archetype or saved deck]: out → in" plans. Make writing one fast: drag from the main list to Out and from the sideboard to In, and keep counts balanced (show it plainly when out ≠ in).

### 4.5 New run (the setup flow)
One screen, three run types:
- **Matchup:** 2 decks (Constructed) or 2–4 (Commander pod). Pick from library, team library or meta.
- **Gauntlet:** one deck against N opponents. "Top 8 of the current [format] meta" is one click. Each opponent row shows meta share, so the gauntlet can be **meta-weighted** (overall = your win rate weighted by how often you'd face each deck).
- **Meta matrix:** pick the top N archetypes. Every pairing runs, scheduled overnight. Show an honest time estimate before confirming ("~6h at current speed, finishes around 4am").
- Settings: games per pairing (presets 20 / 50 / 100 / 200 with a time estimate next to each), **best-of-one vs best-of-three** (Bo3 uses sideboard plans when they exist and says so when a plan is missing), play/draw handling (alternate, or force), and a game time limit (advanced).
- Starting the run goes straight to its result page with live progress.

### 4.6 Result page (most important screen)
Must work live (filling in as games finish) and finished.
- **Headline:** win rate with a confidence range bar, game count, and a provisional badge under ~30 games.
- **Play vs draw split:** two numbers side by side, each with its own range.
- **Per-game strip:** one mark per game (who won, play/draw, game length on hover). It's satisfying to watch fill up live, so lean into that.
- **Gauntlet:** a table of opponents (meta share, your win rate ± range, games, play/draw). Sortable, with a meta-weighted overall at the top. Bars beat numbers alone.
- **Card performance:** for each card in your deck, how often it was drawn or cast and the win rate in games where it was cast vs not. This is noisy: show sample counts, sort by impact, and mute low-sample rows. Code supplies the numbers; the job here is making noisy numbers readable.
- **Commander pods:** 4 seats, win share per seat, average turn the game ended, how often each seat was eliminated first.
- Actions: re-run with more games, duplicate and tweak, open either deck, view the raw Forge log (collapsed, monospace, for nerds).

### 4.7 Meta matrix
- Heatmap, rows and columns = archetypes. Cell = row deck's win rate vs column deck, on a diverging scale centred on 50%. **Cell opacity or size reflects sample size**, so thin cells read as uncertain.
- Hover a cell for the full matchup summary; click it for the result page.
- Side panel: each archetype's meta-weighted overall win rate. "If the meta looks like MTGGoldfish says, what's best positioned?" is the payoff question.
- This is the screen people will screenshot into their group chat, so make it beautiful.

### 4.8 Meta browser (a panel available from the editor and run setup)
- Sources: MTGGoldfish, MTGTop8 (Standard/Pioneer), EDHREC (Commander: top commanders, average decklists), and cEDH lists from MTGTop8.
- Each row: archetype name, art crop, meta share bar, source and last-updated time. Actions: **Load into editor**, **Add to gauntlet**, **Save to team library**.

### 4.9 Settings / admin (Justin only)
- Who's on the allow-list (today that's edited on the NAS; a screen for it is a nice-to-have).
- NAS load: queue length, average seconds per game, Forge version.
- A "Forge version" readout everywhere results are shown, since results can shift when Forge updates.

## 5. Visual direction

- **Pro tool, card-art forward.** Think 17lands' density and Untapped.gg's polish. Dark UI, tight type, numbers in a tabular/mono face, lots of information per screen without clutter.
- **Card art is the identity system.** Scryfall `art_crop` images (wide, borderless crops) represent decks everywhere: chips, rows, headers and matrix axis labels. Commander decks use the commander's art. Expect any art, and keep a consistent treatment (crop, slight vignette or gradient, name over it legibly).
- **Mana colors** (W U B R G, colorless, multicolor) are a second identity layer: pips, edges and filters. Use the community-standard mana symbols. The open-source **Mana** font (`mana-font`, by Andrew Gioia) is what most tools use.
- **Seat colors in results** are separate from mana colors. Deck A/B/C/D need four distinct, colorblind-safe series colors that never get confused with "blue deck" or "red deck". Don't reuse mana hues for seats.
- **Win/loss coloring:** a diverging scale for the matrix and for above/below 50%. It must be readable for red-green colorblind users (a common trait in this audience). Pair color with sign/position, not color alone.
- **Uncertainty is visual.** The confidence range is a first-class visual element (bars, whiskers, faded cells), not fine print.
- Motion is limited to live progress (games landing in the strip, bars easing). Nothing decorative.
- Respect Scryfall's image guidelines: don't crop out or obscure the artist credit on full card images, and don't recolor or distort card images. Art crops for identity are fine and widely used.

## 6. The data you can bind to

Today's API (v0, live in `mtg sim/server.js`). Code will extend it to cover §2, using the same shapes plus the fields marked *planned*.

```
POST /api/login         { username, password } → { ok, user }  (401 wrong password, 403 not on the list, 429 too many tries)
GET  /api/me            → { user: { name, isAdmin }, forge: "2.0.15", maxGames, goldfish:[formats], top8:[formats] }
GET  /api/meta?source=goldfish|top8|edhrec&format=standard
                        → { decks: [{ id, name, pct, count, source }] }
                          planned: updatedAt, coverCard
GET  /api/meta/deck?source&id → { main:[{qty,name}], side:[…], commander:[…] }
GET  /api/import?url=…  → same deck shape + name
POST /api/sim           { mode: "matchup"|"gauntlet", format, games, clock, decks:[…] } → { id }
                          planned: mode "matrix", bestOf: 1|3, sideboardPlans, playDraw
GET  /api/jobs/:id      → { id, status: queued|running|done|failed|cancelled, queuePos,
                            mode, format, games,
                            pairings: [{ names:[…], wins:[…], draws, status,
                                         games:[{ n, winner, ms, turn? }], warnings:[…] }],
                            logTail:[…] }
                          planned per game: onPlay (seat index), mulligans:[…], turn
                          planned per pairing: cardStats:[{ name, drawn, cast, winWhenCast, n }]
GET  /api/jobs          → { running, queued:[…], history:[…] }
                          every job carries owner (Star Shard username); planned: etaSeconds
```
*Planned, for decks:* `GET/POST /api/decks` (owner, visibility: mine/team, versions[], sideboardPlans[], coverCard).

Scryfall is called **from the browser** (CORS-friendly): `/cards/autocomplete`, `/cards/collection` (75 names per request, max ~10 requests/second), and the `image_uris.art_crop` / `normal` URLs. Build the mocks against real Scryfall responses.

## 7. How to deliver (please follow this; it's what kept Star Shard from regressing)

1. Deliver into a single folder, **`mtg sim/send-to-code/`**, containing **only the files you changed** plus a **`WHATS-NEW.md`** that lists the screens, the state each one expects, and any binding you invented.
2. **Markup and styles are yours. Data wiring is Code's.** Mock data lives in one clearly named file (`mock-data.js`), never mixed into components. Use the shapes in §6 exactly, including the *planned* fields, so Code can swap mock for live without touching layout.
3. No build step is assumed today, so plain HTML/CSS/JS is safest. If you want a framework (React via a CDN, Preact, etc.), say so in `WHATS-NEW.md` and Code will decide whether to adopt it. Don't ship a bundler setup unasked.
4. Don't import or copy `server.js`, `forge.js` or `meta.js`. Those are Code's.
5. Everything sits behind login, so no SEO or OG work is needed. Set the page `<title>` to "Forge Sim".

## 8. What Code is building in parallel

So the design can assume these exist:
- Accounts (done: Star Shard logins + allow-list), a per-user/team deck library with versions, owner on every job, fair-share queueing.
- Per-game play/draw and turn-count capture from Forge logs, and the card-performance tally (requires running Forge with full logs, which is slower).
- Best-of-three with sideboard plans (swap the list between games ourselves, since Forge's AI won't).
- Meta matrix scheduling, time estimates from measured seconds per game, and "last updated" on meta data.
- Per-card Forge coverage check (unknown / AI-limited) exposed to the editor.

## 9. Open questions for Design (your call; flag in `WHATS-NEW.md`)

1. **Navigation model:** left sidebar (Home, Decks, Runs, Matrix, Meta) or top tabs? We lean sidebar, since there are more destinations than tabs comfortably hold.
2. **How provisional is provisional:** greyed numbers, a badge, a hatched bar? Pick one treatment and use it everywhere.
3. **Card performance layout:** table or dot plot (win rate when cast vs not, dot size = sample)? We suspect a dot plot reads faster, but show both if you're unsure.
4. **The "AI is the pilot" note:** where does it live so it's seen once and then not nagging? (First run? A footer on result pages? An info icon by the headline?)
5. **Commander pod result:** a 4-way bar works for win share, but how do we show "who killed whom" or elimination order, if it's worth showing at all?
6. **Empty-state art:** the app will often be empty for a new friend. What does an inviting empty Home look like?

## 10. Acceptance checklist (Code will check deliveries against this)

- [ ] Every screen in §4 has empty, loading, error and full states.
- [ ] Every win rate shows a game count and a confidence range, and under-30-game results are visibly provisional.
- [ ] Result layouts handle 2, 3 and 4 seats, and a gauntlet of 1–12 opponents.
- [ ] Live result page updates without layout jumps as games arrive.
- [ ] Seat colors are distinct from mana colors and pass a colorblind check, and the matrix scale is colorblind-safe.
- [ ] Card hover preview works on every card name.
- [ ] Mock data is in one file and matches §6 shapes exactly.
- [ ] Works at 1280–1920 wide; nothing breaks down to ~1100.
- [ ] Delivered as `mtg sim/send-to-code/` with `WHATS-NEW.md`, changed files only.
