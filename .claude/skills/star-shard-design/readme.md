# Star Shard — Design System v2.0 (the reboot direction)

Star Shard is a divination game played against the real sky. You enter a
birth date, time (optionally place), and it computes a real chart: a
**Sigil** (a dark ring of 28 arcs with bright natal marks — your personal
Star Shard), a **shard blueprint** (sun-mansion × moon-mansion, your natal
chart as an object), and a nightly loop where the real Moon's transit
through one of the **28 lunar mansions** kindles a segment of your ring.
A separate minigame, **Manzil**, plays a capture-duel card game against
the sky's own hand across those same 28 mansions.

There is **no creator brand**. That pivot is on the record (Aug 13,
2026) — Star Shard is not tied to any one person's identity or media
kit. Audience: phone-first, skews female, a meaningful share aged 13–17.

## What this replaces

**v1.0 of this doc described a retired direction**: a Windows-95-retro
cream/teal palette (Pixelify Sans, Baloo 2), branded to a creator called
"Suyin." That system does not exist anywhere in the live product. If you
find old references to teal-500, butter-200, `[data-context="card"]`,
window chrome, or bevels, they are historical and should not be revived.
The `components/` folder (Button/Input/Window/ShardCard/TarotCard/
Taskbar) and the `guidelines/` specimen cards have both been updated to
this current direction — see `components/README.md` for what changed
and what was dropped (the old `kind` enum, foil/rare, card-context
inversion, bevels).

## Sources

Assume the reader has none of these. Everything needed is restated below.

- **Repository** — `github.com/meowcastle/starshard` (branch `main`).
  `CLAUDE.md` at repo root is the living map of the whole product.
- **The live pages** — `Star Shard v4.dc.html` (repo root, the deployed
  astrology app) and `Star Shard v3 Build Plan/Manzil - The Empty
  District.dc.html` (the Manzil minigame) are the ground truth for
  color, type and shape. Every value below was read directly out of
  their inline styles, not inferred from a separate spec doc.
- **Voice** — `WRITING.md` at repo root. Read it in full before writing
  any product copy; it is short and every rule in it is load-bearing.
- **Interaction/accessibility law** — `UI-PRINCIPLES.md` at repo root.
- **`DESIGN-SYSTEM.md` and `DESIGN-BRIEF.md` at repo root are stale**,
  predating the Aug 13 reboot by two days. They document the retired
  Suyin/Windows-95 direction and should not be consulted for current work.

---

## VISUAL FOUNDATIONS

**Color.** A single five-color system, used identically across both the
astrology app and the Manzil minigame:

| Role | Hex | Notes |
|---|---|---|
| Outer page background | `#040302` | near-black, the `<body>` fill |
| Background gradient (top → mid → bottom) | `#1E1706` → `#0F0B03` → `#080502` | `radial-gradient(120% 60% at 50% 0%, ...)`, recurs verbatim on every screen |
| Primary ink | `#F2EAD6` | headings and body text |
| Muted / secondary text | `#9A8A5E` | eyebrows, meta lines, labels, dimmed states |
| Parchment accent | `#F0D89A` | the workhorse accent — links, borders, secondary CTAs, dividers, "everything else" |
| **Amber accent** | `#FFB000` | **reserved for "tonight" only** — never use it for anything else. This is the one hard color law in the system. |
| Error / warning | `#E8A87C` | soft coral, the only status color that exists |
| Near-white highlight | `#FFFDF5` | rare, high-emphasis text |

Borders are almost always parchment at low opacity — `rgba(240,216,154,.1)`
through `rgba(240,216,154,.3)` for soft dividers, `1px solid #F0D89A` or
`1px solid #FFB000` only for emphasized panels/CTAs. There is no
"card context" inversion rule in the current system — that was retired
along with TarotCard's foil treatment.

**Type.** Two families, no more:

- **Cormorant Garamond** (serif) — headings, titles, names, emphasized
  numerals. Weights **500, 600, 700** loaded; in practice almost
  everything ships at **600**.
- **Varela Round** (sans) — everything else: body copy, labels, buttons,
  inputs, eyebrows. Single default weight (Google Fonts only ships one).

```html
<link href="https://fonts.googleapis.com/css2?family=Varela+Round&family=Cormorant+Garamond:wght@500;600;700&display=swap" rel="stylesheet">
```

The type scale is **empirical, not a clean modular ramp** — the product's
own law is "never invent precision the chart cannot support," and that
extends to not pretending a tidy scale exists where the shipped code uses
whatever size reads right (11px, 11.5px, 12px, 12.5px, 13.5px, 14.5px,
16px, 17px cluster for body/label text; 24px, 30px, 34px, 38px, 40px,
42px for headings). Don't invent a stricter scale than this — match a
nearby existing size instead of adding a new one.

