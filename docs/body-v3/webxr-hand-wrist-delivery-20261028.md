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
