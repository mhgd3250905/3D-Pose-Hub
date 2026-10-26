# 生产分支 v2 修订 spec 合入清单（2026-10-26）

来源：`origin/codex/action-library-v2-production`（HEAD `36e1bb678047a3d5613a553a05be37dac8d9046b`）相对 merge-base `41b1922459e36cd4ff2947828135b755465d0613`，`drill-anim/specs` 下新增 47 份修订 spec + 1 个共用模块 `_draft-native8-r1.mjs`；生产分支**没有修改任何已有 spec**（diff 只有 A，无 M/D）。对照基线：`origin/main` `1fdd117`（已含 PR #15）。

## 结论摘要

- main 状态：47 份在 main 上**均不存在**（无同名同内容=已合入，也无同名不同内容=冲突）；PR #15 在 main 新增的 44 份 `*-rr*` 等规格与这 47 份的基础动作无重叠。
- 冻结规则：47 份都是新文件，未覆盖任何已登记 spec；它们 `import` 的原版/上一修订在 main 上全部存在且与生产分支逐字节一致（链内依赖 `h-side-leg-raise-r2→r3→r4→r5`、`h-step-jack-r2→r3`、`hamstrings-A-r2→r3` 同批带上）。
- 模型：全部使用 main 已有的 `training-human-v2plus` 配方（`hands:'base'`），不依赖 native-open / native-grip 等专用模型，不改 `lib/`、`page/`、`runtime/`。
- **干净可合 35 份** → `drill/v2-production-revisions`（PR #18）。
- **需审 12 份 + 1 个新共用模块** → `drill/v2-production-native8`（PR #19，draft，单独审）：技术上无冲突、可通过 verify，但属于 native8 第一版“8 秒循环”改编，改了时长、演示次数和停留时间，部分停留缩到 1 s 以下，需要按 review-rubric §1（拉伸停留 ≥2 s、节奏）和 App 处方逐个确认；另需在 `verify.mjs` 登记新共用模块 `specs/_draft-native8-r1.mjs` 的哈希。
- 硬冲突（main 已有同名不同内容、或改了已登记文件）：**0**。

SHA 登记：每份的 LF 规范化 sha256 与生产分支 `home-pr-candidates.json` 原登记值逐一核对一致；`sourceCommit` 填生产分支上该文件最后所在提交（`0e4e8b822f386f267f1b655d2f79a0ffd8ca839a` b001–b003，`97d97a0ceecb2826c38e140b24be6afa0a3eef31` b004/native8/诊断修订）；`pr` 已回填（#18 / #19）。`review` 字段沿用生产分支原文（均为“视觉/接触/源审核待定，非发布认可”）。

不在本次范围（生产分支上另有，未搬）：`catalog/v2/**`、`catalog/voice-v2/**`、`catalog/action-library/*`、生产快照文档、`tools/action-library-v2*/`、`drill-anim/tools/v2-draft/`，以及生产分支对 AGENTS/README/START-HERE 等文档的改动。

## A. 干净可合（35）

