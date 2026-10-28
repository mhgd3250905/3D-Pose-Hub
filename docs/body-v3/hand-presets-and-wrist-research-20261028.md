# Fixed hand presets and wrist correction — 2026-10-28

This is a chronological research log begun in `codex/action-inventory-20261028`.
Early candidates below retain their original unreviewed status. The fixed dumbbell
grip and r4 wrist attachment were subsequently accepted by the user; see the final
acceptance section and [current delivery record](webxr-hand-wrist-delivery-20261028.md).
No production recipe, existing published media, App, or SDK is replaced.

## Scope and selected design

Use four named roles: grasp, support, relaxed, and assist. The user explicitly
allows different meshes for different scenes. A shared topology or rig is not
a requirement. Unify visible dimensions, material and wrist attachment;
author or bake the selected shapes once and select fixed data at runtime.
The corrected legacy source remains a comparison baseline, not a requirement
for every final shape. For grasp, prefer an already authored cylinder-grip
mesh; a licensed fist adapted around a shaft is the fallback.
The action remains responsible for wrist direction, contact position and prop
dimensions. A 32 mm grasp does not certify arbitrary handle diameters.

Wrist flexion/extension is a separate deformation problem from finger shape.
Matching seam vertices does not prove that a bent wrist retains a natural
cross-section. Forearm axial twist sharing does not fix flexion collapse.

## Current hand source

`drill-anim/models/hands-native-c1r2-symmetric-r1/` preserves the frozen c1r2
left geometry, rig, weights, topology, and 66 seam vertices. It repairs the
right-hand scale omission traced to the single-line conditional in the
historical `tools/body-v3/hands-c/build_c.py`.

The new CPU audit measures tip-to-origin lengths of 159.0049 mm left and
159.0047 mm right (previous right 186.5396 mm). Palm/finger mirror deviation is
at most 0.0026 mm. The original asymmetric wrist zipper remains, with a full
mesh mirror deviation up to 3.3444 mm. These are rest measurements, not bent
wrist acceptance. Construction provenance and immutable source pins are in
the new model directory.

The r2 body loader initializes this source directly, with hand scale 1 and
the already corrected upper-arm/forearm lengths. It retains P1/P2/P3/L1/L2;
P4/P5 body appearance migration remains outside the hand acceptance claim.

## References reviewed before wrist implementation

