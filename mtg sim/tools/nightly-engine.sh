#!/bin/bash
# The engine's night shift (Justin, 23 Oct: "the sim engine should always be updating at night").
# Started by launchd at 01:00 (tools/nightly/net.starshard.sim-nightly.plist). Each night it:
#   1. takes the COMMITTED engine (git archive of HEAD, the bridge compiled from that source), so a night
#      measures something that can be named, not whatever was half-edited in the working tree;
#   2. pulls the live calibration (real results and meta lists) and history (benchmark sideboards) from the NAS;
#   3. plays the baseline batch: the top 12 meta decks, every pairing, 15 best-of-threes, games 2-3 boarded,
#      the pilot settings live runs use;
#   4. plays each experiment in $N/queue.json that hasn't been played at tonight's engine
#      ({"name", "env": {...}, "top", "matches"}: the same env knobs log-batch.js takes);
#   5. scores everything (tools/nightly-report.js), pooling baselines from earlier nights at the same engine
#      and the same lists, and writes $N/latest.txt, $N/scoreboard.jsonl and data/engine-nightly.json on the NAS.
# Games run only while nobody is using the Mac: a batch waits for 10 idle minutes, stops when someone comes
# back (log-batch skips the pairings already done when it restarts), and nothing new starts after END.
set -u
REPO="/Users/justinbjur/Desktop/starshard.net"
N="${NIGHTLY_DIR:-$HOME/sim-nightly}"
NAS=justin@192.168.1.117 R=/volume2/docker/starshard-sim
END="${NIGHTLY_END:-07:30}" IDLE="${NIGHTLY_IDLE:-600}" TOP="${NIGHTLY_TOP:-12}" MATCHES="${NIGHTLY_MATCHES:-15}"
NIGHT="$N/$(date +%F)"; mkdir -p "$NIGHT" "$N/home"
exec >> "$NIGHT/night.log" 2>&1
export PATH="/opt/homebrew/opt/openjdk@17/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
log() { echo "$(date +%T) $*"; }
idle() { echo $(( $(ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print $NF; exit}') / 1000000000 )); }
late() { local t; t=$(date +%H:%M); [[ "$t" > "$END" && "$t" < "20:00" ]]; }
killtree() { local p; for p in $(pgrep -P "$1"); do killtree "$p"; done; kill "$1" 2>/dev/null; }
if ! mkdir "$N/.lock" 2>/dev/null; then
  if kill -0 "$(cat "$N/.lock/pid" 2>/dev/null)" 2>/dev/null; then log "another night is running"; exit 0; fi
fi
echo $$ > "$N/.lock/pid"; trap 'for p in $(pgrep -P $$); do killtree $p; done; rm -rf "$N/.lock"' EXIT

# 1. the committed engine
APP="$N/app"; rm -rf "$APP"; mkdir -p "$APP"
git -C "$REPO" archive --format=tar HEAD:"mtg sim" | tar -x -C "$APP" || { log "git archive failed"; exit 1; }
JAR=$(ls "$HOME"/forge-worker/forge/forge-gui-desktop-*-jar-with-dependencies.jar | head -1)
bash "$APP/forge-pilot/bridge/build.sh" "$JAR" > "$NIGHT/bridge.log" 2>&1 || { log "bridge build failed, see bridge.log"; exit 1; }
# the engine's fingerprint: the files that decide how games are played; nights with the same one pool together
ENGINE=$(cd "$REPO" && for f in pilot.js plan.js sideboard.js forge.js config.js forge-pilot forge-ai forge-patch; do git rev-parse "HEAD:mtg sim/$f" 2>/dev/null; done | shasum | cut -c1-10)
log "engine $ENGINE (commit $(git -C "$REPO" rev-parse --short HEAD))"

# 2. live real data and sideboards
ssh -q $NAS "cat $R/data/calibration.json" > "$NIGHT/cal.json" && ssh -q $NAS "cat $R/data/history.json" > "$NIGHT/history.json" || { log "couldn't read the NAS"; exit 1; }
# sideboard plans the cache doesn't hold yet go to the coach model; the key is read here and never written out
ANTHROPIC_API_KEY=$(ssh -q $NAS "grep '^ANTHROPIC_API_KEY=' $R/.env | cut -d= -f2-"); export ANTHROPIC_API_KEY
export FORGE_DIR="$HOME/forge-worker/forge" DATA_DIR="$N/home"
# NIGHTLY_DRY=1: stop here (engine built, NAS read), for testing the plumbing
[[ -n "${NIGHTLY_DRY:-}" ]] && { log "dry run: calibration $(wc -c < "$NIGHT/cal.json") bytes, history $(wc -c < "$NIGHT/history.json") bytes, key ${#ANTHROPIC_API_KEY} chars"; exit 0; }

# runs one batch to completion, or until END; pauses whenever the Mac is in use
batch() {   # batch <out dir> <top> <matches> [VAR=value ...]
  local out=$1 top=$2 m=$3; shift 3
  while ! grep -q "done in" "$out.log" 2>/dev/null; do
    late && { log "$(basename "$out"): stopped for the morning"; return 1; }
    if (( $(idle) < IDLE )); then sleep 60; continue; fi
    log "$(basename "$out"): playing"
    ( cd "$APP" && env "$@" nice -n 10 node tools/log-batch.js "$NIGHT/cal.json" "$out" "$top" "$m" 3 >> "$out.log" 2>&1 ) & local pid=$!
    while kill -0 $pid 2>/dev/null; do
      sleep 60
      if (( $(idle) < (IDLE < 120 ? IDLE : 120) )) || late; then log "$(basename "$out"): paused (Mac in use or morning)"; killtree $pid; sleep 5; break; fi
    done
  done
  log "$(basename "$out"): $(tail -1 "$out.log")"
}
LIVE=(POLICY=profiles PROFILE_SPELLS=spells "PROFILE_DECKS=Dimir Excruciator=combo" BOARD=1 "SIDES=$NIGHT/history.json")

# 3. the baseline
echo "$ENGINE" > "$NIGHT/engine"
batch "$NIGHT/base" "$TOP" "$MATCHES" "${LIVE[@]}"

# 4. queued experiments, each once per engine
if [[ -f "$N/queue.json" ]]; then
  node -e '
    const q = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    for (const e of q) if (!(e.done || []).includes(process.argv[2])) console.log([e.name, e.top || 12, e.matches || 15, ...Object.entries(e.env || {}).map(([k, v]) => k + "=" + v)].join("\t"));
  ' "$N/queue.json" "$ENGINE" > "$NIGHT/todo.tsv"
  while IFS=$'\t' read -r name top m rest; do
    IFS=$'\t' read -r -a envs <<< "$rest"
    batch "$NIGHT/x-$name" "$top" "$m" "${LIVE[@]}" "${envs[@]}" || break
    node -e '
      const fs = require("fs"), f = process.argv[1], q = JSON.parse(fs.readFileSync(f, "utf8"));
      for (const e of q) if (e.name === process.argv[2]) (e.done = e.done || []).push(process.argv[3]);
      fs.writeFileSync(f, JSON.stringify(q, null, 1));
    ' "$N/queue.json" "$name" "$ENGINE"
  done < "$NIGHT/todo.tsv"
fi
unset ANTHROPIC_API_KEY

# 5. the report
node "$APP/tools/nightly-report.js" "$N" "$NIGHT" > "$NIGHT/report.txt" 2>&1 && cp "$NIGHT/report.txt" "$N/latest.txt"
[[ -z "${NIGHTLY_TEST:-}" ]] && ssh -q $NAS "cat > $R/data/engine-nightly.json" < "$NIGHT/summary.json" 2>/dev/null
# game logs are big; keep ten nights
find "$N" -maxdepth 1 -type d -name '20*' -mtime +10 -exec rm -rf {} +
log "night done"
