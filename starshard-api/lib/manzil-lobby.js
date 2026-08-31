// Manzil real-time matchmaking + PvP move validation. In-memory only (see
// CLAUDE.md's Manzil plan): no DB tables, no cross-restart persistence.
//
// ACCOUNT REQUIRED (24 Aug 2026, reversing the original design below):
// Manzil now requires a real Star Shard account to play at all, so a
// connection without a valid `starshard_session` cookie is rejected
// outright, not handed an anonymous guest identity — see
// resolveIdentity()/the connection handler. The guest-JWT minting this
// file used to do is gone; the paragraph below is kept as history of why
// the perspective-flip/seat-translation plumbing looks the way it does,
// not a description of current identity behavior.
//
// PERSPECTIVE FLIP, the one non-obvious thing here: the client's entire
// rendering/animation model hardcodes "you" as the local player and "sky"
// as the opponent (state.hand vs state.sky, slots[i].owner === "you" for
// bottom-rail styling, _commitPlace(...,"you"|"sky")) — that convention
// runs through thousands of lines and was never going to be rewritten.
// So every outgoing message is built fresh per socket, translating the
// canonical match seat ("you"/"sky", arbitrary — whoever queued first is
// canonical "you") into that socket's OWN perspective, where its own seat
// is always presented as "you" and the opponent's as "sky". A client never
// learns which canonical seat it actually occupies.
//
// FACE VALUES: the client's local _faceOf()/_noSoften()/_safeNow() (in the
// .dc.html) are the pre-Phase-1 seat-locked versions, deliberately left
// alone (CLAUDE.md: "those stay as-is for the existing single-device
// modes" — an owner-relative fix there would also strengthen the local AI
// in practice/road/night modes, which nobody asked for). That means the
// client cannot be trusted to recompute a card's live face value for a
// PvP board: an opponent's bearer/ghost/heart/void/veil/chamber would
// silently misrender. So the server computes and ships the authoritative
// {l, r} for every filled slot on every board snapshot, and the client
// displays those directly for PvP boards instead of calling _faceOf.
//
// MOVE RESOLUTION: same reasoning — the client never runs its own
// lodge()/resolve() for a PvP move (own or opponent's). It sends `place`,
// waits for `move_confirmed`, and replays the server's flip sequence
// through its existing _step() animation, which only ever reads
// {from,to,dir,owner|ret} per entry — exactly engine.resolve()'s own
// `seq` shape.

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const engine = require('./manzil-engine');

const COOKIE_NAME = 'starshard_session';
const MAX_CONNECTIONS = 500;
const READY_TIMEOUT_MS = 5000;
const DISCONNECT_GRACE_MS = 60000;
const BOARD_LEN = 9;
const BEST_OF = 5; // first to 3

function view(mySeat, seat) { return seat === mySeat ? 'you' : 'sky'; }
const otherSeat = s => (s === 'you' ? 'sky' : 'you');

// -- account identity ------------------------------------------------------

function tryUidFromCookie(handshake, jwtSecret) {
  const raw = handshake.headers && handshake.headers.cookie;
  if (!raw) return null;
  const m = new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)').exec(raw);
  if (!m) return null;
  try {
    const payload = jwt.verify(decodeURIComponent(m[1]), jwtSecret);
    if (payload && payload.uid != null) return { gid: 'u_' + payload.uid, displayName: payload.username || null };
  } catch (e) { /* not signed in, or expired */ }
  return null;
}

// Returns null when there's no valid session — callers must reject the
// connection on null, not fall back to an anonymous identity. This is the
// entire enforcement point for "Manzil requires an account": the .dc.html's
// own phase-gate stops the rendered UI from reaching this code logged out,
// but only a server-side rejection here stops a hand-rolled socket
// connection (devtools, a script) from reaching a real match with none.
function resolveIdentity(socket, jwtSecret) {
  return tryUidFromCookie(socket.handshake, jwtSecret);
}

// -- rate limiting (per-gid, in-memory token buckets) --------------------

function makeLimiter() {
  const hits = new Map(); // gid -> array of timestamps
  return (gid, limit, windowMs) => {
    const now = Date.now();
    const arr = (hits.get(gid) || []).filter(t => now - t < windowMs);
    if (arr.length >= limit) { hits.set(gid, arr); return false; }
    arr.push(now);
    hits.set(gid, arr);
    return true;
  };
}

