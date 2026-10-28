# Pose-Hub 版本对齐台账

## 2026-10-28 动作素材库盘点与来源收纳

在 `main@56a479df170ec53d124ebc12fae7e77b7928a64a` 上另建 `codex/action-inventory-20261028`，按用户要求盘点原219包之外的旧源码和未集成新动作，保存[逐项清单](action-inventory-20261028-r1.md)与[机器索引](../catalog/inventory/actions-20261028-r1.json)。本节记录本地盘点成果，不表示待审动作已合入 main、选入新包或获内容批准。

| 范围 | 本次核对结果 |
| --- | --- |
| 原透明测试包 | 219个已交付ID，保持原测试／待审身份 |
| 219以外的main旧家族 | 24个动态候选、6个自测静图、1个用户停止项；不是31个可直接生产的新动作 |
| 未集成新动作 | PR23的8个全新spec，open/draft，只有关键帧预览，完整QA待做 |
| 总盘点口径 | 258个源码家族；排除静图和停止项后251个动态／保持候选ID，不代表机制去重或最终收录数量 |
| 主线与原包来源关系 | main301份spec归并243家族，与219交集212；7个原包家族尚未进main。174个原包精确源在main同SHA，45个选中spec路径不在main，其中38个仍有同家族其他版本 |
| 历史与提议 | 旧批次／修订包8条和仅规划未写spec的10项另列；PR19时序修订、237旧模型包装不增加新动作数 |

所有现有源码、媒体、停止状态和未提交改动保留。新人体兼容性、固定镜头、无地面投影、全周期内容矩形及App下载优化已登记为后续生产要求；本次没有执行渲染、逐项镜头验收、媒体／SDK发布或改全局生产默认。旧阶段“241动作”保留其历史语境，本次精确统计由上述清单说明。

## 2026-10-28 身体 v3 阶段版本保存

按开哥显式调用的 `cockpit-closeout`，在源码交付 `8d3e2e1e9211019d4615f49e8492f7370027e9b5` 上保存文档快照 `body-v3-r7-closeout-20261028-r1`。本次整理当前入口、设计与优化依据、验证绑定和剩余项，并形成本地文档提交；模型及生产／发布版本保持表中身份。后续日期段落保留其当时状态，当前摘要以本节为准。

| 当前对象 | 固定身份与范围 |
| --- | --- |
| 已接受身体 | `training-human-v3-completed / 1.0.0-r7`；验收 tag `body-v3-r7-accepted-20261028`，manifest LF SHA `676a19e7b4185848ce2570c66a996ba4f967305a03feafe45e4c69b36c7a7fb6` |
| 可选接触／颈扩展 | `training-human-v3-contact / 0.1.0-r5`；manifest LF SHA `60aed9cff5e0754cbead7afbd305aad903f835b52ea3044defeb3de641dc045c`，局部复测与源码采纳，不扩大为全动作用户验收 |
| 动作与目录 | spec开发总表301；catalog0.3.0／142稳定ID；PR19四项时序已合入、其余8项待审 |
| 生产与公开媒体 | 全局默认v2plus rc2；media0.2.0 published；全库r7迁移、整身GLB及媒体／SDK升级留待后续 |
| 保存与验证 | [版本快照](body-v3/snapshot-20261028-r1.md)记录baseline、HEAD、41路径delta、完整归属及13:19在固定源码上的验证；29个旧实验文件原样保留、不纳入本次提交 |

从[身体文档总览](body-v3/README.md)进入专用loader、分项证据和复现命令；[设计与优化思路](body-v3/design-and-optimization-20261028-r1.md)集中说明因果定位、方案取舍、验收指标的限制和生命周期。本次补记属于README与docs的整理，完整文档提交以包含本节的Git提交为准。

## 2026-10-28 PR #17–#22 选择性采纳

