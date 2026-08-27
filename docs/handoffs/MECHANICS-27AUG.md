# Manzil — every mechanic in the arena

Source of truth: `Manzil - Game Prototype V1.dc.html` (26 August 2026). Everything below is
what the live resolve path actually does, not what the design notes intend.

---

## 1. The arena

Nine **stations** in an arc — the moon's road for the mansion she stands in tonight. Two hands
of five. You and your opponent alternate lodging one card per turn until the road fills, then
the road is **counted**: whoever holds the most stations takes the board. A match is best of
five boards.

Every card has two numbers, a **left face** and a **right face**. A card fights with the face
that points at what it is fighting: lodge to the left of a card and your left face meets its
right. Bigger wins. **Ties flip** — the card that just landed takes the ground.

**A tie does not cascade** (26 Aug 2026). It claims the card it tied and stops. Until this date a
tie-flipped card struck its own two neighbours, which could chain across the board; that rule is
removed. Chains now come only from the cards that own them: mars carries a strike one further,
the drum answers from anywhere, the follower answers for its left, the resonant ground carries
the beat onward. **Engine note for Code:** this invalidates conformance vector 2, *"a tie-flip
strikes on, past her reach"* (`manzil-engine-v6.js`), and the header comment's base-law list.
Vector 1 (*ties flip*) and vector 3 (*tied counts are yours*) are unchanged.

**A tied count is a draw** (27 Aug 2026, user). When the road is counted level, neither side takes
the board: a grey pip stands in the match row and the match plays on. This supersedes the 20 Aug
"tied counts are yours" lock (and the 19 Aug "to the sky" lock before it), so conformance vector 3
is invalid as written. The 14-station eclipse board keeps its own exception: there, a level count
falls to whoever holds the eclipse's own station.

**Dominion.** A card lodged on its own mansion glows and counts **two** at the count, whoever
ends up holding it. That ground keeps the doubling even if the card changes hands.

**Levels.** Every card sits at one of four, and levels two, three and four each carry a **choice**:

| Level | What changes |
|---|---|
| 1 | the two faces, nothing else |
| 2 | **choose:** +2 to one face (the player picks which), or its quadrant's grant |
| 3 | **choose:** +1 to one face, or the card's signature |
| 4 | +1 to one face, plus full art, a respec, and a lockable hand slot |

A card levels only by walking its own mansion's road while the moon stands there. **The grant comes
before the signature** (27 Aug 2026 engine update): four grants are learnable in an evening,
twenty-eight signatures are not — and the measured payoff was larger than the teaching one, taking
blowouts from 24% of boards to **2%** and close games from 38% to **69%** with the skill gap
unchanged. **The number branch is points on ONE face**, +2 at the second door and +1 at the third and
fourth, so a fully levelled card carries **+4** across its two faces and every level-up is positional
rather than a flat raise. The third door was measured at +2 first and failed: the points compound with
the grant the card already carries and beat almost every signature (15 of 28 live at +2, 21 at +1).
Increments are stored per side (`aS` / `bS` / `c`), and the doors on the card's page ask which face
with two buttons so a door is never half open.

**Faces are not capped at 9.** The highest reachable face is **13** (a base 9 with all four points
poured into one side). The floor of 1 stays in `_faceOf`, so the blaze and the thread cannot drive a
card below one. Consequence flagged and not solved: a face above 9 cannot be matched by any unlevelled
card, so that side is unkillable in practice — the same effect the tiger's grant sells, now buyable
with four levels.

The old level *names* (claimed / awake / familiar / unleashed) are gone: a level now says only how
many doors have opened, and the build says what came through them. §1b is the live ladder.

---

## 1b. The collection, the hand, the ladder (26 Aug 2026 spec)

**Every one of the 28 is held from the first login.** Nothing is locked away. What differs is the
level, and what each level was spent on. The chart sets the starting levels: **the sun's mansion at
3, its four companions in the chart's five at 2, the other 23 at 1.**

**The hand is seven, shuffled from all 28 at the start of every board.** Not chosen, dealt.
Dislike it: shuffle once and take **six**. One mulligan, then you play what you have (27 Aug 2026,
user: two looks let a player dig down to a hand too small to fill the road). Nothing can be
guaranteed into a hand except a level-4 card the player has **locked** (max 2, each spending one of
the seven slots).

**She holds seven too** — symmetry, same surplus on both sides. The sky deals the seven classical
planets (Saturn, Mars, Venus, Mercury, Jupiter, and now the Sun 9/6 and the Moon 6/6, both without
signatures until the card rewrite). A walker's authored five is padded to seven from the mansions
she left. The mansion at rung 9 plays five planets plus its own two cards.

