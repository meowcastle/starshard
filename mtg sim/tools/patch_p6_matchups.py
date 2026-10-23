# Patch 21, P6 of the strategy-first rebuild (HANDOFF 23 Oct §4 P6; DISTILL-3 §5 phone bar): Matchups at the table.
# The plan panel during a match shows the opponent's entry (GET /api/brews/:id/matchups): how they win, your plan
# against what they bring and what the tutor grabs, kill on sight, let be, the ins and outs, and the latest test
# ("not tested yet" otherwise). The picker has All matchups: every entry, most-played first. Entries are for your
# deck (the version Table logs against).
import sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-p21="matchups"' in s: print('already applied'); sys.exit(0)

a = '<span class="fs-drop" style="font-size:var(--fs-s);line-height:1.55;color:var(--ink-2);border-top:1px solid var(--line);padding-top:8px">{{ tbPlan }}</span>'
assert s.count(a) == 1
s = s.replace(a, '<span class="fs-drop" data-p21="plan" style="font-size:var(--fs-s);line-height:1.55;color:var(--ink-2);border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:4px"><sc-for list="{{ tbLines }}" as="l" hint-placeholder-count="3"><span>{{ l }}</span></sc-for></span>')

# All matchups, under the picker's start button
i = s.find('onClick="{{ tbStart }}"'); assert i > 0
j = s.find('</a>', i) + 4
LAB = 'font-family:var(--mono);font-size:var(--fs-s);color:var(--muted)'
allm = ('<div data-p21="matchups" style="display:flex;flex-direction:column;gap:8px"><a href="#" onClick="{{ muToggle }}" style="color:var(--accent);font-weight:600;font-size:var(--fs-s)">{{ muToggleLabel }}</a>'
  '<sc-if value="{{ muOpen }}" hint-placeholder-val="{{ false }}"><sc-if value="{{ muLoading }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--muted)">Putting the matchups together…</div></sc-if>'
  '<sc-for list="{{ muRows }}" as="r" hint-placeholder-count="3"><div style="display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface)">'
  '<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b style="font-size:var(--fs-m)">{{ r.opp }}</b><span style="' + LAB + '">{{ r.share }}</span></div>'
  '<sc-for list="{{ r.lines }}" as="l" hint-placeholder-count="3"><span style="font-size:var(--fs-s);color:var(--ink-2);line-height:1.5">{{ l }}</span></sc-for></div></sc-for></sc-if></div>')
s = s[:j] + allm + s[j:]

# the values, beside the Table's plan
a = "        v.tbPlanToggle = pe(() => set({ planOpen: !T.planOpen }));"
assert s.count(a) == 1
s = s.replace(a, a + '''
        // patch_p6_matchups.py: the matchup entry for this opponent, and All matchups
        { const MU = S.mu && S.mu.brew === d.id && S.mu.v === cur30.v ? S.mu : null;
          if (tab === 'table' && d.seats === 2 && !MU && !this._muAsk) { this._muAsk = true; setTimeout(() => { this._muAsk = false; this.loadMatchups(d, cur30.v); }, 0); }
          const cs = (xs) => (xs || []).map(c => (c.qty ? c.qty + ' ' : '') + String(c.name || c).split(',')[0]).join(', ');
          const linesOf = (r) => [ ...(r.how ? ['How they win: ' + r.how] : []), ...r.plan,
            ...(r.kill.length ? ['Kill on sight: ' + r.kill.map(n => n.split(',')[0]).join(', ')] : []), ...(r.skip.length ? ['Let be: ' + r.skip.map(n => n.split(',')[0]).join(', ')] : []),
            ...(r.inOut && (r.inOut.in.length || r.inOut.out.length) ? ['In: ' + (cs(r.inOut.in) || 'nothing') + ' · Out: ' + (cs(r.inOut.out) || 'nothing') + ' (not tested on games 2-3 yet)'] : []),
            r.tested ? 'Tested: ' + r.tested : 'Not tested yet. Test a version against them from the versions menu.' ];
          const entry = MU && MU.rows ? MU.rows.find(r => r.opp === T.opponent) : null;
          if (entry) { v.tbLines = linesOf(entry); v.tbPlan = 'entry'; v.tbPlanOpen = !!T.planOpen; v.tbPlanHint = T.planOpen ? 'tap to hide the plan' : 'tap for the plan'; }
          else v.tbLines = v.tbPlan ? [v.tbPlan] : [];
          v.muOpen = !!T.allOpen; v.muToggle = pe(() => set({ allOpen: !T.allOpen })); v.muToggleLabel = T.allOpen ? 'Hide all matchups' : 'All matchups';
          v.muLoading = !!T.allOpen && (!MU || MU.status !== 'ready');
          v.muRows = MU && MU.rows ? MU.rows.map(r => ({ opp: r.opp, share: r.share != null ? Math.round(r.share) + '% of the field' : '', lines: linesOf(r) })) : []; }''')

anchor = "  async dropVersion(d, vn) {"
s = s.replace(anchor, '''  // patch_p6_matchups.py
  async loadMatchups(d, vn, tries = 0) {
    try { const r = await this.api('/api/brews/' + d.id + '/matchups?v=' + vn); this.setState({ mu: { brew: d.id, v: vn, ...r } });
      if (r.status === 'working' && tries < 90) setTimeout(() => this.loadMatchups(d, vn, tries + 1), 4000); }
    catch (e) { this.setState({ mu: { brew: d.id, v: vn, status: 'failed', error: e.message } }); }
  }
''' + anchor, 1)
open(p, 'w').write(s); print('applied')
