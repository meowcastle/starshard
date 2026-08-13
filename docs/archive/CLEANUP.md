# CLEANUP.md — folder audit

**Executed August 13, 2026** (same day, by Claude Code) — §1's deletions,
§4's archive, and §5's legacy-module retirement are done, verified against
zero references on the live page before removal (not assumed), full test
suite green after. §5's `sigil-copy.js` correction was already known and
handled correctly in the prior session — it's scoped to the Sounding only,
not deletable until that surface gets its own real corpus. `design/incoming/`
turned out to hold a duplicate of the same dead pre-reboot export this
doc's §1 already flagged — deleted alongside it, not called out separately
below since it wasn't known about when this was written.

---

**August 13, 2026.** What's in `starshard.net/` that shouldn't be, what's
stale, and what's safe to delete. **233 MB total; ~130 MB is regenerable
and ~11 MB is genuine clutter.** Nothing below is deleted — this is the
recommendation list, ordered by confidence.

> **Deletion note for the device:** the bridge can't `rm` on your machine.
> Anything you want gone, I can move into a `_to_delete/` folder for you
> to empty — say the word and I'll stage it.

---

## 1. Delete outright — dead weight, nothing references it (≈6 MB)

| Path | Size | Why it's dead |
|---|---|---|
| **`Star Shard Astrology Website (1)/`** | **5.4 MB** | The *pre-reboot* Claude Design export — 28 files including `Star Shard v2.dc.html`, the Phone Flow, Tarot & Journey, the old Album/Daily Card comps, plus **copies of `astro.js`, `duet.js`, `shards.js`, `support.js`, `image-slot.js`**. Untracked by git (0 files). Every surface in it was retired by the reboot, and those bundled engine copies are exactly the stale-import hazard that broke four handoffs. |
| **`design/incoming/`** | ~300 KB | Same export, staged a second time (Shard Runner, Phone Flow, Tarot & Journey). Gitignored by design as a scratch drop-zone — but these are five months of nothing and duplicate the folder above. |
| **`starshard-blueprint.pdf`** | 344 KB | A PDF print of `BLUEPRINT.html`. The HTML is the live artifact and the sidebar copy is current; the PDF is a frozen snapshot already out of date (pre-INSTRUMENT). |
| **`.DS_Store` ×2, `.thumbnail` ×3** | ~50 KB | macOS/Design-tool droppings. `.gitignore` already covers them; they're just sitting on disk. |
| **`design-system.html`** | 24 KB | Standalone preview page superseded by `design-system/preview.html` (which the build regenerates) and by `DESIGN-SYSTEM.md`. |

## 2. Keep for now, delete on a trigger

| Path | Size | Keep until |
|---|---|---|
| **`Starshard V3 (1)/`** | 428 KB | This is the **current** Design export (Aug 12) that the live `Star Shard v3.dc.html` came from — the wireframes and the hi-fi Night Loop. Keep until the next export lands, then delete this one. Only ever keep the newest. |
| **`Star Shard v2 (archived).dc.html`** | 180 KB | The retired page, deliberately archived per the receipt protocol. Delete once v3 has passed an extended smoke test in production for a week. It's in git history regardless. |
| **`uploads/`** | 3.4 MB | Two real assets: Suyin's media kit PDF and a screenshot. Tracked in git. Not clutter — but they belong in an `assets/` or the media-kit belongs out of the repo entirely. |

## 3. Regenerable — safe to delete any time, costs one command

| Path | Size | Rebuild with |
|---|---|---|
| `node_modules/` | **71 MB** | `npm i` |
| `design-system/node_modules/` | **51 MB** | `npm i` in that folder |
| `design-system/ds-bundle/` | 1.6 MB | design-sync build |
| `vendor/` | 3.2 MB | `node tools/vendor.mjs` (offline smoke-test deps only) |
| `design-system/dist/` | 24 KB | design-system build |

All five are already gitignored — they don't bloat the repo, only the
folder. **Deleting the two `node_modules` alone recovers 122 MB.**

## 4. Stale docs — the real clutter, because they mislead

Seventeen markdown files sit at the root and **four of them describe a
product that no longer exists.** Anyone (human or agent) reading them
gets the wrong model. Recommendation: create `docs/archive/` and move,
don't delete — the reasoning is worth keeping, the front-page prominence
isn't.

