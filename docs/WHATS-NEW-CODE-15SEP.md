# Code → Design & Measurement, 15 September 2026 — the new state surface

**The flow order is complete.** All seven items are live on staging. This is the list of what now
exists for a surface to read, so nobody has to derive it from the diff.

Everything below is on `window.manzil.state` unless it says otherwise. Events are on `window`.

---

## The records

### `state.settle` — how the board was counted (item 1)

Emitted at the top of the count, **before the winner is announced**, and fired as `manzil:settle`
with the same object.

```
settle = {
  stations: {you, sky},                 // head count of lodged cards a side holds
  dominion: {you, sky},                 // a card on its own ground, plus the guide's grant
  cards:    {you, sky, notes:[{side, station, note}]},   // what a card's SIGNATURE did
  law:      {night, name, points:{you,sky}, notes:[]},   // tonight's law's contribution
  dawn:     {form, held:{you,sky}, pairs:[{you,sky,to}], unopposed:[], points:{you,sky}},
  total: {you, sky}, level, levelTo, winner,
  reason: "stations" | "dominion" | "cards" | "law" | "dawn" | "level"
}
```

**`cards` is the fifth term Measurement added today** after we flagged that
`total = stations + dominion + dawn + law` cannot hold on any board where a signature moves the
count — a district counts two, a listener one per neighbour, the chamber four. The invariant is now
**`total = stations + dominion + cards + law + dawn`**, and it is asserted live on every board.
`cards.notes` names the card, so the caption stack can read *"the listener · one to her"* rather
than an unexplained number.

`reason` is the component after which the lead stops changing hands — the word that becomes the
loss line.

### `state.verdict` — what just ended (item 2)

Fired as `manzil:verdict` when the verdict moment arrives.

```
verdict = {
  kind: "board" | "series" | "rung" | "climb",   // the LARGEST thing that ended
  board: {winner, totals, reason},               // from settle
  series: {format, need, wins:{you,sky}, over} | null,   // null on singles
  rung: {index, name, won, over},
  lights: {standing, cap, lost},
  climb: {over, cleared},
  walker: {id, name, lines:{in, out, ready, next}},      // the roster's four lines
  next: {walker|null, leader}
}
```

`next.leader` carries the 14 Sep canon — you lead every walker rung, she leads her own board — so
no surface has to restate it.

### `state.moment` — where we are (item 2)

`deal · play · settle · verdict · road`, fired as `manzil:moment` on every change.

**It is DERIVED, not driven.** It is computed from the state that already exists, so `phase` keeps
every value it had and every surface reading `phase` keeps working. That is deliberate: a parallel
machine someone has to advance by hand is one more thing a full-file delivery can drop, and a
derived one cannot fall out of step with what it reads.

### `state.tonight` and `state.stations[i]` — the law and the ground (item 4)

```
tonight  = { night, house, law: {key, line} | null, window:{tonight, offset}, marker:{station|null} }
stations = [ { index, house, quadrant, ground:"holds"|"open", quadrantRule }, … ]
```

**No law text belongs on a station unless `tonight.marker.station === i`.** `stations[i]` is ground
facts only — that is the fix for the hover showing a station's own mansion law on all 28 nights.
`law.line` is the ground's name and its rule, em dashes normalised out. A `surfaces.law.<key>` row
in the copy table overrides any line **without a Code cycle**.

### `state.slots[i]` — her cards have names now (item 5)

Every slot carries `name`, `homeM` and `quadrant`, resolved at lodge **for both sides**. Card 226
reads *"chamber · black tortoise"* without any surface knowing what 226 is.

> **⚠ THE PvP CAVEAT, the one thing on this page to remember.** A **live PvP board reconciles slots
> from the server snapshot and will NOT carry those three fields.** Anything that must work in PvP
> should read **`state.stations`**, which is computed at render and correct on every path. If a
> surface reads `slot.name` and works fine in single player, that is not evidence it works in a
> real match.

---

## The runtime hooks

### `window.stage`

- **`stage.look(target, {ms, ease})`** — moves the lobby as a unit. Targets `road · hand · ring ·
  fence · sky`; `look(null)` returns. It **composes with** the fitted scale rather than replacing
  it, so the stage still fits the window at any look, and dx/dy are fractions of the stage so a look
  is resolution-independent.
- **`stage.looks`** — assign it to retune any target. **Code owns the machine, Design owns the
  numbers.**
- **`stage.timing`** — Design's `TIMING` from the copy table, and **the only source of truth**. Two
  constants that duplicated it were ours and are retired: the verdict button's live-after now reads
  `timing.verdict.buttonLive`, the tooltip delay reads `timing.hover.tooltipDelay`.
- **`stage.copy` / `stage.fill`** — the copy table and its substitution.

### Copy substitution

`_say(path, values)` does the three things a plain replace does not: rows that carry other rows
(`{lights}` `{series}` `{reason}`) resolve first; a row resolving to empty is dropped and the
whitespace trimmed; an unknown key is left standing so a missing value is **visible** rather than
silently blank. All 97 rows swept clean.

### Felt-quality fixes (item 7)

The black frame is gone — the veil only dims (capped .62, never black) and the phase swaps at 110ms
while the dim deepens, so the destination lays out under cover instead of after a blackout. Tooltips
dismiss on any pointer-down. The verdict button is not live until the card has arrived. A
`ResizeObserver` plus a post-swap re-measure fixes the wrong-sized scene box.

---

## Two things worth carrying forward

**The mirror-deck guard bug was real and is fixed.** `isQuarterless` read `id >= 101`, which
swallowed the whole walker deck (200+) — mansion cards **with** quadrants. Four laws were wrong on
every walker board: the toll did not charge her sheltered cards, the crow never charged them, the
stranger paid no bonus, the open gate did not open their locks. Now `101–199`, cross-checked against
the card table's own `quad` for every id in play. The client had the mirror right and the planets
wrong — the exact mirror image — so its seven guards went `101..107` → `101..109`.

**One thing NOT verified live, stated plainly.** The client's `cards` bucket and its `notes` are
wired identically to the module's and read `_slotW`'s own parts, and the five-term invariant holds
on every board tested — but I could not get a signature to fire from outside the game to watch the
notes populate, because the client gates abilities on level **and** the build door, and I was
guessing at the build-state shape. **The module's path is covered by two dedicated vectors** (one
asserts the note reads "the listener"), 130/130 green. Measurement's run of the 27 cases through the
client's end-of-board path is what closes that gap — it is exactly the case their fixtures cover.

— Code
