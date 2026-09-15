# The ship, read: one blocker, a lot landed under the surface, and the surfaces have not caught up

**15 September 2026. Measurement → Code and Design.** Two climbs and a full nav tour on staging after
tonight's ship, at desktop width (2304x1208 CSS, dpr 2). Everything below was taken from the running
build: the state records through `window.manzil.state`, the console, and the DOM's own computed styles,
not from the screenshots alone.

The short version. **The moon road is unplayable past the first board**, and the cause is precise and
small (section 1). Underneath, a great deal landed and landed correctly: the settle record with all five
terms, `tonight`, `stations[i]`, slot names on both sides, the copy table and the timing table bound as
one source of truth (section 2). What has not caught up is the surface: there is still no verdict card,
no captions on the scales, and the dawn reveal is the 14 Sep centre-stage duel, not the shelf (section 3).
Two nav destinations are dead (section 4). And the familiarity law has quietly become the hardest thing
to read on the board (section 5).

---

## 1. The blocker: every walker road stalls after one board

**Symptom.** Play a board on the moon road. The count resolves, the scales tilt, the series pip fills,
and then nothing: no verdict, no next board, no control. `state.phase` stays `play`, the road stays full,
the hand keeps its two held cards. Reproduced twice, once winning 6-5 and once losing 3-10, so it is not
about who takes the board. The series is simply lost; returning to the table starts a new one.

**Cause.** One exception, thrown every time:

```
TypeError: Cannot read properties of undefined (reading 'slice')
  at Component._advanceRound (<anonymous>:291:71)
```

The expression is `this._walkerFor(this._tonight()).hand.slice(...)`. `_walkerFor` resolves, but the
record it returns has no `hand`:

```js
_walkerFor(19) -> { name:"kori", fig, them, line, react, defeat, again }   // no hand
```

I walked all twenty-eight: **0 of 28 walker records carry `hand`.** The walker sheet v2 landed as a
*replacement* for the roster records rather than as the addition of one field (`them`) to them, and the
`hand` the round-advance needs to deal the next board's opponent went with it.

**Scope.** Every walker road, every night. The first board works because the opening hand comes from a
different path. **Two hands / pass-and-play is unaffected** — I played it to board two and it advanced
cleanly, because the duel path never calls `_walkerFor`. That isolation is the confirmation.

**Fix.** Restore `hand` on the roster records (merge the sheet's five fields into the existing records
rather than over them), or give `_advanceRound` a fallback. One test that would have caught it: assert
every `_walkerFor(n)` for n in 1..28 returns a record with a `hand`.

## 2. What landed, and is right

- **The settle record is complete and exact.** On a board I lost: stations 3/6, dominion 1/2, cards
  -1/2 with notes naming the void at station 3, the void's neighbour at 4 and the chamber at 6, law 0/0,
  dawn duel with both pairings tied and her third unopposed, total 3/10, reason `stations`. The five
  terms sum to the total on both sides. This is item 1 plus Code's cards term, exactly as specified.
- **`state.tonight`** carries night, house, law, window and marker. **`state.stations[i]`** carries index,
  house, quadrant, ground and the quadrant rule for all nine.
- **Slot records name both sides**: every slot has `name`, `homeM`, `quadrant`, including hers.
- **The copy table is bound**: 98 rows under `manzil._copy`, six moments, and `stage.timing.verdict`
  is byte-identical to `TIMING.verdict` — one source of truth, as asked. `deal.awake` reads
  "...stands awake with {them}", so the pronoun correction landed.
- **The station hover no longer lies.** It shows the house and a lore line instead of a law that was
  wrong on twenty-seven nights in twenty-eight.
- **The seat line is static.** "the last word is yours" on the road, "ana has the last word" at the table.
  The turn now has its own cue ("bo to play"), which is the right split.
- **Menus as places** exist: the ring (codex), the fence (ledger) and the gatepost (how to play) are
  marks in the lobby scene, and they hover properly — the label lifts and brightens on approach.
- **No black frame.** The destination is laid out before the change begins.
- **Level select is much better**: the moon's own position on the ring, "the moon is here - you're here",
  the house's road and board lines, and every ring mark is clickable.
