#!/usr/bin/env python3
"""Change 27 (FORGE-SIM-DISTILL.md §3, the vocabulary law): one word per concept, in UI strings only. Code identifiers
(brewId, forgeVer, oppOpen, API paths, state keys) are untouched.
  deck (not brew) · run (not "Queue the run") · the sim (never "Forge" alone; "Forge Sim" is the brand) · matchup
  (not opponent, outside the Table counter) · field (not meta, gauntlet) · plan (not guide) · inside the noise ·
  done / stopped (not finished). And the goal reads "Competitive tournament", not "RCQ".
After it, the §3 grep returns no UI hits: node tools/distill-count.js --grep
Idempotent (marker data-change27); needs change 26. Usage: patch_v4_vocab.py public/index.html [out]"""
import sys
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
if 'data-change27' in s: print('already applied'); sys.exit(0)
assert 'data-change26' in s, 'apply patch_v4_distill_safety.py (change 26) first'
def sub(a, b, n=1):
    global s
    assert s.count(a) == n, f'"{a[:70]}" found {s.count(a)} times, expected {n}'
    s = s.replace(a, b)

# ---------- markup ----------
sub('text-decoration:underline">Brew from your collection</a>.', 'text-decoration:underline">Build one from your collection</a>.')
sub('font-size:var(--fs-m)">Check it in Forge</a>', 'font-size:var(--fs-m)">Check the deck</a>')
sub('>Queue the run</a>', '>Run</a>', 2)
sub('<div style="font-size:var(--fs-s);color:var(--muted);padding:0 8px">Brews</div>', '<div data-change27="vocab" style="font-size:var(--fs-s);color:var(--muted);padding:0 8px">Decks</div>')
sub('>+ brew from my collection</a>', '>+ build from my collection</a>')
sub('letter-spacing:-.01em">Brew from your collection</div>', 'letter-spacing:-.01em">What you could build</div>')
sub('>Your brews against it</div>', '>Your decks against it</div>')
sub('white-space:nowrap">Guide ↗</a>', 'white-space:nowrap">Plan ↗</a>')
sub('<span>share</span><span>opponent</span><span>verdict</span>', '<span>share</span><span>matchup</span><span>verdict</span>')
sub('<span>matchup</span><span style="text-align:right">meta</span>', '<span>matchup</span><span style="text-align:right">field</span>')
sub('>You own every card. Nothing to craft.</div>', '>You own every card.</div>')
sub('<div style="font-size:var(--fs-xl);font-weight:600">Sideboard guide</div>', '<div style="font-size:var(--fs-xl);font-weight:600">Plan</div>')

# ---------- script literals: the deck ----------
sub("'. The name and cover show in your brew list.'", "'. The name and cover show in your decks.'")
sub("kind: r.kind === 'brew' ? 'brew' : 'meta shell',", "kind: r.kind === 'brew' ? 'new deck' : 'field shell',")
sub("startLabel: started ? 'Open' : 'Start this brew',", "startLabel: started ? 'Open' : 'Start this deck',")
sub("'Decks your paper collection can carry: meta shells with the flex slots filled from what you own, and brews built around your strongest cards.", "'Decks your collection can carry: field shells with the flex slots filled from what you own, and decks built around your strongest cards.")
sub("vs field shows once a brew has run'", "vs field shows once a deck has run'")
sub(": 'Optimize my brew';", ": 'Optimize';")
# ---------- the sim, never Forge ----------
sub("'. Forge will skip ' + (unknown.length === 1 ? 'it' : 'them')", "'. The sim skips ' + (unknown.length === 1 ? 'it' : 'them')")
sub("'Every card found. Names are already in Forge\\'s spelling.'", "'Every card found.'")
sub("'Forge ' + S.me.forgeUpdate.version + ' is out ('", "'Engine ' + S.me.forgeUpdate.version + ' is out ('")
sub("deadcards: 'casts the cards Forge never casts'", "deadcards: 'casts the cards the stock pilot never casts'")
sub("{ k: 'Engine', v: 'Forge' + (/^\\d/.test(M.forge || '') ? ' ' + M.forge : '') + ' plays every game for both decks'", "{ k: 'Engine', v: 'The sim' + ' plays every game for both decks'")
sub("' Forge can\\'t pilot, left out'", "' the sim can\\'t pilot, left out'")
sub("': Forge pilots this worse than people, expect it to read low'", "': the sim pilots this worse than people, expect it to read low'")
sub("'Forge doesn\\'t have ' + cardsS(r.missing)", "'The sim doesn\\'t have ' + cardsS(r.missing)")
sub("'Forge\\'s AI won\\'t cast ' + cardsS(r.unplayable)", "'The sim won\\'t cast ' + cardsS(r.unplayable)")
sub("'Forge overrates some decks. Against '", "'The sim overrates some decks. Against '")
sub("'Not in Forge: ' + cardsS(mine.missing)", "'Not in the sim: ' + cardsS(mine.missing)")
sub("'Forge won\\'t cast ' + cardsS(mine.unplayable)", "'The sim won\\'t cast ' + cardsS(mine.unplayable)")
sub("' under Forge\\'s AI.'", "' under the sim\\'s AI.'")
sub("', which Forge pilots badly", "', which the sim pilots badly", 2)
sub("' pods · Forge is weakest at combo and politics'", "' pods · the sim is weakest at combo and politics'")
sub("{ ok: ['Forge plays it', MUTED], limited: ['Forge casts it only sometimes', AMBER], unplayable: ['Forge won\\'t cast it', AMBER], missing: ['not in Forge', LOSS] }",
    "{ ok: ['plays', MUTED], limited: ['sometimes', AMBER], unplayable: ['won\\'t cast', AMBER], missing: ['not in the sim', LOSS] }")
