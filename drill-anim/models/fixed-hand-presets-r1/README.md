# Fixed hand baseline 0.1.0-r1

Local, unreviewed comparison candidate. Not a production recipe.

`loader.mjs` verifies and installs fixed grasp-32mm, support, relaxed and
assist poses on the corrected symmetric r2 body. Its runtime performs no
contact fitting. Support calibration is an offline authoring step.

This package preserves the legacy-mesh baseline while scene-specific hand
meshes are evaluated. The four final roles need not share this topology or
rig. The baseline is not a claim of natural wrist flexion or final hand
appearance.

Initialize `training-human-v3-armfix-r2`, then call `install(page)` and use
`select(spec, {left, right})`. Existing frozen source and production recipe
are unchanged. Diagnostics and limitations are recorded in
`docs/body-v3/hand-presets-and-wrist-research-20261028.md`.
