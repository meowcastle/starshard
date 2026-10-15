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
const functional = require('./functional');

const SYSTEM = `You are the coach in Forge Sim, a deck-testing tool for a small group of Magic: The Gathering players. You are a strong competitive player and a plain-spoken teacher.

Your one job: make the player's deck do better at a competitive tournament against the current meta. Judge every suggestion by what it is worth there, in top-8 odds, not by how much it improves one matchup in isolation. A small gain against a deck that is 14% of the field can beat a big gain against one that is 3%. You are given what bringing each losing matchup to even is worth; use it to rank.

How you talk (the page's voice, design/VOICE-AND-LEXICON-15OCT.md). The reader grinds Standard; write the way a teammate texts after a testing session.
1. Number first, then the read: "Azorius Control 27% (11-49)", "57% vs the field (48-66)". Never "you win about 27 in 100 against".
2. The read is eight words or fewer: "Worst matchup.", "Too close to call yet.", "Real gap."
3. Don't explain the method (how Forge plays, calibration, noise, selection bias); the page has one place for that. Name the number and stop, unless the player asks how it works.
4. Hedge once at most, not on every number. Don't repeat "under Forge's AI", "check in your own testing" or "nothing is a verdict"; the page's trust line carries that.
5. Player shorthand, no filler: Bo3, G1, G2-3, post-board, play/draw, the 75, ins/outs, field, meta share, worst matchup, real gap. Cut "you can", "if you like", "so that", "which means". One clause per idea.
Example. Not: "You win about 27 in 100 against Azorius Control (likely 11-49%, clearly below even), and fixing that is worth the most of any matchup: +1.1 points of top-8 odds. You're also bringing in nothing after game 1 against every deck, while they all bring in cards against you." But: "Azorius Control 27% (11-49). Fixing it is your biggest top-8 gain, +1.1. You board nothing in; they all board in."

How the numbers you see were made: Forge's AI plays both decks, at least 20 games of game 1 and (when sideboard plans exist) 20 with both decks sideboarded per opponent, with more games added to the matchups that matter most and are closest, and games from earlier runs of the same list counted too. Who went first is recorded: game 1 is scored as a coin flip for the play, and the loser of each game plays first in the next, as in a real match. The match win rate combines them as a best of three. Forge's AI pilots aggressive creature decks well and control and combo decks badly, so every matchup is corrected ("calibrated") against real paper tournament results. The correction is held small unless there is a lot of real data behind it, so it rarely moves a matchup more than a few points. Always reason from the calibrated number, and say so when a matchup was not counted. The tournament odds count decks outside the ones played as even matchups; say so if the player leans on them.

Forge's results are a model, not a forecast, and they are checked against real tournaments; you are told how well they match ("Fidelity"). When the match is weak: say so once (not on every number); where Forge's verdict on an opponent clashes with how that archetype does in real events (given per matchup), say so and lean on your own knowledge of the real matchup; and prefer advice that is sound whatever the sim says (a card that answers a real threat, a cleaner mana base) over advice that only chases a Forge number. Never tell the player their real tournament odds as if the sim had measured them.

Every number comes with a 95% range. Read it: with 40 games a single matchup's range is typically 30 to 40 points wide, so one matchup at 35% and another at 45% are not meaningfully different. Only call something a weakness or a strength when its range sits clearly on one side of 50%, and say "too close to call yet" when the games can't tell (a rerun adds games rather than replacing them).

Rules: use only the numbers and lists you are given; never invent a statistic. Name cards exactly as printed. Be concrete: which card, how many, against which deck, why. No hype, no filler, short paragraphs. If the player has written notes (an event date, cards that must stay, a wildcard budget), respect them.`;

const pct = x => Math.round(x * 100) + '%';
const span = s => `${pct(s.p)} (likely ${Math.round(s.lo * 100)}-${Math.round(s.hi * 100)}%)`;

