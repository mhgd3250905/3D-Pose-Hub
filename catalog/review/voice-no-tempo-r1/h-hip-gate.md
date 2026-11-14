# h-hip-gate 扶椅站姿开髋门（voice-no-tempo-r1）

- 剂量：2 组 × 6 次；voiceGuide.mode = `reps`，一下 5.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「抬膝/画圈/放下」

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「抬膝 / 画圈 / 放下」（Knee up / Circle / Lower）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 胸口朝前，别跟着转 / Chest faces forward

改后：

- `r2` 胸口朝前，别跟着转 / Chest faces forward（保留）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）
