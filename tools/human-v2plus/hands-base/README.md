# hands-base — opt-in `v2plus.hands:'base'` (needs `limbs:'base'`)

Goal: opt-in `hands:'base'` (needs `limbs:'base'`): the Blender Human Base Meshes v1.4.1 realistic-male hand (CC0) retargeted
onto the existing v2plus finger rig (training-human-v2plus-hands.json joints), so the 5 named hand poses keep working.

Build: `tools/human-v2plus/hands-base/build.sh [workdir]` (after limbs-base/build.sh; numpy/scipy, < 30 s; via /workspace/bin/heavy)
-> drill-anim/models/training-human-v2plus-hands-base.json.  Offline looks only (in the work dir):

    PYTHONPATH=/workspace/work/pylib:tools/human-v2plus/torso-base:tools/human-v2plus/hands-base:tools/human-v2plus/limbs-base \
      python3 tools/human-v2plus/hands-base/hands_a.py            # -> hands_fit.npz
      python3 tools/human-v2plus/hands-base/sketch.py out.jpg grip-bar palm-floor

Findings:
- limbs_fit.npz has a broken hand (its low-frequency skin fit spreads the fingers and collapses the index into a stub); the
  hand must come from limbs_pre (intact, fingers together), faded into limbs_fit only near the wrist ring.
- Fingertips = true geodesic local maxima from the forearm cut (5 cm geodesic suppression + 1.5 cm local-max test; a plain
  Euclidean suppression picks finger webs). Thumb = shortest reach; fingers by local z.
- Base/v2 hand scale 0.757 (v2 hand is larger); palm scaled 1/0.757 about the wrist, faded to identity at the ring.
- Fingers retarget well (knuckles, tendons, nails; grip-bar curl looks right). Open: the thumb turns ~60 deg from the base's
  adducted thumb to the v2 abducted one, and linear blending folds the thumb web / thenar (visible in sketch.jpg). Next step:
  re-pose the base thumb with a rotation field (per-vertex slerp over the thenar) or fit the thumb web to the v2 hand's web.
- Weld (hands_b.py): right = mirror; cut at the limbs' Coach_Body wrist rings, arc-length snap (angle interpolation folded the
  zipper fans over the jagged cut), zipper, ghost-ring fairing against the limbs piece -> 0 folded / flipped zipper faces.
- M8: thenar.py lifts the thenar to the hypothenar pad line; hands_b shares + relaxes the wrist-weld normals across both pieces (seam.ownNormals, limbsNrm).
- Runtime piece bound to Coach_Body's skeleton (finger bones), checks in tools/human-v2plus/hands-poses.mjs; see the M7 section of
  docs/training-human-v2plus-proto.md for results and remaining issues.
