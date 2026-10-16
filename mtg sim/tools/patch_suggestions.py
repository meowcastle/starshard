#!/usr/bin/env python3
"""Suggestions instead of Optimize (Justin, 16 Oct: "Optimize should be in the collection area, it should provide ideas
and suggestions, but clicking it shouldn't just change a bunch of shit"). The Collection tab gets "Suggest
improvements for v3": GET /api/brews/:id/suggestions (structure fixes, owned swaps the sim tested, buys worth points,
the coach's matchup swaps, the missing cards priced). Nothing is saved or run. Each swap has Apply..., which states
exactly what will be saved and asks; only Save makes the new version (it becomes the deck, the old one stays in
Versions). The Deck tab's Optimize button becomes Suggestions and opens them. Working markup until Design's.
Idempotent (marker data-sugg); needs patch_coach_grip.py. Usage: patch_suggestions.py public/index.html [out]"""
import sys, re
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-sugg' in s: print('already applied'); sys.exit(0)
assert 'data-grip' in s, 'apply patch_coach_grip.py first'
def sub1(a, b, what):
    global s
    assert s.count(a) == 1, f'anchor for {what} found {s.count(a)} times'
    s = s.replace(a, b)

# markup: the suggestions block, first thing under the Collection header
head = ('<a href="#" onClick="{{ colPaste }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:8px 14px;font-weight:600;font-size:var(--fs-s);color:var(--ink)">Update from ManaBox</a></div>\n')
block = ('      <div data-sugg="1" style="display:flex;flex-direction:column;gap:12px;border:1px solid var(--line);border-radius:8px;padding:20px 24px;background:var(--surface)">\n'
  '        <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><div style="font-size:var(--fs-l);font-weight:600">Suggestions for {{ sgVer }}</div><div style="font-size:var(--fs-s);color:var(--muted);line-height:1.5">{{ sgSub }}</div></div><a href="#" onClick="{{ sgLoad }}" style="background:var(--accent);color:var(--bg);border-radius:6px;padding:9px 14px;font-weight:600;font-size:var(--fs-s);white-space:nowrap">{{ sgBtn }}</a></div>\n'
  '        <sc-if value="{{ sgNoteOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--muted)">{{ sgNote }}</div></sc-if>\n'
  '        <sc-for list="{{ sgItems }}" as="g" hint-placeholder-count="3"><div style="display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:16px;align-items:start;padding:12px 0;border-top:1px solid var(--line)"><span style="font-size:var(--fs-xs);font-weight:600;color:{{ g.kindColor }};padding-top:2px">{{ g.kindLabel }}</span>'
  '<div><div style="font-weight:600">{{ g.title }}</div><div style="font-size:var(--fs-s);color:var(--muted);line-height:1.5">{{ g.why }}</div><sc-if value="{{ g.confirming }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;font-size:var(--fs-s);color:var(--ink);line-height:1.5">{{ g.confirmLine }} <a href="#" onClick="{{ g.save }}" style="color:var(--accent);font-weight:600">Save</a> · <a href="#" onClick="{{ g.cancel }}" style="color:var(--muted)">Cancel</a></div></sc-if></div>'
  '<div><sc-if value="{{ g.canApply }}" hint-placeholder-val="{{ true }}"><a href="#" onClick="{{ g.apply }}" style="border:1px solid var(--line-strong);border-radius:6px;padding:7px 12px;font-size:var(--fs-s);font-weight:600;color:var(--ink);white-space:nowrap">Apply…</a></sc-if><sc-if value="{{ g.isBuy }}" hint-placeholder-val="{{ false }}"><a href="{{ g.buy }}" target="_blank" rel="noopener sponsored" style="font-size:var(--fs-s);color:var(--accent);font-weight:600;white-space:nowrap">Buy ↗</a></sc-if></div></div></sc-for>\n'
  '        <sc-if value="{{ sgMissingOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--muted);padding-top:10px;border-top:1px solid var(--line)">{{ sgMissingLine }} <a href="{{ sgMissingBuy }}" target="_blank" rel="noopener sponsored" style="color:var(--accent);font-weight:600">Buy the missing ↗</a></div></sc-if>\n'
  '        <sc-if value="{{ sgSavedOn }}" hint-placeholder-val="{{ false }}"><div style="font-size:var(--fs-s);color:var(--win)">{{ sgSaved }}</div></sc-if>\n'
  '      </div>\n')
sub1(head, head + block, 'suggestions block')

# the loader, shared by the Collection button and the Deck tab's button
sub1("  // drag the coach column's edge:",
     "  // suggestions for one version: nothing is saved or run (patch_suggestions.py)\n"
     "  async loadSuggestions(d, ver) {\n"
     "    if (this.state.sgBusy) return; this.setState({ sgBusy: true, sgSaved: '', sgConfirm: null });\n"
     "    try { const r = await this.api('/api/brews/' + d.id + '/suggestions?v=' + ver.v); this.setState({ sg: { brew: d.id, v: ver.v, data: r } }); } catch (e) { this.setState({ sgSaved: e.message }); }\n"
     "    this.setState({ sgBusy: false });\n"
     "  }\n"
     "  // drag the coach column's edge:", 'loader')

