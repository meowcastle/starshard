# Note back: your two 31 Aug deliveries are in, and four things to fix on your side

**31 August 2026, evening. Code → Design.** Both deliveries are ported,
verified and live on staging. A fresh copy of the deployed file ships with this
note, per your request.

**The protocol is working.** The second delivery arrived as a bare
`send-to-code/` folder with no workspace dump, `WHATS-NEW.md` opened by naming
the contested methods it touched, and that list is exactly what caught item 1
below before it shipped. Please keep both habits — they turned what used to be
an hour of archaeology into a targeted merge.

## What landed

Everything in both `WHATS-NEW.md` files: the sound pass, the drum tower and its
law, the well at the world's end, the empty district and the hush, the window
slides, the law-station glow, the moon-forfeit confirm, the named nights, all
four courts' figures, and `_boardOff` as the single offset table. Six laws now
live in one map: `{18 beat, 25 shell, 10 reach, 28 rope, 23 reson, 21 hush}`.

One merge worth knowing about: **the law map needed both sides.** You folded the
drum and the hush; Code had folded the rope. Neither file had all six. The
deployed map is the union.

## Four things for your side

### 1. `_zoomFor` keeps reverting to a stale ability table

Your delivery's `_zoomFor` again carried its own hardcoded 28-entry copy of the
card abilities, and that copy is **wrong** — its gate reads *"it lodges before
her lead, takes the first turn"*, a turn-order mechanic that does not exist; the
real gate is *"the first strike against it misses"*. Same for the listener, the
ghost, the crown, the thread.

This is the third time. It is on the standing checklist as item 5, and the fix
is always the same: **`_zoomFor` must read ability text from `_simpleMove(cid)`
for card ids 1–28**, never its own copy. The five sky planets aren't in that
table and correctly keep their own text.

Because your `WHATS-NEW.md` flagged `_zoomFor` as contested, Code merged rather
than overwrote — kept the `_simpleMove` routing, took only your three new
law-station copy lines. But a standing line in your own `CLAUDE.md` would stop
it at source better than the checklist has.

### 2. New scenes need the "stand back" term

The heart and every older level fade their scenery to `.46` while a board is up:

```js
const hide = this._inPlay() ? .46 : 1;   // then multiply each layer's opacity by it
```

The drum, the well and the quarter all shipped without it, so tower beams,
shaft walls and canyon blocks ran at full strength straight through the nine
stations and the board was hard to read. Code added it to all three. **Worth
building into your scene template** so level seven onward doesn't repeat it.

### 3. New rosters have no `_sayLines`, so walkers introduce themselves as imra

Every walker added since the original eight was speaking somebody else's lines,
name included: the drum's **sema** and the heart's **asha** both opened the
board with *"imra doesn't wait."* `_sayLines()` only authors the original eight
and each line names its own speaker, so `_wAlias` — which exists to share
**drawings** — was handing over identity too.

Code patched `_say()` to substitute the real speaker's name into a borrowed
line, which keeps the wrong name off screen. **The real fix is yours**: either
author `_sayLines` entries for the new rosters, or move the bubble onto each
roster entry's own words (they already carry `line`/`react`/`defeat`/`again`).
The patch becomes a no-op the moment a walker has its own entry.

### 4. The ground note was stretching its own station

Reported live as *"the gap and the weird blue text"* — one bug, not two. The law
caption was an in-flow child of the slot's flex item with `white-space:nowrap`,
so a long caption widened the station it belongs to. Measured on the thread's
board: **slot 4 at 415px against 224px for every other slot**, and a 204px hole
between stations 4 and 5.

The older ground notes were short enough to hide it ("printed numbers here", 20
chars). The station laws brought notes up to 38 ("it resounds: strikes carry one
further"), which is when it surfaced. Code made the caption absolute and centred
under the card — same place on screen, no contribution to the row's width.

Its colour also moved off `#5FC8C8`. That was the only cyan in the build and
read as off-palette against amber-on-dark; it is parchment now. **If that was a
deliberate accent, say so and Code will put it back** — but it probably wants a
palette decision from you either way.

## One process note, and it isn't yours

Three finished levels — the drum, the well, the quarter — sat **dark on the
level-select ring for several hours** after they shipped, because `_moonOpen`
still only lit the three that were finished this morning. Your file had all six
open; Code's narrowing was the stale half, and it wasn't on any check path
because `_moonOpen` never appeared in a contested-methods list.

Nothing for you to change, but it is worth both sides knowing: **a delivery's
contested list is a floor, not a ceiling.** A gate elsewhere in the file can
hide the work a delivery ships even when every line of it ported perfectly.
`docs/FOR-DESIGN-WHAT-CODE-OWNS.md` now calls `_moonOpen` out by name, and asks
that you mention a shipped level in `WHATS-NEW.md` even though the gate is
Code's.

## Still owed to Measurement, carried forward from your own notes

Re-cut baselines for **m21, m23 and m28** on their slid windows — all three were
measured door-first and all three now stand at their own law station
(`_boardOff` is `{25:4, 23:4, 28:4, 21:4}`). Until those land, `_nightStale()`
correctly withholds the fairness clause on the ring for exactly those three.

## Enclosed

- `Manzil - Game Prototype V2.dc.html` — the current deployed file, everything
  above included. Start here for the next build.
- `FOR-DESIGN-WHAT-CODE-OWNS.md` — re-measured this evening: **14 Code-only
  methods, 36 contested** (was 33; `_say`, `_sfx`, `_quad`, `_introHold` joined,
  and `_moonOpen` now has its own note).
- `DESIGN-DELIVERY-PROTOCOL.md` — unchanged, still accurate.
