# app-pack r2-v3（草稿，未上传）

- 底：`release/app-pack-r2-v2`（rhythm.execution 左右轮流字段）。packVersion `r2-v3`，previousPack `r2-v2`，min_sdk 不变（0.8.0）。
- 94 个修复动作（`tools/app-pack/r2-v3-media-sources.tsv`）换新媒体：`media/<id>/r2-v3/<id>.{rgb-alpha.mp4,cover.alpha.webp,thumbnail.alpha.webp}`（另传 poster.alpha.webp，不进目录）。
- 其余 155 个动作原样引用 r2-v1 已有对象，不重传；语音全部沿用 r2-v1。
- 媒体前缀 `pack/r2-v1/`（SDK/App 只认一个前缀，见 `poseHubMediaPackOf`），新对象键全是新路径，不覆盖任何已有对象；目录在 `pack/r2-v3/`。
- 本目录只有草稿：`catalog.draft.json`（94 个新文件 bytes/sha 为 null）、`plan.json`（376 个新对象键）、`report.json`。
- 定稿在本机导出媒体后运行：
  `python tools/app-pack/build_r2_v3.py --out F:/PoseHub-v3/app-pack/r2-v3 --source-commit <完整提交号> --media-root F:/PoseHub-v3/app-pack/r2-v3 --published-at <ISO 8601>`
  产出 catalog.json、catalog/catalog.json、channels/*.json（不上传）、report.json、media-receipts.json。
- 切 channels 指针、打 tag 需用户批准。
