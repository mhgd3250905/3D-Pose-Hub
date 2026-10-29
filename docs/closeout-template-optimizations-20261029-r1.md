# 人体关节优化、32模板与219远端接力：阶段收束

用户于2026-10-29显式调用 `cockpit-closeout`。本轮先完成只读Preflight，再有限对齐当前文档并形成提交；本文件不代表Cockpit session结束、动作用户验收或素材发布。普通push沿用本会话明确的保存、合入main、文档对齐并push授权。

## 收束后的成果入口

| 成果 | 当前身份与边界 |
| --- | --- |
| 人体与手型 | 32模板显式采用 `training-human-v3-armfix/0.1.0-r2`；25项native、7项固定握持，支撑/放松/辅助按动作选择。全局默认仍为v2plus rc2 |
| 关节优化 | 踝连接r5、大臂连续轮廓r3、按需肘DQS r1、固定腕组合及实际旋转/指姿检查；旧源、失败试版和局部确认保留 |
| 首批32 | [remaining32-r4](../catalog/production/remaining32-r4/README.md)，候选复核已完成；本轮不把候选改为用户接受。正式高清留到最后 |
| 剩余219 | [经验手册](remaining219-template-handoff-20261029-r1.md)与[精确源队列](../catalog/production/remaining219-source-queue-20261029-r1.json)；251动态减首批32，未开始的动作不记作完成 |
| 远端低配工作 | [GitHub任务入口](remaining219-remote-agent-20261029-r1.md)优先于经验手册中的本机环境步骤；一次一个浏览器/动作，256或320px、3–6张关键帧；本机补完整循环、连续旋转/接触及用户验收 |
| 来源恢复 | 固定308文件及参考catalog的源码包，802205字节；50缺失路径只安全创建，不覆盖不同内容。不是媒体发布ZIP |
| 版本交付 | 32成果merge `114e90dacadf18b5f1c1976791b6116fe0150647`；经验/队列 `2e159fd3535daaf60b47ba09672a2c6a2f2e728f`；远端工具 `b2fe05e373260e50142c2d5c172091a383245bfc`，merge `8dac33dc8f26636ae500872d9d7315458591d535`。收束前远端已实时核对到8dac33d |

## Preflight：baseline、HEAD与scope

- baseline：`b29762331c2958529b45dc71cbac5622e0ff786d`。选择依据是根README直接指向的 [main集成记录](production-snapshots/remaining32-main-integration-20261029-r1.md)明载“原main”，与本会话开始集成前记录一致。以完整SHA为可核对引用，`git rev-parse --verify <SHA>^{commit}`成功，`git merge-base --is-ancestor <SHA> HEAD`返回0。
- Preflight HEAD：`8dac33dc8f26636ae500872d9d7315458591d535`，分支main。已用 `git rev-parse --show-toplevel` 核对工作副本为 `E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023`。
- 收束scope：本阶段的人体/手型/关节组件、首批32候选配方、219选源与远端轻量工具的成果入口、版本、工作区归属和证据绑定。阶段二只改确定的文档对齐问题，不改源码、模型、配方、生产默认、用户审核字段或发布记录；不安排219制作、GPU重渲、App/SDK接入、tag、媒体发布或自动接力。
- stage delta：同一baseline计算 `git log --format="%H %s" <baseline>..HEAD` 和 `git diff --name-status <baseline> HEAD`，完整解析10提交、628路径，616新增/12修改，无删除或重命名。按路径归类见下表。

| 类别 | 新增 | 修改 |
| --- | ---: | ---: |
| catalog | 131 | 0 |
| docs | 16 | 3 |
| drill-anim | 185 | 5 |
| tools | 284 | 2 |
| 根README / .gitattributes | 0 | 2 |

提交范围为 `7662842`、`325c4c9`、`7613e53`、`1ac02ec`、`77a5b3f`、`95fe7fa`、`114e90d`、`2e159fd`、`b2fe05e`、`8dac33d`。其中325c4c9是源分支中已在此前main选择性采纳过的手腕祖先；通过baseline到HEAD的实际路径差异核对，不把同源历史再算一次新功能。

## Canonical discovery：入口、一跳与分类

先读取根 `AGENTS.md`、实际delta路径祖先中唯一的附加 `drill-anim/AGENTS.md`，再读取根README。只沿这些入口直接声明的本阶段来源核对，不递归扫描二级文档。下表是实际检查范围；配置/版本清单中的旧审批注记按已有版本管理规则保留，不用于推断当前Git身份。

