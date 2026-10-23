# Native hand/forearm fit 1.0.0-r3

Local review candidate for `h-bent-knee-calf-raise-rr7` and `h-chair-single-leg-hip-thrust-rr8`. Explicit profile: `training-human-v2plus-hands-native`, `nativeHands.version: '1.0.0-r3'`. User review, release eligibility and production-default flags remain false.

The r1 builder enlarged the complete source hand by 1/0.7569905244626751 to match the old middle-finger length. This also enlarged the palm and wrist. r2 retained that scale and reduced only a wrist band, so it did not resolve the overall mismatch. This version rebuilds from the intact reposed CC0 source at uniform source scale 1.0. Finger-joint positions use exactly the same scale as the hand. It retains source palm/finger geometry instead of retargeting it onto the old finger layout.

The frozen forearm's live boundary remains the attachment target. The rebuilt joining band fits both position and neighboring forearm surface; wrist influence uses cubic smoothstep over a physical band ending at hand-local 35 mm. At sections from -40 to 0 mm, the forearm/hand width changes gradually from about 57.2 to 55.6 mm. The median angle between faces across the seam is about 5.7 degrees, compared with about 10.9 in r2. These measurements describe the rest mesh, not every animated pose.

The two new specifications also turn the free fingers slightly toward the forearm: left `[-.12,-.95,.34]`, right `[.12,-.95,.34]`. Palm target, palm normal, elbow pole, finger curl, body motion, support, timing and camera are preserved. This reduces wrist bending without treating the hand as a support point or enabling the unsupported legacy touch solver.

All r1/r2 assets, tools, manifests and previews remain unchanged. r3 has its own mesh, rig and pinned source manifest. The current production entry still chooses the frozen rc2 recipe; use this folder's dedicated preview entry. Grip/floor-contact presets and library-wide rollout have not been validated.

Rebuild and preview in fresh directories:

```powershell
python tools/human-v2plus/hands-native/fit_hand.py --source <source-work/limbs_pre.npz> --rest <rest/rest.json> --native-scale 1.0 --weight-end .035 --out <new-model-directory>
node drill-anim/models/hands-native-r3/preview.mjs drill-anim/specs/h-bent-knee-calf-raise-rr7.js <new-calf-preview-directory>
node drill-anim/models/hands-native-r3/preview.mjs drill-anim/specs/h-chair-single-leg-hip-thrust-rr8.js <new-hip-preview-directory>
```

Validation must include section proportions, seam tangent continuity, deformation under actual wrist poses and visual inspection at fixed camera scale. A zero nonadjacent-triangle intersection count alone does not establish a satisfactory hand shape. Previews remain sparse samples pending user review.
