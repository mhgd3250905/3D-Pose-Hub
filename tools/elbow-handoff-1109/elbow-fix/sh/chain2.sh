#!/bin/bash
cd /workspace/work/elbow-fix/sh
while pgrep -f "ev.mjs --jobs jobs-s2" >/dev/null; do sleep 5; done
./run.sh jobs-s3.json s3.jsonl
