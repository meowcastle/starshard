# For Code: the plumbing under the flow, to start now

**15 September 2026. Measurement → Code (cc Design).** `THE-FLOW-14SEP.md` and `THE-MENUS-15SEP.md` are Design's notes: what the screens should say and how they should move. This is the list of what has to exist underneath before Design can build any of it, ordered so each item ships on its own and none of it touches a file Design is editing. The standing rule holds: Code owns the engine and the runtime, Design owns the `.dc.html` surfaces, and no file is edited by both in one cycle. Everything below is engine or runtime; where a surface has to change to consume it, that change is Design's and is named as such.

Seven items. The first two are the ones Design is blocked on. The third is the one bug that may be a rules error. The rest are the runtime fixes that the menus note needs.

---

## 1. The settle record: one object that says how the board was counted

**The problem it solves.** The scales show a number that is stations plus dominion plus dawn and nothing itemises it (`THE-FLOW` 2.A). Design cannot caption the scales because the client hands the surface a total, not the parts.

**What to build.** At the end of every board, before the winner is announced, the engine emits a single record and the runtime exposes it on `window.manzil.state.settle` (and fires an event, `manzil:settle`, with the same object). Shape:

```js
settle = {
  stations: { you: 5, sky: 4 },                 // lodged cards, plain count
  dominion: { you: 1, sky: 1 },                 // whatever the rule actually grants, per side
  dawn: {
    form: "duel",                               // the form in force; "none" when dawn is off
    held: { you: [{id:21,total:11},{id:9,total:11}], sky: [{id:202,total:12},{id:223,total:11},{id:213,total:11}] },
    pairs: [ {you:{id:21,total:11}, sky:{id:202,total:12}, to:"sky"},
             {you:{id:9,total:11},  sky:{id:223,total:11}, to:null} ],
    unopposed: [{side:"sky", id:213, total:11}],
    points: { you: 0, sky: 1 }
  },
  law: { night: 5, name: "the price", points: { you: 0, sky: 0 }, notes: [] },   // any law that touches the count, itemised; empty otherwise
  total: { you: 6, sky: 6 },
  level: true,                                  // total equal
  levelTo: "sky",                               // the defender, when level; null otherwise
  winner: "sky",
  reason: "level"                               // "stations" | "dominion" | "dawn" | "level" | "law": the last line that decided it
}
```

`reason` is the one field Design will read most: it is the word that becomes the loss line ("her held pair outweighed yours at dawn" / "a level board goes to the defender"). Compute it as the first component, in order stations → dominion → dawn → law → level, after which the running total's sign matches the final winner and never changes again.

**Invariants to assert in the module, so this cannot drift:** `stations.you + stations.sky ≤ 9`; `total.side === stations + dominion + dawn.points + law.points` per side; under `form:"duel"`, `dawn.points.you + dawn.points.sky ≤ min(held.you.length, held.sky.length)`; `held` totals are printed `l + r` from the card table, never the slot's faces.

**Fixtures.** The three dawn cases in `research/conformance.json` already carry `hands` and expected `counts`; extend each expected block with the `settle` shape above and run them through the client's end-of-board path, not only the module's (see item 3). I will add the `settle` expectations to the pack today so `conform-code.js` checks them.

## 2. The verdict record and the phase machine

**The problem it solves.** The win card, the loss card, the between-boards card and the rung card are four different surfaces reading four different bits of state (`roundWins`, `roadRung`, `lives`, `roadWalker`, `nightWalker`), and each shows what it happens to know. Design wants one card with one payload.

**What to build.** A `verdict` object on `state`, emitted after `settle`, and a named phase sequence the runtime walks through so the surface never has to guess what comes next.

