# h-db-calf-raise 双哑铃站姿提踵（voice-no-tempo-r1）

- 剂量：3 组 × 12 次；voiceGuide.mode = `reps`，一下 3.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「踮起来/停一下/慢慢放」；引导句 3 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「踮起来 / 停一下 / 慢慢放」（Heels up / Pause / Lower slowly）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 哑铃垂直，人别晃 / Weights still, body still
- `r5` 人站直，别晃 / Stand tall, no swaying
- `r8` 踮到最高 / All the way up ——节拍/速度指令词 all the way (up|down)；太短，像口令（中文 <5 字或英文 <3 词）

改后：

- `r2` 哑铃垂直，人别晃 / Weights still, body still（保留）
- `r5` 人站直，别晃 / Stand tall, no swaying（保留）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- 作废：g.rem.2
