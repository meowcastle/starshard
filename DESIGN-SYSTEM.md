# Star Shard — Design System

**For Claude Design.** Self-contained; paste it in whole.
Version 1.0 · August 11, 2026 · supersedes the palette/type sections of `DESIGN-BRIEF.md`

---

## 0. Why this exists

I measured every surface. The drift is not a feeling, it's arithmetic:

| | |
|---|---|
| Distinct colors across the site's surfaces | **118** |
| Distinct `font-size` values | **32** |
| Colors shared between the main site and the phone flow | 14 of 52 and 40 |
| Colors shared between **any** site surface and Suyin's brand | **0** |
| Styling on the transactional email | **none** |

There are three visual systems in play, not two:

| System | Where | Signature |
|---|---|---|
| **Suyin's brand** | media kit, 13M monthly impressions | cream `#F8F8F0`, dark teal `#102828`, teal `#38C0B8`, hot pink `#F878A8`, butter `#F8F0C8` |
| **Main site** | `Star Shard v2.dc.html` | Win95 purple `#c586ad` / `#8a4d9e` on pale pink panels, square 2px bevels |
| **Dark cosmic** | phone flow, tarot comps | `#241541` / `#4a3277`, rounded 300px radii |

Plus an unstyled email in Times New Roman.

## 0.1 The question this answers

> *"either lean into the pixel aesthetic or abandon it with a homage"*

That instinct is right, and it resolves in a way that might be surprising: **leaning into the pixel aesthetic and moving to Suyin's brand palette are the same move.**

Windows 95's default desktop was **teal — `#008080`**. The Win95 palette was gray, teal and navy. It was never purple or lavender. Suyin's brand accent is teal `#38C0B8`.

So the purple currently shipping is the compromise position: not authentically retro, not on-brand, and — per the competitive audit — identical in register to Nebula, Moonly and AstroMatrix, who are all purple-cosmic. **Purple is the mushy middle. Teal is the committed one.**

Going teal-and-cream is a *harder* commitment to the bit, not a softer one.

## 0.2 Decisions locked

1. **Anchor:** Suyin's brand palette.
2. **Light/dark:** one light system; tarot cards, share PNG and OG image get a specified dark "card" treatment.
3. **Retro scope:** full window chrome at ≥1024px; on phone and cards the retro survives in **pixel type + bevel + hard shadow** only.

Everything below is derived from those three.

---

## 1. Color

### 1.1 The ramp

Six brand values, six derived. Every value below is either lifted from the media kit or derived from one.

```
cream        #F8F8F0   brand   page surface, window fill
teal-100     #D8F0F0   brand   secondary surface, inset fills
teal-200     #A8E0DC   derived hover, dividers, card mid-tone
teal-500     #38C0B8   brand   primary accent, action fill
teal-700     #1C5E58   derived muted ink, desktop backdrop, bevel dark edge
teal-900     #102828   brand   primary ink · AND the card surface
pink-200     #F8E0E8   brand   tertiary surface, tags
pink-500     #F878A8   brand   action fill, card accent
pink-700     #A63459   derived accent ink, focus ring on light
butter-200   #F8F0C8   brand   warm surface, highlight fill
amber-700    #7A5C18   derived warn ink
white        #FFFFFF           bevel light edge, card inner fill
```

**The structural idea:** cream and teal-900 swap roles between the two contexts. The page is cream with teal-900 ink; the card is teal-900 with cream ink. It is one palette inverted, not two palettes.

### 1.2 Semantic roles

Use these names, not raw hex. Re-anchoring the brand later becomes a twelve-value edit.

| Token | Page context | Card context |
|---|---|---|
| `--surface` | `cream` | `teal-900` |
| `--surface-raised` | `white` | `#1A3A38` (teal-900 +8% white) |
| `--surface-sunken` | `teal-100` | `#0A1C1C` |
| `--surface-accent` | `pink-200` | — |
| `--surface-warm` | `butter-200` | — |
| `--backdrop` | `teal-700` | `#0A1C1C` |
| `--ink` | `teal-900` | `cream` |
| `--ink-muted` | `teal-700` | `teal-200` |
| `--ink-accent` | `pink-700` | `pink-500` |
| `--ink-warn` | `amber-700` | `butter-200` |
| `--accent` | `teal-500` | `teal-500` |
| `--action` | `pink-500` | `pink-500` |
| `--edge-light` | `white` | `#2A5450` |
| `--edge-dark` | `#4E8C86` | `#061212` |
| `--focus` | `pink-700` | `pink-500` |

