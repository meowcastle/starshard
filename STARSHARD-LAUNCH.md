# STARSHARD-LAUNCH.md — Star Shard goes live at starshard.net

**26 October 2026.** Priority one. Star Shard ships as a free astrology web app at the root
domain, with a real account system and a desktop-class interface, as soon as the blockers in
`SHIP-AUDIT-26OCT.md` §1 are closed and the new interface passes its gates. Manzil follows
(§2 of the audit). Forge sim is renamed and maintained (§6 below). This document is the
brief; `BACKLOG.md` is the work queue the night shift runs from.

Decisions taken today: the agent builds the new interface in code (not a Design-tool
export); v1 is free, checkout comes second; the rename direction for Forge sim is a
workshop word.

---

## 0. The law: the best version forward

The live game at staging (`Manzil - Game Prototype V2.dc.html`) is the finish bar for the
whole app: the lobby with the road in perspective, the lives as moons, the board fanned under
the walker, the constellation-faced cards, the hover that speaks in the game's voice. Nothing
built for starshard.net ships below that bar. Three rules follow.

1. **A mockup never stands in for a real asset.** Where a drawing and the shipped thing
   disagree, the shipped thing wins; the drawn boards on the design canvas are structural
   proposals for the pages around the game, not the finish.
2. **Every page is judged next to the game before it goes live.** The launch gate includes
   Justin looking at each shell page beside the live lobby and board. A page that reads as
   a lesser product than the game is not done.
3. **The newest shipped surface is the reference, always.** When two versions of a thing
   exist, the one that went furthest is the one presented, built on, and shown first. This
   is how the v4 calm pass and the August design system were both superseded by V2, and it
   is the check to run before any future handoff.

---

## 1. What "live" means

A stranger types `starshard.net`, sees tonight's sky and understands within ten seconds
what this is, enters their birth data, gets their chart and their shard, makes an account
to keep it, comes back tomorrow for the daily, and can read about any of the 28 mansions
from a page that ranks in search. On a phone and on a 27-inch monitor. With a title, a
link preview, a privacy page that describes this product, a password reset that works, and
an account page where they can export or delete their data. No payment, no Manzil in the
way, no fake buttons.

Not in v1: checkout, the generative daily/weekly, the lifetime-rarity line, reminders, the
app wrapper. Each has a place in `BACKLOG.md` after launch.

---

## 2. The interface

### 2.1 What we take from astro.com and the Jovian Archive

Both are reference points for different reasons, and neither is a model to copy.

**astro.com** is the proof that depth sells: free charts of real accuracy, a horoscope
that reads as written by a person, an enormous reference library, and a layout that has
not changed in twenty years because the people who use it are there for the content. What
to take: the chart is the hero and is drawn properly; every technical term is one click
from its explanation; the free tier is useful on its own; the site is a reference people
return to. What to refuse: the density, the 1998 chrome, the sense that the site is a
database with a front end.

**Jovian Archive** (Human Design) is the proof that a system with its own vocabulary can be
sold to a mass audience if the first screen is a single striking object (the bodygraph), the
language is introduced one noun at a time, and the paid depth is visibly deeper than the free
surface. What to take: one iconic object on screen one, a confident voice, a clear ladder
from free to paid. What to refuse: the mysticism without the astronomy; Star Shard's whole
claim is that the sky on screen is the real sky tonight.

Star Shard's version: **the instrument**. UX-FLOW.md already said it: the surface should read
as a machine that is reading the real sky right now, not a journal. The chart wheel and
tonight's Moon position are the two objects that prove it, and they are live.

### 2.2 The look is Manzil V2's (26 Oct). The "one app" half is superseded: since 6 Nov the three are separate products, see SEPARATION.md

`DESIGN-SYSTEM.md` (11 Aug) specified a teal-and-cream retro system. The build that actually
shipped, `Star Shard v4.dc.html` (the 18 Aug "calm pass"), dropped it: warm near-black
radial ground (`#1E1706` to `#080502`), parchment text `#F2EAD6`, gold accents `#F0D89A`,
muted `#9A8A5E`, amber `#FFB000` for whatever is live or lit, Cormorant Garamond 600 for
headings, Varela Round for everything else, lowercase copy, outlined ghost buttons, 1 px
hairlines, no radius, a faint starfield. The look then kept developing inside Manzil V2 (22 Sep, `Manzil - Game Prototype
V2.dc.html`): the same palette with far more amber, **Karla** replacing Varela Round, the
avatar and player-chip system, a lamp-lit horizon scene in the lobby that changes with the
real hour, lives drawn as the moon's last three nights, a codex, and a built-in shard reveal.
Justin's call: **that is the brand, and starshard.net is one app in it.** Tonight, your
chart and your shard are sections beside the game; the codex carries the station corpus;
one account, one sky, one codex. DESIGN-SYSTEM.md's palette and type are retired; its
spacing grid and accessibility floor stand. The reference is the "Star Shard Web App"
design canvas, fourteen boards with every number real: home (the lobby), tonight, chart,
shard, codex index, a station page, the play board inside the shell, account, and six
phone screens including arrival and sign-in. The night shift builds to it. V2's
illustrated scenes, avatars and animations are reused from the V2 file, not redrawn. The
vocabulary a visitor reads is **station**, not mansion.

