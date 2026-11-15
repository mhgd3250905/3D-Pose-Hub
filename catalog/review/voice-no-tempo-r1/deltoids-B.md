# deltoids-B 哑铃半程土耳其起立（voice-no-tempo-r1）

- 剂量：3 组 × 3 次；voiceGuide.mode = `reps`，一下 14.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「一步步起来/稳住/原路回去」；去掉 phaseCues steps（每下 7 句步骤口令），改成 1 句要领讲解；引导句 0 → 1 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: steps`（每下念步骤口令，见下）；training.phases 另有绑定 go@phase.start, hold@phase.peak, back@phase.end（steps 模式下不念）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 每下步骤口令（phaseCues steps，已删除）

- 1.5 s：撑到手肘 / Up to your elbow
- 3.4 s：撑手坐起来 / Up to your hand
- 5.3 s：屁股顶起来 / Hips up
- 6.9 s：停住，看哑铃 / Hold, eyes up
- 8.5 s：屁股放下 / Hips down
- 10.3 s：回到手肘 / Back to your elbow
- 12.3 s：躺回去 / Lie back

## 引导句

改前（orig 原文）：

- （无）

改后：

- `r1` 手肘、手掌、屁股一步一步撑稳，眼睛一直看着哑铃 / Elbow, hand, hips, each step solid, eyes on the bell（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：手肘、手掌、屁股一步一步撑稳，眼睛一直看着哑铃
- `g.rem.0` en：Elbow, hand, hips, each step solid, eyes on the bell
- 作废：g.step.0, g.step.1, g.step.2, g.step.3, g.step.4, g.step.5, g.step.6
