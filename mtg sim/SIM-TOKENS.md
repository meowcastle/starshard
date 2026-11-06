# Sim tokens (Brewer v4, 13 Oct 2026)

Declared once in `:root` at the top of the page's stylesheet; every inline style and every script colour constant reads a variable. The `:root` block on the `Brewer-v4` artboard is the source; this page is the same table in words. The canvas board "v4 change 5 · tokens" shows it drawn.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | #0C0C0B | the page |
| `--surface` | #121211 | panels, open rows, inputs, the composer |
| `--track` | #1f1f1e | empty bars, art placeholders |
| `--mark` | #4a4a48 | the 50% hairline, hatching, "unknown" dots, dashed chip borders |
| `--ink` | #EDEBE6 | text (16.5:1) |
| `--ink-2` | #C9C7C0 | body text inside panels (11.7:1) |
| `--muted` | #8F8D86 | secondary text (5.9:1); the only grey for words |
| `--accent` | #C5EC7A | your deck, the one primary action, the selected option |
| `--win` | #7CC4F0 | at or above even |
| `--loss` | #F0A070 | below even |
| `--amber` | #F3CB6B | a caveat about the data: few games, a card Forge won't cast |
| `--line` | white 8% | row rules |
| `--line-strong` | white 12% | table heads, controls, the curve's group rules |

Retired: #5C5B56 as a text colour (2.9:1 on the page, fails small text); #B9D9F3 and #F3BC98 (the lighter "leans" chip inks; the chip background carries that difference); the near-blacks #161615, #1a1a19, #1C1C1A, #262626, #2a2a28, #2b2b29 and #3a3a38, folded into surface, track and mark. Mana pip colours (`MANA`) and pod seat colours (`SEAT`) stay literal: they belong to the game, not the system.

## Type

| Token | Size | Use |
| --- | --- | --- |
| `--fs-xxl` | 34px | the one number or sentence on a screen |
| `--fs-xl` | 22px | section title |
| `--fs-l` | 17px | lead paragraph |
| `--fs-m` | 15px | body, row titles |
| `--fs-s` | 13px | secondary text (absorbs the old 14px) |
| `--fs-xs` | 12px | mono labels, eyebrows, captions (absorbs 10, 10.5 and 11px) |
| `--mono` | 'JetBrains Mono', monospace | numbers and labels read as data; never prose |

## Laws

- Mono is for data: dates, records, percentages, eyebrows, counts. Prose, titles and verdicts are Manrope.
- Amber is a caveat about the data, never a property of a thing. A card Forge won't cast is amber; a bad matchup is `--loss`.
- One grey for words. If text needs to be quieter than `--muted`, it should be shorter or gone.
- Hairlines come in two weights. A third rule weight is a sign a region is doing two things.

## Wiring

Copy the `:root` block from the top of `Brewer-v4.dc.html`'s `<style>` into `public/index.html`. The artboard's markup and script already read the variables (`WIN`, `LOSS`, `MUTED`, `ACC`, `AMBER`, the hatch gradients and `CHIP` are `var(--…)` strings), so the diff against the shipped page is mechanical: `patch_v4_tokens.py` in the research session's notes is the exact substitution list.
