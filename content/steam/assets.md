# Manzil on Steam: the asset list

Written 5 November 2026 by the night shift under packet W3. Every size below was read that day from the Steamworks documentation (`partner.steamgames.com/doc/store/assets`, `/doc/store/assets/standard`, `/doc/store/assets/libraryassets`, `/doc/store/assets/community`, `/doc/store/assets/rules`, `/doc/store/trailer`). Where the docs give a rule it is quoted short; where they give none (file-size caps, most image formats, trailer length) the cell says so rather than guessing. Re-read the pages before upload; Valve moves these.

The law for every image: a drawing never stands in for a real asset (`STARSHARD-LAUNCH.md` section 0). Each row names the real source in the shipped game it is made from. Two facts about the sources set what can be made today:

- **The lobby's street scene is finished art.** It is the V2 file's own SVG, lifted whole by `app/scene-extract.mjs` into `app/src/scene.html` with its hour lighting in `app/src/scene.css` (warm, veil, dawn). It already carries the shell's home page. It can carry every wide capsule.
- **The card faces are not.** `manzil-art2.js` says so in its first line: "placeholder linework per the commissioning briefs". A capsule built on a card face ships placeholder art, which `CONTENT.md` and `research/steam-economics.md` both say is worse than nothing. The card faces wait for the commission (`ROLLOUT.md` Phase 3).

The wordmark is the game's own: the 200 by 200 mark in the V2 file's `__bundler_thumbnail` template (an amber ring with a gold cross on the night ground, `manzil` in serif beneath) and the word `manzil` set in Cormorant Garamond, the game's title face, in the gold of the token sheet (`#F0D89A` on `#040302`). No other logo exists and none is to be drawn.

## store assets

| asset | size | required | text rule (Steamworks) | source in the game | state |
|---|---|---|---|---|---|
| header capsule | 920 x 430 | yes | the title only; the logo "easily legible against the background"; smaller sizes are generated from it | the street scene, the wordmark set left | rendered: `capsules/header-capsule-920x430.png` |
| small capsule | 462 x 174 | yes | the logo "should nearly fill the small capsule"; 120 x 45 and 184 x 69 are generated from it | the wordmark on the night ground, the amber ring beside it | rendered: `capsules/small-capsule-462x174.png` |
| main capsule | 1232 x 706 | yes | title only; this one "appears at the top of the Steam store home page in the Main Capsule carousel" | the street scene, the wordmark centred in the sky | rendered: `capsules/main-capsule-1232x706.png` |
| vertical capsule | 748 x 896 | yes | title only; used at the top of the front page during seasonal sales | the street scene cropped tall through the lamps, the wordmark at the top | rendered: `capsules/vertical-capsule-748x896.png` |
| screenshots | 1920 x 1080 minimum, 16:9, at least five | yes | "exclusively show the gameplay"; no concept art, no marketing copy, no awards; mark at least four as suitable for all ages | the shipped game at `/play`: the lobby with the road in perspective, a board dealt under a walker, a capture mid-cascade with the count at both ends, the codex open on a house, a claimed card with the name and date | five frames; see the capture note below |
| page background | 1438 x 810 | no | "ambient so as not to compete with the content on the page"; if omitted Steam uses the last screenshot | the street scene at full dark, no wordmark, darkened | rendered: `capsules/page-background-1438x810.png` |
| bundle header | 707 x 232 | only for bundles | | none | not needed |

## community and client

| asset | size | required | rule | source | state |
|---|---|---|---|---|---|
| app icon | 184 x 184, JPG | yes | "just your game logo and artwork"; its alpha is replaced with black if generated from the shortcut icon; it does not show on the page until the page is posted as Coming Soon | the `__bundler_thumbnail` mark, re-rendered at size | rendered: `capsules/app-icon-184x184.jpg` |
| shortcut icon | 256 x 256 (the community page also allows 512 x 512), ICO or PNG | yes | logo and artwork only | the same mark | rendered: `capsules/shortcut-icon-256x256.png` (PNG; Steamworks also takes ICO) |
| Mac icon | ICNS | for the macOS shortcut | without it Steam uses its own logo | the same mark, packed to ICNS | when the Mac wrapper exists |

## library assets

Only visible once the store page is published; upload them with the rest so the first wishlister's library is right.

