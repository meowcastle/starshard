# Template bindings — the Design/Code contract

Every name the markup reads out of `renderVals()`.

**Generated — do not hand-edit.** Regenerate with `npm run bindings`
after every Claude Design handoff.

**284 bindings, 235 top-level.**

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
| `angleLabels` | `g` | `d`, `fill`, `t`, `tf`, `x`, `y` |
| `angleLines` | `t` | `meaning`, `name`, `sky`, `x1`, `x2`, `y1`, `y2` |
| `aspectRows` | `row` | `name`, `nameColor`, `num`, `numColor`, `onTap`, `sign`, `style`, `t`, `trail` |
| `cdParas` | `p` | `d`, `name`, `onTap`, `pos`, `t` |
| `chartRing` | `seg` | `color`, `d`, `w` |
| `hitArcs` | `h` | `d`, `onTap` |
| `houseLines` | `t` | `meaning`, `name`, `sky`, `x1`, `x2`, `y1`, `y2` |
| `houseNums` | `g` | `d`, `fill`, `t`, `tf`, `x`, `y` |
| `mNums` | `g` | `d`, `fill`, `t`, `tf`, `x`, `y` |
| `mSelBodies` | `b` | `name`, `pos` |
| `mTicks` | `t` | `meaning`, `name`, `sky`, `x1`, `x2`, `y1`, `y2` |
| `moonPTraditions` | `t` | `meaning`, `name`, `sky`, `x1`, `x2`, `y1`, `y2` |
| `obCastLines` | `l` | `style`, `t` |
| `obCastSegs` | `seg` | `color`, `d`, `w` |
| `obDayOptions` | `o` | `label`, `value` |
| `obHourOptions` | `o` | `label`, `value` |
| `obMinuteOptions` | `o` | `label`, `value` |
| `obMonthOptions` | `o` | `label`, `value` |
| `obRingSegs` | `seg` | `color`, `d`, `w` |
| `obYearOptions` | `o` | `label`, `value` |
| `planetRows` | `p` | `d`, `name`, `onTap`, `pos`, `t` |
| `sRingMarks` | `m` | `color`, `cx`, `cy`, `d`, `fill`, `onTap`, `r`, `stroke`, `tf` |
| `sRingSegs` | `seg` | `color`, `d`, `w` |
| `sRingTicks` | `t` | `meaning`, `name`, `sky`, `x1`, `x2`, `y1`, `y2` |
| `signGlyphs` | `g` | `d`, `fill`, `t`, `tf`, `x`, `y` |
| `signLines` | `t` | `meaning`, `name`, `sky`, `x1`, `x2`, `y1`, `y2` |
| `stationRows` | `row` | `name`, `nameColor`, `num`, `numColor`, `onTap`, `sign`, `style`, `t`, `trail` |
| `sunPTraditions` | `t` | `meaning`, `name`, `sky`, `x1`, `x2`, `y1`, `y2` |
| `tRingSegs` | `seg` | `color`, `d`, `w` |
| `weekParas` | `p` | `d`, `name`, `onTap`, `pos`, `t` |
| `weekRows` | `row` | `name`, `nameColor`, `num`, `numColor`, `onTap`, `sign`, `style`, `t`, `trail` |
| `wheelMarks` | `m` | `color`, `cx`, `cy`, `d`, `fill`, `onTap`, `r`, `stroke`, `tf` |

## Scalars and callbacks

