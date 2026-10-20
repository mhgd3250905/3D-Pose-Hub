#!/usr/bin/env bash
# Build drill-anim/models/training-human-v2plus-head-base.json (opt-in base-mesh head + neck, v2plus.head:'base', needs torso:'base').
#   tools/human-v2plus/head-base/build.sh [workdir]      (numpy + scipy; < 1 min; run via /workspace/bin/heavy)
# Needs the torso-base work dir (male_l2.npz from tools/human-v2plus/torso-base/build.sh) and output/human-v2plus-work/rest.json.
#  head_a  align (M8 sketch transform), cut at Mesh001's bottom boundary, lower neck onto the v2 neck under the collar, eye caps -> head_fit.npz
#  head_m  mannequin face (M10b; HD_MANNEQUIN=0 skips): close mouth / nostrils, re-cap eyes, low-pass + region detail factors -> head_fit.npz
#  head_b  weld to Mesh001's bottom boundary loop, weights (training-collar neck rule + head mask), export                      -> the JSON
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$DIR/../../.." && pwd)"
WORK="${1:-$REPO/output/human-v2plus-torso-base-work}"; cd "$WORK"
[ -f male_l2.npz ] || { echo "run tools/human-v2plus/torso-base/build.sh first" >&2; exit 1; }
export PYTHONPATH="$DIR:$DIR/../limbs-base:$DIR/../torso-base${PYTHONPATH:+:$PYTHONPATH}"
python3 "$DIR/head_a.py"
python3 "$DIR/head_m.py"
python3 "$DIR/head_b.py" "$REPO/drill-anim/models/training-human-v2plus-head-base.json"
