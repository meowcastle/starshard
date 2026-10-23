# Patch 16, P0 of the strategy-first rebuild (HANDOFF 23 Oct §4 P0; DISTILL-3 §3, §5, §7): the status line holds state
# only. "Viewing v7 ▾ · your deck: v6", and "Make v7 your deck" when they differ. Making a version your deck opens the
# paper checklist (what to take out of the sleeves and what to put in) and keeps an Undo on the line for the session.
# Results leave the line (they live on the results tab); running, queued and stopped stay, with Cancel. The vocabulary
# moves from "current" to "your deck". Shop links take the affiliate codes only when the server hands them over, which
# it never does for the owner or an admin (/api/me shopCodes).
import re, sys
p = sys.argv[1] if len(sys.argv) > 1 else 'public/index.html'
s = open(p).read()
if 'data-p16="state"' in s: print('already applied'); sys.exit(0)

# --- the status line
m = re.search(r'<div data-s30="state" (style="[^"]*")>.*?</sc-for></div>', s)
assert m and s.count('<div data-s30="state"') == 1
LINK = 'color:var(--accent);font-weight:600;white-space:nowrap'
line = ('<div data-s30="state" data-p16="state" ' + m.group(1) + '>'
  '<a href="#" onClick="{{ verToggle }}" title="Versions" style="color:var(--ink);font-weight:600;white-space:nowrap">Viewing v{{ deck.version }} ▾</a>'
  '<span>·</span><span style="white-space:nowrap">your deck: v{{ hd.yours }}</span>'
  '<sc-if value="{{ hd.makeOn }}" hint-placeholder-val="{{ false }}"><span>·</span><a href="#" onClick="{{ hd.make }}" style="' + LINK + '">Make v{{ deck.version }} your deck</a></sc-if>'
  '<sc-if value="{{ hd.madeOn }}" hint-placeholder-val="{{ false }}"><span>·</span><a href="#" onClick="{{ hd.paper }}" style="' + LINK + '">paper checklist: {{ hd.paperN }}</a><span>·</span><a href="#" onClick="{{ hd.undo }}" style="color:var(--ink);font-weight:600;white-space:nowrap">Undo</a></sc-if>'
  '<sc-if value="{{ hd.pillOn }}" hint-placeholder-val="{{ false }}"><span>·</span><span style="padding:2px 8px;border-radius:6px;font-weight:600;white-space:nowrap;background:{{ hd.pillBg }};color:{{ hd.pillInk }}">{{ hd.pill }}</span></sc-if>'
  '<sc-if value="{{ hd.tailOn }}" hint-placeholder-val="{{ false }}"><span>· {{ hd.tail }}</span></sc-if>'
  '<sc-if value="{{ hd.actOn }}" hint-placeholder-val="{{ false }}"><span>·</span><a href="#" onClick="{{ hd.act }}" style="' + LINK + '">{{ hd.actLabel }}</a></sc-if>'
  + re.search(r'<sc-for list="\{\{ hd\.runs \}\}".*?</sc-for>', m.group(0)).group(0) + '</div>'
  # the paper checklist: one panel under the line, closed with Done
  '<sc-if value="{{ hd.paperOpen }}" hint-placeholder-val="{{ false }}"><div data-p16="paper" style="margin-top:10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:10px;max-width:560px">'
  '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><span style="font-weight:600">v{{ hd.yours }} is your deck · change your sleeves</span><a href="#" onClick="{{ hd.paper }}" style="font-weight:600;color:var(--ink)">Done</a></div>'
  '<sc-if value="{{ hd.paperNone }}" hint-placeholder-val="{{ false }}"><span style="color:var(--muted)">Same cards as v{{ hd.paperFrom }}. Nothing to change.</span></sc-if>'
  '<sc-for list="{{ hd.paperRows }}" as="r" hint-placeholder-count="3"><div style="display:flex;gap:10px;font-family:var(--mono);font-size:var(--fs-s)"><span style="width:84px;color:{{ r.col }}">{{ r.verb }}</span><span style="color:var(--ink)">{{ r.text }}</span></div></sc-for>'
  '</div></sc-if>')
s = s[:m.start()] + line + s[m.end():]

# --- the values
start = s.index("      v.hd = { lead: isCur ?")
end = s.index("      // patch_run_cancel.py: every run in progress")
s = s[:start] + '''      // patch_p0_state.py: state only. Which version you're viewing, which is your deck, and running / queued / stopped
      const MADE = S.made && S.made.brew === d.id && S.made.to === cur30.v ? S.made : null;
      const paper = MADE ? this.paperRows(d, MADE.from, MADE.to) : [];
      const live = ver.state && ['running', 'queued', 'stopped'].includes(ver.state.kind);
      v.hd = { yours: cur30.v, makeOn: !isCur, make: pe(() => this.makeYours(d, ver.v)),
        madeOn: !!MADE, paperN: paper.length === 1 ? '1 change' : paper.length + ' changes', paper: pe(() => this.setState({ paperOpen: !S.paperOpen })),
        undo: pe(() => this.undoYours(d)), paperOpen: !!(MADE && S.paperOpen), paperRows: paper, paperNone: !!MADE && !paper.length, paperFrom: MADE ? MADE.from : '',
        pillOn: !!live, pill: pl.t, pillBg: pl.bg, pillInk: pl.ink, tailOn: !!(live && pl.cause), tail: pl.cause || '',
        actOn: !!(ver.state && ver.state.kind === 'stopped'), actLabel: 'Run again',
        act: pe(() => this.queue(d.id, (vr && vr.oppSet) || S.oppSet, ver.v)) };
''' + s[end:]

