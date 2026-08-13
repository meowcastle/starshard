# Corpus batch 6 — the arrival copy

*Star Shard reading corpus · August 13, 2026 · every word a first-time
visitor sees before the station bodies take over. Written to
`UX-FLOW.md` (the seven-screen arrival), `ANCHORS.md` (shared sky
leads — now extended to headers), and the CRT/terminal visual
direction. **Same slot-marker format as the rest of the corpus** —
`tools/build-reading-copy.mjs` parses this file with no changes.*

**The law this batch exists to enforce:** a first-time reader must not
meet an invented word until its meaning has already been felt. Every
coined term — strike, root, glow, hand, farlight, Recollection — is
absent from this file by design. What's here is signs, planets, the
moon, weekdays, and plain English.

---

## BURST — screen 0 (the star bursting)

*Timed to the animation, one line at a time, then silence. First visit
plays full; returns play the 2s version. Skip control from second one.*

**BURST.1** the sky paints stories.

**BURST.2** shards are born every second.

**BURST.3** one has been falling toward you your whole life.

**BURST.skip** skip →

**BURST.return** *(the 2s version, for people coming back)* welcome
back, traveler.

---

## ARRIVAL — screen 1 (the story, and the truth under it)

**ARRIVAL.1**
a star came apart. the iron in your blood, the calcium in your teeth,
the gold in somebody's ring — all of it was inside.

**ARRIVAL.2**
**that isn't mythology. that's physics.** you are, chemically, a piece
of one.

**ARRIVAL.3**
everything after this is what people built on top of that. four
thousand years of looking up and writing it down.

**ARRIVAL.4**
we kept the good parts. here's yours.

---

## HOWITWORKS — screen 2 (before we ask for anything)

**HOWITWORKS.head** star shard reads four sky-maps at once.

**HOWITWORKS.arabia**
`ARABIA` — twenty-eight waystations, mapped by people who steered by
them. the moon crosses one a night, forever.

**HOWITWORKS.india**
`INDIA` — the same sky cut differently. every station wants
something.

**HOWITWORKS.china**
`CHINA` — the same stars again. an animal guards each one.

**HOWITWORKS.europe**
`EUROPE` — the zodiac. the one you already know your sign in.

**HOWITWORKS.changes**
and one thing that isn't a sky-map: **the changes model**. anything
real already carries the seed of what it's turning into. that's why
your reading has a second half.

**HOWITWORKS.compute**
no quizzes. we compute where the sun and moon stood at your minute, and
read all four maps at that spot.

**HOWITWORKS.privacy**
`your birth details are computed on this device and never uploaded.`

---

## ASK — screen 3 (birth entry)

**ASK.head** where and when did you land?

**ASK.date** the date is enough to begin.

**ASK.time** the time is optional. it unlocks the horizon — how you
enter a room — and it changes every four minutes, so we won't guess.

**ASK.place** the place, so we know which sky was overhead.

**ASK.cta** read the sky →

---

## COMPUTE — screen 4 (the terminal readout)

*Real values, printed as they resolve. Never a generic spinner —
watching the machine work is the credibility.*

**COMPUTE.open** `> resolving sky over {birthPlace} · {birthDate}`

**COMPUTE.cross** `> cross-referencing four sky-maps ...`

**COMPUTE.done** `> ✦ shard found`

---

## HANDLE — screen 5 (the reveal)

**HANDLE.line** {typeLabel} of {sunEpithet}

**HANDLE.sub** {sunSign} sun · {moonSign} moon · {risingSign} rising ·
born under a {phaseName}

**HANDLE.cta** read your shard →

---

## LEAD — the eight section preambles

*One before each section body. Familiar ground, then straight into the
specific. ~15–25 words — if a preamble runs longer it has started
explaining, which is the failure mode this file exists to avoid.*

**LEAD.strike**
**your sun is in {sunSign}.** the one you already know. the part of you
that acts.

