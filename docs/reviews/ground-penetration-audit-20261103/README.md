# 地面穿模数值排查（v3 动作包，2026-11-03，只排查不修）

源码：origin/main `ed49ffb`（含用户本机批次 `9b67e5d` 的全部配方/模型/安装链）。分支 `fix/ground-penetration-audit`。
未改任何 spec／配方／模型；未碰用户本机批次。

## 方法
- 脚本 `tools/ground-audit-r1/ground-penetration-audit.mjs`：直接复用 `tools/action-package-v3/recipe-scene.mjs` 的
  `loadRecipe → openScene → stageAt`（即 render-masters 生产链：armfix-r2 模型、手部安装、joint corrections、腕部修正、action corrective、道具、固定镜头）。
- 每帧做一次 128px 真实渲染，在 `scene.onAfterRender` 内对所有可见、被绘制的 coach 顶点做 CPU 蒙皮（`SkinnedMesh.getVertexPosition`），只回传数字，不截图。
- 部位：按顶点主骨骼分区（Patella→膝；Thigh/Shin 中距膝关节 11 cm 内也算膝；Forearm/UpperArm 中距肘关节 9 cm 内算肘；v2p 手指骨→手）。
- 地面定义：世界平面 **y=0**（engine.js「floor y=0, up +Y」；生产里 stageFloor/grid/ring 全部隐藏，`output.exerciseMat` 不是 3-D 几何）。
  `mat` 道具顶面在 `at.y`，默认 0；凸起的 mat（瑜伽砖/垫块）单独按其顶面对比（近似：只用各部位最低顶点是否落在砖的平面范围内）。
- 抽样：8 s 循环 240 帧，每 16 帧取 1 帧（0,16,…,224，共 15 帧）；h-bear-plank 为每 10 帧。
- 阈值：穿透 >5 mm；悬空参考：spec `shadow.blobs` 声明的接触关节整段循环最近距离仍 >15 mm。
- 不含：GPU-only 位移（胸口呼吸 ≤1.8 mm 向外、cloth sink 向内）——对膝/肘/手不构成外鼓。

## 覆盖范围（未完成部分如实列出）
单个动作开页+安装约 35–260 s，249 个全跑约 3–4 小时，超出 60 分钟时限。先用静态扫描（`floor-support-static-scan.json`：shadow 接触关节含膝/肘、或名称含跪/四足/肘撑）筛出 46 个落地支撑候选，按优先级跑完 **22 个**：

已测：h-bear-plank, h-forearm-plank, h-kneeling-pushup, h-catcow-quad, w-bird-dog, h-donkey-kick, w-fire-hydrant, h-quad-cars, h-quadruped-open, h-quadruped-rockback, h-kneeling-thread-needle, glute-max-B, h-adductor-rock, forearms-A, h-kneeling-instep-stretch, quadriceps-A, s-kneel-hipflex, h-half-kneeling-quad-stretch, n-half-split, s-lizard, s-frog, hip-abductors-A。

未测（候选剩余 24）：adductors-B, h-side-er, w-clamshell, h-reverse-clam, h-inner-thigh, h-open-book, deltoids-C, h-chair-tspine, h-couch-stretch, s-pigeon, h-tabletop, h-supine-cactus-chest, n-prone-hip-ext, n-prone-ir, s-9090, h-9090-liftoff, s-butterfly, n-straddle-fold, n-thomas-test, h-reverse-crunch, h-band-row, hamstrings-C, hip-abductors-C, h-wall-wrist-flexor-stretch；以及其余 203 个非落地支撑动作。
续跑（断点续传，已完成的自动跳过）：
`/workspace/bin/heavy -- node tools/ground-audit-r1/ground-penetration-audit.mjs --out <dir> --stride 16 --size 128 [--list ids.txt]`，
汇总：`python3 tools/ground-audit-r1/summarize.py <dir>/results.jsonl summary.json mat-prop-scan.json`。

