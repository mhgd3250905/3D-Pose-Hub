# 样片任务卡草稿 · 旧动作修复 r1 第 1 批（给 hark-sk 复核后派渲染机；Hark-QUA 不派）

状态：**草稿**。hark-sk 用审计工具独立复核通过后，由 hark-sk 排队派发。只出样片，不上传、不切指针、不合并。

- 仓库 / 分支：`mhgd3250905/3D-Pose-Hub`，`codex/legacy-fix-r1`（提交见交付回报）。只在本分支提交上渲染。
- 动作（4 个；adductors-A 卡住未修、h-floor-nordic-hand-reset 误报，均不渲染）：

| id | recipe | 新 spec |
|---|---|---|
| h-short-side-plank | `catalog/production/legacy-fix-r1/recipes/h-short-side-plank.json` | `drill-anim/specs/h-short-side-plank-lfx1.js` |
| s-9090 | `catalog/production/legacy-fix-r1/recipes/s-9090.json` | `drill-anim/specs/s-9090-lfx1.js`（需要 `drill-anim/revisions/hark-4080-v1/s-9090-switch/spec.js`） |
| h-squat | `catalog/production/legacy-fix-r1/recipes/h-squat.json` | `drill-anim/specs/h-squat-lfx1.js` |
| deltoids-B | `catalog/production/legacy-fix-r1/recipes/deltoids-B.json` | `drill-anim/specs/deltoids-B-lfx1.js` |

- 输出目录：`F:/PoseHub-v3/runs/2026-11-2X_legacy-fix-r1-b1_<提交前 7 位>`（下称 `<out>`；新目录，不覆盖已有 run）。
- 命令（仓库根目录，**串行，一次一个动作**；与现有 V5 成片同一渲染器/打包器，tools/v5 未改）：
  ```
  node tools/v5/render-masters-v5.mjs --recipe catalog/production/legacy-fix-r1/recipes/<id>.json --root <out> --profile tools/v5/profile-v5.json
  python tools/action-package-v3/compose.py --root <out> --id <id> --profile tools/v5/profile-v5.json
  ```
  依次 `<id>` = h-short-side-plank → s-9090 → h-squat → deltoids-B。
- 产物：`<out>/masters/<id>/`（母帧）、`<out>/packages/<id>/v5-toon/`（loop mp4 / 封面等）。给开哥看的样片：各动作浅色 loop mp4（720p 若 profile 支持）。
- 注意：
  - s-9090 是按 Flare 文案重做的左右换髋（8 s 往返），现行 Hub 文字仍是旧的单侧前倾；文字草稿 `catalog/production/legacy-fix-r1/text/s-9090.json` 未审，换髋版 / 单侧前倾版由开哥选。
  - 裆部鼓包（h-squat 44 mm、s-9090 60 mm、deltoids-B 34 mm）是 V5 模型级问题，第 2 批统一修；样片里可能可见，属已知项。
  - 不上传 R2、不切任何指针、不合并、不打 tag。
