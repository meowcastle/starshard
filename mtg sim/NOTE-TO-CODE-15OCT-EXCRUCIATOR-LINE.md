# Note to Code (15 Oct 2026, from Research): the real Dimir Excruciator line, and the error dial

Excellent diagnosis: the deck wins 46% when the trigger resolves and 17% when it doesn't, and Forge gets there by hard-casting at turn 18 on 7 life. The answer is a combo profile, not more fair play. Here is the line as real pilots run it (Pro Tour Lorwyn Eclipsed winner Christoffer Larsen and the Cosmos Heavy Play team; sources at the end). **Before encoding, read the exact Oracle text of Doomsday Excruciator, Superior Spider-Man, Bitter Triumph, Winternight Stories, Insatiable Avarice and Emeritus of Ideation from Forge's card scripts**; the coverage below names what they do, but not every number.

## The line
- **Setup (turns 2–3):** get Excruciator into the graveyard. Bitter Triumph: pay its additional cost by **discarding Excruciator** (never by paying life when Excruciator is in hand). Winternight Stories: draw, then discard **keeping Excruciator as the card discarded**. Without Excruciator in hand, Stock Up and Winternight dig for it.
- **Combo (turn 4 at the earliest):** cast Superior Spider-Man entering as a copy of the Excruciator in the graveyard. Its enter trigger leaves each player only the bottom six cards of their library.
- **Finish (next 1–2 turns):** attack with **Restless Reef** (mills the opponent four) and/or make the opponent draw: **Insatiable Avarice's draw mode and Emeritus of Ideation's Ancestral Recall half, both targeting the opponent** after the combo (targeting ourselves before it). The opponent has six cards: Reef plus their own draws, plus a forced draw-three, ends it in one or two turns.
- **Stack the bottom first.** Cards Stock Up (and Winternight) put on the **bottom** are the six we keep. Before the combo, bottom the finishers (Avarice, Emeritus) and removal; that is what the deck draws afterwards.
- **Clear the way first against blue.** Deceit (or Duress after boarding) before the combo turn when the opponent has counter mana and a counter seen or likely; against creature decks, removal and Day of Black Sun first.
- **Our own clock.** Excruciator gives its controller extra draws (the Pro Tour coverage mentions using Tishana's Tidebinder on our own Excruciator to stop "the extra draw effect"), so after the combo we have about three turns before we deck. The finisher must be in reach.

## The rule set (`combo`, for decks curated with combo pieces)
Go for it on the first turn all of these hold:
1. Excruciator is in the graveyard and Spider-Man is castable (or, failing that, Excruciator castable from hand, which is the slow line).
2. A finisher lands within one turn: Reef on the battlefield able to attack next turn, or Avarice/Emeritus castable next turn with mana, or one already in the bottom six.
3. We survive two opposing turns: our life > 2 × the opponent's untapped power on board (plus 3 for a burn deck's reach).
4. No known counter with mana up; if one is likely (blue opponent, 2+ open mana, cards in hand) and we hold Deceit/Duress, cast that first.
If 1 and 2 hold but 3 fails, stabilise (removal, Day of Black Sun, blockers) and go next turn. **Never hard-cast at low life into a lost board** unless it is lethal within the race.
Before the combo turn, discard/bottom choices follow the setup above. After the combo, all draw-effects target the opponent, and Reef always attacks.

You said discard choice and the Spider-Man copy choice go through `choose_entity`/targets; the profile needs both (choose Excruciator to discard; choose the Excruciator as the copy target; target the opponent with draw effects after the combo). Gate with the SPRT on Excruciator (signed toward its real rate); the target behaviour statistic is "combo resolved by turn 6" in a meaningful share of games (real lists are built for turn 4–5).

## The error dial
Agreed with your reading: a dial that only fires in our own main phase taxes proactive decks and spares instant-speed ones, which is not how people err. Your next step (errors at any priority, plus combat errors) is right. Two notes:
1. Your scoreboard commit says the **real** deck spread is inside its own sampling noise. Then the target is the sim's spread shrinking to about the size of the real sampling sd, and no further; fit the dial to that, not to zero.
2. Expect a single dial to plateau again, because part of the spread is deck-specific (Forge pilots creature decks well and combo/control badly). That part is what the style profiles fix (Excruciator now, Azorius next). Fit the dial **after** the Excruciator profile is in, so the dial doesn't absorb a combo deck's missing plan.

Sources: Pro Tour Lorwyn Eclipsed coverage (magic.gg, "The Spiciest Standard Decklists"); MTG Arena Zone, "The Darkside of Standard Might Be the Cure: Dimir Doomsday"; Cardsrealm, "Standard: Dimir Excruciator deck tech & sideboard guide"; Wargamer, "Dimir Excruciator".
