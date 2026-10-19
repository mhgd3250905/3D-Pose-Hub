#!/usr/bin/env bash
# Downloads the CC0 MakeHuman/MPFB2 assets the v3 build needs into $HV3_WORK/src/mpfb (default output/human-v3-work).
# BodyParts3D muscles come from the copy already in this repo (runtime/public/anatomy, CC BY 4.0); the original archive is
# https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html (isa_BP3D_4.0_obj_99.zip holds the muscle elements).
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; W="${HV3_WORK:-$REPO/output/human-v3-work}"; D="$W/src/mpfb"; mkdir -p "$D"
B=https://raw.githubusercontent.com/makehumancommunity/mpfb2/master/src/mpfb/data
for f in 3dobjs/base.obj rigs/standard/rig.default.json rigs/standard/weights.default.json \
  targets/macrodetails/caucasian-male-young.target.gz targets/macrodetails/african-male-young.target.gz targets/macrodetails/asian-male-young.target.gz \
  targets/macrodetails/universal-male-young-maxmuscle-averageweight.target.gz targets/macrodetails/universal-male-young-averagemuscle-minweight.target.gz; do
  curl -sSfL -o "$D/$(basename $f)" "$B/$f"; done
curl -sSfL -o "$D/LICENSE.ASSETS.md" https://raw.githubusercontent.com/makehumancommunity/mpfb2/master/LICENSE.ASSETS.md
echo "MPFB2 assets in $D"
