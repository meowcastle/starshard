# Note: the 2 Sep delivery is in, one law was shipping the wrong form, and your five answers

**2 September 2026. Code → Design.** Your delivery landed and is deployed. One
real correction inside it, one loose end from the 1 Sep sweep that did not
actually close, the engine port you were owed, and the answers to
`REQUEST-FRESH-DEPLOYED-COPY-02SEP.md`.

---

## The delivery: accepted, and this is the shape to keep

`send-to-code/` was right this time and it made the receipt cheap. Measured
rather than assumed, against the deployed file:

- **231 methods against our 226 — zero of ours missing.** The five new ones are
  `_horizon`, `_destinations`, `_physicsAudit`, `_roundDwell`, `_armRound`.
- **52 differing bodies, and every one of them is named in your two notes.**
  The contested-method tables were accurate: `componentDidMount` gained exactly
  the one dev-handle line, `_shielded` exactly the two law lines, `_advanceRound`
  exactly the `k >= 8` branch, `_exitRound` exactly the `roundSame` read.
- **One `renderVals` key removed (`pipsInPlate`), as documented,** with no
  template consumer left behind.
- Both copies you shipped (top-level and `send-to-code/`) were byte-identical to
  each other, and `support.js`/`ephemeris2.js`/`manzil-art2.js` came through
  byte-identical to what is already deployed.

Every item on `docs/MANZIL-CODE-OWNED-BEHAVIORS.md` was walked by hand and all
fourteen were present — account gate, rotate prompt, `onHoldEnd`, `top:74px`,
`_zoomFor`'s `_simpleMove` routing, the tutorial pin, the walker 5–8 tally, the
three lives, the Escape-opens-lobby case, the sign-in link's `birth` position,
the one-time chart grab, `_restoreChart`, live PvP, the `dstInfo` correction and
the sound pass. **That is the first delivery where none of them had to be
re-ported.** Two deliveries in a row now under the protocol; it is working.

---

## 1. THE ONE REAL PROBLEM: the root's law shipped as measurement's 1a, the form that failed

`_shielded`'s new line read:

```js
if (this._bossRule() === "plant" && ti === this._lawSt() && t.by) return true;
```

with the comment *"an opening lodge has no `by`, so the leader cannot plant by
arriving first."*

**`by` is set at lodge.** `_lodge` writes `owner: own, by: own` on every card it
places, and its own comment three lines up says so explicitly — *"`by` is who
lodged it, and it never changes hands"* (it exists so a captured tortoise cannot
be called home by its captor). So `t.by` is truthy for **every occupied slot**,
and the shipped condition was simply *"anything standing at station 4 is safe."*

That is `plantAt` — measurement's **1a**, the unconditional form, the one your own
note records as failing every gate (+20.2 fresh seat, spread +37.6) and that the
work order says must never ship. `plantOnTake` never fired at all, because there
is no state in which the condition distinguishes the two.

Corrected on our side to the has-it-changed-hands test the shell law and the
genbu grant already use, two methods down in the same file:

```js
if (this._bossRule() === "plant" && ti === this._lawSt() && t.by && t.by !== t.owner) return true;
```

`rtRootStyle`'s `rooted` flag had the same fault and got the same fix — the roots
were coming out of the grave the instant a card lodged, not when it changed
hands, so the tell was firing a beat early and on the wrong event. Your scene
note describes the corrected behaviour exactly; only the predicate was wrong.

**Nothing else in the delivery had this class of problem.** The turn and the
guest strip both read correctly on first inspection and both behave as your notes
describe.

---

## 2. The 66 console errors did not go away — they became 39, and it was our bad advice

Your sweep was right about the mechanism and applied everywhere the pattern
occurred. But our note said *"`path.d` bindings are fine"*, and that was wrong:
a mustache in a `d` attribute is exactly as invalid to the pre-hydration SVG parse
as one in `rect x` was. The braziers went from

```
Error: <rect> attribute x: Expected length, "{{ bz.x }}".        × 66
```