开哥澄清“身体无关的优化可以采纳，因新身体过时的适配不采纳”，并明确授权推进采纳合并。本授权补充下文身体 r7 独立合入检查点当时“不操作 PR #17–#22”的限制；历史检查点原文保留。

| 对象 | 本次结果 |
| --- | --- |
| PR #17／#20 | 已合并训练说明待审提案及历史漏收报告，合并提交分别 `45e6076`／`fc0bf04`；提案来源另存 r2 于 `e6e002e`，不批准处方或自动增补动作 |
| PR #18／#21 | 通用求解处理及有效掌面／颈通道能力移植到 r7，独立提交 `793a07b53ea6a384ac32faef82a9fb7208e1390e` 已推送 main；两个旧包关闭、未整体合并，源分支保留 |
| PR #19 | 4项时序与51帧证据在 `2912938` 独立合入；原 PR 仍 open/draft，另8项节奏／语义待审 |
| PR #22／#24 | #22的237个旧身体包装关闭未合并；#24混合祖先仍 open/draft，r7已独立合入，不整体引入旧候选 |
| 模型与验收 | 已接受的 r7及其 tag／SHA不变；新增 opt-in `training-human-v3-contact / 0.1.0-r5`。双手逐指、4种颈姿及侧抬腿冷／热启动局部复测通过，不能视为全库动作审核 |
| 发布与统计 | spec开发总表现301（新增4项时序），稳定ID仍142；生产默认v2plus rc2、catalog0.3.0、media0.2.0不变，全动作迁移、媒体／SDK升级和整身GLB烘焙未执行 |

三项推送门禁 verify、7项 portability、catalog --check 均通过；新扩展另有CPU、递归验签及GPU前后图／测量。各PR已写入采纳范围、实际数据与对比图链接，未删除旧分支或清理既有工作树。完整提交和剩余项见 [选择性采纳交付记录](reviews/pr17-22-adoption-20261028/adoption-record-r1.md)。

## 2026-10-28 身体 v3 r7 独立合入

开哥已在本机网页看样接受 `training-human-v3-completed / 1.0.0-r7`，并要求合并、标记和记录。看样源码为 `d448b0b22a4f41285ba52b9cfd43d7bfad7750af`，r7 manifest 的 LF 规范化 SHA-256 为 `676a19e7b4185848ce2570c66a996ba4f967305a03feafe45e4c69b36c7a7fb6`。用户明确选择先独立集成身体 v3 与必要依赖；原 PR #24 的祖先包含 237 个未审动作 spec，旧候选留在原 PR，不因身体看样通过。实际提交、标记与验证见 [r7 合入记录](body-v3/integration-20261028-r1.md)，原看样范围见 [r2 确认](body-v3/review-approval-20261028-r2.md)。

| 对象 | 本检查点的状态 |
| --- | --- |
| 身体 v3 r7 | 独立集成 `5be7c414c75c4fb5c027ee58d353e16aa8de5b48`，main 合并 `b9a3567dd625c570b88d792fd45ec6f69ab9cd50`；随后仅补合入文档与台账 |
| 验收标记 | 注释 tag `body-v3-r7-accepted-20261028` 指向上述独立集成提交；模型 manifest 保持原 SHA |
| 动作与生产 | 全动作 v3 迁移和重定向未完成；可选整身 GLB 未烘焙；全局生产默认仍为 `training-human-v2plus / 1.0.0-rc2`，媒体、catalog 和 SDK 版本不因此升级 |
| 原 PR 与冻结记录 | 原 PR #24 保留 open/draft，身体部分由本次独立合入取代；PR #17–#22 及其分支不执行写操作。冻结 manifest 的 pending/unreviewed 原文和 SHA 保留，后续确认由验收记录补充 |

下文保留各历史阶段的原始状态和日期；本检查点不改写历史合入记录。

