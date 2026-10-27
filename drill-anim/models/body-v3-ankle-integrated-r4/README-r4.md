# r17 ankle adapter for an initialized v3 model

Status: integration candidate. `install(page)` uses the current v3 instance;
it does not invoke model initialization or construct a new hand rig. It
requires initialized torso/limbs/hands and runs before L2 piece normals.
Disable the three v2plus pieces first by selecting an empty v2plus profile.
The adapter disables the remaining v2plus switch and resets the motion; the
caller then selects the desired full profile, installs the wrist hook, and
applies L2. Base arm-normal repair from the preceding boot is supported.

The adapter derives the ankle r6/r7 changes from the same geometry algorithms
as r17. Since the limbs are already built, it updates the 56 ankle seam vertices
in the existing limb position, normal, skin-index and skin-weight attributes,
using the same rest-world and bind-space calculations as `buildPiece`. It
checks the seam position and bone-name-mapped weights and preserves the limb
attribute objects, hand mesh and bone objects. It then installs the r13/r16
body shader chain and clones only the two r17 double-sided shoe materials.
`verify()` checks the standalone r17 source manifest and this adapter's
separate `manifest-r4.json`; older copied manifests are not used by r4.

The recorded P2→P1 browser smoke is at
`E:/AII-3D/codex-output/body-v3-fixes-20261027/ankle/integrated-after-p2-r4/`.
For the four sampled poses, body and shoe world positions match the recorded
r17 geometry, while limb world positions differ by at most 0.000075 mm; all
four tested index buffers and all 52 captured bone matrices match. During
installation, the 56 seam pairs' maximum world gap is 0.0000511 mm and the
bone-weight difference is zero. Prebuilt limb and hand mesh/attribute/bone
object references are preserved. Five of the ten same-camera PNGs are byte
identical and the other five differ in 1, 1, 5, 1 and 7 pixels respectively.
These measurements do not prove full-model equivalence or behavior after L2;
separate actual attribute and combined-scene validation remains necessary.

Installation failures may leave an in-memory scene partially modified. The
scene is marked failed and must be discarded; retry on a fresh page rather
than applying the adapter again. No persisted asset or action is edited.

The minimal adapter-specific source set is `install.mjs`, `material-r1.mjs`,
`ankle-r6-fit.mjs`, `ankle-r6-shape.mjs`, `ankle-r7-shape.mjs`,
`manifest-r4.json`, and this README. The existing standalone r17 source chain
and manifest are still required by verification. `node
tools/body-v3/ankle-r17/test-integrated-material-r4.mjs` is an offline
structural check, not a GPU or full-scene test.
