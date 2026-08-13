# PLATFORM.md — app vs web, after the audience pivot

**August 13, 2026.** `MARKET.md` was written assuming Suyin's ~13M
monthly views were the acquisition engine. **They aren't available.**
That voids its central argument, and the answer to "app or web" changes
with it. This supersedes `MARKET.md` §1–2 and §6.

---

## The short answer

**Yes — ship it as an app, and make the App Store the storefront. Keep
the web build free and public as the share-and-search surface.** Not
either/or: two roles for one codebase.

And your instinct about positioning is right and worth acting on:
**this is an astrology app first, with game mechanics as the retention
layer.** The astrology app market is real and documented — Nebula does
$50M ARR, CHANI ~$14M bootstrapped, the US category grossed ~$40M in
app revenue in a comparable year. The browser-game one-time-purchase
market is thin, undocumented, and the researcher could find exactly one
close analogue. Position where the money demonstrably is.

---

## What actually changed

With an audience, the constraint was conversion. **Without one, the
constraint is discovery**, and that flips the platform math entirely:

> **The web gives you a 7% fee and zero discovery. The App Store gives
> you a 15% fee and the only free acquisition channel this category
> has.**

That 15% matters — the **Apple Small Business Program is 15%, not 30%,
for anyone under $1M/year**, which is where we'll live for a long time.
So the real fee gap between web and app is about **eight points**, not
twenty-three. Eight points is a rounding error against the difference
between having a discovery channel and not having one.

---

## Five reasons app wins for *this* product

1. **Search is the acquisition channel.** People type "astrology app"
   into the App Store. Nobody types a URL. With no audience, organic
   store search plus the free tier is the only acquisition that doesn't
   cost money per user.
2. **The nightly loop needs push, and iOS web push is crippled.** A web
   app can only notify users who manually did Share → Add to Home
   Screen and then granted permission — a two-step opt-in with heavy
   drop-off, reaching an audience estimated **10–15× smaller than
   native**. Our entire retention model is a nightly reminder. This
   alone is close to disqualifying for web-only.
3. **Payment friction at $20.** One tap with Face ID versus typing a
   card number on a phone. At this price on this device mix, that gap is
   worth far more than eight points of fees.
4. **The under-18 problem solves itself.** Apple's Ask to Buy already
   routes minors' purchases to a parent. Building that flow ourselves
   for a web checkout would be a project, and getting it wrong is the
   kind of mistake regulators are actively fining.
5. **The category lives there.** Co–Star, CHANI, The Pattern,
   TimePassages, AstroMatrix — every incumbent is an app. Being the one
   web link in a category people browse in a store is a handicap, not a
   differentiator.

## What the web build is still for

Don't kill it — it just stops being the storefront:

- **The free chart, shareable by link.** No install required to see your
  shard. That's the top of funnel and the thing that spreads.
- **SEO, and we've already built the asset.** The 28 station permalink
  pages exist, with real content, OG images and a sitemap. *"What is my
  lunar mansion"* is a long-tail query nobody owns. That's a compounding
  acquisition channel that costs nothing to keep.
- **The demo that survives a Reddit link.** Communities share URLs, not
  App Store listings.

**Melvor Idle's shape, adapted:** free web version that's genuinely good
→ purchase lives where billing already exists → one account, entitlement
everywhere.

---

## Wrapper, not rewrite

The whole build is already a web app. **Wrap it with Capacitor** and
ship that. What the wrapper adds — and what Apple requires, since
guideline 4.2.2 rejects pure "web clippings":

- native push notifications *(the reason we're doing this)*
- native in-app purchase for the unlock
- offline caching of the chart
- home-screen presence

**That's weeks, not months**, and it doesn't fork the codebase — the
same corpus, engine and markup serve both. Android via the same wrapper
when it's worth the $25.

---

## The cold-start plan, honestly

$5k/month is now a genuinely harder target, and I'd rather say so than
model it optimistically. The research is blunt: **only 17.3% of new
subscription apps reach $1,000/month within two years, and 4.6% reach
$10,000/month.** With no audience we're in that distribution, not above
it. At $20 with a 15% cut we need **~294 sales a month** — call it ten a
day, forever.

The four channels that can plausibly get there, in order of cost:

1. **ASO + the free tier.** The category has real organic search volume
   and the incumbents are widely disliked in reviews. A well-titled,
   well-screenshotted listing with a free chart is the cheapest thing on
   this list.
2. **The share artifact.** Receiptify hit 1M+ uses on a $2,000 grant.
   The mechanism is a text-first image that's recognizable at thumbnail
   size and **impossible to fully understand without generating your
   own.** We should build that deliberately rather than hope for it.
3. **The explainability story.** *"The astrology app that shows its
   work"* is a real press and Reddit angle, because it answers the
   loudest complaint about the market leader. r/astrology has a large,
   skeptical, technically-literate audience that would actually care
   that we cite orbs and name the disagreements between traditions.
4. **Founder-led content.** Someone has to make the videos. This is the
   line item that replaces Suyin, and it's the one I can't build for
   you — but the corpus is full of material that is genuinely
   interesting on its own (the starless station that points at the
   galactic centre; the star two cultures independently named "heart";
   Aldebaran chasing the Pleiades forever and outshining them).

**Realistic shape:** months 1–3 to launch and instrument, months 4–12 to
find which of those four channels actually works, and $5k/month as a
year-one-to-two target rather than a launch target. If a channel hits,
it moves fast; if none does, no amount of product work fixes it.

---

## What this changes in the build

- **Positioning:** astrology app first. The 28-station collection is
  retention and differentiation, not the pitch. Store listing, title and
  keywords lead with chart and horoscope language.
- **Push is now core, not optional.** Design the notification copy with
  the same care as the readings — Co–Star's notifications *were* its
  marketing.
- **The free/paid line stays as specced:** free arrival and Deep Chart,
  one purchase for the ongoing game. That's still right, and it's still
  the honest answer to the category's retroactive-paywall problem.
- **Nothing in the corpus, engine or design changes.** This is a
  distribution decision, not a product one.
