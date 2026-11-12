#!/bin/bash
cd /workspace/work/elbow-fix
for b in b*.txt; do ./run.sh $b $(cat $b); done
echo CHAINDONE >> run.log
