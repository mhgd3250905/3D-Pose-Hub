# 全量 249 动作 v3 源码主线集成

## 授权与来源

2026-11-03，用户明确同意把最新动作源码合入并推送 main，随后说明另一聊天正负责渲染，要求保留其工作。此次仅执行 Git 整合与必要修复、验证，不操作该渲染聊天、进程或原运行输出。

| 对象 | 固定身份 |
| --- | --- |
| 原 main | `c1bea90d7380857ee0bf3dfc1a8b0f28fa7552cd` |
| 来源分支 | `codex/remaining219-templates` |
| 来源提交 | `9b67e5d7cf2748139a828dc74bf57737dc0bcbb7` |
| 共同祖先 | `8dac33dc8f26636ae500872d9d7315458591d535` |
| 整合工作副本 | `E:/AII-3D/3D-Pose-Hub-worktrees/integrate-remaining249-20261103` |

在原 main 上执行三方合并，保留来源分支的 121 项后续提交和主线独有的 10 月 29 日文档收束。合并无冲突；本记录随整合提交保存，确切合入 SHA 由 Git 历史确定。

## 本次纳入范围

- `remaining219-r1/recipes` 的 217 项加 `remaining32-r4/groups` 的 32 项，共 249 个唯一稳定 ID；249 份 v3 文案 r2 与它们逐项对应。
- 原 251 项中的 `scapular-C`、`h-sleeper-stretch` 沿用户已记录的停止决定排除，不加入生产清单。
- v3 配方场景、分层透明母版、五套皮肤、完整循环固定取景、派生视频与关键帧、双语定义和语音、生产检查及本机交接工具。

249 份文案继续保持 `ai-reviewed-r2-needs-user-review`。已有来源中的有限关键帧及局部用户确认沿其原范围保留，不自动扩展为全库完整循环、人工内容审核或发布通过。

## 合入前必要修复

1. 补齐 29 个新增规格的 LF 规范化 SHA-256 登记，登记来源与候选身份，不把完整性登记写成用户验收。
2. `rotator-cuff-B-r2.js` 恢复原 main 字节；来源分支对粉色泡沫块的修改另存 r3，并将当前生产配方迁到新修订及其哈希。保留动作轨迹与视觉参数，冻结来源队列、源码包和历史批次不改写。
3. 生产工具续跑检查实际技术状态，不以 `action.json` 存在就把语音失败项计作完成；缺文案或语音审计失败返回非零退出码。回归使用临时目录和模拟依赖，不渲染、不调用 TTS、不改已有成片。

## 验证

以下检查在独立整合副本执行，均通过。验证限定为源码、CPU 合同和续跑状态，不启动浏览器、渲染或 TTS。

| 检查 | 结果 |
| --- | --- |
| `node drill-anim/verify.mjs` | 520 份规格通过；`originalSpecHashesPreserved:true` |
| `python -B drill-anim/test_portability.py` | 7/7；本副本使用从 Windows 示例生成的忽略配置，未复制渲染工作区配置 |
| `node drill-anim/tools/catalog.mjs --check` | 520 份规格目录保持最新 |
| `python -B tools/action-package-v3/text.py` | 249 份文案结构与训练节奏字段通过，未提升人工审核状态 |
| `python -B tools/action-package-v3/test_produce.py` | 8/8；语音失败续跑、损坏清单、正常完成、render-only 和已有文件不覆盖 |
| 下列 Node 回归命令 | 23/23 |
| 对 217+32 配方逐项调用 `prepareRecipe` / `validateSetup` | 249 唯一 ID；规格哈希及安装合同全部通过 |
| Python AST / `node --check` | 7 个 Python 文件、9 个 JavaScript 模块语法通过 |
| r2 原字节与 r3 导出对象比较 | 旧 r2 与 main 相同；r3 仅归一修订 ID 后与来源泡沫块版完全相同 |
| `git diff --check` / 暂存区同项检查 | 无空白错误 |

```text
node --test tools/action-completion-v3-r2/render.test.mjs tools/action-completion-v3-r2/remote-keyframes-r1.test.mjs tools/action-completion-v3-r2/fixed-bar-grip-r1.test.mjs tools/action-completion-v3-r2/remote-rotation-r1.test.mjs tools/action-completion-v3-r2/kettlebell-grip.test.mjs
```

## 版本与并行制作边界

本次保存的是源码和生产工具。全局 `current-production.json` 仍为 `training-human-v2plus / 1.0.0-rc2`，本批显式配方使用 armfix-r2；兼容 catalog 仍为 0.3.0，已发布 media 仍为 0.2.0。未创建媒体发布、App/SDK 升级或新 tag。

原 `E:/AII-3D/3D-Pose-Hub` 的旧生产分支与既有 WIP、`remaining219` 渲染工作副本和 `F:/PoseHub-v3/runs/2026-11-02_v3r2_9b67e5d/` 均保留。正在制作的批次继续绑定其原提交；本次整合不要求它拉取主线、切换配方或重新启动。已有输出不因源码合并而获得新的验收状态。
