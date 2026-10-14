# Work order: the sim's own database, accounts and usage billing through Stripe (14 Oct 2026)

Status (Code, 14 Oct 2026): steps 1 and 2 built, with two changes from Justin the same day:
- **Anyone can sign up**, with the sim's own name-and-password accounts (source 'sim'), not only Star Shard logins.
- **New accounts get a free plan with daily caps:** 1 deck, the top 10, 1 run and 2 questions a day, no charging.

Step 3 (Stripe) is held until Justin has checked charging against Wizards' Fan Content Policy. Step 4 (brews into SQLite) is not started. See `NOTE-TO-DESIGN-14OCT-ACCOUNTS.md`.

(The original order follows, as received.)

---

Justin's ask: a separate database for the sim, and a Stripe connection designed for people to pay for usage. This is the shape; Code builds it. Pricing numbers are placeholders for Justin to set, and nothing here turns charging on by itself: the switch is a plan flag, and the founders' plan is free (RESEARCH-APP-VALUE-14OCT.md, the pricing answer: no charging until the fidelity gate is met, and free logs are worth more than early dollars).

## 1. What exists
State is JSON files in `DATA_DIR` (`store.js`: brews.json, jobs, usage), identity is a Star Shard login proxied to the Star Shard API on the NAS loopback, access is an allow-list in `.env`, and limits are per-day counters (runs, asks, a daily Anthropic budget). The sim binds to loopback behind the DSM reverse proxy. It cannot send mail.

## 2. The database
**SQLite, one file on the data volume** (`better-sqlite3`, WAL mode, nightly `VACUUM INTO` backup kept 7 days). One container, one writer, a few hundred users at most for a long time; Postgres would be a second service on the NAS for nothing. Migrate in two steps: first the new tables beside the JSON (accounts, ledger, entitlements), then brews and runs once the account layer is live. `store.js` keeps its atomic-write discipline for what stays in files (job work dirs, logs).

Tables (the minimum):
- `accounts` — id, created, starshard_id, starshard_name, email (from Stripe, for receipts only), stripe_customer_id, plan (`founder` | `free` | `member`), status, flags (admin, beta).
- `ledger` — id, account_id, at, kind (`grant` | `purchase` | `subscription` | `run` | `ask` | `weekly` | `refund` | `adjust`), credits (signed), ref (run id, ask id, Stripe object id), note. **Balance is a sum over the ledger, never a column.** Every Stripe event that grants credits is idempotent on its event id.
- `plans` — code, name, monthly_credits, price_id, features (runs per day, max games, coach modes, weekly rerun, guide sharing).
- `stripe_events` — id, type, received, processed, payload (raw), so a webhook is applied once and can be replayed.
- `brews`, `versions`, `runs`, `real_matches` — what brews.json holds now, one row each, account_id on every brew, JSON columns for the big blobs (lists, scores, readouts) rather than normalising everything on day one.
- `sessions` — token hash, account_id, created, last seen; the sim's own cookie after a Star Shard login, so the Star Shard API is hit once per login, not per request.

Identity stays Star Shard for now (it is the account system Justin already runs, and the sim has no mail for magic links). The `accounts` row is keyed to the Star Shard id, so a sim-native login (magic link through whatever mail the sim gets) can be added without touching anything else. Stripe never becomes the identity.

## 3. Paying for usage
**Credits, prepaid, with an optional membership that drips them.** Pay-as-you-go on an invoice in arrears (Stripe's metered prices) is the wrong fit: compute is spent before the money arrives, chargebacks are on us, and a person who queues a 4-hour run has no idea what it costs until the invoice. Credits make the cost visible before the click ("this run costs 80 credits · you have 240") and cap the downside at what was paid.

- **Unit:** 1 credit ≈ one minute of simulator time at today's rate (a top-10 run of 800 games ≈ 110 minutes on the NAS ≈ 110 credits; a coach ask ≈ 5 credits for its Opus call; the weekly rerun is free on a membership, else charged like a run). The server prices a run from its game count and the measured seconds per game, so the rate follows the hardware.
- **Stripe objects:** Products "Credits" with one-time prices (packs: e.g. 200 / 600 / 1,500 credits), and "Membership" with a monthly recurring price that grants N credits on each `invoice.paid`. All through **Stripe Checkout** (hosted) and the **Customer Portal** for card changes and cancellation: no card data ever reaches the NAS, which keeps PCI at the self-assessment-A level.
- **Webhook:** `POST /api/stripe/webhook` behind the reverse proxy, signature-verified, events stored then processed: `checkout.session.completed` (one-time → ledger `purchase`), `invoice.paid` (membership → ledger `subscription` + plan `member`), `customer.subscription.deleted` / `invoice.payment_failed` (plan back to `free`, credits already granted stay), `charge.refunded` (ledger `refund`). Test mode first; the test keys live in `.env` like the others.
- **Spending:** a run or ask is **reserved** when queued (ledger `run` with the estimate, negative), then **settled** when it finishes (an `adjust` for the difference, so a cancelled run refunds what it did not use). Queue refuses when the balance is short, with the number: "This run needs 110 credits; you have 40."
- **Entitlements** come from the plan, not the balance: founders' plan = today's per-day limits and everything free; free = one brew, top-10 only, 2 asks a day, no weekly rerun, no shared guide; member = unlimited brews, top-20, all coach modes, weekly rerun, sharing, plus the monthly credits. `limitsFor(user)` reads the plan row; the daily Anthropic budget stays as the global circuit-breaker.

## 4. What the person sees (Design)
- **Account** (a new tab beside the deck list, or the existing header name): plan, balance in credits and in minutes, the three packs and the membership as Checkout buttons, "Manage billing" (Portal link), a ledger table (date · what · credits · balance after), and the receipts email (from Stripe, editable through the Portal).
- **Cost before the click:** the Queue-the-run panel and the coach composer show the credit cost and the balance after, in the muted line that today shows the time estimate ("~1.9 h · 110 credits · 130 left").
- **Out of credits:** the queue button becomes "Add credits" and opens Checkout with the smallest pack that covers the run. Nothing is lost: the version is saved; the run waits.
- **Founders:** no prices anywhere until the plan flag flips; the Account tab shows "Founders' plan · free while the sim is calibrated · thank you for the logs."
Design draws the Account tab and the two cost lines once the ledger endpoint exists (`GET /api/account` → plan, balance, minutes, packs[{id, credits, price}], ledger[]; `POST /api/checkout {price}` → Checkout URL; `POST /api/portal` → Portal URL).

## 5. Order of work
1. SQLite with `accounts`, `sessions`, `ledger`, `stripe_events`; every login creates or finds the account; the JSON brews stay. (A day.)
2. Credits pricing of runs and asks, reserve and settle, entitlements from the plan; founders' plan for everyone on the allow-list, so nothing changes for them. (A day.)
3. Stripe test mode: products and prices, Checkout, Portal, the webhook, the Account endpoint. (A day, plus Justin creating the Stripe account and setting the real prices.)
4. Brews, versions, runs and real matches into SQLite, with a one-shot migration and the JSON kept as a backup for a month. (A day or two.)
5. Design's Account tab and cost lines. Live mode only when Justin flips the plan flag.

## 6. Open for Justin
- The pack sizes and prices, and whether a membership exists at launch or only packs.
- A business entity and tax settings in Stripe (Stripe Tax can handle sales tax; worth switching on from day one).
- Mail: receipts come from Stripe, so the sim still sends nothing; magic-link login and the weekly email wait on a mail decision.
- Terms and a refund line on the Account tab (one paragraph; unused credits refundable within 14 days, used ones not).
