#!/usr/bin/env python3
"""A message bar for actions that happen outside a sheet (the 16 Oct crawl: "run v3 on today's field" and "Run v3
again" did nothing visible when the server refused the run, because the reason only showed inside the run sheet).
A run that's refused says why; a run that's queued says what it is and lands on Sim. Idempotent (marker data-msg);
needs patch_suggestions.py. Usage: patch_msg.py public/index.html [out]"""
import sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-msg' in s: print('already applied'); sys.exit(0)
assert 'data-sugg' in s, 'apply patch_suggestions.py first'
def sub1(a, b, what):
    global s
    assert s.count(a) == 1, f'anchor for {what} found {s.count(a)} times'
    s = s.replace(a, b)
i = s.index('  <sc-if value="{{ hasCoachCol }}" h'); j = s.index('\n', i) + 1
s = s[:j] + ('  <sc-if value="{{ msgOn }}" hint-placeholder-val="{{ false }}"><div data-msg="1" role="status" style="position:fixed;left:50%;transform:translateX(-50%);bottom:28px;z-index:60;max-width:min(640px,calc(100vw - 32px));display:flex;gap:16px;align-items:baseline;background:var(--surface);border:1px solid {{ msgRing }};border-radius:10px;padding:12px 16px;box-shadow:0 8px 32px rgba(0,0,0,.5);font-size:var(--fs-s);line-height:1.5"><span style="color:var(--ink)">{{ msgText }}</span><a href="#" onClick="{{ msgClose }}" style="color:var(--muted);white-space:nowrap">Close</a></div></sc-if>\n') + s[j:]
sub1("    } catch (e) { this.setState({ runErr: e.message }); }\n    this.setState({ busy: false });",
     "    } catch (e) { this.setState({ runErr: e.message, msg: { text: 'Not queued: ' + e.message, bad: true } }); }\n    this.setState({ busy: false });", 'queue error')
sub1("tab: 'coach', view: 'run', codex: null, fsStep: 1", "tab: 'sim', view: 'run', codex: null, fsStep: 1", 'queue lands on Sim')
sub1("      const b = await this.api('/api/brews/' + brewId + '/run', { method: 'POST', body: { oppSet, v } });",
     "      const b = await this.api('/api/brews/' + brewId + '/run', { method: 'POST', body: { oppSet, v } });\n"
     "      { const r = b && b.runs && b.runs[0], st = b && b.versions && (b.versions.find(x => x.v === (r && r.v)) || {}).state; if (r) this.setState({ msg: { text: 'v' + r.v + ' is queued' + (st && st.line && st.line !== 'queued' ? ' · ' + st.line : '') + '. It keeps going if you leave this page.' } }); }", 'queue ok')
sub1("plans: [], hasPlans: false, brewList: [], ", "plans: [], hasPlans: false, brewList: [], msgOn: false, msgText: '', msgRing: 'var(--line-strong)', msgClose: pe(() => {}), ", 'defaults')
sub1("    v.buyUrl = buyUrl; v.buyList = buyList;", "    v.buyUrl = buyUrl; v.buyList = buyList;\n    v.msgOn = !!S.msg; v.msgText = S.msg ? S.msg.text : ''; v.msgRing = S.msg && S.msg.bad ? LOSS : 'var(--line-strong)'; v.msgClose = pe(() => this.setState({ msg: null }));", 'render')
open(out, 'w', encoding='utf-8').write(s); print('patched', out)
