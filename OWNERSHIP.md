# File ownership — Claude Design vs Claude Code

Two agents work on this repo. They must never edit the same file in the same
cycle. This document is the boundary; `BINDINGS.md` is the interface.

## The docs, and who reads which

| Doc | Audience | What it is |
|---|---|---|
| `CLAUDE.md` | Claude Code | Auto-loaded every session. Architecture, runtime constraints, invariants, verification commands. |
| `DESIGN-BRIEF.md` | Claude Design | Self-contained, paste-ready. Product, audience, what it owns, the work queue. |
| `OWNERSHIP.md` | both / humans | This file. The per-file boundary and the workflow rules. |
| `BINDINGS.md` | both | **Generated.** The 336 names the markup binds. Rebuild with `npm run bindings`. |
| `AUDIT.md` | humans | The product audit and competitive analysis the refactor came out of. |

## The split

### Claude Design owns

| File | What it is |
|---|---|
| `Star Shard v2.dc.html` — **markup + `<helmet>` only** | layout, styles, window chrome, copy in the markup, fonts, `<title>`/meta/OG tags |
| `.image-slots.state.json` | slot artwork (generated) |
| `.thumbnail` | preview (generated) |

### Claude Code owns

| File | What it is |
|---|---|
| `astro.js` | ephemeris, Placidus/Porphyry houses, lunar mansion, weekday |
| `format.js` | degree/ordinal/place display strings |
| `tz.js` | historical UTC offset + DST for a birth moment |
| `api.js` | **all** network I/O — nothing else may call `fetch()` |
| `wheel.js` | chart-wheel SVG geometry |
| `card.js` | share-card PNG (the `CARD` block at the top is design-tunable) |
| `reading.js` | shard text, woven reading, duet text |
| `windows.js` | window manager (the `LAYOUT` block at the top is design-tunable) |
| `shards.js`, `duet.js` | written content |
| `starshard-api/**` | the Node/Express/MySQL backend |
| `test/**` | tests |

### Shared seam — change deliberately, announce it

`Star Shard v2.dc.html`, the `<script type="text/x-dc">` block at the bottom.

It is intentionally thin: state, lifecycle, and `renderVals()` — the object the
markup binds to. Both agents need it, so treat it as a contract, not as code.
If you add a binding, add it to `BINDINGS.md` in the same commit.

### Generated — never hand-edit

`support.js`, `image-slot.js`. Rebuilt by the dc-runtime; edits will be lost.

## Rules

1. **Branch per agent.** `design/*` and `code/*`. Never both on the same file in
   one cycle.
2. **A Claude Design regeneration replaces `.dc.html`, it does not merge it.**
   Git will not warn you. After every design handoff, diff the script block and
   re-check `BINDINGS.md` before merging.
3. **Nothing outside `api.js` may call `fetch()`.** This is what keeps the
   privacy claim true (see below) and what keeps network behaviour reviewable.
4. **No logic in the markup.** If you find yourself wanting a computation inside
   `{{ }}`, it belongs in a module and comes back through `renderVals()`.
5. **Top-level `import` is a syntax error in the script block.** The runtime
   transpiles it with Babel presets `["react","typescript"]` — no module
   transform — and evaluates it inside `new Function(...)`. Modules must be
   pulled in with `await import()` from `componentDidMount`. This is why
   `renderVals()` guards on `ready`.

## Privacy invariant

Birth date, birth time and birth coordinates are computed in the browser by
`astro.js` and are **never** sent to the Star Shard backend. The only outbound
call carrying user input is the Open-Meteo city lookup, which receives a place
name and nothing else. The backend stores an email, a bcrypt hash, and a JSON
blob of window coordinates.

Do not break this. It is the strongest differentiating claim the product has.

## Known open items

These are deliberately **not** fixed, because they are decisions rather than
defects. See `AUDIT.md`.

- **W2** — `window.claude.complete` does not exist in the deployed runtime, so
  every user gets the same fallback paragraph. `reading.js` now exposes
  `hasLLM()` so the condition is explicit. Decide: delete the LLM path and grow
  the written library, or add a real server-side completion endpoint.
- **W6** — the account system stores window positions and nothing else, while
  carrying a password database. Password reset now exists (Resend-backed,
  hashed/expiring/single-use tokens, `starshard-api/server.js`). Still no email
  verification, account deletion, data export, or age gating for a 13–17
  audience — decide whether those are needed or whether to scope the system
  back down.
- **W8** — no `<title>`, meta description or OG tags. These must be static HTML
  to be read by crawlers and social scrapers, so they live in the `<helmet>` and
  are **Claude Design's** to add and to keep across regenerations.
- **W10** — the share card renders 720×1000; the share surface is 9:16.
  `card.js` `CARD` block is where that changes.
- **W11** — the guestbook is `localStorage` only. Either wire it to the API or
  reframe it as private notes.
