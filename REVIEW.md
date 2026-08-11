# Review — Claude Design export + website architecture

August 11, 2026 · reviewed against commit `0f5c43a` plus the uncommitted working tree

---

## Verdict up front

**The repo is healthy and the two-agent split is working.** I re-ran everything:

| | |
|---|---|
| `npm run bindings` | ✓ 349 bindings, 140 top-level, none missing |
| `npm test` | ✓ 12/12, including the 3,000-chart no-regression run |
| `node test/smoke.mjs` | ✓ full reading flow renders, 16 degrees all valid |

The best evidence the split is holding is commit `bd42ec2`, where Claude Code
noticed that a design handoff had *silently dropped the password-reset flow*,
and re-applied it on top of the new structure rather than shrugging. That is
exactly the failure mode the boundary exists to catch, and it got caught.

**But there is a loaded gun sitting in the repo root** (§1.1), one shipped
feature that is done-but-broken (§2.1), and one open operational risk that is
larger than any of the code issues (§2.4).

---

## 1. The Claude Design export

`Star Shard Astrology Website (1)/` — untracked, 3.4MB, four `.dc.html` pages.

### 1.1 🔴 It contains stale copies of Claude Code's files

This is the important finding. The export ships its own `astro.js`,
`shards.js` and `duet.js` — all three are **Code-owned files**, and all three
are stale:

| File | In export | In repo | |
|---|---|---|---|
| `astro.js` | 4,692 b | 7,591 b | **byte-identical to the pre-refactor original** |
| `shards.js` | 9,591 b | 12,231 b | missing the whole combinatorial reading library |
| `duet.js` | 3,919 b | 4,617 b | missing `DUET_OPENERS` / `DUET_CLOSERS` |

I verified the export's `astro.js` against `git show 64c1de1:astro.js` — it is
an exact match. That means it still has:

- the weekday computed from the UT-shifted instant (**26% of users get the wrong
  birth day**)
- `ascendant()` returning the Descendant above the polar circle
- no Porphyry fallback, so six houses stay unreachable at high latitude

And the export's `Star Shard v2.dc.html`:

- imports **3 modules** (`astro`, `shards`, `duet`) instead of the current **10**
- still contains the inline `degFmt` with `Math.round((lon % 1) * 60)` and no
  carry — the `12°60′` bug, on 12.5% of charts

**Copying this folder into the repo wholesale silently reverts all four bug
fixes and the entire modular extraction.** Git would show it as a normal file
change, not a conflict.

**Do:**
1. Delete `astro.js`, `shards.js`, `duet.js` and `Star Shard v2.dc.html` from the
   export folder now, before anything gets copied by muscle memory.
2. Move what you keep out of the repo root — an untracked directory whose name
   ends in `(1)` sitting next to the real files is asking for it. `design/incoming/`
   with a `.gitignore` entry is enough.
3. Add a line to `DESIGN-BRIEF.md`'s handoff checklist: **do not include
   `astro.js`, `shards.js`, `duet.js`, or any file listed under "what you must
   not touch" in the export.** Design is copying them because they're siblings
   its pages `import()`; it needs telling explicitly.

The `github.md` sync note shows Design *knows* it's behind — *"this project's
copy of `Star Shard v2.dc.html` is stale against it."* Good self-awareness; the
export just doesn't act on it.

### 1.2 ✅ Phone Flow — strong work, and it's a comp, not a page

`Star Shard - Phone Flow.dc.html`. This is a genuinely good answer to P1, and it
hits things I flagged and things I didn't:

- One screen per step, full-bleed, action anchored at the bottom
- **48×48px tap targets** on the back button and the checkbox row — up from 20×17
- Leads with **"what's your mansion?"** and a `28 LUNAR MANSIONS` eyebrow — that's
  P4 folded into P1, which is the right call
- **"i don't know my birth time"** with exactly the honest copy W12 asked for:
  *"we'll skip your rising sign and houses rather than guess them, and read the
  sun, moon and mansion instead"*
- Surfaces the privacy claim on the landing screen: *"your birth data never
  leaves this phone"*
- A `shattering the sky / COMPUTING PLACIDUS CUSPS` interstitial

**But it is a mockup, not an implementation.** `<meta name="design_doc_mode"
content="canvas">`, a 414×868 phone bezel with a notch, and 19 top-level
bindings (`isLanding`, `isForm`, `timeKnown`, `toggleTime`, `advance`, `goBack`,
`revealCount`, `s.flip`…) that **do not exist in `renderVals()`**.

That's fine and normal — but it needs saying out loud, because a file called
"Phone Flow" in a folder called "Website" reads as shippable. Building the real
responsive page from this comp is a Claude Code task of a couple of days, and
it will need ~19 new bindings, which per the contract means Design should have
flagged them in the handoff notes. It didn't.

### 1.3 ✅ Tarot & Journey — correct format, right idea

`1080×1920`, confirmed in the markup. Mansion-as-Major-Arcana, rare/foil
variant, card back, **a thumbnail legibility test**, and a five-stage spread
progression. That is P2 and P4 done properly, and the thumbnail test in
particular is the detail most people skip.

