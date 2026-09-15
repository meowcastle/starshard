// MANZIL · THE COPY TABLE + THE TIMING TABLE · 15 Sep 2026 · Design → Code · STATUS: FINAL (user signed off 15 Sep; item 6 of FOR-CODE-THE-FLOW done)
// Every sentence the runtime says, keyed by moment and reason (DESIGN-PACK-15SEP part one §6, part two §4).
// Code substitutes the placeholders; Design owns the strings and the timings. Import COPY and TIMING; TABLE is the
// review view (now / proposed / note) the directions sheet reads and is not needed at runtime.
// Rules every row follows: lower case, second person, no dashes, no caps, no letterspacing, glossary words only
// (road · rung · station · house · crossing · door · seat · count · dominion · dawn · light · law · ground).

export const PLACEHOLDERS = {
  "{walker}": "the walker on this rung, by name (hult)",
  "{next}": "the next walker on the road, by name (bekk)",
  "{them}": "the walker's object pronoun: him · her · them (roster data; new, needed by the loss line)",
  "{you}": "your total for the line it sits in, in words (six). on the stations line it is your station count; on the total line your board total",
  "{sky}": "her total for the same line, in words (seven)",
  "{n}": "a small count in words where a line needs one (two)",
  "{nth}": "an ordinal in words (first · second · third)",
  "{rung}": "the rung as an ordinal in words (fifth)",
  "{lights}": "the lights sentence, itself a row of this table (road.lights.*)",
  "{series}": "the series standing, itself a row of this table (play.series.*)",
  "{law}": "tonight's law: its name and one sentence, from the tonight record (the price. a card at the middle that cannot be taken strikes two lower.) (new)",
  "{house}": "a house by its name, never its number (the heart)",
  "{station}": "a station's card name or place name (the glance · the crossing)",
  "{quadrant}": "a quadrant in its english name only (vermilion bird)",
  "{planet}": "a planet in words (mercury)",
  "{aspect}": "a natal aspect in plain words, from surfaces.aspect.* (two signs on)",
  "{a} {b}": "two printed totals at a dawn pairing (12, 11)",
  "{w} {l}": "boards won and lost, as numerals",
  "{yours} {hers}": "boards won in the open series, in words (one, none)",
  "{awake}": "cards at level two or higher, in words",
  "{card}": "a card by its name (the blaze)",
  "{does}": "what the card does on the road, from card data (marks one enemy card beside it two lower)",
  "{reason}": "the verdict's second sentence, itself a row of this table (verdict.reason.*)",
  "{defender}": "the player who played second on this board: you, or the walker's name",
  "{law_effect}": "what the law did to the count, from the settle record's law entry",
  "{planet2}": "the aspecting planet in words (mars)",
  "{tara} {tara_gloss} {tara_line}": "the tārābala name, its gloss and its line, from the birth record (vipat · the first dark · the full light is out…)",
};
// RESOLUTION RULES: rows that carry another row ({lights} {series} {reason}) resolve the inner row first. A row that
// resolves to an empty string is dropped and the surrounding whitespace trimmed (lobby.standing outside a series).