| 文件 | main 状态 / 基于 | 来源批次 | 改动点 |
|---|---|---|---|
| `abs-A-r2.js` | main 无；基于 `abs-A.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b004 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `abs-A.js` 不变。 |
| `adductors-A-r2.js` | main 无；基于 `adductors-A.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b002 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `adductors-A.js` 不变。 |
| `deltoids-A-r2.js` | main 无；基于 `deltoids-A.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b004 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `deltoids-A.js` 不变。 |
| `h-9090-liftoff-r3.js` | main 无；基于 `h-9090-liftoff-r2.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b003 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-9090-liftoff-r2.js` 不变。 |
| `h-banana-r2.js` | main 无；基于 `h-banana.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b001 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-banana.js` 不变。 |
| `h-butterfly-active-r2.js` | main 无；基于 `h-butterfly-active.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b003 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-butterfly-active.js` 不变。 |
| `h-crunch-r2.js` | main 无；基于 `h-crunch.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b001 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-crunch.js` 不变。 |
| `h-good-morning-r2.js` | main 无；基于 `h-good-morning.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b001 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-good-morning.js` 不变。 |
| `h-knee-hug-r3.js` | main 无；基于 `h-knee-hug-r2.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b003 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-knee-hug-r2.js` 不变。 |
| `h-reverse-clam-r2.js` | main 无；基于 `h-reverse-clam.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b003 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-reverse-clam.js` 不变。 |
| `h-russian-twist-r2.js` | main 无；基于 `h-russian-twist.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b001 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-russian-twist.js` 不变。 |
| `h-side-leg-raise-r2.js` | main 无；基于 `h-side-leg-raise.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b002 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-side-leg-raise.js` 不变。 |
| `h-side-leg-raise-r3.js` | main 无；基于 `h-side-leg-raise-r2.js`（main 有，内容一致） | 2026-10-21 b002 contact and seam diagnostic revisions | 接触/接缝修复：固定骨盆矢状面 pz（原 LM 变量欠约束，冷/热启动收敛不一致）；静止时把自由脚 −3° 鞋滚转压平（只改 k3 轨，峰值 −32° 不变），不抬踝、不屈膝。 |
| `h-side-leg-raise-r4.js` | main 无；基于 `h-side-leg-raise-r3.js`（main 有，内容一致） | 2026-10-21 b002 contact and seam diagnostic revisions | 手接触诊断候选：去掉旧代理 touch walker（找不到法线时会把手往躯干内推最多 120 mm），恢复原髋坐标系下的掌心目标与朝向；只改 pose.base。 |
| `h-side-leg-raise-r5.js` | main 无；基于 `h-side-leg-raise-r4.js`（main 有，内容一致） | 2026-10-21 b002 contact and seam diagnostic revisions | 按新网格实测把左右掌心目标各向腰部表面移近（原间隙约 11.4/9.5 mm，保留 0.5 mm）；朝向、髋坐标系、抬腿/踝/脚滚转轨、支撑求解和节奏沿用 r4。 |
| `h-squat-r2.js` | main 无；基于 `h-squat.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b001 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-squat.js` 不变。 |
| `h-step-jack-r2.js` | main 无；基于 `h-step-jack.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b001 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-step-jack.js` 不变。 |
| `h-step-jack-r3.js` | main 无；基于 `h-step-jack-r2.js`（main 有，内容一致） | production b001 GPU4080 r2 shoe sole calibration | 鞋底高度校准：r2 实测鞋底 minY −2.02 mm（穿地），两侧踝 Y 各抬 +2.27 mm（目标 +0.25 mm），只改 k22/k26 两条轨，动作不变；新增 qaCalibration 记录。 |
| `h-sumo-pry-r2.js` | main 无；基于 `h-sumo-pry.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b002 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-sumo-pry.js` 不变。 |
| `h-superman-r2.js` | main 无；基于 `h-superman.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b001 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-superman.js` 不变。 |
| `h-supine-twist-r4.js` | main 无；基于 `h-supine-twist-r3.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b003 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `h-supine-twist-r3.js` 不变。 |
| `hamstrings-A-r2.js` | main 无；基于 `hamstrings-A.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b002 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `hamstrings-A.js` 不变。 |
| `hamstrings-A-r3.js` | main 无；基于 `hamstrings-A-r2.js`（main 有，内容一致） | 2026-10-21 b002 contact and seam diagnostic revisions | RDL 够距校准：去掉旧版 +55 mm 腕部 rest-Z 偏移（超出新人体臂长）；右自由踝 Y/Z 向量绕右髋缩短到膝最大 178°；左脚支撑、节奏、旋转、前屈轨与 QA 不变。 |
| `hip-flexors-A-r2.js` | main 无；基于 `hip-flexors-A.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b003 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `hip-flexors-A.js` 不变。 |
| `n-pelvis-circle-r2.js` | main 无；基于 `n-pelvis-circle.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b002 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `n-pelvis-circle.js` 不变。 |
| `n-seated-ir-drop-r2.js` | main 无；基于 `n-seated-ir-drop.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b003 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `n-seated-ir-drop.js` 不变。 |
| `n-squat-shift-r2.js` | main 无；基于 `n-squat-shift.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b002 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `n-squat-shift.js` 不变。 |
| `n-thomas-test-r2.js` | main 无；基于 `n-thomas-test.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b003 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `n-thomas-test.js` 不变。 |
| `n-windshield-r2.js` | main 无；基于 `n-windshield.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b004 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 15→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `n-windshield.js` 不变。 |
| `o-stand-sidebend-r2.js` | main 无；基于 `o-stand-sidebend.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b001 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `o-stand-sidebend.js` 不变。 |
| `s-9090-r4.js` | main 无；基于 `s-9090-r3.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b004 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `s-9090-r3.js` 不变。 |
| `s-butterfly-r2.js` | main 无；基于 `s-butterfly.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b004 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `s-butterfly.js` 不变。 |
| `s-figure4-r2.js` | main 无；基于 `s-figure4.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b004 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `s-figure4.js` 不变。 |
| `s-seated-fold-r4.js` | main 无；基于 `s-seated-fold-r3.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b004 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `s-seated-fold-r3.js` 不变。 |
| `w-clamshell-r3.js` | main 无；基于 `w-clamshell-r2.js`（main 有，内容一致） | 2026-10-21 action-package@2 production b004 | 人体包装：换 training-human-v2plus（rc2，紧身服/base 躯干四肢手/realistic 皮肤，alignClavicles:false），fps 30→30、size 1080；动作、节奏 8 s、道具、镜头、高亮全部继承 `w-clamshell-r2.js` 不变。 |

## B. 需审（12 + 共用模块）

