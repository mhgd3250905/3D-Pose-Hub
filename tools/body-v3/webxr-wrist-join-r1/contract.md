# Minimum actual-capture contract

The checker owns only `check.py`; builder/runtime files are independent. No browser or GPU is launched by this checker.

`report.json`:

```json
{"references":{"left":"reference-left.json","right":"reference-right.json"},"rows":[{"name":"neutral","file":"neutral.json","command":{"flexDeg":0,"twistDeg":0}},{"name":"neutral-repeat","file":"neutral-repeat.json","command":{"flexDeg":0,"twistDeg":0},"repeatOf":"neutral"}]}
```

Each reference is an **actual neutral render** with these fields:

- `positions`: flat world XYZ of combined limb ROI + band + fixed hand, in stable order.
- `normalsWorld`: actual shader-equivalent world normals in the same order. Skinning uses the actual shader skin linear transform followed by model normalMatrix. Every sample must also include these for the0.05° endpoint shading-continuity check.
- `index`: flat triangle indices; `regions.bandFaceIds`, other region IDs and ROI bounds for interpretation.
- `seamPairs: {body:[[a,b],...], hand:[[a,b],...]}`: explicit corresponding endpoint vertices in the combined index space.
- `weldPairs` if available: declared source duplicate vertices; never inferred from bent geometry.
- `rigidHandVertexIds`: hand region whose shape must stay fixed, excluding deforming bridge.
- `dbWorldPositions`: stable-order actual dumbbell vertex positions, including handle and both plates.
- `handMatrixWorld`, `forearmMatrixWorld`: proper bone-world matrices,16 numbers,column-major.
- `frameConventions.longitudinalHandLocal`, `.palmarHandLocal`: explicit axes associated with the exported hand matrix.
- `capturedAt: "scene.onAfterRender"`, `sourcePins`.

Each sample:

```json
{"capturedAt":"scene.onAfterRender","command":{"flexDeg":30,"twistDeg":0},"sides":{"left":{"positions":[],"dbWorldPositions":[],"handMatrixWorld":[],"forearmMatrixWorld":[]},"right":{}},"restoreCheck":{"positionsNormalsExact":true,"boneTransformsExact":true,"cacheExact":true,"hashes":{"before":{},"after":{}}}}
```

Actual geometry/matrices must be captured inside `scene.onAfterRender`, while temporary render-time wrist transformations are still active. `restoreCheck` is sampled after the outer renderer returns. Hash dictionaries should contain nonempty identities for compared position/normal/cache/bone-state buffers. With booleans alone, the checker explicitly labels restoration as runtime assertions, not independent hash evidence.

`command.flexDeg/twistDeg` are requested targets. A diagnostic pose solver may keep separate `diagnosticPose` authored inputs and convergence data; these never replace actual matrix measurements in QA. Missing normals in older captures are `notMeasured`, not assumed smooth.

The complete requested neutral-relative rotation is `R(cross(longitudinal,palmar), flex) * R(longitudinal, twist)`, with zero sidebend. The checker reports total swing, signed out-of-flex-plane angle and the full quaternion orientation error, and requires the latter within1°. Matching flex and twist separately does not establish the requested orientation. The out-of-plane sign follows the declared axes, and is not automatically an anatomical radial/ulnar label.

`diagnose.py` can add an exclusive-create supplemental report to an existing QA result: `python -B tools/body-v3/webxr-wrist-join-r1/diagnose.py CAPTURE_DIR --qa EXISTING_QA.json --recipe RECIPE.json --output NEW_SUPPLEMENT.json`. It independently measures full orientation and localizes existing failed faces to recipe rows, checking the face/vertex mapping explicitly. It does not rerun or replace geometry evidence.

Include zero-flex samples for each twist used, plus repeated neutral and preferably one repeated nonzero pose after other poses. Reference geometry and source hashes remain fixed for the whole grid. ±30/±60 belong to the primary group;75° is separately reported stress. Missing repeat/restoration evidence is never invented.

Run: `python -B tools/body-v3/webxr-wrist-join-r1/check.py CAPTURE_DIR --output NEW_REPORT.json`.
