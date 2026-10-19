# Manzil store listing (draft)

Copy and questionnaire answers for App Store Connect and Play Console. The privacy and
safety answers are written from what the code stores (`privacy/index.html`, the two-tier
split in the repo's `CLAUDE.md`), not from intent; if the code changes, these change.

## Names

- App name: **Manzil** (fallback if taken: **Manzil: Tonight's Sky**)
- Subtitle (iOS, 30 characters max): **A card game against the sky**
- Short description (Play, 80 max): **A card game where your opponent is tonight's real sky.**
- Category: Games > Card (secondary: Strategy)
- Bundle / package ID: `net.starshard.manzil`

## Description

Manzil is a card game where your opponent is tonight's actual sky.

The 28 cards are the 28 mansions of the Moon, the houses she passes through each month,
mapped by Arabic, Indian, Chinese and Japanese astronomers more than a thousand years ago.
Each night the road opens on the house the Moon is really standing in, and the planets
play where they really are.

Lay your cards on the road. Your left number faces the card on your left, your right
number the card on your right; the bigger number takes the neighbour. Chain the flips,
hold your own houses, and outlast eight walkers to reach the mansion herself.

Your first five cards come from your own birth chart, so no two players start alike. Miss
a house while the Moon stands in it and its door shuts until she comes round again, about
a month.

- A new board every night, set by the real sky
- Eight walkers and the mansion on every climb
- Play a friend at the open tables
- No ads, no trackers, no paid card packs, no currency

## Keywords (iOS, 100 characters)

moon,astrology,card game,lunar mansions,zodiac,stars,strategy,tarot,night sky,duel

## URLs

- Privacy policy: https://starshard.net/privacy/
- Terms: https://starshard.net/terms/
- Support: https://starshard.net/ (an address or page is needed; privacy@starshard.net is the one the policy names)

## App Privacy (Apple) / Data safety (Google)

No tracking. No data is used for advertising or shared with data brokers. No analytics.

Collected, linked to the user, used only for App Functionality:

| data | Apple category | why |
|---|---|---|
| email address | Contact Info > Email Address | sign-in and password reset |
| username | Identifiers > User ID | sign-in, shown to other players |
| birth year (the full date is used on the device and on sign-up to check age, not kept) | Other Data | the age check |
| five numbers derived from the birth chart | Other Data | the starting cards |
| game progress (cards, levels, nights walked) | Usage Data > Product Interaction | the save follows you between devices |
| reports and blocks you file | User Content > Other User Content | keeping the open tables usable |

Data is encrypted in transit (HTTPS). Users can delete their account and data in the app
(the account page) and request a copy of it there too. Only the players who ask for a full
Star Shard reading have their full birth date, time and place stored; Manzil never asks for
that.

## Age rating

Answers for both questionnaires: no violence, no sexual content, no profanity, no drugs,
no gambling and no simulated gambling (no paid packs, no currency), no unrestricted web
access. User interaction: players see each other's chosen usernames at the open tables,
with reporting and blocking. Expected result: Apple 9+ (or 13+ under the newer tiers if
the username exposure is weighed), Google Everyone 10+ / Teen. Sign-up enforces 13 (16 in
the EU states that require it) server-side.

## Screenshots

Landscape, 2868x1320 (iPhone 6.9"). CI's `e2e-screenshots` artifact produces this size on
every run. Android takes the same images plus a 1024x500 feature graphic (to make).
