# Steam Economics for Manzil — Research Dossier

**Compiled:** 22 August 2026. Every figure below carries the date it was published or last verified. Where I could not confirm a number against a primary or high-quality secondary source, it is marked **[UNVERIFIED]** or **[ESTIMATE]**.

**Source-quality note.** I weighted primary sources (Steamworks documentation, Valve announcements, Kickstarter's own blog) first, then the two analysts the brief named — [GameDiscoverCo / Simon Carless](https://newsletter.gamediscover.co/) and [How To Market A Game / Chris Zukowski](https://howtomarketagame.com/) — then third-party estimators. The 2026 search index is thick with AI-generated SEO sites (`steampageanalyzer.com`, `tech-insider.org`, `generalistprogrammer.com`, `rec0ded88.com`, and a dozen "Steam Statistics 2026" clones). I excluded them. Where I use a revenue estimator, I say so and flag the method.

---

## 1. Cost and mechanics of shipping on Steam in 2026

### 1.1 The Steam Direct fee — still $100, still recoupable

Per the [Steamworks Steam Direct Fee documentation](https://partner.steamgames.com/doc/gettingstarted/appfee) (live, verified 22 Aug 2026):

> "$100 USD (or equivalent) fee for each new app you wish to distribute on Steam."

> "The Steam Direct Fee is not refundable, but will be recoupable in the payment made after your product has at least $1,000.00 Adjusted Gross Revenue for Steam Store or in-app purchases."

So: $100 per app, paid up front, returned as a line item on your monthly payment report **only once the app clears $1,000 in Adjusted Gross Revenue**. AGR is after refunds, chargebacks and regional adjustment — not sticker-price gross. This matters more than it sounds; see §2.5.

### 1.2 Revenue share — the 30/25/20 tiers are unchanged

| Lifetime revenue band | Valve's cut | Your share |
|---|---|---|
| $0 – $10,000,000 | 30% | 70% |
| $10,000,001 – $50,000,000 | 25% | 75% |
| $50,000,001+ | 20% | 80% |

Thresholds are **lifetime, per product**, and marginal (only the revenue above each line moves to the lower rate). Confirmed by GameDiscoverCo's ["Revealed: the numbers behind Steam's '24% cut' in 2025"](https://newsletter.gamediscover.co/p/revealed-the-numbers-behind-steams) (published **24 March 2026**), which also gives the platform-wide effective rate:

- Valve's **effective cut across all third-party games in 2025 was 24%** (i.e. it paid out 76%), on approximately **$14.98B of third-party game revenue**.
- Breakdown of that $14.98B: **$3.5B (23%)** was earned by games still in the 30% tier, **$3.74B (25%)** in the 25% tier, and **$7.74B (52%)** in the 20% tier.

The practical reading for a solo dev: **you will be in the 30% tier forever.** The tiered structure is a rounding error for anyone below $10M lifetime. Treat Steam's cut as a flat 30% off the top, before VAT and regional pricing.

### 1.3 What you actually net

Sticker price minus Steam's 30% is *not* your take-home. Regional pricing (a $9.99 US game is far cheaper in Turkey, Argentina, Brazil, India), VAT/sales tax collected inside the displayed price in most territories, refunds, and discounts all bite first. Third-party estimators that model this arrive at roughly **29–30% of gross revenue reaching the developer** — e.g. [The Cosmic Wheel Sisterhood](https://steam-revenue-calculator.com/app/1340480/the-cosmic-wheel-sisterhood) is modelled at $2,863,864 gross → $844,840 net (29.5%). **[ESTIMATE — Boxleiter-method model, not audited figures.]** A safer planning rule than "70%" is **"roughly a third of sticker gross reaches your bank account."**

### 1.4 Payments

From [Reporting and Payments](https://partner.steamgames.com/doc/finance/payments_salesreporting) (verified 22 Aug 2026):

- **Payment lag:** "Valve issues payment for sales 30 days after they are made, usually at the end of the month. For example, payments for February sales will be made at the end of March."
- **Minimum payout threshold: $100.** "If your products have sales for the prior month and have exceeded the minimum $100 threshold, Valve will issue payment via Electronic Funds Transfer (EFT)." Below $100 the balance rolls forward.
- Method: ACH for US banks, USD SWIFT wire internationally.

### 1.5 What Steamworks requires before you can ship

From [Onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding) and [Release Process](https://partner.steamgames.com/doc/store/releasing) (both verified 22 Aug 2026):

| Requirement | Detail |
|---|---|
| Legal identity | Company/individual legal name matching bank and tax documents |
| Agreements | Electronically signed NDA + Steam Distribution Agreement |
| Bank details | Routing number, account number, address; **account holder name must match onboarding name** |
| Tax forms | W-9 (US) or W-8BEN equivalent (treaty countries). **Tax verification takes 2–7 business days** and may require extra documents |
| App fee | $100 per product |
| **30-day fee-to-release wait** | "A 30-day waiting period between when you paid the app fee and when you can release your game" |
| **Coming Soon ≥ 2 weeks** | "you must have a Coming Soon page up for at least two weeks before releasing" ([Coming Soon docs](https://partner.steamgames.com/doc/store/coming_soon)) |
| Store Presence checklist | Capsule art set, description, trailer, pricing — "Mark as ready for review" |
| Game Build checklist | App configuration + "mostly final build" |

### 1.6 Review timing

- **Store page review: 3–5 business days.** Valve advises submitting "at least 7 days before you want your page live to account for potential changes you'll need to make" ([Release Process](https://partner.steamgames.com/doc/store/releasing)).
- Onboarding docs give an overall range of **"between 1–5 days"** for store page and build review.
- The build review is a functional check (does it install, launch, match the store description), not a quality bar.

**Total realistic zero-to-release-eligible clock: 5–7 weeks.** Onboarding + tax verification (up to ~2 weeks with back-and-forth) → pay fee → 30-day wait → store page review (1 week) → Coming Soon live 2 weeks (overlaps the 30-day wait). You cannot compress this by paying more.

### 1.7 Pricing rules

From [Pricing](https://partner.steamgames.com/doc/store/pricing) (verified 22 Aug 2026):

- **Minimum base price:** equivalent of the **$0.99 USD tier**. Lowest possible transaction price ≈ **$0.49** (50% off the minimum).
- **Maximum discount is capped by base price tier:** $0.99 tier → max 50% off; $1.99 tier → max 75%; $4.99 tier → max 90%. Cheap games have less discount headroom, which limits your ability to participate meaningfully in seasonal sales.
- **Discount cooldowns:** no discount within 30 days of release, or within 30 days of a launch discount ending. Raising a price triggers a fresh 30-day discount cooldown.

### 1.8 Steam keys (relevant to Kickstarter fulfilment)

From [Steam Keys documentation](https://partner.steamgames.com/doc/features/keys) (verified 22 Aug 2026):

- Keys are **free**. Up to **5,000 Default Release keys** for a launching game; **Release State Override (beta/early-access) keys generally limited to 2,500**.
- **Price parity rule:** "It is important that you don't give Steam customers a worse deal than Steam Key purchasers."
- **Crowdfunding restriction:** "Steam keys are not intended to be used for ongoing crowdfunding ('slacker backer' or Late Pledge campaigns) prior to your game's availability for purchase on Steam." A one-shot Kickstarter is fine; an indefinite late-pledge store fulfilled with Steam keys is not.

### 1.9 What actually changed in 2025–2026 for small developers

Four changes matter, and one of them is large.

**a) The store redesign gutted Popular Upcoming (June 2026) — see §2.1.** This is the single most important change on this list.

**b) Generative-AI disclosure was rewritten (January 2026).** Valve replaced the blanket "does this game use AI?" question with three graded questions, and narrowed the public-disclosure trigger: you now only disclose publicly if AI-generated content **"ships with your game, and is consumed by players."** Using AI during development (coding assistance, ideation) no longer requires disclosure. Reported by [KitGuru, 19 January 2026](https://www.kitguru.net/desktop-pc/mustafa-mahmoud/steam-updates-its-gen-ai-disclosure-policies/). **[Secondary source — I could not retrieve the body text of Valve's own announcement; the three-question structure and the "consumed by players" wording are quoted from KitGuru's report.]** Directly relevant: if Manzil's Kickstarter-funded card art is AI-assisted in any way that ships, it is disclosable and appears on the store page.

**c) Next Fest lost its official livestream (2026).** Per the [October 2026 Next Fest documentation](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/2026october): "There is no more official livestream" and "The developer livestream portion of the event has been shifted to an independent tab."

**d) A Kickstarter-branded Steam festival now exists.** ["Backed by Backers"](https://updates.kickstarter.com/backed-by-backers-a-steam-festival-powered-by-kickstarter/) ran **14–21 April 2026** with 400+ creators, open to games currently crowdfunding or previously crowdfunded on Kickstarter. Whether it recurs annually is **[UNVERIFIED]**, but it is a real, free visibility slot that a Kickstarter-funded game qualifies for.

---

## 2. Steam discovery math as it actually works now

### 2.1 The 7,000-wishlist figure is obsolete. This is the headline finding.

The widely-cited ~7,000-wishlist threshold for **Popular Upcoming** was accurate until roughly mid-2026. It is not accurate now.

In the **June 2026 store redesign**, Valve changed Popular Upcoming's default sort from release order to a buzz-weighted ranking. Per [PC Gamer, 6 June 2026](https://www.pcgamer.com/gaming-industry/indie-devs-mixed-on-steams-latest-redesign-over-visibility-complaints/), quoting affected developers:

> "the page used to list games in release order, 'as long as you had enough wishlists to make the cut (~6k to 7k),' but now favors 'far more large games from major companies … the lowest wishlist count on there right now is 80k.'"

**The de-facto Popular Upcoming floor moved from ~7,000 to ~80,000 wishlists.** For a solo indie, Popular Upcoming is now effectively unreachable and should be removed from your plan entirely.

### 2.2 What replaced it: the Personal Calendar

Valve simultaneously introduced a **Personal Calendar** — a per-user, algorithmically-personalised upcoming-releases widget. Chris Zukowski's analysis, ["How the Steam Personal Calendar affects your launch"](https://howtomarketagame.com/2026/06/25/how-the-steam-personal-calendar-affects-your-launch/) (**25 June 2026**):

- Valve says the model "gets re-trained daily to incorporate the latest data."
- **Horizon: 8 weeks pre-launch, plus ~1 month post-launch.** You need a release date set 2+ months out to get the full window.
- **Volume shift:** Popular Upcoming delivered ~1,000 wishlists/day for 1–2 days of placement. Personal Calendar delivers **300–3,000 wishlists/day across 2–3 months**.
- **Quality shift is dramatic.** One case study: Popular Upcoming produced 1,297,384 impressions at **0.81% CTR** = 10,538 visits. Personal Calendar produced only 79,820 impressions but at **33.83% CTR** = **27,001 visits**. Fewer, far better-targeted eyeballs.
- **Wishlist bands to appear (sample of ~100 games):** 30th percentile ≈ **8,000** wishlists, median ≈ **28,000**, 70th percentile ≈ **66,000**.

Zukowski's [Benchmarks page](https://howtomarketagame.com/benchmarks/) gives Personal Calendar placement tiers (study date June 2026): Bronze (Top 250) 5,000–32,000 WL; Silver (Top 100 default view) 8,000–60,000 WL; Gold (Top 50) 50,000–120,000 WL; Diamond (Top 10) 90,000–360,000 WL.

**Net effect:** the entry price for pre-launch algorithmic visibility went from ~7,000 wishlists to **~5,000 at the absolute floor and ~8,000 to be meaningfully visible.** The number moved, but for very small games it moved less catastrophically than Popular Upcoming's 80k suggests — the Personal Calendar is, per PC Gamer's reporting, "heavily weighed towards smaller games," and several indies said it *offset* the Popular Upcoming loss.

One caution from Zukowski's [August 2026 case study](https://howtomarketagame.com/2026/08/20/part-2-the-week-of-the-golden-age/) (20 Aug 2026): **the Personal Calendar is removed during major seasonal sales**, and one game saw wishlist velocity halve during the Summer Sale as a result.

### 2.3 Launch-wishlist benchmarks (updated June 2026)

Zukowski's [Benchmarks page](https://howtomarketagame.com/benchmarks/), "Launch Wishlists Required," **updated June 2026**:

| Tier | Wishlists at launch | Corresponding lifetime revenue tier |
|---|---|---|
| Bronze | 5,000 | $0 – $10,000 |
| Silver | 8,000 | $10,001 – $249,000 |
| Gold | 50,000 | $250,000 – $999,000 |
| Diamond | 90,000 | $1,000,000+ |

Revenue tier definitions from Zukowski's [Benchmarks for selling a game on Steam](https://howtomarketagame.com/2022/09/25/benchmarks-for-selling-a-game-on-steam/) (25 Sep 2022, still the canonical tier definition). Note the brutal implication: **5,000 wishlists at launch is the *Bronze* outcome — $0 to $10,000 lifetime.**

### 2.4 Visibility rounds, Discovery Queue, and "More Like This"

**Update Visibility Rounds** ([Steamworks docs](https://partner.steamgames.com/doc/marketing/visibility/update_rounds), verified 22 Aug 2026):
- **Five rounds per product, total, for life.** Shared between Early Access and full release — spend them in EA and you have none after launch.
- Each round runs "up to 30 days from the date it started or cap out at **1M impressions on the homepage**, whichever comes first."
- Impressions are shown **only to customers who own the game or have it wishlisted.** This is not new-audience reach; it is a re-engagement tool. Its value scales with the wishlist list you already built.
- Cannot start until initial launch visibility concludes. "Typically will not show up during major seasonal sale events" — but blackout days still burn your 30-day clock.
- "Additional rounds may be granted to products that are selling well" (no threshold stated).

**Discovery Queue.** Valve's public docs don't quantify it; Zukowski's survey data ([Benchmarks](https://howtomarketagame.com/benchmarks/), study date **February 2025**) does. Discovery Queue impressions in the 10 days after launch:

| Tier | DQ impressions (10 days) | Share of all traffic |
|---|---|---|
| Bronze | 22,000 | **54%** |
| Silver | 126,000 | 45% |
| Gold | 250,000 | 45% |
| Diamond | 665,000 | 32% |

The important structural insight: **the Discovery Queue is the majority of traffic for the smallest games and a declining share as you get bigger.** It is the platform's floor, not its ceiling — 22,000 impressions is real but it is roughly one day of a mid-sized subreddit. At typical store-page conversion this yields hundreds of visits, not thousands of sales.

**"More Like This"** operates on tag overlap and co-purchase behaviour. I could not find a first-party or GameDiscoverCo quantification of its traffic share; the numbers circulating are from AI-generated SEO sites and I do not trust them. **[UNVERIFIED]** The structural point is sound and worth acting on: your tags determine which games you appear alongside, and being a strong tag-match for a popular game is worth more than being a weak match for several.

### 2.5 What a launch with fewer than 1,000 wishlists realistically earns

No source states this as a headline number, so here is the arithmetic from sourced inputs, with each assumption labelled.

**Conversion rate.** Two sources, and they disagree:
- Zukowski's first-week wishlist conversion benchmark: **15%–25% median** ([Benchmarks](https://howtomarketagame.com/benchmarks/), study date June 2020 — old). His [2022 benchmark post](https://howtomarketagame.com/2022/09/25/benchmarks-for-selling-a-game-on-steam/) says "a really good rate for Steam is 20% of your wishlists converting to a sale. Even 15% is something to be proud of."
- GameDiscoverCo's more recent and more pessimistic ["The state of Steam wishlist 'conversions': 2024–2025"](https://newsletter.gamediscover.co/p/the-state-of-steam-wishlist-conversions) (**17 October 2025**): median **0.15x** week-1 sales-to-launch-wishlists for games above 25k wishlists; **0.10x** for games priced above $10. Carless is blunt that the metric is "near-fatally flawed" — "the performance range of wishlists at launch compared to sales at the end of Week 1 varies by 10-20x, not 10-20%," with a 2024 poll finding ratios from **0.017x to 1.7x**.

I'll use **15%** as a mid, generous-to-small-games estimate (small games' wishlists tend to be hotter and more recent than a 100k list's).

**The model — 800 wishlists, $9.99:**

| Line | Value | Basis |
|---|---|---|
| Wishlists at launch | 800 | assumption |
| Week-1 units | ~120 | 15% conversion **[ESTIMATE]** |
| Week-1 gross (sticker) | ~$1,199 | 120 × $9.99 |
| Week-1 net to dev | **~$350–$840** | 29.5% realistic / 70% naive (§1.3) |
| Year-1 gross multiple | 4× week 1 | GameDiscoverCo [long-tail survey](https://newsletter.gamediscover.co/p/data-deep-dive-whats-the-long-tail), 16 Nov 2020 — **dated, ~100 devs** |
| **Year-1 net to dev** | **~$1,400 – $3,400** | |

At $4.99 halve it. At 400 wishlists halve it again.

**Sanity check against population data.** Analysis of Gamalytic estimates for 2025 releases ([game-developers.org, 21 August 2026](https://game-developers.org/2025-steam-game-revenue-distribution)) **[ESTIMATE — third-party inference from reviews/pricing/player activity, not Valve figures]**:
- **65.9% of 2025 Steam releases earned under $1,000.**
- **Roughly 40% never cleared the $100 Steam Direct threshold** — i.e. never recouped the fee.
- **Only 8% grossed more than $100,000.**

So a sub-1,000-wishlist launch lands you squarely in the modal outcome: **low four figures lifetime, possibly not recouping the $100.** That is the honest answer.

### 2.6 Market context — how crowded it is right now

| Metric | Figure | Source & date |
|---|---|---|
| Games released on Steam, 2025 | **20,282** | [Zukowski, "What the hell happened in 2025?"](https://howtomarketagame.com/2026/01/27/what-the-hell-happened-in-2025/), 27 Jan 2026 |
| Games hitting 1,000+ reviews, 2025 | **608 (2.99%)** — the highest rate in the analysed period | ibid. |
| Q1 2026 releases | **5,971** | [Zukowski, "2026 Q1 Games"](https://howtomarketagame.com/2026/05/14/2026-q1-games/), 14 May 2026 |
| Projected 2026 total | **25,799 (+23.7% YoY)** | ibid. |
| Q1 2026 releases with 0–9 reviews | **3,686 (63.2%)** | ibid. |
| Ratio of zero-review to 1,000-review games | **38:1 in 2026**, up from 26:1 in 2024 | ibid. |
| Third-party revenue on Steam, 2025 | **~$14.98B** | [GameDiscoverCo](https://newsletter.gamediscover.co/p/revealed-the-numbers-behind-steams), 24 Mar 2026 |

Supply is growing ~24% a year. Demand is not. That is the whole story of Steam discovery in 2026.

---

## 3. How card games and small strategy games perform on Steam

### 3.1 Comparables

All revenue figures below marked **[ESTIMATE]** come from [steam-revenue-calculator.com](https://steam-revenue-calculator.com/), which applies the **Boxleiter method** (units inferred from review counts) and models regional pricing, discounts, refunds, Steam's cut and taxes. The site's own disclaimer: "estimates based on the Boxleiter method, not audited numbers … treat the output as an order-of-magnitude guide." I retrieved all of these on **22 August 2026**; the underlying review counts are current as of that fetch, but the site does not stamp its estimates.

| Game | Price | Reviews | Est. gross | Est. net to dev | Note |
|---|---|---|---|---|---|
| [Balatro](https://steam-revenue-calculator.com/app/2379780/balatro) | $14.99 | 132,326 | **$95,211,204** | $28,087,305 | The 2024 outlier. Solo dev + publisher (Playstack) |
| [Slay the Spire](https://levvvel.com/slay-the-spire-statistics/) | $24.99 | — | **~$43M / ~3M copies** | — | Per VG Insights via Levvvel, article last updated **May 2024** — stale |
| Slay the Spire II | — | — | **~$92M in two weeks / 4.6–7M units** | — | Launched March 2026. [Sensor Tower](https://sensortower.com/blog/mega-crits-slay-the-spire-ii-slays-with-7-million-units-sold) reports 7M units; [wccftech](https://wccftech.com/slay-the-spire-2-estimated-4-6-million-copies-sold-92-million-revenue-generated/) reports 4.6M/$92M. **Figures conflict — [PARTIALLY VERIFIED]** |
| [Nova Drift](https://steam-revenue-calculator.com/app/858210/nova-drift) | $17.99 | 12,658 | **$11,158,154** | $3,291,655 | **[ESTIMATE]** |
| [Dicey Dungeons](https://steam-revenue-calculator.com/app/861540/dicey-dungeons) | $14.99 | 9,949 | **$5,368,878** | $1,583,819 | **[ESTIMATE]** |
| [Luck be a Landlord](https://steam-revenue-calculator.com/app/1404850/luck-be-a-landlord) | $9.99 | 9,539 | **$3,430,606** | $1,012,029 | **[ESTIMATE]**. [SteamSpy](https://steamspy.com/app/1404850) owner range 200k–500k. Dev [declined to disclose](https://blog.trampolinetales.com/whats-next-for-luck-be-a-landlord/) actual figures (22 Jan 2023) |
| [Ratropolis](https://steam-revenue-calculator.com/app/1108370/ratropolis) | $17.99 | 4,878 | **$3,159,188** | $931,960 | **[ESTIMATE]** |
| [The Cosmic Wheel Sisterhood](https://steam-revenue-calculator.com/app/1340480/the-cosmic-wheel-sisterhood) | $17.99 | 4,422 | **$2,863,864** | $844,840 | **[ESTIMATE]**. Tarot-themed, closest thematic analogue found |
| [Die in the Dungeon](https://steam-revenue-calculator.com/app/2026820/die-in-the-dungeon) | $12.99 | 1,874 | **$876,357** | $258,525 | **[ESTIMATE]**. Browser-game-first, itch.io origin — see §5.2 |
| [Card Crawl](https://steam-revenue-calculator.com/app/745000/card-crawl) | $2.99 | **167** | **~$9,987** | **~$2,946** | **[ESTIMATE]**. See §3.3 |
| [Card Crawl Adventure](https://steamdb.info/app/2190260/) | $4.99 | **68** (73.3% positive) | **~$0** (below estimator floor) | — | Released 1 Mar 2023 |

### 3.2 The median is not on this list, and that is the point

There is no published "median small card game" figure. What exists:

- **Roguelike Deckbuilder success rate: 4.87%** of the 205 games in that tag released in 2025 reached 1,000+ reviews. From Zukowski's ["Leftover research from 2025"](https://howtomarketagame.com/2025/12/15/leftover-research-from-2025/) (**15 Dec 2025**). For comparison in the same dataset: Open World Survival Craft 20%, Job Simulator 34.7%, City Builder 6.4%, Metroidvania 4%, Idle 2.88%, Tower Defense 2.57%, Puzzle Platformer 1.47%.
- Platform-wide, the 2025 rate was **2.99%** (§2.6).

**So the deckbuilder tag runs at ~1.6× the platform hit rate.** That's genuinely favourable — but 4.87% still means 195 of every 205 deckbuilders released in 2025 failed to reach 1,000 reviews. The category is not easy; it is merely less bad than average.

Momentum check: Zukowski's [Q1 2026 review](https://howtomarketagame.com/2026/05/14/2026-q1-games/) (14 May 2026) notes "There were 3 Deckbuilders that did well in Q1 where in the past only 1 per year" — *One Turn Kill*, *Slay the Spire 2*, and *Dream of Corpse Lady*. Interest in the category is rising, not falling.

Tag-density figure: [SteamDB's Card Game tag page](https://steamdb.info/tag/1666/) caps its listing at 100 results and does not publish a total. I could not obtain a reliable count of Card Game–tagged titles. **[UNVERIFIED]**

### 3.3 The comparable that should worry you most: Card Crawl

[Card Crawl](https://play.google.com/store/apps/details?id=com.tinytouchtales.cardcrawl) by Arnold Rauers / Tinytouchtales is a genuinely beloved, critically-praised, short-session, single-player, deterministic-ish card game — the same shape as Manzil. On mobile it has **~1.3 million Google Play downloads** ([AppBrain](https://www.appbrain.com/app/card-crawl/com.tinytouchtales.cardcrawl), verified 22 Aug 2026), plus an iOS presence that predates it.

On Steam, priced at $2.99, it has **167 reviews** and an estimated **~$10,000 gross / ~$2,900 net** **[ESTIMATE]**. Its 2023 Steam sequel, *Card Crawl Adventure*, has **68 reviews**.

This is not a story about a bad game. It is a story about a *category of game* — the elegant, short, self-contained, mobile-shaped card game — landing on Steam with the audience it deserves on phones and the audience it gets on PC. **Manzil is currently that shape.**

### 3.4 What the winners have that Card Crawl doesn't

Look across the top of §3.1 and the pattern is consistent. Every game above $1M has at least two of:

1. **A run structure with escalating stakes** (Slay the Spire, Balatro, Dicey Dungeons, Die in the Dungeon, Luck be a Landlord)
2. **Build variety / combinatorial expression** — the player authors something, and the thing they authored is what they talk about
3. **Long sessions or long meta-progression** — hundreds of hours of retention, which is what generates the reviews that generate the Boxleiter revenue in the first place
4. **A screenshot that is legible in 400ms** in a Discovery Queue

Manzil, as described, has a 2-minute board and a ~10-minute match, no run structure, no deck construction, and placeholder art. On Steam that is a structural disadvantage that no amount of marketing fixes. See implication #5.

---

## 4. Steam Next Fest and demos

### 4.1 How it works in 2026

From [Steamworks: Steam Next Fest October 2026](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/2026october) (verified 22 Aug 2026):

- **Event dates: 19 October 2026, 10:00 PDT → 26 October 2026, 10:00 PDT.**
- **Registration deadline: 31 August 2026, 11:59pm PDT.** That is **nine days from today.**
- 21 September — demo build and store page review deadline for Press Preview inclusion
- 5 October — all required submissions complete
- 8 October — press preview goes live; final trailer opt-out deadline

**Eligibility:**
- Steamworks account in good standing
- **Published public store page** (so: fee paid, page approved, live)
- Not a prologue, chapter 1, or demo of already-released content
- **Publicly playable demo live by the time the festival begins**
- **Must release after the fest ends** (after 26 Oct 2026)

**The rule that matters most: "Titles are only allowed to participate in one Next Fest."** One shot, ever, per title. You choose which edition. There is no second attempt.

**2026 change:** no more official livestream; developer streams moved to an independent tab.

### 4.2 Does it still move the needle? Yes, with sharply diminishing returns and a hard floor

**February 2026** — Zukowski, ["Making sense of the February 2026 Steam Next Fest"](https://howtomarketagame.com/2026/04/13/making-sense-of-the-february-2026-steam-next-fest/) (**13 April 2026**), ~3,000 participating games:

| Percentile | Wishlists gained |
|---|---|
| 30th | 382 |
| **Median** | **806** (down from 1,079 in Feb 2025) |
| 70th | 1,839 |
| 95th | 13,461 |
| Max | 57,074 |

He concludes it "still moves the needle."

**June 2026** — Carless, ["Who 'won' June 2026's Steam Next Fest?"](https://newsletter.gamediscover.co/p/who-won-june-2026s-steam-next-fest) (**23 June 2026**): **4,382 demos, +66% year on year**. The median game *in the top 10%* gained ~121 followers (**~3,000 wishlists estimated**), **down 25%** from June 2025's +163. Carless: "there's no longer a monoculture" — success comes from hitting a specific segment, not broad appeal.

**The critical finding for a small game** — Zukowski, ["Did AI Slop ruin Steam Next Fest June 2026?"](https://howtomarketagame.com/2026/07/13/did-ai-slop-ruin-steam-next-fest-june-2026/) (**13 July 2026**, survey of 119 developers):

> Games entering with **1,000+ wishlists performed *better*** in June 2026 than in February 2026. Games entering with **fewer than 1,000 pre-fest wishlists were negatively impacted** — buried by the volume of low-quality submissions.

He also found that **momentum** (wishlists earned in the two weeks *before* the fest) correlated with success slightly more strongly than raw pre-existing wishlist count, with both together most predictive.

**Read this as a gate: do not enter Next Fest with under 1,000 wishlists.** You spend your one and only shot to get buried.

### 4.3 Demo-to-wishlist conversion

From Zukowski, ["Most people will play your demo and not wishlist it and that is ok"](https://howtomarketagame.com/2026/06/30/nobody-plays-demos-and-that-is-ok/) (**30 June 2026**), from June 2026 Next Fest data:

| Percentile | % of demo players who wishlist |
|---|---|
| 30th | 15.9% |
| **Median** | **19.3%** |
| 70th | 23.2% |

Roughly **one in five** demo players wishlists. Plan accordingly: 1,000 wishlists from a demo needs ~5,000 demo players.

**Demos are the single highest-leverage marketing asset.** Two datapoints:
- [The demo effect: from 7,000 wishlists to 42,000](https://howtomarketagame.com/2025/08/26/the-demo-effect-from-7000-wishlists-to-42000/) (**26 Aug 2025**): *Parcel Simulator* accumulated 7,000 wishlists over 640 days pre-demo (~11/day), then 35,000 in 116 days post-demo (~362/day) — **a 33× acceleration.** Zukowski: "Demos are critically important for visibility for most games."
- [*Bills Must Be Paid*](https://howtomarketagame.com/2026/08/20/part-2-the-week-of-the-golden-age/) (**20 Aug 2026**), 2-person team, 7-month dev, $200 total paid marketing: 528 wishlists at announcement → **61,000+ at launch**; demo launch was "the critical turning point"; Next Fest contributed 7,000 of those wishlists; **$163,842 in the first 24 hours**, 330,000 units in 20 days.

Note what that last example implies: **Next Fest supplied 7,000 of 61,000 wishlists — about 11%.** Next Fest is an amplifier of existing momentum, not a source of it.

### 4.4 Next Fest and Kickstarter — can you run both, and in what order?

Nothing in Steam's rules prevents running a Kickstarter and a Next Fest simultaneously, and there is now a Kickstarter-branded Steam festival (§1.9d). But the constraints stack into a fairly forced sequence:

1. **A Steam page must exist before the Kickstarter, not after.** The Kickstarter's most durable output is not money — it is wishlists. Every backer and every visitor who bounces should be funnelled to a live Coming Soon page. A Kickstarter without a Steam page attached is leaving its main asset on the table.
2. **The demo should precede the Kickstarter.** Demo-to-wishlist is ~19%; a Kickstarter page with "play it now" converts far better than one with a video. And the demo is what proves you can ship.
3. **Next Fest should come last, and only above the 1,000-wishlist gate.** It is one-shot, it amplifies momentum rather than creating it, and its ROI is a function of what you bring to it.
4. **Steam key fulfilment constrains the Kickstarter's tier design.** Max 2,500 Release State Override (beta) keys; no ongoing slacker-backer key sales; price parity with Steam. Design reward tiers around those limits (see §1.8).
5. **The game must release after the Next Fest it enters.** So Next Fest sets a floor on your release date, not a ceiling.

**Recommended order:** Steam Coming Soon page → build wishlists → demo → Kickstarter (converting demo players into backers, backers into wishlisters) → Next Fest (only if >1,000 wishlists) → launch 2+ months after setting the release date, to get the full Personal Calendar window.

---

## 5. Does the game need to be on Steam at all?

### 5.1 What Steam adds

1. **A population that pays for games.** ~$14.98B of third-party revenue in 2025 ([GameDiscoverCo](https://newsletter.gamediscover.co/p/revealed-the-numbers-behind-steams), 24 Mar 2026), overwhelmingly premium purchases rather than IAP.
2. **Wishlists as an owned, durable, re-addressable audience.** This is the thing neither itch nor mobile gives you. A wishlist is a promise of a notification at launch, at every discount, and during every Update Visibility Round. It compounds across projects.
3. **Free recurring distribution via the Discovery Queue** — 54% of all traffic for a Bronze-tier game (§2.4). It costs nothing and it keeps running.
4. **Refunds, cloud saves, achievements, community forums, review system, regional pricing, tax handling** — infrastructure that would take months to build and that players expect.
5. **Legitimacy.** A Steam page is the artefact press, streamers and Kickstarter backers treat as proof the project is real.

### 5.2 itch.io — free, but not a business

itch.io charges no listing fee and lets the creator set the platform's cut (10% by default). It is the natural home for a self-contained HTML file — browser-playable, zero packaging work.

But the traffic reality, from Zukowski's [itch.io traffic benchmarks](https://howtomarketagame.com/2025/05/12/benchmark-itch-io-traffic/) (**12 May 2025**, survey of **169 developers**):

| Metric | 30th pct | Median | 70th pct | Mean |
|---|---|---|---|---|
| Lifetime views | 397.5 | **1,582** | 12,150 | 54,483 |
| Downloads | 32.6 | **113** | 966.4 | 6,017 |

Browser plays are ~44.8% of views on average, and **browser-playable games see roughly 3× the engagement of download-only titles** — directly relevant to Manzil, which is already a browser game.

Zukowski's verdict is unusually blunt: **"You will not make money from Itch.io. Nobody does."**

**But itch has a different, real value: it is a truth serum.** From ["Can itch.io success translate to Steam success?"](https://howtomarketagame.com/2025/05/22/more-games-that-made-the-itch-io-to-steam-transition/) (**22 May 2025**), examining five transitions:

- *Die in the Dungeon*: itch 1.4M views / 78K downloads / **919K browser plays** (Feb 2021) → Steam 1,694 reviews, 2,848 peak CCU (Feb 2025). Dev: "99% of the marketing was organic, youtubers and streamers just found the game."
- *NIMRODS*: itch 123K views / 81.8K browser plays → Steam 1,203 reviews, 2,168 peak CCU.
- *Tiny Kingdom*: itch 198K views / 8.2K downloads → Steam **107 reviews**, 103 peak CCU. Underperformed.

The load-bearing quote: **"I didn't see any games that did poorly on itch, but did well on Steam."**

itch success is **necessary but not sufficient** for Steam success. Which makes it the cheapest possible pre-test of whether Manzil has the thing.

### 5.3 Mobile

- Mobile IAP revenue **H1 2026: $40B, down 2% YoY**; downloads flat at 24B. Ad spend $7B, up 7%. ([Sensor Tower H1 2026 Digital Gaming Market Index, via mobilemarketingreads, 31 July 2026](https://www.mobilemarketingreads.com/mobile-gaming-in-app-purchase-revenue-declined-2-in-h1-2026-as-ad-spend-reached-new-highs/))
- **Premium mobile releases grew 77% in 2025 to just under 750 titles**; PC/console-to-mobile ports rose from 7 in 2024 to 23 in 2025. ([AppMagic data, via GameDev.net, 8 July 2026](https://gamedev.net/news/premium-mobile-games-are-back-with-releases-up-77-in-2025-r4367/))
- **The number that settles the argument: Balatro made an estimated $21.3M and 3.1M downloads on mobile** (ibid.) **versus ~$95M gross on Steam** ([estimate](https://steam-revenue-calculator.com/app/2379780/balatro)). Same game, same year, same audience appetite. **Steam produced roughly 4.5× the revenue of mobile for an identical product.**

Mobile is not a substitute for Steam. For a premium card game, it is a smaller market with worse discovery and much worse ARPU. What mobile *is* good for: retention, daily habit, and — for Manzil specifically — the astrology companion, which is a daily-return product that phones are built for and Steam is not.

### 5.4 What Steam costs in effort, concretely

Manzil is a single self-contained HTML file with inline JS and no build step. Getting that onto Steam means:

| Task | Effort | Notes |
|---|---|---|
| Desktop wrapper | Electron or Tauri | [webgamedev.com's desktop guide](https://www.webgamedev.com/publishing/desktop): Electron produces **100MB+ builds** but is "the most complete and battle-tested," and "the only desktop framework officially supported by the two main libraries that help distribute games on Steam." Tauri/Neutralino/Wails use OS webviews (smaller) but "WebKit web views… are not as performant as Chromium when it comes to graphics" |
| Steamworks integration | [steamworks.js](https://github.com/ceifa/steamworks.js) (maintained) or Greenworks (original unmaintained 8+ years; community fork exists) | Needed for achievements, cloud saves, overlay |
| Build + signing | electron-builder or Electron Forge | Handles code signing, auto-update, platform installers. Windows/macOS code signing certificates are an annual cost |
| Platform builds | Windows minimum; macOS + Linux optional | Linux build ≈ Steam Deck compatibility |
| Store assets | 6+ capsule sizes, screenshots, **trailer** | The trailer is the real cost. Placeholder art makes a trailer that actively hurts you |
| Ongoing | Reviews, forums, patches, sale participation | Perpetual, unbudgeted, and the part solo devs consistently underestimate |
| Rewrite of the place-search API call | Must work offline or degrade gracefully | A desktop build that requires a server for a core feature is a support burden and a refund generator |

A [Phaser tutorial from 26 March 2025](https://phaser.io/news/2025/03/publishing-web-games-on-steam-with-electron) walks the full path (Electron → electron-builder → GitHub Actions → Steamworks upload); the technical work is a known, bounded quantity — call it **one to two weeks for a competent solo dev.** The packaging is genuinely not the hard part. **The art, the trailer, and the twelve months of wishlist accumulation are the hard part.**

---

## Implications for Manzil

**Verdict up front: buy the Steam page now, do not launch on Steam in 2026, and do not enter the October 2026 Next Fest.** Steam is worth $100 and a store page today, as an audience-collection instrument and a legitimacy artefact for the Kickstarter. It is not worth a launch until the art is finished and the wishlist count clears four figures. The binding constraint on Manzil is not distribution — it is that the game currently has placeholder art and a session shape that Steam's audience does not reward. Shipping into that is how you get 167 reviews.

1. **Pay the $100 and open a Coming Soon page within the next month — but set the release date as "Coming Soon" with no date, and treat the page as a wishlist bucket, not a launch commitment.** The fee is recoupable at $1,000 AGR ([Steamworks](https://partner.steamgames.com/doc/gettingstarted/appfee)), which you may never reach — so genuinely treat it as a $100 spend, not an investment. What you get for it is a URL that every Kickstarter backer, every astrology-app user, and every itch player can be pushed toward for the next twelve months. Wishlists accumulated now are the only asset that compounds. The 30-day fee-to-release wait and the 2-week Coming Soon minimum also mean the page must exist long before you want to ship; open it early and the clock is never your problem.

2. **Delete "7,000 wishlists" from your plan. The number you need is 8,000, and the number that means failure is 5,000.** Popular Upcoming's floor moved from ~7k to ~80k in the [June 2026 redesign](https://www.pcgamer.com/gaming-industry/indie-devs-mixed-on-steams-latest-redesign-over-visibility-complaints/); the replacement Personal Calendar wants [~8,000 at the 30th percentile and ~28,000 at the median](https://howtomarketagame.com/2026/06/25/how-the-steam-personal-calendar-affects-your-launch/). Zukowski's [June 2026 benchmark](https://howtomarketagame.com/benchmarks/) is explicit: **5,000 launch wishlists is the Bronze tier, and Bronze is $0–$10,000 lifetime.** If your honest projection is under 5,000, you are planning a launch that will earn less than a month of contract work.

3. **Run the sub-1,000 number before you fall in love with the plan.** 800 wishlists × 15% week-1 conversion ≈ 120 units; at $9.99 that is ~$1,200 sticker gross, **~$350–$840 net**, and maybe **$1,400–$3,400 net across year one** (§2.5). Against a population where [65.9% of 2025 releases earned under $1,000 and ~40% never recouped the $100](https://game-developers.org/2025-steam-game-revenue-distribution). This is not a pessimistic scenario. It is the modal one. Any Steam plan that does not have a credible path past 5,000 wishlists is a plan to spend a year of evenings for beer money.

4. **Your comparable is Card Crawl, not Balatro, and you should sit with that.** Card Crawl: ~1.3M Google Play downloads, genuinely excellent, exactly your shape — **167 Steam reviews, ~$10K gross estimated.** Its sequel: 68 reviews. The failure mode for "elegant short-session card game with a clean hook" on Steam is not obscurity from bad marketing; it is that Steam's buyers want 40-hour games and Manzil is currently a 10-minute one. Balatro is on your comparables list because it is a card game. It is not on your comparables list in any way that predicts your outcome.

5. **The highest-leverage change available to you is a design change, not a marketing one — add a run structure.** Every comparable above $1M in §3.1 has escalating stakes across a session, build variety the player authors, and a reason to play a hundred hours. Manzil has a 2-minute board and a 10-minute match. [Roguelike Deckbuilder hit 4.87% in 2025 against a 2.99% platform average](https://howtomarketagame.com/2025/12/15/leftover-research-from-2025/); "abstract board tactics" has no such tailwind. Twenty-eight lunar mansions is *already a run length*. A gauntlet through the mansions, with cards drafted and kept between boards, converts Manzil from a Card Crawl into a Die in the Dungeon — the difference between ~$10K and ~$876K in estimated gross. Zukowski's own conclusion from the *Bills Must Be Paid* case study: **"the most important marketing decision is the type of game you make."**

6. **Do not enter Steam Next Fest October 2026. Registration closes 31 August — nine days away — and you would be spending your single lifetime shot on placeholder art.** [You only get one Next Fest, ever, per title.](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/2026october) The [June 2026 data](https://howtomarketagame.com/2026/07/13/did-ai-slop-ruin-steam-next-fest-june-2026/) is unambiguous: games arriving with 1,000+ wishlists did *better* than in February; games arriving with under 1,000 **got buried**. Median gain across ~3,000 February 2026 participants was [806 wishlists](https://howtomarketagame.com/2026/04/13/making-sense-of-the-february-2026-steam-next-fest/), trending down. Bank it. Spend it in the edition that falls 2–4 months after the Kickstarter art lands, entering with real art, a real demo, and >1,000 wishlists.

7. **Ship a free browser build on itch.io first — this month, with the placeholder art, at zero cost — and treat the result as a go/no-go.** Manzil is already a self-contained HTML file, so itch costs you an afternoon. Browser-playable games get [~3× the engagement of download-only ones](https://howtomarketagame.com/2025/05/12/benchmark-itch-io-traffic/), and *Die in the Dungeon* went from a browser game with 919K itch plays to $876K estimated on Steam. You will not make money there — [Zukowski: "You will not make money from Itch.io. Nobody does."](https://howtomarketagame.com/2025/05/12/benchmark-itch-io-traffic/) — but you will get the one piece of information nobody can sell you: **"I didn't see any games that did poorly on itch, but did well on Steam."** If Manzil cannot beat the itch median (1,582 lifetime views, 113 downloads) with the astrology hook doing the talking, Steam will not rescue it.

8. **Sequence the Kickstarter behind the demo and in front of Next Fest, and design the tiers around Steam's key limits.** Order: itch build → Steam Coming Soon page → free demo → Kickstarter → Next Fest → launch. The Kickstarter's most valuable output is not the art budget, it is the wishlists it drives to a page that already exists. [Max 2,500 Release State Override keys and no slacker-backer key fulfilment](https://partner.steamgames.com/doc/features/keys) — cap your key-bearing tiers accordingly. And note there is now a free [Kickstarter-branded Steam festival](https://updates.kickstarter.com/backed-by-backers-a-steam-festival-powered-by-kickstarter/) (ran 14–21 April 2026, 400+ creators) that a crowdfunded game qualifies for; whether it recurs in 2027 is unverified, but check before locking your campaign dates.

9. **Ship the astrology companion first and treat it as the wishlist engine.** "The opponent plays tonight's real planetary positions" is the only thing about Manzil that no other card game on Steam has, and it is a *daily-return* hook — which is a mobile behaviour, not a Steam behaviour. Steam's Discovery Queue will give a Bronze-tier game [22,000 impressions over ten days](https://howtomarketagame.com/benchmarks/) and then move on. A companion app with a daily astrological reading and a "play tonight's board" button gives you a recurring, owned channel that pushes to your Steam page every single day for a year. That is how you get from 800 wishlists to 8,000. Steam will not do it for you, and [$200 of Reddit ads](https://howtomarketagame.com/2026/08/20/part-2-the-week-of-the-golden-age/) is what the successful case studies actually spent — the audience came from the product.

10. **Don't build the Electron wrapper yet — it is a week of work and you'd maintain it for a year for nothing.** [steamworks.js + electron-builder + GitHub Actions](https://phaser.io/news/2025/03/publishing-web-games-on-steam-with-electron) is a bounded, well-documented path; Electron will cost you a 100MB+ build but is the only wrapper the Steam integration libraries officially support. Do it in the month before the demo, not now. The one thing to fix early: **the place-search API call must degrade gracefully offline**, because a desktop build that needs a server to do a core thing generates support tickets and refunds.

11. **Set the kill criterion now, in writing, while you're not emotionally invested.** Proposed: *if the itch build plus the Steam page plus the companion app cannot reach 3,000 wishlists within six months of the page going live, do not launch on Steam at a premium price.* Instead, launch free-to-play or $2.99 on itch and mobile, keep the astrology product as the business, and write off the $100. Steam supply is [growing ~24% a year](https://howtomarketagame.com/2026/05/14/2026-q1-games/) with [63.2% of Q1 2026 releases taking 0–9 reviews](https://howtomarketagame.com/2026/05/14/2026-q1-games/); the platform is not going to get easier while you wait, and the cost of a bad launch is not the $100 — it is the permanently-spent Next Fest slot, the launch visibility you only get once, and a public review count that follows the game forever.

---

## Appendix: what I could not verify

- **Steam platform MAU/DAU for 2026.** Valve's [Steam Year In Review 2025](https://store.steampowered.com/news/group/4145017/view/528746884222682052) (published ~6 March 2026) exists but its body text would not render through any fetch path I tried. Every secondary "Steam Statistics 2026" page in the search index is AI-generated SEO with mutually contradictory numbers. **[UNVERIFIED — do not cite a MAU figure.]** [SteamDB](https://steamdb.info/) shows 535,000 apps and 1.78M packages in its database, live as of 22 Aug 2026.
- **Total count of Card Game–tagged titles on Steam.** SteamDB caps its tag listing at 100 results.
- **Quantified traffic share of "More Like This."** No first-party or GameDiscoverCo figure found.
- **Slay the Spire II's exact figures.** Sensor Tower says 7M units; wccftech says 4.6M units / $92M. These conflict and I did not resolve them.
- **Whether "Backed by Backers" recurs annually.** One instance observed (April 2026).
- **Valve's own AI-disclosure announcement text.** The January 2026 rule change is sourced to KitGuru's report, not to the Steamworks announcement itself.
- **All steam-revenue-calculator.com figures** are Boxleiter-method estimates with no visible timestamp. Treat every one as order-of-magnitude only. Review counts in that table are current as of 22 Aug 2026.
- **Zukowski's 15–25% wishlist conversion benchmark carries a June 2020 study date** and is materially more optimistic than GameDiscoverCo's [October 2025 figures](https://newsletter.gamediscover.co/p/the-state-of-steam-wishlist-conversions) (0.10–0.15x). I used 15% as a mid-estimate; if you want to be conservative, use 10%.
