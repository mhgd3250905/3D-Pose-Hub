# 固定握哑铃与腕部接入：验收及源码交付

2026-10-28，用户看过固定握哑铃外观和实际人体腕部接入预览，确认：
“可以看起来还不错 我验收通过了”。随后明确要求“整理成果文档然后推进合并”。
本次将该成果和运行必需依赖精选进入 main，作为后续动作接入的固定基准。

## 交付入口

| 对象 | 仓库入口 | 当前状态 |
| --- | --- | --- |
| 固定左右手与哑铃 | [webxr-dumbbell-wrist-r1](../../drill-anim/models/webxr-dumbbell-wrist-r1/README.md) | 用户接受外观；手、哑铃及腕口尺寸固定 |
| 腕部接入 | [loader.mjs](../../tools/body-v3/webxr-wrist-join-r1/loader.mjs)、[runtime.js](../../tools/body-v3/webxr-wrist-join-r1/runtime.js) | r4 外观接受，主验收采样通过 |
| 操作与复现 | [腕部工具说明](../../tools/body-v3/webxr-wrist-join-r1/README.md) | CPU、实际渲染采集、独立检查和只读查看器 |
| 研究与取舍 | [手型和腕部研究记录](hand-presets-and-wrist-research-20261028.md) | 保存选型、失败候选、尺寸修正与验收演进 |
| 当前接入人体 | [training-human-v3-armfix-r2](../../drill-anim/models/training-human-v3-armfix-r2/README.md) | 本次接入所用固定依赖；其全身候选身份不因腕部验收改变 |

先通过 armfix-r2 的 `boot` / `applyV3` 初始化页面，再调用腕部 `install(page)`。
新默认配方、模板与来源数据均在仓库内，外部 QA 所在的 F 盘不是运行依赖。
显式传入原配方和模板目录的旧调用继续有效。普通加载不会自动切换全局模型配置。

独立固定模板的 `template.mjs` 返回以 `wrist_anchor` 为原点的米制组合。
手与哑铃一同跟随 Hand，不能再为同一手叠加动作中的第二只哑铃。
四套手型的总体方向仍保留；本次只完成固定抓握，不宣称支撑、放松、扶靠均已完成。

## 固定外形与接入方式

- 使用 WebXR generic-hand 的修正左手构型；右手为明确镜像并反转面绕序，避免左右源骨架位置差异继承到成品。
- 按项目哑铃构造使用直径32mm、长165mm握柄；六角片外接半径42mm、厚60mm，中心在柄轴±111mm。
- 固定手的腕 pivot、尺寸和已确认的握持造型保持原值；没有按场景自动求解每根手指。
- 对现有前臂在 canonical Y=-40mm 裁口，对新手在+20mm裁口，精确连接实际闭环边界。
- 新腕带分散弯曲和扭转，端点位置与法线同步。Y=0..20mm内侧最多4mm的平滑退让消除两处局部折返；两端值与一阶导归零。
- 运行时保留原手和原 geometry/material，关闭或卸载可还原。每帧使用缓存恢复，不累积变形。

验收运行时原始 SHA-256：
`731a3db458d639ed1f7597b956896874170ebb1d1f1b7599540686aaceba34df`。
可移植归档只改变加载与来源路径，不修改该运行时字节或获验收的模型几何。

## 验证与实际看样

最终 GPU 输入和输出固定在本机外部目录：

`F:/PoseHub-v2-production/action-completion-v3-20261028-r1/qa/hand-presets-r1/webxr-wrist-join-r1/gpu-grid-r4/`

采用固定 NVIDIA RTX 4080 Laptop / ANGLE D3D11 环境，采集真实 `scene.onAfterRender`
的前臂、腕带、手、哑铃及骨骼矩阵。测试姿势求解完整相对旋转，排除了旧诊断中“命令角度正确但夹带侧偏”的问题。

