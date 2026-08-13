# Research: browser games and one-time purchase

*Star Shard research corpus · August 13, 2026 · full agent report.
Synthesis in `MARKET.md`. Steam revenue figures are Boxleiter-method
**estimates** from review counts (±40%); everything disclosed is marked
as such. **This category is genuinely under-documented — the honest
gaps are listed at the end.***

## 1. Does one-time purchase work on the web?

| Game | Web | Paid | Outcome |
|---|---|---|---|
| **A Dark Room** | free browser (2013) | $0.99 iOS | **976,373 paid downloads over 2 years, $697,270 gross**; dev's personal net after Apple, tax and team split **$191,810**. Hit #1 premium US iOS app for 18 days with no Apple featuring. *(disclosed by dev)* |
| **Melvor Idle** | free browser demo | **$9.99 one-time**, buyable on Steam/Epic/mobile; unlocks browser + mobile too | **~$2.3M estimated lifetime Steam revenue**, 12,208 reviews, plus two paid expansions |
| **Cookie Clicker** | free since 2013, still free | $4.99 Steam (2021) | ~$6.4M estimated. Eight years of free play before monetizing |
| **Townscaper** | predecessor was a free browser toy that went viral | paid Steam | **380,000 copies** by May 2021; dev expected ~4,000 |
| **Universal Paperclips** | free browser | paid mobile port | 450,000 players in 11 days; revenue never disclosed |
| **Kingdom of Loathing** | free browser, 2003– | voluntary donations via "Mr. Accessory" | sustained a small studio 20+ years; 118,286 monthly players (2007) |
| **Wordle** | free, no monetization | — | sold to NYT for "low seven figures." The exit *was* the model |

