# 剩余219动作：可复用模板检阅、修复与制作交接

本手册承接第一批32动作及人体关节优化，目标是让下一位agent逐个完成剩余动作的源核对、镜头设计、姿态与接触修复、低清检查和配方保存。先把模板做对，正式高清渲染放在最后。不要把旧媒体存在、脚本运行成功或来源哈希一致解释为新版模板已验收。

## 1. 从这里开始

本轮源码已于2026-10-29合入并push main，merge提交为 `114e90dacadf18b5f1c1976791b6116fe0150647`；本手册及队列是其后的main文档提交。实际main工作区是 `E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023`。主目录 `E:/AII-3D/3D-Pose-Hub` 仍在旧生产分支并有独立WIP，不要在那里强行切分支、清理、重置或覆盖。

先读当前仓库 `AGENTS.md`，核对远端、HEAD、工作树和可用额度，再从最新main建立自己的 `codex/remaining219-templates-<日期>` 分支。独立worktree优先；保留现有main和原制作worktree。下方命令是接手步骤，本交接未执行建分支：

```powershell
git -C E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023 fetch origin
git -C E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023 status --short
git -C E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023 log -1 --oneline origin/main
# 选一个尚不存在的目录和分支；若已有本任务worktree，先核对后复用。
git -C E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023 worktree add -b codex/remaining219-templates-20261029 E:/AII-3D/3D-Pose-Hub-worktrees/remaining219-templates-20261029 origin/main
```

直接执行用户安排的检阅、修复和模板工作，不要只回计划。常规可逆缺口自行处理；确实改变动作含义或标准的歧义才询问，并继续其他动作。未来合并、发布、外部提交按当时用户授权和AGENTS执行；本次对已完成32项的merge/push授权不等于219新成果已经获用户视觉验收或媒体发布批准。不要创建定时任务或自行安排另一会话。

## 2. 精确范围与旧源恢复

权威队列：[remaining219-source-queue-20261029-r1.json](../catalog/production/remaining219-source-queue-20261029-r1.json)。共有 **219稳定ID**，来自动态范围251减去已完成首轮候选的32（24旧候选+8新增），交集为0。静态自测6、用户停止1、仅有名称的规划和历史修订行不加入任务；稳定ID原样保留，不能删去 `-rN` 猜ID。

源选择以 [inventory](../catalog/inventory/actions-20261028-r1.json) 的 `deliveredSource` 与固定catalog `d550cd211d878053839be1f8ac9f971f9a1655ca:catalog/test/app-test-pack-r1.json` 交叉核对。队列逐项列出历史所选spec、实际可读commit、Git blob、LF SHA、器材、肌群及相对模块依赖。历史模型身份只是来源信息；新生产必须另选当前模型。

合并后核验：174个选定入口现有且LF内容一致，45个缺失；递归相对模块闭包共308个唯一路径，实际缺50文件，未发现同路径版本冲突。除45入口外还缺 `h-side-leg-raise-r2/r3/r4.js`、`h-step-jack-r2.js`、`hamstrings-A-r2.js` 五个依赖，均位于 `drill-anim/specs/`。7个完全缺失的native家族及全部缺项见队列，不能以同名近似动作代替。

恢复时使用每项 `selectedSource.ref` 或文件的 `verifiedSourceTreeCommits`，不要盲用历史 `recordedSourceCommit`：其中7项旧记录的 `89c9c4…` 树不可用，但已在 `d550cd…` 验证相同blob和LF哈希。其余186项取 `960b486…`，26项取 `1fdd117…`。不要按“最高rN”选源，也不要用当前分支同族动作悄悄替代旧选定修订。

安全恢复规则：从固定commit用 `git show <commit>:<path>` 读取字节，核对Git blob/LF SHA；不存在才以 `open(path, 'xb')` 独占创建；已存在同LF则跳过，不同则记录冲突并停该项。历史原源不改写，适配另存新的revision并登记规范化哈希。恢复入口时连同缺失依赖一起处理；新恢复/改spec后通过仓库校验。队列的依赖闭包只覆盖字面量相对模块引用，**不代替动态加载、模型、道具和图片资源验证**，这些由实际配方加载及捕获补齐。

