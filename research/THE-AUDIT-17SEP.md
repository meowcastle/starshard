# Star Shard / Manzil: a full audit, and what is actually outstanding

**17 September 2026. Measurement.** An audit of the whole project, not the week: the game's rules,
its content, its client, the apparatus that measures it, the platform underneath, and the business
plan the whole thing is queued behind. Sources are the project's own record, read rather than
remembered: `CLAUDE.md` (3,265 lines of running log), the 63 memos in `research/`, the 79 design
direction sheets in the current drop, the reference engine and its test packs, the API's routes and
schema, and yesterday's audit of the live staging build.

---

## 1. Where the project is, in one page

**The game is designed. The game is measured. The game does not currently run.**

That sentence is the audit. Every rule of Manzil is decided, every one of the twenty-eight houses has
a law that was measured before it was chosen, all twenty-eight have built scenes, 216 walkers have
their lines, and every string the game says is in one table. Underneath, the engine records the game
needs are live and correct. What is missing is the last mile on the surfaces, and one merge error that
makes the single-player loop end after a single board.

| layer | state | confidence |
|---|---|---|
| rules and balance | **done and measured**; the last open item (the level rule under dawn) closed 15 Sep | high, 163 vectors + 27 conformance cases |
| content: 28 laws | **all decided**, each measured before the pick | high |
| content: 28 levels/scenes | **all 28 built** (13 Sep, "all twenty-eight houses stand") | high |
| content: walkers | **216 records, five fields each, final v2** | high |
| content: copy | **98-row table + timing table, final and bound into the runtime** | high |
| client: the road | **broken** - stalls after board one, every night | certain, reproduced twice with the stack trace |
| client: the surfaces | **behind the records** - no verdict card, no settle captions, old dawn reveal | certain |
| client: the nav | 7 of 9 destinations work; how to play and glossary render nothing | certain |
| backend | **more complete than expected**: full auth, progress, decks, export, delete, sockets | high, read from routes + schema |
| commerce | **not started** - no Stripe, no entitlements, no receipts anywhere | certain |
| mobile apps | scoped 15 Sep, nothing built | n/a |
| audience | **zero**, by the plan's own admission, and it is the constraint everything hangs off | n/a |

**The one-line read:** this is a project with a finished game design, an unfinished game client, a
solid back end, no storefront and no audience. The engineering distance to "a good free game people
can play" is small and specific. The distance to revenue is the plan's own four phases, and we are
still inside Phase 0.

---

## 2. The game itself: settled

Everything in this section is decided and does not need revisiting.

**The board.** Nine stations, two-faced cards, bigger-or-equal takes, dominion adds one on a card's
home station, no chains. The leader places five and holds two; the follower places four and holds
three. A tie at a station goes to the attacker; a **drawn board goes to the defender**, and that rule
survived a five-form re-read on 15 Sep with dawn stacked on top of it (the defender reads −4.6 on a
fresh collection and +1.7 on a developed one, and holds more nights inside the seat bound than any
alternative).

**Dawn**, decided 14 Sep and measured four ways: when the road fills, the held cards pair off by
printed total, strongest against strongest, one station to the higher card, ties to nobody, the spare
card scores nothing. It halves the leader's seat advantage on the ladder (16 points to 8) and flips it
about as far the other way in even play, which is the symmetry we wanted. It also widens the gap
between careful and careless play from 9.3 to 13.5, which is the right direction.

**The walker leader rule**, decided the same day: the player leads the first board of every walker
rung. This is the single largest balance lever found in the whole project. It takes the fresh clear
rate from 30.2% to **40.9%** with no law and no change to even play, because the she-leads single
boards were where fresh climbs died (58-59% against 74% from the other seat).

**The format**: rungs one to four a single board, five to eight best of three, the mansion best of
five, three lanterns, a lost rung retried, loser leads within a series.

**Difficulty**: the opponent is always a mirror of the player's own collection, tuned by a shrinking
handicap and a caution dial from 0 to 8.

**The 28 laws** are all decided, and the record of how is unusually good: each was drawn as a
directions sheet with two or three measured options, and the losing options are recorded as dead. The
nine remaining houses were measured as one batch on 13 Sep and decided the same day.

