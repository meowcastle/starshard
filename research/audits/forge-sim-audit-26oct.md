# Forge sim — ship-readiness audit (26 Oct 2026)

*Independent code audit of `mtg sim/` in the repo snapshot. Tests run; nothing modified. Companion to `SHIP-AUDIT-26OCT.md` §3. Policy claims cite URLs at the end.*

## Architecture

- **Server:** single-file Node HTTP server, no npm deps (`server.js`, 2,579 lines, hand-rolled router at 1829-2560). Storage is JSON files via `store.js` (`data/brews.json`, `history.json`, `calibration.json`, `scryfall.json`) plus `node:sqlite` for accounts/sessions/credits ledger (`accounts.js:33-62`). Runs on the Synology NAS behind DSM reverse proxy, loopback-only, host networking (`docker-compose.yml`). Dockerfile: `node:24-bookworm-slim` + OpenJDK 17 + xvfb; downloads Card-Forge 2.0.15 from GitHub and compiles the pilot bridge against its jar (`Dockerfile:17-34`). Deploy = `deploy.sh` tar-over-ssh to `justin@wreckroom.nyc`, `docker compose up --build`.
- **Engine:** not a statistical model. Every game is a real rules-engine game: Forge's AI vs Forge's AI via `forge sim` CLI, or via a GPL-3 Java bridge forked from zachmay/mtg-bench (`forge-pilot/README.md:5-8`) that lets `pilot.js` own some decisions (mulligans, sideboarding, a few per-archetype rule sets). Also a patched Forge class (`forge-patch/SimulateMatch.java`) and an AI profile (`forge-ai/Control.ai`).
- **Client:** one 384 KB `public/index.html` on a custom dc-runtime React 18.3.1 wrapper (`public/support.js:1143`), modified by about 25 Python patch scripts (`tools/patch_*.py`); PWA with service worker and web push. Fonts from Google; mana symbols from `mana-font@latest` on jsDelivr (`index.html:19`).
- **Card data:** Scryfall API at runtime (`meta.js:164-208`, `cards.js:23-82`), cached to `data/scryfall.json`; `/api/img` 302-redirects to Scryfall CDN (`server.js:1999-2007`). Meta decks scraped from MTGGoldfish and MTGTop8 HTML (`meta.js:44-87`), EDHREC JSON, Archidekt API; Moxfield blocked (403, `meta.js:114`). Real results from the Jiliac/MTGODecklistCache GitHub repo (`realdata.js:17`).
- **Mac worker:** `worker.js` polls `/api/worker/claim` with a bearer token and plays pairings with a local Forge; optional (NAS plays `SIM_PARALLEL=3` itself). `tools/update-worker.sh` copies files into `~/forge-worker/app` and restarts a launchd job.
- **Nightly shift:** `tools/nightly-engine.sh` via launchd at 01:00 on the Mac; hard-codes `/Users/justinbjur/Desktop/starshard.net` and `justin@192.168.1.117`, pulls `ANTHROPIC_API_KEY` from the NAS `.env` over ssh (line 44). Research tooling; production does not depend on it.
- **Accounts/email:** scrypt passwords, 60-day session cookie (HttpOnly/Secure/SameSite=Lax, `server.js:158`), optional Star Shard SSO, email codes via Resend, bounce webhook. Coach = Anthropic API (`COACH_MODEL=claude-opus-5-5`, `config.js:53`).

## Tests

`npm test` (`node --test test/*.test.js`), zero install: 47 tests, 45 pass, 0 fail, 2 skipped (strategy read and obstacle ranking need a Scryfall cache in `DATA_DIR`). Coverage: score math, calibration, accounts, collection parsing, legality, store durability, weekly digest, paired tests. No tests for `server.js` routes, the UI, Forge integration, or the bridge Java.

Flags (`config.js`): `SIM_STRATEGY_PILOT=0` (E4 strategy pilot off until mirror gate passes, `server.js:1332-1337`); `SIM_PILOT` on (only 4 decks have accepted profiles, `forge-pilot/policies.json`); `SIM_SIGNUP=closed`; `SIM_GAME_LOG=background`; `TCG_AFFILIATE`/`CK_PARTNER` unset; all plans `charges: 0`, Stripe tables exist but no Stripe code (`accounts.js:30`, `server.js:142`).

## Feature inventory