// moment · key · now (as played on staging 14 Sep) · proposed · note (flag: review = user decision pending; new = placeholder or row that did not exist)
export const TABLE = [
  // ─── the deal: say the seat and the law ───
  { m: "deal", k: "seat.you", now: "◆ the last word is yours (flips each turn)", p: "you lead · the last word is yours", note: "static for the board; the turn cue is the lamp and the hand, never this line" },
  { m: "deal", k: "seat.sky", now: "the last word is hers (as a turn cue)", p: "{walker} leads · the last word is hers", note: "you lead the first board of every walker rung; inside a series the loser leads, so this fires from the fifth rung up whenever you won the board before, and on the mansion's opening board" },
  { m: "deal", k: "law", now: "(nothing at the deal)", p: "tonight: {law}", note: "under the scene name, stays for the board; the same string on the marker's hover", flag: "new" },
  { m: "deal", k: "law.none", now: "(nothing)", p: "tonight the road keeps its own rules.", note: "practice, duels, table nights, law-free nights" },
  { m: "deal", k: "hand.seven", now: "play these seven", p: "play these seven", note: "kept" },
  { m: "deal", k: "hand.six", now: "shuffle once, take six", p: "six: a fresh hand, and one card held at dawn instead of two", note: "the cost of six in words; it is a real decision, not a reroll" },
  { m: "deal", k: "dawn.first", now: "(nothing)", p: "at dawn the held cards fight: hold something worth holding.", note: "once, the first night dawn is live for this player", flag: "new" },
  { m: "deal", k: "series.open", now: "(three unlabeled diamonds)", p: "best of three · first to two", note: "under the pips at the deal of board one; the pips stay (user, 15 sep)" },
  { m: "deal", k: "awake", now: "(a clause on 54 walker intros: 'she gives nothing away twice, and holds your cards awake' / 'the hand is yours, every card of it awake')", p: "{walker} holds your hand awake: every card of yours that is awake stands awake with {them}.", note: "the road-becomes-you canon, said ONCE at the deal of the seventh and eighth rungs. PRONOUN: this row has now shipped twice as 'in hers' and been corrected twice — the eighth-rung walker is the quiet one, who the sheet gives `them` on 21 of 27 houses, so a fixed pronoun is wrong on most eighth rungs. {them} is roster data and exists for exactly this. Please carry the fix back into Design's master.", flag: "new" },

  // ─── the turn: make the board legible ───
  { m: "play", k: "thinking", now: "bekk is thinking…", p: "{walker} is thinking…", note: "kept" },
  { m: "play", k: "hover.station", now: "mansion 9 / the glance / the branding fire. a card standing on this ground that cannot be taken at all — held by its quarter, by a friend beside it, or by its own rule — strikes two lower from here.", p: "{station} · {quadrant} ground · the ground holds", note: "ground only, on every station; the law leaves the station hover" },
  { m: "play", k: "hover.station.open", now: "(same as above)", p: "{station} · {quadrant} ground · open ground", note: "the 'does not hold' case" },
  { m: "play", k: "hover.marker", now: "(the brazier has no hover)", p: "tonight: {law}", note: "the one place on the road the law lives" },
  { m: "play", k: "hover.card.planet", now: "☿ (glyph only)", p: "your {planet} card", note: "the road's card tooltip says the planet in words" },
  { m: "play", k: "hover.card.does", now: "VERMILION BIRD its strikes carry two stations.", p: "as it lands, {card} {does}.", note: "the card's own road row, same words as the cards screen and the codex; {does} is card data, not this table" },
  { m: "play", k: "series.lead.you", now: "(faded title behind the board)", p: "you lead, {yours} to {hers}", note: "sits under the pips for the whole series" },
  { m: "play", k: "series.lead.sky", now: "hult leads, one to none (faded, behind the board)", p: "{walker} leads, {hers} to {yours}", note: "the right sentence, in the right place" },
  { m: "play", k: "series.even", now: "(nothing)", p: "one board each and the third decides", note: "" },
  { m: "play", k: "series.even.five", now: "(nothing)", p: "two boards each and the fifth decides", note: "the mansion's best of five" },

  // ─── the settle: show the arithmetic ───
  { m: "settle", k: "dawn.head", now: "DAWN · THE HELD CARDS", p: "dawn: the held cards", note: "" },
  { m: "settle", k: "dawn.first", now: "SHE TURNS THE CARD SHE KEPT BACK · YOUR STRONGEST AGAINST HERS", p: "her strongest against yours", note: "" },
  { m: "settle", k: "dawn.next", now: "THE NEXT TWO", p: "the next pair", note: "" },
  { m: "settle", k: "dawn.pair.sky", now: "(caps, gone in a second)", p: "{a} against {b}: hers", note: "one line under each pair, and it stays" },
  { m: "settle", k: "dawn.pair.you", now: "(caps, gone in a second)", p: "{a} against {b}: yours", note: "" },
  { m: "settle", k: "dawn.pair.even", now: "12 AGAINST 12 · EVEN, NOBODY SCORES", p: "{a} against {b}: even", note: "" },
  { m: "settle", k: "dawn.odd.sky", now: "UNOPPOSED · NO ONE LEFT TO MEET IT · NOTHING", p: "her {nth}: nothing to meet it", note: "three phrasings of one fact become one" },
  { m: "settle", k: "dawn.odd.you", now: "(same)", p: "your {nth}: nothing to meet it", note: "" },
  { m: "settle", k: "stations", now: "(the pans move, no caption)", p: "stations · {you} against {sky}", note: "caption one of four on the scales, held until the verdict" },
  { m: "settle", k: "dominion.each", now: "(nothing)", p: "dominion · one each", note: "caption two" },
  { m: "settle", k: "dominion.you", now: "(nothing)", p: "dominion · one to you", note: "" },
  { m: "settle", k: "dominion.sky", now: "(nothing)", p: "dominion · one to her", note: "" },
  { m: "settle", k: "dominion.none", now: "(nothing)", p: "dominion · nobody", note: "" },
  { m: "settle", k: "dawn.sum.sky", now: "(nothing)", p: "dawn · {n} to her", note: "caption three; a pair is one pairing and duel has two, so the caption gives the score, not 'her pair'" },
  { m: "settle", k: "dawn.sum.you", now: "(nothing)", p: "dawn · {n} to you", note: "" },
  { m: "settle", k: "dawn.sum.each", now: "(nothing)", p: "dawn · one each", note: "the count moves, both ways" },
  { m: "settle", k: "dawn.sum.even", now: "(nothing)", p: "dawn · even, nobody scored", note: "the count does not move" },
  { m: "settle", k: "dawn.sum.none", now: "(nothing)", p: "dawn · nothing held", note: "the settle is the same shape on a board with no held cards" },
  { m: "settle", k: "law", now: "(nothing)", p: "the law · {law_effect}", note: "only on boards the law touched the count; {law_effect} comes from the settle record's law entry", flag: "new" },
  { m: "settle", k: "total.you", now: "you win BY THREE", p: "{you} against {sky}. you take the board.", note: "caption four" },
  { m: "settle", k: "total.sky", now: "derev wins BY THREE / hult wins", p: "{you} against {sky}. {walker} takes the board.", note: "" },
  { m: "settle", k: "total.level", now: "(nothing says it)", p: "{you} against {sky}, level. a level board goes to the defender: {defender} takes it.", note: "the one time in ten the draw rule fires, it is seen; {defender} is you or {walker}" },
  { m: "settle", k: "total.level.district", now: "(nothing)", p: "{you} against {sky}, level. on the empty district's floor a level board goes to the one who spoke first: {leader} takes it.", note: "TWO HANDS on m21 ONLY (drawTo:leader in the duel path; the road keeps the defender everywhere). it is the DISTRICT'S line, not the hush's: the veil has the hush too and keeps the defender — do not 'fix' m15 to match. {leader} is a player's name", flag: "new" },

  // ─── the verdict: who took it and why, and what stands ───
  { m: "verdict", k: "reason.stations.you", now: "(nothing)", p: "{you} against {sky}: you held more of the road.", note: "the reason word from the settle record picks one of these; second sentence of every verdict" },
  { m: "verdict", k: "reason.stations.sky", now: "(nothing)", p: "{you} against {sky}: she held more of the road.", note: "" },
  { m: "verdict", k: "reason.dominion.you", now: "(nothing)", p: "{you} against {sky}: the dominion point was yours.", note: "" },
  { m: "verdict", k: "reason.dominion.sky", now: "(nothing)", p: "{you} against {sky}: the dominion point was hers.", note: "" },
  { m: "verdict", k: "reason.dawn.you", now: "(nothing)", p: "{you} against {sky}: your held cards outweighed hers at dawn.", note: "" },
  { m: "verdict", k: "reason.dawn.sky", now: "(nothing)", p: "{you} against {sky}: her held cards outweighed yours at dawn.", note: "" },
  { m: "verdict", k: "reason.law", now: "(nothing)", p: "{you} against {sky}: tonight's law turned the count.", note: "" },
  { m: "verdict", k: "reason.level", now: "(nothing)", p: "{you} against {sky}, level: a level board goes to the defender.", note: "" },
  { m: "verdict", k: "board.you", now: "(a ghost title)", p: "you take the {nth}. {series}.", note: "a board inside a series; button 'the next board'" },
  { m: "verdict", k: "board.sky", now: "hult leads, one to none (ghost)", p: "{walker} takes the {nth}. {series}.", note: "" },
  { m: "verdict", k: "board.next", now: "NEXT BOARD ›", p: "the next board", note: "button" },
  { m: "verdict", k: "rung.won", now: "ori steps aside (over the live board)", p: "{walker} steps aside.", note: "then the walker's own yield line from the roster (tamsin banks the fire and lets you past it.)" },
  { m: "verdict", k: "rung.won.next", now: "NEXT ON THE ROAD / bekk", p: "next on the road: {next}", note: "then the road's line about them, no stats" },
  { m: "verdict", k: "rung.won.go", now: "ON UP THE ROAD ›", p: "on up the road", note: "button; not live until the card has landed" },
  { m: "verdict", k: "rung.lost", now: "the night rests / vipat, the first dark: the full light is out, a crescent and a sliver remain. the same walker stands where you fell, and the road gives its shard regardless.", p: "the night rests. {reason} {lights} {walker} is where you left {them}.", note: "the tārābala line leaves this card and goes to the star shard (user, 15 sep); the moons stay and must agree with {lights}" },
  { m: "verdict", k: "rung.lost.wait", now: "hult stands ready.", p: "{walker} waits.", note: "" },
  { m: "verdict", k: "rung.lost.again", now: "anywhere to deal again", p: "deal again", note: "a button, same words on phone and desktop" },
  { m: "verdict", k: "rung.lost.lobby", now: "lobby", p: "back to the road", note: "" },
  { m: "verdict", k: "climb.wiped", now: "(the three-lives wipe has no card)", p: "the last light is out. the road begins again at the first rung, and the lights are lit. nothing of yours is lost but the climb.", note: "kind = climb ended", flag: "new" },
  { m: "verdict", k: "climb.cleared", now: "(the mansion's own line)", p: "{house} is yours. its piece of the shard comes with it.", note: "after the avatar's yield line; the codex records it", flag: "new" },
  { m: "verdict", k: "climb.go", now: "(varies)", p: "back to the road", note: "button" },

  // ─── the road: altitude and standing ───
  { m: "road", k: "lights.three", now: "(three moons, sometimes disagreeing)", p: "three lights stand.", note: "{lights} resolves to one of these four; the moons show the same number" },
  { m: "road", k: "lights.two", now: "two lights still stand.", p: "two lights stand.", note: "" },
  { m: "road", k: "lights.one", now: "(nothing)", p: "one light stands.", note: "" },
  { m: "road", k: "lights.none", now: "(nothing)", p: "the last light is out.", note: "" },
  { m: "road", k: "lobby.standing", now: "(the road with five platforms and 'the moon road ›')", p: "the {rung} rung. {lights} {series}", note: "under the lobby title; the only sentence that says where the climb stands, moved from the codex", flag: "new" },
  { m: "road", k: "lobby.fresh", now: "(nothing)", p: "the first rung. three lights stand. {walker} is waiting.", note: "no climb yet" },
  { m: "road", k: "lobby.between", now: "(nothing)", p: "the {rung} rung. {lights} {walker} is where you left {them}.", note: "a climb suspended mid-rung, no series open" },
  { m: "road", k: "counter.rung", now: "ONE OF EIGHT DOWN (with eight pips)", p: "", note: "removed; the altitude column carries it" },
  { m: "road", k: "next", now: "NEXT ON THE ROAD", p: "next on the road: {next}", note: "" },
  { m: "road", k: "forfeit", now: "your climb stands unfinished… stay on this road / forfeit and walk", p: "(unchanged)", note: "the model for every destructive confirm" },

  // ─── the surfaces: menus and pages ───
  { m: "surfaces", k: "menu.back", now: "(none; escape then lobby)", p: "back to the road", note: "same place on every sub-screen, under the player's name", flag: "new" },
  { m: "surfaces", k: "menu.logout", now: "log out (on the row, beside level select)", p: "log out", note: "moves under the name; the words stay" },
  { m: "surfaces", k: "codex.title", now: "THE CODEX · 0 OF 28 HOUSES WALKED", p: "the codex", note: "" },
  { m: "surfaces", k: "codex.yours", now: "a climb stands at station 5. nothing woken yet.", p: "a climb stands on the {rung} rung. nothing woken yet.", note: "station is the nine on the road; the climb stands on a rung" },
  { m: "surfaces", k: "codex.yours.awake", now: "(nothing)", p: "a climb stands on the {rung} rung. {awake} cards awake.", note: "" },
  { m: "surfaces", k: "codex.board", now: "a middling board, measured on the plain night. spread 30.", p: "", note: "removed; a Measurement column, not a player fact. ITS ROAD above already gives the ground" },
  { m: "surfaces", k: "codex.law.district.table", now: "(nothing)", p: "at the open tables, on the empty district's floor, a level board goes to the leader.", note: "one clause on m21's codex law row only; the veil keeps the defender everywhere", flag: "new" },
  { m: "surfaces", k: "howto.level.table", now: "(the level rule line: 'a level board goes to the answerer')", p: "at the table on the empty district, a level board goes to the leader.", note: "one clause appended to the how-to-play chapter's level-rule line; the first rule in the game that differs between road and table, so it is said where the rule is taught", flag: "new" },
  { m: "surfaces", k: "codex.tarabala", now: "(was on the loss card)", p: "{tara}, {tara_gloss}: {tara_line}", note: "the tārābala names live here and on the star shard, where a player goes looking (user, 15 sep)" },
  { m: "surfaces", k: "select.house", now: "house 18 of 28", p: "{house}", note: "" },
  { m: "surfaces", k: "select.moon.now", now: "the moon enters the blaze tonight. (on every house)", p: "the moon is in {house} tonight.", note: "only the moon's house" },
  { m: "surfaces", k: "select.moon.next", now: "(nothing)", p: "the moon reaches {house} tomorrow night.", note: "" },
  { m: "surfaces", k: "select.moon.later", now: "arrives in 15 nights", p: "the moon reaches {house} in {n} nights.", note: "" },
  { m: "surfaces", k: "select.law", now: "(no law line on other houses)", p: "its law: {law}", note: "every house on the ring, so a player picking a road sees the rule they are picking", flag: "new" },
  { m: "surfaces", k: "ledger.boards", now: "boards won · lost 20 — 14", p: "boards won {w} · lost {l}", note: "the numbers count up" },
  { m: "surfaces", k: "ledger.soon", now: "more is coming here: most-used card, and how you win.", p: "", note: "removed until it exists" },
  { m: "surfaces", k: "card.natal", now: "your mercury stood in this house the night you were born, and mars stood sextile to it, 4.4° off exact.", p: "your {planet} stood in this house the night you were born, with {planet2} {aspect}.", note: "no degrees, no latin" },
  { m: "surfaces", k: "aspect.conjunct", now: "conjunct", p: "beside it", note: "{aspect} resolves to one of these five" },
  { m: "surfaces", k: "aspect.sextile", now: "sextile", p: "two signs on", note: "" },
  { m: "surfaces", k: "aspect.square", now: "square", p: "three signs on", note: "" },
  { m: "surfaces", k: "aspect.trine", now: "trine", p: "four signs on", note: "" },
  { m: "surfaces", k: "aspect.opposite", now: "opposite", p: "across the sky from it", note: "" },
  { m: "surfaces", k: "quadrant.genbu", now: "genbu · black tortoise · northern", p: "black tortoise · north", note: "one name per quadrant on any surface; the transliterations stay in the glossary as internals" },
  { m: "surfaces", k: "quadrant.byakko", now: "byakko · white tiger · western", p: "white tiger · west", note: "" },
  { m: "surfaces", k: "quadrant.seiryuu", now: "seiryuu · azure dragon · eastern", p: "azure dragon · east", note: "" },
  { m: "surfaces", k: "quadrant.suzaku", now: "suzaku · vermilion bird · southern", p: "vermilion bird · south", note: "" },
  { m: "surfaces", k: "shard.tap", now: "one of 784 · tap to read your sky", p: "tap to read your sky", note: "the 784 is a counter; the archetype name carries the rarity" },
  { m: "surfaces", k: "card.does", now: "(only in the codex)", p: "on the road: {does}", note: "the cards screen gains the row; the same words as the codex and the road tooltip" },
];

