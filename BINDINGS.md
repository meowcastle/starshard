# Template bindings — the Design/Code contract

Every name the markup reads out of `renderVals()`.

**Generated — do not hand-edit.** Regenerate with `npm run bindings`
after every Claude Design handoff.

**205 bindings, 175 top-level.**

## Rule

If Claude Design renames a binding in the markup, Claude Code renames it in
`renderVals()` — and vice versa. A mismatch renders a literal `{{ name }}` on
the page. `npm run bindings` fails on any mismatch, so run it before merging.

## Window bundles

Each is `windows.js` → `createWindowOps().winVals(key)`, returning
`{ show, x, y, z, w, h, tbBg, resize, focus, drag, minimize, close }`.

| binding | window key |
|---|---|

## Loop aliases

| `sc-for` list | alias | properties read |
|---|---|---|
| `ringMarks` | `m` | `cls`, `cx`, `cy` |
| `ringSegments` | `seg` | `cls`, `d` |
| `ringTicks` | `t` | `x1`, `x2`, `y1`, `y2` |
| `sigAspects` | `asp` | `aspect`, `hasPassage`, `maxOrb`, `missing`, `missingIf`, `orbUsed`, `pair`, `plain`, `text` |
| `sigCityResults` | `r` | `name`, `pick`, `region` |
| `sigComputeLines` | `cl` | `color`, `text` |
| `sigHousePlacements` | `p` | `label`, `number`, `text`, `which` |
| `sndCrossCultural` | `c` | `name`, `sky` |

## Scalars and callbacks

