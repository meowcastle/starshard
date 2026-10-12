// The coach: Opus 5.5 reading a brew's runs. Two jobs.
//
// writeup(): once per finished run, the readout's words: the weakness and why,
// two or three concrete fixes (card swaps the page can test with one click), and
// a short summary that opens the thread. The headline numbers are NOT the
// model's: the page computes them from the games, so the coach can't invent a
// win rate; it is handed the same numbers and told to use only those.
//
// reply(): the conversation. Each turn sends the brew's context plus the recent
// thread, so the coach always answers from the current results.
const claude = require('./claude');

const SYSTEM = `You are the coach in Forge Sim, a deck-testing tool for a small group of Magic: The Gathering players. You are a strong competitive player and a plain-spoken teacher.

How the numbers you see were made: Forge's AI plays both decks, at least 20 games of game 1 and (when sideboard plans exist) 20 with both decks sideboarded per opponent, with more games added to the matchups that matter most and are closest, and games from earlier runs of the same list counted too. Who went first is recorded: game 1 is scored as a coin flip for the play, and the loser of each game plays first in the next, as in a real match. The match win rate combines them as a best of three. Forge's AI pilots aggressive creature decks well and control and combo decks badly, so every matchup is corrected ("calibrated") against real paper tournament results where enough exist. Always reason from the calibrated number when there is one, and say so when a matchup was not counted or not calibrated.

Every number comes with a 95% range. Read it: with 40 games a single matchup's range is typically 30 to 40 points wide, so one matchup at 35% and another at 45% are not meaningfully different. Only call something a weakness or a strength when its range sits clearly on one side of 50%, and say plainly when the games can't tell yet (and that a rerun adds games rather than replacing them).

Rules: use only the numbers and lists you are given; never invent a statistic. Name cards exactly as printed. Be concrete: which card, how many, against which deck, why. No hype, no filler, short paragraphs. If the player has written notes (an event date, cards that must stay, a wildcard budget), respect them.`;

const pct = x => Math.round(x * 100) + '%';
const span = s => `${pct(s.p)} (likely ${Math.round(s.lo * 100)}-${Math.round(s.hi * 100)}%)`;

// Every matchup as the page shows it, as text.
function matchups(rv) {
  const cal = rv.calibration && Object.values(rv.calibration.opp || {}).some(Boolean) ? rv.calibration : null;
  return (rv.opponents || []).map(o => {
    const s = o.score; if (!s) return `- ${o.name}: not played yet`;
    const n2 = o.post ? o.post.wins[0] + o.post.wins[1] : 0;
    const c = cal && cal.opp[o.name];
    const pool = o.pooled ? `; with ${o.pooled.runs} earlier run${o.pooled.runs === 1 ? '' : 's'} of this list counted, game 1 ${o.pooled.pre[0]}-${o.pooled.pre[1]}${o.pooled.post[0] + o.pooled.post[1] ? ', sideboarded ' + o.pooled.post[0] + '-' + o.pooled.post[1] : ''} in all` : '';
    const pd = s.n1 >= 20 ? `; game 1 ${pct(s.onPlay)} on the play, ${pct(s.onDraw)} on the draw` : '';
    const plan = o.plan && !o.plan.error ? `; your plan: in ${o.plan.me.in.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}, out ${o.plan.me.out.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}; their plan: in ${o.plan.opp.in.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}` : '';
    const real = c && c.real ? `; this archetype wins ${pct(c.real.w / Math.max(1, c.real.w + c.real.l))} of ${c.real.w + c.real.l} paper games` : '';
    return `- ${o.name} (${o.metaPct != null ? o.metaPct.toFixed(1) + '% of the field' : 'team deck'}${o.style ? ', ' + o.style.why + ' that Forge pilots badly' + (c ? '' : ', not counted') : ''}): this run game 1 ${o.wins[0]}-${o.wins[1]}${n2 ? ', sideboarded ' + o.post.wins[0] + '-' + o.post.wins[1] : ''}${pool}${pd}; match ${c ? pct(s.raw) + ' raw, ' + span(s) + ' calibrated' : span(s)}${real}${plan}`;
  }).join('\n');
}

function context(b, rv) {
  const v = b.versions.find(x => x.v === rv.v) || b.versions[b.versions.length - 1];
  const list = (l) => l.map(c => c.qty + ' ' + c.name).join('\n') || '(none)';
  const hist = b.versions.map(x => `v${x.v}${x.diff ? ': ' + x.diff.map(c => (c.qty > 0 ? '+' : '') + c.qty + ' ' + c.name + (c.section === 'side' ? ' (side)' : '')).join(', ') : ': first paste'}`).join('\n');
  const bm = rv.benchmark && rv.benchmark.status === 'done' ? `The field's #1 deck (${rv.benchmark.name}) ran the same opponents under the same AI for comparison.` : '';
  const cal = rv.calibration;
  return `Brew: "${b.name}", ${b.format}, version v${v.v}.
Player's notes: ${b.notes.map(n => n.t).join(' | ') || 'none'}.
Version history:
${hist}

Main deck (v${v.v}):
${list(v.list.main)}
Sideboard:
${list(v.list.side || [])}

Run: against the ${rv.field ? rv.field.label + ' field of ' + new Date(rv.field.date).toDateString() : 'field'}, status ${rv.status}, ${rv.played} of ${rv.total} games played. ${rv.bo3 === 'boarded' ? 'Best of three with sideboard plans.' : 'Game 1 only.'}
${cal ? `Calibrated against ${cal.realGames} paper games from ${cal.events} tournaments over ${cal.days} days; the brew reads as closest to ${cal.me.near || 'no meta deck (treated as an average pilot)'}.` : 'Not calibrated yet.'} ${bm}

Headline: ${headline(rv)}.

Matchups:
${matchups(rv)}${cardsText(rv.cards)}`;
}

