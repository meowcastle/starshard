# Star Shard — brief for Claude Design

> **Read `DESIGN-SYSTEM.md` first.** It supersedes anything in this file about
> colour, type, spacing, shape or shadow. This brief still holds for the
> product context, the audience, the ownership boundary, the binding contract
> and the per-surface work queue.

Self-contained: everything you need is in this document. Paste it in whole.

---

## The product

**Star Shard** is a kawaii Windows-95 desktop simulation that computes a real
astrological birth chart and returns it as four collectible "shards."

The user enters their name, birth date, birth time and birth city, hits
**"✧ shatter the sky ✧,"** and gets four face-down gem cards to flip:

| | Shard | Tradition |
|---|---|---|
| 🏠 | **house** | Placidus houses — which of the 12 houses the Sun occupies, plus rising sign |
| 🪞 | **mirror** | A Jungian archetype, mapped from the Moon sign |
| 🌙 | **moon** | One of the 28 *manāzil al-qamar*, the classical Arabic lunar mansions |
| 🕯️ | **hearth** | The "Monday's Child" rhyme and the planetary ruler of the birth weekday |

Reveal all four and a **"weave my reading"** button appears, which blends them
into one paragraph and produces a shareable card.

Current desktop apps: `shard reader.exe`, `chart_wheel.exe`, `duet.exe`
(two-person compatibility), `today.exe` (today's lunar mansion), `guestbook.htm`,
`grimoire.hlp` (glossary crediting each tradition), `player.exe` (chiptune),
`luna.txt`, `reading.doc`, `account.exe`.

## Who it's for — this should drive every decision

It is a web property for **Suyin (@suyinsama)**: daily Hatsune Miku and Vocaloid
cosplay from Brooklyn, ~13M monthly views, 104K followers, 67.7% completion rate.

| | |
|---|---|
| Gender | 62% female |
| Age | 25.3% are **13–17** · 26.7% are 25–34 · 74.7% are 18+ |
| Geography | 34% US, then UK, Germany, Philippines, Indonesia |
| **Where they come from** | **87% of her YouTube views come from the Shorts feed** |

That last row is the whole brief. **Her audience is functionally phone-only**,
and the site is currently a draggable multi-window desktop. Mobile is 52–64% of
all web traffic; for this audience it is higher.

The voice is established and working — warm, lowercase, nostalgic-cute,
family-friendly, "tag your oshi," "no drama." Keep it.

---

## What you own

| Yours | |
|---|---|
| `Star Shard v2.dc.html` | the markup and the `<helmet>` — layout, styles, window chrome, copy in the markup, fonts, and the meta tags (see P3) |
| `.image-slots.state.json` | slot artwork |
| `CARD` block at the top of `card.js` | share-card sizes, colours, type |
| `LAYOUT` block at the top of `windows.js` | initial window positions and sizes |

## What you must not touch

`astro.js` · `sky.js` · `astronomy-engine.js` · `format.js` · `tz.js` · `api.js` · `wheel.js` · `reading.js` ·
`shards.js` · `duet.js` · `starshard-api/**` · `test/**` · `tools/**`

And two files that are machine-generated — edits are silently discarded:
`support.js`, `image-slot.js`.

The `<script type="text/x-dc">` block at the bottom of the `.dc.html` is shared.
It holds state, lifecycle, and `renderVals()`. Leave its logic alone.

**Do not include or reference `astro.js`, `shards.js` or `duet.js` in an
export — not even as a sibling `import()`.** They change most sessions, and an
export that references them has shipped a stale pre-refactor copy **four
times now**, most recently a crash on the core reading step (`STATUS.md`:
`copy.fallbackWeave is not a function` — a function `shards.js` stopped
exporting a while back). If a mock needs sample reading text, hardcode a
placeholder string in the export instead of importing the real module — the
engineering side will wire it to the real one on merge.

---

## The one rule

**The markup binds to names that JavaScript supplies. If you rename one, the page
renders the literal text `{{ thatName }}` to the user.**

There are 349 bindings, 140 top-level. They are all listed in `BINDINGS.md`.

```
{{ revealTitle }}          a value to print
{{ doCompute }}            a click handler
{{ wReader.show }}         a window's visibility
<sc-if value="{{ x }}">    conditional block
<sc-for list="{{ xs }}" as="x">   repeated block
```

You can move these anywhere, restyle them, wrap them, drop them, duplicate them.
**Do not rename them, and do not invent new ones** — a new binding needs a
matching change in the script block, so flag it in your handoff notes instead.

Everything else in the markup — every inline style, every element, every bit of
copy — is yours to change freely.

---

## The work, in priority order

### P1 — A phone-native path — done, and now live inside `v2.dc.html`

The single-column, one-screen-per-step phone flow shipped and is merged into
`Star Shard v2.dc.html` itself as a second markup tree, not a separate page.
The root markup is now two siblings:

```
<sc-if value="{{ isDesktop }}">  the windowed desktop, ≥1024px, unchanged
<sc-if value="{{ isPhone }}">    the phone flow, <1024px
```

`isPhone`/`isDesktop` come from a viewport listener in the script block; only
one tree mounts its event handlers at a time.

**New binding convention: everything inside the phone tree is `p`-prefixed**
(`{{ pStep }}`, `{{ pChart }}`, `{{ pAdvance }}`, `{{ pShards }}`, ...) to keep
it collision-free with the desktop tree's own bindings, which use the file's
existing `f`/`d`/`g`/`w` prefixes. If you're restyling something inside
`<sc-if value="{{ isPhone }}">`, its bindings will be `p`-prefixed — that's
expected, not a typo. The two exceptions are auth (`isLoggedIn`, `authEmail`,
`doLogin`, etc.) and `deck`, both shared unprefixed with desktop since they're
account data, not phone-UI state. Full rule: `OWNERSHIP.md`.

The standalone `Star Shard - Staging.dc.html` export this was built from is
retired — its content now lives inside `v2.dc.html`'s phone tree. Don't build
against the standalone file going forward; treat `v2.dc.html` as the only
live page, desktop and phone both.

### P2 — The share card, redesigned to 9:16

The card is the growth engine and it is the least-finished thing in the build.

- **Render 1080×1920 (9:16).** It currently renders 720×1000, which is the feed
  aspect, not the Stories aspect. Ship a 1:1 or 4:5 crop as a secondary.
- **The `card-art` image slot is empty.** Suyin's art in that circle is the
  entire reason this artifact travels rather than any other astrology card.
  Filling it is the single highest-value thing on this list.
- **Design it to look right as a full-bleed screenshot**, not just as a
  download — most people screenshot. No browser chrome in frame, no scrolling,
  nothing overlapping.
- **One element must be legible at ~100px thumbnail size.**
- The user's name is already on it. Keep it there — naming converts "a
  screenshot of a thing" into "my artifact."

Reference points that work: Receiptify's thermal receipt, Instafest's festival
poster. Both are dense — 10 to 30 items — and both stay readable because the
layout is a **real-world object the viewer already knows how to parse**. Pick an
object before you pick a data model.

### P3 — A real Open Graph image

The tags themselves have shipped — `<title>`, description, `og:*` and
`twitter:*` are all in the `<helmet>` now. **The image is the problem.**

`og-image.png` is **240×360**: a portrait cosplay crop with no
wordmark and nothing that says what the link is. The standard is 1200×630.
LinkedIn needs 1200×627 for a large card and downgrades anything smaller; X's
`summary_large_image` is built for 1200×628. It clears Facebook's 200×200 floor
so it is not rejected — just rendered as a small thumbnail everywhere, which is
roughly the outcome of having no image at all. And **Facebook caches scraped OG
data for weeks**, so a bad card outlives the fix.

Needs: 1200×630, card context, the wordmark, a mansion card, legible in a feed.

These tags are static HTML — scrapers don't run JavaScript, so they can't be
injected at runtime. That makes them yours, and it means **you have to carry
them through every regeneration.**

### P4 — Make the 28 mansions the front door

The lunar mansions are the most distinctive thing in the product and they are
buried three windows deep. No competitor has them — not Co–Star, not CHANI, not
Astro-Seek.

They are already a 28-type collectible set with beautiful names, real
scholarship behind them, and a built-in rarity mechanic (Saʿd al-Suʿūd is
literally "the luckiest of the lucky"). Finite typologies are what people post —
16Personalities built a business on four letters.

Worth designing: a landing treatment that leads with "what's your mansion?", and
a repeatable per-mansion page layout (28 of them, each its own permalink, its own
art, its own OG image).

### P5 — Accessibility

Retro chrome fights WCAG by construction, and the current build is `<div>` soup:
no landmarks, no heading order, no focus indicators, tap targets under 44px, and
gray-on-gray contrast. `98.css`'s approach — style semantic HTML, ship no JS — is
the escape hatch worth borrowing.

---

## What to preserve

- **The four-shard reveal.** Face-down → click → flip → all four → weave. That
  sequence is the product.
- **The voice.** Lowercase, warm, no drama, family-friendly.
- **The `grimoire.hlp` credits.** Each tradition is named and sourced, and the
  *manāzil al-qamar* are explicitly framed as cultural scholarship rather than
  religious guidance. That framing is deliberate and should survive.
- **The honesty.** The site computes real Placidus houses and says so. Don't add
  claims of precision the chart doesn't have — and note that above 66° latitude
  it falls back to Porphyry and needs to be able to say that in the UI.

## What's deliberately unfinished (not yours to fix)

- Every user currently gets the same "woven reading" paragraph — the LLM call
  doesn't exist in the deployed runtime. Being decided separately.
- The guestbook is local to each browser; everyone sees the same three seeded
  entries.
- The account system saves window positions and nothing else.

## Handing back

Please include in your handoff notes:

1. Any binding you had to add, rename or remove
2. Whether you changed the `CARD` or `LAYOUT` blocks
3. Whether the meta tags survived
4. Confirm the export does not import or reference `astro.js`, `shards.js` or
   `duet.js` (see "What you must not touch" above — this has broken a handoff
   four times)

The engineering side runs `npm run bindings` on receipt, which fails the build on
any binding mismatch, plus a browser smoke test that drives the full reading flow.
Both catch handoff breakage before it ships.
