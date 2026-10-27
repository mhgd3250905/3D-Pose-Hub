# L2 candidate handoff: original v3 and complete outfit

The orange line under the shoulder is retained as a natural rim on an
occlusion boundary. In the saved original-v3 shoulder comparison it is one
8-connected 59-pixel component, all within 2 pixels of the existing reference
boundary. At those 59 image positions, a front-face CPU raycast through the
tracked base GLB warped to v3 rest finds Mesh005 first and a second Mesh005
intersection; in 51 cases the two hits are over 1 mm apart. The raycast is
before browser weld and shader displacement and is not pixel-exact GPU depth.
It supports the existing visual assessment; it does not establish the status
of other regions or poses. The original rim and highlight functions are not
disabled.

The exact original-v3 side-by-side sheet is
`E:/AII-3D/codex-output/body-v3-fixes-20261027/materials/v3-normals-before-after-sheet-r1.html`.
It directly references the unchanged PNG files. The static rest-elbow reference
and candidate images were also reproduced pixel-for-pixel by the separate
no-outfit diagnostic. Renders cover the front, T-pose, shoulder and elbow
views shown in the sheet. Final visual acceptance belongs to the reviewer.

## Base GLB candidate and minimum runtime files

`training-human-v3-normals-r1` recomputes selected warped base-GLB arm normals
at rest; it does not install the v2plus piece normal repair. Its new runtime
files are:

```
drill-anim/models/training-human-v3-normals-r1/loader.mjs
drill-anim/models/training-human-v3-normals-r1/manifest.json
tools/body-v3/arm-normals-r1.js
```

The existing v3 loader, viewer, warp, rig and base GLB remain required and are
already in the branch. In the numerical test, 6,569 normals change, 4,081
duplicate vertices are welded, and 203 are skipped by protections; changed
normals contain no non-finite or zero values, with maximum unit-length error
4.24e-8. The binding-space normal-direction change has p50 1.75°, p95 16.04°
and max 58.42°. This is a numerical change report, not a spot count.

## Complete v2plus outfit candidate

`training-human-v3-normals-r3` composes the base candidate, already committed
wrist gradient and v2plus torso/limbs/hands seam-normal candidate. Its
additional runtime files are:

```
drill-anim/models/training-human-v3-normals-r3/loader.mjs
drill-anim/models/training-human-v3-normals-r3/manifest.json
tools/body-v3/piece-normals-r1.js
```

Its wrist loader and patch, c1r2 hands and torso/limb source data already exist
in the branch. Piece-normal installation requires the full v2plus profile and
resets motion during explicit setup. In each of four sampled frame-zero poses
(squat, plank, fold and grip), 508 seam pairs had no invalid normals; the
before candidate already included the base normal and wrist candidates. Across
those samples, seam normal angle p95 changed from 4.826° to at most 0.0000031°
and maximum gap stayed at most 0.000113 mm. Rest hand on/off/on checks covered
508/442/508 pairs and 66 normal-swap points; max gap 0.000135 mm and max normal
angle 0.0000037°. These numbers assess shared seams, not all surface shading.

Full outfit screenshots and measurements are independently stored in
`.../materials/piece-motion-before-r1/`, `.../materials/piece-motion-after-r1/`
and `.../materials/normals-r3-integration/` under
`E:/AII-3D/codex-output/body-v3-fixes-20261027/`. They are not the original
v3 no-outfit sheet. A fold elbow has natural rim/occlusion details and a
separate guard response; see `normal-spot-results-r1.md`. These frames do not
establish every-motion visual acceptance or device behavior.

## Minimal verification and evidence files

Along with the runtime files, include the relevant tests and evidence scripts
when saving the candidate. These checks passed locally:

```
node tools/body-v3/verify-normals-candidates-r1.mjs
node tools/body-v3/arm-normals-r1-check.mjs
node tools/body-v3/piece-normals-r1-check.mjs
node tools/body-v3/piece-normals-r2-check.mjs
node tools/body-v3/normals-loader-r3-check.mjs
```

`piece-normals-r2-check.mjs` additionally imports
`tools/body-v3/bindspace-solve-r1.mjs`. To reproduce the visual and dynamic
evidence, retain `arm-normals-review-r1.mjs`, `piece-motion-compare-r1.mjs`,
`piece-motion-snapshot-r1.js`, and, for the boundary check,
`shoulder-rim-pixels-r1.py` and `shoulder-rim-raycast-r2.mjs`. The before/after
sheet and PNGs are local outputs, not committed assets. The manifests are
already versioned and SHA-checked; this document and the independent verifier
do not rewrite them. Both candidates remain `reviewed:false` and
`releaseEligible:false`. Overall repository verify, portability and catalog
checks remain the coordinating agent's pre-push responsibility.
