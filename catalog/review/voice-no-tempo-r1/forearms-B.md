# forearms-B 坐姿哑铃上下卷腕（voice-no-tempo-r1）

- 剂量：3 组 × 15 次；voiceGuide.mode = `reps`，一下 3.5 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「往上卷/停一下/慢慢放」；引导句 4 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「往上卷 / 停一下 / 慢慢放」（Curl up / Pause / Lower slowly）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 前臂别抬，只动手腕 / Only the wrist moves
- `r5` 慢慢放到底 / All the way down, slowly ——节拍/速度指令词 慢慢、到底、慢、slow(ly|er)?、all the way (up|down)
- `r8` 别甩 / No swinging ——太短，像口令（中文 <5 字或英文 <3 词）
- `r11` 前臂别抬，只动手腕 / Only the wrist moves

改后：

- `r2` 前臂别抬，只动手腕 / Only the wrist moves（保留）
- `r8` 手腕往下卷到最低 / Full range at the wrist（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.1` zh：手腕往下卷到最低
- `g.rem.1` en：Full range at the wrist
- 作废：g.rem.2, g.rem.3
