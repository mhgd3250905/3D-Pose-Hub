# Pose-Hub 版本对齐台账

更新日期：2026-10-21。当前 AI 目录 **0.3.0 已合入 main**，App 媒体仍为 **0.2.0 已发布**；新制作人体采用 **training-human-v2plus 1.0.0-rc2**，原配色、动作肌群高亮、不显示肌群分区线。六动作试制及确认已合入并推送，main 基线为 `3fcb420fd083fd84847d65d9b0ec01d9be997581`。全库重制已获授权并在分支推进；App 接入仍待后续验收。规则与事实源映射见[版本管理](version-management.md)。

## 当前版本与计数

全库分支首批新增 8 动作、五皮肤 80 个视频及分层母版已完成技术核验，源/母版/派生当前合计 14/142；已写动作包 28，正式目录另 114 个尚未写 v2。六层发布资格 0/142，编辑、试听、最终审查与新批次合入未获替代批准。见[首批结果](action-library-v2-b001-20261021.md)。

开哥随后于 2026-10-21 授权全库计划和制作，当前执行分支为 `codex/action-library-v2-production`。基线正式目录 142 个 ID，复用六动作 r2，136 个新增动作已排 20 批；目录外 24 个动态候选、6 个静图家族和 1 个停止项另列。计划与真实推进状态见[全库计划](action-library-v2-production-plan-20261021.md)及[生产队列](../catalog/v2/production-plan.json)。下面六动作“全库另等确认”的历史条件已由这次指令满足，不代表新批次已制作、合入或发布。

2026-10-21，开哥接受 `codex/action-package-v2-pilot` 的 r2 样片并同意合入、推送，本地 main 先快进至 `5b2becb572f06a310be0cb5bdea61f47834dc5c7`，再以 `3fcb420` 登记确认和检出字节保护。内容为动作包 `action-package@2`、六层门禁、六个代表动作与五套皮肤制作管线；样片确认及合入范围见[试制确认](pilot-approval-20261021.md)。下表旧 AI/App 发布版本未因本次合入升级，不能拿旧 `complete` 代替 v2 门禁。试制时的全库待确认条件已由上文后续授权满足。

已完成试制修订为 **r2**，目录 `F:/PoseHub-v2-pilot/neck-fix-r2/`。颈部漏色已修正，六动作五皮肤完整母版、60 份视频及图片已重做，catalog draft.2 与 AI 详情已重新绑定真实 SHA/QA。完整性、像素、姿态、连续序列与冻结源检查均通过；r1 保留历史。固定人体仍为 `training-human-v2plus / 1.0.0-rc2`，修正位于渲染适配器。试制内容已合入 main；发布前编辑、语音内容/试听等审核仍待完成，未发布新素材版本。全库新增批次使用独立的 F 盘 production 目录。证据见[颈部修复记录](neck-material-fix-20261021.md)与试制记录。

| 对象 | 版本或数量 | 状态 | 依据 |
| --- | --- | --- | --- |
| AI 动作目录 | 0.3.0 / formatVersion 1，142 个稳定动作 id | PR #11、#13 已合入；本阶段未新建目录 tag | [catalog.json](../catalog/catalog.json)、[PR #13](https://github.com/mhgd3250905/3D-Pose-Hub/pull/13) |
| 各 App 目录覆盖 | FlareLab 51、HipLab 46、SmartFit 93 | 有重叠，不能相加作为动作总数；不代表本次已升级 App | `catalog.drills[].apps` |
| 目录配套完整度 | 46 个 complete；96 个未进入 Pose-Hub 媒体发布、49 个缺中文语音、96 个缺英文语音 | 按当前生成物记录，缺项未在本次补齐 | [MISSING.md](../catalog/MISSING.md) |
| spec 开发总表 | 206 个规格文件，含本轮 6 个新修订 spec | 包含原版、修订及未被 App 使用的规格 | [drill-catalog.md](drill-catalog.md) |
| 新制作人体 | training-human-v2plus 1.0.0-rc2 | 已合入 main；完整配方见下文，未全量重渲 | [生产配置](../drill-anim/models/current-production.json)、[新版清单](../drill-anim/models/training-human-v2plus.json) |
| 历史基础人体 | training-human-v2 2.0.1 | 旧规格/批次继续复现；13 个固定源未改，仅默认选择标记调整 | [旧版清单](../drill-anim/models/training-human-v2.json) |
| App 媒体 | media 0.2.0，46 个 HipLab 动作、92 个公开文件 | published，soft-v1；0.1.0 保留 | [媒体清单](../media/manifest.json)、[0.2.0 发布记录](../media/releases/0.2.0.md) |

