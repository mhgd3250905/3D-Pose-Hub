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

Existing masters are only read and encoded. Newly selected sparse revisions use
the isolated 4080 capture entry; preserve their actual timeline duration (the
two lunges are ten seconds), with source fps recorded separately from capture
fps. Frozen model, engine and historical sources stay unchanged.

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
- `media/tools/export_stacked_alpha.py`: read verified RGBA, encode, decode the
  actual H.264 and compare alpha and composites against the original RGBA.
- `media/tools/run_app_test_exports.py`: recoverable CPU queue, immutable media,
  one parent writer, incremental catalog/manifest and watched new-capture plans.
- `media/tools/review_stacked_alpha.py`: generate an offline, locally served
  video/WebP transparency review page from a completed manifest.

This machine uses one CPU worker and one GPU lane with a shared exclusive
`heavy.lock`: only one of them runs heavy work at a time, after at least 4 GiB
of Windows commit headroom is available. x264 uses two threads; BLAS uses one.
GPU work has priority. Do not increase concurrency to bypass a memory wait.
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

Every output records dimensions, bytes and SHA-256. Full decoded streams are
checked against same-frame source RGBA, including semi-transparent edges and
visible ground shadow; white, dark and cyan composites are compared. These
numeric codec checks complement actual preview inspection and do not upgrade
the action's review flags. Size comparison separately reports one existing
solid-background theme and both themes; new actions without an older solid
movie are not assigned a fabricated baseline.

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
