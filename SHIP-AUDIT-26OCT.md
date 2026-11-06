# SHIP-AUDIT-26OCT.md — three products, audited separately, prioritised together

*26 October 2026. Three independent code audits of the repo snapshot (tests run, files read,
nothing modified), then one assessment. Star Shard, Manzil and Forge sim were each audited
by a separate pass with no knowledge of the others' findings. Line references are to the
snapshot; `research/audits/` holds the three full reports.*

---

## 0. The verdict

| product | state | distance to a public v1 | the one decision it needs |
|---|---|---|---|
| **Star Shard** | 202/202 tests, API and DB real, UI complete for three tabs. **Its own signup is broken** and the "$19 once" button is a mock. | **5 to 6 working days** of blockers (free web v1) | free, or build checkout (+3 to 4 days) |
| **Manzil (September)** | playable, PvP works, 140 + 36 engine vectors pass, 45 regression markers pass. No error reporting, no legal links, pack of five. | **2 to 3 weeks** to a defensible free launch | ship it as the free daily while v2 is built, or freeze it |
| **Forge sim** | working private tool; real-rules engine; honest fidelity problem (rank correlation with real results near zero); legal shape is fine only as free-core | **6 to 10 developer-weeks** free; +4 to 6 paid | rename, stay invite-only until the other two ship |

**Priority: Star Shard first, Manzil September second, Forge sim capped.** Star Shard is
days from shipping and is the product the other two feed. Manzil's free launch is the
funnel and is weeks. Forge sim is months and its ceiling is legally bounded. This is the
order of distance, and it happens to also be the order of strategic weight.

**The connection work is not a fourth project.** Most of what joins Star Shard and Manzil
is already built and pointed the wrong way (§4). Fixing it is inside Star Shard's blocker
list.

---

## 1. Star Shard

**What exists.** `star-shard/index.html` (171 KB, a synced copy of `Star Shard v4.dc.html`)
with three tabs (tonight, chart, shard), onboarding, add-a-chart, the account sheet, a
paywall mock and a Manzil door. Thirteen engine modules. `starshard-api/server.js` (1,107
lines, Express + MySQL, JWT cookie, 36 routes, rate limits, Resend email). Age gate at 13
worldwide with EEA exceptions, re-checked server-side. Thirty static mansion permalink pages
with OG images. No analytics, which the privacy page correctly claims.

**Tests.** `npm test` 202/202. Bindings 408, none missing. Self-host 3/3 hashes. Engine
self-checks 36/36. Playwright smoke blocked (no browser in the audit sandbox). There is no
API integration suite; the server's routes against a real MySQL are not verified anywhere.

**Blockers.**

1. **Signup fails from the Star Shard page.** `star-shard/index.html:1252` sends
   `{username, birthDate, ...}` with no `five`/`pack`; `server.js:362` requires
   `parseManzilPack` and returns 400. Every account made from Star Shard dies with "could
   not create your account". The birth data it sends is also ignored; `saveBirth` is never
   called, so the reading tier is never populated.
2. **No monetisation exists.** PRODUCT.md §12 decided "one-time unlock". The "$19 once"
   button's handler is `setState({owned: true})` (line 1804); "restore a purchase" is dead.
   No payment provider anywhere (grep 0). Decide: free web v1, or Stripe plus an
   entitlements table.
3. **Server imports probably 404 in production.** `server.js:880` imports `../sigil.js`,
   `../deck.js`, `../astro.js`; `deploy.sh` ships them to `starshard-staging/`, not where
   `BACKEND_REMOTE`'s parent resolves. `PUT /api/sigil` depends on this. Not verified on the
   box; verify first.
4. **Legal pages describe Manzil.** `privacy/index.html:43` opens "To play Manzil you need
   an account"; terms promise a purchase that does not exist; both say export and deletion
   are "built into the product" and no page calls them. Entity, contact and governing law
   unconfirmed.
