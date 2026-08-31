# Manzil's Code-owned behaviors — check this before shipping a new export

**For Claude Design, before finalizing a full export of `Manzil - Game
Prototype V2.dc.html`, and for Claude Code, before applying one.** This
file exists because the same failure has now happened twice: a fresh
Design export of V2 forked from (or was regenerated against) an older
baseline and silently dropped a list of real, already-shipped, already-
verified fixes — not cosmetic ones, but things like the real account
system, the mobile touch-hold behavior, and the mansion's three-lives
rule. Each time, nothing in the export *looked* wrong (it renders, the
new feature it was actually sent for works), so the regression only
surfaced when someone happened to test the specific old behavior by hand.

**The rule going forward: a full-script export of this file is not "done"
until every item below has been checked against it, not just diffed for
new engine-module imports.** If Design ships a narrowly-scoped patch
(one function, one screen) rather than a full regeneration, this list
still matters — check the specific items the patch's own area touches.

## The checklist

- [ ] **Real account system.** `componentDidMount` is `async`, calls
  `await import("./api.js")`, checks `await this.api.me()`, and skips a
  signed-in visitor past any cast/signup screen straight to the lobby
  (pulling `getManzilPack()` if no local birth cache exists). Cast/signup
  calls real `api.ageCheck()` then `api.signup()` — not a password
  mirrored in `localStorage`. Sign-in calls real `api.loginWithUsername()`
  and unconditionally overwrites the local birth cache from the server's
  real pack (a stale local cache must never leak across accounts on a
  shared device). Logout calls real `api.logout()` before landing
  anywhere. No fixed age is hardcoded anywhere in this flow — the
  minimum is per-region, computed server-side by
  `starshard-api/lib/age-gate.js`.
- [ ] **The rotate-to-landscape prompt.** A `rotateOn` state (`w < h &&
  w < 700`) shows the "turn your phone sideways" overlay instead of
  rendering the 932×430 stage scaled/cramped in portrait.
  `orientationchange` has its own listener (`componentDidMount`/
  `componentWillUnmount`) — iOS Safari doesn't reliably fire `resize` on
  a rotation.
- [ ] **The mobile info-panel touch-hold behavior.** A card's peek/hold
  panel (grant/signature detail) does NOT close the instant a finger
  lifts. `onTouchEnd`/`onTouchCancel` on both the board-slot and hand-
  card markup call a dedicated `onHoldEnd` (which only clears the pending
  timer), never `onPeekEnd` (which also clears `state.peek` — that stays
  desktop-mouseleave-only). If touch release and mouseleave ever share a
  handler again, the panel will flash open and vanish on release.
- [ ] **The on-station card name offset.** The absolutely-positioned name
  text inside a board slot is `top:74px`, not `top:52px` — 52px lands
  inside the L1/L2 art box's own vertical range (27–69px) and the name
  overlaps the art. (Hand-card names use a different, separately-tuned
  offset and aren't affected either way.)
- [ ] **`_zoomFor`'s ability text routes through `_simpleMove()`.** The
  peek/hold info panel must describe each of the 28 mansion cards' real
  ability by calling `this._simpleMove(cid)` for card ids 1–28 — never a
  separate hardcoded copy of all 28 descriptions living inside `_zoomFor`
  itself. A card-ability rewrite that only touches the main ability table
  (`ABS`, `_faceOf`, `_resolve`, `_lodge`) but not `_zoomFor` will still
  ship a panel describing the OLD mechanic. (The five sky planets —
  saturn/mars/venus/mercury/jupiter — aren't in `_simpleMove`'s table and
  correctly keep their own text alongside this.)
- [ ] **The dominion-tutorial pin.** `_tonight()` returns `18` (the
  heart) unconditionally when `st.practice && st.tutor` — before any
  other branch, including the duel/tweak/moon-glyph logic below it. The
  practice walk's `_demoScript()` is choreographed against a fixed
  nine-mansion board; without this pin, a returning player's last-walked
  moon position silently changes which mansions the tutorial's scripted
  board slots actually are, and the "dominion" (home-mansion) teaching
  moment stops landing.
- [ ] **The walker 5–8 best-of-three tally.** `_advanceRound(sameRung)`
  takes an explicit `sameRung` param; the road-step branch is gated
  `st.road && !st.roadBoss && !sameRung`. The call site inside a walker-
  rung board's win/loss ceremony (the branch where NEITHER side has
  reached `need` wins yet) passes `_advanceRound(true)` — continue the
  same match's next board, `roundWins` preserved — not the default
  `_advanceRound()`, which would silently reset to a fresh "round 1" at
  the same rung instead. The mid-match branch also re-deals the correct
  walker's hand (`this._seven(this._walkers()[st.roadRung].hand, ...)`),
  not whatever `_freshRound`'s own default falls back to.