**LEAD.root**
**your moon is in {moonSign}.** the sun is what you do. the moon is
what you're like when nobody's watching. most people never find out
theirs.

**LEAD.glow**
**you were born under a {phaseName}.** everyone already believes the
moon does something. here's what yours was doing.

**LEAD.hand**
**you arrived on a {weekday}.** every weekday is named after a planet.
the oldest astrology still hiding in ordinary language.

**LEAD.facing**
**{risingSign} was rising** — climbing the eastern horizon at your
minute. not who you are. the door people come through to reach you.

**LEAD.answering**
**the sky opposite you.** every chart has a far side. this one comes
with a fact you can check.

**LEAD.gait**
**how you walk.** not a label we picked. a shape that falls out of
where your two lights stood.

**LEAD.becoming**
**what you're turning into.** a reading isn't a photograph. one part of
your chart was already moving when you arrived.

---

## DEPTH — the collapsed scholarship toggle

*Tier 3. Invisible unless asked for. This is where the coined and
scholarly vocabulary is allowed to live.*

**DEPTH.toggle** where this comes from ▾

**DEPTH.intro**
four traditions named this stretch of sky. where they disagree, we say
so instead of picking a winner.

**DEPTH.disagree**
the sky-maps conflict here. four cultures, the same stars, different
deserts.

---

## CLOSE — the recognition beat

*The landing. Big type, no ornament, nothing else on screen.*

**CLOSE.recognition.1**
you probably already knew most of that.

**CLOSE.recognition.2**
that isn't a trick. it's the point. the sky didn't tell us who you are.
it gave us somewhere to look. you were already there.

**CLOSE.recognition.3**
what it can do is show you the shape from outside.

---

## INVITE — the handoff to the night loop

**INVITE.ring**
your ring is mostly dark. that isn't a lack — it's room.

**INVITE.road**
the moon crosses one station a night, in order, whether anyone watches
or not. tonight: **{tonightEpithet}**.

**INVITE.cta** come back tonight →

**INVITE.countdown** `next crossing in {countdown}`

---

## RETURN — for travelers who already have a shard

**RETURN.head** welcome back, {name}.

**RETURN.sub** {typeLabel} of {sunEpithet} · {litCount} of 112 lit

**RETURN.cta** tonight's crossing →

---

## Production notes

**Trimmed August 13 under `WRITING.md`** — 871 → ~600 words, same 49
slots, nothing cut but scaffolding. The preambles took the deepest cut:
they were explaining what a sun sign *is* before saying anything. Parses
with the existing build tool — same marker convention, no parser
changes. New interpolation tokens the composer must supply:
`{phaseName}` (plain english: "full moon", "waxing crescent"),
`{weekday}`, `{birthDate}`, `{tonightEpithet}`, `{countdown}`,
`{litCount}`. The rest already exist.

**Register check.** Zero coined vocabulary outside `DEPTH.*` and the
epithets (which are card names and read as English regardless — "The
Bearer" needs no glossary). No *strike*, no *root*, no *glow*, no
*hand*, no *farlight*, no *Recollection*. A reader could pass every
screen here and never encounter a word they'd have to look up.

**The two claims that carry the whole front door**, both verified in
`research/physics-paradox.md`: the nucleosynthesis line (B²FH 1957;
Sagan) and gold specifically coming from neutron-star collisions
(GW170817). `ARRIVAL.1` mentions gold in a ring deliberately — it's the
most surprising true thing we can say in the first ten seconds.

**On `ASK.time`:** stating *why* the time matters and that we refuse to
guess it does double duty — it raises time-entry rates and it
establishes the honesty posture before the reading makes any claim.

**Open for Design:** `COMPUTE.*` needs the real resolved values printed
line by line (they exist in the engine already — see UX-FLOW §2 screen
4 for the intended shape). Don't fake the numbers; the whole point is
that they're real.
