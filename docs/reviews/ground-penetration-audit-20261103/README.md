# 地面穿模数值排查（v3 动作包，2026-11-03，只排查不修）— r2 续跑

源码：origin/main `ed49ffb`（含用户本机批次 `9b67e5d` 的全部配方/模型/安装链）。分支 `fix/ground-penetration-audit`。
未改任何 spec／配方／模型；未碰 main，未碰用户本机批次。

## 结论（先看这里）
- 实测 **77 / 249** 个动作（46 个静态候选全部测完 + 关键词复筛补测 31 个；另 9 个带凸起道具的动作做了逐顶点复核），**26 个动作有 >5 mm 穿地**（地面 y=0）。
- 另有 **6 个动作身体陷入凸起道具（瑜伽砖/垫块/靠垫）>5 mm**（逐顶点复核，见「结果二」），其中 n-straddle-fold、h-open-book 在地面检查里是干净的。**合计 28 个动作至少有一处 >5 mm 穿模**：adductors-B, deltoids-B, deltoids-C, forearms-A, glute-max-A, h-adductor-rock, h-catcow-quad, h-donkey-kick, h-floor-nordic-hand-reset, h-kneeling-instep-stretch, h-kneeling-pushup, h-kneeling-thread-needle, h-open-book, h-quad-cars, h-quadruped-open, h-quadruped-rockback, h-short-side-plank, h-supine-bilateral-leg-raise, h-supine-heel-slide, hip-abductors-A, n-half-split, n-straddle-fold, s-frog, s-kneel-hipflex, s-lizard, s-pigeon, w-bird-dog, w-fire-hydrant。
- 本轮新增发现：h-floor-nordic-hand-reset（双膝 115.9 mm，A1）、s-pigeon（左膝 32.1 mm，A2；且右脚/双大腿穿进两块立砖，D）、deltoids-C（右膝 27.8 mm，A2）、h-short-side-plank（下侧膝 24.1 / 肘 20.1 mm，A2）、h-supine-bilateral-leg-raise（双肘 47.4 mm，A2）、h-supine-heel-slide（双肘 19.4 mm，A2）、adductors-B / deltoids-B（原生手撑地 18.3 mm，B）、glute-max-A（原生手 7.4 mm，B）、deltoids-B 左肘 8.7 mm（C）、n-straddle-fold 双手陷砖 24.9 mm（B）、h-open-book 头/躯干/上臂穿进头枕（D）。
- n-half-split / s-lizard 手按瑜伽砖：逐顶点复核**确认**，双手最低点低于砖顶 **25.6 / 23.7 mm**，每帧 650–750 个手部顶点在砖体内，全程 15/15 帧。
- 未测：172 个动作（见「覆盖范围」），原因是单个动作开页+安装 30–200 s，时限内跑不完；站姿动作的脚部检查同样受开页成本限制，抽帧降到每 32 帧 1 帧也省不了多少（成本在开页，不在抽帧），因此跳过。

## 方法（与 r1 相同）
- 脚本 `tools/ground-audit-r1/ground-penetration-audit.mjs`：直接复用 `tools/action-package-v3/recipe-scene.mjs` 的 `loadRecipe → openScene → stageAt`（render-masters 生产链：armfix-r2 模型、手部安装、joint corrections、腕部修正、action corrective、道具、固定镜头）。
- 每帧一次 128px 真实渲染，在 `scene.onAfterRender` 内对所有可见、被绘制的 coach 顶点做 CPU 蒙皮（`SkinnedMesh.getVertexPosition`），只回传数字。
- 部位：按顶点主骨骼分区（Patella→膝；Thigh/Shin 中距膝关节 11 cm 内也算膝；Forearm/UpperArm 中距肘关节 9 cm 内算肘；v2p 手指骨→手）。
- 地面：世界平面 **y=0**。抽样：240 帧循环每 16 帧 1 帧（15 帧）；h-bear-plank 每 10 帧。
- 阈值：穿透 >5 mm 记问题；声明接触（spec `shadow.blobs` 的膝/肘/掌/脚）整段循环最近距离仍 >15 mm 记悬空参考。
- **新增** `tools/ground-audit-r1/raised-mat-vertex-audit.mjs`：对 at.y>0 的 `mat` 道具（props.js：BoxGeometry，L 沿 x、W 沿 z、顶面在 at.y、高 H、绕 y 转 yaw），把每个被绘制的蒙皮顶点转到砖的局部坐标，落在砖的平面范围内就算「离砖顶距离 = y − 顶面」，并统计落在砖体积内（顶面以下、底面以上）的顶点数。结果 `raised-mat-per-vertex.json`，汇总进 `summary.json.raisedMatPerVertex`。
- **新增** 静态复筛 `nonfloor-203-keyword-rescan.json`：对 r1 未入选的 203 个动作，扫 spec 源码关键词（kneel/quadruped/plank/prone/supine/side-lying/lying/seated/sit/floor/mat/palm-floor/hand support/bridge/crunch…）、中文名（跪/四足/平板/俯卧/仰卧/侧卧/坐/地/垫/撑/桥/卷腹/躺）、`output.exerciseMat`、spec 里 pelvis 目标 y。按此挑出 67 个躺/坐/撑地/弓步类动作补测（`extra-floor-list.txt`，按风险排序）。r1 静态筛选**确有遗漏**：只看膝/肘 shadow blob 和名称，漏掉了仰卧/俯卧/坐姿/手撑地/弓步类，补测里已经查出 h-floor-nordic-hand-reset（115.9 mm）等新问题。
- 续跑（断点续传）：`/workspace/bin/heavy -- node tools/ground-audit-r1/ground-penetration-audit.mjs --out <dir> --stride 16 --size 128 --list ids.txt`；需先在仓库根目录起 Vite：`node_modules/.bin/vite --host 127.0.0.1 --port 8830 --strictPort`（drill-anim/config.json 的 app_url；r1 中断后续跑第一次就是因为它没起而 ERR_CONNECTION_REFUSED）。
  汇总：`python3 tools/ground-audit-r1/summarize.py <dir>/results.jsonl summary.json mat-prop-scan.json <dir>/raised-mat-results.jsonl`；`python3 tools/ground-audit-r1/per_action.py <dir>/results.jsonl per-action.json`。

