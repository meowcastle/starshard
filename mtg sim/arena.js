// MTG Arena's Player.log (Detailed Logs on) -> the sim's own per-turn game log format, so
// tools/log-stats.js and tools/eval-fit.js read human games the same way as Forge's
// (NOTE-TO-CODE from Research, 13 Oct: "Justin's Arena log, and the parser it needs").
//
//   DATA_DIR=... node tools/arena-log.js <Player.log> <out dir>   (or require('./arena').parse(text, outDir?))
//
// Writes <out>/<matchId>-g<n>.jsonl.gz per game (seat 0 is the player whose log it is, seat 1 the
// opponent) and <out>/matches.json (one row per match: event, games, who was on the play, result,
// the opponent's revealed cards). Opponent names never leave the log: the opponent is "opponent".
//
// What the log can and can't give: the board, life, hand sizes, libraries, tapped lands, every spell
// cast, the result. The player's own hand is in the log; the opponent's is not. There is no position
// score (Forge's `static`); turn records carry `static: null`. `turn_end` carries untapped lands per
// seat; `castable` is the player's own, from the last menu Arena offered them that turn.
// Combat as Forge's GameLog writes it: an "attack" record when the declare-attackers step ends (attackers
// with power, the defender's untapped creatures), a "block" record when the declare-blockers step ends,
// and a "combat" record when combat ends (life change and creatures lost per seat; Arena's board is read
// after state-based actions, so unlike Forge's this count is not a floor). `phase` on cast and turn_end
// records is Arena's step where there is one (Step_Upkeep, Step_Draw, Step_DeclareAttack, Step_End ...),
// else the phase; `stack` on casts is the stack's size with the new object on it (1 = nothing below it).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const config = require('./config');
const { writeJson, readJson } = require('./store');
const meta = require('./meta');

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

