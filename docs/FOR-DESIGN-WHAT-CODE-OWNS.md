# For Design: what exists on Code's end

**31 August 2026, Code → Design.** Written because deliveries keep needing an
archaeology pass, and the cause isn't carelessness on either side — it's that
Design has never had an inventory of what Code has built into the same file.
This is that inventory, plus a decision guide for the two questions you asked:
**when does my change port cleanly, and when do I need a fresh copy of the
live file?**

Everything below is measured from the two files directly, not remembered.

## The one fact that used to explain everything — and what replaced it

**Until 31 Aug this doc opened by saying your file and the deployed one were two
lineages, neither ahead of the other.** That was measured and true: your copy
carried none of Code's work, and every delivery was a merge in both directions.

**That is no longer the case.** Your 31 Aug evening delivery was built on the
deployed copy, and after it landed the two files were byte-identical. You have
all of Code's work now. The 14 "Code-only methods" this section used to
enumerate are simply part of the file you hold.

**Keep it that way and this whole document mostly stops mattering.** The way to
keep it that way is the one you already used: build on the copy Code sends,
ship only what changed, and name any shared method you touched. What follows is
what still matters when the two do drift apart again — which they will, the
moment either side works for a day without exchanging files.

## What Code owns (all of it now in your copy too)

### In the shared `<script type="text/x-dc">` block

Not missing from your file any more — listed so you know what they are and
don't delete one you don't recognise:

| Method(s) | What it is |
|---|---|
| `_netQueue` `_netPlace` `_netCleanup` `_netBoardStart` `_netMoveConfirmed` `_netBoardResult` `_netMatchResult` `_netCancelQueue` | **Real-time PvP.** "find a match" is a live Socket.io match against another human, not the old fake local-AI opponent. |
| `_syncProgress` `_applyProgress` | **Server-side save data.** Card levels, climbs, lives, builds sync to the account so progress survives a new device. |
| `_awake` `_handicapFor` `_cautionsFor` | **The walker ladder's difficulty canon** (handicap bands + caution dial from the measurement engine). |
| `_searchPlace` | **Real geocoding** for the birth-place field, replacing the old static `_cities` list. |
| `_livesMap` `_lives(m)` `_saveLives(n, m)` `_climbing(m)` | **Per-mansion lives + the forfeit gate** (1 Sep). Lives are `{mansionId: n}`, not a global int; `_climbing` is what decides whether leaving a road asks to forfeit. |

### Outside the file entirely (no Design counterpart)

- **A real account system** — 27 API endpoints, including signup with a
  region-aware age gate, login, logout, password reset, GDPR export/delete.
- **A PvP server** — matchmaking, authoritative move validation, reconnect
  grace, report/block. 8 socket events.
- **`api.js`** — 26 functions; the *only* file in the project allowed to call
  `fetch()`. Nothing else may talk to the network.
- **The engine modules** — the ephemeris, sigil, transits, reading corpus.
- **25 `manzil-v2-*` localStorage keys**, 16 of which sync to the server.

## The contested 36: methods you and Code both edit

These exist in both files with different bodies. If you regenerate one, Code's
edit is silently gone. Grouped by what Code's version adds:

- **Progress sync** — `_recordWin` `_saveLives` `_saveRung` `_saveWrec`
  `_setBuild` `_doRespec` `_setMoon`. Each ends with a `this._syncProgress()`
  call. Losing it means progress stops reaching the account.
- **PvP** — `_finish` (an early return for live matches, so it never runs the
  local AI), `_faceOf` (reads server-authoritative face values), `_commitPlace`
  `_dragUp` `_startDuel` `componentWillUnmount`.
- **The measured ruleset** — `_cards` (walkers mirror the player's real
  collection), `_replyW` (caution dial), `_resolve` (Suzaku's grant, the drum's
  law), `_bossRule` `_lawSt` `_reson` (the six station laws), `_advanceRound`
  (the walker 5–8 tally), `_moonOpen` (which levels the ring lights — see the
  note below), `_quad` `_tonight`.