sub("'card') + ' Forge won\\'t cast' : 'every card in Forge')", "'card') + ' the sim won\\'t cast' : 'every card plays')")
sub("text: 'Forge won\\'t cast ' + c.name + '; the run would play it as a dead card. You can save anyway.'", "text: c.name + ': dead card in the sim. Save anyway?'")
sub("'not found · Forge skips '", "'not found · the sim skips '")
sub("plural(unk, 'card') + ' not in Forge, skipped' : 'every card in Forge'", "plural(unk, 'card') + ' not in the sim, skipped' : 'every card plays'")
sub("'Bo3, no sideboarding (no model key on the server)'", "'Bo3, no sideboarding'")
# ---------- matchup, field, plan, the noise, run states ----------
sub("'Choose opponents'", "'Choose the field'")
sub("' per opponent'", "' per matchup'")
sub("'The #1 deck, same opponents'", "'The #1 deck, same matchups'")
sub("' opponents you are '", "' matchups you are '")
sub("'weighted by meta share'", "'weighted by field share'")
sub("' · no close meta deck'", "' · no close field deck'")
sub("' · uncalibrated until the weekly gauntlet runs'", "' · uncalibrated until the weekly field run'")
sub("'): some of the gap is the meta.'", "'): some of the gap is the field.'")
sub("{ k: 'Shared guide link',", "{ k: 'Shared plan link',")
sub("w.W.guideUpdated ? 'sideboard guide updated' : ''", "w.W.guideUpdated ? 'plan updated' : ''")
sub("{ sideboard: 'sideboard guide', pilot:", "{ sideboard: 'sideboard plan', pilot:")
sub("[['sideboard', 'Sideboard guide', ", "[['sideboard', 'Sideboard plan', ")
sub("' is within the noise. '", "' is inside the noise. '")
sub("['runDone', 'Run finished', ", "['runDone', 'Run done', ")
sub("'Installed. Run finished, weekly changes", "'Installed. Run done, weekly changes")
sub("'This run finished before the sim read game logs. Card stats start with the next run.'", "'This run predates the sim\\'s game logs. Card stats start with the next run.'")
sub("' hasn\\'t finished a run yet.'", "' hasn\\'t run yet.'")
sub("'the engine stopped before any game finished'", "'the engine stopped before any game completed'")
sub("'An illegal card blocks the brew; the check names it.", "'An illegal card blocks the deck; the check names it.")
sub("'One square per game, in the order Forge plays them.", "'One square per game, in the order the sim plays them.")
sub("'opponent and result; play/draw optional'", "'matchup and result; play/draw optional'")
sub("'Forge pilots both 75s. Good for comparing your versions;", "'The sim pilots both 75s. Good for comparing your versions;")
sub("Green ones are yours; the glowing one just finished.", "Green ones are yours; the glowing one just ended.")
# the goal: a competitive tournament, not "RCQ"
sub("const EVENT_LABEL = { rcq: 'RCQ',", "const EVENT_LABEL = { rcq: 'Competitive tournament',")

open(out, 'w', encoding='utf-8').write(s); print('patched', out)
