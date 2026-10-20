#!/usr/bin/env bash
# Build drill-anim/models/training-human-v2plus-limbs-base.json (opt-in base-mesh arms + legs, v2plus.limbs:'base', needs torso:'base').
#   tools/human-v2plus/limbs-base/build.sh [workdir]      (numpy + scipy; < 1 min, < 2 GB; run via /workspace/bin/heavy)
# Needs the torso-base work dir (tools/human-v2plus/torso-base/build.sh: male_l2.npz, zip.npz, final.npz) and output/human-v2plus-work/rest.json.
#  limbs_a  per-segment re-pose of the base arms / legs onto the v2 joints + stiff low-frequency fit to the v2 arm / leg skin -> limbs_fit.npz
#  limbs_b  cut between the torso's Coach_Body arm / leg rings and a wrist ring (3.5 cm up the forearm) / ankle ring (y 0.19),
#           snap 4 mm short of each ring, zipper to the exact ring vertices                                                  -> limbs_zip.npz
#  limbs_c  seam fairing (Coach_Body + base-torso ghost rings), weights (closest-point transfer of the v2 skin's), normals, export
#  sketch   optional offline look: sketch.py <out.jpg> (current v2 limbs vs base limbs, rest pose)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$DIR/../../.." && pwd)"
WORK="${1:-$REPO/output/human-v2plus-torso-base-work}"; cd "$WORK"
[ -f final.npz ] || { echo "run tools/human-v2plus/torso-base/build.sh first" >&2; exit 1; }
export PYTHONPATH="$DIR:$DIR/../torso-base${PYTHONPATH:+:$PYTHONPATH}"
python3 "$DIR/limbs_a.py"
python3 "$DIR/limbs_b.py"
python3 "$DIR/limbs_c.py" "$REPO/drill-anim/models/training-human-v2plus-limbs-base.json"
