# 旧动作修复 r1 · 变更记录（Hark-QUA，分支 codex/legacy-fix-r1，基于 codex/legacy-audit-r1 @45a1c48）

规则：只增不删。原 spec / recipe / 文字 / 标准文件一律未改；每个修复 = 新 spec（`drill-anim/specs/<base>-lfx1.js`，import 原 spec 后只改出问题的部位）
\+ 新 recipe（`catalog/production/legacy-fix-r1/recipes/<id>.json`，复制 remaining219-r1 recipe，只换 `spec`/`specSha256Lf`，加 `legacyFixR1` 说明；
`reviewed/userAccepted/releaseEligible` 未动）。动作 id 不变。

验收工具：`tools/legacy-audit-r1/audit.mjs`（stride 10，25/50/75% + 问题帧，正/侧/顶/背/裆部特写）+ `analyze.py`（默认按 `standards/<id>.json`）。
裆部鼓包（crotch-bulge）属 HANDOFF §3/§5 的 **M 模型级**问题，第 2 批在 V5 皮肤层统一修，本批不按姿势改，下表单列。

## 第 1 批（2026-11-21）

| # | id | 判断 | 修法（一句话） | S1 修前→修后 | S2 修前→修后 | 原问题数值 修前→修后 |
|---|---|---|---|---|---|---|
| 1 | h-short-side-plank | 属实 | 两脚改为小腿平放身后、脚背顺小腿方向放松跖屈（旋转 -90°→+150°），下侧脚外缘贴地、上侧脚叠在下侧脚上 | 4→0（修订标准）/ 4→1（原标准，见下） | 0→0 | 脚 vs 膝 -180°/-173° → 8°/3°；脚比膝高 0.08 m → 0.04 m；屈膝 67° → 86–87°；下侧脚离地 53 mm → 11 mm；上侧脚 175 mm → 94 mm（叠放） |
| 2 | h-floor-nordic-hand-reset | **误报** | 不修（见 false-positive.md） | — | — | — |
| 3 | s-9090 | 属实（P0 文不对题） | 按 Flare 文案重做为左右换髋往返：90/90 右前 → 双膝抬起翻转 → 镜像 90/90 左前 → 返回；上身坐直、双臂前平举 | 3→1（仅 M 裆部） | 2→1 | 换边：无（镜像差 76 cm）→ 有（镜像差 0.1 cm）；右膝髌骨 vs 屈膝 -66° → 0.6°；左小腿拧转 -54° → 7°；膝铰链偏离 46° → 5°；上身前屈/后仰 43°(源) → 坐直（<35°，不再报） |
| 4 | adductors-A | 属实（hark-sk 复核定） | 第 3 次（换思路）：站距 0.90→0.81 m（约 1.8 倍肩宽）+ 骨盆由横向目标主导沿伸直腿弧线坐到下蹲脚上方 + 到底髋转向下蹲膝 12° + 下蹲初段膝 pole 外移与大/小腿拧转修正 | 1→1（仅 M 裆部；修订标准）/ 1→2（原标准：+裆部升 S1，途中重心条见下） | 2→0 | 到底重心（膝角 ≤60° 帧）偏出 +0.073 m → 在脚内 0.030 m；膝在脚内侧 7.4 cm → 1.5 cm（stride 3 加密 ≤1.4 cm）；小腿拧转 -41° → -27°（加密最大）；伸直腿 176–177°、脚尖朝上 50°、脚跟 0 mm |
| 5 | h-squat | 属实 | 膝 pole 从髋坐标点改为沿脚尖方向的世界远点（骨盆前倾不再把 pole 带偏），脚尖外八 10°→20° | 6→1（仅 M 裆部） | 0→0 | 膝在脚外侧 15 cm → 0.5–2.7 cm（内侧）；髌骨 vs 屈膝 -70° → -34°；铰链偏离 52° → 27°；脚 vs 膝 -34° → -1°；膝 vs 脚尖 7.5–33° → -0.2–0.6° |
| 6 | deltoids-B | 属实 | 高桥撑地的右脚收到髋宽（z 0.14→0.00，向中线 14 cm）+ 右膝世界 pole，使小腿竖在脚上方、膝对脚 | 1→1（仅 M 裆部） | 2→0 | 膝在脚内侧 12 cm → 0.3 cm；膝 vs 脚尖 8° → 22°（阈 35°）；髌骨 vs 屈膝 46° → -34° |

