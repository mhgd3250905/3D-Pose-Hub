# 地面穿模修复 r1 · 里程碑 M1（膝/肘被姿态压到地面下，A1/A2）2026-11-03

分支 `fix/ground-contact-r1`（基于 `fix/ground-penetration-audit` 85af967）。只改各动作自己的 spec（新建 `-gc1` 修订版，原 spec 不动）和 recipe 指向（`spec` / `specSha256Lf` / `source.selectedSpec`，并记 `groundContactFix.r1`）。
未改 recipe-scene.mjs、求解器/引擎、模型、蒙皮、共享库；其他动作指纹不变。

复测：`tools/ground-audit-r1/ground-penetration-audit.mjs --stride 16 --size 128`（每 16 帧 1 帧，整循环 15 帧，生产安装链），结果 `after-*.jsonl`。
调参：`tools/ground-contact-r1/probe.mjs`（同一套测量，一次开页测多组内存变体）。

| 动作 | 修前最深 | 修后（支撑点最低皮肤，整循环） | 改了什么 |
|---|---|---|---|
| h-floor-nordic-hand-reset | 双膝 115.9 | 膝/小腿 −2.8…+8.9（最低点 ≥ −2.8），脚背 +2.5 | A1 离线帧表按 armfix-r2 腿长重算骨盆（以膝为铰点，大腿 0.408 m）+逐 16 帧膝高校准；脚踝后移 7 mm、抬 14 mm |
| h-quadruped-rockback | 双膝 90.2 | −1.0…+0.8 | 骨盆 y +50 mm；髋俯仰随后坐进度 −10°→−17°（中段 −6p(1−p) 缓和） |
| h-kneeling-pushup | 双膝 60.0 | −2.0…+3.8 | 两脚着地点后移 71 mm（膝极向量 +35.5 mm） |
| h-quadruped-open | 双膝 49.0 | +0.1…+4.8 | 骨盆 +63 mm，俯仰 12.778→7.778° |
| w-bird-dog / w-fire-hydrant / h-quad-cars | 双膝 45.3 | −0.5…−0.3 | 骨盆 +52 mm，俯仰 12.778→7.778°；HIPR（工作腿轨迹的髋点）+51 mm，工作腿相对身体轨迹不变 |
| h-donkey-kick | 膝 45.3、垫面 +6 mm | −0.3；双手贴垫 0 | 同上 + 垫子 at.y 0.006→0（D 类归零） |
| deltoids-C | 后膝 27.8 | +1.3（后脚尖仍 0.8） | 骨盆 +32 mm（地雷杆轨迹不动） |
| h-short-side-plank | 膝 24.1 / 肘 20.1 | 膝 +1.9 / 肘 −0.2 | 骨盆 +26 mm |
| h-supine-heel-slide | 双肘 19.4 | −0.6…+0.3 | 双手着地点向脚侧移 57 mm |
| h-supine-bilateral-leg-raise | 双肘 47.4 | −1.4…+2.7 | 双手着地点向脚侧移 67.5 mm（上臂随之离地约 2–3 cm，肘/前臂接地） |
| h-adductor-rock | 左膝 52.4 | +0.9…+4.9 | 起始骨盆 +52 mm、俯仰 7.778°；后摇时不再下沉 1 cm（第 3 次取前两次插值） |

## 未完成
- h-kneeling-thread-needle：不修。穿针段（腰扭 55°）引擎提示「躯干位置已限制，以保持锁定手掌、真实骨长和地面高度」，把躯干/骨盆压低约 11 cm，膝随之压到 −100 mm 以下；抬骨盆+俯仰只修好静止段（0 mm），两次改左撑手位置（内收 / 内收+前移）无效。需要重做穿针段的躯干轨迹（或放开锁定手），超出本里程碑。
- s-pigeon 膝：不修。抬骨盆 +45 mm 前侧右膝到 −2.8，但后侧左膝只 −32→−28.6（后脚脚背着地点/极向量决定），需移后脚，且该动作还有立砖重叠（D），留到 M2 一起处理。
- 手低 7.4 mm / 12.8 mm（B 类，原生 palm-floor）原样保留，未顺手改。
- h-floor-nordic-hand-reset 在 f128–160 手撑段双手 −6.8 mm（B 类）未改；其腿部最低点 −2.8 mm（小腿），站直时膝区比小腿高 6–9 mm，属小腿贴地，非悬空。
- h-short-side-plank 下侧脚原本就离地 26.7 mm（非接触），骨盆抬高后 52.7 mm。

