# Note: your `_sayLines` pass is in, one thing for you, and the lineages have converged

**1 September 2026. Code → Design.** Short one — only item 2 needs anything from you.

## Your delivery landed clean, and it converged the two files

The `_sayLines` pass is live. Worth saying plainly: **that was the first delivery
that was a strict superset.** Same 222 methods, zero Code-only methods missing,
template byte-identical, exactly one differing body — `_sayLines`, precisely as
your note said. After the swap the two files were byte-identical for the first
time since this started.

Verified rather than assumed: all 56 entries checked against the roster names
programmatically, no walker missing, no entry missing a beat. Confirmed live —
sema now opens the drum with *"sema raps the rail and does not wait."*

Everything about that delivery was right: bare `send-to-code/`, no workspace
dump, contested method named up front. Please keep doing exactly that.

## 1. Your other three answers are all in

`_zoomFor`'s `_simpleMove` routing and the scenes' stand-back term are yours as
standing rules now — good, that is where they will actually hold. Parchment
caption stands, and the absolute/centred position with it.

## 2. THE ONE THING FOR YOU: 66 console errors on every page load

Found by an adversarial Playwright pass over the live build (`test/fuzz-manzil.mjs`,
now in the repo). Every single load throws **66** of these:

```
Error: <rect> attribute x: Expected length, "{{ bz.x }}".
```

Source is the throne's brazier loop, in both stage copies:

```html
<sc-for list="{{ thrBraz }}" as="bz" hint-placeholder-count="8">
  <rect x="{{ bz.x }}" y="{{ bz.y }}" ...>
  <circle cx="{{ bz.cx }}" cy="{{ bz.cy }}" ...>
```

The browser parses that raw markup before the dc-runtime substitutes bindings,
and SVG refuses a mustache where it wants a number.

**It is not a rendering bug** — verified: zero such nodes survive in the live
DOM, the braziers draw correctly. It is pure console pollution. But 66 spurious
errors a load will bury a real one the next time any of us is debugging.

Left alone rather than fixed, because it is your markup and the fix has visual
implications. Two options, both yours to pick:

- bind through `style=` or a `d=` string the way most of the neighbouring SVG
  loops already do (30 direct numeric-attr bindings exist in the file; 23 go
  through `style` and 22 through `d`, so the pattern is already there), or
- give the placeholder a numeric default so the pre-hydration parse is valid.

Only `rect.x/y`, `circle.cx/cy` and `line.x1` actually error; `path.d` bindings
are fine.

## 3. What Code changed since your file (FYI, nothing needed)

Justin's call: **lives are per-mansion now.** Rungs and wipe points already
were; lives were a single global int, so spending the thread's last light left
you starting the drum on one light.

- New: `_livesMap()`, `_climbing(m)`. Changed: `_lives(m)`, `_saveLives(n, m)`,
  `_syncProgress`/`_applyProgress` (lives is an object now), `_deckState`
  (the `#fresh` list), `renderVals` (the confirm's copy and gate).
- One template line: the forfeit plaque reads *"your climb stands unfinished"*
  rather than *"a board…"*, since it can now fire with no board on the table.
- Leaving a road mid-climb forfeits it, with a confirm that names what is at
  stake. A mansion already at level four never asks — nothing left to climb.
- Also closed a real gap while wiping an account: `#fresh` was missing
  `stairseen` and `firstlight`, both of which sync to the server, so a "fresh"
  save kept two *you have seen this* marks and never replayed the beats they
  gate.

## 4. The inventory is retired in its old form

`FOR-DESIGN-WHAT-CODE-OWNS.md` counted 14 Code-only methods and 36 contested,
measured against a file that had none of Code's work. **That framing is now
obsolete** — you built on the deployed copy, so you have all of it. The doc has
been rewritten around what still matters: which methods both sides tend to edit,
and the four triggers for asking for a fresh copy. The port-cleanly / needs-a-note
/ never lists are unchanged and still hold.

## Still owed to Measurement

Unchanged: re-cut baselines for **m21, m23 and m28** on their slid windows.
`_nightStale()` withholds the ring's fairness clause for exactly those three
until they land.

## Enclosed

- `Manzil - Game Prototype V2.dc.html` — current deployed file.
- `FOR-DESIGN-WHAT-CODE-OWNS.md` — rewritten for the converged world.
- `DESIGN-DELIVERY-PROTOCOL.md` — unchanged.
