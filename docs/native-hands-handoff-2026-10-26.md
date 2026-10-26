# 新手 r3 适配交接（2026-10-26，待接手，勿合并）

## 状态
- 分支 `fix/native-hands-r3-candidates`，基于 main `1fdd117`。三个提交：h-squat 试点（1）、batch1 自由手（23）、batch2 接触类（213），共 **237 份新手候选 spec**，外加本交接提交。
- 全部是**未渲染、未审**的候选（`reviewed=false`、`releaseEligible=false`）。只改了 `modelProfile`/`nativeHands`（握 32 mm 单杠的改为 `nativeGrip`），动作、手位/接触目标、道具、节奏、镜头都没动。原 spec 没有覆盖，新文件为 `<id>-rN.js`，已登记 sha256（含 terminalTracks），`docs/drill-catalog.md` 已重新生成。
- 验证：`node drill-anim/verify.mjs`（534 份 spec，原有哈希保持）、`python -B drill-anim/test_portability.py`（7 项）、`node drill-anim/tools/catalog.mjs --check` 均通过。
- 入口：`drill-anim/models/native-open-r1/`。HD 批渲（`tools/hd/render_batch.py`）目前不认这些 profile，正式出片要先扩展这个入口，或改用 `native-open-r1/preview.mjs`。

## 清单与脚本（`docs/native-hands-handoff/`）
- `actions-best.csv`：243 个动作组的最佳版选择、依据、手部类别、是否在 catalog/media/v2 全库。
- `hand-inventory.csv`：297 份原 spec 的手部分类。
- `contact-check.csv`：batch2 每份候选按接触方式的估计误差和分级。
- `design-issues-batch1.md`：动作设计问题，只记录，没有修改。
- 脚本：`best.py`/`c2.mjs`（归组、分类）、`batch.mjs`（batch1：生成候选 + 解析检查）、`batch2.mjs`（batch2：生成候选 + 接触分级）、`handfk.py`（新旧手骨骼正向运动学对比）。用法见文件头。

## 问题与改法
| 类别 | 份数 | 问题（解析估计） | 建议改法 |
|---|---:|---|---|
| 自由手（batch1 + 试点） | 24 | 指尖缩回约 61 mm，不影响姿态；h-standing-wrist-extensor-stretch 直臂时可能折腕约 40° | 看双手近景；必要时参考 rr7 偏转手指方向 |
| 撑地 palm-floor | 62 | 掌面深度差约 69 mm（关节级上限估计），可能悬空或陷地 | 在新手上重新做 palm-floor 贴合，按 plank/四足/L-sit 分类试点 |
| 掌心目标 palmAt | 77 | 掌心位置差约 16 mm | 按新手掌心偏移修正目标，或在引擎侧换用新手的 E.R 掌心 |
| 指尖接触 touch | 30 | 指尖差约 69 mm，原接触会变成悬空 | 按手长比例补偿 touch 目标，重新解算 |
| 握器械（哑铃/手柄/毛巾等） | 48 | `lib/grip.mjs` 的 G/PF 常量来自旧手握拳，拳心差约 34 mm | 用新手重新烘焙一份握持常量（另存新文件），按器械做贴合 |
| 弹力带/绳 band-grip | 32 | 拳心差约 35 mm | 做新手的 band-grip 贴合 |
| 握 32 mm 单杠 native-grip | 2 行（lats-B、scapular-B） | 手位仍是旧手的写法 | 按 `h-fixed-bar-vertical-pull-rr7` 改用 `nativeGripPose` |
| 墙面 / world 定位 / 身体自触 | 25 | 脚本解析不了 | 逐个看近景 |

分级阈值：≤5 mm 通过，≤15 mm 轻微，>15 mm 需修。目前 213 份全部是"需修"。这是关节级、每种接触方式取常数的粗估，偏保守，精确值需要无头引擎求解或出近景帧。

## 验收标准（每份候选）
1. verify、portability、catalog --check 通过；原 spec 哈希不变。
2. `native-open-r1/preview.mjs` 出全身帧和双手近景：没有陷地、悬空、互穿；手腕不折；握持时器械在拳心里。
3. 接触指标：掌/指到接触面在 5 mm 以内，或在原规格的 QA 阈值以内。
4. 开看样确认后，才能改 `reviewed`，并纳入新的媒体版本。

## 待开拍板
- 27 个最佳版存疑的组：19 组是 catalog 引用原版而另有更新的 -r2；s-frog r2 和 r3 二选一；t-half-straddle 已停用；6 个 a-* 自测静图要不要算独立动作。
- 新手是否成为全局默认（`current-production.json`），以及 HD 管线怎么接入。
- 本 PR 把 237 份候选放在一个 PR 里，**和 AGENTS.md 第 2 条"一个动作一个分支一个 PR"的规则有偏差**，是否拆分由开决定。
- 设计问题（节奏和 catalog 对不上、膝脚方向）要不要另开修订处理。