### The three balance questions still open

These are real and they are Design's, not mine. All three were raised in `THE-CLIMB-14SEP.md` and
none has been answered in writing.

1. **No target clear rate exists.** The measured curve is fresh 30%, a month in 25%, full collection
   **7%** for a careful player. Nobody has written down what it should be. Until that exists, "is the
   game too hard" cannot be answered, only argued.
2. **Difficulty inverts with progression, and there is no lever left.** A player with everything at
   level three clears one climb in fourteen; the same player with five awake cards clears one in three.
   The cause is structural: the opponent is a mirror, so nothing the player collects can move the
   number, because she collects it too. The handicap fades to zero and the caution dial maxes out. A
   full mirror is a coin flip plus the seat. Three families of fix exist and are measurable in a day
   each (hold a residual handicap at full, cap her caution below the player's, or make the deep
   opponent something other than a mirror once the planet hand lands) but the direction has to be
   chosen first.
3. **The storm is unclearable.** m6 reads 3% fresh and 0% at every deeper collection: two lanterns, no
   handicap, caution plus two, every rung a best of three. Whatever the hardest road was meant to be,
   at present it is the road nobody finishes.

A fourth, smaller one: the hush nights m15 and m21 lean 13 to 19 points to the follower, and the
option to fix it (the leader form of the level rule on those nights) **doubles their clear rate on the
ladder**, so it should stay off the road and live only at the two-hands table, if anywhere. That note
went out 15 Sep and is awaiting your sign-off with one correction: the exception has to be the
district's own line, not the hush's, because the veil has the hush too and keeps the defender.

---

## 3. The client: one merge error and a surface backlog

**The blocker.** Every walker road stalls after its first board. `_advanceRound` reads
`this._walkerFor(this._tonight()).hand.slice(...)`, and `hand` is undefined on **all twenty-eight**
walker records. They come back as `{name, fig, them, line, react, defeat, again}`: the five-field
walker sheet landed as a replacement for the roster records instead of adding `them` to them, and the
hand that deals the next board went with it. The two-hands path is unaffected and advances cleanly,
which is what isolates it. One exception, thrown every time, reproduced winning and losing.

This is a one-field fix, and it is the only thing standing between the current build and a playable
game. It also has an obvious guard: assert that every `_walkerFor(n)` for n in 1..28 returns a record
with a hand.

**What landed underneath and is correct.** This is the good news of the last cycle. The settle record
carries all five terms (stations, dominion, cards, law, dawn) with notes naming the cards that moved
the count, the dawn pairings, and a one-word reason; the invariant holds on real boards. `state.tonight`
and `state.stations[i]` exist with the specified shapes. Every slot carries a name for both sides. The
copy table and the timing table are bound as a single source of truth. Menus-as-places is built for
three destinations with proper hover. The black frame between screens is gone.

**What the surfaces still owe**, all of it now buildable against records that already exist:

- **No verdict card.** `state.verdict` is null at every point of a board. A board ends and says nothing
  about who took it or why. The tablet was picked (1a) and drawn; it is not in this build.
- **No captions on the scales.** The arithmetic is in state; the scales still tilt in silence. This is
  the finding from the 14 Sep flow review, unchanged, and the data to fix it is now sitting there.
- **The dawn reveal is still the old centre-stage duel**, caps lines over the walker and the board. The
  shelf (1d) was picked and drawn; not in this build.
- **The moment machine is half-wired**: `state.moment` only ever reads `play` or `settle`.
- **Tonight's law is still nowhere**: `tonight.law` is null and there is no law line at the deal.
- **Two dead destinations**: how to play and glossary both activate and render nothing.
- **The familiarity law has become the board's worst legibility problem.** At full collection the hand
  has no names at all, the board shows four named and four not with no visible logic (the rule is by
  card id, so her copies keep names and yours lose them), and in pass-and-play the far hand shows names
  while the near hand does not, so two people at one table read different games.
