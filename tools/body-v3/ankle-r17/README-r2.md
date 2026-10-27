# P1 ankle r17 — review record

The user has accepted the revised review method for P1. Under that method, the
recorded rest, squat, plank and fold samples pass the listed ankle review:
selected shoe/skin triangles have zero FCL contact pairs on each side, the
28-pair ankle seams agree within recorded floating-point precision, and the
sampled same-camera images are available for review. This is a sampled review,
not a proof for every action, theme, camera or the full model. The independently
initialized-model adapter and any combined output must be verified separately.

## Source and results

The baseline is original `training-human-v3` with c1r2 hands; the candidate is
actual r17. Data is stored outside the repository at
`E:/AII-3D/codex-output/body-v3-fixes-20261027/ankle/`. The 1 mm proxy figures
below are **legacy nearest-vertex/normal estimates**, not confirmed penetration.
FCL is the same fixed rest-space shoe/skin face subset per side, so the two
columns are comparable. Values are left / right.

| Pose | Baseline FCL pairs | Candidate FCL pairs | Baseline legacy >1 mm (max mm) | Candidate legacy >1 mm (max mm) | Candidate max seam gap mm |
| --- | --- | --- | --- | --- | --- |
| Rest | 117 / 117 | 0 / 0 | 78 / 82 (6.667 / 6.666) | 0 / 0 (0 / 0) | 0.00005 / 0.00005 |
| Squat | 192 / 192 | 0 / 0 | 79 / 82 (9.165 / 9.165) | 0 / 0 (0.346 / 0.347) | 0.00005 / 0.00005 |
| Bear plank | 208 / 208 | 0 / 0 | 98 / 102 (9.427 / 9.428) | 32 / 31 (9.374 / 9.375) | 0.00007 / 0.00007 |
| Seated fold | 116 / 116 | 0 / 0 | 78 / 82 (6.234 / 6.232) | 0 / 0 (0 / 0) | 0.00006 / 0.00006 |

Source records: `baseline-r1/{ankle-metrics-r3,fcl-collision-r1}.json`,
`candidate-r15-preview/{ankle-metrics-r3,fcl-collision-r1}.json`, and
`candidate-r15-fold-r1/{ankle-metrics-r3,fcl-collision-r1}.json`. r15 and r16
snapshots have identical captured positions/normals and indices for 12 visible
skinned meshes in all four samples; r17 adds only cloned shoe materials. Actual
r17 runtime metadata confirms the body, limbs and sneakers are visible with
full index draw ranges and their world positions match the r16 snapshot for all
four poses. See `candidate-r16-compare-r1/whole-dump-comparison-r2.json` and
`candidate-r17-compare-r1/runtime-range-r1.json`.

The legacy plank warnings remain in the record: maximum 9.375 mm, 63 points.
Against same-side nearest triangles, none exceed 1 mm by either interpolated
or geometric face-normal projection. On the combined open skin, all 63 have
24 even ray crossings and winding close to zero. Artificially capped foot
experiments at two different cut heights classify the same points outside,
but each foot has seven FCL non-adjacent skin self-contact pairs. Because the
original skin has open boundaries, FCL is surface-only and the capped solids
have those contacts, this is supporting evidence, not a rigorous closed-solid
inside/outside proof. Details are in `ankle-geometry-r1/cap-report-r1.md` and
`candidate-r15-preview/{closest-face-r2,winding-ray-r4,closed-cap-probe-r2}.json`.

`baseline-to-r17-r1/primary-left.png` compares rest/squat/plank with original
left-foot 0.42 m / 22° cameras. Original matching right-foot primary views do
not exist. `baseline-to-r17-r1/fold-both.png` uses matched left/right mouth
and outer cameras, which differ from the primary cameras. Original individual
file paths, SHA-256, and pose labels are in `baseline-to-r17-r1/sources-r1.json`.
The GPU shoe-backface diagnostics and actual r17 views are in
`r16-shoe-double-r1/` and `candidate-r17-compare-r1/`. Positive controls for
rest quadriceps and calves have 12,875 and 8,867 highlighted pixels and match
r16 in `r17-highlight-positive-r1/`. These visual and highlight checks cover
the recorded cameras and theme only; images are external artifacts, not Git
source files.

## Minimal r17 submission and review tools

Required new runtime files, together with the existing tracked v3/v2plus/hands
stack:

- `drill-anim/models/body-v3-ankle-r17/loader.mjs` and `manifest.json`.
- `drill-anim/models/body-v3-ankle-r16/loader.mjs`.
- `drill-anim/models/body-v3-ankle-r13/loader.mjs`.
- `drill-anim/models/body-v3-ankle-r8/loader.mjs` and `ankle-r8.mjs`.
- `drill-anim/models/body-v3-ankle-r7/ankle-r7-shape.mjs`.
- `drill-anim/models/body-v3-ankle-r6/ankle-r6-shape.mjs` and `ankle-r6-fit.mjs`.

Add `drill-anim/models/body-v3-ankle-r17/verify.mjs`, its historical
`README.md`, this review record, and any separate integration adapter with
its own review. The manifest's 28 SHA entries do not enumerate every existing
transitive page/runtime resource. Do not commit local config, dependency
installations, screenshots, raw captures or old candidate outputs.

For reproducible diagnostics, retain the relevant scripts and their direct
helpers as a separate review set:

- Baseline capture: `tools/body-v3/joints-audit/jointaudit-r1.mjs`; its
  existing loader, specs and `drill-anim/tools/v2/browser-layers.js` are needed.
- r15 snapshot capture: `tools/body-v3/ankle-r15/jointpreview-r15.mjs`,
  `fold-preview-r1.mjs`, and `drill-anim/models/body-v3-ankle-r15/loader.mjs`
  in addition to the r17 runtime chain.
- r16/r17 comparison: `tools/body-v3/ankle-r16/compare-four-r1.mjs`,
  `jointpreview-r16.mjs`, `compare-snapshots-r1.py`, `fold-coverage-r1.mjs`,
  `shoe-id-side-r1.mjs`, and `tools/body-v3/ankle-r17/compare-r17-r1.mjs`,
  `highlight-positive-r1.mjs`. r17 comparison and several fold diagnostics
  consume the earlier r16 comparison directory as an explicit input.
- Numerical and method checks: `tools/body-v3/ankle-r2/measure-r3.py`,
  `ankle-r4/closest-face-r2.py`, `ankle-r5/collision-r2.py`, and
  `ankle-geometry-r1/{winding_ray_r1.py,seam-identities-r1.py,cap-feasibility-r2.py,closed-cap-probe-r2.py,runtime-range-r1.mjs,cap-report-r1.md,README.md}`.
  They consume the listed snapshot and flag files, not just the source tree.

Browser capture uses the existing configured Vite / Playwright / Three stack
and local `drill-anim/config.json`; NumPy, SciPy, Trimesh, rtree and python-fcl
are needed for the numerical probes. `node drill-anim/models/body-v3-ankle-r17/verify.mjs`
passed for the recorded r17 sources. It is not a substitute for the user's
required repository verify, portability and catalog checks before pushing.
