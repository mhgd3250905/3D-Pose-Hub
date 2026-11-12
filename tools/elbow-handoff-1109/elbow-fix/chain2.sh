#!/bin/bash
cd /workspace/work/elbow-fix
for b in b4.txt b5.txt; do ./run.sh $b $(cat $b); done
echo CHAINDONE >> run.log