**The ladder is three climbs.** A card levels only by beating its own mansion on a night the moon
stands in it.

| level | what happens |
|---|---|
| 1 | the numbers, nothing else |
| 2 | **choose:** +1 to both faces, or the card's signature |
| 3 | **choose:** +1 to both faces, or its quadrant grant |
| 4 | full art, a respec, and a lockable hand slot |

So four builds per card: +2 numbers · +1 and the signature · signature and grant · +1 and the grant.
The choice is made **on the card's own page in your cards**, never on the end screen, and an
unspent level waits indefinitely. A respec (earned at 4, and again each later win of that mansion)
clears both picks.

**The four grants** (card sheet, 27 Aug 2026 — this table replaced the 26 Aug one):

| quadrant | mansions | grant | vs another +1/+1 |
|---|---|---|---|
| Byakko, white tiger | 1-6, 28 | the ground holds: this card cannot be taken | +2.2 |
| Suzaku, vermilion bird | 7-13 | your strikes carry two stations, not one | +2.2 |
| Seiryuu, azure dragon | 14-20 | it may be lodged either way round | −0.4 |
| Genbu, black tortoise | 21-27 | the empty shell: once she takes this station, it counts for nobody | −0.9 |

**No grant is a tap.** All four are passive; the throne keeps its own bespoke tap, and the heart
keeps its own. The 26 Aug wiring (bird = once-a-board tap, tortoise = +1 count) is gone.

**Rung 9 is the mansion itself**, not the sky. The sky stands above all 28 and comes only on
special nights. Only the heart (Antares) has an authored avatar; the rest fall back to their own
name until written.

**Storage is a clean slate**: every key moved from `manzil-ed-` to `manzil-v2-`, `-pack` and the
loaner concept deleted, `-climbs` now holds *climbs* (not levels), plus new `-build`, `-lock`,
`-respec`.

Not in this pass, by the user's call: **the 28 signatures and the per-mansion board rules**, both
held for the card rework.

## 1c. The cards screen: the ledger (26 Aug 2026)

Picked from three built options (`Manzil - Cards Screen Options.dc.html`, options 1a/1b/1c then the
hybrids 2a/3a; the user picked **3a**). The ellipse of 28 and the level-filter chips are gone.

**Layout.** Card and its reading on the left, the whole sky as **four rows of seven down the right
edge**, one row per quarter, **art only** at 38px (a name is mush at that size and the panel already
names whatever you point at). Each row wears its animal, its English name and its direction as
words, a hairline rule, and a live counter: `N to spend` in amber, else `seven`, becoming
`enter ›` on hover.

**Three gestures, one screen.** Hover a card and it reads in the panel. Click it and its level doors
open there (the card is already big, so nothing moves). Click a row's own name and you leave for
that quarter's screen, which is an honest stub: name, direction, its seven, and a dashed note.

Why rows and not the compass: the four rows are the same length, which a compass can never manage,
so the sixth card in a row is always the sixth card and finding one is counting rather than
searching. The cost is that the sky stops being a shape; the quadrant screens are where that
identity has to live instead.

**The quadrant is on the card.** `_qTintOf(id)` resolves any card id to its mansion (1-28 direct,
201-228 the walker-space copies, the sky's planets have none) and `_qWash()` lays the animal's
colour over the top of the face: white tiger `185,198,210`, vermilion bird `212,90,58`, azure
dragon `79,168,154`, black tortoise `124,138,204`. Live on the **hand faces** and the
**collection**, so seven cards drawn from four quarters group at a glance where you choose between
them. Deliberately **not on the board**: there, colour already means ownership (parchment yours,
amber hers) and that read has to win. The panel names the quarter in words instead.

## 2. What a card can do, and when

Every signature and every grant is **one thing a card can do** and **one moment it does it**
(card sheet §5). A quarter of the sky keeps to two of the seven, so a quarter plays like itself.

**Seven things:** change a number (raise or lower) · turn a card · add a fight · deny a fight ·
move a card · change what a station is worth · change whose a station is.

**Six moments:** on lodge · on claim · on being struck · at the count · always · on tap.

The old nine-mark glyph table is gone with the slate it described. Four cards reach outside their
quarter's two permutations and are marked ◆ on the sheets: the follower, the ghost, the crown,
the heart.

---

## 3. The 28 cards

**The slate is `CARDS.md` §4, applied verbatim** (27 Aug 2026, measured on `research/v2.js`,
896 boards a cell). It is not restated here: two copies of 28 signatures is what drifted last
time. Read the sheet for the cards; this section records only how they land in the resolve path.

- **Faces are the sheet's faces, as printed, with four mirrored.** The 22 Aug re-baseline (+1 on the
  lower side) is already inside those numbers. It was being applied a second time in `_cards()` until
  27 Aug 2026, so every card in the build fought a point above the measured slate; that line is
  removed and the derivation now lives in the sheet. The bearer (5/6), the storm (6/8), the hand
  (5/7) and the veil (3/8) are **mirrored** by the 27 Aug engine update, which levels the deck's
  left/right totals at 179/179 and collapses the side bias from +8.3 to +1.0. None of the four has a
  direction in its signature; cards that name a side in their rules (the void, the drum) were left
  alone deliberately.
