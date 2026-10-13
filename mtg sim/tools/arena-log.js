// MTG Arena's Player.log (Detailed Logs on) -> the sim's own per-turn game log format, so
// tools/log-stats.js and tools/eval-fit.js read human games the same way as Forge's
// (NOTE-TO-CODE from Research, 13 Oct: "Justin's Arena log, and the parser it needs").
//
//   DATA_DIR=... node tools/arena-log.js <Player.log> <out dir>
//
// Writes <out>/<matchId>-g<n>.jsonl.gz per game (seat 0 is the player whose log it is, seat 1 the
// opponent) and <out>/matches.json (one row per match: event, games, who was on the play, result,
// the opponent's revealed cards). Opponent names never leave the log: the opponent is "opponent".
//
// What the log can and can't give: the board, life, hand sizes, libraries, tapped lands, every spell
// cast, the result. The player's own hand is in the log; the opponent's is not. There is no position
// score (Forge's `static`); turn records carry `static: null`. `turn_end` carries untapped lands per
// seat; `castable` is the player's own, from the last menu Arena offered them that turn.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const config = require('../config');
const { writeJson, readJson } = require('../store');
const meta = require('../meta');

const [LOG, OUT] = process.argv.slice(2);
if (!LOG || !OUT) { console.error('usage: node tools/arena-log.js <Player.log> <out dir>'); process.exit(1); }

// ---- read every JSON message in the log, single-line or multi-line, in order
function* messages(text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('{')) continue;
    let buf = lines[i], depth = 0, j = i;
    const count = s => { let d = 0, q = false; for (let k = 0; k < s.length; k++) { const c = s[k]; if (q) { if (c === '\\') k++; else if (c === '"') q = false; } else if (c === '"') q = true; else if (c === '{') d++; else if (c === '}') d--; } return d; };
    depth = count(buf);
    while (depth > 0 && j + 1 < lines.length) { j++; buf += '\n' + lines[j]; depth += count(lines[j]); }
    try { yield JSON.parse(buf); } catch { /* a truncated block */ }
    i = j;
  }
}

// ---- Arena card ids (grpId) -> names, through Scryfall's arena_id, cached
const IDS = () => path.join(config.DATA_DIR, 'arena-ids.json');
async function namesFor(ids) {
  const cache = readJson(IDS(), {});
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (const id of ids) {
    if (id in cache) continue;
    const r = await fetch('https://api.scryfall.com/cards/arena/' + id, { headers: { Accept: 'application/json', 'User-Agent': 'sim.starshard.net' } });
    if (r.status === 429) { await sleep(2000); continue; }
    cache[id] = r.ok ? meta.forgeName(await r.json()) : null; // tokens and Arena-only objects have no entry
    await sleep(110);
  }
  writeJson(IDS(), cache, { keep: 0 });
  return id => cache[id] || null;
}