可复跑选源核验工具：[build-remaining219-queue-r1.py](../tools/action-completion-v3-r2/build-remaining219-queue-r1.py)。仅生成清单，不执行源、不恢复文件；输出必须新路径，防止覆盖冻结队列：

```powershell
python tools/action-completion-v3-r2/build-remaining219-queue-r1.py --repo . --output F:/PoseHub-v2-production/planning/remaining219-source-check-<新时间>.json
```

## 3. 最新人体、手型和修正组件

参考入口是 [remaining32-r4](../catalog/production/remaining32-r4/README.md)，精确版本/证据见 [finalization-r2](../catalog/production/versions/remaining32-template-finalization-20261029-r2.json)。32项是已完成候选复核、等待用户验收；旧版本的局部认可不能迁移成当前全批通过。

新模板显式选 `training-human-v3-armfix / 0.1.0-r2`。全局 `drill-anim/models/current-production.json` 仍选v2plus rc2，不要为了本批迁移而静默切换全库默认。当前25项使用 `hands-native-c1r2-symmetric-r1` 的native路径，7项使用已固定的 `webxr-dumbbell-wrist-r1` 握持路径。手型按动作意图选择支撑、放松、辅助或握持；左右手可有不同任务。

| 部位 | 已验证做法 | 使用边界 |
| --- | --- | --- |
| 踝连接 | `ankle-join-r5`，检查脚踝—裤口—鞋口的连续性与极限弯曲 | 几何连接修正不负责脚底接地；熊式、臀桥过头、登山式可作姿态回归样本 |
| 大臂/袖口 | `upper-arm-contour-r3`，从整个大臂截面检查中段偏窄、后内侧凹陷、袖口过渡，实际校验56对连接环 | r3完整替代r1/r2，不能叠加；熊式正常展示的轻微皮肤波纹有局部接受记录，不扩大到其他缺陷 |
| 肘部 | 明显直臂收细先核对是否漏接 `elbow-dqs-r1` | 本次4项只补组件，骨点/支撑0毫米变化；轮廓正常就过，不按角度高低一律启用；姿态穿体、肘pole错误仍需修动作 |
| native手腕/手指 | 真正作用于指骨的 `native-action-hand-pose-r1/r2` 与实际渲染采样 | `prepare`快照后安装、逐帧 `verifyApplied`；不能只改标签或拿恢复后的姿态验证 |
| 固定握持手腕 | `fixed-wrist-corrections-r1` 组合，保留已认可的腕/手/柄接口 | 不能把双手哑铃握姿直接套单手、壶铃、其他握柄；当前recipe明确拒绝不支持组合，要另做适配 |

固定握持的顺序尤其重要：R8按 `[upper-arm-contour-r3, ankle-join-r5]` 识别固定组合，肘组件需要作为可选第三项且 `fixedCorrectionStack.elbow:true`。实际安装是静态大臂、重建腕连接、动态踝/肘；恢复反向，必须通过拓扑映射、位置/法线/骨变换/缓存恢复检查。native通常静态大臂后接动态肘/踝。直接复制一个动作所有corrective到另一个动作容易使安装顺序错误。

**旋转的外观相同不等于路径正确。** 手腕/脚腕可能首尾方向一致，中间绕180°/360°把连接拧在一起；检查完整循环的实际渲染四元数和累计轴转，处理四元数符号连续性、角度展开和解算分支。`nativeHands.twistShare:1`可避开半角±π分支跳变，但可能暴露肘部LBS体积损失，仍需实际看图。不要仅调端点Euler、扩大关节或改镜头把扭结藏住。DQS逆LBS在接近180°时存在病态边界，不能把已有97°/145°案例外推到所有极限。

## 4. 镜头和内容范围标准

