> **MERGED into `DESIGN-BRIEF.md` on Aug 12** — the card-template spec and
> product-table row now live in the brief itself. Kept for reference only.

# DESIGN-BRIEF.md — P4 replacement (naming direction v3)

**Patch file.** The on-disk `DESIGN-BRIEF.md`'s P4 and card notes still describe
Arabic-first mansion naming — two revisions stale. When the desktop reconnects,
this section replaces P4 wholesale (and the product-table row for the moon shard
gets the one-line swap at the bottom). Claude Design should treat this file as
authoritative for the card/mansion surfaces until the brief is merged.

---

### P4 — The 28 mansions are the front door (naming architecture v3)

The mansions lead with **English epithet names** — "The Void," "The Ghost,"
"The Gathered Stars" — one per mansion, approved slate in
`research/mansion-names.md`. Each epithet is a translation from one of the four
real traditions, never an invention. The mansions are the primary identity
system: the epithet *is* the archetype name.

**Card template (star-seed interstellar, card context per DESIGN-SYSTEM.md):**

- **Epithet large** — Baloo 2, the card's identity ("The Void")
- **Kanji as the corner glyph** — 虛宿, the visual signature
- **The mansion's real asterism** as the constellation mark (star positions are
  in `research/mansions-table.json`)
- **Four cultural names small along the base** — Arabic · Sanskrit · Chinese ·
  Japanese, with the match-quality flag (STRONG / PARTIAL / DIVERGENT) as a
  subtle mark, never hidden
- Art direction: the mansion as a **seed of light** — interstellar, not
  desert-Arabic and not shrine-Japanese; the cultures live in the type layer,
  not the illustration style
- The Void and The Ghost should look like cards people fight over

**Copy sources:** birth entry (~80–100 words) = the card back, from
`research/mansions-pilot.md` + `mansions-batch1..4.md`. Daily crossing copy =
the today screen. Grimoire trivia lines are permalink-page content.

**Hard rules:**

- Fushigi Yūgi is **grimoire trivia only** — never display names, never imagery
- Naming morphology: mansions are always "The ___"; the mirror shard's 16
  archetypes will use compound single words — no collisions
- The nijūhasshuku/sukuyō caveat (27 vs 28 stations) is one grimoire sentence,
  already drafted in the batch files — don't design it away
- `[VERIFY]`-flagged facts in the batch files are not final copy until cleared —
  see `research/verify-report.md` for which are now cleared

**Product-table row swap (line 24 of the brief):**
> | 🌙 | **moon** | One of **28 lunar mansions** ("The Void," "The Ghost"…) — a
> station system shared across Arabic, Indian, Chinese and Japanese sky-lore,
> shown with all four names |
