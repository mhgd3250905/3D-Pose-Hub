# App test pack r1

This branch produces an **unreviewed App test pack**, never a published media
release. User approval to test all available actions supersedes the earlier
three-samples-then-wait gate. Deliver the first three, then continue without
another confirmation. No main merge, remote push, tag or public upload is part
of this task.

The delivery root is `F:/PoseHub-v2-production/app-test-pack-r1/`:

- `manifest.json`: only complete, hash-verified playable deliveries; pending IDs
  and failures remain explicit. The manifest is refreshed atomically per action.
- `catalog.json`: all 219 selected action families, metadata, source revision,
  rhythm and `availableForApp`. Pending entries have no media files.
- `media/<stable-id>/`: packed MP4, transparent cover WebP, transparent thumbnail.
- `qa/<stable-id>/`: decoded-alpha validation reports.
- `planning/`: immutable export plans, including new completed GPU captures.

Every entry retains `reviewed:false` and `releaseEligible:false`. A successful
encode means the export passed its technical checks, not that motion, training
advice or clinical safety received approval. App builds must filter on
`availableForApp` during incremental delivery.

## Exact scope and source identity

The 189-action production snapshot already includes PR14's 47 actions. Select
26 usable PR15 targets, replace the three existing seated-action families with
their explicit newest revisions, then add the seven selected Dot v4 actions:
`189 + 26 - 3 + 7 = 219`. Do not add failed pelvic-tilt work or the rejected neck
commits. Thread-the-needle is the explicitly named low-range revision; its old
high starting posture remains unresolved.

`catalog/test/app-test-pack-r1.json` pins this selection. The existing 186
non-overridden sources are taken from their immutable production manifests.
The other 33 need new, complete transparent layers of their selected revisions.
The seven earlier PR15 full review movies have solid backgrounds and cannot be
used as RGBA masters or chroma-keyed to impersonate exact alpha.

The initial three (`h-chair-tspine`, `w-bird-dog`, `h-squat`) also match the
SmartFit v0.3.0 / realistic offline-video hashes and its supplied 93-ID baseline.
That 93-ID installation list is not a limit on the new 219-action test pack.

## Pixel and playback contract

One H.264/yuv420p MP4 contains two simultaneous 720-square images:

```text
720 x 1440
top    y=0..719:     straight RGB, with nearby edge colours extended into A=0
bottom y=720..1439:  A repeated into R, G and B
```

This is packed alpha, not a native-alpha H.264 stream. Decode tagged BT.709
limited-range video into normal full-range RGB. Sample the bottom red channel
from that RGB texture, not the unexpanded limited-range Y plane. Composite once:

```text
displayRGB = topRGB * bottomR + backgroundRGB * (1 - bottomR)
```

Clamp each half's UVs to its own pixel centres. Do not interpolate across the
720-row split. The review generator provides an offline WebGL implementation
and white, dark, cyan and checkerboard backgrounds. Hardware/FragmentShader
acceptance inside each App remains an App integration check.

The colour path uses the bound original framing and highlight recipe. Body,
equipment and mat remain in the foreground; the separately stored translucent
ground shadow is composited behind them on a transparent canvas. The old
`cover.transparent.1080.png` is not reused because it omits ground shadow.
Resizing filters associated RGB/alpha together and restores straight RGB.
Nearest-edge extension affects only zero-alpha RGB; shadow alpha is never
thresholded or expanded. Covers are lossless alpha WebP at 720 square and
thumbnails at 240 square, from the bound cover frame.

Existing masters are read and encoded when their complete shadow fits the source.
The 2026-10-25 SmartFit clipping report authorizes fresh transparent captures
for sources whose body, equipment, mat or shadow is already cut at the source edge.
Padding a clipped image cannot recover missing pixels. No action-content review
is part of this production pass. Only GPT-6.1 Sol or lower is authorized; never Astra.
Newly selected sparse revisions use
the isolated 4080 capture entry; preserve their actual timeline duration (the
two lunges are ten seconds), with source fps recorded separately from capture
fps. Frozen model, engine and historical sources stay unchanged.