| 检查 | 结果与范围 |
| --- | --- |
| 主验收 | 0/±30/±60°掌屈背伸 × 0/±60°旋转，另加中立和非零回位；17行、左右共34侧样本全部通过 |
| 网格 | combined wrist ROI 无非邻接交叉；最小面积比0.12632、最小边长比0.28811，高于既定0.1塌陷阈值 |
| 接口连续 | 最大位置缝隙0.00003288mm；最大世界法线夹角0.000003913° |
| 姿态与刚性 | 完整目标旋转最大误差0.01789°；手及哑铃保持同一刚性变换 |
| 生命周期 | geometry、normal、bone、cache恢复及重复姿态无累积检查通过；卸载恢复原对象 |
| 压力测试 | 额外6行75°样本存在失败，明确未通过，不计入主验收 |

实际看过中立握持、正反60°的掌/背/侧/斜视、整个人体中立图，以及最不利的右手60°弯曲加60°旋转接头。
只读查看器的三维窗口使用明确标注的几何检查材质；原材质外观以同姿态GPU PNG为准。
用户已确认本次展示的接入外观。该确认与有限采样证据不等于所有中间姿态、整身碰撞或全部训练动作均已验收。

原始图片、逐帧大JSON和ZIP留在外部 QA 目录，不提交成片或帧PNG。
仓库保存模型源、固定配方、必要输入、许可及精简验收证据，原外部回执不覆盖。
原25mm握持保存版保留作历史回退；当前训练模板为32mm。

## 许可、依赖与合入范围

WebXR手源许可为 MIT，Copyright (c) 2019 Amazon，随派生手JSON及GLB保留。
人体对称手依赖保留现有 MakeHuman hm08 / CC0 1.0 来源记录。Three.js沿用项目依赖，不另打包vendor副本。

本次纳入实际初始化必需的 armfix-r1/r2、对称native手、独立viewer/rig及固定验证工具。
它们的冻结manifest和 `candidate-unreviewed` / `releaseEligible:false` 身份保持原样；腕部外观确认由独立记录补充。
这解决初始化依赖闭包，不把手部验收扩大成全身模型升级。

来源开发工作树还有动作规格、目录及旧手型试验的未完成改动。本次只选择已验收手部/腕部和必要依赖，
跳过父提交中的动作盘点文档，保留原项目生产分支和其他工作树的WIP。
全局 `current-production.json`、已发布媒体、App/SDK版本保持原有状态；本次不发布素材或创建tag。

## 合入后的使用边界

后续握哑铃动作可显式接入本模块，并逐动作检查手腕方向、前臂姿势、器材与身体接触。
其他器材粗细和其他手型需要独立模板或变体；75°范围需要另行优化验证。
Git提交和远端合入状态记于[版本台账](../version-ledger.md)新增检查点，历史验收文件不回写为全库发布。

## 2026-10-28 main合入回执

来源为 `codex/action-inventory-20261028` 的独立交付提交 `325c4c9`。
在干净的main工作树 `E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023`，
从 `56a479df170ec53d124ebc12fae7e77b7928a64a` 执行 `cherry-pick -x`，
形成 `94534211bac2ebed995df94ba4cabe66397b4fab`，共68个路径。
已确认无关动作盘点提交 `7662842` 不在main祖先中，原目录和来源工作树的其余WIP保留。
随后仅补本文、身体文档索引和版本台账，随main正常推送；包含本节的提交即文档收尾提交。

main上的验证记录保存在：

`F:/PoseHub-v2-production/action-completion-v3-20261028-r1/qa/hand-presets-r1/webxr-wrist-join-r1/main-merge-validation/`

| 验证 | main复验结果 |
| --- | --- |
| `node drill-anim/verify.mjs` | 通过；301规格及冻结源检查正常 |
| `python -B drill-anim/test_portability.py` | 7/7通过 |
| `node drill-anim/tools/catalog.mjs --check` | catalog up to date |
| armfix-r1/r2 `armfix.test.mjs` | 15/15通过 |
| 腕部 `cpu-test.mjs` | 153断言通过；属于CPU数学／生命周期覆盖 |
| 腕部 `test_portable.mjs` | 17文件换目录加载通过，禁止外部读取仍可工作，源／哑铃／运行时篡改被拒绝 |
| 腕部 `test_build.py` | 左右端点误差均小于2.5e-16m，每侧1222个受保护手顶点精确保持，静态腕带无自交／共面重叠 |