| File | Status |
|---|---|
| `AUDIT.md` (35 KB) | **Archive.** Audits the Win95 four-shard site. Every finding is either fixed or void post-reboot. Still cited by `CLAUDE.md` as "historical" — fine, but it shouldn't be the biggest doc in the folder. |
| `STRATEGY.md` (17 KB) | **Archive.** Pre-reboot product strategy; superseded by COSMOLOGY + INSTRUMENT + BLUEPRINT. |
| `REVIEW.md` (16 KB) | **Archive.** A point-in-time review of a repo state that no longer exists. |
| `STATUS.md` (10 KB) | **Archive or delete.** Snapshot dated Aug 12, already wrong. Status now lives in BLUEPRINT §7 + the task list. |
| `REBOOT.md` (14 KB) | **Keep** — COSMOLOGY supersedes §1 and §4 but the topology and Sounding beats are still normative. Add a one-line header saying which parts are live. |
| `SIGIL-READING.md`, `ANCHORS.md`, `INSTRUMENT.md`, `COSMOLOGY.md`, `PORT-SPEC.md`, `BLUEPRINT.html`, `DESIGN-BRIEF.md`, `DESIGN-SYSTEM.md`, `CLAUDE.md`, `OWNERSHIP.md`, `BINDINGS.md` | **Keep, all current.** |

**After archiving, the root doc set is 11 files, all describing the
current product.** That is the single highest-value cleanup here — not
the megabytes.

## 5. Code that is now legacy

Checked against the live page (`Star Shard v3.dc.html`) and the test
suite. **These modules are referenced by nothing on the live path:**

| Module | Referenced by |
|---|---|
| `windows.js` (6.9 KB) | nothing — the window manager for the retired desktop |
| `card.js` (3.9 KB) | nothing — old share-card renderer |
| `image-slot.js` (65 KB) | nothing — machine-generated, from the old export |
| `duet.js` (4.9 KB) | only `reading.js`'s legacy `duetText()` |
| `wheel.js` (2.2 KB) | one other module |
| `shards.js` (12.8 KB) | `reading.js`'s legacy `weave()` + one test |

They're small, so this is hygiene rather than weight — but `reading.js`
still carries `weave()`, `duetText()`, `buildShards()` and
`todayRelation()` for a four-shard flow the site no longer has. **Ask
Claude Code to confirm the v2 surfaces are truly gone, then remove the
legacy exports and their modules in one commit** — otherwise the next
agent to read `reading.js` will assume all of it is live.

**One correction to my earlier note:** I said `sigil-copy.js` could be
deleted now. It can't — **the live page still imports it in three
places.** The page has to be repointed at `reading-copy.js` first. Order
matters: repoint → verify → delete.

## 6. Untracked files that should be *decided* about

`git status` shows 26 untracked entries. Most are the new corpus and
docs (should be committed), but these need a call:

- `Star Shard Astrology Website (1)/`, `Starshard V3 (1)/` — **add to
  `.gitignore`.** Raw Design exports don't belong in version control;
  `design/incoming/` is already ignored for exactly this reason, and
  these two landed at the root instead of in it. Better: put future
  exports in `design/incoming/` per `OWNERSHIP.md` and let the existing
  rule cover them.
- `starshard-blueprint.pdf` — delete (see §1).
- `reading-copy.js`, `tools/build-reading-copy.mjs`,
  `test/reading-copy.test.mjs`, `research/corpus-*.md`, `ANCHORS.md`,
  `INSTRUMENT.md`, `PORT-SPEC.md` — **commit these.** They're the
  current build.

## 7. Recommended sequence

1. Commit the real work (corpus, docs, the port) — it's been untracked
   through several sessions.
2. Add the two export folders to `.gitignore`; move future exports into
   `design/incoming/`.
3. Delete §1 (≈6 MB of genuinely dead files).
4. Create `docs/archive/`, move the four stale docs.
5. Repoint the page off `sigil-copy.js`, then delete it.
6. Ask Claude Code to retire the legacy v2 modules in one commit.
7. Leave `node_modules` alone unless you need the disk — it's ignored
   and one command away.

**Net effect:** ~6 MB of dead files gone, ~130 MB recoverable on demand,
and — the part that actually matters — a root folder where every
document describes the product that exists.
