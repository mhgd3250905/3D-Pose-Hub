# pose-fix 集成 r1（release/pose-fix-integration-r1，2026-11-06）

从 origin/main（9788bd1，已含 PR #27 r2-v1 规整）依次合入：
1. fix/ground-contact-r1（bb801ed，地面穿模修复 GC）—— 无冲突
2. PR #30 fix/gc-overlap-limb-r1（52b0053，GC 重叠动作的拧转/自穿模修复）—— 无冲突
3. PR #29 fix/limb-twist-collision-r1（7521e44，小臂拧转/自穿模修复）—— 8 个冲突，处理见下
4. PR #28 codex/side-text-fix（5aa127b，r2-v2：rhythm.execution 左右轮流字段）—— 无冲突

## 冲突处理（原则：两边各自的修复都保住）

| 文件 | 处理 |
|---|---|
| recipes/forearms-A、h-kneeling-thread-needle、h-quadruped-open、t-seated-straddle-lift-1leg | 取 PR #30 版：#30 就是以 GC spec 为底重做的 #29 修复（第 6、9 批渲染即此版） |
| recipes/deltoids-C、n-straddle-fold、s-kneel-hipflex | 两边都改了 spec。新建 `<id>-gc-int1.js`：以 GC spec 为底，叠加 #29 sc1 的修正；配方保留 groundContactFix 与 poseFixR1 两段记录，新增 poseFixR1.integration |
| docs/reviews/pose-fix-audit-r1/README.md | #29、#30 两份报告原样保留（先 #29 后 #30） |

共享代码（hands-native-r6 wrist-twist、palm-offset-sc1、action-package-v3 的 model-adapters/models.json/recipe-scene）#29 与 #30 两边内容完全一致，自动合并。

### 3 个集成 spec

- `deltoids-C-gc-int1`：gc1（骨盆 +32 mm、后膝贴地）+ sc1（左手 touch.clear +36.1 mm）。
- `s-kneel-hipflex-gc-int1`：gc1（后脚踝 +11 mm、跖屈 −3°）+ sc1（叉腰双手 touch.clear 左 +41.4 / 右 +38.7 mm）。
- `n-straddle-fold-gc-int1`：gc1（双手落砖面 +25.9 mm，烘焙轨道版）+ sc1（肘 pole 改为 [±0.22, 0.9, −0.35]、分腿 50→53°，脚踝按源公式重算；脚踝 y 不变）。

### 复测（同一套生产链工具，沙箱，2026-11-06）

地面：`tools/ground-audit-r1/ground-penetration-audit.mjs --stride 4 --size 96`；砖面：`raised-mat-vertex-audit.mjs --stride 16 --size 128`；
自穿模：`tools/self-collision-r1/self-collision-audit.mjs --size 64`（d10，mm，越小越好）。

| 动作 | 地面（最低几处，mm） | 自穿模 | 结论 |
|---|---|---|---|
| deltoids-C | int = gc1：左脚 0.0、右脚 0.8、右膝 1.3 | 左手→左大腿 gc1 40.9 → int **2.6**（sc1 3.0）；右上臂→躯干（腋下）76.4，gc1 同值，非本次引入 | 过 |
| s-kneel-hipflex | int = gc1：左小腿 −0.4、右脚 0.0、左脚 1.1 | 左/右手→躯干 int 8.1/6.6 = sc1 8.1/6.6 | 过 |
| n-straddle-fold | int = gc1：双脚 12.8（坐姿脚跟抬离）；砖面：双手 1.0 = gc1 1.0，入砖 0 | 上臂/前臂→大腿 gc1 11–16 → int **0**（sc1 0）；腋下 gc1 96.9 → int 72.7（sc1 62.3，腋下项按既定口径接受）；前臂→躯干 17.6（sc1 16.0） | 过 |

结论：3 个都保住了 GC 的地面修复和 #29 的自穿模修复，无回退。**需在集成分支重渲这 3 个**（第 2/5 批里的版本没有 GC 修复，作废）。

## 配方核对

`python3 tools/pose-fix-integration-r1/check-spec-sha.py`：249 个配方 specSha256Lf 全部与文件一致，spec 的本地 import 全部存在。
4 条提示（deltoids-A、h-band-pallof、h-bilateral-farmer-hold-native、h-plank-side-step 的 source.selectedSpec ≠ spec）main 上本来就这样，未改。

渲染来源核对：94 个新媒体动作，集成分支的配方与各自渲染提交里的配方逐字节相同（除上述 3 个）；其余 155 个动作的配方与 main 完全相同，沿用 r2-v1 媒体有效（GC 的 34 个已在 r2-v1 里）。

## r2-v3 素材包

见 `release/app-pack-r2-v3/`（草稿）与 `tools/app-pack/build_r2_v3.py`。媒体前缀仍为 `pack/r2-v1/`（SDK 只认一个 objectKeyPrefix，且 downloadUrl 必须 = baseUrl + path），
94 个新媒体用新版本段 `media/<id>/r2-v3/`（全新对象键，只追加）；目录放 `pack/r2-v3/`。用 SDK（ugk-3d-pose-sdk c2ab524 的 PoseHubAppTestCatalog.fromBytes）对合成媒体定稿出的目录试解析通过。