## 结果一：穿地 >5 mm（26 个动作，按最深排序）
| # | 动作 | 部位 | 最深 mm | 最深帧 | 穿透帧段（抽样帧） | 关节中心 y mm | 关节→最低顶点 mm | 根因 |
|---|---|---|---|---|---|---|---|---|
| 1 | h-kneeling-thread-needle 跪姿穿针 | 左膝 | 134.8 | 96 | 0-224 | -104.9 | 30.0 | A2 |
|  |  | 右膝 | 116.2 | 96 | 0-224 | -83.2 | 33.0 | A2 |
|  |  | 左大腿 | 58.1 | 96 | 64-176 |  |  | A2 |
|  |  | 右大腿 | 47.2 | 96 | 64-176 |  |  | A2 |
|  |  | 左小腿 | 42.3 | 96 | 64-176 | -104.9 | -62.6 | A2 |
|  |  | 右小腿 | 28.7 | 96 | 64-176 | -83.2 | -54.5 | A2 |
|  |  | 左手 | 7.4 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 7.4 | 0 | 0-32, 208-224 |  |  | B |
| 2 | h-floor-nordic-hand-reset 地面北欧离心及手撑复位 **（新）** | 左膝 | 115.9 | 128 | 0-224 | -64.6 | 51.3 | A1 |
|  |  | 右膝 | 115.6 | 128 | 0-224 | -64.6 | 51.0 | A1 |
|  |  | 右小腿 | 78.2 | 128 | 0-224 | -64.6 | 13.6 | A1 |
|  |  | 左小腿 | 78.0 | 128 | 0-224 | -64.6 | 13.4 | A1 |
|  |  | 左大腿 | 74.5 | 128 | 80-144 |  |  | A1 |
|  |  | 右大腿 | 69.5 | 128 | 96-144 |  |  | A1 |
|  |  | 左脚 | 15.2 | 128 | 0-224 |  |  | A1 |
|  |  | 右脚 | 15.2 | 128 | 0-224 |  |  | A1 |
|  |  | 左手 | 6.8 | 128 | 128-160 |  |  | B |
|  |  | 右手 | 6.8 | 128 | 128-160 |  |  | B |
| 3 | h-quadruped-rockback 四足中立背后坐 | 左膝 | 90.2 | 48 | 0-224 | -67.3 | 22.9 | A2 |
|  |  | 右膝 | 90.2 | 48 | 0-224 | -67.3 | 22.9 | A2 |
|  |  | 右小腿 | 18.5 | 48 | 32-80, 160-208 | -67.3 | -48.8 | A2 |
|  |  | 左小腿 | 18.4 | 48 | 32-80, 160-208 | -67.3 | -48.9 | A2 |
|  |  | 左手 | 7.4 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 7.4 | 0 | 0-224 |  |  | B |
| 4 | h-kneeling-pushup 跪姿俯卧撑 | 左膝 | 60.0 | 64 | 0-224 | -10.2 | 49.8 | A2 |
|  |  | 右膝 | 59.8 | 64 | 0-224 | -10.2 | 49.5 | A2 |
|  |  | 左大腿 | 29.0 | 64 | 0-224 |  |  | A2 |
|  |  | 右大腿 | 24.7 | 64 | 0-224 |  |  | A2 |
|  |  | 左手 | 7.4 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 7.4 | 0 | 0-224 |  |  | B |
| 5 | h-adductor-rock 四足单腿侧伸后摇 | 左膝 | 52.4 | 64 | 0-224 | -30.7 | 21.7 | A2 |
| 6 | h-quadruped-open 四足跪姿单臂开胸 | 右膝 | 49.0 | 0 | 0-224 | -18.6 | 30.4 | A2 |
|  |  | 左膝 | 48.9 | 0 | 0-224 | -18.6 | 30.3 | A2 |
|  |  | 左手 | 7.4 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 7.4 | 0 | 0, 176-224 |  |  | B |
| 7 | h-supine-bilateral-leg-raise 仰卧双直腿举腿 **（新）** | 右肘 | 47.4 | 80 | 0-224 | -7.8 | 39.6 | A2 |
|  |  | 左肘 | 47.2 | 80 | 0-224 | -7.8 | 39.4 | A2 |
|  |  | 右前臂 | 34.7 | 80 | 0-224 | -7.8 | 26.9 | A2 |
|  |  | 左前臂 | 34.6 | 80 | 0-224 | -7.8 | 26.8 | A2 |
|  |  | 左上臂 | 9.5 | 80 | 0-224 |  |  | A2 |
|  |  | 右上臂 | 9.3 | 80 | 0-224 |  |  | A2 |
|  |  | 左手 | 7.4 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 7.4 | 0 | 0-224 |  |  | B |
| 8 | w-bird-dog 鸟狗式 | 左膝 | 45.3 | 0 | 0-224 | -16.9 | 28.4 | A1 |
|  |  | 右膝 | 45.3 | 0 | 0-16, 112-128 | -16.9 | 28.4 | A1 |
| 9 | h-donkey-kick 四足屈膝后踢 | 左膝 | 45.3 | 0 | 0-224 | -16.9 | 28.4 | A1 |
|  |  | 右膝 | 32.3 | 0 | 0-16, 112-128, 224 | 5.2 | 37.5 | A1 |
| 10 | w-fire-hydrant 四足消防栓 | 左膝 | 45.3 | 0 | 0-224 | -16.9 | 28.4 | A1 |
|  |  | 右膝 | 45.3 | 0 | 0-16, 96-144, 208-224 | -16.9 | 28.4 | A1 |
| 11 | h-quad-cars 四足髋关节画圈 | 左膝 | 45.3 | 0 | 0-224 | -16.9 | 28.4 | A1 |
|  |  | 右膝 | 45.3 | 0 | 0-32, 112-144, 208-224 | -16.9 | 28.4 | A1 |
| 12 | s-pigeon 鸽子式（直立扶砖版） **（新）** | 左膝 | 32.1 | 0 | 0-224 | 15.0 | 47.1 | A2 |
|  |  | 左小腿 | 19.0 | 0 | 0-224 | 15.0 | 34.0 | A2 |
|  |  | 右膝 | 17.9 | 0 | 0-224 | 20.3 | 38.2 | A2 |
|  |  | 左大腿 | 17.2 | 0 | 0-224 |  |  | A2 |
|  |  | 右小腿 | 11.3 | 0 | 0-224 | 20.3 | 31.6 | A2 |
|  |  | 左脚 | 8.4 | 0 | 0-224 |  |  | A2 |
| 13 | deltoids-C 地雷杆半跪单臂推举 **（新）** | 右膝 | 27.8 | 0 | 0-224 | 1.7 | 29.5 | A2 |
| 14 | h-short-side-plank 屈膝短杠杆侧平板 **（新）** | 左膝 | 24.1 | 0 | 0-224 | 12.1 | 36.2 | A2 |
|  |  | 左小腿 | 23.4 | 0 | 0-224 | 12.1 | 35.5 | A2 |
|  |  | 左肘 | 20.1 | 0 | 0-224 | 23.4 | 43.5 | A2 |
|  |  | 左前臂 | 15.1 | 0 | 0-224 | 23.4 | 38.5 | A2 |
| 15 | h-supine-heel-slide 仰卧足跟滑 **（新）** | 右肘 | 19.4 | 64 | 0-224 | 23.9 | 43.3 | A2 |
|  |  | 左肘 | 18.7 | 64 | 0-224 | 23.9 | 42.6 | A2 |
|  |  | 左前臂 | 14.4 | 64 | 0-224 | 23.9 | 38.3 | A2 |
|  |  | 右前臂 | 14.2 | 64 | 0-224 | 23.9 | 38.1 | A2 |
|  |  | 左手 | 7.4 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 7.4 | 0 | 0-224 |  |  | B |
| 16 | adductors-B 屈膝哥本哈根侧撑 **（新）** | 左手 | 18.3 | 0 | 0-224 |  |  | B |
| 17 | deltoids-B 哑铃半程土耳其起立（至高桥） **（新）** | 左手 | 18.3 | 0 | 0-224 |  |  | B |
|  |  | 左肘 | 8.7 | 16 | 0-16 | 39.5 | 48.2 | C |
|  |  | 左前臂 | 7.9 | 16 | 0-16 | 39.5 | 47.4 | C |
| 18 | s-frog 青蛙式 | 左手 | 12.8 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 12.8 | 0 | 0-224 |  |  | B |
| 19 | h-kneeling-instep-stretch 跪姿脚背支撑拉伸 | 右小腿 | 10.8 | 0 | 0-224 | 69.3 | 80.1 | C |
|  |  | 左小腿 | 10.7 | 0 | 0-224 | 69.3 | 80.0 | C |
|  |  | 右脚 | 8.6 | 0 | 0-224 |  |  | C |
|  |  | 左脚 | 8.5 | 0 | 0-224 |  |  | C |
| 20 | n-half-split 半跪半劈叉 | 左小腿 | 10.3 | 0 | 0-224 | 48.8 | 59.1 | C |
|  |  | 左脚 | 5.6 | 0 | 0-224 |  |  | C |
| 21 | s-kneel-hipflex 半跪髋屈肌拉伸 | 左小腿 | 10.2 | 0 | 0-224 | 48.8 | 59.1 | C |
|  |  | 左脚 | 5.6 | 0 | 0-224 |  |  | C |
| 22 | s-lizard 蜥蜴式低弓步 | 左小腿 | 9.8 | 0 | 0-224 | 51.6 | 61.4 | C |
|  |  | 左脚 | 5.5 | 0 | 0-224 |  |  | C |
| 23 | h-catcow-quad 四足猫牛式 | 左手 | 7.4 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 7.4 | 0 | 0-224 |  |  | B |
| 24 | glute-max-A 单腿臀桥 **（新）** | 左手 | 7.4 | 0 | 0-224 |  |  | B |
|  |  | 右手 | 7.4 | 0 | 0-224 |  |  | B |
| 25 | hip-abductors-A 侧平板抬腿 | 左肘 | 7.1 | 0 | 0-224 | 42.8 | 49.9 | C |
|  |  | 左前臂 | 6.8 | 0 | 0-224 | 42.8 | 49.6 | C |
| 26 | forearms-A 跪姿多方向腕部摇摆 | 左膝 | 5.0 | 96 | 96 | 34.5 | 39.5 | C |

