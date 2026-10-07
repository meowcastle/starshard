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
const calib = require('./calib');

const SYSTEM = `You are the coach in Forge Sim, a deck-testing tool for a small group of Magic: The Gathering players. You are a strong competitive player and a plain-spoken teacher.

How the numbers you see were made: Forge's AI plays both decks, 20 games of game 1 and (when sideboard plans exist) 20 games with both decks sideboarded per opponent. The match win rate combines them as a best of three. Forge's AI pilots aggressive creature decks well and control and combo decks badly, so every matchup is corrected ("calibrated") against real paper tournament results where enough exist. Always reason from the calibrated number when there is one, and say so when a matchup was not counted or not calibrated. 20 games per side means about plus or minus 11 points per matchup; do not treat small differences as real.

Rules: use only the numbers and lists you are given; never invent a statistic. Name cards exactly as printed. Be concrete: which card, how many, against which deck, why. No hype, no filler, short paragraphs. If the player has written notes (an event date, cards that must stay, a wildcard budget), respect them.`;

const pct = x => Math.round(x * 100) + '%';
const sm = (w, n) => (w + 0.5) / (n + 1);

// Every matchup as the page shows it, as text.
function matchups(rv) {
  const cal = rv.calibration && Object.values(rv.calibration.opp || {}).some(Boolean) ? rv.calibration : null;
  const meBeta = cal ? cal.me.beta : 0;
  return (rv.opponents || []).map(o => {
    const n1 = o.wins[0] + o.wins[1]; if (!n1) return `- ${o.name}: not played yet`;
    const n2 = o.post ? o.post.wins[0] + o.post.wins[1] : 0;
    const p1 = sm(o.wins[0], n1), p2 = n2 ? sm(o.post.wins[0], n2) : p1;
    const c = cal && cal.opp[o.name], d = c ? c.beta - meBeta : 0;
    const raw = calib.match(p1, p2), fixed = calib.match(calib.inv(calib.logit(p1) + d), calib.inv(calib.logit(p2) + d));
    const plan = o.plan && !o.plan.error ? `; your plan: in ${o.plan.me.in.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}, out ${o.plan.me.out.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}; their plan: in ${o.plan.opp.in.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}` : '';
    const real = c && c.real ? `; this archetype wins ${pct(c.real.w / Math.max(1, c.real.w + c.real.l))} of ${c.real.w + c.real.l} paper games` : '';
    return `- ${o.name} (${o.metaPct != null ? o.metaPct.toFixed(1) + '% of the field' : 'team deck'}${o.style ? ', ' + o.style.why + ' that Forge pilots badly' + (c ? '' : ', not counted') : ''}): game 1 ${o.wins[0]}-${o.wins[1]}${n2 ? ', sideboarded ' + o.post.wins[0] + '-' + o.post.wins[1] : ''}; match ${pct(raw)} raw${c ? ', ' + pct(fixed) + ' calibrated' : ''}${real}${plan}`;
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

Matchups:
${matchups(rv)}`;
}

const SWAP = { type: 'array', items: { type: 'object', properties: { qty: { type: 'integer' }, name: { type: 'string' } }, required: ['qty', 'name'] } };
// The headline the page shows: match win rate, weighted by meta share, counting a
// deck Forge pilots badly only once calibration has corrected it.
function headline(rv) {
  const cal = rv.calibration && Object.values(rv.calibration.opp || {}).some(Boolean) ? rv.calibration : null, meBeta = cal ? cal.me.beta : 0;
  let num = 0, den = 0;
  for (const o of rv.opponents || []) {
    const n1 = o.wins[0] + o.wins[1]; if (!n1) continue;
    const c = cal && cal.opp[o.name]; if (o.style && !c) continue;
    const n2 = o.post ? o.post.wins[0] + o.post.wins[1] : 0, p1 = sm(o.wins[0], n1), p2 = n2 ? sm(o.post.wins[0], n2) : p1, d = c ? c.beta - meBeta : 0;
    const wt = o.metaPct != null ? o.metaPct : 1; num += calib.match(calib.inv(calib.logit(p1) + d), calib.inv(calib.logit(p2) + d)) * wt; den += wt;
  }
  return den ? pct(num / den) + ' of matches' + (cal ? ', calibrated' : '') : 'no matches yet';
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
  return claude.chat({ system: SYSTEM + '\n\nThe current state of this brew:\n\n' + context(b, rv) + (said.length ? '\n\nWhat you already told the player:\n' + said.join('\n\n') : ''), messages: msgs });
}

module.exports = { writeup, reply, context, headline };
