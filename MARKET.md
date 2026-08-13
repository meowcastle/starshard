# MARKET.md — comparables, the $5k math, and what sharpens the product

> **⚠ SUPERSEDED IN PART — read `PLATFORM.md` first.** This document's
> central argument was that Suyin's ~13M monthly views solved the
> acquisition problem. **That audience is not available.** §1, §2 and §6
> are void; the platform decision and the cold-start plan are in
> `PLATFORM.md`. §3 (what sharpens the product), §4 (comparables) and §5
> (risks) all still stand — they were never audience-dependent.

**August 13, 2026.** Two research runs: the astrology app market, and
browser-game monetization. Sources in `research/market-astrology.md` and
`research/market-webgames.md`. This is the synthesis and the
recommendation. Nothing here is financial advice — it's market data plus
arithmetic, and the assumptions are all stated so you can argue with
them.

---

## 1. The headline

**One-time purchase is rare as a whole business model, and the reason is
arithmetic: monthly revenue = new customers × price. There is no
carryover. Every month starts at zero.**

The web-games researcher put the hard number on it: at $10, $5k/month
net means **~600 new paying customers every month, forever** — which
at a 2–4% conversion rate means **15,000–30,000 new players a month,
sustained.** Their verdict: *"the hard part is not the conversion rate;
it's the denominator. That is a marketing engine, not a monetization
model."*

**And that is exactly the thing you already have and nobody else in this
category does.** Suyin's channel does ~13M views a month. The entire
structural weakness of one-time purchase is acquisition, and acquisition
is the one input you're not short of. Co–Star raised $21M to buy an
audience; you have one.

That reframes the whole question. It's not "is one-time viable" — it's
"what fraction of 13M monthly views can we convert, and at what price."

---

## 2. The math, honestly

Net per unit assumes a merchant-of-record processor (5% + $0.50, which
handles VAT across 40+ jurisdictions) and 7% refund leakage.

| Price | Net/unit | Sales needed for $5k | Site visits needed @ 2% | @ 4% |
|---|---|---|---|---|
| $10 | $8.37 | 598 | 29,900 | 14,950 |
| **$20** | **$17.20** | **291** | **14,550** | **7,280** |
| $29 | $25.16 | 199 | 9,950 | 4,980 |

Now the funnel from the channel. These CTRs are the honest unknown —
I've bracketed rather than picked:

| Shorts→site CTR | Visits/mo | @2% conv, $20 | @4% conv, $20 |
|---|---|---|---|
| 0.05% | 6,500 | $2,240 | $4,470 |
| 0.1% | 13,000 | $4,470 | $8,950 |
| 0.2% | 26,000 | $8,950 | $17,890 |
| 0.5% | 65,000 | $22,370 | $44,730 |

**Read:** $5k/month needs roughly **0.1% of monthly views to click
through and 2–4% of those to buy, at $20.** That is a real target, not a
fantasy — and it's reachable from one good video, not a marketing
department. It also means the launch spike will wildly overshoot and
then decay; plan for the floor, not the spike.

**The fee math has a floor:** the $0.50 fixed processor fee is 15% of a
$5 sale and 2.5% of a $20 one. Don't price below ~$12.

**Price recommendation: $19–$24, one-time.** The evidence: consumer
one-time astrology transacts at $7–$25 on Etsy (the top natal-reading
listing is $23.69 with 20,100 reviews); AstroMatrix sells a lifetime
unlock at $24.99–$49.99; 16Personalities — the closest structural twin —
charges **$29 one-time** for depth after a free identity result. Below
$15 you're under the anchor that already converts; above $35 you leave
the consumer band.

---

## 3. What sharpens the product — ranked by leverage

These come straight out of the complaint data, and the first two are
free wins we've already half-built.

