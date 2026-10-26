# native-open-r2：手掌撑地贴地 + 颈部三通道（opt-in）

`native-open-r1` 的后继入口，给**新 spec** 用。r1 及其加载的所有固定源（`hands-native-r3/*`、`grip-native-r1/*`、`page/engine.js`、`page/human-v2plus.js`、`lib/render.mjs`、`runtime/src/coach-motion.js` 等）一字未改；走 r1 或 `drill.py render` 的既有 spec 像素不变（见 `docs/reviews/engine-palm-neck-20261026/`）。

r2 只在 spec 显式写了下面这个字段时生效（同时仍需 r1 的 profile + 版本字段）：

```js
s.modelProfile='training-human-v2plus-hands-native';
s.nativeHands={version:'1.0.0-r3'};
s.nativeOpen={entry:'native-open-r2'};
```

所有改动都在 `runtime.js`，以运行时包装方式注入页面（与 `page/human-v2plus.js` 包装引擎的做法相同）。

## 1. 手掌撑地（palm-floor）

**原因。** 冻结的 `coach-motion.js getGroundHandPose()` 用旧 Snow 手测得的掌面坐标系（palmLong/palmNormal）给撑地手定朝向，并用隐藏的旧手顶点定手腕高度。native r3 手按 CC0 原始手 1:1 重建，掌面方向与旧手差约 **35° 滚转 + 16° 俯仰**，r3 的 `palm-floor` 手指姿势又是全 0（原始手指自然微屈、拇指向掌侧垂下）。结果：按旧掌面放平时最低点落在拇指/指尖上，掌根到掌心主体悬空约 22–28 mm（静态复算：掌体 20% 分位 22.3 mm、中位 43 mm）；而真实渲染（r1 高度取自旧手）是拇指侧下沉、掌心悬空：拇指 −44.7 mm、鱼际 −19.3 mm、掌心中位 +11.3 mm。

**修法（只在 r2 页面内）：**
1. 安装时在可见的 native 手网格（`V2P_Base_Hands`，绑定姿态坐标系）上求**掌面本身**的接触平面：掌根两侧（鱼际/小鱼际）与掌指关节垫同时贴面、两侧平衡，网格搜索滚转/俯仰（3° → 1° → 0.25°）。左手结果 roll 35°、pitch −16°（右手镜像）。
2. 新的 native `palm-floor` 手指姿势：每根手指（及拇指）绕自己的 flexAxis 伸/屈三个关节，使指腹贴到该平面且不穿过（间隙 ≥ 0.3 mm）。结果（度，MCP/PIP/DIP）：拇指 −7/−1/0，食指 −1/−5/10，中指 −7/−3/−4，无名指 −6/−36/−6，小指 −22/−16/0。只替换 r2 页面里的 `__v2p.poses['palm-floor']`。
3. 包装 `motion.getGroundHandPose`：朝向用 native 掌面（手指朝向参数 `finger:[dx,dz]` 语义不变），手腕高度取**可见 native 手**（套上新姿势后）的最低点，使整手 ≥ 地面。可选 `opts.palmClear`（米）整体抬高，默认 0。

**实测（palm-floor-demo，t = 0 / 2.1 / 4 s，左右手相同）：** 整手最低 0.0 mm（不穿地）；掌根最低 0.0–0.1 mm；掌体（掌侧半、离腕 15–75 mm）P10 1.4–1.5 mm、P25 3.5–3.8 mm、中位 11.5–12.1 mm（中位落在掌两侧向上弯的侧面和掌心凹处，属正常手形）；沿手长每 10 mm 一段的最低点，从离腕 20 mm 到 160 mm 都在 0–0.7 mm；拇指最低 0.3 mm，四指最低 0.3 mm。

## 2. 颈部三通道 `spec.neck`

```js
s.neck = {flex: 'neckFlex', side: 'neckSide', rot: 'neckRot'};  // 每个通道：度数 | 轨道名 | {track, scale, offset}
```
- `flex` > 0 低头（屈），< 0 仰头（伸）；`side` > 0 耳朵向身体左侧（rest +X）侧屈；`rot` > 0 脸转向身体左侧。轨道名必须存在于 `timeline.tracks`，未知通道名报错。
- 角度在当前上身坐标系里施加，跟随躯干姿态。整段转动以颈根（C7，`neck` 骨）为轴，头骨同步（头相对颈不再额外转）：v2 头网格带一段 100% 绑头骨的刚性颈桩，头颈之间只要有相对角就会在颈部开缝；以颈根为轴时颈部皮肤靠 training-collar 的躯干→颈→头权重平滑弯曲。
- **未写 `neck` 字段时不碰任何骨骼**；没写字段的 r2 spec 与 r1 渲染逐像素一致。
- 已知限制：`__drill.metrics` 的 `head`/`neck` 关节、相机取景和自穿模胶囊仍按引擎的刚性颈计算（引擎读的是求解器的目标点，不是骨骼），大角度时 QA 的头部数值偏保守；大角度侧屈/旋转的颈部明暗需在 4080 高清下复核。

## 预览

```bash
node drill-anim/models/native-open-r2/preview.mjs <spec.js> <新输出目录> [帧号,逗号分隔] [近景帧号]
```
帧号按 spec 自身 fps（未写为 30）。输出全身帧、双手近景、贴地侧视（`floor-<side>-<帧>.png`：正交 0.26 m 视野，地面 y=0 位于图像中心下方 0.06/0.26 高度处）和 `review.json`（reviewed=false、releaseEligible=false）。

示例：`examples/palm-floor-demo.js`（h-kneeling-pushup-rr1 的身体和时间轴，双手改为真正的 `mode:'floor'` 撑地）、`examples/neck-demo.js`（站姿，依次屈/伸/左右侧屈/左右旋转）。示例不进 `specs/`、不登记、不进目录。

## 状态

候选，未经用户审看；不改全局生产配方。手撑地已在跪姿俯卧撑身体上验证；下犬、世界最伟大拉伸等其它撑地角度（腕背伸更大、手指朝向不同）尚未出帧，新动作使用时须看贴地侧视和双手近景。
