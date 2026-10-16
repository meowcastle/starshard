#!/usr/bin/env python3
"""Change 26 (FORGE-SIM-DISTILL.md §7, the safety fixes, shipped before the rename and the cuts):
  1. Rule zero: the Arena strings that survived change 25 leave the page (paste help, "your games", the wildcard row on
     the run settings, the log-a-match Arena sources and events, "learnable on Arena", the Account's Arena line), and
     the dead isArena fork in the collection row builder goes with them. Wildcards leave settings.budget.
  2. The collection paste is reversible: "Replaced 48 cards with 52 · Undo" for the session (POST /api/collection/paper/undo).
  3. Sign in: the email code first, the password form behind "Use a password". Sign-up's "No reset yet" goes.
  4. A stopped run says "stopped" and where it stopped; the reason goes to the admin footer, never the player.
  5. Empty states: Sim with no run, the check while it's worked out (a skeleton), the coach before the first run,
     "What you could build" with nothing yet.
  6. Compare on a one-version deck: the toggle is disabled; the coach no longer says it a second time.
Idempotent (marker data-change26); needs the v5 shell (tools/patch_v5_shell.py). Usage: patch_v4_distill_safety.py public/index.html [out]"""
import sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-change26' in s: print('already applied'); sys.exit(0)
assert 'data-change25' in s and 'data-v5=' in s, 'apply change 25 and the v5 shell first'
def sub1(a, b, what):
    global s
    assert s.count(a) == 1, f'anchor for {what} found {s.count(a)} times'
    s = s.replace(a, b)

# ---------- 1 · rule zero ----------
sub1('Plain text, an Archidekt or Moxfield export, or an Arena export. Moxfield: More → Export → Copy for MTGA.',
     '4 Card Name per line, or paste a Moxfield/Archidekt export.', 'paste help')
sub1('<span>Your games: none yet · log them from the Table tab · Arena games on the Mac count too</span>',
     '<span data-change26="arena">No logged games yet</span>', 'your games')
sub1('placeholder="RCQ on Nov 1. These four cards stay. No rare wildcards."', 'placeholder="Tournament on Nov 1. These four cards stay. Under $50 in new cards."', 'note placeholder')
# the wildcard row on the run settings: the Cards dial (change 22) is the budget now
i = s.index('<span style="font-size:var(--fs-s);color:var(--muted);min-width:72px">Arena practice</span>')
a = s.rindex('\n', 0, i) + 1; b = s.index('\n', i) + 1
assert s[a:b].count('wildcards you') == 1; s = s[:a] + s[b:]
sub1("st.budget ? 'budget ' + (st.budget.rare || 0) + 'R/' + (st.budget.mythic || 0) + 'M' : ''",
     "st.budget && st.budget.mode === 'owned' ? 'owned cards only' : st.budget && st.budget.mode === 'usd' ? 'up to $' + (st.budget.usd || 0) : ''", 'constraints label')
sub1("budget: e.rare || e.mythic || (e.mode && e.mode !== 'any') ? { rare: +e.rare || 0, mythic: +e.mythic || 0, mode: e.mode || 'any', usd: e.mode === 'usd' ? +e.usd || 0 : null } : null",
     "budget: e.mode && e.mode !== 'any' ? { mode: e.mode, usd: e.mode === 'usd' ? +e.usd || 0 : null } : null", 'save budget')
# events and log-a-match sources: paper only (old settings that name an Arena event still read)
sub1("const EVENT_LABEL = { rcq: 'RCQ', store: 'Store championship', fnm: 'FNM', 'arena-bo3': 'Arena Bo3', 'arena-bo1': 'Arena Bo1', none: 'No event' };",
     "const EVENT_LABEL = { rcq: 'RCQ', store: 'Store championship', fnm: 'FNM', none: 'No event' }, EVENT_OLD = { 'arena-bo3': 'Online Bo3', 'arena-bo1': 'Online Bo1' };", 'events')
