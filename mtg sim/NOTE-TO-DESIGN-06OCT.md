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
