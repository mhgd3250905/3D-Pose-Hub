# shoulder-axilla-r1 原型说明（joint-opt r1 · 阶段 B 第 1 步）

状态：**原型，默认关闭，未接入任何 recipe**。不在 `joint-corrections.mjs` 的允许列表里，没有 manifest，`reviewed:false`；不改 `recipe-scene.mjs`、模型、皮肤、manifest、哈希或 current/approved 指针。

## 问题与诊断
举臂超过约 120° 时，躯干共享网格 `V3_Head_Neck_Torso_Shared_R26` 腋窝出现可见的翻面/尖折，实测在**腋窝前侧（前腋襞）**。
原因：腋窝有一条缝合带（每侧约 66–68 条边）。这些边在 `motion.reset()` 姿态下长 3–8 mm，在 bind（T 姿态）下长 50–70 mm，而且带上的 UpperArm 权重跨一条边从 ~0.1 跳到 ~0.9。手臂抬离 rest 后，带两侧回到 bind 时的相对位置，三角形被拉长 7–8 倍（中位）并折叠。
已排除的方向：LBS 体积塌陷（过渡带到关节中心的距离保持 1.00；换成 DQS 反而更差）、糖纸扭转（只保留摆动也一样）。Scapula 骨在所有动作中都相对 torso 不动（0°），这一点是次要因素。

## 纠正方式
权重覆盖层，并保证 rest 外观不变：
1. 安装时按 rest 位置焊接，找出每侧 UpperArm 关节 120 mm 内的权重断崖边（任一骨 |Δw| > 0.3）或缝合边（bind 长度 > 3 × rest 长度），并要求 UpperArm 权重 > 0.05。由这些边外扩 5 环，在区域内对完整骨权重向量做 60 次 Jacobi 扩散（λ = 0.5，边界固定）。
2. 用新权重在 reset 姿态反解每个区域顶点的 bind 位置和法线，使 rest 几何严格复现（自检误差 ~1e-13 mm）。区域：左 611、右 696 个顶点，不与其他网格的接缝顶点重合。
3. 每帧（`scene.onBeforeRender`，仅在 enabled 时）按抬臂角 `smoothstep(90°, 120°)` 分侧混合原 LBS 与覆盖层 LBS，写入区域顶点的 bind 位置和法线，让 GPU 用原权重属性画出目标；最外层 `renderer.render` 结束后恢复原值。
抬臂角定义与 shoulder census 相同：上臂轴（UpperArm→Forearm）与躯干向下轴（neck→pelvis）的夹角。

## 开关
```js
import {install} from './tools/joint-opt-r1/shoulder-axilla-r1.mjs';
await install(page,{enabled:false});                        // 安装但关闭：hooks 立即返回，不写任何属性
await page.evaluate(()=>{__shoulderAxillaR1.enabled=true;}); // 打开
await page.evaluate(()=>__shoulderAxillaR1.detach());        // 完全回退（摘掉 hooks）
```
`__shoulderAxillaR1.last` 记录每帧的抬臂角、渐入系数、写入顶点数和最大位移；`config` 记录区域规模、rest 自检误差等。

## A/B（生产链、无头 Chromium SwiftShader、阶段 A 阈值不变）
见 workspace `joint/stageB-shoulder-r1/`（ab.json、ab-overview.jpg、summary.md）。要点：
- 关闭时与不安装逐顶点一致：9 个动作 × 2 帧 × 全部网格位置和法线，最大差 0.0；打开后再关，恢复也是 0.0。
- 区域外顶点（含其他网格）最大位移 0.0。
- 3 个试点 6 个侧位全部从"问题"变为"非问题"。
- 已知问题：区域内单点最大位移约 93 mm，是缝合带回到连续表面的位移量。生产皮肤和法线明暗还需人工复看。
