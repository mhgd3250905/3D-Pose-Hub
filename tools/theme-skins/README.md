# 主题皮肤 theme-r1

开哥 2026-11-16：App 动作引导素材要两套，跟随系统主题，不做皮肤切换功能。
- 浅色主题 light → tech-white
- 深色主题 dark → neon-night

素材来源：V4 全量渲染 F:\PoseHub-v3\runs\2026-11-12_v4_d6fb47c（249 × 5 皮肤，已渲完），只换皮肤，导出器与参数同 r2-v14
（x264 crf27 slow，720×1440 yuv420p，rgb 在上 alpha 在下；cover 640 / thumbnail 192 webp q80）。
对象键 pack/r2-v1/media/<id>/theme-r1/<id>.<light|dark>.{rgb-alpha.mp4,cover.alpha.webp,thumbnail.alpha.webp}，只追加。

## catalog 约定（之后的新 pack 写入，SDK 按此读取）
每个动作 `files` 增加：
```json
"themes": {
  "light": {"skin": "tech-white", "video": {...}, "cover": {...}, "thumbnail": {...}},
  "dark":  {"skin": "neon-night", "video": {...}, "cover": {...}, "thumbnail": {...}}
}
```
每个子项字段与现有 files.video/cover/thumbnail 相同（path、bytes、sha256、width、height、downloadUrl…）。
原 `files.video/cover/thumbnail` 保留不动，作为旧版 App 与缺主题时的回退。
