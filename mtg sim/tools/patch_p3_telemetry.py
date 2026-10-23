# Patch 19, P3 of the strategy-first rebuild (HANDOFF 23 Oct §4 P3; E2, E3, E0 layer 3): what the games say about the
# strategy. Under the latest test's verdict, "Is the strategy happening?" (first solo attack, attacks made alone, engine
# down by, equipment by turn 5, survives the first removal, lifegain a turn; the two versions side by side for a
# test) and "Why you lose" (each lost game's reason, as bars, with two example games each). Without a test, the
# latest field run's numbers. The first read's "How it actually wins" fills in from the background run against the
# top 5 ("checking how it wins" while it plays). Every number shows only after a run produced it, and the line under
# the stats says why attack-alone numbers read low until the strategy pilot (E4) ships.
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-p19="strategy-stats"' in s: print('already applied'); sys.exit(0)

LAB = 'font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)'
tier2 = ('<sc-if value="{{ tm.on }}" hint-placeholder-val="{{ false }}"><div data-p19="strategy-stats" style="display:flex;flex-direction:column;gap:22px;margin-top:22px">'
  '<div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><span style="font-size:var(--fs-l);font-weight:600">Is the strategy happening?</span><span style="' + LAB + '">{{ tm.scope }}</span></div>'
  '<div style="display:flex;flex-wrap:wrap;gap:14px 40px;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><sc-for list="{{ tm.stats }}" as="x" hint-placeholder-count="5"><div><div style="font-size:var(--fs-s);color:var(--muted)">{{ x.k }}</div><div style="font-family:var(--mono);font-size:20px">{{ x.v }}</div><div style="font-size:var(--fs-s);color:var(--muted)">{{ x.s }}</div></div></sc-for></div>'
  '<div style="font-size:var(--fs-s);color:var(--muted)">{{ tm.bias }}</div></div>'
  '<sc-if value="{{ tm.lossOn }}" hint-placeholder-val="{{ false }}"><div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><span style="font-size:var(--fs-l);font-weight:600">Why you lose</span><span style="' + LAB + '">{{ tm.lossScope }}</span></div>'
  '<sc-for list="{{ tm.reasons }}" as="r" hint-placeholder-count="4"><div style="display:flex;flex-direction:column;gap:4px;padding:8px 0;border-bottom:1px solid var(--line)"><div style="display:flex;align-items:center;gap:12px"><span style="width:250px;max-width:50%;font-size:var(--fs-m)">{{ r.reason }}</span><span style="flex:1;height:8px;background:var(--track);border-radius:4px;overflow:hidden"><span style="display:block;height:8px;width:{{ r.w }};background:var(--amber)"></span></span><span style="font-family:var(--mono);font-size:var(--fs-s);width:70px;text-align:right">{{ r.n }}</span></div>'
  '<sc-for list="{{ r.examples }}" as="e" hint-placeholder-count="2"><div style="font-size:var(--fs-s);color:var(--muted);padding-left:12px">· {{ e }}</div></sc-for></div></sc-for></div></sc-if>'
  '</div></sc-if>')
a = '<sc-if value="{{ pt.has }}" hint-placeholder-val="{{ false }}">'
assert s.count(a) == 1
# tier 2 goes after the test card block (the closing of data-p17's outer sc-if)
anchor = '</div></sc-if>\n\n    <sc-if value="{{ simStopped }}"'
assert s.count(anchor) == 1
s = s.replace(anchor, '</div></sc-if>' + tier2 + '\n\n    <sc-if value="{{ simStopped }}"')

# the read screen's "How it actually wins"
i = s.find('How it actually wins</span>'); assert i > 0
j0 = s.rfind('<div style="display:flex;flex-direction:column;gap:4px">', 0, i); j1 = s.find('</div>', i) + len('</div>')
s = s[:j0] + ('<div style="display:flex;flex-direction:column;gap:4px"><span style="' + LAB + '">How it actually wins</span>'
  '<sc-if value="{{ sg.howNone }}" hint-placeholder-val="{{ true }}"><span style="font-size:var(--fs-m);color:var(--muted)">Not measured yet. This fills in once the sim has played the list; until then the draft rests on the cards\' text.</span></sc-if>'
  '<sc-if value="{{ sg.howChecking }}" hint-placeholder-val="{{ false }}"><span style="font-size:var(--fs-m);color:var(--muted)">{{ sg.howCheckingLine }}</span></sc-if>'
  '<sc-for list="{{ sg.how }}" as="h" hint-placeholder-count="0"><span style="font-size:var(--fs-m)">{{ h }}</span></sc-for>'
  '<sc-if value="{{ sg.howBiasOn }}" hint-placeholder-val="{{ false }}"><span style="font-size:var(--fs-s);color:var(--muted)">{{ sg.howBias }}</span></sc-if></div>') + s[j1:]