## 结果二：凸起道具逐顶点复核（>5 mm 陷入）
| 动作 | 道具（顶面 mm / 尺寸 L×W×H m） | 部位 | 低于顶面 mm | 砖体内顶点数(单帧最多) | 帧段 | 根因 |
|---|---|---|---|---|---|---|
| s-pigeon | #0 顶 255.0 / 0.11×0.23×0.255 | 右脚 | 254.8 | 2099 | 0-224 | D |
| s-pigeon | #1 顶 255.0 / 0.11×0.23×0.255 | 右大腿 | 246.0 | 766 | 0-224 | D |
| s-pigeon | #0 顶 255.0 / 0.11×0.23×0.255 | 左大腿 | 214.9 | 156 | 0-224 | D |
| h-open-book | #0 顶 222.0 / 0.3×0.34×0.22 | 左上臂 | 214.0 | 647 | 0-224 | D |
| h-open-book | #0 顶 222.0 / 0.3×0.34×0.22 | 躯干 | 198.3 | 1922 | 0-224 | D |
| h-donkey-kick | #0 顶 6.0 / 1.2×0.61×0.006 | 左小腿 | 51.3 | 84 | 0-224 | A1+D |
| h-open-book | #0 顶 222.0 / 0.3×0.34×0.22 | 头 | 47.8 | 331 | 0-224 | D |
| h-donkey-kick | #0 顶 6.0 / 1.2×0.61×0.006 | 左大腿 | 47.5 | 53 | 0-224 | A1+D |
| s-pigeon | #2 顶 65.0 / 0.21×0.26×0.065 | 右大腿 | 40.8 | 119 | 0-224 | D |
| h-donkey-kick | #0 顶 6.0 / 1.2×0.61×0.006 | 右小腿 | 38.3 | 36 | 0-16, 112-128, 224 | A1+D |
| h-donkey-kick | #0 顶 6.0 / 1.2×0.61×0.006 | 右大腿 | 35.9 | 29 | 0-16, 112-128, 224 | A1+D |
| n-half-split | #0 顶 230.0 / 0.11×0.1594×0.23 | 左手 | 25.6 | 745 | 0-224 | B |
| n-half-split | #1 顶 230.0 / 0.11×0.1594×0.23 | 右手 | 25.6 | 745 | 0-224 | B |
| n-straddle-fold | #0 顶 159.4 / 0.11×0.23×0.1594 | 左手 | 24.9 | 695 | 0-224 | B |
| n-straddle-fold | #1 顶 159.4 / 0.11×0.23×0.1594 | 右手 | 24.9 | 705 | 0-224 | B |
| s-pigeon | #0 顶 255.0 / 0.11×0.23×0.255 | 左手 | 24.3 | 665 | 0-224 | B |
| s-pigeon | #1 顶 255.0 / 0.11×0.23×0.255 | 右手 | 24.3 | 668 | 0-224 | B |
| s-lizard | #0 顶 159.4 / 0.11×0.23×0.1594 | 左手 | 23.7 | 656 | 0-224 | B |
| s-lizard | #1 顶 159.4 / 0.11×0.23×0.1594 | 右手 | 23.7 | 659 | 0-224 | B |
| h-donkey-kick | #0 顶 6.0 / 1.2×0.61×0.006 | 左手 | 6.0 | 1672 | 0-224 | D |
| h-donkey-kick | #0 顶 6.0 / 1.2×0.61×0.006 | 右手 | 6.0 | 1658 | 0-224 | D |

