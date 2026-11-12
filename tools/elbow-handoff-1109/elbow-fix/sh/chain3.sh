#!/bin/bash
cd /workspace/work/elbow-fix/sh; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8871
./run.sh jobs-v4.json v4.jsonl
echo "== render $(date +%T)" >> run.log
/workspace/bin/heavy -- timeout 3000 node render3.mjs --dir png4 --jobs jobs-r4.json >> run.log 2>&1
echo "== render exit $? $(date +%T)" >> run.log