- **Pass and play** ("same device, two hands", with named seats and "the near hand - parchment /
  the far hand - amber") is new, works, and is the best thing in the build for what comes next.

## 3. The surfaces have not caught up with the records

Everything in this section is a Design build against records that already exist, not new Code work.

- **There is no verdict card.** `state.verdict` is null at every point of a board. The tablet (1a) is not
  in this build. A board ends and says nothing about who took it or why.
- **There are no captions on the scales.** The settle record has the four lines' worth of arithmetic in
  it; the scales still tilt in silence. This is the finding from the 14 Sep review, unchanged, and the
  data to fix it is now sitting in state.
- **The dawn reveal is still the centre-stage duel.** Held cards fly over the walker and over the board,
  with "SHE TURNS THE CARD SHE KEPT BACK - YOUR STRONGEST AGAINST HERS" and "12 AGAINST 12 - EVEN,
  NOBODY SCORES" in letterspaced caps, gone in about a second each. The shelf (1d) is not in this build.
- **The moment machine is half-wired.** `state.moment` only ever reads `play` or `settle`. No `deal`,
  no `verdict`, no `road`.
- **Tonight's law is still nowhere.** `tonight.law` is null on m19 and there is no law line at the deal.
  Either the client's calendar has no law for the night or the field is not being populated; either way
  the deal's second job is still not done.
- **Level select has no law line** (`surfaces.select.law` is in the table, not on the screen).

## 4. The nav, cycled

Nine destinations. I opened all of them.

| destination | state |
|---|---|
| lobby | good; three scene marks, hover works |
| cards | works; the collection grid and the card page are strong |
| star shard | works; "north" is clipped off the left edge, and the quadrant labels read "seiryuu - east" |
| ledger | works; says "no house is claimed yet" while the road says tonight's house is claimed |
| codex | works, but opens with an empty right pane and the title still counts ("28 OF 28 HOUSES WALKED") |
| **how to play** | **dead** - the chip activates and nothing renders |
| **glossary** | **dead** - same |
| level select | works and is much improved |
| log out | not tested |

Two further things about the nav as a whole:

- **There are two navigations.** Three marks live in the scene; all nine live in a chip row that only
  appears on Escape, and nothing on screen says Escape exists. The three in the scene are the three that
  least need a shortcut; cards, star shard, level select and glossary are the ones a player wants, and
  they are the ones hidden.
- **The scene labels are 9.5px** at 0.8 opacity, with an 11px-tall hit target. The Escape chips are
  46x46 with 62px targets, which is right. The scene marks should match them.
- **A screen change takes about 800ms to become usable** (measured: ~300ms at zero opacity, then a fade
  reaching full at ~800ms). Design's own timing table says `screen.change: 300, changeMax: 350`. The
  black frame is gone, which was the big win; the duration is now the thing that is off, and it is off
  by a factor of two against the table the build already reads from.

## 5. The familiarity law has become the board's worst legibility problem

This account is at full collection, every card level four. The law that hides the names of cards you know
now means:

- **In hand: no card has a name.** Seven anonymous rectangles with two numbers each.
- **On the board: four cards named, four not**, with no visible logic. The rule is by card id, so her
  copies (201-228) keep their names while mine lose them, including after she takes one of mine. A player
  sees a scatter and cannot work out the pattern.
- **In pass and play it splits the two players.** The far hand deals at level one and shows every name;
  the near hand is level four and shows none. Two people at one table are reading different games.

The card data is all there (`abText`, `sig`, `quad` on every record), so this is a display rule, not a
data gap. My recommendation: **names stay on everywhere on the road and in hand.** The road is where a
player has to read fast. If the familiarity ritual is worth keeping, let it hide the *lore line* on the
cards screen, not the name on the table.

## 6. Smaller things, all quick

- An em dash shipped on level select: "shut until you have walked it — the moon returns here in 23 nights."
- Counters still on surfaces: "NIGHT 19 OF 28", "THE CODEX - 28 OF 28 HOUSES WALKED", "house 19 of 28",
  "one of 784".
- Caps labels still on surfaces: "THE NEXT TWO", "STAR SHARD", "YOU ARE", and the dawn lines above.
- Overlaps persist: "at the table tonight" under "DAWN - THE HELD CARDS"; "claimed by the jewel" drawn
  across a card; the dawn cards over the walker's name.
- Two things the delivery cover says shipped are not in this build: the night-is-open split is still
  there (the lobby's door goes to the two-column mode screen, not straight to the road), and the open
  tables still carry the long explainer and a "back" that the cover says were removed. Worth a check that
  the right file was merged.

## 7. The order I would take it in

1. `hand` back on the walker records. Nothing else can be judged until the road runs.
2. how to play and glossary: two dead destinations on a build that just shipped.
3. Names on, everywhere, on the road and in hand.
4. The verdict tablet and the settle captions, both against records that already exist.
5. The dawn shelf.
6. The scene marks to chip size, and the whole chip row into the scene.
7. Screen change to the table's own 300ms.

### Files

Console trace, state dumps and the `_walkerFor` walk are reproducible in a browser console on
staging; no files of mine changed. Prior: `research/THE-FLOW-14SEP.md`, `research/THE-MENUS-15SEP.md`,
`research/FOR-CODE-THE-FLOW-15SEP.md`.
