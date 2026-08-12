# Star Shard — Strategy

**August 11, 2026.** The question, the answer, and the framework — built on four
research tracks (saved in `research/`), the competitive audit (`AUDIT.md`), and
everything shipped so far.

---

## 1. The question, answered

### What problem does Star Shard solve?

Not an informational one. Astro-Seek gives away infinitely more chart data;
Co–Star owns social astrology. If Star Shard is "a site that tells you your
chart," it loses on every axis.

The real problem: **fandom has a rich love-language for cherishing characters —
cards, pulls, rarities, fan art, oshi culture — and nothing that points that
language at yourself.** This audience spends real money and real feeling
collecting other people. Star Shard takes the one dataset every person owns —
the minute and place they were born — and renders it in the language they
already speak: a pull, a card, a rarity, art, a collection.

**You are the gacha.** Everything else — four traditions, retro chrome, real
math — is how, not why.

### Why do people come? Five motivations, in sequence

1. **"Which one am I?"** — the sorting-hat moment. 28 mansions is a finite
   typology, and finite typologies are what people post (16Personalities:
   14M visits/quarter on four letters). Someone sees a friend's card and cannot
   rest until they've drawn their own. *Surface: the first-run flow.*
2. **"This is mine and it's beautiful."** — the share artifact. Only works if
   the card is genuinely worth posting. *Surface: the 1080×1920 card + art.*
3. **"The sky moved."** — the return. The moon changes mansion roughly daily.
   *Surface: the daily card (§4).*
4. **"My album is incomplete."** — the hook. See §5: the collection mechanic IS
   the astronomy. *Surface: the deck.*
5. **"My people."** — 28 mansions = 28 houses; mansion-mates; compatibility.
   *Surface: duet + whatever community layer comes last.*

### The one-sentence positioning

> *Star Shard turns your birth sky into the kind of object fandom knows how to
> love — computed honestly, drawn beautifully, collected daily.*

---

## 2. The product thesis: the sky is the game

The moon really does pass through one of 28 stations roughly per day and visits
all 28 in one sidereal month (~27.3 days). So the core mechanic writes itself:

**A mansion's card can only be collected while the moon actually stands in that
mansion. Miss it — it returns, on schedule, in ~27 days.**

Nobody else can ship this honestly: the serious tools have the ephemeris but no
audience for a card game; the gacha-literate products have no real astronomy.
And it produces the product's ethical trump card, which doubles as its best
marketing copy:

> **"No odds to disclose, because there are no odds. The sky is the drop table."**

Everything gamified in this product must derive from real astronomy. Every
"event" is a real sky event. Every rarity is a real rarity (eclipses, blue
moons, the moon occulting the Pleiades). Every return is a real orbit. This is
the discipline that separates Star Shard from the FOMO machinery regulators are
currently dismantling (FTC v. Genshin, Jan 2025; EU Digital Fairness Act,
proposal expected Q4 2026) — and from every competitor.

---

## 3. Depth: what the research found, tradition by tradition

Current corpus: ~60 units of copy (~2,500 words). The weave library varies
phrasing, not substance. Here is where the substance comes from.

### 3.1 The moon shard — from garnish to centerpiece

The research verified the big hypothesis with corrections:

