# 身体 v3 r7 独立合入与验收标记

2026-10-28（Asia/Shanghai），按开哥网页看样后的合入授权，以及“先拆出身体 v3 及必要依赖再合入，旧动作候选留在原 PR”的选择，身体 r7 已通过独立集成分支合入本地 main。交付采用直接推送 main、独立分支和注释 tag 的方式；远端状态以这些固定 Git 对象的回读为准。

## Git 身份

| 对象 | 固定提交或标记 |
| --- | --- |
| main 合入前 | `1fdd117d8e29bb0efcc8c57cb23dc1d9dc7422dd` |
| 已审核模型来源 | `d448b0b22a4f41285ba52b9cfd43d7bfad7750af`，原 `feat/body-v3` 保留 |
| 独立集成提交 | `5be7c414c75c4fb5c027ee58d353e16aa8de5b48` |
| main 合并提交 | `b9a3567dd625c570b88d792fd45ec6f69ab9cd50`，树与上述集成提交完全一致 |
| 集成分支 | `codex/body-v3-only-r7-20261028`；随后仅补充本份合入记录和台账 |
| 验收注释 tag | `body-v3-r7-accepted-20261028` → `5be7c414c75c4fb5c027ee58d353e16aa8de5b48` |
| tag 对象 SHA | `f8d186ddfc8cd2d808f85183dcc555bdab79382a` |

该 tag 标记本轮身体模型看样确认与独立源码快照，不发布素材、SDK 或 App 版本。看样依据见 [r2 确认记录](review-approval-20261028-r2.md)。原 [PR #24](https://github.com/mhgd3250905/3D-Pose-Hub/pull/24) 保留 open/draft，不整体合并，不删除原分支；在其说明中登记身体部分的独立合入结果。PR #17–#22 及其分支不执行写操作。

## 合入内容与排除项

规范入口为 `drill-anim/models/training-human-v3-completed-r7/loader.mjs`，身份 `training-human-v3-completed / 1.0.0-r7`，manifest 的 LF 规范化 SHA-256 保持 `676a19e7b4185848ce2570c66a996ba4f967305a03feafe45e4c69b36c7a7fb6`。

从原来源固定 Git blob 选择性复制了 200 个身体文件，逐文件 Git blob 比较全部一致；没有复用原分支的祖先提交。独立集成提交共 205 个路径（204 新增、1 修改），唯一改动的 main 既有文件是当前版本台账；其余新增为冻结身体资源、修复证据、复现工具、独立预览及验收记录。随后文档补记不改变模型、动作或验证结论。

`drill-anim/specs/`、`home-pr-candidates.json`、`docs/drill-catalog.md`、`native-open-r1/loader.mjs`、`catalog/`、`media/`、`current-production.json` 和原 coach/anatomy 源保持 main 原值。237 个旧动作候选留在原 PR，既未随本次进入 main，也不因身体看样成为已审核或可发布。只保留 r7 实际需要的 c1r2、r8 手部与 r5 手腕运行时，不引入无关手部候选。

## 验证与复现

- `node drill-anim/verify.mjs`：退出 0，冻结源哈希保持。
- `python drill-anim/test_portability.py`：7 tests，OK。
- `node drill-anim/tools/catalog.mjs --check`：up to date。
- r7 递归验签和六项髋膝 CPU 检查通过；独立复核确认 200 个暂存 Git blob 与原来源相同，未包含排除路径，文档相对链接无缺失。
- 独立工作区新渲染 t=1/3/5 的 18 个髋膝视图，全部与原 r7 交付预览 RGB 一致，页面错误为 0。内存深蹲夹具与原 r3 的完整结构、精确 JSON 比较均通过；没有新增动作 spec。

源文件列表、哈希和预览比较摘要见 [独立集成证据](evidence/isolated-r7-integration-r1.json)。原冻结源码中的四处既有尾空白保留；新增文档和夹具的 whitespace 检查通过，没有为格式清理改写冻结源。

按项目原说明准备本机忽略的 `drill-anim/config.json`、依赖和 Vite，再执行：

```sh
node tools/body-v3/completed-v3-r1/preview-isolated-r7-r1.mjs <new-output-dir> --case squat --frames 1,3,5
```

新预览脚本保留原机位，从 main 现有 r2 在内存生成等值夹具。旧文档和历史诊断脚本仍可能引用原 PR 的候选；复现独立版本使用此入口，不为运行历史脚本导入那批动作。

## 后续范围

本轮完成七项身体修复和列出的看样、采样验证，仍保留 [P4 说明](p4-repair-r1.md) 中的自然膝窝接触、旧指标和局部交线，以及 P1 开放边等限制。没有逐项迁移或验收 241 个动作，没有进行动作重定向、设备或公开素材发布验收；可选整身 `flare-coach-v3.glb` 尚未烘焙。全局生产默认仍为 `training-human-v2plus / 1.0.0-rc2`。