**Shape.** Sharp rectangles by default — **no border-radius unless the
element is physically round (`50%`, used for rings/dots/planet glyphs)
or a small softening on a card/panel (4–8px, occasionally 14px on a
minigame card corner)**. There is no bevel system, no raised/inset border
treatment, no hard-offset drop shadows. The only shadow language in use is
soft **glow**, applied as a colored blur: `box-shadow:0 0 14px
rgba(240,216,154,.25)` on emphasized elements (rings, armed buttons). If
you're drawing a hard-edged offset shadow or a 3D bevel, you're building
the retired system, not this one.

**Spacing.** The one documented law (the "calm-pass law"): **padding
64/32/140** — roughly, generous top clearance, ~32–34px horizontal
margins, and a large ~140px bottom clearance so content clears a tab bar
or scroll affordance (the very first onboarding screen uses 64px bottom
instead, since nothing sits below it yet). `--tap-min: 44px` still holds
as the minimum tap target per `UI-PRINCIPLES.md`'s accessibility law.
Paragraphs should stay well short of a hard measure limit — this product
favors short copy over line-length rules (see Content fundamentals below).

**Backgrounds.** The dark radial gradient (above) is the constant. Warm
colored glows (blue, violet, teal, rose, green, all at very low opacity)
are used as atmospheric scene-dressing on the Manzil minigame's
illustrated surfaces specifically — they are not part of the core UI
chrome and shouldn't leak into the astrology app's own screens.

**Animation.** Calm, ceremonial, infrequent. The core interaction law:
*"ceremony scales inversely with frequency"* — arrival is paced once,
the nightly reading is one screen, and a rare threshold night earns
ceremony back, which is what makes it feel rare. In code this shows up
as short (0.35–0.5s `ease`/`ease-out`) fade-ups and scale-settles for
content appearing on screen, plus a handful of slow continuous ambient
effects (16s linear ring spins, 1.2–1.4s breathing pulses on glows) and
one deliberate longer sweep (a ~1.25s `stroke-dashoffset` arc reveal on
the Sigil ring). Nothing is fast, bouncy, or parallax/scroll-linked. The
Manzil minigame carries a much denser, separate "game juice" animation
layer (card flips, capture VFX, environmental ambience) — that's
deliberately its own register, not something to blend into the
astrology app's calmer pacing.

**States.** No documented bevel-based interaction states exist in the
current system (that was the retired Win95 approach). Follow
`UI-PRINCIPLES.md`'s accessibility law instead: focus must never be
`outline:none`; contrast at least 4.5:1 under 17pt text and 3:1 at 18pt+
or bold; disabled states read as dimmed, not hidden.

**Transparency and blur.** Parchment-at-opacity borders and glows are the
system's whole vocabulary here — no backdrop blur, no frosted-glass
panels, nothing photographic behind content.

**Imagery.** Sparse and symbolic. The astrology app draws its own
imagery inline as SVG (the chart wheel, the Sigil ring) — no external
image assets. The Manzil minigame commissions per-mansion illustrated
card art (28 mansions, one motif each) as its one real imagery surface.

---

## CONTENT FUNDAMENTALS

Read `WRITING.md` at repo root in full before writing product copy — it
is short and every rule in it is load-bearing. The condensed version:

**Show it. Don't introduce it, frame it, or explain why it matters.** If
a sentence only preps the next sentence, cut it. Cut on sight: announcing
the reveal ("and here's the part almost nobody knows…"), labelling the
move ("the cost is…"), not-X-but-Y constructions, meta-commentary,
throat-clearing openers ("so", "worth knowing:").

**The reader is the subject of every sentence.** Attribute every value
judgment ("the old election books called this the best station" — never
"this is the best station"). No commentary on politics, current events,
or culture. Name the tension; don't prescribe the virtue.

**"We" appears nowhere. No first person, ever.** The product never
narrates its own trustworthiness or method — no "we compute," "we don't
guess," "this isn't a trick," "built on trust." Define by assertion, not
negation.

**Lowercase headings, sentence-case body.** No em dashes anywhere in
product copy, headers or body — rewrite as colon, period, or comma pair;
`·` for label separators; en dash only for numeric ranges (code comments
are exempt from the em-dash rule).

**Honest about uncertainty.** Say so and drop the feature rather than
guess — "no problem, we'll skip your rising sign and houses rather than
guess them," never invented precision like a fake "87% resonance" score.

