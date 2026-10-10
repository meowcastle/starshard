# sim.starshard.net — Forge MTG simulator

Private web UI, signed in with **Star Shard accounts**, around [Forge](https://github.com/Card-Forge/forge)'s
headless AI-vs-AI simulator (`forge sim`). Separate from Star Shard; it only
shares the domain and the NAS.

- **Matchup**: 2–4 decks, N games (3–4 decks = free-for-all).
- **Gauntlet**: deck 1 plays N games against each other deck in turn
  ("Add top 8" pulls the current top of the meta).
- **Decks from**: MTGGoldfish & MTGTop8 metagame pages, EDHREC average decks,
  Moxfield / Archidekt / Goldfish / Top8 deck links, or pasted lists.
- **Scryfall** (called from the browser) validates every name, converts
  DFC/adventure names to Forge's front-face spelling, and draws the curve,
  colours and hover previews.

## Layout

| file | what |
|---|---|
| `Dockerfile` | node 20 + Java 17 + xvfb, downloads Forge (`FORGE_URL` build arg) |
| `docker-compose.yml` | binds `127.0.0.1:8088`, low CPU priority + 4 GB cap so staging stays responsive |
| `server.js` | API + static files + one-at-a-time job queue, history in `data/history.json`, brews (deck + versions + runs) in `data/brews.json` |
| `forge.js` | writes `.dck` files, spawns `java -jar forge-gui-desktop…jar sim`, parses `Game N ended…` lines |
| `meta.js` | MTGGoldfish / MTGTop8 / EDHREC / Moxfield / Archidekt readers (6h in-memory cache) |
| `sideboard.js` | best-of-three: one Claude call (Opus 5.5, `ANTHROPIC_API_KEY` in `.env`) writes both sides' plans per pairing, clamped to what the lists allow, cached in `data/plans.json`. Without a key, games 2–3 play game 1's lists |
| `realdata.js` | real tournament results from the open Jiliac/MTGODecklistCache archive (Melee + topdeck.gg paper events), each deck filed under its nearest meta archetype; cached in `data/realdata/` |
| `calib.js` | the calibration model: one "how much Forge overrates this deck" number per archetype, fit across every pairing with both Forge and real results. Fed weekly by a low-priority top-10 round robin plus the benchmarks; stored in `data/calibration.json` |
| `codex.js` · `terms.js` · `claude.js` | the Codex: cards (Scryfall), archetypes (the field's lists, paper results, your runs), hand-written terms, characters (MTG Wiki / franchise wikis, summarised). Model-written parts and members' notes kept in `data/codex.json`; Scryfall lookups cached in `data/scryfall.json` |
| `coach.js` | the coach (Opus 5.5): after each finished run, the readout's weakness, two or three fixes (swaps checked against the list and format before they get a "Test it" button) and a summary that opens the thread; then chat, answered from the brew's full context. Thread lives on the brew in `data/brews.json` |
| `cardstats.js` | card-level stats from Forge's game log (the sim no longer runs `-q`): per card, games cast, first-cast turn, win rate when cast vs not, damage to opponents, discards; per opponent, the cards you lost to most. Kept as per-pairing aggregates on brew runs in `data/history.json`; the raw log is parsed per game and dropped |
| `usage.js` | what the model costs, per person: every Anthropic call's token counts (from the API's `usage`) and its price, one line each in `data/usage.jsonl`, attributed through AsyncLocalStorage (`usage.as({ who, kind }, fn)`). Also the run/question events the daily limits count. Admins see it at `/usage.html` |
| `public/` | the UI: Design's brewer v3 (`index.html` + its `support.js` runtime), wired to the API in the page's `x-dc` script block |
| `package.json` | only marks the sim as CommonJS, so it runs locally under the repo root's `"type": "module"`; not copied into the image |

## Deploy

`mtg sim/deploy.sh` (tar-over-ssh, then `docker compose up -d --build` on the NAS
at `/volume2/docker/starshard-sim`). The first run asks for your Star Shard
username and your friends' usernames and writes them to `.env` on the NAS.

### Accounts

Sign-in uses the same accounts as Star Shard/Manzil. The sim passes the
username and password to the Star Shard API on the NAS (loopback only, port
4001), keeps the session token it gets back, and re-checks it every minute, so
logging out of Star Shard or resetting a password ends the sim session too.
Nothing about Star Shard itself changed.

Only usernames in `SIM_USERS` get in (anyone else with a Star Shard account sees
"ask Justin to add you"). `SIM_ADMINS` can cancel other people's runs. To add a
friend: they make a Star Shard account, then edit `.env` on the NAS and
`sudo docker compose up -d`. The container uses host networking because the
Star Shard API only listens on the NAS's own loopback.

DSM → Control Panel → Login Portal → Advanced → Reverse Proxy:
`https://sim.starshard.net:443 → http://localhost:8088`, with WebSocket headers
off (not needed), and a Let's Encrypt certificate for `sim.starshard.net`
assigned to it under Security → Certificate.

DNS: GoDaddy, `CNAME sim → wreckroom.nyc` (same as `staging`).

## Newer cards

The default build pins Forge 2.0.15. For the newest sets, rebuild from the
daily snapshot:

```
docker compose build --build-arg FORGE_URL=https://github.com/Card-Forge/forge/releases/download/daily-snapshots/forge-installer-<version>.tar.bz2
```

(The exact file name is in that release's asset list; it changes daily.)

## Caveats

- Forge's AI is decent at aggro/midrange and weak at combo and complex control,
  so treat results as "how the AI pilots these lists", not ground truth.
- Scraping MTGGoldfish / MTGTop8 depends on their HTML; if a list stops
  loading, `meta.js` is the place to fix it.

## Updating Forge

The page tells admins when a newer stable Forge is out (checked daily against GitHub). To update, set `FORGE_VERSION=x.y.z` in the sim's `.env` and rebuild; `docker-compose.yml` passes it to the Dockerfile as a build arg (default 2.0.15).

## Limits

Per person over the last 24 hours, admins exempt: `SIM_RUNS_PER_DAY` (default 4, "Test it" counts), `SIM_ASKS_PER_DAY` (default 25), and `SIM_DAILY_BUDGET` (default $10; once the whole sim has spent that on the model in a day, members can't start runs or ask). Prices default to $4 / $20 per million tokens in/out; override with `PRICE_IN` / `PRICE_OUT` / `PRICE_CACHE_WRITE` / `PRICE_CACHE_READ`.