更新日期：2026-10-24。用户已明确授权将 `codex/pr15-contact-repair` 合入 main、对齐文档并提交推送；main 已从 `41b1922459e36cd4ff2947828135b755465d0613` 快进接入 `335a033569e223487ab2fd37ba036801fdbb6a3d`。新手部、七项专用修订和复现工具已进入 main；本次在该代码树上补齐合入后文档。native-r3 手部外观仅在原确认范围内通过，Git 合入与动作审核、公开媒体发布分别管理。穿针式仍为低位小范围候选，原高位起点未恢复。

既有 AI 目录仍为 **0.3.0 / 142 ID**，公开 App 媒体仍为 **0.2.0 published**，全局生产配方保持 **training-human-v2plus 1.0.0-rc2**。全库第一版 189 动作、1890 视频的独立待审快照仍在生产分支，未随本次 PR15 合入 main。各分支统计不相加；本轮只集成下述独立模型与动作修订，不改全局默认、媒体发布版本或 App。规则见[版本管理](version-management.md)。

## 2026-10-24 历史版本与计数

2026-10-21 的六动作试制（历史）：开哥接受 `codex/action-package-v2-pilot` 的 r2 样片并同意合入、推送，当时本地 main 快进至 `5b2becb572f06a310be0cb5bdea61f47834dc5c7`。内容为动作包 `action-package@2`、六层门禁、六个代表动作与五套皮肤制作管线；确认范围见[试制确认](pilot-approval-20261021.md)。下表旧 AI/App 发布版本未因此升级，旧 `complete` 不替代 v2 门禁；后续全库制作已获授权，不再等待这项制作确认。

该六动作试制修订为 **r2**，目录 `F:/PoseHub-v2-pilot/neck-fix-r2/`。颈部漏色修正后的六动作五皮肤母版、60 份视频和 draft.2 接合记录保留；当时的完整性、像素、姿态、连续序列与冻结源检查通过，r1 保留历史。基础人体仍为 `training-human-v2plus / 1.0.0-rc2`，材质修正在渲染适配器。内容已合入 main，但当时的样片确认不覆盖后来全库或本轮 PR15 的动作审核。证据见[颈部修复记录](neck-material-fix-20261021.md)与试制记录。

| 对象 | 版本或数量 | 状态 | 依据 |
| --- | --- | --- | --- |
| AI 动作目录 | 0.3.0 / formatVersion 1，142 个稳定动作 id | PR #11、#13 已合入；本阶段未新建目录 tag | [catalog.json](../catalog/catalog.json)、[PR #13](https://github.com/mhgd3250905/3D-Pose-Hub/pull/13) |
| 各 App 目录覆盖 | FlareLab 51、HipLab 46、SmartFit 93 | 有重叠，不能相加作为动作总数；不代表本次已升级 App | `catalog.drills[].apps` |
| 目录配套完整度 | 46 个 complete；96 个未进入 Pose-Hub 媒体发布、49 个缺中文语音、96 个缺英文语音 | 按当前生成物记录，缺项未在本次补齐 | [MISSING.md](../catalog/MISSING.md) |
| spec 开发总表 | PR15 合入后 main 为 297 文件，较合入前 253 新增 44；其中本轮自主修复新增 16 | 含旧版、失败尝试和待审候选；不等于稳定 ID 或已发布动作数 | [drill-catalog.md](drill-catalog.md)、候选登记表 |
| 新制作基础人体 | training-human-v2plus 1.0.0-rc2 | 已合入 main 的全局配方；本轮独立模型不替换它 | [生产配置](../drill-anim/models/current-production.json)、[新版清单](../drill-anim/models/training-human-v2plus.json) |
| PR15 独立模型及动作修订 | hands-native r3、native-grip r1、instep-native r1、overhead-native r2、threadneedle-native r1 | 源码与工具已合入 main；七项本机审阅片及待用户动作审核状态保留，scope 见下表 | [合入前七项交付](pr15-local-repair-delivery-20261024.md)、各固定模型清单 |
| 全库第一版制作保存 | library-v2-20261022-r1，189 动作、1890 视频 | 生产分支的 draft-unreviewed 快照；不是本轮重渲或公开发布 | 下文固定来源与分支说明 |
| 历史基础人体 | training-human-v2 2.0.1 | 旧规格/批次继续复现；13 个固定源未改，仅默认选择标记调整 | [旧版清单](../drill-anim/models/training-human-v2.json) |
| App 媒体 | media 0.2.0，46 个 HipLab 动作、92 个公开文件 | published，soft-v1；0.1.0 保留 | [媒体清单](../media/manifest.json)、[0.2.0 发布记录](../media/releases/0.2.0.md) |

