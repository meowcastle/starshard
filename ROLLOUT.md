# ROLLOUT.md — the sequence, and why it is this one

**22 August 2026.** Supersedes `MARKET.md` §1, §2 and §6 (void: they assumed an audience
that is not available) and replaces `PLATFORM.md`'s cold-start plan. `PLATFORM.md`'s platform
decision still stands and is folded in below. Evidence: `research/steam-economics.md`,
`research/kickstarter-plan.md`, `research/market-astrology.md`, `research/market-webgames.md`.

Market data and arithmetic, not financial advice. Every assumption is stated so it can be
argued with.

---

## The one constraint everything else hangs off

**No audience.** Not a small one — zero. That single fact decides the order of every move
below, because three of the four things you want to do all require an audience as an *input*:

| the move | what it needs first |
|---|---|
| Kickstarter | ~800-1,500 warmed emails, ~40 named day-one backers |
| Steam launch | >5,000 wishlists, or it earns beer money |
| App Store revenue | ~294 sales a month, and ASO alone will not deliver that |
| **A free game that spreads** | **nothing** |

Only one item on that list is an audience *generator* rather than an audience *consumer*.
So it goes first, and everything else queues behind it.

**The strategy in one line: the game builds the list, the list funds the art, the art makes
both products sellable, and the app is what actually takes the money.**

---

## The flow, and which way it points

Three surfaces, one direction:

**free game (web + itch) → astrology app (App Store) → Steam and the deck**

The game is the funnel. It is free everywhere, forever, and its job is acquisition, not
revenue. The app is the business, because that is where the money demonstrably is in this
category (Nebula $50M ARR, CHANI ~$14M bootstrapped, zero VC) and where a one-time purchase
for depth has a proven anchor ($29 at 16Personalities, $23.69 for the top Etsy natal
listing). Steam and the deck are SKUs two and three and neither is load-bearing.

**Why the funnel points at the app and not the other way round.** The daily-return hook is a
mobile behaviour. Steam's Discovery Queue gives a small game roughly 22,000 impressions over
ten days and then forgets it; an app with a nightly reading gives you an owned channel that
can push at your Steam page every day for a year. Steam does not build audiences for
10-minute card games. The app can.

**And they are each other's moat.** "The opponent plays tonight's real sky" is the only thing
about Manzil no other card game has. "You play for your reading" is the only thing about the
astrology app no incumbent has. Forking them throws away both.

---

## Phase 0 — make the free thing worth sharing (now, ~4 weeks, £0)

Nothing below Phase 0 works if the free game is not good. Three blockers, all measured:

1. **The opening is solved at a five-card pack.** Six openings win every board on every night
   at her table, seven against the road boss (`manzil-district-check.md`). A free game whose
   job is to circulate cannot have a six-line opening book. **Fix: grant a starting pack
   above five so the deal fires.** Nothing else removes it — with exactly five cards you hold
   all five every board.
2. **Add the run structure.** Both researchers reached this independently and it is the
   highest-leverage item in either report. Manzil is a 2-minute board and a 10-minute match;
   Steam pays for long games, and Roguelike Deckbuilder hit 4.87% success in 2025 against a
   2.99% platform average while "abstract board tactics" has no such tailwind. **Twenty-eight
   mansions is already a run length.** A gauntlet with cards drafted and kept between boards
   is the difference between the Card Crawl outcome (~$10K) and something an order of
   magnitude larger. This is a design change and it is worth more than any marketing spend.
3. **Fix the `-2` filename bug.** `index.html` still loads `ephemeris2.js` and
   `manzil-art2.js`. In a browser that is a console error; in a packaged desktop build it is
   a white window. Fix it before anything ships wrapped.

Also in Phase 0, because it costs an hour and everything later depends on it: **email capture
in the free flow.** It is the iOS reminder channel, the Kickstarter list, and the launch list
for the deck. Without it Phase 3 has no input.

**Gate to Phase 1:** the game is unsolved, has a run, and collects emails.

## Phase 1 — put the free game where it costs nothing (weeks 2-8, $100)