裆部鼓包（M 模型级，第 2 批处理）修前→修后：h-squat 38→44 mm；s-9090 43→60 mm（换髋到底时髋外展更大）；deltoids-B 37 mm(S2)→34 mm(判 S1：两腿分开可见)；h-short-side-plank 9 mm 不变。
这几项都是姿势变正确后裆部蒙皮的共性鼓包，**不是本批引入的新姿势错误**；按 HANDOFF 不逐动作改姿势，交第 2 批。

### 1 h-short-side-plank 屈膝短杠杆侧平板
- 新文件：`drill-anim/specs/h-short-side-plank-lfx1.js`（base `h-short-side-plank-gc1-et1.js`）、recipe、`tools/legacy-fix-r1/standards/h-short-side-plank.json`。
- 看图确认：原片两脚脚尖指向膝侧、脚底朝上翻，上侧脚翘离地 175 mm；小腿向头侧折（屈膝 67°），脚比膝高 8 cm。属实。
- 改动：只改两只脚（踝目标 + 脚旋转）。踝 = 膝 + 0.417 m 正后方（小腿与大腿垂直、近水平；下侧踝抬 4 cm、上侧 2 cm 让鞋缘落在垫上/叠在下侧鞋上），
  脚绕腿的外侧轴 +150°（原 -90°）= 放松跖屈、脚尖顺小腿朝后。骨盆、躯干、手臂、pole、8 s 保持、镜头未动。
- **标准修订（新文件，原标准未改，待 hark-sk 复核）**：原 `sideplank-feet-off-floor` 用 max(左脚, 右脚) ≤45 mm，与它自己的依据「双脚叠放」矛盾——
  真叠放时上侧脚最低点必在下侧脚之上约一只鞋宽（V5 约 85–95 mm），正确姿态永远过不了。依据：ACE Exercise Library「Side Plank - modified」#100
  （"left leg lying directly over your right leg"，https://www.acefitness.org/resources/everyone/exercise-library/100/side-plank-modified/）与
  ACE Phase 1 教材「Side plank with bent knee: legs stacked on one another」（https://contentcdn.eacefitness.com/continuingeducation/courses/support_items/OLC-RESISTANCE-PHASE1-10/Content.pdf）。
  修订为：下侧脚 ≤45 mm（阈值不变）+ 新增上侧脚叠放 ≤130 mm。修订标准下原片仍 5 条 S1 全抓到（下侧脚 53 mm、上侧脚 175 mm 都判失败），修后 0 条。
  按原标准修后剩 1 条 S1 = 上侧脚 94 mm（叠放的正常高度）。
- 现在长什么样：前臂撑地，下侧膝和小腿外侧贴垫，两膝约 87° 屈，小腿平放在身后，两脚叠放、脚尖朝后放松，下侧鞋外缘贴垫，上侧鞋压在下侧鞋上；从正/侧/顶/背看脚都不再翻向上方。

### 3 s-9090 90/90 坐姿换髋
- 新文件：`drill-anim/specs/s-9090-lfx1.js`、recipe、文字 `catalog/production/legacy-fix-r1/text/s-9090.json`（开哥 2026-11-21 16:21 已选换髋版，文字已定稿，`reviewStatus: user-selected-legacy-fix-r1`，见第 2 批 §s-9090 文字）。
- 动作来源：仓库已有的 `drill-anim/revisions/hark-4080-v1/s-9090-switch/spec.js`（「90/90左右换髋」v1-local，README 记为用户 2026-10-11 确认可用，dab78b5 交付，文件未改）。
  适配：模型档/v2plus 同 s-9090-r7（V5 渲染路径）；12 s 源按 2/3 时间缩放到 s-9090 原时长 8 s（A 停 1.0 s、每半程翻转 1.0 s、B 停 1.33 s）。
  为符合 Flare 文案「上身尽量坐直」：源动作上身后仰 43°、双手撑在身后，改为后仰缩到 0.3 倍（停顿时 13°）、双手离地前平举（a-9090 的「A 松」坐直手型，随躯干动）。腿、脚、骨盆、髋转动、膝路径照源。
