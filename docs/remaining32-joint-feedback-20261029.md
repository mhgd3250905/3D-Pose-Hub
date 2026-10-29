# 32动作模板：关节与手型反馈修订（2026-10-29）

> 本文保留当时的候选快照与验证计数。当前采用版本、最新预览和局部用户确认以[优化版本快照](production-snapshots/remaining32-template-optimizations-20261029-r1.md)为准；原JSON报告不改写。

当前阶段为可复用动作模板及低清预览，正式高清生产、用户验收和素材发布尚未开始。颜色及高亮材质保持可选参数。既有冻结人体、失败试版和历史验收记录保留。

## 已复核候选，等待用户验收

- `h-inner-thigh`：独立规格 `h-inner-thigh-r5.js`，双手放松，校正右手掌朝向。`overnight/h-inner-thigh/attempt07`。
- `t-lsit-tuck`：共用 `elbow-dqs-r1/0.1.0-r1`，修正前臂轴转造成的线性蒙皮夹缩。`overnight/t-lsit-tuck/attempt07`。
- `t-flare-side-hold`：同一肘部组件和参数，`overnight/t-flare-side-hold/attempt08`；完整241帧、骨架与手掌方向保持原样，无新警告。

以上预览根目录为 `F:/PoseHub-v2-production/remaining32-template-r2-20261029/`。每个候选的 `capture.json`、`review/review.json` 和 `visual-review.json` 分别保存捕获、媒体哈希与看样记录。`reviewed:false` / `releaseEligible:false`，候选通过不等于用户通过。

## 脚踝共用候选与失败试版

共用模块在 `tools/action-completion-v3-r2/ankle-join-r*.mjs`，仅明确选择它的动作配方生效，未改冻结人体默认入口。

- r1：椭圆轮廓替换产生前侧鼓包和上端台阶，且新增皮肤/鞋面交叉，拒绝。
- r2：保留真实轮廓，鞋面交叉消失，但实际近景仍有折角和凹槽，拒绝。
- r3：曲率连接与局部平滑试版，实际捕获被接缝检查拒绝；空间舍入分组没有可靠焊接显式接缝对应顶点。早期CPU导出沿用了原始接缝字段，不能当作修订后接缝证据。

- r4：显式拓扑接缝及真实运行时复现测试修复开缝，实际近景接缝通过；熊式踝前仍有深凹纹，未通过候选外观。
- r5：定位到残留缺陷跨越旧的+14mm保护边界，将共同下锚扩展至鞋口内-18mm，基于真实非对称三角面截面重整曲线。臀桥frame0/熊式frame60实际近景已通过候选复核；鞋口浅凹纹和toon分层仍需用户接受。

r5清单为 `drill-anim/models/ankle-join-r5/manifest.json`，明确绑定 `training-human-v3-armfix/0.1.0-r2` 及源码哈希。臀桥/熊式配方已选择该组件；其他动作的站姿和pike近景仅作为同参数回归验证，不擅自改全库生产入口。臀桥及熊式 `attempt08` 各241帧完整循环已通过独立候选复核；同旧版关节点和足部实际朝向完全一致，脚底接地，无新的变形stress、跳转或求解警告。几何统计不能代替视觉确认。

## 使用限制

肘部组件通过逆线性蒙皮表达局部DQS目标。已验证约97度与145度轴转的两动作；接近180度的奇异变换及新模型需要单独验证，不宣称任意人体直接安全复用。脚踝与肘部组件、动作、镜头及材料分别版本化。

本地对照入口： http://127.0.0.1:8844/feedback-20261029/ 。原始PNG按字节复制，来源及哈希写入 `comparison-manifest.json`。

## 本轮收尾证据

`catalog/production/remaining32-r2/feedback-candidates-20261029.json` 固定本轮5项配方、组件、完整捕获、视频及视觉复核记录的哈希。21项针对性测试、402规格校验、7项可移植性测试通过；当前30个候选清单及视频解码检查全部通过。新审计写入 `overnight/feedback-candidate-audit.json`，原始 `candidate-audit.json` 保留。

所有修订仍待用户验收；浅鞋口凹纹和toon明暗分层保留在原始PNG对照中。本轮未执行正式高清生产、发布或远端推送。