说明：
- n-half-split / s-lizard / n-straddle-fold / s-pigeon 四个「手按砖」动作的手都是 `mode:'free', palmAt:[x, 砖顶+0.002, z], normal:[0,-1,0]`，即把**掌心关节点**放在砖顶上 2 mm，而手掌皮肤在掌心关节点以下约 25 mm，所以整只手掌一致地陷进砖 24–26 mm（r1 的近似值得到确认，与逐顶点结果相差 <0.1 mm）。归 B（手部接触标定），和原生手 palm-floor 的 7–18 mm 是同一类问题：接触点用的是关节而不是皮肤。
- s-pigeon 的两块立砖（顶面 255 mm，高 255 mm）落在右脚和双大腿所在的位置：右脚 2099 个顶点、右大腿 766 个顶点在砖体内，右大腿还压进臀下垫块 40.8 mm。h-open-book 的头枕（0.30×0.34×0.22 m，顶面 222 mm）与躯干/左上臂/头重叠（头低于枕顶 47.8 mm，躯干 1922 个顶点在枕体内）。这两个是道具摆放/尺寸与身体不匹配（D），需要看图确认（本轮按要求不做大图渲染）。
- h-donkey-kick 的垫子顶面 +6 mm（其他垫子都在 0），身体按 y=0 摆：双手正好在垫面下 6.0 mm，左小腿/膝相对垫面 −51.3 mm（D）。
- h-kneeling-instep-stretch 小腿垫（顶面 21.4 mm）：小腿离垫顶 +0.5/+0.8 mm，正确贴合；h-supine-bilateral-leg-raise 头垫 −0.1 mm、h-supine-cactus-chest 头垫 +0.5 mm，正确。

