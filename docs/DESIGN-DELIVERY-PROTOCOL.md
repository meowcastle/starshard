# How Design should deliver to Code (and how Code should receive it)

> **Companion doc:** `docs/FOR-DESIGN-WHAT-CODE-OWNS.md` (31 Aug 2026) is the
> inventory this protocol assumes — what Code has built into the same file, the
> 33 methods both sides edit, and when Design should ask for a fresh copy of the
> live file rather than building on an old one. Send Design both.

**Written 31 Aug 2026, after the same failure landed three deliveries in a
row.** This is a process fix, not a code fix. It exists because the current
delivery shape has cost real, shipped work twice and nearly cost it a third
time.

## The problem, with receipts

Design's deliveries arrive as a **whole-workspace zip** — the Aug 31 one was
297MB, 26 top-level `.dc.html` files, hundreds of screenshots, every research
JSON ever generated. Inside that dump:

- **Stale copies of live files sit next to current ones, indistinguishable.**
  The Aug 31 zip's top-level `Manzil - Game Prototype V2.dc.html` was missing
  essentially a full day of shipped Code work (real-time PvP, the four staging-
  audit fixes, the real server-side logout) *and* had re-reverted the mobile
  touch-hold fix. Applying it wholesale would have silently undone all of it.
  The Aug 30 delivery did the same thing and **did** cost eight fixes, which
  had to be found and re-ported by hand (see
  `docs/MANZIL-CODE-OWNED-BEHAVIORS.md`, which exists only because of that).
- **`send-to-code/`, the folder that looks like the clean path, is itself
  stale.** As of the Aug 31 delivery it still ships
  `Manzil - Game Prototype V1.dc.html` — the *retired* file, not the deployed
  one — and carries none of the sound pass. A naive "only read
  `send-to-code/`" rule would have pointed Code at a dead file and thrown away
  a real feature.
- **Genuinely new work rides in on otherwise-stale files.** The 31 Aug sound
  pass existed *only* in that stale top-level V2. The delivery could not be
  accepted wholesale and could not be rejected wholesale. It had to be diffed
  line by line.

The net effect: every delivery costs an audit, and the audit is the only thing
standing between a good addition and a silent revert of a day's work.

## What Design should ship

**One folder. Current files only. A note saying what changed.**

```
send-to-code/
  WHATS-NEW.md                        <- required: see below
  Manzil - Game Prototype V2.dc.html  <- the DEPLOYED file, current
  <any other file actually changed>
```

Rules:

1. **Ship the deployed file, by name.** Manzil's deployed file is
   `Manzil - Game Prototype V2.dc.html`. V1 is retired and should not appear
   in `send-to-code/` at all. If the deployed file changes, this doc changes
   with it.
2. **Only include a file if it actually changed.** An unchanged file in the
   folder is noise that has to be diffed to discover it was noise.
3. **`WHATS-NEW.md` is required and is the whole point.** It should say, in
   plain sentences: what changed, in which file, and roughly where (function
   or screen name is enough). It does not need to be long — the Aug 31 sound
   pass would have been one sentence: *"Added the webaudio sound pass from
   Manzil - Sound Design.dc.html: new `_sfx*` methods, a pointerdown listener
   in componentDidMount, and a sound toggle in the pause plaque."* That one
   sentence replaces an hour of diffing.
4. **Regenerating the whole file is fine — say so.** Full regeneration is a
   legitimate way to work. But when it happens, `WHATS-NEW.md` must say
   *"this is a full regeneration of \<file\>"*, because that is precisely the
   case where Code has to check every item in
   `docs/MANZIL-CODE-OWNED-BEHAVIORS.md` before applying anything.
5. **Work orders keep going in `send-to-code/` as they already do.** That part
   has worked well — `WORKORDER-STAGING-FOUR-31AUG.md` was clear, correct, and
   actionable, and the four items in it shipped the same day.
6. **The rest of the workspace does not need to travel.** Research JSON,
   screenshots, historical `.dc.html` explorations, `uploads/` — none of it has
   ever been read by Code from a delivery. If something in there matters, name
   it in `WHATS-NEW.md` and it can be pulled deliberately.

## What Code does on receipt

Unchanged in spirit from `CLAUDE.md`'s receipt protocol, made concrete:

1. **Read `WHATS-NEW.md` first.** If it's absent, treat the whole delivery as
   unverified and diff everything — that's the expensive path this protocol
   exists to avoid.
2. **Diff every included file against the live repo copy before applying
   anything.** Never assume "it was in the delivery" means "it's newer."
   Confirmed twice now that it can mean the exact opposite.
3. **On any full-file regeneration, walk `docs/MANZIL-CODE-OWNED-BEHAVIORS.md`
   item by item.** A clean `npm run check` and no stray engine imports are
   *not* sufficient signals — every one of the regressions that list documents
   passed both.
4. **Port what's genuinely new onto the current file. Never replace the
   current file with a delivered one** unless the diff confirms the delivered
   copy is strictly ahead.

## Why not just "always take the delivery"

Because Design and Code both write to the same
`<script type="text/x-dc">` block — that shared seam is the one thing
`CLAUDE.md` opens by warning about. Design authors markup and visual/feel
systems (the sound pass, the UI overhaul, the avatars); Code owns account
wiring, the engine, networking, and the fixes on the checklist. Both are
legitimate; neither can be blindly overwritten by the other. A delivery note
is what makes the merge cheap instead of archaeological.