sub1("v.goalLabel = EVENT_LABEL[st.goal.event] || st.goal.event;", "v.goalLabel = EVENT_LABEL[st.goal.event] || EVENT_OLD[st.goal.event] || st.goal.event;", 'goal label')
sub1("v.lmSources = LM ? ['Paper', 'Arena Bo3', 'Arena Bo1'].map(x => lmPill(x, LM.source === x, { source: x })) : [];", "v.lmSources = [];", 'log sources')
sub1('<span style="font-size:var(--fs-s);color:var(--muted);min-width:64px">Where</span><sc-for list="{{ lmSources }}"',
     '<span style="font-size:var(--fs-s);color:var(--muted);min-width:64px;display:none">Where</span><sc-for list="{{ lmSources }}"', 'log sources label')
sub1("v.playsOn = 'Paper'; v.playsNote = notArena.length ? 'Arena can\\'t teach ' + plural(notArena.length, 'card') + ' of it' : 'learnable on Arena too';",
     "v.playsOn = 'Paper'; v.playsNote = '';", 'plays note')
sub1("v.acArenaLine = AR ? cnt(AR).toLocaleString() + ' cards' + (AR.at ? ' · read from the Mac ' + day(AR.at) : '') : 'none (plays on the Mac? it reads itself)';", "", 'account arena line')
sub1("acPaperLine: '', acArenaLine: '',", "acPaperLine: '',", 'account arena default')
# the dead Arena fork in the collection rows (change 25 hid the shelf; the strings still shipped)
for a, b, what in [
    ("      // Two shelves, because an Arena collection and a paper collection are different things. The block follows the deck\n      // (a list with cards not on Arena is a paper deck) unless the player flips it.\n",
     "      // The paper collection is the only one (rule zero, change 26).\n", 'fork comment'),
    ("const COL = shelf ? ALL[shelf] : null, isArena = shelf === 'arena';", "const COL = shelf ? ALL[shelf] : null;", 'isArena'),
    ("      const wcS = (w) => RAR.filter(r => w && w[r]).map(r => w[r] + ' ' + r).join(' + ');\n", "", 'wcS'),
    ("label: k === 'arena' ? 'Arena (practice)' : 'Paper',", "label: 'Paper',", 'shelf label'),
    ("v.colNote = !COL ? '' : isArena ? 'to practice this list on Arena · wildcards: ' + (wcS(COL.wildcards) || 'none') : (COL.source", "v.colNote = !COL ? '' : (COL.source", 'col note'),
    ("rarity: isArena ? (R1[r] || r) : (c.price != null ? money(c.price) : ''), color: isArena ? (r === 'mythic' ? AMBER : r === 'rare' ? 'var(--ink)' : MUTED) : 'var(--ink)'",
     "rarity: c.price != null ? money(c.price) : '', color: 'var(--ink)'", 'missing row'),
    ("      const short = isArena ? RAR.filter(r => (need[r] || 0) > ((COL && COL.wildcards && COL.wildcards[r]) || 0)) : [];\n", "", 'short'),
    ("v.craftLine = !nMissing ? '' : isArena ? ' · ' + wcS(need) + ' to craft' + (short.length ? ' · short ' + short.map(r => (need[r] - ((COL.wildcards || {})[r] || 0)) + ' ' + r).join(', ') : ' · you have the wildcards') : billS;",
     "v.craftLine = !nMissing ? '' : billS;", 'craft line'),
    ("v.wcLine = !nMissing ? '' : isArena ? 'Costs ' + wcS(need) + ' wildcards. You have ' + (wcS(COL.wildcards) || 'none') + '.' + (short.length ? ' Short by ' + short.map(r => (need[r] - ((COL.wildcards || {})[r] || 0)) + ' ' + r).join(' and ') + '.' : '') : (priced",
     "v.wcLine = !nMissing ? '' : (priced", 'wc line'),
    ("v.hasBuyMissing = !isArena && nMissing > 0;", "v.hasBuyMissing = nMissing > 0;", 'buy missing'),
    ("const savesS = (r) => isArena ? RAR.filter(k => r.saves && r.saves[k]).map(k => r.saves[k] + R1[k]).join(' ') : (r.savesUsd != null ? money(r.savesUsd) : '');",
     "const savesS = (r) => r.savesUsd != null ? money(r.savesUsd) : '';", 'saves'),
    ("RAR.forEach(k => { if (r.saves && r.saves[k]) saved[k] = (saved[k] || 0) + r.saves[k]; }); ", "", 'saved'),
    ("+ (isArena ? wcS(saved) : money(savedUsd)) + ' · the rest cost real points, ' + (isArena ? 'craft' : 'buy') + ' those'",
     "+ money(savedUsd) + ' · the rest cost real points, buy those'", 'build note'),
    ("fieldLabel(run) + (isArena ? ' · by wildcards you\\'d need' : ' · by what the missing cards cost')", "fieldLabel(run) + ' · by what the missing cards cost'", 'field craft note'),
    ("      const wcCost = (n) => (n.rare || 0) + 2 * (n.mythic || 0) + 0.2 * ((n.uncommon || 0) + (n.common || 0));\n", "", 'wcCost'),
    ("FC.rows.slice().sort((a, b) => isArena ? wcCost(a.need || {}) - wcCost(b.need || {}) : (a.usd || 0) - (b.usd || 0))", "FC.rows.slice().sort((a, b) => (a.usd || 0) - (b.usd || 0))", 'field sort'),
    ("hasBuy: !isArena && miss > 0 && !!(r.missing && r.missing.length), noBuy: !(!isArena && miss > 0 && r.missing && r.missing.length)",
     "hasBuy: miss > 0 && !!(r.missing && r.missing.length), noBuy: !(miss > 0 && r.missing && r.missing.length)", 'field buy'),
    ("needS: !miss ? 'buildable' : isArena ? RAR.filter(k => n[k]).map(k => n[k] + R1[k]).join(' ') : (r.usd != null ? money(r.usd) : miss + ' to buy'), needColor: !miss ? WIN : isArena ? (RAR.some(k => (n[k] || 0) > ((COL.wildcards || {})[k] || 0)) ? MUTED : 'var(--ink)') : 'var(--ink)'",
     "needS: !miss ? 'buildable' : (r.usd != null ? money(r.usd) : miss + ' to buy'), needColor: !miss ? WIN : 'var(--ink)'", 'field need'),
]: sub1(a, b, what)
assert 'isArena' not in s and 'wcS(' not in s, 'the Arena fork is not gone'

