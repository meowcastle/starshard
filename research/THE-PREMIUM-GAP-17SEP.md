# The premium gap: what Slay the Spire and Arena are actually doing, and the three things standing between us and it

**17 September 2026. Measurement → Design (cc Code).** Answer to "how do we elevate it to feel as premium as those games." Measured on staging 17 Sep, m20, two boards plus the hand, codex and ledger. One caveat up front: **I instrumented ours, not theirs.** Slay the Spire and Magic Arena are native clients, not web apps, so nothing here is a measured comparison of two builds. The claims about those games are the ordinary reading of how they work; the claims about Manzil are measured. Where I am reasoning rather than measuring I say so.

---

## The reframe

"Premium" in those two games is not art budget, and this matters because we will lose an art-budget fight and should not start one. Arena has unique illustration on every card and a particle system. Slay the Spire has a hand-drawn character rig. We have 28 generative line glyphs in a 1.26 MB single file. Trying to out-texture Arena is the fastest available route to looking cheap, because the comparison becomes explicit and we lose it.

What those games actually spend their premium on breaks into three buckets, and we are at zero on one, near zero on the second, and doing fine on the third.

| | what it is | Slay the Spire / Arena | Manzil today |
|---|---|---|---|
| **Sound** | every action makes a noise sized to it | continuous, layered, per-action | **none at all** |
| **Information** | you see the consequence before you commit | intent icons, targeting, the stack | **none for the core rule** |
| **Weight** | the commit costs the eye something | hitstop, flash, shake, slam | smooth and weightless |

## 1. Sound, and the fact that we have literally none

Measured on the live page: **0 audio elements, 0 audio files, no Howler, no Tone, 12 network resources total, none of them media.** The game is completely silent. Not "light on sound." Silent.

This is the single largest premium-per-hour item available to us and it is not close. In both reference games sound is doing roughly half the work of making an action feel like it happened: the paper of a card leaving the hand, the thunk of it landing, the distinct register of a hit versus a block, the low tone under a shop. Take the audio off Slay the Spire and it reads as a prototype within thirty seconds. That is approximately the test we are currently running on ourselves.

The good news is that our palette writes itself and is small. This is a night, a table, a lantern, a road, ostriches. Six sounds, used precisely, will read as more expensive than sixty used loosely:

