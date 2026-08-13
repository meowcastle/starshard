# Research: the hunger axis, the guardian animals, and the Keeper table

*Star Shard research corpus · August 12, 2026 · the data fill for
`INSTRUMENT.md` §4's four-axis station grammar, plus one blocker closed.
Two verification agents; every claim below carries its provenance verdict.*

---

## 0. Headline — the Keeper table is resolved (a `[VERIFY]` blocker closes)

The per-station luminary has been flagged `[VERIFY]` since the reboot and
has been blocking `sigil.js`. **It was hiding in the traditional names all
along.** Each of the 28 mansions has a canonical four-character name —
角木蛟, 婁金狗, 昴日雞 — structured as **mansion + luminary + animal**, and
the middle character runs a repeating seven-cycle: 木 Jupiter · 金 Venus ·
土 Saturn · 日 Sun · 月 Moon · 火 Mars · 水 Mercury. That is the
seven-luminaries week (七曜), the same Hellenistic planetary week that
reaches China through Buddhist transmission (Amoghavajra's *Xiùyào jīng*,
8th c.) — and the same week our weekday Keepers already run on.

Verified against the Siku Quanshu divination text *演禽通纂 Yǎnqín Tōngzuǎn*.
Distribution checks out exactly: **4 stations per luminary, 28 = 4 × 7.**

**Rule for `sigil.js`:** `keeper(station) = CYCLE[(nativeXiuNumber − 1) mod
7]` where `CYCLE = [Jupiter, Venus, Saturn, Sun, Moon, Mars, Mercury]`.
`nativeXiuNumber` is already in `mansions-table.json` as `xiu.native_number`.
No placeholder needed; the loud flag can come out.

---

## 1. The master station table

Everything the four-axis grammar needs, per station, in one place.

| # | span | xiù | Keeper | guardian animal | nakṣatra | match |
|---|---|---|---|---|---|---|
| 1 | 0°00′ Ari | 婁 #16 | **Venus** 金 | dog | Aśvinī | STRONG |
| 2 | 12°51′ Ari | 胃 #17 | **Saturn** 土 | pheasant | Bharaṇī | PARTIAL |
| 3 | 25°43′ Ari | 昴 #18 | **Sun** 日 | rooster | Kṛttikā | STRONG |
| 4 | 8°34′ Tau | 畢 #19 | **Moon** 月 | crow | Rohiṇī | STRONG |
| 5 | 21°26′ Tau | 觜 #20 | **Mars** 火 | monkey | Mṛgaśīrṣa | STRONG |
| 6 | 4°17′ Gem | 參 #21 | **Mercury** 水 | ape / gibbon | Ārdrā | — |
| 7 | 17°09′ Gem | 井 #22 | **Jupiter** 木 | wild dog (犴) | Punarvasu | STRONG |
| 8 | 0°00′ Cnc | 鬼 #23 | **Venus** 金 | goat | Puṣya | STRONG |
| 9 | 12°51′ Cnc | 柳 #24 | **Saturn** 土 | river deer | Āśleṣā | PARTIAL |
| 10 | 25°43′ Cnc | 星 #25 | **Sun** 日 | horse | Maghā | STRONG |
| 11 | 8°34′ Leo | 張 #26 | **Moon** 月 | deer / stag | P. Phālgunī | STRONG |
| 12 | 21°26′ Leo | 翼 #27 | **Mars** 火 | snake | U. Phālgunī | STRONG |
| 13 | 4°17′ Vir | 軫 #28 | **Mercury** 水 | earthworm | Hasta | DIVERGENT |
| 14 | 17°09′ Vir | 角 #1 | **Jupiter** 木 | flood-dragon (蛟) | Citrā | STRONG |
| 15 | 0°00′ Lib | 亢 #2 | **Venus** 金 | dragon | Svāti | — |
| 16 | 12°51′ Lib | 氐 #3 | **Saturn** 土 | raccoon dog | Viśākhā | STRONG |
| 17 | 25°43′ Lib | 房 #4 | **Sun** 日 | hare | Anurādhā | STRONG |
| 18 | 8°34′ Sco | 心 #5 | **Moon** 月 | fox | Jyeṣṭhā | STRONG |
| 19 | 21°26′ Sco | 尾 #6 | **Mars** 火 | tiger | Mūla | STRONG |
| 20 | 4°17′ Sgr | 箕 #7 | **Mercury** 水 | leopard | P. Aṣāḍhā | — |
| 21 | 17°09′ Sgr | 斗 #8 | **Jupiter** 木 | xièzhì (mythical) | U. Aṣāḍhā | — |
| 22 | 0°00′ Cap | 牛 #9 | **Venus** 金 | ox | Śravaṇa | — |
| 23 | 12°51′ Cap | 女 #10 | **Saturn** 土 | bat | Dhaniṣṭhā | — |
| 24 | 25°43′ Cap | 虛 #11 | **Sun** 日 | rat | Śatabhiṣā | PARTIAL |
| 25 | 8°34′ Aqr | 危 #12 | **Moon** 月 | swallow | P. Bhādrapadā | — |
| 26 | 21°26′ Aqr | 室 #13 | **Mars** 火 | pig | U. Bhādrapadā | — |
| 27 | 4°17′ Psc | 壁 #14 | **Mercury** 水 | yàyǔ (mythical) | Revatī | — |
| 28 | 17°09′ Psc | 奎 #15 | **Jupiter** 木 | wolf | *(none — see §5)* | — |

