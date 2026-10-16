#!/usr/bin/env python3
"""The Deck tab leads with the current version's sim highlights (Justin, 16 Oct: "more importantly there [are] stats
on that current deck, like all the highlights from the sim"): its newest finished run's headline and range, best and
worst matchups, the cards that pulled and dragged (lift: games won when cast vs not), and the coach's top issue.
A version that hasn't run says so, with Run and the last result of any version for reference. Working markup until
Design's. Idempotent (marker data-hl); needs patch_msg.py. Usage: patch_highlights.py public/index.html [out]"""
import sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-hl' in s: print('already applied'); sys.exit(0)
assert 'data-msg' in s, 'apply patch_msg.py first'
def sub1(a, b, what):
    global s
    assert s.count(a) == 1, f'anchor for {what} found {s.count(a)} times'
    s = s.replace(a, b)
card = ('        <div data-hl="1" style="display:flex;flex-direction:column;gap:14px;border:1px solid var(--line);border-radius:8px;padding:20px 24px">\n'
  '          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap"><div><div style="font-size:var(--fs-xs);color:var(--muted);letter-spacing:.06em;text-transform:uppercase">{{ hlKicker }}</div><div style="font-size:var(--fs-xl);font-weight:600;margin-top:2px">{{ hlHead }}</div><div style="font-size:var(--fs-s);color:var(--muted)">{{ hlSub }}</div></div>'
  '<sc-if value="{{ hlNoRun }}" hint-placeholder-val="{{ false }}"><a href="#" onClick="{{ toggleRun }}" style="background:var(--accent);color:var(--bg);border-radius:6px;padding:9px 14px;font-weight:600;font-size:var(--fs-s)">{{ hlRunLabel }}</a></sc-if></div>\n'
  '          <sc-if value="{{ hlHas }}" hint-placeholder-val="{{ true }}"><div class="fs-stack" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px">'
  '<sc-for list="{{ hlCols }}" as="h" hint-placeholder-count="4"><div style="display:flex;flex-direction:column;gap:6px"><div style="font-size:var(--fs-xs);color:var(--muted)">{{ h.label }}</div><sc-for list="{{ h.rows }}" as="r" hint-placeholder-count="2"><div style="display:flex;justify-content:space-between;gap:8px;font-size:var(--fs-s)"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.name }}</span><span style="font-family:var(--mono);color:{{ r.color }}">{{ r.val }}</span></div></sc-for></div></sc-for></div></sc-if>\n'
  '          <sc-if value="{{ hlIssueOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);line-height:1.5;padding-top:10px;border-top:1px solid var(--line)"><b style="font-weight:600">{{ hlIssue }}.</b> <span style="color:var(--muted)">{{ hlIssueNote }}</span></div></sc-if>\n'
  '        </div>\n')
i = s.index('        <sc-if value="{{ ckLoading }}"')
s = s[:i] + card + s[i:]
sub1("    v.msgOn = !!S.msg;",
     "    { const done = r => r.status === 'done' && r.score && !r.weekly, mine = d.runs.find(r => r.v === ver.v && done(r)), any = d.runs.find(done), pc = x => Math.round(x * 100) + '%';\n"
     "      const fieldDay = r => r.field && r.field.date ? new Date(r.field.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';\n"
     "      v.hlKicker = 'v' + ver.v + (mine ? ' · your deck · ' + fieldDay(mine) + ' field' : ' · your deck');\n"
     "      v.hlHas = !!mine; v.hlNoRun = !mine; v.hlRunLabel = 'Run v' + ver.v;\n"
     "      const live = !mine && ver.state && ['running', 'queued'].includes(ver.state.kind); v.hlHead = mine ? pc(mine.score.p) + ' vs the field' : live ? (ver.state.kind === 'running' ? 'Running · ' + ver.state.pct + '%' : 'Queued') : 'Not run yet'; if (live) v.hlNoRun = false;\n"
     "      v.hlSub = mine ? 'likely ' + pc(mine.score.lo) + '–' + pc(mine.score.hi) + ' · ' + (mine.score.n || mine.played) + ' games' : any ? 'The last result is v' + any.v + ': ' + pc(any.score.p) + ' on the ' + fieldDay(any) + ' field. Run v' + ver.v + ' to see its own numbers.' : 'Run it to see how it does against the field.';\n"
     "      const ms = mine ? mine.opponents.map((o, i) => ({ name: o.name, s: mine.scores && mine.scores[i] })).filter(x => x.s && x.s.n >= 10) : [];\n"
     "      const best = ms.slice().sort((a, b) => b.s.p - a.s.p).slice(0, 3), worst = ms.slice().sort((a, b) => a.s.p - b.s.p).slice(0, 3);\n"
     "      const cr = mine && mine.cards && mine.cards.rows ? mine.cards.rows.filter(c => c.cast >= 30 && c.lift != null) : [];\n"
     "      const up = cr.slice().sort((a, b) => b.lift - a.lift).slice(0, 3), down = cr.slice().sort((a, b) => a.lift - b.lift).slice(0, 3);\n"
     "      const sg = x => (x >= 0 ? '+' : '−') + Math.abs(Math.round(x * 100));\n"
     "      v.hlCols = mine ? [{ label: 'Best matchups', rows: best.map(x => ({ name: x.name, val: pc(x.s.p), color: WIN })) }, { label: 'Worst matchups', rows: worst.map(x => ({ name: x.name, val: pc(x.s.p), color: LOSS })) },\n"
     "        { label: 'Cards pulling their weight', rows: up.map(c => ({ name: c.name, val: sg(c.lift), color: WIN })) }, { label: 'Cards dragging', rows: down.map(c => ({ name: c.name, val: sg(c.lift), color: LOSS })) }] : [];\n"
     "      v.hlIssueOn = !!(mine && mine.coach && mine.coach.weakness); v.hlIssue = v.hlIssueOn ? mine.coach.weakness : ''; v.hlIssueNote = v.hlIssueOn ? String(mine.coach.weaknessNote || '').split(/(?<=\\.)\\s/)[0] : ''; }\n"
     "    v.msgOn = !!S.msg;", 'render')
sub1("plans: [], hasPlans: false, brewList: [], ", "plans: [], hasPlans: false, brewList: [], hlKicker: '', hlHas: false, hlNoRun: false, hlRunLabel: '', hlHead: '', hlSub: '', hlCols: [], hlIssueOn: false, hlIssue: '', hlIssueNote: '', ", 'defaults')
open(out, 'w', encoding='utf-8').write(s); print('patched', out)
