# tools/human-v3 — training-human-v3 prototype build + comparison

See `docs/training-human-v3-proto.md` for results, licences and known gaps.

- `fetch_assets.sh` — download the CC0 MPFB2 data files (base mesh, targets, default rig + weights).
- `build/rest.py` — MakeHuman body (male young, +muscle), 102-bone rig, 4-influence weights, mannequin head shell, shoe-smoothed feet.
- `build/muscles.py` — pose the body into the BodyParts3D anatomical pose and label vertices (superficial + deep) from the BP3D muscle surfaces.
- `build/post.py` — geometric fill for rectus abdominis / latissimus (missing in BP3D 4.0), erector band, cleanup, L→R mirror.
- `build/export.py <glb> <json> [scale]` — write the GLB (`_MUSCLE_ID`, `_MUSCLE_DEEP`, `_GARMENT`, `_DQS_WEIGHT`) and sidecar JSON.
- `build/preview.py`, `build/viewlab.py` — matplotlib previews of the rest mesh / labels.
- `compare.mjs` + `run-compare.sh` — legacy vs v3 stills, muscle-ID sheets, LBS/DQS close-ups (one Chromium, `--jobs 1` equivalent).
- `sheet.py` — compose the JPG sheets.

Intermediate files go to `$HV3_WORK` (default `output/human-v3-work`, git-ignored).
