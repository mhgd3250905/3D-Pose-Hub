# Experimental closed-foot audit probe

This experiment does not modify or export a model. It does not establish a
strict inside/outside proof because the tested posed skin has non-adjacent FCL
self-contacts. It does not change P1 acceptance.

For each foot, `cap-feasibility-r2.py` clips the actual indexed `Coach_Body`
and `V2P_Base_Limbs` triangles at reset-pose world Y of 0.20 or 0.25 m. Each
crossing edge is interpolated at the same rest-space parameter in the plank
snapshot. Vertices within 0.01 mm in reset space are position-welded; the
maximum resulting plank spread is 0.000067 mm. `seam-identities-r1.py` checks
the source seam table separately: 28 authored pairs per foot are all referenced
by both index buffers, with maximum gaps of 0.0000454 mm at rest and 0.0000668
mm in plank. Positional welding is an audit assumption and is not an edit to
the production geometry.

Each of the four truncated pieces is one connected component with 148 boundary
edges, all on the single cut. The probe triangulates only that cut (146 faces),
without patching other holes. All four resulting meshes are watertight with
consistent face winding and no edge used by more than two faces. A cap is planar
in reset space and follows the interpolated boundary in plank; it is an
artificial diagnostic surface and can change the hypothetical solid.

The minimum-to-maximum distance from the 63 flagged shoe vertices to the cap
is 58.75–66.70 mm for the 0.20 m cut and 108.75–116.70 mm for the 0.25 m cut.
Both caps give identical exploratory classifications: 32 left and 31 right
flagged points outside, with closest-surface distances 0.399–8.748 mm.
However, FCL reports seven non-adjacent skin-face contact pairs on each foot,
the same pairs with both cuts. The involved skin faces are 18.29–47.35 mm from
the flagged shoe points. FCL's report does not by itself distinguish true
crossings from contact or numerical effects; until these pairs are resolved,
neither classification is a proof. Watertightness and winding consistency
alone do not establish a self-intersection-free solid.

The legacy snapshot does not include drawRange. A separate actual r17 metadata
capture checked rest, squat, plank and fold: the three relevant meshes were
effectively visible, had no geometry groups or morph influences, and their
drawRange covered the full index buffers. Their captured world-position arrays
were byte-identical to the r16 snapshots, which are in turn identical to the
r15 snapshots used by this probe for the recorded states. This verifies the
sampled runtime only, not every profile or pose.

Reproduction requires NumPy, SciPy, Trimesh, rtree and python-fcl. Provide new
output paths; existing results are never overwritten:

```text
python tools/body-v3/ankle-geometry-r1/seam-identities-r1.py AUDIT_DIR drill-anim/models/training-human-v2plus-limbs-base.json --output NEW_SEAM.json
python tools/body-v3/ankle-geometry-r1/closed-cap-probe-r2.py AUDIT_DIR FLAGS_JSON --output NEW_CAP.json
```

The local recorded files are under
`E:/AII-3D/codex-output/body-v3-fixes-20261027/ankle/`:
`candidate-r15-preview/{cap-feasibility-r1,seam-identities-r1,closed-cap-probe-r1,closed-cap-probe-r2}.json`
and `candidate-r17-compare-r1/runtime-range-r1.json`. Input SHA-256 values are
in the diagnostic JSON. The first cap probe withholds classification on any
non-adjacent contact; the second exposes it explicitly as exploratory only.