5. **No password reset or verify-email UI.** Endpoints exist; no page reaches them.
6. **No `<title>`, OG or description** on the Star Shard page. The thing people screenshot
   has no link preview.

**Should-fix.** First load is about 3.2 MB of runtime plus `combos.js` at 1.52 MB (784
cells, one needed) and in-browser Babel of a 171 KB page, on a home-uplink NAS. Zero
`aria-`, zero `alt=`, zero `@media`; 55 font sizes at 9 to 11 px; fixed 470×960 frame.
The 784-cell corpus is live and unread (`RESUME-784.md:5`, about 13 hours to read). Deploy
has a documented restart race, no supervisor, no health endpoint, no backups mentioned.

**Later.** The daily/weekly generative pipeline, the lifetime-rarity line, `fullReading()`
(built, unrendered), reminders (toggle sets state only), Capacitor and IAP.

**Effort.** Blockers 5 to 6 days plus two decisions (checkout; entity). Add 3 to 4 days if
checkout is in. Should-fixes roughly a further week.

---

## 2. Manzil, the September build

**Where it is.** One file, `Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html`,
1.82 MB, 16,892 lines, 308 methods on one component, Babel-transpiled in the browser and
run via `new Function`. Deployed verbatim as the site root `index.html`. Backend is the
same `starshard-api` server; PvP lobby is `lib/manzil-lobby.js`, in-memory.

**What works, with evidence.** Nightly sky from `ephemeris2.js`; the walkers' road (eight
rungs, lives, best-of-three at 5 to 8, handicaps); the boss with 18 station laws; all 28
signatures and five planets; mulligan; PvP with lobby and pass-and-play; sound; tutorial,
how-to-play, glossary; accounts and progress sync; codex and level ring; 27 of 28 houses
open. Telemetry is localStorage only (no server sink). Email exists only as a signup field.

**The "-2 script bug" does not reproduce.** Both `-2` files are in `FRONTEND_FILES` and
load as bare relative paths. The breakage was the retired `manzil/` subdirectory deploy.
Lines 6 to 8 carry a `__mzRetry/__mzHeal` reload hack for that failure; delete it rather
than fix it. `THE-AUDIT-17SEP.md:220` reached the same conclusion.

**Pack of five makes the deal and mulligan dead code.** `_deal` at 6605 returns the bag
unchanged when it holds five or fewer; the cap is hard-coded at six or more sites plus the
`fiveCards` UI. Growing to twelve is a data and UI change, one to two days, not one constant.

**Tests.** `check-manzil.mjs` passes with 5 warnings (22 bound geometry attributes, a
duplicate `"brann"` key). Engine 140/140 and 36/36. `npm test` 202/202 but none of it plays
the game. `fuzz-manzil.mjs` and `qa-loop.mjs` need a browser and the staging host; blocked.
Nothing in CI plays a board headlessly.

**Blockers for a standalone free launch.** Account wall with no pre-signup email capture
and no in-app delete/export (the API has both, `api.js:201`, zero callers). Legal pages
deployed but linked from nowhere. Pack of five. No `window.onerror`, no error sink; the 6 Sep
crash went unnoticed for this reason. PvP is one in-memory process on polling transport
behind a non-upgrading proxy, with server-side report/block and no client UI for it.
Hosting is a residential NAS with cat-over-ssh deploy; the Cloudflare tunnel is still a
runbook. Phone: no safe-area CSS, small type, portrait prompt only.

**Reuse for v2.** The engine port (`research/manzil-engine-current.cjs`, 140 vectors) and
its server twin, the sky and moon-house rule, the accounts and progress API, and the lobby
as a shell all carry forward. The UI shell (string-evaluated JSX, one component, Design/Code
shared seam) should not.

**Effort.** 2 to 3 weeks to a defensible free launch, with staging-side fuzz and QA runs
that the audit could not perform.

---

## 3. Forge sim