// The card table from the game logs, as text. Drawn-but-never-cast is not in Forge's
// log, so a card's cast rate mixes "not drawn" with "drawn and stuck".
function cardsText(cs) {
  if (!cs) return '';
  const r1 = x => x == null ? '-' : x.toFixed(1), p = x => x == null ? '-' : pct(x);
  const mine = cs.rows.map(r => `- ${r.side ? '(sideboard) ' : r.qty + ' '}${r.name}: cast in ${p(r.castPct)} of games${r.turn ? ', first on turn ' + r1(r.turn) : ''}; won ${p(r.won)} when cast vs ${p(r.wonNot)} when not${r.lift == null ? ' (too few games to compare)' : ''}${r.dmg >= 0.5 ? '; ' + r1(r.dmg) + ' damage a game' : ''}${r.discards ? '; discarded ' + r.discards + ' times' : ''}`).join('\n');
  const th = cs.threats.map(t => `- ${t.name} (${t.opp}): cast in ${t.cast} of ${t.games} games; you won ${pct(t.you)} of those vs ${pct(t.base)} overall in that matchup${t.dmg >= 1 ? '; ' + r1(t.dmg) + ' damage a game it was cast' : ''}`).join('\n');
  return `

How each card played, read from the game logs (${cs.games} games, ${cs.mull.toFixed(2)} mulligans a game). "Won when cast" has selection bias: cards get cast in longer games and in games already going well, so a cheap card's number reads lower and a top-end card's higher. Treat differences under 10 points as noise, and lean on the comparison only where both sides have ${cs.minCast}+ games. A low cast rate mixes "not drawn" with "drawn and stuck in hand"; Forge's log does not show draws.
${mine}${th ? `

The opposing cards that cost you most:
${th}` : ''}`;
}

const SWAP = { type: 'array', items: { type: 'object', properties: { qty: { type: 'integer' }, name: { type: 'string' } }, required: ['qty', 'name'] } };
// The headline the page shows: match win rate, weighted by meta share, counting a
// deck Forge pilots badly only once calibration has corrected it.
function headline(rv) {
  const cal = rv.calibration && Object.values(rv.calibration.opp || {}).some(Boolean);
  const bs = rv.benchScore ? `; the field's #1 deck scores ${span(rv.benchScore.theirs)} on the same ${rv.benchScore.k} opponents, a gap of ${Math.round(rv.benchScore.edge.p * 100)} points (likely ${Math.round(rv.benchScore.edge.lo * 100)} to ${Math.round(rv.benchScore.edge.hi * 100)})` : '';
  return rv.score ? span(rv.score) + ' of matches' + (cal ? ', calibrated' : '') + bs : 'no matches yet';
}

async function writeup(b, rv) {
  return claude.ask({ system: SYSTEM,
    prompt: context(b, rv) + `\n\nThe page shows the headline: ${headline(rv)}.\n\nWrite the readout for this run: the single matchup or problem costing the most (weakness, a few words) and why in one or two sentences (weaknessNote); two or three fixes the player could test, each a concrete main-deck swap (cards out of the main deck, cards in from anywhere legal in ${b.format}, equal numbers) with a title and one or two sentences of why, or kind "note" for advice that isn't a swap; and a summary of two to four sentences that opens the conversation.`,
    tool: { name: 'coach_readout', description: 'The coach readout for one run.', schema: { type: 'object', properties: {
      weakness: { type: 'string' }, weaknessNote: { type: 'string' }, summary: { type: 'string' },
      options: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, detail: { type: 'string' }, kind: { type: 'string', enum: ['swap', 'note'] }, in: SWAP, out: SWAP }, required: ['title', 'detail', 'kind'] } },
    }, required: ['weakness', 'weaknessNote', 'summary', 'options'] } } });
}

async function reply(b, rv, thread) {
  // roles alternate, and the conversation opens with the player: what the coach said
  // before the player's first message (the run summaries) goes in as context instead
  const msgs = [], said = [];
  for (const m of thread.slice(-20)) {
    const role = m.role === 'user' ? 'user' : 'assistant';
    if (!msgs.length && role === 'assistant') { said.push(m.text); continue; }
    if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n\n' + m.text; else msgs.push({ role, content: m.text });
  }
  // Cached in two places, so a follow-up question within a few minutes pays a fraction
  // for everything it repeats: the brew's context (the same for every question about
  // this run) and the conversation so far. Anthropic skips caching below its minimum
  // length rather than failing, so a short context just goes uncached.
  const system = [{ type: 'text', text: SYSTEM + '\n\nThe current state of this brew:\n\n' + context(b, rv), cache_control: { type: 'ephemeral' } }];
  if (said.length) system.push({ type: 'text', text: 'What you already told the player:\n' + said.join('\n\n') });
  const last = msgs[msgs.length - 1];
  if (last) msgs[msgs.length - 1] = { role: last.role, content: [{ type: 'text', text: last.content, cache_control: { type: 'ephemeral' } }] };
  return claude.chat({ system, messages: msgs });
}

module.exports = { writeup, reply, context, headline };
