# File ownership — Claude Design vs Claude Code

Two agents work on this repo. They must never edit the same file in the same
cycle. This document is the boundary; `BINDINGS.md` is the interface.

## The docs, and who reads which

| Doc | Audience | What it is |
|---|---|---|
| `CLAUDE.md` | Claude Code | Auto-loaded every session. Architecture, runtime constraints, invariants, verification commands. |
| `DESIGN-BRIEF.md` | Claude Design | Self-contained, paste-ready. Product, audience, what it owns, the work queue. |
| `OWNERSHIP.md` | both / humans | This file. The per-file boundary and the workflow rules. |
| `BINDINGS.md` | both | **Generated.** The names `Star Shard v3.dc.html`'s markup binds. Rebuild with `npm run bindings`. |
| `docs/archive/AUDIT.md` | humans | Historical — the pre-reboot product audit and competitive analysis. |

## The split

### Claude Design owns

| File | What it is |
|---|---|
| `Star Shard v3.dc.html` — **markup + `<helmet>` only** | layout, styles, copy in the markup, fonts, `<title>`/meta/OG tags |

### Claude Code owns

| File | What it is |
|---|---|
| `astro.js` | ephemeris, Placidus/Porphyry houses, lunar mansion, weekday |
| `sky.js` | daily engine: moon phase, tārābala (sidereal-27/Lahiri), planetary hours, station/step cast kinds |
| `sigil.js` | the Sigil: natal derivation, the 5 Traveler types, the arrival reading's 9-beat grammar (`readingPlan()`), ring SVG geometry |
| `sigil-copy.js` | placeholder prose for `reading.js`'s **Sounding** composer only — the arrival reading was re-pointed at `reading-copy.js`'s real corpus (PORT-SPEC.md); the nightly Sounding's counsel/question/claim text is a separate, still-unwritten pass. Content-authored stopgap, tier-0 vocabulary only |
| `deck.js` | the collection game: claim windows, grace, "returns in N days" |
| `events.js` | the event calendar: dated sky events (eclipses, supermoons, etc.), foil conditions |
| `astronomy-engine.js` | vendored third-party (MIT) — sunrise/sunset only, see `tools/vendor-astronomy.mjs` |
| `format.js` | degree/ordinal/place display strings |
| `tz.js` | historical UTC offset + DST for a birth moment |
| `api.js` | **all** network I/O — nothing else may call `fetch()` |
| `reading.js` | the Sigil/Sounding composers: `arrivalReading()`, `fullReading()`, `soundingReading()` |
| `starshard-api/**` | the Node/Express/MySQL backend |
| `test/**` | tests |

### Shared seam — change deliberately, announce it

`Star Shard v3.dc.html`, the `<script type="text/x-dc">` block at the bottom.

It is intentionally thin: state, lifecycle, and `renderVals()` — the object the
markup binds to. Both agents need it, so treat it as a contract, not as code.
If you add a binding, add it to `BINDINGS.md` in the same commit.

### Retired (August 13, 2026 reading-corpus cleanup)

`windows.js`, `card.js`, `image-slot.js`, `duet.js`, `wheel.js`, `shards.js`,
`design-system.html` — the pre-reboot four-shard flip UI's window manager,
share-card renderer, generated image-slot data, duet composer, chart-wheel
geometry, and written content, plus a superseded standalone design-token
preview page. Nothing on the live `Star Shard v3.dc.html` page references
any of them (verified directly, not assumed, before removal); they're
retired along with `Star Shard v2 (archived).dc.html`, the only thing that
ever called them, and stay in git history if a future feature wants the
pattern back.

### Generated — never hand-edit

`support.js`. Rebuilt by the dc-runtime; edits will be lost.

`mansions/*.html`, `mansions/index.html`, `mansions/og/*.jpg`, `sitemap.xml`,
`stations.js`, `reading-copy.js`. Rebuilt by `tools/build-mansions.mjs` /
`tools/build-mansion-images.mjs` / `tools/build-reading-copy.mjs`;
hand-edits diverge silently on the next regeneration. The build *scripts*
are normal `tools/**`, Claude-Code-owned. `stations.js` is the browser-side
copy of the same corpus (0-indexed, `station = id - 1`) that
`sigil.js`/`reading.js` import at runtime; `reading-copy.js` is the
browser-side copy of `research/corpus-spine.md` +
`research/corpus-stations-*.md` (the real reading prose, per
`PORT-SPEC.md`). A stale copy of either fails silently (wrong content
served into a real reading, no `{{ }}` tell), so `test/stations.test.mjs`
and `test/reading-copy.test.mjs` each diff their generated file against a
fresh in-memory render, the same way `npm run bindings` catches a stale
`BINDINGS.md`.