- 每个动作全周期固定相机：关闭旋转、跟随、漂移、推拉；`drift:0`、`orbitDegrees:0`、`frontSweepDegrees:0`、`fitTimeline:true`。记录方向、观察中心、尺度/距离、留白和fit目标。同类动作尽量统一，可为动作要领允许个别角度例外。
- 角度优先讲清关节弯曲、运动方向、左右侧、承重与道具关系。正面遮住肘/膝时用适当三分之四或侧面；诊断额外拍另一侧，不把诊断环绕带进交付镜头。镜头只优化表达，不能用于遮掩实际穿模。
- `groundShadow:false`，去掉独立地面投影，保留人体自身明暗。只保留必要道具；可去普通垫子，但不能移除真正承担接触的头枕/支撑物。使用可靠alpha或人体/道具mask计算范围，不把地影当人物。
- 整段使用“人体+必要道具”全周期包围框并集，再固定构图、缩放与内容矩形；不要逐帧裁切或居中导致伸手抬腿时漂移、忽大忽小。手指、鞋、杆端均不能出框，保留合理安全余量。
- 现有低清 `review/review.json` 是12fps预览采样并集；最终高清生产必须用**最终完整帧序列**重算并写入交付清单，供App直接使用，不能冒称预览矩形已是最终边界。
- 肌群高亮颜色、强度、透明观感和发光留在 `appearance` 参数。橙红和半透明微光为用户试用方向，尚未固定最终材质；现有surface blend/emission保留人体不透明深度，不把整个人体变透明。高亮保留正确发力肌群，不为“好看”改动作肌群。

## 5. 逐动作最快工作循环

1. **先理解原动作**：读取队列的固定选定spec、道具、支撑、节奏、原QA及完整循环。旧名与实际动作不一致时记录；不要仅看第一帧或目录缩略图。先选少量代表性站姿、坐姿、仰/侧卧、四点支撑、悬垂/器械握持把新批流水线跑通。
2. **建立独立配方**：保留稳定ID，选择当前模型/手型、镜头、关节组件、外观参数和源哈希；原有姿态没明显问题就复用。对新模型重算实际肢长可达性，固定承重点和动作语义；不能将旧模型所有坐标等比缩放，或求解后整体挪骨架掩盖问题。
3. **CPU先筛**：加载与来源哈希、原伸直门槛、关节范围、接触和循环连续性；找到峰值帧后再低清 `--frames`/关键帧查看。问题先分为缺组件、姿态/IK、手型、蒙皮/接缝、镜头、明暗法线，选最小已验证修复；不要为每个外观问题另造新模型。
4. **低清完整循环**：关键姿态稳定后，480px/12fps回放，并保留30Hz实际姿态采样与独立终点。看完整主视循环及峰值正/侧/背必要视图；缩略图遮挡时打开原图。可把多个动作做联系表快速扫查，正常者过，疑似者单独放大核验。
5. **保存证据和候选**：每项保存实际recipe/capture/source/图片哈希、看过的帧与视角、缺陷结论及剩余限制。完成3–6项即可交用户审核，不等219全部结束。用户提出意见后新attempt修复，明确通过后再记录该版本的用户确认。

每项状态建议为 `pending-source → source-ready → adapting → preview-ready → candidate-reviewed → user-accepted`；遇到问题用 `needs-fix` 或有具体原因的 `blocked`。这是工作流字段建议，需在新批schema里实现；不要悄悄赋给旧32冻结记录。`userAccepted`/`releaseEligible`初始false，不能由批处理自动改true。每次停止时列出已做、待修、未做的稳定ID及下一步，而不只写百分比。

## 6. 接触与动作修复经验

**看可见皮肤/道具表面，不能只量骨点。** 手掌和手指是否真的承重，脚底/脚尖是否贴地，膝、臀、前臂是否穿地，辅助掌是接触还是悬空，都要在表面与实际渲染上确认。CPU原网格中的隐藏顶点、shader discard或drawRange会影响距离判断；负值先查可见性，不能直接把整个人抬起来。接触误差如实记录，不用宽松阈值制造“零穿透”。

成功例子可从当前r4配方追到精确spec：