# ---------- 2 · the collection paste is reversible ----------
sub1('or any list of "4 Card Name (SET) 123" lines. It replaces the old one. ManaBox: Collection → ⋯ → Export.',
     'or any list of "4 Card Name (SET) 123" lines. ManaBox: Collection → ⋯ → Export.', 'replace warning')
sub1('<sc-if value="{{ acColIdle }}" hint-placeholder-val="{{ true }}"><div><a href="#" onClick="{{ acColStart }}"',
     '<sc-if value="{{ acColUndoOn }}" hint-placeholder-val="{{ false }}"><div data-change26="undo" style="font-size:var(--fs-s);color:var(--muted)">{{ acColUndoLine }} · <a href="#" onClick="{{ acColUndo }}" style="color:var(--ink);font-weight:600">Undo</a></div></sc-if>\n'
     '        <sc-if value="{{ acColIdle }}" hint-placeholder-val="{{ true }}"><div><a href="#" onClick="{{ acColStart }}"', 'undo markup')
sub1("const r = await this.api('/api/collection/paper', { method: 'POST', body: { text: t } }); this.setState(s => ({ collection: { ...(s.collection || {}), paper: r && r.cards ? r : { at: new Date().toISOString(), source: 'pasted', cards: {} } }, acColStep: null, acColNote: '' }));",
     "const was = S.collection && S.collection.paper, r = await this.api('/api/collection/paper', { method: 'POST', body: { text: t } }); this.setState(s => ({ collection: { ...(s.collection || {}), paper: r && r.cards ? r : { at: new Date().toISOString(), source: 'pasted', cards: {} } }, acColStep: null, acColNote: '', colUndo: was && was.cards ? { from: was.size || cnt(was), to: (r && r.size) || 0 } : null, bfData: null }));", 'save keeps undo')