`complete` 不要求英文语音，也不代表全部 142 个动作均已打包发布、消费端已兼容或已通过医学禁忌审核。制作归档的绿幕和透明帧数量另按[素材库同步记录](material-cloud-sync.md)统计，不混入上表。

## 2026-10-24 用户授权合入 main

用户在确认新手部尚未进入 main 后，明确要求“提交合并，合并之后把文档对齐，保存提交 push”。这项授权补充了下节此前仅限本地保存的 scope。

| 身份 / 检查 | 实际结果 |
| --- | --- |
| 合入前 main | `41b1922459e36cd4ff2947828135b755465d0613`；本地 main 与 `git fetch --no-tags origin main` 回读一致 |
| 修复分支交付 | `codex/pr15-contact-repair` / `335a033569e223487ab2fd37ba036801fdbb6a3d`，包含手部确认保存、其余动作修订、审阅工具和前序文档收束 |
| 本地合入方式 | 在原干净修复工作副本切换至 main，`git merge --ff-only codex/pr15-contact-repair` 成功；main 为上述交付 SHA，`git diff --exit-code codex/pr15-contact-repair HEAD` 无差异 |
| 相对旧 main 的有限 delta | 62 个提交、253 路径（241 新增、12 修改）；根入口/属性 3、catalog 1、docs 79、drill-anim 147、tools 23。规格由 253 到 297，共新增 44；没有覆盖原规格 |
| 固定来源与默认 | `runtime/`、`drill-anim/lib/`、`drill-anim/page/`、两份基础模型清单、`current-production.json`、npm 依赖及 `media/manifest.json` 相对旧 main 均无路径差异；专用模型按显式动作 ID / version / loader 使用 |
| 审核边界 | 分支中的失败尝试与稀疏 QA 记录一并保留，不能视为已通过；Git 合入授权不把全部动作或七项审阅片标为已审核/可发布，也不恢复穿针式原高位起点 |
| 主目录与其他成果 | `E:/AII-3D/3D-Pose-Hub` 保持生产分支 `36e1bb6`，原有 `.gitignore` 及 7 个 App 配套 untracked 文件保留。未合入生产快照分支，未修改/提交本地媒体或已有 release 目录 |

合入后的 main 文档统一引用实际交付和审核范围；合入前的手部确认、七项交付、本地 closeout 及失败记录保留当时身份。下节与 dated 文档中的“未合入/未推送”描述属于原检查点，不覆盖本节新增的用户授权及 main 状态。

2026-10-24 02:20:23–02:20:56（上海时间），本机在 main `335a033569e223487ab2fd37ba036801fdbb6a3d` 加本次 7 份说明文档的工作树重跑：`node --test`（与下节相同的 11 个明确路径）48 项、`node drill-anim/verify.mjs` 297 规格与固定源、`python -B drill-anim/test_portability.py` 7 项、`node drill-anim/tools/catalog.mjs --check`、`verifyThreadneedle()` 均通过。前后 HEAD 相同；完整状态仅这 7 项归属本 Agent 的 Markdown 修改，代码/规格/模型/配置没有未提交差异。合入后的 93 个本地文档链接、实际模型版本/scope、待审/默认字段及 `git diff --check` 另核对通过；独立只读复核未发现阻塞集成或状态表述问题。最终文档提交相对该源仍仅 7 份 Markdown，这些代码验证继续适用。

