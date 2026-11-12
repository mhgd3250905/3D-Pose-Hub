#!/bin/bash
cd /workspace/work/elbow-fix
while pgrep -f chain2.sh >/dev/null; do sleep 5; done
python3 - <<'P'
import json
ids=set("h-supine-bilateral-leg-raise t-seated-straddle-lift-1leg h-quadruped-open deltoids-B h-biceps-self t-lsit-tuck t-flare-side-hold".split())
L=[l for l in open('res.jsonl') if json.loads(l)['id'] not in ids]
open('res.jsonl.pre-redo','w').writelines(open('res.jsonl').readlines())
open('res.jsonl','w').writelines(L)
P
./run.sh redo h-supine-bilateral-leg-raise t-seated-straddle-lift-1leg h-quadruped-open deltoids-B h-biceps-self t-lsit-tuck t-flare-side-hold
echo REDODONE >> run.log
