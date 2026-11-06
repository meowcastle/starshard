# Arena's mechanics, and the one Manzil is missing

*6 October 2026, second watch. Observed across two full games — a comfortable 27-12 win and a
loss to 46 damage in a single swing. This one is about the rules architecture rather than the
UI. Companion to `manzil-vs-arena.md`.*

---

## The finding, first

**Manzil's option space shrinks as a board plays out. Arena's grows.**

Nine slots, five placements, and every placement removes a slot. By your last card you often
have one legal move. The game *narrows* toward its ending.

Magic adds one land per turn, so turn one you can cast a 1-drop and turn six you can cast
almost anything in your hand. Every turn the set of things you *could* do gets larger, right
up until the game ends.

That is the arc problem stated mechanically, and it is more precise than "add a run
structure." **A game that widens builds tension. A game that narrows releases it.** Manzil
currently releases tension for nine straight placements.

---

## The six systems doing the work

### 1. A resource that accumulates

One land per turn. Spells cost mana. This single rule produces four things at once:

- **An arc.** Small things early, big things late, automatically.
- **A deckbuilding constraint.** Your curve is a real decision made before you play.
- **A live tension.** Lands are necessary and do nothing by themselves. Too few and you are
  stuck; too many and you draw blanks. The resource can fail you.
- **Anticipation.** You can see the expensive card sitting in your hand and count the turns
  until you can cast it.

Manzil has a resource — slots — but every card costs exactly one, so none of the four
follow. **There is no cheap card and no expensive card.** The Void (9/2) and the Glance (4/6)
cost the same thing to play, which is why card choice collapses into "which number helps
here."

### 2. Card types that relate to time differently

Lands are permanent and generate. Creatures are permanent and act every turn. Instants can be
cast **during the opponent's turn**. Sorceries resolve once, on yours. Artifacts sit and apply
a static rule. Each type has a different relationship with the clock.

Manzil has one type. Every card is a creature that attacks once on the turn it lands and then
becomes a number.

### 3. Permanence, so investments compound

Jaliya entered as a 3/3 and was a 4/4 four frames later, because Koth reads *"whenever a
Plains you control enters, put a +1/+1 counter on target creature"* and lands kept entering.

A card played on turn three was still getting better on turn nine **without being touched.**

This is the difference between a move and an investment, and it is the mechanical engine
behind the whole arc. Manzil's cards do their work at the instant of placement and never
again.

### 4. Triggered abilities turn the board into a machine

Koth is not a static modifier. It is an *event listener*: when a thing happens, a thing
happens. So the board becomes a small machine the player assembles, and playing a land —
normally the most boring action in Magic — becomes a trigger that fires an effect.

Manzil's 28 signatures are mostly **static conditions** — *counts two on an edge*, *+1 while
both neighbours stand*, *cannot be taken on its lower face*. They modify a comparison. Very
few of them *fire on an event*.

That is a cheap direction to explore, because the slate already exists: converting a handful
of static signatures into triggers would give the board a sense of machinery without touching
the core rule.

### 5. Combat: a two-sided decision with simultaneous commitment

Attacker declares attackers. Defender declares blocks. Both reveal. Damage resolves. **Neither
player controls the outcome alone**, and the defender's information is incomplete because the
attacker may be holding a trick.

In the observed game this produced a real swing: he blocked, killed a 1/1, went 17 → 19 and
developed a 3/5 — turning a losing board into a stable one through a decision the opponent
could not prevent.

**This matters because it is the mechanic the August randomness research identified and I
could not evaluate.** Simultaneous double-blind placement posted the highest night-to-night
variety number in the entire study — 29.7 against 18.0 shipped — with zero luck added, and I
marked it *unresolved* because my agent could not model bluffing and my exploit scan for it
was defective. Arena is a live, thirty-year proof that the mechanic works and is the most
exciting part of the game.

Manzil's placement is unilateral: you put a card down, flips resolve, the opponent had no say.

### 6. An unbounded ceiling

Game two ended with **46 damage in one turn** from a board that included an 11/8. Nothing in
the rules caps how large a swing can get; it emerges from cards interacting.

Manzil's maximum outcome is bounded by nine slots and a handful of weight bonuses. The
largest possible thing that can happen is small, and the player learns that quickly.

This is also why two Arena games told completely different stories — a grindy lifegain win
and a getting-run-over — while Manzil's 28 nights produce boards of broadly the same shape.
**Engagement is not just about good positions; it is about different kinds of game.**

---

## What Manzil actually has, stated plainly

| | Arena | Manzil |
|---|---|---|
| resource | accumulates each turn | depletes each placement |
| option space over time | widens | narrows |
| card cost | varies, drives the curve | identical for every card |
| card types | six, each with its own timing | one |
| after it resolves | permanents stay and compound | becomes a number |
| abilities | mostly triggered on events | mostly static modifiers |
| commitment | two-sided, simultaneous | unilateral |
| outcome ceiling | unbounded | bounded by nine slots |
| information | hidden hands, countable | fully open |

---

## Three mechanical directions, in order of what they buy

**1. Give cards different costs.** The single highest-value change, because it is upstream of
the arc, of deckbuilding, of anticipation, and of what makes one card more interesting than
another. It does not have to be mana — it could be that stronger cards may only be lodged
later in the road, or that a card's cost is paid in mansions already claimed. Whatever the
fiction, the mechanical requirement is that **cheap and expensive must both exist.**

**2. Make commitment two-sided.** Both players choose a card and a slot, both reveal, conflict
resolves by a stated rule. The sim said it produces the highest variety of anything tested;
Arena says it is the best part of a card game. Those two independent signals agreeing is
about as strong as pre-build evidence gets. It needs her AI rebuilt, which is the real cost.

**3. Convert some signatures from static to triggered.** *When a card is claimed beside it,
do X* rather than *it counts two on an edge*. Cheapest of the three, needs no new resource,
and it is what makes a board feel like a machine you built rather than a tally you are
winning.

---

## What I did not see

**No post-game rewards screen.** Two games ended and both went **Defeat/Victory → rank badge →
straight back to the queue**, under forty seconds from a 46-damage blowout to a new VS splash.
Quest progress appears to update only back on the home screen.

That is a finding rather than a gap: **the loop does not pause to celebrate.** It names the
result, shows you your ladder position — *Silver Tier 2, Constructed Rank* — offers a "View
Battlefield" button if you want to study what killed you, and then puts you in another game
before the feeling settles.

Notably, the defeat screen shows your **rank**, not your mistake. It reframes a loss as a
position on a long climb within about two seconds of the loss happening.
