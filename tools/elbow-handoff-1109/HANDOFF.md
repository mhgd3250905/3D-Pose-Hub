# 交接：肘部糖纸拧转修复（2026-11-09 11:40 CST）

接手 Agent 先读完本文再动手。所有动作修改只有 CPU 蒙皮指标，**未经 GPU 渲染与用户最终验收，不得声称已修好**。

## 1. 仓库与 PR 状态

| 项 | 分支 | 状态 |
|---|---|---|
| PR #39（Draft） | `codex/elbow-twist-r1` → main，**叠在 PR #38 上** | 本文所在分支。合并顺序 #38 → #39 |
| PR #38 | pose-fix-1108 七个动作（erectors-B-r2、glute-max-C-r2、h-adductor-rock-r2、h-hip-gate-r3、erectors-A-r3、glute-max-A-r4、deltoids-B-r3） | 用户已通过 erectors-A-r3、glute-max-A-r4；其余待 GPU 验收 |
| PR #37 | `codex/open-book-arm-r1`，open-book 定 r12（374bb69） | 用户 14:09 已通过；扫描标为肘 0.825，按要求不在本分支修 |
| 线上 | catalog r2-v10（dev/beta/stable） | 未变 |

已批准（用户 11-08 14:13）：七个动作经用户验收后连同 open-book r12 一起渲染 **r2-v11**、上传、切 dev/beta/stable、合并 PR #37。**肘部修复若并入 r2-v11，需用户另行确认。** 其它合并、上传、切指针、打 tag、Release 一律先问用户。只推 feature 分支，Draft PR，不 force。`gh` 不可用，用 GitHub REST API。

## 2. 用户确立的方法（必须遵守）

1. **先定朝向、后调扭转。** 按动作意图（查动作说明或权威参考）先把上臂前侧、肘窝、掌心、手指朝向摆正，再微调扭转。不要在错误朝向上用 upperArmTwist/elbowTwist 去补截面——r1 这样做导致肩部折叠。
2. 用户指出过的错误：面拉两臂外翻（应两臂正面相对、掌心相对）；仰卧手放地时拳头不顺前臂；臀桥手臂屈肘反撑（应伸直平放体侧、掌心朝下）；四点支撑应手在肩下、肘窝朝前偏内，手指方向变化由整臂（肩）旋转 + 前臂旋前旋后分担，肘只是铰链。
3. 时变扭转不得全部压到肩（c=1 禁用）。参照 forearms-A-r5：肩 15–20%，前臂滚转约 30%，其余交给手对前臂（运行时沿前臂到腕分摊）。
4. 验收约束（全程密集采样取最差帧）：肘截面两侧 ≥0.85；肩截面不低于修前 −0.03，无新增肩部翻折；跨肩扭转不比修前大 >15°（朝向纠正需要时说明）；手/器械/关节漂移 0 mm；求解警告不增；接触代理不变差；腕截面不变差。
5. r1 提交说明里的方向描述不可靠（偏约 75°），以上臂解剖前侧为准。
6. 每动作一个提交，新 `-rN` spec；配方 `elbowTwistFix: r2, reviewed:false, supersedes:<旧spec>`。撤回用新的 revert 提交，不改历史。
7. 用户额度紧：每批 10 个，测量一次 heavy 批量跑完，每批 1–2 张合图，过关后推送并在 PR #39 评论，然后停下交用户看图。

## 3. 进度

### 已通过用户看图的 r2 样板（不要再动）
- h-band-face-pull-r3 `9b31518`（掌心相对中立握）
- h-band-leg-out-r3 `6a33f4c`
- h-bridge-march-r3 `4ee6625`（NASM / Physitrack：双臂体侧平放掌心朝下）
- forearms-A-r5 `6564777`（肘 0.87/0.89，肩 0.79/0.83；用户 11:13「ok 通过」）
- 工具函数 `drill-anim/lib/arm-orient-r2.mjs`（`ee49443`）：`fixSide`、`rollHand`、`setHandNatural`

### 其余 30 个 r1 修复动作的肩部分诊（修前 → r1，已测 17 个）
**r1 肩部变差，需要按方法重做（15 个，按严重度）：**
t-seated-straddle-lift-1leg（肩 0.78/0.77→0.35/0.27，跨肩 39°→178°）、scapular-A（0.47/0.50→0.35/0.38，翻折 70→350）、h-tabletop（0.89→0.43）、h-wall-pec（0.72→0.25）、o-seated-sidebend（R5 0.45→0.29，跨肩 38°→87°）、h-overhead-triceps-stretch（左 0.44→0.35，右 R5 0.37→0.25）、forearms-B（0.98→0.53）、h-kb-swing（0.52→0.32）、lats-A（0.95→0.65/0.68）、h-db-front-raise（0.89→0.66/0.67）、w-feet-on-chair-bridge（0.99→0.68）、hamstrings-B（1.00→0.68）、h-reverse-crunch（1.01→0.76/0.74）、hip-abductors-B（1.04→0.87/0.86）、h-hip-gate（1.02→0.88）。

**保留 r1（肩部无损、朝向对）：** h-supine-heel-slide（肘 0.85/0.87）、h-supine-bilateral-leg-raise（肘仅 0.81/0.80，部分修复）。

