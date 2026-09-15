# Manzil — quantitative analysis of the decision space as implemented

Source of truth: the rules as coded in `Manzil - Prototype.dc.html` (`_resolve`, `_tryFlip`, `_counts`,
`_skyMove`, `_bestYouReply`), ported line-for-line to `research/manzil_sim.py`
(raw numbers in `research/manzil-loop/manzil-sim-results.json`). All figures are **per board** unless a
row says "match". "Default five" = the prototype's owned hand at its prototype levels:
Storm **8|6** (L3 — the code bumps the smaller side, so not 8|5), Throne 6|9 (L2, two-faced),
Crown 6|6 (L1, no signature), Heart 7|7 (L2), Blaze 5|6 (L2). Sky = Saturn 9|5, Mars 8|6,
Venus 4|7, Mercury 6|5, Jupiter 7|8, homes 26/14/22/8/2.

## 0. Assumptions and ambiguities resolved

| # | Point | Resolution used |
|---|---|---|
| A1 | Storm's numbers | Prototype has Storm at **L3 → 8\|6**, not the 8\|5 on the brief. Used 8\|6 for the default-five runs; 8\|5 for all L1-vanilla runs. |
| A2 | Tied count at board end | `you > sky ? "you" : "sky"` — **ties go to the sky**. Kept. (Ties exist because Jupiter and dominion make the total even.) |
| A3 | What the AI knows | `_skyMove` reads `st.hand` — the sky sees your remaining hand and reads your best reply. Kept (your hand is face-up in the UI). |
| A4 | Signatures after a claim | Ownership-keyed as coded: Storm ties / Heart safety / Blaze brand only while **you** hold the card; Jupiter's "counts 2" and dominion follow the card to whoever holds it; Mars only chains when Mars is the card being lodged; Saturn is never claimable; Venus softens **both** neighbours including the sky's own, once, on lodge. |
| A5 | Follower's fifth card | 9 slots, 5+5 cards: the leader lodges 5, the follower lodges 4 and never plays the 5th. Kept. |
| A6 | Planet dominion | Fixed homes 26/14/22/8/2 as in the prototype (not the live ephemeris). Every 9-slot road contains ≥1 sky home (largest gap between homes is 8). |
| A7 | "2-ply player" | Your-side mirror of the AI's own score `(you−sky)·10 − bestSkyReply·8`. "1-ply" = max immediate `you−sky`. Two tiebreak variants: deterministic (first in hand order, as a script would) and random (`_rt`, 40 runs per tonight×lead). |
| A8 | "Minimax player" | Full-depth adversarial alpha-beta on win/loss (sky may play anything, incl. Mercury faces); plays a forced win if one exists, else falls back to 2-ply. Run at 7 sampled tonights (1,5,…,25) — ~40 s each in Python. |
| A9 | "Oracle" (exact exploiter) | Searches *your* lines against the real deterministic AI (5-ply over your moves, AI replies computed exactly). This is what a player who replays a night until it works converges to. |
| A10 | Human think time | 4 s per turn for wall-clock estimates; timers from the code (deal 1100, AI 800/1300, drop 320, flip 400, finish 260, round end 1300, round screen 3800, exit 340 ms). |

## 1. Win rates against the implemented AI (default five, all 28 tonights × both leads)

| Player | Board win % (lead) | Board win % (follow) | Board win % (all) | Boards ending tied → sky | Match win % (Bo5) |
|---|---|---|---|---|---|
| Random | 1.0 | 0.3 | **0.7** | 1.3 % | 0.0 |
| Greedy 1-ply (det. tiebreak) | 25.0 | 17.9 | **21.4** | 7.1 % | 25.0 (n=28) |
| Greedy 1-ply (random tiebreak) | 24.0 | 18.4 | **21.2** | 6.9 % | 13.3 |
| 2-ply mirror (det.) | 3.6 | 21.4 | **12.5** | 21.4 % | 3.6 (n=28) |
| 2-ply mirror (random tiebreak) | 10.0 | 12.1 | **11.0** | 23.0 % | 6.7 |
| Full minimax (adversarial sky), 7 tonights | **100** (7/7 forced wins) | 14 (1/7) | 57 | — | 100 (you lead boards 1,3,5) |
| Oracle (exact vs the real AI), all 28 | **100** | **100** | **100** | — | 100 |

Per-tonight spread (dominion matters):