## 结果：22 个里 17 个 >5 mm
| # | 动作 | 部位 | 最深 mm | 最深帧 | 穿透帧段（抽样帧） | 膝/肘关节中心 y mm | 关节中心→最低顶点 mm |
|---|---|---|---|---|---|---|---|
| 1 | h-kneeling-thread-needle 跪姿穿针 | 左膝 | 134.8 | 96 | 全程 0–224 | −104.9 | 30.0 |
|   |  | 右膝 | 116.2 | 96 | 全程 | −83.2 | 33.0 |
| 2 | h-quadruped-rockback 四足中立背后坐 | 左/右膝 | 90.2 | 48 | 全程 | −67.3 | 22.9 |
| 3 | h-kneeling-pushup 跪姿俯卧撑 | 左/右膝 | 60.0 | 64 | 全程 | −10.2 | 49.8 |
| 4 | h-adductor-rock 四足单腿侧伸后摇 | 左膝 | 52.4 | 64 | 全程 | −30.7 | 21.7 |
| 5 | h-quadruped-open 四足跪姿单臂开胸 | 左/右膝 | 49.0 | 0 | 全程 | −18.6 | 30.4 |
| 6 | w-bird-dog 鸟狗式 | 左膝 / 右膝 | 45.3 | 0 | 左全程；右 0–16、112–128 | −16.9 | 28.4 |
| 7 | h-donkey-kick 四足屈膝后踢 | 左膝 / 右膝 | 45.3 / 32.3 | 0 | 左全程；右 0–16、112–128、224 | −16.9 / +5.2 | 28.4 / 37.5 |
| 8 | w-fire-hydrant 四足消防栓 | 左/右膝 | 45.3 | 0 | 左全程；右 0–16、96–144、208–224 | −16.9 | 28.4 |
| 9 | h-quad-cars 四足髋关节画圈 | 左/右膝 | 45.3 | 0 | 左全程；右 0–32、112–144、208–224 | −16.9 | 28.4 |
| 10 | s-frog 青蛙式 | 左/右手 | 12.8 | 0 | 全程 | – | – |
| 11 | s-kneel-hipflex 半跪髋屈肌拉伸 | 左小腿前侧 / 左脚 | 10.2 / 5.6 | 0 | 全程 | 膝 48.8 | 59.1 |
| 12 | h-kneeling-instep-stretch 跪姿脚背支撑 | 左/右脚背 | 8.6 | 0 | 全程 | – | – |
| 13 | h-catcow-quad, h-kneeling-pushup, h-quadruped-open, h-quadruped-rockback, h-kneeling-thread-needle | 左/右手 | 7.4 | 0 | 全程（thread-needle 右手 0–32、208–224） | – | – |
| 14 | hip-abductors-A 侧平板抬腿 | 左肘 / 左前臂 | 7.1 / 6.8 | 0 | 全程 | 肘 42.8 | 49.9 |
| 15 | forearms-A 跪姿多方向腕部摇摆 | 左膝 | 5.0 | 96 | 仅 96 | 34.5 | 39.5 |

凸起垫块（近似，需复核）：n-half-split、s-lizard 手按在瑜伽砖上，手部最低点比砖顶低 25.6 / 23.7 mm；h-donkey-kick 的垫子顶面在 +6 mm（其他动作都是 0），所以它的左膝相对垫面实际是 −51 mm。

悬空参考（声明接触却 >15 mm，修时不能再抬）：quadriceps-A 跪姿反向北欧 双膝最近 39 mm（全程没贴地）；h-bear-plank 双膝放下时也只到 9 mm（未超阈值但已偏高）；h-catcow-quad 膝 1.3 mm、h-half-kneeling-quad-stretch 膝 0.1 mm、s-kneel-hipflex 膝 0.8 mm、h-forearm-plank 肘/前臂 1.1 mm——这几个是正确贴地的对照。

全部数值：`summary.json`（排名、帧段）、`per-action.json`（每动作每部位最低点、关节最低 y）。

## 根因分类
**A. 姿态本身把膝关节中心放到地面以下（主因，覆盖第 1–9 名）。** 这些动作的膝关节中心 y 为负（−10 ~ −105 mm），而 armfix-r2 膝部「关节中心→最低皮肤」只有 22–50 mm（正常厚度），所以不是蒙皮鼓出，而是关节本身低了。
- A1 固定烘焙的四足躯干：w-bird-dog / w-fire-hydrant / h-quad-cars / h-donkey-kick 用写死的 `HIPR=[-0.503,0.391,0.077]`、`KN0=[-0.51,0.039,0.077]`、`AN0`（注释：「glute-max-B 的四足躯干烘焙，无求解器」；glute-max-B v2 注释说 KY 0.0407 让髌骨贴垫）。设计的膝关节 y=+39 mm，实测 −16.9 mm，差了约 56 mm，四个动作数值完全一样 → 同一个源头。spec 是对着 `training-human-v2plus` 写的；armfix-r2 沿用 v3 的腿和躯干比例（README：「existing v3 leg and trunk proportions remain unchanged」），髋/踝目标不变、腿段长度变了，两骨 IK 只能把膝往下压。glute-max-B 本身走求解器，膝 −2.4 mm，基本正常。
- A2 求解器动作的膝高度没有约束：h-kneeling-pushup、h-quadruped-rockback、h-kneeling-thread-needle、h-quadruped-open、h-adductor-rock 的 `qa.jointPins` 只钉膝的 xz（或只作 QA），求解器目标里没有「膝不低于地面」，模型换成 armfix-r2 后膝跟着骨盆/脚的目标沉下去（rockback −67 mm，thread-needle −105 mm）。同一族的 h-catcow-quad 膝在 +35 mm、贴地 1.3 mm，说明不是模型整体问题，而是这几个 spec 的骨盆/脚目标与新比例不匹配。
**B. 原生手的手掌平面低于地面（第 13 名，7.4 mm，s-frog 12.8 mm）。** 只出现在 hands=native + `palm-floor` + `mode:'fingertips'` 的动作里；对应 spec 注释写「All new finger vertices clear the Y=0 mat by 0.5 mm」，那个 `clear≈0.01694` 是按 v2plus 手量出来的。armfix-r2 换成 `hands-native-c1r2-symmetric-r1` 手源，loader 里把「r5 palm-floor/contact calibration」标为 notMigrated。hands=support 的动作（bear-plank、bird-dog 等）手都正好 0 mm，没问题。→ 手资产换了，接地间隙没重新标定。
**C. 支撑部位厚度/局部体积（轻度，第 11、12、14 名，5–10 mm）。** 关节中心在地面以上（膝 48.8 mm、肘 42.8 mm），但小腿前侧/脚背/肘部皮肤低 5–10 mm：s-kneel-hipflex 后侧小腿和脚背、h-kneeling-instep-stretch 脚背、hip-abductors-A 肘撑侧肘/前臂。属于目标高度按旧模型厚度设、armfix-r2 的局部体积（含 elbow-dqs/ankle-join 修正后的形状）略厚，属于 1 cm 以内的贴合误差。
**D. 地面/垫子高度与配方不一致。** h-donkey-kick 的 mat `at.y=0.006`（顶面 +6 mm，其余 100 个 mat 都是 0），身体按 y=0 摆，额外多陷 6 mm；n-half-split / s-lizard 手按瑜伽砖（顶面 230 / 159 mm）疑似陷入 ~25 mm（近似计算，需复核）。
**E. 固定镜头/构图：排除。** 生产镜头只做投影，不改几何；地面不渲染；所有穿透都在世界坐标里实测得到，与镜头无关。