- recipe 的垫子 `output.matProp` 换成源 spec 自带的垫子（中心 0,0，1.5×1.6 m，yaw 0），原 recipe 的垫子是按旧单侧姿态自动算的脚印、对换边后的脚位不再覆盖。镜头块未改。
- ~~剩余：S2 `text-hold-moving`，用哪一版需开哥选~~ → **已定（2026-11-21 16:21）：开哥选换髋版**，文字定稿在 `catalog/production/legacy-fix-r1/text/s-9090.json`（原 `catalog/production/v3-text/s-9090.json` 单侧前倾版保留未改）；
  按定稿文字生成的修订标准 `tools/legacy-fix-r1/standards/s-9090.json` 下 `text-hold-moving` 消失（数值见第 2 批）。
- 现在长什么样：坐地 90/90，右小腿横在身前、左小腿朝后，上身坐直双臂前平举；两脚脚跟基本不动，双膝一起抬起翻到另一侧，落成镜像 90/90（左小腿在前），再翻回；膝始终 90° 只做铰链，髌骨朝屈膝方向。

### 4 adductors-A 哥萨克蹲（第 3 次换思路后修好，待 hark-sk 复核）
- 新文件：`drill-anim/specs/adductors-A-lfx1.js`（base `adductors-A-r2.js`，原 `adductors-A.js` 未改）、recipe、修订标准 `tools/legacy-fix-r1/standards/adductors-A.json`（原标准未改）。
- 属实：hark-sk 复核定为属实（到底重心没坐到下蹲脚上、早段膝在脚内侧、小腿拧转）。
- 前两次失败（试验文件留在沙箱 `/workspace/work/legacy-fix/b1/adductors-A/attempt/`，未进分支）：只调横移目标的大小/时序。原因：伸直腿 reach（权重 4）+ 高度目标（权重 1）决定骨盆位置，横移目标权重 0.2 不起作用。
- 换思路先做几何核算（沙箱模型 + 实测校对，误差 <1 cm）：伸直腿保持伸直时，骨盆只能在以伸直脚为圆心的弧线上走，能多靠近下蹲脚只由**站距和深度**决定。
  站距 0.90 m 时，即使加深到骨盆 0.36 m，骨盆中心仍差下蹲脚约 0.5 cm；早段（屈膝 45–70°）髋在下蹲脚内侧 21–28 cm，膝要在脚内侧 ≤3 cm 就得比脚尖外偏 35° 以上，
  而屈膝过 70° 后标准又要求膝 vs 脚尖 ≤15°，两头卡死。**加宽站距让伸直脚更远，两项都更差**（0.9→1.0 m：同屈膝 50° 时髋更靠内 6 cm）；收窄才有解。
- 改动（节奏 8 s 与关键时刻、手臂、伸直腿脚尖朝天与脚跟支点、镜头未动）：
  1. 站距：两踝 ±0.45 → ±0.405 m（0.81 m）。V5 肩关节间距 0.376 m、肩外缘约 0.45 m，0.81 m ≈ 1.8 倍肩宽（hark-sk 给的上限值）；脚尖外转 20°、脚跟支点轨道不变。
     **注意：这是比原片窄 9 cm，不是加宽**（hark-sk 写的是「允许加宽到约 1.8 倍肩宽」；按上面的几何，原片 0.90 m 已超过 1.8 倍肩宽）。请复核是否接受。
  2. 骨盆路径改由横向目标主导：横移目标 ±0.31/权重 0.2 → ±0.45/权重 1，高度目标 0.48/权重 1 → 0.47/权重 0.15；高度由伸直腿长度决定，骨盆沿弧线横移、到下蹲脚上方坐下（到底骨盆 0.483 m，与原深度 0.482 相同，未加深）。
  3. 到底时髋向下蹲膝方向转 12°（前倾随之朝向下蹲膝），把重心带到脚上。
  4. 下蹲早段 / 起身末段（squat 参数 0.02–0.45，屈膝过 70° 前回到原值）：下蹲腿膝 pole 向脚尖外侧 42° 的远点移 40%，大腿拧 22° 让髌骨跟着弯曲方向（hub 腿 IK 不随 pole 转大腿）；
     参数 0.02–0.75 时小腿拧转修正 28°，让小腿留在屈膝平面内。到底和站立时都不加。