## 对比图
`m1-before-after.jpg`：256px 侧视调试图（红色 = y=0 地面以下），左修前右修后。

---

# 里程碑 M2（手掌陷地/陷砖 B 类 + 道具重叠 D 类）2026-11-04

约定：已有 M1 `-gc1` 的动作新建 `-gc2`（gc1 保留作历史），其余新建 `-gc1`；recipe 只改指向/SHA，并记 `groundContactFix.r1m2`。
生成器 `tools/ground-contact-r1/m2-fix.mjs`（每个动作的改法都在 `FIX` 表里，一行一个），道具剖面探针 `probe-profile.mjs`（整循环蒙皮顶点 2 cm x/z 网格最低 y）。
复测：`ground-penetration-audit.mjs --stride 16 --size 128`（结果 `m2-after-<id>.jsonl`），砖/头枕另跑 `raised-mat-vertex-audit.mjs`（`m2-after-<id>-blocks.jsonl`）。

palm-floor 间隙不是共享常量：`fingertips` 模式的 `clear`（0.016938）、`palmAt` 的 y 都是各 spec 自己写死的字面量，所以逐动作改，未动共享代码。
`floor` 模式（adductors-B、deltoids-B）的落点高度由共享运行时 `getGroundHandPose` 决定、spec 无参数可调，改为同 x/z、掌心朝下的 `fingertips`（与 r2 版 catcow/glute-max-A 同法）。

| 动作 | 修前 | 修后（整循环 15 帧） | 改了什么 | 外观 |
|---|---|---|---|---|
| glute-max-A | 双手 −7.4 | 手 +1.0 | clear +8.4 mm | 肘/前臂抬 5–8 mm（本不着地） |
| h-catcow-quad | 双手 −7.4 | 手 +1.0，膝 +1.3 不变 | clear +8.4 mm | 无可见变化 |
| h-floor-nordic-hand-reset (gc2) | 手撑段 −6.8 | 手 +1.0，腿部同 M1 | 手腕 y 轨迹在离地 5 cm 内渐隐抬 7.8 mm | 无 |
| h-kneeling-pushup (gc2) | 双手 −7.4 | 手 +1.0，膝 −2.0…+3.8 同 M1 | clear +8.4 mm | 无 |
| h-quadruped-rockback (gc2) | 双手 −7.4 | 手 +1.0，膝 −1.0→+1.1/+1.3 | clear +8.4 mm | 身体整体高 ~2.7 mm |
| h-supine-bilateral-leg-raise (gc2) | 双手 −7.4 | 手 +1.0，肘 +1.7（原 −1.4） | clear +8.4 mm | 无 |
| h-supine-heel-slide (gc2) | 双手 −7.4 | 手 +1.0，肘 +2.4（原 −0.5） | clear +8.4 mm | 无 |
| s-frog | 双手 −12.8 | 手 +1.0，肘 +3.9/+4.1（原 +1.6），前臂 +8.4 | palmAt y +13.8 mm | 前臂略离垫（<5 mm 新增） |
| adductors-B | 左手 −18.3，肘 −3.0 | 手 +1.0，肘 +0.9，前臂 +3.1 | 左手 floor→fingertips，clear 25.3 mm | 手型由「地面掌」改为掌心朝下平放 |
| n-straddle-fold | 砖内 −24.9，右前臂 −0.8 | 砖面 +1.0，前臂不再入砖 | palmAt y +25.9 mm | 手臂/肩高 ~1 cm |
| n-half-split | 砖内 −25.6；后脚背/小腿 −5.6/−10.3 | 砖面 +1.0；后小腿 −0.4、脚背 +1.1、后膝 +3.3（原 +2.6） | palmAt y +26.6 mm；后脚踝 +11 mm、跖屈 157.8→154.8° | 手臂/肩高 ~1 cm，后脚背更贴地 |
| s-lizard | 砖内 −23.7；后脚背/小腿 −5.5/−9.8 | 砖面 +1.0；后小腿 0.0、脚背 +1.1、后膝 +1.7 | palmAt y +24.7 mm；后脚同 n-half-split（踝 +11 mm、跖屈 −3°） | 头/胸高 ~3 cm |
| s-pigeon（部分） | 砖内 −24.3 | 砖面 +1.0 | palmAt y +25.3 mm | 腿/砖重叠未修，见下 |
| deltoids-B | 左手 −18.3，左肘 −8.7（0–16 帧） | 手 +1.0，肘 +3.3，前臂 +5.1 | 左手 floor→fingertips，clear 25.3 mm | 同 adductors-B；右手哑铃「手腕限位」提示为原有 |
| h-quadruped-open (gc2) | 双手 −7.4 | 手 +1.0，膝 +1.0/+1.4（M1 为 +0.1/+0.4） | clear +8.4 mm，骨盆 −8.4 mm（只抬手时引擎把整个身体顶高 8.4 mm、膝悬空 7.4，故抵消） | 无 |
| h-open-book（D） | 头低于头枕顶 47.8，躯干 −198、左上臂 −214 在枕体内 | 枕体内无身体顶点；头：静止段陷枕 ≤2.3 mm，开肩保持段（头转向手）离枕 ≤4.9 mm；地面复测与修前完全一致 | 只动道具：头枕沿 +X 移 82 mm（近端 0.12→0.202，避开颈/肩/上臂），降 2.9 mm（顶 222→219.1） | 头枕往头顶方向挪约 8 cm，肩不再「长进」枕头 |

