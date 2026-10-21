#!/usr/bin/env bash
# one detached heavy job (resource rules: background, one at a time). Usage: bg.sh <logfile> <script> [args]
LOG="$1"; shift; cd "$(dirname "$0")/../.."
nohup /workspace/bin/heavy -- tools/human-v2plus/run.sh "$@" > "$LOG" 2>&1 &
echo started $!
