// Every setting the sim reads from its environment, in one place (WORKORDER-DESIGN-CODE-13OCT.md
// item 5). Each has its default and its parsing rule, kept exactly as the code had them; values
// are read on access, not at load, because the worker sets its own defaults (DATA_DIR,
// FORGE_XMX, USE_XVFB) before the other modules load. Nothing else touches process.env.
//
// Kinds: str (unset or empty -> default); or (a number, where 0, unset or junk -> default: the
// old `+v || d`); num (a number, 0 allowed, unset or empty -> default); on (true unless "0");
// list (comma separated); raw (the string or undefined). secret: masked when printed.
const os = require('os');
const path = require('path');

const S = (where, kind, def, note, secret) => ({ where, kind, def, note, secret: !!secret });
const SPEC = {
  // where the sim keeps things
  DATA_DIR: S('all', 'str', '/data', 'state files, caches, Forge HOME'),
  FORGE_DIR: S('all', 'str', '/opt/forge', 'Forge install'),
  FORGE_XMX: S('all', 'str', '3g', 'Java heap for each Forge process'),
  FORGE_JAVA_OPTS: S('all', 'str', '', 'extra JVM flags, space separated'),
  USE_XVFB: S('all', 'on', true, 'run Forge under xvfb'),
  // the pilot
  SIM_PILOT: S('all', 'on', true, 'our pilot for the decks that need one (0 = off)'),
  SIM_GAME_LOG: S('all', 'str', 'background', 'per-turn game logs: background (calibration and benchmark runs), all (every 1v1 Constructed game, about a third slower), or off; logged games go through the bridge'),
  PILOT_BRIDGE: S('all', 'str', path.join(__dirname, 'forge-pilot', 'bridge', 'build', 'mtg-bench-bridge.jar'), 'the bridge jar'),
  PILOT_STDERR: S('all', 'raw', undefined, 'append the bridge\'s stderr to this file (research)'),
  // the server
  PORT: S('server', 'or', 8088, 'HTTP port'),
  HOST: S('server', 'str', '127.0.0.1', 'HTTP interface'),
  STARSHARD_API: S('server', 'str', 'http://127.0.0.1:4001', 'Star Shard accounts API'),
  SIM_USERS: S('server', 'list', '', 'Star Shard usernames allowed in ("*" = any account)'),
  SIM_SIGNUP: S('server', 'str', 'closed', '"open" lets anyone make a simulator account; "closed" keeps the sim to the founders'),
  SIM_ADMINS: S('server', 'list', '', 'usernames who see spend and can cancel any run'),
  MAX_GAMES: S('server', 'or', 200, 'games a run may ask for'),
  SIM_RUNS_PER_DAY: S('server', 'or', 4, 'runs a member may start a day'),
  SIM_ASKS_PER_DAY: S('server', 'or', 25, 'coach questions a member may ask a day'),
  SIM_DAILY_BUDGET: S('server', 'num', 10, 'model spend a day, dollars (0 = none)'),
  SIM_PARALLEL: S('server', 'or', 3, 'games the server plays at once'),
  SIM_TARGET: S('server', 'or', 5, 'extra games until a close matchup\'s range is this many points'),
  SIM_EXTRA: S('server', 'num', 1, 'extra games, up to this many times the first pass'),
  SIM_WORKER_TOKEN: S('all', 'str', '', 'shared secret for remote workers', true),
  SIM_LEASE_MS: S('server', 'or', 120e3, 'a worker\'s pairing goes back in line after this long silent'),
  CALIBRATE_TOP: S('server', 'or', 10, 'meta decks in the weekly calibration round robin'),
  REAL_DAYS: S('server', 'or', 42, 'days of real tournament results counted'),
  GITHUB_TOKEN: S('server', 'raw', undefined, 'raises GitHub\'s rate limit for real results', true),
  // the model
  ANTHROPIC_API_KEY: S('server', 'raw', undefined, 'the coach and sideboard plans; unset = off', true),
  ANTHROPIC_BASE_URL: S('server', 'str', 'https://api.anthropic.com', 'model API'),
  COACH_MODEL: S('server', 'str', 'claude-opus-5-5', 'model for the coach and plans'),
  PRICE_IN: S('server', 'num', undefined, 'override, dollars per million input tokens'),
  PRICE_OUT: S('server', 'num', undefined, 'override, output'),
  PRICE_CACHE_WRITE: S('server', 'num', undefined, 'override, cache writes'),
  PRICE_CACHE_READ: S('server', 'num', undefined, 'override, cache reads'),
  // mail (mail.js, NOTE-TO-CODE-14OCT-EMAIL.md): Resend's REST API; unset key = no mail, and sign-in codes say so
  RESEND_API_KEY: S('server', 'raw', undefined, 'sends sign-in codes, the weekly digest and run-finished mail; unset = off', true),
  RESEND_WEBHOOK_SECRET: S('server', 'raw', undefined, 'whsec_... from the Resend webhook, for bounces and complaints', true),
  MAIL_FROM: S('server', 'str', 'Forge Sim <noreply@sim.starshard.net>', 'the From line'),
  MAIL_REPLY_TO: S('server', 'str', '', 'the Reply-To address (empty = none)'),
  SITE_URL: S('server', 'str', 'https://sim.starshard.net', 'the address links in mail point at'),
  // a remote worker
  SIM_URL: S('worker', 'str', 'https://sim.starshard.net', 'the server a worker serves'),
  WORKER_SLOTS: S('worker', 'or', Math.max(1, Math.floor(os.cpus().length / 2)), 'pairings a worker plays at once'),
  WORKER_NAME: S('worker', 'str', os.hostname().split('.')[0], 'the name a worker reports'),
  WORKER_AC_ONLY: S('worker', 'on', true, 'on a Mac, play only on mains power'),
  ARENA_OWNER: S('worker', 'str', '', 'the sim account whose Arena games this Mac reads (empty = off)'),
  ARENA_LOG_DIR: S('worker', 'str', path.join(os.homedir(), 'Library', 'Logs', 'Wizards Of The Coast', 'MTGA'), 'where MTG Arena writes Player.log'),
};

