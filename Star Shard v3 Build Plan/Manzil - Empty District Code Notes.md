# Manzil — The Empty District: Code pass notes (22 Aug 2026)

For Design's reference before the next handoff. Everything below is live at
`staging.starshard.net/manzil/`, sourced from `Manzil - The Empty District.dc.html`
in this folder (the friend-build export, replacing the prior multi-level
prototype at that URL). Committed as `19773ff` and `a7209e5` on `main`.

## 1. Birth screen rebuilt to match Star Shard v4

The custom stepped year/month/day calendar-grid picker is out. In its place,
the real v4 onboarding form: month/day/year dropdowns, hh/mm/am-pm dropdowns,
the "i don't know my birth time" toggle, and a place search field (Open-Meteo
geocoding, same endpoint v4 uses) with a manual lat/lon/UTC-offset fallback.

Place is collected but not required to cast — the five mansions only need
date + time, per this build's own "the five need no place" call. The field
exists purely so the two products share one visual design language; nothing
downstream reads it.

## 2. Fixed: every mansion was shipping pre-owned

The `ownAll` testing prop ("own all 28 at level 2, for reading the whole
slate") shipped with `default:true` in the props schema. Every visitor was
getting all 28 mansions pre-owned and leveled from the first load, which
skipped the loaner state that gates the walker's road entirely — the empty
district (and every other mansion) went straight to a single match instead
of the intended eight-walker ladder + boss climb. Flipped the default to
`false`.

Belt-and-suspenders: also excluded mansion 21 specifically from
auto-ownership via the player's own chart-five, so a player whose birth
chart happens to place a planet on the empty district still walks the road
on first visit, instead of hitting a "special night" sky fight with no
ladder at all (the main game's real rule, imported into a build where it
doesn't serve the demo's purpose).

## 3. Restored the five-card reveal

`tut5` (one screen per chart card — its source planet, its move in plain
language, a lesson) was fully built but unreachable: casting jumped straight
to the forced-walk tutorial, skipping it. Flow is now:

**cast → five-card reveal (tut5) → forced walked board (pintro) → "the
other seven" (tut7) → menu**

## 4. Confirmed working, no changes made

- **The deal**: the 12-card pack (5 chart cards + 7 filler) with 5 dealt
  face-up per board, seeded per night+board, tonight's mansion always
  guaranteed in the deal — implemented and live, exactly as designed.
- **Card levels**: only the 5 chart cards start at L2 (signature awake); the
  other 7 in the pack are loaners at L1 (numbers only) until their own
  mansion's night is won elsewhere — this is by design, stated on the tut7
  screen itself, not a bug.
- **Responsive scale-to-fit**: the 932×430 stage already scales via
  `frameScaleStyle` (`transform: scale(min(1, w/932, h/430))`, recomputed on
  `resize`) — same pattern as Star Shard v4's phone frame. Verified at a
  forced 390×750 viewport: scales to 0.397, no cropping. Nothing to build
  here.

## Open item

The "own all 28" toggle is still present as a testing option in-game
(settings: "your own" / "all 28, awake") — only its *default* changed. If a
future Design pass wants a different default posture for a different build,
that's the line to touch: search `ownAll` in the props schema at the top of
the script block.