- **Chains come only from the cards that own one**, since a tie stops (§1): the turning carries a
  claim onward, the follower answers for a fallen neighbour, the glance strikes across the road,
  the return strikes again a turn later, the heart strikes both neighbours as the road fills, and
  the suzaku grant carries any strike two stations instead of one. Mars is her equivalent.
- **Every "cannot be taken" rule sits in one place**: `_shielded()` — the gate's first miss, the
  gathered stars beside a friend, the storm against ties, the crown's settled ground, saturn, and
  the byakko grant.
- **The count's own signatures** resolve in `_slotW()`: the district, the listener, the drum, the
  void, the hideaway, the chamber, the guide, plus jupiter, dominion and the tortoise's grant.
- **The throne's tap is an orphan.** The build still lets a throne turn itself once a board, which
  was its signature under the pre-27-Aug slate; on this slate the throne raises what it takes.
  Keep it as a bespoke move or cut it — not yet decided.

---

## 4. Her planets

Her hand is **seven**, the same surplus as yours: the five classical planets and now the sun (9/6)
and the moon (6/6), both without signatures until the card rework. They are pooled beside the
mansion's face and thrown onto the road as she casts them. A walker's authored five is padded to
seven from the mansions she left; the mansion at the ninth step plays five planets and its own two
cards.

- **Saturn** — locks its ground: the station it holds cannot be taken.
- **Mars** — its claim strikes onward: a card Mars takes then fights its own far neighbour.
- **Venus** — softens both neighbours' facing numbers by 1 as she lodges.
- **Mercury** — picks its better face: she takes the stronger of its two numbers.
- **Jupiter** — counts as two at the count, three on his own mansion.
- **The sun, the moon** — numbers only.

Her planets hold dominion on their own mansions the same way your cards do.

---

## 5. The quadrant's grant (level three, chosen)

All four grants are **passive**, and only a card whose third door was spent on the grant carries
one (`grantOn = lvl >= 3 && build.b === "g"`) — never a level on its own. Where each resolves:

- **Byakko, the white tiger** (1–6, 28) — the ground holds: this card cannot be taken.
  `_shielded()`, beside the crown, saturn and root guards.
- **Suzaku, the vermilion bird** (7–13) — your strikes carry two stations, not one. Queued in
  `_resolve()` beside the mars and turning chains.
- **Seiryuu, the azure dragon** (14–20) — it may be lodged either way round. Sets `twoFaced`, so
  it flows through every existing two-faced path: the drag-drop face prompt, tap-to-place, her
  `revOpts`, the zoom copy.
- **Genbu, the black tortoise** (21–27) — the empty shell: once she takes this station it counts
  for nobody. In the count, via `s.by !== s.owner`.

**The taps are gone** (27 Aug 2026). The 25 Aug wiring — bird strikes again, tiger plants, tortoise
comes home — is unreachable: `_tapKind()` returns `null` unconditionally, and `_commitTap()` and
`_grantTurn()` are dead code still sitting in the file. The throne keeps its own bespoke turn and
the heart keeps its two taps; those are the only taps in the game.

A captured card was never yours to tap either: the lodger is stamped on the station (`by`) and
never changes hands.

---

## 6. Night laws

Laws belong to the night, not to a card, and are stated once — in tonight's reading and in the
boss splash.

- **The mansion's law.** On mansion 18, Antares' night, every card on the road fights +1 on its
  holder's turn and −1 on the other's — the heart's own beat, halved and spread to the whole
  road. (18 is the only mansion with a law authored so far.)
- **Boss rules**, at the ninth step only:
  - **the storm** (6) — every face fights −1.
  - **the veil** (15) — her lodged cards close again once played.
  - **the rains** (18) — the mansion's law doubles: ±2 by holder's turn.
  - **the void** (24) — a card can only be taken if something else stands beside it.
  - **the thread** (28) — the road wraps: the edges touch.

---

