# PRODUCT.md — the Deep Chart and the Daily

**v1 · August 13, 2026.** The two things people actually come for: a
birth chart worth living inside, and a daily/weekly reading worth
returning for. `UX-FLOW.md` covers everything up to *read your shard*;
this covers everything after. For Claude Design and Claude Code.

**The division of labour, stated once:**

> **The Deep Chart is hand-written, permanent, and free.** It is the
> proof and the buy-in — the thing they screenshot and send to a friend.
> **The Daily is generative, disposable, and about right now.** It is
> the habit. The chart earns belief; the daily earns return.
>
> And the mechanism that ties them together is the one thing no
> competitor has: **the daily reads your chart, not your sign.**

---

## 0. Engine reality check (good news — correcting an earlier note)

I previously flagged that the vendored `astronomy-engine.js` had been
tree-shaken to sunrise/sunset only and would need re-vendoring before
transits were possible. **That was wrong.** The vendored build exports
the full API — 147 symbols including `Body`, `GeoVector` and `Ecliptic`.
Verified live against today's sky:

```
Mercury  Leo  5.9°   direct
Venus    Lib  6.3°   direct
Mars     Cnc  1.2°   direct
Jupiter  Leo  9.6°   direct
Saturn   Ari 14.5°   ℞ retrograde   (−0.030°/day)
```

Retrograde falls out of a two-sample longitude difference — no extra
library. **The transit layer is unblocked today.** `ANCHORS.md` §4.7's
prerequisite is void; I'll strike it.

**Also already computed and completely unused: the houses.** Every chart
already returns `cusps` (12 Placidus cusps), `sunHouse`, `moonHouse`,
`mc`, and `houseSystem`. That's an entire interpretive dimension sitting
idle — and it's the missing "where in your life" axis that turns a
reading from a personality description into something actionable.

---

## PART ONE — THE DEEP CHART

### 1. What it is

A permanent, explorable document at a stable URL, generated once and
never regenerated (it can't change — the sky at your birth doesn't).
Not a scroll: **five tabs over one ring.** The ring is always present,
always the hero; the tabs change what it's annotated with.

| Tab | What it answers | Source |
|---|---|---|
| **SHARD** | who you are, in eight sign-first sections | the corpus (done — 13k words) |
| **HOUSES** | *where in your life* it all happens | new — engine has the data |
| **PATTERN** | the geometry between your lights | new — aspects |
| **DEPTH** | what four traditions called your skies | `mansions-table.json` (done) |
| **BECOMING** | what you're turning into | INSTRUMENT §3 (done) |

Everything is free. Nothing is gated. The chart *is* the marketing.

### 2. HOUSES — the biggest unused asset

Twelve houses, computed already. Each is a **place in a life**, and the
plain-language framing matters more than the tradition's Latin:

| # | Plain name | The arena |
|---|---|---|
| 1 | the doorway | how you arrive; the body |
| 2 | what you keep | money, things, worth |
| 3 | the near world | siblings, streets, messages |
| 4 | the room you grew up in | home, family, the floor under you |
| 5 | the thing you make for fun | play, romance, creation |
| 6 | the daily work | routine, health, service |
| 7 | the other person | partnership, the mirror |
| 8 | what you don't say out loud | intimacy, debt, endings |
| 9 | the far world | travel, belief, the long view |
| 10 | what you're known for | work, reputation, the public |
| 11 | your people | friends, scenes, the future |
| 12 | the back room | solitude, what's hidden even from you |

**What the tab shows:** which house your sun is in, your moon, and your
rising's ruler — three placements, each stated as *"this part of you
plays out here."* Then the empty-house honesty note, which nobody else
writes and which builds enormous trust:

> most of your houses have nothing in them. that's normal — there are
> twelve houses and only a handful of lights. an empty house isn't a
> missing part of your life; it just isn't where your weather comes
> from.

**Content bill:** 12 house passages (~120w) + 3 placement framings ≈
1,600 words. **Engine:** already done — surface `sunHouse`, `moonHouse`,
add `houseOf(asc-ruler)`.