h-open-book 剖面依据 `probe-profile.mjs`：x≥0.20 处头最低 222 mm、x 0.18–0.20 仍有肩/上臂（45–71 mm）。`m2-after-h-open-book-blocks-move-only.jsonl` 是只移不降时的头枕复测（头离枕 0.6–1.5 / 7.8 mm）；降 2.9 mm 为确定性平移（身体不动，地面审计不把道具当地面），未再跑一次。

## M2 未修 / 待决
- **s-pigeon 腿与砖/垫重叠、后腿穿地**：本次只把双手抬到砖面。腿：沿 M1 骨盆 +45 mm 再把后脚着地点后移 60 mm（probe），后膝 −28.6→−0.4、前膝 −2.8，但后小腿/脚背仍 −11.8/−7.2（`floor` 模式脚的落点高度由共享解算决定），后大腿离地 19 mm；两次未达标按规则停。砖：剖面（`probe-profile.mjs`）显示双手正下方 23×11 cm 范围内前腿脚/小腿、后腿大腿都贴地经过，砖原地旋转 90° 或外移 5 cm 仍压腿（最低 0–53 mm）；臀下垫块被右大腿压进 40.8。需用户定：
  A. 双手外移到两髋外侧（约 x ±0.33），砖跟着外移——改手位但不改动作节奏；
  B. 去掉手下立砖，双手直接撑地（手位需降 ~25 cm，躯干更前倾）；
  C. 保留现状，只当已知问题（手已贴砖面）。臀下垫块随 A/B 一起重排。
- **h-kneeling-thread-needle**：见下方 thread 一节。
- 本次所有动作只做了数值复测；前后对比图 `m2-before-after.jpg`（256px 侧视调试图，红色 = 地面以下，每行左修前右修后：s-pigeon f0、h-open-book f112、n-half-split f0、h-kneeling-thread-needle f96）。

## h-kneeling-thread-needle（M1 遗留，本次修好）
| 修前（r2） | 修后（r2-gc1，整循环 15 帧） | 改了什么 | 外观 |
|---|---|---|---|
| 双手 −7.4；双膝静止段 −49、穿针段 −134.8/−116.2，大腿/小腿也入地 | 双手 +1.0；双膝 −1.5…+1.4，大腿/小腿不再入地；穿针手肘 +3.1 | 双手 clear +8.4 mm；四足基座同 quadruped-open-gc2（骨盆 0.3842→0.4388，髋俯仰 12.778→7.778°）；穿针段胸俯仰峰值 −24°（与腰扭 55° 同关键帧 1/3/5/7 s） | 穿针时胸口/右肩下沉更深（更像真实穿针），节奏不变 |

依据 `m2-probe-h-kneeling-thread-needle.json`：只抬骨盆/俯仰时引擎为保持锁定左手仍把骨盆压到 0.373（膝 −56.5）；胸俯仰 −24° 后骨盆只降 3 mm（0.439→0.436），「躯干位置已限制」提示仍在 80–128 帧出现但位移可忽略。此为 probe（与审计同一测量，size 96）结果。

## 需重渲（M2 改了 spec 的动作；★ = M1 已改过、本次再改）
h-floor-nordic-hand-reset★、h-quadruped-rockback★、h-kneeling-pushup★、h-quadruped-open★、h-supine-bilateral-leg-raise★、h-supine-heel-slide★、
h-kneeling-thread-needle、h-catcow-quad、glute-max-A、s-frog、adductors-B、deltoids-B、n-half-split、s-lizard、n-straddle-fold、s-pigeon（仅手）、h-open-book（仅头枕）。
M1 改过、本次未动、仍需按 M1 重渲：w-bird-dog、w-fire-hydrant、h-quad-cars、h-donkey-kick、deltoids-C、h-short-side-plank、h-adductor-rock。