- **Accounts / onboarding** — `_saveBirth` (timezone-correct chart), `constructor`,
  `renderVals`, `_legendDone`.
- **Sound + misc** — `_afterDeal` `_buzz` `_sfx` `_zoomFor` `_abilityOn`
  `_specialNight` `_cross` `_moon` `_introHold`.
- **Walker speech** — `_say`, which now substitutes the real speaker's name into
  any line borrowed through `_wAlias` (see the note below).

**`_moonOpen` is worth calling out separately.** It is not a contested method in
the usual sense — Code narrowed it while only three levels were finished, and it
gates which houses the ring will light at all. Three finished levels sat dark on
the ring for several hours because it wasn't on anybody's check path. **When you
ship a level, say so in `WHATS-NEW.md` even though the gate is Code's**, or the
work is unreachable no matter how well it ports.

`renderVals` and `constructor` are the two biggest shared surfaces — almost
every delivery touches them, and almost every Code change does too.

## Will my change port cleanly? A decision guide

**Ports cleanly, every time — just build it:**
- New markup: screens, scenes, `sc-if` blocks, SVG figures, keyframes.
- New `renderVals` keys that are purely presentational (`dt*`, `resonStyle`, …).
- New data tables: rosters, avatars, card art, copy, `_figs` entries.
- New self-contained methods with names nobody else uses.

*The drum tower was 100% this, which is why it ported in one pass.*

**Ports with care — say so in `WHATS-NEW.md`:**
- Editing any of the 36 contested methods above. Name the method and say what
  you changed; Code merges rather than overwrites.
- Anything touching game rules — the laws, `_cards`, `_resolve`. These have a
  measurement trail and an engine counterpart on Code's side that has to move
  with them.
- Renaming or removing a `renderVals` key, or a `{{ binding }}` in markup.

**Please don't — these will be reverted, not out of stubbornness but because
they'll break production:**
- Account, login, or logout wiring. It must call the real server; a
  `localStorage` password is not a login.
- Anything calling `fetch()` outside `api.js`.
- Importing an engine module into the `x-dc` block (the runtime forbids
  top-level `import` there — it's a syntax error, not a style rule).
- Deleting a method you don't recognise. If it starts with `_net`, `_sync`,
  `_apply`, or appears in the table above, it's load-bearing.

## When you need a fresh copy of the live file

**Ask for one when any of these is true:**

1. **You're about to regenerate the whole file**, or rebuild a screen that
   isn't purely visual. Starting from the deployed copy means your work lands
   on top of reality instead of needing a merge.
2. **You're touching one of the 36 contested methods** — especially
   `renderVals`, `constructor`, `_cards`, `_resolve`, or `_finish`.
3. **You're building anything that needs an account, the network, or saved
   progress.** All of that exists already; building a mock alongside it
   guarantees a conflict.
4. **It's been more than a few days since your last copy.** Code ships most
   days, and drift is what makes merges expensive.

**You don't need one for:** a new scene, new art, new copy, a new roster, new
keyframes, or a self-contained new screen. Build those against whatever copy
you have and they'll port fine.

Asking is cheap — Code can hand you the current deployed file any time. It is
much cheaper than either side discovering the divergence afterward.

## What's working, and should keep working

The 31 Aug delivery was the first under the new protocol and it went well:
`send-to-code/` shipped V2 (not the retired V1), and `WHATS-NEW.md` named
every change and its site. That note is what turned a day of archaeology into
a targeted port — the drum tower landed in one pass with no guesswork.

The work orders have been consistently good too. `WORKORDER-STAGING-FOUR-31AUG.md`
was clear enough to implement directly and shipped the same day.

Keep both. The rest of this document exists so the merge stays cheap even when
the two lineages drift — not to slow anything down.
