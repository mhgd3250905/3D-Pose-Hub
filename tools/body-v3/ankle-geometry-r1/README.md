# P1 geometry evidence (diagnostic only)

The handoff's unchanged acceptance criteria are: rest, squat, plank and fold;
legacy `pen shoe inside foot` count zero or maximum ≤1 mm; zero ankle-weld
gap; and no exposed skin at the shoe opening in reviewed images. The original
`ja-r1.py` uses a 2 mm default filter, so `ankle-r2/measure-r3.py` adds a
separate explicit 1 mm count without overwriting the original result. Report
the raw gap (the current measured ~0.00007 mm is floating-point scale), not
an invented tolerance or a claim of mathematically exact zero.

The 1 mm nearest-vertex-normal proxy is retained even where other tests suggest
false positives. To investigate each flagged vertex, `ankle-r4/closest-face-r2.py`
also records the nearest triangle restricted to the same-side foot, its flat
geometric normal and interpolated normal, distance, signed projections and
source vertex/face IDs. `ankle-r5/collision-r2.py` separately tests FCL triangle
contacts in a fixed cropped region. These tests have different meanings.

`winding_ray_r1.py` uses Trimesh's unique ray-triangle intersections in 24
deterministic directions and an independently written signed solid-angle sum.
Trimesh is [MIT licensed](https://github.com/mikedh/trimesh), and the core
[libigl winding-number reference](https://github.com/libigl/libigl/blob/main/include/igl/winding_number.h)
is MPL-2.0; no libigl code is copied. The script tests a closed sphere and an
intentionally open sphere before real data. It reports winding values, ray
counts, rest-space welded boundary components, and anatomically suggestive
bone-center controls. Open/non-manifold surfaces prevent strict inside/outside
conclusions, and FCL surface contacts do not detect containment.

```
python tools/body-v3/ankle-r4/closest-face-r2.py AUDIT_DIR --states plank --threshold-mm 1 --output NEW_FLAGS.json
python tools/body-v3/ankle-geometry-r1/winding_ray_r1.py AUDIT_DIR NEW_FLAGS.json --state plank --directions 24 --output NEW_EVIDENCE.json
```

For the r15 plank snapshot, 32 left / 31 right shoe points triggered the
legacy 1 mm proxy, max 9.375 mm. Their same-side closest-triangle projections
were all negative using both interpolated and geometric face normals. Against
the combined `Coach_Body` + `V2P_Base_Limbs` surface, all 63 flagged points
had even parity in all 24 tested directions and winding about -0.00248 to
-0.00203. On the same mesh, foot-bone centers had winding about 0.999 and
23/24 or 24/24 odd rays; a far-outside control had winding 0.00037 and all
even rays. Bone centers are suggestive controls, not independent ground truth.

The isolated foot patches each have 28 open boundary edges and all flagged
points show mixed ray parity on those patches. The whole limbs mesh has 234
boundary edges, including 28 at each distal ankle; the combined surface has
210 other boundary edges even after the ankle joins. Thus the evidence strongly
questions the flagged nearest-vertex projections but does not prove global
separation. It does not itself change the agreed acceptance criteria, and P1
remains unchecked until the remaining geometric and visual concerns are
resolved or an explicit method change is accepted.