### 1.3 Rules that are not negotiable

Every pairing below was verified against WCAG 2.2. These four are the ones that are easy to get wrong:

1. **Button labels are `teal-900`. Never white.** White on `pink-500` is **2.55:1** and on `teal-500` is **2.23:1** — both fail badly. `teal-900` on those fills is 6.08 and 6.93. The site currently ships white-on-gradient buttons; they must change.
2. **The focus ring is `pink-700` on light, `pink-500` on dark.** `pink-500` on cream is 2.39:1 and fails the 3:1 non-text minimum. 3px solid, 2px offset, **never** `outline: none`.
3. **`butter-200` is never text.** It is a surface and a highlight only. If you need warm text, use `amber-700` (4.99:1 worst case).
4. **The bevel dark edge is `#4E8C86` or darker.** Anything lighter fails the 3:1 non-text contrast requirement for component boundaries — `#5E9C96` misses at 2.95:1.

### 1.4 Verified contrast

| | ratio | |
|---|---|---|
| `ink` on any light surface | 12.40 – 15.48 | AAA |
| `ink-muted` on any light surface | 6.03 – 7.52 | AA |
| `ink-accent` on any light surface | 5.16 – 4.91 | AA |
| `ink-warn` on any light surface | 4.99 | AA |
| `cream` on card | 14.51 | AAA |
| `teal-200` on card | 10.59 | AAA |
| `butter-200` on card | 13.49 | AAA |
| `teal-500` / `pink-500` on card | 6.93 / 6.08 | AA |
| `teal-900` on `pink-500` / `teal-500` | 6.08 / 6.93 | AA |
| cream window on `teal-700` backdrop | 7.05 | AAA |

Worst case across the entire specified system: **4.91:1.** There is no failing pairing.

---

## 2. Type

Three families, unchanged — this is the one thing that was already consistent. What changes is that each gets a **job**.

| Family | Job | Never |
|---|---|---|
| **Pixelify Sans** | The retro carrier. Window titles, taskbar, eyebrows, metadata, labels, the clock, file names, `4KB` chips. | Body copy. Anything over ~20px. |
| **Baloo 2** (700/800) | Display and headings. The warm, chunky voice. | Long paragraphs. |
| **Varela Round** | Body, UI, form labels, readings. | Headlines. |

**Pixelify Sans is what makes every surface feel like Star Shard.** It appears on the phone, on the tarot card, in the email, on the OG image — even where there is no window chrome at all. It is the through-line. Treat it as the logo.

### 2.1 Scale

32 sizes collapse to 8. Use only these.

| Token | px | Family | Line height | Use |
|---|---|---|---|---|
| `text-2xs` | 11 | Pixelify | 1.2 | eyebrows, chips, taskbar, `.shd` filenames |
| `text-xs` | 13 | Pixelify / Varela | 1.5 | metadata, captions, helper text |
| `text-sm` | 15 | Varela | 1.6 | **body default** |
| `text-md` | 18 | Varela | 1.6 | lead paragraph, shard body |
| `text-lg` | 22 | Baloo 2 | 1.3 | card titles, shard headlines |
| `text-xl` | 28 | Baloo 2 | 1.2 | window headings |
| `text-2xl` | 36 | Baloo 2 | 1.15 | page headings |
| `text-3xl` | 46 | Baloo 2 | 1.05 | hero |

Two documented exceptions: `text-hero` **64px** for the phone landing statement, and `text-numeral` **200px** for the tarot card's mansion numeral. Nothing else goes off-scale.

### 2.2 Letter-spacing

