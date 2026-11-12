#!/bin/bash
cd /workspace/work/elbow-fix
python3 choose.py > choose.out
python3 - <<'P' > todo.txt
import json
c=json.load(open('choice.json'));SK=set(json.load(open('skip.json')))
for id,x in c.items():
  if id in SK:continue
  if 'sides' in x and any(y['status'] in('full','partial') for y in x['sides'].values()) and all(y['status'] in('full','partial') for y in x['sides'].values()):
    r=json.load(open(json.load(open('recipes.json'))[id]))
    if 'elbowTwistFix' not in r: print(id)
P
for id in $(cat todo.txt); do ./commit.sh $id | cut -c1-90; done