| Tonight | Road | Sky homes on road | Your homes on road | Random | 1-ply (rt) L/F | 2-ply (rt) L/F |
|---|---|---|---|---|---|---|
| 5 | 5–13 | Mer | Blz Stm Thr | 0.0/0.0 | 0/0 | 0/0 |
| 6 | 6–14 | Mer Mar | Stm Thr | 0.5/0.0 | 0/0 | 0/0 |
| 11 | 11–19 | Mar | Crn Hrt | 0/1.5 | **62/25** | 3/0 |
| 13 | 13–21 | Mar | Crn Hrt | 0.5/1.0 | 45/**60** | 0/0 |
| 17 | 17–25 | Ven | Crn Hrt | 0/0 | 5/0 | 0/0 |
| 22 | 22–2 | Ven Sat Jup | — | 0/0 | 28/0 | 0/0 |
| 26 | 26–6 | Sat Jup | Blz Stm | 0.5/0 | 57/38 | 25/**100** |
| 27 | 27–7 | Jup | Blz Stm | 1.0/0 | 47/35 | 55/23 |

(Full 28-row table in the JSON.) 1-ply win rate ranges **0 % → 62 %** purely by which mansion is "tonight"; the
worst nights are the ones where Mars's home (14) or Venus's (22) sits mid-road and none of your 8/9 cards has a home on it.
Dominion decides more boards than any of your four live signatures (§5).

## 2. Does the walking five matter? (L1 vanilla, no signatures, 2-ply player, 28 tonights × 2 leads)

1 500 random hands of C(28,5)=98 280 plus a hill-climb from the best sampled hand (1 714 hands evaluated).

| Statistic | Board win % |
|---|---|
| Median hand | **0.0** |
| Mean hand | 2.7 |
| 75th percentile | 1.8 |
| 95th percentile | 17.9 |
| Best sampled (Blaze, Storm, Throne, Heart, Void) | 25.0 |
| Best found by hill-climb: **Storm 8\|5, Veil 8\|2, Heart 7\|7, Empty District 2\|8, Void 9\|2** | **53.6** |
| Default five at L1 (Blaze, Storm, Throne, Crown, Heart) | 8.9 |
| Hands within 5 points of the best | **0.1 %** (2 of 1 714) |
| Hands within 10 points of the best | 0.35 % |

Mean board win % of hands containing each card (top of the cliff, then the rest):

| Card | Mean % | Card | Mean % |
|---|---|---|---|
| Void 9\|2 | 8.4 | Jewel 7\|7 | 1.7 |
| Empty District 2\|8 | 7.1 | Follower 7\|7 | 1.7 |
| Veil 8\|2 | 5.9 | Crown 6\|6 | 1.6 |
| Throne 6\|9 | 5.7 | (the other 19 cards) | 0.6 – 1.4 |
| Storm 8\|5 | 5.7 | Thread 5\|6 (worst) | 0.6 |
| Heart 7\|7 | 5.7 | | |

Cross-check with the exact exploiter (oracle) at 7 tonights × 2 leads, to separate "the hand is weak" from "the 2-ply agent is weak":

| Hand | Oracle board win % | 2-ply % |
|---|---|---|
| Best found (Storm, Veil, Heart, Empty District, Void) | **100** | 64 |
| Default five at L1 | 93 | 14 |
| Lowest totals (Bearer, Glance, Drum, Hand, Listener) | 36 | 0 |
| Glance, Mane, Hand, Void, Thread | 43 | 0 |
| All sevens (Follower, Jewel, Heart, Gathered Stars, Return) | 21 | 0 |
| Balanced sixes (Ghost, Claws, Crown, Flock, Gate) | **0** | 0 |

The deck screen is a real decision, but a one-directional one: you want 8s and 9s facing the sky, and only
six cards carry one (Void, Throne, Storm, Veil, Empty District — plus Storm at L3). A hand of sixes is unwinnable
even with perfect play.

## 3. Number space

Values 2–9. Planet facings: l = 9, 8, 4, 6, 7 and r = 5, 6, 7, 5, 8.

| Measure | Result |
|---|---|
| Your-card face vs planet face, all 280 static pairings (28 cards × 5 planets × 2 sides) | you win **33 %**, tie **17 %**, lose 50 % |
| Ties in actual duels, 2-ply vs sky (default five) | **14.8 %** of comparisons |
| Ties in actual duels, random vs sky | 8.7 % |
| Ties in actual duels, 2-ply, vanilla hand (Follower/Jewel/Heart/Throne/Void) | 17.7 % |
| Cards that beat Saturn's **9** (standing left of it, your r > 9) | **0 / 28** (Throne's 9 ties; Saturn is unclaimable anyway) |
| Cards that beat Saturn's **5** (standing right of it, your l > 5) | 22 / 28 (moot — Saturn cannot be claimed) |
| Cards **safe from Saturn** on its left (your r ≥ 9) | 1 / 28 (Throne) |
| Cards safe from Saturn on its right (your l ≥ 5) | 25 / 28 (not Glance 4, Empty District 2, Drum 4) |
| Strictly dominated at L1 (numbers only) | **22 / 28**. Undominated: Follower 7\|7, Jewel 7\|7, Heart 7\|7, Storm 8\|5, Throne 6\|9, Void 9\|2 |
| Cards carrying an 8 or 9 | 5 (Void, Throne, Storm, Veil, Empty District) |
| Flips per turn / per board (2-ply vs AI, det.) | **0.16 / 1.5** — 87 % of turns flip nothing |
| Flips per board: random vs AI · 1-ply vs AI · 2-ply(rt) vs AI · oracle vs AI | 3.2 · 4.4 · 0.9 · 3.9 |
| Final margin, 2-ply(rt) vs AI (280 boards) | 25 % tied (→ sky), 26 % lost by 1, only 9 % won |

## 4. First move

| Setting | Leader board win % |
|---|---|
| Symmetric mirror match, both sides vanilla mansion cards, no signatures, no dominion — random vs random (n=800) | **70** |
| — 1-ply vs 1-ply | 59 |
| — 2-ply vs 2-ply | **77** |
| Default five vs sky: random | lead 1.0 / follow 0.3 |
| — 1-ply | lead 25 / follow 18 |
| — 2-ply (rt) | lead 10 / follow 12 |
| Adversarial minimax, default five (7 tonights) | lead: forced win **7/7** · follow: forced loss 6/7 |

Structurally the leader lodges 5 cards to 4 and gets the last, unanswered lodge. Under perfect play the board is a
first-player win at every sampled night; since you always lead board 1 and leads alternate, a perfect-vs-perfect
match goes **3–2 to the player every time**.

## 5. Ablation — remove one signature (default five vs AI, 28 tonights × 2 leads)

Board win % for the player; Δ vs baseline in parentheses (positive = removing it helps you).

| Removed | 2-ply det. | 2-ply rt | 1-ply det. | 1-ply rt | Random (×150) |
|---|---|---|---|---|---|
| — baseline | 12.5 | 10.1 | 21.4 | 20.6 | 0.55 |
| **Jupiter** counts 2 | **46.4 (+34)** | **34.6 (+24)** | 23.2 (+2) | 18.7 (−2) | 1.20 (+0.65) |
| **Mars** chain | **41.1 (+29)** | **22.5 (+12)** | 21.4 (0) | 27.0 (+6) | 0.63 |
| Saturn locked | 19.6 (+7) | 11.5 (+1) | 17.9 (−4) | 27.8 (+7) | 1.19 (+0.64) |
| Venus softens | 14.3 (+2) | 13.5 (+3) | 21.4 (0) | 20.6 (0) | 0.58 |
| Mercury reverses | 12.5 (0) | 11.9 (+2) | 21.4 (0) | 21.1 (0) | 0.56 |
| All five sky signatures | **62.5 (+50)** | **50.1 (+40)** | 35.7 (+14) | 30.4 (+10) | 3.07 (+2.5) |
| **Throne** two-faced | **1.8 (−11)** | **5.5 (−5)** | 10.7 (−11) | 20.8 (0) | 0.89 |
| **Storm** claims ties | 12.5 (0) | 8.4 (−2) | **10.7 (−11)** | **13.6 (−7)** | 0.44 |
| Heart safe | 17.9 (+5)* | 10.6 (0) | 21.4 (0) | 18.2 (−2) | 0.45 |
| Blaze final | 12.5 (0) | 10.1 (0) | 21.4 (0) | 19.7 (−1) | 0.54 |
| All four of yours | 8.9 (−4) | 4.9 (−5) | 7.1 (−14) | 7.6 (−13) | 0.24 |
| Dominion | 0.0† | 0.0† | 0.0† | 18.9 (−2) | 0.24 (−0.3) |
| Everything off | 50.0† | 50.0† | 0.0† | 31.9 (+11) | 2.96 |

\* deterministic-tiebreak path noise (the rt column shows 0). † with dominion off all 28 tonights are the same
game, so the deterministic rows are 2 games, not 56 — read the rt/random columns. Dominion's real effect is not the
average but the **per-night variance** in §1 (0 % → 62 % for the same hand and agent).

## 6. Decision density (default five vs AI)

| Turn (yours) | Legal moves (hand × empty × faces) | 1-ply: moves tied for best | 2-ply: tied for best | Oracle: % of legal moves that still win | Oracle: # winning moves |
|---|---|---|---|---|---|
| 1 | **51** (54 leading / 48 following) | 14.4 | 3.5 | **67 %** | 34.8 |
| 2 | 32 | 9.8 | 2.7 | **12.7 %** | 4.2 |
| 3 | 13.6 | 8.4 | 1.9 | **8.2 %** | 1.3 |
| 4 | 5 | 3.9 | 2.9 | 30 % | 1.6 |
| 5 (leader only) | **1** | 1 | 1 | 100 % | 1.1 |
| all | 22.7 | 8.2 | 2.6 | 37 % | 9.4 |
| best move unique | — | 27 % of turns | 42 % of turns | 44 % of turns | — |

Against the real AI the opening is almost free (two-thirds of openings still win), turns 2–3 are the whole game
(one or two winning moves out of 13–32), turn 5 is forced and the follower's 5th card is never played.

## 7. Length and wall-clock

| Quantity | Value |
|---|---|
| Turns per board | 9 always (leader 5, follower 4) |
| Boards per match (Bo5): random / 1-ply / 2-ply vs AI | 3.03 / 3.3–3.7 / 3.3–3.5 |
| Boards per match at equal skill (p=0.5 per board) | 4.125 (max 5) |
| Animation floor per turn (drop 0.32 + finish 0.26 + 0.17 flips × 0.40) | ≈ 0.65 s |
| Board, pure animation (deal 1.1 + 9 × 0.65 + 4 AI waits × 0.8 + round end 1.3) | ≈ **11.5 s** |
| Board with 4 s human think per turn | ≈ **31 s** |
| Between boards (round screen 3.8 + exit 0.34) | 4.1 s |
| Match wall-clock, 3.3–4.1 boards, 4 s thinking | **≈ 1.9 – 2.4 min** (animation floor ≈ 50 s) |
| Match wall-clock if a fast player replays a known winning line (≈1 s think) | ≈ 1.0 min |

## 8. Design observations (derived from the numbers)

1. **The AI is already solved.** A 5-ply search over your own moves against the deterministic sky wins **100 % of 56 boards** (every tonight, both leads) with the default five, and 93 % with that hand at L1. Because the sky is deterministic and the night is the same for everyone, a winning line, once found, is a replayable script — one Reddit thread per night. Either add a seeded stochastic element (e.g. which face Mercury shows, or sky tiebreaks) or accept that "beat the sky" is a puzzle with a posted solution.
2. **…but it is not beatable casually.** Random play wins 0.7 % of boards, greedy 1-ply 21 %, the AI's own 2-ply heuristic used against it only 11–12 %, and the match conversion is worse (Bo5 at p≈0.2 → 7 % match win). A new player with a loaner hand will lose nearly every match for a long time; the curve from "can't win" to "always win" is a cliff, not a ramp.
3. **The sky's edge is almost entirely Jupiter + Mars + ties-to-sky, not the fight.** Removing Jupiter's "counts 2" takes the 2-ply player from 10–12 % to 35–46 %; removing Mars's chain, to 22–41 %; removing all five planet signatures, to 50–62 %. Meanwhile **21–25 % of 2-ply boards end in a tied count**, all awarded to the sky — a hidden quarter of the sky's wins. If ties stayed with the player, or went to whoever lodged last, the baseline would move more than any single card signature.
4. **Cards barely flip.** Two cautious agents produce **0.9–1.5 flips per board** (87 % of turns flip nothing); even perfect play flips ~4. With values 2–9 and planets showing 9/8/7 on the sides that matter, your card beats a planet face in only 33 % of static pairings and ties 17 %. The "capture duel" is mostly a placement/count game decided by Jupiter, dominion and the 5-vs-4 lodge count.
5. **Only ~6 of 28 cards are worth slotting at L1.** Mean win rate by card has a cliff: Void, Empty District, Veil, Throne, Storm, Heart (5.7–8.4 %) vs. everything else (≤1.7 %). 22 of 28 cards are strictly dominated on numbers; a hand of 6|6 cards is **unwinnable even for the oracle** (0 %), while "all sevens" is 21 %. Levels (+1, +1) will not fix this — a 7 becomes an 8 only at L3, and 8 is the floor for touching Mars/Jupiter/Saturn. The deck screen is a real decision (0.1 % of hands are within 5 points of the best), but the answer is always "bring the 8s and 9s", which is a one-time discovery, not an ongoing expression.
6. **First move is worth a lot — structurally ~60–77 % in a mirror, and a forced win under perfect play.** The leader lodges 5 cards to 4 and has the last unanswered move; full minimax says the leader wins by force at 7/7 sampled nights with the default five and the follower loses by force at 6/7. With alternating leads in Bo5 the player always leads boards 1, 3, 5 — a perfect-vs-perfect match is 3–2 to the player. Against the actual AI this edge is swamped by the sky's signatures (1-ply: 25 % leading vs 18 % following), but once players are strong it becomes the structure of the match.
7. **The follower's fifth card never lands.** Half your boards are played with four cards; the "walking five" is in practice "four plus a spare you may never use". Either make the follower's 5th card matter (a 10-slot road, or let the follower choose which four) or own it as a designed asymmetry.
8. **Tonight matters more than your abilities.** Same hand, same agent, 0 % on night 5 and 62 % on night 11. Every 9-slot road contains at least one planet home (homes are ≤8 apart), so the sky always has a dominion slot; the player's homes are whatever they brought. That makes "spotting dominion is skill" load-bearing — but it also means the nightly difficulty swing is ±30 points with no signal on the deck screen. Worth a subtle tell (the road already shows mansion names; the deck screen does not).
9. **Throne and Storm are your only live signatures that do anything; Heart and Blaze are near-dead.** Ablating Throne's two faces costs 5–11 points, Storm's tie-claim 2–11 (ties are 15–17 % of duels, so it is the right card to give that move to). Heart and Blaze move the needle 0–2 points: Blaze's "claims are final" requires a re-claim, which needs a flip and then a second adjacent lodge — with ~1 flip per board it essentially never triggers. If the L2 reveal is meant to feel like waking up, half the live set wakes up to nothing.
10. **Decisions are concentrated in turns 2–3.** Turn 1 has 51 legal moves and 67 % of them still win against the real AI; turn 5 has exactly 1; the oracle's winning set collapses to 1–4 moves at turns 2–3. Heuristic agents see 3–14 moves tied for best per turn. The interesting part of a board is about two choices, which is fine for a 30-second board but argues against stretching boards (a 14-slot eclipse board would add turns of mostly-forced play unless the number space widens).
11. **Length is right, time-to-content isn't the issue.** A Bo5 match is 3–4 boards and ~2 minutes with thinking, ~50 s at the animation floor; a solved-line replay is ~1 minute. Best-of-five does little to reduce variance here because boards alternate lead and win rates differ sharply by lead; if the goal is "a match a night", Bo3 would cost nothing in fairness.
12. **The levers that would change the numbers most, in order:** (i) tie handling at the count, (ii) Jupiter's weight (make it situational, e.g. only on its home or only if unflipped), (iii) a stochastic or hidden element in the sky's play so the solution cannot be copied, (iv) widening the number space or giving more than 5 cards an 8/9 so that more than a quarter of the collection is playable, (v) deciding what the follower's fifth card is for.

## Addendum (19 Aug, later): board length 9 vs 11 vs 13

`research/manzil_sim_n.py` = the same engine with the road length as a parameter. Hands scale with the road (N=9: 5 cards each; 11: 6; 13: 7). Your extra cards: Void, then Veil. Her extra cards: Uranus 8|8, then Neptune 3|9 (no signatures). Default five at prototype levels; all 28 tonights × both leads × 6 reps; ties to the sky as coded.

| Road | 1-ply win % (flips/board) | 2-ply win % (flips) | random % | legal moves/turn | turns with a unique best move | leader wins, 1-ply mirror |
|---|---|---|---|---|---|---|
| 9 | 24 (4.4) | 10 (0.8) | 0.9 | 22 | 38 % | 54 % |
| 11 | 7 (6.0) | 22 (1.6) | 0.3 | 31 | 34 % | 53 % |
| 13 | 5 (7.3) | 18 (2.1) | 0.0 | 41 | 31 % | 56 % |

Reading: a longer road adds legal moves but not distinct ones (the share of turns with a single best move falls), flips per turn barely move (0.49 → 0.55 → 0.56), first-move advantage is unchanged, and the extra planet cards make the sky stronger faster than the extra mansion cards help you. Turns per board rise 9 → 13 (≈30 s → ≈50 s at 4 s a turn). Length is not the lever; interaction per placement is. Caveat: the extra cards on both sides confound the win rates; the density and flip columns are the clean comparison.