- Pixelify at `text-2xs` / `text-xs`: **`0.18em`, uppercase.** This is the single most recognisable typographic move in the system — the `✧ STAR SHARD · CERTIFIED CUTE ✧` treatment. Use it consistently.
- Baloo 2: `-0.01em` at `text-2xl` and above.
- Varela: `0`.

---

## 3. Space, shape, depth

**Space** — 4px grid. `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Nothing between.

**Radius** — the rule is: *zero, unless the thing is physically round or physically a card.*

| | radius |
|---|---|
| Windows, buttons, inputs, panels, chips, taskbar | `0` |
| Avatars, mascot slots, gem badges | `50%` |
| Tarot card, share card, OG image | `16px` |

The 44px/56px/300px radii in the current comps go away.

**Bevel** — the retro carrier that survives everywhere:

```css
/* raised */  border: 2px solid;
              border-color: var(--edge-light) var(--edge-dark)
                            var(--edge-dark)  var(--edge-light);
/* inset  */  border-color: var(--edge-dark)  var(--edge-light)
                            var(--edge-light) var(--edge-dark);
```

2px on desktop. **3px on phone** — it needs to survive a high-DPI screen at arm's length.

**Shadow** — hard offset only. No blur, ever.

```css
--shadow-window: 4px 4px 0 rgba(16, 40, 40, 0.45);
--shadow-raised: 3px 3px 0 rgba(16, 40, 40, 0.35);
--shadow-chip:   2px 2px 0 rgba(16, 40, 40, 0.30);
```

**Motion** — keep the existing keyframes, retimed and gated:

| | duration |
|---|---|
| `twinkle` | 2.4 – 3.4s |
| `floaty` | 3 – 5s |
| `popIn` | 350ms |
| `marquee` | 18s |
| **reveal beat** | **700ms** |

That last one is new and it resolves a live bug: the reading now generates synchronously, so the `weaving… ✦ ✦ ✦` state never paints — but the phone comp has a `shattering the sky / COMPUTING PLACIDUS CUSPS` interstitial designed for exactly that beat. Specify 700ms so the anticipation actually happens.

**All decorative motion must be wrapped in `@media (prefers-reduced-motion: reduce)` and disabled.**

---

## 4. Components

**Window** (desktop only) — `--surface-raised` fill, raised bevel, `--shadow-window`. Title bar 26px, Pixelify `text-2xs` uppercase, `cream` on a `teal-700 → pink-700` gradient when focused, flat `teal-200` when blurred. Controls **24×24px minimum** — the current 20×17 is below every guideline.

**Button** — raised bevel, inset on `:active`, `teal-900` label in Baloo 2 700. Primary `pink-500`; secondary `teal-200`; tertiary transparent with a bevel. Minimum **44×44px** touch, 32px desktop.

**Input** — `white` fill, inset bevel, `teal-900` text at `text-sm`, `teal-700` placeholder. 56px tall on phone, 40px desktop. Label above in Pixelify `text-2xs` uppercase `0.18em`.

**Shard card** — `--surface-raised`, raised bevel, a Pixelify title strip (`house.shd` / `4KB`), gem badge in the shard's accent. Face-down state: gem + title + `CLICK TO OPEN ✦`. Keep the four accent hues but restate them in the new ramp: house `teal-500`, mirror `pink-700`, moon `amber-700`, hearth `pink-500`.

**Tarot / mansion card** — card context. `teal-900` field, `16px` radius, `cream` ink, `butter-200` numeral, art window inset with a bevel. See §5.3.

**Taskbar** — 46px, `--surface` fill, top `--edge-light` line, Pixelify `text-xs`.

---

## 5. Per-surface specs

### 5.1 Desktop site — ≥1024px

Backdrop `teal-700` flat (**not a gradient** — Win95 desktops were flat, and it makes the cream windows pop). Windows `cream`. Full chrome: title bars, taskbar, Start, desktop icons, guestbook, marquee. Keep every bit of furniture — this is where the bit lives.

### 5.2 Phone — <1024px

One screen per step, full-bleed, no window furniture, action anchored bottom. Page `cream`, panels `white`, ink `teal-900`.

The retro carries through **Pixelify labels, 3px bevels on every input and button, and hard shadows** — nothing else. This is what "flavour, not furniture" means concretely.

Keep from the existing comp: the mansion-first landing, `"i don't know my birth time"` with the honest copy, the privacy line, the `shattering the sky` interstitial, 48px targets. Change: repaint to cream/teal, drop the rounded radii, drop the device bezel (that's mockup chrome).

Add a `open the full desktop ✦` affordance so the ≥1024 experience is discoverable.

### 5.3 Tarot / mansion card — 1080×1920

**Card context.** `teal-900` field, `16px` radius, `cream` ink, `butter-200` for the numeral, `teal-500`/`pink-500` accents, art in a bevelled window.

Must survive a **100px-wide thumbnail** — one element legible at that size. The existing comp already includes a thumbnail test; keep it.

28 of these. They are the collectible.

### 5.4 Share card PNG — 1080×1920

Same card context and layout language as 5.3 — a user's share card should read as the same object family as the mansion cards. This changes `card.js`'s `CARD` block from 720×1000; the drawing code is resolution-independent, so it's a config edit plus a layout pass.

Must look correct as a **full-bleed screenshot**, since most people screenshot rather than download. Ship a 1080×1080 crop as a secondary.

### 5.5 OG image — 1200×630

**This does not currently exist in usable form.** `og-image.png` is 240×360 — a portrait cosplay crop with no wordmark. It renders as a small thumbnail everywhere and Facebook caches it for weeks.

Needs: `1200×630`, card context, the Star Shard wordmark, a mansion card, and text legible in a feed. This is the highest-leverage single asset on the list.

### 5.6 Transactional email

Currently unstyled `<p>` tags. It is the only surface the user sees *outside* the product, so it is the one that most needs to feel like the brand — and the one with the tightest constraints.

- **Web fonts do not render in Gmail or Outlook.** Do not rely on Pixelify Sans. Stack: `Verdana, Geneva, 'DejaVu Sans', sans-serif`. Carry the brand with **color, layout, bevel borders and a hosted logo image** instead — a small PNG wordmark in Pixelify at the top does the job type can't.
- 600px max width, table layout, **inline CSS only**, no flexbox/grid.
- Page `cream`, card `white`, ink `teal-900`, one `pink-500` button with a `teal-900` label as a bevelled table cell.
- Bulletproof button (table-cell, not `<a>` with padding) so Outlook renders it.
- `alt` on every image; plain-text alternative part.
- Force light: some clients invert dark-mode. Use `#F8F8F0`, not `#FFFFFF`, so inversion is less destructive.

