# Note to Design (14 Oct 2026, from Code): open sign-up, the sim's own accounts, the Account endpoint

Justin's calls today:
- **Anyone who reaches the site can sign up**, with a name and a password kept by the sim. It is not a Star Shard account.
- **Newcomers are on a free plan with daily caps.**
- **Stripe waits** until he has checked that charging fits Wizards' Fan Content Policy.

This is steps 1 and 2 of `WORKORDER-SIM-DB-STRIPE-14OCT.md`, without step 3 (Stripe) and step 4 (moving brews into the database).

## Your markup, changed by hand: please carry these forward

I wired your unused "Justin invited you" screen as the real sign-up. Text and bindings only; no layout changed.

| Where | Was | Now |
| --- | --- | --- |
| Join title | Justin invited you | Make an account |
| Join line | Pick a name and a password. Decks and results stay inside the team. | Pick a name and a password. Your decks and results are yours alone. There is no email and no password reset yet, so keep the password somewhere safe. You must be 13 or older. |
| Join fields | `value="Theo"`, `value="••••••••••"` | `{{ joinName }}` / `{{ onJoinName }}`, `{{ joinPw }}` / `{{ onJoinPw }}` / `{{ joinKey }}` |
| Join button | Join → `{{ goFirstrun }}` | `{{ joinLabel }}` ("Make the account") → `{{ doJoin }}` |
| Sign-in line | Members only. No public sign-up. | New here? **Make an account** (a link, `{{ toggleInvite }}`): a name and a password. |
| Sign-in label | Star Shard username | Username |

`invites` is true now, and `isInvite` follows the toggle. Errors show in the existing `signinNote` line. Checked in a browser: sign-up lands on "Paste your deck", with no page errors.

**Founders** (the people on `SIM_USERS`) still sign in on the same form with their Star Shard login.

## The plans, as the page can read them

`GET /api/me` → `user.plan` is `founder`, `free` or `member`.

`GET /api/brews` → `limits`, now with `plan`. Either of `runs` and `asks` can be null, meaning no daily cap.

| | Founders | Free |
| --- | --- | --- |
| Decks | any number | 1 |
| Fields | top 20, top 10, team | top 10 |
| Runs a day | as before | 1 |
| Coach questions a day | as before | 2 |
| Weekly rerun | yes | no |
| Shared guide link | yes | no |

What a free account sees when it hits a limit, all through existing error lines:
- **The run picker:** the top 20 and team sets come back `available: false`, with `detail` "The top 20 isn't on the free plan; the top 10 is." The picker already greys an unavailable set and shows its detail.
- **A second deck:** 403 "The free plan keeps one deck. Paste a new version of it, or delete it to start another."
- **Sharing:** 403 "Sharing the guide isn't on the free plan."

**Privacy between people:** a free account never sees another person's decks. That covers the team set, the Codex index and covers. Founders still see each other's.

## Credits: recorded, not charged

- Each set in `oppSets` carries `credits`: about one per minute of simulator time.
- A run is reserved at its quote when queued and settled when it stops, with the unused part back.
- A coach question is 5 credits.
- **No plan charges today:** founders and free accounts record what each action costs and pay nothing.
- Once a plan charges, a short balance answers 402 with the sentence: "This run needs 110 credits; you have 40."

For your cost line under Queue the run, once you want it: "~1.9 h · 110 credits". Leave the "· 130 left" part off until something charges.

## The Account tab: the endpoint exists

`GET /api/account`:

```
{ name, source: 'sim' | 'starshard', since,
  plan: { code, name, charges, features },
  balance, minutes, packs: [],          // packs fill when Stripe exists
  ledger: [{ at, kind, credits, cost, note, balance }],   // newest first; kind: run, weekly, ask, adjust, purchase, ...
  limits, note }   // "Founders' plan · free while the sim is calibrated · thank you for the logs." or the free plan's line
```

`DELETE /api/account` deletes a simulator account with its decks and ledger, and signs out. Founders' accounts answer 400. The tab needs a "Delete my account" with a confirm; there's nothing else for a person to manage without mail.

`POST /api/checkout` and `/api/portal` don't exist yet (Stripe).