**Known gap in the source content:** the parser's epithets for all 28
mansions are hand-transcribed in `tools/build-mansions.mjs`'s
`MANSION_EPITHETS`, not parsed — `research/mansions-pilot.md`'s headings for
#10/#24 were never actually updated to the "v3" titles
`research/mansions-batch1.md`'s retitle note announces ("The Throne"/
"The Void"), and #22/23/25/26/27/28 originally had no heading anywhere
before `research/mansions-batch4.md` landed. If more mansion prose is
added later, check the new source's heading against this table before
assuming the parser will pick up a new epithet correctly — it won't; the
table needs a manual update too.

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
6. **A design export must never include or reference `astro.js`, `sigil.js`
   or `reading.js`.** Those are Claude Code's, they change most sessions,
   and an export that `import()`s an engine module as a sibling has shipped
   a stale pre-refactor copy **four times** in this repo's history (the
   original instance, pre-reboot: `docs/archive/STATUS.md`'s `copy.fallbackWeave is not
   a function` crash, from the now-retired `shards.js`). If a handoff
   includes an engine module, strip it before merging and treat the export
   as having followed a stale reference.

## Binding namespace — historical note + current convention

`Star Shard v2 (archived).dc.html` used a desktop/phone dual-tree
(`isDesktop`/`isPhone`) with a `p`-prefix convention for every phone-only
binding, to avoid collisions with the desktop tree's own bindings. That
architecture is retired along with the page — `Star Shard v3.dc.html` is a
single phone-first tree with no desktop/phone split, so there's no `p`-prefix
convention to follow.

**Current convention** (`DESIGN-BRIEF.md` v2, and CLAUDE.md's receipt
protocol): namespace per surface — `sig.*` (arrival + ring), `snd.*`
(Sounding), `cdx.*` (codex, not yet built), `crd.*` (cards, not yet built) —
with `auth`/`deck` shared unprefixed, same reasoning as before (a login is a
login regardless of surface; `deck`/`recollection` are account data, not
UI state, and sync across sessions the same way auth does). If you're not
sure whether a binding is surface-local or shared account data, default to
namespacing — an unprefixed collision is a silent bug, a redundant prefix
is not.

## Privacy invariant

Birth date, birth time and birth coordinates are computed in the browser by
`astro.js` and are **never** sent to the Star Shard backend. The only outbound
call carrying user input is the Open-Meteo city lookup, which receives a place
name and nothing else. The backend stores an email, a bcrypt hash, a JSON
blob of window coordinates, and — as of the reboot — the *derived* Sigil
(station/step/type indices, `sigil` table) and kindled `(station, step)`
records (`recollection` table). Storing the derived sigil is a deliberate,
scoped allowance (COSMOLOGY.md §7) — storing birth data itself is not, and
`PUT /api/sigil`/`POST /api/recollection` never receive it.

Do not break this. It is the strongest differentiating claim the product has.

## Known open items

These are deliberately **not** fixed, because they are decisions rather than
defects. See `docs/archive/AUDIT.md`.

- **W2** — done, and superseded. `hasLLM()`/`window.claude.complete` was
  removed pre-reboot; the `weave()`/`duetText()` mechanism it describes
  (hand-written variants in the now-retired `shards.js`/`duet.js`) was
  itself retired in the reading-corpus cleanup. The live equivalent is
  `reading.js`'s `arrivalReading()`/`fullReading()`, against the real
  corpus in `reading-copy.js` — same `seededPick()` determinism, real
  content instead of a combinatorial library.
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
- **W10** — superseded. The old 720×1000 share card and its `card.js`
  `CARD` block are retired along with the four-shard flip UI. The current
  share surface is the Sigil ring render on `Star Shard v3.dc.html`'s
  share screen — 9:16 was a design requirement from the start there, not
  an open item to fix.