### Animal provenance — a required hedge

The animals are **not** ancient. They belong to the *qínxīng* 禽星
("star-animal") divination tradition and are first recorded in Lu Dian's
*Piya* 埤雅 (11th c.), standardized in the Song and carried into Chinese,
Japanese and Vietnamese almanacs; zoomorphic asterisms were not a feature
of Han cosmology. **Never write "ancient" or "Han" for the animals.**
Correct hedge: *"a traditional set standardized in the Song dynasty."*
(The mansions themselves and the Four Symbols *are* ancient — Warring
States, standardized in the Han. Don't let the two datings blur.)

Two animals have no honest English equivalent and stay mythical:
**xièzhì** (獬, station 21) — a horned justice-beast; never "unicorn" —
and **yàyǔ** (貐, station 27) — a man-eating creature; never "porcupine."
Also keep 獐 (river deer, st. 9) and 鹿 (deer/stag, st. 11) distinct;
both get flattened to "deer" in careless sources.

### The Four Symbols — cleared, with one correction

Azure Dragon 青龍 (east/spring) · Vermilion Bird 朱雀 (south/summer) ·
White Tiger 白虎 (west/autumn) · Black Tortoise 玄武 (north/winter).
Attested from the Warring States (the Marquis Yi of Zeng lacquer chest,
c. 433 BCE, names all 28 mansions) and standardized in the Han; used
across China, Japan (Seiryū/Suzaku/Byakko/Genbu), Korea and Vietnam.
**Do not cite the ~5300 BCE Puyang tomb** — it shows two animals, not
four, and calling it "the Four Symbols" is an anachronism that circulates
on Wikipedia. 玄武 literally reads *Dark Warrior* and depicts a tortoise
entwined with a snake; "Black Tortoise" is the right English convention,
with the literal gloss available as a grimoire line.

---

## 2. The hunger axis — 27 records

**Free to use** (classical, multiply attested): deity, symbol, Vimśottarī
lord, gaṇa. The *motive* column below is **my own original English**,
composed from deity + symbol only — see §3 for why that boundary matters.
Symbol variants are given as sets because the sources genuinely disagree;
pick per station for the best image, don't assert one as "the" symbol.

| # | nakṣatra | deity | symbol | lord | the hunger (draft) |
|---|---|---|---|---|---|
| 1 | Aśvinī | the Aśvin twins, horse-headed physicians who arrive at emergencies | horse's head | Ketu | to get there first, before anyone has asked |
| 2 | Bharaṇī | Yama, who receives the dead and judges | yoni | Venus | to carry a thing across the threshold it cannot cross alone |
| 3 | Kṛttikā | Agni, fire, the mouth that eats offerings | blade · flame · axe | Sun | to cut until only the true part is left |
| 4 | Rohiṇī | Prajāpati (later Brahmā), lord of offspring | ox-cart · banyan | Moon | to make a thing grow where it stands |
| 5 | Mṛgaśīrṣa | Soma, the moon-draught | deer's head | Mars | to keep searching, because the scent is faint and real |
| 6 | Ārdrā | Rudra, the howler in the storm | teardrop · a head | Rahu | to break the surface open and find out what it cost |
| 7 | Punarvasu | Aditi, the boundless mother | bow and quiver | Jupiter | to come back — the second arrival, after the loss |
| 8 | Puṣya | Bṛhaspati, priest of the gods | cow's udder · lotus | Saturn | to feed the thing that will outlast you |
| 9 | Āśleṣā | the Nāgas, serpents of hidden knowledge | coiled serpent | Mercury | to hold on, and to know what nobody said out loud |
| 10 | Maghā | the Pitṛs, the ancestral fathers | throne · palanquin | Ketu | to be worthy of the seat someone else carved |
| 11 | P. Phālgunī | Bhaga, of allotted fortune | front legs of a bed | Venus | to be delighted in, and to make delight |
| 12 | U. Phālgunī | Aryaman, of kinship and contract | back legs of a bed | Sun | to keep the promise after the party ends |
| 13 | Hasta | Savitṛ, the impeller who sets things moving | an open hand | Moon | to hold the whole thing in one hand and make it |
| 14 | Citrā | Tvaṣṭṛ, the divine artisan | a bright jewel | Mars | to build the one beautiful thing they can't argue with |
| 15 | Svāti | Vāyu, the wind | a young shoot in wind | Rahu | to move freely and bend without snapping |
| 16 | Viśākhā | Indrāgnī, force and fire as one | triumphal arch | Jupiter | to reach the goal, and to find out what the reaching made of you |
| 17 | Anurādhā | Mitra, god of friendship and sworn alliance | archway · lotus | Saturn | to keep the friendship through the part that isn't fun |
| 18 | Jyeṣṭhā | Indra, king of the gods | amulet · umbrella | Mercury | to be the eldest — protector, and burdened by it |
| 19 | Mūla | Nirṛti in practice, Prajāpati in the oldest text (§4) | a bundle of tied roots | Ketu | to pull it up by the root and see what was actually holding |
| 20 | P. Aṣāḍhā | Āpas, the divine waters | elephant tusk · fan | Venus | to be unbeaten, and to enjoy it out loud |
| 21 | U. Aṣāḍhā | the Viśvedevas, the all-gods together | elephant tusk | Sun | to win the thing that stays won |
| 22 | Śravaṇa | Viṣṇu, who crossed the worlds in three strides | an ear · three footprints | Moon | to listen until the pattern shows itself |
| 23 | Dhaniṣṭhā | the eight Vasus, gods of abundance | a drum | Mars | to set the rhythm the others fall into |
| 24 | Śatabhiṣā | Varuṇa, of oaths, waters, and hidden law | an empty circle | Rahu | to heal the thing nobody could name |
| 25 | P. Bhādrapadā | Aja Ekapāda, the one-footed fire-pillar | front legs of a cot | Jupiter | to burn off what's false, including your own |
| 26 | U. Bhādrapadā | Ahirbudhnya, serpent of the deep foundation | back legs of a cot | Saturn | to go still and deep enough to hold weight |
| 27 | Revatī | Pūṣan, nourisher and guide of travelers | a pair of fish | Mercury | to see everyone home |

---

## 3. Provenance and copyright — the śakti problem

**Read this before writing station bodies.** The famous *śakti* ("power")
list that circulates for the nakṣatras — "the power to quickly reach
things," etc. — has a real ancient skeleton and a modern skin:

- The **skeleton is classical and free**: Taittirīya Brāhmaṇa 1.5.1 (1st
  millennium BCE) gives per-nakṣatra deities with a genuine
  *parastāt*/*avastāt* ("from above"/"from below") structure and a stated
  effect, with a medieval commentary by Bhaṭṭabhāskara Miśra. Both public
  domain.
- **The word *śakti* is not in the source verses.** The four-part
  power/above/below/result table is **David Frawley's 20th-century
  systematization** (he says so himself: a teaching he "uncovered and
  translated"), popularized by Dennis Harness (1999, and he credits
  Frawley). Ernst Wilhelm's independent translation of the same verses
  contains no "power" terminology at all and diverges materially — for
  Rohiṇī the two translators even invert the above/below pair.
- **Copying fingerprint:** the circulating Sanskrit is corrupt in a
  traceable way — "shidhra vyapani" for *śīghra-vyāpanī*, "chayani" for
  *cayanī*. Any source printing "shidhra" is copying Frawley rather than
  reading Sanskrit. Downstream astrology sites reproduce even his framing
  sentence near-verbatim, so **they are not independent corroboration.**

**The rule for our corpus** (structural analysis, not legal advice —
counsel confirms before ship): build every hunger line from **deity +
symbol only**, which are facts and unprotectable, and compose original
English. Do not reproduce Frawley's renderings; do not reproduce his
27-item table wholesale (the systematic replication of the selection and
arrangement is the real exposure, not any single short phrase); do not
carry the corrupt transliterations. **And vary the syntax** — the
repeated "the power to X" formula across 27 entries is itself the
fingerprint. The §2 drafts above deliberately break that pattern.

---

## 4. Disagreements to decide (four are material)

1. **Mūla — Nirṛti vs. Prajāpati.** Modern astrology universally assigns
   Nirṛti (dissolution), which drives the whole roots/uprooting reading.
   But in the Taittirīya verse the presiding deity is **Prajāpati**, and
   Nirṛti appears only as the force being *sent away*. The tradition
   promoted the banished entity into the presiding one. **Recommendation:**
   use the uprooting reading (it's the living convention and the better
   image) but never claim Vedic attestation for Nirṛti-as-deity; the
   grimoire gets the honest note, which is a *great* grimoire note.
2. **Pūrva/Uttara Phālgunī — Bhaga and Aryaman are swapped** between the
   Vedic layer and the Purāṇic/modern one. **Recommendation:** follow the
   modern convention (as §2 does), disclose in the grimoire.
3. **Āśleṣā = the Nāgas**, not Rahu. The Rahu attribution on English
   Wikipedia is a conflation. Our table is correct; don't let it drift.
4. **Uttarāṣāḍhā = the Viśvedevas**, not Brahmā (Brahmā belongs to
   Abhijit, the dropped 28th). Same note.

Also worth a grimoire line: the Taittirīya list **begins at Kṛttikā**, not
Aśvinī — the Aśvinī-first order is the later Siddhāntic convention — and
**Abhijit** is a 28th nakṣatra that the 27-fold zodiacal scheme dropped.
That is a genuinely lovely fact for a system built on 28.

---

## 5. Station 28 has no nakṣatra — and that's content

Station 28 (奎 #15, wolf, Jupiter-kept) has no nakṣatra match: the Indian
system divides the sky into 27, ours into 28, so one station falls in the
seam. **Do not fake a match.** Write its hunger axis from the Arabic image
and the Chinese guardian, and let the reading say so plainly — *"the
indian sky-map counts twenty-seven stations where the others count
twenty-eight, so this one has no indian name; you landed in the seam
between two systems"* — which is a memorable result, not a gap. Same
posture as the existing match flags.

---

## 6. Merge instructions for Claude Code

1. Add `keeper` to each record in `mansions-table.json` via the §0 rule
   (or compute it — the input `xiu.native_number` is already there). Drop
   the `[VERIFY]` placeholder in `sigil.js`.
2. Fill the empty `nakshatra.symbol` / add `nakshatra.deity` and
   `nakshatra.lord` from §2.
3. Add `xiu.quadrant` → `sky` per `INSTRUMENT.md` §5 (White Tiger = 28,
   1–6 · Vermilion Bird = 7–13 · Azure Dragon = 14–20 · Black Tortoise =
   21–27).
4. Regenerate the mansion permalinks after (2) — they render from this
   table, and the new fields belong on the pages.

## 7. Corrections applied elsewhere from this pass

- `research/corpus-spine.md` KEEPER.tuesday **rewritten**: Týr did not
  lose his hand *keeping* a promise — he put it in the wolf's mouth as
  surety and lost it when the other gods **broke** theirs (Gylfaginning
  25). The corrected line is better copy and now ships.
- Same file: the English/Romance weekday symmetry is scoped to
  Tuesday–Friday (Sunday and Monday are translations, not god-swaps;
  French *dimanche*/*samedi* went Christian).
- Friday stays **Frigg** for the English weekday, with Freyja noted as a
  loose conflation — most linguists hold the two goddesses distinct.
