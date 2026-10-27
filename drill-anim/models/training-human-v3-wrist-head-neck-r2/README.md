# Experimental wrist and head–neck composition r2

This loader combines `training-human-v3-head-neck-r2` and the material patch
from `training-human-v3-wrist-r1`. The head–neck loader initializes v3 once;
the wrist patch is installed afterward on the c1r2 hands. It does not modify
either locked dependency or composition r1. `applyV3` performs setup and resets the motion;
alternative heads and non-c1r2 hands are unsupported. `detachHeadNeck` removes
the fragment only and deliberately leaves the wrist material patch installed.
Same-page combined reapply is rejected; close the page for a fresh setup. An
installation failure can leave the page partly initialized.

`node drill-anim/models/training-human-v3-wrist-head-neck-r2/check.mjs` checks
the SHA-locked dependency graph and rejection paths. It is not a browser test.
After the local Vite server is ready and one rendering slot is available, run
these serially using two **new** output directories:

```
node tools/body-v3/head-neck-topological-r1/verify-wrist-head-neck-r3.mjs reference <reference-dir>
node tools/body-v3/head-neck-topological-r1/verify-wrist-head-neck-r3.mjs combined <combined-dir>
python tools/body-v3/head-neck-topological-r1/compare-wrist-head-neck-r1.py <reference-dir> <combined-dir> <new-report.json>
```

The test compares head–neck alone with the combined candidate at long and
short sleeves, left and right wrists, and 40° flexion, 35° extension and 65°
rotation. It asserts the runtime uniform settings, visible hands, hidden
original head and neck, 162 shared seam vertices, installed hook and absence
of page errors. Image comparison checks that the long-sleeve wrist patch is
visible and that the short-sleeve and head images remain unchanged within a
small pixel tolerance. Screenshots still require human inspection. The test
does not by itself validate every motion, device or release configuration.

The r1 composition passed browser comparison, including the partial-detach
lifecycle; see `tools/body-v3/head-neck-topological-r1/combined-results-r1.md`.
That evidence belongs to r1. R2 requires its own browser retest and is not
release eligible.