| 问题 | 可复用参考 | 关键经验 |
| --- | --- | --- |
| 直臂支撑肘部收细 | `t-seated-straddle-ext`、`t-seated-straddle-lifts`、`t-straddle-hold`、`t-vsit` | 先对照已有正常L撑/托马斯侧撑，四项只补已有DQS，不重复改骨架或模型 |
| 大臂中段/袖口不顺 | `h-bear-plank` | 测整个臂围变化，平滑体积与连接环；不要只在肱三头肌局部堆一个凸包 |
| 横臂拉伸穿胸 | `h-crossbody-r9.js` | 真实肩前送40mm、水平内收25→38°；`solveShoulders:true`让肩变化进入IK，保留右肘168°门槛。只做 `E.shiftShoulders`后移骨架会破坏目标关系 |
| 背后毛巾伸直不足 | `h-towel-behind-r7.js` | 肩解算和腕目标共同适配，原166°约束保留，不放低QA凑通过 |
| 辅助弯举手型/接触 | `h-biceps-self-r8.js` | 验证15指骨实际生效及掌面辅助接触；不是所有手都摊平或握拳 |
| 半跪拉脚 | `h-half-kneeling-quad-stretch-r6.js` | 膝皮肤接地与手—脚握持同时成立，区分隐藏原网格和真正可见表面 |
| 侧卧/仰卧 | `h-inner-thigh-r6.js`、`h-open-book-r8.js`、`h-supine-cactus-chest-r4.js` | 放松手型，核对前臂/拇指等实际支撑；必要头垫不能因“去地面”被删除 |
| 移动脚方向 | `h-mountain-climber-r8.js` | 保留承重侧，按运动语义修空中脚；不是所有脚都强制鞋底水平 |
| 托马斯短臂可达性 | `_thomas-reachable-r1.mjs`及当前Thomas配方 | 用当前肢长反算肩、骨盆与支撑关系，保留动作身份及原伸直QA |
| 毛巾过头转肩 | `h-towel-pass-r11.js` | 正面必须双手正握两端；约0.625m握距与协调大臂轴转减少腕代偿。用户仅放宽该动作肩部细节，以正常肉眼通过为准，保留放大袖口材质层纹；不豁免腕扭结、错误握持、穿体或其他动作 |

手部自然放松时适度展平即可；支撑掌和放松手不是一套姿态。单手握物、杆/墙/门框/椅接触属于适配项，现有双手固定握柄不能自动替代。若当前接口不支持，记录限制、建立版本化适配层，并先做代表动作验证；不要在App/SDK播放器补救预渲染素材。

## 7. 工具复用及需改造的位置

| 工具 | 用法与限制 |
| --- | --- |
| `tools/action-completion-v3-r2/recipe.mjs` | 当前显式模型、手型、无影/固定镜头和源pin入口；用 `prepareRecipe` 先验证。部分手型/道具组合故意拒绝，不能静默fallback |
| `joint-corrections.mjs` | 冻结组件白名单、版本和安装入口；新增组件另建版本/清单 |
| `render-finalization-r8.mjs` / `batch-finalization-r8.py` | 当前低清、实际渲染采样、组合恢复顺序可复用。先审读动作专属hook与条件，避免把旧ID特殊逻辑套给全库 |
| `make-review-r2.py` | 全周期预览与关键图、预览固定内容并集；检查侧视图实际覆盖峰值。旧side-check有的只覆盖初始几帧 |
| `rotation-path.mjs` | 实际渲染旋转路径及360°同端点识别，不用缓存恢复后的骨姿态替代 |
| `native-hand-surface-cpu-r1.mjs`、`side-lying-support-cpu-r3.mjs`等 | 有匹配需求才复用局部CPU工具；先查输入、固定ID/路径，避免照搬旧拟合常数 |
| `audit-elbow-volume-integration-r1.py` | 组件接入前后骨点/镜头不变、逐帧生效证据；不自动证明视觉通过 |
| `finalization-status-r2.py`、`seal-template-candidates-r2.py`、`audit-source-straight-r1.mjs` | 绑定本批32、r4目录、F盘status或指定ID，**不能直接拿来宣称219完成**；在新版本工具中参数化输入队列/输出根，保留原脚本和回执 |

