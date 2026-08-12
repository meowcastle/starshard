# Star Shard — brief for Claude Design · v2 (the overhaul)

**This supersedes the previous brief wholesale.** The front end is being
rebuilt from scratch against the reboot. The database and engine stay; the
markup, the surfaces, and the product frame are new.

> **Read `DESIGN-SYSTEM.md` first.** It is still the visual law — colour,
> type, spacing, shape, shadow, the card-context inversion, the WCAG floors.
> Nothing in this file overrides it.

**The packet, in reading order** (everything you need, nothing you don't):

1. `BLUEPRINT.html` — the system map. Form and function on one page: the
   five-layer stack, the traceability matrix, the night loop, the Reveal
   ladder, the MVP build order. When lost, return here.
2. This file — your marching orders.
3. `DESIGN-SYSTEM.md` — the visual law.
4. `COSMOLOGY.md` — the canon. Especially: §2 the lexicon **with reveal
   tiers** (a copy law, see below) · §3.3 the Sigil · §3.4 the five types ·
   §3.5 the Sounding · §4 Recollection · §5 the Reveal.
5. `REBOOT.md` — the Sounding's five-beat spec and the wheel topology.
6. `research/mansions-table.json` — per-station card data: epithet, kanji,
   real asterism star positions, the four cultural names, match flags.
7. `research/mansion-names.md` — the approved 28-epithet slate.
8. `research/mansions-pilot.md` + `mansions-batch1..4.md` — real copy, for
   honest comps (don't lorem-ipsum the cards; the corpus exists).
9. `OWNERSHIP.md` + `BINDINGS.md` — the seam contract with engineering.

Historical files (`AUDIT.md`, `STRATEGY.md`, `REVIEW.md`, `STATUS.md`) and
the content-side research (iching, rave-mandala, starmyths, physics-paradox,
verify-report) are **not** in your packet — their conclusions are already
baked into the five files above.

---

## The product (as of the reboot)

**Star Shard is a divination game played against the real sky.** One star
sowed itself into travelers; your birth minute is recorded as your **Sigil —
your personal Star Shard**: a dark ring of 28 arcs with bright natal marks.
Each night the Moon (**the Lantern**) stands in one of 28 stations on the
**Moonroad**; visiting during the crossing is a short five-beat reading
(**the Sounding**) that ends by **kindling one segment of your own ring**.
The collected text is written *about you* — relational, through your natal
chart. The story is **revealed, never told**: no surface explains the myth;
it surfaces in codex fragments as you walk, in an order set by your own
birth chart.

The one-sentence pitch for every screen you draw: *a beautiful nightly
ritual that slowly reveals it was always about you.*

## Who it's for — unchanged, and it still drives every decision

Web property for **Suyin (@suyinsama)**: daily Hatsune Miku / Vocaloid
cosplay from Brooklyn, ~13M monthly views, 104K followers.

| | |
|---|---|
| Gender | 62% female |
| Age | 25.3% are **13–17** · 74.7% are 18+ |
| Geography | 34% US, then UK, Germany, Philippines, Indonesia |
| **Where they come from** | **87% of views are from the YouTube Shorts feed** |

**The audience is functionally phone-only.** Design phone-first; the desktop
gets the chrome, the phone gets the flavour (`DESIGN-SYSTEM.md` §context).
The Win95 desktop simulation is **no longer the product frame** — retro
survives as homage in the tokens, not as windows to drag.

## The voice — carried forward, plus two new laws

Warm, lowercase, nostalgic-cute, family-friendly, no drama. Keep it. Two
additions, both binding:

1. **Journey vector** (COSMOLOGY §1): the traveler is never "from Earth" —
   the traveler is *currently* Earth. Copy leans on arriving, crossing,
   bound-for, carried-from.
2. **The vocabulary law** (COSMOLOGY §2): every mythic term has a reveal
   tier. A term above the viewer's tier never appears on their surface —
   UI, cards, notifications, emails, empty states, *anything*. Tier-0
   verbs are small and concrete: **kindle, gather, walk, cross.** The words
   *Recollection*, *Silverway*, and *the Great Sowing* are earned, not
   shown. Public pages (permalinks, OG images, landing) are pre-arrival
   surfaces: **tier-0 only.**

---

## What you're building — the MVP surfaces

### S1 · Arrival — Act 0, "The Itch" (new)

Birth entry → the Sigil reading. The whole act is: the dark ring draws
itself, the natal marks light, tonight's crossing is named, and one strange
line lands — *"this mark is older than your name."* **Zero myth. Zero
cosmology.** No "discover the ancient wisdom of…" — the hook is
specificity, beauty, and one splinter of the uncanny. Birth entry must
handle: date only (no time) gracefully — the Sigil has an honest fallback
(Moon station without step, no facing).

### S2 · The Sigil ring — the share artifact (new; the growth engine)

An SVG ring: 28 arcs (the road), each with 4 segment ticks (the Steps);
natal marks bright; kindled segments lit; everything else dark. It is the
share artifact **at every stage** — a newborn ring must already be worth
posting, and a walked ring must read as a wheel of light. Aesthetics are
yours; the geometry is the spec (engineering renders it from `sigil.js`;
you art-direct the renderer's output — strokes, glow, foil states, the
natal-mark glyphs).

Share render: **1080×1920 (9:16) primary**, 1:1 or 4:5 secondary crop.
Design it as a full-bleed screenshot, not a download: no chrome in frame,
one element legible at ~100px thumbnail, the user's name on it (naming
converts "a screenshot" into "my artifact"). Reference points that still
hold: Receiptify's receipt, Instafest's poster — dense but parseable
because the layout is a real-world object. Ours is: **a star chart being
hand-lit.**

### S3 · The Sounding — the nightly screen (five beats)

The core loop, ~90 seconds, once a night. Five beats (spec: REBOOT.md §3 +
COSMOLOGY §3.5): the station card → the cast (steady / turning /
threshold — tonight's texture) → the counsel → the question → **the claim,
which kindles**. Beat 5 shows the traveler's own ring segment lighting —
**never a counter incrementing, never a number going up.** Close: *"that's
tonight's road. walk it well."* Live return-countdown to the next crossing
when the window is closed.

### S4 · The codex — album that becomes an autobiography (new)

Where collected paragraphs and myth fragments file themselves. Milestone
reveals are **quiet**: no fanfare screens, no modal celebrations — a new
page simply *is* there, as if it always had been. Two structural
requirements: (a) every page template **reserves a second text block**
below the main text — the "undertext" slot, hidden at launch (a later
feature reveals faint text beneath already-read pages; the slot must exist
in the template now so pages don't reflow later); (b) fragment pages can
render in *any* order — sequencing is per-user, driven by their chart.

### S5 · Card faces — the 28 stations (spec carried forward, still binding)

- **Epithet large** (Baloo 2) — the card's identity ("The Void"). Stations
  are always "The ___".
- **Kanji corner glyph** (虛宿) · the station's **real asterism** as the
  constellation mark (star data: `research/mansions-table.json`).
- **Four cultural names small along the base** — Arabic · Sanskrit ·
  Chinese · Japanese — with the match-quality flag (STRONG / PARTIAL /
  DIVERGENT) as a subtle mark, never hidden.
- **Art direction: star-seed interstellar, in card context** — the station
  as a seed of light; the cultures live in the type layer, not the
  illustration style. The Void and The Ghost should look like cards people
  fight over.
- Foil states exist **only for real sky events**; foil accent is
  butter-200 (pink-500 fails contrast — `DESIGN-SYSTEM.md`).
- **Fushigi Yūgi is grimoire trivia only** — never display names, never
  imagery.

### S6 · Station permalinks + OG — the public front door

The 28 static pages exist and regenerate from tooling (`/mansions/*.html` —
regenerate, don't hand-edit). Yours: the landing treatment that leads with
"what's tonight's station?" and points at them, and the **main-site OG
image** (still missing): 1200×630, card context, wordmark, a station card,
legible in a feed. Meta tags are static HTML — scrapers don't run JS —
so you carry them through every export. Tier-0 vocabulary everywhere here.

### S7 · Emails

Design-system tokens apply end-to-end. Same vocabulary law: an email never
uses a word above the recipient's tier. Notification copy counts UP
("nights walked"), never down, and is opt-in (off by default for minors).

## What stays exactly as it is

- **The intro animation** and **the runner minigame** — the two things that
  survived the reboot with their inspiration intact. Do not redesign them;
  do link to the runner from wherever feels like a hidden door rather than
  a menu item (it's an easter egg now).
- **The grimoire's credits posture** — each tradition named and sourced,
  scholarship not religious guidance. This framing is deliberate; it
  survives the overhaul.
- **The honesty** — real astronomy, stated plainly; the Porphyry fallback
  above 66° latitude needs to be sayable in the UI; the sidereal caveat
  ships in the grimoire.

## What's retired

The draggable multi-window desktop as the product frame · the four-shard
flip flow (its contents — houses, archetype, mansion, weekday — are
absorbed into the Sigil's natal parts) · the guestbook · `player.exe` and
the rest of the desktop apps (their spirits may return later as easter
eggs; not MVP).

---

## The four laws (from BLUEPRINT §6 — every screen must pass all four)

1. **Vocabulary law** — tiers, as above.
2. **Register law** — physics/philosophy content is curriculum, never
   engine. If a screen's copy ever says "because quantum," it's wrong.
3. **Ethics floor** — count UP · live return-countdowns · ~24h windows +
   grace · no paid pulls, no currency, no odds theater ("the sky is the
   drop table") · notifications opt-in, off by default for minors.
4. **Privacy & respect** — birth data never leaves the browser (there is no
   "creating your account…" spinner on the reading; it computes locally and
   the UI should feel that fast). Coined words on all surfaces; real
   traditions credited in the glossary.

**Accessibility carries forward with more force in a from-scratch build:**
semantic HTML with landmarks and heading order, visible focus, 44px tap
targets, contrast per `DESIGN-SYSTEM.md` (button labels are teal-900, never
white). You are no longer styling `<div>` soup — don't create new soup.

---

## The seam — how a from-scratch export merges cleanly

The two-agent contract survives the overhaul; the binding *inventory*
doesn't. Read `OWNERSHIP.md` + `BINDINGS.md`, then:

**You own:** the markup + `<helmet>` of the `.dc.html` export ·
`.image-slots.state.json` · the `CARD` block (`card.js`) · the `LAYOUT`
block (`windows.js`).

**You must not touch or import:** `astro.js` · `sky.js` · `sigil.js` ·
`deck.js` · `events.js` · `astronomy-engine.js` · `format.js` · `tz.js` ·
`api.js` · `wheel.js` · `reading.js` · `shards.js` · `duet.js` ·
`starshard-api/**` · `test/**` · `tools/**` · machine-generated
`support.js` / `image-slot.js`. **Never reference engine modules from an
export — not even a sibling `import()`.** This shipped a stale crash four
separate times pre-reboot. Mocks get hardcoded placeholder strings;
engineering wires the real values on merge.

**The one rule, updated for a fresh build:** markup binds to names that
JavaScript supplies — a renamed binding renders literal `{{ thatName }}`
to the user. Since the markup is new, the binding inventory will be new
too. Convention: **namespace per surface** — `sig.*` (arrival + ring),
`snd.*` (Sounding), `cdx.*` (codex), `crd.*` (cards) — with auth and
`deck` shared unprefixed as before. Build against placeholder values, and
ship a **binding manifest** in your handoff notes: every `{{ name }}` you
used, per surface, with one line on what it should contain. Engineering
rewires the script block to your manifest and `npm run bindings` verifies
the match on receipt.

## Handing back — the checklist

1. The binding manifest (every binding, per surface, one line each)
2. Whether you changed the `CARD` or `LAYOUT` blocks
3. Confirm the meta tags / OG survived in the `<helmet>`
4. Confirm the export imports **no** engine modules
5. Which surfaces are in this export and which are still to come

Engineering runs `npm run bindings` + a browser smoke test of the full
night loop on every receipt. Both exist to catch handoff breakage before it
ships — they're your safety net, not your adversary.