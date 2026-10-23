// Runs Forge's headless simulator and parses its output into structured results.
// Forge CLI: sim -d <a.dck> <b.dck> ... -D <dir> -n <games> [-f Commander] -c <clock>
// Not quiet: each game's full log is read for card-level stats (cardstats.js).
const { spawn } = require('child_process');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const cardstats = require('./cardstats');

const FORGE_DIR = config.FORGE_DIR;
const XMX = config.FORGE_XMX;

function findJar() {
  const jar = fs.readdirSync(FORGE_DIR).find(f => /^forge-gui-desktop-.*jar-with-dependencies\.jar$/.test(f));
  if (!jar) throw new Error('Forge jar not found in ' + FORGE_DIR);
  return path.join(FORGE_DIR, jar);
}

function forgeVersion() {
  try { return findJar().match(/desktop-(.+?)-jar/)[1]; } catch { return 'unknown'; }
}

// Deck text ("4 Opt" lines, blank line or "Sideboard" header before sideboard)
// -> Forge .dck
// Forge spells two-part cards "Fire // Ice"; some sources write "Unholy Annex/Ritual Chamber",
// which Forge can't find, and the deck then plays a card short (4c Control did, until 12 Oct 2026).
const forgeCard = n => /[^/]\/[^/]/.test(n) ? n.split(/\s*\/\s*/).join(' // ') : n;
function toDck(name, deck) {
  const sec = { Main: deck.main || [], Sideboard: deck.side || [], Commander: deck.commander || [] };
  let out = `[metadata]\nName=${name}\n`;
  for (const [k, cards] of Object.entries(sec)) {
    if (!cards.length) continue;
    out += `[${k}]\n` + cards.map(c => `${c.qty} ${forgeCard(c.name)}`).join('\n') + '\n';
  }
  return out;
}