## 7. The road, and what a night is for

Eight walkers stand on the road — other players' hands, played by the sky's judgment — and at
the ninth step the **mansion itself** takes the seat: its own avatar, playing its planets and
its own cards against you. Beat all nine and the mansion's card is yours at level one. Walk the
same road again on a later night the moon stands there and it wakes a level. Three climbs takes
it to level four.

**Rung 9 is the mansion itself**, not the sky: its own avatar plays five of her planets and its own
two cards. **Those two cards stand at the player's own level for that mansion**, doors and all
(27 Aug 2026, user): the house answers your investment, so the last step never softens as you climb
— which is what the removed face cap would otherwise have caused, since the player can reach 14 and
an unlevelled card cannot. The hour's beats reach her five planets; the mansion's own two take the
level instead of the hour (`bossM` in `_cards()`, in the `_replyW()` jump from 16 to 20).

The sky herself is no longer the road's boss. She stands above all twenty-eight and comes only
on special nights.

---

## 7b. The difficulty curve: two dials, and they scale different things

**The station scales her judgment.** `_replyW()` is the weight she puts on your best reply when
valuing a move: the higher it is, the further ahead she reads. The road's ladder is
**3 · 4 · 5 · 7 · 9 · 11 · 13 · 16** across the eight walkers, then **20** at the mansion itself
(re-cut 27 Aug 2026, user set rung eight at 16; the previous ladder topped out at 11 with a boss
of 14). Off the road: practice 3, a walker's table night 10, a night the sky comes 12, an ordinary
table 8. Nothing else in the game touches her reading depth.

**The hour arms her hand.** The mansion's level *is* the step (§1b), and each of the four hours
gives her side one thing, cumulatively, on the cards she lends her walkers (ids 200+mansion):

| Step | Hour | Her hand |
|---|---|---|
| 1 | dusk | plain: numbers only, no signatures, and the mansion's ground condition sleeps |
| 2 | full dark | her signatures wake — the same hour yours do |
| 3 | the small hours | every card she holds fights +1 on both faces |
| 4 | before dawn | the mansion's own card turns to face you: it shows whichever number answers yours |

Her reading is identical at all four. That split is deliberate (user, 27 Aug 2026): the climb up
the road is what makes her think harder, and the mansion's level is what makes her hand heavier.

**The open tables are exempt.** Duels deal from the same 200+mansion space specifically so both
fives are even regardless of what either player has climbed, so the hour never touches them
(gated on `st.road && !st.duel && !st.practice`).

One bug fixed in the same pass: her lent cards were built from `C[id].l/.r`, which carry the
**player's** number doors, so every point you bought yourself was silently handed to her too.
They take the printed faces now.

---

## 8. Known gaps

- **Level four's "a specialty of its own" exists for one card**: the heart's burst. The other
  27 reach level four with +1 to a face and nothing else new.
- **The mansion's own cards match the player's level** for that mansion (27 Aug 2026, user). Resolved;
  see §7. What remains open is whether that is *enough* — it is unmeasured, like the rest of the pass.
- **Every measured card delta was re-run on the shipped build** (27 Aug 2026, `CARDS.md` §4). The
  "blowouts near 50%" flag carried since the cascade came out is **withdrawn**: it belonged to an
  older harness (eleven stations, twelve drawn and seven kept, tie cascade live). Worst cell on the
  current harness is 24%, most sit between 2% and 9%.
- **The 28 signatures and the per-mansion board rules** are held for the card rework, by the
  user's call. The sun and moon cards ship without signatures until then.
- **The hour's four beats are unmeasured.** They were authored from the four steps sheet, not
  sized against the harness, and they land on top of a rung ladder that was itself re-cut in the
  same pass. Sim before trusting either.
- **Suzaku's signatures lose to its own grant** at the third door on four of seven cards, because
  reach compounds with a raised face. The largest open item on the slate (`CARDS.md` §5).
- **Seiryuu's grant is worth −3.4 at level two**, so the dragon is the numbers-then-signature
  quadrant unless the grant gains standalone value.
- **The all-numbers path has a skill gap of 6.7** against 23–24 for every path with an ability: a
  legitimate but much shallower game, and the reason the numbers must never be the correct choice on
  many cards.
- **The mansion at the ninth step does not feel the hour.** It plays the seven planets, whose
  signatures already wake at step 2, so steps 3 and 4 arm the eight walkers and leave the boss
  where it was. Its jump from 16 to 20 reply weight carries that fight instead.
- **Avatars are authored for one mansion.** Mansion 18 has Antares; the other 27 fall back to
  the sky at the ninth step.
