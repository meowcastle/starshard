# content/steam, the Steam page

Everything the Steamworks store page editor asks for, prepared by the night shift under packet W3 (`docs/BACKLOG-V2.md` section 5) on 5 November 2026. Justin opens the page; nothing here is uploaded by the agent, and the $100 app fee is his to pay or not (`ROLLOUT.md` Phase 1, `research/steam-economics.md` "Implications" 1).

## What is here

- `copy.md`: the strings a visitor reads, field by field: name, subtitle, short description, about this game, mature content, legal line. The noun ledger holds this file clean.
- `page.md`: the rest of the editor's fields (genres and tags, features, languages, release date display, price, draft system requirements) and the lines held off the page for the rebuild, each tied to the sim packet that licenses it.
- `assets.md`: every store, community and library image Steam lists, with its size, its text rule, the real source in the game it is made from, and the trailer's rules; the screenshot capture note; read from the Steamworks docs on 5 November 2026.
- `mark.svg`: the game's own mark, the 200 by 200 thumbnail from the shipped file (`__bundler_thumbnail`): the amber ring, the gold cross, the word. Extracted, not drawn.
- `capsules/`: the eleven images rendered from the lobby's street scene and the mark by `tools/steam-capsules.mjs`, at the warm hour (dusk) the renderer defaults to. Each file name carries its size.
- `capsules-dark/`: the same four wide capsules at full dark, for the comparison in the decisions below.

## The gate

```
node tools/steam-copy-check.mjs
```

Runs `tools/writing-lint.mjs` over every Markdown file here, `tools/noun-ledger.mjs` over `copy.md`, holds the short description under 300 characters with no line break and no URL, checks that `assets.md` carries every asset with its size, and reads each file in `capsules/` to confirm it is the size its name says.

## The renderer

```
node tools/steam-capsules.mjs [--hour 0..3] [--only <name>] [--fonts <dir>] [--out <dir>]
```

Mounts `app/src/scene.html` (the street scene `app/scene-extract.mjs` lifted from the V2 file) at each asset's frame, scaled to cover and cropped the way the shell's home page does, lights it from `scene.css`'s hour table, sets the word in Cormorant Garamond from the token sheet, and screenshots at scale 1 with Playwright. It needs a Chromium Playwright can launch, so it runs in the sandbox or on the Mac after `npx playwright install chromium`; `--fonts` names a folder of the @fontsource woff2 files for a machine with no road to Google Fonts. Re-run after any change to the scene or the hour tables.

## The laws the copy follows

`WRITING.md`: show it, no throat-clearing, no em dashes, no prophecy, no first person, the reader the subject of every sentence. The vocabulary law: the 28 are stations, no noun is coined, the capitalised words in the copy are the sky's and the traditions' own. Every claim describes the game shipped at `/play` today; the rebuild's mechanics are held in `page.md` until the sim passes them. Steam's own rules: no links or implied URLs in the descriptions, no time-based words, the capsules carry the name and nothing else, the screenshots show play and nothing else.

## Decisions for Justin

- **Whether the page goes up before the commission.** The wide capsules are the street scene, which is finished art; the five screenshots Steam requires are of the board, whose card faces `manzil-art2.js` calls placeholder linework. Option A: open the page now on the street-scene capsules with five screenshots of the shipped board, and replace the screenshots when the art lands (wishlists start compounding today). Option B: hold the page until the commissioned faces exist (`ROLLOUT.md` Phase 3). Option C: open the page with the capsules and the minimum five screenshots framed on the lobby, the road and the codex, where the linework is smallest. The capsules are rendered either way.
- **The hour.** `capsules/` is the warm hour (dusk: the stall, the cat, the horizon's glow); `capsules-dark/` is full dark (the lamps and stars). One flag on the renderer.
- **The name's case.** The game prints `manzil`; Steam's name field usually carries a capital. `copy.md` says Manzil; the capsules say manzil, as the game does.
- **The case of the copy.** The about text is in the game's lower case. If the Steam page should read in sentence case, it is one pass over `copy.md` and the gate holds either way.
- **Price.** Not on a Coming Soon page. `ROLLOUT.md` keeps the game free as the funnel; `research/steam-economics.md` runs the $9.99 number. Nothing in the copy names a price.
- **The subtitle.** "the sky's card game" is the manual's line. Steam allows an official subtitle on the capsules; it is on the library capsule now and on nothing else.
- **Online PvP as a listed feature.** The open tables exist on the server (MZ6). If they are not meant to be on at launch, drop the feature and the tag.