sub1("v.acColNote = S.acColNote || '';",
     "v.acColNote = S.acColNote || ''; v.acColUndoOn = !!S.colUndo && !S.acColStep; v.acColUndoLine = S.colUndo ? 'Replaced ' + S.colUndo.from + ' cards with ' + S.colUndo.to : '';\n"
     "          v.acColUndo = pe(async () => { if (S.busy) return; this.setState({ busy: true }); try { const r = await this.api('/api/collection/paper/undo', { method: 'POST', body: {} }); this.setState(s => ({ collection: { ...(s.collection || {}), paper: r }, colUndo: null, bfData: null })); } catch (e) { this.setState({ acColNote: e.message, colUndo: null }); } this.setState({ busy: false }); });", 'undo action')
sub1("acColSave: pe(() => {}),", "acColSave: pe(() => {}), acColUndoOn: false, acColUndoLine: '', acColUndo: pe(() => {}),", 'undo defaults')

# ---------- 3 · sign in: the code first, the password behind a link ----------
sub1('<div style="font-size:var(--fs-m);color:var(--muted)">Name and password. Your decks stay private. No reset yet — save the password. 13+.</div>',
     '<div style="font-size:var(--fs-m);color:var(--muted)">Name and password. Add an email on Account to sign in with a code. 13+.</div>', 'sign-up line')
sub1('<sc-if value="{{ noInvites }}" hint-placeholder-val="{{ false }}">For the founders while the sim is calibrated. Sign in with your Star Shard account.</sc-if>',
     '<sc-if value="{{ noInvites }}" hint-placeholder-val="{{ false }}">Sign-up is closed for now.</sc-if>', 'closed line')
i = s.index('autocomplete="current-password"'); a = s.rindex('\n', 0, i) + 1; b = s.index('\n', i)
line = s[a:b]; assert line.startswith('    <div style="display:flex;flex-direction:column;gap:16px"><label') and line.endswith('</a></div></sc-if>'), 'password form line'
s = s[:a] + '    <sc-if value="{{ pwOpen }}" hint-placeholder-val="{{ false }}">' + line[4:-len('</sc-if>')] + '</sc-if></sc-if>' + s[b:]
sub1('<sc-if value="{{ isNotInvite }}" hint-placeholder-val="{{ true }}"><div data-change15="code" style="display:flex;flex-direction:column;gap:12px">\n'
     '      <div style="display:flex;align-items:center;gap:12px;font-size:var(--fs-xs);font-family:var(--mono);color:var(--muted)"><span style="flex:1;height:1px;background:var(--line)"></span>or<span style="flex:1;height:1px;background:var(--line)"></span></div>\n',
     '<sc-if value="{{ isNotInvite }}" hint-placeholder-val="{{ true }}"><sc-if value="{{ pwClosed }}" hint-placeholder-val="{{ true }}"><div data-change15="code" data-change26="signin" style="display:flex;flex-direction:column;gap:12px">\n', 'code block')
i = s.index('data-change26="signin"'); j = s.index('    </div></sc-if>', i)
s = s[:j] + '    </div></sc-if><a href="#" onClick="{{ pwToggle }}" style="font-size:var(--fs-s);color:var(--muted)">{{ pwToggleLabel }}</a></sc-if>' + s[j + len('    </div></sc-if>'):]
sub1("codeIdle: !S.codeStep, codeAskEmail: S.codeStep === 'email',", "codeIdle: false, codeAskEmail: !S.codeStep || S.codeStep === 'email', pwOpen: !!S.pwOpen, pwClosed: !S.pwOpen, pwToggle: pe(() => this.setState({ pwOpen: !S.pwOpen, signinErr: '' })), pwToggleLabel: S.pwOpen ? 'Email me a code instead' : 'Use a password',", 'pw state')
sub1("signinNote: S.signinErr || 'Forge plays both sides of every game.',", "signinNote: S.signinErr || '',", 'signin note')