const env = process.env;
function parse(name) {
  const s = SPEC[name], v = env[name], blank = v == null || v === '';
  switch (s.kind) {
    case 'str': return blank ? s.def : v;
    case 'or': return +v || s.def;
    case 'num': return blank ? s.def : +v;
    case 'on': return v !== '0';
    case 'list': return String(v || '').split(',').map(x => x.trim()).filter(Boolean);
    default: return v;
  }
}

const config = {};
for (const name of Object.keys(SPEC)) Object.defineProperty(config, name, { get: () => parse(name), enumerable: true });

// A default for this process only, unless the environment already sets it (the worker's
// DATA_DIR, FORGE_XMX and USE_XVFB). Written to the environment so child processes inherit it.
config.preset = (name, value) => { if (!(name in SPEC)) throw new Error('unknown setting ' + name); if (env[name] == null || env[name] === '') env[name] = String(value); };
// The environment for a child process (Forge, the bridge): this process's, plus extras.
config.childEnv = (extra = {}) => ({ ...env, ...extra });

// Problems a person should fix: a number that isn't one.
config.problems = () => Object.keys(SPEC).filter(n => ['or', 'num'].includes(SPEC[n].kind) && env[n] != null && env[n] !== '' && !Number.isFinite(+env[n]))
  .map(n => `${n}=${JSON.stringify(env[n])} is not a number; using ${SPEC[n].def}`);

// The resolved settings for one role, secrets masked, as lines for the boot log.
config.describe = (role) => {
  const show = (n) => { const s = SPEC[n], v = parse(n), set = env[n] != null && env[n] !== '';
    const val = s.secret ? (v ? 'set' : 'unset') : Array.isArray(v) ? (v.length ? v.join(',') : '(none)') : v === undefined ? '(unset)' : String(v);
    return `  ${n.padEnd(20)} ${val}${set ? '' : '  (default)'}`; };
  return Object.keys(SPEC).filter(n => SPEC[n].where === 'all' || SPEC[n].where === role).map(show).concat(config.problems().map(p => '  ! ' + p)).join('\n');
};

config.SPEC = SPEC;
module.exports = config;