**Honesty requirement:** above 66° latitude the system already falls
back to Porphyry and sets `houseSystem`. The UI must say so in plain
words — *"your birthplace is far enough north that the usual house math
breaks down; these are calculated a different way."* That single
sentence is worth more trust than a hundred confident ones.

### 3. PATTERN — the aspects (new engine work, small)

The geometry between two points in a chart is what makes it feel
*specific*, and we compute none of it. Minimum viable set — the five
classical aspects, applied only to the four points we actually trust
(sun, moon, rising, midheaven):

| Aspect | Angle | Orb | Plain name |
|---|---|---|---|
| conjunction | 0° | 8° | **stacked** — same place, same time |
| opposition | 180° | 8° | **facing** — across the table from each other |
| trine | 120° | 6° | **easy** — they get along without trying |
| square | 90° | 6° | **grinding** — they want different things |
| sextile | 60° | 4° | **available** — works if you use it |

Six possible pairs; most charts have one to three real aspects. **Say
the orb out loud** — *"3° from exact, which is close"* — because
precision is the product's whole personality.

**Content bill:** 5 aspects × 6 pairs = 30 passages (~90w) ≈ 2,700
words — but only ~10 are common enough to write first; the rest fill in
over time with a graceful generic. **Engine:** ~40 lines, plus tests.

### 4. DEPTH and BECOMING

Both already specified and written. DEPTH is the collapsed
`where this comes from ▾` from UX-FLOW §3 tier 3, promoted here to a
full tab for people who want the scholarship: the four traditions per
station, the guardian animal, the Keeper, the real stars, the
match-quality flags with the disagreements shown rather than smoothed.
BECOMING is INSTRUMENT §3 — the moving light, the register, the second
figure on the ring.

### 5. Why this is the buy-in

Four reasons, in order of power:

1. **It shows its work.** The compute readout, the orbs, the honest
   Porphyry note, the traditions disagreeing in public. Nothing else in
   this category does that.
2. **It has a cost in it.** Every gait names a real cost. Being seen
   accurately is a stronger hook than being flattered, and it is the
   thing people screenshot.
3. **It's permanent and linkable.** A stable URL, an image that renders
   in a group chat, a thing that is *yours*.
4. **It gets re-read.** Because the daily keeps pointing back into it.

---

## PART TWO — THE DAILY AND THE WEEKLY

### 6. The shape

| | **Daily** | **Weekly** |
|---|---|---|
| Arrives | each night, at the crossing | Sunday |
| Length | 60–90 words | 200–300 words |
| Built from | tonight's moon station + one live transit to *your* chart | the week's slow movers + the lunation + up to three transits |
| Voice | intimate, one thought | orienting, "here's the shape of your week" |
| Ties to | tonight's shard (the collection beat) | your chart's houses |

**The differentiator, stated plainly in the copy itself:** a sign-based
horoscope has twelve possible readings per day. Ours has *your chart's*
— the moon crossing your moon's station is a different night for you
than for someone whose moon is elsewhere. **Say that out loud once, on
the first daily**, then let it be true silently forever after.

### 6b. The weekly's seven beats (Justin, Aug 14)

Justin ran a weekly through Claude and liked it. Worth reading closely,
because the thing that makes it work is **not** the astrology — it's the
form, and the form is copyable. Seven beats, in order:

| # | Beat | What it does |
|---|---|---|
| 1 | **The standout** | one thing, named, with a weekday. "New Moon Wednesday, on your Midheaven." |
| 2 | **The exact one** | the orb, printed. *"Uranus sextile your Midheaven (0.0° — perfect)"* |
| 3 | **The two-way** | one contact that can go either way, and the choice is handed over |
| 4 | **The backdrop** | the slow movers, still holding. Doesn't change week to week — that's the point |
| 5 | **The rhythm** | day by day, driven by the moon's sign. Monday inward, Tue–Wed visible, Thu–Fri detail |
| 6 | **Best days** | an actual recommendation. "Tuesday through Thursday" |
| 7 | **The honest note** | what's still hard, named, unresolved. The reading does not end on a high |

