# 动作包核对 r3 · 总台账

（本文件由 `LEDGER.head.md` + 各动作 JSON 的 `review.r3.audit` 生成；进度见 `PROGRESS.md`。）

## 黑名单词全量扫描（2026-11-13，249 个 v3-text 文件，扫 name/purpose/cues/commonErrors/cautions/phases/voiceGuide 中文）

| 词 | 出现次数 | 文件数 | 处理 |
|---|---|---|---|
| 弹震、代偿、激活、中立位、离心、向心、等长、髋铰链、募集、稳定性、核心收紧、收紧核心、姿态、下肢、上肢 | 0 | 0 | r2 已清掉；列入报错黑名单防回潮 |
| 脊柱 | 1 | 1（o-seated-catcow） | 报错（r3 改过的动作） |
| 躯干 | 1 | 1（h-forearm-plank） | 报错（r3 改过的动作） |
| 幅度 | 84 | 79 | 警告：多数可换「能到哪儿到哪儿」「转大一点/小一点」 |
| 髋部 | 61 | 48 | 警告：换「胯」「屁股」 |
| 骨盆 | 52 | 28 | 警告：换「胯骨」「两边胯一样高」 |
| 控制 | 49 | 44 | 警告：换「慢慢」「别甩」 |
| 稳定 | 12 | 12 | 警告：换「站稳」「别晃」 |
| 均匀 | 8 | 8 | 警告：换「正常喘气」 |
| 核心 | 5 | 5 | 警告：换「肚子绷住」 |
| 感受 | 1 | 1 | 警告 |

英文：glute 76、control 50、squeeze 47、pelvis 12、core 8、tension 7、stabil 3、brace 2、spine 1、posture 1；maintain/engage/ensure/neutral/activate 为 0。glute、squeeze 属健身房常用口语，不拦；control/core/stabil 警告。

`text.py`：报错词对 `ai-reviewed-r3-needs-user-review` 的动作生效（未改的旧稿只警告，避免整库校验在批次之间失败）；警告词计数在输出 `weakWords`，`--weak` 列出明细。

## 规则

`catalog/production/v3-text/STYLE.md` §5–§9（r3：真实节奏 §6、换边准备 §6、难度同步 §5b、voiceGuide §8、教练口吻 §9）。单个记录见同目录 `<id>.md`；JSON 内 `review.r3`。校验：`python3 tools/action-package-v3/text.py`、`python3 tools/ai-tags/validate.py`。
