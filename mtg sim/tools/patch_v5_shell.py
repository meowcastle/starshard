#!/usr/bin/env python3
"""The v5 shell (design/DESIGN-V5-JOURNEY-16OCT.md, "What Code builds"), Code's half: the structure Design restyles.
  - Tabs Deck · Collection · Sim (Table stays for phones and iPads). Old links keep working: coach -> deck, results -> sim.
  - The coach is a docked column on the right of every deck tab on desktop; on a phone it's a sheet behind an Ask bar.
  - The decks list is a drawer on every width, opened from the header's deck picker (the phone's slide-over, made general).
  - Header: logo · deck picker · Codex search · account. Run stays on the deck's own row.
  - Collection: change 20/22/25's blocks moved out of Deck, plus "What you could build" (change 22's rows) beside them.
  - Phone bottom bar: Deck · Codex · Table · Account.
Idempotent (marker data-v5); needs change 25. Usage: patch_v5_shell.py public/index.html [out]"""
import sys, re
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-v5=' in s: print('already applied'); sys.exit(0)
assert 'data-change25' in s, 'apply patch_v4_paperonly.py (change 25) first'
def sub1(a, b, what):
    global s
    assert s.count(a) == 1, f'anchor for {what} found {s.count(a)} times'
    s = s.replace(a, b)
def cut(start, end, what):
    """remove and return s[start-anchor .. end-anchor inclusive]; both anchors unique"""
    global s
    assert s.count(start) == 1, f'start of {what} found {s.count(start)} times'
    i = s.index(start); j = s.index(end, i) + len(end)
    block = s[i:j]; s = s[:i] + s[j:]; return block
def balanced(block, what):
    for tag in ('div', 'sc-if', 'sc-for'):
        o = len(re.findall(r'<' + tag + r'[\s>]', block)); c = block.count('</' + tag + '>')
        assert o == c, f'{what}: <{tag}> {o} opened, {c} closed'

# ---------- CSS: the drawer on every width, the header everywhere, the coach column ----------
sub1('.fs-top,.fs-close,.fs-bar{display:none!important}',
     '.fs-bar{display:none!important}\n'
     '/* v5: the decks drawer on every width; the header always; the coach docked on the right */\n'
     '.fs-shell{grid-template-columns:minmax(0,1fr) 360px!important;min-width:0!important}\n'
     '.fs-side{display:none!important}\n'
     '.fs-side.open{animation:fsSlide var(--t2) var(--ease) both;display:flex!important;position:fixed!important;inset:0;z-index:50;height:100vh;width:100%;max-width:320px;box-shadow:0 0 0 100vmax rgba(0,0,0,.55)}\n'
     '.fs-top{display:flex!important}\n'
     '.fs-coach{border-left:1px solid var(--line);position:sticky;top:0;height:100vh;overflow:auto;padding:24px 20px;background:var(--bg)}\n'
     '.fs-askbar{display:none!important}\n'
     '.fs-coach .fs-close{display:none}', 'css')
# under 900px: one column; the coach is a sheet over the page, opened from the Ask bar above the tab bar
sub1('@media (max-width:900px){',
     '@media (max-width:900px){\n'
     '.fs-shell{grid-template-columns:minmax(0,1fr)!important}\n'
     '.fs-coach{display:none}\n'
     '.fs-coach.open{display:block;position:fixed;inset:12vh 0 0 0;z-index:45;height:auto;border-left:0;border-top:1px solid var(--line-strong);border-radius:16px 16px 0 0;padding-bottom:96px;animation:fsSlide var(--t2) var(--ease) both}\n'
     '.fs-askbar{display:flex!important;position:fixed;left:12px;right:12px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:41}', 'mobile css')

# ---------- header: logo · deck picker · Codex · account ----------
sub1('<a href="#" onClick="{{ navOpen }}" style="font-size:var(--fs-s);font-weight:600;color:var(--ink-2);padding:8px 0">Decks ☰</a></div>',
     '<div data-v5="header" style="display:flex;align-items:center;gap:16px;min-width:0"><a href="#" onClick="{{ navOpen }}" style="font-size:var(--fs-m);font-weight:600;color:var(--ink);padding:8px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40vw">{{ pickerLabel }} ▾</a>'
     '<a href="#" onClick="{{ cxBrowse }}" style="font-size:var(--fs-s);color:var(--muted);border:1px solid var(--line-strong);border-radius:999px;padding:6px 14px;white-space:nowrap">Search cards and decks</a>'
     '<a href="#" onClick="{{ openAccount }}" style="font-size:var(--fs-s);font-weight:600;color:var(--ink-2);white-space:nowrap">{{ who }}</a></div></div>', 'header')

