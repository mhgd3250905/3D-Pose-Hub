# hip-abductors-C 坐姿器械开腿（voice-no-tempo-r1）

- 剂量：3 组 × 12 次；voiceGuide.mode = `reps`，一下 4.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「推开/停住/收回」；引导句 3 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「推开 / 停住 / 收回」（Push out / Hold / Return）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 身子别晃 / Body still ——太短，像口令（中文 <5 字或英文 <3 词）
- `r5` 慢慢收回 / Return slowly ——节拍/速度指令词 收回、慢慢、慢、slow(ly|er)?；太短，像口令（中文 <5 字或英文 <3 词）
- `r8` 最开停 1 秒 / Pause at the widest ——节拍/速度指令词 停\s*\d、\d\s*秒、pause

改后：

- `r2` 背靠稳椅背，身子不前后晃 / Back on the pad, no rocking（新写）
- `r6` 合腿时重量不砸 / Don't let the stack crash（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：背靠稳椅背，身子不前后晃
- `g.rem.0` en：Back on the pad, no rocking
- `g.rem.1` zh：合腿时重量不砸
- `g.rem.1` en：Don't let the stack crash
- 作废：g.rem.2