[A Dark Room sales](https://www.gamedeveloper.com/business/a-two-year-look-at-the-sales-of-chart-topping-ios-title-i-a-dark-room-i-) ·
[Melvor full version](https://wiki.melvoridle.com/w/Full_Version) ·
[Townscaper](https://mcvuk.com/business-news/when-we-made-townscaper/) ·
[Wordle](https://www.forbes.com/sites/masonbissada/2022/01/31/new-york-times-buys-puzzle-game-wordle-for-low-seven-figures/)

**The pattern that separates winners from losers:**

1. **Free web = distribution, not revenue.** In every case the browser
   version was top-of-funnel and the paid SKU lived on a store with a
   billing relationship already attached. Nobody here built a business
   on web-checkout-first.
2. **The free version was complete enough to go viral.** Gating it would
   have killed the spread.
3. **Content cadence, not the initial sale.** A Dark Room's dev's own #1
   lesson: update at least every six weeks to stay eligible for store
   featuring. Melvor's durable revenue is base + two expansions.
4. **Timing and novelty were load-bearing** for the viral ones — which
   means they aren't reproducible on demand.

**Melvor Idle is the single closest analogue to Star Shard** (free
browser demo → one-time unlock → cross-platform entitlement → paid
expansions) and it is **one data point**. No published cohort study of
browser games selling one-time unlocks via direct web checkout exists.

## 2. The web-payment problem

| Provider | Fee | Merchant of Record? | Payout |
|---|---|---|---|
| Stripe | 2.9% + $0.30 (+1.5% intl, +1% FX) | ❌ you are VAT-liable | 2-day rolling |
| Paddle | 5% + $0.50 | ✅ | monthly, $100 min |
| Lemon Squeezy | 5% + $0.50 (+1.5% intl) | ✅ | 2×/month, $50 min |
| Gumroad | ~13% effective | ✅ | weekly, $100 min |

At a ~$20 price selling worldwide, **an MoR is worth the extra ~2
points** — you'd otherwise be registering and filing VAT in 40+
jurisdictions. The **$0.50 fixed fee is 15% of a $5 sale and 2.5% of a
$20 one**, which is the argument against pricing low.

**Conversion:** web paywalls convert around **6%** vs ~2% for native
in-app paywalls — but that figure comes from *paid-ad-acquired,
high-intent* web2app funnels, not organic game traffic. **Plan on
2–4%.** RevenueCat's gaming D35 download-to-paid median is **1.0%, the
lowest of any category**.
[Business of Apps](https://www.businessofapps.com/data/web-to-app-benchmarks/) ·
[RevenueCat gaming](https://www.revenuecat.com/state-of-subscription-apps-2026-gaming)

**Entitlements:** a one-time unlock with no account lives in
localStorage — forgeable, and evicted by Safari under storage pressure.
Server-side entitlement is mandatory. Client-side gating in JS is
bypassable by anyone who opens devtools; the realistic defenses are
server-authoritative delivery of paid content and accepting casual
sharing as a marketing cost. *(No published piracy-rate data exists for
paid browser games — a real gap.)*

**Refunds:** Steam's median refund rate is **9.5% of units**; games with
under two hours' average playtime hit 12.6%. Web direct sales have no
mandatory window but EU/UK consumer law and chargeback rules impose one
in practice. **Budget 5–10% leakage.**

**PWAs and iOS — the threat to our core loop.** You cannot list a PWA on
Apple's App Store (guideline 4.2.2). iOS PWAs *can* do push since 16.4,
but **only for home-screen installs, after a manual Share → Add to Home
Screen** (there's no `beforeinstallprompt`), and the reachable PWA push
audience is estimated **10–15× smaller than native**. A nightly-return
game depends on a reminder; **plan email/SMS as the primary channel, or
budget a native wrapper.**
[MobiLoud](https://www.mobiloud.com/blog/progressive-web-apps-ios)

**Store commissions are in flux (Aug 2026):** Apple currently **cannot
charge commission on US external-link purchases** — the Ninth Circuit
reversed its stay in April 2026 and remanded to set a "reasonable" rate,
so today's rate is zero and won't stay there. Google's Oct 2024
injunction permits link-outs and alternative billing in the US, with the
fee structure unresolved pending a summer 2026 hearing. **Model 10–20%
appearing within 12–18 months if you ship a native wrapper.**

## 3. Web vs Steam vs app store

| | Web direct | Steam | iOS / Play |
|---|---|---|---|
| Take rate | ~5.5–8% (MoR) | 30% | 30%, or 15% under $1M/yr |
| Upfront | $0 | $100/app, recouped at $1,000 revenue | $99/yr Apple, $25 Google |
| Discovery | **zero — you bring 100% of traffic** | real: wishlists, sales events | real but winner-take-all |
| Friction | highest (card entry on mobile web) | one click | one tap, biometric |

**What small teams actually earn:** Steam wishlist→sale conversion in
week one is 15% median under 5,000 wishlists; ~30 sales per review is
the current back-out ratio; **median first-year revenue is 2.64× first
week** — i.e. ~28% of year-one revenue lands in launch week.
[GameDiscoverCo](https://gamedevreports.substack.com/p/gamediscoverco-games-long-tail-revenue) ·
[howtomarketagame](https://howtomarketagame.com/benchmarks/)

**Implication:** Steam's 30% buys discovery you cannot buy for 30%
anywhere else; web's 6% buys margin and nothing else. The Melvor answer
is **both** — free web game as funnel and community, purchase available
on web (cheap) and Steam (discovery), one account granting
cross-platform entitlement.

## 4. itch.io economics

Default 10% to itch, creator-adjustable. The only reliable data is
individual creators publishing their books:

- **Nathalie Lawhead, 2015–2019, all pay-what-you-want:** $7,276.70
  gross across 1,072 payments; **average payment $4.98**; 55,802
  downloads → **~1.9% payment rate, ~$0.13 revenue per download.** Best
  single game: $5,441 on 27,800 downloads. Zero refunds ever.
  [disclosed](https://www.nathalielawhead.com/candybox/my-gross-revenue-on-itch-io-transparently-sharing-all-my-stats-earnings-and-speaking-on-how-supportive-of-a-base-itch-io-has)
- **A second creator, 2023:** $641 for the year; **~120 payments on
  4,434 downloads = 2.7% conversion**; mean payment $5.59. Their
  free/donation assets outperformed their paid games, which earned $0.

⚠️ Widely-circulated itch distribution stats ("80% of paid games earn
$0–50/month") appear only on SEO/AI-generated sites with no primary
source. itch.io does not publish per-game earnings distributions.

**Verdict: itch is a distribution and credibility channel, not a revenue
channel at a $5k/month target.**

## 5. The treadmill — the arithmetic

**Monthly revenue = new customers × price × (1 − fees) × (1 − refunds).
There is no carryover.**

| Price | Net/unit | New payers needed/mo | Players/mo @2% | @4% |
|---|---|---|---|---|
| $5 | $4.19 | 1,194 | 59,700 | 29,900 |
| $10 | $8.37 | 598 | 29,900 | 14,950 |
| $20 | $17.20 | 291 | 14,550 | 7,280 |

On Steam instead (30% cut, 9.5% refunds), $10 nets ~$6.33 → **790 units
a month, ~26 a day, indefinitely.**

**The hard part is the denominator, not the conversion rate.** Sustaining
10,000–30,000 new players a month organically is a marketing engine, not
a monetization model.

**How one-time products actually sustained revenue** (there is no good
published literature on this; these are the documented cases):

- **Paid expansions.** Melvor: base $9.99 + *Throne of the Herald*
  (~$171k estimated) + *Atlas of Discovery*.
- **New SKUs — with a warning.** A Dark Room's dev shipped a prequel
  that netted $29,765 and a third game that netted $3,064. **Sequels
  captured ~4% of the original's revenue.**
- **Cadence for algorithmic favour** — updates every ≤6 weeks.
- **Cosmetics** (§6). **The exit** (Wordle) — not a plan.

## 6. Cosmetics as the recurring layer

- **43% of active US gamers use skins**; **5–20% of a community makes
  any microtransaction**; typical transaction "$10 or $20."
- **Fortnite item-shop composition: 58.9% skins**, 18% gliders, 13.5%
  tools, 9.5% emotes → **identity items dominate; utility cosmetics are
  a minority.**
- Fortnite's own conversion fell from 30%→16% (PC) between 2018 and 2019
  as novelty faded — **cosmetic conversion is not stable over time.**
- **Path of Exile** is the canonical cosmetic-only business, and its
  **Supporter Packs** — fixed-price, time-limited bundles tied to each
  league launch — are the model for *recurring one-time purchases* with
  no randomness. **Deep Rock Galactic** does the same on a paid base
  game.

**What makes a cosmetic sell:** it expresses identity and is constantly
visible; it's scarce in *time*, not in randomness; and it has an author —
named artist sets outsell generic recolors.

**For Star Shard specifically:** the 28 stations, the ring, sky skins,
sigil sets and chart-render styles are unusually strong cosmetic hooks,
and **a shareable chart image is simultaneously a cosmetic and an
acquisition channel** — the highest-leverage category available.

## 7. Idle / incremental / collection

Nobody publishes an "idle/incremental" retention cut; the closest
proxies are simulation and puzzle:

| Genre | D1 | D7 | D30 |
|---|---|---|---|
| Puzzle | 31.9% | 12.2% | 5.4% |
| Simulation | 30.1% | 8.7% | 3.0% |
| Casual | 29.3% | 5.9% | 1.4% |

GameAnalytics 2025 across all mobile: **D7 median 3.4–3.9%**, and **75%
of projects have D28 below 3%.** Best long-term genres are board, card,
puzzle and casino — short-session, habitual, low content-burn.
**Realistic planning for a nightly-loop web game: D1 ~25–30%, D7
~8–12%, D30 ~3–5%**, with web running below native on D7+ because the
reminder is weaker.

**Streaks work, and the psychology flips.** Duolingo learners who reach
a **7-day streak are 3.6× more likely to complete their course**; streak
animations lifted 7-day usage +1.7%. Early on the mechanic is
*achievement* (2→3 days is a 50% gain); later it's *loss aversion*
(200→201 is 0.5%). Design for both phases.
[Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)

**Our loop is structurally strong:** 28 stations = a 28-night collection
cycle with natural completionist pressure, a monthly reset for
seasonality, and a scarcity axis (a station is collectable only on its
night) **without any paid randomness.**

**The monetization fit:** the genre's dominant model is ads + IAP
time-skips, which conflicts with one-time purchase. The premium
exception is Melvor: **the unlock gates breadth of content, never
speed.** Gate *how much sky there is*, never *how fast you get it*.

## 8. Compliance

Regulators are aiming at paid randomness and dark patterns, **not at
premium pricing**:

- **FTC v. Epic (2023): $520M** — $275M COPPA + **$245M for dark
  patterns** that tricked users into unwanted charges.
- **FTC v. Cognosphere / Genshin Impact (Jan 2025): $20M**, plus a ban
  on selling loot boxes to under-16s without verifiable parental
  consent.
- **PEGI overhaul (announced Mar 2026, effective June 2026):** any game
  selling **paid random items** gets a **minimum PEGI 16** regardless of
  content. **Daily login rewards alone cap at PEGI 7.** Direct-purchase
  non-random cosmetics don't trigger the threshold.
- **NY AG (Feb 2026)** sued over paid loot boxes on an illegal-gambling
  theory; **WA AG (2026)** sued casual casino games citing cartoonish
  aesthetics appealing to children.
[Fenwick](https://www.fenwick.com/insights/publications/mechanics-under-attack-traditional-video-game-mechanics-face-renewed-scrutiny)

**A single fixed-price unlock plus directly-purchasable, non-random
cosmetics is the safest monetization posture currently available.** It
sits outside every active enforcement theory: no randomness, no virtual
currency obscuring real prices, no time-pressure prompts, no recurring
per-item charges.

## 9. Where this research is thin — honestly

1. **No published cohort dataset exists on browser games sold via direct
   web checkout.** Every §1 figure for a web-charging game is a single
   self-disclosure or an aggregator estimate.
2. **"Idle/incremental" is not a tracked genre** in any retention
   benchmark found; simulation/puzzle were substituted.
3. **itch.io earnings distributions circulating online are unsourced.**
   Only two creators' self-published books were usable.
4. **Steam revenue estimates are ±40%.**
5. **The 6% web-paywall conversion figure comes from paid-ad web2app
   funnels**, not organic game traffic. Don't plan on it.
6. **No data found on:** piracy/entitlement-sharing rates for paid
   browser games; gifting's contribution to one-time revenue; cosmetic
   attach rates for premium (non-F2P) games.
