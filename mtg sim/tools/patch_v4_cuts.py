#!/usr/bin/env python3
"""Change 28 (FORGE-SIM-DISTILL.md §5, the end-user cut list) on the live page: the second, third and fourth way of
saying a thing goes; nothing that does something goes.
  - Trust is one stat in the Sim stat row ("Trust · fair on versions, weak on matchups"), its "how" opens the method
    sheet, which now holds the caveat once. The trust line under the stats, "(sim)", "Test the big ones yourself" and
    the cards' bias caveat go.
  - "Safe to close the tab" (three places) and "Results land as games finish…" go; the status says it.
  - Sign in, the paste and run steps, Versions, the plan, Account, the phone, the Codex and the field picker lose
    their helper sentences; titles become one word where the brief says so; buttons lose → and ▾ as meaning.
Not done here, on purpose: folding "What beat you" into Matchups and the field picker's disagreement tooltip move
layout, not copy; they belong to the v5 Sim template.
Idempotent (marker data-change28); needs change 27. Usage: patch_v4_cuts.py public/index.html [out]"""
import sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-change28' in s: print('already applied'); sys.exit(0)
assert 'data-change27' in s, 'apply patch_v4_vocab.py (change 27) first'
def sub(a, b, n=1):
    global s
    assert s.count(a) == n, f'"{a[:70]}" found {s.count(a)} times, expected {n}'
    s = s.replace(a, b)

# ---------- sign in ----------
sub('style="font-size:var(--fs-s);color:var(--muted)">Already a member · sign in</a>', 'style="font-size:var(--fs-s);color:var(--muted)">Sign in</a>')
sub('text-decoration:underline">Make an account</a>: a name and a password.</sc-if>', 'text-decoration:underline">Make an account</a></sc-if>')
# ---------- paste and run steps ----------
sub('<div style="font-size:var(--fs-s);color:var(--muted);line-height:1.5">Deck in a box? Scan it with ManaBox or Delver Lens, export text, paste.</div>', '')
sub('style="font-size:var(--fs-m);color:var(--muted)">← Back to the list</a>', 'style="font-size:var(--fs-m);color:var(--muted)">Back</a>')
sub('style="font-size:var(--fs-m);color:var(--muted)">← Fix the list</a>', 'style="font-size:var(--fs-m);color:var(--muted)">Edit</a>')
sub('<div style="font-size:var(--fs-s);color:var(--muted)">Anything the coach should keep in mind? Optional.</div>', '')
sub('<div style="font-size:var(--fs-l);color:var(--muted);line-height:1.5">You can change this on every run.</div>', '')
sub('{{ fsFootLine }}<br><span style="font-size:var(--fs-s);color:var(--muted)">Safe to close the tab. Results fill in as games finish.</span>', '{{ fsFootLine }}')
sub(" + ' Safe to close the tab.' };", " };")
# ---------- Sim: one Trust stat; the rest of the caveats go to the method sheet ----------
sub('        <div style="font-size:var(--fs-l);line-height:1.55;max-width:640px">Results land as games finish. Early games swing — wait for the full run. Safe to close the tab.</div>\n', '')
sub('<div style="display:grid;grid-template-columns:8px minmax(0,1fr);gap:10px;align-items:start;font-size:var(--fs-s);line-height:1.55;color:var(--muted);max-width:700px"><span style="width:8px;height:8px;border-radius:50%;margin-top:7px;background:{{ fidColor }}"></span><div><b style="font-weight:600;color:var(--ink-2)">{{ fidTitle }}</b> {{ fidNote }}</div></div>', '')
i = s.index('<div data-change16="stats"'); j = s.index('\n        </div>\n', i)
s = s[:j] + '\n          <div data-change28="trust"><div style="font-size:var(--fs-xs);color:var(--muted)">Trust</div><div style="font-size:var(--fs-m);font-weight:600;margin-top:2px;color:{{ fidColor }}">{{ trustValue }}</div><a href="#" onClick="{{ toggleMethod }}" style="font-size:var(--fs-xs);color:var(--muted)">how</a></div>' + s[j:]
sub("      v.evUnder = under; v.leversNote = 'What each change is worth, in matches per 100' + (under ? '. Test the big ones yourself.' : '.');",
    "      v.evUnder = ''; v.leversNote = 'What each change is worth, in matches per 100.';\n"
    "      v.trustValue = { unknown: 'fair on versions, weak on matchups', low: 'fair on versions, weak on matchups', some: 'fair on versions, partial on matchups', good: 'good on versions and matchups' }[fidLevel];\n"
    "      v.methodRows = [{ k: 'Trust', v: v.fidTitle + ' ' + v.fidNote }].concat(v.methodRows || []);")