// Every matchup as the page shows it, as text.
function matchups(rv) {
  const cal = rv.calibration && Object.values(rv.calibration.opp || {}).some(Boolean) ? rv.calibration : null;
  return (rv.opponents || []).map((o, i) => {
    const s = o.score; if (!s) return `- ${o.name}: not played yet`;
    const n2 = o.post ? o.post.wins[0] + o.post.wins[1] : 0;
    const c = cal && cal.opp[o.name];
    const pool = o.pooled ? `; with ${o.pooled.runs} earlier run${o.pooled.runs === 1 ? '' : 's'} of this list counted, game 1 ${o.pooled.pre[0]}-${o.pooled.pre[1]}${o.pooled.post[0] + o.pooled.post[1] ? ', sideboarded ' + o.pooled.post[0] + '-' + o.pooled.post[1] : ''} in all` : '';
    const pd = s.n1 >= 20 ? `; game 1 ${pct(s.onPlay)} on the play, ${pct(s.onDraw)} on the draw` : '';
    const plan = o.plan && !o.plan.error ? `; your plan: in ${o.plan.me.in.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}, out ${o.plan.me.out.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}; their plan: in ${o.plan.opp.in.map(x => x.qty + ' ' + x.name).join(', ') || 'nothing'}` : '';
    const real = c && c.real ? `; in real tournaments (paper and MTGO) this archetype wins ${pct(c.real.w / Math.max(1, c.real.w + c.real.l))} of ${c.real.w + c.real.l} matches against ${c.real.vs || 'the other field decks'}` : '';
    const loss = rv.event && o.metaPct != null && s.counted ? `; costs you ${(o.metaPct * (1 - s.p)).toFixed(1)} losses in 100 field matches` : '';
    const ai = rv.aiCards && rv.aiCards.opp[i], aiT = ai ? [ai.missing.length ? '; Forge doesn\'t have ' + ai.missing.map(x => x.qty + ' ' + x.name).join(', ') + ' (played without them)' : '', ai.unplayable.length ? '; Forge\'s AI won\'t cast ' + ai.unplayable.map(x => x.qty + ' ' + x.name).join(', ') : '', ai.limited.length ? '; Forge\'s AI casts ' + ai.limited.map(x => x.qty + ' ' + x.name).join(', ') + ' only situationally' : ''].join('') : '';
    return `- ${o.name} (${o.metaPct != null ? o.metaPct.toFixed(1) + '% of the field' : 'team deck'}${o.style ? ', ' + o.style.why + ' that Forge pilots badly' + (c ? '' : ', not counted') : ''}): this run game 1 ${o.wins[0]}-${o.wins[1]}${n2 ? ', sideboarded ' + o.post.wins[0] + '-' + o.post.wins[1] : ''}${pool}${pd}; match ${c ? pct(s.raw) + ' raw, ' + span(s) + ' calibrated' : span(s)}${loss}${real}${aiT}${plan}`;
  }).join('\n');
}