`complete` 不要求英文语音，也不代表全部 142 个动作均已打包发布、消费端已兼容或已通过医学禁忌审核。制作归档的绿幕和透明帧数量另按[素材库同步记录](material-cloud-sync.md)统计，不混入上表。

## AI 目录变更记录

| 目录版本 | 内容提交 | 结论与去向 |
| --- | --- | --- |
| 0.1.0 | `809f36a1c28e33af7b1b42e9378bceda86a6d032` | PR #11 初稿；审核发现剂量、注意部位、素材路径和器械四类问题，已由 0.2.0 替代，不作为新接入基线 |
| 0.3.0 | `d96d3c3aae9228d434113b9ee0d12c4ded609aa9` | PR #13 经用户同意于 2026-10-20 20:58:54（上海时间，GitHub mergedAt）合入，main 合入提交 `8b872223b3fc95de61e7e3e23387ac549e19db71`；新增 78 条 `rhythm`（来源 HipLab 46、SmartFit 32），本阶段未据此升级 App 或发布媒体 |
| 0.2.0 | `884074701d8ec93e6d25d410786336532cc664de` | 四项修复复审通过，经开哥同意后于 2026-10-20 14:42:49（上海时间）合入 main；未据此升级 App / SDK 或发布新媒体 |

PR #11 的目标基线为 `b6c6bd91c9083a9fbe4e6779f8e55cbb4d2092bc`，合入提交为 `4bb02f96768c5e704b2db65c806fbbaf6eda36fb`；合入树与上述内容提交完全一致。

`catalog.source.commit=809f36a` 表示生成时的基线，并非 0.2.0 的内容提交。目录记录的固定输入为 SmartFit `6d4eb30`、HipLab `cdbb14c`、FlareLab `2be8cca`。本台账按这些输入和合入成果记录状态，不把外部仓库可能的新提交推断为已同步。

### 四项审核问题的关闭证据

| 原问题 | 0.2.0 处理结果 | 验证结果 |
| --- | --- | --- |
| 8 处计次/计时冲突 | 整组采用 HipLab 动作包 defaults；重建范围，新增可选 `holdSeconds`；未裁定语义冲突自动标 doubt | 8 条剂量与固定输入一致，临时删除裁定后正确标待审 |
| HipLab 注意部位遗漏 | 与 SmartFit 取归一化并集，只增不减；未知词待审 | 8 条遗漏恢复，46 条 HipLab 注意部位无遗漏，旧目录标记无删除 |
| FlareLab 102 个路径缺 `app/` | 全部改为仓库根相对路径，增加外部路径和已有 SHA 检查 | 472 个路径存在；102 个带 SHA-256 的文件哈希一致，其余 370 个来源无 SHA，未作哈希通过声明 |
| `h-band-hip-ir` 缺椅子 | `equipment=[band, chair]`；补 spec 道具检查 | 旧目录遗漏可检出；`rotator-cuff-B` 的 foamRoller 仅代表卷毛巾，单项豁免合理 |

