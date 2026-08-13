# Star Shard — Product Audit & Competitive Strategy

**Prepared for:** Justin Bjur / Bjur Media LLC · August 11, 2026
**Scope:** `~/Desktop/starshard.net` (2 commits, deployed to `staging.starshard.net`; `starshard.net` is still a GoDaddy "Launching Soon" page)

---

## 1. What it is

Star Shard is a **kawaii Windows-95 desktop simulation that computes a real natal chart and returns it as four collectible "shards."**

The user lands on a purple gradient desktop with a taskbar, a Start menu, draggable/resizable/minimizable windows and a marquee banner. They open `shard reader.exe`, enter name, birth date, birth time and birth city, and hit **"✧ shatter the sky ✧."** The site geocodes the city (Open-Meteo), resolves the historical UTC offset and DST via `Intl.DateTimeFormat`, computes the chart in-browser, and opens `your_sky.shards` — four face-down gem cards the user clicks to flip:

| Shard | Tradition | What it reads |
|---|---|---|
| 🏠 **house** | Placidus houses (17th c.) | Which of the 12 houses the Sun occupies, plus rising sign |
| 🪞 **mirror** | Jungian archetypes | One of 12 archetypes mapped from the Moon sign |
| 🌙 **moon** | *manāzil al-qamar* | Which of the 28 classical Arabic lunar mansions the Moon rests in |
| 🕯️ **hearth** | European folk star-lore | "Monday's Child" rhyme + the planetary ruler of the birth weekday |

Reveal all four and a **"weave my reading"** button appears, which calls an LLM to blend them into one paragraph, then opens `shard_card.bmp` — a canvas-rendered PNG the user downloads and posts. There is also a `chart_wheel.exe` (SVG Placidus wheel with cusps, glyphs, Sun/Moon), `duet.exe` (two-chart compatibility with a 68–98% "star resonance" score), `today.exe` (today's lunar mansion), `grimoire.hlp` (a glossary crediting each tradition), a guestbook, a Web Audio chiptune player, and an `account.exe` that persists window positions to a Node/Express/MySQL backend.

**Stack:** a single 100 KB `.dc.html` component built in a visual builder (`dc-runtime`, `<x-dc>`, `sc-if`/`sc-for`, `DCLogic`), three hand-written ES modules (`astro.js` = ephemeris, `shards.js` + `duet.js` = copy), and a 194-line Express API behind bcrypt + JWT cookies.

**Who it's actually for.** This is not a general astrology product. Reading the media kit alongside the code makes it obvious: it is **a web property for Suyin (@suyinsama)** — 13M+ monthly views, 104K followers, daily Hatsune Miku / Vocaloid cosplay from Brooklyn, 62% female, 74.7% aged 18+, 34% US, 67.7% completion rate. The copy is written in her register ("tag your oshi," "mikufan39," "buying the gacha pull," "no drama"), the landing page has a mascot slot, and `luna.txt` credits "concept: suyinsama ☾."

---

## 2. What is genuinely unique about it

Three things are real. One thing you probably think is the differentiator, and isn't.

**① The four-tradition frame — this is the actual moat.**
Every product I surveyed reads you through *one* lens: Western tropical astrology, or MBTI, or Jungian typology. Star Shard reads you through four at once, and — critically — **the *manāzil al-qamar* appear in zero of the ten comparables.** Not Co–Star, not CHANI, not Astro-Seek, not astro.com's free tier. Twenty-eight lunar mansions with Arabic names, transliterated diacritics intact, each with a folk meaning, sourced from the *anwāʾ* star-calendars, and framed in `grimoire.hlp` as "cultural scholarship with love… not as religious guidance." Nobody else is doing this in a cute package. That is a genuinely novel product and a genuinely novel share artifact.

**② The math is real, and I verified it.**
I ran `astro.js` against `pyswisseph` (the Swiss Ephemeris — the industry gold standard) across ~150,000 test cases spanning 1930–2020 and latitudes −45° to +66°:

| | mean error | max error |
|---|---|---|
| Sun longitude | 0.007° | 0.018° |
| Moon longitude | 0.021° | **0.106°** |
| Ascendant | 0.003° | 0.119° |
| MC | 0.003° | 0.005° |
| Placidus cusps 11/12/2/3 | 0.003° | 0.105° |

Sun sign disagrees with Swiss Ephemeris **0.029%** of the time; Moon sign 0.071%; rising sign 0.009%; Sun's house **0.00%**. The `<0.5°` comment in the file header is honest — you have ~66× the margin you need. The GMST implementation is verbatim Meeus 12.4 (I checked for the units bug that formula usually attracts; it isn't there), the Placidus semi-arc derivation is correct, and the 13-term Moon truncation never exceeds 0.106° across 265,904 epochs. **Co–Star, which raised $21M, defaults to Porphyry houses and generates a constant stream of "my chart is wrong" tickets. You compute real Placidus. You should be saying this out loud.**

