#!/bin/bash
cd /workspace/work/elbow-fix/sh; export LD_LIBRARY_PATH=/workspace/work/pw148/libs APP_URL=http://127.0.0.1:8871
echo "== render5 $(date +%T)" >> run.log
/workspace/bin/heavy -- timeout 3000 node render3.mjs --dir png5 --jobs jobs-r5render.json >> run.log 2>&1
echo "== render5 exit $? $(date +%T)" >> run.log
