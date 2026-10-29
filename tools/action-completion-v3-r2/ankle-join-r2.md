# Shared ankle contour connector r2 (candidate)

`ankle-join-r2.mjs` is an independent, opt-in runtime adapter for armfix-r2. Frozen model files and r1 are unchanged. It exposes `window.__ankleJoinR2` and the same `install(page)`, `sample`, `detach`, and diagnostic contract as the r1 experiment.

## Why r1 was rejected

Actual bear/bridge pictures showed an anterior bulge, a stepped proximal join, and a tongue-adjacent skin lip. The bounding ellipse replaced an irregular source contour, displaced skin by up to 52.6 mm, and introduced 130/132/130 noncoplanar skin/shoe triangle crossings at bear frames 0/60/120. Closed 56-pair seams alone did not make that surface acceptable.

## r2 change

Each source vertex retains its real radial contour, including asymmetry. There is no bounding ellipse, quantile radius, shoe enlargement, or radial normalization. A transported Hermite connection distributes the foot/shin bend between ankle-relative heights +14 and +185 mm. A 30%-wide quintic displacement window at both ends leaves source position and first/second displacement derivatives unchanged at the boundaries. Skin below +14 mm remains unchanged, preserving the irregular fixed-foot shoe contact. The neutral mapping is identity. The skin normal pass uses the actual Three skin-normal transform and joins the original 56 body/limb seams.

The module changes temporary render-time position/normal values only. Bones, weights, shoe/details geometry, source topology, source files, and render hooks are restored/preserved. This preserves the contour rather than constructing a new anatomical mesh; actual pictures remain the deciding gate for visual quality.

## Evidence, 2026-10-29

- `node --test tools/action-completion-v3-r2/ankle-join-r2.test.mjs`: 2/2 passed (math endpoints/tangents and actual Three synthetic runtime restore, rigid shoes/bones, source seams, error cleanup).
- CPU kernel replay of captured actual bear and bridge matrices at frames 0/60/120: unchanged below-collar skin and shoes; crossing audit found 0/0/0 pairs for each action in the same neutral-selected left ankle ROI. Largest displacement from baseline: bear 33.20 mm, bridge 20.25 mm.
- CPU exports: `F:/PoseHub-v2-production/ankle-review-20261029/{bear,bridge}-join-r2-cpu/`.
- `ankle-crossing-audit.py` tests noncoplanar triangle-edge crossings. It is not a closed-solid, containment, self-intersection, coplanar-overlap, or visual-approval proof.
- GPU actual-render seam, normal, bilateral anatomy, shoe contact, and user acceptance remain pending. No production default should be changed based on CPU evidence alone.