## 根因分类
- **A1 固定烘焙姿态（无求解器）把膝关节压到地面以下**：w-bird-dog / w-fire-hydrant / h-quad-cars / h-donkey-kick（写死 `HIPR/KN0/AN0`，四个动作数值完全一样，膝关节中心 −16.9 mm）；**新增 h-floor-nordic-hand-reset**：spec 内嵌 240 帧离线表（注释「R3 ANALYTIC CANDIDATE ONLY… OFFLINE_CANDIDATE_REQUIRES_RUNTIME_FULL_BODY_QA」），表里膝 y=+49 mm，实测膝关节中心 −7.6 mm（站直）到 −64.6 mm（f128 最低点，骨盆降到 174 mm），全程穿地，骨盆越低越深——离线表按 v2plus 比例算，armfix-r2 腿段长度不同，两骨 IK 把膝往下压。
- **A2 求解器/IK 动作的膝高度没有约束**：h-kneeling-thread-needle、h-quadruped-rockback、h-kneeling-pushup、h-adductor-rock、h-quadruped-open；**新增 s-pigeon**（固定 pelvis y=0.190 + 固定踝，膝由极向量求出，左膝关节中心 +15 mm 但膝部皮肤厚 47 mm）、**deltoids-C**（半跪地雷杆推举，pelvis 0.458 固定，右膝关节中心 +1.7 mm，皮肤厚 29.5 mm）、**h-short-side-plank**（rr1 求解器 spec 仍标 `modelProfile: training-human-v2plus`，下侧膝关节中心 +12.1 mm / 肘 +23.4 mm，皮肤厚 36 / 44 mm → 膝 24.1、肘 20.1 mm 全程穿地）；同类的还有仰卧双臂放地的 **h-supine-bilateral-leg-raise**（v2plus spec，肘关节中心 −7.8 mm，双肘 47.4 mm、前臂 34.7 mm、上臂 9.5 mm）和 **h-supine-heel-slide**（palm-floor，肘关节中心 +23.9 mm、肘厚 43 mm → 双肘 19.4 mm），手掌贴地后肘的高度没有约束。
- **B 手部接触用关节点而非皮肤**：原生手 palm-floor（h-catcow-quad、h-kneeling-pushup、h-quadruped-open、h-quadruped-rockback、h-kneeling-thread-needle、glute-max-A、h-supine-bilateral-leg-raise、h-supine-heel-slide 7.4 mm；s-frog 12.8 mm；**新增 adductors-B、deltoids-B 18.3 mm**——这两个是 `mode:'floor'` 原生手单手撑地；h-floor-nordic-hand-reset 6.8 mm 仅 f128–160 手撑复位段）；以及手按砖的 palmAt（n-half-split、s-lizard、n-straddle-fold、s-pigeon，24–26 mm）。hands=support 的动作手都是 0 mm，没问题。
- **C 支撑部位局部厚度（5–11 mm）**：s-kneel-hipflex / n-half-split / s-lizard 后侧小腿 10 mm、脚背 5.6 mm；h-kneeling-instep-stretch 小腿 10.8 mm / 脚背 8.6 mm；hip-abductors-A 肘 7.1 mm；**新增 deltoids-B 左肘 8.7 mm（仅 f0–16，土耳其起立肘撑段）**；forearms-A 膝 5.0 mm（仅 f96，临界）。
- **D 道具高度/摆放与身体不一致**：h-donkey-kick 垫子 +6 mm；**新增** s-pigeon 立砖与腿重叠、h-open-book 头枕与躯干重叠。
- E 固定镜头：排除（只投影，不改几何）。

