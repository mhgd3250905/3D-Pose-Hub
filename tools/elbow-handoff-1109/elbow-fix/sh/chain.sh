#!/bin/bash
cd /workspace/work/elbow-fix/sh
while pgrep -f "ev.mjs --jobs jobs-s1" >/dev/null; do sleep 5; done
./run.sh jobs-s2.json s2.jsonl
