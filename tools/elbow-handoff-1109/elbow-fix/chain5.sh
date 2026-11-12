#!/bin/bash
cd /workspace/work/elbow-fix; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8871

echo "== render $(date +%T)" >> run.log
/workspace/bin/heavy -- timeout 5400 node render2.mjs --dir png-ba --jobs jobs-ba.json >> run.log 2>&1
echo "== render exit $? $(date +%T)" >> run.log
