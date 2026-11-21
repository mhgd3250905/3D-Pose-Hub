#!/bin/bash
# Serial evidence renders: render.sh <list: id<TAB>recipe<TAB>frames(comma)> <outdir>   (low-res 300 px; views front/side/top + crotch close-up)
cd /workspace/work/legacy-audit-r1/hub
export LD_LIBRARY_PATH=/workspace/work/chromelibs/usr/lib/aarch64-linux-gnu
LIST=$1; OUT=$2; SIZE=${3:-300}
VIEWS="pfront:0,0.25,1;pside:1,0.2,0;ptop:0,1,0.001:0,0,-1;pback:0,0.25,-1;camcr:0,0,0:0,1,0:pelvis,0.3,-0.05"
while IFS=$'\t' read -r id recipe frames; do
  [ -z "$id" ] && continue
  [ -d $OUT/$id ] && [ "$(ls $OUT/$id | wc -l)" -gt 0 ] && continue
  timeout 900 node tools/legacy-audit-r1/audit.mjs --recipe $recipe --frames $frames --render $frames --png-dir $OUT/$id --size $SIZE --views "$VIEWS" --out $OUT/$id.json > $OUT/$id.log 2>&1
done < $LIST
echo done > $OUT/_done