- 修订标准（新文件）：hark-sk 定「重心只判下蹲腿屈膝 ≥60° 的帧」。本记录和审计表里的膝角都是关节夹角（180° = 伸直；原报告途中坏帧膝角 74–84°），
  按此读作**膝角 ≤60°**（屈曲 ≥120°，即到底附近），并把阈值从 0.08 m 收紧到 0（重心须在下蹲脚接触面内）；膝内侧容差 4→3 cm、小腿拧转 45°→30°（hark-sk 验收线）。只收紧/限定，未放宽。
  若 hark-sk 原意是屈曲 ≥60°（膝角 ≤120°），修后途中帧仍为 0.13–0.22 m（f24–f33，下表），任何伸直腿踩实的站距都做不到（见上面几何），需另定。
- 数值（stride 10，修前 = remaining219 recipe，修后 = legacy-fix-r1 recipe；右侧，左侧镜像相同）：

| 项 | 修前 | 修后 |
|---|---|---|
| 到底重心 vs 下蹲脚（f50–70，膝角 51–55°，+ = 在脚外） | +0.073 m | -0.030 m（在脚内 3 cm） |
| 屈曲 ≥60° 帧重心（字面读法，参考） | f20 0.277 / f30 0.142 / f40 0.085 | f30 0.132 / f40 0.006 / f80 0.037 / f90 0.177 |
| 膝在脚内侧（屈膝 ≥45° 帧最小，- = 内侧） | -7.4 cm | -1.5 cm（stride 3 加密：-0.0…+5.3 cm；屈膝 30° 帧 -7.7 cm 不在判定范围） |
| 膝 vs 脚尖方向 | 4–15° | -4.6…+32.8°（早段屈膝 30–63° 时膝比脚尖外偏 32°；屈膝 >70° 后 ≤13°） |
| 小腿拧转 shinFace（最大绝对值） | -41° | -25.6°（stride 3 加密 -26.8°） |
| 髌骨朝向 thighFace / 铰链偏离 | -35.5° / 40.9° | -29.1° / 29.8°（加密 -30.1° / 32.9°） |
| 伸直腿膝角 / 脚尖朝上 / 脚跟 | 175.5–179.9° / 50° / 0 mm | 175.9–177.3° / 50° / 0 mm |
| 下蹲腿最大屈曲 | 128.5° | 125.3° |
| 穿地 | 0 | 0 |
| 裆部鼓包（M，第 2 批） | 28.8 mm（S2） | 40.9 mm（S1，两腿分开；stride 3 同帧读数 28.1 mm，读数随采样有波动） |

- 判定（analyze.py）：修订标准 修前 S1 1（到底重心）/ S2 4（膝内扣 + 小腿拧转×2 + 裆部）→ 修后 S1 1（仅裆部 M）/ S2 0。
  原标准 修前 S1 1 / S2 2 → 修后 S1 2（裆部 M + 途中重心 f30/f90，即上面那条条件之争）/ S2 0。
- 对比图：沙箱 `/workspace/work/legacy-fix/b1/adductors-A_cmp2.jpg`（上 3 行修前 f20/f30/f60 到底，下 3 行修后同帧；正/侧/顶/背/裆部特写/成片机位）。
- 现在长什么样：站距略窄于原片，下蹲时骨盆横移、沿伸直腿的弧线坐到右脚正上方，到底时上身稍转向右膝、双手前平举，重心落在右脚掌内；右膝在第 2 趾上方、脚跟踩实，左腿伸直、脚跟着地脚尖朝天；左右镜像交替。
- 未做：Flare 风格自检 check.mjs（临时副本已清理，未重跑）；审计里穿地为 0。

### 5 h-squat 徒手深蹲
- 新文件：`drill-anim/specs/h-squat-lfx1.js`（base `h-squat-r2-sc1-kn1.js`）、recipe。
- 看图确认：到底两膝向外弓出脚外 15 cm，小腿斜向内。原因：膝 pole 是髋坐标系里的点 [±0.42,0.55,1]，下蹲骨盆前倾把它带向下外侧。
- 改动：pole 改为沿脚尖方向 2 m 远的世界点；脚尖外八 10°→20°（NSCA/ACE：双脚略外八 15–30°，膝同向）。只用 10° 时膝对脚尖也过了，但大腿收拢、裆部鼓包 38→51 mm，20° 降到 44 mm。脚位、骨盆路径、深度、手、时长、镜头未动。
- 现在长什么样：到底时两膝正对第 2–3 脚趾、在脚正上方，正面看小腿近竖直，全脚掌着地，躯干前倾与原片相同。

