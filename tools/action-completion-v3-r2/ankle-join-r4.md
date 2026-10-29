# Ankle connector r4: explicit seam topology (candidate)

Runtime source: `ankle-join-r4.mjs`; API `window.__ankleJoinR4`. r3 and the frozen body model remain unchanged. r4 retains r3's quintic connection and bounded contour fairing; this revision fixes its topology-welding defect.

## Reproduced failure

Both actual r3 GPU probes stopped before the first PNG with `Ankle corrected seam opened`. Spatial keys made by rounding each coordinate to a micrometre incorrectly split two explicit seam pairs into different fairing neighborhoods. Left body15018/limb22923 separated by3.704mm and right body21952/limb22959 by3.476mm. Source seam distance was only submicrometre; falling on opposite rounding-cell boundaries is sufficient to cause this error.

The old `ankle-join-r3-cpu-probe.mjs` independently exported changed vertex positions but retained the baseline's cached `seams` field. Its shoe-crossing check was valid for that ROI, but it did **not** verify the new seam positions. The synthetic runtime tests also used identical coincident topology and failed to expose a split body/limb neighborhood. Thus the earlier CPU evidence was insufficient, and r3 is rejected. Do not use cached seams in r2/r3 CPU exports as corrected-geometry evidence.

## r4 correction

- Every one of the56 known body/limb seam pairs explicitly shares one contour-fairing node, regardless of coordinate quantization.
- Other coincident skin/UV copies use adjacent spatial cells and an actual distance comparison, not key equality alone.
- Both meshes receive their target positions first. Explicit pairs then share a world-space target in the **same update**, before posed face normals are accumulated.
- Pre-sync mismatch must remain below the unchanged0.01mm gate. Synchronization therefore only removes floating-point discrepancies; it cannot conceal a millimetre-scale fairing mismatch.
- Render hooks and position/normal buffers restore exactly, including failure paths. Shoes, shoe details, bones and weights remain unchanged.

## Verification

`node --test tools/action-completion-v3-r2/ankle-join-r4.test.mjs`:3/3 passed.

`ankle-join-r4-captured-test.mjs BASELINE_DIR FAILED_LIVE_JSON OUTPUT_DIR` reconstructs captured source meshes and actual bone transforms in a CPU Three scene and invokes the real runtime install/update functions. It tests **both** baseline rest geometry and the rest geometry inside the failed live r3 report. On both bear and bridge, r3 fails all three frame poses for each fixture; r4 passes them. Render-buffer restoration is asserted after every success/failure. New exports recalculate all seam world positions/gaps from the changed mesh, and set `cpuReplay.actualGpu:false`.

Runtime replay output: `F:/PoseHub-v2-production/ankle-review-20261029/{bear,bridge}-join-r4-cpu/`. Bear maximum pre-sync discrepancy is0.0000943mm; post-sync is0 in this CPU scene. Both actions' three poses have zero skin/shoe noncoplanar crossing pairs on both sides in the fixed audit ROI. These checks do not establish visual quality or absence of every self-intersection. Actual GPU and user review remain required.