## 悬空参考（声明接触却 >15 mm；修的时候不能再抬）
- quadriceps-A 右膝（rightKnee）最近 39.2 mm
- quadriceps-A 左膝（leftKnee）最近 39.4 mm
- s-lizard 左手（leftPalm）最近 135.7 mm
- h-side-er 左膝（leftKnee）最近 21.1 mm
- w-clamshell 左膝（leftKnee）最近 21.1 mm
- h-reverse-clam 左膝（leftKnee）最近 21.1 mm
- h-inner-thigh 左脚（leftAnkle）最近 41.0 mm
- h-open-book 左膝（leftKnee）最近 16.4 mm
- h-open-book 左手（leftPalm）最近 16.5 mm
- h-couch-stretch 左膝（leftKnee）最近 23.0 mm
- n-prone-hip-ext 右膝（rightKnee）最近 79.4 mm
- n-prone-hip-ext 左脚（leftToe）最近 27.3 mm
- n-prone-ir 右膝（rightKnee）最近 52.4 mm
- n-prone-ir 左膝（leftKnee）最近 51.9 mm
- s-9090 右膝（rightKnee）最近 27.1 mm
- s-9090 左膝（leftKnee）最近 43.5 mm
- h-9090-liftoff 右膝（rightKnee）最近 27.1 mm
- h-9090-liftoff 左膝（leftKnee）最近 43.5 mm
- s-butterfly 右膝（rightKnee）最近 95.5 mm
- s-butterfly 左膝（leftKnee）最近 97.3 mm
- n-straddle-fold 右膝（rightKnee）最近 152.4 mm
- n-straddle-fold 左膝（leftKnee）最近 152.2 mm
- n-thomas-test 右膝（rightKnee）最近 63.5 mm
- n-thomas-test 右脚（rightAnkle）最近 41.0 mm
- h-band-row 左膝（leftKnee）最近 16.8 mm
- h-banana 左手（leftPalm）最近 33.2 mm
- h-banana 右手（rightPalm）最近 34.0 mm
- h-cobra 右脚（rightToe）最近 22.9 mm
- h-cobra 左脚（leftToe）最近 22.9 mm
- h-superman 右脚（rightToe）最近 59.0 mm
- h-superman 左手（leftPalm）最近 217.4 mm
- h-superman 左脚（leftToe）最近 59.0 mm
- h-superman 右手（rightPalm）最近 217.4 mm
- h-supine-twist 左手（leftPalm）最近 25.0 mm
- h-supine-twist 右手（rightPalm）最近 25.8 mm

注：shadow.blobs 是阴影声明，不一定都是真实接触；s-lizard 左掌在砖上（不是地面）、n-thomas-test 在凳上、s-butterfly/n-straddle-fold 膝本来就离地，属于预期。值得注意的：quadriceps-A 双膝 39 mm、n-prone-ir 双膝 52 mm、n-prone-hip-ext 右膝 79 mm、h-couch-stretch 左膝 23 mm、h-side-er/w-clamshell/h-reverse-clam 下侧膝 21 mm、s-9090/h-9090-liftoff 膝 27/43 mm——修穿地时不要把这些再抬高。另：h-knee-hug 仰卧躯干最低点 15.9 mm（整个背部离地约 1.6 cm，未在 blob 规则里，但也属悬空）。

## 覆盖范围
- 46 个静态候选：全部测完（r1 22 个 + 本轮 24 个，含 r1 被中断的 adductors-B、h-side-er、w-clamshell）。
- 关键词复筛补测（67 个，`extra-floor-list.txt`）：已测 31 个：abs-A, chest-A, deltoids-A, deltoids-B, erectors-A, glute-max-A, h-banana, h-band-leg-out, h-bridge-march, h-bridge-overhead, h-butterfly-active, h-cobra, h-crunch, h-db-floor-fly, h-db-floor-press, h-dd-shoulder, h-floor-nordic-hand-reset, h-knee-hug, h-pike-scapular-elevation, h-pike-pushup, h-plank-side-step, h-mountain-climber, h-russian-twist, h-seated-reachback, h-short-side-plank, h-slider-body-saw, h-superman, h-supine-bilateral-leg-raise, h-supine-heel-slide, h-supine-twist, h-wall-straddle。
- 未测 172 个：
  - 复筛补测清单里没轮到的 36 个（坐/撑/弓步类，按风险排在后面）：hamstrings-B, hip-abductors-B, hip-flexors-A, lats-A, n-leg-circles, n-seated-ir-drop, n-windshield, obliques-A, rotator-cuff-A, s-figure4, s-seated-fold, scapular-A, serratus-A, t-seated-straddle-lift-1leg, triceps-A, w-dead-bug, w-feet-on-chair-bridge, w-prone-swimmer, t-flare-side-hold, t-lsit-open-close, t-lsit-tuck, t-lsit-vsit-circles, t-lsit-wide, t-seated-straddle-ext, t-seated-straddle-lifts, t-straddle-hold, t-tuck-planche, t-vsit, abs-B, n-slider-lateral, h-chair-progressive-front-split-native, h-bulgarian, h-reverse-lunge, h-db-split-squat, h-forward-lunge, adductors-A。
  - 其余 136 个站姿/器械/悬垂/坐椅动作：只需确认脚不穿地，但开页成本（每个 30–200 s）与抽帧无关，按每 32 帧 1 帧也要约 1.5–2 小时，本轮跳过。续跑时把 `nonfloor-203-keyword-rescan.json` 里 id 减去已测列表写进 ids.txt 即可，用 `--stride 32`。

