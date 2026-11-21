# Air Flare r6 — buttock midline dent fix (scheme 1), shared model coach-v3r3.glb

Problem (开哥): with the legs spread, the butt shows a dent. Cause: r4 harmonic crotch weights left the
butt/crotch midline at about leftThigh 0.35 + rightThigh 0.32 + pelvis 0.30, so with the two thighs rotating
in opposite directions, LBS pulls the midline in by 3–6 cm (3.43 s f412, 1.47 s f176, 1.58 / 3.74 / 3.87 s).
r6 candidates A/C/D filled the dent but grew spikes, because the inner-thigh sheets between the legs
(about 1 cm from the midline, 4–7 cm below the crotch) also got pelvis weight.

Scheme 1 (`m1.py`, pants prim only, crotch sphere r ≤ 0.18 m around (0, 0.83, 0.005), y < 0.95; positions,
bones, other prims, app.js untouched; animation untouched, no angle narrowing):
- **S (true seam only)**: verts on edges crossing x = 0 *and* above the smooth crotch line ycs(z) (front crotch →
  perineum → gluteal cleft; the narrow perineum pocket at z ∈ [−0.012, 0.03] is excluded from the line). Band
  |x| < 0.05 m at the back (cleft), 0.015 m at the front, smoothstep falloff in x, tapered off near the top
  ends (cleft top y 0.94, fly y 0.92). Target pelvis weight by z: 0.6 at the back cleft (z < −0.05), ramping to
  0.3 by z = −0.015 (perineum) and 0.3 from there to the front; the rest split equally between the thighs; band edges blend to
  the r4 harmonic weights.
- **B (inner-thigh sheets between the legs)**: |x| 0.004–0.045 m, 4–12 cm below the lowest midline point, not
  crossing x = 0 → 100% own thigh (x > 0 leftThigh).
- **Free verts**: biharmonic (LᵀL) interpolation against S, B and the fixed weights outside the sphere, so
  the S/B constraint edges have no gradient kink (plain harmonic left creases/teeth at the constraint borders).
- Params: `{"hb":0.04,"pm":0.6,"bih":true,"band":0.015,"band_b":0.05,"pmf":0.3,"pmp":0.3}` on the pre-r4 raw model.
- Build: `python3 m1.py coach-v3r3-raw.glb out-raw.glb '<params>'`, then
  `node ../airflare_r4/glbio.mjs pack out-raw.glb <deployed r4 glb> coach-v3r3.glb` (meshopt, same layout).

Result: the midline dent is gone or much shallower at 3.43 s (screenshot frame) and 1.58 / 3.74 / 3.87 s;
1.47 s front (video camera) has a shallow rounded U where r5 had a sharp V. No spikes on the midline.
Regression (`regression_other_moves.jpg`): standing 2000 f0 identical; Thomas flare f46/f148 no regression;
2000 r20 f192/f375 OK. Two small differences: a short fold line at 2000 f192 front, and a sharper V-shaped
crotch apex at f375 (r5 was a rounded U).

Files: `coach-v3r3-r6.glb` (= deployed model/coach-v3r3.glb on b2000 preview), `butt_r5_vs_r6.jpg`,
`regression_other_moves.jpg`, `compose.py` (compare video).