| Reference | Evidence and applicability | Boundary |
| --- | --- | --- |
| User's wrist trainer | `E:/AII/ugk-wrist/wrist_rehab_assistant/docs/design/wrist-training-videos.md` points to `E:/AII-3D/3D-Wrist`. The latter's `src/hand-phone-three.fragment.html`, `docs/DEBUGGING.md`, README and HANDOFF describe a local quintic Hermite wrist-band correction, inverse current LBS write-back, stable grasp, and exact neutral restore. Latest README/HANDOFF record user approval of both directions; its shorter AGENTS introduction has older wording. | Read-only reference. Its dimensions, asset, joint names and captured bind cannot be copied into PoseHub. No operation on the wrist App. |
| [Blender Rigify current source](https://github.com/blender/blender/blob/main/scripts/addons_core/rigify/rigs/limbs/arm.py) | Current Blender repository, GPL-2.0-or-later. Separate wrist/palm pivot control is a useful design reference. [Project documentation](https://docs.blender.org/manual/en/latest/addons/rigify/index.html). | Control-rig generation does not by itself make deformation natural. No GPL code copied into runtime. |
| [MPFB2](https://github.com/makehumancommunity/mpfb2) | [License](https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md): program GPLv3, core model/rig/pose assets CC0. [FK grip controls](https://static.makehumancommunity.org/mpfb/docs/rigging_posing/rig_helpers.html) match the fixed authoring workflow. | Blender helper rig is not a drop-in replacement for this 52-bone skeleton. No assets imported. |
| [Blender Armature](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html) and [Corrective Smooth](https://docs.blender.org/manual/en/4.2/modeling/modifiers/deform/corrective_smooth.html) | Preserve Volume and local corrective deformation are established alternatives to plain linear blending. Corrective Smooth can lose volume; boundary pinning and affected-vertex groups matter. | Global DQS is not selected just because it exists. Three runtime and existing shaders need explicit compatibility. |
| [MANO license](https://mano.is.tue.mpg.de/license.html), [SMPL-X](https://github.com/vchoutas/smplx), [MB-Lab](https://github.com/animate1978/MB-Lab) | Reviewed for pose-corrective concepts. MANO/SMPL-X have research/noncommercial restrictions; MB-Lab is archived and has distinct code/database licensing. | Not selected as replacement assets or copied implementation. |

Online maintenance check on 2026-10-28: Blender repository activity dated
2026-10-28; MPFB2 default-branch activity dated 2026-10-24. The older Blender
add-ons mirror and MB-Lab are archived. Repository activity is not a claim
that a specific wrist implementation changed that day.

## Evidence and open gates

Outputs are under
`F:/PoseHub-v2-production/action-completion-v3-20261028-r1/qa/hand-presets-r1/`.

- `preview-r2`: original fixed presets; 17 curl samples passed rod checks and
  14 pose meshes passed limited triangle/self-intersection and seam checks.
  This did not check finite dumbbell plates or bent-wrist shape.
- `preview-r3`: support calibration refined against actual weighted skinning;
  each distal pad minimum is about 0.35 mm above the support plane. Adds light
  wall touch and single-hand support fixtures. This is a candidate measurement.
- Finite dumbbell inspection exposed a missed axial placement issue: the old
  infinite-cylinder fit left one plate overlapping the hand. Translating the
  prop centre along its own axis preserves rod contact; a separate finite
  plate check is required after centring.
- Wrist tests must compare baseline/candidate at positive and negative bend
  angles, include twist-sharing configurations, and sample the exact render
  state. The inherited r5 twist wrapper changes bones only while rendering.
- Final acceptance requires actual image review, local band/seam continuity,
  protected finger/forearm positions, no accumulation and exact neutral
  restore. No claim of full-library or release acceptance follows from these
  representative checks.

## Latest concrete results and rejected attempts

- `grip-centered-renderstate-r5`: 17 actual render-state samples pass finite
  shaft/plate checks. Worst plate clearance is 12.854 mm; endpoint loop and
  fixed local contact checks pass. This corrects the old infinite-cylinder
  assumption but does not establish the preferred appearance of the hand.
- `wrist-baseline-share0-r1`: positive 60-degree bending reduces some wrist
  triangles to about 3–4% of neutral area despite matching seam vertices.
- `wrist-candidate-share0-r1`: the first local corrective restores geometry
  exactly after rendering and preserves seams, but introduces additional
  inner-wrist collapse and intersections at some angles. Rejected as a final
  candidate. Root causes include inner swept-section compression and a hard
  influence cutoff near the thumb base. New work must improve the measured
  geometry, not merely the outer silhouette.

## Ready-made asset selection

Latest user selection (2026-10-28): after viewing actual Three.js/WebXR
generic-hand and MPFB hm08 source previews, the user prefers the WebXR hand
appearance, conditional on satisfactory grasping. This supersedes Ultraleap
as the primary hand candidate. It does not approve a grasp, wrist attachment,
whole-body replacement, merge or release.

The selected assets are the exact left/right GLBs from
`@webxr-input-profiles/assets@1.0.20/dist/profiles/generic-hand/`, each with
1,360 render vertices, 2,314 triangles and 25 flat WebXR joint nodes. The
package README explicitly licenses the assets under MIT. Raw files, hashes,
license and original-pose previews are preserved in the external
`official-model-previews-r1/source/` folder.

Meta IWER provides an authored `grip` pose described as a power grip around a
4 cm handle, tuned against generic-hand. This is the first grasp reference
to test. A 32 mm diameter was an earlier local baseline choice, not a user
requirement. The native 40 mm pose should be tested before creating a size
variant. Upstream pose data alone does not establish contact or collision
acceptance on the selected baked mesh.

- [Robin Lamb rifle and hands](https://opengameart.org/content/low-poly-fps-rifle-and-hands)
  is a downloadable CC0 posed gripping mesh. Its two hands contain only about
  120/128 triangles, so it is a style reference rather than a selected final
  replacement.
- [MakeHuman system poses](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_poses.html)
  lists `fight03` and `fight04` as CC0. The actual BVH files contain complete
  authored finger rotations. They are pose assets, not finished hand meshes;
  they require application to the compatible source skeleton and baking.
- The user's already reviewed Ultraleap hand in `3D-Wrist` is also being
  assessed as a distinct grasp mesh. Its original source/license and fixed
  grip must be checked before any PoseHub copy is selected.

### WebXR fixed grasp result, 2026-10-28

The exact upstream reference and its source-rest adaptation were tested and
rejected for finger intersections. A bounded, offline fixed-pose authoring
pass now provides a 25 mm cylindrical-grip display candidate at
`webxr-grasp-r1/complete-grip-25mm-symmetric-r2/` under the external hand QA
folder. It keeps the original left asset geometry, inverse binds, weights,
joint lengths and CMC position. The right static hand is an explicitly
declared reflection of that left result, with reversed triangle winding:
the source GLBs' shapes are symmetric but their joint locations differ by
up to 7.392 mm, so independently posing both original rigs was unsuitable.

Independent final checks find zero hand self-intersections, zero coplanar
overlaps and zero finite-cylinder penetration for both hands. Exact mirrored
positions, normals, indices, masks and shaft frames pass provenance checks.
Surface gaps to the shaft are index 0.200 mm, middle 1.660 mm, ring 0.528 mm,
little 1.314 mm and palm 1.452 mm; thumb-to-index opposition is 0.395 mm.
The strict 1 mm all-finger/palm contact checks remain **false**. This is a
static visual candidate with small clearances, not a verified physical clamp.

Actual GPU-rendered views preserve the selected appearance and place the rod
inside the hand's grip opening. No further parameter search is warranted
solely to satisfy an arbitrary clearance threshold. User appearance acceptance
and body/wrist attachment remain pending; the production recipe and frozen
model versions are unchanged. The export folder
`webxr-grasp-r1/preview-grip25-symmetric-r2/` contains separate hand-only GLBs
and hand-plus-independent-shaft GLBs, plus images and hashes.

### User-directed template refinement, 2026-10-28

The user accepted the 25 mm candidate's back appearance and requested an exact
saved fallback before attempting a tighter front grip. The snapshot
`saved-grip25-baseline-r2-20261028/` and its ZIP contain 44 verified files;
ZIP SHA-256 is `df4bc47f8fc09a8a23256a49de714d1e1f42ea2208174fe565312c6d41c7020d`.
This saves the fallback only and does not approve body attachment or release.

The user subsequently clarified that the training grips should use the actual
dumbbell handle, then explicitly requested a reusable fixed hand-plus-dumbbell
template. `drill-anim/page/props.js` creates a 32 mm handle, 165 mm long for
the common 300 mm dumbbell; common hexagonal plates have 42 mm circumradius,
60 mm thickness and centres at +/-111 mm along the handle. Some other specs
use 45 mm plates. The 25 mm shape is no longer the target training template.

A 32 mm trial demonstrated collision-free contact, but the user's supplied
pose reference clarified the visual requirement: the handle must sit inside
the palm, with compact fingers curled around it and an opposing thumb. Low
minimum surface gaps alone did not satisfy this requirement; the finger-wrap
trial remained visually too loose. The exact user reference is preserved at
`webxr-grasp-r1/reference-power-grip-r1/user-grip-reference.png`. The active
task is to author that fixed power grip around the real 32 mm handle, preserve
the saved fallback, and judge actual rendered shape before promoting a template.

### Accepted fixed dumbbell grip and wrist adapter, 2026-10-28

The user accepted the compact 32 mm grip appearance with “我觉得可以了”,
then explicitly moved the task to smooth attachment to the existing model's
wrist. The grip shape is now fixed. The saved portable package is
`webxr-grasp-r1/reference-power-grip-r1/template-package/`; the matching ZIP
is `webxr-dumbbell32-fixed-r1.zip`, 1,377,005 bytes, SHA-256
`e3e7102d89836d588414a6cf7231fbdd5e95cb703b46bb588f5eb9d4eaacd72a`.
It includes left/right hand-only and fixed hand-with-dumbbell GLBs, the
`wrist_anchor` interface, source license, provenance and verification evidence.
The original 25 mm fallback remains unchanged.

A declared local corrective moves 74 render vertices (61 source weld groups),
at most 3.553 mm, to remove shaft penetration while retaining the approved
silhouette. Independent checks find no hand self-intersection or finite
shaft/plate penetration. This is an appearance-approved fixed assembly,
not a physical grip solver: the index distal minimum gap is 1.192 mm and the
thumb pad is still 4.683 mm from the shaft. Those limits remain recorded in
the package; body integration and production release are separate states.

The independent prototype at `tools/body-v3/webxr-wrist-join-r1/` installs
over the existing `training-human-v3-armfix-r2` candidate. It clips the forearm
at canonical Y = -40 mm and the new hand at +20 mm, then joins the actual
closed boundaries with a dedicated band. The retained hand and dumbbell
share one rigid transform; only the new band deforms. It never rescales the
accepted hand or changes the frozen production recipe. Removal restores the
original limb geometry and hand visibility.

The first actual GPU pilot (`webxr-wrist-join-r1/gpu-pilot-r1/`) has closed
seams, zero combined-ROI intersections, no severe area/edge collapse, rigid
hand/dumbbell alignment and exact restore/repeat checks at neutral and both
60-degree commands. However the existing forearm twist wrapper produces
about 59.57 degrees of actual flexion and an incidental 2.2–2.35 degrees of
twist. Consequently command-angle agreement is not yet accepted, and the
pilot alone does not establish full flexion/twist coverage. Further actual
angle-calibrated samples and user review of the joined wrist are pending.

### Wrist candidate r4: actual sampled validation

`webxr-wrist-join-r1/gpu-grid-r4/` supersedes the pilot for the current wrist
candidate. The diagnostic driver now solves the complete actual forearm-to-hand
rotation, including zero side deviation, before capture; this corrects the
test inputs without changing the production bones or the frozen twist wrapper.
Independent matrix checks confirm the requested orientations within 0.018°.

The final bridge adds a smooth inner-surface relief only within canonical
Y=0..20 mm, at most 4 mm, with zero value and first derivative at its boundaries.
This removes two local combined-bend failures without changing the fixed hand,
dumbbell, source forearm or endpoint positions. Current runtime SHA-256 is
`731a3db458d639ed1f7597b956896874170ebb1d1f1b7599540686aaceba34df`.

Actual pinned NVIDIA GPU capture and independent checking pass all 17 primary
rows / 34 side samples: flexion 0/±30/±60°, twist 0/±60°, plus repeated neutral
and nonzero poses. Checks cover combined-ROI intersections, area/edge collapse,
both endpoint gaps and world-space normals, complete orientation, rigid hand
and dumbbell relationship, exact buffer/bone/cache restoration and repeat drift.
The 6 extra 75° stress rows remain **failed** in some cases. This evidence is
limited to the sampled wrist ROI; it is not whole-action collision or production
acceptance. Source snapshots, actual meshes and PNGs remain in the capture folder;
the independent report is `webxr-wrist-join-r1/gpu-grid-r4-independent-qa.json`.

The local read-only review uses the captured meshes with orbit controls and
discrete pose selection, and links actual original-material PNGs, including a
neutral full-body image. Its diagnostic material is explicitly identified and
it does not synthesize intermediate poses. Action-specific integration remains
pending; production sources are unchanged.

### User acceptance of wrist r4, 2026-10-28

After reviewing `http://127.0.0.1:63274/`, the user confirmed:
“可以看起来还不错 我验收通过了”. The fixed grip and r4 wrist attachment
appearance are accepted as the baseline for subsequent action integration.
No further appearance tuning is needed without a new request.

The acceptance is saved separately as
`webxr-wrist-join-r1/user-acceptance-r4-20261028.json`, pinned to the original
candidate receipt and runtime. The original capture, QA and candidate receipt
remain unchanged. The ±60° discrete sample evidence and known 75° stress
failures still apply. This acceptance does not mark all training actions,
whole-body contact, production switching or media release complete.
