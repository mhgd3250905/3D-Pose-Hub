# hamstrings-B 滑盘腿弯举（voice-no-tempo-r1）

- 剂量：3 组 × 8 次；voiceGuide.mode = `reps`，一下 4.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「脚跟推出/稳住/拉回来」；引导句 2 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「脚跟推出 / 稳住 / 拉回来」（Slide out / Hold / Curl back）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 屁股别掉 / Hips up ——太短，像口令（中文 <5 字或英文 <3 词）
- `r5` 慢慢推出去 / Slide out slowly ——节拍/速度指令词 推出去、慢慢、慢、slow(ly|er)?

改后：

- `r2` 屁股一直抬高，不往下掉 / Hips stay high, no sagging（新写）
- `r5` 脚后跟稳稳往外滑，不滑远 / Heels glide out smoothly, no sliding away（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：屁股一直抬高，不往下掉
- `g.rem.0` en：Hips stay high, no sagging
- `g.rem.1` zh：脚后跟稳稳往外滑，不滑远
- `g.rem.1` en：Heels glide out smoothly, no sliding away
