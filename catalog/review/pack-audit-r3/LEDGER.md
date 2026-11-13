# 动作包核对 r3 · 总台账

样例 5 个（2026-11-13，覆盖 hold / 单侧 hold / rep_alternate / rep_updown / rep_cycle），给开哥定标准；其余动作未动。

规则：`catalog/production/v3-text/STYLE.md` §5–§8；单个记录见同目录 `<id>.md`；JSON 内 `review.r3`。校验：`python3 tools/action-package-v3/text.py`（含 voiceGuide 检查）、`python3 tools/ai-tags/validate.py`。

| id | 类型 | 剂量 改前 → 改后 | 节奏调整 | voiceGuide | 画面对照 | 状态 |
|---|---|---|---|---|---|---|
| s-pigeon | hold | 2 组×每侧45 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | —（计时） | 是 | 一致，无极端错误 | ai-reviewed-r3-needs-user-review |
| abs-A | hold | 3 组×20 秒，休息 45 秒 → 3 组×20 秒，休息 45 秒 | —（计时） | 是 | 一致，无极端错误 | ai-reviewed-r3-needs-user-review |
| h-forward-lunge | rep_alternate | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 60 秒 | 否（一下 10.0 s） | 是 | 一致，无极端错误 | ai-reviewed-r3-needs-user-review |
| chest-B | rep_updown | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 否（一下 4.0 s） | 是 | 一致，无极端错误 | ai-reviewed-r3-needs-user-review |
| h-hip-gate | rep_cycle | 2 组×每侧6 次，休息 20 秒 → 2 组×每侧6 次，休息 20 秒 | 否（一下 4.0 s） | 是 | 一致，无极端错误 | ai-reviewed-r3-needs-user-review |

附带改动：`tools/action-package-v3/text.py` 接受 `ai-reviewed-r3-needs-user-review`，新增可选 voiceGuide 校验（出处存在、念得完、空白 ≤10 s / ≤3 下、末尾倒数或「最后一次」）；5 个动作的 `catalog/ai-tags/actions/<id>.json` 只更新 `source.textSha256Lf`（标签已对照新文字复核，内容不受影响）。
