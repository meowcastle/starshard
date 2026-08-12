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
| `sky.js` | daily engine: moon phase, tārābala (sidereal-27/Lahiri), planetary hours |
| `astronomy-engine.js` | vendored third-party (MIT) — sunrise/sunset only, see `tools/vendor-astronomy.mjs` |
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
6. **A design export must never include or reference `astro.js`, `shards.js` or
   `duet.js`.** Those are Claude Code's, they change most sessions, and an
   export that `import()`s them as siblings has shipped a stale pre-refactor
   copy of one or both **four times** — most recently the crash documented in
   `STATUS.md` (`copy.fallbackWeave is not a function`, a function `shards.js`
   stopped exporting when W2 landed). If a handoff includes either file, strip
   it before merging and treat the export as having followed a stale reference.

## Phone flow (<1024px) — the `p`-prefix rule

`Star Shard v2.dc.html` is one file, one `Component`, two markup trees:
`<sc-if value="{{ isDesktop }}">` (windowed multi-window desktop UI) and a
sibling `<sc-if value="{{ isPhone }}">` (linear step flow, ported from the
former standalone `Star Shard - Staging.dc.html`, now retired — see below).
`isPhone`/`isDesktop` come from a `matchMedia('(max-width: 1023px)')` listener
in `componentDidMount`, so only one tree's event handlers are ever mounted.

**Every phone-specific state key, method, and top-level `renderVals()` binding
is `p`-prefixed** (`pStep`, `pChart`, `pShards`, `pAdvance`, `pGoBack`, ...) —
the same convention as the existing `f`/`d`/`g`/`w` prefixes for desktop's
form/duet/guestbook/window state. A literal merge of the two flows' bindings
has real name collisions (`chart`, `shards`, `hasDuet`, `todayMansion`) that
would silently overwrite one screen's data with the other's; nothing checks
for this except the convention.

**Two exceptions, both deliberate:**
- **Auth stays shared and unprefixed** (`authChecked`/`authEmail`/`doLogin`/
  `doSignup`/`doLogout`/`checkAuth`/`isLoggedIn`/etc.) — a login is a login
  regardless of viewport, and the phone account screen reuses the exact same
  bindings as desktop's `wAccount` window, just restyled.
- **`deck` stays shared and unprefixed** — it's account data (which of the 28
  mansions a user has collected), not phone-UI state, and is meant to sync
  across viewports the same way auth does. On login, `loadAndMergeDeck()`
  unions the server deck with whatever's in `localStorage` rather than letting
  either side overwrite the other — see the merge plan's data-loss note.

If you add a new phone-only binding, prefix it. If you're not sure whether
something is phone-UI state or shared account data, default to prefixing —
an unprefixed collision is a silent bug, a redundant prefix is not.

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
