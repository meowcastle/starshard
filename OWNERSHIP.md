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

- **W2** — done. `hasLLM()`/`window.claude.complete` removed. `weave()` and
  `duetText()` in `reading.js` assemble each paragraph from hand-written
  opener/connective/mansion/closer variants (`shards.js`/`duet.js`), picked
  deterministically per chart via `seededPick()`.
- **W6** — the account system stores window positions and nothing else, while
  carrying a password database. Password reset now exists (Resend-backed,
  hashed/expiring/single-use tokens, `starshard-api/server.js`). Still no email
  verification, account deletion, data export, or age gating for a 13–17
  audience — decide whether those are needed or whether to scope the system
  back down.
- **W8** — done, minus the image. `<title>`, meta description, and OG/Twitter
  title/description tags are in the `<helmet>`. `og:image`/`twitter:image` were
  added, then pulled: the only art available was a 240×360 crop, well under the
  1200×630 platforms expect, and a bad card gets cached by Facebook for weeks.
  No image renders cleaner than a small one. Add back once real 1200×630 share
  art exists (W10). These tags live in Design's territory per the split above;
  carry them through the next regeneration (DESIGN-BRIEF.md's P3/handoff
  checklist covers this, including the export-exclusion list added after §1.1
  of REVIEW.md).
- **W11** — done, with a caveat (**W11b**). Guestbook is wired to
  `starshard-api` (`guestbook_entries`, public rate-limited GET/POST, falls
  back to a relative-dated seed only when the table is empty). Moderation
  baseline shipped: an `ip_hash` column and `requireAdmin`-gated
  `GET/DELETE /api/guestbook/*` routes, gated by a single `ADMIN_TOKEN` shared
  secret (no user-role system exists yet). Still open: whether posting should
  require an account, and who besides "whoever holds the token" should be able
  to moderate. This is a public, unauthenticated write endpoint on a site 25%
  of whose audience is 13–17 — treat that as a running decision, not settled.
- **W16b** — signup still returns a distinct `email_taken` error, which is
  user enumeration. Deliberately left as-is: removing it means gating signup
  behind email verification (a real flow change, not a bug fix), and the
  practical mitigation — 8 signups/hour/IP — is already in place. Revisit if
  that tradeoff stops feeling right. (W16a, session revocation on logout, is
  fixed — see `starshard-api/server.js`'s `token_version`.)
- **W10** — the share card renders 720×1000; the share surface is 9:16.
  `card.js` `CARD` block is where that changes.
