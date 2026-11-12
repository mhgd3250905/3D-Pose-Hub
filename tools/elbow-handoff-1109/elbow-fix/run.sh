#!/bin/bash
# usage: run.sh tag id...
cd /workspace/work/elbow-fix; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8871
tag=$1; shift
echo "== $tag $(date +%T)" >> run.log
/workspace/bin/heavy -- timeout 5400 node fix.mjs --out res.jsonl "$@" >> run.log 2>&1
echo "== $tag exit $? $(date +%T)" >> run.log