Also a canvas comp — only 2 bindings (`mansionName`, `userName`). To ship it,
`card.js`'s `CARD` block changes from 720×1000 to 1080×1920 and the drawing
code gets the new layout. `card.js` was built to make that a config change.

### 1.4 ⚠️ Shard Runner — nobody asked for this

`Shard Runner.dc.html`, 418 lines of real logic, `requestAnimationFrame`, jump
mechanics, `localStorage` high score. Notably it is **not** a canvas comp — it's
a working endless-runner game.

It's not in the brief's P1–P5 and it isn't in Design's own screen map in
`github.md`. It may be a delightful easter egg for `player.exe`-adjacent
territory, or it may be a couple of hours that should have gone into the phone
flow. Worth an explicit keep/park decision rather than letting it sit in a
folder.

---

## 2. Code review

### 2.1 🔴 W8 is shipped, and the OG image makes it not work

The tags are complete and correct — `og:title`, `og:description`, `og:image`,
`og:url`, `og:type`, `twitter:card`, the lot. Then:

```
og:image:width  = 240
og:image:height = 360
```

`og-image.png` really is **240×360** — a portrait crop of a Rin cosplay photo,
no wordmark, no indication of what the link is.

The universal standard is **1200×630**. Facebook's floor is 200×200, so this
won't be *rejected* — it'll render as a small thumbnail instead of a large card.
LinkedIn requires 1200×627 for the large card and downgrades anything smaller.
X's `summary_large_image` is built around 1200×628. So every platform shows the
small-card treatment, which is roughly the outcome of having no image at all —
except worse, because **Facebook caches scraped OG data for weeks**, so the bad
card has a tail even after you fix it.

