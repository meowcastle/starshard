# Manzil on iPhone and Android

The app is the same Manzil page staging serves, wrapped with Capacitor. Nothing about the
game is forked: `tools/build-app.mjs` reads `tools/deploy.sh` to decide what the page is,
so a Design delivery or a canon flip reaches the app on the next build with no edit.

What the shell adds, all in `app/src/app-bridge.js` (Code-owned, app-only, the website
never loads it):

- sign-in that works inside an app. A webview's cookies are third-party to the API (iOS
  drops them), so the server hands app clients the same session token in the response
  and they send it back as a header. Same token, same revocation, same 90 days. The PvP
  socket gets it in its handshake. Tested end to end: `test/app-e2e.mjs`.
- landscape on phones, status bar off, the splash held until the first frame
- haptics on the game's own events (a board settling, a win, a loss, a cleared climb)
- Android's back button acts as the game's Escape (the lobby menu); twice quickly leaves
- a new night while the app sat in the background reloads the road, between boards only
- the nightly reminder, computed on the phone from the game's own ephemeris ("the moon
  stands in the heart tonight"): asked for only after a first won board, and only for a
  player whose birth date says 18 or over. Everyone else can opt in from a settings
  control once Design adds one (`window.STARSHARD_APP.remindMe(true)`).
- bundled fonts and runtime: a phone loads nothing from anywhere but the app and the API.
- the account page (`account-data/`): sign in, download your data, delete the account.
  Apple requires in-app deletion; the lobby menu still needs the link to it (Design,
  `MANZIL-QUEUE.md`).

## Shipping a build

Approve a `release` on Telegram, or by hand:

    git tag app-v1.0.1 && git push origin app-v1.0.1

GitHub Actions (`.github/workflows/manzil-app.yml`) then runs the tests and the app
end-to-end test against a real database, builds both apps, and uploads them: iOS to
TestFlight, Android to Play's internal testing track. Twenty to forty minutes later the
build is on your phone through the TestFlight app / the Play Store's internal test link.

Going public is always your own tap: App Store Connect > the build > Submit for Review,
and Play Console > Internal testing > Promote release. Nothing automated does that.

## One-time setup (yours: accounts and money)

1. **Apple Developer Program**, $99 a year, developer.apple.com/programs. Enrolling as
   Bjur Media LLC puts the company name on the store page and needs a D-U-N-S number
   (free, takes a few days); enrolling as yourself is immediate and shows your name.
2. **The app record.** In App Store Connect: Apps > + > New App, bundle ID
   `net.starshard.manzil`, name "Manzil" (if it's taken, "Manzil: Tonight's Sky").
3. **An API key for the build robot.** App Store Connect > Users and Access >
   Integrations > App Store Connect API > Team Keys > +, access **Admin** (Admin is what
   lets the robot manage signing certificates for you; a lower role fails at signing).
   Download the .p8 (it only downloads once). Note the Key ID and the Issuer ID above
   the list, and your Team ID from developer.apple.com > Membership.
4. **Google Play Console**, $25 once, play.google.com/console. A new *personal* account
   must run a closed test with at least 12 testers for 14 days before it can publish to
   production; an *organization* account (Bjur Media LLC, D-U-N-S again) skips that. Make
   the app (Create app, "Manzil", game, free).
5. **The Android upload key**, made once on your Mac and kept somewhere safe (lose it and
   you need Google support to reset it):

       keytool -genkeypair -v -keystore manzil-upload.jks -alias manzil -keyalg RSA -keysize 2048 -validity 10000

   Play App Signing (on by default) holds the real signing key; this one only proves
   uploads come from you.
6. **A Play service account for the robot.** Google Cloud console: a project, enable
   "Google Play Android Developer API", IAM > Service accounts > create, Keys > add JSON
   key. Then Play Console > Users and permissions > Invite new users, the service
   account's email, with "Release to testing tracks" for Manzil.
7. **The first Android upload is by hand.** Play's API can't upload to an app that has
   never had a release. Run the workflow once (Actions > manzil-app > Run workflow), take
   the `.aab` from the run's artifacts, and upload it to Internal testing yourself. Every
   later build goes up on its own.
8. **The secrets.** GitHub > meowcastle/starshard > Settings > Secrets and variables >
   Actions > New repository secret, one each:

   | secret | what goes in it |
   |---|---|
   | `APPLE_TEAM_ID` | the Team ID (10 characters) |
   | `ASC_KEY_ID` | the API key's Key ID |
   | `ASC_ISSUER_ID` | the Issuer ID |
   | `ASC_KEY_P8_BASE64` | `base64 -i AuthKey_XXXX.p8 \| pbcopy`, then paste |
   | `ANDROID_KEYSTORE_BASE64` | `base64 -i manzil-upload.jks \| pbcopy`, then paste |
   | `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
   | `ANDROID_KEY_ALIAS` | `manzil` |
   | `ANDROID_KEY_PASSWORD` | the key password (same as the keystore's unless you chose otherwise) |
   | `PLAY_SERVICE_ACCOUNT_JSON` | the whole JSON key file's contents |

9. **The server.** Deploy the API once (`tools/deploy.sh backend`): it now accepts the
   app's token and the app's two origins. No .env change is needed for that. Phones reach
   `https://api.staging.starshard.net`, so it must answer from outside the house, the way
   it does for the website today. For launch, a real `api.starshard.net` belongs in
   `app/app.config.json` (queued).

## Before the first public submission

- The lobby menu's link to the account page (Design; Apple rejects without it).
- Check the privacy policy's company name, contact addresses and governing law
  (`privacy/`, `terms/`: Code wrote them from what the code does; you haven't confirmed
  the names).
- Store listing, privacy answers and age rating: `app/STORE-LISTING.md`.
- Screenshots: every CI run attaches `e2e-screenshots`, 2868x1320, which is the 6.9"
  iPhone landscape size. Pick the good ones, or shoot real play on a phone.
- On a real iPhone and a real Android phone, check what a browser test can't:
  the notch and the home bar (the stage should sit inside the safe area, black on the
  sides), the splash fading into the first screen, landscape lock, haptics, the back
  button, the reminder prompt after a first win, and coming back after midnight.

## Working on it locally

    npm install && npm run vendor          # repo root, once
    cd app && npm install
    npm run sync                           # builds www/ and copies it into both native projects
    npx cap open ios                       # Xcode (needs a Mac with Xcode)
    npx cap open android                   # Android Studio
    npm run assets                         # after changing app/assets/*.png

The icon and splash in `app/assets/` are drawn from `app/src/icon.svg` (the 28 houses as
ticks, tonight's lit, the crescent): a placeholder until Design sends the real mark.
