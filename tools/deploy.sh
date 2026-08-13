#!/bin/sh
# Deploys to the Synology NAS staging environment. Replaces the manual
# `ssh host 'cat > remote' < local` loop this project was deployed with by
# hand for its first several sessions — scp/SFTP don't work on this NAS
# (destination open fails), so it's cat-over-ssh, one file at a time.
#
# Usage:
#   tools/deploy.sh frontend   # static site: index.html + all JS modules
#   tools/deploy.sh mansions   # the 28 mansion permalink pages + OG images
#   tools/deploy.sh backend    # starshard-api/server.js, restarts the process
#   tools/deploy.sh all        # all three
#
# Does NOT run DB migrations — those touch production data and stay a
# deliberate, reviewed step (see the ad hoc PHP scripts used in git history).

set -eu

HOST=justin@wreckroom.nyc
FRONTEND_REMOTE=/volume2/web/starshard-staging
BACKEND_REMOTE=/volume2/web/starshard-api
NODE_BIN=/volume2/@appstore/Node.js_v20/usr/local/bin/node

FRONTEND_FILES="api.js astro.js card.js format.js reading.js tz.js wheel.js windows.js duet.js shards.js sky.js sigil.js sigil-copy.js reading-copy.js deck.js events.js stations.js astronomy-engine.js support.js image-slot.js sitemap.xml"

cd "$(dirname "$0")/.."

deploy_frontend() {
  echo "==> index.html"
  # "Star Shard v3.dc.html" is the live page as of the Sigil/Sounding MVP —
  # "Star Shard v2 (archived).dc.html" stays in the repo as reference only,
  # not deployed. See CLAUDE.md's receipt protocol.
  ssh "$HOST" "cat > $FRONTEND_REMOTE/index.html" < "Star Shard v3.dc.html"
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

deploy_backend() {
  echo "==> starshard-api/server.js"
  ssh "$HOST" "cat > $BACKEND_REMOTE/server.js" < starshard-api/server.js
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
  backend) deploy_backend ;;
  all) deploy_frontend; deploy_mansions; deploy_backend ;;
  *) echo "usage: $0 {frontend|mansions|backend|all}" >&2; exit 1 ;;
esac
