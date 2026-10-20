# Pose-Hub 版本对齐台账

更新日期：2026-10-20。当前 AI 目录 **0.2.0 已合入 main**，媒体 **0.2.0 已发布**，人物模型为 **training-human-v2 2.0.1**。目录与媒体同号独立；消费端同步和执行验收仍单独跟踪。规则与事实源映射见[版本管理](version-management.md)。

## 当前版本与计数

| 对象 | 版本或数量 | 状态 | 依据 |
| --- | --- | --- | --- |
| AI 动作目录 | 0.2.0 / formatVersion 1，142 个稳定动作 id | PR #11 已合入；未打独立目录发布 tag | [catalog.json](../catalog/catalog.json)、[PR #11](https://github.com/mhgd3250905/3D-Pose-Hub/pull/11) |
| 各 App 目录覆盖 | FlareLab 51、HipLab 46、SmartFit 93 | 有重叠，不能相加作为动作总数；不代表本次已升级 App | `catalog.drills[].apps` |
| 目录配套完整度 | 46 个 complete；96 个未进入 Pose-Hub 媒体发布、49 个缺中文语音、96 个缺英文语音 | 按当前生成物记录，缺项未在本次补齐 | [MISSING.md](../catalog/MISSING.md) |
| spec 开发总表 | 200 个规格文件，含 27 个修订文件 | 包含原版、修订及未被 App 使用的规格 | [drill-catalog.md](drill-catalog.md) |
| 人物模型 | training-human-v2 2.0.1 | 当前默认；13 个源文件固定，本阶段无变化 | [模型清单](../drill-anim/models/training-human-v2.json) |
| App 媒体 | media 0.2.0，46 个 HipLab 动作、92 个公开文件 | published，soft-v1；0.1.0 保留 | [媒体清单](../media/manifest.json)、[0.2.0 发布记录](../media/releases/0.2.0.md) |

`complete` 不要求英文语音，也不代表全部 142 个动作均已打包发布、消费端已兼容或已通过医学禁忌审核。制作归档的绿幕和透明帧数量另按[素材库同步记录](material-cloud-sync.md)统计，不混入上表。

## AI 目录变更记录

| 目录版本 | 内容提交 | 结论与去向 |
| --- | --- | --- |
| 0.1.0 | `809f36a1c28e33af7b1b42e9378bceda86a6d032` | PR #11 初稿；审核发现剂量、注意部位、素材路径和器械四类问题，已由 0.2.0 替代，不作为新接入基线 |
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

ZIP 的完整 SHA-256、下载链接及选版见媒体清单和对应冻结发布记录。PR #11 与本次文档收束没有修改媒体清单、ZIP、规格、人物源、制作库存或云盘同步记录；本次也未重新下载或发布这些媒体。

## 阶段验证与来源绑定

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