| Feature | State | Evidence |
|---|---|---|
| Real-rules simulation, Standard 60/15, Bo3 with LLM-written sideboard plans | working | `forge.js`, `sideboard.js`, `server.js:492` |
| Pioneer/Modern/Legacy/Vintage brews; Commander 4-seat pods | partial (legality checked; field only for Standard/Commander) | `server.js:58`, `:432` |
| Card coverage | whatever Forge 2.0.15 scripts (near all printed cards); 4 known "dead" cards the AI never casts | `forge-pilot/dead-cards.json` |
| Fidelity | weak: k=0.07 on 1,063 real games (`ENGINE-STATUS-13OCT.md` §2); 23 Oct: "mean error 11.6, rank correlation ≈ 0, can't rank the field" (`HANDOFF-TO-CODE-23OCT:§0`). Same-seed paired A/B is the honest use | |
| Calibration to real results (per-deck bias) | working | `calib.js` |
| Paired tests (v7 vs v6, same seeds, SPRT) | working, new (P1) | `paired.js`, `server.js:2495` |
| Strategy read E0, obstacles E5, telemetry E2/E3, matchups E7 | partial / fresh (P2-P4, P6 patches 23 Oct) | `strategy.js`, `obstacles.js`, `telemetry.js` |
| Strategy-aware pilot E4 | behind flag, unproven | `SIM_STRATEGY_PILOT` |
| Coach (Opus): write-up per run + chat, acts with Undo | working; numbers server-side, prose from model | `coach.js:1-40`, `server.js:2325-2390` |
| Import: paste/upload/Archidekt/Goldfish/Top8 links; Moxfield paste-only | working | `meta.js:107-135` |
| Export: Arena/text/Archidekt via clipboard | working (copy only) | `FUNCTION-INVENTORY:Decks` |
| Buy links: TCGplayer + Card Kingdom; affiliate codes via env, suppressed for owner/admins | working, codes unset | `meta.js:334-340`, `server.js:2036-2037`, `index.html:1390-1396` |
| Collection (ManaBox/Moxfield CSV), brew-from-collection | working | `collection.js` |
| Journey loop (bring → run → fix → test → keep → paper checklist → log) | partial | `JOURNEY-TEST-LOOP-20OCT.md` |
| Arena Player.log reader on the Mac | working, owner-only | `arena.js` |
| Accounts, email codes, delete account, credits ledger | working; billing stub | `accounts.js`, `server.js:2028` |
| Share links (public plan pages), push, weekly reruns | working | `server.js:1988`, `:2422`, `weekly.js` |

## Legal and IP