(async () => {
  const text = fs.readFileSync(LOG, 'utf8');
  const games = [], matches = new Map();
  let g = null;           // the game being rebuilt
  let me = null;          // the log owner's seat (the seat Arena addresses its game messages to)
  const objs = new Map(), zones = new Map(), players = new Map();
  const finishTurn = () => { if (g && g.turn) g.recs.push(turnEnd()); };

  function kindOf(o) { const t = o.cardTypes || []; return t.includes('CardType_Creature') ? 'creature' : t.includes('CardType_Land') ? 'land' : t.includes('CardType_Planeswalker') ? 'planeswalker' : 'other'; }
  const seatIdx = s => s === me ? 0 : 1;
  function zoneOf(seat, type) { for (const z of zones.values()) if (z.type === type && z.ownerSeatId === seat) return z; return null; }
  function view(seat) {
    const hand = zoneOf(seat, 'ZoneType_Hand'), lib = zoneOf(seat, 'ZoneType_Library'), gy = zoneOf(seat, 'ZoneType_Graveyard');
    const ex = [...zones.values()].find(z => z.type === 'ZoneType_Exile');
    const bf = [...objs.values()].filter(o => zones.get(o.zoneId)?.type === 'ZoneType_Battlefield' && o.controllerSeatId === seat);
    const lands = bf.filter(o => kindOf(o) === 'land');
    const p = players.get(seat) || {};
    const v = { life: p.lifeTotal ?? 20, library: (lib?.objectInstanceIds || []).length, graveyard: (gy?.objectInstanceIds || []).length,
      exile: (ex?.objectInstanceIds || []).filter(id => objs.get(id)?.ownerSeatId === seat).length, handSize: (hand?.objectInstanceIds || []).length,
      lands: lands.length, landsUntapped: lands.filter(o => !o.isTapped).length };
    if (seat === me) v.hand = (hand?.objectInstanceIds || []).map(id => objs.get(id)).filter(Boolean).map(o => ({ grpId: o.grpId }));
    return v;
  }
  function board() {
    return [...objs.values()].filter(o => zones.get(o.zoneId)?.type === 'ZoneType_Battlefield' && o.type === 'GameObjectType_Card').map(o => {
      const x = { grpId: o.grpId, seat: seatIdx(o.controllerSeatId), kind: kindOf(o) };
      if (o.isTapped) x.tapped = true;
      if (x.kind === 'creature') { x.power = o.power?.value ?? 0; x.toughness = o.toughness?.value ?? 0; if (o.hasSummoningSickness) x.sick = true; }
      if (x.kind === 'planeswalker') x.loyalty = o.loyalty?.value ?? 0;
      return x;
    });
  }
  function turnRec() {
    const views = [me, 3 - me].map(s => { const mine = view(s); const opp = view(3 - s); delete opp.hand; return { me: mine, opp }; });
    return { t: 'turn', turn: g.turn, active: seatIdx(g.active), phase: 'Phase_Beginning', board: board(), views, static: [null, null] };
  }
  function turnEnd() {
    const seats = [me, 3 - me].map(s => ({ landsUntapped: view(s).landsUntapped, manaAvailable: view(s).landsUntapped, castable: s === me ? (g.lastMenu || []) : [], handSize: view(s).handSize }));
    return { t: 'turn_end', turn: g.turn, active: seatIdx(g.active), phase: 'Phase_Ending', seats };
  }

  for (const m of messages(text)) {
    // match setup and results
    const room = m.matchGameRoomStateChangedEvent?.gameRoomInfo;
    if (room) {
      const id = room.gameRoomConfig?.matchId;
      if (id && !matches.has(id)) matches.set(id, { matchId: id, event: room.gameRoomConfig.reservedPlayers?.[0]?.eventId || null, games: [], result: null });
      const fin = room.finalMatchResult;
      if (fin && matches.has(fin.matchId)) {
        const mm = matches.get(fin.matchId), r = (fin.resultList || []).find(x => x.scope === 'MatchScope_Match');
        if (r && mm.me != null) mm.result = { won: r.winningTeamId === mm.me, reason: (r.reason || '').replace('ResultReason_', '') };
      }
    }
    for (const msg of m.greToClientEvent?.greToClientMessages || []) {
      // the player's seat changes from match to match (seat 1 in one, seat 2 in the next): taken from the
      // messages addressed to them, and fixed when each game starts
      const addressed = msg.systemSeatIds?.length === 1 ? msg.systemSeatIds[0] : null;
      // what Arena offered the player: their castable spells this turn
      if (msg.type === 'GREMessageType_ActionsAvailableReq' && g) {
        // Arena lists every spell in hand; only the ones it can pay for carry an autoTapSolution
        g.lastMenu = (msg.actionsAvailableReq?.actions || []).filter(a => a.actionType === 'ActionType_Cast' && a.autoTapSolution).map(a => ({ grpId: a.grpId }));
      }
      const s = msg.gameStateMessage; if (!s) continue;
      const info = s.gameInfo;
      if (info && (s.type === 'GameStateType_Full' || !g || info.matchID !== g.matchId || info.gameNumber !== g.number)) {
        if (!g || info.matchID !== g.matchId || info.gameNumber !== g.number) {
          finishTurn();
          objs.clear(); zones.clear(); players.clear();
          me = addressed ?? me;
          g = { matchId: info.matchID, number: info.gameNumber || 1, recs: [], turn: 0, active: null, onThePlay: null, stack: new Set(), result: null, me };
          if (matches.has(info.matchID)) matches.get(info.matchID).me = me;
          games.push(g);
        }
      }
      if (!g) continue;
      for (const z of s.zones || []) zones.set(z.zoneId, z);
      for (const o of s.gameObjects || []) {
        objs.set(o.instanceId, o);
        const z = zones.get(o.zoneId);
        if (z?.type === 'ZoneType_Stack' && !g.stack.has(o.instanceId)) {
          g.stack.add(o.instanceId);
          // a spell the player has since cast is no longer something they held back
          if (o.controllerSeatId === me && g.lastMenu) { const i = g.lastMenu.findIndex(c => c.grpId === o.grpId); if (i >= 0) g.lastMenu.splice(i, 1); }
          g.recs.push({ t: 'cast', turn: g.turn, active: seatIdx(g.active), phase: s.turnInfo?.phase || g.phase || null, seat: seatIdx(o.controllerSeatId), grpId: o.grpId, spell: o.type === 'GameObjectType_Card', kind: kindOf(o) });
        }
      }
      for (const id of s.diffDeletedInstanceIds || []) objs.delete(id);
      for (const p of s.players || []) players.set(p.systemSeatNumber, { ...(players.get(p.systemSeatNumber) || {}), ...p });
      const ti = s.turnInfo;
      if (ti && ti.phase) g.phase = ti.phase;
      if (ti && ti.turnNumber && ti.turnNumber !== g.turn) {
        finishTurn();
        g.turn = ti.turnNumber; g.active = ti.activePlayer;
        if (g.onThePlay == null && ti.turnNumber === 1) g.onThePlay = ti.activePlayer;
        g.lastMenu = [];
        g.recs.push(turnRec());
      }
      for (const r of info?.results || []) if (r.scope === 'MatchScope_Game' && !g.result) g.result = { winner: r.winningTeamId === me ? 0 : 1, reason: (r.reason || '').replace('ResultReason_', '') };
    }
  }
  finishTurn();

  // names for every Arena id seen, then the files
  const ids = new Set();
  for (const gm of games) for (const r of gm.recs) { if (r.grpId) ids.add(r.grpId); for (const c of r.board || []) ids.add(c.grpId); for (const v of r.views || []) for (const h of v.me.hand || []) ids.add(h.grpId); for (const s of r.seats || []) for (const c of s.castable || []) ids.add(c.grpId); }
  const name = await namesFor([...ids]);
  const find = await meta.cards([...ids].map(name).filter(Boolean));
  const kw = n => { const k = n && find(n); if (!k) return []; const t = [...(k.card_faces || [k])].map(f => f.oracle_text || '').join('\n'); return ['flying', 'menace', 'trample', 'lifelink', 'deathtouch', 'first strike', 'vigilance', 'reach', 'haste', 'flash'].filter(w => new RegExp('(^|\\n|, )' + w + '\\b', 'i').test(t)); };
  const mv = n => { const k = n && find(n); return k ? (k.cmc || 0) : -1; };
  fs.mkdirSync(OUT, { recursive: true });
  let written = 0;
  for (const gm of games) {
    if (!gm.recs.length) continue;
    const mm = matches.get(gm.matchId);
    const recs = [{ t: 'game', match: gm.matchId, game: gm.number, decks: ['player', 'opponent'], source: 'arena', event: mm?.event || null }];
    for (const r of gm.recs) {
      if (r.t === 'turn') {
        r.board = r.board.map(c => { const n = name(c.grpId); const x = { ...c, name: n || 'arena:' + c.grpId }; delete x.grpId; if (c.kind === 'creature') { const k = kw(n).filter(w => ['flying', 'menace', 'trample', 'lifelink', 'deathtouch', 'first strike', 'vigilance', 'reach', 'haste'].includes(w)); if (k.length) x.kw = k; } if (c.kind !== 'land') x.mv = mv(n); return x; });
        for (const v of r.views) if (v.me.hand) v.me.hand = v.me.hand.map(h => { const n = name(h.grpId); return { name: n || 'arena:' + h.grpId, mv: mv(n) }; });
      }
      if (r.t === 'cast') { const n = r.spell ? name(r.grpId) : null; r.name = n || (r.spell ? 'arena:' + r.grpId : 'an ability'); r.mv = mv(n); const k = n && find(n); if (kw(n).includes('flash') || (k && /Instant/.test((k.card_faces?.[0] || k).type_line || ''))) r.instant = true; delete r.grpId; }
      if (r.t === 'turn_end') for (const s of r.seats) s.castable = s.castable.map(c => { const n = name(c.grpId); const k = n && find(n); return { name: n || 'arena:' + c.grpId, mv: mv(n), ...(k && (/Instant/.test((k.card_faces?.[0] || k).type_line || '') || kw(n).includes('flash')) ? { instant: true } : {}) }; });
      recs.push(r);
    }
    const last = gm.recs.filter(r => r.t === 'turn').pop();
    recs.push({ t: 'end', winner: gm.result ? gm.result.winner : null, turns: gm.turn, onThePlay: gm.onThePlay == null ? null : (gm.onThePlay === gm.me ? 0 : 1), reason: gm.result ? gm.result.reason : 'unknown', life: last ? last.views.map(v => v.me.life) : null });
    fs.writeFileSync(path.join(OUT, `${gm.matchId}-g${gm.number}.jsonl.gz`), zlib.gzipSync(recs.map(x => JSON.stringify(x)).join('\n') + '\n'));
    written++;
    if (mm) mm.games.push({ game: gm.number, onThePlay: gm.onThePlay == null ? null : (gm.onThePlay === gm.me ? 'player' : 'opponent'), turns: gm.turn, winner: gm.result ? (gm.result.winner === 0 ? 'player' : 'opponent') : null, reason: gm.result ? gm.result.reason : null, life: last ? { player: last.views[0].me.life, opponent: last.views[1].me.life } : null });
  }
  // the opponent's deck as far as it was seen: every card they cast or had on the battlefield
  for (const mm of matches.values()) {
    const seen = new Set();
    for (const gm of games.filter(x => x.matchId === mm.matchId)) for (const r of gm.recs) { if (r.t === 'cast' && r.seat === 1 && r.name && !r.name.startsWith('arena:')) seen.add(r.name); for (const c of r.board || []) if (c.seat === 1 && c.name && !c.name.startsWith('arena:')) seen.add(c.name); }
    mm.opponentCards = [...seen].sort();
  }
  writeJson(path.join(OUT, 'matches.json'), [...matches.values()].filter(x => x.games.length), { keep: 0 });
  console.log(`${written} games in ${[...matches.values()].filter(x => x.games.length).length} matches -> ${OUT}`);
  for (const mm of matches.values()) if (mm.games.length) console.log(`  ${mm.event}: ${mm.result ? (mm.result.won ? 'won' : 'lost') + ' (' + mm.result.reason + ')' : '?'}; ` + mm.games.map(x => `game ${x.game}: ${x.winner} won, ${x.onThePlay} on the play, ${x.turns} turns, life ${x.life ? x.life.player + '/' + x.life.opponent : '?'}`).join('; ') + `; opponent showed ${mm.opponentCards.length} cards`);
})().catch(e => { console.error(e); process.exit(1); });