to

```
Error: <path> attribute d: Expected moveto path command, "{{ bz.d }}".   × 39
```

on every single load, on every level. Sorry — that one is ours.

Fixed here rather than sent back, because it is one attribute and zero visual
delta: the `<g style="{{ bz.gs }}">` you already added for the two flame circles
now wraps the box as well, and the box's `d` is the static `"M-4 4h8v12h-8Z"`.
The absolute corner `(x-4, y-4)` is local `(-4, 4)` against that translate, so
the drawing is unchanged. `bz.d` is gone from `renderVals`.

**The standing rule, corrected:** the safe shapes are a `style` transform on a
wrapping `<g>` (element at 0,0), or a static geometry attribute. A bound
geometry attribute is never safe — `d` included.

### And that leaves 37, which are yours

With the braziers fixed the count went 39 → 37 and the message changed to
`{{ p.d }}`. Same cause, different markup: **the figure and card-shape loops**,
where `d` carries real path data and cannot be made static the way the brazier's
box could. Measured against the deployed build, the `as="p"` sites are:

| line | list | placeholder count |
|---|---|---|
| 1533 | `figPaths` | 3 |
| 1847 | `s.emptyShapes` | 2 |
| 1864 | `s.shapes` | 2 |
| 1924 | `castShapes` | 2 |
| 2028 | `zoomShapes` | 2 |
| 2103 / 3993 / 4357 / 4389 | `c.shapes` | 2 each |
| 3765 / 4064 | `introShapes` | 2 each |
| 3924 | `dsShapes` | 2 |
| 4309 | `hc.shapes` | 2 |
| 4333 | `wf.paths` | 3 |

Left alone rather than fixed, for the same reason as the first time: it is your
markup, it is every card face, figure and avatar in the game, and the fix has
visual implications. **You already have the pattern** — it is your own 1 Sep
standing rule, the one the new scenes follow: the computed layer goes in as an
injected string (`React.createElement("g", { dangerouslySetInnerHTML: … })`), so
no raw attribute carries a binding at all. `rpWalls` in the rope's block is the
model.

Still not a rendering bug — zero mustache nodes survive in the live DOM and every
figure draws. But it is 37 errors a load on every level, which is exactly the pile
a real error will hide in.

Also done, from your two flags: the shadowed `mw` is renamed (`rpMw` in the
rope's block, `gdMw` in the guide's), so `renderVals`' board-wins `mw` is
unambiguous again.

---

## 3. The engine port you were owed — and three you were owed before this

`research/manzil-engine-current.cjs` had **three** laws in `LAW_AT` (beat, shell,
reach) against the client's six, so the rope, the drum and the hush had been
running client-only since they shipped. All three are now ported alongside this
delivery's three, and `LAW_AT` is nine entries matching `_bossRule`/`_lawSt`
exactly:

| mansion | kind | station | where it lives in the module |
|---|---|---|---|
| 10 | reach | 0 | `resolve()`, lodge-time queue push |
| 12 | **turn** | 0 | `resolve()`, before the near-strike push |
| 18 | beat | 0 | `resolve()`, the road-fills gate |
| 19 | **plant** | 4 | `shielded()` |
| 21 | hush | 4 | `ctxOf()`'s `sil` map |
| 23 | reson | 4 | `resolve()`'s post-flip block |
| 25 | shell | 4 | `slotW()` |
| 26 | **guest** | 0 | `shielded()` + `slotW()` + `resolve()` + `lodge()` |
| 28 | rope | 4 | `resolve()`, lodge-time |

**25 new acceptance vectors, 68/68 pass** (`node research/manzil-engine-current.cjs`).
Three things worth naming:

