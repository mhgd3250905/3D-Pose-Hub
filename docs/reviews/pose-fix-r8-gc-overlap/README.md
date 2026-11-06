# Pose-Hub 小臂拧转/自穿模修复 r8：与地面修复分支重叠的 14 个（分支 fix/gc-overlap-limb-r1，base fix/ground-contact-r1）

**这些动作以地面修复版本（fix/ground-contact-r1 的 gc spec）为底，不要用 PR #29（fix/limb-twist-collision-r1）的版本。**
未合并、未上传、未切指针、未打 tag。

# r10（2026-11-05 21:50–23:00，r8 撤回的 2 个重写；用户 21:50「全部做完」）

**仍以 GC spec 为底**（`forearms-A-r2-gc1` / `h-kneeling-thread-needle-r2-gc1`），不要用 PR #29 的版本。口径同下方 r8：θ = scan-fast 60 Hz 手相对前臂拧转（展开后）最大值，目标 ≤90°；地面 `ground-penetration-audit --stride 16 --size 128`，修前 = GC spec 本轮实测（与 GC README 一致）。每动作最多 2 次。

## 修好（2 个）
| 动作 | spec / 改动 | θ 修前→修后（左/右，°） | 地面最低 修前→修后（mm） |
|---|---|---|---|
| h-kneeling-thread-needle 跪姿穿针 | `h-kneeling-thread-needle-r2-gc1-hp1` → `-hp2`：**重写穿针过渡段的右手朝向路径**。原来右手从撑地（指尖 +x、掌心朝下）直接 slerp 到穿针（指尖 -z、掌心朝上），两者正好差 180°，走哪边不确定，实测绕前臂走了约 -318° 的远路。hp1 让穿针目标本身在 1.8–2.6 s（回程镜像 5.4–6.2 s）由「掌心朝 -x（拇指朝上）」转到「掌心朝上」，混合按「撑地→拇指朝上→掌心朝上」的旋后路径走；hp2 再把过渡弧高 0.06→0.10 m（hp1 时拇指朝上的手小指侧在 ~2.1 s 入地 -6.9 mm，撤；弧高只在混合中段抬腕，撑地和保持段为 0）。**不加前臂转角表**，保持段（3–5 s）手朝向/位置与 GC 完全一样 | 24/352 → 24/**82**（单帧跳变 19，0 折返） | -1.5 → **-1.5**（右膝，同 GC）；**右肘保持段 +3.1 → +3.1 不变**；右手最低 +1.0（撑地）；每 4 帧复核（60 帧）同样 -1.5，右手全程 ≥ +1.0 |
| forearms-A 跪姿多方向腕部摇摆 | `forearms-A-r2-gc1-ht2`：随时间前臂转角表，左 = r8 ht1（a 0.55 b 5），右 = r8 ht1 的表整体 -20°（手相对前臂目标 -85→-65°；r8 实测 -80…-98，解算残差约 +13°） | 157/158 → **86/75**（r8 撤回版 86/98） | -2.7 → **-2.7**（左膝，同 GC） |

- h-kneeling-thread-needle 自穿模（全链 dbg，关键帧 0/2/3/4/6 s）：修前修后逐项相同——保持段左前臂/左手↔右前臂 33.9/29.5 mm（117/80 顶点，穿针时右臂从左撑臂下穿过，GC 版就有，本轮未动）；过渡段新增右手→左前臂 4.6 mm（0 顶点 >10 mm）。
- forearms-A 只改前臂绕自身长轴的转角（未全链复测穿模，同 r8 口径）。

---
# r8

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

## 撤回（各 2 次以内，配方保持 GC 版）——**两个都已在 r10 修好，见上**
- forearms-A：ht1 左 157→95、右 158→102；第 2 次按实测残差闭环修正一轮，左 86 过、右 98 仍 >90（右侧总转动 -212…-18°，手恒定 -85° 时前臂要转 127°，解算对 elbowTwist 不完全线性）。整动作撤回。候选 spec 留在本地 `work/pose-fix-r8/rejected-forearms-A-r2-gc1-ht1.js`，未提交。
- h-kneeling-thread-needle：ht1 右 θ 352→84 过，但穿针保持段（f96–144）前臂被转了约 85°，右肘地面 GC +3.1 → **-8.6 mm**，破坏 GC 修复，撤回。根因是 spec 里右手朝向在 1.8–2.2 s 过渡段走了「长路」（总转动 164→-154°，约 -318°）：任何手/前臂分摊在保持段都会留下 ≥85° 前臂转角。要修需重写穿针过渡段的手朝向路径（走短路），超出本轮范围。

## 发现：PR #29 和 GC 还有 3 个配方冲突不在 14 个里
deltoids-C、n-straddle-fold、s-kneel-hipflex 两边都改了配方（PR #29 在 r2–r7 修了自穿模，GC 修了穿地），PR #29 的 spec 不是以 gc spec 为底。合并时同样需要按 gc spec 为底重做，本轮未动。

## 交接
渲染交接单：r8 `/workspace/work/handoff_render_posefix_b6.txt`（deliveries/pose-fix-b6-<提交号>/）；r10 `/workspace/work/handoff_render_posefix_b9.txt`（deliveries/pose-fix-b9-<提交号>/）。
