# training-human-v3-contact r5 (experimental)

Opt-in wrapper over frozen training-human-v3-completed r7. It supplies reviewed side-leg preprocessing and experimental neck and native palm contact, fitting each side independently from that side's geometry and actual finger joint pivots. Not a production default; action, contact, neck and GPU visual acceptance remain pending.

Call boot then applyV3 on a fresh page with modelProfile `training-human-v2plus-hands-native`, base torso, limbs and hands, c1r2 handDir and handScale 1.18. `checkSpec` validates profile, options, neck channels and reviewed side-leg descriptor before base initialization. Installation checks the 22-limb palette matrices plus 52 skeleton bone identities, parent links and local rest transforms, including 30 finger bones.

Calibration requires this effective rest state and changes no motion.reset or profile. The installer restores 52 local transforms, hand pose selection and references on success and failure. Motion system state outside those fields is not a full-page snapshot. On setup failure discard the page; this is not a retryable transaction. `detachGeometryLayers` removes contact and reviewed wrappers before r7 layers. It restores active palm-floor fingers to the former registry pose; base persistent hooks remain, so use a new page for full teardown.

Verify recursively checks frozen r7, rig, side-leg preparation and this layer. Normalization policy is UTF-8 CRLF to LF. This candidate has not been validated by actual GPU screenshots or against all actions.

Each side uses a private palm-floor pose alias; the wrapped setter preserves public `palm-floor` and `cur` semantics. The right pose is encoded for the frozen setter’s right-hand mirror rule. Detach restores the original setter and pre-existing alias values.

For the left pinky only, fitting also considers the distal-segment P10 and a bounded wider second-joint search; its all-vertex penetration penalty remains. The fitting P10 is a model-space estimate across distal vertices and is not the world-space, downward-facing GPU acceptance metric. Per-finger contact and penetration remain pending live verification.
