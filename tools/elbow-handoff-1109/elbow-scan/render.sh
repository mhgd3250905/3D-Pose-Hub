#!/bin/bash
cd /workspace/work/elbow-scan-wt; nohup node node_modules/vite/bin/vite.js --port 8863 --strictPort --host 127.0.0.1 > /workspace/work/elbow-scan/vite2.log 2>&1 &
VP=$!; sleep 8
cd /workspace/work/elbow-scan; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8863
/workspace/bin/heavy -- timeout 3000 node render.mjs --dir png --jobs jobs.json >> render.log 2>&1
echo "RENDER EXIT $?" >> render.log
kill $VP
