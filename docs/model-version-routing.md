# 人体与场景手型的版本入口

2026-11-10 后续眼窝要求：保留眼窝深度与形状，仅柔化内部锐利交界。增量候选 `eye-socket-soften / 0.1.0-r1` 只处理局部法线和凹陷暗色过渡，位置/拓扑/蒙皮不变，见 `docs/body-v3/eye-socket-soften-r1-20261110.md`。

2026-11-10 头部方向已收敛：保留原头型和五官，仅平滑明暗。当前独立候选为 `head-surface-smooth / 0.1.0-r1`，见 `docs/body-v3/head-surface-smooth-r1-20261110.md`。`faceless-head-r1` 和 `head-detail-simplify-r1` 已被用户停止，不得复用为默认头。

实际制作以动作 recipe 的显式选择为准。`drill-anim/models/current-production.json` 仍保留 v2plus rc2 历史全局默认；后续动作已通过 recipe 采用 `training-human-v3-armfix / 0.1.0-r2` 及场景手型。不能用旧默认配置推断某个当前动作的实际人体。

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
| 实际生产外观 | `tools/action-package-v3/skins/realistic.json`，使用 `look-approved-r2`、`pump-r1` 和 body rim 0.5 的 11 月 1 日确认配方 |
| 已发布素材 | 对应发布包的 catalog、sources/receipts 和母版 source-manifest |
| 本地正在修改的版本 | 当前 checkout 的 recipe、Git 提交及源指纹，需另记是否待验收 |

本地修订可能晚于发布包。复现已发布画面时先查该版本的来源回执，再定位其固定提交和配方；不能用当前分支的同名 recipe 替代历史来源。新增纯着色版本可作为独立 appearance 候选管理，人体和场景手型仍由原 recipe 决定。

## 交付记录

每次交付给图片或帧目录附上版本报告、有效配方、实际渲染手型证据和外观候选的版本/哈希。报告区分关键帧看样、完整循环、用户确认与公开发布。源码与 manifest 的批准范围沿用其原记录，新增美化不能扩大旧手部或全身的验收范围。

已查明 2026-11-10 早先美化图使用旧 `36e1bb6` 工作区的 v2plus 默认人体，漏掉后续配方的人体和手型。该批图已撤回当前版本候选身份，仅保留为旧基线实验。