`OWNERSHIP.md` already calls it "a 240×360 placeholder," so Code knew. The
problem is that the commit log reads `Add title, meta description, and OG/Twitter
card tags (W8)` and nothing marks the feature as non-functional. Either produce
1200×630 art now (Design's lane), or pull `og:image` until it exists — a missing
image is a cleaner state than a cached bad one.

### 2.2 🟠 Password reset token travels in the query string

```js
const resetUrl = `${APP_URL}/?resetToken=${token}`;
```

Query strings land in browser history, `Referer` headers on any outbound link
from that page, and server access logs. The token is a 30-minute password-change
credential.

Use a **fragment** (`/#resetToken=`) instead — fragments are never sent to the
server and don't appear in logs or `Referer`. The front end reads it client-side
either way, so this is a one-character change plus the reader.

Everything else about this flow is well built: SHA-256 hashed at rest,
`crypto.randomBytes(32)`, 30-minute expiry, single-use via `used_at`, and
`forgot-password` returns 204 unconditionally so it doesn't leak which emails
exist.

### 2.3 🟠 A reset doesn't invalidate the user's *other* outstanding reset tokens

`reset-password` marks only the token it consumed:

```js
await pool.execute('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);
```

If an attacker triggers a reset for someone's email and the real user then
resets their own password, **the attacker's token stays valid for the rest of
its 30 minutes** and can be used to set a new password immediately after.

Fix: `UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL`.

While there: nothing ever deletes expired rows, so the table grows forever.

### 2.4 🔴 The guestbook is an unmoderated public write endpoint

`POST /api/guestbook` takes a name and a 280-char message from anyone, with no
auth, and the only control is 5 posts/hour/IP. There is **no delete route, no
report mechanism, no admin path, and no moderation queue** — once something is
in, the only way it comes out is direct database access.

This is pointed at an audience of ~13M monthly impressions of which **25% are
13–17**. The `AUDIT.md` research is blunt about this: Yesterweb and Cohost were
both killed by moderation load, not by design problems. An open message board is
the single highest-ongoing-cost thing in this codebase and it went in as a
side-effect of fixing W11.

Input validation itself is fine — stamps are checked against a fixed set, length
is capped, the React-based runtime escapes text bindings, and the SQL is
parameterised. The gap is operational, not injectable.

**Minimum before this is public:** a `DELETE /api/guestbook/:id` behind auth, an
IP or hash column on `guestbook_entries` so a spammer's posts can be removed as
a set, and a decision about who reads the queue. Consider making entries
require an account — you already have one, and it converts anonymous abuse into
something with a cost.

### 2.5 🟡 The "weaving" state is now dead — and Design built a screen for it

`reading.js`'s `weave()` is synchronous now (correctly — the LLM path is gone).
But the component still does:

```js
this.setState({ weaving: true });
const text = await this.reading.weave({...});   // resolves same tick
this.setState({ weaving: false, weaveText: text });
```

React batches both, so `weaveLabel: 'weaving… ✦ ✦ ✦'` never paints. Meanwhile
the Phone Flow comp has a dedicated `shattering the sky / COMPUTING PLACIDUS
CUSPS` interstitial for exactly this beat.

Two coherent options, one incoherent one (current): either delete the `weaving`
state, or give the reveal a deliberate ~600–900ms so the anticipation Design
designed actually happens. For the emotional peak of the product I'd keep the
beat.

### 2.6 🟡 `deploy.sh` doesn't ship the runtime

```
FRONTEND_FILES="api.js astro.js card.js format.js reading.js tz.js wheel.js
                windows.js duet.js shards.js og-image.png"
```

The page loads `./support.js` and `./image-slot.js` via `<script src>`. Neither
is in the list. They're presumably already on the NAS from a manual copy, so
today it works — but a fresh deploy, a new host, or a dc-runtime upgrade
produces a page of raw `{{ mustaches }}` with no obvious cause. Add both.

### 2.7 🟡 Seeded guestbook entries will age

`guestEntries: entries.length ? entries : duetMod.GUESTBOOK_SEED` — the three
fake entries still show whenever the table is empty, dated `2026.08.07`–`.09`.
Seeding an empty state is defensible; hard-coded dates that drift further into
the past every week are not. Either make the dates relative or drop the seed
once the table has real content.

### 2.8 ✅ W2 resolved well

The LLM path is gone and the replacement is better than what it replaced:
**864 paragraph shapes** (6 openers × 6 mids × 4 mansion lines × 6 closers)
crossed with 12 houses × 12 archetypes × 28 mansions × 7 weekdays ≈ **24.4
million distinct readings**, assembled deterministically via an FNV-1a seeded
pick so the same birth data always produces the same paragraph. The comment
explaining why — *"this is a collectible, not a dice roll"* — is the right
instinct.

### 2.9 ✅ Session revocation (W16a)

`token_version` on `users`, bumped on logout and on password reset, checked in
both `requireAuth` and `/api/me`. A captured JWT actually stops working now.
Schema has it as `INT NOT NULL DEFAULT 0`, so existing rows won't spuriously
fail the comparison. Correct.

The deliberate decision to leave signup's `email_taken` enumeration in place is
documented in `OWNERSHIP.md` with its reasoning and its mitigation. That's the
right way to leave a known tradeoff.

---

## 3. Architecture

### 3.1 The split is holding — protect it at the source

`bd42ec2` is the proof: a design handoff dropped a feature, Code caught it,
re-applied it, and verified end-to-end against the live deploy. That is the
system working.

The one structural leak is §1.1 — Design exports copies of Code-owned files
because its pages `import()` them as siblings. The durable fix isn't vigilance
at merge time, it's removing the reason: either have Design's canvas comps stop
importing the real modules (they barely use them — Phone Flow and Tarot import
nothing), or give Design a frozen read-only stub directory that is obviously not
the real thing.

### 3.2 Four pages, no routing story

The repo now implies a multi-page site — v2, phone flow, tarot, runner — but:

- `deploy.sh` ships exactly one page, as `index.html`
- no page links to any other page (the only `href` in v2 is Google Fonts)
- there's no router, no nav, no URL scheme

That's fine while they're comps. It stops being fine the moment the phone flow
ships, because then you need a real decision: **one responsive page, or separate
entry points?** My recommendation is one page with a breakpoint — the audit's
P4 work (28 mansion permalinks with their own OG images) needs real URLs anyway,
and running two page templates against one binding contract doubles the surface
Design can break.

That decision should be made before the phone flow gets built, not after.

### 3.3 The module boundary is doing its job

Ten modules, clean edges, `api.js` is still the only thing calling `fetch()`,
and the privacy invariant holds — birth date, time and coordinates are still
computed in-browser and never sent to the backend. The new `forgotPassword` /
`resetPassword` / `loadGuestbook` / `postGuestbook` calls all went into `api.js`
where they belong, with matching error-copy helpers. Nothing leaked into the
markup.

`BINDINGS.md` grew 336 → 349 as the password-reset and guestbook UI landed, and
the check still passes, which means the contract survived a real feature.

---

## 4. What I'd do next, in order

1. **Gut the export folder** (§1.1) before it gets copied. Five minutes.
2. **Fix or pull the OG image** (§2.1) — every week it's live is a week of
   cached bad cards.
3. **Guestbook moderation path** (§2.4) before any real traffic arrives.
4. **Reset token → fragment, and invalidate sibling tokens** (§2.2, §2.3).
5. **Decide: one responsive page or several** (§3.2) — this gates the phone flow.
6. **Add `support.js` / `image-slot.js` to `deploy.sh`** (§2.6). Two minutes.
7. **Keep or park Shard Runner** (§1.4).
8. Then build the phone flow from the comp, and move the card to 1080×1920.

---

## Sources

[Open Graph image size reference, 2026](https://imagedimensions.com/guides/open-graph-image-size) ·
[OG image sizes per platform](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2026-guide) ·
[OpenGraph image sizes cheat sheet](https://env.dev/guides/opengraph-image-sizes)

Repo state verified locally: `npm run bindings`, `npm test` (12/12),
`node test/smoke.mjs` in headless Chromium, and `git show 64c1de1:astro.js`
diffed against the export copy.
