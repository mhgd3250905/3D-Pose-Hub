# Native wrist refinement 1.0.0-r2

Local review candidate for `h-bent-knee-calf-raise-rr6` and `h-chair-single-leg-hip-thrust-rr7`. Explicit profile: `training-human-v2plus-hands-native`, `nativeHands.version: '1.0.0-r2'`. This is not the production default; user review and release eligibility remain false.

The r1 native palm and fingers are retained. The near-wrist width is locally reduced by a smooth field with a maximum 14% factor. Forearm/hand influence transitions continuously from the exact live weld to hand-local x=35 mm, using cubic smoothstep to reduce the steep middle gradient that folded under wrist bending. No runtime deformation patch or pose change is introduced. The r1 finger rig is reused unchanged.

All positions, joint indices, weights and normals at hand-local x>=35 mm remain byte-identical to r1. Live seam positions, joint indices and weights, quantization grid, indices and topology remain identical. Weld normals are recomputed together with the limb normals. Shape changes are limited to the wrist; maximum displacement is approximately 6.08 mm.

Rebuild to a fresh directory (the tool refuses to overwrite an existing candidate):

```powershell
python tools/human-v2plus/hands-native/refine_wrist.py --input drill-anim/models/hands-native-r1/hands-base.json --rig drill-anim/models/hands-native-r1/hands-rig.json --rest <native-source-rest.json> --out <new-model-directory> --shape-reduction .14 --weight-end .035 --weight-curve cubic
node drill-anim/models/hands-native-r2/preview.mjs drill-anim/specs/h-bent-knee-calf-raise-rr6.js <new-calf-review-directory>
node drill-anim/models/hands-native-r2/preview.mjs drill-anim/specs/h-chair-single-leg-hip-thrust-rr7.js <new-hip-review-directory>
```

`manifest.json` pins normalized LF SHA-256 for the assets, loader, preview and refinement/check tools, and the unchanged base manifests. The loader also verifies the base's frozen sources. The current production entry still selects the frozen rc2 recipe; use this candidate's dedicated preview entry.

The geometry checker measures strict interior noncoplanar triangle intersections, excluding adjacent faces after welding topology by source mesh/vertex ID. Zero intersections in sampled frames does not certify every pose, full-body contact, grip/floor presets or library-wide use. Preview output includes sparse full-body frames and both-hand closeups at low and high poses. Prior versions and their evidence remain unchanged.