### 2.3 The map

`APP-FRAMEWORK.md` is binding: three persistent sections, no dashboard, drill-down within
each. On desktop the three sections are a text nav in the header (☾ tonight · ☉ your chart ·
✦ your shard, as v4 names them) over a twelve-column page; on phone they are v4's tab bar.

| section | desktop | what is on it |
|---|---|---|
| **Home** | the lobby: V2's horizon scene, tonight's station as the headline, walk / read / codex | the front door for signed-out and signed-in alike; the player chip with avatar and ring count |
| **Codex** | an index of 28 stations and one page each | where the research lives: the four skies, born under it, when the moon crosses, what the books say, the card and its signature, the walkers, sources. These are the public pages search finds, replacing the generated `mansions/` output |
| **Play** | the September game at `/play`, its own page, same session, same sky | the V2 file as shipped, until the TCG rebuild replaces it |
| **Tonight** | the live sky as a wide panel: the Moon's mansion, its degree, the planets' positions, the next crossing | the real sky now; the daily reading when it exists; the door to Manzil (one line, "playable tonight") |
| **Chart** | the wheel, large, drawn in SVG from `astro.js`; houses, aspects, the planet table beside it | every term is a hover or a tap away from its definition; the 28 mansions overlaid on the wheel as the thing no other chart shows |
| **Shard** | the reading, set as long-form text at 65 characters a line | the first-run reveal from UX-FLOW stays as a one-time sequence; after that the shard is a document you return to |

Plus: an **account** page (profile, charts, export, delete, password), **sign in / sign up /
reset** as real pages with real URLs, the **28 mansion pages** (already generated, now in
the site's chrome and linked from the Chart), **privacy** and **terms**, and a **landing
state** for the signed-out visitor that shows tonight's sky before asking for anything.

### 2.4 The first run

UX-FLOW.md's seven screens stand for first-time arrival: burst, story, entry, compute, the
shard revealed, one familiar thing at a time, no coined noun before its meaning has been
felt. Build it as a route with steps, not as twelve page swaps. The account prompt comes
after the shard is revealed, with the reason stated: keep this, and tomorrow's.

### 2.5 Build decisions

- **Stack:** React 18 (already a dependency), esbuild (already a dependency) producing a
  static bundle; no in-browser Babel, no dc-runtime, no `new Function`. CSS as a token sheet
  taken from v4's values (§2.2) with DESIGN-SYSTEM §3's spacing grid. The engine modules (`astro.js`, `sky.js`, `stations.js`,
  `reading.js`, `transits.js`, `findings.js`, `format.js`, `tz.js`) are imported as they are;
  they have 202 tests and are not rewritten.
- **Where it lives:** `app/` in the repo, built to `dist/`, deployed to the site root.
  Manzil's September build is served at `/play` as its own page (no shell chrome over the
  stage; its lobby's back link returns to the shell). `star-shard/` and the Star Shard
  `.dc.html` files are retired after launch (moved to `_to_delete/`), not before. The V2
  game file is not retired; the TCG rebuild replaces it later.
- **The chart wheel** is drawn to scale in SVG from the engine's longitudes; one component,
  tested against three known charts.
- **`combos.js`** (1.5 MB) is split per cell and fetched on demand. First load target under
  600 KB on a phone, under one second to first paint on broadband.
- **Accessibility floor:** real buttons, labels, focus states, 14 px minimum body on phone,
  contrast checked against the teal ramp. The current build has zero `aria-` attributes;
  the new one has them from the first component.
- **Tests:** Playwright smoke per route, run against a local static server (unblocks the
  gate that has been dead since August), plus the existing 202.

---

## 3. Accounts

The blockers from the audit, closed in order:

1. Signup is decoupled from Manzil: `five`/`pack` optional on the server; the pack is derived
   from `birth_data` when Manzil asks for it. Star Shard signup writes `birth_data`.
2. Forgot password, reset, verify-email landing: real routes in `app/`.
3. Export and delete: buttons on the account page calling the endpoints that already exist.
4. Age check runs first, before any field is shown, as the account portal already does.
5. Sessions, rate limits and CORS stay as built; `ALLOWED_ORIGINS` gains the root domain.
6. `GET /api/tonight` from the server using `astro.js`, consumed by both products; the
   730-night comparison in `research/audits/ephemeris-compare.mjs` becomes a test.

---

## 4. Going live

- **Hosting:** the NAS stays for v1 behind a Cloudflare tunnel (the runbook exists in
  `docs/CLOUDFLARE-RUNBOOK.md`); `TRUST_EDGE_HEADERS=1` once it is on. The deploy script
  gains a health check and loses the restart race. A second environment, `staging`, is kept
  for the night shift; production is `starshard.net`.
- **Domain:** root is Star Shard; `/manzil/` is the game; `api.starshard.net` is the API.
- **Legal:** privacy and terms rewritten Star Shard-first, one service with two surfaces.
  Entity and contact confirmed by Justin.
- **Metadata:** title, description, OG image per chart and per mansion page; sitemap
  includes the root and the 28 mansion pages.
- **Launch gate:** all 202 tests; Playwright smoke green on every route at phone and
  desktop; every shell page reviewed by Justin beside the live lobby and board (§0); a stranger's path (land, enter birth data, read the shard, sign up, sign out,
  reset password, sign in, export, delete) completed on production by a human; Lighthouse
  performance and accessibility both above 90 on the Tonight route.

