# Star Shard — Design System v1.0

Star Shard is a free natal-chart reading site by **Suyin / Bjur Media LLC**. You
enter a birth date, time and place; it computes a real chart and returns four
"shards" — house, mirror, moon, hearth — plus one of the **28 Arabic lunar
mansions**, rendered as a collectible card you screenshot and post.

The audience arrives overwhelmingly from YouTube Shorts, on a phone, once. The
design system exists to make that single visit legible, honest and postable.

## Sources

- **Repository** — `github.com/meowcastle/starshard` (branch `main`). `OWNERSHIP.md`
  in that repo defines which code blocks are design-tunable vs. engineering-owned.
- **Brand spec** — `uploads/star-shard-design-system.html`, authored by the team.
  It is the ground truth for color, type and shape; every value here comes from it.
- **Product audit** — `uploads/AUDIT.md`, `uploads/DESIGN-BRIEF.md`.
- **Shipped share card** — `uploads/star-shard-bluenocturne.png` (720×1000).

Assume the reader has none of these. Everything needed is restated below.

## The problem this system solves

The spec measured the drift before fixing it:

| | count |
|---|---|
| distinct colors across surfaces | 118 |
| distinct font sizes | 32 |
| colors shared with Suyin's brand | **0** |
| styling on the transactional email | none |

Three palettes were in play — Suyin's brand kit, a Win95 purple on the main site,
and a deep-indigo "cosmic" palette on the phone and tarot work. This system keeps
**one**: Suyin's.

---

## VISUAL FOUNDATIONS

**Color.** Twelve values: eight from Suyin's media kit, four derived to clear
contrast minimums. Cream and teal-900 swap roles between contexts — the same
palette inverted, not a second theme. Windows 95's default desktop was teal
`#008080`, so anchoring on the brand teal is a *harder* commitment to the retro
premise than the purple it replaces.

The one structural rule: `[data-context="card"]` inverts ink and surface. Tarot
faces, the share PNG and the OG image run in card context; everything else is a
page. A collectible should read as an object, not a page.

**Type.** Three families, one job each, no overlap. *Pixelify Sans* is the retro
carrier — titles, eyebrows, metadata, numerals; it appears on every surface
including the ones with no window chrome, so treat it as the logo. *Baloo 2* is
display, 700/800 only. *Varela Round* is body and UI. Eight sizes, 11→46px, plus
two documented exceptions (64px phone hero, 200px tarot numeral).

**Shape.** The bevel is the through-line: 2px, light on top-left for raised,
inverted for inset, and it flips on press while the element translates 2px into
the page. Radius is **0** unless the thing is physically round (50%) or
physically a card (16px). Shadows are hard offsets with **no blur, ever** — three
depths, all in teal-900 at 30–45%.

**Spacing.** A 4-based scale, 4→40px. 44px is the minimum tap target on every
surface, desktop included; the only exception is the 24px window controls, which
exist only on pointer devices. Paragraphs cap at 64ch.

**Backgrounds.** Flat fills. The desktop sits on teal-700; windows are white or
cream. No gradients except the focused title bar (teal-700→pink-700) and the
gold foil sweep on a rare card. No photographic backgrounds, no noise, no grain.

**Animation.** Sparing and mechanical. Press is instant (2px translate, no
easing). The card flip and the "shattering" beat are the only theatrical moments;
the chart computes in milliseconds, so the shatter is deliberately short —
about a second, not five. No parallax, no scroll-linked motion, no bounce.

**States.** Hover lightens nothing — the bevel does the work. Press inverts the
bevel and drops the shadow. Focus is a 3px solid ring at 2px offset, pink-700 on
light and pink-500 on dark, and is never removed. Disabled is 45% opacity.

**Transparency and blur.** Effectively unused. This is a system of opaque
rectangles; a blurred backdrop would read as a different decade.

**Imagery.** Warm, high-key, anime-adjacent. The 28 mansion illustrations are
commissioned per mansion and are the only real imagery in the product.

---

## CONTENT FUNDAMENTALS

**Lowercase headings, sentence-case body.** "tell the stars about you ☆", not
"Enter Your Birth Information".

**Second person, present tense, specific.** The reading talks to *you* about
*your* chart, and it names the thing: "the house of far places and long questions
— you were built to go and look." Not "your cosmic journey awaits".

**Honest about uncertainty.** When the birth time is unknown, the copy says so
and drops the houses rather than guessing: "no problem — we'll skip your rising
sign and houses rather than guess them." Never invent precision the chart cannot
support — the shipped "STAR RESONANCE 87%" is the anti-pattern.

**Unicode as punctuation, not emoji.** ☆ ✦ ♡ ☾ appear as typographic marks,
usually one per line and often trailing. Full-color emoji are not part of the
brand. Filenames are flavour: `house.shd`, `birthdata.chart`, `today.exe`.

**Anime-community register, lightly.** "tag your oshi ♡", "mikufan39" as the
example name. Familiar to the audience, never explained to them.

---

## ICONOGRAPHY

**There is no icon set, and no logo.** The repository contains zero SVG, PNG,
icon-font or webfont assets — verified across the full tree.

The brand's icon vocabulary is **Unicode glyphs set in Pixelify Sans**: ☾ ✦ ★ ☆
♡ ✕ ‹ ›, plus the four shard glyphs ⌂ ◈ ☾ ✦. The one drawn shape in the system is
the shard itself — a five-sided `clip-path` polygon in `ShardCard`, not an image.

Consequences, deliberately:

- **No logo exists, and none was invented here.** Wherever a mark would go, set
  the words "star shard" in Baloo 2 800, or "STAR SHARD" in Pixelify with
  `.18em` tracking. Commissioning a real wordmark is deliverable #3 in the spec.
- If a UI needs an icon the glyph set cannot express, flag it rather than
  importing a third-party set — a Lucide or Heroicons stroke icon would read as
  a different product.

## Intentional additions

**The foil sub-ramp** — `--foil-surface`, `--foil-sunken`, `--foil-edge`. The
spec names "foil" as part of deliverable #7 but never assigns it values, and the
rare treatment needs a warm surface the 12-value ramp does not contain. Scoped to
`TarotCard[rare]`; `--foil-edge` resolves to `butter-200` so it introduces one
new hue, not two. Confirm the browns with Suyin.

The component inventory is otherwise exactly the five families the brand spec's
§3–4 defines: Button, Input, Window, ShardCard, TarotCard.

---

## Index

| path | what |
|---|---|
| `styles.css` | the entry point — imports only |
| `tokens/` | `fonts` · `colors` · `typography` · `spacing` · `shape` |
| `components/controls/` | `Button` · `Input` |
| `components/surfaces/` | `Window` · `ShardCard` · `TarotCard` |
| `guidelines/` | 14 specimen cards — Colors, Type, Shape, Spacing, Brand |
| `SKILL.md` | Agent Skills wrapper for Claude Code |

## Known gaps

1. **No logo, no favicon, no app icon.** Blocks the OG image and the email.
2. **No mansion art.** 28 commissions. `TarotCard` ships a ☾ placeholder.
3. **Fonts are CDN-linked, not self-hosted.** All three are Google Fonts and no
   binaries were supplied. Self-host before the email template — web fonts do
   not load in most mail clients, so that surface needs a system-font stack.
4. **Spacing is derived, not brand-supplied.** The spec fixes color, type and
   shape; the spacing scale was inferred from usage and should be confirmed.
5. **No UI kit yet.** The desktop repaint and phone flow are spec deliverables
   #5 and #6; the working phone flow currently lives in the website project as
   a Design Component, still on the old indigo palette.