```js
verdict = {
  kind: "board" | "series" | "rung" | "climb",  // the largest thing that just ended
  board:  { winner:"sky", totals:{you:6,sky:6}, reason:"level" },      // from settle
  series: { format:3, need:2, wins:{you:0,sky:1}, over:false } | null, // null on singles
  rung:   { index:4, name:"the fifth rung", won:false, over:false },
  lights: { standing:2, cap:3, lost:true },                            // lost: a light went out on this verdict
  climb:  { over:false, cleared:false },
  walker: { id:"hult", name:"hult", lines:{ in:"...", out:"...", ready:"...", next:"..." } },
  next:   { walker:{...} | null, leader:"you" | "sky" }                // who is ahead and who leads the next board
}
```

And the phases, as the runtime's own sequence with a fixed name for each step: `deal → play → settle → verdict → road → deal`. `state.phase` today has values like `play`, `round`, `roadlost`; keep those as aliases if surfaces read them, but add `state.moment` with exactly those five names and a `manzil:moment` event on each change. Design builds one surface per moment (`THE-FLOW` section 3) and keys everything off `moment`.

**Durations belong to Design.** The runtime should read the length of each moment's ceremony from a table Design owns (`stage.timing`, a JSON object in Design's file or a sibling file Design edits), with the runtime supplying defaults (settle 2400 ms, verdict until tap, road 900 ms). Code owns the machine; Design owns the numbers.

## 3. The dawn count on the live client (possible bug)

Blaze, fifth rung, first board, 14 Sep, `state` read after the board: road `you` = {214, 216, 211, 212, 25}, `sky` = {10, 7, 17, 27}, so 5 v 4. Held: `you` = [21, 9] (printed totals 11 and 11), `sky` = [202, 223, 213] (12, 11, and one I could not read). The scales showed 6 v 5, then 6 v 7, and "hult wins".

Reading it: 6 v 5 is 5 v 4 plus dominion, and 6 v 7 is the sky taking two at dawn. That is legal under duel only if her unread card was 12 or better, so that her two strongest (12 and 12) each beat an 11. If it was 11 or lower, the second pairing was 11 against 11 and should have scored nobody, leaving 6 v 6 and a level board to the defender, which is still her win but by a different reason and a different line. I cannot tell from the outside; the settle record in item 1 will say. Please run the three dawn fixtures through the client's end-of-board path (the module passed them on 14 Sep; the client's count may be a second code path) and confirm the form in force is `duel` with ties to nobody, as decided. Not a confirmed bug; a board whose count I could not reproduce by hand, which is itself the finding.

## 4. Tonight's law and the ground, as data the surface can read

**The problem it solves.** The station hover shows the station's own law on every night ("mansion 9 … strikes two lower from here", with em dashes), which is wrong on 27 nights out of 28 (`THE-FLOW` 2.B). The surface is reading a per-mansion string where it should be reading tonight's.

**What to build.** Two things on `state`:

- `state.tonight = { night: 5, house: "the blaze", law: { key:"price", line:"the price. a card at the middle that cannot be taken strikes two lower." }, window: { tonight: 5, offset: 0 }, marker: { station: 4 } }` — the law's key, its one-line sentence (from Design's copy table, item 6), and which station index carries the marker (the crossing, the door, or none). Station indices are 0-based reference, as everywhere in the module.
- `state.stations[i] = { index: i, house: "the glance", quadrant: "vermilion bird", ground: "holds" | "open", quadrantRule: "the ground holds: this card cannot be taken." }` — the ground facts only. No law text on a station unless `state.tonight.marker.station === i`.

Design then rewrites the hover to read `stations[i]` and the marker to read `tonight.law.line`. The per-mansion law strings stay in the codex, where they are correct.

## 5. Her cards carry their names; ownership is data, not colour

`state.slots[i]` today is `{id, owner, l, r}`. The surface names the player's cards by looking up `id` in the card table and leaves the sky's nameless because mirror ids (201 to 228) miss the lookup: the same `id >= 101` / `<= 107` family of guards flagged in `FOR-CODE-THE-COPY-READ-14SEP.md`. Add `name`, `homeM` and `quadrant` to every slot entry, resolved by the engine for both sides, so no surface needs to know that 214 is the sun. While there, this is the moment to close the `isQuarterless(id>=101)` and `<=107` guards from that note; the settle record's `held` lists will be wrong for mirror ids until they are.

