#!/usr/bin/env bash
# Build drill-anim/models/training-human-v2plus-torso-base.json (opt-in base-mesh torso, v2plus.torso:'base').
#   tools/human-v2plus/torso-base/build.sh [workdir]        (numpy + scipy, zstandard or the zstd CLI; ~2 min, < 2 GB; run via /workspace/bin/heavy)
# Inputs: output/human-v2plus-work/rest.json (tools/human-v2plus/probe.mjs), drill-anim/models/training-human-v2plus-outfit.json,
# and Blender's "Human Base Meshes" bundle v1.4.1 (CC0, https://www.blender.org/download/demo-files/#assets), downloaded once.
#  fetch    bundle zip -> zstd-compressed .blend -> plain .blend
#  extract  blendread.py/extract.py: GEO-body_male_realistic base cage + multires displacement grids (no Blender needed)
#  subd     Catmull-Clark x2 + multires normal displacement at level 2 (three.js axes)                      -> male_l2.npz
#  stage A  similarity + thigh/arm re-pose + bi-Laplacian displacement field fitted to the v2 compression silhouette -> fit.npz
#  stage A2 armpit lift: the hollow's apex onto the v2 tee apex height (smooth field)                             -> fit.npz
#  stage B  cut under the kept tee collar band, at the arm weld ring and the leg skin top, snap, zipper to the exact
#           rings of the existing meshes                                                                           -> zip.npz
#  stage C1 bi-Laplacian seam fairing with the neighbouring rings as fixed ghosts                                   -> fair.npz
#  stage C2 weights (closest-point barycentric transfer of the compression outfit's weights, seams exact; harmonic weights on
#           the small armpit-apex patch), normals (seams = skinned rest normals of the welded vertex; smoothed normals on the
#           crumpled armpit apex; v2 arm-skin normals on the short-sleeve skin strip), export
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$DIR/../../.." && pwd)"
WORK="${1:-$REPO/output/human-v2plus-torso-base-work}"; mkdir -p "$WORK"; cd "$WORK"
export PYTHONPATH="$DIR${PYTHONPATH:+:$PYTHONPATH}"
URL=https://download.blender.org/demo/asset-bundles/human-base-meshes/human-base-meshes-bundle-v1.4.1.zip
SHA=811f43accbb31a88266d932f8f5563b2d13586fca0ba2693aad1f5fe582b3515
if [ ! -f male_l2.npz ]; then
  [ -f hbm.zip ] || curl -sSL -o hbm.zip "$URL"
  echo "$SHA  hbm.zip" | sha256sum -c -
  python3 - <<'P'
import zipfile, subprocess
z=zipfile.ZipFile('hbm.zip'); n=[x for x in z.namelist() if x.endswith('human_base_meshes_bundle.blend')][0]; d=z.read(n)
if d[:7]!=b'BLENDER':   # Blender saves the bundle zstd-compressed
    try: import zstandard; d=zstandard.ZstdDecompressor().stream_reader(d).read()
    except ImportError: d=subprocess.run(['zstd','-dc'],input=d,capture_output=True,check=True).stdout
open('hbm.blend','wb').write(d)
P
  python3 "$DIR/extract.py"; python3 "$DIR/subd.py"; rm -f hbm.blend male_raw.npz
fi
python3 "$DIR/stage_a.py"
cp fit.npz fit_a.npz; python3 "$DIR/stage_a2.py" fit_a.npz fit.npz
python3 "$DIR/stage_b.py"
python3 "$DIR/stage_c1.py"
python3 "$DIR/stage_c2.py" "$REPO/drill-anim/models/training-human-v2plus-torso-base.json"
python3 "$DIR/seamcheck.py" || true
