# content/scripts, the sky videos

The scripts for `CONTENT.md`'s first vein: the sky, five a week, 30 to 90 seconds each, one per file. Written by the night shift under packet W2 (`docs/BACKLOG-V2.md`); Justin records them.

## What each file holds

A header (air date, the station and its four names, the determinant star and span, the agreement flag with the table row it comes from, which cold open it is, sources, length), then `## Spoken`, the words said on camera and nothing else, then `## On screen`, three or four caption cues, then `## Facts checked`, every claim in the spoken text traced to the table, the corpus or an outside fact stated plainly.

The gate: `node tools/script-length.mjs content/scripts/*.md` counts the spoken words and prints the read-aloud time at 150 words a minute and at 130. A script passes under 90 seconds at the slow pace with its flag cited. The scripts are written to about 160 to 180 words, which is 65 to 85 seconds slow and under 75 at an ordinary pace, so there is room for a pause on each name.

## The rules the scripts follow

- `WRITING.md`: show it, no throat-clearing, no announcing the reveal, no em dashes, no `you will`, every value judgment attributed to the sky that made it. "We" appears nowhere; the one first-person script (the Listener) is Justin's own voice about his own naming choice, which `CONTENT.md` number 9 asks for.
- The vocabulary law: the 28 are **stations** throughout, never the other word (`STARSHARD-LAUNCH.md` section 2.2, `tools/writing-lint.mjs`). The epithets are the slate in `research/mansion-names.md`. No noun is coined.
- Every script ends on tonight's station and the URL (`STARSHARD-LAUNCH.md` section 5). Manzil is not mentioned.
- The four skies are named by their own words, with the tradition that said each thing named each time. Where the thesis line says "four skies" and the fourth voice is Greek rather than Japanese (the Ghost), the facts section says so.

## Air dates and the moon

Each script's outro names the station the moon stands in on its air date, from the same engine as `GET /api/tonight` (`starshard-api/lib/tonight.js`: the night runs 06:00 to 06:00 New York and is read at 21:00). If a video slips a day, change the last line to that night's station from this table and nothing else.

| night (New York) | station | the moon stands in |
|---|---|---|
| Sun 8 Nov | 18 | the Heart |
| Mon 9 Nov | 19 | the Root |
| Tue 10 Nov | 20 | the Flock |
| Wed 11 Nov | 21 | the Empty District |
| Thu 12 Nov | 22 | the Listener |
| Fri 13 Nov | 23 | the Drum |
| Sat 14 Nov | 24 | the Void |
| Sun 15 Nov | 24 | the Void |
| Mon 16 Nov | 25 | the Hideaway |
| Tue 17 Nov | 26 | the Chamber |
| Wed 18 Nov | 27 | the Guide |
| Thu 19 Nov | 28 | the Thread |
| Fri 20 Nov | 1 | the Gate |
| Sat 21 Nov | 2 | the Bearer |
| Sun 22 Nov | 4 | the Follower |
| Mon 23 Nov | 5 | the Blaze |
| Tue 24 Nov | 6 | the Storm |

The moon skips the Gathered Stars (3) between the 21st and the 22nd this month: it enters station 3 after the 21:00 reading on the 21st and leaves it before the 21:00 reading on the 22nd. Computed 4 November 2026 by the night shift; the root test suite (`npm test`, 230/230, which includes the 730-night agreement test between this engine and the game's) was green at the time.

## Week 1 (8 to 14 November)

| file | cold open | station | flag | air |
|---|---|---|---|---|
| `2026-11-08-the-heart.md` | 1, Antares | 18 | STRONG | Sun 8 Nov, the moon in it |
| `2026-11-10-the-ghost.md` | 5, Praesepe | 8 | STRONG | Tue 10 Nov, floating |
| `2026-11-11-the-empty-district.md` | 3, the starless stretch | 21 | DIVERGENT | Wed 11 Nov, the moon in it |
| `2026-11-12-the-listener.md` | 9, the name that could not go on a card | 22 | PARTIAL | Thu 12 Nov, the moon in it |
| `2026-11-14-the-void.md` | 2, luck of lucks and emptiness | 24 | DIVERGENT | Sat 14 Nov, the moon in it |

Four of the five air on the night the moon is in the station they are about, which is the hook `CONTENT.md` says cannot be accused of being invented. The Ghost floats; the moon reaches station 8 on or about 26 November, when it could run again.

## What is left for later weeks

Cold opens not yet written: 4 (Aldebaran, the Follower; the moon is there Sun 22 Nov), 6 (the one scorpion against four Chinese animals, stations 16 to 19), 7 (the 28 Chinese animals, a series), 8 (the station with no Sanskrit name, 28; the moon is there Thu 19 Nov), and 10, the nightly format itself. Of the four DIVERGENT stations, 10 (the Throne) and 15 (the Veil) have no script yet.