**未测（13 个）：** glute-max-C（只测了修前）、w-dead-bug、abs-A、n-straddle-fold、h-db-curl、obliques-C、s-kneel-hipflex、s-figure4、n-half-split、n-windshield、h-standing-arm-extension-stretch、h-bilateral-upper-back-hug、lats-B。

**线索（推断，未验证）：** 多数受损动作修前上臂朝向本来是对的（仰卧、后撑类肘窝朝前偏外、左右对称），收窄来自 11-05 那轮 et1 只在一侧加了大 elbowTwist（125° 或 −180°）。可能不必动上臂：upperArmTwist=0，只调 elbowTwist 把滚转从肘移到腕，参照同动作没加 elbowTwist 的另一侧（如 h-tabletop 右侧肘 0.93）。h-tabletop 左侧可先试 elbowTwist ≈ +110/+130/+150。

### 已撤回 / 未修 / 待用户定
- 撤回：h-db-curl 首版（时变旋后移到肩，不符解剖；已用静态 upperArmTwist 重做为 r3，0.93/0.90，扭转仍约 45°）；h-band-biceps-curl-r7（`remote-keyframes-r1.mjs` 的 `fixed-band-handles-r1` 白名单只认 `-r6`，**是否扩白名单待用户定**，会动运行时，App 端可能有同样检查）。
- 有意不动：h-standing-forearm-rotation、h-db-zottman-curl（前臂旋转就是动作内容）。
- 扫描中未修的约 30 个（扭转非主因：t-lsit-tuck、t-flare-side-hold、t-vsit、h-inner-thigh、h-quadruped-open；改善不够：h-chair-dip、h-goblet-squat、h-db-reverse-curl、o-seated-ham、quadriceps-C、h-chair-kickback、deltoids-C、w-bird-dog、**deltoids-B（PR #38 r3 TGU，L 0.51，须在 r2-v11 前处理）**；手扭转增加过多：s-pigeon、h-floor-nordic-hand-reset、h-supported-single-leg-calf、h-kneeling-pushup、h-standing-wrist-deviation、h-db-supported-calf-raise、h-incline-pushup、o-seated-twist；单侧通过：h-calf-raise；漂移：h-reverse-clam、w-clamshell、s-seated-fold；接触变差：h-biceps-self、t-seated-straddle-ext、h-db-overhead-triceps-extension、h-crossbody）。用户未决定是否另开一轮；建议先用第 2 节方法做朝向审查。

## 4. 工具与续跑

本目录是沙箱工作目录的备份（去掉了 png 与日志，大 jsonl 已 gzip）：
- `elbow-scan/`：全局扫描（`batch.mjs` 可续跑，`REPORT.md`、`results.csv`、`summary.json`）。扫描指标：`tools/pose-fix-1108/elbow-pinch-metric.js`（肘最小截面宽度比）。
- `elbow-fix/`：r1 修复工具（`fix.mjs`、`metric2.js`、`autocommit.sh`、`render2.mjs`、`makespec.mjs`）。
- `elbow-fix/sh/`：r2 工具。`metric3.js`（肩部截面/R5/翻折/跨肩扭转 + 肘窝掌心朝向）、`ev.mjs`（逐帧测量，可续跑）、`run.sh`、`tri.py`（分诊）、`cmp.py`（候选对照约束）、`recipe2.py`（改配方）、`render3.mjs` + `sheet.py`（对比图）。`jobs-s4.json` 含 30 个动作的修前/r1 spec 路径；`s4.jsonl.gz` 为已测 17 个的数据。

脚本内路径写的是沙箱的 `/workspace/work/elbow-fix/`、`/workspace/work/elbow-scan-wt/`，换环境需改路径。续跑命令（原环境）：

```
export PATH=/workspace/work/flutter-sdk/sdk/flutter/bin:$PATH PUB_CACHE=/workspace/work/flutter-sdk/pub-cache
cd <repo> && setsid nohup node_modules/.bin/vite --host 127.0.0.1 --port 8871 > vite.log 2>&1 &
cd elbow-fix/sh && gunzip -k s4.jsonl.gz && setsid nohup bash run.sh jobs-s4.json s4.jsonl &   # 跳过已测项，约 1 分钟/动作
python3 tri.py s4.jsonl
python3 cmp.py s4.jsonl <候选.jsonl> <id> left,right
python3 recipe2.py <id> <新spec相对路径> <why文件>
```

用完按 PID 停 vite 和 chrome（不要用 `pkill -f`）。重任务一次一个，不并行（沙箱曾因并行渲染 OOM）。

## 5. 勿提交
`packages/ugk_coach_chat/.flutter-plugins-dependencies`、`packages/ugk_trainer/example/pubspec.lock`、本地 config.json GPU 改动、r2-v5/v6/v7 tsv、SF `test/coach_chat_qa_v2_test.dart`、`tools/foot-angle-r1/summ.py`、`drill-anim/specs/_tmp1108/`、`drill-anim/specs/h-open-book-r10.js`。

## 6. 其它待办（与肘部无关，供参考）
- Flare（3D-Body app/）PR #132 Draft，1.0.12+25 待用户出包与真机覆盖安装验收。
- HipLab main 98f891b（+62）；建议升 +63 小 PR，用户未答。
- SDK `ugk_trainer-v0.8.0` 已打 tag，未建 Release。
- 肌群 AI 标签 `ai-reviewed-r2-needs-user-review` 待用户复核。
