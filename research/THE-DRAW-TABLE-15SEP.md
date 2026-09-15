# The draw table: the level rule with dawn on top of it, five forms, and the defender stands

**15 September 2026. Measurement → Design (cc Code).** The last open item before dawn is called done. Dawn stacks a second komi on the level rule (a level board goes to the answerer), and the 14 Sep note said the level rule should be re-read once dawn shipped. This is that read: five forms of the level rule, each measured with dawn (duel) live and tonight's law on tonight's window, on the mirror board (equal decks, both careful), all 28 nights, two seeds, 1792 boards a seat a night. Two decks: **fresh** (the sun at three, five planets at two, the rest asleep: the shape of early play and of the ladder) and **awake** (every signature at level two: the shape of developed collections and of most PvP). `research/drawtab.js`; the calendar is now shared from `research/laws.js`.

One thing that makes the table exact: the search does not read the level rule, so the boards are identical under every form. Each board is played once and its level boards are re-read five ways. The rows differ only in who gets the level boards, and nothing else moves.

## The five forms

| form | the sentence |
|---|---|
| **defender** | a level board goes to the answerer (the rule as shipped) |
| **house** | the side whose card of tonight's house stands on the road takes a level board; if it is not on the road, the answerer |
| **moon** | the side holding more stations of tonight's quarter takes it; still level, the answerer |
| **nobody** | a level board is a draw (scored half each here; on the road it would be replayed) |
| **leader** | the side that led takes it |

## The table

Level boards are **10.2% of boards on the fresh deck and 8.7% on the awake deck** (range 7.4 to 11.8 by night). That is the whole lever: each form is the same nine or ten boards in a hundred handed to a different side, and the swing from defender to leader is worth about twenty points of seat on both decks.

**Fresh deck** (mean of 28 nights; the seat is you-lead minus she-leads; the bound is ±8):

| form | you lead | she leads | mean seat | nights inside ±5 | nights outside ±8 |
|---|---|---|---|---|---|
| **defender** | 48.8 | 53.4 | **−4.6** | 12 | 6 (m3, m6, m12, m15, m18, m21) |
| house | 50.4 | 51.9 | −1.4 | **18** | 4 (m4, m15, m21, m25) |
| moon | 53.6 | 48.4 | +5.2 | 12 | 9 |
| nobody | 53.8 | 48.3 | +5.5 | 13 | 10 |
| leader | 58.9 | 43.2 | +15.7 | 1 | 27 |

**Awake deck:**

| form | you lead | she leads | mean seat | nights inside ±5 | nights outside ±8 |
|---|---|---|---|---|---|
| **defender** | 51.1 | 49.5 | **+1.7** | **16** | 6 (m10, m14, m15, m21, m24, m27) |
| house | 52.6 | 48.0 | +4.6 | 13 | 10 |
| moon | 55.3 | 45.4 | +9.9 | 4 | 16 |
| nobody | 55.5 | 45.1 | +10.3 | 5 | 21 |
| leader | 59.8 | 40.8 | +19.0 | 0 | 27 |

## What it says

**The defender stands.** With dawn on top of it the level rule reads −4.6 on the fresh deck and +1.7 on the awake deck: a small tilt to the answerer early, near even later, and the most nights inside the bound of any form on the awake deck. The two komis together are about the size the leader's seat was on its own before dawn (+4.9 mean on 14 Sep), which is the symmetry we wanted. Nothing here asks for the rule to move.

**The night-read tiebreaks are leader rules in disguise.** The moon's quarter reads +5 fresh and +10 awake, and a draw reads the same. The reason is structural: the leader lodges five cards to the follower's four, so on a level board the leader is the side more likely to hold more of any quarter, and a replayed draw hands the seat back to the same leader. Both forms are a leader rule at half strength. The moon's quarter is the better story and the worse rule.

**The house form is the one honest alternative.** Tonight's card deciding a level board reads −1.4 on the fresh deck with 18 nights inside ±5, the evenest row on that deck, and it is night-flavoured in a way the defender is not. Its cost is that it flips sign between decks (+4.6 awake, 10 nights outside the bound) because a developed collection lodges the house card more often and the leader lodges more cards. If Design wants a tiebreak with a story, this is the only one that survives the table, and it should be measured on the ladder before it ships. My call is that the defender is the right rule and the house is a good line for the codex about what the level rule does not do.

## The flag: the hush nights are out of bound under the decided rules

m15 (the veil) and m21 (the district) are the two nights the hush law slides onto, and they read **−12.9 and −18.6** on the fresh deck under defender, **−16.1 and −12.8** awake. No form brings m21 inside ±8 except the leader (+4.8 fresh) and the moon (−9.7). The hush silences the two stations beside the middle, which cuts the leader's last word down to seven live stations, and dawn's follower komi lands on top of that. Before dawn the district read as the easiest climb on the ring (55% clear, 13 Sep); this is the same lean measured from the other seat.

Not a level-rule problem, so not fixed here. Three ways to read it for Design, in order of how little they change: accept it (two nights in 28 where the answerer is favoured by twelve to nineteen is a real geography and a night's character); give the hush nights the leader form of the level rule as part of the hush's own text (m21 goes from −18.6 to +4.8, inside the bound; m15 from −12.9 to +9.2, just past it the other way); or re-read the hush's window. I would measure the second on the ladder before choosing; it is one line in the calendar and an hour to run.

The other nights outside ±8 under defender (m3, m6, m12, m18 fresh; m10, m14, m24, m27 awake) are all between 8 and 9.1 in size and sit on one deck only; they are the bound's edge, not a breach, and they were there before dawn.

## For Code

Nothing to port. `drawTo` gains `moon`, `house` and `nobody` in the reference so the table can be re-run; the shipped rule is unchanged. If Design takes the hush option, it is `drawTo:"leader"` on the two hush nights and nowhere else, and I will send the fixture with it.

### Files

`research/v2.js` (`drawTo` forms), `research/drawtab.js`, `research/laws.js` (the calendar, shared), `research/drawsum.py`, `draw_[ab]_*.out` (awake), `drawf_[ab]_*.out` (fresh).
