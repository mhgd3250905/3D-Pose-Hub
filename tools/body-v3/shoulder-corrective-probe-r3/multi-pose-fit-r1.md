# Shoulder correction: multi-pose training study

`optimize-grid-r3.py` uses the actual captured per-bone matrices and geometry
for 12 bear and 12 fold time samples, retaining the original skeleton and the
fixed seam/outer-ring boundary. Left and right were optimized separately.
Both runs used radius target 1.25, face weight 500, fold weight 0.25, edge
weight 2, smooth weight 0.2 and a soft 22 mm displacement cap. Each stopped at
the 600-iteration limit without reporting convergence. The cap is a penalty,
not a hard bound.

At full strength on the 12 **training** bear samples, bone-distance p95 is at
most 1.3943 left / 1.3857 right, edge-length p95 at most 1.3768 / 1.3807, and
no original triangle above 0.01 mm² changes normal by over 90°. Predicted peak
world displacement is 22.93 / 22.83 mm. Fold still reaches bone-distance p95
1.834 / 1.822 and edge p95 1.730 / 1.716; right fold has up to two tested faces
with >90° normal change. Face direction alone does not prove inversion.

`project-candidate-grid-r1.py` projects the new offsets through the saved
runtime skin matrices across all 60 captured poses. Before deriving the new
geometry, it reconstructs the actually captured old candidate: the maximum
error over all frames is 0.000119 mm. New positions remain projections; they
have not been installed and sampled in a browser. Running the old provisional
gate on them still leaves the worst bear p95 at 1.697 / 1.694.

`analyze-pose-grid-r5.py` explores a bear-only, smooth two-feature gate. Its
inner and outer widths were chosen using this same 60-sample data: the 12 bear
points receive strength 1, and the four other sampled actions receive 0.
Accordingly the projected bear metrics above hold, while those other sampled
poses are unchanged. This is training-set fitting, not a general action or
pose classifier; unrelated poses can share the same two features. The gate is
not installed in the runtime.

`capture-pose-grid-r3.mjs` prepares an interleaved 60-time-point capture, with
the same resumability, memory and per-stage limits. These times are not the
training timestamps but come from the same five actions; they would test
temporal interpolation, not generalization to unseen actions or real-time
visual transitions. Corrective normals, source-shared seam normals, device and
rendered visual acceptance remain open. The full P5 fix is not complete.

External outputs: `shoulder-grid-left-candidate-r3/`,
`shoulder-grid-right-candidate-r3/`, `shoulder-grid-predicted-candidate-r3/`,
and `shoulder-grid-predicted-candidate-r3-beargate-r1.json` under
`E:/AII-3D/codex-output/body-v3-fixes-20261027/`.