本次交付从 main 普通推送到 `origin/main`，最终引用为**实际包含本节的完整 Git 提交**；推送后用 `git ls-remote origin refs/heads/main` 回读并核对同一 SHA。代码输入固定为 `335a033`，后续只对齐说明文档；完整交付提交与远端回执另由 Git 历史和 Cockpit 检查点记录，避免文档引用自身提交哈希。本次不创建 tag、媒体发布或云盘上传。

## 2026-10-24 PR #15 本地修订与阶段收束

本节保留 main 合入前的本地 closeout 记录；后续 main 授权与交付见上节，不改写本节原证据状态。

### 版本、范围与保存状态

| 独立模型 profile | 当前修订 | 限定动作 / 状态 | 固定来源 |
| --- | --- | --- | --- |
| training-human-v2plus-hands-native | 1.0.0-r3 | 提踵 rr7、单腿臀推 rr8；仅手部外观已获确认 | [manifest](../drill-anim/models/hands-native-r3/manifest.json)、[原确认范围](hand-r3-approval-20261023.md) |
| training-human-v2plus-native-grip | 1.0.0-r1 | 固定杆引体 rr7；动作待审 | [manifest](../drill-anim/models/grip-native-r1/manifest.json) |
| training-human-v2plus-instep-native | 1.0.0-r1 | 跪姿脚背拉伸 rr6；动作待审 | [manifest](../drill-anim/models/instep-native-r1/manifest.json) |
| training-human-v2plus-overhead-native | 1.0.0-r2 | 过头臂屈伸 rr4；r1 的腕扭曲失败尝试保留，动作待审 | [manifest](../drill-anim/models/overhead-native-r2/manifest.json) |
| training-human-v2plus-threadneedle-native | 1.0.0-r1 | 低位穿针 rr1，小范围候选；原高位起点未恢复 | [manifest](../drill-anim/models/threadneedle-native-r1/manifest.json)、[几何边界](pr15-threadneedle-native-repair-20261024.md) |

墙面掌根抬起 rr5 继续使用既有 contact-wrist 专用模型；七项的精确 spec ID、视频字节数和复现入口见[交付记录](pr15-local-repair-delivery-20261024.md)。本机入口为 `F:/PoseHub-v2-pilot/pr15-final-review-20261024/index.html`；前序交付已核对七个视频、封面、源报告哈希，视频合计 1,471,937 字节。本次 closeout 不读取媒体产物或重跑渲染，不把既有产物当作新增 HEAD 的构建证明。

原生手 r1/r2 和 overhead r1 均作为历史保留；固定清单内 `reviewed:false` / `releaseEligible:false` 不因手部确认而改写。最新确认仅由原确认记录补充，全部动作仍等待用户审核。独立模型、原配色深底审阅视频和生产默认、五皮肤分层母版、App 媒体版本分别管理；本轮不递增 catalog 0.3.0 或已 published 的 media 0.2.0。

另一个已授权工作副本的生产分支 `codex/action-library-v2-production` 在 `36e1bb678047a3d5613a553a05be37dac8d9046b` 保存 `docs/production-snapshots/library-v2-20261022-r1.md`。本次只读核对该版本化记录：142 正式 ID 加 PR #14 的 47 个，1890 视频及配图第一版完成，整体 draft-unreviewed。它在其自身源 HEAD 上记录 300 份规格；本 PR15 分支为 297，未合并、不能相加或互相覆盖。该快照文件不在本修复分支，既有生产状态不能误写成“全库尚未安排”，也不能当作本轮七项已审核或已发布。

### Preflight 与改动归属

收束 scope 为本轮 PR15 修复的独立模型/规格版本登记、项目入口、制作与审核状态、当前台账和本地保存；不包含全库重渲、动作批准、App 接入、main 合入、push、tag、公开媒体或云盘整理。

