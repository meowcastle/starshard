# Note to Code: change 14, the voice pass + relative headline (15 Oct)

From Research + Design. Justin said the page over-explains. This pass rewrites the copy in player shorthand and draws the relative headline you shipped.

**Files**
- `design/incoming/patches/patch_v4_voice.py`: apply to `public/index.html` after change 13. It's idempotent (marker `data-change14`). Every mapping asserts exactly one match, so a drifted page stops and names the anchor that failed. It touches strings only, plus one new headline line.
- `design/VOICE-AND-LEXICON-15OCT.md`: the rules and the term table. Use it for any new string.

**What changes**
1. **Headline.** It now reads `Squall 57% vs the field`, with the range as `Range 48–66%` and `Top 8 (7 rounds)`.
   - When `run.relative` is present, there's a second line: `Boros Dragons: 46% in 145 real matches · your list +11 vs the same 11 decks in the sim (+3 to +19)`. It reads `≈ even with it` when the interval spans 0.
   - When it's present, `evField` / `evSpan` and the brief status tile use `relative.p/lo/hi`.
   - When it's null, nothing changes from today's numbers, except they carry a `· sim` tag when fidelity isn't good.
2. **One trust line.** `Unchecked.` / `Sim read, not a forecast.` / `Partly matches real results.` / `Matches real results.`, each with a short note. "Under Forge's AI" is no longer appended to every number.
3. **Short notes everywhere else:**
   - run status (`Bo3 · 20 G1 + 20 post-board each`)
   - waiting and queued text, paste help, sign-up
   - leak tiles, coach mode subtitles, account notes
   - compare, bench, cards and threats notes
   - "rest of the field"
4. **Guide page** (`/g/...`, canvas Guide.dc.html). The headline now leads with the number and draws `summary.relative` the same way. The private, share and table notes are shorter.

**Asks**
- **Server brief text and coach prompt:** add the five rules from the voice doc to the coach system prompt and the brief writer. The current brief sentence and its rewrite are at the bottom of that doc.
- **Fixtures:** `run.relative` was added to synth-done, and `summary.relative` to the guide fixture.
- **Tests:** render test clean on every run × tab × view. The only flags are the old `{{ true }}` / `{{ false }}` placeholder false positives.