const safe = s => String(s).replace(/[^A-Za-z0-9 _'.,-]/g, '').trim().slice(0, 60) || 'Deck';

// Forge's AI plays a deck defensively only when its name contains "Control" (or
// its average mana value is over 3), so a control brew called "Squall" would get
// attack logic meant for aggro. A deck marked ai: 'control' carries the word.
function deckNames(decks) {
  const forgeName = d => { const n = safe(d.name); return d.ai === 'control' && !/control/i.test(n) ? n.slice(0, 52) + ' Control' : n; };
  return decks.map((d, i) => {
    let n = forgeName(d);
    if (decks.slice(0, i).some(o => forgeName(o) === n)) n += ` (${i + 1})`;
    return n;
  });
}

// Our own pilot (forge-pilot/, pilot.js) for the decisions Forge's AI gets wrong: a deck's
// cards Forge never casts, and the full reactive policy for decks that beat stock Forge with
// it in their own mirror. SIM_PILOT=0 turns it off; without the bridge jar it's off.
const PILOT_DIR = path.join(__dirname, 'forge-pilot');
const PILOT_JAR = path.join(PILOT_DIR, 'bridge', 'build', 'mtg-bench-bridge.jar');
const readJson = f => { try { return JSON.parse(fs.readFileSync(path.join(PILOT_DIR, f), 'utf8')); } catch { return {}; } };
const pilotOn = () => config.SIM_PILOT && fs.existsSync(PILOT_JAR);
// changes whenever who gets piloted changes, so results from before and after are never mixed
const pilotTag = () => pilotOn() ? require('crypto').createHash('md5').update(JSON.stringify([readJson('policies.json'), readJson('dead-cards.json')])).digest('hex').slice(0, 8) : 'off';
// The engine a game was played with: the Forge version and, when the pilot is on, who it pilots
// (pilotTag) and a hash of its code (pilot.js and the bridge's Java source; the source, not the
// jar, since a jar built on the Mac never matches one built on the NAS byte for byte). A worker
// sends it with every claim and report, and the server refuses one that differs: every game in
// a run is played by the same engine.
let codeHash = null;
function pilotCode() {
  if (codeHash) return codeHash;
  const h = require('crypto').createHash('md5');
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.java') && !e.name.startsWith('._')) h.update(e.name).update(fs.readFileSync(f)); } };
  try { h.update(fs.readFileSync(path.join(__dirname, 'pilot.js'))); walk(path.join(PILOT_DIR, 'bridge', 'src')); } catch {}
  return (codeHash = h.digest('hex').slice(0, 8));
}
const engine = () => ({ forge: forgeVersion(), pilot: pilotOn() ? { rules: pilotTag(), code: pilotCode() } : null });
const engineKey = e => !e ? '?' : e.forge + '|' + (e.pilot ? e.pilot.rules + '/' + e.pilot.code : 'off');
const deadKey = n => String(n).split(' // ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function pilotFor(deck, version = forgeVersion()) {
  if (!pilotOn()) return null;
  const pol = (readJson('policies.json')[version] || {})[deck.name];
  if (pol) return pol;
  const dead = new Set((readJson('dead-cards.json')[version] || []).map(deadKey));
  return (deck.main || []).some(c => dead.has(deadKey(c.name))) ? 'deadcards' : null;
}

// Run one Forge process. onLine gets every stdout/stderr line; returns {child, done}.
// logDir: where this pairing's per-turn game logs go (GameLog.java); the caller passes one only for
// pairings it wants logged (SIM_GAME_LOG). A logged 1v1 Constructed pairing plays through the bridge,
// Forge deciding everything our pilot doesn't: the same results as `forge sim` (Phase 0,
// forge-pilot/README.md), about a third slower (13 Oct 2026).
// bridge: play through the bridge even with no pilot and no log, for its per-match seeds (paired tests, paired.js)
// telemetry: the strategy's spec (telemetry.js); with a logDir, each game's summary rides on its result (games[i].tm)
function runSim({ decks, games, format, clock, seed, workDir, logDir, onLine, bridge = false, telemetry = null }) {
  fs.mkdirSync(workDir, { recursive: true });
  const names = deckNames(decks);
  const pilots = (!format || format === 'Constructed') && decks.length === 2 ? decks.map(d => pilotFor(d)) : [];
  const logging = config.SIM_GAME_LOG !== 'off' && config.SIM_GAME_LOG !== '0' && logDir && pilotOn() && (!format || format === 'Constructed') && decks.length === 2;
  if (pilots.some(Boolean) || logging || (bridge && decks.length === 2 && pilotOn())) return runPiloted({ decks, names, pilots: pilots.length ? pilots : [null, null], games, clock, seed, workDir, logDir: logging ? logDir : null, onLine, telemetry });
  const files = decks.map((d, i) => {
    const f = `deck${i + 1}.dck`;
    fs.writeFileSync(path.join(workDir, f), toDck(names[i], d));
    return f;
  });
  const args = [
    `-Xmx${XMX}`, '-Djava.awt.headless=true', ...config.FORGE_JAVA_OPTS.split(' ').filter(Boolean),
    '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
    '--add-opens', 'java.base/java.util=ALL-UNNAMED',
    '--add-opens', 'java.desktop/java.awt=ALL-UNNAMED',
    '-jar', findJar(), 'sim',
    '-d', ...files, '-D', workDir,
    '-n', String(games), '-c', String(clock || 120),
  ];
  if (format && format !== 'Constructed') args.push('-f', format);
  if (seed != null) args.push('-s', String(seed));
  // an AI profile per seat (res/ai/<name>.ai), only when one is asked for; Forge's own default otherwise
  if (decks.some(d => d.profile)) args.push('-a', ...decks.map(d => d.profile || 'Default'));
  const useXvfb = config.USE_XVFB;
  const cmd = useXvfb ? 'xvfb-run' : 'java';
  const argv = useXvfb ? ['-a', 'java', ...args] : args;
  const child = spawn(cmd, argv, { cwd: FORGE_DIR, env: config.childEnv({ HOME: config.DATA_DIR }) });

  const results = { names, wins: names.map(() => 0), draws: 0, games: [], warnings: [], cards: cardstats.empty(names.length) };
  const maps = decks.map(cardstats.nameMap);
  let gameLines = [];
  const handle = line => {
    // the game log is parsed per game, not kept: a 20-game pairing prints ~15,000 lines
    if (cardstats.isLogLine(line)) { gameLines.push(line); return; }
    onLine && onLine(line);
    // "Game Result: Game 3 ended in 8123 ms. Ai(2)-Mono Red has won!"
    // "Game Result: Game 4 ended in a Draw! Took 120000 ms."
    const m = line.match(/Game (\d+) ended(.*)/);
    if (m && /Game Result|has won|Draw/i.test(line)) {
      const g = { n: +m[1], ms: +(line.match(/(\d+) ms/) || [0, 0])[1] };
      const t = line.match(/turn (\d+)/i); if (t) g.turn = +t[1];
      // who went first: the first turn line of this game's log
      const t1 = gameLines.find(l => l.startsWith('Turn: ')), f = t1 && t1.match(/Ai\((\d+)\)/); if (f && +f[1] <= names.length) g.first = +f[1] - 1;
      if (/draw/i.test(m[2])) { g.winner = -1; results.draws++; }
      else {
        const ai = line.match(/Ai\((\d+)\)/);
        let idx = ai ? +ai[1] - 1 : -1;
        if (idx < 0 || idx >= names.length) idx = names.findIndex(n => line.includes(n));
        g.winner = idx;
        if (idx >= 0) results.wins[idx]++;
      }
      if (!results.games.some(x => x.n === g.n)) {
        results.games.push(g);
        try { cardstats.add(results.cards, cardstats.parseGame(gameLines, names, maps), g.winner); } catch (e) { results.warnings.length < 50 && results.warnings.push('card stats: ' + e.message); }
      }
      gameLines = [];
    }
    if (/not found|unknown card|could not|cannot find/i.test(line) && results.warnings.length < 50) results.warnings.push(line.trim());
  };
  const split = stream => {
    let buf = '';
    stream.on('data', d => { buf += d; const ls = buf.split(/\r?\n/); buf = ls.pop(); ls.forEach(handle); });
    stream.on('end', () => buf && handle(buf));
  };
  split(child.stdout); split(child.stderr);
  // a launcher that can't start (no java, no xvfb-run) fails this run, not the process that called it
  const done = new Promise(res => {
    child.on('error', e => { results.warnings.push('could not start ' + cmd + ': ' + e.message); res({ code: 1, results }); });
    child.on('close', code => res({ code, results }));
  });
  return { child, done, results };
}

// The same pairing through the bridge: `games` single-game matches (match i seeded seed + i),
// a pilot policy on the seats that have one and Forge's AI everywhere else, and the same
// results object runSim fills, updated live, with card stats from the same log parser.
function runPiloted({ decks, names, pilots, games, clock, seed, workDir, logDir, onLine, telemetry = null }) {
  const results = { names, wins: names.map(() => 0), draws: 0, games: [], warnings: [], cards: cardstats.empty(names.length), pilot: pilots };
  const maps = decks.map(cardstats.nameMap);
  let child = null, killed = false;
  const handle = { kill: sig => { killed = true; if (child) child.kill(sig); } };
  const done = require('./pilot').runMatches({
    decks: decks.map((d, i) => ({ ...d, name: names[i] })), matches: games, games: 1, seed: seed == null ? Date.now() % 2147483647 : seed,
    own: pilots.map(p => p ? ['priority', 'announce_x'] : []), policy: pilots, deadCards: readJson('dead-cards.json')[forgeVersion()] || [],
    simLog: true, clock: clock || 120, keepLogs: true, workDir, gameLog: logDir || null,
    onChild: c => { child = c; if (killed) c.kill('SIGKILL'); },
    onGame: g => {
      const r = { n: results.games.length + 1, ms: g.ms || 0, turn: g.turns, first: g.onThePlay, winner: g.winner, m: g.match || 0, g: g.game || 1 };
      if (g.winner === -1) results.draws++; else results.wins[g.winner]++;
      results.games.push(r);
      try { cardstats.add(results.cards, cardstats.parseGame(g.log || [], names, maps), g.winner); } catch (e) { results.warnings.length < 50 && results.warnings.push('card stats: ' + e.message); }
      onLine && onLine(`Game Result: Game ${r.n} ${g.winner === -1 ? 'ended in a Draw!' : 'ended in ' + r.ms + ' ms. Ai(' + (g.winner + 1) + ')-' + names[g.winner] + ' has won!'}${g.slow ? ' (time limit)' : ''}`);
    },
  }).then(res => {
    for (const e of res.errors) results.warnings.length < 50 && results.warnings.push(e.slice(0, 300));
    // the strategy's telemetry, from each game's log (written by the bridge once the game ends)
    if (telemetry && logDir) { const T = require('./telemetry'); for (const r of results.games) { try { const L = T.readLog(path.join(logDir, `m${String(r.m).padStart(3, '0')}-g${r.g}.jsonl.gz`)); const x = L && T.extract(L, telemetry); if (x) r.tm = x; } catch (e) { results.warnings.length < 50 && results.warnings.push('telemetry: ' + e.message); } } }
    return { code: res.code ?? (killed ? 137 : 0), results }; });
  return { child: handle, done, results };
}

module.exports = { runSim, forgeVersion, toDck, pilotFor, pilotTag, engine, engineKey };
