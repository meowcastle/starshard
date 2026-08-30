# The tents law: found, measured, passing

**30 August 2026. For Design and Code.** The hideaway's law is the fourth candidate, and it ships.

> **The tent stands midway down the road. Take it, and it counts for nobody.**

Mechanically: on the hideaway's night, **station 4** — the road's middle — carries the law. Whatever
lodges there counts as normal; if it is ever taken, that station counts for nobody at the end, both
sides, for the rest of the board. The theft succeeds and gains nothing. Sa'd al-Akhbiya, the luck of
hidden things: what the tent holds cannot be stolen, only emptied.

## Where it came from — Justin's question answered

Every law so far was derived from the mansion's *signature*. Justin asked whether the **quadrant
grant** could serve instead — and for the hideaway it does: this is the Genbu grant ("the empty
shell"), already shipped and measured board-wide as a card ability, moved to a station. Not a new
mechanic; a known-safe one, relocated.

**The general rule this gives all 28:** signature first; if the signature is worth-or-safety class,
fall back to the quadrant grant. Suzaku's grant (reach — a fight) and Seiryuu's (either way round —
movement) are safe-class fallbacks for their fourteen mansions. Byakko's (cannot be taken) is the
shelter, which fails at any station. That is a candidate bank covering most of the deck before
anyone invents anything.

## Why station 4 and not station 0

The shell law at station 0 posted a **perfect quadrant row** (all four inside ±2 — the cleanest of
any candidate ever) but failed fresh seat at +15.8 over plain: protection-flavored effects at the
corner lock in the leader's turn-one claim. The center is the hardest station to claim first and
hold, and the rope already established station 4 as the board's most neutral ground. Moving the
tent there cut the leader-gift in half and brought everything inside the bounds.

The fiction is better too: the tent is shelter for travelers **on** the road — of course it stands
midway, not at the mansion's own door. This is the second law pinned mid-road after the rope;
the home-station template holds for fight-class laws and bends for shelter.

## The tables (mansion 25's night, true same-night baselines, 896 boards a cell, two seeds)

| gate | plain | the law | delta | bound | |
|---|---|---|---|---|---|
| seat, fresh | +11.2 | +18.4 | **+7.2** | ±8 | pass |
| seat, deep | +22.3 | +21.3 | −1.0 | ±8 | pass |
| skill, fresh | +1.9 | +4.6 | +2.7 | positive, ±5 | pass |
| skill, deep | +21.2 | +21.2 | 0.0 | positive, ±5 | pass |
| byakko / suzaku / seiryuu / genbu | 64.2 / 28.5 / 30.7 / 31.4 | 64.2 / 26.9 / 29.4 / 31.7 | **0.0 / −1.6 / −1.3 / +0.3** | ±10 | pass |
| level / close / blowout | 9.4 / 26.7 / 28.0 | 9.1 / 26.2 / 27.3 | — | stable | pass |

**The quadrant row is the best any law has posted, the heart's included.**

## The one lean, stated plainly

The walker-caution sweep (fresh mirror, player leading, cautions 0–8) shows the law adds **+9 to
+12** to the player's win rate on boards they lead. That is the fresh-seat lean seen from the
walker's side: the player leads walker boards, and this law mildly favors the leader. Formally
inside the policy; larger than the heart's ±2.4.

Two readings, both defensible. As identity: the hideaway is the cozy-secret mansion, the sky's rest
stop — **a gentle night** in the 28-night rotation is fitting, and nights are allowed to lean.
As a watch item: log hideaway-night walker win rates in live play, and if the lean reads as "free
night" rather than "gentle night," the tightening lever is known (the lean lives in the fresh
leader cells).

## For Code

- Engine: `lawAt = { 18: "beat", 25: "shell" }` — and note the shell's **station is 4, not 0**, so
  the per-mansion map wants `{ station, kind }` per entry, not a bare kind.
- The condition rides the existing `taken` flag — a station that has ever changed hands by strike.
  Reference dial `shellAt` in `research/v2.js`; vectors 8–10 in `research/wardvec.js` (89 green
  across six suites).
- Whole-night scope per the settled memo; same gate as the heart's.

## For Design

- The law glow and hover copy move to **station 4** on hideaway nights — the settled memo's
  "station 0 carries the law" gets this exception, same as the rope.
- Suggested copy, in the register: *the tent stands midway down the road. what it holds cannot be
  stolen, only emptied.*

### Files

`research/v2.js` (`shellAt`), `research/wardvec.js` (10 vectors), `research/shelllaw.js` /
`shell4.js` + `.out` (station 0 and station 4 tables), `research/_shellsweep.js` (the walker sweep).