# ---------- 4 · a stopped run says where it stopped; the reason is admin-only ----------
sub1("v.brief = { status: run.status === 'cancelled' ? 'The run was cancelled' : 'The run didn\\'t finish', statusNote: run.error || (run.status === 'lost' ? 'The sim restarted while it was queued.' : 'Forge crashed before any games finished.'), weakness: '', weaknessNote: '' };",
     "v.brief = { status: 'Stopped', statusNote: 'Stopped at game ' + (run.played || 0) + ' of ' + (run.total || 0) + '.', weakness: '', weaknessNote: '' };", 'stopped brief')
sub1("msg = ok ? b.name + ' finished: ' + r.played + ' games' : b.name + ': the run ' + (r.status === 'cancelled' ? 'was cancelled' : 'stopped');",
     "msg = ok ? b.name + ': run done, ' + r.played + ' games' : b.name + ': run stopped at game ' + (r.played || 0);", 'toast')
sub1("const flag = o.pairing === 'failed' ? 'Forge stopped early' :", "const flag = o.pairing === 'failed' ? 'stopped' :", 'pairing flag')
sub1("['Forge', [o.pairing === 'failed' ? 'stopped early' : '',", "['The sim', [o.pairing === 'failed' ? 'stopped' : '',", 'pairing detail')
sub1("o.pairing === 'failed' ? 'Forge stopped early' : ''].filter(Boolean).join(' · '),", "o.pairing === 'failed' ? 'stopped' : ''].filter(Boolean).join(' · '),", 'pairing sub')
# the admin footer: the engine version and the last stop's reason, admins only
sub1('<div style="font-size:var(--fs-xs);color:var(--muted);line-height:1.5">Forge {{ forgeVer }}</div>',
     '<sc-if value="{{ isAdmin }}" hint-placeholder-val="{{ false }}"><div data-change26="admin" style="font-size:var(--fs-xs);color:var(--muted);line-height:1.5;font-family:var(--mono)">engine {{ forgeVer }}<sc-if value="{{ adminStopOn }}" hint-placeholder-val="{{ false }}"><br>last stop: {{ adminStop }}</sc-if></div></sc-if>', 'admin footer')
sub1("v.latest = { at: at(run.created) };", "v.latest = { at: at(run.created) }; v.adminStopOn = v.isAdmin; v.adminStop = run.error || (run.status === 'lost' ? 'lost in a restart while queued' : run.status === 'cancelled' ? 'cancelled' : 'the engine stopped before any game finished');", 'admin stop')
sub1("who: S.me ? '@' + S.me.user.name : '',", "adminStopOn: false, adminStop: '', who: S.me ? '@' + S.me.user.name : '',", 'admin defaults')

# ---------- 5 · empty states ----------
# Sim with no run: one line, one action
sub1('    <sc-if value="{{ isSim }}" hint-placeholder-val="{{ false }}">\n    <div data-screen-label="Results"',
     '    <sc-if value="{{ simEmpty }}" hint-placeholder-val="{{ false }}"><div data-change26="sim-empty" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:24px 0"><div style="font-size:var(--fs-l);font-weight:600">No runs yet</div><a href="#" onClick="{{ toggleRun }}" style="background:var(--accent);color:var(--bg);border-radius:6px;padding:10px 16px;font-weight:600;font-size:var(--fs-m)">Run</a></div></sc-if>\n'
     '    <sc-if value="{{ isSim }}" hint-placeholder-val="{{ false }}">\n    <div data-screen-label="Results"', 'sim empty')
