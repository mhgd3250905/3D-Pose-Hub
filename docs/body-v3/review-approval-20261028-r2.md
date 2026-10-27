# 身体 v3 r7 网页看样与独立集成范围确认

2026-10-28（Asia/Shanghai），开哥在本机审核网页查看 r7 后回复“我看到了 可以了 我觉得差不多了”，随后要求“我觉得可以合并了 你做好标记做好记录”。这项确认接受本轮网页看样，并授权推进身体 v3 修复合入。

合并审计发现原 [PR #24](https://github.com/mhgd3250905/3D-Pose-Hub/pull/24) 的祖先包含 PR #22 的 237 个未审动作 spec 及相关候选登记。开哥明确选择“先拆出身体 v3 及必要依赖再合入，旧动作候选留在原 PR”。因此本次在从 main `1fdd117d8e29bb0efcc8c57cb23dc1d9dc7422dd` 建立的 `codex/body-v3-only-r7-20261028` 上准备独立集成，不直接合并原 PR #24。原 PR 保留；其旧动作候选不因本次身体看样获得通过，也不操作 PR #17–#22 及其分支。

## 确认对象与范围

| 项目 | 固定身份或依据 |
| --- | --- |
| 规范入口 | [`training-human-v3-completed-r7/loader.mjs`](../../drill-anim/models/training-human-v3-completed-r7/loader.mjs) |
| 模型身份 | `training-human-v3-completed / 1.0.0-r7` |
| 网页看样源码提交 | `d448b0b22a4f41285ba52b9cfd43d7bfad7750af` |
| manifest 的 LF 规范化 SHA-256 | `676a19e7b4185848ce2570c66a996ba4f967305a03feafe45e4c69b36c7a7fb6` |
| 修复与采样证据 | [P4 与七项组合入口](p4-repair-r1.md)、[采样证据](evidence/p4-r7-sampled-r1.json)、[P1/P2/P3/L1/L2 组合](completed-repairs-r1.md)、[肩部修复](shoulder-repair-r1.md) |
| 计划标记 | `body-v3-r7-accepted-20261028`；本记录编写时尚未创建 |

七项必做修复 P1–P5、L1 和 L2 已完成本轮列出的采样复核，并获上述网页看样确认。冻结 manifest 中编制时的 pending/unreviewed 字样和原 SHA 保留，由本记录补充后续决定，不改写冻结文件。

确认以现有运行后 v3 的 52 根骨、其中 30 根指骨为基准。P1 沿用已确认的三角面、多方向与四姿态外观联合方法，开放边和旧最近点指标的限制仍适用。P4 按已确认的可见碎带目标修复，保留膝窝自然接触、旧 p5/FCL 和约 3.48 mm 局部交线，不宣称全身零碰撞。

本次未逐帧验收全部 241 个动作，也未完成动作重定向或全库 v3 迁移；可选整身 GLB 尚未烘焙。媒体、catalog、SDK 和全局生产默认配方不因本次确认升级；当前生产默认仍为 `training-human-v2plus / 1.0.0-rc2`。

## 交付状态

本文件记录网页看样与用户选择的独立集成范围，不是合并成功或 tag 创建回执。编写时独立集成仍在准备；最终提交、验证、合入 SHA、标记和远端回执由后续实际集成记录与 Git 历史确认。

独立检出已通过 r7 递归清单验签、六项髋膝 CPU 检查、`node drill-anim/verify.mjs`、7 项 portability 和 `catalog --check`。从该检出新渲染的最深、平行、半蹲 18 个髋膝视图，与原 r7 交付预览的 RGB 像素全部一致，页面错误为 0。该对照确认拆分没有改变这些画面；原采样范围和限制仍适用。

本轮没有添加或修改 `drill-anim/specs/`。深蹲预览在内存中从 main 已有的 `a-deep-squat-r2.js` 构造与旧 r3 完全相同的对象，完整结构和 JSON 比较通过；动作候选表及 `native-open-r1` loader 保持 main 的版本。旧修复文档中的原预览命令保留历史身份，独立检出请使用下面的新入口，不能为运行旧命令引入 237 个候选。

```sh
node tools/body-v3/completed-v3-r1/preview-isolated-r7-r1.mjs <new-output-dir> --case squat --frames 1,3,5
```

预览仍按原项目说明配置本机忽略的 `drill-anim/config.json` 和 Vite；配置不进 Git。新增来源文件及哈希见[独立集成证据](evidence/isolated-r7-integration-r1.json)。
