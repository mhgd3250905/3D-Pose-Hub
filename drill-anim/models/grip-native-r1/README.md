# Native fixed-bar grip candidate

This independent profile uses the accepted native-r3 mesh, finger rig and wrist transition unchanged. It replaces only the named grip pose and fits a new hand-to-rod frame. The original 32 mm, 16-sided rod, 185 mm pelvic excursion, timing, support props and camera recipe remain unchanged.

Finger flexion uses parallel hinge axes with shallow MCP flexion, avoiding the index/middle crossing of the old pose. All five distal fingertip regions and the palm participate in cylinder contact fitting. Thumb rotation is bounded to avoid folding its root. The fitting objective includes every hand vertex for cylinder exclusion; no vertices or faces are deleted.

`fit.json` is a static fitting result, not moving-pose certification. `tools/human-v2plus/grip-native/fit.py --rest <original-rest.json> --out <new-directory>` reproduces the fit using the fixed native-r3 mesh and rig. Runtime QA is produced by `review.mjs` and the geometry checker. Evidence and final review status are recorded separately; the profile is not a production default or media release approval.

The native source is Blender Human Base Meshes v1.4.1, CC0; source provenance is inherited from the immutable native-r3 manifest. The original hand candidates and grip-r6 remain unchanged.
