#!/bin/bash
cd /workspace/work/elbow-scan-wt; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8871
echo "== verify $(date +%T)" >> /workspace/work/elbow-fix/run.log
/workspace/bin/heavy -- timeout 5400 node /workspace/work/elbow-scan/batch.mjs --out /workspace/work/elbow-fix/verify.jsonl $(cat /workspace/work/elbow-fix/fixed-recipes.txt) >> /workspace/work/elbow-fix/run.log 2>&1
echo "== verify exit $? $(date +%T)" >> /workspace/work/elbow-fix/run.log