The transparent export now computes one square from every frame's body/props
and shadow alpha, with 5% transparent margin. It preserves the old bound
`framing` as provenance and records the applied `exportFraming` separately.
Any nonzero source alpha reaching the source boundary is held for technical
repair, with all affected frames recorded in the preserved attempt's
`framing-check.json`. The full decoded video must also keep a 12-pixel outer
band with alpha at most 3/255. Lossless WebP cover and thumbnail must retain
at least 4% transparent margin after filtering. These checks concern export
framing and transparency, not whether the exercise is performed correctly.

Encoding also streams the exact pre-pack RGBA and visible-shadow mask into a
single temporary file in that attempt's QA directory. The decoder reads that
reference one frame at a time instead of recomposing every source layer again.
Write/read SHA, exact length, identity and frame order must agree. Full H.264
decoding, alpha/composite/boundary checks and the final source-hash readback
remain mandatory. No full timeline is held in RAM. Only the two owned reference
cache files are removed after the completed export passes; failures preserve
them with their attempt. Original RGBA masters and delivered media are retained.

## Tools and continuation

Python dependencies: Pillow, NumPy, SciPy; external tools: FFmpeg/libx264 and
ffprobe. GPU capture additionally uses the project's existing Vite/Playwright
runtime. No browser is used for encoding existing RGBA layers.

- `media/tools/prepare_smartfit_alpha.py`: bind the first three to current App
  videos, authorisation and immutable production inputs.
- `media/tools/build_app_test_plan.py`: fixed 219-family catalog and 186 existing
  transparent-source export plan.
- `tools/app-test-pack/render_latest.mjs`: explicit versioned profile selection,
  real 4080 proof, actual preview before full capture, and source hashes.
- `media/tools/prepare_captured_alpha.py`: verify a completed new capture and
  prepare its export plan; never accept sparse/failed/changed source frames.
  The selected spec must match the catalog's exact raw SHA or its exact
  CRLF-to-LF equivalent. If the catalog pins a byte length, it must match that
  same hash representation. Plans retain both the actual `specRawSha256` and
  `specLfSha256`; optional LF pins, full capture/layer hashes, RTX 4080 proof,
  timing and every frame reference remain mandatory as before. No other
  whitespace, BOM or content normalization is accepted, and sources are not
  rewritten.
- `media/tools/export_stacked_alpha.py`: read verified RGBA, encode, decode the
  actual H.264 and compare alpha and composites against the original RGBA.
- `media/tools/run_app_test_exports.py`: recoverable CPU queue, immutable media,
  one parent writer, incremental catalog/manifest and watched new-capture plans.
- `media/tools/review_stacked_alpha.py`: generate an offline, locally served
  video/WebP transparency review page from a completed manifest.

The user dedicated this machine to production on 2026-10-25 and authorized
greater resource use while protecting memory. Run at most one CPU worker and
one GPU capture concurrently. CPU owns `work/cpu-heavy.lock`, GPU owns
`work/heavy.lock`; both serialize admission through the short-lived
`work/resource-admission.lock` with PID and token ownership checks. A solo task
needs at least 4 GiB available Windows commit. Joining an active peer requires
at least 8 GiB commit and 6 GiB physical memory, checked before and after the
role claim. Low memory naturally admits one lane at a time. Unknown or stale
locks remain for inspection. x264 uses two threads; BLAS uses one.
CPU flags are `--heavy-lock <work/cpu-heavy.lock>` plus
`--peer-heavy-lock <work/heavy.lock> --admission-lock <work/resource-admission.lock>`;
the parallel thresholds default to 8/6 GiB and cannot be lowered. Omitting
the peer/admission options retains the earlier exclusive single-lane mode.
CPU workers are created only when an action can start, then fully shut down
after the action finishes, releasing NumPy/Pillow allocations and their role
slot. No export worker is retained during a resource wait.
Close the sample HTTP review server after viewing; it is not needed by either
production queue. The capture browser already closes in a `finally` block.
Stop and diagnose a lost GPU/browser context before
trying again. Failed partial attempts are preserved in separate source/work
directories; do not overwrite a delivered media path with different bytes.