| 路径 | 类别/判定 | 核对结果及主题 |
| --- | --- | --- |
| `AGENTS.md` | current，仓库规则入口 | 保留WIP/冻结源、动作修订、贡献流程、授权和渲染边界 |
| `drill-anim/AGENTS.md` | current，适用路径规则 | 全局默认仍有效，但缺本轮armfix显式配方范围，列入finding |
| `README.md` | current，仓库入口 | 远端与32入口存在；旧规格数字、手型后续表述需补充当前事实 |
| `docs/version-ledger.md` | current，入口明确指定当前Git/版本汇总 | 32与219状态一致；需要集中记录本次收束SHA链及验证边界 |
| `docs/version-management.md` | current，版本记录规则 | 模型/动作/catalog/媒体分别管理；编制注记与当前Git身份分开，保持不改 |
| `drill-anim/models/current-production.json` | current，全局默认事实源 | v2plus/1.0.0-rc2，不因本批候选改默认；adoption旧注记不改写 |
| `docs/body-v3/README.md` | current，根README声明的身体专用入口 | 旧r7/r5身份有效；缺32的armfix/关节入口，尾部241迁移描述过时 |
| `docs/drill-catalog.md` | current，自动生成spec总表 | 441文件、169修订；文件数不等于稳定动作数，`--check`通过 |
| `catalog/production/remaining32-r4/README.md` | current，本批配方入口 | 25native/7fixed，低清候选与最终验收分开，维持冻结 |
| `docs/remaining219-remote-agent-20261029-r1.md` | current，根README指定远端任务入口 | 弱云串行关键帧、本机完整复核、源码恢复和未实测Linux边界明确 |
| `catalog/production/remaining219-source-queue-20261029-r1.json` | current，本轮固定选源 | 219稳定ID、与32交集0、308依赖路径、缺50；新模板均未获验收 |
| `catalog/inventory/actions-20261028-r1.json` | archive/history，入口明确标为2026-10-28盘点 | 301与当时来源统计保留；不覆盖成当前441，251动态范围仍作为分组依据 |
| `docs/production-snapshots/remaining32-main-integration-20261029-r1.md` | archive/history，已发生的集成事实及本阶段基线 | 原main、来源、换行保真、误忽略几何配置补齐及验证范围与本会话相符 |

代码/组件行为映射到32配方入口、身体索引与台账；默认配置映射到current-production；源码分类映射到spec总表和固定队列；远端工具映射到远端任务入口。没有通过新发布改变media/catalog/App版本，stage delta也没有这些发布条目变化，不扩大扫描到外部项目。

## 完整工作区状态与归属

三个已授权同项目工作副本分别执行完整 `git status --porcelain=v1 --untracked-files=all`，无过滤、无截断。只核对WIP路径和状态，不读取其内容。

| 工作副本 | HEAD/分支 | tracked/staged/unstaged/deleted/renamed/untracked | 归属与处理 |
| --- | --- | --- | --- |
| `…/pr15-audit-20261023` | 8dac33d / main | 全部0 | 本次收束目标，阶段一干净 |
| `…/action-inventory-20261028` | 95fe7fa49e97d32be3c094acc6b79d845e19a169 / codex/action-inventory-20261028 | 全部0 | 已授权阶段制作来源，保留 |
| 原 `E:/AII-3D/3D-Pose-Hub` | 36e1bb678047a3d5613a553a05be37dac8d9046b / codex/action-library-v2-production | tracked修改1、staged0、unstaged1、deleted0、renamed0、untracked7 | 与阶段开始已记录WIP逐路径一致，保留且不纳入 |

原目录8路径：`.gitignore`（` M`）；以下均 `??`：`media/app-builtin-v0.3.0.json`、`media/app-release-metadata-pr14.json`、`media/app-release.md`、`media/tests/test_app_index.py`、`media/tests/test_app_release.py`、`media/tools/build_app_index.py`、`media/tools/build_app_release.py`。没有无法归属项；不为获得干净状态操作原目录。

## 验证证据与source state

本次只读检查于2026-10-29约20:16（UTC+8）完成，直接绑定干净HEAD `8dac33dc8f26636ae500872d9d7315458591d535`，执行来源为本会话工具返回：

