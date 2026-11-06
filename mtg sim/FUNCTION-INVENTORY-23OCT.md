# Deck Bench · every function, and where it lives (23 Oct 2026)

Justin: "Reference the full needs before trimming. If every function can exist, then simplify."
Sources: the live page (`public/index.html`: 10 screens: Sign in, First run, Deck, Collection, Brew from your collection, Results, Coach, Table, Codex, Account) and the server's ~60 endpoints (`server.js`). Plus everything planned: STRATEGY-FIRST-REBUILD, JOURNEY-TEST-LOOP, REFINE-BY-STRATEGY, the Collection direction, change 30 and the engine program.
The **Home** column is where each function lives in the strategy-first prototype. ✚ marks the ones that were missing and have now been added. Nothing on this list is dropped. Where two homes existed, one was kept.

## Access and account
| Function | Today | Home |
|---|---|---|
| Sign up (name + password), sign in, sign-up closed | live | Sign-in screen (unchanged, out of the prototype's scope) |
| Email code sign-in, change email | live | Sign-in screen; Account ✚ |
| Mail: weekly digest, run finished; bounce handling | live | Account › Notifications ✚ |
| Push notifications, Add to Home Screen | live | Account › Notifications ✚ |
| Credits, plan, usage log, billing | live | Account › Credits ✚ |
| Delete account (asks once) | live | Account ✚ |
| Sign out | live | Avatar menu ✚ |
| Admin: Forge update notice, model usage | live | Avatar menu, admin only ✚ |

## Decks
| Function | Today | Home |
|---|---|---|
| Several decks, switch between them | live | Header deck picker ✚ (menu) |
| New deck: paste text or upload a file | live | Deck picker › New deck ✚ |
| New deck: Archidekt link (Moxfield: paste the export) | live | Deck picker › New deck ✚ |
| New deck: from your collection | live (brew-from) | Collection › Where next; Deck picker › New deck ✚ |
| New deck: from a meta deck / blank, starting from a strategy | planned | Collection › Where next; Deck picker › New deck ✚ |
| Formats: Standard 60/15, Commander (4-seat pods), others | live | New deck sheet › Format ✚ |
| Name and cover (card art or upload) | live | Deck › Edit menu ✚ |
| Delete deck (asks once) | live | Deck picker › deck's ⋯ ✚ |
| Legality, every card found, dead cards in the sim | live | Deck › flags line (exists) |
| Edit the list in place (+ − Swap, Add a card), legality on save | live | Deck › Edit ✚ (edit mode) |
| Save sheet (diff, note, Save and test / Save / Cancel) | live (change 30) | Deck › Try / Edit → Save sheet (exists) |
| Versions: chooser, view any, make your deck, compare, delete, undo | live | Status line "Viewing v7 ▾" ✚ (menu) |
| Paper checklist when a version becomes your deck | planned | Status line → checklist ✚ |
| Goal and constraints: event, posture, ready by, rounds, cards that stay, cards you won't play | live | Deck › Strategy › Goal line ✚ |
| Cards dial: owned only / up to $ / anything | live | Run sheet ✚ and Collection (exists) |
| Considering list (cards the coach suggested, not yet in) | live | Deck › under the list ✚ |
| Sideboard (15) | live | Deck › Sideboard group (exists) |
| Export (Arena, text, Archidekt) | live (copy) | Deck › Export (exists) |
| Deck check: curve, mix, mana sources, closest shell, findings | live | Deck › flags line + "Check" expand ✚ |
| Sample hand / mulligans / goldfish math | planned | Deck › Sample hand ✚ (panel) |
| Strategy: summary, engine, wins-when, rules, history | planned | Deck › Strategy (exists) |
| What stops it → answers → Try | planned | Deck › What stops it (exists) |

## Runs
| Function | Today | Home |
|---|---|---|
| Run sheet: field (top 10 / top 20 / my pod / one deck), Bo3, games, time, credits | live (one deck planned) | Header Run ▾ → Run sheet ✚ |
| Field sources (blended) and weeks (run any version against any week) | live | Run sheet › Field ▾ ✚ |
| Queue, position, running, stopped with cause, cancel | live | Status line pill + Cancel ✚ |
| Weekly rerun on the new field | live | Test › Every test (labelled "weekly") ✚ |
| Overnight tests ("while you slept") | planned | Test › top, when present ✚ |
| Targeted single-opponent tests, scenario tests | planned | Try sheet; Test (exists) |
| Run finished → notification | live | Account › Notifications ✚ |

## Test (was Results)
| Function | Today | Home |
|---|---|---|
| Latest verdict (paired, per 100, range) | planned | Test tier 1 (exists) |
| Strategy stats, loss reasons | planned | Test tier 2 (exists) |
| Field: matchups worst-first, share, verdict, you win, range, play/draw, tap for games | live | Test › The field (exists; play/draw + games ✚ on tap) |
| Whole-field number, Top 8 odds, relative to the most-played deck | live | Test › The field footer (exists; Top 8 ✚) |
| Trust and "how it's measured" (method) | live | Test › How it's measured ✚ |
| Levers (what raises top-8 odds most) | live | Test › More › Levers ✚ |
| Card stats (cast, won when cast, dmg) | live | Test › More › Cards ✚ |
| What beat you / game logs | live | Test › Why you lose › example games (exists) |
| Your play (from logged real games: pilot grade) | live | Test › More › Your play ✚ |
| Compare any two versions | live | Status line versions menu › Compare ✚; Test › Every test (exists) |
| Commander pod results (seat, pods won) | live | Test (Commander decks only) ✚ noted |

## Coach
| Function | Today | Home |
|---|---|---|
| Ask anything about the current tab | live | Coach column / phone ask bar (exists) |
| Modes: sideboard plan · play the matchup · mulligans · mana · review versions | live | Coach › mode pills ✚ |
| Acts when asked (saves a version, Undo in the thread) | live | Coach (thread lines with Undo) ✚ |
| Card lookup, every Standard card's text | live | Coach (behaviour) |
| Questions left today / credits per question | live | Coach footer ✚ |
| Drafts and edits the strategy | planned | Deck › Strategy › Edit (coach drafts) |

## Matchups (was Plan / Guide)
| Function | Today | Home |
|---|---|---|
| Per opponent: how they win, what beats your plan, your plan, ins/outs, tutor pick, kill on sight | live (plans) + planned | Matchups (exists) |
| Edit a plan (amber when ins ≠ outs) | live | Matchups › Edit ✚ |
| Share link (public plan page), Print as table cards | live | Matchups › Share · Print ✚ |
| Plans written by tests (G2–3) | planned | Matchups "tested" line (exists) |

## Collection
| Function | Today | Home |
|---|---|---|
| Import ManaBox / Moxfield / text (upload or paste), Undo | live | Collection › Update from ManaBox ✚ (sheet + Undo) |
| Value at TCGplayer and Card Kingdom | planned | Collection header (exists) |
| Where next: keep building, from what you own, from a meta deck, blank | live/planned | Collection (exists) |
| Missing for this deck, worth first, both shops, buy-the-worth-it | live/planned | Collection (exists) |
| The field by what you can build | live | Collection › Where next › "From a meta deck" list ✚ |
| Binder view (grid / list, deck overlay) | planned | Collection › Browse the binder ✚ |
| No affiliate code on your own account | planned | behaviour |

## Table (phone)
| Function | Today | Home |
|---|---|---|
| Life counter, who plays first, game by game | live | Table ✚ |
| Pick the opponent → their matchup plan | planned | Table (exists) |
| Log the match (games, mulligans, Paper/Arena), edit before logging | live | Table › End match ✚ |
| Arena games from the Mac count too | live | behaviour (Your play) |

## Codex
| Function | Today | Home |
|---|---|---|
| Search cards and decks | live | Header search ✚ (opens a card) |
| Card page: in plain terms, in your sims, how it wins/loses, defining cards, your decks against it, in Standard now, lore, members' notes | live | Card panel ✚ |

## Team and sharing
| Function | Today | Home |
|---|---|---|
| Your pod: friends' decks as a field | live | Run sheet › My pod ✚ |
| Shared plan links | live | Matchups › Share ✚ |
| Members' notes on Codex pages | live | Card panel ✚ |

## Then simplify (rules that hold now that everything has a home)
1. **Two levels at most.** Level 1 is the tab. Level 2 is a sheet or menu: Run, deck picker, versions, account, card, import, sample hand. Nothing nests further.
2. **State, cost and risk at level 1.** Running and stopped show on the status line, credits on the Run sheet, deletes ask once.
3. **Frequency decides prominence.** Weekly-or-more functions sit on the tab: the list, Try, the verdict, plans, Table. Rare ones live in menus: account, export, name and cover, delete.
4. **One home per function.** Where the table lists two places, one of them is a link to the other.

## Phone homes (same functions, phone placement)
Header: deck picker (sheet: your decks + New deck four ways) · Run ▾ (sheet) · avatar (Account sheet). Status line: "Viewing v7 ▾" (Versions sheet: make your deck, compare, delete) · running pill + Cancel · Undo after Make your deck.
Deck: Strategy (Edit · History, Goal) · Edit mode (Add a card → Save sheet) · Check ▾ · Considering · Sample hand (sheet) · Export · Name and cover · What stops it → Try → Save sheet.
Test: verdict + Make v7 your deck + whole-field test · strategy stats · why you lose · the field worst first (→ Plan) · Top 8 + How it's measured · Cards / Levers / Your play / How it's measured pills · Every test.
Table: life counter, game won/lost, opponent → plan (ins/outs after G1), Full plan / All matchups (Matchups view with Edit · Share · Print), End match → log sheet (games, mulligans, Paper/Arena).
Collection: value · Update from ManaBox (sheet with Undo) · Browse the binder · Where next · Missing worth-first · buy.
Coach: ask bar with questions left; hides while a sheet is open.

## Simplify pass (applied 23 Oct)
- Every menu is one level: phone sheets, desktop panels. Nothing opens a second sheet.
- Matchups on the phone is reached from Table and from Test's field list; Back returns to wherever you came from.
- Rare functions (rename, duplicate, delete, export, notifications, delete account) sit in ⋯ or Account, never on a tab.