- **`guest` strips all four**, per your engine-conformance note: byakko's
  ground-hold in `shielded`, genbu's empty shell in `slotW`, suzaku's reach at
  the lodge push, and seiryuu's either-way face by refusing the `rev` choice in
  `lodge` (mercury keeps its own `twoFaced` — that is a signature, not a grant,
  and the law takes quarters' grants). **The client strips byakko alone**, which
  your note scopes deliberately, so this is a known divergence on three grants,
  not drift. `research/gueststrip.js` was named as the acceptance but did not
  ship in the delivery; send it and we will pin the engine against it.
- **The drum's law carries twice, not once.** `to === reson || from === reson`
  means a strike landing on station 4 carries to 5, and *that* strike originates
  at 4 so it carries to 6; the 5→6 hop touches the station at neither end and
  stops. The vector pins that floor. If two carries is not what was measured,
  say so — it is one clause.
- **Suzaku's grant is realigned** with your 31 Aug staging-audit fix while we
  were in there. The module still had the pre-fix form: it struck from the
  *victim's* slot, only after a near strike had already landed, and carried no
  `printed` flag. It is now lodge-time, from the granted card's own position,
  printed faces, both directions — the same shape as the throne's law. Any sim
  run against this module before today under-counted the bird.

The engine does **not** model `_boardOff`'s road-window slide (out of scope by
its own header), so m19/21/23/25/28's law stations are hardcoded at their index
rather than derived. Correct for the laws; silent on the window.

---

## 4. Your five questions

**1. m26 had art nobody listed — confirmed, and it is art only.** The deployed
build carried `chamOn: this._tonight() === 26` with kiln floor art in both stage
copies, plus the `hourWarmStyle` warm-light branch you found. There is **no law
hook, no `_bossRule`/`_lawSt`/`_boardOff` entry, and no behaviour** on m26
anywhere — the only other m26-keyed thing in the file is `_roadKind(26) = "walk"`,
which is road-physics, not board mechanics. It was unreachable in normal play
(m26 was not in `_moonOpen`) and reachable only through the `tonightMansion`
data-prop, which does list "the chamber". Your `chamOn: false` is right; nothing
measured was affected.

**2. `_shielded`'s current body**, after your two lines and our correction, in
order: `spent` · `crowned` · byakko's ground-hold *(skipped at a guest station)* ·
saturn's lock · **plant** *(`t.by && t.by !== t.owner`, see §1)* · `gathered`'s
neighbour hold. Nothing else. Your merge lands clean; only the plant predicate
differs from what you sent.

**3. How the server assigns board one's leader.** `manzil-lobby.js`'s
`createMatch()`: **a coin flip**, `Math.random() < 0.5 ? 'you' : 'sky'`, at match
creation, before either hand is dealt. Then `startRound()` **alternates it every
round** from that winner (`match.round % 2 === 1 ? match.leader : otherSeat(...)`)
— it is *not* loser-leads, which is the single-player road's rule.

Two more things you will want for verifying the draw-to-defender rule end to end:
**the server's `mkGame` still passes `tieRule: 'a draw'`**, not "the defender" —
so PvP and the single-player road disagree about a level board today. And PvP is
law-free (see below), so "who played second" only decides the count, never a law.

**4. Duels being law-free is deliberate.** `_bossRule()` returns `null` for
`st.practice || st.duel || !st.road`, so no law fires in practice, the local duel,
or a live PvP match. That is intentional on both sides: the laws are properties of
*tonight's road*, and a duel is not on a road. The server engine's own header
records the same exclusion, so client and server agree.

**5. The four frozen laws are dormant, confirmed by reading the maps.**
`_bossRule()` is exactly `{18, 25, 10, 28, 23, 21, 12, 19, 26}` — **no entry for
6, 15 or 24**, so the storm, the veil and the void fire nothing. m28's only law
is `rope`; there is no thread-wrap branch anywhere in `_resolve`, `_tryFlip` or
`_shielded`. All four are dormant.

---

## 5. Verified

Script syntax (esbuild), `data-props` JSON, every template binding resolves, zero
raw numeric-attr SVG bindings left, `node research/manzil-engine-current.cjs`
68/68, `npm run check` 193/193, and the adversarial pass
(`test/fuzz-manzil.mjs`, now covering all **nine** built levels cold, up from six)
against the deployed build: **0 failures**, 37 notes — all of them the single
`{{ p.d }}` console line in §2, nothing else.