// Every gid is 'u_' + the numeric users.id since guest identities were
// retired — safe to parse back out for report/block DB writes, which need
// the real id, not the string form.
function uidFromGid(gid) { return Number(gid.slice(2)); }

function createManzilLobby(io, { jwtSecret, pool }) {
  const queue = []; // [{ gid, socketId, displayName, pack, joinedAt }]
  const matches = new Map(); // matchId -> match
  const gidToMatch = new Map(); // gid -> matchId
  const gidToSocket = new Map(); // gid -> socket (the live one)

  const allowQueueJoin = makeLimiter();
  const lastPlaceAt = new Map(); // gid -> timestamp, 1 move / 300ms

  let cachedTonight = null;
  let cachedTonightAt = 0;
  async function currentTonight() {
    if (cachedTonight != null && Date.now() - cachedTonightAt < 5 * 60 * 1000) return cachedTonight;
    try {
      const astroMod = await import('../../astro.js');
      const jd = Date.now() / 86400000 + 2440587.5;
      cachedTonight = astroMod.mansionOf(astroMod.moonLongitude(jd));
    } catch (e) {
      cachedTonight = 1; // astro.js not resolvable from this deploy layout — fall back rather than fail matches
    }
    cachedTonightAt = Date.now();
    return cachedTonight;
  }

  function socketFor(match, seat) {
    const gid = match.seats[seat].gid;
    return gidToSocket.get(gid) || null;
  }

  // REAL PER-PLAYER LEVELS (30 aug 2026, user's explicit call — reverses the client's own "duels
  // stay even regardless of what either player has climbed" comment, see _cards() ~line 4909):
  // an account's real card levels/builds, computed server-side from data already synced here for
  // an unrelated reason (the progress-sync feature) — mirrors the client's own _mlvl()/_baseLvl()/
  // _builds() formulas exactly (Star Shard v3 Build Plan/Manzil - Game Prototype V2.dc.html
  // ~line 4966-4993). manzil_pack.five_json is ordered [sun-mansion, ...others] the same way
  // _castFive() builds it, so five[0] alone (no full birth chart needed server-side) tells us which
  // mansion gets the sun's base level 3 vs the others' base level 2.
  async function realCardConfig(uid) {
    try {
      const [[packRow], [progRow]] = await Promise.all([
        pool.execute('SELECT five_json FROM manzil_pack WHERE user_id = ?', [uid]).then(([r]) => [r[0]]),
        pool.execute('SELECT progress_json FROM manzil_progress WHERE user_id = ?', [uid]).then(([r]) => [r[0]]),
      ]);
      let five = [];
      try { const parsed = packRow && JSON.parse(packRow.five_json); if (Array.isArray(parsed)) five = parsed; } catch (e) {}
      let progress = {};
      try { const parsed = progRow && JSON.parse(progRow.progress_json); if (parsed && typeof parsed === 'object') progress = parsed; } catch (e) {}
      const climbs = progress.climbs && typeof progress.climbs === 'object' ? progress.climbs : {};
      const builds = progress.build && typeof progress.build === 'object' ? progress.build : {};
      const levels = {};
      for (let id = 1; id <= 28; id++) {
        const idx = five.indexOf(id);
        const base = idx === 0 ? 3 : idx > 0 ? 2 : 1;
        const climb = Number(climbs[id]) || 0;
        levels[id] = Math.max(1, Math.min(4, base + climb));
      }
      return { levels, builds };
    } catch (e) {
      return { levels: {}, builds: {} }; // cards()'s own default (level 1, nothing spent) — never blocks a match
    }
  }

  function faceGrid(match) {
    const g = match.game;
    return g.slots.map((s, i) => s ? { l: engine.faceOf(g, g.slots, i, -1), r: engine.faceOf(g, g.slots, i, 1) } : null);
  }

  function viewSlots(mySeat, match) {
    const faces = faceGrid(match);
    return match.game.slots.map((s, i) => !s ? null : {
      id: s.id, owner: view(mySeat, s.owner), by: s.by ? view(mySeat, s.by) : undefined, age: s.age, first: !!s.first,
      ground: s.ground ? view(mySeat, s.ground) : undefined,
      came: s.came, clawed: !!s.clawed, flocked: !!s.flocked, glanced: !!s.glanced,
      l: s.l, r: s.r, // raw post-rev faces, matching local slot.l/.r semantics (pre-modifier)
      pf: { l: faces[i].l, r: faces[i].r }, // authoritative CURRENT (modifier-adjusted) face — what the client displays and compares for the lifted/softened tag
    });
  }

  function boardSnapshot(match, mySeat) {
    const g = match.game;
    return {
      matchId: match.id,
      round: match.round,
      leader: view(mySeat, match.leader),
      turn: view(mySeat, g.turn),
      hand: (mySeat === 'you' ? g.you : g.sky).slice(),
      oppHand: (mySeat === 'you' ? g.sky : g.you).slice(),
      slots: viewSlots(mySeat, match),
      roundWins: match.roundWins.map(w => (w === 'draw' ? 'draw' : view(mySeat, w))),
      tonight: match.tonight,
      len: BOARD_LEN,
    };
  }

  function emitTo(match, seat, event, payload) {
    const sock = socketFor(match, seat);
    if (sock) sock.emit(event, payload);
  }

  function clearDisconnectTimer(match, seat) {
    if (match.discTimers[seat]) { clearTimeout(match.discTimers[seat]); match.discTimers[seat] = null; }
  }

  function endMatch(match, reason) {
    clearDisconnectTimer(match, 'you'); clearDisconnectTimer(match, 'sky');
    clearTimeout(match.readyTimer);
    matches.delete(match.id);
    gidToMatch.delete(match.seats.you.gid);
    gidToMatch.delete(match.seats.sky.gid);
  }

  async function createMatch(p1, p2) {
    const matchId = 'm_' + crypto.randomBytes(8).toString('hex');
    const leader = Math.random() < 0.5 ? 'you' : 'sky';
    // real per-player levels/builds, not a fixed baseline — see realCardConfig()'s own header note.
    const [youCfg, skyCfg] = await Promise.all([realCardConfig(uidFromGid(p1.gid)), realCardConfig(uidFromGid(p2.gid))]);
    const C = { you: engine.cards(youCfg), sky: engine.cards(skyCfg) };
    const tonight = await currentTonight();
    const match = {
      id: matchId, C, tonight, leader,
      seats: {
        you: { gid: p1.gid, displayName: p1.displayName, pack: p1.pack, connected: true },
        sky: { gid: p2.gid, displayName: p2.displayName, pack: p2.pack, connected: true },
      },
      round: 0, roundWins: [], game: null,
      discTimers: {}, readyAcks: new Set(), readyTimer: null,
      createdAt: Date.now(),
    };
    matches.set(matchId, match);
    gidToMatch.set(p1.gid, matchId);
    gidToMatch.set(p2.gid, matchId);

    emitTo(match, 'you', 'matched', { matchId, side: 'you', opponent: match.seats.sky.displayName, leader: view('you', leader), len: BOARD_LEN });
    emitTo(match, 'sky', 'matched', { matchId, side: 'you', opponent: match.seats.you.displayName, leader: view('sky', leader), len: BOARD_LEN });

    match.readyTimer = setTimeout(() => {
      if (!matches.has(matchId)) return;
      if (match.readyAcks.size < 2) {
        ['you', 'sky'].filter(s => match.readyAcks.has(s)).forEach(s =>
          emitTo(match, s, 'match_abandoned', { matchId, reason: 'opponent_left' }));
        endMatch(match, 'ready_timeout');
      }
    }, READY_TIMEOUT_MS);
  }

  // Both directions in one query — a block recorded by either side of a
  // pair is enough to keep them apart.
  async function isBlockedPair(gidA, gidB) {
    const [rows] = await pool.execute(
      'SELECT 1 FROM manzil_blocks WHERE (blocker_user_id = ? AND blocked_user_id = ?) ' +
      'OR (blocker_user_id = ? AND blocked_user_id = ?) LIMIT 1',
      [uidFromGid(gidA), uidFromGid(gidB), uidFromGid(gidB), uidFromGid(gidA)]
    );
    return rows.length > 0;
  }

  // Queues here are small (one NAS, one matchmaker) — an O(n^2) scan with a
  // DB check per candidate pair is the right-sized answer, not an
  // in-memory block cache. A blocked candidate stays queued rather than
  // being paired; it just waits for the next tryMatch() pass instead.
  async function tryMatch() {
    let i = 0;
    while (i < queue.length) {
      let paired = false;
      for (let j = i + 1; j < queue.length; j++) {
        if (await isBlockedPair(queue[i].gid, queue[j].gid)) continue;
        const [p1] = queue.splice(i, 1);
        const [p2] = queue.splice(j - 1, 1);
        createMatch(p1, p2).catch(() => {});
        paired = true;
        break;
      }
      if (!paired) i++;
    }
    queue.forEach((p, idx) => {
      const sock = gidToSocket.get(p.gid);
      if (sock) sock.emit('queued', { position: idx + 1 });
    });
  }

  function startRound(match) {
    match.round += 1;
    // leader alternates each round, starting from the coin-flip winner
    const leader = match.round % 2 === 1 ? match.leader : otherSeat(match.leader);
    const seed = Date.now() ^ crypto.randomInt(1, 0x7fffffff);
    // deal(pack, seed, n) — no tonight/dealGuarantee args: the walking-twelve "guarantee tonight's
    // mansion in the deal" mechanic is a single-player road convenience with no clear PvP-fair
    // equivalent (see manzil-engine.js's own header). A plain seeded 7-of-pack pick is the honest port.
    const youHand = engine.deal(match.seats.you.pack, seed + 1, 7);
    const skyHand = engine.deal(match.seats.sky.pack, seed + 2, 7);
    match.game = engine.mkGame({
      // C is already { you, sky } — real per-player levels/builds computed in createMatch(). The
      // mane is inherently owner-relative in this engine (see its own header), so no fairness flag
      // is needed the way the file this replaces needed maneFair.
      C: match.C, tonight: match.tonight, len: BOARD_LEN,
      you: youHand, sky: skyHand, leader, tieRule: 'a draw',
    });
    ['you', 'sky'].forEach(seat => {
      const snap = boardSnapshot(match, seat);
      emitTo(match, seat, 'board_start', snap);
    });
  }

  function seatFor(match, gid) {
    if (match.seats.you.gid === gid) return 'you';
    if (match.seats.sky.gid === gid) return 'sky';
    return null;
  }

  function handlePlace(match, seat, msg) {
    const g = match.game;
    if (!g) return emitTo(match, seat, 'move_rejected', { matchId: match.id, reason: 'no_active_board' });
    if (g.turn !== seat) return emitTo(match, seat, 'move_rejected', { matchId: match.id, reason: 'not_your_turn' });
    const { cardId, slot } = msg || {};
    if (!Number.isInteger(cardId) || !Number.isInteger(slot) || slot < 0 || slot >= BOARD_LEN) {
      return emitTo(match, seat, 'move_rejected', { matchId: match.id, reason: 'invalid_input' });
    }
    if (g.slots[slot]) return emitTo(match, seat, 'move_rejected', { matchId: match.id, reason: 'slot_taken' });
    const hand = seat === 'you' ? g.you : g.sky;
    if (hand.indexOf(cardId) < 0) return emitTo(match, seat, 'move_rejected', { matchId: match.id, reason: 'not_in_hand' });
    const card = engine.cardById(g, cardId, seat);
    if (!card) return emitTo(match, seat, 'move_rejected', { matchId: match.id, reason: 'invalid_input' });
    const rev = !!msg.rev && !!card.twoFaced;

    const rr = engine.resolve(g, g.slots, cardId, slot, rev, seat);
    // NOTE: no per-entry "ret" (a card returning to hand rather than just flipping) exists in the
    // live ruleset this engine is ported from — verified: nothing in the client's own _resolve()
    // ever pushes a `ret:` seq entry any more, `_step()`'s handler for it is now dead code carried
    // forward from an older mechanic. This engine never produces one either; if a future ruleset
    // change reintroduces a real return-to-hand card, this is the spot that needs it back.

    g.slots = rr.slots;
    if (seat === 'you') g.you = g.you.filter(id => id !== cardId);
    else g.sky = g.sky.filter(id => id !== cardId);

    const boardFull = g.slots.every(s => s);
    if (!boardFull) g.turn = otherSeat(seat);

    ['you', 'sky'].forEach(viewSeat => {
      emitTo(match, viewSeat, 'move_confirmed', {
        matchId: match.id,
        side: view(viewSeat, seat),
        cardId, slot, rev,
        // the client's own _step() reads set/miss/sig/printed alongside from/to/dir/owner for every
        // signature's animation (turn-flags, the gate/chamber/return's miss marks, toast text, the
        // throne's reach fx) — dropping any of these here silently breaks that signature in PvP.
        flips: rr.seq.map(e => ({
          from: e.from, to: e.to, dir: e.dir,
          owner: e.owner != null ? view(viewSeat, e.owner) : undefined,
          miss: e.miss || undefined, set: e.set || undefined, sig: e.sig || undefined,
        })),
        slots: viewSlots(viewSeat, match),
        nextTurn: boardFull ? null : view(viewSeat, g.turn),
      });
    });

    if (boardFull) finishBoard(match);
  }

  function finishBoard(match) {
    const winner = engine.boardWinner(match.game, match.game.slots); // tieRule "a draw" already set on this game
    match.roundWins.push(winner);
    const wins = side => match.roundWins.filter(w => w === side).length;
    const done = wins('you') >= 3 || wins('sky') >= 3;
    setTimeout(() => {
      if (!matches.has(match.id)) return;
      ['you', 'sky'].forEach(seat => emitTo(match, seat, 'board_result', {
        matchId: match.id,
        winner: winner === 'draw' ? 'draw' : view(seat, winner),
        roundWins: match.roundWins.map(w => (w === 'draw' ? 'draw' : view(seat, w))),
      }));
      if (done) {
        const matchWinner = wins('you') >= 3 ? 'you' : 'sky';
        ['you', 'sky'].forEach(seat => emitTo(match, seat, 'match_result', {
          matchId: match.id,
          winner: view(seat, matchWinner),
          roundWins: match.roundWins.map(w => (w === 'draw' ? 'draw' : view(seat, w))),
        }));
        endMatch(match, 'complete');
      } else {
        startRound(match);
      }
    }, 900); // mirrors the client's own _countCeremony beat so the count has time to land
  }

  function handleDisconnectFor(match, seat) {
    match.seats[seat].connected = false;
    const opp = otherSeat(seat);
    emitTo(match, opp, 'opponent_disconnected', { matchId: match.id, graceSeconds: DISCONNECT_GRACE_MS / 1000 });
    clearDisconnectTimer(match, seat);
    match.discTimers[seat] = setTimeout(() => {
      if (!matches.has(match.id)) return;
      if (match.seats[seat].connected) return; // reconnected in time
      emitTo(match, opp, 'match_abandoned', { matchId: match.id, reason: 'opponent_left' });
      endMatch(match, 'disconnect_timeout');
    }, DISCONNECT_GRACE_MS);
  }

  io.on('connection', socket => {
    if (io.engine.clientsCount > MAX_CONNECTIONS) { socket.disconnect(true); return; }

    const identity = resolveIdentity(socket, jwtSecret);
    if (!identity) {
      socket.emit('auth_required', { reason: 'login_required' });
      socket.disconnect(true);
      return;
    }
    socket.data.gid = identity.gid;
    socket.data.displayName = identity.displayName;

    const prior = gidToSocket.get(identity.gid);
    if (prior && prior.id !== socket.id) prior.disconnect(true); // a reconnect replaces the old socket, never stacks
    gidToSocket.set(identity.gid, socket);

    // rejoin a live match immediately if this gid has one (page refresh, brief network blip)
    const existingMatchId = gidToMatch.get(identity.gid);
    if (existingMatchId && matches.has(existingMatchId)) {
      const match = matches.get(existingMatchId);
      const seat = seatFor(match, identity.gid);
      if (seat) {
        match.seats[seat].connected = true;
        clearDisconnectTimer(match, seat);
        emitTo(match, otherSeat(seat), 'opponent_reconnected', { matchId: match.id });
        socket.emit('rejoin_ok', match.game ? boardSnapshot(match, seat) : { matchId: match.id, round: match.round, leader: view(seat, match.leader), waiting: true });
      }
    }

    socket.on('queue_join', msg => {
      if (!allowQueueJoin(identity.gid, 20, 10 * 60 * 1000) || !allowQueueJoin(identity.gid + ':burst', 1, 3000)) return;
      if (gidToMatch.has(identity.gid)) return; // already in a match
      const raw = (msg && msg.pack) || [];
      if (!Array.isArray(raw)) return;
      const pack = [...new Set(raw.filter(n => Number.isInteger(n) && n >= 1 && n <= 28))];
      if (!pack.length) return;
      const already = queue.findIndex(p => p.gid === identity.gid);
      if (already >= 0) queue.splice(already, 1);
      queue.push({ gid: identity.gid, displayName: identity.displayName, pack, joinedAt: Date.now() });
      tryMatch().catch(e => console.error('[manzil-lobby] tryMatch failed', e));
    });

    socket.on('queue_cancel', () => {
      const idx = queue.findIndex(p => p.gid === identity.gid);
      if (idx >= 0) { queue.splice(idx, 1); socket.emit('queue_cancelled', {}); }
    });

    socket.on('match_ready_ack', msg => {
      const match = matches.get(msg && msg.matchId);
      if (!match) return;
      const seat = seatFor(match, identity.gid);
      if (!seat) return;
      match.readyAcks.add(seat);
      if (match.readyAcks.size === 2) { clearTimeout(match.readyTimer); startRound(match); }
    });

    socket.on('place', msg => {
      const now = Date.now();
      if (now - (lastPlaceAt.get(identity.gid) || 0) < 300) return;
      lastPlaceAt.set(identity.gid, now);
      const match = matches.get(msg && msg.matchId);
      if (!match) return;
      const seat = seatFor(match, identity.gid);
      if (!seat) return;
      handlePlace(match, seat, msg);
    });

    socket.on('rejoin', msg => {
      const match = matches.get(msg && msg.matchId);
      if (!match) return socket.emit('rejoin_failed', { reason: 'no_such_match' });
      const seat = seatFor(match, identity.gid);
      if (!seat) return socket.emit('rejoin_failed', { reason: 'no_such_match' });
      match.seats[seat].connected = true;
      clearDisconnectTimer(match, seat);
      emitTo(match, otherSeat(seat), 'opponent_reconnected', { matchId: match.id });
      socket.emit('rejoin_ok', match.game ? boardSnapshot(match, seat) : { matchId: match.id, round: match.round, leader: view(seat, match.leader), waiting: true });
    });

    socket.on('leave_match', msg => {
      const match = matches.get(msg && msg.matchId);
      if (!match) return;
      const seat = seatFor(match, identity.gid);
      if (!seat) return;
      emitTo(match, otherSeat(seat), 'match_abandoned', { matchId: match.id, reason: 'opponent_left' });
      endMatch(match, 'left');
    });

    // Reporting also blocks — the whole point of a block list is that the
    // matchmaker skips it (see tryMatch/isBlockedPair above), so a report
    // with no accompanying block would defeat its own purpose. Fire-and-
    // forget from the caller's side; failures are logged, not surfaced,
    // since there's no useful retry UI for this action.
    socket.on('report_player', async msg => {
      const match = matches.get(msg && msg.matchId);
      if (!match) return;
      const seat = seatFor(match, identity.gid);
      if (!seat) return;
      const reporterUid = uidFromGid(identity.gid);
      const reportedUid = uidFromGid(match.seats[otherSeat(seat)].gid);
      try {
        await pool.execute(
          'INSERT INTO manzil_reports (match_id, reporter_user_id, reported_user_id) VALUES (?, ?, ?)',
          [match.id, reporterUid, reportedUid]
        );
        await pool.execute(
          'INSERT IGNORE INTO manzil_blocks (blocker_user_id, blocked_user_id) VALUES (?, ?)',
          [reporterUid, reportedUid]
        );
        socket.emit('reported', { matchId: match.id });
      } catch (e) {
        console.error('[manzil-lobby] report_player failed', e);
      }
    });

    socket.on('disconnect', () => {
      if (gidToSocket.get(identity.gid) === socket) gidToSocket.delete(identity.gid);
      const idx = queue.findIndex(p => p.gid === identity.gid);
      if (idx >= 0) queue.splice(idx, 1);
      const matchId = gidToMatch.get(identity.gid);
      if (matchId && matches.has(matchId)) {
        const match = matches.get(matchId);
        const seat = seatFor(match, identity.gid);
        if (seat) handleDisconnectFor(match, seat);
      }
    });
  });
}

module.exports = { createManzilLobby };
