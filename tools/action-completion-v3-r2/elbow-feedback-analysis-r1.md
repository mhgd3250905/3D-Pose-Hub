# L-sit to tuck elbow feedback: candidate diagnosis

User feedback on 2026-10-29 identifies a pinched elbow in `t-lsit-tuck`.
Evidence inspected: `F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight/t-lsit-tuck/attempt03/capture.json`.

The solver elbow angle is left 179.2627 degrees and right 175.0369–175.0399 degrees across the loop. Thus the narrow region is visible with an almost straight arm, not a large elbow-flexion target. Comparing pre-render versus actual-render forearm world quaternions gives an extra axial rotation of left 96.569–97.6765 degrees and right 95.0383–96.1448 degrees. The source recipe uses `nativeHands.twistShare:1`; `drill-anim/models/hands-native-r5/wrist-twist.js` applies this rotation around every render and restores it afterward while retaining hand world orientation.

This creates substantial relative UpperArm/Forearm rotation across a linearly blended skin region. For a half-weight section, a 97-degree relative roll can shrink the perpendicular radius by roughly cos(48.5 degrees), about 0.663. A smooth temporal path or nearly straight joint-angle measurement therefore cannot certify visible elbow volume.

The experimental `elbow-dqs-r1.mjs` preserves local blend volume using the existing tested dual-quaternion math from `ankle-dqs-r1.mjs`. It affects only local UpperArm/Forearm skin, leaves bone transforms, skin weights, hands and support anchors unchanged, recalculates local posed normals, and restores original buffers after each render. It does not confer visual acceptance. CPU tests cover rigid transform math, the actual runtime at 97-degree axial roll, state restoration and the normals-only control.

Run `elbow-probe.mjs` with the current action recipe to compare baseline and candidate at identical frames/cameras. The probe samples geometry during `scene.onAfterRender`, so it includes the temporary forearm roll; ordinary post-render dumps would miss it. No user acceptance, final production or release status has been changed by this investigation.


## Additional validation: flare side hold

For `t-flare-side-hold/attempt05`, the weight-bearing right elbow is 178.0206–178.0235 degrees; its actual-render forearm roll is 144.6169–144.7783 degrees. The raised left arm is 176.739 degrees with about 45.004 degrees of added roll. Thus the same fixed volume-preservation rule needs testing at a much larger support-arm twist; no per-action corrective parameters are introduced.

For an ideal half-weight blend under pure 144.7783-degree axial rotation, the linear-part determinant is approximately 0.09154 and perpendicular radius factor approximately 0.30255. These are estimates, not measurements of an actual vertex matrix. `elbow-probe.mjs` now records the actual weighted-bone-matrix linear determinant as `skinLinearDeterminant` for UpperArm/Forearm mixed vertices in both reported actions. The pinned runtime component remains unchanged. The candidate still requires matched-camera review and comparison of support contacts, bone transforms, weights and out-of-region vertices.


## Pinned component integration and limit (read-only audit)

`joint-corrections.mjs` admits explicit allowlisted profiles, requires manifest version and base-model identity to match, verifies LF SHA-256 for every pinned source, and requires the entry module to appear in that pin set. The `elbow-dqs-r1/0.1.0-r1` manifest fixes both the elbow installer and its shared DQS mathematics dependency. Neither an action-specific deformation parameter nor a silent base-model replacement is used for the two reported elbow cases.

The flare matched-camera probe measured original mixed skin linear determinants down to 0.0648162 on Coach_Body and 0.00263121 on V2P_Base_Limbs. Those measurements include actual binding transforms and differ from the simplified pure-twist estimate above. All captured bone records, original skin weights, pure-bone vertices and vertices outside the local elbow region matched the baseline. Local mixed-band displacement reached 34.7238 mm while the support hand and motion remained unchanged.

This component maps a desired DQS world position back through the existing LBS matrix for rendering. It rejects an absolute full skin-matrix determinant below 1e-10, but that threshold alone is not a complete numerical-conditioning guarantee. Around an exact 180-degree relative twist, half-weight LBS can become singular or very poorly conditioned; Float32 writeback precision and the shortest-quaternion branch would need dedicated validation. The current evidence covers the observed roughly 97-degree L-sit and 145-degree flare render-time forearm rolls, not arbitrary extremes or a future model. Do not silently clamp a problematic pose or certify a new model from this result.

The runtime debug tag remains experimental while the separately pinned component manifest is `0.1.0-r1`; user approval and release eligibility remain false. Full-loop flare candidate review follows capture completion.
