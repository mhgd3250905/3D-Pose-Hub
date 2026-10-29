# 训练人物制作基准

## 当前32模板与剩余219迁移的显式配方

2026-10-29本轮用户授权的模板迁移显式采用 `training-human-v3-armfix / 0.1.0-r2` 及当前手型、关节组件，参考 `catalog/production/remaining32-r4/`；下文v2plus配置仍是全局默认，不能代替本批配方，也不因本批工作自动改写全局默认。固定镜头、无地影、手腕/脚踝/肘部及接触要求见[经验手册](../docs/remaining219-template-handoff-20261029-r1.md)。远端弱云服务器按[专用入口](../docs/remaining219-remote-agent-20261029-r1.md)串行做少量关键帧，完整循环和最终验收留给主线。当前Git与验收身份以[版本台账](../docs/version-ledger.md)为准；冻结源和已发布素材继续保留。

## 全局默认与历史批次

用户于 2026-10-21 明确采用更新细节后的 `training-human-v2plus` 制作今后动作；默认原配色、动作肌群高亮、不显示肌群分区线，白金、蓝、绿、全息仅供显式选择。此决定取代本文件原先“新动作以及后续优化/重渲的旧动作必须使用 `modelProfile: 'training-human-v2'`”的要求。2026-10-12/13 的 v2 验收与旧素材仍作为历史保留。

新动作及用户安排的新版本重渲，统一读取 [当前生产配置](models/current-production.json)，说明见 [v2plus 制作标准](../docs/training-human-v2plus.md)。本次配置为 `training-human-v2plus` / `1.0.0-rc2`、`alignClavicles:false`，`v2plus` 使用 `outfit:'compression'`、`torso:'base'`、`limbs:'base'`、`hands:'base'`、`skin:'realistic'`；`head:'base'` 不启用，保留原 v2 灰色人台头。普通新 spec 须显式写入这套配置；HD 新建任务由生产配置生成包装规格，不能只改 profile 而漏掉新版网格开关。

人体配置与动作参数分开。更换人体不得擅改动作支点、髋部、腿轨迹、节奏或镜头；每项任务先检查预览、实际看图，再决定全片，并核对正面、侧面、完整循环和道具接触。试片只证明实际检查过的场景，不代表所有动作已验收。

已有约 200 份原 spec、v2 的 13 个冻结源、旧媒体与历史批次不批量修改。普通旧 spec 按原 profile 渲染；未指定 profile 的仍沿用历史行为。已有 HD 批次续作绑定其原 `source-manifest.json` 和原配方，不能套用当前生产配置。需要新版人体时新建规格修订、批次目录和输出，保留原件。

模型清单 [training-human-v2plus.json](models/training-human-v2plus.json) 与旧 [training-human-v2.json](models/training-human-v2.json) 分别固定各自身份。更改外观来源需建立新版本、登记固定源和验证记录，不能静默改旧模型。PR #12 与本地集成修复已于 2026-10-21 合入并推送 main，内容提交为 `315367ec2f072f0dc13d6a8e2a530cd453b9f17d`，当前状态见[版本对齐台账](../docs/version-ledger.md)。App 接入与全量动作验收仍待安排。
