# h-chair-single-leg-hip-thrust 肩靠椅单腿臀推（voice-no-tempo-r1）

- 剂量：3 组 × 10 次；voiceGuide.mode = `reps`，一下 3.5 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「顶起来/夹屁股/慢慢放」；引导句 3 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「顶起来 / 夹屁股 / 慢慢放」（Hips up / Squeeze / Lower slowly）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 抬腿那边别往下掉 / Lifted side doesn't drop
- `r5` 用屁股顶，别拱腰 / Butt, not back
- `r8` 踩地那只脚蹬实 / Drive through your foot

改后：

- `r2` 抬腿那边别往下掉 / Lifted side doesn't drop（保留）
- `r5` 用屁股顶，别拱腰 / Butt, not back（保留）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- 作废：g.rem.2