**③ Zero birth data leaves the browser.**
`astro.js` runs client-side. The only network calls are the Open-Meteo geocoder and the optional account endpoint. The backend stores an email hash and a JSON blob of window coordinates — **not one byte of birth data.** In a category where Moonly leaked GPS coordinates and birth dates for ~6M users in 2024, and where Nebula collects 12 data types and shares 5 with Facebook/Apple/Amazon, this is a real, defensible, marketable claim. You currently make it nowhere on the site.

**④ The thing that is *not* your differentiator: the Windows 95 chrome.**
There are dozens of these. `windows93.net`, `windows96.net`, `win32.run`, `daedalOS` (12.9k GitHub stars), Poolsuite's Mac OS shell, plus `98.css` / `XP.css` / `7.css` / `React95` as ready-made libraries. It is the single most-copied aesthetic on the indie web. It is also — see §4 — the part actively costing you the most. Retro chrome is table stakes for the *vibe*; it is not a position.

---

## 3. Ten comparable sites

I looked across three adjacent categories, because Star Shard sits at their intersection: astrology tools, retro/desktop web toys, and shareable identity generators.

### The ten

| # | Site | What it is | Scale | Model | Steal this | Avoid this |
|---|---|---|---|---|---|---|
| 1 | **[Co–Star](https://www.costarastrology.com/)** | Social astrology app; brutalist black-and-white | 30M registered, 4.3M MAU; **acquired by Midjourney, 2026** | $8.99/mo + à la carte | The daily "do / don't / bring / avoid" card — the most screenshot-ed UI in the category | 52% negative reviews; 20% about pricing; doom-y tone; Porphyry houses causing "my chart is wrong" |
| 2 | **[CHANI](https://chaninicholas.com/)** | Human-written, queer/feminist astrology | 2M downloads, **4.9★/57K — highest-rated**, ~$14M/yr, **zero VC**, 35 staff | $11.99/mo | **"100% human-written, explicitly anti-AI" monetized at $14M with no VC.** Publishes its house system and orbs openly | Steepest paywall; weekly not daily; chart viz worse in-app than on web |
| 3 | **[Astro-Seek](https://horoscopes.astro-seek.com/)** | The astrologer's free power tool, built by one person | ~3M visits/mo, **8m04s session, 6.49 pages/visit, 31.6% bounce** | Free + ads + donations | Every parameter is in the URL → **every chart is a permalink**. Surfaces methodology instead of hiding it. A house-system *comparison* view | Looks like 2008 phpBB; mobile is painful |
| 4 | **[Astro Charts](https://astro-charts.com/)** | The closest existing analogue to your shape: indie, free, minimal, no signup | Small | **One-time $35 personalized guide** | The pricing model. Free tool, optional paid artifact, no subscription. 20,000 celebrity charts as an engagement hook | Weak brand; nothing viral |
| 5 | **[The Pattern](https://thepattern.com/)** | Astrology with the astrology hidden; plain-language personality + timing | **4.0★/15K — weakest of the majors** | $14.99/mo | The first-run "how did it know that" moment. Timing/cycle alerts are the most-praised feature in the category | Black box — no wheel, no placements, no house system. 1-star reviews are dominated by cancel-flow complaints |
| 6 | **[Picrew](https://picrew.me/)** | Japanese avatar-maker platform; ~10,000 artist-built image makers | 100M+ cumulative users, ~2.6M visits/mo, **8m36s session**. **Acquired for ~¥578M (~$4M), Dec 2023** | Ads + app-only Premium + **"Picrew Lab" B2B from ¥2M/project** | Fixed canvas (1:1 600×600 **and 9:16 540×960**) and hard layer caps — constraints are *why* 10,000 artists ship instead of stall | **Artists are paid ¥0.** No revenue share anywhere in the ToS. Users assign image copyright to the creator for free; creators cannot opt out of the share loop |
| 7 | **[Instafest](https://www.instafest.app/)** | Turns your Spotify into a festival lineup poster | Day 1: 150 users/hr → peak week **500,000/hr, 6M DAU, 100M+ page views** | None | The poster encodes **ranking as visual hierarchy** with no numbers — and it invites *argument*. Seeded by Questlove, Edgar Wright, 24kGoldn reposting | Total Spotify API dependency (now effectively closed to new apps) |
| 8 | **[Receiptify](https://receiptify.herokuapp.com/)** | Your top tracks as a thermal receipt | ~1M users; built in **14 hours** by a first-year student | None | **The receipt is a real-world object that pre-solves layout.** 10–20 items stay readable because the viewer already owns the parsing schema. Your username prints as "customer" | Never monetized; died on Heroku's free-tier removal; **brand eaten by SEO clones** (receiptify.us, .tools, .click…) |
| 9 | **[Poolsuite.net](https://poolsuite.net/)** | Retro Mac OS desktop that plays summer radio | Modest — 750K–1.2M listening sessions/yr | Web toy makes ~nothing. **Spawned Vacation® sunscreen: ~$40M retail 2024, ~$80M projected 2025, #152 Inc. 5000** | **The toy is a brand asset, not a revenue line.** This is the single most important precedent in this table for you | Ten years to get there; the NFT drop aged badly |
| 10 | **[neal.fun](https://neal.fun/)** | 40+ single-purpose browser toys | ~3.1M visits/mo, **8.16 pages/visit, 5m57s**, 52% direct | Low-density display ads — supports him full-time | **One URL per toy.** That is why it ranks *and* gets 8 pages/visit. Top social referrer is **YouTube, then Reddit, then X** — not Twitter | Not a desktop metaphor. He deliberately didn't build one |

### Also worth knowing

- **[windows96.net](https://windows96.net/)** / **[win32.run](https://win32.run/)** / **[daedalOS](https://github.com/DustinBrett/daedalOS)** — the desktop-metaphor field. Windows 96 is the best of them because its package manager and live chat made the shell into a *platform*. **There has been no true consumer breakout retro-desktop site since Windows 96 in 2021.**
- **[ShindanMaker](https://en.shindanmaker.com/)** — 16 years of relevance in Japanese fandom on *text output alone*, because the diagnoses are user-generated. This is the closest cultural analogue to your audience's habits.
- **[16Personalities](https://www.16personalities.com/)** — 13.9M visits/3mo, **52% from organic search**, 9.6% of traffic from Japan. Proof that the durable asset isn't the viral spike, it's the *vocabulary* ("I'm an INFP") that then gets searched forever.
- **[Nebula](https://asknebula.com/)** — $50M ARR. Also the worst privacy profile measured (12 data types, 5 tracked for ads) and the most aggressive trial funnel in the category. Your anti-model.

### Three market facts that should shape your decisions

1. **Co–Star was acquired by Midjourney in 2026.** The category's flagship "cool" brand is now owned by an AI lab — at exactly the moment Gallup measured 14–29-year-old excitement about AI falling to 22% (−14pts) with anger rising to 31% (+9pts). CHANI monetizes "human-written, not AI" at $14M/yr. **There is an open, defensible position for a hand-made, computationally honest, non-LLM tool.**
2. **Traffic in astrology is easy; monetizing it is not.** Astro-Seek gets ~3M visits/month with a 2008 UI and one developer. Co–Star had 4.3M MAU and only ~$500K/month revenue. Plan Star Shard as a brand asset with an optional paid artifact — not a subscription business.
3. **Mobile is 52–64% of web traffic, and 87% of Suyin's YouTube views come from the Shorts feed.** Her audience is, functionally, phone-only.

---

## 4. Weaknesses

Ordered by how much damage they do.

### 🔴 Critical — will hurt at launch

**W1. The whole thing is a draggable multi-window desktop, and the audience is on phones.**
This is the central strategic contradiction. 87% of Suyin's YouTube views come from the Shorts feed. Mobile is 52.27% of global web traffic (64.35% including tablets). Meanwhile: `dragWin` and `resizeWin` are the primary verbs and have **no touch equivalent**; `initWindows()` clamps every window to `max(300, W−116)` px, so on a 390px phone a "window" is 300px wide starting at `x=104` — it overflows the viewport — sitting on top of a fixed 88px desktop-icon rail; the taskbar takes 46px and every title bar takes another ~25px; the ✕ and _ buttons are 20×17px against a 44px WCAG minimum tap target; and **the Android back button / iOS edge-swipe exit your entire site** because opening a window is not a navigation. You are shipping a broken experience to your actual audience. This is the #1 documented failure mode for this entire category and you have the most mobile-skewed audience of anyone building one.

**W2. The AI reading does not work in production.**
`weave()` and `computeDuet()` call `window.claude.complete(...)`. I grepped `support.js` (the entire `dc-runtime`): **zero occurrences of "claude."** That API is injected by the authoring environment, not by your deployed runtime. On `starshard.net`, every call throws and falls through to `D.fallbackWeave(...)` — a single template string. **Every user who completes the entire flow gets the identical paragraph**, with only their name and placements swapped in. The climactic moment of the product — the button you gated behind collecting all four shards — is currently a Mad Lib. Same for `fallbackDuet`, which ignores both charts entirely and only varies by the element-pair title.

**W3. The hearth shard is wrong for ~26% of users.**
`astro.js:105` computes `weekday` from the **UT-shifted** Julian Day, not the local calendar date. Sweeping 25 timezones × 24 birth hours: **157/600 = 26.2% report the wrong day.** Confirmed repros: born 23:00 Saturday in Los Angeles → site says Sunday. Born 23:30 Monday in New York → Tuesday. Born 06:00 Wednesday in Tokyo → Tuesday. One of your four shards — the whole Monday's-Child reading and its planetary ruler — is wrong for a quarter of your users, and it's wrong in the most embarrassing possible way: *people know what day they were born.*
**Fix:** derive the weekday from `julianDay(year, month, day, 12)` (local calendar date at noon), not from the UT-shifted `jd`.

**W4. 12.5% of charts display an impossible degree.**
`degFmt()` in `Star Shard v2.dc.html:1001` computes `m = Math.round((lon % 1) * 60)` with no carry. When the fraction is ≥ 0.99167, it prints `12°60′`. That's 1/120 = 0.833% per value; the chart table renders 16 values, so **P(at least one "X°60′" per chart) = 12.5%**. At 29.9955 it compounds into a sign error too — prints `29°60′ Aries` where the truth is `0°00′ Taurus`.
**Fix:** `let m = Math.round((lon%1)*60), d = Math.floor(lon%30); if (m===60){m=0;d++;} if (d===30){d=0; /* advance sign */}`

**W5. Above 66.35°N the chart is confidently, silently garbage.**
Two confirmed failures. (a) `ascendant()` returns the **Descendant** — the rising sign comes out 180° off, the opposite sign. Verified geometrically: the returned point has hour angle > 0 (setting) where Swiss Ephemeris returns HA < 0 (rising). Repro: 1967-11-20 23:06 UT, lat 67.0 → you say Sagittarius rising, truth is Gemini. Rate: 0% at ≤66.5°, 6.5% at 67°, 18.3% at 70°, 36.7% at 80°. (b) The Placidus solver's fixed 12 iterations enter a limit cycle; the returned cusps aren't monotonic and the 12 spans sum to **1080°**, so `houseOf` makes **houses 7–12 structurally unreachable** — no planet can ever land in them. Swiss Ephemeris *refuses* to compute Placidus here; you return a confident answer.
Anyone born in Iceland, Tromsø, Murmansk, Fairbanks, or Nunavut gets a wrong chart. Small population, but Suyin's audience includes 5.2% UK, 4.8% Germany, and Nordic Vocaloid fandom is not nothing.
**Fix:** detect `|lat| > 66`, fall back to Whole Sign or Porphyry, and say so in the UI. Honesty here is a *feature* — Astro-Seek's house-comparison view is one of its most-loved pages.

**W6. The account system is maximum liability for minimum value.**
You are running a password database — bcrypt hashes, 90-day JWTs, email addresses — to persist **window x/y coordinates**. It does not save the user's chart, their reading, or their card. The UI is honest about this ("your open windows & their positions save automatically ♡") which makes it worse: nobody will sign up for that. Meanwhile there is **no email verification, no password reset, no account deletion, no data export**. A user who forgets their password loses the account permanently, and you have no GDPR erasure path.
**And: 25.3% of Suyin's YouTube audience is 13–17.** You are collecting email + password + exact birth date + birth time + birth city from a population that is a quarter minors. Exact date+time+place of birth is a near-unique quasi-identifier that can never be rotated. Either delete the account system entirely (recommended for v1) or build it properly with age gating, verification, deletion, and a real privacy policy.

**W7. Express 4 + un-caught async handlers = a DB blip crashes the process.**
`/api/auth/login`, `/api/me`, `GET /api/state` and `PUT /api/state` are `async` with no `try/catch`. Express 4.19 does not catch rejected promises from async handlers; the rejection goes unhandled and Node ≥15 terminates the process by default. One MySQL hiccup takes the API down. Only `/api/auth/signup` is wrapped. Also: `ALLOWED_ORIGINS` defaults to `https://staging.starshard.net`, so a production deploy that forgets the env var silently breaks CORS for every logged-in user.

### 🟠 Serious — will cap growth

**W8. There is no `<title>`, no meta description, and no Open Graph tags. Anywhere.**
I grepped. Zero. Every link anyone posts to Discord, Twitter, Bluesky or iMessage will render as a bare URL with no preview image. For a product whose entire growth loop is people posting a link and an image, this is the highest-leverage 20 minutes of work in the repo.

**W9. Nothing inside the site is linkable.**
One URL for the whole OS. No deep link to a shard, a mansion, a chart, or a reading. Compare neal.fun: one URL per toy, which is *why* it gets 8.16 pages/visit and ranks in search. Compare Astro-Seek: every parameter in the URL, so every chart is a permalink. Right now a user cannot send a friend their result — only the homepage. **This structurally prevents the share loop the entire product is built around.**

**W10. The share card — your growth engine — is the least-finished thing you have.**
`savePng()` renders 720×1000 (18:25, close to 4:5). That's the *feed* aspect, not the *Stories* aspect. Spotify Wrapped is 9:16 by design; Picrew added 9:16 (540×960) alongside its 1:1 canvas specifically because the share surface moved. Bigger problem: `.image-slots.state.json` shows **only `landing-mascot` has art. The `card-art` slot is empty.** The one image that travels — the one that lands in someone's Story with Suyin's art on it — is an empty circle with the placeholder text "artist art ♡". Also: `savePng()` uses `c.toDataURL()` + `a.click()`, which is the exact pattern that fails silently on iOS Safari. Receiptify hit 1M users with a broken mobile download because people screenshot instead — so make the card look correct **as a full-bleed screenshot**, not just as a download.

**W11. The guestbook is single-player theater.**
`signGuestbook()` writes to `localStorage`. Every visitor sees the same three seeded entries — mikufan39, teto_tuesday, anon — plus their own. It is presented as a community space and it is a mirror. It will be discovered, and "the guestbook was fake" is a bad first impression for a brand built on warmth. Either wire it to the API you already have, or reframe it as a private notes file.

**W12. There is no path for "I don't know my birth time."**
The form requires a time, defaults to 12:00, and says "it's fine to guess." Then the site tells the user **"real Placidus cusps, computed from your exact minute & place ✦"** and hands them a rising sign, a house placement, and a whole House Shard built on a guess. That's the #1 support-ticket generator at both Co–Star and CHANI. CHANI's minimum-acceptable pattern is a noon default *with an explicit precision warning*; better is to suppress ASC/MC/houses entirely and show a solar chart. Right now you have the accuracy of a serious tool and the honesty of a toy — pick the serious one, it's free credibility.

**W13. No analytics of any kind.** You will not know whether any of this worked.

### 🟡 Worth fixing

- **W14.** Default birth date is `2004-08-31`, which is an odd, arbitrary anchor for a fandom whose median age is 25–34.
- **W15.** `duetScore()` returns 68–98% and is driven only by Sun and Moon separation. It never returns a low number, which is fine for tone, but the "STAR RESONANCE 87%" framing implies precision it doesn't have.
- **W16.** JWT logout is client-side only — clearing the cookie leaves a valid 90-day token in play if it was ever captured. `/api/auth/signup` returns `email_taken`, which is user enumeration.
- **W17.** Every window is a `<div>` soup with no landmarks, no heading order, no focus management. Retro chrome is a WCAG contrast problem by construction; `98.css`'s discipline (style semantic HTML, ship no JS) is the escape hatch and the builder output abandons it.
- **W18.** Two versions of the file (`Star Shard.dc.html` 25 KB, `Star Shard v2.dc.html` 100 KB) with no build step or deploy config in the repo.
- **W19.** `starshard.net` is still a GoDaddy "Launching Soon" page collecting emails. Whatever you do next, that page is the thing 13M people would hit.
- **W20.** Buy the obvious domain variants now. Receiptify's brand was permanently captured by half a dozen SEO clones that still outrank commentary about the original.

---

## 5. How to make it outstanding

### The strategic reframe

**You are not competing with astrology apps. You have the one thing every site in §3 spent years or got lucky trying to buy: distribution.**

Instafest went from 150 users/hour to 500,000 users/hour because Questlove and Edgar Wright reposted it. Receiptify's author woke up to thousands of retweets from a 20-follower account. Poolsuite took ten years and a sunscreen brand. **You have 13M monthly impressions and 67.7% completion, on tap, daily, to an audience that is 62% female, 75% adult, US-led, and described in your own media kit as "the anime-retail buying demo."**

Right now the site is built as a generic astrology product with a mascot slot. It should be built as **an episode of the channel that happens to run in a browser.** Everything below follows from that.

### Do these five things first

**1. Ship a phone-native path. Keep the desktop as the desktop-only bonus.**
Not a responsive squeeze of the window manager — a genuinely separate single-column flow on narrow viewports: one screen per step, full-bleed, thumb-reachable, no chrome. Keep the Win95 desktop for ≥1024px as the "you found the good version" reward, and let the phone flow *link into it* ("open the full desktop ✦"). This is the difference between the project working and not working, and it's a weekend of layout, not a rewrite. Poolsuite does exactly this; so does every retro site that survived.

**2. Design the share card first, then let it drive the site.**
Make it **9:16, 1080×1920.** Name the user. Put Suyin's art in `card-art` — that empty circle is the whole reason this artifact travels rather than any other astrology card. One element must be legible at ~100px thumbnail size. Design it to look right as a **full-bleed screenshot**, because that's what most people will do. Then ship a second 1:1 crop for feeds.

**3. Make the 28 mansions the front door.**
This is the single most under-exploited asset in the codebase. The research is unambiguous about why: **types are postable, continuous scores are not.** 16Personalities built a 13.9M-visits/quarter business on four letters. Spotify bolted six "Clubs" onto Wrapped in 2025 for exactly this reason. You already have a 28-type collectible system with beautiful names, real scholarship behind it, and — in Saʿd al-Suʿūd, "THE lucky moon… buy the gacha pull" — a built-in rarity mechanic your audience already speaks the language of.

Concretely: **28 permalink pages**, `starshard.net/mansion/al-thurayya`, each with its own OG image, its own art, its own reading, and a "find yours" CTA. That is 28 indexable pages where you currently have zero, a share target for every result, and 28 pieces of commissionable art. "What's your mansion?" is a recurring channel segment that never runs out.

**4. Fix the four correctness bugs and then say the accuracy out loud.**
Weekday (W3), degree rounding (W4), polar latitudes (W5), unknown birth time (W12). Then put a line in `grimoire.hlp` that no competitor can match:

> *Real Placidus cusps, computed from Meeus's algorithms in your browser. We checked ours against the Swiss Ephemeris across 150,000 charts — the Sun agrees to 0.02°, the Moon to 0.11°. Co–Star uses Porphyry. Your birth data never leaves this page and we never store it.*

**Nobody in this category occupies "correct AND beautiful."** The serious tools (Astro-Seek, astro.com, TimePassages) all look like 2006. The pretty ones (Co–Star, The Pattern, Nebula) are computationally shallow or opaque. That gap is the whole opening.

**5. Add `<title>`, meta description, and OG tags. Ship per-result permalinks.**
Twenty minutes for the meta tags. The permalink is a day: encode the chart in a query string exactly the way Astro-Seek does (`?d=1989-06-06&t=16:40&lat=40.71&lon=-74.01&tz=-5`), generate the OG image server-side or pre-render one per mansion, and every screenshot becomes a click.

### Where the real differentiation is

**Lean into non-AI, hard.** Co–Star is now Midjourney property. Gen Z AI sentiment is actively souring (excitement 22%, −14pts; anger 31%, +9pts). CHANI monetizes "human-written, explicitly anti-AI" at $14M/yr with zero VC. Meanwhile your LLM call is broken in production anyway (W2) — so you have a free choice, and the strategically correct one is: **delete `window.claude.complete` and write the readings by hand.** You already write beautifully; `shards.js` is the best copy in the repo. Build a combinatorial library instead — 12 house readings × 12 archetypes × 28 mansions × 7 weekdays already gives 28,224 distinct four-part readings; add 3–4 hand-written connective sentences per pairing and you have something an LLM can't match on voice and that never breaks, never costs anything per call, and lets you say **"every word on this site was written by a human"** — which in 2026 is a marketing claim, not a limitation.

**Pay the artists.** Picrew reached 100M+ cumulative users and ~10,000 creators, sold for ~¥578M, launched a ¥2M-per-project B2B arm — and pays creators **nothing**; its ToS even forbids creators from opting out of the share loop. That has generated real, ongoing artist friction, and its 2024–25 anti-AI clause shows management knows artist trust is the asset at risk. **You are a creator-owned property in a fandom that cares intensely about artists.** Commissioning 28 mansion illustrations from Vocaloid-scene artists, crediting each one on their mansion's permalink page with a link to their commissions, and paying them — that is a genuine competitive surface, a content engine, and 28 collaborators who each promote the launch. It is also the most on-brand thing you could possibly do.

**Make it live.** Windows 96's package manager and chat are why it outlasted every other browser OS. Your `today.exe` already reads today's real lunar mansion — that's a genuine daily reason to return, and it's currently a 330px window nobody will open. Promote it: today's mansion as the desktop wallpaper, as a daily Short, as the OG image on the homepage. Fix the guestbook to be real (you already have the API and the DB). The moon moves every ~13 hours; that's your cadence, and it's the only automatic, free, infinitely-renewing content source in the whole design.

### Monetization — don't build a subscription

The loudest complaint in the entire astrology category is subscription abuse: 20% of Co–Star's reviews, the entirety of The Pattern's 1-star tier, Nebula's 3-day-trial-to-$9.99-weekly funnel. The FTC found dark patterns in a majority of subscription apps in 2024. Meanwhile Astro Charts gets praised for a **one-time $35 guide**, and Poolsuite's web toy made ~nothing while spawning an **$80M** sunscreen brand.

Your audience is 75% adults, 62% female, US-led, and buys anime merch. **The artifact is the product.** Printed shard cards. A risograph poster of your chart wheel with your name on it. A 28-mansion sticker sheet. An enamel pin of your mansion. Sell the object, not the access. And treat the site itself the way Poolsuite treated Poolsuite: as the brand asset that makes everything else possible.

### What not to chase

Don't try to out-feature Astro-Seek — transits, synastry, progressions, aspect grids, midpoints, astrocartography, nine house systems, all free, from one guy. You will lose. Don't chase Cafe Astrology's SEO; they have 24 years of interpretation text. Don't build a chatbot. Don't add a psychic marketplace. **Star Shard's job is to be the most beautiful, most honest, most postable four-minute experience in the category — and to be the thing 13M people a month can be pointed at.** That's a narrower job than any of the ten sites above are doing, which is exactly why it can win.

---

## Appendix: fix list, in order

| | Fix | Effort |
|---|---|---|
| 1 | `<title>` + meta description + OG tags | 20 min |
| 2 | `weekday` from local calendar date, not UT (W3) | 15 min |
| 3 | `degFmt` minute carry + sign rollover (W4) | 15 min |
| 4 | `try/catch` on the four async Express handlers (W7) | 20 min |
| 5 | Art into the `card-art` slot (W10) | — |
| 6 | Delete or properly build the account system (W6) | 1 hr / 1 wk |
| 7 | Replace `window.claude.complete` with a hand-written combinatorial library (W2) | 1–2 days |
| 8 | Wire or reframe the guestbook (W11) | 2 hrs |
| 9 | Polar-latitude fallback + notice (W5) | 2 hrs |
| 10 | "I don't know my birth time" path (W12) | 3 hrs |
| 11 | Chart permalinks + per-result OG images (W9) | 1 day |
| 12 | Phone-native single-column flow (W1) | 2–3 days |
| 13 | 9:16 share card (W10) | 1 day |
| 14 | 28 mansion permalink pages (§5.3) | 3–5 days + art |
| 15 | Analytics (W13); buy domain variants (W20) | 1 hr |

---

## Sources

**Astrology category** — [TechCrunch: Midjourney acquires Co–Star](https://techcrunch.com/2026/07/24/midjourney-acquired-the-astrology-app-co-star/) · [Engadget: Midjourney/Co-Star + Gallup AI sentiment](https://www.engadget.com/2222797/midjourney-buying-astrology-horoscope-app-co-star/) · [Co–Star support: house system](https://costarastrology.zendesk.com/hc/en-us/articles/13692185219469-My-natal-chart-is-wrong) · [Kimola: Co-Star review sentiment analysis](https://kimola.com/reports/co-star-app-review-analysis-unveiling-user-insights-app-store-us-155484) · [Built by Foundry: CHANI $14M, no VC](https://www.builtbyfoundry.io/blog/chani-nicholas-chani-astrology-app) · [CHANI: unknown birth time policy](https://chaninicholas.zendesk.com/hc/en-us/articles/4411093003539-Unknown-Birth-Time) · [Similarweb: Astro-Seek](https://www.similarweb.com/website/horoscopes.astro-seek.com/) · [Astro Charts](https://astro-charts.com/) · [App Store: The Pattern](https://apps.apple.com/us/app/the-pattern/id1071085727) · [Surfshark: astrology app privacy study](https://surfshark.com/research/chart/astrology-apps-privacy) · [PCMag: Moonly 6M-user leak](https://www.pcmag.com/news/gps-data-on-6-million-astrology-app-users-leaks-online) · [tech.eu: Nebula/OBRIO $50M ARR](https://tech.eu/2023/12/05/obrio/) · [Swiss Ephemeris licensing](https://www.astro.com/swisseph/swephprice_e.htm) · [TechCrunch: FTC dark patterns study](https://techcrunch.com/2024/07/10/ftc-study-finds-dark-patterns-used-by-a-majority-of-subscription-apps-and-websites)

**Retro web & share generators** — [Wikipedia: Poolsuite](https://en.wikipedia.org/wiki/Poolsuite) · [Inc.: Vacation® $80M](https://www.inc.com/jennifer-conrad/vacations-80-million-sunscreen-brand-is-surfing-on-more-than-just-vibes/91181448) · [Similarweb: neal.fun](https://www.similarweb.com/website/neal.fun/) · [Wikipedia: Windows96.net](https://en.wikipedia.org/wiki/Windows96.net) · [Windows Central: win32.run](https://www.windowscentral.com/software-apps/windows-xp-returns-in-browser-reboot) · [daedalOS](https://github.com/DustinBrett/daedalOS) · [98.css](https://github.com/jdan/98.css) · [Hackaday: desktop-metaphor site critique](https://hackaday.com/2022/10/27/a-collection-of-websites-that-look-like-desktops/) · [Vercel: Instafest case study](https://vercel.com/blog/from-idea-to-100-million-views-instafest-music-festival-application) · [Studio for Creative Inquiry: Receiptify](https://studioforcreativeinquiry.org/project/receiptify) · [The Tartan: Receiptify interview](https://thetartan.org/2021/2/8/pillbox/receiptify) · [Picrew Terms of Use](https://support.picrew.me/en/terms) · [Similarweb: Picrew](https://www.similarweb.com/website/picrew.me/) · [gamebiz: Tokyo Tsushin acquires TETRACHROMA](https://gamebiz.jp/news/377026) · [Tokyo Tsushin: Picrew Lab](https://tokyo-tsushin.com/news/20251006-1849/) · [Similarweb: 16Personalities](https://www.similarweb.com/website/16personalities.com/) · [MBW: Spotify Wrapped 2025](https://www.musicbusinessworldwide.com/spotify-wrapped-campaign-hit-200m-engaged-users-in-24-hours-a-19-yoy-increase/) · [WebAIM Million 2026](https://webaim.org/projects/million/) · [Mobile traffic share 2026](https://fosspost.org/mobile-website-traffic/)

**Local files audited** — `Star Shard v2.dc.html`, `Star Shard.dc.html`, `astro.js`, `shards.js`, `duet.js`, `support.js`, `.image-slots.state.json`, `starshard-api/{server.js,schema.sql,package.json,.env.example}`, `uploads/Suyin Media Kit 1.pdf`, git history. Ephemeris verified against `pyswisseph` 2.10.3.2 across ~150,000 generated test cases.
