# Action-specific native hand poses r1

Candidate only. Frozen hand meshes, weights, shared poses and the native setter are unchanged.

The spec carries one required `actionCorrective` descriptor: `id`, `version`, `required:true`, exact `specId`, `basePoses` by side, and `poses` containing partial native joint quaternions. Quaternions use the existing left-native convention; the original setter mirrors the right side. Supported revisions are explicitly listed in `SPEC_IDS` and the manifest.

Call `verify()`. After recipe hand adaptation, call `prepare(spec)` and use its returned clone **before** writing the effective snapshot. This validates the action and base pose, then puts deterministic side-specific aliases into `v2plus.handPose`. Include the module, manifest and manifest source pins in the capture fingerprint. After native rest presets have been installed, call `install(page, preparedSpec.actionCorrective)`. This creates aliases without overwriting the source preset or wrapping the setter. Do not substitute an original spec after preparation.

Inside every actual-render sample, call `window.__nativeActionHandPoseR1.verifyApplied()`. It checks selected aliases, every native finger quaternion, unchanged base/alias data and unchanged setter identity. Missing or unapplied aliases throw; mounting the module alone is not evidence that its pose was rendered.

The three Node tests cover deterministic snapshot preparation and source immutability, rejection of invalid or unbound descriptors, actual quaternion verification rather than alias names alone, right-side mirroring, and atomic failure before alias publication. GPU contact and visual acceptance remain separate.

Biceps r7 retains the calibrated r6 palm position and gives its left thumb a -22 degree proximal extension with distal joints at rest. This is a trial to resolve r6's measured thumb penetration, not an approved hand pose. Half-kneeling r6 supplies its own independently measured quaternions. Never transfer acceptance between these two actions.
