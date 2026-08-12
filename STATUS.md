# Star Shard — status

**August 12, 2026 update:** the reboot shipped its first MVP pass. `Star
Shard v2.dc.html` is retired and archived as `Star Shard v2 (archived).dc.html`
(reference only, not deployed). The live page is now `Star Shard v3.dc.html`
— **a Code-authored stopgap**, built directly against `DESIGN-SYSTEM.md`'s
tokens using the `sig.*`/`snd.*` binding namespace, since no real Claude
Design export with a binding manifest exists yet for the Sigil/Sounding
flow (the two files in `Starshard V3 (1)/` are disposable Design-canvas
mocks, not handoffs — see `CLAUDE.md`'s receipt protocol). New engine:
`sigil.js` (natal derivation, arrival grammar, ring geometry), `sky.js`'s
`castKind()`, `reading.js`'s `arrivalReading()`/`soundingReading()`,
`sigil-copy.js` (placeholder prose, pending the real ~60-piece kit),
`stations.js` (generated browser corpus), plus `sigil`/`recollection`
backend tables. Everything below this line predates the reboot.

---

August 11, 2026 · repo at `fe9e9e0` + the untracked 19:01 design export

---

## Verified green

| | |
|---|---|
| `npm run bindings` (v2) | ✓ 349 bindings, 140 top-level, none missing |
| `npm test` | ✓ 12/12 including the 3,000-chart no-regression run |
| `node test/smoke.mjs` (v2) | ✓ full reading flow, 16 degrees all valid |
| `node --check server.js` | ✓ |

**Every finding in `REVIEW.md` was closed** in `3b1d3e4` — stale export neutralised
and moved to a gitignored `design/incoming/`, `og:image` pulled rather than
shipping a bad card, reset token moved to a URL fragment, sibling reset tokens
invalidated, guestbook moderation added (`ip_hash` + `ADMIN_TOKEN` + DELETE by id
and by IP), the dead `weaving` state removed, relative seed dates, and
`support.js`/`image-slot.js` added to `deploy.sh`. That is eight for eight.

---

## What's new

**A real design system, three ways.** `design-system/` builds a dist bundle;
it's synced to an actual Claude Design project via `/design-sync`; and it's
installed as a Claude Code skill at `.claude/skills/star-shard-design/` with the
four non-negotiables encoded in `SKILL.md`. Tokens match the v1.0 spec exactly,
plus two sensible extensions Design added on its own — a `--foil-*` sub-ramp for
rare pulls and `--radius-card-sm` for deck thumbnails.

**`Star Shard - Staging.dc.html` — a production phone page**, not a comp. I ran
it in a 390×844 mobile browser and drove the flow.

What it gets right:

- **186 `var(--token)` uses, 1 raw hex.** Token adoption is real, not cosmetic.
- **`history.pushState` + `popstate`** — the Android back button and iOS
  edge-swipe now navigate instead of exiting the site. That was W1's nastiest bug.
- `100dvh`, `viewport-fit=cover`, 44px targets, `aria-label`s, real `<button>`
  and `<header>`.
- Mansion-first landing, the honest "i don't know my birth time" path, the
  privacy line, and a "UTC-7 on that date — daylight saving accounted for" note.
- A 28-slot deck grid with "today's crossing."
- **Button labels are `teal-900`, not white.** The non-negotiable held.

It looks like the product finally.

---

## 🔴 The front end and the back end are not connected

This is the headline. The backend now exposes **13 endpoints**. The new front end
calls **zero**. `grep -c "fetch(" ` on its script block returns `0`.

### 1. It crashes at the reading step

```
PAGEERROR  copy.fallbackWeave is not a function
```

Reproduced in the browser. The staging page calls `copy.fallbackWeave(...)`, but
the repo's `shards.js` **stopped exporting it** when W2 landed — the fallback was
replaced by the `WEAVE_OPENERS` / `WEAVE_MIDS` / `WEAVE_MANSION_LINES` /
`WEAVE_CLOSERS` library that `reading.js` consumes.

Design built against **its own stale copy** of `shards.js` (9,591 bytes) rather
than the repo's (12,231 bytes). Every user who reaches "weave my reading" hits
this. The fix is to import `reading.js` and call `weave()` — which is exactly
what the module boundary exists for.

Symbol check against the real modules:

| used | exists |
|---|---|
| `astro.SIGNS`, `computeChart`, `julianDay`, `mansionOf`, `moonLongitude`, `signOf` | ✓ all |
| `copy.ARCHETYPES`, `HOUSE_READINGS`, `MANSIONS`, `WEEKDAYS` | ✓ |
| `copy.fallbackWeave` | ✗ **removed** |

### 2. No accounts, despite an account screen

Bindings include `isAccount`, `email`, `setEmail`, `goAccount`. There is no
`fetch`, no `api.js` import, no signup, no login, no password reset. Meanwhile
the backend has all of it, working, with session revocation and Resend email.

### 3. The deck is localStorage-only

`localStorage.setItem('starshard.deck', ...)` — mansion indices, that's it.

The 28-mansion collection is the strategic centre of the product. Right now it
lives in one browser on one device, dies on a cache clear, and can't be shown to
anyone. There is an account system sitting right there that it isn't wired to.
This is the single biggest gap between what the design promises and what the
product does.

### 4. Fifty hardcoded cities replaced the geocoder

The birthplace field is now a `<select>` of 50 cities. The repo has
`api.geocode()` against Open-Meteo, which covers the world.

The list has **one city for most countries** — London for the UK, Berlin for
Germany, Manila for the Philippines, Jakarta for Indonesia, São Paulo for
Brazil — and 16 for the US. Suyin's audience is 34% US and 66% not. A user born
in Manchester, Hamburg, Cebu, Surabaya or Rio cannot get a chart at all, and
most Americans can't either.

### 5. `window.claude.complete` is back

Reintroduced at line 135 of the script block — the exact thing W2 removed
because it does not exist in the deployed runtime. The new shape is actually
better (fallback renders first, LLM upgrades it if available), but the fallback
is the function that crashes, so the net effect is: no reading at all.

### 6. `saveCard = () => {};`

An empty stub. The share artifact — the growth loop — does nothing when tapped.

### 7. Logic duplicated instead of imported

`offsetFor()` is reimplemented inline with a different algorithm than `tz.js`.
Both are probably correct; neither is tested against the other. `format.js`,
`api.js`, `reading.js`, `wheel.js`, `card.js` and `windows.js` aren't imported
at all.

---

## 🟠 Smaller, but real

**Foil contrast fails.** Design's `--foil-*` extension inherits
`--ink-accent: pink-500` from card context, but on `--foil-surface #5C3A1C` that
is **3.97:1** — below AA. Everything else on foil passes (cream 9.47, teal-200
6.91, butter-200 8.81). Fix: use `butter-200` as the foil accent, or lighten the
pink for that context only.

**`og:image` is `og.png`** — a relative path, and no such file exists. Scrapers
need an absolute URL. The v2 page correctly has no `og:image` at all right now;
the staging page has a broken one.

**Focus ring is 2px** in the staging page's `*:focus-visible`, against 3px in the
token (`--focus-ring`) and the spec.

**The export shipped stale `astro.js`, `shards.js`, `duet.js` again.** Third time.
`astro.js` is still byte-identical to the pre-refactor version with four known
bugs. It's what caused #1 above. The `DESIGN-BRIEF.md` exclusion list isn't
holding, because Design's pages `import()` these as siblings and the exporter
follows the reference.

**`tools/bindings.mjs` writes to a fixed `BINDINGS.md`.** With two pages it needs
per-page output — I ran it against the staging page and it silently overwrote
v2's contract file. It should be `BINDINGS.<page>.md`, and `npm run check`
should cover both pages.

**Nothing deploys the staging page.** `deploy.sh` ships `Star Shard v2.dc.html`
as `index.html` plus ten modules. It doesn't know about the staging page, the
`_ds/` bundle, or `tokens/`.

**No test coverage on the staging page.** Its bindings are self-consistent (71
bindings, 55 top-level, none missing) but nothing runs that check in CI, and the
smoke test only drives v2.

---

## The decision that is now blocking everything

**You have two complete, unrelated front ends.**

| | `Star Shard v2.dc.html` | `Star Shard - Staging.dc.html` |
|---|---|---|
| shipped by `deploy.sh` | ✓ as `index.html` | ✗ |
| palette | old Win95 purple | new design system |
| bindings | 349 / 140 top-level | 71 / 55 top-level |
| shares code with the other | — | none |
| imports | 10 modules | 2 |
| backend | accounts, guestbook, saved state | none |
| tested | unit + bindings + smoke | nothing |

They share no markup, no bindings, no styling and almost no logic. The desktop
page has the backend and no new design; the phone page has the new design and no
backend.

This was flagged as open in the last review and it has now become the thing that
gates everything else. Two options:

**A — One responsive page.** Merge the staging page into v2 as the `<1024px`
branch, one binding contract, one deploy target, one test suite. More work now;
everything after it is cheaper, and the 28 mansion permalinks (which need real
URLs anyway) have somewhere to live.

**B — Two pages, deliberately.** Phone page as `index.html`, desktop as
`/desktop`, each with its own contract and its own tests, sharing the modules.
Faster to ship; you maintain two of everything forever and every design pass
costs double.

I'd take **A**, mostly because the module layer already exists to make it cheap —
the staging page's problems are all "didn't import the thing that already
solves this."

---

## What I'd do, in order

1. **Fix the crash** — import `reading.js`, drop `copy.fallbackWeave` and the
   `window.claude` path. One import, ~10 lines. (§1, §5)
2. **Restore the geocoder** — import `api.geocode()`, keep the 50-city list as
   the offline fallback. (§4)
3. **Decide A or B.** Everything below depends on it.
4. **Wire the deck to the backend** — a `deck` table keyed by user, `GET`/`PUT`
   like `window_state`. This is what makes the collectible real. (§3)
5. **Import `tz.js`** instead of the duplicate `offsetFor`. (§7)
6. **Fix the foil accent** and the 2px focus ring.
7. **Per-page bindings output + smoke coverage** for whichever pages survive (3).
8. **Stop the export shipping code-owned modules** — the durable fix is for
   Design's pages to stop `import()`ing them and take fixtures instead.
9. Real `og.png` at 1200×630, absolute URL, on both pages.
10. `saveCard`.

---

*Verified locally: bindings, 12 unit tests, headless-Chromium smoke on v2, and a
390×844 mobile run of the staging page through landing → form → shatter →
shards → card → deck. Contrast computed to WCAG 2.2.*
