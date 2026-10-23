# Native hand candidate 1.0.0-r1

This separately versioned hand replaces the folded rest mesh for the two free-hand review actions only. It preserves the CC0 Blender Human Base Meshes v1.4.1 source palm and finger shape, scales it as one hand, positions finger bones to match that shape, and joins the wrist to the frozen limbs. It does not move the source finger roots onto the old v2 joints or apply the old thenar lift.

Explicit profile: `training-human-v2plus-hands-native`, `nativeHands.version: '1.0.0-r1'`. Use the dedicated `preview.mjs` entry; the current production entry still selects the frozen rc2 model. This candidate is not a new production default. Scope: `h-bent-knee-calf-raise-rr5`, `h-chair-single-leg-hip-thrust-rr6`. Release eligibility and user review remain false. Grip and floor-contact presets have not been accepted and this loader rejects other action IDs.

`manifest.json` pins normalized LF SHA-256 for the new data, loader and build/check tools, and pins the unchanged base manifest. `loader.mjs` checks the base's transitive frozen sources before loading. Existing model manifests and source data are unchanged.

Rebuild into a new directory:

```powershell
python tools/human-v2plus/hands-native/build.py --source <source-work/limbs_pre.npz> --rest <rest/rest.json> --out <new-model-directory>
python tools/human-v2plus/hands-native/check.py --help
node tools/human-v2plus/hands-native/inspect.mjs <rest/rest.json> <new-model-directory/hands-base.json> <new-inspection-directory>
node drill-anim/models/hands-native-r1/preview.mjs drill-anim/specs/h-bent-knee-calf-raise-rr5.js <new-review-directory>
```

The source bundle URL and pinned ZIP SHA are recorded in the unchanged `tools/human-v2plus/torso-base/build.sh`. `extract.py` and `subd.py`, followed by the part of `limbs_a.py` before displacement fitting, generate the intact hand input. Local source/intermediate meshes and preview PNGs are not Git delivery files.

The triangle checker finds strict interior noncoplanar intersections between nonadjacent triangles. A zero count is one geometric check; visual review, full-body intersections and contact validation remain separate. Identity and relaxed 0.2 checks match this candidate's free-hand poses. This does not certify other poses or the entire action library.
