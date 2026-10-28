# Armfix r2: fixed symmetric hand integration candidate

This independent r2 entry initializes the short-arm body and the fixed `hands-native-c1r2-symmetric-r1` hand source once. It does not apply the r1 complete profile, replace an installed hand mesh, or accept an arbitrary `handAsset` object. Both arm segment scales and hand scale are 1; existing v3 leg and trunk proportions remain unchanged.

`boot()` reuses the frozen r1 boot/viewer solely to load its unchanged short-arm rig before motion initialization. `applyV3()` owns r2 piece creation, finger graft, P2 fragment, wrist gradient, P1 ankle, geometry-derived L2 normals, P3 shared collar and garment refinement. Normal synchronization reads this candidate's fixed symmetric seam source. Exactly one 30-bone finger chain is required, and initialized or failed pages cannot be reused. Discard the page after any failed installation or detach.

Call `applyV3(page, spec)` with the explicit native profile and base torso/limbs/hands. Optional `handDir` must equal the fixed source ID and `handScale` must be 1. Other apply options are rejected. `nativeHands.twistShare` may be finite in [0, 1]. Runtime identity is exposed as `window.__armfixR2.handAsset` and `handScale`.

P4 hip/knee live normal corrections, P5 shoulder corrective and old contact/neck calibration are **not migrated**. The preserved `transport.mjs` and rest exporter are experimental audit utilities, not installed corrective layers. The old rest exports do not prove the new hand asset or action contact. This profile is unreviewed and not release eligible. GPU/visual and interaction evidence must be recorded separately.

Run `node --test drill-anim/models/training-human-v3-armfix-r2/armfix.test.mjs` for CPU recipe, geometry, source and fail-closed checks. `tools/body-v3/armfix-r2/model-pin.mjs` refreshes this candidate's pins only after reviewing intentional edits; frozen r1/r7 manifests are never rewritten.
