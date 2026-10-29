# Shared ankle curvature connector r3 — candidate

This independent adapter preserves `ankle-join-r1.mjs`, `ankle-join-r2.mjs`, and frozen body sources. API: `install(page)` and `window.__ankleJoinR3`.

## Actual r2 review

Viewed bridge frame0000 outer/frame0060 inner and bear frame0060 outer/mouth. The large r1 bulge was gone, but the bridge proximal contour still had a pointed step and the bear anterior ankle had a clear concavity with irregular folds. r2 does not satisfy the user's requested smooth common connector.

## Geometric changes

- Replaced cubic Hermite plus displacement fade-back with a quintic connection whose centerline curvature is zero at both endpoints. Transported radial-frame derivative is therefore zero there, matching the source rigid foot/shin surface tangent rather than forcing a large correction back through a short blend region.
- Kept actual asymmetric source contours. No elliptical envelope replacement or shoe enlargement.
- Applied bounded, welded skin-only lambda/mu source-contour fairing (32 alternating passes, +0.5/-0.53). Original longitudinal coordinate is fixed. Fixed neighbors remain pinned; the C2-weighted radial displacement cap is4mm, with actual maximum2.977mm on this source. No global volume rescale or mesh translation is performed.
- Skin at/below ankle+14mm remains unmodified; upper endpoint is+185mm. Shared parameters apply to all actions. The shoe mesh, details, bones and weights remain unchanged.

## Design reference

Reviewed maintained Trimesh's Taubin filter and pinned Laplacian design before implementing the small standalone JavaScript filter: https://github.com/mikedh/trimesh/blob/main/trimesh/smoothing.py and https://trimesh.org/trimesh.smoothing.html . Trimesh is MIT licensed (https://github.com/mikedh/trimesh/blob/main/LICENSE.md); no source code was copied and no runtime dependency was added. Its historical coordinate-drift issue, https://github.com/mikedh/trimesh/issues/1070 , informed the explicit fixed-coordinate/pinned-node constraints; this adapter performs no whole-mesh volume rescaling.

## Verification scope

`node --test tools/action-completion-v3-r2/ankle-join-r3.test.mjs`:3/3 passed, including zero endpoint curvature, endpoint positions/tangents, seam closure, unchanged shoes/bones and exact position/normal buffer restoration after a sample error, and pinned/axially fixed bounded fairing with reduced short-wavelength radial noise.

CPU replay of captured actual bear/bridge transforms at0/60/120 gives zero skin/shoe crossing pairs on both sides in the fixed neutral-selected ROI. Source fairing maximum2.977mm; largest posed displacement from baseline43.74mm(bear)/25.40mm(bridge). The latter includes redistribution of the original concentrated bend and is not a shoe or bone movement.

CPU exports are under `F:/PoseHub-v2-production/ankle-review-20261029/{bear,bridge}-join-r3-cpu/`. CPU samples are not screenshots and do not establish visual quality, containment, self-intersection freedom, or user acceptance. Actual GPU views and cross-action review remain required. r3 is not a production default or an accepted result yet.

## Superseding failure finding

Actual GPU r3 failed before PNG output: `Ankle corrected seam opened`. Re-evaluation of the CPU vertices also found left3.704mm/right3.476mm seam separation. The old CPU export copied baseline `seams` without recomputing it, and the successful CPU checks covered shoes and a synthetic coincident topology, not these actual seam neighborhoods. Rounded spatial keys split two explicit body/limb pairs. r3 is rejected; see `ankle-join-r4.md` and the captured-source runtime regression test. Earlier cached seam fields are not corrected-geometry evidence.
