// Runs Forge's headless simulator and parses its output into structured results.
// Forge CLI: sim -d <a.dck> <b.dck> ... -D <dir> -n <games> [-f Commander] -c <clock>
// Not quiet: each game's full log is read for card-level stats (cardstats.js).
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cardstats = require('./cardstats');

const FORGE_DIR = process.env.FORGE_DIR || '/opt/forge';
const XMX = process.env.FORGE_XMX || '3g';

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
function toDck(name, deck) {
  const sec = { Main: deck.main || [], Sideboard: deck.side || [], Commander: deck.commander || [] };
  let out = `[metadata]\nName=${name}\n`;
  for (const [k, cards] of Object.entries(sec)) {
    if (!cards.length) continue;
    out += `[${k}]\n` + cards.map(c => `${c.qty} ${c.name}`).join('\n') + '\n';
  }
  return out;
}

const safe = s => String(s).replace(/[^A-Za-z0-9 _'.,-]/g, '').trim().slice(0, 60) || 'Deck';

// Run one Forge process. onLine gets every stdout/stderr line; returns {child, done}.
function runSim({ decks, games, format, clock, workDir, onLine }) {
  fs.mkdirSync(workDir, { recursive: true });
  // Forge's AI plays a deck defensively only when its name contains "Control" (or
  // its average mana value is over 3), so a control brew called "Squall" would get
  // attack logic meant for aggro. A deck marked ai: 'control' carries the word.
  const forgeName = d => { const n = safe(d.name); return d.ai === 'control' && !/control/i.test(n) ? n.slice(0, 52) + ' Control' : n; };
  const names = decks.map((d, i) => {
    let n = forgeName(d);
    if (decks.slice(0, i).some(o => forgeName(o) === n)) n += ` (${i + 1})`;
    return n;
  });
  const files = decks.map((d, i) => {
    const f = `deck${i + 1}.dck`;
    fs.writeFileSync(path.join(workDir, f), toDck(names[i], d));
    return f;
  });
  const args = [
    `-Xmx${XMX}`, '-Djava.awt.headless=true',
    '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
    '--add-opens', 'java.base/java.util=ALL-UNNAMED',
    '--add-opens', 'java.desktop/java.awt=ALL-UNNAMED',
    '-jar', findJar(), 'sim',
    '-d', ...files, '-D', workDir,
    '-n', String(games), '-c', String(clock || 120),
  ];
  if (format && format !== 'Constructed') args.push('-f', format);
  // an AI profile per seat (res/ai/<name>.ai), only when one is asked for; Forge's own default otherwise
  if (decks.some(d => d.profile)) args.push('-a', ...decks.map(d => d.profile || 'Default'));
  const useXvfb = process.env.USE_XVFB !== '0';
  const cmd = useXvfb ? 'xvfb-run' : 'java';
  const argv = useXvfb ? ['-a', 'java', ...args] : args;
  const child = spawn(cmd, argv, { cwd: FORGE_DIR, env: { ...process.env, HOME: process.env.DATA_DIR || '/data' } });

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
  const done = new Promise(res => child.on('close', code => res({ code, results })));
  return { child, done, results };
}

module.exports = { runSim, forgeVersion, toDck };
