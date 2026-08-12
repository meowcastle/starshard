# Template bindings — the Design/Code contract

Every name the markup reads out of `renderVals()`.

**Generated — do not hand-edit.** Regenerate with `npm run bindings`
after every Claude Design handoff.

**472 bindings, 243 top-level.**

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
| `pBurstBits` | `b` | `c`, `d`, `fs`, `t`, `tx`, `ty` |
| `pCityResults` | `r` | `coords`, `name`, `pick`, `region` |
| `pDeck` | `d` | `bg`, `border`, `cursor`, `numeral`, `onClick`, `sub` |
| `pPips` | `p` | `glyph`, `text`, `value` |
| `pReadingParas` | `p` | `glyph`, `text`, `value` |
| `pShards` | `s` | `body`, `cursor`, `displayTitle`, `file`, `gem`, `headline`, `hidden`, `kind`, `label`, `onReveal`, `revealed`, `size`, `status`, `title`, `titleColor`, `tradition` |
| `placementRows` | `pr` | `label`, `value` |
| `shards` | `s` | `body`, `cursor`, `displayTitle`, `file`, `gem`, `headline`, `hidden`, `kind`, `label`, `onReveal`, `revealed`, `size`, `status`, `title`, `titleColor`, `tradition` |
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
| `claimToday` | component state |
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
| `hourAvailable` | component state |
| `hourCurrentPlanet` | component state |
| `hourPlaceLabel` | component state |
| `isDesktop` | component state |
| `isForgot` | component state |
| `isLoggedIn` | component state |
| `isLoggedOut` | component state |
| `isLogin` | component state |
| `isPhone` | component state |
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
| `pAdvance` | component state |
| `pBurstBits` | component state |
| `pCardNumeral` | component state |
| `pCityResults` | component state |
| `pCtaDisabled` | component state |
| `pCtaLabel` | component state |
| `pDate` | component state |
| `pDeck` | component state |
| `pDeckCount` | component state |
| `pDoSearch` | component state |
| `pDuetBody` | component state |
| `pFormError` | component state |
| `pFriendDate` | component state |
| `pFriendLabel` | component state |
| `pFriendMansion` | component state |
| `pFriendName` | component state |
| `pFriendNumeral` | component state |
| `pGoAccount` | component state |
| `pGoBack` | component state |
| `pGoDuet` | component state |
| `pHasDuet` | component state |
| `pHasPlace` | component state |
| `pHasResults` | component state |
| `pHourAvailable` | component state |
| `pHourCurrentPlanet` | component state |
| `pHourPlaceLabel` | component state |
| `pIntroBurst` | component state |
| `pIntroCharge` | component state |
| `pIntroOpacity` | component state |
| `pIntroPrompt` | component state |
| `pIntroShow` | component state |
| `pIsAccount` | component state |
| `pIsCard` | component state |
| `pIsCollection` | component state |
| `pIsDuet` | component state |
| `pIsForm` | component state |
| `pIsLanding` | component state |
| `pIsShards` | component state |
| `pIsShatter` | component state |
| `pLat` | component state |
| `pLon` | component state |
| `pMansionEpithet` | component state |
| `pMansionName` | component state |
| `pManualMode` | component state |
| `pManualToggleLabel` | component state |
| `pName` | component state |
| `pNotManual` | component state |
| `pOffsetLine` | component state |
| `pPips` | component state |
| `pPlaceLine` | component state |
| `pQuery` | component state |
| `pQueryKey` | component state |
| `pReadingLabel` | component state |
| `pReadingParas` | component state |
| `pRevealLabel` | component state |
| `pSaveCard` | component state |
| `pSearchLabel` | component state |
| `pSetDate` | component state |
| `pSetFriendDate` | component state |
| `pSetFriendName` | component state |
| `pSetLat` | component state |
| `pSetLon` | component state |
| `pSetName` | component state |
| `pSetQuery` | component state |
| `pSetTime` | component state |
| `pSetTz` | component state |
| `pShardAnim` | component state |
| `pShardClick` | component state |
| `pShardFilter` | component state |
| `pShardVisible` | component state |
| `pShards` | component state |
| `pShatterNote` | component state |
| `pShowBack` | component state |
| `pShowCta` | component state |
| `pTime` | component state |
| `pTimeKnown` | component state |
| `pTimeUnknown` | component state |
| `pTodayBody` | component state |
| `pTodayDate` | component state |
| `pTodayMansion` | component state |
| `pTodayPhaseLine` | component state |
| `pTodayTaraLine` | component state |
| `pTodayTaraName` | component state |
| `pToggleManual` | component state |
| `pToggleTime` | component state |
| `pTz` | component state |
| `pTzNote` | component state |
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
| `todayAlreadyCollected` | component state |
| `todayClaimBg` | component state |
| `todayClaimColor` | component state |
| `todayClaimLabel` | component state |
| `todayDate` | component state |
| `todayFoil` | component state |
| `todayFoilReason` | component state |
| `todayForecast` | shards.js |
| `todayMansion` | shards.js |
| `todayMeaning` | shards.js |
| `todayMoonSign` | astro.js |
| `todayNotCollected` | component state |
| `todayPhaseLine` | component state |
| `todayTaraLine` | component state |
| `todayTaraName` | component state |
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
