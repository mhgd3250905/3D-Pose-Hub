# training-human-v2plus 制作标准

用户于 2026-10-21 明确采用更新细节后的新版人体制作今后动作。默认是原配色、动作肌群高亮、不显示肌群分区线，白金、蓝、绿、全息是可选外观。本次选择替代旧 [v2 制作标准](training-human-v2.md) 对未来任务的要求，旧模型与验收记录保留。

PR #12 与集成修复已于 2026-10-21 经用户同意合入并推送 main，内容提交为 `315367ec2f072f0dc13d6a8e2a530cd453b9f17d`。生产配置采用 `training-human-v2plus` / `1.0.0-rc2`，实际合入身份、验证范围及尚未安排的全量重渲、App 接入见[版本对齐台账](version-ledger.md)。

`current-production.json` 的 `adoption` 和模型清单的 `status` 保留该固定版本在内容提交编制时的“待批准”注记；这两个描述字段不控制渲染或审批。当前 Git 状态以台账为准。保留固定配置、模型源和哈希，避免仅为流程状态改写已验收模型身份。

## 新任务使用哪套配置

唯一生产入口是 [current-production.json](../drill-anim/models/current-production.json)，模型固定源见 [training-human-v2plus.json](../drill-anim/models/training-human-v2plus.json)。模型支持的可选功能与生产默认分别管理。普通渲染对显式选择的 `training-human-v2plus` 补齐生产默认；`--model-profile current` 可让旧规格另出新版人体试片，未指定覆盖时普通旧 spec 保留原 profile。批次与新 spec 仍显式记录完整字段，以便查清实际使用的配置。

新 spec 显式采用下列字段；HD 新建任务从生产配置读取同样的字段并写入批次包装规格：

```javascript
export default {
  id: 'new-drill-id',
  modelProfile: 'training-human-v2plus',
  alignClavicles: false,
  v2plus: {
    outfit: 'compression',
    torso: 'base',
    limbs: 'base',
    hands: 'base',
    skin: 'realistic',
  },
  // 动作姿态、节奏、镜头、高亮与 QA 由具体动作定义。
};
```

躯干、四肢和手采用更新后的基础网格与手指骨骼；原配色的紧身训练服、原 v2 灰色人台头保留。省略 `head`，不启用 `head:'base'`。`skin:'realistic'` 表示原配色外观、无皮肤预设的彩色分区描边，不代表照片写实材质；肌群高亮仍由动作配置决定。默认不启用 `regions:'baked'`，也不因更换人体批量改变动作的高亮或主题。

白金 `tech-white`、蓝 `neon-night`、绿 `neon-night-b`、全息 `hologram` / `hologram-b` 只在用户选择或明确试片任务中启用。它们使用肌群分区描边，需独立预览；不能把任选皮肤写成默认生产外观。显式 `skin:'default'` 关闭皮肤预设，省略 skin 时普通解析补齐生产默认 `realistic`；批次仍记录完整字段。

## 新制作、历史复现与验收

普通旧 spec 继续按原 profile 渲染；未指定 profile 的旧规格保留历史行为。现有约 200 份规格不批量改写，v2 的 13 个冻结源、历史批次、旧媒体和已发布 ZIP 不改。用户安排将旧动作换成新版人体时，新增 `<id>-r2.js` 等修订或新 HD 包装批次，登记哈希并另存输出。

HD 新任务使用新目录，由 `current-production.json` 固定模型版本、配置及来源。已有批次的 resume 沿用原 `source-manifest.json`、原模型、原配方及所需工具；当前生产配置更新不会迁移旧批次。来源不兼容时保留旧目录，按原冻结环境复现或新建新版批次，不能清理、覆盖后冒称续作。

先出关键帧、实际看正侧面、支撑点、手型与道具，再决定全片；继续遵守整机最多两路渲染、每路 `--jobs 1`。更换身体不应改动支点、节奏、轨迹或相机。已有双场景试片仅覆盖实际检查的姿势；未检动作、全片循环、主题组合与 App 播放另行验收，数值 QA 通过不替代看图。

## 版本和来源

旧 [training-human-v2.json](../drill-anim/models/training-human-v2.json) 继续固定 v2 原始源；新版清单固定新增 loader、运行脚本与模型数据。更换任一固定源必须另建版本并记录验证，不沿用旧身份。模型开发过程、被否决的头部尝试和当时限制见 [原型记录](training-human-v2plus-proto.md)，不要将历史尝试当成当前默认。

Blender Human Base Meshes v1.4.1 基础网格来源及许可见 [SOURCE.md](../assets/blender-studio-source/SOURCE.md)。审核图字体的来源与 OFL 附件在 [FONT-LICENSE.md](../tools/human-v2plus/regions/FONT-LICENSE.md)；字体仅供审核图，不是 App 媒体素材。人体制作标准、模型代码合入、动作验收、App 接入及媒体发布是独立状态，分别记录。
