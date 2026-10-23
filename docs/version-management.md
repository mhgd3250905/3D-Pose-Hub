# Pose-Hub 版本管理

版本号必须带上所属对象。AI 目录、动作规格修订、人物模型和媒体发布分别管理；本页规定记录方式，实际版本与接入状态集中在[版本对齐台账](version-ledger.md)。

## 事实源与版本对象

| 对象 | 当前事实源 | 版本或标识 | 记录边界 |
| --- | --- | --- | --- |
| AI 动作目录 | [catalog.json](../catalog/catalog.json)、[Schema](../catalog/catalog.schema.json) | `version` 与 `formatVersion` | 稳定动作 id、剂量、侧别、注意部位、素材位置；生成规则见 [catalog/README.md](../catalog/README.md) |
| 人工裁定 | [overrides.json](../catalog/review/overrides.json)、[taxonomy.json](../catalog/taxonomy.json) | 随目录内容版本及 Git 提交 | 更正先入裁定数据，再重建目录与审阅表 |
| 动作规格 | `drill-anim/specs/`，源哈希由 `drill-anim/verify.mjs` 与候选表固定 | `<id>-r2.js`、`-r3.js` 等修订文件及 LF SHA-256 | 原版不覆盖；[spec 总表](drill-catalog.md)含历史修订，文件数不等于稳定动作数 |
| 人物模型 | [当前生产配置](../drill-anim/models/current-production.json)、[v2plus 清单](../drill-anim/models/training-human-v2plus.json)；[v2 冻结清单](../drill-anim/models/training-human-v2.json)保留 | 生产配方、profile id、模型 `version`、各固定源 SHA-256 | 改固定源须建新模型版本；配方只影响新任务，旧批次按其原 manifest 续作 |
| 独立动作模型修订 | 新修订目录的 `manifest.json`、限定的 spec / loader 及候选登记表 | 各自的 profile、`version`、固定源 SHA-256 和 `scope` | 仅用于明确列出的动作；保留失败版与旧版，不自动升级全局生产配方；用户确认范围另由台账引用原确认记录 |
| App 媒体 ZIP | [media/manifest.json](../media/manifest.json)、`media/releases/<版本>.md` | 独立媒体版本、ZIP SHA-256 | `published` 条目及 ZIP 固定，内容变化另发版本 |
| 制作素材云端归档 | [同步规则](material-cloud-sync.md) | 动作 id、变体与内容指纹 | 不是 App 发布版本；上传校验与制作 QA 分开记录，后续同步由用户请求触发 |

`catalog 0.2.0` 和 `media 0.2.0` 不是同一次发布。App 自身版本、SDK 版本和 lock 的媒体版本也不能互相替代。当前汇总见台账，不在不同入口各维护一份版本数字。

## 人体制作版本与生产默认

2026-10-21 用户选择新版人体制作今后动作，默认配方由 `drill-anim/models/current-production.json` 管理：`training-human-v2plus` / `1.0.0-rc2`、`alignClavicles:false`，compression 训练服、base 躯干/四肢/手、原 v2 头（head off）、`skin:'realistic'`，保留动作肌群高亮，不显示肌群分区线。白金、蓝、绿和全息仅为可选皮肤，详见 [v2plus 制作标准](training-human-v2plus.md)。PR #12 和集成修复已合入并推送 main；具体 SHA 和证据见台账。App 接入与全量动作验收仍单独跟踪。

模型固定清单及生产配方中的流程描述是该版本编制时的注记；当前合入、推送、动作验收与媒体发布状态集中维护在台账，不为改变这些状态改写已固定来源和模型身份。

PR15 的 native-r3 手部及握持、过头臂屈伸、脚背拉伸、低位穿针修订按各自清单登记实际版本，汇总见台账。手部外观确认不升级整个动作的审核字段；旧清单的编制状态保留。只有审阅片、没有五皮肤分层母版和完整六层审核时，不据此递增 AI catalog、公开媒体或 App 版本，也不把独立候选写成全局生产默认。

模型版本固定源码与数据，生产配置选择该版本的一组参数；两者均须随新批次记录。新建 HD 任务读取当前生产配置，已有批次 resume 使用其原 `source-manifest.json`，不能自动切新版。原约 200 份 spec、v2 的 13 个固定源、旧媒体、已发布 ZIP 与历史记录保持原样；重渲另建批次/修订与输出。检查证据记录实际场景和输入 SHA，不能由双场景试片推断全部动作已通过。

## 目录版本与固定来源

沿用 [catalog/README.md](../catalog/README.md) 的规则：PATCH 修文字和标签；MINOR 增删动作、改剂量或范围、改变素材；MAJOR 改字段含义，同时升级 `formatVersion`。同一格式只加可选字段，消费端忽略未知字段时仍须满足处方执行语义；新增 `holdSeconds` 的动作必须在消费端支持后才启用。

每次记录以下身份，避免将“生成时的提交”当作“交付内容提交”：

- `catalog.source.commit`：生成时 Pose-Hub 工作基线；`source.inputs` 是读取各 App 数据的固定提交。
- 内容提交：实际包含该目录版本与工具的完整 Git SHA。
- 合入提交：经审核、用户同意后进入 main 的完整 SHA。
- 发布引用：实际建立的目录 tag 或固定提交；未建立 tag 时明确记为“未打 tag”，不能把合入写成已发布或已接入。

目录发布 tag 如另行安排，应使用与媒体、模型可区分的名称，并把确切 tag、内容 SHA 和消费端兼容性登记到台账；本次收束只提交文档，不创建 tag 或发布包。

## 更新与验收

1. 确认来源提交、目标动作与更正原因；修改人工 overrides，不直接编辑生成物。剂量裁定同时核对次数或秒数、每侧语义、组数、休息、每次停留与范围。
2. 按 `catalog/README.md` 生成、Schema/语义校验、核对 spec 哈希与道具，再生成审阅表、CSV 和缺项表。有各 App 授权副本时传入 `--app-root` 检查外部来源；未传的来源不得记为已检查。
3. 记录实际检查数量：路径存在性和文件哈希分别统计，未提供 SHA-256 的来源不能记为哈希通过。对关键修复用反向样本证明检查会报错。
4. 审核以固定源和目标 SHA 为单位；结束前重新核对。经用户同意合入后，台账登记 PR、内容与合入 SHA，以及仍待完成的消费端事项。
5. App / SDK 接入时另外验收解析、剂量、左右切换、停留、计时、语音和播放流程。目录 `completeness.complete` 只表示定义与媒体配套条件，不表示消费端或医学审核通过。

本仓库的常用本地检查：

```bash
python catalog/tools/validate_catalog.py --check-files
node drill-anim/verify.mjs
git diff --check
```

目录生成与外部路径校验的完整命令在 [catalog/README.md](../catalog/README.md)；成片 lock、ZIP 下载和同步流程在 [consumers.md](consumers.md)。已经通过且源状态不变的验证可复用，须记录原 SHA、时间、命令和适用性；文档调整不触发重新渲染或媒体发布。

## 台账维护

台账的状态区分为：目录已合入、媒体已发布、消费端待同步、待验收、已验收。关闭待办必须补上对应 App / SDK 提交和验收证据，不能以“目录已合入”关闭消费端事项。

历史发布记录、批次、QA 与旧规格保持原样。版本台账作为当前汇总，引用它们并记录新的决定，不改写当时的发布事实；云盘制作归档也不改变 App ZIP 的范围。