| 身份 | 实际核对结果 |
| --- | --- |
| baseline | `aed8c0f9f634ccf8d2dd2a506e3d6e739ccfd98d`，阶段已记录的 PR15 审核起点；`git rev-parse --verify <SHA>^{commit}` 及 `git rev-parse c7cd299^` 核实，且为候选 HEAD 祖先 |
| Preflight HEAD | `dac56cff21e338c7eeddd4e796a046e04ac575be`，`refs/heads/codex/pr15-contact-repair` |
| stage delta | baseline 至该 HEAD 共 4 个本会话提交、114 路径：111 新增、3 修改；根属性 1、docs 9、drill-anim 82、tools 22。新增 16 份规格、48 个独立模型文件、测试与复现工具；原动作不覆盖 |
| 提交链 | `c7cd299eb4e3df4831a851f74ca7d81627f92877` → `d212cd26e1610567f4ee20d8b6df95f485196fa8` → `fe4568f289912ba863fb996b9b4aaf3dce5d99fe` → 上述 HEAD |
| 完整修复工作区状态 | `git status --porcelain=v1 --untracked-files=all`：tracked/staged/unstaged/deleted/renamed/untracked 均 0；阶段改动全部由本会话提交，归属明确 |
| 主目录既有改动 | `.gitignore` 1 个 tracked 未暂存修改；7 个 untracked：`media/app-builtin-v0.3.0.json`、`media/app-release-metadata-pr14.json`、`media/app-release.md`、`media/tests/test_app_index.py`、`media/tests/test_app_release.py`、`media/tools/build_app_index.py`、`media/tools/build_app_release.py`。与阶段前记录相同，归属先前已授权 App 发布配套工作；仅核对路径与类别，未读取内容，不纳入本次提交 |

canonical discovery 从根 AGENTS/README、最近适用的 drill-anim/AGENTS 及主目录实际 AGENTS 出发，一跳读取；主目录与修复工作副本属于同一已授权项目。当前事实与冻结历史分开：

| 实际检查路径 | 判定与对应主题 | 本次结论 |
| --- | --- | --- |
| `AGENTS.md`、`README.md`、`drill-anim/AGENTS.md` | current：权限、工作边界、当前入口 | 对齐独立修订及既有全库制作授权；不触碰主目录已有改动 |
| `docs/version-management.md`、`docs/version-ledger.md` | current：版本对象、当前版本与状态汇总 | 补齐独立模型实际版本、分支和审核边界；更新旧日期/规格数 |
| `drill-anim/models/current-production.json`、`training-human-v2plus.json`、`docs/training-human-v2plus.md` | current：生产配方、固定模型身份、制作标准 | rc2 及全部固定源不变；独立模型按显式 scope 使用 |
| 本轮 `hands-native-r1/r2/r3`、`grip-native-r1`、`instep-native-r1`、`overhead-native-r1/r2`、`threadneedle-native-r1` 的 `manifest.json`，`drill-anim/data/home-pr-candidates.json`，`docs/drill-catalog.md` | current 的固定登记与生成视图；失败版仍属历史候选，不能选作通过版本 | 实际版本、16 新规格 LF SHA、总数 297 与验证吻合；`.gitattributes` 的固定字节保护有回归证据 |
| `docs/review-rubric.md`、`catalog/v2/README.md`、`tools/action-package-v2/README.md` | current：审核规则、六层合同、本地审片入口 | 旧人体统一性行更新；六动作试制命令保留其原 scope，七项审阅不冒充六层接合或发布 |
| `catalog/catalog.json`、`media/manifest.json` | current：目录及公开发布事实 | 0.3.0 / 142，0.1.0 与 0.2.0 published；本轮不修改 |
| `drill-anim/models/training-human-v2.json`；`docs/hand-r3-approval-20261023.md`、`docs/pr15-local-repair-delivery-20261024.md`；生产分支上述制作快照 | archive/history：旧模型、限定确认及交付、冻结生产保存记录；旧 13 源仍是复现契约 | 原身份及证据范围保留；不冒充当前动作全面审核或新媒体发布 |

