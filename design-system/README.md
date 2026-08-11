# @starshard/design-system

Implements `DESIGN-SYSTEM.md` v1.0: the token ramp, type scale, bevel/shadow
system, and six components (`Window`, `Button`, `Input`, `Taskbar`,
`ShardCard`, `MansionCard`) described in its §4.

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

## Scope

Six components, matching `DESIGN-SYSTEM.md` §4 exactly. Not built: the
`Shard card` face variants beyond the four accent hues, the Tarot card's foil
variant, and the transactional-email template (§5.6) — that one is plain HTML
with inline styles for email-client compatibility and doesn't belong in a
React component library.
