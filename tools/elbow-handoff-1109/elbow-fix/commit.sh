#!/bin/bash
# commit.sh id [already-made]
set -e
cd /workspace/work/elbow-fix
id=$1
if [ -z "$2" ]; then node makespec.mjs $id > /tmp/ms.out; fi
sf=$(head -1 /tmp/ms.out)
cd /workspace/work/elbow-scan-wt
rf=$(python3 -c "import json;print(json.load(open('/workspace/work/elbow-fix/recipes.json'))['$id'])")
git add "$sf" "$rf"
git commit -q -F /workspace/work/elbow-fix/msg.txt
git log --oneline -1
