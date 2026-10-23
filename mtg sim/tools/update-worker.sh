#!/bin/bash
# Bring the Mac's Forge worker (~/forge-worker/app) to this repo's committed engine, after the NAS is rebuilt with it.
# The worker takes games only from a server running the same engine (pilot.js and forge-pilot/), so run this right
# after `sudo docker-compose up -d --build`, not before.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"; APP="$HOME/forge-worker/app"
for f in pilot.js forge.js worker.js telemetry.js arena.js config.js meta.js cardstats.js store.js leaks.js functional.js weekly.js; do cp "$REPO/$f" "$APP/$f"; done
rsync -a --exclude build "$REPO/forge-pilot/" "$APP/forge-pilot/"
JAR=$(ls "$HOME"/forge-worker/forge/forge-gui-desktop-*-jar-with-dependencies.jar | head -1)
PATH=/opt/homebrew/opt/openjdk@17/bin:$PATH bash "$APP/forge-pilot/bridge/build.sh" "$JAR" >/dev/null
launchctl kickstart -k "gui/$(id -u)/net.starshard.forge-worker"
echo "worker updated and restarted"
