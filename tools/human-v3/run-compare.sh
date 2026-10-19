#!/usr/bin/env bash
# Runs compare.mjs with a private Vite dev server. Heavy job: wrap in /workspace-style lock if you have one, one at a time.
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; OUT="${1:-$REPO/output/human-v3}"; shift || true
PORT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$REPO/drill-anim/config.json')).app_port||8830)")
LDP=$(node -e "const c=JSON.parse(require('fs').readFileSync('$REPO/drill-anim/config.json'));console.log(c.ld_library_path||'')")
if [ -n "$LDP" ]; then case "$LDP" in /*) ;; *) LDP="$REPO/drill-anim/$LDP";; esac; export LD_LIBRARY_PATH="$LDP${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"; fi
mkdir -p "$OUT"
node "$REPO/node_modules/vite/bin/vite.js" --host 127.0.0.1 --port "$PORT" --strictPort > "$OUT/vite.log" 2>&1 &
VP=$!; trap 'kill $VP 2>/dev/null' EXIT
for i in $(seq 1 60); do curl -s "http://127.0.0.1:$PORT/" >/dev/null && break; sleep 1; done
cd "$REPO" && node tools/human-v3/compare.mjs "$OUT" "$@"
