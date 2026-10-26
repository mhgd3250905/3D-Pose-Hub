# engine/palm-floor-and-neck 低配机验证记录（2026-10-26）

分支 `engine/palm-floor-and-neck`，基于 main `1fdd117`。新增 `drill-anim/models/native-open-r2/`（opt-in），未改任何既有文件。说明见该目录 README。

机器：2 vCPU / 8 GB / 无 GPU（SwiftShader），一次只跑一个渲染（`/workspace/bin/heavy`），全部是 `--pr 0.5` 关键帧预览。

## 对比图 `compare.jpg`

- 第 1 行：`palm-floor-demo`（h-kneeling-pushup-rr1 的身体，双手真正 `mode:'floor'` 撑地）走 native-open-r1，第 0、63 帧全身 + 左手贴地侧视 + 第 63 帧右手。红线 = 地面 y=0。
- 第 2 行：同一 spec 走 native-open-r2。
- 第 3–4 行：`neck-demo`（native-open-r2，站姿），帧 0/15/39/60/81/99/114 = 中立 / 屈 +35° / 伸 −25° / 左侧屈 +30° / 右侧屈 −30° / 左转 +50° / 右转 −50°（spec fps 15）。

## 手掌贴地数值（可见 native 手网格逐顶点，单位 mm，左右手相同）

| | 整手最低 | 掌根最低 | 掌体 P10 | 掌体 P25 | 掌体中位 | 拇指最低 | 四指最低 |
|---|---|---|---|---|---|---|---|
| r1，t=0 / 2.1 s | −44.7 | −19.3 | −6.3 | 3.0 | 11.3 | −44.7 | −11.0 |
| r2，t=0 / 2.1 / 4 s | 0.0 | 0.0–0.1 | 1.4–1.5 | 3.5–3.8 | 11.5–12.1 | 0.3 | 0.3 |

掌体 = 手骨主导、掌侧半、离腕 15–75 mm 的顶点。r2 沿手长每 10 mm 一段的最低点：离腕 20–160 mm 全部 0–0.7 mm。r1 的手是拇指侧下沉、掌心与小鱼际悬空；按旧掌面静态放平（高度改用可见手）时掌体 20% 分位 22.3 mm、中位 43 mm，即任务里“约 27 mm 悬空”的同一机理。

## 既有动作像素对比（main `1fdd117` 工作树 vs 本分支，同帧同参数）

| 动作 / 输出 | 路径 | 最大差值 | 差异像素 |
|---|---|---|---|
| h-kneeling-pushup-rr1 第 63 帧 m / g / c | drill.py render，rc2 v2plus，默认主题 | 0 / 0 / 0 | 0 / 0 / 0 |
| h-quad-cars 第 66 帧 m / g / c | drill.py render，v2，glow-soft | 0 / 0 / 0 | 0 / 0 / 0 |
| h-bent-knee-calf-raise-rr7 第 30 帧 | native-open-r1 加载 | 0 | 0 |
| h-bent-knee-calf-raise-rr7 第 30 帧，r1 vs r2（opt-in、无 neck、自由手） | native-open-r2 | 0 | 0 |

## 未做 / 留给主线

全片、`--pr 2` 高清、绿幕/透明母帧、编码；下犬、世界最伟大拉伸等其它撑地角度未出帧；颈部大角度的领口明暗需 4080 高清复核；`__drill.metrics` 的头颈关节仍按刚性颈计算。
