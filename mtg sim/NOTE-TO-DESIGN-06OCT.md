# Brewer v3 — received and wired (Code → Design, 6 Oct 2026)

`public/index.html` is now your v3 page on real data. `mock-data.js` is not shipped.
Markup edits Code made, so a regenerated page keeps them:

- **Sign in**: both inputs bound (`signinName`/`signinPw`, `onSigninName`/`onSigninPw`,
  `signinKey` on the password for Enter); button → `doSignin`, label `signinLabel`; the
  "Forge 2.0.15 plays every game" line → `{{ signinNote }}` in `signinNoteColor` (carries
  errors). Name label now reads "Star Shard username" — logins are Star Shard accounts, so
  there is no invite flow; "Have an invite link?" explains that instead.
- **First run step 1**: textarea → `pasteText`/`onPaste`; footnote → `{{ fsNote }}` in
  `fsNoteColor`; button → `doCheck`, label `checkLabel`.
- **Step 2**: the Squall sample → `{{ chkTitle }}`, `{{ chkSub }}`, and a `chkRows` loop
  (`r.color`, `r.name`, `r.note`, `r.section`); note input → `noteText`/`onNote`;
  "Choose opponents" → `doCreate`, label `createLabel`.
- **Step 3** footer first line → `{{ fsFootLine }}`; second line now reads "The results fill
  in as the games finish." (no coach writeup yet).
- **Sidebar**: "Justin" → `{{ who }}`, sign out → `doSignout`, "Forge 2.0.15" → `Forge {{ forgeVer }}`.
- **Run panel** footer → `{{ runLine }}` in `runLineColor`. Bo3 is not wired (Forge's sim
  is run game by game), so the Bo1/Bo3 toggle is gone from that line.
- **Compare**: the sample diff is wrapped in `<sc-if hasCompare>`, with a `noCompare` /
  `{{ noCompareNote }}` empty state. There is one version per brew today.
- **Sideboard plans** gate on `hasPlans` instead of `isDuel`.

Not wired, and shown honestly rather than mocked: the coach (no model call yet; the brief
is computed from the games), the source/snapshot picker (one source, read at queue time),
Considering, sideboard plans, goals, test-it, pod elimination stats (`—`).

One thing for your side: `<img src="{{ … }}">` makes the browser request the literal
mustache before hydration (10 harmless 404s a load: `b.art`, `deckArt`, `g.art`, `s.art`,
`hoverSrc`). Same class as the Star Shard SVG sweep; a style background or a `_pathG`-like
injected element avoids it.

## 7 Oct — the benchmark and "not counted" rows

- Results → This run, second column: the label "Against the last field" is now `{{ col2Label }}`. When a run has a benchmark it reads "The #1 deck, same opponents" and the number is the field's top deck run through the same opponents under the same AI; otherwise it falls back to the previous run as before.
- Opponent rows whose decklist reads as control or combo show an amber flag line ("Not counted · …") at 0.6 opacity and are left out of the headline. Other rows' flag line now carries "the #1 deck went W–L" for that opponent.
- No other markup changed. A designed treatment for both (a proper benchmark column, a legend for "not counted") is welcome.

## 7 Oct, later — best of three and calibration

- The opponent table's rate column header is now `{{ rateHead }}` ("match win rate · 95% range"); the number in each row is the best-of-three match win rate, calibrated against real tournament results when there are any. The row's grey line carries game 1 and boarded records and how far real results moved it.
- The run's headline is matches won, calibrated. Everything else is unchanged markup.
- Worth designing properly: game 1 / boarded / match as three columns, each opponent's sideboard plan (both sides' ins and outs and the one-line why are in the run data as `opponents[i].plan`), and a "calibrated against N real games" badge.

## 7 Oct, evening — the 7 Oct pack is in

Merged onto the live page: the four-step wizard, the Codex, the Coach thread layout and the live grid. What differs from the pack, and why:

- **Sign-in** stays as it was live: real username/password fields, no "Have an invite link?" (Justin removed it on purpose).
- **Wizard step 1** title is `{{ fsTitle }}` (reads "Paste v2 of …" when adding a version); the note line under the box is `{{ fsNote }}` (errors show there). A new version skips step 2.
- **Wizard step 2**: the subtitle is `{{ nameSub }}`; the upload drop zone is now a `<label>` wrapping a hidden `<input type="file">` with `onDragOver`/`onDrop`, and its preview box reads `{{ uploadArt }}` / `{{ uploadNote }}`. Uploads are cropped to 16:10 and re-encoded in the browser.
- **Wizard step 3** carries the real check rows (`chkTitle`, `chkSub`, `chkRows`) and the coach-note input (`noteText`).
- **Codex**: card art and archetype tiles are Scryfall art via `background: url(...)`. "In plain terms" binds `{{ cx.plainS }}` (reads "Writing…" while the model writes it). The add-note input is bound and saves on Enter.
- **Coach**: the weakness paragraph sits in `{{ hasWeak }}`, and "What is that?" in `{{ hasWeakLink }}` (Standard only, since the Codex is). Composer placeholder is `{{ askPlaceholder }}`: the coach is not connected yet, so the thread is empty.
- **Live indicator**: sparks only, built from real per-game results. spindown and phases need life totals / phase events Forge's quiet mode does not print.
- Not built yet: per-card sim stats on card entries (need Forge game logs), editing name/cover from the Deck tab (not drawn), the coach itself.

## 7 Oct, late — the coach is connected

- Options under the readout come from the coach. A swap gets "Test it" → "Testing as vN…" → "Tested · vN", and the result line under it is bound: `{{ o.resA }} → {{ o.resB }} {{ o.resPm }} · {{ o.resNote }}` (the mock "38% → 44% ±9 · 120 games" was hard-coded). Advice that isn't a swap has no action.
- Composer: Enter sends, Shift+Enter is a new line (`onKeyDown="{{ askKey }}"` on the textarea). While the coach writes, a "Thinking…" message sits at the end of the thread.
- The three chips are generated from the run: the worst matchup, the field's top deck, and the first note.
- Worth designing: a tested fix's result shows on the run it was suggested for, but the Coach shows the newest run, which is the test itself. Today the comparison is on Compare.
