#!/bin/bash
cd /workspace/work/pose-hub-elbow
export LD_LIBRARY_PATH=/workspace/work/pw148/libs NO_PROXY=127.0.0.1,localhost
for i in 1 2 3 4 5 6; do
/workspace/bin/heavy -- node tools/elbow-audit-r1/scan-fast.mjs --out /workspace/work/elbow-audit/scan-all.json --hz 3 $(cat /workspace/work/elbow-audit/recipes.txt) >> /workspace/work/elbow-audit/scan.log 2>&1
grep -q "nothing to do" /workspace/work/elbow-audit/scan.log && break
done
echo DONE >> /workspace/work/elbow-audit/scan.log.v2