- **The 28 mansions are genuinely cross-cultural.** Arabic manāzil, Chinese
  xiù, Indian nakshatras, and Japanese shuku share a skeleton: the same
  asterism anchors all systems at **~17–18 of 28 positions** (Pleiades,
  Aldebaran, Spica, Antares, the Scorpion's crown…). Not all 28 — the honest
  product shows a match-quality flag (STRONG / PARTIAL / DIVERGENT) per
  mansion rather than forcing clean quadruples. Copy: *"Four cultures drew
  station-maps of the Moon's road. At your degree of the sky those maps
  usually — but not always — point at the same stars."*
- **The anime anchor is real and specific: Fushigi Yūgi.** All 28 celestial
  warriors are literally named after the xiù — Tamahome is 鬼宿 (the Ghost
  mansion), Hotohori is 星宿, seven warriors per god matching the four
  quadrants. For this audience, "your Fushigi Yūgi mansion" is instantly
  legible. Japanese **Sukuyōdō** is verified: Kūkai brought the system to
  Japan in 806 CE, monk-astrologers read the Heian court by it (a sukuyō
  practitioner divines newborn Genji's destiny in chapter one of *Genji*),
  and modern sukuyō fortune-telling is a living commercial genre in Japan
  whose signature feature is **compatibility** — six relation types read from
  the distance between two people's mansions. That is `duet.exe`'s upgrade
  path, from invented percentage to real tradition. (One correction: the
  "Tokugawa Ieyasu banned it for being too accurate" story is legend, not
  history — the lineage burned with its temple in 1417. Tell it *as* legend.)
- **Depth per mansion exists in the sources.** Ibn Qutaybah's Kitāb al-Anwāʾ
  (the rain-star lore, documented through pre-Islamic poetry), al-Bīrūnī's
  star lists, the Picatrix indications (present as history, never practice),
  the Chinese Tong Shu almanac's day-selection registers, the nakshatra
  deities and symbols. The research includes a per-mansion schema and three
  fully-worked examples (al-Thurayyā, Saʿd al-Suʿūd, al-Jabha).
- **Our tropical-equal-28 method is defensible** — it is the
  Picatrix/Agrippa/Ibn ʿArabī lineage, and al-Bīrūnī anchored at the equinox.
  Ship the one-sentence caveat: sidereal reckonings will place you one or two
  stations away, and that difference is real history, not an error.

**Build:** a 28-record database with ~12 fields each (names ×4 cultures +
match flag, stars, indication, epithet, anwāʾ lore, Picatrix-as-history, xiù
animal, nakshatra deity/symbol, Fushigi Yūgi warrior, daily-crossing meaning,
card art). This is the P4 permalink content and the card-back content in one.

### 3.2 The daily engine — the tārābala discovery

The research verified the exact mechanics of **tārābala**, the Indian daily
system: count from your birth star to today's star; the count mod 9 yields one
of nine named relations (Sampat = wealth, Kṣema = well-being, Naidhana = the
one to sit quietly through…). Practitioners consult it daily via panchāṅga
apps. It is deterministic, personal, computable in one line, and *ancient*.

**Engine warning that must be respected:** tārābala's arithmetic requires 27
(27 = 3×9; the cycle closes). It cannot run on our 28 tropical mansions.
Implementation: compute a separate sidereal-27 track (Lahiri ayanāṁśa) behind
the scenes for the daily relation, keep the 28-mansion display layer intact.
This is also the honest move — each tradition's mechanics stay whole.

So the daily card = **today's mansion** (the crossing) + **your relation to
it** (the nine-cycle, softened to the house voice — "a sit-quietly day" not
"death-like") + moon phase + planetary day/hour. Every element real, every
element cited.

### 3.3 Western astrology — the ranked build list

- **Build:** transiting Moon sign + Moon-in-house-from-your-ASC (the cheapest
  real personalization), Moon aspects to natal points, the 8 moon phases
  (sky-today AND as a new birth feature — natal lunation phase needs only
  Sun/Moon we already compute, 8 units of copy, Rudhyar lineage),
  void-of-course windows (present as *"the sky is buffering"* — honest and
  instantly legible), planetary days and hours (a live "hour of Venus" chip —
  hourly churn, classical citations to Vettius Valens, and **no major app
  surfaces it**), Mercury retrograde and ingresses.
- **Cut:** progressions, solar arc, returns, profections. The Pattern proves
  the "season of restructuring" effect is achievable with ordinary transits.
- **Content inventory math:** ~73 units for the base layer (buildable with
  today's natal data), ~236 with a full natal chart, ~350–450 with
  anti-repetition variants (~35–50k words). Real but bounded; write modular
  fragments, never the full cross-product.
- **Ephemeris decision:** **astronomy-engine** (MIT, 116KB minified, ±1
  arcminute, actively maintained) — not sweph-wasm (AGPL or CHF 700, megabytes
  of data files) and not the GPL Moshier ports. It also ships sunrise/set
  (planetary hours), moon phases, and eclipse search — each maps 1:1 to a
  roadmap feature. Skip Chiron (only Swiss Ephemeris data does it right;
  nobody will miss it at launch). Keep our Meeus code as the cross-check
  harness. The privacy claim survives: everything still computes in-browser.

### 3.4 The mirror shard — rebuilt honestly

The current mapping (archetype = moon sign) is indefensible, and "the 12
Jungian archetypes" aren't Jung's — the 12 is **Carol Pearson's** (1991), and
her PMAI instrument is proprietary (trademark, licensed). The research's
recommended architecture, which is also more fun:

- **Key the archetype to Sun-element × Moon-element = 16 combinations**, with
  16 *original* archetype names (elements are genuinely load-bearing in
  astrology; sun/moon rhymes with persona/anima without claiming Jung's
  authority; and 16 ≠ 12 forces original names, which is the IP-clean move).
- **Add a short original quiz as "check the mirror"** — and make disagreement
  the charm: *"your stars say Hearthkeeper, your heart says Wayfinder — Jung
  would say the mirror you argue with is the interesting one."*
- **Every archetype gets Light / Flicker / Growth** — the flicker is the
  shadow presented as a strength turned up too far (the VIA "golden mean"
  framing, designed to be non-pathologizing and family-friendly). This is the
  genuinely Jungian move the current content lacks.
- Credit line: *"in the tradition of Jungian psychology, as popularized by
  Carol S. Pearson"* — never "Jung's 12 archetypes." Jung's actual astrology
  record (fascinated, tested it, his own experiment leveled to chance, read
  charts as symbol not fate) is itself great `grimoire.hlp` content.

### 3.5 The hearth shard — from one rhyme to a folk constellation

- **The multilingual weekday table is the jewel:** a Tuesday-born user is
  Mars-day-born in every language — war-god Tiw in English, mardi in French,
  火曜日 *fire-day* in Japanese (the five-element planet names). One birth
  fact, five cultural windows, zero invention. And the planetary-hours
  mechanism *generates* the week's order (24 mod 7 = 3) — the hearth and the
  daily engine share machinery.
- **Monday's Child ships as a variant map**, not a verdict — in the 1887
  American version Wednesday's child is "merry and glad." Never doom the
  Wednesday kids; folklore's plasticity is the content.
- **Expansion order:** (1) weekday rebuild, (2) Chinese zodiac with regional
  variants (Vietnam's cat year!) — biggest global-audience win, (3) rokuyō
  (Japan's living six-day luck cycle; computable from lunisolar date; frame as
  "the weather of your arrival day," never birth-fate) + birthstones (the
  true history — jewelers voted in Kansas City, 1912 — is delightful),
  (4) name days, (5) birth flowers as confetti.
- **Handling rules (UNESCO-derived):** label every entry with where/when/
  whether still practiced; show variation as a feature; never grade cultures'
  beliefs; culture-native review for living systems; "tradition says…" not
  claims.

---

## 4. The daily loop, assembled

One screen, ~90 seconds, complete:

1. **The crossing.** Today's mansion — name(s), star, one line of real lore.
2. **Your relation.** The nine-cycle (tārābala track), in house voice.
3. **The sky's mood.** Phase, planetary day, live planetary hour; VoC as "the
   sky is buffering."
4. **The draw.** If you haven't collected today's mansion: claim its card.
   Foil conditions if a real event applies.
5. **The close.** *"That's tonight's sky. See you under tomorrow's moon."*
   A session-end signal, per Wordle: the product is finished with you today.

## 5. The collection game — with the ethics floor built in

The research's verdict on moon-gating: **acceptable without a catch-up
mechanic, provided** (a) every empty album slot shows a live "returns in N
days" countdown — the set-completion effect *requires* visible feasibility,
(b) the window is the moon's real ~24h+ transit plus a grace period
(~48h effective; Pokémon GO's 3-hour-window backlash is the cautionary tale),
(c) nothing compounds a miss — no streak break, no social letdown, and
(d) framing is always *"the mansion returns"* (orbit as promise), never
*"you missed it"* (lapse as failure).

**The guardrails (non-negotiable, from the research):**

- Count **up**, never down: "nights witnessed," no zeroing resets; if chains
  exist, auto-grant "cloudy nights" — free, never purchasable.
- No paid pulls, no virtual currency, no missable-forever content (every foil
  has a stated return path — next eclipse, anniversary reissue), no shame
  states, no countdown-urgency UI, no engineered near-misses, no mutual
  obligation mechanics (the Snapchat-streak teen-harm literature is
  unambiguous: asynchronous gifts only, no shared counters).
- Notifications opt-in, per-event, factual, default OFF for minors.
- **Publish the ethics as product copy.** Wordle proved "transparently wants
  nothing from you" is itself a growth strategy.
- When merch arrives: it may *depict* the collection, never *advance* it.

**The live calendar is free.** The sky auto-generates ~18 months of tentpoles,
already dated in the research: the Nov 2026 – Jan 2027 triple-supermoon arc
(collect all three → "Perigee" badge), the Dec 14 2026 Geminids (best shower —
and the mini-game's hidden trigger: a shooting star streaks the site; clicking
it starts Shard Runner), the Feb 6 2027 "Ring of Fire" annular, the May 20
2027 literal blue moon, and the flagship — **Aug 2, 2027: the longest land
total solar eclipse in living memory** (6m23s over Luxor). Plus the signature
recurring beat nobody can copy: the moon occults the **Pleiades** monthly
through the window — and the Pleiades ARE mansion #3, al-Thurayyā/Kṛttikā/昴.
That one card shimmers every month for a real, printable, checkable reason.

Two-person cadence: one templated moon-phase skin per month + 4–6 tentpole
treatments per year, built a season ahead. Everything is pre-computable years
out.

## 6. Sequencing

**Phase 0 — now (in flight).** Front/back wiring fixes, one-responsive-page
merge, geocoder restore. Nothing below matters if the page crashes at the
reading step.

**Phase 1 — the mansion database (content-first).** 28 records on the §3.1
schema; per-mansion permalinks with OG images (this is audit P4 + the SEO
surface); rewrite of the mansion card backs. Art: 3 pilot mansions to validate
the template, then the 28. *This phase is mostly writing, and it's the moat.*

**Phase 2 — the daily engine.** astronomy-engine integration; sidereal-27
track + tārābala; phases; planetary day/hour; the daily screen (§4); natal
lunation phase added to the birth reading. Backend: `deck` table keyed by
user (the account system finally has a reason to exist).

**Phase 3 — the collection.** The 28-slot album with countdowns; claim
windows + grace; foil conditions wired to the event calendar; the guardrails
shipped as copy; Shard Runner behind the meteor-shower trigger.

**Phase 4 — depth pass on mirror + hearth.** 16-element archetypes with
Light/Flicker/Growth; the quiz; weekday rebuild + Chinese zodiac + rokuyō;
duet.exe rebuilt on sukuyō-style relations (asymmetric readings — "you are
prosperity to them; they are karma to you" — is *better* content than a
percentage).

**Phase 5 — community.** Mansion houses, asynchronous card gifting, the
anniversary event (Sep 15, 2027 — the product turns one under the Harvest
Moon it launched under).

Each phase ships something visible. None depends on the one after it.

## 7. What "undeniable" means, concretely

When this is built, the pitch is one paragraph with no adjectives in it:

*A free site where your birth minute becomes a card in a 28-card system that
four ancient cultures actually shared; where the daily reading is computed from
the real position of the moon by an open algorithm anyone can check; where the
collection game's drop schedule is the orbit of the moon itself; where every
rare card corresponds to a real eclipse or a real occultation; where nothing is
ever for sale that touches the album, and nothing your birth data touches ever
leaves your browser — drawn by real artists, run by the creator you already
follow.*

Every clause is verifiable. That's the difference between marketing and a moat.

---

*Research corpus: `research/mansions.md` (cross-cultural verification, tārābala
mechanics, per-mansion schema + 3 worked entries), `research/transits.md`
(ranked daily drivers, content inventory, astronomy-engine decision, sky
calendar), `research/jungian-folk.md` (archetype lineage + IP, Light/Flicker/
Growth schema, folk inventory, multilingual weekday table, rokuyō mechanics),
`research/game-ethics.md` (precedent analysis, the guardrail list with
citations, live-ops calendar, easter-egg design).*
