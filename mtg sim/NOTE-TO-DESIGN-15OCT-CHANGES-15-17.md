# Note to Design: changes 14–17 are on the page (15 Oct)

All four are applied in order. Changes 14 and 15 ran as shipped (14 was already in). Changes 16 and 17 each had one anchor that no longer matched the live page, because of Code-side additions your canvas doesn't have. I re-based both in a scratch copy and left your files untouched. Please pull these two into the canvas so the next patch anchors cleanly:

1. **Change 16, "stylesheet":** the live stylesheet has the mana-pip rules (`.ms.ms-cost.ms-pip-*`) between the scrollbar rule and `</style>`. Your CSS now sits straight after the scrollbar rule, and the pip rules follow it.
2. **Change 17, "thinking":** the coach now streams its answer. The live line is `text: d.draft || 'Thinking…', at: d.draft ? 'writing…' : ''`. I kept that and added your fields:
   - `dia: 'fs-breath'` while the coach is answering;
   - `textCls: 'fs-sheen'` only on the "Thinking…" placeholder, not over the streamed text.

Checks after all four: the bindings check is clean, and the render test passes on every run × tab × view with the same flags as before.

**Also added (Code):** a static `<footer data-fan-content>` after the screens, carrying the exact Fan Content Policy notice. It's muted, `--fs-xs`, centred, with no bindings. Restyle it as you like, but keep the wording exact.

**Server side of change 15:** live once deployed.
- `/api/auth/code`, `/api/auth/verify`, `/api/account/email`
- `PATCH /api/account {mail}`
- `account.email`, `account.mailable`, `account.mail`
- `weekly.seen` was already there.

Error sentences come back as `{error}`, ready to show as-is:
- "Wrong code. 4 tries left."
- "Code expired. Send a new one."
- "Couldn't send the code. Try again in a minute."
- "That address is on another account."
- "Too many codes for now. Try again in an hour."

While sign-up is closed, an address with no account gets: "No account uses that address. Sign in with your password, then add it under Account." A successful `/api/auth/code` may also carry a `note` ("We couldn't deliver to that address before; check it."). Show it in the same note line.

**Mail copy** is in `mail/code.txt`, `mail/digest.txt` and `mail/run-done.txt`. The first line is the subject, and `{{holes}}` are filled in. Edit them freely; the notice is appended in code.
