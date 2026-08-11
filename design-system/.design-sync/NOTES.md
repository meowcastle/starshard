# /design-sync notes — @starshard/design-system

## Setup

- Package shape (no Storybook): `shape: "package"` in config.json, pinned.
- `cssEntry` must be set explicitly to `dist/index.css` — the scraper's
  auto-detect doesn't find it on its own (our components use inline
  `style={{...}}` almost entirely, not CSS classes, so there's very little
  for a class-usage scrape to key off; the token custom-properties live in
  the stylesheet regardless and `cssEntry` just needs pointing there).
- Playwright/Chromium were not cached locally; installed fresh via
  `npx playwright install chromium` inside `.ds-sync/` before the first
  `package-validate.mjs` run.

## First sync — Aug 11, 2026

All 6 components (Button, Input, ShardCard, TarotCard, Taskbar, Window)
authored with real previews (2–4 exports each, 17 cells total) and graded
`good` by hand against the capture sheets. Render check: 6/6 clean, 0 bad,
0 thin. Uploaded to a fresh project ("Star Shard Design System",
`f4eaf5cf-7ef4-4e9f-9560-0b33d64de852`) — did NOT sync into the existing
"Star Shard a..." canvas project in the user's account, since that's where
Design has been hand-authoring source (comps, guidelines, tokens), not a
prior `/design-sync` upload target; pointing the sync there risked
overwriting authored content that isn't fully mirrored in this repo.

## Re-sync risks — what to watch on the next run

- **This package tracks Design's own component implementations**, not
  DESIGN-SYSTEM.md's markdown appendix (see design-system/README.md).
  `Button.tsx`/`Input.tsx`/`Window.tsx`/`ShardCard.tsx`/`TarotCard.tsx` and
  `src/tokens/*.css` were converted from a Design export
  (`.claude/skills/star-shard-design/components/` and `tokens/`) — if
  Design ships a newer export with different component behavior, this
  package will silently drift from it until someone re-adopts manually.
  There's no automated link between the installed skill and this package.
- **One known spec/implementation gap, not fixed here**: DESIGN-SYSTEM.md
  §4 says ShardCard should vary its accent color by kind (house teal-500,
  mirror pink-700, moon amber-700, hearth pink-500). Design's actual
  `ShardCard.jsx` uses `--accent` (teal-500) for all four kinds. Adopted
  as-is since this package mirrors Design's real implementation — flag to
  Design if the four-hue behavior was intended.
- **One bug fixed during adoption, diverging slightly from Design's
  source**: `Input` got `box-sizing: border-box` added (missing in Design's
  original `Input.jsx`, which would let the field overflow its container
  by the border+padding amount). If a future Design export reintroduces
  the unboxed version, re-apply this fix rather than accepting it verbatim.
- **Fonts are CDN-linked** (`tokens/fonts.css` → Google Fonts), not
  self-hosted. `[FONT_REMOTE]` prints on every build — informational, not
  a problem, but if Suyin ever supplies licensed font files this should
  move to `cfg.extraFonts`.
- **Taskbar has no Design-authored counterpart** — DESIGN-SYSTEM.md §4
  describes one but the Design export never included it, so this is a
  from-scratch build (mine), not adopted from anywhere. If Design later
  ships its own Taskbar, reconcile rather than silently overwrite.
- Known render warns: none currently recorded — all 6 components render
  clean with 0 `bad`/`thin`/`variantsIdentical` flags as of this sync.