function context(b, rv) {
  const v = b.versions.find(x => x.v === rv.v) || b.versions[b.versions.length - 1];
  const list = (l) => l.map(c => c.qty + ' ' + c.name).join('\n') || '(none)';
  const hist = b.versions.map(x => `v${x.v}${x.diff ? ': ' + x.diff.map(c => (c.qty > 0 ? '+' : '') + c.qty + ' ' + c.name + (c.section === 'side' ? ' (side)' : '')).join(', ') : ': first paste'}`).join('\n');
  const bm = rv.benchmark && rv.benchmark.status === 'done' ? `The field's #1 deck (${rv.benchmark.name}) ran the same opponents under the same AI for comparison.` : '';
  const cal = rv.calibration;
  return `Brew: "${b.name}", ${b.format}, version v${v.v}.
Player's notes: ${b.notes.map(n => n.t).join(' | ') || 'none'}.${settingsText(rv)}
Version history:
${hist}

${v.reading ? `How the list reads (rules on its cards' functions, research's plan table): ${v.reading.plan} (${v.reading.why})${v.reading.nearest ? `, closest to the meta deck ${v.reading.nearest}${v.reading.nearestPlan && v.reading.nearestPlan !== v.reading.plan ? ` (which plays as ${v.reading.nearestPlan})` : ''}` : ''}.${v.reading.missing.length ? ' Against that deck and the plan: ' + v.reading.missing.join('; ') + '.' : ' Nothing stands out against that deck and the plan.'} Use the plan to frame advice (what this kind of deck needs, how it should be piloted), and say "reads as" rather than asserting it.\n\n` : ''}Main deck (v${v.v}):
${list(v.list.main)}
Sideboard:
${list(v.list.side || [])}

Run: against the ${rv.field ? rv.field.label + ' field of ' + new Date(rv.field.date).toDateString() : 'field'}, status ${rv.status}, ${rv.played} of ${rv.total} games played. ${rv.bo3 === 'boarded' ? 'Best of three with sideboard plans.' : 'Game 1 only.'}
${cal ? `Calibrated against ${cal.realGames} paper games from ${cal.events} tournaments over ${cal.days} days; the brew reads as closest to ${cal.me.near || 'no meta deck (treated as an average pilot)'}.` : 'Not calibrated yet.'} ${bm}
Fidelity: ${fidelityText(cal && cal.fidelity)}${deckFidelityText(cal && cal.deckFidelity)}

Headline: ${headline(rv)}.${rv.aiCards && rv.aiCards.mine ? `
The brew as Forge played it: ${[rv.aiCards.mine.missing.length ? 'Forge does not have ' + rv.aiCards.mine.missing.map(x => x.qty + ' ' + x.name).join(', ') + ', so the deck played without them' : '', rv.aiCards.mine.unplayable.length ? 'Forge\'s AI will not cast ' + rv.aiCards.mine.unplayable.map(x => x.qty + ' ' + x.name).join(', ') : '', rv.aiCards.mine.limited.length ? 'it casts ' + rv.aiCards.mine.limited.map(x => x.qty + ' ' + x.name).join(', ') + ' only situationally' : ''].filter(Boolean).join('; ')}. Discount anything the numbers say about those cards.` : ''}

Matchups:
${matchups(rv)}${levers(rv)}${cardsText(rv.cards)}${functional.text(rv.functional)}`;
}

// What the player has told the coach (COACH-PARAMETERS-13OCT.md part 1), and the ledger of earlier suggestions.
const LEVEL = {
  learning: 'The player is learning: spell out why, name each matchup\'s role (who is the beatdown), and avoid jargon.',
  competitive: '',
  grinder: 'The player is an experienced grinder: lead with the numbers and the swap; skip the basics.',
};
function settingsText(rv) {
  const st = rv.settings, ev = rv.eventInfo; if (!st || !ev) return '';
  const lines = [];
  lines.push(`Preparing for: ${ev.label}${st.goal.date ? ' on ' + st.goal.date : ''}${ev.noTop8 ? ' (a ladder: no top 8, so judge changes by match win rate and say "points of win rate", not top-8 odds)' : `, ${ev.rounds} rounds, top 8 at ${ev.rounds - 1}-1 or better`}${ev.bo3 ? '' : '; best of one, so sideboards do not count'}.`);
  lines.push(st.goal.posture === 'ceiling' ? 'Posture: ceiling. The player accepts variance for a higher top-8 chance: big swings in the matchups that matter most are welcome.' : 'Posture: consistent. Prefer changes that raise the floor (mana, curve, the worst matchup) over high-variance swings.');
  if (st.keep.length) lines.push(`Cards to keep, never suggest cutting: ${st.keep.join(', ')}. If a fix would need one of them, say so.`);
  if (st.never.length) lines.push(`Cards the player won't play, never suggest adding: ${st.never.join(', ')}.`);
  if (st.budget) lines.push(`Budget: ${st.budget.rare || 0} rare and ${st.budget.mythic || 0} mythic wildcards${st.budget.paper != null ? `, $${st.budget.paper} in paper` : ''}; keep suggestions inside it and say what each costs.`);
  if (LEVEL[st.level]) lines.push(LEVEL[st.level]);
  if (rv.ledger && rv.ledger.length) {
    const p = x => x ? Math.round(x.p * 100) + '%' : '?';
    lines.push('What your earlier suggestions did when tested (do not suggest again a change that was tested and did not help; build on the ones that did):\n' + rv.ledger.map(l => `- ${l.title} (${l.change}) as v${l.v}: ${p(l.before)} -> ${p(l.after)}, ${l.verdict}`).join('\n'));
  }
  return '\n' + lines.join('\n');
}

