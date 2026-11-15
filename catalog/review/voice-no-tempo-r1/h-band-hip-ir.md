# h-band-hip-ir 坐姿弹力带脚向外摆（voice-no-tempo-r1）

- 剂量：3 组 × 12 次；voiceGuide.mode = `reps`，一下 3.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「往外摆/停一下/收回」；引导句 3 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「往外摆 / 停一下 / 收回」（Swing out / Pause / Return）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 膝盖别跑 / Knee stays still ——太短，像口令（中文 <5 字或英文 <3 词）
- `r5` 身子别歪 / Sit tall ——太短，像口令（中文 <5 字或英文 <3 词）
- `r8` 小腿慢慢摆回来 / Shin back in slowly ——节拍/速度指令词 回来、摆回、慢慢、慢、slow(ly|er)?、back (up|down|in|out|to)

改后：

- `r2` 膝盖不动，脚往外摆 / Knee still, foot swings out（新写）
- `r6` 坐正，身子不歪 / Sit square, no leaning（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：膝盖不动，脚往外摆
- `g.rem.0` en：Knee still, foot swings out
- `g.rem.1` zh：坐正，身子不歪
- `g.rem.1` en：Sit square, no leaning
- 作废：g.rem.2
