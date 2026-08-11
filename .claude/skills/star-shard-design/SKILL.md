---
name: star-shard-design
description: Use this skill to generate well-branded interfaces and assets for Star Shard, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

Read the readme.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Non-negotiables

- Button labels are `teal-900`, never white. White on `pink-500` is 2.55:1 and fails AA.
- Focus rings: `pink-700` on light, `pink-500` on dark. 3px solid, 2px offset. Never `outline:none`.
- `butter-200` is never text. Warm text is `amber-700`.
- Bevel dark edge is `#4E8C86` or darker.
- Radius is 0 unless the thing is round (50%) or a card (16px). Shadows never blur.
- 44px minimum tap target everywhere except desktop window controls.
- Tarot faces, share images and OG images run `data-context="card"`.
- There is no logo. Set the brand name in type; do not draw a mark.