下一批建议使用独立目录 `catalog/production/remaining219-r1/` 及 `F:/PoseHub-v2-production/remaining219-templates-<日期>/`，分recipes、captures、review、qa、manifests等，按稳定ID和新attempt存放。先从当前32工具提取必要通用入口，少量代表动作跑通再扩展。冻结脚本、清单、旧spec和已有preview不覆盖；spec变更另存rN并登记 `home-pr-candidates.json`/`verify.mjs`，共享源按AGENTS登记。

单份新recipe试跑命令如下；这是调用现有R8，不是219自动验收器：

```powershell
python tools/action-completion-v3-r2/batch-finalization-r8.py --out F:/PoseHub-v2-production/remaining219-templates-<日期>/captures --runtime F:/PoseHub-v2-production/planning/render-runtime-gpu4080-r1.json --attempt attempt01 --lane 1 <新recipe路径>
```

运行时配置是本机文件，不进Git；先确认存在、依赖可用及机器状态。整机最多两路，每路串行jobs1；保留启动空闲内存3.5GiB、帧阶段2GiB门槛。进程/Chrome异常先查内存、磁盘、驱动，不能无脑重试。已有attempt会跳过，不代表新配方已验证；改动必须新attempt。可按组并行独立源码检查，但GPU总并发仍最多2。

## 8. 验证、预算和完成标准

新增/修订spec及公共代码后执行 `node drill-anim/verify.mjs`、`python -B drill-anim/test_portability.py`；目录变动按 `node drill-anim/tools/catalog.mjs` 更新后 `--check`。相关组件/适配单测随改动选择，配方接入只验证必要来源、实际安装和新预览，不重复无关全库渲染。main集成时已有441规格、7可移植性、37相关测试、32配方加载和473原始来源哈希通过，这些是起点，不替代新动作测试。

避免浪费：先从正常同类动作比较；正常轮廓直接过，不为假想问题继续细修；只重跑受影响动作，失败原因和有效修法记录一次。用户要求节约额度，**周剩余额度到10%或以下停止继续工作**，先保存可恢复状态；每批开始及明显长任务后查询实际额度，不能用token估算冒充账户剩余量。额度工具不可用就如实记录未知，不能声称仍高于门槛。

每个最终模板应有：稳定ID与精确源/依赖、显式模型及手型组件、固定镜头、无地影输出策略、可调高亮、动作/接触/关节QA、完整低清循环和实际看样回执、已知限制，以及版本化配方。另有全批索引准确区分未做、待修、候选、用户确认。用户确认必须绑定具体recipe/capture版本，换模型或改影响外观的参数后重新检查接触、关节和取景。

模板可复用的是动作意图、相机配方、接触约束及适配流程；换一个骨架兼容模型也不保证旧坐标直接正确。保留模型适配层，重算可达性/接触、重新低清检查后才能批量产出。所有模板调整并获所需确认后，再统一做正式渲染、压缩、最终全帧内容矩形、打包；App/SDK升级、媒体发布和云盘归档分别按用户安排执行。

## 9. 第一批证据与交付索引

- [main集成记录](production-snapshots/remaining32-main-integration-20261029-r1.md)：合并来源、验证及换行/配置补齐。
- [32项r2修订](production-snapshots/remaining32-template-finalization-20261029-r2.md)、[原r1详单](production-snapshots/remaining32-template-finalization-20261029-r1.md)：逐项修复和证据边界。
- [其余28项肘部快扫](../catalog/production/reviews/remaining32-elbow-sweep-20261029-r1.json)：72图片引用、0新增GPU、0新修正；不是219项已检查。
- 本机审阅页 `http://127.0.0.1:8845/?revision=elbow-r2`，输出 `F:/PoseHub-v2-production/template-finalization-20261029/`；服务可能需要重启，不能靠URL存在推断可用。
- 精确Git/远端/WIP回执：`F:/PoseHub-v2-production/version-snapshots/remaining32-main-integration-20261029-r1/`。媒体不进Git，历史批准、失败尝试和快照全部保留。
