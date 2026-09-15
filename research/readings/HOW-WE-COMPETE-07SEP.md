# How Star Shard competes with a Claude weekly

**7 September 2026.** Justin stored a chat-Claude weekly as "another great weekly horoscope" and
asked how we compete. The reference is kept verbatim beside this note. This is a diagnosis first and
a plan second, and the diagnosis starts with a measurement rather than an opinion.

---

## First: our ephemeris already reproduces the reading's headline claims

I checked the two sharpest claims in the reference against the on-device ephemeris — the one that
ships in the app, simplified Kepler, seven bodies.

| the reference says | our ephemeris says |
|---|---|
| Jupiter sextile natal Sun, exact Sat–Sun 12–13 Sep, 0.08° | **exact 13 Sep, 0.09°** |
| Sun square natal Jupiter, Thursday 10 Sep, 0.0° | **exact 10 Sep, 0.03°** |

**We can already compute what makes that reading feel authoritative.** The precision — orbs to a
tenth of a degree, the exact day — is the ephemeris doing the work, and ours does the same work to
the same tenth. So the gap is not capability at the core. It is three specific things, and they are
all smaller than they look.

**What we cannot compute today:** Uranus, Neptune and Pluto. The reference leans on all three for
its "undercurrents" paragraph (Uranus stationary on the MC sextile, Neptune square Venus, Jupiter
square Pluto). Our ephemeris stops at Saturn. That is a bounded addition — the outer planets move
slowly, so the precision bar is low and the Meeus terms are standard. **One afternoon for Code, and
the whole undercurrent layer becomes available.**

---

## Why the reference reads as good — the six things it does

Taken apart, the reading is not doing anything mystical. It is doing six things, and they are all
learnable.

1. **A hierarchy, stated.** *"The thing to know."* One main event named in the first paragraph, then
   *"also this week,"* then *"watch Thursday,"* then *"undercurrents,"* then *"rhythm,"* then *"best
   days."* The reader is told what matters and in what order. This is editing, not astrology.
2. **Precision as evidence.** Every claim carries an orb and a date. The numbers are what make it
   feel computed rather than written.
3. **Actionable, specific instruction.** *"Don't sign anything Thursday. Friday's fine."* *"Push it
   this week, especially through the weekend."* Not a mood, a decision.
4. **Continuity across weeks.** *"It's been closing all month."* *"The undercurrents are unchanged."*
   *"Jupiter square Pluto has loosened to 2.2° and is fading."* The reading remembers what it said
   before and reports what changed. **This is the single biggest thing our engine does not do.**
5. **Life context.** *"Given your lease ends the 15th."* *"The studio situation."* The sky is tied to
   the person's actual week. Chat-Claude has conversation memory; an app has to be told or has to
   infer.
6. **A daily rhythm layer.** The Moon's sign each day against the natal chart — crossing the
   Ascendant, the Midheaven. Day-by-day texture under the weekly headline.

Of the six, **two are editorial (1, 3), one is capability we have (2), one is capability we can
add (6, via the ephemeris we already run), and two are memory (4, 5).** The memory pair is the real
gap and it is a product question, not an astrology question.

---

## What we have that the reference structurally cannot

This is where competing on the same axis would be a mistake. Chat-Claude will always have better
conversation memory than an app. Any astrology app with an ephemeris can produce transit-to-natal
aspects. **Trying to out-Claude Claude on Western transits is a losing game.** What Star Shard owns:

**1. A different sky.** The 28 mansions are a lens no Western reading has. The weekly I wrote on
31 August did something the reference cannot: *the Moon walks your row* — five nights running, the
Moon crossing the user's natal placements one mansion at a time, with the hunger written for each.
That is a story with 28 stations in it. Tropical astrology has twelve, and they are too coarse for
"tonight the Moon stands on your Mercury's house."

**2. The tārābala.** A nine-fold day-quality cycle keyed to the birth star — *kṣema, pratyari,
sādhaka, naidhana, mitra, parama mitra, janma.* It gave the 31 August weekly a per-day verdict with a
name and a tradition behind it, as concrete as "Sun square Jupiter 0.0°" and from a system the
reference does not have. Thursday was *naidhana* in ours and "the day to be careful" in theirs —
**two systems that share no arithmetic naming the same day** is the most persuasive thing either
reading can do, and only we can do the pairing.

**3. The game.** The reading and the board share a calendar. *"Tonight the Moon is in the storm —
your Sun's own house — and the road runs through tiger country. The mansion leads. This is a hard
night, and it is yours."* The horoscope becomes the level-select screen. No chat can give that,
because no chat has the board. And the level sweep from yesterday means we can now say, per night,
exactly how hard it is.

**4. The player record.** Not *"your lease ends the 15th"* — *"you have won three of your last four
nights in Genbu, and tonight is Genbu."* The app knows things about the user that they *did*, which
is a different and in some ways stronger kind of life context than things they said.

**5. The hungers.** The reference's psychological layer is *"confidence-and-opportunity transit."*
Ours is *"to break the surface open and find out what it cost."* That is a voice, and it is
already written for all 28.

---

## The plan, in the order that pays

**Now, editorial, no engineering.**
- Adopt the hierarchy. Every weekly opens with *the thing to know*, then *also this week*, then
  *the day to be careful*, then *rhythm*, then *best days*. Five headings, fixed order.
- Every claim carries its number. We have the numbers; the 31 August weekly under-used them.
- Every section ends in an instruction. Not a mood.

**Next, capability, one afternoon each.**
- **Outer planets** in the ephemeris. Unlocks the undercurrent layer.
- **Western aspects as evidence, not frame.** The mansion walk stays the story; the aspect is the
  footnote that proves it. *"The Moon enters the storm Thursday, your Sun's house, on the day the
  Sun squares your Jupiter to a hundredth of a degree."* Both systems, one sentence, more than either.
- **The daily rhythm layer** from the Moon's mansion against the natal placements — we already
  compute this; it needs to be a section.

**Then, memory, which is the product work.**
- **Reading-to-reading continuity.** Store what each weekly flagged. Next week opens by reporting
  what changed: *"the Jupiter aspect that peaked on the 13th is now separating."* This is the biggest
  single gap and it is a data model, not an astrology problem.
- **One-line intake.** Before the weekly: *"anything starting or ending this week?"* Optional, one
  field. Closes most of the life-context gap at almost no cost, and what the user types becomes the
  thing the reading ties the sky to.
- **The player record as context.** Which nights won, which quadrant levelled, which mansion fought
  last. Already in the save file.

**What not to do.** Do not rebuild the reading as a Western transit report with mansion names
swapped in. The moment it reads like the reference with different nouns, the reference wins, because
the reference has the lease.

---

## The honest version of the competitive claim

The reference is a very good Western weekly with conversation memory. We can match its precision
today, its outer-planet layer in an afternoon, and its structure by adopting five headings. We cannot
match its conversation memory and should not try.

**What we can do that it cannot is tell the user which night is theirs, in a sky with 28 rooms in
it, backed by a second tradition that names the same days, tied to a game they play on that calendar,
informed by what they actually did last week.** That is not a better version of the reference. It is
a different reading, and the only one of the two that could not have been written by anyone else.

### Files

`readings/REFERENCE-CLAUDE-WEEKLY-07SEP.md` (the benchmark, verbatim), `research/aspects.js` (the
ephemeris check above), `the-week-justin.md` (our 31 August weekly, for comparison),
`THE-READING-ENGINE-31AUG.md` (the earlier diagnosis this extends).