# the versions menu: "your deck", not "current"
for a, b in [("(c ? ' · current' : '')", "(c ? ' · your deck' : '')"),
             ("label: 'Make v' + ver.v + ' current'", "label: 'Make v' + ver.v + ' your deck'")]:
  assert s.count(a) == 1, a; s = s.replace(a, b)
s = s.replace("go: pe(() => this.makeCurrent(d, ver.v)) }] : []),", "go: pe(() => this.makeYours(d, ver.v)) }] : []),", 1)

# --- the methods: make your deck (remembering the one before, for Undo), undo, and the checklist rows
anchor = "  async dropVersion(d, vn) {"
assert s.count(anchor) == 1
s = s.replace(anchor, '''  // patch_p0_state.py: Make vN your deck opens the paper checklist and keeps Undo for the session
  async makeYours(d, vn) {
    const from = d.current; await this.makeCurrent(d, vn);
    const b = (this.state.brews || []).find(x => x.id === d.id);
    if (b && b.current === vn && from !== vn) this.setState({ made: { brew: d.id, from, to: vn }, paperOpen: true });
  }
  async undoYours(d) {
    const M = this.state.made; if (!M || M.brew !== d.id) return;
    await this.makeCurrent(d, M.from);
    const b = (this.state.brews || []).find(x => x.id === d.id);
    if (b && b.current === M.from) this.setState({ made: null, paperOpen: false, msg: { text: 'v' + M.from + ' is your deck again.' } });
  }
  paperRows(d, from, to) {
    const L = (vn) => { const x = d.versions.find(y => y.v === vn), m = new Map(); if (!x || !x.list) return m;
      for (const sec of ['main', 'side', 'commander']) for (const c of x.list[sec] || []) { const k = sec + '\\u0000' + c.name; m.set(k, (m.get(k) || 0) + c.qty); } return m; };
    const A = L(from), B = L(to), out = [], inn = [];
    for (const k of new Set([...A.keys(), ...B.keys()])) { const dq = (B.get(k) || 0) - (A.get(k) || 0); if (!dq) continue;
      const [sec, name] = k.split('\\u0000'), where = sec === 'side' ? ' (sideboard)' : sec === 'commander' ? ' (commander)' : '';
      (dq < 0 ? out : inn).push({ verb: dq < 0 ? 'Take out' : 'Put in', col: dq < 0 ? 'var(--muted)' : 'var(--accent)', text: Math.abs(dq) + ' ' + name + where }); }
    return [...out, ...inn];
  }
''' + anchor)

# --- shop links: codes only when the server sends them (never for the owner or an admin)
a = "    const AFF = '';\n    const buyUrl = (c) => (c && c.buy) ? c.buy + AFF : 'https://www.tcgplayer.com/search/magic/product?q=' + encodeURIComponent(c && c.name ? c.name : String(c)) + AFF;\n    const buyList = (xs) => 'https://www.tcgplayer.com/massentry?productline=Magic&c=' + encodeURIComponent((xs || []).map(c => c.qty + ' ' + c.name).join('||')) + AFF;"
assert s.count(a) == 1
s = s.replace(a, '''    // patch_p0_state.py: the affiliate wrapper (TCGplayer) and partner code (Card Kingdom) come from /api/me, which sends none
    // to the owner or an admin, so their own purchases never carry a code
    const CODES = (S.me && S.me.shopCodes) || null;
    const tcg = (u) => CODES && CODES.tcg ? CODES.tcg + (CODES.tcg.includes('?') ? '&' : '?') + 'u=' + encodeURIComponent(u) : u;
    const ck = (u) => CODES && CODES.ck ? u + (u.includes('?') ? '&' : '?') + 'partner=' + encodeURIComponent(CODES.ck) : u;
    v.tcgLink = tcg; v.ckLink = ck;
    const buyUrl = (c) => tcg((c && c.buy) ? c.buy : 'https://www.tcgplayer.com/search/magic/product?q=' + encodeURIComponent(c && c.name ? c.name : String(c)));
    const buyList = (xs) => tcg('https://www.tcgplayer.com/massentry?productline=Magic&c=' + encodeURIComponent((xs || []).map(c => c.qty + ' ' + c.name).join('||')));''')
for a, b in [("v.buyTcg = 'https://www.tcgplayer.com/massentry?productline=Magic&c=' + encodeURIComponent(all.map(c => c.qty + ' ' + c.name).join('||'));",
              "v.buyTcg = v.tcgLink('https://www.tcgplayer.com/massentry?productline=Magic&c=' + encodeURIComponent(all.map(c => c.qty + ' ' + c.name).join('||')));"),
             ("window.open('https://www.cardkingdom.com/builder', '_blank', 'noopener');", "window.open(v.ckLink('https://www.cardkingdom.com/builder'), '_blank', 'noopener');"),
             ("v.buyMissing = 'https://www.tcgplayer.com/massentry?productline=Magic&c=' + encodeURIComponent(missing.map(m => m.need + ' ' + m.name).join('||'));",
              "v.buyMissing = v.tcgLink('https://www.tcgplayer.com/massentry?productline=Magic&c=' + encodeURIComponent(missing.map(m => m.need + ' ' + m.name).join('||')));")]:
  assert s.count(a) == 1, a; s = s.replace(a, b)
# DISTILL-3's one verb for putting a candidate into a new version: Try (was Apply)
for a, b in [('white-space:nowrap">Apply</a>', 'white-space:nowrap">Try</a>'), ('Nothing changes until you Apply one. Apply opens', 'Nothing changes until you Try one. Try opens')]:
  assert s.count(a) == 1, a; s = s.replace(a, b)
open(p, 'w').write(s); print('applied')
