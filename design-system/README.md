# @starshard/design-system

A real buildable package wrapping Claude Design's own component
implementations — `Window`, `Button`, `Input`, `ShardCard`, `TarotCard` —
plus a spec-compliant `Taskbar` that Design's export didn't include.

Source of truth for the five adopted components and all tokens is
**`.claude/skills/star-shard-design/`** (installed from a Design export),
not `DESIGN-SYSTEM.md`'s markdown appendix — the real `tokens/*.css` files
there are more complete than that appendix (e.g. the actual 9-step spacing
scale derived from `Star Shard v2.dc.html` usage, the foil sub-ramp used by
`TarotCard[rare]`, `--tap-min`). Re-adopt from a future Design export rather
than hand-editing `Button.tsx`/`Input.tsx`/`Window.tsx`/`ShardCard.tsx`/
`TarotCard.tsx` or `src/tokens/*.css` directly.

## What this is for

This package exists to feed **Claude Design's canvas** via the `/design-sync`
skill, so future Design comps get composed from real, verified, on-brand
components instead of freehand markup. It is **not** consumed by the live
site — `Star Shard v2.dc.html` runs on the dc-runtime template (`<x-dc>`,
Babel-transpiled, evaluated via `new Function()`), which can't import a React
component library at runtime. Code still hand-translates whatever Design
produces into the site's inline-styled markup during handoff, same as before
this package existed.

## Build

```sh
npm install
npm run build       # → dist/index.js, dist/index.css, dist/index.d.ts
npm run typecheck
```

## Preview

`preview.html` (gitignored, local-only) renders every component with example
props via esm.sh — open it after building:

```sh
npm run build
python3 -m http.server 8935   # or any static server
# open http://localhost:8935/preview.html
```

## Known gap vs. DESIGN-SYSTEM.md

§4 says ShardCard should keep four distinct accent hues (house teal-500,
mirror pink-700, moon amber-700, hearth pink-500). Design's actual
`ShardCard.jsx` uses `--accent` (teal-500) for all four kinds — the title
strip doesn't currently vary by kind. Adopted as-is since this package
tracks Design's real implementation, not the spec doc; flag it to Design if
that's unintended.
