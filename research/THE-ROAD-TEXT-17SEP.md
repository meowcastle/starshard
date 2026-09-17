# The road's cards: a correction, a census, and the fact that most of the words repeat something already on screen

**17 September 2026. Measurement → Design (cc Code).** Playthrough of the moon road on updated staging, 17 Sep, m20 the flock, first rung, with every visible text node captured at 100 ms and every interstitial recorded verbatim with its type sizes. Plus a full count of the 216-record walker sheet, which is where the road's words actually live.

**What I did and did not get.** The save had all 28 houses climbed, so the road was closed; with sign-off I cleared four local keys (`climbs`, `rungs`, `lastclimb`, `lives`) and the road opened. I then lost rung 1 three times to merit and got wiped, so **I did not finish the road** — I played three boards, saw the first-meeting card, the return card, two loss cards, the itemised settle and the wipe card. That is every kind of interstitial the road has except the rung-won and climb-cleared cards. The backup of all 21 `manzil-v2-*` keys is preserved in `localStorage["claude-backup-17sep"]`; I have left the climb reset rather than restoring it, since you reset it deliberately.

---

## 1. A correction to `THE-CINEMA-READ-17SEP.md`

That memo said the four settle captions are written, timed and never shown, and that no verdict beat exists. **That was measured in table mode only, and it is wrong about the road.** On the road the settle panel renders in full:

```
stations      four against five
dominion      one against none
dawn          even, one each
──────────────────────────────
total          six against six

        merit takes the board
     level: the answerer takes it
```

Four terms, a rule above the total, the verdict at 28px and the reason beneath it, legible and not behind the scenery. This is the beat Design specified, built and working. So the finding is not "the captions were never wired" but **"the road has the ceremony and the table does not"** — one mode got the work and the other did not. That is a smaller and much better problem, and the table should simply be pointed at the same component.

## 2. The census of the road's cards

| card | blocks | words | type sizes |
|---|---|---|---|
| walker, first meeting | 3 | **32** | 3 |
| walker, on a return | 3 | **13** | 3 |
| loss card, first light | 5 | 48 | 4 |
| loss card, second light | 6 | 54 | 5 |
| **the wipe card** | **8** | **64** | **5** |

The loss card grows as its blocks arrive: 40 → 44 → 50 → 54 → 59 → 60 words, five type sizes by the end. The wipe card is the largest single screen of prose in the game.

## 3. The thing that is actually wrong: the cards say everything three times

This is not a length problem in the ordinary sense. It is a redundancy problem. Here is the wipe card in full, 64 words in 8 blocks:

> ✦
> **the road folds back**
> six against six, level: the answerer takes it.
> naidhana, the death-like night: the moon is dark tonight. the road folds back to its first walker, and the light returns full for the next climb. it always does.
> ● ◐ ◑   *(three moons, all full again)*
> **nothing had been taken yet.**
> ◇◇◇◇◇◇◇◇◇   *(nine empty rungs)*
> the three are lit again. the first walker is waiting.
> merit stands ready.
> anywhere to deal again
> lobby

Now count the encodings:

- **"you are back at the first walker"** is said four times: in the title, in the prose, in "the first walker is waiting", and in "merit stands ready."
- **"your lights are restored"** is said three times: in the prose ("the light returns full"), in the picture (three full moons), and again in prose ("the three are lit again").
- **"nothing was lost"** is said twice: in the sentence, and in the nine empty diamonds directly beneath it.

Of 64 words, roughly **45 restate something the card has already said or already drawn.** The same pattern is on the loss cards: the second one says "one sliver of light left" in the prose, shows one crescent in the picture, and then says "one light still stands." in a third block. Three statements of one fact, in one card, in three type sizes.

That is the mechanism behind "overly descriptive exposé". The player is not being trusted to look. Every picture on these cards is captioned, and every caption is glossed.

Two further tells in the same cards:

