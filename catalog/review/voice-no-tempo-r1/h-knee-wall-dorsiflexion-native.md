# h-knee-wall-dorsiflexion-native 膝盖碰墙脚踝活动（voice-no-tempo-r1）

- 剂量：2 组 × 10 次；voiceGuide.mode = `reps`，一下 3.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「膝盖往前/碰墙停住/慢慢退回」；引导句 3 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「膝盖往前 / 碰墙停住 / 慢慢退回」（Knee forward / Touch and hold / Ease back）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 脚后跟踩住 / Heel stays down ——节拍/速度指令词 踩住
- `r5` 膝盖朝第二个脚趾 / Knee over your second toe
- `r8` 碰到墙停一下 / Touch and hold ——节拍/速度指令词 停一下、hold

改后：

- `r2` 前脚后跟一直贴地 / Front heel stays planted（新写）
- `r5` 膝盖朝第二个脚趾 / Knee over your second toe（保留）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：前脚后跟一直贴地
- `g.rem.0` en：Front heel stays planted
- 作废：g.rem.2