sub1("    const run = d.runs.find(r => r.id === S.runId) || d.runs[0] || null;",
     "    const run = d.runs.find(r => r.id === S.runId) || d.runs[0] || null;\n    v.simEmpty = v.isSim && !run; v.isSim = v.isSim && !!run;", 'sim gate')
sub1("isCollection: false, isSim: false,", "isCollection: false, isSim: false, simEmpty: false, ckLoading: false,", 'empty defaults')
# the coach before the first run
sub1("v.brief = { status: 'Not run yet', statusNote: 'Run v' + ver.v + ' ▾ picks who it plays.', weakness: '', weaknessNote: '' };",
     "v.brief = { status: 'Not run yet', statusNote: v.coachLive ? 'Ask about the deck; matchup modes unlock after a run.' : 'Run the deck to start.', weakness: '', weaknessNote: '' };", 'coach empty')
# the check while it's worked out: a skeleton, no text
sub1("{ const CK = ver.check || null; v.hasCheck = !!CK && !ED;", "{ const CK = ver.check || null; v.hasCheck = !!CK && !ED; v.ckLoading = !CK && !ED;", 'check loading')
sub1('        <sc-if value="{{ hasCheck }}" hint-placeholder-val="{{ true }}"><div data-change24="check"',
     '        <sc-if value="{{ ckLoading }}" hint-placeholder-val="{{ false }}"><div data-change26="check-skeleton" aria-busy="true" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;border:1px solid var(--line);border-radius:8px;padding:20px 24px"><div class="fs-sheen" style="height:14px;border-radius:4px;background:var(--track)"></div><div class="fs-sheen" style="height:14px;border-radius:4px;background:var(--track)"></div><div class="fs-sheen" style="height:14px;border-radius:4px;background:var(--track)"></div></div></sc-if>\n'
     '        <sc-if value="{{ hasCheck }}" hint-placeholder-val="{{ true }}"><div data-change24="check"', 'check skeleton')
# what you could build, with nothing yet ("server" is an infra word)
sub1("v.bfEmptyNote = S.bfErr || (v.hasPaper ? 'Nothing yet. The server reads the collection against the field once a week; check back after the next field refresh.' : 'Paste your paper collection on the Account screen first.');",
     "v.bfEmptyNote = S.bfErr || (v.hasPaper ? 'Nothing close yet · it refreshes with the field.' : 'No collection yet.');", 'build empty')

# the coach's run line has nothing to say before a run (it rendered a lone "·")
T = '<div style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--muted)">{{ runAt }} · {{ snapshotLabel }}<sc-if value="{{ canCancel }}" hint-placeholder-val="{{ false }}"> · <a href="#" onClick="{{ doCancelRun }}" style="color:var(--muted)">{{ cancelLabel }}</a></sc-if></div>'
i = s.index('data-v5="coach"'); j = s.index(T, i)
s = s[:j] + '<sc-if value="{{ hasRunAt }}" hint-placeholder-val="{{ true }}">' + T + '</sc-if>' + s[j + len(T):]
sub1("    v.runAt = run ? at(run.finished || run.created) : '';", "    v.runAt = run ? at(run.finished || run.created) : ''; v.hasRunAt = !!run;", 'run line')
sub1("change: '', runAt: '',", "change: '', runAt: '', hasRunAt: false,", 'run line default')

# ---------- 6 · compare on a one-version deck: disabled, said once ----------
sub1("v.canCompare = v.isDuel && d.versions.length >= 2;",
     "v.canCompare = v.isDuel && d.versions.length >= 2; if (!v.canCompare) { v.setViewCompare = pe(() => {}); v.viewCompareColor = 'var(--line-strong)'; }", 'compare disabled')
sub1("title: canMode(id) ? title : id === 'review' ? 'needs two versions' : 'the coach is busy',", "title: canMode(id) ? title : id === 'review' ? '' : 'thinking',", 'coach compare copy')

open(out, 'w', encoding='utf-8').write(s); print('patched', out)