---

## 5. Promotion, the first thirty days

The product is being promoted as an astrology app. The assets already built for that:

- **The 28 mansion pages.** The only indexed content on the Moon's mansions written for a
  general reader, each with an OG image. These are the search funnel. Link them from the
  Chart section and from every video.
- **The sky videos** (`CONTENT.md`): the first twelve weeks' scripts pivot to Star Shard
  first. Each video ends on tonight's mansion and the URL. Manzil is mentioned when it is
  live, not before.
- **Suyin's audience.** `PLATFORM.md` notes the plan once assumed her roughly 13M monthly
  impressions and no longer does. If that channel is available even once, the launch week
  is when to use it. If not, the videos are the channel and nothing in the plan depends on
  her.
- **Launch posts:** r/astrology and r/AskAstrologers tolerate free tools that are honest
  about what they compute; Product Hunt is worth one morning; the Human Design and
  traditional-astrology communities are the two audiences that will care that the Moon's
  mansions are real astronomy.
- **The daily** is the retention mechanism and does not exist yet. The email reminder
  channel (Resend is already wired) is the first post-launch packet, because a free product
  with no reason to return has no second day.

---

## 6. Forge sim: the rename

The engine the product runs on is called Forge. The product cannot be. Direction chosen:
a workshop word, something that says what it honestly is, a place to test a change.

| candidate | why | check before use |
|---|---|---|
| **Bench** | a test bench; "put it on the bench"; short, plain, the verb is free | domain availability; "Bench" is a common software name, so pair it: *Deck Bench* |
| **Gauntlet** | run your deck through the gauntlet; names the whole-field run honestly as a trial, not a prediction | one established MTG use (the "gauntlet" format in casual play) is a feature, not a conflict |
| **Proving Ground** | says exactly what the paired test is | long; works as a tagline better than a name |

Recommendation: **Deck Bench** as the working name, with "a test bench for deck changes,
not affiliated with Forge or Wizards of the Coast" as the first line of the about page.
Justin names it; this is a taste call and sits in the decisions queue.

What Forge sim gets regardless of name, as maintenance packets in `BACKLOG.md`: the rename
in code and docs, the API key no longer pulled over ssh (and rotated), the Goldfish/Top8
scrapers replaced by the licensed MTGODecklistCache source, and the honest fidelity label on
every whole-field number. Nothing else until Star Shard and Manzil are live.

---

## 7. Sequence

| when | what |
|---|---|
| **nights 1 to 3** | account decoupling, `/api/tonight`, legal rewrite, metadata, Cloudflare tunnel runbook executed by Justin |
| **nights 2 to 10** | `app/` scaffold, token sheet, Tonight, Chart (wheel), Shard, first run, account routes, mansion pages in chrome; Playwright per route |
| **nights 10 to 14** | performance pass, accessibility pass, the stranger's path, launch gate |
| **day 14, give or take** | `starshard.net` is Star Shard. Manzil moves to `/manzil/`. Videos start. |
| **after** | email reminders, then checkout, then the daily; Manzil September blockers per audit §2; v2 sim track continues underneath |

Two weeks is the honest estimate for a solo build run nightly by an agent with a human
merging each morning. It assumes Justin's decisions land on day one (entity, contact,
domain DNS) and that the tunnel is up by night three.
