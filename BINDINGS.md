# Template bindings — the Design/Code contract

Every name the markup reads out of `renderVals()`.

**Generated — do not hand-edit.** Regenerate with `npm run bindings`
after every Claude Design handoff.

**349 bindings, 140 top-level.**

## Rule

If Claude Design renames a binding in the markup, Claude Code renames it in
`renderVals()` — and vice versa. A mismatch renders a literal `{{ name }}` on
the page. `npm run bindings` fails on any mismatch, so run it before merging.

## Window bundles

Each is `windows.js` → `createWindowOps().winVals(key)`, returning
`{ show, x, y, z, w, h, tbBg, resize, focus, drag, minimize, close }`.

| binding | window key |
|---|---|
| `wAccount` | `account` |
| `wCard` | `card` |
| `wDoc` | `doc` |
| `wDuet` | `duet` |
| `wGloss` | `gloss` |
| `wGuest` | `guest` |
| `wLuna` | `luna` |
| `wPlayer` | `player` |
| `wReader` | `reader` |
| `wSky` | `sky` |
| `wToday` | `today` |
| `wWelcome` | `welcome` |
| `wWheel` | `wheel` |

## Loop aliases

| `sc-for` list | alias | properties read |
|---|---|---|
| `cityResults` | `r` | `coords`, `name`, `pick`, `region` |
| `cuspRows` | `cr` | `num`, `value` |
| `dResults` | `r` | `coords`, `name`, `pick`, `region` |
| `deskIcons` | `ic` | `icon`, `label`, `onClick` |
| `duetLines` | `dl` | — |
| `glossary` | `gl` | `body`, `title` |
| `guestEntries` | `ge` | `date`, `msg`, `name`, `stamp` |
| `miniShards` | `m` | `border`, `color`, `label`, `value` |
| `placementRows` | `pr` | `label`, `value` |
| `shards` | `s` | `body`, `file`, `gem`, `headline`, `hidden`, `onReveal`, `revealed`, `status`, `title`, `titleColor`, `tradition` |
| `stampOptions` | `st` | `bc`, `bg`, `pick`, `t` |
| `startItems` | `si` | `icon`, `label`, `onClick` |
| `taskItems` | `t` | `bc`, `bg`, `icon`, `label`, `onClick`, `x1`, `x2`, `y1`, `y2` |
| `wheelCusps` | `c2` | `color`, `num`, `nx`, `ny`, `wdt`, `x1`, `x2`, `y1`, `y2` |
| `wheelGlyphs` | `g2` | `t`, `x`, `y` |
| `wheelPlanets` | `p2` | `c`, `t`, `x`, `y` |
| `wheelTicks` | `t` | `bc`, `bg`, `icon`, `label`, `onClick`, `x1`, `x2`, `y1`, `y2` |

## Scalars and callbacks

| binding | produced by |
|---|---|
| `aEmail` | component state |
| `aPassword` | component state |
| `accountStatusLabel` | component state |
| `allRevealed` | reading.js |
| `authEmail` | component state |
| `authError` | api.js |
| `authInfo` | component state |
| `authSubmit` | api.js |
| `authSubmitLabel` | component state |
| `authSwitchLabel` | component state |
| `backToLogin` | component state |
| `chartLine` | astro.js |
| `cityResults` | api.js |
| `clock` | component state |
| `cuspRows` | format.js + astro.js |
| `dDate` | component state |
| `dError` | component state |
| `dHasPlace` | component state |
| `dHasResults` | component state |
| `dName` | component state |
| `dPlaceLine` | component state |
| `dQuery` | component state |
| `dQueryKey` | component state |
| `dResults` | api.js |
| `dSearchLabel` | component state |
| `dTime` | component state |
| `deskIcons` | windows.js |
| `discAnim` | component state |
| `doCompute` | astro.js + tz.js |
| `doDSearch` | api.js |
| `doDuet` | reading.js |
| `doLogout` | api.js |
| `doSearch` | api.js |
| `doWeave` | reading.js |
| `duetBtnLabel` | component state |
| `duetLines` | reading.js |
| `duetPairTitle` | reading.js |
| `duetScoreStr` | reading.js |
| `duetText` | reading.js |
| `fDate` | component state |
| `fLat` | component state |
| `fLon` | component state |
| `fName` | component state |
| `fQuery` | component state |
| `fTime` | component state |
| `fTz` | component state |
| `formError` | component state |
| `gError` | component state |
| `gMsg` | component state |
| `gName` | component state |
| `gSubmitLabel` | component state |
| `glossary` | duet.js |
| `goToForgot` | component state |
| `guestEntries` | duet.js |
| `hasChart` | component state |
| `hasDuet` | component state |
| `hasPlace` | component state |
| `hasResults` | component state |
| `isForgot` | component state |
| `isLoggedIn` | component state |
| `isLoggedOut` | component state |
| `isLogin` | component state |
| `isReset` | component state |
| `isSignup` | component state |
| `manualMode` | component state |
| `manualToggleLabel` | component state |
| `miniShards` | astro.js + shards.js |
| `noChart` | component state |
| `notManual` | component state |
| `offsetLine` | format.js |
| `openAccount` | windows.js |
| `openDoc` | windows.js |
| `openReader` | windows.js |
| `openWheel` | windows.js |
| `placeLine` | format.js |
| `placementRows` | format.js + astro.js |
| `playLabel` | component state |
| `queryKey` | component state |
| `rPassword` | component state |
| `rPassword2` | component state |
| `restart` | component state |
| `revealHint` | component state |
| `revealTitle` | component state |
| `savePng` | card.js |
| `scanlinesOn` | component state |
| `searchLabel` | component state |
| `setAEmail` | component state |
| `setAPassword` | component state |
| `setDDate` | component state |
| `setDName` | component state |
| `setDQuery` | component state |
| `setDTime` | component state |
| `setDate` | component state |
| `setGMsg` | component state |
| `setGName` | component state |
| `setLat` | component state |
| `setLon` | component state |
| `setName` | component state |
| `setQuery` | component state |
| `setRPassword` | component state |
| `setRPassword2` | component state |
| `setTime` | component state |
| `setTz` | component state |
| `shards` | reading.js |
| `shareBirthLine` | format.js |
| `shareName` | component state |
| `signGuestbook` | component state |
| `sparklesOn` | component state |
| `stampOptions` | component state |
| `startItems` | windows.js |
| `startOpen` | component state |
| `taskItems` | windows.js |
| `todayDate` | component state |
| `todayForecast` | shards.js |
| `todayMansion` | shards.js |
| `todayMeaning` | shards.js |
| `todayMoonSign` | astro.js |
| `toggleAuthMode` | component state |
| `toggleManual` | component state |
| `togglePlay` | component state |
| `toggleStart` | component state |
| `weaveLabel` | component state |
| `weaveText` | reading.js |
| `wheelCusps` | wheel.js |
| `wheelGlyphs` | wheel.js |
| `wheelPlanets` | wheel.js |
| `wheelTicks` | wheel.js |
