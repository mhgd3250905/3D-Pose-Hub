# App 素材包 r2-v4（2026-11-06）

r2-v3 + 补齐 27 个动作的语音。媒体（视频/封面/缩略图）全部沿用 r2-v3 引用，一个都没换。

- 生成：`python3 tools/app-pack/build_r2_v4.py --source-commit 6def4fa6640f692ae78ab835449619d1dd5b510d --published-at "Fri 2026-11-06 12:36 PM CST (UTC+08:00)"`（可重复，产物逐字节一致）
- catalog.json：4,139,290 B，SHA-256 d669191373383ed9e7568e89dd169db85337b8f5385f0bcc30b478ebc9775690
- 249 个动作语音全部 ready（2490 个语音文件），pendingVoiceIds 为空；min_sdk 0.8.0 不变。
- 修正：pendingVoiceIds / voiceFiles / voiceBytes 现在按 actions[].voice 重新统计（r2-v1～v3 只列了 1 个 pending、文件数写成 2480，实际 27 个 pending、2220 个文件）。
- 新语音对象键：pack/r2-v1/voice/<id>/<lang>/<clip>.m4a（SDK 单前缀；上传前已确认 270 个键线上全是 404，h-supine-cactus-chest 线上也没有旧坏文件，所以不用改路径）。
- 目录对象键：pack/r2-v4/{catalog.json, catalog/catalog.json, report.json, media-receipts.json}。
- 上传物：upload/posehub-r2-v4-upload.zip（zip 内路径 = 对象键，共 274 个文件 + plan.json），SHA 见 upload/zip.sha256 与 upload/SHA256SUMS。
- channels/*.json 是切指针用的，**不上传**，切换要用户批准。
- 语音源：voice-fill-r1/（见其 README）。