Beat 2 is the retention mechanic and we already compute it:
`transits.js` returns `orbUsed`. **Print the number.** A decimal degree
that changes daily and hits 0.0° for one week only is checkable rarity —
`WRITING.md`'s strongest lever — and it is free.

Beat 7 is what stops the whole thing from reading as flattery. Co–Star
gets screenshotted for being harsh; the sample earns its optimism by
refusing to retract the hard part.

**And the finding that matters most: the sample uses zero invented
words.** Every term in it is either a planet, a sign, an angle, a house,
or a named aspect — things with a Wikipedia page. It is dense, specific,
and technical, and it costs a reader nothing to enter. That is the bar.

---

### 6c. The vocabulary budget (binding — supersedes the flat tier-0 list)

`COSMOLOGY.md` §2 grades our coined terms by *reveal progress*. That
grading is right and stays. What it does not do is bound how many land at
once: **tier 0 currently holds around forty coined words**, so a
first-night traveler can legitimately meet *shard, Moonroad, station,
step, Lantern, Keeper, Sky, Sigil, Sounding, Current, Light, Farbank* and
an Arabic epithet — thirteen new words before they know what a rising
sign is.

Sort every coined term by one question: **does it name something that has
no standard name?**

**KEEP — names a real thing astrology has no word for:**

| Term | Why it earns its slot |
|---|---|
| **shard** | the collectible. You cannot collect an un-named object |
| **station** | 28 lunar mansions. Standard astrology genuinely doesn't use them — this is the differentiator |
| **the Becoming** | our mechanic, computed, no equivalent anywhere |
| **Seedborn / Emberwake / Farbank** *et al.* | a computed rarity with a real percentage. Rarity needs a name to be told |

**CUT OR DEFER — a rename of something that already has a free name:**

| Term | What it renames | Cost |
|---|---|---|
| **the Lantern** | the moon | a translation step, for nothing. Nobody has two mental slots for the moon |
| **Sky** | a quadrant / a season of the road | reader hears "sky" and thinks *sky* |
| **Sigil** | your chart | "your chart" is already the more evocative phrase |
| **Current, Light, Sounding, Keeper, Step** | tārābala relation, moon phase, the reveal beat, planetary ruler, decan-of-station | five internal system names for mechanics the reader has not met |

**The budget, per surface: one new noun, and it must be something you can
point at.** The arrival gets *shard*. The night loop gets *station*. The
Deep Chart gets *the Becoming*. Nothing else, until the traveler has
asked.

**Everything else on every surface is free vocabulary** — planets, the
twelve signs, houses, the five aspects, retrograde, new and full moon,
orbs in degrees. Use them densely and without apology. Density in *shared*
language reads as expertise; density in *private* language reads as a
cult.

---

### 6d. The weekly's four content laws (Justin, Aug 14)

§6b fixed the *form* — seven beats. This fixes the *content*, and it
exists because Justin handed over a Claude-written weekly and said:
**"it needs to be better than these in every way. I want to replace
them."**

That reading is good, and it is worth being precise about why, because
the temptation is to copy it. It names exact orbs. It gives timing —
*"peaks Sunday/Monday when Mars-opposite-Uranus goes exact."* It hands
over one genuinely pointed instruction: **"make something, don't decide
something."** And it carries personal context.

**Its ceiling is that it has no memory and no rarity.** Four things it
cannot structurally do, all of which we can:

**Law 1 — Rarity, computed across a lifetime, not asserted.**
The reading says *"Uranus is exactly sextile your Midheaven (0.1°)"* and
calls it *"the genuinely notable one"* — then never says how notable.
Run it: **Uranus makes that angle to a fixed point in 11 windows per 200
years**, clustered ~27 and ~56 years apart. For that chart the previous
window closed in **August 1970** and the next opens in **2053**. So the
true sentence is *"this has never happened in your life, and it happens
three more times before spring 2028, then not again until you are
sixty-four."* Nobody screenshots "notable." They screenshot that.