# ---------- tabs: Deck · Collection · Sim (+ Table) ----------
nav_start = '      <a href="#" class="fs-tab" data-on="{{ tabCoachOn }}" onClick="{{ goCoach }}"'
nav_old = cut(nav_start, '</nav>', 'tabs')
table_tab = re.search(r'<a href="#" class="fs-tab" data-on="\{\{ tabTableOn \}\}".*?</a>', nav_old).group(0)
tab = lambda on, go, color, label: f'<a href="#" class="fs-tab" data-on="{{{{ {on} }}}}" onClick="{{{{ {go} }}}}" style="padding:0 0 12px;margin-bottom:-1px;border-bottom:2px solid transparent;color:{{{{ {color} }}}};font-weight:600">{label}</a>'
s = s.replace('    <nav class="fs-nav" style="display:flex;gap:24px;border-bottom:1px solid var(--line);font-size:var(--fs-m)">\n',
              '    <nav class="fs-nav" data-v5="tabs" style="display:flex;gap:24px;border-bottom:1px solid var(--line);font-size:var(--fs-m)">\n      '
              + tab('tabDeckOn', 'goDeck', 'tabDeckColor', 'Deck') + '\n      ' + tab('tabCollectionOn', 'goCollection', 'tabCollectionColor', 'Collection') + '\n      '
              + tab('tabSimOn', 'goSim', 'tabSimColor', 'Sim') + table_tab + '\n    </nav>', 1)

# ---------- the coach: out of the tabs, into its own column after <main> ----------
coach = cut('    <sc-if value="{{ isCoach }}" hint-placeholder-val="{{ true }}">\n    <div data-screen-label="Coach"', '      </div></sc-if>\n    </div>\n    </sc-if>\n', 'coach')
balanced(coach, 'coach')
coach = coach.replace('<sc-if value="{{ isCoach }}" hint-placeholder-val="{{ true }}">', '<sc-if value="{{ hasCoachCol }}" hint-placeholder-val="{{ true }}">', 1)
coach = coach.replace('class="fs-in" style="display:flex;flex-direction:column;gap:40px;max-width:680px"', 'class="fs-in" style="display:flex;flex-direction:column;gap:28px"', 1)
coach = coach.replace('<div data-screen-label="Coach"', '<div data-screen-label="Coach" data-v5="coach"', 1)
coach_head = ('      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><span style="font-weight:600">Coach</span>'
              '<span style="font-size:var(--fs-xs);color:var(--muted)">reads {{ coachReads }}</span><a href="#" class="fs-close" onClick="{{ coachClose }}" aria-label="Close" style="color:var(--muted);font-size:var(--fs-l)">✕</a></div>\n')
coach = coach.replace('style="display:flex;flex-direction:column;gap:28px">\n', 'style="display:flex;flex-direction:column;gap:28px">\n' + coach_head, 1)
sub1('  </main>\n</div>\n</sc-if>',
     '  </main>\n  <aside class="{{ coachCls }}" data-v5="coach-col">\n' + coach + '  </aside>\n'
     '  <sc-if value="{{ hasCoachCol }}" hint-placeholder-val="{{ false }}"><a href="#" class="fs-askbar" data-v5="askbar" onClick="{{ coachOpen }}" style="align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line-strong);border-radius:12px;padding:12px 16px;color:var(--muted);font-size:var(--fs-m)"><span style="width:10px;height:10px;background:var(--accent);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"></span>Ask the coach about this {{ coachReads }}</a></sc-if>\n'
     '</div>\n</sc-if>', 'coach column')

