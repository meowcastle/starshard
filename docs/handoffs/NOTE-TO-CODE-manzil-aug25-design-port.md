# Manzil design port — 25 August export, investigation carried over

Source: `/Users/justinbjur/Downloads/Starshard Manzil Aug 25.zip` (still on disk, re-extract
fresh — the scratchpad copy from the investigating session does not persist). 201 files, 79MB;
this is a full Design project-folder export, not a single-file handoff.

## Scope decisions already made (don't re-ask)

1. **`Star Shard v4.dc.html` and `Star Shard - Account Portal.dc.html` in this zip are stale.**
   Verified: zero real wiring (`obSearch`, `api.js` import, `placeSearchTap` — all absent).
   Smaller than the live files for exactly that reason. **Do not port anything from them** —
   they predate the real signup/search/casting work already live. User confirmed: leave alone.
2. **`Manzil - The Empty District.dc.html` in this zip is genuinely new and much larger**
   (640KB vs the live file's 371KB at investigation time). Its own README
   (`design_handoff_manzil_empty_district/README.md`) describes new features: a climb-progress
   tower, an 11-layer altitude scenery system, hover-zoom refinements, a "station peek" tooltip,
   walker-presence gesture animations, signature-move toasts, a receipt+walker-memory end
   screen, and a duel visualization set at Sagittarius A*.
3. **The zip's `tonightMansion` prop now offers all 28 mansion names**, and Design has built
   distinct background art for other mansions too (drum/guide/thread/listener/void/hideaway/
   chamber), not just mansion 21. **User's explicit call: port mansion 21 ("the empty
   district") fully; the other 27 mansions' art should stub safely, not be hand-built today.**
   Good news found during investigation: this mostly happens for free — every one of those
   other-mansion flags is gated by `this._tonight() === <id>` (drumOn = 23, guideOn = 27,
   threadOn = 28, chamOn = 26, hideOn = 25, voidOn = 24, listenerOn = 22), and `_tonight()`
   stays hardcoded to 21 in production, so porting the real conditions verbatim makes the other
   27 branches naturally false — no manual stubbing logic needed, just don't let `_tonight()`'s
   fallback drift off 21 (see the sync-breaking change below).

## Why this isn't a "port a few new bindings" job

Running `node tools/bindings.mjs` against a naive markup-swap (export's markup + live's script)
surfaced **80 missing bindings**. Tracing them back into the export's own script (which still
contains real-looking reference logic, not just Design's disposable mocks) showed why: Design
rewrote the entire scenery/altitude/climb/deck section of `renderVals()` as one interconnected
block — shared closures (`ev`, `t23`/`t27`/`t28`, `hs`), and per-mansion branches spliced into
bindings that **already exist live and already work** (`edFarStyle`, `edDuskStyle`,
`edMilkyStyle`, `edGridStyle`, `climbCells`, `oppName`, `roadTag`, `tonightName`, the whole
intro-title logic, `deckCards`/`deckShow`/`deckFocus` on the collection screen). It is not safe
to cherry-pick individual new bindings out of this — too much of it shares state with code that
would be left behind. **The right approach is a wholesale replacement of that script section**
(roughly `const ev = this._elevSpec();` in the live file through the end of `renderVals()` —
confirmed running past line 5400+ in the export, likely to end of file), re-splicing in only the
account/login/socket.io wiring the live file has and Design's copy doesn't.

This is realistically several hours of careful merge-and-verify work, not a quick patch.

## Concrete technical findings to reuse (don't re-derive)

- **New helper methods needed**, none of which exist live yet: `_mList()`, `_stepForce()`,
  `_forced()`, `_walkStep()`, `_hourName()`, `_stepName()`, `_hw()`, `_hc()`, `_hg()`,
  `_hourStyles(ev)`, `_firstRoadNote()`, `_stationList()`, `_stationForce()`, `_inPlay()`,
  `_ton(ev)` (the duel Sagittarius A* space vista — defined at export line 4314), `_reson()`
  (mansion-23-only "the drum" mechanic, low priority, self-gated, safe to skip).
- **`_tonight()` changed** to support the mansion-name string form via `_mList()` — port that
  structure, but **its fallback in the export is `return 23;`** ("standing in the drum while
  its level is built" — Design's own current editing focus, not a product decision). **Must be
  changed back to `return 21;`** to keep production scope where the user wants it (mansion 21
  only). Getting this wrong silently reactivates the wrong mansion in production.
- **`_mlvl()`, `_rungs()`, `_saveRung()`, `_elev()`/`_elevSpec()`** all gained
  `_stepForce()`/`_stationForce()` awareness (Design's own testing-dropdown overrides). Both
  default to inert (no-op) when the props aren't set by Design's editor, so porting them
  verbatim is safe and behaviorally identical to the live versions in production — no need to
  hand-simplify.
- **The "four steps" system is real new scope**: `_walkStep()` derives a 0-3 "hour" index
  (`hs`) from `_mlvl(tonight)`, and `_hourStyles(ev)` returns ~15 of the 80 missing bindings
  (`hourWarmStyle`, `hourVeilStyle`, `hourStarStyle`, `hourWinStyle`, `hourLampStyle`,
  `hourDawnStyle`, `towerWinStyle`, `setDuskStyle`, `setShutStyle`, `setRainStyle`,
  `setWakeStyle`, `lisWakeStyle`, `lifeWalkStyle`, `lifeCatStyle`, `lifeEyesStyle`,
  `lifeDawnStyle`, `catStyle`, `ratStyle`, `pigeonStyle`, `winAStyle`, `winBStyle`) — as the
  player levels a card 0→3, the mansion's time-of-night visually progresses dusk → full dark →
  small hours → before dawn. This is genuinely new product behavior, not cosmetic-only.
- **The other-mansion art clusters** (all safe to port verbatim, self-gating as above):
  `dr*`/`drumOn` (mansion 23), `gd*`/`guideOn` (27), `th*`/`threadOn` (28), `kiln*`/`chamOn`
  (26), `hideOn` (25), `hundred*`/`voidOn`/`voidSignOn` (24), `lisWakeStyle`/`listenerOn` (22).
- **`desk*` cluster** (`deskBgStyle`, `deskGlowStyle`, `deskGroundStyle`, `deskSkyLStyle`,
  `deskSkyRStyle`, `deskStars`) is the previously-deferred "desk background" parallax feature
  (see the main `CLAUDE.md`'s note about it being skipped from an earlier export) — it's back,
  computed from actual window size + the frame scale factor, at export lines ~5109-5124.
- **`stillCls`**: a `prefers-reduced-motion`-aware class, real formula at export line 5259
  (`this._tonight() === 22 && ev.e < 8 ? "mzStill" : ""` — mansion-22-specific in the export;
  reconsider whether it should be more general for mansion 21's own star layers).
- **`introNote`/`introNoteOn`**: real logic already at export lines ~5275-5286, depends on
  `_firstRoadNote()` and existing `_walkers()`/`_wrec()`/`_again()` methods (already live).

## What's NOT touched by any of this

The engine-slate rebase work (`docs/handoffs/NOTE-TO-CODE-slate-rebase.md`) and the
`HANDOFF-CODE-ENGINE-25AUG.md` work order (items 1/2/4 already done this session, items 5-8
still pending) are **completely separate** from this design port. Nothing here should be
confused with or block on that.

## Suggested next steps

1. Re-extract the zip fresh into scratch.
2. Locate the exact start/end lines of the scenery/climb/deck `renderVals()` section in
   **both** the current live file and the export (line numbers above are from the
   investigating session and will have shifted somewhat if the live file changed since).
3. Do the wholesale section swap, add the new helper methods to the class body, fix `_tonight()`'s
   fallback, then iterate `node tools/bindings.mjs` until 0 missing.
4. Full verification: `npm run bindings`, `npm test`, a real browser walkthrough of mansion 21
   (menu → road climb → a board → the collection screen), then deploy to staging.
5. Confirm the other 27 mansions' flags all correctly stay `false` in production (they should,
   automatically, once `_tonight()` stays pinned to 21).
