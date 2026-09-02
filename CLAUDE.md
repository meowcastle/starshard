# CLAUDE.md — Star Shard

Read this before touching anything. It is short on purpose.

## What this is (post-reboot)

**Star Shard is a divination game played against the real sky.** The user's
birth minute computes their **Sigil** — a dark ring of 28 arcs with bright
natal marks; their personal Star Shard. Each night the Moon stands in one of
28 stations on the **Moonroad**; visiting kindles one segment of the user's
own ring and files a relational paragraph into their codex. The story is
revealed through play, never told up front. Single page, no framework of our
own, no build step. The reference docs, in reading order: `BLUEPRINT.html`
(the system map) → `COSMOLOGY.md` (canon + formal system + data model) →
`SIGIL-READING.md` (the arrival grammar). For the current build, not
`DESIGN-BRIEF.md` v2 — it's superseded piecemeal and left as historical
record: `UX-FLOW.md` (the arrival screens, replacing its §S1) →
`PRODUCT.md` (everything after arrival: the Deep Chart, the daily/weekly)
→ `PLATFORM.md` (web vs. app, decided) → `DESIGN-HANDOFF.md` (the actual
packet sent to Claude Design) → `WRITING.md` (the house style).

It is a standalone astrology product — **not** tied to a creator's
brand (that pivot is on the record, Aug 13). Audience assumptions that
still hold: phone-first, skews female, a meaningful share aged 13–17.
Positioning is **astrology app first, game mechanics as the retention
layer** — see `PLATFORM.md`.

The **front end was rebuilt from scratch** against this reboot; the engine
modules and the database carried forward. The old four-shard flip flow
(houses / archetype / mansion / weekday) is retired; its computations live
on inside the Sigil. Status (updated 18 Aug): `Star Shard v4.dc.html`
is the "calm pass" Design export, fully re-wired to the real
engine/corpus/combos/findings pipeline (same pattern `Star Shard
v3.dc.html` used: Design's markup, Code's script). **`Star Shard
v3.dc.html` is retired** — per Justin's call ("v3 is outdated and not
needed anymore"), it stays in the repo as historical reference only,
same as `Star Shard v2 (archived).dc.html`, and is not deployed.
`ios-frame.jsx` (repo root, copied from the Build Plan folder) is a real
runtime dependency of v4's markup — the device-frame wrapper Design's
export uses — not decoration; it ships in `FRONTEND_FILES` alongside the
engine modules.

