#!/bin/bash
cd /workspace/work/elbow-fix; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8871 NOC=1
while pgrep -f chain3.sh >/dev/null; do sleep 5; done
echo "== c0 $(date +%T)" >> run.log
/workspace/bin/heavy -- timeout 1800 node fixc0.mjs --out res-c0.jsonl h-db-curl >> run.log 2>&1
echo "== c0 exit $? $(date +%T)" >> run.log
