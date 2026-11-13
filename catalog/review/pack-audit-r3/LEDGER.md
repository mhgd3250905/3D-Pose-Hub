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

## 台账（5/249）

| id | 类型 | 剂量 改前 → 改后 | 一下 改前 → 改后 | 难度 v3/ai → 统一 | 文字 | 画面对照 | 极端 |
|---|---|---|---|---|---|---|---|
| abs-A | hold | 3 组×20 秒，休息 45 秒 → 3 组×20 秒，休息 45 秒 | 计时 → 计时 | 1/3 → 2 | 口吻改写 | 一致：仰卧、手臂过头、双腿并拢伸直抬起、腹部高亮、垫子 |  |
| chest-B | rep_updown | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 4.0 s → 3.5 s | 2/3 → 3 | 口吻改写 | 一致：平行杆、俯卧撑、胸部高亮 |  |
| h-forward-lunge | rep_alternate | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 60 秒 | 5.0 s/侧（一左一右 10.0 s） → 3.5 s/侧（一左一右 7.0 s） | 2/2 → 2 | 口吻改写 | 一致：站姿弓步、无器械、大腿前侧+臀部高亮 |  |
| h-hip-gate | rep_cycle | 2 组×每侧6 次，休息 20 秒 → 2 组×每侧6 次，休息 20 秒 | 4.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 一致：扶椅站姿、髋前侧/外侧高亮、椅子 |  |
| s-pigeon | hold | 2 组×每侧45 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 2/3 → 2 | 口吻改写 | 一致：鸽子式、双手扶两块瑜伽砖、前侧胯下有垫；高亮只在前腿臀部（purpose 还写后腿大腿根前面），非极端 |  |

## 极端错误（画面与文字牛头不对马嘴）

- 暂无