async function parse(text, OUT = null) {
  const games = [], matches = new Map();
  let g = null;           // the game being rebuilt
  let me = null;          // the log owner's seat (the seat Arena addresses its game messages to)
  const objs = new Map(), zones = new Map(), players = new Map();
  const finishTurn = () => { if (g && g.turn) { combatTick(true); g.recs.push(turnEnd()); } };

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
  // combat, as Forge's GameLog records it: attack (when declare attackers ends), block, combat (when it ends)
  const onBf = o => zones.get(o.zoneId)?.type === 'ZoneType_Battlefield';
  const creatures = seat => [...objs.values()].filter(o => onBf(o) && o.controllerSeatId === seat && kindOf(o) === 'creature');
  const pt = o => ({ grpId: o.grpId, power: o.power?.value ?? 0, toughness: o.toughness?.value ?? 0 });
  function combatTick(over = false) {
    const step = g.step, inCombat = !over && g.phase === 'Phase_Combat';
    if (inCombat && step === 'Step_DeclareAttack' && !g.cb) {
      const seats = [me, 3 - me];
      g.cb = { attacker: g.active, life: seats.map(s => players.get(s)?.lifeTotal ?? 20), count: seats.map(s => creatures(s).length) };
    }
    const cb = g.cb; if (!cb) return;
    if (!cb.attacked && (!inCombat || step !== 'Step_DeclareAttack')) {
      cb.attacked = true;
      const atk = [...objs.values()].filter(o => onBf(o) && o.controllerSeatId === cb.attacker && /AttackState_(Attacking|Declared)/.test(o.attackState || ''));
      cb.n = atk.length;
      g.recs.push({ t: 'attack', turn: g.turn, active: seatIdx(g.active), phase: 'Step_DeclareAttack', seat: seatIdx(cb.attacker), attackers: atk.map(pt),
        untappedDefenders: creatures(3 - cb.attacker).filter(o => !o.isTapped).length });
    }
    if (inCombat && step === 'Step_DeclareBlock') cb.blockStep = true;
    if (cb.blockStep && !cb.blocked && (!inCombat || step !== 'Step_DeclareBlock')) {
      cb.blocked = true;
      const blocks = [];
      for (const b of [...objs.values()].filter(o => onBf(o) && o.blockState === 'BlockState_Blocking'))
        for (const id of b.blockInfo?.attackerIds || []) { const a = objs.get(id); if (a) { const x = pt(b), y = pt(a); blocks.push({ blocker: x.grpId, bp: x.power, bt: x.toughness, attacker: y.grpId, ap: y.power, at: y.toughness }); } }
      g.recs.push({ t: 'block', turn: g.turn, active: seatIdx(g.active), phase: 'Step_DeclareBlock', seat: seatIdx(3 - cb.attacker), blocks });
    }
    if (!inCombat) {
      if (cb.n) {
        const seats = [me, 3 - me];
        g.recs.push({ t: 'combat', turn: g.turn, active: seatIdx(g.active), phase: 'Step_EndCombat',
          lifeChange: seats.map((s, i) => (players.get(s)?.lifeTotal ?? 20) - cb.life[i]), creaturesLost: seats.map((s, i) => Math.max(0, cb.count[i] - creatures(s).length)) });
      }
      g.cb = null;
    }
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
          if (matches.has(info.matchID)) { const mm = matches.get(info.matchID); mm.me = me; if (!mm.at && +m.timestamp) mm.at = new Date(+m.timestamp).toISOString(); }
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
          const ti0 = s.turnInfo;
          g.recs.push({ t: 'cast', turn: g.turn, active: seatIdx(g.active), phase: (ti0?.phase ? ti0.step || ti0.phase : g.step || g.phase) || null, seat: seatIdx(o.controllerSeatId), grpId: o.grpId, spell: o.type === 'GameObjectType_Card', kind: kindOf(o),
            stack: Math.max(1, (z.objectInstanceIds || []).length) });
        }
      }
      for (const id of s.diffDeletedInstanceIds || []) objs.delete(id);
      for (const p of s.players || []) players.set(p.systemSeatNumber, { ...(players.get(p.systemSeatNumber) || {}), ...p });
      const ti = s.turnInfo;
      if (ti && ti.turnNumber && ti.turnNumber !== g.turn) {
        finishTurn(); // closes the old turn's combat too
        g.turn = ti.turnNumber; g.active = ti.activePlayer;
        if (g.onThePlay == null && ti.turnNumber === 1) g.onThePlay = ti.activePlayer;
        g.lastMenu = [];
        g.recs.push(turnRec());
      }
      if (ti && ti.phase) { g.phase = ti.phase; g.step = ti.step || null; combatTick(); }
      for (const r of info?.results || []) if (r.scope === 'MatchScope_Game' && !g.result) g.result = { winner: r.winningTeamId === me ? 0 : 1, reason: (r.reason || '').replace('ResultReason_', '') };
    }
  }
  finishTurn();

  // names for every Arena id seen, then the files
  const ids = new Set();
  for (const gm of games) for (const r of gm.recs) { if (r.grpId) ids.add(r.grpId); for (const c of r.board || []) ids.add(c.grpId); for (const v of r.views || []) for (const h of v.me.hand || []) ids.add(h.grpId); for (const s of r.seats || []) for (const c of s.castable || []) ids.add(c.grpId); for (const c of r.attackers || []) ids.add(c.grpId); for (const b of r.blocks || []) { ids.add(b.blocker); ids.add(b.attacker); } }
  const name = await namesFor([...ids]);
  const find = await meta.cards([...ids].map(name).filter(Boolean));
  const kw = n => { const k = n && find(n); if (!k) return []; const t = [...(k.card_faces || [k])].map(f => f.oracle_text || '').join('\n'); return ['flying', 'menace', 'trample', 'lifelink', 'deathtouch', 'first strike', 'vigilance', 'reach', 'haste', 'flash'].filter(w => new RegExp('(^|\\n|, )' + w + '\\b', 'i').test(t)); };
  const mv = n => { const k = n && find(n); return k ? (k.cmc || 0) : -1; };
  if (OUT) fs.mkdirSync(OUT, { recursive: true });
  let written = 0;
  const logs = new Map(); // matchId -> each game's records, for leaks.js
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
      if (r.t === 'attack') r.attackers = r.attackers.map(c => { const n = name(c.grpId); const x = { name: n || 'arena:' + c.grpId, power: c.power, toughness: c.toughness }; return x; });
      if (r.t === 'block') r.blocks = r.blocks.map(b => ({ ...b, blocker: name(b.blocker) || 'arena:' + b.blocker, attacker: name(b.attacker) || 'arena:' + b.attacker }));
      if (r.t === 'turn_end') for (const s of r.seats) s.castable = s.castable.map(c => { const n = name(c.grpId); const k = n && find(n); return { name: n || 'arena:' + c.grpId, mv: mv(n), ...(k && (/Instant/.test((k.card_faces?.[0] || k).type_line || '') || kw(n).includes('flash')) ? { instant: true } : {}) }; });
      recs.push(r);
    }
    const last = gm.recs.filter(r => r.t === 'turn').pop();
    recs.push({ t: 'end', winner: gm.result ? gm.result.winner : null, turns: gm.turn, onThePlay: gm.onThePlay == null ? null : (gm.onThePlay === gm.me ? 0 : 1), reason: gm.result ? gm.result.reason : 'unknown', life: last ? last.views.map(v => v.me.life) : null });
    if (!logs.has(gm.matchId)) logs.set(gm.matchId, []);
    logs.get(gm.matchId).push(recs);
    if (OUT) fs.writeFileSync(path.join(OUT, `${gm.matchId}-g${gm.number}.jsonl.gz`), zlib.gzipSync(recs.map(x => JSON.stringify(x)).join('\n') + '\n'));
    written++;
    if (mm) mm.games.push({ game: gm.number, onThePlay: gm.onThePlay == null ? null : (gm.onThePlay === gm.me ? 'player' : 'opponent'), turns: gm.turn, winner: gm.result ? (gm.result.winner === 0 ? 'player' : 'opponent') : null, reason: gm.result ? gm.result.reason : null, life: last ? { player: last.views[0].me.life, opponent: last.views[1].me.life } : null });
  }
  // the opponent's deck as far as it was seen: every card they cast or had on the battlefield
  for (const mm of matches.values()) {
    const seen = new Set();
    for (const gm of games.filter(x => x.matchId === mm.matchId)) for (const r of gm.recs) { if (r.t === 'cast' && r.seat === 1 && r.name && !r.name.startsWith('arena:')) seen.add(r.name); for (const c of r.board || []) if (c.seat === 1 && c.name && !c.name.startsWith('arena:')) seen.add(c.name); }
    mm.opponentCards = [...seen].sort();
    const mine = new Set();
    for (const gm of games.filter(x => x.matchId === mm.matchId)) for (const r of gm.recs) { if (r.t === 'cast' && r.seat === 0 && r.name && !r.name.startsWith('arena:') && r.name !== 'an ability') mine.add(r.name); for (const c of r.board || []) if (c.seat === 0 && c.name && !c.name.startsWith('arena:')) mine.add(c.name); for (const v of r.views || []) for (const h of v.me.hand || []) if (h.name && !h.name.startsWith('arena:')) mine.add(h.name); }
    mm.playerCards = [...mine].sort();
  }
  const played = [...matches.values()].filter(x => x.games.length);
  if (OUT) writeJson(path.join(OUT, 'matches.json'), played, { keep: 0 });
  return { matches: played, games: written, logs };
}

module.exports = { parse };
