# Research: The Daily Layer — Transit Engine, Ephemeris, Sky Calendar

*Star Shard research corpus · August 11, 2026 · full agent report*

## PART A — Anatomy of a credible daily-transit layer

### A1. The daily drivers, ranked

Traditional and modern practice converge on the Moon as the engine of day-scale astrology: it is the fastest moving planet, changing sign every ~2.3 days and making several exact aspects per day, which is why electional/daily timing is built around it ([Cafe Astrology, Timing with the Moon](https://cafeastrology.com/timingwiththemoon.html)). CHANI's Today screen is structured exactly this way: daily horoscope by rising sign + "Today's Moon Forecast" (phase + sign) + slower "Planetary Horoscopes" ([CHANI app tour](https://chaninicholas.zendesk.com/hc/en-us/articles/8711720295187-A-Tour-of-the-CHANI-App)). Co-Star's daily content is generated from "interactions between your birth chart and current planetary transits," keyed primarily to natal Sun/Moon/Rising ([Aurae Co-Star review](https://www.auraeastrology.com/blog/co-star-app-review-2026-an-astrologers-honest-opinion)).

| Rank | Driver | Changes | Weight | Notes |
|---|---|---|---|---|
| 1 | Transiting Moon sign | every ~2.3 days | High | computable today |
| 2 | Moon aspects to natal planets | several/day | High — the personalization core | needs full natal chart to shine |
| 3 | Moon phase (8-phase) | ~3.7 days/octant | High at New/Full | Sun–Moon elongation — computable today |
| 4 | Void-of-course windows | several/week | Medium-high | needs transiting Mercury→Pluto |
| 5 | Planetary hour | ~hourly | Medium | needs only sunrise/sunset — **no major app surfaces it; differentiator** |
| 6 | Planetary day ruler | daily | Medium (Valens) | free — weekday already computed |
| 7 | Inner-planet ingresses/stations (esp. Mercury rx) | days–weeks | High cultural weight | CHANI's "Planetary Horoscopes" tier |
| 8 | Eclipses | 4–5/year | Very high when they occur | event calendar, not daily computation |
| 9 | Outer-planet aspects/ingresses | months–years | High but slow | The Pattern's whole product is this, with no daily horoscope at all |

### A2. Void-of-course Moon

Three definitions ([Anthony Louis on Lilly's VoC](https://tonylouis.wordpress.com/2021/02/27/lillys-definition-of-the-void-of-course-moon/), [companion essay](https://tonylouis.wordpress.com/2012/09/30/the-modern-misunderstanding-of-the-void-of-course-moon/)):

- **Modern/medieval (implement this):** Moon is VoC from perfection of its last Ptolemaic aspect (conj/sextile/square/trine/opp) until ingress into the next sign. This is what all consumer tables/apps use ([Cafe Astrology VoC tables](https://cafeastrology.com/void-of-course-moon-times.html)).
- Lilly (1647): application within orb, not perfection — historical curiosity, don't ship.
- Hellenistic (kenodromia): no application within next 30° regardless of sign boundary.

Aspect set: 5 Ptolemaic aspects to all planets through Pluto (modern tables end VoC on e.g. "Moon square Neptune"). Computation: root-find aspect perfection times in the current lunar sign traverse; VoC start = last aspect before ingress; end = ingress. ±1 arcmin planetary accuracy gives VoC boundaries good to ~2 minutes of clock time. Presentation: "VoC begins [time] → Moon enters [sign] [time]"; as a game state: **"the sky is buffering"** — honest and instantly legible.

### A3. Moon phases and the lunation cycle

8-phase scheme via Sun→Moon elongation octants; Demetra George's table (from Rudhyar): New 0–45° ahead, Crescent 45–90°, First Quarter 90–135°, Gibbous 135–180°, Full 180–135° behind, Disseminating 135–90°, Last Quarter 90–45°, Balsamic 45–0° ([Demetra George, The Lunation Cycle](https://demetra-george.com/blog/the-lunation-cycle/); source text Dane Rudhyar, *The Lunation Cycle*, 1967 — [Astrowiki](https://www.astro.com/astrowiki/en/Lunation_Cycle)).

**Natal lunation phase as a birth feature: yes** — needs only natal Sun/Moon (already computed) + 8 units of copy (New = initiator, Crescent = struggle against the past, First Quarter = crisis-in-action builder, Gibbous = perfecter, Full = illuminated/relational, Disseminating = teacher, Last Quarter = revisionist, Balsamic = old-soul distiller). Makes the daily layer coherent: same vocabulary for sky-phase and birth-phase; "lunar return of your phase" becomes a recurring collectible moment.

### A4. Planetary days and hours

Chaldean order (slow→fast): Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon ([Renaissance Astrology](https://www.renaissanceastrology.com/planetaryhoursarticle.html)). Day = sunrise→sunset ÷ 12 seasonal hours; night likewise; hour 1 of the day belongs to the day's ruler; 24 mod 7 = 3 shifts each day's first hour three planets along — which generates the weekday sequence itself. Classical basis: Vettius Valens, *Anthologies* I.9–10 ([Seven Stars Astrology](https://sevenstarsastrology.com/planetary-days-and-hours-in-hellenistic-astrology/)); Cassius Dio 37.18–19 on the week's origin ([FU-Berlin zodiac blog](https://blogs.fu-berlin.de/zodiacblog/2022/05/02/the-origins-of-the-planetary-week/)). Product angle: a live "Hour of Venus" chip — trivially computable, hourly churn (the strongest re-open trigger in the system), impeccable classical citations, and no major app has it. 14 copy units.

### A5. Content inventory math

Modular fragments composed per user (Co-Star's approach), never the full cross-product. ~40–120 words/unit.

**Base layer (natal Sun/Moon/ASC — buildable today): ~73 units (~7–9k words)** = Moon sign (12) + Moon in whole-sign house from ASC (12) + sky phase (8) + natal phase (8) + Moon aspect × natal point (5×3=15) + VoC copy (4) + planetary day/hour (14).

**Full layer (10-planet natal): ~236 units (~20–28k words)** = above + Moon aspect × 12 points (60) + ingress copy 9 planets × 12 signs (108) + retrograde stations (~10).

With ×2–3 anti-repetition variants on high-frequency Moon modules: **~350–450 units (~35–50k words)** — a real but bounded copywriting project. The enumerated cross-product (5,760 readings) is neither necessary nor what competitors write.

### A6. The cut line

**Build:** Moon sign + house-from-ASC, Moon-to-natal aspects, 8 phases (sky + natal), VoC, planetary day/hour, ingresses + retrogrades, eclipse events. This covers everything Co-Star and CHANI surface daily.

**Cut:** secondary progressions, solar arc, returns-as-charts, profections. The Pattern — the only major app built on slow timing — delivers it as vague multi-week "cycles" from ordinary transits and offers no daily horoscope at all ([Aurae Pattern review](https://www.auraeastrology.com/blog/the-pattern-app-review-2026-an-astrologers-honest-opinion)). Outer-planet transits (free with the ephemeris) give the same "season of restructuring" effect. If one slow feature is ever wanted: annual profections is literally `age mod 12` — a yearly beat, not daily.

## PART B — Client-side ephemeris expansion

| Option | Bodies | Accuracy | Payload | License | Maintenance |
|---|---|---|---|---|---|
| sweph-wasm (Swiss Eph → WASM) | everything incl. Chiron | 0.001″ | WASM + 2–10MB data ([u-blusky](https://github.com/u-blusky/sweph-wasm)) | **AGPL-3 or CHF 700** ([contract PDF](http://www.astro.com/swisseph/secont_e.pdf)); one popular wrapper mislabels the license — compliance trap | mixed |
| Moshier JS ports ([0xStarcat](https://github.com/0xStarcat/Moshier-Ephemeris-JS), [ephemeris npm](https://libraries.io/npm/ephemeris-moshier)) | Sun→Pluto, Chiron, nodes | <1″ planets vs JPL | 235KB–3.7MB | **GPL** (viral for shipped browser JS); one Unlicense wrapper with questionable pedigree | low activity |
| Hand-rolled truncated VSOP87 | Mercury→Neptune (no Pluto in VSOP87; Meeus ch.37 for Pluto 1885–2099) | ±1″ with 50–200 terms/planet ([RileyLog](https://rileylog.com/blog/astronomical-algorithms/)) | 30–80KB | public | weeks of careful work you own |
| **astronomy-engine** ([GitHub](https://github.com/cosinekitty/astronomy)) | Sun→**Pluto**, Moon; node *events*; no Chiron | **±1 arcminute vs JPL**, intentionally truncated VSOP87 ([author, #318](https://github.com/cosinekitty/astronomy/discussions/318)) | **116KB minified**, no data files | **MIT** | active; author committed long-term |

**Recommendation: astronomy-engine (MIT), with two supplements.** ±1′ is 60× tighter than sign-level needs and times VoC/aspects to ~1–2 min. Free bonus functions map 1:1 to the roadmap: `SearchRiseSet` (planetary hours — includes refraction; returns null in polar day/night, show "the hours dissolve"), `MoonPhase`/`SearchMoonQuarter`, `SearchLunarEclipse`/`SearchGlobalSolarEclipse` (verify foil events client-side), `Seasons`. True ecliptic-of-date longitudes via the author's documented recipe. Supplements: (1) mean lunar node = short Meeus polynomial (~5 lines; true node differs <1.75°); (2) **skip Chiron** — only Swiss Ephemeris data files do it right; shipping it forces the AGPL/CHF-700 question for one body nobody will miss. Keep the hand-rolled Meeus Sun/Moon as a cross-validation harness. Sunrise methodology citation: [NOAA GML](https://gml.noaa.gov/grad/solcalc/calcdetails.html) (zenith 90.833°, ±1 min for |lat|≤72°).

## PART C — Sky-event calendar, Sept 2026 → Dec 2027

**Eclipses** ([NASA GSFC OH2026](https://eclipse.gsfc.nasa.gov/OH/OH2026.html) / [OH2027](https://eclipse.gsfc.nasa.gov/OH/OH2027.html)): none Sept–Dec 2026 · **Feb 6 2027** annular solar (S. Pacific→S. Atlantic, 7m51s) · Feb 20–21 2027 penumbral lunar (mag 0.93) · Jul 18 2027 penumbral (mag 0.0014 — imperceptible, don't foil) · **Aug 2 2027 TOTAL SOLAR — the marquee: 6m23s max near Luxor; path S. Spain–Morocco–Algeria–Tunisia–Libya–Egypt–Saudi–Yemen; longest land totality of the era** · Aug 17 2027 penumbral (mag 0.55).

**Full moons/supermoons** ([CycleCalcs](https://www.cyclecalcs.com/full-moon-calendar.html); Espenak via [EarthSky](https://earthsky.org/astronomy-essentials/what-is-a-supermoon/)): 2026 — Sep 26 Harvest, Oct 26 Hunter's, **Nov 24 Beaver (supermoon)**, **Dec 24 Cold (supermoon, closest of 2026)**. 2027 — **Jan 22 Wolf (supermoon — arc finale)**, Feb 20 Snow (+eclipse), Mar 22 Worm, Apr 20 Pink, **May 20 Flower (seasonal blue moon)**, Jun 19 Strawberry, Jul 18 Buck (micromoon+eclipse), Aug 17 Sturgeon (micromoon+eclipse), Sep 15 Harvest, Oct 15 Hunter's, Nov 14 Beaver, Dec 13 Cold.

**Meteor showers** ([EarthSky guide](https://earthsky.org/astronomy-essentials/earthskys-meteor-shower-guide/), [AMS](https://www.amsmeteors.org/meteor-showers/meteor-shower-calendar/)): Draconids Oct 9 2026 · Orionids Oct 23 2026 · Taurids Nov 5/9 2026 (new moon — dark skies, fireballs) · Leonids Nov 18 2026 · **Geminids Dec 14 2026 (up to 120/hr, dark skies — best of the window)** · Ursids Dec 22 2026 · Quadrantids Jan 3–4 2027 (favorable) · Lyrids Apr 22–23 · Eta Aquariids May 5–6 · Delta Aquariids Jul 29–30 · Perseids Aug 12–13 2027 (moon-washed) · Orionids Oct 21–22 · Leonids Nov 17–18 · Geminids Dec 13–14 2027 (washed out).

**Mercury retrograde** ([Moontracks](https://www.moontracks.com/mercury_ingress.html)): Oct 24–Nov 13 2026 · Feb 9–Mar 3 2027 · Jun 10–Jul 4 2027 · Oct 7–28 2027.

**Conjunctions/oppositions** ([In-The-Sky 2026](https://in-the-sky.org/newscalyear.php?year=2026)/[2027](https://in-the-sky.org/newscalyear.php?year=2027), [Star Walk](https://starwalk.space/en/news/planetary-conjunctions)): Sat opposition Oct 4 2026 · **Jupiter–Mars 1°11′ Nov 14–15 2026 (best pairing of late 2026)** · Uranus opp Nov 25 2026 · Jupiter opp Feb 10–11 2027 · **Mars opposition Feb 19 2027** · Venus–Saturn May 7–8 · Venus–Uranus Jun 13 · **Venus–Mercury triple: Jul 1, Aug 11 (closest, in glare), Oct 10 2027** · Neptune/Saturn/Uranus opps Sep 28/Oct 17–18/Nov 30 2027 · Venus–Mars Nov 24–25 2027.

**Recurring signature beat:** the Moon occults the **Pleiades** monthly through the window ([Universe Today](https://www.universetoday.com/articles/top-astronomical-events-to-watch-for-in-2026)) — and the Pleiades are mansion #3 (al-Thurayyā/Kṛttikā/昴). Discarded source: telescopeadvisor.com's 2027 calendar contradicts NASA on every eclipse — calendar above uses NASA GSFC and In-The-Sky as ground truth.
