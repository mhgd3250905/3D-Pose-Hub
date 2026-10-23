# PR15 独立模型的连续预览入口

`drill-anim/tools/review-special-profiles-r1.mjs` 是本地审核入口 `special-profile-review/1.0.0-r1`。它显式加载 067 的 contact-wrist/r5.1、086 的 barefoot-bridge/r5.2，以及已接受手部的两个 native-hands/r3 动作。未知动作、版本不匹配及失败的 grip profile 均拒绝执行，不会悄悄退回基础人物。原 `lib/render.mjs`、冻结模型和既有发布目录不变。

执行示例（输出目录必须尚不存在）：

```powershell
node drill-anim/tools/review-special-profiles-r1.mjs preview drill-anim/specs/h-wall-palm-lift-rr5.js F:/PoseHub-v2-pilot/new-batch/067-preview
# 实际查看预览帧后再运行：
node drill-anim/tools/review-special-profiles-r1.mjs full drill-anim/specs/h-wall-palm-lift-rr5.js F:/PoseHub-v2-pilot/new-batch/067-full --preview F:/PoseHub-v2-pilot/new-batch/067-preview
```

预览采样 0、30、60、90、120、150、180、210、239、240 共 10 帧；完整模式采样 0–240 共 241 个姿态，视频只含 0–239 共 240 帧。固定 30 fps、8 秒、720×720、H.264；原肤色、深色背景、原肌群高亮，无地面阴影。提踵规格原为 15 fps，这个审核入口按时间函数重新采样到 30 fps，报告同时记录 `sourceFps` 和实际 `fps`。这是审核视频，不是发布母版或 App 素材。

完整模式要求本工具生成的完整预览报告，核对动作语义内容、模型清单及工具 SHA-256，并重新核对每个预览 PNG。已存在的输出目录一律拒绝，不覆盖失败或早先尝试。页面异常、非有限关节点、加载器哈希异常及编码不符会留下 `failed.json`；成功后生成含逐帧诊断、文件字节数和 SHA-256 的 `review.json`。记录首尾关节点误差及 PNG 是否完全一致。

网页自身的控制面板会留下构图 insets 和 viewOffset。审核入口在使用规格 camera recipe 前清除这些 UI 偏移，避免人物缩在上半幅；这不改变动作轨迹。第一次发现偏移的 067 预览保留在 `F:/PoseHub-v2-pilot/pr15-special-review-20261024/067-preview`，应以随后新生成的 `067-preview-r2` 为审核输入。

## 边界

所有帧都有原关节、限位、胶囊及求解器诊断，但这些不等同于完整人体三角面交叉或接触验证；特别是旧 `handClip` 不包含专用模型的全部着色器形变。不得据此把旧 generic QA false 改成 true：067 的掌根有意撤离墙面，固定 palm-center pin 不适用其四个指端接触区；086 的旧脚/鞋接触指标也不能替代完整裸足的真实表面支撑检查。专用接触证据、既有失败尝试和待审核状态保留。完整视频补充连续外观证据，并不自动批准发布或证明全模型通用。

## r2 与标准人物动作

`review-special-profiles-r2.mjs` 保留 r1 的命令格式，额外接入 `h-db-overhead-triceps-extension-rr2` 的标准 `training-human-v2plus/1.0.0-rc2` 和 `h-kneeling-instep-stretch-rr6` 的独立 `instep-native/r1` 组合。标准 loader 本身不验证冻结清单，因此 r2 在渲染前后另核对基础模型清单的全部 LF 规范化源哈希。r1 保留为独立版本，既有预览的工具 SHA 不因扩展新动作失效；r2 完整模式也要求由 r2 生成的匹配预览，不跨工具版本混用。r2 另加明确的 8% 审核相机距离余量，因为 joint-fit 包围盒没有覆盖头顶/指端的全部网格；该构图因子写入报告，动作规格和轨迹不变。

## 本次已完成记录

- 067：`F:/PoseHub-v2-pilot/pr15-special-review-20261024/067-full/review.mp4`，240 帧、8 秒、201,203 字节；241 个姿态的 solver/diagnostic 警告均 0，首尾关节点误差 0 mm，首尾 PNG 相同。实际查看了 0/30/60/90/120/150/180/210/239/240 的全身联系表 `contact-sheet.png`。
- 086 旧 rr5：`086-full/review.mp4`，240 帧、8 秒、256,623 字节；241 姿态 solver/diagnostic 警告均 0，首尾关节点误差约 1.5e-11 mm，PNG 相同。实际查看 10 帧联系表发现头顶贴边/局部切边及旧版自由手指形，不能作为最终交付。保留该尝试，新的 rr6 组合和 r2 构图另取证，不覆盖旧文件。
- 提踵 rr7 / native-r3：`calf-full/review.mp4`，240 帧、8 秒、321,298 字节；241 姿态 solver/diagnostic 警告均 0，首尾关节点误差 0 mm，PNG 相同。已实际查看完整周期的 10 帧联系表；沿用已接受的手部比例和姿态。

## r3 固定镜头与新握持

`review-special-profiles-r3.mjs` 接入 073 的 `h-fixed-bar-vertical-pull-rr7` / `native-grip/r1` 以及 094 的 `h-db-overhead-triceps-extension-rr3` / `overhead-native/r1`，均按精确动作 ID、profile、版本选择专用 loader。r3 不再接受旧 086 rr5 或旧 094 rr2。仍然需要同版本工具生成并经查看的预览。

臀推规格使用 14 度 FOV。原冻结 `setupCamera` 的顺序是先按旧 FOV 拟合，再设置新 FOV，因此 r2 预览发现明显横向裁切。`hip-preview` 保留为失败构图证据；r3 在调用原相机拟合前先设定规格 FOV，使拟合与实际渲染镜头一致，再加 8% 审核余量。冻结 engine、规格、身体轨迹均未改。