| 检查 | 结果 |
| --- | --- |
| 下列 `node --test` 完整命令 | 40/40，含32配方加载与支持分支 |
| `python -B drill-anim/test_portability.py` | 7/7 |
| `node drill-anim/tools/catalog.mjs --check` | catalog up to date，441规格 |
| Python读取finalization-r2的sourceHashes，对每项实际文件做原始SHA256 | 473/473匹配；快照candidates32、userAccepted0 |
| 导入 `remote-source-preflight-r1.py`，调用 `preflight(Path.cwd())`（默认只读） | 308源和参考catalog验证；现有匹配258、缺50、冲突0、创建0 |
| `git ls-remote origin refs/heads/main` | 收束前远端与HEAD同为8dac33d |

```text
node --test tools/action-completion-v3-r2/ankle-join-r5.test.mjs tools/action-completion-v3-r2/elbow-dqs-r1.test.mjs tools/action-completion-v3-r2/upper-arm-contour-r3.test.mjs tools/action-completion-v3-r2/fixed-wrist-corrections-r1.test.mjs tools/action-completion-v3-r2/native-action-hand-pose-r2.test.mjs tools/action-completion-v3-r2/render.test.mjs tools/action-completion-v3-r2/remote-keyframes-r1.test.mjs
```

此前441规格 `node drill-anim/verify.mjs` 的成功工具返回来自本会话2026-10-29合入前工作树，其实现由 `114e90dacadf18b5f1c1976791b6116fe0150647` 封存。本次证明该提交到HEAD的 `drill-anim/`、`runtime/`、`package.json`、`package-lock.json` 差异为空，旧测试涉及的关节/配方/R8实现亦未变；因此复用规格证据，不重复昂贵扫描。新增远端代码由本次40测试覆盖其CPU边界。

此前独立GitHub克隆的恢复50/重检0/冲突拒绝与核显熊式256px4帧冒烟，在本会话中实际执行，其代码封存为b2fe05e；本次 `git diff --name-only b2fe05e HEAD` 为空，故作为该实现的已有有限证据引用。浏览器证据只覆盖Windows Intel UHD、Chrome130.0.6723.31、熊式四帧；Linux软件后端、固定握持浏览器执行、完整循环均不在其中。本次不读旧日志/截图/构建产物，不重新渲染，也不把这些观察升格成当前全库验证。

## Alignment findings与有限修正

1. 根README补441当前spec统计与32的25native/7fixed接入状态，保留301的历史语境。
2. 身体当前索引补本批armfix与腕踝肘/大臂配方入口，将旧241迁移表述改为固定32+219任务范围；旧r7确认范围不扩大。
3. drill-anim的适用规则补本批显式armfix选择与远端关键帧例外，明确全局v2plus默认仍保留。依据是用户本轮明确制作/镜头授权及已核对32/219入口，不是新模型决策。
4. 在现有台账登记本次收束与本报告，集中说明Git保存、候选复核、用户验收和媒体发布的区别。

阶段二修改范围仅为 `README.md`、`drill-anim/AGENTS.md`、`docs/body-v3/README.md`、`docs/version-ledger.md` 和本报告。提交前后重查明确路径、Markdown链接、目录检查、473来源哈希、完整状态及HEAD。包含本报告的提交是文档收束点，其parent为上述Preflight HEAD；不预填尚未生成的commit或平台revision。

提交前复核：完整状态恰为上述5个本Agent文档路径，4修改/1新增，无额外来源；124个本地Markdown链接目标存在，473来源原始SHA仍匹配，catalog检查与 `git diff --check`通过，HEAD未意外改变。以上4项确定性finding已对齐；本次40/7测试的实现、模型、配方、依赖和默认配置未改，验证继续适用于这组仅文档变更。

## 后续与平台登记边界

继续事项是：远端219逐项模板与关键帧初检、主线完整循环及用户确认、高亮最终参数选择、最后统一高清制作。现阶段32候选和远端工具都不是最终素材发布许可。

本地文档收束独立有效。完成Git保存后仅在获得可信active session/revision且当前Git/workspace一致时登记一次非终态Cockpit检查点；没有条件则跳过，不init、不relay、不结束session。MCP返回只证明其返回的Git/session事实，不替本报告证明文档语义。实际登记结果由本会话工具回执单列，不写入尚未发生的成功状态。