- Smaller: counters back on surfaces ("NIGHT 19 OF 28", "28 OF 28 HOUSES WALKED", "house 19 of 28"),
  caps labels, one em dash on level select, quadrant transliterations instead of english names,
  overlapping text at dawn, a screen change measured at ~800ms against the timing table's own 300.

**One process flag.** Two changes the 15 Sep delivery cover says shipped are not in the build (the
night-is-open split is still there; the open tables still carry the long explainer that the cover says
was removed). Worth confirming the right file was merged, because a cover that does not match the
build is how the walker-sheet regression got through.

---

## 4. The measurement apparatus: healthy

Worth stating plainly because it is an asset and it is invisible from the outside.

- `research/v2.js`, the reference engine: 1,051 lines, ~135 dials, every law and every candidate form
  ever considered, including the dead ones. **163 vectors green.**
- The conformance pack: **27 cases** across 15 laws, now carrying five-term settle expectations and the
  invariant, plus an adapter (`conform-code.js`) that runs the same cases against Code's module and
  compares term by term.
- Runners for whole climbs under the live ladder (`climb.js`), the 28-window mirror sweeps (`runN.js`),
  the format's exact clear-rate DP (`format.py`), and the draw table (`drawtab.js`).
- A convention that has held: 896 boards a cell, two seeds, vectors before any number, same-night
  baselines. Two real bugs were caught by it this month (a phantom delayed strike in my own engine, and
  a mirror-deck guard in Code's that got four laws wrong on eight boards in nine).
- The game also has its own **proving ground**: a dev drawer in the build that plays whole climbs
  headless through the client's real methods, with a night-by-depth heat grid and telemetry export.

**What is outstanding on my side:** a re-run of the 27 cases against Code's current module (waiting on
the module), the six stale nights Code mentioned (waiting on which six), the hush fixture (waiting on
your sign-off), and a pre-ship smoke check, which is the thing that would have caught this week's
blocker and which I offered to write.

---

## 5. The platform: better than the game's front end

Read from the routes and the schema, not from memory.

**Built and real:** full account system (signup, login, logout, email verification with its own
migration, password reset, age check), birth data, deck state, `manzil_pack` / `manzil_progress` /
`manzil_blocks` / `manzil_reports`, sigil, recollection, a guestbook with admin and per-IP views,
window state, **`GET /api/me/export`** and **`DELETE /api/me`** with cascade on every table.
Socket.io is present and the open tables matchmaking works. The sky maths run on device
(`ephemeris2.js`), so the night, the moon's house and the chart need no network.

That delete route matters more than it looks: Apple requires in-app account deletion for any app that
creates accounts, and it already exists at the API. What it does not have is a settings surface in the
client to call it from.

**Not built at all: commerce.** No Stripe, no webhooks, no entitlements table, no receipt validation,
no IAP. The plan's business model is a single $19-24 purchase behind a hard paywall, and none of the
machinery for it exists. That is not a criticism of the sequence, since the plan puts the purchase in
Phase 2, but it should be named: **the project currently has no way to take money.**

**Also live:** 28 station permalink pages with a 30-URL sitemap, which the rollout doc correctly counts
as free compounding SEO on a query nobody owns.

---

## 6. The business plan, and which gate we are at

`ROLLOUT.md` is a good document and it is unambiguous about the order. The constraint is stated baldly:
**no audience, not a small one, zero.** Three of the four moves (Kickstarter, Steam, App Store revenue)
consume an audience as an input; only a free game that spreads generates one. So the free game goes
first and everything queues behind it.

The sequence is: **free game (web + itch) → the app (App Store, the only recurring channel) → Steam
and a physical deck.** Phases 0 through 4, roughly a year.

**We are in Phase 0**, whose gate is "the game is unsolved, has a run, and collects emails". Against
its own three blockers:

1. **"The opening is solved at a five-card pack."** Resolved by design drift: the game now deals seven
   from all twenty-eight with a mulligan to six, so there is no five-card opening book.
