# DECK-BENCH-DISTILL-3 (23 Oct 2026): the strategy-first prototype, before it goes to Code

Scope: the canvas "Deck Bench · strategy-first prototype" (`project/Main.dc.html` desktop, `project/Mobile.dc.html` phone). Measured against the ux-distill laws and against Star Shard's UI research. The principles come from `starshard.net/UI-PRINCIPLES.md`: Norman's system image, Gestalt regions, signifiers, two-level disclosure, Rams' honesty, and "ceremony scales inversely with frequency". The cuts are already applied to the prototype; this brief is what Code builds from.

## 1 · Verdict
The prototype has the right loop and the right tabs, but its status line and Deck tab still talk the way the engine is built rather than the way a player thinks. It shows two version counters, three words for "the deck I play", the same test result in four places, and "own" stamped on 24 cards. Also, one claim isn't true yet: "the sim plays it this way."

| Measure | Before | Where | After |
|---|---|---|---|
| Version counters on the status line | 2 | "strategy v3 · list v7" | 1 · v7 |
| Words for "the version I play" | 3 | "Keep v7", "in your sleeves", "sleeved v6" | 1 · **your deck** |
| Places the latest test result shows on Test | 4 | status line pill, comparisons row, Matchups header, coach | 1 per tab (Test leads with it; Matchups keeps its own matchup's line) |
| "own" labels on the Deck tab | 24 | every owned card row | 0 · only missing cards are marked |
| Verbs for "try this card" on the obstacles table | 2 | "Test", "Apply" | 1 · **Try** |
| Claims the sim can't back yet | 1 | "the sim plays it this way" | 0 until the strategy pilot ships |
| Helper lines that state a mechanism, not a reason | 3 | "your words", the affiliate line, "Ask, or tell it…" label + example | 0 |
| Equal-weight sections leading the Test tab | 4 | comparisons, strategy stats, losses, field | 1 answer, then 2 tiers |
| Phone bottom-bar items | 5 | Deck · Test · Matchups · Collection · Table | 4 · Deck · Test · Table · Collection |

## 2 · Method
Counted every visible string in both artboards. Then walked the loop (bring deck → read strategy → try a fix → read the test → keep → play at the table) against the five distill laws and UI-PRINCIPLES' seven.

## 3 · Vocabulary law (adds to DISTILL and DISTILL-2)

| Concept | THE word | Retired |
|---|---|---|
| the version you actually play, in your sleeves | **your deck** ("your deck: v6") | current, kept, sleeved, in your sleeves |
| making a version the one you play | **Make v7 your deck** (then the paper checklist) | Keep v7, Make current |
| any saved list | **v7** (one counter) | list v7, strategy v3 (the strategy has dated history, not a number) |
| putting a candidate card into a new version | **Try** → Save sheet | Apply, Test (as a row action) |
| what the deck is trying to do | **strategy** | plan (at the deck level) |
| how to play one matchup | **plan** (in Matchups) | game plan, book entry |
| the per-opponent page | **Matchups** | Book |

**Grep rule:** zero visible hits for `sleeved|in your sleeves|Keep v|list v|strategy v|Apply|Book\b`.

## 4 · Copy budget, with UI-PRINCIPLES' tiers
- **Every tab leads with its answer.** UI-PRINCIPLES §2c: tier 1 is the answer, tier 2 is context, tier 3 is the numbers; two levels at most; state, cost and risk always at level 1.
  - **Deck:** what the deck is (one line) and the 60.
  - **Test:** the latest verdict.
  - **Matchups:** the plan.
  - **Collection:** the value and the next move.
- **The status line holds state only:** which version you're viewing, and which version is your deck. Results live on Test.
- **Mark the exception, never the rule.** Owned cards carry no label; a missing card shows "need 1 · $6.80".
- **Honest (Rams 6).** No line implies a capability the sim doesn't have. The piloting rules show as the deck's rules; "the sim plays it this way" returns when the strategy pilot (E4) passes its gate.
- **No mechanism lines on player screens.** The no-affiliate-code-on-your-own-account rule is behaviour, not copy.

## 5 · Cut list (applied in the prototype)

| Screen | Cut | Now |
|---|---|---|
| Status line (both) | "strategy v3 · list v7 · tested vs Dimir +9 per 100 · in your sleeves: v6 · Keep v7" | "Viewing v7 · your deck: v6" + **Make v7 your deck** when they differ |
| Deck | "list v7 · 60 + 15 · Standard legal"; 24 × "own" | "60 + 15 · Standard legal"; only missing cards marked ("need 1 · $6.80") |
| Deck · strategy | "The strategy: what Squall is doing" · "strategy v3 · your words · Edit · History" · "· the sim plays it this way" | "Strategy" · "Edit · History"; piloting shown as rules |
| Deck · obstacles | actions "Test" / "Apply"; column "Answers · yours, then best in Standard" | action **Try** on every row; column "Answers" |
| Save sheet | "Save as v8?" · "from v7 · answers targeted removal" | "Try +2 Swiftfoot Boots" · the diff · **Save and test vs Dimir** · Save · Cancel |
| Test | four equal sections | Tier 1: the verdict card ("v7 beats v6 against Dimir · +9 per 100 (±6)", **Make v7 your deck**, Test on the whole field). Then: is the strategy happening, why you lose. Then: the field and the history of comparisons |
| Collection | "plain links on your own account; no affiliate code" | removed (behaviour only) |
| Coach | label "Ask, or tell it what you want the deck to do" + placeholder | label "Ask the coach" · placeholder "I want flying more consistent" |
| Phone bar | Deck · Test · Matchups · Collection · Table | Deck · Test · **Table** · Collection. Table holds the matchups: pick who you're playing and the plan opens; "All matchups" lists them |

## 6 · One owner per thing
| Thing | Owner | Remove from |
|---|---|---|
| Test results | Test | the status line, the coach's static lines |
| Buying | Collection (Deck only marks what's missing, with a link to Collection) | prices on obstacle rows (kept only as "buy $1.20" when an answer isn't owned) |
| Which version is your deck | the status line's **Make vN your deck**, which ends on the paper checklist | Test rows ("Keep v7") |
| The strategy text | the Deck tab's strategy block (Edit) | the coach (it proposes; the block owns) |

## 7 · Safety and honesty first
1. "Make v7 your deck" changes what Table logs against. It needs the paper checklist (change 30) and an **Undo** on the status line for one session.
2. "The sim plays it this way" stays off until E4 passes. Test's "Attacks made alone 91%" is the honest version of that claim: it's measured.
3. Every number on Test and Matchups shows only after a run produced it; before that, "not tested yet" with the Test button.

## 8 · The laws (distill's five + Star Shard's)
One word · label-sufficient · one fact one place · tier · reversible or confirmed; plus answer first, one region one thing, two levels max, honest.

## 9 · Order
1. §7 safety and honesty.
2. Vocabulary (§3) + grep.
3. Cuts (§5) as the prototype now shows.
4. One-owner moves (§6).
5. Re-run §1.

## Where "after" may feel too bare (for Justin)
- **The phone loses its Matchups tab.** Matchups lives inside Table, which is where you need it at an event. At home you'd reach it from Test's field list. If you study matchups on your phone away from events, keep five tabs.
- **The test result leaves the status line.** You'll only see "+9 vs Dimir" on Test. The status line stays pure state (which version, which is your deck).
- **No "own" on owned cards.** Missing cards stand out more, but you can't see at a glance which cards are in your binder. A "show owned" toggle on the list is the fallback if you miss it.
