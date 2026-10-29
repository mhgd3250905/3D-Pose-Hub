# Remaining 32: reusable action recipes and review capture

This stage prepares templates and low-resolution review clips. It does not run final
high-resolution production, compress the complete library, or approve actions automatically.
The older `tools/action-completion-v3/` prototype and frozen model sources are preserved.

## Single-action preview

```powershell
node tools/action-completion-v3-r2/render.mjs --recipe catalog/production/remaining32-r2/groups/home/h-reverse-lunge.json --runtime <PINNED_RUNTIME_JSON> --out <NEW_CAPTURE_DIRECTORY> --phase preview --size 480 --preview-fps 12
```

Use a new output path for every attempt. The caller owns GPU scheduling; this renderer
takes one of two explicit lane locks (`--lane 1` default, or `--lane 2`) and runs one browser per lane. It never removes a
foreign lock or restarts another process. No third lane is supported. Hardware/browser pins and the existing memory
limits apply. The default preview is 480 pixels; 360 is supported, with a maximum of 480.

The solver still advances every frame at 30 FPS. `plan.previewPlaybackFrames` selects the
complete loop at 12 FPS for a review video/GIF, excluding the duplicated loop endpoint.
`plan.previewFrames` also contains key poses and the separate endpoint. Additional side
and opposite views are captured at three poses. Use the playback list for animation;
playing every PNG at 12 FPS would incorrectly lengthen the clip because it includes
the extra diagnostic frames.

Every solved frame records joint positions and raw local/world bone quaternions, local
Euler values, and hand-to-forearm / foot-to-lower-leg relative quaternions.
`rotation-path.json` preserves adjacent rotation travel and closed-loop differences.
An identical start/end orientation does not erase a full rotation in between. Angle
statistics are diagnostics; they do not replace visual checks for anatomical twisting,
mesh collapse, contact, or the intended exercise.

## Recipe contract

Required fields are `format: "pose-hub-action-recipe@1"`, stable `id`, repository-relative
`spec`, its LF-normalized `specSha256Lf`, explicit armfix model identity, both hand modes,
camera overrides, and output intent. Additional source, adaptation, review and risk
fields are retained in the recipe. The source spec is never edited.

```json
{
  "format": "pose-hub-action-recipe@1",
  "id": "action-id",
  "spec": "drill-anim/specs/action-revision.js",
  "specSha256Lf": "<SOURCE_SHA256>",
  "model": {"profile": "training-human-v3-armfix", "version": "0.1.0-r2"},
  "hands": {"left": "relaxed", "right": "relaxed"},
  "camera": {"dir": [0.7, 0.2, 1], "drift": 0, "orbitDegrees": 0, "frontSweepDegrees": 0, "fitTimeline": true},
  "cameraScale": 1.15,
  "output": {"groundShadow": false, "cameraMotion": false, "wholeCycleContentRect": true, "fps": 30},
  "adaptation": {"status": "pending-pose-review"},
  "reviewed": false,
  "releaseEligible": false
}
```

The renderer explicitly removes the old `nativeHands.version` field; only `twistShare`
is carried into armfix-r2. Selecting this model does not claim that inherited absolute
motion targets are adapted. An optional `poseAdapter` may specify only the controlled
entry `tools/action-completion-v3-r2/pose-adapter.mjs` and its `options`; that module
exports `adaptSpec(spec, options)`, returning a spec or `{spec, report}`. It may not
change the selected model or camera. Its dependencies join the capture source fingerprint.

Hand modes:

For the remaining-template previews, the native branch verifies `fixed-hand-presets-r1`
and installs fixed support/rest shapes only when selected. The source's explicit
`grasp-32mm` pose activates the native grip installer without replacing its band or
other equipment with a dumbbell. `output.exerciseMat:false` omits optional exercise
mats while retaining other props and mat-shaped supports explicitly marked `required:true`.
Each combination remains subject to action review.

For an explicitly opted-in native `grasp-32mm` kettlebell action, the preview-only
`fixedKettlebellGrasp:'grasp-32mm'` prop adapter supplies a 32 mm by 165 mm straight
handle at the measured hand-local grip center and axis. Frozen prop factories stay
unchanged. This adapter has independent geometry checks and requires visual review.
Optional `recipe.diagnostics.measureFootSurface:true` records visible posed foot/toe
mesh minimum heights per frame. These CPU-skinned measurements exclude shader-only
displacement and are separate from ankle/toe joint heights.

- `native`: source-selected symmetric native hand pose.
- `support`: native `palm-floor` pose, pending action/contact review.
- `relaxed`: native `relaxed` pose, pending action review.
- `assist`: native `open` pose, explicitly not an accepted new assisting-hand asset.
- `dumbbell-grasp`: both hands only, using the accepted fixed hand/dumbbell and wrist r4
  package. The source must have one dumbbell attached to each hand. Source dumbbells and
  gripHand props are removed to avoid duplicates. One-sided or other-implement requests
  fail instead of receiving a substitute prop.
- `fixed-grasp`: the same accepted fixed hands without dumbbells; currently restricted
  to bilateral band actions with action-specific handle endpoints.

## Bounded preview batches and review index

`batch-preview.py --lane 1 --attempt attemptNN --out <ROOT> --runtime <PIN> <RECIPES...>`
captures serially within one lane, builds 12 FPS previews and records technical triage.
Use at most two lanes. Check weekly quota between bounded batches; the current user
stop threshold is remaining capacity at or below 10 percent. Failed attempts remain
on disk. Retry with a new attempt name after correcting and checking its recipe.

`overnight-gallery.py <ROOT> catalog/production/remaining32-r2` rebuilds the review
page from completed candidates, excluding the two previously accepted templates.
`audit-preview.py <ROOT> catalog/production/remaining32-r2 --decode` checks current
recipe identity, media hashes, video decoding, relative wrist/ankle paths and the
presence of an agent candidate-review receipt. It writes `candidate-audit.json`;
neither script changes user acceptance or release eligibility.

The armfix body remains a candidate with its own scope; fixed grasp/wrist acceptance
does not certify every body corrective layer or action. Model, action, tool and recipe
identities are written with each capture. Frozen output attempts are never overwritten.

The older full-capture path and actual-preview receipt checks are retained for the later
production phase, but are not used during the current template review. The existing
`tools/action-completion-v3/postprocess.py preview-qa` accepts these capture reports.
Final export/codec selection remains deferred.

Validation: `node --test tools/action-completion-v3-r2/render.test.mjs`. These CPU tests
cover source immutability, incompatible hand requests, fixed-camera scheduling,
360-degree path evidence and receipt identity. They do not launch a browser or certify
GPU appearance.