| asset | size | required | rule | source | state |
|---|---|---|---|---|---|
| library capsule | 600 x 900 | yes | the logo must be on it; a subtitle is allowed; "no other text should be present"; a 300 x 450 PNG is generated | the vertical crop of the street scene, the wordmark, "the sky's card game" beneath it | rendered: `capsules/library-capsule-600x900.png` |
| library header | 920 x 430 | yes | no text beyond the title; if unset the store header is used | the store header, reused | rendered: `capsules/library-header-920x430.png` |
| library hero | 3840 x 1240, PNG | yes | "this image cannot include any text"; a safe area of 860 x 380 at the centre; a 1920 x 620 PNG is generated | the street scene, the stall in the safe area | rendered: `capsules/library-hero-3840x1240.png` |
| library logo | 1280 wide and/or 720 tall, transparent PNG | yes | the logotype and an optional logomark, nothing else; placed left bottom, centred top, centred middle or centred bottom | the wordmark and the ring, transparent | rendered: `capsules/library-logo-1280x720.png` |

## the trailer

| what | the docs say |
|---|---|
| resolution | "the highest resolution that you have, up to 1920 x 1080" |
| frame rate | 30 / 29.97 or 60 / 59.94 |
| bit rate | "high bit rate (5,000+ Kbps)"; Valve's own preset is H.264 at 20 Mb/s with AAC stereo at 192 Kb/s |
| container and codec | .mov, .wmv or .mp4; H.264 video and AAC audio preferred; audio at 44 or 48 kHz, filtered to stereo on transcode |
| aspect | 16:9 preferred, 4:3 accepted |
| length | no rule stated; the best-practice page says a viewer gives "less than 10 seconds", so the first shot is a capture, not a title |
| thumbnail | optional, 1920 x 1080 JPG or PNG, a frame from the video; otherwise a 600 x 380 poster and a 232 x 130 thumbnail are generated |
| microtrailer | a 6-second loop Steam cuts from the first trailer; not customisable, so the first six seconds of the trailer are the loop |
| file size | no cap stated on the page |
| the page can go up without one | yes; the Coming Soon page asks for "a set of branding images, written description, and ideally a gameplay trailer" |

The trailer waits for the art the same way the card faces do: a trailer of the shipped board is a trailer of placeholder linework. The rules the vein-three videos follow (`CONTENT.md`: board resolutions, a flip cascade, gated on art) are the trailer's rules.

## rules that cover every image

From `partner.steamgames.com/doc/store/assets/rules`: capsules carry "game artwork, the game name, and any official subtitle" and nothing else; no review scores, award marks, discount copy, calls to action, or mentions of other products; text beyond the title only through a localised artwork override that lasts at most a month; every capsule "must contain a readable product logo/name and have accurate dimensions"; all artwork PG-13. The written description may not link out, show a QR code, or imply a URL, so `starshard.net` does not appear on the page; the website and social fields on the Basic Info tab are where it goes.

## the capture note for the five screenshots

The smoke harness already walks the game to the lobby, a board, the codex and a night's end (`test/smoke-app.mjs`, the `mz7 doors` and `mz6 live` checks, `SMOKE_SHOTS=dir`), at 390 and 1440 wide. A third width entry of 1920 by 1080 in its `WIDTHS` table and the five frames named above in the `mz7` path are the whole change; the sandbox has the Chromium, the Mac's VM does not, so the run is the same shuttle every smoke has used (the build staged to the sandbox, the PNGs committed back under `content/steam/screenshots/`). The frames show the shipped linework; whether they go up before the commission is the decision in the README.

## how the images were made

`tools/steam-capsules.mjs`, in the shape of `app/og-render.mjs` (the station pages' 1200 by 630 link images): a page that mounts `app/src/scene.html` at the asset's size, scaled to cover and cropped the way the shell's home page mounts it, lit by the hour class from `scene.css`, the word set in Cormorant Garamond from the token sheet, the mark from `mark.svg`, screenshotted by Playwright at scale 1. `--hour` picks the lighting (0 dusk, the default; 1 full dark; 2 the small hours; 3 before dawn); `capsules-dark/` is the same four wide capsules at hour 1 for the comparison in the README. The images are the game's own art at these sizes and nothing more; the one thing the renderer adds is the word.

One thing it found: `scene-extract.mjs` writes the stage's own sky (the gradient list from the game's `data-mzstage` style) into `scene.html` as a bare value with no `background:` before it, so the shell's home page shows the token sheet's ground behind the street instead of the game's sky. The renderer names the property when it mounts the fragment; the one-line fix in the extract is the same prefix, and it is SS5's file, so it is reported and not touched.
