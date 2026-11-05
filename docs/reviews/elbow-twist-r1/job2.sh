#!/bin/bash
cd /workspace/work/pose-hub-elbow
export LD_LIBRARY_PATH=/workspace/work/pw148/libs NO_PROXY=127.0.0.1,localhost PYTHONPATH=/workspace/work/pylib
L=/workspace/work/elbow-audit/job2.log
while ! grep -q DONE /workspace/work/elbow-audit/scan.log.v2 2>/dev/null; do sleep 10; done
python3 tools/elbow-audit-r1/analyze.py /workspace/work/elbow-audit/scan-all.json /workspace/work/elbow-audit/suspects-all.csv > /workspace/work/elbow-audit/analyze.txt 2>&1
python3 /workspace/work/elbow-audit/mkshots.py >> $L 2>&1
echo "closeups $(date +%T)" >> $L
/workspace/bin/heavy -- node tools/elbow-audit-r1/closeup.mjs --shots /workspace/work/elbow-audit/shots-top.json >> $L 2>&1
echo "fullchain $(date +%T)" >> $L
/workspace/bin/heavy -- node tools/elbow-audit-r1/scan.mjs --out /workspace/work/elbow-audit/fullchain --hz 5 catalog/production/remaining219-r1/recipes/h-db-curl.json >> $L 2>&1
echo "ab $(date +%T)" >> $L
/workspace/bin/heavy -- node tools/elbow-audit-r1/closeup.mjs --shots /workspace/work/elbow-audit/shots-ab-before.json >> $L 2>&1
cp tools/elbow-audit-r1/wrist-twist-r6-proto.js drill-anim/models/hands-native-r5/wrist-twist.js
/workspace/bin/heavy -- node tools/elbow-audit-r1/closeup.mjs --shots /workspace/work/elbow-audit/shots-ab-after.json >> $L 2>&1
git checkout drill-anim/models/hands-native-r5/wrist-twist.js
echo "JOB2 DONE $(date +%T)" >> $L
