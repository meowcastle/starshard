#!/bin/sh
# Ship mtg sim/ to the NAS and (re)build the container.
# Usage:  "mtg sim/deploy.sh"            (from anywhere)
#         STARSHARD_HOST=justin@192.168.1.117 "mtg sim/deploy.sh"   (on the LAN)
set -eu
HOST="${STARSHARD_HOST:-justin@wreckroom.nyc}"
REMOTE=/volume2/docker/starshard-sim
cd "$(dirname "$0")"

echo "==> copying to $HOST:$REMOTE"
ssh "$HOST" "mkdir -p $REMOTE"
# tar-over-ssh: scp/SFTP don't work on this NAS (see tools/deploy.sh)
tar --exclude data --exclude .env -cf - Dockerfile docker-compose.yml server.js forge.js meta.js public | ssh "$HOST" "cd $REMOTE && tar -xf -"

# First deploy only: create .env with who may sign in. Logins are Star Shard
# accounts; SIM_USERS is the list of Star Shard usernames allowed into the sim
# (comma separated), SIM_ADMINS can cancel anyone's run. Edit it later on the NAS
# at /volume2/docker/starshard-sim/.env, then: sudo docker compose up -d
if ! ssh "$HOST" "[ -f $REMOTE/.env ]"; then
  printf "Your Star Shard username (you'll be the admin): "; read ME
  printf "Friends' Star Shard usernames, comma separated (enter to skip): "; read FRIENDS
  USERS="$ME"; [ -n "$FRIENDS" ] && USERS="$ME,$FRIENDS"
  ssh "$HOST" "printf 'SIM_USERS=%s\nSIM_ADMINS=%s\n' '$USERS' '$ME' > $REMOTE/.env"
fi

echo "==> building + starting (first build downloads Forge, ~300MB)"
ssh -t "$HOST" "cd $REMOTE && (docker compose version >/dev/null 2>&1 && D='docker compose' || D='docker-compose'; sudo \$D up -d --build)"
echo "==> health"
ssh "$HOST" "curl -s http://127.0.0.1:8088/api/health; echo"