The queue can ingest the initial three completed exports, then process existing
sources and discover `planning/latest/*.json` from later GPU completions. If it
has no ready plan while some selected sources are still missing, it records
`awaiting-source`, not `complete`. Use manifest/progress and actual process
state when reporting progress, never just the presence of a directory.

## Verification and design references

### Training definitions in the test package

`catalog.json.actions[]` carries the same training fields as the existing
`catalog/catalog.json` definitions: `category`, `level`, `position`,
`defaultDose`, `doseRange`, `cues.zh`, `unilateral`, `scenes`, `purpose`, and
`muscles`. The new drafts also describe `commonErrors`, `countingSemantics`
and demonstrated side. These definitions are test drafts; historical review
flags never approve new media or new definitions.

The exact 142-action inherited source is copied into the delivered package at
`catalog/catalog.json`, with the previously declared bytes/SHA unchanged.
The 77 additional IDs are authored in two evidence-linked source batches,
`catalog/test/semantics-pr14-r1.json` and `semantics-latest-r1.json`. Numeric
doses require an explicit source. A documented range does not silently become
a default, and a video's eight-second loop is never a training prescription.
Static holds use `mode: "time"`; unknown seconds, sets, rest, or difficulty
stay null. Missing clinical/safety knowledge is not inferred from geometry.

Run the lightweight metadata update on this source branch:

```powershell
python -B media/tools/app_test_semantics.py --repo . --catalog catalog/test/app-test-pack-r1.json
```

The active queue reloads only validated semantic changes. Changed revision,
source, duration, scope or approval is rejected, while existing output media
remain intact. Only the queue parent publishes the delivered catalog/manifest;
do not patch those live files from a second writer.

`trainingSemantics.updatedActionIds` and `batches[].updatedActionIds` list each
enriched batch. This means fields were added, not that every unknown was
resolved. `definitionCompleteIds`, per-action `missingRequiredFields`, and
`unresolvedById` make the distinction explicit. All 219 entries remain in
the catalog. `availableForApp` indicates playable media;
`trainingDefinitionComplete` indicates the required training fields exist;
`availableForTraining` requires both. Neither is a human review or public
release approval. Consumers must preserve nulls instead of applying invented
fallback doses. Existing App definitions may differ from the inherited Hub
source, so its source hash/revision must accompany any consumer-side migration.

For a coherent live read, first load `manifest.json`, then the immutable
catalog snapshot referenced by `manifest.catalog` and verify bytes/SHA.
The root `catalog.json` remains the latest convenient view. Semantic batch
sources are copied by checksum; repository-only evidence is marked explicitly.

### Explicit framing repairs

Keep original bytes and source-spec revisions. A defective export is withdrawn
only by an explicit `--repair-manifest <file>` with format
`pose-hub-app-test-repairs@1`. For example:

```json
{
  "format": "pose-hub-app-test-repairs@1",
  "allowedLegacyExporterSha256": ["<64-character previous exporter SHA-256>"],
  "actions": [{
    "id": "h-squat",
    "expected": {
      "catalogRevision": "h-squat-r2",
      "queueSourceKey": "<64-character delivered source key>"
    },
    "sourceRevision": "h-squat-r2",
    "catalogRevision": "h-squat-r2-alpha-r2",
    "mediaRevision": "h-squat-alpha-r2",
    "reason": "Restore the complete ground shadow with transparent margins",
    "plan": null
  }]
}
```

The sole queue parent verifies the previous identity, saves an immutable
`history/<id>/...json` reference, and removes that version from live ready
deliveries. Its catalog entry stays present with no files or QA and
`availableForApp:false`. `plan:null` means complete source layers are still
needed; the old source is not encoded again. The repair also supersedes the
initial three-sample dispatch exclusion for that action.