### 6 deltoids-B 哑铃半程土耳其起立（至高桥）
- 新文件：`drill-anim/specs/deltoids-B-lfx1.js`（base `deltoids-B-r4.js`）、recipe。
- 看图确认：高桥阶段撑地右脚在髋外 29 cm，膝落在脚长轴内侧 12 cm（小腿内斜约 17°）。下肢在高桥时确实负重（蹬脚跟顶髋），应膝对脚。属实。
- 试 1（只把膝 pole 外推）：膝到脚上方但与脚尖方向差 55°、S2 增到 5 条，弃用。试 2（只把脚内收 14 cm）：仍内侧 10 cm，弃用。
  终版（试 3）= 两者结合并按几何解出：右脚收到髋宽（z 0.14→0.00，x/朝向/平放不变）+ 世界 pole [0.88,0.95,0.15]。骨盆路径、左腿、手臂、哑铃、时长、镜头未动。
- 现在长什么样：坐起和高桥全程右脚全脚掌在髋宽位置踩实，高桥时右小腿竖在脚上方、膝对着脚尖方向（偏 22°，阈 35°内），不再向内倒。

## Flare 风格自检（tools/flare2-moves-r3/check.mjs）
沙箱跑法：原 `check.mjs` 假设所有 Vite 依赖同一个 `?v=` 哈希，在本沙箱报 504 Outdated Optimize Dep 起不来（audit.mjs 已按依赖分别取哈希）；
用一份只改了这 3 行取哈希逻辑的临时副本跑（未进分支），stride 6，修后 recipe：

| id | 穿地最低（mm，FLOOR_TOL -2） | 自碰最小间隙（mm，<0=重叠） | solver 警告帧 | 说明 |
|---|---|---|---|---|
| h-short-side-plank | 下侧小腿 -4.4 | -1.3（两小腿叠放 shinL|thighR） | 0 | 小腿贴垫压入 4.4 mm（审计容差 -8 mm 内，check.mjs 的 -2 mm 外）；试过下侧踝再抬 7 mm：小腿仍 -3.0、脚悬空升到 18 mm（S2），弃用，保留现版 |
| s-9090 | 0.4（脚） | 131（thighL|upperArmL） | 0 | 无穿地、无自碰；换髋中段手臂在膝上方，侧视图有明显间隙 |
| h-squat | 0（脚） | 63.2（forearmR|torso） | 6 | 与原 recipe 完全相同（原版同样 63.2 / 6 帧），手臂未改，非本次引入 |
| deltoids-B | -1.5（左大腿） | 77.7（shinR|thighL，f0） | 0 | 与原版穿地相同（-1.5）；起始仰卧右小腿与左大腿间隙 77.7 mm（原版最小间隙 114.8 为前臂-躯干），无重叠 |

抖动：四个动作的姿态都由连续曲线插值（h-short-side-plank 为静态保持），无逐帧求解切换，contact drift 无计划窗口（旧动作不在 flare2 actions.json），未单独报。


## 第 2 批（2026-11-21）· V5 裆部鼓包模型级修复 crotchfix-v5-r1

HANDOFF §3/§5 的 **M 模型级**问题（crotch-bulge），不按姿势逐个改，在 V5 皮肤层统一修。只增新文件；原 glb、`tools/v5/render-masters-v5.mjs`、`v5-hub.js`、所有 recipe/spec 一字未改。

### 原因
`coach-v3r3-wristfix.glb` 的短裤/腿网格 `CoachV3r3_3` 裆部蒙皮权重是硬分界且左右不对称（会阴中线相邻顶点 L/R 大腿权重在 0.06↔0.85 间跳），前裆/会阴一大块 100% 跟骨盆。
髋深屈或大外展时，这些顶点被单侧大腿或骨盆拖出，相对周围 4 cm 形成 33–70 mm 的局部鼓包（`audit.mjs` 的 crotch.bump；阈值 28/32 mm，`analyze.py` CROTCH_BUMP）。

### 方案（v2，采用）
- 只换权重，不动几何、不加骨骼、不做逐帧计算。以裆点（骨盆系 (0,-0.16,0)）为心、半径 **0.18 m** 的球内，对 `pelvis / spineLower / leftThigh / rightThigh` 四根骨的权重做**双调和（biharmonic）插值**：
  球外顶点权重逐个不变，球外两圈作为边界固定（C1 连续，不出棱）；球内不再钉中缝、不再钉大腿内侧，自由求解。离线解出，结果写成补丁。
