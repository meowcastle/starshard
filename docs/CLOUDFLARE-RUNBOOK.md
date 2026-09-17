# Putting Cloudflare in front of the NAS

Status: **pass one not yet applied.** This is the plan plus the exact edits
each stage requires. Written 17 Sep 2026. Owner: Claude Code.

## Why

Today `staging.starshard.net` resolves to the house. Three consequences, none
of them theoretical:

- **The home IP is in public DNS**, fronting a game with an unauthenticated
  public guestbook and an audience this repo documents as skewing 13–17.
- **Every visit pulls the whole page off a residential uplink.** The live file
  is 1.78 MB on its own. Nothing is cached anywhere but the visitor's browser.
- **The PvP lobby rides the same link.** One saturated uplink and the game is
  down, with no second path.

`tools/deploy.sh` already records the 3 Sep incident where the public hostname
stopped accepting SSH mid-session after a router change while the box itself
was fine. That is the exposure being removed.

Sweet Dreams RV Rentals already runs this exact pattern on the same NAS
(`docker-compose.yml`, the `cloudflared` service). Copy it, do not reinvent it.

## Pass one — the static site only

Justin's call, 17 Sep 2026: site first, API after. Smallest blast radius, and
it protects the thing that actually takes traffic.

1. **Cloudflare dashboard → Networking → Tunnels → Create a tunnel**, named
   `starshard-nas`. Take the token. It is a real secret: it goes in the NAS
   environment only, never in this repo.
2. **Run cloudflared on the NAS**, via Container Manager or:
   ```
   docker run -d --name starshard-cloudflared --restart unless-stopped \
     cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <TOKEN>
   ```
   Outbound-only. No router port to open, and the existing forward can come
   down once step 4 is verified.
3. **Public hostname**: `staging.starshard.net` → `http://localhost:80` (Web
   Station, which already serves `/volume2/web/starshard-staging`).
4. **Verify before removing the port forward.** From off the LAN:
   `curl -sI https://staging.starshard.net | grep -i '^server\|^cf-'` should
   show Cloudflare. Load the game, play one board, confirm the lobby still
   connects — the API is still on its old path at this stage, so the only
   thing that should have changed is how the HTML and JS arrive.
5. **Then close the forward** on the router. This is the step that actually
   removes the home IP from the public path; skipping it leaves the old door
   open and makes step 3 decorative.

### Cache rules worth setting in the same sitting

The whole point is to stop serving bytes off the uplink.

| Path | Rule | Why |
|---|---|---|
| `/vendor/*` | Cache everything, edge TTL 1 year, `immutable` | Version-pinned by content. `tools/selfhost-runtime.mjs` fails the build if these ever drift from what the runtime expects, so they are safe to cache hard. babel.js alone is 3 MB. |
| `/*.js` | Cache everything, edge TTL ~1 day | The engine modules change on deploy, not on visit. |
| `/` and `/index.html` | Cache everything, edge TTL short (5–15 min) | The 1.78 MB file. Even a short TTL moves the bulk of it to the edge. Purge on deploy. |

Add a cache purge to the end of `deploy_frontend` once these are in place,
or the short TTL on `/` becomes a confusing stale-page bug on every deploy.

## Pass two — the API behind the tunnel

Do not start this until pass one has been stable for a few days.

Three things are already written and waiting, switched off:

- `starshard-api/lib/age-gate.js` has `minAgeFor({country, tz})` and
  `countryOfRequest(req)`. The default policy is `country`: the edge decides,
  the time zone fills in when the edge says nothing (Justin's call, 17 Sep).
- `starshard-api/server.js` has `regionOf(req)` and `TRUST_EDGE_HEADERS`.
- `test/age-gate.test.mjs` pins the combine rule, including the failure mode
  that reads as correct (see its header).

**`TRUST_EDGE_HEADERS=1` must not be set until BOTH are true:**

1. The API is reachable only through the tunnel, and
2. direct origin access is blocked.

`CF-IPCountry` is an ordinary request header. While anything can reach the API
without passing through Cloudflare, a caller can set it by hand — and under the
`country` policy that is a way to talk a 16 minimum down to 13. One without the
other is worse than neither, because it replaces an honest heuristic with a
forgeable one.

Also in pass two:

- **`app.set('trust proxy', 1)`** needs re-checking. `req.ip` feeds the
  guestbook's `ip_hash`, which is what `DELETE /api/guestbook/by-ip/:ipHash`
  moderates on. With the tunnel in front, `CF-Connecting-IP` is the
  authoritative visitor address; get this wrong and every guestbook entry
  hashes to the same value and by-ip moderation silently stops working.
- **`ALLOWED_ORIGINS`** and the socket.io CORS config, if the API's hostname
  changes.
- **Socket.io over the tunnel.** Websockets work, but this is the piece most
  likely to need a second look. Test a real two-player duel, not just a
  connection.
- **Edge rate limiting** on `/api/auth/*`, which today is `express-rate-limit`
  in-process: a restart wipes its memory.

## The privacy pages change in the same commit

Repo rule, and these pages are unusually specific about what is true.

**Already done** (17 Sep, alongside self-hosting the runtime): the `unpkg` row
is gone from the third-party table. That is a real reduction — the runtime is
now served from our own origin, so unpkg no longer sees every visitor.

**Required the moment the tunnel goes live**, not before, because until then
they would be false:

1. Add a row to the "Who else sees anything" table:
   `<tr><td><strong>Cloudflare</strong> (network)</td><td>Your IP address and
   the requests your browser makes, because the site is served through their
   network. They do not see your account or your birth details</td></tr>`
2. The sentence **"Our servers are our own hardware, not a cloud host"**
   (privacy/index.html, just under that table) stops being the whole truth.
   The hardware is still ours; the network path is not. Reword, do not delete.
3. Only when `TRUST_EDGE_HEADERS=1` goes on, the age section's **"We work out
   which number applies from your device's time zone"** becomes "from where
   your connection appears to be, and from your device's time zone when that is
   unavailable." The honesty paragraph that follows it still stands and should
   not be softened — the edge is a better guess, not proof.

## Still open, not part of this

- **Turnstile** on signup and the guestbook. The server half is Code's; the
  widget is markup, so it needs a Design work order. The guestbook is an
  unauthenticated public POST whose only current defence is an IP hash and
  after-the-fact admin deletion.
- **Cloudflare Web Analytics.** Free and cookieless, and it would answer
  questions this project cannot currently answer at all. But it is a tracker by
  any honest reading, and `privacy/index.html` currently says "There is no
  analytics, no tracking pixel, and no third-party tracking code anywhere in
  this product. We have checked; there is none." That claim was verified by
  grep before it was written. Turning on analytics means editing it. That is
  Justin's call, not a default.