**URL layout on staging (restructured 24 Aug 2026, Justin's call):**
Manzil is now the site root (`staging.starshard.net/`) — `deploy.sh`
ships the live Manzil file directly as `index.html`, no path rewriting
needed since its own script tags are already root-relative
(`./support.js`, bare `ephemeris2.js`/`manzil-art2.js`, both now also
listed in `FRONTEND_FILES`). **CANON FLIP (27 Aug 2026, Justin's
call):** the deployed file is now `Star Shard v3 Build Plan/Manzil -
Game Prototype V1.dc.html` — a from-scratch rewrite with a new 28-card
slate (no tie cascade, a tied count is a draw, four passive quadrant
grants, new storage keys `manzil-v2-*` with no migration from the old
`manzil-ed-*` keys). `Manzil - The Empty District.dc.html`, the file
this doc described as canon through 26 Aug, is retired the same way
`Star Shard v3.dc.html` and `Manzil - Prototype.dc.html` are: stays in
the repo as historical reference only, not deployed. Current design
docs for the live file: `docs/handoffs/CARDS-27AUG.md` (the 28-card
spec) and `docs/handoffs/MECHANICS-27AUG.md` (the rules) — both
superseded the moment a newer-dated handoff arrives, same as any other
`docs/handoffs/*` file. Verified 27 Aug: the same "owner-relative
signature" bug class from the Empty District's card-mechanics rebase
(hardcoded `"you"`/`"sky"` literals instead of the actual acting seat)
showed up again in the rewrite — duel hands weren't actually symmetric
despite the code's own comment saying they should be, and the heart's
and throne's tap abilities were seat-hardcoded — fixed in `_cards()`,
`_heartAt`/`_commitHeart`, and the board's tap handler.

**CANON FLIP (29 Aug 2026, Justin's call): "Manzil - Game Prototype
V2.dc.html" replaces V1 as the deployed file.** V2 is Design's own
work, built in parallel with Code's V1 fixes as "a working copy of V1"
carrying a UI overhaul — Karla replaces Varela Round, an avatar/
player-chip system, "the 28 avatars" systems pass (its own dated
history lives in the copy of `CLAUDE.md` Design ships alongside their
exports, not this file). It forked from an early V1 snapshot and
inherited none of the fixes below except gaze depth and the defender
tie rule, which Design built directly into V2 itself. Before this flip,
every other V1 fix was hand-ported into V2 and independently verified
(script syntax, `data-props` JSON, and each fix's own marker checked
by hand, not just trusted from the porting pass): the account gate,
the rotate-to-landscape prompt, the on-station name-offset fix
(`top:74px`), `_simpleMove`-routed ability text (V2 had already
rebuilt this independently and correctly — nothing to port there),
the dominion-tutorial fix (`_tonight()`'s practice/tutor pin +
`_demoScript()`, ported verbatim since V2 uses the identical 28-card
sheet), seat-symmetric duel/tap handling, the age-check, real
server-side logout, the mobile info-panel touch-hold fix, the
walker-5-through-8 best-of-three tally fix, and the mansion's
three-lives fix (V2 had full lives infrastructure already but the
same pre-lives-system gap in its mansion-loss branch V1 had). Suzaku's
grant bug (below) exists in V2 too, untouched — still unresolved, not
part of this port. `tools/deploy.sh`'s `deploy_frontend` now ships V2
as `index.html`; V1 stays in the repo as historical reference only,
same as `Manzil - The Empty District.dc.html`, `Manzil -
Prototype.dc.html`, and `Star Shard v3.dc.html` before it. **The
canonical engine port below (`research/manzil-engine-current.cjs`)
was extracted from V1's inline script, not V2's** — the structural
fixes are now aligned across both files, but V2's own game-logic
mechanics (card resolution, abilities) have not been independently
diffed against the canonical module since the flip; treat the module
as V1-sourced until that's checked, not automatically V2-accurate.

**V2's second export, same day, was pure new Design work — nothing to
reject this time.** A UI-overhaul pass landed on top of the first
export: the three lives are now drawn as the moon's last three nights
of light (full/crescent/sliver, darkening in that order) rather than
lanterns, with a "the moon is dark tonight" veil beat on the third
loss (`nmBeat` state, 2.6s) instead of an instant wipe; walker rosters
are now per-mansion data (`_rosters()`/`_rosterFor()`, mansion 18's
own eight kiln-and-rain-themed walkers added, `_wAlias()` borrowing
posture/voice/gesture from the district's eight until a mansion draws
its own); mansion 25 (the hideaway) got its own avatar art and joined
the "walk" road-kind set. Applied on top of the already-ported V1
fixes (both together, verified: syntax, `data-props` JSON, all fix
markers).

**The heart's law (Form C) is implemented and CORRECTED against
Design's own measurement engine (29 Aug 2026,
`WORKORDER-HEART-LAW-CORRECTED-29AUG.md` +
`THE-HEART-LAW-29AUG.md` + `research/v2.js`/`heartvec.js`, delivered
in `manzil-reference-29aug.zip` after the first pass shipped ahead of
receiving them).** The first pass (below the line) got two things
wrong that the corrected order and its own reference engine caught:
it gated the law on `roadBoss` (boss board only) when the measured,
shipped form is **whole-night scope** — a property of tonight's road,
firing on every battle under it, walkers and the mansion match alike
(measured safe across the full walker caution range, deltas inside
±2.4) — and it ported an onward "vectored" chain that belongs to
Form B, the board-wide law the measurement memo explicitly rejects
(triples blowouts, turns Byakko into an army); Form C **does not
chain** — the only chain that can still occur is a winning card's own
ability (mars/turning/suzaku's reach) firing as it normally would,
which needs no special-casing. Both fixed in V2 (`_lawAt`, the
`_resolve()` hooks, the `avG` station-0 glow and the walker-night
intro note extended off `roadBoss`-only per the corrected order's UI
addition) and the canonical engine (`lawAt`/`LAW_AT`, `resolve()`'s
matching hooks). Mechanic, unchanged by the correction: the moment the
ninth card lodges (before the count), station 0 strikes station 1
once more, right face against left, bigger-or-equal takes it, every
deny rule applies. The "saturn's lock"/"byakko's ground" wording
question is resolved: the corrected order's "there is no Saturn card
in this build" refers to Design's own from-scratch measurement engine
(`research/v2.js`, 28-mansion cards only) — this repo's canonical
engine and the live V2 build both genuinely carry a Saturn planet card
(`ab:"saturn"`) alongside the byakko quadrant grant, both real
ground-lock deny rules gated through the same `shielded()`/tC checks,
so the self-check using Saturn is accurate for this codebase, just not
attributable to the work order's own list. Verified: the canonical
engine's self-checks were rewritten to match (fires on a walker board,
not just a boss board; does NOT chain onward; deny rules still hold)
and all 35 pass; Design's own bundled acceptance suites (`v2vec.js`
37/37, `gvec.js` 16/16, `heartvec.js` 13/13 including the four `beatAt`
vectors that gate this specific port) all pass against their own
`v2.js` reference; and the work order's own hard requirement — "the
evaluator must see the law: play one crafted board twice, law on and
law off, same seed and hands, the move sequences must differ" — was
independently checked against this codebase's `bestMove()` (not just
`resolve()`'s mechanical application) and confirmed: sequences diverge
starting at the second move, not just the board-filling one, so the
AI is planning around the incoming beat, not merely resolving it after
the fact. The original worked-hand example ("void 9/3 vs. a lodged
7") that the first pass couldn't reproduce is now known to be
superseded prose — Design's own shipped acceptance vectors (`heartvec`
10-13) test the identical mechanic with plain dummy numbers instead
(9 vs. 6, no void, no aura interaction), so that open question is
closed, not just unresolved. `suzvec.js`, also in the same delivery,
covers two rival replacement candidates for Suzaku's still-broken
grant ("again" vs. "reach") but ships no verdict/decision doc ("no
numbers until these pass" — it's mid-research, not a decided spec);
left untouched, same as before, pending an actual call from Design.

**A second, unrelated "heart's law" was found and removed the next
day (30 Aug 2026, user: "is the heart mansion +2+2 element still
happening? can you check and remove it").** V2 (and V1, still
historical reference only) carried a pre-existing, informal mansion-18
mechanic in `_faceOf()` that predates the whole Form A/B/C measurement
process above: a turn-based +1/-1 swing to every card's face value on
mansion 18's own night, doubled to +2/-2 on the boss board specifically
(`_bossRule() === "rains"`, "the rains break at the summit and the
beat doubles"). This is exactly the category of board-wide combat
arithmetic the measurement memo (`THE-HEART-LAW-29AUG.md`) measured as
Form A and rejected outright (inverts skill on fresh boards, re-prices
all four quadrants by up to 37 points) — it was never removed when
Form C shipped in its place, so both were live simultaneously: every
board on mansion 18 was silently skewed by this on top of whatever
Form C's own measured numbers assumed, undocumented and unmeasured.
Removed from `_faceOf()`, its "the heart's law" tag in `_whyHere()`'s
tooltip explanation, and the now-dead `"rains"` entry in `_bossRule()`'s
map (nothing else read it). Verified: `esbuild` syntax check and
`data-props` JSON both clean, no leftover `"rains"`/`b18` references,
deployed to staging and confirmed live. Not touched in the canonical
engine (`research/manzil-engine-current.cjs`) — it never carried this,
since it's a fresh Form-C-only reimplementation, not a full mechanical
port of V1's `_faceOf()`.

*(Below: the first-pass note, preserved for the record rather than
deleted, since it documents what shipped briefly before the
correction above landed the same day.)* Boss boards only, mansion 18:
the moment the ninth card lodges (before the count), station 0 strikes
station 1 once more — right face against left, bigger-or-equal takes
it, every existing deny rule applies (storm's no-tie, the gate's
shield, byakko's ground, saturn's lock) because it's implemented as a
genuine extra entry in `_resolve()`'s own strike queue, not a
separate mechanism — and a taken station 1 carries the beat onward to
station 2 the same "vectored" way mars/turning/suzaku already chain,
tagged via a `lawBeat` flag so it doesn't depend on the winning card's
own abilities. Structured as `_lawAt(m)` (a per-mansion map, `{18:
"beat"}` today) exactly per the work order's own template, so the
other 27 mansions' station laws are additions, not rewrites. Ported
into both V2 (`_lawAt`, the `_resolve()` hooks) and the canonical
engine (`lawAt`/`LAW_AT`, `resolve()`'s matching hooks, plus a new
`roadBoss`/`tonight` pair on `mkGame()` that didn't exist before this
— `g.tonight` was referenced by `moveKey()` but never actually settable
via `mkGame(cfg)` until now).

**Two more station laws shipped client-side and are now ported into the
canonical engine (30 Aug 2026, `docs/handoffs/WORKORDER-LAWS-AND-THRONE-30AUG.md`
+ `WORKORDER-THRONE-LAW-30AUG.md` + `THE-TENTS-LAW-SHIPPED-30AUG.md`).**
Design's "v3 pack" landed a UI-overhaul-plus-mechanics export of V2
(replacing the previous V2.dc.html; a plain `diff` against the
pre-existing copy confirmed no engine-module imports snuck in, per the
receipt protocol) carrying the throne level (mansion 10) and two more
per-mansion laws, `_bossRule()`/`_lawSt()` gating on the same whole-night
scope as the heart's law (`road && !practice && !duel`, fires for every
board tonight, not just the boss board):
- **Mansion 25, "shell" (station 4, the hideaway):** the Genbu quadrant
  grant ("the empty shell") moved to a fixed place instead of a specific
  card's grant — whatever lodges on station 4 counts normally until it
  is ever taken (`s.by !== s.owner`, reusing the exact same field/test
  the Genbu grant's own shell check already uses), after which it counts
  for nobody, either side, for the rest of the board. Station 4, not 0:
  on mansion 25's own night the client slides the whole nine-station
  road window back four (`_boardM(i) = ((t-1+i-4+28)%28)+1`), so her own
  ground stands mid-road rather than at the door — the same treatment
  the well-rope (mansion 28) already gets. The canonical engine does
  **not** model that road-window slide at all (a road-mode/theater-layer
  concept explicitly out of scope per this file's own header note), so
  the port simply hardcodes `station: 4` as the law's home rather than
  deriving it — correct for the law itself, silent on the window slide.
- **Mansion 10, "reach" (station 0, the throne):** a card lodging on
  station 0 also strikes two stations away, crossing an empty middle,
  side-neutral, using its PRINTED pool faces at the far station (a
  boon'd/blazed/leveled live face does not carry two stations — a pumped
  near-strike face and a plain far-strike face on the SAME lodge is the
  intended asymmetry, not a bug). The client fires this at lodge time
  only; the work order flags that a strike merely *originating* from
  station 0 by some other cause (a heart fill-strike, a follower answer,
  a return re-arm) does not reach client-side, and calls the reference
  engine "the truth" if the acceptance vectors ever require the wider
  form. Checked rather than assumed: the three shipped `reach` vectors
  in Design's `wardvec.js` test the mechanic in isolation (direct
  strikes, not `resolve()`'s full lodge/re-arm/chain machinery) and
  don't actually pin that timing question down either way, so the port
  matches the client's documented lodge-time-only scope rather than
  guessing past what's tested.

Both ported into `research/manzil-engine-current.cjs`'s `LAW_AT` (now
`{18:{kind:"beat",station:0}, 25:{kind:"shell",station:4},
10:{kind:"reach",station:0}}`, an object shape replacing the old bare-
string map so a station can differ from a mansion's own index),
`tryFlip()` (new optional `printed` param, reads the attacking card's
raw `g.C[id].l/r` instead of `faceOf()`), and `slotW()` (the shell check,
sitting right beside the pre-existing Genbu-grant shell check it
literally reuses the field of). Eight new self-check vectors added
alongside the existing heart's-law ones (untaken/taken/neighbour-
unaffected/wrong-night for the shell; two-station-carry/side-neutral/
printed-not-live/wrong-night for the reach) — all pass, 43/43 total
(`node research/manzil-engine-current.cjs`). `npm test` (193/193) and
`npm run bindings` (which only ever targeted `Star Shard v4.dc.html`,
untouched by this) both still pass clean. No `FRONTEND_FILES`/
`deploy.sh` changes needed: the throne level's assets are inline in the
`.dc.html` itself, and the shared JS trio (`support.js`, `ephemeris2.js`,
`manzil-art2.js`) that ships alongside it came through this delivery
byte-identical to what's already deployed.

**The same Design export bundle also contained older, regressed copies
of `Star Shard v4.dc.html` and `Star Shard - Account Portal.dc.html`
(30 Aug 2026) — deliberately NOT applied.** Both diffed smaller than the
live repo copies and were missing real, later Code work (the account
portal's real `_castFive`/error-message wiring and `<title>`/OG tags;
v4's month/day/year onboarding selects) — almost certainly stale
snapshots swept into a whole-workspace zip export rather than an actual
handoff for those two files, since nothing in the accompanying work
order mentions either page. Left untouched. If a future Design delivery
zip ever bundles everything in their workspace again, diff every file
against the live repo copy before applying anything, same as this pass
did — don't assume "it was in the zip" means "it's the intended update."

**V2's own onboarding got a real, decided rebuild in this same delivery
— and it silently dropped the real account system, caught and re-ported
the same day (30 Aug 2026).** Design replaced Manzil's old external-
redirect account gate (`await api.me()`, `window.location.href =
"./account/"` for anyone unauthenticated) with a full cast/signup/signin
flow built INTO V2 itself: `arrive → birth` (a five-question "the sky
asks" cast that doubles as the signup form) `→ shard` (the sun/moon
archetype reveal) `→ walkers → tut5`, replacing the old legend/door
screens entirely (dated comments in the file cite specific user picks —
"2b" for the question-at-a-time cast layout, "the account-portal layout"
for the field style — from a concept-options deck Design shipped the
same day, `Manzil - Onboarding Directions.dc.html`, itself superseded by
this actual build). This is a real, good UX call — no more jarring
redirect to a separate page — but the fresh build's own wiring was
**entirely local**: no `fetch`, no `this.api`, no `/api/` calls anywhere,
credentials compared against a password mirrored in `localStorage`, no
age question at all. It silently deleted the real account requirement
this repo spent the 24 Aug PM handoff establishing (the two-tier privacy
model, the server-side age gate, `manzil_pack`) — AND it deleted a fix
from that same morning: commit `f8689f7` ("Escape opens the lobby menu,
with a log out option") had just wired a second real-logout entry point
into V2's player-chip menu; the fresh export's equivalent menu code
existed (Design correctly carried the escape-opens-lobby-menu UI and the
logout button forward) but called nothing but local `setState` — the
actual `api.logout()` call was gone. Caught only because the user asked
"does this include the new login page" a second time after an
insufficiently thorough first check (that first pass only diffed for
stray engine-module imports, the receipt protocol's own item 4 — it
never checked whether a fresh export had silently dropped Code-side
wiring the previous export had, which is exactly the category of bug
the 29 Aug canon flip's whole "port every V1 fix into V2" exercise
existed to catch). Re-ported same day: `componentDidMount` is now
`async`, awaits `api.me()`, and skips a signed-in visitor straight past
`arrive`/`birth`/`signin` into the lobby (pulling `getManzilPack()` if no
local cache exists) — same behavior as the old redirect gate, no
redirect. `birthCastTap`/`_castNow` now calls the real `api.ageCheck()`
then `api.signup()` before ever writing local state (local `_saveBirth()`
stays as a device-side cache afterward, not the source of truth). `_siGo`
now calls the real `api.loginWithUsername()`, and — a correctness fix
beyond just "add the missing call" — unconditionally overwrites the
local birth cache from the server's real pack on every sign-in (the old
mock's `if (!this._birth())` gate would have let a second account
signing in on the same device inherit the first account's chart).
`pmLogout`/`pauseLogoutTap` now actually call `api.logout()` before
landing on `arrive`, keeping Design's own in-page-not-redirect decision.
The busy-label gap flagged the same day was closed within the hour (user:
"can you grab spinner from the old one") — `bCastLabel`/`siLabel` ("…"
while `st.busy`, ported from the Account Portal's own `st.busy ? "…" :`
pattern) plus `pointer-events:none` while busy, one small markup change
(`{{ bCastLabel }}`/`{{ siLabel }}` swapped in for the two buttons' static
text) alongside the renderVals fields, verified the same way. Verified
throughout: `esbuild --loader=jsx` on the extracted script block and the
`data-props` JSON both clean, `npm run check` (193/193) untouched.

**The same-day regression turned out to be much bigger than the account
gate alone — seven more Code-side fixes were silently reverted, found
and re-ported the same day (30 Aug 2026, user: "does the mobile turn
screen thing exist in this mock up" → "make sure the mobile behaves the
same way it did before").** Checking the rotate-prompt question by hand
against the fresh export vs. the pre-export git copy surfaced a pattern:
this export reads as having been built from an older baseline again, the
same failure mode as the 29 Aug canon flip ("V2 forked from an early V1
snapshot and inherited none of the fixes"), just recurring on a same-day
re-export rather than a separate one. A full sweep against every fix that
29 Aug flip ported found SEVEN more missing, all re-ported and verified
(`esbuild`, `data-props` JSON, `npm run check` 193/193, each individually
diffed against the pre-export copy to confirm the fix, not just its
absence, is what changed):
- **The rotate-to-landscape prompt** — `rotateOn` (`w < h && w < 700`),
  the `⟳` overlay, and its own `orientationchange` listener (iOS Safari
  doesn't reliably fire plain `resize` on a rotation).
- **The mobile info-panel touch-hold behavior** — `onTouchEnd`/
  `onTouchCancel` had been rewired to call `onPeekEnd` (desktop
  mouseleave's handler, which also clears `state.peek`) instead of a
  dedicated `onHoldEnd` (clears only the pending timer) — so on a phone
  the info panel flashed open and vanished the instant a finger lifted,
  never actually readable. Split back apart, both the board-slot and
  hand-card markup and their two `renderVals` sites.
- **The on-station card name offset** — back to the pre-fix `top:52px`
  (inside the L1/L2 art box's own 27–69px vertical range, so the name
  overlapped the art); restored to `top:74px`.
- **`_zoomFor`'s ability-text panel** — carrying its own separate,
  substantively WRONG 28-entry copy again (e.g. its "gate" read "it
  lodges before her lead, takes the first turn" — a turn-order mechanic
  that doesn't exist — while the real gate, per `_simpleMove()` and the
  engine's own `tryFlip()`, is "the first strike against it misses").
  Routed back through `_simpleMove(cid)` for card ids 1–28; the five sky
  planets (not in that table) keep their own text alongside it.
- **The dominion-tutorial pin** — `_tonight()` had lost its `if
  (st.practice && st.tutor) return 18;` line, so a returning player's
  last-walked moon position silently changed which nine mansions the
  practice walk's hand-choreographed `_demoScript()` was actually playing
  against, breaking the dominion (home-mansion) teaching moment the
  tutorial exists to land.
- **The walker 5–8 best-of-three tally** — `_advanceRound()` had lost its
  `sameRung` parameter entirely (back to a single-caller shape), so a WON
  board at walker rung 5+ silently reset `roundWins` to `[]` and re-dealt
  a fresh "round 1" instead of continuing the match; the mid-match re-deal
  of the correct walker's hand (`this._seven(this._walkers()[st.roadRung
  ].hand, ...)`) was gone too, not just the flag.
- **The mansion's three lives** — a mansion loss (`st.road &&
  st.roadBoss`) had reverted to a bare `phase: "roadlost"` with no life
  decrement and no third-loss wipe at all, the exact pre-lives-system gap
  the 28 Aug fix closed, reading as the same "one light left" message
  forever regardless of how many times the mansion was actually lost.

**Standing checklist created so this stops being a one-off catch each
time: `docs/MANZIL-CODE-OWNED-BEHAVIORS.md`**, covering all eight items
above (account gate included) with the specific code shape each one
should have. Wired into the receipt protocol below (item 6) as binding
for both agents — Design should consult it before finalizing any future
full-file regeneration of this page, Code before applying one. This is
deliberately narrower than "every bug ever fixed in Manzil": it's
specifically the set of fixes that live in the shared script block and
are easy to lose in a full regeneration, not anything Design visibly
redesigned on purpose.

**V1's engine has one canonical standalone port (28 Aug 2026).** The
real Manzil engine lives inline in V1's own `<script type="text/x-dc">`
block (~178 `_`-prefixed methods reading `this.state`/`this.props`
directly — required by the runtime constraint against top-level
`import` in that block). Nothing else in the repo should be treated as
"the current engine": `starshard-api/lib/manzil-engine.js` +
`manzil-lobby.js` are real, deployed Socket.io PvP infra, but orphaned
— V1 has no PvP/socket wiring, so nothing connects them to what
players actually play, and their `tieRule` still defaults to the
pre-27-Aug `"you"`, not V1's `"a draw"`. An external ML platform was
found defaulting to a stale `research/manzil-engine-v7-tiebreak.js`
snapshot for sims; that file and its siblings (`v6.js`, `v2.js`,
`ref-*.js`, `tapvec.js`) are deleted for that reason — they predated
the 27 Aug rewrite. `research/manzil-engine-current.cjs` is the
replacement: a manual, point-in-time, documented-scope port of V1's
inline logic into a plain `require()`-able module (its header lists
exactly what's deliberately not ported — road-mode's per-mansion
special grounds, the build/currency system, the walker-ladder meta —
progression/UI layers, not the board mechanic). It is **not**
live-synced — if Manzil's rules change in the `.dc.html` again, this
file goes stale until someone re-ports it by hand; diff it against the
`.dc.html` before trusting a long-running sim. Point any future
external simulation work at this file, not at the server lib.

**Two external-sim proposals are built into the canonical engine but
NOT yet in V1's live `.dc.html` (28 Aug 2026, pt. 1 and pt. 2 — both
pending a Design handoff to port).** Pt. 1: `tieRule` now defaults to
`"the defender"` (a level board goes to whoever did NOT lead it,
replacing the flat `"a draw"` still live in the `.dc.html`), plus
`playMatch()` — best-of-three walkers / best-of-five mansion, loser
leads the next board. Independently re-verified on this engine, not
just trusted from the report: single-board seat advantage measured
20.0 points under a flat draw vs. 6.9 under `"the defender"`; match-level
numbers (5.6/2.54 boards walker, 6.4/4.17 boards mansion) landed close
to the report's own (5.4/2.57, 3.8/4.24). Pt. 2's original ladder
mechanism (deck-scale only, `ladderScale()`/`DEPTH_TABLE`/
`ladderLevels()`) is **superseded by pt. 3, same day** — see below;
those three functions no longer exist in the canonical engine.

**Pt. 3 (28 Aug 2026, also pending a Design handoff): the difficulty
ladder is now "always a mirror deck, opponent search DEPTH does the
work," not deck-scaling.** This is a real reversal, not a refinement —
the external report itself retracted its pt. 2 recommendation
("the opposite of what I recommended this morning") after finding that
weakening the opponent's deck means something completely different at
different collection depths (worth 1 point to a fresh player, 28 to a
deep one). This independently confirms what this engine's own
re-simulation of pt. 2 found from the other direction (see the old
paragraph, preserved above): no deck-scale-only formula could hit the
claimed clear rates for deep collections. Both point the same way.
`playPush()` is unchanged in shape (three lives, the shortened road,
same `cfg.playerLevels` input) but now builds the opponent via
`handicapFor()`/`handicapLevels()` (a full mirror of the player's real
levels, with a shrinking fraction of the player's own AWAKE cards
knocked to level 1 — 3/4 at 0-8 awake down to 0/"a true mirror" at
22-28) and `depthsFor()` (the opponent's search depth per road stage,
0 at the low end up to 8 at the mansion for a maxed collection). The
search itself is new: `searchMove()` is a genuine negamax + alpha-beta
game-tree search (`playBoardSearch()`/`playMatchSearch()` use it in
place of `playBoard()`/`playMatch()`'s `pickMove()` heuristic) — full
exhaustive search at depth 8 from an opening board measured ~88.5s for
ONE move decision, intractable at any scale, so `BEAM` (10) caps how
many candidates get recursed into per ply; this cut a depth-8 root
decision to ~2.9s and a full board to ~3.6s. **That per-board cost is
still a real, unresolved product constraint** — this is server/Node
timing, and V1 runs the same kind of search, Babel-transpiled, on a
single browser thread; a multi-second freeze on the mansion's board is
not shippable as-is without either a lower depth cap, a tighter beam,
web-worker offloading, or some other mitigation Design/Code need to
decide on before this reaches the live game — flag this plainly, don't
let it get lost under the calibration question. On calibration itself:
re-verified against `research/manzil-depth-check.cjs` (the report's
own "opponent thinking depth, mirror deck" table, ~25 matches/cell,
~15 minutes to run) — results landed within roughly 3-16 points of the
report's own numbers at every cell, which is within the ~10-point
standard error a sample that size implies, unlike pt. 2's ~80-point,
sample-size-can't-explain-it miss.

**Pt. 4 (28 Aug 2026, same day): "depth" was a naming mistake, not a
tree search — corrected, and the performance wall from pt. 3 is gone.**
The external report clarified that "opponent thinking depth" was
always meant as a MULTIPLIER on one ply of lookahead (the opponent's
single best reply, scored once), never a recursion-depth ply count —
"depth: 8" means "look one move ahead and weight the reply eight
times," not "search eight moves deep." `bestMove()`/`replyCost()`/
`moveKey()` in the canonical engine are a verbatim port of the
report's own reference functions; the parameter is renamed `caution`
throughout (`CAUTION_BANDS`/`cautionsFor()`, replacing
`DEPTH_BANDS`/`depthsFor()`) so the mistake can't recur by rereading
old comments. `playPush()` now calls `playBoardWeighted()`/
`playMatchWeighted()` (built on `bestMove()`), not the negamax —
**`searchMove()`/`playBoardSearch()`/`playMatchSearch()`/`BEAM` are
KEPT, not deleted, but explicitly NOT shipped**: a real tree search is
a plausibly stronger and better-feeling opponent (the report's
suggestion: reserve it for the mansion alone, a deliberately slower
"obviously thinking" final boss), but every pt. 3 difficulty number
was measured against the one-ply evaluator, not the search, so the
search needs its own calibration pass before it goes anywhere near
`playPush()`. Performance is no longer a concern either way: the
one-ply evaluator ran the self-check suite in ~1s (down from ~41s) and
a 2,000-push validation batch (500/tier x 4 tiers) in ~5.5 minutes.
Re-validated against `research/manzil-push-check.cjs` at real sample
size (500/tier, not the old 20): clear rates now land
**monotonically decreasing** with collection depth — 46.2% / 45.4% /
35.0% / 16.8%, against the report's 61.7% / 37% / 22% / 11.9% — a
real, directionally-correct curve for the first time (the old
negamax-based numbers were essentially inverted, ~7-11% for deep
collections against a claimed ~90%). Gaps are now 5-15 points, not
80+; read this as "close, not exact" — worth another look if the road
plays noticeably easier at 9-14 awake than the report expects (that
tier's the flattest relative to its neighbor in this engine's numbers).

**The 2 Sep 2026 delivery: three more levels and laws (the turning m12, the
root m19, the chamber m26), `_horizon()`, and the first delivery that
needed nothing re-ported.** Design shipped a clean `send-to-code/` folder
(WHATS-NEW.md + WHATS-NEW-01SEP.md + two memos + a work order + the file),
carrying two undelivered rounds at once: the 1 Sep road-seam/pacing pass
(nothing auto-advances, the walker-defeat beat, `_roundDwell`/`_armRound`,
the mansion intro on the climbed road, `_advanceRound`'s `k >= 8` branch)
and the 2 Sep levels. Verified by measurement, not by trust: 231 methods
against the deployed file's 226, **zero Code methods missing**, 52
differing bodies all named in Design's own contested-method tables, one
documented `renderVals` key removed (`pipsInPlate`, template consumer
gone with it), and every one of the fourteen items on
`docs/MANZIL-CODE-OWNED-BEHAVIORS.md` present. Adopted whole. Three Code
corrections went in on top of it:

1. **The root's law was shipping measurement's REJECTED form.** The
   delivered `_shielded` line tested `t.by` alone, with a comment claiming
   "an opening lodge has no `by`" — but `_lodge` writes `by: own` on every
   card it places and its own comment says `by` never changes hands (it
   exists so a captured tortoise can't be called home by its captor). So
   the condition was truthy for every occupied slot: unconditional denial
   at station 4, which is `plantAt`/1a — the form measured at +20.2 fresh
   seat and spread +37.6, that the work order says must never ship.
   `plantOnTake` never fired at all. Corrected to `t.by && t.by !== t.owner`,
   the same has-it-changed-hands test the shell law and the genbu grant
   already use in `_slotW`; `rtRootStyle`'s `rooted` tell had the identical
   fault and the identical fix. **Lesson for the next law that gates on a
   slot field: check what actually writes the field before trusting the
   comment beside the read.**
2. **The 1 Sep SVG console-error sweep didn't close — and the wrong advice
   was Code's.** `NOTE-TO-DESIGN-01SEP.md` told Design "`path.d` bindings
   are fine"; they are not, a mustache in `d` is as invalid to the
   pre-hydration SVG parse as one in `rect x`. The 66 errors became 39
   (`{{ bz.d }}`) rather than zero. Fixed by moving the brazier box inside
   the `<g style="{{ bz.gs }}">` that already wrapped its two flame circles
   and giving it the static `d="M-4 4h8v12h-8Z"` (absolute corner
   `(x-4, y-4)` is local `(-4, 4)` against that translate — no visual
   change). **The standing rule, corrected: a bound geometry attribute is
   never safe. Use a `style` transform on a wrapping `<g>` with the element
   at 0,0, or a static attribute.**
3. Design's own `mw`/`ms` shadowing flag closed — the two scene-local `mw`s
   renamed `rpMw`/`gdMw` so `renderVals`' board-wins `mw` is unambiguous.

**All nine station laws are now ported into
`research/manzil-engine-current.cjs` — including three that had been
client-only since they shipped.** `LAW_AT` had three entries (beat/shell/
reach) against the client's six, so the rope (m28), the drum (m23) and the
hush (m21) had never reached the module; those three went in alongside this
delivery's turn (m12, `resolve()` before the near-strike push), plant (m19,
`shielded()`) and guest (m26). `LAW_AT` is now nine entries matching
`_bossRule`/`_lawSt` exactly. 25 new acceptance vectors, **68/68 pass**.
Three notes that matter for anyone simulating against it:
- **`guest` strips all four quadrant grants** per the delivery's own engine
  -conformance note — byakko in `shielded`, genbu in `slotW`, suzaku at the
  lodge push, seiryuu by refusing the `rev` choice in `lodge` (mercury keeps
  its intrinsic `twoFaced`: a signature, not a grant). **The client strips
  byakko alone**, which Design scoped deliberately, so this is a KNOWN
  divergence on three grants, not drift. `research/gueststrip.js` was named
  as the acceptance but did not ship with the delivery.
- **The drum's law carries TWICE, not once** — `to === reson || from === reson`
  means a strike landing on the station carries to the next, and that strike
  originates at the station so it carries once more; the third hop touches
  neither end and stops. A vector pins that floor. Same in the client;
  flagged to Measurement in case two carries is not what was measured.
- **Suzaku's grant was realigned with the client's 31 Aug staging-audit fix
  while porting.** The module still had the pre-fix form: struck from the
  VICTIM's slot, only after a near strike had landed, no `printed` flag. Now
  lodge-time, from the granted card's own position, printed faces, both
  directions. **Any sim run against this module before 2 Sep under-counted
  the bird.**

The engine still does not model `_boardOff`'s road-window slide (out of
scope by its own header), so m19/21/23/25/28's law stations are hardcoded
at their index rather than derived — correct for the laws, silent on the
window. **The server lib (`starshard-api/lib/manzil-engine.js`/
`manzil-lobby.js`) is untouched and still diverges in two named ways: it
passes `tieRule: 'a draw'` (not "the defender"), and it assigns board one's
leader by coin flip then ALTERNATES each round, where the single-player
road is loser-leads.** Both are real, both are on the record now
(`docs/NOTE-TO-DESIGN-02SEP.md` §4), neither is fixed.

`test/fuzz-manzil.mjs` covers all nine built levels cold now, up from six.

**Same day, evening: Design's `_pathG` sweep closed the SVG-parse class for
good, and it is the cleanest delivery this project has had.** They took the
fresh deployed copy as-is (not a merge) and built on it, so all three of the
2 Sep Code fixes came back intact. Measured: **232 methods against 231, zero
Code methods missing, exactly three differing bodies** (`_tintArt`, `_markRow`,
`renderVals`) — precisely what their note named. `_pathG(list)` is now the one
place a shape array becomes markup (an injected `<g>`), `_tintArt` returns that
group rather than an array so all eleven art sites converted with no producer
edits, and 26 template sites are gone. **Verified rather than trusted: zero raw
geometry-attribute bindings left on any shape element.** Their note claims "zero
console errors"; measured, it is **37 to 10**. The last ten are
`<svg viewBox="{{ …artBox }}">` across nine art-wrapper sites — the same root
cause in an attribute neither sweep looked at (both only checked shape elements,
and so did our own static check). Left for Design: `_artBox` is not inlineable,
since `_measureArt()` computes a real per-card `getBBox()` at runtime and that
normalisation is what makes every card's art read at the same weight. The conversion that
could have silently dropped a visual — `shardLines` bound `opacity="{{ ln2.o }}"`
and `shardDots` used `.c` for fill, neither of which is in `_pathG`'s fixed
`d/f/s/w/da/st` vocabulary — was handled correctly (`.c` maps at the producer,
opacity moved into `st:"opacity:…"`, which is the same property).

**One trap this exposed in our own harness, now fixed.** `test/fuzz-manzil.mjs`
scanned `page.content()` for literal mustaches, and `page.content()` serializes
the `<script type="text/x-dc">` block — which is SOURCE, not rendered DOM. Design's
own comment explaining `_pathG` quotes the binding it replaced (``as the old
`fill="{{ p.f }}"` binding did``), so the harness failed **every level** on a
comment. The scan now strips that block first. **A mustache "failure" from this
harness is not automatically a rendering bug — check whether it is only a comment
in the script block before chasing it.**

**The guide's law (m27) is a work order only — nothing ported, `LAW_AT` correctly
stays at nine.** 1a ("the stranger's station": at the guide's station, a card
whose quarter is not that ground's quarter counts one more, both sides) is
unbuilt and unmeasured. When it lands it is a `slotW()` change, not a `resolve()`
one. 1c ("the wall") is deliberately in the drawer, and its rationale records a
real standing gap worth remembering: **the throne's reach and suzaku's grant both
carry two stations and nothing in the game currently answers them.**

Star Shard v4 moved off the
root to `/star-shard/` — `star-shard/index.html` is a hand-maintained
copy of `Star Shard v4.dc.html` with every root-relative reference
(`support.js`, the 13 dynamic engine imports, `ios-frame.jsx`,
`four-skies.dc.html`) rewritten to `../`; there is no build step
regenerating it, keep it in sync by hand on every v4 edit. The account
gate lives at `/account/` (unchanged). `manzil/` (the subdirectory) now
holds only the reference docs — the rules sheet and user's manual, plus
the old non-live `ephemeris.js`/`manzil-art.js` pair they still load —
the game itself no longer lives there; visiting the bare `/manzil/`
path 403s (no index file), the doc pages themselves are still reachable
by their exact filenames.

v4's known gaps against the export, all deliberate scope calls made when
it was ported (not oversights): the per-planet/angle detail cards show
real position/house/mansion facts only, not invented interpretive prose
(no composer exists for that); the "in your life" lifetime-rarity line
was dropped entirely (no engine computes it — the single biggest
still-unbuilt piece per `SHARD-MODEL.md`'s own innovation claim); the
onboarding form is wired best-effort against its own free-text date/
place fields (loose `Date` parsing, first geocode match, no manual-
coordinate fallback — the markup has no fields for one); Manzil's
"the covered well" door is forced off (`gameNightOn: false` unconditionally)
since Manzil itself is still WIP.

Beyond the arrival/Sounding pipeline, the live page now also carries: the
**shard blueprint** (`sigStep: 'shard'` — sun-mansion × moon-mansion as
the natal-chart-as-object, per `CHART-BUILDER.md`/`SHARD-MODEL.md`:
the combination reading from the 784-cell corpus, two mansion portraits,
a `findings.js`/`rates.js`-driven signature card, the farlight), the
**chart wheel** (real natal positions for all ten planets + angles,
`transits.js`'s `natalPlanetPositions()`/`fullNatalAspects()`), and a
**motion layer** (ring morph on tab switch, the kindle sweep+flare on
claim). `transits.js` is fully wired now — the "not yet wired into
reading.js or the page" note from the reboot is stale; see Architecture
below. See `docs/archive/STATUS.md` for the day-by-day trail through
Aug 13; `RESUME-784.md` and `GENERATION.md` for the corpus pass since.

**Receipt protocol, for the next Claude Design export** (binding —
confirmed useful by the one real export received so far, with two of its
own predictions corrected below):

1. **Diff it against the current markup, not the archived v2 page.**
2. **The export's script block is disposable mock wiring.** Rebuild the
   `x-dc` block thin — state + lifecycle + `renderVals()` — wired to real
   modules. Any hardcoded sample text in the export is placeholder by
   contract (Design is instructed never to import engine modules).
3. ~~Expect namespaced bindings (`sig.*`/`snd.*`/`cdx.*`/`crd.*`) and a
   binding manifest.~~ **Corrected by experience:** the one real export
   received (`Star Shard v3 Build Plan/Star Shard v3.dc.html`, then
   `v4.dc.html`) used flat, unprefixed, ad-hoc mock state instead (`sel`,
   `selM`, `cd`, `ob*`, `acct*`) and shipped no binding manifest. Don't
   wait for one — run `npm run bindings` to inventory the export's own
   bindings, map each to a real module by hand, and **flag anything
   unmappable, do not guess.**
4. Verify no engine imports snuck into the export. ~~And that the
   `<helmet>` meta/OG tags survived.~~ **Corrected by experience:** the
   real exports received so far ship with fonts only in `<helmet>` — no
   `<title>`, no OG/meta at all. Don't assume they'll be there to
   "survive" — the live page's own `<title>`/OG tags have to be
   preserved by hand during the merge, every time.
5. Reconcile against the live page's own bindings (`BINDINGS.md`) rather
   than assuming a wholesale replacement is needed — port screen by
   screen, the way the chart wheel went in from `v3.dc.html`. `v4.dc.html`
   is next in line; its funnel/onboarding/shard screens carry two
   assumptions (email magic-link auth, a web-side IAP gate) that need
   Justin's call before porting — see Open decisions.
6. **For Manzil (`Manzil - Game Prototype V2.dc.html`) specifically:
   `docs/MANZIL-CODE-OWNED-BEHAVIORS.md` is a standing checklist of
   Code-side behaviors that live in the shared script block and have now
   been silently dropped by a fresh full-file export TWICE (29 Aug's
   canon-flip port, then again 30 Aug the same day the throne level and
   two new mansion laws shipped — the real account system, the rotate
   prompt, the mobile touch-hold behavior, the on-station name offset,
   `_zoomFor`'s stale ability-text duplicate, the dominion-tutorial pin,
   the walker 5–8 tally, and the mansion's three lives all had to be
   re-ported the second time too). Run through that checklist item by
   item on every future Manzil export before treating it as ready to
   ship — a clean `npm run check` and no stray engine imports are NOT
   sufficient signals here, since every one of those regressions passed
   both. Design: consult this file before finalizing a full regeneration
   of this page, the same way you'd check it wasn't accidentally
   reverting a screen you already redesigned on purpose.**
7. **The delivery shape itself is now specified:
   `docs/DESIGN-DELIVERY-PROTOCOL.md`** (31 Aug 2026). Deliveries have
   arrived as whole-workspace zips (297MB, 26 top-level `.dc.html`s) in
   which stale copies of live files sit indistinguishable from current
   ones — the Aug 30 one cost eight fixes, and the Aug 31 one would have
   reverted a full day of work (PvP, the staging-audit fixes, real
   logout) if applied wholesale. **Two traps that doc records, both
   confirmed by hand:** `send-to-code/` is NOT automatically the safe
   path — as of 31 Aug it still shipped the retired V1, not the deployed
   V2 — and genuinely new work can ride in on an otherwise-stale file
   (the 31 Aug sound pass existed only inside that stale top-level V2).
   So a delivery can be neither accepted nor rejected wholesale: diff
   every included file against the live repo copy, port what's actually
   new onto the current file, and never replace a live file with a
   delivered one unless the diff proves it's strictly ahead. The doc
   also states what Design should ship instead (one folder, changed
   files only, a required `WHATS-NEW.md`).
8. **The inventory Design works from: `docs/FOR-DESIGN-WHAT-CODE-OWNS.md`**
   (31 Aug 2026). Measured, not remembered: the 14 methods that exist only
   on Code's side, the **33 methods both agents edit** (the real risk
   zone — `renderVals`, `constructor`, `_cards`, `_resolve`, `_finish`
   and friends), the server surface Design has no counterpart for, and a
   decision guide for when a Design change ports cleanly vs. when Design
   should ask for a fresh copy of the deployed file first. **Re-measure
   and update this doc whenever Code adds a method to the shared script
   block** — a stale inventory is the same failure mode as the stale
   SOURCE OF TRUTH line that caused all of this (Design's own CLAUDE.md
   named V1 as canon for two days after the flip to V2, which is why
   `send-to-code/` kept shipping the retired file).

**Then, the app wrapper** (`PLATFORM.md` — decided Aug 13). Ships to the
App Store as a **Capacitor wrapper around the existing web build, not a
rewrite**. It must add native value beyond a web clipping or Apple
rejects it under guideline 4.2.2:

1. **Native push** — the whole reason. iOS web push only reaches users
   who manually added to home screen (~10–15× smaller audience), and the
   nightly loop depends on the reminder.
2. **Native IAP** for the one-time unlock, with **server-side
   entitlement** — a localStorage flag is forgeable, and Safari evicts
   it under storage pressure.
3. **Offline caching** of the Deep Chart — it never changes, so it's the
   ideal offline artifact.
4. Icon, splash, home-screen presence, safe-area handling.

The web build stays live and free: the shareable chart, the
Reddit-linkable demo, and the 28 station permalinks (an SEO asset we
already own). One account, entitlement on both.

Explicitly deferred (on the record, Justin's call): more easter eggs,
community features, the Remembering endgame, paradox cards, Undertext
rendering, event-foil curriculum, the Full Reading's page surface
(`reading.js`'s `fullReading()` is built and tested; nothing renders it
yet — no spec says where it lives in the UI), the daily/weekly generative
pipeline itself (`transits.js` — the engine piece it needs — is built and
tested per PRODUCT.md §11.1, but the LLM prompt/moderation/storage pipeline
around it has open decisions per PRODUCT.md §12b — which model, where it
runs — that aren't Code's to make silently).

**Minigames are no longer flatly deferred** — Design has a locked v2
ruleset for a minigame ("Manzil": road-building solitaire against the
moon's 28-station walk) with a working prototype
(`Star Shard v3 Build Plan/Manzil - Prototype.dc.html`), separate from
the road-shards (its wins award a distinct "game-shard" set; the 28
never become skill-gated, per the ethics floor below). This is stale —
Code has since built a real Socket.io matchmaking lobby + PvP validator
(`starshard-api/lib/manzil-lobby.js`/`manzil-engine.js`) for
`Star Shard v3 Build Plan/Manzil - The Empty District.dc.html`, which
deploys **directly as the site root** (`index.html`) as of the 24 Aug
2026 restructure — see "URL layout on staging" above; there is no
longer a separate `manzil/index.html` deploy copy for the game. And, as
of 24 Aug 2026, **Manzil requires
the same account as Star Shard to play at all** — enforced server-side by
both `/api/auth/signup` (age gate, `manzil_pack` write) and the lobby
rejecting any socket without a valid session cookie. The account UI itself
does **not** live inside Manzil's own file — a dedicated portal page,
`Star Shard - Account Portal.dc.html` (deployed to `/account/`), owns the
whole cast → age-check → account → sign-in flow, and hands off into Manzil
via a `#tutorial`/`#legend` URL hash (Design's own routing mechanism,
consumed once in `_deckState()` via `history.replaceState`). Manzil's job
shrinks to: redirect to `/account/` when `api.me()` comes back empty, and
show its own richer tut5/pintro/tut7 reveal the first time an authenticated
account with no local pack cache arrives. Sign-in is by **username**, not
email (`POST /api/auth/login` accepts either). See the Privacy invariant
below for the two-tier data split this all sits on top of. Star Shard
itself stays account-optional, unchanged. Its own rules doc (`Manzil -
Rules & Cards.dc.html`)
still describes an earlier, superseded ruleset (banking/points, a
112-card deck) rather than the locked one — read the locked description
in the Build Plan's own `CLAUDE.md`, not the rules file, until that's
reconciled.

## The one thing that will break this repo

**Two agents work here: Claude Design and Claude Code. They must never edit the
same file in the same cycle.** A Claude Design handoff *replaces* the
`.dc.html` page — it does not merge it, and git will not warn you.

You (Claude Code) own everything except the markup:

| Yours | Claude Design's | Generated — never edit |
|---|---|---|
| `astro.js` `sky.js` `sigil.js` `transits.js` `deck.js` `events.js` `astronomy-engine.js` `format.js` `tz.js` `api.js` `reading.js` `findings.js` `rates.js` `starshard-api/**` `test/**` `tools/**` | `*.dc.html` markup + `<helmet>` | `support.js` `stations.js` `reading-copy.js` `combos.js` |

`stations.js`/`reading-copy.js`/`combos.js`/`mansion-depth.js` regenerate
from source (`research/mansions-table.json` + `tools/build-mansions.mjs`;
`research/corpus-*.md` + `tools/build-reading-copy.mjs`;
`research/combos.json` + `tools/build-combos.mjs`;
`research/mansions-table.json` again + `tools/build-mansion-depth.mjs`) —
hand-editing the output is exactly the stale-export failure mode below,
aimed at yourself. **Corrected (18 Aug, verified by hand rather than
trusted from an earlier note):** `mansion-depth.js` is not dead code or
an abandoned orphan — it's a real, current, generated artifact, same
tier as the others. It's genuinely unwired (no `.dc.html` page imports
it, and it's absent from `tools/deploy.sh` on purpose, not by oversight)
because nothing consumes it yet: `reading.js`'s DEPTH tab
(`depthReading()`) uses `stations.js`'s plainer per-station data instead,
and `mansion-depth.js` is a richer, per-tradition-match-flagged
alternative shape sitting ready for whenever that tab wants it. It's
also not an ES module like its siblings — it sets `window.MANSION_DEPTH`
via a plain `<script>` tag, not `export`/`import` — so wiring it in means
a `<script src>` tag, not a dynamic `import()`.

**Shared seam:** the `<script type="text/x-dc">` block at the bottom of the
`.dc.html`. Keep it thin — state, lifecycle, and `renderVals()` only. Full table
and workflow rules in `OWNERSHIP.md`.

## Architecture

```
Star Shard v4.dc.html
  ├─ markup            Claude Design-sourced (the "calm pass" export,
  │                    ported per the receipt protocol below). Static
  │                    per-example prose in the export (the combination
  │                    reading, mansion portraits, tonight's reading) was
  │                    converted to real `{{ bindings }}` in place — same
  │                    DOM/CSS, real data. `Star Shard v3.dc.html` is
  │                    retired (see "Status" above), kept for reference.
  ├─ ios-frame.jsx     Design-sourced device-frame wrapper the markup's
  │                    `<x-import>` depends on — a real runtime file, not
  │                    a design reference; deployed alongside the engine.
  ├─ <helmet>          Claude Design owns the fonts/styles; title+OG/meta
  │                    are Code's to preserve by hand on every merge — real
  │                    exports so far don't carry them (see receipt protocol)
  └─ <script x-dc>     SHARED — state + lifecycle + renderVals(), nothing else
       │
       ├─ astro.js     ephemeris, houses, lunar mansion, weekday
       ├─ sigil.js     the Sigil: natal derivation, type, movingLight()/the
       │               Becoming, readingPlan(), SVG ring,
       │               fullNatalAspects() (the chart wheel's aspect grid)
       ├─ sky.js       daily engine: moon phase, tārābala, planetary hours,
       │               station+step+cast kinds
       ├─ deck.js      the collection game: claim windows, grace, returns —
       │               server-side claimability check for POST /api/recollection
       ├─ events.js    the event calendar: dated sky events, foil conditions
       ├─ astronomy-engine.js   vendored MIT build — FULL api (147 exports:
       │               Body, GeoVector, Ecliptic).
       ├─ transits.js  aspect geometry (classifyAspect()) +
       │               planetPositions()/natalContacts()/pickLiveTransit()
       │               (the daily's live transit, PRODUCT.md §7 — wired,
       │               not just built) + natalPlanetPositions() (natal
       │               Mercury-Pluto, since astro.js's chart object never
       │               carries them — shared by findings.js and the wheel)
       │               + weekTightestContact()/standingWeather() (the weekly)
       ├─ findings.js  the shard's ranker (CHART-BUILDER.md §3.1): seven
       │               candidate finding kinds, five implemented
       │               (colocation/pile/boundary/quiet/type/dissent are
       │               live; `seam` is a no-op pending the nakshatra
       │               alignment call below), scored rarity×prominence×tension
       ├─ rates.js     the measured-constants table findings.js scores
       │               against — refuses to emit a rarity for anything
       │               uniform-by-construction (mansion/step/archetype/weekday)
       ├─ format.js    degFmt, ordinal, place/birth lines
       ├─ tz.js        historical UTC offset + DST for a birth moment
       ├─ api.js       ALL network I/O
       ├─ reading.js   arrivalReading(), fullReading(), soundingReading(),
       │               weeklyReading(), patternAspects(), houseReading(),
       │               depthReading() — all real, all wired
       ├─ reading-copy.js   generated: STATION.* (the real arrival/Sounding
       │               corpus, PORT-SPEC.md) + MANSION.* (the shard
       │               blueprint's 28 portraits, CHART-BUILDER.md layer A) —
       │               tools/build-reading-copy.mjs from research/corpus-*.md
       ├─ combos.js    generated: the 784-cell sun-mansion×moon-mansion
       │               combination corpus (CHART-BUILDER.md layer B,
       │               GENERATION.md) — complete as of 18 Aug, gate-clean,
       │               NOT yet human-reviewed (GENERATION.md §5b) —
       │               tools/build-combos.mjs from research/combos.json
       └─ sigil-copy.js     placeholder prose — Sounding only; arrival is real

starshard-api/          Express 4 + MySQL: accounts, sigil, recollection

mansions/               generated: 28 static permalink pages + index + OG
                         images — tools/build-mansions.mjs regenerates it,
                         never hand-edit (see OWNERSHIP.md)
```

## Runtime constraints — these are not negotiable

1. **No top-level `import` in the script block.** The dc-runtime transpiles it
   with Babel presets `["react","typescript"]` — no module transform — and
   evaluates it inside `new Function(...)`. A static import is a syntax error.
   Modules load via `await import()` in `componentDidMount`; that is why
   `renderVals()` guards on `ready` and falls back to an inert state.
2. **`support.js` fetches React, ReactDOM and `@babel/standalone` from
   unpkg.com on every page load** — ~3.3MB before first paint, and the script
   block is transpiled in the browser. If unpkg is unreachable the page renders
   raw `{{ mustaches }}`. `tools/vendor.mjs` mirrors them locally for tests.
   Self-hosting them in production is an open improvement. `astronomy-engine.js`
   does not repeat this: it's vendored and committed (`tools/vendor-astronomy.mjs`
   regenerates it), not fetched from a CDN.
3. **Nothing outside `api.js` may call `fetch()`.**

## Invariants

- **Privacy — reversed 24 Aug 2026, on purpose, then refined the same
  evening.** This invariant used to read *"birth date, time and coordinates
  are computed in the browser and are never sent to our backend"*, and called
  that the product's strongest differentiating claim. **That rule is dead.**
  Manzil now requires an account to play and that account is Star Shard's.
  The 24 Aug morning pass had signup write full birth date/time/place into
  `birth_data`; a same-day follow-up handoff (24 Aug PM, "ask for birth data
  before the account, gate at 16 server-side, store five integers instead of
  a birth certificate") replaced that with a **two-tier model**, and this is
  the version that shipped:

  | | Manzil (free, the funnel) | Star Shard readings (opted in) |
  |---|---|---|
  | stores | `five` (the chart-owned mansions), `pack`, `birth_year` | full `birth_date`/`birth_time`/`place_name`/`lat`/`lon`/`tz` |
  | table | `manzil_pack` | `birth_data` |
  | written | at signup (`POST /api/auth/signup`) | only if the account separately asks for a reading (`PUT /api/me/birth`) |

  `_castFive()`'s entire dependency on the birth chart is five integers
  1-28, so `manzil_pack` is pseudonymisation, not anonymisation — `five` is
  still personal data under GDPR with export/erasure obligations, but a full
  dump of it is not a dump of birth certificates the way `birth_data` would
  be. Do not have Manzil signup write to `birth_data`, and do not assume a
  Manzil account has full birth data on file just because it exists — check
  which table you actually need. `OWNERSHIP.md`, `DESIGN-BRIEF.md` and
  `docs/archive/REVIEW.md` still carry the original pre-reversal phrasing and
  are wrong until edited.

  What replaces the old rule. These are the enforceable parts:

  1. **`api.js` is still the only thing that may call `fetch()`.** Unchanged,
     and it matters more now rather than less.
  2. **Store inputs, derive everything else — per tier.** `manzil_pack` holds
     Manzil's inputs (five/pack/birth_year); `birth_data` holds Star Shard's
     (the full birth facts). Neither should grow a column for anything
     downstream of those inputs. The *derived* sigil keeps its own table
     (COSMOLOGY §7). Do not add tables that cache readings, transits or
     interpretations — each one widens the deletion surface and buys nothing
     we can't recompute.
  3. **Deletion and export are obligations now, not courtesies.**
     `DELETE /api/me` and `GET /api/me/export` are what GDPR Art. 15/17 and App
     Store review 5.1.1(v) get satisfied by. Every new user-scoped table
     (`manzil_pack`, `manzil_reports`, `manzil_blocks` included) carries
     `ON DELETE CASCADE` to `users` *and* appears in the export. One without
     the other is a bug, not a follow-up. Export includes only rows where the
     account is the *actor* for reports/blocks (`reporter_user_id`/
     `blocker_user_id`), never rows where it's the target — exporting your
     own data must not leak who reported you.
  4. **The age gate is per-region now, 13 worldwide by default (30 Aug 2026,
     Justin's call, reversing the 24 Aug PM handoff §3 flat-16 decision).**
     `starshard-api/lib/age-gate.js`'s `minAgeForTz()` is the single source
     of truth: 13 everywhere except the GDPR/EEA member states that set a
     higher digital-consent age under Article 8 — 16 (Croatia, Germany,
     Hungary, Ireland, Luxembourg, Netherlands, Poland, Romania, Slovakia,
     Slovenia), 15 (Czech Republic, France, Greece), or 14 (Austria,
     Bulgaria, Cyprus, Italy, Lithuania, Spain); everything else, US/COPPA's
     13 included, falls through to the 13 floor. Sourced 30 Aug 2026 against
     a published EU/EEA comparison table — a point-in-time legal snapshot,
     not a live feed; a member state can move its own number, so revisit
     this table periodically rather than trusting it indefinitely. **Region
     detection is the client's resolved IANA time zone**
     (`Intl.DateTimeFormat().resolvedOptions().timeZone`), not real IP
     geolocation — there is no geo-IP service anywhere in this stack (no
     Cloudflare/CDN in front of the Synology box, see `tools/deploy.sh`),
     and adding one means a new paid/rate-limited dependency plus logging
     visitor IPs, which this repo has otherwise gone out of its way to
     avoid. This is a heuristic on the same trust footing as the birth date
     itself (a VPN or a changed clock defeats it trivially) — accepted,
     not an oversight, since the actual boundary was never the client
     anyway. `api.js`'s `ageCheck()`/`signup()` auto-detect and send `tz`
     unless a caller supplies its own; every existing call site (the
     Account Portal, Manzil's own onboarding below) got this for free with
     no markup changes. `POST /api/auth/age-check` computes age from a
     submitted date + `tz` and answers `{ok}` with **nothing persisted
     either way** — it's a reasonable-effort UX gate, not the enforcement.
     `POST /api/auth/signup` re-checks age itself, with its own `tz` read
     (never trusts the age-check call's), and is the actual boundary (403
     `too_young`); never trust that age-check was called first. The
     hardcoded "come back when you are sixteen" copy (`api.js`'s
     `AUTH_COPY.too_young`, and the Account Portal's own "young" phase
     text) no longer names a fixed age, since it's wrong for most callers
     now — both read "come back in a year or two" instead.
  5. **The surviving claim is "it explains itself", not "we never see it".**
     `PLATFORM.md` leads on explainability and buy-it-once; both survive intact.
     No product copy may say or imply that birth data stays in the browser.
- **No logic in the markup.** If you want a computation inside `{{ }}`, it goes
  in a module and comes back through `renderVals()`.
- **`astro.js` is verified, not vibes.** See below before you "improve" it.
- **The ethics floor** (COSMOLOGY §4.5): count UP, never down · live
  return-countdowns · ~24h windows + grace · no paid pulls, no currency ·
  foils only for real sky events · notifications opt-in, off by default for
  minors. These are load-bearing product decisions, not copy suggestions.
- **The vocabulary law** (COSMOLOGY §2/§5): mythic terms are tier-gated; the
  reveal-state tier controls which strings render. Build the gate into the
  template layer, not into per-surface if-statements.

## Verify before you commit

```bash
npm run check      # regenerate BINDINGS.md + fail on mismatch, then run tests
npm test           # degFmt, weekday, cusps, ascendant, no-regression + NEW sigil/step tests
npm run bindings   # fails if the markup binds a name renderVals() omits

# browser smoke test — drives the whole flow and asserts on the result
npm i -D playwright && npx playwright install chromium
node test/smoke.mjs
# offline / CI:
npm i react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0
node tools/vendor.mjs && VENDOR_DIR=./vendor node test/smoke.mjs
```

**Run `npm run bindings` after every Claude Design handoff.** It is the guard
against a design regeneration silently renaming a binding — the failure mode is
a literal `{{ name }}` on the live page.

**Adding a new module the live page imports?** `npm run check` does not
catch a module missing from `tools/deploy.sh`'s `FRONTEND_FILES` list —
it only tests locally, where every file is already present on disk. This
has silently shipped a page that would 404 on a new module in production
before (`combos.js`/`findings.js`/`rates.js`, caught only by remembering
to check by hand). Update `FRONTEND_FILES` in the same commit as any new
top-level `import()` in the script block.

## What the ephemeris is worth

`astro.js` was verified against the Swiss Ephemeris (pyswisseph 2.10.3.2) over
~150,000 generated charts, 1930–2020:

| | mean | max |
|---|---|---|
| Sun longitude | 0.007° | 0.018° |
| Moon longitude | 0.021° | 0.106° |
| Ascendant | 0.003° | 0.119° |
| Placidus cusps | 0.003° | 0.105° |

Sign disagreement: Sun 0.029%, Moon 0.071%, rising 0.009%. Sun's house 0.00%.
`test/fixtures/astro.legacy.mjs` is a frozen pre-refactor copy; the last test
runs 3,000 random sub-polar charts through both and asserts agreement to 1e-9.
**If you change `astro.js`, that test must still pass.**

Above 66° latitude Placidus is undefined, so `placidusCusps()` falls back to
Porphyry and sets `chart.houseSystem = 'porphyry'`. Verified against Swiss
Ephemeris Porphyry: max cusp error 0.06°, zero rising-sign disagreements.

Note for `sigil.js`: a station is 12.857°, a step 3.214° — the Moon's
verified max error (0.106°) is ~3% of a step, so **step assignment near a
boundary is honest to within a rounding sliver**; do not add fake precision
(no seconds-of-arc in UI copy).

## What `sky.js` is worth

Two ephemeris sources, each canonical for a specific thing — deliberate, not
accidental. `astro.js`'s Meeus Sun/Moon stays canonical for tārābala and moon
phase (both only need Sun+Moon longitude, which `astro.js` already computes
and has verified); `sky.js` never recomputes position itself. `astronomy-engine.js`
(vendored, MIT, `tools/vendor-astronomy.mjs`) is canonical only for what
`astro.js` cannot do: sunrise/sunset for `planetaryHours()`. If a future
void-of-course feature uses `astronomy-engine`'s other-planet positions for
"today's Moon," that will be a *different* engine than the one powering
tārābala's "today's Moon" on the same day — both accurate, but not
bit-identical. Know that going in.

`lahiriAyanamsa()` is a linear approximation (not the full Swiss Ephemeris
precession model), fit against 12 real pyswisseph 2.10.3.2 `SIDM_LAHIRI`
reference points (1900–2050, see `test/sky.test.mjs`). The number that
matters isn't the formula's isolated accuracy, it's whether it ever
misclassifies which of the 27 sidereal-nakshatra bins a chart lands in — a
wrong bin doesn't nudge a number, it flips tārābala's favorable/unfavorable
verdict. Run through `astro.js`'s own `moonLongitude()` for 500 charts,
1930–2020: **0 mismatches against Swiss Ephemeris.**

`planetaryHours()` returns `{ available: false }` for genuine polar
day/night — confirmed directly from `astronomy-engine`'s source that
`SearchRiseSet` returns `null` (not an exception) when no rise/set event
exists in a 3-day search window. This is deliberately a short window: a wider
one would silently find the *next* real sunrise/sunset months later and
build nonsense multi-day "hours" out of the gap instead of reporting
unavailability.

## Recently fixed — do not reintroduce

- **Weekday** came from the UT-shifted instant, so 26% of timezone/hour combos
  reported the wrong day. Now `weekdayOf(year, month, day)` uses the local
  calendar date. Someone born 23:00 Saturday in LA is a Saturday's child.
- **`degFmt`** printed `12°60′` on 1/120 of values (12.5% of charts showed one).
  Now carries minutes into degrees and degrees into the next sign.
- **`ascendant()`** returned the Descendant above the polar circle — rising sign
  180° off. Now tests the candidate's hour angle geometrically.
- **Express 4 async handlers** were unwrapped, so a rejected `pool.execute()`
  became an unhandled rejection and killed the process. Every async handler is
  now wrapped in `wrap()` with an error middleware. Verified: dead DB used to
  give HTTP 000 + process exit, now gives HTTP 500 and stays up.
- **Stale-export crashes.** A Design export that imports an engine module
  as a sibling (originally `astro.js`/`shards.js`; `shards.js` no longer
  exists, but the failure mode applies to any engine module) has shipped a
  stale pre-refactor copy four times. The from-scratch rebuild makes this
  moot *only if* the receipt protocol above is followed — check imports on
  every handoff anyway.
- **`setState()` called from inside a function invoked *by* `renderVals()`**
  (as opposed to from an event handler) risks a cascading re-render loop —
  caught once, building the kindle animation, where a first draft started
  the animation's state machine by inspecting `sigJustKindled` inside a
  helper `renderVals()` itself called. Fixed by moving the state
  transition into the actual user action (`sndClaim()`) and having the
  `renderVals()` helper only *read* state, never write it. `renderVals()`
  and anything it calls must stay read-only.
- **Duplicate/mismatched double-"the"**: composing a sentence from two
  epithets (all 28 mansion epithets start with "The ") without stripping
  the leading article produces "The Storm of the The Glance." Strip
  `/^The /` before recomposing "of the ___" — caught live, not by any
  test, building the shard blueprint's hero.
- **A card ability rewrite has to be swept everywhere the ability is described in prose, not just
  the card-sheet table.** After the 27 Aug card rewrite, `_zoomFor`'s peek/hold panel (what a real
  match shows when you hold a card during play) kept its own pre-rewrite copy of all 28 abilities —
  the listener, ghost, crown, thread etc. all read the OLD mechanics live in production, contradicting
  the actual engine (`_simpleMove`/the `ABS` table were already correct). The practice-walk tutorial's
  `_demoScript()` had the same staleness, plus a deeper bug: its board-slot choreography assumed
  a fixed "tonight" that `_tonight()` never enforced, so the dominion moment it claimed never actually
  fired for most players. Fixed by routing `_zoomFor`'s mansion-card text through `_simpleMove()`
  (one source of truth), pinning `_tonight()` to a fixed mansion during `practice && tutor`, and
  re-choreographing the script against the real `_resolve`/`_tryFlip` logic (user, 27 aug 2026: "the
  cards are weird, they aren't the updated ones" + "we definitely need dominion to happen in the
  tutorial"). When a card's ability text changes, grep for every hardcoded copy of the old wording
  before calling the rewrite done — `_simpleMove`, the `ABS` table, and any per-surface duplicate.
- **On-station card name text used a hardcoded pixel offset (`top:52px`) that landed inside the L1/L2
  art box's own vertical range (27–69px)**, so a card's name overlapped its art on the board
  specifically (hand cards, which use a different, correctly-tuned offset, were never affected) —
  caught live from a user screenshot, 27 aug 2026. Fixed by moving the name to `top:74px`, clearing
  the art's bottom edge. Any future resize of the on-station art box must re-check this offset by hand;
  it isn't computed relative to the art, it's a sibling absolute-positioned div.

## Open decisions — ask, do not guess

- **The Keeper table** — ~~`[VERIFY]`-blocked pending research.~~ Corrected:
  the research is done (`research/hunger-axis.md`,
  `keeper(station) = CYCLE[(xiu.native_number-1)%7]`) and sigil.js's own
  header says so. It's unbuilt because no composer needs the *per-station*
  Keeper yet (only the birth-day one, a different value that happens to
  share the name) — not because it's still blocked. Build it when the
  "road-kin" topology feature actually needs it.
- **W6, escalated then partly answered (24 Aug 2026).** Account deletion and
  data export both shipped (`DELETE /api/me`, `GET /api/me/export`) — two of
  the original three gaps are closed. Still no email verification. Manzil now
  *requires* an account to play at all, and signup requires a birth date + a
  chosen username — the price of entry to a free game, for an audience
  that's ~25% aged 13–17. The gap flagged earlier the same day ("no age gate
  exists at signup") is now closed: `POST /api/auth/age-check` + a
  server-side re-check in `/api/auth/signup` reject under-16 outright (403
  `too_young`), and the two-tier privacy split (Privacy invariant above)
  keeps a full birth-data leak out of Manzil's own database even if it were
  ever breached. What's still genuinely open: no email verification, no
  written retention policy, no in-app export/delete buttons (the endpoints
  exist, no UI calls them yet), no privacy policy or ToS naming birth data.
  Raise these again before wide launch — this note closes one gap, not all
  of W6. **v4's onboarding assumes email magic-link auth instead of the
  password system** — a real conflict with W6, not a resolution of it;
  don't port that part of v4 without Justin's call.
- **The nakshatra alignment** (`research/corpus-mansions.md`'s own
  escalation section) — this corpus pairs nakshatra *n* with mansion *n*
  by ordinal index; the classical Sino-Indian correspondence doesn't
  (牛宿 = Abhijit, so the pairing from mansion 22 onward runs one step
  later). Independently checkable by star identification, not just
  convention. Blocks `findings.js`'s `seam` kind and `stations.js`'s
  `hunger` field for mansion 28. Justin's call per the doc itself, not
  Code's or Design's.
- **The $19–24 one-time unlock's IAP/entitlement path** — `PLATFORM.md`
  already calls this app-wrapper-only (a localStorage flag is forgeable;
  Safari evicts it), decided Aug 13. v4's `nightEight` paywall gate is a
  real, wired mock of this on the web build, which the decided plan says
  shouldn't exist there. Don't build the web-side gate without checking
  this is still the call.

Full findings and reasoning: `docs/archive/AUDIT.md` (historical) · current system:
`BLUEPRINT.html` · `COSMOLOGY.md` · `SIGIL-READING.md` · the Star Shard
blueprint system: `CHART-BUILDER.md` · `SHARD-MODEL.md` · `GENERATION.md`.
