# The audit, in plain English

**17 September 2026.** The short version of `THE-AUDIT-17SEP.md`, with the jargon taken out.

## Where the project is, in one sentence

**The game is finished on paper, proven by testing, and broken in the version people can actually play.**

That is the whole picture. Everything about how Manzil works has been decided, and almost all of it was
tested before it was decided. What is not finished is the last stretch of screen work, plus one small
mistake that stops a game after a single hand.

## What is done

More than you might think.

All twenty-eight nights have their own special rule, and every one of those rules was tested against
alternatives before being chosen. All twenty-eight have their own artwork and scene. There are 216
opponents, each with their four lines of dialogue. Every sentence the game says now lives in one file,
so the words can be changed without touching the code.

The rules themselves are settled and measured: how cards take each other, who wins a tied board, how
many cards each side plays and holds, the best-of-three and best-of-five structure, the three lives,
and the new "dawn" rule where the cards you held back fight each other at the end of a board. Dawn was
the last big addition and it does what it was meant to: it takes away most of the advantage of going
first, and it rewards a player who thinks about their hand.

The biggest single balance discovery of the whole project also landed: letting the player go first on
each new opponent takes the chance of finishing a climb from 30% to 41%, with no rule change at all.

## What is broken

One thing, and it is small and specific.

Play a hand on the main single-player road. It finishes, the score settles, and then nothing happens.
No result card, no next hand, no button. The game just sits there.

The cause: when the new opponent dialogue file was merged in, it **replaced** the opponent records
instead of **adding** to them, and in doing so it deleted the one piece of data the game uses to deal
the opponent's next hand. All twenty-eight opponents lost it. The code asks for something that is no
longer there and stops.

It is a one-field fix. Two-player mode is unaffected and works fine, which is how we know exactly where
the problem is.

## What is half-finished

There is a pattern worth naming here, because it is costing time.

The engineering underneath is ahead of the screens on top. The game now correctly works out *and
records* exactly how a board was scored: how many spaces each side held, the bonus points, what each
card's special power did, and what dawn contributed. That information is sitting there, correct, ready
to display.

And the screen still shows a set of scales tilting in silence. It does not say who won or why. The
design for that was chosen days ago and drawn up; it just has not been built. Same story for the dawn
reveal: the good version was picked, and the old confusing version is still what ships.

Two menu items, "how to play" and "glossary", do nothing at all when clicked.

And one thing that has quietly become the hardest part of reading the board: the game hides the names
of cards you know well, as a kind of reward for mastery. Now that the test account owns everything at
high level, **no card in your hand has a name**, and on the board four are named and four are not with
no visible reason. In two-player mode the person with the weaker cards sees names and the other person
does not, so two people at one table are reading different games. My recommendation is simply to show
names everywhere and move the mastery flourish somewhere it does not cost legibility.

## Three questions nobody has answered

These are not bugs. They are decisions that have never been written down, and the game cannot be
finished without them.

**How hard should it be?** Testing says a careful player finishes about 30% of climbs when starting
out, 25% after a month, and **7%** once they own everything. Nobody has ever written down what those
numbers should be. Until someone does, "is this too hard" is an argument rather than a question with an
answer.

**Why does it get harder as you get better?** Because the opponent is a mirror of your own collection.
Everything you collect, she collects too. The two things that used to make her easier (a handicap, and
how carelessly she plays) both run out as you progress, so a fully-collected player faces a coin flip
plus whoever goes first. There is no lever left. Three different fixes are possible and each takes a day
to test, but someone has to pick a direction.

**Is the storm meant to be impossible?** One of the twenty-eight nights has a 3% finish rate when you
are new and **0%** at every level after that. It may be intentional as the hardest road in the game. It
currently reads as the road nobody ever finishes.

## The back end is in better shape than the game

This surprised me. There is a real server behind this: accounts, sign-up, email verification, password
reset, age checks, saved progress, saved decks, the ability to export your own data, and a proper
account-deletion route that cleans up everything. Two-player matchmaking works. The astronomy is
calculated on the device, so the night sky and your chart work with no internet at all.

Account deletion matters more than it sounds: Apple requires it for any app with accounts, and it is
already built.

**What does not exist at all is any way to take money.** No payment processing, no purchase records, no
"you own this" flag. The plan is a single one-off purchase of $19-24, and none of the machinery for it
has been started. That is consistent with the plan, which puts the purchase later, but it is worth
saying out loud.

## The business plan, and the uncomfortable part

The plan is clear and I think it is right. It starts from one blunt fact: **there is no audience at
all.** Not a small one. Zero. And three of the four things you want to do next (a Kickstarter, a Steam
launch, App Store sales) all need an audience *before* they work. Only one thing on the list creates an
audience instead of spending one: a free game that spreads.

So the order is: free game first, then the phone app (which is where the money actually is in this
category), then Steam and a physical deck.

We are still in the first stage, which has three requirements: the game cannot be solvable, it needs a
"run" structure, and it needs to collect email addresses.

- **Solvable:** fixed. The old problem was that a five-card starting pack meant you held the same hand
  every time. You now draw seven from all twenty-eight.
- **Run structure:** partly. The 28-night climb with nine opponents and three lives is a run. But what
  the plan actually asks for is the thing roguelike card games do: **cards you pick up and keep between
  hands.** That does not exist and nobody has decided whether it should. The plan calls this the
  single highest-value change available, worth more than any marketing. It is the biggest undecided
  question in the project.
- **Email capture:** I could not confirm from the code that there is anywhere to leave an email address
  before making an account. If there isn't, that's about an hour of work, and it is holding up
  everything in the plan that comes after.

And here is the uncomfortable part. The plan's own analysis says the thing most likely to actually build
an audience is **sixty short videos over twelve weeks** about the lunar mansions. It needs no code, no
money and no finished artwork. Which means: **the game can be excellent and the project can still stall
on the one piece of work that has nothing to do with engineering.**

## What to do next

**Code, in order:** put the missing opponent data back so the road works. Fix the two dead menu items.
Turn card names back on.

**Design, in order:** build the result card and the score captions (the data is already there waiting).
Then the dawn reveal. Then make the small text bigger, which the phone version needs anyway.

**You, decisions only:** how hard should the game be, at each stage of collecting. Which fix for the
"harder as you get better" problem. Is the storm meant to be unwinnable. And the big one: does Manzil
get cards you keep between hands, or is the climb the run.

## The two risks I would keep an eye on

**The thing that broke this week was a merge, not a design.** The new opponent file was clean. The
process that combined it with the game dropped a field and nobody noticed until someone played. There
is a lot of testing for the *rules* of the game and essentially none for the *build*. That gap is the
most likely place to lose another week, and it is a small thing to fix: a check that runs before each
release and confirms the basics still work.

**The screens keep running a cycle behind the engineering.** This has now happened twice in a row. It is
worth treating as a question about how work is sequenced between Code and Design, rather than just
another item on a list.
