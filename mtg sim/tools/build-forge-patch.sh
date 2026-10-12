#!/bin/sh
# Builds a copy of a Forge install whose simulator takes -Dsim.ai=<mode>[,<mode>...] per seat
# (hybrid, full or none), for tools/selfplay.js and tools/fidelity-exp.js. The original
# install is left alone: everything but the desktop jar is linked, and the jar is copied
# and patched.
#   sh tools/build-forge-patch.sh <forge install dir> <output dir>
set -e
SRC=$1; OUT=$2; HERE=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$OUT/classes"
for x in "$SRC"/*; do b=$(basename "$x"); case "$b" in forge-gui-desktop-*.jar) cp "$x" "$OUT/";; *) ln -sf "$x" "$OUT/$b";; esac; done
JAR=$(ls "$OUT"/forge-gui-desktop-*.jar)
javac -nowarn -cp "$JAR" -d "$OUT/classes" "$HERE/forge-patch/SimulateMatch.java"
(cd "$OUT/classes" && jar uf "$JAR" forge/view/*.class)
echo "patched Forge in $OUT"
