# 新版人体本地集成验收（2026-10-21）

用户选择今后使用更新细节后的新版人体，默认原配色、动作肌群高亮，不显示肌群分界线。PR #12 的 `17eab405fee318224ad0617ecd5da7854b66d8e2` 已在本地分支 `codex/adopt-human-v2plus` 与 main 的 `8b87222` 整合；本记录不表示已经合并或推送 main。

## 本地结果

生产配置为 `training-human-v2plus` / `1.0.0-rc2`，compression 训练服与 base 躯干、四肢、手，保留原 v2 头，`skin:'realistic'`，不启用 baked atlas。动作的 highlight groups、side、pulse 保留，选区形状采用新版设计 mask。普通旧 spec 不指定覆盖时保持历史行为；新 HD 批次固定完整生产配方，旧批次不会自动迁移。

修复旧模型先运行时，颈部材质已被 training collar 包装而漏加新版皮肤补丁的问题。新版补丁保留 collar 的程序缓存后缀，并在冻结 collar 切换 hook 后重新连接；不改动旧 collar 源码。200 个原 spec 未改，旧 v2 的 13 个冻结源 SHA-256 全部一致（GLB 按原始字节，文本按 LF 规范化）。

## 验证范围

- `node drill-anim/verify.mjs` 通过：200 个 spec、原哈希及模型固定源。
- `python drill-anim/test_portability.py`：7 项通过。
- `node --test drill-anim/tests/model-profile.test.mjs`：4 项通过。
- `node tools/human-v2plus/test-material-hooks.cjs`：真实 collar/新版脚本的 hook、缓存及重复注入回归通过。
- `python -m unittest discover -s drill-anim/tools/hd -p 'test_*.py' -v`：88 项通过。
- 真实 WebGL 两种启动顺序各 11 次切换通过：白金、蓝、绿、全息、原配色，往返 v2 和 legacy 后重入；无页面、shader 或 context lost 错误。原配色状态 `regions:false`，彩色皮肤的颈部进入 atlas 补丁。
- 正式 `lib/render.mjs` 的 `--model-profile current --frames 0,63 --pr 1` 生成 h-squat 两张关键帧；已看下蹲帧，原配色与目标肌群高亮正常，无分区线。
- 实际 HD prepare 连续两次成功，配方、模型版本、生产配置与源哈希写入 manifest；原姿态、镜头、节奏和高亮保留。
- 目录校验 `python catalog/tools/validate_catalog.py --check-files`：142 条通过，0 警告。`git diff --check` 通过。

真实浏览器回归证据位于主工作区忽略目录 `output/adopt-human-v2plus-20261021/`；正式入口关键帧和 HD 包装清单位于本地集成工作区的 `output/adoption-cli-preview-20261021/`、`output/adoption-hd-final-20261021/`。输出不提交 Git。

此前获认可的多皮肤对比片已另存到 E 盘素材预览归档，使用 PR 原 head 的独立场景规避旧加载顺序问题；不将它冒称为本次源码修复的证据。原配色高亮完整循环预览在主工作区 `output/h-squat-original-look-highlight-20261021/`，同样属于采用前的外观参考。

本次没有全量重渲动作、发布素材 ZIP 或接入 App。每个后续动作仍须预览、看图与完整循环验收，尤其核对道具、支点、手型和主题组合。