- [ ] **The mansion's three lives.** A mansion (`st.road && st.roadBoss`)
  loss decrements the same life counter (`_lives()`/`_saveLives()`) a
  walker-rung loss does, and wipes the road (`_wipeRoad()`, the dark-veil
  `nmBeat` beat) on the third loss — the SAME code path a walker-rung
  loss already uses higher up in the same function, not a separate
  generic branch that skips the life count entirely.
- [ ] **Escape opens the lobby menu.** `_onKey`'s Escape branch has an
  explicit `if (p === "menu") { this.setState({ pmOpen: true }); return; }`
  case — every other `pmOn`-eligible phase either closes back to the lobby
  or opens the pause overlay on Escape; the lobby itself needs this
  explicit case or Escape silently does nothing there. Caught 30 Aug
  2026 as the one piece of `f8689f7` the first re-port pass missed — the
  `pmOpen`/`pmLogout` wiring itself was present and correct, only this
  keybinding that reaches it from the lobby had been dropped, so
  checking that the feature "works" isn't enough — check every entry
  point into it.
- [ ] **The sign-in link during account creation, positioned so it doesn't
  collide.** `obLinkOn` includes `ph9 === "birth"` alongside `"arrive"`
  and `"signin"` — someone who taps "read yours" and then remembers they
  already have an account must be able to reach sign-in from there. On
  `"birth"` specifically, `obLinkStyle` gives it a fixed top-right corner
  position, NOT the bottom-margin placement arrive/signin use — that
  margin strip is already shared by the progress diamonds and (on most
  steps) hint text, and three rows do not fit in a strip sized for one
  (confirmed with `getBoundingClientRect`, not eyeballing, after a first
  attempt at re-spacing all three still overlapped). If this link's
  position ever gets "simplified" back to one shared style across all
  three phases, re-check this specific overlap before shipping.
- [ ] **The one-time chart grab at Manzil signup.** `birthCastTap` calls
  `api.saveBirth()` with the full date/time/place it already collects
  (Manzil's own `api.signup()` call only ever sends five integers, never
  the full birth data), so a Manzil account also has a real chart on file
  for Star Shard's separate `birth_data` table — no second birthday
  prompt if the same account later opens a Star Shard reading. Fire-and-
  forget, alongside (not blocking) the existing local `_saveBirth()` call.
- [ ] **`_restoreChart()`, not a bare `getManzilPack()` call, on both
  account-restore paths.** `getManzilPack()` alone only ever returns
  `five` (`rows`/`fill: null`), and the in-Manzil star shard screen needs
  `rows` (which mansion is the sun vs. the moon) to render anything but
  "cast your five and the sky will name you" — a real account with a real
  chart on file still hit that fallback text on any device that restored
  from the server rather than casting locally. `_restoreChart()` tries
  the account's real `birth_data` (populated by the one-time grab above)
  first and recomputes the full `rows`/`fill` via `_saveBirth()`/
  `_castFive()`, falling back to the `five`-only restore only for an
  account that predates this fix. Both `componentDidMount`'s passive
  resume and `_siGo`'s sign-in pull must call this, not a bare
  `getManzilPack()`.