**1. Explainability is the category's biggest open wound, and we already
do it.** The single most specific repeated request in the review corpus,
across both Co–Star and The Pattern: *tell me which placement or transit
produced this line.* Nobody serves it. Astro-Seek does the math with no
interpretation; the pro software does both but costs $360 and runs on a
desktop. **Our compute readout, our stated orbs ("3° from exact, which
is close"), our `where this comes from ▾` toggle, and the honest
Porphyry note are the answer to the loudest unmet need in the market.**
This should be the headline of the marketing, not a detail.

**2. "Buy it once. It never changes."** The #1 complaint at *both*
Co–Star and The Pattern is **retroactive paywalling** — features that
were free getting locked. Reviews call it "cruel." Our model is
structurally immune to that, and no incumbent can make the claim,
because all of them have already burned users. Say it in the first
sentence of the sales page.

**3. Read the whole chart.** Co–Star is criticized by astrologers for
interpreting only Sun/Moon/Rising, ignoring seven planets, twelve houses
and all aspects — and users have caught it: *the same phrasing appears
in different people's readings*. We read stations, houses, aspects, and
the Becoming. When two friends compare screenshots we survive the
comparison. That's the moat.

**4. Make the shareable unit TEXT, not the chart.** Co–Star's
notifications became a Know Your Meme entry with 13,662 documented
instances. The share that travels is a short, sharp, first-person block
of text — legible at thumbnail size, no login needed to appreciate,
impossible to fully understand without generating your own. The ring is
beautiful and belongs in the product; **the thing that spreads is a
sentence.**

**5. Hard paywall, no free trial.** RevenueCat across 115K apps: hard
paywall converts at **10.7% D35 versus 2.1% freemium** — five times
better. Adapty on Lifestyle apps specifically: **trials *reduce* LTV by
21.2%**, the only category where direct buyers beat trial cohorts. Free
arrival + free Deep Chart + paid game is the right split, and no trial
on the paid part.

**6. Gate breadth, never speed.** Melvor Idle is the closest working
analogue to what we're building — free browser game, **$9.99 one-time
unlock**, cross-platform entitlement, ~$2.3M lifetime on Steam plus two
paid expansions. Its unlock buys *more content*, not faster progress.
For us: the free tier gets the chart and the nightly crossing; the
purchase opens the depth, the codex, the daily/weekly. Never sell time.

**7. A second one-time SKU beats a subscription.** Astro Gold ran
one-time for a decade, then moved to subscription, publicly stating they
needed it "to continue maintaining, improving and supporting the app."
That's the warning. The fix isn't recurrence — it's **new SKUs**:
seasonal chapters, expansions, and — the one I'd push hardest —
**a physical deck of the 28 stations with Suyin's art.** Tarot and
oracle decks ran **320+ Kickstarter campaigns in 2025 raising ~$12.8M**.
A creator with 104K followers and a finished 28-card system is the exact
profile that funds.

---

## 4. The comparables that actually matter

| Product | Why it's the model |
|---|---|
| **Melvor Idle** | free browser → $9.99 one-time → Steam for discovery → paid expansions. The only documented path from *this exact shape* to sustained revenue. |
| **16Personalities** | free identity artifact → adopted identity → **$29 one-time** for depth, sold as "save 70% vs. buying individually." Buy happens *after* identity adoption, never before. |
| **CHANI** | ~$14M/yr, **zero VC**, 35 people, 4.9 stars. Sells human-authored writing and says so. Proof the content itself isn't the problem in this category — the business model and tone are. |
| **Labyrinthos** | free tarot-learning app as funnel → sells physical decks. Content is the funnel; the object is the product. |
| **A Dark Room** | free browser → $0.99 iOS → **976K paid downloads, $697K gross.** Proof a text-first browser game can be a commercial product. |

And the cautionary one: **Co–Star** hit 20M+ downloads, raised $21M, was
earning an estimated $3–5M/yr, and exited to Midjourney in July 2026 on
undisclosed terms with its founder becoming their Chief Design Officer.
VC-scale consumer astrology didn't work. Bootstrapped did (CHANI).

---

## 5. Three risks worth naming

**The iOS reminder problem — this one threatens the core loop.** Our
nightly ritual depends on a nudge. On iOS, a web app can only send push
if the user manually adds it to their home screen *and* grants
permission — a two-step opt-in with heavy drop-off, and the reachable
PWA push audience is estimated 10–15× smaller than native. **Plan email
as the primary reminder channel from day one**, and treat a native
wrapper as a real future cost, not a nice-to-have.

**Regulators are aiming at the loop, not the price.** The UK Age
Appropriate Design Code reads "nudge techniques" broadly — streaks,
daily-login rewards, scarcity, FOMO — and our nightly collection is
squarely in scope; a DPIA is mandatory and its absence is what
regulators hit first (Reddit was fined £14.47M in 2026 partly for
missing one). The good news: **our ethics floor already does most of the
work** — count up not down, catch-up windows, a finite set, no paid
randomness. PEGI's March 2026 overhaul gives any game selling paid
random items a minimum 16 rating; **daily login rewards alone cap at
PEGI 7.** A fixed-price unlock plus non-random cosmetics is the safest
posture on the board right now.

**The treadmill is real even with a great funnel.** Median Steam game
earns 28% of year-one revenue in launch week. One-time purchase means
revenue tracks attention, and attention decays. The counter is cadence:
new chapters, seasonal stations, the deck, and — genuinely — Suyin
posting.

---

## 6. What I'd do in the first 90 days

1. **Ship free.** Arrival + Deep Chart, no paywall, no account required
   to see your shard. This is the marketing.
2. **Instrument the funnel** before spending on anything: views → visits
   → shard generated → shared → purchase. Without this the numbers above
   are theatre.
3. **Build the share artifact as text-first** and make it unmistakable
   at thumbnail size.
4. **Launch the paid unlock at $19–$24** with the two claims up front:
   *it explains itself*, and *you buy it once*.
5. **Put a wishlist-style email capture in the free flow** — it's the
   iOS reminder channel and the launch list for SKU two.
6. **Then, and only then, the deck.** Kickstarter, 28 cards, Suyin's
   art, funded by the audience that already bought the game.

**Honest expectation-setting:** the research is blunt that only 17.3% of
new subscription apps reach $1,000/month within two years and 4.6% reach
$10,000/month. Those odds are grim *for products without an audience*.
The whole argument for this one is that the acquisition problem — the
thing that kills the other 95% — is the problem you've already solved.