**What it is.** A single-file Node server with no npm dependencies, JSON-file storage plus
SQLite for accounts, in Docker on the NAS. Every simulated game is a real rules-engine game:
Card-Forge 2.0.15's AI against itself, with a GPL-3 Java bridge letting `pilot.js` make
some decisions. Client is a 384 KB HTML file mutated by about 25 Python patch scripts. Card
data from Scryfall at runtime; meta decks scraped from MTGGoldfish and MTGTop8 HTML; real
results from the MTGODecklistCache repo. Coach is Opus via the API. A Mac worker and a
nightly launchd shift that pulls the API key over ssh from the NAS `.env`.

**Tests.** 47 tests, 45 pass, 2 skipped (need a Scryfall cache). No route, UI, Forge or
bridge tests. The strategy pilot is behind `SIM_STRATEGY_PILOT=0` because it fails the 55%
mirror gate for all but four decks. Signup is closed. Stripe tables exist with no Stripe code.

**The fidelity problem is the product problem.** The team's own 23 Oct handoff: mean error
11.6 points, rank correlation with real results near zero; it "can't rank the field".
Same-seed paired A/B (v7 vs v6 on identical shuffles) is the honest use and is working.
Positioned as a test bench for changes it is novel; nothing in Moxfield, Archidekt, 17Lands
or Untapped does that. Positioned as a predictor it loses the trust argument on day one.

**Legal and IP, frankly.** Card names, Oracle text, legality and hot-linked images from
Scryfall are fine, and the Fan Content disclaimer is already in the footer. Running GPL-3
Forge server-side is fine; the bridge and patches are GPL derivatives, which only bites if
the worker is ever shipped to customers (then its Java source must be offered). The WotC
Fan Content Policy requires fan content to be free; the defensible shape, which Moxfield,
Archidekt, Untapped and 17Lands all use, is free core (every card, every list, every
legality check, free and anonymous) with paid tiers selling only your CPU and LLM time.
Never "MTG" or "Magic" in the name or logo. **The name "Forge" is the engine's name**; a
product called Forge sim reads as an official Forge product and should be renamed before
anyone outside the friend group sees it. Scraping Goldfish and Top8 is fragile and a
plausible cease-and-desist once public; the MTGODecklistCache source already in use is the
licensed replacement. Mana symbols via the Mana font is tolerated ecosystem practice, not a
right.

**Blockers, free.** Open signup and drop the Star Shard SSO coupling. Terms, privacy, data
export, cookie note, self-hosted fonts. Rename and attribution page. Replace the scrapers.
Move queue and brews to SQLite WAL (a single hot JSON rewritten on every save will corrupt
under contention). Containerise the workers and remove Mac hard-coding and the ssh-pulled
key (rotate it). Compute: about 6 s a game, 700 MB to 1.5 GB per Forge process, three NAS
slots; ten concurrent users saturate the box.

**Blockers, paid.** Stripe with tax and refunds; credits tied to measured CPU; per-plan LLM
metering (the daily budget is $10 shared across everyone); dedicated compute.

**Effort.** 6 to 10 developer-weeks to a credible free public v1; 4 to 6 more for paid, plus
compute cost that scales with games played.

---

## 4. How Star Shard and Manzil connect

The connection exists. It is pointed the wrong way.

**What is already shared.** One `users` table, one API, one session cookie (the lobby
consumes it), one account portal (`account/index.html`), one deploy script, one design
runtime and type pairing, one privacy and terms pair. Manzil already writes Star Shard's
birth tier on signup so a reading unlocks "with no second birthday prompt"
(`V2:16273`). Star Shard has a door to Manzil, "the covered well" (`index.html:240`).

**What is wrong.**

- Signup is Manzil-shaped: it requires the five chart cards, so Star Shard cannot create an
  account at all (§1 blocker 1).
- The portal titles itself "the account manzil and star shard share" and then calls its
  heading "manzil" and hands off into Manzil on three paths. Star Shard is a guest in its
  own account page.
