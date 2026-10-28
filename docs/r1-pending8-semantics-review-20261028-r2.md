# R1 待补训练说明提案：来源修订 r2

2026-10-28，按开哥“保留与身体无关的优化，淘汰被 r7 取代的旧身体适配”的授权，接纳 PR #17 的训练说明提案和 PR #20 的历史漏收审计作为后续审核材料。合入提案不批准其中尚待确认的新词表、借用剂量、毛巾类器械或动作收录，不修改正式 catalog、taxonomy、媒体、SDK 或发布状态。

当前机器可读入口为 [proposal-r2.json](../catalog/test/r1-pending8-semantics-proposal-r2.json)，原 [2026-10-26 清单](r1-pending8-semantics-review-20261026.md)及原 JSON 保留历史身份。

本次校正一处来源：`h-bilateral-farmer-hold-native` 原 `spec.commit` 无法从仓库解析，实际生产文件来自 `112be51d626f7070ff9e88edb0986d7f3d596674`；其 LF 规范化 SHA-256 仍为原登记的 `23edaff77f278333d4a73dcbd0855781b76ee03f237b05a81d5505ff51048114`。北欧离心、低位穿针、毛巾弯举及墙面掌根诊断的原登记采用 Windows CRLF 原始哈希，r2 明确统一为 LF 规范化哈希；四项原哈希均能由相同 Git blob 转换 CRLF 重现，没有动作内容差异。八项来源和修订后的哈希逐项匹配，旧元数据随 `sourceCorrections` 保留。提议内容、八项分类及 `proposal-unreviewed` 状态不变。

PR #20 的 [旧库审计](old-library-audit-20261026.md)按其编制时的 219 目录和旧素材记录解读；补收建议不等于本次已经增加动作，也不要求用旧人体重做。后续若决定制作，应使用当时获准的模型及制作配方。
