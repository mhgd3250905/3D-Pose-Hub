# 人体与场景手型的版本入口

**当前本地外观基线为 `original-head-eye-soften-20261110-r1`。** 用户已确认原头型、五官和眼窝深度保留，只柔化全身与头部明暗及眼窝内部交界。批准来源见 [确认记录](body-v3/approved-look-20261110-r1.md)，入口为 `tools/preview-current-model.mjs` 和 `drill-anim/models/current-approved-look.json`。

五皮肤修复采用独立版本 `skin-coverage / 0.1.0-r1`，已完成所列技术验证，待用户视觉复核。它修复固定握持手及腕桥的全息效果和头颈材质跟随，并关闭四套非默认皮肤的边缘光。默认 realistic 延续批准效果。入口为 `tools/preview-current-skins.mjs`，新母帧入口为 `tools/skin-coverage-r1/render-masters.mjs`，来源由 `drill-anim/models/current-skin-coverage.json` 固定。详见 [皮肤修复记录](body-v3/skin-coverage-r1-20261110.md)。

完整实现位于 `E:/AII-3D/3D-Pose-Hub-worktrees/human-polish-v3-20261110` 的 `codex/skin-coverage-r1-20261110` 分支，固定源码为 `3b74fb565f0195dbf16e6c34aafdb6f261fcf785`。主目录基于历史 v2 快照 `36e1bb6`，仅保存当前入口和版本说明。缺少新版来源时使用完整工作树。动作 recipe 负责选择人体、动作修订和左右手型，v2plus rc2 全局配方适用于沿用该配置的流程。

`faceless-head-r1`、`head-detail-simplify-r1` 和旧 v2plus 美化试验保留历史身份。关节优化另交接，当前外观版本是接手时的对照基线。

美化、预览或重渲前，在准备工作的同一个 checkout 执行版本检查。

```powershell
node tools/model-version.mjs --recipe catalog/production/remaining219-r1/recipes/h-squat.json --out F:/PoseHub-v3/qa/new-review/model-version.json
```

`--recipe` 必须指向本 checkout 内的配方 JSON。工具复用生产 `loadRecipe`、模型注册表及源码指纹，校验配方绑定的 spec 哈希、人体冻结源与 native 手型预设。缺文件、错误模型、哈希漂移和已有输出都会报错。输出记录 Git 提交及工作区是否有改动、recipe/spec 身份、人体版本、左右手模式、手型适配器与姿态、组件及来源指纹。

预览必须继续使用同一配方经 `loadRecipe/openScene` 建立场景。实际渲染时再记录安装的人体、手部源资产、左右场景手型与可见网格。仅出现 `V2P_Base_Hands` 名称不足以证明用了目标手部版本；版本检查报告也不代替这一步。

## 当前来源关系

| 维度 | 权威入口 |
| --- | --- |
| 人体及骨架兼容 | `tools/action-package-v3/models.json`、recipe 的 `model`、对应 loader 和 manifest |
| 场景手型 | recipe 的 `hands`，经生产 adapter 选择 native 或固定握持与腕部组合 |
| 动作修订 | recipe 的 `spec` 与 `specSha256Lf` |
| 人体外观 | 已确认底座走 `current-approved-look.json`，五皮肤修复走 `current-skin-coverage.json`，各自按上方入口核验 |
| 已发布素材 | 对应发布包的 catalog、sources/receipts 和母版 source-manifest |
| 本地正在修改的版本 | 当前 checkout 的 recipe、Git 提交及源指纹，需另记是否待验收 |

本地修订可能晚于发布包。复现已发布画面时先查该版本的来源回执，再定位其固定提交和配方；不能用当前分支的同名 recipe 替代历史来源。新增纯着色版本可作为独立 appearance 候选管理，人体和场景手型仍由原 recipe 决定。

## 交付记录

每次交付给图片或帧目录附上版本报告、有效配方、实际渲染手型证据和外观候选的版本/哈希。报告区分关键帧看样、完整循环、用户确认与公开发布。源码与 manifest 的批准范围沿用其原记录，新增美化不能扩大旧手部或全身的验收范围。

已查明 2026-11-10 早先美化图使用旧 `36e1bb6` 工作区的 v2plus 默认人体，漏掉后续配方的人体和手型。该批图已撤回当前版本候选身份，仅保留为旧基线实验。