**Every slow transit gets this treatment.** The number is free — we own
the ephemeris — and it is the single highest-value line in the product,
because it is the one claim a competitor cannot fake and a sign-based
horoscope cannot make.

**Law 2 — Recall. The sky has a memory and so do we.**
The reading's most personal beat is *"given you told me the WIMB format
is the one thing that lights you up"* — borrowed, not computed. It is a
mirror held up to something the reader said five minutes ago.

We store every night. So: **Mars last crossed that Venus 27 Aug – 22 Sep
2024, and before that 13 Mar – 14 Apr 2023.** The line is *"last time
Mars stood here you wrote ___"* — a database query, not a model call.
`RETENTION.md` §4: recall beats intelligence, and it beats it by a lot.
This is also why `sigNightOf[n]` is load-bearing rather than a
nice-to-have.

**Law 3 — Name one cost, every week, without fail.**
Scan that reading for a single unwelcome true thing about the reader.
There isn't one. It is *"good fuel," "supports," "worth taking
seriously," "decent support"* — the language of a briefing that likes
you. `WRITING.md`: nobody screenshots a compliment; they screenshot being
caught. **Beat 7 is not "the risks this week." It is the one thing that
is hard about being this person, attributed to the geometry.**

**Law 4 — Compress. 250–300 words, not 600.**
The source runs ~600 words of undifferentiated paragraphs, each opening
with its own function label — *"Steady underneath:", "Day by day:",
"Short version:"*. That is the labelling tic at scale, and it is what
makes it read as a memo rather than a reading. It describes the weather
*around* the reader and never lands *on* them. Ours is denser and
shorter, and beat 7 is the only place it is allowed to sting.

**One thing we must keep from it, because it is better than what we
have:** it tells you **when**. Exact-to-the-day timing, and *"the opening
is holding until November, the pressure isn't"* is only sayable because
the engine knows both windows. `standingWeather()` already returns the
slow ones; the weekly composer must pass the window edges, not just the
current orb.

---

### 7. What a daily is actually made of

Three ingredients, computed before any prose exists:

1. **Tonight's crossing** — which of the 28 stations the moon is in, and
   its step. (done)
2. **The live transit** — the single most significant planet-to-natal
   contact right now, chosen by a fixed priority: exact-ness of orb,
   then planet weight (Saturn > Jupiter > Mars > Venus > Mercury), then
   whether it touches sun/moon/rising. (new, small)
3. **The relation to their chart** — is tonight's station their sun's?
   their moon's? their **rising's**? their Becoming? Those are the
   *special nights*, and they should feel special.
   *(Corrected Aug 13: this section originally listed the opposite sky
   as the fourth. The corpus wrote **rising** as the fourth and marked
   opposite-sky and eclipse as later extras — see
   `research/corpus-chart-daily.md` §NIGHT. The corpus is the shipped
   content and wins; Design already built to it.)*

That third one is the retention mechanic and it's free: **roughly once a
month the moon crosses your own sun's station**, and that night's daily
should say so and land differently.

### 7b. The weekly needs three planets the engine doesn't have

`transits.js` computes Mercury, Venus, Mars, Jupiter, Saturn. Uranus,
Neptune and Pluto are excluded on the stated ground that they "move too
slowly to produce a *nightly* signal." **That reasoning is correct for
`pickLiveTransit()` and should not change.** It is also exactly why they
are the only thing that can carry the weekly's beat 4 and beat 7.

Measured against the vendored ephemeris — 24 evenly-spaced natal points,
four years, our own orb table — here is how long one contact lasts:

