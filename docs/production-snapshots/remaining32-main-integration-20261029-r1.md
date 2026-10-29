# 人体关节优化与第一批32模板：main集成记录

2026-10-29，用户明确授权保存本轮建模、手腕/脚踝/大臂/肘部优化和第一批32动作模板，合入main、整理台账并push；随后在main整理剩余动作的制作经验交接。本次授权不将候选状态改写为用户逐项验收。

## 集成来源与工作区

- 原main：`b29762331c2958529b45dc71cbac5622e0ff786d`。
- 集成分支：`codex/action-inventory-20261028`，来源提交 `95fe7fa`；含模型/模板快照 `7613e53`、32项候选 `1ac02ec`、四项肘部接入 `77a5b3f` 及剩余28项快速扫查记录。
- main工作区：`E:/AII-3D/3D-Pose-Hub-worktrees/pr15-audit-20261023`。采取保留双亲的merge；没有重置、清理或覆盖原分支。
- 主目录 `E:/AII-3D/3D-Pose-Hub` 仍有旧生产分支的独立发布工具WIP，未切换该目录或纳入这些文件。开始时的分支、HEAD、status和8项文件哈希单独保存。
- 冲突仅涉及 `.gitattributes`、台账及两份旧手腕交付文档；保留main已交付的手腕记录，追加本轮记录。

## 当前可复用入口

当前32配方为 [remaining32-r4](../../catalog/production/remaining32-r4/README.md)，冻结候选为 [finalization-r2](../../catalog/production/versions/remaining32-template-finalization-20261029-r2.json)。按配方显式选用 `training-human-v3-armfix/0.1.0-r2`、对应手型及关节组件；不更改全局 `current-production.json` 的v2plus rc2默认。

32项低清循环、7772个30Hz实际姿态样本和原61项伸直约束等已有证据保留。四项肘部追加修正仅补现有DQS，骨点/支撑和镜头不变；其余28项快速筛查72项图片引用后没有新增修正。候选保持 `userReviewed:false`、`releaseEligible:false`；正式高清生产和公开素材发布尚未进行。

验收页：`http://127.0.0.1:8845/?revision=elbow-r2`。预览、母帧及历史试版仍在 `F:/PoseHub-v2-production/template-finalization-20261029/`，不提交媒体进Git。

## main集成验证与可复现性

`node drill-anim/verify.mjs`：441规格通过；`python -B drill-anim/test_portability.py`：7/7；关节、固定腕组合、指姿、配方及实际采样相关6个测试文件：37/37。目录表按441规格重新生成，`node drill-anim/tools/catalog.mjs --check`通过。合并后的暂存区 `git diff --cached --check`通过。

冻结快照的473项来源原始SHA全部在main工作区匹配。迁移发现82项仅因Windows换行转换与捕获原字节不同，已恢复同一来源字节并增加精确文件属性规则；另外补入被 `drill-anim/.gitignore` 的通用 `config.json` 规则误忽略的 `models/fixed-band-handles-r1/config.json`。该文件仅包含公开手柄几何参数，不含机器配置或凭据，已增加单文件忽略例外。没有重新生成GPU证据。

这里的473项原始SHA指已核对的Windows工作区字节。另查Git对象：199项沿用原仓库文本规范化，Git保存LF、原捕获为CRLF，规范化后内容全部一致；没有为历史捕获哈希大规模改写这些旧Git对象。跨平台复现应分别验证配方的LF哈希和捕获的原始来源清单；需要逐字节重放旧证据时使用既有源码归档，不将不同换行的Git检出冒称原捕获原始字节。新捕获重新绑定其实际来源哈希。

早期冻结试版仍保留其空白和换行，精确路径属性允许这些历史字节；未批量格式化冻结源、改写快照或更换其哈希。新增文档与工具仍执行常规空白检查。

## 回执与后续

本轮精确merge提交、远端回读、主目录WIP复核及检查回执保存在 `F:/PoseHub-v2-production/version-snapshots/remaining32-main-integration-20261029-r1/`。Git源码集成与视觉验收分别记录，旧快照内“尚未合入”的文字保留为当时事实，以本记录及包含它的merge为后续Git状态依据。

下一步是为剩余219个稳定动作逐项适配和审阅可复用模板；第一批32不重复派发。动态范围251=本批32+剩余219，自测静图、停止项、仅有名称的规划不混入。下轮执行手册和机器队列在merge完成后单独记录。
