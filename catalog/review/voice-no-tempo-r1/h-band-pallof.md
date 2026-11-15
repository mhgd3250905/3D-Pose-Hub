# h-band-pallof 弹力带抗旋转推（voice-no-tempo-r1）

- 剂量：3 组 × 10 次；voiceGuide.mode = `reps`，一下 4.0 s
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：去掉相位口令绑定（training.phases 的 phase.* 标记），voiceGuide.phaseCues 改为 none：前 2 下不再念「往前推/稳住/收回」；引导句 3 → 2 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 相位口令（前 2 下念）

- 改前：`phaseCues: first-2-reps`，training.phases 绑定 go@phase.start, hold@phase.peak, back@phase.end → 前 2 下念「往前推 / 稳住 / 收回」（Press out / Hold steady / Back）
- 改后：`phaseCues: none`，training.phases 去掉 `cue` 标记，整组只报数（phases 文字保留在 JSON 里，不再念）

## 引导句

改前（orig 原文）：

- `r2` 身子别被拽过去 / Don't let it pull you ——节拍/速度指令词 过去
- `r5` 肩膀放下，别憋气 / Shoulders down, keep breathing ——节拍/速度指令词 放下
- `r8` 推直停两秒 / Hold it two seconds ——节拍/速度指令词 推直、停两秒、hold

改后：

- `r2` 身子正对前方，不被带子拽偏 / Stay square, don't get pulled over（新写）
- `r6` 肩膀放松，推的时候照样喘气 / Shoulders easy, keep breathing as you press（新写）

- 最后：倒数第 2 下报数后念 `p.last_rep`「最后一次」（报数类，保留）

## 发布时要重合成的语音

- `g.rem.0` zh：身子正对前方，不被带子拽偏
- `g.rem.0` en：Stay square, don't get pulled over
- `g.rem.1` zh：肩膀放松，推的时候照样喘气
- `g.rem.1` en：Shoulders easy, keep breathing as you press
- 作废：g.rem.2
