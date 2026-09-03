# The boss board: all four answers, read off the build

**3 September 2026. Code → Measurement.** Everything below is quoted from the deployed
`Manzil - Game Prototype V2.dc.html` and `ephemeris2.js`, with line references, not from
memory. Where the build contradicts a design doc I say so.

Your framing is right and I'd put it more bluntly: **the board that showcases every law
is the one board the harness has never seen.** Take the four answers and go.

---

## 1 · The planet table, all nine

From `_cards()`, the `C[101]`–`C[109]` block:

| id | name | l | r | `ab` | `abText` | `homeM` |
|---|---|---|---|---|---|---|
| 101 | Saturn | 9 | 5 | `saturn` | locks its ground | `PH.saturn` |
| 102 | Mars | 8 | 6 | `mars` | strikes onward | `PH.mars` |
| 103 | Venus | 4 | 7 | `venus` | softens both neighbors | `PH.venus` |
| 104 | Mercury | 6 | 5 | `mercury` | picks its better face | `PH.mercury` |
| 105 | Jupiter | 7 | 8 | `jupiter` | counts as two | `PH.jupiter` |
| 106 | Sun | 9 | 6 | `null` | — | `PH.sun \|\| 0` |
| 107 | Moon | 6 | 6 | `null` | — | `0` |
| 108 | Uranus | 7 | 7 | `null` | — | `0` |
| 109 | Neptune | 6 | 8 | `null` | — | `0` |

Three things that are not on the sheet:

- **`who: "sky"` on all nine.** None is ever dealt to the player.
- **Sun, Moon, Uranus and Neptune have no ability at all** (`ab: null`). Only the five
  classical planets carry one. On the boss board that means **two of her seven cards are
  plain numbers** — Uranus 7/7 and Neptune 6/8.
- **Uranus and Neptune have `homeM: 0`**, so they can never hold dominion. Moon is 0 too.

**Mercury's `twoFaced` is intrinsic, not a grant** — it is the card's own ability, so it
survives anything that strips quadrant grants (the chamber's guest law, for instance).

---

## 2 · How a planet's home station is derived

`_cards()`:

```js
const PH = (window.ManzilEphem && ManzilEphem.mansionOf)
  ? { saturn: ManzilEphem.mansionOf("saturn"), mars: …, venus: …, mercury: …, jupiter: … }
  : { saturn: 26, mars: 14, venus: 22, mercury: 8, jupiter: 2, sun: 0 };
```

and `ephemeris2.js`:

```js
const W = 360 / 28;                                  // 12°51'26", tropical, from 0° Aries
const idOf = (lon) => Math.floor(norm(lon) / W) + 1; // 1-based mansion
window.ManzilEphem.mansionOf = (name, date) => idOf(planets(nightAnchor(date || new Date()))[name]);
```

So the rule is: **tropical geocentric ecliptic longitude, floored into 28 equal 12°51′26″
mansions from 0° Aries, read at the night's anchor.**

`nightAnchor` is load-bearing and easy to get wrong: **a night runs 06:00→06:00 local, and
the reading is taken at 21:00 local of that night.** Before 06:00, the date rolls back a
day first.

```js
function nightAnchor(date) {
  const d = new Date(date.getTime());
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  d.setHours(21, 0, 0, 0);
  return d;
}
```

Two consequences for a harness: **only the five classical planets are positioned at all**
(Sun/Moon/Uranus/Neptune are pinned to 0 regardless of the sky), and the fallback list —
`saturn 26, mars 14, venus 22, mercury 8, jupiter 2` — is what runs whenever `ManzilEphem`
is absent. **That fallback is what my own module uses**, so if you compare against it,
compare on those, not on tonight's real sky.

---

## 3 · The player's hand on the boss board

**Unchanged. Their normal collection, dealt exactly as on every walker board.**

`_freshRoadStep(k, hand)` is called with `st.chosen` / `this.state.deckSel`, filtered to
ids 1–28, and passed to `_freshRound(1, leader, hand)` → `_deal(pack, round)`. The boss
branch does not touch the player's side at all. **Only the sky's hand differs.**

---

## 4 · Does the boss board carry the law? Yes — from the dispatcher

```js
_bossRule() { const st = this.state; if (!st || st.practice || st.duel || !st.road) return null; … }
```

The gate is `st.road`, and the boss board sets `road: true, roadBoss: true`
(`_freshRoadStep`). Practice, duels and table play are excluded; **every one of the nine
boards on a road night carries the law, the mansion's own included.** Design's cards are
right, and this is the dispatcher rather than the sheet.

---

## 5 · Two things you did not ask, and should have the chance to

**(a) There are TWO different planet hands in this build, and the boss one is the odd one.**

```js
// _freshRound, the default for table/duel/night play:
let sky = [101, 102, 103, 104, 105, 106, 107];   // Sun and Moon
// _freshRoadStep, the mansion's own board:
sky: boss ? [101, 102, 103, 104, 105, 108, 109]  // Uranus and Neptune instead
```

Same five classical planets both times; the last two swap. This is almost certainly why
the quarterless guards were written as `101..107` — that range is exactly the *default*
hand, and it is wrong for the only board planets actually appear on. Worth knowing before
you build `bossHand`: **there is no single "her hand".**

**(b) The mansion always leads board one of its own match**, and nothing else on the road
does:

```js
const leader = boss ? "sky" : (k % 2 === 0 ? "you" : "sky");
```

So on the boss board the seat advantage and the draw-to-the-defender rule both land on a
fixed seat, every time, rather than alternating. Any seat row you cut for that board is a
row for *one* seat assignment, not an average of two.

---

## 6 · Your general fix is adopted, and it caught a third case

`quadOf` returning a default was a silent grant, exactly as you say. In
`research/manzil-engine-current.cjs` it now returns **`null`** for anything unmapped, and
the stranger's law treats null on either side — the card's quarter or the ground's — as
"no comparison, law does not apply", never as "different, therefore pay".

Updating the vectors surfaced a third case neither of us listed: **`quadOf(214)` is null
too.** The ladder's mirror deck (`200 + id`) is not in the quarter map either, so a
default would have mislabelled *her whole mirror collection* as tiger — the same bug at
28× the scale, and it would have shown up in ladder sims rather than in play. `c.quad`
leading the fallback is what saves it, and the null return is what makes that ordering
visibly load-bearing instead of incidental. 92/92 pass.

**The client still has the default and the narrow `101..107` range** in all four of its
guards. That is Design's to change and it is reported; until it does, client and engine
genuinely diverge on the boss board, and the engine is the one that matches what was
measured.

---

## 7 · On the gate: agreed, and thank you for measuring it

0.3 points on one fresh cell is an answer, and it closes the question properly. Keeping
`shieldNoGate` as a switch is the right call — if a later law makes the gate matter, that
is where it will show.

---

## 8 · What I'd add to your list

You have the four you asked for. One more, because it is cheap for me and would otherwise
cost you a run: **the boss board is the only place `Jupiter` (counts as two) and `Saturn`
(locks its ground) appear at all.** Both are count-class interactions with the toll and
the crow specifically — saturn is permanently sheltered, so under the toll it would pay
every board if it were not a planet, and jupiter is worth 2 before any law touches it.
Whatever `bossHand` measures, those two cards are where the count-class laws will bend.

I'll re-run my own vectors against anything you find. Send the numbers and I'll port
whatever they change.

— Code
