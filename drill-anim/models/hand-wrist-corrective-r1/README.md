# hand-wrist-corrective-r1

Version `0.1.1-r2`. Independent opt-in candidate on fixed armfix-r2 + symmetric-r1 hands. Not reviewed or release eligible. No frozen asset, rig, hand preset or action is modified.

## Design and provenance

The user's wrist training App points to `E:/AII-3D/3D-Wrist`. Its `src/hand-phone-three.fragment.html:295-397` and `docs/DEBUGGING.md:51-74` implement the previously accepted wrist repair: quintic Hermite centreline, rotated wrist cross-sections, inverse current linear skinning, source-cache neutral restoration. Its final implementation explicitly does not use global DQS. This candidate adapts that mathematical design to Pose-Hub; it copies neither Ultraleap geometry nor donor-scale constants. The donor's actual mesh was Ultraleap GenericHand_Arm (Apache 2.0), whereas Pose-Hub retains its MakeHuman native mesh and original rig. Both sources and their provenances remain separate.

The runtime measures its canonical frame, wrist radius, seam range and mixed forearm/hand influence extent from the installed live pieces in reset pose. It extends the curve proximal end by one measured wrist radius beyond the seam, and distal end by 0.4 radius beyond the hand/forearm mixed-weight range, with a 0.4-radius proximal fade. There is no distal LBS fade: the curve already joins the rigid hand endpoint, and blending back to LBS there introduced compression. Guards reject dimensions outside the existing native hand envelope. These are candidate adaptation parameters, not medical or anatomical claims.

The r1 quintic candidate failed the actual ±75° grid: central curvature exceeded the inner wrist radius and produced folding. Its hard hand/forearm influence cutoff also split the proximal thumb surface. The r2 kernel uses a constant-curvature circular fillet, with equal tangent distances and exact rigid endpoints, plus distributed axial twist in one consistent frame. Compatible proximal finger influences now share the spatial band; the correction is added as a wrist-only delta so the current finger-pose residual is retained. The hand's final world rotation and all bones stay unchanged. Affected geometry spans both `V.hands` and `V.limbs`; paired wrist vertices share their target and combined area normal. All source vertices outside the local band remain unchanged. Normals use face areas in the corrected world surface and reverse the actual Three.js normal skinning transform.

## Render and measurement contract

The frozen r5 wrist twist changes bones only inside `renderer.render`, then restores them. Correction therefore runs from `scene.onBeforeRender`, inside that adjusted state, and remains installed through `scene.onAfterRender`. The outer wrapper restores exact cached positions/normals in `finally`, including exceptions. Prior hooks are chained. Frame output always comes from the source caches, never prior corrected output.

Use `install(page, {enabled:true})` from `loader.mjs` after fixed armfix-r2 initialization. `window.__wristCorrective` (alias `__handWristCorrectiveR1`) exposes `active`, `setEnabled(bool)`, `last`, `config`, synchronous nested-safe `sample(callback)`, and `dispose()`. `sample` renders through the original twist wrapper and invokes its callback while correction and adjusted bones are active; nested sample calls reuse that state. Exporters may alternatively capture in `scene.onAfterRender`.

## Evidence and remaining gates

`node drill-anim/models/hand-wrist-corrective-r1/cpu-test.mjs` uses actual hand/limb assets with a lightweight CPU scene and the real frozen r5 twist wrapper. It covers both hands at -75/-60/-30/0/30/60/75 degrees, exact neutral, paired seams, endpoint constraints, nested sampling, deliberate exceptions and exact source/bone restoration. The source-v2 rest capture is reduced to bone-only `rest-fixture.json`; runtime does not use this fixture. This test is not a GPU or action-contact acceptance check.

Root task owns GPU grid, two-side closeups, posed contact, collision and actual action checks. Full wrist deformation is still candidate work until those checks and user review. Circular section transport is not a physical volume solver; actual support/grasp and moving GPU checks remain necessary.


## R2 numerical evidence

The original r1 package is preserved at `F:/PoseHub-v2-production/action-completion-v3-20261028-r1/work/wrist-corrective-attempt-r1/`. CPU mathematical replay first reproduced the captured r1 GPU positions within 0.00016 mm. The revised circular fillet and continuous spatial mask were then evaluated against all 27 actual reference/baseline pose pairs (both hands, flexion ±30/45/60/75/0 and twist ±60/0). In the explicitly predicted `qa/hand-presets-r1/wrist-cpu-arc-r2/` outputs, minimum ROI triangle area ratios were 0.194604 / 0.195662, no face fell below 0.1, and the independent quality checker detected zero proper nonadjacent wrist triangle intersections in both hands. The finite-difference mapping Jacobian remained positive at sampled affected source vertices (minimum 0.013638). These are CPU predictions, not a new GPU render, limb-intersection certification or restoration measurement. Coplanar overlaps are outside that intersection check.

`replay-research.py --candidate <captured-r1-directory> --baseline <captured-baseline-directory>` records the mathematical replay helper; source snapshots and predicted reports retain their own evidence labels. The live module additionally preserves the current finger-pose residual when adding its wrist-only correction. Actual GPU comparison is the next gate.
