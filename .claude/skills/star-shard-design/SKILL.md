---
name: star-shard-design
description: Use this skill to generate well-branded interfaces and assets for Star Shard, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

Read the readme.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Non-negotiables

These describe the **current (v2.0) live product** — the amber/parchment
dark-cosmic direction. If you see teal-900, pink-500, butter-200, bevels,
or `data-context="card"` anywhere, that's the *retired* v1.0 direction
(still mirrored in this skill's `components/` and `guidelines/` for
reference only) — don't build new work to it.

- `#FFB000` (amber) is reserved for "tonight" only. Never use it for
  anything else — this is the one hard color law in the system.
  `#F0D89A` (parchment) is the accent for everything else.
- Fonts are Cormorant Garamond (headings, weight 600) and Varela Round
  (everything else). No third font, ever.
- No em dashes in product copy, headers or body. Colon, period, or comma
  pair instead; `·` for label separators; en dash only for numeric ranges.
- No first person. "We" appears nowhere. The product never narrates its
  own trustworthiness or method.
- Radius is 0 unless the thing is round (`50%`) or a small card/panel
  softening (4–8px). No bevels, no hard-offset drop shadows — the only
  shadow language is a soft colored glow.
- 44×44pt tap target design goal (28×28pt absolute floor), 4.5:1 contrast
  under 17pt text (3:1 at 18pt+/bold), never `outline:none` on focus.
- Tab bar is exactly three destinations: shard / tonight / chart.
- There is no logo, no favicon, no app icon. Set the brand name in type;
  do not draw a mark. Icons are Unicode glyphs (`✦ ☾ ☽ ✧`) in the brand
  fonts, not an imported icon set.