提交前已另用旧外部配方做深度比较，几何、索引、模板与变换一致。
main复验沿用同一份资源及验收运行时；本次未重新渲染GPU帧，GPU结论来自上文固定的r4采样证据。

## 2026-10-28 阶段收束

用户显式调用 `cockpit-closeout` 并要求“台账整理+文档更新，保存push提交”。
收束scope为本阶段已接受的固定握哑铃、腕部r4、必要依赖的交付事实、用法和验证绑定；
不改模型、运行时、动作spec、生产配方、媒体或App/SDK，不触发新渲染、tag或素材发布。

### Preflight基线、范围与归属

baseline为上一轮实际main合入起点 `56a479df170ec53d124ebc12fae7e77b7928a64a`，
使用完整SHA的 `git rev-parse --verify <SHA>^{commit}` 核对存在，再以 `git merge-base --is-ancestor` 确认是HEAD祖先。
收束前HEAD为 `dbba3a7c69dc872ba53d04311d2b74ed6d993886`，分支main；
同日只读回读 `git ls-remote origin refs/heads/main` 得到相同SHA，确认上一轮交付已推送。
远端为 `https://github.com/mhgd3250905/3D-Pose-Hub.git`。

`git log <baseline>..HEAD` 仅含源码提交 `9453421` 和文档提交 `dbba3a7`；
`git diff --name-status <baseline>..HEAD` 为67新增、3修改，共70路径，均属于上一轮明确选择的交付。
其中 `.gitattributes` 1、docs 4、模型43、runtime 2、tools 20。
源码提交的68路径与整个阶段70路径不是同一统计范围。

在实际main工作树 `E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023`，
两次完整 `git status --porcelain=v1 --untracked-files=all` 均为空：暂存、未暂存、删除、重命名、未跟踪均0。
原项目目录 `E:/AII-3D/3D-Pose-Hub` 仍是阶段前记录的生产工作树；仅核对路径/状态，未读取以下WIP内容：

| 状态 | 路径 | 归属与处理 |
| --- | --- | --- |
| 未暂存修改1项 | `.gitignore` | 阶段前已记录的既有改动，保留且排除 |
| 未跟踪3项 | `media/app-builtin-v0.3.0.json`、`media/app-release-metadata-pr14.json`、`media/app-release.md` | 阶段前已记录的媒体WIP，保留且排除 |
| 未跟踪2项 | `media/tests/test_app_index.py`、`media/tests/test_app_release.py` | 同上 |
| 未跟踪2项 | `media/tools/build_app_index.py`、`media/tools/build_app_release.py` | 同上 |

原项目没有暂存、删除或重命名项。来源开发工作树本次不操作，上一轮留下的动作和实验WIP不纳入此次文档收束。

### Canonical来源核对

先读取根 `AGENTS.md`、本阶段路径唯一适用的子级 `drill-anim/AGENTS.md`，再读取根 `README.md`。
仅沿这些入口的明确声明一跳检查以下来源；阶段工具文档和loader另外作为本次delta的行为证据读取。

| 实际检查路径 | 类别与current/archive判定 | 核对结果 |
| --- | --- | --- |
| `docs/version-ledger.md` | current版本/Git/验收汇总；其中日期段落保留历史 | 手部合入、有限验收、生产和发布边界与实际一致；补记明确的远端交付SHA及本次收束 |
| `docs/body-v3/README.md` | current独立模型入口 | 身体r7、接触r5与armfix-r2上的腕部接入分别列出；补齐阶段收束入口 |
| `docs/version-management.md` | current版本与记录规则 | 模型身份、源码合入、外观验收和媒体发布分别管理，无需修正 |
| `docs/training-human-v2plus.md` | current生产标准；旧批次说明属history | v2plus仍为默认；冻结状态注记不随Git合入改写，无需修正 |
| `drill-anim/models/current-production.json` | current唯一默认配方 | 仍为training-human-v2plus / 1.0.0-rc2；与baseline字节对象一致 |
| `drill-anim/models/training-human-v2plus.json` | current默认模型的冻结身份 | 13项sourceSha256及生产配置引用保持不变；旧审批注记属于编制时状态 |
| `drill-anim/models/training-human-v2.json` | archive/history冻结模型 | `defaultForNewDrills:false`，仅供历史复现；不作为当前生产选择 |