# ---------- Collection: change 20/22/25 out of Deck, with "What you could build" ----------
col = cut('          <sc-if value="{{ noCol }}" hint-placeholder-val="{{ false }}"><div data-change25="nocol"', '          </div></sc-if></div>\n', 'collection blocks')
balanced(col, 'collection blocks')
build_start = '        <div style="display:grid;grid-template-columns:minmax(220px,1.4fr) 130px 110px 110px 130px;'
i = s.index('<sc-if value="{{ bfHas }}" hint-placeholder-val="{{ true }}"><div style="display:flex;flex-direction:column">')
j = s.index('      </div></sc-if>\n', i) + len('      </div></sc-if>\n')
build = s[i:j]; balanced(build, 'brew-from rows')
collection = ('    <sc-if value="{{ isCollection }}" hint-placeholder-val="{{ false }}">\n'
              '    <div data-v5="collection" data-screen-label="Collection" class="fs-in" style="display:flex;flex-direction:column;gap:32px">\n'
              '      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap"><div><div style="font-size:var(--fs-xl);font-weight:600">Collection</div><div style="font-size:var(--fs-s);color:var(--muted)">{{ colHeadLine }}</div></div>'
              '<a href="#" onClick="{{ colPaste }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-s);color:var(--ink)">Update from ManaBox</a></div>\n'
              + col +
              '      <div style="display:flex;flex-direction:column;gap:12px"><div style="font-size:var(--fs-xs);color:var(--muted);letter-spacing:.06em;text-transform:uppercase">What you could build</div>\n'
              '      <sc-if value="{{ bfLoading }}" hint-placeholder-val="{{ false }}"><div style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--muted)">reading your collection against the field…</div></sc-if>\n'
              '      <sc-if value="{{ bfNoteOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--muted)">{{ bfServerNote }}</div></sc-if>\n'
              '      ' + build +
              '      <sc-if value="{{ bfEmpty }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-m);color:var(--muted);line-height:1.5">{{ bfEmptyNote }}</div></sc-if>\n'
              '      </div>\n    </div>\n    </sc-if>\n')
balanced(collection, 'collection tab')
sub1('    <sc-if value="{{ isTable }}" hint-placeholder-val="{{ false }}">', collection + '    <sc-if value="{{ isTable }}" hint-placeholder-val="{{ false }}">', 'collection tab')

# ---------- Deck: collection and prices leave it (v5 rule); Arena is never a word on the page (change 25) ----------
sub1('<span>{{ playsOn }} · {{ playsNote }}</span>', '', 'plays line')
sub1('<sc-if value="{{ hasCol }}" hint-placeholder-val="{{ true }}"><span data-change20="own"><b style="color:{{ ownColor }};font-weight:600">{{ ownLine }}</b>{{ craftLine }}</span></sc-if>', '', 'own line on Deck')
# the Collection's stat row: four numbers, labels above
sub1('<a href="#" onClick="{{ colPaste }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-s);color:var(--ink)">Update from ManaBox</a></div>\n',
     '<a href="#" onClick="{{ colPaste }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-s);color:var(--ink)">Update from ManaBox</a></div>\n'
     '      <sc-if value="{{ hasCol }}" hint-placeholder-val="{{ true }}"><div data-v5="col-stats" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px"><sc-for list="{{ colStats }}" as="x" hint-placeholder-count="4"><div style="display:flex;flex-direction:column;gap:4px;padding-top:12px;border-top:1px solid var(--line)"><div style="font-size:var(--fs-xs);color:var(--muted)">{{ x.label }}</div><div style="font-family:var(--mono);font-size:var(--fs-l);font-weight:500">{{ x.value }}</div><div style="font-size:var(--fs-xs);color:var(--muted)">{{ x.sub }}</div></div></sc-for></div></sc-if>\n', 'stat row')
sub1("      v.craftLine = !nMissing ? '' :",
     "      { const CR5 = d.craft, worth = CR5 && CR5.rows ? CR5.rows.filter(r => r.hi < 0).sort((a, b) => a.delta - b.delta)[0] : null, BF6 = S.bfData, cheap = BF6 && BF6.rows && BF6.rows.length ? BF6.rows.slice().sort((a, b) => (a.usd || 0) - (b.usd || 0))[0] : null;\n"
     "        v.colStats = v.hasCol ? [{ label: 'This deck', value: (size - nMissing) + ' of ' + size, sub: 'owned' }, { label: 'To finish', value: !nMissing ? 'nothing' : priced ? money(bill) : nMissing + ' cards', sub: nMissing ? nMissing + ' cards to buy' : 'you own it all' },\n"
     "          { label: 'Worth buying first', value: worth ? worth.out.map(c => c.qty + ' ' + c.name.split(',')[0]).join(', ') : '—', sub: worth ? '+' + Math.abs(worth.delta).toFixed(1) + ' pts' + (worth.savesUsd != null ? ' · ' + money(worth.savesUsd) : '') : 'once the deck has run' },\n"
     "          { label: 'Cheapest deck you could build', value: cheap ? cheap.name : '—', sub: cheap ? (cheap.usd ? money(cheap.usd) + ' to finish' : 'buildable') : 'reading the field' }] : []; }\n"
     "      v.craftLine = !nMissing ? '' :", 'stat values')
