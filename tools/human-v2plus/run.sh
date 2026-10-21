#!/usr/bin/env bash
# Runs a node script (repo-relative) with a private Vite dev server and one Chromium. Heavy: run via /workspace/bin/heavy, one at a time.
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; SCRIPT="$1"; shift
PORT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$REPO/drill-anim/config.json')).app_port||8830)")
LDP=$(node -e "const c=JSON.parse(require('fs').readFileSync('$REPO/drill-anim/config.json'));console.log(c.ld_library_path||'')")
if [ -n "$LDP" ]; then case "$LDP" in /*) ;; *) LDP="$REPO/drill-anim/$LDP";; esac; export LD_LIBRARY_PATH="$LDP${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"; fi
LOG="${HV2P_WORK:-$REPO/output/human-v2plus-work}"; mkdir -p "$LOG"
node "$REPO/node_modules/vite/bin/vite.js" --host 127.0.0.1 --port "$PORT" --strictPort > "$LOG/vite.log" 2>&1 &
VP=$!; trap 'kill $VP 2>/dev/null' EXIT
for i in $(seq 1 60); do curl -s "http://127.0.0.1:$PORT/" >/dev/null && break; sleep 1; done
cd "$REPO" && node "$SCRIPT" "$@"
