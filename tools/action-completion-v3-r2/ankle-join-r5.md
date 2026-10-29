# Ankle connector r5 — measured section candidate

`ankle-join-r5.mjs` is independent; r4 and all frozen model files remain unchanged. API: `window.__ankleJoinR5`.

## Located source defect

Projecting actual bear-r4 frame0060 source vertices into its outer camera places the remaining visible anterior crease at ankle-relative heights about-2 to+32mm. Representative Coach_Body IDs:15991(+6.13mm),15646(+9.83mm),15895(+13.93mm),16055(+15.22mm),15136(+25.63mm),16177(+32.14mm). Thus r4's+14mm protected-skin boundary preserved part of the pre-existing notch; its local3mm fairing could not reconstruct that region.

## Shared geometry recipe

- Connection anchors now-18mm and+185mm along the neutral shin axis. Skin lower than-18mm remains fixed. Shoes, details, skeleton and weights remain fixed.
- Intersect actual source triangles with41 transverse planes and64 angular rays per plane. Transition from source body to replacement limbs around the measured56-pair seam height. Keep these measured non-elliptical, asymmetric contours.
- Fair the measured radius field along height (12 five-tap passes) and angle (4 three-tap passes). Apply the **difference** to each original radial coordinate, capped at8mm and faded with a C2 window at the endpoint planes. Actual maximum neutral contour change on this source is4.54mm.
- The r4 explicit seam topology and same-update seam position/normal synchronization are retained. Quintic connection endpoint curvature remains zero. Curvature stress now uses each measured section's actual maximum radius instead of applying the widest forefoot radius to every section.
- Shoe contact is assessed by actual posed bilateral triangle crossings; changing the lower skin region is no longer prohibited solely because it contains a pre-existing defect. Shoes are never enlarged or displaced.

## CPU evidence

`node --test tools/action-completion-v3-r2/ankle-join-r5.test.mjs`:3/3 passed. Tests cover endpoint behavior, actual runtime restoration/seams/rigid structures, and measured-section dent relief while retaining asymmetry and exact boundary contour.

`ankle-join-r5-captured-test.mjs` runs the actual install/update code on both captured baseline rest and the live-rest fixture from the failed r3 render. Bear and bridge at0/60/120 pass; recalculated56 seams are0 in this CPU scene. Both sides' skin/shoe crossing audit remains0/0/0. Actual bear t2 radius-based curvature bound is approximately0.488. Maximum posed displacement from baseline is about26.0mm in bear t2 and15.24mm in bridge t0; this includes the shared bend redistribution.

The CPU projected-triangle comparison `F:/PoseHub-v2-production/ankle-review-20261029/r5-cpu-shape-comparison.png` shows reduced upper transition and anterior notch versusr4. It uses approximate visible-region cuts and plain face lighting; tiny cut-boundary artifacts in that diagnostic plot are not actual rendered seams. It is explicitly **not** GPU/material acceptance. Actual bear t2 and bridge t0 GPU images are the next gate.

Outputs: `F:/PoseHub-v2-production/ankle-review-20261029/{bear,bridge}-join-r5-cpu/`. Visual quality and broader-pose acceptance remain pending.

## Actual GPU key-pose review

Actual `bear-join-r5-key` frame0060 and `bridge-join-r5-key` frame0000 were reviewed in outer/inner/mouth cameras (6 closeups). The bridge anterior bulge/proximal step are no longer evident. Bear's external contour and inner bend are continuous, with the previous chunky pinch substantially reduced. Shallow local grooves and toon tonal bands remain near the shoe collar; this is not a promise to remove every skin crease or tonal edge.

Independent actual-vertex audit: maximum56-pair seam gap0.0000763mm(bear),0.0000623mm(bridge); both shoes/details and bone matrices are unchanged, weights identical, below-18mm skin unchanged, bilateral noncoplanar skin/shoe crossing pairs0. Each directory contains `independent-audit.json` and `independent-visual-review.json`.

Decision: key poses are suitable to proceed to full-loop and shared standing/pike regression and then user review. **No whole-loop or user final acceptance is implied.**
