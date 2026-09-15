# MANZIL-LOOP.md: what keeps a small card game alive for years

**August 19, 2026.** Research run on Manzil (v3 ruleset, locked 18–19 Aug).
Three questions: which games have the strongest loop that people also feel
*good* about years later; what, mechanically, they share; and what that
says about Manzil as it is actually coded in `Manzil - Prototype.dc.html`.
Builds on RETENTION.md and research/game-ethics.md, does not repeat them.
Figures are **[D]** disclosed, **[E]** estimated, **[S]** from our own
simulation of the prototype's rules (`research/manzil_sim.py`, report in
`research/manzil-sim-report.md`). Research only; nothing here is a build
decision until we decide.

---

## 1. The one finding

I ported the prototype's rules line for line to Python and played it.
Against the sky as coded (greedy, reads your best reply, deterministic):

| Player | Board win % | Match win % (Bo5) |
|---|---|---|
| random legal moves | 0.7 | 0 |
| greedy one-ply | 21 | 13–25 |
| the sky's own two-ply heuristic, mirrored | 11–12 | 4–7 |
| a search over your own lines vs the real sky ("the oracle") | **100** (all 28 nights, both leads) | **100** |

Default five at prototype levels, all 28 "tonight" mansions × both leads **[S]**.

Two things are true at once. **The sky is already solved**: because she is
deterministic and the night is the same for everyone, one person who finds
tonight's winning line has found it for everyone, and it is a nine-move
script. And **she is not beatable casually**: a player who simply plays
sensibly wins one board in five and one match in fifteen. The curve from
"can't win" to "always win" is a cliff, and what sits on either side of the
cliff is the two ways a daily game dies: it becomes a chore (Duolingo's
binge-and-quit), or it becomes a posted answer (Wordle's answer sites).

Underneath that, four structural facts about the board as coded:

1. **The duel barely duels.** Two cautious agents flip 0.9–1.5 cards per
   board; 87% of turns flip nothing **[S]**. Your card beats a planet face in
   33% of static pairings, ties 17%, loses 50%. The game is mostly a
   placement-and-count game decided by Jupiter's double, dominion, and the
   leader's 5-vs-4 lodge advantage.
2. **The sky's edge is mostly arithmetic we chose, not play.** Turning off
   Jupiter's "counts as two" takes the two-ply player from ~11% to 35–46%;
   turning off Mars's chain, to 22–41%; all five planet signatures, to
   50–62% **[S]**. And 21–25% of boards end in a *tied count*, all of which
   the code awards to the sky (`you > sky ? "you" : "sky"`). A quarter of
   her wins are the tiebreak.
3. **Only about six of 28 cards are worth slotting.** Mean board win rate by
   card at L1: Void 8.4%, Empty District 7.1, Veil 5.9, Throne 5.7, Storm
   5.7, Heart 5.7, then a cliff to ≤1.7 for the other 22, which are strictly
   dominated **[S]**. The best five found (Storm, Veil, Heart, Empty District,
   Void) wins 54% of boards for a two-ply player; the median hand wins 0%.
   A hand of balanced sixes is unwinnable even for the oracle. The deck
   screen is a real decision, but the answer is "bring the 8s and 9s", a
   one-time discovery, not ongoing expression. Levels don't fix it: 8 is the
   floor for touching Mars, Jupiter or Saturn, and a 7 only reaches 8 at L3.
4. **Half the live signatures never fire.** Ablating Throne costs 5–11
   points and Storm 2–11 (ties are 15–17% of duels, so "claims ties" is
   exactly right). Heart and Blaze move 0–2 points: Blaze needs a flip *and
   then* a re-claim, and with ~1 flip a board that essentially never
   happens **[S]**.

Also: first move is worth a lot (59–77% in mirrors; a forced win under
perfect play on every sampled night **[S]**), the follower's fifth card
never lands (9 slots, 5 vs 4), and tonight's mansion swings the same hand
from 0% to 62% with no signal on the deck screen, because dominion decides
more boards than any card signature **[S]**. Wall-clock is fine: a Bo5 match
is 3–4 boards and about two minutes with thinking, 50 seconds as pure
animation, about a minute when replaying a known line **[S]**.

None of this is a verdict on the idea. It's what the numbers say about
the first tuning. Everything below is about what the games that last do
instead, and how that maps onto these numbers.

---

## 2. What the comparables share

Forty-odd games across three lanes: card duels and minigames (Triple
Triad in FF8 and FFXIV, Tetra Master, Gwent inside Witcher 3 vs
standalone, Marvel Snap, Balatro, Inscryption, Slay the Spire, Hearthstone
Dungeon Run and Battlegrounds, Pokémon TCG Pocket, Artifact, Runeterra's
Path of Champions); daily rituals (the NYT stack, Chess.com and Lichess
puzzles, Spelunky and StS dailies, Zach Gage's Puzzmo, Desert Golfing,
Immaculate Grid, Trackmania's Track of the Day); and the decade games
(chess, Go, MTG, Tetris Grand Master, FreeCell, backgammon, Into the
Breach, Hades, Celeste, Monster Hunter, Devil Daggers, Super Hexagon).
Full notes with sources are in the three agent reports under
`research/manzil-loop/`. The properties that recur:

**The instance has a name.** FreeCell's 32,000 numbered deals turned a
solitaire into a shared challenge (#11982 is the famous unsolvable one;
~1 in 84,000 deals is impossible across 8.6B analysed) [D, Wikipedia].
Trackmania's Track of the Day drops at 19:00 CET with a 24-hour board and
Cup of the Day sorts players into divisions of ≤64 by their own qualifying
time, so a mid-skill player competes among peers [D, Nadeo docs]. Spelunky's
daily is one attempt on one seed, and that single constraint "shifts
behavior from aggressive exploration to calculated caution" (Game
Developer). Wordle is the same shape with a word. **Manzil already has
this**: the sky is deterministic, tonight's planets are the same for
everyone, and the mansion name plus date is a handle ("did you beat the
Throne on the 19th?"). We have built Track of the Day without the
receipt, the division, or the promise.

**Every deal is solvable, and the loss is yours.** FreeCell's community
enforced the "every deal is winnable" lore; Into the Breach puts all the
randomness *before* your turn so the turn is a pure, fully-visible puzzle;
Devil Daggers' spawn script never changes ("everyone above you overcame
the exact same obstacles"). The tension in a deterministic game comes from
a solution that exists and is not obvious. Our sim says every night is
solvable with the default five. That is a promise we can publish, and it
turns a loss from "the sky cheated" into "I didn't see it", which is the
only kind of loss that prompts one more board.

**The opponent's intent is readable; the resolution is never hidden.**
Inscryption shows Leshy's queue; Snap reveals locations on a schedule;
Triple Triad shows all numbers. Tetra Master (FF9) hid its stats and
resolved fights with a random subtraction so "any card can be defeated by
any other card", and it is the only card minigame in this set that died.
Our familiarity law (L2 drops the name, L3 drops the printed move) is
lenticular design done right, *as long as it hides flavour and never the
numbers or the live signature*. A 14-year-old who loses to a move she
couldn't see can't learn from it, and Brode's line is the engine: "if you
lose, you always have an opportunity to reflect."

**Additive rule modules are loved; agency-removing ones are hated.**
FF8's Plus/Same/Combo/Elemental spread region to region and are
celebrated; the Random rule "is so atrociously unfair it almost breaks the
game" (PC Gamer) and FFXIV's Swap/Chaos/Roulette top the complaint threads.
Battlegrounds rotates *which synergies exist* each game. Dungeon Run's
bosses were authored to counter the dominant strategy so you change your
plan. Map this onto our signatures: Venus (−1 neighbours) and Jupiter
(counts two) are Plus-class; Mercury "picks its better face" and Uranus
"swaps two lodged cards" are Random/Swap-class, the category players
resent most. The planet list needs re-reading against that split.

**Stakes come from winning something that matters elsewhere.** Triple
Triad's cards refine into items; Gwent's cards come from named innkeepers
in the world, and standalone Gwent, stripped of the world, peaked at 4,862
on Steam and is now community-maintained [D, SteamCharts; Game Developer].
Marvel Snap's loop is excellent and its players leave over card
acquisition (Spotlight Caches reworked "after significant outcry"; Naavik).
Pokémon TCG Pocket did ~$1.3B in year one and lost ~41% of MAU
year-over-year (39M → 23M, Apr–Jun 2026 vs 2025) [E AppMagic; D DeNA]: a
collection loop with thin play decays once the collection novelty does.
Manzil's "win → tonight's mansion joins the deck, dated" is the right kind
of stake. It should feed back into the codex and the sigil, not seal off.

**The addictive-and-satisfying games add a second game of judgment on
top of the first with no new rules.** Backgammon was "a dead and discarded
pastime" until the doubling cube (~1925–30) gave it "a new stimulus"
(*Vogue* 1929, via NE Backgammon Club); Snap's snap is the cube plus hidden
information, and "Escaped!" on retreat exists to "zero out the emotional
negativity" (Brode). Spelling Bee has no clean end, so you stop at the rank
that satisfies you; the crossword's Monday-to-Saturday ramp gives the week
a shape and players an identity ("a Thursday solver"). These are agency
mechanics: *you* decide when a game matters and how far you go.

**The long tail is constraint, not power.** Slay the Spire's twenty
ascensions only ever subtract from the player (9% overall win rate across
18M runs; losing runs average 23 minutes, which is why a 9% win rate is
fine) [D, Fox Row]; Dead Cells' Boss Stem Cells, TGM's grades, Celeste's
golden strawberries, Inscryption's Kaycee's Mod: all voluntary, all
unshamed, all on the *opponent and the conditions*, never on the player's
numbers. Our L1–4 ladder gives the card power and then stops. It is an
unlock curve, not a mastery curve.

**Failure produces something.** Hades advances the story on death and its
God Mode is a cumulative, invisible +2% per death; Into the Breach sends a
pilot back in time; Dwarf Fortress: "losing is fun." Manzil's "lose,
nothing lost" is ethically right and emotionally empty. The cheapest fix
is Hades': the codex records the loss ("the Storm held the road tonight")
and the sky's winning line is shown back, steppable.

**One a day, then stop.** Wardle's scarcity; Gage caps Pile-Up Poker at
five hands because "you could burn out on it" and "it becomes more
interesting the more constricted it is"; Duolingo's binge-abandon data
(already in RETENTION.md). Desert Golfing's opposite lesson: a single
permanent count-up number (21,000 holes for one player) and zero friction
to resume. Both fit: a hard cap on what *counts*, no cap on *play*.

**Where the content comes from.** Pokémon GO: 20M weekly actives, half of
all players log in seven days a week, $9.1B lifetime at its tenth
anniversary [D, PocketGamer.biz 2025–26]. Immaculate Grid: ~200K weekday
players on a 3×3 sports-trivia grid with a rarity score per cell,
acquired by Sports Reference [D]. ESPN Streak: pick one real game a day.
When the world authors the content, the budget is infinite and the pull is
external. We already own this (RETENTION §1); the research this time adds
that the found-content games all *surface the source* (the real ballgame,
the real weather). Our version is "the five she plays tonight are the
five that truly ride tonight's sky" on the sky page. It should be on the
board.

---

## 3. The line between compulsive and fulfilling

Five findings from the literature worth keeping on the monitor, in order
of evidence:

1. **Hours don't predict wellbeing; fit does.** Oxford Internet Institute:
   39K players, 2022, time played has negligible effect on wellbeing;
   703 Switch players and 140K hours, 2025, hours don't predict wellbeing
   but perceived "gaming life fit" does [D]. Vallerand's
   harmonious-vs-obsessive passion: same hours, opposite outcomes; what
   differs is whether play feels *compelled* and conflicts with life. We
   should be able to prove harmonious. Instrument "was tonight worth it?"
   (one tap, opt-in) alongside D30.
2. **Unfinished doesn't haunt; resumable gets resumed.** A 2025
   meta-analysis (38 + 21 studies) finds the Zeigarnik *memory* effect is
   essentially null (recall ratio 0.99) and the Ovsiankina *resumption*
   effect robust (interrupted tasks resumed ~67% of the time) [D, Nature
   HSSC]. Translation: the return screen should show one visibly
   resumable thing (tonight's match), not a list of what was missed.
3. **Fun is learning and has a half-life.** Koster: "a game is destined
   to become boring, automated, cheated, and exploited." Daniel Cook's
   loops vs arcs: arcs burn out on one pass; "remove any elements of a
   computer game that you can 'beat'." A greedy two-ply AI is a pattern
   and will be fully learned. What keeps a learned game alive is (a)
   depth you can't exhaust (chess), (b) new *situations* without new rules
   (FreeCell, TOTD, ItB), or (c) the player's own growth as the content
   (Celeste, Monster Hunter). Manzil sits in (b) and wants (a) and (c).
4. **Legible depth, not homework.** Quantic Foundry's 1.57M-gamer panel:
   the Strategy motivation slid from the 50th to the 33rd percentile,
   2015→2024, across gender and region [D]. Rosewater's lenticular
   design: keep comprehension and board complexity low, hide strategic
   complexity in plain sight. Sid Meier: a decision is interesting only if
   players neither always pick the same option nor pick at random; the
   best shapes are risk-vs-reward, short-vs-long, and *personal
   preference* (the cautious and the aggressive player both have a
   correct move).
5. **Four keys, three minimum.** Lazzaro: hard fun (fiero), easy fun
   (curiosity), serious fun (value, calm), people fun; "best selling
   games offer at least three." Manzil today is hard fun plus easy fun
   (the art, the real sky). Serious fun is latent (the codex, the record)
   and people fun is absent.

---

## 4. What Manzil already gets right

Say it before the list of changes, because most of it survives them.

The single-row, two-number, one-comparison ruleset is the right
comprehension tier (Artifact's three lanes you can't see at once is the
anti-pattern; our 1×9 is the opposite). The deterministic sky and the
shared night is FreeCell-seed structure, the strongest daily-game
property there is. Closed hand is the one piece of hidden information and
it is what makes the two-ply AI feel like an opponent rather than a lock;
keep it. The familiarity law is lenticular design made physical and the
cheapest mastery signal in the design. Dominion is the best thing in the
ruleset: unhinted, spotted by skill, it makes the optimal five depend on
tonight's road, which is Knizia's "second level of depth" and Meier's
preference decision in one rule. Storm's "claims ties" is exactly tuned to
a 15–17% tie rate. "Nothing lost on a loss", no streak, cards dated,
names on them, the set never closes, "the sky is the drop table": the
ethics floor is intact and it is also, per §2, the retention-optimal
posture (Snap and Pocket are losing players over exactly what we refuse
to build). Match length is right.

---

## 5. Take these

Ranked by expected effect, each tied to a number or a precedent.

**1. Fix the count before anything else.** Ties to the sky are a quarter
of her wins **[S]**. Options, in order of elegance: a tied count goes to
whoever holds tonight's mansion (slot 0: the board's anchor, exactly the
eclipse-board rule we already wrote); or a tied board is a draw and
doesn't count toward the five (Bo5 becomes "first to three wins"); or ties
go to the player (she has Jupiter). Make Jupiter situational rather than
flat: counts two *only on its own mansion* (it already stacks to three
there), or only while unclaimed. Re-run the sim: the target is a sensible
one-ply human winning 35–45% of boards and a two-ply human 55–65%, so that
Bo5 is a contest and not a cliff.

**2. Make the sky unsolvable-by-copy but still the same for everyone.**
The deterministic night is the asset; the copyable script is the cost.
Keep determinism and add *date-seeded* choice: when two of her moves tie
on evaluation, she picks by a seed from tonight's date (still identical
for every player on Earth, not identical across nights, not gameable by
replay since replays use the same seed). Give her planet temperaments
that are learnable tells, not noise: Mars overvalues captures, Saturn
defends ground, Mercury chooses among near-equal lines by the seed,
Venus plays late. Dungeon Run's bosses were authored to counter the
dominant habit; Monster Hunter's longevity is learning a monster's tells.
The sky should have tells, and a Mercury-retrograde fortnight should play
differently *because she does*.

**3. Publish "every night is solvable" and the receipt.** FreeCell's
promise and Wordle's grid. Per night: compute whether the sky is beatable
with loaners alone (cheap: she's deterministic) and say so quietly on the
deck screen ("tonight can be taken with what you hold"). After the match:
a spoiler-free road (nine parchment/amber squares, the final count, ✦ for
dominion, the mansion name and date), never the numbers. Add one rarity
line in our house currency ("claimed with a hand 1.4% of players walk").
Immaculate Grid's per-cell rarity score is the precedent; it is also our
only honest comparative surface, because it compares on identical input.

**4. One match counts; the rest is practice.** Every durable daily game
here has a stopping rule built into the artifact. Keep unlimited play,
but the *claim* is one true match per night (Bo5 already gives five
chances inside it), and further matches are practice with loaners and no
claim. That's a cap without a stamina bar, it's Duolingo's pace-not-binge
finding, it's Gage's five hands, and it's consistent with the ethics
floor (nothing expires; the mansion comes back around). It also makes
Recommendation 3's receipt mean something: one receipt per night.

**5. Add the cube.** Before any board in a match, either side may "call
the sky": the board counts double. Nothing is staked beyond match score
(lose a called board, the match moves two, nothing is ever lost). The sky
calls on a fixed, learnable rule (her eval ahead by X), which becomes a
tell. This is backgammon's cube and Snap's snap: a second game of
judgment, zero new rules, variable match length that is *chosen* rather
than fixed, and it answers "is best-of-five right?" better than any
number would.

**6. Make every placement interact.** 87% of turns flip nothing
**[S]** because early plays are non-adjacent. Two candidates, both
lore-true: the road fills contiguously from tonight outward (she crosses
one mansion a night; you lodge *ahead* of her, not anywhere), or The
Thread's "the board wraps" becomes a base rule on some nights. Either
turns the first move into geometry. Re-sim: target 3–4 flips a board for
sensible play.

**7. Widen the playable set from six cards to twenty-eight.** 22 of 28
are strictly dominated at L1 **[S]**. Numbers are canon (star prominence,
tradition agreement) and should stay, so the lever is signatures, and
the rule is: *signatures must make a low-number card correct on some
nights.* The sim's levers: a card that is strong against a named planet
(Mars nights want Heart, Venus nights want Blaze), so "the sky is the
drop table" becomes "the sky is the deck-building prompt"; moves that
score rather than fight (Gathered Stars "counts as two", The Crown on an
edge) so 4|6 can matter; and make L3/L4 lateral (a second face pair, a
second move) rather than +1, or FFXIV's rule where 4★ cards became "solely
collector's items" repeats here. Then ship and *name* four to six starter
plans the way Gwent names factions (a dominion-hunting five, a
tie-claiming five, a lock-and-hold five), and let players find the rest.
Rosewater's lesson 13: make the fun part also the correct strategy.

**8. Decide what the follower's fifth card is for.** Half of all boards are
played with four cards **[S]**. Either the follower chooses which four
(a real decision, pre-board), or the road is ten, or the unplayed card
does something at the count (it "watches": its higher number breaks a
tie). Own the asymmetry or remove it; don't leave it silent.

**9. A ladder on each mansion, counted up.** Spelling Bee has no clean
end; Spelling Bee retains. Per mansion: claimed → claimed at L2 → claimed
with dominion → claimed without dropping a board → claimed with loaners
only → claimed against the open sky and the closed. Quiet marks on the
card in the codex, never a counter on the home screen. This is also the
answer to "28 claims then what": the 28-grid reads complete-able
(Blathers' museum), the event set reads openly endless (a ledger, never a
grid with holes), and the ladders read as depth.

**10. Sky grades, opt-in, on the opponent.** Slay the Spire's ascensions
and Celeste's tiers: once a mansion is claimed, you may raise the sky
there (she plays three-ply; she sees your hand; she gets dominion hints;
the outers visit). Names quiet and lowercase. A grade for consistency
across nights, TGM-style, not a single win. This is where year-three
mastery lives, and it costs no new cards.

**11. Open and closed nights.** Triple Triad's own Open rule. Some nights
the sky's hand is face-up: that night is Into the Breach, a pure puzzle;
closed nights are duels. Rosewater's lesson 17, "you don't have to change
much to change everything." Tie it to the real sky (new moon open, full
moon closed, or whatever is checkable) and announce it on the deck screen
so players choose their nights, Shortz-style.

**12. Loss produces a line and a replay.** Hades, ItB, Geometry Dash
("each death contains information"). On a lost board: a codex line in
the product voice ("the Storm held the road tonight"), and the sky's
winning line steppable. On a lost match: the receipt still issues, marked
so. Count up: boards won tonight, best margin, nights walked.

**13. The return screen is the Neko Atsume inversion plus one resumable
thing.** "The moon crossed the Claws and the Flock while you were away;
Venus stood in the Throne." Then tonight's match, ready. Never a count of
missed nights. (Ovsiankina: resumable gets resumed; missed doesn't haunt,
it just feels like debt.)

**14. People fun, asynchronous and positive-only.** Death Stranding's
strands: anonymous, only-positive traces. Play a friend's recorded road
from the same night (their five vs tonight's sky, replayed), likes only,
no chat, no timers. Trackmania's division insight applies to any
comparison we ever show: "how many boards it took people walking hands
like yours", never a global top-100 (Destiny's Trials fell from ~400K to
154K in a season when matchmaking ignored losses; Forbes/Tassi). For a
13–17 audience, this is also the compliant version.

**15. Surface the source on the board.** "Her five are tonight's five,
where they truly stand" belongs at the moment of the first reveal, not on
a sky page. The found-content games win because you can check them
against the world. A hold on a revealed planet should say its real
mansion tonight and its dominion there. That is the one sentence that
separates us from every card game in this report.

---

## 6. Refuse these (Manzil-specific additions to game-ethics.md)

| Mechanic | Why |
|---|---|
| Agency-removing rule modules (Random, Swap, Chaos analogues) | The most-hated elements in FF8 and FFXIV Triple Triad; re-read Mercury and Uranus against this |
| Hiding numbers or the live signature at L3/L4 | Tetra Master died of hidden resolution; hide flavour only |
| Power creep through levels | FFXIV: lower-star cards became "solely collector's items"; Snap's Series 5. Levels go lateral or onto the opponent |
| Public comparative ladders with demotion | Duolingo leagues' documented anxiety and quitting; Destiny Trials' collapse; our audience |
| An RNG resolution in the fight itself | Tetra Master; Elyot Grant's "why luck kills strategy games". Variance before the turn (the real sky), never inside the comparison |
| A daily that expires with no replay | A missable; the mansion comes back around, so the night's puzzle must too (practice mode, forever) |
| Meta-progress that beats the loop by time | Vampire Survivors' endgame complaint; nothing you accrue should make tonight's sky easier, only you |

---

## 7. Year-three Manzil, concretely

Twenty-eight claimed cards, most at L4 (art-only faces, visible mastery,
the hand itself the identity object and the thing skins sell on). A
handful of dated event cards with printed rarities in a ledger. A
personal grade per planet configuration, consistency not peaks, private
by default. Opt-in open/closed and graded-sky variants per mansion. A
receipt per night with a rare "called the sky and won" mark. A codex that
records losses and what the sky did while you were gone. Friends' roads
from the same night, replayable, likes only. And the same nine-slot board
and two numbers per card as day one. Nothing above is new content. It is
variance, constraint and legibility, which is how every game in this
report got to its tenth year.

---

## 8. What I'd decide and test before the next lock

1. **Tie rule and Jupiter's weight** (§5.1). One sim run each; pick the
   pair that lands one-ply humans at 35–45%.
2. **Seeded tiebreak for the sky** (§5.2). Confirm the oracle can't copy a
   line across players while the night stays identical for all.
3. **Contiguous road vs wrap** (§5.6). Sim both for flips per board and
   first-move advantage; the leader's forced win should soften.
4. **Signature pass against the dominated-22** (§5.7). Each of the 22
   needs a night it is correct on; the sim can score "nights on which this
   card is in the best five" per card. Target: no card below 5% of nights.
5. **One-match-counts** (§5.4) is a product decision, not a sim. Cheap to
   ship, expensive to retrofit once people have a habit of grinding.
6. **The cube** (§5.5) needs a paper prototype before code. Ten matches
   with a real person calling and declining will tell us more than the
   sim.
7. **Instrument "worth it tonight"** from day one, opt-in, one tap, so
   the harmonious-vs-obsessive claim is provable later.

Sim script and full tables: `research/manzil_sim.py`,
`research/manzil-sim-report.md`. Agent source notes:
`research/manzil-loop/`.

---

## 9. The walkers' road (added 19 Aug, late: the ladder, the boss, the night's rule)

The proposal, refined from the evening's discussion: on a mansion's first
night you don't face the sky cold. You face **walkers**: other players'
walking fives, piloted by the same AI, single boards, asynchronous,
anonymous, positive-only (nobody is told they were beaten; Death
Stranding's strands, Gwent's innkeepers without a server). Clear the
short ladder and the night ends at **the sky herself, decently harder,
wearing the mansion's own rule**. Once a mansion is claimed, its ladder
is done forever: every later visit goes straight to her. The ladder is
an introduction, never a toll; lifetime per mansion, not per night, or
it's a counter and counters are refused.

**Why this is the right shape.** It adds the People Fun key (the one of
Lazzaro's four Manzil lacked) without chat, timers, or comparison; it
gives the deck screen a second audience (your five walks other people's
nights while you sleep, which makes the walking five an identity object
and gives the card skins something to be seen on); and the shuffle
question answers itself: the variety is "whose five did the night deal
you", randomness before the decision, deterministic after it, the MTG
draw without dice in the fight.

**The mansion's rule.** Each of the 28 skies is a personality: the
mansion's own signature, applied to her side, plus one planet
temperament. The Storm's night, ties go to her; the Veil's night, her
revealed cards close again; the Thread's night, the road wraps; the
Void's night, a card standing alone cannot be claimed. This is Triple
Triad's regional rules and Dungeon Run's authored bosses in one move,
it recycles the 28 signatures already written, it gives every night a
name and a tell, and it is the structural answer to the oracle: 28
authored behaviours cycling with the moon cannot be learned once and
posted. One slow ambient animation per mansion-sky at the moment of
encounter (the Duolingo +1.7% lesson: craft at the threshold is
retention); the L4 card face carries a simpler version of the same
motion, which the familiarity law already wants.

**Numbers [S]** (`research/manzil-loop/ladder_sim.py`, walker hands
drawn from a skill-weighted distribution, casual to shark): a careful
player wins 89% of boards against casual walkers falling to ~32–58%
against sharp ones when following, so five rungs is a real ramp inside
three minutes. The hardened sky (deeper read, weight 12 on your reply)
takes a careful player from 65% of boards to 54%; at first-to-5 points
with the cube she wins about a third of matches against careful play
and ~92% against casual, and per-night spread is wide (8% to 100% by
mansion), which is the wall the ladder must feed players over. The
casual number says the walkers are not decoration: they are where a
casual player wins tonight, and the sky is what the ladder teaches you
to reach. Match length with the cube: 4.3 boards mean, unchanged from
today's wall-clock.

**Cautions.** Twenty-eight authored skies is real content and real QA;
ship the house rule + one temperament and let the animation carry the
rest, four mansions at a time with the moon. The walkers' ladder gates
only the game-shard and the duel, never the road-shard. And walker
hands must be real hands from real accounts, opt-out, never ranked,
never named without consent.

---

## Sources (principal)

Card minigames: [PC Gamer on Triple Triad](https://www.pcgamer.com/why-i-love-triple-triad-in-final-fantasy-viii/) · [FF Wiki, Triple Triad rules](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII)) · [FFXIV TT rules and NPCs](https://ffxiv.consolegameswiki.com/wiki/Triple_Triad) · [SE forum, "Please fix Triple Triad"](https://forum.square-enix.com/ffxiv/threads/430969) · [Caves of Narshe, Tetra Master](https://www.cavesofnarshe.com/ff9/tetramaster.php) · [TheGamer, Gwent and the adventure](https://www.thegamer.com/the-witcher-3s-gwent-is-fun-because-of-the-adventure/) · [Game Developer, CDPR ends Gwent development](https://www.gamedeveloper.com/business/cd-projekt-ending-active-development-on-gwent-after-2023) · [SteamCharts, Gwent](https://steamcharts.com/app/1284410) · [Brode, Snap design (Apple Developer)](https://developer.apple.com/news/?id=sosm2p7q) · [Hagman interview, GamesHub](https://www.gameshub.com/news/features/marvel-snap-designer-interview-kent-erik-hagman-smart-card-game-design-31692/) · [Naavik, Spotlight Caches](https://naavik.co/digest/marvel-snap-card-acquisition-spotlight-caches/) · [Eric Guan, Snap's ancient inspiration](https://ericguan.substack.com/p/marvel-snaps-ancient-inspiration) · [LocalThunk, Balatro timeline](https://localthunk.com/blog/balatro-timeline-3aarh) · [GMTK, Balatro's cursed design problem](https://gmtk.substack.com/p/balatros-cursed-design-problem) · [Fox Row, StS 18M runs](https://foxrow.com/slay-the-spire-statistical-analysis) · [Game Developer, Inscryption](https://www.gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption) · [GamesRadar, Dungeon Run](https://www.gamesradar.com/in-hearthstones-kobolds-catacombs-dungeon-runs-play-so-fast-it-doesnt-feel-bad-to-lose-says-blizzard/) · [Screen Rant, Battlegrounds 2026](https://screenrant.com/hearthstone-battlegrounds-blizzard-interview-2026/) · [Game Rant, TCG Pocket MAU](https://gamerant.com/pokemon-tcg-pocket-player-count-loss-changes/) · [Game Developer, why Artifact failed](https://www.gamedeveloper.com/design/why-artifact-failed)

Daily rituals: [Fast Company, NYT Games 2025 stats](https://www.fastcompany.com/91539885/wordle-statistics-show-why-new-york-times-is-turning-game-into-nbc-tv-show) · [Wordle (Wikipedia)](https://en.wikipedia.org/wiki/Wordle) · [Koster on Connections](https://www.raphkoster.com/2023/09/02/why-nyts-connections-makes-you-feel-bad/) · [Nieman Lab, Spelling Bee](https://www.niemanlab.org/reading/the-genius-of-the-new-york-times-spelling-bee/) · [GeekWire, crossword data](https://www.geekwire.com/2016/hard-new-york-times-crossword-startup-finds-answer-first-ever-data-analysis/) · [Chess.com puzzle ratings](https://www.chess.com/news/view/announcing-new-puzzles-rating-system) · [Duolingo leagues](https://blog.duolingo.com/duolingo-leagues-leaderboards/) · [Game Developer, Spelunky daily](https://www.gamedeveloper.com/design/the-understated-genius-of-the-i-spelunky-i-daily-challenge) · [Six Colors, Zach Gage](https://sixcolors.com/post/2024/08/interview-game-developer-zach-gage-on-pile-up-poker-and-resisting-dark-patterns/) · [Game Developer, Puzzmo](https://www.gamedeveloper.com/design/puzzmo-co-creator-zach-gage-on-building-newspaper-games-that-can-last-forever) · [Game Developer, Desert Golfing](https://www.gamedeveloper.com/design/7-questions-for-i-desert-golfing-i-creator-justin-smith) · [Immaculate Grid (Wikipedia)](https://en.wikipedia.org/wiki/Immaculate_Grid) · [PocketGamer.biz, Pokémon GO 20M WAU](https://www.pocketgamer.biz/pokmon-go-has-20m-weekly-active-players-nearly-nine-years-after-its-global-launch/) · [PocketGamer.biz, Pokémon GO $9B](https://www.pocketgamer.biz/pokemon-go-celebrates-10th-anniversary-with-over-9bn-in-revenue/)

Decade games and theory: [Lostgarden, Loops and Arcs](https://lostgarden.com/2012/04/30/loops-and-arcs/comment-page-1/) · [Lostgarden, Cozy Games](https://lostgarden.com/2018/01/24/cozy-games/) · [Rosewater, Lenticular Design](https://magic.wizards.com/en/news/making-magic/lenticular-design-2014-12-15) · [Rosewater, Twenty Lessons pt 1](https://magic.wizards.com/en/news/making-magic/twenty-years-twenty-lessons-part-1-2016-05-30) · [Meier, interesting decisions (GDC 2012)](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions) · [Quantic Foundry, strategy decline](https://quanticfoundry.com/2024/05/21/strategy-decline/) · [Trackmania TOTD](https://doc.trackmania.com/play/what-is-totd/) · [Trackmania COTD](https://doc.trackmania.com/play/how-to-play-cotd/) · [FreeCell (Wikipedia)](https://en.wikipedia.org/wiki/FreeCell) · [Into the Breach (Wikipedia)](https://en.wikipedia.org/wiki/Into_the_Breach) · [Inverse, Hades God Mode](https://www.inverse.com/gaming/hades-god-mode-interview) · [Vice, Celeste assist mode](https://www.vice.com/en/article/celeste-difficulty-assist-mode/) · [Hookshot, Devil Daggers](https://www.hookshot.ink/blog/devil-daggers) · [NE Backgammon Club, early doublers](https://nebackgammon.org/index.php/early-doublers/) · [Lazzaro, four keys](https://www.nicolelazzaro.com/the4-keys-to-fun/) · [Forbes/Tassi, Destiny Trials](https://www.forbes.com/sites/paultassi/2020/05/11/everyone-is-wrong-about-whats-wrong-with-trials-in-destiny-2/) · [Nature HSSC, Zeigarnik/Ovsiankina meta-analysis](https://www.nature.com/articles/s41599-025-05000-w) · [Royal Society Open Science, time played and wellbeing](https://royalsocietypublishing.org/rsos/article/9/7/220411/96718/Time-spent-playing-video-games-is-unlikely-to) · [OII, quality not quantity](https://www.oii.ox.ac.uk/news-events/its-quality-not-quantity-that-predicts-gamers-wellbeing-new-study-finds/) · [Cyberpsychology, harmonious vs obsessive passion](https://cyberpsychology.eu/article/view/13600)

Not verified this run (flagged in the agent notes): Battlegrounds' share of Hearthstone players; Runeterra PoC "doubled players"; Garfield's "luck gives the loser an excuse" exact wording; daily-seed participation shares for StS/Spelunky/Balatro; whether Tetris Effect's Full Moon tracks the real moon.