# renderVals: right after the buy-link helpers, where d and ver are in scope
sub1("    v.buyUrl = buyUrl; v.buyList = buyList;",
     "    v.buyUrl = buyUrl; v.buyList = buyList;\n"
     "    { const SG = S.sg && S.sg.brew === d.id && S.sg.v === ver.v ? S.sg.data : null, cs = xs => (xs || []).map(c => c.qty + ' ' + c.name).join(', ');\n"
     "      const KIND = { structure: ['Structure', 'var(--amber)'], owned: ['Owned swap', WIN], buy: ['Buy', ACC], coach: ['Coach', 'var(--ink-2)'] };\n"
     "      v.sgVer = 'v' + ver.v; v.sgBtn = S.sgBusy ? 'Reading…' : SG ? 'Refresh' : 'Suggest improvements';\n"
     "      v.sgSub = SG ? (SG.items.length ? SG.items.length + ' suggestion' + (SG.items.length === 1 ? '' : 's') + ' · nothing changes until you save one' : 'Nothing to change from what the sim and your collection know.') : 'Fixes from the deck check, swaps from your collection, buys worth making and the coach\\'s matchup swaps. Nothing changes until you save one.';\n"
     "      v.sgLoad = pe(() => this.loadSuggestions(d, ver)); v.sgNoteOn = !!(SG && SG.note); v.sgNote = SG ? SG.note : '';\n"
     "      v.sgItems = SG ? SG.items.map(x => ({ kindLabel: (KIND[x.kind] || [x.kind])[0], kindColor: (KIND[x.kind] || [0, MUTED])[1], title: x.title,\n"
     "        why: x.why + (x.basis ? ' (' + x.basis + ')' : '') + (x.missing && x.missing.length ? ' You\\'d need ' + cs(x.missing) + '.' : ''),\n"
     "        canApply: !!x.swaps && S.sgConfirm !== x.id, isBuy: x.kind === 'buy', buy: buyList(x.in), confirming: S.sgConfirm === x.id,\n"
     "        confirmLine: 'Save as a new version: −' + cs(x.out) + ', +' + cs(x.in) + '. It becomes your deck; v' + ver.v + ' stays in Versions.',\n"
     "        apply: pe(() => this.setState({ sgConfirm: x.id })), cancel: pe(() => this.setState({ sgConfirm: null })),\n"
     "        save: pe(async () => { if (S.busy) return; this.setState({ busy: true }); try { const b = await this.api('/api/brews/' + d.id + '/versions', { method: 'POST', body: { from: ver.v, swaps: x.swaps, note: 'Suggestion: ' + x.title, origin: 'edited' } }); if (b && b.id) this.setState(s => ({ brews: s.brews.map(y => y.id === b.id ? b : y), sgConfirm: null, sg: null, sgSaved: 'Saved as v' + b.current + '. It\\'s your deck now; run it from the header when you\\'re ready.' })); } catch (e) { this.setState({ sgSaved: e.message }); } this.setState({ busy: false }); }) })) : [];\n"
     "      v.sgMissingOn = !!(SG && SG.missing && SG.missing.length); v.sgMissingLine = v.sgMissingOn ? 'v' + ver.v + ' needs ' + SG.missing.reduce((t, c) => t + c.qty, 0) + ' cards you don\\'t own, about $' + SG.missingUsd + ' at TCGplayer market.' : ''; v.sgMissingBuy = v.sgMissingOn ? buyList(SG.missing) : '#';\n"
     "      v.sgSavedOn = !!S.sgSaved; v.sgSaved = S.sgSaved || ''; }", 'render')
sub1("plans: [], hasPlans: false, brewList: [], ",
     "plans: [], hasPlans: false, brewList: [], sgVer: '', sgBtn: '', sgSub: '', sgLoad: pe(() => {}), sgNoteOn: false, sgNote: '', sgItems: [], sgMissingOn: false, sgMissingLine: '', sgMissingBuy: '#', sgSavedOn: false, sgSaved: '', ", 'defaults')

# the Deck tab's Optimize button becomes Suggestions: it opens them, it changes nothing
sub1("v.ckBtnLabel = optimizing ? 'Optimizing…' : S.busy ? '…' : 'Optimize';", "v.ckBtnLabel = optimizing ? 'Optimizing…' : 'Suggestions';", 'button label')
m = re.search(r"v\.ckOptimize = pe\(async \(\) => \{ if \(optimizing \|\| S\.busy\) return;.*?this\.setState\(\{ busy: false \}\); \}\);", s)
assert m and s.count(m.group(0)) == 1, 'optimize handler'
s = s.replace(m.group(0), "v.ckOptimize = pe(() => { this.setState({ tab: 'collection', hover: null, codex: null, account: null }); if (!(S.sg && S.sg.brew === d.id && S.sg.v === ver.v)) this.loadSuggestions(d, ver); });")

open(out, 'w', encoding='utf-8').write(s); print('patched', out)
