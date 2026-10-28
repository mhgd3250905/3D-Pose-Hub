# Fixed 32 mm dumbbell grip and wrist attachment

This package retains the user-accepted r4 appearance baseline for `training-human-v3-armfix-r2`. It is a fixed baked grip with a short deformable wrist band. It is not a general hand rig. The independent QA passed all measured checks for 17 primary command samples (34 sides) through 60 degrees; 75-degree stress cases include failures. Whole-body/action contact and rig integration remain candidates. The production recipe has not switched, and `releaseEligible` remains false.

From the repository root:

```js
import {verify, install, detach} from './tools/body-v3/webxr-wrist-join-r1/loader.mjs';
const data = verify(); // Default: this package's recipe.json
await install(page, {showDumbbells: true});
await detach(page);
```

To relocate only this data package, copy its directory intact and pass `verify({recipePath: '/new/location/recipe.json'})` or the same option to `install`. Sources and the explicit `templateDir` resolve relative to `recipe.json`, independent of the working directory. `verify` checks package hashes, template pins, and the limb index pin. The renderer still uses the repository's unchanged r4 runtime and expects its existing Three.js body-viewer environment.

For the standalone fixed hand/prop GLBs, use `template-package/template.mjs` in an environment with the Three.js addons import map. That loader does not assemble the wrist/body seam. `hand-only` GLBs are retained reference assets.

The four source JSONs and four GLBs are copied byte-for-byte. Full original hand metadata remains embedded, including historical absolute provenance paths; these are evidence, not runtime dependencies. Only the recipe source paths and explicit package locations changed. `manifest.json` records hashes and scope; evidence records preserve the user statement and measured QA, including stress failures. The template's own manifest retains its earlier standalone-template acceptance scope.

CPU checks:

```sh
node tools/body-v3/webxr-wrist-join-r1/test_portable.mjs
python tools/body-v3/webxr-wrist-join-r1/test_build.py --recipe drill-anim/models/webxr-dumbbell-wrist-r1/recipe.json
```

The relocation test blocks reads from outside the temporary copy while verifying the package, compares the legacy recipe when `--legacy-recipe` is supplied, and detects prop/source tampering. No GPU is needed. WebXR-derived hand assets retain Amazon's MIT notice in `LICENSE-source.md`.