- **itch.io browser build.** An afternoon, free, and it is the honest go/no-go. Browser games
  get ~3× the engagement of download-only. *Die in the Dungeon* went from 919K itch plays to
  ~$876K on Steam. You will not make money here — nobody does — but you get the one piece of
  information nobody can sell you.
- **Steam Coming Soon page, $100, no date.** A wishlist bucket that compounds for a year and a
  legitimacy artifact for the Kickstarter. The 30-day fee-to-release wait and 2-week Coming
  Soon minimum mean the page must exist long before you want it.
- **The 28 station permalink pages already exist** with content, OG images and a sitemap.
  *"What is my lunar mansion"* is a long-tail query nobody owns. Free, compounding, already
  built.

**The kill criterion, written now while you are not invested:** if the itch build cannot beat
the itch median (1,582 lifetime views, 113 downloads) with the astrology hook doing the
talking, **Steam will not rescue it.** Zukowski: *"I didn't see any games that did poorly on
itch, but did well on Steam."* If that happens, keep the game free forever as a funnel, put
all weight on the app, and skip Phases 3 and 4.

**Gate to Phase 2:** itch build beats the median, or you have decided to proceed anyway with
your eyes open.

## Phase 2 — ship the app, because it is the only recurring channel (months 2-4)

`PLATFORM.md`'s decision, unchanged and now better supported. Capacitor wrapper, App Store as
the storefront, web build stays free and public as the share-and-SEO surface. The fee gap is
about eight points once you are in Apple's Small Business Program at 15%, which is nothing
against having a discovery channel at all.

- **Free:** arrival, Deep Chart, the nightly crossing, and the game.
- **Paid, one-time $19-24:** the depth of the reading. Hard paywall, **no free trial** —
  10.7% D35 versus 2.1% freemium, and trials *reduce* LTV 21.2% in Lifestyle apps.
- **Two claims lead the listing:** *it explains itself* and *you buy it once*. The first
  answers the loudest unmet need in the category; the second is a promise no incumbent can
  make, because all of them have already burned users on retroactive paywalls.
- **Push is core, not optional.** Design the notification copy with the same care as the
  readings.

The maths to keep honest: ~294 sales a month at $20 after Apple's cut. Ten a day, forever.
**$5k/month is a year-one-to-two target, not a launch target** — only 17.3% of new apps reach
$1,000/month within two years.

**Gate to Phase 3:** the app is live and the email list is growing at a rate that projects to
800+ within two months.

## Phase 3 — sample art, then the Kickstarter, as a deck (months 4-6, ~$1,000 out of pocket)

Two decisions carry this phase.

**Pitch a deck, not a video game.** Tabletop funds at ~80% on Kickstarter; video games at
~33%, and tabletop had 5,314 funded projects in 2024 against video games' 441. Tarot and
oracle adds more lift: 52% against a 38-43% platform average. **Same 28 illustrations,
roughly 2.4× the odds.** Do not pitch both in one campaign — it confuses divination buyers
and game backers simultaneously.

**Commission 4-6 finished cards out of pocket first.** $600-1,500 at budget tier. This is the
single highest-leverage action in the phase, because "fund my art" inverts the exact
mechanism that makes the category work: backers scroll a gallery of finished art and buy the
object. Those sample cards are also the social content that builds the list. **Do not launch
a card-art campaign with placeholder art.**

- **Ask $6,500** (defensible $6,000-8,000). Inside the under-$10k bucket that holds 66% of all
  successful projects; ~130 backers at $50; covers a budget-tier 28-card commission, so the
  pitch is literally true. Run 28 days or fewer — sub-30-day campaigns succeed 26% more often.
- **Plan for the median (~$2,600), not the $40k average.** The decks raising $277k belong to
  illustrators who already had followings.
- **Precondition, and it is the real gate:** ~40 named day-one backers, enough to clear 30%
  in the first 48 hours. Campaigns that miss that almost never recover; those hitting 20%
  have a 78% chance of funding. Know their names before you press launch.
- **Optimise for certainty of delivery, not size of raise.** Repeat creators have a 70% higher
  success rate, and a solo creator's name is the brand — a public failure poisons exactly the
  second campaign where that status would have paid.