Cover: password reset (exists), and reserve the template for welcome and share-card delivery.

### 5.7 Shard Runner

Page context. Pixelify HUD, `cream` field, `teal-700` obstacles, `pink-500` player. Bevelled score panel. It inherits the system; it does not get its own.

---

## 6. Accessibility floor

Non-negotiable, and the reason several rules above look fussy:

- Every text/background pairing in §1.4 — no exceptions, no "it's decorative."
- Touch targets **44×44px** minimum; window controls **24×24px** minimum.
- Focus ring visible on every interactive element. 3px `--focus`, 2px offset. Never removed.
- Semantic HTML underneath the chrome: real `<button>`, `<label>`, `<h1>`–`<h3>` in order, landmarks. Style semantic elements — the `98.css` approach — rather than building `<div>` window managers.
- `@media (prefers-reduced-motion: reduce)` disables all decorative animation.
- Never encode meaning in color alone — the four shards need their glyph, not just their hue.

---

## 7. Deliverables

In priority order.

1. **Token sheet** — the §1–§3 values as a design-system project, so every later screen pulls from it.
2. **OG image** 1200×630. Unblocks a broken shipped feature.
3. **Wordmark** — "star shard ☆" locked up, in three sizes, plus a favicon set (16/32/180/512) and a 1024 app icon.
4. **Email template** — password reset, built to §5.6, with the logo PNG.
5. **Desktop site repaint** — `Star Shard v2.dc.html` markup and `<helmet>` moved onto the tokens.
6. **Phone flow** — production spec at 390 / 768 / 1024, not a device mockup.
7. **Tarot card system** — face, back, foil/rare variant, thumbnail test, and the 1080×1920 template.
8. **Share card** — 1080×1920 + 1080×1080.
9. **Mansion art** — 28 pieces. Start with 3 pilots covering the range (`Al-Thurayyā`, `Saʿd al-Suʿūd`, `Baṭn al-Ḥūt`) so the template can be validated before committing to 28.
10. **Shard Runner** repaint.

