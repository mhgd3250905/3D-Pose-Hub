#!/bin/bash
cd /workspace/work/elbow-scan; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8863
for c in chunk_0*; do
  echo "== $c $(date +%T)" >> run2.log
  /workspace/bin/heavy -- timeout 3600 node batch2.mjs --out res.jsonl --override h-open-book=drill-anim/specs/h-open-book-r12.js $(cat $c) >> run2.log 2>&1
  echo "== $c exit $? $(date +%T)" >> run2.log
done
echo ALLDONE >> run2.log
