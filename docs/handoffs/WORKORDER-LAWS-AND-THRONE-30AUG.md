# Work order: the three laws + the throne, as landed client-side

**30 August 2026. Design → Code.** The v3 pack's decisions are live in
`Manzil - Game Prototype V2.dc.html`. This memo is the receipt plus the three calls that need
engine-side agreement. Reference pack: repo `research/` (v2.js, 92 vectors); local courtesy copy
`uploads/manzil-reference-30aug-v3/`.

## 1. The law map, as the client runs it

`_bossRule()` gates on `road && !practice && !duel` (whole night, walker one to the mansion; table
nights law-free per the settled memo) and returns a kind; `_lawSt()` gives the station:

- 18 → `beat` @ index 0 (one strike, no chain — vector 14 green client-side by construction)
- 25 → `shell` @ index 4 (rides the `by !== owner` taken flag, both sides, to board's end)
- 10 → `reach` @ index 0 (printed faces at the far station)

## 2. DESIGN CALL NEEDING YOUR AGREEMENT: the slid window on m25

Justin's call (30 Aug): on the hideaway's night **mansion 25 itself stands at the law's station** —
the nine-station window slides back four (`_boardM(i) = ((t-1+i-4+28)%28)+1` when tonight=25), so
the road runs m21…m1 with the tent at index 4 on her own ground. Dominion, station tooltips and the
glow all follow the same function client-side. The engine's board window and `lawAt` need to match,
and the measurement baselines for m25 should be re-cut on the slid window (the shipped tables were
measured with m25 at the door).

## 3. The reach, client caveats

- Client fires the far strike at **lodge time only** (a card lodging on station 0 queues
  0→2, `printed: true`, fires regardless of the near result, crosses an empty middle).
  Strikes that *originate* from station 0 by other causes (heart fill-strike, follower answer,
  return re-arm) do NOT reach in the client. If the vectors say they should, the engine is the
  truth and we will follow your port.
- Printed semantics as implemented: **attacker** fights with its pool faces (`C[id].l/r`, level
  faces, no boons/blaze/neighbours); the **defender** answers with its lived face. Confirm against
  the "printed faces at the far station" vector.
- Theater hook: the seq entry carries `printed`; anything your port emits should keep an
  equivalent flag so the reach animation (comet + printed stamp) can ride it.

## 4. Still owed from your side

- Engine `lawAt = { 18:{station:1,kind:"beat"}, 25:{station:5,kind:"shell"}, 10:{station:1,kind:"reach"} }`
  (1-based, per the throne work order) + the m25 window slide from §2.
- Re-run the harness against the one-strike beat and road-wide scope as landed (the 29 Aug receipts
  predate the client cut).
- Evaluator check per the work order: crafted board, law on/off, sequences must differ.

## 5. UI receipts (no action, for your conformance eyes)

Law glow follows `_lawSt()` (tent burns mid-road on m25); active law stations explain the mechanic
in plain words, poems stay on quiet stations; boss intros and tonight-info speak the memo sentences;
the throne level is built (roofless hall, horse avatar with Regulus, court-of-an-absent-king
roster, braziers per rung, reach animation).