| 文件 | main 状态 / 基于 | 来源批次 | 改动点 | 冲突/需审原因 | 建议 |
|---|---|---|---|---|---|
| `chest-A-r3.js` | main 无；基于 `chest-A-r2.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：12 s→8 s。保留右、左两组俯卧撑转侧桥，运动段时长不变；删去中立预备/复位，每侧侧桥停留 1.0 s→0.3 s（不再声称停留剂量）。高亮 pulseAt、镜头 at/driftPeriod、stillAt 3.5→2.85、keyFrames 随之调整。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `chest-B-r2.js` | main 无；基于 `chest-B.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：7 s→8 s。两次完整 3.5 s 原速动作，每次顶端加 0.5 s 停留；握持/前伸行为不变，默认剂量不变。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `deltoids-B-r2.js` | main 无；基于 `deltoids-B.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：12 s→8 s。一次完整“仰卧→肘撑→坐起→高桥”及回程（半土耳其起立），右手哑铃/左手支撑不变；升/降段重新定时 1.2/1.1/1.1 s、高桥停 0.6 s。原运动时长 8.8 s 装不进 8 s，新节奏须审。stillAt 6→4。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `forearms-A-r2.js` | main 无；基于 `forearms-A.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：16 s→8 s。四个腕部朝向与每块两次换手保留，每块 4 s→2 s（换手 0.35 s、前后各 0.4 s、停 0.15 s、复位 0.2 s）。属加快的演示节奏，不是计时拉伸处方；接触/keepReach/指节间隙未审。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `hip-abductors-A-r2.js` | main 无；基于 `hip-abductors-A.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：6 s→8 s。两次完整右腿侧抬（左前臂撑），不换侧；每 3 s 一次后加 1 s 低位休息，arc/lift 轨同步。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `n-leg-circles-r2.js` | main 无；基于 `n-leg-circles.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：12 s→8 s。仅右腿，画圈两圈→一圈（3.6 s 重新做端点零角速度缓动，不是裁剪），保留跨腿与回程运动段（1.2/1.2/0.6/0.8 s），停留 1 s→0.6 s；stillAt 2→6.3。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `quadriceps-C-r2.js` | main 无；基于 `quadriceps-C.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：10 s→8 s。两次→一次完整 5 s 动作，加 3 s 底部休息；保留 2 s 锁定停留与全部运动/滚轴坐标；演示次数变，默认剂量不变。stillAt 1.6→2.6。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `scapular-A-r2.js` | main 无；基于 `scapular-A.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：12 s→8 s。保留 Y、T、W 及回 Y，抬/落 0.8 s、滑动 0.9 s 速度不变；删每个字母 0.3 s 中立预备，每个停留 1.2 s→1/6 s（5 帧），不再暗示静态停留处方。stillAt 1.7→0.883。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `serratus-A-r2.js` | main 无；基于 `serratus-A.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：6 s→8 s。两次完整直臂肩胛后缩/前伸/回中，每次 3 s 后加 1 s 中立休息；不加屈肘。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `t-seated-straddle-lift-1leg-r2.js` | main 无；基于 `t-seated-straddle-lift-1leg.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：10 s→8 s。每侧两次→左右各一次 1.6 s 抬腿，保留两段完整 1.8 s 举手/转身/重放手过渡，每侧加 0.6 s 静置；左先、4 s 换侧。默认剂量不变。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `triceps-A-r2.js` | main 无；基于 `triceps-A.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：7.2 s→8 s。两次完整 3.6 s 窄握动作原速保留，每次顶端锁定加 0.4 s（只加长不缩短）。默认剂量不变。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `triceps-B-r2.js` | main 无；基于 `triceps-B.js`（main 有，内容一致） | 2026-10-22 draft-first native8 authoring r1 | native8：7 s→8 s。一次完整 7 s 支撑抬起与回程 + 1 s 低位休息；保留 2.9 s 峰值停留、压肩/握/道具。演示循环，不是静态停留处方。stillAt 0→3.5。 | 节奏/剂量改编，releaseEligible:false；依赖新共用模块 `_draft-native8-r1.mjs` | 开哥逐个确认节奏与 App 处方后再合；主线本机渲关键帧看 |
| `_draft-native8-r1.mjs` | main 无 | 2026-10-22 native8 r1 | 共用纯数学 helper：显式源切片/局部相位编成 8 s×30 fps 轨道，禁全局时间拉伸；sha256 `41ee05e3d6dda7708f851e4cd5a204634f2aa03e47e4873bbeceb65fb2730851` 登记进 verify.mjs | 新共用模块 | 随 PR B 一起审 |

## 验证与未做

- 两个分支各自 `node drill-anim/verify.mjs` → `ok: true`；`node drill-anim/tools/catalog.mjs` 已重生成 `docs/drill-catalog.md`。
- 未渲染任何帧（本次是整理任务）；生产分支记录的 4080 草稿渲染与诊断不作为本 PR 的审核证据。预览帧、稀疏 QA、全片 QA 留给主线本机。