## Phase 4 — Steam, last, and only if the numbers are there (months 7-12)

- **Delete "7,000 wishlists."** Popular Upcoming's floor moved to ~80k in the June 2026
  redesign. The Personal Calendar wants ~8,000 at the 30th percentile. **5,000 launch
  wishlists is Bronze, and Bronze is $0-10k lifetime.**
- **Steam Next Fest goes here and nowhere earlier.** One per title, ever. October 2026
  registration closes **31 August** — do not spend it on placeholder art with under 1,000
  wishlists; June 2026 data shows those entrants got buried. Spend it 2-4 months after the
  art lands.
- **The Electron wrapper is about a week** and should be built the month before the demo, not
  now. `steamworks.js` + `electron-builder` is the documented path. Bundle the fonts locally,
  fix the `../support.js` path escape, move saves off `localStorage`, and make the
  place-search call degrade offline.
- **Mac** needs signing and notarization — $99/yr Apple Developer, the same account as the
  iOS app, so no marginal cost.
- **Your comparable is Card Crawl, not Balatro.** Excellent game, exactly this shape, 167
  Steam reviews and ~$10K gross. That is the modal outcome without the run structure from
  Phase 0.

---

## The money, end to end

| out | when | amount |
|---|---|---|
| Steam page | Phase 1 | $100 |
| Sample cards | Phase 3 | $600-1,500 |
| Apple Developer | Phase 2 | $99/yr |
| **Total before any revenue** | | **~$800-1,700** |

| in | when | model |
|---|---|---|
| App unlock | Phase 2 | $19-24 one-time, target ~294/mo |
| The deck | Phase 3 | Kickstarter $6,500, then evergreen |
| Steam | Phase 4 | optional, not load-bearing |

The full 28-card commission at a tier that would make a deck sell on visual merit is
$28,400-54,000. **That is not a Phase 3 number.** Budget tier ($5,200-10,000) is what $6,500
buys, and it is enough to ship. Specify commercial licensing in the first email — editorial
rates carry a 3-15× multiplier to convert later — and structure it as one cohesive set with a
style guide, not 28 separate jobs, for a 20-35% volume discount.

---

## The hole, now filled — see `CONTENT.md`

`PLATFORM.md` listed four cold-start channels and the fourth was "someone has to make the
videos." This was the biggest single risk in the plan. **You've taken it**, which changes the
plan more than anything else in this document, because it is the only channel that generates
an audience rather than consuming one.

The content bank already exists: 28 mansions × 4 traditions in
`research/mansions-table.json`, pre-sorted by whether the four skies agreed (14 STRONG, 10
PARTIAL, 4 DIVERGENT). The daily hook is real rather than manufactured — the moon *is* in a
mansion tonight, which is the same hook the product runs on. `CONTENT.md` has the thesis, ten
cold opens taken from the table, and the cadence.

**Three consequences for the sequence above:**

1. **Vein 1 starts now, in parallel with Phase 0.** It needs no engineering, no money and no
   finished art. It is the only item on the whole plan with that property.
2. **Email capture moves from "nice" to blocking.** It is the collection point for everything
   the videos generate, and every later phase consumes that list.
3. **The Kickstarter's audience precondition now has a mechanism behind it** rather than a
   hope. Timeline stays 4-6 months.

**The commitment, set as a number rather than an intention:** five short videos a week for
twelve weeks — sixty — before judging whether the hook works. Measure **email signups per
thousand views**, not views. If sixty videos cannot put the list on a path to 800-1,500, the
Kickstarter stays parked and the app carries the business alone. Write that down now, while
it costs nothing to be honest about.

The remaining risk is smaller and different: not "will there be a channel" but "will the
cadence hold." That one is visible by week four rather than after a failed campaign.

## What to do this week

1. Decide the starter pack size so the deal fires. One line, unblocks everything.
2. Fix the `-2` script references.
3. Scope the run structure — this is the real work of Phase 0.
4. Put email capture in the free flow.
5. Note that Next Fest registration closes 31 August and deliberately let it pass.