---

# 里程碑 M3（s-pigeon 方案 A + C 类小穿透）2026-11-04

生成器 `tools/ground-contact-r1/m3-fix.mjs`（`FIX` 表一行一个动作，参数均由 `probe.mjs` 标定）；recipe 只改指向/SHA，记 `groundContactFix.r1m3`。
复测：`ground-penetration-audit.mjs --stride 16 --size 128`（`m3-after-<id>.jsonl`）；s-pigeon 另跑 `raised-mat-vertex-audit.mjs`（`m3-after-s-pigeon-blocks.jsonl`）。

| 动作 | 修前（原版，整循环最深） | 修后（整循环 15 帧） | 改了什么 | 外观 |
|---|---|---|---|---|
| s-pigeon (gc2) | 后膝 −32.1、后小腿 −19.0、前膝 −17.9、后大腿 −17.2、前小腿 −11.3、后脚背 −8.4；双手陷砖 −24.3；臀下垫块被右大腿压入 40.8 | 前膝 −2.8、后小腿 −1.3、后脚背 +0.1、后膝 +0.6、前脚 0、前小腿 +0.4；后大腿离地 19.7（M2 probe 为 19.1）；双手砖面 +1.0，砖体内 0 顶点；垫块离右大腿 5.7 mm，0 顶点在垫内 | 方案 A：双手+立砖外移到两髋外侧（左 x 0.33/z −0.02，避开前脚尖；右 x −0.35/z −0.04，避开前膝/小腿），手高不变；骨盆 +45 mm；后脚 floor→free world（踝 [0.12,0.0505,−0.80]、跖屈 154.8°，同 n-half-split 后脚做法）；臀下垫块 z 后移 3 cm、顶面 65→58 mm | 双臂从「撑在胸前两侧」变成「撑在两髋外侧」，躯干整体高 4.5 cm；节奏不变 |
| h-kneeling-instep-stretch | 双小腿 −10.8、脚背 −8.6 | 小腿 −1.0、脚背 +2.3/+2.4；膝 22→23（本不着地） | 双脚踝 +11 mm、跖屈 −3° | 无可见变化 |
| s-kneel-hipflex | 后小腿 −10.2、脚背 −5.6 | 后小腿 −0.4、脚背 +1.1、后膝 +1.5…+3.0（原 +0.8…+2.4）；前脚 0 | 后脚同 n-half-split-gc1（踝 +11 mm、跖屈 −3°） | 无 |
| hip-abductors-A | 左肘 −7.1、前臂 −6.8 | 肘 +0.2、前臂 −1.2；手 −1.8 原样、下侧脚 +0.1 | 左肘 mid 约束 y 0.042→0.052 | 无 |
| forearms-A | 膝 −5.0（f96），整循环 −5.0…+4.4 | 膝 −2.7…+6.6；脚/手 0 不变 | 双膝 mid 约束 y +3 mm | 摇摆中膝高本就起伏 ~9 mm，整体平移后峰值离地 6.6 mm（原 4.4，+2.2 mm，单帧瞬时）；整循环最近距离 −2.7，仍算贴地 |

依据：`/workspace/work/posehub-ground/m3/probe-*.json`（size 96）、`prof-pigeon.json`（gc2 姿态 x/z 2 cm 网格剖面，用来定砖和垫块位置）。
对比图 `m3-before-after.jpg`：s-pigeon f0，256px 侧视调试图（红色 = 地面以下），左原版、右 gc2。

## 需重渲（M3 改了 spec 的动作）
s-pigeon★（M2 只改了手，本次 gc2 是完整修复）、h-kneeling-instep-stretch、s-kneel-hipflex、hip-abductors-A、forearms-A。

# 里程碑 M4（只测不修）2026-11-04
复筛清单剩余 36 个全部测完，新增 >5 mm 穿地 3 个：h-chair-progressive-front-split-native（后膝 71.5）、t-seated-straddle-lift-1leg（双脚 44.7）、scapular-A（双小腿 23.4）。详见 `docs/reviews/ground-penetration-audit-20261103/README.md`「续测 r1·M4」，原始结果 `m4-extra36-results.jsonl`。留到下一里程碑修。
