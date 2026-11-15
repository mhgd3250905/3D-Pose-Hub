# rotator-cuff-A 俯撑交替触肩（voice-no-tempo-r1）

- 剂量：3 组 × 8 次；voiceGuide.mode = `reps`，一下 4.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「摸肩/停/放回」；引导句 2 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「摸肩 / 停 / 放回」（Tap / Hold / Hand down）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 屁股别晃 / Hips still ——太短，像口令（中文 <5 字或英文 <3 词）
- `r5` 慢一点 / Slower ——节拍/速度指令词 慢一点、慢、slow(ly|er)?；太短，像口令（中文 <5 字或英文 <3 词）

改后：

- `r2` 摸肩时屁股不晃 / Hips stay still on each touch（新写）
- `r5` 撑地那边肩膀不往下塌 / Support shoulder doesn't sink（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：摸肩时屁股不晃
- `g.rem.0` en：Hips stay still on each touch
- `g.rem.1` zh：撑地那边肩膀不往下塌
- `g.rem.1` en：Support shoulder doesn't sink
