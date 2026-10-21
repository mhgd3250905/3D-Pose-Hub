# Batch voice adapter

Each batch uses its own script, manifest, media root and work directory. Global
`catalog/voice-v2/script.json`, `manifest.json`, pilot media and HipLab are read-only.

```powershell
python -B -X utf8 tools/action-library-v2/build_voice.py --script catalog/voice-v2/batches/b001-script.json --manifest catalog/voice-v2/batches/b001-manifest.json --root F:/PoseHub-v2-production/batches/b001 --hiplab E:/AII-3D/3D-Hip --synthesize
```

Omit `--synthesize` for offline import and audit only. Defaults read existing
dependencies from `F:/PoseHub-v2-pilot/work/python-deps`; `--deps-dir`,
`--pilot-root`, and `--pilot-manifest` can explicitly select other read-only inputs.
Run as a fresh CLI process so `TEMP/TMP/TMPDIR` select the batch's `work/voice`.

The adapter verifies pinned HipLab build/audit and local audit snapshot SHA-256.
Import matches exact text, language, voice **and rate**; imported bytes are checked
before and after copying. SmartFit Chinese `+4%` is not a match for `+6%`. Completed
pilot clips and shared vocabulary can be copied without requesting TTS again.

New speech uses one sequential Edge TTS request. Default `--attempts 1` makes no
blind retries; an optional maximum of two attempts is available. Exhausting a
request stops further network calls and leaves missing lines pending. Raw cache
names include text/voice/rate/audit fingerprint. Existing different outputs are
never silently overwritten. A batch lock prevents two writers; manifest commits
are atomic and refuse a different script/tool fingerprint.

Every produced clip is decoded and audited with the pinned HipLab code. The
thresholds are -16 +/-1 LUFS, true peak <=-1 dBTP, mono AAC 44.1 kHz, plus silence,
truncation and duration checks. New clips retain raw-source comparison. The manifest
keeps `contentReview=pending-user-review` and `manualListening=pending`; technical
success does not approve wording or listening.
