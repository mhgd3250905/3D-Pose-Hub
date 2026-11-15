# t-seated-straddle-ext 分腿坐收腿伸腿（voice-no-tempo-r1）

- 剂量：3 组 × 8 次；voiceGuide.mode = `reps`，一下 2.5 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「伸直/停/收回」；引导句 2 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「伸直 / 停 / 收回」（Straighten / Hold / Bend in）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 别往后仰 / Don't lean back ——太短，像口令（中文 <5 字或英文 <3 词）
- `r5` 脚别落地 / Feet up ——太短，像口令（中文 <5 字或英文 <3 词）

改后：

- `r2` 胸口朝前坐着 / Chest facing forward（新写）
- `r5` 两脚不碰地 / Feet stay up（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：胸口朝前坐着
- `g.rem.0` en：Chest facing forward
- `g.rem.1` zh：两脚不碰地
- `g.rem.1` en：Feet stay up
