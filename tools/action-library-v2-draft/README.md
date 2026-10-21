# First-pass draft rendering

This pipeline produces unreviewed drafts. It never creates review approval or release eligibility. Existing production renderers and their source fingerprints remain unchanged.

```powershell
node tools/action-library-v2-draft/run_draft.mjs --queue <queue.json> --root <absolute-output-root> --coordinator-root <shared-production-root> --runtime <runtime-profile.json> --workers 2
```

The queue accepts `actions` with `id`, repository-relative `spec`, `peakFrame`, and `renderState`. Only `native8-ready` entries render. `reuse` entries and sources needing separately authored native-eight-second motion are excluded. Existing motion is never stretched. The model is explicitly resolved through the current production entry, at 1080 square and 30 fps.

Each worker owns one browser. The shared production lock and 50 GiB free-space check apply before dispatch. Actual WebGL hardware is verified through the unchanged runtime guard. Source changes, rendering failures, invalid PNG files, or empty body frames stop new dispatch; in-flight work finishes. Partial output is preserved and cannot be overwritten. Completed actions skip only when their source, runtime, manifests, sequence indexes and file references match.

`masters/<skin>/<id>/` contains frames 0–239. Frame 240 is an independent endpoint under `qa/endpoints/`. Matching measured geometry permits canonical highlight/shadow sharing. The renderer does not run additional seam-pixel or physical-quality acceptance scans. Pose warnings remain evidence for later user review.

Completed receipts are `manifests/completed/full-<id>.json`, format `pose-hub-draft-completed-render@1`, with `reviewed:false`, `status:"draft-unreviewed"`, `releaseEligible:false`, source/runtime bindings, five manifest references, and the actual GPU proof. No review SHA is present.

Finite run state is `manifests/draft-run-status.json`. Its `status` is `running`, `completed`, or `failed`; `terminal`, `actionIds`, and `completedActionIds` let a downstream CPU supervisor stop after handling the run. Immutable queue/result records remain under `manifests/runs/`.

The small integrity check validates PNG signature, dimensions, RGBA encoding, chunk CRC, file SHA and byte count. Startup body frames and suspiciously small PNGs are decoded to detect blank bodies. This is file integrity, not anatomical, editorial, visual or medical approval.

Tests: `node --test tools/action-library-v2-draft/run_draft.test.mjs`.

`cpu_queue.py watch --root <draft-root> --inventory <whole-library-inventory.json>` consumes completed draft receipts and composes the unchanged approved media recipe. Run exactly one whole-library CPU supervisor on this machine, after any earlier batch CPU queue has exited; it owns at most two workers and pauses new work below 4 GiB available RAM or 50 GiB free disk. Do not launch another root or manual `compose` job alongside it. Completed variants remain explicitly unreviewed and ineligible for release. Failed or interrupted encode output is retained for a new revision. The receipt's bound peak frame takes precedence over a preliminary inventory peak.

`run_remaining.py` is the finite continuation for this production run: it waits for the current 110-action queue to complete and release the shared render lock, then starts only the twelve independently adapted sources. It stops for inspection after an unexplained exit or render failure, without restarting a renderer.

`review.py` builds the local 142-action viewing index from actual existing media. It reads the current inventory, accepts no review approval, and preserves failed/missing/pending states. Browser feedback is stored locally until the user exports it; no upload or catalog review is implied.

CPU contract regressions: `python -B -m unittest discover -s tools/action-library-v2-draft -p test_cpu_queue.py`.