- **The lore nouns arrive with their own footnotes.** "vipat, the first dark:", "pratyari, the adversary:", "naidhana, the death-like night:". An untranslated proper noun followed by an appositive gloss is the most exposé-shaped construction in English. It is a glossary entry wearing a sentence.
- **A rules sentence is welded onto the flavour.** "the same walker stands where you fell, and the road gives its shard regardless" appears **verbatim on every loss card**. A player losing three times reads it three times inside what is presented as atmosphere.

## 4. The walker sheet: where the words are, and the register that already works

216 records, **9,014 words**. Per rung the player reads `in` + `tell` + `out` = **35 words**, about 10.5 seconds, as a full-screen card at the moment they want to play.

| field | mean words | sentences |
|---|---|---|
| `in` (the way in) | **20.7** | 1.74 |
| `tell` (on the road) | **5.3** | 1.00 |
| `out` (the way out) | 9.0 | 1.23 |
| `next` (on a return) | 6.8 | 1.39 |

**The short register already exists in the sheet, and the road shows both within a minute of each other.** First meeting:

> merit stands on the road
> *merit is going down with the jars empty, one on each hip, and does not hurry because the river is not going anywhere.* (22 words)

On the return, two minutes later:

> merit stands on the road
> *merit is going down.* (4 words)

The second is better. It is the same character, it keeps the image, it drops the gloss, and it leaves the player with a question instead of an answer. That register is already authored 216 times over, in `tell` and `next`. Nobody needs to invent a new voice; the sheet contains it.

Three measured faults in the `in` field:

1. **64% are two or more sentences**, mean 12.5 words of picture then 8.2 of explanation. The gloss closes the question the image opens: *"bekk holds the head."* / *"he has a scar from the one that would not be held, and he is proud of both."*
2. **24% have a mechanical rules clause welded on**, in **20 different wordings for the same few dials**, costing 665 words. The commonest, *"the hand is yours, every card of it awake."*, appears **26 times verbatim**, and some are bolted mid-sentence: *"it has not shaken in thirty years, and she gives nothing away twice, and holds your cards awake."*
3. **The `tell` does not do its documented job.** The sheet's own header says `tell` is "their reaction, and a hint at how the mirror plays this rung". **None of the 216 carry any play information.** The one field designed to reward attention during play teaches nothing.

## 5. The principle, and what it costs to apply

Discovery is what is left when you stop explaining. Concretely, three rules:

**a. Never caption a picture you have already drawn.** If three moons are on screen, delete "the light returns full" and "the three are lit again". If nine empty diamonds are on screen, delete "nothing had been taken yet". The wipe card goes from 64 words to about 18 without losing one fact.

**b. The rule is not prose.** "every card of it awake", "gives nothing away twice", "the road gives its shard regardless" are the opponent's and the road's dials. They belong in a fixed place as a mark or a short label, identical every time, not as a clause inside twenty different sentences. This is the same argument as the take preview: a property the player must know is a thing to *see*, not a sentence to read once and forget.

**c. Keep sentence one, cut the rest.** The picture is the first sentence; the gloss is the rest. Mean `in` line goes 20.7 → 11.3 words with the rules clause also stripped.

Applied: **per rung 35 words → about 24**, a clean nine-rung climb **315 → 216**, the wipe card **64 → ~18**, the loss card **54 → ~20**, and the repeated boilerplate gone entirely. And the `tell`, which is already the right length and the right voice, finally carries the thing worth discovering: how this walker plays.

## 6. Two smaller things from the same three boards

- **Silent failed clicks persist.** Clicking an occupied station with a card held does nothing at all and gives no feedback. Same finding as `THE-CLUNK-17SEP.md`; it is still true.
- **The moon-road lobby is the best screen in the game.** The nine rungs drawn as ellipses receding to the moon, with "the moon road ›" beneath, is a journey stated as a picture with no words at all. It is the standard the cards should be held to. Everything in section 5 is an argument for making the cards more like this lobby.

### Files

`research/THE-CINEMA-READ-17SEP.md` (corrected here in §1), `research/THE-TEXT-CENSUS-17SEP.md` (the method), `research/THE-PREMIUM-GAP-17SEP.md` (§5b is the same argument as the take preview), `research/THE-CLUNK-17SEP.md`, the walker sheet of 15 Sep.
