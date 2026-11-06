# Note to Code (14 Oct 2026, from Design): mail for the sim through Resend

Done today, in the Resend account (Pro) and at GoDaddy: `sim.starshard.net` is added as its own sending domain (region us-east-1, same as starshard.net; separate reputation from the Star Shard mail), with its DKIM TXT and the two sending CNAMEs in starshard.net's zone. Verification is pending propagation. The API key comes once Justin says so and goes into the NAS `.env` as `RESEND_API_KEY`; it will be scoped to this domain and sending only.

## What the sim sends
From `Deck Bench <noreply@sim.starshard.net>`, reply-to Justin's address, plain text first with a small HTML part, no tracking pixels (Resend: `open/click tracking` off for this domain). Four messages:

1. **Sign-in code.** `POST /api/auth/code {email}` → a six-digit code, 10-minute expiry, one active code per address, 5 attempts then a new code; `POST /api/auth/verify {email, code}` → the sim's own session cookie (the `sessions` table from the accounts work order). This is the magic-link alternative that works on the iPad without link-handling trouble, and it is the second factor and the password-free login in one: an account is an email address. Rate limit: 3 codes per address per hour, 20 per IP. Existing Star Shard logins keep working; an account can carry both. Subject: "Your Deck Bench code: 482 913". Body: the code, "expires in 10 minutes", "if you didn't ask for this, ignore it".
2. **Receipt / credits.** On `checkout.session.completed` and `invoice.paid` (the billing work order): "Added 600 credits · balance 740 · receipt from Stripe follows". Stripe sends the formal receipt; ours is the one-line confirmation with the balance.
3. **Weekly digest.** When the weekly rerun moved a deck by ≥ 3 points or a matchup by ≥ 8: one paragraph per deck ("Squall 52 → 47 this week: Landfall rose to 28% and you are 38% against it; the sideboard guide is updated"), a link to the guide, an unsubscribe link that flips `account.digest` off. Never more than one a week per account; nothing when nothing moved.
4. **Run finished** (opt-in, off by default): "Squall v3 finished: 52% (47–57) against the top 10" with the link. The browser notification covers the common case; this is for the two-hour run started before leaving the house.

## Plumbing
- `mail.js`: one function `send({to, subject, text, html, tag})` over Resend's REST API (`fetch`, no SDK), `tags` for the four kinds so Resend's logs filter by them; errors logged and swallowed except for the sign-in code, where a failure returns 503 "couldn't send the code, try again in a minute".
- Webhook `POST /api/resend/webhook` (signed, Svix headers) for `email.bounced` and `email.complained`: a hard bounce or complaint sets `account.mailable = false` and stops the digest; the sign-in code still tries (the person asked for it) but shows "we couldn't deliver to that address before; check it".
- Templates live in `mail/*.txt` with `{{holes}}`, not in code, so Design can edit copy without a rebuild.
- Nothing is sent from the worker; the server owns mail.

## Design
The sign-in screen gets an "Email me a code" path beside the Star Shard login (one field, then a six-box code entry; the code also pastes as one string); Account tab gets the two toggles (weekly digest, run finished) and the address with "change" (which sends a code to the new address first). I'll draw both once the accounts endpoint exists.