| planet | median contact | mean |
|---|---|---|
| Mercury | 8 days | 10d |
| Venus | 10 days | 12d |
| Mars | 18 days | 21d |
| Jupiter | 56 days | 109d |
| Saturn | 170 days | 201d |
| **Uranus** | **178 days** | 298d |
| **Neptune** | **849 days** | 777d |
| **Pluto** | **never left orb in 4 years** | — |

That is not a defect, it is the register. Mercury through Mars is *this
week*. Jupiter and Saturn are *this season*. Uranus, Neptune and Pluto
are *these years* — and "the foundation is still being rebuilt underneath
you, and it will be for a while yet" is a true, checkable, unrepeatable-
by-a-sign-horoscope sentence that we currently cannot write.

`AE.Body` already exposes all three (verified). The change is additive:

1. A second export — `standingWeather(positions, chart)` — over the three
   outers only, returning contacts that are **deliberately allowed to be
   identical for weeks**. Beat 4 renders it; beat 7 names the hardest one.
2. `pickLiveTransit()` untouched. Outers never enter the nightly pick,
   or every night says Pluto forever.
3. `PLANET_WEIGHT` untouched — it is the nightly tiebreak, not a
   significance ranking.

Also: the outers belong on the **Deep Chart** as natal placements. A
birth chart without Uranus, Neptune and Pluto reads as incomplete to
anyone who has seen one elsewhere, and that is the surface where being
recognisably a real chart matters most.

---

### 8. The generative constitution (binding)

Extends `ANCHORS.md` §4. Every rule exists because of a specific failure
mode:

1. **The model never sees birth data.** It receives *derived* facts
   only: sign names, station epithets, house numbers, aspect names,
   orbs. Not a date, not a time, not a place. The privacy invariant
   survives contact with the LLM.
2. **The model never invents astronomy.** Every celestial fact is
   computed and passed in as a fact list. The model's job is *prose*,
   not calculation. If a number appears in the output that wasn't in the
   input, the generation is rejected.
3. **Determinism per window.** One generation per user per window,
   stored. Re-opening re-reads the same text. The sky changes the
   reading; the refresh button does not.
4. **The corpus is the voice bible.** The system prompt carries voice
   rules plus 3–4 real passages from `research/corpus-*.md` as
   few-shot. Lowercase, second person, no emoji, name a cost, never
   predict — counsel, tendency, conduct.
5. **Vocabulary law applies.** Tier-gated terms stay out. The daily
   speaks planets, signs, the moon, and station epithets.
6. **Never prophecy.** No "you will." Tendencies, conditions, questions.
   This is both an ethics rule and the I Ching's own stance.
7. **The refusal set.** No health, legal, financial, or relationship-
   ending directives. No "today is a bad day for X" fear framing. With a
   quarter of the audience aged 13–17, generation-time moderation runs
   on every output before storage, and a hand-written fallback ships if
   generation fails or is rejected. **The user must never see an error
   where a reading should be.**
8. **Cost ceiling.** ~80 tokens out per daily. Generate lazily on first
   open, not on a cron for every user — most users don't open every day.

### 9. The prompt skeleton

```
SYSTEM: [voice rules + 4 corpus excerpts as style anchors + refusal set]

USER (facts, never prose):
  traveler: farbank · aries sun (the bearer) · scorpio moon (the crown)
            · scorpio rising · full moon · sunday-born
  tonight:  moon in the gathered stars, step 2 of 4
            relation: this is your becoming station   ← the special beat
  transit:  saturn 2.1° from square to natal sun, retrograde
  ask:      one paragraph, 60–90 words, tonight only
```

Everything in that block is computed. The model writes English. That
separation is what keeps this honest and what makes it cheap.

### 10. Content bill for the generative layer

- **Voice-bible extract** — the system prompt (~600w) with its few-shot
  passages chosen from the existing corpus.
- **Transit vocabulary** — plain-language for each planet touching each
  natal point: 5 planets × 4 points × 5 aspects, but written as
  *composable phrases*, not 100 passages. ≈ 1,200 words.