// How well Forge's matchups have carried over to real tournaments (calib.js fidelity), in words.
function deckFidelityText(d) { return d ? ` Overall deck strength: Forge's per-deck win rates against real match records correlate r = ${d.r.toFixed(2)} (likely ${d.lo.toFixed(2)} to ${d.hi.toFixed(2)}) over ${d.decks} decks.` : ''; }
function fidelityText(f) {
  if (!f) return 'not yet checked against real tournaments.';
  const k = `k = ${f.k.toFixed(2)}, likely ${f.lo.toFixed(2)} to ${f.hi.toFixed(2)}, from ${f.realGames} real games across ${f.pairs} meta matchups (1 means Forge's matchups carry over to real play as they are, 0 that they carry no information)`;
  return f.hi < 0.5 ? `weak. Forge's matchup numbers have not yet predicted real results better than a coin flip (${k}).`
    : f.lo >= 0.7 ? `good (${k}).` : `partial: real matchups run in Forge's direction but smaller (${k}).`;
}

// The card table from the game logs, as text. Drawn-but-never-cast is not in Forge's
// log, so a card's cast rate mixes "not drawn" with "drawn and stuck".
function cardsText(cs) {
  if (!cs) return '';
  const r1 = x => x == null ? '-' : x.toFixed(1), p = x => x == null ? '-' : pct(x);
  const mine = cs.rows.map(r => `- ${r.side ? '(sideboard) ' : r.qty + ' '}${r.name}: cast in ${p(r.castPct)} of games${r.turn ? ', first on turn ' + r1(r.turn) : ''}; won ${p(r.won)} when cast vs ${p(r.wonNot)} when not${r.lift == null ? ' (too few games to compare)' : ''}${r.dmg >= 0.5 ? '; ' + r1(r.dmg) + ' damage a game' : ''}${r.discards ? '; discarded ' + r.discards + ' times' : ''}${r.ai === 'unplayable' ? '; Forge\'s AI won\'t cast this card, so its numbers say nothing about it' : r.ai === 'limited' ? '; Forge\'s AI casts this only situationally, so its numbers understate it' : ''}`).join('\n');
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
  const E = rv.event, oneIn = p => p < 0.01 ? 'under 1 in 100' : '1 in ' + Math.round(1 / p);
  const ev = E ? `. Against the whole field (the ${Math.round(E.rest)}% not played counted as even) it wins ${pct(E.field.p)} of matches (likely ${Math.round(E.field.lo * 100)}-${Math.round(E.field.hi * 100)}%); at a ${E.rounds}-round Swiss tournament it makes top 8 (${E.rounds - 1}-1 or better) about ${oneIn(E.top8.p)} (likely ${oneIn(E.top8.lo)} to ${oneIn(E.top8.hi)})`
    + (E.bench ? `; ${E.bench.name}, the field's #1 deck, wins ${pct(E.bench.field.p)} and makes top 8 about ${oneIn(E.bench.top8.p)}, and the chance this brew is ahead of it is ${pct(E.bench.edge.above)}` : '') : '';
  return rv.score ? span(rv.score) + ' of matches against the decks played' + (cal ? ', calibrated' : '') + bs + ev : 'no matches yet';
}
// what each losing matchup is worth at the tournament, brought to even
function levers(rv) {
  const E = rv.event; if (!E || !E.levers.length) return '';
  return '\n\nWhat bringing each losing matchup to even is worth at the tournament:\n' + E.levers.map(l => `- ${l.name}: top-8 odds +${(l.gain * 100).toFixed(1)} points (wins ${pct(l.p)} now)`).join('\n');
}

// The functional check for the run's version, added to the run before the coach reads it.
// The field's lists come from the server (the calibration's meta decks), set with useField.
let fieldOf = () => null;
function useField(fn) { fieldOf = fn; }
async function withCheck(b, rv) {
  if (b.seats === 4 || !rv) return rv;
  const v = b.versions.find(x => x.v === rv.v) || b.versions[b.versions.length - 1];
  try { return { ...rv, functional: await functional.check(v.list, fieldOf(b.format), rv.calibration?.me?.near || null) }; } catch { return rv; }
}

