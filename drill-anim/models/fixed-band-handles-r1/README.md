# Fixed handled resistance band candidate

`h-band-biceps-curl-r6` changes the prop to a **handled resistance band**. The 32 mm grip is the exact shaft primitive, including its node transforms, from each side's frozen accepted dumbbell fixture. Plates are omitted. Frozen hand, wrist, body and dumbbell files are not changed. An external U-shaped frame connects the shaft ends to a band socket 100 mm behind its canonical centre.

The original stance, foot anchors, timeline, hand rotations, camera and QA are unchanged. This is a candidate awaiting actual-render checks and user review, not a direct thin-band grip.

## Integration

1. Install the fixed hand/wrist correction stack with dumbbell display disabled.
2. Import `tools/action-completion-v3-r2/fixed-band-handles-r1.mjs` and call `install(page, source.actionCorrective)` before camera fitting.
3. Inspect `window.__fixedBandHandlesR1.last` after every render. `drawId` must advance and `completed` must be true; each side reports its actual connector, foot anchor, hand matrix and hand clearance.

The module wraps `__fixedWristCorrectionsR1.gate.target`. It runs after the wrist wrapper has established the actual hand pose and before the inner render. It substitutes the band's geometry only during that draw and restores the original geometry in `finally`, including on error. Existing wrist/bone FNV restoration assertions remain in force. It neither invokes `dHandle` nor bakes or changes the fixed grasp.

`verify()` checks this component's LF-normalized source pins; `payload()` additionally verifies the frozen wrist package, hand JSON and original fixture GLBs. `install(page, descriptor)` rejects incompatible descriptors. Detach restores only this module's hook and owned resources.

## CPU evidence and remaining boundary

Run `node tools/action-completion-v3-r2/test-fixed-band-handles-r1.mjs <capture.json> <report.json>` against the retained r5 attempt02 capture. Both sides are checked independently over its 241 samples, using recorded actual-render quaternions. Their origins come from pre-render wrist/ankle joint records; the live hook instead uses actual matrices and checks the authored offset agrees with the connector to 0.00001 mm.

The check uses segment/triangle distances against every fixed hand triangle and subtracts the full band radius. It also checks new frame/socket clearance, exact loop closure, unchanged source motion and prop geometry restoration on normal/throwing draws. It is a sampled CPU result, not continuous-time, body-wide, GPU visual or user acceptance. Existing accepted shaft/hand contact is preserved rather than claimed to be intersection-free.

Before acceptance, render close views at frames 0 and 54 plus the full loop; check both grips, socket direction, frame against forearm/body, foot anchors and camera fit. Do not silently change the handle or hand if any check fails.
