# Manzil queue

Justin's order, top first. The moneybot agent (profile `manzil`) takes the top open line,
works it on `agent/<id>`, and asks for the merge on Telegram. Reorder by moving lines; mark
a finished one `[done]` or delete it. One line per ticket, plain words.

- [done] app shell: Capacitor iOS + Android around the live page, bearer-token auth for the API and the PvP socket, account export/delete page, nightly reminder, CI to TestFlight and Play internal (19 Oct, app/RELEASING.md)
- write the Design work order for the two app hooks the markup must call: an "account and data" item in the lobby menu that calls window.STARSHARD_APP.openAccountData() (App Store blocker, guideline 5.1.1(v)), and a "remind me when the moon moves" toggle that calls window.STARSHARD_APP.remindMe(true/false); both hidden when window.STARSHARD_APP is absent (the website)
- offline launch: api.me() returns null both when signed out and when the API is unreachable, so a player with no signal is shown the sign-up screen; add api.session() returning {state: "in"|"out"|"offline", user}, keep me() as is, and write the work order for the page to show "the sky is out of reach, try again" on offline
- fire a manzil:lodge event when a card lodges (side, slot, card id) so the app can tap a light haptic on every placement; check FOR-DESIGN-WHAT-CODE-OWNS.md first, _commitPlace may be on the contested list, in which case it is a work order
- the moving road (MANZIL-EXPLAINED.md part two, "the first thing to build"): build it in research/manzil-engine-current.cjs only, behind a flag, and measure it against the bands the way the station laws were measured (is the opening still solved, does the board stop narrowing, seat advantage); numbers in the merge body, no client change until Justin reads them
- Suzaku's grant: still the known-broken quadrant grant (CLAUDE.md); the two candidates are in research/suzvec.js; measure both on the canonical engine and propose one as a question
- production API: the app points at api.staging.starshard.net (app/app.config.json); when Justin stands up api.starshard.net, switch it, and make the server's APP_ORIGINS check cover both
