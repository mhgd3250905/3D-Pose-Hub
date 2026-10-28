# Original v3 rest elbow: controlled normal comparison

The no-outfit v3 entry and the same entry with `arm-normals-r1` were rendered
serially at the original `v3render v3` rest-elbow camera. Their baseline PNGs
are respectively byte-identical at pixel level to the previously saved
`normals-before-r1/seam-elbow.png` and `normals-after-r1/seam-elbow.png`.
The two baselines differ by more than 4/255 at 6,010 of 409,600 pixels; the
camera, outfit uniform and geometry silhouette are the same. The rim remains
visible along the elbow edge in both, without an obvious isolated speck at that
particular close-up. This is not proof that the whole arm is free of spots.

For both runs, diagnostic mode-zero and restored images match their baselines
exactly; guard masks contain zero hits, as expected with `uV2pOut=0`. Disabling
rim changes 8,522 pixels before and 8,508 after. The `highlight-before` image
has no changed pixels relative to baseline in this view, so its equality with
the control does not independently demonstrate a visible highlight. Other
fold tests did contain visible highlighted pixels.

The r2 mesh-ID uniform compiled and displayed distinct IDs despite shared
program keys: pure red Coach_Body 155,938 pixels, pure green Mesh005 59,317,
and orange Coach_Training_Shorts 26,205, excluding blended boundary pixels.
The two mesh-ID frames are identical. The older r1 mesh-ID material attribution
remains invalid and is not retroactively corrected.

The separately saved `v3render v3` rest-shoulder comparison shows a narrow
orange line in the corrected image that was not visible in its reference. In
the x175–214 / y380–474 crop, an orange threshold selects 0 reference pixels
and 59 corrected pixels. Whether this is a natural occlusion edge or an
unwanted isolated bright spot remains unresolved; the elbow view cannot
resolve it. Do not claim whole-arm L2 visual acceptance on this evidence.

Images and reports: `E:/AII-3D/codex-output/body-v3-fixes-20261027/normal-spot-v3-rest-r4/`
and `.../normal-spot-v3-normal-rest-r4/`; prior whole-model and shoulder images
are in `.../materials/normals-before-r1/` and `.../materials/normals-after-r1/`.
