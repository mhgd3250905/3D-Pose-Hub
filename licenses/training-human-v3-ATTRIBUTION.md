# training-human-v3 (prototype) attribution

Files: `runtime/public/coach/training-human-v3.glb`, `drill-anim/models/training-human-v3.json`
(muscle-ID table and per-vertex IDs), built by `tools/human-v3/build/*.py`.

## Body mesh, rig and skin weights — MakeHuman / MPFB2, CC0 1.0

- Base mesh `3dobjs/base.obj`, macro targets (`*-male-young`, `universal-male-young-*`), the
  `default` rig (`rigs/standard/rig.default.json`) and its weights (`weights.default.json`) from
  MPFB2, https://github.com/makehumancommunity/mpfb2 (`src/mpfb/data`).
- MPFB2 / MakeHuman assets are released under **CC0 1.0 Universal**
  (https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.ASSETS.md). MPFB2's program code
  (GPLv3) is not used or redistributed; the build reads the data files with plain Python/numpy.
- Local changes: young male macro mix with +35 % muscle; facial, eye, jaw, tongue and breast bones folded
  into their parents (102 of 163 bones kept, including 3-segment fingers, 5 spine segments, 3 neck
  segments, clavicles, toes and the split upper-arm / forearm / thigh / shin bones); a new egg-shaped
  mannequin head shell (icosphere fitted to the convex hull of the original head and smoothed); feet
  smoothed and slightly inflated into a shoe volume; uniform scale 0.97; painted tee / bottoms / shoe
  fields (`_GARMENT`) instead of separate garment meshes.

## Muscle IDs — BodyParts3D, CC BY 4.0

**BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**

- Source: BodyParts3D 4.0, https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
  (licence: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html, CC BY 4.0 since 2025-02-27).
- The muscle and bone surfaces used are the BodyParts3D elements already converted in this repository
  (`runtime/public/anatomy/muscles.bin.gz`, `bones.bin.gz`, `manifest.json`; see
  `runtime/public/anatomy/ATTRIBUTION.md`).
- Derived data, not geometry: the v3 body is posed into the BodyParts3D anatomical pose with bone
  landmarks, each body vertex is labelled with the first muscle surface found inward along its normal
  (`_MUSCLE_ID`) and with a deep muscle under it where relevant (`_MUSCLE_DEEP`), labels are cleaned and
  mirrored. No BodyParts3D geometry is embedded in the GLB.
- BodyParts3D 4.0 has no rectus abdominis or latissimus dorsi; those two IDs (`abs`, `lats`) are filled
  geometrically and are marked as such in the sidecar.
- Z-Anatomy (CC BY-SA) is **not** used.
