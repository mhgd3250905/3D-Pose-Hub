# g-cable-hip-abduction 低位绳索髋外展（voice-no-tempo-r1）

- 剂量：3 组 × 12 次；voiceGuide.mode = `reps`，一下 3.5 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「往外抬/停一下/放回来」；引导句 3 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「往外抬 / 停一下 / 放回来」（Lift out / Pause / Bring back）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 上身别歪 / Stay tall ——太短，像口令（中文 <5 字或英文 <3 词）
- `r5` 别让绳子拽回去 / Don't let it yank you back ——节拍/速度指令词 回去
- `r8` 别甩，慢一点 / Slow, no swinging ——节拍/速度指令词 慢一点、慢、slow(ly|er)?

改后：

- `r2` 上身立直，只有腿往外抬 / Torso tall, only the leg lifts（新写）
- `r6` 合腿时别让绳子拽 / Don't let the cable win（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：上身立直，只有腿往外抬
- `g.rem.0` en：Torso tall, only the leg lifts
- `g.rem.1` zh：合腿时别让绳子拽
- `g.rem.1` en：Don't let the cable win
- 作废：g.rem.2