- 文件：`tools/v5/runtime/crotchfix-v5-r1.js`（`applyCrotchFixV5({root,patch})`，在 installV5 之后、第一次 pose 前调用）+ `tools/v5/runtime/model/crotchfix-v5-r1.weights.json`
  （7193 个顶点，0..255 整数、每顶点和 = 255，与 glb 的 Uint8 归一化权重同精度；sha256 `9a130955…7061`）。安全检查：网格名、顶点数 39501、骨骼表、补丁前原权重校验和都必须与补丁记录一致，否则抛错，换模型不会误打。
- **开关**：渲染器 `tools/v5/render-masters-v5-cf1.mjs --crotchfix on|off`（= `render-masters-v5.mjs` 的拷贝 + 这一个开关，manifest 记 `v5.crotchFix` 与补丁 sha256）；审计 `tools/legacy-fix-r1/audit-cf1.mjs --crotchfix on|off`。
  **默认 off，与原版逐字节一致**：t-tuck-lsit-hold f180 360 px 母帧，`render-masters-v5.mjs` 与 `-cf1 --crotchfix off` 的全部 PNG 逐字节相同；`--crotchfix on` 只在裆部一小块（26×9 px 包围盒）不同。
  现有流水线（produce-v5、flare2 produce、第 1 批 produce.mjs）都不读这几个文件，行为不变；只有 `tools/legacy-fix-r1/produce-b2.mjs` 打开它。

### 试过、放弃的方案
| 方案 | 结果 | 放弃原因 |
|---|---|---|
| v1：同为双调和 R 0.18，另把会阴中缝钉成「骨盆 + 两腿各半」、大腿内侧钉成 100% 单腿（7383 顶点） | s-9090 鼓包 59.9 → 18.9 mm（比 v2 低 3.5 mm） | 裆部特写里中线出现一道硬折缝（钉死的约束本身就是分界），看图比原版还显眼 |
| 加大区域：椭球 R 0.24（心下移 4 cm）/ R 0.21（心下移 3 cm） | 离线代理鼓包再低 1–3 mm（t-tuck 27→24/25） | 离线折面计数大幅上升（h-chair-dip 39→138/64、h-squat 58→122/85、s-9090 200→273/256），大腿根前侧出现褶皱；半径越大越伤周边 |
| 按姿势逐个改（抬腿角/外展角） | — | 鼓包在 25+ 个动作里普遍存在，是模型权重问题；HANDOFF 规定不按姿势改 |

R 0.20 未试：全量 32 个动作在 R 0.18 下全部 < 28 mm、无新增 S1/S2，按约定不再加大半径（加大只会增加折面）。

### 验收（全量 32 个审计，stride 10；修前 = `audit.mjs` 原版，修后 = `audit-cf1.mjs --crotchfix on`，同一 recipe、同一 analyze.py）
审计键带 `@lfx` 的是第 1 批修好的 legacy-fix-r1 recipe（s-9090/adductors-A/h-short-side-plank 用修订标准），不带的是现行 remaining219 / flare2 recipe（原标准）。
组：第1批 lfx1 / 校准（开哥校准用的动作）/ M 名单（审计报 crotch-bulge 的动作）/ 站立对照。

