#!/bin/sh
# Deploys to the Synology NAS staging environment. Replaces the manual
# `ssh host 'cat > remote' < local` loop this project was deployed with by
# hand for its first several sessions — scp/SFTP don't work on this NAS
# (destination open fails), so it's cat-over-ssh, one file at a time.
#
# Usage:
#   tools/deploy.sh frontend   # static site: index.html + all JS modules
#   tools/deploy.sh mansions   # the 28 mansion permalink pages + OG images
#   tools/deploy.sh manzil     # the manzil/ prototype (own subdir, tar-over-ssh)
#   tools/deploy.sh backend    # starshard-api/server.js, restarts the process
#   tools/deploy.sh all        # all four
#
# Does NOT run DB migrations — those touch production data and stay a
# deliberate, reviewed step (see the ad hoc PHP scripts used in git history).

set -eu

HOST=justin@wreckroom.nyc
FRONTEND_REMOTE=/volume2/web/starshard-staging
BACKEND_REMOTE=/volume2/web/starshard-api
NODE_BIN=/volume2/@appstore/Node.js_v20/usr/local/bin/node

# deck.js/events.js are real and still used server-side (starshard-api's
# claim/drop-table logic) and by their own tests, but no frontend page has
# imported them client-side since "Star Shard v2 (archived).dc.html" — the
# live page (v4) doesn't need them shipped as static assets. Verified by
# grep across every .dc.html before removing them from here (18 Aug).
FRONTEND_FILES="api.js astro.js format.js reading.js tz.js sky.js sigil.js sigil-copy.js reading-copy.js transits.js stations.js astronomy-engine.js support.js sitemap.xml combos.js findings.js rates.js ios-frame.jsx four-skies.dc.html socket-io-client.js"

# starshard-api/lib/*.js: the Manzil lobby's server-authoritative move
# validator (manzil-lobby.js) and its synced copy of the rules engine
# (manzil-engine.js). deploy_backend only ever shipped server.js itself
# before this existed — a bare `require('./lib/manzil-lobby')` would 404
# in production without these alongside it.
BACKEND_LIB_FILES="starshard-api/lib/manzil-engine.js starshard-api/lib/manzil-lobby.js"

cd "$(dirname "$0")/.."

deploy_frontend() {
  echo "==> index.html"
  # "Star Shard v4.dc.html" is the live page (the calm-pass UI, wired to the
  # real engine/corpus/combos — see CLAUDE.md's port-plan history). Prior
  # generations stay in the repo as reference only, not deployed:
  # "Star Shard v3.dc.html", "Star Shard v2 (archived).dc.html". See
  # CLAUDE.md's receipt protocol.
  ssh "$HOST" "cat > $FRONTEND_REMOTE/index.html" < "Star Shard v4.dc.html"
  for f in $FRONTEND_FILES; do
    if [ -f "$f" ]; then
      echo "==> $f"
      ssh "$HOST" "cat > $FRONTEND_REMOTE/$f" < "$f"
    fi
  done
  echo "frontend deployed."
}

deploy_mansions() {
  if [ ! -d mansions ]; then
    echo "no mansions/ directory — run node tools/build-mansions.mjs && node tools/build-mansion-images.mjs first" >&2
    exit 1
  fi
  echo "==> mansions/ (29 HTML + 28 OG images, tar-over-ssh — cat-per-file doesn't"
  echo "    create the mansions/og/ subdirectory, and 57 individual ssh calls for"
  echo "    binary PNGs is slower than one stream)"
  tar cf - mansions | ssh "$HOST" "mkdir -p $FRONTEND_REMOTE && tar xf - -C $FRONTEND_REMOTE"
  echo "mansions deployed."
}

deploy_manzil() {
  if [ ! -d manzil ]; then
    echo "no manzil/ directory" >&2
    exit 1
  fi
  # tar-over-ssh, same reason as deploy_mansions: filenames inside manzil/
  # (the rules sheet, the user's manual) carry spaces/apostrophes/ampersands
  # that would break FRONTEND_FILES' plain space-separated word-splitting.
  # Served at staging.starshard.net/manzil/ — its own doc-relative
  # "../support.js" resolves against $FRONTEND_REMOTE, so deploy_frontend
  # (which ships support.js there) must have run at least once already.
  echo "==> manzil/ (game + rules sheet + user's manual)"
  tar cf - manzil | ssh "$HOST" "mkdir -p $FRONTEND_REMOTE && tar xf - -C $FRONTEND_REMOTE"
  echo "manzil deployed."
}

deploy_backend() {
  # One-time manual step before the FIRST run of this after the Manzil lobby
  # landed: socket.io isn't in the NAS's node_modules yet, and this script
  # (cat-over-ssh, one file at a time) has never synced package.json or run
  # npm install. Until that's done by hand over SSH, the restart below will
  # crash-loop on `require('socket.io')`. See the Manzil lobby plan's
  # "operational note" — this is a deliberate one-time gap, not an oversight.
  echo "==> starshard-api/server.js"
  ssh "$HOST" "cat > $BACKEND_REMOTE/server.js" < starshard-api/server.js
  echo "==> starshard-api/lib/"
  ssh "$HOST" "mkdir -p $BACKEND_REMOTE/lib"
  for f in $BACKEND_LIB_FILES; do
    echo "==> $f"
    ssh "$HOST" "cat > $BACKEND_REMOTE/${f#starshard-api/}" < "$f"
  done
  echo "==> restarting api"
  ssh "$HOST" "
    pkill -f 'node server\\.js\$' || true
    sleep 1
    cd $BACKEND_REMOTE
    nohup $NODE_BIN server.js >> run.log 2>&1 &
    disown
    sleep 2
    tail -6 run.log
  "
  echo "backend deployed and restarted."
}

case "${1:-}" in
  frontend) deploy_frontend ;;
  mansions) deploy_mansions ;;
  manzil) deploy_manzil ;;
  backend) deploy_backend ;;
  all) deploy_frontend; deploy_mansions; deploy_manzil; deploy_backend ;;
  *) echo "usage: $0 {frontend|mansions|manzil|backend|all}" >&2; exit 1 ;;
esac