# ---------- Sim = the old Results ----------
sub1('<sc-if value="{{ isResults }}" hint-placeholder-val="{{ false }}">', '<sc-if value="{{ isSim }}" hint-placeholder-val="{{ false }}">', 'sim')

# ---------- phone bar: Deck · Codex · Table · Account ----------
sub1('<a href="#" data-on="{{ barDecksOn }}" onClick="{{ navOpen }}"><i></i>Decks</a><a href="#" data-on="{{ tabCoachOn }}" onClick="{{ goCoach }}"><i></i>Coach</a><a href="#" data-on="{{ tabResultsOn }}" onClick="{{ goResults }}"><i></i>Results</a>',
     '<a href="#" data-v5="bar" data-on="{{ barDeckOn }}" onClick="{{ goDeck }}"><i></i>Deck</a><a href="#" data-on="{{ barCodexOn }}" onClick="{{ cxBrowse }}"><i></i>Codex</a>', 'bar')
sub1('<a href="#" data-on="{{ tabTableOn }}" onClick="{{ goTable }}"><i></i>Table</a></div>',
     '<a href="#" data-on="{{ tabTableOn }}" onClick="{{ goTable }}"><i></i>Table</a><a href="#" data-on="{{ barAccountOn }}" onClick="{{ openAccount }}"><i></i>Account</a></div>', 'bar account')

# ---------- script: the tab names, the coach column, the Collection's data ----------
sub1("const tab = S.tab || 'coach';", "const tab0 = S.tab || 'deck', tab = tab0 === 'coach' ? 'deck' : tab0 === 'results' ? 'sim' : tab0; /* v5: old links still land */", 'tab')
sub1("isCoach: tab === 'coach', isResults: tab === 'results', isDeck: tab === 'deck', isTable: tab === 'table', goCoach: goTab('coach'), goResults: goTab('results'), goDeck: goTab('deck'), goTable: goTab('table'),",
     "isCoach: tab === 'deck', isSim: tab === 'sim', isResults: tab === 'sim', isDeck: tab === 'deck', isCollection: tab === 'collection', isTable: tab === 'table', goCoach: goTab('deck'), goResults: goTab('sim'), goSim: goTab('sim'), goDeck: pe(() => this.setState({ tab: 'deck', hover: null, codex: null, account: null, brewFrom: null })), goTable: goTab('table'),\n"
     "      goCollection: pe(() => { this.setState({ tab: 'collection', hover: null, codex: null, account: null, brewFrom: null }); if (!S.bfData) this.api('/api/collection/brews').then(r => this.setState({ bfData: r || { rows: [] } })).catch(e => this.setState({ bfData: { rows: [] }, bfErr: e.message })); }),\n"
     "      tabSimOn: tab === 'sim' ? '1' : '0', tabSimColor: tabS('sim').color, tabCollectionOn: tab === 'collection' ? '1' : '0', tabCollectionColor: tabS('collection').color, tabDeckColor: tabS('deck').color,\n"
     "      barDeckOn: !S.codex && !S.account && tab !== 'table' ? '1' : '0', barCodexOn: S.codex ? '1' : '0', barAccountOn: S.account ? '1' : '0',\n"
     "      coachReads: tab === 'collection' ? 'collection' : tab === 'sim' ? 'sim' : 'deck', coachCls: 'fs-coach' + (S.coachOpen ? ' open' : ''), coachOpen: pe(() => this.setState({ coachOpen: true })), coachClose: pe(() => this.setState({ coachOpen: false })),", 'tab flags')