---

## 8. Working rules

The engineering side runs `npm run bindings` on receipt, which fails on any binding mismatch, plus a browser smoke test.

1. **Do not include `astro.js`, `shards.js`, `duet.js`, or any file listed under "what you must not touch" in `DESIGN-BRIEF.md`, in the export.** The last export shipped a copy of `astro.js` byte-identical to a pre-refactor version with four known bugs. If it had been copied in, it would have silently reverted them.
2. **Do not rename bindings.** 349 of them, listed in `BINDINGS.md`. A rename renders `{{ thatName }}` to the user. Moving, restyling, wrapping and dropping are all fine.
3. **New bindings must be flagged in the handoff notes** — they need a matching change in the shared script block.
4. **Meta and OG tags live in the `<helmet>` and are yours to carry across regenerations.** They cannot be injected at runtime; scrapers don't run JS.
5. Say in the handoff whether you touched the `CARD` block in `card.js` or the `LAYOUT` block in `windows.js`.

---

## Appendix — copy/paste tokens

```css
:root {
  --cream:#F8F8F0; --white:#FFFFFF;
  --teal-100:#D8F0F0; --teal-200:#A8E0DC; --teal-500:#38C0B8;
  --teal-700:#1C5E58; --teal-900:#102828;
  --pink-200:#F8E0E8; --pink-500:#F878A8; --pink-700:#A63459;
  --butter-200:#F8F0C8; --amber-700:#7A5C18;

  --surface:var(--cream); --surface-raised:var(--white);
  --surface-sunken:var(--teal-100); --backdrop:var(--teal-700);
  --ink:var(--teal-900); --ink-muted:var(--teal-700);
  --ink-accent:var(--pink-700); --ink-warn:var(--amber-700);
  --accent:var(--teal-500); --action:var(--pink-500);
  --edge-light:var(--white); --edge-dark:#4E8C86; --focus:var(--pink-700);

  --text-2xs:11px; --text-xs:13px; --text-sm:15px; --text-md:18px;
  --text-lg:22px; --text-xl:28px; --text-2xl:36px; --text-3xl:46px;

  --space-1:4px;  --space-2:8px;  --space-3:12px; --space-4:16px;
  --space-6:24px; --space-8:32px; --space-12:48px; --space-16:64px;

  --shadow-window:4px 4px 0 rgba(16,40,40,.45);
  --shadow-raised:3px 3px 0 rgba(16,40,40,.35);
  --shadow-chip:2px 2px 0 rgba(16,40,40,.30);
}

[data-context="card"] {
  --surface:var(--teal-900); --surface-raised:#1A3A38;
  --surface-sunken:#0A1C1C; --backdrop:#0A1C1C;
  --ink:var(--cream); --ink-muted:var(--teal-200);
  --ink-accent:var(--pink-500); --ink-warn:var(--butter-200);
  --edge-light:#2A5450; --edge-dark:#061212; --focus:var(--pink-500);
}
```

---

**Sources.** Brand values sampled from `uploads/Suyin Media Kit 1.pdf` (5 pages, 748,000 px). Contrast computed to WCAG 2.2 relative-luminance. Windows 95 desktop default `#008080` — [spycolor](https://www.spycolor.com/008080), [vintage Windows desktop colours](http://blog.pythonaro.com/2017/07/windows-vintage-default-desktop-colours.html). OG dimensions — [Open Graph image size reference 2026](https://imagedimensions.com/guides/open-graph-image-size). Email font support — [Litmus web fonts guide](https://www.litmus.com/blog/the-ultimate-guide-to-web-fonts), [web-safe fonts matrix 2026](https://min8t.com/articles/web-safe-fonts-for-email).
