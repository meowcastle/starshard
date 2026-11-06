# SHIP-PLAN.md — the review, the decisions, and the machine that builds the rest

**26 October 2026.** A high-level read of everything in the repo, five strategic decisions
proposed (not asked), and a concrete design for handing the remaining build to an agent loop.
Supersedes the sequencing in `ROLLOUT.md` where they differ; everything else in ROLLOUT stands.

---

## 1. What exists, honestly

| thing | state | last moved |
|---|---|---|
| **Star Shard** (the astrology app, chart + shard + 28-station corpus) | v4 at `/star-shard/`, API self-hosted with age gate, deploy script, two test suites | 17 Sep |
| **Manzil** (the card game, September build) | live at the staging root. Nightly sky, walkers' road, **PvP with lobby**, rebuilt mulligan, sound, telemetry. Pack of five by default, so the deal never fires and the opening is solved | 22 Sep |
| **Manzil engine + sims** | `manzil_v6.py`, 33/33 conformant to Code's reference engine; bands, exploit scans, drama proxies all runnable | 25 Aug |
| **The TCG rethink** (`MANZIL-TCG.md`, `MANZIL-EXPLAINED.md`, four research docs) | designed, unsimulated, **uncommitted** | 6 Oct |
| **Forge sim** (`mtg sim/`) | a working private tool for you and friends; 181 commits, nightly engine shift, a coach | 23 Oct |
| **Strategy** (`ROLLOUT.md`, `CONTENT.md`, `kickstarter-plan.md`, `steam-economics.md`) | written; Phase 0's four items not started; no video cadence visible | 24 Aug |

Three products, one person, and for the last three weeks all the hours went to the one that
is explicitly "a private web app for Justin and a small group of friends."

**The structural finding:** Manzil has two complete versions of itself in the building — a
working September game nobody has touched in five weeks, and a ground-up redesign nobody has
started. Nothing ships while both exist as peers. One has to be *the product* and the other
*the next version*.

---

## 2. Five decisions

These are recommendations stated as decisions so you can veto rather than deliberate. Three
of them are real forks and are put to you at the end.

### D1. Forge sim is a tool, not a product. Cap it.

Its own handoff says who it is for: a handful of friends. It is also the thing that taught you
the automation pattern (§4), so it paid for itself. But every Forge commit is a Manzil commit
that didn't happen. **Decision: Forge gets the nightly engine shift and bug fixes only. No new
features until Manzil v1 ships.** If it later turns out friends-of-friends want it, that is a
second business and gets its own plan.

### D2. Ship the September build as Manzil v1. The TCG is v2, built behind it.

The September game works. PvP works. The mulligan — item 7 on the Arena list — is already in.
What it is missing is four small things and a legibility layer, all enumerated, all
automatable:

- a **starter pack of twelve** so the deal fires and the opening book dies (one data change;
  the August measurement says this alone takes the best opening from 100% on every night to
  78% on five nights),
- the **`-2` script bug**,
- **email capture** in the free flow,
- the six **UI-only items from `ARENA-LESSONS.md`** — narrate her move and draw the cascade,
  live condition indicators on signatures, a live count, state rendered as objects, the board
  wearing tonight's mansion, named walkers with status lines.

That is Manzil v1, and it is weeks, not months. **The moving road, the pie, Figures, Hours and
Dignity, Night Editions — all of `MANZIL-TCG.md` — becomes v2**, developed in parallel by the
agent loop against the simulator, and never allowed to block v1. v1 ships to a world where
the audience is zero; v2 ships to the audience v1 and the videos build.

### D3. Web first, app second, Steam page now.

The game is live on the web already and PvP works there. `PLATFORM.md`'s case for the app
rests on push notifications and store discovery, both of which matter *once there is a list to
notify*. So: v1 on the web, email as the reminder channel (which ROLLOUT already said), the
Capacitor wrapper when the list passes a few hundred, and the $100 Steam Coming Soon page this
week because it only compounds.

### D4. The content plan is the one thing no agent can do, and it is the critical path.