# the deep link: the new tab names, and the old ones still accepted
sub1("const tab = ['coach', 'results', 'deck', 'table'].includes(q.get('tab')) ? q.get('tab') : 'coach',",
     "const tab = ['coach', 'results', 'deck', 'table', 'collection', 'sim'].includes(q.get('tab')) ? q.get('tab') : 'deck',", 'deep link')
# the coach column shows with a deck in context on any deck tab; the Collection's own data
sub1("v.sideCls = 'fs-side' + (S.navOpen ? ' open' : '');",
     "v.hasCoachCol = !S.codex && !S.account && !S.brewFrom && tab !== 'table'; v.pickerLabel = (d.name || 'Decks') + ' · v' + ((d.versions || []).slice(-1)[0] || {}).v;\n"
     "    { const BF5 = S.bfData; if (tab === 'collection') v.bfLoading = !BF5; v.bfNoteOn = !!(BF5 && BF5.note); v.bfServerNote = (BF5 && BF5.note) || '';\n"
     "      const P5 = S.collection && S.collection.paper; v.colHeadLine = P5 ? (P5.size + ' cards · ' + (P5.source || 'pasted') + ' · updated ' + new Date(P5.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) : 'No collection yet'; }\n"
     "    v.sideCls = 'fs-side' + (S.navOpen ? ' open' : '');", 'coach col flags')
# the defaults while no deck is picked
sub1("      plans: [], hasPlans: false, brewList: [], noCol: false,",
     "      plans: [], hasPlans: false, brewList: [], hasCoachCol: false, pickerLabel: 'Decks', coachReads: 'deck', coachCls: 'fs-coach', coachOpen: pe(() => {}), coachClose: pe(() => {}), bfNoteOn: false, bfServerNote: '', colHeadLine: '', colStats: [], isCollection: false, isSim: false, noCol: false,", 'defaults')

# the phone (16 Oct, after the first screenshots): the tabs were hidden with the v4 nav, so Collection and Sim
# could not be reached; they become a segmented control. The header drops the wordmark and search (Codex is in the bar).
sub1('<span style="font-weight:600">Forge Sim</span></div><div data-v5="header"', '<span class="fs-word" style="font-weight:600">Forge Sim</span></div><div data-v5="header"', 'wordmark')
sub1('<a href="#" onClick="{{ cxBrowse }}" style="font-size:var(--fs-s);color:var(--muted);border:1px solid var(--line-strong);border-radius:999px;padding:6px 14px;white-space:nowrap">Search cards and decks</a>', '<a href="#" class="fs-search" onClick="{{ cxBrowse }}" style="font-size:var(--fs-s);color:var(--muted);border:1px solid var(--line-strong);border-radius:999px;padding:6px 14px;white-space:nowrap">Search cards and decks</a>', 'search')
sub1('max-width:40vw">{{ pickerLabel }} ▾</a>', 'max-width:min(40vw,360px)">{{ pickerLabel }} ▾</a>', 'picker width')
sub1('@media (max-width:900px){\n', '@media (max-width:900px){\n.fs-search,.fs-word{display:none!important}\n[data-v5="header"] a:first-child{max-width:58vw!important}\n', 'phone header')
sub1('  .fs-nav{display:none!important}\n',
     '  /* v5: the three tabs as a segmented control; Table lives in the bottom bar */\n'
     '  .fs-nav{gap:0!important;border:1px solid var(--line-strong)!important;border-radius:8px;padding:3px;font-size:var(--fs-s)!important}\n'
     '  .fs-nav .fs-tab{flex:1;text-align:center;padding:7px 0!important;margin:0!important;border:0!important;border-radius:6px}\n'
     '  .fs-nav .fs-tab[data-on="1"]{background:var(--surface);color:var(--ink)!important}\n'
     '  .fs-nav .fs-tab-table{display:none}\n'
     '  [data-v5="col-stats"]{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:20px 16px!important}\n', 'phone tabs')
sub1('<a href="#" class="fs-tab" data-on="{{ tabTableOn }}" onClick="{{ goTable }}"', '<a href="#" class="fs-tab fs-tab-table" data-on="{{ tabTableOn }}" onClick="{{ goTable }}"', 'table tab')

open(out, 'w', encoding='utf-8').write(s); print('patched', out)
