# v3 joint audit (diagnosis only, nothing changed)

Setup: v3 body with c1r2 hands (handScale 1.18), rendered with CPU skinning in headless Chromium.
- States:
  - rest;
  - a-deep-squat-r3 at its lowest frame (pelvis 0.31 m);
  - h-bear-plank;
  - a-seated-fold;
  - synthetic neck poses from rest: flex 40°, extension 35°, rotation 65°, split neck 50% / head 100%.
- Why synthetic neck poses: no spec drives the neck. In real actions the neck→head axis is only 7.5–12.5° from the torso axis.
- Views: front, back, left and right close-ups (`joints/*.png`, sheets `joints-sheet-*.png`, overview `joints-audit.png`).
- Metrics: `joints-metrics.json`, `joints-seams.json`.
- Attribution: the same probe on v2 (v2plus + native-open, `joints-v2/`) gives identical seam and penetration numbers at rest. **None of the issues below come from the v3 reshape; they are all in the original v2plus/glb meshes.**

## Ranked issues

| # | Joint | Severity | Measurement | Cause | Proposed fix | Effort |
|---|---|---|---|---|---|---|
| 1 | Ankle ↔ shoe collar | **High** (visible in squat/plank) | Seam gap is 0 mm in every pose. 106 shoe-collar verts (y 0.08–0.11) lie inside the ankle skin. Depth up to 6.7 mm at rest, 9.2 in deep squat, 9.4 in plank. Skin bulges over the collar with jagged edges (squat front/back). | Original Coach_Body ankle and the shoe are skinned independently. On dorsiflexion the shin/ankle skin swings out through the collar. | Push ankle/foot skin inside the collar band in rest with an inward offset along the shoe-collar SDF, and blend the band's weights toward leftFoot like the shoe. Alternatively raise the collar / add a sock band. | 0.5–1 day |
| 2 | Head ↔ neck (Toon head opening ↔ Mesh001) | **Medium**, high if the neck gets animated | Rest gap 1.7 mm (max 3.3). Under 40° flex: gap p50 15 mm, max 31 mm, normal break 33–50°. Extension 35°: max 25 mm. Rotation 65°: max 12 mm. Shard-like artifacts behind the jaw/ears. | Original: the head mesh follows the head bone rigidly, while the neck skin (Mesh001) blends neck/torso, so the two separate as the neck bends. | Weld the head opening to a neck ring as on the wrist: seam verts take the live neck position, blend weights over a ~25 mm band, share seam normals. | ~1 day |
| 3 | Torso collar ↔ neck base | **Medium-low** (currently hidden by the shirt collar) | Torso top boundary floats 13 mm (p50, max 27) off the neck skin; normal break 9–22°. Neck base is buried 10–16 mm inside the torso (~490 verts). Unchanged by neck poses. | Original v2plus torso piece is not stitched to the neck; it only overlaps. | Zipper and fair the torso top ring to the Mesh001 neck ring with the wrist tools: fit_hand-style zipper + bilaplace_fair, with shared normals. | 0.5–1 day |
| 4 | Hip / knee in deep flexion | **Medium**, needs confirmation | Squat close-ups show jagged interpenetration bands at the hip crease (thigh vs abdomen/shorts) and around the knee. Knee-band verts shrink to 0.04× (min) / 0.29–0.36× (p5) of their rest distance from the bone (back-of-knee collapse). Hip p5 0.86. | Linear-blend skinning plus thigh–calf/belly self-contact. These views may also be partly inside geometry. | Re-shoot with better cameras. Then add pose-driven correctives (knee/hip flex), or dual-quaternion skinning on the limbs piece. | 2–4 days |
| 5 | Shoulder / elbow | **Low-medium** | Shoulder p5 0.39–0.51 with p95 up to 2.5× (stretch on the outer deltoid), and shards in plank R view. Elbow p5 0.42–0.57 in the fold (normal crease) with no visible candy-wrapper. | LBS in the v2plus torso/limbs pieces. | Upper-arm twist/helper bone or shoulder correctives; review after #1–3. | 1–2 days |
| — | Ankle limbs ↔ Coach_Body weld, elbow/neck profiles | OK | Weld gap 0.0 mm and normal break 0° in all poses. Neck radius step ≤3.4 mm. Elbow step 10 mm, a natural shape change. | — | — | — |

Notes:
- The knee rest "profile step" (58 mm) is a metric artifact: the slice catches the patella region and the other leg. Ignore it.
- Collapse ratio = posed / rest distance of each vertex to its bone segments within 6–12 cm of the joint.
- Scripts are in `tools/body-v3/joints-audit/`:
  - `jointaudit.mjs <out>`; `V2=1` for v2, `NECKONLY=1` for the neck poses;
  - `ja.py`, `jm.py`, `jm2.py` for the metrics.
