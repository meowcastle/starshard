#!/usr/bin/env bash
# Compiles the Forge bridge against a Forge desktop jar.
# Usage: bridge/build.sh /path/to/forge-gui-desktop-<ver>-jar-with-dependencies.jar
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
jar="${1:-${FORGE_JAR:-}}"
if [[ -z "$jar" || ! -f "$jar" ]]; then
  echo "usage: $0 <forge-gui-desktop-...-jar-with-dependencies.jar>  (or set FORGE_JAR)" >&2
  exit 2
fi
rm -rf "$here/build/classes"
mkdir -p "$here/build/classes"
# starshard: the source list goes through an argfile, so a path with spaces ("mtg sim") compiles
find "$here/src" -name '*.java' | sed 's/.*/"&"/' > "$here/build/sources.txt"
javac --release 17 -cp "$jar" -d "$here/build/classes" @"$here/build/sources.txt"
jar cf "$here/build/mtg-bench-bridge.jar" -C "$here/build/classes" .
echo "built $here/build/mtg-bench-bridge.jar"