## 修复方案建议（未实施）
1. **按 spec 修姿态目标（推荐，针对 A）**：对 A1 四个烘焙动作，用 armfix-r2 实测腿长重新求 `HIPR/KN0/AN0`（或把躯干抬高约 45 mm，让膝关节中心回到 ≈+28 mm，即最低皮肤 ≈0）；对 A2 五个求解器动作在求解目标里加膝 y 约束（膝关节 y ≥ 关节到皮肤厚度，约 22–50 mm，按本表的「关节中心→最低顶点」逐动作取）。重渲：第 1–9 名共 9 个动作。只动这几个 spec 的修订版，不影响其他动作。
2. **安装链里加按部位地面夹紧（通用兜底，针对 A/C）**：在 `stageAt` 之后、渲染之前，对膝/肘/前臂/小腿/脚背做「只抬穿地部位」的 IK 修正：测出该部位最低顶点，若 <0 则把该肢段末端目标沿 +y 抬到 0（膝穿地→抬骨盆或膝目标；肘穿地→抬肩/肘目标），不对已贴地或悬空的部位施力，避免把 catcow/forearm-plank 这类贴地正确的动作抬离。缺点：改的是共享安装链（recipe-scene.mjs），所有 249 个动作的指纹/rendererSha256 都会变；按规矩全部要重渲或至少复核，而且 A 类 45–135 mm 的大幅修正交给夹紧会让身体角度明显变形，不建议用它来修 A，只用它兜 C 类的 5–10 mm。
3. **重新标定原生手 palm-floor 间隙（针对 B）**：用 c1r2 手实测手指/手掌最低点，把 `clear` 由 0.01694 改成新值（约 +7.4 mm，s-frog 约 +12.8 mm），或者把 r5 palm-floor 标定移植到 armfix-r2。重渲：s-frog + 5 个 native 手撑地动作（catcow、kneeling-pushup、quadruped-open、rockback、thread-needle），未测部分里同类 native+palm-floor 动作也要一并核对。
4. **垫子/砖（针对 D）**：h-donkey-kick 的 mat 改 `at.y=0`（或身体整体 +6 mm）；n-half-split / s-lizard 先用逐顶点版本复核手与砖的真实穿深，再决定抬手目标。
5. **蒙皮不需要改**：膝/肘「关节中心→皮肤」厚度 22–50 mm 是正常体积，没看到 DQS/armfix 外鼓。

对用户本机正在跑的 `2026-11-02_v3r2_9b67e5d` 批次：方案 1/3/4 只改少数 spec，产生新配方修订，旧批次其余动作不受影响，只需要在批次跑完后单独重渲这些动作（目前确认 17 个，加未测候选里查出来的）；方案 2 改共享安装链，会让整批产物和新代码不一致，建议不要在这批跑的时候合入。

## 图
`/workspace/work/posehub-ground/worst.jpg`：thread-needle f96、rockback f48、kneeling-pushup f64，256px 侧视调试图（镜头贴地平视，红色平板 = y=0 地面，红色以下即在地面以下）。不是生产镜头。