| binding | produced by |
|---|---|
| `accountOn` | component state |
| `acctAskOn` | component state |
| `acctDone` | component state |
| `acctEmailVal` | component state |
| `acctSend` | component state |
| `acctSendStyle` | component state |
| `acctSentOn` | component state |
| `acctSetEmail` | component state |
| `acctSkip` | component state |
| `addTime` | component state |
| `angleLabels` | component state |
| `angleLines` | component state |
| `archPushed` | component state |
| `askLoc` | component state |
| `aspectRows` | component state |
| `becomingPara1` | component state |
| `becomingPara2` | component state |
| `becomingSub` | component state |
| `cRingWrapStyle` | component state |
| `castChart` | component state |
| `cdAsc` | component state |
| `cdMName` | component state |
| `cdMOn` | component state |
| `cdMOrd` | component state |
| `cdMText` | component state |
| `cdMc` | component state |
| `cdMoon` | component state |
| `cdOn` | component state |
| `cdParas` | component state |
| `cdSub` | component state |
| `cdSun` | component state |
| `cdTitle` | component state |
| `cdVenus` | component state |
| `chartAscLine` | component state |
| `chartHeaderLine` | component state |
| `chartMcLine` | component state |
| `chartMoonLine` | component state |
| `chartRing` | component state |
| `chartRulerLine` | component state |
| `chartRulerName` | component state |
| `chartSunLine` | component state |
| `comboCost` | component state |
| `comboLead` | component state |
| `comboMoon` | component state |
| `comboPull` | component state |
| `comboReady` | component state |
| `comboSun` | component state |
| `comboTension` | component state |
| `farlightN` | component state |
| `farlightText` | component state |
| `frameScaleStyle` | component state |
| `gameNightOn` | component state |
| `gamePushed` | component state |
| `hitArcs` | component state |
| `houseLines` | component state |
| `houseNums` | component state |
| `housesSystemLabel` | component state |
| `isWalked` | component state |
| `litCount` | component state |
| `locIdle` | component state |
| `locLoading` | component state |
| `locOff` | component state |
| `locOn` | component state |
| `mNums` | component state |
| `mSelBodies` | component state |
| `mSelEmpty` | component state |
| `mSelHasBodies` | component state |
| `mSelLine` | component state |
| `mSelName` | component state |
| `mSelOn` | component state |
| `mSelOrd` | component state |
| `mSelOwn` | component state |
| `mSelOwnOn` | component state |
| `mSelSpan` | component state |
| `mTicks` | component state |
| `mcPara` | component state |
| `mcPushed` | component state |
| `mcSubLine` | component state |
| `moonHouseText` | component state |
| `moonPElection` | component state |
| `moonPKanji` | component state |
| `moonPName` | component state |
| `moonPOn` | component state |
| `moonPOpening` | component state |
| `moonPOwnLine` | component state |
| `moonPSpan` | component state |
| `moonPStars` | component state |
| `moonPSynthesis` | component state |
| `moonPTraditions` | component state |
| `navOn` | component state |
| `nightDate` | component state |
| `nightMeta` | component state |
| `nightName` | component state |
| `nightPushed` | component state |
| `nightSpecial` | component state |
| `nightSpecialLabel` | component state |
| `nightText` | component state |
| `notWalked` | component state |
| `numLiveLine` | component state |
| `numMoonLine` | component state |
| `numNextLine` | component state |
| `numbersChevron` | component state |
| `numbersOpen` | component state |
| `obCastLines` | component state |
| `obCastSegs` | component state |
| `obCastStyle` | component state |
| `obCastingOn` | component state |
| `obChevronStyle` | component state |
| `obDateDVal` | component state |
| `obDateMVal` | component state |
| `obDateYVal` | component state |
| `obDayOptions` | component state |
| `obError` | component state |
| `obErrorOn` | component state |
| `obFormOn` | component state |
| `obHourOptions` | component state |
| `obLatVal` | component state |
| `obLonVal` | component state |
| `obManualOff` | component state |
| `obManualOn` | component state |
| `obManualToggleLabel` | component state |
| `obMinuteOptions` | component state |
| `obMonthOptions` | component state |
| `obPlaceVal` | component state |
| `obRingCount` | component state |
| `obRingSegs` | component state |
| `obSelectStyle` | component state |
| `obSetDateD` | component state |
| `obSetDateM` | component state |
| `obSetDateY` | component state |
| `obSetLat` | component state |
| `obSetLon` | component state |
| `obSetPlace` | component state |
| `obSetTimeAP` | component state |
| `obSetTimeH` | component state |
| `obSetTimeMin` | component state |
| `obSetTz` | component state |
| `obTimeAPVal` | component state |
| `obTimeHVal` | component state |
| `obTimeMark` | component state |
| `obTimeMinVal` | component state |
| `obTimeSelectDisabled` | component state |
| `obTimeSelectStyle` | component state |
| `obTimeStyle` | component state |
| `obToggleManual` | component state |
| `obToggleTime` | component state |
| `obTzVal` | component state |
| `obYearOptions` | component state |
| `onChart` | component state |
| `onShard` | component state |
| `onTonight` | component state |
| `onboardOn` | component state |
| `ownIt` | component state |
| `payOn` | component state |
| `planetRows` | component state |
| `popArch` | component state |
| `popCD` | component state |
| `popGame` | component state |
| `popMC` | component state |
| `popNight` | component state |
| `pushArch` | component state |
| `pushGame` | component state |
| `pushMC` | component state |
| `remindLabel` | component state |
| `remindStyle` | component state |
| `rulerHouseText` | component state |
| `sChordD` | component state |
| `sChordStyle` | component state |
| `sRingMarks` | component state |
| `sRingSegs` | component state |
| `sRingTicks` | component state |
| `segTonightStyle` | component state |
| `segWeekStyle` | component state |
| `selLabel` | component state |
| `shardHeroAddress` | component state |
| `shardHeroInnerStyle` | component state |
| `shardHeroName` | component state |
| `shardHeroStyle` | component state |
| `shardHeroSuffix` | component state |
| `shardHeroSuffixOn` | component state |
| `shardMetaLine1` | component state |
| `shardMetaLine2` | component state |
| `shardScroll` | component state |
| `shareLabel` | component state |
| `shareTap` | component state |
| `showTonightView` | component state |
| `showWeekView` | component state |
| `sigFindingNone` | component state |
| `sigFindingReady` | component state |
| `sigHeadline` | component state |
| `sigRateLabel` | component state |
| `sigSubLine` | component state |
| `signGlyphs` | component state |
| `signLines` | component state |
| `starfieldOn` | component state |
| `stationRows` | component state |
| `sunHouseText` | component state |
| `sunPElection` | component state |
| `sunPKanji` | component state |
| `sunPName` | component state |
| `sunPOn` | component state |
| `sunPOpening` | component state |
| `sunPOwnLine` | component state |
| `sunPSpan` | component state |
| `sunPStars` | component state |
| `sunPSynthesis` | component state |
| `sunPTraditions` | component state |
| `tRingSegs` | component state |
| `tRingWrapStyle` | component state |
| `tabChart` | component state |
| `tabChartStyle` | component state |
| `tabShard` | component state |
| `tabShardStyle` | component state |
| `tabTonight` | component state |
| `tabTonightStyle` | component state |
| `timeOff` | component state |
| `toTonightView` | component state |
| `toWeekView` | component state |
| `toggleNumbers` | component state |
| `toggleRemind` | component state |
| `tonightDateLine` | component state |
| `tonightLitLine` | component state |
| `tonightNextLine` | component state |
| `tonightPara1` | component state |
| `tonightPara2` | component state |
| `tonightRingLabel` | component state |
| `tonightSegD` | component state |
| `tonightStationName` | component state |
| `tonightStationOrd` | component state |
| `walk` | component state |
| `walkBurstOn` | component state |
| `walkSweepOn` | component state |
| `weekParas` | component state |
| `weekRows` | component state |
| `wheelMarks` | component state |