初审评论见 [2026-10-20 主线意见](https://github.com/mhgd3250905/3D-Pose-Hub/pull/11#issuecomment-6284159378)，作者逐项修复说明见 [修复回复](https://github.com/mhgd3250905/3D-Pose-Hub/pull/11#issuecomment-6284555027)。本地主线另执行复审；评论本身不替代验证证据。

## 消费端接入台账

以下事项按目录 0.2.0 的固定输入登记为待办；需要对应仓库的后续提交与验收才能关闭，本次仅对齐 Pose-Hub 文档。

| 项目 | 状态 | 对齐要求与关闭条件 |
| --- | --- | --- |
| SmartFit 8 项剂量 | 待同步及验收 | 按下表同步 pack 的 `defaultDose`，核对范围、休息、每次停留；补 App 提交和实际执行证据 |
| SmartFit 7 项单侧动作 | 待同步及验收 | 同步 `unilateral=true`、`side_switch` 及 `perSide` 校验，核对两侧播放和时长 |
| ugk_coach `holdSeconds` | 待支持及验收 | 读取、展示、执行每次停留并计入时长；未支持前不得把带停留的处方当普通计次直接启用 |
| catalog 0.3.0 `rhythm` | 待消费端接入及验收 | 按实际 kind、阶段时长、提示和来源解释执行，核对 SDK 对 `source:'repSeconds'` 的支持；合入目录不表示 SDK、语音、左右切换或播放已兼容，本阶段未访问或修改消费端 |
| 提示词与结构化处方停留时长 | 待核对 | `n-seated-knee-lift` cue 写停 3 秒，处方为 `holdSeconds=5`；`n-seated-squeeze` cue 写停 3 秒，处方无停留字段。接入前裁定并同步提示/语音与执行语义；本次只登记，不修改目录 |
| 96 项未进入媒体发布、49 项缺中文语音 | 待后续素材工作 | 生成物继续保留缺项；需另行制作、审核和发布，不以目录合入标完成 |
| 医学禁忌与复合剂量 | 待专业审核及消费端验收 | `contraindications` 当前均空；四方向、Y/T/W、距离转时间等已披露简化仍需确认执行语义 |

8 项剂量当前统一为下表，休息均为 15 秒；这是目录/动作包对齐结果，不是新完成的临床剂量审核。

| 动作 id | 组数 | 每组剂量 | 每次停留 |
| --- | ---: | --- | --- |
| h-adductor-rock | 1 | 每侧 5 次 | — |
| h-knee-hug | 1 | 6 次 | — |
| h-sumo-pry | 1 | 3 次 | 10 秒 |
| n-pelvis-circle | 1 | 4 次 | — |
| n-seated-ir-drop | 1 | 每侧 30 秒 | — |
| n-seated-knee-lift | 1 | 每侧 3 次 | 5 秒 |
| n-seated-squeeze | 1 | 8 次 | — |
| n-squat-shift | 1 | 8 次，左右交替各算 1 次 | — |

7 项侧别为：`glute-max-A`、`h-band-pallof`、`h-supine-twist`、`n-seated-ir-drop`、`n-seated-knee-lift`、`s-9090`、`t-seated-straddle-lift-1leg`。目录更正为 true 有 HipLab / FlareLab 来源依据，不能为兼容旧包改回 false。

非阻塞校验局限：spec 道具检查目前使用文本正则，单行 `props` 数组可能不被解析；复审独立扫描当前支持类型未发现实际器械缺项。后续补单行反向样本或改进解析，不把现有校验称为完整 JS 解析。

## 已发布媒体对照

| 独立媒体版本 | 发布时间 UTC | ZIP 文件数与字节数 | 冻结发布记录 |
| --- | --- | --- | --- |
| 0.1.0 / glow-b | 2026-10-17T16:17:10Z | 92 文件，40,153,961 字节 | [0.1.0](../media/releases/0.1.0.md) |
| 0.2.0 / soft-v1 | 2026-10-18T03:24:06Z | 92 文件，39,151,634 字节 | [0.2.0](../media/releases/0.2.0.md) |

ZIP 的完整 SHA-256、下载链接及选版见媒体清单和对应冻结发布记录。PR #11 当时的文档收束未修改这些发布物；2026-10-21 的人体合入新增独立模型扩展和制作入口，仍未修改媒体清单、已发布 ZIP、旧规格、制作库存或云盘同步记录，也未重新下载或发布这些媒体。

## 2026-10-20 PR #11 阶段验证与来源绑定（历史）

阶段 baseline 为 `b6c6bd91c9083a9fbe4e6779f8e55cbb4d2092bc`（本会话 PR #11 审核起点），阶段交付为 `4bb02f96768c5e704b2db65c806fbbaf6eda36fb`；二者间为 3 个提交、11 个新增 catalog 文件（8 个数据/文档、3 个 Python 工具）。本次收束仅增加版本记录与入口说明。

| 时间与来源 | 命令或验证 | 结果与 source state |
| --- | --- | --- |
| 2026-10-20 主线复审 | `python catalog/tools/validate_catalog.py --check-files --app-root smartfit=<固定副本> --app-root hiplab=<固定副本> --app-root flarelab=<固定副本>` | 内容提交 `884074701d8ec93e6d25d410786336532cc664de`：142 条 0 问题，472 路径、102 已提供 SHA 的文件通过；未验证语音路径 |
| 同次复审 | 固定输入重建、生成报告字节对照、holdSeconds 边界、未裁定冲突与未知注意词反向样本 | 目录及三份生成报告一致；非法停留值和计时带停留被拒绝，未裁定项标 doubt；旧目录检出 119 项原问题 |
| 2026-10-20 合入核对 | `git diff --exit-code 884074701d8ec93e6d25d410786336532cc664de 4bb02f96768c5e704b2db65c806fbbaf6eda36fb` | 无差异，复审证据可绑定到合入树 |
| 2026-10-20 15:44 上海，收束预检 | `python catalog/tools/validate_catalog.py --check-files` | 干净 HEAD `4bb02f96768c5e704b2db65c806fbbaf6eda36fb`：142 条、0 问题；本次未访问外部 App 仓库 |
| 2026-10-20 15:45 上海，收束预检 | `node drill-anim/verify.mjs`、`git diff --check` | 同一 HEAD：200 个 spec、13 个人物源通过，原哈希保持；diff 检查通过 |
| 2026-10-20 文档对齐 | 六份文档本地链接、版本/数量/剂量记录对照，`git diff --check` | 68 个本地链接可解析、记录与事实源一致；source state 为上述合入提交加本次六份文档差异，代码与数据未变，最终文档提交身份由 Git 记录 |

文档提交后，上述代码证据仅在相对交付提交的差异仍为本次说明文档时复用。文档自身须核对本地链接、版本/计数/来源提交与完整 Git 状态。消费端 App、SDK、语音播放与医学审核不包含在这些通过结论内。

## 2026-10-21 人体建模合入与阶段收束

### 授权、来源与 Git 身份

用户明确要求先合并本次人体分支，再整理台账并等待下一步。本阶段 scope 为 PR #12 审核与修复、采用新版制作配方、主线合入/推送、当前入口与版本台账对齐。不包含全库重渲、App/SDK 接入、媒体发布、云盘整理、tag 或工作副本清理。

| 身份 | 完整 SHA / 状态 |
| --- | --- |
| baseline：本阶段已记录的起始 main、PR #13 合入点 | `8b872223b3fc95de61e7e3e23387ac549e19db71`；已用 `git rev-parse --verify <SHA>^{commit}` 核对，且是候选 HEAD 祖先 |
| PR #12 作者分支 `feat/human-v2plus` | `17eab405fee318224ad0617ecd5da7854b66d8e2` |
| 本地整合 merge；GitHub 回读的 PR mergeCommit | `c2c9a01274384ec0e34b8eee9d5d8de257390c35`，父提交为 baseline 与上述 PR head |
| 颈部补丁及新版默认配置的内容提交 | `315367ec2f072f0dc13d6a8e2a530cd453b9f17d`，分支 `codex/adopt-human-v2plus` |
| main 合入与远端确认 | main 从 baseline 快进到上述内容提交，`git push origin main` 成功，`git ls-remote origin refs/heads/main` 回读同一 SHA |
| PR #12 状态 | [GitHub PR #12](https://github.com/mhgd3250905/3D-Pose-Hub/pull/12) 回读 `MERGED`，`mergedAt=2026-10-21T06:34:04Z`（上海时间 14:34:04） |
| 文档收束身份 | 在上述代码内容上仅作本节与当前说明文档对齐；最终完整提交由本文件 Git 历史和 Cockpit 回执记录，避免在文件中写入自身提交哈希 |

Preflight 候选 HEAD 为上述 `315367e`。同一 baseline 到该 HEAD 的有限 stage delta 为 67 个提交、166 个路径：153 新增、13 修改；按根目录为 assets 1、docs 69、drill-anim 23、tools 73。来源为获授权的 PR #12 最终内容与本会话集成提交。`drill-anim/specs/` 和 `runtime/` 无路径变更；旧 v2 的 13 个固定源继续通过原哈希。审核图片、原型工具和已否决的头部尝试作为历史来源保留，不等于当前制作默认。

### 制作决定与后续执行边界

| 项目 | 当前采用方式 |
| --- | --- |
| 新任务人体 | `training-human-v2plus` / `1.0.0-rc2`、`alignClavicles:false` |
| 几何与服装 | `outfit:'compression'`、`torso/limbs/hands:'base'`；保留原 v2 灰色人台头，不启用 `head:'base'` |
| 默认外观 | `skin:'realistic'`：原配色＋动作肌群高亮，不显示肌群分区线；不启用 `regions:'baked'`。`highlight` 的 groups、side、pulse 语义保留，形状使用新版 mask |
| 可选外观 | 白金 `tech-white`、蓝 `neon-night`、绿 `neon-night-b`、全息 `hologram`；不自动为所有动作制作全部皮肤 |
| 原动作与历史 | 200 个原 spec、旧模型源和冻结批次保留；普通旧 spec 不带覆盖时按原 profile，新 HD 任务另建目录固定新版配方，旧批次续作不自动迁移 |
| 已导出视频 | 人体已烘焙成像素，只有决定升级的动作需要新版渲染；若要求全库统一，则对应动作视频、封面和静图均须更新，不能仅换模型文件 |
| 母帧复用 | 人体/材质/高亮/姿态/机位变化重渲；同一外观的背景替换、缩小尺寸和编码派生复用透明母帧，按实际清单补缺 |
| 发布边界 | 已 published 的 0.1.0/0.2.0 ZIP 与清单固定；今后新增成片另发媒体版本。模型代码合入不代表已发布新版视频或 App 已升级 |

生产配方的 `adoption` 和模型清单的 `status` 是 rc2 编制时的描述性审批注记，不是运行时开关或动态审批状态；其固定版本原文和 SHA 保留。当前批准、Git 合入与后续制作状态以本台账为准。操作参数、几何、材质及渲染代码未因本次文档收束改变。

### 预览与归档位置

以下来自本会话前序制作及归档回执；本次 closeout 未重新读取或生成媒体产物，不能当作本轮重渲或上传的证明。

| 素材 | 位置与状态 |
| --- | --- |
| 深蹲旧/新人体、多皮肤对比 | 主工作区 `output/model-compare-h-squat-20261021/independent-scenes/viewer.html`，8 秒对比视频与透明母帧；PR 原 head 的独立场景试片，规避旧加载顺序缺陷，不冒称为源码补丁证据 |
| 已保存的对比归档 | `E:/AII-3D/pose-hub-media/model-previews/h-squat-v2plus-multiskin-20261021/`，1287 个文件；ZIP 为同目录下 `h-squat-v2plus-multiskin-20261021-4e2c9eea25a9f571.zip`，149,213,783 字节 |
| 上述 ZIP 校验 | SHA-256 `55f851f896ce5fce25a8a48b5ad18577503f277d1b7f39e9b27c208e6faf583d`；前序归档已核对 ZIP CRC、全部条目 SHA 与原件；本轮未重复校验，未上传云盘 |
| 原配色肌群高亮预览 | 主工作区 `output/h-squat-original-look-highlight-20261021/viewer.html` 与 `highlight.mp4`，正背面同步、8 秒 / 30fps；是采用前的外观参考，仍在本地输出目录 |
| 补丁的真实浏览器检查 | 主工作区 `output/adopt-human-v2plus-20261021/`；两种启动顺序、各 11 次切换及颈部近景检查的前序回执，无页面/shader/context lost 错误 |
| 正式入口试片 | 集成工作副本 `output/adoption-cli-preview-20261021/` 的 h-squat 0、63 帧；`output/adoption-hd-final-20261021/` 的冻结配方与包装规格。工作副本及输出保留，不自动清理 |

### Closeout Preflight、来源和证据绑定

完整状态命令为 `git status --porcelain=v1 --untracked-files=all`。主目录 `E:/AII-3D/3D-Pose-Hub` 与本阶段集成工作副本在 Preflight 均为 tracked/staged/unstaged/deleted/renamed/untracked **0 项**；没有需要猜测归属的用户改动。合入后 main 与远端内容一致。收束差异仅由本会话 Agent 修改 10 份现有 Markdown 说明文档，无新增/删除或未跟踪源文件；按明确路径暂存，完整状态和链接检查在提交前后另行核对。

canonical discovery 从根 `AGENTS.md`、`README.md` 与最近适用的 `drill-anim/AGENTS.md` 出发，只读取与本阶段主题直接关联的一跳来源；没有扫描其他项目、配置秘密或媒体产物。

| 实际核对路径 | 类别与 current/archive 判定 | 结果 |
| --- | --- | --- |
| `AGENTS.md`、`README.md`、`drill-anim/AGENTS.md` | current：项目入口、维护权限与制作规则 | 补齐新版独立身份、实际合入、原配色高亮且无分区线；保留旧源与真实 App 副本的同步要求 |
| `docs/START-HERE.md`、`drill-anim/README.md`、`drill-anim/tools/hd/README.md` | current：使用入口与制作命令 | 本地待批准文案改为实际合入状态；旧规格、批次与全量验收边界明确 |
| `docs/version-management.md`、`docs/version-ledger.md` | current：规则与当前版本/待办汇总 | 新版人体合入记录与目录 0.3.0 对齐，旧媒体和消费端待办保留；身份区分内容、整合 merge 和远端确认 |
| `drill-anim/models/current-production.json`、`drill-anim/models/training-human-v2plus.json`、`docs/training-human-v2plus.md` | current：操作参数、固定模型身份、制作标准 | 参数及所有固定源保持 rc2；只在标准与台账解释冻结审批注记的历史含义 |
| `catalog/catalog.json`、`media/README.md`、`media/manifest.json` | current：目录版本、素材复用/发布规则和发布事实 | 目录 0.3.0 / 142；媒体 0.1.0/0.2.0 均 published、各 46 动作/92 公开文件，本轮未修改 |
| `drill-anim/models/training-human-v2.json`、`docs/training-human-v2.md` 正文 | archive/history：旧人体身份和验收；固定源仍作为现行复现契约 | 旧 13 源未改；文档仅顶部当前入口说明更新，历史正文不重写 |
| `docs/training-human-v2plus-proto.md`、`docs/drill-anim/v2plus-adoption-20261021.md`、`assets/blender-studio-source/SOURCE.md` | archive/history：原型过程、本地候选验收、资产取得/使用来源 | 保留编制时状态和证据强度，不作为 main 当前审批状态；未据此宣称所有动作验收或新的上游下载验证 |

| 时间与来源 | 命令或核对 | 结果及 source state |
| --- | --- | --- |
| 2026-10-21 本轮合入前，本机执行 | `node drill-anim/verify.mjs` | 干净候选 HEAD `315367ec2f072f0dc13d6a8e2a530cd453b9f17d`：200 spec、旧 13 冻结源、新模型固定源契约通过 |
| 同一 HEAD、本轮执行 | `python drill-anim/test_portability.py`；`node --test drill-anim/tests/model-profile.test.mjs` | 7 项＋4 项通过 |
| 同一 HEAD、本轮执行 | `node tools/human-v2plus/test-material-hooks.cjs` | fresh-v2plus 与 old-v2-first 的 collar 往返、缓存和 region hook 回归通过 |
| 同一 HEAD、本轮执行 | `python -m unittest discover -s drill-anim/tools/hd -p 'test_*.py' -q` | 88 项通过，32.241 秒；覆盖新默认、旧配方 resume、来源冻结和制作保护 |
| 2026-10-21 main 快进后，本轮执行 | `git diff --exit-code 315367ec2f072f0dc13d6a8e2a530cd453b9f17d HEAD`；`python catalog/tools/validate_catalog.py --check-files` | main 与候选树一致；142 条、0 问题。本轮未访问外部 App 仓库 |
| 同轮外部回读 | `gh pr view 12 --json state,headRefOid,mergeCommit,mergedAt`；`git ls-remote origin refs/heads/main` | PR `MERGED`、head/mergeCommit/mergedAt 与上表一致，远端 main 回读 `315367e` |
| 前序本地验收，本轮未重跑 GPU | 本会话真实浏览器切换、h-squat 正式入口两帧、HD prepare 重入 | 记录来源见[本地验收记录](drill-anim/v2plus-adoption-20261021.md)；作用于本内容提交的提交前同一运行源，不扩大为全库、App 或本轮 GPU 验收 |
| 本轮文档对齐 | 当前入口/台账的版本、Git 身份、默认配方、本地链接与 `git diff --check` | 以 `315367e` 加本次 10 份 Markdown 为 source state；代码、配置、模型数据和主题相对该 SHA 无变化，所以上述代码测试仍适用；最终收束 SHA 由提交及回执记录 |

已修正的确定 findings：当前入口误写“未合入”、台账旧模型默认、PR #13/目录版本滞后，以及模型固定注记与实际审批状态的归属说明。当前台账与实际来源对齐。旧媒体不因模型合入自动升级，不将待办登记为已完成。

### 模型合入时的待办记录

以下保留早期模型合入检查点的范围；其中“迁移是否启动”现已由顶部的全库制作授权和生产队列接替，不能作为当前停止指令。

- 是否及按什么优先级，将已发布或在用动作分批迁移到新版人体；尚未派发全片渲染。
- 每个迁移动作的预览、道具/支点/手型、高亮、完整循环 QA 与验收；目前没有“全 200 动作已通过”的结论。
- 新版成片的媒体版本、App 接入与消费端执行验收；现行发布 ZIP、旧锁定版本保持原样。
- 本地预览是否需要后续云盘归档，由用户另行提出整理请求；本轮没有建立定时器或自动同步。

代码及文档保存后等待用户下一步；Cockpit 只登记一个非终态检查点，不自动结束 session、relay 或 handoff。