- **The special-night beats** — ~8 hand-written passages for the nights
  the moon hits your sun / moon / rising / Becoming / opposite sky, plus
  eclipse and station-boundary nights. These are the moments that must
  never be left to a model. ≈ 800 words.
- **Fallbacks** — one per cast kind, shipped if generation fails. ≈ 300w.

### 11. Build order

1. `transits.js` — planet longitudes, retrograde flags, natal contacts
   with orbs, the priority picker. Pure, testable, no network. *(engine
   verified available — see §0)*
2. Aspects in `sigil.js` + the PATTERN tab data.
3. Houses surfaced + the HOUSES tab data.
4. Deep Chart UI: five tabs over the ring (Design).
5. The daily pipeline: facts → prompt → generate → moderate → store →
   render, with the fallback path built *first* so the feature is never
   load-bearing on the model.
6. Weekly, once daily is stable.

### 12. Money — DECIDED (Justin, Aug 13)

**One-time unlock plus cosmetics. No microtransactions.**

- Arrival and the **Deep Chart are free** — the proof and the share.
- **One purchase** unlocks the ongoing game: the full nightly loop, the
  daily and weekly, the codex. Owned forever, no subscription.
- **Cosmetics are the only recurring surface** — ring skins, card
  backs, Suyin's art, seasonal frames. Beautiful, never advantageous.
- **Nothing affecting collection is purchasable.** No paid pulls, no
  currency, no skip-the-timer. The sky is the drop table.

This also removes the hardest compliance problem: a one-time price with
cosmetic extras is the model that survives a 13–17 audience. No shop in
the main loop; cosmetics live in the codex beside what they decorate.

### 12b. Still open
1. **Which model, and where it runs.** A generation this constrained is
   a small-model job. It also means an API key and a backend path — the
   first time this product sends anything to a third party. The privacy
   line holds (derived facts only), but it should be stated publicly.
2. **Weekly on Sunday, or on the user's birthday-weekday?** The second
   is more personal and staggers load.

---

## PART THREE — THE MINIGAME LAYER (deferred, flagged Aug 13)

**Not for the MVP.** Captured here so it isn't lost and so we don't
build a corner we have to demolish. Justin's shape, in his words:
unique minigames that appear only in correlation with specific daily
readings, unlocked by how well you do, saved, and awarding specific
shards tied to specific games and goals.

**Why this is the right big build.** It solves two problems at once
that nothing else does. It gives the lore *surface area* — every
minigame is a container for myth that the reading alone can't hold —
and it converts the nightly loop from "show up" into "show up and
*do* something," which is what makes a game worth maintaining rather
than merely visiting. The runner already proves the tone works.

**The one design tension to resolve later, not now.** The ethics floor
says *the sky is the drop table*: the 112 road-shards are time-gated,
non-competitive, catch-up-able, and reachable by everyone. Skill-gating
breaks that — some players simply won't clear a game, and a shard
locked behind performance is a shard they can never have. The clean
resolution, when we get there:

> **Minigames award a separate collection.** The 112 stay sky-earned and
> universal. Game-shards are a second, distinct set — skill-earned,
> displayed differently, and never required to complete the road. If a
> minigame ever gates a road-shard, it must be an *alternate* path to
> one obtainable by simply showing up.

That keeps the regulatory posture intact (no scarcity pressure on the
core loop) and still lets the games mean something.

**Two hooks to preserve now — both are notes, not work:**

1. **Don't hard-code 112 as "the collection."** The Recollection schema
   should treat station+step records as *one kind* of collectible, so a
   second kind can be added without a migration. One extra column, or
   just don't assume the count anywhere outside the ring renderer.
2. **The daily's fact block should have room for an eligibility
   field.** When `transits.js` assembles tonight's facts (PRODUCT §7),
   leaving space for `minigame: null` costs nothing today and means the
   trigger logic has somewhere to live later.

Everything else — which games, what they look like, how performance
maps to reward, how they tie to specific readings — is deliberately
unspecified until the astrology MVP has landed and we can see what the
nightly loop actually feels like in people's hands.