阶段主题映射：代码行为和接入方式对应身体入口及版本台账；模型/配方对应current-production与v2plus清单；
源码交付和验收/发布状态对应版本台账及版本管理规则。`catalog/catalog.json`、`media/manifest.json` 与baseline的Git blob一致，
本次仅核对未变更，不据此新增发布或消费端验收结论。

### 验证证据与source state

下列命令于2026-10-28上一轮main合入验证实际执行，来源为同会话工具返回，
对应完整源码SHA `94534211bac2ebed995df94ba4cabe66397b4fab`：

```sh
node drill-anim/verify.mjs
python -B drill-anim/test_portability.py
node drill-anim/tools/catalog.mjs --check
node --test drill-anim/models/training-human-v3-armfix-r1/armfix.test.mjs drill-anim/models/training-human-v3-armfix-r2/armfix.test.mjs
node tools/body-v3/webxr-wrist-join-r1/cpu-test.mjs drill-anim/models/webxr-dumbbell-wrist-r1/recipe.json
node tools/body-v3/webxr-wrist-join-r1/test_portable.mjs
python -B tools/body-v3/webxr-wrist-join-r1/test_build.py --recipe drill-anim/models/webxr-dumbbell-wrist-r1/recipe.json
```

结果依次为verify通过（301规格）、7/7、catalog一致、15/15、153断言通过、可移植/篡改检测通过、静态几何检查通过。
`git diff 94534211bac2ebed995df94ba4cabe66397b4fab dbba3a7c69dc872ba53d04311d2b74ed6d993886` 仅3份Markdown增加44行，
没有代码、数据或配置变化，故这些检查仍适用。此次文档收束也仅改5份Markdown，不重复全量测试或GPU采样。

本次在干净的收束前HEAD上另做只读源码核对：资源包17文件/11,955,308字节；manifest内16项文件的字节数与SHA全部匹配，
runtime SHA仍为 `731a3db458d639ed1f7597b956896874170ebb1d1f1b7599540686aaceba34df`，
recipe SHA仍为 `6e914594f46734c77ee9bf219e82bdcceb5a19d627e5595959c06cadb9989a2b`。
runtime也与已测试源码提交的Git blob完全一致。GPU外观结论保持上文的原r4有限采样强度。

2026-10-28 22:53（UTC+8）在 `dbba3a7` 加本次5份Markdown的工作树上完成定向验证：
新增3个文档链接（含阶段锚点）存在、16项资源pin和两项SHA匹配、变更范围恰为5份Markdown；
以 `node --input-type=module` 导入 `./tools/body-v3/webxr-wrist-join-r1/loader.mjs` 并调用 `verify()` 成功，
默认recipe为仓库包，每侧读取3个真实哑铃primitive。验证来源为本次命令输出，覆盖新文档描述的默认用法；
`git diff --check` 同时通过。一次临时核对命令因Windows默认GBK解码中文diff中断，显式改用UTF-8后上述核对通过，未改项目源码。

### 确定修正与下一阶段

工具README旧段落把 `recipePath` 写成必填，并把手源相邻目录描述为唯一模板推导方式。
本次依照loader修正中英文用法与示例：默认仓库recipe；显式options.templateDir优先（相对当前工作目录），
其次recipe.templateDir（相对recipe目录），最后保留旧手源相邻目录回退。
根README补成果入口，身体索引、本文和台账补齐交付/验证绑定。冻结资源包README、manifest和runtime均不改。

下一阶段按具体动作显式接入固定模板，检查腕方向、前臂姿态、器材接触及重复哑铃；
支撑、放松、扶靠是待做模板，75°压力范围另行优化。全局默认切换、全库迁移和媒体/App/SDK升级仍需各自验证。
本节所在Git提交是文档收束保存点；本次普通push及远端最终SHA由Git回读和同会话交付回执确认，不在文档中自引用未知提交SHA。