2. **"Add the run structure."** Partly. The 28-night climb, nine rungs, three lanterns, formats and a
   handicap ladder is a run, and it is measured. What the rollout doc actually asks for is the
   roguelike-deckbuilder shape: **cards drafted and kept between boards**, which does not exist and is
   a design decision nobody has taken. This is called the highest-leverage item in either research
   report and worth more than any marketing spend. It is the biggest unmade design decision in the
   project.
3. **"Fix the -2 filename bug."** Not reproducing. `ephemeris2.js` and `manzil-art2.js` exist under
   those names and load correctly on staging; I verified both in the document's script list. Whatever
   the original breakage was, it is gone. **The mobile port note replaces this with the real version of
   the same worry**: the build pulls React from unpkg at runtime, which is an offline failure and an
   App Store risk, and must be vendored before anything ships wrapped.

**And the fourth item, which is not engineering at all.** The plan's own analysis says the content vein
(five short videos a week for twelve weeks, sixty before judging) is the only move on the whole board
that generates an audience rather than consuming one, needs no engineering, no money and no finished
art, and that **email capture moves from nice to blocking** because every later phase consumes that
list. I could not verify from the code whether email capture exists in the free flow ahead of signup.
If it does not, that is an hour of work gating the entire rest of the plan.

---

## 7. Outstanding, by owner, in the order I would take it

**Code**
1. `hand` back on the walker records. Nothing else can be judged until a climb can be finished.
2. how to play and glossary: two dead destinations on a shipped build.
3. The familiarity rule: names on, on the road and in hand.
4. Send the current module so the 27 cases run against the mirror-guard fix; say which six nights.
5. Confirm the 15 Sep cover matches what was merged.

**Design**
1. The verdict tablet and the settle captions. Both are pure surface work against live records.
2. The dawn shelf (1d), whose only dependency, the settle record's pair list, now exists.
3. A type floor: nothing under 11px inside the stage. This fixes the 9.5px place labels, and it is the
   one thing the mobile port genuinely requires.
4. The copy sweep: counters, caps, the em dash, the quadrant names.
5. Screen change down to the timing table's own 300ms.

**You, decisions only**
1. Sign the hush note with the district-not-hush correction.
2. **A target clear rate per collection depth, in writing.** One sentence unblocks the whole
   full-collection question.
3. **The full-collection lever**: which of the three families. I will run the sweep the same day.
4. **The storm**: is the unclearable road intentional.
5. **The run structure**: does Manzil get a between-board draft, or is the climb the run. This is the
   one with real money attached.
6. Whether the mobile wrapper starts now or after the road runs. My advice is after.

**Me**
1. The pre-ship smoke check (offered, not yet written): every walker has a hand, every nav destination
   renders, `tonight.law` is populated on law nights, the settle invariant holds, no console exception
   during a full board.
2. The conformance re-run, the hush fixture, and the six nights, all waiting on inputs.
3. Verify a built mobile app against the device table when there is one.

---

## 8. The four risks I would put in front of you

1. **The build regressed on a merge, not on a design.** The walker sheet was clean; the merge dropped a
   field and nobody noticed until a playthrough. There is a rich measurement apparatus for the *rules*
   and none at all for the *build*. That asymmetry is the most likely source of the next lost week.
2. **The surfaces are a cycle behind the records, consistently.** The settle record has been live and
   correct for two days and the scales still say nothing. The pattern is that Code lands the plumbing
   and the picked design does not get built. Worth naming as a process question rather than a to-do.
3. **The full-collection cliff is a retention problem disguised as a balance problem.** A player who
   collects everything finds the game harder, not easier, and the plan depends on a free game that
   people keep playing and tell others about.
4. **The plan's critical path is not engineering.** Sixty videos and an email box gate Phases 1 through
   4. The game can be excellent and the project can still stall on the one item that needs no code.

### Files

`CLAUDE.md` (project log), `ROLLOUT.md`, `PRODUCT.md`, `MANZIL-LOOP.md`, `research/` (63 memos),
`research/v2.js` + `conformance.json`, `starshard-api/` (routes and schema), and the 79 design
direction sheets in the 15 Sep drop. Yesterday's build audit: `research/THE-SHIP-READ-15SEP.md`.
Mobile: `research/THE-MOBILE-PORT-15SEP.md`.