## 6. The copy table: strings out of the runtime

Every sentence the game shows should come from one object Design owns (`stage.copy`, keyed by moment and reason), with the runtime doing only substitution: `copy.verdict.loss.dawn = "{walker} takes the board. {you} against {sky}: her held pair outweighed yours at dawn."`. The runtime supplies the keys the surface may ask for (`walker`, `you`, `sky`, `rung`, `lights`, `series`, `next`) and never a hard-coded sentence. This is what lets Design replace the tārābala lines, the caps labels and the "0 of 28" counter without a Code cycle. Code's part is the substitution and the list of keys; the strings are Design's.

## 7. The runtime fixes the menus note needs

Each is small; together they are most of the felt stiffness (`THE-MENUS` sections 2.1 to 2.4).

- **The black frame.** Every sub-screen (cards, star shard, ledger, codex, level select) passes through a fully black frame and fades up over three to five seconds; the star shard paints its text over the lobby first and re-lays. Almost certainly an opacity fade on the app root rather than the screen, plus content laid out after the fade begins. Lay the destination out first (it is small; there is no data to wait for), then crossfade the two screens over 250 to 350 ms, and never let the root go to zero. Check this one before anything else: it is the single largest change in feel for the smallest diff.
- **Stale DOM across moments.** The previous scene name, the previous walker's name and the previous hand are still in the tree when the next rung's title draws; "the low air" and "the daylit ground" are both legible at once. Each moment should unmount the last one's text before the next mounts, or the crossfade should be on one element whose content changes, not two elements overlapping.
- **Clickable during ceremony.** "ON UP THE ROAD" is live while the board is still sharp, so a fast tap skips the steps-aside card entirely. Gate input on `moment === "verdict"` having fully arrived (the timing table in item 2 says when).
- **Tooltip persistence.** The station tooltip stays while the pointer rests and covers a third of the road; the hand-card tooltip covers the deck buttons. A hover delay (about 300 ms), dismiss on any pointer-down, and a position rule that keeps the tooltip beside its card and never over a control. Design chooses the position; the runtime supplies the delay and dismissal.
- **Level-select scene box.** Walking to a house the moon is not in rendered the scene in a 1390 by 660 box with the mode-select overlay clipped until a window resize. Something is sized on first paint and not on scene change; a resize observer or a re-measure on scene change.
- **Camera transform hook.** For `THE-MENUS` 2.2, expose one runtime call, `stage.look(target, {ms, ease})`, that translates and scales the lobby scene as a unit (targets: `road`, `hand`, `ring`, `fence`, `sky`), so Design can attach each menu to a look without touching the scene's own layout. If the sub-screens are separate layouts stacked over the lobby, the cheap version is to transform the lobby underneath in the direction of the reveal; the eye still reads one scene.
- **Hover states.** Nothing on the menu row responds before the click. This is CSS and belongs to Design; noting it only so nobody waits on Code for it.

## Order

1 and 2 first, together, because Design's five surfaces are built on them. 3 next, because it may be a rules error and the settle record makes it visible. 4 and 5 are a morning each. 6 can land any time before Design's copy pass. 7's black frame is worth doing first of all if there is a spare hour, because it is the one change everyone will feel the same day.

What Measurement does in parallel: adds the `settle` expectations to the 27 cases today; runs the client path when it is exposed; nothing else is blocked on me.

### Files

`research/conformance.json` (dawn cases with `hands`), `research/conform-code.js` (the adapter), `research/FOR-CODE-THE-COPY-READ-14SEP.md` (the id guards), `research/THE-FLOW-14SEP.md`, `research/THE-MENUS-15SEP.md`.