## 修复方案建议（未实施，与 r1 一致，补充新增项）
1. A1/A2：按 spec 修姿态目标——A1 五个（含 h-floor-nordic-hand-reset 的离线表需按 armfix-r2 腿长重算）、A2 十个（求解器加膝 y ≥ 关节→皮肤厚度的约束；s-pigeon/deltoids-C 骨盆抬高或膝目标抬高）。
2. B：接触点改为「皮肤最低点贴面」——原生手 palm-floor 重新标定 clear（+7.4 / +12.8 / +18.3 mm），手按砖的 palmAt 加掌厚（≈ +25 mm）。
3. C：按部位地面夹紧兜底（只抬穿地部位），会改共享安装链，不建议在用户本机批次跑的时候合入。
4. D：h-donkey-kick 垫子 at.y=0；s-pigeon 立砖外移/缩小、h-open-book 头枕尺寸/位置按身体重摆，先出图确认。
5. 蒙皮不需要改。

## 文件
- `summary.json`：排名、帧段、悬空参考、凸起道具（近似 `raisedMatProps` + 逐顶点 `raisedMatPerVertex`）。
- `per-action.json`：每动作每部位最低点、关节最低 y（77 个）。
- `raised-mat-per-vertex.json`：9 个带凸起道具动作的逐帧逐部位结果。
- `floor-support-static-scan.json`（r1 静态筛选）、`nonfloor-203-keyword-rescan.json`（本轮复筛）、`extra-floor-list.txt`、`mat-prop-scan.json`。
- `worst.jpg`：thread-needle f96、rockback f48、kneeling-pushup f64，256px 侧视调试图（镜头贴地平视，红色平板 = y=0 地面，红色以下即在地面以下）。不是生产镜头。

---

## 续测 r1·M4（2026-11-04，分支 fix/ground-contact-r1）：复筛清单剩余 36 个全部测完
同一脚本、同一参数（`--stride 16 --size 128`，生产安装链，地面 y=0），结果 `m4-extra36-results.jsonl`。36 个都没有 at.y>0 的凸起道具，无需逐顶点道具复核；36 个均无 pageErrors。
关键词复筛 67 个现已全部测完；总计实测 **113 / 249**（剩余 136 个为站姿/器械/悬垂/坐椅动作，见上文）。

**新发现 >5 mm 穿地 3 个（本次只记录，未修）：**
| 动作 | 部位 | 最深 mm | 最深帧 | 穿透帧段（抽样帧） | 关节中心 y mm | 推测根因 |
|---|---|---|---|---|---|---|
| h-chair-progressive-front-split-native 扶椅前后劈叉渐进 | 后膝（左） | 71.5 | 96 | 0-224（15/15，最浅 50.7@f0） | −8…−24 | A2：后膝着地目标按关节中心贴地写、未补皮肤厚度，骨盆下沉（443→354）时越压越深 |
|  | 后小腿（左） | 46.7 | 96 | 0-224 |  | A2 |
|  | 后脚背（左） | 8.3 | 96 | 0-224 |  | A2/C |
| t-seated-straddle-lift-1leg 坐姿分腿单腿抬 | 双脚 | 44.7 | 0 / 160 | 着地腿全程（左 0、48–112；右 0、80–112、160–224；13/15） | 踝 7 | A1：平放伸直腿的目标高度按关节贴地（踝心 7、膝心 47 mm），没算脚跟/小腿/膝后厚度 |
|  | 双小腿 | 30.5 | 160 | 同上 |  | A1 |
|  | 双膝 | 17.5 | 0 | 同上 |  | A1 |
|  | 左大腿 | 5.4 | 0 | 0-64（3/15） |  | A1 |
| scapular-A 俯卧 Y-T-W 举 | 双小腿 | 23.4 | 0 | 0-224（15/15） | 踝 22、脚尖关节 −21 | A2/C：双脚 hips 坐标系 free 目标（踝 y 0.09、绕 z −80°），俯卧时脚背/脚尖被转到地面下 |
|  | 双脚 | 22.7 | 0 | 0-224 |  | A2/C |

其余 33 个干净（最低皮肤 ≥ −2.1 mm）：hamstrings-B, hip-abductors-B, hip-flexors-A, lats-A, n-leg-circles, n-seated-ir-drop, n-windshield, obliques-A, rotator-cuff-A, s-figure4, s-seated-fold, serratus-A, triceps-A, w-dead-bug, w-feet-on-chair-bridge, w-prone-swimmer, t-flare-side-hold, t-lsit-open-close, t-lsit-tuck, t-lsit-vsit-circles, t-lsit-wide, t-seated-straddle-ext, t-seated-straddle-lifts, t-straddle-hold, t-tuck-planche, t-vsit, abs-B, n-slider-lateral, h-bulgarian, h-reverse-lunge, h-db-split-squat, h-forward-lunge, adductors-A。
（「悬空」未单独列：33 个里声明接触整循环最近距离都 ≤15 mm 的判定没有新增问题；abs-B 全身最低 124.8 mm 属器械/悬空动作本身。）

<!-- M5-SCAN-BEGIN -->
## 续测 r1·M5（2026-11-04，分支 fix/ground-contact-r1）：剩余 136 个站姿/器械/悬垂/坐椅动作脚部扫查
同一脚本 `ground-penetration-audit.mjs`，`--stride 32 --size 128`（240 帧循环抽 8 帧），生产安装链，地面 y=0；看所有部位最低皮肤（脚/鞋底及任何接触地面的部位）。只记录 >5 mm 穿透，不修；悬空不计（站姿抬脚正常）。
清单按 spec 脚部模式排序先测高风险：free 脚（世界/髋系目标，易穿地）39 个 → floor 脚 89 个 → 悬垂/器械类 8 个（`m5-ids136-ordered.txt`）。结果 `m5-stand136-results.jsonl`，汇总 `m5-stand136-summary.json`。
**已测 39 / 136**；总计实测 **152 / 249**。>5 mm 穿地 **2** 个：h-chair-kickback、o-supported-hip-hitch