# the values: after the test card's values
anchor = "        // the versions menu starts one: viewing a version that isn't your deck tests it against your deck"
assert s.count(anchor) == 1
s = s.replace(anchor, '''        // patch_p3_telemetry.py: the strategy's numbers, from the latest test (both versions) or else the latest field run
        { const pc = (x) => x == null ? '—' : Math.round(x * 100) + '%', tn = (x) => x == null ? '—' : 'turn ' + Math.round(x);
          const TR = T && T.status === 'done' ? (lead && lead.tm ? lead : rows.find(r => r.tm)) : null;
          const R = TR ? null : d.runs.find(r => r.status === 'done' && r.tmAll && r.tmAll.games);
          const A = TR ? TR.tm.a : R ? R.tmAll : null, B = TR ? TR.tm.b : null;
          const two = (f, fmt) => B ? fmt(f(A)) + ' · ' + fmt(f(B)) : fmt(f(A));
          const stats = !A ? [] : [
            { k: 'First solo attack', v: two(x => x && x.soloAt, tn), s: two(x => x && x.soloShare, pc) + ' of games' },
            { k: 'Attacks made alone', v: two(x => x && x.aloneShare, pc), s: 'of all attacks' },
            { k: 'Engine down by', v: two(x => x && x.engineAt, tn), s: two(x => x && x.engineShare, pc) + ' of games' },
            ...(A.geared5 || (B && B.geared5) ? [{ k: 'Equipment by turn 5', v: two(x => x && x.geared5, pc), s: 'of games' }] : []),
            { k: 'Survives the first removal', v: two(x => x && x.survivedFirstRemoval, pc), s: A.removalGames + ' games with removal aimed at it' },
            { k: 'Life gained a turn', v: two(x => x && x.lifegainPerTurn, (y) => y == null ? '—' : String(y)), s: 'average' } ];
          const L = A && A.losses ? A : null;
          v.tm = { on: onSim && !!A && !PK, stats, scope: TR ? 'v' + T.a + ' · v' + T.b + ' against ' + TR.opp + ' · ' + A.games + ' games' : R ? 'v' + R.v + ' against the field · ' + A.games + ' games' : '',
            bias: 'The sim\\'s AI attacks with everything and uses protection early, so attack-alone numbers read low until it plays your piloting rules.',
            lossOn: !!L, lossScope: L ? (TR ? 'v' + T.a + ' against ' + TR.opp : 'v' + R.v + ' against the field') + ' · ' + L.losses + ' losses' : '',
            reasons: L ? L.reasons.map(r => ({ reason: r.reason[0].toUpperCase() + r.reason.slice(1), n: r.n + ' of ' + L.losses, w: Math.round(100 * r.n / L.losses) + '%', examples: r.examples })) : [] }; }
''' + anchor)

# the read screen's values
anchor = "        engineLine: SG && SG.engine ?"
assert s.count(anchor) == 1
s = s.replace(anchor, '''        ...(() => { const RR = d.runs.find(r => r.v === cur30.v && r.status === 'done' && r.tmAll && r.tmAll.games), RP = d.runs.find(r => r.v === cur30.v && r.oppSet === 'read5' && this.active(r));
          const pc = (x) => x == null ? '—' : Math.round(x * 100) + '%', A = RR ? RR.tmAll : null;
          return { howNone: !A && !RP, howChecking: !A && !!RP, howCheckingLine: RP ? 'Checking how it wins · against the top 5' + (RP.played ? ' · ' + RP.played + ' games so far' : '') : '',
            how: A ? [ 'Wins on its turn ' + (A.winAt != null ? Math.round(A.winAt) : '—') + ' on average · ' + A.wins + ' of ' + A.games + ' games won.',
              'The engine is down by turn ' + (A.engineAt != null ? Math.round(A.engineAt) : '—') + ' in ' + pc(A.engineShare) + ' of games.',
              pc(A.aloneShare) + ' of its attacks go alone; the first solo attack comes on turn ' + (A.soloAt != null ? Math.round(A.soloAt) : '—') + '.',
              'The first removal aimed at the engine is survived ' + pc(A.survivedFirstRemoval) + ' of the time (' + A.removalGames + ' games).' ] : [],
            howBiasOn: !!A, howBias: 'Measured with the sim\\'s own AI playing it, which attacks with everything; where this and the cards disagree, the draft leans on the cards.' }; })(),
''' + anchor)
open(p, 'w').write(s); print('applied')