**Clearly fine.** Card names, Oracle text, legality, prices from Scryfall; images hot-linked from Scryfall CDN (unlimited per Scryfall's API docs). The Fan Content disclaimer is already in the footer verbatim (`index.html:720`) as the policy requires. Rate-limit discipline (100 ms, 429 backoff) in place. Using Forge as a backend is legal: Forge is GPL-3.0; you run it as a separate process; running GPL software server-side imposes no obligation on your Node code.

**Risky.**
- GPL derivative work: `forge-pilot/bridge/` (from mtg-bench, GPL-3), `forge-patch/SimulateMatch.java` and `Search.java`/`GameLog.java` link against Forge's jar and are GPL-3 derivatives. Plain GPL has no network-use clause, so SaaS use is permitted without releasing source; if you ever ship the worker/bridge jar to users you must offer that Java source under GPL-3. `LICENSE` is present; keep the `starshard:` markers.
- The name "Forge": Forge is the established name of the engine you depend on. "Forge sim" reads as an official Forge product; also collides with many software marks. Rename before public launch.
- Scraping MTGGoldfish/MTGTop8 HTML: ToS not verified; both are ad-funded and have broken scrapers before. Fragile and a plausible cease-and-desist target once public.
- Mana symbols / set symbols: Wizards' FAQ lists mana symbols among trademarks requiring permission; the ecosystem (Moxfield, Archidekt) uses the Mana font anyway. Tolerated practice, not a right.
- Arena log reading: WotC exposes "Detailed Logs (Plugin Support)" for trackers (17Lands, Untapped rely on it); your reader is owner-only and parses no opponent names. Low risk; Arena EULA position not verified by URL.
- Affiliate links: the Fan Content Policy allows sponsorship/ads/donations and is silent on affiliates. TCGplayer/CK affiliate programs are the common path. Disclose on page. The owner-exclusion rule you built is correct.

**Disqualifying for a paid product as designed.** The policy says fan content must be free (no subscription, payment or registration required for access), and Scryfall says you may not paywall its data. The `member` plan (`accounts.js:32`) gates simulation minutes and the coach, not card data; that is the same shape as Moxfield Patreon, Archidekt Premium, Untapped Premium, 17Lands Pro: free core, paid convenience/compute. Defensible only if: every card image/text/legality stays free and anonymous-or-free-account; paid tiers sell CPU and LLM time, never WotC content; no WotC logos or "Magic" wordmark in branding; no proxy printing. "Print as table cards" matchup plans must not render card images that could look like proxies. "MTG"/"Magic: The Gathering" in the product name or logo: not allowed (nominative use in descriptive text is fine).

## Blockers (free public)

1. Sign-up closed and SSO-coupled: `SIM_SIGNUP=closed`; login path calls the Star Shard API; `SIM_USERS` empty = nobody can log in (`server.js:81`, `:1829-1850`).
2. No Terms or Privacy page; delete-account exists but no data export (GDPR Art. 15/20), no cookie/consent note, Google Fonts leaks IPs (EU).
3. Compute: about 6 s/game median, 200-game whole-field run 30 min to 2 h on 3 NAS slots; each Forge process 700 MB to 1.5 GB. Ten concurrent users saturate the NAS. Queue is in-process memory + JSON (`brews.json` rewritten on every save, `server.js:345`): a single hot file that will corrupt under contention.
4. Hosting coupling: host networking, loopback bind, Synology-specific `cpu_shares`, Mac-only nightly with hard-coded paths and ssh-pulled API key.
5. Abuse: `/api/import` and `/api/meta` let any user make the server fetch arbitrary Archidekt/Goldfish URLs (SSRF surface, `meta.js:107-135`); 10 MB body cap exists; login throttle is in-memory per IP (`server.js:153-157`), lost on restart.
6. Scraper dependency on Goldfish/Top8 for the field: one markup change = no opponents.
7. UI maintainability: a 384 KB HTML file mutated by Python regex patches is not a release process.

## Blockers (paid)

- No Stripe (tables only). Billing, refunds, tax, credits tied to real CPU cost.
- LLM spend: `SIM_DAILY_BUDGET=10` dollars shared across all users; coach on Opus per question is the dominant marginal cost; must be metered per plan.
- Must satisfy the free-core structure above and publish affiliate disclosure.
- Dedicated compute (16 to 32 cores or spot workers) and a job queue (Redis/SQLite WAL) replacing the Mac worker.

## Should-fix

- Rename; add "not affiliated with Forge or Wizards".
- Move Scryfall to the daily bulk file instead of live search (Scryfall's recommendation).
- Replace Goldfish/Top8 scraping with the already-used MTGODecklistCache for the field.
- Honest fidelity label on every whole-field number; the handoff already demands this.
- Secrets: stop ssh-copying `ANTHROPIC_API_KEY` in the nightly; rotate it.
- Route tests for `server.js`; CI running `npm test` + a smoke Forge game.

## Later

- E4 strategy pilot (fails the 55% mirror gate for all but 4 decks).
- Pioneer/Modern fields, Commander calibration (no real data).
- Binder/collection value, print layouts, team pods.

## Competitive position

Nothing in Moxfield/Archidekt/17Lands/Untapped/Arena Tutor plays full-rules AI-vs-AI games of your list against the current meta and A/B-tests a card swap on identical shuffles; that paired-test loop plus an LLM coach fed with engine telemetry is novel, and the "What stops it → Try" obstacle search is a strong idea. The caveat is the one the team's own numbers state: absolute win rates have about zero rank correlation with real results, so the product cannot claim "your deck is 54% against the field"; it can claim "v7 beats v6 vs Dimir by +9 (±6) on the same games." 17Lands/Untapped have real human game data at scale; you have a weak AI pilot and 1,063 real games for calibration. Position it as a test bench for changes, not a predictor.

## Effort to ship (public free v1)

| Item | Size | Priority |
|---|---|---|
| Open signup, drop Star Shard coupling, email verification | S | blocker |
| Terms, Privacy, data export endpoint, cookie note, self-host fonts | S-M | blocker |
| Rename; Forge/Wizards/Scryfall attribution page; affiliate disclosure | S | blocker |
| Replace Goldfish/Top8 scraping with licensed source | M | blocker |
| Queue + brews to SQLite (WAL), persist jobs, restart-safe | M | blocker |
| Containerise workers; remove Mac/nightly hard-coding; secrets handling | M | blocker |
| Compute plan: per-user quotas tied to measured CPU; cheaper default (100 games, top 8) | M | blocker |
| Route/API tests, CI, smoke game | M | should |
| Build pipeline for the UI (retire patch scripts) | L | should |
| Stripe + credits + tax | L | paid-only |
| E4 pilot, more formats | XL | later |

Rough total to a credible free public v1: 6 to 10 developer-weeks; paid: +4 to 6 weeks plus compute cost scaling linearly with games played (about 0.5 to 1 CPU-minute per game-pair at today's engine).

Sources: WotC Fan Content Policy https://company.wizards.com/en/legal/fancontentpolicy · Scryfall API docs https://scryfall.com/docs/api · Card-Forge (GPL-3.0) https://github.com/Card-Forge/forge · Untapped companion safety note https://help.hearthsim.net/en/articles/7121040-is-the-untapped-gg-companion-safe-to-use (Arena EULA not verified).
