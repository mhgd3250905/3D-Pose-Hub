# Arm rim and guard diagnostic: two fold captures

The v3 no-outfit entry and the full normals-r3 outfit entry were captured in
separate browser sessions, using the same fold pose and elbow camera within
each session. They use different profile assets and hand scale and are not a
before/after pair. Each run compared baseline, rim-off, instrumented control,
guard mask, normal difference, threshold flags, mesh-ID and restored output.
The baseline/control/restored and highlight-before/highlight-control pairs were
pixel-identical; no page errors were reported.

In the elbow crop x245–324 and y170–244, v3 had 2,091 orange-threshold pixels
in the baseline and zero with rim disabled; outfit had 212 and zero. The v3
guard mask had zero hits, consistent with `uV2pOut=0`. In the outfit crop the
existing guard executed on 413 pixels; these did not overlap the baseline
orange-threshold pixels. The orange contribution is therefore attributable to
the rim term in this crop. Dark fragment shapes remain with rim disabled, and
the outfit guard mask overlaps part of that region. Neither observation proves
or rules out intersecting geometry.

The r1 mesh-ID channel is **invalid for identifying a particular mesh**: the
diagnostic inserted per-mesh constants while several materials shared the same
program cache key, so a compiled color could be reused. The observed guard and
rim-off masks use the same expression across those materials and remain useful;
do not use their r1 mesh-ID colors or derived per-mesh conclusions. The r2
diagnostic uses per-material uniforms, with a static two-material same-key
check, but requires a real browser retest before trusting its colors.

The original v3 L2 acceptance requires an additional controlled comparison
with `arm-normals-r1` enabled on the same no-outfit entry. `normal-spot-render-r4.mjs`
prepares both that fold test and the original v3render rest-elbow camera;
neither has yet been run. The visible elbow fold is a natural deformation
unless evidence shows otherwise; distinguish it from isolated edge specks.

Evidence is in `E:/AII-3D/codex-output/body-v3-fixes-20261027/normal-spot-v3-fold-r1/`
and `.../normal-spot-outfit-fold-r1/`. Pixel thresholds are a diagnostic, not
user or full-motion visual acceptance. P4's contact/geometry findings remain
independent of these shader observations.