async function writeup(b, rv) {
  rv = await withCheck(b, rv);
  return claude.ask({ system: SYSTEM,
    prompt: context(b, rv) + `\n\nThe page shows the headline: ${headline(rv)}.\n\nWrite the readout for this run: the single matchup or problem costing the most top-8 odds, or a failed functional check, which comes first (weakness, a few words) and why in one or two sentences (weaknessNote); two or three fixes the player could test, ranked by what they should be worth at the tournament, each a concrete main-deck swap (cards out of the main deck, cards in from anywhere legal in ${b.format}, equal numbers) with a title and one or two sentences of why, or kind "note" for advice that isn't a swap, each graded: evidence "strong" when the matchup it targets has a range clearly on one side of 50% and the change is worth a point or more of top-8 odds, "weak" when that matchup's range straddles 50%, "untested" when the reason comes from your own knowledge rather than these games, with a one-line basis quoting the numbers ("Azorius 3-17 over 20 games, range 8-32%"); and a summary of two to four short sentences that opens the conversation, in the voice above (number first, then the read).`,
    tool: { name: 'coach_readout', description: 'The coach readout for one run.', schema: { type: 'object', properties: {
      weakness: { type: 'string' }, weaknessNote: { type: 'string' }, summary: { type: 'string' },
      options: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, detail: { type: 'string' }, kind: { type: 'string', enum: ['swap', 'note'] }, in: SWAP, out: SWAP, evidence: { type: 'string', enum: ['strong', 'weak', 'untested'] }, basis: { type: 'string' } }, required: ['title', 'detail', 'kind', 'evidence', 'basis'] } },
    }, required: ['weakness', 'weaknessNote', 'summary', 'options'] } } });
}

async function reply(b, rv, thread, { onText } = {}) {
  rv = await withCheck(b, rv);
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
  return claude.chat({ system, messages: msgs, onText });
}

// The coach's other modes (COACH-PARAMETERS-13OCT.md part 1, item 3), run on request. The sideboard guide
// is structured (one row per opponent); the rest are prose for the thread. Same grounding as the
// readout: only the numbers in the context.
const MODES = {
  sideboard: 'Write a sideboard guide for this run\'s opponents: for each, what comes in and out (from the sideboard plans above where they exist; improve them where the numbers say they are wrong), why in one sentence, and the role this deck takes after boarding (beatdown or control).',
  pilot: 'Explain how to play this deck against {opp}: who is the beatdown and why (speed, damage, removal, inevitability; Flores\' question), what to hold, what to answer on sight, what to play around, and when the role switches. Plain prose, at most 250 words. Use the matchup numbers above and say when they are thin.',
  mulligan: 'Write mulligan guidance for this list: by matchup class (aggro, midrange, control, combo opponents), which seven-card hands to keep and which to ship, with two example hands each from this list. A short table in prose: hand shape, keep or ship, why.',
  mana: 'Review the mana: land count, colour sources against the cards that need them (the functional check above), the curve for this deck\'s plan, and what to change. Concrete swaps with counts.',
  review: 'Review this brew\'s version history: what each change did (compare the runs of each version above and say when a difference is inside the noise), what has worked, and what to try next.',
};
const GUIDE = { type: 'object', properties: { rows: { type: 'array', items: { type: 'object', properties: { opponent: { type: 'string' }, in: SWAP, out: SWAP, why: { type: 'string' }, role: { type: 'string', enum: ['beatdown', 'control'] } }, required: ['opponent', 'in', 'out', 'why', 'role'] } } }, required: ['rows'] };
async function mode(b, rv, which, { opp, onText } = {}) {
  rv = await withCheck(b, rv);
  const ask = MODES[which]; if (!ask) throw new Error('no such mode');
  const prompt = context(b, rv) + '\n\n' + ask.replace('{opp}', opp || 'its worst matchup');
  if (which === 'sideboard') return claude.ask({ system: SYSTEM, prompt, tool: { name: 'sideboard_guide', description: 'A sideboard guide, one row per opponent.', schema: GUIDE } });
  return claude.chat({ system: SYSTEM, messages: [{ role: 'user', content: prompt }], onText });
}

module.exports = { writeup, reply, context, headline, useField, mode, MODES: Object.keys(MODES) };
