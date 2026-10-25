# Latest transparent source capture

`render_latest.mjs` reads the exact selected spec and produces new 1080² straight-alpha body, grayscale highlight coverage, and depth-tested RGBA shadow sequences. It never reads dark review MP4 pixels or keys a background, never edits frozen sources, and never starts more than one browser. The calling coordinator must keep the whole computer at at most two render processes, each with one job. The provided GPU runtime is checked against the actual browser version and RTX 4080 device.

Print the current catalog's pending source plan without starting a browser:

```powershell
node tools/app-test-pack/render_latest.mjs plan --catalog catalog/test/app-test-pack-r1.json --source-root F:/PoseHub-v2-production/app-test-pack-r1-source --runtime F:/PoseHub-v2-production/planning/render-runtime-gpu4080-r1.json
```

Representative native-hand preview (choose a fresh output revision):

```powershell
node tools/app-test-pack/render_latest.mjs preview --spec drill-anim/specs/h-bent-knee-calf-raise-rr7.js --stable-id h-bent-knee-calf-raise --out F:/PoseHub-v2-production/app-test-pack-r1-source/pr15/h-bent-knee-calf-raise/preview-r1 --runtime F:/PoseHub-v2-production/planning/render-runtime-gpu4080-r1.json
```

Actually inspect the transparent layers/composites before running the matching full command:

```powershell
node tools/app-test-pack/render_latest.mjs full --spec drill-anim/specs/h-bent-knee-calf-raise-rr7.js --stable-id h-bent-knee-calf-raise --out F:/PoseHub-v2-production/app-test-pack-r1-source/pr15/h-bent-knee-calf-raise/full-r1 --runtime F:/PoseHub-v2-production/planning/render-runtime-gpu4080-r1.json --preview F:/PoseHub-v2-production/app-test-pack-r1-source/pr15/h-bent-knee-calf-raise/preview-r1 --preview-reviewed --review-note "Record the actual inspected frames, layers and findings here"
```

Full capture requires a completed transparent preview with matching source/tool/spec/runtime/camera identity and unchanged preview artifacts. It captures `0..N-1`, saves the loop endpoint `N` separately, and writes a completion report only after all three continuous sequence indexes exist. Preview captures source key phases plus start/interior/end/endpoint. `N = timeline.duration × capture fps`; source motion and timing are not stretched. Forward/lateral lunges remain ten seconds, 300 frames at 30fps. `sourceFps` remains distinct from capture fps.

Ordinary specs explicitly use the current base v2plus production appearance with original motion/camera/props. Seven repaired specs select their exact dedicated loaders (including contact-r5 for the wall-palm action). Invalid special versions never fall back. New native actions require explicit `--entry native-open-r1`; failed legacy grip profiles are rejected.

For six special engine actions, `--camera-distance-scale 1.08` can explicitly reproduce the old review-only 8% distance margin. The default is 1, preserving the source camera fit; this choice is bound in preview/full identity. UI insets are cleared and a specified lens FOV is set before fit, avoiding the known 14-degree hip-thrust camera ordering defect. `--framing file.json` can attach a fixed 2D crop; the raw captured layer pixels are not cropped or resized. The encoder must preserve that bound recipe rather than recomputing a crop per frame.

091 uses the actual independent CPU-authored `Threadneedle_*` meshes, not the hidden skeleton. The existing generic layer adapter would otherwise call its incompatible hidden-rig frame/metrics path and omit those ordinary scene meshes from visible-surface diagnostics. This new entry installs a capture-only bridge, keeps the loader's exact trajectory and display materials, and reproduces the existing `threadneedle-review/1.0.0-r1` fixed camera (25 sampled mesh bounds, original direction/FOV, 1.12 margin). Finite coordinates and clipping are checked on the actual displayed surfaces. Hidden-rig solver/contact results are explicitly inapplicable; no base-model fallback occurs. The first actual GPU preview remains necessary to verify shader and shadow compatibility.

Every output remains `reviewed:false`, `releaseEligible:false`, `qaStatus:pending-user-review`. Capturing all frames does not certify contact, anatomy or user acceptance. Shader errors, context loss, incorrect GPU, changed sources, missing RGBA layers or CPU surface clipping produce `failed.json`; failed outputs must never enter the pack. Use a new revision after diagnosing a failed capture.