sub("fidColor: 'var(--mark)', fidTitle: '', fidNote: '',", "fidColor: 'var(--mark)', fidTitle: '', fidNote: '', trustValue: '',")
sub("v.cardsNote = cs.games + ' games · cheap cards read low, top end high · under ±10 is noise';", "v.cardsNote = cs.games + ' games · under ±10 is inside the noise';")
sub('<span>range · 50% marked</span>', '<span>range</span>')
sub('font-weight:600">What would raise your top-8 odds most</div>', 'font-weight:600">Levers</div>')
sub('font-weight:600">How each card played</div>', 'font-weight:600">Cards</div>')
# the headline carries no hedge: the Trust stat says it once
sub("'% vs the field' + (run.calibration && run.calibration.fidelity && run.calibration.fidelity.lo >= 0.7 ? '' : ' (sim)')", "'% vs the field'")
sub("v.evAgainst = (E ? ' vs the field' : ' vs these decks') + (REL ? '' : under ? ' · sim' : '');", "v.evAgainst = E ? ' vs the field' : ' vs these decks';")
sub('font-weight:600">Your matchups</div>', 'font-weight:600">Matchups</div>')
# the field picker
sub('padding-bottom:8px">Sources · blended by default</div>', 'padding-bottom:8px">Sources</div>')
sub('padding-bottom:8px">Snapshots · run any version against any week</div>', 'padding-bottom:8px">Weeks</div>')
# ---------- Deck: versions, the plan, the empty collection ----------
sub('">Versions</div><div style="font-size:var(--fs-s);color:var(--muted)">each run freezes a version</div></div>', '">Versions</div></div>')
sub('style="color:var(--accent);font-weight:600">Paste a new list →</a> you see the diff before it saves · old versions rerun on any week</span>', 'style="color:var(--accent);font-weight:600">New version</a></span>')
sub('style="color:var(--ink)">Compare two versions →</a>', 'style="color:var(--ink)">Compare</a>')
sub('<span style="color:var(--ink)">editing · − + Swap on any card</span>', '<span style="color:var(--ink)">editing</span>')
sub('font-weight:600">Sideboard plans</div>', 'font-weight:600">Plan</div>')
sub("padding-top:12px\">Coach's plan from the last run. Edit in place; amber means ins ≠ outs.</div>", "padding-top:12px\">amber: ins ≠ outs</div>")
sub("<div style=\"font-size:var(--fs-s);color:var(--muted);padding-top:12px\">Coach's read from the run. Role = who you are post-board. Re-ask after a change.</div>", '')
sub("onsidering</div><div style=\"font-size:var(--fs-s);color:var(--muted)\">the coach's suggestions land here first</div>", "onsidering</div>")
sub('<div style="font-size:var(--fs-s);color:var(--muted)">Paste your ManaBox export and the sim builds from what you own, prices what you don\'t, and says which buys are worth it.</div>', '')
sub('white-space:nowrap">Paste my collection</a>', 'white-space:nowrap">Paste your ManaBox export</a>')
# ---------- Collection ----------
sub('<div style="font-size:var(--fs-xl);font-weight:600">Your collection</div></div><div style="font-size:var(--fs-xs);color:var(--muted)">', '<div style="font-size:var(--fs-xl);font-weight:600">Missing</div></div><div style="font-size:var(--fs-xs);color:var(--muted)">')
# ---------- Account ----------
sub('<div><div style="font-size:var(--fs-s);color:var(--muted)">What the plan allows</div>', '<div><div style="font-size:var(--fs-s);color:var(--muted)">Plan</div>')
sub('<div style="font-size:var(--fs-s);color:var(--muted)">Payment and receipts are handled by Stripe; the sim never sees your card. <a href="#" onClick="{{ acPortal }}"', '<div style="font-size:var(--fs-s);color:var(--muted)"><a href="#" onClick="{{ acPortal }}"')
sub('font-weight:600">What you\'ve used</div>', 'font-weight:600">Usage</div>')
sub('padding:12px 0">Nothing yet. A run or a coach question will show here with what it cost.</div>', 'padding:12px 0">Nothing yet.</div>')
sub('<div data-change22="collection" style="display:flex;flex-direction:column;gap:10px"><div style="font-size:var(--fs-xl);font-weight:600">Your collection</div>', '<div data-change22="collection" data-change28="cuts" style="display:flex;flex-direction:column;gap:10px"><div style="font-size:var(--fs-xl);font-weight:600">Collection</div>')
sub('color:var(--loss)">This deletes your decks, runs and record for good. There is no undo.</span>', 'color:var(--loss)">Deletes your decks and runs. No undo.</span>')
sub('font-size:var(--fs-s)">Delete everything</a>', 'font-size:var(--fs-s)">Delete my account</a>')
sub("this.setState({ accountErr: 'On iPhone: Share → Add to Home Screen. Then open Forge Sim from there.' });", "this.setState({ accountErr: 'Share → Add to Home Screen' });")
sub("v.acPhoneNote = standalone ? 'Installed. Run done, weekly changes and coach answers arrive as notifications when they are on.' : 'Add Forge Sim to your Home Screen for notifications and the Table counter at events.';",
    "v.acPhoneNote = standalone ? 'Installed' : 'Share → Add to Home Screen';")
# ---------- Codex ----------
sub("<div style=\"font-size:var(--fs-l);color:var(--muted);line-height:1.5\">Every card and deck the sim knows about, with where it's played this week and how it did in your runs. Standard only for now.</div>", '')

open(out, 'w', encoding='utf-8').write(s); print('patched', out)