// the strings alone, keyed copy[moment][key]; empty strings mean the surface is removed
export const COPY = TABLE.reduce((o, r) => { (o[r.m] = o[r.m] || {})[r.k] = r.p; return o; }, {});

// stage.timing · milliseconds · Design owns this table (DESIGN-PACK part one §2, part three §4)
// ONE SOURCE: the runtime reads these, never a constant beside them. Known duplicates to retire: _exitRound's hard
// 900 floor → stage.timing.verdict.buttonLive; the tooltip's 300 → stage.timing.hover.tooltipDelay.
// rules: no transition passes through black · a screen change is a movement of the scene, eased out, destination laid
// out first · siblings arrive 40–80 apart and settle with a small overshoot · nothing takes over 600 to become usable,
// frequent screens under 400 · hover answers inside 100 · frequency decides ceremony
export const TIMING = {
  settle: { caption: 600, captions: 4, hold: "until the verdict", dawnLand: 300, dawnPair: 500, dawnLine: 250, scalesTilt: 700 },
  verdict: { dim: 250, dimTo: 0.2, arrive: 350, buttonLive: 550, hold: "until tapped", moonsOut: 350, moonsOutGap: 350, moonsDarkLast: true },
  road: { total: 900, dotMove: 400, sceneNameOut: 200, sceneNameIn: 300, birds: "during the climb, not the deal", walkerIn: 300, walkerLine: 400, clickableAfter: "the walker has spoken" },
  deal: { cardStagger: 60, cardLand: 260, lawLineAfter: 400, usable: 600 },
  screen: { change: 300, changeMax: 350, ease: "ease-out", black: 0, cameraLook: 350, stagger: 60, elementMove: 250, overshoot: "small, then settle", usableFrequent: 400, usableRare: 600 },
  hover: { respond: 100, lift: 130, liftPx: 3, press: 80, tooltipDelay: 350, tooltipGone: "on any tap" },
  counts: { ledger: 700, ringLight: 40, pipFill: 300, walkerStepAside: 300 },
};

// fill(str, values) · the substitution Code will do; here so the sheet can preview a filled row
export function fill(s, v) { return s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)); }

export const SAMPLE = {
  walker: "hult", next: "bekk", them: "him", you: "six", sky: "seven", n: "two", nth: "first", rung: "fifth", yours: "none", hers: "one", card: "the blaze",
  reason: "six against seven: her held cards outweighed yours at dawn.",
  lights: "two lights stand.", series: "hult leads, one to none", law: "the price. a card at the middle that cannot be taken strikes two lower.",
  house: "the heart", station: "the glance", quadrant: "vermilion bird", planet: "mercury", planet2: "mars", aspect: "two signs on",
  a: "12", b: "11", w: "20", l: "14", awake: "four", defender: "hult", law_effect: "the middle card counted for nobody", does: "marks one enemy card beside it two lower",
  tara: "vipat", tara_gloss: "the first dark", tara_line: "the full light is out, a crescent and a sliver remain.",
};