1. card leaves the hand (paper, short)
2. card lands on a station (felt, soft, low)
3. **a take** (this is the game's dramatic event and deserves the only sound with any edge on it)
4. the beam tilting at settle (a slow creak or a low swell, under the count)
5. the pip filling / the light going out
6. a bed: wind and distance on the road, near-silence at the table

Plus one rule: **nothing plays on hover, nothing plays on a menu.** A quiet game where six things make a noise is unmistakably more premium than a busy one. Our restraint is an asset here, not a constraint.

Cost: this is the item where a small spend buys the most, and it needs no engine work beyond a play hook.

## 2. Information: the core rule is invisible until after you commit

This is the one I would fix first if I could only fix one, because it is not polish, it is design.

**What Slay the Spire actually does.** The famous thing is the intent icon: before you spend anything, you know exactly what every enemy will do next turn and how much. That single feature is most of why the game feels deliberate and fair rather than random, and it is worth noting it has no art cost at all. Arena's version is the same idea spread over targeting arrows, the stack, and damage previews on blockers. **In both games you never commit blind.**

**What Manzil does.** Bigger-or-equal takes on the touching face is the entire mechanic of the game. I selected a card and hovered a station. What the game told me:

> mansion 24
> the void
> the luckiest of the lucky, and the sky gives no reason.

House, lore, and a vocabulary leak (see below). **Nothing about what I would take.** The rule that decides every board is invisible until after the card is down.

We are not starting from nothing. Selecting a card already lights its **home station** in gold, which is exactly this pattern applied to dominion. It works, it reads instantly, and nobody had to write a sentence. The take rule needs the same treatment:

> While a card is held: every occupied station it would **take** outlines one way; every occupied station that would **take it** outlines another. Nothing else changes.

That is one pass over the neighbours, using a highlight language that already exists in the build. It converts the play beat from "place it and find out" into "read the board and choose", which is the difference between a toy and a game, and it is the exact thing Slay the Spire is doing with intents.

Second, smaller: **the selected card already shows its name** and lifts out of the hand, which is the right read of this morning's call. Good. But the station tooltip covers roughly a third of the board and leads with lore. Lead with the fact, put the lore second or on a hold.

## 3. Weight: the take is our best moment and it is currently silent and still

In both reference games the commit has physical consequence. Slay the Spire has a beat of hitstop, a flash on the struck enemy, and shake calibrated to the damage. Arena slams the card down and the board reacts around it.

Manzil's card slides into place smoothly and **nothing else on the board acknowledges it.** The most dramatic event in the game is a card changing owner, and I could not point to the frame where it happened. A take should cost the eye something: the taken card should turn, its ownership bar should sweep, and the one sound with an edge on it should land there.

Two related things I measured:

- **Ownership is nearly unreadable.** Once placed, both sides' cards carry the same gold border. The only tell is a small bar underneath, and hers and mine are about two shades apart. On a nine-card road, "whose is that" should be the fastest question on screen and it is currently the slowest. Arena solves this with a hard frame difference; we should solve it with shape, not shade.
- **Nothing acknowledges input it cannot use.** From `THE-CLUNK-17SEP.md`: 26 clicks accepted across a transition, and silent failed clicks. Premium games never ignore you quietly. Either it does something or it says no.

## 4. Two things we are already doing right, which should be protected

**The settle beam.** A brass balance that fills with counters and tilts under the weight is a better idea than anything in either reference game's result screen, because it is a physical object doing the arithmetic instead of a panel describing it. This is the thing to build the rest of the game's ceremony out of.

**The empty stations.** Ghost outlines of the nine stations, so the board has a shape before it has cards. That is Arena-grade board legibility for zero art.

**And the thing to protect them from:** the temptation to make the game busier in pursuit of "premium". Both of those work because nothing else is competing.

## 5. Three cheapness tells I would fix on principle

1. **Vocabulary leaks.** The station tooltip says "mansion 24" while the rest of the game says house. An internal word surfacing in a polished skin is the loudest cheapness tell there is, because it tells the player they are looking at a database.
2. **Letterspaced caps on the codex** ("THE CODEX · 28 OF 28 HOUSES WALKED", "ITS CARD", "ITS LAW"). There is still no `text-transform` in the app, so these are literal strings, which also means the codex is not reading the copy table. Neither is the dawn shelf: it renders "dawn · the held cards" while the table says "dawn: the held cards".
3. **The codex panel is clipped** at the bottom, cutting a sentence mid-word. One clipped panel undoes a lot of careful work.

## 6. The honest limit

The first 60 seconds is where Arena spends the most and we spend the least. Our intro is a card, a line, and "click to sit down", which is elegant, and a new player still has no idea that bigger-or-equal takes. Neither of those games would ship that. I am not proposing a tutorial; I am noting that item 2 above (showing the take before the commit) is also our onboarding, because a player who can see what a card would do learns the rule by watching the board rather than by reading it. That is one more reason it is the first item.

## 7. The order I would do it in

1. **Take-preview on hover.** The core rule becomes visible. Uses a highlight language already in the build, needs no art, and is simultaneously our onboarding. **Biggest single upgrade available.**
2. **Six sounds.** Largest premium-per-hour item in the project. Needs a play hook from Code and nothing else.
3. **Weight on the take.** The taken card turns, the bar sweeps, the one sharp sound lands.
4. **The verdict** (already the first item of `THE-CINEMA-READ-17SEP.md`). The result screen is where both reference games stop the clock and we currently spend 1.5 seconds.
5. **Ownership by shape, not shade.**
6. **Never ignore an input silently.**
7. **The three cheapness tells**, half a day.

Items 1, 3, 5 and 7 are surfaces and are Design's. Item 2 needs one hook from Code and then is a content job. Item 4 is Code's and is already on the list.

None of this is art budget, which is the point. Every item above is either information, sound, or restraint, and those are the three things the reference games are actually spending their premium on.

### Files

`research/THE-CINEMA-READ-17SEP.md` (the playthrough this follows), `research/THE-TEXT-CENSUS-17SEP.md` (the counts), `research/THE-CLUNK-17SEP.md` (input handling and timings), `research/THE-MENUS-15SEP.md` (the hover and camera work, now partly shipped).