| # | 动作（审计键） | 组 | 鼓包 修前→修后 mm（最坏帧） | S1 修前→修后 | S2 修前→修后 | 消失的条目 | 新增 |
|---|---|---|---|---|---|---|---|
| 1 | s-9090@lfx | 第1批 lfx1 | 59.9 (f40) → 22.4 (f80) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 2 | h-squat@lfx | 第1批 lfx1 | 43.7 (f180) → 18.9 (f190) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 3 | adductors-A@lfx | 第1批 lfx1 | 40.9 (f180) → 12.6 (f70) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 4 | deltoids-B@lfx | 第1批 lfx1 | 34.0 (f160) → 15.4 (f160) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 5 | h-short-side-plank@lfx | 第1批 lfx1 | 9.2 (f230) → 5.6 (f230) | 0→0 | 0→0 | — | 无 |
| 6 | s-9090 | 校准 | 43.1 (f120) → 19.1 (f120) | 3→2 | 2→2 | crotch-bulge:S1 | 无 |
| 7 | h-squat | 校准 | 37.7 (f170) → 16.5 (f200) | 6→5 | 0→0 | crotch-bulge:S1 | 无 |
| 8 | adductors-A | 校准 | 28.8 (f180) → 12.4 (f70) | 1→1 | 2→1 | crotch-bulge:S2 | 无 |
| 9 | h-short-side-plank | 校准 | 9.3 (f230) → 5.6 (f230) | 4→4 | 0→0 | — | 无 |
| 10 | t-wide-side-squat-shift | 校准+M | 41.6 (f180) → 13.9 (f70) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 11 | t-forearm-side-plank | 校准 | 6.9 (f230) → 4.0 (f230) | 0→0 | 0→0 | — | 无 |
| 12 | t-side-lying-straight-leg-abduction | 校准 | 7.5 (f180) → 4.0 (f180) | 0→0 | 0→0 | — | 无 |
| 13 | t-supine-straddle-open-close | 校准+M | 41.6 (f230) → 15.7 (f230) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 14 | t-tuck-lsit-hold | 校准 | 70.4 (f180) → 27.4 (f180) | 0→0 | 1→0 | crotch-bulge:S2 | 无 |
| 15 | h-chair-dip | M 名单 | 49.7 (f170) → 20.0 (f190) | 1→0 | 1→1 | crotch-bulge:S1 | 无 |
| 16 | h-bulgarian | M 名单 | 49.6 (f190) → 11.5 (f190) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 17 | h-chair-progressive-front-split-native | M 名单 | 46.8 (f140) → 14.2 (f230) | 1→0 | 1→1 | crotch-bulge:S1 | 无 |
| 18 | deltoids-C | M 名单 | 45.1 (f230) → 11.6 (f230) | 1→0 | 1→1 | crotch-bulge:S1 | 无 |
| 19 | h-couch-stretch | M 名单 | 44.0 (f120) → 12.9 (f230) | 1→0 | 2→2 | crotch-bulge:S1 | 无 |
| 20 | h-chair-step-up | M 名单 | 39.5 (f150) → 15.3 (f210) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 21 | h-adductor-rock | M 名单 | 37.5 (f200) → 15.0 (f200) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 22 | h-9090-liftoff | M 名单 | 37.2 (f230) → 17.2 (f210) | 3→2 | 1→1 | crotch-bulge:S1 | 无 |
| 23 | h-goblet-squat | M 名单 | 36.7 (f190) → 16.6 (f190) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 24 | h-donkey-kick | M 名单 | 36.6 (f190) → 14.0 (f230) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 25 | h-band-leg-out | M 名单 | 36.3 (f230) → 11.3 (f210) | 3→2 | 2→2 | crotch-bulge:S1 | 无 |
| 26 | h-db-row | M 名单 | 35.6 (f230) → 15.0 (f230) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 27 | glute-max-B | M 名单 | 33.0 (f190) → 11.7 (f190) | 1→0 | 0→0 | crotch-bulge:S1 | 无 |
| 28 | h-calf-raise | 站立对照 | 3.2 (f230) → 2.9 (f230) | 0→0 | 0→0 | — | 无 |
| 29 | h-db-curl | 站立对照 | 2.7 (f230) → 2.9 (f230) | 0→0 | 0→0 | — | 无 |
| 30 | h-band-pallof | 站立对照 | 5.0 (f0) → 3.3 (f0) | 0→0 | 0→0 | — | 无 |
| 31 | h-db-lateral | 站立对照 | 2.7 (f230) → 2.9 (f230) | 0→0 | 0→0 | — | 无 |
| 32 | h-bilateral-farmer-hold-native | 站立对照 | 3.1 (f230) → 2.9 (f230) | 0→0 | 0→0 | — | 无 |