**Say the real astrology term.** Define it once in four words on first
contact, then use it forever without re-explaining ("sextile your
midheaven," not a paraphrase). Coined words are reserved for things
astrology genuinely has no word for — **one new coined noun per surface,
max**: shard (arrival), station (the night loop / a lunar mansion), the
Becoming (the Deep Chart). Several earlier coinages are explicitly
retired — if you see "the Lantern," "Sigil" used as a common noun,
"Sounding," "Light" as a phase-name, "Keeper," or "Step" as a label in
old material, replace them with the plain word (the moon, your chart,
tonight, new/waxing/full/waning, the day's planet — and just drop "Step"
entirely).

**Length law.** Deep Chart ~1,000 words, arrival ~450, daily 60–90 words.
When in doubt, the shorter version is the one that gets finished.

**Unicode as punctuation, not emoji.** `✦ ☾ ☽ ✧` appear as typographic
marks and section-break ornaments, set in the brand fonts — not
full-color emoji, and not a real icon set.

---

## INTERACTION & ACCESSIBILITY LAW

Read `UI-PRINCIPLES.md` at repo root in full. The parts that bind every
screen:

- **Progressive disclosure, two levels max**, with state/cost/permissions/
  risk always visible at level 1 — never buried behind a tap.
- **Three tiers of the reading itself**: answer → tonight's sky → the
  numbers (opt-in, one further level). Deliberate imprecision at tier 1;
  decimals live in tier 3 only.
- **Tab bar is exactly three destinations: shard / tonight / chart.**
  Tab bars are for navigation only, never actions. `tonight | this week`
  is correctly a segmented control, not a tab pair. Never title a screen
  with the app's own name.
- **One region, one thing** — enclosure and proximity do the grouping
  work, not decoration.
- **Honest, not urgent** — no manufactured scarcity, no fake countdown
  pressure, no capability theatre.
- **Accessibility floor**: 44×44pt tap target design goal (28×28pt
  absolute floor), 17pt default body text (11pt minimum), never an
  Ultralight/Thin/Light font weight, 4.5:1 contrast under 17pt (3:1 at
  18pt+/bold), text must survive 200% scaling, one or two prominent
  buttons per view, screen titles under 15 characters.

---

## ICONOGRAPHY

**There is still no logo, no favicon, no app icon, no OG image** — this
did not change with the reboot. Every graphic in the astrology app is
inline SVG drawn directly in markup (the chart wheel, the Sigil ring);
Manzil's illustrated card art is the one commissioned-imagery surface.
Icons are Unicode glyphs set in the brand fonts: `✦ ☾ ☽ ✧`, plus `°` for
chart data. Don't import a third-party icon set (Lucide, Heroicons,
etc.) — it will read as a different product. If a screen needs an icon
the glyph vocabulary can't express, flag it rather than inventing one.

## Component inventory

The live product itself has **no separate UI component library** — it is
built as inline-styled markup directly inside `.dc.html` pages (Claude
Design's export format for this project), not a reusable React kit. The
`components/` folder in this skill is a prototyping aid, reskinned to
match that live visual language (see `components/README.md`): `Button`,
`Input`, `Window` (a bordered panel, not desktop chrome), `ShardCard` (a
reading/finding panel), `TarotCard` (a real lunar mansion, not a tarot
card), `Taskbar` (the real 3-item tab bar). Use these for throwaway
mocks and prototypes; production screens should still match the raw
markup patterns in the live `.dc.html` files directly.

---

## Index

| path | what |
|---|---|
| `readme.md` | this file — the current (v2.0) ground truth |
| `tokens/` | `fonts` · `colors` · `typography` · `spacing` · `shape` — updated to current values |
| `components/` | reskinned prototyping kit (Button/Input/Window/ShardCard/TarotCard/Taskbar) — current amber/parchment direction |
| `guidelines/` | 14 specimen cards, updated to current — palette, ink, no-bevel/no-foil/no-card-context notes, type, spacing, voice, iconography |
| `uploads/` | source material for the *retired* system (Suyin media kit, old design-system.html, old screenshots) — historical, not current |
| `SKILL.md` | Agent Skills wrapper for Claude Code |

## Known gaps

1. **The reskinned `components/*` kit is a prototyping aid, not the
   product's real UI layer.** No React component library exists for the
   live product — it's built as `.dc.html` markup directly.
2. **No logo, no favicon, no app icon.** Unchanged from v1.0 — still
   genuinely absent from the product, not an oversight in this doc.
3. **No mansion art shipped as real assets yet** in the astrology app
   itself (Manzil's minigame commissions its own per-mansion art
   separately — see `Star Shard v3 Build Plan/Manzil - Art Briefs.dc.html`).
4. **Fonts are CDN-linked, not self-hosted.** Both families are Google
   Fonts; no binaries are vendored. If a surface needs to work offline or
   in an email client, it needs a system-font fallback stack.
5. **The type scale is intentionally empirical**, not a clean ramp (see
   Type above) — don't "fix" this by inventing a stricter scale unless
   the product itself adopts one.
6. **This whole reskin lives only in this local skill folder** — it has
   not been pushed to the "Star Shard Design System" project on
   claude.ai, which still holds the retired v1.0 components. Ask before
   pushing; it's a real write to a shared remote project.