- [ ] **Real-time PvP ("find a match") is wired to the real Socket.io
  lobby, not the old fake local-AI duel.** `duelSeekTap` connects a real
  socket (`<script src="socket-io-client.js">`, loaded next to
  `ephemeris2.js`/`manzil-art2.js`) and calls `queue_join` —
  `starshard-api/lib/manzil-lobby.js` was already deployed and running
  before this port, just never connected to any client. `duel.mode
  "live"` is a NEW, distinct value from the pre-existing fake `"net"`
  (a local AI wearing a random opponent's name) — nothing in the local
  engine (`_resolve`/`_lodge`/`_skyMove`) may ever run for a live board;
  every move (your own AND the opponent's) goes through `_netPlace()` →
  the server's `move_confirmed` → `_step()` replaying the server's own
  `seq`, using the server's authoritative `pf.{l,r}` face values
  (`_faceOf()`'s own short-circuit on `duel.mode === "live"`), never
  local computation — the server holds real per-player card levels/
  builds the client can't see for the opponent's hand. `_finish()` has
  an early return for `duel.mode === "live"` that skips its normal local
  win-check/turn-flip/`_skyMove()` scheduling entirely and instead
  reconciles `slots` from the server's post-move snapshot and applies
  its `nextTurn` — losing that branch silently reintroduces a phantom
  local AI opponent into a real match. Leaving a live match
  (`pauseLeaveTap`/`pauseLogoutTap`) must emit `leave_match` before
  cleaning up the socket, not just disconnect silently (the far hand
  would otherwise sit on a 60-second disconnect-grace timer for a
  deliberate exit). `starshard-api/lib/manzil-engine.js` was replaced
  wholesale in the same port (a stale, pre-25-Aug ruleset before this)
  — its own header documents the verification this had against the live
  `.dc.html`'s engine functions, the two-seat `{you,sky}` card-table
  model real per-player levels require, and what's deliberately excluded
  (station laws, road-only grounds — the live client's own `_bossRule()`
  exempts every duel mode from these, so a faithful PvP port does too).
- [ ] **The cast/restore chart is timezone-correct, not device-local.**
  `birthCastTap`/`_castNow` and `_restoreChart()` both used to build the
  `Date` fed to `ephemeris2.js` via `new Date(y,m,d); dt.setHours(h,mm)`
  — that interprets the typed/stored wall-clock time in whatever
  timezone the CASTING OR RESTORING DEVICE happens to sit in, not the
  birthplace's. Caught live 30 Aug 2026 (a real account's moon landed in
  the glance, mansion 9, instead of the throne, mansion 10 — confirmed
  by replicating `_castFive`/`ephemeris2.js` in a standalone script: the
  tz-correct chart gives `five:[6,10,5,8,9]`, the naive one
  `five:[6,9,5,8,7]`, an exact match to the bug). Fixed two ways
  together: (1) the birth-cast screen's place field is now a real
  debounced geocoder (`_searchPlace()` → `api.geocode()`, replacing the
  old static-list `_cities()`) so a picked place carries a real IANA
  `tz` (plus `lat`/`lon`), not just a free-typed name; (2) both
  `birthCastTap` and `_restoreChart()` use `tz.js`'s `dstInfo()` to
  correct the `Date`'s underlying UTC instant against that real tz
  before it ever reaches `ephemeris2.js`, mirroring `Star Shard
  v4.dc.html`'s own already-proven `chartFromParts()` pattern. A
  free-typed, ungeocoded place (or an account that signed up before this
  fix, so `birth_data.tz` is null) has no known tz and silently keeps
  the old naive behavior — that's a real, standing limitation, not a
  regression, but don't let a future full-file export quietly drop the
  `dstInfo()` correction and reintroduce the device-timezone bug for
  everyone.

## Why this list and not something broader

This is not "every bug ever fixed in Manzil" — it's specifically the set
of fixes that are **easy to silently lose in a full-file regeneration**
because they live in the shared `<script type="text/x-dc">` block (Code's
territory per `CLAUDE.md`'s ownership table) rather than in markup Design
authors and re-authors deliberately. Anything Design visibly redesigned
on purpose (new screens, new copy, a new visual pass) is out of scope
here by definition — this list is about behavior that should carry
forward unchanged underneath a redesign, not behavior that's allowed to
change.

**Keep this file current.** When a new Code-side fix lands in V2's shared
script block that a future full-file export could plausibly silently
drop, add it here in the same commit — this list is only useful if it
stays a complete, live inventory, not a snapshot of one bad day.