When complete corrected layers exist, atomically add a pinned plan reference:
`"plan":{"path":"<absolute or manifest-relative plan>","bytes":123,"sha256":"..."}`.
Each plan must contain exactly its authorized action. The parent hot-loads it
and prioritizes that repair. An already pinned plan or repair identity cannot
be silently changed; a changed byte count or SHA is rejected. If a queued or
failed repair's full-cycle check later finds that its original layers were
already clipped, a new complete capture can explicitly supersede that plan:
set `supersedesPlanSha256` to the previous authority's exact `plan.sha256` and
replace `plan` with the new checksum-pinned reference. This is allowed only
while that action is not ready; its expected old version, source revision,
catalog revision, media revision and reason must remain identical. Missing or
incorrect proof is rejected, and ready media cannot use this shortcut. Both
immutable plans remain under `plans/`, with previous/replacement references
and the proof recorded in manifest `repairPlanHistory`. Ordinary watched
plans cannot replace an authorized repair. New media and decode QA are copied
to `media/<id>/<mediaRevision>/` and `qa/<id>/<mediaRevision>/`; old paths retain
their exact bytes. Delivered catalog `revision` identifies the new media
revision, while `sourceRevision` preserves the actual unchanged action spec.
The manifest retains both repair authority and history references.

After an exporter update, earlier valid exports are accepted only when their
per-action exporter SHA appears in `allowedLegacyExporterSha256`, and their
source key still matches the bound recipe using that exact historical tool
SHA. A different tool alone never licenses a changed source or spec revision.

Use `--stop-after-current-file <control-path>` for a controlled queue stop.
Creating that file lets the current export finish and publish, then releases
its worker and locks without starting another action. Remove it before a
deliberate restart. Never stop a running capture or encoder merely to update
the queue code.

Every output records dimensions, bytes and SHA-256. Full decoded streams are
checked against same-frame source RGBA, including semi-transparent edges and
visible ground shadow; white, dark and cyan composites are compared. These
numeric codec checks complement actual preview inspection and do not upgrade
the action's review flags. Size comparison separately reports one existing
solid-background theme and both themes; new actions without an older solid
movie are not assigned a fabricated baseline.

The capture entry accepts `--technical-diagnostics-only` for this test pack.
It omits post-pose vertex/contact diagnostic scans while preserving the original
motion and contact solvers, warm starts, cache initialization and matrix/skeleton
updates. Frozen engine, model and layer files are never rewritten; whole-source
hashes and exact reversible in-memory edits are required. The CPU-authored
Threadneedle profile uses the original path. Preview and full must share the
same diagnostic mode and source/tool identity; complete an existing matching
pair before changing the capture entry, or keep a rejected preview as history
and start a new preview revision.

The [4080 comparison receipt](qa/capture-diagnostics-r1.json) records identical
RGBA and PNG bytes for all 13 preview frames and all 241 full frames, in each
of the body/highlight/shadow layers, with identical warm x, joints and camera.
The measured full capture changed from 156.404 to 84.090 seconds; preview startup
did not improve. These timings describe this sample only. Complete-cycle source
framing, actual light/dark preview inspection and full MP4 decode QA still run;
omitted pose diagnostics do not constitute action review.

The layout follows the established RGB-plus-alpha video approach described by
[Tencent VAP](https://github.com/Tencent/vap) and
[YYEVA-Web](https://github.com/yylive/YYEVA-Web), without copying their players,
container metadata or alternate layouts. VAP's own code is MIT but its README
states that updates stopped; YYEVA-Web is Apache-2.0 and is not a basis for a
claim of current active maintenance. The maintained encoding primitive is
[FFmpeg](https://ffmpeg.org/ffmpeg-filters.html#alphaextract); its
[alphamerge implementation](https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/vf_alphamerge.c)
warns about incorrectly limited-range alpha. No third-party player SDK or binary
is vendored into this repository.