| binding | produced by |
|---|---|
| `aEmail` | component state |
| `aPassword` | component state |
| `authBusy` | component state |
| `authEmail` | component state |
| `authError` | api.js |
| `authSubmit` | api.js |
| `authSubmitLabel` | component state |
| `authSwitchLabel` | component state |
| `authSwitchMode` | component state |
| `doLogout` | api.js |
| `isLoggedIn` | component state |
| `isNotLoggedIn` | component state |
| `ringMarks` | component state |
| `ringSegments` | component state |
| `ringTicks` | component state |
| `setAEmail` | component state |
| `setAPassword` | component state |
| `sigAdvanceArrival` | component state |
| `sigAlreadyWalkedTonight` | component state |
| `sigAnsweringLine` | component state |
| `sigAspectNoneText` | component state |
| `sigAspects` | component state |
| `sigAuthOpen` | component state |
| `sigAuthToggleLabel` | component state |
| `sigBackToHow` | component state |
| `sigBackToStory` | component state |
| `sigBecomingEpithet` | component state |
| `sigBecomingLine` | component state |
| `sigBecomingRegister` | component state |
| `sigBurst1` | component state |
| `sigBurst2` | component state |
| `sigBurst3` | component state |
| `sigBurstTap` | component state |
| `sigCanWalkTonight` | component state |
| `sigCityResults` | component state |
| `sigCloseShare` | component state |
| `sigComputeLines` | component state |
| `sigCountdown` | component state |
| `sigDate` | component state |
| `sigFacingLine` | component state |
| `sigFormError` | component state |
| `sigGaitLine` | component state |
| `sigGaitPermission` | component state |
| `sigGaitTypeLabel` | component state |
| `sigGlowLine` | component state |
| `sigHandLine` | component state |
| `sigHasBecoming` | component state |
| `sigHasCountdown` | component state |
| `sigHasFacing` | component state |
| `sigHasResults` | component state |
| `sigHdrFacing` | component state |
| `sigHdrGlow` | component state |
| `sigHdrHand` | component state |
| `sigHdrRoot` | component state |
| `sigHdrStrike` | component state |
| `sigHouseEmptyNote` | component state |
| `sigHousePlacements` | component state |
| `sigHousePorphyryNote` | component state |
| `sigIsBurst` | component state |
| `sigIsEntry` | component state |
| `sigIsFalling` | component state |
| `sigIsHow` | component state |
| `sigIsNewborn` | component state |
| `sigIsPorphyry` | component state |
| `sigIsProfile` | component state |
| `sigIsPush` | component state |
| `sigIsShare` | component state |
| `sigIsStory` | component state |
| `sigIsTonight` | component state |
| `sigLat` | component state |
| `sigLon` | component state |
| `sigManualMode` | component state |
| `sigManualToggleLabel` | component state |
| `sigName` | component state |
| `sigNoAspects` | component state |
| `sigNotManualMode` | component state |
| `sigNotNewborn` | component state |
| `sigOpenPush` | component state |
| `sigOpenShare` | component state |
| `sigProfileName` | component state |
| `sigPushAllow` | component state |
| `sigPushDismiss` | component state |
| `sigQuery` | component state |
| `sigRootEpithet` | component state |
| `sigRootHasStep` | component state |
| `sigRootLine` | component state |
| `sigRootStepName` | component state |
| `sigScanlines` | component state |
| `sigSearch` | component state |
| `sigSearchLabel` | component state |
| `sigSetDate` | component state |
| `sigSetLat` | component state |
| `sigSetLon` | component state |
| `sigSetName` | component state |
| `sigSetQuery` | component state |
| `sigSetTime` | component state |
| `sigSetTz` | component state |
| `sigShareStat` | component state |
| `sigShowCountdown` | component state |
| `sigShowPushPrompt` | component state |
| `sigSkipArrival` | component state |
| `sigSkyRef` | component state |
| `sigStory1` | component state |
| `sigStory2` | component state |
| `sigStory3` | component state |
| `sigStory4` | component state |
| `sigStrangeLine` | component state |
| `sigStrikeBody` | component state |
| `sigStrikeEpithet` | component state |
| `sigStrikeHeadline` | component state |
| `sigStrikeStepName` | component state |
| `sigSubmit` | component state |
| `sigTabBecoming` | component state |
| `sigTabBecomingOn` | component state |
| `sigTabDepth` | component state |
| `sigTabDepthOn` | component state |
| `sigTabHouses` | component state |
| `sigTabHousesOn` | component state |
| `sigTabPattern` | component state |
| `sigTabPatternOn` | component state |
| `sigTabShard` | component state |
| `sigTabShardOn` | component state |
| `sigTabToBecoming` | component state |
| `sigTabToDepth` | component state |
| `sigTabToHouses` | component state |
| `sigTabToPattern` | component state |
| `sigTabToShard` | component state |
| `sigTime` | component state |
| `sigTimeKnown` | component state |
| `sigTimeToggleLabel` | component state |
| `sigToChart` | component state |
| `sigToTonight` | component state |
| `sigToggleAuth` | component state |
| `sigToggleManual` | component state |
| `sigToggleTime` | component state |
| `sigTypeRateLine` | component state |
| `sigTz` | component state |
| `sigViewIsTonight` | component state |
| `sigViewIsWeek` | component state |
| `sigViewTonight` | component state |
| `sigViewTonightOn` | component state |
| `sigViewWeek` | component state |
| `sigViewWeekOn` | component state |
| `sigWalkTonight` | component state |
| `sigWalkedLabel` | component state |
| `sndBecomingEpithet` | component state |
| `sndBecomingStepName` | component state |
| `sndCastFlavor` | component state |
| `sndCastKindLabel` | component state |
| `sndClaim` | component state |
| `sndClaimEpithet` | component state |
| `sndClaimLabel` | component state |
| `sndClaimStepName` | component state |
| `sndClaiming` | component state |
| `sndCloseLine` | component state |
| `sndCounselBody` | component state |
| `sndCrossCultural` | component state |
| `sndHasBecoming` | component state |
| `sndIsBeat0` | component state |
| `sndIsBeat1` | component state |
| `sndIsBeat2` | component state |
| `sndIsBeat3` | component state |
| `sndIsBeat4` | component state |
| `sndNext` | component state |
| `sndNowEpithet` | component state |
| `sndNowStepName` | component state |
| `sndPips` | component state |
| `sndQuestion` | component state |
| `sndRelational` | component state |
| `sndStationEpithet` | component state |
| `sndStationKanji` | component state |
| `sndStepName` | component state |
| `sndToChart` | component state |
| `sndToProfile` | component state |
| `sndToShare` | component state |
