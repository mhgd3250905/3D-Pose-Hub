#!/usr/bin/env bash
# Build drill-anim/models/training-human-v2plus-torso.json (opt-in sculpted torso, v2plus.torso:'sculpted').
#   tools/human-v2plus/torso/build.sh [workdir]      (numpy/scipy/scikit-image; ~1 min, ~1.5 GB peak in stage1)
# Needs output/human-v2plus-work/rest.json (tools/human-v2plus/probe.mjs) and the compression outfit json.
#  stage1  shape fields (trunk sections from the compression tee/shorts, deltoid/arm + thigh tubes fitted to the sleeve/skin)
#          + smooth unions -> marching cubes (5 mm)
#  stage2  cut under the kept tee collar band, at the arm weld ring (t=0.17 from the shoulder) and the leg skin top; zipper
#          the cut rings to the exact rings of the existing meshes
#  stage3  Taubin smoothing, sculpted offsets (pecs, linea alba/tendons, spine groove, glutes), bi-Laplacian seam fairing
#          with the neighbouring rings of the existing meshes as fixed ghosts (C1 across the weld)
#  stage4  skin weights (normal-aware IDW from the v2 tee/shorts/skin incl. the training-collar rule, heat diffusion,
#          seams = the welded vertex's weights), normals, sleeve-paint gate, export
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$DIR/../../.." && pwd)"
WORK="${1:-$REPO/output/human-v2plus-torso-work}"; mkdir -p "$WORK"; cd "$WORK"
export PYTHONPATH="$DIR:$WORK${PYTHONPATH:+:$PYTHONPATH}"
python3 - "$DIR/stage1.py" "$WORK/stage1lib.py" <<'P'
import sys; s=open(sys.argv[1]).read(); i=s.index('# ---------- SDF on grid')
open(sys.argv[2],'w').write(s[:i].replace("VOX=float(sys.argv[1]) if len(sys.argv)>1 else 0.005","VOX=0.005"))
P
python3 "$DIR/stage1.py" 0.005
python3 "$DIR/stage2.py"
python3 "$DIR/stage3.py"
python3 "$DIR/stage4.py" "$REPO/drill-anim/models/training-human-v2plus-torso.json"
