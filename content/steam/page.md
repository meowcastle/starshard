# Manzil on Steam: the store page copy

Written 5 November 2026 by the night shift under packet W3 (`docs/BACKLOG-V2.md` section 5). Every line below is for the Steamworks store page editor and nowhere else; the fields follow the editor's own order. Steam's text rules, read from `partner.steamgames.com/doc/store/page/description` on the day this was written: the short description is plain text only, "limited to a few hundred characters" (the editor's own counter is the law; the text below is held under 300); no links, URLs, QR codes or implied addresses anywhere in the descriptions; no time-based words ("now available", "wishlist now"); images inside the long description under 5 MB each and 15 MB in all.

The copy is in the game's own voice: lower case, second person, the glossary words the game already uses (road, rung, station, house, crossing, seat, count, dominion, dawn, law, ground). The 28 are **stations** throughout. Every claim is true of the game shipped at `/play` today; nothing here promises the moving sky, the deck drawn from a birth chart, or anything else the sim has not passed. Lines for those are held at the end, off the page.

---

## the strings a visitor reads

The name, the subtitle, the short description, the about text, the mature content line and the legal line are in `copy.md`, the file the noun ledger holds clean. Paste from there.

## genres and tags

genre: Strategy, Casual.

tags, in the order they should be entered (the editor weights the first ones most; check the count the editor allows): Card Game, Card Battler, Turn-Based Strategy, Board Game, Strategy, Casual, Relaxing, Atmospheric, Mythology, 2D, Singleplayer, Online PvP, Local Multiplayer, Tabletop, Short, Minimalist, Hand-drawn.

(Tags come from Steam's fixed list; any of these the editor does not offer is dropped, not invented. Deckbuilding and Roguelike are left out because neither is true of the shipped game. Hand-drawn stays only if the commissioned art is.)

## features

Single-player. Online PvP (the open tables on the server, two hands, with report and block). Shared/Split Screen PvP (pass-and-play on one device). Nothing else: no achievements, no cloud saves, no trading cards until each is built and tested in the wrapper.

## supported languages

English: interface, full audio where any, subtitles not applicable. No other language until the copy is translated; the station names appear in four scripts in the codex and that is content, not localisation.

## release date

Display: Coming Soon, no date (the no-date option sorts behind every dated game, which is right for a page that exists to collect wishlists). The exact intended date Steamworks requires is not visible to players and can be moved until two weeks before it; set it a year out.

## price

Not set on a Coming Soon page. The decision is in the README.

## system requirements (draft, to be measured on the Electron build)

Windows minimum: Windows 10 64-bit; any 64-bit processor from the last ten years; 4 GB memory; any graphics with hardware acceleration in Chromium; 300 MB storage; a network connection for online tables only. macOS minimum: macOS 12; 4 GB memory; 300 MB storage. Linux: the Windows line, Ubuntu 20.04 or later, which is also the Steam Deck line.

(Every number above is a placeholder in the shape Steam asks for. The wrapper does not exist yet (`ROLLOUT.md` Phase 4); the day it is built, measure the installed size and the memory of a running board and replace these.)

---

## lines held off the page

Each of these describes the rebuild in `MANZIL-TCG.md`. None goes on the page until the sim track passes the band it names (`docs/BACKLOG-V2.md` section 2) and Justin says so. They are written now so the swap is one edit.

- after S1 passes: "the road moves. at the end of every round the leftmost station sets and is banked by whoever holds it, and the next station in the real sequence rises on the right with its planet already standing on it, if one is there tonight. a card scores when its station sets, not when it is placed."
- after S2 passes: "a higher card may be lodged over a lower one. the covered card is still yours, and when the one above it is taken, it stands up and fights again."
- after S3 passes: "one card of yours may lie face down on the road. two retrogrades a night turn her cards before the fight is counted."
- after S6 passes: "your deck is drawn from your own birth sky. the station the moon stood in at your birth leads it, is always in reach, and returns when it is taken."
- the print promise, when physical cards exist (`MANZIL-TCG.md` section 4, the exact words, nothing added): "every card you need to play Manzil will always be available at a fixed price, and may be reprinted at any time."
