# Pose-Hub 小臂拧转/自穿模修复 r8：与地面修复分支重叠的 14 个（分支 fix/gc-overlap-limb-r1，base fix/ground-contact-r1）

**这些动作以地面修复版本（fix/ground-contact-r1 的 gc spec）为底，不要用 PR #29（fix/limb-twist-collision-r1）的版本。**
未合并、未上传、未切指针、未打 tag。

## 为什么单开分支
PR #29 r1–r7 跳过了 14 个与 fix/ground-contact-r1 重叠的动作（两边都要改配方/spec，合并会冲突或丢掉穿地修复）。
本分支从 origin/fix/ground-contact-r1（bb801ed）开，每个新 spec 都 `import` GC 的 spec（`*-gc1` / `*-gc2`）再叠加前臂转角/touch 间隙。
第 1 个提交只引入 PR #29 的共用运行时和工具（与 5c1353d 逐字节一致，合并时不冲突）：hands-native r6 腕扭转（opt-in，本轮未开）、
palm-offset-sc1、tools/elbow-audit-r1、tools/self-collision-r1、tools/pose-fix-r1、action-package-v3 的 wristTwistRuntime 支持。

## 口径
- 小臂：`tools/elbow-audit-r1/scan-fast.mjs`（固定拧转 6 Hz，动态 60 Hz），θ = 手相对前臂绕前臂长轴拧转最大值（展开后），目标 ≤90°。修前 = GC spec 本轮实测（不是 PR #29 的旧数）。
- 地面：`tools/ground-audit-r1/ground-penetration-audit.mjs --stride 16 --size 128`（与 GC 的 M2–M6 同参数），全身各部位最低点；对比 GC README 记的修后值。
- 自穿模：全链 self-collision-audit（dbg 版，d10 ≤10 mm；<30 顶点不计；腋下不计）。14 个里只有 hip-abductors-A 有非腋下项。
- 做法：固定拧转 → 常量前臂转角 `-et1`（r2 手法，按实测在 ±360° 内搜最小代价）；动态拧转 → 随时间前臂转角 `-ht1`（r6/r7 手法，60 Hz 表，手目标 = a·总转动 + b）；手搭髋 → touch 间隙（r5 手法）。

## 修好（12 个）
| 动作 | spec | θ 修前→修后（左/右，°） | 地面最低（GC 修后 → 本轮，mm） |
|---|---|---|---|
| adductors-B | `adductors-B-gc1-et1`（左 +55） | 108/7 → 53/7 | +0.9 → -0.3（左肘贴地） |
| deltoids-B | `deltoids-B-r2-gc1-et1`（左 +105） | 168/35 → 46/35 | 0 → 0 |
| glute-max-A | `glute-max-A-r2-gc1-et1`（左 +120、右 -205；第 1 次右 -215 只到 92） | 137/137 → 17/82 | 0 → 0 |
| h-short-side-plank | `h-short-side-plank-gc1-et1`（左 +45） | 100/65 → 55/65 | -0.2 → -0.8（左肘贴地） |
| h-supine-bilateral-leg-raise | `h-supine-bilateral-leg-raise-gc2-et1`（左 +95、右 -190） | 110/110 → 15/81 | +0.5 → +0.5 |
| h-supine-heel-slide | `h-supine-heel-slide-gc2-et1`（左 +105、右 -195） | 118/118 → 13/76 | -0.3 → -0.3 |
| hip-abductors-A | `hip-abductors-A-r2-gc1-et1`（左 +50）→ `-et1-sc1`（右手 touch +30 mm） | 105/3 → 55/3 | -1.8 → -0.8 |
| o-supported-hip-hitch | `o-supported-hip-hitch-gc1-et1`（左 +60） | 125/9 → 58/9 | +0.2 → +0.2 |
| s-pigeon | `s-pigeon-gc2-et1`（左 +70、右 -75） | 133/133 → 54/49 | -2.8 → -2.8（前膝，同 GC） |
| scapular-A | `scapular-A-r2-gc1-et1`（左 -70、右 +170） | 152/152 → 81/51 | +0.1 → +0.1 |
| h-quadruped-open | `h-quadruped-open-gc2-ht1`（右，a 0.55 b -5） | 42/336 → 42/87 | 0 → 0 |
| t-seated-straddle-lift-1leg | `t-seated-straddle-lift-1leg-r3-gc1-ht1`（a 0.25 b ∓40） | 270/270 → 83/83 | -0.5 → -0.5 |

hip-abductors-A 自穿模（全链）：右手→躯干 25.2 mm（813 顶点）→ **8.7 mm（0 顶点 >10 mm）**；剩双脚叠放互穿 24.3/21.2 mm（静止帧侧平板双脚叠放，GC 版本就有，本轮未动：要动抬腿 arc 轨道的静止角或错脚，影响抬腿同步）。
只改前臂绕自身长轴的转角（hip-abductors-A 另改右手 touch 间隙），手/脚位置、手朝向、GC 的骨盆/撑点/着地点都不变。et/ht 类未全链复测自穿模（同 r2/r6 口径）。

## 撤回（各 2 次以内，配方保持 GC 版）
- forearms-A：ht1 左 157→95、右 158→102；第 2 次按实测残差闭环修正一轮，左 86 过、右 98 仍 >90（右侧总转动 -212…-18°，手恒定 -85° 时前臂要转 127°，解算对 elbowTwist 不完全线性）。整动作撤回。候选 spec 留在本地 `work/pose-fix-r8/rejected-forearms-A-r2-gc1-ht1.js`，未提交。
- h-kneeling-thread-needle：ht1 右 θ 352→84 过，但穿针保持段（f96–144）前臂被转了约 85°，右肘地面 GC +3.1 → **-8.6 mm**，破坏 GC 修复，撤回。根因是 spec 里右手朝向在 1.8–2.2 s 过渡段走了「长路」（总转动 164→-154°，约 -318°）：任何手/前臂分摊在保持段都会留下 ≥85° 前臂转角。要修需重写穿针过渡段的手朝向路径（走短路），超出本轮范围。

## 发现：PR #29 和 GC 还有 3 个配方冲突不在 14 个里
deltoids-C、n-straddle-fold、s-kneel-hipflex 两边都改了配方（PR #29 在 r2–r7 修了自穿模，GC 修了穿地），PR #29 的 spec 不是以 gc spec 为底。合并时同样需要按 gc spec 为底重做，本轮未动。

## 交接
渲染交接单：`/workspace/work/handoff_render_posefix_b6.txt`（产物目录 deliveries/pose-fix-b6-<提交号>/）。
