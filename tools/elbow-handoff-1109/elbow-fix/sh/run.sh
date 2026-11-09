#!/bin/bash
# run.sh jobs.json out.jsonl
cd /workspace/work/elbow-fix/sh; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8871
echo "== $1 $(date +%T)" >> run.log
/workspace/bin/heavy -- timeout 5400 node ev.mjs --jobs $1 --out $2 >> run.log 2>&1
echo "== $1 exit $? $(date +%T)" >> run.log
