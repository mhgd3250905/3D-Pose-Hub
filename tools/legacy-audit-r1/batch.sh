#!/bin/bash
# Serial batch: batch.sh <list.tsv: id<TAB>recipe> <phase> [stride]   (dumps -> /workspace/work/legacy-audit-r1/dumps/<id>.json)
cd /workspace/work/legacy-audit-r1/hub
export LD_LIBRARY_PATH=/workspace/work/chromelibs/usr/lib/aarch64-linux-gnu PYTHONPATH=/workspace/work/pylib
LIST=$1; PHASE=$2; STRIDE=${3:-10}; D=/workspace/work/legacy-audit-r1/dumps; A=/workspace/work/legacy-audit-r1/an
echo $$ > /workspace/work/legacy-audit-r1/batch.pid
while IFS=$'\t' read -r id recipe; do
  [ -z "$id" ] && continue
  if [ ! -s $D/$id.json ]; then
    timeout 900 node tools/legacy-audit-r1/audit.mjs --recipe $recipe --out $D/$id.json --stride $STRIDE --render-frac 0.25,0.5,0.75 --png-dir /workspace/work/legacy-audit-r1/png/$id --size 220 --views "pfront:0,0.25,1;pside:1,0.2,0;ptop:0,1,0.001:0,0,-1;camcr:0,0,0:0,1,0:pelvis,0.3,-0.05" > $D/$id.log 2>&1 || echo "FAIL $id $?" >> $D/_fail.txt
  fi
  [ -s $D/$id.json ] && python3 tools/legacy-audit-r1/analyze.py $D/$id.json > $A/$id.json 2>$A/$id.err
  python3 tools/legacy-audit-r1/progress.py "$LIST" "$PHASE" "$id"
done < $LIST
echo done > /workspace/work/legacy-audit-r1/batch.done.$PHASE
