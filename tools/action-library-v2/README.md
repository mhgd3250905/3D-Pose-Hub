# Action library v2 batch runner

This orchestration layer calls the unchanged `drill-anim/tools/v2/render_layers.mjs`.
It does not change model sources, solve contact calibration, or approve visual QA.
Every batch supplies five skins and native eight-second, 30 fps, 1080-square specs.

Preview preflight (no browser, no output creation):

```powershell
node tools/action-library-v2/run_batch.mjs --batch catalog/v2/batches/b001-gpu4080-r2.json --root F:/PoseHub-v2-production/batches/b001-gpu4080-r2 --coordinator-root F:/PoseHub-v2-production --runtime F:/PoseHub-v2-production/planning/render-runtime-gpu4080-r1.json --workers 2 --preview --dry-run
```

Remove `--dry-run` only after the batch sources have been reviewed and frozen.
One action occupies one child renderer/browser. `--workers` is limited to 1 or 2.
All runners for this production workspace must use the same coordinator root.
The exclusive coordinator lock prevents separate batch roots from each starting
two browsers. Active or stale coordinator and batch locks require inspection;
neither is automatically removed. Do not run another diagnostic or legacy
renderer alongside a two-worker batch: those tools do not participate in this lock.

Before every action dispatch the runner queries the output filesystem and requires
at least 50 GiB available. Missing, unsupported or malformed filesystem queries
fail closed. This threshold is a reserve, not a claim about whole-library capacity.

The first preview freezes `manifests/batch-source.json`: batch bytes, wrapper and
transitive renderer/model sources, and this folder's `.mjs` orchestration files.
It also binds the explicit runtime profile SHA, Chromium arguments/channel,
browser version and actual WebGL renderer. The profile fixes public default config,
browser/Playwright file SHA and two matching real probes including their script
SHA. Startup and every action revalidate these files and public config/env. The
child receives its arguments through a temporary `CHROMIUM_ARGS` environment
override; no config or system setting is edited. The `runtime-guard.mjs` preload
wraps the existing Playwright launch/page and reads that same page's existing
WebGL context after readiness. It does not create another browser/context or
change rendering. Wrong device/version/arguments or lost context fail the action.
The actual proof in `qa/runtime/<stage>/<id>.json` is itself bound by the receipt.
Python composition scripts and documentation are independently versioned and do
not alter this GPU recipe. A changed recipe requires a new output root.

Each completed action gets a new-only receipt in `manifests/completed/`. Reuse
requires matching recipe/source/review hashes, all five manifests, exact index
coverage and the SHA/byte count of every referenced PNG. Full output contains
frames 0–239 and a separate QA endpoint 240. Partial output is retained and refused;
the runner does not overwrite, clean, or silently resume it. After one failure it
stops dispatching new actions and lets already running actions finish.

Full rendering requires an independently authored actual visual review:

```powershell
node tools/action-library-v2/run_batch.mjs --batch catalog/v2/batches/b001-gpu4080-r2.json --root F:/PoseHub-v2-production/batches/b001-gpu4080-r2 --coordinator-root F:/PoseHub-v2-production --runtime F:/PoseHub-v2-production/planning/render-runtime-gpu4080-r1.json --workers 2 --review F:/PoseHub-v2-production/reviews/b001-gpu4080-r2-actual-review.json
```

The external JSON contract is `pose-hub-v2-actual-review@1`. It must contain
`actualReview: true`, `approved: true`, `reviewedBy`, ISO `reviewedAt`, `batchId`,
the exact `batchSha256` and `recipeSha256`, and one `actions` entry per action.
Each entry needs `id`, `approved: true`, matching `sourceSha256`,
`previewManifests` with all five exact `{root:'media',path,sha256,bytes}` references,
and `actualVisualFrames` mapping each skin to the frames actually inspected.
Every declared preview frame must have been inspected. Preview receipt hashes,
all indices and referenced PNGs are rechecked before any full browser starts.
The runner never generates or grants this approval. Visual approval does not
grant editorial, voice, merge, release or publishing approval.

CPU checks, without GPU:

```powershell
node --test tools/action-library-v2/run_batch.test.mjs
```


Full production QA uses complete integrity, layer-pixel, sequence-anomaly and
measured-geometry reports, plus actual viewing of the full temporal sheets and
all skin/theme/highlight mosaic cells. The reviewer writes a separate
`pose-hub-v2-full-actual-review@1` attestation; `bind_qa.py` validates its exact
source, GPU proofs, sampled frames and report references before creating new
QA evidence. It does not create visual approval or grant editorial, listening,
merge or publishing approval. Existing evidence targets are never overwritten.

```powershell
python -B -X utf8 tools/action-library-v2/bind_qa.py --batch catalog/v2/batches/b001-gpu4080-r2.json --root F:/PoseHub-v2-production/batches/b001-gpu4080-r2 --actual-review F:/PoseHub-v2-production/reviews/b001-full-actual-review.json
python -B -X utf8 tools/action-library-v2/integrate_batch.py --batch catalog/v2/batches/b001-gpu4080-r2.json --root F:/PoseHub-v2-production/batches/b001-gpu4080-r2 --voice-manifest catalog/voice-v2/batches/b001-manifest.json
python -B -X utf8 tools/action-library-v2/report_library.py --production-root F:/PoseHub-v2-production --pilot-root F:/PoseHub-v2-pilot/neck-fix-r2 --check-files --generate --output catalog/v2/library-completeness.json
```

The library report resolves each action's own batch media root from
`production-plan.json`. Missing packages remain scheduled IDs rather than
fabricated successful packages. Keep source authorship, technical media
completion and six-layer release eligibility separate.
