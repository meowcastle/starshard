# Manzil — Kickstarter Research Brief

**Prepared:** 22–23 August 2026. Every figure below carries the date its *source* was published and the date I *retrieved* it. All retrievals happened 22–23 August 2026 unless noted.

**How to read the flags:**
- **[VERIFIED]** — figure comes from a primary source (Kickstarter itself, ICO Partners/Bidaux, a named study, or a live campaign page) and I read it directly.
- **[SECONDARY]** — figure comes from an aggregator, vendor blog, or marketing agency. Directionally useful, methodology usually undisclosed.
- **[ESTIMATED]** — my own arithmetic or extrapolation. Not sourced. Treat as a model, not a fact.
- **[STALE]** — the best available source, but old enough that it may no longer hold.

**One important structural finding up front:** Kickstarter has **retired its public live stats dashboard**. As of 22 Aug 2026, [kickstarter.com/help/stats](https://www.kickstarter.com/help/stats) 302-redirects to a marketing year-in-review post. There is no longer an authoritative first-party success-rate-by-category table. Third-party aggregators now disagree with each other by several percentage points (see §1). Anyone quoting a precise Kickstarter category success rate in 2026 is quoting a scrape, not Kickstarter.

---

## 1. Kickstarter games baseline, 2025–2026

### 1.1 Platform-wide

Two aggregators, both scraping the same public project data, both updated in 2026, disagree:

| Metric | ExpandedRamblings (updated 27 Feb 2026) | SearchLogistics (updated 13 Apr 2026) |
|---|---|---|
| Total pledged | $9.41bn | $8.51bn |
| Projects launched | 686,810 | 650,798 |
| Successfully funded | 292,605 | 272,205 |
| Overall success rate | **42.74%** | **39.11%** |
| Total backers | 24.98m | 23.85m |
| Repeat backers | 8.72m | — |

Sources: [ExpandedRamblings Kickstarter Statistics](https://expandedramblings.com/index.php/kickstarter-statistics/) [SECONDARY], [SearchLogistics Kickstarter Stats & Facts](https://www.searchlogistics.com/learn/statistics/kickstarter-stats-facts/) [SECONDARY].

Take the honest read: **overall success rate is somewhere in the 39–43% band.** The spread between two 2026 scrapes is itself the finding.

Games category lifetime: **52.32% success rate, $2.85bn pledged** — the largest category by dollars ([ExpandedRamblings](https://expandedramblings.com/index.php/kickstarter-statistics/), 27 Feb 2026) [SECONDARY]. That 52% is a blended number and it hides the single most important fact in this brief.

### 1.2 The tabletop / video game split — they are not the same business

This is the headline. From **Kickstarter's own 2024 figures**, published 5 Feb 2025 ([2024 Was a Big Year for Games on Kickstarter](https://updates.kickstarter.com/kickstarter-biggest-platform-for-games/)) [VERIFIED — first-party]:

**Tabletop games, 2024:**
- 6,646 projects launched
- 5,314 successfully funded
- **80% success rate** — Kickstarter's words: "the highest in our 15-year history"
- $220m pledged to successful tabletop campaigns
- 83% of all Games-category pledges went to tabletop

**Video games, 2024 (same post):**
- $26m pledged to successful video game campaigns (+28% vs 2023)
- 441 successful campaigns (+9% vs 2023), "the highest number of successful video games in our 15-year history"

ICO Partners counts 463 funded video games in 2024 rather than Kickstarter's 441 — a methodology difference, not an error ([Bidaux, *Kickstarter & Video Games in 2025*](https://medium.com/icopartners/kickstarter-and-video-games-in-2025-90f15c2fd7bd), 5 Feb 2026) [VERIFIED].

Against ~1,335 video game campaigns launched in 2024, that implies a **video game success rate of roughly 33–35%** ([GameDev Reports, *Kickstarter in 2025 and before*](https://gamedevreports.substack.com/p/kickstarter-in-2025-and-before), 6 Nov 2025, which also gives an all-time video game success rate of **32%** across 5,526 funded campaigns and $377m) [VERIFIED].

> **The gap: tabletop funds at ~80%, video games at ~33%. Tabletop also has ~12x more funded projects (5,314 vs 441). Same platform, same year, entirely different odds.**

### 1.3 2025 figures (most recent full year)

**Video games, 2025** — ICO Partners / Thomas Bidaux, published 5 Feb 2026 [VERIFIED]:
- **443 successful campaigns** (second-highest count in platform history; 2024's 463 was the record)
- **~$26m total**, "shy a few hundred thousand USD" of 2024
- **11 projects above $500k** — the most since 2015, more than double 2024's count
- 55 projects above $100k (vs 62 in 2024)
- Top campaign: Elestrals Awakened, $1.4m

**Average per successful video game campaign, 2025: ~$58,000** ([GameDiscoverCo, *What worked for video game crowdfunding in 2025?*](https://newsletter.gamediscover.co/p/what-worked-for-video-game-crowdfunding), 10 Feb 2026) [VERIFIED]. Same source: up from $39,000 in 2016; total pledged growing ~7%/yr, successful campaign count growing ~1.5%/yr.

**Tabletop, 2025:** Kickstarter did **not** publish an equivalent 2025 games post. Its [2025 Year in Review](https://updates.kickstarter.com/a-year-in-review-2025-kickstarter-highlights/) (23 Dec 2025) is a narrative highlights piece with no category tables [VERIFIED — verified absent]. The most recent hard tabletop full-year data remains 2024. Best available 2024 comparison: **$220m across 5,300+ funded projects = $41,400 average per funded project, the lowest since 2014** ([BoardGameWire](https://boardgamewire.com/index.php/2025/02/06/our-ambition-for-2025-is-to-be-number-one-in-tabletop-gamefound-closes-gap-on-kickstarter-again-as-crowdfunding-giants-2024-dollars-raised-remains-flat/), 6 Feb 2025) [VERIFIED]. Kickstarter tabletop dollars have declined four years running: $270m (2021) → $236.8m (2022) → $226.8m (2023) → $220m (2024).

### 1.4 Median vs mean — the number that actually matters

**Mean is a trap.** The distribution of *successful* Kickstarter projects by size ([SearchLogistics](https://www.searchlogistics.com/learn/statistics/kickstarter-stats-facts/), 13 Apr 2026) [SECONDARY]:

| Raised | Successful projects | Share |
|---|---|---|
| Under $1,000 | 35,265 | 13.0% |
| $1,000–$9,999 | 143,252 | 52.6% |
| $10,000–$19,999 | 39,330 | 14.4% |
| $20,000–$99,999 | 41,625 | 15.3% |
| $100,000–$999,999 | 11,850 | 4.4% |
| $1m+ | 883 | 0.3% |

**65.6% of all successfully funded Kickstarter projects raised under $10,000.** Only 4.7% cleared $100,000.

The oldest large-sample median I could find: **$3,838 median raise across all successful projects** (Kupka, 331,000 projects, data through Jan 2018, published 10 Apr 2019) [STALE but the distribution above corroborates the order of magnitude].

### 1.5 How many backers does a funded project actually have?

- **First-time board game creators raising under $100k: average $39,000 from an average of 782 backers** (~$50/backer). Range $8,382–$86,371. Sample of 12 campaigns ([The City of Games, *Stats from successful first-time creators*](https://thecityofkings.com/news/stats-from-successful-first-time-creators/), 22 Dec 2022) [VERIFIED — small sample, n=12, and now 3.5 years old].
- **Median backers for a successful video game campaign: 290** (Kupka, data through 2018) [STALE].
- Live oracle/tarot comparables (retrieved 22 Aug 2026, see §3): 113 backers / $15,366 · 283 backers / $25,179 · 3,074 backers / $277,399.

**Working planning figure: $45–$60 per backer for a card/deck product; ~$50 is the safest single number.** [ESTIMATED from the comparables above.]

### 1.6 Fees

5% platform fee + 3% + $0.30 per pledge processing. Pledges under $10 pay 5% + $0.08. **Total deduction 8–10%.** No fees if unfunded ([Kickstarter Fees](https://www.kickstarter.com/help/fees), retrieved 22 Aug 2026) [VERIFIED]. No 2025/2026 fee changes noted.

---

## 2. The "no audience" problem, honestly

This is the section that should drive the decision.

### 2.1 The single most important number

> **Creators must generate roughly 70% of their own backing. Kickstarter supplies about 30%.**

That is Thomas Bidaux's figure, stated directly: campaigns require 3+ months of pre-launch setup and 4 months of active management, and "developers must generate ~70% of backing independently" ([The Game Business, *Why aren't more game developers using Kickstarter?*](https://www.thegamebusiness.com/p/why-arent-more-game-developers-using), 7 Apr 2026) [VERIFIED].

Three independent corroborations:

1. **A real oracle-deck postmortem.** HeroRise's Masculine Archetype Deck raised $32,740. The creator reports **38% of funds ($12,511) came from backers they could not attribute to their own outreach** — i.e. Kickstarter's platform traffic — and states the platform-community average is around 35% ([HeroRise, *Ultimate Kickstarter Guide*](https://www.herorise.us/ultimate-kickstarter-guide-launch-tarot-oracle/), 26 Apr 2021, updated 7 Jan 2022) [VERIFIED — single campaign, self-reported].

2. **A four-campaign tabletop referral audit.** Roughly **60% creator-driven / 40% Kickstarter-driven** after reclassifying ambiguous referrers. Critically, the authors found **Kickstarter's own dashboard over-credits itself by about 20 percentage points** and recommend subtracting 20% from any "Kickstarter" referral figure the dashboard reports ([CrowdfundingNerds](https://crowdfundingnerds.com/kickstarter-referrals-explained-deep-dive-into-4-tabletop-campaigns-that-funded-successfully/), 16 Dec 2020) [VERIFIED — n=4, and 2020 vintage].

3. **Jamey Stegmaier's discovery poll.** Asked how they find campaigns, backers ranked **"browsing crowdfunding platforms directly" seventh.** Above it: tabletop game media (YouTube/podcasts/blogs), organic social and communities, BoardGameGeek hotness, paid social advertising, publisher newsletters, publisher websites. Stegmaier — who has backed 400 campaigns — explicitly records his scepticism of Kickstarter's claims about platform discovery ([Stonemaier Games](https://stonemaiergames.com/how-do-you-typically-discover-new-crowdfunding-and-preorder-campaigns/), 7 Jul 2022) [VERIFIED — self-selected poll of Stonemaier's own readership, so biased toward engaged hobbyists].

**Verdict on the browse-traffic question: plan on Kickstarter supplying 30–40% of your money, and only *after* your own audience has supplied enough early momentum to trigger the algorithm.** Platform traffic is a multiplier on existing momentum, not a substitute for it.

### 2.2 The "you need X hundred emails" rules of thumb — and whether there is data behind them

There is **no rigorous published study** establishing a minimum pre-launch list size. What exists is practitioner benchmarking, and it converges reasonably well.

**Subscriber-to-backer conversion rates:**

| Source | Date | Conversion |
|---|---|---|
| [BackerKit](https://www.backerkit.com/blog/how-strong-is-your-crowdfunding-email-list/) [SECONDARY] | 4 Apr 2022, upd. 12 Oct 2023 | **1–5%** of a high-quality list; low-quality lists "close to 0%" |
| [Adam Webb](https://adamwebb.pro/blog/kickstarter-vip-conversion-problem) [SECONDARY] | 7 Aug 2026 | **0.5–3%** cold single-opt-in; **3–10%** warmed/nurtured; **20–30%** for £1 refundable-deposit lists; **30–40%** for £10+ deposits; Kickstarter's native "Notify Me" followers **3–8%** |
| [Neutronium Games](https://neutronium.games/blog/kickstarter-board-game-tips) [SECONDARY] | 13 May 2026 | **5–15%** email; **0.5–2%** social media |

Webb — the most recent source, published two weeks ago — explicitly attacks the inflated benchmarks: agencies quote 20–30% for plain email lists, which he calls either exceptional cases or deliberate anchoring. **His realistic band for a properly warmed list is 3–10%,** and unwarmed lists that got zero contact between signup and launch fall **below 1%**.

**Named list-size targets:**
- **"500+ email subscribers needed before launch day"** for a board game campaign ([Neutronium](https://neutronium.games/blog/kickstarter-board-game-tips), 13 May 2026) [SECONDARY].
- **"Low-thousands of engaged followers before day one,"** plus hundreds of active Discord members, for an indie video game campaign ([StraySpark, *2026 Kickstarter Indie Game Playbook*](https://www.strayspark.studio/blog/kickstarter-indie-game-campaign-playbook-2026), 23 Apr 2026) [SECONDARY].
- **Stegmaier refuses to give a number.** In *Kickstarter Lesson #230: Is Your Crowd Big Enough?* (6 Jul 2017) he writes: "There are no magical targets to hit — these numbers will vary widely from creator to creator." He instead audits a specific unlaunched game across ~1,000 newsletter subscribers, 250 Facebook likes, 160 Twitter followers, 1,392 Instagram followers, 36 BGG fans, 12 thumbs on the box image, 250 playtesters — and concludes it "wasn't a big enough part of the overarching board game conversation to be ready for launch." **His diagnostic signal is BoardGameGeek engagement, not list size** ([Stonemaier Games](https://stonemaiergames.com/kickstarter-lesson-230-is-your-crowd-big-enough/)) [VERIFIED].

**So: the rule of thumb is real, weakly evidenced, and the honest version is arithmetic rather than a magic number.**

### 2.3 The arithmetic, run for Manzil

Working backwards, at $50/backer, with 70% self-generated and a 5% warm-list conversion:

| Target raise | Backers needed | Self-generated backers (70%) | Warm emails needed @5% | @10% (best case) |
|---|---|---|---|---|
| $5,000 | 100 | 70 | **1,400** | 700 |
| $8,000 | 160 | 112 | **2,240** | 1,120 |
| $15,000 | 300 | 210 | **4,200** | 2,100 |
| $25,000 | 500 | 350 | **7,000** | 3,500 |

[ESTIMATED — my model, built from the sourced conversion rates and per-backer figures above.]

**Read the top row.** Even a $5,000 campaign implies roughly 1,400 engaged, warmed email subscribers at a realistic 5% conversion. Manzil currently has zero.

### 2.4 First-48-hours: the mechanism that punishes no-audience launches

- **Campaigns securing 20% of goal in the first 48 hours have a 78% chance of funding** ([MinorVisuals](https://www.minorvisuals.com/post/kickstarter-in-2026-what-s-actually-working-now-and-what-creators-get-wrong), 27 Mar 2026, upd. 20 Apr 2026) [SECONDARY].
- **30% in the first 48 hours predicts success; campaigns that miss it "almost never recover"** ([Neutronium](https://neutronium.games/blog/kickstarter-board-game-tips), 13 May 2026) [SECONDARY].
- Real first-time board game data: those 12 campaigns averaged **37.13% in the opening 3 days**, 42.64% in the middle, 20.23% in the final 3. **58% funded within the first 24 hours** ([City of Games](https://thecityofkings.com/news/stats-from-successful-first-time-creators/), 22 Dec 2022) [VERIFIED].

This is why an audience is not optional: Kickstarter's discovery algorithm surfaces projects that are *already* converting. No day-one crowd → no algorithmic lift → no platform traffic → the 30–40% Kickstarter would have contributed never arrives.

### 2.5 Two other findings worth knowing

- **Repeat creators have a 70% higher success rate than first-timers** ([MinorVisuals](https://www.minorvisuals.com/post/kickstarter-in-2026-what-s-actually-working-now-and-what-creators-get-wrong), 27 Mar 2026) [SECONDARY]. A small first campaign is an asset for the second.
- **Campaigns with video: 50–54% success. Without: 30–39%.** Same source [SECONDARY].
- **Campaigns of 30 days or less succeed 26% more often than longer ones.** Same source [SECONDARY].
- **Counter-example worth holding onto:** *Ahoy!* launched in 2025 with "a mere 351 followers" and succeeded on the strength of a dedicated pre-existing online community ([Bidaux](https://medium.com/icopartners/kickstarter-and-video-games-in-2025-90f15c2fd7bd), 5 Feb 2026) [VERIFIED]. Community depth can substitute for list size. At the other end, *Autonomica* launched with 10,000+ Kickstarter followers and converted 12,000+ backers ([GameDiscoverCo](https://newsletter.gamediscover.co/p/what-worked-for-video-game-crowdfunding), 10 Feb 2026) [VERIFIED].

---

## 3. Tarot and oracle decks

### 3.1 Category size

- **320+ tarot and oracle deck projects funded on Kickstarter in 2025, raising a combined *estimated* $12.8m.** Up ~9% year-on-year from ~293 projects / ~$11.7m in 2024 ([DeckAura, *Tarot Industry Report 2026*](https://deckaura.com/pages/tarot-industry-report-2026), published 15 Jan 2026, updated 28 Mar 2026) [SECONDARY — and note the source's own word is "estimated"; DeckAura is a deck retailer, so treat as directional only].
  - Implied average per funded project: **~$40,000** [ESTIMATED]. See §3.3 for why this number is misleading.
- **1,200+ tarot projects launched on Kickstarter since 2009, with a 52% success rate against a 38% platform average** ([PledgeBox](https://www.pledgebox.com/post/kickstarter-tarot-decks), 12 Dec 2025) [SECONDARY — vendor blog, methodology undisclosed].
- Female-led campaigns: 68% of successful tarot projects since 2016, $9.2m collectively raised. Same source [SECONDARY].

### 3.2 What the successful ones have in common

Consistent across every source I read:
1. **Art is the product.** Artist-driven, visually distinctive, strong presentation.
2. **The creator has a following before launch** — usually Instagram/TikTok, built around their illustration work.
3. **Personal narrative** connecting creator to the deck's meaning.
4. **Early-bird tiers** for day-one momentum.
5. **A professional physical prototype** shown in the campaign.
6. Pricing ladder from a sub-$10 tier up through ~$20, $30–50, and $100+ limited tiers ([HeroRise](https://www.herorise.us/ultimate-kickstarter-guide-launch-tarot-oracle/) surveyed the top 100 decks, 2021/2022) [VERIFIED — but 2021 vintage].

Sources: [PledgeBox](https://www.pledgebox.com/post/kickstarter-tarot-decks) (12 Dec 2025), [HeroRise](https://www.herorise.us/ultimate-kickstarter-guide-launch-tarot-oracle/) (2021/22), [Biddy Tarot](https://biddytarot.com/blog/tarot-deck-crowdfunding/).

### 3.3 The mean is a lie — here is the live median

I pulled **live Kicktraq data for the Games › Playing Cards category on 22 Aug 2026**. 81 active projects. First page, exact figures [VERIFIED — live, today]:

| Project | Goal | Pledged | % funded |
|---|---|---|---|
| Modern Classic: A Cinematic Tarot Deck | $54 | $2,107 | 3901% |
| Spacehead | $500 | $2,590 | 518% |
| RITUAL LENORMAND | $1,000 | $2,226 | 222% |
| Gristle Giants | £2,500 | £2,730 | 109% |
| The Hemp Deck | $3,000 | $2,005 | 66% |
| Good Pals Logo V2 Playing Cards | £4,500 | £6,464 | 143% |
| Herbal Bones Oracle | $5,888 | $7,593 | 128% |
| Lenticular I-Ching Oracle | HK$62,676 | HK$125,182 | 199% |
| World Heritage Playing Cards (52 MUSÉE) | HK$30,000 | HK$280,098 | 933% |

Source: [Kicktraq, Games › Playing Cards](http://www.kicktraq.com/categories/games/playing%20cards/), retrieved 22 Aug 2026.

**Median pledged across that sample: roughly $2,600.** [ESTIMATED from the live sample above; n=9 of 81 active, so treat as indicative.] The category's ~$40,000 *average* is being dragged upward by a handful of outliers.

Note also the goal-setting behaviour: **most goals are between $500 and $6,000.** One is $54. These creators are setting goals they can clear on day one and letting overfunding do the work — exactly what the ask-size data in §6 recommends.

### 3.4 Named comparables

| Campaign | Date | Goal | Raised | Backers | $/backer | Creator |
|---|---|---|---|---|---|---|
| [The Oracle of Many Paths](https://www.kickstarter.com/projects/jamesreads/the-oracle-of-many-paths) | 3–19 Jun 2025 (16 days) | $50,000 | **$277,399** | 3,074 | $90 | James R. Eads — established illustrator with a large existing following |
| [MUSICA UNIVERSALIS Zodiac Oracle](https://www.kickstarter.com/projects/evpublishing/musica-universalis-zodiac-oracle-deck) | 30 Apr–28 May 2025 (28 days) | $15,000 | **$25,179** | 283 | $89 | Ethereal Visions Publishing — established publisher |
| HeroRise Masculine Archetype Deck | 2021 | $6,200 | **$32,740** | — | — | Solo, built 1,500-subscriber list in 2 months via paid ads |
| [Astro Essentia astrology oracle](https://www.kickstarter.com/projects/courtneysahl/astro-essentia-an-astrology-oracle-deck) | 31 Jan–1 Apr 2019 (60 days) | $14,500 | **$15,366** | 113 | $136 | Solo |
| The Wild Unknown Tarot | 2012 | $15,000 | **$118,512** | 3,310 | $36 | Solo, breakout |

All Kickstarter pages retrieved 22 Aug 2026 [VERIFIED]. HeroRise and Wild Unknown figures via the creator postmortem and [PledgeBox](https://www.pledgebox.com/post/kickstarter-tarot-decks) respectively [SECONDARY].

**Look at Astro Essentia.** An astrology oracle deck by a solo creator: $15,366 from 113 backers. That is the closest single comparable to Manzil-as-a-deck, and it is the most honest number in this document.

### 3.5 Does a 28-card astrology deck inherit tarot-category performance?

**Partly — and not in the way that helps right now.**

**Arguments for:**
- 28 cards sits comfortably in the oracle-deck range (36–64 typical; there's no fixed count, unlike tarot's 78). Format is not a barrier.
- The 28 lunar mansions are a genuine, documented esoteric system with existing practitioner communities — Renaissance/medieval Western astrology and Chinese astrology both use them ([Renaissance Astrology](https://www.renaissanceastrology.com/mansionsmoon.html), [Benebell Wen](https://benebellwen.com/2023/05/14/chinese-lunar-mansions-oracle/)). That is a real niche hook, not an invented one.
- I found **no directly competing lunar-mansions deck campaign** on Kickstarter. The space appears open [VERIFIED — negative search result, so weaker evidence than a positive one].
- Category success rate (52%) genuinely beats the platform average (38–43%).

**Arguments against — and these are stronger:**
- **The tarot category funds well *because the art already exists and is the entire pitch*.** Backers scroll a gallery of finished cards and buy the object. Manzil's Kickstarter would be asking people to fund art that does not yet exist. That inverts the exact mechanism that makes the category perform.
- **Successful tarot creators *are* the audience.** James R. Eads brought a following; Ethereal Visions is a publisher. The category's performance is substantially a selection effect for creators who already have art-buying followers. Manzil cannot inherit performance driven by an asset it lacks.
- **Cross-category pitches confuse both audiences.** A turn-based card game with an astrology skin, pitched to oracle-deck buyers, is not the purchase they came for — they want a divination tool, not a game with an ability on each card. Pitched to game backers, the astrology framing reads as theme rather than mechanism. Pick one framing per campaign.
- The realistic median (§3.3) is a few thousand dollars, not $40,000.

**Verdict: the deck framing is the stronger of the two available framings, but it does not inherit the category's headline numbers.** It inherits the category's *median* — low four figures — unless the art and the following exist first.

---

## 4. Art costs

### 4.1 Published rate data, 2026

**[WhatShouldICharge](https://whatshouldicharge.io/illustrator)** — retrieved 22 Aug 2026, built on BLS OEWS May 2024 wage data [VERIFIED]:
- Hourly: **$50 floor / $100 typical / $175 premium**
- Single character design package: **$2,000–$10,000**
- Full-page editorial (national magazine): $2,500
- Children's book full-page: $800 each
- Spot illustrations: $200–$800 each
- **Volume discount evidence:** icons at 1–10 cost $100–300 each; at 11–25, $75–200; at **25+, $50–150 each** — roughly a 40–50% per-unit discount at set size
- **Concept/development work runs 20–30% of total project cost**; additional concepts beyond the first three, $200–$500 each
- Style guides are typically bundled into project pricing rather than billed separately

**[FreelanceRates.net](https://www.freelancerates.net/illustrator)** (2026 guide, no date stamp) [SECONDARY]:
- Hourly $25–$150; spot $50–$500; full-page editorial $400–$1,500; commercial/branding $1,000–$10,000+
- **Licensing multiplier: editorial base = 1.0x; commercial use = 3–15x.** Card-game art is commercial use. This is the single most-missed cost driver by first-time commissioners.

**[Graphic Artists Guild Handbook, 17th edition](https://graphicartistsguild.org/the-graphic-artists-guild-handbook-pricing-ethical-guidelines/)** — published **4 Nov 2025** [VERIFIED that this is the current edition]. The rate tables are paywalled; I could not extract game/card figures. If art budgeting becomes load-bearing, this book is worth the purchase price — it is the industry's reference document.

**Live marketplace pricing** — [Dribbble card illustration services](https://dribbble.com/services/search/card-illustration), retrieved 22 Aug 2026 [VERIFIED — live listings]:
- TCG card illustration: **$1,500** for one card, structured as $450 rough sketch / $450 line art / $600 final delivery, background included, 3 revisions, 1 month
- Gaming/NFT card illustration: $1,000
- Affirmation card design: $1,300
- Fantasy TCG card design: $300
- Tarot card design: $150
- Bottom of market: $10–$50 (offshore and/or AI-assisted — not a professional cohesive set)

### 4.2 What card games actually paid — real budgets

Stonemaier's [*A Guide to Board Game Illustration*](https://stonemaiergames.com/a-guide-to-board-game-illustration/) (11 Apr 2022) is the best-documented source [VERIFIED — but **2022 vintage; add ~15–20% for 2026** [ESTIMATED]]:

| Item | Cost |
|---|---|
| Professional illustrator floor rate | $50/hr minimum |
| Card illustration, fully rendered | **$250–$1,000+** |
| Box cover | $2,000–$6,000 |
| *Quests & Cannons* — per loot card | $75 |
| *Quests & Cannons* — per character | $350 |
| *Quests & Cannons* — large frame illustration | $600 |
| *Quests & Cannons* — card back | $150 |
| *Quests & Cannons* — box composition | ~$1,000 |
| **Quests & Cannons total art budget** | **$13,200** |
| *Nut Hunt* (Pine Island Games) total — 19 landscape illustrations + box art + ink drawings | **$14,100** (initial quotes $9,550–$10,000) |
| *Kingdom Candy: Monsters* (2018) | ~$70/card, **$3,500 all-in** |
| **Stonemaier standard game art budget** | **$25,000–$30,000** |
| **Stonemaier expansion art budget** | **$10,000–$15,000** |

Delivery spec: minimum 400 DPI.

### 4.3 Modelled 28-card budget for Manzil

[ESTIMATED — my model, built from §4.1 and §4.2. Not a quote.]

| Tier | Per card | 28 cards | Art direction / style guide | Card backs, logo, key art | **Total** |
|---|---|---|---|---|---|
| **Budget** — emerging artist, flat/graphic style, limited palette | $150–250 | $4,200–7,000 | $500–1,500 | $500–1,500 | **$5,200–10,000** |
| **Mid** — competent professional, full-colour rendered scene per card | $350–600 | $9,800–16,800 | $1,500–3,000 | $1,500–3,000 | **$12,800–22,800** |
| **High** — recognised illustrator with a distinctive, sellable style | $800–1,500 | $22,400–42,000 | $3,000–6,000 | $3,000–6,000 | **$28,400–54,000** |

Assumptions and caveats:
- Assumes a **20–35% set discount** off single-piece rates, consistent with the volume tiering in WhatShouldICharge. A set of 28 with a shared visual system is genuinely cheaper per unit than 28 unrelated commissions.
- Assumes **commercial licensing included**. If you commission at editorial rates and later need commercial rights, the 3–15x multiplier bites. Get commercial use in the contract from day one.
- **Standalone art direction / style guide: $1,500–$5,000** [ESTIMATED by extrapolating WhatShouldICharge's "concept work = 20–30% of project cost" against a mid-tier set. I found no directly published rate for a card-set style bible.]
- **The High tier is the one that would make a tarot-style deck sell**, and it is the one Manzil cannot currently afford to ask for.

### 4.4 Art as a fraction of total budget

**This is poorly sourced and I want to be explicit about that.** No source I found publishes a clean "art as % of card game budget" figure.

What can be said [ESTIMATED, reasoned from the above]:
- For a **physical card game**, art competes with manufacturing. Stonemaier spends $25–30k on art for games whose total pre-production cost is considerably higher; the illustration line is typically the largest *pre-production* item but is often exceeded by manufacturing + fulfilment at scale. Print costs for oracle decks: **$5,000–$9,000 for 1,000+ decks** via print-on-demand ([HeroRise](https://www.herorise.us/ultimate-kickstarter-guide-launch-tarot-oracle/)) [VERIFIED — 2021 figure, likely higher now].
- For a **digital-only game where the developer's own labour is unpaid**, art is frequently **60–80%+ of actual cash outlay**. That is Manzil's situation and it is why the "raise money for art" framing is internally coherent as a budget — even though, as §7 argues, it is weak as a *pitch*.

---

## 5. Video games and the Steam interaction

### 5.1 Does a Kickstarter help or hurt a later Steam launch?

**Net: it helps, but as a marketing event, not a funding event — and only if the Steam page already exists.**

**The best single piece of evidence:** *The Witch Bakery*'s Steam wishlists grew from **10,000 to 37,000 during its Kickstarter campaign** — a 3.7x increase. Bidaux cites this specifically as demonstrating "marketing value beyond direct funding" ([The Game Business](https://www.thegamebusiness.com/p/why-arent-more-game-developers-using), 7 Apr 2026) [VERIFIED — one campaign, and one that started from 10,000 wishlists].

**Order: Steam page first, Kickstarter second.** [StraySpark's 2026 playbook](https://www.strayspark.studio/blog/kickstarter-indie-game-campaign-playbook-2026) (23 Apr 2026) [SECONDARY] states the Steam page should go live **6–12 months before the campaign**, with wishlists already accruing at launch, and that a Steam Next Fest appearance immediately preceding the Kickstarter is "standard practice for ambitious campaigns."

The logic is sound and worth stating plainly: a Steam page costs $100 once and accrues wishlists permanently. A Kickstarter converts existing attention into money over 30 days and then stops. Running the Kickstarter first means the wishlist spike it generates has nowhere to land.

### 5.2 The failure mode: free keys do not build your Steam review count

This is the real hidden cost and it is rarely mentioned.

Since Valve's 2016 review-policy change, **reviews from free keys are excluded from a game's headline review score.** One documented case: a game's visible score fell from **81% (34 of 42 positive) to 58% (11 of 19 positive)** once key-derived reviews were excluded. The 23 backer reviews — all positive, and rated more helpful by users (77% helpfulness vs 65% for positive purchase reviews) — were removed from the score that drives Steam's algorithm ([Game Developer](https://www.gamedeveloper.com/business/a-case-study-of-steam-reviews-for-an-indie-kickstarter-game), 21 Sep 2016) [VERIFIED but **STALE — 2016; I did not independently confirm the policy is unchanged in 2026, though no source suggests it has changed. Verify before relying on it.**]

Bidaux acknowledges this limitation directly — free keys to backers don't generate countable Steam reviews — but argues the visibility gains offset it ([The Game Business](https://www.thegamebusiness.com/p/why-arent-more-game-developers-using), 7 Apr 2026) [VERIFIED].

**Practical consequence:** every backer who receives a free key is a customer who cannot help your launch-day review count — the metric that gates Steam's algorithmic visibility. Budget for this.

### 5.3 Wishlist benchmarks — the sobering context

- **7,000–10,000 wishlists is the minimum for launch-day discoverability; 25,000–50,000 is the "sweet spot"; below 5,000 is a "dead zone" for algorithmic discovery** ([SteamForecast](https://steamforecast.app/guides/how-many-wishlists-before-steam-launch), 15 Aug 2026) [SECONDARY].
- **66% of games have fewer than 10,000 wishlists.** Only 9% of 1,500 games sold more copies than they had wishlists at launch. Wishlists explain 49% of sales variance — but reliably only above 100,000 wishlists, which just 6% of games reach ([Video Game Insights via GameDev Reports](https://gamedevreports.substack.com/p/video-game-insights-steam-wishlists), 23 Jul 2025) [VERIFIED].
- **Steam Next Fest, February 2026: the median participating game gained ~200 wishlists.** The top 5% gained ~7,000 ([SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/how-to-get-steam-wishlists), 10 Jun 2026) [SECONDARY]. Next Fest is not a solution.
- **Demos are the highest-leverage asset.** Games that launched a demo months before a festival earned **~2.5x more wishlists** from that festival. Median demo-to-wishlist conversion: **16.33%.** Same source [SECONDARY].
- Paid ads run **$1–2 per wishlist** with good targeting. Same source [SECONDARY].

> **Manzil already has the highest-leverage asset — a playable free browser demo.** That is genuinely valuable and currently underexploited. Every source ranks a playable demo above trailers, screenshots, devlogs, and press releases.

### 5.4 Funded-but-never-delivered

**The rigorous number** — Ethan Mollick, Wharton, surveying ~50,000 backers across 30,000+ campaigns, published December 2015 ([SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2699251), reported by [MCV](https://mcvuk.com/development-news/12-of-video-game-kickstarter-campaigns-fail-to-deliver/), 9 Dec 2015) [VERIFIED but **STALE — 2015**]:
- **Video games: 12% failure-to-deliver.** Platform-wide: 9%.
- Controlling for project size, video games performed **similarly to other projects of equivalent scale** — the category isn't uniquely bad, it's disproportionately large-and-ambitious.
- **Smallest projects (under $1,000) failed worst at ~15%.**
- **Projects raising $10,000–$15,000 had the *lowest* failure rate, ~7%.** This is a genuinely useful target band.
- Only **13% of backers of failed campaigns received refunds.**
- **73% of disappointed backers said they would back another campaign** — the reputational damage to the *platform* is lower than assumed.

**The harsher, older number:** of 366 funded video game projects from 2009–Oct 2012, measured in early 2014, only **37% had fully delivered**, 8% partially, 3% cancelled, 2% on hiatus ([Evil as a Hobby via GameRant](https://gamerant.com/kickstarter-video-game-failure-rate/), 28 Jan 2014) [STALE and **methodologically weak** — it measured at a fixed date, so slow-but-eventual deliveries counted as failures. Do not quote this as "63% never deliver." It does not say that.]

**Reputational cost, honestly assessed:** the platform-level data says backers are forgiving (73% would back again). The *creator*-level cost is the one that matters — a solo creator's name is the brand, and a public failure attaches to it permanently, poisoning the second campaign where repeat-creator status would otherwise be worth a 70% success-rate uplift (§2.5). **For a solo creator with no audience, the asymmetry is severe: a small successful campaign is a durable asset; a failed or undelivered one is a durable liability.**

---

## 6. Realistic funding target

### 6.1 Ask size vs success rate — quantified

- **65.6% of all successfully funded Kickstarter projects raised under $10,000.** Only 4.7% cleared $100,000 ([SearchLogistics](https://www.searchlogistics.com/learn/statistics/kickstarter-stats-facts/), 13 Apr 2026) [SECONDARY]. MinorVisuals reports the same distribution as **66.4% under $10,000, 4.2% over $100,000** (27 Mar 2026) [SECONDARY].
- **Video games specifically:** 81.8% of all funds came from campaigns with goals under $500k; 68.1% from goals under $250k. **Zero campaigns seeking $2.5m+ succeeded.** Lower-goal projects consistently overperformed — Bloodstained raised $5.5m against a $500k goal ([GameDev Reports](https://gamedevreports.substack.com/p/kickstarter-in-2025-and-before), 6 Nov 2025) [VERIFIED].
- **Delivery risk is also lowest in the $10k–$15k band (~7% failure vs ~15% for sub-$1,000 projects)** (Mollick, 2015) [STALE but the only rigorous source].
- **Campaigns of 30 days or less succeed 26% more often** ([MinorVisuals](https://www.minorvisuals.com/post/kickstarter-in-2026-what-s-actually-working-now-and-what-creators-get-wrong), 27 Mar 2026) [SECONDARY]. Note the live Playing Cards comparables ran 16 and 28 days.
- **Live evidence from the category (§3.3):** active playing-card campaigns are setting goals of $500–$6,000 and overfunding 100–900%.

### 6.2 What Stegmaier says a goal should be

From [*Setting a Reasonable Funding Goal*](https://stonemaiergames.com/setting-a-reasonable-campaign-funding-goal/) (20 Nov 2025 — recent and directly relevant) [VERIFIED]:
- The goal should be the **realistic minimum needed to manufacture and fulfil**, plus a **5–10% buffer**.
- Ira Fay (Far Off Games): "the goal doesn't have to be the 'actual' goal you need to make a profit, but it should not be lower than you are actually willing to take to make the game."
- **Against artificially low goals:** they mislead backers about what production actually costs and undermine credibility.
- **Sunk costs already invested may legitimately be excluded** from the goal.
- Stegmaier names the structural problem directly: crowdfunding algorithms reward rapid funding and low funding-to-goal ratios, which pressures everyone toward unrealistically low targets.

**The tension is real.** The data says small goals succeed. Stegmaier says don't set a goal below what you'd actually accept. **The resolution for Manzil: set the goal at the genuine cost of the *budget-tier* art commission — which happens to be small.** That is honest and small at the same time.

### 6.3 The recommended ask

Working backwards from §2.3 with realistic inputs — 100–300 backers, $45–60 average pledge:

| Scenario | Backers | Gross | Net (−9% fees) |
|---|---|---|---|
| Pessimistic | 100 | $5,000 | $4,550 |
| Central | 180 | $9,000 | $8,190 |
| Optimistic | 300 | $15,000 | $13,650 |

[ESTIMATED — my model.]

> ### **Recommended ask: $6,000–$8,000. Use $6,500 if forced to pick one.**

Why that number:
1. It sits inside the **under-$10,000 bucket where 66% of all successful Kickstarter projects live.**
2. It is clearable by **~130 backers at $50** — inside the pessimistic-to-central band, and near the 113 backers *Astro Essentia* actually got.
3. It **exactly funds the budget-tier 28-card commission** ($5,200–$10,000 from §4.3), so the pitch is literally true rather than aspirational — satisfying Stegmaier's honesty test.
4. Overfunding to $10k–$15k lands in **Mollick's lowest-delivery-failure band (~7%)**.
5. It matches the live behaviour of the category: goals of $500–$6,000, overfunding 100–900%.

**Do not ask for $25,000.** That requires ~500 backers, which requires ~350 self-generated backers, which requires **7,000 warm emails at 5% conversion.** That audience does not exist and cannot be built in one campaign cycle.

---

## Implications for Manzil

### 1. Verdict: run it **later, not now** — and the gap is measured in months, not years.

Every model in this brief converges on the same result. Even a $5,000 campaign implies roughly **1,400 warmed email subscribers** at a realistic 5% conversion (§2.3), because **~70% of the money must be self-generated** ([Bidaux, Apr 2026](https://www.thegamebusiness.com/p/why-arent-more-game-developers-using)). Manzil has zero. Launching now means missing the 20–30% first-48-hours threshold, which means no algorithmic lift, which means the 30–40% Kickstarter *would* have contributed never arrives either. A no-audience launch doesn't fund at 30% of target — it funds at near zero, because the platform contribution is a multiplier on momentum, not an independent source. **The realistic window is 4–6 months of audience-building.**

### 2. The stated purpose — "raise money to hire artists" — is the campaign's central weakness, and it is fixable for about $1,000.

The tarot/oracle category funds well *because backers scroll a gallery of finished art and buy the object* (§3.2). A campaign asking people to fund art that doesn't exist inverts the exact mechanism that makes the category work. **The single highest-leverage action available: commission 4–6 finished cards out of pocket before launching** — $600–$1,500 at budget tier, $1,400–$3,600 at mid tier (§4.3). Those cards become the campaign's visual spine and the social-media content that builds the list. Do not launch a card-art Kickstarter with placeholder art. Fund the campaign's art *with* art.

### 3. Recommended ask: **$6,500** (defensible range $6,000–$8,000).

It sits in the under-$10k bucket holding **66% of all successful Kickstarter projects** (§6.1); it needs ~130 backers at $50, close to the 113 that *Astro Essentia* — a solo-creator astrology oracle deck — actually got (§3.4); and it exactly covers the budget-tier 28-card commission (§4.3), so the pitch is literally true. Overfunding into $10–15k lands in Mollick's lowest-delivery-failure band (~7%). Run **28 days or fewer** — sub-30-day campaigns succeed 26% more often (§6.1).

### 4. Pitch it as a **deck**, not as a video game. This is the highest-impact single decision in the brief.

Tabletop funds at **~80%** on Kickstarter; video games at **~33%** — and tabletop had 5,314 funded projects in 2024 against video games' 441 ([Kickstarter's own 2024 figures](https://updates.kickstarter.com/kickstarter-biggest-platform-for-games/)). Tarot/oracle adds another lift: **52% success rate vs a 38–43% platform average** (§3.1). A physical 28-card lunar-mansions deck is a *fundable object*; a solo-developer digital card game asking for art money is the hardest category on the platform. **Same 28 illustrations, roughly 2.4x the odds.** Do not pitch both in one campaign — a cross-category pitch confuses divination buyers and game backers simultaneously (§3.5).

### 5. Do not expect the tarot category's headline numbers. Expect its median.

The "$40,000 average" implied by 320 funded decks / $12.8m in 2025 (§3.1, itself an *estimate* from a retailer's report) is an artefact of outliers. **Live Kicktraq data from 22 Aug 2026 shows a median around $2,600 across active playing-card campaigns, with goals of $500–$6,000** (§3.3). The decks that raise $277,399 belong to illustrators who already had followings. Plan for the median; the tail is not a plan.

### 6. Put the Steam page up now — before anything else, and independent of the Kickstarter decision.

If the digital game remains a goal, the Steam page should be live **6–12 months before any campaign** (§5.1). It costs $100 once, accrues wishlists permanently, and gives the Kickstarter's attention spike somewhere to land — *The Witch Bakery* went from 10,000 to 37,000 wishlists during its campaign. Running the Kickstarter first wastes that. **Also budget for the free-key problem:** backer reviews are excluded from Steam's headline score, so every backer is a customer who can't help launch-day review count (§5.2) — though verify the 2016 policy still stands before relying on it.

### 7. Exploit the demo. It is the most valuable asset already in hand and it is currently idle.

Median demo-to-wishlist conversion is **16.33%**, and games with demos live before a festival earn **~2.5x more wishlists** from it (§5.3). Every ranked source puts a playable demo above trailers, screenshots, devlogs, and press releases. Bidaux specifically flags that *Prelude Dark Pain*'s campaign succeeded largely through **content creators and media given exclusive demo access** (§5, GameDiscoverCo). The demo is the outreach hook — for astrology creators, tarot YouTubers, and indie-game press alike. Nothing else in the toolkit does this job.

### 8. Preconditions — do not launch until all five are true.

| # | Precondition | Target | Source |
|---|---|---|---|
| 1 | Warmed email list | **800–1,500** subscribers, contacted at least monthly | §2.2–2.3 |
| 2 | Kickstarter "Notify Me" followers | **300+** (converts at 3–8%) | §2.2 |
| 3 | Finished sample cards | **4–6**, commissioned and paid for | §2 above |
| 4 | Product decision made | Deck **or** game, not both | §4 above |
| 5 | Day-one commitments | Enough named people to clear **~30% of goal in 48 hours** | §2.4 |

Precondition 5 is the real gate. **Campaigns that miss 30% in the first 48 hours "almost never recover"**; those hitting 20% have a **78% chance of funding**. For a $6,500 goal that means roughly **40 backers lined up before you press launch.** Know their names.

### 9. Budget the art honestly, and get commercial rights in writing.

Budget tier for 28 cards plus style guide plus card backs: **$5,200–$10,000**. Mid tier: **$12,800–$22,800**. High tier — the tier that would actually make a *deck* sell on visual merit — **$28,400–$54,000** (§4.3). Two traps: **(a)** commission at editorial rates and you'll pay a **3–15x multiplier** to convert to commercial use later (§4.1) — specify commercial licensing from the first email; **(b)** a set of 28 should attract a **20–35% volume discount** off single-piece rates. Structure it as one cohesive set commission with a style guide, not 28 separate jobs. For reference, the entire art budget of *Kingdom Candy: Monsters* was **$3,500**, and *Quests & Cannons* was **$13,200** (§4.2).

### 10. A small win now beats a big win later — repeat-creator status is worth more than the money.

**Repeat creators have a 70% higher success rate than first-timers** (§2.5). A $6,500 campaign that funds at 150% and delivers on time converts Manzil's creator from an unknown into someone with a track record, a backer list, and a mailing list — the exact assets missing today. That is what makes a larger second campaign (the full game, the deluxe deck) viable. Conversely, the asymmetry cuts hard the other way: platform data says 73% of disappointed backers would back again, but **a solo creator's name is the brand**, and a public failure attaches permanently, poisoning precisely the second campaign where repeat-creator status would have paid off (§5.4). **Optimise the first campaign for certainty of delivery, not size of raise.**

---

### Bonus: alternatives worth pricing before committing to Kickstarter

Not requested, but the data points at them. Each de-risks the eventual campaign rather than replacing it:
- **Sell a print-and-play / digital deck now** (itch.io, Gumroad) to fund the first few illustrations and — more importantly — to build the email list from actual buyers, who convert far better than cold subscribers.
- **Refundable-deposit pre-launch list.** Webb's data (§2.2) puts £1-deposit lists at **20–30% conversion** and £10+ deposits at **30–40%** — versus 3–10% for plain email. This is the single biggest conversion lever available and it is under-used.
- **Gamefound** is now the serious tabletop alternative — ~$156m in 2024, growing 49% year-on-year, and it acquired Indiegogo in July 2025 ([BoardGameWire](https://boardgamewire.com/index.php/2025/07/24/gamefound-accelerates-challenge-to-kickstarter-by-buying-veteran-crowdfunding-pioneer-indiegogo/)). Smaller audience, but a more tabletop-focused one.

---

## Source reliability notes

**Strongest sources here:** Kickstarter's own 2024 games post (first-party category data); ICO Partners / Thomas Bidaux (the standing authority on game crowdfunding, published Feb 2026); Mollick/Wharton on delivery rates (the only rigorous academic study, but 2015); live Kicktraq and Kickstarter campaign pages retrieved today.

**Weakest sources here, flagged where used:** DeckAura's tarot figures (a deck retailer; explicitly self-described as "estimated"); PledgeBox and similar vendor blogs (undisclosed methodology); ExpandedRamblings and SearchLogistics (scrapes that disagree by ~3.6 percentage points on the headline success rate).

**Known gaps I could not close:**
1. **No 2025 full-year tabletop figures exist publicly.** Kickstarter did not publish a 2025 games post, and BoardGameWire's annual crowdfunding analysis for 2025 was not findable. The 2024 data is the most recent verified full-year tabletop set.
2. **Kickstarter's public stats dashboard is retired** — there is no longer an authoritative first-party success-rate-by-category source.
3. **Graphic Artists Guild Handbook 17th ed. (4 Nov 2025) rate tables are paywalled** — I could not extract its game/card figures.
4. **"Art as % of total card game budget" is not published anywhere I could find.** My figures in §4.4 are reasoned estimates and are flagged as such.
5. **The Steam free-key review-exclusion policy is verified only to 2016.** No source suggests it changed, but I did not confirm it directly for 2026.