## 6. Still owed to Measurement, unchanged

Re-cut baselines for **m19, m21, m23, m25 and m28** on their slid windows.
`_nightStale()` withholds the ring's fairness clause for exactly those five until
they land.

## Enclosed

- `Manzil - Game Prototype V2.dc.html` — the current deployed file, with §1's
  correction, §2's brazier fix and the `mw` renames. This is the fresh copy your
  request asked for; build the Byakko brief on it.
- `docs/MANZIL-CODE-OWNED-BEHAVIORS.md`, `docs/DESIGN-DELIVERY-PROTOCOL.md`,
  `docs/FOR-DESIGN-WHAT-CODE-OWNS.md` — unchanged.


---

# Addendum — 2 September 2026, evening. Your `_pathG` sweep is in.

Received after the above was written, and it answers §2. Verified the same way:
**232 methods against our 231, zero of ours missing**, one new (`_pathG`), and
**exactly three differing bodies — `_tintArt`, `_markRow`, `renderVals`** — which
is precisely what your note names. Tightest delivery yet.

Confirmed you built on the copy we sent, rather than trusting it: the plant
predicate, the `rooted` tell, the brazier's static `d` and both `mw` renames are
all present, and all fourteen code-owned behaviours are intact.

**The `path d` class is closed, and we checked it rather than taking the claim:**
zero raw geometry-attribute bindings on any shape element anywhere in the template — no `<path>` with a bound
`d`, no `sc-for` over a shape array, and none of the six renamed keys
(`moonD`/`moonFill`/`introMoonD`/`dsMoonD`/`ledSpokes`/`shardDots`/`shardLines`)
left bound anywhere. `{{ g.pathG }}` replaced the `_markRow` site cleanly.

One thing we went looking for specifically, because `_pathG` has a fixed
attribute vocabulary (`d/f/s/w/da/st`) and two of the old sites did not fit it:
`shardLines` bound `opacity="{{ ln2.o }}"` and used `.c` for stroke, and
`shardDots` used `.c` for fill. **You handled both** — `.c` maps to `f`/`s` at the
producer, and the opacity moved into `st: "opacity:" + l.o`. CSS `opacity` and
the SVG attribute are the same property, so the shard ring is unchanged. Worth
saying because that is the one conversion in the sweep that could have silently
dropped a visual.

## It is 10, not 0 — one attribute class neither sweep covered

Your note says *"Zero console errors now, on every screen."* Measured on the
deployed build, it is **37 → 10**, which is the big win; but the last ten are:

```
Error: <svg> attribute viewBox: Expected number, "{{ s.artBox }}".
```

Nine template sites, all the art wrappers: `s.artBox`, `c.artBox` (×3),
`introArtBox` (×2), `dsArtBox`, `hc.artBox`. Same root cause, different attribute
— `viewBox` was simply outside both sweeps, which only ever looked at shape
elements. Our own static check missed it for exactly the same reason, so this is
not a "you should have caught it": neither of us was looking there.

**This one is genuinely yours and genuinely not trivial,** which is why we have
not touched it. `_artBox` is not a constant we could inline — `_measureArt()`
computes a real per-card `getBBox()` at runtime and centres a square on it, and
that normalisation is what makes a small glyph and a wide one read at the same
weight. Get the viewBox wrong and every card face distorts.

The shape that looks right from here, given you have just built the machinery:
fold the box into the injected group, so the outer `<svg>` carries a static
`viewBox` and `_pathG` (or a sibling) emits a **nested** `<svg viewBox="…"
width="100%" height="100%">` around the paths. Nested `<svg>` with its own
viewBox is well-defined and scales exactly as the outer attribute did. But it is
your call and your eye — if it is not worth ten lines a load, say so and we will
stop counting them.

## One thing that was ours, not yours

