# Star Shard — brief for Claude Design

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

`astro.js` · `format.js` · `tz.js` · `api.js` · `wheel.js` · `reading.js` ·
`shards.js` · `duet.js` · `starshard-api/**` · `test/**` · `tools/**`

And two files that are machine-generated — edits are silently discarded:
`support.js`, `image-slot.js`.

The `<script type="text/x-dc">` block at the bottom of the `.dc.html` is shared.
It holds state, lifecycle, and `renderVals()`. Leave its logic alone.

---

## The one rule

**The markup binds to names that JavaScript supplies. If you rename one, the page
renders the literal text `{{ thatName }}` to the user.**

There are 336 bindings, 127 top-level. They are all listed in `BINDINGS.md`.

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

### P1 — A phone-native path (the big one)

Not a responsive squeeze of the window manager. A genuinely separate
single-column flow at narrow viewports: one screen per step, full-bleed,
thumb-reachable, no window chrome.

Why the current build fails on a phone:

- `dragWin` and `resizeWin` are the primary verbs and **have no touch equivalent**
- Windows clamp to `max(300, viewport − 116)` px, so on a 390px phone a window is
  300px wide starting at x=104 — it overflows — on top of a fixed 88px icon rail
- The taskbar takes 46px and every title bar another ~25px, so 30–40% of the
  viewport is chrome before any content
- The ✕ and _ buttons are 20×17px against a 44px minimum tap target
- **The Android back button and iOS edge-swipe exit the whole site**, because
  opening a window is not a navigation

Keep the Windows-95 desktop at ≥1024px as the "you found the good version"
reward, and let the phone flow link into it. Poolsuite does exactly this.

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

### P3 — `<title>`, meta description, Open Graph tags

There are currently **none**. Every link posted to Discord, Twitter, Bluesky or
iMessage renders as a bare URL with no preview image.

These must be static HTML in the `<helmet>` — social scrapers and crawlers don't
run JavaScript, so they can't be injected at runtime. That makes them yours, and
it means **you have to carry them through every regeneration.**

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

The engineering side runs `npm run bindings` on receipt, which fails the build on
any binding mismatch, plus a browser smoke test that drives the full reading flow.
Both catch handoff breakage before it ships.
