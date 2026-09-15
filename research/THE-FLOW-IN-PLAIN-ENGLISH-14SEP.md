# The flow review, in plain English

**14 September 2026.** The short version of `THE-FLOW-14SEP.md`, for anyone who wants the point without the walk.

## What I did

I played the game on staging the way a new player would. Two rungs on the heart, then the whole blaze road from the bottom up: won the first four rungs, lost the fifth (a best of three), saw the loss screen, then went through every menu screen: the lobby, your cards, the star shard, the ledger, the codex, level select. Around forty boards. While playing I also watched the game's internal state, so when I say "the count did X", that is from the data, not a guess.

## The good news

The game already looks and feels like a place. The best things in it need no words at all:

- **Climbing feels like climbing.** The dots on the right light up as you go, the scene names change (the daylit ground, the low air, the dusk, the cloud line, the high air), and the horizon actually turns into a cloud line partway up. This is exactly what the design docs asked for and it works.
- **The opponents have personality.** Each walker says something on the way in ("bekk counts the ground first"), reacts during the game ("hm. recount." "oh. rude."), says something on the way out, and gets introduced by the road before you meet them. Four lines each, and they land.
- **The scales, the forfeit dialog, the codex page, the cards page, the "thinking…" indicator, the birds.** All right, all worth keeping exactly as they are.

## The one real problem

**The game does not tell you what just happened.** Almost everything wrong with the flow is a version of this.

The clearest example: on one board I owned five of the nine spaces and my opponent owned four. I won the board on the ground. The score on screen said 6 to 5, then 6 to 7, and the game said she won. Why? Because the score is not just spaces. It also includes a bonus point each side gets for something called dominion, and the points from dawn (where the cards you did not play fight each other). None of that is shown. Three lines of capital letters flashed by for about a second each and disappeared. A new player would have no idea why they lost. Even I had to check the data.

The same thing happens everywhere else:

- **Tonight's rule is never on the board.** Each night has a special rule. The only places it appears are two menus deep in the codex, and for one second during a screen transition. Worse, if you hover over a space on the board, it shows you a *different* rule (that space's own rule, which is only active on its own night), so the one hint the board gives is misleading.
- **When you win or lose, you get a mood, not a reason.** The loss screen has poetry and Sanskrit words ("vipat, the first dark") but no score and no explanation. The best-of-three shows three little diamonds with no legend for what they mean.
- **Dawn, the new held-cards fight, is fun to play but impossible to follow.** The cards are shown faintly in the sky over the opponent, the lines go by too fast, and one result is described three different ways in one sentence.

## The smaller problems

- **Text drawn over text, everywhere.** The dawn title over the scene name, held cards over the walker's name, "X steps aside" fading in over the live board, the new rung's title drawn over the old board with the old hand still there, the loss screen text over the cards, buttons on top of cards. One rule fixes all of it: dim the board before you put a sentence in the middle of the screen. The win screen already does this right.
- **"the last word is yours" flips to "hers" every turn.** It is being used as a whose-turn indicator, but the rule it describes does not change during a board, so it reads as the rules changing.
- **You cannot tell whose card is whose.** Your cards have names, hers do not, and the only ownership cue is a thin border in two shades of gold.
- **The menu is invisible.** It only appears if you press Escape. Nothing on screen hints it exists, and once you are in a menu screen there is no back button. The lobby also says nothing about where your climb stands (which rung, how many lives left).
- **Things the design rules already banned are still there.** Counters like "ONE OF EIGHT DOWN" and "0 OF 28 HOUSES WALKED", labels in spaced-out capitals, em dashes, jargon like "sextile" and "mansion 9", and one line in the codex that quotes my own internal measurement numbers ("spread 30") to the player.
- **The mulligan is unexplained.** "Shuffle once, take six" sounds free. It actually costs you a card at dawn. Nobody is told.
- **Menu screens take three to five seconds to fade in from black.**

## What to do about it

Give the game five moments, each with one job and one fixed layout the player learns once:

1. **The deal:** who leads, and tonight's rule in one line under the scene name.
2. **The turn:** a readable board. Names on both sides' cards, a clear whose-turn cue, the rule's marker with its text on hover.
3. **The settle:** the arithmetic, shown on the scales as captions, one line each and left on screen: *stations, five against four · dominion, one each · dawn, her pair outweighs yours · six against seven.*
4. **The verdict:** one card, board dimmed, that says who won and why, how many lives stand, the series score, and who is next. Same card for a win, a loss, a series board, a rung.
5. **The road:** the climb between rungs, on a clean sky, with the new walker stepping in. Nothing clickable until they have spoken.

The full doc has a table of every line of copy to replace, ready to paste.

## Why this matters for what comes next

Justin's aim is to get the flow settled so the characters, avatars and cards can be built out in detail. The good news is that the slots for those already exist in the game. A walker is four lines and a habit. An avatar is a walker plus a house's rule in its own voice, and the codex page is already its page. A card is the cards-screen page plus one missing row: what it does on the road, in the same words the road uses. The work is to fill those slots consistently, not to invent new ones.

## For Code, briefly

Seven items in the full doc. The one that might be a bug: on that 5-to-4 board, dawn should only have been able to move the score by two points to one side, but it moved her by two and me by one. The existing test cases will settle it in a minute.

## What I could not check

Phone-width layout (the browser would not resize), the final boss match at rung nine, and sound.