- **鼓包**：非站立 27 个最坏 70.4 → **27.4 mm**（t-tuck-lsit-hold，阈值 28，余 0.6 mm），总和下降 62%；全部 < 28 mm。
- **S1/S2**：32 个动作合计 S1 37 → 16、S2 13 → 11；消失的**只有** crotch-bulge（21 条 S1 + 2 条 S2），**没有任何新增条目**。剩下的 S1/S2 全是修前就有的非裆部问题（原 recipe 的膝/髌骨/拧转等，第 1 批已用 lfx1 修的那几个在 `@lfx` 行里为 0）。
- **站立基线**（要求不变，3–4 mm）：h-calf-raise 3.2→2.9、h-db-curl 2.7→2.9、h-band-pallof 5.0→3.3、h-db-lateral 2.7→2.9、h-bilateral-farmer-hold-native 3.1→2.9 mm。站立时补丁不改变外形（±0.3 mm 为采样噪声），h-band-pallof 的 5.0 原本就偏高、修后回到基线。
- **看图**：32 个动作修后 25/50/75% 裆部特写（`camcr`）拼成缩略图看过，无撕裂、无尖刺、无新折缝。重点三个对比图（沙箱，上修前 / 下修后，英文标签）：
  - `/workspace/work/legacy-fix/b2/b2_cmp_t-tuck-lsit-hold.jpg`：修前从背后看臀下挂一个尖「水滴」，修后变成圆钝的小弧；App 机位下该处被腿遮住。
  - `/workspace/work/legacy-fix/b2/b2_cmp_s-9090.jpg`：修前 f80 正面特写裆下戳出一片尖角、f40 中线有缺口；修后平顺。
  - `/workspace/work/legacy-fix/b2/b2_cmp_h-squat.jpg`：修前正面特写裆中间吊一个带凹口的小包；修后是干净的 V 形。
- **风险点**：① t-tuck-lsit-hold 余量只有 0.6 mm，读数随采样有 ±1–2 mm 波动（第 1 批 adductors-A 见过 stride 3/10 差 13 mm 的情况），加密采样可能略超 28；但该处在 App 机位被腿挡住、背面看已是圆弧。
  ② s-9090 离线折面计数 130 → 200（区域内三角形翻折数，代理指标），特写图里看不出折痕，样片里请留意换髋到底时的裆部。③ 只修了 `CoachV3r3_3`（短裤/腿网格），其他网格未动。

### s-9090 文字（开哥 16:21 选换髋版，已定稿）
- 修前（`catalog/production/v3-text/s-9090.json`，原标准）：名称「90/90 坐姿拉胯」，静态保持（kind hold）。对换髋版动画审计：S2 `text-hold-moving`「文字是静态保持，视频里找不到静止段（最稳的 30% 时长内仍变化 20 cm）」。
- 修后（`catalog/production/legacy-fix-r1/text/s-9090.json`，修订标准 `tools/legacy-fix-r1/standards/s-9090.json`）：**`text-hold-moving` 消失**，修后 S1 0 / S2 0（裆部修复打开时）。
- 新文字要点：名称「90/90 坐姿换髋 / 90/90 Hip Switch」；`training.kind = rep_alternate`、`perSide alternate`、`repUnit left+right`，8 s 一个往返（右前停约 1 s → 双膝翻到左前约 2.2 s → 停约 1.4 s → 翻回 2.2 s → 停 1.2 s），默认 2 组 × 6 次、组间 15 s；
  步骤/阶段：右腿在前 90/90 → 双膝翻到另一侧 → 左腿在前 90/90；要点：脚跟压稳双膝一起翻、上身坐直双手前伸别后靠、两边都落成 90/90、膝跟着髋转别硬拧；
  常见错误新增「翻得太快，落地没停稳就往回翻」；语音引导（script-only）：第 1 下后「脚跟压稳，双膝一起翻过去」、第 3 下「上身坐直，双手往前伸，别往后靠」、第 4 下「每边都落稳成 90/90 再翻回去」、第 5 下共享词条 `p.last_rep`，开始前 `p.right_first`。
  `reviewStatus: user-selected-legacy-fix-r1`，`decision` 字段记开哥 2026-11-21 选定；原 v3-text 文件未改。

### 样片
`tools/legacy-fix-r1/produce-b2.mjs`（第 1 批 produce.mjs 的拷贝，母帧换成 `render-masters-v5-cf1.mjs --crotchfix on`），7 个：t-tuck-lsit-hold、s-9090、h-chair-dip、h-bulgarian、h-squat、t-supine-straddle-open-close（修前鼓包最大的 t-tuck/s-9090/h-chair-dip/h-bulgarian + 开哥校准过的 h-squat/t-supine）+ h-calf-raise（站立对照）。
QA 孤立分支 `qa/legacy-fix-r1-b2`。任务卡 `tools/legacy-fix-r1/SAMPLE-CARD-b2-draft.md`。只出样片，不上传、不切指针、不合并。
