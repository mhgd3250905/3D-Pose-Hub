#!/usr/bin/env bash
# Build drill-anim/models/training-human-v2plus-head-base.json (opt-in base-mesh head + neck, v2plus.head:'base', needs torso:'base').
#   tools/human-v2plus/head-base/build.sh [workdir]      (numpy + scipy; < 1 min; run via /workspace/bin/heavy)
# Needs the torso-base work dir (male_l2.npz from tools/human-v2plus/torso-base/build.sh) and output/human-v2plus-work/rest.json.
#  head_a  align (M8 sketch transform), cut at Mesh001's bottom boundary, lower neck onto the v2 neck under the collar, eye caps -> head_fit.npz
#  HD_FACE=detail (default again since M10g: user chose the original M10 face) | ready (M10f) | mannequin (M10e) | wrap (M10d) | egg (M10c) | soft (M10b mannequin face) | detail (M10 base face; HD_MANNEQUIN=0 = detail too)
#  head_m  soft (M10b): close mouth / nostrils, re-cap eyes, low-pass + region detail factors; wrap: only the cavity close / eye re-cap -> head_fit.npz
#  head_w  wrap only (M10d): fabric-wrap face — mouth re-topology, ears pressed flat, lips one membrane, morphological closing (ball 16 mm)
#          pushes concavities out, Taubin, exact sagittal symmetrize above the neck                                   -> head_fit.npz
#  head_e  ready (M10f): ready-made head "Free Mannequin Head" by SPLiNER (Printables 1257615, CC BY 4.0; assets/ATTRIBUTION.md) as a
#          point-cloud SDF (assets/spliner-head-pts.npz, x-symmetrized, cubic volume), neck stub faded, smooth union with the base neck;
#          mannequin (M10e): analytic display-mannequin head (super-ellipsoid cranium + tapered face mass + soft long nose ridge, no
#          eyes / mouth / ears), same grid / seam machinery as egg; egg (M10c): faceless analytic egg head (smooth union with the base neck profile), mirror-symmetric grid, base neck
#          kept below 1.46 (plane cut), zipped                                                                       -> head_fit.npz
#  head_b  weld to Mesh001's bottom boundary loop, weights (training-collar neck rule + head mask), export                      -> the JSON
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$DIR/../../.." && pwd)"
WORK="${1:-$REPO/output/human-v2plus-torso-base-work}"; cd "$WORK"
[ -f male_l2.npz ] || { echo "run tools/human-v2plus/torso-base/build.sh first" >&2; exit 1; }
export PYTHONPATH="$DIR:$DIR/../limbs-base:$DIR/../torso-base${PYTHONPATH:+:$PYTHONPATH}"
python3 "$DIR/head_a.py"
python3 "$DIR/head_m.py"
python3 -W ignore "$DIR/head_e.py"
python3 -W ignore "$DIR/head_w.py"
python3 "$DIR/head_b.py" "$REPO/drill-anim/models/training-human-v2plus-head-base.json"
