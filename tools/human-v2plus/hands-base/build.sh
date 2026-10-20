#!/usr/bin/env bash
# Build drill-anim/models/training-human-v2plus-hands-base.json (opt-in base-mesh hands v2plus.hands:'base', needs limbs:'base').
#   tools/human-v2plus/hands-base/build.sh [workdir]      (numpy + scipy; < 30 s, < 1.5 GB; run via /workspace/bin/heavy)
# Needs the limbs-base work dir (tools/human-v2plus/limbs-base/build.sh: male_l2.npz, limbs_fit.npz, limbs_zip.npz, limbs_final.npz)
# and output/human-v2plus-work/rest.json.
#  limbs_pre  limbs stage A up to its skin fit (the intact base hand; the fit breaks the index)                 -> limbs_pre.npz
#  hands_a    left base hand -> v2plus finger rig (geodesic tips, thumb field + Poisson, finger-root Poisson)  -> hands_fit.npz
#  hands_b    right = mirror, wrist weld onto the limbs' Coach_Body wrist rings, weights, export               -> the JSON
#  sketch.py / sketch2.py <out.jpg> [pose ...]  optional offline looks (v2 vs base; thumb close-ups)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$DIR/../../.." && pwd)"
WORK="${1:-$REPO/output/human-v2plus-torso-base-work}"; cd "$WORK"
[ -f limbs_final.npz ] || { echo "run tools/human-v2plus/limbs-base/build.sh first" >&2; exit 1; }
export PYTHONPATH="$DIR:$DIR/../limbs-base:$DIR/../torso-base${PYTHONPATH:+:$PYTHONPATH}"
sed '/# ---------- displacement fit/,$d' "$DIR/../limbs-base/limbs_a.py" > limbs_pre_gen.py && python3 limbs_pre_gen.py && rm -f limbs_pre_gen.py
python3 "$DIR/hands_a.py" limbs_pre.npz
python3 "$DIR/hands_b.py" "$REPO/drill-anim/models/training-human-v2plus-hands-base.json"