- Star Shard's door to Manzil is forced off (`gameNightOn: false`, line 1807). Manzil's link
  back to Star Shard is a broken href to `Star Shard v4.dc.html`, a file that is not
  deployed; its codex links to `https://starshard.net`, where the root is Manzil.
- Manzil owns the site root; Star Shard lives at `/star-shard/`. The legal pages are
  Manzil-first.
- **The two products run different moon engines.** Manzil uses `ephemeris2.js` (truncated
  Meeus, 32 terms); Star Shard uses `astro.js`. I compared them at 21:00 New York for 730
  consecutive nights from 1 Oct 2026: maximum longitude difference 0.08°, and **four nights
  in two years where they name different mansions**. On those nights the game and the
  reading would disagree about where the Moon is. One engine, or one shared `tonight`
  endpoint, fixes it.

**The design.**

1. **One identity, one root object.** The account is a Star Shard account; the natal chart
   (`birth_data`) is the root. The Manzil pack is derived from the chart server-side
   (`manzil_pack` becomes a view or a cached derivation), never a signup requirement. This
   is the same change as Star Shard blocker 1.
2. **One sky.** Expose `GET /api/tonight` from the server using `astro.js` (the tested
   engine, 202 tests) and have both clients read it, with `ephemeris2.js` kept only as the
   offline fallback and checked against the endpoint. The 730-night comparison becomes a
   test.
3. **Roots and doors.** `starshard.net` is Star Shard. Manzil lives at `/manzil/` or
   `play.starshard.net`. The covered well opens: on the tonight tab, one line says which
   mansion the Moon is in and that it is playable tonight. In Manzil, the codex entry for a
   mansion links to its Star Shard permalink page (the thirty static pages already exist),
   and the night-end screen offers the reading for tonight's mansion.
4. **The funnel, as built objects.** Manzil is free and asks for nothing until a player has
   played a night; then the account cast asks for the birth data the game needs anyway, and
   the chart is complete. That is the funnel: a Manzil player who signs up is already a Star
   Shard user with a populated chart. Star Shard's paid unlock, when it exists, is what the
   funnel sells. Email capture before signup (Manzil blocker) is the list.
5. **One legal pair, one portal copy.** Privacy and terms describe one service with two
   surfaces; the portal is Star Shard's, with Manzil as a tab.

All of this is inside the Star Shard blocker list plus two Manzil items, roughly three days
of the five to six.

---

## 5. The order

| when | what | why |
|---|---|---|
| **week 1** | Star Shard blockers 1, 3, 4, 5, 6; decouple signup; de-Manzil the portal; `GET /api/tonight`; decide checkout | days from shipping; the connection work is inside it |
| **week 2** | Star Shard ships as free web v1 at the root; Cloudflare tunnel in front of NAS and API (shared by all three) | the tunnel is a shared blocker and the first real deploy hardening |
| **weeks 2 to 4** | Manzil September: pack of twelve, email capture, delete/export UI, error sink, legal links, open the doors both ways; fuzz and QA on a real browser | the free funnel; two to three weeks of the audit's estimate |
| **week 4** | Manzil ships as the free daily at `/manzil/`; the video cadence starts | there is now somewhere to send people |
| **throughout** | the v2 night shift runs from `BACKLOG.md`; Forge sim gets its night shift and a rename and nothing else | D1 stands; v2 lands into an audience |
| **after** | Forge sim free public v1 if the friends still want it, 6 to 10 weeks, free-core shape | legally bounded ceiling; last in line |

Two things only you can settle this week: whether Star Shard v1 is free or has checkout,
and the legal entity and contact that go on the pages. Everything else above is a work item.

---

## 6. Files

- `research/audits/star-shard-audit-26oct.md`, `manzil-sept-audit-26oct.md`,
  `forge-sim-audit-26oct.md`: the three full reports with every line reference.
- `research/audits/ephemeris-compare.mjs`: the 730-night comparison; run with `node`.