Every acquisition channel in ROLLOUT either consumes an audience or is slow. The sixty sky
videos are the only generator, the bank is pre-sorted in `mansions-table.json`, and the plan
has been written since August. **Decision: the cadence starts the week v1 ships, not before
(so the videos have somewhere to send people) and not after (so v1 doesn't ship to nobody).**
An agent can write every script, pull every fact, cut every caption. It cannot be the face.

### D5. Kickstarter stays parked; the deck, not the game; after the list.

Unchanged from the research: 800–1,500 warmed emails and ~40 named day-one backers, pitched
as a 28-card deck (80% funding rate vs 33% for video games), with 4–6 cards commissioned out
of pocket first. Nothing in the last three weeks changes that gate. It is a Q1 2027 event if
the videos work and not an event if they don't.

---

## 3. The roadmap this produces

| phase | what | who | gate to the next |
|---|---|---|---|
| **A · 2 weeks** | Manzil v1: starter twelve, `-2` fix, email capture, the six legibility items; Steam page up | agent builds, you merge | vectors 33/33; Playwright smoke green; exploit scan: no opening wins all 28 nights; careful 55–65 / casual 35–45 on the live build |
| **B · same 2 weeks, parallel** | v2 sim track: moving road against the August engine, then occultation, then veil/retrograde, then Hours/Dignity on a 40-Figure prototype pool | agent, nightly | each step reported against the bands and the exploit scan; you read a morning report |
| **C · weeks 3–14** | the sixty videos; itch.io build; the list grows | **you**, with agent-written scripts | ≥ a path to 800 emails by week 12, or the Kickstarter is cancelled and v2 is re-scoped |
| **D · weeks 6–14** | v2 build begins only when B's sims pass the bands; Figures authored against the trigger vocabulary; Design owns art direction | agent + Design | sim bands + a playable v2 on staging behind a flag |
| **E · week 14+** | Capacitor app; Kickstarter prep if C's gate passed; v2 to the friend-build audience | you + agent | the ROLLOUT Phase 3 preconditions |

Forge sim runs its night shift throughout and gets nothing else.

---

## 4. Can an agent automate the rest of the build? Mostly yes, and you already built the machine.

Forge sim's engine runs at 01:00 every night on your Mac, logs what it did, and writes a
morning report. That is the loop. The Manzil version is the same loop pointed at a backlog with
acceptance tests instead of at a card pool.

### What makes it work: everything is a gate

The reason the August collaboration between me, Code and Design converged was the **33-vector
conformance suite** — a port was faithful or it wasn't, and nobody argued. The whole build
becomes automatable to the degree every work packet has a gate like that. Manzil already has
most of them:

| gate | exists | status |
|---|---|---|
| mechanics conformance (33 vectors) | yes | passing; needs 3 agent-level vectors added (the hole I flagged in August) |
| balance bands (careful 55–65, casual 35–45, gap 20+) | yes | runnable in `manzil_v6.py` |
| exploit scan (no opening wins all 28 nights) | yes | runnable |
| drama proxies (comebacks, margin, close boards) | yes | runnable |
| Playwright smoke (`test/smoke.mjs`) | yes | **blocked on network since August** — the first thing to unblock |
| API suites + deploy script | yes | in `starshard-api/` |
| writing law (`WRITING.md`), no em dashes in product copy | yes | checkable by a linter the agent can write |
| vocabulary law (one new noun per surface, tier-gated) | yes | checkable against the lexicon ledger |

### The loop

1. **A backlog with acceptance tests.** `BACKLOG.md`: each packet is one paragraph of intent,
   the files it may touch, and the gate that proves it done. Phase A is eleven packets. Phase
   B is five sim experiments with the bands as their gate.
2. **A nightly run** — either the Mac at 01:00 like Forge, or a cloud scheduled task. The
   agent takes the top unblocked packet, works on a branch, runs every gate, and either opens
   it for merge with a report or writes down exactly why it couldn't.
3. **A morning report** you read with coffee: what passed, what failed, what it needs decided.
   Forge already has this shape.
4. **You merge.** Nothing reaches `main` or staging without a human. This is the one place
   the ethics floor and the writing law get a human eye, and it is a five-minute job.
5. **A decisions queue.** Anything the agent can't settle by a gate — a taste call, a
   vocabulary ruling, "which of these two openings reads better" — goes in a short list for
   you, with its options pre-tested. The agent never guesses at taste; it measures and asks.

### What the agent can own outright

The entire Phase A list. The entire Phase B sim track. The v2 engine port and its vectors.
Figure authoring to the trigger vocabulary *with* per-signature worth measured before you see
it (the `sigtest.py` harness exists). Video scripts, fact pulls, captions, the content calendar.
The Steam page assets. Email capture and its pipeline. Playwright, deploys, the morning report.
Updating every handoff and status doc so Design and Code always read the current truth.

### What it cannot, and should not

The videos themselves. Art and art direction. The three forks below. Any wording a traveler
reads that introduces a new noun. The merge. Apple review, Kickstarter copy you'll put your
name to, and anything that spends money. These are a short list, and they are all *yours*
rather than *everyone's*.

### What has to be true first (about two days of work)

- Playwright runnable somewhere with network, so a UI packet can prove itself.
- The three agent-level vectors added, so the engine gate covers the agents.
- `BACKLOG.md` written with gates — I can draft it from this document.
- A staging deploy the agent can target without touching production.
- The Oct 6 docs committed, so the loop starts from a clean tree instead of 92 untracked files.

---

## 5. The three forks only you can take

Everything above assumes these three answers. Change any one and the roadmap re-shapes, which
is fine — but it should be a choice.

1. **Forge sim is capped** until Manzil v1 ships. *(If Forge is actually the business, say so
   and this becomes a Forge plan.)*
2. **The September build ships as v1**; the TCG is v2 behind it. *(The alternative — hold
   until the rebuild — is six-plus months to a first launch with no audience built meanwhile.)*
3. **You commit to the video cadence** the week v1 ships. *(Without it the plan has no
   acquisition engine and the Kickstarter should be struck now rather than parked.)*
