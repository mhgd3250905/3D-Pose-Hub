# hands-base (WIP, direction sketch only — not wired into the runtime)

Goal: opt-in `hands:'base'` (needs `limbs:'base'`): the Blender Human Base Meshes v1.4.1 realistic-male hand (CC0) retargeted
onto the existing v2plus finger rig (training-human-v2plus-hands.json joints), so the 5 named hand poses keep working.

Run (offline, numpy/scipy, < 5 s, < 1 GB), in a scratch dir that has `limbs_pre.npz` (limbs stage A **before** its skin fit;
make it by running limbs_a.py up to the `# ---------- displacement fit` marker) and a link to `limbs_fit.npz`:

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
- Not done: wrist-ring weld (reuse limbs_b snap + zipper onto the same Coach_Body wrist ring vids), runtime piece bound to
  Coach_Body's skeleton (the finger bones live only there, not on the tee skeleton buildPiece uses), right hand (= mirror),
  prop interpenetration checks, regions re-bake.
