# Translucent orange-red highlight trial

User requested a slightly translucent, glowing material on 2026-10-29. These two
recipes preserve the prior motion, hands, model and camera and add a surface blend
with opacity 0.48, emission 0.17 and Fresnel contribution 0.25. Body alpha and depth
stay opaque; translucency reveals the original surface shading under the highlight.
Frozen shaders and the original action recipes are unchanged.

Outputs are under `F:/PoseHub-v2-production/remaining32-template-r2-20261028/review-batch01/`:

- Reverse curl: `attempt06-glow`, compared with `attempt04-warm`.
- Zottman curl: `attempt03-glow`, compared with `attempt02-warm`.
- Side-by-side page and provenance: `glow-trial/index.html` and `comparison.json`.

Each preview is 480x480, 12 fps, 96 playback frames and 8 seconds, with 241 actual
render samples. Media decode and 11 focused pipeline tests passed. The first
reverse-curl material attempt (`attempt05-glow`) failed model installation because
the appearance hook preceded model material setup; it remains preserved. The
working hook runs after model setup and before fixed wrist installation.

Material selection is pending user review. No final production or automatic
promotion of this trial to the remaining 30 recipes is authorized by this trial.