### 验证及 source state

2026-10-24 01:48:06–01:48:35（上海时间），本机在完整干净 HEAD `dac56cff21e338c7eeddd4e796a046e04ac575be` 重跑以下检查，前后 HEAD 与完整状态均核对一致：

| 命令 | 结果 |
| --- | --- |
| `node --test` 加下列 11 个明确路径 | 48 项通过 |
| `node drill-anim/verify.mjs`，`NODE_OPTIONS=--max-old-space-size=256` | 297 规格、旧 13 源与 v2plus 固定源契约通过；原哈希保持 |
| `python -B drill-anim/test_portability.py` | 7 项通过 |
| `node drill-anim/tools/catalog.mjs --check` | 生成的完整规格总表一致 |
| `node --input-type=module -e "import {verifyThreadneedle} from './drill-anim/models/threadneedle-native-r1/loader.mjs'; const m=verifyThreadneedle(); console.log('threadneedle manifest verified',m.version);"` | threadneedle 1.0.0-r1 固定来源通过 |

Node 测试的完整文件参数为：

```text
drill-anim/tests/contact-manifest.test.mjs
drill-anim/tools/tests/hand-touch-revisions.test.mjs
drill-anim/tests/native-hands.test.mjs
drill-anim/tests/native-wrist.test.mjs
drill-anim/tests/native-hand-fit.test.mjs
drill-anim/tests/native-grip.test.mjs
drill-anim/tests/instep-native.test.mjs
drill-anim/tests/overhead-triceps.test.mjs
drill-anim/tests/overhead-native.test.mjs
drill-anim/tests/overhead-neutral.test.mjs
drill-anim/tools/tests/special-profiles-review.test.mjs
```

本次 alignment 只修改 8 份明确的 Markdown：根 AGENTS/README、版本规则/台账、v2plus 标准、审核标准、v2 合同说明、action-package-v2 工具说明。代码、规格、模型、生产配置、冻结记录与媒体清单相对上述 SHA 无变化，因此代码验证继续适用。在该 HEAD 加这 8 份文档的 source state 上，94 个本地 Markdown 链接、实际模型版本/scope/审核字段、297 规格计数、catalog 一致性及 `git diff --check` 均通过；完整状态中 8 项修改归属本 Agent，暂存/删除/重命名/untracked 为 0。提交后再核对完整状态；最终收束 SHA 由 Git 历史与 Cockpit 回执给出，不在文档内循环引用自身提交。

确定 findings 已按上述来源对齐：旧日期/206 规格、缺少独立模型版本汇总、六动作试制被误称当前全库进度，以及审核统一性仍要求旧人体。尚待用户确认的动作、穿针式原高位起点、五皮肤分层接合与公开发布均如实保留，不作为文档 finding 自动关闭。本地 commit 与平台可选检查点分别确认；本轮没有执行 push、merge、tag、媒体发布或清理。

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

以下保留 2026-10-21 当时的收束与待办记录；当前 PR15 修订及后续生产保存状态见上文 2026-10-24 记录。

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

### 停止点与待用户安排

- 是否及按什么优先级，将已发布或在用动作分批迁移到新版人体；尚未派发全片渲染。
- 每个迁移动作的预览、道具/支点/手型、高亮、完整循环 QA 与验收；目前没有“全 200 动作已通过”的结论。
- 新版成片的媒体版本、App 接入与消费端执行验收；现行发布 ZIP、旧锁定版本保持原样。
- 本地预览是否需要后续云盘归档，由用户另行提出整理请求；本轮没有建立定时器或自动同步。

代码及文档保存后等待用户下一步；Cockpit 只登记一个非终态检查点，不自动结束 session、relay 或 handoff。