| 动作 | 部位 | 最深 mm | 最深帧 | 穿透帧段（抽样帧，stride 32） | 推测根因 |
|---|---|---|---|---|---|
| h-chair-kickback | rightFoot | 62.8 | 0 | 0-224（5 帧） | A1：右（踢）脚为 hips 系 free 目标，静止段按旧模型腿长让脚尖「悬停在支撑脚旁 ~1 cm」，armfix-r2 腿更长，回位/静止段（f0–32、96–128、224）脚掌压进地面；踢腿段离地正常 |
| o-supported-hip-hitch | rightFoot | 31.2 | 0 | 0-224（8 帧） | A1/C：右（抬起）脚 hips 系 free 目标，屈膝 60° 后脚再跖屈 57°（rot x 57），踝心离地 203–224 mm 但脚尖朝下，脚尖/前掌全程压进地面（静止段最深，提髋到顶时 10.8）；应为离地悬空脚 |

其余 37 个干净（最低皮肤 ≥ −5 mm）：abs-C(275.3), adductors-C(0), erectors-C(242.8), g-cable-hip-abduction(0), g-cable-hip-extension(0), glute-max-C(89.5), h-band-hip-extension(0), h-band-hip-ir(0), h-band-standing-abduction(0), h-band-standing-adduction(0), h-band-stepout(0.2), h-band-straight-leg-raise(0), h-chair-single-leg-hip-thrust(0), h-hip-gate(-0.9), h-side-leg-raise(0), h-step-jack(0.2), h-suitcase-march(0.2), h-supported-single-leg-calf(-0.1), h-unsupported-star-reach-native(0.1), hamstrings-A(0), hip-flexors-B(-0.1), hip-flexors-C(-0.5), n-seated-knee-lift(2.0), o-chair-knee-extension(0), o-seated-fig4(0), o-seated-ham(0), o-seated-hip-er(0), o-stand-quad(0), o-supported-ankle-eversion(0.2), o-supported-ankle-inversion(0.2), o-supported-ankle-pump(0.2), o-supported-hip-airplane(0), o-supported-hip-ir(0.2), o-supported-knee-curl(0.2), o-supported-march(-1.8), o-supported-single-leg-rdl(0), o-supported-star-reach(0.2)。括号内为整循环最低皮肤 mm。
未测（时限内没轮到，97 个）：quadriceps-C, chest-B, chest-C, erectors-B, forearms-B, forearms-C, h-band-chest-fly, h-band-face-pull, h-band-pallof, h-band-pull-apart, h-band-shoulder-ir, h-band-triceps-pressdown, h-bent-knee-calf-raise, h-bilateral-farmer-hold-native, h-bilateral-upper-back-hug, h-calf-raise, h-chair-dip, h-chair-lat, h-chair-sit-to-stand, h-chair-step-up, h-close-stance-forward-fold-native, h-db-calf-raise, h-db-curl, h-db-front-raise, h-db-hammer-curl, h-db-kickback, h-db-lateral, h-db-overhead-triceps-extension, h-db-press, h-db-rdl, h-db-reverse-fly, h-db-row, h-db-shrug, h-db-supported-calf-raise, h-doorframe-forearms-pec-native-r3, h-goblet-squat, h-good-morning, h-incline-pushup, h-knee-wall-dorsiflexion-native, h-lateral-step-lunge, h-overhead-triceps-stretch, h-squat, h-standing-forearm-rotation, h-standing-wrist-deviation, h-standing-wrist-extensor-stretch, h-suitcase-hold, h-sumo-pry, h-tib-raise, h-towel-isometric-curl, h-wall-angel, h-wall-calf, h-wall-calf-bent-knee, h-wall-palm-lift, n-chair-wiper, n-pelvis-circle, n-seated-squeeze, n-squat-shift, n-wide-fold, o-seated-calf-raise, o-seated-catcow, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-sidebend, o-supported-mini-squat, o-wall-hip-hinge-stretch, obliques-B, obliques-C, quadriceps-B, rotator-cuff-B, rotator-cuff-C, serratus-B, triceps-B, w-chair-hip-thrust, w-wall-sit, h-band-biceps-curl, h-chair-elbow-triceps-stretch, h-db-overhead-shrug, h-db-reverse-curl, h-db-zottman-curl, h-standing-arm-extension-stretch, h-biceps-self, h-crossbody, h-kb-swing, h-towel-behind, h-towel-pass, h-towel-pulldown, h-wall-pec, h-fixed-bar-vertical-pull, h-straight-arm-hang-native, lats-C, scapular-B, triceps-C, lats-B, serratus-C。续跑：`--list m5-ids136-ordered.txt --stride 32`（已测的会按 results.jsonl 跳过）。
<!-- M5-SCAN-END -->