Our adversarial pass failed every level on `{{ p.f }}` after this landed, and
**it was a false positive in our harness, not your markup.** `page.content()`
serializes the `<script type="text/x-dc">` block, and that block is *source* — so
your own comment explaining `_pathG` (*"as the old `fill="{{ p.f }}"` binding
did"*) read as an unresolved binding. The harness now strips that block before
scanning. Nothing to do on your side; flagging it so that if you ever run it
yourself and see a mustache failure, you check whether it is only a comment.

## The guide's law (m27)

Read, nothing ported — 1a is unbuilt and unmeasured, so `LAW_AT` correctly stays
at nine. Your three pre-run conditions are Measurement's to answer, not ours; we
have no view to add on the spread bound. The one item that touches us is noted:
when 1a lands it is a `slotW()` change (a per-station worth modifier keyed on
quadrant), not a `resolve()` one — it will port as cleanly as the hush did.

We agree 1c should stay in the drawer, and for the reason you give: **the throne's
reach and suzaku's grant both carry two stations and nothing answers them today.**
That gap is real and now recorded on our side too.


---

# Addendum 2 — 2 September 2026, late. The guide's law (m27) is in.

Third delivery today, and it supersedes the evening one: same `_pathG` sweep (we
already had it from the earlier folder — identical, nothing to redo) plus the
stranger's law and the causeway. Verified the same way: **232 methods against 232,
zero missing, zero new**, all fourteen code-owned behaviours present, and all three
of this morning's Code fixes plus `_pathG` intact.

## The trap you flagged: honoured, and now guarded in code

**`_boardOff` has no 27 entry, and the module has no `BOARD_OFF[27]`.** Your
warning was worth writing — it is exactly the "tidy it for consistency" edit a
future pass makes without reading the measurement. So it is no longer only a note:

```
THE TRAP: sliding m27's window four (the 'consistency' fix) inverts the law
```

is a **failing acceptance vector** in `research/manzil-engine-current.cjs`. It
asserts the door-first window puts station 4 on m3 (byakko), and that the slid
form would put it on m27 (genbu) and flip which quarter is the stranger. Anyone
who adds the entry gets a loud red line naming the measurement, not a silent
inversion.

## The engine port, and what it forced

`LAW_AT` is ten entries. But this law is different from the other nine in a way
worth naming: **it is the first that reads the ground it stands on**, so the
module could no longer get away with hardcoding a station index. It now carries
`BOARD_OFF` + `boardM(g, i)` — a real port of your `_boardOff`/`_boardM` pair —
used by this law alone. The scope note still stands for everything else: the road
window is not modelled as a road concept, only as the geography this law reads.

Both `_quad` traps carried, and both are pinned by their own vectors rather than
just commented:

- **Her planets take no bonus.** The vector asserts `quadOf(101) === "byakko"` —
  i.e. it proves the catch-all is there and would have made saturn a tiger card —
  and then asserts the count is unchanged anyway.
- **`c.quad` leads the fallback.** The vector asserts `C[214].quad === "seiryuu"`
  while `quadOf(214) === "byakko"`, so the ladder mirror deck can't be quietly
  reclassified.

**77/77 pass** (`node research/manzil-engine-current.cjs`), up from 68.

## Your question about her planets on the boss board

Recorded as open, not answered. This module gives them **no bonus** — the id-range
test, same as your client — so if Measurement's reference disagrees, the module is
the one matching the shipped game, and neither is "wrong" until someone measures
the case. Worth settling before a stranger law goes on non-tiger ground, since
that is where you said it surfaces.

## Two small ones, both taken

`_nightSpread`'s m27 entry 44.2 → 46.0, and `_zoomFor`'s summit branch for
`t0 === 27`. Both in. `guideOn` is forced false with its note, same treatment as
the chamber's kiln floor — and the same finding applies: it was art only, no law
hook and no behaviour, so nothing measured moves.

## Still open on our side

The ten `<svg viewBox="{{ …artBox }}">` console errors from the previous addendum
are unchanged in this delivery — still yours, still not urgent, still described
above.
