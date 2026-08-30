# Work order: the throne's law — level three

**30 August 2026. For Design and Code.** The third shippable level. With the heart and the hideaway
this completes the friends-demo trio: three quadrants, three verbs, three characters.

> **Strikes from her station carry two stations. At the far one, the card fights as it was printed.**

## The level

- **Mansion 10, the throne.** Regulus, the little king — al-Jabha's crown group, Maghā's royal
  throne, one of the strongest cross-tradition matches in the deck (Arabic and Indian both crown
  Regulus; the Chinese sky watched the Serpent's heart instead — a good grimoire line).
- **Position: the door.** Standard window, the mansion's own station first on the road. No sliding,
  no exception — this law passes at position 1.
- **The law is the Suzaku quadrant grant as a place**, side-neutral: whatever stands on her station
  — either side's card — strikes two stations away as well as one, using its **printed** faces at
  the far station. The reach fires whether or not the near strike lands. It crosses an empty middle
  station; the printed-faces clause keeps a pumped face from carrying.
- Why the grant and not the signature: the throne's own signature ("whatever it takes fights one
  higher") is number-class — the dangerous family. This is the fallback rule working as designed:
  signature first; if the signature is worth-or-safety class, the quadrant grant.
- **Pedagogy:** every player who fights the throne learns the Suzaku grant as a place before any of
  their seven Suzaku cards offers it at level 2. Second use of the boss-fight-as-tutorial loop.

## The tables (mansion 10's night, same-night baselines, 896 boards a cell, two seeds)

| gate | plain | the law | delta | bound | |
|---|---|---|---|---|---|
| seat, fresh | +7.3 | +10.4 | **+3.1** | ±8 | pass |
| seat, deep | +16.4 | +18.5 | +2.1 | ±8 | pass |
| skill, fresh | +4.4 | +8.9 | +4.5 | positive, ±5 | pass |
| skill, deep | +29.5 | +27.9 | −1.6 | positive, ±5 | pass |
| byakko / suzaku / seiryuu / genbu | 24.0 / 55.6 / 64.8 / 34.5 | 24.4 / 53.9 / 65.5 / 36.2 | **+0.4 / −1.7 / +0.7 / +1.7** | ±10 | pass |
| level / close / blowout | 9.0 / 27.1 / 27.5 | 8.4 / 25.4 / 29.6 | — | stable | pass |

The cleanest pass of the three shipped laws, with no position exception required.

## For Code

- Map entry: `lawAt = { 18: {station:1, kind:"beat"}, 25: {station:5, kind:"shell"}, 10: {station:1,
  kind:"reach"} }`.
- Reference dial `reachAt` in `research/v2.js`; the three acceptance vectors are the `reach law`
  entries in `research/wardvec.js` (16 vectors green in that suite; 92 across all six).
- The printed-faces clause matters: the far strike must read the POOL faces, not the played card's
  current faces — vector "printed faces at the far station" is the check.
- Whole-night scope, same `_bossRule` gate as the other two. Evaluator check as always: crafted
  board, law on/off, sequences must differ.

## For Design

- Law line, in the register: *from her seat, a strike carries two stations. at the far one, the
  card fights as it was born.*
- The reach wants to be SEEN: the strike leaping the middle station is the most animatable law yet.
- Avatar per the bank: station 10's animal is the **horse**, Sun-kept, on Regulus — the mark is the
  little king's star.

## Parked, honestly

**The gate** failed at +21 fresh seat and +34.6 Genbu — the one-time expiry does not fix the deny
family. **The gathered stars** is the same family and was not run. Byakko's whole identity is
denial, so its seven mansions are now the standing design problem, exactly as the hideaway was:
they need sentences that express holding without gifting the leader. Ideas welcome; the harness is
free. Deny-class scorecard: zero for four. Fight-class: two for two. Count-class: one pass
(conditional, mid-road), two fails.

### Files

`research/v2.js` (`reachAt`, plus `gateAt`/`holdAt` kept for the record), `research/wardvec.js`,
`research/thronelaw.js` / `thronelaw0.js` + `.out`, `research/gatelaw.js` + `.out` (the failure,
kept so nobody re-runs it).
